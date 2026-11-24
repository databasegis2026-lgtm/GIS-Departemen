import { useState } from "react";
import type { BackupItem, OperasionalRecord } from "../types";

interface BackupDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  backups: BackupItem[];
  records: OperasionalRecord[];
  onCreateBackup: (note: string) => void;
}

export default function BackupDataModal({
  isOpen,
  onClose,
  backups,
  records,
  onCreateBackup,
}: BackupDataModalProps) {
  const [note, setNote] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setTimeout(() => {
      onCreateBackup(note.trim() || "Snapshot manual transaksi operasional");
      setNote("");
      setIsCreating(false);
    }, 600);
  };

  const handleDownloadBackup = (b: BackupItem) => {
    const payload = {
      backupCode: b.kode,
      timestamp: b.waktu,
      author: b.oleh,
      recordsCount: records.length,
      data: records,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${b.kode.toLowerCase()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="flex flex-col w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <svg className="size-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
              <span>Backup Data Operasional</span>
            </h2>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Buat cadangan data snapshot atau unduh arsip data operasional
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

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
          {/* Form Buat Backup Baru */}
          <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 space-y-2.5">
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              Buat Snapshot Backup Sekarang
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Menyimpan seluruh {records.length} baris transaksi operasional aktif ke dalam snapshot cadangan.
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Catatan backup (misal: Pra-evaluasi BAPP akhir bulan)"
                className="h-8.5 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
              <button
                type="submit"
                disabled={isCreating}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 cursor-pointer disabled:opacity-50 shrink-0 shadow-xs"
              >
                <span>{isCreating ? "Menyimpan..." : "Simpan Backup"}</span>
              </button>
            </div>
          </form>

          {/* Daftar Snapshot Backup */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Daftar Cadangan Tersimpan
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 overflow-hidden shadow-xs">
              {backups.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {b.kode}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-mono">
                        {b.ukuran}
                      </span>
                    </div>
                    <div className="text-[10.5px] text-slate-400 mt-0.5">
                      {b.waktu} • Oleh {b.oleh} ({b.totalRecord} record)
                    </div>
                    {b.catatan && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                        {b.catatan}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadBackup(b)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer shrink-0"
                    title="Unduh file backup JSON"
                  >
                    <svg className="size-3 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Unduh</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-100 px-5 py-3 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs">
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
