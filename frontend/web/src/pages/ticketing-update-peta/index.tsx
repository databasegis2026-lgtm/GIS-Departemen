import { useState, useMemo, useCallback } from "react";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import type { MapTicket, RoleMode, TicketStatus } from "./types";
import { DEFAULT_ADMINS, INITIAL_MAP_TICKETS } from "./mock-requests";

// Subkomponen
import TicketStatsBar from "./components/ticket-stats-bar";
import TicketCreateForm from "./components/ticket-create-form";
import TicketAdminTable from "./components/ticket-admin-table";
import TicketUserTable from "./components/ticket-user-table";
import TicketProgressModal from "./components/ticket-progress-modal";
import TicketRevisionModal from "./components/ticket-revision-modal";

const ROLE_OPTIONS: { value: RoleMode; label: string }[] = [
  { value: "superadmin", label: "Superadmin (Manager GIS)" },
  { value: "admin_gis", label: "Admin GIS" },
  { value: "user_estate", label: "User Estate (BUM 1)" },
  { value: "admin_kebun", label: "Admin Kebun (Region 1)" },
  { value: "regional_ho", label: "User Regional HO (Region 1)" },
  { value: "user_global", label: "User Global (Read Only)" },
];

export default function RequestUpdatePetaPage() {
  const [tickets, setTickets] = useState<MapTicket[]>(INITIAL_MAP_TICKETS);
  const [currentRole, setCurrentRole] = useState<RoleMode>("superadmin");
  const [statusFilter, setStatusFilter] = useState<TicketStatus>("all");
  const [adminFilter, setAdminFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [notice, setNotice] = useState("");

  // Modal State
  const [progressModalTicket, setProgressModalTicket] = useState<MapTicket | null>(null);
  const [revisionModalConfig, setRevisionModalConfig] = useState<{
    ticket: MapTicket;
    mode: "revision" | "edit";
  } | null>(null);

  // Scoping data berdasarkan role
  const isGISStaff = currentRole === "superadmin" || currentRole === "admin_gis";
  const isEstateScoped = currentRole === "user_estate";
  const isRegionScoped = currentRole === "admin_kebun" || currentRole === "regional_ho";
  const isReadOnly = currentRole === "user_global";

  // Simulasi scope aktif untuk User Estate (BUM 1) dan Admin Kebun (Region 1)
  const userEstateScope = "BUM 1";
  const userRegionScope = "REGION 1";

  // Filter Tiket berdasarkan hak akses & pencarian
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // 1. Scope filter berdasarkan RBAC
      if (isEstateScoped && ticket.estate !== userEstateScope) {
        return false;
      }
      if (isRegionScoped && ticket.region !== userRegionScope) {
        return false;
      }

      // 2. Filter Status
      const matchStatus = statusFilter === "all" || ticket.status === statusFilter;
      if (!matchStatus) return false;

      // 3. Filter Admin GIS
      if (adminFilter !== "all" && ticket.order_name !== adminFilter) {
        return false;
      }

      // 4. Pencarian teks
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = ticket.title.toLowerCase().includes(q);
      const matchNumber =
        ticket.ticket_number.toLowerCase().includes(q) ||
        ticket.map_number?.toLowerCase().includes(q);
      const matchOrder = ticket.order_name.toLowerCase().includes(q);
      const matchRequester = ticket.requester_name.toLowerCase().includes(q);
      const matchDesc = ticket.description.toLowerCase().includes(q);
      const matchBlock = ticket.block_number.toLowerCase().includes(q);

      return (
        matchTitle ||
        matchNumber ||
        matchOrder ||
        matchRequester ||
        matchDesc ||
        matchBlock
      );
    });
  }, [tickets, isEstateScoped, isRegionScoped, statusFilter, adminFilter, searchQuery]);

  // Handler Buat Tiket
  const handleCreateTicket = (newTicket: MapTicket) => {
    setTickets((prev) => [newTicket, ...prev]);
    setShowCreateForm(false);
    setNotice(`Permohonan ${newTicket.ticket_number} berhasil diajukan.`);
    setTimeout(() => setNotice(""), 3500);
  };

  // Handler Simpan Progres (Admin GIS / Superadmin)
  const handleSaveProgress = useCallback(
    (
      ticketId: string,
      newStatus: MapTicket["status"],
      progressDescription: string,
      resultPdfName?: string
    ) => {
      setTickets((prev) =>
        prev.map((t) => {
          if (t.ticket_id === ticketId) {
            return {
              ...t,
              status: newStatus,
              progress_description: progressDescription,
              result_pdf_name: resultPdfName || t.result_pdf_name,
              updated_at: "24 Feb 2026",
            };
          }
          return t;
        })
      );
      setNotice("Progres permohonan berhasil diperbarui.");
      setTimeout(() => setNotice(""), 3500);
    },
    []
  );

  // Handler Revisi / Edit (User)
  const handleRevisionOrEdit = useCallback(
    (ticketId: string, mode: "revision" | "edit", notes: string, fileName?: string) => {
      setTickets((prev) =>
        prev.map((t) => {
          if (t.ticket_id === ticketId) {
            if (mode === "revision") {
              return {
                ...t,
                status: "revision_requested",
                progress_description: `Revisi: ${notes}`,
                attachment_name: fileName || t.attachment_name,
                updated_at: "24 Feb 2026",
              };
            }
            return {
              ...t,
              description: notes,
              attachment_name: fileName || t.attachment_name,
              updated_at: "24 Feb 2026",
            };
          }
          return t;
        })
      );
      setNotice(
        mode === "revision" ? "Pengajuan revisi terkirim." : "Perubahan berhasil disimpan."
      );
      setTimeout(() => setNotice(""), 3500);
    },
    []
  );

  // Unduh Simulasi PDF
  const handleDownloadPdf = (ticket: MapTicket, kind: "attachment" | "result") => {
    const filename = kind === "attachment" ? ticket.attachment_name : ticket.result_pdf_name;
    const blob = new Blob([`File Dokumen GIS: ${filename}`], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename || "dokumen.pdf";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-4">
      <PageMeta
        title="Request Update Peta - Departemen GIS"
        description="Layanan permohonan dan antrean pembaruan peta blok kebun"
      />

      {/* Header & Breadcrumb */}
      <PageBreadcrumb pageTitle="Request Update Peta" />

      <header className="flex flex-col gap-3 border-b border-gray-200 pb-3.5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between -mt-3">
        <div>
          <h1 className="text-base font-bold text-gray-800 dark:text-white">
            Request Update Peta Blok Kebun
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isGISStaff
              ? "Daftar antrean dan progres pembaruan peta blok kebun."
              : isEstateScoped
                ? `Pengajuan update peta khusus unit ${userEstateScope}.`
                : isRegionScoped
                  ? `Monitoring update peta unit wilayah ${userRegionScope}.`
                  : "Monitoring antrean update peta kebun."}
          </p>
        </div>

        {/* Action Controls & Role Simulator */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* RBAC Role Selector Simulator */}
          <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              Role:
            </span>
            <select
              value={currentRole}
              onChange={(e) => {
                setCurrentRole(e.target.value as RoleMode);
                setShowCreateForm(false);
              }}
              className="text-xs font-semibold text-gray-800 dark:text-gray-200 bg-transparent outline-none cursor-pointer"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value} className="bg-white text-gray-800 dark:bg-gray-900 dark:text-white">
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tombol Buat Permohonan */}
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-theme-xs hover:bg-brand-600 cursor-pointer transition-colors"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Buat Permohonan</span>
            </button>
          )}
        </div>
      </header>

      {/* Notifikasi Banner */}
      {notice && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} className="cursor-pointer text-emerald-600 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* 1. Bar Status KPI */}
      <section aria-label="Statistik Tiket">
        <TicketStatsBar
          tickets={filteredTickets}
          activeFilter={statusFilter}
          onSelectFilter={setStatusFilter}
        />
      </section>

      {/* 2. Modal Formulir Buat Tiket */}
      <TicketCreateForm
        isOpen={showCreateForm}
        onSubmit={handleCreateTicket}
        onClose={() => setShowCreateForm(false)}
        lockedEstate={isEstateScoped ? userEstateScope : undefined}
        lockedRegion={isRegionScoped ? (userRegionScope as any) : undefined}
        defaultRequesterName={
          isEstateScoped ? `Asisten ${userEstateScope}` : isRegionScoped ? `Koordinator ${userRegionScope}` : ""
        }
      />

      {/* 3. Toolbar Pencarian & Filter */}
      <section className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor tiket, lokasi, pemohon..."
            className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-8.5 pr-3 text-xs text-gray-800 placeholder-gray-400 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filter PIC Admin GIS */}
          {isGISStaff && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-500 dark:text-gray-400">Filter Admin:</span>
              <select
                value={adminFilter}
                onChange={(e) => setAdminFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-800 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 cursor-pointer"
              >
                <option value="all">Semua Admin GIS</option>
                {DEFAULT_ADMINS.map((adm) => (
                  <option key={adm.value_code} value={adm.label}>
                    {adm.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Total Counter Badge */}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Total: <strong className="font-semibold text-gray-900 dark:text-white">{filteredTickets.length}</strong> tiket
          </span>
        </div>
      </section>

      {/* 4. Tabel Antrean / Daftar Tiket */}
      <section aria-label="Daftar Permohonan">
        {filteredTickets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center dark:border-gray-800 dark:bg-gray-900/30">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Tidak ada permohonan yang ditemukan
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              {searchQuery || statusFilter !== "all"
                ? "Tidak ada data yang sesuai dengan kriteria pencarian dan filter."
                : "Belum ada tiket permohonan yang terdaftar."}
            </p>
          </div>
        ) : isGISStaff ? (
          <TicketAdminTable
            tickets={filteredTickets}
            onOpenProgressModal={(ticket) => setProgressModalTicket(ticket)}
            onDownload={handleDownloadPdf}
          />
        ) : (
          <TicketUserTable
            tickets={filteredTickets}
            onDownload={handleDownloadPdf}
            onOpenRevisionDrawer={(ticket) => setRevisionModalConfig({ ticket, mode: "revision" })}
            onOpenEditDrawer={(ticket) => setRevisionModalConfig({ ticket, mode: "edit" })}
            canEdit={!isReadOnly}
          />
        )}
      </section>

      {/* 5. Modal Progres (Admin GIS / Superadmin) */}
      <TicketProgressModal
        ticket={progressModalTicket}
        isOpen={Boolean(progressModalTicket)}
        onClose={() => setProgressModalTicket(null)}
        onSaveProgress={handleSaveProgress}
      />

      {/* 6. Modal Revisi / Edit (Pemohon) */}
      <TicketRevisionModal
        config={revisionModalConfig}
        isOpen={Boolean(revisionModalConfig)}
        onClose={() => setRevisionModalConfig(null)}
        onSubmit={handleRevisionOrEdit}
      />
    </div>
  );
}
