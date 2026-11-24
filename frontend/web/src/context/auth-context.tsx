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
  fullName: string;
  roleKey: RoleKey;
  roleName: string;
  staffCode?: string;
  estateScope?: string;
  regionScope?: string;
}

export const PRESET_USERS: Record<RoleKey, UserProfile> = {
  superadmin: {
    id: "usr-01",
    username: "superadmin",
    fullName: "Ari Setyo Wibowo",
    roleKey: "superadmin",
    roleName: "Superadmin GIS",
    staffCode: "A",
  },
  admin_gis: {
    id: "usr-02",
    username: "admin_bagja",
    fullName: "Bagja Arya Wiguna",
    roleKey: "admin_gis",
    roleName: "Admin GIS Studio",
    staffCode: "E",
  },
  user_estate: {
    id: "usr-03",
    username: "estate_bum1",
    fullName: "Estate Manager BUM 1",
    roleKey: "user_estate",
    roleName: "User Estate",
    estateScope: "BUM 1",
    regionScope: "R1",
  },
  admin_kebun: {
    id: "usr-04",
    username: "adminkebun_r1",
    fullName: "Admin Kebun Region 1",
    roleKey: "admin_kebun",
    roleName: "User Admin Kebun",
    regionScope: "R1",
  },
  regional_ho: {
    id: "usr-05",
    username: "koor_reg1",
    fullName: "Koordinator Region 1 HO",
    roleKey: "regional_ho",
    roleName: "User Regional HO",
    regionScope: "R1",
  },
  user_global: {
    id: "usr-06",
    username: "user_global",
    fullName: "Executive Viewer Global",
    roleKey: "user_global",
    roleName: "User Global (Read-Only)",
  },
};

interface AuthContextType {
  currentUser: UserProfile;
  switchRole: (role: RoleKey) => void;
  canEditSpatial: () => boolean;
  canAccessAudit: () => boolean;
  canManageUsers: () => boolean;
  filterByScope: <T extends { estate?: string; region?: string }>(items: T[]) => T[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("gis_active_role");
    if (saved && saved in PRESET_USERS) {
      return PRESET_USERS[saved as RoleKey];
    }
    return PRESET_USERS.superadmin;
  });

  const switchRole = (role: RoleKey) => {
    const user = PRESET_USERS[role];
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("gis_active_role", role);
    }
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
    if (currentUser.roleKey === "superadmin" || currentUser.roleKey === "admin_gis" || currentUser.roleKey === "user_global") {
      return items;
    }

    if (currentUser.roleKey === "user_estate" && currentUser.estateScope) {
      return items.filter((item) => !item.estate || item.estate === currentUser.estateScope);
    }

    if ((currentUser.roleKey === "admin_kebun" || currentUser.roleKey === "regional_ho") && currentUser.regionScope) {
      return items.filter((item) => !item.region || item.region === currentUser.regionScope);
    }

    return items;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        switchRole,
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
