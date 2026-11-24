/**
 * @file types.ts
 * @description Tipe data untuk modul Rekap Pekerjaan Kebun (Pekerjaan Rutin & Verifikasi GIS)
 * Kolom 100% identik dengan OperasionalRecord + Bidang Verifikasi GIS
 */

export type AktivitasRutinType =
  | "all"
  | "pruning"
  | "semprot"
  | "pemupukan"
  | "pasar_pikul"
  | "jangkos";

export type StatusVerifikasiGIS =
  | "all"
  | "submitted"          // Diajukan oleh Kebun (Pending GIS)
  | "in_review"          // Sedang dicek poligon oleh Admin GIS
  | "verified"           // Disetujui & Tersinkron Peta
  | "revision_requested" // Minta revisi fisik/patok
  | "rejected";          // Ditolak

export interface RekapPekerjaanRecord {
  id: string;
  kode_rekap: string; // Misal: "RKP-202602-PRN-001"
  region: string;
  estate: string;
  afdeling: string;
  blok: string;
  warung: string;
  luas_ha: number;
  realisasi_luas_ha: number;
  capaian_persen: number;
  sph: number;
  kondisi: string;
  kontraktor: string;
  update_peta: string;
  periode: string;
  tanggal: string; // Tanggal kerja lapangan (YYYY-MM-DD)
  keterangan: string;
  aktivitas: "pruning" | "semprot" | "pemupukan" | "pasar_pikul" | "jangkos";

  // Bidang Verifikasi Spasial GIS
  status_verifikasi: "submitted" | "in_review" | "verified" | "revision_requested" | "rejected";
  luas_verifikasi_gis?: number;
  catatan_gis?: string;
  verified_by_code?: string; // Kode A - G
  verified_by_name?: string;
  tanggal_verifikasi?: string;
  peta_verifikasi_pdf?: string;
  lampiran_acuan?: string;

  // Bidang Spasial Geometri (Draf Lapangan vs Baku Resmi)
  official_polygon?: [number, number][]; // Poligon Batas Baku Resmi (dari Database Spasial Master)
  draft_polygon?: [number, number][];    // Draf Poligon Realisasi Fisik (Belum final / belum masuk DB)
  database_committed?: boolean;          // true jika sudah di-commit/approve ke database spasial utama

  // Bidang Operasional Riil Kebun (Base on Pokok vs Luas)
  realisasi_pokok?: number;              // Jumlah pokok sawit fisik yang dikerjakan kebun
  sph_blok?: number;                     // Standar Pokok per Hektar (misal 136)
  luas_estimasi_sph?: number;            // Estimasi luas dari pokok (realisasi_pokok / sph_blok)
  shp_file_name?: string;                // Nama berkas SHP/GeoJSON yang diunggah kebun
  shp_upload_date?: string;              // Waktu unggah SHP lapangan
  shp_raw_data?: any;                    // Data mentah atribut/feature SHP
}

export interface RekapStats {
  totalTargetHa: number;
  totalRealisasiHa: number;
  totalPendingVerifikasi: number;
  totalVerified: number;
  totalRevisi: number;
}
