import type { ActionLogItem, BackupItem, OperasionalRecord } from "./types";

export const DEFAULT_YEARS = ["2026", "2025", "2024"];

export const DEFAULT_REGIONS = ["REGION 1", "REGION 2", "REGION 3"];

export const DEFAULT_ESTATES_BY_REGION: Record<string, string[]> = {
  "REGION 1": ["BUM 1", "BUM 2", "BUM 4"],
  "REGION 2": ["BUM 5", "BUM 6", "BUM 7"],
  "REGION 3": ["BUM 3", "BUM 8", "BSL"],
};

export const DEFAULT_ESTATES = [
  "BUM 1",
  "BUM 2",
  "BUM 3",
  "BUM 4",
  "BUM 5",
  "BUM 6",
  "BUM 7",
  "BUM 8",
  "BSL",
];

export const DEFAULT_AFDELINGS = Array.from({ length: 35 }, (_, i) => `AFD ${i + 1}`);

export const DEFAULT_BLOCKS = [
  "A01", "A02", "A03", "A04", "A05",
  "B01", "B02", "B03", "B04", "B05",
  "C01", "C02", "C03", "C04", "C05",
  "D01", "D02", "D12",
  "E01", "E08",
  "G01", "G03",
  "BSL-01", "BSL-04",
];

export const DEFAULT_KONDISI_OPTIONS = [
  "BAPP",
  "Ringan",
  "Sedang",
  "Berat",
  "Brushing",
  "Realisasi",
  "Rencana",
  "Rotasi 1",
  "Rotasi 2",
  "Rotasi 3",
];

// ─── STANDAR WARNA & KONDISI RESMI DASHBOARD & GIS DEPARTEMEN ───────────────
export const KONDISI_COLORS_BY_AKTIVITAS: Record<string, Record<string, string>> = {
  produksi: {
    "Rencana": "#0000FF",      // Biru
    "Realisasi": "#F97316",    // Oranye
  },
  pruning: {
    "Progresif": "#008000",    // Hijau Tua
    "Ringan": "#7BF09B",       // Hijau Muda
    "BAPP": "#5B5B24",         // Kuning Zaitun BAPP
    "Sedang": "#FFFF00",       // Kuning
    "Berat": "#FF8DA1",        // Merah Muda / Pink
  },
  pasar_pikul: {
    "BAPP": "#00B050",         // Hijau Emerald
    "Ringan": "#7BF09B",       // Hijau Muda
    "Sedang": "#FFFF00",       // Kuning
    "Berat": "#FF8DA1",        // Merah Muda
    "Brushing": "#FF0000",     // Merah
  },
  pemupukan: {
    "Rotasi 1": "#86EFAC",     // Hijau Lembut
    "Rotasi 2": "#00FF80",     // Hijau Terang
    "Rotasi 3": "#0099FF",     // Biru
  },
  semprot: {
    "Belum Semprot": "#94A3B8", // Abu-abu Slate
    "Rotasi 1": "#0099FF",      // Biru
    "Rotasi 2": "#FFFF00",      // Kuning
    "Rotasi 3": "#FF9900",      // Oranye
  },
  rawat_gulma: {
    "Belum Semprot": "#94A3B8",
    "Rotasi 1": "#0099FF",
    "Rotasi 2": "#FFFF00",
    "Rotasi 3": "#FF9900",
  },
  jangkos: {
    "Aplikasi Jangkos di dalam lahan kritis": "#0020C2", // Biru Gelap
    "Aplikasi Jangkos di luar lahan kritis": "#00FF00",  // Hijau Terang
    "Rencana": "#FFFF00",                               // Kuning
    "Lahan Kritis": "#FF8DA1",                          // Merah Muda / Pink
  },
  semua: {
    "BAPP": "#15803D",
    "Ringan": "#4ADE80",
    "Sedang": "#FBBF24",
    "Berat": "#FB7185",
    "Brushing": "#EF4444",
  },
};

// ─── FILTER KONDISI DINAMIS PER AKTIVITAS (SINKRON 100% DENGAN DASHBOARD) ───
export const KONDISI_BY_AKTIVITAS: Record<string, string[]> = {
  produksi: [
    "Realisasi",
    "Rencana",
  ],
  pruning: [
    "Progresif",
    "Ringan",
    "BAPP",
    "Sedang",
    "Berat",
  ],
  pemupukan: [
    "Rotasi 3",
    "Rotasi 2",
    "Rotasi 1",
  ],
  semprot: [
    "Rotasi 3",
    "Rotasi 2",
    "Rotasi 1",
    "Belum Semprot",
  ],
  rawat_gulma: [
    "Rotasi 3",
    "Rotasi 2",
    "Rotasi 1",
    "Belum Semprot",
  ],
  pasar_pikul: [
    "BAPP",
    "Ringan",
    "Sedang",
    "Berat",
    "Brushing",
  ],
  jangkos: [
    "Aplikasi Jangkos di dalam lahan kritis",
    "Aplikasi Jangkos di luar lahan kritis",
    "Rencana",
    "Lahan Kritis",
  ],
};

export const getKondisiOptionsByAktivitas = (aktivitas?: string): string[] => {
  if (!aktivitas || aktivitas === "all") return DEFAULT_KONDISI_OPTIONS;
  const key = aktivitas.toLowerCase().trim();
  return KONDISI_BY_AKTIVITAS[key] || DEFAULT_KONDISI_OPTIONS;
};

// ─── WARNA KONDISI KARTOGRAFI RESMI (SINKRON 100% DENGAN DASHBOARD) ─────────
export const getStatusHexColor = (kondisi: string, aktivitas?: string): string => {
  const aktKey = aktivitas ? aktivitas.toLowerCase().trim() : "";
  if (aktKey && KONDISI_COLORS_BY_AKTIVITAS[aktKey]) {
    const map = KONDISI_COLORS_BY_AKTIVITAS[aktKey];
    for (const [k, hex] of Object.entries(map)) {
      if (k.toLowerCase() === kondisi.toLowerCase()) return hex;
    }
  }

  // Cross activity match
  for (const map of Object.values(KONDISI_COLORS_BY_AKTIVITAS)) {
    for (const [k, hex] of Object.entries(map)) {
      if (k.toLowerCase() === kondisi.toLowerCase()) return hex;
    }
  }

  const k = kondisi.toLowerCase();
  if (k.includes("rencana")) return "#0000FF";
  if (k.includes("realisasi")) return "#F97316";
  if (k.includes("progresif")) return "#008000";
  if (k.includes("ringan")) return "#7BF09B";
  if (k.includes("bapp")) return "#5B5B24";
  if (k.includes("sedang")) return "#FFFF00";
  if (k.includes("berat")) return "#FF8DA1";
  if (k.includes("brushing")) return "#FF0000";
  if (k.includes("dalam lahan kritis")) return "#0020C2";
  if (k.includes("luar lahan kritis")) return "#00FF00";
  if (k.includes("lahan kritis")) return "#FF8DA1";
  if (k.includes("belum")) return "#94A3B8";

  return "#0ea5e9";
};

// ─── GENERATOR POLIGON LENGKAP SATU ESTATE (RUSTGIS ESTATE CONTIGUOUS GRID) ──
export interface EstatePolygonItem {
  id: string;
  name: string;
  blok: string;
  luas_ha: number;
  kondisi: string;
  color: string;
  coords: [number, number][];
  isTargetBlok: boolean;
  keterangan?: string;
  afdeling?: string;
  estate?: string;
  tahun_tanam?: number;
}

export const getEstatePolygons = (
  estateName: string,
  targetBlok: string = "A05",
  aktivitas: string = "pruning"
): EstatePolygonItem[] => {
  const kondisiList = getKondisiOptionsByAktivitas(aktivitas);
  const rows = ["A", "B"];
  const cols = [1, 2, 3, 4, 5, 6];

  const baseLat = -1.545;
  const baseLng = 113.925;
  const blockHeight = 0.010; // ~1.1 km
  const blockWidth = 0.010;  // ~1.1 km (30 Ha standard block)

  const estatePolygons: EstatePolygonItem[] = [];

  rows.forEach((r, rIdx) => {
    cols.forEach((c, cIdx) => {
      const blockCode = `${r}0${c}`;
      const isTarget = blockCode.toUpperCase() === targetBlok.toUpperCase();

      const topLat = baseLat - rIdx * blockHeight;
      const bottomLat = topLat - blockHeight;
      const leftLng = baseLng + cIdx * blockWidth;
      const rightLng = leftLng + blockWidth;

      const polygonCoords: [number, number][] = [
        [topLat, leftLng],
        [topLat, rightLng],
        [bottomLat, rightLng],
        [bottomLat, leftLng],
      ];

      // Kondisi default bervariasi sesuai aktivitas
      let kondisi = kondisiList[0];
      if (isTarget) {
        kondisi = kondisiList[0];
      } else if (c % 3 === 0) {
        kondisi = kondisiList[1] || kondisiList[0];
      } else if (c % 2 === 0) {
        kondisi = kondisiList[2] || kondisiList[0];
      }

      estatePolygons.push({
        id: `poly-${blockCode}`,
        name: `Blok ${blockCode} (${estateName})`,
        blok: blockCode,
        luas_ha: isTarget ? 30.5 : 29.8 + (c * 0.2),
        kondisi,
        color: getStatusHexColor(kondisi, aktivitas),
        coords: polygonCoords,
        isTargetBlok: isTarget,
        estate: estateName,
        afdeling: `AFD ${((rIdx * 6 + cIdx) % 4) + 1}`,
        tahun_tanam: 2018 + (cIdx % 5),
      });
    });
  });

  return estatePolygons;
};

export const INITIAL_OPERASIONAL_RECORDS: OperasionalRecord[] = [
  {
    id: "ops-001",
    region: "REGION 1",
    estate: "BUM 1",
    afdeling: "AFD 4",
    blok: "A05",
    warung: "Warung 01",
    luas_ha: 30.5,
    realisasi_luas_ha: 30.5,
    capaian_persen: 100,
    sph: 136,
    kondisi: "BAPP",
    kontraktor: "CV Makmur Tani",
    update_peta: "Tersinkron",
    periode: "2026-02",
    tanggal: "2026-02-18",
    keterangan: "Tunas songgo dua selesai 100%, pengajuan BAPP.",
    aktivitas: "pruning",
  },
  {
    id: "ops-002",
    region: "REGION 1",
    estate: "BUM 2",
    afdeling: "AFD 6",
    blok: "B01",
    warung: "Warung 02",
    luas_ha: 28.0,
    realisasi_luas_ha: 22.4,
    capaian_persen: 80,
    sph: 140,
    kondisi: "Rotasi 1",
    kontraktor: "PT Sawit Berkah",
    update_peta: "Perlu Update",
    periode: "2026-02",
    tanggal: "2026-02-18",
    keterangan: "Semprot piringan rotasi 1 herbisida selektif.",
    aktivitas: "semprot",
  },
  {
    id: "ops-003",
    region: "REGION 2",
    estate: "BUM 5",
    afdeling: "AFD 21",
    blok: "E08",
    warung: "Warung 05",
    luas_ha: 32.0,
    realisasi_luas_ha: 28.8,
    capaian_persen: 90,
    sph: 138,
    kondisi: "Rotasi 1",
    kontraktor: "Swakelola Kebun",
    update_peta: "Tersinkron",
    periode: "2026-02",
    tanggal: "2026-02-17",
    keterangan: "Aplikasi NPK 13-6-27 dosis 2.5 kg/pokok.",
    aktivitas: "pemupukan",
  },
  {
    id: "ops-004",
    region: "REGION 3",
    estate: "BUM 3",
    afdeling: "AFD 12",
    blok: "C02",
    warung: "TPH-02",
    luas_ha: 25.0,
    realisasi_luas_ha: 25.0,
    capaian_persen: 100,
    sph: 142,
    kondisi: "BAPP",
    kontraktor: "CV Rintis Karya",
    update_peta: "Tersinkron",
    periode: "2026-02",
    tanggal: "2026-02-17",
    keterangan: "Pembersihan rintis dan perataan jalur angkong.",
    aktivitas: "pasar_pikul",
  },
  {
    id: "ops-005",
    region: "REGION 3",
    estate: "BSL",
    afdeling: "AFD 2",
    blok: "BSL-04",
    warung: "Warung 03",
    luas_ha: 20.0,
    realisasi_luas_ha: 14.0,
    capaian_persen: 70,
    sph: 132,
    kondisi: "Aplikasi Jangkos di luar lahan kritis",
    kontraktor: "PT Agro Mandiri",
    update_peta: "Perlu Update",
    periode: "2026-02",
    tanggal: "2026-02-16",
    keterangan: "Sebar jangkos 30 ton/ha pada gawangan pasir.",
    aktivitas: "jangkos",
  },
  {
    id: "ops-006",
    region: "REGION 2",
    estate: "BUM 7",
    afdeling: "AFD 29",
    blok: "G03",
    warung: "TPH-08",
    luas_ha: 28.5,
    realisasi_luas_ha: 28.5,
    capaian_persen: 100,
    sph: 136,
    kondisi: "Realisasi",
    kontraktor: "Swakelola Panen",
    update_peta: "Tersinkron",
    periode: "2026-02",
    tanggal: "2026-02-16",
    keterangan: "Panen putaran 1, tonase 42.8 ton TBS.",
    aktivitas: "produksi",
  },
  {
    id: "ops-007",
    region: "REGION 1",
    estate: "BUM 1",
    afdeling: "AFD 2",
    blok: "A02",
    warung: "Warung 01",
    luas_ha: 30.0,
    realisasi_luas_ha: 21.0,
    capaian_persen: 70,
    sph: 135,
    kondisi: "Sedang",
    kontraktor: "CV Makmur Tani",
    update_peta: "Perlu Update",
    periode: "2026-02",
    tanggal: "2026-02-15",
    keterangan: "Progres tunas songgo dua blok umur 8 tahun.",
    aktivitas: "pruning",
  },
  {
    id: "ops-008",
    region: "REGION 1",
    estate: "BUM 4",
    afdeling: "AFD 16",
    blok: "D12",
    warung: "Warung 04",
    luas_ha: 26.0,
    realisasi_luas_ha: 13.0,
    capaian_persen: 50,
    sph: 144,
    kondisi: "Belum Semprot",
    kontraktor: "PT Bina Usaha",
    update_peta: "Perlu Update",
    periode: "2026-02",
    tanggal: "2026-02-15",
    keterangan: "Pembersihan manual rintisan semak sebelum chemis.",
    aktivitas: "semprot",
  },
  {
    id: "ops-009",
    region: "REGION 1",
    estate: "BUM 2",
    afdeling: "AFD 7",
    blok: "B04",
    warung: "Warung 02",
    luas_ha: 29.0,
    realisasi_luas_ha: 29.0,
    capaian_persen: 100,
    sph: 138,
    kondisi: "Rotasi 2",
    kontraktor: "Swakelola Kebun",
    update_peta: "Tersinkron",
    periode: "2026-02",
    tanggal: "2026-02-14",
    keterangan: "Aplikasi pupuk MOP rotasi 2 selesai penuh.",
    aktivitas: "pemupukan",
  },
  {
    id: "ops-010",
    region: "REGION 1",
    estate: "BUM 3",
    afdeling: "AFD 10",
    blok: "C05",
    warung: "TPH-05",
    luas_ha: 31.0,
    realisasi_luas_ha: 24.8,
    capaian_persen: 80,
    sph: 140,
    kondisi: "Rencana",
    kontraktor: "Swakelola Panen",
    update_peta: "Tersinkron",
    periode: "2026-02",
    tanggal: "2026-02-14",
    keterangan: "Rotasi panen ke-3, angkut TBS lancar.",
    aktivitas: "produksi",
  },
];

export const INITIAL_ACTION_LOGS: ActionLogItem[] = [
  {
    id: "log-001",
    waktu: "19 Feb 2026 08:30",
    pengguna: "Ahmad Fauzi",
    aksi: "UNGGAH_SPASIAL",
    blok: "Blok A05",
    status: "Sukses",
    catatan: "Unggah shapefile polygon batas pruning A05 (30.5 Ha).",
  },
  {
    id: "log-002",
    waktu: "18 Feb 2026 16:45",
    pengguna: "Bambang Sutrisno",
    aksi: "UPDATE_PETA",
    blok: "Blok B01",
    status: "Sukses",
    catatan: "Pembaruan atribut realisasi semprot rotasi 1.",
  },
  {
    id: "log-003",
    waktu: "18 Feb 2026 14:10",
    pengguna: "Admin GIS",
    aksi: "BACKUP",
    blok: "Semua Blok",
    status: "Sukses",
    catatan: "Cadangan data operasional mingguan (10 record).",
  },
  {
    id: "log-004",
    waktu: "17 Feb 2026 11:20",
    pengguna: "Supriyadi",
    aksi: "UBAH",
    blok: "Blok E08",
    status: "Sukses",
    catatan: "Update realisasi pemupukan menjadi 28.8 Ha.",
  },
  {
    id: "log-005",
    waktu: "16 Feb 2026 09:15",
    pengguna: "Rudi Haryanto",
    aksi: "TAMBAH",
    blok: "Blok BSL-04",
    status: "Sukses",
    catatan: "Tambah data aplikasi jangkos 14.0 Ha.",
  },
];

export const INITIAL_BACKUPS: BackupItem[] = [
  {
    id: "bak-001",
    kode: "BACKUP-OPS-20260218",
    waktu: "18 Feb 2026 18:00",
    totalRecord: 10,
    ukuran: "48.2 KB",
    oleh: "Admin GIS",
    catatan: "Cadangan otomatis harian transaksi operasional.",
  },
  {
    id: "bak-002",
    kode: "BACKUP-OPS-20260211",
    waktu: "11 Feb 2026 18:00",
    totalRecord: 10,
    ukuran: "47.8 KB",
    oleh: "Admin GIS",
    catatan: "Cadangan mingguan pra-evaluasi BAPP.",
  },
];
