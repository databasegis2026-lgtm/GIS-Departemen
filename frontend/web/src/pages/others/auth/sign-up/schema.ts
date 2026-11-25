import { z } from "zod";

export const signUpSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "Username minimal 3 karakter")
      .max(30, "Username maksimal 30 karakter")
      .regex(/^[a-z0-9._]+$/, "Username hanya boleh huruf kecil, angka, titik, atau garis bawah"),
    fullName: z.string().trim().min(1, "Nama lengkap wajib diisi"),
    password: z.string().min(6, "Kata sandi minimal 6 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Kata sandi tidak cocok",
    path: ["confirmPassword"],
  });

export type SignUpFormData = z.infer<typeof signUpSchema>;
