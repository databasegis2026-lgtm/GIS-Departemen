import { Link } from "react-router";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";

export default function PersiapanLahanHubPage() {
  const SUB_STAGES = [
    {
      title: "1. Tali Asih / GRTT",
      subTitle: "Ganti Rugi Tanam Tumbuh (Pelepasan Hak Garapan)",
      path: "/pembukaan-lahan/grtt",
      altPath: "/rekap-pekerjaan/persiapan-lahan/grtt",
      badge: "SHP Kadastral Warga",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50",
      description:
        "Pengelolaan poligon bidang tanah klaim garapan masyarakat, verifikasi GPS batas HGU, kesepakatan notaris, dan pelepasan hak sebelum kontraktor LC diizinkan masuk lokasi.",
      metrics: [
        { label: "Total Klaim", value: "88.0 Ha" },
        { label: "Tuntas Dibayar", value: "63.3 Ha" },
        { label: "Enclave / HCV", value: "8.5 Ha" },
      ],
      shpInfo: "Format SHP: Poligon batas bidang garapan (.shp, .kml) dengan atribut nama pemilik klaim & nomor berita acara.",
      buttonText: "Buka Modul GRTT",
    },
    {
      title: "2. Land Clearing (LC)",
      subTitle: "Pembukaan Lahan Mekanis 100% Zero Burning",
      path: "/pembukaan-lahan/lane-clearing",
      altPath: "/rekap-pekerjaan/persiapan-lahan/land-clearing",
      badge: "SHP Tracking Alat Berat",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50",
      description:
        "Monitoring realisasi imas, tumbang mekanis, perencekan, stacking baris tanam, teras kontur bersambung (lereng >8°-25°), serta proteksi buffer 50m/100m sempadan sungai.",
      metrics: [
        { label: "Kontrak SPK", value: "99.0 Ha" },
        { label: "Tumbang Selesai", value: "79.5 Ha" },
        { label: "Stacking Tuntas", value: "74.0 Ha" },
      ],
      shpInfo: "Format SHP: Poligon tracking harian alat berat / drone (.shp, .kml) dengan atribut kontraktor & tanggal survei.",
      buttonText: "Buka Modul Land Clearing",
    },
    {
      title: "3. Penanaman (Tanam)",
      subTitle: "Realisasi Tanam Bibit Unggul DxP & Standar SPH Baku",
      path: "/pembukaan-lahan/penanaman",
      altPath: "/rekap-pekerjaan/persiapan-lahan/tanam",
      badge: "SHP Sensus Pokok Tanam",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50",
      description:
        "Penanaman bibit kelapa sawit unggul DxP Tenera dari Main Nursery sesuai rancang bangun Blok Ideal 25 Ha (SPH 148 datar, SPH 136 teras kontur, 32 ancak, pola segitiga sama sisi).",
      metrics: [
        { label: "Luas Tertanam", value: "61.2 Ha" },
        { label: "Populasi Bibit", value: "8.794 Pokok" },
        { label: "Tutup LCC", value: ">90% Rapat" },
      ],
      shpInfo: "Format SHP: Point sebaran sensus pokok & poligon areal tertanam (.shp, .zip) yang siap divalidasi ke Master Data.",
      buttonText: "Buka Modul Penanaman",
    },
  ];

  return (
    <div className="space-y-5">
      <PageMeta
        title="Persiapan Lahan (Land Clearing) - PT BUM & BSL"
        description="Portal terintegrasi tahapan persiapan lahan: Tali Asih (GRTT), Land Clearing (LC), dan Penanaman (Tanam)"
      />

      <PageBreadcrumb pageTitle="Persiapan Lahan" />

      {/* Header */}
      <header className="flex flex-col gap-2 border-b border-gray-200 pb-3.5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between -mt-3">
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">
            Persiapan Lahan & Pembukaan Blok Baru
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Setiap tahapan memiliki layer Shapefile (SHP), skema atribut, dan aturan verifikasi teknis tersendiri.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 shadow-theme-xs">
            3 Sub-Modul Spasial Terpisah
          </span>
        </div>
      </header>

      {/* Grid 3 Sub-Halaman Utama */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {SUB_STAGES.map((stage) => (
          <div
            key={stage.path}
            className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs hover:border-brand-500/50 transition-all"
          >
            <div>
              {/* Header Card */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                    {stage.title}
                  </h2>
                  <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                    {stage.subTitle}
                  </div>
                </div>
                <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold shrink-0 ${stage.badgeColor}`}>
                  {stage.badge}
                </span>
              </div>

              {/* Deskripsi */}
              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 mt-2 leading-relaxed">
                {stage.description}
              </p>

              {/* Ringkasan Metrik */}
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-gray-100 bg-gray-50/80 p-2.5 dark:border-gray-800 dark:bg-gray-800/40 text-center">
                {stage.metrics.map((m, idx) => (
                  <div key={idx}>
                    <div className="text-[10px] uppercase font-semibold text-gray-400">{m.label}</div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Info SHP */}
              <div className="mt-3 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-2.5 text-[11px] text-gray-500 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-400">
                <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-0.5">Karakteristik File SHP:</span>
                {stage.shpInfo}
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Link
                to={stage.path}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-theme-xs hover:bg-brand-600 cursor-pointer transition-colors"
              >
                <span>{stage.buttonText}</span>
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
