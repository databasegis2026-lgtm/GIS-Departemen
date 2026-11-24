import { useState, useMemo } from "react";
import type { DashboardFilterState, DecisionMatrixResult } from "@/pages/dashboard/types";

interface GrafikDecisionTabProps {
  filters: DashboardFilterState;
  decisionData: DecisionMatrixResult;
}

const PAGE_SIZE = 8;

export default function GrafikDecisionTab({
  filters,
  decisionData,
}: GrafikDecisionTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"attention" | "maintain">("attention");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const dataset = activeSubTab === "attention" ? decisionData.needsAttention : decisionData.maintainBlocks;

  const filteredDataset = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return dataset;
    return dataset.filter(
      (b) =>
        b.blok.toLowerCase().includes(q) ||
        b.estate.toLowerCase().includes(q) ||
        b.afdeling.toLowerCase().includes(q) ||
        b.kendala.toLowerCase().includes(q) ||
        b.kondisi.toLowerCase().includes(q)
    );
  }, [dataset, search]);

  const totalPages = Math.ceil(filteredDataset.length / PAGE_SIZE) || 1;
  const pagedData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredDataset.slice(start, start + PAGE_SIZE);
  }, [filteredDataset, page]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3 shadow-xs space-y-5">
      {/* Header Banner Analisis Keputusan */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 dark:border-gray-800">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>Matriks Evaluasi & Keputusan Blok</span>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 uppercase">
              {filters.module}
            </span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Kuadran prioritas tindakan teknis agronomi untuk mengejar target defisit luasan/tonase
          </p>
        </div>

        {/* Tab Switcher & Search */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => {
                setActiveSubTab("attention");
                setPage(1);
              }}
              className={`flex items-center gap-1.5 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeSubTab === "attention"
                  ? "bg-white text-rose-600 shadow-xs dark:bg-gray-900 dark:text-rose-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <span>Perlu Perhatian</span>
              <span className="rounded-full bg-rose-100 px-1.5 py-0.2 text-[10px] text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                {decisionData.criticalCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSubTab("maintain");
                setPage(1);
              }}
              className={`flex items-center gap-1.5 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeSubTab === "maintain"
                  ? "bg-white text-emerald-600 shadow-xs dark:bg-gray-900 dark:text-emerald-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <span>Perlu Dijaga</span>
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                {decisionData.maintainCount}
              </span>
            </button>
          </div>

          <div className="relative w-48 sm:w-60">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari blok / afdeling..."
              className="h-8.5 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-xs text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>
        </div>
      </div>

      {/* Tabel Matriks Keputusan */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-[11px] font-bold text-gray-600 dark:bg-gray-800/50 dark:text-gray-300 uppercase">
            <tr>
              <th className="px-4 py-3">Blok & Lokasi Kebun</th>
              <th className="px-3 py-3">Luas Target</th>
              <th className="px-3 py-3">Realisasi</th>
              <th className="px-3 py-3">Capaian</th>
              <th className="px-3 py-3">Defisit</th>
              <th className="px-3.5 py-3">Status Kondisi</th>
              <th className="px-4 py-3">Kendala Lapangan & Rekomendasi Agronomi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
            {pagedData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Tidak ada blok dalam kategori ini.
                </td>
              </tr>
            ) : (
              pagedData.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-900 dark:text-white">
                      Blok {item.blok}
                    </div>
                    <div className="text-[10.5px] text-gray-500 dark:text-gray-400">
                      {item.estate} • {item.afdeling}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-700 dark:text-gray-300">
                    {item.luasHa.toLocaleString("id-ID")} Ha
                  </td>
                  <td className="px-3 py-3 font-semibold text-gray-900 dark:text-white">
                    {item.realisasiHa.toLocaleString("id-ID")} Ha
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-bold" style={{ color: item.warnaHex }}>
                      {item.capaianPct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {item.defisitHa > 0 ? (
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        -{item.defisitHa.toLocaleString("id-ID")} Ha
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        Tuntas
                      </span>
                    )}
                  </td>
                  <td className="px-3.5 py-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.warnaHex }}
                      />
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {item.kondisi}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-sm">
                    <div className="text-[11px] text-gray-700 dark:text-gray-300">
                      <span className="font-semibold text-gray-900 dark:text-white">Akar Masalah: </span>
                      {item.kendala}
                    </div>
                    <div className="text-[10.5px] text-brand-600 dark:text-brand-400 mt-1">
                      <span className="font-semibold">Rekomendasi Tindakan: </span>
                      {item.rekomendasi}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Halaman {page} dari {totalPages} ({filteredDataset.length} total blok)
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="cursor-pointer rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            Sebelumnya
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="cursor-pointer rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
}
