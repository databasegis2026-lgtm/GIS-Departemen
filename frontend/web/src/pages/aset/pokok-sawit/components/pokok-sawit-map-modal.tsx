import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { POKOK_SAWIT_COLUMNS, type PokokSawitRecord } from "../index";

export interface PokokSawitMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRecord: PokokSawitRecord | null;
  allRecords: PokokSawitRecord[];
  onSelectRecord?: (record: PokokSawitRecord) => void;
}

// Koordinat referensi blok perkebunan PT BUM (Kalimantan Tengah / Ketapang)
const ESTATE_CENTERS: Record<string, [number, number]> = {
  "BUM 1": [-1.4795, 112.7015],
  "BUM 2": [-1.4642, 112.7196],
  "BUM 3": [-1.4912, 112.7398],
  "BUM 4": [-1.4520, 112.6876],
  "BUM 5": [-1.5085, 112.7548],
  "BUM 6": [-1.5244, 112.7648],
  "BUM 7": [-1.5393, 112.7816],
  "BUM 8": [-1.5538, 112.7937],
};

/**
 * Menghitung koordinat geografis titik pokok sawit
 */
function getTreeCoordinates(record: PokokSawitRecord): [number, number] {
  if (record.lat && record.lng) {
    return [Number(record.lat), Number(record.lng)];
  }
  if (record.Y_GEO && record.X_GEO) {
    return [Number(record.Y_GEO), Number(record.X_GEO)];
  }

  const baseCenter = ESTATE_CENTERS[record.ESTATE] || [-1.4795, 112.7015];
  const baris = Number(record.BARIS) || 1;
  const nomor = Number(record.NOMOR) || Number(record.Id) || 1;

  // Spasi baris ~7.8 meter, spasi pokok ~9 meter (quincunx)
  const rowOffset = (baris % 2 === 0 ? 0.5 : 0.0) * 0.000081;
  const lat = baseCenter[0] + (baris - 1) * 0.000075;
  const lng = baseCenter[1] + (nomor - 1) * 0.000081 + rowOffset;

  return [lat, lng];
}

export default function PokokSawitMapModal({
  isOpen,
  onClose,
  selectedRecord,
  allRecords,
  onSelectRecord,
}: PokokSawitMapModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const highlightLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const canvasRendererRef = useRef<L.Canvas | null>(null);

  const [activeRecord, setActiveRecord] = useState<PokokSawitRecord | null>(selectedRecord);
  const [basemap, setBasemap] = useState<"satellite" | "osm">("satellite");
  const [filterStatus, setFilterStatus] = useState<"all" | "TM" | "TBM">("all");
  const [scopeFilter, setScopeFilter] = useState<"current_block" | "all">("current_block");
  const [isAttrOpen, setIsAttrOpen] = useState(true);
  const [isAttrMinimized, setIsAttrMinimized] = useState(false);

  // Sinkronkan activeRecord saat selectedRecord berubah
  useEffect(() => {
    setActiveRecord(selectedRecord);
    if (selectedRecord?.BLOK) {
      setScopeFilter("current_block");
    }
  }, [selectedRecord]);

  // Filter titik yang ditampilkan berdasarkan scope blok dan status TM/TBM
  const visibleRecords = useMemo(() => {
    let list = allRecords;

    // Scope blok: jika user memilih "current_block" dan ada activeRecord dengan BLOK
    if (scopeFilter === "current_block" && activeRecord?.BLOK && activeRecord.BLOK !== "-") {
      const targetBlok = String(activeRecord.BLOK).toLowerCase();
      const filteredByBlok = list.filter(
        (r) => String(r.BLOK || "").toLowerCase() === targetBlok
      );
      if (filteredByBlok.length > 0) {
        list = filteredByBlok;
      }
    }

    // Filter status TM/TBM
    if (filterStatus !== "all") {
      list = list.filter((r) => String(r.KETERANGAN || "").includes(filterStatus));
    }

    // Batasi jika terlalu masif (> 8.000) untuk menjaga performa 60 FPS
    if (list.length > 8000) {
      return list.slice(0, 8000);
    }

    return list;
  }, [allRecords, activeRecord?.BLOK, scopeFilter, filterStatus]);

  // 1. Inisialisasi Peta (Hanya 1x saat modal dibuka, TIDAK dihancurkan saat titik diklik)
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter: [number, number] = activeRecord
        ? getTreeCoordinates(activeRecord)
        : allRecords.length > 0
          ? getTreeCoordinates(allRecords[0])
          : [-1.4795, 112.7015];

      // Gunakan preferCanvas: true untuk akselerasi rendering ribuan titik
      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 18,
        maxZoom: 21,
        zoomControl: false,
        preferCanvas: true,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Inisialisasi layer groups
      const tileGroup = L.layerGroup().addTo(map);
      const canvasRenderer = L.canvas({ padding: 0.5 });
      const markersGroup = L.layerGroup().addTo(map);
      const highlightGroup = L.layerGroup().addTo(map);

      tileLayerGroupRef.current = tileGroup;
      canvasRendererRef.current = canvasRenderer;
      markersLayerRef.current = markersGroup;
      highlightLayerRef.current = highlightGroup;
      mapInstanceRef.current = map;
    }

    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen]);

  // 2. Bersihkan instance saat modal ditutup
  useEffect(() => {
    if (!isOpen && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      highlightLayerRef.current = null;
      tileLayerGroupRef.current = null;
      canvasRendererRef.current = null;
    }
  }, [isOpen]);

  // 3. Basemap Update (Tanpa menghancurkan map)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerGroupRef.current) return;
    const tileGroup = tileLayerGroupRef.current;
    tileGroup.clearLayers();

    if (basemap === "satellite") {
      const esriImagery = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Esri World Imagery", maxZoom: 20 }
      );
      const esriLabels = L.tileLayer(
        "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 20 }
      );
      tileGroup.addLayer(esriImagery);
      tileGroup.addLayer(esriLabels);
    } else {
      const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "OpenStreetMap",
        maxZoom: 19,
      });
      tileGroup.addLayer(osm);
    }
  }, [basemap]);

  // 4. Render Markers dengan Canvas Renderer (Hanya dijalankan saat visibleRecords berubah)
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !canvasRendererRef.current) return;
    const markersGroup = markersLayerRef.current;
    const renderer = canvasRendererRef.current;
    markersGroup.clearLayers();

    const bounds = L.latLngBounds([]);

    visibleRecords.forEach((record) => {
      const coords = getTreeCoordinates(record);
      bounds.extend(coords);

      const isTM = String(record.KETERANGAN || "").includes("TM");
      const color = isTM ? "#059669" : "#D97706";
      const fillColor = isTM ? "#10B981" : "#F59E0B";

      // Gambar via HTML5 Canvas renderer (sangat ringan dan hemat memori)
      const marker = L.circleMarker(coords, {
        renderer,
        radius: 5,
        color,
        weight: 1.5,
        fillColor,
        fillOpacity: 0.85,
      });

      // Lazy popup: Buat konten popup hanya saat marker diklik
      marker.on("click", () => {
        setActiveRecord(record);
        if (onSelectRecord) onSelectRecord(record);

        const popupHtml = `
          <div style="font-family: sans-serif; font-size: 11px; line-height: 1.4; min-width: 170px; color: #1f2937;">
            <div style="font-weight: bold; font-size: 12px; color: ${color}; border-bottom: 2px solid ${color}; padding-bottom: 3px; margin-bottom: 5px;">
              🌴 Blok ${record.BLOK} • Baris ${record.BARIS}
            </div>
            <div><b>Afdeling:</b> ${record.AFD} • <b>Ancak:</b> ${record.ANCAK}</div>
            <div><b>Estate:</b> ${record.ESTATE} (${record.REGION})</div>
            <div><b>Th. Tanam:</b> ${record.TH_TANAM} • <b>SPH:</b> ${record.SPH}</div>
            <div style="margin-top: 4px;">
              <span style="display:inline-block; padding: 1px 6px; border-radius: 4px; font-weight: 600; font-size: 10px; background: ${isTM ? "#D1FAE5" : "#FEF3C7"}; color: ${isTM ? "#065F46" : "#92400E"};">
                ${record.KETERANGAN}
              </span>
            </div>
            <div style="margin-top: 4px; font-size: 9px; color: #6b7280; font-family: monospace;">
              Lat: ${coords[0].toFixed(6)}, Lng: ${coords[1].toFixed(6)}
            </div>
          </div>
        `;
        marker.bindPopup(popupHtml).openPopup();
      });

      markersGroup.addLayer(marker);
    });

    // Posisikan peta ke titik aktif atau batas sebaran
    if (activeRecord) {
      const activeCoords = getTreeCoordinates(activeRecord);
      mapInstanceRef.current.setView(activeCoords, 18);
    } else if (bounds.isValid() && visibleRecords.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 19 });
    }
  }, [visibleRecords]);

  // 5. Highlight Pokok Terpilih (Ringan, hanya mengupdate 1 marker tanpa render ulang ribuan titik)
  useEffect(() => {
    if (!mapInstanceRef.current || !highlightLayerRef.current || !activeRecord) return;
    const highlightGroup = highlightLayerRef.current;
    highlightGroup.clearLayers();

    const coords = getTreeCoordinates(activeRecord);

    // Marker lingkaran biru menyala dengan efek denyut
    const highlightMarker = L.circleMarker(coords, {
      radius: 9,
      color: "#1D4ED8",
      weight: 3.5,
      fillColor: "#3B82F6",
      fillOpacity: 0.95,
    });

    const isTM = String(activeRecord.KETERANGAN || "").includes("TM");
    const popupHtml = `
      <div style="font-family: sans-serif; font-size: 11px; line-height: 1.4; min-width: 170px; color: #1f2937;">
        <div style="font-weight: bold; font-size: 12px; color: #1D4ED8; border-bottom: 2px solid #1D4ED8; padding-bottom: 3px; margin-bottom: 5px;">
          🌴 Blok ${activeRecord.BLOK} • Baris ${activeRecord.BARIS}
        </div>
        <div><b>Afdeling:</b> ${activeRecord.AFD} • <b>Ancak:</b> ${activeRecord.ANCAK}</div>
        <div><b>Estate:</b> ${activeRecord.ESTATE} (${activeRecord.REGION})</div>
        <div><b>Th. Tanam:</b> ${activeRecord.TH_TANAM} • <b>SPH:</b> ${activeRecord.SPH}</div>
        <div style="margin-top: 4px;">
          <span style="display:inline-block; padding: 1px 6px; border-radius: 4px; font-weight: 600; font-size: 10px; background: ${isTM ? "#D1FAE5" : "#FEF3C7"}; color: ${isTM ? "#065F46" : "#92400E"};">
            ${activeRecord.KETERANGAN}
          </span>
        </div>
        <div style="margin-top: 4px; font-size: 9px; color: #6b7280; font-family: monospace;">
          Lat: ${coords[0].toFixed(6)}, Lng: ${coords[1].toFixed(6)}
        </div>
      </div>
    `;

    highlightMarker.bindPopup(popupHtml);
    highlightGroup.addLayer(highlightMarker);
  }, [activeRecord]);

  // Fungsi Zoom ke titik terpilih
  const handleFocusSelected = () => {
    if (!mapInstanceRef.current || !activeRecord) return;
    const coords = getTreeCoordinates(activeRecord);
    mapInstanceRef.current.setView(coords, 19, { animate: true });
    if (highlightLayerRef.current) {
      highlightLayerRef.current.eachLayer((layer: any) => {
        if (typeof layer.openPopup === "function") {
          layer.openPopup();
        }
      });
    }
  };

  // Fungsi Zoom ke seluruh titik terlihat
  const handleFitAll = () => {
    if (!mapInstanceRef.current || visibleRecords.length === 0) return;
    const bounds = L.latLngBounds([]);
    visibleRecords.forEach((r) => bounds.extend(getTreeCoordinates(r)));
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 19 });
    }
  };

  if (!isOpen) return null;

  const currentCoords = activeRecord ? getTreeCoordinates(activeRecord) : null;
  const isCapped = allRecords.length > 8000 && visibleRecords.length === 8000;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-6xl h-[90vh] rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header Modal Bar (Row 1): Title, Badge Pokok, & Tombol Close Permanen */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-4 bg-white dark:bg-gray-900 dark:border-gray-800 gap-3 z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2a10 10 0 0 0-10 10c0 5.25 10 12 10 12s10-6.75 10-12a10 10 0 0 0-10-10z" />
              </svg>
            </span>
            <div className="flex items-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                Peta Spasial Titik Pokok Sawit
              </h2>
              {activeRecord && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full shrink-0">
                  <span className="size-1.5 rounded-full bg-emerald-600 inline-block" />
                  Blok {activeRecord.BLOK} • Baris {activeRecord.BARIS} • {activeRecord.ANCAK?.toUpperCase().startsWith("ANCAK") ? activeRecord.ANCAK : `Ancak ${activeRecord.ANCAK}`}
                </span>
              )}
            </div>
          </div>

          {/* Close Button: Terpasang permanen di pojok kanan atas, tidak pernah tergeser atau jatuh */}
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition cursor-pointer"
            title="Tutup Peta (Esc)"
          >
            <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Sub-Toolbar Bar (Row 2): Kontrol Filter & Peta Terpadu Segaris (No Wrap, Scrollable jika sempit) */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-2 bg-gray-50/90 dark:bg-gray-800/60 dark:border-gray-800 gap-3 text-xs overflow-x-auto whitespace-nowrap z-10">
          {/* Kiri: Indikator Jumlah Titik */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300">
              Menampilkan <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{visibleRecords.length.toLocaleString("id-ID")}</strong> titik pokok
              {allRecords.length > visibleRecords.length && (
                <span className="text-gray-400 dark:text-gray-500"> (dari total {allRecords.length.toLocaleString("id-ID")})</span>
              )}
              {isCapped && <span className="text-amber-600 font-semibold ml-1">[dibatasi 8.000 titik terdekat]</span>}
            </span>
          </div>

          {/* Kanan: Segmented Controls & Tombol Aksi Peta */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Filter Scope Blok */}
            {activeRecord?.BLOK && activeRecord.BLOK !== "-" && (
              <div className="flex rounded-lg bg-white dark:bg-gray-800 p-0.5 text-xs border border-gray-200 dark:border-gray-700 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setScopeFilter("current_block")}
                  className={`rounded-md px-2.5 py-1 font-medium transition cursor-pointer text-[11px] ${scopeFilter === "current_block"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-bold"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400"
                    }`}
                  title="Fokus tampilkan blok ini saja agar ringan & cepat"
                >
                  Blok {activeRecord.BLOK}
                </button>
                <button
                  type="button"
                  onClick={() => setScopeFilter("all")}
                  className={`rounded-md px-2.5 py-1 font-medium transition cursor-pointer text-[11px] ${scopeFilter === "all"
                    ? "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white font-bold"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400"
                    }`}
                  title="Tampilkan seluruh blok"
                >
                  Semua Blok
                </button>
              </div>
            )}

            {/* Filter Status Tanaman */}
            <div className="flex rounded-lg bg-white dark:bg-gray-800 p-0.5 text-xs border border-gray-200 dark:border-gray-700 shadow-2xs">
              <button
                type="button"
                onClick={() => setFilterStatus("all")}
                className={`rounded-md px-2 py-1 font-medium transition cursor-pointer text-[11px] ${filterStatus === "all"
                  ? "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white font-bold"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400"
                  }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("TM")}
                className={`rounded-md px-2 py-1 font-medium transition cursor-pointer text-[11px] ${filterStatus === "TM"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-bold"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400"
                  }`}
              >
                TM
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("TBM")}
                className={`rounded-md px-2 py-1 font-medium transition cursor-pointer text-[11px] ${filterStatus === "TBM"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-bold"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400"
                  }`}
              >
                TBM
              </button>
            </div>

            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-0.5" />

            {/* Basemap Switcher */}
            <div className="flex rounded-lg bg-white dark:bg-gray-800 p-0.5 text-xs border border-gray-200 dark:border-gray-700 shadow-2xs">
              <button
                type="button"
                onClick={() => setBasemap("satellite")}
                className={`rounded-md px-2 py-1 font-medium transition cursor-pointer text-[11px] ${basemap === "satellite"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-bold"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400"
                  }`}
              >
                Satelit
              </button>
              <button
                type="button"
                onClick={() => setBasemap("osm")}
                className={`rounded-md px-2 py-1 font-medium transition cursor-pointer text-[11px] ${basemap === "osm"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-bold"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400"
                  }`}
              >
                OSM
              </button>
            </div>

            {/* Focus Selected */}
            {activeRecord && (
              <button
                type="button"
                onClick={handleFocusSelected}
                title="Pusatkan peta ke pokok terpilih"
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer shadow-2xs transition"
              >
                <svg className="size-3.5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Fokus Pokok
              </button>
            )}

            {/* Fit All */}
            <button
              type="button"
              onClick={handleFitAll}
              title="Lihat seluruh titik"
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer shadow-2xs transition"
            >
              <svg className="size-3.5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
              Semua Titik
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative flex-1 w-full bg-gray-100 dark:bg-gray-950">
          <div ref={mapContainerRef} className="absolute inset-0 z-0" />

          {/* Floating Collapsible Atribut Card (Bottom Left) */}
          {activeRecord && (
            <div className="absolute bottom-4 left-4 z-20">
              {!isAttrOpen ? (
                /* State 1: Tombol Pembuka saat Panel Ditutup */
                <button
                  type="button"
                  onClick={() => {
                    setIsAttrOpen(true);
                    setIsAttrMinimized(false);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-gray-800 shadow-md backdrop-blur-md hover:bg-white dark:bg-gray-900/95 dark:text-gray-200 border border-gray-200/80 dark:border-gray-800 transition cursor-pointer"
                >
                  <span className="size-2 rounded-full bg-blue-600 inline-block" />
                  <span>Info Blok {activeRecord.BLOK} (Baris {activeRecord.BARIS})</span>
                  <svg className="size-3 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </button>
              ) : isAttrMinimized ? (
                /* State 2: Saat Diminimize */
                <div className="inline-flex items-center gap-2 rounded-lg bg-white/95 px-3 py-1.5 shadow-lg backdrop-blur-md border border-gray-200/90 dark:bg-gray-900/95 dark:border-gray-800">
                  <span className="size-2 rounded-full bg-blue-600 inline-block" />
                  <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">
                    Blok {activeRecord.BLOK} (Baris {activeRecord.BARIS}, Ancak {activeRecord.ANCAK})
                  </span>
                  <div className="flex items-center gap-1 border-l border-gray-200 pl-1.5 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setIsAttrMinimized(false)}
                      title="Perbesar Tampilan"
                      className="rounded p-0.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAttrOpen(false)}
                      title="Tutup Panel"
                      className="rounded p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 cursor-pointer"
                    >
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                /* State 3: Compact Card */
                <div className="w-72 sm:w-80 rounded-xl bg-white/95 p-3 shadow-xl backdrop-blur-md border border-gray-200/90 dark:bg-gray-900/95 dark:border-gray-800 transition-all animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 mb-2 dark:border-gray-800">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-blue-600 inline-block" />
                      <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                        Atribut Blok {activeRecord.BLOK} (Baris {activeRecord.BARIS})
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setIsAttrMinimized(true)}
                        title="Kecilkan / Minimize"
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition cursor-pointer"
                      >
                        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAttrOpen(false)}
                        title="Tutup Panel"
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition cursor-pointer"
                      >
                        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="max-h-44 overflow-y-auto pr-1 space-y-1 divide-y divide-gray-100 dark:divide-gray-800/60 font-mono text-xs">
                    {POKOK_SAWIT_COLUMNS.map((col) => (
                      <div key={col} className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="text-gray-500 dark:text-gray-400">{col}:</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200 text-right truncate max-w-[150px]">
                          {activeRecord[col] !== undefined && activeRecord[col] !== null
                            ? String(activeRecord[col])
                            : "-"}
                        </span>
                      </div>
                    ))}

                    {currentCoords && (
                      <div className="flex items-center justify-between pt-1 text-[10px] text-gray-500">
                        <span>Koordinat:</span>
                        <span className="font-mono text-blue-600 dark:text-blue-400">
                          {currentCoords[0].toFixed(6)}, {currentCoords[1].toFixed(6)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
