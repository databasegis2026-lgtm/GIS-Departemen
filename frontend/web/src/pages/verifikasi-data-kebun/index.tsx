import { useState } from "react";
import { Link } from "react-router";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import {
  CheckCircleIcon,
  BoxIcon,
  LayerIcon,
  MapIcon,
  ArrowRightIcon,
  InfoIcon,
} from "@/icons";

interface VerificationGroup {
  id: string;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  items: {
    name: string;
    path: string;
    desc: string;
    countNote?: string;
  }[];
}

export default function VerifikasiDataKebunPage() {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  // 4 Kategori Utama Sesuai Spesifikasi:
  // 1. Pekerjaan Rutin (Pruning, Pemupukan, Pasar Pikul, Jangkos, Semprot)
  // 2. Persiapan Lahan (GRTT, Land Clearing, Tanam)
  // 3. Update Aresta (Sensus Pokok, Sisipan, Perubahan Blok)
  // 4. Infrastruktur (Jalan, Jembatan & Gorong-gorong, Parit & Drainase, Titik TPH)
  const verificationGroups: VerificationGroup[] = [
    {
      id: "pekerjaan-rutin",
      title: "Pekerjaan Rutin",
      description: "Verifikasi lapangan pelaksanaan perawatan pokok dan pemeliharaan ancak kerja kebun.",
      badge: "5 Aktivitas",
      badgeColor: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      icon: <CheckCircleIcon className="size-6 text-brand-600 dark:text-brand-400" />,
      items: [
        {
          name: "Pruning",
          path: "/verifikasi-data-kebun/pekerjaan-rutin/pruning",
          desc: "Audit standar songgo tunas, kebersihan pelepah sengkleh, dan susunan pelepah di gawangan mati.",
          countNote: "24 Blok Terverifikasi",
        },
        {
          name: "Pemupukan",
          path: "/verifikasi-data-kebun/pekerjaan-rutin/pemupukan",
          desc: "Pengecekan dosis pupuk riil per pokok, taburan merata di piringan, dan ketiadaan pupuk menggumpal.",
          countNote: "18 Blok Terverifikasi",
        },
        {
          name: "Pasar Pikul",
          path: "/verifikasi-data-kebun/pekerjaan-rutin/pasar-pikul",
          desc: "Verifikasi kelayakan jalan pikul panen, pembersihan rintangan, dan jembatan ancak antar gawangan.",
          countNote: "32 Blok Terverifikasi",
        },
        {
          name: "Jangkos",
          path: "/verifikasi-data-kebun/pekerjaan-rutin/jangkos",
          desc: "Audit ketebalan aplikasi janjang kosong (1 lapis merata) dan batas jarak dari lingkar piringan pokok.",
          countNote: "12 Blok Terverifikasi",
        },
        {
          name: "Semprot",
          path: "/verifikasi-data-kebun/pekerjaan-rutin/semprot",
          desc: "Pemeriksaan sanitasi gulma piringan, pasar rintis, dan kalibrasi herbisida tanpa mengenai pupus muda.",
          countNote: "28 Blok Terverifikasi",
        },
      ],
    },
    {
      id: "persiapan-lahan",
      title: "Persiapan Lahan",
      description: "Pemeriksaan progres fisik land development dari ganti rugi tanam tumbuh hingga penanaman bibit.",
      badge: "3 Tahapan",
      badgeColor: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
      icon: <LayerIcon className="size-6 text-emerald-600 dark:text-emerald-400" />,
      items: [
        {
          name: "GRTT",
          path: "/verifikasi-data-kebun/persiapan-lahan/grtt",
          desc: "Pencocokan patok batas lahan terbayar (Ganti Rugi Tanam Tumbuh), berita acara, dan delineasi koordinat.",
          countNote: "15 Poligon GRTT",
        },
        {
          name: "Land Clearing",
          path: "/verifikasi-data-kebun/persiapan-lahan/land-clearing",
          desc: "Audit pembersihan rintis, perencekan kayu, penataan jalur tanam, dan pemenuhan standar Zero Burning.",
          countNote: "220.5 Ha Selesai LC",
        },
        {
          name: "Tanam",
          path: "/verifikasi-data-kebun/persiapan-lahan/tanam",
          desc: "Verifikasi kedalaman lubang tanam, pemupukan dasar (Rock Phosphate), dan ketegakan bibit sawit siap tumbuh.",
          countNote: "185.0 Ha Tertanam",
        },
      ],
    },
    {
      id: "update-aresta",
      title: "Update Aresta",
      description: "Sinkronisasi sensus tegakan pokok hidup, sisipan baru, dan penyesuaian batas blok riil.",
      badge: "Sensus Agronomi",
      badgeColor: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800",
      icon: <BoxIcon className="size-6 text-amber-600 dark:text-amber-400" />,
      items: [
        {
          name: "Sensus Pokok",
          path: "/verifikasi-data-kebun/update-aresta/sensus-pokok",
          desc: "Inventarisasi pohon produktif, pokok abnormal/kastrasi, pohon mati, serta perhitungan SPH riil per blok.",
          countNote: "48 Blok Disensus",
        },
        {
          name: "Sisipan",
          path: "/verifikasi-data-kebun/update-aresta/sisipan",
          desc: "Verifikasi penanaman bibit sisipan pengganti pokok mati atau kerdil agar populasi blok kembali optimal.",
          countNote: "1.240 Pokok Sisipan",
        },
        {
          name: "Perubahan Blok",
          path: "/verifikasi-data-kebun/update-aresta/perubahan-blok",
          desc: "Pencatatan pemisahan, penggabungan, atau pergeseran batas fisik blok akibat jalan baru atau sungai.",
          countNote: "4 Usulan Perubahan",
        },
      ],
    },
    {
      id: "infrastruktur",
      title: "Infrastruktur",
      description: "Pemeriksaan fisik sarana transportasi panen, jaringan akses angkut TBS, dan tata air perkebunan.",
      badge: "Sarana Fisik",
      badgeColor: "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200 dark:border-purple-800",
      icon: <MapIcon className="size-6 text-purple-600 dark:text-purple-400" />,
      items: [
        {
          name: "Jalan",
          path: "/verifikasi-data-kebun/infrastruktur/jalan",
          desc: "Audit perkerasan jalan poros utama (Main Road) dan jalan koleksi (Collection Road) siap dilalui truk TBS.",
          countNote: "84.5 Km Jalan Aktif",
        },
        {
          name: "Jembatan & Gorong-gorong",
          path: "/verifikasi-data-kebun/infrastruktur/jembatan-gorong-gorong",
          desc: "Pemeriksaan kondisi struktur jembatan kayu/beton dan gorong-gorong box culvert penyeberangan alat berat.",
          countNote: "26 Titik Jembatan",
        },
        {
          name: "Parit & Drainase",
          path: "/verifikasi-data-kebun/infrastruktur/parit-drainase",
          desc: "Audit parit primer, sekunder, dan parit suplesi/isolasi rawa untuk menjaga water table kelapa sawit.",
          countNote: "42.0 Km Saluran Parit",
        },
        {
          name: "Titik TPH",
          path: "/verifikasi-data-kebun/infrastruktur/titik-tph",
          desc: "Verifikasi koordinat GPS tiang TPH, nomor TPH, kebersihan lantai simpan TBS, dan snapping spasial.",
          countNote: "142 Titik TPH Terverifikasi",
        },
      ],
    },
  ];

  const filteredGroups =
    selectedFilter === "all"
      ? verificationGroups
      : verificationGroups.filter((g) => g.id === selectedFilter);

  return (
    <div className="space-y-6">
      <PageMeta
        title="Verifikasi Data Kebun | GIS Departemen"
        description="Rekapitulasi Verifikasi Data Kebun: Pekerjaan Rutin, Persiapan Lahan, Update Aresta, dan Infrastruktur."
      />
      <PageBreadcrumb pageTitle="Verifikasi Data Kebun" />

      {/* ══════════════════════════════════════════════════════════════════════
          1. REKAP PEKERJAAN (OVERVIEW KPI & STATUS AUDIT LAPANGAN)
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-brand-500 px-2 py-0.5 text-xs font-bold text-white shadow-xs">
                Rekap Pekerjaan
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Audit Lapangan Kebun & Validasi Sensus
              </span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              Rekapitulasi Verifikasi Data Lapangan
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 max-w-2xl mt-0.5">
              Dashboard verifikasi lapangan kebun yang mencakup <b>Pekerjaan Rutin</b>, <b>Persiapan Lahan</b>, <b>Update Aresta</b>, dan <b>Infrastruktur Fisik</b>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/verifikasi-data-kebun/rekap-pekerjaan"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors"
            >
              <span>Halaman Rekap Lengkap</span>
              <ArrowRightIcon className="size-3.5" />
            </Link>
            <Link
              to="/data-operasional"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-xs transition-colors"
            >
              <span>Buka Data Operasional HO</span>
            </Link>
          </div>
        </div>

        {/* 4 Kolom Metrik Utama Rekap Pekerjaan */}
        <div className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* 1. Pekerjaan Rutin */}
          <div className="rounded-xl border border-blue-200/80 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Pekerjaan Rutin</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                5 Sub-Modul
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-gray-900 dark:text-white">91.4%</span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">114 / 125 Blok</span>
            </div>
            <div className="w-full bg-blue-200/60 dark:bg-blue-900/50 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: "91.4%" }} />
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 block pt-0.5">
              Pruning, Pemupukan, Pasar Pikul, Jangkos, Semprot
            </span>
          </div>

          {/* 2. Persiapan Lahan */}
          <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Persiapan Lahan</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                3 Sub-Modul
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-gray-900 dark:text-white">100%</span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">405.5 Ha Clear</span>
            </div>
            <div className="w-full bg-emerald-200/60 dark:bg-emerald-900/50 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: "100%" }} />
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 block pt-0.5">
              GRTT terbayar, Land Clearing selesai, Penanaman tuntas
            </span>
          </div>

          {/* 3. Update Aresta */}
          <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Update Aresta</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                3 Sub-Modul
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-gray-900 dark:text-white">136.2</span>
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">SPH Riil Kebun</span>
            </div>
            <div className="w-full bg-amber-200/60 dark:bg-amber-900/50 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: "84%" }} />
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 block pt-0.5">
              Sensus Pokok hidup/mati, Sisipan pohon, Perubahan Blok
            </span>
          </div>

          {/* 4. Infrastruktur */}
          <div className="rounded-xl border border-purple-200/80 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Infrastruktur</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                4 Sub-Modul
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-gray-900 dark:text-white">142 TPH</span>
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">84.5 Km Jalan</span>
            </div>
            <div className="w-full bg-purple-200/60 dark:bg-purple-900/50 h-1.5 rounded-full overflow-hidden">
              <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: "95%" }} />
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 block pt-0.5">
              Jalan (MR/CR), Jembatan, Parit Drainase, Titik TPH
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          2. FILTER TABS KATEGORI
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-200 dark:border-gray-800 pb-2">
        <button
          type="button"
          onClick={() => setSelectedFilter("all")}
          className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${selectedFilter === "all"
              ? "bg-brand-500 text-white shadow-xs"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
        >
          Semua Modul ({verificationGroups.reduce((acc, g) => acc + g.items.length, 0)})
        </button>
        {verificationGroups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setSelectedFilter(g.id)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${selectedFilter === g.id
                ? "bg-brand-500 text-white shadow-xs font-semibold"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
          >
            {g.title} ({g.items.length})
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          3. GRID KARTU KATEGORI & SUB-MODUL VERIFIKASI
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {filteredGroups.map((group) => (
          <div
            key={group.id}
            className="flex flex-col justify-between rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-xs hover:border-brand-300 dark:hover:border-brand-700 transition-all"
          >
            <div>
              {/* Header Kartu */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    {group.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                      {group.title}
                    </h3>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      Modul Verifikasi Lapangan
                    </span>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${group.badgeColor}`}
                >
                  {group.badge}
                </span>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                {group.description}
              </p>

              {/* Daftar Sub-Aktivitas / Item */}
              <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                {group.items.map((item, idx) => (
                  <Link
                    key={idx}
                    to={item.path}
                    className="group flex flex-col p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-brand-50/60 dark:hover:bg-brand-950/40 border border-gray-100 dark:border-gray-700/60 hover:border-brand-200 dark:hover:border-brand-800 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-brand-500 shrink-0" />
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.countNote && (
                          <span className="text-[10px] font-mono font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                            {item.countNote}
                          </span>
                        )}
                        <ArrowRightIcon className="size-3.5 text-gray-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 pl-4 leading-relaxed">
                      {item.desc}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Footer Kartu */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <InfoIcon className="size-3.5 text-gray-400" />
                <span>Klik item untuk membuka halaman kerja verifikasi</span>
              </span>
              <span className="font-semibold text-brand-600 dark:text-brand-400">
                {group.items.length} Sub-Modul
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
