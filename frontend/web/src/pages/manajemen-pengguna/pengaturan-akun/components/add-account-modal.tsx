import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export type UserRole =
  | "superadminGIS"
  | "adminGIS"
  | "userGIS"
  | "Kasie (Asisten Kebun)"
  | "SPV (Supervisor Afdeling)"
  | "GIS JKO (Pemetaan)";

export type ScopeType = "global" | "regional" | "estate" | "afdeling";

export interface NewAccountFormData {
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  company: string;
  scopeType: ScopeType;
  estate: string;
  phone: string;
}

interface AddAccountModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddAccount: (data: NewAccountFormData) => void;
}

const roleOptions: { role: UserRole; label: string; desc: string }[] = [
  {
    role: "superadminGIS",
    label: "superadminGIS (Super Admin GIS)",
    desc: "Akses bypass penuh sistem, kelola seluruh pengguna, hak akses & konfigurasi spasial",
  },
  {
    role: "adminGIS",
    label: "adminGIS (Admin GIS)",
    desc: "CRUD data operasional, spasial batas blok kebun, audit log & verifikasi tiket peta",
  },
  {
    role: "userGIS",
    label: "userGIS (Pengguna GIS / Viewer)",
    desc: "Akses read-only monitoring peta & dashboard analitik, pengajuan tiket update peta",
  },
  {
    role: "Kasie (Asisten Kebun)",
    label: "Kasie (Kepala Seksi / Asisten Kebun)",
    desc: "Verifikasi data operasional blok, panen, pemupukan & penandatangan pengesahan BAPP",
  },
  {
    role: "SPV (Supervisor Afdeling)",
    label: "SPV (Supervisor Afdeling)",
    desc: "Monitoring harian progres kerja divisi afdeling & penunasan pruning di lapangan",
  },
  {
    role: "GIS JKO (Pemetaan)",
    label: "GIS JKO (Juru Ukur / Pemetaan Wilayah)",
    desc: "Pengukuran GPS/drone lapangan, plotting batas areal, dan sinkronisasi kartografi",
  },
];

const companyOptions = [
  { id: "PT_BUM", label: "PT BUM (Bangkitgiat Usaha Mandiri)" },
  { id: "BSL", label: "BSL" },
];

const scopeOptions: { type: ScopeType; label: string; desc: string }[] = [
  { type: "global", label: "Global", desc: "Akses seluruh Region & Estate lintas perusahaan" },
  { type: "regional", label: "Regional", desc: "Dibatasi pada Region 1, 2, atau 3" },
  { type: "estate", label: "Estate", desc: "Dibatasi pada satu kebun (misal BUM 1, BSL)" },
  { type: "afdeling", label: "Afdeling", desc: "Dibatasi pada divisi kerja spesifik" },
];

const estateOptions = [
  "Kantor Pusat GIS",
  "PT BUM - BUM 1 (Region 1)",
  "PT BUM - BUM 2 (Region 1)",
  "PT BUM - BUM 4 (Region 1)",
  "PT BUM - BUM 5 (Region 2)",
  "PT BUM - BUM 6 (Region 2)",
  "PT BUM - BUM 7 (Region 2)",
  "PT BUM - BUM 3 (Region 3)",
  "PT BUM - BUM 8 (Region 3)",
  "BSL - Estate BSL (Region 3)",
];

export default function AddAccountModal({
  isOpen,
  onOpenChange,
  onAddAccount,
}: AddAccountModalProps) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("userGIS");
  const [company, setCompany] = useState("PT BUM (Bangkitgiat Usaha Mandiri)");
  const [scopeType, setScopeType] = useState<ScopeType>("estate");
  const [estate, setEstate] = useState("PT BUM - BUM 1 (Region 1)");
  const [phone, setPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleFullNameChange = (val: string) => {
    setFullName(val);
    if (!username || username === fullName.toLowerCase().replace(/\s+/g, ".")) {
      const generated = val.toLowerCase().trim().replace(/\s+/g, ".");
      setUsername(generated);
      setEmail(`${generated}@gis-departemen.com`);
    }
  };

  const handleCompanyChange = (comp: string) => {
    setCompany(comp);
    if (comp === "BSL") {
      setEstate("BSL - Estate BSL (Region 3)");
    } else if (estate.startsWith("BSL")) {
      setEstate("PT BUM - BUM 1 (Region 1)");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!fullName.trim() || !username.trim() || !email.trim() || !password) {
      setErrorMsg("Mohon lengkapi semua kolom yang bertanda bintang (*).");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Kata sandi minimal 8 karakter sesuai standar keamanan sistem.");
      return;
    }

    onAddAccount({
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password,
      role,
      company,
      scopeType,
      estate,
      phone: phone.trim(),
    });

    // Reset Form
    setFullName("");
    setUsername("");
    setEmail("");
    setPassword("");
    setRole("userGIS");
    setCompany("PT BUM (Bangkitgiat Usaha Mandiri)");
    setScopeType("estate");
    setEstate("PT BUM - BUM 1 (Region 1)");
    setPhone("");
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-2xl p-6 sm:max-w-xl sm:p-8">
        <DialogHeader className="gap-1 pe-10 text-start">
          <DialogTitle className="text-xl font-bold text-gray-800 dark:text-white/90">
            Tambah Akun Pengguna Baru
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
            Daftarkan akun tim kebun baru dan tentukan hak akses peran serta cakupan data operasional
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="mt-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Nama Lengkap <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={fullName}
                onChange={(e) => handleFullNameChange(e.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Username <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                type="text"
                placeholder="budi.santoso"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Email Kedinasan <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                type="email"
                placeholder="budi.santoso@gis-departemen.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Kata Sandi Awal <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                type="password"
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
          </div>

          {/* Pilihan Role / Peran */}
          <Field>
            <FieldLabel className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Pilih Role / Hak Akses Pengguna <span className="text-red-500">*</span>
            </FieldLabel>
            <div className="space-y-2">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-gray-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                {roleOptions.map((opt) => (
                  <option key={opt.role} value={opt.role}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <div className="rounded-lg bg-gray-50 p-2.5 text-[11px] text-gray-500 dark:bg-white/[0.02] dark:text-gray-400">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Deskripsi Hak Akses:{" "}
                </span>
                {roleOptions.find((r) => r.role === role)?.desc}
              </div>
            </div>
          </Field>

          {/* Pilihan Perusahaan & Scope Akses Data */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Entitas Perusahaan
              </FieldLabel>
              <select
                value={company}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-gray-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                {companyOptions.map((comp) => (
                  <option key={comp.id} value={comp.label}>
                    {comp.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field>
              <FieldLabel className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Cakupan Akses Data (Scope)
              </FieldLabel>
              <select
                value={scopeType}
                onChange={(e) => setScopeType(e.target.value as ScopeType)}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-gray-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                {scopeOptions.map((sc) => (
                  <option key={sc.type} value={sc.type}>
                    {sc.label} - {sc.desc}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Unit Kerja / Estate Penugasan
              </FieldLabel>
              <select
                value={estate}
                onChange={(e) => setEstate(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-gray-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                {estateOptions.map((est) => (
                  <option key={est} value={est}>
                    {est}
                  </option>
                ))}
              </select>
            </Field>

            <Field>
              <FieldLabel className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Nomor Telepon / WhatsApp
              </FieldLabel>
              <Input
                type="tel"
                placeholder="+62 8..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
          </div>

          <DialogFooter className="mt-6 flex items-center justify-end gap-3 pt-2">
            <DialogClose render={<Button variant="outline" type="button" />}>
              Batal
            </DialogClose>
            <Button type="submit">
              Simpan & Daftarkan Akun
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
