import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import { Card } from "@/components/ui/card";
import { useTranslations } from "@/i18n";
import { PageIcon } from "@/icons";
import { useLocation } from "react-router";

export default function WorkspacePage() {
  const t = useTranslations("sidebar.items");
  const { pathname } = useLocation();
  const slug = pathname.split("/").filter(Boolean).at(-1) ?? "welcome";
  const pageKeys: Record<string, string> = {
    "selamat-datang": "welcome",
    dashboard: "dashboard",
    produksi: "production",
    perawatan: "maintenance",
    pruning: "pruning",
    "pasar-pikul": "pikulRoad",
    pemupukan: "fertilizing",
    semprot: "spraying",
    jangkos: "emptyBunches",
    "grafik-analitik": "analytics",
    "ticketing-update-peta": "mapTicketing",
    "rekap-pekerjaan": "rekapPekerjaan",
    "pekerjaan-rutin": "pekerjaanRutin",
    "persiapan-lahan": "persiapanLahan",
    "land-clearing": "landClearing",
    tanam: "tanam",
    "update-aresta": "updateAresta",
    "sensus-pokok": "sensusPokok",
    sisipan: "sisipan",
    "perubahan-blok": "perubahanBlok",
    infrastruktur: "infrastruktur",
    jalan: "jalan",
    "jembatan-gorong-gorong": "jembatanGorongGorong",
    "parit-drainase": "paritDrainase",
    "titik-tph": "titikTph",
    "data-operasional": "operationalData",
    "pembukaan-lahan": "landOpening",
    grtt: "grtt",
    "lane-clearing": "laneClearing",
    penanaman: "planting",
    aset: "assets",
    "batas-administrasi": "batasAdministrasi",
    "batas-ancak": "batasAncak",
    "batas-blok": "batasBlok",
    "batas-warung": "batasWarung",
    "batas-afdeling": "batasAfdeling",
    "batas-estate": "batasEstate",
    "batas-region": "batasRegion",
    "batas-pt": "batasPt",
    "pokok-sawit": "pokokSawit",
    pmks: "pmks",
    emplastment: "emplastment",
    emplasment: "emplastment",
    gudang: "gudang",
    workshop: "workshop",
    "tempat-ibadah": "tempatIbadah",
    mess: "mess",
    sekolah: "sekolah",
    kantor: "kantor",
    pembibitan: "pembibitan",
    sungai: "sungai",
    topografi: "topografi",
    "tanah-topografi": "tanahTopografi",
    ringan: "ringan",
    sedang: "sedang",
    berat: "berat",
    "area-konservasi": "areaKonservasi",
    "kuburan-situs-budaya": "kuburanSitusBudaya",
    "lokasi-mata-air": "lokasiMataAir",
    "sapadan-sungai": "sapadanSungai",
    "area-hcv": "areaHcv",
    hirarki: "hirarki",
    "hirarki-aresta": "hirarkiAresta",
    "wilayah-kebun": "estateAreas",
    "kendaraan-alat": "vehicles",
    monitoring: "monitoring",
    "audit-aktivitas": "activityAudit",
    notifikasi: "notifications",
    "manajemen-pengguna": "userManagement",
    "pengaturan-akun": "accountSettings",
    pengaturan: "settings",
    "update-data-kebun": "estateDataUpdate",
  };
  const pageKey = pageKeys[slug] ?? "welcome";
  const title = t(pageKey);

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbTrail = segments
    .map((seg) => t(pageKeys[seg] ?? seg))
    .join(" / ");

  return (
    <div>
      <PageMeta
        title={`${title} | GIS Departemen`}
        description={`Halaman ${title} GIS Departemen`}
      />
      <PageBreadcrumb pageTitle={title} />

      <Card className="flex min-h-[440px] items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-none dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mx-auto max-w-lg">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 ring-8 ring-brand-50/50 dark:bg-brand-500/10 dark:text-brand-400 dark:ring-brand-500/5">
            <PageIcon className="size-8" />
          </div>
          {breadcrumbTrail && (
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <span>{breadcrumbTrail}</span>
            </div>
          )}
          <h3 className="mb-2 text-2xl font-bold text-gray-800 dark:text-white/90">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            Halaman ini masih kosong. Silakan tambahkan komponen atau integrasikan data operasional GIS Departemen untuk modul{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {title}
            </span>
            .
          </p>
        </div>
      </Card>
    </div>
  );
}
