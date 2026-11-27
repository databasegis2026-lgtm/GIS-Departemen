import { RegenerateIcon, XIcon } from "@/icons";
import { useState } from "react";
import { MODULE_CONFIGS } from "../module-config";
import type { DashboardFilterState, MonthOption, OperationalModuleOption, QuarterOption, RegionOption } from "../types";
import DashboardExportDropdown from "./dashboard-export-dropdown";
import DashboardMapCanvas from "./dashboard-map-canvas";
import DashboardMetrics from "./dashboard-metrics";
import DynamicAchievementBarChart from "./dynamic-achievement-bar-chart";
import EstateAndBlockRankingCard from "./estate-and-block-ranking-card";
import OperationalTrendChart from "./operational-trend-chart";
import PlantationWeatherWidget from "./plantation-weather-widget";
import WeatherAlertNotification from "./weather-alert-notification";

interface DashboardFullscreenViewProps {
  filters: DashboardFilterState;
  onFilterChange: (filters: Partial<DashboardFilterState>) => void;
  onCloseFullscreen: () => void;
  onRefreshData?: () => void;
}

const estateListByRegion: Record<string, string[]> = {
  "REGION 1": ["BUM 1", "BUM 2", "BUM 4"],
  "REGION 2": ["BUM 5", "BUM 6", "BUM 7"],
  "REGION 3": ["BUM 3", "BUM 8", "BSL"],
};

const monthsList: MonthOption[] = [
  "Semua", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"
];

export default function DashboardFullscreenView({
  filters,
  onFilterChange,
  onCloseFullscreen,
  onRefreshData,
}: DashboardFullscreenViewProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeModuleConfig = MODULE_CONFIGS[filters.module] || MODULE_CONFIGS.semua;

  const [todayFormatted] = useState(() =>
    new Intl.DateTimeFormat("id-ID", {
      weekday: "short",
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
      "BUM 1", "BUM 2", "BUM 3", "BUM 4", "BUM 5", "BUM 6", "BUM 7", "BUM 8", "BSL"
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
    <div className="fixed inset-0 z-99999 flex h-screen w-screen flex-col overflow-hidden bg-gray-100 p-2.5 text-gray-800 antialiased select-none dark:bg-gray-950 dark:text-white/90">
      {/* 1. Header Ringkas Layar Penuh (TailAdmin Theme-Aware Native Styling) */}
      <header className="relative z-[2000] flex h-12 shrink-0 items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3.5 shadow-xs dark:border-gray-800 dark:bg-white/3">
        {/* Brand: "Dashboard" & Company Selector Button Group */}
        <div className="flex items-center gap-2.5 shrink-0">
          <h1 className="text-sm font-bold tracking-tight text-gray-800 dark:text-white/90">
            {activeModuleConfig.name}
          </h1>

          {/* Company Selector Button Group */}
          <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-800 dark:bg-gray-800/60">
            <button
              type="button"
              onClick={() =>
                onFilterChange({
                  company: "Semua",
                  estate: "Semua",
                  region: "Semua",
                })
              }
              className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${filters.company === "Semua"
                ? "bg-brand-500 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
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
              className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${filters.company === "PT_BUM"
                ? "bg-brand-500 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
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
              className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${filters.company === "BSL"
                ? "bg-brand-500 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
            >
              PT BSL
            </button>
          </div>
        </div>

        {/* Right Tools: Date, Weather, Segarkan, Cetak & Tutup Fullscreen */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live Date Pill */}
          <span className="flex items-center rounded-lg border border-emerald-200/60 bg-emerald-50/60 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400">
            {todayFormatted}
          </span>

          {/* Telemetri Cuaca Real Kebun (Satelit Open-Meteo & BMKG) */}
          <PlantationWeatherWidget
            filters={filters}
            onFilterChange={onFilterChange}
            compact={true}
          />

          {/* Tombol Segarkan */}
          <button
            type="button"
            onClick={handleRefreshClick}
            className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 shadow-xs transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            title="Segarkan data spasial & analitik"
          >
            <RegenerateIcon className={`size-3.5 text-brand-600 dark:text-brand-400 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </button>

          {/* Cetak / Ekspor Dropdown */}
          <DashboardExportDropdown filters={filters} compact={true} />

          {/* Tutup Layar Penuh (ESC) */}
          <button
            type="button"
            onClick={onCloseFullscreen}
            className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 shadow-xs transition-colors hover:bg-rose-50 hover:text-rose-600 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
            title="Keluar dari Layar Penuh (ESC)"
          >
            <XIcon className="size-3.5" />
            <span>Keluar (ESC)</span>
          </button>
        </div>
      </header>

      {/* 2. Workspace 1 Layar Penuh Bebas Scroll (Zero-Scroll Strict Viewport Budget) */}
      <main className="relative z-0 mt-2.5 flex flex-1 min-h-0 gap-2.5 overflow-hidden">
        {/* KOLOM KIRI (28%): 4 KPI Metrics + Bar Chart Dinamis (Region/Afdeling) */}
        <section className="flex w-[28%] shrink-0 flex-col gap-2.5 h-full overflow-hidden">
          {/* 4 KPI Cards (Compact 2x2 grid) */}
          <div className="shrink-0 overflow-hidden">
            <DashboardMetrics filters={filters} compact={true} />
          </div>

          {/* Card Bar Chart Dinamis: Region 1-3 & BSL (switches to Afdeling when Estate selected) */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <DynamicAchievementBarChart filters={filters} compact={true} />
          </div>
        </section>

        {/* KOLOM TENGAH (44% - DOMINAN): Card Filter di atas + Cuaca Alert + Kanvas Peta Leaflet di bawah */}
        <section className="flex flex-1 min-w-0 flex-col gap-2 h-full overflow-hidden">
          {/* Card Filter Toolbar Khusus Di Atas Canvas Peta (6 Kolom Presisi TailAdmin) */}
          <div className="shrink-0 rounded-2xl border border-gray-200 bg-white p-2.5 shadow-xs dark:border-gray-800 dark:bg-white/3">
            <div className="grid grid-cols-6 gap-2 items-center">
              {/* Filter Tahun */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                  Tahun
                </label>
                <select
                  value={filters.year}
                  onChange={(e) => onFilterChange({ year: Number(e.target.value) })}
                  className="h-8 w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-2 text-xs font-bold text-gray-800 outline-none transition-colors focus:border-brand-500 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200"
                >
                  {[2024, 2025, 2026, 2027, 2028].map((y) => (
                    <option key={y} value={y}>
                      Tahun {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Kuartal (Q1 - Q4) */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                  Kuartal
                </label>
                <select
                  value={filters.quarter}
                  onChange={(e) => onFilterChange({ quarter: e.target.value as QuarterOption })}
                  className="h-8 w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-2 text-xs font-semibold text-gray-800 outline-none transition-colors focus:border-brand-500 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200"
                >
                  <option value="Semua">Semua Kuartal</option>
                  <option value="Q1">Kuartal 1 (Q1)</option>
                  <option value="Q2">Kuartal 2 (Q2)</option>
                  <option value="Q3">Kuartal 3 (Q3)</option>
                  <option value="Q4">Kuartal 4 (Q4)</option>
                </select>
              </div>

              {/* Filter Bulan */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                  Bulan
                </label>
                <select
                  value={filters.month}
                  onChange={(e) => onFilterChange({ month: e.target.value as MonthOption })}
                  className="h-8 w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-2 text-xs font-medium text-gray-800 outline-none transition-colors focus:border-brand-500 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200"
                >
                  {monthsList.map((m) => (
                    <option key={m} value={m}>
                      {m === "Semua" ? "Semua Bulan" : `Bulan ${m}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Region */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-gray-500 dark:text-gray-400">
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
                  className="h-8 w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-2 text-xs font-medium text-gray-800 outline-none transition-colors focus:border-brand-500 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200"
                >
                  <option value="Semua">Semua Region</option>
                  <option value="REGION 1">REGION 1</option>
                  <option value="REGION 2">REGION 2</option>
                  <option value="REGION 3">REGION 3</option>
                </select>
              </div>

              {/* Filter Estate */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                  Estate (Kebun)
                </label>
                <select
                  value={filters.estate}
                  onChange={(e) => onFilterChange({ estate: e.target.value })}
                  className="h-8 w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-2 text-xs font-medium text-gray-800 outline-none transition-colors focus:border-brand-500 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200"
                >
                  <option value="Semua">Semua Estate</option>
                  {availableEstates.map((est) => (
                    <option key={est} value={est}>
                      {est}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Aktivitas */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                  Aktivitas
                </label>
                <select
                  value={filters.module}
                  onChange={(e) =>
                    onFilterChange({ module: e.target.value as OperationalModuleOption })
                  }
                  className="h-8 w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-2 text-xs font-semibold text-gray-800 outline-none transition-colors focus:border-brand-500 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200"
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
            </div>
          </div>

          {/* Notifikasi Peringatan Cuaca Ekstrem Lapangan (Jika Aktif) */}
          {filters.weatherAlert && filters.weatherAlert !== "cerah" && (
            <div className="shrink-0">
              <WeatherAlertNotification
                weatherAlert={filters.weatherAlert}
                onDismiss={() => onFilterChange({ weatherAlert: "cerah" })}
                compact={true}
              />
            </div>
          )}

          {/* Kanvas Peta Leaflet (flex-1 min-h-0) */}
          <div className="relative flex-1 min-h-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-white/3">
            <DashboardMapCanvas
              filters={filters}
              isFullscreen={true}
              isFillContainer={true}
            />
          </div>
        </section>

        {/* KOLOM KANAN (28%): Line Chart 12 Bulan (Target vs Realisasi) + Capaian Estate / Ranking Blok */}
        <section className="flex w-[28%] shrink-0 flex-col gap-2.5 h-full overflow-hidden">
          {/* Card 1: Line Chart 12 Bulan Target Rencana vs Realisasi Aktual */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <OperationalTrendChart filters={filters} compact={true} />
          </div>

          {/* Card 2: Capaian per Estate (switches to Ranking Blok 3 Teratas & 3 Terbawah when Estate selected) */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <EstateAndBlockRankingCard filters={filters} compact={true} />
          </div>
        </section>
      </main>
    </div>
  );
}
