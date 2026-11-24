/**
 * @file operasional.routes.js
 * @description Pendaftaran rute API untuk Data Operasional Kebun.
 */

const express = require("express");
const operasionalController = require("../controllers/operasional.controller");

const router = express.Router();

router.get("/records", operasionalController.getRecords);
router.get("/afdeling/:estate/:afdeling", operasionalController.getAfdelingBlocks);
router.get("/tph-points", operasionalController.getTphList);
router.put("/records/:id", operasionalController.updateRecord);

module.exports = router;
