/**
 * Supabase Client & PostgREST REST API Adapter
 * Project URL: https://fgczcppoaeojaqliudol.supabase.co
 * Mendukung query PostGIS, GeoJSON, full CRUD (SELECT, INSERT, UPDATE, DELETE),
 * Audit Logging ke `gis_audit_logs`, dan tanpa batasan ukuran file saat mengunggah SHP.
 */

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://fgczcppoaeojaqliudol.supabase.co";
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_EuNrihYHUZYJAuL_Chd3tg_CkKdi20S";

export interface SupabaseQueryOptions {
  select?: string;
  filter?: Record<string, string>;
  limit?: number;
  offset?: number;
  order?: string;
}

export interface AuditLogPayload {
  user_name?: string;
  action: "INSERT" | "UPDATE" | "DELETE" | "UPLOAD" | "VERIFY";
  table_name: string;
  record_id?: string;
  old_data?: any;
  new_data?: any;
  details?: string;
}

class SupabaseClient {
  private url: string;
  private anonKey: string;
  private token: string | null = null;

  constructor(url: string, anonKey: string) {
    this.url = url.replace(/\/$/, "");
    this.anonKey = anonKey;
  }

  setAuthToken(token: string | null) {
    this.token = token;
  }

  private getHeaders(extraHeaders: Record<string, string> = {}): HeadersInit {
    const headers: Record<string, string> = {
      apikey: this.anonKey,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...extraHeaders,
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    return headers;
  }

  /**
   * Catat aktivitas ke tabel audit log
   */
  async logAudit(payload: AuditLogPayload): Promise<{ data: any; error: any }> {
    try {
      const auditTable = `${this.url}/rest/v1/gis_audit_logs`;
      const res = await fetch(auditTable, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          user_name: payload.user_name || "GIS Specialist",
          action: payload.action,
          table_name: payload.table_name,
          record_id: payload.record_id || null,
          old_data: payload.old_data || null,
          new_data: payload.new_data || null,
          details: payload.details || "",
          created_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        return { data: null, error: err };
      }
      const data = await res.json().catch(() => ({}));
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  from<T = any>(table: string) {
    const baseUrl = `${this.url}/rest/v1/${table}`;
    const client = this;

    return {
      /**
       * SELECT query dengan filter PostgREST
       */
      select: async (
        columns = "*",
        filters: Record<string, string> = {},
        options?: { limit?: number; offset?: number; order?: string }
      ): Promise<{ data: T[] | null; error: any }> => {
        try {
          const params = new URLSearchParams();
          params.append("select", columns);
          Object.entries(filters).forEach(([key, val]) => {
            params.append(key, val);
          });
          if (options?.limit) params.append("limit", String(options.limit));
          if (options?.offset) params.append("offset", String(options.offset));
          if (options?.order) params.append("order", options.order);

          const res = await fetch(`${baseUrl}?${params.toString()}`, {
            headers: client.getHeaders(),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ message: res.statusText }));
            return { data: null, error: err };
          }

          const data = await res.json();
          return { data, error: null };
        } catch (err: any) {
          return { data: null, error: err };
        }
      },

      /**
       * INSERT / UPLOAD data (single atau bulk array)
       */
      insert: async (
        records: Partial<T> | Partial<T>[],
        auditInfo?: { user?: string; details?: string }
      ): Promise<{ data: T[] | null; error: any }> => {
        try {
          const res = await fetch(baseUrl, {
            method: "POST",
            headers: client.getHeaders(),
            body: JSON.stringify(records),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ message: res.statusText }));
            return { data: null, error: err };
          }

          const data = await res.json();

          // Otomatis audit log
          client.logAudit({
            action: Array.isArray(records) && records.length > 1 ? "UPLOAD" : "INSERT",
            table_name: table,
            new_data: data,
            user_name: auditInfo?.user,
            details: auditInfo?.details || `Insert/Upload ${Array.isArray(records) ? records.length : 1} record(s) ke ${table}`,
          }).catch(() => {});

          return { data, error: null };
        } catch (err: any) {
          return { data: null, error: err };
        }
      },

      /**
       * UPDATE data dengan filter (HTTP PATCH)
       */
      update: async (
        record: Partial<T>,
        filters: Record<string, string>,
        auditInfo?: { user?: string; details?: string }
      ): Promise<{ data: T[] | null; error: any }> => {
        try {
          const params = new URLSearchParams();
          Object.entries(filters).forEach(([key, val]) => {
            params.append(key, val);
          });

          const res = await fetch(`${baseUrl}?${params.toString()}`, {
            method: "PATCH",
            headers: client.getHeaders(),
            body: JSON.stringify(record),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ message: res.statusText }));
            return { data: null, error: err };
          }

          const data = await res.json();

          // Otomatis audit log
          client.logAudit({
            action: "UPDATE",
            table_name: table,
            new_data: data,
            user_name: auditInfo?.user,
            details: auditInfo?.details || `Update record pada tabel ${table} (filter: ${params.toString()})`,
          }).catch(() => {});

          return { data, error: null };
        } catch (err: any) {
          return { data: null, error: err };
        }
      },

      /**
       * DELETE data dengan filter (HTTP DELETE)
       */
      delete: async (
        filters: Record<string, string>,
        auditInfo?: { user?: string; details?: string }
      ): Promise<{ data: T[] | null; error: any }> => {
        try {
          const params = new URLSearchParams();
          Object.entries(filters).forEach(([key, val]) => {
            params.append(key, val);
          });

          const res = await fetch(`${baseUrl}?${params.toString()}`, {
            method: "DELETE",
            headers: client.getHeaders(),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ message: res.statusText }));
            return { data: null, error: err };
          }

          const data = await res.json();

          // Otomatis audit log
          client.logAudit({
            action: "DELETE",
            table_name: table,
            old_data: data,
            user_name: auditInfo?.user,
            details: auditInfo?.details || `Delete record dari tabel ${table} (filter: ${params.toString()})`,
          }).catch(() => {});

          return { data, error: null };
        } catch (err: any) {
          return { data: null, error: err };
        }
      },

      /**
       * Panggilan Remote Procedure Call (RPC / Database Function)
       */
      rpc: async (functionName: string, params: Record<string, any> = {}): Promise<{ data: any; error: any }> => {
        try {
          const res = await fetch(`${client.url}/rest/v1/rpc/${functionName}`, {
            method: "POST",
            headers: client.getHeaders(),
            body: JSON.stringify(params),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ message: res.statusText }));
            return { data: null, error: err };
          }

          const data = await res.json();
          return { data, error: null };
        } catch (err: any) {
          return { data: null, error: err };
        }
      },
    };
  }
}

export const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
