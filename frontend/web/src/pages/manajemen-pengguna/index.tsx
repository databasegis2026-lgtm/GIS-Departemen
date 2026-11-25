import { useEffect, useMemo, useState } from "react";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth, type RoleKey } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { PlusIcon, TrashBinIcon, UsersIcon } from "@/icons";

interface DbUserRow {
  id: string;
  username: string;
  full_name: string;
  title?: string;
  role_id?: number;
  role_key: RoleKey;
  role_name: string;
  staff_code?: string | null;
  estate_scope?: string | null;
  region_scope?: string | null;
  status: "active" | "inactive";
  created_at?: string;
}

const ROLE_OPTIONS: { key: RoleKey; label: string }[] = [
  { key: "superadmin", label: "Superadmin GIS" },
  { key: "admin_gis", label: "Admin GIS" },
  { key: "user_estate", label: "User Estate" },
  { key: "admin_kebun", label: "User Admin Kebun" },
  { key: "regional_ho", label: "User Regional HO" },
  { key: "user_global", label: "User Global" },
];

export default function ManajemenPenggunaPage() {
  const { currentUser, canManageUsers, register } = useAuth();
  const [users, setUsers] = useState<DbUserRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("semua");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal Tambah Akun Baru
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formState, setFormState] = useState({
    fullName: "",
    username: "",
    password: "",
    title: "",
    roleKey: "user_estate" as RoleKey,
    staffCode: "",
    estateScope: "",
    regionScope: "",
  });

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from<DbUserRow>("gis_users")
        .select("*", {}, { order: "role_id.asc,username.asc" });

      if (error) {
        setErrorMsg(
          error.message ||
            "Gagal memuat daftar akun dari Supabase. Pastikan skrip supabase_schema.sql sudah dijalankan."
        );
        setUsers([]);
      } else {
        setUsers(data || []);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal terhubung ke database Supabase.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManageUsers()) {
      void fetchUsers();
    } else {
      setLoading(false);
    }
  }, []);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "semua" && u.role_key !== roleFilter) return false;
      if (!q) return true;
      return (
        u.username.toLowerCase().includes(q) ||
        u.full_name.toLowerCase().includes(q) ||
        (u.title || "").toLowerCase().includes(q) ||
        (u.estate_scope || "").toLowerCase().includes(q) ||
        (u.region_scope || "").toLowerCase().includes(q)
      );
    });
  }, [users, searchQuery, roleFilter]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    const roleObj = ROLE_OPTIONS.find((r) => r.key === formState.roleKey);
    const res = await register({
      username: formState.username,
      password: formState.password,
      fullName: formState.fullName,
      title: formState.title || roleObj?.label || "Staf Operasional GIS",
      roleKey: formState.roleKey,
      roleName: roleObj?.label || "User Global",
      staffCode: formState.staffCode || undefined,
      estateScope: formState.estateScope || undefined,
      regionScope: formState.regionScope || undefined,
    });

    setSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.message || "Gagal mendaftarkan akun.");
      return;
    }

    setSuccessMsg(`Akun '${formState.username.toLowerCase()}' berhasil didaftarkan oleh Superadmin.`);
    setIsAddOpen(false);
    setFormState({
      fullName: "",
      username: "",
      password: "",
      title: "",
      roleKey: "user_estate",
      staffCode: "",
      estateScope: "",
      regionScope: "",
    });
    void fetchUsers();
  };

  const handleToggleStatus = async (user: DbUserRow) => {
    if (user.id === currentUser.id) {
      setErrorMsg("Tidak dapat menonaktifkan akun Superadmin yang sedang aktif.");
      return;
    }
    const nextStatus = user.status === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("gis_users")
      .update(
        { status: nextStatus },
        { id: `eq.${user.id}` },
        {
          user: currentUser.fullName,
          details: `Mengubah status akun ${user.username} menjadi ${nextStatus}`,
        }
      );

    if (error) {
      setErrorMsg(error.message || "Gagal memperbarui status akun.");
      return;
    }
    setSuccessMsg(`Status akun '${user.username}' diperbarui menjadi ${nextStatus}.`);
    void fetchUsers();
  };

  const handleDeleteUser = async (user: DbUserRow) => {
    if (user.id === currentUser.id) {
      setErrorMsg("Tidak dapat menghapus akun yang sedang digunakan login.");
      return;
    }
    if (!window.confirm(`Hapus permanen akun '${user.username}' dari database Supabase?`)) {
      return;
    }

    const { error } = await supabase.from("gis_users").delete(
      { id: `eq.${user.id}` },
      {
        user: currentUser.fullName,
        details: `Menghapus akun pengguna ${user.username}`,
      }
    );

    if (error) {
      setErrorMsg(error.message || "Gagal menghapus akun.");
      return;
    }
    setSuccessMsg(`Akun '${user.username}' berhasil dihapus.`);
    void fetchUsers();
  };

  const getRoleBadgeClass = (roleKey: RoleKey) => {
    switch (roleKey) {
      case "superadmin":
        return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300";
      case "admin_gis":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300";
      case "user_estate":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
      case "admin_kebun":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300";
      case "regional_ho":
        return "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  if (!canManageUsers()) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
        <h2 className="text-base font-bold text-red-700 dark:text-red-400">
          Akses Terbatas — Khusus Superadmin
        </h2>
        <p className="mt-1 text-xs text-red-600 dark:text-red-300">
          Hanya pengguna dengan role Superadmin yang dapat melihat dan mendaftarkan akun pengguna.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageMeta
        title="Manajemen Pengguna | GIS Departemen"
        description="Kelola dan daftarkan akun pengguna GIS Departemen langsung di database Supabase"
      />
      <PageBreadcrumb pageTitle="Manajemen Pengguna" />

      {/* Header & Action */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:bg-white/3">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <UsersIcon className="size-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Direktori Akun Database Supabase
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Pendaftaran akun baru hanya diizinkan melalui otoritas <span className="font-semibold">Superadmin</span>.
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
            setErrorMsg(null);
            setIsAddOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
        >
          <PlusIcon className="size-4" />
          Daftarkan Akun Baru
        </Button>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400">
          {successMsg}
        </div>
      )}

      {/* Filter & Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari username, nama, jabatan, atau scope..."
            className="max-w-xs text-xs"
          />

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="semua">Semua Role ({users.length})</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              onClick={() => void fetchUsers()}
              className="rounded-xl text-xs cursor-pointer"
            >
              Segarkan
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-100 bg-gray-50/70 text-[11px] uppercase text-gray-500 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Username</th>
                <th className="px-4 py-3 font-semibold">Nama & Jabatan</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Scope Wilayah</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Memuat data akun dari Supabase...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Tidak ada akun ditemukan di tabel <code className="font-mono">public.gis_users</code>.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono font-semibold text-gray-900 dark:text-white">
                      {u.username}
                      {u.staff_code && (
                        <span className="ml-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          Kode: {u.staff_code}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800 dark:text-gray-200">
                        {u.full_name}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {u.title || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getRoleBadgeClass(
                          u.role_key
                        )}`}
                      >
                        {u.role_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {u.estate_scope || u.region_scope ? (
                        <span>
                          {[u.region_scope, u.estate_scope].filter(Boolean).join(" • ")}
                        </span>
                      ) : (
                        <span className="text-gray-400">Global Holding</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void handleToggleStatus(u)}
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold cursor-pointer ${
                          u.status === "active"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {u.status === "active" ? "Aktif" : "Nonaktif"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void handleDeleteUser(u)}
                        disabled={u.id === currentUser.id}
                        title="Hapus akun"
                        className="inline-flex items-center justify-center rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-30 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer"
                      >
                        <TrashBinIcon className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Daftarkan Akun Baru (Khusus Superadmin) */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Daftarkan Akun Pengguna Baru
            </DialogTitle>
            <DialogDescription className="text-xs">
              Akun akan langsung tersimpan ke tabel <code className="font-mono">public.gis_users</code> Supabase.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAccount} className="space-y-3.5 pt-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <Input
                required
                value={formState.fullName}
                onChange={(e) => setFormState((s) => ({ ...s, fullName: e.target.value }))}
                placeholder="Contoh: Budi Santoso"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Username <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={formState.username}
                  onChange={(e) => setFormState((s) => ({ ...s, username: e.target.value }))}
                  placeholder="budi.santoso"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Kata Sandi <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  type="password"
                  value={formState.password}
                  onChange={(e) => setFormState((s) => ({ ...s, password: e.target.value }))}
                  placeholder="Min. 6 karakter"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Role Akses <span className="text-red-500">*</span>
                </label>
                <select
                  value={formState.roleKey}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, roleKey: e.target.value as RoleKey }))
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Jabatan / Title
                </label>
                <Input
                  value={formState.title}
                  onChange={(e) => setFormState((s) => ({ ...s, title: e.target.value }))}
                  placeholder="Asisten Kepala / Staf GIS"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                  Scope Region
                </label>
                <Input
                  value={formState.regionScope}
                  onChange={(e) => setFormState((s) => ({ ...s, regionScope: e.target.value }))}
                  placeholder="R1 / R2 / R3"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                  Scope Estate
                </label>
                <Input
                  value={formState.estateScope}
                  onChange={(e) => setFormState((s) => ({ ...s, estateScope: e.target.value }))}
                  placeholder="BUM 1 / BSL"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                  Kode Staf
                </label>
                <Input
                  value={formState.staffCode}
                  onChange={(e) => setFormState((s) => ({ ...s, staffCode: e.target.value }))}
                  placeholder="A - G"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="rounded-xl text-xs cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
              >
                {submitting ? "Menyimpan..." : "Simpan Akun ke Database"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
