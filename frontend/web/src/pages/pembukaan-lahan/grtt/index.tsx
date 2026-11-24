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

export interface GrttItem {
  id: string;
  nomor_berkas: string;
  blok_rencana: string;
  region: "REGION 1" | "REGION 2" | "REGION 3";
  estate: string;
  afdeling: string;
  nama_penggarap: string;
  nik_penggarap: string;
  luas_klaim_ha: number;
  luas_ukur_gps_ha: number;
  nilai_kompensasi_rp: number;
  status_bayar: "Sudah Tali Asih (Lunas)" | "Proses Verifikasi Notaris" | "Negosiasi / Mediasi" | "Enclave (Dikeluarkan)";
  shp_file_name?: string;
  shp_upload_date?: string;
  nomor_ba_kesepakatan: string;
  siap_lc: boolean;
  keterangan: string;
}

const MOCK_GRTT_DATA: GrttItem[] = [
  {
    id: "grtt-01",
    nomor_berkas: "BA-GRTT/BUM4/2026/014",
    blok_rencana: "F15",
    region: "REGION 1",
    estate: "BUM 4",
    afdeling: "AFD 18",
    nama_penggarap: "Mansyur & Kelompok Tani Mandiri",
    nik_penggarap: "6202051204850001",
    luas_klaim_ha: 14.5,
    luas_ukur_gps_ha: 12.0,
    nilai_kompensasi_rp: 360000000,
    status_bayar: "Sudah Tali Asih (Lunas)",
    shp_file_name: "shp_grtt_bum4_f15_final.zip",
    shp_upload_date: "18 Feb 2026",
    nomor_ba_kesepakatan: "042/BA-TA/LGL-BUM/II/2026",
    siap_lc: true,
    keterangan: "Areal ladang berpindah warga. Telah ditandatangani di depan Kepala Desa dan Tim Legal.",
  },
  {
    id: "grtt-02",
    nomor_berkas: "BA-GRTT/BUM6/2026/008",
    blok_rencana: "E08",
    region: "REGION 2",
    estate: "BUM 6",
    afdeling: "AFD 25",
    nama_penggarap: "H. Syamsuddin",
    nik_penggarap: "6202051508730002",
    luas_klaim_ha: 25.0,
    luas_ukur_gps_ha: 24.8,
    nilai_kompensasi_rp: 744000000,
    status_bayar: "Sudah Tali Asih (Lunas)",
    shp_file_name: "shp_grtt_bum6_e08_lunas.zip",
    shp_upload_date: "10 Feb 2026",
    nomor_ba_kesepakatan: "028/BA-TA/LGL-BUM/II/2026",
    siap_lc: true,
    keterangan: "Seluruh bidang telah tuntas tali asih. Kontraktor LC telah diizinkan masuk lokasi.",
  },
  {
    id: "grtt-03",
    nomor_berkas: "BA-GRTT/BSL/2026/021",
    blok_rencana: "C12",
    region: "REGION 3",
    estate: "BSL",
    afdeling: "AFD 2",
    nama_penggarap: "Kelompok Tani Danau Sembuluh",
    nik_penggarap: "6202082201800003",
    luas_klaim_ha: 22.0,
    luas_ukur_gps_ha: 18.5,
    nilai_kompensasi_rp: 555000000,
    status_bayar: "Sudah Tali Asih (Lunas)",
    shp_file_name: "shp_grtt_bsl_c12_ok.zip",
    shp_upload_date: "14 Feb 2026",
    nomor_ba_kesepakatan: "035/BA-TA/BSL/II/2026",
    siap_lc: true,
    keterangan: "Bagian selatan berbatasan dengan sempadan sungai tidak dimasukkan dalam tali asih (dialokasikan HCV).",
  },
  {
    id: "grtt-04",
    nomor_berkas: "BA-GRTT/BUM8/2026/005",
    blok_rencana: "A11",
    region: "REGION 3",
    estate: "BUM 8",
    afdeling: "AFD 33",
    nama_penggarap: "Zainal Abidin (Garapan Karet)",
    nik_penggarap: "6202081109790004",
    luas_klaim_ha: 18.0,
    luas_ukur_gps_ha: 16.2,
    nilai_kompensasi_rp: 486000000,
    status_bayar: "Proses Verifikasi Notaris",
    shp_file_name: "shp_grtt_draft_a11_zainal.zip",
    shp_upload_date: "22 Feb 2026",
    nomor_ba_kesepakatan: "Menunggu No. Akta",
    siap_lc: false,
    keterangan: "Pencocokan batas poligon GPS selesai. Sedang proses pembuatan draf akta pelepasan hak.",
  },
  {
    id: "grtt-05",
    nomor_berkas: "BA-GRTT/BUM1/2026/002",
    blok_rencana: "B09",
    region: "REGION 1",
    estate: "BUM 1",
    afdeling: "AFD 3",
    nama_penggarap: "Masyarakat Adat Tempurung",
    nik_penggarap: "6202010101850009",
    luas_klaim_ha: 8.5,
    luas_ukur_gps_ha: 8.5,
    nilai_kompensasi_rp: 0,
    status_bayar: "Enclave (Dikeluarkan)",
    shp_file_name: "shp_enclave_bum1_b09.zip",
    shp_upload_date: "12 Jan 2026",
    nomor_ba_kesepakatan: "SK-ENCLAVE/BUM1/2026",
    siap_lc: false,
    keterangan: "Situs keramat / kuburan tua adat. Sesuai Form 001 ditetapkan sebagai Unplantable Enclave (HCV).",
  },
];

export default function GRTTPage() {
  const [data, setData] = useState<GrttItem[]>(MOCK_GRTT_DATA);
  const [selectedRegion, setSelectedRegion] = useState<string>("Semua Region");
  const [selectedEstate, setSelectedEstate] = useState<string>("Semua Estate");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [targetUploadItem, setTargetUploadItem] = useState<GrttItem | null>(null);
  const [detailModalItem, setDetailModalItem] = useState<GrttItem | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState("");

  // Filter Data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (selectedRegion !== "Semua Region" && item.region !== selectedRegion) return false;
      if (selectedEstate !== "Semua Estate" && item.estate !== selectedEstate) return false;
      if (statusFilter !== "all" && item.status_bayar !== statusFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.nomor_berkas.toLowerCase().includes(q) ||
        item.blok_rencana.toLowerCase().includes(q) ||
        item.nama_penggarap.toLowerCase().includes(q) ||
        item.estate.toLowerCase().includes(q) ||
        item.afdeling.toLowerCase().includes(q) ||
        item.nomor_ba_kesepakatan.toLowerCase().includes(q)
      );
    });
  }, [data, selectedRegion, selectedEstate, statusFilter, searchQuery]);

  // Statistik Ringkasan
  const stats = useMemo(() => {
    const totalKlaim = data.reduce((a, b) => a + b.luas_klaim_ha, 0);
    const totalBebas = data.filter((d) => d.siap_lc).reduce((a, b) => a + b.luas_ukur_gps_ha, 0);
    const totalDanaRp = data.filter((d) => d.status_bayar === "Sudah Tali Asih (Lunas)").reduce((a, b) => a + b.nilai_kompensasi_rp, 0);
    const countEnclave = data.filter((d) => d.status_bayar === "Enclave (Dikeluarkan)").length;

    return {
      totalKlaim,
      totalBebas,
      totalDanaMilyar: (totalDanaRp / 1000000000).toFixed(2),
      countEnclave,
      totalShp: data.filter((d) => Boolean(d.shp_file_name)).length,
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
            shp_file_name: uploadedFileName,
            shp_upload_date: "24 Feb 2026",
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
        title="Tali Asih / GRTT (Ganti Rugi Tanam Tumbuh) - PT BUM & BSL"
        description="Manajemen spasial bidang tali asih, verifikasi GPS kadastral, dan pelepasan hak garapan kebun"
      />

      <PageBreadcrumb pageTitle="Tali Asih (GRTT)" />

      {/* Header */}
      <header className="flex flex-col gap-2 border-b border-gray-200 pb-3.5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between -mt-3">
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">
            Tali Asih / GRTT (Ganti Rugi Tanam Tumbuh)
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Pengelolaan poligon bidang tanah garapan warga, verifikasi GPS batas HGU, dan validasi pelepasan hak sebelum Land Clearing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            {stats.totalBebas.toFixed(1)} Ha Siap LC
          </span>
          <span className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 shadow-theme-xs">
            {stats.totalShp} SHP Terpetakan
          </span>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Total Klaim Warga
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalKlaim.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500">Ha</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Klaim garapan terdata
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Realisasi Tali Asih
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.totalBebas.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500">Ha</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Bebas & tuntas dibayar
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Kompensasi Terbayar
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              Rp {stats.totalDanaMilyar}
            </span>
            <span className="text-xs text-gray-500">M</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Total biaya ganti rugi
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Areal Enclave / HCV
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {stats.countEnclave}
            </span>
            <span className="text-xs text-gray-500">Bidang</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Dikeluarkan dari rencana LC
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs col-span-2 sm:col-span-4 lg:col-span-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            SHP Bidang Kadastral
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {stats.totalShp}
            </span>
            <span className="text-xs text-gray-500">File</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Tervalidasi di Geodatabase
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
            placeholder="Cari nomor berkas, nama penggarap, blok..."
            className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-8.5 pr-3 text-xs text-gray-800 placeholder-gray-400 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-800 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 cursor-pointer"
          >
            <option value="all">Semua Status Bayar</option>
            <option value="Sudah Tali Asih (Lunas)">Sudah Tali Asih (Lunas)</option>
            <option value="Proses Verifikasi Notaris">Proses Verifikasi Notaris</option>
            <option value="Enclave (Dikeluarkan)">Enclave (Dikeluarkan)</option>
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
            Total: <strong className="font-semibold text-gray-900 dark:text-white">{filteredData.length}</strong> berkas
          </span>
        </div>
      </section>

      {/* Tabel Data GRTT & SHP Bidang */}
      <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-semibold uppercase text-gray-600 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300">
            <tr>
              <th className="px-3.5 py-3">No. Berkas & Blok</th>
              <th className="px-3.5 py-3">Penggarap / Pemilik Klaim</th>
              <th className="px-3 py-3">Luas Klaim vs Ukur</th>
              <th className="px-3 py-3">Nilai Kompensasi</th>
              <th className="px-3 py-3">Status Tali Asih</th>
              <th className="px-3.5 py-3">File SHP Bidang</th>
              <th className="px-3 py-3">Kesiapan LC</th>
              <th className="px-3.5 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-xs text-gray-500">
                  Tidak ada data tali asih / GRTT yang sesuai kriteria filter.
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
                      Blok {item.blok_rencana}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {item.nomor_berkas}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {item.estate} • {item.afdeling}
                    </div>
                  </td>

                  <td className="px-3.5 py-3 max-w-xs">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {item.nama_penggarap}
                    </div>
                    <div className="text-[10px] font-mono text-gray-400">
                      NIK: {item.nik_penggarap}
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {item.luas_ukur_gps_ha.toFixed(1)} Ha (Ukur GPS)
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Klaim: {item.luas_klaim_ha.toFixed(1)} Ha
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {item.nilai_kompensasi_rp > 0
                        ? `Rp ${(item.nilai_kompensasi_rp / 1000000).toLocaleString()} Jt`
                        : "Enclave / Rp 0"}
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${item.status_bayar === "Sudah Tali Asih (Lunas)"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50"
                        : item.status_bayar === "Enclave (Dikeluarkan)"
                          ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50"
                          : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50"
                        }`}
                    >
                      {item.status_bayar}
                    </span>
                  </td>

                  {/* File SHP Bidang */}
                  <td className="px-3.5 py-3">
                    {item.shp_file_name ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-brand-600 dark:text-brand-400">
                          <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <span className="max-w-[100px] truncate" title={item.shp_file_name}>
                            {item.shp_file_name}
                          </span>
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400">Belum ada SHP</span>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    {item.siap_lc ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                        <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Siap LC
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-400">
                        Tertahan
                      </span>
                    )}
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
                        title="Unggah / Perbarui SHP Bidang"
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

      {/* Modal Unggah SHP Bidang GRTT */}
      <Dialog open={uploadModalOpen} onOpenChange={(open) => !open && setUploadModalOpen(false)}>
        {targetUploadItem && (
          <DialogContent className="sm:max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                Unggah SHP Bidang GRTT • Blok {targetUploadItem.blok_rencana}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
                Pilih file Shapefile (.zip, .shp, .geojson, .kml) poligon batas garapan {targetUploadItem.nama_penggarap}
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
                  Simpan Poligon GRTT
                </button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* Modal Detail Berkas */}
      <Dialog open={Boolean(detailModalItem)} onOpenChange={(open) => !open && setDetailModalItem(null)}>
        {detailModalItem && (
          <DialogContent className="sm:max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                Rincian Berkas {detailModalItem.nomor_berkas}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
                Blok {detailModalItem.blok_rencana} • {detailModalItem.estate} ({detailModalItem.afdeling})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs mt-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 dark:border-gray-800 dark:bg-gray-800/30 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nama Penggarap:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{detailModalItem.nama_penggarap}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Luas Ukur GPS Kadastral:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{detailModalItem.luas_ukur_gps_ha} Ha</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">No. Berita Acara Legal:</span>
                  <span className="font-mono text-gray-800 dark:text-gray-200">{detailModalItem.nomor_ba_kesepakatan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Kompensasi:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    Rp {detailModalItem.nilai_kompensasi_rp.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Catatan Verifikasi Tim Lapangan:</span>
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
