import { AspectFullscreenIcon, RegenerateIcon } from "@/icons";
import { useState } from "react";
import { MODULE_CONFIGS } from "../module-config";
import type { DashboardFilterState, MonthOption, OperationalModuleOption, QuarterOption, RegionOption } from "../types";
import DashboardExportDropdown from "./dashboard-export-dropdown";
import PlantationWeatherWidget from "./plantation-weather-widget";

interface DashboardHeaderProps {
  filters: DashboardFilterState;
  onFilterChange: (filters: Partial<DashboardFilterState>) => void;
  onResetFilters: () => void;
  onRefreshData?: () => void;
  onToggleFullscreen?: () => void;
}

const estateListByRegion: Record<string, string[]> = {
  "REGION 1": ["BUM 1", "BUM 2", "BUM 4"],
  "REGION 2": ["BUM 5", "BUM 6", "BUM 7"],
  "REGION 3": ["BUM 3", "BUM 8", "BSL"],
};

const monthsList: MonthOption[] = [
  "Semua",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ags",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const moduleTabList: { key: OperationalModuleOption; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "produksi", label: "Produksi" },
  { key: "pruning", label: "Pruning" },
  { key: "pasar_pikul", label: "Pasar Pikul" },
  { key: "pemupukan", label: "Pemupukan" },
  { key: "semprot", label: "Semprot" },
  { key: "jangkos", label: "Jangkos" },
];

export default function DashboardHeader({
  filters,
  onFilterChange,
  onResetFilters,
  onRefreshData,
  onToggleFullscreen,
}: DashboardHeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeModuleConfig = MODULE_CONFIGS[filters.module] || MODULE_CONFIGS.semua;

  const [todayFormatted] = useState(() =>
    new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date())
  );

  const getAvailableEstates = () => {
    if (filters.company === "BSL") {
      return ["BSL"];
    }
    if (filters.region !== "Semua") {
      const estates = estateListByRegion[filters.region] || [];
      return filters.company === "PT_BUM" ? estates.filter((e) => e !== "BSL") : estates;
    }
    if (filters.company === "PT_BUM") {
      return ["BUM 1", "BUM 2", "BUM 3", "BUM 4", "BUM 5", "BUM 6", "BUM 7", "BUM 8"];
    }
    return [
      "BUM 1",
      "BUM 2",
      "BUM 3",
      "BUM 4",
      "BUM 5",
      "BUM 6",
      "BUM 7",
      "BUM 8",
      "BSL",
    ];
  };

  const availableEstates = getAvailableEstates();

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    if (onRefreshData) onRefreshData();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div className="relative z-30 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-gray-800 dark:bg-white/3">
      {/* 1. Top Bar: Judul Sederhana, Tanggal, Cuaca, Cetak & Layar Penuh */}
      <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 lg:flex-row lg:items-center lg:justify-between dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
              {activeModuleConfig.name}
            </h2>
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {filters.year}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {todayFormatted} • PT BUM & BSL
          </p>
        </div>

        {/* Action Tools */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Telemetri Cuaca Kebun Real-time (Satelit Open-Meteo & BMKG) */}
          <PlantationWeatherWidget
            filters={filters}
            onFilterChange={onFilterChange}
          />

          {/* Tombol Segarkan */}
          <button
            type="button"
            onClick={handleRefreshClick}
            className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            title="Segarkan data"
          >
            <RegenerateIcon className={`size-3 text-brand-600 dark:text-brand-400 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </button>

          {/* Cetak */}
          <DashboardExportDropdown filters={filters} />

          {/* Layar Penuh */}
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-brand-500/30 bg-brand-50 px-3 text-xs font-semibold text-brand-600 shadow-xs hover:bg-brand-500 hover:text-white dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500 dark:hover:text-white"
            >
              <AspectFullscreenIcon className="size-3.5" />
              <span>Layar Penuh</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Menu Dashboard: Sederhana & Langsung */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-b border-gray-100 pb-3 dark:border-gray-800">
        <span className="mr-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          Dashboard:
        </span>
        {moduleTabList.map((tab) => {
          const isActive = filters.module === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onFilterChange({ module: tab.key })}
              className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${isActive
                ? "bg-brand-500 text-white shadow-xs"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:bg-gray-700/60"
                }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Filter Perusahaan */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-b border-gray-100 pb-3 dark:border-gray-800">
        <span className="mr-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          Perusahaan:
        </span>
        <button
          type="button"
          onClick={() =>
            onFilterChange({
              company: "Semua",
              estate: "Semua",
              region: "Semua",
            })
          }
          className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${filters.company === "Semua"
            ? "bg-brand-500 text-white shadow-xs"
            : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-300"
            }`}
        >
          PT BUM & BSL
        </button>

        <button
          type="button"
          onClick={() =>
            onFilterChange({
              company: "PT_BUM",
              estate: filters.estate === "BSL" ? "Semua" : filters.estate,
              region: filters.region,
            })
          }
          className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${filters.company === "PT_BUM"
            ? "bg-brand-500 text-white shadow-xs"
            : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-300"
            }`}
        >
          PT BUM
        </button>

        <button
          type="button"
          onClick={() =>
            onFilterChange({
              company: "BSL",
              estate: "BSL",
              region: "REGION 3",
            })
          }
          className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${filters.company === "BSL"
            ? "bg-brand-500 text-white shadow-xs"
            : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-300"
            }`}
        >
          PT BSL
        </button>
      </div>

      {/* 4. Filter Toolbar: Ringkas & Bersih */}
      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {/* Tahun */}
        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
            Tahun
          </label>
          <select
            value={filters.year}
            onChange={(e) => onFilterChange({ year: Number(e.target.value) })}
            className="h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-200"
          >
            {[2024, 2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Kuartal */}
        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
            Kuartal
          </label>
          <select
            value={filters.quarter}
            onChange={(e) => onFilterChange({ quarter: e.target.value as QuarterOption })}
            className="h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-200"
          >
            <option value="Semua">Semua</option>
            <option value="Q1">Q1</option>
            <option value="Q2">Q2</option>
            <option value="Q3">Q3</option>
            <option value="Q4">Q4</option>
          </select>
        </div>

        {/* Bulan */}
        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
            Bulan
          </label>
          <select
            value={filters.month}
            onChange={(e) => onFilterChange({ month: e.target.value as MonthOption })}
            className="h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-800 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-200"
          >
            {monthsList.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Region */}
        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
            Region
          </label>
          <select
            value={filters.region}
            onChange={(e) =>
              onFilterChange({
                region: e.target.value as RegionOption,
                estate: "Semua",
              })
            }
            className="h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-800 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-200"
          >
            <option value="Semua">Semua Region</option>
            <option value="REGION 1">REGION 1</option>
            <option value="REGION 2">REGION 2</option>
            <option value="REGION 3">REGION 3</option>
          </select>
        </div>

        {/* Estate */}
        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
            Estate
          </label>
          <select
            value={filters.estate}
            onChange={(e) => onFilterChange({ estate: e.target.value })}
            className="h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-800 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-200"
          >
            <option value="Semua">Semua Estate</option>
            {availableEstates.map((est) => (
              <option key={est} value={est}>
                {est}
              </option>
            ))}
          </select>
        </div>

        {/* Modul */}
        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
            Aktivitas
          </label>
          <select
            value={filters.module}
            onChange={(e) =>
              onFilterChange({ module: e.target.value as OperationalModuleOption })
            }
            className="h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-200"
          >
            <option value="semua">Semua</option>
            <option value="produksi">Produksi</option>
            <option value="pruning">Pruning</option>
            <option value="pasar_pikul">Pasar Pikul</option>
            <option value="pemupukan">Pemupukan</option>
            <option value="semprot">Semprot</option>
            <option value="jangkos">Jangkos</option>
          </select>
        </div>

        {/* Reset */}
        <div className="flex items-end">
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex h-8.5 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-300 dark:hover:bg-gray-700/60"
          >
            <RegenerateIcon className="size-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
}
