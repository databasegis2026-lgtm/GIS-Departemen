import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { signInSchema, type SignInFormData } from "./schema";
import { useAuth, REGISTERED_USERS, type UserProfile } from "@/context/auth-context";

export default function SignInFormFields() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showQuickSelect, setShowQuickSelect] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      username: "",
      password: "",
      keepLoggedIn: true,
    },
    mode: "onTouched",
  });

  const handleFormSubmit = async (data: SignInFormData) => {
    setAuthError(null);
    const result = await login(data.username, data.password);
    if (!result.success) {
      setAuthError(result.message || "Username atau password tidak cocok");
      return;
    }
    void navigate("/selamat-datang");
  };

  const handleQuickFill = (user: UserProfile) => {
    setValue("username", user.username);
    setValue("password", user.password || "");
    setAuthError(null);
  };

  return (
    <div className="space-y-4">
      {/* Pesan Kesalahan Autentikasi */}
      {authError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400 flex items-center gap-2">
          <svg className="size-4 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          <span>{authError}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-4"
        noValidate
      >
        <Field data-invalid={Boolean(errors.username)}>
          <FieldLabel className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
            Username <span className="text-red-500">*</span>
          </FieldLabel>
          <Input
            {...register("username")}
            type="text"
            placeholder="Masukkan username (cth: superadmin, agus.permana)"
            aria-invalid={errors.username ? "true" : undefined}
            className="text-xs"
          />
          <FieldError errors={[errors.username]} />
        </Field>

        <Field data-invalid={Boolean(errors.password)}>
          <FieldLabel className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
            Kata Sandi <span className="text-red-500">*</span>
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan password"
              aria-invalid={errors.password ? "true" : undefined}
              className="text-xs"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="text-gray-500 dark:text-gray-400"
              >
                {showPassword ? (
                  <EyeIcon className="fill-current" />
                ) : (
                  <EyeCloseIcon className="fill-current" />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldError errors={[errors.password]} />
        </Field>

        <div className="flex items-center justify-between">
          <Field orientation="horizontal" className="w-auto items-center gap-2">
            <Controller
              control={control}
              name="keepLoggedIn"
              render={({ field }) => (
                <Checkbox
                  id="keep-logged-in"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                />
              )}
            />
            <FieldLabel
              htmlFor="keep-logged-in"
              className="text-xs block cursor-pointer font-normal text-gray-700 dark:text-gray-400"
            >
              Ingat sesi saya
            </FieldLabel>
          </Field>
          <span className="text-xs text-gray-400">
            Sandi Default: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[11px]">admin12345</code> / <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[11px]">user12345</code>
          </span>
        </div>

        <div>
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 rounded-xl cursor-pointer"
            size="lg"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sedang Memverifikasi..." : "Masuk ke Sistem GIS"}
          </Button>
        </div>
      </form>

      {/* Accordion / Drawer Pintas Pilih Akun untuk Kemudahan Uji Coba */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setShowQuickSelect((prev) => !prev)}
          className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 py-1 cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <svg className="size-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
            Daftar 22 Akun Kredensial (Klik untuk Isi Cepat)
          </span>
          <svg className={`size-4 transform transition-transform ${showQuickSelect ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>

        {showQuickSelect && (
          <div className="mt-2 max-h-56 overflow-y-auto space-y-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/60 text-[11px]">
            {/* 1. Superadmin */}
            <div>
              <div className="font-bold text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-1">
                <span className="size-2 rounded-full bg-red-500"></span> 1. Superadmin
              </div>
              <div className="flex flex-wrap gap-1">
                {REGISTERED_USERS.filter((u) => u.roleKey === "superadmin").map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickFill(u)}
                    className="px-2 py-0.5 rounded bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-950/60 dark:text-red-300 font-medium transition-colors cursor-pointer"
                  >
                    {u.username} ({u.fullName})
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Admin GIS */}
            <div>
              <div className="font-bold text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-1">
                <span className="size-2 rounded-full bg-blue-500"></span> 2. Admin GIS
              </div>
              <div className="flex flex-wrap gap-1">
                {REGISTERED_USERS.filter((u) => u.roleKey === "admin_gis").map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickFill(u)}
                    className="px-2 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-medium transition-colors cursor-pointer"
                  >
                    {u.username} (Kode {u.staffCode})
                  </button>
                ))}
              </div>
            </div>

            {/* 3. User Estate */}
            <div>
              <div className="font-bold text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-1">
                <span className="size-2 rounded-full bg-emerald-500"></span> 3. User Estate (9 Kebun)
              </div>
              <div className="flex flex-wrap gap-1">
                {REGISTERED_USERS.filter((u) => u.roleKey === "user_estate").map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickFill(u)}
                    className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-medium transition-colors cursor-pointer"
                  >
                    {u.estateScope} ({u.username})
                  </button>
                ))}
              </div>
            </div>

            {/* 4. User Admin Kebun */}
            <div>
              <div className="font-bold text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-1">
                <span className="size-2 rounded-full bg-amber-500"></span> 4. User Admin Kebun
              </div>
              <div className="flex flex-wrap gap-1">
                {REGISTERED_USERS.filter((u) => u.roleKey === "admin_kebun").map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickFill(u)}
                    className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-medium transition-colors cursor-pointer"
                  >
                    {u.regionScope} ({u.username})
                  </button>
                ))}
              </div>
            </div>

            {/* 5. User Regional HO */}
            <div>
              <div className="font-bold text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-1">
                <span className="size-2 rounded-full bg-purple-500"></span> 5. User Regional HO
              </div>
              <div className="flex flex-wrap gap-1">
                {REGISTERED_USERS.filter((u) => u.roleKey === "regional_ho").map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickFill(u)}
                    className="px-2 py-0.5 rounded bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 font-medium transition-colors cursor-pointer"
                  >
                    {u.fullName} ({u.username})
                  </button>
                ))}
              </div>
            </div>

            {/* 6. User Global */}
            <div>
              <div className="font-bold text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-1">
                <span className="size-2 rounded-full bg-gray-500"></span> 6. User Global
              </div>
              <div className="flex flex-wrap gap-1">
                {REGISTERED_USERS.filter((u) => u.roleKey === "user_global").map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickFill(u)}
                    className="px-2 py-0.5 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-medium transition-colors cursor-pointer"
                  >
                    {u.username} ({u.title})
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
