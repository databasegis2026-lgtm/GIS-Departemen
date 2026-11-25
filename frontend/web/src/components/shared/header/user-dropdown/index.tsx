import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import {
  ChevronDownIcon,
  GearIcon,
  LogOutIcon,
  UserCircleIcon,
} from "@/icons";
import { cn } from "@/utils";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/context/auth-context";

export default function UserDropdown() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, logout, switchRole, canAccessAudit, canManageUsers } = useAuth();

  const handleSignOut = () => {
    logout();
    setIsOpen(false);
    void navigate("/signin");
  };

  const getRoleBadgeColor = () => {
    switch (currentUser.roleKey) {
      case "superadmin":
        return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300";
      case "admin_gis":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300";
      case "user_estate":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300";
      case "admin_kebun":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300";
      case "regional_ho":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="dropdown-toggle flex items-center text-gray-700 dark:text-gray-400 cursor-pointer">
        <span className="me-3 flex size-10 items-center justify-center rounded-xl bg-emerald-500 font-bold text-white shadow-sm dark:bg-emerald-600">
          {currentUser.fullName.charAt(0)}
        </span>

        <div className="me-2 hidden text-left sm:block">
          <span className="block text-xs font-bold text-gray-900 dark:text-white">
            {currentUser.fullName}
          </span>
          <span className="block text-[11px] text-gray-500 dark:text-gray-400">
            {currentUser.title || currentUser.roleName}
          </span>
        </div>

        <ChevronDownIcon
          className={cn(
            "size-4 text-gray-500 duration-200 dark:text-gray-400",
            isOpen ? "rotate-180" : "rotate-0",
          )}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={12} className="w-72 p-3">
        {/* Info Pengguna Aktif */}
        <div className="px-2 py-1.5">
          <div className="flex items-center justify-between">
            <span className="block text-xs font-bold text-gray-800 dark:text-white">
              {currentUser.fullName}
            </span>
            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${getRoleBadgeColor()}`}>
              {currentUser.roleName}
            </span>
          </div>
          <span className="mt-0.5 block text-[11px] text-gray-500 dark:text-gray-400">
            Username: <code className="font-mono">{currentUser.username}</code>
            {currentUser.staffCode ? ` • Kode ${currentUser.staffCode}` : ""}
            {currentUser.estateScope ? ` • ${currentUser.estateScope}` : ""}
            {currentUser.regionScope ? ` • ${currentUser.regionScope}` : ""}
          </span>
        </div>

        <DropdownMenuSeparator />

        {/* Menu Sesuai Hak Akses */}
        {canManageUsers() && (
          <DropdownMenuItem render={<Link to="/manajemen-pengguna/pengaturan-akun" onClick={() => setIsOpen(false)} />}>
            <GearIcon className="size-4" />
            <span>Kelola Akun & Hak Akses</span>
          </DropdownMenuItem>
        )}

        {canAccessAudit() && (
          <DropdownMenuItem render={<Link to="/monitoring/audit-aktivitas" onClick={() => setIsOpen(false)} />}>
            <UserCircleIcon className="size-4" />
            <span>Audit Aktivitas Pengguna</span>
          </DropdownMenuItem>
        )}

        {/* Simulasi Cepat Ganti Role untuk Demonstrasi */}
        <div className="px-2 py-2">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Pintas Simulasi Role (Testing)
          </span>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            <button
              type="button"
              onClick={() => {
                switchRole("superadmin");
                setIsOpen(false);
              }}
              className="rounded px-1.5 py-1 text-left hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              👑 Superadmin
            </button>
            <button
              type="button"
              onClick={() => {
                switchRole("admin_gis");
                setIsOpen(false);
              }}
              className="rounded px-1.5 py-1 text-left hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              🗺️ Admin GIS
            </button>
            <button
              type="button"
              onClick={() => {
                switchRole("user_estate");
                setIsOpen(false);
              }}
              className="rounded px-1.5 py-1 text-left hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              🌴 User Estate
            </button>
            <button
              type="button"
              onClick={() => {
                switchRole("admin_kebun");
                setIsOpen(false);
              }}
              className="rounded px-1.5 py-1 text-left hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              📋 Admin Kebun
            </button>
            <button
              type="button"
              onClick={() => {
                switchRole("regional_ho");
                setIsOpen(false);
              }}
              className="rounded px-1.5 py-1 text-left hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              🏢 Regional HO
            </button>
            <button
              type="button"
              onClick={() => {
                switchRole("user_global");
                setIsOpen(false);
              }}
              className="rounded px-1.5 py-1 text-left hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              🌐 User Global
            </button>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Tombol Logout Real */}
        <DropdownMenuItem
          variant="destructive"
          onClick={handleSignOut}
          className="cursor-pointer"
        >
          <LogOutIcon className="size-4" />
          <span>Keluar (Sign Out)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
