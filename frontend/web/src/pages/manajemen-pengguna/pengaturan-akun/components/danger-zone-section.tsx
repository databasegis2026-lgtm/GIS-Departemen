import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOutIcon, TrashBinIcon } from "@/icons";
import { useState } from "react";
import { useNavigate } from "react-router";

export default function DangerZoneSection() {
  const navigate = useNavigate();
  const [cacheMessage, setCacheMessage] = useState("");

  const handleClearCache = () => {
    try {
      sessionStorage.clear();
      setCacheMessage("Cache lokal peta & layer berhasil dibersihkan.");
      setTimeout(() => setCacheMessage(""), 4000);
    } catch {
      // ignore
    }
  };

  const handleLogoutAll = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("gis_username");
    }
    void navigate("/signin");
  };

  return (
    <Card className="rounded-2xl border border-red-200 bg-white p-5 sm:p-6 dark:border-red-900/30 dark:bg-white/3">
      <div className="border-b border-red-100 pb-4 dark:border-red-900/20">
        <h3 className="text-base font-semibold text-red-600 dark:text-red-400 sm:text-lg">
          Zona Tindakan Khusus & Keamanan Lanjut
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Tindakan di bawah ini berdampak langsung pada sesi masuk dan data penyimpanan lokal perangkat
        </p>
      </div>

      {cacheMessage && (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-xs text-blue-700 dark:border-blue-800/40 dark:bg-blue-500/10 dark:text-blue-400">
          {cacheMessage}
        </div>
      )}

      <div className="mt-5 space-y-4">
        {/* Bersihkan Cache */}
        <div className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Bersihkan Cache Peta Lokal
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Menghapus ubin (tiles) satelit dan geometri poligon yang tersimpan sementara di browser
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearCache}
            className="gap-2 shrink-0"
          >
            <TrashBinIcon className="size-4" />
            <span>Bersihkan Cache</span>
          </Button>
        </div>

        {/* Keluar Dari Semua Sesi */}
        <div className="flex flex-col gap-3 rounded-xl border border-red-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-900/20">
          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Keluar Dari Akun (Sign Out)
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Akhiri sesi aktif Anda di portal GIS Departemen dan kembali ke halaman login
            </p>
          </div>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleLogoutAll}
            className="gap-2 shrink-0"
          >
            <LogOutIcon className="size-4" />
            <span>Keluar Akun</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
