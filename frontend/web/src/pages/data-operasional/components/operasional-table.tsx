import type { OperasionalRecord } from "../types";
import { getStatusHexColor } from "../mock-operasional";

interface OperasionalTableProps {
  records: OperasionalRecord[];
  onOpenDetail: (record: OperasionalRecord) => void;
  onOpenEdit: (record: OperasionalRecord) => void;
  onOpenDelete: (record: OperasionalRecord) => void;
  onOpenAfdelingMap: (record: OperasionalRecord) => void;
}

export default function OperasionalTable({
  records,
  onOpenDetail,
  onOpenEdit,
  onOpenDelete,
  onOpenAfdelingMap,
}: OperasionalTableProps) {
  if (records.length === 0) {
    return (
      <div className="w-full min-w-0 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/30">
        <svg className="size-8 mx-auto text-slate-400 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Tidak ada data operasional yang cocok
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Coba sesuaikan filter atau tambahkan data operasional baru.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full relative overflow-x-auto custom-scrollbar rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40 shadow-xs">
      <table className="w-full text-left text-xs whitespace-nowrap">
        <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 dark:bg-slate-800/80 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th className="px-3 py-2.5">Region</th>
            <th className="px-3 py-2.5">Estate</th>
            <th className="px-2.5 py-2.5">Afdeling</th>
            <th className="px-2.5 py-2.5">Blok</th>
            <th className="px-2.5 py-2.5">Warung</th>
            <th className="px-3 py-2.5 text-right">Luas (Ha)</th>
            <th className="px-3 py-2.5 text-right">Realisasi (Ha)</th>
            <th className="px-3 py-2.5 text-center">Capaian (%)</th>
            <th className="px-2.5 py-2.5 text-right">SPH</th>
            <th className="px-3 py-2.5">Kondisi</th>
            <th className="px-3 py-2.5">Kontraktor</th>
            <th className="px-2.5 py-2.5">Update Peta</th>
            <th className="px-2.5 py-2.5">Periode</th>
            <th className="px-2.5 py-2.5">Tanggal</th>
            <th className="px-3.5 py-2.5">Keterangan</th>
            {/* Kolom Aksi Sticky dengan border dan shadow kiri yang jelas */}
            <th className="px-3 py-2.5 text-center sticky right-0 bg-slate-50 dark:bg-slate-800/90 shadow-[-6px_0_10px_rgba(0,0,0,0.06)] border-l border-slate-200 dark:border-slate-700 z-10 min-w-[125px]">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
          {records.map((r) => {
            const statusHex = getStatusHexColor(r.kondisi, r.aktivitas);
            const isSynced = r.update_peta.toLowerCase().includes("tersinkron");

            return (
              <tr
                key={r.id}
                className="hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors group"
              >
                {/* 1. Region */}
                <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-[11px]">
                  {r.region}
                </td>

                {/* 2. Estate */}
                <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200">
                  {r.estate}
                </td>

                {/* 3. Afdeling */}
                <td className="px-2.5 py-2 text-slate-600 dark:text-slate-300">
                  {r.afdeling}
                </td>

                {/* 4. Blok */}
                <td className="px-2.5 py-2 font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                  {r.blok}
                </td>

                {/* 5. Warung */}
                <td className="px-2.5 py-2 text-slate-600 dark:text-slate-300">
                  {r.warung}
                </td>

                {/* 6. Luas (Ha) */}
                <td className="px-3 py-2 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                  {r.luas_ha.toFixed(1)}
                </td>

                {/* 7. Realisasi Luas (Ha) */}
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {r.realisasi_luas_ha.toFixed(1)}
                </td>

                {/* 8. Capaian (%) */}
                <td className="px-3 py-2 min-w-[100px]">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {r.capaian_persen.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${r.capaian_persen >= 100
                        ? "bg-emerald-500"
                        : r.capaian_persen >= 75
                          ? "bg-sky-500"
                          : "bg-amber-500"
                        }`}
                      style={{ width: `${Math.min(100, r.capaian_persen)}%` }}
                    />
                  </div>
                </td>

                {/* 9. SPH */}
                <td className="px-2.5 py-2 text-right font-mono text-slate-600 dark:text-slate-300">
                  {r.sph}
                </td>

                {/* 10. Kondisi */}
                <td className="px-3 py-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10.5px] font-bold border shadow-xs"
                    style={{
                      backgroundColor: `${statusHex}18`,
                      color: statusHex,
                      borderColor: `${statusHex}40`,
                    }}
                  >
                    <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: statusHex }} />
                    <span>{r.kondisi}</span>
                  </span>
                </td>

                {/* 11. Kontraktor */}
                <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                  {r.kontraktor}
                </td>

                {/* 12. Update Peta */}
                <td className="px-2.5 py-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${isSynced
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                      }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${isSynced ? "bg-emerald-500" : "bg-amber-500"}`}
                    />
                    <span>{r.update_peta}</span>
                  </span>
                </td>

                {/* 13. Periode */}
                <td className="px-2.5 py-2 font-mono text-slate-500 dark:text-slate-400">
                  {r.periode}
                </td>

                {/* 14. Tanggal */}
                <td className="px-2.5 py-2 font-mono text-slate-600 dark:text-slate-300">
                  {r.tanggal}
                </td>

                {/* 15. Keterangan */}
                <td className="px-3.5 py-2 max-w-[200px] truncate text-slate-500 dark:text-slate-400" title={r.keterangan}>
                  {r.keterangan}
                </td>

                {/* 16. Aksi (Sticky Selalu Terlihat Jelas) */}
                <td className="px-2.5 py-2 text-center sticky right-0 bg-white group-hover:bg-slate-50 dark:bg-slate-900 dark:group-hover:bg-slate-800 shadow-[-6px_0_10px_rgba(0,0,0,0.06)] border-l border-slate-200 dark:border-slate-700 z-10 transition-colors">
                  <div className="inline-flex items-center gap-1 justify-center">
                    {/* Aksi 1: Peta Polygon Blok per Afdeling */}
                    <button
                      type="button"
                      onClick={() => onOpenAfdelingMap(r)}
                      title="Lihat Peta Polygon Blok per Afdeling"
                      className="inline-flex items-center justify-center size-7 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/60 cursor-pointer transition-colors shadow-2xs border border-blue-200 dark:border-blue-800"
                    >
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                        <polyline points="2 17 12 22 22 17" />
                        <polyline points="2 12 12 17 22 12" />
                      </svg>
                    </button>

                    {/* Aksi 2: Edit Data */}
                    <button
                      type="button"
                      onClick={() => onOpenEdit(r)}
                      title="Edit Data Operasional"
                      className="inline-flex items-center justify-center size-7 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>

                    {/* Aksi 3: Hapus Data */}
                    <button
                      type="button"
                      onClick={() => onOpenDelete(r)}
                      title="Hapus Data Operasional"
                      className="inline-flex items-center justify-center size-7 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/60 cursor-pointer transition-colors border border-rose-200 dark:border-rose-800"
                    >
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>

                    {/* Aksi 4: Detail Lengkap */}
                    <button
                      type="button"
                      onClick={() => onOpenDetail(r)}
                      title="Detail Informasi Blok"
                      className="inline-flex items-center justify-center size-7 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors"
                    >
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
