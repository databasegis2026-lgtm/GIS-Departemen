import {
  BoxIcon,
  LayerIcon,
  LayoutGridIcon,
  ListIcon,
  MapIcon,
  PieChartIcon,
  SparkIcon,
  TableIcon,
  TelescopeIcon,
  UsersIcon,
} from "@/icons";
import type { NavItem, SubItem } from "./types";

export const navItems: NavItem[] = [
  {
    key: "welcome",
    icon: <SparkIcon className="size-6" />,
    path: "/selamat-datang",
  },
  {
    key: "dashboard",
    icon: <LayoutGridIcon className="size-6" />,
    path: "/dashboard",
    subItems: [
      { key: "production", path: "/dashboard/produksi" },
      {
        key: "maintenance",
        path: "/dashboard/perawatan",
        subItems: [
          { key: "pruning", path: "/dashboard/perawatan/pruning" },
          { key: "pikulRoad", path: "/dashboard/perawatan/pasar-pikul" },
          { key: "fertilizing", path: "/dashboard/perawatan/pemupukan" },
          { key: "spraying", path: "/dashboard/perawatan/semprot" },
          { key: "emptyBunches", path: "/dashboard/perawatan/jangkos" },
        ],
      },
    ],
  },
  {
    key: "analytics",
    icon: <PieChartIcon className="size-6" />,
    path: "/grafik-analitik",
    subItems: [
      { key: "analyticsProduction", path: "/grafik-analitik/produksi" },
      {
        key: "analyticsMaintenance",
        path: "/grafik-analitik/perawatan",
        subItems: [
          { key: "analyticsPruning", path: "/grafik-analitik/perawatan/pruning" },
          { key: "analyticsPikul", path: "/grafik-analitik/perawatan/pasar-pikul" },
          { key: "analyticsFertilizing", path: "/grafik-analitik/perawatan/pemupukan" },
          { key: "analyticsSpraying", path: "/grafik-analitik/perawatan/semprot" },
          { key: "analyticsEmptyBunches", path: "/grafik-analitik/perawatan/jangkos" },
        ],
      },
    ],
  },
  {
    key: "mapTicketing",
    icon: <MapIcon className="size-6" />,
    path: "/ticketing-update-peta",
  },
  {
    key: "rekapPekerjaan",
    icon: <ListIcon className="size-6" />,
    path: "/rekap-pekerjaan",
    subItems: [
      {
        key: "pekerjaanRutin",
        path: "/rekap-pekerjaan/pekerjaan-rutin",
        subItems: [
          { key: "pruning", path: "/rekap-pekerjaan/pekerjaan-rutin/pruning" },
          { key: "pemupukan", path: "/rekap-pekerjaan/pekerjaan-rutin/pemupukan" },
          { key: "pasarPikul", path: "/rekap-pekerjaan/pekerjaan-rutin/pasar-pikul" },
          { key: "jangkos", path: "/rekap-pekerjaan/pekerjaan-rutin/jangkos" },
          { key: "semprot", path: "/rekap-pekerjaan/pekerjaan-rutin/semprot" },
        ],
      },
      {
        key: "persiapanLahan",
        path: "/rekap-pekerjaan/persiapan-lahan",
        subItems: [
          { key: "grtt", path: "/rekap-pekerjaan/persiapan-lahan/grtt" },
          { key: "landClearing", path: "/rekap-pekerjaan/persiapan-lahan/land-clearing" },
          { key: "tanam", path: "/rekap-pekerjaan/persiapan-lahan/tanam" },
        ],
      },
      {
        key: "updateAresta",
        path: "/rekap-pekerjaan/update-aresta",
        subItems: [
          { key: "sensusPokok", path: "/rekap-pekerjaan/update-aresta/sensus-pokok" },
          { key: "sisipan", path: "/rekap-pekerjaan/update-aresta/sisipan" },
          { key: "perubahanBlok", path: "/rekap-pekerjaan/update-aresta/perubahan-blok" },
        ],
      },
      {
        key: "infrastruktur",
        path: "/rekap-pekerjaan/infrastruktur",
        subItems: [
          { key: "jalan", path: "/rekap-pekerjaan/infrastruktur/jalan" },
          { key: "jembatanGorongGorong", path: "/rekap-pekerjaan/infrastruktur/jembatan-gorong-gorong" },
          { key: "paritDrainase", path: "/rekap-pekerjaan/infrastruktur/parit-drainase" },
          { key: "titikTph", path: "/rekap-pekerjaan/infrastruktur/titik-tph" },
        ],
      },
    ],
  },
  {
    key: "operationalData",
    icon: <TableIcon className="size-6" />,
    path: "/data-operasional",
    subItems: [
      { key: "operationalProduction", path: "/data-operasional/produksi" },
      {
        key: "operationalMaintenance",
        path: "/data-operasional/perawatan",
        subItems: [
          { key: "operationalPruning", path: "/data-operasional/perawatan/pruning" },
          { key: "operationalPikul", path: "/data-operasional/perawatan/pasar-pikul" },
          { key: "operationalFertilizing", path: "/data-operasional/perawatan/pemupukan" },
          { key: "operationalSpraying", path: "/data-operasional/perawatan/semprot" },
          { key: "operationalEmptyBunches", path: "/data-operasional/perawatan/jangkos" },
        ],
      },
    ],
  },
  {
    key: "landOpening",
    icon: <LayerIcon className="size-6" />,
    path: "/pembukaan-lahan",
    subItems: [
      { key: "grtt", path: "/pembukaan-lahan/grtt" },
      { key: "laneClearing", path: "/pembukaan-lahan/lane-clearing" },
      { key: "planting", path: "/pembukaan-lahan/penanaman" },
    ],
  },
  {
    key: "assets",
    icon: <BoxIcon className="size-6" />,
    path: "/aset",
    subItems: [
      {
        key: "batasAdministrasi",
        path: "/aset/batas-administrasi",
        subItems: [
          { key: "batasAncak", path: "/aset/batas-administrasi/batas-ancak" },
          { key: "batasBlok", path: "/aset/batas-administrasi/batas-blok" },
          { key: "batasWarung", path: "/aset/batas-administrasi/batas-warung" },
          { key: "batasAfdeling", path: "/aset/batas-administrasi/batas-afdeling" },
          { key: "batasEstate", path: "/aset/batas-administrasi/batas-estate" },
          { key: "batasRegion", path: "/aset/batas-administrasi/batas-region" },
          { key: "batasPt", path: "/aset/batas-administrasi/batas-pt" },
        ],
      },
      {
        key: "pokokSawit",
        path: "/aset/pokok-sawit",
      },
      {
        key: "pmks",
        path: "/aset/pmks",
      },
      {
        key: "emplastment",
        path: "/aset/emplasment",
      },
      {
        key: "pembibitan",
        path: "/aset/pembibitan",
      },
      {
        key: "sungai",
        path: "/aset/sungai",
      },
      {
        key: "topografi",
        path: "/aset/topografi",
      },
      {
        key: "areaKonservasi",
        path: "/aset/area-konservasi",
        subItems: [
          { key: "kuburanSitusBudaya", path: "/aset/area-konservasi/kuburan-situs-budaya" },
          { key: "lokasiMataAir", path: "/aset/area-konservasi/lokasi-mata-air" },
          { key: "sapadanSungai", path: "/aset/area-konservasi/sapadan-sungai" },
          { key: "areaHcv", path: "/aset/area-konservasi/area-hcv" },
        ],
      },
      {
        key: "hirarkiAresta",
        path: "/aset/hirarki-aresta",
      },
    ],
  },
  {
    key: "monitoring",
    icon: <TelescopeIcon className="size-6" />,
    path: "/monitoring",
    subItems: [
      { key: "activityAudit", path: "/monitoring/audit-aktivitas" },
      { key: "notifications", path: "/monitoring/notifikasi" },
    ],
  },
  {
    key: "userManagement",
    icon: <UsersIcon className="size-6" />,
    path: "/manajemen-pengguna",
    subItems: [
      { key: "accountSettings", path: "/manajemen-pengguna/pengaturan-akun" },
    ],
  },
];

export const othersItems: NavItem[] = [];
export const supportItems: NavItem[] = [];

const collectPages = (items: (NavItem | SubItem)[]): { key: string; path: string }[] => {
  const pages: { key: string; path: string }[] = [];
  for (const item of items) {
    if (item.path) {
      pages.push({ key: item.key, path: item.path });
    }
    if (item.subItems) {
      pages.push(...collectPages(item.subItems));
    }
  }
  return pages;
};

const allCollected = collectPages(navItems);
if (!allCollected.some((p) => p.path === "/pengaturan-akun")) {
  allCollected.push({ key: "accountSettings", path: "/pengaturan-akun" });
}

export const workspacePages = Array.from(
  new Map(allCollected.map((page) => [page.path, page])).values(),
);
