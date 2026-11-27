import { useRef, useState } from "react";
import type { AktivitasType, OperasionalRecord } from "../types";

interface SpatialUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (
    fileName: string,
    targetAktivitas: string,
    estate: string,
    createdRecords?: OperasionalRecord[]
  ) => void;
  currentAktivitas: AktivitasType;
}

// Deteksi otomatis tipe aktivitas dari nama berkas atau properti
function detectAktivitasFromContext(fileName: string, currentTab: string): OperasionalRecord["aktivitas"] {
  const f = fileName.toLowerCase();
  if (f.includes("semprot")) return "semprot";
  if (f.includes("pupuk") || f.includes("pemupukan")) return "pemupukan";
  if (f.includes("pasar") || f.includes("pikul") || f.includes("pasarpikul")) return "pasar_pikul";
  if (f.includes("jangkos")) return "jangkos";
  if (f.includes("pruning")) return "pruning";
  if (f.includes("produksi") || f.includes("panen")) return "produksi";

  if (currentTab && currentTab !== "all") {
    return currentTab as OperasionalRecord["aktivitas"];
  }
  return "pruning";
}

// Helper untuk mengekstrak koordinat poligon ke format Leaflet [lat, lng][]
function extractPolygonCoords(geometry: any): [number, number][] | undefined {
  if (!geometry) return undefined;

  let geom = geometry;
  if (geom.type === "GeometryCollection" && Array.isArray(geom.geometries)) {
    geom = geom.geometries.find(
      (g: any) => g && (g.type === "Polygon" || g.type === "MultiPolygon")
    );
    if (!geom) return undefined;
  }

  if (!geom.coordinates) return undefined;

  let ring: any[] = [];
  if (geom.type === "Polygon" && Array.isArray(geom.coordinates[0])) {
    ring = geom.coordinates[0];
  } else if (geom.type === "MultiPolygon" && Array.isArray(geom.coordinates)) {
    // Pilih bagian MultiPolygon dengan jumlah titik terbanyak (outer ring utama)
    for (const poly of geom.coordinates) {
      if (Array.isArray(poly?.[0]) && poly[0].length > ring.length) {
        ring = poly[0];
      }
    }
  }

  if (ring && ring.length >= 3) {
    // GeoJSON adalah [lng, lat], Leaflet memerlukan [lat, lng]
    const converted = ring
      .filter(
        (pt) =>
          Array.isArray(pt) &&
          pt.length >= 2 &&
          Number.isFinite(Number(pt[0])) &&
          Number.isFinite(Number(pt[1])) &&
          Math.abs(Number(pt[1])) <= 90 &&
          Math.abs(Number(pt[0])) <= 180
      )
      .map((pt) => [Number(pt[1]), Number(pt[0])] as [number, number]);

    return converted.length >= 3 ? converted : undefined;
  }
  return undefined;
}

// Helper untuk menentukan Region berdasarkan Estate
function getRegionForEstate(est: string): string {
  if (est === "BSL") return "REGION 3";
  if (["BUM 5", "BUM 6", "BUM 7"].includes(est)) return "REGION 2";
  if (["BUM 3", "BUM 8"].includes(est)) return "REGION 3";
  return "REGION 1";
}

export default function SpatialUploadModal({
  isOpen,
  onClose,
  onSuccess,
  currentAktivitas,
}: SpatialUploadModalProps) {
  if (!isOpen) return null;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAktivitas, setSelectedAktivitas] = useState<OperasionalRecord["aktivitas"]>(
    currentAktivitas === "all" ? "pruning" : (currentAktivitas as OperasionalRecord["aktivitas"])
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMsg("");
      // Otomatis deteksi aktivitas saat file dipilih
      const autoAkt = detectAktivitasFromContext(file.name, currentAktivitas);
      setSelectedAktivitas(autoAkt);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedFile) {
      setErrorMsg("Pilih berkas Shapefile terkompresi (.zip) atau GeoJSON (.geojson).");
      return;
    }

    setIsProcessing(true);
    setStatusMsg("Mempersiapkan pembacaan data spasial...");

    try {
      let createdRecords: OperasionalRecord[] = [];
      const fileName = selectedFile.name;
      const nameLower = fileName.toLowerCase();
      const defaultAktivitas = selectedAktivitas;
      const today = new Date().toISOString().slice(0, 10);
      let detectedEstate = "BUM 1";

      if (nameLower.endsWith(".zip")) {
        setStatusMsg("Membongkar arsip Shapefile (.shp & .dbf)...");
        const arrayBuffer = await selectedFile.arrayBuffer();
        const shpModule: any = await import("shpjs");
        const shp = shpModule.default || shpModule;
        const parsed = await shp(arrayBuffer);

        let features: any[] = [];
        if (Array.isArray(parsed)) {
          features = parsed.flatMap((fc: any) => fc.features || []);
        } else if (parsed && parsed.features) {
          features = parsed.features;
        }

        if (features.length === 0) {
          throw new Error("Tidak ditemukan fitur poligon spasial dalam berkas Shapefile ini.");
        }

        setStatusMsg(`Mengekstrak ${features.length} poligon blok dan atribut...`);

        createdRecords = features.map((f: any, idx: number) => {
          const p = f.properties || {};
          const est = p.ESTATE || p.Estate || p.estate || "BUM 1";
          const rawAfd = p.AFD || p.Afdeling || p.afdeling;
          const afd = rawAfd ? String(rawAfd).trim() : "AFD 1";

          // Cek field BLOK
          const rawBlok = p.BLOK ?? p.Blok ?? p.blok ?? p.BLOCK ?? p.NAME;
          const hasBlok = rawBlok !== undefined && rawBlok !== null && String(rawBlok).trim() !== "";
          const blokName = hasBlok ? String(rawBlok).trim() : `BLOK-${idx + 1} (Belum Ada Nama)`;

          // Cek variasi field Luas: LuasHA, luas, Luas_Ha, LUAS_HA, Luas, HA, dsb.
          const rawLuas = p.LuasHA ?? p.Luas_Ha ?? p.LUAS_HA ?? p.luas ?? p.Luas ?? p.LUAS ?? p.HA;
          const luasHa = (rawLuas !== undefined && rawLuas !== null && !isNaN(Number(rawLuas)))
            ? Number(rawLuas)
            : 0;

          // Cek variasi field Realisasi: Realiluas, RL_Luas_Ha, RL_Luas, realluas, Realuas_Ha, Realisasi, dsb.
          const rawReal = p.Realiluas ?? p.RL_Luas_Ha ?? p.RL_Luas ?? p.realluas ?? p.Realuas_Ha ?? p.Realisasi ?? p.REALISASI ?? p.REAL_HA ?? p.REAL;
          const realisasiHa = (rawReal !== undefined && rawReal !== null && !isNaN(Number(rawReal)))
            ? Number(rawReal)
            : (luasHa > 0 ? luasHa : 0);

          const pct = luasHa > 0 ? Number(((realisasiHa / luasHa) * 100).toFixed(1)) : 100;
          const reg = p.REGION || p.Region || p.region || getRegionForEstate(est);
          const act = (p.AKTIVITAS || p.Aktivitas || defaultAktivitas) as OperasionalRecord["aktivitas"];
          const coords = extractPolygonCoords(f.geometry);

          // Cek kondisi: KONDISI, KATAGORI, STATUS, KET, dsb.
          const rawKondisi = p.KONDISI ?? p.Kondisi ?? p.KATAGORI ?? p.Katagori ?? p.STATUS ?? p.Status ?? p.KET ?? p.Ket;
          let kondisi = "Belum ada data";
          if (rawKondisi !== undefined && rawKondisi !== null && String(rawKondisi).trim() !== "") {
            kondisi = String(rawKondisi).trim();
          } else if (luasHa > 0) {
            kondisi = pct >= 100 ? "BAPP" : "Progresif";
          }

          // Catatan keterangan jika ada field yang kosong
          const missingFields: string[] = [];
          if (!hasBlok) missingFields.push("Nama Blok");
          if (luasHa === 0) missingFields.push("Luas");
          if (!rawKondisi || String(rawKondisi).trim() === "") missingFields.push("Kondisi");

          let keterangan = `Diunggah dari ${fileName}`;
          if (missingFields.length > 0) {
            keterangan += ` (Belum ada data: ${missingFields.join(", ")})`;
          }

          if (idx === 0) {
            detectedEstate = est;
          }

          return {
            id: `shp-upload-${Date.now()}-${idx}`,
            region: reg,
            estate: est,
            afdeling: String(afd),
            blok: String(blokName),
            warung: p.WARUNG || p.Warung || `Warung ${afd}`,
            luas_ha: luasHa,
            realisasi_luas_ha: realisasiHa,
            capaian_persen: pct,
            sph: Number(p.SPH || p.POKOK || 136),
            kondisi: kondisi,
            kontraktor: p.KONTRAKTOR || "Mandor Lapangan",
            update_peta: today,
            periode: "Rotasi 1 2026",
            tanggal: today,
            keterangan: keterangan,
            aktivitas: act,
            polygonCoords: coords,
          };
        });
      } else if (nameLower.endsWith(".geojson") || nameLower.endsWith(".json")) {
        setStatusMsg("Membaca berkas GeoJSON...");
        const text = await selectedFile.text();
        const parsed = JSON.parse(text);
        const features = parsed.features || (Array.isArray(parsed) ? parsed : []);

        if (features.length === 0) {
          throw new Error("Tidak ditemukan fitur spasial dalam berkas GeoJSON.");
        }

        setStatusMsg(`Mengekstrak ${features.length} fitur GeoJSON...`);

        createdRecords = features.map((f: any, idx: number) => {
          const p = f.properties || {};
          const est = p.ESTATE || p.Estate || p.estate || "BUM 1";
          const rawAfd = p.AFD || p.Afdeling || p.afdeling;
          const afd = rawAfd ? String(rawAfd).trim() : "AFD 1";

          const rawBlok = p.BLOK ?? p.Blok ?? p.blok ?? p.NAME;
          const hasBlok = rawBlok !== undefined && rawBlok !== null && String(rawBlok).trim() !== "";
          const blokName = hasBlok ? String(rawBlok).trim() : `BLOK-${idx + 1} (Belum Ada Nama)`;

          const rawLuas = p.LUAS_HA ?? p.Luas ?? p.luas ?? p.Luas_Ha ?? p.HA;
          const luasHa = (rawLuas !== undefined && rawLuas !== null && !isNaN(Number(rawLuas)))
            ? Number(rawLuas)
            : 0;

          const rawReal = p.REALISASI ?? p.realisasi ?? p.RL_Luas ?? p.realluas;
          const realisasiHa = (rawReal !== undefined && rawReal !== null && !isNaN(Number(rawReal)))
            ? Number(rawReal)
            : (luasHa > 0 ? luasHa : 0);

          const reg = p.REGION || p.Region || getRegionForEstate(est);
          const act = (p.AKTIVITAS || p.Aktivitas || defaultAktivitas) as OperasionalRecord["aktivitas"];
          const coords = extractPolygonCoords(f.geometry);

          const rawKondisi = p.KONDISI ?? p.Kondisi ?? p.KATAGORI ?? p.STATUS ?? p.Status;
          let kondisi = "Belum ada data";
          if (rawKondisi !== undefined && rawKondisi !== null && String(rawKondisi).trim() !== "") {
            kondisi = String(rawKondisi).trim();
          } else if (luasHa > 0) {
            kondisi = realisasiHa >= luasHa ? "BAPP" : "Progresif";
          }

          const missingFields: string[] = [];
          if (!hasBlok) missingFields.push("Nama Blok");
          if (luasHa === 0) missingFields.push("Luas");
          if (!rawKondisi || String(rawKondisi).trim() === "") missingFields.push("Kondisi");

          let keterangan = `Diunggah dari ${fileName}`;
          if (missingFields.length > 0) {
            keterangan += ` (Belum ada data: ${missingFields.join(", ")})`;
          }

          if (idx === 0) {
            detectedEstate = est;
          }

          return {
            id: `shp-upload-${Date.now()}-${idx}`,
            region: reg,
            estate: est,
            afdeling: String(afd),
            blok: String(blokName),
            warung: p.WARUNG || `Warung ${afd}`,
            luas_ha: luasHa,
            realisasi_luas_ha: realisasiHa,
            capaian_persen: luasHa > 0 ? Number(((realisasiHa / luasHa) * 100).toFixed(1)) : 100,
            sph: Number(p.SPH || 136),
            kondisi: kondisi,
            kontraktor: p.KONTRAKTOR || "Mandor Lapangan",
            update_peta: today,
            periode: "Rotasi 1 2026",
            tanggal: today,
            keterangan: keterangan,
            aktivitas: act,
            polygonCoords: coords,
          };
        });
      } else {
        throw new Error(
          "Format berkas tidak didukung. Harap unggah berkas Shapefile terkompresi (.zip memuat .shp & .dbf) atau GeoJSON (.geojson)."
        );
      }

      setStatusMsg("Menyinkronkan data spasial ke sistem...");
      await new Promise((r) => setTimeout(r, 300));

      onSuccess(fileName, defaultAktivitas, detectedEstate, createdRecords);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memproses berkas spasial.");
    } finally {
      setIsProcessing(false);
      setStatusMsg("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="flex flex-col w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <svg className="size-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              <span>Unggah Data Spasial & Operasional (SHP / GeoJSON)</span>
            </h2>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Mendukung Shapefile (.zip memuat .shp & .dbf) atau GeoJSON (.geojson)
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form Body - HANYA AREA UNGGAHAN BERKAS */}
        <form onSubmit={handleUpload} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 flex items-center gap-2">
              <span className="font-bold">Error:</span> {errorMsg}
            </div>
          )}

          {/* Area Dropzone Berkas */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                const file = e.dataTransfer.files[0];
                setSelectedFile(file);
                setErrorMsg("");
                const autoAkt = detectAktivitasFromContext(file.name, currentAktivitas);
                setSelectedAktivitas(autoAkt);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                : selectedFile
                ? "border-emerald-400 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/10"
                : "border-slate-300 bg-slate-50/70 hover:bg-slate-50 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800/40"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,.geojson,.json"
              onChange={handleFileChange}
              className="hidden"
            />

            <svg className="size-10 mx-auto text-emerald-600 dark:text-emerald-400 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>

            <div className="font-semibold text-slate-800 dark:text-slate-200">
              {selectedFile ? (
                <div className="flex flex-col items-center">
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-sm">
                    {selectedFile.name}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    ({(selectedFile.size / 1024).toFixed(1)} KB) - Berkas siap diunggah & diekstrak
                  </span>
                </div>
              ) : (
                <>
                  <span className="text-sm">Klik untuk memilih berkas .zip (Shapefile) atau .geojson</span>
                  <span className="block text-[11px] text-slate-400 font-normal mt-1">
                    atau seret dan lepas berkas ke dalam area ini
                  </span>
                </>
              )}
            </div>

            <div className="text-[10px] text-slate-400 mt-3">
              Format didukung: <code>.zip</code> (arsip SHP + DBF), <code>.geojson</code>
            </div>
          </div>

          {/* Pilihan Target Sub Aktivitas (Tabel Database) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="target-aktivitas-select" className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <svg className="size-3.5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <span>Target Sub Aktivitas / Tabel Database:</span>
              </label>
              {selectedFile && (
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Auto-Detected
                </span>
              )}
            </div>

            <select
              id="target-aktivitas-select"
              value={selectedAktivitas}
              onChange={(e) => setSelectedAktivitas(e.target.value as OperasionalRecord["aktivitas"])}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="pruning">Perawatan Pruning (Tabel: perawatan_pruning)</option>
              <option value="semprot">Perawatan Semprot (Tabel: perawatan_semprot)</option>
              <option value="pemupukan">Perawatan Pemupukan (Tabel: perawatan_pemupukan)</option>
              <option value="pasar_pikul">Perawatan Pasar Pikul (Tabel: perawatan_pasar_pikul)</option>
              <option value="jangkos">Perawatan Jangkos (Tabel: perawatan_jangkos)</option>
              <option value="produksi">Produksi / Panen (Tabel: produksi)</option>
            </select>
            <p className="text-[10px] text-slate-400">
              Sistem otomatis mendeteksi dari nama berkas, dan Anda dapat memilih atau mengalihkan tabel tujuan secara manual di sini.
            </p>
          </div>

          {/* Footer Aksi */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {statusMsg || (selectedFile ? "Siap disinkronkan" : "Pilih berkas spasial")}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isProcessing || !selectedFile}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isProcessing ? (
                  <>
                    <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Unggah & Sinkronkan</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
