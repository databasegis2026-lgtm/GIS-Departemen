import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import type { AktivitasRutinType, RekapPekerjaanRecord, StatusVerifikasiGIS } from "./types";
import {
  INITIAL_REKAP_RECORDS,
  DEFAULT_REGIONS,
  DEFAULT_ESTATES_BY_REGION,
  DEFAULT_ESTATES,
} from "./mock-rekap-operasional";

import RekapStats from "./components/rekap-stats";
import RekapTable from "./components/rekap-table";
import RekapFullscreenMapModal from "./components/rekap-fullscreen-map-modal";
import ShpUploadModal from "./components/shp-upload-modal";
import RekapVerifyModal from "./components/rekap-verify-modal";
import { printRekapPekerjaanPdf } from "./print-rekap-pdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Simulasi Role Pengguna (Sesuai ERD & Pembagian Hak Akses)
interface SimulationRole {
  id: string;
  label: string;
  roleType: "superadmin" | "admin_gis" | "admin_kebun" | "user_estate";
  estateScope?: string;
  regionScope?: string;
  code?: string;
}

const ROLES_LIST: SimulationRole[] = [
  { id: "superadmin", label: "Superadmin (Manager GIS - Ari Setyo Wibowo)", roleType: "superadmin", code: "Kode A" },
  { id: "gis_g", label: "Admin GIS (Agus Adi Permana - Kode G)", roleType: "admin_gis", code: "Kode G" },
  { id: "gis_e", label: "Admin GIS (Bagja Arya Wiguna - Kode E)", roleType: "admin_gis", code: "Kode E" },
  { id: "gis_b", label: "Admin GIS (Iqbal Tri Junaidy - Kode B)", roleType: "admin_gis", code: "Kode B" },
  { id: "kebun_r1", label: "Admin Kebun (Region 1)", roleType: "admin_kebun", regionScope: "REGION 1" },
  { id: "kebun_r2", label: "Admin Kebun (Region 2)", roleType: "admin_kebun", regionScope: "REGION 2" },
  { id: "kebun_r3", label: "Admin Kebun (Region 3 + BSL)", roleType: "admin_kebun", regionScope: "REGION 3" },
  { id: "estate_bum1", label: "User Estate (BUM 1)", roleType: "user_estate", estateScope: "BUM 1", regionScope: "REGION 1" },
  { id: "estate_bum2", label: "User Estate (BUM 2)", roleType: "user_estate", estateScope: "BUM 2", regionScope: "REGION 1" },
  { id: "estate_bum5", label: "User Estate (BUM 5)", roleType: "user_estate", estateScope: "BUM 5", regionScope: "REGION 2" },
  { id: "estate_bsl", label: "User Estate (BSL)", roleType: "user_estate", estateScope: "BSL", regionScope: "REGION 3" },
];

export default function RekapPekerjaanRutinPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [records, setRecords] = useState<RekapPekerjaanRecord[]>(INITIAL_REKAP_RECORDS);
  const [activeTab, setActiveTab] = useState<AktivitasRutinType>("all");

  // State Fullscreen Map Canvas Modal (Muncul saat tombol Draf Peta diklik)
  const [mapModalRecord, setMapModalRecord] = useState<RekapPekerjaanRecord | null>(null);

  // Role Simulator
  const [selectedRoleId, setSelectedRoleId] = useState<string>("superadmin");
  const currentRole = useMemo(
    () => ROLES_LIST.find((r) => r.id === selectedRoleId) || ROLES_LIST[0],
    [selectedRoleId]
  );

  // Filters
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedEstate, setSelectedEstate] = useState<string>("all");
  const [selectedStatusVerifikasi, setSelectedStatusVerifikasi] = useState<StatusVerifikasiGIS>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals state
  const [isShpUploadOpen, setIsShpUploadOpen] = useState(false);
  const [uploadTargetRecord, setUploadTargetRecord] = useState<RekapPekerjaanRecord | null>(null);

  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [verifyingRecord, setVerifyingRecord] = useState<RekapPekerjaanRecord | null>(null);

  const [deletingRecord, setDeletingRecord] = useState<RekapPekerjaanRecord | null>(null);

  // Notification Toast Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Sync tab dari rute URL
  useEffect(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes("/pruning")) {
      setActiveTab("pruning");
    } else if (path.includes("/pemupukan")) {
      setActiveTab("pemupukan");
    } else if (path.includes("/pasar-pikul") || path.includes("/pasar_pikul")) {
      setActiveTab("pasar_pikul");
    } else if (path.includes("/jangkos")) {
      setActiveTab("jangkos");
    } else if (path.includes("/semprot")) {
      setActiveTab("semprot");
    } else {
      setActiveTab("all");
    }
  }, [location.pathname]);

  const handleTabChange = (tab: AktivitasRutinType) => {
    setActiveTab(tab);
    if (tab === "all") {
      navigate("/rekap-pekerjaan/pekerjaan-rutin");
    } else {
      const slug = tab.replace("_", "-");
      navigate(`/rekap-pekerjaan/pekerjaan-rutin/${slug}`);
    }
  };

  const handleRegionChange = (reg: string) => {
    setSelectedRegion(reg);
    setSelectedEstate("all");
  };

  const availableEstates = useMemo(() => {
    if (selectedRegion === "all") {
      return DEFAULT_ESTATES;
    }
    return DEFAULT_ESTATES_BY_REGION[selectedRegion] || DEFAULT_ESTATES;
  }, [selectedRegion]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (currentRole.roleType === "user_estate" && currentRole.estateScope) {
        if (r.estate !== currentRole.estateScope) return false;
      }
      if (currentRole.roleType === "admin_kebun" && currentRole.regionScope) {
        if (r.region !== currentRole.regionScope) return false;
      }
      if (activeTab !== "all" && r.aktivitas !== activeTab) {
        return false;
      }
      if (selectedRegion !== "all" && r.region !== selectedRegion) {
        return false;
      }
      if (selectedEstate !== "all" && r.estate !== selectedEstate) {
        return false;
      }
      if (selectedStatusVerifikasi !== "all" && r.status_verifikasi !== selectedStatusVerifikasi) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          r.blok.toLowerCase().includes(q) ||
          r.kode_rekap.toLowerCase().includes(q) ||
          r.estate.toLowerCase().includes(q) ||
          r.afdeling.toLowerCase().includes(q) ||
          r.kontraktor.toLowerCase().includes(q) ||
          (r.shp_file_name && r.shp_file_name.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [
    records,
    currentRole,
    activeTab,
    selectedRegion,
    selectedEstate,
    selectedStatusVerifikasi,
    searchQuery,
  ]);

  // Handler Sukses Unggah File SHP Saja (Tanpa Input Lain)
  const handleUploadFileOnly = (file: File) => {
    if (uploadTargetRecord) {
      // Update berkas SHP untuk blok terpilih
      setRecords((prev) =>
        prev.map((r) =>
          r.id === uploadTargetRecord.id
            ? {
              ...r,
              shp_file_name: file.name,
              shp_upload_date: new Date().toLocaleString("id-ID"),
              status_verifikasi: "submitted",
              database_committed: false,
              update_peta: "Draf SHP Diperbarui",
            }
            : r
        )
      );
      showToast(`Berkas SHP ${file.name} berhasil diunggah untuk Blok ${uploadTargetRecord.blok}.`);
      setUploadTargetRecord(null);
    } else {
      // Unggah SHP umum baru
      const target = filteredRecords[0] || records[0];
      if (target) {
        setRecords((prev) =>
          prev.map((r) =>
            r.id === target.id
              ? {
                ...r,
                shp_file_name: file.name,
                shp_upload_date: new Date().toLocaleString("id-ID"),
                status_verifikasi: "submitted",
                database_committed: false,
                update_peta: "Draf SHP Baru",
              }
              : r
          )
        );
        showToast(`Berkas SHP ${file.name} berhasil dimuat untuk Blok ${target.blok}.`);
      }
    }
  };

  // Validasi & Commit Draf ke Database Master HO
  const handleCommitToDatabase = (recordId: string) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== recordId) return r;
        return {
          ...r,
          status_verifikasi: "verified",
          database_committed: true,
          luas_verifikasi_gis: r.realisasi_luas_ha,
          update_peta: "Tersinkron (Valid)",
          verified_by_code: currentRole.code || "Kode G",
          verified_by_name: currentRole.label.split("(")[1]?.replace(")", "") || "Agus Adi Permana",
          tanggal_verifikasi: new Date().toISOString().slice(0, 10),
          catatan_gis: "Draf poligon divalidasi dan di-commit ke Database Spasial Master.",
        };
      })
    );
    const target = records.find((r) => r.id === recordId);
    showToast(`Draf spasial Blok ${target?.blok || ""} berhasil divalidasi & disimpan ke Database Spasial Master!`);
  };

  // Save GIS Verification Modal
  const handleSaveVerification = (
    recordId: string,
    vData: {
      status_verifikasi: "submitted" | "in_review" | "verified" | "revision_requested" | "rejected";
      luas_verifikasi_gis: number;
      catatan_gis: string;
      peta_verifikasi_pdf?: string;
      verified_by_code: string;
      verified_by_name: string;
      tanggal_verifikasi: string;
    }
  ) => {
    const isCommitting = vData.status_verifikasi === "verified";
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== recordId) return r;
        const updatePetaText = isCommitting
          ? "Tersinkron (Valid)"
          : vData.status_verifikasi === "revision_requested"
            ? "Perlu Revisi Lapangan"
            : vData.status_verifikasi === "rejected"
              ? "Ditolak Spasial"
              : "Review GIS";

        return {
          ...r,
          ...vData,
          database_committed: isCommitting,
          update_peta: updatePetaText,
        };
      })
    );
    showToast(`Hasil verifikasi spasial berhasil disimpan (${vData.status_verifikasi.toUpperCase()}).`);
  };

  // Delete Record
  const handleConfirmDelete = () => {
    if (deletingRecord) {
      setRecords((prev) => prev.filter((r) => r.id !== deletingRecord.id));
      showToast(`Rekap ${deletingRecord.kode_rekap} telah dihapus.`);
      if (mapModalRecord?.id === deletingRecord.id) {
        setMapModalRecord(null);
      }
      setDeletingRecord(null);
    }
  };

  const isGisRole = currentRole.roleType === "superadmin" || currentRole.roleType === "admin_gis";

  return (
    <div className="w-full min-w-0 max-w-full space-y-5 pb-8">
      <PageMeta
        title="Rekap Pekerjaan Kebun | Antigravity GIS"
        description="Rekapitulasi pekerjaan fisik kebun dan pengajuan verifikasi draf spasial sebelum masuk database."
      />

      <PageBreadcrumb pageTitle="Rekap Pekerjaan Kebun" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-600 text-white px-4 py-3 shadow-md text-xs font-semibold animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-white/80 hover:text-white cursor-pointer ml-3 text-sm"
          >
            &times;
          </button>
        </div>
      )}

      {/* ─── 1. HEADER SECTION & ROLE SELECTOR ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Rekap Pekerjaan Kebun (Pekerjaan Rutin)
          </h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Pencatatan realisasi fisik (Base on Pokok) &bull; Klik <strong>Draf Peta</strong> untuk melihat kanvas peta layar penuh &bull; Cetak Berita Acara PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Switch Role Simulator */}
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 px-2">
              Role:
            </span>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="rounded-lg border-0 bg-white dark:bg-gray-900 py-1.5 px-2.5 text-xs font-medium text-gray-800 dark:text-gray-200 shadow-2xs focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {ROLES_LIST.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tombol Unggah File SHP Saja (Tanpa Form Lain) */}
          <button
            type="button"
            onClick={() => {
              setUploadTargetRecord(null);
              setIsShpUploadOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>+ Unggah Berkas SHP</span>
          </button>
        </div>
      </div>

      {/* ─── 2. KARTU STATISTIK KPI (Sesuai Desain Asli Template TailAdmin) ─── */}
      <RekapStats records={filteredRecords} />

      {/* ─── 3. TAB NAVIGASI AKTIVITAS RUTIN ─── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-gray-200 dark:border-gray-800 text-xs font-medium custom-scrollbar">
        {[
          { key: "all", label: "Semua Aktivitas" },
          { key: "pruning", label: "Pruning" },
          { key: "pemupukan", label: "Pemupukan" },
          { key: "pasar_pikul", label: "Pasar Pikul" },
          { key: "jangkos", label: "Jangkos" },
          { key: "semprot", label: "Semprot" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabChange(tab.key as AktivitasRutinType)}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer ${activeTab === tab.key
              ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-2xs"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── 4. TOOLBAR FILTER TABEL (LIGHT & DARK MODE RAPI) ─── */}
      <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs dark:border-gray-800 dark:bg-gray-900/40">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {/* Pencarian */}
          <div className="relative lg:col-span-2">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor blok, estate, mandor, berkas SHP..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-1.5 pl-8 pr-3 text-xs text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Filter Region */}
          <div>
            <select
              value={selectedRegion}
              onChange={(e) => handleRegionChange(e.target.value)}
              disabled={currentRole.roleType === "admin_kebun" || currentRole.roleType === "user_estate"}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-1.5 px-2.5 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 cursor-pointer"
            >
              <option value="all">Semua Region</option>
              {DEFAULT_REGIONS.map((reg) => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>
          </div>

          {/* Filter Estate */}
          <div>
            <select
              value={selectedEstate}
              onChange={(e) => setSelectedEstate(e.target.value)}
              disabled={currentRole.roleType === "user_estate"}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-1.5 px-2.5 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 cursor-pointer"
            >
              <option value="all">Semua Estate</option>
              {availableEstates.map((est) => (
                <option key={est} value={est}>{est}</option>
              ))}
            </select>
          </div>

          {/* Filter Status Database */}
          <div>
            <select
              value={selectedStatusVerifikasi}
              onChange={(e) => setSelectedStatusVerifikasi(e.target.value as StatusVerifikasiGIS)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-1.5 px-2.5 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">Semua Status Database</option>
              <option value="submitted">Draf SHP (Belum Masuk DB)</option>
              <option value="in_review">Review GIS</option>
              <option value="verified">Valid (Di Database)</option>
              <option value="revision_requested">Revisi Lapangan</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── 5. TABEL UTAMA & TOMBOL AKSI (KLIK DRAF MUNCULKAN PETA LAYAR PENUH) ─── */}
      <RekapTable
        records={filteredRecords}
        onOpenDraftMap={(rec) => setMapModalRecord(rec)}
        onPrintPdf={(rec) => printRekapPekerjaanPdf(rec)}
        onOpenUploadShp={(rec) => {
          setUploadTargetRecord(rec);
          setIsShpUploadOpen(true);
        }}
        onOpenVerify={(rec) => {
          setVerifyingRecord(rec);
          setIsVerifyOpen(true);
        }}
        onOpenDelete={(rec) => setDeletingRecord(rec)}
        isGisRole={isGisRole}
      />

      {/* ─── 6. MAP CANVAS LAYAR PENUH (MODAL BESAR KETIKA KLIK "DRAF PETA") ─── */}
      <RekapFullscreenMapModal
        isOpen={Boolean(mapModalRecord)}
        onClose={() => setMapModalRecord(null)}
        record={mapModalRecord}
        onOpenUploadShp={() => {
          setUploadTargetRecord(mapModalRecord);
          setIsShpUploadOpen(true);
        }}
        onCommitToDatabase={handleCommitToDatabase}
        onRequestRevision={(rec) => {
          setVerifyingRecord(rec);
          setIsVerifyOpen(true);
        }}
        isGisRole={isGisRole}
      />

      {/* ─── 7. MODAL UNGGAH SHP SAJA (HANYA FILE UPLOAD TANPA FORM LAIN) ─── */}
      <ShpUploadModal
        isOpen={isShpUploadOpen}
        onClose={() => {
          setIsShpUploadOpen(false);
          setUploadTargetRecord(null);
        }}
        onUploadSuccess={handleUploadFileOnly}
        targetBlok={uploadTargetRecord?.blok || "A05"}
      />

      {/* ─── 8. MODAL VERIFIKASI GIS (KHUSUS TIM GIS / SUPERADMIN) ─── */}
      <RekapVerifyModal
        isOpen={isVerifyOpen}
        onClose={() => {
          setIsVerifyOpen(false);
          setVerifyingRecord(null);
        }}
        record={verifyingRecord}
        onSave={handleSaveVerification}
        currentUser={{
          name: currentRole.label.split("(")[1]?.replace(")", "") || "Agus Adi Permana",
          code: currentRole.code || "Kode G",
        }}
      />

      {/* ─── 9. MODAL KONFIRMASI HAPUS DATA ─── */}
      <Dialog open={!!deletingRecord} onOpenChange={() => setDeletingRecord(null)}>
        <DialogContent className="max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 shadow-xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
              Hapus Data Rekap Pekerjaan?
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Apakah Anda yakin ingin menghapus data rekap untuk{" "}
            <strong className="text-gray-800 dark:text-gray-200">Blok {deletingRecord?.blok}</strong> ({deletingRecord?.kode_rekap})? Data yang dihapus tidak dapat dipulihkan.
          </p>
          <DialogFooter className="gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setDeletingRecord(null)}
              className="px-3.5 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm cursor-pointer"
            >
              Hapus Data
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
