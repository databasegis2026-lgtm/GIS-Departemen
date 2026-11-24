import type { RekapPekerjaanRecord } from "../types";

interface RekapStatsProps {
  records: RekapPekerjaanRecord[];
}

export default function RekapStats({ records }: RekapStatsProps) {
  const totalAll = records.length;
  const diajukanCount = records.filter((r) => r.status_verifikasi === "submitted").length;
  const diprosesCount = records.filter((r) => r.status_verifikasi === "in_review").length;
  const selesaiCount = records.filter(
    (r) => r.status_verifikasi === "verified" || r.database_committed
  ).length;
  const revisiCount = records.filter(
    (r) => r.status_verifikasi === "revision_requested" || r.status_verifikasi === "rejected"
  ).length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {/* 1. SEMUA */}
      <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            SEMUA
          </span>
          <svg className="size-4 text-gray-400 dark:text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold font-mono text-gray-900 dark:text-white">
            {totalAll}
          </span>
        </div>
      </div>

      {/* 2. DIAJUKAN */}
      <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            DIAJUKAN
          </span>
          <svg className="size-4 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400">
            {diajukanCount}
          </span>
        </div>
      </div>

      {/* 3. DIPROSES */}
      <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            DIPROSES
          </span>
          <svg className="size-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
          </svg>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {diprosesCount}
          </span>
        </div>
      </div>

      {/* 4. VALID */}
      <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            VALID
          </span>
          <svg className="size-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {selesaiCount}
          </span>
        </div>
      </div>

      {/* 5. REVISI */}
      <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900/50 col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            REVISI
          </span>
          <svg className="size-4 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {revisiCount}
          </span>
        </div>
      </div>
    </div>
  );
}
