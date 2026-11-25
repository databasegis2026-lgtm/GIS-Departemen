/**
 * @file operasional.routes.js
 * @description Pendaftaran rute API untuk Data Operasional Kebun & Audit Trail.
 */

const express = require("express");
const operasionalController = require("../controllers/operasional.controller");

const router = express.Router();

// Read Endpoints
router.get("/records", operasionalController.getRecords);
router.get("/afdeling/:estate/:afdeling", operasionalController.getAfdelingBlocks);
router.get("/tph-points", operasionalController.getTphList);
router.get("/audit-logs", operasionalController.getAuditLogs);

// Write / Mutate Endpoints (Insert/Upload, Update, Delete)
router.post("/records", operasionalController.createRecord);
router.post("/bulk-upload", operasionalController.bulkUpload);
router.put("/records/:id", operasionalController.updateRecord);
router.delete("/records/:id", operasionalController.deleteRecord);

module.exports = router;
