import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { CheckCircleIcon, KeyIcon, LockIcon } from "@/icons";
import { useState } from "react";

export default function SecuritySection() {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (newPassword.length < 8) {
      setErrorMsg("Kata sandi baru minimal 8 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    // Success simulation
    setIsPasswordModalOpen(false);
    setPasswordSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordSuccess(false), 5000);
  };

  return (
    <>
      <Card className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3">
        <div className="border-b border-gray-100 pb-4 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-800 sm:text-lg dark:text-white/90">
            Keamanan Akun & Kredensial
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Kelola kata sandi, metode verifikasi, dan pantau sesi masuk sistem Anda
          </p>
        </div>

        {passwordSuccess && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 p-3.5 text-xs font-medium text-green-700 dark:border-green-800/40 dark:bg-green-500/10 dark:text-green-400">
            <CheckCircleIcon className="size-4 shrink-0" />
            <span>Kata sandi akun Anda berhasil diperbarui dengan aman.</span>
          </div>
        )}

        <div className="mt-5 space-y-4">
          {/* Ubah Password Row */}
          <div className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <KeyIcon className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  Ubah Kata Sandi
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Gunakan kombinasi huruf, angka, dan simbol untuk keamanan maksimal
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPasswordModalOpen(true)}
            >
              Ganti Kata Sandi
            </Button>
          </div>

          {/* Autentikasi 2 Langkah (2FA) */}
          <div className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <LockIcon className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    Autentikasi Dua Langkah (2FA)
                  </h4>
                  {twoFactorEnabled ? (
                    <Badge color="success">Aktif</Badge>
                  ) : (
                    <Badge color="light">Nonaktif</Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Wajibkan kode verifikasi OTP saat masuk dari perangkat atau browser baru
                </p>
              </div>
            </div>

            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={(checked) => setTwoFactorEnabled(Boolean(checked))}
            />
          </div>

          {/* Sesi Login Aktif */}
          <div className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Riwayat Sesi Aktif
            </h4>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Daftar perangkat yang saat ini memiliki akses aktif ke akun GIS Anda
            </p>

            <div className="mt-3.5 space-y-2.5">
              <div className="flex items-center justify-between rounded-lg bg-gray-50/70 p-3 text-xs dark:bg-white/[0.02]">
                <div>
                  <span className="font-semibold text-gray-800 dark:text-white/90">
                    Google Chrome (Windows 11)
                  </span>
                  <p className="text-[11px] text-gray-400">
                    IP: 192.168.10.45 • Kantor Pusat GIS
                  </p>
                </div>
                <Badge color="success">Sesi Saat Ini</Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-50/70 p-3 text-xs dark:bg-white/[0.02]">
                <div>
                  <span className="font-semibold text-gray-800 dark:text-white/90">
                    GIS Mobile App (Android 14)
                  </span>
                  <p className="text-[11px] text-gray-400">
                    IP: 10.20.4.12 • GPS Kebun BUM 1 (Region 1)
                  </p>
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Aktif 2 jam yang lalu
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal Ubah Kata Sandi */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] rounded-2xl p-6 sm:max-w-md sm:p-8">
          <DialogHeader className="gap-1 pe-10 text-start">
            <DialogTitle className="text-xl font-bold text-gray-800 dark:text-white/90">
              Ubah Kata Sandi
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
              Masukkan kata sandi lama dan tentukan kata sandi baru akun Anda
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="mt-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
            <Field>
              <FieldLabel className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Kata Sandi Lama <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                type="password"
                placeholder="Masukkan kata sandi saat ini"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Kata Sandi Baru <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                type="password"
                placeholder="Minimal 8 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Konfirmasi Kata Sandi Baru <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                type="password"
                placeholder="Ulangi kata sandi baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </Field>

            <DialogFooter className="mt-6 flex items-center justify-end gap-3 pt-2">
              <DialogClose render={<Button variant="outline" type="button" />}>
                Batal
              </DialogClose>
              <Button type="submit">
                Simpan Kata Sandi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
