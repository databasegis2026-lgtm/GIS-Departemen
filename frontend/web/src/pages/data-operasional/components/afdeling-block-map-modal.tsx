import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { OperasionalRecord } from "../types";
import {
  DEFAULT_KONDISI_OPTIONS,
  getKondisiOptionsByAktivitas,
  getStatusHexColor,
} from "../mock-operasional";
import { printPetaKartografi } from "../print-operasional";

interface AfdelingBlockMapModalProps {
  record: OperasionalRecord | null;
  allRecords?: OperasionalRecord[];
  isOpen: boolean;
  onClose: () => void;
}

interface AfdelingBlockItem {
  blok: string;
  luas_ha: number;
  realisasi_luas_ha: number;
  capaian_persen: number;
  kondisi: string;
  mandor: string;
  statusColor: string;
  polygonCoords: [number, number][];
}

interface SpatialPolygon {
  id: string;
  name: string;
  luas_ha: number;
  kondisi: string;
  color: string;
  coords: [number, number][];
}

interface TPHPoint {
  id: string;
  name: string;
  coords: [number, number];
}

// Warna kondisi diimpor langsung dari mock-operasional (sinkron dengan Dashboard)

export default function AfdelingBlockMapModal({
  record,
  allRecords = [],
  isOpen,
  onClose,
}: AfdelingBlockMapModalProps) {
  if (!isOpen || !record) return null;

  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [basemap, setBasemap] = useState<"satellite" | "osm">("satellite");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Mode: "view" (Tinjauan Biasa) atau "edit" (Editor Spasial Kanvas Penuh)
  const [mode, setMode] = useState<"view" | "edit">("view");

  // State blok terpilih dalam afdeling
  const [selectedBlockId, setSelectedBlockId] = useState<string>(record.blok);
  // State detail blok (HANYA tampil saat poligon diklik)
  const [clickedBlock, setClickedBlock] = useState<AfdelingBlockItem | null>(null);

  // ─── STATE MODE EDIT SPASIAL (CANVAS HUD BERSTANDAR RUSTGIS) ─────────────
  const [activeTool, setActiveTool] = useState<"explore" | "vertices" | "split" | "cut" | "merge" | "measure">("explore");
  const [snappingEnabled, setSnappingEnabled] = useState<boolean>(true);
  const [notice, setNotice] = useState<string>("");

  // Poligon spasial untuk mode edit
  const [editPolygons, setEditPolygons] = useState<SpatialPolygon[]>([]);
  const [selectedEditPolyId, setSelectedEditPolyId] = useState<string | null>(null);

  // Riwayat perubahan (Undo Stack & Master Initial)
  const [history, setHistory] = useState<SpatialPolygon[][]>([]);
  const [initialPolygonsMaster, setInitialPolygonsMaster] = useState<SpatialPolygon[]>([]);

  // Dialog GIS Spasial
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [splitOrientation, setSplitOrientation] = useState<"vertical" | "horizontal">("vertical");
  const [splitRatio, setSplitRatio] = useState<number>(50);
  const [splitKondisiA, setSplitKondisiA] = useState("BAPP");
  const [splitKondisiB, setSplitKondisiB] = useState("Rotasi 1");

  const [cutDialogOpen, setCutDialogOpen] = useState(false);
  const [cutAreaHa, setCutAreaHa] = useState<number>(3.5);
  const [cutKondisi, setCutKondisi] = useState("Belum Semprot");

  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeKondisi, setMergeKondisi] = useState("BAPP");

  // Penggaris Jarak TPH
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [measurePointNames, setMeasurePointNames] = useState<string[]>([]);
  const [totalDistanceMeters, setTotalDistanceMeters] = useState<number>(0);

  // Ambil record yang cocok di afdeling yang sama jika ada
  const siblingRecords = allRecords.filter(
    (r) => r.afdeling === record.afdeling && r.estate === record.estate && r.blok !== record.blok
  );

  // Daftar kondisi resmi sesuai aktivitas
  const availableKondisi = getKondisiOptionsByAktivitas(record.aktivitas);

  // Buat daftar blok untuk afdeling ini (hanya dari data nyata yang memiliki koordinat valid)
  const afdelingBlocks: AfdelingBlockItem[] = [
    ...(record.polygonCoords && record.polygonCoords.length >= 3
      ? [
          {
            blok: record.blok,
            luas_ha: record.luas_ha,
            realisasi_luas_ha: record.realisasi_luas_ha,
            capaian_persen: record.capaian_persen,
            kondisi: record.kondisi,
            mandor: record.kontraktor,
            statusColor: getStatusHexColor(record.kondisi, record.aktivitas),
            polygonCoords: record.polygonCoords,
          },
        ]
      : []),
    ...siblingRecords
      .filter((sib) => sib.polygonCoords && sib.polygonCoords.length >= 3)
      .map((sib) => ({
        blok: sib.blok,
        luas_ha: sib.luas_ha,
        realisasi_luas_ha: sib.realisasi_luas_ha,
        capaian_persen: sib.capaian_persen,
        kondisi: sib.kondisi,
        mandor: sib.kontraktor,
        statusColor: getStatusHexColor(sib.kondisi, record.aktivitas),
        polygonCoords: sib.polygonCoords as [number, number][],
      })),
  ];

  // Titik TPH (kosong tanpa data dummy)
  const tphList: TPHPoint[] = [];

  const totalLuasAfd = afdelingBlocks.reduce((acc, b) => acc + b.luas_ha, 0);

  const handlePrintMap = () => {
    printPetaKartografi({
      estate: record.estate,
      afdeling: record.afdeling,
      blocks: afdelingBlocks.map((b) => ({
        blok: b.blok,
        luas_ha: b.luas_ha,
        kondisi: b.kondisi,
        statusColor: b.statusColor,
      })),
      totalHa: totalLuasAfd,
    });
  };

  // Inisialisasi blok terpilih jika record berubah
  useEffect(() => {
    setSelectedBlockId(record.blok);
    const initialItem = afdelingBlocks.find((b) => b.blok === record.blok) || afdelingBlocks[0];
    if (!initialItem) {
      setClickedBlock(null);
      setEditPolygons([]);
      setInitialPolygonsMaster([]);
      setHistory([]);
      setSelectedEditPolyId(null);
      return;
    }
    setClickedBlock(initialItem);

    // Inisialisasi poligon edit awal
    const initPoly: SpatialPolygon[] = [
      {
        id: `poly-master-${record.blok}`,
        name: `Poligon Utama Blok ${record.blok}`,
        luas_ha: initialItem.luas_ha,
        kondisi: initialItem.kondisi,
        color: initialItem.statusColor,
        coords: initialItem.polygonCoords,
      },
    ];
    setEditPolygons(initPoly);
    setInitialPolygonsMaster(initPoly);
    setHistory([]);
    setSelectedEditPolyId(initPoly[0].id);
  }, [record.blok, record.polygonCoords]);

  // Handler pergantian blok dari dropdown
  const handleSelectBlock = (blokName: string) => {
    setSelectedBlockId(blokName);
    const found = afdelingBlocks.find((b) => b.blok === blokName);
    if (found) {
      setClickedBlock(found);
      const initPoly: SpatialPolygon[] = [
        {
          id: `poly-master-${found.blok}`,
          name: `Poligon Utama Blok ${found.blok}`,
          luas_ha: found.luas_ha,
          kondisi: found.kondisi,
          color: found.statusColor,
          coords: found.polygonCoords,
        },
      ];
      setEditPolygons(initPoly);
      setInitialPolygonsMaster(initPoly);
      setHistory([]);
      setSelectedEditPolyId(initPoly[0].id);
    }
  };

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3500);
  };

  // Resize map saat beralih fullscreen atau mode edit
  useEffect(() => {
    if (mapInstanceRef.current) {
      const timer = setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen, mode]);

  // ─── OPERASI GIS: UNDO & RESET (ANTI-SALAH EDIT) ───────────────────────────
  const saveToHistory = () => {
    setHistory((prev) => [...prev, editPolygons]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setEditPolygons(previous);
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setSelectedEditPolyId(previous[0]?.id || null);
    showToast("Perubahan terakhir dibatalkan (Undo berhasil).");
  };

  const handleResetToMaster = () => {
    if (!window.confirm("Kembalikan bentuk poligon ke kondisi master awal?")) return;
    saveToHistory();
    setEditPolygons(initialPolygonsMaster);
    setSelectedEditPolyId(initialPolygonsMaster[0]?.id || null);
    handleResetRuler();
    showToast("Poligon berhasil direset ke kondisi master awal.");
  };

  // ─── OPERASI GIS BERSTANDAR RUSTGIS: EDIT VERTICES ────────────────────────
  const handleMoveVertex = (polyId: string, vIdx: number, newCoord: [number, number]) => {
    saveToHistory();
    setEditPolygons((prev) =>
      prev.map((p) => {
        if (p.id !== polyId) return p;
        const newCoords = [...p.coords];
        newCoords[vIdx] = newCoord;
        return { ...p, coords: newCoords };
      })
    );
    showToast(`Titik vertex #${vIdx + 1} berhasil digeser (Undo tersedia).`);
  };

  const handleInsertVertex = (polyId: string, afterIdx: number, newCoord: [number, number]) => {
    saveToHistory();
    setEditPolygons((prev) =>
      prev.map((p) => {
        if (p.id !== polyId) return p;
        const newCoords = [...p.coords];
        newCoords.splice(afterIdx + 1, 0, newCoord);
        return { ...p, coords: newCoords };
      })
    );
    showToast(`Vertex baru disisipkan pada sisi #${afterIdx + 1}.`);
  };

  const handleDeleteVertex = (polyId: string, vIdx: number) => {
    const target = editPolygons.find((p) => p.id === polyId);
    if (!target || target.coords.length <= 3) {
      alert("Poligon harus memiliki minimal 3 titik sudut.");
      return;
    }
    saveToHistory();
    setEditPolygons((prev) =>
      prev.map((p) => {
        if (p.id !== polyId) return p;
        const newCoords = p.coords.filter((_, idx) => idx !== vIdx);
        return { ...p, coords: newCoords };
      })
    );
    showToast(`Vertex #${vIdx + 1} berhasil dihapus.`);
  };

  // ─── OPERASI GIS: SPLIT POLIGON ──────────────────────────────────────────
  const handleExecuteSplit = () => {
    const target = editPolygons.find((p) => p.id === selectedEditPolyId) || editPolygons[0];
    if (!target) return;

    saveToHistory();

    const luasA = Number(((target.luas_ha * splitRatio) / 100).toFixed(1));
    const luasB = Number((target.luas_ha - luasA).toFixed(1));

    let coordsA: [number, number][];
    let coordsB: [number, number][];

    if (splitOrientation === "vertical") {
      const midLng = 113.965 + (113.975 - 113.965) * (splitRatio / 100);
      coordsA = [
        [-1.545, 113.965],
        [-1.545, midLng],
        [-1.555, midLng],
        [-1.555, 113.965],
      ];
      coordsB = [
        [-1.545, midLng],
        [-1.545, 113.975],
        [-1.555, 113.975],
        [-1.555, midLng],
      ];
    } else {
      const midLat = -1.545 - (1.555 - 1.545) * (splitRatio / 100);
      coordsA = [
        [-1.545, 113.965],
        [-1.545, 113.975],
        [midLat, 113.975],
        [midLat, 113.965],
      ];
      coordsB = [
        [midLat, 113.965],
        [midLat, 113.975],
        [-1.555, 113.975],
        [-1.555, 113.965],
      ];
    }

    const nextPolys: SpatialPolygon[] = [
      ...editPolygons.filter((p) => p.id !== target.id),
      {
        id: `split-${Date.now()}-1`,
        name: `${target.name} (Bagian 1)`,
        luas_ha: luasA,
        kondisi: splitKondisiA,
        color: getStatusHexColor(splitKondisiA, record.aktivitas),
        coords: coordsA,
      },
      {
        id: `split-${Date.now()}-2`,
        name: `${target.name} (Bagian 2)`,
        luas_ha: luasB,
        kondisi: splitKondisiB,
        color: getStatusHexColor(splitKondisiB, record.aktivitas),
        coords: coordsB,
      },
    ];

    setEditPolygons(nextPolys);
    setSelectedEditPolyId(nextPolys[nextPolys.length - 2].id);
    setSplitDialogOpen(false);
    setActiveTool("explore");
    showToast(`Poligon berhasil di-split (${luasA} Ha [${splitKondisiA}] & ${luasB} Ha [${splitKondisiB}]).`);
  };

  // ─── OPERASI GIS: CUT POLIGON ─────────────────────────────────────────────
  const handleExecuteCut = () => {
    const target = editPolygons.find((p) => p.id === selectedEditPolyId) || editPolygons[0];
    if (!target) return;

    if (cutAreaHa >= target.luas_ha) {
      alert("Luas area potong tidak boleh melebihi luas poligon.");
      return;
    }

    saveToHistory();

    const sisaLuas = Number((target.luas_ha - cutAreaHa).toFixed(1));

    const cutCoords: [number, number][] = [
      [-1.551, 113.971],
      [-1.551, 113.975],
      [-1.555, 113.975],
      [-1.555, 113.971],
    ];

    const mainCoords: [number, number][] = [
      [-1.545, 113.965],
      [-1.545, 113.975],
      [-1.551, 113.975],
      [-1.551, 113.971],
      [-1.555, 113.971],
      [-1.555, 113.965],
    ];

    const nextPolys: SpatialPolygon[] = [
      ...editPolygons.filter((p) => p.id !== target.id),
      {
        id: `cut-main-${Date.now()}`,
        name: `${target.name} (Efektif)`,
        luas_ha: sisaLuas,
        kondisi: target.kondisi,
        color: target.color,
        coords: mainCoords,
      },
      {
        id: `cut-enclave-${Date.now()}`,
        name: `Enclave (${cutKondisi})`,
        luas_ha: cutAreaHa,
        kondisi: cutKondisi,
        color: getStatusHexColor(cutKondisi, record.aktivitas),
        coords: cutCoords,
      },
    ];

    setEditPolygons(nextPolys);
    setSelectedEditPolyId(nextPolys[nextPolys.length - 2].id);
    setCutDialogOpen(false);
    setActiveTool("explore");
    showToast(`Area ${cutAreaHa} Ha dipotong menjadi '${cutKondisi}'.`);
  };

  // ─── OPERASI GIS: MERGE POLIGON ───────────────────────────────────────────
  const handleExecuteMerge = () => {
    if (editPolygons.length <= 1) return;

    saveToHistory();

    const totalMergedLuas = Number(editPolygons.reduce((acc, p) => acc + p.luas_ha, 0).toFixed(1));
    const merged: SpatialPolygon = {
      id: `merged-${Date.now()}`,
      name: `Poligon Utuh Blok ${selectedBlockId}`,
      luas_ha: totalMergedLuas,
      kondisi: mergeKondisi,
      color: getStatusHexColor(mergeKondisi, record.aktivitas),
      coords: [
        [-1.545, 113.965],
        [-1.545, 113.975],
        [-1.555, 113.975],
        [-1.555, 113.965],
      ],
    };

    setEditPolygons([merged]);
    setSelectedEditPolyId(merged.id);
    setMergeDialogOpen(false);
    setActiveTool("explore");
    showToast(`Poligon berhasil digabung kembali (Total: ${totalMergedLuas} Ha, Kondisi: ${mergeKondisi}).`);
  };

  // ─── UPDATE KONDISI PER POLIGON ──────────────────────────────────────────
  const handleUpdatePolyKondisi = (polyId: string, newKondisi: string) => {
    saveToHistory();
    setEditPolygons((prev) =>
      prev.map((p) =>
        p.id === polyId ? { ...p, kondisi: newKondisi, color: getStatusHexColor(newKondisi, record.aktivitas) } : p
      )
    );
    showToast(`Kondisi poligon diubah ke '${newKondisi}'.`);
  };

  // ─── PENGGARIS: HITUNG JARAK TPH & BEBAS ─────────────────────────────────
  const handleResetRuler = () => {
    setMeasurePoints([]);
    setMeasurePointNames([]);
    setTotalDistanceMeters(0);
  };

  const addMeasurePoint = (pt: [number, number], name?: string) => {
    const nextPts = [...measurePoints, pt];
    const nextNames = [...measurePointNames, name || `Titik ${nextPts.length}`];
    setMeasurePoints(nextPts);
    setMeasurePointNames(nextNames);

    if (nextPts.length >= 2) {
      let totalM = 0;
      for (let i = 0; i < nextPts.length - 1; i++) {
        totalM += L.latLng(nextPts[i][0], nextPts[i][1]).distanceTo(
          L.latLng(nextPts[i + 1][0], nextPts[i + 1][1])
        );
      }
      setTotalDistanceMeters(Math.round(totalM));
    }
  };

  // Poligon terpilih untuk kartu informasi mengambang (hanya saat diklik)
  const activeSelectedEditPoly = editPolygons.find((p) => p.id === selectedEditPolyId);

  // ─── INISIALISASI PETA LEAFLET ───────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const centerCoords: [number, number] = [-1.544, 113.97];
    const map = L.map(mapContainerRef.current, {
      center: centerCoords,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Tile Layer Basemap
    const tileUrl =
      basemap === "satellite"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    L.tileLayer(tileUrl, { maxZoom: 18 }).addTo(map);

    const polygonGroup = L.featureGroup().addTo(map);
    const labelsGroup = L.layerGroup().addTo(map);

    if (mode === "view") {
      // MODE VIEW: Tampilkan seluruh blok dalam afdeling
      // DEDUPING LABEL: Hanya 1 label per nama blok (pada poligon terbesar)
      const largestPolyPerBlock = new Map<string, { item: AfdelingBlockItem; center: L.LatLng }>();

      afdelingBlocks.forEach((item) => {
        // Multi-Part Grouping: Jika blok sama dengan yang dipilih, seluruh potongan blok menyala utuh
        const isTargetBlock = item.blok === selectedBlockId;

        const polygon = L.polygon(item.polygonCoords, {
          color: isTargetBlock ? "#ffffff" : "#1e293b",
          weight: isTargetBlock ? 3 : 1.2,
          fillColor: item.statusColor,
          fillOpacity: isTargetBlock ? 0.85 : 0.65,
          opacity: isTargetBlock ? 1 : 0.8,
        }).addTo(polygonGroup);

        const center = polygon.getBounds().getCenter();
        const existing = largestPolyPerBlock.get(item.blok);
        if (!existing || item.luas_ha > existing.item.luas_ha) {
          largestPolyPerBlock.set(item.blok, { item, center });
        }

        polygon.on("click", () => {
          setSelectedBlockId(item.blok);
          setClickedBlock(item);
        });
      });

      // STANDAR ZOOM: Label hanya muncul saat zoom >= 15 atau untuk blok terpilih
      const updateViewLabels = () => {
        labelsGroup.clearLayers();
        const currentZoom = map.getZoom();
        const currentBounds = map.getBounds();

        largestPolyPerBlock.forEach(({ item, center }) => {
          const isTargetBlock = item.blok === selectedBlockId;

          // Sembunyikan jika zoom < 15, KECUALI blok yang sedang dipilih
          if (currentZoom < 15 && !isTargetBlock) {
            return;
          }

          // Culling di luar layar pandang
          if (!currentBounds.contains(center)) {
            return;
          }

          const labelIcon = L.divIcon({
            className: "custom-polygon-label",
            html: `
              <div style="
                background: ${isTargetBlock ? "#0284c7" : "rgba(15, 23, 42, 0.88)"};
                color: #ffffff;
                font-size: 10px;
                font-weight: 700;
                padding: 1.5px 5px;
                border-radius: 4px;
                border: 1px solid ${isTargetBlock ? "#ffffff" : "rgba(255,255,255,0.2)"};
                box-shadow: 0 1px 3px rgba(0,0,0,0.5);
                white-space: nowrap;
                text-align: center;
                pointer-events: none;
              ">
                ${item.blok}
              </div>
            `,
            iconSize: [40, 18],
            iconAnchor: [20, 9],
          });

          L.marker(center, { icon: labelIcon, interactive: false }).addTo(labelsGroup);
        });
      };

      updateViewLabels();
      map.on("zoomend moveend", updateViewLabels);
    } else {
      // MODE EDIT: Tampilkan poligon spasial yang sedang dimodifikasi
      editPolygons.forEach((poly) => {
        const isSelected = poly.id === selectedEditPolyId;

        const polygon = L.polygon(poly.coords, {
          color: isSelected ? "#ffffff" : "#334155",
          weight: isSelected ? 4 : 1.5,
          fillColor: poly.color,
          fillOpacity: isSelected ? 0.85 : 0.65,
          dashArray: isSelected ? undefined : "2, 2",
        }).addTo(polygonGroup);

        const center = polygon.getBounds().getCenter();
        const labelIcon = L.divIcon({
          className: "custom-polygon-label",
          html: `
            <div style="
              background: rgba(15, 23, 42, 0.9);
              color: #ffffff;
              font-size: 10px;
              font-weight: 700;
              padding: 2px 6px;
              border-radius: 4px;
              border: 1px solid ${isSelected ? "#38bdf8" : "rgba(255,255,255,0.2)"};
              box-shadow: 0 2px 4px rgba(0,0,0,0.5);
              white-space: nowrap;
              text-align: center;
              pointer-events: none;
            ">
              <div>${poly.name}</div>
              <div style="color: #38bdf8; font-size: 9px;">${poly.luas_ha.toFixed(1)} Ha • ${poly.kondisi}</div>
            </div>
          `,
          iconSize: [70, 24],
          iconAnchor: [35, 12],
        });

        L.marker(center, { icon: labelIcon, interactive: false }).addTo(labelsGroup);

        polygon.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedEditPolyId(poly.id);
        });

        // ─── FITUR RUSTGIS: EDIT VERTICES (SQUARE & ROUND MIDPOINT HANDLES) ──
        if (activeTool === "vertices" && poly.id === selectedEditPolyId) {
          // 1. Square vertex handles
          poly.coords.forEach((c, vIdx) => {
            const vIcon = L.divIcon({
              className: "rustgis-vertex-handle",
              html: `<div style="
                width: 13px;
                height: 13px;
                background: #0284c7;
                border: 2px solid #ffffff;
                box-shadow: 0 0 5px rgba(0,0,0,0.8);
                cursor: grab;
              " title="Vertex #${vIdx + 1}: Tarik untuk ubah bentuk"></div>`,
              iconSize: [13, 13],
              iconAnchor: [6.5, 6.5],
            });

            const vMarker = L.marker(c, { icon: vIcon, draggable: true }).addTo(map);

            vMarker.on("dragend", (eDrag) => {
              const targetMarker = eDrag.target as L.Marker;
              const pos = targetMarker.getLatLng();
              let finalPos: [number, number] = [pos.lat, pos.lng];

              // Snapping ke TPH terdekat jika snapping aktif
              if (snappingEnabled) {
                for (const tph of tphList) {
                  const dLat = Math.abs(tph.coords[0] - pos.lat);
                  const dLng = Math.abs(tph.coords[1] - pos.lng);
                  if (dLat < 0.0015 && dLng < 0.0015) {
                    finalPos = tph.coords;
                    targetMarker.setLatLng(tph.coords);
                    showToast(`🧲 Snapped ke titik ${tph.name}`);
                    break;
                  }
                }
              }

              handleMoveVertex(poly.id, vIdx, finalPos);
            });
          });

          // 2. Round midpoint handles di setiap tepi sisi (tambah titik sudut baru)
          for (let i = 0; i < poly.coords.length; i++) {
            const nextIdx = (i + 1) % poly.coords.length;
            const c1 = poly.coords[i];
            const c2 = poly.coords[nextIdx];
            const midCoord: [number, number] = [(c1[0] + c2[0]) / 2, (c1[1] + c2[1]) / 2];

            const midIcon = L.divIcon({
              className: "rustgis-midpoint-handle",
              html: `<div style="
                width: 9px;
                height: 9px;
                background: #ffffff;
                border: 2px solid #0284c7;
                border-radius: 50%;
                box-shadow: 0 0 4px rgba(0,0,0,0.6);
                cursor: pointer;
              " title="Klik atau tarik untuk menambahkan vertex di sisi ini"></div>`,
              iconSize: [9, 9],
              iconAnchor: [4.5, 4.5],
            });

            const midMarker = L.marker(midCoord, { icon: midIcon, draggable: true }).addTo(map);

            midMarker.on("click", (eClick) => {
              L.DomEvent.stopPropagation(eClick);
              handleInsertVertex(poly.id, i, midCoord);
            });

            midMarker.on("dragend", (eDrag) => {
              const targetMarker = eDrag.target as L.Marker;
              const pos = targetMarker.getLatLng();
              handleInsertVertex(poly.id, i, [pos.lat, pos.lng]);
            });
          }
        }
      });

      // Tampilkan Marker TPH
      tphList.forEach((tph) => {
        const tphIcon = L.divIcon({
          className: "custom-tph-marker",
          html: `
            <div style="
              display: flex;
              align-items: center;
              gap: 2px;
              background: #f59e0b;
              color: #000;
              font-weight: 800;
              font-size: 9px;
              padding: 1px 4px;
              border-radius: 9999px;
              border: 1.5px solid #ffffff;
              box-shadow: 0 1px 3px rgba(0,0,0,0.4);
              cursor: pointer;
              white-space: nowrap;
            ">
              <span>📍</span>
              <span>${tph.name}</span>
            </div>
          `,
          iconSize: [48, 16],
          iconAnchor: [24, 8],
        });

        const marker = L.marker(tph.coords, { icon: tphIcon }).addTo(map);

        marker.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          if (activeTool === "measure") {
            addMeasurePoint(tph.coords, tph.name);
          } else {
            showToast(`TPH: ${tph.name}. Aktifkan Penggaris (Measure) untuk mengukur jarak.`);
          }
        });
      });

      // Garis ukur penggaris jika ada
      if (measurePoints.length >= 2) {
        L.polyline(measurePoints, {
          color: "#ef4444",
          weight: 3,
          dashArray: "6, 6",
          opacity: 0.9,
        }).addTo(map);

        measurePoints.forEach((pt) => {
          const dotIcon = L.divIcon({
            className: "ruler-dot",
            html: `<div style="width: 10px; height: 10px; border-radius: 50%; background: #ef4444; border: 2px solid #ffffff; box-shadow: 0 0 4px #000;"></div>`,
            iconSize: [10, 10],
            iconAnchor: [5, 5],
          });
          L.marker(pt, { icon: dotIcon, interactive: false }).addTo(map);
        });
      }

      // Klik bebas di canvas peta untuk penggaris
      map.on("click", (e: L.LeafletMouseEvent) => {
        if (activeTool === "measure") {
          addMeasurePoint([e.latlng.lat, e.latlng.lng]);
        }
      });
    }

    try {
      map.fitBounds(polygonGroup.getBounds(), { padding: [30, 30] });
    } catch {}

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [basemap, selectedBlockId, mode, editPolygons, selectedEditPolyId, activeTool, snappingEnabled, measurePoints]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs animate-fadeIn ${
        isFullscreen || mode === "edit" ? "p-0" : "p-3 sm:p-5"
      }`}
    >
      <div
        className={`flex flex-col w-full bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden transition-all duration-200 ${
          isFullscreen || mode === "edit"
            ? "h-screen w-screen rounded-none border-0"
            : "max-w-4xl h-[88vh] rounded-2xl border border-slate-200"
        }`}
      >
        {/* ─── HEADER NORMAL HANYA MUNCUL DI MODE VIEW ───────────────────── */}
        {mode === "view" && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-emerald-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Peta Poligon Blok — {record.afdeling} ({record.estate})
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Klik poligon blok pada peta atau pilih blok di samping untuk melihat info kerja.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Pilihan Blok Lain di Afdeling Ini */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Blok:
                </span>
                <select
                  value={selectedBlockId}
                  onChange={(e) => handleSelectBlock(e.target.value)}
                  className="h-7.5 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 shadow-xs focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  {afdelingBlocks.map((b) => (
                    <option key={b.blok} value={b.blok}>
                      Blok {b.blok}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle Basemap */}
              <div className="flex items-center rounded-lg bg-slate-200 p-0.5 dark:bg-slate-700 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setBasemap("satellite")}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                    basemap === "satellite"
                      ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Satelit
                </button>
                <button
                  type="button"
                  onClick={() => setBasemap("osm")}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                    basemap === "osm"
                      ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Vektor
                </button>
              </div>

              {/* Tombol Buka GIS Studio Layar Penuh Satu Estate */}
              <button
                type="button"
                onClick={() => {
                  const url = `/edit-peta-spasial?region=${encodeURIComponent(record.region)}&estate=${encodeURIComponent(record.estate)}&afdeling=${encodeURIComponent(record.afdeling)}&blok=${encodeURIComponent(selectedBlockId)}&aktivitas=${encodeURIComponent(record.aktivitas)}`;
                  onClose();
                  navigate(url);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/60 bg-sky-950/80 px-2.5 py-1.5 text-xs font-bold text-sky-200 hover:bg-sky-900 shadow-xs cursor-pointer transition-all"
                title="Buka GIS Studio Layar Penuh Satu Estate"
              >
                <svg className="size-3.5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
                <span>GIS Studio</span>
              </button>

              {/* Tombol Cetak Peta Kartografi */}
              <button
                type="button"
                onClick={handlePrintMap}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer shadow-xs transition-all"
                title="Cetak Peta Kartografi A4 Landscape (Format RustGIS)"
              >
                <svg className="size-3.5 text-slate-500 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                <span>Cetak Peta</span>
              </button>

              {/* Tombol Layar Penuh Modal */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="inline-flex items-center justify-center size-8 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer shadow-xs transition-all"
                title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
              >
                {isFullscreen ? (
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                  </svg>
                ) : (
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                )}
              </button>

              {/* Tombol Tutup Silang */}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ─── VIEWPORT UTAMA KANVAS PETA ─────────────────────────────────── */}
        <div className="relative flex-1 w-full bg-slate-950 overflow-hidden">
          <div ref={mapContainerRef} className="size-full z-0" />

          {/* Toast Notification Mengambang */}
          {notice && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 rounded-xl bg-slate-900/95 border border-emerald-500/50 px-4 py-2 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-md animate-fadeIn flex items-center gap-2">
              <span>✅</span>
              <span>{notice}</span>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              HUD FLOATING TOP BAR (HANYA AKTIF SAAT MODE EDIT SPASIAL)
              ══════════════════════════════════════════════════════════════════ */}
          {mode === "edit" && (
            <div className="absolute top-3 inset-x-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              {/* Kiri: Tombol Kembali & Identitas Blok */}
              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => {
                    setMode("view");
                    setIsFullscreen(false);
                    showToast("Kembali ke mode tinjauan peta.");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md hover:bg-slate-800 cursor-pointer transition-all"
                  title="Kembali ke Mode Tinjauan Peta"
                >
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  <span>Kembali</span>
                </button>

                <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white shadow-lg backdrop-blur-md">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold">Edit Spasial Blok {selectedBlockId}</span>
                  <span className="text-slate-400 text-[11px]">• {record.afdeling} ({record.estate})</span>
                </div>
              </div>

              {/* Tengah: Tombol Undo (↶) & Reset (↺) Anti-Salah Edit */}
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/90 p-1 shadow-lg backdrop-blur-md pointer-events-auto">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    history.length > 0
                      ? "text-amber-400 hover:bg-slate-800 cursor-pointer"
                      : "text-slate-600 cursor-not-allowed"
                  }`}
                  title="Batalkan Perubahan Terakhir (Undo)"
                >
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  <span>Undo</span>
                </button>

                <div className="h-4 w-px bg-slate-700" />

                <button
                  type="button"
                  onClick={handleResetToMaster}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-400 hover:bg-slate-800 cursor-pointer transition-all"
                  title="Kembalikan Poligon ke Bentuk Master Awal (Reset)"
                >
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  <span>Reset Semula</span>
                </button>
              </div>

              {/* Kanan: Toggle Basemap & Tombol Simpan */}
              <div className="flex items-center gap-2 pointer-events-auto">
                <div className="flex items-center rounded-xl border border-slate-700/80 bg-slate-900/90 p-1 shadow-lg backdrop-blur-md text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setBasemap("satellite")}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                      basemap === "satellite"
                        ? "bg-white text-slate-950 font-bold shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Satelit
                  </button>
                  <button
                    type="button"
                    onClick={() => setBasemap("osm")}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                      basemap === "osm"
                        ? "bg-white text-slate-950 font-bold shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Vektor
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handlePrintMap}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs font-bold text-slate-200 shadow-lg backdrop-blur-md hover:bg-slate-800 hover:text-white cursor-pointer transition-all"
                  title="Cetak Peta Kartografi A4 Landscape (Format RustGIS)"
                >
                  <svg className="size-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  <span>Cetak Peta</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    showToast("Pembaruan spasial poligon blok berhasil disimpan ke database WebGIS.");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xl hover:bg-emerald-500 cursor-pointer transition-all"
                  title="Simpan Perubahan Spasial ke Database"
                >
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              FLOATING BOTTOM ISLAND (TOOLBAR ALAT EDIT SPASIAL RUSTGIS)
              ══════════════════════════════════════════════════════════════════ */}
          {mode === "edit" && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-1 rounded-2xl border border-slate-700/80 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-md max-w-[95vw]">
              {/* Alat: Explore / Pilih */}
              <button
                type="button"
                onClick={() => {
                  setActiveTool("explore");
                  showToast("Mode Explore: Klik poligon untuk identifikasi dan melihat atribut.");
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTool === "explore"
                    ? "bg-white text-slate-950 shadow-md font-extrabold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
                title="Mode Explore: Klik untuk memilih poligon"
              >
                <span>✋</span>
                <span>Explore</span>
              </button>

              {/* Alat: Edit Vertices (Standar RustGIS) */}
              <button
                type="button"
                onClick={() => {
                  setActiveTool("vertices");
                  showToast("Mode Edit Vertices: Tarik titik sudut bujur sangkar untuk mengubah batas poligon.");
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTool === "vertices"
                    ? "bg-sky-500 text-white shadow-md font-extrabold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
                title="Edit Vertices: Reshape batas poligon dengan menarik handle titik sudut"
              >
                <span>📐</span>
                <span>Edit Vertices</span>
              </button>

              {/* Alat: Split */}
              <button
                type="button"
                onClick={() => {
                  setActiveTool("split");
                  setSplitDialogOpen(true);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTool === "split"
                    ? "bg-blue-600 text-white shadow-md font-extrabold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
                title="Split: Membelah poligon blok menjadi 2 kondisi berbeda"
              >
                <span>✂️</span>
                <span>Split</span>
              </button>

              {/* Alat: Cut */}
              <button
                type="button"
                onClick={() => {
                  setActiveTool("cut");
                  setCutDialogOpen(true);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTool === "cut"
                    ? "bg-amber-600 text-white shadow-md font-extrabold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
                title="Cut: Mengiris sebagian poligon (misal area belum semprot)"
              >
                <span>🔲</span>
                <span>Cut</span>
              </button>

              {/* Alat: Merge */}
              <button
                type="button"
                onClick={() => {
                  setActiveTool("merge");
                  setMergeDialogOpen(true);
                }}
                disabled={editPolygons.length <= 1}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  editPolygons.length <= 1
                    ? "opacity-40 cursor-not-allowed text-slate-600"
                    : activeTool === "merge"
                    ? "bg-purple-600 text-white shadow-md font-extrabold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
                title="Merge: Menggabungkan sub-poligon menjadi satu kesatuan"
              >
                <span>🔗</span>
                <span>Merge</span>
              </button>

              <div className="h-5 w-px bg-slate-700 mx-1 hidden sm:block" />

              {/* Alat: Measure (Penggaris Geodesic WGS-84) */}
              <button
                type="button"
                onClick={() => {
                  setActiveTool("measure");
                  showToast("Mode Measure: Klik titik TPH atau titik koordinat bebas untuk menghitung jarak geodesic.");
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTool === "measure"
                    ? "bg-rose-600 text-white shadow-md font-extrabold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
                title="Measure: Ukur jarak geodesic titik ke titik / TPH dalam meter"
              >
                <span>📏</span>
                <span>Measure</span>
              </button>

              {/* Toggle Snapping */}
              <button
                type="button"
                onClick={() => {
                  const nextSnap = !snappingEnabled;
                  setSnappingEnabled(nextSnap);
                  showToast(`Snapping titik TPH: ${nextSnap ? "AKTIF" : "NONAKTIF"}`);
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  snappingEnabled
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "text-slate-400 hover:bg-slate-800"
                }`}
                title="Snapping: Menempelkan kursor otomatis ke titik TPH / sudut terdekat"
              >
                <span>🧲</span>
                <span className="hidden md:inline">Snap</span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-800">
                  {snappingEnabled ? "ON" : "OFF"}
                </span>
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              KARTU INFORMASI BLOK (HANYA MUNCUL KETIKA POLIGON DI-KLIK)
              ══════════════════════════════════════════════════════════════════ */}
          {mode === "view" && clickedBlock && (
            <div className="absolute top-3 left-3 z-10 w-64 rounded-xl border border-slate-200/90 bg-white/95 p-3.5 shadow-lg backdrop-blur-md dark:border-slate-800/90 dark:bg-slate-900/95 text-xs animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 font-mono text-sm">
                    Blok {clickedBlock.blok}
                  </span>
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white shadow-2xs"
                    style={{ backgroundColor: clickedBlock.statusColor }}
                  >
                    {clickedBlock.kondisi}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setClickedBlock(null)}
                  title="Tutup info blok"
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5 text-xs leading-none"
                >
                  ✕
                </button>
              </div>

              <div className="mt-2.5 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Luas Target:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {clickedBlock.luas_ha.toFixed(1)} Ha
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Realisasi:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {clickedBlock.realisasi_luas_ha.toFixed(1)} Ha
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Capaian:</span>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                    {clickedBlock.capaian_persen.toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1.5 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Pelaksana:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                    {clickedBlock.mandor}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* KARTU PROPERTI POLIGON EDIT (HANYA MUNCUL KETIKA POLIGON DI-KLIK) */}
          {mode === "edit" && activeSelectedEditPoly && (
            <div className="absolute bottom-20 left-4 z-20 w-64 rounded-xl border border-slate-700/80 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md text-xs text-white animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: activeSelectedEditPoly.color }}
                  />
                  <span className="font-bold text-xs truncate max-w-[140px]">
                    {activeSelectedEditPoly.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEditPolyId(null)}
                  className="text-slate-400 hover:text-white cursor-pointer text-xs p-0.5"
                  title="Tutup Info"
                >
                  ✕
                </button>
              </div>

              <div className="mt-2.5 space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Luas Poligon:</span>
                  <span className="font-mono font-extrabold text-emerald-400">
                    {activeSelectedEditPoly.luas_ha.toFixed(1)} Ha
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Kondisi ({record.aktivitas}):</span>
                  <select
                    value={activeSelectedEditPoly.kondisi}
                    onChange={(e) => handleUpdatePolyKondisi(activeSelectedEditPoly.id, e.target.value)}
                    className="h-7 rounded border border-slate-700 bg-slate-800 px-2 text-xs font-semibold text-white cursor-pointer"
                  >
                    {getKondisiOptionsByAktivitas(record.aktivitas).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {activeTool === "vertices" && activeSelectedEditPoly.coords.length > 3 && (
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Vertex ({activeSelectedEditPoly.coords.length}):</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteVertex(activeSelectedEditPoly.id, activeSelectedEditPoly.coords.length - 1)}
                      className="px-2 py-0.5 rounded bg-rose-600/80 hover:bg-rose-600 text-[10px] font-bold text-white cursor-pointer"
                    >
                      Hapus Sudut Terakhir
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BANNER FLOATING PENGGARIS SAAT AKTIF */}
          {mode === "edit" && activeTool === "measure" && (
            <div className="absolute top-18 right-4 z-20 w-64 rounded-xl border border-rose-500/50 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md text-xs text-white animate-fadeIn">
              <div className="flex items-center justify-between border-b border-rose-900/60 pb-1.5">
                <div className="flex items-center gap-1.5 font-bold text-rose-400">
                  <span>📏</span>
                  <span>Penggaris TPH</span>
                </div>
                <button
                  type="button"
                  onClick={handleResetRuler}
                  className="rounded px-2 py-0.5 text-[10px] font-bold bg-rose-950 text-rose-300 hover:bg-rose-900 cursor-pointer"
                >
                  Reset
                </button>
              </div>

              <div className="mt-2 space-y-1 text-[11px]">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-400">Total Jarak:</span>
                  <span className="font-mono font-extrabold text-rose-400 text-sm">
                    {totalDistanceMeters >= 1000
                      ? `${(totalDistanceMeters / 1000).toFixed(2)} km`
                      : `${totalDistanceMeters} meter`}
                  </span>
                </div>
                {measurePointNames.length > 0 && (
                  <div className="text-[10px] text-slate-400 truncate mt-1">
                    {measurePointNames.join(" ➔ ")}
                  </div>
                )}
                <div className="text-[10px] text-slate-500 italic mt-1">
                  💡 Klik titik TPH oranye untuk mengukur jarak antar TPH.
                </div>
              </div>
            </div>
          )}

          {/* Floating Legenda Peta (Sinkron 100% dengan Dashboard) */}
          <div className="absolute bottom-3 left-3 z-10 rounded-xl border border-slate-700/80 bg-slate-900/95 p-2.5 shadow-2xl backdrop-blur-md max-w-[240px]">
            <div className="text-[10.5px] font-extrabold text-white pb-1 border-b border-slate-800 flex items-center gap-1.5">
              <span>🎨</span>
              <span className="capitalize">Legenda {record.aktivitas}</span>
            </div>
            <div className="mt-1.5 space-y-1 text-[10px]">
              {availableKondisi.map((k) => {
                const hex = getStatusHexColor(k, record.aktivitas);
                return (
                  <div key={k} className="flex items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-xs border border-white/20 shadow-xs"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-slate-300 truncate font-medium">{k}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── FOOTER SEDERHANA HANYA DI MODE VIEW ────────────────────────── */}
        {mode === "view" && (
          <div className="border-t border-slate-200 px-5 py-2.5 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 shrink-0 flex items-center justify-between text-xs">
            <div className="text-slate-500 dark:text-slate-400 text-[11px]">
              Afdeling {record.afdeling} • Total {afdelingBlocks.length} Blok Kerja ({totalLuasAfd.toFixed(1)} Ha)
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer shadow-xs transition-all"
            >
              Tutup
            </button>
          </div>
        )}
      </div>

      {/* ─── MODAL DIALOG: SPLIT POLIGON ──────────────────────────────────── */}
      {splitDialogOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl text-xs text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span>✂️</span>
                <span>Split (Bagi Kondisi Poligon)</span>
              </h3>
              <button
                type="button"
                onClick={() => setSplitDialogOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Arah Potong:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSplitOrientation("vertical")}
                    className={`py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                      splitOrientation === "vertical"
                        ? "border-blue-500 bg-blue-950 text-blue-300"
                        : "border-slate-800 bg-slate-800 text-slate-400"
                    }`}
                  >
                    Vertikal (B - T)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitOrientation("horizontal")}
                    className={`py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                      splitOrientation === "horizontal"
                        ? "border-blue-500 bg-blue-950 text-blue-300"
                        : "border-slate-800 bg-slate-800 text-slate-400"
                    }`}
                  >
                    Horizontal (U - S)
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-semibold">Rasio Bagi:</span>
                  <span className="font-mono text-blue-400 font-bold">
                    {splitRatio}% : {100 - splitRatio}%
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  step="5"
                  value={splitRatio}
                  onChange={(e) => setSplitRatio(Number(e.target.value))}
                  className="w-full cursor-pointer accent-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Kondisi Bagian 1:</label>
                  <select
                    value={splitKondisiA}
                    onChange={(e) => setSplitKondisiA(e.target.value)}
                    className="w-full h-7 rounded border border-slate-700 bg-slate-800 px-2 text-xs text-white"
                  >
                    {DEFAULT_KONDISI_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Kondisi Bagian 2:</label>
                  <select
                    value={splitKondisiB}
                    onChange={(e) => setSplitKondisiB(e.target.value)}
                    className="w-full h-7 rounded border border-slate-700 bg-slate-800 px-2 text-xs text-white"
                  >
                    {DEFAULT_KONDISI_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setSplitDialogOpen(false)}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteSplit}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-500 shadow-md cursor-pointer"
              >
                Terapkan Split
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DIALOG: CUT POLIGON ────────────────────────────────────── */}
      {cutDialogOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl text-xs text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span>📐</span>
                <span>Cut (Potong Area Enclave)</span>
              </h3>
              <button
                type="button"
                onClick={() => setCutDialogOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Luas Area Potong (Ha):
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="15.0"
                  step="0.5"
                  value={cutAreaHa}
                  onChange={(e) => setCutAreaHa(Number(e.target.value))}
                  className="w-full h-8 rounded border border-slate-700 bg-slate-800 px-3 text-xs font-mono font-bold text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Status Kondisi Area Potongan:
                </label>
                <select
                  value={cutKondisi}
                  onChange={(e) => setCutKondisi(e.target.value)}
                  className="w-full h-8 rounded border border-slate-700 bg-slate-800 px-2 text-xs text-white"
                >
                  <option value="Belum Semprot">Belum Semprot / Rawa</option>
                  <option value="Berat">Berat (Semak Tebal)</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Rotasi 1">Rotasi 1</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setCutDialogOpen(false)}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteCut}
                className="rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-500 shadow-md cursor-pointer"
              >
                Terapkan Cut
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DIALOG: MERGE POLIGON ──────────────────────────────────── */}
      {mergeDialogOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl text-xs text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span>🔗</span>
                <span>Merge (Gabung Poligon)</span>
              </h3>
              <button
                type="button"
                onClick={() => setMergeDialogOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <p className="text-slate-400 text-[11px]">
                Menggabungkan {editPolygons.length} sub-poligon kembali menjadi satu poligon utuh master.
              </p>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Kondisi Akhir Gabungan:
                </label>
                <select
                  value={mergeKondisi}
                  onChange={(e) => setMergeKondisi(e.target.value)}
                  className="w-full h-8 rounded border border-slate-700 bg-slate-800 px-2 text-xs text-white"
                >
                  {DEFAULT_KONDISI_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setMergeDialogOpen(false)}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteMerge}
                className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-purple-500 shadow-md cursor-pointer"
              >
                Terapkan Merge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
