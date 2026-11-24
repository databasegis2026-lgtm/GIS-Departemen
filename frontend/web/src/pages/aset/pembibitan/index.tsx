import { useState, useMemo } from "react";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface NurseryBatch {
  id: string;
  batch_id: string;
  estate: string;
  afdeling: string;
  region: "REGION 1" | "REGION 2" | "REGION 3";
  tahap: "Pre-Nursery (<3 Bulan)" | "Main Nursery (3-12 Bulan)";
  varietas: string;
  produsen_benih: string;
  bulan_semai: string;
  umur_bulan: number;
  jumlah_kecambah_diterima: number;
  bibit_hidup: number;
  bibit_siap_salur: number;
  bibit_afkir_culling: number;
  culling_rate_pct: number;
  sistem_irigasi: "Sumisansui Otomatis" | "Overhead Sprinkler" | "Manual Selang";
  luas_area_ha: number;
  status: "Siap Salur ke Lapangan" | "Pemeliharaan Rutin" | "Tahap Aklimatisasi";
}

const MOCK_NURSERIES: NurseryBatch[] = [
  {
    id: "nrs-01",
    batch_id: "NRS-BUM1-2025-A1",
    estate: "BUM 1",
    afdeling: "AFD 2",
    region: "REGION 1",
    tahap: "Main Nursery (3-12 Bulan)",
    varietas: "DxP Dami Mas",
    produsen_benih: "PT Dami Mas Sejahtera",
    bulan_semai: "Januari 2025",
    umur_bulan: 11,
    jumlah_kecambah_diterima: 45000,
    bibit_hidup: 42100,
    bibit_siap_salur: 39800,
    bibit_afkir_culling: 2900,
    culling_rate_pct: 6.4,
    sistem_irigasi: "Sumisansui Otomatis",
    luas_area_ha: 3.2,
    status: "Siap Salur ke Lapangan",
  },
  {
    id: "nrs-02",
    batch_id: "NRS-BUM2-2025-B2",
    estate: "BUM 2",
    afdeling: "AFD 5",
    region: "REGION 1",
    tahap: "Main Nursery (3-12 Bulan)",
    varietas: "DxP Marihat (PPKS)",
    produsen_benih: "Pusat Penelitian Kelapa Sawit (PPKS Medan)",
    bulan_semai: "Maret 2025",
    umur_bulan: 9,
    jumlah_kecambah_diterima: 50000,
    bibit_hidup: 46800,
    bibit_siap_salur: 43500,
    bibit_afkir_culling: 3200,
    culling_rate_pct: 6.4,
    sistem_irigasi: "Sumisansui Otomatis",
    luas_area_ha: 3.8,
    status: "Siap Salur ke Lapangan",
  },
  {
    id: "nrs-03",
    batch_id: "NRS-BUM4-2025-C1",
    estate: "BUM 4",
    afdeling: "AFD 8",
    region: "REGION 1",
    tahap: "Main Nursery (3-12 Bulan)",
    varietas: "DxP Topaz 3",
    produsen_benih: "Asian Agri (Topaz)",
    bulan_semai: "Juni 2025",
    umur_bulan: 6,
    jumlah_kecambah_diterima: 60000,
    bibit_hidup: 57200,
    bibit_siap_salur: 52000,
    bibit_afkir_culling: 2800,
    culling_rate_pct: 4.7,
    sistem_irigasi: "Overhead Sprinkler",
    luas_area_ha: 4.5,
    status: "Pemeliharaan Rutin",
  },
  {
    id: "nrs-04",
    batch_id: "NRS-BUM5-2025-D1",
    estate: "BUM 5",
    afdeling: "AFD 20",
    region: "REGION 2",
    tahap: "Pre-Nursery (<3 Bulan)",
    varietas: "DxP Socfindo",
    produsen_benih: "PT Socfin Indonesia",
    bulan_semai: "November 2025",
    umur_bulan: 2,
    jumlah_kecambah_diterima: 35000,
    bibit_hidup: 33800,
    bibit_siap_salur: 0,
    bibit_afkir_culling: 1200,
    culling_rate_pct: 3.4,
    sistem_irigasi: "Sumisansui Otomatis",
    luas_area_ha: 1.2,
    status: "Tahap Aklimatisasi",
  },
  {
    id: "nrs-05",
    batch_id: "NRS-BUM6-2025-E2",
    estate: "BUM 6",
    afdeling: "AFD 25",
    region: "REGION 2",
    tahap: "Main Nursery (3-12 Bulan)",
    varietas: "DxP Dami Mas",
    produsen_benih: "PT Dami Mas Sejahtera",
    bulan_semai: "Februari 2025",
    umur_bulan: 10,
    jumlah_kecambah_diterima: 40000,
    bibit_hidup: 37400,
    bibit_siap_salur: 35100,
    bibit_afkir_culling: 2600,
    culling_rate_pct: 6.5,
    sistem_irigasi: "Sumisansui Otomatis",
    luas_area_ha: 3.0,
    status: "Siap Salur ke Lapangan",
  },
  {
    id: "nrs-06",
    batch_id: "NRS-BSL-2025-F1",
    estate: "BSL",
    afdeling: "AFD 1",
    region: "REGION 3",
    tahap: "Main Nursery (3-12 Bulan)",
    varietas: "DxP Marihat (PPKS)",
    produsen_benih: "PPKS Medan",
    bulan_semai: "April 2025",
    umur_bulan: 8,
    jumlah_kecambah_diterima: 55000,
    bibit_hidup: 51200,
    bibit_siap_salur: 48000,
    bibit_afkir_culling: 3800,
    culling_rate_pct: 6.9,
    sistem_irigasi: "Overhead Sprinkler",
    luas_area_ha: 4.2,
    status: "Siap Salur ke Lapangan",
  },
];

export default function PembibitanPage() {
  const [regionFilter, setRegionFilter] = useState<string>("Semua");
  const [estateFilter, setEstateFilter] = useState<string>("Semua");
  const [stageFilter, setStageFilter] = useState<string>("Semua");
  const [selectedBatch, setSelectedBatch] = useState<NurseryBatch | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadedShpFile, setUploadedShpFile] = useState<File | null>(null);

  const filteredBatches = useMemo(() => {
    return MOCK_NURSERIES.filter((item) => {
      if (regionFilter !== "Semua" && item.region !== regionFilter) return false;
      if (estateFilter !== "Semua" && item.estate !== estateFilter) return false;
      if (stageFilter !== "Semua" && !item.tahap.startsWith(stageFilter)) return false;
      return true;
    });
  }, [regionFilter, estateFilter, stageFilter]);

  const totalSiapSalur = filteredBatches.reduce((acc, curr) => acc + curr.bibit_siap_salur, 0);
  const totalBibitHidup = filteredBatches.reduce((acc, curr) => acc + curr.bibit_hidup, 0);
  const avgCulling = (
    filteredBatches.reduce((acc, curr) => acc + curr.culling_rate_pct, 0) / (filteredBatches.length || 1)
  ).toFixed(1);

  return (
    <>
      <PageMeta
        title="Aset Pembibitan Sawit (Nursery) | PT BUM - BSL"
        description="Monitoring spasial batch pembibitan pre-nursery dan main nursery, varietas kecambah, dan bibit siap salur"
      />

      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Pembibitan Kelapa Sawit (Nursery)" />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Bibit Hidup
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalBibitHidup.toLocaleString("id-ID")}
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Tersertifikasi</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Pre-Nursery & Main Nursery PT BUM & BSL
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Bibit Siap Salur (Ready)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalSiapSalur.toLocaleString("id-ID")}
              </span>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Siap Tanam LC</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Cukup untuk replanting / new planting ~1.900 Ha
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Rata-rata Culling (Afkir)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{avgCulling}%</span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Bagus (&lt;10%)</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Sesuai standar seleksi ketat mutu agronomi
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Varietas DxP Unggul
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">4 Varietas</span>
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">High Yield</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Dami Mas, PPKS Marihat, Topaz, Socfindo
            </p>
          </div>
        </div>

        {/* Filter and Action Header */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 flex-1">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Region
                </label>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="Semua">Semua Region</option>
                  <option value="REGION 1">REGION 1</option>
                  <option value="REGION 2">REGION 2</option>
                  <option value="REGION 3">REGION 3</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Estate
                </label>
                <select
                  value={estateFilter}
                  onChange={(e) => setEstateFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="Semua">Semua Estate</option>
                  <option value="BUM 1">BUM 1</option>
                  <option value="BUM 2">BUM 2</option>
                  <option value="BUM 4">BUM 4</option>
                  <option value="BUM 5">BUM 5</option>
                  <option value="BUM 6">BUM 6</option>
                  <option value="BSL">BSL</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Tahapan Semai
                </label>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="Semua">Semua Tahapan</option>
                  <option value="Main Nursery">Main Nursery (3-12 Bulan)</option>
                  <option value="Pre-Nursery">Pre-Nursery (&lt;3 Bulan)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end lg:self-center">
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Unggah SHP Bedengan Nursery
              </button>
            </div>
          </div>
        </div>

        {/* Nursery Batches Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Data Batch Pembibitan & Bedengan Lapangan ({filteredBatches.length} Batch Aktif)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase dark:bg-gray-800 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">Batch ID & Varietas</th>
                  <th className="px-4 py-3 font-semibold">Lokasi Nursery</th>
                  <th className="px-4 py-3 font-semibold">Tahap & Umur</th>
                  <th className="px-4 py-3 font-semibold text-right">Bibit Hidup</th>
                  <th className="px-4 py-3 font-semibold text-right">Siap Salur</th>
                  <th className="px-4 py-3 font-semibold text-right">Culling Rate</th>
                  <th className="px-4 py-3 font-semibold">Sistem Irigasi</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                {filteredBatches.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 dark:text-white">{item.varietas}</div>
                      <div className="font-mono text-[11px] text-gray-500 dark:text-gray-400">{item.batch_id}</div>
                      <div className="text-[10px] text-gray-400">{item.produsen_benih}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{item.estate} • {item.afdeling}</div>
                      <div className="text-[11px] text-gray-500">{item.region} ({item.luas_area_ha} Ha)</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{item.tahap}</div>
                      <div className="text-[11px] text-gray-500 font-medium">Umur {item.umur_bulan} Bulan ({item.bulan_semai})</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {item.bibit_hidup.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {item.bibit_siap_salur.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-gray-900 dark:text-white">{item.culling_rate_pct}%</span>
                      <div className="text-[10px] text-gray-400">{item.bibit_afkir_culling.toLocaleString("id-ID")} pkk</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                        {item.sistem_irigasi}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${item.status === "Siap Salur ke Lapangan"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : item.status === "Pemeliharaan Rutin"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                          }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedBatch(item)}
                        className="rounded border border-gray-300 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Batch Detail Modal */}
      {selectedBatch && (
        <Dialog open={!!selectedBatch} onOpenChange={() => setSelectedBatch(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{selectedBatch.batch_id} - {selectedBatch.varietas}</DialogTitle>
              <DialogDescription>
                Rincian penerimaan kecambah, tingkat hidup, dan sertifikasi benih resmi
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/40">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Produsen Sumber Benih:</span>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedBatch.produsen_benih}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Tahapan & Umur Semai:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedBatch.tahap} ({selectedBatch.umur_bulan} Bulan)</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Total Kecambah Diterima:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedBatch.jumlah_kecambah_diterima.toLocaleString("id-ID")} Butir</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Bibit Siap Tanam:</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">{selectedBatch.bibit_siap_salur.toLocaleString("id-ID")} Pokok</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Afkir (Culling) / Persen:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedBatch.bibit_afkir_culling.toLocaleString("id-ID")} Pokok ({selectedBatch.culling_rate_pct}%)
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Luas Plot Bedengan:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedBatch.luas_area_ha} Hektar</p>
                </div>
              </div>

              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Spesifikasi Sistem Irigasi:</span>
                <p className="mt-1 text-gray-600 dark:text-gray-400 leading-relaxed">
                  {selectedBatch.sistem_irigasi}: Dilengkapi pompa submersible diesel, pipa transmisi PVC 3 inch, dan selang mikro perforasi dengan debit stabil 25 mm/hari guna menjaga kadar air optimal polibag.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Upload SHP Modal */}
      {showUploadModal && (
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Unggah SHP Layout Bedengan Pembibitan</DialogTitle>
              <DialogDescription>
                Unggah poligon batas plot nursery (.zip) koordinat UTM Zona 49S
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="flex justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 dark:border-gray-700">
                <div className="text-center">
                  <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <label className="cursor-pointer font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                      Pilih berkas ZIP / SHP Bedengan
                      <input
                        type="file"
                        className="sr-only"
                        accept=".zip,.shp"
                        onChange={(e) => setUploadedShpFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                  {uploadedShpFile && (
                    <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {uploadedShpFile.name} ({(uploadedShpFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!uploadedShpFile}
                  onClick={() => {
                    alert("SHP plot bedengan nursery berhasil divalidasi.");
                    setShowUploadModal(false);
                    setUploadedShpFile(null);
                  }}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Proses & Validasi
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
