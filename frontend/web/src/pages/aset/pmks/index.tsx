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

export interface PalmOilMillFacility {
  id: string;
  kode_pmks: string;
  nama_pmks: string;
  unit_estate: string;
  region: string;
  kapasitas_olah_ton_jam: number;
  jumlah_loading_ramp: number;
  kapasitas_tangki_cpo_ton: number;
  jumlah_kolam_ipal: number;
  status_operasional: string;
  sertifikasi: string;
  tahun_komisioning: number;
  koordinat: string;
}

const STORAGE_KEY = "pmks";

// Icon SVG reusable
const IconSearch = () => (
  <svg className="size-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconPlus = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconEye = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const IconEdit = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconTrash = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export default function PMKSPage() {
  const [data, setData] = useState<PalmOilMillFacility[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [viewRecord, setViewRecord] = useState<PalmOilMillFacility | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formRecord, setFormRecord] = useState<PalmOilMillFacility | null>(null);
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<PalmOilMillFacility | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<PalmOilMillFacility>>({});

  // Load dari IndexedDB
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const cached = await getGisDataset<PalmOilMillFacility[]>(STORAGE_KEY);
        if (!cancelled && cached && Array.isArray(cached) && cached.length > 0) {
          setData(cached);
        }
      } catch (err) {
        console.warn("Gagal memuat dataset PMKS:", err);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const save = async (next: PalmOilMillFacility[]) => {
    setData(next);
    await setGisDataset(STORAGE_KEY, next);
  };

  // Unique estate list
  const availableEstates = useMemo(() => {
    const s = new Set<string>();
    data.forEach(d => { if (d.unit_estate) s.add(d.unit_estate); });
    return Array.from(s).sort();
  }, [data]);

  // Filtering
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase().trim();
    return data.filter(item =>
      String(item.nama_pmks || "").toLowerCase().includes(q) ||
      String(item.kode_pmks || "").toLowerCase().includes(q) ||
      String(item.unit_estate || "").toLowerCase().includes(q) ||
      String(item.region || "").toLowerCase().includes(q) ||
      String(item.status_operasional || "").toLowerCase().includes(q) ||
      String(item.sertifikasi || "").toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  // Pagination
  useEffect(() => { setCurrentPage(1); }, [searchQuery, pageSize]);
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // CRUD
  const handleOpenAdd = () => {
    setFormRecord(null);
    setFormData({
      kode_pmks: `PMKS-${Date.now().toString().slice(-4)}`,
      nama_pmks: "",
      unit_estate: availableEstates[0] || "BUM 1",
      region: "REGION 1",
      kapasitas_olah_ton_jam: 60,
      jumlah_loading_ramp: 16,
      kapasitas_tangki_cpo_ton: 10000,
      jumlah_kolam_ipal: 7,
      status_operasional: "Beroperasi Penuh",
      sertifikasi: "RSPO / ISPO",
      tahun_komisioning: 2015,
      koordinat: "-1.4795, 112.7015",
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (item: PalmOilMillFacility) => {
    setFormRecord(item);
    setFormData({ ...item });
    setShowFormModal(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_pmks) return alert("Nama PMKS wajib diisi!");
    if (formRecord) {
      await save(data.map(r => r.id === formRecord.id ? { ...r, ...formData } as PalmOilMillFacility : r));
    } else {
      const newRec: PalmOilMillFacility = {
        id: "pmks-" + Date.now(),
        kode_pmks: formData.kode_pmks || `PMKS-${data.length + 1}`,
        nama_pmks: formData.nama_pmks || "",
        unit_estate: formData.unit_estate || "BUM 1",
        region: formData.region || "REGION 1",
        kapasitas_olah_ton_jam: Number(formData.kapasitas_olah_ton_jam) || 60,
        jumlah_loading_ramp: Number(formData.jumlah_loading_ramp) || 16,
        kapasitas_tangki_cpo_ton: Number(formData.kapasitas_tangki_cpo_ton) || 10000,
        jumlah_kolam_ipal: Number(formData.jumlah_kolam_ipal) || 7,
        status_operasional: formData.status_operasional || "Beroperasi Penuh",
        sertifikasi: formData.sertifikasi || "RSPO / ISPO",
        tahun_komisioning: Number(formData.tahun_komisioning) || 2020,
        koordinat: formData.koordinat || "-1.4795, 112.7015",
      };
      await save([newRec, ...data]);
    }
    setShowFormModal(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirmRecord) return;
    await save(data.filter(r => r.id !== deleteConfirmRecord.id));
    setDeleteConfirmRecord(null);
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) return alert("Tidak ada data untuk diekspor");
    exportToCSV(
      filtered.map((r, i) => ({
        No: i + 1, "Kode PMKS": r.kode_pmks, "Nama PMKS": r.nama_pmks,
        Estate: r.unit_estate, Region: r.region,
        "Kapasitas (Ton/Jam)": r.kapasitas_olah_ton_jam,
        "Tangki CPO (Ton)": r.kapasitas_tangki_cpo_ton,
        "Loading Ramp": r.jumlah_loading_ramp, "Kolam IPAL": r.jumlah_kolam_ipal,
        Status: r.status_operasional, Sertifikasi: r.sertifikasi,
        "Tahun Komisioning": r.tahun_komisioning, Koordinat: r.koordinat,
      })),
      `Data_PMKS`
    );
  };

  const handleExportExcel = () => {
    if (filtered.length === 0) return alert("Tidak ada data untuk diekspor");
    exportToExcel(
      filtered.map((r, i) => ({
        No: i + 1, "Kode PMKS": r.kode_pmks, "Nama PMKS": r.nama_pmks,
        Estate: r.unit_estate, Region: r.region,
        "Kapasitas (Ton/Jam)": r.kapasitas_olah_ton_jam,
        "Tangki CPO (Ton)": r.kapasitas_tangki_cpo_ton,
        "Loading Ramp": r.jumlah_loading_ramp, "Kolam IPAL": r.jumlah_kolam_ipal,
        Status: r.status_operasional, Sertifikasi: r.sertifikasi,
        "Tahun Komisioning": r.tahun_komisioning,
      })),
      `Data_PMKS`,
      "Fasilitas PMKS"
    );
  };

  return (
    <div className="space-y-4">
      <PageMeta title="PMKS (Pabrik Kelapa Sawit) | PT BUM" description="Data fasilitas pabrik kelapa sawit PT Bangkitgiat Usaha Mandiri" />
      <PageBreadcrumb pageTitle="Pabrik Kelapa Sawit (PMKS)" />

      {/* Toolbar Standar Pokok Sawit */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Single Search */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2"><IconSearch /></span>
            <input
              type="text"
              placeholder="Cari kode, nama PMKS, estate, status, sertifikasi..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-9 text-xs text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs font-bold cursor-pointer">✕</button>
            )}
          </div>
          {/* Filter Estate dinamis */}
          {availableEstates.length > 0 && (
            <div className="w-full sm:w-44 shrink-0">
              <select className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                <option value="">Semua Estate</option>
                {availableEstates.map(e => <option key={e} value={e}>Estate {e}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Tombol Aksi */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-50 dark:bg-gray-800">
            <button type="button" onClick={handleExportCSV} className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-white dark:text-gray-300 dark:hover:bg-gray-700 transition cursor-pointer">CSV</button>
            <button type="button" onClick={handleExportExcel} className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-white dark:text-emerald-400 dark:hover:bg-gray-700 transition cursor-pointer">Excel</button>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs transition cursor-pointer"
          >
            <IconPlus /> Tambah PMKS
          </button>
        </div>
      </div>

      {/* Tabel Standar */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50/90 text-gray-600 font-semibold uppercase tracking-wider dark:border-gray-800 dark:bg-gray-800/80 dark:text-gray-300">
              <tr>
                <th className="px-3.5 py-3 text-center w-10">No</th>
                <th className="px-4 py-3">Kode & Nama PMKS</th>
                <th className="px-4 py-3">Estate / Region</th>
                <th className="px-4 py-3 text-right">Kapasitas (Ton/Jam)</th>
                <th className="px-4 py-3 text-right">Tangki CPO (Ton)</th>
                <th className="px-4 py-3 text-center">Loading Ramp</th>
                <th className="px-4 py-3 text-center">Kolam IPAL</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Sertifikasi</th>
                <th className="px-4 py-3 text-center">Th. Komisioning</th>
                <th className="px-4 py-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-xs text-gray-400">
                    {searchQuery ? "Tidak ada PMKS yang sesuai pencarian." : "Belum ada data fasilitas PMKS. Klik tombol Tambah PMKS untuk mulai."}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => {
                  const rowNum = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={row.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition">
                      <td className="px-3.5 py-3 text-center text-gray-400 font-medium">{rowNum}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-white">{row.nama_pmks}</div>
                        <div className="font-mono text-[11px] text-gray-500">{row.kode_pmks}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">{row.unit_estate}</div>
                        <div className="text-[11px] text-gray-400">{row.region}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{row.kapasitas_olah_ton_jam} T/Jam</td>
                      <td className="px-4 py-3 text-right font-medium">{row.kapasitas_tangki_cpo_ton?.toLocaleString("id-ID")} Ton</td>
                      <td className="px-4 py-3 text-center">{row.jumlah_loading_ramp} Pintu</td>
                      <td className="px-4 py-3 text-center">{row.jumlah_kolam_ipal} Kolam</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {row.status_operasional}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">{row.sertifikasi}</td>
                      <td className="px-4 py-3 text-center font-mono">{row.tahun_komisioning}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button type="button" onClick={() => setViewRecord(row)} title="Detail" className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-emerald-600 dark:hover:bg-gray-800 dark:hover:text-emerald-400 transition cursor-pointer"><IconEye /></button>
                          <button type="button" onClick={() => handleOpenEdit(row)} title="Edit" className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-800 dark:hover:text-blue-400 transition cursor-pointer"><IconEdit /></button>
                          <button type="button" onClick={() => setDeleteConfirmRecord(row)} title="Hapus" className="rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition cursor-pointer"><IconTrash /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer Standar */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-800 gap-3 text-xs bg-gray-50/50 dark:bg-gray-800/40">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <span>
              Menampilkan <strong className="text-gray-800 dark:text-gray-200">{totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong>
              {" "}-{" "}<strong className="text-gray-800 dark:text-gray-200">{Math.min(currentPage * pageSize, totalItems)}</strong>
              {" "}dari <strong className="text-gray-800 dark:text-gray-200">{totalItems}</strong> data
            </span>
            <div className="flex items-center gap-1.5">
              <span>Baris:</span>
              <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer">Sebelumnya</button>
            <span className="px-2 font-medium text-gray-600 dark:text-gray-400">Hal {currentPage} / {totalPages}</span>
            <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer">Berikutnya</button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {viewRecord && (
        <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{viewRecord.nama_pmks}</DialogTitle>
              <DialogDescription>Detail spesifikasi teknis fasilitas PMKS</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-2 text-xs rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/40">
              {[
                ["Kode PMKS", viewRecord.kode_pmks],
                ["Estate / Region", `${viewRecord.unit_estate} · ${viewRecord.region}`],
                ["Kapasitas Olah", `${viewRecord.kapasitas_olah_ton_jam} Ton TBS/Jam`],
                ["Tangki CPO", `${viewRecord.kapasitas_tangki_cpo_ton?.toLocaleString("id-ID")} Ton`],
                ["Loading Ramp", `${viewRecord.jumlah_loading_ramp} Pintu`],
                ["Kolam IPAL", `${viewRecord.jumlah_kolam_ipal} Unit`],
                ["Status Operasional", viewRecord.status_operasional],
                ["Sertifikasi", viewRecord.sertifikasi],
                ["Tahun Komisioning", String(viewRecord.tahun_komisioning)],
                ["Koordinat", viewRecord.koordinat],
              ].map(([label, value]) => (
                <div key={label}>
                  <span className="text-gray-500 dark:text-gray-400">{label}:</span>
                  <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Tambah / Edit */}
      {showFormModal && (
        <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{formRecord ? "Edit Fasilitas PMKS" : "Tambah Fasilitas PMKS Baru"}</DialogTitle>
              <DialogDescription>Isi data spesifikasi teknis dan lokasi fasilitas PMKS</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveForm} className="space-y-3 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Kode PMKS *</label>
                  <input required value={formData.kode_pmks || ""} onChange={e => setFormData({ ...formData, kode_pmks: e.target.value })} className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Nama PMKS *</label>
                  <input required value={formData.nama_pmks || ""} onChange={e => setFormData({ ...formData, nama_pmks: e.target.value })} placeholder="Nama Pabrik" className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Estate</label>
                  <input value={formData.unit_estate || ""} onChange={e => setFormData({ ...formData, unit_estate: e.target.value })} className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Region</label>
                  <select value={formData.region || "REGION 1"} onChange={e => setFormData({ ...formData, region: e.target.value })} className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                    <option>REGION 1</option><option>REGION 2</option><option>REGION 3</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Kapasitas (Ton/Jam)</label>
                  <input type="number" value={formData.kapasitas_olah_ton_jam || 60} onChange={e => setFormData({ ...formData, kapasitas_olah_ton_jam: Number(e.target.value) })} className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Tangki CPO (Ton)</label>
                  <input type="number" value={formData.kapasitas_tangki_cpo_ton || 10000} onChange={e => setFormData({ ...formData, kapasitas_tangki_cpo_ton: Number(e.target.value) })} className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Loading Ramp (Pintu)</label>
                  <input type="number" value={formData.jumlah_loading_ramp || 16} onChange={e => setFormData({ ...formData, jumlah_loading_ramp: Number(e.target.value) })} className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Kolam IPAL</label>
                  <input type="number" value={formData.jumlah_kolam_ipal || 7} onChange={e => setFormData({ ...formData, jumlah_kolam_ipal: Number(e.target.value) })} className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Status Operasional</label>
                  <input value={formData.status_operasional || "Beroperasi Penuh"} onChange={e => setFormData({ ...formData, status_operasional: e.target.value })} className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Sertifikasi</label>
                  <input value={formData.sertifikasi || "RSPO / ISPO"} onChange={e => setFormData({ ...formData, sertifikasi: e.target.value })} className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Tahun Komisioning</label>
                  <input type="number" value={formData.tahun_komisioning || 2015} onChange={e => setFormData({ ...formData, tahun_komisioning: Number(e.target.value) })} className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Koordinat (Lat, Lng)</label>
                  <input value={formData.koordinat || ""} onChange={e => setFormData({ ...formData, koordinat: e.target.value })} placeholder="-1.4795, 112.7015" className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowFormModal(false)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 cursor-pointer">Batal</button>
                <button type="submit" className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer">Simpan PMKS</button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteConfirmRecord && (
        <Dialog open={!!deleteConfirmRecord} onOpenChange={() => setDeleteConfirmRecord(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-red-600">Konfirmasi Hapus</DialogTitle>
              <DialogDescription className="pt-2">
                Apakah Anda yakin ingin menghapus fasilitas{" "}
                <strong className="text-gray-800 dark:text-gray-200">{deleteConfirmRecord.nama_pmks}</strong>? Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-3">
              <button type="button" onClick={() => setDeleteConfirmRecord(null)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 cursor-pointer">Batal</button>
              <button type="button" onClick={handleDelete} className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer">Hapus</button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
