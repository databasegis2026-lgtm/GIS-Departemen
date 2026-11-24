import { useTheme } from "@/contexts";
import { PieChartIcon } from "@/icons";
import type { ApexOptions } from "apexcharts";
import { useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import { getStatusDistribution } from "../mock-data";
import { MODULE_CONFIGS } from "../module-config";
import type { DashboardFilterState } from "../types";

interface StatusDistributionCardProps {
  filters: DashboardFilterState;
  compact?: boolean;
}

export default function StatusDistributionCard({
  filters,
  compact = false,
}: StatusDistributionCardProps) {
  const { theme } = useTheme();
  const distribution = useMemo(() => getStatusDistribution(filters), [filters]);

  const modConfig = filters?.module ? MODULE_CONFIGS[filters.module] : MODULE_CONFIGS.semua;
  const unit = modConfig?.unit || "Ha";

  // Data for Bar Chart 7 (Horizontal Bar Chart with Exact Multi-Color per Condition)
  const categories = useMemo(() => distribution.map((d) => d.label), [distribution]);
  const dataValues = useMemo(() => distribution.map((d) => d.pct), [distribution]);
  const customColors = useMemo(() => distribution.map((d) => d.warnaHex), [distribution]);

  const series = useMemo(
    () => [
      {
        name: "Persentase",
        data: dataValues,
      },
    ],
    [dataValues]
  );

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        fontFamily: "Outfit, sans-serif",
        height: compact ? (categories.length > 4 ? 130 : 110) : 180,
        toolbar: { show: false },
        parentHeightOffset: 0,
      },
      colors: customColors,
      plotOptions: {
        bar: {
          horizontal: true,
          distributed: true,
          barHeight: compact ? "60%" : "55%",
          borderRadius: 4,
          borderRadiusApplication: "end",
          dataLabels: {
            position: "right",
          },
        },
      },
      dataLabels: {
        enabled: true,
        textAnchor: "start",
        offsetX: 6,
        formatter: (val: number) => `${val}%`,
        style: {
          fontSize: compact ? "9.5px" : "11px",
          fontFamily: "Outfit, sans-serif",
          fontWeight: 600,
          colors: [theme === "dark" ? "#F1F5F9" : "#334155"],
        },
      },
      xaxis: {
        categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: theme === "dark" ? "#CBD5E1" : "#475569",
            fontSize: compact ? "9.5px" : "11.5px",
            fontWeight: 500,
          },
          maxWidth: compact ? 95 : 140,
        },
      },
      grid: {
        show: false,
        padding: compact
          ? { top: -14, right: 35, bottom: -10, left: 0 }
          : { top: -10, right: 45, bottom: 0, left: 0 },
      },
      legend: {
        show: false,
      },
      tooltip: {
        theme: theme === "dark" ? "dark" : "light",
        y: {
          formatter: (val: number, opts?: { dataPointIndex?: number }) => {
            const idx = opts?.dataPointIndex ?? 0;
            const item = distribution[idx];
            return `${val}% (${item?.luasHa?.toLocaleString("id-ID") || 0} ${unit})`;
          },
        },
      },
    }),
    [theme, compact, categories, customColors, distribution, unit]
  );

  return (
    <div
      className={`h-full rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 flex flex-col justify-between ${
        compact ? "p-2.5 shadow-xs" : "p-5 sm:p-6"
      }`}
    >
      {/* Header Sederhana */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-purple-50 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
            <PieChartIcon className="size-3.5" />
          </div>
          <h3
            className={`font-bold text-gray-800 dark:text-white/90 ${
              compact ? "text-xs" : "text-base"
            }`}
          >
            Distribusi Status
          </h3>
        </div>

        <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
          {distribution.length} Kategori
        </span>
      </div>

      {/* Bar Chart 7 Container (Horizontal Bar Chart) */}
      <div className="flex-1 w-full min-h-0 mt-1">
        <ReactApexChart
          options={options}
          series={series}
          type="bar"
          height={compact ? (categories.length > 4 ? 130 : 110) : 180}
        />
      </div>

      {/* Custom Legend Grid Multi-Color Sesuai Masing-Masing Kondisi */}
      <div
        className={`grid gap-1.5 shrink-0 ${
          compact ? "mt-1 grid-cols-2" : "mt-2.5 gap-2 sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {distribution.map((item, idx) => (
          <div
            key={item.kondisi}
            className={`flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/70 text-xs dark:border-gray-800 dark:bg-white/[0.02] ${
              compact
                ? `px-1.5 py-0.5 text-[9px] ${
                    distribution.length % 2 !== 0 && idx === distribution.length - 1
                      ? "col-span-2"
                      : "col-span-1"
                  }`
                : "px-2 py-1 text-[11px]"
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="size-2.5 shrink-0 rounded-xs shadow-xs"
                style={{ backgroundColor: item.warnaHex }}
              />
              <span className="font-semibold text-gray-700 dark:text-gray-200 truncate">
                {item.label}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-1">
              <span className="text-[9px] text-gray-400">
                {item.luasHa.toLocaleString("id-ID")} {unit}
              </span>
              <span className="font-bold text-gray-800 dark:text-white">
                {item.pct}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
