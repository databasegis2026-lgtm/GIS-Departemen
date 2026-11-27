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

export interface TopographyBlock {
  id: string;
  blok: string;
  estate: string;
  afdeling: string;
  region: "REGION 1" | "REGION 2" | "REGION 3";
  luas_blok_ha: number;
  elevasi_min_m: number;
  elevasi_max_m: number;
  elevasi_rata_m: number;
  kelerengan_pct: number;
  kelas_lereng: "Datar (0° - 8°)" | "Bergelombang (8° - 25°)" | "Curam (> 25°)";
  sph_rekomendasi: number;
  rekomendasi_konservasi: string;
  panjang_teras_kontur_m: number;
  jumlah_rorak_air: number;
  status_kesesuaian_lahan: "Sesuai (S1)" | "Sesuai Bersyarat (S2)" | "Tidak Sesuai / HCV (N)";
}

const STORAGE_KEY = "topografi";

export default function TopografiPage() {
  const [blocks, setBlocks] = useState<TopographyBlock[]>([]);
  const [afdelingFilter, setAfdelingFilter] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedBlock, setSelectedBlock] = useState<TopographyBlock | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingBlock, setEditingBlock] = useState<TopographyBlock | null>(null);
  const [deleteConfirmBlock, setDeleteConfirmBlock] = useState<TopographyBlock | null>(null);
  const [uploadedShpFile, setUploadedShpFile] = useState<File | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Form states
  const [formData, setFormData] = useState<Partial<TopographyBlock>>({
    blok: "",
    estate: "BUM 1",
    afdeling: "OA",
    region: "REGION 1",
    luas_blok_ha: 25.0,
    elevasi_min_m: 15,
    elevasi_max_m: 35,
    elevasi_rata_m: 24,
    kelerengan_pct: 6.5,
    kelas_lereng: "Datar (0° - 8°)",
    sph_rekomendasi: 148,
    rekomendasi_konservasi: "Pola tanam segitiga sama sisi standar, rorak air pada ujung pasar rintis",
    panjang_teras_kontur_m: 0,
    jumlah_rorak_air: 12,
    status_kesesuaian_lahan: "Sesuai (S1)",
  });

  // Load from IndexedDB
  useEffect(() => {
    async function loadData() {
      try {
        const cached = await dbGet<TopographyBlock[]>(STORAGE_KEY);
        if (cached && Array.isArray(cached) && cached.length > 0) {
          setBlocks(cached);
        }
      } catch (err) {
        console.error("Gagal membaca IndexedDB:", err);
      }
    }
    loadData();
  }, []);

  const saveToStorage = async (data: TopographyBlock[]) => {
    setBlocks(data);
    await dbSet(STORAGE_KEY, data);
  };

  // Unique Afdeling list
  const availableAfdelings = useMemo(() => {
    const setAfd = new Set<string>();
    blocks.forEach((b) => {
      if (b.afdeling && b.afdeling.trim() !== "") setAfd.add(b.afdeling.trim());
    });
    return Array.from(setAfd).sort();
  }, [blocks]);

  // Filtering
  const filteredBlocks = useMemo(() => {
    return blocks.filter((item) => {
      if (afdelingFilter !== "Semua" && item.afdeling !== afdelingFilter) return false;
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        return (
          item.blok.toLowerCase().includes(query) ||
          item.estate.toLowerCase().includes(query) ||
          item.afdeling.toLowerCase().includes(query) ||
          item.kelas_lereng.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [blocks, afdelingFilter, searchQuery]);

  // Pagination calculation
  const totalItems = filteredBlocks.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBlocks.slice(start, start + pageSize);
  }, [filteredBlocks, currentPage, pageSize]);

  // Reset page saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [afdelingFilter, searchQuery, pageSize]);

  // CRUD Handlers
  const handleOpenAdd = () => {
    setEditingBlock(null);
    setFormData({
      blok: "",
      estate: "BUM 1",
      afdeling: availableAfdelings[0] || "OA",
      region: "REGION 1",
      luas_blok_ha: 25.0,
      elevasi_min_m: 15,
      elevasi_max_m: 35,
      elevasi_rata_m: 24,
      kelerengan_pct: 5.0,
      kelas_lereng: "Datar (0° - 8°)",
      sph_rekomendasi: 148,
      rekomendasi_konservasi: "Lahan datar optimal, pola tanam baku 148 pkk/Ha",
      panjang_teras_kontur_m: 0,
      jumlah_rorak_air: 10,
      status_kesesuaian_lahan: "Sesuai (S1)",
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (item: TopographyBlock) => {
    setEditingBlock(item);
    setFormData({ ...item });
    setShowFormModal(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.blok) {
      alert("Kode blok wajib diisi!");
      return;
    }

    if (editingBlock) {
      const updated = blocks.map((b) =>
        b.id === editingBlock.id ? ({ ...b, ...formData } as TopographyBlock) : b
      );
      await saveToStorage(updated);
    } else {
      const newItem: TopographyBlock = {
        id: `topo-${Date.now()}`,
        blok: formData.blok || "",
        estate: formData.estate || "BUM 1",
        afdeling: formData.afdeling || "OA",
        region: (formData.region as any) || "REGION 1",
        luas_blok_ha: Number(formData.luas_blok_ha) || 25,
        elevasi_min_m: Number(formData.elevasi_min_m) || 10,
        elevasi_max_m: Number(formData.elevasi_max_m) || 30,
        elevasi_rata_m: Number(formData.elevasi_rata_m) || 20,
        kelerengan_pct: Number(formData.kelerengan_pct) || 5,
        kelas_lereng: (formData.kelas_lereng as any) || "Datar (0° - 8°)",
        sph_rekomendasi: Number(formData.sph_rekomendasi) || 148,
        rekomendasi_konservasi: formData.rekomendasi_konservasi || "-",
        panjang_teras_kontur_m: Number(formData.panjang_teras_kontur_m) || 0,
        jumlah_rorak_air: Number(formData.jumlah_rorak_air) || 0,
        status_kesesuaian_lahan: (formData.status_kesesuaian_lahan as any) || "Sesuai (S1)",
      };
      await saveToStorage([newItem, ...blocks]);
    }
    setShowFormModal(false);
  };

  const handleDelete = async (id: string) => {
    const updated = blocks.filter((b) => b.id !== id);
    await saveToStorage(updated);
    setDeleteConfirmBlock(null);
  };

  const handleExportCSV = () => {
    if (filteredBlocks.length === 0) return alert("Tidak ada data untuk diekspor");
    const data = filteredBlocks.map((b, i) => ({
      No: i + 1,
      Blok: b.blok,
      Estate: b.estate,
      Afdeling: b.afdeling,
      Region: b.region,
      "Luas Blok (Ha)": b.luas_blok_ha,
      "Elevasi Min (m)": b.elevasi_min_m,
      "Elevasi Max (m)": b.elevasi_max_m,
      "Elevasi Rata (m)": b.elevasi_rata_m,
      "Kelerengan (%)": b.kelerengan_pct,
      "Kelas Lereng": b.kelas_lereng,
      "SPH Rekomendasi": b.sph_rekomendasi,
      "Teras Kontur (m)": b.panjang_teras_kontur_m,
      "Jumlah Rorak": b.jumlah_rorak_air,
      "Kesesuaian Lahan": b.status_kesesuaian_lahan,
    }));
    exportToCSV(data, `Data_Topografi_${afdelingFilter}`);
  };

  const handleExportExcel = () => {
    if (filteredBlocks.length === 0) return alert("Tidak ada data untuk diekspor");
    const data = filteredBlocks.map((b, i) => ({
      No: i + 1,
      Blok: b.blok,
      Estate: b.estate,
      Afdeling: b.afdeling,
      Region: b.region,
      "Luas Blok (Ha)": b.luas_blok_ha,
      "Elevasi Min (m)": b.elevasi_min_m,
      "Elevasi Max (m)": b.elevasi_max_m,
      "Elevasi Rata (m)": b.elevasi_rata_m,
      "Kelerengan (%)": b.kelerengan_pct,
      "Kelas Lereng": b.kelas_lereng,
      "SPH Rekomendasi": b.sph_rekomendasi,
      "Teras Kontur (m)": b.panjang_teras_kontur_m,
      "Jumlah Rorak": b.jumlah_rorak_air,
      "Kesesuaian Lahan": b.status_kesesuaian_lahan,
    }));
    exportToExcel(data, `Data_Topografi_${afdelingFilter}`, "Topografi & Elevasi");
  };

  const handleUploadSimulate = async () => {
    if (!uploadedShpFile) return;
    const baseName = uploadedShpFile.name.replace(/\.[^/.]+$/, "").toUpperCase();
    const mockCreated: TopographyBlock = {
      id: `topo-upl-${Date.now()}`,
      blok: baseName.slice(0, 4) || "K01",
      estate: "BUM 1",
      afdeling: "OA",
      region: "REGION 1",
      luas_blok_ha: 26.5,
      elevasi_min_m: 18,
      elevasi_max_m: 42,
      elevasi_rata_m: 30,
      kelerengan_pct: 12.0,
      kelas_lereng: "Bergelombang (8° - 25°)",
      sph_rekomendasi: 136,
      rekomendasi_konservasi: "Pembuatan teras kontur bersambung lebar 3.5m",
      panjang_teras_kontur_m: 2400,
      jumlah_rorak_air: 18,
      status_kesesuaian_lahan: "Sesuai Bersyarat (S2)",
    };
    await saveToStorage([mockCreated, ...blocks]);
    setShowUploadModal(false);
    setUploadedShpFile(null);
    alert(`Berkas kontur ${uploadedShpFile.name} berhasil diproses.`);
  };

  return (
    <>
      <PageMeta
        title="Aset Topografi & Elevasi Lahan | PT BUM - BSL"
        description="Analisis spasial kontur elevasi, kelas kelerengan, teras kontur, dan standar SPH"
      />

      <div className="space-y-4">
        <PageBreadcrumb pageTitle="Topografi & Elevasi" />

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
                placeholder="Cari kode blok, estate, afdeling, kelas lereng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-xs text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Filter Afdeling */}
            {availableAfdelings.length > 0 && (
              <div className="w-full sm:w-44 shrink-0">
                <select
                  value={afdelingFilter}
                  onChange={(e) => setAfdelingFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="Semua">Semua Afdeling</option>
                  {availableAfdelings.map((afd) => (
                    <option key={afd} value={afd}>
                      Afdeling {afd}
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
              Unggah Kontur
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
              Tambah Blok
            </button>
          </div>
        </div>

        {/* Topography Table Standar Baku */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50/90 text-gray-600 font-semibold uppercase tracking-wider dark:border-gray-800 dark:bg-gray-800/80 dark:text-gray-300">
                <tr>
                  <th className="px-3.5 py-3 text-center w-12">No</th>
                  <th className="px-4 py-3">Blok & Lokasi</th>
                  <th className="px-4 py-3 text-right">Luas (Ha)</th>
                  <th className="px-4 py-3 text-right">Elevasi Rata (Min - Max)</th>
                  <th className="px-4 py-3 text-right">Kelerengan</th>
                  <th className="px-4 py-3">Kelas Kelerengan</th>
                  <th className="px-4 py-3 text-center">SPH Rekomendasi</th>
                  <th className="px-4 py-3 text-right">Teras Kontur</th>
                  <th className="px-4 py-3">Kesesuaian Lahan</th>
                  <th className="px-4 py-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-xs text-gray-400">
                      {searchQuery
                        ? "Tidak ada data topografi yang sesuai dengan pencarian."
                        : "Belum ada data topografi & kelerengan. Silakan unggah berkas kontur/DEM atau tambah manual."}
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
                          <div className="font-bold text-gray-900 dark:text-white">
                            Blok {item.blok}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {item.estate} • Afdeling {item.afdeling}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {item.luas_blok_ha.toFixed(1)} Ha
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {item.elevasi_rata_m} m dpl
                          </div>
                          <div className="text-[10px] text-gray-400">
                            ({item.elevasi_min_m} - {item.elevasi_max_m} m)
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                          {item.kelerengan_pct}%
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              item.kelas_lereng.startsWith("Datar")
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : item.kelas_lereng.startsWith("Bergelombang")
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                            }`}
                          >
                            {item.kelas_lereng}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.sph_rekomendasi > 0 ? (
                            <span className="font-bold text-gray-900 dark:text-white">
                              {item.sph_rekomendasi} pkk/Ha
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-red-600 dark:text-red-400">
                              0 (HCV)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {item.panjang_teras_kontur_m > 0
                            ? `${item.panjang_teras_kontur_m.toLocaleString("id-ID")} m`
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              item.status_kesesuaian_lahan.startsWith("Sesuai (S1)")
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                                : item.status_kesesuaian_lahan.startsWith("Sesuai Bersyarat")
                                ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                                : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                            }`}
                          >
                            {item.status_kesesuaian_lahan}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedBlock(item)}
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
                              onClick={() => setDeleteConfirmBlock(item)}
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
                dari <strong className="text-gray-800 dark:text-gray-200">{totalItems}</strong> blok
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

      {/* Topography Detail Modal */}
      {selectedBlock && (
        <Dialog open={!!selectedBlock} onOpenChange={() => setSelectedBlock(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Karakteristik Topografi Blok {selectedBlock.blok}</DialogTitle>
              <DialogDescription>
                Rekomendasi teknis agronomi dan konservasi mekanis lereng
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/40">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Blok & Lokasi:</span>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedBlock.blok} - {selectedBlock.estate} ({selectedBlock.afdeling})
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Klasifikasi Lereng:</span>
                  <p className="font-bold text-gray-900 dark:text-white">{selectedBlock.kelas_lereng}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Elevasi Min - Max:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedBlock.elevasi_min_m} m s.d. {selectedBlock.elevasi_max_m} m dpl (Rata-rata {selectedBlock.elevasi_rata_m} m)
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Standar Kerapatan Pokok:</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedBlock.sph_rekomendasi > 0 ? `${selectedBlock.sph_rekomendasi} Pokok / Hektar` : "Dilarang Tanam (HCV)"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Konservasi Mekanis Teras:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedBlock.panjang_teras_kontur_m > 0 ? `${selectedBlock.panjang_teras_kontur_m} Meter Teras Kontur` : "Tidak Diperlukan (Lahan Datar)"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Bangunan Rorak Resapan:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedBlock.jumlah_rorak_air} Unit Rorak</p>
                </div>
              </div>

              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Rekomendasi Agronomi & Konservasi:</span>
                <p className="mt-1 text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 p-2.5 rounded border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                  {selectedBlock.rekomendasi_konservasi}
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
              <DialogTitle>{editingBlock ? "Edit Blok Topografi" : "Tambah Blok Topografi"}</DialogTitle>
              <DialogDescription>
                Masukkan data elevasi dan kelerengan blok
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveForm} className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kode Blok *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.blok || ""}
                    onChange={(e) => setFormData({ ...formData, blok: e.target.value })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estate
                  </label>
                  <input
                    type="text"
                    value={formData.estate || ""}
                    onChange={(e) => setFormData({ ...formData, estate: e.target.value })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Afdeling
                  </label>
                  <input
                    type="text"
                    value={formData.afdeling || ""}
                    onChange={(e) => setFormData({ ...formData, afdeling: e.target.value })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Luas (Ha)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.luas_blok_ha || 0}
                    onChange={(e) => setFormData({ ...formData, luas_blok_ha: Number(e.target.value) })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kelerengan (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.kelerengan_pct || 0}
                    onChange={(e) => setFormData({ ...formData, kelerengan_pct: Number(e.target.value) })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kelas Lereng
                  </label>
                  <select
                    value={formData.kelas_lereng || "Datar (0° - 8°)"}
                    onChange={(e) => setFormData({ ...formData, kelas_lereng: e.target.value as any })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="Datar (0° - 8°)">Datar (0° - 8°)</option>
                    <option value="Bergelombang (8° - 25°)">Bergelombang (8° - 25°)</option>
                    <option value="Curam (> 25°)">Curam (&gt; 25°)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Elevasi Min (m)
                  </label>
                  <input
                    type="number"
                    value={formData.elevasi_min_m || 0}
                    onChange={(e) => setFormData({ ...formData, elevasi_min_m: Number(e.target.value) })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Elevasi Max (m)
                  </label>
                  <input
                    type="number"
                    value={formData.elevasi_max_m || 0}
                    onChange={(e) => setFormData({ ...formData, elevasi_max_m: Number(e.target.value) })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Elevasi Rata (m)
                  </label>
                  <input
                    type="number"
                    value={formData.elevasi_rata_m || 0}
                    onChange={(e) => setFormData({ ...formData, elevasi_rata_m: Number(e.target.value) })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    SPH Rekomendasi
                  </label>
                  <input
                    type="number"
                    value={formData.sph_rekomendasi || 0}
                    onChange={(e) => setFormData({ ...formData, sph_rekomendasi: Number(e.target.value) })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Teras Kontur (m)
                  </label>
                  <input
                    type="number"
                    value={formData.panjang_teras_kontur_m || 0}
                    onChange={(e) => setFormData({ ...formData, panjang_teras_kontur_m: Number(e.target.value) })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rekomendasi Agronomi / Konservasi
                </label>
                <textarea
                  rows={2}
                  value={formData.rekomendasi_konservasi || ""}
                  onChange={(e) => setFormData({ ...formData, rekomendasi_konservasi: e.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
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
      {deleteConfirmBlock && (
        <Dialog open={!!deleteConfirmBlock} onOpenChange={() => setDeleteConfirmBlock(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-red-600">Konfirmasi Hapus</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menghapus data topografi Blok <strong>{deleteConfirmBlock.blok}</strong>? Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmBlock(null)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmBlock.id)}
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
              <DialogTitle>Unggah SHP Kontur / Model Elevasi Digital (DEM)</DialogTitle>
              <DialogDescription>
                Unggah berkas kontur garis (.zip) interval 1m koordinat UTM 49S
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
                      Pilih berkas ZIP / SHP Kontur
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
