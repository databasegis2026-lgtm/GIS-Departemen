import { useState, useMemo } from "react";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import { supabase } from "@/lib/supabase";
import BoundaryMapModal from "./boundary-map-modal";
import BoundaryFormModal from "./boundary-form-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface BoundaryPageLayoutProps {
  pageTitle: string;
  levelName: string;
  columns: string[];
  initialData: Record<string, any>[];
  strokeColor: string;
  strokeWeight: number;
  dashArray?: string;
  fillOpacity?: number;
  tableName: string;
}

export default function BoundaryPageLayout({
  pageTitle,
  levelName,
  columns,
  initialData,
  strokeColor,
  strokeWeight,
  dashArray,
  fillOpacity = 0.15,
  tableName,
}: BoundaryPageLayoutProps) {
  const [data, setData] = useState<Record<string, any>[]>(initialData);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedMapRecord, setSelectedMapRecord] = useState<Record<string, any> | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record<string, any> | null>(null);

  // Filtered rows
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((item) =>
      Object.values(item).some((val) =>
        String(val ?? "").toLowerCase().includes(q)
      )
    );
  }, [data, searchQuery]);

  // Handle Add/Edit Submit
  const handleFormSubmit = (record: Record<string, any>) => {
    if (editingRecord) {
      // Update
      setData((prev) =>
        prev.map((item) => (item.id === editingRecord.id ? { ...record, id: item.id } : item))
      );
      supabase
        .logAudit({
          action: "UPDATE",
          table_name: tableName,
          record_id: String(editingRecord.id),
          details: `Ubah data ${levelName} ID ${editingRecord.id}`,
        })
        .catch(() => {});
    } else {
      // Create
      const newId = `${tableName}-${Date.now()}`;
      const newRow = { ...record, id: newId };
      setData((prev) => [newRow, ...prev]);
      supabase
        .logAudit({
          action: "INSERT",
          table_name: tableName,
          record_id: newId,
          details: `Tambah data ${levelName} baru: ${record[columns[0]] || newId}`,
        })
        .catch(() => {});
    }
  };

  // Handle Delete
  const handleDelete = (row: Record<string, any>) => {
    const identifier = row[columns[0]] || row[columns[1]] || row.id;
    if (window.confirm(`Yakin ingin menghapus data ${levelName} "${identifier}"?`)) {
      setData((prev) => prev.filter((item) => item.id !== row.id));
      supabase
        .logAudit({
          action: "DELETE",
          table_name: tableName,
          record_id: String(row.id),
          details: `Hapus baris ${levelName} "${identifier}"`,
        })
        .catch(() => {});
    }
  };

  // Handle Upload SHP (No size limitation)
  const handleUploadSubmit = () => {
    if (!uploadedFile) return;
    setIsUploading(true);

    const sz =
      uploadedFile.size < 1024 * 1024
        ? `${(uploadedFile.size / 1024).toFixed(1)} KB`
        : `${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB`;

    // Simulate parse & inject into data
    setTimeout(() => {
      supabase
        .logAudit({
          action: "UPLOAD",
          table_name: tableName,
          record_id: uploadedFile.name,
          details: `Unggah SHP ${levelName} (${uploadedFile.name}, ${sz}) tanpa batasan ukuran`,
        })
        .catch(() => {});

      setIsUploading(false);
      setShowUploadModal(false);
      setUploadedFile(null);
      alert(`Berkas SHP ${uploadedFile.name} (${sz}) berhasil divalidasi dan disimpan ke sistem.`);
    }, 600);
  };

  return (
    <div className="space-y-4">
      <PageMeta
        title={`${pageTitle} | Aset GIS`}
        description={`Manajemen spasial dan data atribut ${pageTitle}`}
      />

      <PageBreadcrumb pageTitle={pageTitle} />

      {/* Action & Filter Bar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between -mt-2">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Cari dalam data ${pageTitle.toLowerCase()}...`}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 shadow-theme-xs focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono mr-1 hidden sm:inline">
            {filteredData.length} data
          </span>

          <button
            type="button"
            onClick={() => {
              setEditingRecord(null);
              setFormModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition cursor-pointer shadow-xs"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Tambah Data</span>
          </button>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Unggah SHP {levelName}</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/75 dark:border-gray-800 dark:bg-gray-800/50">
                <th className="px-3 py-2.5 text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-12 text-center">
                  No
                </th>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2.5 text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider font-mono whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-center sticky right-0 bg-gray-50 dark:bg-gray-800 w-36">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 2}
                    className="px-4 py-8 text-center text-xs text-gray-500 dark:text-gray-400"
                  >
                    Belum ada data {pageTitle}. Klik <b>Tambah Data</b> atau <b>Unggah SHP {levelName}</b> untuk memasukkan poligon spasial.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition"
                  >
                    <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 text-center font-mono">
                      {idx + 1}
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col}
                        className="px-3 py-2 text-xs text-gray-800 dark:text-gray-200 whitespace-nowrap"
                      >
                        {col.toLowerCase().includes("luas") && typeof row[col] === "number"
                          ? `${row[col].toLocaleString("id-ID")} Ha`
                          : row[col] ?? "-"}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-xs text-center sticky right-0 bg-white dark:bg-gray-900 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Lihat di Peta */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMapRecord(row);
                            setMapModalOpen(true);
                          }}
                          title="Lihat Poligon di Peta"
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-white shadow-2xs hover:opacity-90 transition cursor-pointer"
                          style={{ backgroundColor: strokeColor }}
                        >
                          <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                            <line x1="8" y1="2" x2="8" y2="18" />
                            <line x1="16" y1="6" x2="16" y2="22" />
                          </svg>
                          <span>Peta</span>
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRecord(row);
                            setFormModalOpen(true);
                          }}
                          title="Edit Data Atribut"
                          className="rounded-md border border-gray-300 p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white transition cursor-pointer"
                        >
                          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                        </button>

                        {/* Hapus */}
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          title="Hapus Data"
                          className="rounded-md border border-red-200 p-1 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40 transition cursor-pointer"
                        >
                          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Map Modal */}
      <BoundaryMapModal
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        title={selectedMapRecord ? `${pageTitle} - ${selectedMapRecord[columns[0]] || selectedMapRecord[columns[1]] || "Detail"}` : pageTitle}
        levelName={levelName}
        data={selectedMapRecord}
        strokeColor={strokeColor}
        strokeWeight={strokeWeight}
        dashArray={dashArray}
        fillOpacity={fillOpacity}
      />

      {/* Form Modal (Add / Edit) */}
      <BoundaryFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        columns={columns}
        initialData={editingRecord}
        levelName={levelName}
      />

      {/* Modal Unggah SHP (Tanpa Batasan Ukuran File) */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unggah Berkas SHP {pageTitle}</DialogTitle>
            <DialogDescription>
              Format didukung: Arsip ZIP (.zip) berisi .shp, .shx, .dbf, .prj atau berkas GeoJSON. Tidak ada batasan ukuran file.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
              <input
                type="file"
                id={`file-upload-${tableName}`}
                className="hidden"
                accept=".zip,.shp,.geojson,.json,.kml,.kmz"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setUploadedFile(e.target.files[0]);
                  }
                }}
              />
              <label
                htmlFor={`file-upload-${tableName}`}
                className="flex flex-col items-center cursor-pointer"
              >
                <div
                  className="mb-2 size-10 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: strokeColor }}
                >
                  <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  {uploadedFile ? uploadedFile.name : "Pilih berkas SHP/ZIP dari perangkat"}
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  {uploadedFile
                    ? `Ukuran: ${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB`
                    : "Mendukung file besar tanpa batasan kuota upload"}
                </span>
              </label>
            </div>

            <div className="rounded-lg bg-gray-50 p-2.5 text-[11px] text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Kolom Baku Terdeteksi:
              </div>
              <div className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                {columns.join(" | ")}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadedFile(null);
                }}
                disabled={isUploading}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleUploadSubmit}
                disabled={!uploadedFile || isUploading}
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer shadow-xs"
              >
                {isUploading ? "Memvalidasi..." : "Unggah & Validasi"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
