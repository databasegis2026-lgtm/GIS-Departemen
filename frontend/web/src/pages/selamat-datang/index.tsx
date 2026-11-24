import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import { buttonVariants } from "@/components/ui/button";
import { CalendarIcon, TableIcon } from "@/icons";
import { cn } from "@/utils";
import { useState } from "react";
import { Link } from "react-router";
import OperationalMetrics from "./components/operational-metrics";
import OperationalSummaryCard from "./components/operational-summary-card";
import QuickNavigation from "./components/quick-navigation";

function getGreeting(hour: number): string {
  if (hour >= 4 && hour < 11) return "Selamat Pagi";
  if (hour >= 11 && hour < 15) return "Selamat Siang";
  if (hour >= 15 && hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}

export default function SelamatDatangPage() {
  const [userName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("gis_username") || "Rudi Wahyudi";
    }
    return "Rudi Wahyudi";
  });

  const [greeting] = useState(() => {
    return getGreeting(new Date().getHours());
  });

  const [currentDate] = useState(() => {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  });

  return (
    <div className="space-y-6">
      <PageMeta
        title="Selamat Datang | GIS Departemen"
        description="Portal Utama Sistem Informasi Geografis & Manajemen Operasional Perkebunan"
      />

      <PageBreadcrumb pageTitle="Selamat Datang" />

      {/* Header Banner TailAdmin Template Style with Dynamic Greeting */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-800 sm:text-2xl dark:text-white/90">
              {greeting}, {userName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sistem Informasi Geografis & Manajemen Data Operasional Perkebunan Kelapa Sawit
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-300">
              <CalendarIcon className="size-4 text-gray-500 dark:text-gray-400" />
              <span>{currentDate}</span>
            </div>
            <Link
              to="/data-operasional"
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
            >
              <TableIcon className="size-4" />
              <span>Data Operasional</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Operational KPI Metric Cards */}
      <OperationalMetrics />

      {/* Navigasi Cepat Modul Utama GIS */}
      <QuickNavigation />

      {/* Ringkasan Capaian Modul Data Operasional */}
      <OperationalSummaryCard />
    </div>
  );
}
