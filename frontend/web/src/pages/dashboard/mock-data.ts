import type {
  AfdelingPerformanceItem,
  BlockDecisionItem,
  DashboardBlockItem,
  DashboardFilterState,
  DecisionMatrixResult,
  EstatePerformanceItem,
  OperationalModuleOption,
  QuarterOption,
  RegionPerformanceItem,
} from "./types";

export interface GeoPolygonFeature {
  id: string;
  name: string;
  company: "PT BUM" | "BSL";
  region: "REGION 1" | "REGION 2" | "REGION 3";
  estate: string;
  afdeling?: string;
  blok?: string;
  warung?: string;
  luasHa: number;
  realisasiHa: number;
  capaianPct: number;
  sph: number;
  kondisi: string;
  warnaHex: string;
  coordinates: [number, number][]; // [lat, lng] for Leaflet
  geojsonCoordinates: [number, number][][]; // [lng, lat] for GeoJSON
}

export function getModuleColors(moduleOption?: OperationalModuleOption) {
  const mod = moduleOption || "semua";
  switch (mod) {
    case "produksi":
      return { targetColor: "#0000FF", realisasiColor: "#F97316" };
    case "pruning":
      return { targetColor: "#94A3B8", realisasiColor: "#008000" };
    case "pasar_pikul":
      return { targetColor: "#94A3B8", realisasiColor: "#00B050" };
    case "pemupukan":
      return { targetColor: "#94A3B8", realisasiColor: "#00FF80" };
    case "semprot":
      return { targetColor: "#94A3B8", realisasiColor: "#0099FF" };
    case "jangkos":
      return { targetColor: "#FFFF00", realisasiColor: "#0020C2" };
    default:
      return { targetColor: "#94A3B8", realisasiColor: "#10B981" };
  }
}

export function getConditionColor(
  capaianPct: number,
  moduleOption?: OperationalModuleOption
): {
  hex: string;
  kondisi: string;
  badgeClass: string;
} {
  const mod = moduleOption || "semua";

  if (mod === "produksi") {
    if (capaianPct >= 50) {
      return {
        hex: "#F97316",
        kondisi: "Realisasi",
        badgeClass: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300",
      };
    }
    return {
      hex: "#0000FF",
      kondisi: "Rencana",
      badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
    };
  }

  if (mod === "pruning") {
    if (capaianPct >= 95) {
      return { hex: "#008000", kondisi: "Progresif", badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" };
    }
    if (capaianPct >= 85) {
      return { hex: "#7BF09B", kondisi: "Ringan", badgeClass: "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300" };
    }
    if (capaianPct >= 70) {
      return { hex: "#5B5B24", kondisi: "BAPP", badgeClass: "bg-yellow-100 text-yellow-900 dark:bg-yellow-950/60 dark:text-yellow-300" };
    }
    if (capaianPct >= 45) {
      return { hex: "#FFFF00", kondisi: "Sedang", badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" };
    }
    return { hex: "#FF8DA1", kondisi: "Berat", badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300" };
  }

  if (mod === "pasar_pikul") {
    if (capaianPct >= 95) {
      return { hex: "#7BF09B", kondisi: "Ringan", badgeClass: "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300" };
    }
    if (capaianPct >= 85) {
      return { hex: "#00B050", kondisi: "BAPP", badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" };
    }
    if (capaianPct >= 60) {
      return { hex: "#FFFF00", kondisi: "Sedang", badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" };
    }
    if (capaianPct >= 35) {
      return { hex: "#FF8DA1", kondisi: "Berat", badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300" };
    }
    return { hex: "#FF0000", kondisi: "Brushing", badgeClass: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300" };
  }

  if (mod === "pemupukan") {
    if (capaianPct >= 85) {
      return { hex: "#0099FF", kondisi: "Rotasi 3", badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300" };
    }
    if (capaianPct >= 60) {
      return { hex: "#00FF80", kondisi: "Rotasi 2", badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" };
    }
    return { hex: "#86EFAC", kondisi: "Rotasi 1", badgeClass: "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300" };
  }

  if (mod === "semprot") {
    if (capaianPct >= 85) {
      return { hex: "#FF9900", kondisi: "Rotasi 3", badgeClass: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300" };
    }
    if (capaianPct >= 60) {
      return { hex: "#FFFF00", kondisi: "Rotasi 2", badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" };
    }
    if (capaianPct >= 35) {
      return { hex: "#0099FF", kondisi: "Rotasi 1", badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300" };
    }
    return { hex: "#94A3B8", kondisi: "Belum Semprot", badgeClass: "bg-slate-100 text-slate-800 dark:bg-slate-950/60 dark:text-slate-300" };
  }

  if (mod === "jangkos") {
    if (capaianPct >= 85) {
      return { hex: "#0020C2", kondisi: "Aplikasi Jangkos di dalam lahan kritis", badgeClass: "bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300" };
    }
    if (capaianPct >= 60) {
      return { hex: "#00FF00", kondisi: "Aplikasi Jangkos di luar lahan kritis", badgeClass: "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300" };
    }
    if (capaianPct >= 35) {
      return { hex: "#FFFF00", kondisi: "Rencana", badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" };
    }
    return { hex: "#FF8DA1", kondisi: "Lahan Kritis", badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300" };
  }

  // Standar / Semua (Default Operasional)
  if (capaianPct >= 95) {
    return { hex: "#00B050", kondisi: "BAPP", badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" };
  }
  if (capaianPct >= 85) {
    return { hex: "#7BF09B", kondisi: "Ringan", badgeClass: "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300" };
  }
  if (capaianPct >= 60) {
    return { hex: "#FFFF00", kondisi: "Sedang", badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" };
  }
  if (capaianPct >= 35) {
    return { hex: "#FF8DA1", kondisi: "Berat", badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300" };
  }
  return { hex: "#FF0000", kondisi: "Brushing", badgeClass: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300" };
}

// Standar Palet Warna Kondisi 2026
export const KONDISI_COLORS: Record<string, { hex: string; label: string; textClass: string; bgClass: string }> = {
  BAPP: {
    hex: "#15803D",
    label: "BAPP (Selesai ≥95%)",
    textClass: "text-emerald-800 dark:text-emerald-300",
    bgClass: "bg-emerald-100 dark:bg-emerald-950/40",
  },
  Ringan: {
    hex: "#4ADE80",
    label: "Ringan (85-94%)",
    textClass: "text-green-800 dark:text-green-300",
    bgClass: "bg-green-100 dark:bg-green-950/40",
  },
  Sedang: {
    hex: "#FBBF24",
    label: "Sedang (60-84%)",
    textClass: "text-amber-800 dark:text-amber-300",
    bgClass: "bg-amber-100 dark:bg-amber-950/40",
  },
  Berat: {
    hex: "#FB7185",
    label: "Berat (35-59%)",
    textClass: "text-rose-800 dark:text-rose-300",
    bgClass: "bg-rose-100 dark:bg-rose-950/40",
  },
  Brushing: {
    hex: "#EF4444",
    label: "Brushing (<35%)",
    textClass: "text-red-800 dark:text-red-300",
    bgClass: "bg-red-100 dark:bg-red-950/40",
  },
};

// Comprehensive Dataset: Blocks for every Estate with varied achievement for Top 3 and Bottom 3 rankings
export const MOCK_BLOCK_DATA: DashboardBlockItem[] = [];

export const MOCK_ESTATE_POLYGONS: GeoPolygonFeature[] = [];

export const MOCK_OPERATIONAL_BLOCK_POLYGONS: GeoPolygonFeature[] = [];

export function getYearScale(year: number): number {
  switch (year) {
    case 2024:
      return 0.88;
    case 2025:
      return 0.94;
    case 2026:
      return 1.0;
    case 2027:
      return 1.07;
    case 2028:
      return 1.15;
    default:
      return 1.0 + (year - 2026) * 0.06;
  }
}

export function getQuarterScale(quarter?: QuarterOption): number {
  switch (quarter) {
    case "Q1":
      return 0.95;
    case "Q2":
      return 1.02;
    case "Q3":
      return 0.98;
    case "Q4":
      return 1.05;
    default:
      return 1.0;
  }
}

// Helper: Filter metrics dynamically according to filter state
export function getFilteredMetrics(filters: DashboardFilterState) {
  let estates = MOCK_ESTATE_POLYGONS;

  if (filters.company === "BSL") {
    estates = estates.filter((e) => e.company === "BSL");
  } else if (filters.company === "PT_BUM") {
    estates = estates.filter((e) => e.company === "PT BUM");
  }

  if (filters.region !== "Semua") {
    estates = estates.filter((e) => e.region === filters.region);
  }

  if (filters.estate !== "Semua") {
    estates = estates.filter((e) => e.estate === filters.estate);
  }

  const yScale = getYearScale(filters.year);
  const qScale = getQuarterScale(filters.quarter);

  const totalLuasHa = Math.round(estates.reduce((acc, curr) => acc + curr.luasHa, 0) * yScale);
  const totalRealisasiHa = Math.round(estates.reduce((acc, curr) => acc + curr.realisasiHa, 0) * yScale * qScale);
  const totalProduksiTon = Math.round(totalRealisasiHa * 0.59);
  const avgCapaian = totalLuasHa > 0 ? (totalRealisasiHa / totalLuasHa) * 100 : 0;
  const sphCompliance = 98.4;

  return {
    totalLuasHa,
    totalRealisasiHa,
    totalProduksiTon,
    avgCapaian,
    sphCompliance,
    totalEstates: estates.length,
  };
}

// Helper: Get Regional performance data for bar chart
export function getRegionalData(filters: DashboardFilterState): RegionPerformanceItem[] {
  const yScale = getYearScale(filters.year);
  const qScale = getQuarterScale(filters.quarter);

  let regions: RegionPerformanceItem[] = [
    {
      id: "reg-1",
      name: "REGION 1",
      company: "PT BUM",
      estates: ["BUM 1", "BUM 2", "BUM 4"],
      totalLuasHa: Math.round(6810 * yScale),
      realisasiHa: Math.round(6280 * yScale * qScale),
      capaianPct: Math.min(100, Number(((6280 * qScale / 6810) * 100).toFixed(1))),
      kondisi: "Ringan",
      warnaHex: "#7BF09B",
    },
    {
      id: "reg-2",
      name: "REGION 2",
      company: "PT BUM",
      estates: ["BUM 5", "BUM 6", "BUM 7"],
      totalLuasHa: Math.round(6790 * yScale),
      realisasiHa: Math.round(5439 * yScale * qScale),
      capaianPct: Math.min(100, Number(((5439 * qScale / 6790) * 100).toFixed(1))),
      kondisi: "Sedang",
      warnaHex: "#FFFF00",
    },
    {
      id: "reg-3",
      name: "REGION 3 (BUM)",
      company: "PT BUM",
      estates: ["BUM 3", "BUM 8"],
      totalLuasHa: Math.round(4850 * yScale),
      realisasiHa: Math.round(4459 * yScale * qScale),
      capaianPct: Math.min(100, Number(((4459 * qScale / 4850) * 100).toFixed(1))),
      kondisi: "Ringan",
      warnaHex: "#7BF09B",
    },
    {
      id: "reg-bsl",
      name: "BSL",
      company: "BSL",
      estates: ["BSL"],
      totalLuasHa: Math.round(2100 * yScale),
      realisasiHa: Math.round(1932 * yScale * qScale),
      capaianPct: Math.min(100, Number(((1932 * qScale / 2100) * 100).toFixed(1))),
      kondisi: "Ringan",
      warnaHex: "#7BF09B",
    },
  ];

  if (filters.company === "BSL") {
    regions = regions.filter((r) => r.company === "BSL");
  } else if (filters.company === "PT_BUM") {
    regions = regions.filter((r) => r.company === "PT BUM");
  }

  if (filters.region !== "Semua") {
    regions = regions.filter((r) => r.name.includes(filters.region));
  }

  // Petakan warna dan kondisi dinamis sesuai module/aktivitas yang dipilih
  return regions.map((r) => {
    const colorInfo = getConditionColor(r.capaianPct, filters.module);
    return {
      ...r,
      kondisi: colorInfo.kondisi,
      warnaHex: colorInfo.hex,
    };
  });
}

// Helper: Get Estate performance data for bar chart
export function getEstateData(filters: DashboardFilterState): EstatePerformanceItem[] {
  const yScale = getYearScale(filters.year);
  const qScale = getQuarterScale(filters.quarter);

  let estates = MOCK_ESTATE_POLYGONS.map((e) => {
    const adjLuas = Math.round(e.luasHa * yScale);
    const adjReal = Math.round(e.realisasiHa * yScale * qScale);
    const adjPct = adjLuas > 0 ? Math.min(100, Number(((adjReal / adjLuas) * 100).toFixed(1))) : 0;
    const colorInfo = getConditionColor(adjPct, filters.module);
    return {
      id: e.id,
      name: e.name,
      company: e.company,
      region: e.region,
      totalLuasHa: adjLuas,
      realisasiHa: adjReal,
      capaianPct: adjPct,
      kondisi: colorInfo.kondisi,
      warnaHex: colorInfo.hex,
    };
  });

  if (filters.company === "BSL") {
    estates = estates.filter((e) => e.company === "BSL");
  } else if (filters.company === "PT_BUM") {
    estates = estates.filter((e) => e.company === "PT BUM");
  }

  if (filters.region !== "Semua") {
    estates = estates.filter((e) => e.region === filters.region);
  }

  return estates;
}

// Helper: Get Afdelings for a selected estate
export function getAfdelingData(estateName: string, moduleOption?: OperationalModuleOption): AfdelingPerformanceItem[] {
  // Pre-configured afdeling data per estate
  const afdelingMap: Record<string, { afd: string; pct: number; luas: number }[]> = {
    "BUM 1": [
      { afd: "Afdeling 1", pct: 98.5, luas: 490 },
      { afd: "Afdeling 2", pct: 92.0, luas: 480 },
      { afd: "Afdeling 3", pct: 87.5, luas: 510 },
      { afd: "Afdeling 4", pct: 75.0, luas: 470 },
      { afd: "Afdeling 5", pct: 55.0, luas: 500 },
    ],
    "BUM 2": [
      { afd: "Afdeling 6", pct: 97.5, luas: 450 },
      { afd: "Afdeling 7", pct: 95.0, luas: 430 },
      { afd: "Afdeling 8", pct: 88.0, luas: 460 },
      { afd: "Afdeling 9", pct: 63.0, luas: 440 },
      { afd: "Afdeling 10", pct: 40.0, luas: 430 },
    ],
    "BUM 4": [
      { afd: "Afdeling 11", pct: 100, luas: 420 },
      { afd: "Afdeling 12", pct: 96.0, luas: 440 },
      { afd: "Afdeling 13", pct: 90.0, luas: 430 },
      { afd: "Afdeling 14", pct: 72.0, luas: 410 },
      { afd: "Afdeling 15", pct: 48.0, luas: 450 },
    ],
    "BUM 5": [
      { afd: "Afdeling 16", pct: 98.0, luas: 460 },
      { afd: "Afdeling 17", pct: 92.0, luas: 470 },
      { afd: "Afdeling 18", pct: 88.0, luas: 450 },
      { afd: "Afdeling 19", pct: 64.0, luas: 460 },
      { afd: "Afdeling 20", pct: 45.0, luas: 480 },
    ],
    BSL: [
      { afd: "Afdeling 1", pct: 100, luas: 520 },
      { afd: "Afdeling 2", pct: 93.0, luas: 530 },
      { afd: "Afdeling 3", pct: 85.0, luas: 510 },
      { afd: "Afdeling 4", pct: 52.0, luas: 540 },
    ],
  };

  const list = afdelingMap[estateName] || [
    { afd: "Afdeling 1", pct: 95.0, luas: 450 },
    { afd: "Afdeling 2", pct: 88.0, luas: 460 },
    { afd: "Afdeling 3", pct: 78.0, luas: 440 },
    { afd: "Afdeling 4", pct: 60.0, luas: 450 },
  ];

  return list.map((item) => {
    const colorInfo = getConditionColor(item.pct, moduleOption);
    return {
      afdeling: item.afd,
      estate: estateName,
      region: "REGION",
      luasHa: item.luas,
      realisasiHa: Math.round(item.luas * (item.pct / 100)),
      capaianPct: item.pct,
      kondisi: colorInfo.kondisi,
      warnaHex: colorInfo.hex,
    };
  });
}

// Helper: Get Top 3 and Bottom 3 blocks for a selected estate
export function getBlockRankings(estateName: string, moduleOption?: OperationalModuleOption) {
  const blocks = MOCK_BLOCK_DATA.filter((b) => b.estate === estateName).map((b) => {
    const colorInfo = getConditionColor(b.capaianPct, moduleOption);
    return {
      ...b,
      kondisi: colorInfo.kondisi,
      warnaHex: colorInfo.hex,
    };
  });
  const sorted = [...blocks].sort((a, b) => b.capaianPct - a.capaianPct);

  const top3 = sorted.slice(0, 3);
  const bottom3 = sorted.length >= 6 ? sorted.slice(-3).reverse() : sorted.slice(Math.max(0, sorted.length - 3)).reverse();

  return {
    top3,
    bottom3,
    all: sorted,
  };
}

// Helper: Get dynamic map features with accurate colors for the active module
export function getMapFeatures(filters: DashboardFilterState) {
  let estates = MOCK_ESTATE_POLYGONS.map((e) => {
    const colorInfo = getConditionColor(e.capaianPct, filters.module);
    return {
      ...e,
      kondisi: colorInfo.kondisi,
      warnaHex: colorInfo.hex,
    };
  });

  let blocks = MOCK_OPERATIONAL_BLOCK_POLYGONS.map((b) => {
    const colorInfo = getConditionColor(b.capaianPct, filters.module);
    return {
      ...b,
      kondisi: colorInfo.kondisi,
      warnaHex: colorInfo.hex,
    };
  });

  if (filters.company === "BSL") {
    estates = estates.filter((e) => e.company === "BSL");
    blocks = blocks.filter((b) => b.company === "BSL");
  } else if (filters.company === "PT_BUM") {
    estates = estates.filter((e) => e.company === "PT BUM");
    blocks = blocks.filter((b) => b.company === "PT BUM");
  }

  if (filters.region !== "Semua") {
    estates = estates.filter((e) => e.region === filters.region);
    blocks = blocks.filter((b) => b.region === filters.region);
  }

  if (filters.estate !== "Semua") {
    blocks = blocks.filter((b) => b.estate === filters.estate);
  }

  return { estates, blocks };
}

// Helper: Calculate Condition Distribution sesuai unggahan tabel warna operasional 2026
export function getStatusDistribution(filters: DashboardFilterState) {
  const { totalLuasHa } = getFilteredMetrics(filters);
  const mod = filters.module || "semua";

  if (mod === "produksi") {
    // Unggahan 1: Produksi (Rencana #0000FF, Realisasi #F97316)
    return [
      {
        kondisi: "Rencana",
        label: "Rencana",
        kategori: "PBLK" as const,
        pct: 52.2,
        luasHa: Math.round(totalLuasHa * 0.522),
        warnaHex: "#0000FF",
      },
      {
        kondisi: "Realisasi",
        label: "Realisasi",
        kategori: "PBLH" as const,
        pct: 47.8,
        luasHa: Math.round(totalLuasHa * 0.478),
        warnaHex: "#F97316",
      },
    ];
  }

  if (mod === "pruning") {
    // Unggahan 2: Pruning (Berat #FF8DA1, Sedang #FFFF00, BAPP #5B5B24, Ringan #7BF09B, Progresif #008000)
    return [
      {
        kondisi: "Berat",
        label: "Berat",
        kategori: "PBLK" as const,
        pct: 12.5,
        luasHa: Math.round(totalLuasHa * 0.125),
        warnaHex: "#FF8DA1",
      },
      {
        kondisi: "Sedang",
        label: "Sedang",
        kategori: "PBLK" as const,
        pct: 24.0,
        luasHa: Math.round(totalLuasHa * 0.24),
        warnaHex: "#FFFF00",
      },
      {
        kondisi: "BAPP",
        label: "BAPP",
        kategori: "PBLH" as const,
        pct: 18.5,
        luasHa: Math.round(totalLuasHa * 0.185),
        warnaHex: "#5B5B24",
      },
      {
        kondisi: "Ringan",
        label: "Ringan",
        kategori: "PBLH" as const,
        pct: 31.0,
        luasHa: Math.round(totalLuasHa * 0.31),
        warnaHex: "#7BF09B",
      },
      {
        kondisi: "Progresif",
        label: "Progresif",
        kategori: "PBLH" as const,
        pct: 14.0,
        luasHa: Math.round(totalLuasHa * 0.14),
        warnaHex: "#008000",
      },
    ];
  }

  if (mod === "pasar_pikul") {
    // Unggahan 3: Pasar Pikul (Brushing #FF0000, Berat #FF8DA1, Sedang #FFFF00, BAPP #00B050, Ringan #7BF09B)
    return [
      {
        kondisi: "Brushing",
        label: "Brushing",
        kategori: "PBLK" as const,
        pct: 8.5,
        luasHa: Math.round(totalLuasHa * 0.085),
        warnaHex: "#FF0000",
      },
      {
        kondisi: "Berat",
        label: "Berat",
        kategori: "PBLK" as const,
        pct: 14.2,
        luasHa: Math.round(totalLuasHa * 0.142),
        warnaHex: "#FF8DA1",
      },
      {
        kondisi: "Sedang",
        label: "Sedang",
        kategori: "PBLK" as const,
        pct: 22.8,
        luasHa: Math.round(totalLuasHa * 0.228),
        warnaHex: "#FFFF00",
      },
      {
        kondisi: "BAPP",
        label: "BAPP",
        kategori: "PBLH" as const,
        pct: 34.5,
        luasHa: Math.round(totalLuasHa * 0.345),
        warnaHex: "#00B050",
      },
      {
        kondisi: "Ringan",
        label: "Ringan",
        kategori: "PBLH" as const,
        pct: 20.0,
        luasHa: Math.round(totalLuasHa * 0.2),
        warnaHex: "#7BF09B",
      },
    ];
  }

  if (mod === "pemupukan") {
    // Unggahan 4: Pemupukan (Rotasi 1-3 semuanya masuk PBLH)
    return [
      {
        kondisi: "Rotasi 1",
        label: "Rotasi 1",
        kategori: "PBLH" as const,
        pct: 42.0,
        luasHa: Math.round(totalLuasHa * 0.42),
        warnaHex: "#86EFAC",
      },
      {
        kondisi: "Rotasi 2",
        label: "Rotasi 2",
        kategori: "PBLH" as const,
        pct: 36.5,
        luasHa: Math.round(totalLuasHa * 0.365),
        warnaHex: "#00FF80",
      },
      {
        kondisi: "Rotasi 3",
        label: "Rotasi 3",
        kategori: "PBLH" as const,
        pct: 21.5,
        luasHa: Math.round(totalLuasHa * 0.215),
        warnaHex: "#0099FF",
      },
    ];
  }

  if (mod === "semprot") {
    // Unggahan 5: Semprot (Rotasi 1 #0099FF, Rotasi 2 #FFFF00, Rotasi 3 #FF9900, Belum Semprot #94A3B8)
    return [
      {
        kondisi: "Belum Semprot",
        label: "Belum Semprot",
        kategori: "PBLK" as const,
        pct: 9.5,
        luasHa: Math.round(totalLuasHa * 0.095),
        warnaHex: "#94A3B8",
      },
      {
        kondisi: "Rotasi 1",
        label: "Rotasi 1",
        kategori: "PBLH" as const,
        pct: 38.0,
        luasHa: Math.round(totalLuasHa * 0.38),
        warnaHex: "#0099FF",
      },
      {
        kondisi: "Rotasi 2",
        label: "Rotasi 2",
        kategori: "PBLH" as const,
        pct: 28.5,
        luasHa: Math.round(totalLuasHa * 0.285),
        warnaHex: "#FFFF00",
      },
      {
        kondisi: "Rotasi 3",
        label: "Rotasi 3",
        kategori: "PBLH" as const,
        pct: 24.0,
        luasHa: Math.round(totalLuasHa * 0.24),
        warnaHex: "#FF9900",
      },
    ];
  }

  if (mod === "jangkos") {
    // Unggahan 6: Jangkos (Lahan Kritis #FF8DA1, Rencana #FFFF00, Luar Lahan Kritis #00FF00, Dalam Lahan Kritis #0020C2)
    return [
      {
        kondisi: "Lahan Kritis",
        label: "Lahan Kritis",
        kategori: "PBLK" as const,
        pct: 15.0,
        luasHa: Math.round(totalLuasHa * 0.15),
        warnaHex: "#FF8DA1",
      },
      {
        kondisi: "Rencana",
        label: "Rencana",
        kategori: "PBLK" as const,
        pct: 30.0,
        luasHa: Math.round(totalLuasHa * 0.3),
        warnaHex: "#FFFF00",
      },
      {
        kondisi: "Aplikasi Jangkos di luar lahan kritis",
        label: "Luar Lahan Kritis",
        kategori: "PBLH" as const,
        pct: 28.0,
        luasHa: Math.round(totalLuasHa * 0.28),
        warnaHex: "#00FF00",
      },
      {
        kondisi: "Aplikasi Jangkos di dalam lahan kritis",
        label: "Dalam Lahan Kritis",
        kategori: "PBLH" as const,
        pct: 27.0,
        luasHa: Math.round(totalLuasHa * 0.27),
        warnaHex: "#0020C2",
      },
    ];
  }

  // Default / Semua: Kondisi Standar 2026
  return [
    { kondisi: "Brushing", label: "Brushing (<35%)", kategori: "PBLK" as const, pct: 1.8, luasHa: Math.round(totalLuasHa * 0.018), warnaHex: "#EF4444" },
    { kondisi: "Berat", label: "Berat (35-59%)", kategori: "PBLK" as const, pct: 3.8, luasHa: Math.round(totalLuasHa * 0.038), warnaHex: "#FB7185" },
    { kondisi: "Sedang", label: "Sedang (60-84%)", kategori: "PBLK" as const, pct: 10.2, luasHa: Math.round(totalLuasHa * 0.102), warnaHex: "#FBBF24" },
    { kondisi: "Ringan", label: "Ringan (85-94%)", kategori: "PBLH" as const, pct: 28.8, luasHa: Math.round(totalLuasHa * 0.288), warnaHex: "#4ADE80" },
    { kondisi: "BAPP", label: "BAPP (≥95%)", kategori: "PBLH" as const, pct: 55.4, luasHa: Math.round(totalLuasHa * 0.554), warnaHex: "#15803D" },
  ];
}

// Helper Functions for Export
export function exportToCSV(data: DashboardBlockItem[], filename = "data-blok-operasional-2026.csv") {
  const headers = [
    "Region",
    "Estate",
    "Afdeling",
    "Blok",
    "Warung",
    "Luas (Ha)",
    "Realisasi Luas (Ha)",
    "Capaian (%)",
    "SPH Standar",
    "Kondisi",
    "Update Peta",
    "Periode",
    "Tanggal",
    "Keterangan",
  ];

  const rows = data.map((item) => [
    `"${item.region}"`,
    `"${item.estate}"`,
    `"${item.afdeling}"`,
    `"${item.blok}"`,
    `"${item.warung}"`,
    item.luasHa.toFixed(1),
    item.realisasiHa.toFixed(1),
    item.capaianPct.toFixed(1),
    item.sph,
    `"${item.kondisi}"`,
    `"${item.updatePeta}"`,
    `"${item.periode}"`,
    `"${item.tanggal}"`,
    `"${item.keterangan.replace(/"/g, '""')}"`,
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToExcelXML(data: DashboardBlockItem[], filename = "data-blok-operasional-2026.xls") {
  const tableContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
          th { background-color: #0F172A; color: #FFFFFF; font-weight: bold; border: 1px solid #CBD5E1; padding: 8px; text-align: left; }
          td { border: 1px solid #CBD5E1; padding: 6px; }
          .num { text-align: right; }
          .center { text-align: center; }
        </style>
      </head>
      <body>
        <h2>DATA OPERASIONAL & GEOSPASIAL 2026 - PT BUM & BSL</h2>
        <table>
          <thead>
            <tr>
              <th>Region</th>
              <th>Estate</th>
              <th>Afdeling</th>
              <th>Blok</th>
              <th>Warung</th>
              <th>Luas (Ha)</th>
              <th>Realisasi Luas (Ha)</th>
              <th>Capaian (%)</th>
              <th>SPH Standar</th>
              <th>Kondisi</th>
              <th>Update Peta</th>
              <th>Periode</th>
              <th>Tanggal</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${data
      .map(
        (item) => `
              <tr>
                <td>${item.region}</td>
                <td>${item.estate}</td>
                <td>${item.afdeling}</td>
                <td>${item.blok}</td>
                <td>${item.warung}</td>
                <td class="num">${item.luasHa.toFixed(1)}</td>
                <td class="num">${item.realisasiHa.toFixed(1)}</td>
                <td class="num">${item.capaianPct.toFixed(1)}%</td>
                <td class="center">${item.sph}</td>
                <td>${item.kondisi}</td>
                <td class="center">${item.updatePeta}</td>
                <td>${item.periode}</td>
                <td>${item.tanggal}</td>
                <td>${item.keterangan}</td>
              </tr>
            `
      )
      .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([tableContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToGeoJSON(estates: GeoPolygonFeature[], blocks: GeoPolygonFeature[], filename = "geospasial-kebun-2026.geojson") {
  const allFeatures = [...estates, ...blocks].map((item) => ({
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: item.geojsonCoordinates,
    },
    properties: {
      id: item.id,
      name: item.name,
      company: item.company,
      region: item.region,
      estate: item.estate,
      afdeling: item.afdeling || null,
      blok: item.blok || null,
      warung: item.warung || null,
      luas_ha: item.luasHa,
      realisasi_ha: item.realisasiHa,
      capaian_pct: item.capaianPct,
      sph: item.sph,
      kondisi: item.kondisi,
      warna_hex: item.warnaHex,
    },
  }));

  const geojson = {
    type: "FeatureCollection",
    name: "Dataset_Geospasial_Operasional_2026",
    crs: {
      type: "name",
      properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" },
    },
    features: allFeatures,
  };

  const jsonString = JSON.stringify(geojson, null, 2);
  const blob = new Blob([jsonString], { type: "application/geo+json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportDashboardToPNG(
  filters: DashboardFilterState,
  filename = "Dashboard-GIS-2026.png"
) {
  const canvas = document.createElement("canvas");
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background
  ctx.fillStyle = "#0F172A"; // Elegant Dark Navy
  ctx.fillRect(0, 0, 1920, 1080);

  // Header Card
  ctx.fillStyle = "#1E293B";
  ctx.beginPath();
  ctx.roundRect(40, 40, 1840, 95, 16);
  ctx.fill();

  // Header Title
  ctx.font = "bold 26px Outfit, sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("GIS DASHBOARD OPERASIONAL KEBUN 2026", 70, 92);

  ctx.font = "15px Outfit, sans-serif";
  ctx.fillStyle = "#94A3B8";
  ctx.fillText(
    `PT BUM (Bangkitgiat Usaha Mandiri) & BSL  •  Filter: ${filters.company} | ${filters.region} | ${filters.estate} | Bulan: ${filters.month}`,
    70,
    118
  );

  // Date Tag
  const todayStr = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  ctx.font = "bold 15px Outfit, sans-serif";
  ctx.fillStyle = "#10B981";
  ctx.fillText(todayStr, 1580, 100);

  // Map area snapshot
  const leafletCanvas = document.querySelector(".leaflet-container canvas") as HTMLCanvasElement | null;
  if (leafletCanvas) {
    try {
      ctx.drawImage(leafletCanvas, 40, 155, 1200, 885);
    } catch {
      ctx.fillStyle = "#090D16";
      ctx.beginPath();
      ctx.roundRect(40, 155, 1200, 885, 16);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = "#090D16";
    ctx.beginPath();
    ctx.roundRect(40, 155, 1200, 885, 16);
    ctx.fill();
    ctx.fillStyle = "#10B981";
    ctx.font = "bold 24px Outfit, sans-serif";
    ctx.fillText("Peta Geospasial Kebun PT BUM & BSL", 80, 230);
  }

  // Right Side Metrics Card
  ctx.fillStyle = "#1E293B";
  ctx.beginPath();
  ctx.roundRect(1260, 155, 620, 885, 16);
  ctx.fill();

  ctx.font = "bold 22px Outfit, sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("Ringkasan Eksekutif & Kinerja", 1290, 205);

  // Metrics
  const metrics = getFilteredMetrics(filters);
  const metricItems = [
    { label: "Luas Baku GIS Terpantau", val: `${metrics.totalLuasHa.toLocaleString("id-ID")} Ha`, color: "#465FFF" },
    { label: "Estimasi Produksi TBS", val: `${metrics.totalProduksiTon.toLocaleString("id-ID")} Ton`, color: "#10B981" },
    { label: "Realisasi Fisik Kebun", val: `${metrics.totalRealisasiHa.toLocaleString("id-ID")} Ha`, color: "#F59E0B" },
    { label: "Rata-rata Capaian Operasional", val: `${metrics.avgCapaian.toFixed(1)}%`, color: "#8B5CF6" },
  ];

  metricItems.forEach((m, idx) => {
    const y = 245 + idx * 78;
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.roundRect(1290, y, 560, 64, 12);
    ctx.fill();

    ctx.font = "13px Outfit, sans-serif";
    ctx.fillStyle = "#94A3B8";
    ctx.fillText(m.label, 1315, y + 26);

    ctx.font = "bold 20px Outfit, sans-serif";
    ctx.fillStyle = m.color;
    ctx.fillText(m.val, 1315, y + 52);
  });

  // Status distribution
  ctx.font = "bold 18px Outfit, sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("Distribusi Status Kondisi 2026", 1290, 600);

  const distribution = getStatusDistribution(filters);
  distribution.forEach((item, idx) => {
    const y = 630 + idx * 58;
    ctx.fillStyle = item.warnaHex;
    ctx.fillRect(1290, y + 6, 16, 16);

    ctx.font = "bold 14px Outfit, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`${item.label} (${item.kondisi})`, 1320, y + 20);

    ctx.font = "14px Outfit, sans-serif";
    ctx.fillStyle = "#94A3B8";
    ctx.fillText(`${item.luasHa.toLocaleString("id-ID")} Ha  •  ${item.pct}%`, 1640, y + 20);
  });

  // Footer / Watermark
  ctx.font = "12px Outfit, sans-serif";
  ctx.fillStyle = "#64748B";
  ctx.fillText("Ekspor Otomatis WebGIS • GIS Departemen PT BUM & BSL", 1290, 990);

  // Trigger Download
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, "image/png");
}

/**
 * Matriks Keputusan Blok: Mengklasifikasikan blok menjadi Perlu Perhatian vs Perlu Dijaga
 * sesuai standar WebGIS (Decision Matrix)
 */
export function getDecisionMatrixData(filters: DashboardFilterState): DecisionMatrixResult {
  const filtered = MOCK_BLOCK_DATA.filter((b) => {
    if (filters.company === "PT_BUM" && b.region === "REGION 3" && b.estate === "BSL") return false;
    if (filters.company === "BSL" && b.estate !== "BSL") return false;
    if (filters.region !== "Semua" && b.region !== filters.region) return false;
    if (filters.estate !== "Semua" && b.estate !== filters.estate) return false;
    return true;
  });

  const getKendalaAndRekomendasi = (b: DashboardBlockItem, mod: OperationalModuleOption) => {
    if (mod === "produksi") {
      return {
        kendala: "Akses jalan becek & buah restan belum tuntas terangkut ke PKS",
        rekomendasi: "Mobilisasi ekstra dump truck & perbaikan jalur TPH segera",
      };
    }
    if (mod === "pruning") {
      return {
        kendala: "Pelepah sengkleh menumpuk, rasio songgo dua di bawah standar",
        rekomendasi: "Tambah regu tunas intensif & pengawasan pusingan afdeling",
      };
    }
    if (mod === "pemupukan") {
      return {
        kendala: "Aplikasi tertunda curah hujan tinggi, risiko tercuci (leaching)",
        rekomendasi: "Jadwalkan pemupukan susulan pada hari efektif cuaca cerah",
      };
    }
    if (mod === "semprot") {
      return {
        kendala: "Gulma pakisan & kayu-kayuan tebal di piringan/gawangan",
        rekomendasi: "Lakukan rotasi semprot selektif dengan herbisida sistemik",
      };
    }
    if (mod === "pasar_pikul") {
      return {
        kendala: "Pasar pikul tergenang dan rintis terhalang semak gulma",
        rekomendasi: "Normalisasi parit pembuang & pembersihan rintis prioritas",
      };
    }
    if (mod === "jangkos") {
      return {
        kendala: "Areal berpasir/kritis, pasokan mulsa jangkos dari PKS terbatas",
        rekomendasi: "Prioritaskan dropping jangkos di gawangan mati lahan kritis",
      };
    }
    return {
      kendala: b.keterangan || "Realisasi tertinggal dari target rencana operasional",
      rekomendasi: "Monitoring intensif dan penambahan tenaga kerja mandor",
    };
  };

  const mappedBlocks: BlockDecisionItem[] = filtered.map((b) => {
    const cond = getConditionColor(b.capaianPct, filters.module);
    const targetHa = b.luasHa;
    const realisasiHa = b.realisasiHa;
    const defisitHa = Math.max(0, Number((targetHa - realisasiHa).toFixed(1)));
    const { kendala, rekomendasi } = getKendalaAndRekomendasi(b, filters.module);

    let severity: "Kritis" | "Sedang" | "Normal" = "Normal";
    if (b.capaianPct < 55 || defisitHa > 14) {
      severity = "Kritis";
    } else if (b.capaianPct < 80) {
      severity = "Sedang";
    }

    return {
      id: b.id,
      blok: b.blok,
      estate: b.estate,
      afdeling: b.afdeling,
      luasHa: targetHa,
      realisasiHa,
      targetHa,
      defisitHa,
      capaianPct: b.capaianPct,
      kondisi: cond.kondisi,
      warnaHex: cond.hex,
      severity,
      kendala,
      rekomendasi,
    };
  });

  const needsAttention = mappedBlocks
    .filter((b) => b.capaianPct < 80)
    .sort((a, b) => a.capaianPct - b.capaianPct);

  const maintainBlocks = mappedBlocks
    .filter((b) => b.capaianPct >= 85)
    .sort((a, b) => b.capaianPct - a.capaianPct);

  const totalDefisit = needsAttention.reduce((sum, item) => sum + item.defisitHa, 0);
  const avgDefisit = needsAttention.length > 0 ? Number((totalDefisit / needsAttention.length).toFixed(1)) : 0;

  return {
    needsAttention,
    maintainBlocks,
    criticalCount: needsAttention.length,
    maintainCount: maintainBlocks.length,
    avgDefisit,
  };
}

/**
 * Distribusi kondisi bulanan untuk mode KONDISI (Stacked Bar)
 */
export function getMonthlyConditionBreakdown(
  filters: DashboardFilterState,
  multiplier = 1.0
) {
  const mod = filters.module || "semua";

  if (mod === "pruning" || mod === "pasar_pikul" || mod === "semua") {
    const isPruning = mod === "pruning";
    const statusKeys = [
      { key: isPruning ? "Progresif / BAPP" : "BAPP", label: isPruning ? "Progresif / BAPP" : "BAPP", color: "#008000" },
      { key: "Ringan", label: "Ringan", color: "#7BF09B" },
      { key: "Sedang", label: "Sedang", color: "#FFFF00" },
      { key: "Berat", label: "Berat", color: "#FF8DA1" },
      { key: "Brushing", label: "Brushing", color: "#FF0000" },
    ];

    const baseMonthlyData = [
      { BAPP: 110, Ringan: 60, Sedang: 40, Berat: 20, Brushing: 10 },
      { BAPP: 125, Ringan: 65, Sedang: 45, Berat: 15, Brushing: 10 },
      { BAPP: 140, Ringan: 70, Sedang: 40, Berat: 20, Brushing: 10 },
      { BAPP: 150, Ringan: 75, Sedang: 35, Berat: 20, Brushing: 10 },
      { BAPP: 160, Ringan: 80, Sedang: 40, Berat: 20, Brushing: 10 },
      { BAPP: 170, Ringan: 85, Sedang: 45, Berat: 20, Brushing: 10 },
      { BAPP: 165, Ringan: 80, Sedang: 45, Berat: 20, Brushing: 10 },
      { BAPP: 155, Ringan: 80, Sedang: 45, Berat: 20, Brushing: 10 },
      { BAPP: 150, Ringan: 75, Sedang: 45, Berat: 20, Brushing: 10 },
      { BAPP: 145, Ringan: 75, Sedang: 40, Berat: 20, Brushing: 10 },
      { BAPP: 140, Ringan: 70, Sedang: 40, Berat: 20, Brushing: 10 },
      { BAPP: 135, Ringan: 70, Sedang: 40, Berat: 15, Brushing: 10 },
    ];

    const series = statusKeys.map((k) => ({
      name: k.label,
      color: k.color,
      data: baseMonthlyData.map((m) => Math.round(((m as Record<string, number>)[k.key] || 0) * multiplier)),
    }));

    return { series, statusKeys };
  }

  if (mod === "semprot" || mod === "pemupukan") {
    const isSemprot = mod === "semprot";
    const statusKeys = [
      { key: "Rotasi 3", label: "Rotasi 3 (Akhir)", color: "#FF7F00" },
      { key: "Rotasi 2", label: "Rotasi 2 (Susulan)", color: "#FFFF00" },
      { key: "Rotasi 1", label: "Rotasi 1 (Awal)", color: "#0099FF" },
      { key: isSemprot ? "Sudah RGM" : "Pupuk Mikro", label: isSemprot ? "Sudah RGM" : "Pupuk Mikro", color: "#00FF00" },
      { key: isSemprot ? "Belum Semprot" : "Belum Pupuk", label: isSemprot ? "Belum Semprot" : "Belum Pupuk", color: "#FF8DA1" },
    ];

    const baseMonthlyData = [
      { "Rotasi 3": 20, "Rotasi 2": 50, "Rotasi 1": 110, "Sudah RGM": 40, "Pupuk Mikro": 40, "Belum Semprot": 20, "Belum Pupuk": 20 },
      { "Rotasi 3": 30, "Rotasi 2": 60, "Rotasi 1": 120, "Sudah RGM": 40, "Pupuk Mikro": 40, "Belum Semprot": 15, "Belum Pupuk": 15 },
      { "Rotasi 3": 40, "Rotasi 2": 70, "Rotasi 1": 120, "Sudah RGM": 40, "Pupuk Mikro": 40, "Belum Semprot": 15, "Belum Pupuk": 15 },
      { "Rotasi 3": 50, "Rotasi 2": 80, "Rotasi 1": 110, "Sudah RGM": 40, "Pupuk Mikro": 40, "Belum Semprot": 15, "Belum Pupuk": 15 },
      { "Rotasi 3": 60, "Rotasi 2": 90, "Rotasi 1": 110, "Sudah RGM": 40, "Pupuk Mikro": 40, "Belum Semprot": 10, "Belum Pupuk": 10 },
      { "Rotasi 3": 70, "Rotasi 2": 95, "Rotasi 1": 110, "Sudah RGM": 40, "Pupuk Mikro": 40, "Belum Semprot": 10, "Belum Pupuk": 10 },
      { "Rotasi 3": 70, "Rotasi 2": 90, "Rotasi 1": 105, "Sudah RGM": 40, "Pupuk Mikro": 40, "Belum Semprot": 10, "Belum Pupuk": 10 },
      { "Rotasi 3": 65, "Rotasi 2": 85, "Rotasi 1": 105, "Sudah RGM": 40, "Pupuk Mikro": 40, "Belum Semprot": 10, "Belum Pupuk": 10 },
      { "Rotasi 3": 60, "Rotasi 2": 85, "Rotasi 1": 100, "Sudah RGM": 40, "Pupuk Mikro": 40, "Belum Semprot": 10, "Belum Pupuk": 10 },
      { "Rotasi 3": 55, "Rotasi 2": 80, "Rotasi 1": 100, "Sudah RGM": 40, "Pupuk Mikro": 40, "Belum Semprot": 10, "Belum Pupuk": 10 },
      { "Rotasi 3": 50, "Rotasi 2": 75, "Rotasi 1": 95, "Sudah RGM": 40, "Pupuk Mikro": 40, "Belum Semprot": 10, "Belum Pupuk": 10 },
      { "Rotasi 3": 50, "Rotasi 2": 70, "Rotasi 1": 95, "Sudah RGM": 40, "Pupuk Mikro": 40, "Belum Semprot": 10, "Belum Pupuk": 10 },
    ];

    const series = statusKeys.map((k) => ({
      name: k.label,
      color: k.color,
      data: baseMonthlyData.map((m) => Math.round(((m as Record<string, number>)[k.key] || 0) * multiplier)),
    }));

    return { series, statusKeys };
  }

  if (mod === "jangkos") {
    const statusKeys = [
      { key: "Didalam Kritis", label: "Di Dalam Lahan Kritis", color: "#0020C2" },
      { key: "Diluar Kritis", label: "Di Luar Lahan Kritis", color: "#00FF00" },
      { key: "Rencana", label: "Rencana Tabur", color: "#FFFF00" },
      { key: "Lahan Kritis", label: "Lahan Kritis", color: "#FF8DA1" },
    ];

    const baseMonthlyData = [
      { "Didalam Kritis": 80, "Diluar Kritis": 90, Rencana: 50, "Lahan Kritis": 25 },
      { "Didalam Kritis": 90, "Diluar Kritis": 100, Rencana: 55, "Lahan Kritis": 20 },
      { "Didalam Kritis": 100, "Diluar Kritis": 105, Rencana: 60, "Lahan Kritis": 20 },
      { "Didalam Kritis": 110, "Diluar Kritis": 110, Rencana: 60, "Lahan Kritis": 15 },
      { "Didalam Kritis": 115, "Diluar Kritis": 115, Rencana: 65, "Lahan Kritis": 15 },
      { "Didalam Kritis": 120, "Diluar Kritis": 125, Rencana: 70, "Lahan Kritis": 15 },
      { "Didalam Kritis": 120, "Diluar Kritis": 120, Rencana: 65, "Lahan Kritis": 15 },
      { "Didalam Kritis": 115, "Diluar Kritis": 115, Rencana: 65, "Lahan Kritis": 15 },
      { "Didalam Kritis": 110, "Diluar Kritis": 110, Rencana: 65, "Lahan Kritis": 15 },
      { "Didalam Kritis": 105, "Diluar Kritis": 105, Rencana: 60, "Lahan Kritis": 15 },
      { "Didalam Kritis": 100, "Diluar Kritis": 100, Rencana: 60, "Lahan Kritis": 15 },
      { "Didalam Kritis": 95, "Diluar Kritis": 95, Rencana: 60, "Lahan Kritis": 15 },
    ];

    const series = statusKeys.map((k) => ({
      name: k.label,
      color: k.color,
      data: baseMonthlyData.map((m) => Math.round(((m as Record<string, number>)[k.key] || 0) * multiplier)),
    }));

    return { series, statusKeys };
  }

  // Produksi
  const statusKeys = [
    { key: "Realisasi", label: "Realisasi Panen (Ton)", color: "#F97316" },
    { key: "Rencana", label: "Sisa Target Rencana (Ton)", color: "#0000FF" },
  ];

  const baseMonthlyData = [
    { Realisasi: 230, Rencana: 10 },
    { Realisasi: 255, Rencana: 5 },
    { Realisasi: 275, Rencana: 5 },
    { Realisasi: 288, Rencana: 2 },
    { Realisasi: 305, Rencana: 5 },
    { Realisasi: 320, Rencana: 10 },
    { Realisasi: 312, Rencana: 8 },
    { Realisasi: 300, Rencana: 10 },
    { Realisasi: 290, Rencana: 10 },
    { Realisasi: 240, Rencana: 50 },
    { Realisasi: 230, Rencana: 50 },
    { Realisasi: 220, Rencana: 50 },
  ];

  const series = statusKeys.map((k) => ({
    name: k.label,
    color: k.color,
    data: baseMonthlyData.map((m) => Math.round(((m as Record<string, number>)[k.key] || 0) * multiplier)),
  }));

  return { series, statusKeys };
}
