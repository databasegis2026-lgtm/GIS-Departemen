import type { SubItem } from "@/components/layout/app-layout/sidebar/types";

const dashboardMaintenance: SubItem = {
  key: "maintenance",
  path: "/dashboard/perawatan",
  subItems: [
    { key: "pruning", path: "/dashboard/perawatan/pruning" },
    { key: "pikulRoad", path: "/dashboard/perawatan/pasar-pikul" },
    { key: "fertilizing", path: "/dashboard/perawatan/pemupukan" },
    { key: "spraying", path: "/dashboard/perawatan/semprot" },
    { key: "emptyBunches", path: "/dashboard/perawatan/jangkos" },
  ],
};

const analyticsMaintenance: SubItem = {
  key: "analyticsMaintenance",
  path: "/grafik-analitik/perawatan",
  subItems: [
    { key: "analyticsPruning", path: "/grafik-analitik/perawatan/pruning" },
    { key: "analyticsPikul", path: "/grafik-analitik/perawatan/pasar-pikul" },
    { key: "analyticsFertilizing", path: "/grafik-analitik/perawatan/pemupukan" },
    { key: "analyticsSpraying", path: "/grafik-analitik/perawatan/semprot" },
    { key: "analyticsEmptyBunches", path: "/grafik-analitik/perawatan/jangkos" },
  ],
};

const operationalMaintenance: SubItem = {
  key: "operationalMaintenance",
  path: "/data-operasional/perawatan",
  subItems: [
    { key: "operationalPruning", path: "/data-operasional/perawatan/pruning" },
    { key: "operationalPikul", path: "/data-operasional/perawatan/pasar-pikul" },
    { key: "operationalFertilizing", path: "/data-operasional/perawatan/pemupukan" },
    { key: "operationalSpraying", path: "/data-operasional/perawatan/semprot" },
    { key: "operationalEmptyBunches", path: "/data-operasional/perawatan/jangkos" },
  ],
};

export const roleMenus: Record<"superadmin" | "admin", SubItem[]> = {
  superadmin: [
    { key: "welcome", path: "/selamat-datang" },
    {
      key: "dashboard",
      path: "/dashboard",
      subItems: [
        { key: "production", path: "/dashboard/produksi" },
        dashboardMaintenance,
      ],
    },
    {
      key: "analytics",
      path: "/grafik-analitik",
      subItems: [
        { key: "analyticsProduction", path: "/grafik-analitik/produksi" },
        analyticsMaintenance,
      ],
    },
    { key: "mapTicketing", path: "/ticketing-update-peta" },
    { key: "estateVerification", path: "/verifikasi-data-kebun" },
    {
      key: "operationalData",
      path: "/data-operasional",
      subItems: [
        { key: "operationalProduction", path: "/data-operasional/produksi" },
        operationalMaintenance,
      ],
    },
    {
      key: "landOpening",
      path: "/pembukaan-lahan",
      subItems: [
        { key: "grtt", path: "/pembukaan-lahan/grtt" },
        { key: "laneClearing", path: "/pembukaan-lahan/lane-clearing" },
        { key: "planting", path: "/pembukaan-lahan/penanaman" },
      ],
    },
    {
      key: "assets",
      path: "/aset",
      subItems: [
        { key: "estateAreas", path: "/aset/wilayah-kebun" },
        { key: "plantCensus", path: "/aset/sensus-pokok" },
        { key: "infrastructure", path: "/aset/infrastruktur" },
        { key: "vehicles", path: "/aset/kendaraan-alat" },
      ],
    },
    {
      key: "monitoring",
      path: "/monitoring",
      subItems: [
        { key: "activityAudit", path: "/monitoring/audit-aktivitas" },
        { key: "notifications", path: "/monitoring/notifikasi" },
      ],
    },
    {
      key: "userManagement",
      path: "/manajemen-pengguna",
      subItems: [{ key: "accountSettings", path: "/pengaturan-akun" }],
    },
  ],
  admin: [
    { key: "welcome", path: "/selamat-datang" },
    { key: "dashboard", path: "/dashboard" },
    { key: "analytics", path: "/grafik-analitik" },
    { key: "mapTicketing", path: "/ticketing-update-peta" },
    { key: "estateVerification", path: "/verifikasi-data-kebun" },
    { key: "operationalData", path: "/data-operasional" },
    { key: "landOpening", path: "/pembukaan-lahan" },
    { key: "assets", path: "/aset" },
    { key: "settings", path: "/pengaturan" },
  ],
};
