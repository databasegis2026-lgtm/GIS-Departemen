/**
 * GIS & Tabular Multi-Format Exporter
 * Mendukung ekspor per-Afdeling ke:
 * 1. CSV (.csv) - UTF-8 dengan BOM untuk Excel
 * 2. Excel (.xls / Spreadsheet XML) - Langsung terbuka di Microsoft Excel dengan pemformatan rapi
 * 3. GeoJSON (.geojson) - Standard FeatureCollection Point WGS84
 * 4. Shapefile (.zip) - Vektor titik lengkap (.shp, .shx, .dbf, .prj WGS84) siap pakai di ArcGIS/QGIS
 */

// CRC-32 Lookup Table untuk ZIP generator murni tanpa library eksternal
const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC32_TABLE[i] = c >>> 0;
}

function calculateCRC32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Pembuat arsip ZIP murni (Store method 0)
 */
export function createZipArchive(files: { name: string; data: Uint8Array }[]): Blob {
  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];
  let offset = 0;

  const now = new Date();
  const time =
    ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff;
  const date =
    (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;

  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);
    const crc = calculateCRC32(file.data);
    const size = file.data.length;

    // Local file header (30 bytes + name + data)
    const local = new Uint8Array(30 + nameBytes.length + size);
    const localView = new DataView(local.buffer);

    localView.setUint32(0, 0x04034b50, true); // Signature
    localView.setUint16(4, 20, true); // Version
    localView.setUint16(6, 0, true); // Flags
    localView.setUint16(8, 0, true); // Store (no compression)
    localView.setUint16(10, time, true);
    localView.setUint16(12, date, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, size, true);
    localView.setUint32(22, size, true);
    localView.setUint16(26, nameBytes.length, true);
    localView.setUint16(28, 0, true); // Extra len

    local.set(nameBytes, 30);
    local.set(file.data, 30 + nameBytes.length);
    localHeaders.push(local);

    // Central directory header (46 bytes + name)
    const central = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(central.buffer);

    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true); // Made by
    centralView.setUint16(6, 20, true); // Needed
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, time, true);
    centralView.setUint16(14, date, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, size, true);
    centralView.setUint32(24, size, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true); // Local header offset

    central.set(nameBytes, 46);
    centralHeaders.push(central);

    offset += local.length;
  }

  const centralSize = centralHeaders.reduce((sum, h) => sum + h.length, 0);

  // End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, files.length, true);
  eocdView.setUint16(10, files.length, true);
  eocdView.setUint32(12, centralSize, true);
  eocdView.setUint32(16, offset, true);
  eocdView.setUint16(20, 0, true);

  return new Blob([...localHeaders, ...centralHeaders, eocd] as any[], {
    type: "application/zip",
  });
}

/**
 * Trigger download file dari Blob
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 1. Ekspor CSV (dengan UTF-8 BOM untuk Excel)
 * Mendukung pemanggilan fleksibel:
 * - exportToCSV(filename, headers, data)
 * - exportToCSV(data, filename)
 */
export function exportToCSV(
  arg1: string | Record<string, any>[],
  arg2?: { key: string; label: string }[] | string,
  arg3?: any[]
): void {
  let filename = "export.csv";
  let headers: { key: string; label: string }[] = [];
  let data: any[] = [];

  if (Array.isArray(arg1)) {
    data = arg1;
    const baseName = typeof arg2 === "string" ? arg2 : "export";
    filename = baseName.endsWith(".csv") ? baseName : `${baseName}.csv`;
    if (data.length > 0) {
      headers = Object.keys(data[0]).map((k) => ({ key: k, label: k }));
    }
  } else {
    const baseName = arg1;
    filename = baseName.endsWith(".csv") ? baseName : `${baseName}.csv`;
    headers = Array.isArray(arg2) ? arg2 : [];
    data = Array.isArray(arg3) ? arg3 : [];
  }

  const headerRow = headers.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(",");
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h.key] !== undefined && row[h.key] !== null ? String(row[h.key]) : "";
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  // UTF-8 BOM \uFEFF agar aksen dan karakter Indonesia tidak rusak di Excel
  const csvText = "\uFEFF" + [headerRow, ...rows].join("\r\n");
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}

/**
 * 2. Ekspor Excel Spreadsheet (.xls / XML Spreadsheet 2003)
 * Mendukung pemanggilan fleksibel:
 * - exportToExcel(filename, sheetTitle, headers, data)
 * - exportToExcel(data, filename, sheetTitle)
 */
export function exportToExcel(
  arg1: string | Record<string, any>[],
  arg2?: string | { key: string; label: string }[],
  arg3?: { key: string; label: string }[] | string | any[],
  arg4?: any[]
): void {
  let filename = "export.xls";
  let sheetTitle = "Data";
  let headers: { key: string; label: string }[] = [];
  let data: any[] = [];

  if (Array.isArray(arg1)) {
    data = arg1;
    const baseName = typeof arg2 === "string" ? arg2 : "export";
    filename = baseName.endsWith(".xls") ? baseName : `${baseName}.xls`;
    sheetTitle = typeof arg3 === "string" ? arg3 : "Data";
    if (data.length > 0) {
      headers = Object.keys(data[0]).map((k) => ({ key: k, label: k }));
    }
  } else {
    const baseName = arg1;
    filename = baseName.endsWith(".xls") ? baseName : `${baseName}.xls`;
    sheetTitle = typeof arg2 === "string" ? arg2 : "Data";
    headers = Array.isArray(arg3) ? arg3 : [];
    data = Array.isArray(arg4) ? arg4 : [];
  }
  const xmlHeader = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="HeaderStyle">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#059669" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="DataStyle">
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="NumberStyle">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${sheetTitle.replace(/[/\\?*[\]]/g, "_")}">
  <Table>`;

  const headerCells = headers
    .map((h) => `<Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${h.label}</Data></Cell>`)
    .join("");
  const headerRowXml = `<Row ss:Height="22">${headerCells}</Row>`;

  const rowsXml = data
    .map((row) => {
      const cells = headers
        .map((h) => {
          const val = row[h.key];
          if (val === undefined || val === null || val === "") {
            return `<Cell ss:StyleID="DataStyle"><Data ss:Type="String">-</Data></Cell>`;
          }
          if (typeof val === "number") {
            return `<Cell ss:StyleID="NumberStyle"><Data ss:Type="Number">${val}</Data></Cell>`;
          }
          return `<Cell ss:StyleID="DataStyle"><Data ss:Type="String">${String(val)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")}</Data></Cell>`;
        })
        .join("");
      return `<Row ss:Height="18">${cells}</Row>`;
    })
    .join("");

  const xmlFooter = `  </Table>
 </Worksheet>
</Workbook>`;

  const fullXml = xmlHeader + headerRowXml + rowsXml + xmlFooter;
  const blob = new Blob([fullXml], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  triggerDownload(blob, filename.endsWith(".xls") ? filename : `${filename}.xls`);
}

/**
 * 3. Ekspor GeoJSON Point FeatureCollection
 */
export function exportToGeoJSON(
  filename: string,
  data: any[],
  getCoords: (item: any) => [number, number] | null
): void {
  const features = data
    .map((item, idx) => {
      const coords = getCoords(item);
      if (!coords) return null;
      // Di GeoJSON urutan koordinat adalah [lng, lat]
      const { lat: _lat, lng: _lng, ...cleanProps } = item;
      return {
        type: "Feature",
        id: item.id || idx + 1,
        geometry: {
          type: "Point",
          coordinates: [coords[1], coords[0]],
        },
        properties: cleanProps,
      };
    })
    .filter(Boolean);

  const geoJsonObj = {
    type: "FeatureCollection",
    name: filename.replace(/\.[^/.]+$/, ""),
    crs: {
      type: "name",
      properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" },
    },
    features,
  };

  const jsonStr = JSON.stringify(geoJsonObj, null, 2);
  const blob = new Blob([jsonStr], { type: "application/geo+json;charset=utf-8" });
  triggerDownload(blob, filename.endsWith(".geojson") ? filename : `${filename}.geojson`);
}

/**
 * 4. Ekspor Shapefile Point (.zip)
 * Menghasilkan .shp, .shx, .dbf, dan .prj WGS84 murni dalam format ZIP
 */
export function exportToShapefileZip(
  filename: string,
  layerName: string,
  fields: { key: string; label: string; type?: "C" | "N"; length?: number; decimals?: number }[],
  data: any[],
  getCoords: (item: any) => [number, number] | null
): void {
  // Filter data yang memiliki koordinat valid
  const validItems: { item: any; coords: [number, number] }[] = [];
  data.forEach((item) => {
    const coords = getCoords(item);
    if (coords && !isNaN(coords[0]) && !isNaN(coords[1])) {
      validItems.push({ item, coords });
    }
  });

  const numRecords = validItems.length;

  // Hitung Bounding Box (minX, minY, maxX, maxY) -> lat = Y, lng = X
  let minX = 180,
    minY = 90,
    maxX = -180,
    maxY = -90;
  if (numRecords > 0) {
    validItems.forEach(({ coords }) => {
      const x = coords[1];
      const y = coords[0];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });
  } else {
    minX = 0;
    minY = 0;
    maxX = 0;
    maxY = 0;
  }

  // A. .SHP FILE (Header 100 bytes + numRecords * (8 bytes header + 20 bytes Point))
  // Tiap record point = 28 bytes (14 words 16-bit)
  const shpRecordSize = 28;
  const shpFileLengthBytes = 100 + numRecords * shpRecordSize;
  const shpBuffer = new ArrayBuffer(shpFileLengthBytes);
  const shpView = new DataView(shpBuffer);

  // Header Big Endian
  shpView.setUint32(0, 9994, false); // File Code
  shpView.setUint32(24, shpFileLengthBytes / 2, false); // File length in 16-bit words

  // Header Little Endian
  shpView.setUint32(28, 1000, true); // Version
  shpView.setUint32(32, 1, true); // Shape type 1 = Point
  shpView.setFloat64(36, minX, true); // Xmin
  shpView.setFloat64(44, minY, true); // Ymin
  shpView.setFloat64(52, maxX, true); // Xmax
  shpView.setFloat64(60, maxY, true); // Ymax

  // B. .SHX FILE (Header 100 bytes + numRecords * 8 bytes)
  const shxFileLengthBytes = 100 + numRecords * 8;
  const shxBuffer = new ArrayBuffer(shxFileLengthBytes);
  const shxView = new DataView(shxBuffer);

  shxView.setUint32(0, 9994, false);
  shxView.setUint32(24, shxFileLengthBytes / 2, false);
  shxView.setUint32(28, 1000, true);
  shxView.setUint32(32, 1, true);
  shxView.setFloat64(36, minX, true);
  shxView.setFloat64(44, minY, true);
  shxView.setFloat64(52, maxX, true);
  shxView.setFloat64(60, maxY, true);

  // Tulis records ke .shp dan .shx
  let currentOffsetWords = 50; // 100 bytes / 2
  validItems.forEach(({ coords }, idx) => {
    const recordNum = idx + 1;
    const shpRecordOffset = 100 + idx * shpRecordSize;

    // SHP Record Header (Big Endian)
    shpView.setUint32(shpRecordOffset, recordNum, false);
    shpView.setUint32(shpRecordOffset + 4, 10, false); // 20 bytes content = 10 words

    // SHP Point (Little Endian)
    shpView.setUint32(shpRecordOffset + 8, 1, true); // Shape Type 1 (Point)
    shpView.setFloat64(shpRecordOffset + 12, coords[1], true); // X = Lng
    shpView.setFloat64(shpRecordOffset + 20, coords[0], true); // Y = Lat

    // SHX Entry (Offset words + Content length words)
    const shxEntryOffset = 100 + idx * 8;
    shxView.setUint32(shxEntryOffset, currentOffsetWords, false);
    shxView.setUint32(shxEntryOffset + 4, 10, false);

    currentOffsetWords += shpRecordSize / 2;
  });

  // C. .DBF FILE (dBase III Format)
  // Batasi nama kolom maksimal 10 karakter sesuai standar dBase
  const cleanFields = fields.map((f) => ({
    name: f.label.slice(0, 10).toUpperCase(),
    key: f.key,
    type: f.type || (typeof validItems[0]?.item[f.key] === "number" ? "N" : "C"),
    length: f.length || (f.type === "N" ? 12 : 30),
    decimals: f.decimals || (f.type === "N" ? 2 : 0),
  }));

  const recordLength = 1 + cleanFields.reduce((acc, f) => acc + f.length, 0); // 1 byte delete flag + sum(field lengths)
  const headerLength = 32 + cleanFields.length * 32 + 1; // Header + field descriptors + 0x0D terminator
  const dbfLength = headerLength + numRecords * recordLength + 1; // + 1 byte EOF (0x1A)

  const dbfBuffer = new ArrayBuffer(dbfLength);
  const dbfView = new DataView(dbfBuffer);
  const dbfUint8 = new Uint8Array(dbfBuffer);

  const now = new Date();
  dbfView.setUint8(0, 0x03); // dBase III without memo
  dbfView.setUint8(1, now.getFullYear() - 2000); // YY
  dbfView.setUint8(2, now.getMonth() + 1); // MM
  dbfView.setUint8(3, now.getDate()); // DD
  dbfView.setUint32(4, numRecords, true); // Number of records
  dbfView.setUint16(8, headerLength, true); // Header bytes
  dbfView.setUint16(10, recordLength, true); // Record bytes

  // Field descriptors (32 bytes each)
  cleanFields.forEach((field, fIdx) => {
    const fOffset = 32 + fIdx * 32;
    const nameBytes = new TextEncoder().encode(field.name);
    for (let i = 0; i < 11; i++) {
      dbfView.setUint8(fOffset + i, i < nameBytes.length ? nameBytes[i] : 0);
    }
    dbfView.setUint8(fOffset + 11, field.type.charCodeAt(0)); // Type ('C' or 'N')
    dbfView.setUint8(fOffset + 16, field.length); // Field length
    dbfView.setUint8(fOffset + 17, field.decimals); // Decimals
  });

  dbfView.setUint8(32 + cleanFields.length * 32, 0x0d); // Terminator

  // Records data
  let rowPos = headerLength;
  validItems.forEach(({ item }) => {
    dbfUint8[rowPos] = 0x20; // Deletion flag (space = valid)
    let colPos = rowPos + 1;

    cleanFields.forEach((f) => {
      let valStr = "";
      const rawVal = item[f.key];
      if (rawVal !== undefined && rawVal !== null) {
        valStr = String(rawVal);
      }

      if (f.type === "N") {
        valStr = valStr.slice(0, f.length).padStart(f.length, " ");
      } else {
        valStr = valStr.slice(0, f.length).padEnd(f.length, " ");
      }

      const valBytes = new TextEncoder().encode(valStr);
      for (let i = 0; i < f.length; i++) {
        dbfUint8[colPos + i] = i < valBytes.length ? valBytes[i] : 0x20;
      }
      colPos += f.length;
    });

    rowPos += recordLength;
  });

  dbfUint8[dbfLength - 1] = 0x1a; // EOF

  // D. .PRJ FILE (WGS 84 Projection String)
  const prjString = `GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]]`;
  const prjBytes = new TextEncoder().encode(prjString);

  // Buat ZIP berisi 4 berkas
  const baseName = layerName || "Pokok_Sawit";
  const zipBlob = createZipArchive([
    { name: `${baseName}.shp`, data: new Uint8Array(shpBuffer) },
    { name: `${baseName}.shx`, data: new Uint8Array(shxBuffer) },
    { name: `${baseName}.dbf`, data: dbfUint8 },
    { name: `${baseName}.prj`, data: prjBytes },
  ]);

  triggerDownload(zipBlob, filename.endsWith(".zip") ? filename : `${filename}.zip`);
}
