/**
 * @file operasional.repository.js
 * @description In-memory Mock Repository untuk Data Operasional Kebun.
 * Mendukung full CRUD (Create/Upload, Read, Update, Delete) dan Audit Trail Logging.
 */

const seedData = require("../mock-db/operasional-seed.json");

class OperasionalRepository {
  constructor() {
    this.records = JSON.parse(JSON.stringify(seedData.records || []));
    this.estates = [...(seedData.estates || [])];
    this.afdelings = [...(seedData.afdelings || [])];
    this.tphPoints = JSON.parse(JSON.stringify(seedData.tphPoints || []));
    this.auditLogs = [];
  }

  /**
   * Catat audit log transaksi
   */
  logAudit(action, entity, recordId, details, user = "GIS Operator") {
    const log = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      entity,
      record_id: recordId,
      details,
      user,
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    return log;
  }

  /**
   * Mengambil daftar record dengan filter dinamis
   */
  async findAll({ estate, afdeling, blok, kondisi, search, page = 1, limit = 10 }) {
    let filtered = [...this.records];

    if (estate && estate !== "Semua") {
      filtered = filtered.filter((r) => r.estate?.toLowerCase() === estate.toLowerCase());
    }

    if (afdeling && afdeling !== "Semua") {
      filtered = filtered.filter((r) => r.afdeling?.toLowerCase() === afdeling.toLowerCase());
    }

    if (blok) {
      filtered = filtered.filter((r) => r.blok?.toLowerCase().includes(blok.toLowerCase()));
    }

    if (kondisi && kondisi !== "Semua") {
      filtered = filtered.filter((r) => r.kondisi?.toLowerCase().includes(kondisi.toLowerCase()));
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.blok?.toLowerCase().includes(q) ||
          r.kontraktor?.toLowerCase().includes(q) ||
          r.estate?.toLowerCase().includes(q) ||
          r.afdeling?.toLowerCase().includes(q)
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
      (r) => r.estate?.toLowerCase() === estate.toLowerCase() && r.afdeling?.toLowerCase() === afdeling.toLowerCase()
    );
  }

  /**
   * Buat record baru (Insert / Unggah)
   */
  async create(recordData, user) {
    const id = recordData.id || `REC-${Date.now()}`;
    const newRecord = {
      ...recordData,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (newRecord.luas_ha > 0 && newRecord.realisasi_luas_ha !== undefined) {
      newRecord.capaian_persen = Math.min(100, Math.round((newRecord.realisasi_luas_ha / newRecord.luas_ha) * 100));
    }

    this.records.unshift(newRecord);
    this.logAudit("CREATE", "data_operasional", id, `Tambah blok ${newRecord.blok || "N/A"}`, user);
    return newRecord;
  }

  /**
   * Bulk upload records dari Shapefile / GeoJSON
   */
  async bulkUpload(recordsArray, user) {
    const inserted = [];
    for (const item of recordsArray) {
      const id = item.id || `SHP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const rec = {
        ...item,
        id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.records.unshift(rec);
      inserted.push(rec);
    }
    this.logAudit("BULK_UPLOAD", "data_operasional", `BATCH-${Date.now()}`, `Unggah ${recordsArray.length} records SHP`, user);
    return { count: inserted.length, records: inserted };
  }

  /**
   * Update data operasional
   */
  async update(id, updateData, user) {
    const index = this.records.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const existing = this.records[index];
    const updated = {
      ...existing,
      ...updateData,
      id: existing.id,
      updated_at: new Date().toISOString(),
    };

    if (updated.luas_ha > 0 && updated.realisasi_luas_ha !== undefined) {
      updated.capaian_persen = Math.min(100, Math.round((updated.realisasi_luas_ha / updated.luas_ha) * 100));
    }

    this.records[index] = updated;
    this.logAudit("UPDATE", "data_operasional", id, `Perbarui data blok ${updated.blok || id}`, user);
    return updated;
  }

  /**
   * Hapus record operasional
   */
  async delete(id, user) {
    const index = this.records.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const removed = this.records.splice(index, 1)[0];
    this.logAudit("DELETE", "data_operasional", id, `Hapus data blok ${removed.blok || id}`, user);
    return removed;
  }

  /**
   * Ambil titik TPH
   */
  async getTphPoints() {
    return [...this.tphPoints];
  }

  /**
   * Ambil log audit aktivitas
   */
  async getAuditLogs(limit = 100) {
    return this.auditLogs.slice(0, Number(limit));
  }
}

module.exports = new OperasionalRepository();
