import React, { createContext, useContext, useState } from "react";

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
 * Direktori Kredensial 22 Akun Terdaftar
 * Sandi:
 * - Admin (Superadmin & Admin GIS): "admin12345"
 * - User (Estate, Admin Kebun, Regional HO, Global): "user12345"
 */
export const REGISTERED_USERS: UserProfile[] = [
  // 1. Superadmin (Akses Penuh Seluruh Halaman)
  {
    id: "usr-sa-01",
    username: "superadmin",
    password: "admin12345",
    fullName: "Ari Setyo Wibowo",
    title: "Manager GIS",
    roleKey: "superadmin",
    roleName: "Superadmin GIS",
    staffCode: "A",
    status: "active",
  },
  {
    id: "usr-sa-02",
    username: "ari.setyo",
    password: "admin12345",
    fullName: "Ari Setyo Wibowo",
    title: "Manager GIS",
    roleKey: "superadmin",
    roleName: "Superadmin GIS",
    staffCode: "A",
    status: "active",
  },

  // 2. Admin GIS (Hak Akses Global Tanpa Audit Aktivitas & Tambah Akun)
  {
    id: "usr-ag-01",
    username: "agus.permana",
    password: "admin12345",
    fullName: "Agus Adi Permana",
    title: "Admin GIS Studio",
    roleKey: "admin_gis",
    roleName: "Admin GIS",
    staffCode: "G",
    status: "active",
  },
  {
    id: "usr-ag-02",
    username: "bagja.wiguna",
    password: "admin12345",
    fullName: "Bagja Arya Wiguna",
    title: "Admin GIS Studio",
    roleKey: "admin_gis",
    roleName: "Admin GIS",
    staffCode: "E",
    status: "active",
  },
  {
    id: "usr-ag-03",
    username: "reki.hamdani",
    password: "admin12345",
    fullName: "Reki Hamdani",
    title: "Admin GIS Studio",
    roleKey: "admin_gis",
    roleName: "Admin GIS",
    staffCode: "F",
    status: "active",
  },
  {
    id: "usr-ag-04",
    username: "iqbal.junaidy",
    password: "admin12345",
    fullName: "Iqbal Tri Junaidy",
    title: "Admin GIS Studio",
    roleKey: "admin_gis",
    roleName: "Admin GIS",
    staffCode: "B",
    status: "active",
  },
  {
    id: "usr-ag-05",
    username: "widodo.rohman",
    password: "admin12345",
    fullName: "Widodo Arif Rohman",
    title: "Admin GIS Studio",
    roleKey: "admin_gis",
    roleName: "Admin GIS",
    staffCode: "C",
    status: "active",
  },

  // 3. User Estate (Hak Akses Hanya Pada Estate yang dikelola)
  {
    id: "usr-est-01",
    username: "estate_bum1",
    password: "user12345",
    fullName: "Estate Manager BUM 1",
    title: "Asisten Kepala BUM 1",
    roleKey: "user_estate",
    roleName: "User Estate",
    estateScope: "BUM 1",
    regionScope: "R1",
    status: "active",
  },
  {
    id: "usr-est-02",
    username: "estate_bum2",
    password: "user12345",
    fullName: "Estate Manager BUM 2",
    title: "Asisten Kepala BUM 2",
    roleKey: "user_estate",
    roleName: "User Estate",
    estateScope: "BUM 2",
    regionScope: "R1",
    status: "active",
  },
  {
    id: "usr-est-03",
    username: "estate_bum3",
    password: "user12345",
    fullName: "Estate Manager BUM 3",
    title: "Asisten Kepala BUM 3",
    roleKey: "user_estate",
    roleName: "User Estate",
    estateScope: "BUM 3",
    regionScope: "R1",
    status: "active",
  },
  {
    id: "usr-est-04",
    username: "estate_bum4",
    password: "user12345",
    fullName: "Estate Manager BUM 4",
    title: "Asisten Kepala BUM 4",
    roleKey: "user_estate",
    roleName: "User Estate",
    estateScope: "BUM 4",
    regionScope: "R2",
    status: "active",
  },
  {
    id: "usr-est-05",
    username: "estate_bum5",
    password: "user12345",
    fullName: "Estate Manager BUM 5",
    title: "Asisten Kepala BUM 5",
    roleKey: "user_estate",
    roleName: "User Estate",
    estateScope: "BUM 5",
    regionScope: "R2",
    status: "active",
  },
  {
    id: "usr-est-06",
    username: "estate_bum6",
    password: "user12345",
    fullName: "Estate Manager BUM 6",
    title: "Asisten Kepala BUM 6",
    roleKey: "user_estate",
    roleName: "User Estate",
    estateScope: "BUM 6",
    regionScope: "R2",
    status: "active",
  },
  {
    id: "usr-est-07",
    username: "estate_bum7",
    password: "user12345",
    fullName: "Estate Manager BUM 7",
    title: "Asisten Kepala BUM 7",
    roleKey: "user_estate",
    roleName: "User Estate",
    estateScope: "BUM 7",
    regionScope: "R3",
    status: "active",
  },
  {
    id: "usr-est-08",
    username: "estate_bum8",
    password: "user12345",
    fullName: "Estate Manager BUM 8",
    title: "Asisten Kepala BUM 8",
    roleKey: "user_estate",
    roleName: "User Estate",
    estateScope: "BUM 8",
    regionScope: "R3",
    status: "active",
  },
  {
    id: "usr-est-09",
    username: "estate_bsl",
    password: "user12345",
    fullName: "Estate Manager BSL",
    title: "Asisten Kepala BSL",
    roleKey: "user_estate",
    roleName: "User Estate",
    estateScope: "BSL",
    regionScope: "BSL",
    status: "active",
  },

  // 4. User Admin Kebun (Hak Akses Hanya Pada Region yang dikelola)
  {
    id: "usr-ak-01",
    username: "adminkebun_r1",
    password: "user12345",
    fullName: "Admin Kebun Region 1",
    title: "Admin Operasional Kebun R1",
    roleKey: "admin_kebun",
    roleName: "User Admin Kebun",
    regionScope: "R1",
    status: "active",
  },
  {
    id: "usr-ak-02",
    username: "adminkebun_r2",
    password: "user12345",
    fullName: "Admin Kebun Region 2",
    title: "Admin Operasional Kebun R2",
    roleKey: "admin_kebun",
    roleName: "User Admin Kebun",
    regionScope: "R2",
    status: "active",
  },
  {
    id: "usr-ak-03",
    username: "adminkebun_r3",
    password: "user12345",
    fullName: "Admin Kebun Region 3 + BSL",
    title: "Admin Operasional Kebun R3 & BSL",
    roleKey: "admin_kebun",
    roleName: "User Admin Kebun",
    regionScope: "R3 + BSL",
    status: "active",
  },

  // 5. User Regional HO (Hak Akses Hanya Pada Region yang dikelola)
  {
    id: "usr-ho-01",
    username: "koor_reg1",
    password: "user12345",
    fullName: "Koor Reg 1",
    title: "Koordinator Wilayah Region 1",
    roleKey: "regional_ho",
    roleName: "User Regional HO",
    regionScope: "R1",
    status: "active",
  },
  {
    id: "usr-ho-02",
    username: "koor_reg2",
    password: "user12345",
    fullName: "Koor Reg 2",
    title: "Koordinator Wilayah Region 2",
    roleKey: "regional_ho",
    roleName: "User Regional HO",
    regionScope: "R2",
    status: "active",
  },
  {
    id: "usr-ho-03",
    username: "koor_reg3",
    password: "user12345",
    fullName: "Koor Reg 3 + BSL",
    title: "Koordinator Wilayah Region 3 & BSL",
    roleKey: "regional_ho",
    roleName: "User Regional HO",
    regionScope: "R3 + BSL",
    status: "active",
  },

  // 6. User Global (Hak Akses GLOBAL)
  {
    id: "usr-gl-01",
    username: "user_global",
    password: "user12345",
    fullName: "Executive Viewer Global",
    title: "Direksi & BOD Viewer",
    roleKey: "user_global",
    roleName: "User Global",
    status: "active",
  },
];

// Fallback user map for backwards-compatibility
export const PRESET_USERS: Record<RoleKey, UserProfile> = {
  superadmin: REGISTERED_USERS[0],
  admin_gis: REGISTERED_USERS[2],
  user_estate: REGISTERED_USERS[7],
  admin_kebun: REGISTERED_USERS[16],
  regional_ho: REGISTERED_USERS[19],
  user_global: REGISTERED_USERS[22],
};

interface AuthContextType {
  currentUser: UserProfile;
  isAuthenticated: boolean;
  login: (username: string, password?: string) => Promise<{ success: boolean; message?: string }>;
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
      if (saved) {
        const parsed = JSON.parse(saved);
        const matched = REGISTERED_USERS.find((u) => u.username.toLowerCase() === parsed.username?.toLowerCase());
        if (matched) return matched;
      }
    } catch { }
    // Default fallback ke Superadmin jika sudah tersimpan sesi sebelumnya, atau null
    return REGISTERED_USERS[0];
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem(STORAGE_KEY_AUTH));
  });

  // Login handler
  const login = async (username: string, password = ""): Promise<{ success: boolean; message?: string }> => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    const matchedUser = REGISTERED_USERS.find(
      (u) => u.username.toLowerCase() === cleanUser
    );

    if (!matchedUser) {
      return { success: false, message: `Pengguna dengan username '${username}' tidak terdaftar.` };
    }

    if (matchedUser.status === "inactive") {
      return { success: false, message: "Akun ini telah dinonaktifkan oleh Superadmin." };
    }

    // Validasi sandi jika disertakan
    if (cleanPass && matchedUser.password && cleanPass !== matchedUser.password) {
      return { success: false, message: "Kata sandi yang Anda masukkan salah." };
    }

    // Sukses login
    setCurrentUser(matchedUser);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(matchedUser));
    localStorage.setItem(STORAGE_KEY_AUTH, `token-${matchedUser.id}-${Date.now()}`);
    localStorage.setItem("gis_username", matchedUser.username);
    return { success: true };
  };

  // Logout handler
  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEY_AUTH);
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  // Quick switch role untuk kemudahan simulasi
  const switchRole = (role: RoleKey) => {
    const user = PRESET_USERS[role];
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEY_AUTH, `token-${user.id}-${Date.now()}`);
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
