import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface BoundaryMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  levelName: string;
  data: Record<string, any> | null;
  strokeColor: string;
  strokeWeight: number;
  dashArray?: string;
  fillOpacity?: number;
}

export default function BoundaryMapModal({
  isOpen,
  onClose,
  title,
  levelName,
  data,
  strokeColor,
  strokeWeight,
  dashArray,
  fillOpacity = 0.15,
}: BoundaryMapModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const [basemap, setBasemap] = useState<"satellite" | "osm">("satellite");

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Center perkebunan sawit (Kalimantan Tengah / Ketapang region)
    const defaultCenter: [number, number] = [-1.82, 110.35];

    // Generate coordinates based on data or realistic sample polygon
    let coords: [number, number][] = [];
    if (data?.coordinates && Array.isArray(data.coordinates)) {
      coords = data.coordinates;
    } else {
      // Create a pleasant polygon centered around base
      const latOffset = (Math.random() - 0.5) * 0.05;
      const lngOffset = (Math.random() - 0.5) * 0.05;
      const cLat = defaultCenter[0] + latOffset;
      const cLng = defaultCenter[1] + lngOffset;
      const r = levelName.includes("Region")
        ? 0.04
        : levelName.includes("Estate")
        ? 0.025
        : levelName.includes("Afdeling")
        ? 0.015
        : levelName.includes("Warung")
        ? 0.009
        : levelName.includes("Blok")
        ? 0.006
        : 0.002;

      coords = [
        [cLat - r * 0.8, cLng - r * 1.1],
        [cLat - r * 0.9, cLng + r * 0.9],
        [cLat + r * 0.7, cLng + r * 1.2],
        [cLat + r * 1.0, cLng - r * 0.6],
        [cLat + r * 0.2, cLng - r * 1.2],
      ];
    }

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 14,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear old layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer || layer instanceof L.Polygon) {
        map.removeLayer(layer);
      }
    });

    // Basemap
    if (basemap === "satellite") {
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Esri World Imagery",
          maxZoom: 19,
        }
      ).addTo(map);
      // Hybrid labels overlay
      L.tileLayer(
        "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
        }
      ).addTo(map);
    } else {
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
    }

    // Add Polygon Layer with specific stroke and dashArray
    const polygon = L.polygon(coords, {
      color: strokeColor,
      weight: strokeWeight,
      dashArray: dashArray,
      fillColor: strokeColor,
      fillOpacity: fillOpacity,
      smoothFactor: 1,
    }).addTo(map);

    polygonLayerRef.current = polygon;

    // Bind popup with row attributes
    if (data) {
      const popupContent = `
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; min-width: 160px;">
          <div style="font-weight: bold; color: ${strokeColor}; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 6px;">
            ${levelName.toUpperCase()}
          </div>
          ${Object.entries(data)
            .filter(([k]) => k !== "coordinates" && k !== "id")
            .map(([k, v]) => `<div><span style="color:#666">${k}:</span> <b>${v ?? "-"}</b></div>`)
            .join("")}
        </div>
      `;
      polygon.bindPopup(popupContent);
    }

    // Fit bounds
    map.fitBounds(polygon.getBounds(), { padding: [40, 40] });

    // Handle resize
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      // Cleanup: destroy map instance so next record re-initializes cleanly
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        polygonLayerRef.current = null;
      }
    };
  }, [isOpen, basemap, data, strokeColor, strokeWeight, dashArray, fillOpacity, levelName]);

  const handleZoomToFit = () => {
    if (mapInstanceRef.current && polygonLayerRef.current) {
      mapInstanceRef.current.fitBounds(polygonLayerRef.current.getBounds(), {
        padding: [40, 40],
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-4xl h-[85vh] rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40">
          <div className="flex items-center gap-3">
            <span
              className="size-3.5 rounded-full inline-block ring-2 ring-white dark:ring-gray-900"
              style={{ backgroundColor: strokeColor }}
            />
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {title}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Visualisasi Poligon Spasial {levelName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Basemap Switcher */}
            <div className="flex rounded-lg bg-gray-200 p-0.5 text-xs dark:bg-gray-700">
              <button
                type="button"
                onClick={() => setBasemap("satellite")}
                className={`rounded-md px-2.5 py-1 font-medium transition cursor-pointer ${
                  basemap === "satellite"
                    ? "bg-white text-gray-900 shadow-xs dark:bg-gray-800 dark:text-white"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                }`}
              >
                Satelit
              </button>
              <button
                type="button"
                onClick={() => setBasemap("osm")}
                className={`rounded-md px-2.5 py-1 font-medium transition cursor-pointer ${
                  basemap === "osm"
                    ? "bg-white text-gray-900 shadow-xs dark:bg-gray-800 dark:text-white"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                }`}
              >
                OSM Jalan
              </button>
            </div>

            <button
              type="button"
              onClick={handleZoomToFit}
              title="Fokus ke Poligon"
              className="rounded-lg border border-gray-300 bg-white p-1.5 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="m4.93 4.93 4.24 4.24" />
                <path d="m14.83 9.17 4.24-4.24" />
                <path d="m14.83 14.83 4.24 4.24" />
                <path d="m9.17 14.83-4.24 4.24" />
              </svg>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition cursor-pointer"
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative flex-1 w-full bg-gray-100 dark:bg-gray-950">
          <div ref={mapContainerRef} className="absolute inset-0 z-0" />

          {/* Bottom Floating Info Card */}
          {data && (
            <div className="absolute bottom-4 left-4 z-10 max-w-md rounded-xl bg-white/95 p-3.5 shadow-lg backdrop-blur-md border border-gray-200 dark:bg-gray-900/95 dark:border-gray-800">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Atribut Spasial Terpilih
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {Object.entries(data)
                  .filter(([k]) => k !== "coordinates" && k !== "id")
                  .slice(0, 8)
                  .map(([key, val]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                        {key}
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {String(val ?? "-")}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
