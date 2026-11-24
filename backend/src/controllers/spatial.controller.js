/**
 * @file spatial.controller.js
 * @description Controller untuk endpoint Universal Spatial Editor & Geodesic Distance.
 */

const spatialRepo = require("../repositories/spatial.repository");
const operasionalRepo = require("../repositories/operasional.repository");

class SpatialController {
  async splitFeature(req, res) {
    try {
      const { blok_id, orientation, ratio, kondisi_a, kondisi_b, baseCoords, totalLuasHa } = req.body;
      if (!blok_id) {
        return res.status(400).json({ status: "fail", message: "blok_id wajib disertakan" });
      }

      const result = spatialRepo.splitPolygon({
        blok_id,
        orientation,
        ratio,
        kondisi_a,
        kondisi_b,
        baseCoords: baseCoords || [
          [-1.545, 113.965],
          [-1.545, 113.975],
          [-1.555, 113.975],
          [-1.555, 113.965],
        ],
        totalLuasHa,
      });

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ status: "error", message: "Gagal split poligon", error: error.message });
    }
  }

  async cutFeature(req, res) {
    try {
      const { blok_id, area_ha, kondisi, baseCoords, totalLuasHa } = req.body;
      if (!blok_id) {
        return res.status(400).json({ status: "fail", message: "blok_id wajib disertakan" });
      }

      const result = spatialRepo.cutPolygon({
        blok_id,
        area_ha,
        kondisi,
        baseCoords: baseCoords || [
          [-1.545, 113.965],
          [-1.545, 113.975],
          [-1.555, 113.975],
          [-1.555, 113.965],
        ],
        totalLuasHa,
      });

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ status: "error", message: "Gagal memotong poligon", error: error.message });
    }
  }

  async mergeFeatures(req, res) {
    try {
      const { blok_id, polygon_ids, kondisi_final, totalLuasHa, masterCoords } = req.body;
      const result = spatialRepo.mergePolygons({
        blok_id,
        polygon_ids,
        kondisi_final,
        totalLuasHa,
        masterCoords: masterCoords || [
          [-1.545, 113.965],
          [-1.545, 113.975],
          [-1.555, 113.975],
          [-1.555, 113.965],
        ],
      });

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ status: "error", message: "Gagal menggabungkan poligon", error: error.message });
    }
  }

  async calculateProximity(req, res) {
    try {
      const { from_tph, to_tph, from_coord, to_coord } = req.query;

      let c1 = null;
      let c2 = null;

      if (from_coord && to_coord) {
        c1 = from_coord.split(",").map(Number);
        c2 = to_coord.split(",").map(Number);
      } else if (from_tph && to_tph) {
        const points = await operasionalRepo.getTphPoints();
        const p1 = points.find((p) => p.name.toLowerCase() === from_tph.toLowerCase());
        const p2 = points.find((p) => p.name.toLowerCase() === to_tph.toLowerCase());
        if (p1 && p2) {
          c1 = p1.coords;
          c2 = p2.coords;
        }
      }

      if (!c1 || !c2) {
        return res.status(400).json({
          status: "fail",
          message: "Titik koordinat atau nama TPH tidak valid",
        });
      }

      const distanceMeters = spatialRepo.calculateGeodesicDistance(c1, c2);

      return res.status(200).json({
        status: "success",
        distance_meters: distanceMeters,
        formatted: `${distanceMeters.toLocaleString("id-ID")} meter`,
        from: c1,
        to: c2,
      });
    } catch (error) {
      return res.status(500).json({ status: "error", message: "Gagal menghitung jarak", error: error.message });
    }
  }

  async exportPdfMap(req, res) {
    try {
      const { blok_id, title, paper_size = "A4_Landscape", include_legend = true } = req.body;

      // Mock output cartographic layout (siap dihubungkan ke RustGIS engine)
      return res.status(200).json({
        status: "success",
        message: "Layout peta kartografi berhasil digenerate",
        document: {
          file_name: `PETA_OPERASIONAL_${blok_id || "AFD4"}_${Date.now()}.pdf`,
          paper_size,
          title: title || `Peta Kerja Operasional Blok ${blok_id || "AFD 4"}`,
          scale: "1:5.000",
          projection: "EPSG:3857 (WGS 84 / Pseudo-Mercator)",
          elements: {
            north_arrow: true,
            scale_bar: true,
            legend: include_legend,
            sign_blocks: ["Mandor", "Asisten Afdeling", "Askep"],
          },
          download_url: `/api/v1/spatial/download-mock-pdf/${blok_id || "AFD4"}`,
        },
      });
    } catch (error) {
      return res.status(500).json({ status: "error", message: "Gagal mengekspor layout peta", error: error.message });
    }
  }
}

module.exports = new SpatialController();
