import {
  ArrowRightIcon,
  BarChartIcon,
  BellIcon,
  BoxIcon,
  CheckCircleIcon,
  MapIcon,
  PieChartIcon,
  TableIcon,
  TicketIcon,
} from "@/icons";
import { Link } from "react-router";

interface QuickNavItem {
  title: string;
  path: string;
  description: string;
  badge: string;
  icon: React.ReactNode;
}

const quickNavItems: QuickNavItem[] = [
  {
    title: "Dashboard Operasional",
    path: "/dashboard",
    description: "Monitoring ringkasan capaian produksi dan perawatan kebun secara berkala.",
    badge: "Produksi & Perawatan",
    icon: <PieChartIcon className="size-5" />,
  },
  {
    title: "Data Operasional",
    path: "/data-operasional",
    description: "Pencatatan realisasi produksi TBS, pemupukan, semprot, pruning, dan jangkos.",
    badge: "6 Modul Operasional",
    icon: <TableIcon className="size-5" />,
  },
  {
    title: "Grafik & Analitik",
    path: "/grafik-analitik",
    description: "Analisis tren grafik produksi, efektivitas perawatan, dan komparasi blok.",
    badge: "Visual Analisis",
    icon: <BarChartIcon className="size-5" />,
  },
  {
    title: "Ticketing Update Peta",
    path: "/ticketing-update-peta",
    description: "Pengajuan dan pelacakan permohonan revisi poligon dan batas spasial kebun.",
    badge: "Layanan Peta",
    icon: <TicketIcon className="size-5" />,
  },
  {
    title: "Verifikasi Data Kebun",
    path: "/verifikasi-data-kebun",
    description: "Pemeriksaan dan persetujuan data lapangan sebelum dimasukkan ke peta resmi.",
    badge: "Validasi Lapangan",
    icon: <CheckCircleIcon className="size-5" />,
  },
  {
    title: "Persiapan Lahan",
    path: "/pembukaan-lahan",
    description: "Pemantauan spasial proses GRTT, land clearing, dan penanaman bibit baru.",
    badge: "GRTT & Land Clearing",
    icon: <MapIcon className="size-5" />,
  },
  {
    title: "Manajemen Aset",
    path: "/aset",
    description: "Database wilayah kebun, sensus pokok sawit, jalan, jembatan, dan kendaraan.",
    badge: "Aset & Inventaris",
    icon: <BoxIcon className="size-5" />,
  },
  {
    title: "Monitoring & Audit",
    path: "/monitoring",
    description: "Audit jejak aktivitas sistem, riwayat pembaruan peta, dan pusat notifikasi.",
    badge: "Log & Notifikasi",
    icon: <BellIcon className="size-5" />,
  },
];

export default function QuickNavigation() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3">
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Navigasi Cepat
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Akses langsung ke seluruh modul sistem informasi geografis & operasional kebun
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickNavItems.map((item) => (
          <Link
            key={item.title}
            to={item.path}
            className="group flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-brand-500 hover:shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02] dark:hover:border-brand-500"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600 dark:bg-gray-800 dark:text-gray-300 dark:group-hover:bg-brand-500/10 dark:group-hover:text-brand-400">
                  {item.icon}
                </div>
                <ArrowRightIcon className="size-4 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500 dark:text-gray-500" />
              </div>

              <h4 className="mt-3.5 text-sm font-semibold text-gray-800 group-hover:text-brand-600 dark:text-white/90 dark:group-hover:text-brand-400">
                {item.title}
              </h4>
              <p className="mt-1 text-xs text-gray-500 line-clamp-2 dark:text-gray-400">
                {item.description}
              </p>
            </div>

            <div className="mt-3.5 border-t border-gray-100 pt-2.5 dark:border-gray-800">
              <span className="text-[11px] font-medium text-brand-500 group-hover:underline dark:text-brand-400">
                {item.badge}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
