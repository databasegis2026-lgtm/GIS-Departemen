export type AktivitasType =
  | "all"
  | "pruning"
  | "semprot"
  | "pemupukan"
  | "pasar_pikul"
  | "jangkos"
  | "produksi";

export interface OperasionalRecord {
  id: string;
  company?: string;
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
  tanggal: string;
  keterangan: string;
  aktivitas: "pruning" | "semprot" | "pemupukan" | "pasar_pikul" | "jangkos" | "produksi";
  polygonCoords?: [number, number][];
  rawGeometry?: any;
  kuota_revisi?: number;
  revisi_ke?: number;
  is_locked?: boolean;
  alasan_revisi?: string;
  direvisi_oleh?: string;
  waktu_revisi?: string;
}

export interface RiwayatSpasialItem {
  id: string;
  record_id: string;
  aktivitas: string;
  company: string;
  estate: string;
  afdeling: string;
  blok: string;
  periode: string;
  coordinates_sebelum?: any;
  luas_sebelum: number;
  kondisi_sebelum: string;
  coordinates_sesudah?: any;
  luas_sesudah: number;
  kondisi_sesudah: string;
  alasan_revisi: string;
  revisi_ke: number;
  diubah_oleh: string;
  waktu_diubah: string;
}

export interface OperasionalStats {
  totalTargetHa: number;
  totalRealisasiHa: number;
  rataCapaianPersen: number;
  blokSelesaiCount: number;
  totalBlok: number;
}

export interface ActionLogItem {
  id: string;
  waktu: string;
  pengguna: string;
  aksi: "UNGGAH_SPASIAL" | "TAMBAH" | "UBAH" | "HAPUS" | "BACKUP" | "UPDATE_PETA";
  blok: string;
  status: "Sukses" | "Proses" | "Gagal";
  catatan: string;
}

export interface BackupItem {
  id: string;
  kode: string;
  waktu: string;
  totalRecord: number;
  ukuran: string;
  oleh: string;
  catatan: string;
}
