export type CompanyOption = "Semua" | "PT_BUM" | "BSL";
export type RegionOption = "Semua" | "REGION 1" | "REGION 2" | "REGION 3";
export type MonthOption =
  | "Semua"
  | "Jan"
  | "Feb"
  | "Mar"
  | "Apr"
  | "Mei"
  | "Jun"
  | "Jul"
  | "Ags"
  | "Sep"
  | "Okt"
  | "Nov"
  | "Des";

export type OperationalModuleOption =
  | "semua"
  | "produksi"
  | "pemupukan"
  | "semprot"
  | "pruning"
  | "pasar_pikul"
  | "jangkos";

export type QuarterOption = "Semua" | "Q1" | "Q2" | "Q3" | "Q4";

export type WeatherCondition = "cerah" | "hujan_lebat" | "badai" | "banjir";

export interface DashboardBlockItem {
  id: string;
  region: string;
  estate: string;
  afdeling: string;
  blok: string;
  warung: string;
  luasHa: number;
  realisasiHa: number;
  capaianPct: number;
  sph: number;
  kondisi: "BAPP" | "Ringan" | "Sedang" | "Berat" | "Brushing" | "Rotasi 1" | "Rotasi 2" | "Rotasi 3" | "Sudah RGM" | "Belum Semprot";
  warnaKondisi: "merah" | "merah-muda" | "kuning" | "hijau-soft" | "hijau-tua" | "biru" | "orange" | "putih";
  updatePeta: "Sinkron" | "Pembaruan" | "Tanpa Data";
  periode: string;
  tanggal: string;
  keterangan: string;
}

export interface DashboardFilterState {
  company: CompanyOption;
  region: RegionOption;
  estate: string;
  quarter: QuarterOption;
  month: MonthOption;
  year: number;
  module: OperationalModuleOption;
  weatherAlert?: WeatherCondition;
}

export interface AfdelingPerformanceItem {
  afdeling: string;
  estate: string;
  region: string;
  luasHa: number;
  realisasiHa: number;
  capaianPct: number;
  kondisi: string;
  warnaHex: string;
}

export interface RegionPerformanceItem {
  id: string;
  name: string;
  company: string;
  estates: string[];
  totalLuasHa: number;
  realisasiHa: number;
  capaianPct: number;
  kondisi: string;
  warnaHex: string;
}

export interface EstatePerformanceItem {
  id: string;
  name: string;
  company: string;
  region: string;
  totalLuasHa: number;
  realisasiHa: number;
  capaianPct: number;
  kondisi: string;
  warnaHex: string;
}

export interface BlockDecisionItem {
  id: string;
  blok: string;
  estate: string;
  afdeling: string;
  luasHa: number;
  realisasiHa: number;
  targetHa: number;
  defisitHa: number;
  capaianPct: number;
  kondisi: string;
  warnaHex: string;
  severity: "Kritis" | "Sedang" | "Normal";
  kendala: string;
  rekomendasi: string;
}

export interface DecisionMatrixResult {
  needsAttention: BlockDecisionItem[];
  maintainBlocks: BlockDecisionItem[];
  criticalCount: number;
  maintainCount: number;
  avgDefisit: number;
}
