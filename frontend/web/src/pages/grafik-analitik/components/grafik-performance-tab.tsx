import { useState, useMemo } from "react";
import { useTheme } from "@/contexts";
import type { ApexOptions } from "apexcharts";
import ReactApexChart from "react-apexcharts";
import type { DashboardFilterState } from "@/pages/dashboard/types";
import {
  getConditionColor,
  getMonthlyConditionBreakdown,
  getModuleColors,
  MOCK_BLOCK_DATA,
} from "@/pages/dashboard/mock-data";
import { MODULE_CONFIGS } from "@/pages/dashboard/module-config";

interface GrafikPerformanceTabProps {
  filters: DashboardFilterState;
}

type AggregationLevel = "region" | "estate" | "afdeling" | "blok";
type ViewMode = "volume" | "kondisi";

export default function GrafikPerformanceTab({ filters }: GrafikPerformanceTabProps) {
  const { theme } = useTheme();
  const [aggregationLevel, setAggregationLevel] = useState<AggregationLevel>("estate");
  const [viewMode, setViewMode] = useState<ViewMode>("volume");
  const [tableSearch, setTableSearch] = useState("");

  const activeModule = MODULE_CONFIGS[filters.module] || MODULE_CONFIGS.semua;
  const unit = activeModule.unit;
  const { targetColor, realisasiColor } = getModuleColors(filters.module);

  // Filter blok berdasarkan filter global
  const filteredBlocks = useMemo(() => {
    return MOCK_BLOCK_DATA.filter((b) => {
      if (filters.company === "BSL" && b.estate !== "BSL") return false;
      if (filters.company === "PT_BUM" && b.estate === "BSL") return false;
      if (filters.region !== "Semua" && b.region !== filters.region) return false;
      if (filters.estate !== "Semua" && b.estate !== filters.estate) return false;
      return true;
    });
  }, [filters]);

  // Agregasi Data Chart
  const aggregatedData = useMemo(() => {
    const map = new Map<string, { label: string; target: number; realisasi: number }>();

    filteredBlocks.forEach((b) => {
      let key = b.estate;
      if (aggregationLevel === "region") key = b.region;
      if (aggregationLevel === "afdeling") key = `${b.estate} - ${b.afdeling}`;
      if (aggregationLevel === "blok") key = `${b.estate} - ${b.blok}`;

      const existing = map.get(key) || { label: key, target: 0, realisasi: 0 };
      existing.target += b.luasHa;
      existing.realisasi += b.realisasiHa;
      map.set(key, existing);
    });

    const items = Array.from(map.values()).map((item) => ({
      ...item,
      target: Math.round(item.target),
      realisasi: Math.round(item.realisasi),
      capaianPct: item.target > 0 ? (item.realisasi / item.target) * 100 : 0,
    }));

    return items.slice(0, 15); // Ambil maks 15 entitas agar terbaca rapi
  }, [filteredBlocks, aggregationLevel]);

  // Mode Kondisi Stacked Dataset
  const conditionDataset = useMemo(() => {
    return getMonthlyConditionBreakdown(filters, 1.0);
  }, [filters]);

  // ApexCharts Series & Options
  const chartSeries = useMemo(() => {
    if (viewMode === "kondisi") {
      return conditionDataset.series;
    }

    return [
      {
        name: `Target Rencana (${unit})`,
        data: aggregatedData.map((d) => d.target),
      },
      {
        name: `Realisasi Aktual (${unit})`,
        data: aggregatedData.map((d) => d.realisasi),
      },
    ];
  }, [viewMode, conditionDataset, aggregatedData, unit]);

  const categories = useMemo(() => {
    if (viewMode === "kondisi") {
      return ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    }
    return aggregatedData.map((d) => d.label);
  }, [viewMode, aggregatedData]);

  const chartOptions: ApexOptions = useMemo(() => {
    const isStacked = viewMode === "kondisi";
    const colors = isStacked
      ? conditionDataset.series.map((s) => s.color)
      : [targetColor, realisasiColor];

    return {
      chart: {
        fontFamily: "Outfit, sans-serif",
        height: 320,
        type: "bar",
        stacked: isStacked,
        toolbar: { show: false },
        parentHeightOffset: 0,
      },
      colors,
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 3,
          columnWidth: isStacked ? "50%" : "55%",
        },
      },
      dataLabels: { enabled: false },
      legend: {
        show: true,
        position: "top",
        horizontalAlign: "right",
        labels: {
          colors: theme === "dark" ? "#94A3B8" : "#64748B",
        },
      },
      xaxis: {
        categories,
        labels: {
          style: {
            colors: theme === "dark" ? "#94A3B8" : "#64748B",
            fontSize: "11px",
          },
          rotate: categories.length > 8 ? -35 : 0,
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: theme === "dark" ? "#94A3B8" : "#64748B",
            fontSize: "11px",
          },
          formatter: (val?: number | null) =>
            val != null ? `${Math.round(val).toLocaleString("id-ID")} ${unit}` : `0 ${unit}`,
        },
      },
      grid: {
        borderColor: theme === "dark" ? "#1E293B" : "#F1F5F9",
        strokeDashArray: 4,
      },
      tooltip: {
        theme: theme === "dark" ? "dark" : "light",
        y: {
          formatter: (val?: number | null) =>
            val != null ? `${Math.round(val).toLocaleString("id-ID")} ${unit}` : `0 ${unit}`,
        },
      },
    };
  }, [theme, viewMode, conditionDataset, targetColor, realisasiColor, categories, unit]);

  // Data Tabel Terfilter
  const tableData = useMemo(() => {
    const q = tableSearch.toLowerCase().trim();
    if (!q) return filteredBlocks;
    return filteredBlocks.filter(
      (b) =>
        b.blok.toLowerCase().includes(q) ||
        b.estate.toLowerCase().includes(q) ||
        b.afdeling.toLowerCase().includes(q) ||
        b.kondisi.toLowerCase().includes(q)
    );
  }, [filteredBlocks, tableSearch]);

  return (
    <div className="space-y-6">
      {/* 1. Panel Visualisasi Grafik Utama */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3 shadow-xs space-y-4">
        {/* Controls Switcher Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 dark:border-gray-800">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Visualisasi Pencapaian {activeModule.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Evaluasi kinerja komparatif target anggaran vs pencapaian riil lapangan
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Switcher Agregasi */}
            {viewMode === "volume" && (
              <div className="flex items-center rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
                {(["region", "estate", "afdeling", "blok"] as AggregationLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setAggregationLevel(lvl)}
                    className={`cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-bold capitalize transition-all ${
                      aggregationLevel === lvl
                        ? "bg-white text-gray-900 shadow-xs dark:bg-gray-900 dark:text-white"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            )}

            {/* Switcher View Mode (Volume vs Kondisi) */}
            <div className="flex items-center rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setViewMode("volume")}
                className={`cursor-pointer rounded-md px-3 py-1 text-[11px] font-bold transition-all ${
                  viewMode === "volume"
                    ? "bg-white text-gray-900 shadow-xs dark:bg-gray-900 dark:text-white"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Volume Target
              </button>
              <button
                type="button"
                onClick={() => setViewMode("kondisi")}
                className={`cursor-pointer rounded-md px-3 py-1 text-[11px] font-bold transition-all ${
                  viewMode === "kondisi"
                    ? "bg-white text-gray-900 shadow-xs dark:bg-gray-900 dark:text-white"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Distribusi Kondisi
              </button>
            </div>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="w-full">
          <ReactApexChart
            options={chartOptions}
            series={chartSeries}
            type="bar"
            height={320}
          />
        </div>
      </div>

      {/* 2. Tabel Capaian Tabular Tab */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Data Capaian Tabular Blok Kebun
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Rincian angka luasan, realisasi, persentase, dan label kondisi operasional 2026
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Cari blok, estate, kondisi..."
              className="h-8.5 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-xs text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>
        </div>

        {/* Tabel Data */}
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-[11px] font-bold text-gray-600 dark:bg-gray-800/50 dark:text-gray-300 uppercase">
              <tr>
                <th className="px-4 py-3">Entitas Blok</th>
                <th className="px-3.5 py-3">Region / Estate</th>
                <th className="px-3 py-3">Luas Baku</th>
                <th className="px-3 py-3">Realisasi</th>
                <th className="px-3 py-3">Capaian</th>
                <th className="px-3.5 py-3">Status Kondisi</th>
                <th className="px-4 py-3">Progres Capaian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
              {tableData.slice(0, 10).map((item) => {
                const cond = getConditionColor(item.capaianPct, filters.module);
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-bold text-gray-900 dark:text-white">
                      Blok {item.blok}
                    </td>
                    <td className="px-3.5 py-2.5 text-gray-600 dark:text-gray-400">
                      {item.region} • {item.estate} ({item.afdeling})
                    </td>
                    <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">
                      {item.luasHa.toLocaleString("id-ID")} Ha
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-gray-900 dark:text-white">
                      {item.realisasiHa.toLocaleString("id-ID")} Ha
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-bold" style={{ color: cond.hex }}>
                        {item.capaianPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: cond.hex }}
                        />
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {cond.kondisi}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 w-44">
                      <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, item.capaianPct)}%`,
                            backgroundColor: cond.hex,
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
