/**
 * @file operasional.repository.js
 * @description In-memory Mock Repository untuk Data Operasional Kebun.
 * Dirancang dengan antarmuka seragam agar dapat langsung diswap ke Postgres/PostGIS kelak.
 */

const seedData = require("../mock-db/operasional-seed.json");

class OperasionalRepository {
  constructor() {
    // Inisialisasi clone data seed di memori
    this.records = JSON.parse(JSON.stringify(seedData.records));
    this.estates = [...seedData.estates];
    this.afdelings = [...seedData.afdelings];
    this.tphPoints = JSON.parse(JSON.stringify(seedData.tphPoints));
  }

  /**
   * Mengambil daftar record dengan filter dinamis
   */
  async findAll({ estate, afdeling, blok, kondisi, search, page = 1, limit = 10 }) {
    let filtered = [...this.records];

    if (estate && estate !== "Semua") {
      filtered = filtered.filter((r) => r.estate.toLowerCase() === estate.toLowerCase());
    }

    if (afdeling && afdeling !== "Semua") {
      filtered = filtered.filter((r) => r.afdeling.toLowerCase() === afdeling.toLowerCase());
    }

    if (blok) {
      filtered = filtered.filter((r) => r.blok.toLowerCase().includes(blok.toLowerCase()));
    }

    if (kondisi && kondisi !== "Semua") {
      filtered = filtered.filter((r) => r.kondisi.toLowerCase().includes(kondisi.toLowerCase()));
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.blok.toLowerCase().includes(q) ||
          r.kontraktor.toLowerCase().includes(q) ||
          r.estate.toLowerCase().includes(q) ||
          r.afdeling.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + Number(limit));

    const totalLuasHa = filtered.reduce((acc, r) => acc + (r.luas_ha || 0), 0);
    const totalRealisasiHa = filtered.reduce((acc, r) => acc + (r.realisasi_luas_ha || 0), 0);

    return {
      data: paginated,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit) || 1,
        summary: {
          total_luas_ha: Number(totalLuasHa.toFixed(2)),
          total_realisasi_ha: Number(totalRealisasiHa.toFixed(2)),
          persen_capaian: totalLuasHa > 0 ? Number(((totalRealisasiHa / totalLuasHa) * 100).toFixed(1)) : 0,
        },
      },
    };
  }

  /**
   * Ambil detail record berdasarkan ID
   */
  async findById(id) {
    return this.records.find((r) => r.id === id) || null;
  }

  /**
   * Ambil semua blok dalam afdeling tertentu (untuk modal peta)
   */
  async findByAfdeling(estate, afdeling) {
    return this.records.filter(
      (r) => r.estate.toLowerCase() === estate.toLowerCase() && r.afdeling.toLowerCase() === afdeling.toLowerCase()
    );
  }

  /**
   * Update data operasional
   */
  async update(id, updateData) {
    const index = this.records.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const existing = this.records[index];
    const updated = {
      ...existing,
      ...updateData,
      id: existing.id, // Pertahankan ID
    };

    // Hitung ulang capaian jika luas atau realisasi berubah
    if (updated.luas_ha > 0 && updated.realisasi_luas_ha !== undefined) {
      updated.capaian_persen = Math.min(100, Math.round((updated.realisasi_luas_ha / updated.luas_ha) * 100));
    }

    this.records[index] = updated;
    return updated;
  }

  /**
   * Ambil titik TPH
   */
  async getTphPoints() {
    return [...this.tphPoints];
  }
}

// Singleton instance
module.exports = new OperasionalRepository();
