import { Button } from "@/components/ui/button";
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
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { signUpSchema, type SignUpFormData } from "./schema";
import { useAuth } from "@/context/auth-context";

export default function SignUpFormFields() {
  const navigate = useNavigate();
  const { register: registerAccount } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      fullName: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const handleFormSubmit = async (data: SignUpFormData) => {
    setAuthError(null);
    setAuthSuccess(null);

    const result = await registerAccount({
      username: data.username,
      password: data.password,
      fullName: data.fullName,
    });

    if (!result.success) {
      setAuthError(result.message || "Gagal mendaftarkan akun.");
      return;
    }

    setAuthSuccess("Akun berhasil didaftarkan. Mengalihkan ke beranda...");
    setTimeout(() => void navigate("/selamat-datang"), 1200);
  };

  return (
    <div className="space-y-4">
      {authError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400 flex items-center gap-2">
          <svg className="size-4 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          <span>{authError}</span>
        </div>
      )}

      {authSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center gap-2">
          <svg className="size-4 shrink-0 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          <span>{authSuccess}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-4"
        noValidate
      >
        <Field data-invalid={Boolean(errors.fullName)}>
          <FieldLabel className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
            Nama Lengkap <span className="text-red-500">*</span>
          </FieldLabel>
          <Input
            {...register("fullName")}
            type="text"
            placeholder="Contoh: Rudi Wahyudi"
            aria-invalid={errors.fullName ? "true" : undefined}
            className="text-xs"
          />
          <FieldError errors={[errors.fullName]} />
        </Field>

        <Field data-invalid={Boolean(errors.username)}>
          <FieldLabel className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
            Username <span className="text-red-500">*</span>
          </FieldLabel>
          <Input
            {...register("username")}
            type="text"
            placeholder="Contoh: rudi.wahyudi"
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
              placeholder="Minimal 6 karakter"
              aria-invalid={errors.password ? "true" : undefined}
              className="text-xs"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Sembunyikan" : "Tampilkan"}
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

        <Field data-invalid={Boolean(errors.confirmPassword)}>
          <FieldLabel className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
            Konfirmasi Kata Sandi <span className="text-red-500">*</span>
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              {...register("confirmPassword")}
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Ketik ulang kata sandi"
              aria-invalid={errors.confirmPassword ? "true" : undefined}
              className="text-xs"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? "Sembunyikan" : "Tampilkan"}
                className="text-gray-500 dark:text-gray-400"
              >
                {showConfirmPassword ? (
                  <EyeIcon className="fill-current" />
                ) : (
                  <EyeCloseIcon className="fill-current" />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldError errors={[errors.confirmPassword]} />
        </Field>

        <div>
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 rounded-xl cursor-pointer"
            size="lg"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sedang Mendaftarkan..." : "Daftar Akun Baru"}
          </Button>
        </div>
      </form>
    </div>
  );
}
