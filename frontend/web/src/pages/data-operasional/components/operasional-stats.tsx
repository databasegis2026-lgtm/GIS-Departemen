import type { OperasionalStats } from "../types";

interface OperasionalStatsProps {
  stats: OperasionalStats;
}

export default function OperasionalStatsCards({ stats }: OperasionalStatsProps) {
  const cards = [
    {
      title: "Target Luas",
      value: `${stats.totalTargetHa.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Ha`,
      sub: "Berdasarkan luasan blok",
      color: "text-slate-900 dark:text-slate-100",
      barColor: "bg-slate-400 dark:bg-slate-600",
      percent: 100,
      icon: (
        <svg className="size-4.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
      ),
    },
    {
      title: "Realisasi Luas",
      value: `${stats.totalRealisasiHa.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Ha`,
      sub: "Pekerjaan lapangan selesai",
      color: "text-emerald-600 dark:text-emerald-400",
      barColor: "bg-emerald-500",
      percent: Math.min(100, stats.rataCapaianPersen),
      icon: (
        <svg className="size-4.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    {
      title: "Rata-rata Capaian",
      value: `${stats.rataCapaianPersen.toFixed(1)}%`,
      sub: "Realisasi vs target",
      color: "text-sky-600 dark:text-sky-400",
      barColor: "bg-sky-500",
      percent: Math.min(100, stats.rataCapaianPersen),
      icon: (
        <svg className="size-4.5 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
      ),
    },
    {
      title: "Blok Selesai",
      value: `${stats.blokSelesaiCount} / ${stats.totalBlok}`,
      sub: "Tercapai 100% atau BAPP",
      color: "text-amber-600 dark:text-amber-400",
      barColor: "bg-amber-500",
      percent: stats.totalBlok > 0 ? (stats.blokSelesaiCount / stats.totalBlok) * 100 : 0,
      icon: (
        <svg className="size-4.5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/40 min-w-0"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px] truncate">{c.title}</span>
            {c.icon}
          </div>
          <div className={`mt-2 text-xl sm:text-2xl font-bold tracking-tight truncate ${c.color}`}>
            {c.value}
          </div>
          <div className="mt-2.5">
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${c.barColor}`}
                style={{ width: `${c.percent}%` }}
              />
            </div>
            <div className="mt-1 text-[10.5px] text-slate-400 truncate">
              {c.sub}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
