import { useState, useMemo, useEffect } from "react";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import { supabase } from "@/lib/supabase";
import { getGisDataset, setGisDataset } from "@/lib/indexed-db";
import {
  exportToCSV,
  exportToExcel,
  exportToGeoJSON,
  exportToShapefileZip,
} from "@/utils/gis-export";
import PokokSawitMapModal from "./components/pokok-sawit-map-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// 12 Kolom Lengkap Database Pokok Sawit
export const POKOK_SAWIT_DB_COLUMNS = [
  "Id",
  "NOMOR",
  "BARIS",
  "ANCAK",
  "BLOK",
  "AFD",
  "ESTATE",
  "REGION",
  "TH_TANAM",
  "SPH",
  "HGU",
  "KETERANGAN",
] as const;

// 10 Kolom Tampilan Antarmuka (Kolom Id dan NOMOR hanya disimpan di database)
export const POKOK_SAWIT_DISPLAY_COLUMNS = [
  "BARIS",
  "ANCAK",
  "BLOK",
  "AFD",
  "ESTATE",
  "REGION",
  "TH_TANAM",
  "SPH",
  "HGU",
  "KETERANGAN",
] as const;

// Ekspor baku untuk kompatibilitas tampilan
export const POKOK_SAWIT_COLUMNS = POKOK_SAWIT_DISPLAY_COLUMNS;

export type PokokSawitRecord = Record<string, any>;

// Data awal dikosongkan (0 data dummy) agar siap diunggah berkas sensus riil
const INITIAL_POKOK_SAWIT_DATA: PokokSawitRecord[] = [];

/**
 * Parser teks CSV/TSV menjadi array objek
 */
function parseCSVToObjects(csvText: string): any[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const delim = headerLine.includes(";") ? ";" : headerLine.includes("\t") ? "\t" : ",";
  const headers = headerLine.split(delim).map((h) => h.trim().replace(/^["']|["']$/g, ""));
  const records: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawCols = lines[i].split(delim);
    if (rawCols.length === 0 || (rawCols.length === 1 && !rawCols[0].trim())) continue;
    const rowObj: Record<string, any> = {};
    headers.forEach((h, colIdx) => {
      const val = rawCols[colIdx]?.trim().replace(/^["']|["']$/g, "") ?? "";
      rowObj[h] = val;
    });
    records.push(rowObj);
  }

  return records;
}

/**
 * Normalisasi dan ekstraksi atribut pokok sawit dari berbagai struktur berkas (SHP, GeoJSON, CSV)
 */
function extractPokokSawitRecords(rawList: any[]): PokokSawitRecord[] {
  return rawList.map((item, idx) => {
    const props = item.properties || item;
    const geom = item.geometry;
    let lat: number | undefined;
    let lng: number | undefined;

    if (geom && geom.coordinates) {
      const c = geom.coordinates;
      if (Array.isArray(c) && typeof c[0] === "number" && typeof c[1] === "number") {
        lng = c[0];
        lat = c[1];
      }
    }

    const getVal = (...keys: string[]) => {
      for (const k of keys) {
        if (props[k] !== undefined && props[k] !== null && props[k] !== "") return props[k];
        const foundKey = Object.keys(props).find((pk) => pk.toLowerCase() === k.toLowerCase());
        if (foundKey && props[foundKey] !== undefined && props[foundKey] !== null && props[foundKey] !== "") {
          return props[foundKey];
        }
      }
      return undefined;
    };

    const baris = Number(getVal("BARIS", "Baris", "baris", "ROW", "Row", "B")) || 1;
    const ancak = String(getVal("ANCAK", "Ancak", "ancak", "ANC", "A") || "A01");
    const blok = String(getVal("BLOK", "Blok", "blok", "BLOCK", "BLOCKID") || "-");
    const afd = String(getVal("AFD", "Afd", "afd", "AFDELING", "Afdeling") || "-");
    const estate = String(getVal("ESTATE", "Estate", "estate", "EST", "Est") || "BUM 1");
    const region = String(getVal("REGION", "Region", "region", "REG") || "Region 1");
    const thTanam = Number(getVal("TH_TANAM", "TH_TA", "Th_Tanam", "th_tanam", "TAHUN", "Tahun", "THN_TANAM", "YOP", "TH_TNM", "TH_T")) || 2012;
    const sph = Number(getVal("SPH", "Sph", "sph", "SPH_BAKU")) || 143;
    const hgu = String(getVal("HGU", "Hgu", "hgu", "NO_HGU", "No_HGU") || "-");
    const keterangan = String(getVal("KETERANGAN", "KETERANGA", "KETERAN", "Keterangan", "keterangan", "KET", "Ket", "STATUS", "Status") || "TM");
    const nomor = Number(getVal("NOMOR", "NOMO", "Nomor", "nomor", "NO", "No", "POKOK", "Pokok")) || idx + 1;
    const idVal = getVal("Id", "ID", "id") !== undefined ? getVal("Id", "ID", "id") : idx + 1;

    return {
      id: item.id || `pks-${Date.now()}-${idx + 1}`,
      Id: idVal,
      NOMOR: nomor,
      BARIS: baris,
      ANCAK: ancak,
      BLOK: blok,
      AFD: afd,
      ESTATE: estate,
      REGION: region,
      TH_TANAM: thTanam,
      SPH: sph,
      HGU: hgu,
      KETERANGAN: keterangan,
      lat: lat || (getVal("lat", "LAT", "Y_GEO", "LATITUDE") ? Number(getVal("lat", "LAT", "Y_GEO", "LATITUDE")) : undefined),
      lng: lng || (getVal("lng", "LNG", "X_GEO", "LONGITUDE") ? Number(getVal("lng", "LNG", "X_GEO", "LONGITUDE")) : undefined),
    };
  });
}

export default function PokokSawitPage() {
  const [data, setData] = useState<PokokSawitRecord[]>(INITIAL_POKOK_SAWIT_DATA);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedAfdeling, setSelectedAfdeling] = useState<string>("");

  // Pagination states (Default 10 baris per halaman)
  const [pageSize, setPageSize] = useState<number | "all">(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals & Active Record
  const [selectedRecord, setSelectedRecord] = useState<PokokSawitRecord | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [formRecord, setFormRecord] = useState<PokokSawitRecord | null>(null);
  const [showMapModal, setShowMapModal] = useState<boolean>(false);
  const [mapRecord, setMapRecord] = useState<PokokSawitRecord | null>(null);
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<PokokSawitRecord | null>(null);

  // Modal Ekspor Khusus Per Afdeling
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportAfdelingTarget, setExportAfdelingTarget] = useState<string>("");

  // Daftar unik Afdeling yang ada di dataset riil
  const availableAfdelings = useMemo(() => {
    const setAfd = new Set<string>();
    data.forEach((d) => {
      const val = String(d.AFD || "").trim();
      if (val && val !== "-" && val !== "undefined") {
        setAfd.add(val);
      }
    });
    return Array.from(setAfd).sort();
  }, [data]);

  // Muat data persisten dari IndexedDB terlebih dahulu, lalu sinkronkan dari Supabase jika ada
  useEffect(() => {
    let isCancelled = false;
    const loadInitialData = async () => {
      try {
        // 1. Cek penyimpanan lokal browser (IndexedDB)
        const cached = await getGisDataset<PokokSawitRecord[]>("pokok_sawit");
        if (!isCancelled && cached && Array.isArray(cached) && cached.length > 0) {
          setData(cached);
        }

        // 2. Cek sinkronisasi database server Supabase
        const res = await supabase.from("pokok_sawit").select("*");
        if (!isCancelled && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setData(res.data);
          await setGisDataset("pokok_sawit", res.data);
        }
      } catch (err) {
        console.warn("Gagal memuat dataset pokok sawit:", err);
      }
    };
    loadInitialData();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Filter gabungan: Afdeling + Input Pencarian
  const filteredData = useMemo(() => {
    let list = data;
    if (selectedAfdeling) {
      list = list.filter(
        (item) => String(item.AFD || "").trim().toLowerCase() === selectedAfdeling.toLowerCase()
      );
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((item) => {
      return (
        String(item.BLOK || "").toLowerCase().includes(q) ||
        String(item.ANCAK || "").toLowerCase().includes(q) ||
        String(item.BARIS || "").toLowerCase().includes(q) ||
        String(item.ESTATE || "").toLowerCase().includes(q) ||
        String(item.AFD || "").toLowerCase().includes(q) ||
        String(item.REGION || "").toLowerCase().includes(q) ||
        String(item.TH_TANAM || "").toLowerCase().includes(q) ||
        String(item.SPH || "").toLowerCase().includes(q) ||
        String(item.HGU || "").toLowerCase().includes(q) ||
        String(item.KETERANGAN || "").toLowerCase().includes(q)
      );
    });
  }, [data, selectedAfdeling, searchQuery]);

  // Reset ke halaman 1 saat pencarian, afdeling, atau ukuran baris berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedAfdeling, pageSize]);

  // Paginated items
  const totalItems = filteredData.length;
  const effectivePageSize = pageSize === "all" ? Math.max(totalItems, 1) : pageSize;
  const totalPages = pageSize === "all" ? 1 : Math.ceil(totalItems / effectivePageSize);

  const paginatedData = useMemo(() => {
    if (pageSize === "all") return filteredData;
    const startIdx = (currentPage - 1) * effectivePageSize;
    return filteredData.slice(startIdx, startIdx + effectivePageSize);
  }, [filteredData, currentPage, effectivePageSize, pageSize]);

  const startRecordNum = totalItems === 0 ? 0 : (currentPage - 1) * (pageSize === "all" ? totalItems : pageSize) + 1;
  const endRecordNum = pageSize === "all" ? totalItems : Math.min(currentPage * pageSize, totalItems);

  // Helper ekstrak koordinat pokok sawit
  const extractTreeCoords = (item: any): [number, number] | null => {
    if (item.lat && item.lng) return [Number(item.lat), Number(item.lng)];
    if (item.Y_GEO && item.X_GEO) return [Number(item.Y_GEO), Number(item.X_GEO)];
    const baris = Number(item.BARIS) || 1;
    const nomor = Number(item.NOMOR) || Number(item.Id) || 1;
    const baseCenter = [-1.4795, 112.7015];
    const rowOffset = (baris % 2 === 0 ? 0.5 : 0.0) * 0.000081;
    const lat = baseCenter[0] + (baris - 1) * 0.000075;
    const lng = baseCenter[1] + (nomor - 1) * 0.000081 + rowOffset;
    return [lat, lng];
  };

  // Helper mengambil data target ekspor (khusus afdeling terpilih)
  const getRecordsToExport = (targetAfd: string): PokokSawitRecord[] => {
    if (targetAfd) {
      return data.filter(
        (d) => String(d.AFD || "").trim().toLowerCase() === targetAfd.toLowerCase()
      );
    }
    return filteredData;
  };

  const getExportFilename = (formatExt: string, targetAfd: string) => {
    const afdLabel = targetAfd ? `AFD_${targetAfd.replace(/\s+/g, "_")}` : "Semua_Afdeling";
    const dateStr = new Date().toISOString().slice(0, 10);
    return `Pokok_Sawit_${afdLabel}_${dateStr}.${formatExt}`;
  };

  const EXPORT_COLUMNS = [
    { key: "BARIS", label: "BARIS" },
    { key: "ANCAK", label: "ANCAK" },
    { key: "BLOK", label: "BLOK" },
    { key: "AFD", label: "AFD" },
    { key: "ESTATE", label: "ESTATE" },
    { key: "REGION", label: "REGION" },
    { key: "TH_TANAM", label: "TH_TANAM" },
    { key: "SPH", label: "SPH" },
    { key: "HGU", label: "HGU" },
    { key: "KETERANGAN", label: "KETERANGAN" },
  ];

  const SHP_FIELDS: { key: string; label: string; type?: "C" | "N"; length?: number; decimals?: number }[] = [
    { key: "BARIS", label: "BARIS", type: "N", length: 6, decimals: 0 },
    { key: "ANCAK", label: "ANCAK", type: "C", length: 10 },
    { key: "BLOK", label: "BLOK", type: "C", length: 10 },
    { key: "AFD", label: "AFD", type: "C", length: 10 },
    { key: "ESTATE", label: "ESTATE", type: "C", length: 12 },
    { key: "REGION", label: "REGION", type: "C", length: 12 },
    { key: "TH_TANAM", label: "TH_TANAM", type: "N", length: 6, decimals: 0 },
    { key: "SPH", label: "SPH", type: "N", length: 6, decimals: 0 },
    { key: "HGU", label: "HGU", type: "C", length: 20 },
    { key: "KETERANGAN", label: "KETERANGAN", type: "C", length: 20 },
  ];

  // 1. Ekspor CSV
  const handleDoExportCSV = (targetAfd: string) => {
    const records = getRecordsToExport(targetAfd);
    const fname = getExportFilename("csv", targetAfd);
    exportToCSV(fname, EXPORT_COLUMNS, records);
    setShowExportModal(false);
  };

  // 2. Ekspor Excel
  const handleDoExportExcel = (targetAfd: string) => {
    const records = getRecordsToExport(targetAfd);
    const fname = getExportFilename("xls", targetAfd);
    const sheetTitle = targetAfd ? `AFD ${targetAfd}` : "Pokok Sawit";
    exportToExcel(fname, sheetTitle, EXPORT_COLUMNS, records);
    setShowExportModal(false);
  };

  // 3. Ekspor GeoJSON
  const handleDoExportGeoJSON = (targetAfd: string) => {
    const records = getRecordsToExport(targetAfd);
    const fname = getExportFilename("geojson", targetAfd);
    exportToGeoJSON(fname, records, extractTreeCoords);
    setShowExportModal(false);
  };

  // 4. Ekspor Shapefile (.zip)
  const handleDoExportShapefile = (targetAfd: string) => {
    const records = getRecordsToExport(targetAfd);
    const fname = getExportFilename("zip", targetAfd);
    const layerName = targetAfd ? `Pokok_Sawit_AFD_${targetAfd.replace(/\s+/g, "_")}` : "Pokok_Sawit";
    exportToShapefileZip(fname, layerName, SHP_FIELDS, records, extractTreeCoords);
    setShowExportModal(false);
  };

  // Simpan form (Tambah / Edit Pokok)
  const handleSaveForm = async (formData: Record<string, any>) => {
    let nextData: PokokSawitRecord[] = [];
    if (formRecord?.id) {
      // UPDATE
      const updatedRec = {
        ...formRecord,
        ...formData,
      };
      nextData = data.map((item) => (item.id === formRecord.id ? updatedRec : item));
      setData(nextData);
      await setGisDataset("pokok_sawit", nextData);
      if (formRecord.id && !formRecord.id.startsWith("pks-local-")) {
        supabase.from("pokok_sawit").update(formData, { id: `eq.${formRecord.id}` }).catch(() => {});
      }
    } else {
      // CREATE: Auto-generate Id & NOMOR untuk disimpan di DB
      const nextNum = data.length + 1;
      const newRec: PokokSawitRecord = {
        Id: nextNum,
        NOMOR: nextNum,
        ...formData,
        id: "pks-" + Date.now(),
      };
      nextData = [newRec, ...data];
      setData(nextData);
      await setGisDataset("pokok_sawit", nextData);
      supabase.from("pokok_sawit").insert(newRec).catch(() => {});
    }
    setShowFormModal(false);
    setFormRecord(null);
  };

  // Hapus Data (DELETE)
  const handleConfirmDelete = async () => {
    if (!deleteConfirmRecord) return;
    const targetId = deleteConfirmRecord.id;
    const nextData = data.filter((r) => r.id !== targetId);
    setData(nextData);
    await setGisDataset("pokok_sawit", nextData);
    if (targetId && !targetId.startsWith("pks-local-")) {
      await supabase.from("pokok_sawit").delete({ id: `eq.${targetId}` }).catch(() => {});
    }
    setDeleteConfirmRecord(null);
  };

  // Proses upload berkas sensus riil (Mendukung .zip Shapefile via shpjs, .geojson, .json, dan .csv)
  const handleProcessUpload = async () => {
    if (!uploadedFile) return;
    setIsProcessingUpload(true);
    setUploadStatus("Membaca berkas sensus...");
    setUploadError(null);

    try {
      const fileNameLower = uploadedFile.name.toLowerCase();
      let rawList: any[] = [];

      if (fileNameLower.endsWith(".zip")) {
        setUploadStatus("Membongkar arsip ZIP Shapefile (.shp, .dbf)...");
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const shpModule: any = await import("shpjs");
        const shp = shpModule.default || shpModule;
        const parsed = await shp(arrayBuffer);

        if (Array.isArray(parsed)) {
          rawList = parsed.flatMap((fc: any) => fc.features || []);
        } else if (parsed && parsed.features) {
          rawList = parsed.features;
        }
      } else if (fileNameLower.endsWith(".geojson") || fileNameLower.endsWith(".json")) {
        setUploadStatus("Membaca format GeoJSON / JSON...");
        const text = await uploadedFile.text();
        const parsed = JSON.parse(text);
        if (parsed.features && Array.isArray(parsed.features)) {
          rawList = parsed.features;
        } else if (Array.isArray(parsed)) {
          rawList = parsed;
        }
      } else if (fileNameLower.endsWith(".csv") || fileNameLower.endsWith(".txt")) {
        setUploadStatus("Mengekstrak baris CSV / tabel teks...");
        const text = await uploadedFile.text();
        rawList = parseCSVToObjects(text);
      } else {
        throw new Error("Format berkas belum didukung. Harap unggah berkas .zip (Shapefile), .geojson, .json, atau .csv");
      }

      if (!rawList || rawList.length === 0) {
        throw new Error("Tidak ada data baris atau fitur spasial yang ditemukan di dalam berkas.");
      }

      setUploadStatus(`Memetakan atribut (${rawList.length} data)...`);
      const extractedRecords = extractPokokSawitRecords(rawList);

      // Simpan data ke state tabel dan IndexedDB (persisten di browser)
      setData(extractedRecords);
      setUploadStatus("Menyimpan dataset ke penyimpanan browser (IndexedDB)...");
      await setGisDataset("pokok_sawit", extractedRecords);
      setUploadStatus(`Sukses! ${extractedRecords.length.toLocaleString("id-ID")} data sensus pokok sawit tersimpan aman.`);

      // Catat log
      supabase.logAudit({
        action: "UPLOAD",
        table_name: "pokok_sawit",
        record_id: uploadedFile.name,
        details: `Unggah sensus pokok sawit (${uploadedFile.name}): ${extractedRecords.length} record diekstrak`,
      }).catch(() => {});

      setTimeout(() => {
        setShowUploadModal(false);
        setUploadedFile(null);
        setUploadStatus("");
        setUploadError(null);
        setIsProcessingUpload(false);
      }, 1200);
    } catch (err: any) {
      console.error("Gagal proses unggah sensus pokok sawit:", err);
      setUploadError(err.message || "Gagal memproses berkas. Pastikan format berkas valid.");
      setUploadStatus("");
      setIsProcessingUpload(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Pokok Sawit & Sensus Tegakan | PT BUM"
        description="Inventarisasi spasial tegakan pokok sawit, nomor baris, ancak, dan SPH baku PT Bangkitgiat Usaha Mandiri"
      />

      <div className="space-y-4">
        <PageBreadcrumb pageTitle="Pokok Sawit" />

        {/* Toolbar Pencarian & Aksi Terpadu */}
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            {/* Input Pencarian & Filter Afdeling Ringkas */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 max-w-xl">
              <div className="relative flex-1 min-w-[200px]">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Cari blok, ancak, baris, afdeling, estate, status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-9 text-xs text-gray-900 placeholder-gray-400 shadow-theme-xs focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter Afdeling Ringkas */}
              <div className="min-w-[150px] sm:min-w-[175px]">
                <select
                  value={selectedAfdeling}
                  onChange={(e) => setSelectedAfdeling(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-xs font-semibold text-gray-800 shadow-theme-xs focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer"
                >
                  <option value="">Semua Afdeling ({data.length.toLocaleString("id-ID")})</option>
                  {availableAfdelings.map((afd) => {
                    const count = data.filter((d) => String(d.AFD || "").trim().toLowerCase() === afd.toLowerCase()).length;
                    return (
                      <option key={afd} value={afd}>
                        Afdeling {afd} ({count.toLocaleString("id-ID")})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setMapRecord(paginatedData[0] || filteredData[0] || null);
                  setShowMapModal(true);
                }}
                disabled={filteredData.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 shadow-theme-xs hover:bg-blue-100 disabled:opacity-40 disabled:hover:bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300 cursor-pointer"
                title="Buka peta sebaran titik pokok sawit"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
                Peta Titik Pokok
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormRecord(null);
                  setShowFormModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer"
              >
                + Tambah Pokok
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(true);
                  setUploadError(null);
                  setUploadStatus("");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-theme-xs hover:bg-emerald-700 transition cursor-pointer"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Unggah Sensus SHP / Excel
              </button>

              {/* Tombol Unduh Khusus Per Afdeling */}
              <button
                type="button"
                onClick={() => {
                  setExportAfdelingTarget(selectedAfdeling || availableAfdelings[0] || "");
                  setShowExportModal(true);
                }}
                disabled={data.length === 0}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-theme-xs transition cursor-pointer ${
                  selectedAfdeling
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                }`}
                title={selectedAfdeling ? `Unduh berkas sensus Afdeling ${selectedAfdeling}` : "Pilih dan unduh berkas sensus per afdeling"}
              >
                <svg className="size-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>{selectedAfdeling ? `Unduh AFD ${selectedAfdeling}` : "Unduh Per Afdeling"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-white">
                Tabel Sensus Pokok Sawit ({totalItems} Data Terpilih)
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Menampilkan 10 kolom atribut baku (kolom Id & NOMOR tersimpan di database)
              </p>
            </div>

            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <label className="text-[11px] text-gray-600 dark:text-gray-400 font-medium">
                Baris per halaman:
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white cursor-pointer"
              >
                <option value={10}>10 Baris (Default)</option>
                <option value={25}>25 Baris</option>
                <option value={50}>50 Baris</option>
                <option value={100}>100 Baris</option>
                <option value="all">Semua Baris</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-gray-100/80 text-[11px] font-bold uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-3.5 py-3 text-center w-10">No</th>
                  {POKOK_SAWIT_DISPLAY_COLUMNS.map((col) => (
                    <th key={col} className="px-3.5 py-3 font-mono tracking-tight">
                      {col}
                    </th>
                  ))}
                  <th className="px-3.5 py-3 text-center sticky right-0 bg-gray-100/90 dark:bg-gray-800/90 shadow-xs">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={POKOK_SAWIT_DISPLAY_COLUMNS.length + 2} className="py-16 text-center text-xs text-gray-500 font-sans">
                      <div className="mx-auto max-w-md space-y-3">
                        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                          <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                            Belum Ada Data Pokok Sawit
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Silakan unggah berkas sensus riil (Shapefile .zip, Excel/CSV, GeoJSON) atau input data pokok manual.
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowUploadModal(true);
                              setUploadError(null);
                              setUploadStatus("");
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-theme-xs hover:bg-emerald-700 transition cursor-pointer"
                          >
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Unggah Sensus SHP / Excel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormRecord(null);
                              setShowFormModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer"
                          >
                            + Tambah Pokok
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, idx) => {
                    const rowNumber = startRecordNum + idx;
                    return (
                      <tr
                        key={item.id || idx}
                        className="hover:bg-emerald-50/40 dark:hover:bg-gray-800/60 transition-colors"
                      >
                        <td className="px-3.5 py-2.5 text-center text-gray-400 font-sans font-semibold">
                          {rowNumber}
                        </td>
                        <td className="px-3.5 py-2.5 text-blue-600 dark:text-blue-400 font-bold">
                          {item.BARIS !== undefined ? item.BARIS : "-"}
                        </td>
                        <td className="px-3.5 py-2.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                          {item.ANCAK || "-"}
                        </td>
                        <td className="px-3.5 py-2.5 font-bold text-gray-900 dark:text-white">
                          {item.BLOK || "-"}
                        </td>
                        <td className="px-3.5 py-2.5 font-sans font-semibold">
                          {item.AFD || "-"}
                        </td>
                        <td className="px-3.5 py-2.5 font-sans font-semibold text-emerald-700 dark:text-emerald-400">
                          {item.ESTATE || "-"}
                        </td>
                        <td className="px-3.5 py-2.5 font-sans">
                          {item.REGION || "-"}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-bold text-gray-800 dark:text-gray-200">
                          {item.TH_TANAM || "-"}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-bold text-brand-600 dark:text-brand-400 font-sans">
                          {item.SPH || "-"}
                        </td>
                        <td className="px-3.5 py-2.5 font-sans text-gray-500 max-w-xs truncate">
                          {item.HGU || "-"}
                        </td>
                        <td className="px-3.5 py-2.5 font-sans">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              String(item.KETERANGAN || "").includes("TM")
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                            }`}
                          >
                            {item.KETERANGAN || "-"}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-center sticky right-0 bg-white/95 dark:bg-gray-900/95 font-sans">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Tombol Peta */}
                            <button
                              type="button"
                              onClick={() => {
                                setMapRecord(item);
                                setShowMapModal(true);
                              }}
                              className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/60 transition cursor-pointer"
                              title="Buka peta sebaran titik pokok"
                            >
                              <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                                <line x1="8" y1="2" x2="8" y2="18" />
                                <line x1="16" y1="6" x2="16" y2="22" />
                              </svg>
                              Peta
                            </button>

                            {/* Tombol Detail */}
                            <button
                              type="button"
                              onClick={() => setSelectedRecord(item)}
                              className="rounded px-2 py-1 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 cursor-pointer"
                              title="Lihat detail atribut"
                            >
                              Detail
                            </button>

                            {/* Tombol Edit */}
                            <button
                              type="button"
                              onClick={() => {
                                setFormRecord(item);
                                setShowFormModal(true);
                              }}
                              className="rounded px-2 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                              title="Edit data"
                            >
                              Edit
                            </button>

                            {/* Tombol Hapus (DELETE) */}
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmRecord(item)}
                              className="rounded px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer"
                              title="Hapus data pokok"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 sm:mb-0">
              Menampilkan <span className="font-semibold text-gray-900 dark:text-white">{startRecordNum}</span> -{" "}
              <span className="font-semibold text-gray-900 dark:text-white">{endRecordNum}</span> dari{" "}
              <span className="font-semibold text-gray-900 dark:text-white">{totalItems}</span> data{" "}
              {totalItems !== data.length && `(difilter dari total ${data.length} data)`}
            </div>

            {pageSize !== "all" && totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(1)}
                  className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent dark:border-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  « Awal
                </button>
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent dark:border-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  ‹ Prev
                </button>

                <span className="px-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
                  Halaman {currentPage} dari {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent dark:border-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Next ›
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent dark:border-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Akhir »
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Record Modal (Id & NOMOR tidak ditampilkan di antarmuka) */}
      {selectedRecord && (
        <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                Detail Sensus Pokok (Blok {selectedRecord.BLOK})
              </DialogTitle>
              <DialogDescription>
                Rincian 10 atribut agronomi sensus populasi pokok sawit
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2.5 rounded-lg border border-gray-200 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-gray-800/40">
                {POKOK_SAWIT_DISPLAY_COLUMNS.map((col) => (
                  <div key={col} className="space-y-0.5">
                    <span className="font-mono text-[11px] text-gray-500 dark:text-gray-400">{col}:</span>
                    <p className="font-medium text-gray-900 dark:text-white break-words">
                      {selectedRecord[col] !== undefined && selectedRecord[col] !== null
                        ? String(selectedRecord[col])
                        : "-"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Form Tambah/Edit Modal (Id & NOMOR otomatis di-handle di database) */}
      {showFormModal && (
        <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {formRecord ? "Edit Data Pokok Sawit" : "Tambah Data Pokok Sawit Baru"}
              </DialogTitle>
              <DialogDescription>
                Masukkan atribut agronomi pokok sawit (Id & NOMOR otomatis dikelola database)
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const fd = new FormData(form);
                const recordData: Record<string, any> = {};
                POKOK_SAWIT_DISPLAY_COLUMNS.forEach((col) => {
                  const val = fd.get(col);
                  if (col === "BARIS" || col === "TH_TANAM" || col === "SPH") {
                    recordData[col] = val ? Number(val) : 0;
                  } else {
                    recordData[col] = val ? String(val) : "";
                  }
                });
                handleSaveForm(recordData);
              }}
              className="space-y-4 py-2"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {POKOK_SAWIT_DISPLAY_COLUMNS.map((col) => (
                  <div key={col}>
                    <label className="block text-[11px] font-mono font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {col}
                    </label>
                    <input
                      name={col}
                      type={col === "BARIS" || col === "TH_TANAM" || col === "SPH" ? "number" : "text"}
                      step="any"
                      defaultValue={formRecord ? formRecord[col] : ""}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      placeholder={`Isi ${col}...`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Konfirmasi Hapus Data (DELETE) */}
      {deleteConfirmRecord && (
        <Dialog open={!!deleteConfirmRecord} onOpenChange={() => setDeleteConfirmRecord(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Konfirmasi Hapus Data Pokok
              </DialogTitle>
              <DialogDescription className="text-xs pt-1">
                Apakah Anda yakin ingin menghapus data pokok sawit pada{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  Blok {deleteConfirmRecord.BLOK}, Baris {deleteConfirmRecord.BARIS}, Ancak {deleteConfirmRecord.ANCAK}
                </span>{" "}
                ({deleteConfirmRecord.ESTATE})?
                <br />
                Data akan dihapus permanen dari tabel dan database.
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmRecord(null)}
                className="rounded-lg border border-gray-300 px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition"
              >
                Hapus Data
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Upload SHP Modal */}
      {showUploadModal && (
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Unggah Berkas Sensus Pokok Sawit</DialogTitle>
              <DialogDescription>
                Mendukung berkas Shapefile (.zip), GeoJSON (.geojson, .json), atau tabel CSV (.csv)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="flex justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 dark:border-gray-700">
                <div className="text-center">
                  <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <label className="cursor-pointer font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
                      Pilih berkas ZIP / GeoJSON / CSV
                      <input
                        type="file"
                        className="sr-only"
                        accept=".zip,.shp,.dbf,.shx,.prj,.geojson,.json,.csv,.txt"
                        onChange={(e) => {
                          setUploadedFile(e.target.files?.[0] || null);
                          setUploadError(null);
                          setUploadStatus("");
                        }}
                      />
                    </label>
                  </div>
                  {uploadedFile && (
                    <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              </div>

              {/* Status & Error Feedback */}
              {uploadStatus && (
                <div className="rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{uploadStatus}</span>
                </div>
              )}

              {uploadError && (
                <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300 flex items-start gap-2">
                  <span className="text-red-500 font-bold">⚠️</span>
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadedFile(null);
                    setUploadError(null);
                    setUploadStatus("");
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!uploadedFile || isProcessingUpload}
                  onClick={handleProcessUpload}
                  className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isProcessingUpload ? (
                    <>
                      <svg className="animate-spin size-3.5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    "Ekstrak & Validasi"
                  )}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Unduh Sensus Per Afdeling (CSV, Excel, GeoJSON, SHP) */}
      {showExportModal && (
        <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Unduh Berkas Sensus Per Afdeling</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 pt-1">
                Pilih afdeling dan format berkas yang Anda butuhkan untuk keperluan lapangan atau GIS.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Pilihan Afdeling */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Afdeling yang Akan Diunduh:
                </label>
                <select
                  value={exportAfdelingTarget}
                  onChange={(e) => setExportAfdelingTarget(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-xs font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white cursor-pointer"
                >
                  {availableAfdelings.length === 0 ? (
                    <option value="">Belum ada afdeling terdeteksi</option>
                  ) : (
                    availableAfdelings.map((afd) => {
                      const count = data.filter((d) => String(d.AFD || "").trim().toLowerCase() === afd.toLowerCase()).length;
                      return (
                        <option key={afd} value={afd}>
                          Afdeling {afd} ({count.toLocaleString("id-ID")} pokok sawit)
                        </option>
                      );
                    })
                  )}
                </select>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  Total <strong className="text-emerald-700 dark:text-emerald-400">{getRecordsToExport(exportAfdelingTarget).length.toLocaleString("id-ID")}</strong> titik sensus siap diekspor.
                </p>
              </div>

              {/* 4 Pilihan Format Berkas */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Pilih Format Berkas:
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* CSV */}
                  <button
                    type="button"
                    onClick={() => handleDoExportCSV(exportAfdelingTarget)}
                    disabled={getRecordsToExport(exportAfdelingTarget).length === 0}
                    className="flex flex-col items-start p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-400 dark:border-gray-700 dark:bg-gray-800/60 dark:hover:bg-gray-800 transition text-left cursor-pointer group disabled:opacity-40"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900 dark:text-white group-hover:text-emerald-700">
                      <span>📄 Berkas CSV</span>
                      <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded font-mono">.csv</span>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1">
                      Data tabular ringan berstandar UTF-8 BOM
                    </span>
                  </button>

                  {/* Excel */}
                  <button
                    type="button"
                    onClick={() => handleDoExportExcel(exportAfdelingTarget)}
                    disabled={getRecordsToExport(exportAfdelingTarget).length === 0}
                    className="flex flex-col items-start p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-400 dark:border-gray-700 dark:bg-gray-800/60 dark:hover:bg-gray-800 transition text-left cursor-pointer group disabled:opacity-40"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900 dark:text-white group-hover:text-emerald-700">
                      <span>📊 Berkas Excel</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">.xls</span>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1">
                      Spreadsheet rapi siap cetak untuk agronomi
                    </span>
                  </button>

                  {/* GeoJSON */}
                  <button
                    type="button"
                    onClick={() => handleDoExportGeoJSON(exportAfdelingTarget)}
                    disabled={getRecordsToExport(exportAfdelingTarget).length === 0}
                    className="flex flex-col items-start p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-400 dark:border-gray-700 dark:bg-gray-800/60 dark:hover:bg-gray-800 transition text-left cursor-pointer group disabled:opacity-40"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900 dark:text-white group-hover:text-blue-700">
                      <span>🌐 Vektor GeoJSON</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono">.geojson</span>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1">
                      Standar spasial Web GIS & Google Earth
                    </span>
                  </button>

                  {/* Shapefile */}
                  <button
                    type="button"
                    onClick={() => handleDoExportShapefile(exportAfdelingTarget)}
                    disabled={getRecordsToExport(exportAfdelingTarget).length === 0}
                    className="flex flex-col items-start p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-purple-50 hover:border-purple-400 dark:border-gray-700 dark:bg-gray-800/60 dark:hover:bg-gray-800 transition text-left cursor-pointer group disabled:opacity-40"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900 dark:text-white group-hover:text-purple-700">
                      <span>🗺️ Shapefile GIS</span>
                      <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-mono">.zip</span>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1">
                      Paket SHP, SHX, DBF & PRJ WGS84 untuk QGIS/ArcGIS
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="rounded-lg border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Pokok Sawit Spatial Map Modal */}
      <PokokSawitMapModal
        isOpen={showMapModal}
        onClose={() => {
          setShowMapModal(false);
          setMapRecord(null);
        }}
        selectedRecord={mapRecord}
        allRecords={filteredData}
        onSelectRecord={(rec) => setMapRecord(rec)}
      />
    </>
  );
}
