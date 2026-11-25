import AppLayout from "@/components/layout/app-layout";
import { workspacePages } from "@/components/layout/app-layout/sidebar/data";
import DashboardPage from "@/pages/dashboard";
import GrafikAnalitikPage from "@/pages/grafik-analitik";
import DataOperasionalPage from "@/pages/data-operasional";
import { Error404Page } from "@/pages/main/pages";
import WorkspacePage from "@/pages/main/workspace-page";
import PengaturanAkunPage from "@/pages/manajemen-pengguna/pengaturan-akun";
import { AuthLayout, SignInPage, SignUpPage } from "@/pages/others/auth";
import SelamatDatangPage from "@/pages/selamat-datang";
import RequestUpdatePetaPage from "@/pages/ticketing-update-peta";
import EditPetaSpasialPage from "@/pages/edit-peta-spasial";
import AsetPage from "@/pages/aset";
import BatasAdministrasiPage from "@/pages/aset/batas-administrasi";
import PokokSawitPage from "@/pages/aset/pokok-sawit";
import PMKSPage from "@/pages/aset/pmks";
import EmplasmentPage from "@/pages/aset/emplasment";
import PembibitanPage from "@/pages/aset/pembibitan";
import SungaiPage from "@/pages/aset/sungai";
import TopografiPage from "@/pages/aset/topografi";
import AreaKonservasiPage from "@/pages/aset/area-konservasi";
import HirarkiArestaPage from "@/pages/aset/hirarki-aresta";
import RekapPekerjaanRutinPage from "@/pages/rekap-pekerjaan/pekerjaan-rutin";
import PembukaanLahanPage from "@/pages/pembukaan-lahan";
import GRTTPage from "@/pages/pembukaan-lahan/grtt";
import LaneClearingPage from "@/pages/pembukaan-lahan/lane-clearing";
import PenanamanPage from "@/pages/pembukaan-lahan/penanaman";
import MonitoringPage from "@/pages/monitoring";
import AuditAktivitasPage from "@/pages/monitoring/audit-aktivitas";
import NotifikasiPage from "@/pages/monitoring/notifikasi";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Navigate, Route, Routes } from "react-router";

export default function App() {
  return (
    <Routes>
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/selamat-datang" replace />} />
        <Route path="selamat-datang" element={<SelamatDatangPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="dashboard/produksi" element={<DashboardPage />} />
        <Route path="dashboard/perawatan/*" element={<DashboardPage />} />
        <Route path="grafik-analitik" element={<GrafikAnalitikPage />} />
        <Route path="grafik-analitik/produksi" element={<GrafikAnalitikPage />} />
        <Route path="grafik-analitik/perawatan/*" element={<GrafikAnalitikPage />} />
        <Route path="data-operasional" element={<DataOperasionalPage />} />
        <Route path="data-operasional/produksi" element={<DataOperasionalPage />} />
        <Route path="data-operasional/perawatan" element={<DataOperasionalPage />} />
        <Route path="data-operasional/perawatan/*" element={<DataOperasionalPage />} />
        <Route path="ticketing-update-peta" element={<RequestUpdatePetaPage />} />
        <Route path="request-update-peta" element={<RequestUpdatePetaPage />} />
        <Route path="edit-peta-spasial" element={<EditPetaSpasialPage />} />
        <Route path="aset" element={<AsetPage />} />
        <Route path="aset/batas-administrasi" element={<BatasAdministrasiPage />} />
        <Route path="aset/batas-administrasi/*" element={<BatasAdministrasiPage />} />
        <Route path="aset/pokok-sawit" element={<PokokSawitPage />} />
        <Route path="aset/pmks" element={<PMKSPage />} />
        <Route path="aset/emplasment" element={<EmplasmentPage />} />
        <Route path="aset/pembibitan" element={<PembibitanPage />} />
        <Route path="aset/sungai" element={<SungaiPage />} />
        <Route path="aset/topografi" element={<TopografiPage />} />
        <Route path="aset/area-konservasi" element={<AreaKonservasiPage />} />
        <Route path="aset/area-konservasi/*" element={<AreaKonservasiPage />} />
        <Route path="aset/hirarki-aresta" element={<HirarkiArestaPage />} />
        
        {/* Persiapan Lahan / Pembukaan Lahan */}
        <Route path="pembukaan-lahan" element={<PembukaanLahanPage />} />
        <Route path="pembukaan-lahan/grtt" element={<GRTTPage />} />
        <Route path="pembukaan-lahan/lane-clearing" element={<LaneClearingPage />} />
        <Route path="pembukaan-lahan/penanaman" element={<PenanamanPage />} />

        <Route
          path="rekap-pekerjaan/persiapan-lahan"
          element={<PembukaanLahanPage />}
        />
        <Route
          path="rekap-pekerjaan/persiapan-lahan/grtt"
          element={<GRTTPage />}
        />
        <Route
          path="rekap-pekerjaan/persiapan-lahan/land-clearing"
          element={<LaneClearingPage />}
        />
        <Route
          path="rekap-pekerjaan/persiapan-lahan/tanam"
          element={<PenanamanPage />}
        />

        {/* Rekap Pekerjaan Rutin */}
        <Route
          path="rekap-pekerjaan/pekerjaan-rutin"
          element={<RekapPekerjaanRutinPage />}
        />
        <Route
          path="rekap-pekerjaan/pekerjaan-rutin/*"
          element={<RekapPekerjaanRutinPage />}
        />

        {/* Monitoring & Audit Spasial */}
        <Route path="monitoring" element={<MonitoringPage />} />
        <Route path="monitoring/audit-aktivitas" element={<AuditAktivitasPage />} />
        <Route path="monitoring/notifikasi" element={<NotifikasiPage />} />
        <Route path="monitoring/*" element={<MonitoringPage />} />

        {/* Pengaturan Akun & Profil */}
        <Route
          path="manajemen-pengguna/pengaturan-akun"
          element={<PengaturanAkunPage />}
        />
        <Route path="pengaturan-akun" element={<PengaturanAkunPage />} />
        <Route path="profile" element={<PengaturanAkunPage />} />

        {workspacePages
          .filter(
            ({ path }) =>
              path !== "/selamat-datang" &&
              !path.startsWith("/dashboard") &&
              !path.startsWith("/grafik-analitik") &&
              !path.startsWith("/data-operasional") &&
              !path.startsWith("/ticketing-update-peta") &&
              !path.startsWith("/request-update-peta") &&
              path !== "/edit-peta-spasial" &&
              path !== "/aset" &&
              !path.startsWith("/aset") &&
              !path.startsWith("/pembukaan-lahan") &&
              !path.startsWith("/rekap-pekerjaan/persiapan-lahan") &&
              !path.startsWith("/rekap-pekerjaan/pekerjaan-rutin") &&
              !path.startsWith("/monitoring") &&
              path !== "/manajemen-pengguna/pengaturan-akun" &&
              path !== "/pengaturan-akun",
          )
          .map(({ key, path }) => (
            <Route
              key={`${key}-${path}`}
              path={path.slice(1)}
              element={<WorkspacePage />}
            />
          ))}
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/login" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Route>

      <Route path="/error-404" element={<Error404Page />} />
      <Route path="*" element={<Error404Page />} />
    </Routes>
  );
}
