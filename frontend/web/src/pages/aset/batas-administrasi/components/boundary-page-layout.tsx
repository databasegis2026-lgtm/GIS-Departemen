import { useState, useMemo, useEffect } from "react";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import { supabase } from "@/lib/supabase";
import BoundaryMapModal from "./boundary-map-modal";
import BoundaryFormModal from "./boundary-form-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface BoundaryPageLayoutProps {
  pageTitle: string;
  levelName: string;
  columns: string[];
  initialData?: Record<string, any>[];
  strokeColor: string;
  strokeWeight: number;
  dashArray?: string;
  fillOpacity?: number;
  tableName: string;
}

/** Generate UUID v4 yang aman di browser */
function genUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export default function BoundaryPageLayout({
  pageTitle,
  levelName,
  columns,
  strokeColor,
  strokeWeight,
  dashArray,
  fillOpacity = 0.15,
  tableName,
}: BoundaryPageLayoutProps) {
  // Start with empty data — no mock/dummy records
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Ambil data dari Supabase saat mount
  useEffect(() => {
    setLoading(true);
    setDbError(null);
    supabase
      .from(tableName)
      .select("*")
      .then((res) => {
        if (res.error) {
          setDbError(`Gagal memuat data: ${res.error.message || JSON.stringify(res.error)}`);
        } else if (res.data && Array.isArray(res.data)) {
          setData(res.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        setDbError(`Koneksi gagal: ${err?.message || "Unknown error"}`);
        setLoading(false);
      });
  }, [tableName]);

  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [importedSummary, setImportedSummary] = useState<{
    count: number;
    sizeStr: string;
    fileName: string;
    savedToDb: number;
  } | null>(null);

  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedMapRecord, setSelectedMapRecord] = useState<Record<string, any> | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record<string, any> | null>(null);

  // Filtered rows
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((item) =>
      Object.values(item).some((val) =>
        String(val ?? "").toLowerCase().includes(q)
      )
    );
  }, [data, searchQuery]);

  // Handle Add/Edit Submit
  const handleFormSubmit = async (record: Record<string, any>) => {
    if (editingRecord) {
      // UPDATE — gunakan id dari editingRecord
      const updated = { ...record };
      delete updated.id; // jangan kirim id di body PATCH
      const res = await supabase
        .from(tableName)
        .update(updated, { id: `eq.${editingRecord.id}` });
      if (res.error) {
        alert(`Gagal update: ${res.error.message || JSON.stringify(res.error)}`);
        return;
      }
      // Update local state
      setData((prev) =>
        prev.map((item) =>
          item.id === editingRecord.id ? { ...record, id: editingRecord.id } : item
        )
      );
    } else {
      // INSERT — gunakan UUID sebagai id
      const newId = genUUID();
      const newRow = { ...record, id: newId };
      const res = await supabase.from(tableName).insert(newRow);
      if (res.error) {
        alert(`Gagal simpan: ${res.error.message || JSON.stringify(res.error)}`);
        return;
      }
      // Gunakan data yang dikembalikan server jika ada, fallback ke local
      const savedRow =
        res.data && Array.isArray(res.data) && res.data.length > 0
          ? res.data[0]
          : newRow;
      setData((prev) => [savedRow, ...prev]);
    }
  };

  // Handle Delete
  const handleDelete = async (row: Record<string, any>) => {
    const identifier = row[columns[0]] || row[columns[1]] || row.id;
    if (!window.confirm(`Yakin ingin menghapus data ${levelName} "${identifier}"?`)) return;

    const res = await supabase.from(tableName).delete({ id: `eq.${row.id}` });
    if (res.error) {
      alert(`Gagal hapus: ${res.error.message || JSON.stringify(res.error)}`);
      return;
    }
    // Hapus dari local state hanya jika berhasil di DB
    setData((prev) => prev.filter((item) => item.id !== row.id));
  };

  // Fungsi ekstraksi umum untuk mengubah GeoJSON menjadi data baris
  const extractRecordsFromGeoJson = (geojson: any): Record<string, any>[] => {
    let featureList: any[] = [];
    if (Array.isArray(geojson)) {
      geojson.forEach((layer) => {
        if (layer.features && Array.isArray(layer.features)) {
          featureList.push(...layer.features);
        }
      });
    } else if (geojson && geojson.features && Array.isArray(geojson.features)) {
      featureList = geojson.features;
    }

    if (featureList.length === 0) return [];

    return featureList.map((feat: any, idx: number) => {
      const props = feat.properties || {};
      const rec: Record<string, any> = { id: genUUID() };
      const propKeys = Object.keys(props);

      columns.forEach((col) => {
        if (props[col] !== undefined) {
          rec[col] = props[col];
        } else {
          const colClean = col.toLowerCase().replace(/_/g, "");
          const matchedKey = propKeys.find((pk) => {
            const pkClean = pk.toLowerCase().replace(/_/g, "");
            return pkClean === colClean;
          });
          rec[col] =
            matchedKey && props[matchedKey] !== undefined ? props[matchedKey] : "-";
        }
      });

      propKeys.forEach((k) => {
        if (rec[k] === undefined) rec[k] = props[k];
      });

      if (feat.geometry?.coordinates) {
        if (feat.geometry.type === "Polygon") {
          const ring = feat.geometry.coordinates[0];
          if (Array.isArray(ring)) {
            rec.coordinates = ring.map((pt: [number, number]) => [pt[1], pt[0]]);
          }
        } else if (feat.geometry.type === "MultiPolygon") {
          const firstPoly = feat.geometry.coordinates[0];
          if (Array.isArray(firstPoly) && Array.isArray(firstPoly[0])) {
            rec.coordinates = firstPoly[0].map((pt: [number, number]) => [pt[1], pt[0]]);
          }
        }
      }

      return rec;
    });
  };

  // Fallback jika parsing gagal
  const fallbackSimulation = (_sz: string) => {
    setData([]);
    setUploadProgress(0);
    setUploadStage("Gagal membaca berkas. Pastikan format SHP ZIP atau GeoJSON valid.");
    setUploadSuccess(false);
    setIsUploading(false);
  };

  // Simpan batch records ke Supabase dan kembalikan jumlah yang berhasil
  const saveBatchToSupabase = async (
    records: Record<string, any>[]
  ): Promise<number> => {
    if (records.length === 0) return 0;
    // Hapus field coordinates dari DB (terlalu besar / tidak ada kolom geometry)
    const dbRecords = records.map((r) => {
      const { coordinates, ...rest } = r;
      return rest;
    });

    // Kirim batch per 50 record untuk hindari payload terlalu besar
    const BATCH = 50;
    let saved = 0;
    for (let i = 0; i < dbRecords.length; i += BATCH) {
      const chunk = dbRecords.slice(i, i + BATCH);
      const res = await supabase.from(tableName).insert(chunk);
      if (!res.error) saved += chunk.length;
    }
    return saved;
  };

  // Handle Upload SHP/GeoJSON
  const handleUploadSubmit = () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);
    setUploadStage("Mempersiapkan pembacaan berkas spasial...");

    const sz =
      uploadedFile.size < 1024 * 1024
        ? `${(uploadedFile.size / 1024).toFixed(1)} KB`
        : `${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB`;

    const isGeoJson =
      uploadedFile.name.endsWith(".geojson") || uploadedFile.name.endsWith(".json");

    const finalize = async (parsedRecords: Record<string, any>[]) => {
      setUploadProgress(90);
      setUploadStage(`Menyimpan ${parsedRecords.length} record ke database Supabase...`);

      const savedToDb = await saveBatchToSupabase(parsedRecords);

      // Refresh dari Supabase agar id konsisten dengan yang di DB
      const freshRes = await supabase.from(tableName).select("*");
      const finalData =
        freshRes.data && Array.isArray(freshRes.data)
          ? freshRes.data
          : parsedRecords;

      setData(finalData);
      setUploadProgress(100);
      setUploadStage(
        `Selesai! ${parsedRecords.length} poligon diekstrak, ${savedToDb} tersimpan di database.`
      );
      setUploadSuccess(true);
      setImportedSummary({
        count: parsedRecords.length,
        sizeStr: sz,
        fileName: uploadedFile.name,
        savedToDb,
      });
      supabase
        .logAudit({
          action: "UPLOAD",
          table_name: tableName,
          record_id: uploadedFile.name,
          details: `Unggah ${levelName} (${uploadedFile.name}, ${sz}) — ${parsedRecords.length} poligon diekstrak, ${savedToDb} tersimpan DB`,
        })
        .catch(() => {});
      setIsUploading(false);
    };

    if (isGeoJson) {
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 60);
          setUploadProgress(pct);
          setUploadStage(`Membaca GeoJSON (${pct}%)...`);
        }
      };
      reader.onload = async (e) => {
        try {
          setUploadProgress(75);
          setUploadStage("Mengekstrak fitur geometri & memvalidasi atribut...");
          const text = e.target?.result as string;
          const json = JSON.parse(text);
          const parsedRecords = extractRecordsFromGeoJson(json);
          if (parsedRecords.length === 0) {
            throw new Error("Berkas GeoJSON tidak memuat fitur poligon spasial yang valid.");
          }
          await finalize(parsedRecords);
        } catch (err: any) {
          console.error("Gagal parse GeoJSON:", err);
          fallbackSimulation(sz);
        }
      };
      reader.onerror = () => fallbackSimulation(sz);
      reader.readAsText(uploadedFile);
    } else {
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 45);
          setUploadProgress(pct);
          setUploadStage(`Membaca arsip biner Shapefile (${pct}%)...`);
        }
      };
      reader.onload = async (e) => {
        try {
          setUploadProgress(50);
          setUploadStage("Membongkar arsip ZIP & membaca layer biner (.shp, .dbf, .prj)...");
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const shpModule: any = await import("shpjs");
          const shp = shpModule.default || shpModule;
          setUploadProgress(70);
          setUploadStage("Mengekstrak seluruh poligon geometri dan tabel dBASE (.dbf)...");
          const geojson = await shp(arrayBuffer);
          setUploadProgress(85);
          setUploadStage("Memetakan atribut kolom baku dan koordinat spasial...");
          const parsedRecords = extractRecordsFromGeoJson(geojson);
          if (parsedRecords.length === 0) {
            throw new Error("Tidak ada fitur poligon valid ditemukan di dalam berkas ZIP SHP.");
          }
          await finalize(parsedRecords);
        } catch (err: any) {
          console.error("Gagal parse SHP:", err);
          fallbackSimulation(sz);
        }
      };
      reader.onerror = () => fallbackSimulation(sz);
      reader.readAsArrayBuffer(uploadedFile);
    }
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setUploadedFile(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStage("");
    setUploadSuccess(false);
    setImportedSummary(null);
  };

  return (
    <div className="space-y-4">
      <PageMeta
        title={`${pageTitle} | Aset GIS`}
        description={`Manajemen spasial dan data atribut ${pageTitle}`}
      />
      <PageBreadcrumb pageTitle={pageTitle} />

      {/* DB Error banner */}
      {dbError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-xs text-red-700 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400">
          ⚠️ {dbError}
        </div>
      )}

      {/* Action & Filter Bar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between -mt-2">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Cari dalam data ${pageTitle.toLowerCase()}...`}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 shadow-theme-xs focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono mr-1 hidden sm:inline">
            {filteredData.length} data
          </span>

          <button
            type="button"
            onClick={() => {
              setEditingRecord(null);
              setFormModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition cursor-pointer shadow-xs"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Tambah Data</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setUploadSuccess(false);
              setUploadProgress(0);
              setShowUploadModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Unggah SHP {levelName}</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/75 dark:border-gray-800 dark:bg-gray-800/50">
                <th className="px-3 py-2.5 text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-12 text-center">
                  No
                </th>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2.5 text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider font-mono whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-center sticky right-0 bg-gray-50 dark:bg-gray-800 w-36">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-xs text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="size-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                      Memuat data dari Supabase...
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 2}
                    className="px-4 py-8 text-center text-xs text-gray-500 dark:text-gray-400"
                  >
                    Belum ada data {pageTitle}. Klik <b>Tambah Data</b> atau{" "}
                    <b>Unggah SHP {levelName}</b> untuk memasukkan poligon spasial.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition"
                  >
                    <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 text-center font-mono">
                      {idx + 1}
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col}
                        className="px-3 py-2 text-xs text-gray-800 dark:text-gray-200 whitespace-nowrap"
                      >
                        {col.toLowerCase().includes("luas") && typeof row[col] === "number"
                          ? `${row[col].toLocaleString("id-ID")} Ha`
                          : row[col] ?? "-"}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-xs text-center sticky right-0 bg-white dark:bg-gray-900 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Lihat di Peta */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMapRecord({ ...row });
                            setMapModalOpen(true);
                          }}
                          title="Lihat Poligon di Peta"
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-white shadow-2xs hover:opacity-90 transition cursor-pointer"
                          style={{ backgroundColor: strokeColor }}
                        >
                          <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                            <line x1="8" y1="2" x2="8" y2="18" />
                            <line x1="16" y1="6" x2="16" y2="22" />
                          </svg>
                          <span>Peta</span>
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRecord({ ...row });
                            setFormModalOpen(true);
                          }}
                          title="Edit Data Atribut"
                          className="rounded-md border border-gray-300 p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white transition cursor-pointer"
                        >
                          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                        </button>

                        {/* Hapus */}
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          title="Hapus Data"
                          className="rounded-md border border-red-200 p-1 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40 transition cursor-pointer"
                        >
                          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Map Modal — key berubah tiap record agar Leaflet re-mount */}
      {mapModalOpen && selectedMapRecord && (
        <BoundaryMapModal
          key={selectedMapRecord.id || JSON.stringify(selectedMapRecord).slice(0, 32)}
          isOpen={mapModalOpen}
          onClose={() => {
            setMapModalOpen(false);
            setSelectedMapRecord(null);
          }}
          title={`${pageTitle} — ${selectedMapRecord[columns[0]] || selectedMapRecord[columns[1]] || "Detail"}`}
          levelName={levelName}
          data={selectedMapRecord}
          strokeColor={strokeColor}
          strokeWeight={strokeWeight}
          dashArray={dashArray}
          fillOpacity={fillOpacity}
        />
      )}

      {/* Form Modal (Add / Edit) */}
      <BoundaryFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        columns={columns}
        initialData={editingRecord}
        levelName={levelName}
      />

      {/* Modal Unggah SHP */}
      <Dialog open={showUploadModal} onOpenChange={handleCloseUploadModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Unggah Berkas Spasial {pageTitle}</DialogTitle>
            <DialogDescription>
              Mendukung arsip ZIP (.zip) berisi shapefile (.shp, .shx, .dbf, .prj) atau berkas GeoJSON (.geojson, .json). Tanpa batasan ukuran file.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Keadaan 1: Belum Unggah */}
            {!isUploading && !uploadSuccess && (
              <>
                <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 hover:border-emerald-500 transition">
                  <input
                    type="file"
                    id={`file-upload-${tableName}`}
                    className="hidden"
                    accept=".zip,.shp,.geojson,.json,.kml,.kmz"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadedFile(e.target.files[0]);
                      }
                    }}
                  />
                  <label htmlFor={`file-upload-${tableName}`} className="flex flex-col items-center cursor-pointer">
                    <div
                      className="mb-2 size-11 rounded-full flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: strokeColor }}
                    >
                      <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                      {uploadedFile ? uploadedFile.name : "Pilih atau Seret Berkas SHP / GeoJSON ke Sini"}
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                      {uploadedFile
                        ? `Ukuran Berkas: ${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB`
                        : "Bebas batasan ukuran berkas (Mendukung file besar hingga ratusan MB)"}
                    </span>
                  </label>
                </div>

                <div className="rounded-lg bg-gray-50 p-3 text-[11px] text-gray-600 dark:bg-gray-800 dark:text-gray-300 space-y-1">
                  <div className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                    Skema Kolom Baku yang Terhubung:
                  </div>
                  <div className="font-mono text-[10.5px] text-emerald-600 dark:text-emerald-400 break-all leading-relaxed">
                    {columns.join(" • ")}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseUploadModal}
                    className="rounded-lg border border-gray-300 px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleUploadSubmit}
                    disabled={!uploadedFile}
                    className="rounded-lg bg-emerald-600 px-5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>Mulai Unggah &amp; Simpan ke Database</span>
                  </button>
                </div>
              </>
            )}

            {/* Keadaan 2: Sedang Memproses */}
            {isUploading && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      Memproses &amp; Menyimpan ke Supabase...
                    </span>
                  </div>
                  <span className="font-mono text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-200 ease-out shadow-xs"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                  <span className="truncate pr-2">{uploadStage}</span>
                  <span className="font-mono shrink-0">
                    {uploadedFile
                      ? `${((uploadedFile.size * uploadProgress) / 100 / (1024 * 1024)).toFixed(1)} / ${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB`
                      : ""}
                  </span>
                </div>
              </div>
            )}

            {/* Keadaan 3: Selesai */}
            {uploadSuccess && importedSummary && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/30 space-y-4 text-center">
                <div className="size-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                  <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    Berkas Spasial Berhasil Diimpor!
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                    <b>{importedSummary.count} poligon</b> diekstrak dari{" "}
                    <span className="font-mono font-semibold">{importedSummary.fileName}</span>{" "}
                    ({importedSummary.sizeStr}).
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                    <b>{importedSummary.savedToDb} record</b> berhasil disimpan ke database Supabase.
                  </p>
                </div>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseUploadModal}
                    className="rounded-lg bg-emerald-600 px-6 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                  >
                    Tutup &amp; Lihat Data di Tabel
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
