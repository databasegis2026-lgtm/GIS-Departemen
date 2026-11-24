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

export type MonitoringTab = "early_warning" | "audit_trail" | "gis_sla";
export type AlertSeverity = "all" | "critical" | "warning" | "info";

export interface EarlyWarningItem {
  id: string;
  blok: string;
  region: "REGION 1" | "REGION 2" | "REGION 3";
  estate: string;
  afdeling: string;
  jenis_anomali: string;
  tingkat: "Kritis" | "Peringatan" | "Informasi";
  tingkat_key: "critical" | "warning" | "info";
  pekerjaan_terkait: string;
  pesan_validasi: string;
  rekomendasi_tindakan: string;
  status: "Belum Ditindaklanjuti" | "Sedang Diverifikasi" | "Terselesaikan";
  tanggal_terdeteksi: string;
}

export interface AuditLogItem {
  id: string;
  waktu: string;
  pengguna: string;
  peran: string;
  aktivitas: string;
  entitas: string;
  detail_perubahan: string;
  ip_address: string;
}

export interface GisStaffPerformance {
  kode: string;
  nama: string;
  peran: string;
  region_utama: string;
  tiket_selesai: number;
  tiket_aktif: number;
  sla_rata_rata_hari: number;
  akurasi_topologi_pct: number;
}

const MOCK_EARLY_WARNINGS: EarlyWarningItem[] = [];

const MOCK_AUDIT_LOGS: AuditLogItem[] = [];

const MOCK_GIS_STAFF: GisStaffPerformance[] = [];

export default function MonitoringPage() {
  const [activeTab, setActiveTab] = useState<MonitoringTab>("early_warning");
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("Semua Region");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailModalItem, setDetailModalItem] = useState<EarlyWarningItem | null>(null);

  // Filter Early Warning
  const filteredWarnings = useMemo(() => {
    return MOCK_EARLY_WARNINGS.filter((item) => {
      if (selectedRegion !== "Semua Region" && item.region !== selectedRegion) return false;
      if (severityFilter !== "all" && item.tingkat_key !== severityFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.blok.toLowerCase().includes(q) ||
        item.estate.toLowerCase().includes(q) ||
        item.jenis_anomali.toLowerCase().includes(q) ||
        item.pesan_validasi.toLowerCase().includes(q) ||
        item.pekerjaan_terkait.toLowerCase().includes(q)
      );
    });
  }, [selectedRegion, severityFilter, searchQuery]);

  // Filter Audit Log
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_AUDIT_LOGS;
    const q = searchQuery.toLowerCase().trim();
    return MOCK_AUDIT_LOGS.filter(
      (log) =>
        log.pengguna.toLowerCase().includes(q) ||
        log.aktivitas.toLowerCase().includes(q) ||
        log.entitas.toLowerCase().includes(q) ||
        log.detail_perubahan.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="space-y-4">
      <PageMeta
        title="Monitoring & Audit Spasial GIS - PT BUM & BSL"
        description="Pusat kendali kepatuhan agronomi kebun, deteksi anomali batas spasial, dan audit log pembaruan peta"
      />

      <PageBreadcrumb pageTitle="Monitoring & Audit Spasial" />

      {/* Header */}
      <header className="flex flex-col gap-2 border-b border-gray-200 pb-3.5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between -mt-3">
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">
            Monitoring & Audit Spasial GIS
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Validasi 15 kolom operasional, kepatuhan agronomi prasyarat kerja, dan jejak audit studio GIS PT BUM & BSL.
          </p>
        </div>

        {/* Status Sistem */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Mesin Validasi Aktif
          </span>
          <span className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 shadow-theme-xs">
            SLA Rata-rata: <strong>1.6 Hari</strong>
          </span>
        </div>
      </header>

      {/* KPI Cards Ringkasan Monitoring */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Kepatuhan Agronomi
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              97.8%
            </span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Target Kepatuhan SOP ≥95%
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Alert Prasyarat Aktif
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              2
            </span>
            <span className="text-xs text-gray-500">Blok</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Belum Siap Pupuk / Buffer Sungai
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Peringatan Toleransi Luas
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              1
            </span>
            <span className="text-xs text-gray-500">Blok</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Klaim luas fisik &gt;105%
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Tiket GIS Aktif
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">
              18
            </span>
            <span className="text-xs text-gray-500">Tiket</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            7 Personel GIS (Kode A s.d. G)
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Audit Log Hari Ini
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              64
            </span>
            <span className="text-xs text-gray-500">Aktivitas</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Terekam dalam Geodatabase
          </div>
        </div>
      </section>

      {/* Navigasi Tab Utama */}
      <section className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            {
              id: "early_warning" as MonitoringTab,
              label: "Validasi & Early Warning Agronomi",
              badge: "3 Alert",
            },
            {
              id: "audit_trail" as MonitoringTab,
              label: "Jejak Audit & Log Spasial",
              badge: "Live",
            },
            {
              id: "gis_sla" as MonitoringTab,
              label: "Produktivitas & SLA Tim GIS",
              badge: "7 PIC",
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer ${isActive
                    ? "bg-brand-500 text-white font-semibold shadow-xs"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${isActive
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar Pencarian & Filter */}
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
              placeholder="Cari anomali, blok, aktivitas, atau pengguna..."
              className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-8.5 pr-3 text-xs text-gray-800 placeholder-gray-400 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {activeTab === "early_warning" && (
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-800 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 cursor-pointer"
              >
                <option value="all">Semua Tingkat Urgensi</option>
                <option value="critical">Kritis (Pelanggaran SOP)</option>
                <option value="warning">Peringatan (Deviasi Luas)</option>
                <option value="info">Informasi (Sensus)</option>
              </select>
            )}

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
          </div>
        </div>
      </section>

      {/* Konten Tab 1: Early Warning & Validasi Agronomi */}
      {activeTab === "early_warning" && (
        <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-semibold uppercase text-gray-600 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300">
              <tr>
                <th className="px-3.5 py-3">Tingkat & Waktu</th>
                <th className="px-3 py-3">Blok & Lokasi</th>
                <th className="px-3.5 py-3">Jenis Anomali & Pekerjaan</th>
                <th className="px-3.5 py-3">Pesan Validasi Sistem</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3.5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredWarnings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-gray-500">
                    Tidak ada anomali atau peringatan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredWarnings.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-3.5 py-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${item.tingkat_key === "critical"
                            ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50"
                            : item.tingkat_key === "warning"
                              ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50"
                              : "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50"
                          }`}
                      >
                        {item.tingkat}
                      </span>
                      <div className="text-[10px] text-gray-400 mt-1">
                        {item.tanggal_terdeteksi}
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <div className="font-semibold text-gray-900 dark:text-white font-mono">
                        Blok {item.blok}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {item.estate} • {item.afdeling}
                      </div>
                    </td>

                    <td className="px-3.5 py-3 max-w-xs">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {item.jenis_anomali}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Terkait: {item.pekerjaan_terkait}
                      </div>
                    </td>

                    <td className="px-3.5 py-3 max-w-sm">
                      <p className="text-[11px] text-gray-700 dark:text-gray-300 line-clamp-2" title={item.pesan_validasi}>
                        {item.pesan_validasi}
                      </p>
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${item.status === "Terselesaikan"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : item.status === "Sedang Diverifikasi"
                              ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
                              : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                          }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="px-3.5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setDetailModalItem(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 shadow-theme-xs cursor-pointer transition-colors"
                      >
                        <span>Tinjau</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      )}

      {/* Konten Tab 2: Jejak Audit & Log Spasial */}
      {activeTab === "audit_trail" && (
        <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-semibold uppercase text-gray-600 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300">
              <tr>
                <th className="px-3.5 py-3">Waktu</th>
                <th className="px-3.5 py-3">Pengguna & Peran</th>
                <th className="px-3.5 py-3">Aktivitas</th>
                <th className="px-3 py-3">Entitas Terkait</th>
                <th className="px-3.5 py-3">Rincian Perubahan Spasial</th>
                <th className="px-3.5 py-3 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredLogs.map((log) => (
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

                  <td className="px-3.5 py-3">
                    <span className="inline-block rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                      {log.aktivitas}
                    </span>
                  </td>

                  <td className="px-3 py-3 font-medium text-gray-900 dark:text-white">
                    {log.entitas}
                  </td>

                  <td className="px-3.5 py-3 text-gray-600 dark:text-gray-300 max-w-xs">
                    {log.detail_perubahan}
                  </td>

                  <td className="px-3.5 py-3 font-mono text-[10px] text-gray-400 text-right">
                    {log.ip_address}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Konten Tab 3: Produktivitas & SLA Tim GIS JKO */}
      {activeTab === "gis_sla" && (
        <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-semibold uppercase text-gray-600 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300">
              <tr>
                <th className="px-3.5 py-3">Kode & Nama Personel</th>
                <th className="px-3.5 py-3">Penugasan & Wilayah</th>
                <th className="px-3 py-3 text-center">Tiket Selesai</th>
                <th className="px-3 py-3 text-center">Tiket Aktif</th>
                <th className="px-3 py-3 text-center">Rata-rata SLA</th>
                <th className="px-3.5 py-3 text-right">Akurasi Topologi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {MOCK_GIS_STAFF.map((staff) => (
                <tr
                  key={staff.kode}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <td className="px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-md bg-brand-50 font-bold text-xs text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                        {staff.kode}
                      </span>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {staff.nama}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {staff.peran}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-3.5 py-3 text-gray-700 dark:text-gray-300">
                    {staff.region_utama}
                  </td>

                  <td className="px-3 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    {staff.tiket_selesai}
                  </td>

                  <td className="px-3 py-3 text-center font-bold text-brand-600 dark:text-brand-400">
                    {staff.tiket_aktif}
                  </td>

                  <td className="px-3 py-3 text-center font-semibold text-gray-800 dark:text-gray-200">
                    {staff.sla_rata_rata_hari} Hari
                  </td>

                  <td className="px-3.5 py-3 text-right">
                    <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50">
                      {staff.akurasi_topologi_pct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Modal Tinjau Peringatan Agronomi */}
      <Dialog open={Boolean(detailModalItem)} onOpenChange={(open) => !open && setDetailModalItem(null)}>
        {detailModalItem && (
          <DialogContent className="sm:max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                Tinjauan Anomali Blok {detailModalItem.blok}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
                {detailModalItem.estate} ({detailModalItem.afdeling}) • Terdeteksi {detailModalItem.tanggal_terdeteksi}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs mt-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-gray-800/30 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tingkat Urgensi:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">{detailModalItem.tingkat}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pekerjaan Terkait:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{detailModalItem.pekerjaan_terkait}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status Tindak Lanjut:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">{detailModalItem.status}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Pesan Validasi Sistem:</span>
                <p className="rounded-lg bg-rose-50/60 p-2.5 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                  {detailModalItem.pesan_validasi}
                </p>
              </div>

              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Rekomendasi Tindakan:</span>
                <p className="rounded-lg bg-gray-50 p-2.5 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300 border border-gray-100 dark:border-gray-800">
                  {detailModalItem.rekomendasi_tindakan}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDetailModalItem(null)}
                  className="rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer shadow-theme-xs"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert(`Rekomendasi tindakan untuk Blok ${detailModalItem.blok} telah diteruskan ke Asisten Estate.`);
                    setDetailModalItem(null);
                  }}
                  className="rounded-lg bg-brand-500 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 cursor-pointer shadow-theme-xs transition-colors"
                >
                  Kirim Notifikasi Tindak Lanjut
                </button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
