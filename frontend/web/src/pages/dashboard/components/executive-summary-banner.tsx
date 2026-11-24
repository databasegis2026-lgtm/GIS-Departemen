import { CheckCircleIcon } from "@/icons";
import { getFilteredMetrics, getModuleColors } from "../mock-data";
import { MODULE_CONFIGS } from "../module-config";
import type { DashboardFilterState } from "../types";

interface ExecutiveSummaryBannerProps {
  filters: DashboardFilterState;
  compact?: boolean;
}

export default function ExecutiveSummaryBanner({
  filters,
  compact = false,
}: ExecutiveSummaryBannerProps) {
  const metrics = getFilteredMetrics(filters);
  const currentModule = filters.module || "semua";
  const modConfig = MODULE_CONFIGS[currentModule] || MODULE_CONFIGS.semua;
  const { realisasiColor } = getModuleColors(filters.module);

  const unit = modConfig.unit;
  const companyLabel =
    filters.company === "PT_BUM"
      ? "PT BUM"
      : filters.company === "BSL"
      ? "PT BSL"
      : "PT BUM & BSL";

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 shadow-xs ${
        compact ? "p-2.5" : "p-3.5 sm:p-4"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span
            className="flex size-6 shrink-0 items-center justify-center rounded-md"
            style={{ color: realisasiColor, backgroundColor: `${realisasiColor}18` }}
          >
            <CheckCircleIcon className="size-4" />
          </span>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-bold text-gray-800 dark:text-white/90">
              {modConfig.name}
            </span>
            <span className="text-gray-400 dark:text-gray-600">•</span>
            <span className="text-gray-500 dark:text-gray-400">
              {companyLabel}
            </span>
            {filters.estate !== "Semua" && (
              <>
                <span className="text-gray-400 dark:text-gray-600">•</span>
                <span className="font-semibold text-brand-600 dark:text-brand-400">
                  {filters.estate}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Ringkasan Angka Langsung */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 dark:text-gray-400">Target:</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {metrics.totalLuasHa.toLocaleString("id-ID")} {unit}
            </span>
          </div>

          <span className="text-gray-300 dark:text-gray-700">|</span>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 dark:text-gray-400">Realisasi:</span>
            <span className="font-semibold" style={{ color: realisasiColor }}>
              {metrics.totalRealisasiHa.toLocaleString("id-ID")} {unit}
            </span>
          </div>

          <span className="text-gray-300 dark:text-gray-700">|</span>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 dark:text-gray-400">Capaian:</span>
            <span
              className="rounded-md px-2 py-0.5 font-bold"
              style={{ color: realisasiColor, backgroundColor: `${realisasiColor}18` }}
            >
              {metrics.avgCapaian.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
