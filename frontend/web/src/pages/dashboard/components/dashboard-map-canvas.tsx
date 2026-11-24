import "leaflet/dist/leaflet.css";
import { MinusIcon, PlusIcon, XIcon } from "@/icons";
import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getMapFeatures,
  getStatusDistribution,
  type GeoPolygonFeature,
} from "../mock-data";
import { MODULE_CONFIGS } from "../module-config";
import type { DashboardFilterState } from "../types";

interface DashboardMapCanvasProps {
  filters: DashboardFilterState;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  isFillContainer?: boolean;
}

export default function DashboardMapCanvas({
  filters,
  isFullscreen = false,
  isFillContainer = false,
}: DashboardMapCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.FeatureGroup | null>(null);

  const [basemap, setBasemap] = useState<"satellite" | "osm">("satellite");
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(true);
  const [selectedFeature, setSelectedFeature] = useState<GeoPolygonFeature | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(11);
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState<boolean>(false);

  // Distribusi status dinamis untuk legenda peta
  const distribution = useMemo(() => getStatusDistribution(filters), [filters]);

  // Layer poligon & marker selalu aktif dan sinkron dengan filter global
  const showEstates = true;
  const showBlocks = true;
  const showMarkers = true;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Concession center Kalimantan Tengah
    const initialCenter: L.LatLngExpression = [-1.55, 113.97];
    const initialZoom = 11;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false, // Custom zoom buttons used
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Feature group for overlays
    const layersGroup = L.featureGroup().addTo(map);
    layersGroupRef.current = layersGroup;

    map.on("zoomend", () => {
      setCurrentZoom(map.getZoom());
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Listen to Escape key to exit canvas fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCanvasFullscreen) {
        setIsCanvasFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCanvasFullscreen]);

  // Invalidate Map Size whenever container, canvas fullscreen or dashboard fullscreen changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [isCanvasFullscreen, isFullscreen, isFillContainer]);

  // Update Basemap Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    let tileLayer: L.TileLayer;
    if (basemap === "satellite") {
      tileLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
          attribution: "Esri World Imagery",
        }
      );
    } else {
      tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "OpenStreetMap",
      });
    }

    tileLayer.addTo(map);

    return () => {
      map.removeLayer(tileLayer);
    };
  }, [basemap]);

  // Render Geospatial Overlays based on Filters (Automatic filtering for PT BUM, BSL, Region, Estate)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layersGroup = layersGroupRef.current;
    if (!map || !layersGroup) return;

    layersGroup.clearLayers();

    // 1. Dapatkan fitur peta dengan warna & kondisi sesuai modul aktif
    const { estates: filteredEstates, blocks: filteredBlocks } = getMapFeatures(filters);

    // Add Estate Polygons
    if (showEstates) {
      filteredEstates.forEach((feature) => {
        const polygon = L.polygon(feature.coordinates, {
          color: feature.warnaHex,
          weight: 2,
          opacity: 0.9,
          fillColor: feature.warnaHex,
          fillOpacity: 0.25,
          dashArray: "4, 4",
        });

        polygon.bindTooltip(
          `<strong>${feature.name}</strong><br/>Luas: ${feature.luasHa.toFixed(1)} Ha | Capaian: ${feature.capaianPct}%`,
          { sticky: true, className: "custom-leaflet-tooltip" }
        );

        polygon.on("click", () => {
          setSelectedFeature(feature);
          map.fitBounds(polygon.getBounds(), { padding: [40, 40] });
        });

        layersGroup.addLayer(polygon);
      });
    }

    // Add Operational Block Polygons
    if (showBlocks) {
      filteredBlocks.forEach((feature) => {
        const polygon = L.polygon(feature.coordinates, {
          color: feature.warnaHex,
          weight: 2.5,
          opacity: 1,
          fillColor: feature.warnaHex,
          fillOpacity: 0.65,
        });

        polygon.bindTooltip(
          `<strong>${feature.name} (${feature.afdeling})</strong><br/>Kondisi: ${feature.kondisi} | SPH: ${feature.sph}`,
          { sticky: true, className: "custom-leaflet-tooltip" }
        );

        polygon.on("click", () => {
          setSelectedFeature(feature);
          map.fitBounds(polygon.getBounds(), { padding: [50, 50] });
        });

        layersGroup.addLayer(polygon);

        // Optional Warung/Pos Mandor Markers
        if (showMarkers && feature.warung) {
          const centerLat = (feature.coordinates[0][0] + feature.coordinates[2][0]) / 2;
          const centerLng = (feature.coordinates[0][1] + feature.coordinates[2][1]) / 2;

          const customIcon = L.divIcon({
            className: "custom-pin",
            html: `
              <div style="background-color: ${feature.warnaHex}; width: 14px; height: 14px; border-radius: 9999px; border: 2px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.4);"></div>
            `,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });

          const marker = L.marker([centerLat, centerLng], { icon: customIcon });
          marker.bindTooltip(`<strong>${feature.warung}</strong><br/>${feature.name}`, {
            direction: "top",
          });
          layersGroup.addLayer(marker);
        }
      });
    }

    // Auto-fit bounds if layers exist
    if (layersGroup.getLayers().length > 0) {
      map.fitBounds(layersGroup.getBounds(), { padding: [30, 30] });
    }
  }, [filters, basemap, showEstates, showBlocks, showMarkers]);

  // Zoom In & Zoom Out Handlers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current && layersGroupRef.current) {
      if (layersGroupRef.current.getLayers().length > 0) {
        mapInstanceRef.current.fitBounds(layersGroupRef.current.getBounds(), { padding: [30, 30] });
      } else {
        mapInstanceRef.current.setView([-1.55, 113.97], 11);
      }
    }
  };

  return (
    <div
      className={`transition-all ${
        isCanvasFullscreen
          ? "fixed inset-0 z-999999 h-screen w-screen bg-gray-950 overflow-hidden"
          : isFillContainer
          ? "relative h-full w-full overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3"
          : "relative h-[540px] w-full overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3"
      }`}
    >
      {/* Map Canvas DOM */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Explicit Zoom Controls (+ and -) at Top-Left with Zoom Level Badge */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col items-center overflow-hidden rounded-xl border border-gray-200/90 bg-white/95 shadow-md backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90">
        <button
          type="button"
          onClick={handleZoomIn}
          className="flex size-8.5 cursor-pointer items-center justify-center text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:text-gray-200 dark:hover:bg-brand-950/40 dark:hover:text-brand-400"
          title="Perbesar Peta (+)"
          aria-label="Perbesar Peta"
        >
          <PlusIcon className="size-4 stroke-[2.5]" />
        </button>
        <div
          className="flex h-5 w-full items-center justify-center border-y border-gray-200 bg-gray-50 px-1 text-[9px] font-bold text-gray-600 select-none dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300"
          title={`Tingkat Zoom Peta: ${currentZoom}`}
        >
          {currentZoom}z
        </div>
        <button
          type="button"
          onClick={handleZoomOut}
          className="flex size-8.5 cursor-pointer items-center justify-center text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:text-gray-200 dark:hover:bg-brand-950/40 dark:hover:text-brand-400"
          title="Perkecil Peta (-)"
          aria-label="Perkecil Peta"
        >
          <MinusIcon className="size-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Floating Control Toolbar (Top-Right): Basemap Switcher, Reset & Layar Penuh Canvas */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-wrap items-center gap-1.5">
        {/* Basemap Switcher */}
        <div className="flex items-center overflow-hidden rounded-lg border border-gray-200/80 bg-white/95 p-0.5 shadow-md backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90">
          <button
            type="button"
            onClick={() => setBasemap("satellite")}
            className={`cursor-pointer rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
              basemap === "satellite"
                ? "bg-brand-500 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Satelit
          </button>
          <button
            type="button"
            onClick={() => setBasemap("osm")}
            className={`cursor-pointer rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
              basemap === "osm"
                ? "bg-brand-500 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Peta Jalan
          </button>
        </div>

        {/* Reset View */}
        <div className="flex items-center rounded-lg border border-gray-200/80 bg-white/95 p-0.5 shadow-md backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90">
          <button
            type="button"
            onClick={handleResetView}
            className="cursor-pointer rounded-md px-2 py-0.5 text-[11px] font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            title="Reset Pandangan Peta"
          >
            Reset
          </button>
        </div>

        {/* Tombol Layar Penuh Khusus Canvas Peta */}
        <div className="flex items-center rounded-lg border border-gray-200/80 bg-white/95 p-0.5 shadow-md backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90">
          <button
            type="button"
            onClick={() => setIsCanvasFullscreen((prev) => !prev)}
            className={`cursor-pointer rounded-md px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
              isCanvasFullscreen
                ? "bg-amber-500 text-white shadow-xs hover:bg-amber-600"
                : "bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/20 dark:text-brand-300 dark:hover:bg-brand-500/30"
            }`}
            title={isCanvasFullscreen ? "Tutup Layar Penuh Peta (ESC)" : "Layar Penuh Kanvas Peta Saja"}
          >
            {isCanvasFullscreen ? "Tutup Peta Penuh" : "Layar Penuh"}
          </button>
        </div>

        {/* Tombol Keluar Langsung saat Canvas Fullscreen Aktif */}
        {isCanvasFullscreen && (
          <button
            type="button"
            onClick={() => setIsCanvasFullscreen(false)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-md transition-colors hover:bg-rose-700"
            title="Keluar Layar Penuh Canvas (ESC)"
          >
            <XIcon className="size-3.5" />
            <span>Keluar (ESC)</span>
          </button>
        )}
      </div>

      {/* Floating Legend (Bottom-Left) */}
      <div className="absolute bottom-3 left-3 z-[1000] rounded-xl border border-gray-200/80 bg-white/95 p-2 shadow-lg backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90 max-w-[280px]">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-1 dark:border-gray-800">
          <div className="text-[11px] font-bold text-gray-800 dark:text-white/90">
            Legenda {filters.module && filters.module !== "semua" ? MODULE_CONFIGS[filters.module]?.shortName : "Kondisi"}
          </div>
          <button
            type="button"
            onClick={() => setIsLegendOpen(!isLegendOpen)}
            className="cursor-pointer text-[10px] font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            {isLegendOpen ? "Tutup" : "Buka"}
          </button>
        </div>

        {isLegendOpen && (
          <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
            {distribution.map((item) => (
              <div key={item.kondisi} className="flex items-center justify-between gap-1.5 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="size-2.5 shrink-0 rounded-xs shadow-xs"
                    style={{ backgroundColor: item.warnaHex }}
                  />
                  <span className="text-gray-700 dark:text-gray-300 truncate font-medium" title={item.label}>
                    {item.label}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 shrink-0">
                  {item.pct}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feature Detail Drawer (Bottom-Right) */}
      {selectedFeature && (
        <div className="absolute bottom-3 right-3 z-[1000] w-72 rounded-xl border border-gray-200/90 bg-white/98 p-3 shadow-xl backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95">
          <div className="flex items-start justify-between border-b border-gray-100 pb-1.5 dark:border-gray-800">
            <div>
              <div className="text-xs font-bold text-gray-800 dark:text-white/90">
                {selectedFeature.name}
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400">
                {selectedFeature.company} • {selectedFeature.region} • {selectedFeature.estate}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFeature(null)}
              className="cursor-pointer rounded-md p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            >
              ✕
            </button>
          </div>

          <div className="mt-2 space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Status Kondisi:</span>
              <span
                className="rounded-md px-1.5 py-0.2 text-[10px] font-bold text-white shadow-xs"
                style={{ backgroundColor: selectedFeature.warnaHex }}
              >
                {selectedFeature.kondisi}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Luas Baku:</span>
              <span className="font-semibold text-gray-800 dark:text-white">
                {selectedFeature.luasHa.toFixed(1)} Ha
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Realisasi Selesai:</span>
              <span className="font-semibold text-gray-800 dark:text-white">
                {selectedFeature.realisasiHa.toFixed(1)} Ha ({selectedFeature.capaianPct.toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">SPH Standar:</span>
              <span className="font-semibold text-gray-800 dark:text-white">
                {selectedFeature.sph} Pkk/Ha
              </span>
            </div>
            {selectedFeature.afdeling && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Afdeling:</span>
                <span className="font-semibold text-gray-800 dark:text-white">
                  {selectedFeature.afdeling}
                </span>
              </div>
            )}
            {selectedFeature.warung && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Warung Mandor:</span>
                <span className="font-semibold text-gray-800 dark:text-white">
                  {selectedFeature.warung}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
