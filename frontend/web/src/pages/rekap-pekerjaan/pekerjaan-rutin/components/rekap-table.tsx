import type { RekapPekerjaanRecord, StatusVerifikasiGIS } from "../types";

interface RekapTableProps {
  records: RekapPekerjaanRecord[];
  onOpenDraftMap: (record: RekapPekerjaanRecord) => void;
  onPrintPdf: (record: RekapPekerjaanRecord) => void;
  onOpenUploadShp?: (record: RekapPekerjaanRecord) => void;
  onOpenVerify: (record: RekapPekerjaanRecord) => void;
  onOpenDelete: (record: RekapPekerjaanRecord) => void;
  isGisRole?: boolean;
}

export default function RekapTable({
  records,
  onOpenDraftMap,
  onPrintPdf,
  onOpenUploadShp,
  onOpenVerify,
  onOpenDelete,
  isGisRole = false,
}: RekapTableProps) {
  if (records.length === 0) {
    return (
      <div className="w-full min-w-0 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 p-12 text-center text-gray-500 dark:text-gray-400">
        <svg
          className="size-8 mx-auto text-gray-400 dark:text-gray-600 mb-2"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          Tidak ada data yang cocok
        </h3>
        <p className="mt-0.5 text-xs text-gray-500">
          Sesuaikan filter atau unggah berkas SHP baru.
        </p>
      </div>
    );
  }

  const renderStatusBadge = (status: StatusVerifikasiGIS, record: RekapPekerjaanRecord) => {
    const isCommitted = Boolean(record.database_committed || status === "verified");

    if (isCommitted) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/80">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span>Valid</span>
        </span>
      );
    }

    switch (status) {
      case "revision_requested":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/80">
            <span className="size-1.5 rounded-full bg-rose-500" />
            <span>Revisi</span>
          </span>
        );
      case "in_review":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800/80">
            <span className="size-1.5 rounded-full bg-amber-500" />
            <span>Diproses</span>
          </span>
        );
      case "submitted":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
            <span className="size-1.5 rounded-full bg-sky-500" />
            <span>Diajukan</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full min-w-0 max-w-full relative overflow-x-auto custom-scrollbar rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/50 shadow-xs">
      <table className="w-full text-left text-xs whitespace-nowrap">
        <thead className="bg-gray-50 text-[11px] font-bold text-gray-600 dark:bg-gray-800/80 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="px-3 py-2.5">Lokasi</th>
            <th className="px-2.5 py-2.5">Blok</th>
            <th className="px-3 py-2.5">Aktivitas</th>
            <th className="px-3 py-2.5 text-right">Pokok</th>
            <th className="px-3 py-2.5 text-right">Estimasi (Ha)</th>
            <th className="px-3 py-2.5 text-right">Baku (Ha)</th>
            <th className="px-3 py-2.5 text-center">Capaian</th>
            <th className="px-3 py-2.5">Status</th>
            <th className="px-3 py-2.5">Mandor</th>
            <th className="px-2.5 py-2.5">Tanggal</th>
            {/* Kolom Aksi Sticky */}
            <th className="px-3 py-2.5 text-center sticky right-0 bg-gray-50 dark:bg-gray-800/90 shadow-[-6px_0_10px_rgba(0,0,0,0.06)] border-l border-gray-200 dark:border-gray-700 z-10 min-w-[145px]">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-700 dark:text-gray-300">
          {records.map((r) => {
            const pokok = r.realisasi_pokok || Math.round(r.realisasi_luas_ha * (r.sph || 136));
            const sph = r.sph_blok || r.sph || 136;
            const estimasi = r.luas_estimasi_sph || (pokok / sph);

            return (
              <tr
                key={r.id}
                className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
              >
                {/* 1. Lokasi */}
                <td className="px-3 py-2">
                  <div className="font-bold text-gray-900 dark:text-white">{r.estate}</div>
                  <div className="text-[10.5px] text-gray-500 dark:text-gray-400">{r.afdeling}</div>
                </td>

                {/* 2. Blok */}
                <td className="px-2.5 py-2 font-mono font-extrabold text-gray-900 dark:text-white">
                  {r.blok}
                </td>

                {/* 3. Aktivitas */}
                <td className="px-3 py-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-200 uppercase">
                    {r.aktivitas.replace("_", " ")}
                  </span>
                  <div className="text-[10.5px] text-gray-500">{r.kondisi}</div>
                </td>

                {/* 4. Pokok */}
                <td className="px-3 py-2 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                  {pokok.toLocaleString("id-ID")}
                </td>

                {/* 5. Estimasi (Ha) */}
                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {estimasi.toFixed(2)}
                </td>

                {/* 6. Baku (Ha) */}
                <td className="px-3 py-2 text-right font-mono text-gray-700 dark:text-gray-300">
                  {r.luas_ha.toFixed(1)}
                </td>

                {/* 7. Capaian (%) */}
                <td className="px-3 py-2 text-center font-mono font-bold text-gray-800 dark:text-gray-200">
                  {r.capaian_persen.toFixed(0)}%
                </td>

                {/* 8. Status */}
                <td className="px-3 py-2">
                  {renderStatusBadge(r.status_verifikasi, r)}
                </td>

                {/* 9. Mandor */}
                <td className="px-3 py-2 max-w-[140px] truncate" title={r.kontraktor}>
                  {r.kontraktor}
                </td>

                {/* 10. Tanggal */}
                <td className="px-2.5 py-2 font-mono text-[11px] text-gray-600 dark:text-gray-400">
                  {r.tanggal}
                </td>

                {/* 11. Aksi Sticky */}
                <td className="px-2.5 py-2 text-center sticky right-0 bg-white group-hover:bg-gray-50 dark:bg-gray-900 dark:group-hover:bg-gray-850 shadow-[-6px_0_10px_rgba(0,0,0,0.06)] border-l border-gray-200 dark:border-gray-700 z-10 transition-colors">
                  <div className="inline-flex items-center gap-1.5 justify-center">
                    {/* Aksi 1: Peta Layar Penuh */}
                    <button
                      type="button"
                      onClick={() => onOpenDraftMap(r)}
                      title="Buka Peta Layar Penuh"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 transition-colors cursor-pointer shadow-2xs"
                    >
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                        <polyline points="2 17 12 22 22 17" />
                        <polyline points="2 12 12 17 22 12" />
                      </svg>
                      <span>Peta</span>
                    </button>

                    {/* Aksi 2: Cetak PDF */}
                    <button
                      type="button"
                      onClick={() => onPrintPdf(r)}
                      title="Cetak PDF Rekap"
                      className="inline-flex items-center justify-center size-7 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-700 transition-colors cursor-pointer"
                    >
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 6 2 18 2 18 9" />
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                        <rect x="6" y="14" width="12" height="8" />
                      </svg>
                    </button>

                    {/* Aksi 3: Unggah SHP */}
                    {onOpenUploadShp && (
                      <button
                        type="button"
                        onClick={() => onOpenUploadShp(r)}
                        title="Unggah SHP"
                        className="inline-flex items-center justify-center size-7 rounded-md bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 border border-sky-200 dark:bg-sky-950/50 dark:text-sky-400 dark:border-sky-800 transition-colors cursor-pointer"
                      >
                        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </button>
                    )}

                    {/* Aksi 4: Verifikasi GIS */}
                    {isGisRole && (
                      <button
                        type="button"
                        onClick={() => onOpenVerify(r)}
                        title="Verifikasi GIS"
                        className="inline-flex items-center justify-center size-7 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer"
                      >
                        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                      </button>
                    )}

                    {/* Aksi 5: Hapus Data */}
                    <button
                      type="button"
                      onClick={() => onOpenDelete(r)}
                      title="Hapus"
                      className="inline-flex items-center justify-center size-7 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800 transition-colors cursor-pointer"
                    >
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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
