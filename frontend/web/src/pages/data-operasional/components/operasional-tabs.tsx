import type { AktivitasType, OperasionalRecord } from "../types";

interface OperasionalTabsProps {
  activeTab: AktivitasType;
  onChangeTab: (tab: AktivitasType) => void;
  records: OperasionalRecord[];
}

export default function OperasionalTabs({
  activeTab,
  onChangeTab,
  records,
}: OperasionalTabsProps) {
  const tabs: { id: AktivitasType; label: string }[] = [
    { id: "pruning", label: "Pruning" },
    { id: "semprot", label: "Semprot" },
    { id: "pemupukan", label: "Pemupukan" },
    { id: "pasar_pikul", label: "Pasar Pikul" },
    { id: "jangkos", label: "Jangkos" },
    { id: "produksi", label: "Produksi" },
  ];

  const getCount = (tabId: AktivitasType) => {
    return records.filter((r) => r.aktivitas === tabId).length;
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200 dark:border-slate-800">
      {tabs.map((t) => {
        const isActive = activeTab === t.id;
        const count = getCount(t.id);
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChangeTab(t.id)}
            className={`cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
              isActive
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                isActive
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
