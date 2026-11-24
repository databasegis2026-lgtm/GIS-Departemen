import type { ActionLogItem } from "../types";

interface RiwayatAksiModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ActionLogItem[];
}

export default function RiwayatAksiModal({
  isOpen,
  onClose,
  logs,
}: RiwayatAksiModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="flex flex-col w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <svg className="size-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Riwayat Aksi & Unggahan</span>
            </h2>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Catatan audit aktivitas, unggahan berkas spasial, dan pembaruan data
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body Tabel Log */}
        <div className="p-4 overflow-y-auto max-h-[65vh]">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 shadow-xs">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-[10.5px] font-bold text-slate-600 dark:bg-slate-800/60 dark:text-slate-300 uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2">Waktu</th>
                  <th className="px-3 py-2">Pengguna</th>
                  <th className="px-2.5 py-2">Aksi</th>
                  <th className="px-2.5 py-2">Target</th>
                  <th className="px-3 py-2">Catatan</th>
                  <th className="px-2.5 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {logs.map((l) => (
                  <tr
                    key={l.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Waktu */}
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {l.waktu}
                    </td>

                    {/* Pengguna */}
                    <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200">
                      {l.pengguna}
                    </td>

                    {/* Aksi */}
                    <td className="px-2.5 py-2">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {l.aksi}
                      </span>
                    </td>

                    {/* Target Blok */}
                    <td className="px-2.5 py-2 font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                      {l.blok}
                    </td>

                    {/* Catatan */}
                    <td className="px-3 py-2 max-w-xs truncate text-slate-600 dark:text-slate-400 text-[11px]" title={l.catatan}>
                      {l.catatan}
                    </td>

                    {/* Status */}
                    <td className="px-2.5 py-2 text-center">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs">
          <span className="text-slate-400">Total {logs.length} catatan aktivitas tersimpan</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
