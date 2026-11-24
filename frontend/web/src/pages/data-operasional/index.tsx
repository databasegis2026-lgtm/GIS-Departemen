import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import type {
  ActionLogItem,
  AktivitasType,
  BackupItem,
  OperasionalRecord,
  OperasionalStats,
} from "./types";
import {
  INITIAL_ACTION_LOGS,
  INITIAL_BACKUPS,
  INITIAL_OPERASIONAL_RECORDS,
} from "./mock-operasional";

// Subkomponen
import OperasionalStatsCards from "./components/operasional-stats";
import OperasionalTabs from "./components/operasional-tabs";
import OperasionalToolbar from "./components/operasional-toolbar";
import OperasionalTable from "./components/operasional-table";
import OperasionalFormModal from "./components/operasional-form-modal";
import OperasionalDetailModal from "./components/operasional-detail-modal";
import OperasionalDeleteModal from "./components/operasional-delete-modal";
import SpatialUploadModal from "./components/spatial-upload-modal";
import RiwayatAksiModal from "./components/riwayat-aksi-modal";
import BackupDataModal from "./components/backup-data-modal";
import AfdelingBlockMapModal from "./components/afdeling-block-map-modal";
import { printLaporanOperasional, printPetaKartografi } from "./print-operasional";

export default function DataOperasionalPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [records, setRecords] = useState<OperasionalRecord[]>(INITIAL_OPERASIONAL_RECORDS);
  const [actionLogs, setActionLogs] = useState<ActionLogItem[]>(INITIAL_ACTION_LOGS);
  const [backups, setBackups] = useState<BackupItem[]>(INITIAL_BACKUPS);

  const [activeTab, setActiveTab] = useState<AktivitasType>("pruning");

  // State Filter Lengkap (Sesuai Gambar 2)
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedEstate, setSelectedEstate] = useState("all");
  const [selectedAfdeling, setSelectedAfdeling] = useState("all");
  const [selectedBlock, setSelectedBlock] = useState("all");
  const [selectedType, setSelectedType] = useState("pruning");
  const [selectedCondition, setSelectedCondition] = useState("all");

  // Search & Pagination Limit
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [notice, setNotice] = useState("");

  // Modal State
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<OperasionalRecord | null>(null);
  const [detailRecord, setDetailRecord] = useState<OperasionalRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<OperasionalRecord | null>(null);

  // Modal Peta Polygon Blok per Afdeling
  const [mapModalRecord, setMapModalRecord] = useState<OperasionalRecord | null>(null);

  // Modal Khusus Operasional
  const [spatialUploadOpen, setSpatialUploadOpen] = useState(false);
  const [actionLogsOpen, setActionLogsOpen] = useState(false);
  const [backupModalOpen, setBackupModalOpen] = useState(false);

  // Sync tab dari URL rute
  useEffect(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes("/produksi")) {
      setActiveTab("produksi");
      setSelectedType("produksi");
    } else if (path.includes("/pruning")) {
      setActiveTab("pruning");
      setSelectedType("pruning");
    } else if (path.includes("/pasar-pikul")) {
      setActiveTab("pasar_pikul");
      setSelectedType("pasar_pikul");
    } else if (path.includes("/pemupukan")) {
      setActiveTab("pemupukan");
      setSelectedType("pemupukan");
    } else if (path.includes("/semprot")) {
      setActiveTab("semprot");
      setSelectedType("semprot");
    } else if (path.includes("/jangkos")) {
      setActiveTab("jangkos");
      setSelectedType("jangkos");
    } else if (path === "/data-operasional" || path === "/data-operasional/perawatan") {
      setActiveTab("pruning");
      setSelectedType("pruning");
    }
  }, [location.pathname]);

  // Handle pergantian tab & navigasi URL
  const handleTabChange = (tab: AktivitasType) => {
    setActiveTab(tab);
    setSelectedType(tab);
    setCurrentPage(1);
    if (tab === "produksi") {
      navigate("/data-operasional/produksi");
    } else if (tab === "pasar_pikul") {
      navigate("/data-operasional/perawatan/pasar-pikul");
    } else {
      navigate(`/data-operasional/perawatan/${tab}`);
    }
  };

  // Terapkan Filter Pencarian
  const handleApplyFilter = () => {
    setAppliedSearchQuery(searchQuery.trim());
    setCurrentPage(1);
  };

  // Reset Filter Lengkap
  const handleResetFilter = () => {
    setSelectedYear("all");
    setSelectedRegion("all");
    setSelectedEstate("all");
    setSelectedAfdeling("all");
    setSelectedBlock("all");
    setSelectedType(activeTab);
    setSelectedCondition("all");
    setSearchQuery("");
    setAppliedSearchQuery("");
    setCurrentPage(1);
  };

  // Filter Data Komprehensif (Region, Estate, Afdeling, Blok, Tahun, Tipe, Kondisi, Query)
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Filter tab / tipe
      const effectiveType = selectedType !== "all" ? selectedType : activeTab;
      if (effectiveType !== "all" && r.aktivitas !== effectiveType) {
        return false;
      }
      // Filter tahun
      if (selectedYear !== "all" && !r.tanggal.startsWith(selectedYear)) {
        return false;
      }
      // Filter region
      if (selectedRegion !== "all" && r.region !== selectedRegion) {
        return false;
      }
      // Filter estate
      if (selectedEstate !== "all" && r.estate !== selectedEstate) {
        return false;
      }
      // Filter afdeling
      if (selectedAfdeling !== "all" && r.afdeling !== selectedAfdeling) {
        return false;
      }
      // Filter blok
      if (selectedBlock !== "all" && r.blok !== selectedBlock) {
        return false;
      }
      // Filter kondisi
      if (selectedCondition !== "all" && r.kondisi.toLowerCase() !== selectedCondition.toLowerCase()) {
        return false;
      }
      // Filter pencarian
      if (!appliedSearchQuery) return true;
      const q = appliedSearchQuery.toLowerCase();
      return (
        r.blok.toLowerCase().includes(q) ||
        r.warung.toLowerCase().includes(q) ||
        r.kontraktor.toLowerCase().includes(q) ||
        r.kondisi.toLowerCase().includes(q) ||
        r.keterangan.toLowerCase().includes(q)
      );
    });
  }, [
    records,
    activeTab,
    selectedType,
    selectedCondition,
    selectedYear,
    selectedRegion,
    selectedEstate,
    selectedAfdeling,
    selectedBlock,
    appliedSearchQuery,
  ]);

  // Pagination Data
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredRecords.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredRecords, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage) || 1;

  // Hitung Statistik KPI
  const stats: OperasionalStats = useMemo(() => {
    let targetSum = 0;
    let realisasiSum = 0;
    let selesaiCount = 0;

    for (const r of filteredRecords) {
      targetSum += r.luas_ha;
      realisasiSum += r.realisasi_luas_ha;
      if (r.capaian_persen >= 100 || r.kondisi.toLowerCase().includes("bapp")) {
        selesaiCount++;
      }
    }

    const rataCapaian = targetSum > 0 ? (realisasiSum / targetSum) * 100 : 0;

    return {
      totalTargetHa: targetSum,
      totalRealisasiHa: realisasiSum,
      rataCapaianPersen: rataCapaian,
      blokSelesaiCount: selesaiCount,
      totalBlok: filteredRecords.length,
    };
  }, [filteredRecords]);

  // Tambah / Update Record
  const handleSaveRecord = (savedRecord: OperasionalRecord) => {
    const isEdit = records.some((r) => r.id === savedRecord.id);
    setRecords((prev) => {
      const idx = prev.findIndex((r) => r.id === savedRecord.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedRecord;
        return next;
      }
      return [savedRecord, ...prev];
    });

    // Catat ke log aksi
    const newLog: ActionLogItem = {
      id: `log-${Date.now()}`,
      waktu: new Date().toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      pengguna: "User Lapangan",
      aksi: isEdit ? "UBAH" : "TAMBAH",
      blok: `Blok ${savedRecord.blok}`,
      status: "Sukses",
      catatan: `${isEdit ? "Perbarui" : "Tambah"} record ${savedRecord.aktivitas} (${savedRecord.realisasi_luas_ha} Ha).`,
    };
    setActionLogs((prev) => [newLog, ...prev]);

    setNotice(`Data operasional Blok ${savedRecord.blok} berhasil disimpan.`);
    setTimeout(() => setNotice(""), 3500);
  };

  // Hapus Record
  const handleDeleteRecord = (id: string) => {
    const target = records.find((r) => r.id === id);
    setRecords((prev) => prev.filter((r) => r.id !== id));

    if (target) {
      const newLog: ActionLogItem = {
        id: `log-${Date.now()}`,
        waktu: new Date().toLocaleString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        pengguna: "User Lapangan",
        aksi: "HAPUS",
        blok: `Blok ${target.blok}`,
        status: "Sukses",
        catatan: `Hapus record transaksi operasional ${target.aktivitas}.`,
      };
      setActionLogs((prev) => [newLog, ...prev]);
    }

    setNotice("Data operasional berhasil dihapus.");
    setTimeout(() => setNotice(""), 3500);
  };

  // Handler Sukses Unggah Spasial
  const handleSpatialUploadSuccess = (fileName: string, targetAktivitas: string, estate: string) => {
    const newLog: ActionLogItem = {
      id: `log-${Date.now()}`,
      waktu: new Date().toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      pengguna: "Surveyor GIS",
      aksi: "UNGGAH_SPASIAL",
      blok: `${estate} - Poligon Baru`,
      status: "Sukses",
      catatan: `Unggah berkas spasial ${fileName} untuk layer ${targetAktivitas}.`,
    };
    setActionLogs((prev) => [newLog, ...prev]);
    setNotice(`Berkas spasial ${fileName} berhasil diunggah dan disinkronkan ke layer.`);
    setTimeout(() => setNotice(""), 4000);
  };

  // Handler Buat Snapshot Backup
  const handleCreateBackup = (note: string) => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newBackup: BackupItem = {
      id: `bak-${Date.now()}`,
      kode: `BACKUP-OPS-${dateStr}-${randomSuffix}`,
      waktu: new Date().toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      totalRecord: records.length,
      ukuran: `${(records.length * 4.8).toFixed(1)} KB`,
      oleh: "User Aktif",
      catatan: note,
    };
    setBackups((prev) => [newBackup, ...prev]);

    const newLog: ActionLogItem = {
      id: `log-${Date.now()}`,
      waktu: newBackup.waktu,
      pengguna: "User Aktif",
      aksi: "BACKUP",
      blok: "Semua Record",
      status: "Sukses",
      catatan: `Snapshot cadangan ${newBackup.kode} berhasil dibuat.`,
    };
    setActionLogs((prev) => [newLog, ...prev]);
    setNotice(`Snapshot backup ${newBackup.kode} berhasil disimpan.`);
    setTimeout(() => setNotice(""), 3500);
  };

  // Ekspor CSV (15 Kolom Standar)
  const handleExportCsv = () => {
    const headers = [
      "Region",
      "Estate",
      "Afdeling",
      "Blok",
      "Warung",
      "Luas (Ha)",
      "Realisasi Luas (Ha)",
      "Capaian (%)",
      "SPH",
      "Kondisi",
      "Kontraktor",
      "Update Peta",
      "Periode",
      "Tanggal",
      "Keterangan",
    ];
    const rows = filteredRecords.map((r) => [
      `"${r.region}"`,
      `"${r.estate}"`,
      `"${r.afdeling}"`,
      `"${r.blok}"`,
      `"${r.warung}"`,
      r.luas_ha,
      r.realisasi_luas_ha,
      r.capaian_persen,
      r.sph,
      `"${r.kondisi}"`,
      `"${r.kontraktor}"`,
      `"${r.update_peta}"`,
      `"${r.periode}"`,
      r.tanggal,
      `"${r.keterangan.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `data_operasional_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Handler Cetak Laporan Operasional A4 Resmi
  const handlePrintLaporan = () => {
    printLaporanOperasional(filteredRecords, stats, {
      estate: selectedEstate,
      afdeling: selectedAfdeling,
      kondisi: selectedCondition,
      aktivitas: activeTab,
    });
  };

  // Handler Cetak Peta Kartografi A4 Landscape (Format RustGIS)
  const handlePrintPeta = () => {
    const blocksForMap = filteredRecords.map((r) => {
      const k = r.kondisi.toLowerCase();
      let color = "#0ea5e9";
      if (k.includes("bapp") || k.includes("selesai")) color = "#15803d";
      else if (k.includes("rotasi 2") || k.includes("baik")) color = "#22c55e";
      else if (k.includes("rotasi 1") || k.includes("sedang")) color = "#eab308";
      else if (k.includes("berat") || k.includes("belum")) color = "#ef4444";

      return {
        blok: r.blok,
        luas_ha: r.luas_ha,
        kondisi: r.kondisi,
        statusColor: color,
      };
    });

    printPetaKartografi({
      estate: selectedEstate === "all" ? "BUM 1" : selectedEstate,
      afdeling: selectedAfdeling === "all" ? "AFD 4" : selectedAfdeling,
      blocks: blocksForMap,
      totalHa: stats.totalTargetHa,
    });
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <PageMeta
        title="Data Operasional"
        description="Data operasional perawatan dan produksi kebun"
      />

      {/* Header Halaman & Breadcrumb */}
      <PageBreadcrumb pageTitle="Data Operasional" />

      <header className="flex flex-col gap-2.5 border-b border-slate-200 pb-3.5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between min-w-0 -mt-3">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Aktivitas perawatan dan produksi dengan 15 standar kolom operasional kebun.
          </p>
        </div>

        {/* Counter Ringkas */}
        <div className="text-xs text-slate-500">
          Menampilkan <strong className="text-slate-800 dark:text-slate-200">{paginatedRecords.length}</strong> dari {filteredRecords.length} record blok
        </div>
      </header>

      {/* Notifikasi Toast */}
      {notice && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 animate-fadeIn flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} className="cursor-pointer text-emerald-600">
            ✕
          </button>
        </div>
      )}

      {/* 1. Kuartet Metrik KPI */}
      <section aria-label="Statistik Operasional" className="w-full min-w-0">
        <OperasionalStatsCards stats={stats} />
      </section>

      {/* 2. Tab Kategori Aktivitas */}
      <section aria-label="Tab Aktivitas" className="w-full min-w-0">
        <OperasionalTabs
          activeTab={activeTab}
          onChangeTab={handleTabChange}
          records={records}
        />
      </section>

      {/* 3. Toolbar & Filter Lengkap Bertingkat (Sesuai Gambar 2) */}
      <section aria-label="Toolbar Filter" className="w-full min-w-0">
        <OperasionalToolbar
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedRegion={selectedRegion}
          setSelectedRegion={setSelectedRegion}
          selectedEstate={selectedEstate}
          setSelectedEstate={setSelectedEstate}
          selectedAfdeling={selectedAfdeling}
          setSelectedAfdeling={setSelectedAfdeling}
          selectedBlock={selectedBlock}
          setSelectedBlock={setSelectedBlock}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          selectedCondition={selectedCondition}
          setSelectedCondition={setSelectedCondition}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          onApplyFilter={handleApplyFilter}
          onResetFilter={handleResetFilter}
          onOpenCreate={() => {
            setEditingRecord(null);
            setFormModalOpen(true);
          }}
          onOpenSpatialUpload={() => setSpatialUploadOpen(true)}
          onOpenActionLogs={() => setActionLogsOpen(true)}
          onOpenBackup={() => setBackupModalOpen(true)}
          onExport={handleExportCsv}
          onPrintLaporan={handlePrintLaporan}
          onPrintPeta={handlePrintPeta}
          onRefresh={() => {
            setRecords([...INITIAL_OPERASIONAL_RECORDS]);
            handleResetFilter();
            setNotice("Data operasional berhasil disegarkan.");
            setTimeout(() => setNotice(""), 3000);
          }}
        />
      </section>

      {/* 4. Tabel Transaksi Lapangan (15 Standar Kolom + Kolom Aksi Sticky) */}
      <section aria-label="Tabel Operasional" className="w-full min-w-0">
        <OperasionalTable
          records={paginatedRecords}
          onOpenDetail={(record) => setDetailRecord(record)}
          onOpenEdit={(record) => {
            setEditingRecord(record);
            setFormModalOpen(true);
          }}
          onOpenDelete={(record) => setDeletingRecord(record)}
          onOpenAfdelingMap={(record) => setMapModalRecord(record)}
        />

        {/* Paginasi Sederhana */}
        {filteredRecords.length > rowsPerPage && (
          <div className="flex items-center justify-between pt-3 text-xs text-slate-500">
            <span>
              Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Modal Form Tambah / Edit */}
      <OperasionalFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSaveRecord}
        initialData={editingRecord}
      />

      {/* Modal Detail Record */}
      <OperasionalDetailModal
        record={detailRecord}
        isOpen={Boolean(detailRecord)}
        onClose={() => setDetailRecord(null)}
        onEdit={(rec) => {
          setEditingRecord(rec);
          setFormModalOpen(true);
        }}
      />

      {/* Modal Konfirmasi Hapus */}
      <OperasionalDeleteModal
        record={deletingRecord}
        isOpen={Boolean(deletingRecord)}
        onClose={() => setDeletingRecord(null)}
        onConfirm={handleDeleteRecord}
      />

      {/* Modal Unggah Data Spasial */}
      <SpatialUploadModal
        isOpen={spatialUploadOpen}
        onClose={() => setSpatialUploadOpen(false)}
        onSuccess={handleSpatialUploadSuccess}
        currentAktivitas={activeTab}
      />

      {/* Modal Riwayat Aksi & Unggahan */}
      <RiwayatAksiModal
        isOpen={actionLogsOpen}
        onClose={() => setActionLogsOpen(false)}
        logs={actionLogs}
      />

      {/* Modal Backup Data */}
      <BackupDataModal
        isOpen={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
        backups={backups}
        records={records}
        onCreateBackup={handleCreateBackup}
      />

      {/* Modal Peta Polygon Blok per Afdeling (Aksi Baru) */}
      {Boolean(mapModalRecord) && (
        <AfdelingBlockMapModal
          record={mapModalRecord}
          allRecords={records}
          isOpen={Boolean(mapModalRecord)}
          onClose={() => setMapModalRecord(null)}
        />
      )}
    </div>
  );
}
