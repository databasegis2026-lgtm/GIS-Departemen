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

export interface ArestaNode {
  id: string;
  kode: string;
  nama: string;
  luas_ha: number;
  persen: number;
  level: number;
  keterangan: string;
  children?: ArestaNode[];
}

const ARESTA_TREE_DATA: ArestaNode = {
  id: "root",
  kode: "TOTAL",
  nama: "TOTAL AREAL STATEMENT KEBUN (HOLDING)",
  luas_ha: 29350.2,
  persen: 100.0,
  level: 0,
  keterangan: "Total luas izin usaha perkebunan (HGU & IUP Operasional) PT BUM & BSL",
  children: [
    {
      id: "plantable",
      kode: "1.0",
      nama: "AREAL DAPAT DITANAM (PLANTABLE)",
      luas_ha: 25260.2,
      persen: 86.1,
      level: 1,
      keterangan: "Areal budidaya produktif kelapa sawit",
      children: [
        {
          id: "planted",
          kode: "1.1",
          nama: "Planted (Tertanam)",
          luas_ha: 24570.0,
          persen: 83.7,
          level: 2,
          keterangan: "Areal bertegakan kelapa sawit siap produksi",
          children: [
            {
              id: "tm",
              kode: "1.1.1",
              nama: "Tanaman Menghasilkan (TM)",
              luas_ha: 22450.0,
              persen: 76.5,
              level: 3,
              keterangan: "Sawit umur > 3 tahun produktif menghasilkan TBS",
            },
            {
              id: "tbm",
              kode: "1.1.2",
              nama: "Tanaman Belum Menghasilkan (TBM 1, 2, 3)",
              luas_ha: 2120.0,
              persen: 7.2,
              level: 3,
              keterangan: "Sawit muda belum panen umur 1 - 3 tahun",
            },
          ],
        },
        {
          id: "unplanted",
          kode: "1.2",
          nama: "Unplanted (Belum Tertanam)",
          luas_ha: 690.2,
          persen: 2.4,
          level: 2,
          keterangan: "Lahan siap tanam atau dalam proses pembukaan",
          children: [
            {
              id: "lc",
              kode: "1.2.1",
              nama: "Land Clearing (LC In Progress)",
              luas_ha: 410.2,
              persen: 1.4,
              level: 3,
              keterangan: "Proses imas, tumbang, stacking alat berat",
            },
            {
              id: "prep",
              kode: "1.2.2",
              nama: "Persiapan Lahan / Pemancangan",
              luas_ha: 200.0,
              persen: 0.7,
              level: 3,
              keterangan: "Pemancangan titik lubang tanam & kacangan LCC",
            },
            {
              id: "nursery",
              kode: "1.2.3",
              nama: "Pembibitan (Pre & Main Nursery)",
              luas_ha: 80.0,
              persen: 0.3,
              level: 3,
              keterangan: "Plot bedengan bibit siap salur kebun",
            },
          ],
        },
      ],
    },
    {
      id: "unplantable",
      kode: "2.0",
      nama: "AREAL TIDAK DAPAT DITANAM (UNPLANTABLE)",
      luas_ha: 4090.0,
      persen: 13.9,
      level: 1,
      keterangan: "Areal non-budidaya, fasilitas fisik, dan kawasan lindung",
      children: [
        {
          id: "konservasi",
          kode: "2.1",
          nama: "Konservasi & Lingkungan",
          luas_ha: 2570.0,
          persen: 8.8,
          level: 2,
          keterangan: "Mandatori keberlanjutan ISPO/RSPO",
          children: [
            {
              id: "sempadan",
              kode: "2.1.1",
              nama: "Sempadan Sungai Riparian (50m / 100m)",
              luas_ha: 1420.0,
              persen: 4.8,
              level: 3,
              keterangan: "Perlindungan hidrologi 13 sungai utama & anak sungai",
            },
            {
              id: "hcv",
              kode: "2.1.2",
              nama: "Kawasan Nilai Konservasi Tinggi (HCV/NKT)",
              luas_ha: 1150.0,
              persen: 3.9,
              level: 3,
              keterangan: "Hutan sekunder & koridor habitat satwa dilindungi",
            },
          ],
        },
        {
          id: "infra",
          kode: "2.2",
          nama: "Infrastruktur & Bangunan",
          luas_ha: 930.0,
          persen: 3.2,
          level: 2,
          keterangan: "Sarana transportasi dan bangunan fasilitas kebun",
          children: [
            {
              id: "jalan",
              kode: "2.2.1",
              nama: "Jalan Poros (MR), Koleksi (CR) & Saluran Air",
              luas_ha: 720.0,
              persen: 2.5,
              level: 3,
              keterangan: "Buffer otomatis MR (8m), CR (6m), parit drainase",
            },
            {
              id: "emplas",
              kode: "2.2.2",
              nama: "Emplasemen, PMKS, Kantor & Bengkel Traksi",
              luas_ha: 210.0,
              persen: 0.7,
              level: 3,
              keterangan: "808 fasilitas fisik dan kolam IPAL pabrik",
            },
          ],
        },
        {
          id: "topo",
          kode: "2.3",
          nama: "Topografi Ekstrim & Hambatan Alami",
          luas_ha: 460.0,
          persen: 1.6,
          level: 2,
          keterangan: "Kondisi fisik alam yang tidak memungkinkan budidaya",
          children: [
            {
              id: "curam",
              kode: "2.3.1",
              nama: "Tebing Curam (> 25°)",
              luas_ha: 380.0,
              persen: 1.3,
              level: 3,
              keterangan: "Lereng terjal rawan longsor, wajib vegetasi alami",
            },
            {
              id: "rawa",
              kode: "2.3.2",
              nama: "Rawa Dalam (> 3m) & Area Berbatu",
              luas_ha: 80.0,
              persen: 0.3,
              level: 3,
              keterangan: "Gambut dalam tergenang abadi & singkapan batuan",
            },
          ],
        },
        {
          id: "sosial",
          kode: "2.4",
          nama: "Okupasi & Hambatan Sosial",
          luas_ha: 130.0,
          persen: 0.4,
          level: 2,
          keterangan: "Klaim masyarakat dalam proses penyelesaian",
          children: [
            {
              id: "taliasih",
              kode: "2.4.1",
              nama: "Enclave Permukiman & Belum Bebas (Tali Asih)",
              luas_ha: 130.0,
              persen: 0.4,
              level: 3,
              keterangan: "Garapan warga lokal & situs makam adat leluhur",
            },
          ],
        },
      ],
    },
  ],
};

export default function HirarkiArestaPage() {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    root: true,
    plantable: true,
    unplantable: true,
    planted: true,
    unplanted: true,
    konservasi: true,
    infra: true,
    topo: true,
    sosial: true,
  });
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadedShpFile, setUploadedShpFile] = useState<File | null>(null);

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Flatten nodes for tabular report view
  const flattenedRows = useMemo(() => {
    const rows: { node: ArestaNode; parentKode: string }[] = [];
    function traverse(node: ArestaNode, parentKode: string) {
      rows.push({ node, parentKode });
      if (node.children) {
        node.children.forEach((child) => traverse(child, node.kode));
      }
    }
    traverse(ARESTA_TREE_DATA, "");
    return rows;
  }, []);

  return (
    <>
      <PageMeta
        title="Hirarki Areal Statement (FORM 001) | PT BUM - BSL"
        description="Rekonsiliasi 4-tier klasifikasi tutupan lahan kebun resmi sesuai Formulir 001/FORM/GIS-JKO/III/2024 dan HIRARKI_UPDATE_PT_BUM.dbf"
      />

      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Hirarki Areal Statement (Form 001)" />

        {/* Header Information Box */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                FORM 001/FORM/GIS-JKO/III/2024
              </span>
              <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                Buku Induk Areal Statement & Rekonsiliasi Tutupan Spasial
              </h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Sinkronisasi data layer <code>HIRARKI_UPDATE_PT_BUM_(27-10-2025).dbf</code> (12.477 records atribut)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Unggah SHP Aresta Baru
              </button>
              <button
                type="button"
                onClick={() => alert("Mengunduh Rekap Form 001 Areal Statement (PDF Landscape Resmi)...")}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Ekspor PDF
              </button>
            </div>
          </div>
        </div>

        {/* Top-Level Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Izin Usaha (Holding)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">29.350,2 Ha</span>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">100.0%</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              8 Estate PT BUM (R1, R2, R3) + 2 Estate BSL
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              1. Areal Dapat Ditanam (Plantable)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">25.260,2 Ha</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">86.1%</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              TM: 22.450 Ha (76.5%) • TBM: 2.120 Ha • LC: 690,2 Ha
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              2. Tidak Dapat Ditanam (Unplantable)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">4.090,0 Ha</span>
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">13.9%</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Konservasi/HCV: 2.570 Ha • Infra: 930 Ha • Topo Curam: 460 Ha
            </p>
          </div>
        </div>

        {/* Tree Explorer View */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 pb-4 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Pohon Struktur Hirarki Areal Statement (4 Tingkatan)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Klik ikon folder untuk membuka atau menutup sub-kategori
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setExpandedNodes({
                    root: true,
                    plantable: true,
                    unplantable: true,
                    planted: true,
                    unplanted: true,
                    konservasi: true,
                    infra: true,
                    topo: true,
                    sosial: true,
                  })
                }
                className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Buka Semua
              </button>
              <button
                type="button"
                onClick={() => setExpandedNodes({ root: true })}
                className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Tutup Semua
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {/* Render Tree Function */}
            {(() => {
              const renderTreeNode = (node: ArestaNode) => {
                const isExpanded = !!expandedNodes[node.id];
                const hasChildren = node.children && node.children.length > 0;

                return (
                  <div key={node.id} className="text-xs">
                    <div
                      className={`flex items-center justify-between rounded-lg px-3 py-2 transition ${
                        node.level === 0
                          ? "bg-gray-100 font-bold text-gray-900 dark:bg-gray-800 dark:text-white"
                          : node.level === 1
                          ? "bg-gray-50 font-semibold text-gray-800 dark:bg-gray-800/60 dark:text-gray-200 ml-4"
                          : node.level === 2
                          ? "font-medium text-gray-700 dark:text-gray-300 ml-8 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                          : "text-gray-600 dark:text-gray-400 ml-12 hover:bg-gray-50 dark:hover:bg-gray-800/20"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={() => toggleNode(node.id)}
                            className="flex h-5 w-5 items-center justify-center rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            <svg
                              className={`h-3.5 w-3.5 transform transition-transform ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        ) : (
                          <span className="h-5 w-5 flex items-center justify-center text-gray-300">•</span>
                        )}

                        <span className="font-mono text-[11px] text-gray-400">{node.kode}</span>
                        <span className="text-xs">{node.nama}</span>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <span className="font-mono font-medium text-gray-900 dark:text-white">
                          {node.luas_ha.toLocaleString("id-ID", { minimumFractionDigits: 1 })} Ha
                        </span>
                        <span className="w-16 font-mono text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                          {node.persen.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {hasChildren && isExpanded && (
                      <div className="mt-1 space-y-1">
                        {node.children!.map((child) => renderTreeNode(child))}
                      </div>
                    )}
                  </div>
                );
              };

              return renderTreeNode(ARESTA_TREE_DATA);
            })()}
          </div>
        </div>

        {/* Tabular Form 001 Matrix */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Tabel Rekonsiliasi Baku FORM 001/FORM/GIS-JKO/III/2024
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase dark:bg-gray-800 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">Kode Standar</th>
                  <th className="px-4 py-3 font-semibold">Uraian / Klasifikasi Lahan</th>
                  <th className="px-4 py-3 font-semibold text-right">Luas (Ha)</th>
                  <th className="px-4 py-3 font-semibold text-right">% dari Total</th>
                  <th className="px-4 py-3 font-semibold">Keterangan & Dasar Validasi Topologi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                {flattenedRows.map(({ node }) => (
                  <tr
                    key={node.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                      node.level === 0 ? "bg-gray-100/70 font-bold dark:bg-gray-800/80" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 font-mono text-gray-500 dark:text-gray-400">
                      {node.kode}
                    </td>
                    <td className="px-4 py-2.5">
                      <div style={{ paddingLeft: `${node.level * 16}px` }}>
                        <span className={node.level < 2 ? "font-bold text-gray-900 dark:text-white" : ""}>
                          {node.nama}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-gray-900 dark:text-white">
                      {node.luas_ha.toLocaleString("id-ID", { minimumFractionDigits: 1 })}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-blue-600 dark:text-blue-400">
                      {node.persen.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 text-[11px]">
                      {node.keterangan}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Upload SHP Modal */}
      {showUploadModal && (
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Unggah SHP Pembaruan Areal Statement</DialogTitle>
              <DialogDescription>
                Unggah poligon klasifikasi tutupan lahan (.zip) skema atribut HIRARKI_UPDATE
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
                      Pilih berkas ZIP / SHP Aresta
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
                    alert("SHP Areal Statement berhasil divalidasi dan dihitung ulang.");
                    setShowUploadModal(false);
                    setUploadedShpFile(null);
                  }}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Proses & Rekonsiliasi
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
