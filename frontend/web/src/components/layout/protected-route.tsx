import React from "react";
import { Navigate, useLocation, Outlet } from "react-router";
import { useAuth } from "@/context/auth-context";

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, currentUser, isRouteAllowed } = useAuth();
  const location = useLocation();

  // 1. Cek apakah pengguna sudah login
  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // 2. Cek apakah halaman yang dituju diizinkan untuk role pengguna
  const isAllowed = isRouteAllowed(location.pathname);
  if (!isAllowed) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
          <svg className="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Akses Halaman Dibatasi (403)
        </h2>
        <p className="max-w-md text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          Akun Anda terdaftar sebagai <span className="font-semibold text-gray-800 dark:text-gray-200">{currentUser.fullName}</span> ({currentUser.roleName}).
          Role ini tidak memiliki izin untuk mengakses halaman <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[11px] text-red-500 font-mono">{location.pathname}</code>.
        </p>
        <div className="flex gap-3">
          <a
            href="/selamat-datang"
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Kembali ke Beranda
          </a>
          <a
            href="/dashboard"
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 transition-colors"
          >
            Buka Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
