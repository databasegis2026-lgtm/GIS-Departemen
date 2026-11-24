import { useMemo } from "react";
import type { CompanyOption, DashboardFilterState, OperationalModuleOption, RegionOption } from "@/pages/dashboard/types";
import { getEstateData } from "@/pages/dashboard/mock-data";

interface GrafikToolbarProps {
  filters: DashboardFilterState;
  onFilterChange: (patch: Partial<DashboardFilterState>) => void;
  onResetFilters: () => void;
  onPrint: () => void;
  onExportCSV: () => void;
}

const AKTIVITAS_OPTIONS: {
  id: OperationalModuleOption;
  label: string;
  unit: string;
  icon: string;
}[] = [
  { id: "produksi", label: "Produksi", unit: "Ton", icon: "🌾" },
  { id: "pruning", label: "Pruning", unit: "Ha", icon: "✂️" },
  { id: "pasar_pikul", label: "Pasar Pikul", unit: "Ha", icon: "🛤️" },
  { id: "semprot", label: "Semprot Gulma", unit: "Ha", icon: "🧴" },
  { id: "pemupukan", label: "Pemupukan", unit: "Ha", icon: "🌱" },
  { id: "jangkos", label: "Aplikasi Jangkos", unit: "Ha", icon: "🚛" },
];

export default function GrafikToolbar({
  filters,
  onFilterChange,
  onResetFilters,
  onPrint,
  onExportCSV,
}: GrafikToolbarProps) {
  const availableEstates = useMemo<string[]>(() => {
    const estates = getEstateData(filters).map((e) => e.name);
    return Array.from(new Set(estates));
  }, [filters]);

  return (
    <div className="space-y-4">
      {/* 1. Switcher 6 Modul Aktivitas Kebun */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {AKTIVITAS_OPTIONS.map((item) => {
          const isActive = filters.module === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onFilterChange({ module: item.id })}
              className={`flex items-center gap-2 cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold transition-all shrink-0 border ${
                isActive
                  ? "bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              <span
                className={`rounded-md px-1.5 py-0.2 text-[9.5px] font-semibold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {item.unit}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Filter Bar Terpadu (TailAdmin Style) */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-7 gap-3 items-center">
          {/* Tahun */}
          <div>
            <label className="block text-[10.5px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Tahun
            </label>
            <select
              value={filters.year}
              onChange={(e) => onFilterChange({ year: Number(e.target.value) })}
              className="h-8.5 w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>
          </div>

          {/* Bulan */}
          <div>
            <label className="block text-[10.5px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Bulan
            </label>
            <select
              value={filters.month}
              onChange={(e) => onFilterChange({ month: e.target.value as any })}
              className="h-8.5 w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="Semua">Semua Bulan (Jan-Des)</option>
              {["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Perusahaan */}
          <div>
            <label className="block text-[10.5px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Perusahaan
            </label>
            <select
              value={filters.company}
              onChange={(e) =>
                onFilterChange({
                  company: e.target.value as CompanyOption,
                  region: "Semua",
                  estate: "Semua",
                })
              }
              className="h-8.5 w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="Semua">PT BUM & BSL</option>
              <option value="PT_BUM">PT BUM Saja</option>
              <option value="BSL">BSL Saja</option>
            </select>
          </div>

          {/* Region */}
          <div>
            <label className="block text-[10.5px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
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
              className="h-8.5 w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="Semua">Semua Region</option>
              <option value="REGION 1">REGION 1</option>
              <option value="REGION 2">REGION 2</option>
              <option value="REGION 3">REGION 3</option>
            </select>
          </div>

          {/* Estate */}
          <div>
            <label className="block text-[10.5px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Estate
            </label>
            <select
              value={filters.estate}
              onChange={(e) => onFilterChange({ estate: e.target.value })}
              className="h-8.5 w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="Semua">Semua Estate</option>
              {availableEstates.map((est) => (
                <option key={est} value={est}>
                  {est}
                </option>
              ))}
            </select>
          </div>

          {/* Tombol Aksi: Cetak PDF & Ekspor CSV */}
          <div className="col-span-2 sm:col-span-3 md:col-span-1 lg:col-span-2 flex items-center gap-2 justify-end pt-5">
            <button
              type="button"
              onClick={onResetFilters}
              className="h-8.5 cursor-pointer rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              title="Reset Filter"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onExportCSV}
              className="h-8.5 cursor-pointer rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5"
            >
              <svg className="size-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="13" x2="16" y2="13" />
                <line x1="8" y1="17" x2="16" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span>Excel/CSV</span>
            </button>
            <button
              type="button"
              onClick={onPrint}
              className="h-8.5 cursor-pointer rounded-lg bg-rose-600 px-3.5 text-xs font-bold text-white hover:bg-rose-700 shadow-xs transition-colors flex items-center gap-1.5"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
