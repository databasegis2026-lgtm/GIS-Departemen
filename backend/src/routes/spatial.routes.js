/**
 * @file spatial.routes.js
 * @description Pendaftaran rute API untuk Universal Spatial Editor & Geodesics.
 */

const express = require("express");
const spatialController = require("../controllers/spatial.controller");

const router = express.Router();

router.post("/split", spatialController.splitFeature);
router.post("/cut", spatialController.cutFeature);
router.post("/merge", spatialController.mergeFeatures);
router.get("/proximity", spatialController.calculateProximity);
router.post("/export-pdf-map", spatialController.exportPdfMap);

module.exports = router;
