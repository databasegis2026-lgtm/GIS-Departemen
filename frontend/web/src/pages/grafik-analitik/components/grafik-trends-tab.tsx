import { useMemo } from "react";
import { useTheme } from "@/contexts";
import type { ApexOptions } from "apexcharts";
import ReactApexChart from "react-apexcharts";
import type { DashboardFilterState } from "@/pages/dashboard/types";
import { getModuleColors } from "@/pages/dashboard/mock-data";
import { MODULE_CONFIGS } from "@/pages/dashboard/module-config";

interface GrafikTrendsTabProps {
  filters: DashboardFilterState;
}

const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function GrafikTrendsTab({ filters }: GrafikTrendsTabProps) {
  const { theme } = useTheme();

  const multiplier = useMemo(() => {
    if (filters.estate !== "Semua") return 0.12;
    if (filters.region !== "Semua") return 0.35;
    if (filters.company === "BSL") return 0.15;
    if (filters.company === "PT_BUM") return 0.85;
    return 1.0;
  }, [filters]);

  const activeModule = MODULE_CONFIGS[filters.module] || MODULE_CONFIGS.semua;
  const unit = activeModule.unit;
  const { targetColor, realisasiColor } = getModuleColors(filters.module);

  // Dataset Bulanan
  const monthlyData = useMemo(() => {
    const baseTarget = [240, 260, 280, 290, 310, 330, 320, 310, 300, 290, 280, 270];
    const baseRealisasi = [230, 255, 275, 288, 305, 320, 312, 300, 290, 0, 0, 0];

    return monthNames.map((m, idx) => {
      const target = Math.round(baseTarget[idx] * multiplier);
      const realisasi = Math.round(baseRealisasi[idx] * multiplier);
      const capaian = target > 0 ? (realisasi / target) * 100 : 0;
      const defisit = Math.max(0, target - realisasi);

      return {
        bulan: m,
        target,
        realisasi,
        capaian,
        defisit,
        status: idx >= 9 ? "Belum Berjalan" : capaian >= 95 ? "Tercapai" : "Kurang",
      };
    });
  }, [multiplier]);

  // S-Curve Kumulatif
  const sCurveSeries = useMemo(() => {
    let accTarget = 0;
    let accRealisasi = 0;
    const targetCum: number[] = [];
    const realisasiCum: number[] = [];

    monthlyData.forEach((d) => {
      accTarget += d.target;
      targetCum.push(accTarget);

      if (d.realisasi > 0) {
        accRealisasi += d.realisasi;
        realisasiCum.push(accRealisasi);
      }
    });

    return [
      { name: `Target Kumulatif (${unit})`, data: targetCum },
      { name: `Realisasi Kumulatif (${unit})`, data: realisasiCum },
    ];
  }, [monthlyData, unit]);

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        fontFamily: "Outfit, sans-serif",
        height: 300,
        type: "line",
        toolbar: { show: false },
        parentHeightOffset: 0,
      },
      colors: [targetColor, realisasiColor],
      stroke: {
        curve: "smooth",
        width: [2.5, 3],
        dashArray: [4, 0],
      },
      dataLabels: { enabled: false },
      legend: {
        show: true,
        position: "top",
        horizontalAlign: "right",
        labels: {
          colors: theme === "dark" ? "#94A3B8" : "#64748B",
        },
      },
      xaxis: {
        categories: monthNames.map((m) => m.slice(0, 3)),
        labels: {
          style: {
            colors: theme === "dark" ? "#94A3B8" : "#64748B",
            fontSize: "11px",
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: theme === "dark" ? "#94A3B8" : "#64748B",
            fontSize: "11px",
          },
          formatter: (val?: number | null) =>
            val != null ? `${Math.round(val).toLocaleString("id-ID")} ${unit}` : `0 ${unit}`,
        },
      },
      grid: {
        borderColor: theme === "dark" ? "#1E293B" : "#F1F5F9",
        strokeDashArray: 4,
      },
      tooltip: {
        theme: theme === "dark" ? "dark" : "light",
      },
    }),
    [theme, targetColor, realisasiColor, unit],
  );

  return (
    <div className="space-y-6">
      {/* 1. Kurva S Kumulatif */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Kurva S Kumulatif (S-Curve YTD Budget vs Aktual)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Standar evaluasi agronomi perkebunan untuk memantau akumulasi pencapaian target tahun berjalan
          </p>
        </div>

        <div className="w-full">
          <ReactApexChart
            options={options}
            series={sCurveSeries}
            type="line"
            height={300}
          />
        </div>
      </div>

      {/* 2. Rekapitulasi Tabel Matriks 12 Bulan */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Rekapitulasi Kinerja Bulanan (Januari s/d Desember 2026)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tabel matriks evaluasi angka target rencana, realisasi aktual, persentase capaian, dan beban defisit
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-[11px] font-bold text-gray-600 dark:bg-gray-800/50 dark:text-gray-300 uppercase">
              <tr>
                <th className="px-4 py-3">Bulan</th>
                <th className="px-3 py-3">Target Rencana</th>
                <th className="px-3 py-3">Realisasi Aktual</th>
                <th className="px-3 py-3">Capaian (%)</th>
                <th className="px-3 py-3">Deviasi (+ / -)</th>
                <th className="px-4 py-3">Status Evaluasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
              {monthlyData.map((m, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <td className="px-4 py-2.5 font-bold text-gray-900 dark:text-white">
                    {m.bulan}
                  </td>
                  <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">
                    {m.target.toLocaleString("id-ID")} {unit}
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-gray-900 dark:text-white">
                    {m.realisasi > 0 ? `${m.realisasi.toLocaleString("id-ID")} ${unit}` : "-"}
                  </td>
                  <td className="px-3 py-2.5 font-bold">
                    {m.realisasi > 0 ? (
                      <span style={{ color: m.capaian >= 85 ? "#10B981" : "#EF4444" }}>
                        {m.capaian.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {m.realisasi > 0 ? (
                      m.defisit > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400 font-bold">
                          -{m.defisit.toLocaleString("id-ID")} {unit}
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          Tercapai
                        </span>
                      )
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        m.status === "Tercapai"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : m.status === "Kurang"
                          ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Lembar Pengesahan Tanda Tangan Lapangan */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Lembar Pengesahan Laporan Dokumen Lapangan
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Verifikasi resmi berjenjang kebun PT Bangkitgiat Usaha Mandiri & BSL
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {[
            { role: "Dibuat Oleh:", title: "Mandor / Kerani Lapangan", name: "Nama Mandor" },
            { role: "Diperiksa Oleh:", title: "Asisten Afdeling", name: "Nama Asisten" },
            { role: "Disetujui Oleh:", title: "Asisten Kepala (Askep)", name: "Nama Askep" },
            { role: "Mengetahui:", title: "Estate Manager (EM)", name: "Nama Manager" },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-xl border border-dashed border-gray-300 p-4 text-center dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20"
            >
              <div className="text-[10px] text-gray-400 uppercase font-semibold">{s.role}</div>
              <div className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-0.5">{s.title}</div>
              <div className="h-14 my-2 flex items-center justify-center text-gray-300 text-xs italic">
                (Tanda Tangan)
              </div>
              <div className="border-t border-gray-300 pt-1 text-[11px] font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                ...................................
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
