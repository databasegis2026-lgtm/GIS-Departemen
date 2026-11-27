/**
 * @file tata-kelola-operasional.ts
 * @description Modul Tata Kelola Geospasial Multi-Company (PT BUM & PT BSL):
 * 1. Isolasi 2 Perusahaan (PT BUM vs PT BSL).
 * 2. Logika Cut-off Tanggal 25 (tutup buku bulanan) & Tanggal 26 ke atas (buka buku baru).
 * 3. Siklus Caturwulan 4 Bulan (pruning, pemupukan, semprot) & Jangkos Kondisional (per SPK).
 * 4. Kuota Revisi: Tampilan Publik 1 Kali (wanti-wanti keras) vs Internal Database 2 Kuota (safety buffer).
 * 5. Otoritas Eksklusif Admin GIS.
 */

export type CompanyType = "PT BUM" | "PT BSL";

/**
 * Deteksi perusahaan otomatis berdasarkan Estate
 */
export function getCompanyForEstate(est: string): CompanyType {
  const clean = (est || "").toUpperCase().trim();
  if (clean === "BSL" || clean.includes("BSL")) {
    return "PT BSL";
  }
  return "PT BUM";
}

/**
 * Deteksi Region otomatis berdasarkan Estate
 */
export function getRegionForEstate(est: string): string {
  const clean = (est || "").toUpperCase().trim();
  if (clean === "BSL") return "REGION 3";
  if (["BUM 5", "BUM 6", "BUM 7"].includes(clean)) return "REGION 2";
  if (["BUM 3", "BUM 8"].includes(clean)) return "REGION 3";
  return "REGION 1";
}

/**
 * Menghitung periode cut-off bulanan (Siklus Tanggal 26 s/d Tanggal 25)
 * - Jika tanggal > 25 (misal tgl 26-31): Sudah masuk siklus buka buku baru bulan depan!
 * - Jika tanggal 1-25: Masuk siklus bulan berjalan.
 */
export function getMonthlyCutoffPeriod(date: Date = new Date()): {
  periodCode: string;
  periodLabel: string;
  isNewCycle: boolean;
  year: number;
  month: number;
} {
  const day = date.getDate();
  let targetMonth = date.getMonth(); // 0-based
  let targetYear = date.getFullYear();
  let isNewCycle = false;

  if (day > 25) {
    targetMonth += 1;
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }
    isNewCycle = true;
  }

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const padMonth = String(targetMonth + 1).padStart(2, "0");
  const periodCode = `${targetYear}-${padMonth}`;
  const periodLabel = `Periode ${monthNames[targetMonth]} ${targetYear}`;

  return {
    periodCode,
    periodLabel,
    isNewCycle,
    year: targetYear,
    month: targetMonth + 1,
  };
}

/**
 * Menghitung Siklus Rotasi 4 Bulan (Caturwulan) untuk Pruning, Pemupukan, Semprot, Pasar Pikul
 * - Caturwulan I: Jan - Apr
 * - Caturwulan II: Mei - Agu
 * - Caturwulan III: Sep - Des
 * Untuk Jangkos bersifat Kondisional (per Batch SPK)
 */
export function getOperationalCycle(
  aktivitas: string,
  date: Date = new Date()
): {
  cycleCode: string;
  cycleLabel: string;
  caturwulan: number;
} {
  const act = (aktivitas || "").toLowerCase();
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12

  if (act === "jangkos") {
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
    ];
    return {
      cycleCode: `SPK-JANGKOS-${year}-${String(month).padStart(2, "0")}`,
      cycleLabel: `Batch SPK Jangkos ${monthNames[month - 1]} ${year} (Kondisional)`,
      caturwulan: Math.ceil(month / 4),
    };
  }

  if (act === "produksi") {
    return {
      cycleCode: `PROD-${year}-${String(month).padStart(2, "0")}`,
      cycleLabel: `Produksi Bulan ${month} ${year}`,
      caturwulan: Math.ceil(month / 4),
    };
  }

  // Rutin 4 Bulan: Pruning, Semprot, Pemupukan, Pasar Pikul
  let caturwulan = 1;
  let rotasiName = "Rotasi 1";
  if (month >= 5 && month <= 8) {
    caturwulan = 2;
    rotasiName = "Rotasi 2";
  } else if (month >= 9) {
    caturwulan = 3;
    rotasiName = "Rotasi 3";
  }

  return {
    cycleCode: `ROTASI-${caturwulan}-${year}`,
    cycleLabel: `${rotasiName} ${year} (Caturwulan ${caturwulan})`,
    caturwulan,
  };
}

/**
 * Memeriksa apakah suatu transaksi sudah lewat cut-off tanggal 25 (Terkunci Otomatis)
 */
export function isTransactionCutoffLocked(transactionDateStr: string): boolean {
  if (!transactionDateStr) return false;
  try {
    const txDate = new Date(transactionDateStr);
    const now = new Date();

    // Hitung apakah periode transaksi lebih tua dari periode aktif saat ini
    const currentPeriod = getMonthlyCutoffPeriod(now);
    const txPeriod = getMonthlyCutoffPeriod(txDate);

    return txPeriod.periodCode < currentPeriod.periodCode;
  } catch {
    return false;
  }
}

/**
 * Generate Kunci Komposit Unik Blok (Single Source of Truth)
 */
export function generateBlockCompositeKey(
  company: string,
  estate: string,
  afdeling: string,
  blok: string,
  periode: string
): string {
  const c = (company || "BUM").toUpperCase().replace(/\s+/g, "");
  const e = (estate || "").toUpperCase().replace(/\s+/g, "");
  const a = (afdeling || "").toUpperCase().replace(/\s+/g, "");
  const b = (blok || "").toUpperCase().replace(/\s+/g, "");
  const p = (periode || "").toUpperCase().replace(/\s+/g, "");
  return `${c}_${e}_${a}_${b}_${p}`;
}

/**
 * Mengubah kuota internal database (2 kuota) menjadi status tampilan publik (1 kuota wanti-wanti)
 */
export function getPublicRevisionDisplay(kuotaInternal: number = 2): {
  displayText: string;
  badgeColor: string;
  isLockedForPublic: boolean;
  canAdminOverride: boolean;
} {
  if (kuotaInternal >= 2) {
    return {
      displayText: "Sisa Kuota: 1 Kali Revisi (Peringatan: Revisi Terakhir)",
      badgeColor: "text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300",
      isLockedForPublic: false,
      canAdminOverride: true,
    };
  } else if (kuotaInternal === 1) {
    return {
      displayText: "Kuota Revisi Habis (Terkunci Permanen)",
      badgeColor: "text-rose-700 bg-rose-50 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300",
      isLockedForPublic: true,
      canAdminOverride: true, // Emergency override khusus Admin GIS
    };
  }
  return {
    displayText: "Terkunci Permanen (BAPP Selesai)",
    badgeColor: "text-slate-700 bg-slate-100 border-slate-300 dark:bg-slate-800 dark:text-slate-300",
    isLockedForPublic: true,
    canAdminOverride: false,
  };
}
