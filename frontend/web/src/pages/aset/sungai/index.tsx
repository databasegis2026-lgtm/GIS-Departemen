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

export interface RiverSegment {
  id: string;
  id_sungai: string;
  nama_sungai: string;
  tipe_aliran: "Sungai Utama" | "Anak Sungai" | "Parit Alami Primer";
  estate_lintasan: string;
  region: "REGION 1" | "REGION 2" | "REGION 3";
  lebar_sungai_m: number;
  buffer_wajib_m: number;
  total_panjang_km: number;
  luas_buffer_ha: number;
  titik_jembatan_cross: number;
  debit_kategori: "Kapasitas Tinggi" | "Kapasitas Sedang" | "Musiman (Pasang-Surut)";
  status_lindung: "Kawasan Konservasi Riparian (HCV)" | "Buffer Lindung Terpancang";
}

const MOCK_RIVERS: RiverSegment[] = [];

export default function SungaiPage() {
  const [regionFilter, setRegionFilter] = useState<string>("Semua");
  const [typeFilter, setTypeFilter] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("" );
  const [selectedRiver, setSelectedRiver] = useState<RiverSegment | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadedShpFile, setUploadedShpFile] = useState<File | null>(null);

  const filteredRivers = useMemo(() => {
    return MOCK_RIVERS.filter((item) => {
      if (regionFilter !== "Semua" && item.region !== regionFilter) return false;
      if (typeFilter !== "Semua" && item.tipe_aliran !== typeFilter) return false;
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        return (
          item.nama_sungai.toLowerCase().includes(query) ||
          item.id_sungai.toLowerCase().includes(query) ||
          item.estate_lintasan.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [regionFilter, typeFilter, searchQuery]);

  const totalPanjang = filteredRivers.reduce((acc, curr) => acc + curr.total_panjang_km, 0).toFixed(1);
  const totalBufferHa = filteredRivers.reduce((acc, curr) => acc + curr.luas_buffer_ha, 0).toFixed(1);
  const totalBridges = filteredRivers.reduce((acc, curr) => acc + curr.titik_jembatan_cross, 0);

  return (
    <>
      <PageMeta
        title="Aset Sungai & Sempadan Air | PT BUM - BSL"
        description="Monitoring spasial 13 sungai utama holding, 1.394 segmen aliran, buffer sempadan 50m/100m, dan jembatan kebun"
      />

      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Jaringan Sungai & Sempadan Lindung" />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Panjang Aliran
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalPanjang} km</span>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">1.394 Segmen Master</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Lapisan <code>Admin_Sungai.dbf</code> & <code>Nama_Sungai.dbf</code>
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Luas Sempadan Lindung
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalBufferHa} Ha</span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">HCV Riparian</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Buffer 100m (Sungai Utama) & 50m (Anak Sungai)
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Jembatan & Box Culvert
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalBridges} Titik</span>
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Konektivitas MR/CR</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Akses transportasi angkut TBS ke PKS
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Kepatuhan ISPO / RSPO
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">100% Zero Spray</span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Patok Pancang Aktif</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Larangan aplikasi pupuk & kimia di zona riparian
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
                  Tipe Aliran
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="Semua">Semua Tipe</option>
                  <option value="Sungai Utama">Sungai Utama (Buffer 100m)</option>
                  <option value="Anak Sungai">Anak Sungai (Buffer 50m)</option>
                  <option value="Parit Alami Primer">Parit Alami Primer (Buffer 50m)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Cari Nama Sungai
                </label>
                <input
                  type="text"
                  placeholder="Sungai Sampit, Mentaya..."
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
                Unggah SHP Aliran Sungai
              </button>
            </div>
          </div>
        </div>

        {/* Rivers Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Data Segmen Sungai & Zona Perlindungan Sempadan ({filteredRivers.length} Entitas)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase dark:bg-gray-800 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">Kode & Nama Sungai</th>
                  <th className="px-4 py-3 font-semibold">Tipe Aliran</th>
                  <th className="px-4 py-3 font-semibold">Estate Lintasan</th>
                  <th className="px-4 py-3 font-semibold text-right">Lebar Sungai</th>
                  <th className="px-4 py-3 font-semibold text-right">Buffer Wajib</th>
                  <th className="px-4 py-3 font-semibold text-right">Panjang Aliran</th>
                  <th className="px-4 py-3 font-semibold text-right">Luas Buffer</th>
                  <th className="px-4 py-3 font-semibold text-center">Jembatan</th>
                  <th className="px-4 py-3 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                {filteredRivers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-gray-500">
                      Belum ada data segmen sungai & alur air. Silakan unggah berkas SHP <code>Sungai</code>.
                    </td>
                  </tr>
                ) : (
                  filteredRivers.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 dark:text-white">{item.nama_sungai}</div>
                      <div className="font-mono text-[11px] text-gray-500 dark:text-gray-400">{item.id_sungai}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        item.tipe_aliran === "Sungai Utama"
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                          : "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300"
                      }`}>
                        {item.tipe_aliran}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{item.estate_lintasan}</div>
                      <div className="text-[11px] text-gray-500">{item.region}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {item.lebar_sungai_m} m
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-amber-600 dark:text-amber-400">
                      {item.buffer_wajib_m} m
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.total_panjang_km} km
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {item.luas_buffer_ha} Ha
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                        {item.titik_jembatan_cross}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedRiver(item)}
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

      {/* River Detail Modal */}
      {selectedRiver && (
        <Dialog open={!!selectedRiver} onOpenChange={() => setSelectedRiver(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{selectedRiver.nama_sungai}</DialogTitle>
              <DialogDescription>
                Rincian zona perlindungan hidrologis, buffer riparian, dan aturan konservasi ISPO/RSPO
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/40">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Kode Registrasi Hidrologi:</span>
                  <p className="font-mono font-medium text-gray-900 dark:text-white">{selectedRiver.id_sungai}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Klasifikasi Aliran:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedRiver.tipe_aliran}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Lebar Sempadan Lindung:</span>
                  <p className="font-bold text-amber-600 dark:text-amber-400">{selectedRiver.buffer_wajib_m} Meter (Kiri & Kanan)</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Total Luas Area Konservasi:</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">{selectedRiver.luas_buffer_ha} Hektar</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Karakteristik Debit:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedRiver.debit_kategori}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Infrastruktur Crossing:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedRiver.titik_jembatan_cross} Jembatan / Box Culvert</p>
                </div>
              </div>

              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Ketentuan Hukum & SOP Lapangan:</span>
                <p className="mt-1 text-gray-600 dark:text-gray-400 leading-relaxed">
                  Zona sempadan sungai {selectedRiver.nama_sungai} mutlak berstatus <strong>UNPLANTABLE - HCV</strong>. Dilarang keras melakukan penanaman kelapa sawit baru, pembukaan lahan (land clearing), maupun aplikasi pestisida/herbisida dan pupuk anorganik di sepanjang koridor sempadan. Wajib dipasangi plang patok cat merah bertuliskan batas konservasi.
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
              <DialogTitle>Unggah SHP Garis Sungai & Alur Air</DialogTitle>
              <DialogDescription>
                Unggah berkas polyline sungai (.zip) dengan sistem koordinat UTM 49S
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
                      Pilih berkas ZIP / SHP Sungai
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
                    alert("SHP polyline sungai berhasil divalidasi.");
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
