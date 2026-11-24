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
