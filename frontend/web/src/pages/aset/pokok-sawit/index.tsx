import { useState, useMemo } from "react";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";

export interface PalmTreeCensus {
  id: string;
  blok: string;
  estate: string;
  afdeling: string;
  region: "REGION 1" | "REGION 2" | "REGION 3";
  tahun_tanam: number;
  status_tanaman: "TM (Tanaman Menghasilkan)" | "TBM 3" | "TBM 2" | "TBM 1";
  varietas: string;
  luas_netto_ha: number;
  jumlah_pokok_sensus: number;
  sph_aktual: number;
  sph_standar_baku: number;
  pokok_produktif: number;
  pokok_abnormal: number;
  pokok_mati_sisipan: number;
  persentase_tegakan_pct: number;
  tanggal_sensus_terakhir: string;
}

const MOCK_PALM_CENSUS: PalmTreeCensus[] = [
  {
    id: "pkk-01",
    blok: "A05",
    estate: "BUM 1",
    afdeling: "AFD 4",
    region: "REGION 1",
    tahun_tanam: 2016,
    status_tanaman: "TM (Tanaman Menghasilkan)",
    varietas: "DxP Tenera Dami Mas",
    luas_netto_ha: 24.2,
    jumlah_pokok_sensus: 3582,
    sph_aktual: 148.0,
    sph_standar_baku: 148,
    pokok_produktif: 3540,
    pokok_abnormal: 24,
    pokok_mati_sisipan: 18,
    persentase_tegakan_pct: 99.4,
    tanggal_sensus_terakhir: "15 Jan 2026",
  },
  {
    id: "pkk-02",
    blok: "B01",
    estate: "BUM 2",
    afdeling: "AFD 6",
    region: "REGION 1",
    tahun_tanam: 2017,
    status_tanaman: "TM (Tanaman Menghasilkan)",
    varietas: "DxP Marihat PPKS",
    luas_netto_ha: 25.0,
    jumlah_pokok_sensus: 3675,
    sph_aktual: 147.0,
    sph_standar_baku: 148,
    pokok_produktif: 3610,
    pokok_abnormal: 35,
    pokok_mati_sisipan: 30,
    persentase_tegakan_pct: 99.1,
    tanggal_sensus_terakhir: "20 Jan 2026",
  },
  {
    id: "pkk-03",
    blok: "C12",
    estate: "BSL",
    afdeling: "AFD 2",
    region: "REGION 3",
    tahun_tanam: 2024,
    status_tanaman: "TBM 2",
    varietas: "DxP Socfindo",
    luas_netto_ha: 18.5,
    jumlah_pokok_sensus: 2738,
    sph_aktual: 148.0,
    sph_standar_baku: 148,
    pokok_produktif: 2715,
    pokok_abnormal: 12,
    pokok_mati_sisipan: 11,
    persentase_tegakan_pct: 99.5,
    tanggal_sensus_terakhir: "05 Feb 2026",
  },
  {
    id: "pkk-04",
    blok: "E08",
    estate: "BUM 6",
    afdeling: "AFD 25",
    region: "REGION 2",
    tahun_tanam: 2025,
    status_tanaman: "TBM 1",
    varietas: "DxP Topaz",
    luas_netto_ha: 24.8,
    jumlah_pokok_sensus: 3372,
    sph_aktual: 136.0,
    sph_standar_baku: 136,
    pokok_produktif: 3340,
    pokok_abnormal: 18,
    pokok_mati_sisipan: 14,
    persentase_tegakan_pct: 99.2,
    tanggal_sensus_terakhir: "12 Feb 2026",
  },
];

export default function PokokSawitPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredItems = useMemo(() => {
    return MOCK_PALM_CENSUS.filter((item) => {
      if (statusFilter !== "all" && item.status_tanaman !== statusFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.blok.toLowerCase().includes(q) ||
        item.estate.toLowerCase().includes(q) ||
        item.afdeling.toLowerCase().includes(q) ||
        item.varietas.toLowerCase().includes(q)
      );
    });
  }, [statusFilter, searchQuery]);

  return (
    <div className="space-y-4">
      <PageMeta
        title="Pokok Sawit & Sensus Populasi - Departemen GIS PT BUM & BSL"
        description="Inventarisasi populasi pokok sawit, SPH baku, sensus pokok TM/TBM, dan titik sisipan"
      />

      <PageBreadcrumb pageTitle="Pokok Sawit & Sensus" />

      {/* Header */}
      <header className="flex flex-col gap-2 border-b border-gray-200 pb-3.5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between -mt-3">
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">
            Inventarisasi Pokok Sawit & Sensus Tegakan
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Sensus berkala populasi pokok sawit, evaluasi Stand Per Hektar (SPH), dan sebaran spasial TM vs TBM.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            SPH Rata-rata: 146.8 Pokok/Ha
          </span>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Total Pokok Sensus</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">3.485.200</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Holding PT BUM & BSL</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Pokok Produktif (TM)</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">3.120.400</div>
          <div className="text-[11px] text-gray-500 mt-0.5">89.5% dari total populasi</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Tanaman Belum Menghasilkan</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">364.800</div>
          <div className="text-[11px] text-gray-500 mt-0.5">TBM 1, TBM 2, dan TBM 3</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Tegakan Sehat</div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">99.3%</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Kematian pokok &lt;1%</div>
        </div>
      </section>

      {/* Toolbar Filter */}
      <section className="flex flex-col gap-2.5 rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari blok, estate, afdeling, varietas..."
            className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-8.5 pr-3 text-xs text-gray-800 placeholder-gray-400 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-800 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 cursor-pointer"
          >
            <option value="all">Semua Status Tanaman</option>
            <option value="TM (Tanaman Menghasilkan)">TM (Tanaman Menghasilkan)</option>
            <option value="TBM 1">TBM 1</option>
            <option value="TBM 2">TBM 2</option>
            <option value="TBM 3">TBM 3</option>
          </select>
        </div>
      </section>

      {/* Tabel Sensus */}
      <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-semibold uppercase text-gray-600 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300">
            <tr>
              <th className="px-3.5 py-3">Blok & Lokasi</th>
              <th className="px-3.5 py-3">Varietas & Thn Tanam</th>
              <th className="px-3 py-3">Status Tanaman</th>
              <th className="px-3 py-3">Total Pokok Sensus</th>
              <th className="px-3 py-3">SPH Aktual / Baku</th>
              <th className="px-3 py-3">Pokok Produktif</th>
              <th className="px-3 py-3">Tegakan (%)</th>
              <th className="px-3.5 py-3 text-right">Tgl Sensus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                <td className="px-3.5 py-3">
                  <div className="font-semibold text-gray-900 dark:text-white font-mono">Blok {item.blok}</div>
                  <div className="text-[10px] text-gray-400">{item.estate} • {item.afdeling}</div>
                </td>
                <td className="px-3.5 py-3">
                  <div className="font-semibold text-gray-800 dark:text-gray-200">{item.varietas}</div>
                  <div className="text-[10px] text-gray-400">Tahun {item.tahun_tanam}</div>
                </td>
                <td className="px-3 py-3">
                  <span className="inline-block rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {item.status_tanaman}
                  </span>
                </td>
                <td className="px-3 py-3 font-semibold text-gray-900 dark:text-white">
                  {item.jumlah_pokok_sensus.toLocaleString()} Pokok
                </td>
                <td className="px-3 py-3">
                  <span className="font-semibold text-brand-600 dark:text-brand-400">{item.sph_aktual}</span>
                  <span className="text-[10px] text-gray-400"> / {item.sph_standar_baku}</span>
                </td>
                <td className="px-3 py-3 text-emerald-600 dark:text-emerald-400 font-medium">
                  {item.pokok_produktif.toLocaleString()} ({item.persentase_tegakan_pct}%)
                </td>
                <td className="px-3 py-3">
                  <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {item.persentase_tegakan_pct}%
                  </span>
                </td>
                <td className="px-3.5 py-3 text-right font-mono text-[10px] text-gray-400">
                  {item.tanggal_sensus_terakhir}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
