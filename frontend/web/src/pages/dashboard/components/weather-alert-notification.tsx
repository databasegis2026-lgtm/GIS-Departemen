import { AlertIcon, XIcon } from "@/icons";
import type { WeatherCondition } from "../types";

interface WeatherAlertNotificationProps {
  weatherAlert?: WeatherCondition;
  onDismiss?: () => void;
  compact?: boolean;
}

export default function WeatherAlertNotification({
  weatherAlert = "cerah",
  onDismiss,
  compact = false,
}: WeatherAlertNotificationProps) {
  if (!weatherAlert || weatherAlert === "cerah") {
    return null;
  }

  const alertConfig = {
    hujan_lebat: {
      borderColor: "border-amber-300 dark:border-amber-900/60",
      bgColor: "bg-amber-50 dark:bg-amber-950/50",
      textColor: "text-amber-900 dark:text-amber-200",
      badgeColor: "bg-amber-500 text-white",
      iconColor: "text-amber-600 dark:text-amber-400",
      title: "PERINGATAN CUACA: HUJAN LEBAT & PETIR",
      message:
        "Terdeteksi petir dan intensitas hujan tinggi di wilayah operasional kebun. Instruksi Lapangan (K3): Hentikan segera pekerjaan semprot herbisida & pemupukan terbuka, dan evakuasi tenaga kerja panen ke pos mandor/warung terdekat demi keselamatan K3!",
    },
    badai: {
      borderColor: "border-rose-300 dark:border-rose-900/60",
      bgColor: "bg-rose-50 dark:bg-rose-950/50",
      textColor: "text-rose-900 dark:text-rose-200",
      badgeColor: "bg-rose-600 text-white",
      iconColor: "text-rose-600 dark:text-rose-400",
      title: "PERINGATAN DARURAT: BADAI TROPIS & ANGIN KENCANG",
      message:
        "Kecepatan angin melebihi 45 km/jam dengan potensi pohon/pelepah tumbang. Instruksi K3: Hentikan total seluruh alat berat, traktor pengangkut, dan aktivitas di bawah tegakan pohon sawit tua!",
    },
    banjir: {
      borderColor: "border-blue-300 dark:border-blue-900/60",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
      textColor: "text-blue-900 dark:text-blue-200",
      badgeColor: "bg-blue-600 text-white",
      iconColor: "text-blue-600 dark:text-blue-400",
      title: "PERINGATAN SIAGA: LUAPAN AIR & GENANGAN PARIT RENDANGAN",
      message:
        "Tinggi muka air parit primer melebihi ambang batas di blok rendahan Estate BUM 1 & BSL. Instruksi Lapangan: Alihkan rute dump truck ke jalan poros tinggi dan buka pintu air suplesi!",
    },
  }[weatherAlert];

  if (!alertConfig) return null;

  return (
    <div
      className={`rounded-xl border ${alertConfig.borderColor} ${alertConfig.bgColor} ${alertConfig.textColor} shadow-xs transition-all ${
        compact ? "p-2 text-xs" : "p-3 sm:px-4 text-xs sm:text-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 shrink-0">
            <AlertIcon className={`size-4 sm:size-5 ${alertConfig.iconColor} animate-bounce`} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-md px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${alertConfig.badgeColor}`}>
                {alertConfig.title}
              </span>
              <span className="text-[10px] sm:text-xs font-bold opacity-90">
                Peringatan Operasional Lapangan
              </span>
            </div>
            <p className={`mt-1 font-medium leading-relaxed opacity-95 ${compact ? "text-[10.5px]" : "text-xs"}`}>
              {alertConfig.message}
            </p>
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="cursor-pointer rounded-md p-1 text-gray-500 hover:bg-black/5 hover:text-gray-800 dark:hover:bg-white/5 dark:hover:text-white"
            title="Tutup Notifikasi"
          >
            <XIcon className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
