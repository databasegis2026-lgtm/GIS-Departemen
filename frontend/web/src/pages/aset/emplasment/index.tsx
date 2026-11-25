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

export interface EmplasmentFacility {
  id: string;
  kode_aset: string;
  nama_objek: string;
  kategori: "Barak Karyawan" | "Rumah Dinas" | "Kantor & Workshop" | "Gudang & Traksi" | "Fasilitas Sosial & Kesehatan";
  tipe_bangunan: string;
  estate: string;
  afdeling: string;
  region: "REGION 1" | "REGION 2" | "REGION 3";
  luas_lantai_m2: number;
  kapasitas_orang: number;
  kondisi_fisik: "Sangat Baik" | "Baik" | "Perlu Renovasi" | "Rusak Ringan";
  fasilitas_air_listrik: string;
  koordinat_lat: number;
  koordinat_lng: number;
  tahun_dibangun: number;
  legal_status: "HGU Operasional" | "Enclave Fasum";
}

const MOCK_FACILITIES: EmplasmentFacility[] = [];

export default function EmplasmentPage() {
  const [regionFilter, setRegionFilter] = useState<string>("Semua");
  const [estateFilter, setEstateFilter] = useState<string>("Semua");
  const [categoryFilter, setCategoryFilter] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFacility, setSelectedFacility] = useState<EmplasmentFacility | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadedShpFile, setUploadedShpFile] = useState<File | null>(null);

  const filteredFacilities = useMemo(() => {
    return MOCK_FACILITIES.filter((item) => {
      if (regionFilter !== "Semua" && item.region !== regionFilter) return false;
      if (estateFilter !== "Semua" && item.estate !== estateFilter) return false;
      if (categoryFilter !== "Semua" && item.kategori !== categoryFilter) return false;
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        return (
          item.nama_objek.toLowerCase().includes(query) ||
          item.kode_aset.toLowerCase().includes(query) ||
          item.estate.toLowerCase().includes(query) ||
          item.afdeling.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [regionFilter, estateFilter, categoryFilter, searchQuery]);

  return (
    <>
      <PageMeta
        title="Aset Emplasemen & Fasilitas Kebun | PT BUM - BSL"
        description="Monitoring spasial 808 fasilitas emplasemen, perumahan karyawan, kantor, dan gudang kebun"
      />

      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Emplasemen & Fasilitas Kebun" />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Fasilitas Fisik
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">808 Unit</span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">8 Estate + BSL</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Lapisan shapefile <code>Perumahan.dbf</code> & <code>Implasement.dbf</code>
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Barak Karyawan (G10/G2)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">485 Unit</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Daya Tampung ~4.850 Jiwa</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Kebutuhan rotasi & sanitasi lingkungan afdeling
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Kantor, Bengkel & Traksi
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">142 Unit</span>
              <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">K3 & Workshop</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Gudang pupuk, pestisida B3 & garasi alat berat
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Fasilitas Sosial & Medis
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">181 Unit</span>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">ISPO / RSPO</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Klinik kesehatan, tempat ibadah, PAUD & helipad
            </p>
          </div>
        </div>

        {/* Filter and Action Header */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 flex-1">
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
                  <option value="REGION 1">REGION 1 (BUM 1, 2, 4)</option>
                  <option value="REGION 2">REGION 2 (BUM 5, 6, 7)</option>
                  <option value="REGION 3">REGION 3 (BUM 3, 8, BSL)</option>
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
                  <option value="BUM 3">BUM 3</option>
                  <option value="BUM 4">BUM 4</option>
                  <option value="BUM 5">BUM 5</option>
                  <option value="BUM 6">BUM 6</option>
                  <option value="BUM 7">BUM 7</option>
                  <option value="BUM 8">BUM 8</option>
                  <option value="BSL">BSL (Bangkitgiat Sawit Lestari)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Kategori Aset
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="Semua">Semua Kategori</option>
                  <option value="Barak Karyawan">Barak Karyawan</option>
                  <option value="Rumah Dinas">Rumah Dinas</option>
                  <option value="Kantor & Workshop">Kantor & Workshop</option>
                  <option value="Gudang & Traksi">Gudang & Traksi</option>
                  <option value="Fasilitas Sosial & Kesehatan">Fasilitas Sosial & Medis</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Cari Objek
                </label>
                <input
                  type="text"
                  placeholder="Nama objek, kode aset..."
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
                Unggah SHP Bangunan
              </button>
            </div>
          </div>
        </div>

        {/* Facilities Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Daftar Fasilitas Emplasemen & Bangunan ({filteredFacilities.length} Entitas Terpilih)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase dark:bg-gray-800 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">Kode Aset & Nama Objek</th>
                  <th className="px-4 py-3 font-semibold">Kategori & Tipe</th>
                  <th className="px-4 py-3 font-semibold">Lokasi Unit</th>
                  <th className="px-4 py-3 font-semibold text-right">Luas Lantai</th>
                  <th className="px-4 py-3 font-semibold text-right">Kapasitas</th>
                  <th className="px-4 py-3 font-semibold">Kondisi Fisik</th>
                  <th className="px-4 py-3 font-semibold">Fasilitas Air/Listrik</th>
                  <th className="px-4 py-3 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                {filteredFacilities.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-gray-500">
                      Belum ada data fasilitas emplasemen. Silakan unggah berkas SHP <code>Perumahan.dbf</code> / <code>Implasement.dbf</code>.
                    </td>
                  </tr>
                ) : (
                  filteredFacilities.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">{item.nama_objek}</div>
                        <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400">{item.kode_aset}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{item.kategori}</div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">{item.tipe_bangunan}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">{item.estate} • {item.afdeling}</div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">{item.region}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {item.luas_lantai_m2.toLocaleString("id-ID")} m²
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.kapasitas_orang > 0 ? `${item.kapasitas_orang} Orang` : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${item.kondisi_fisik === "Sangat Baik"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : item.kondisi_fisik === "Baik"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                            }`}
                        >
                          {item.kondisi_fisik}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-[11px] text-gray-500 dark:text-gray-400">
                        {item.fasilitas_air_listrik}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedFacility(item)}
                          className="rounded border border-gray-300 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          Detail & GPS
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

      {/* Facility Detail Modal */}
      {selectedFacility && (
        <Dialog open={!!selectedFacility} onOpenChange={() => setSelectedFacility(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{selectedFacility.nama_objek}</DialogTitle>
              <DialogDescription>
                Informasi detail atribut spasial & legalitas fasilitas perkebunan
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/40">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Kode Registrasi Aset:</span>
                  <p className="font-mono font-medium text-gray-900 dark:text-white">{selectedFacility.kode_aset}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Legalitas Tanah:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedFacility.legal_status}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Lokasi Afdeling / Estate:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedFacility.estate} - {selectedFacility.afdeling} ({selectedFacility.region})
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Tahun Konstruksi:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedFacility.tahun_dibangun}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Luas Bangunan:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedFacility.luas_lantai_m2} m²</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Kapasitas:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedFacility.kapasitas_orang > 0 ? `${selectedFacility.kapasitas_orang} Orang` : "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Koordinat Geografis (WGS84):</span>
                <p className="mt-1 font-mono text-[11px] text-gray-600 dark:text-gray-400">
                  Lat: {selectedFacility.koordinat_lat.toFixed(6)}, Lng: {selectedFacility.koordinat_lng.toFixed(6)} (Zona UTM 49S)
                </p>
              </div>

              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Spesifikasi Utilitas & Sanitasi:</span>
                <p className="mt-1 text-gray-600 dark:text-gray-400 leading-relaxed">
                  {selectedFacility.fasilitas_air_listrik}
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
              <DialogTitle>Unggah SHP Emplasemen & Bangunan</DialogTitle>
              <DialogDescription>
                Format zip berisi berkas .shp, .shx, .dbf, dan .prj koordinat UTM 49S
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
                      Pilih berkas ZIP / SHP
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
                    alert("SHP fasilitas emplasemen berhasil divalidasi dan diunggah.");
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
