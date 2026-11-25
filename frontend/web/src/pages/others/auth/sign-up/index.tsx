import { cn } from "@/utils";
import { Link } from "react-router";

export default function SignUp() {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <div className={cn("flex w-full flex-1 flex-col lg:w-1/2")}>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4">
        <div>
          <div className="mb-6 flex justify-center lg:hidden">
            <Link to="/" className="flex items-center gap-3">
              <img
                src={`${baseUrl}images/logo/favicon.png`}
                alt="GIS Departemen Logo"
                className="size-12 rounded-xl object-contain shadow-sm"
              />
              <span className="text-xl font-bold tracking-tight text-gray-800 dark:text-white">
                GIS Departemen
              </span>
            </Link>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 text-center dark:border-amber-900/50 dark:bg-amber-950/20">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
              <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
              Pendaftaran Akun Dibatasi
            </h1>
            <p className="mb-6 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
              Sesuai kebijakan keamanan GIS Departemen, pendaftaran akun baru tidak tersedia untuk umum.
              Akun hanya dapat didaftarkan oleh pengguna dengan role{" "}
              <span className="font-semibold text-gray-800 dark:text-gray-200">Superadmin</span> melalui menu{" "}
              <span className="font-semibold text-gray-800 dark:text-gray-200">Manajemen Pengguna</span>.
            </p>
            <Link
              to="/signin"
              className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Kembali ke Halaman Masuk (Sign In)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
