/**
 * @file app.js
 * @description Inisialisasi Express Application, Middleware, dan Routing API.
 * Mendukung payload hingga 500MB untuk pemrosesan Shapefile/GeoJSON tanpa batasan file buatan.
 */

const express = require("express");
const cors = require("cors");
const operasionalRoutes = require("./routes/operasional.routes");
const spatialRoutes = require("./routes/spatial.routes");

const app = express();

// Middleware dasar - Dukung data spasial besar tanpa batasan file buatan (500MB)
app.use(cors());
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "GIS Plantation Backend API",
    mode: "mock-repository",
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes v1
app.use("/api/v1/operasional", operasionalRoutes);
app.use("/api/v1/spatial", spatialRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: "fail",
    message: `Rute ${req.originalUrl} tidak ditemukan di server`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("[ServerError]:", err);
  res.status(500).json({
    status: "error",
    message: "Terjadi kesalahan internal pada server backend",
    error: err.message,
  });
});

module.exports = app;
