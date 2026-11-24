import { useMemo } from "react";
import type { DashboardFilterState, DecisionMatrixResult } from "@/pages/dashboard/types";
import { getFilteredMetrics } from "@/pages/dashboard/mock-data";
import { MODULE_CONFIGS } from "@/pages/dashboard/module-config";

interface GrafikKpiCardsProps {
  filters: DashboardFilterState;
  decisionData: DecisionMatrixResult;
}

export default function GrafikKpiCards({
  filters,
  decisionData,
}: GrafikKpiCardsProps) {
  const metrics = useMemo(() => {
    return getFilteredMetrics(filters);
  }, [filters]);

  const activeModule = MODULE_CONFIGS[filters.module] || MODULE_CONFIGS.semua;
  const unit = activeModule.unit;

  const totalTarget = metrics.totalLuasHa;
  const totalRealisasi = metrics.totalRealisasiHa;
  const defisit = Math.max(0, totalTarget - totalRealisasi);
  const surplus = Math.max(0, totalRealisasi - totalTarget);

  const cards = [
    {
      title: "Luas Total Baku",
      value: `${metrics.totalLuasHa.toLocaleString("id-ID")} Ha`,
      sub: "Baku Master Blok GIS",
      color: "text-gray-900 dark:text-white",
      borderColor: "border-gray-200 dark:border-gray-800",
      badge: "Master Area",
      badgeColor: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    },
    {
      title: `Target Rencana (${unit})`,
      value: `${totalTarget.toLocaleString("id-ID")} ${unit}`,
      sub: "Budget Operasional",
      color: "text-blue-600 dark:text-blue-400",
      borderColor: "border-blue-100 dark:border-blue-950/40",
      badge: "Target Rencana",
      badgeColor: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
    },
    {
      title: `Realisasi Aktual (${unit})`,
      value: `${totalRealisasi.toLocaleString("id-ID")} ${unit}`,
      sub: "Pencapaian Fisik Lapangan",
      color: "text-amber-600 dark:text-amber-400",
      borderColor: "border-amber-100 dark:border-amber-950/40",
      badge: "Realisasi Fisik",
      badgeColor: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    },
    {
      title: "Persentase Capaian",
      value: `${metrics.avgCapaian.toFixed(1)}%`,
      sub: metrics.avgCapaian >= 100 ? "Memenuhi Target" : "Perlu Percepatan",
      color: metrics.avgCapaian >= 85 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
      borderColor: metrics.avgCapaian >= 85 ? "border-emerald-100 dark:border-emerald-950/40" : "border-rose-100 dark:border-rose-950/40",
      badge: "Efektivitas",
      badgeColor: metrics.avgCapaian >= 85 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
    },
    {
      title: "Deviasi / Selisih Fisik",
      value: defisit > 0 ? `-${defisit.toLocaleString("id-ID")} ${unit}` : `+${surplus.toLocaleString("id-ID")} ${unit}`,
      sub: defisit > 0 ? "Beban Defisit Tertunda" : "Surplus Capaian",
      color: defisit > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400",
      borderColor: defisit > 0 ? "border-rose-100 dark:border-rose-950/40" : "border-emerald-100 dark:border-emerald-950/40",
      badge: defisit > 0 ? "Defisit" : "Surplus",
      badgeColor: defisit > 0 ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    },
    {
      title: "Blok Perlu Perhatian",
      value: `${decisionData.criticalCount} Blok`,
      sub: `${decisionData.maintainCount} Blok Performa Prima`,
      color: "text-rose-600 dark:text-rose-400",
      borderColor: "border-rose-200 dark:border-rose-900/60",
      badge: "Prioritas Lapangan",
      badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 animate-pulse",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c, i) => (
        <div
          key={i}
          className={`rounded-2xl border ${c.borderColor} bg-white p-4 dark:bg-white/3 shadow-xs flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate">
              {c.title}
            </span>
            <span className={`rounded-md px-1.5 py-0.2 text-[9px] font-bold ${c.badgeColor} shrink-0`}>
              {c.badge}
            </span>
          </div>
          <div>
            <div className={`text-lg sm:text-xl font-extrabold tracking-tight ${c.color} truncate`}>
              {c.value}
            </div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
              {c.sub}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
