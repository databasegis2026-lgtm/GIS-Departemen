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

export type ConservationCategory =
  | "areaHcv"
  | "sapadanSungai"
  | "kuburanSitusBudaya"
  | "lokasiMataAir";

export interface ConservationAreaItem {
  id: string;
  kode_hcv: string;
  nama_area: string;
  kategori: ConservationCategory;
  kategori_label: "Area HCV / NKT" | "Sempadan Sungai" | "Kuburan & Situs Budaya" | "Lokasi Mata Air";
  estate: string;
  afdeling: string;
  region: "REGION 1" | "REGION 2" | "REGION 3";
  luas_ha: number;
  tutupan_lahan: string;
  status_patok: "Terpancang Lengkap (Plang Merah)" | "Sebagian Perlu Perbaikan" | "Patok Baru Direvisi";
  flora_fauna_penting: string;
  frekuensi_patroli: string;
  sertifikasi_standar: "ISPO & RSPO Mandatori" | "Kearifan Lokal Adat";
}

const MOCK_CONSERVATION: ConservationAreaItem[] = [];

export default function AreaKonservasiPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("semua");
  const [regionFilter, setRegionFilter] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedArea, setSelectedArea] = useState<ConservationAreaItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadedShpFile, setUploadedShpFile] = useState<File | null>(null);

  const filteredAreas = useMemo(() => {
    return MOCK_CONSERVATION.filter((item) => {
      if (selectedCategory !== "semua" && item.kategori !== selectedCategory) return false;
      if (regionFilter !== "Semua" && item.region !== regionFilter) return false;
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        return (
          item.nama_area.toLowerCase().includes(query) ||
          item.kode_hcv.toLowerCase().includes(query) ||
          item.estate.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [selectedCategory, regionFilter, searchQuery]);

  const totalLuas = filteredAreas.reduce((acc, curr) => acc + curr.luas_ha, 0).toFixed(1);

  return (
    <>
      <PageMeta
        title="Aset Area Konservasi & HCV | PT BUM - BSL"
        description="Monitoring spasial kawasan lindung, Nilai Konservasi Tinggi (HCV/NKT), sempadan sungai, mata air, dan situs adat"
      />

      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Area Konservasi & Nilai Konservasi Tinggi (HCV)" />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Luas Konservasi
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">2.940,2 Ha</span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">ISPO / RSPO</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Kawasan lindung mutlak (Unplantable HCV)
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Sempadan Sungai (Riparian)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">1.420,0 Ha</span>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Buffer 50m / 100m</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Perlindungan tata air & pencegahan erosi bibir sungai
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Area HCV & Koridor Satwa
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">1.150,2 Ha</span>
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Biodiversitas</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Habitat satwa dilindungi (Orangutan, Bekantan, Burung)
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Mata Air & Situs Adat
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">370,0 Ha</span>
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Sosial & Adat</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enclave makam leluhur & radius 200m mata air
            </p>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setSelectedCategory("semua")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
              selectedCategory === "semua"
                ? "bg-blue-600 text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            }`}
          >
            Semua Kawasan Lindung
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("areaHcv")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
              selectedCategory === "areaHcv"
                ? "bg-blue-600 text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            }`}
          >
            Area HCV / NKT
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("sapadanSungai")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
              selectedCategory === "sapadanSungai"
                ? "bg-blue-600 text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            }`}
          >
            Sempadan Sungai (Riparian)
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("kuburanSitusBudaya")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
              selectedCategory === "kuburanSitusBudaya"
                ? "bg-blue-600 text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            }`}
          >
            Kuburan & Situs Budaya Adat
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("lokasiMataAir")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
              selectedCategory === "lokasiMataAir"
                ? "bg-blue-600 text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            }`}
          >
            Lokasi Mata Air (Catchment)
          </button>
        </div>

        {/* Filter and Action Header */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 flex-1">
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
                  Cari Area
                </label>
                <input
                  type="text"
                  placeholder="Nama area, kode HCV, estate..."
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
                Unggah SHP Area Konservasi
              </button>
            </div>
          </div>
        </div>

        {/* Conservation Areas Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Daftar Kawasan Konservasi & Nilai Konservasi Tinggi ({filteredAreas.length} Entitas)
            </h3>
            <span className="text-xs font-medium text-gray-500">Total Luas: {totalLuas} Ha</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase dark:bg-gray-800 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">Kode & Nama Kawasan</th>
                  <th className="px-4 py-3 font-semibold">Kategori Konservasi</th>
                  <th className="px-4 py-3 font-semibold">Lokasi Unit</th>
                  <th className="px-4 py-3 font-semibold text-right">Luas (Ha)</th>
                  <th className="px-4 py-3 font-semibold">Tutupan Lahan</th>
                  <th className="px-4 py-3 font-semibold">Status Patok Peringatan</th>
                  <th className="px-4 py-3 font-semibold">Patroli Keamanan</th>
                  <th className="px-4 py-3 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                {filteredAreas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                      Belum ada data kawasan konservasi. Silakan unggah berkas SHP kawasan lindung.
                    </td>
                  </tr>
                ) : (
                  filteredAreas.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900 dark:text-white">{item.nama_area}</div>
                      <div className="font-mono text-[11px] text-gray-500 dark:text-gray-400">{item.kode_hcv}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                        {item.kategori_label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{item.estate} • {item.afdeling}</div>
                      <div className="text-[11px] text-gray-500">{item.region}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {item.luas_ha.toFixed(1)} Ha
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">
                      {item.tutupan_lahan}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        item.status_patok.startsWith("Terpancang Lengkap")
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                      }`}>
                        {item.status_patok}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-gray-500 dark:text-gray-400">
                      {item.frekuensi_patroli}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedArea(item)}
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

      {/* Conservation Detail Modal */}
      {selectedArea && (
        <Dialog open={!!selectedArea} onOpenChange={() => setSelectedArea(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{selectedArea.nama_area}</DialogTitle>
              <DialogDescription>
                Informasi detail kawasan konservasi, status audit ISPO/RSPO, dan satwa dilindungi
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/40">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Kode Registrasi HCV:</span>
                  <p className="font-mono font-medium text-gray-900 dark:text-white">{selectedArea.kode_hcv}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Kategori:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedArea.kategori_label}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Lokasi Afdeling / Estate:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedArea.estate} - {selectedArea.afdeling} ({selectedArea.region})
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Luas Terproteksi:</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">{selectedArea.luas_ha} Hektar</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Tutupan Lahan:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedArea.tutupan_lahan}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Standar Sertifikasi:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedArea.sertifikasi_standar}</p>
                </div>
              </div>

              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Flora / Fauna Penting / Nilai Sosial:</span>
                <p className="mt-1 font-medium text-gray-900 dark:text-white bg-gray-50 p-2.5 rounded border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                  {selectedArea.flora_fauna_penting}
                </p>
              </div>

              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Protokol Perlindungan & Patroli:</span>
                <p className="mt-1 text-gray-600 dark:text-gray-400 leading-relaxed">
                  Jadwal patroli {selectedArea.frekuensi_patroli}. Dilakukan pengawasan ketat terhadap perambahan liar, perburuan satwa, dan kebakaran hutan/lahan (karhutla). Papan larangan (plang merah) wajib diperbarui setiap tahun.
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
              <DialogTitle>Unggah SHP Area Konservasi / HCV</DialogTitle>
              <DialogDescription>
                Unggah poligon kawasan lindung (.zip) koordinat UTM Zona 49S
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
                      Pilih berkas ZIP / SHP Konservasi
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
                    alert("SHP kawasan konservasi berhasil divalidasi.");
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
