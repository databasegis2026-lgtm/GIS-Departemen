/**
 * Supabase Client & PostgREST REST API Adapter
 * Project URL: https://fgczcppoaeojaqliudol.supabase.co
 * Mendukung query PostGIS, GeoJSON, dan filter RLS tanpa ketergantungan paket eksternal
 */

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://fgczcppoaeojaqliudol.supabase.co";
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.anon";

export interface SupabaseQueryOptions {
  select?: string;
  filter?: Record<string, string>;
  limit?: number;
  offset?: number;
  order?: string;
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

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      apikey: this.anonKey,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async from<T = any>(table: string) {
    const baseUrl = `${this.url}/rest/v1/${table}`;
    const headers = this.getHeaders();

    return {
      select: async (columns = "*", filters: Record<string, string> = {}): Promise<{ data: T[] | null; error: any }> => {
        try {
          const params = new URLSearchParams();
          params.append("select", columns);
          Object.entries(filters).forEach(([key, val]) => {
            params.append(key, val);
          });

          const res = await fetch(`${baseUrl}?${params.toString()}`, {
            headers,
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

      insert: async (records: Partial<T> | Partial<T>[]): Promise<{ data: T[] | null; error: any }> => {
        try {
          const res = await fetch(baseUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(records),
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

      rpc: async (functionName: string, params: Record<string, any> = {}): Promise<{ data: any; error: any }> => {
        try {
          const res = await fetch(`${this.url}/rest/v1/rpc/${functionName}`, {
            method: "POST",
            headers,
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
