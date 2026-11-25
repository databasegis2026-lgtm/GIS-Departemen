import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import { useState, useMemo } from "react";
import AccountManagementSection from "./components/account-management-section";
import ProfileInfoSection from "./components/profile-info-section";
import SecuritySection from "./components/security-section";
import { useAuth } from "@/context/auth-context";

type SettingsTab =
  | "all"
  | "accounts"
  | "profile"
  | "security";

export default function PengaturanAkunPage() {
  const { currentUser, canManageUsers } = useAuth();

  const [userName, setUserName] = useState(() => currentUser.fullName);

  const [activeTab, setActiveTab] = useState<SettingsTab>("all");

  const handleUserNameChange = (newName: string) => {
    setUserName(newName);
    if (typeof window !== "undefined") {
      localStorage.setItem("gis_username", newName.trim());
    }
  };

  // Saring tabs berdasarkan hak akses role (Preferensi GIS & Zona Bahaya disembunyikan untuk SEMUA role)
  const tabs = useMemo(() => {
    const list: { id: SettingsTab; label: string }[] = [
      { id: "all", label: "Semua Pengaturan" },
    ];

    // Kelola & Tambah Akun HANYA untuk Superadmin
    if (canManageUsers()) {
      list.push({ id: "accounts", label: "Kelola & Tambah Akun" });
    }

    list.push({ id: "profile", label: "Data Diri & Kedinasan" });

    // Keamanan & Sandi disembunyikan untuk User Estate & Admin Kebun
    if (currentUser.roleKey !== "user_estate" && currentUser.roleKey !== "admin_kebun") {
      list.push({ id: "security", label: "Keamanan & Sandi" });
    }

    return list;
  }, [canManageUsers, currentUser.roleKey]);

  return (
    <div className="space-y-6">
      <PageMeta
        title="Pengaturan Akun | GIS Departemen"
        description="Kelola informasi akun, kredensial keamanan, manajemen pengguna, dan preferensi modul GIS Departemen"
      />

      <PageBreadcrumb pageTitle="Pengaturan Akun" />

      {/* Tabs Filter Bar (TailAdmin Native Styling) */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-white/3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${activeTab === tab.id
              ? "bg-brand-500 text-white shadow-theme-xs"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Sections */}
      <div className="space-y-6">
        {canManageUsers() && (activeTab === "all" || activeTab === "accounts") && (
          <AccountManagementSection />
        )}

        {(activeTab === "all" || activeTab === "profile") && (
          <ProfileInfoSection
            initialUserName={userName}
            onUserNameChange={handleUserNameChange}
          />
        )}

        {currentUser.roleKey !== "user_estate" &&
          currentUser.roleKey !== "admin_kebun" &&
          (activeTab === "all" || activeTab === "security") && (
            <SecuritySection />
          )}
      </div>
    </div>
  );
}
