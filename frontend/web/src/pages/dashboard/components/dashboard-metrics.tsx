import { CheckCircleIcon, MapIcon, TableIcon, UsersIcon } from "@/icons";
import MetricCard from "@/pages/main/dashboard/ecommerce/components/metrics/metric-card";
import { getFilteredMetrics, getModuleColors } from "../mock-data";
import { MODULE_CONFIGS } from "../module-config";
import type { DashboardFilterState } from "../types";

interface DashboardMetricsProps {
  filters?: DashboardFilterState;
  totalLuasHa?: number;
  totalProduksiTon?: number;
  totalPerawatanHa?: number;
  sphCompliancePct?: number;
  compact?: boolean;
}

export default function DashboardMetrics({
  filters,
  totalLuasHa = 0,
  totalProduksiTon = 0,
  totalPerawatanHa = 0,
  sphCompliancePct = 0,
  compact = false,
}: DashboardMetricsProps) {
  const currentModule = filters?.module || "semua";
  const modConfig = MODULE_CONFIGS[currentModule] || MODULE_CONFIGS.semua;
  const { targetColor, realisasiColor } = getModuleColors(filters?.module);

  const metrics = filters ? getFilteredMetrics(filters) : null;
  const luas = metrics ? metrics.totalLuasHa : totalLuasHa;
  const produksi = metrics ? metrics.totalProduksiTon : totalProduksiTon;
  const perawatan = metrics ? metrics.totalRealisasiHa : totalPerawatanHa;
  const avgCapaian = metrics ? metrics.avgCapaian : 84.2;

  // Nilai dinamis berdasarkan spesifik aktivitas perkebunan
  let val1 = `${luas.toLocaleString("id-ID")} Ha`;
  let sub1 = modConfig.metric1.subtext;

  let val2 = `${perawatan.toLocaleString("id-ID")} Ha`;
  let sub2 = `${avgCapaian.toFixed(1)}% Capaian`;

  let val3 = `${Math.round(perawatan * 0.5).toLocaleString("id-ID")} Ton`;
  let sub3 = modConfig.metric3.subtext;

  let val4 = `${sphCompliancePct}%`;
  let sub4 = modConfig.metric4.subtext;

  if (currentModule === "pruning") {
    val1 = `${luas.toLocaleString("id-ID")} Ha`;
    val2 = `${perawatan.toLocaleString("id-ID")} Ha`;
    val3 = `${Math.round(perawatan * 136).toLocaleString("id-ID")} Pkk`;
    val4 = "98.6%";
  } else if (currentModule === "pasar_pikul") {
    val1 = `${luas.toLocaleString("id-ID")} Ha`;
    val2 = `${perawatan.toLocaleString("id-ID")} Ha`;
    val3 = `${Math.round(perawatan * 1.25).toLocaleString("id-ID")} Km`;
    val4 = "99.4%";
  } else if (currentModule === "pemupukan") {
    val1 = `${luas.toLocaleString("id-ID")} Ha`;
    val2 = `${perawatan.toLocaleString("id-ID")} Ha`;
    val3 = `${Math.round(perawatan * 0.42).toLocaleString("id-ID")} Ton`;
    val4 = "97.8%";
  } else if (currentModule === "semprot") {
    val1 = `${luas.toLocaleString("id-ID")} Ha`;
    val2 = `${perawatan.toLocaleString("id-ID")} Ha`;
    val3 = `${Math.round(perawatan * 0.88).toLocaleString("id-ID")} Ha`;
    val4 = "99.1%";
  } else if (currentModule === "jangkos") {
    val1 = `${luas.toLocaleString("id-ID")} Ha`;
    val2 = `${perawatan.toLocaleString("id-ID")} Ha`;
    val3 = `${Math.round(perawatan * 35).toLocaleString("id-ID")} Ton`;
    val4 = "96.5%";
  } else if (currentModule === "produksi") {
    val1 = `${luas.toLocaleString("id-ID")} Ha`;
    val2 = `${produksi.toLocaleString("id-ID")} Ton`;
    val3 = `${perawatan.toLocaleString("id-ID")} Ha`;
    val4 = `${sphCompliancePct}%`;
    sub2 = "91.7% Target";
    sub3 = "Rotasi Panen 7 Hari";
  } else {
    // Semua modul
    val1 = `${luas.toLocaleString("id-ID")} Ha`;
    val2 = `${produksi.toLocaleString("id-ID")} Ton`;
    val3 = `${perawatan.toLocaleString("id-ID")} Ha`;
    val4 = `${sphCompliancePct}%`;
    sub2 = "91.7% Target";
  }

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-xs dark:border-gray-800 dark:bg-white/3">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 dark:text-gray-400">
            <span
              className="flex size-4 items-center justify-center rounded-sm"
              style={{ color: targetColor, backgroundColor: `${targetColor}18` }}
            >
              <MapIcon className="size-2.5" />
            </span>
            <span className="truncate">{modConfig.metric1.title}</span>
          </div>
          <div className="mt-1 text-xs sm:text-sm font-bold text-gray-800 dark:text-white/90">
            {val1}
          </div>
          <div className="text-[9px] font-medium text-gray-500 dark:text-gray-400 truncate">
            {sub1}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-xs dark:border-gray-800 dark:bg-white/3">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 dark:text-gray-400">
            <span
              className="flex size-4 items-center justify-center rounded-sm"
              style={{ color: realisasiColor, backgroundColor: `${realisasiColor}18` }}
            >
              <TableIcon className="size-2.5" />
            </span>
            <span className="truncate">{modConfig.metric2.title}</span>
          </div>
          <div className="mt-1 text-xs sm:text-sm font-bold text-gray-800 dark:text-white/90">
            {val2}
          </div>
          <div className="text-[9px] font-medium truncate" style={{ color: realisasiColor }}>
            {sub2}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-xs dark:border-gray-800 dark:bg-white/3">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 dark:text-gray-400">
            <span className="flex size-4 items-center justify-center rounded-sm bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <CheckCircleIcon className="size-2.5" />
            </span>
            <span className="truncate">{modConfig.metric3.title}</span>
          </div>
          <div className="mt-1 text-xs sm:text-sm font-bold text-gray-800 dark:text-white/90">
            {val3}
          </div>
          <div className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 truncate">
            {sub3}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-xs dark:border-gray-800 dark:bg-white/3">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 dark:text-gray-400">
            <span className="flex size-4 items-center justify-center rounded-sm bg-purple-50 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
              <UsersIcon className="size-2.5" />
            </span>
            <span className="truncate">{modConfig.metric4.title}</span>
          </div>
          <div className="mt-1 text-xs sm:text-sm font-bold text-gray-800 dark:text-white/90">
            {val4}
          </div>
          <div className="text-[9px] font-medium text-purple-600 dark:text-purple-400 truncate">
            {sub4}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      <MetricCard
        icon={<MapIcon />}
        title={modConfig.metric1.title}
        value={val1}
        change={sub1}
        direction="up"
      />
      <MetricCard
        icon={<TableIcon />}
        title={modConfig.metric2.title}
        value={val2}
        change={sub2}
        direction="up"
      />
      <MetricCard
        icon={<CheckCircleIcon />}
        title={modConfig.metric3.title}
        value={val3}
        change={sub3}
        direction="up"
      />
      <MetricCard
        icon={<UsersIcon />}
        title={modConfig.metric4.title}
        value={val4}
        change={sub4}
        direction="up"
      />
    </div>
  );
}
