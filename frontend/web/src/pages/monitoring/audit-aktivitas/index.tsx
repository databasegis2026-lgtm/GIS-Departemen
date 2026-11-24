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

export interface SpatialAuditLog {
  id: string;
  waktu: string;
  pengguna: string;
  peran: string;
  modul: "Batas Blok" | "Infrastruktur Jalan" | "Land Clearing" | "Kartografi Cetak" | "Sensus Pokok";
  aktivitas: string;
  entitas: string;
  detail_perubahan: string;
  status: "Berhasil" | "Perlu Review" | "Dibatalkan";
  ip_address: string;
}

const MOCK_AUDIT_LOGS: SpatialAuditLog[] = [
  {
    id: "log-101",
    waktu: "24 Feb 2026, 14:15 WIB",
    pengguna: "Agus Adi Permana",
    peran: "Admin GIS Region 1 (Kode G)",
    modul: "Batas Blok",
    aktivitas: "Pemotongan Poligon Buffer MR/CR",
    entitas: "Blok A05 • BUM 1 (AFD 4)",
    detail_perubahan: "Pemotongan koridor Main Road (lebar 8m) dan Collection Road (lebar 6m). Luas netto disesuaikan dari 25.00 Ha menjadi 24.20 Ha.",
    status: "Berhasil",
    ip_address: "192.168.10.45",
  },
  {
    id: "log-102",
    waktu: "24 Feb 2026, 13:30 WIB",
    pengguna: "Bagja Arya Wiguna",
    peran: "Admin GIS QA (Kode E)",
    modul: "Kartografi Cetak",
    aktivitas: "Penerbitan Peta Resmi A4",
    entitas: "1521/GIS-JKO/PRN/PBLK/R2-E/XI/2026",
    detail_perubahan: "Verifikasi kartografi peta blok kebun pruning. Grid koordinat UTM Zone 49S dan 4 tanda tangan pengesahan tuntas.",
    status: "Berhasil",
    ip_address: "192.168.10.22",
  },
  {
    id: "log-103",
    waktu: "24 Feb 2026, 11:40 WIB",
    pengguna: "Iqbal Tri Junaidy",
    peran: "Admin GIS Region 3 (Kode B)",
    modul: "Land Clearing",
    aktivitas: "Import SHP Tracking Alat Berat",
    entitas: "tracking_gps_c12_lc.kml • BSL (AFD 2)",
    detail_perubahan: "Validasi overlay poligon stacking LC terhadap batas buffer sempadan sungai 50m. Terdeteksi overlap 0.3 Ha, ditandai revisi batas.",
    status: "Perlu Review",
    ip_address: "192.168.10.38",
  },
  {
    id: "log-104",
    waktu: "24 Feb 2026, 10:15 WIB",
    pengguna: "Hendra Wijaya",
    peran: "Asisten Afd 4 (BUM 1)",
    modul: "Batas Blok",
    aktivitas: "Pengajuan Tiket Request Update Peta",
    entitas: "TKT-2026-02-001 • Blok A05",
    detail_perubahan: "Upload lampiran sketsa_a05_pruning.pdf untuk verifikasi pergeseran parit sekunder dan gawangan kebun.",
    status: "Berhasil",
    ip_address: "10.20.4.12",
  },
  {
    id: "log-105",
    waktu: "23 Feb 2026, 16:50 WIB",
    pengguna: "Widodo Arif Rohman",
    peran: "Admin GIS Database (Kode C)",
    modul: "Batas Blok",
    aktivitas: "Sinkronisasi Master Blok DBF",
    entitas: "Batas_Blok_Edited_(09-03-2026).dbf",
    detail_perubahan: "Pembaruan atribut luas dan tahun tanam 1.053 master blok kebun PT BUM dan BSL.",
    status: "Berhasil",
    ip_address: "192.168.10.15",
  },
  {
    id: "log-106",
    waktu: "23 Feb 2026, 14:20 WIB",
    pengguna: "Reki Hamdani",
    peran: "Admin GIS Topografi (Kode F)",
    modul: "Infrastruktur Jalan",
    aktivitas: "Update Vektor Topografi & Saluran",
    entitas: "Admin_Sungai.dbf & KONTUR_1m.dbf",
    detail_perubahan: "Pembaruan garis kontur interval 1m dan buffer sempadan 13 sungai utama.",
    status: "Berhasil",
    ip_address: "192.168.10.29",
  },
];

export default function AuditAktivitasPage() {
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailModalItem, setDetailModalItem] = useState<SpatialAuditLog | null>(null);

  const filteredLogs = useMemo(() => {
    return MOCK_AUDIT_LOGS.filter((item) => {
      if (moduleFilter !== "all" && item.modul !== moduleFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.pengguna.toLowerCase().includes(q) ||
        item.peran.toLowerCase().includes(q) ||
        item.aktivitas.toLowerCase().includes(q) ||
        item.entitas.toLowerCase().includes(q) ||
        item.detail_perubahan.toLowerCase().includes(q) ||
        item.ip_address.toLowerCase().includes(q)
      );
    });
  }, [moduleFilter, statusFilter, searchQuery]);

  return (
    <div className="space-y-4">
      <PageMeta
        title="Audit Aktivitas Spasial - Departemen GIS PT BUM & BSL"
        description="Jejak audit kronologis perubahan data geospasial, pemotongan poligon, upload SHP, dan penerbitan peta"
      />

      <PageBreadcrumb pageTitle="Audit Aktivitas" />

      {/* Header */}
      <header className="flex flex-col gap-2 border-b border-gray-200 pb-3.5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between -mt-3">
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">
            Audit Aktivitas & Riwayat Geospasial
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Jejak rekam digital seluruh pengeditan poligon, impor Shapefile, pemotongan buffer MR/CR, dan penerbitan peta holding.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Audit Logging Aktif
          </span>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Total Aktivitas Hari Ini
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">64</span>
            <span className="text-xs text-gray-500">Log</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Terekam dalam audit trail
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Modifikasi Poligon
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">28</span>
            <span className="text-xs text-gray-500">Blok</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Buffer MR 8m & CR 6m
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Peta Diterbitkan
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">14</span>
            <span className="text-xs text-gray-500">Lembar</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Standar format cetak A4
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Perlu Review Topologi
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">1</span>
            <span className="text-xs text-gray-500">Berkas</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Overlap buffer sempadan
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
            placeholder="Cari pengguna, aktivitas, entitas, IP..."
            className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-8.5 pr-3 text-xs text-gray-800 placeholder-gray-400 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-800 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 cursor-pointer"
          >
            <option value="all">Semua Modul</option>
            <option value="Batas Blok">Batas Blok</option>
            <option value="Infrastruktur Jalan">Infrastruktur Jalan</option>
            <option value="Land Clearing">Land Clearing</option>
            <option value="Kartografi Cetak">Kartografi Cetak</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-800 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="Berhasil">Berhasil</option>
            <option value="Perlu Review">Perlu Review</option>
          </select>

          <span className="text-xs text-gray-500 dark:text-gray-400">
            Total: <strong className="font-semibold text-gray-900 dark:text-white">{filteredLogs.length}</strong> catatan
          </span>
        </div>
      </section>

      {/* Tabel Audit Log */}
      <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-semibold uppercase text-gray-600 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300">
            <tr>
              <th className="px-3.5 py-3">Waktu & Tanggal</th>
              <th className="px-3.5 py-3">Pengguna & Peran</th>
              <th className="px-3 py-3">Modul</th>
              <th className="px-3.5 py-3">Aktivitas</th>
              <th className="px-3 py-3">Entitas Terkait</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3.5 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-gray-500">
                  Tidak ada catatan audit yang sesuai dengan kriteria filter.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <td className="px-3.5 py-3 font-mono text-[11px] text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {log.waktu}
                  </td>

                  <td className="px-3.5 py-3">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {log.pengguna}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {log.peran}
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <span className="inline-block rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {log.modul}
                    </span>
                  </td>

                  <td className="px-3.5 py-3 font-medium text-gray-800 dark:text-gray-200">
                    {log.aktivitas}
                  </td>

                  <td className="px-3 py-3 font-semibold text-gray-900 dark:text-white">
                    {log.entitas}
                  </td>

                  <td className="px-3 py-3">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        log.status === "Berhasil"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50"
                          : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>

                  <td className="px-3.5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setDetailModalItem(log)}
                      className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 shadow-theme-xs cursor-pointer transition-colors"
                    >
                      Rincian
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Modal Detail Audit Log */}
      <Dialog open={Boolean(detailModalItem)} onOpenChange={(open) => !open && setDetailModalItem(null)}>
        {detailModalItem && (
          <DialogContent className="sm:max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                Rincian Log Audit #{detailModalItem.id}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
                {detailModalItem.waktu} • IP: {detailModalItem.ip_address}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs mt-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-gray-800/30 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Pengguna:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {detailModalItem.pengguna} ({detailModalItem.peran})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Aktivitas:</span>
                  <span className="font-semibold text-brand-600 dark:text-brand-400">{detailModalItem.aktivitas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Entitas Objek:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{detailModalItem.entitas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status Validasi:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{detailModalItem.status}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Detail Modifikasi Spasial:</span>
                <p className="rounded-lg bg-gray-50 p-2.5 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300 border border-gray-100 dark:border-gray-800">
                  {detailModalItem.detail_perubahan}
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
