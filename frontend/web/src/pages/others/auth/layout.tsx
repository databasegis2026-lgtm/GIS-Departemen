import { Link, Outlet } from "react-router";
import ContourBackground from "./contour-background";
import ThemeToggler from "./theme-toggler";

export default function AuthLayout() {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <div className="relative z-1 bg-white p-6 sm:p-0 dark:bg-gray-900">
      <div className="relative flex min-h-screen w-full flex-col justify-center sm:p-0 lg:flex-row dark:bg-gray-900">
        <Outlet />

        {/* Right side of login form: Logo and Branding */}
        <div className="relative hidden min-h-screen w-full items-center justify-center overflow-hidden bg-brand-950 p-6 lg:flex lg:w-1/2 xl:p-12 dark:bg-white/5">
          <div className="z-1 flex h-full w-full max-w-xl flex-col items-center justify-center">
            <ContourBackground />

            <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
              <Link
                to="/"
                className="group mb-8 block w-full transition-transform duration-200 hover:scale-[1.01]"
              >
                <div className="flex w-full items-center justify-center rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5 sm:p-8 dark:bg-white">
                  <img
                    src={`${baseUrl}images/logo/logo-gis-white.png`}
                    alt="GIS Departemen Logo"
                    className="h-auto max-h-[320px] w-full max-w-full object-contain"
                  />
                </div>
              </Link>
              <h2 className="mb-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                GIS Departemen
              </h2>
              <p className="max-w-sm text-sm text-gray-300 sm:text-base dark:text-white/70">
                Sistem Informasi Geografis & Manajemen Operasional Perkebunan
              </p>
            </div>
          </div>
        </div>

        <div className="fixed inset-e-6 bottom-6 z-50 hidden sm:block">
          <ThemeToggler />
        </div>
      </div>
    </div>
  );
}
