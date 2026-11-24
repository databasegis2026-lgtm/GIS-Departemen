import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import type { RekapPekerjaanRecord } from "../types";
import { printRekapPekerjaanPdf } from "../print-rekap-pdf";

interface RekapFullscreenMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: RekapPekerjaanRecord | null;
  onOpenUploadShp?: () => void;
  onCommitToDatabase?: (recordId: string) => void;
  onRequestRevision?: (record: RekapPekerjaanRecord) => void;
  isGisRole?: boolean;
}

export default function RekapFullscreenMapModal({
  isOpen,
  onClose,
  record,
  onOpenUploadShp,
  onCommitToDatabase,
  onRequestRevision,
  isGisRole = false,
}: RekapFullscreenMapModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [basemap, setBasemap] = useState<"satellite" | "osm">("satellite");

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current || !record) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initialCenter: [number, number] =
      record.draft_polygon && record.draft_polygon.length > 0
        ? record.draft_polygon[0]
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
    const isCommitted = Boolean(record.database_committed || record.status_verifikasi === "verified");
    const pokok = record.realisasi_pokok || Math.round(record.realisasi_luas_ha * (record.sph || 136));

    // 1. Layer Batas Baku Master
    if (record.official_polygon && record.official_polygon.length > 0) {
      const official = L.polygon(record.official_polygon, {
        color: "#64748b",
        dashArray: "6, 6",
        weight: 2,
        fillColor: "#475569",
        fillOpacity: 0.1,
      });
      official.bindTooltip(`Baku: ${record.luas_ha} Ha`, { direction: "top" });
      official.addTo(featureGroup);
    }

    // 2. Layer Draf Riil Unggahan SHP Kebun
    if (record.draft_polygon && record.draft_polygon.length > 0) {
      const polyColor = isCommitted ? "#10b981" : "#f59e0b";

      const draftPoly = L.polygon(record.draft_polygon, {
        color: polyColor,
        dashArray: isCommitted ? undefined : "6, 6",
        weight: 3.5,
        fillColor: polyColor,
        fillOpacity: isCommitted ? 0.35 : 0.25,
      });

      const labelText = isCommitted
        ? `<strong>[Valid]</strong> ${record.realisasi_luas_ha} Ha (${pokok} Pk)`
        : `<strong>[Draf Lapangan]</strong> ${record.realisasi_luas_ha} Ha (${pokok} Pk)`;

      draftPoly.bindTooltip(labelText, {
        permanent: true,
        direction: "center",
        className: isCommitted ? "leaflet-verified-badge" : "leaflet-draft-badge",
      });
      draftPoly.addTo(featureGroup);

      // Pin Nodes
      record.draft_polygon.forEach((pt, idx) => {
        const marker = L.circleMarker(pt, {
          radius: 4.5,
          fillColor: isCommitted ? "#10b981" : "#f59e0b",
          color: "#ffffff",
          weight: 2,
          fillOpacity: 1,
        });
        marker.bindTooltip(`P${idx + 1}`, { direction: "top" });
        marker.addTo(featureGroup);
      });
    }

    featureGroup.addTo(map);

    if (featureGroup.getLayers().length > 0) {
      map.fitBounds(featureGroup.getBounds(), { padding: [80, 80] });
    }

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 120);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isOpen, record, basemap]);

  if (!record) return null;

  const isCommitted = Boolean(record.database_committed || record.status_verifikasi === "verified");
  const pokokVal = record.realisasi_pokok || Math.round(record.realisasi_luas_ha * (record.sph || 136));
  const sphVal = record.sph_blok || record.sph || 136;
  const estimasiLuas = record.luas_estimasi_sph || (pokokVal / sphVal);
  const deviasi = estimasiLuas - record.luas_ha;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        fullScreen={true}
        showCloseButton={false}
        className="fixed inset-0 z-[9999] h-screen w-screen max-w-none flex flex-col rounded-none m-0 p-0 border-none overflow-hidden bg-white dark:bg-gray-900"
      >
        {/* ─── 1. TOP HEADER BAR ─── */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-xs z-10">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-200">
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Peta Blok {record.blok} &bull; {record.estate} ({record.afdeling})
                </h3>
                {isCommitted ? (
                  <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10.5px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span>Valid</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10.5px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80">
                    <span className="size-1.5 rounded-full bg-amber-500" />
                    <span>Draf Lapangan</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Aktivitas: <span className="font-semibold text-gray-700 dark:text-gray-200 uppercase">{record.aktivitas.replace("_", " ")}</span> &bull;
                Mandor: {record.kontraktor} &bull;
                SHP: <span className="font-mono text-gray-700 dark:text-gray-300">{record.shp_file_name || "SHP_Lapangan.zip"}</span>
              </p>
            </div>
          </div>

          {/* Kanan: Basemap & Tutup */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg p-0.5 bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setBasemap("satellite")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${basemap === "satellite"
                  ? "bg-white text-gray-900 shadow-2xs dark:bg-gray-700 dark:text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
              >
                Satelit
              </button>
              <button
                type="button"
                onClick={() => setBasemap("osm")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${basemap === "osm"
                  ? "bg-white text-gray-900 shadow-2xs dark:bg-gray-700 dark:text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
              >
                Vektor
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span>Tutup Peta</span>
            </button>
          </div>
        </div>

        {/* ─── 2. KANVAS PETA ─── */}
        <div className="relative flex-1 w-full h-full bg-gray-100 dark:bg-gray-950 overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Legenda Kiri Bawah */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-xl p-3 shadow-md text-xs space-y-1 pointer-events-none text-gray-700 dark:text-gray-300">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 block uppercase tracking-wider">
              Legenda
            </span>
            <div className="flex items-center gap-2">
              <span className="w-4 h-0 border-t-2 border-dashed border-gray-500 inline-block" />
              <span>Batas Baku ({record.luas_ha.toFixed(1)} Ha)</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-4 h-2 rounded-xs border border-white/60 inline-block ${isCommitted ? "bg-emerald-500" : "bg-amber-500"
                  }`}
              />
              <span className={isCommitted ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-amber-600 dark:text-amber-400 font-semibold"}>
                {isCommitted ? "Valid di Database" : `Draf Kebun (${pokokVal} Pk)`}
              </span>
            </div>
          </div>
        </div>

        {/* ─── 3. BOTTOM FOOTER BAR ─── */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 text-xs z-10">
          <div className="flex flex-wrap items-center gap-4 font-medium text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 dark:text-gray-400">Pokok:</span>
              <strong className="font-mono text-amber-600 dark:text-amber-400">
                {pokokVal.toLocaleString("id-ID")}
              </strong>
            </div>
            <div className="h-3.5 w-px bg-gray-200 dark:bg-gray-800" />
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 dark:text-gray-400">Estimasi:</span>
              <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                {estimasiLuas.toFixed(2)} Ha
              </strong>
            </div>
            <div className="h-3.5 w-px bg-gray-200 dark:bg-gray-800" />
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 dark:text-gray-400">Baku:</span>
              <strong className="font-mono text-gray-800 dark:text-gray-200">
                {record.luas_ha.toFixed(1)} Ha
              </strong>
            </div>
            <div className="h-3.5 w-px bg-gray-200 dark:bg-gray-800" />
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 dark:text-gray-400">Selisih:</span>
              <strong className={`font-mono ${Math.abs(deviasi) < 0.05 ? "text-emerald-600 dark:text-emerald-400" : deviasi < 0 ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"}`}>
                {deviasi > 0 ? `+${deviasi.toFixed(2)}` : deviasi.toFixed(2)} Ha
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenUploadShp && (
              <button
                type="button"
                onClick={onOpenUploadShp}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Ganti SHP
              </button>
            )}

            <button
              type="button"
              onClick={() => printRekapPekerjaanPdf(record)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Cetak PDF</span>
            </button>

            {!isCommitted && onRequestRevision && (
              <button
                type="button"
                onClick={() => {
                  onRequestRevision(record);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-semibold text-xs transition-colors cursor-pointer"
              >
                Minta Revisi
              </button>
            )}

            {!isCommitted && isGisRole && onCommitToDatabase && (
              <button
                type="button"
                onClick={() => {
                  onCommitToDatabase(record.id);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
              >
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>Validasi &amp; Simpan</span>
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
