import type { MapTicket, TicketStatus } from "../types";

interface TicketStatsBarProps {
  tickets: MapTicket[];
  activeFilter: TicketStatus;
  onSelectFilter: (status: TicketStatus) => void;
}

export default function TicketStatsBar({
  tickets = [],
  activeFilter = "all",
  onSelectFilter,
}: TicketStatsBarProps) {
  const counts = {
    all: tickets.length,
    submitted: tickets.filter((t) => t.status === "submitted").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    completed: tickets.filter((t) => t.status === "completed").length,
    revision_requested: tickets.filter((t) => t.status === "revision_requested").length,
  };

  const statItems = [
    {
      id: "all" as TicketStatus,
      label: "Semua",
      count: counts.all,
    },
    {
      id: "submitted" as TicketStatus,
      label: "Diajukan",
      count: counts.submitted,
    },
    {
      id: "in_progress" as TicketStatus,
      label: "Diproses",
      count: counts.in_progress,
    },
    {
      id: "completed" as TicketStatus,
      label: "Selesai",
      count: counts.completed,
    },
    {
      id: "revision_requested" as TicketStatus,
      label: "Revisi",
      count: counts.revision_requested,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {statItems.map((item) => {
        const isActive = activeFilter === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectFilter(item.id)}
            className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
              isActive
                ? "border-brand-500 bg-brand-50/15 dark:border-brand-500 dark:bg-brand-950/20 ring-1 ring-brand-500"
                : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 shadow-theme-xs"
            }`}
          >
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {item.label}
            </span>
            <span className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {item.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
