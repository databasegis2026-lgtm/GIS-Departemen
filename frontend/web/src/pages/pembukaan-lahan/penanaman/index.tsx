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

export interface PlantingItem {
  id: string;
  nomor_spk_tanam: string;
  blok: string;
  region: "REGION 1" | "REGION 2" | "REGION 3";
  estate: string;
  afdeling: string;
  varietas_bibit: string;
  batch_nursery: string;
  luas_netto_tanam_ha: number;
  luas_rencana_blok_ha: number;
  jumlah_pokok_ditanam: number;
  target_pokok_blok: number;
  sph_realisasi: number;
  sph_standar: number; // 148 datar, 136 teras kontur
  pola_tanam: "Segitiga Sama Sisi (8.8m x 7.6m)" | "Teras Kontur (Pancang Violle 8.2m)";
  status_lcc_kacangan: "Rapat (>90%)" | "Sedang (60-90%)" | "Baru Tanam (<60%)";
  mandor_tanam: string;
  shp_planting_name?: string;
  shp_upload_date?: string;
  status_bapp_tanam: "Proses Tanam Lapangan" | "Sensus Pokok Tanam" | "Verifikasi GIS JKO" | "BAPP Masuk Master Data";
  tanggal_mulai_tanam: string;
  catatan_agronomi: string;
}

const MOCK_PLANTING_DATA: PlantingItem[] = [
  {
    id: "tnm-01",
    nomor_spk_tanam: "TNM/BUM/2026/003",
    blok: "D04",
    region: "REGION 2",
    estate: "BUM 5",
    afdeling: "AFD 22",
    varietas_bibit: "DxP Dami Mas",
    batch_nursery: "NUR-BUM5-LOT1",
    luas_netto_tanam_ha: 22.0,
    luas_rencana_blok_ha: 25.0,
    jumlah_pokok_ditanam: 2992,
    target_pokok_blok: 3400,
    sph_realisasi: 136.0,
    sph_standar: 136,
    pola_tanam: "Teras Kontur (Pancang Violle 8.2m)",
    status_lcc_kacangan: "Rapat (>90%)",
    mandor_tanam: "Supardi / Tim Tanam BUM 5",
    shp_planting_name: "shp_tanam_bum5_d04_draft.zip",
    shp_upload_date: "23 Feb 2026",
    status_bapp_tanam: "Proses Tanam Lapangan",
    tanggal_mulai_tanam: "10 Feb 2026",
    catatan_agronomi: "Ketinggian bibit rata-rata 1.2m di Main Nursery. Penanaman mengikuti kontur lereng teras bersambung.",
  },
  {
    id: "tnm-02",
    nomor_spk_tanam: "TNM/BUM/2026/002",
    blok: "B09",
    region: "REGION 1",
    estate: "BUM 1",
    afdeling: "AFD 3",
    varietas_bibit: "DxP Marihat PPKS",
    batch_nursery: "NUR-BUM1-LOT4",
    luas_netto_tanam_ha: 24.2,
    luas_rencana_blok_ha: 24.2,
    jumlah_pokok_ditanam: 3582,
    target_pokok_blok: 3582,
    sph_realisasi: 148.0,
    sph_standar: 148,
    pola_tanam: "Segitiga Sama Sisi (8.8m x 7.6m)",
    status_lcc_kacangan: "Rapat (>90%)",
    mandor_tanam: "Hendra Wijaya / Asisten AFD 3",
    shp_planting_name: "shp_tanam_bum1_b09_final.zip",
    shp_upload_date: "16 Feb 2026",
    status_bapp_tanam: "BAPP Masuk Master Data",
    tanggal_mulai_tanam: "15 Jan 2026",
    catatan_agronomi: "Penanaman 28 baris tanam (14 utara, 14 selatan) dan 32 ancak lengkap. Sensus pokok 100% tegak.",
  },
  {
    id: "tnm-03",
    nomor_spk_tanam: "TNM/BSL/2026/005",
    blok: "C12",
    region: "REGION 3",
    estate: "BSL",
    afdeling: "AFD 2",
    varietas_bibit: "DxP Socfindo",
    batch_nursery: "NUR-BSL-LOT2",
    luas_netto_tanam_ha: 15.0,
    luas_rencana_blok_ha: 25.0,
    jumlah_pokok_ditanam: 2220,
    target_pokok_blok: 3700,
    sph_realisasi: 148.0,
    sph_standar: 148,
    pola_tanam: "Segitiga Sama Sisi (8.8m x 7.6m)",
    status_lcc_kacangan: "Sedang (60-90%)",
    mandor_tanam: "Rian Hidayat / Askep BSL",
    shp_planting_name: "shp_tanam_bsl_c12_partial.zip",
    shp_upload_date: "20 Feb 2026",
    status_bapp_tanam: "Sensus Pokok Tanam",
    tanggal_mulai_tanam: "05 Feb 2026",
    catatan_agronomi: "Baris utara ancak 01 s.d. 16 selesai ditanam. Dilanjutkan pemancangan dan lubang tanam ancak selatan.",
  },
];

export default function PenanamanPage() {
  const [data, setData] = useState<PlantingItem[]>(MOCK_PLANTING_DATA);
  const [selectedRegion, setSelectedRegion] = useState<string>("Semua Region");
  const [selectedEstate, setSelectedEstate] = useState<string>("Semua Estate");
  const [bappFilter, setBappFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [targetUploadItem, setTargetUploadItem] = useState<PlantingItem | null>(null);
  const [detailModalItem, setDetailModalItem] = useState<PlantingItem | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState("");

  // Filter Data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (selectedRegion !== "Semua Region" && item.region !== selectedRegion) return false;
      if (selectedEstate !== "Semua Estate" && item.estate !== selectedEstate) return false;
      if (bappFilter !== "all" && item.status_bapp_tanam !== bappFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.nomor_spk_tanam.toLowerCase().includes(q) ||
        item.blok.toLowerCase().includes(q) ||
        item.varietas_bibit.toLowerCase().includes(q) ||
        item.estate.toLowerCase().includes(q) ||
        item.afdeling.toLowerCase().includes(q) ||
        item.mandor_tanam.toLowerCase().includes(q)
      );
    });
  }, [data, selectedRegion, selectedEstate, bappFilter, searchQuery]);

  // Statistik Ringkasan
  const stats = useMemo(() => {
    const totalLuasTanam = data.reduce((a, b) => a + b.luas_netto_tanam_ha, 0);
    const totalPokokTanam = data.reduce((a, b) => a + b.jumlah_pokok_ditanam, 0);
    const totalTargetPokok = data.reduce((a, b) => a + b.target_pokok_blok, 0);
    const countBappFinal = data.filter((d) => d.status_bapp_tanam === "BAPP Masuk Master Data").length;

    return {
      totalLuasTanam,
      totalPokokTanam,
      progressPokokPct: Math.round((totalPokokTanam / totalTargetPokok) * 100),
      countBappFinal,
      totalShp: data.filter((d) => Boolean(d.shp_planting_name)).length,
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
            shp_planting_name: uploadedFileName,
            shp_upload_date: "24 Feb 2026",
            status_bapp_tanam: "Verifikasi GIS JKO",
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
        title="Penanaman (Tanam) - PT BUM & BSL"
        description="Monitoring penanaman bibit kelapa sawit unggul DxP, standar SPH baku, ancak panen, dan validasi shapefile sensus tanam"
      />

      <PageBreadcrumb pageTitle="Penanaman (Tanam)" />

      {/* Header */}
      <header className="flex flex-col gap-2 border-b border-gray-200 pb-3.5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between -mt-3">
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">
            Penanaman (TNM - Penanaman Bibit Baru)
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Penanaman bibit unggul DxP Tenera sesuai standar Blok Ideal 25 Ha, pola segitiga sama sisi, teras kontur, dan LCC Mucuna bracteata.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            {stats.totalPokokTanam.toLocaleString()} Pokok Tertanam
          </span>
          <span className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 shadow-theme-xs">
            {stats.countBappFinal} BAPP Masuk Master Data
          </span>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Luas Netto Tertanam
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalLuasTanam.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500">Ha</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Areal siap rawat TBM 1
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Populasi Bibit Tanam
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.totalPokokTanam.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">Pokok</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Bibit unggul DxP tersertifikasi
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Capaian Target Pokok
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.progressPokokPct}%
            </span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Terhadap kapasitas master blok
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            SPH Standar Baku
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              148 / 136
            </span>
            <span className="text-xs text-gray-500">Pkk/Ha</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Datar (148) & Teras Kontur (136)
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs col-span-2 sm:col-span-4 lg:col-span-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            SHP Sensus Tanam
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalShp}
            </span>
            <span className="text-xs text-gray-500">File</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Titik pokok & poligon tertanam
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
            placeholder="Cari SPK tanam, blok, varietas bibit..."
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
            <option value="Proses Tanam Lapangan">Proses Tanam Lapangan</option>
            <option value="Sensus Pokok Tanam">Sensus Pokok Tanam</option>
            <option value="Verifikasi GIS JKO">Verifikasi GIS JKO</option>
            <option value="BAPP Masuk Master Data">BAPP Masuk Master Data</option>
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

      {/* Tabel Data Penanaman */}
      <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-semibold uppercase text-gray-600 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300">
            <tr>
              <th className="px-3.5 py-3">Blok & No. SPK</th>
              <th className="px-3.5 py-3">Varietas & Batch Nursery</th>
              <th className="px-3 py-3">Realisasi Tanam (Ha / Pkk)</th>
              <th className="px-3 py-3">SPH & Pola Tanam</th>
              <th className="px-3 py-3">Cover Crop (LCC)</th>
              <th className="px-3.5 py-3">File SHP Tanam</th>
              <th className="px-3.5 py-3">Status BAPP</th>
              <th className="px-3.5 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-xs text-gray-500">
                  Tidak ada blok penanaman yang sesuai kriteria filter.
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
                      {item.nomor_spk_tanam}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {item.estate} • {item.afdeling}
                    </div>
                  </td>

                  <td className="px-3.5 py-3">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {item.varietas_bibit}
                    </div>
                    <div className="text-[10px] font-mono text-gray-400">
                      {item.batch_nursery}
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {item.jumlah_pokok_ditanam.toLocaleString()} Pokok
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {item.luas_netto_tanam_ha.toFixed(1)} / {item.luas_rencana_blok_ha.toFixed(1)} Ha
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      SPH {item.sph_realisasi} (Baku: {item.sph_standar})
                    </div>
                    <div className="text-[10px] text-gray-400 truncate max-w-[150px]" title={item.pola_tanam}>
                      {item.pola_tanam}
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <span className="inline-block rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {item.status_lcc_kacangan}
                    </span>
                  </td>

                  {/* File SHP Tanam */}
                  <td className="px-3.5 py-3">
                    {item.shp_planting_name ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-brand-600 dark:text-brand-400">
                          <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <span className="max-w-[95px] truncate" title={item.shp_planting_name}>
                            {item.shp_planting_name}
                          </span>
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400">Belum ada SHP</span>
                    )}
                  </td>

                  <td className="px-3.5 py-3">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        item.status_bapp_tanam === "BAPP Masuk Master Data"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50"
                          : item.status_bapp_tanam === "Verifikasi GIS JKO"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50"
                            : "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50"
                      }`}
                    >
                      {item.status_bapp_tanam}
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
                        title="Unggah SHP Realisasi Sensus Tanam"
                      >
                        Unggah SHP
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailModalItem(item)}
                        className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        Detail
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Modal Unggah SHP Penanaman */}
      <Dialog open={uploadModalOpen} onOpenChange={(open) => !open && setUploadModalOpen(false)}>
        {targetUploadItem && (
          <DialogContent className="sm:max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                Unggah SHP Penanaman • Blok {targetUploadItem.blok}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
                Pilih file shapefile / point sensus pokok tanam atau poligon batas areal tertanam baru
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
                  {uploadedFileName ? uploadedFileName : "Klik atau seret file SHP tanam ke sini"}
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  Format didukung: .zip (Shapefile poligon / point sensus), .shp, .geojson, .kml
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
                  Kirim ke Verifikasi GIS JKO
                </button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* Modal Detail & Agronomi Tanam */}
      <Dialog open={Boolean(detailModalItem)} onOpenChange={(open) => !open && setDetailModalItem(null)}>
        {detailModalItem && (
          <DialogContent className="sm:max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                Rincian Tanam • Blok {detailModalItem.blok}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {detailModalItem.nomor_spk_tanam} • {detailModalItem.estate} ({detailModalItem.afdeling})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs mt-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-gray-800/30 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Varietas Bibit:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{detailModalItem.varietas_bibit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Batch Main Nursery:</span>
                  <span className="font-mono text-gray-900 dark:text-white">{detailModalItem.batch_nursery}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Populasi Pokok Tertanam:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {detailModalItem.jumlah_pokok_ditanam.toLocaleString()} Pokok (SPH {detailModalItem.sph_realisasi})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pola Tanam Geometris:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{detailModalItem.pola_tanam}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Kerapatan Cover Crop (LCC):</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{detailModalItem.status_lcc_kacangan}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Catatan Agronomi & Mandor:</span>
                <p className="rounded-lg bg-gray-50 p-2.5 text-gray-600 dark:bg-gray-800/50 dark:text-gray-300 border border-gray-100 dark:border-gray-800">
                  {detailModalItem.catatan_agronomi}
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
