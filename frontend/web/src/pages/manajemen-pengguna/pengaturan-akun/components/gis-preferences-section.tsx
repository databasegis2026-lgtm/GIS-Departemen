import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { CheckCircleIcon, GlobeIcon, MapIcon } from "@/icons";
import { useState } from "react";

export default function GisPreferencesSection() {
  const [baseMap, setBaseMap] = useState("hybrid");
  const [notifyTicket, setNotifyTicket] = useState(true);
  const [notifyVerification, setNotifyVerification] = useState(true);
  const [notifySummary, setNotifySummary] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSavePreferences = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 4000);
  };

  return (
    <Card className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3">
      <div className="border-b border-gray-100 pb-4 dark:border-gray-800">
        <h3 className="text-base font-semibold text-gray-800 sm:text-lg dark:text-white/90">
          Preferensi GIS & Notifikasi Lapangan
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Atur tampilan peta default, satuan ukuran spasial, dan integrasi notifikasi operasional
        </p>
      </div>

      {isSaved && (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 p-3.5 text-xs font-medium text-green-700 dark:border-green-800/40 dark:bg-green-500/10 dark:text-green-400">
          <CheckCircleIcon className="size-4 shrink-0" />
          <span>Preferensi GIS Anda berhasil disimpan.</span>
        </div>
      )}

      <div className="mt-5 space-y-6">
        {/* Pilihan Basemap Peta */}
        <div>
          <label className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Peta Dasar Default (Default Basemap Layer)
          </label>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Lapisan dasar yang otomatis dimuat saat membuka modul peta kebun
          </p>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                id: "satellite",
                title: "Citra Satelit",
                desc: "Satelit resolusi tinggi terkini",
                icon: <GlobeIcon className="size-5" />,
              },
              {
                id: "hybrid",
                title: "Hibrida Kebun",
                desc: "Satelit + batas blok & jalan kebun",
                icon: <MapIcon className="size-5" />,
              },
              {
                id: "topo",
                title: "Topografi & Kontur",
                desc: "Kontur elevasi & drainase air",
                icon: <GlobeIcon className="size-5" />,
              },
            ].map((mapItem) => (
              <button
                key={mapItem.id}
                type="button"
                onClick={() => setBaseMap(mapItem.id)}
                className={`cursor-pointer rounded-xl border p-4 text-start transition-all ${
                  baseMap === mapItem.id
                    ? "border-brand-500 bg-brand-50/40 dark:border-brand-500 dark:bg-brand-500/10"
                    : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-white/[0.02] dark:hover:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex size-8 items-center justify-center rounded-lg ${
                      baseMap === mapItem.id
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {mapItem.icon}
                  </div>
                  {baseMap === mapItem.id && (
                    <span className="size-2 rounded-full bg-brand-500" />
                  )}
                </div>
                <h5 className="mt-3 text-xs font-bold text-gray-800 dark:text-white/90">
                  {mapItem.title}
                </h5>
                <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                  {mapItem.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Satuan Luas */}
        <div>
          <label className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Satuan Luas Spasial
          </label>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Standar baku perhitungan luas blok perkebunan kelapa sawit
          </p>

          <div className="mt-3 flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-lg border border-brand-500 bg-brand-50 px-4 py-2 text-xs font-semibold text-brand-600 dark:border-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
              <span className="size-2 rounded-full bg-brand-500" />
              <span>Hektar (Ha) - Standar Baku Perkebunan</span>
            </div>
          </div>
        </div>

        {/* Notifikasi Sistem */}
        <div className="border-t border-gray-100 pt-5 dark:border-gray-800">
          <label className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Notifikasi Operasional Lapangan
          </label>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Pemberitahuan email & push notification saat ada aktivitas spasial
          </p>

          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3.5 dark:border-gray-800">
              <div>
                <span className="text-xs font-semibold text-gray-800 dark:text-white/90">
                  Tiket Update Peta Baru
                </span>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Kirim notifikasi setiap ada laporan koreksi poligon atau batas kebun baru
                </p>
              </div>
              <Switch
                checked={notifyTicket}
                onCheckedChange={(checked) => setNotifyTicket(Boolean(checked))}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3.5 dark:border-gray-800">
              <div>
                <span className="text-xs font-semibold text-gray-800 dark:text-white/90">
                  Verifikasi Data Kebun
                </span>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Notifikasi saat data panen & pemupukan lapangan memerlukan persetujuan asisten
                </p>
              </div>
              <Switch
                checked={notifyVerification}
                onCheckedChange={(checked) =>
                  setNotifyVerification(Boolean(checked))
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3.5 dark:border-gray-800">
              <div>
                <span className="text-xs font-semibold text-gray-800 dark:text-white/90">
                  Ringkasan Mingguan Operasional
                </span>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Rekap mingguan perkembangan sensus pokok, jalan kebun, dan pemupukan
                </p>
              </div>
              <Switch
                checked={notifySummary}
                onCheckedChange={(checked) => setNotifySummary(Boolean(checked))}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSavePreferences}>
            Simpan Preferensi
          </Button>
        </div>
      </div>
    </Card>
  );
}
