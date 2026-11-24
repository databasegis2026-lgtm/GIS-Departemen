import { useState, useMemo } from "react";
import type { DashboardFilterState, DecisionMatrixResult } from "../types";

interface DecisionMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  decisionData: DecisionMatrixResult;
  filters?: DashboardFilterState;
}

const PAGE_SIZE = 8;

export default function DecisionMatrixModal({
  isOpen,
  onClose,
  decisionData,
  filters,
}: DecisionMatrixModalProps) {
  const [activeTab, setActiveTab] = useState<"attention" | "maintain">("attention");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  if (!isOpen) return null;

  const dataset = activeTab === "attention" ? decisionData.needsAttention : decisionData.maintainBlocks;

  const filteredDataset = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return dataset;
    return dataset.filter(
      (b) =>
        b.blok.toLowerCase().includes(q) ||
        b.estate.toLowerCase().includes(q) ||
        b.afdeling.toLowerCase().includes(q) ||
        b.kendala.toLowerCase().includes(q) ||
        b.kondisi.toLowerCase().includes(q)
    );
  }, [dataset, searchQuery]);

  const totalPages = Math.ceil(filteredDataset.length / PAGE_SIZE) || 1;
  const pagedData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredDataset.slice(start, start + PAGE_SIZE);
  }, [filteredDataset, page]);

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Matriks Keputusan Blok ({filters?.module ? filters.module.toUpperCase() : "OPERASIONAL"})
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Identifikasi prioritas penanganan blok berdasarkan defisit target dan kondisi teknis lapangan 2026
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-100 px-6 py-3 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/20 shrink-0">
          {/* Switcher Tab */}
          <div className="flex items-center gap-1.5 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab("attention");
                setPage(1);
              }}
              className={`flex items-center gap-1.5 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${activeTab === "attention"
                ? "bg-white text-rose-600 shadow-xs dark:bg-gray-900 dark:text-rose-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Perlu Perhatian</span>
              <span className="ml-1 rounded-full bg-rose-100 px-1.5 py-0.2 text-[10px] text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                {decisionData.criticalCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("maintain");
                setPage(1);
              }}
              className={`flex items-center gap-1.5 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${activeTab === "maintain"
                ? "bg-white text-emerald-600 shadow-xs dark:bg-gray-900 dark:text-emerald-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>Perlu Dijaga</span>
              <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                {decisionData.maintainCount}
              </span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Cari blok, estate, afdeling..."
              className="h-8 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-xs text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>
        </div>

        {/* Tabel Konten */}
        <div className="flex-1 overflow-auto p-6">
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-600 dark:bg-gray-800/50 dark:text-gray-300 uppercase">
                <tr>
                  <th className="px-3.5 py-3">Blok & Lokasi</th>
                  <th className="px-3 py-3">Luas Baku</th>
                  <th className="px-3 py-3">Realisasi</th>
                  <th className="px-3 py-3">Capaian</th>
                  <th className="px-3 py-3">Defisit</th>
                  <th className="px-3 py-3">Status Kondisi</th>
                  <th className="px-4 py-3">Kendala Lapangan & Rekomendasi Teknis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                {pagedData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      Tidak ada data blok yang sesuai kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  pagedData.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="px-3.5 py-2.5">
                        <div className="font-bold text-gray-900 dark:text-white">
                          Blok {item.blok}
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">
                          {item.estate} • {item.afdeling}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">
                        {item.luasHa.toLocaleString("id-ID")} Ha
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-gray-900 dark:text-white">
                        {item.realisasiHa.toLocaleString("id-ID")} Ha
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className="font-bold"
                          style={{ color: item.warnaHex }}
                        >
                          {item.capaianPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
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
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.warnaHex }}
                          />
                          <span className="font-semibold text-gray-800 dark:text-gray-200 text-[11px]">
                            {item.kondisi}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 max-w-xs">
                        <div className="text-[11px] text-gray-700 dark:text-gray-300">
                          <span className="font-semibold text-gray-900 dark:text-white">Kendala: </span>
                          {item.kendala}
                        </div>
                        <div className="text-[10.5px] text-brand-600 dark:text-brand-400 mt-0.5">
                          <span className="font-semibold">Rekomendasi: </span>
                          {item.rekomendasi}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Pagination */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/20 shrink-0">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Menampilkan{" "}
            <span className="font-bold text-gray-800 dark:text-gray-200">
              {filteredDataset.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
            </span>{" "}
            -{" "}
            <span className="font-bold text-gray-800 dark:text-gray-200">
              {Math.min(page * PAGE_SIZE, filteredDataset.length)}
            </span>{" "}
            dari{" "}
            <span className="font-bold text-gray-800 dark:text-gray-200">
              {filteredDataset.length}
            </span>{" "}
            blok
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 cursor-pointer rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Sebelumnya</span>
            </button>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 px-1">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 cursor-pointer rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            >
              <span>Berikutnya</span>
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
