import { useTheme } from "@/contexts";
import type { ApexOptions } from "apexcharts";
import { useState, useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import {
  getDecisionMatrixData,
  getModuleColors,
} from "../mock-data";
import { MODULE_CONFIGS } from "../module-config";
import type { DashboardFilterState } from "../types";
import DecisionMatrixModal from "./decision-matrix-modal";

const monthLabels = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Ags", "Sep", "Okt", "Nov", "Des"
];

interface OperationalTrendChartProps {
  filters?: DashboardFilterState;
  compact?: boolean;
}

export default function OperationalTrendChart({
  filters,
  compact = false,
}: OperationalTrendChartProps) {
  const { theme } = useTheme();
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

  // Dynamic multiplier based on filters
  const multiplier = useMemo(() => {
    if (!filters) return 1.0;
    if (filters.estate !== "Semua") return 0.12; // 1 estate represents ~12%
    if (filters.region !== "Semua") return 0.35; // 1 region represents ~35%
    if (filters.company === "BSL") return 0.15; // BSL represents ~15%
    if (filters.company === "PT_BUM") return 0.85; // PT BUM represents ~85%
    return 1.0;
  }, [filters]);

  const activeFilters = useMemo<DashboardFilterState>(() => {
    return (
      filters || {
        company: "Semua",
        region: "Semua",
        estate: "Semua",
        quarter: "Semua",
        month: "Semua",
        year: 2026,
        module: "semua",
      }
    );
  }, [filters]);

  // Data Matriks Keputusan Blok
  const decisionData = useMemo(() => {
    return getDecisionMatrixData(activeFilters);
  }, [activeFilters]);

  // Dataset Bulanan Volume (Target vs Realisasi)
  const volumeDataset = useMemo(() => {
    const baseTarget = [240, 260, 280, 290, 310, 330, 320, 310, 300, 290, 280, 270];
    const baseRealisasi = [230, 255, 275, 288, 305, 320, 312, 300, 290, 0, 0, 0];

    const target = baseTarget.map((val) => Math.round(val * multiplier));
    const realisasi = baseRealisasi.map((val) => Math.round(val * multiplier));

    const modKey = activeFilters.module || "semua";
    const unit = MODULE_CONFIGS[modKey]?.unit || "Ha";
    const { targetColor, realisasiColor } = getModuleColors(modKey);

    return { target, realisasi, unit, targetColor, realisasiColor };
  }, [multiplier, activeFilters.module]);

  // Series ApexCharts: Target vs Realisasi
  const chartSeries = useMemo(() => {
    return [
      {
        name: `Target (${volumeDataset.unit})`,
        data: volumeDataset.target,
      },
      {
        name: `Realisasi (${volumeDataset.unit})`,
        data: volumeDataset.realisasi,
      },
    ];
  }, [volumeDataset]);

  // Opsi ApexCharts
  const options: ApexOptions = useMemo(() => {
    const colors = [volumeDataset.targetColor, volumeDataset.realisasiColor];

    return {
      chart: {
        fontFamily: "Outfit, sans-serif",
        height: compact ? "100%" : 290,
        type: "area",
        toolbar: { show: false },
        sparkline: { enabled: false },
        parentHeightOffset: 0,
      },
      colors,
      stroke: {
        curve: "smooth",
        width: compact ? [1.5, 2] : [2, 3],
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.35,
          opacityTo: 0.05,
          stops: [0, 90, 100],
        },
      },
      dataLabels: { enabled: false },
      legend: {
        show: false,
      },
      xaxis: {
        categories: monthLabels,
        labels: {
          style: {
            colors: theme === "dark" ? "#94A3B8" : "#64748B",
            fontSize: compact ? "9.5px" : "11.5px",
          },
          offsetY: compact ? -2 : 0,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        show: !compact,
        labels: {
          style: {
            colors: theme === "dark" ? "#94A3B8" : "#64748B",
            fontSize: "10.5px",
          },
          formatter: (val?: number | null) =>
            val != null
              ? `${Math.round(val).toLocaleString("id-ID")} ${volumeDataset.unit}`
              : `0 ${volumeDataset.unit}`,
        },
      },
      grid: {
        borderColor: theme === "dark" ? "#1E293B" : "#F1F5F9",
        strokeDashArray: 4,
        padding: compact
          ? { top: -10, right: 12, bottom: 4, left: 12 }
          : { top: 0, right: 20, bottom: 0, left: 20 },
      },
      tooltip: {
        theme: theme === "dark" ? "dark" : "light",
        y: {
          formatter: (val?: number | null) =>
            val != null
              ? `${Math.round(val).toLocaleString("id-ID")} ${volumeDataset.unit}`
              : `0 ${volumeDataset.unit}`,
        },
      },
    };
  }, [theme, volumeDataset, compact]);

  return (
    <>
      <div
        className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 flex flex-col justify-between ${
          compact ? "p-2.5 h-full shadow-xs" : "p-5 sm:p-6 space-y-4"
        }`}
      >
        {/* Header Card dengan Legend & Matriks Keputusan */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 dark:border-gray-800 gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h3
              className={`font-bold text-gray-800 dark:text-white/90 truncate ${
                compact ? "text-xs" : "text-base"
              }`}
            >
              Tren Analitik Lapangan
            </h3>
            {filters?.estate !== "Semua" && (
              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                {filters?.estate}
              </span>
            )}

            {/* Badge Peringatan Blok Kritis / Decision Matrix */}
            {decisionData.criticalCount > 0 && (
              <button
                type="button"
                onClick={() => setIsDecisionModalOpen(true)}
                className="inline-flex items-center gap-1 cursor-pointer rounded-full bg-rose-50 px-2 py-0.5 text-[9.5px] font-bold text-rose-600 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-400 dark:hover:bg-rose-900/60 transition-colors"
                title="Buka Matriks Keputusan Blok"
              >
                <svg className="size-3 text-rose-500 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{decisionData.criticalCount} Blok Perlu Perhatian</span>
              </button>
            )}
          </div>

          {/* Controls: Legend & Satuan */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-gray-500 dark:text-gray-400">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: volumeDataset.targetColor }}
              />
              <span>Target</span>
            </div>
            <div
              className="flex items-center gap-1.5 text-[10.5px] font-bold"
              style={{ color: volumeDataset.realisasiColor }}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: volumeDataset.realisasiColor }}
              />
              <span>Realisasi</span>
            </div>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[9.5px] font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              {volumeDataset.unit}
            </span>
          </div>
        </div>

        {/* Chart Canvas Area */}
        <div className={compact ? "mt-1 flex-1 min-h-[140px] w-full" : "w-full"}>
          <ReactApexChart
            options={options}
            series={chartSeries}
            type="area"
            height={compact ? "100%" : 280}
          />
        </div>

        {/* Panel Ringkas Matriks Keputusan Blok (Hanya tampil di mode biasa/non-compact) */}
        {!compact && decisionData.needsAttention.length > 0 && (
          <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3.5 dark:border-rose-950/40 dark:bg-rose-950/10">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
                <svg className="size-3.5 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>Rekomendasi Tindakan Cepat (Blok Perlu Perhatian Segera)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsDecisionModalOpen(true)}
                className="text-[11px] font-bold text-rose-700 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-200 underline cursor-pointer"
              >
                Lihat Semua ({decisionData.criticalCount} Blok) &rarr;
              </button>
            </div>

            {/* Grid 3 Blok Prioritas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {decisionData.needsAttention.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-gray-200/80 bg-white p-2.5 shadow-2xs dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-gray-900 dark:text-white">Blok {item.blok}</span>
                    <span className="text-[10px] text-rose-600 dark:text-rose-400">
                      Defisit -{item.defisitHa} Ha ({item.capaianPct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1.5 truncate">
                    {item.estate} • {item.afdeling} • {item.kondisi}
                  </div>
                  <div className="text-[10px] text-gray-700 dark:text-gray-300 line-clamp-2">
                    <span className="font-semibold text-rose-700 dark:text-rose-400">Aksi: </span>
                    {item.rekomendasi}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Dialog Matriks Keputusan Lengkap */}
      <DecisionMatrixModal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        decisionData={decisionData}
        filters={activeFilters}
      />
    </>
  );
}
