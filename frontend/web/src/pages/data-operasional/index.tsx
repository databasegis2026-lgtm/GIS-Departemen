import { useState, useMemo, useEffect, useCallback } from "react";
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
import { supabase } from "@/lib/supabase";
import * as turf from "@turf/turf";
import { useAuth } from "@/context/auth-context";
import {
  generateBlockCompositeKey,
  getCompanyForEstate,
  isTransactionCutoffLocked,
} from "./tata-kelola-operasional";

const OPERASIONAL_TABLE_MAP: Record<OperasionalRecord["aktivitas"], string> = {
  produksi: "produksi",
  pruning: "perawatan_pruning",
  semprot: "perawatan_semprot",
  pemupukan: "perawatan_pemupukan",
  pasar_pikul: "perawatan_pasar_pikul",
  jangkos: "perawatan_jangkos",
};

function getSupabaseTableByAktivitas(aktivitas: string): string {
  return (
    OPERASIONAL_TABLE_MAP[aktivitas as OperasionalRecord["aktivitas"]] ||
    "produksi"
  );
}

function getTabFromPath(pathname: string): AktivitasType {
  const p = pathname.toLowerCase();
  if (p.includes("/produksi")) return "produksi";
  if (p.includes("/pruning")) return "pruning";
  if (p.includes("/pasar-pikul")) return "pasar_pikul";
  if (p.includes("/pemupukan")) return "pemupukan";
  if (p.includes("/semprot")) return "semprot";
  if (p.includes("/jangkos")) return "jangkos";
  return "produksi";
}

function toDbPayload(r: OperasionalRecord) {
  return {
    id: r.id || `ops-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    region: r.region,
    estate: r.estate,
    afdeling: r.afdeling,
    blok: r.blok,
    warung: r.warung,
    luas_ha: r.luas_ha,
    realisasi_luas_ha: r.realisasi_luas_ha,
    capaian_persen: r.capaian_persen,
    sph: r.sph,
    kondisi: r.kondisi,
    kontraktor: r.kontraktor,
    update_peta: r.update_peta,
    periode: r.periode,
    tanggal: r.tanggal,
    keterangan: r.keterangan,
    coordinates: r.rawGeometry || (r.polygonCoords
      ? {
          type: "Polygon",
          coordinates: [r.polygonCoords.map(([lat, lng]) => [lng, lat])],
        }
      : null),
  };
}

export default function DataOperasionalPage({
  forcedAktivitas,
}: {
  forcedAktivitas?: AktivitasType;
} = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isAdminGis = currentUser?.roleKey === "admin_gis" || currentUser?.roleKey === "superadmin";

  // Filter Multi-Company (PT BUM vs PT BSL)
  const [selectedCompany, setSelectedCompany] = useState<string>("all");

  // Ambil tab aktif langsung dari URL atau prop forcedAktivitas secara sinkron
  const currentTabFromUrl = useMemo(
    () => forcedAktivitas || getTabFromPath(location.pathname),
    [forcedAktivitas, location.pathname]
  );
  const [activeTab, setActiveTab] = useState<AktivitasType>(
    () => forcedAktivitas || getTabFromPath(location.pathname)
  );

  const [records, setRecords] = useState<OperasionalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // State Filter Lengkap (Sesuai Gambar 2)
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedEstate, setSelectedEstate] = useState("all");
  const [selectedAfdeling, setSelectedAfdeling] = useState("all");
  const [selectedBlock, setSelectedBlock] = useState("all");
  const [selectedType, setSelectedType] = useState<string>(() => getTabFromPath(location.pathname));
  const [selectedCondition, setSelectedCondition] = useState("all");

  // Search & Pagination Limit
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [notice, setNotice] = useState("");

  const [actionLogs, setActionLogs] = useState<ActionLogItem[]>(INITIAL_ACTION_LOGS);
  const [backups, setBackups] = useState<BackupItem[]>(INITIAL_BACKUPS);

  // Selaraskan state aktif jika path URL berubah
  useEffect(() => {
    setActiveTab(currentTabFromUrl);
    setSelectedType(currentTabFromUrl);
    setCurrentPage(1);
  }, [currentTabFromUrl]);

  // Fungsi muat ulang data dari database Supabase untuk aktivitas spesifik
  const loadFromOperationalTables = useCallback(async (tabToLoad: AktivitasType) => {
    const act = tabToLoad === "all" ? "pruning" : (tabToLoad as OperasionalRecord["aktivitas"]);
    const targetTable = getSupabaseTableByAktivitas(act);
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from(targetTable)
        .select(
          "id,region,estate,afdeling,blok,warung,luas_ha,realisasi_luas_ha,capaian_persen,sph,kondisi,kontraktor,update_peta,periode,tanggal,keterangan,coordinates",
          {},
          { limit: 3000 }
        );

      if (!error && Array.isArray(data)) {
        const loaded: OperasionalRecord[] = data.map((row: any) => {
          let coords: [number, number][] | undefined = undefined;
          if (row.coordinates) {
            const geom = row.coordinates;
            let rawRing: [number, number][] | undefined = undefined;
            if (geom.type === "Polygon" && geom.coordinates?.[0]) {
              rawRing = geom.coordinates[0];
            } else if (geom.type === "MultiPolygon" && geom.coordinates?.[0]?.[0]) {
              rawRing = geom.coordinates[0][0];
            } else if (Array.isArray(geom.coordinates?.[0])) {
              rawRing = geom.coordinates[0];
            }
            if (rawRing && rawRing.length >= 3) {
              coords = rawRing.map(([lng, lat]: [number, number]) => [lat, lng]);
            }
          }

          let calcLuas = Number(row.luas_ha ?? row.Luas ?? row.luas ?? 0);
          let calcReal = Number(row.realisasi_luas_ha ?? calcLuas);

          // Jika luas di tabel bernilai 0, hitung otomatis dari poligon via Turf.js
          if (calcLuas <= 0 && row.coordinates) {
            try {
              const geom = row.coordinates.type ? row.coordinates : { type: "Polygon", coordinates: row.coordinates };
              const m2 = turf.area(geom);
              if (m2 > 0) {
                calcLuas = Number((m2 / 10000).toFixed(2));
                if (calcReal <= 0) calcReal = calcLuas;
              }
            } catch {
              calcLuas = 25.0;
              if (calcReal <= 0) calcReal = 25.0;
            }
          }

          return {
            id: row.id,
            company: row.company || getCompanyForEstate(row.estate || "BUM 1"),
            region: row.region || "REGION 1",
            estate: row.estate || "BUM 1",
            afdeling: row.afdeling || "AFD 1",
            blok: row.blok || row.Blok || "BLK",
            warung: row.warung || `Warung ${row.afdeling || "AFD 1"}`,
            luas_ha: calcLuas,
            realisasi_luas_ha: calcReal,
            capaian_persen: Number(row.capaian_persen ?? (calcLuas > 0 ? Math.round((calcReal / calcLuas) * 100) : 100)),
            sph: Number(row.sph ?? 136),
            kondisi: row.kondisi || "BAPP",
            kontraktor: row.kontraktor || "Mandor Lapangan",
            update_peta: row.update_peta || "Sinkron DB",
            periode: row.periode || "Rotasi 1 2026",
            tanggal: row.tanggal || new Date().toISOString().slice(0, 10),
            keterangan: row.keterangan || "",
            aktivitas: act,
            polygonCoords: coords,
            rawGeometry: row.coordinates,
            kuota_revisi: row.kuota_revisi !== undefined ? Number(row.kuota_revisi) : 2,
            revisi_ke: Number(row.revisi_ke ?? 0),
            is_locked: Boolean(row.is_locked),
            alasan_revisi: row.alasan_revisi || "",
            direvisi_oleh: row.direvisi_oleh || "",
            waktu_revisi: row.waktu_revisi || "",
          };
        });

        setRecords(loaded);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error("Gagal memuat data dari database:", err);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Muat data langsung dari database saat komponen dimuat atau URL tab berganti
  useEffect(() => {
    loadFromOperationalTables(currentTabFromUrl);
  }, [currentTabFromUrl, loadFromOperationalTables]);

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
  const [uploadResultReport, setUploadResultReport] = useState<{
    fileName: string;
    total: number;
    successCount: number;
    failedCount: number;
    tables: string[];
    errors: string[];
    missingAttributeCount: number;
  } | null>(null);

  // Handle pergantian tab & navigasi URL
  const handleTabChange = (tab: AktivitasType) => {
    setActiveTab(tab);
    setSelectedType(tab);
    setCurrentPage(1);
    loadFromOperationalTables(tab);
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
      // Filter Perusahaan (PT BUM vs PT BSL)
      if (selectedCompany !== "all") {
        const comp = r.company || getCompanyForEstate(r.estate);
        if (comp !== selectedCompany) return false;
      }
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
  const handleSaveRecord = async (savedRecord: OperasionalRecord) => {
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

    const targetTable = getSupabaseTableByAktivitas(savedRecord.aktivitas);
    let dbNotice = "";
    try {
      const dbRow = toDbPayload(savedRecord);
      const res = isEdit
        ? await supabase.from(targetTable).update(dbRow, { id: `eq.${savedRecord.id}` })
        : await supabase.from(targetTable).insert(dbRow);

      if (res.error) {
        dbNotice = ` (Gagal masuk DB ${targetTable}: ${res.error.message || "Cek skema tabel"})`;
      } else {
        dbNotice = ` & tersimpan ke tabel DB '${targetTable}'.`;
      }

      supabase
        .logAudit({
          action: isEdit ? "UPDATE" : "INSERT",
          table_name: targetTable,
          record_id: savedRecord.id,
          details: `${isEdit ? "Perbarui" : "Tambah"} record operasional Blok ${savedRecord.blok} (${savedRecord.aktivitas}).`,
          new_data: savedRecord,
        })
        .catch(() => {});
    } catch (err: any) {
      dbNotice = ` (Gagal koneksi DB ${targetTable}: ${err?.message || "Unknown"})`;
    }

    // Catat ke log aksi lokal
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
      catatan: `${isEdit ? "Perbarui" : "Tambah"} record ${savedRecord.aktivitas} -> tabel ${targetTable} (${savedRecord.realisasi_luas_ha} Ha).`,
    };
    setActionLogs((prev) => [newLog, ...prev]);

    setNotice(`Data operasional Blok ${savedRecord.blok} disimpan${dbNotice}`);
    setTimeout(() => setNotice(""), 5000);
  };

  // Hapus Record
  const handleDeleteRecord = async (id: string) => {
    const target = records.find((r) => r.id === id);
    setRecords((prev) => prev.filter((r) => r.id !== id));

    if (target) {
      const targetTable = getSupabaseTableByAktivitas(target.aktivitas);
      try {
        await supabase.from(targetTable).delete({ id: `eq.${id}` });
        supabase
          .logAudit({
            action: "DELETE",
            table_name: targetTable,
            record_id: id,
            details: `Hapus record operasional Blok ${target.blok} (${target.aktivitas}).`,
            old_data: target,
          })
          .catch(() => {});
      } catch {}

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
        catatan: `Hapus record transaksi operasional ${target.aktivitas} dari tabel ${targetTable}.`,
      };
      setActionLogs((prev) => [newLog, ...prev]);
    }

    setNotice("Data operasional berhasil dihapus.");
    setTimeout(() => setNotice(""), 3500);
  };

  // Handler Sukses Unggah Spasial (Pisahkan ke tabel produksi vs masing-masing sub perawatan)
  const handleSpatialUploadSuccess = async (
    fileName: string,
    targetAktivitas: string,
    estate: string,
    newRecords?: OperasionalRecord[]
  ) => {
    const recordCount = newRecords ? newRecords.length : 0;
    const syncedTables: string[] = [];
    const dbErrors: string[] = [];
    let totalInserted = 0;
    let missingAttrCount = 0;

    if (newRecords && newRecords.length > 0) {
      setRecords((prev) => [...newRecords, ...prev]);

      // Hitung record yang tidak memiliki nama blok / luas awal
      missingAttrCount = newRecords.filter(
        (r) => r.keterangan.includes("Belum ada data") || r.blok.includes("Belum Ada Nama")
      ).length;

      // Kelompokkan record berdasarkan aktivitas -> tabel DB masing-masing
      const groupedByTable: Record<string, OperasionalRecord[]> = {};
      newRecords.forEach((r) => {
        const tbl = getSupabaseTableByAktivitas(r.aktivitas);
        if (!groupedByTable[tbl]) groupedByTable[tbl] = [];
        groupedByTable[tbl].push(r);
      });

      for (const [tableName, groupRecords] of Object.entries(groupedByTable)) {
        try {
          // 1. Ambil data yang sudah ada di database untuk tabel ini (Composite Key matching)
          const { data: existingRows } = await supabase
            .from(tableName)
            .select("id,company,region,estate,afdeling,blok,periode,tanggal,kuota_revisi,revisi_ke,is_locked,coordinates,luas_ha,kondisi", {}, { limit: 5000 });

          const existingMap = new Map<string, any>();
          if (Array.isArray(existingRows)) {
            existingRows.forEach((row: any) => {
              const compKey = generateBlockCompositeKey(
                row.company || getCompanyForEstate(row.estate),
                row.estate,
                row.afdeling,
                row.blok,
                row.periode
              );
              existingMap.set(compKey, row);
            });
          }

          const recordsToInsert: any[] = [];
          const recordsToUpdate: { id: string; payload: any; oldRecord: any }[] = [];
          const blockedCutoff: string[] = [];
          const blockedNonAdmin: string[] = [];
          const blockedExceededQuota: string[] = [];

          groupRecords.forEach((rec) => {
            const compKey = generateBlockCompositeKey(
              rec.company || getCompanyForEstate(rec.estate),
              rec.estate,
              rec.afdeling,
              rec.blok,
              rec.periode
            );
            const existing = existingMap.get(compKey);

            if (!existing) {
              // DATA BARU: Insert
              recordsToInsert.push(toDbPayload(rec));
            } else {
              // DATA SUDAH ADA: Periksa aturan tata kelola
              // A. Cek Cut-off tanggal 25
              if (isTransactionCutoffLocked(existing.tanggal)) {
                blockedCutoff.push(`Blok ${rec.blok} (Terkunci Cut-off tgl 25)`);
                return;
              }

              // B. Cek Hak Akses (Hanya Admin GIS yang berhak merevisi data yang sudah ada)
              if (!isAdminGis) {
                blockedNonAdmin.push(`Blok ${rec.blok} (Hanya Admin GIS yang berhak revisi)`);
                return;
              }

              // C. Cek Kuota Revisi (Internal kuota = 2)
              const currentQuota = existing.kuota_revisi !== undefined ? Number(existing.kuota_revisi) : 2;
              if (currentQuota <= 0 || existing.is_locked) {
                blockedExceededQuota.push(`Blok ${rec.blok} (Batas kuota revisi habis / Terkunci permanen)`);
                return;
              }

              const nextRevisiKe = (Number(existing.revisi_ke) || 0) + 1;
              const remainingQuota = currentQuota - 1;
              const isLockedFinal = remainingQuota <= 0;

              recordsToUpdate.push({
                id: existing.id,
                oldRecord: existing,
                payload: {
                  ...toDbPayload(rec),
                  id: existing.id,
                  kuota_revisi: remainingQuota,
                  revisi_ke: nextRevisiKe,
                  is_locked: isLockedFinal,
                  alasan_revisi: `Revisi Spasial ke-${nextRevisiKe} oleh Admin GIS dari berkas ${fileName}`,
                  direvisi_oleh: currentUser?.fullName || "Admin GIS",
                  waktu_revisi: new Date().toISOString(),
                },
              });
            }
          });

          // 2. Eksekusi INSERT untuk record baru
          let insertedCount = 0;
          const BATCH_SIZE = 100;
          for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
            const batch = recordsToInsert.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from(tableName).insert(batch);
            if (!error) {
              insertedCount += batch.length;
              totalInserted += batch.length;
            }
          }

          // 3. Eksekusi UPDATE & Simpan Snapshot Riwayat untuk record yang direvisi
          let updatedCount = 0;
          for (const item of recordsToUpdate) {
            const dbPayload = toDbPayload(item.payload as any);
            const { error: updErr } = await supabase.from(tableName).update(dbPayload, { id: `eq.${item.id}` });
            if (!updErr) {
              updatedCount += 1;
              totalInserted += 1;

              // Simpan Snapshot Riwayat ke audit log & localStorage
              const snapshotData = {
                id: `snap-${Date.now()}-${item.payload.blok}`,
                record_id: item.id,
                aktivitas: item.payload.aktivitas,
                company: item.payload.company,
                estate: item.payload.estate,
                afdeling: item.payload.afdeling,
                blok: item.payload.blok,
                periode: item.payload.periode,
                coordinates_sebelum: item.oldRecord.coordinates,
                luas_sebelum: item.oldRecord.luas_ha,
                kondisi_sebelum: item.oldRecord.kondisi,
                coordinates_sesudah: item.payload.coordinates,
                luas_sesudah: item.payload.luas_ha,
                kondisi_sesudah: item.payload.kondisi,
                alasan_revisi: item.payload.alasan_revisi,
                revisi_ke: item.payload.revisi_ke,
                diubah_oleh: item.payload.direvisi_oleh,
                waktu_diubah: item.payload.waktu_revisi,
              };

              try {
                localStorage.setItem(`spatial_snapshots_${item.id}`, JSON.stringify(snapshotData));
              } catch {}

              supabase.logAudit({
                action: "UPDATE",
                table_name: tableName,
                record_id: item.id,
                old_data: item.oldRecord,
                new_data: item.payload,
                details: `Revisi Spasial ke-${item.payload.revisi_ke} Blok ${item.payload.blok} oleh ${item.payload.direvisi_oleh}`,
              }).catch(() => {});
            }
          }

          // Kumpulkan laporan penolakan/sukses
          if (blockedCutoff.length > 0) {
            dbErrors.push(`${blockedCutoff.length} blok ditolak karena melewati Cut-off tgl 25.`);
          }
          if (blockedNonAdmin.length > 0) {
            dbErrors.push(`${blockedNonAdmin.length} blok ditolak revisi (Hanya Admin GIS yang berhak).`);
          }
          if (blockedExceededQuota.length > 0) {
            dbErrors.push(`${blockedExceededQuota.length} blok ditolak karena kuota revisi telah habis.`);
          }

          syncedTables.push(`${tableName} (${insertedCount} baru, ${updatedCount} revisi)`);

          supabase
            .logAudit({
              action: "UPLOAD",
              table_name: tableName,
              details: `Unggah berkas spasial ${fileName} (${insertedCount}/${groupRecords.length} blok berhasil) untuk estate ${estate} ke tabel ${tableName}.`,
              new_data: { fileName, estate, tableName, total: groupRecords.length, inserted: insertedCount },
            })
            .catch(() => {});
        } catch (err: any) {
          dbErrors.push(`${tableName}: ${err?.message || "Gagal koneksi"}`);
        }
      }
    }

    const tableSummary = syncedTables.length > 0 ? syncedTables.join(", ") : getSupabaseTableByAktivitas(targetAktivitas);

    // Buka dialog laporan unggah detail agar surveyor / admin mengetahui status data persis
    setUploadResultReport({
      fileName,
      total: recordCount,
      successCount: totalInserted,
      failedCount: recordCount - totalInserted,
      tables: syncedTables,
      errors: dbErrors,
      missingAttributeCount: missingAttrCount,
    });

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
      blok: `${estate} (${recordCount} Blok)`,
      status: dbErrors.length > 0 ? "Gagal" : "Sukses",
      catatan:
        dbErrors.length > 0
          ? `Unggah ${fileName} (${totalInserted}/${recordCount} baris masuk DB). Error: ${dbErrors.join("; ")}`
          : `Unggah ${fileName} (${recordCount} blok) sukses masuk database: ${tableSummary}. Termasuk ${missingAttrCount} blok dengan label 'Belum ada data'.`,
    };
    setActionLogs((prev) => [newLog, ...prev]);

    if (dbErrors.length > 0) {
      setNotice(
        `Unggah ${fileName}: Berhasil masuk DB ${totalInserted} dari ${recordCount} baris. ${dbErrors.join(" | ")}`
      );
    } else {
      setNotice(
        `Berkas ${fileName} (${recordCount} blok) berhasil MASUK DATABASE ke tabel: ${tableSummary}.`
      );
    }
    setTimeout(() => setNotice(""), 8000);
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

      {/* Selector Multi-Company (PT BUM & PT BSL) & Indikator Tata Kelola */}
      <section aria-label="Entitas Perusahaan dan Tata Kelola" className="w-full min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Entitas Perusahaan:
            </span>
            <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setSelectedCompany("all");
                  setSelectedEstate("all");
                  setSelectedAfdeling("all");
                  setSelectedBlock("all");
                }}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  selectedCompany === "all"
                    ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white font-extrabold"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Semua Entitas
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCompany("PT BUM");
                  setSelectedEstate("all");
                  setSelectedAfdeling("all");
                  setSelectedBlock("all");
                }}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  selectedCompany === "PT BUM"
                    ? "bg-emerald-600 text-white shadow-xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                PT BUM (Region 1 & 2)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCompany("PT BSL");
                  setSelectedEstate("all");
                  setSelectedAfdeling("all");
                  setSelectedBlock("all");
                }}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  selectedCompany === "PT BSL"
                    ? "bg-sky-600 text-white shadow-xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                PT BSL (Region 3)
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 font-medium">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Cut-Off Bulanan: <strong>Tgl 25 Pk 23:59</strong></span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 font-medium">
              <span className="size-2 rounded-full bg-amber-500" />
              <span>Maks 1x Revisi Spasial ({isAdminGis ? "Admin GIS" : "Restricted"})</span>
            </div>
          </div>
        </div>
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
            handleResetFilter();
            loadFromOperationalTables(activeTab);
            setNotice("Data operasional berhasil disinkronkan langsung dari database.");
            setTimeout(() => setNotice(""), 3000);
          }}
        />
      </section>

      {/* 4. Tabel Transaksi Lapangan (15 Standar Kolom + Kolom Aksi Sticky) */}
      <section aria-label="Tabel Operasional" className="w-full min-w-0">
        {isLoading ? (
          <div className="w-full min-w-0 rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900/40 shadow-xs">
            <svg className="size-8 mx-auto text-emerald-600 dark:text-emerald-400 animate-spin mb-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Menyinkronkan data {activeTab} dari database Supabase...
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Memuat data riil operasional kebun secara aman.
            </p>
          </div>
        ) : (
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
        )}

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

      {/* Modal Laporan Hasil Unggah & Audit Database */}
      {uploadResultReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <svg className="size-5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>Laporan Sinkronisasi Database</span>
              </h3>
              <button
                type="button"
                onClick={() => setUploadResultReport(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Berkas:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{uploadResultReport.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Poligon:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{uploadResultReport.total} Blok</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Berhasil Masuk Database:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{uploadResultReport.successCount} Blok</span>
                </div>
                {uploadResultReport.failedCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gagal Masuk:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">{uploadResultReport.failedCount} Blok</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Tabel Tujuan DB:</span>
                  <span className="font-medium text-emerald-700 dark:text-emerald-300">
                    {uploadResultReport.tables.join(", ") || "-"}
                  </span>
                </div>
              </div>

              {uploadResultReport.missingAttributeCount > 0 && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300">
                  <div className="font-semibold flex items-center gap-1.5 mb-1">
                    <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{uploadResultReport.missingAttributeCount} Poligon Tanpa Atribut Lengkap</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Poligon tetap berhasil disimpan ke database tanpa dieliminasi, dengan label <strong>"Belum ada data"</strong> atau <strong>"BLOK (Belum Ada Nama)"</strong>. Geometri koordinat spasial tetap terjaga 100%.
                  </p>
                </div>
              )}

              {uploadResultReport.errors.length > 0 && (
                <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 dark:border-rose-900/50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300">
                  <div className="font-semibold mb-1">Pesan Error Database:</div>
                  <div className="max-h-24 overflow-y-auto space-y-1 font-mono text-[10px]">
                    {uploadResultReport.errors.map((err, i) => (
                      <div key={i}>• {err}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setUploadResultReport(null)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
              >
                Tutup & Lihat Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
