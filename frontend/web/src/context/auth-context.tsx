import React, { createContext, useContext, useState } from "react";
import { supabase } from "@/lib/supabase";

export type RoleKey =
  | "superadmin"
  | "admin_gis"
  | "user_estate"
  | "admin_kebun"
  | "regional_ho"
  | "user_global";

export interface UserProfile {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  title: string;
  roleKey: RoleKey;
  roleName: string;
  staffCode?: string;
  estateScope?: string;
  regionScope?: string;
  status: "active" | "inactive";
}

/**
 * Direktori Kredensial Pengguna Riil
 * Default: Kosong murni (tanpa dummy). Akun dimuat secara dinamis dari database Supabase (tabel public.gis_users)
 * atau akun riil yang didaftarkan.
 */
export const REGISTERED_USERS: UserProfile[] = [];

export const EMPTY_USER: UserProfile = {
  id: "",
  username: "",
  fullName: "Tamu",
  title: "Belum Masuk",
  roleKey: "user_global",
  roleName: "Pengunjung",
  status: "active",
};

// Fallback user map for backwards-compatibility
export const PRESET_USERS: Record<RoleKey, UserProfile> = {
  superadmin: {
    id: "usr-sa",
    username: "superadmin",
    fullName: "Superadmin GIS",
    title: "Manager GIS",
    roleKey: "superadmin",
    roleName: "Superadmin GIS",
    status: "active",
  },
  admin_gis: {
    id: "usr-ag",
    username: "admin_gis",
    fullName: "Admin GIS",
    title: "Admin GIS Studio",
    roleKey: "admin_gis",
    roleName: "Admin GIS",
    status: "active",
  },
  user_estate: {
    id: "usr-est",
    username: "user_estate",
    fullName: "User Estate",
    title: "Asisten Kepala Estate",
    roleKey: "user_estate",
    roleName: "User Estate",
    status: "active",
  },
  admin_kebun: {
    id: "usr-ak",
    username: "admin_kebun",
    fullName: "User Admin Kebun",
    title: "Admin Operasional Kebun",
    roleKey: "admin_kebun",
    roleName: "User Admin Kebun",
    status: "active",
  },
  regional_ho: {
    id: "usr-ho",
    username: "regional_ho",
    fullName: "User Regional HO",
    title: "Koordinator Wilayah",
    roleKey: "regional_ho",
    roleName: "User Regional HO",
    status: "active",
  },
  user_global: {
    id: "usr-gl",
    username: "user_global",
    fullName: "User Global",
    title: "Direksi & BOD Viewer",
    roleKey: "user_global",
    roleName: "User Global",
    status: "active",
  },
};

export interface RegisterPayload {
  username: string;
  password: string;
  fullName: string;
  email?: string;
  title?: string;
  roleKey?: RoleKey;
  roleName?: string;
  staffCode?: string;
  estateScope?: string;
  regionScope?: string;
}

interface AuthContextType {
  currentUser: UserProfile;
  isAuthenticated: boolean;
  login: (username: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchRole: (role: RoleKey) => void;
  isRouteAllowed: (path: string) => boolean;
  canEditSpatial: () => boolean;
  canAccessAudit: () => boolean;
  canManageUsers: () => boolean;
  filterByScope: <T extends { estate?: string; region?: string }>(items: T[]) => T[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = "gis_logged_user";
const STORAGE_KEY_AUTH = "gis_auth_token";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      const token = localStorage.getItem(STORAGE_KEY_AUTH);
      if (saved && token) {
        return JSON.parse(saved);
      }
    } catch { }
    // Default murni kosong (belum login)
    return EMPTY_USER;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      const token = localStorage.getItem(STORAGE_KEY_AUTH);
      return Boolean(saved && token);
    } catch {
      return false;
    }
  });

  // Login handler terintegrasi dengan database Supabase riil
  const login = async (username: string, password = ""): Promise<{ success: boolean; message?: string }> => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser) {
      return { success: false, message: "Silakan masukkan username." };
    }

    // 1. Periksa ke database Supabase (tabel public.gis_users)
    try {
      const { data, error } = await supabase
        .from("gis_users")
        .select("*", { username: `eq.${cleanUser}` });

      const row = !error && Array.isArray(data) && data.length > 0 ? data[0] : null;

      if (row) {
        if (row.status === "inactive") {
          return { success: false, message: "Akun ini telah dinonaktifkan." };
        }

        if (cleanPass && row.password && cleanPass !== row.password) {
          return { success: false, message: "Kata sandi yang Anda masukkan salah." };
        }

        const profile: UserProfile = {
          id: row.id,
          username: row.username,
          fullName: row.full_name || row.username,
          title: row.title || "Staf Operasional GIS",
          roleKey: (row.role_key as RoleKey) || "superadmin",
          roleName: row.role_name || "Superadmin GIS",
          staffCode: row.staff_code,
          estateScope: row.estate_scope,
          regionScope: row.region_scope,
          status: (row.status as "active" | "inactive") || "active",
        };

        setCurrentUser(profile);
        setIsAuthenticated(true);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
        localStorage.setItem(STORAGE_KEY_AUTH, `token-${profile.id}-${Date.now()}`);
        localStorage.setItem("gis_username", profile.fullName);
        return { success: true };
      }
    } catch {
      // Jaringan atau skema belum sinkron, periksa penyimpanan lokal akun
    }

    // 2. Periksa ke akun terdaftar lokal (gis_registered_users)
    try {
      const savedUsers: UserProfile[] = JSON.parse(localStorage.getItem("gis_registered_users") || "[]");
      const matchedLocal = savedUsers.find((u) => u.username.toLowerCase() === cleanUser);
      if (matchedLocal) {
        if (matchedLocal.status === "inactive") {
          return { success: false, message: "Akun ini telah dinonaktifkan." };
        }
        if (cleanPass && matchedLocal.password && cleanPass !== matchedLocal.password) {
          return { success: false, message: "Kata sandi yang Anda masukkan salah." };
        }
        setCurrentUser(matchedLocal);
        setIsAuthenticated(true);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(matchedLocal));
        localStorage.setItem(STORAGE_KEY_AUTH, `token-${matchedLocal.id}-${Date.now()}`);
        localStorage.setItem("gis_username", matchedLocal.fullName);
        return { success: true };
      }
    } catch { }

    return {
      success: false,
      message: `Akun '${username}' tidak ditemukan di database atau kata sandi salah. Hubungi Superadmin untuk pendaftaran akun.`,
    };
  };

  // Handler Pendaftaran Akun Riil Baru ke Supabase (KHUSUS SUPERADMIN)
  const register = async (payload: RegisterPayload): Promise<{ success: boolean; message?: string }> => {
    if (!isAuthenticated || currentUser.roleKey !== "superadmin") {
      return {
        success: false,
        message: "Akses ditolak: Hanya akun dengan role Superadmin yang dapat mendaftarkan akun baru.",
      };
    }

    const cleanUser = payload.username.trim().toLowerCase();
    const cleanPass = payload.password.trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, message: "Username dan kata sandi wajib diisi." };
    }

    const roleIdMap: Record<RoleKey, number> = {
      superadmin: 1,
      admin_gis: 2,
      user_estate: 3,
      admin_kebun: 4,
      regional_ho: 5,
      user_global: 6,
    };

    const roleKey = payload.roleKey || "user_global";
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      username: cleanUser,
      password: cleanPass,
      fullName: payload.fullName.trim() || cleanUser,
      title: payload.title || "Staf Operasional GIS",
      roleKey,
      roleName: payload.roleName || PRESET_USERS[roleKey]?.roleName || "User Global",
      staffCode: payload.staffCode,
      estateScope: payload.estateScope,
      regionScope: payload.regionScope,
      status: "active",
    };

    // 1. Simpan ke database Supabase (tabel public.gis_users)
    try {
      const { error } = await supabase.from("gis_users").insert(
        [
          {
            id: newUser.id,
            username: newUser.username,
            password: newUser.password,
            full_name: newUser.fullName,
            title: newUser.title,
            role_id: roleIdMap[roleKey] || 6,
            role_key: newUser.roleKey,
            role_name: newUser.roleName,
            staff_code: newUser.staffCode || null,
            estate_scope: newUser.estateScope || null,
            region_scope: newUser.regionScope || null,
            created_by: currentUser.id || null,
            status: newUser.status,
          },
        ],
        {
          user: currentUser.fullName,
          details: `Superadmin mendaftarkan akun baru: ${newUser.username} (${newUser.roleName})`,
        }
      );

      if (error) {
        return {
          success: false,
          message: error.message || "Gagal menyimpan akun ke database Supabase.",
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || "Gagal terhubung ke database Supabase.",
      };
    }

    // 2. Simpan ke cadangan lokal
    try {
      const savedUsers: UserProfile[] = JSON.parse(localStorage.getItem("gis_registered_users") || "[]");
      savedUsers.push(newUser);
      localStorage.setItem("gis_registered_users", JSON.stringify(savedUsers));
    } catch { }

    return { success: true };
  };

  // Logout handler
  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(EMPTY_USER);
    localStorage.removeItem(STORAGE_KEY_AUTH);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem("gis_username");
  };

  // Quick switch role untuk kemudahan simulasi
  const switchRole = (role: RoleKey) => {
    const user = PRESET_USERS[role];
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEY_AUTH, `token-${user.id}-${Date.now()}`);
      localStorage.setItem("gis_username", user.fullName);
    }
  };

  /**
   * Logika Role-Based Access Control (RBAC)
   * Menyaring halaman & menu yang dilarang sesuai spesifikasi ketat
   */
  const isRouteAllowed = (path: string): boolean => {
    const p = path.toLowerCase();

    // 1. Preferensi GIS & Zona Bahaya disembunyikan untuk SEMUA role
    if (p.includes("preferensi") || p.includes("zona-bahaya")) {
      return false;
    }

    // 2. Audit Aktivitas & Tambah/Kelola Akun HANYA untuk Superadmin
    if (currentUser.roleKey !== "superadmin") {
      if (p.includes("audit-aktivitas") || p.includes("audit")) {
        return false;
      }
      if (p.includes("manajemen-pengguna") || p.includes("tambah-akun")) {
        return false;
      }
    }

    // 3. User Estate: Sangat Terbatas (Hanya Dashboard & Ticketing Unitnya)
    if (currentUser.roleKey === "user_estate") {
      if (
        p.startsWith("/rekap-pekerjaan") ||
        p.startsWith("/data-operasional") ||
        p.startsWith("/pembukaan-lahan") ||
        p.startsWith("/aset") ||
        p.startsWith("/edit-peta-spasial") ||
        p.includes("keamanan-sandi") ||
        p.includes("pengaturan-akun")
      ) {
        return false;
      }
    }

    // 4. User Admin Kebun: Dilarang Audit, Kelola Akun, Keamanan Sandi
    if (currentUser.roleKey === "admin_kebun") {
      if (p.includes("keamanan-sandi") || p.includes("pengaturan-akun")) {
        return false;
      }
    }

    return true;
  };

  const canEditSpatial = () => {
    return currentUser.roleKey === "superadmin" || currentUser.roleKey === "admin_gis";
  };

  const canAccessAudit = () => {
    return currentUser.roleKey === "superadmin";
  };

  const canManageUsers = () => {
    return currentUser.roleKey === "superadmin";
  };

  const filterByScope = <T extends { estate?: string; region?: string }>(items: T[]): T[] => {
    if (
      currentUser.roleKey === "superadmin" ||
      currentUser.roleKey === "admin_gis" ||
      currentUser.roleKey === "user_global"
    ) {
      return items;
    }

    if (currentUser.roleKey === "user_estate" && currentUser.estateScope) {
      return items.filter((item) => !item.estate || item.estate.toLowerCase() === currentUser.estateScope?.toLowerCase());
    }

    if ((currentUser.roleKey === "admin_kebun" || currentUser.roleKey === "regional_ho") && currentUser.regionScope) {
      const scope = currentUser.regionScope.toLowerCase();
      return items.filter((item) => {
        if (!item.region) return true;
        const reg = item.region.toLowerCase();
        if (scope.includes("r3") && (reg.includes("r3") || reg.includes("bsl"))) return true;
        return reg === scope;
      });
    }

    return items;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        login,
        register,
        logout,
        switchRole,
        isRouteAllowed,
        canEditSpatial,
        canAccessAudit,
        canManageUsers,
        filterByScope,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
