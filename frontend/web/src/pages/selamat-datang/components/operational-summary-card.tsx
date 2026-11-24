import { ArrowRightIcon, TableIcon } from "@/icons";
import { Link } from "react-router";
import type { OperationalSummaryItem } from "../types";

const operationalModules: OperationalSummaryItem[] = [
  {
    key: "produksi",
    title: "Produksi (Panen TBS & TPH)",
    path: "/data-operasional/produksi",
    progress: 92,
    completedText: "1.284 / 1.400 Ton Target",
    status: "normal",
  },
  {
    key: "pemupukan",
    title: "Pemupukan",
    path: "/data-operasional/perawatan/pemupukan",
    progress: 84,
    completedText: "420 / 500 Ha Selesai",
    status: "active",
  },
  {
    key: "semprot",
    title: "Semprot",
    path: "/data-operasional/perawatan/semprot",
    progress: 78,
    completedText: "315 / 400 Ha Selesai",
    status: "normal",
  },
  {
    key: "pruning",
    title: "Pruning",
    path: "/data-operasional/perawatan/pruning",
    progress: 88,
    completedText: "530 / 600 Ha Selesai",
    status: "normal",
  },
  {
    key: "pasar_pikul",
    title: "Pasar Pikul",
    path: "/data-operasional/perawatan/pasar-pikul",
    progress: 70,
    completedText: "140 / 200 Ha Selesai",
    status: "review",
  },
  {
    key: "jangkos",
    title: "Jangkos",
    path: "/data-operasional/perawatan/jangkos",
    progress: 65,
    completedText: "260 / 400 Ha Selesai",
    status: "normal",
  },
];

export default function OperationalSummaryCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white/90">
            <TableIcon className="size-5" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Status Data Operasional
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Progres modul produksi & perawatan kebun
            </p>
          </div>
        </div>

        <Link
          to="/data-operasional"
          className="text-xs font-semibold text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          Lihat Semua
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
        {operationalModules.map((item) => (
          <Link
            key={item.key}
            to={item.path}
            className="group block rounded-xl border border-gray-100 p-3.5 transition-all hover:border-brand-500 hover:bg-gray-50/50 dark:border-gray-800 dark:hover:border-brand-500 dark:hover:bg-white/[0.02]"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-800 group-hover:text-brand-600 dark:text-white/90 dark:group-hover:text-brand-400">
                {item.title}
              </span>
              <span className="font-bold text-gray-700 dark:text-gray-300">
                {item.progress}%
              </span>
            </div>

            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                style={{ width: `${item.progress}%` }}
                className={`h-full rounded-full transition-all duration-300 ${
                  item.progress >= 80
                    ? "bg-brand-500"
                    : item.progress >= 70
                    ? "bg-amber-500"
                    : "bg-blue-500"
                }`}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
              <span>{item.completedText}</span>
              <span className="inline-flex items-center gap-1 font-medium text-brand-500 group-hover:underline dark:text-brand-400">
                <span>Buka</span>
                <ArrowRightIcon className="size-2.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
