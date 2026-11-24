/**
 * @file operasional-api.ts
 * @description API Client Service untuk Data Operasional & Spatial Editor.
 * Terhubung ke Express Backend (http://localhost:5000) dengan fallback otomatis ke In-Memory Mock.
 */

import type { OperasionalRecord } from "@/pages/data-operasional/types";
import { INITIAL_OPERASIONAL_RECORDS } from "@/pages/data-operasional/mock-operasional";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export interface OperasionalQueryParams {
  estate?: string;
  afdeling?: string;
  blok?: string;
  kondisi?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SplitSpatialPayload {
  blok_id: string;
  orientation: "vertical" | "horizontal";
  ratio: number;
  kondisi_a?: string;
  kondisi_b?: string;
  totalLuasHa?: number;
  baseCoords?: [number, number][];
}

export interface CutSpatialPayload {
  blok_id: string;
  area_ha: number;
  kondisi?: string;
  totalLuasHa?: number;
  baseCoords?: [number, number][];
}

export interface MergeSpatialPayload {
  blok_id: string;
  polygon_ids: string[];
  kondisi_final?: string;
  totalLuasHa?: number;
  masterCoords?: [number, number][];
}

class OperasionalApiService {
  /**
   * Mengambil daftar data operasional
   */
  async getRecords(params: OperasionalQueryParams = {}): Promise<{
    data: OperasionalRecord[];
    meta: {
      total: number;
      page: number;
      limit: number;
      summary?: { total_luas_ha: number; total_realisasi_ha: number; persen_capaian: number };
    };
  }> {
    try {
      const url = new URL(`${API_BASE_URL}/operasional/records`);
      if (params.estate) url.searchParams.set("estate", params.estate);
      if (params.afdeling) url.searchParams.set("afdeling", params.afdeling);
      if (params.blok) url.searchParams.set("blok", params.blok);
      if (params.kondisi) url.searchParams.set("kondisi", params.kondisi);
      if (params.search) url.searchParams.set("search", params.search);
      if (params.page) url.searchParams.set("page", String(params.page));
      if (params.limit) url.searchParams.set("limit", String(params.limit));

      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(2000) });
      if (!res.ok) throw new Error("Gagal mengambil data dari server");
      return await res.json();
    } catch {
      // Fallback ke local state jika server backend belum dinyalakan
      let filtered = [...INITIAL_OPERASIONAL_RECORDS];
      if (params.kondisi && params.kondisi !== "Semua") {
        filtered = filtered.filter((r) => r.kondisi.toLowerCase().includes(params.kondisi!.toLowerCase()));
      }
      return {
        data: filtered,
        meta: {
          total: filtered.length,
          page: params.page || 1,
          limit: params.limit || 10,
        },
      };
    }
  }

  /**
   * Eksekusi Split Poligon Spasial
   */
  async splitPolygon(payload: SplitSpatialPayload) {
    try {
      const res = await fetch(`${API_BASE_URL}/spatial/split`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(2000),
      });
      if (!res.ok) throw new Error("Gagal split poligon di server");
      return await res.json();
    } catch {
      // Fallback lokal kalkulasi
      const fraction = payload.ratio / 100;
      const totalHa = payload.totalLuasHa || 30;
      return {
        success: true,
        blok_id: payload.blok_id,
        operation: "split",
        result: [
          {
            id: `${payload.blok_id}-subA`,
            name: `Blok ${payload.blok_id} (Bagian A)`,
            luas_ha: Number((totalHa * fraction).toFixed(2)),
            kondisi: payload.kondisi_a || "BAPP",
          },
          {
            id: `${payload.blok_id}-subB`,
            name: `Blok ${payload.blok_id} (Bagian B)`,
            luas_ha: Number((totalHa * (1 - fraction)).toFixed(2)),
            kondisi: payload.kondisi_b || "Rotasi 1",
          },
        ],
      };
    }
  }

  /**
   * Eksekusi Cut Poligon Spasial
   */
  async cutPolygon(payload: CutSpatialPayload) {
    try {
      const res = await fetch(`${API_BASE_URL}/spatial/cut`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(2000),
      });
      if (!res.ok) throw new Error("Gagal memotong poligon di server");
      return await res.json();
    } catch {
      const totalHa = payload.totalLuasHa || 30;
      return {
        success: true,
        blok_id: payload.blok_id,
        operation: "cut",
        result: [
          {
            id: `${payload.blok_id}-main`,
            name: `Blok ${payload.blok_id} (Sisa)`,
            luas_ha: Number(Math.max(1, totalHa - payload.area_ha).toFixed(2)),
            kondisi: "BAPP",
          },
          {
            id: `${payload.blok_id}-cut-area`,
            name: `Blok ${payload.blok_id} (Spot Terpotong)`,
            luas_ha: payload.area_ha,
            kondisi: payload.kondisi || "Belum Semprot",
          },
        ],
      };
    }
  }

  /**
   * Request Ekspor Peta Kartografi PDF
   */
  async exportPdfMap(blokId: string, title?: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/spatial/export-pdf-map`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blok_id: blokId, title }),
        signal: AbortSignal.timeout(3000),
      });
      return await res.json();
    } catch {
      return {
        status: "success",
        message: "Simulasi ekspor PDF layout kartografi siap",
        document: {
          file_name: `PETA_OPERASIONAL_${blokId}_${Date.now()}.pdf`,
          paper_size: "A4_Landscape",
        },
      };
    }
  }
}

export const operasionalApi = new OperasionalApiService();
