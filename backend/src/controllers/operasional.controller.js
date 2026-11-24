/**
 * @file operasional.controller.js
 * @description Controller untuk endpoint Data Operasional Kebun.
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
      const updated = await operasionalRepo.update(id, req.body);

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
}

module.exports = new OperasionalController();
