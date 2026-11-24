import { useState, useRef, useEffect } from "react";
import {
  DEFAULT_AFDELINGS,
  DEFAULT_BLOCKS,
  DEFAULT_ESTATES,
  DEFAULT_ESTATES_BY_REGION,
  DEFAULT_REGIONS,
  DEFAULT_YEARS,
  getKondisiOptionsByAktivitas,
} from "../mock-operasional";

interface OperasionalToolbarProps {
  // Filter States
  selectedYear: string;
  setSelectedYear: (val: string) => void;
  selectedRegion: string;
  setSelectedRegion: (val: string) => void;
  selectedEstate: string;
  setSelectedEstate: (val: string) => void;
  selectedAfdeling: string;
  setSelectedAfdeling: (val: string) => void;
  selectedBlock: string;
  setSelectedBlock: (val: string) => void;
  selectedType?: string;
  setSelectedType?: (val: string) => void;
  selectedCondition: string;
  setSelectedCondition: (val: string) => void;

  // Search & Rows
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  rowsPerPage: number;
  setRowsPerPage: (val: number) => void;

  // Actions
  onApplyFilter: () => void;
  onResetFilter: () => void;
  onOpenCreate: () => void;
  onOpenSpatialUpload: () => void;
  onOpenActionLogs: () => void;
  onOpenBackup: () => void;
  onExport: () => void;
  onPrintLaporan?: () => void;
  onPrintPeta?: () => void;
  onRefresh: () => void;
}

export default function OperasionalToolbar({
  selectedYear,
  setSelectedYear,
  selectedRegion,
  setSelectedRegion,
  selectedEstate,
  setSelectedEstate,
  selectedAfdeling,
  setSelectedAfdeling,
  selectedBlock,
  setSelectedBlock,
  selectedType = "all",
  selectedCondition,
  setSelectedCondition,
  searchQuery,
  setSearchQuery,
  rowsPerPage,
  setRowsPerPage,
  onApplyFilter,
  onResetFilter,
  onOpenCreate,
  onOpenSpatialUpload,
  onOpenActionLogs,
  onOpenBackup,
  onExport,
  onPrintLaporan,
  onPrintPeta,
  onRefresh,
}: OperasionalToolbarProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cascading Estate berdasarkan Region
  const availableEstates =
    selectedRegion !== "all" && DEFAULT_ESTATES_BY_REGION[selectedRegion]
      ? DEFAULT_ESTATES_BY_REGION[selectedRegion]
      : DEFAULT_ESTATES;

  return (
    <div className="w-full min-w-0 max-w-full space-y-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
      {/* ─── BARIS 1: TOMBOL AKSI UTAMA (Sesuai Gambar 2) ─────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* + Tambah Data */}
        <button
          type="button"
          onClick={onOpenCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 cursor-pointer transition-all"
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Tambah Data</span>
        </button>

        {/* Unggah Data (Biru Khas WebGIS) */}
        <button
          type="button"
          onClick={onOpenSpatialUpload}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-500 cursor-pointer transition-all"
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span>Unggah Data</span>
        </button>

        {/* Riwayat */}
        <button
          type="button"
          onClick={onOpenActionLogs}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60 cursor-pointer transition-all"
        >
          <svg className="size-3.5 text-slate-500 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Riwayat</span>
        </button>

        {/* Backup */}
        <button
          type="button"
          onClick={onOpenBackup}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60 cursor-pointer transition-all"
        >
          <svg className="size-3.5 text-slate-500 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
          <span>Backup</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative" ref={exportRef}>
          <button
            type="button"
            onClick={() => setExportOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60 cursor-pointer transition-all"
          >
            <svg className="size-3.5 text-slate-500 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export & Cetak</span>
            <svg
              className={`size-3 text-slate-400 transition-transform ${exportOpen ? "rotate-180" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {exportOpen && (
            <div className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-60 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800 z-30 animate-fadeIn text-xs">
              <button
                type="button"
                onClick={() => {
                  setExportOpen(false);
                  if (onPrintLaporan) onPrintLaporan();
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/60 cursor-pointer transition-colors"
              >
                <span className="flex size-6 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  📄
                </span>
                <div>
                  <div className="font-bold">Cetak Laporan Operasional</div>
                  <div className="text-[10px] text-slate-400">PDF / Print A4 resmi dengan KPI & ttd</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setExportOpen(false);
                  if (onPrintPeta) onPrintPeta();
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/60 cursor-pointer transition-colors"
              >
                <span className="flex size-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  🗺️
                </span>
                <div>
                  <div className="font-bold">Cetak Peta Kerja Blok</div>
                  <div className="text-[10px] text-slate-400">Layout Kartografi A4 Landscape</div>
                </div>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-700/60" />

              <button
                type="button"
                onClick={() => {
                  setExportOpen(false);
                  onExport();
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/60 cursor-pointer transition-colors"
              >
                <span className="flex size-6 items-center justify-center rounded-md bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  📊
                </span>
                <div>
                  <div className="font-bold">Unduh Berkas CSV</div>
                  <div className="text-[10px] text-slate-400">15 kolom data mentah untuk Excel</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Segarkan / Reset */}
        <button
          type="button"
          onClick={onRefresh}
          title="Segarkan data"
          className="inline-flex items-center justify-center size-8 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/60 cursor-pointer shadow-xs transition-all"
        >
          <svg className="size-3.5 text-slate-500 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
        </button>
      </div>

      {/* ─── BARIS 2: FILTER LENGKAP BERTINGKAT (Sesuai Gambar 2) ─────────── */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          FILTER:
        </span>

        {/* Filter Tahun */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 shadow-xs focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
        >
          <option value="all">Semua Tahun</option>
          {DEFAULT_YEARS.map((y) => (
            <option key={y} value={y}>
              Tahun {y}
            </option>
          ))}
        </select>

        {/* Filter Region */}
        <select
          value={selectedRegion}
          onChange={(e) => {
            setSelectedRegion(e.target.value);
            setSelectedEstate("all");
          }}
          className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 shadow-xs focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
        >
          <option value="all">Region: Semua Region</option>
          {DEFAULT_REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {/* Filter Estate */}
        <select
          value={selectedEstate}
          onChange={(e) => setSelectedEstate(e.target.value)}
          className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 shadow-xs focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
        >
          <option value="all">Estate: Semua Estate</option>
          {availableEstates.map((est) => (
            <option key={est} value={est}>
              {est}
            </option>
          ))}
        </select>

        {/* Filter Afdeling */}
        <select
          value={selectedAfdeling}
          onChange={(e) => setSelectedAfdeling(e.target.value)}
          className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 shadow-xs focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
        >
          <option value="all">Afdeling: Semua Afdeling</option>
          {DEFAULT_AFDELINGS.map((afd) => (
            <option key={afd} value={afd}>
              {afd}
            </option>
          ))}
        </select>

        {/* Filter Blok */}
        <select
          value={selectedBlock}
          onChange={(e) => setSelectedBlock(e.target.value)}
          className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 shadow-xs focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
        >
          <option value="all">Blok: Semua Blok</option>
          {DEFAULT_BLOCKS.map((blk) => (
            <option key={blk} value={blk}>
              Blok {blk}
            </option>
          ))}
        </select>

        {/* Filter Kondisi (Dinamis Sesuai Aktivitas / Tab yang Aktif) */}
        <select
          value={selectedCondition}
          onChange={(e) => setSelectedCondition(e.target.value)}
          className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 shadow-xs focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
        >
          <option value="all">Kondisi: Semua Kondisi</option>
          {getKondisiOptionsByAktivitas(selectedType).map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

      {/* ─── BARIS 3: KONTROL BARIS & PENCARIAN (Sesuai Gambar 2) ─────────── */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        {/* Pilihan Jumlah Baris */}
        <select
          value={rowsPerPage}
          onChange={(e) => setRowsPerPage(Number(e.target.value))}
          className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 shadow-xs focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
        >
          <option value={10}>10 Baris</option>
          <option value={25}>25 Baris</option>
          <option value={50}>50 Baris</option>
          <option value={100}>100 Baris</option>
        </select>

        {/* Input Pencarian */}
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400"
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onApplyFilter()}
            placeholder="Cari Blok / Warung / Kontraktor..."
            className="h-8 w-full rounded-lg border border-slate-300 bg-white py-1 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 shadow-xs focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Tombol Terapkan */}
        <button
          type="button"
          onClick={onApplyFilter}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60 cursor-pointer"
        >
          <svg className="size-3 text-slate-500 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span>Terapkan</span>
        </button>

        {/* Tombol Reset */}
        <button
          type="button"
          onClick={onResetFilter}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60 cursor-pointer"
        >
          <svg className="size-3 text-slate-500 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}
