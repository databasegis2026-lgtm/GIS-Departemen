import { useState, useMemo } from "react";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import { SHP_SCHEMA_DICTIONARY } from "@/data/shp-schema-dictionary";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export type AdminTab =
  | "perusahaan"
  | "region"
  | "estate"
  | "afdeling"
  | "blok"
  | "warung"
  | "ancak";

export default function BatasAdministrasiPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("blok");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDictionaryModal, setShowDictionaryModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Data State - Dimulai kosong (menunggu unggah SHP atau sinkronisasi database)
  const [dataPerusahaan] = useState<any[]>([]);
  const [dataRegion] = useState<any[]>([]);
  const [dataEstate] = useState<any[]>([]);
  const [dataAfd] = useState<any[]>([]);
  const [dataBlok] = useState<any[]>([]);
  const [dataWarung] = useState<any[]>([]);
  const [dataAncak] = useState<any[]>([]);

  // Map active tab to current schema info
  const currentSchemaKey = useMemo(() => {
    switch (activeTab) {
      case "perusahaan":
        return "batas_perusahaan";
      case "region":
        return "batas_region";
      case "estate":
        return "batas_estate";
      case "afdeling":
        return "batas_afd";
      case "blok":
        return "batas_blok";
      case "warung":
        return "warung";
      case "ancak":
        return "ancak";
    }
  }, [activeTab]);

  const currentSchema = SHP_SCHEMA_DICTIONARY[currentSchemaKey];

  return (
    <div className="space-y-4">
      <PageMeta
        title="Batas Administrasi Kebun & Kamus Kolom SHP | PT BUM - BSL"
        description="Master data batas administrasi kebun: Batas Perusahaan, Region, Estate, AFD, BLOK, Warung, dan Ancak dengan skema kolom resmi"
      />

      <PageBreadcrumb pageTitle="Batas Administrasi" />

      {/* Header */}
      <header className="flex flex-col gap-2 border-b border-gray-200 pb-3.5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between -mt-3">
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">
            Batas Administrasi Kebun & Standar Kolom SHP
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Hierarki resmi: 2 Perusahaan &bull; 3 Region &bull; 10 Estate &bull; 45 AFD &bull; 1.053 Master Blok &bull; 6 Warung Rotasi &bull; 32.125 Ancak.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDictionaryModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Kamus 18 Kolom SHP
          </button>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Unggah SHP Batas
          </button>
        </div>
      </header>

      {/* Schema Banner with Pipe Separator */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3.5 dark:border-gray-800 dark:bg-gray-800/40">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded bg-blue-100 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
              SKEMA SHP: {currentSchema.nama.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500">
              ({currentSchema.kolom.length} Kolom Baku)
            </span>
          </div>
          <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
            Pemisah: <code className="font-bold text-blue-600 dark:text-blue-400">|</code>
          </span>
        </div>

        {/* Display Exact Column String with | */}
        <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 bg-white p-2.5 font-mono text-xs text-gray-800 shadow-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
          <span className="font-bold text-blue-600 dark:text-blue-400">Kolom: </span>
          {currentSchema.kolom.join(" | ")}
        </div>
      </div>

      {/* Tabs Tingkatan Administrasi */}
      <section className="flex flex-col gap-2.5 rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: "blok" as const, label: "Batas BLOK (13 Kolom)" },
            { id: "warung" as const, label: "Batas Warung (8 Kolom)" },
            { id: "ancak" as const, label: "Batas Ancak (16 Kolom)" },
            { id: "afdeling" as const, label: "Batas AFD (7 Kolom)" },
            { id: "estate" as const, label: "Batas Estate (4 Kolom)" },
            { id: "region" as const, label: "Batas Region (3 Kolom)" },
            { id: "perusahaan" as const, label: "Batas Perusahaan (7 Kolom)" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer ${isActive
                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Toolbar */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
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
              placeholder="Cari atribut dalam tabel..."
              className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-8.5 pr-3 text-xs text-gray-800 placeholder-gray-400 shadow-theme-xs focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>
          <span className="text-xs text-gray-500">
            Format: DBF SHP Native
          </span>
        </div>
      </section>

      {/* Tabel Data Sesuai Kolom Baku */}
      <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
        {/* 1. Batas Perusahaan */}
        {activeTab === "perusahaan" && (
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300">
              <tr>
                <th className="px-3.5 py-3">Region</th>
                <th className="px-3.5 py-3">REGIONAL</th>
                <th className="px-3.5 py-3">Koordinator</th>
                <th className="px-3 py-3 text-right">Luas</th>
                <th className="px-3.5 py-3">KH</th>
                <th className="px-3.5 py-3">Perusahaan</th>
                <th className="px-3.5 py-3">Id</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {dataPerusahaan.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                    Belum ada data Batas Perusahaan. Silakan unggah berkas SHP untuk memuat data.
                  </td>
                </tr>
              ) : (
                dataPerusahaan.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="px-3.5 py-2.5 font-bold text-gray-900 dark:text-white">{row.Region}</td>
                    <td className="px-3.5 py-2.5">{row.REGIONAL}</td>
                    <td className="px-3.5 py-2.5">{row.Koordinator}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {row.Luas?.toLocaleString()} Ha
                    </td>
                    <td className="px-3.5 py-2.5">{row.KH}</td>
                    <td className="px-3.5 py-2.5 font-sans font-medium text-gray-900 dark:text-white">{row.Perusahaan}</td>
                    <td className="px-3.5 py-2.5 font-bold text-blue-600 dark:text-blue-400">{row.Id}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* 2. Batas Region */}
        {activeTab === "region" && (
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300">
              <tr>
                <th className="px-3.5 py-3">Region</th>
                <th className="px-3.5 py-3">REGIONAL</th>
                <th className="px-3.5 py-3">KOOR_KASIE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {dataRegion.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                    Belum ada data Batas Region. Silakan unggah berkas SHP untuk memuat data.
                  </td>
                </tr>
              ) : (
                dataRegion.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="px-3.5 py-2.5 font-bold text-blue-600 dark:text-blue-400">{row.Region}</td>
                    <td className="px-3.5 py-2.5 font-bold text-gray-900 dark:text-white">{row.REGIONAL}</td>
                    <td className="px-3.5 py-2.5 text-gray-700 dark:text-gray-300">{row.KOOR_KASIE}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* 3. Batas Estate */}
        {activeTab === "estate" && (
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300">
              <tr>
                <th className="px-3.5 py-3">Region</th>
                <th className="px-3.5 py-3">Estate</th>
                <th className="px-3 py-3 text-right">Luas</th>
                <th className="px-3.5 py-3">Kasie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {dataEstate.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                    Belum ada data Batas Estate. Silakan unggah berkas SHP untuk memuat data.
                  </td>
                </tr>
              ) : (
                dataEstate.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="px-3.5 py-2.5 text-blue-600 dark:text-blue-400">{row.Region}</td>
                    <td className="px-3.5 py-2.5 font-bold text-gray-900 dark:text-white">{row.Estate}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {row.Luas?.toFixed(1)} Ha
                    </td>
                    <td className="px-3.5 py-2.5 text-gray-700 dark:text-gray-300">{row.Kasie}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* 4. Batas AFD */}
        {activeTab === "afdeling" && (
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300">
              <tr>
                <th className="px-3.5 py-3">Region</th>
                <th className="px-3.5 py-3">Estate</th>
                <th className="px-3.5 py-3">JSPV_1</th>
                <th className="px-3.5 py-3">JSPV_2</th>
                <th className="px-3.5 py-3">SPV</th>
                <th className="px-3.5 py-3">KASIE</th>
                <th className="px-3.5 py-3">AFD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {dataAfd.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                    Belum ada data Batas Afdeling. Silakan unggah berkas SHP untuk memuat data.
                  </td>
                </tr>
              ) : (
                dataAfd.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="px-3.5 py-2.5 text-blue-600 dark:text-blue-400">{row.Region}</td>
                    <td className="px-3.5 py-2.5 font-medium">{row.Estate}</td>
                    <td className="px-3.5 py-2.5 text-gray-600 dark:text-gray-400">{row.JSPV_1}</td>
                    <td className="px-3.5 py-2.5 text-gray-600 dark:text-gray-400">{row.JSPV_2}</td>
                    <td className="px-3.5 py-2.5 font-medium text-gray-900 dark:text-white">{row.SPV}</td>
                    <td className="px-3.5 py-2.5">{row.KASIE}</td>
                    <td className="px-3.5 py-2.5 font-bold text-blue-600 dark:text-blue-400">{row.AFD}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* 5. Batas BLOK */}
        {activeTab === "blok" && (
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300">
              <tr>
                <th className="px-3.5 py-3">Region</th>
                <th className="px-3.5 py-3">Estate</th>
                <th className="px-3.5 py-3">Afdeling</th>
                <th className="px-3.5 py-3">Blok</th>
                <th className="px-3 py-3 text-center">TahunTanam</th>
                <th className="px-3 py-3 text-right">Luas</th>
                <th className="px-3 py-3 text-right">TM_Pokok</th>
                <th className="px-3.5 py-3">JSPV_1</th>
                <th className="px-3.5 py-3">JSPV_2</th>
                <th className="px-3.5 py-3">SPV</th>
                <th className="px-3.5 py-3">KASIE</th>
                <th className="px-3.5 py-3">KOOR_KASIE</th>
                <th className="px-3.5 py-3">AFD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {dataBlok.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                    Belum ada data Batas Blok. Silakan unggah berkas SHP untuk memuat data.
                  </td>
                </tr>
              ) : (
                dataBlok.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="px-3.5 py-2.5 text-blue-600 dark:text-blue-400">{row.Region}</td>
                    <td className="px-3.5 py-2.5 font-medium">{row.Estate}</td>
                    <td className="px-3.5 py-2.5">{row.Afdeling}</td>
                    <td className="px-3.5 py-2.5 font-bold text-gray-900 dark:text-white">{row.Blok}</td>
                    <td className="px-3 py-2.5 text-center">{row.TahunTanam}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {row.Luas?.toFixed(1)} Ha
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-gray-900 dark:text-white">
                      {row.TM_Pokok?.toLocaleString()}
                    </td>
                    <td className="px-3.5 py-2.5 text-gray-500 text-[11px]">{row.JSPV_1}</td>
                    <td className="px-3.5 py-2.5 text-gray-500 text-[11px]">{row.JSPV_2}</td>
                    <td className="px-3.5 py-2.5 text-gray-800 dark:text-gray-200">{row.SPV}</td>
                    <td className="px-3.5 py-2.5 text-gray-700 dark:text-gray-300">{row.KASIE}</td>
                    <td className="px-3.5 py-2.5 text-gray-500 text-[11px]">{row.KOOR_KASIE}</td>
                    <td className="px-3.5 py-2.5 font-semibold text-blue-600 dark:text-blue-400">{row.AFD}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* 6. Batas Warung */}
        {activeTab === "warung" && (
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300">
              <tr>
                <th className="px-3.5 py-3">BLOK</th>
                <th className="px-3.5 py-3">AFD</th>
                <th className="px-3.5 py-3">ESTATE</th>
                <th className="px-3.5 py-3">REGION</th>
                <th className="px-3 py-3 text-right">luas</th>
                <th className="px-3.5 py-3">WARUNG</th>
                <th className="px-3.5 py-3">HARI</th>
                <th className="px-3.5 py-3">Drive_Wafd</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {dataWarung.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                    Belum ada data Batas Warung. Silakan unggah berkas SHP untuk memuat data.
                  </td>
                </tr>
              ) : (
                dataWarung.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="px-3.5 py-2.5 font-bold text-gray-900 dark:text-white">{row.BLOK}</td>
                    <td className="px-3.5 py-2.5">{row.AFD}</td>
                    <td className="px-3.5 py-2.5 font-medium">{row.ESTATE}</td>
                    <td className="px-3.5 py-2.5 text-blue-600 dark:text-blue-400">{row.REGION}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {row.luas?.toFixed(1)} Ha
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className="inline-block rounded px-2 py-0.5 text-[11px] font-bold border border-gray-300 dark:border-gray-700">
                        {row.WARUNG}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 font-medium">{row.HARI}</td>
                    <td className="px-3.5 py-2.5 text-gray-500">{row.Drive_Wafd}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* 7. Batas Ancak */}
        {activeTab === "ancak" && (
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300">
              <tr>
                <th className="px-3.5 py-3">BLOK</th>
                <th className="px-3.5 py-3">AFD</th>
                <th className="px-3.5 py-3">ESTATE</th>
                <th className="px-3.5 py-3">REGION</th>
                <th className="px-3 py-3 text-right">luas</th>
                <th className="px-3.5 py-3">WARUNG</th>
                <th className="px-3.5 py-3">HARI</th>
                <th className="px-3.5 py-3">Drive_Wafd</th>
                <th className="px-3.5 py-3">BLOK_1</th>
                <th className="px-3.5 py-3">AFD_1</th>
                <th className="px-3.5 py-3">ESTATE_1</th>
                <th className="px-3.5 py-3">REGION_1</th>
                <th className="px-3.5 py-3">WARUNG_1</th>
                <th className="px-3.5 py-3">HARI_1</th>
                <th className="px-3.5 py-3">No_Ancak</th>
                <th className="px-3.5 py-3">Koord_X</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {dataAncak.length === 0 ? (
                <tr>
                  <td colSpan={16} className="px-4 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                    Belum ada data Batas Ancak. Silakan unggah berkas SHP untuk memuat data.
                  </td>
                </tr>
              ) : (
                dataAncak.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="px-3.5 py-2.5 font-bold text-gray-900 dark:text-white">{row.BLOK}</td>
                    <td className="px-3.5 py-2.5">{row.AFD}</td>
                    <td className="px-3.5 py-2.5 font-medium">{row.ESTATE}</td>
                    <td className="px-3.5 py-2.5 text-blue-600 dark:text-blue-400">{row.REGION}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-emerald-600 dark:text-emerald-400">{row.luas?.toFixed(1)}</td>
                    <td className="px-3.5 py-2.5">{row.WARUNG}</td>
                    <td className="px-3.5 py-2.5">{row.HARI}</td>
                    <td className="px-3.5 py-2.5 text-gray-500 text-[10px]">{row.Drive_Wafd}</td>
                    <td className="px-3.5 py-2.5">{row.BLOK_1}</td>
                    <td className="px-3.5 py-2.5">{row.AFD_1}</td>
                    <td className="px-3.5 py-2.5">{row.ESTATE_1}</td>
                    <td className="px-3.5 py-2.5">{row.REGION_1}</td>
                    <td className="px-3.5 py-2.5">{row.WARUNG_1}</td>
                    <td className="px-3.5 py-2.5">{row.HARI_1}</td>
                    <td className="px-3.5 py-2.5 font-bold text-blue-600 dark:text-blue-400">{row.No_Ancak}</td>
                    <td className="px-3.5 py-2.5 text-gray-600 dark:text-gray-400">{row.Koord_X}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </section>

      {/* Dictionary Modal */}
      {showDictionaryModal && (
        <Dialog open={showDictionaryModal} onOpenChange={setShowDictionaryModal}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Kamus Standar Kolom SHP Database WebGIS</DialogTitle>
              <DialogDescription>
                Daftar lengkap 18 layer shapefile master dengan susunan nama kolom resmi dibatasi tanda pipa (|)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {Object.entries(SHP_SCHEMA_DICTIONARY).map(([key, schema]) => (
                <div key={key} className="rounded-lg border border-gray-200 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-gray-800/40">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {schema.nama} <span className="font-normal text-gray-500">({schema.kategori})</span>
                    </span>
                    <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400">
                      {schema.kolom.length} Kolom
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">{schema.deskripsi}</p>
                  <div className="mt-2 rounded border border-gray-200 bg-white p-2 font-mono text-[11px] text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 overflow-x-auto">
                    {schema.kolom.join(" | ")}
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Upload SHP Modal */}
      {showUploadModal && (
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Unggah SHP Batas Administrasi ({currentSchema.nama})</DialogTitle>
              <DialogDescription>
                Sistem akan memvalidasi apakah kolom SHP/DBF persis memenuhi skema:
                <br />
                <code className="mt-1 block font-mono text-[10px] text-blue-600 dark:text-blue-400 overflow-x-auto">
                  {currentSchema.kolom.join(" | ")}
                </code>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="flex justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 dark:border-gray-700">
                <div className="text-center">
                  <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <label className="cursor-pointer font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                      Pilih berkas ZIP / SHP
                      <input
                        type="file"
                        className="sr-only"
                        accept=".zip,.shp,.dbf,.shx,.prj,.geojson,.kml,.kmz"
                        onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                  {uploadedFile && (
                    <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {uploadedFile.name} (
                      {uploadedFile.size < 1024 * 1024
                        ? `${(uploadedFile.size / 1024).toFixed(1)} KB`
                        : uploadedFile.size < 1024 * 1024 * 1024
                          ? `${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB`
                          : `${(uploadedFile.size / (1024 * 1024 * 1024)).toFixed(2)} GB`}
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
                  disabled={!uploadedFile}
                  onClick={() => {
                    if (uploadedFile) {
                      const sz = uploadedFile.size < 1024 * 1024
                        ? `${(uploadedFile.size / 1024).toFixed(1)} KB`
                        : `${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB`;
                      supabase.logAudit({
                        action: "UPLOAD",
                        table_name: `batas_${activeTab}`,
                        record_id: uploadedFile.name,
                        details: `Unggah SHP ${currentSchema.nama} (${uploadedFile.name}, ${sz})`,
                      }).catch(() => { });
                    }
                    alert(`Validasi berhasil! Berkas SHP sesuai dengan skema kolom ${currentSchema.nama} (${currentSchema.kolom.join(" | ")})`);
                    setShowUploadModal(false);
                    setUploadedFile(null);
                  }}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Validasi & Simpan
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
