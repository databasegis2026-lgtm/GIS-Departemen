import { useState } from "react";
import type { AktivitasType } from "../types";
import { DEFAULT_ESTATES } from "../mock-operasional";

interface SpatialUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (fileName: string, targetAktivitas: string, estate: string) => void;
  currentAktivitas: AktivitasType;
}

export default function SpatialUploadModal({
  isOpen,
  onClose,
  onSuccess,
  currentAktivitas,
}: SpatialUploadModalProps) {
  if (!isOpen) return null;

  const [selectedFile, setSelectedFile] = useState<string>("Master_Blok_Realisasi_Q1.zip");
  const [targetAktivitas, setTargetAktivitas] = useState<string>(
    currentAktivitas === "all" ? "pruning" : currentAktivitas
  );
  const [estate, setEstate] = useState("BUM 1");
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedFile.trim()) {
      setErrorMsg("Pilih berkas spasial yang valid (.zip shapefile atau .geojson).");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess(selectedFile, targetAktivitas, estate);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="flex flex-col w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <svg className="size-4 text-sky-600 dark:text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              <span>Unggah Data Spasial</span>
            </h2>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Format didukung: Shapefile terkompresi (.zip), GeoJSON, atau KML
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

        {/* Form Body */}
        <form onSubmit={handleUpload} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Area Dropzone Berkas */}
          <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-5 text-center dark:border-slate-700 dark:bg-slate-800/40">
            <svg className="size-8 mx-auto text-sky-500 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              {selectedFile ? (
                <span className="text-sky-600 dark:text-sky-400 font-mono">{selectedFile}</span>
              ) : (
                "Pilih atau seret berkas spasial ke sini"
              )}
            </div>
            <div className="text-[10.5px] text-slate-400 mt-1">
              Wajib memuat kolom atribut: <code>BLOK</code>, <code>LUAS_HA</code>, <code>STATUS</code>
            </div>
            <div className="mt-3 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedFile("Master_Blok_Realisasi_Q1.zip")}
                className="rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
              >
                Gunakan Contoh SHP (.zip)
              </button>
              <button
                type="button"
                onClick={() => setSelectedFile("polygon_realisasi_lapangan.geojson")}
                className="rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
              >
                Gunakan GeoJSON
              </button>
            </div>
          </div>

          {/* Opsi Target Layer & Estate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Aktivitas
              </label>
              <select
                value={targetAktivitas}
                onChange={(e) => setTargetAktivitas(e.target.value)}
                className="h-8.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer font-medium"
              >
                <option value="pruning">Pruning (Penunasan)</option>
                <option value="semprot">Semprot (Pengendalian Gulma)</option>
                <option value="pemupukan">Pemupukan</option>
                <option value="pasar_pikul">Pasar Pikul</option>
                <option value="jangkos">Jangkos</option>
                <option value="produksi">Produksi (Panen TBS)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Estate
              </label>
              <select
                value={estate}
                onChange={(e) => setEstate(e.target.value)}
                className="h-8.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                {DEFAULT_ESTATES.map((est) => (
                  <option key={est} value={est}>
                    {est}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Checkbox timpa record */}
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span className="text-[11.5px]">Perbarui poligon blok yang sudah ada jika kode blok cocok</span>
          </label>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isProcessing ? "Memproses Unggahan..." : "Unggah & Sinkronkan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
