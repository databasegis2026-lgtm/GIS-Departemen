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
import { useAuth } from "@/context/auth-context";

export default function SignInFormFields() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
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
            placeholder="Masukkan username"
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
    </div>
  );
}
