import { useState, useMemo } from "react";
import { Link } from "react-router";
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

export type AssetCategory =
  | "all"
  | "blok"
  | "pokok"
  | "bangunan"
  | "jalan"
  | "air_konservasi";

export interface AssetItem {
  id: string;
  kode_aset: string;
  nama_aset: string;
  kategori: string;
  kategori_key: AssetCategory;
  region: "REGION 1" | "REGION 2" | "REGION 3";
  estate: string;
  afdeling: string;
  kuantitas: string;
  kondisi: "Baik" | "Perlu Pemeliharaan" | "Kritis / Perbaikan";
  legalitas: "HGU Terbit" | "Sertifikasi ISPO/RSPO" | "Dalam Proses" | "Enclave / Tali Asih";
  keterangan: string;
}

const MOCK_ASSETS: AssetItem[] = [
  {
    id: "ast-01",
    kode_aset: "BLK-BUM1-A05",
    nama_aset: "Master Blok A05 Budidaya",
    kategori: "Batas Wilayah & Blok",
    kategori_key: "blok",
    region: "REGION 1",
    estate: "BUM 1",
    afdeling: "AFD 4",
    kuantitas: "25.00 Ha (3.603 Pokok)",
    kondisi: "Baik",
    legalitas: "Sertifikasi ISPO/RSPO",
    keterangan: "Blok Ideal 25 Ha standar (MR 8m, CR 6m, 32 Ancak panen, varietas Tenera DxP).",
  },
  {
    id: "ast-02",
    kode_aset: "PKS-BUM-01",
    nama_aset: "Pabrik Kelapa Sawit (PMKS Sentral)",
    kategori: "PMKS & Bangunan",
    kategori_key: "bangunan",
    region: "REGION 1",
    estate: "BUM 2",
    afdeling: "AFD 6",
    kuantitas: "Kapasitas 60 Ton TBS/Jam",
    kondisi: "Baik",
    legalitas: "HGU Terbit",
    keterangan: "Kompleks pabrik, stasiun timbangan otomatis, 4 tangki timbun CPO, dan 6 kolam IPAL.",
  },
  {
    id: "ast-03",
    kode_aset: "MR-BUM2-01",
    nama_aset: "Main Road (Jalan Poros Penghubung)",
    kategori: "Jalan & Infrastruktur",
    kategori_key: "jalan",
    region: "REGION 1",
    estate: "BUM 2",
    afdeling: "AFD 5",
    kuantitas: "14.2 km (Lebar 8m)",
    kondisi: "Baik",
    legalitas: "HGU Terbit",
    keterangan: "Jalan pengerasan batu laterit penghubung Estate ke PMKS dengan parit pembuang.",
  },
  {
    id: "ast-04",
    kode_aset: "HCV-SG-03",
    nama_aset: "Sempadan Sungai & Area Konservasi",
    kategori: "Konservasi & Air",
    kategori_key: "air_konservasi",
    region: "REGION 2",
    estate: "BUM 5",
    afdeling: "AFD 21",
    kuantitas: "42.5 Ha (Buffer 50m & 100m)",
    kondisi: "Baik",
    legalitas: "Sertifikasi ISPO/RSPO",
    keterangan: "Koridor sempadan Sungai Sampit. Zona HCV terlarang untuk pupuk kimia dan herbisida.",
  },
  {
    id: "ast-05",
    kode_aset: "EMP-BUM6-01",
    nama_aset: "Emplasemen Sentral & Perumahan",
    kategori: "PMKS & Bangunan",
    kategori_key: "bangunan",
    region: "REGION 2",
    estate: "BUM 6",
    afdeling: "AFD 24",
    kuantitas: "64 Unit Barak & Kantor",
    kondisi: "Baik",
    legalitas: "HGU Terbit",
    keterangan: "Kantor Estate, Klinik Pratama, Barak Karyawan G10, dan Bengkel Perawatan Traksi.",
  },
  {
    id: "ast-06",
    kode_aset: "NUR-BUM4-01",
    nama_aset: "Main Nursery Pembibitan Kelapa Sawit",
    kategori: "Batas Wilayah & Blok",
    kategori_key: "blok",
    region: "REGION 1",
    estate: "BUM 4",
    afdeling: "AFD 17",
    kuantitas: "12.0 Ha (125.000 Bibit)",
    kondisi: "Baik",
    legalitas: "HGU Terbit",
    keterangan: "Bibit siap salur varietas Marihat & Dami Mas DxP bersertifikat PPKS.",
  },
  {
    id: "ast-07",
    kode_aset: "CR-BSL-12",
    nama_aset: "Collection Road & Titik TPH Blok C",
    kategori: "Jalan & Infrastruktur",
    kategori_key: "jalan",
    region: "REGION 3",
    estate: "BSL",
    afdeling: "AFD 2",
    kuantitas: "8.6 km (Lebar 6m)",
    kondisi: "Perlu Pemeliharaan",
    legalitas: "HGU Terbit",
    keterangan: "Jalur angkut TBS dengan interval 1 TPH per 2-3 ancak. Permukaan perlu perataan grader.",
  },
  {
    id: "ast-08",
    kode_aset: "PKK-BSL-C12",
    nama_aset: "Populasi Pokok Sawit Menghasilkan (TM)",
    kategori: "Pokok Sawit",
    kategori_key: "pokok",
    region: "REGION 3",
    estate: "BSL",
    afdeling: "AFD 2",
    kuantitas: "3.580 Pokok (SPH 147.9)",
    kondisi: "Baik",
    legalitas: "HGU Terbit",
    keterangan: "Tanam tahun 2018. Sensus pokok terakhir mencatat 99.4% pokok produktif.",
  },
];

// Sub-modul Aset untuk Navigasi Cepat
const ASSET_SUBMODULES = [
  {
    title: "Batas Administrasi",
    desc: "10 Estate, 45 Afdeling, dan 1.053 Master Blok",
    path: "/aset/batas-administrasi",
    icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
  },
  {
    title: "Pokok Sawit & Sensus",
    desc: "Monitoring SPH, sensus pokok, dan populasi TM/TBM",
    path: "/aset/pokok-sawit",
    icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  },
  {
    title: "Pabrik Kelapa Sawit (PMKS)",
    desc: "Stasiun pengolahan, timbangan, tangki CPO, dan IPAL",
    path: "/aset/pmks",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    title: "Fasilitas Emplasment",
    desc: "808 Fasilitas perumahan, kantor, klinik, dan workshop",
    path: "/aset/emplasment",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    title: "Pembibitan (Nursery)",
    desc: "Pre-Nursery dan Main Nursery varietas unggul DxP",
    path: "/aset/pembibitan",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  {
    title: "Hidrologi & Sungai",
    desc: "13 Sungai utama dan proteksi sempadan (50m & 100m)",
    path: "/aset/sungai",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  {
    title: "Topografi & Kontur",
    desc: "Garis elevasi kontur 1m, kelerengan, dan lereng teras",
    path: "/aset/topografi",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    title: "Area Konservasi & HCV",
    desc: "Situs budaya, mata air, dan kawasan lindung flora/fauna",
    path: "/aset/area-konservasi",
    icon: "M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01",
  },
  {
    title: "Hirarki Areal Statement",
    desc: "Form 001: Rekonsiliasi Plantable vs Unplantable kebun",
    path: "/aset/hirarki-aresta",
    icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
];

export default function AsetPage() {
  const [selectedRegion, setSelectedRegion] = useState<string>("Semua Region");
  const [selectedEstate, setSelectedEstate] = useState<string>("Semua Estate");
  const [activeCategory, setActiveCategory] = useState<AssetCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailModalItem, setDetailModalItem] = useState<AssetItem | null>(null);

  // Filter Aset
  const filteredAssets = useMemo(() => {
    return MOCK_ASSETS.filter((item) => {
      if (selectedRegion !== "Semua Region" && item.region !== selectedRegion) return false;
      if (selectedEstate !== "Semua Estate" && item.estate !== selectedEstate) return false;
      if (activeCategory !== "all" && item.kategori_key !== activeCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.nama_aset.toLowerCase().includes(q) ||
        item.kode_aset.toLowerCase().includes(q) ||
        item.estate.toLowerCase().includes(q) ||
        item.afdeling.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        item.keterangan.toLowerCase().includes(q)
      );
    });
  }, [selectedRegion, selectedEstate, activeCategory, searchQuery]);

  return (
    <div className="space-y-5">
      <PageMeta
        title="Aset Kebun & Inventarisasi Spasial - PT BUM & BSL"
        description="Master data geospasial, batas blok budidaya, fasilitas emplasment, PMKS, dan infrastruktur"
      />

      <PageBreadcrumb pageTitle="Aset Kebun" />

      {/* Header */}
      <header className="flex flex-col gap-2 border-b border-gray-200 pb-3.5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between -mt-3">
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">
            Aset Kebun & Inventarisasi Spasial
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Inventarisasi 23 layer master data spasial, 1.053 blok budidaya, 808 fasilitas emplasment, dan infrastruktur holding.
          </p>
        </div>

        {/* Info Total Wilayah */}
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-lg border border-gray-200 bg-white px-3 py-1 font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 shadow-theme-xs">
            10 Estate • 45 Afdeling
          </span>
          <span className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1 font-semibold text-brand-700 dark:border-brand-900/60 dark:bg-brand-950/40 dark:text-brand-300 shadow-theme-xs">
            1.053 Master Blok
          </span>
        </div>
      </header>

      {/* KPI Cards Ringkasan Aset */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Total Areal HGU
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              26.325
            </span>
            <span className="text-xs text-gray-500">Ha</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            PT BUM & PT BSL Holding
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Areal Tertanam (TM/TBM)
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              23.840
            </span>
            <span className="text-xs text-gray-500">Ha</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            90.5% Luas Efektif Tanam
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Fasilitas & Bangunan
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              808
            </span>
            <span className="text-xs text-gray-500">Unit</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            PMKS, Kantor, Barak, Workshop
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Jaringan Jalan (MR/CR)
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              1.124
            </span>
            <span className="text-xs text-gray-500">km</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            MR (8m) & CR (6m) Terawat
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Konservasi & HCV
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              1.485
            </span>
            <span className="text-xs text-gray-500">Ha</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            13 Sungai & Sempadan 50-100m
          </div>
        </div>
      </section>

      {/* Navigasi Cepat 9 Sub-Modul Aset */}
      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Eksplorasi Sub-Katalog Aset Spasial
          </h2>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            9 Kategori Aset Terdaftar
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ASSET_SUBMODULES.map((sub) => (
            <Link
              key={sub.path}
              to={sub.path}
              className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3.5 transition-all hover:border-brand-500/50 hover:bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/50 dark:hover:bg-gray-800/50 shadow-theme-xs cursor-pointer"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 group-hover:scale-105 transition-transform">
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d={sub.icon} />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-xs text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {sub.title}
                  </h3>
                  <svg className="size-3.5 text-gray-400 group-hover:translate-x-0.5 group-hover:text-brand-500 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
                <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                  {sub.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Toolbar Filter & Tabel Inventaris */}
      <section className="space-y-3">
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          {/* Tab Filter Kategori */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: "all" as AssetCategory, label: "Semua Kategori" },
              { id: "blok" as AssetCategory, label: "Batas Wilayah & Blok" },
              { id: "pokok" as AssetCategory, label: "Pokok Sawit" },
              { id: "bangunan" as AssetCategory, label: "PMKS & Bangunan" },
              { id: "jalan" as AssetCategory, label: "Jalan & Infrastruktur" },
              { id: "air_konservasi" as AssetCategory, label: "Konservasi & Air" },
            ].map((tab) => {
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id)}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer ${isActive
                    ? "bg-brand-500 text-white font-semibold shadow-xs"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
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
                placeholder="Cari kode aset, nama objek, lokasi..."
                className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-8.5 pr-3 text-xs text-gray-800 placeholder-gray-400 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
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
                Total: <strong className="font-semibold text-gray-900 dark:text-white">{filteredAssets.length}</strong> aset
              </span>
            </div>
          </div>
        </div>

        {/* Tabel Data Aset */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-semibold uppercase text-gray-600 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300">
              <tr>
                <th className="px-3.5 py-3">Kode & Nama Aset</th>
                <th className="px-3.5 py-3">Kategori</th>
                <th className="px-3 py-3">Lokasi</th>
                <th className="px-3 py-3">Kuantitas / Kapasitas</th>
                <th className="px-3 py-3">Kondisi</th>
                <th className="px-3.5 py-3">Status Legalitas</th>
                <th className="px-3.5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-gray-500">
                    Tidak ada aset yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-3.5 py-3">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {item.nama_aset}
                      </div>
                      <div className="font-mono text-[10px] text-gray-400">
                        {item.kode_aset}
                      </div>
                    </td>

                    <td className="px-3.5 py-3">
                      <span className="inline-block rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {item.kategori}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      <div className="font-medium text-gray-800 dark:text-gray-200">
                        {item.estate} • {item.afdeling}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {item.region}
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {item.kuantitas}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${item.kondisi === "Baik"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50"
                          : item.kondisi === "Perlu Pemeliharaan"
                            ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50"
                            : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50"
                          }`}
                      >
                        {item.kondisi}
                      </span>
                    </td>

                    <td className="px-3.5 py-3">
                      <span className="text-[11px] text-gray-600 dark:text-gray-400">
                        {item.legalitas}
                      </span>
                    </td>

                    <td className="px-3.5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setDetailModalItem(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 shadow-theme-xs cursor-pointer transition-colors"
                      >
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Detail Aset */}
      <Dialog open={Boolean(detailModalItem)} onOpenChange={(open) => !open && setDetailModalItem(null)}>
        {detailModalItem && (
          <DialogContent className="sm:max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                {detailModalItem.nama_aset}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {detailModalItem.kode_aset} • {detailModalItem.kategori}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs mt-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-gray-800/30 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Lokasi Kebun:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {detailModalItem.estate} ({detailModalItem.afdeling}) - {detailModalItem.region}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Dimensi / Kapasitas:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{detailModalItem.kuantitas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Kondisi Fisik:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{detailModalItem.kondisi}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status Legalitas:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{detailModalItem.legalitas}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Deskripsi & Catatan Spasial:</span>
                <p className="rounded-lg bg-gray-50 p-2.5 text-gray-600 dark:bg-gray-800/50 dark:text-gray-300 border border-gray-100 dark:border-gray-800">
                  {detailModalItem.keterangan}
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
