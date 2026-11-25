import { useEffect, useState } from "react";

export interface BoundaryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (record: Record<string, any>) => void;
  columns: string[];
  initialData: Record<string, any> | null;
  levelName: string;
}

export default function BoundaryFormModal({
  isOpen,
  onClose,
  onSubmit,
  columns,
  initialData,
  levelName,
}: BoundaryFormModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const isEdit = Boolean(initialData);

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    } else {
      const empty: Record<string, any> = {};
      columns.forEach((col) => {
        empty[col] = "";
      });
      setFormData(empty);
    }
  }, [initialData, columns, isOpen]);

  if (!isOpen) return null;

  const handleChange = (column: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [column]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-lg max-h-[90vh] rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              {isEdit ? `Edit Data ${levelName}` : `Tambah Data ${levelName}`}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Isi atribut sesuai skema kolom baku {levelName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition cursor-pointer"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 space-y-3.5 overflow-y-auto max-h-[60vh]">
            {columns.map((col) => (
              <div key={col} className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 font-mono">
                  {col}
                </label>
                <input
                  type={col.toLowerCase().includes("luas") ? "number" : "text"}
                  step={col.toLowerCase().includes("luas") ? "0.01" : undefined}
                  value={formData[col] ?? ""}
                  onChange={(e) => handleChange(col, e.target.value)}
                  placeholder={`Masukkan ${col}...`}
                  required={col === columns[0]}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 placeholder-gray-400 shadow-theme-xs focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                />
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs"
            >
              {isEdit ? "Simpan Perubahan" : "Tambah Data"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
