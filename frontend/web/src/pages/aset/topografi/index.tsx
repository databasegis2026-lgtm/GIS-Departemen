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

export interface TopographyBlock {
  id: string;
  blok: string;
  estate: string;
  afdeling: string;
  region: "REGION 1" | "REGION 2" | "REGION 3";
  luas_blok_ha: number;
  elevasi_min_m: number;
  elevasi_max_m: number;
  elevasi_rata_m: number;
  kelerengan_pct: number;
  kelas_lereng: "Datar (0° - 8°)" | "Bergelombang (8° - 25°)" | "Curam (> 25°)";
  sph_rekomendasi: number;
  rekomendasi_konservasi: string;
  panjang_teras_kontur_m: number;
  jumlah_rorak_air: number;
  status_kesesuaian_lahan: "Sesuai (S1)" | "Sesuai Bersyarat (S2)" | "Tidak Sesuai / HCV (N)";
}

const MOCK_TOPOGRAPHY: TopographyBlock[] = [];

export default function TopografiPage() {
  const [regionFilter, setRegionFilter] = useState<string>("Semua");
  const [slopeFilter, setSlopeFilter] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedBlock, setSelectedBlock] = useState<TopographyBlock | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadedShpFile, setUploadedShpFile] = useState<File | null>(null);

  const filteredBlocks = useMemo(() => {
    return MOCK_TOPOGRAPHY.filter((item) => {
      if (regionFilter !== "Semua" && item.region !== regionFilter) return false;
      if (slopeFilter !== "Semua" && !item.kelas_lereng.startsWith(slopeFilter)) return false;
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        return (
          item.blok.toLowerCase().includes(query) ||
          item.estate.toLowerCase().includes(query) ||
          item.afdeling.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [regionFilter, slopeFilter, searchQuery]);

  return (
    <>
      <PageMeta
        title="Aset Topografi & Elevasi Lahan | PT BUM - BSL"
        description="Analisis spasial kontur elevasi 1m (KONTUR_1m.dbf), kelas kelerengan 0-8°, 8-25°, >25°, teras kontur, dan standar SPH"
      />

      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Topografi & Elevasi Perkebunan" />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Lahan Datar (0° - 8°)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">18.420 Ha</span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">SPH 148 Baku</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Pola tanam lurus segitiga sama sisi 8.8m x 7.6m
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Bergelombang (8° - 25°)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">6.840 Ha</span>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">SPH 136 Kontur</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Wajib Teras Kontur bersambung lebar 3.5-4m
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Kawasan Curam (&gt; 25°)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">1.150 Ha</span>
              <span className="text-xs font-medium text-red-600 dark:text-red-400">Dilarang Ditanam</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Dialokasikan ke Kawasan Lindung HCV / Konservasi
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Garis Kontur Elevasi
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">19.625 Garis</span>
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Interval 1m</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Lapisan shapefile <code>KONTUR_1m.dbf</code>
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
                  Kelas Kelerengan
                </label>
                <select
                  value={slopeFilter}
                  onChange={(e) => setSlopeFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="Semua">Semua Kelas Kelerengan</option>
                  <option value="Datar">Datar (0° - 8° / SPH 148)</option>
                  <option value="Bergelombang">Bergelombang (8° - 25° / SPH 136)</option>
                  <option value="Curam">Curam (&gt; 25° / HCV Konservasi)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Cari Blok
                </label>
                <input
                  type="text"
                  placeholder="Kode blok A01, estate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
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
                Unggah SHP Kontur / DEM
              </button>
            </div>
          </div>
        </div>

        {/* Topography Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Data Evaluasi Kelerengan & Konservasi Lahan ({filteredBlocks.length} Blok)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase dark:bg-gray-800 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">Blok & Lokasi</th>
                  <th className="px-4 py-3 font-semibold text-right">Luas Blok</th>
                  <th className="px-4 py-3 font-semibold text-right">Elevasi (Min - Max)</th>
                  <th className="px-4 py-3 font-semibold text-right">Kelerengan</th>
                  <th className="px-4 py-3 font-semibold">Kelas Kelerengan</th>
                  <th className="px-4 py-3 font-semibold text-center">SPH Rekomendasi</th>
                  <th className="px-4 py-3 font-semibold text-right">Teras Kontur</th>
                  <th className="px-4 py-3 font-semibold">Kesesuaian Lahan</th>
                  <th className="px-4 py-3 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                {filteredBlocks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-gray-500">
                      Belum ada data topografi & elevasi blok. Silakan unggah berkas SHP <code>Kontur</code> / DEM.
                    </td>
                  </tr>
                ) : (
                  filteredBlocks.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900 dark:text-white">Blok {item.blok}</div>
                      <div className="text-[11px] text-gray-500">{item.estate} • {item.afdeling}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {item.luas_blok_ha.toFixed(1)} Ha
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-medium text-gray-900 dark:text-white">{item.elevasi_rata_m} m dpl</div>
                      <div className="text-[10px] text-gray-500">({item.elevasi_min_m} - {item.elevasi_max_m} m)</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                      {item.kelerengan_pct}%
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${item.kelas_lereng.startsWith("Datar")
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : item.kelas_lereng.startsWith("Bergelombang")
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                          : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                        }`}>
                        {item.kelas_lereng}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.sph_rekomendasi > 0 ? (
                        <span className="font-bold text-gray-900 dark:text-white">{item.sph_rekomendasi} pkk/Ha</span>
                      ) : (
                        <span className="text-[11px] font-bold text-red-600 dark:text-red-400">0 (HCV)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {item.panjang_teras_kontur_m > 0 ? `${item.panjang_teras_kontur_m.toLocaleString("id-ID")} m` : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${item.status_kesesuaian_lahan.startsWith("Sesuai (S1)")
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                        : item.status_kesesuaian_lahan.startsWith("Sesuai Bersyarat")
                          ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                          : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                        }`}>
                        {item.status_kesesuaian_lahan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedBlock(item)}
                        className="rounded border border-gray-300 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Topography Detail Modal */}
      {selectedBlock && (
        <Dialog open={!!selectedBlock} onOpenChange={() => setSelectedBlock(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Karakteristik Topografi Blok {selectedBlock.blok}</DialogTitle>
              <DialogDescription>
                Rekomendasi teknis agronomi dan konservasi mekanis lereng
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/40">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Blok & Lokasi:</span>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedBlock.blok} - {selectedBlock.estate} ({selectedBlock.afdeling})
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Klasifikasi Lereng:</span>
                  <p className="font-bold text-gray-900 dark:text-white">{selectedBlock.kelas_lereng}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Elevasi Min - Max:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedBlock.elevasi_min_m} m s.d. {selectedBlock.elevasi_max_m} m dpl (Rata-rata {selectedBlock.elevasi_rata_m} m)
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Standar Kerapatan Pokok:</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedBlock.sph_rekomendasi > 0 ? `${selectedBlock.sph_rekomendasi} Pokok / Hektar` : "Dilarang Tanam (HCV)"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Konservasi Mekanis Teras:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedBlock.panjang_teras_kontur_m > 0 ? `${selectedBlock.panjang_teras_kontur_m} Meter Teras Kontur` : "Tidak Diperlukan (Lahan Datar)"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Bangunan Rorak Resapan:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedBlock.jumlah_rorak_air} Unit Rorak</p>
                </div>
              </div>

              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Rekomendasi Agronomi & Konservasi:</span>
                <p className="mt-1 text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 p-2.5 rounded border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                  {selectedBlock.rekomendasi_konservasi}
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
              <DialogTitle>Unggah SHP Kontur / Model Elevasi Digital (DEM)</DialogTitle>
              <DialogDescription>
                Unggah berkas kontur garis (.zip) interval 1m koordinat UTM 49S
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
                      Pilih berkas ZIP / SHP Kontur
                      <input
                        type="file"
                        className="sr-only"
                        accept=".zip,.shp,.dbf,.shx,.prj,.geojson,.kml,.kmz"
                        onChange={(e) => setUploadedShpFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                  {uploadedShpFile && (
                    <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {uploadedShpFile.name} (
                      {uploadedShpFile.size < 1024 * 1024
                        ? `${(uploadedShpFile.size / 1024).toFixed(1)} KB`
                        : uploadedShpFile.size < 1024 * 1024 * 1024
                        ? `${(uploadedShpFile.size / (1024 * 1024)).toFixed(2)} MB`
                        : `${(uploadedShpFile.size / (1024 * 1024 * 1024)).toFixed(2)} GB`}
                      )
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
                    alert("SHP kontur topografi berhasil divalidasi.");
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
