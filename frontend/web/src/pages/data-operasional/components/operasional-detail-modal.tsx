import type { OperasionalRecord } from "../types";

interface OperasionalDetailModalProps {
  record: OperasionalRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (record: OperasionalRecord) => void;
}

export default function OperasionalDetailModal({
  record,
  isOpen,
  onClose,
  onEdit,
}: OperasionalDetailModalProps) {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="flex flex-col w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Detail Operasional Blok {record.blok}
            </h2>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {record.estate} • {record.afdeling} ({record.region})
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
        <div className="p-5 space-y-3.5 text-xs overflow-y-auto max-h-[75vh]">
          {/* 1. Identitas Wilayah */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="text-[10.5px] font-bold uppercase text-slate-400 mb-2">
              Wilayah & Warung
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11.5px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Region</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{record.region}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Estate</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{record.estate}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Afdeling</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{record.afdeling}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Warung</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{record.warung}</span>
              </div>
            </div>
          </div>

          {/* 2. Luasan & Capaian */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900/60 space-y-2">
            <div className="text-[10.5px] font-bold uppercase text-slate-400">
              Metrik Luasan & Kerapatan
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60 text-center">
                <span className="text-slate-400 block text-[10px]">Luas Target</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {record.luas_ha.toFixed(1)} Ha
                </span>
              </div>
              <div className="rounded-lg bg-emerald-50/60 p-2 dark:bg-emerald-950/40 text-center">
                <span className="text-emerald-600 dark:text-emerald-400 block text-[10px]">Realisasi</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                  {record.realisasi_luas_ha.toFixed(1)} Ha
                </span>
              </div>
              <div className="rounded-lg bg-sky-50/60 p-2 dark:bg-sky-950/40 text-center">
                <span className="text-sky-600 dark:text-sky-400 block text-[10px]">Capaian</span>
                <span className="font-mono font-bold text-sky-700 dark:text-sky-300 text-sm">
                  {record.capaian_persen.toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Standar Pokok per Hektar (SPH):</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {record.sph} Pokok/Ha
              </span>
            </div>
          </div>

          {/* 3. Status Lapangan, Kontraktor, Update Peta, Periode, Tanggal */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg border border-slate-200 p-2.5 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px]">Kondisi</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{record.kondisi}</span>
            </div>
            <div className="rounded-lg border border-slate-200 p-2.5 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px]">Kontraktor</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                {record.kontraktor}
              </span>
            </div>
            <div className="rounded-lg border border-slate-200 p-2.5 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px]">Update Peta</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {!record.update_peta || record.update_peta === "Baru Saja" || record.update_peta === "Sinkron DB"
                  ? record.tanggal || new Date().toISOString().slice(0, 10)
                  : record.update_peta}
              </span>
            </div>
            <div className="rounded-lg border border-slate-200 p-2.5 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px]">Periode</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{record.periode}</span>
            </div>
            <div className="rounded-lg border border-slate-200 p-2.5 dark:border-slate-800 sm:col-span-2">
              <span className="text-slate-400 block text-[10px]">Tanggal Pengerjaan</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{record.tanggal}</span>
            </div>
          </div>

          {/* 4. Keterangan */}
          {record.keterangan && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-3 dark:border-slate-800 dark:bg-slate-800/20">
              <span className="text-slate-400 block text-[10px] mb-1">Keterangan Teknis</span>
              <p className="text-slate-700 dark:text-slate-300 text-xs">
                {record.keterangan}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(record);
              }}
              className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 cursor-pointer"
            >
              Edit Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
