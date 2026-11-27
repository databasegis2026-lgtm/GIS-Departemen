import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import DashboardFullscreenView from "./components/dashboard-fullscreen-view";
import DashboardHeader from "./components/dashboard-header";
import DashboardMapCanvas from "./components/dashboard-map-canvas";
import DashboardMetrics from "./components/dashboard-metrics";
import DynamicAchievementBarChart from "./components/dynamic-achievement-bar-chart";
import EstateAndBlockRankingCard from "./components/estate-and-block-ranking-card";
import ExecutiveSummaryBanner from "./components/executive-summary-banner";
import OperationalTrendChart from "./components/operational-trend-chart";
import StatusDistributionCard from "./components/status-distribution-card";
import WeatherAlertNotification from "./components/weather-alert-notification";
import { MODULE_CONFIGS } from "./module-config";
import type { DashboardFilterState, OperationalModuleOption } from "./types";

const pathToModule: Record<string, OperationalModuleOption> = {
  "/dashboard/perawatan/pruning": "pruning",
  "/dashboard/perawatan/pasar-pikul": "pasar_pikul",
  "/dashboard/perawatan/pemupukan": "pemupukan",
  "/dashboard/perawatan/semprot": "semprot",
  "/dashboard/perawatan/jangkos": "jangkos",
  "/dashboard/produksi": "produksi",
  "/dashboard": "semua",
};

const moduleToPath: Record<OperationalModuleOption, string> = {
  semua: "/dashboard",
  produksi: "/dashboard/produksi",
  pruning: "/dashboard/perawatan/pruning",
  pasar_pikul: "/dashboard/perawatan/pasar-pikul",
  pemupukan: "/dashboard/perawatan/pemupukan",
  semprot: "/dashboard/perawatan/semprot",
  jangkos: "/dashboard/perawatan/jangkos",
};

const initialFilters: DashboardFilterState = {
  company: "Semua",
  region: "Semua",
  estate: "Semua",
  quarter: "Semua",
  month: "Semua",
  year: 2026,
  module: "semua",
  weatherAlert: "cerah",
};

export default function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine initial module from route
  const currentPath = location.pathname.replace(/\/$/, "");
  const routeModule = pathToModule[currentPath] || "semua";

  const [filters, setFilters] = useState<DashboardFilterState>(() => ({
    ...initialFilters,
    module: routeModule,
  }));
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Sync state if user navigates via sidebar or browser back/forward buttons
  useEffect(() => {
    const matched = pathToModule[currentPath];
    if (matched && matched !== filters.module) {
      setFilters((prev) => ({ ...prev, module: matched }));
    }
  }, [currentPath, filters.module]);

  const handleFilterChange = (updated: Partial<DashboardFilterState>) => {
    setFilters((prev) => {
      const next = { ...prev, ...updated };
      // If module changed, sync URL route
      if (updated.module && updated.module !== prev.module) {
        const targetPath = moduleToPath[updated.module] || "/dashboard";
        if (location.pathname !== targetPath) {
          void navigate(targetPath, { replace: false });
        }
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    setFilters({ ...initialFilters, module: filters.module });
  };

  const handleRefreshData = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Toggle Fullscreen & Browser Fullscreen API
  const handleToggleFullscreen = useCallback(async () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        // Fallback gracefully if browser policy blocks requestFullscreen
      }
    } else {
      setIsFullscreen(false);
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      } catch {
        // Ignore exit error
      }
    }
  }, [isFullscreen]);

  const handleCloseFullscreen = useCallback(async () => {
    setIsFullscreen(false);
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore exit error
    }
  }, []);

  // Sync with browser fullscreen state (e.g. user pressed ESC on browser)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        void handleCloseFullscreen();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen, handleCloseFullscreen]);

  const activeModuleConfig = MODULE_CONFIGS[filters.module] || MODULE_CONFIGS.semua;

  return (
    <>
      {/* 1. Tampilan Layar Penuh (Wajib 1 Layar Tanpa Scroll di Card Manapun) */}
      {isFullscreen && (
        <DashboardFullscreenView
          filters={filters}
          onFilterChange={handleFilterChange}
          onCloseFullscreen={handleCloseFullscreen}
          onRefreshData={handleRefreshData}
        />
      )}

      {/* 2. Tampilan Bukan Layar Penuh (Bebas Saja, Responsif & Elegan) */}
      <div key={refreshKey} className="space-y-6">
        <PageMeta
          title={`${activeModuleConfig.pageTitle} | GIS Departemen`}
          description="Monitoring operasional kebun PT BUM & BSL"
        />

        <PageBreadcrumb pageTitle={activeModuleConfig.breadcrumb} />

        {/* Notifikasi Peringatan Cuaca Ekstrem Lapangan (Jika Aktif) */}
        {filters.weatherAlert && filters.weatherAlert !== "cerah" && (
          <WeatherAlertNotification
            weatherAlert={filters.weatherAlert}
            onDismiss={() => handleFilterChange({ weatherAlert: "cerah" })}
          />
        )}

        {/* Header: Filter Perusahaan PT BUM & BSL, Tanggal Hari Ini, Cuaca Live, Cetak, Segarkan, Layar Penuh */}
        <DashboardHeader
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          onRefreshData={handleRefreshData}
          onToggleFullscreen={handleToggleFullscreen}
        />

        {/* Ringkasan Eksekutif Lapangan */}
        <ExecutiveSummaryBanner filters={filters} />

        {/* 4 KPI Metric Cards (Luas Baku Ha, Produksi TBS Ton, Perawatan Ha, SPH 136) */}
        <DashboardMetrics filters={filters} />

        {/* Kanvas Peta Geospasial Leaflet (dengan Tombol Zoom + dan -) */}
        <DashboardMapCanvas filters={filters} />

        {/* Bar Chart Capaian & Drill-Down Hierarki Grid */}
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {/* Bar Chart: Capaian per Region (berubah jadi Afdeling jika estate dipilih) */}
          <div className="col-span-12 xl:col-span-6">
            <DynamicAchievementBarChart filters={filters} />
          </div>

          {/* Capaian per Estate (berubah jadi Ranking Blok 3 Teratas & 3 Terbawah jika estate dipilih) */}
          <div className="col-span-12 xl:col-span-6">
            <EstateAndBlockRankingCard filters={filters} />
          </div>
        </div>

        {/* Middle Analytics Grid: Tren Line Chart 12 Bulan Target Rencana vs Realisasi Aktual */}
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12">
            <OperationalTrendChart filters={filters} />
          </div>
        </div>

        {/* Distribusi Status / Bar Chart 7 */}
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12">
            <StatusDistributionCard filters={filters} />
          </div>
        </div>
      </div>
    </>
  );
}
