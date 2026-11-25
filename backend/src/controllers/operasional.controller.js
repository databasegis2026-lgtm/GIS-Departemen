/**
 * @file operasional.controller.js
 * @description Controller untuk endpoint Data Operasional Kebun & Audit Trail.
 */

const operasionalRepo = require("../repositories/operasional.repository");

class OperasionalController {
  async getRecords(req, res) {
    try {
      const { estate, afdeling, blok, kondisi, search, page, limit } = req.query;
      const result = await operasionalRepo.findAll({
        estate,
        afdeling,
        blok,
        kondisi,
        search,
        page,
        limit,
      });

      return res.status(200).json({
        status: "success",
        message: "Data operasional berhasil dimuat",
        ...result,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Gagal memuat data operasional",
        error: error.message,
      });
    }
  }

  async createRecord(req, res) {
    try {
      const user = req.headers["x-user-name"] || "GIS Operator";
      const record = await operasionalRepo.create(req.body, user);

      return res.status(201).json({
        status: "success",
        message: "Record operasional berhasil ditambahkan",
        data: record,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Gagal menambahkan record operasional",
        error: error.message,
      });
    }
  }

  async bulkUpload(req, res) {
    try {
      const user = req.headers["x-user-name"] || "GIS Operator";
      const { records } = req.body;

      if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({
          status: "fail",
          message: "Data records harus berupa array dan tidak boleh kosong",
        });
      }

      const result = await operasionalRepo.bulkUpload(records, user);

      return res.status(200).json({
        status: "success",
        message: `Berhasil mengunggah ${result.count} data spasial SHP`,
        ...result,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Gagal melakukan bulk upload",
        error: error.message,
      });
    }
  }

  async getAfdelingBlocks(req, res) {
    try {
      const { estate, afdeling } = req.params;
      const blocks = await operasionalRepo.findByAfdeling(estate, afdeling);

      return res.status(200).json({
        status: "success",
        estate,
        afdeling,
        total_blocks: blocks.length,
        data: blocks,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Gagal memuat blok afdeling",
        error: error.message,
      });
    }
  }

  async updateRecord(req, res) {
    try {
      const { id } = req.params;
      const user = req.headers["x-user-name"] || "GIS Operator";
      const updated = await operasionalRepo.update(id, req.body, user);

      if (!updated) {
        return res.status(404).json({
          status: "fail",
          message: `Record operasional dengan ID ${id} tidak ditemukan`,
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Record operasional berhasil diperbarui",
        data: updated,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Gagal memperbarui record operasional",
        error: error.message,
      });
    }
  }

  async deleteRecord(req, res) {
    try {
      const { id } = req.params;
      const user = req.headers["x-user-name"] || "GIS Operator";
      const deleted = await operasionalRepo.delete(id, user);

      if (!deleted) {
        return res.status(404).json({
          status: "fail",
          message: `Record operasional dengan ID ${id} tidak ditemukan`,
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Record operasional berhasil dihapus",
        data: deleted,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Gagal menghapus record operasional",
        error: error.message,
      });
    }
  }

  async getTphList(req, res) {
    try {
      const points = await operasionalRepo.getTphPoints();
      return res.status(200).json({
        status: "success",
        total: points.length,
        data: points,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Gagal memuat titik TPH",
        error: error.message,
      });
    }
  }

  async getAuditLogs(req, res) {
    try {
      const { limit } = req.query;
      const logs = await operasionalRepo.getAuditLogs(limit);
      return res.status(200).json({
        status: "success",
        total: logs.length,
        data: logs,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Gagal memuat audit logs",
        error: error.message,
      });
    }
  }
}

module.exports = new OperasionalController();
