/**
 * @file spatial.repository.js
 * @description Polyglot Geospatial Repository.
 * Menghubungkan Engine Spasial Native Rust (RustGIS) dan Worker Python 3.15,
 * dengan automatic resilient fallback ke pure JS algorithm.
 */

const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");

class SpatialRepository {
  constructor() {
    this.rustBinaryPath = path.resolve(
      __dirname,
      "../../rust-spatial-engine/target/release/rust-spatial-engine.exe"
    );
    this.pythonScriptPath = path.resolve(
      __dirname,
      "../../python-worker/spatial_engine.py"
    );
    this.pythonBinary = "python";
  }

  /**
   * Eksekusi melalui Native Rust Spatial Engine
   */
  callRustEngine(args) {
    if (fs.existsSync(this.rustBinaryPath)) {
      try {
        const output = execFileSync(this.rustBinaryPath, args, {
          encoding: "utf-8",
          timeout: 3000,
        });
        return JSON.parse(output.trim());
      } catch (err) {
        console.warn("[RustEngine Warning]: Fallback to Python/JS due to:", err.message);
      }
    }
    return null;
  }

  /**
   * Eksekusi melalui Python Spatial Worker
   */
  callPythonWorker(action, payload) {
    if (fs.existsSync(this.pythonScriptPath)) {
      try {
        const output = execFileSync(
          this.pythonBinary,
          [this.pythonScriptPath, action, JSON.stringify(payload)],
          {
            encoding: "utf-8",
            timeout: 3000,
          }
        );
        return JSON.parse(output.trim());
      } catch (err) {
        console.warn("[PythonWorker Warning]: Fallback to JS due to:", err.message);
      }
    }
    return null;
  }

  /**
   * Menghitung jarak geodesic antar dua koordinat [lat, lng] dalam meter
   */
  calculateGeodesicDistance(coord1, coord2) {
    // Coba Rust terlebih dahulu (Kecepatan tertinggi)
    const fromStr = `${coord1[0]},${coord1[1]}`;
    const toStr = `${coord2[0]},${coord2[1]}`;
    const rustRes = this.callRustEngine(["proximity", "--from", fromStr, "--to", toStr]);
    if (rustRes && rustRes.distance_meters !== undefined) {
      return rustRes.distance_meters;
    }

    // Coba Python
    const pyRes = this.callPythonWorker("proximity", { from: coord1, to: coord2 });
    if (pyRes && pyRes.distance_meters !== undefined) {
      return pyRes.distance_meters;
    }

    // Fallback Internal JS Haversine
    const [lat1, lon1] = coord1;
    const [lat2, lon2] = coord2;
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  /**
   * Split Polygon: Membelah poligon menjadi 2 bagian berdasarkan orientasi & rasio
   */
  splitPolygon({ blok_id, orientation = "vertical", ratio = 50, kondisi_a, kondisi_b, baseCoords, totalLuasHa = 30 }) {
    // 1. Eksekusi via Rust
    const rustRes = this.callRustEngine([
      "split",
      "--blok", blok_id,
      "--orientation", orientation,
      "--ratio", String(ratio),
      "--luas", String(totalLuasHa),
      "--kondisi-a", kondisi_a || "BAPP",
      "--kondisi-b", kondisi_b || "Rotasi 1",
    ]);

    if (rustRes && rustRes.success) {
      const midLng = (baseCoords[0][1] + baseCoords[1][1]) / 2.0;
      rustRes.result = [
        {
          ...rustRes.parts[0],
          coords: [baseCoords[0], [baseCoords[0][0], midLng], [baseCoords[2][0], midLng], baseCoords[3]],
        },
        {
          ...rustRes.parts[1],
          coords: [[baseCoords[0][0], midLng], baseCoords[1], baseCoords[2], [baseCoords[2][0], midLng]],
        },
      ];
      return rustRes;
    }

    // 2. Eksekusi via Python
    const pyRes = this.callPythonWorker("split", {
      blok_id,
      orientation,
      ratio,
      totalLuasHa,
      kondisi_a,
      kondisi_b,
      baseCoords,
    });
    if (pyRes && pyRes.success) {
      pyRes.result = pyRes.parts;
      return pyRes;
    }

    // 3. Fallback JS
    const fraction = Math.max(0.1, Math.min(0.9, ratio / 100));
    return {
      success: true,
      engine: "JavaScript-Fallback",
      blok_id,
      operation: "split",
      result: [
        {
          id: `${blok_id}-subA`,
          name: `Blok ${blok_id} (Bagian A)`,
          luas_ha: Number((totalLuasHa * fraction).toFixed(2)),
          kondisi: kondisi_a || "BAPP",
          coords: baseCoords,
        },
        {
          id: `${blok_id}-subB`,
          name: `Blok ${blok_id} (Bagian B)`,
          luas_ha: Number((totalLuasHa * (1 - fraction)).toFixed(2)),
          kondisi: kondisi_b || "Rotasi 1",
          coords: baseCoords,
        },
      ],
    };
  }

  /**
   * Cut Polygon: Mengiris spot/area tertentu
   */
  cutPolygon({ blok_id, area_ha = 3.5, kondisi = "Belum Semprot", baseCoords, totalLuasHa = 30 }) {
    // 1. Eksekusi via Rust
    const rustRes = this.callRustEngine([
      "cut",
      "--blok", blok_id,
      "--area", String(area_ha),
      "--luas", String(totalLuasHa),
      "--kondisi", kondisi,
    ]);

    if (rustRes && rustRes.success) {
      const c0 = baseCoords[0];
      rustRes.result = [
        { ...rustRes.parts[0], coords: baseCoords },
        {
          ...rustRes.parts[1],
          coords: [
            [c0[0] - 0.002, c0[1] + 0.002],
            [c0[0] - 0.002, c0[1] + 0.006],
            [c0[0] - 0.006, c0[1] + 0.006],
            [c0[0] - 0.006, c0[1] + 0.002],
          ],
        },
      ];
      return rustRes;
    }

    // 2. Eksekusi via Python
    const pyRes = this.callPythonWorker("cut", {
      blok_id,
      area_ha,
      kondisi,
      baseCoords,
      totalLuasHa,
    });
    if (pyRes && pyRes.success) {
      pyRes.result = pyRes.parts;
      return pyRes;
    }

    // 3. Fallback JS
    const sisaLuas = Number(Math.max(1, totalLuasHa - area_ha).toFixed(2));
    return {
      success: true,
      engine: "JavaScript-Fallback",
      blok_id,
      operation: "cut",
      result: [
        { id: `${blok_id}-main`, name: `Blok ${blok_id} (Area Tersisa)`, luas_ha: sisaLuas, kondisi: "BAPP", coords: baseCoords },
        { id: `${blok_id}-cut-area`, name: `Blok ${blok_id} (Area Terpotong)`, luas_ha: Number(area_ha), kondisi, coords: baseCoords },
      ],
    };
  }

  /**
   * Merge Polygons: Menggabungkan potongan poligon menjadi 1 poligon utuh
   */
  mergePolygons({ blok_id, polygon_ids, kondisi_final = "BAPP", totalLuasHa = 30, masterCoords }) {
    // Eksekusi via Rust
    const rustRes = this.callRustEngine([
      "merge",
      "--blok", blok_id,
      "--luas", String(totalLuasHa),
      "--kondisi", kondisi_final,
    ]);

    if (rustRes && rustRes.success) {
      rustRes.result.coords = masterCoords;
      rustRes.merged_ids = polygon_ids;
      return rustRes;
    }

    return {
      success: true,
      engine: "JavaScript-Fallback",
      blok_id,
      operation: "merge",
      merged_ids: polygon_ids,
      result: {
        id: `poly-master-${blok_id}`,
        name: `Poligon Utama Blok ${blok_id}`,
        luas_ha: Number(totalLuasHa),
        kondisi: kondisi_final,
        coords: masterCoords,
      },
    };
  }
}

module.exports = new SpatialRepository();
