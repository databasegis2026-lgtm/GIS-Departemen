import { useTheme } from "@/contexts";
import { ArrowDownIcon, ArrowUpIcon } from "@/icons";
import type { ApexOptions } from "apexcharts";
import { useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import { getFilteredMetrics, getModuleColors } from "../mock-data";
import { MODULE_CONFIGS } from "../module-config";
import type { DashboardFilterState } from "../types";

interface MonthlyTargetGaugeProps {
  filters?: DashboardFilterState;
  compact?: boolean;
}

export default function MonthlyTargetGauge({
  filters,
  compact = false,
}: MonthlyTargetGaugeProps) {
  const { theme } = useTheme();

  // Dynamic card title: "Capaian Target Tahun / Bulan / Kuartal"
  const cardTitle = useMemo(() => {
    if (filters?.month && filters.month !== "Semua") {
      return `Capaian Target Bulan ${filters.month}`;
    }
    if (filters?.quarter && filters.quarter !== "Semua") {
      return `Capaian Target ${filters.quarter}`;
    }
    return `Capaian Target Tahun ${filters?.year || 2026}`;
  }, [filters?.month, filters?.quarter, filters?.year]);

  const metrics = useMemo(() => {
    return filters ? getFilteredMetrics(filters) : null;
  }, [filters]);

  const modConfig = filters?.module ? MODULE_CONFIGS[filters.module] : MODULE_CONFIGS.semua;
  const unit = modConfig?.unit || "Ha";
  
  // Warna kondisi modul aktual
  const { realisasiColor } = useMemo(
    () => getModuleColors(filters?.module),
    [filters?.module]
  );

  // Gradient warna busur capaian yang harmonis
  const { gradientStart, gradientEnd } = useMemo(() => {
    if (realisasiColor === "#F97316") {
      return { gradientStart: "#FED7AA", gradientEnd: "#F97316" };
    }
    if (realisasiColor === "#15803D" || realisasiColor === "#16A34A" || realisasiColor === "#22C55E") {
      return { gradientStart: "#BBF7D0", gradientEnd: "#16A34A" };
    }
    return { gradientStart: "#9CB9FF", gradientEnd: "#465FFF" };
  }, [realisasiColor]);

  // Calculate target, realisasi, sisa
  const targetVal = metrics ? metrics.totalLuasHa : 2435;
  const realisasiVal = metrics ? metrics.totalRealisasiHa : 2155;
  const sisaVal = Math.max(0, targetVal - realisasiVal);
  const percentage = targetVal > 0 ? Number(((realisasiVal / targetVal) * 100).toFixed(1)) : 88.5;

  // Radial Chart Semi Circle 2 Data (Percentage Capaian)
  const series = [percentage];

  // Radial Chart Semi Circle 2 Configuration (TailAdmin Native Style)
  const options: ApexOptions = {
    colors: [gradientStart],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: compact ? 220 : 330,
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: {
          size: compact ? "72%" : "80%",
        },
        track: {
          background: theme === "dark" ? "#1E2640" : "#E4E7EC",
          strokeWidth: "100%",
          margin: 5,
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            fontSize: compact ? "24px" : "36px",
            fontWeight: "600",
            offsetY: compact ? -22 : -35,
            color: theme === "dark" ? "#FFFFFF" : "#1D2939",
            formatter: function (val: number) {
              return val + "%";
            },
          },
        },
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "light",
        type: "horizontal",
        shadeIntensity: 0.5,
        gradientToColors: [gradientEnd],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
      },
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Progress"],
  };

  return (
    <div
      className={`h-full rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 flex flex-col justify-between ${
        compact ? "p-2.5 shadow-xs" : "p-5 sm:p-6"
      }`}
    >
      {/* Header Sederhana */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-800 shrink-0">
        <div>
          <h3
            className={`font-bold text-gray-800 dark:text-white/90 ${
              compact ? "text-xs" : "text-base"
            }`}
          >
            {cardTitle}
          </h3>
          {!compact && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Target operasional dan realisasi capaian kebun
            </p>
          )}
        </div>
        <span
          className="rounded-md px-2 py-0.5 text-[10px] font-bold"
          style={{
            color: gradientEnd,
            backgroundColor: `${gradientEnd}18`,
          }}
        >
          {percentage >= 85 ? "On-Track" : "Perhatian"}
        </span>
      </div>

      {/* Radial Chart Semi Circle 2 Area (Persis Sesuai TailAdmin) */}
      <div className="relative my-auto">
        <div
          className={`${compact ? "max-h-28" : "max-h-45"} overflow-hidden`}
          id="chartDarkStyle"
        >
          <ReactApexChart
            options={options}
            series={series}
            type="radialBar"
            height={compact ? 220 : 330}
          />
        </div>

        {/* Badge status seperti pada template TailAdmin */}
        <span
          className={`absolute left-1/2 -translate-x-1/2 rounded-full font-medium ${
            compact ? "bottom-0.5 px-2 py-0.5 text-[9.5px]" : "bottom-2.5 px-3 py-1 text-xs"
          } ${
            percentage >= 85
              ? "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-500"
              : "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-500"
          }`}
        >
          {percentage >= 85 ? "+10% On-Track" : "Perhatian"}
        </span>
      </div>

      {/* Mini Status Metrics: Target, Realisasi, Sisa (Sesuai TailAdmin Monthly Target) */}
      <div
        className={`grid grid-cols-3 gap-2 border-t border-gray-100 text-center dark:border-gray-800 shrink-0 ${
          compact ? "mt-1 pt-1.5" : "mt-4 pt-3.5"
        }`}
      >
        <div>
          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400">
            <span className="size-1.5 rounded-full bg-blue-500" />
            <span>Target</span>
          </div>
          <div
            className={`flex items-center justify-center gap-0.5 font-bold text-gray-800 dark:text-white ${
              compact ? "text-xs" : "text-sm"
            }`}
          >
            <span>{targetVal.toLocaleString("id-ID")} {unit}</span>
            <ArrowDownIcon className="size-3 text-red-500 shrink-0" />
          </div>
        </div>

        <div className="border-x border-gray-100 dark:border-gray-800 px-1">
          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: gradientEnd }} />
            <span>Realisasi</span>
          </div>
          <div
            className={`flex items-center justify-center gap-0.5 font-bold ${
              compact ? "text-xs" : "text-sm"
            }`}
            style={{ color: gradientEnd }}
          >
            <span>{realisasiVal.toLocaleString("id-ID")} {unit}</span>
            <ArrowUpIcon className="size-3 text-green-500 shrink-0" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400">
            <span className="size-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span>Sisa</span>
          </div>
          <div
            className={`flex items-center justify-center gap-0.5 font-bold text-amber-500 ${
              compact ? "text-xs" : "text-sm"
            }`}
          >
            <span>{sisaVal.toLocaleString("id-ID")} {unit}</span>
            {sisaVal > 0 ? (
              <ArrowDownIcon className="size-3 text-amber-500 shrink-0" />
            ) : (
              <ArrowUpIcon className="size-3 text-green-500 shrink-0" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
