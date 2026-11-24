import type { RekapPekerjaanRecord } from "./types";

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
  "BUM 4",
  "BUM 5",
  "BUM 6",
  "BUM 7",
  "BUM 3",
  "BUM 8",
  "BSL",
];

export const DEFAULT_AFDELINGS = Array.from({ length: 35 }, (_, i) => `AFD ${i + 1}`);

export const DEFAULT_BLOCKS = [
  "A01", "A02", "A03", "A04", "A05",
  "B01", "B02", "B03", "B04", "B05",
  "C01", "C02", "C03", "C04", "C05",
  "D01", "D02", "D03", "D04", "D05",
  "E01", "E02", "E03", "E04", "E05",
  "F01", "F02", "G01", "G02", "BSL-01", "BSL-04",
];

export const KONDISI_BY_AKTIVITAS: Record<string, string[]> = {
  pruning: ["BAPP", "Ringan", "Sedang", "Berat", "Progresif"],
  pemupukan: ["Rotasi 1", "Rotasi 2", "Rotasi 3"],
  semprot: ["Rotasi 1", "Rotasi 2", "Rotasi 3", "Belum Semprot"],
  pasar_pikul: ["BAPP", "Ringan", "Sedang", "Berat", "Brushing"],
  jangkos: ["BAPP", "Aplikasi Jangkos di lahan kritis", "Rencana"],
};

export const INITIAL_REKAP_RECORDS: RekapPekerjaanRecord[] = [];
