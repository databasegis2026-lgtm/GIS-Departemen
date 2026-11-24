import type { OperationalModuleOption } from "./types";

export interface ModuleInfo {
  key: OperationalModuleOption;
  name: string;
  shortName: string;
  unit: string;
  pageTitle: string;
  breadcrumb: string;
  themeColor: string;
  metric1: {
    title: string;
    subtext: string;
  };
  metric2: {
    title: string;
    subtext: string;
  };
  metric3: {
    title: string;
    subtext: string;
  };
  metric4: {
    title: string;
    subtext: string;
  };
}

export const MODULE_CONFIGS: Record<OperationalModuleOption, ModuleInfo> = {
  semua: {
    key: "semua",
    name: "Dashboard Operasional",
    shortName: "Semua",
    unit: "Ha",
    pageTitle: "Dashboard Operasional",
    breadcrumb: "Dashboard Operasional",
    themeColor: "#10B981",
    metric1: {
      title: "Luas Total",
      subtext: "Areal Kebun",
    },
    metric2: {
      title: "Realisasi Operasional",
      subtext: "Kumulatif Fisik",
    },
    metric3: {
      title: "Produksi TBS",
      subtext: "Hasil Panen",
    },
    metric4: {
      title: "Rata-rata Capaian",
      subtext: "Target 2026",
    },
  },
  produksi: {
    key: "produksi",
    name: "Dashboard Produksi",
    shortName: "Produksi",
    unit: "Ton",
    pageTitle: "Dashboard Produksi",
    breadcrumb: "Produksi",
    themeColor: "#F97316",
    metric1: {
      title: "Target Produksi",
      subtext: "Estimasi Budget",
    },
    metric2: {
      title: "Realisasi Produksi",
      subtext: "TBS Terkirim",
    },
    metric3: {
      title: "Kerapatan Panen (AKP)",
      subtext: "Rata-rata Blok",
    },
    metric4: {
      title: "Capaian Produksi",
      subtext: "Persentase Target",
    },
  },
  pruning: {
    key: "pruning",
    name: "Dashboard Pruning",
    shortName: "Pruning",
    unit: "Ha",
    pageTitle: "Dashboard Pruning",
    breadcrumb: "Pruning",
    themeColor: "#008000",
    metric1: {
      title: "Target Pruning",
      subtext: "Luas Rencana",
    },
    metric2: {
      title: "Realisasi Pruning",
      subtext: "Luas Selesai",
    },
    metric3: {
      title: "Estimasi Pokok",
      subtext: "Pokok Ditunas",
    },
    metric4: {
      title: "Capaian Pruning",
      subtext: "Persentase Target",
    },
  },
  pasar_pikul: {
    key: "pasar_pikul",
    name: "Dashboard Pasar Pikul",
    shortName: "Pasar Pikul",
    unit: "Ha",
    pageTitle: "Dashboard Pasar Pikul",
    breadcrumb: "Pasar Pikul",
    themeColor: "#00B050",
    metric1: {
      title: "Target Area",
      subtext: "Luas Rencana",
    },
    metric2: {
      title: "Realisasi Cuci",
      subtext: "Luas Selesai",
    },
    metric3: {
      title: "Panjang Jalur",
      subtext: "Jalur Terbuka",
    },
    metric4: {
      title: "Capaian Akses",
      subtext: "Persentase Target",
    },
  },
  pemupukan: {
    key: "pemupukan",
    name: "Dashboard Pemupukan",
    shortName: "Pemupukan",
    unit: "Ha",
    pageTitle: "Dashboard Pemupukan",
    breadcrumb: "Pemupukan",
    themeColor: "#0099FF",
    metric1: {
      title: "Target Pemupukan",
      subtext: "Luas Rencana",
    },
    metric2: {
      title: "Realisasi Tebar",
      subtext: "Luas Selesai",
    },
    metric3: {
      title: "Luas Terpupuk",
      subtext: "Kumulatif Fisik",
    },
    metric4: {
      title: "Capaian Pemupukan",
      subtext: "Persentase Target",
    },
  },
  semprot: {
    key: "semprot",
    name: "Dashboard Semprot",
    shortName: "Semprot",
    unit: "Ha",
    pageTitle: "Dashboard Semprot",
    breadcrumb: "Semprot",
    themeColor: "#0099FF",
    metric1: {
      title: "Target Semprot",
      subtext: "Luas Rencana",
    },
    metric2: {
      title: "Realisasi Semprot",
      subtext: "Luas Selesai",
    },
    metric3: {
      title: "Rotasi Gulma",
      subtext: "Rotasi Selesai",
    },
    metric4: {
      title: "Capaian Semprot",
      subtext: "Persentase Target",
    },
  },
  jangkos: {
    key: "jangkos",
    name: "Dashboard Jangkos",
    shortName: "Jangkos",
    unit: "Ha",
    pageTitle: "Dashboard Jangkos",
    breadcrumb: "Jangkos",
    themeColor: "#0020C2",
    metric1: {
      title: "Target Area",
      subtext: "Luas Rencana",
    },
    metric2: {
      title: "Realisasi Sebar",
      subtext: "Luas Selesai",
    },
    metric3: {
      title: "Luas Tercover",
      subtext: "Gawangan Mati",
    },
    metric4: {
      title: "Capaian Aplikasi",
      subtext: "Persentase Target",
    },
  },
};
