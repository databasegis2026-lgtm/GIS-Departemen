import { useState, useMemo } from "react";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const REGIONS = ["Semua Region", "REGION 1", "REGION 2", "REGION 3"] as const;
const ESTATES = [
  "Semua Estate",
  "BUM 1",
  "BUM 2",
  "BUM 4",
  "BUM 5",
  "BUM 6",
  "BUM 7",
  "BUM 3",
  "BUM 8",
  "BSL",
] as const;

export interface LandClearingItem {
  id: string;
  nomor_spk: string;
  blok: string;
  region: "REGION 1" | "REGION 2" | "REGION 3";
  estate: string;
  afdeling: string;
  kontraktor: string;
  luas_spk_ha: number;
  luas_imas_ha: number;
  luas_tumbang_ha: number;
  luas_stacking_ha: number;
  luas_teras_drainase_ha: number;
  kelerengan: "Datar (0-8°)" | "Bergelombang (8-25°)" | "Curam (>25° - HCV)";
  sph_standar: number;
  zero_burning: boolean; // SOP 100% Zero Burning
  buffer_sungai_aman: boolean; // Proteksi 50m / 100m
  tunggul_sesuai_sop: boolean; // Maksimal tinggi tunggul
  progres_pct: number;
  shp_tracking_name?: string;
  shp_upload_date?: string;
  status_bapp_lc: "Draft Lapangan" | "Verifikasi GIS" | "BAPP Disetujui" | "Perlu Revisi Batas";
  catatan_lapangan: string;
}

const MOCK_LC_DATA: LandClearingItem[] = [
  {
    id: "lc-01",
    nomor_spk: "SPK/LC/BUM/2026/004",
    blok: "C12",
    region: "REGION 3",
    estate: "BSL",
    afdeling: "AFD 2",
    kontraktor: "PT Agro Jaya Mandiri",
    luas_spk_ha: 25.0,
    luas_imas_ha: 25.0,
    luas_tumbang_ha: 22.0,
    luas_stacking_ha: 18.5,
    luas_teras_drainase_ha: 12.0,
    kelerengan: "Datar (0-8°)",
    sph_standar: 148,
    zero_burning: true,
    buffer_sungai_aman: true,
    tunggul_sesuai_sop: true,
    progres_pct: 74,
    shp_tracking_name: "tracking_gps_c12_lc.kml",
    shp_upload_date: "19 Feb 2026",
    status_bapp_lc: "Verifikasi GIS",
    catatan_lapangan: "Penebasan imas selesai 100%. Tumbang dan merencek mekanis excavator PC200 sedang berlangsung.",
  },
  {
    id: "lc-02",
    nomor_spk: "SPK/LC/BUM/2026/007",
    blok: "E08",
    region: "REGION 2",
    estate: "BUM 6",
    afdeling: "AFD 25",
    kontraktor: "Swakelola Divisi Traksi BUM",
    luas_spk_ha: 24.8,
    luas_imas_ha: 24.8,
    luas_tumbang_ha: 24.8,
    luas_stacking_ha: 24.8,
    luas_teras_drainase_ha: 21.8,
    kelerengan: "Bergelombang (8-25°)",
    sph_standar: 136,
    zero_burning: true,
    buffer_sungai_aman: true,
    tunggul_sesuai_sop: true,
    progres_pct: 88,
    shp_tracking_name: "shp_lc_bum6_e08_teras.zip",
    shp_upload_date: "22 Feb 2026",
    status_bapp_lc: "Verifikasi GIS",
    catatan_lapangan: "Wajib teras kontur bersambung lebar 3,8m dengan stop bund interval 30m. Main drain selesai.",
  },
  {
    id: "lc-03",
    nomor_spk: "SPK/LC/BUM/2026/009",
    blok: "A11",
    region: "REGION 3",
    estate: "BUM 8",
    afdeling: "AFD 33",
    kontraktor: "PT Rimba Persada",
    luas_spk_ha: 25.0,
    luas_imas_ha: 15.0,
    luas_tumbang_ha: 8.5,
    luas_stacking_ha: 6.5,
    luas_teras_drainase_ha: 0.0,
    kelerengan: "Datar (0-8°)",
    sph_standar: 148,
    zero_burning: true,
    buffer_sungai_aman: false,
    tunggul_sesuai_sop: true,
    progres_pct: 26,
    shp_tracking_name: "shp_lc_a11_draft.zip",
    shp_upload_date: "20 Feb 2026",
    status_bapp_lc: "Perlu Revisi Batas",
    catatan_lapangan: "Peringatan: Alat berat mendekati buffer 50m sempadan anak sungai. Pemotongan poligon revisi diinstruksikan.",
  },
  {
    id: "lc-04",
    nomor_spk: "SPK/LC/BUM/2026/001",
    blok: "B09",
    region: "REGION 1",
    estate: "BUM 1",
    afdeling: "AFD 3",
    kontraktor: "CV Mandiri Agronesia",
    luas_spk_ha: 24.2,
    luas_imas_ha: 24.2,
    luas_tumbang_ha: 24.2,
    luas_stacking_ha: 24.2,
    luas_teras_drainase_ha: 24.2,
    kelerengan: "Datar (0-8°)",
    sph_standar: 148,
    zero_burning: true,
    buffer_sungai_aman: true,
    tunggul_sesuai_sop: true,
    progres_pct: 100,
    shp_tracking_name: "shp_lc_bum1_b09_bapp_final.zip",
    shp_upload_date: "15 Feb 2026",
    status_bapp_lc: "BAPP Disetujui",
    catatan_lapangan: "Seluruh tahapan LC tuntas tanpa bakar. Drainase rapi dan telah diserahkan ke tim tanam.",
  },
];

export default function LaneClearingPage() {
  const [data, setData] = useState<LandClearingItem[]>(MOCK_LC_DATA);
  const [selectedRegion, setSelectedRegion] = useState<string>("Semua Region");
  const [selectedEstate, setSelectedEstate] = useState<string>("Semua Estate");
  const [bappFilter, setBappFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [targetUploadItem, setTargetUploadItem] = useState<LandClearingItem | null>(null);
  const [detailModalItem, setDetailModalItem] = useState<LandClearingItem | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState("");

  // Filter Data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (selectedRegion !== "Semua Region" && item.region !== selectedRegion) return false;
      if (selectedEstate !== "Semua Estate" && item.estate !== selectedEstate) return false;
      if (bappFilter !== "all" && item.status_bapp_lc !== bappFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.nomor_spk.toLowerCase().includes(q) ||
        item.blok.toLowerCase().includes(q) ||
        item.kontraktor.toLowerCase().includes(q) ||
        item.estate.toLowerCase().includes(q) ||
        item.afdeling.toLowerCase().includes(q) ||
        item.catatan_lapangan.toLowerCase().includes(q)
      );
    });
  }, [data, selectedRegion, selectedEstate, bappFilter, searchQuery]);

  // Statistik Ringkasan
  const stats = useMemo(() => {
    const totalSpkHa = data.reduce((a, b) => a + b.luas_spk_ha, 0);
    const totalTumbangHa = data.reduce((a, b) => a + b.luas_tumbang_ha, 0);
    const totalStackingHa = data.reduce((a, b) => a + b.luas_stacking_ha, 0);
    const totalTerasHa = data.reduce((a, b) => a + b.luas_teras_drainase_ha, 0);
    const countBappOk = data.filter((d) => d.status_bapp_lc === "BAPP Disetujui").length;

    return {
      totalSpkHa,
      totalTumbangHa,
      totalStackingHa,
      totalTerasHa,
      countBappOk,
      overallProgress: Math.round((totalStackingHa / totalSpkHa) * 100),
    };
  }, [data]);

  const handleSimulateUploadShp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUploadItem || !uploadedFileName) return;

    setData((prev) =>
      prev.map((item) => {
        if (item.id === targetUploadItem.id) {
          return {
            ...item,
            shp_tracking_name: uploadedFileName,
            shp_upload_date: "24 Feb 2026",
            status_bapp_lc: "Verifikasi GIS",
          };
        }
        return item;
      })
    );

    setUploadModalOpen(false);
    setTargetUploadItem(null);
    setUploadedFileName("");
  };

  return (
    <div className="space-y-4">
      <PageMeta
        title="Land Clearing (PBLH) - PT BUM & BSL"
        description="Monitoring spasial pembukaan lahan mekanis, imas tumbang, stacking, teras kontur, dan kepatuhan Zero Burning"
      />

      <PageBreadcrumb pageTitle="Land Clearing" />

      {/* Header */}
      <header className="flex flex-col gap-2 border-b border-gray-200 pb-3.5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between -mt-3">
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">
            Land Clearing (PBLH - Pembukaan Lahan)
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Monitoring progres fisik imas, tumbang mekanis, perencekan, teras kontur, dan validasi shapefile tracking alat berat.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-500"></span>
            100% Zero Burning
          </span>
          <span className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 shadow-theme-xs">
            {stats.countBappOk} BAPP Selesai
          </span>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Total Kontrak SPK
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalSpkHa.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500">Ha</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Total target areal pembukaan
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Realisasi Tumbang
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalTumbangHa.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500">Ha</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Tumbang mekanis tuntas
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Stacking & Rencek
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.totalStackingHa.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500">Ha</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Staking jalur baris tanam
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Teras & Tata Air
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {stats.totalTerasHa.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500">Ha</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Teras 3.8m & Main/Coll Drain
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs col-span-2 sm:col-span-4 lg:col-span-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Progress Keseluruhan
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.overallProgress}%
            </span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Terhadap total luas kontrak SPK
          </div>
        </div>
      </section>

      {/* Toolbar Filter */}
      <section className="flex flex-col gap-2.5 rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400"
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
            placeholder="Cari nomor SPK, blok, kontraktor..."
            className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-8.5 pr-3 text-xs text-gray-800 placeholder-gray-400 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={bappFilter}
            onChange={(e) => setBappFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-800 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 cursor-pointer"
          >
            <option value="all">Semua Status BAPP</option>
            <option value="Draft Lapangan">Draft Lapangan</option>
            <option value="Verifikasi GIS">Verifikasi GIS</option>
            <option value="BAPP Disetujui">BAPP Disetujui</option>
            <option value="Perlu Revisi Batas">Perlu Revisi Batas</option>
          </select>

          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-800 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 cursor-pointer"
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select
            value={selectedEstate}
            onChange={(e) => setSelectedEstate(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-800 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 cursor-pointer"
          >
            {ESTATES.map((est) => (
              <option key={est} value={est}>
                {est}
              </option>
            ))}
          </select>

          <span className="text-xs text-gray-500 dark:text-gray-400">
            Total: <strong className="font-semibold text-gray-900 dark:text-white">{filteredData.length}</strong> blok
          </span>
        </div>
      </section>

      {/* Tabel Data Land Clearing */}
      <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-semibold uppercase text-gray-600 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300">
            <tr>
              <th className="px-3.5 py-3">Blok & No. SPK</th>
              <th className="px-3.5 py-3">Kontraktor Pelaksana</th>
              <th className="px-3 py-3">Luas SPK / Realisasi</th>
              <th className="px-3 py-3">Kelerengan & SPH</th>
              <th className="px-3.5 py-3">Kepatuhan SOP</th>
              <th className="px-3 py-3">Progres Stacking</th>
              <th className="px-3.5 py-3">Status BAPP</th>
              <th className="px-3.5 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-xs text-gray-500">
                  Tidak ada blok land clearing yang sesuai kriteria filter.
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <td className="px-3.5 py-3">
                    <div className="font-semibold text-gray-900 dark:text-white font-mono">
                      Blok {item.blok}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {item.nomor_spk}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {item.estate} • {item.afdeling}
                    </div>
                  </td>

                  <td className="px-3.5 py-3">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {item.kontraktor}
                    </div>
                    {item.shp_tracking_name && (
                      <div className="text-[10px] text-brand-600 dark:text-brand-400 font-mono truncate max-w-[140px]" title={item.shp_tracking_name}>
                        {item.shp_tracking_name}
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {item.luas_stacking_ha.toFixed(1)} / {item.luas_spk_ha.toFixed(1)} Ha
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Tumbang: {item.luas_tumbang_ha.toFixed(1)} Ha
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <div className="font-medium text-gray-800 dark:text-gray-200">
                      {item.kelerengan}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      SPH Standar: {item.sph_standar} Pokok/Ha
                    </div>
                  </td>

                  <td className="px-3.5 py-3">
                    <div className="flex flex-col gap-1 text-[10px]">
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                        <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Zero Burning (Lolos)
                      </span>
                      {item.buffer_sungai_aman ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                          <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Buffer Sempadan Aman
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                          <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          Dekat Sempadan Sungai
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-3 w-28">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      <span>{item.progres_pct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${item.progres_pct}%` }}
                      ></div>
                    </div>
                  </td>

                  <td className="px-3.5 py-3">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        item.status_bapp_lc === "BAPP Disetujui"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50"
                          : item.status_bapp_lc === "Perlu Revisi Batas"
                            ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50"
                            : "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50"
                      }`}
                    >
                      {item.status_bapp_lc}
                    </span>
                  </td>

                  <td className="px-3.5 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setTargetUploadItem(item);
                          setUploadModalOpen(true);
                        }}
                        className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 shadow-theme-xs cursor-pointer"
                        title="Unggah SHP Tracking Hasil Kerja"
                      >
                        Unggah SHP
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailModalItem(item)}
                        className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        SOP
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Modal Unggah SHP Tracking Realisasi LC */}
      <Dialog open={uploadModalOpen} onOpenChange={(open) => !open && setUploadModalOpen(false)}>
        {targetUploadItem && (
          <DialogContent className="sm:max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                Unggah SHP Tracking LC • Blok {targetUploadItem.blok}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
                Pilih file shapefile / polygon hasil survei drone atau GPS tracking alat berat kontraktor {targetUploadItem.kontraktor}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSimulateUploadShp} className="space-y-4 text-xs mt-2">
              <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center dark:border-gray-700 hover:border-brand-500 transition-colors">
                <svg className="mx-auto size-8 text-gray-400 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <div className="font-semibold text-gray-700 dark:text-gray-300">
                  {uploadedFileName ? uploadedFileName : "Klik atau seret file SHP ke sini"}
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  Format didukung: .zip (Shapefile lengkap), .shp, .geojson, .kml
                </p>
                <label className="mt-3 inline-block cursor-pointer rounded-lg bg-brand-500 px-3.5 py-1.5 font-semibold text-white hover:bg-brand-600 transition-colors">
                  <span>Pilih File</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".zip,.shp,.geojson,.kml,.kmz"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setUploadedFileName(file.name);
                    }}
                  />
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!uploadedFileName}
                  className="rounded-lg bg-brand-500 px-3.5 py-1.5 font-semibold text-white hover:bg-brand-600 disabled:opacity-50 cursor-pointer transition-colors"
                >
                  Kirim ke Verifikasi GIS
                </button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* Modal Detail & Kepatuhan SOP LC */}
      <Dialog open={Boolean(detailModalItem)} onOpenChange={(open) => !open && setDetailModalItem(null)}>
        {detailModalItem && (
          <DialogContent className="sm:max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                Inspeksi SOP LC • Blok {detailModalItem.blok}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {detailModalItem.nomor_spk} • {detailModalItem.estate} ({detailModalItem.afdeling})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs mt-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-gray-800/30 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Kontraktor:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{detailModalItem.kontraktor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Luas Stacking Tuntas:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {detailModalItem.luas_stacking_ha} Ha ({detailModalItem.progres_pct}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ketinggian Tunggul:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Sesuai SOP (≤50/100/150cm)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Buffer Sempadan Sungai:</span>
                  <span className={detailModalItem.buffer_sungai_aman ? "font-semibold text-emerald-600 dark:text-emerald-400" : "font-semibold text-rose-600 dark:text-rose-400"}>
                    {detailModalItem.buffer_sungai_aman ? "Aman (Buffer 50m)" : "Wajib Dipasang Patok Batas"}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Catatan Pengawas Lapangan:</span>
                <p className="rounded-lg bg-gray-50 p-2.5 text-gray-600 dark:bg-gray-800/50 dark:text-gray-300 border border-gray-100 dark:border-gray-800">
                  {detailModalItem.catatan_lapangan}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailModalItem(null)}
                  className="rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer shadow-theme-xs"
                >
                  Tutup
                </button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
