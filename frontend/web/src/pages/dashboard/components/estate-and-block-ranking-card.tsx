import { useTheme } from "@/contexts";
import { StarFilledIcon, TableIcon } from "@/icons";
import type { ApexOptions } from "apexcharts";
import { useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { getBlockRankings, getEstateData, getModuleColors } from "../mock-data";
import { MODULE_CONFIGS } from "../module-config";
import type { DashboardFilterState } from "../types";

interface EstateAndBlockRankingCardProps {
  filters: DashboardFilterState;
  compact?: boolean;
}

export default function EstateAndBlockRankingCard({
  filters,
  compact = false,
}: EstateAndBlockRankingCardProps) {
  const { theme } = useTheme();
  const isEstateSelected = filters.estate !== "Semua";
  const [activeRankTab, setActiveRankTab] = useState<"top3" | "bottom3">("top3");

  const modConfig = filters?.module ? MODULE_CONFIGS[filters.module] : MODULE_CONFIGS.semua;
  const unit = modConfig?.unit || "Ha";

  // Warna dinamis Target vs Realisasi sesuai modul (e.g. Produksi: Rencana #0000FF, Realisasi #F97316)
  const { targetColor, realisasiColor } = useMemo(
    () => getModuleColors(filters?.module),
    [filters?.module]
  );

  // When estate is selected -> Block rankings (Top 3 & Bottom 3)
  const blockRankings = useMemo(() => {
    return isEstateSelected ? getBlockRankings(filters.estate, filters.module) : null;
  }, [isEstateSelected, filters.estate, filters.module]);

  // When estate is NOT selected -> Estate achievement list
  const estateList = useMemo(() => {
    return !isEstateSelected ? getEstateData(filters) : [];
  }, [isEstateSelected, filters]);

  // Categories & Data Series for Bar Chart 4 (Target vs Realisasi)
  const chartData = useMemo(() => {
    if (isEstateSelected && blockRankings) {
      const blocks = activeRankTab === "top3" ? blockRankings.top3 : blockRankings.bottom3;
      const categories = blocks.map((b) => `Blok ${b.blok}`);
      const targetData = blocks.map((b) => Number(b.luasHa.toFixed(1)));
      const realisasiData = blocks.map((b) => Number(b.realisasiHa.toFixed(1)));
      return { categories, targetData, realisasiData };
    }

    const categories = estateList.map((e) => e.name.replace(/^Estate\s+/i, ""));
    const targetData = estateList.map((e) => e.totalLuasHa);
    const realisasiData = estateList.map((e) => e.realisasiHa);
    return { categories, targetData, realisasiData };
  }, [isEstateSelected, blockRankings, activeRankTab, estateList]);

  // ApexCharts Bar Chart 4 (Grouped Column / Bar: Target vs Realisasi)
  const series = useMemo(
    () => [
      {
        name: `Target (${unit})`,
        data: chartData.targetData,
      },
      {
        name: `Realisasi (${unit})`,
        data: chartData.realisasiData,
      },
    ],
    [chartData, unit]
  );

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        fontFamily: "Outfit, sans-serif",
        height: compact ? "100%" : 290,
        toolbar: { show: false },
        parentHeightOffset: 0,
      },
      colors: [targetColor, realisasiColor],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: compact ? "48%" : "40%",
          borderRadius: 4,
          borderRadiusApplication: "end",
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 1.5,
        colors: ["transparent"],
      },
      xaxis: {
        categories: chartData.categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: {
            colors: theme === "dark" ? "#94A3B8" : "#64748B",
            fontSize: compact ? "9px" : "11px",
            fontWeight: 500,
          },
          rotate: compact ? -35 : 0,
          rotateAlways: false,
          offsetY: compact ? -2 : 0,
        },
      },
      yaxis: {
        show: !compact,
        labels: {
          style: {
            colors: theme === "dark" ? "#94A3B8" : "#64748B",
            fontSize: "11px",
          },
          formatter: (val: number) => `${val.toLocaleString("id-ID")} ${unit}`,
        },
      },
      grid: {
        borderColor: theme === "dark" ? "#1E293B" : "#F1F5F9",
        strokeDashArray: 4,
        padding: compact
          ? { top: -10, right: 8, bottom: 0, left: 8 }
          : { top: 0, right: 16, bottom: 0, left: 16 },
      },
      legend: {
        show: false, // Ditampilkan rapi di header card
      },
      tooltip: {
        theme: theme === "dark" ? "dark" : "light",
        y: {
          formatter: (val: number) => `${val.toLocaleString("id-ID")} ${unit}`,
        },
      },
    }),
    [theme, compact, chartData.categories, unit, targetColor, realisasiColor]
  );

  return (
    <div
      className={`h-full rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 flex flex-col justify-between ${
        compact ? "p-2.5 shadow-xs" : "p-5 sm:p-6"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            {isEstateSelected ? (
              <StarFilledIcon className="size-3.5" />
            ) : (
              <TableIcon className="size-3.5" />
            )}
          </div>
          <h3
            className={`font-bold text-gray-800 dark:text-white/90 ${
              compact ? "text-xs" : "text-base"
            }`}
          >
            {isEstateSelected ? `Ranking Blok (${filters.estate})` : "Capaian Estate"}
          </h3>
        </div>

        {/* Legend pills & toggle Top 3/Bottom 3 if estate selected */}
        <div className="flex items-center gap-2">
          {isEstateSelected ? (
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-800 dark:bg-gray-800/60">
              <button
                type="button"
                onClick={() => setActiveRankTab("top3")}
                className={`cursor-pointer rounded-md px-2 py-0.5 text-[10px] font-bold transition-colors ${
                  activeRankTab === "top3"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Top 3 Blok
              </button>
              <button
                type="button"
                onClick={() => setActiveRankTab("bottom3")}
                className={`cursor-pointer rounded-md px-2 py-0.5 text-[10px] font-bold transition-colors ${
                  activeRankTab === "bottom3"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Bottom 3 Blok
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[10px]">
              <div className="flex items-center gap-1 font-medium text-gray-500 dark:text-gray-400">
                <span className="size-2 rounded-full" style={{ backgroundColor: targetColor }} />
                <span>Target</span>
              </div>
              <div className="flex items-center gap-1 font-bold text-gray-700 dark:text-gray-200">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: realisasiColor }}
                />
                <span>Realisasi</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bar Chart 4 Container */}
      <div className={compact ? "mt-1 flex-1 min-h-[140px] w-full" : "mt-4"}>
        <ReactApexChart
          options={options}
          series={series}
          type="bar"
          height={compact ? "100%" : 290}
        />
      </div>
    </div>
  );
}
