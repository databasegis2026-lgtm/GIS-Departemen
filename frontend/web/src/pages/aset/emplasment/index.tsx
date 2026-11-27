import { useState, useMemo, useEffect, useCallback } from "react";
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

// 15 Kolom Baku Emplasment sesuai skema SHP
const EMPLASMENT_COLUMNS = [
  "X_UTM", "Y_UTM", "X_GEO", "Y_GEO",
  "DEPARTMENT", "DIVISIONCO", "GROUPLOCAT", "BLOCKID",
  "LOCATIONCO", "LOCATIONNA", "KETERANGAN", "ESTATE", "STT", "EST", "Luas",
] as const;

type EmplasmentRecord = Record<string, any>;

function genUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const DB_KEY = "emplasment_data";

export default function EmplasmentPage() {
  const [data, setData] = useState<EmplasmentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Load dari IndexedDB ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getGisDataset<EmplasmentRecord[]>(DB_KEY).then((saved) => {
      if (cancelled) return;
      if (saved && Array.isArray(saved) && saved.length > 0) setData(saved);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  // ── Auto-save ke IndexedDB ───────────────────────────────────────────────
  const isMounted = useMemo(() => ({ value: false }), []);
  useEffect(() => {
    if (!isMounted.value) { isMounted.value = true; return; }
    setGisDataset(DB_KEY, data);
  }, [data]);

  // ── State ────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [estateFilter, setEstateFilter] = useState("Semua");
  const [groupFilter, setGroupFilter] = useState("Semua");
  const [pageSize, setPageSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("gis_page_size");
      if (saved) { const p = parseInt(saved, 10); if ([10, 25, 50, 100].includes(p)) return p; }
    } catch { }
    return 10;
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [selectedRecord, setSelectedRecord] = useState<EmplasmentRecord | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formRecord, setFormRecord] = useState<EmplasmentRecord | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  // ── Options dinamis ──────────────────────────────────────────────────────
  const estateOptions = useMemo(() => {
    const s = new Set<string>();
    data.forEach((r) => { if (r.ESTATE) s.add(String(r.ESTATE)); });
    return Array.from(s).sort();
  }, [data]);

  const groupOptions = useMemo(() => {
    const s = new Set<string>();
    data.forEach((r) => { if (r.GROUPLOCAT) s.add(String(r.GROUPLOCAT)); });
    return Array.from(s).sort();
  }, [data]);

  // ── Filter ───────────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (estateFilter !== "Semua" && item.ESTATE !== estateFilter) return false;
      if (groupFilter !== "Semua" && item.GROUPLOCAT !== groupFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return Object.values(item).some((v) => String(v ?? "").toLowerCase().includes(q));
    });
  }, [data, estateFilter, groupFilter, searchQuery]);

  useEffect(() => { setCurrentPage(1); }, [estateFilter, groupFilter, searchQuery, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, validPage, pageSize]);

  const handlePageSizeChange = (n: number) => {
    setPageSize(n);
    setCurrentPage(1);
    try { localStorage.setItem("gis_page_size", String(n)); } catch { }
  };

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const handleSaveForm = useCallback((formData: Record<string, any>) => {
    if (formRecord?.id) {
      setData((prev) => prev.map((item) => item.id === formRecord.id ? { ...formData, id: formRecord.id } : item));
    } else {
      setData((prev) => [{ ...formData, id: genUUID() }, ...prev]);
    }
    setShowFormModal(false);
    setFormRecord(null);
  }, [formRecord]);

  const handleDelete = useCallback((row: EmplasmentRecord) => {
    const name = row.LOCATIONNA || row.LOCATIONCO || row.id;
    if (!window.confirm(`Yakin ingin menghapus data "${name}"?`)) return;
    setData((prev) => prev.filter((item) => item.id !== row.id));
  }, []);

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleProcessUpload = () => {
    if (!uploadedFile) return;
    setIsUploading(true);
    setUploadProgress(10);
    setUploadStatus("Membaca berkas spasial...");
    setUploadSuccess(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setUploadProgress(60);
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        let records: EmplasmentRecord[] = [];

        if (parsed.features && Array.isArray(parsed.features)) {
          records = parsed.features.map((feat: any, idx: number) => {
            const props = feat.properties || {};
            const coords = feat.geometry?.coordinates;
            let xGeo = props.X_GEO, yGeo = props.Y_GEO;
            if (!xGeo && coords && Array.isArray(coords)) {
              if (typeof coords[0] === "number") { xGeo = coords[0]; yGeo = coords[1]; }
              else if (Array.isArray(coords[0]) && typeof coords[0][0] === "number") { xGeo = coords[0][0]; yGeo = coords[0][1]; }
            }
            return {
              id: genUUID(),
              X_UTM: props.X_UTM || props.X || 0,
              Y_UTM: props.Y_UTM || props.Y || 0,
              X_GEO: xGeo || 0,
              Y_GEO: yGeo || 0,
              DEPARTMENT: props.DEPARTMENT || props.DEPT || "-",
              DIVISIONCO: props.DIVISIONCO || props.DIV || "-",
              GROUPLOCAT: props.GROUPLOCAT || props.GROUP || "Emplasemen",
              BLOCKID: props.BLOCKID || props.BLOK || "-",
              LOCATIONCO: props.LOCATIONCO || props.KODE || `EMP-${idx + 1}`,
              LOCATIONNA: props.LOCATIONNA || props.NAMA || `Fasilitas ${idx + 1}`,
              KETERANGAN: props.KETERANGAN || props.KET || "-",
              ESTATE: props.ESTATE || "-",
              STT: props.STT || props.STATUS || "Aktif",
              EST: props.EST || "-",
              Luas: Number(props.Luas || props.LUAS || 0),
            };
          });
        } else if (Array.isArray(parsed)) {
          records = parsed;
        }

        setUploadProgress(90);
        if (records.length > 0) {
          setData((prev) => [...records, ...prev.filter((p) => !records.some((n) => n.id === p.id))]);
          setImportedCount(records.length);
          setUploadSuccess(true);
          setUploadStatus(`Selesai! ${records.length} data diekstrak & disimpan lokal.`);
        } else {
          setUploadStatus("Format berkas tidak memuat array data atau GeoJSON features yang valid.");
        }
      } catch {
        setUploadStatus("Gagal membaca berkas. Pastikan berkas GeoJSON atau JSON valid.");
      } finally {
        setUploadProgress(100);
        setIsUploading(false);
      }
    };
    reader.onerror = () => { setUploadStatus("Gagal membaca berkas."); setIsUploading(false); };
    reader.readAsText(uploadedFile);
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setUploadedFile(null);
    setUploadStatus("");
    setIsUploading(false);
    setUploadProgress(0);
    setUploadSuccess(false);
    setImportedCount(0);
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const rows = filteredData.map((row) => {
      const out: Record<string, any> = {};
      EMPLASMENT_COLUMNS.forEach((col) => { out[col] = row[col] ?? ""; });
      return out;
    });
    exportToCSV(rows, `Emplasment_${estateFilter !== "Semua" ? estateFilter + "_" : ""}Export`);
  };

  const handleExportExcel = () => {
    const rows = filteredData.map((row) => {
      const out: Record<string, any> = {};
      EMPLASMENT_COLUMNS.forEach((col) => { out[col] = row[col] ?? ""; });
      return out;
    });
    exportToExcel(rows, `Emplasment_${estateFilter !== "Semua" ? estateFilter + "_" : ""}Export`, "Emplasment");
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <PageMeta
        title="Emplasment & Fasilitas | Aset GIS"
        description="Data spasial dan tabel atribut fasilitas emplasemen perkebunan PT BUM"
      />
      <PageBreadcrumb pageTitle="Emplasment" />

      {/* Toolbar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between -mt-2">
        {/* Kiri: search + filter estate + filter group */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama lokasi, kode, blok, keterangan..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 shadow-theme-xs focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >✕</button>
            )}
          </div>

          {/* Filter Estate */}
          <select
            value={estateFilter}
            onChange={(e) => setEstateFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 shadow-theme-xs focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer"
          >
            <option value="Semua">Semua Estate</option>
            {estateOptions.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>

          {/* Filter Group */}
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 shadow-theme-xs focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer"
          >
            <option value="Semua">Semua Group</option>
            {groupOptions.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* Kanan: page size + action buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <span className="hidden sm:inline text-[11px]">Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 shadow-theme-xs focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer"
            >
              <option value={10}>10 baris</option>
              <option value={25}>25 baris</option>
              <option value={50}>50 baris</option>
              <option value={100}>100 baris</option>
            </select>
          </div>

          {/* CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredData.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition cursor-pointer shadow-xs"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            CSV
          </button>

          {/* Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={filteredData.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition cursor-pointer shadow-xs"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
            </svg>
            Excel
          </button>

          {/* Tambah */}
          <button
            type="button"
            onClick={() => { setFormRecord(null); setShowFormModal(true); }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition cursor-pointer shadow-xs"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Tambah
          </button>

          {/* Unggah */}
          <button
            type="button"
            onClick={() => { setUploadSuccess(false); setUploadProgress(0); setUploadStatus(""); setShowUploadModal(true); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Unggah SHP
          </button>
        </div>
      </div>

      {/* Tabel */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/75 dark:border-gray-800 dark:bg-gray-800/50">
                <th className="px-3 py-2.5 text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-10 text-center">No</th>
                {EMPLASMENT_COLUMNS.map((col) => (
                  <th key={col} className="px-3 py-2.5 text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider font-mono whitespace-nowrap">
                    {col}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-center sticky right-0 bg-gray-50 dark:bg-gray-800 w-28">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={EMPLASMENT_COLUMNS.length + 2} className="px-4 py-8 text-center text-xs text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="size-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                      Memuat data dari penyimpanan lokal...
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={EMPLASMENT_COLUMNS.length + 2} className="px-4 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                    Belum ada data Emplasment. Klik <b>Tambah</b> atau <b>Unggah SHP</b> untuk memasukkan data fasilitas.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => {
                  const globalIdx = (validPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={item.id || idx} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition">
                      <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 text-center font-mono">{globalIdx}</td>
                      {EMPLASMENT_COLUMNS.map((col) => (
                        <td key={col} className="px-3 py-2 text-xs text-gray-800 dark:text-gray-200 whitespace-nowrap font-mono">
                          {col === "X_UTM" || col === "Y_UTM"
                            ? typeof item[col] === "number" ? item[col].toFixed(2) : (item[col] ?? "-")
                            : col === "X_GEO" || col === "Y_GEO"
                              ? typeof item[col] === "number" ? item[col].toFixed(6) : (item[col] ?? "-")
                              : col === "Luas"
                                ? `${typeof item[col] === "number" ? item[col].toFixed(2) : (item[col] ?? "0.00")} Ha`
                                : item[col] ?? "-"}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-xs text-center sticky right-0 bg-white dark:bg-gray-900 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Detail */}
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(item)}
                            title="Lihat Detail"
                            className="rounded-md border border-gray-300 p-1 text-blue-600 hover:bg-blue-50 dark:border-gray-700 dark:text-blue-400 dark:hover:bg-blue-950/40 transition cursor-pointer"
                          >
                            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => { setFormRecord(item); setShowFormModal(true); }}
                            title="Edit Data"
                            className="rounded-md border border-gray-300 p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white transition cursor-pointer"
                          >
                            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                          </button>

                          {/* Hapus */}
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            title="Hapus Data"
                            className="rounded-md border border-red-200 p-1 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40 transition cursor-pointer"
                          >
                            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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

        {/* Pagination footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800 gap-3 bg-gray-50/50 dark:bg-gray-800/25">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {filteredData.length > 0 ? (
              <span>
                Menampilkan <b>{(validPage - 1) * pageSize + 1}</b> –{" "}
                <b>{Math.min(validPage * pageSize, filteredData.length)}</b> dari{" "}
                <b>{filteredData.length}</b> data
                {searchQuery && <span className="text-gray-400 ml-1">(difilter dari {data.length})</span>}
              </span>
            ) : <span>0 data ditemukan</span>}
          </div>
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validPage <= 1}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 transition cursor-pointer"
            >← Prev</button>
            <div className="flex items-center gap-1 px-1 text-xs font-mono">
              <span className="font-semibold text-gray-900 dark:text-white">{validPage}</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-500 dark:text-gray-400">{totalPages}</span>
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validPage >= totalPages}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 transition cursor-pointer"
            >Next →</button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{selectedRecord.LOCATIONNA || "Detail Emplasment"}</DialogTitle>
              <DialogDescription>Rincian 15 atribut spasial dan koordinat geografis/UTM</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2.5 rounded-lg border border-gray-200 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-gray-800/40 text-xs">
              {EMPLASMENT_COLUMNS.map((col) => (
                <div key={col} className="space-y-0.5">
                  <span className="font-mono text-[11px] text-gray-500 dark:text-gray-400">{col}:</span>
                  <p className="font-medium text-gray-900 dark:text-white break-words">
                    {selectedRecord[col] !== undefined && selectedRecord[col] !== null ? String(selectedRecord[col]) : "-"}
                  </p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Form Tambah/Edit */}
      {showFormModal && (
        <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{formRecord ? "Edit Data Emplasment" : "Tambah Data Emplasment Baru"}</DialogTitle>
              <DialogDescription>Masukkan nilai sesuai 15 atribut baku berkas shapefile Emplasment</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const rec: Record<string, any> = {};
                EMPLASMENT_COLUMNS.forEach((col) => {
                  const val = fd.get(col);
                  if (["X_UTM", "Y_UTM", "X_GEO", "Y_GEO", "Luas"].includes(col)) {
                    rec[col] = val ? Number(val) : 0;
                  } else {
                    rec[col] = val ? String(val) : "";
                  }
                });
                handleSaveForm(rec);
              }}
              className="space-y-4 py-2"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {EMPLASMENT_COLUMNS.map((col) => (
                  <div key={col}>
                    <label className="block text-[11px] font-mono font-semibold text-gray-700 dark:text-gray-300 mb-1">{col}</label>
                    <input
                      name={col}
                      type={["X_UTM", "Y_UTM", "X_GEO", "Y_GEO", "Luas"].includes(col) ? "number" : "text"}
                      step="any"
                      defaultValue={formRecord ? formRecord[col] : ""}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      placeholder={`Isi ${col}...`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <button type="button" onClick={() => setShowFormModal(false)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 cursor-pointer">
                  Batal
                </button>
                <button type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer">
                  Simpan Data
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Unggah */}
      <Dialog open={showUploadModal} onOpenChange={handleCloseUploadModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unggah Berkas SHP / GeoJSON Emplasment</DialogTitle>
            <DialogDescription>Mendukung berkas GeoJSON, JSON, atau ZIP berkas Shapefile (UTM 49S). Data tersimpan lokal di browser.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!isUploading && !uploadSuccess && (
              <>
                <div className="flex justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-8 dark:border-gray-700 hover:border-emerald-500 transition">
                  <div className="text-center">
                    <svg className="mx-auto size-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      <label className="cursor-pointer font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
                        Pilih berkas GeoJSON / JSON
                        <input type="file" className="sr-only" accept=".zip,.shp,.dbf,.shx,.prj,.geojson,.json"
                          onChange={(e) => setUploadedFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                    {uploadedFile && (
                      <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={handleCloseUploadModal}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 cursor-pointer">
                    Batal
                  </button>
                  <button type="button" disabled={!uploadedFile} onClick={handleProcessUpload}
                    className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer">
                    Ekstrak &amp; Simpan
                  </button>
                </div>
              </>
            )}

            {isUploading && (
              <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-2">
                  <div className="size-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                  <span className="text-xs font-bold text-gray-800 dark:text-white">Memproses berkas...</span>
                  <span className="ml-auto font-mono text-sm font-extrabold text-emerald-600">{uploadProgress}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className="text-[11px] text-gray-500">{uploadStatus}</p>
              </div>
            )}

            {uploadSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/30 text-center space-y-3">
                <div className="size-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">
                  <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Berhasil Diimpor!</h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                    <b>{importedCount} data</b> diekstrak &amp; disimpan di penyimpanan lokal browser.
                  </p>
                </div>
                <button type="button" onClick={handleCloseUploadModal}
                  className="rounded-lg bg-emerald-600 px-6 py-2 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer">
                  Tutup &amp; Lihat Data
                </button>
              </div>
            )}

            {uploadStatus && !isUploading && !uploadSuccess && (
              <div className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                {uploadStatus}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
