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

export interface ConservationAreaItem {
  id: string;
  kode_hcv: string;
  nama_area: string;
  kategori: string;
  kategori_label: string;
  estate: string;
  afdeling: string;
  region: string;
  luas_ha: number;
  tutupan_lahan: string;
  status_patok: string;
  flora_fauna_penting: string;
  frekuensi_patroli: string;
  sertifikasi_standar: string;
}

const CONSERVATION_COLUMNS = [
  { key: "kode_hcv", label: "KODE HCV" },
  { key: "nama_area", label: "NAMA KAWASAN" },
  { key: "kategori_label", label: "KATEGORI" },
  { key: "estate", label: "ESTATE" },
  { key: "afdeling", label: "AFDELING" },
  { key: "luas_ha", label: "LUAS (HA)" },
  { key: "tutupan_lahan", label: "TUTUPAN LAHAN" },
  { key: "status_patok", label: "STATUS PATOK" },
  { key: "flora_fauna_penting", label: "FLORA / FAUNA" },
  { key: "sertifikasi_standar", label: "STANDAR" },
] as const;

export default function AreaKonservasiPage() {
  const [data, setData] = useState<ConservationAreaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAfdeling, setSelectedAfdeling] = useState("");
  const [pageSize, setPageSize] = useState<number | "all">(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedArea, setSelectedArea] = useState<ConservationAreaItem | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formRecord, setFormRecord] = useState<ConservationAreaItem | null>(null);
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<ConservationAreaItem | null>(null);

  // Muat data dari IndexedDB
  useEffect(() => {
    let isCancelled = false;
    const loadData = async () => {
      try {
        const cached = await getGisDataset<ConservationAreaItem[]>("area_konservasi");
        if (!isCancelled && cached && Array.isArray(cached) && cached.length > 0) {
          setData(cached);
        }
      } catch (err) {
        console.warn("Gagal memuat dataset area konservasi:", err);
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
  const filteredAreas = useMemo(() => {
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
        String(item.nama_area || "").toLowerCase().includes(q) ||
        String(item.kode_hcv || "").toLowerCase().includes(q) ||
        String(item.estate || "").toLowerCase().includes(q) ||
        String(item.afdeling || "").toLowerCase().includes(q) ||
        String(item.kategori_label || "").toLowerCase().includes(q) ||
        String(item.tutupan_lahan || "").toLowerCase().includes(q)
      );
    });
  }, [data, selectedAfdeling, searchQuery]);

  // Pagination
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedAfdeling, pageSize]);

  const totalItems = filteredAreas.length;
  const effectivePageSize = pageSize === "all" ? Math.max(totalItems, 1) : pageSize;
  const totalPages = pageSize === "all" ? 1 : Math.ceil(totalItems / effectivePageSize);

  const paginatedData = useMemo(() => {
    if (pageSize === "all") return filteredAreas;
    const startIdx = (currentPage - 1) * effectivePageSize;
    return filteredAreas.slice(startIdx, startIdx + effectivePageSize);
  }, [filteredAreas, currentPage, effectivePageSize, pageSize]);

  const startRecordNum = totalItems === 0 ? 0 : (currentPage - 1) * (pageSize === "all" ? totalItems : pageSize) + 1;
  const endRecordNum = pageSize === "all" ? totalItems : Math.min(currentPage * pageSize, totalItems);

  // Simpan form
  const handleSaveForm = async (formData: Record<string, any>) => {
    let nextData: ConservationAreaItem[] = [];
    if (formRecord?.id) {
      const updated = { ...formRecord, ...formData } as ConservationAreaItem;
      nextData = data.map((item) => (item.id === formRecord.id ? updated : item));
      setData(nextData);
      await setGisDataset("area_konservasi", nextData);
    } else {
      const newRec: ConservationAreaItem = {
        id: "hcv-" + Date.now(),
        kode_hcv: formData.kode_hcv || `HCV-BUM-${data.length + 1}`,
        nama_area: formData.nama_area || "Kawasan Lindung",
        kategori: formData.kategori || "areaHcv",
        kategori_label: formData.kategori_label || "Area HCV / NKT",
        estate: formData.estate || "BUM 1",
        afdeling: formData.afdeling || "OA",
        region: formData.region || "REGION 1",
        luas_ha: Number(formData.luas_ha) || 25.5,
        tutupan_lahan: formData.tutupan_lahan || "Hutan Sekunder Primer",
        status_patok: formData.status_patok || "Terpancang Lengkap (Plang Merah)",
        flora_fauna_penting: formData.flora_fauna_penting || "Orangutan, Burung Rangkong",
        frekuensi_patroli: formData.frekuensi_patroli || "Rutin Mingguan",
        sertifikasi_standar: formData.sertifikasi_standar || "ISPO & RSPO Mandatori",
      };
      nextData = [newRec, ...data];
      setData(nextData);
      await setGisDataset("area_konservasi", nextData);
    }
    setShowFormModal(false);
    setFormRecord(null);
  };

  // Hapus data
  const handleConfirmDelete = async () => {
    if (!deleteConfirmRecord) return;
    const targetId = deleteConfirmRecord.id;
    const nextData = data.filter((r) => r.id !== targetId);
    setData(nextData);
    await setGisDataset("area_konservasi", nextData);
    setDeleteConfirmRecord(null);
  };

  // Ekspor CSV
  const handleExportCSV = () => {
    const afdSuffix = selectedAfdeling ? `_AFD_${selectedAfdeling}` : "";
    const filename = `Area_Konservasi_HCV${afdSuffix}_${new Date().toISOString().slice(0, 10)}.csv`;
    exportToCSV(filename, CONSERVATION_COLUMNS as any, filteredAreas);
  };

  // Ekspor Excel
  const handleExportExcel = () => {
    const afdSuffix = selectedAfdeling ? `_AFD_${selectedAfdeling}` : "";
    const filename = `Area_Konservasi_HCV${afdSuffix}_${new Date().toISOString().slice(0, 10)}.xls`;
    exportToExcel(filename, selectedAfdeling ? `AFD ${selectedAfdeling}` : "HCV", CONSERVATION_COLUMNS as any, filteredAreas);
  };

  return (
    <div className="space-y-4">
      <PageMeta
        title="Aset Area Konservasi & HCV | PT BUM"
        description="Inventarisasi kawasan lindung Nilai Konservasi Tinggi (HCV/NKT) PT Bangkitgiat Usaha Mandiri"
      />

      <PageBreadcrumb pageTitle="Area Konservasi & Nilai Konservasi Tinggi (HCV)" />

      {/* Toolbar Pencarian & Filter Afdeling */}
      <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 max-w-xl">
            {/* Input Pencarian */}
            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Cari kawasan, kode HCV, estate, afdeling..."
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
              + Tambah Area
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredAreas.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
            >
              Ekspor CSV
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={filteredAreas.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 transition cursor-pointer"
            >
              Ekspor Excel
            </button>
          </div>
        </div>
      </div>

      {/* Tabel Data Area Konservasi */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-white">
              Data Area Konservasi & HCV ({totalItems} Area Terpilih)
            </h3>
          </div>

          <div className="flex items-center gap-2 mt-2 sm:mt-0 text-xs text-gray-500">
            <span>Tampilkan baris:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value="all">Semua</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-800/60">
                <th className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300">No</th>
                <th className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Kode HCV</th>
                <th className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Nama Kawasan</th>
                <th className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Kategori</th>
                <th className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Lokasi</th>
                <th className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 text-right whitespace-nowrap">Luas (Ha)</th>
                <th className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Tutupan Lahan</th>
                <th className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Status Patok</th>
                <th className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Flora / Fauna</th>
                <th className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Standar</th>
                <th className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-2xl">🌳</span>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Belum ada data area konservasi & HCV.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setFormRecord(null);
                          setShowFormModal(true);
                        }}
                        className="mt-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                      >
                        + Tambah Kawasan Konservasi
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
                      {item.kode_hcv}
                    </td>
                    <td className="py-2 px-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                      {item.nama_area}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {item.kategori_label}
                      </span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div>{item.estate} • AFD {item.afdeling}</div>
                      <div className="text-[10px] text-gray-400">{item.region}</div>
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-gray-900 dark:text-white whitespace-nowrap">
                      {item.luas_ha?.toLocaleString("id-ID")}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">{item.tutupan_lahan}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="text-xs text-gray-700 dark:text-gray-300">{item.status_patok}</span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-gray-600 dark:text-gray-400">
                      {item.flora_fauna_penting}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="text-[11px] text-gray-500">{item.sertifikasi_standar}</span>
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedArea(item)}
                          className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                          title="Detail"
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
                disabled={currentPage <= 1 || pageSize === "all"}
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
                disabled={currentPage >= totalPages || pageSize === "all"}
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
      {selectedArea && (
        <Dialog open={!!selectedArea} onOpenChange={() => setSelectedArea(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-gray-900 dark:text-white">
                {selectedArea.kode_hcv} - {selectedArea.nama_area}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Informasi kawasan bernilai konservasi tinggi, luasan, dan status batas
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60 font-mono text-[11px]">
                <div>
                  <span className="text-gray-400 block text-[10px]">Kategori:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{selectedArea.kategori_label}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Luas:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedArea.luas_ha} Ha</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Lokasi:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{selectedArea.estate} • AFD {selectedArea.afdeling}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Tutupan Lahan:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{selectedArea.tutupan_lahan}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400 block text-[10px]">Status Patok / Pal:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{selectedArea.status_patok}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400 block text-[10px]">Flora & Fauna Penting:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{selectedArea.flora_fauna_penting}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedArea(null)}
                  className="rounded-lg border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Tambah / Edit */}
      {showFormModal && (
        <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-gray-900 dark:text-white">
                {formRecord ? `Edit Kawasan Konservasi` : `Tambah Kawasan Konservasi Baru`}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Isi data batas kawasan, kategori HCV, luasan, dan status patok
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
                    Kode HCV
                  </label>
                  <input
                    name="kode_hcv"
                    defaultValue={formRecord?.kode_hcv || ""}
                    placeholder="Contoh: HCV-BUM-01"
                    required
                    className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Nama Kawasan
                  </label>
                  <input
                    name="nama_area"
                    defaultValue={formRecord?.nama_area || ""}
                    placeholder="Sempadan Sungai / Koridor Satwa"
                    required
                    className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Kategori
                  </label>
                  <select
                    name="kategori_label"
                    defaultValue={formRecord?.kategori_label || "Area HCV / NKT"}
                    className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:border-gray-700 dark:bg-gray-800"
                  >
                    <option value="Area HCV / NKT">Area HCV / NKT</option>
                    <option value="Sempadan Sungai">Sempadan Sungai</option>
                    <option value="Kuburan & Situs Budaya">Kuburan & Situs Budaya</option>
                    <option value="Lokasi Mata Air">Lokasi Mata Air</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Luas (Ha)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="luas_ha"
                    defaultValue={formRecord?.luas_ha || 15.0}
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
                  Simpan Area
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
                Hapus Data Kawasan Konservasi
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 pt-2">
                Apakah Anda yakin ingin menghapus kawasan{" "}
                <strong className="text-gray-800 dark:text-gray-200">
                  {deleteConfirmRecord.nama_area} ({deleteConfirmRecord.kode_hcv})
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
