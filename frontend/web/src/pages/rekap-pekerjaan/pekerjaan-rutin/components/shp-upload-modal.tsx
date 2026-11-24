import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ShpUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (uploadedFile: File) => void;
  targetBlok?: string;
}

export default function ShpUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  targetBlok = "A05",
}: ShpUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg("");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setErrorMsg("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Silakan pilih berkas SHP lapangan terlebih dahulu.");
      return;
    }

    onUploadSuccess(file);
    setFile(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 shadow-xl rounded-2xl p-6">
        <DialogHeader className="border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </span>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                Unggah Berkas SHP Lapangan {targetBlok ? `(Blok ${targetBlok})` : ""}
              </DialogTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pilih file Shapefile (.zip) atau GeoJSON hasil pelacakan lapangan
              </p>
            </div>
          </div>
        </DialogHeader>

        {errorMsg && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-600 dark:bg-red-950/40 dark:border-red-900 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Pure Drag and Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isDragging
              ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
              : "border-gray-300 hover:border-gray-400 bg-gray-50/50 dark:border-gray-700 dark:hover:border-gray-600 dark:bg-gray-800/30"
              }`}
          >
            <input
              type="file"
              accept=".zip,.shp,.geojson,.kml,.json"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
            <svg
              className={`size-10 mx-auto mb-3 transition-colors ${file ? "text-emerald-500" : "text-gray-400 dark:text-gray-500"
                }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>

            {file ? (
              <div className="space-y-1">
                <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 block truncate max-w-xs mx-auto">
                  {file.name}
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Ukuran: {(file.size / 1024).toFixed(1)} KB &bull; Siap dimuat ke Peta Draf
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="font-semibold text-xs text-gray-700 dark:text-gray-200 block">
                  Klik untuk jelajah berkas atau tarik ke sini
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block">
                  Format didukung: Shapefile (.zip), GeoJSON (.geojson), atau KML (.kml)
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!file}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Unggah SHP</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
