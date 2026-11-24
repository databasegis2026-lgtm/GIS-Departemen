import { useMemo } from "react";
import type { DashboardFilterState } from "@/pages/dashboard/types";
import { getEstateData, MOCK_BLOCK_DATA } from "@/pages/dashboard/mock-data";

interface GrafikLeaderboardTabProps {
  filters: DashboardFilterState;
}

export default function GrafikLeaderboardTab({ filters }: GrafikLeaderboardTabProps) {
  // Peringkat Estate
  const estateRanking = useMemo(() => {
    return getEstateData(filters);
  }, [filters]);

  const topEstates = useMemo(() => {
    return [...estateRanking].sort((a, b) => b.capaianPct - a.capaianPct).slice(0, 5);
  }, [estateRanking]);

  const bottomEstates = useMemo(() => {
    return [...estateRanking].sort((a, b) => a.capaianPct - b.capaianPct).slice(0, 5);
  }, [estateRanking]);

  // Peringkat Afdeling
  const afdelingRanking = useMemo(() => {
    const afdMap = new Map<string, { label: string; estate: string; target: number; realisasi: number }>();

    MOCK_BLOCK_DATA.forEach((b) => {
      if (filters.estate !== "Semua" && b.estate !== filters.estate) return;
      if (filters.region !== "Semua" && b.region !== filters.region) return;

      const key = `${b.estate} - ${b.afdeling}`;
      const ex = afdMap.get(key) || { label: b.afdeling, estate: b.estate, target: 0, realisasi: 0 };
      ex.target += b.luasHa;
      ex.realisasi += b.realisasiHa;
      afdMap.set(key, ex);
    });

    return Array.from(afdMap.values()).map((item) => ({
      ...item,
      capaianPct: item.target > 0 ? (item.realisasi / item.target) * 100 : 0,
    })).sort((a, b) => b.capaianPct - a.capaianPct);
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* 2 Kolom: Top 5 vs Bottom 5 Estate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Top 5 Estate Berprestasi */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <span className="text-base">🏆</span>
                <span>Top 5 Estate Capaian Tertinggi</span>
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Unit kebun dengan efektivitas kerja dan realisasi terbaik
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              Performa Prima
            </span>
          </div>

          <div className="space-y-3">
            {topEstates.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 dark:border-gray-800/80 dark:bg-gray-800/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 font-bold text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-gray-900 dark:text-white">
                      Estate {item.name}
                    </div>
                    <div className="text-[10.5px] text-gray-500 dark:text-gray-400">
                      {item.company} • {item.region}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                    {item.capaianPct.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {item.realisasiHa.toLocaleString("id-ID")} / {item.totalLuasHa.toLocaleString("id-ID")} Ha
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom 5 Estate Perlu Perhatian */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <span className="text-base">⚠️</span>
                <span>5 Estate Prioritas Percepatan</span>
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Unit dengan defisit luasan terbesar yang memerlukan dukungan alat/tenaga
              </p>
            </div>
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
              Perlu Evaluasi
            </span>
          </div>

          <div className="space-y-3">
            {bottomEstates.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 dark:border-gray-800/80 dark:bg-gray-800/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-rose-100 font-bold text-xs text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-gray-900 dark:text-white">
                      Estate {item.name}
                    </div>
                    <div className="text-[10.5px] text-gray-500 dark:text-gray-400">
                      {item.company} • {item.region}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-extrabold text-sm text-rose-600 dark:text-rose-400">
                    {item.capaianPct.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Defisit -{Math.max(0, item.totalLuasHa - item.realisasiHa).toLocaleString("id-ID")} Ha
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peringkat Seluruh Afdeling Kebun */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Peringkat Seluruh Divisi Kerja Afdeling
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Perbandingan efisiensi operasional antar afdeling dalam unit kebun aktif
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {afdelingRanking.slice(0, 8).map((afd, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-2xs"
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-gray-900 dark:text-white truncate">
                  {afd.label}
                </span>
                <span
                  className="font-extrabold"
                  style={{
                    color: afd.capaianPct >= 85 ? "#10B981" : afd.capaianPct >= 60 ? "#F59E0B" : "#EF4444",
                  }}
                >
                  {afd.capaianPct.toFixed(1)}%
                </span>
              </div>
              <div className="text-[10px] text-gray-400 mb-2 truncate">
                {afd.estate} • {afd.realisasi.toLocaleString("id-ID")} / {afd.target.toLocaleString("id-ID")} Ha
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, afd.capaianPct)}%`,
                    backgroundColor: afd.capaianPct >= 85 ? "#10B981" : afd.capaianPct >= 60 ? "#F59E0B" : "#EF4444",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
