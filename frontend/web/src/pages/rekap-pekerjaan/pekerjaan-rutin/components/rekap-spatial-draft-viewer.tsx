import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { RekapPekerjaanRecord } from "../types";

interface RekapSpatialDraftViewerProps {
  record: RekapPekerjaanRecord | null;
  onClose?: () => void;
  onCommitToDatabase?: (recordId: string) => void;
  onRequestRevision?: (record: RekapPekerjaanRecord) => void;
  isGisRole?: boolean;
}

export default function RekapSpatialDraftViewer({
  record,
  onClose,
  onCommitToDatabase,
  onRequestRevision,
  isGisRole = true,
}: RekapSpatialDraftViewerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [basemap, setBasemap] = useState<"satellite" | "osm">("satellite");

  useEffect(() => {
    if (!mapContainerRef.current || !record) return;

    // Bersihkan peta lama jika ada
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const defaultCenter: [number, number] = record.draft_polygon && record.draft_polygon.length > 0
      ? record.draft_polygon[0]
      : [-1.545, 113.965];

    // Buat map Leaflet baru
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 15,
      zoomControl: false,
    });
    mapInstanceRef.current = map;

    // Kontrol zoom di kanan atas
    L.control.zoom({ position: "topright" }).addTo(map);

    // Tile Layer Basemap
    const tileUrl =
      basemap === "satellite"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}.png";

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: basemap === "satellite" ? "&copy; Esri World Imagery" : "&copy; OpenStreetMap",
    });
    tileLayer.addTo(map);

    const group = L.featureGroup();

    // 1. Layer Batas Baku Resmi (Master Database)
    if (record.official_polygon && record.official_polygon.length > 0) {
      const officialPoly = L.polygon(record.official_polygon, {
        color: "#94a3b8", // Slate 400
        dashArray: "6, 6",
        weight: 2,
        fillColor: "#64748b",
        fillOpacity: 0.12,
      });

      officialPoly.bindTooltip(
        `<strong>Batas Baku Resmi:</strong> ${record.luas_ha} Ha`,
        { permanent: false, direction: "center", className: "leaflet-clean-tooltip" }
      );
      officialPoly.addTo(group);
    }

    // 2. Layer DRAF Poligon Realisasi Fisik (Belum Masuk Database)
    if (record.draft_polygon && record.draft_polygon.length > 0) {
      const isCommitted = record.database_committed || record.status_verifikasi === "verified";
      const draftColor = isCommitted ? "#10b981" : "#f59e0b"; // Hijau jika valid, Kuning/Amber jika draf

      const draftPoly = L.polygon(record.draft_polygon, {
        color: draftColor,
        dashArray: isCommitted ? undefined : "5, 5",
        weight: 3,
        fillColor: draftColor,
        fillOpacity: isCommitted ? 0.35 : 0.25,
      });

      const labelText = isCommitted
        ? `<strong>[TERSIMPAN DI DB]</strong> Realisasi: ${record.realisasi_luas_ha} Ha`
        : `<strong>[DRAF SEMENTARA]</strong> Realisasi: ${record.realisasi_luas_ha} Ha`;

      draftPoly.bindTooltip(labelText, {
        permanent: true,
        direction: "center",
        className: isCommitted ? "leaflet-verified-badge" : "leaflet-draft-badge",
      });
      draftPoly.addTo(group);

      // Tambahkan pin titik sudut (nodes) untuk menunjukkan ini adalah draf koordinat lapangan
      record.draft_polygon.forEach((pt, idx) => {
        const marker = L.circleMarker(pt, {
          radius: 4,
          fillColor: isCommitted ? "#10b981" : "#f59e0b",
          color: "#ffffff",
          weight: 1.5,
          fillOpacity: 1,
        });
        marker.bindTooltip(`Node P${idx + 1}: [${pt[0].toFixed(4)}, ${pt[1].toFixed(4)}]`, {
          direction: "top",
        });
        marker.addTo(group);
      });
    }

    group.addTo(map);

    // Fit bounds agar poligon berada persis di tengah dengan padding
    if (group.getLayers().length > 0) {
      map.fitBounds(group.getBounds(), { padding: [40, 40] });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [record, basemap]);

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400">
        <svg className="size-8 mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        <p className="text-xs">Pilih salah satu baris rekap untuk melihat draf poligon spasial.</p>
      </div>
    );
  }

  const isCommitted = Boolean(record.database_committed || record.status_verifikasi === "verified");
  const deviasi = (record.realisasi_luas_ha || 0) - (record.luas_ha || 0);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 shadow-sm overflow-hidden text-slate-200">
      {/* 1. Header Draf Spasial */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white tracking-wide">
                Draf Poligon Spasial Blok {record.blok} ({record.estate} &bull; {record.afdeling})
              </h3>
              {/* Badge Status Komit Database */}
              {isCommitted ? (
                <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  <span>Tersimpan di Database Spasial (Final)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/80 animate-pulse">
                  <span className="size-1.5 rounded-full bg-amber-400" />
                  <span>DRAF SEMENTARA (Belum Masuk Database)</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Aktivitas: <span className="uppercase font-semibold text-slate-300">{record.aktivitas.replace("_", " ")}</span> &bull; 
              Mandor/Vendor: <span className="text-slate-300">{record.kontraktor}</span> &bull; 
              Tanggal Lapangan: <span className="font-mono text-slate-300">{record.tanggal}</span>
            </p>
          </div>
        </div>

        {/* Kontrol Kanan: Ganti Basemap & Tutup */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg p-0.5 bg-slate-800 border border-slate-700 text-[11px]">
            <button
              type="button"
              onClick={() => setBasemap("satellite")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                basemap === "satellite"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Citra Satelit
            </button>
            <button
              type="button"
              onClick={() => setBasemap("osm")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                basemap === "osm"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Peta Vektor
            </button>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Tutup Preview Poligon"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 2. Banner Peringatan Draf Belum Masuk Database */}
      {!isCommitted && (
        <div className="flex items-center justify-between px-4 py-2 bg-amber-950/30 border-b border-amber-900/40 text-[11px] text-amber-200">
          <div className="flex items-center gap-2">
            <svg className="size-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>
              <strong>Perhatian:</strong> Poligon ini adalah draf pengerjaan fisik lapangan yang diajukan kebun.
              Data <strong>belum masuk database spasial utama</strong> sampai divalidasi dan disetujui oleh Admin GIS.
            </span>
          </div>
          <span className="font-mono text-[10px] text-amber-400/80 uppercase tracking-wider shrink-0 ml-2">
            Stage: Spatial Staging Area
          </span>
        </div>
      )}

      {/* 3. Area Map Canvas Leaflet */}
      <div className="relative w-full h-[320px] bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Legend Overlay Floating di Kiri Bawah Map */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-slate-950/85 backdrop-blur-sm border border-slate-800 rounded-lg p-2.5 shadow-md text-[10.5px] space-y-1.5 pointer-events-none">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
            Legenda Poligon
          </span>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0 border-t-2 border-dashed border-slate-400 inline-block" />
            <span className="text-slate-300">Batas Baku Resmi (Database Master)</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-4 h-2 rounded-xs border border-white/60 inline-block ${
                isCommitted ? "bg-emerald-500/50" : "bg-amber-500/50"
              }`}
            />
            <span className={isCommitted ? "text-emerald-300" : "text-amber-300"}>
              {isCommitted ? "Poligon Resmi Tersimpan" : "Draf Realisasi Fisik (Belum Masuk DB)"}
            </span>
          </div>
        </div>

        {/* HUD Ringkasan Luasan di Kanan Bawah Map */}
        <div className="absolute bottom-3 right-3 z-[1000] bg-slate-950/90 backdrop-blur-sm border border-slate-800 rounded-lg p-3 shadow-md text-xs space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400 text-[11px]">Luas Baku Master:</span>
            <span className="font-mono font-bold text-slate-200">{record.luas_ha.toFixed(1)} Ha</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400 text-[11px]">Realisasi Lapangan:</span>
            <span className="font-mono font-bold text-amber-300">{record.realisasi_luas_ha.toFixed(1)} Ha</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800">
            <span className="text-slate-400 text-[11px]">Selisih/Deviasi:</span>
            <span
              className={`font-mono font-bold ${
                Math.abs(deviasi) < 0.05
                  ? "text-emerald-400"
                  : deviasi < 0
                  ? "text-rose-400"
                  : "text-amber-400"
              }`}
            >
              {deviasi > 0 ? `+${deviasi.toFixed(2)}` : deviasi.toFixed(2)} Ha
            </span>
          </div>
        </div>
      </div>

      {/* 4. Footer Aksi: Validasi & Commit ke Database */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-950/90 border-t border-slate-800 text-xs">
        <div className="text-[11px] text-slate-400">
          {record.catatan_gis ? (
            <span>Catatan Spasial: &ldquo;{record.catatan_gis}&rdquo;</span>
          ) : (
            <span>Belum ada catatan verifikasi spasial dari Tim GIS.</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isCommitted && onRequestRevision && (
            <button
              type="button"
              onClick={() => onRequestRevision(record)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] border border-slate-700 transition-colors"
            >
              Minta Revisi Patok/Poligon
            </button>
          )}

          {!isCommitted && isGisRole && onCommitToDatabase && (
            <button
              type="button"
              onClick={() => onCommitToDatabase(record.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] shadow-sm transition-colors cursor-pointer"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>Validasi &amp; Simpan ke Database Resmi</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
