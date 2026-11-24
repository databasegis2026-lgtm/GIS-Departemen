import type {
  AdminCatalogItem,
  MapTicket,
  MapTypeCatalogItem,
  WorkTypeCatalogItem,
} from "./types";

/**
 * Daftar Tim & Admin GIS Resmi
 * Kode A: Ari Setyo Wibowo (Manager GIS)
 * Kode B: Iqbal Tri Junaidy
 * Kode C: Widodo Arif Rohman
 * Kode D: Agung
 * Kode E: Bagja Arya Wiguna
 * Kode F: Reki Hamdani
 * Kode G: Agus Adi Permana
 */
export const DEFAULT_ADMINS: AdminCatalogItem[] = [
  { value_code: "A", label: "Ari Setyo Wibowo", role_title: "Manager GIS" },
  { value_code: "B", label: "Iqbal Tri Junaidy", role_title: "Admin GIS" },
  { value_code: "C", label: "Widodo Arif Rohman", role_title: "Admin GIS" },
  { value_code: "D", label: "Agung", role_title: "Admin GIS" },
  { value_code: "E", label: "Bagja Arya Wiguna", role_title: "Admin GIS" },
  { value_code: "F", label: "Reki Hamdani", role_title: "Admin GIS" },
  { value_code: "G", label: "Agus Adi Permana", role_title: "Admin GIS" },
];

/** 16 Jenis Pekerjaan Baku Kebun & Singkatan Kode */
export const DEFAULT_WORK_TYPES: WorkTypeCatalogItem[] = [
  { value_code: "PRN", label: "Pruning" },
  { value_code: "PPL", label: "Pasar Pikul" },
  { value_code: "LC", label: "Land Clearing" },
  { value_code: "KCG", label: "Kacangan" },
  { value_code: "EMP", label: "Emplasment" },
  { value_code: "INF", label: "Infrastruktur" },
  { value_code: "APJ", label: "Aplikasi Jangkos" },
  { value_code: "TA", label: "Tali Asih" },
  { value_code: "ARS", label: "Aresta" },
  { value_code: "SRT", label: "Legal/Sertifikasi" },
  { value_code: "PLS", label: "Plasma" },
  { value_code: "PKS", label: "Pabrik" },
  { value_code: "REQ", label: "Request" },
  { value_code: "PMK", label: "Pemupukan" },
  { value_code: "TNM", label: "Tanam" },
  { value_code: "SPT", label: "Semprot" },
];

/** Format Peta */
export const DEFAULT_MAP_TYPES: MapTypeCatalogItem[] = [
  { value_code: "PBLK", label: "PBLK" },
  { value_code: "PBLH", label: "PBLH" },
  { value_code: "DOK", label: "Dokumen" },
  { value_code: "BAPP", label: "BAPP" },
];

export const DEFAULT_REGIONS = ["REGION 1", "REGION 2", "REGION 3"] as const;

/**
 * Pemetaan Wilayah & Estate Resmi:
 * Region 1: BUM 1, BUM 2, BUM 4
 * Region 2: BUM 5, BUM 6, BUM 7
 * Region 3: BUM 3, BUM 8, BSL
 * Total: 10 Estate
 */
export const ESTATES_BY_REGION: Record<string, string[]> = {
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

/**
 * Pemetaan Afdeling per Estate:
 * PT BUM: 35 Afdeling (AFD 1 - AFD 35)
 * PT BSL: 10 Afdeling (AFD 1 - AFD 10)
 */
export const AFDELINGS_BY_ESTATE: Record<string, string[]> = {
  "BUM 1": ["AFD 1", "AFD 2", "AFD 3", "AFD 4"],
  "BUM 2": ["AFD 5", "AFD 6", "AFD 7", "AFD 8", "AFD 9", "AFD 10"],
  "BUM 4": ["AFD 16", "AFD 17", "AFD 18", "AFD 19"],
  "BUM 5": ["AFD 20", "AFD 21", "AFD 22", "AFD 23"],
  "BUM 6": ["AFD 24", "AFD 25", "AFD 26", "AFD 27"],
  "BUM 7": ["AFD 28", "AFD 29", "AFD 30", "AFD 31"],
  "BUM 3": ["AFD 11", "AFD 12", "AFD 13", "AFD 14", "AFD 15"],
  "BUM 8": ["AFD 32", "AFD 33", "AFD 34", "AFD 35"],
  "BSL": Array.from({ length: 10 }, (_, i) => `AFD ${i + 1}`),
};

export const getAfdelingsForEstate = (estate: string): string[] => {
  return AFDELINGS_BY_ESTATE[estate] || Array.from({ length: 4 }, (_, i) => `AFD ${i + 1}`);
};

/**
 * Aturan Penugasan Admin GIS per Region:
 * Region 1 -> Agus Adi Permana (G) / Ari Setyo Wibowo (A)
 * Region 2 -> Bagja Arya Wiguna (E) / Reki Hamdani (F)
 * Region 3 -> Iqbal Tri Junaidy (B) / Widodo Arif Rohman (C) / Agung (D)
 */
export interface AdminRegionAssignment {
  adminName: string;
  adminCode: string;
  assignedRegions: string[];
}

export const REGION_ADMIN_ASSIGNMENTS: Record<string, AdminRegionAssignment> = {
  "REGION 1": {
    adminName: "Agus Adi Permana",
    adminCode: "G",
    assignedRegions: ["REGION 1"],
  },
  "REGION 2": {
    adminName: "Bagja Arya Wiguna",
    adminCode: "E",
    assignedRegions: ["REGION 2"],
  },
  "REGION 3": {
    adminName: "Iqbal Tri Junaidy",
    adminCode: "B",
    assignedRegions: ["REGION 3"],
  },
};

export const getAdminForRegion = (region: string): AdminRegionAssignment => {
  return (
    REGION_ADMIN_ASSIGNMENTS[region] || {
      adminName: "Ari Setyo Wibowo",
      adminCode: "A",
      assignedRegions: ["REGION 1", "REGION 2", "REGION 3"],
    }
  );
};

export const getRegionForEstate = (estate: string): "REGION 1" | "REGION 2" | "REGION 3" => {
  for (const [r, estates] of Object.entries(ESTATES_BY_REGION)) {
    if (estates.includes(estate)) {
      return r as "REGION 1" | "REGION 2" | "REGION 3";
    }
  }
  return "REGION 1";
};

/** Data Tiket Request Update Peta Baku */
export const INITIAL_MAP_TICKETS: MapTicket[] = [
  {
    ticket_id: "tkt-001",
    ticket_number: "TKT-2026-02-001",
    map_number: "MAP-BUM1-A05-PRN",
    title: "Revisi Batas Pruning Blok A05",
    order_name: "Agus Adi Permana",
    assigned_admin_code: "G",
    work_type: "Pruning",
    work_type_code: "PRN",
    map_type: "PBLK",
    region: "REGION 1",
    estate: "BUM 1",
    afdeling: "AFD 4",
    block_number: "A05",
    target_date: "22 Feb 2026",
    requester_name: "Hendra Wijaya",
    requester_role: "Asisten Afd 4",
    description: "Pergeseran parit sekunder dan penyesuaian gawangan.",
    attachment_name: "sketsa_a05_pruning.pdf",
    status: "in_progress",
    progress_description: "Digitasi batas baru via citra drone.",
    created_at: "18 Feb 2026",
    updated_at: "18 Feb 2026",
  },
  {
    ticket_id: "tkt-002",
    ticket_number: "TKT-2026-02-002",
    map_number: "MAP-BUM2-B01-PMK",
    title: "Peta BAPP Pupuk Rotasi 1",
    order_name: "Ari Setyo Wibowo",
    assigned_admin_code: "A",
    work_type: "Pemupukan",
    work_type_code: "PMK",
    map_type: "BAPP",
    region: "REGION 1",
    estate: "BUM 2",
    afdeling: "AFD 6",
    block_number: "B01",
    target_date: "20 Feb 2026",
    requester_name: "Bambang Sutrisno",
    requester_role: "Mandor Rawat",
    description: "Realisasi pemupukan susulan rotasi 1 untuk BAPP.",
    attachment_name: "bapp_pupuk_bum2_b01.pdf",
    result_pdf_name: "PETA_BAPP_BUM2_B01_SELESAI.pdf",
    status: "completed",
    progress_description: "Peta BAPP selesai dicetak.",
    created_at: "17 Feb 2026",
    updated_at: "19 Feb 2026",
  },
  {
    ticket_id: "tkt-003",
    ticket_number: "TKT-2026-02-003",
    map_number: "MAP-BSL-C12-LC",
    title: "Pemetaan Land Clearing Blok C12 BSL",
    order_name: "Iqbal Tri Junaidy",
    assigned_admin_code: "B",
    work_type: "Land Clearing",
    work_type_code: "LC",
    map_type: "PBLH",
    region: "REGION 3",
    estate: "BSL",
    afdeling: "AFD 2",
    block_number: "C12",
    target_date: "28 Feb 2026",
    requester_name: "Rian Hidayat",
    requester_role: "Askep BSL",
    description: "Update progress tumbang chipping dan stacking baris.",
    attachment_name: "tracking_gps_c12_lc.kml",
    status: "submitted",
    progress_description: "Antrean verifikasi GPS koordinat.",
    created_at: "19 Feb 2026",
    updated_at: "19 Feb 2026",
  },
  {
    ticket_id: "tkt-004",
    ticket_number: "TKT-2026-02-004",
    map_number: "MAP-BUM5-D03-INF",
    title: "Perbaikan Trase Jalan Poros Blok D03",
    order_name: "Bagja Arya Wiguna",
    assigned_admin_code: "E",
    work_type: "Infrastruktur",
    work_type_code: "INF",
    map_type: "PBLK",
    region: "REGION 2",
    estate: "BUM 5",
    afdeling: "AFD 21",
    block_number: "D03",
    target_date: "24 Feb 2026",
    requester_name: "Supardi",
    requester_role: "Staff Infrastruktur",
    description: "Pemasangan gorong-gorong baru dan pelebaran badan jalan.",
    status: "revision_requested",
    progress_description: "Revisi: Titik koordinat gorong-gorong belum dicantumkan di sketsa.",
    created_at: "16 Feb 2026",
    updated_at: "18 Feb 2026",
  },
];
