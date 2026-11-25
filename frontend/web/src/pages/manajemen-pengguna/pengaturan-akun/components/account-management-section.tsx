import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircleIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { useState } from "react";
import AddAccountModal, {
  type NewAccountFormData,
} from "./add-account-modal";

import { REGISTERED_USERS } from "@/context/auth-context";

export interface AccountItem {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: string;
  company: string;
  estate: string;
  phone: string;
  status: "active" | "inactive";
  joinedDate: string;
}

const initialAccountsData: AccountItem[] = REGISTERED_USERS.map((u, idx) => ({
  id: u.id,
  fullName: u.fullName,
  username: u.username,
  email: `${u.username}@bum-sawit.co.id`,
  role: u.roleName,
  company: u.estateScope === "BSL" ? "PT BSL" : "PT BUM",
  estate: u.estateScope ? `Estate ${u.estateScope}` : u.regionScope ? `Wilayah ${u.regionScope}` : "Kantor Pusat GIS",
  phone: `+62 811-${String(idx + 1).padStart(2, "0")}00-${String(idx + 1).padStart(4, "0")}`,
  status: u.status,
  joinedDate: "01 Jan 2026",
}));

export default function AccountManagementSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [accounts, setAccounts] = useState<AccountItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gis_accounts_list_v2");
      if (saved) {
        try {
          return JSON.parse(saved) as AccountItem[];
        } catch {
          // ignore
        }
      }
    }
    return initialAccountsData;
  });

  const saveAccounts = (newAccounts: AccountItem[]) => {
    setAccounts(newAccounts);
    if (typeof window !== "undefined") {
      localStorage.setItem("gis_accounts_list_v2", JSON.stringify(newAccounts));
    }
  };

  const handleAddAccount = (formData: NewAccountFormData) => {
    const newAccount: AccountItem = {
      id: Date.now().toString(),
      fullName: formData.fullName,
      username: formData.username,
      email: formData.email,
      role: formData.role,
      company: formData.company,
      estate: formData.estate,
      phone: formData.phone || "-",
      status: "active",
      joinedDate: new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date()),
    };

    const updated = [newAccount, ...accounts];
    saveAccounts(updated);

    setSuccessMessage(
      `Akun ${formData.fullName} dengan peran ${formData.role} berhasil didaftarkan.`,
    );
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const handleToggleStatus = (id: string) => {
    const updated = accounts.map((acc) => {
      if (acc.id === id) {
        return {
          ...acc,
          status: acc.status === "active" ? ("inactive" as const) : ("active" as const),
        };
      }
      return acc;
    });
    saveAccounts(updated);
  };

  const handleDeleteAccount = (id: string) => {
    if (accounts.length <= 1) return;
    const updated = accounts.filter((acc) => acc.id !== id);
    saveAccounts(updated);
  };

  const roleFilterTabs = [
    "Semua",
    "Superadmin GIS",
    "Admin GIS",
    "User Estate",
    "User Admin Kebun",
    "User Regional HO",
    "User Global",
  ];

  const filteredAccounts = accounts.filter((acc) => {
    const matchRole =
      selectedRoleFilter === "Semua" || acc.role === selectedRoleFilter;
    const matchSearch =
      acc.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.estate.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRole && matchSearch;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Superadmin GIS":
      case "superadminGIS":
        return <Badge color="primary">{role}</Badge>;
      case "Admin GIS":
      case "adminGIS":
        return <Badge color="info">{role}</Badge>;
      case "User Estate":
      case "Kasie (Asisten Kebun)":
        return <Badge color="success">{role}</Badge>;
      case "User Admin Kebun":
      case "SPV (Supervisor Afdeling)":
        return <Badge color="warning">{role}</Badge>;
      case "User Regional HO":
      case "GIS JKO (Pemetaan)":
        return <Badge color="info">{role}</Badge>;
      default:
        return <Badge color="light">{role}</Badge>;
    }
  };

  return (
    <>
      <Card className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3">
        {/* Header & Add Button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
          <div>
            <h3 className="text-base font-semibold text-gray-800 sm:text-lg dark:text-white/90">
              Manajemen Pengguna & Role Akses
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Daftarkan akun pengguna baru dan atur hak akses peran serta cakupan data kebun
            </p>
          </div>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="gap-2 shrink-0"
          >
            <PlusIcon className="size-4" />
            <span>Tambah Akun Baru</span>
          </Button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 p-3.5 text-xs font-medium text-green-700 dark:border-green-800/40 dark:bg-green-500/10 dark:text-green-400">
            <CheckCircleIcon className="size-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Role Filter Tabs */}
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
            {roleFilterTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedRoleFilter(tab)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${selectedRoleFilter === tab
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari nama / username / estate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-800 placeholder:text-gray-400 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-200"
            />
          </div>
        </div>

        {/* User Accounts Table */}
        <div className="mt-4 max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-y border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400">
                  Nama Pengguna
                </TableCell>
                <TableCell isHeader className="py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400">
                  Perusahaan
                </TableCell>
                <TableCell isHeader className="py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400">
                  Role / Hak Akses
                </TableCell>
                <TableCell isHeader className="py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400">
                  Unit Kerja / Estate
                </TableCell>
                <TableCell isHeader className="py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400">
                  Status
                </TableCell>
                <TableCell isHeader className="py-3 text-end text-xs font-medium text-gray-500 dark:text-gray-400">
                  Aksi
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredAccounts.map((acc) => {
                const initialLetter = acc.fullName.trim()
                  ? acc.fullName.trim()[0].toUpperCase()
                  : "U";

                return (
                  <TableRow
                    key={acc.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"
                  >
                    <TableCell className="py-3 text-xs">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 shrink-0 rounded-lg">
                          <AvatarFallback className="rounded-lg bg-gray-100 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            {initialLetter}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="block font-semibold text-gray-800 dark:text-white/90">
                            {acc.fullName}
                          </span>
                          <span className="font-mono text-[11px] text-gray-400">
                            @{acc.username}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 text-xs text-gray-600 dark:text-gray-300">
                      <div className="font-medium text-gray-800 dark:text-white/90">{acc.company}</div>
                      <div className="text-[11px] text-gray-400">{acc.email}</div>
                    </TableCell>

                    <TableCell className="py-3 text-xs">
                      {getRoleBadge(acc.role)}
                    </TableCell>

                    <TableCell className="py-3 text-xs font-medium text-gray-700 dark:text-gray-300">
                      {acc.estate}
                    </TableCell>

                    <TableCell className="py-3 text-xs">
                      {acc.status === "active" ? (
                        <Badge color="success">Aktif</Badge>
                      ) : (
                        <Badge color="error">Nonaktif</Badge>
                      )}
                    </TableCell>

                    <TableCell className="py-3 text-end text-xs">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleToggleStatus(acc.id)}
                          className="h-7 px-2 text-[11px]"
                        >
                          {acc.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                        </Button>

                        {accounts.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleDeleteAccount(acc.id)}
                            className="size-7 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                            aria-label={`Hapus akun ${acc.fullName}`}
                          >
                            <TrashBinIcon className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredAccounts.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-xs text-gray-500 dark:text-gray-400"
                  >
                    Tidak ada akun yang sesuai dengan pencarian atau filter role.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AddAccountModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onAddAccount={handleAddAccount}
      />
    </>
  );
}
