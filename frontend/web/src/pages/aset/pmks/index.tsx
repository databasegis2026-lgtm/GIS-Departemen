import { useState, useMemo } from "react";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";

export interface PalmOilMillFacility {
  id: string;
  kode_pmks: string;
  nama_pmks: string;
  unit_estate: string;
  region: "REGION 1" | "REGION 2" | "REGION 3";
  kapasitas_olah_ton_jam: number;
  jumlah_loading_ramp: number;
  kapasitas_tangki_cpo_ton: number;
  jumlah_kolam_ipal: number;
  status_operasional: "Beroperasi Penuh" | "Pemeliharaan Terjadwal" | "Optimalisasi Kapasitas";
  sertifikasi: string;
  tahun_komisioning: number;
  koordinat: string;
}

const MOCK_PMKS: PalmOilMillFacility[] = [];

export default function PMKSPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPMKS = useMemo(() => {
    return MOCK_PMKS.filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.nama_pmks.toLowerCase().includes(q) ||
        item.kode_pmks.toLowerCase().includes(q) ||
        item.unit_estate.toLowerCase().includes(q) ||
        item.sertifikasi.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  return (
    <div className="space-y-4">
      <PageMeta
        title="PMKS (Pabrik Kelapa Sawit) - Departemen GIS PT BUM & BSL"
        description="Fasilitas pengolahan kelapa sawit, loading ramp, stasiun boiler, tangki timbun CPO, dan IPAL"
      />

      <PageBreadcrumb pageTitle="Pabrik Kelapa Sawit (PMKS)" />

      {/* Header */}
      <header className="flex flex-col gap-2 border-b border-gray-200 pb-3.5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between -mt-3">
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">
            Pabrik Kelapa Sawit (PMKS) & Stasiun Produksi
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Fasilitas pengolahan Tandan Buah Segar (TBS), stasiun timbangan, boiler, tangki CPO, dan kolam IPAL PT BUM & BSL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Cari PMKS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            Kapasitas Olah: 105 Ton TBS/Jam
          </span>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Pabrik Beroperasi</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">2 Unit</div>
          <div className="text-[11px] text-gray-500 mt-0.5">PMKS BUM 2 & PMKS BSL</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Kapasitas Tangki CPO</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">16.000 Ton</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Total 6 unit tangki vertikal</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Loading Ramp</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">28 Pintu</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Penerimaan truk TBS kebun</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Kolam IPAL Aktif</div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">11 Kolam</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Pengolahan limbah cair terkontrol</div>
        </div>
      </section>

      {/* Grid PMKS */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredPMKS.length === 0 ? (
          <div className="col-span-full rounded-xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-900">
            Belum ada data fasilitas pabrik (PMKS). Silakan sinkronkan data atau unggah berkas SHP.
          </div>
        ) : (
          filteredPMKS.map((item) => (
          <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">{item.nama_pmks}</h3>
                <div className="font-mono text-[11px] text-gray-400">{item.kode_pmks} • {item.unit_estate}</div>
              </div>
              <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                {item.status_operasional}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs rounded-lg border border-gray-100 bg-gray-50/70 p-3 dark:border-gray-800 dark:bg-gray-800/30">
              <div>
                <span className="text-gray-400 text-[10px] block">Kapasitas Olah</span>
                <span className="font-bold text-gray-900 dark:text-white">{item.kapasitas_olah_ton_jam} Ton TBS/Jam</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] block">Kapasitas Tangki CPO</span>
                <span className="font-bold text-gray-900 dark:text-white">{item.kapasitas_tangki_cpo_ton.toLocaleString()} Ton</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] block">Stasiun Loading Ramp</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{item.jumlah_loading_ramp} Pintu Curah</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] block">Kolam IPAL</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{item.jumlah_kolam_ipal} Kolam Terpadu</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-gray-100 dark:border-gray-800">
              <span className="text-gray-500">Sertifikasi: <strong className="text-gray-800 dark:text-gray-200">{item.sertifikasi}</strong></span>
              <span className="font-mono text-gray-400">{item.koordinat}</span>
            </div>
          </div>
        ))
      )}
      </section>
    </div>
  );
}
