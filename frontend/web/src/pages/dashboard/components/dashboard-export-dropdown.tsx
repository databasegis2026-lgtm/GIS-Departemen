import { AngleDownIcon, CameraIcon, DocIcon, DownloadIcon, MapIcon, TableIcon } from "@/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  exportDashboardToPNG,
  exportToCSV,
  exportToExcelXML,
  exportToGeoJSON,
  getAfdelingData,
  MOCK_BLOCK_DATA,
  MOCK_ESTATE_POLYGONS,
  MOCK_OPERATIONAL_BLOCK_POLYGONS,
} from "../mock-data";
import { printAfdelingPDF, printAllAfdelingsPDF, printEstatePDF } from "../print-reports";
import type { DashboardFilterState } from "../types";

interface DashboardExportDropdownProps {
  filters: DashboardFilterState;
  compact?: boolean;
}

export default function DashboardExportDropdown({ filters, compact = false }: DashboardExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isEstateSelected = filters.estate !== "Semua";

  // Afdeling list for selected estate
  const afdelings = useMemo(() => {
    return isEstateSelected ? getAfdelingData(filters.estate, filters.module) : [];
  }, [isEstateSelected, filters.estate, filters.module]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter current block data according to active filters
  const getFilteredBlocks = () => {
    let data = MOCK_BLOCK_DATA;

    if (filters.company === "BSL") {
      data = data.filter((d) => d.estate === "BSL");
    } else if (filters.company === "PT_BUM") {
      data = data.filter((d) => d.estate !== "BSL");
    }

    if (filters.region !== "Semua") {
      data = data.filter((d) => d.region === filters.region);
    }

    if (filters.estate !== "Semua") {
      data = data.filter((d) => d.estate === filters.estate);
    }

    return data;
  };

  const handlePrintPDF = () => {
    setIsOpen(false);
    if (isEstateSelected) {
      printEstatePDF(filters);
    } else {
      setTimeout(() => {
        window.print();
      }, 150);
    }
  };

  const handleExportPNG = () => {
    const estateStr = filters.estate !== "Semua" ? filters.estate : filters.region !== "Semua" ? filters.region : filters.company;
    exportDashboardToPNG(filters, `Dashboard-GIS-2026-${estateStr.replace(/\s+/g, "_")}.png`);
    setIsOpen(false);
  };

  const handleExportExcel = () => {
    const data = getFilteredBlocks();
    exportToExcelXML(data, `Laporan-Operasional-2026-${filters.region.replace(/\s+/g, "_")}.xls`);
    setIsOpen(false);
  };

  const handleExportCSV = () => {
    const data = getFilteredBlocks();
    exportToCSV(data, `Data-Operasional-2026-${filters.region.replace(/\s+/g, "_")}.csv`);
    setIsOpen(false);
  };

  const handleExportGeoJSON = () => {
    exportToGeoJSON(
      MOCK_ESTATE_POLYGONS,
      MOCK_OPERATIONAL_BLOCK_POLYGONS,
      `Peta-Geospasial-Kebun-2026.geojson`
    );
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left z-[10000]" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={
          compact
            ? "inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 shadow-xs transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            : "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 text-xs font-semibold text-gray-700 shadow-xs transition-colors hover:bg-gray-50 hover:text-gray-900 focus:outline-hidden dark:border-gray-800 dark:bg-gray-800/80 dark:text-gray-200 dark:hover:bg-gray-700/80"
        }
        aria-expanded={isOpen}
      >
        <DownloadIcon className={compact ? "size-3.5 text-brand-600 dark:text-brand-400" : "size-4 text-brand-600 dark:text-brand-400"} />
        <span>{compact ? (isEstateSelected ? `Cetak (${filters.estate})` : "Cetak / Ekspor") : (isEstateSelected ? `Cetak Laporan (${filters.estate})` : "Cetak & Ekspor")}</span>
        <AngleDownIcon className={`size-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-[100000] mt-2 w-80 origin-top-right rounded-xl border border-gray-200 bg-white p-1.5 shadow-2xl transition-all focus:outline-hidden dark:border-gray-800 dark:bg-gray-900 max-h-[85vh] overflow-y-auto">
          {/* Bagian Khusus Saat Estate Dipilih */}
          {isEstateSelected && (
            <div className="border-b border-gray-100 pb-2 mb-2 dark:border-gray-800">
              <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-brand-600 uppercase dark:text-brand-400 flex items-center justify-between">
                <span>Laporan Estate: {filters.estate}</span>
                <span className="text-[9px] bg-brand-50 px-1.5 py-0.2 rounded dark:bg-brand-950/40">{afdelings.length} AFD</span>
              </div>

              {/* 1. Cetak PDF Estate */}
              <button
                type="button"
                onClick={() => {
                  printEstatePDF(filters);
                  setIsOpen(false);
                }}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-gray-700 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:text-gray-200 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                  <DocIcon className="size-4" />
                </div>
                <div>
                  <div className="font-semibold text-rose-700 dark:text-rose-300">Cetak PDF Ringkasan Estate</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">
                    Laporan eksekutif menyeluruh {filters.estate}
                  </div>
                </div>
              </button>

              {/* 2. Cetak Bundle Semua Afdeling */}
              <button
                type="button"
                onClick={() => {
                  printAllAfdelingsPDF(filters.estate, filters);
                  setIsOpen(false);
                }}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-gray-200 dark:hover:bg-brand-950/30 dark:hover:text-brand-300"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
                  <DocIcon className="size-4" />
                </div>
                <div>
                  <div className="font-semibold text-brand-700 dark:text-brand-300">Cetak Semua Afdeling (Bundle)</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">
                    Mencetak seluruh lembar kerja {afdelings.length} AFD
                  </div>
                </div>
              </button>

              {/* 3. Cetak per Afdeling Individual */}
              <div className="mt-1.5 px-3 py-1 text-[9px] font-bold text-gray-400 uppercase dark:text-gray-500">
                Cetak Lembar Kerja per Afdeling
              </div>
              <div className="space-y-0.5 px-1">
                {afdelings.map((afd) => (
                  <button
                    key={afd.afdeling}
                    type="button"
                    onClick={() => {
                      printAfdelingPDF(filters.estate, afd.afdeling, filters);
                      setIsOpen(false);
                    }}
                    className="flex w-full cursor-pointer items-center justify-between rounded-md px-2.5 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ backgroundColor: afd.warnaHex }} />
                      <span className="font-medium">{afd.afdeling}</span>
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: afd.warnaHex }}>
                      {afd.capaianPct.toFixed(1)}% • Cetak
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-gray-400 uppercase dark:text-gray-500">
            {isEstateSelected ? "Ekspor & Format Lainnya" : "Pilihan Cetak & Ekspor"}
          </div>

          {/* Cetak PDF Default jika belum pilih estate */}
          {!isEstateSelected && (
            <button
              type="button"
              onClick={handlePrintPDF}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-xs text-gray-700 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:text-gray-200 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                <DocIcon className="size-4" />
              </div>
              <div>
                <div className="font-semibold">Cetak PDF Layar (.pdf)</div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500">
                  Dialog cetak dokumen / simpan PDF
                </div>
              </div>
            </button>
          )}

          {/* Cetak PNG */}
          <button
            type="button"
            onClick={handleExportPNG}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-xs text-gray-700 transition-colors hover:bg-amber-50 hover:text-amber-700 dark:text-gray-200 dark:hover:bg-amber-950/30 dark:hover:text-amber-300"
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              <CameraIcon className="size-4" />
            </div>
            <div>
              <div className="font-semibold">Cetak PNG Peta & Ringkasan</div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500">
                Tangkapan resolusi tinggi peta & KPI
              </div>
            </div>
          </button>

          {/* Cetak Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-xs text-gray-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-gray-200 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300"
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
              <TableIcon className="size-4" />
            </div>
            <div>
              <div className="font-semibold">Cetak Excel (.xls)</div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500">
                14 kolom standar operasional
              </div>
            </div>
          </button>

          {/* Cetak CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-xs text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
              <DocIcon className="size-4" />
            </div>
            <div>
              <div className="font-semibold">Cetak CSV (.csv)</div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500">
                Standar data blok operasional
              </div>
            </div>
          </button>

          {/* Cetak GeoJSON */}
          <button
            type="button"
            onClick={handleExportGeoJSON}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-xs text-gray-700 transition-colors hover:bg-purple-50 hover:text-purple-700 dark:text-gray-200 dark:hover:bg-purple-950/30 dark:hover:text-purple-300"
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
              <MapIcon className="size-4" />
            </div>
            <div>
              <div className="font-semibold">Cetak GeoJSON (.geojson)</div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500">
                Fitur poligon batas kebun & blok spasial
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
