import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { AktivitasRutinType, RekapPekerjaanRecord } from "../types";
import { printRekapPekerjaanPdf } from "../print-rekap-pdf";

interface RekapMapFirstViewProps {
  records: RekapPekerjaanRecord[];
  activeRecord: RekapPekerjaanRecord | null;
  onSelectRecord: (record: RekapPekerjaanRecord) => void;
  onOpenUploadShp: () => void;
  onCommitToDatabase?: (recordId: string) => void;
  onRequestRevision?: (record: RekapPekerjaanRecord) => void;
  activeTab: AktivitasRutinType;
  onTabChange: (tab: AktivitasRutinType) => void;
  isGisRole?: boolean;
}

export default function RekapMapFirstView({
  records,
  activeRecord,
  onSelectRecord,
  onOpenUploadShp,
  onCommitToDatabase,
  onRequestRevision,
  activeTab,
  onTabChange,
  isGisRole = false,
}: RekapMapFirstViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [basemap, setBasemap] = useState<"satellite" | "osm">("satellite");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initialCenter: [number, number] =
      activeRecord?.draft_polygon && activeRecord.draft_polygon.length > 0
        ? activeRecord.draft_polygon[0]
        : [-1.545, 113.965];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 15,
      zoomControl: false,
    });
    mapInstanceRef.current = map;

    L.control.zoom({ position: "topright" }).addTo(map);

    const tileUrl =
      basemap === "satellite"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}.png";

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: basemap === "satellite" ? "&copy; Esri World Imagery" : "&copy; OpenStreetMap",
    }).addTo(map);

    const featureGroup = L.featureGroup();

    records.forEach((r) => {
      const isSelected = activeRecord?.id === r.id;
      const isCommitted = Boolean(r.database_committed || r.status_verifikasi === "verified");
      const pokok = r.realisasi_pokok || Math.round(r.realisasi_luas_ha * (r.sph || 136));

      // 1. Layer Batas Baku Resmi Master
      if (r.official_polygon && r.official_polygon.length > 0) {
        const official = L.polygon(r.official_polygon, {
          color: "#94a3b8",
          dashArray: "6, 6",
          weight: 1.5,
          fillColor: "#475569",
          fillOpacity: 0.08,
        });
        official.addTo(featureGroup);
      }

      // 2. Layer Draf Riil Unggahan SHP Kebun
      if (r.draft_polygon && r.draft_polygon.length > 0) {
        const polyColor = isCommitted ? "#10b981" : "#f59e0b";

        const draftPoly = L.polygon(r.draft_polygon, {
          color: polyColor,
          dashArray: isCommitted ? undefined : "6, 6",
          weight: isSelected ? 3.5 : 2.5,
          fillColor: polyColor,
          fillOpacity: isSelected ? 0.45 : 0.25,
        });

        draftPoly.on("click", () => {
          onSelectRecord(r);
        });

        const tooltipText = `
          <div style="font-size: 11px; font-weight: 700; line-height: 1.3;">
            <div style="color: ${polyColor}; font-weight: 800;">
              ${isCommitted ? "[TERSIMPAN DI DB]" : "[DRAF SHP KEBUN]"} Blok ${r.blok}
            </div>
            <div style="color: #cbd5e1; font-weight: 600;">
              ${pokok.toLocaleString("id-ID")} Pokok &bull; Est. ${r.realisasi_luas_ha} Ha
            </div>
          </div>
        `;

        draftPoly.bindTooltip(tooltipText, {
          permanent: isSelected,
          direction: "center",
          className: "leaflet-custom-clean-tooltip",
        });

        draftPoly.addTo(featureGroup);
      }
    });

    featureGroup.addTo(map);

    if (featureGroup.getLayers().length > 0) {
      if (activeRecord?.draft_polygon) {
        const activeBounds = L.polygon(activeRecord.draft_polygon).getBounds();
        map.fitBounds(activeBounds, { padding: [60, 60] });
      } else {
        map.fitBounds(featureGroup.getBounds(), { padding: [40, 40] });
      }
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [records, activeRecord, basemap]);

  const currentRecord = activeRecord || records[0] || null;
  const isCommitted = Boolean(currentRecord?.database_committed || currentRecord?.status_verifikasi === "verified");
  const currentPokok = currentRecord?.realisasi_pokok || (currentRecord ? Math.round(currentRecord.realisasi_luas_ha * (currentRecord.sph || 136)) : 0);
  const currentSph = currentRecord?.sph_blok || currentRecord?.sph || 136;
  const estimasiLuas = currentRecord?.luas_estimasi_sph || (currentRecord ? currentPokok / currentSph : 0);

  return (
    <div className="relative w-full h-[620px] rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
      {/* ─── 1. TOP FLOATING CONTROL BAR ─── */}
      <div className="absolute top-3 inset-x-3 z-[1000] flex flex-wrap items-center justify-between gap-2.5 bg-slate-950/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 shadow-md">
        {/* Kiri: Judul & Tab Aktivitas Rutin */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800 shrink-0">
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </span>

          <div className="flex items-center gap-1">
            {[
              { key: "all", label: "Semua" },
              { key: "pruning", label: "Pruning" },
              { key: "pemupukan", label: "Pemupukan" },
              { key: "pasar_pikul", label: "Pasar Pikul" },
              { key: "jangkos", label: "Jangkos" },
              { key: "semprot", label: "Semprot" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key as AktivitasRutinType)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  activeTab === tab.key
                    ? "bg-slate-800 text-white border border-slate-700"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Kanan: Aksi Unggah SHP, Cetak PDF, Toggle List Blok */}
        <div className="flex items-center gap-2">
          {/* Ganti Basemap */}
          <div className="inline-flex rounded-md p-0.5 bg-slate-900 border border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => setBasemap("satellite")}
              className={`px-2 py-1 rounded font-medium ${
                basemap === "satellite" ? "bg-slate-800 text-white" : "text-slate-400"
              }`}
            >
              Satelit
            </button>
            <button
              type="button"
              onClick={() => setBasemap("osm")}
              className={`px-2 py-1 rounded font-medium ${
                basemap === "osm" ? "bg-slate-800 text-white" : "text-slate-400"
              }`}
            >
              Vektor
            </button>
          </div>

          {/* Tombol Unggah SHP Riil Lapangan */}
          <button
            type="button"
            onClick={onOpenUploadShp}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>+ Unggah SHP Lapangan</span>
          </button>

          {/* Tombol Cetak PDF Berita Acara (Setengah Kosong) */}
          {currentRecord && (
            <button
              type="button"
              onClick={() => printRekapPekerjaanPdf(currentRecord)}
              title="Cetak Berita Acara Peta Lapangan (Setengah Kosong untuk Kebun)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs shadow-sm transition-colors cursor-pointer"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Cetak Peta PDF</span>
            </button>
          )}

          {/* Toggle Slide-over Sidebar Blok */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
            title="Daftar Blok Pengerjaan"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* ─── 2. KANVAS PETA LEAFLET ─── */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* ─── 3. LEGENDA OVERLAY KIRI BAWAH ─── */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-lg p-2.5 text-[10.5px] space-y-1.5 pointer-events-none text-slate-300 shadow-md">
        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
          Legenda Peta Spasial
        </span>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0 border-t-2 border-dashed border-slate-400 inline-block" />
          <span>Batas Baku Master HO</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-2 rounded-xs bg-amber-500/50 border border-amber-400 inline-block" />
          <span className="text-amber-300">Draf SHP Riil Kebun (Belum Masuk DB)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-2 rounded-xs bg-emerald-500/50 border border-emerald-400 inline-block" />
          <span className="text-emerald-300">Tersimpan di Database Spasial (Valid)</span>
        </div>
      </div>

      {/* ─── 4. BOTTOM FLOATING HUD: INFORMASI BLOK AKTIF & STATUS DATABASE ─── */}
      {currentRecord && (
        <div className="absolute bottom-4 right-4 z-[1000] max-w-md w-full bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 shadow-2xl text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-white">
                  Blok {currentRecord.blok}
                </span>
                <span className="text-slate-400">
                  ({currentRecord.estate} &bull; {currentRecord.afdeling})
                </span>
              </div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold">
                {currentRecord.aktivitas.replace("_", " ")} &bull; {currentRecord.kondisi}
              </span>
            </div>

            {/* Badge Status Komit Database */}
            {isCommitted ? (
              <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span>Di Database</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/80 animate-pulse">
                <span className="size-1.5 rounded-full bg-amber-400" />
                <span>DRAF SEMENTARA</span>
              </span>
            )}
          </div>

          {/* Grid Metrik: Pokok (Kebun) vs Estimasi Luas (HO) */}
          <div className="grid grid-cols-3 gap-2 text-center py-1">
            <div className="bg-slate-900 rounded p-1.5 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Realisasi Pokok</span>
              <span className="font-mono font-bold text-amber-300 text-xs">
                {currentPokok.toLocaleString("id-ID")} Pk
              </span>
            </div>
            <div className="bg-slate-900 rounded p-1.5 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Estimasi Luas</span>
              <span className="font-mono font-bold text-emerald-400 text-xs">
                {estimasiLuas.toFixed(2)} Ha
              </span>
            </div>
            <div className="bg-slate-900 rounded p-1.5 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Luas Baku Master</span>
              <span className="font-mono font-bold text-slate-300 text-xs">
                {currentRecord.luas_ha.toFixed(1)} Ha
              </span>
            </div>
          </div>

          {/* Info File SHP Unggahan */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2">
            <div className="truncate max-w-[240px]">
              Berkas: <span className="font-mono text-slate-300">{currentRecord.shp_file_name || "SHP_Lapangan.zip"}</span>
            </div>
            <span>Mandor: <strong className="text-slate-200">{currentRecord.kontraktor}</strong></span>
          </div>

          {/* Tombol Aksi Langsung */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => printRekapPekerjaanPdf(currentRecord)}
              className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              Cetak PDF (Setengah Kosong)
            </button>

            {!isCommitted && isGisRole && onCommitToDatabase && (
              <button
                type="button"
                onClick={() => onCommitToDatabase(currentRecord.id)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>Validasi &amp; Commit ke DB</span>
              </button>
            )}

            {!isCommitted && onRequestRevision && (
              <button
                type="button"
                onClick={() => onRequestRevision(currentRecord)}
                className="px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-amber-300 text-[11px] font-semibold border border-slate-800 transition-colors cursor-pointer"
              >
                Revisi
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── 5. SLIDE-OVER SIDEBAR: DAFTAR BLOK ─── */}
      {isSidebarOpen && (
        <div className="absolute top-0 right-0 bottom-0 w-80 z-[1001] bg-slate-950/98 backdrop-blur-md border-l border-slate-800 p-4 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <h4 className="font-bold text-xs text-white uppercase tracking-wider">
              Antrean Blok ({records.length})
            </h4>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded"
            >
              &times;
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs">
            {records.map((r) => {
              const isSelected = activeRecord?.id === r.id;
              const isComm = Boolean(r.database_committed || r.status_verifikasi === "verified");
              const pokok = r.realisasi_pokok || Math.round(r.realisasi_luas_ha * (r.sph || 136));

              return (
                <div
                  key={r.id}
                  onClick={() => {
                    onSelectRecord(r);
                    setIsSidebarOpen(false);
                  }}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-800/90 border-emerald-500/80 text-white"
                      : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white">
                      Blok {r.blok}
                    </span>
                    <span
                      className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        isComm
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-amber-950 text-amber-300 border border-amber-800"
                      }`}
                    >
                      {isComm ? "Valid DB" : "Draf SHP"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {r.estate} ({r.afdeling}) &bull; {r.aktivitas.toUpperCase()}
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono mt-1 pt-1 border-t border-slate-800/60 text-slate-300">
                    <span>{pokok.toLocaleString("id-ID")} Pokok</span>
                    <span className="text-emerald-400 font-bold">{r.realisasi_luas_ha} Ha</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
