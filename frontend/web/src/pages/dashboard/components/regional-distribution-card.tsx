interface RegionPerformanceItem {
  id: string;
  name: string;
  company: string;
  estates: string[];
  totalLuasHa: number;
  realisasiHa: number;
  capaianPct: number;
}

const regionsData: RegionPerformanceItem[] = [
  {
    id: "reg-1",
    name: "REGION 1",
    company: "PT BUM",
    estates: ["BUM 1", "BUM 2", "BUM 4"],
    totalLuasHa: 6250,
    realisasiHa: 5775,
    capaianPct: 92.4,
  },
  {
    id: "reg-2",
    name: "REGION 2",
    company: "PT BUM",
    estates: ["BUM 5", "BUM 6", "BUM 7"],
    totalLuasHa: 5980,
    realisasiHa: 5328,
    capaianPct: 89.1,
  },
  {
    id: "reg-3",
    name: "REGION 3 (BUM)",
    company: "PT BUM",
    estates: ["BUM 3", "BUM 8"],
    totalLuasHa: 4820,
    realisasiHa: 4218,
    capaianPct: 87.5,
  },
  {
    id: "reg-bsl",
    name: "REGION 3 (BSL)",
    company: "BSL",
    estates: ["BSL"],
    totalLuasHa: 1400,
    realisasiHa: 1190,
    capaianPct: 85.0,
  },
];

interface RegionalDistributionCardProps {
  compact?: boolean;
}

export default function RegionalDistributionCard({ compact = false }: RegionalDistributionCardProps) {
  return (
    <div className={`h-full rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 ${compact ? "p-3" : "p-5 sm:p-6"}`}>
      <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
        <div>
          <h3 className={`font-semibold text-gray-800 dark:text-white/90 ${compact ? "text-xs" : "text-base"}`}>
            Sebaran Capaian Regional
          </h3>
          {!compact && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Perbandingan persentase realisasi operasional per kawasan kebun
            </p>
          )}
        </div>
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          4 Wilayah
        </span>
      </div>

      <div className={compact ? "mt-2 space-y-2" : "mt-5 space-y-4"}>
        {regionsData.map((reg) => (
          <div key={reg.id} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className={`font-semibold text-gray-800 dark:text-white/90 ${compact ? "text-[11px]" : "text-xs"}`}>
                  {reg.name}
                </span>
                <span className="rounded-xs bg-gray-100 px-1 py-0.2 text-[9px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  {reg.company}
                </span>
              </div>
              <span className={`font-bold text-gray-700 dark:text-gray-200 ${compact ? "text-[11px]" : "text-xs"}`}>
                {reg.capaianPct}%
              </span>
            </div>

            {/* Progress Bar with 2026 Condition Color Accent */}
            <div className={`w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 ${compact ? "h-1.5" : "h-2"}`}>
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  reg.capaianPct >= 90
                    ? "bg-emerald-600"
                    : reg.capaianPct >= 80
                    ? "bg-green-500"
                    : reg.capaianPct >= 60
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${reg.capaianPct}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-gray-400">
              <span>{reg.estates.join(", ")}</span>
              <span>
                {reg.realisasiHa.toLocaleString("id-ID")} / {reg.totalLuasHa.toLocaleString("id-ID")} Ha
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
