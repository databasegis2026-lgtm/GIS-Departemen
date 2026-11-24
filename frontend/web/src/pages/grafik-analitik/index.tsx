import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { PageMeta } from "@/components/shared/page-meta";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import type { DashboardFilterState, OperationalModuleOption } from "@/pages/dashboard/types";
import { getDecisionMatrixData, MOCK_BLOCK_DATA } from "@/pages/dashboard/mock-data";
import { MODULE_CONFIGS } from "@/pages/dashboard/module-config";
import { printEstatePDF } from "@/pages/dashboard/print-reports";

// Subkomponen Modular
import GrafikToolbar from "./components/grafik-toolbar";
import GrafikKpiCards from "./components/grafik-kpi-cards";
import GrafikPerformanceTab from "./components/grafik-performance-tab";
import GrafikDecisionTab from "./components/grafik-decision-tab";
import GrafikLeaderboardTab from "./components/grafik-leaderboard-tab";
import GrafikTrendsTab from "./components/grafik-trends-tab";

type MainTab = "performance" | "decision" | "leaderboard" | "trends";

export default function GrafikAnalitikPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Sinkronisasi Modul dari URL path
  const initialModule = useMemo<OperationalModuleOption>(() => {
    const path = location.pathname;
    if (path.includes("produksi")) return "produksi";
    if (path.includes("pruning")) return "pruning";
    if (path.includes("pasar-pikul")) return "pasar_pikul";
    if (path.includes("pemupukan")) return "pemupukan";
    if (path.includes("semprot")) return "semprot";
    if (path.includes("jangkos")) return "jangkos";
    return "semua";
  }, [location.pathname]);

  const [filters, setFilters] = useState<DashboardFilterState>({
    company: "Semua",
    region: "Semua",
    estate: "Semua",
    quarter: "Semua",
    month: "Semua",
    year: 2026,
    module: initialModule,
  });

  const [activeTab, setActiveTab] = useState<MainTab>("performance");

  // Sinkronisasi jika URL berubah dari menu sidebar
  useEffect(() => {
    setFilters((prev) => ({ ...prev, module: initialModule }));
  }, [initialModule]);

  const handleFilterChange = (patch: Partial<DashboardFilterState>) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      // Jika modul diubah via switcher, update URL secara rapi
      if (patch.module && patch.module !== prev.module) {
        if (patch.module === "semua") {
          navigate("/grafik-analitik", { replace: true });
        } else if (patch.module === "produksi") {
          navigate("/grafik-analitik/produksi", { replace: true });
        } else {
          navigate(`/grafik-analitik/perawatan/${patch.module.replace("_", "-")}`, { replace: true });
        }
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    setFilters({
      company: "Semua",
      region: "Semua",
      estate: "Semua",
      quarter: "Semua",
      month: "Semua",
      year: 2026,
      module: filters.module,
    });
  };

  // Data Matriks Keputusan untuk badge notifikasi
  const decisionData = useMemo(() => {
    return getDecisionMatrixData(filters);
  }, [filters]);

  const activeModuleConfig = MODULE_CONFIGS[filters.module] || MODULE_CONFIGS.semua;

  // Nama modul bersih tanpa kata "Dashboard"
  const moduleDisplayName = useMemo(() => {
    if (filters.module === "semua") return "Operasional";
    return activeModuleConfig.shortName || activeModuleConfig.name.replace(/^Dashboard\s+/i, "");
  }, [filters.module, activeModuleConfig]);

  // Handler Cetak Laporan PDF
  const handlePrint = () => {
    printEstatePDF(filters);
  };

  // Handler Ekspor CSV
  const handleExportCSV = () => {
    const headers = ["Region", "Estate", "Afdeling", "Blok", "Luas_Ha", "Realisasi_Ha", "Capaian_Pct", "Kondisi"];
    const rows = MOCK_BLOCK_DATA.map((b) => [
      b.region,
      b.estate,
      b.afdeling,
      b.blok,
      b.luasHa,
      b.realisasiHa,
      b.capaianPct,
      b.kondisi,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Grafik_Analitik_${filters.module}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs: { id: MainTab; label: string; desc: string; icon: string; badge?: number }[] = [
    {
      id: "performance",
      label: "Capaian & Grafik",
      desc: "KPI aktual & grafik pencapaian",
      icon: "📊",
    },
    {
      id: "decision",
      label: "Matriks Keputusan",
      desc: "Kuadran prioritas penanganan blok",
      icon: "🎯",
      badge: decisionData.criticalCount,
    },
    {
      id: "leaderboard",
      label: "Peringkat Wilayah",
      desc: "Top 5 unit & perbandingan afdeling",
      icon: "🏆",
    },
    {
      id: "trends",
      label: "Dinamika Tren 12 Bulan",
      desc: "Kurva S-Curve & lembar pengesahan",
      icon: "📈",
    },
  ];

  return (
    <div className="space-y-6">
      <PageMeta
        title={`Grafik & Analitik ${moduleDisplayName} | GIS Departemen`}
        description="Analitik mendalam data operasional perkebunan PT BUM & BSL"
      />

      <PageBreadcrumb pageTitle={`Grafik & Analitik ${moduleDisplayName}`} />

      {/* 1. Header Toolbar & Filter Cascading */}
      <GrafikToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onPrint={handlePrint}
        onExportCSV={handleExportCSV}
      />

      {/* 2. 6 Kartu Metrik KPI Aktual */}
      <GrafikKpiCards filters={filters} decisionData={decisionData} />

      {/* 3. Navigasi 4 Tab Analitik Modern (Linear / Vercel Style) */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 cursor-pointer border-b-2 px-4 py-3 text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? "border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
                {t.badge != null && t.badge > 0 && (
                  <span className="rounded-full bg-rose-100 px-1.5 py-0.2 text-[10px] font-bold text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Konten Tab Aktif */}
      <div>
        {activeTab === "performance" && <GrafikPerformanceTab filters={filters} />}
        {activeTab === "decision" && (
          <GrafikDecisionTab filters={filters} decisionData={decisionData} />
        )}
        {activeTab === "leaderboard" && <GrafikLeaderboardTab filters={filters} />}
        {activeTab === "trends" && <GrafikTrendsTab filters={filters} />}
      </div>
    </div>
  );
}
