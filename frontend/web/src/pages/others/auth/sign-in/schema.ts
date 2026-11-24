import { z } from "zod";

export const signInSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
  keepLoggedIn: z.boolean().optional(),
});

export type SignInFormData = z.infer<typeof signInSchema>;
