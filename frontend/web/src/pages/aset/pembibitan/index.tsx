import { useState, useMemo, useEffect } from "react";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import { getGisDataset, setGisDataset } from "@/lib/indexed-db";
import { exportToCSV, exportToExcel } from "@/utils/gis-export";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface NurseryBatch {
  id: string;
  batch_id: string;
  estate: string;
  afdeling: string;
  region: string;
  tahap: string;
  varietas: string;
  produsen_benih: string;
  bulan_semai: string;
  umur_bulan: number;
  jumlah_kecambah_diterima: number;
  bibit_hidup: number;
  bibit_siap_salur: number;
  bibit_afkir_culling: number;
  culling_rate_pct: number;
  sistem_irigasi: string;
  luas_area_ha: number;
  status: string;
}

const NURSERY_COLUMNS = [
  { key: "batch_id", label: "BATCH ID" },
  { key: "varietas", label: "VARIETAS" },
  { key: "produsen_benih", label: "PRODUSEN" },
  { key: "estate", label: "ESTATE" },
  { key: "afdeling", label: "AFDELING" },
  { key: "tahap", label: "TAHAP" },
  { key: "umur_bulan", label: "UMUR (BLN)" },
  { key: "bibit_hidup", label: "BIBIT HIDUP" },
  { key: "bibit_siap_salur", label: "SIAP SALUR" },
  { key: "culling_rate_pct", label: "CULLING (%)" },
  { key: "sistem_irigasi", label: "IRIGASI" },
  { key: "status", label: "STATUS" },
] as const;

export default function PembibitanPage() {
  const [data, setData] = useState<NurseryBatch[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAfdeling, setSelectedAfdeling] = useState("");
  const [pageSize, setPageSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("gis_page_size");
      if (saved) { const p = parseInt(saved, 10); if ([10, 25, 50, 100].includes(p)) return p; }
    } catch { }
    return 10;
  });
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedBatch, setSelectedBatch] = useState<NurseryBatch | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formRecord, setFormRecord] = useState<NurseryBatch | null>(null);
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<NurseryBatch | null>(null);

  // Muat data dari IndexedDB
  useEffect(() => {
    let isCancelled = false;
    const loadData = async () => {
      try {
        const cached = await getGisDataset<NurseryBatch[]>("pembibitan");
        if (!isCancelled && cached && Array.isArray(cached) && cached.length > 0) {
          setData(cached);
        }
      } catch (err) {
        console.warn("Gagal memuat dataset pembibitan:", err);
      }
    };
    loadData();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Daftar unik Afdeling
  const availableAfdelings = useMemo(() => {
    const setAfd = new Set<string>();
    data.forEach((d) => {
      const val = String(d.afdeling || "").trim();
      if (val && val !== "-") setAfd.add(val);
    });
    return Array.from(setAfd).sort();
  }, [data]);

  // Filter pencarian & afdeling
  const filteredBatches = useMemo(() => {
    let list = data;
    if (selectedAfdeling) {
      list = list.filter(
        (item) => String(item.afdeling || "").trim().toLowerCase() === selectedAfdeling.toLowerCase()
      );
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((item) => {
      return (
        String(item.batch_id || "").toLowerCase().includes(q) ||
        String(item.varietas || "").toLowerCase().includes(q) ||
        String(item.estate || "").toLowerCase().includes(q) ||
        String(item.afdeling || "").toLowerCase().includes(q) ||
        String(item.produsen_benih || "").toLowerCase().includes(q) ||
        String(item.status || "").toLowerCase().includes(q)
      );
    });
  }, [data, selectedAfdeling, searchQuery]);

  // Pagination
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedAfdeling, pageSize]);

  const totalItems = filteredBatches.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const startIdx = (validPage - 1) * pageSize;
    return filteredBatches.slice(startIdx, startIdx + pageSize);
  }, [filteredBatches, validPage, pageSize]);

  const startRecordNum = totalItems === 0 ? 0 : (validPage - 1) * pageSize + 1;
  const endRecordNum = Math.min(validPage * pageSize, totalItems);

  // Simpan form
  const handleSaveForm = async (formData: Record<string, any>) => {
    let nextData: NurseryBatch[] = [];
    if (formRecord?.id) {
      const updated = { ...formRecord, ...formData } as NurseryBatch;
      nextData = data.map((item) => (item.id === formRecord.id ? updated : item));
      setData(nextData);
      await setGisDataset("pembibitan", nextData);
    } else {
      const newRec: NurseryBatch = {
        id: "nursery-" + Date.now(),
        batch_id: formData.batch_id || `BATCH-${data.length + 1}`,
        estate: formData.estate || "BUM 1",
        afdeling: formData.afdeling || "OA",
        region: formData.region || "REGION 1",
        tahap: formData.tahap || "Main Nursery (3-12 Bulan)",
        varietas: formData.varietas || "DxP Dami Mas",
        produsen_benih: formData.produsen_benih || "PT Dami Mas Sejahtera",
        bulan_semai: formData.bulan_semai || "Januari 2026",
        umur_bulan: Number(formData.umur_bulan) || 6,
        jumlah_kecambah_diterima: Number(formData.jumlah_kecambah_diterima) || 10000,
        bibit_hidup: Number(formData.bibit_hidup) || 9400,
        bibit_siap_salur: Number(formData.bibit_siap_salur) || 8900,
        bibit_afkir_culling: Number(formData.bibit_afkir_culling) || 600,
        culling_rate_pct: Number(formData.culling_rate_pct) || 6.0,
        sistem_irigasi: formData.sistem_irigasi || "Sumisansui Otomatis",
        luas_area_ha: Number(formData.luas_area_ha) || 1.5,
        status: formData.status || "Siap Salur ke Lapangan",
      };
      nextData = [newRec, ...data];
      setData(nextData);
      await setGisDataset("pembibitan", nextData);
    }
    setShowFormModal(false);
    setFormRecord(null);
  };

  // Hapus batch
  const handleConfirmDelete = async () => {
    if (!deleteConfirmRecord) return;
    const targetId = deleteConfirmRecord.id;
    const nextData = data.filter((r) => r.id !== targetId);
    setData(nextData);
    await setGisDataset("pembibitan", nextData);
    setDeleteConfirmRecord(null);
  };

  // Ekspor CSV
  const handleExportCSV = () => {
    const afdSuffix = selectedAfdeling ? `_AFD_${selectedAfdeling}` : "";
    const filename = `Pembibitan_Sawit${afdSuffix}_${new Date().toISOString().slice(0, 10)}.csv`;
    exportToCSV(filename, NURSERY_COLUMNS as any, filteredBatches);
  };

  // Ekspor Excel
  const handleExportExcel = () => {
    const afdSuffix = selectedAfdeling ? `_AFD_${selectedAfdeling}` : "";
    const filename = `Pembibitan_Sawit${afdSuffix}_${new Date().toISOString().slice(0, 10)}.xls`;
    exportToExcel(filename, selectedAfdeling ? `AFD ${selectedAfdeling}` : "Nursery", NURSERY_COLUMNS as any, filteredBatches);
  };

  return (
    <div className="space-y-4">
      <PageMeta
        title="Aset Pembibitan Sawit (Nursery) | PT BUM"
        description="Monitoring batch pembibitan pre-nursery dan main nursery PT Bangkitgiat Usaha Mandiri"
      />

      <PageBreadcrumb pageTitle="Pembibitan Kelapa Sawit (Nursery)" />

      {/* Toolbar Pencarian & Filter Afdeling Terpadu */}
      <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 max-w-xl">
            {/* Input Pencarian Tunggal */}
            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Cari batch, varietas, estate, afdeling, status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-9 text-xs text-gray-900 placeholder-gray-400 shadow-theme-xs focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Afdeling */}
            <div className="min-w-[150px] sm:min-w-[175px]">
              <select
                value={selectedAfdeling}
                onChange={(e) => setSelectedAfdeling(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-xs font-semibold text-gray-800 shadow-theme-xs focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer"
              >
                <option value="">Semua Afdeling ({data.length.toLocaleString("id-ID")})</option>
                {availableAfdelings.map((afd) => (
                  <option key={afd} value={afd}>
                    Afdeling {afd}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFormRecord(null);
                setShowFormModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer"
            >
              + Tambah Batch
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredBatches.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
            >
              Ekspor CSV
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={filteredBatches.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 transition cursor-pointer"
            >
              Ekspor Excel
            </button>
          </div>
        </div>
      </div>

      {/* Tabel Data Pembibitan */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-white">
              Data Batch Pembibitan Kelapa Sawit ({totalItems} Data Terpilih)
            </h3>
          </div>

          <div className="flex items-center gap-2 mt-2 sm:mt-0 text-xs text-gray-500">
            <span>Tampilkan baris:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-800/60">
                <th className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300">No</th>
                <th className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Batch ID</th>
                <th className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Varietas</th>
                <th className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Lokasi</th>
                <th className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Tahap</th>
                <th className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 text-right whitespace-nowrap">Bibit Hidup</th>
                <th className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 text-right whitespace-nowrap">Siap Salur</th>
                <th className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 text-right whitespace-nowrap">Culling Rate</th>
                <th className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Irigasi</th>
                <th className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Status</th>
                <th className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-2xl">🌱</span>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Belum ada data batch pembibitan (nursery).
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setFormRecord(null);
                          setShowFormModal(true);
                        }}
                        className="mt-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                      >
                        + Tambah Data Batch
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50">
                    <td className="py-2 px-3 text-gray-400 font-mono">
                      {startRecordNum + idx}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                      {item.batch_id}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-semibold text-gray-900 dark:text-white">
                      <div>{item.varietas}</div>
                      <div className="text-[10px] text-gray-400 font-normal">{item.produsen_benih}</div>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div>{item.estate} • AFD {item.afdeling}</div>
                      <div className="text-[10px] text-gray-400">{item.region}</div>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div>{item.tahap}</div>
                      <div className="text-[10px] text-gray-400 font-mono">Umur {item.umur_bulan} Bulan</div>
                    </td>
                    <td className="py-2 px-3 text-right font-medium whitespace-nowrap">
                      {item.bibit_hidup.toLocaleString("id-ID")}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {item.bibit_siap_salur.toLocaleString("id-ID")}
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{item.culling_rate_pct}%</span>
                      <div className="text-[10px] text-gray-400">{item.bibit_afkir_culling.toLocaleString("id-ID")} afkir</div>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                        {item.sistem_irigasi}
                      </span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedBatch(item)}
                          className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                          title="Detail Batch"
                        >
                          📄
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormRecord(item);
                            setShowFormModal(true);
                          }}
                          className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmRecord(item)}
                          className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                          title="Hapus"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 px-4 py-2.5 dark:border-gray-800 text-xs text-gray-500 gap-2">
            <div>
              Menampilkan {startRecordNum} - {endRecordNum} dari total {totalItems} data
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent dark:border-gray-700 dark:hover:bg-gray-800 cursor-pointer"
              >
                Sebelumnya
              </button>
              <span className="px-2">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent dark:border-gray-700 dark:hover:bg-gray-800 cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedBatch && (
        <Dialog open={!!selectedBatch} onOpenChange={() => setSelectedBatch(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-gray-900 dark:text-white">
                Rincian Batch: {selectedBatch.batch_id}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Spesifikasi varietas kecambah, umur semai, dan tingkat hidup
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60 font-mono text-[11px]">
                <div>
                  <span className="text-gray-400 block text-[10px]">Varietas:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{selectedBatch.varietas}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Produsen:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{selectedBatch.produsen_benih}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Lokasi:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{selectedBatch.estate} • AFD {selectedBatch.afdeling}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Luas Bedengan:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{selectedBatch.luas_area_ha} Ha</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Bibit Hidup:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedBatch.bibit_hidup.toLocaleString("id-ID")}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Siap Salur:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{selectedBatch.bibit_siap_salur.toLocaleString("id-ID")}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Culling Afkir:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">{selectedBatch.culling_rate_pct}% ({selectedBatch.bibit_afkir_culling.toLocaleString("id-ID")})</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Irigasi:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{selectedBatch.sistem_irigasi}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBatch(null)}
                  className="rounded-lg border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Tambah / Edit Batch */}
      {showFormModal && (
        <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-gray-900 dark:text-white">
                {formRecord ? `Edit Batch Pembibitan` : `Tambah Batch Pembibitan Baru`}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Isi data batch benih, lokasi bedengan nursery, dan populasi bibit
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const obj: Record<string, any> = {};
                fd.forEach((val, key) => {
                  obj[key] = val;
                });
                handleSaveForm(obj);
              }}
              className="space-y-3 pt-2 text-xs"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Batch ID
                  </label>
                  <input
                    name="batch_id"
                    defaultValue={formRecord?.batch_id || ""}
                    placeholder="Contoh: BATCH-MN-01"
                    required
                    className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Varietas
                  </label>
                  <input
                    name="varietas"
                    defaultValue={formRecord?.varietas || "DxP Dami Mas"}
                    placeholder="DxP Dami Mas / Topaz"
                    required
                    className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Estate
                  </label>
                  <input
                    name="estate"
                    defaultValue={formRecord?.estate || "BUM 1"}
                    className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Afdeling
                  </label>
                  <input
                    name="afdeling"
                    defaultValue={formRecord?.afdeling || "OA"}
                    className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Bibit Hidup
                  </label>
                  <input
                    type="number"
                    name="bibit_hidup"
                    defaultValue={formRecord?.bibit_hidup || 9500}
                    className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Siap Salur
                  </label>
                  <input
                    type="number"
                    name="bibit_siap_salur"
                    defaultValue={formRecord?.bibit_siap_salur || 9000}
                    className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                >
                  Simpan Batch
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Hapus */}
      {deleteConfirmRecord && (
        <Dialog open={!!deleteConfirmRecord} onOpenChange={() => setDeleteConfirmRecord(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-gray-900 dark:text-white">
                Hapus Data Batch Pembibitan
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 pt-2">
                Apakah Anda yakin ingin menghapus batch{" "}
                <strong className="text-gray-800 dark:text-gray-200">
                  {deleteConfirmRecord.batch_id} ({deleteConfirmRecord.varietas})
                </strong>
                ? Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmRecord(null)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
