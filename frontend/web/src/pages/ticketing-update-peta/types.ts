/**
 * @file types.ts
 * @description Tipe data untuk modul Request Update Peta GIS (standar Departemen GIS PT BUM & BSL)
 */

export type TicketStatus =
  | "all"
  | "submitted"
  | "in_progress"
  | "revision_requested"
  | "completed";

export type RoleMode =
  | "superadmin"
  | "admin_gis"
  | "user_estate"
  | "admin_kebun"
  | "regional_ho"
  | "user_global";

export interface MapTicket {
  ticket_id: string;
  ticket_number: string; // e.g. "TKT-2026-02-001"
  map_number?: string; // e.g. "MAP-BUM1-A05-PRN"
  title: string;
  order_name: string; // Admin GIS yang ditugaskan (e.g. "ARI SETYO WIBOWO")
  assigned_admin_code?: string; // e.g. "A", "B", "C", "D", "E", "F", "G"
  work_type: string; // e.g. "PRUNING", "PASAR PIKUL", "LAND CLEARING", etc.
  work_type_code?: string; // e.g. "PRN", "PPL", "LC"
  map_type: "PBLK" | "PBLH" | "DOKUMEN" | "BAPP";
  region: "REGION 1" | "REGION 2" | "REGION 3";
  estate: string; // e.g. "BUM 1", "BSL"
  afdeling: string; // e.g. "AFD 4"
  block_number: string; // e.g. "A05"
  target_date: string;
  requester_name: string;
  requester_role?: string;
  description: string;
  attachment_name?: string;
  result_pdf_name?: string;
  status: "submitted" | "in_progress" | "revision_requested" | "completed";
  progress_description?: string;
  created_at: string;
  updated_at?: string;
}

export interface AdminCatalogItem {
  value_code: string;
  label: string;
  role_title?: string;
}

export interface WorkTypeCatalogItem {
  value_code: string;
  label: string;
}

export interface MapTypeCatalogItem {
  value_code: string;
  label: string;
}
