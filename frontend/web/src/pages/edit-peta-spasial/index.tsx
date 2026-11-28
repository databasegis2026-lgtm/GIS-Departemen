import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PageMeta } from "@/components/shared/page-meta";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  FloppyDiscIcon,
  XIcon,
} from "@/icons";
import {
  getKondisiOptionsByAktivitas,
  getStatusHexColor,
  getEstatePolygons,
  type EstatePolygonItem,
} from "../data-operasional/mock-operasional";
import { printPetaKartografi } from "../data-operasional/print-operasional";
import { supabase } from "@/lib/supabase";
import * as turf from "@turf/turf";

/**
 * Memperpanjang garis potong di kedua ujungnya secara matematis (Vector Auto-Extend)
 * agar pasti menembus tepi poligon target sekalipun titik ditaruh persis di tepi poligon.
 */
function extendLineString(
  points: [number, number][],
  extendRatio = 0.5,
  minExtendDeg = 0.015
): [number, number][] {
  if (!points || points.length < 2) return points;

  // 1. Perpanjang titik awal (P0) ke arah luar menjauhi P1
  const p0 = points[0];
  const p1 = points[1];
  const dx0 = p0[0] - p1[0];
  const dy0 = p0[1] - p1[1];
  const len0 = Math.sqrt(dx0 * dx0 + dy0 * dy0) || 1e-6;
  const ext0 = Math.max(len0 * extendRatio, minExtendDeg);
  const newP0: [number, number] = [p0[0] + (dx0 / len0) * ext0, p0[1] + (dy0 / len0) * ext0];

  // 2. Perpanjang titik akhir (Pn) ke arah luar menjauhi P(n-1)
  const pn = points[points.length - 1];
  const pnPrev = points[points.length - 2];
  const dxn = pn[0] - pnPrev[0];
  const dyn = pn[1] - pnPrev[1];
  const lenn = Math.sqrt(dxn * dxn + dyn * dyn) || 1e-6;
  const extN = Math.max(lenn * extendRatio, minExtendDeg);
  const newPn: [number, number] = [pn[0] + (dxn / lenn) * extN, pn[1] + (dyn / lenn) * extN];

  return [newP0, ...points.slice(1, -1), newPn];
}

export interface PendingSplitZone {
  id: string;
  name: string;
  areaHa: number;
  kondisi: string;
  coords: [number, number][];
}

// Tipe Titik TPH (Tempat Pengumpulan Hasil)
interface TPHPoint {
  id: string;
  name: string;
  coords: [number, number];
  keterangan: string;
}

const INITIAL_TPH_LIST: TPHPoint[] = [];

export type SpatialTool = "select" | "edit_atribut" | "cut" | "merge" | "measure";

export default function EditPetaSpasialPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Parameter dari URL: Membawa Konteks Aktivitas & Estate
  const region = searchParams.get("region") || "REGION 1";
  const estate = searchParams.get("estate") || "BUM 1";
  const afdeling = searchParams.get("afdeling") || "AFD 4";
  const blok = searchParams.get("blok") || "A05";
  const aktivitas = searchParams.get("aktivitas") || "pruning";

  // Kondisi dinamis spesifik sesuai aktivitas halaman
  const availableKondisi = useMemo(
    () => getKondisiOptionsByAktivitas(aktivitas),
    [aktivitas]
  );

  // State Map Leaflet
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.FeatureGroup | null>(null);
  const labelsGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const rubberbandRef = useRef<L.Polyline | null>(null);

  const [basemap, setBasemap] = useState<"satellite" | "osm">("satellite");
  const [activeTool, setActiveTool] = useState<SpatialTool>("select");

  // Snapping Settings (Always active in the background)
  const snappingEnabled = true;
  const snapTolerancePx = 15;
  const snapBatasBlok = true;
  const snapTPH = true;

  // Panel Docking Edit GIS Studio (Kiri) - Default Close
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Floating Legenda Peta
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(true);

  // Engine Status
  const [spatialEngine, setSpatialEngine] = useState<"RustGIS" | "PythonWorker" | "BrowserGeo">("RustGIS");

  // State Notifikasi HUD
  const [notice, setNotice] = useState<string>("");

  // ─── DATASET SPASIAL SATU ESTATE PENUH (MUAT DARI DATABASE SUPABASE) ───────
  const [polygons, setPolygons] = useState<EstatePolygonItem[]>([]);

  // Perbarui & muat poligon riil dari Supabase berdasarkan aktivitas & estate
  useEffect(() => {
    let isMounted = true;
    async function loadEstatePolygons() {
      // Tabel Supabase yang sesuai aktivitas
      const tableMap: Record<string, string> = {
        produksi: "produksi",
        pruning: "perawatan_pruning",
        semprot: "perawatan_semprot",
        pemupukan: "perawatan_pemupukan",
        pasar_pikul: "perawatan_pasar_pikul",
        jangkos: "perawatan_jangkos",
      };
      const targetTable = tableMap[aktivitas.toLowerCase()] || "perawatan_pruning";

      try {
        const estateFilter: Record<string, string> = estate && estate !== "all" ? { Estate: `eq.${estate}` } : {};

        // 1. Ambil seluruh data master batas_blok dengan 2 paginasi (0-1000 dan 1000-2000) agar 1.329 blok BUM 1 termuat 100% tanpa terpotong
        const [resMaster1, resMaster2, resOps] = await Promise.all([
          supabase.from("batas_blok").select("*", estateFilter, { offset: 0, limit: 1000 }),
          supabase.from("batas_blok").select("*", estateFilter, { offset: 1000, limit: 1000 }),
          supabase.from(targetTable).select("*", {}, { limit: 5000 }),
        ]);

        const masterData: any[] = [
          ...(Array.isArray(resMaster1.data) ? resMaster1.data : []),
          ...(Array.isArray(resMaster2.data) ? resMaster2.data : []),
        ];

        // Buat map data operasional berdasarkan kode blok
        const opsMap = new Map<string, any>();
        if (Array.isArray(resOps.data)) {
          resOps.data.forEach((row: any) => {
            const b = String(row.blok ?? row.Blok ?? "").trim().toUpperCase();
            if (b) opsMap.set(b, row);
          });
        }

        const loaded: EstatePolygonItem[] = [];
        const processedBlocks = new Set<string>();

        // Fungsi pembantu ekstrak poligon
        const addPolygonItem = (row: any, isMaster: boolean, opsRow?: any) => {
          const geom = (opsRow && opsRow.coordinates) || row.coordinates;
          if (!geom) return;

          const rawPolygons: [number, number][][][] = [];
          if (Array.isArray(geom) && geom.length >= 3) {
            // Format baku array [lat, lng][] dari batas_blok Supabase
            if (typeof geom[0]?.[0] === "number") {
              const convertedToGeoJsonRing = geom.map(([lat, lng]: [number, number]) => [lng, lat] as [number, number]);
              rawPolygons.push([convertedToGeoJsonRing]);
            } else if (Array.isArray(geom[0]) && typeof geom[0][0]?.[0] === "number") {
              // Array of rings
              rawPolygons.push(geom);
            }
          } else if (geom.type === "Polygon" && Array.isArray(geom.coordinates)) {
            rawPolygons.push(geom.coordinates);
          } else if (geom.type === "MultiPolygon" && Array.isArray(geom.coordinates)) {
            geom.coordinates.forEach((poly: any) => {
              if (Array.isArray(poly)) rawPolygons.push(poly);
            });
          } else if (Array.isArray(geom.coordinates)) {
            rawPolygons.push(geom.coordinates);
          }

          rawPolygons.forEach((polyCoords, partIdx) => {
            const outerRing = polyCoords[0];
            if (!outerRing || outerRing.length < 3) return;

            const coords: [number, number][] = outerRing.map(
              ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
            );

            let partAreaHa = Number(
              opsRow?.luas_ha ?? row.luas_ha ?? row.Luas ?? row.luas ?? 0
            );
            if (partAreaHa <= 0 && outerRing.length >= 3) {
              try {
                const turfPoly = turf.polygon([outerRing]);
                const m2 = turf.area(turfPoly);
                if (m2 > 0) partAreaHa = Number((m2 / 10000).toFixed(2));
              } catch {
                partAreaHa = 25.0;
              }
            }

            const blokName = String(
              opsRow?.blok ?? row.blok ?? row.Blok ?? row.kode_blok ?? "BLK"
            ).trim();
            const isTarget = blokName.toUpperCase() === blok.toUpperCase() || row.id === `poly-${blok}`;
            const partId =
              rawPolygons.length > 1
                ? `${row.id || "poly-" + blokName}-part-${partIdx}`
                : (row.id || `poly-${blokName}`);

            const kondisiFinal = opsRow?.kondisi || (isMaster ? "Belum Dikerjakan" : (row.kondisi || "BAPP"));
            const colorFinal = opsRow
              ? getStatusHexColor(kondisiFinal, aktivitas)
              : (isMaster ? "#334155" : getStatusHexColor(kondisiFinal, aktivitas));

            loaded.push({
              id: partId,
              name: `Blok ${blokName} (${row.Estate || row.estate || estate})`,
              blok: blokName,
              luas_ha: partAreaHa,
              kondisi: kondisiFinal,
              color: colorFinal,
              coords,
              isTargetBlok: isTarget,
              afdeling: opsRow?.afdeling || row.Afdeling || row.afdeling || afdeling,
              estate: opsRow?.estate || row.Estate || row.estate || estate,
              keterangan: opsRow?.keterangan || (isMaster ? "Batas Baku Master (Belum Ada Rencana)" : row.keterangan),
            });
          });
        };

        // A. Muat seluruh 1.300+ blok master sehingga seluruh estate utuh tanpa bolong/lubang
        if (masterData.length > 0) {
          masterData.forEach((mRow: any) => {
            const b = String(mRow.Blok ?? mRow.blok ?? "").trim().toUpperCase();
            if (b) processedBlocks.add(b);
            const opsMatch = b ? opsMap.get(b) : undefined;
            addPolygonItem(mRow, true, opsMatch);
          });
        }

        // B. Tambahkan blok operasional yang belum terdaftar di master jika ada
        if (Array.isArray(resOps.data)) {
          resOps.data.forEach((oRow: any) => {
            const b = String(oRow.blok ?? oRow.Blok ?? "").trim().toUpperCase();
            if (b && !processedBlocks.has(b)) {
              processedBlocks.add(b);
              addPolygonItem(oRow, false);
            }
          });
        }

        if (isMounted && loaded.length > 0) {
          setPolygons(loaded);
          const target = loaded.find((p) => p.isTargetBlok || p.blok.toUpperCase() === blok.toUpperCase());
          if (target) {
            setSelectedPolyIds([target.id]);
          } else {
            setSelectedPolyIds([loaded[0].id]);
          }
          return;
        }
      } catch (err) {
        console.error("Gagal memuat poligon:", err);
      }

      // Fallback cadangan
      if (isMounted) {
        const fallback = getEstatePolygons(estate, blok, aktivitas);
        setPolygons(fallback);
        if (fallback.length > 0) {
          setSelectedPolyIds([fallback[0].id]);
        }
      }
    }

    loadEstatePolygons();
    return () => {
      isMounted = false;
    };
  }, [estate, blok, aktivitas]);

  // ─── SELEKSI POLIGON ─────────────────────────────────────────────────────
  const [selectedPolyIds, setSelectedPolyIds] = useState<string[]>([`poly-${blok}`]);
  const selectedPolyId = selectedPolyIds[0] || (polygons[0]?.id ?? `poly-${blok}`);

  // Riwayat Perubahan (Undo & Redo Stack)
  const [history, setHistory] = useState<EstatePolygonItem[][]>([]);
  const [redoStack, setRedoStack] = useState<EstatePolygonItem[][]>([]);

  // ─── STATE EDIT ATRIBUT (INTI PERKEBUNAN) ────────────────────────────────
  const activeSelectedPoly = polygons.find((p) => p.id === selectedPolyId) || polygons[0];
  const [attrBlok, setAttrBlok] = useState<string>(activeSelectedPoly?.blok || blok);
  const [attrEstate, setAttrEstate] = useState<string>(activeSelectedPoly?.estate || estate);
  const [attrAfdeling, setAttrAfdeling] = useState<string>(activeSelectedPoly?.afdeling || afdeling);
  const [attrTahunTanam, setAttrTahunTanam] = useState<number>(activeSelectedPoly?.tahun_tanam || 2018);
  const [attrLuasHa, setAttrLuasHa] = useState<number>(activeSelectedPoly?.luas_ha || 30.5);
  const [attrKondisi, setAttrKondisi] = useState<string>(activeSelectedPoly?.kondisi || availableKondisi[0]);

  useEffect(() => {
    if (activeSelectedPoly) {
      setAttrBlok(activeSelectedPoly.blok);
      setAttrEstate(activeSelectedPoly.estate || estate);
      setAttrAfdeling(activeSelectedPoly.afdeling || afdeling);
      setAttrTahunTanam(activeSelectedPoly.tahun_tanam || 2018);
      setAttrLuasHa(activeSelectedPoly.luas_ha);
      setAttrKondisi(activeSelectedPoly.kondisi);
    }
  }, [selectedPolyId, activeSelectedPoly, estate, afdeling]);

  // Cek apakah ada perubahan nilai atribut (Dirty State)
  const isAttrDirty = Boolean(
    activeSelectedPoly &&
    (attrBlok !== activeSelectedPoly.blok ||
      attrEstate !== (activeSelectedPoly.estate || estate) ||
      attrAfdeling !== (activeSelectedPoly.afdeling || afdeling) ||
      attrTahunTanam !== (activeSelectedPoly.tahun_tanam || 2018) ||
      attrLuasHa !== activeSelectedPoly.luas_ha ||
      attrKondisi !== activeSelectedPoly.kondisi)
  );

  // ─── STATE CUT / SPLIT POLIGON (TOPOLOGI PRESISI TURF.JS) ─────────────────
  const [cutPoints, setCutPoints] = useState<[number, number][]>([]);
  const [splitModalOpen, setSplitModalOpen] = useState<boolean>(false);
  const [pendingSplitZones, setPendingSplitZones] = useState<PendingSplitZone[]>([]);
  const [pendingTargetPoly, setPendingTargetPoly] = useState<EstatePolygonItem | null>(null);
  const [splitConditionsChoices, setSplitConditionsChoices] = useState<Record<string, string>>({});

  // ─── STATE GABUNG KONDISI (MERGE) ────────────────────────────────────────
  const [mergeSelectedIds, setMergeSelectedIds] = useState<string[]>([]);
  const [mergeKondisi, setMergeKondisi] = useState<string>(availableKondisi[0] || "BAPP");

  // ─── STATE PENGUKUR SPASIAL (MEASURE) ────────────────────────────────────
  const [measureMode, setMeasureMode] = useState<"distance" | "area">("distance");
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [totalDistanceMeters, setTotalDistanceMeters] = useState<number>(0);
  const [measureAreaHa, setMeasureAreaHa] = useState<number>(0);

  // Helper Notifikasi
  const showNotice = useCallback((msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 4500);
  }, []);

  const saveToHistory = useCallback(() => {
    setHistory((prev) => [...prev, polygons]);
    setRedoStack([]);
  }, [polygons]);

  // ─── UNDO, REDO & RESET ──────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack((prev) => [...prev, polygons]);
    setPolygons(previous);
    setHistory((prev) => prev.slice(0, prev.length - 1));
    showNotice("Perubahan terakhir dibatalkan (Undo).");
  }, [history, polygons, showNotice]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((prev) => [...prev, polygons]);
    setPolygons(next);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    showNotice("Perubahan dikembalikan (Redo).");
  }, [redoStack, polygons, showNotice]);

  const handleReset = useCallback(() => {
    if (!window.confirm(`Kembalikan seluruh poligon estate ${estate} ke kondisi master awal?`)) return;
    saveToHistory();
    setCutPoints([]);
    setMeasurePoints([]);
    setTotalDistanceMeters(0);
    setMeasureAreaHa(0);
    showNotice("Poligon estate disegarkan.");
  }, [estate, saveToHistory, showNotice]);

  const handleCancelInteractiveModes = useCallback(() => {
    setCutPoints([]);
    setMeasurePoints([]);
    setTotalDistanceMeters(0);
    setMeasureAreaHa(0);
  }, []);

  // ─── SIMPAN EDIT ATRIBUT ─────────────────────────────────────────────────
  const handleSaveAttributes = () => {
    if (!activeSelectedPoly) return;
    saveToHistory();
    setPolygons((prev) =>
      prev.map((p) =>
        p.id === selectedPolyId
          ? {
            ...p,
            blok: attrBlok,
            name: `Blok ${attrBlok} (${attrEstate})`,
            estate: attrEstate,
            afdeling: attrAfdeling,
            tahun_tanam: Number(attrTahunTanam),
            luas_ha: Number(attrLuasHa),
            kondisi: attrKondisi,
            color: getStatusHexColor(attrKondisi, aktivitas),
          }
          : p
      )
    );
    showNotice(`Atribut Blok ${attrBlok} berhasil disimpan.`);
  };

  // ─── SPLIT PRESISI DENGAN TOPOLOGI SEJATI (TURF.JS GEOMETRIC DIFFERENCE) ──
  const executeInstantCut = useCallback(
    (points: [number, number][]) => {
      if (points.length < 2) {
        showNotice("Diperlukan minimal 2 titik garis melintasi poligon target.");
        return;
      }

      try {
        // Perpanjang ujung garis secara matematis (vector auto-extend)
        const extendedPoints = extendLineString(points);
        const extendedLine = turf.lineString(extendedPoints.map(([lat, lng]) => [lng, lat]));
        const rawLine = turf.lineString(points.map(([lat, lng]) => [lng, lat]));

        // Cari target poligon: Prioritaskan poligon yang secara fisik dipotong garis (>= 2 titik potong)
        // Pertama, cek apakah ada poligon terpilih yang dipotong garis:
        let targetPoly: EstatePolygonItem | undefined = polygons.find((p) => {
          if (!selectedPolyIds.includes(p.id)) return false;
          try {
            const ring = [...p.coords.map(([lat, lng]) => [lng, lat])];
            if (
              ring[0][0] !== ring[ring.length - 1][0] ||
              ring[0][1] !== ring[ring.length - 1][1]
            ) {
              ring.push(ring[0]);
            }
            const poly = turf.polygon([ring]);
            const ints = turf.lineIntersect(extendedLine, poly);
            return ints && ints.features && ints.features.length >= 2;
          } catch {
            return false;
          }
        });

        // Kedua, jika poligon terpilih bukan yang dipotong, cari poligon mana saja di peta yang dipotong garis
        if (!targetPoly) {
          targetPoly = polygons.find((p) => {
            try {
              const ring = [...p.coords.map(([lat, lng]) => [lng, lat])];
              if (
                ring[0][0] !== ring[ring.length - 1][0] ||
                ring[0][1] !== ring[ring.length - 1][1]
              ) {
                ring.push(ring[0]);
              }
              const poly = turf.polygon([ring]);
              const ints = turf.lineIntersect(extendedLine, poly);
              return ints && ints.features && ints.features.length >= 2;
            } catch {
              return false;
            }
          });
        }

        // Ketiga, fallback jika garis belum sampai tembus, gunakan poligon yang dipilih
        if (!targetPoly) {
          targetPoly = polygons.find((p) => selectedPolyIds.includes(p.id));
        }

        if (!targetPoly) {
          targetPoly = polygons.find((p) => p.id === `poly-${blok}`) || polygons[0];
        }

        if (!targetPoly) {
          showNotice("Tidak ada poligon target yang dapat dibelah.");
          return;
        }

        const ring = [...targetPoly.coords.map(([lat, lng]) => [lng, lat])];
        if (
          ring[0][0] !== ring[ring.length - 1][0] ||
          ring[0][1] !== ring[ring.length - 1][1]
        ) {
          ring.push(ring[0]);
        }
        const poly = turf.polygon([ring]);

        // Validasi titik potong
        let intersects = turf.lineIntersect(extendedLine, poly);
        if (!intersects || intersects.features.length < 2) {
          intersects = turf.lineIntersect(rawLine, poly);
        }

        if (!intersects || intersects.features.length < 2) {
          showNotice(
            `Garis potong harus melintasi batas Blok ${targetPoly.blok} dari satu sisi ke sisi seberang.`
          );
          return;
        }

        // Buat celah pisau tipis 0.3 meter
        const cutBuffer = turf.buffer(extendedLine, 0.3, { units: "meters" });
        if (!cutBuffer) {
          throw new Error("Gagal membuat buffer pisau potong.");
        }

        const splitDiff = turf.difference(turf.featureCollection([poly, cutBuffer]));

        if (!splitDiff || splitDiff.geometry.type !== "MultiPolygon") {
          throw new Error("Hasil pemotongan tidak menghasilkan poligon terpisah.");
        }

        const parentKondisi = targetPoly.kondisi || availableKondisi[0] || "BAPP";
        const alternateKondisi =
          availableKondisi.find((k) => k !== parentKondisi) || availableKondisi[1] || availableKondisi[0];

        const initialChoices: Record<string, string> = {};
        const newZones: PendingSplitZone[] = splitDiff.geometry.coordinates.map(
          (partCoords, idx) => {
            const singlePoly = turf.polygon(partCoords);
            const areaHa = Number((turf.area(singlePoly) / 10000).toFixed(2));
            const zoneId = `split-${Date.now()}-${idx + 1}`;
            const assignedCond = idx === 0 ? parentKondisi : alternateKondisi;
            initialChoices[zoneId] = assignedCond;

            // Konversi GeoJSON [lng, lat] kembali ke Leaflet [lat, lng]
            const leafletCoords: [number, number][] = partCoords[0].map(([lng, lat]) => [
              lat,
              lng,
            ]);

            return {
              id: zoneId,
              name: `${targetPoly.blok} - Zona ${idx + 1}`,
              areaHa: areaHa > 0 ? areaHa : Number((targetPoly.luas_ha / 2).toFixed(1)),
              kondisi: assignedCond,
              coords: leafletCoords,
            };
          }
        );

        setPendingSplitZones(newZones);
        setPendingTargetPoly(targetPoly);
        setSplitConditionsChoices(initialChoices);
        setSplitModalOpen(true);
        setCutPoints([]);
      } catch (err: any) {
        console.error("Gagal menjalankan topologi Split:", err);
        showNotice(
          `Gagal memotong: Pastikan garis melintasi poligon secara sempurna. (${err?.message || ""})`
        );
      }
    },
    [polygons, selectedPolyIds, blok, availableKondisi, showNotice]
  );

  // ─── KONFIRMASI PENETAPAN KONDISI HASIL SPLIT DARI MODAL ───────────────────
  const handleConfirmSplit = useCallback(() => {
    if (!pendingTargetPoly || pendingSplitZones.length === 0) {
      setSplitModalOpen(false);
      return;
    }

    saveToHistory();

    const finalizedZones: EstatePolygonItem[] = pendingSplitZones.map((z, idx) => {
      const chosenCond = splitConditionsChoices[z.id] || z.kondisi;
      const zoneColor = getStatusHexColor(chosenCond, aktivitas);

      return {
        id: z.id,
        name: `${pendingTargetPoly.blok} - Zona ${idx + 1} (${chosenCond})`,
        blok: pendingTargetPoly.blok,
        luas_ha: z.areaHa,
        kondisi: chosenCond,
        color: zoneColor,
        coords: z.coords,
        isTargetBlok: pendingTargetPoly.isTargetBlok,
        afdeling: pendingTargetPoly.afdeling || afdeling,
        estate: pendingTargetPoly.estate || estate,
        tahun_tanam: pendingTargetPoly.tahun_tanam || 2018,
        keterangan: `Zonasi hasil potong Blok ${pendingTargetPoly.blok} - ${chosenCond}`,
      };
    });

    // Sub-zona lain di estate tetap utuh, hanya target yang diganti dengan pecahan barunya!
    setPolygons((prev) => [
      ...prev.filter((p) => p.id !== pendingTargetPoly.id),
      ...finalizedZones,
    ]);

    setSelectedPolyIds(finalizedZones.map((z) => z.id));
    setActiveTool("select");
    setSplitModalOpen(false);
    setPendingSplitZones([]);
    setPendingTargetPoly(null);
    setCutPoints([]);
    showNotice(
      `Berhasil membelah Blok ${pendingTargetPoly.blok} menjadi ${finalizedZones.length} zona kondisi berbeda secara instan.`
    );
  }, [
    pendingTargetPoly,
    pendingSplitZones,
    splitConditionsChoices,
    saveToHistory,
    aktivitas,
    afdeling,
    estate,
    showNotice,
  ]);

  // ─── GABUNG KONDISI (MERGE) ──────────────────────────────────────────────
  const handleApplyMerge = () => {
    if (mergeSelectedIds.length === 0) {
      alert("Pilih minimal 1 poligon atau bagian wilayah pada peta untuk digabung kondisinya.");
      return;
    }

    saveToHistory();

    const selectedPolys = polygons.filter((p) => mergeSelectedIds.includes(p.id));
    const totalLuas = Number(selectedPolys.reduce((acc, p) => acc + p.luas_ha, 0).toFixed(1));
    const blockNames = Array.from(new Set(selectedPolys.map((p) => p.blok))).join(", ");
    const newColor = getStatusHexColor(mergeKondisi, aktivitas);

    setPolygons((prev) =>
      prev.map((p) => {
        if (mergeSelectedIds.includes(p.id)) {
          return {
            ...p,
            kondisi: mergeKondisi,
            color: newColor,
          };
        }
        return p;
      })
    );

    setSelectedPolyIds(mergeSelectedIds);
    setMergeSelectedIds([]);
    setActiveTool("select");
    showNotice(`Kondisi untuk [${blockNames}] (${totalLuas} Ha) berhasil diubah menjadi '${mergeKondisi}'.`);
  };

  // ─── PENGUKUR SPASIAL (MEASURE) ──────────────────────────────────────────
  const handleResetRuler = () => {
    setMeasurePoints([]);
    setTotalDistanceMeters(0);
    setMeasureAreaHa(0);
  };

  const handleRemoveLastMeasurePoint = () => {
    if (measurePoints.length === 0) return;
    const updated = measurePoints.slice(0, measurePoints.length - 1);
    setMeasurePoints(updated);

    if (updated.length < 2) {
      setTotalDistanceMeters(0);
      setMeasureAreaHa(0);
      return;
    }

    let totalM = 0;
    for (let i = 0; i < updated.length - 1; i++) {
      const p1 = L.latLng(updated[i][0], updated[i][1]);
      const p2 = L.latLng(updated[i + 1][0], updated[i + 1][1]);
      totalM += p1.distanceTo(p2);
    }
    setTotalDistanceMeters(Math.round(totalM));

    if (updated.length >= 3) {
      let areaSum = 0;
      for (let i = 0; i < updated.length; i++) {
        const j = (i + 1) % updated.length;
        const [lat1, lng1] = updated[i];
        const [lat2, lng2] = updated[j];
        areaSum += lng1 * lat2 - lng2 * lat1;
      }
      const areaDeg2 = Math.abs(areaSum) / 2;
      const metersPerDeg = 111320;
      const areaM2 = areaDeg2 * metersPerDeg * (metersPerDeg * Math.cos((-1.55 * Math.PI) / 180));
      setMeasureAreaHa(Number((areaM2 / 10000).toFixed(2)));
    } else {
      setMeasureAreaHa(0);
    }
  };

  const addMeasurePoint = (latlng: [number, number]) => {
    const updated = [...measurePoints, latlng];
    setMeasurePoints(updated);

    if (updated.length >= 2) {
      let totalM = 0;
      for (let i = 0; i < updated.length - 1; i++) {
        const p1 = L.latLng(updated[i][0], updated[i][1]);
        const p2 = L.latLng(updated[i + 1][0], updated[i + 1][1]);
        totalM += p1.distanceTo(p2);
      }
      setTotalDistanceMeters(Math.round(totalM));
    }

    if (updated.length >= 3) {
      let areaSum = 0;
      for (let i = 0; i < updated.length; i++) {
        const j = (i + 1) % updated.length;
        const [lat1, lng1] = updated[i];
        const [lat2, lng2] = updated[j];
        areaSum += lng1 * lat2 - lng2 * lat1;
      }
      const areaDeg2 = Math.abs(areaSum) / 2;
      const metersPerDeg = 111320;
      const areaM2 = areaDeg2 * metersPerDeg * (metersPerDeg * Math.cos((-1.55 * Math.PI) / 180));
      setMeasureAreaHa(Number((areaM2 / 10000).toFixed(2)));
    }
  };

  // ─── CETAK PETA KARTOGRAFI ────────────────────────────────────────────────
  const handlePrintMap = () => {
    const polyMap = polygons.map((p) => ({
      blok: p.blok,
      kondisi: p.kondisi,
      statusColor: p.color,
      luas_ha: p.luas_ha,
    }));
    const totalHa = Number(polyMap.reduce((acc, p) => acc + p.luas_ha, 0).toFixed(1));
    printPetaKartografi({
      estate,
      afdeling,
      blocks: polyMap,
      totalHa,
    });
  };

  // ─── GLOBAL KEYBOARD SHORTCUTS ────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      ) {
        return;
      }

      if (e.ctrlKey && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        handleUndo();
        return;
      }

      if (e.ctrlKey && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (e.ctrlKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        showNotice(`Perubahan spasial estate ${estate} (${polygons.length} poligon) berhasil disimpan.`);
        return;
      }

      if (e.key === "s" || e.key === "S") {
        setActiveTool("select");
        handleCancelInteractiveModes();
        setSidebarOpen(false);
        return;
      }

      if (e.key === "c" || e.key === "C") {
        setActiveTool("cut");
        setCutPoints([]);
        setSidebarOpen(false);
        showNotice("Mode CUT aktif: Klik titik-titik untuk memotong (Double-click atau Enter untuk potong).");
        return;
      }

      if (e.key === "m" || e.key === "M") {
        setActiveTool("merge");
        if (selectedPolyIds.length > 0) {
          setMergeSelectedIds(selectedPolyIds);
        }
        setSidebarOpen(false);
        showNotice("Mode Merge aktif: Pilih poligon yang akan diseragamkan kondisinya.");
        return;
      }

      if (e.key === "a" || e.key === "A") {
        setActiveTool("edit_atribut");
        setSidebarOpen(true);
        return;
      }

      if (e.key === "r" || e.key === "R") {
        setActiveTool("measure");
        handleCancelInteractiveModes();
        setSidebarOpen(false);
        return;
      }

      if (e.key === "d" || e.key === "D") {
        if (activeTool === "measure") {
          setMeasureMode("distance");
          showNotice("Measure mode: Distance");
          return;
        }
      }

      if (e.key === "e" || e.key === "E") {
        if (activeTool === "measure") {
          setMeasureMode("area");
          showNotice("Measure mode: Area");
          return;
        }
      }

      if ((e.key === "Enter" || e.key === "Shift") && activeTool === "cut" && cutPoints.length >= 2) {
        e.preventDefault();
        executeInstantCut(cutPoints);
        return;
      }

      if (e.key === "Escape") {
        if (activeTool === "cut" && cutPoints.length > 0) {
          setCutPoints([]);
          showNotice("Garis pemotong dibatalkan.");
        } else if (activeTool === "measure" && measurePoints.length > 0) {
          handleResetRuler();
          showNotice("Pengukuran direset.");
        } else if (activeTool === "select" && selectedPolyIds.length > 0) {
          setSelectedPolyIds([]);
          showNotice("Pilihan poligon dikosongkan.");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeTool,
    cutPoints,
    selectedPolyIds,
    polygons,
    estate,
    executeInstantCut,
    handleCancelInteractiveModes,
    handleRedo,
    handleUndo,
    showNotice,
  ]);

  // Rekapitulasi poligon terpilih
  const selectedPolygons = useMemo(
    () => polygons.filter((p) => selectedPolyIds.includes(p.id)),
    [polygons, selectedPolyIds]
  );

  const selectedTotalLuasHa = useMemo(
    () => Number(selectedPolygons.reduce((acc, p) => acc + p.luas_ha, 0).toFixed(1)),
    [selectedPolygons]
  );

  // ─── INITIALIZE MAP ONCE (STANDAR TAILADMIN DASHBOARD CANVAS) ─────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialCenter: L.LatLngExpression = [-1.55, 113.97];
    const initialZoom = 15;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false,
      doubleClickZoom: false,
    });

    mapInstanceRef.current = map;
    L.control.zoom({ position: "topright" }).addTo(map);

    const layersGroup = L.featureGroup().addTo(map);
    layersGroupRef.current = layersGroup;

    const labelsGroup = L.layerGroup().addTo(map);
    labelsGroupRef.current = labelsGroup;

    // Rubberband line for dragging
    const rubberband = L.polyline([], {
      color: "#ef4444",
      weight: 2.5,
      dashArray: "4, 4",
      opacity: 0.9,
    }).addTo(map);
    rubberbandRef.current = rubberband;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layersGroupRef.current = null;
      labelsGroupRef.current = null;
      tileLayerRef.current = null;
      rubberbandRef.current = null;
    };
  }, []);

  // Update Basemap Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let tileLayer: L.TileLayer;
    if (basemap === "satellite") {
      tileLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19 }
      );
    } else {
      tileLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { maxZoom: 19 }
      );
    }

    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;
  }, [basemap]);

  // ─── RENDER SPATIAL LAYERS KE DALAM FEATUREGROUP SECARA BERSIH (NO LEAK / NO STACK) ──
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layersGroup = layersGroupRef.current;
    if (!map || !layersGroup) return;

    // 1. Bersihkan seluruh layer poligon sebelumnya agar TIDAK MENUMPUK
    layersGroup.clearLayers();
    const labelsGroup = labelsGroupRef.current;
    if (labelsGroup) labelsGroup.clearLayers();

    // ─── DEDUPING LABEL: SATU BLOK HANYA 1 LABEL (DI POLIGON TERBESAR) ───────
    const largestPolyPerBlock = new Map<string, { poly: EstatePolygonItem; bounds: L.LatLngBounds; center: L.LatLng }>();
    const totalAreaPerBlock = new Map<string, number>();

    polygons.forEach((p) => {
      const bKey = p.blok || "BLK";
      totalAreaPerBlock.set(bKey, (totalAreaPerBlock.get(bKey) || 0) + (p.luas_ha || 0));
    });

    // ─── 1. RENDER SELURUH POLIGON SATU ESTATE ─────────────────────────────
    polygons.forEach((poly) => {
      // Grouping Blok: Jika blok terpilih, semua pecahan blok ini ikut terpilih secara harmonis
      const isSelected = selectedPolyIds.includes(poly.id) || selectedPolyIds.some((id) => {
        const found = polygons.find((p) => p.id === id);
        return found && found.blok === poly.blok;
      });
      const isTarget = poly.id === `poly-${blok}` || poly.isTargetBlok || poly.blok === blok;
      const isMergeSelected = mergeSelectedIds.includes(poly.id);

      // Desain border TailAdmin: Bersih, tegas, tanpa efek neon slop
      let strokeColor = "#334155"; // Tailwind slate-700
      let strokeWidth = 1.2;
      let strokeOpacity = 0.85;
      let fillOpacity = 0.65;

      if (isSelected) {
        strokeColor = "#ffffff";
        strokeWidth = 3;
        strokeOpacity = 1;
        fillOpacity = 0.85;
      } else if (isMergeSelected) {
        strokeColor = "#7c3aed"; // Violet-600
        strokeWidth = 3;
        strokeOpacity = 1;
        fillOpacity = 0.75;
      } else if (isTarget) {
        strokeColor = "#38bdf8"; // Sky-400
        strokeWidth = 2.5;
        strokeOpacity = 0.95;
        fillOpacity = 0.75;
      }

      const leafPolygon = L.polygon(poly.coords, {
        color: strokeColor,
        weight: strokeWidth,
        opacity: strokeOpacity,
        fillColor: poly.color,
        fillOpacity: fillOpacity,
      }).addTo(layersGroup);

      const bounds = leafPolygon.getBounds();
      const center = bounds.getCenter();
      const blokKey = poly.blok || "BLK";
      const existing = largestPolyPerBlock.get(blokKey);
      const isBigger =
        !existing ||
        poly.luas_ha > existing.poly.luas_ha ||
        (poly.luas_ha === existing.poly.luas_ha && poly.coords.length > existing.poly.coords.length);
      if (isBigger) {
        largestPolyPerBlock.set(blokKey, { poly, bounds, center });
      }

      // Event Klik Poligon
      leafPolygon.on("click", (e) => {
        L.DomEvent.stopPropagation(e);

        if (activeTool === "cut") {
          // Klik langsung di atas badan poligon mencatat titik potong dengan snapping magnet aktif!
          const raw: [number, number] = [e.latlng.lat, e.latlng.lng];
          const snapped = getSnappedCoords(raw);
          handleMapClickForCut(snapped.coords);
          if (snapped.targetName) {
            showNotice(`Snap: ${snapped.targetName}`);
          }
          return;
        }

        if (activeTool === "merge") {
          setMergeSelectedIds((prev) =>
            prev.includes(poly.id) ? prev.filter((id) => id !== poly.id) : [...prev, poly.id]
          );
          showNotice(`Poligon ${poly.blok} dipilih untuk digabung kondisinya.`);
        } else {
          const isShift = Boolean(e.originalEvent?.shiftKey);
          if (isShift) {
            setSelectedPolyIds((prev) => {
              if (prev.includes(poly.id)) {
                return prev.length > 1 ? prev.filter((id) => id !== poly.id) : prev;
              } else {
                return [...prev, poly.id];
              }
            });
          } else {
            setSelectedPolyIds([poly.id]);
          }

          if (activeTool === "edit_atribut") {
            setSidebarOpen(true);
          }
        }
      });

      // Event Double Click Poligon (Untuk Langsung Finalisasi Potong)
      leafPolygon.on("dblclick", (e) => {
        if (activeTool === "cut" && cutPoints.length >= 1) {
          L.DomEvent.stopPropagation(e);
          const raw: [number, number] = [e.latlng.lat, e.latlng.lng];
          const snapped = getSnappedCoords(raw);
          const finalPoints = [...cutPoints, snapped.coords];
          executeInstantCut(finalPoints);
        }
      });
    });

    // ─── STANDAR ZOOM LEVEL: RENDER LABEL HANYA KETIKA ZOOM >= 15 (DEKAT) ──────
    const updateLabelsVisibility = () => {
      const labelsGroup = labelsGroupRef.current;
      const currentMap = mapInstanceRef.current;
      if (!labelsGroup || !currentMap) return;
      const currentZoom = currentMap.getZoom();
      const currentMapBounds = currentMap.getBounds();
      labelsGroup.clearLayers();

      // Aturan Standar Zoom:
      // Zoom < 15: Sembunyikan label, hanya render blok yang sedang aktif/dipilih
      // Zoom >= 15: Render 1 label per blok yang berada di dalam viewport aktif
      largestPolyPerBlock.forEach(({ poly, center }) => {
        const isSelected = selectedPolyIds.includes(poly.id);
        const isTarget = poly.id === `poly-${blok}` || poly.isTargetBlok;
        const isMergeSelected = mergeSelectedIds.includes(poly.id);

        // Jika zoom jauh (< 15), HANYA blok terpilih yang diberi label
        if (currentZoom < 15 && !isSelected && !isTarget && !isMergeSelected) {
          return;
        }

        // Culling: Abaikan label di luar layar pandang peta
        if (!currentMapBounds.contains(center)) {
          return;
        }

        const totalHa = totalAreaPerBlock.get(poly.blok) || poly.luas_ha;
        const labelIcon = L.divIcon({
          className: "custom-polygon-label",
          html: `
            <div style="
              background: ${isSelected ? "#2563eb" : isMergeSelected ? "#7c3aed" : "rgba(17, 24, 39, 0.88)"};
              color: #ffffff;
              font-size: 10px;
              font-weight: 700;
              padding: 2px 6px;
              border-radius: 4px;
              border: 1px solid ${isSelected || isMergeSelected ? "#ffffff" : "rgba(255,255,255,0.2)"};
              box-shadow: 0 1px 3px rgba(0,0,0,0.3);
              white-space: nowrap;
              pointer-events: none;
              text-align: center;
            ">
              <div>${poly.blok}</div>
              <div style="font-size: 8px; font-weight: normal; opacity: 0.85;">${totalHa > 0 ? totalHa.toFixed(1) : "—"} Ha</div>
            </div>
          `,
          iconSize: [60, 24],
          iconAnchor: [30, 12],
        });

        L.marker(center, { icon: labelIcon, interactive: false }).addTo(labelsGroup);
      });
    };

    updateLabelsVisibility();
    map.on("zoomend moveend", updateLabelsVisibility);

    // ─── HELPER SNAPPING (MAGNET PRESISI KOORDINAT) ─────────────────────────
    const getSnappedCoords = (
      rawLatLng: [number, number]
    ): { coords: [number, number]; targetName?: string } => {
      if (!snappingEnabled) return { coords: rawLatLng };

      const clickPt = map.latLngToLayerPoint(L.latLng(rawLatLng[0], rawLatLng[1]));
      let bestDist = snapTolerancePx;
      let bestCoord: [number, number] | null = null;
      let bestTarget = "";

      if (snapTPH) {
        for (const tph of INITIAL_TPH_LIST) {
          const pt = map.latLngToLayerPoint(L.latLng(tph.coords[0], tph.coords[1]));
          const dist = clickPt.distanceTo(pt);
          if (dist < bestDist) {
            bestDist = dist;
            bestCoord = tph.coords;
            bestTarget = `Titik TPH (${tph.name})`;
          }
        }
      }

      if (snapBatasBlok) {
        for (const poly of polygons) {
          for (const coord of poly.coords) {
            const pt = map.latLngToLayerPoint(L.latLng(coord[0], coord[1]));
            const dist = clickPt.distanceTo(pt);
            if (dist < bestDist) {
              bestDist = dist;
              bestCoord = coord;
              bestTarget = `Batas Blok ${poly.blok}`;
            }
          }
        }
      }

      if (bestCoord) {
        return { coords: bestCoord, targetName: bestTarget };
      }
      return { coords: rawLatLng };
    };

    // ─── 4. RENDER TITIK TPH ────────────────────────────────────────────────
    INITIAL_TPH_LIST.forEach((tph) => {
      const tphIcon = L.divIcon({
        className: "custom-tph-marker",
        html: `
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 2px;
            background: #f59e0b;
            color: #111827;
            font-weight: 700;
            font-size: 8.5px;
            padding: 1px 4px;
            border-radius: 9999px;
            border: 1px solid #ffffff;
            box-shadow: 0 1px 2px rgba(0,0,0,0.3);
            cursor: pointer;
            white-space: nowrap;
          ">
            <span>•</span>
            <span>${tph.name}</span>
          </div>
        `,
        iconSize: [44, 16],
        iconAnchor: [22, 8],
      });

      const marker = L.marker(tph.coords, { icon: tphIcon }).addTo(layersGroup);

      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        if (activeTool === "measure") {
          addMeasurePoint(tph.coords);
        } else if (activeTool === "cut") {
          handleMapClickForCut(tph.coords);
        } else {
          showNotice(`TPH: ${tph.name} (${tph.keterangan}).`);
        }
      });
    });

    // ─── 5. INTERAKSI KLIK KANVAS & DOUBLE CLICK ────────────────────────────
    const handleMapClickForCut = (latlng: [number, number]) => {
      const newPoints = [...cutPoints, latlng];
      setCutPoints(newPoints);

      if (newPoints.length === 1) {
        setSidebarOpen(true);
        showNotice("Titik awal garis potong tercatat. Klik titik berikutnya atau Double-Click untuk memotong.");
      } else {
        showNotice(`Garis potong: ${newPoints.length} titik. Tekan Enter atau Double-Click untuk memotong.`);
      }
    };

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (!rubberbandRef.current) return;
      const raw: [number, number] = [e.latlng.lat, e.latlng.lng];
      const snapped = getSnappedCoords(raw);

      if (activeTool === "cut" && cutPoints.length > 0) {
        rubberbandRef.current.setStyle({ color: "#ef4444" });
        rubberbandRef.current.setLatLngs([cutPoints[cutPoints.length - 1], snapped.coords]);
      } else if (activeTool === "measure" && measurePoints.length > 0) {
        rubberbandRef.current.setStyle({ color: "#2563eb" });
        rubberbandRef.current.setLatLngs([measurePoints[measurePoints.length - 1], snapped.coords]);
      } else {
        rubberbandRef.current.setLatLngs([]);
      }
    };

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const raw: [number, number] = [e.latlng.lat, e.latlng.lng];
      const snapped = getSnappedCoords(raw);
      const latlng = snapped.coords;

      if (snapped.targetName) {
        showNotice(`Snap: ${snapped.targetName}`);
      }

      if (activeTool === "cut") {
        handleMapClickForCut(latlng);
      } else if (activeTool === "measure") {
        addMeasurePoint(latlng);
      }
    };

    const handleMapDblClick = (e: L.LeafletMouseEvent) => {
      if (activeTool === "cut" && cutPoints.length >= 1) {
        L.DomEvent.stopPropagation(e);
        const raw: [number, number] = [e.latlng.lat, e.latlng.lng];
        const snapped = getSnappedCoords(raw);
        const finalPoints = [...cutPoints, snapped.coords];
        executeInstantCut(finalPoints);
      }
    };

    map.on("mousemove", handleMouseMove);
    map.on("click", handleMapClick);
    map.on("dblclick", handleMapDblClick);

    // ─── 6. RENDERING GARIS POTONG CUT ───────────────────────────────────────
    if (activeTool === "cut" && cutPoints.length > 0) {
      cutPoints.forEach((pt, idx) => {
        const isStart = idx === 0;
        const isEnd = idx === cutPoints.length - 1 && cutPoints.length >= 2;

        const pinIcon = L.divIcon({
          className: "cut-point-pin",
          html: `
            <div style="
              background: ${isStart ? "#ef4444" : isEnd ? "#2563eb" : "#4b5563"};
              color: #ffffff;
              font-size: 8.5px;
              font-weight: 700;
              padding: 2px 5px;
              border-radius: 4px;
              border: 1px solid #ffffff;
              box-shadow: 0 1px 3px rgba(0,0,0,0.4);
              white-space: nowrap;
            ">
              ${isStart ? "Awal" : isEnd ? "Akhir" : `P${idx + 1}`}
            </div>
          `,
          iconSize: [40, 18],
          iconAnchor: [20, 9],
        });
        L.marker(pt, { icon: pinIcon, zIndexOffset: 1200 }).addTo(layersGroup);
      });

      if (cutPoints.length >= 2) {
        L.polyline(cutPoints, {
          color: "#ef4444",
          weight: 3,
          dashArray: "5, 4",
          opacity: 0.95,
        }).addTo(layersGroup);
      }
    }

    // ─── 7. RENDERING PENGUKUR SPASIAL (MEASURE) ─────────────────────────────
    if (activeTool === "measure" && measurePoints.length > 0) {
      measurePoints.forEach((pt, idx) => {
        const dotIcon = L.divIcon({
          className: "measure-dot",
          html: `
            <div style="
              background: #2563eb;
              color: #ffffff;
              font-size: 8.5px;
              font-weight: 700;
              width: 18px;
              height: 18px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 9999px;
              border: 1.5px solid #ffffff;
              box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            ">
              ${idx + 1}
            </div>
          `,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        L.marker(pt, { icon: dotIcon, zIndexOffset: 1000 }).addTo(layersGroup);
      });

      if (measurePoints.length >= 2) {
        L.polyline(measurePoints, {
          color: "#2563eb",
          weight: 3,
          dashArray: "5, 4",
          opacity: 0.9,
        }).addTo(layersGroup);
      }

      if (measurePoints.length >= 3) {
        L.polygon(measurePoints, {
          color: "#2563eb",
          weight: 1.5,
          fillColor: "#2563eb",
          fillOpacity: 0.2,
        }).addTo(layersGroup);
      }
    }

    // Auto-fit bounds ke target block atau seluruh poligon estate
    const targetPoly = polygons.find((p) => p.isTargetBlok || p.id === `poly-${blok}`);
    if (targetPoly && targetPoly.coords && targetPoly.coords.length >= 3) {
      try {
        const polyBounds = L.polygon(targetPoly.coords).getBounds();
        if (polyBounds.isValid()) {
          map.fitBounds(polyBounds, { padding: [80, 80], maxZoom: 16 });
        }
      } catch {}
    } else if (layersGroup.getLayers().length > 0) {
      try {
        const bounds = layersGroup.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch {}
    }

    return () => {
      map.off("mousemove", handleMouseMove);
      map.off("click", handleMapClick);
      map.off("dblclick", handleMapDblClick);
      map.off("zoomend moveend", updateLabelsVisibility);
    };
  }, [
    polygons,
    selectedPolyIds,
    mergeSelectedIds,
    activeTool,
    cutPoints,
    measurePoints,
    snappingEnabled,
    snapBatasBlok,
    snapTPH,
    executeInstantCut,
    showNotice,
    blok,
  ]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 select-none font-sans">
      <PageMeta
        title={`GIS Studio: Blok ${blok} (${estate})`}
        description="Editor spasial estate berstandar TailAdmin."
      />

      {/* ══════════════════════════════════════════════════════════════════════
          1. HEADER ATAS (STANDAR TAILADMIN HEADER)
          ══════════════════════════════════════════════════════════════════════ */}
      <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 flex items-center justify-between gap-3 z-20 shadow-xs">
        {/* Kiri: Navigasi Kembali & Breadcrumb Identitas */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/data-operasional")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors shadow-xs"
            title="Kembali ke Tabel Operasional"
          >
            <ArrowLeftIcon className="size-3.5" />
            <span className="hidden sm:inline">Kembali</span>
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-gray-900 dark:text-white">GIS Studio</span>
            <span className="text-gray-400 dark:text-gray-600">/</span>
            <span className="font-semibold text-brand-600 dark:text-brand-400">{estate}</span>
            <span className="text-gray-500 dark:text-gray-400 text-[11px] hidden lg:inline">({region})</span>
            <span className="text-gray-400 dark:text-gray-600 hidden md:inline">/</span>
            <span className="text-gray-600 dark:text-gray-400 hidden md:inline">{afdeling}</span>
            <span className="text-gray-400 dark:text-gray-600">/</span>
            <span className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono font-semibold text-gray-800 dark:text-gray-200 text-[11px]">
              {blok}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 border border-brand-200 dark:border-brand-800 font-semibold text-[10px] uppercase">
              {aktivitas}
            </span>
          </div>
        </div>

        {/* Tengah: Quick Actions Undo / Redo / Reset */}
        <div className="hidden sm:flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-0.5">
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="px-2.5 py-1 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1.5"
            title="Batalkan Perubahan (Ctrl+Z)"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
            <span className="hidden md:inline">Undo</span>
            {history.length > 0 && (
              <span className="text-[10px] font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded text-gray-600 dark:text-gray-300">
                {history.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="px-2.5 py-1 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1.5"
            title="Ulangi Perubahan (Ctrl+Y)"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 7v6h-6" />
              <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
            </svg>
            <span className="hidden md:inline">Redo</span>
            {redoStack.length > 0 && (
              <span className="text-[10px] font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded text-gray-600 dark:text-gray-300">
                {redoStack.length}
              </span>
            )}
          </button>

          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-1 rounded-md text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-white dark:hover:bg-gray-700 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Kembalikan Poligon Master Awal"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span className="hidden md:inline">Reset Master</span>
          </button>
        </div>

        {/* Kanan: Engine Selector, Basemap, Cetak & Simpan */}
        <div className="flex items-center gap-2">
          {/* Engine Selector */}
          <div className="hidden lg:flex items-center">
            <select
              value={spatialEngine}
              onChange={(e) => setSpatialEngine(e.target.value as any)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 outline-none cursor-pointer"
            >
              <option value="RustGIS">GIS Native Engine</option>
              <option value="PythonWorker">Python GeoWorker</option>
              <option value="BrowserGeo">Browser GeoJSON</option>
            </select>
          </div>

          {/* Toggle Basemap */}
          <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setBasemap("satellite")}
              className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${basemap === "satellite"
                ? "bg-white dark:bg-gray-900 text-brand-600 dark:text-brand-400 font-semibold shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              Satelit
            </button>
            <button
              type="button"
              onClick={() => setBasemap("osm")}
              className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${basemap === "osm"
                ? "bg-white dark:bg-gray-900 text-brand-600 dark:text-brand-400 font-semibold shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              Peta Jalan
            </button>
          </div>

          {/* Cetak Peta Kartografi */}
          <button
            type="button"
            onClick={handlePrintMap}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer shadow-xs transition-colors"
            title="Cetak Peta Kartografi A4"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span className="hidden xl:inline">Cetak A4</span>
          </button>

          {/* Simpan */}
          <button
            type="button"
            onClick={() => showNotice(`Perubahan spasial estate ${estate} (${polygons.length} poligon) berhasil disimpan.`)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs cursor-pointer transition-colors"
            title="Simpan Perubahan (Ctrl+S)"
          >
            <FloppyDiscIcon className="size-3.5" />
            <span>Simpan</span>
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          2. WORKSPACE BODY: DOCKING PANEL KIRI & KANVAS PETA
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* DOCKING EDIT PANE KIRI (CLEAN TAILADMIN PANEL) */}
        {sidebarOpen && (
          <aside className="w-80 md:w-88 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex flex-col gap-3.5 overflow-y-auto z-10 shadow-sm">
            {/* Header Pane */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                GIS Control Panel
              </span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs cursor-pointer p-1 rounded-md"
                title="Close Panel"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            {/* ─── FITUR: MULTI-SELECT PANEL REKAPITULASI ────────────────────── */}
            {activeTool === "select" && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/40 p-3.5 space-y-3 text-xs">
                <div className="flex items-center justify-between font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span>Select Polygons</span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800 font-bold">
                    {selectedPolyIds.length} Selected
                  </span>
                </div>

                <div className="rounded-lg bg-white dark:bg-gray-900 p-3 border border-gray-200 dark:border-gray-700 space-y-1.5 shadow-xs">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Total Blok/Bagian:</span>
                    <span className="font-mono font-bold text-gray-800 dark:text-gray-100">
                      {selectedPolyIds.length} Polygons
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">Total Area:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedTotalLuasHa} Ha
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400 font-medium">
                    <span>Selected List:</span>
                    {selectedPolyIds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSelectedPolyIds([])}
                        className="text-brand-600 hover:underline dark:text-brand-400 text-xs cursor-pointer"
                      >
                        Deselect (Esc)
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                    {selectedPolygons.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-mono text-[11px]"
                      >
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="font-bold">{p.blok}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">({p.luas_ha.toFixed(1)} Ha)</span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedPolyIds((prev) => prev.filter((id) => id !== p.id))
                          }
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-0.5 cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                    {selectedPolygons.length === 0 && (
                      <div className="w-full text-center py-2 text-gray-400 dark:text-gray-500 text-xs italic">
                        Click polygons on the map to select...
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    disabled={selectedPolyIds.length === 0}
                    onClick={() => {
                      setMergeSelectedIds(selectedPolyIds);
                      setActiveTool("merge");
                      showNotice(`Switched to Merge for ${selectedPolyIds.length} polygons.`);
                    }}
                    className="w-full py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Merge Selected (M)
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const afdPolys = polygons.filter((p) => (p.afdeling || afdeling) === afdeling);
                        setSelectedPolyIds(afdPolys.map((p) => p.id));
                        showNotice(`Selected ${afdPolys.length} polygons in ${afdeling}.`);
                      }}
                      className="flex-1 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium cursor-pointer transition-colors"
                    >
                      Select All in {afdeling}
                    </button>

                    {selectedPolyIds.length === 1 && (
                      <button
                        type="button"
                        onClick={() => setActiveTool("edit_atribut")}
                        className="flex-1 py-1.5 rounded-lg border border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-300 text-xs font-medium cursor-pointer transition-colors"
                      >
                        Attributes (A)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── FITUR: EDIT ATRIBUT POLIGON (INTI PERKEBUNAN) ──────────── */}
            {activeTool === "edit_atribut" && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/40 p-3.5 space-y-3 text-xs">
                <div className="flex items-center justify-between font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span>Block Attributes</span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                    {activeSelectedPoly.blok}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Block Code:</label>
                    <input
                      type="text"
                      value={attrBlok}
                      onChange={(e) => setAttrBlok(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Estate:</label>
                      <input
                        type="text"
                        value={attrEstate}
                        onChange={(e) => setAttrEstate(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Afdeling:</label>
                      <input
                        type="text"
                        value={attrAfdeling}
                        onChange={(e) => setAttrAfdeling(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Planting Year:</label>
                      <input
                        type="number"
                        value={attrTahunTanam}
                        onChange={(e) => setAttrTahunTanam(Number(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs text-gray-900 dark:text-gray-100 font-mono outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">Area (Ha):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={attrLuasHa}
                        onChange={(e) => setAttrLuasHa(Number(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs text-gray-900 dark:text-gray-100 font-mono outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  {/* Condition (Clean Unified Select with Color Dot) */}
                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">
                      Condition ({aktivitas}):
                    </label>
                    <div className="relative flex items-center">
                      <span
                        className="absolute left-3 size-2.5 rounded-full shrink-0 shadow-xs pointer-events-none ring-1 ring-white dark:ring-gray-900 transition-colors"
                        style={{ backgroundColor: getStatusHexColor(attrKondisi, aktivitas) }}
                      />
                      <select
                        value={attrKondisi}
                        onChange={(e) => setAttrKondisi(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 pl-8 pr-8 py-1.5 text-xs font-semibold text-gray-900 dark:text-gray-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 cursor-pointer transition-colors shadow-xs"
                      >
                        {availableKondisi.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTool("select")}
                    className="flex-1 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!isAttrDirty}
                    onClick={handleSaveAttributes}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors ${isAttrDirty
                      ? "bg-brand-500 hover:bg-brand-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                      }`}
                  >
                    {isAttrDirty ? "Save Attributes" : "No Changes"}
                  </button>
                </div>
              </div>
            )}

            {/* ─── FITUR: CUT / SPLIT POLIGON (TOPOLOGI PRESISI TURF.JS) ─────── */}
            {activeTool === "cut" && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/40 p-3.5 space-y-3 text-xs">
                <div className="flex items-center justify-between font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span>CUT Tool (Topology Split)</span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    {cutPoints.length === 0 ? "Ready" : `${cutPoints.length} Pts`}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Target Block:</span>
                    <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                      {selectedPolygons.map((p) => p.blok).join(", ") || activeSelectedPoly.blok}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Area:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedTotalLuasHa > 0 ? selectedTotalLuasHa : activeSelectedPoly.luas_ha.toFixed(1)} Ha
                    </span>
                  </div>
                </div>

                {/* Status Garis Pemotong Multi-Titik */}
                <div className="space-y-1.5 rounded-lg bg-white dark:bg-gray-900 p-2.5 border border-gray-200 dark:border-gray-700 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Line Status:</span>
                    {cutPoints.length >= 2 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                        Ready to Split ({cutPoints.length} points)
                      </span>
                    ) : cutPoints.length === 1 ? (
                      <span className="text-amber-500 italic text-[11px]">Draw & click next point</span>
                    ) : (
                      <span className="text-gray-400 italic text-[11px]">Click first point</span>
                    )}
                  </div>
                  {cutPoints.length > 0 && (
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800 text-[10px] font-mono text-gray-500">
                      <span>Last Point:</span>
                      <span>
                        {cutPoints[cutPoints.length - 1][0].toFixed(4)}, {cutPoints[cutPoints.length - 1][1].toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                    💡 <b>CUT Guide</b>: Click points across the target polygon contour. Snapping automatically aligns to boundary/TPH. Press <b>Enter</b> or <b>Double-Click</b> to split.
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={cutPoints.length === 0}
                      onClick={() => {
                        setCutPoints([]);
                        showNotice("CUT line cancelled.");
                      }}
                      className="flex-1 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium disabled:opacity-40 cursor-pointer"
                    >
                      Cancel (Esc)
                    </button>
                    <button
                      type="button"
                      disabled={cutPoints.length < 2}
                      onClick={() => executeInstantCut(cutPoints)}
                      className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-40 cursor-pointer transition-colors"
                    >
                      Execute CUT ({cutPoints.length >= 2 ? cutPoints.length : 0})
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ─── FITUR: GABUNG KONDISI (MERGE) ─────────────────────────────── */}
            {activeTool === "merge" && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/40 p-3.5 space-y-3 text-xs">
                <div className="flex items-center justify-between font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span>Gabung Kondisi Poligon</span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    {mergeSelectedIds.length} Terpilih
                  </span>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Pilih wilayah hasil potong atau beberapa blok pada peta untuk menyeragamkan kondisinya. Bagian lain di luar seleksi tidak akan berubah.
                </p>

                {mergeSelectedIds.length > 0 ? (
                  <div className="space-y-2 rounded-lg bg-white dark:bg-gray-900 p-2.5 border border-gray-200 dark:border-gray-700">
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Poligon Terpilih:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {polygons
                        .filter((p) => mergeSelectedIds.includes(p.id))
                        .map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-mono text-[11px]"
                          >
                            <span>{p.blok}</span>
                            <span className="text-[10px] text-gray-500">({p.luas_ha.toFixed(1)} Ha)</span>
                            <button
                              type="button"
                              onClick={() => setMergeSelectedIds((prev) => prev.filter((id) => id !== p.id))}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-0.5 cursor-pointer"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                    </div>
                    <div className="flex justify-between items-center pt-1 text-xs border-t border-gray-100 dark:border-gray-800">
                      <span className="text-gray-500 dark:text-gray-400">Total Luas:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {polygons
                          .filter((p) => mergeSelectedIds.includes(p.id))
                          .reduce((acc, p) => acc + p.luas_ha, 0)
                          .toFixed(1)}{" "}
                        Ha
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
                    Klik blok atau bagian wilayah pada peta untuk memilih...
                  </div>
                )}

                {/* Target Condition (Clean Unified Select with Color Dot) */}
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-1 font-medium">
                    Target Condition ({aktivitas}):
                  </label>
                  <div className="relative flex items-center">
                    <span
                      className="absolute left-3 size-2.5 rounded-full shrink-0 shadow-xs pointer-events-none ring-1 ring-white dark:ring-gray-900 transition-colors"
                      style={{ backgroundColor: getStatusHexColor(mergeKondisi, aktivitas) }}
                    />
                    <select
                      value={mergeKondisi}
                      onChange={(e) => setMergeKondisi(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 pl-8 pr-8 py-1.5 text-xs font-semibold text-gray-900 dark:text-gray-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 cursor-pointer transition-colors shadow-xs"
                    >
                      {availableKondisi.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setMergeSelectedIds([])}
                    disabled={mergeSelectedIds.length === 0}
                    className="flex-1 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium disabled:opacity-40 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyMerge}
                    disabled={mergeSelectedIds.length === 0}
                    className="flex-1 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold disabled:opacity-40 shadow-xs cursor-pointer transition-colors"
                  >
                    Apply Condition
                  </button>
                </div>
              </div>
            )}

            {/* ─── FITUR: MEASURE (PENGUKUR SPASIAL) ─────────────────────────── */}
            {activeTool === "measure" && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/40 p-3.5 space-y-3 text-xs">
                <div className="flex items-center justify-between font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span>Pengukur Jarak & Luas</span>
                  <button
                    type="button"
                    onClick={handleResetRuler}
                    className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400 cursor-pointer"
                  >
                    Reset (Esc)
                  </button>
                </div>

                {/* Option Mode: Measure Distance vs Measure Area */}
                <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-0.5">
                  <button
                    type="button"
                    onClick={() => setMeasureMode("distance")}
                    className={`flex-1 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${measureMode === "distance"
                      ? "bg-white dark:bg-gray-900 text-brand-600 dark:text-brand-400 font-semibold shadow-xs"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                  >
                    📏 Measure Distance (D)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeasureMode("area")}
                    className={`flex-1 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${measureMode === "area"
                      ? "bg-white dark:bg-gray-900 text-brand-600 dark:text-brand-400 font-semibold shadow-xs"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                  >
                    📐 Measure Area (E)
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 space-y-2 shadow-xs">
                  {measureMode === "distance" ? (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Total Distance:</span>
                      <span className="font-mono font-bold text-gray-800 dark:text-gray-100">
                        {totalDistanceMeters.toLocaleString("id-ID")} m
                        <span className="text-[11px] text-gray-500 font-normal ml-1">
                          ({(totalDistanceMeters / 1000).toFixed(2)} Km)
                        </span>
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Total Area:</span>
                      {measureAreaHa > 0 ? (
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {measureAreaHa} Ha
                          <span className="text-[10px] text-gray-500 font-normal ml-1">
                            ({(measureAreaHa * 10000).toLocaleString("id-ID")} m²)
                          </span>
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px] italic">Minimum 3 points</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 font-medium">
                    <span>Titik Koordinat ({measurePoints.length}):</span>
                    {measurePoints.length > 0 && (
                      <button
                        type="button"
                        onClick={handleRemoveLastMeasurePoint}
                        className="text-xs text-rose-600 hover:underline cursor-pointer"
                      >
                        Hapus Titik Terakhir
                      </button>
                    )}
                  </div>

                  <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                    {measurePoints.map((pt, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-1.5 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-[11px] font-mono"
                      >
                        <span className="font-bold text-brand-600 dark:text-brand-400">P{idx + 1}</span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {pt[0].toFixed(5)}, {pt[1].toFixed(5)}
                        </span>
                      </div>
                    ))}
                    {measurePoints.length === 0 && (
                      <div className="p-3 text-center rounded border border-dashed border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 text-xs">
                        Klik titik pada peta untuk mengukur.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}


          </aside>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            KANVAS PETA LEAFLET
            ══════════════════════════════════════════════════════════════════════ */}
        <div ref={mapContainerRef} className="flex-1 h-full w-full bg-gray-200 dark:bg-gray-900 relative z-0" />

        {/* Tombol Buka Panel jika Tertutup */}
        {!sidebarOpen && (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="absolute top-3 left-3 z-20 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-gray-700 dark:text-gray-200 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            title="Buka Panel GIS"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            HELPER HUD BANNER (STANDAR TAILADMIN CAPSULE)
            ════════════════════════════════════════════════════════════════════ */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          {activeTool === "select" && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 px-3.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 shadow-md backdrop-blur-md flex items-center gap-2">
              <span className="size-2 rounded-full bg-brand-500" />
              <span>Mode Seleksi (S): Klik poligon pada peta untuk memilih satu atau beberapa blok.</span>
            </div>
          )}

          {activeTool === "edit_atribut" && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 px-3.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 shadow-md backdrop-blur-md flex items-center gap-2">
              <span className="size-2 rounded-full bg-brand-500" />
              <span>Mode Edit Atribut (A): Ubah kode, luas, kondisi, atau catatan di panel kiri.</span>
            </div>
          )}

          {activeTool === "cut" && (
            <div className="rounded-lg border border-rose-200 dark:border-rose-900 bg-white/95 dark:bg-gray-900/95 px-3.5 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-300 shadow-md backdrop-blur-md flex items-center gap-2">
              <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
              <span>
                {cutPoints.length === 0
                  ? "Mode Potong (C): Klik titik awal garis pemotong pada batas blok..."
                  : "Tarik garis pemotong. Double-Click atau tekan Enter untuk memotong."}
              </span>
            </div>
          )}

          {activeTool === "merge" && (
            <div className="rounded-lg border border-purple-200 dark:border-purple-900 bg-white/95 dark:bg-gray-900/95 px-3.5 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 shadow-md backdrop-blur-md flex items-center gap-2">
              <span className="size-2 rounded-full bg-purple-500" />
              <span>Mode Gabung Kondisi (M): Klik poligon yang ingin diseragamkan kondisinya.</span>
            </div>
          )}

          {activeTool === "measure" && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 px-3.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 shadow-md backdrop-blur-md flex items-center gap-2">
              <span className="size-2 rounded-full bg-brand-500" />
              <span>Mode Ukur (R): Klik titik-titik pada peta untuk ukur Jarak (m) dan Luas Bidang (Ha).</span>
            </div>
          )}
        </div>

        {/* Toast Alert */}
        {notice && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 rounded-lg bg-gray-900 dark:bg-gray-800 text-white border border-gray-700 px-3.5 py-1.5 text-xs font-medium shadow-lg flex items-center gap-2">
            <CheckCircleIcon className="size-4 text-emerald-400" />
            <span>{notice}</span>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            FLOATING LEGENDA PETA RESMI (STANDAR TAILADMIN KANVAS)
            ════════════════════════════════════════════════════════════════════ */}
        <div className="absolute bottom-20 left-4 z-20 rounded-xl border border-gray-200/90 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 p-3 shadow-lg backdrop-blur-md max-w-[280px]">
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-1.5">
            <div className="text-xs font-bold text-gray-800 dark:text-white capitalize">
              Legenda {aktivitas}
            </div>
            <button
              type="button"
              onClick={() => setIsLegendOpen(!isLegendOpen)}
              className="cursor-pointer text-[11px] font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              {isLegendOpen ? "Tutup" : "Buka"}
            </button>
          </div>
          {isLegendOpen && (
            <div className="mt-2 space-y-1.5 text-xs">
              {availableKondisi.map((k) => {
                const hex = getStatusHexColor(k, aktivitas);
                const count = polygons.filter((p) => p.kondisi.toLowerCase() === k.toLowerCase()).length;
                return (
                  <div key={k} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="size-3 shrink-0 rounded-xs shadow-xs"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="text-gray-700 dark:text-gray-300 truncate font-medium">{k}</span>
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-gray-500 dark:text-gray-400 shrink-0">
                      {count} Blok
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            FLOATING TOOLBAR (ENGLISH NOMENCLATURE & DIRECT SHORTCUT BADGES)
            ════════════════════════════════════════════════════════════════════ */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-1 rounded-xl border border-gray-200/90 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 p-1.5 shadow-lg backdrop-blur-md">
          {/* 1. Select */}
          <button
            type="button"
            onClick={() => {
              setActiveTool("select");
              handleCancelInteractiveModes();
              setSidebarOpen(false);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${activeTool === "select"
              ? "bg-brand-500 text-white font-semibold shadow-xs"
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            title="Select (S): Select polygon and inspect blocks (Shift+Click for multi-select)"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m3 3 7 18 3-7 7-3L3 3z" />
            </svg>
            <span>Select</span>
            <span className="text-[10px] opacity-75 font-mono">(S)</span>
          </button>

          {/* 2. Attributes */}
          <button
            type="button"
            onClick={() => {
              setActiveTool("edit_atribut");
              handleCancelInteractiveModes();
              setSidebarOpen(true);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${activeTool === "edit_atribut"
              ? "bg-brand-500 text-white font-semibold shadow-xs"
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            title="Attributes (A): Open Attributes Control Panel"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <span>Attributes</span>
            <span className="text-[10px] opacity-75 font-mono">(A)</span>
          </button>

          {/* 3. CUT */}
          <button
            type="button"
            onClick={() => {
              setActiveTool("cut");
              setCutPoints([]);
              setSidebarOpen(false);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${activeTool === "cut"
              ? "bg-rose-600 text-white font-semibold shadow-xs"
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            title="CUT (C): Split polygon from any side and reclassify zones"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="6" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <line x1="20" y1="4" x2="8.12" y2="15.88" />
              <line x1="14.47" y1="14.48" x2="20" y2="20" />
              <line x1="8.12" y1="8.12" x2="12" y2="12" />
            </svg>
            <span>CUT</span>
            <span className="text-[10px] opacity-75 font-mono">(C)</span>
          </button>

          {/* 4. Merge */}
          <button
            type="button"
            onClick={() => {
              setActiveTool("merge");
              if (selectedPolyIds.length > 0) {
                setMergeSelectedIds(selectedPolyIds);
              } else {
                setMergeSelectedIds([selectedPolyId]);
              }
              setSidebarOpen(false);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${activeTool === "merge"
              ? "bg-purple-600 text-white font-semibold shadow-xs"
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            title="Merge (M): Homogenize conditions for selected polygons"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>Merge</span>
            <span className="text-[10px] opacity-75 font-mono">(M)</span>
          </button>

          <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

          {/* 5. Measure */}
          <button
            type="button"
            onClick={() => {
              setActiveTool("measure");
              handleCancelInteractiveModes();
              setSidebarOpen(false);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${activeTool === "measure"
              ? "bg-brand-500 text-white font-semibold shadow-xs"
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            title="Measure (R): Measure Distance (D) or Area (E)"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-6-6a1 1 0 0 1 0-1.4L13.9 1.3a1 1 0 0 1 1.4 0l6 6a1 1 0 0 1 0 1.4z" />
              <path d="m7.5 10.5 2 2" />
              <path d="m10.5 7.5 2 2" />
              <path d="m13.5 4.5 2 2" />
            </svg>
            <span>Measure</span>
            <span className="text-[10px] opacity-75 font-mono">(R)</span>
          </button>

          {/* Sub Option Measure: Distance vs Area */}
          {activeTool === "measure" && (
            <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setMeasureMode("distance")}
                className={`px-2 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors ${measureMode === "distance"
                  ? "bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300 font-bold"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                title="Measure Distance (D): Measure line distance"
              >
                📏 Distance (D)
              </button>
              <button
                type="button"
                onClick={() => setMeasureMode("area")}
                className={`px-2 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors ${measureMode === "area"
                  ? "bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300 font-bold"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                title="Measure Area (E): Measure polygon area"
              >
                📐 Area (E)
              </button>

              {measurePoints.length > 0 && (
                <div className="flex items-center gap-1.5 ml-1 px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono text-[11px]">
                  {measureMode === "distance" ? (
                    <span className="font-bold text-brand-600 dark:text-brand-400">
                      {totalDistanceMeters.toLocaleString("id-ID")} m
                    </span>
                  ) : (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {measureAreaHa > 0 ? `${measureAreaHa} Ha` : "3+ pts"}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleResetRuler}
                    className="text-gray-400 hover:text-rose-500 cursor-pointer ml-1"
                    title="Reset Measure (Esc)"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL KONFIRMASI ZONASI HASIL SPLIT (TOPOLOGI SEJATI TURF.JS) ─── */}
      {splitModalOpen && pendingTargetPoly && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                  <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="6" cy="6" r="3" />
                    <circle cx="6" cy="18" r="3" />
                    <line x1="20" y1="4" x2="8.12" y2="15.88" />
                    <line x1="14.47" y1="14.48" x2="20" y2="20" />
                    <line x1="8.12" y1="8.12" x2="12" y2="12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Zonasi Kondisi Hasil Potong (Split)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Target: Blok <span className="font-semibold text-brand-600 dark:text-brand-400">{pendingTargetPoly.blok}</span> ({pendingTargetPoly.luas_ha} Ha)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSplitModalOpen(false);
                  setPendingSplitZones([]);
                  setPendingTargetPoly(null);
                }}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
              >
                <XIcon className="size-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
              Blok <strong>{pendingTargetPoly.blok}</strong> telah berhasil dibelah menjadi{" "}
              <strong className="text-brand-600 dark:text-brand-400">{pendingSplitZones.length} zona</strong> secara presisi mengikuti kontur garis potong. Tentukan kondisi operasional untuk masing-masing bagian:
            </p>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 mb-5">
              {pendingSplitZones.map((zone, idx) => {
                const currentChoice = splitConditionsChoices[zone.id] || zone.kondisi;
                const zoneColor = getStatusHexColor(currentChoice, aktivitas);

                return (
                  <div
                    key={zone.id}
                    className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-3.5 rounded-sm border border-white/80 shadow-xs inline-block"
                          style={{ backgroundColor: zoneColor }}
                        />
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-100">
                          {idx === 0 ? "Zona 1 (Wilayah Utama)" : `Zona ${idx + 1}`}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        {zone.areaHa} Ha
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 shrink-0">
                        Kondisi:
                      </label>
                      <select
                        value={currentChoice}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSplitConditionsChoices((prev) => ({
                            ...prev,
                            [zone.id]: val,
                          }));
                        }}
                        className="w-full text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-800 dark:text-gray-100 font-medium focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none cursor-pointer"
                      >
                        {availableKondisi.map((cond) => (
                          <option key={cond} value={cond}>
                            {cond}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => {
                  setSplitModalOpen(false);
                  setPendingSplitZones([]);
                  setPendingTargetPoly(null);
                }}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSplit}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-xs font-semibold text-white shadow-xs cursor-pointer transition-colors"
              >
                Terapkan Zonasi ({pendingSplitZones.length} Bagian)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
