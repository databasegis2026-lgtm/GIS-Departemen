import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { RekapPekerjaanRecord, StatusVerifikasiGIS } from "../types";

interface RekapVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: RekapPekerjaanRecord | null;
  onSave: (
    recordId: string,
    verificationData: {
      status_verifikasi: "submitted" | "in_review" | "verified" | "revision_requested" | "rejected";
      luas_verifikasi_gis: number;
      catatan_gis: string;
      peta_verifikasi_pdf?: string;
      verified_by_code: string;
      verified_by_name: string;
      tanggal_verifikasi: string;
    }
  ) => void;
  currentUser?: {
    name: string;
    code?: string;
  };
}

export default function RekapVerifyModal({
  isOpen,
  onClose,
  record,
  onSave,
  currentUser = { name: "Agus Adi Permana", code: "Kode G" },
}: RekapVerifyModalProps) {
  const [status, setStatus] = useState<StatusVerifikasiGIS>("verified");
  const [luasGis, setLuasGis] = useState<number>(0);
  const [catatanGis, setCatatanGis] = useState<string>("");
  const [petaPdf, setPetaPdf] = useState<string>("");

  useEffect(() => {
    if (record) {
      setStatus(record.status_verifikasi === "submitted" ? "verified" : record.status_verifikasi);
      setLuasGis(record.luas_verifikasi_gis ?? record.realisasi_luas_ha);
      setCatatanGis(record.catatan_gis || "");
      setPetaPdf(record.peta_verifikasi_pdf || "");
    }
  }, [record, isOpen]);

  if (!record) return null;

  const selisih = luasGis - record.realisasi_luas_ha;
  const todayStr = new Date().toISOString().split("T")[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(record.id, {
      status_verifikasi: status === "all" ? "verified" : status,
      luas_verifikasi_gis: luasGis,
      catatan_gis: catatanGis,
      peta_verifikasi_pdf: petaPdf.trim() || undefined,
      verified_by_code: currentUser.code || "Kode G",
      verified_by_name: currentUser.name || "Agus Adi Permana",
      tanggal_verifikasi: todayStr,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 shadow-2xl rounded-2xl p-6">
        <DialogHeader className="border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                Verifikasi Spasial &amp; Keputusan GIS
              </DialogTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pemeriksaan draf poligon kebun sebelum di-commit ke database master ({record.kode_rekap})
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Ringkasan Data Lapangan Kebun */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Lokasi Blok:</span>
            <span className="font-mono font-bold text-gray-900 dark:text-white">
              Blok {record.blok} ({record.estate} - {record.afdeling}) &bull; {record.warung}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Aktivitas Rutin:</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
              {record.aktivitas.replace("_", " ")}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200 dark:border-gray-800 text-center">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-2 border border-gray-200 dark:border-gray-800">
              <span className="block text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold">Luas Baku Master</span>
              <span className="text-xs font-mono font-bold text-gray-800 dark:text-gray-200">
                {record.luas_ha.toFixed(1)} Ha
              </span>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-2 border border-gray-200 dark:border-gray-800">
              <span className="block text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold">Realisasi Pokok</span>
              <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                {(record.realisasi_pokok || Math.round(record.realisasi_luas_ha * 136)).toLocaleString("id-ID")} Pk
              </span>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-2 border border-gray-200 dark:border-gray-800">
              <span className="block text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold">Estimasi Luas</span>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {record.realisasi_luas_ha.toFixed(1)} Ha
              </span>
            </div>
          </div>
          {record.keterangan && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 italic">
              Catatan Lapangan: &ldquo;{record.keterangan}&rdquo;
            </p>
          )}
        </div>

        {/* Form Verifikasi GIS */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Status Keputusan GIS */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Keputusan Hasil Validasi Spasial *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus("verified")}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${status === "verified"
                  ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                  }`}
              >
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>Valid (Commit ke DB)</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus("revision_requested")}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${status === "revision_requested"
                  ? "bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                  }`}
              >
                <span className="size-2 rounded-full bg-amber-500" />
                <span>Minta Revisi Patok</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus("rejected")}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${status === "rejected"
                  ? "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/40 dark:border-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                  }`}
              >
                <span className="size-2 rounded-full bg-rose-500" />
                <span>Tolak Draf</span>
              </button>
            </div>
          </div>

          {/* Luas Terverifikasi GIS & Perbandingan */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Luas Terverifikasi GIS (Ha) *
              </label>
              <span
                className={`text-[11px] font-mono font-medium ${Math.abs(selisih) < 0.05
                  ? "text-emerald-600 dark:text-emerald-400"
                  : selisih < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-amber-600 dark:text-amber-400"
                  }`}
              >
                Selisih: {selisih > 0 ? `+${selisih.toFixed(2)}` : selisih.toFixed(2)} Ha
              </span>
            </div>
            <input
              type="number"
              step="0.01"
              required
              value={luasGis || ""}
              onChange={(e) => setLuasGis(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-xs font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Contoh: 15.2"
            />
          </div>

          {/* Catatan GIS */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Catatan &amp; Instruksi Tim GIS *
            </label>
            <textarea
              required
              rows={3}
              value={catatanGis}
              onChange={(e) => setCatatanGis(e.target.value)}
              placeholder="Contoh: Poligon draf sesuai dengan tutupan citra satelit. Divalidasi dan di-commit ke database master."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Info PIC Verifikator */}
          <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-3">
            <span>
              Verifikator: <strong className="text-gray-800 dark:text-gray-200">{currentUser.name}</strong> ({currentUser.code})
            </span>
            <span>Tanggal: {todayStr}</span>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan Keputusan
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
