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

export interface SystemNotification {
  id: string;
  waktu: string;
  judul: string;
  kategori: "Kepatuhan Agronomi" | "Batas Spasial & Topologi" | "SLA Layanan GIS" | "Informasi Operasional";
  tingkat: "Kritis" | "Peringatan" | "Info";
  blok_terkait: string;
  estate: string;
  pesan: string;
  rekomendasi: string;
  dibaca: boolean;
}

const MOCK_NOTIFICATIONS: SystemNotification[] = [];

export default function NotifikasiPage() {
  const [notifications, setNotifications] = useState<SystemNotification[]>(MOCK_NOTIFICATIONS);
  const [kategoriFilter, setKategoriFilter] = useState<string>("all");
  const [tingkatFilter, setTingkatFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailModalItem, setDetailModalItem] = useState<SystemNotification | null>(null);

  const filteredNotifs = useMemo(() => {
    return notifications.filter((item) => {
      if (kategoriFilter !== "all" && item.kategori !== kategoriFilter) return false;
      if (tingkatFilter !== "all" && item.tingkat !== tingkatFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.judul.toLowerCase().includes(q) ||
        item.blok_terkait.toLowerCase().includes(q) ||
        item.estate.toLowerCase().includes(q) ||
        item.pesan.toLowerCase().includes(q)
      );
    });
  }, [notifications, kategoriFilter, tingkatFilter, searchQuery]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, dibaca: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, dibaca: true })));
  };

  const unreadCount = notifications.filter((n) => !n.dibaca).length;

  return (
    <div className="space-y-4">
      <PageMeta
        title="Pusat Notifikasi & Early Warning - Departemen GIS PT BUM & BSL"
        description="Pemberitahuan pelanggaran SOP agronomi, anomali spasial, dan pembaruan antrean peta"
      />

      <PageBreadcrumb pageTitle="Pusat Notifikasi" />

      {/* Header */}
      <header className="flex flex-col gap-2 border-b border-gray-200 pb-3.5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between -mt-3">
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">
            Pusat Notifikasi & Peringatan Dini
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Pemberitahuan otomatis validasi prasyarat agronomi kebun, peringatan batas HCV sempadan, dan status SLA peta.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer shadow-theme-xs transition-colors"
            >
              Tandai Semua Dibaca
            </button>
          )}
          <span className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            {unreadCount} Belum Dibaca
          </span>
        </div>
      </header>

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
            placeholder="Cari notifikasi, blok, atau estate..."
            className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-8.5 pr-3 text-xs text-gray-800 placeholder-gray-400 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-800 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 cursor-pointer"
          >
            <option value="all">Semua Kategori</option>
            <option value="Kepatuhan Agronomi">Kepatuhan Agronomi</option>
            <option value="Batas Spasial & Topologi">Batas Spasial & Topologi</option>
            <option value="SLA Layanan GIS">SLA Layanan GIS</option>
            <option value="Informasi Operasional">Informasi Operasional</option>
          </select>

          <select
            value={tingkatFilter}
            onChange={(e) => setTingkatFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-800 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 cursor-pointer"
          >
            <option value="all">Semua Tingkat</option>
            <option value="Kritis">Kritis</option>
            <option value="Peringatan">Peringatan</option>
            <option value="Info">Info</option>
          </select>

          <span className="text-xs text-gray-500 dark:text-gray-400">
            Total: <strong className="font-semibold text-gray-900 dark:text-white">{filteredNotifs.length}</strong> notifikasi
          </span>
        </div>
      </section>

      {/* List Notifikasi */}
      <section className="space-y-2.5">
        {filteredNotifs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-900/30">
            Tidak ada notifikasi yang sesuai dengan kriteria filter.
          </div>
        ) : (
          filteredNotifs.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 rounded-xl border p-4 transition-all ${
                item.dibaca
                  ? "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                  : "border-brand-300 bg-brand-50/20 dark:border-brand-800 dark:bg-brand-950/20"
              } shadow-theme-xs`}
            >
              <div className="mt-0.5">
                <span
                  className={`flex size-8 items-center justify-center rounded-lg ${
                    item.tingkat === "Kritis"
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400"
                      : item.tingkat === "Peringatan"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                  }`}
                >
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {item.tingkat === "Kritis" ? (
                      <circle cx="12" cy="12" r="10" />
                    ) : (
                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    )}
                  </svg>
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-xs text-gray-900 dark:text-white">
                      {item.judul}
                    </h3>
                    <span
                      className={`inline-block rounded-md px-1.5 py-0.2 text-[10px] font-semibold ${
                        item.tingkat === "Kritis"
                          ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50"
                          : item.tingkat === "Peringatan"
                            ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50"
                            : "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50"
                      }`}
                    >
                      {item.tingkat}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      • {item.blok_terkait} ({item.estate})
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {item.waktu}
                  </span>
                </div>

                <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                  {item.pesan}
                </p>

                <div className="mt-2.5 flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => {
                      markAsRead(item.id);
                      setDetailModalItem(item);
                    }}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 cursor-pointer"
                  >
                    Tindak Lanjut & Rekomendasi
                  </button>
                  {!item.dibaca && (
                    <button
                      type="button"
                      onClick={() => markAsRead(item.id)}
                      className="text-[11px] text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      Tandai sudah dibaca
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Modal Detail Tindak Lanjut Notifikasi */}
      <Dialog open={Boolean(detailModalItem)} onOpenChange={(open) => !open && setDetailModalItem(null)}>
        {detailModalItem && (
          <DialogContent className="sm:max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                {detailModalItem.judul}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
                {detailModalItem.blok_terkait} • {detailModalItem.estate}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs mt-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-gray-800/30 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Kategori:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{detailModalItem.kategori}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tingkat Bahaya:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">{detailModalItem.tingkat}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Rincian Masalah:</span>
                <p className="rounded-lg bg-gray-50 p-2.5 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300 border border-gray-100 dark:border-gray-800">
                  {detailModalItem.pesan}
                </p>
              </div>

              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Rekomendasi Tindakan Agronomi / GIS:</span>
                <p className="rounded-lg bg-emerald-50/60 p-2.5 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
                  {detailModalItem.rekomendasi}
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
