import { useTheme } from "@/contexts";
import { DocIcon, PieChartIcon } from "@/icons";
import type { ApexOptions } from "apexcharts";
import { useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import { getAfdelingData, getRegionalData } from "../mock-data";
import { printAfdelingPDF, printAllAfdelingsPDF } from "../print-reports";
import type { AfdelingPerformanceItem, DashboardFilterState, RegionPerformanceItem } from "../types";

interface DynamicAchievementBarChartProps {
  filters: DashboardFilterState;
  compact?: boolean;
}

export default function DynamicAchievementBarChart({
  filters,
  compact = false,
}: DynamicAchievementBarChartProps) {
  const { theme } = useTheme();
  const isEstateSelected = filters.estate !== "Semua";

  // Data switches dynamically: if estate selected -> afdelings of that estate; else -> regions!
  const afdelingList: AfdelingPerformanceItem[] = useMemo(
    () => (isEstateSelected ? getAfdelingData(filters.estate, filters.module) : []),
    [isEstateSelected, filters.estate, filters.module]
  );
  const regionList: RegionPerformanceItem[] = useMemo(
    () => (!isEstateSelected ? getRegionalData(filters) : []),
    [isEstateSelected, filters]
  );

  const dataItems: (AfdelingPerformanceItem | RegionPerformanceItem)[] = isEstateSelected
    ? afdelingList
    : regionList;

  const title = isEstateSelected
    ? `Capaian Afdeling (${filters.estate})`
    : "Capaian Region";

  const getItemLabel = (item: AfdelingPerformanceItem | RegionPerformanceItem) =>
    "afdeling" in item ? item.afdeling : item.name;

  const getItemTotalHa = (item: AfdelingPerformanceItem | RegionPerformanceItem) =>
    "totalLuasHa" in item ? item.totalLuasHa : item.luasHa;

  const series = useMemo(() => dataItems.map((item) => item.realisasiHa), [dataItems]);
  const labels = useMemo(() => dataItems.map((item) => getItemLabel(item)), [dataItems]);
  const colors = useMemo(() => dataItems.map((item) => item.warnaHex), [dataItems]);

  const avgCapaian = useMemo(() => {
    if (dataItems.length === 0) return 0;
    const sum = dataItems.reduce((acc, curr) => acc + curr.capaianPct, 0);
    return sum / dataItems.length;
  }, [dataItems]);

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        fontFamily: "Outfit, sans-serif",
        type: "donut",
        toolbar: { show: false },
        sparkline: { enabled: false },
      },
      labels,
      colors,
      stroke: {
        width: 2,
        colors: theme === "dark" ? ["#111827"] : ["#FFFFFF"],
      },
      dataLabels: {
        enabled: !compact,
        formatter: (val: number) => `${Number(val).toFixed(0)}%`,
        style: {
          fontSize: "10px",
          fontWeight: 600,
        },
        dropShadow: { enabled: false },
      },
      legend: {
        show: false, // Menggunakan HTML legend custom agar hemat ruang vertikal dan pas 1 layar penuh
      },
      plotOptions: {
        pie: {
          donut: {
            size: compact ? "68%" : "66%",
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: compact ? "9px" : "11px",
                color: theme === "dark" ? "#94A3B8" : "#64748B",
                offsetY: compact ? -2 : -4,
              },
              value: {
                show: true,
                fontSize: compact ? "11.5px" : "16px",
                fontWeight: 700,
                color: theme === "dark" ? "#FFFFFF" : "#1E293B",
                offsetY: compact ? 0 : 2,
                formatter: () => `${avgCapaian.toFixed(1)}%`,
              },
              total: {
                show: true,
                label: "Rata-rata",
                fontSize: compact ? "8px" : "11px",
                color: theme === "dark" ? "#94A3B8" : "#64748B",
                formatter: () => `${avgCapaian.toFixed(1)}%`,
              },
            },
          },
        },
      },
      tooltip: {
        theme: theme === "dark" ? "dark" : "light",
        y: {
          formatter: (val: number, opts?: { seriesIndex: number }) => {
            const idx = opts?.seriesIndex ?? 0;
            const item = dataItems[idx];
            if (!item) return `${val.toLocaleString("id-ID")} Ha`;
            return `${val.toLocaleString("id-ID")} Ha (${item.capaianPct.toFixed(1)}% • ${item.kondisi})`;
          },
        },
      },
    }),
    [labels, colors, theme, compact, avgCapaian, dataItems]
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
          <div className="flex size-6 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
            <PieChartIcon className="size-3.5" />
          </div>
          <h3
            className={`font-bold text-gray-800 dark:text-white/90 truncate ${
              compact ? "text-xs" : "text-base"
            }`}
          >
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isEstateSelected && (
            <button
              type="button"
              onClick={() => printAllAfdelingsPDF(filters.estate, filters)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 transition-colors hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300 dark:hover:bg-brand-900/60"
              title="Cetak bundle seluruh lembar kerja afdeling"
            >
              <DocIcon className="size-3" />
              <span>Cetak Semua AFD</span>
            </button>
          )}

          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 shrink-0">
            {isEstateSelected ? "Drilldown Afdeling" : "Tingkat Region"}
          </span>
        </div>
      </div>

      {/* Body: Tampilan Compact (Layar Penuh: Pas 1 Layar Tanpa Scroll) */}
      {compact ? (
        <div className="mt-1 flex flex-1 items-center justify-between gap-1 overflow-hidden min-h-0">
          {/* Donut Pie Chart di Sisi Kiri */}
          <div className="w-[46%] shrink-0 flex items-center justify-center -ml-2">
            <ReactApexChart
              options={options}
              series={series}
              type="donut"
              height={132}
              width="100%"
            />
          </div>

          {/* Legend & Breakdown Ringkas di Sisi Kanan */}
          <div className="flex-1 min-w-0 flex flex-col justify-around h-full py-0.5 space-y-0.5">
            {dataItems.slice(0, 4).map((item) => (
              <div
                key={getItemLabel(item)}
                className="flex items-center justify-between text-[10px]"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.warnaHex }}
                  />
                  <span className="font-semibold text-gray-800 dark:text-white/90 truncate text-[10px]">
                    {getItemLabel(item)}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[9px] text-gray-400">
                    {Math.round(item.realisasiHa).toLocaleString("id-ID")} Ha
                  </span>
                  <span
                    className="font-bold text-[9.5px]"
                    style={{ color: item.warnaHex }}
                  >
                    {item.capaianPct.toFixed(1)}%
                  </span>
                  {isEstateSelected && "afdeling" in item && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        printAfdelingPDF(filters.estate, item.afdeling, filters);
                      }}
                      className="cursor-pointer rounded-xs p-0.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors ml-0.5"
                      title={`Cetak Lembar Kerja ${item.afdeling}`}
                    >
                      <DocIcon className="size-2.5 text-rose-500" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Body: Tampilan Biasa (Dashboard Grid) */
        <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-5 items-center flex-1">
          {/* Donut Chart di Kiri */}
          <div className="col-span-12 md:col-span-5 flex items-center justify-center">
            <ReactApexChart
              options={options}
              series={series}
              type="donut"
              height={250}
              width="100%"
            />
          </div>

          {/* Breakdown Detail di Kanan */}
          <div className="col-span-12 md:col-span-7 space-y-2.5">
            {dataItems.map((item) => (
              <div key={getItemLabel(item)} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="size-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.warnaHex }}
                    />
                    <span className="font-semibold text-gray-800 dark:text-white/90 text-xs truncate">
                      {getItemLabel(item)}
                    </span>
                    {"company" in item && (
                      <span className="rounded-xs bg-gray-100 px-1 py-0.2 text-[8.5px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        {item.company}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">
                      • {item.kondisi}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-gray-400">
                      {item.realisasiHa.toLocaleString("id-ID")} /{" "}
                      {getItemTotalHa(item).toLocaleString("id-ID")} Ha
                    </span>
                    <span
                      className="font-bold text-xs"
                      style={{ color: item.warnaHex }}
                    >
                      {item.capaianPct.toFixed(1)}%
                    </span>
                    {isEstateSelected && "afdeling" in item && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          printAfdelingPDF(filters.estate, item.afdeling, filters);
                        }}
                        className="cursor-pointer inline-flex items-center gap-1 rounded-xs px-1.5 py-0.5 text-[10px] font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 dark:text-rose-400 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 transition-colors ml-1"
                        title={`Cetak Lembar Kerja PDF ${item.afdeling}`}
                      >
                        <DocIcon className="size-3 text-rose-500" />
                        <span>PDF</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Bar Capaian Warna Kondisi */}
                <div className="w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 h-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, item.capaianPct)}%`,
                      backgroundColor: item.warnaHex,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
