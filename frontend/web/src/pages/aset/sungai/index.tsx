import { useState, useMemo, useEffect } from "react";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { dbGet, dbSet } from "@/lib/indexed-db";
import { exportToCSV, exportToExcel } from "@/utils/gis-export";

export interface RiverSegment {
  id: string;
  id_sungai: string;
  nama_sungai: string;
  tipe_aliran: "Sungai Utama" | "Anak Sungai" | "Parit Alami Primer";
  estate_lintasan: string;
  region: "REGION 1" | "REGION 2" | "REGION 3";
  lebar_sungai_m: number;
  buffer_wajib_m: number;
  total_panjang_km: number;
  luas_buffer_ha: number;
  titik_jembatan_cross: number;
  debit_kategori: "Kapasitas Tinggi" | "Kapasitas Sedang" | "Musiman (Pasang-Surut)";
  status_lindung: "Kawasan Konservasi Riparian (HCV)" | "Buffer Lindung Terpancang";
}

const STORAGE_KEY = "sungai";

export default function SungaiPage() {
  const [rivers, setRivers] = useState<RiverSegment[]>([]);
  const [estateFilter, setEstateFilter] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRiver, setSelectedRiver] = useState<RiverSegment | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingRiver, setEditingRiver] = useState<RiverSegment | null>(null);
  const [deleteConfirmRiver, setDeleteConfirmRiver] = useState<RiverSegment | null>(null);
  const [uploadedShpFile, setUploadedShpFile] = useState<File | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Form states
  const [formData, setFormData] = useState<Partial<RiverSegment>>({
    id_sungai: "",
    nama_sungai: "",
    tipe_aliran: "Sungai Utama",
    estate_lintasan: "BUM 1",
    region: "REGION 1",
    lebar_sungai_m: 25,
    buffer_wajib_m: 100,
    total_panjang_km: 5.5,
    luas_buffer_ha: 110,
    titik_jembatan_cross: 2,
    debit_kategori: "Kapasitas Tinggi",
    status_lindung: "Kawasan Konservasi Riparian (HCV)",
  });

  // Load from IndexedDB
  useEffect(() => {
    async function loadData() {
      try {
        const cached = await dbGet<RiverSegment[]>(STORAGE_KEY);
        if (cached && Array.isArray(cached) && cached.length > 0) {
          setRivers(cached);
        }
      } catch (err) {
        console.error("Gagal membaca IndexedDB:", err);
      }
    }
    loadData();
  }, []);

  const saveToStorage = async (data: RiverSegment[]) => {
    setRivers(data);
    await dbSet(STORAGE_KEY, data);
  };

  // Unique estates
  const availableEstates = useMemo(() => {
    const setEst = new Set<string>();
    rivers.forEach((r) => {
      if (r.estate_lintasan && r.estate_lintasan.trim() !== "") setEst.add(r.estate_lintasan.trim());
    });
    return Array.from(setEst).sort();
  }, [rivers]);

  // Filtering
  const filteredRivers = useMemo(() => {
    return rivers.filter((item) => {
      if (estateFilter !== "Semua" && item.estate_lintasan !== estateFilter) return false;
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        return (
          item.nama_sungai.toLowerCase().includes(query) ||
          item.id_sungai.toLowerCase().includes(query) ||
          item.estate_lintasan.toLowerCase().includes(query) ||
          item.tipe_aliran.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [rivers, estateFilter, searchQuery]);

  // Pagination calculation
  const totalItems = filteredRivers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRivers.slice(start, start + pageSize);
  }, [filteredRivers, currentPage, pageSize]);

  // Reset page saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [estateFilter, searchQuery, pageSize]);

  // CRUD Handlers
  const handleOpenAdd = () => {
    setEditingRiver(null);
    setFormData({
      id_sungai: `SNG-${Date.now().toString().slice(-4)}`,
      nama_sungai: "",
      tipe_aliran: "Sungai Utama",
      estate_lintasan: availableEstates[0] || "BUM 1",
      region: "REGION 1",
      lebar_sungai_m: 25,
      buffer_wajib_m: 100,
      total_panjang_km: 5.0,
      luas_buffer_ha: 100,
      titik_jembatan_cross: 1,
      debit_kategori: "Kapasitas Tinggi",
      status_lindung: "Kawasan Konservasi Riparian (HCV)",
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (item: RiverSegment) => {
    setEditingRiver(item);
    setFormData({ ...item });
    setShowFormModal(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_sungai) {
      alert("Nama sungai wajib diisi!");
      return;
    }

    if (editingRiver) {
      const updated = rivers.map((r) =>
        r.id === editingRiver.id ? ({ ...r, ...formData } as RiverSegment) : r
      );
      await saveToStorage(updated);
    } else {
      const newItem: RiverSegment = {
        id: `riv-${Date.now()}`,
        id_sungai: formData.id_sungai || `SNG-${Date.now().toString().slice(-4)}`,
        nama_sungai: formData.nama_sungai || "",
        tipe_aliran: (formData.tipe_aliran as any) || "Sungai Utama",
        estate_lintasan: formData.estate_lintasan || "BUM 1",
        region: (formData.region as any) || "REGION 1",
        lebar_sungai_m: Number(formData.lebar_sungai_m) || 20,
        buffer_wajib_m: Number(formData.buffer_wajib_m) || 100,
        total_panjang_km: Number(formData.total_panjang_km) || 1,
        luas_buffer_ha: Number(formData.luas_buffer_ha) || 10,
        titik_jembatan_cross: Number(formData.titik_jembatan_cross) || 0,
        debit_kategori: (formData.debit_kategori as any) || "Kapasitas Tinggi",
        status_lindung: (formData.status_lindung as any) || "Kawasan Konservasi Riparian (HCV)",
      };
      await saveToStorage([newItem, ...rivers]);
    }
    setShowFormModal(false);
  };

  const handleDelete = async (id: string) => {
    const updated = rivers.filter((r) => r.id !== id);
    await saveToStorage(updated);
    setDeleteConfirmRiver(null);
  };

  const handleExportCSV = () => {
    if (filteredRivers.length === 0) return alert("Tidak ada data untuk diekspor");
    const data = filteredRivers.map((r, i) => ({
      No: i + 1,
      "Kode Sungai": r.id_sungai,
      "Nama Sungai": r.nama_sungai,
      "Tipe Aliran": r.tipe_aliran,
      Estate: r.estate_lintasan,
      Region: r.region,
      "Lebar Sungai (m)": r.lebar_sungai_m,
      "Buffer Wajib (m)": r.buffer_wajib_m,
      "Panjang (km)": r.total_panjang_km,
      "Luas Buffer (Ha)": r.luas_buffer_ha,
      "Jembatan (Titik)": r.titik_jembatan_cross,
      "Status Lindung": r.status_lindung,
    }));
    exportToCSV(data, `Data_Sungai_${estateFilter}`);
  };

  const handleExportExcel = () => {
    if (filteredRivers.length === 0) return alert("Tidak ada data untuk diekspor");
    const data = filteredRivers.map((r, i) => ({
      No: i + 1,
      "Kode Sungai": r.id_sungai,
      "Nama Sungai": r.nama_sungai,
      "Tipe Aliran": r.tipe_aliran,
      Estate: r.estate_lintasan,
      Region: r.region,
      "Lebar Sungai (m)": r.lebar_sungai_m,
      "Buffer Wajib (m)": r.buffer_wajib_m,
      "Panjang (km)": r.total_panjang_km,
      "Luas Buffer (Ha)": r.luas_buffer_ha,
      "Jembatan (Titik)": r.titik_jembatan_cross,
      "Status Lindung": r.status_lindung,
    }));
    exportToExcel(data, `Data_Sungai_${estateFilter}`, "Sungai & Buffer");
  };

  const handleUploadSimulate = async () => {
    if (!uploadedShpFile) return;
    // Mock parse shp
    const mockCreated: RiverSegment = {
      id: `riv-upl-${Date.now()}`,
      id_sungai: `SNG-${Math.floor(100 + Math.random() * 900)}`,
      nama_sungai: uploadedShpFile.name.replace(/\.[^/.]+$/, ""),
      tipe_aliran: "Sungai Utama",
      estate_lintasan: "BUM 1",
      region: "REGION 1",
      lebar_sungai_m: 35,
      buffer_wajib_m: 100,
      total_panjang_km: 12.4,
      luas_buffer_ha: 248,
      titik_jembatan_cross: 4,
      debit_kategori: "Kapasitas Tinggi",
      status_lindung: "Kawasan Konservasi Riparian (HCV)",
    };
    await saveToStorage([mockCreated, ...rivers]);
    setShowUploadModal(false);
    setUploadedShpFile(null);
    alert(`Berkas ${uploadedShpFile.name} berhasil diproses dan disimpan.`);
  };

  return (
    <>
      <PageMeta
        title="Aset Sungai & Sempadan Air | PT BUM - BSL"
        description="Monitoring spasial sungai utama holding, segmen aliran, buffer sempadan, dan jembatan kebun"
      />

      <div className="space-y-4">
        <PageBreadcrumb pageTitle="Sungai & Sempadan" />

        {/* Action & Filter Toolbar Terpadu Standar Pokok Sawit */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Single Search Bar */}
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Cari kode, nama sungai, tipe aliran, estate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-xs text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Filter Estate */}
            {availableEstates.length > 0 && (
              <div className="w-full sm:w-44 shrink-0">
                <select
                  value={estateFilter}
                  onChange={(e) => setEstateFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="Semua">Semua Estate</option>
                  {availableEstates.map((est) => (
                    <option key={est} value={est}>
                      Estate {est}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Unduh Export */}
            <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-50 dark:bg-gray-800">
              <button
                type="button"
                onClick={handleExportCSV}
                title="Ekspor CSV"
                className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-white dark:text-gray-300 dark:hover:bg-gray-700 transition cursor-pointer"
              >
                CSV
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                title="Ekspor Excel"
                className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-white dark:text-emerald-400 dark:hover:bg-gray-700 transition cursor-pointer"
              >
                Excel
              </button>
            </div>

            {/* Unggah SHP */}
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer shadow-2xs transition"
            >
              <svg className="size-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              Unggah SHP
            </button>

            {/* Tambah Manual */}
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-2xs transition cursor-pointer"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Tambah Sungai
            </button>
          </div>
        </div>

        {/* Rivers Table Standar Baku */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50/90 text-gray-600 font-semibold uppercase tracking-wider dark:border-gray-800 dark:bg-gray-800/80 dark:text-gray-300">
                <tr>
                  <th className="px-3.5 py-3 text-center w-12">No</th>
                  <th className="px-4 py-3">Kode & Nama Sungai</th>
                  <th className="px-4 py-3">Tipe Aliran</th>
                  <th className="px-4 py-3">Estate / Region</th>
                  <th className="px-4 py-3 text-right">Lebar (m)</th>
                  <th className="px-4 py-3 text-right">Buffer Wajib</th>
                  <th className="px-4 py-3 text-right">Panjang (km)</th>
                  <th className="px-4 py-3 text-right">Luas Buffer (Ha)</th>
                  <th className="px-4 py-3 text-center">Jembatan</th>
                  <th className="px-4 py-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-xs text-gray-400">
                      {searchQuery
                        ? "Tidak ada data sungai yang sesuai dengan pencarian."
                        : "Belum ada data segmen sungai. Silakan unggah berkas SHP Sungai atau tambah manual."}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, idx) => {
                    const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition">
                        <td className="px-3.5 py-3 text-center text-gray-400 font-medium">
                          {rowNumber}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {item.nama_sungai}
                          </div>
                          <div className="font-mono text-[11px] text-gray-500">
                            {item.id_sungai}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.tipe_aliran === "Sungai Utama"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                              : "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300"
                              }`}
                          >
                            {item.tipe_aliran}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {item.estate_lintasan}
                          </div>
                          <div className="text-[11px] text-gray-400">{item.region}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {item.lebar_sungai_m} m
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-amber-600 dark:text-amber-400">
                          {item.buffer_wajib_m} m
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {item.total_panjang_km.toFixed(1)} km
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {item.luas_buffer_ha.toFixed(1)} Ha
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                            {item.titik_jembatan_cross}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedRiver(item)}
                              title="Lihat Detail"
                              className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-emerald-600 dark:hover:bg-gray-800 dark:hover:text-emerald-400 transition cursor-pointer"
                            >
                              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              title="Edit Data"
                              className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-800 dark:hover:text-blue-400 transition cursor-pointer"
                            >
                              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmRiver(item)}
                              title="Hapus Data"
                              className="rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition cursor-pointer"
                            >
                              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer Standar Pokok Sawit */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-800 gap-3 text-xs bg-gray-50/50 dark:bg-gray-800/40">
            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
              <span>
                Menampilkan{" "}
                <strong className="text-gray-800 dark:text-gray-200">
                  {totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0}
                </strong>{" "}
                -{" "}
                <strong className="text-gray-800 dark:text-gray-200">
                  {Math.min(currentPage * pageSize, totalItems)}
                </strong>{" "}
                dari <strong className="text-gray-800 dark:text-gray-200">{totalItems}</strong> entitas
              </span>
              <div className="flex items-center gap-1.5">
                <span>Baris:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer"
              >
                Sebelumnya
              </button>
              <span className="px-2 font-medium text-gray-600 dark:text-gray-400">
                Hal {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* River Detail Modal */}
      {selectedRiver && (
        <Dialog open={!!selectedRiver} onOpenChange={() => setSelectedRiver(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{selectedRiver.nama_sungai}</DialogTitle>
              <DialogDescription>
                Rincian zona perlindungan hidrologis, buffer riparian, dan aturan konservasi ISPO/RSPO
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/40">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Kode Registrasi Hidrologi:</span>
                  <p className="font-mono font-medium text-gray-900 dark:text-white">{selectedRiver.id_sungai}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Klasifikasi Aliran:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedRiver.tipe_aliran}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Lebar Sempadan Lindung:</span>
                  <p className="font-bold text-amber-600 dark:text-amber-400">{selectedRiver.buffer_wajib_m} Meter (Kiri & Kanan)</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Total Luas Area Konservasi:</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">{selectedRiver.luas_buffer_ha} Hektar</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Karakteristik Debit:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedRiver.debit_kategori}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Infrastruktur Crossing:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedRiver.titik_jembatan_cross} Jembatan / Box Culvert</p>
                </div>
              </div>

              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Ketentuan Hukum & SOP Lapangan:</span>
                <p className="mt-1 text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 p-2.5 rounded border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                  Zona sempadan sungai {selectedRiver.nama_sungai} mutlak berstatus <strong>UNPLANTABLE - HCV</strong>. Dilarang keras melakukan penanaman kelapa sawit baru, pembukaan lahan (land clearing), maupun aplikasi pestisida/herbisida dan pupuk anorganik di sepanjang koridor sempadan. Wajib dipasangi plang patok cat merah bertuliskan batas konservasi.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Form Tambah/Edit Modal */}
      {showFormModal && (
        <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingRiver ? "Edit Data Sungai" : "Tambah Data Segmen Sungai"}</DialogTitle>
              <DialogDescription>
                Masukkan atribut teknis hidrologi dan sempadan riparian
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveForm} className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kode Sungai *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.id_sungai || ""}
                    onChange={(e) => setFormData({ ...formData, id_sungai: e.target.value })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nama Sungai *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama_sungai || ""}
                    onChange={(e) => setFormData({ ...formData, nama_sungai: e.target.value })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipe Aliran
                  </label>
                  <select
                    value={formData.tipe_aliran || "Sungai Utama"}
                    onChange={(e) => setFormData({ ...formData, tipe_aliran: e.target.value as any })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="Sungai Utama">Sungai Utama (Buffer 100m)</option>
                    <option value="Anak Sungai">Anak Sungai (Buffer 50m)</option>
                    <option value="Parit Alami Primer">Parit Alami Primer (Buffer 50m)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estate Lintasan
                  </label>
                  <input
                    type="text"
                    value={formData.estate_lintasan || ""}
                    onChange={(e) => setFormData({ ...formData, estate_lintasan: e.target.value })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lebar (m)
                  </label>
                  <input
                    type="number"
                    value={formData.lebar_sungai_m || 0}
                    onChange={(e) => setFormData({ ...formData, lebar_sungai_m: Number(e.target.value) })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Buffer Wajib (m)
                  </label>
                  <input
                    type="number"
                    value={formData.buffer_wajib_m || 0}
                    onChange={(e) => setFormData({ ...formData, buffer_wajib_m: Number(e.target.value) })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Panjang (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.total_panjang_km || 0}
                    onChange={(e) => setFormData({ ...formData, total_panjang_km: Number(e.target.value) })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Luas Buffer (Ha)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.luas_buffer_ha || 0}
                    onChange={(e) => setFormData({ ...formData, luas_buffer_ha: Number(e.target.value) })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Jembatan Cross
                  </label>
                  <input
                    type="number"
                    value={formData.titik_jembatan_cross || 0}
                    onChange={(e) => setFormData({ ...formData, titik_jembatan_cross: Number(e.target.value) })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-2xs"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmRiver && (
        <Dialog open={!!deleteConfirmRiver} onOpenChange={() => setDeleteConfirmRiver(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-red-600">Konfirmasi Hapus</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menghapus segmen sungai <strong>{deleteConfirmRiver.nama_sungai}</strong> ({deleteConfirmRiver.id_sungai})? Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmRiver(null)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmRiver.id)}
                className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 shadow-2xs"
              >
                Hapus
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Upload SHP Modal */}
      {showUploadModal && (
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Unggah SHP Garis Sungai & Alur Air</DialogTitle>
              <DialogDescription>
                Unggah berkas polyline sungai (.zip) dengan sistem koordinat UTM 49S
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="flex justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 dark:border-gray-700">
                <div className="text-center">
                  <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <label className="cursor-pointer font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
                      Pilih berkas ZIP / SHP Sungai
                      <input
                        type="file"
                        className="sr-only"
                        accept=".zip,.shp,.dbf,.shx,.prj,.geojson,.kml,.kmz"
                        onChange={(e) => setUploadedShpFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                  {uploadedShpFile && (
                    <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {uploadedShpFile.name} (
                      {uploadedShpFile.size < 1024 * 1024
                        ? `${(uploadedShpFile.size / 1024).toFixed(1)} KB`
                        : `${(uploadedShpFile.size / (1024 * 1024)).toFixed(2)} MB`}
                      )
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!uploadedShpFile}
                  onClick={handleUploadSimulate}
                  className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Proses & Simpan
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
