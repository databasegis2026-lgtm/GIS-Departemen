import type { MapTicket } from "../types";

interface TicketUserTableProps {
  tickets: MapTicket[];
  onDownload: (ticket: MapTicket, kind: "attachment" | "result") => void;
  onOpenRevisionDrawer: (ticket: MapTicket) => void;
  onOpenEditDrawer: (ticket: MapTicket) => void;
  canEdit?: boolean;
}

const STATUS_BADGES = {
  submitted: {
    label: "Diajukan",
    cls: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50",
  },
  in_progress: {
    label: "Diproses",
    cls: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50",
  },
  revision_requested: {
    label: "Revisi",
    cls: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50",
  },
  completed: {
    label: "Selesai",
    cls: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50",
  },
};

export default function TicketUserTable({
  tickets = [],
  onDownload,
  onOpenRevisionDrawer,
  onOpenEditDrawer,
  canEdit = true,
}: TicketUserTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-semibold text-gray-600 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300 uppercase">
          <tr>
            <th className="px-3.5 py-3">No. Tiket</th>
            <th className="px-3.5 py-3">Pekerjaan</th>
            <th className="px-3.5 py-3">Lokasi</th>
            <th className="px-3.5 py-3">Admin GIS</th>
            <th className="px-3.5 py-3">Status</th>
            <th className="px-3.5 py-3">Peta Hasil</th>
            {canEdit && <th className="px-3.5 py-3 text-right">Aksi</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {tickets.map((t) => {
            const badge = STATUS_BADGES[t.status];

            return (
              <tr
                key={t.ticket_id}
                className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
              >
                {/* No. Tiket */}
                <td className="px-3.5 py-3">
                  <div className="font-semibold text-gray-900 dark:text-white font-mono text-xs">
                    {t.ticket_number}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {t.created_at}
                  </div>
                </td>

                {/* Pekerjaan */}
                <td className="px-3.5 py-3 max-w-xs">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {t.title}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {t.work_type} • <span className="font-semibold">{t.map_type}</span>
                  </div>
                </td>

                {/* Lokasi Kebun */}
                <td className="px-3.5 py-3">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {t.estate} • {t.afdeling}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">
                    Blok {t.block_number && t.block_number !== "-" ? t.block_number : "-"}
                  </div>
                </td>

                {/* Admin GIS */}
                <td className="px-3.5 py-3">
                  <div className="font-medium text-gray-800 dark:text-gray-200">
                    {t.order_name}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Diajukan: {t.target_date}
                  </div>
                </td>

                {/* Status */}
                <td className="px-3.5 py-3">
                  <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
                    {badge.label}
                  </span>
                  {t.progress_description && (
                    <div className="text-[10px] text-gray-400 mt-0.5 max-w-[150px] truncate" title={t.progress_description}>
                      {t.progress_description}
                    </div>
                  )}
                </td>

                {/* Peta Hasil */}
                <td className="px-3.5 py-3">
                  {t.result_pdf_name ? (
                    <button
                      type="button"
                      onClick={() => onDownload(t, "result")}
                      className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 cursor-pointer shadow-theme-xs"
                    >
                      <svg className="size-3 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span>Unduh PDF</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-gray-400">Sedang diproses</span>
                  )}
                </td>

                {/* Aksi Pemohon */}
                {canEdit && (
                  <td className="px-3.5 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      {t.status === "completed" || t.status === "revision_requested" ? (
                        <button
                          type="button"
                          onClick={() => onOpenRevisionDrawer(t)}
                          className="inline-flex items-center gap-1 cursor-pointer rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 shadow-theme-xs"
                          title="Ajukan koreksi"
                        >
                          <span>Revisi</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenEditDrawer(t)}
                          className="inline-flex items-center gap-1 cursor-pointer rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 shadow-theme-xs"
                          title="Edit catatan"
                        >
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
