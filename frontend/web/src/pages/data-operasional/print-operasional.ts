/**
 * @file print-operasional.ts
 * @description Modul Cetak Laporan Operasional dan Peta Kartografi (A4 Print Engine).
 * Mengadaptasi standar kartografi dari RustGIS dan format pelaporan perkebunan.
 */

import type { OperasionalRecord, OperasionalStats } from "./types";

interface PrintFilterMetadata {
  estate: string;
  afdeling: string;
  kondisi: string;
  aktivitas: string;
}

function triggerPrintWindow(htmlContent: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1500);
    return;
  }

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 400);
}

const COMMON_PRINT_CSS = `
  @page {
    size: A4 portrait;
    margin: 10mm 12mm;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #0f172a;
    background: #ffffff;
    margin: 0;
    padding: 0;
    font-size: 11px;
    line-height: 1.4;
  }
  .header {
    border-bottom: 2px solid #0f172a;
    padding-bottom: 8px;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .title {
    font-size: 16px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #0f172a;
    margin: 0;
  }
  .subtitle {
    font-size: 10px;
    color: #64748b;
    margin-top: 2px;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px 12px;
    margin-bottom: 12px;
    font-size: 10.5px;
  }
  .meta-item strong {
    color: #475569;
    display: block;
    font-size: 9px;
    text-transform: uppercase;
  }
  .kpi-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 14px;
  }
  .kpi-card {
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 8px;
    text-align: center;
    background: #ffffff;
  }
  .kpi-val {
    font-size: 15px;
    font-weight: 800;
    color: #0f172a;
  }
  .kpi-lbl {
    font-size: 9px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
  }
  th {
    background: #f1f5f9;
    color: #334155;
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    border: 1px solid #cbd5e1;
    padding: 6px 8px;
    text-align: left;
  }
  td {
    border: 1px solid #e2e8f0;
    padding: 5px 8px;
    font-size: 10px;
  }
  tr:nth-child(even) {
    background: #f8fafc;
  }
  .badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 700;
  }
  .badge-bapp { background: #dcfce7; color: #15803d; }
  .badge-baik { background: #f0fdf4; color: #16a34a; }
  .badge-sedang { background: #fef9c3; color: #854d0e; }
  .badge-berat { background: #fee2e2; color: #b91c1c; }
  .signatures {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-top: 24px;
    page-break-inside: avoid;
  }
  .sign-box {
    border: 1px dashed #cbd5e1;
    border-radius: 6px;
    padding: 10px;
    text-align: center;
  }
  .sign-title {
    font-size: 10px;
    font-weight: 700;
    color: #475569;
    margin-bottom: 45px;
  }
  .sign-name {
    font-size: 10px;
    font-weight: 700;
    border-top: 1px solid #0f172a;
    padding-top: 4px;
    display: inline-block;
    width: 80%;
  }
`;

/**
 * Cetak Laporan Operasional Kebun (Format A4 Standar)
 */
export function printLaporanOperasional(
  records: OperasionalRecord[],
  stats: OperasionalStats,
  filters: PrintFilterMetadata
) {
  const currentDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const getBadgeClass = (kondisi: string) => {
    const k = kondisi.toLowerCase();
    if (k.includes("bapp") || k.includes("selesai")) return "badge-bapp";
    if (k.includes("rotasi 2") || k.includes("baik")) return "badge-baik";
    if (k.includes("rotasi 1") || k.includes("sedang")) return "badge-sedang";
    return "badge-berat";
  };

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Laporan Realisasi Operasional Kebun</title>
      <style>${COMMON_PRINT_CSS}</style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="title">Laporan Realisasi Operasional Kebun</h1>
          <div class="subtitle">Sistem Informasi Geografis & Manajemen Operasional Perkebunan</div>
        </div>
        <div style="text-align: right; font-size: 9.5px; color: #64748b;">
          Dicetak: ${currentDate}<br>
          Status: <strong>Dokumen Resmi</strong>
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <strong>Estate</strong>
          ${filters.estate === "all" ? "Semua Estate" : filters.estate}
        </div>
        <div class="meta-item">
          <strong>Afdeling</strong>
          ${filters.afdeling === "all" ? "Semua Afdeling" : filters.afdeling}
        </div>
        <div class="meta-item">
          <strong>Filter Kondisi</strong>
          ${filters.kondisi === "all" ? "Semua Kondisi" : filters.kondisi}
        </div>
        <div class="meta-item">
          <strong>Total Blok Terdata</strong>
          ${stats.totalBlok} Blok Kerja
        </div>
      </div>

      <div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-val">${stats.totalTargetHa.toFixed(1)} Ha</div>
          <div class="kpi-lbl">Total Target Luas</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val">${stats.totalRealisasiHa.toFixed(1)} Ha</div>
          <div class="kpi-lbl">Total Realisasi</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val">${stats.rataCapaianPersen.toFixed(1)}%</div>
          <div class="kpi-lbl">Rata-Rata Capaian</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val">${stats.blokSelesaiCount} Blok</div>
          <div class="kpi-lbl">Selesai (BAPP)</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 35px; text-align: center;">No</th>
            <th>Estate / Afd</th>
            <th>Blok</th>
            <th>Aktivitas</th>
            <th style="text-align: right;">Target (Ha)</th>
            <th style="text-align: right;">Realisasi (Ha)</th>
            <th style="text-align: center;">Capaian</th>
            <th>Kondisi Blok</th>
            <th>Mandor Pelaksana</th>
            <th style="text-align: center;">Peta</th>
          </tr>
        </thead>
        <tbody>
          ${records
            .map(
              (r, idx) => `
            <tr>
              <td style="text-align: center;">${idx + 1}</td>
              <td>${r.estate} - ${r.afdeling}</td>
              <td><strong>${r.blok}</strong></td>
              <td>${r.aktivitas.toUpperCase()}</td>
              <td style="text-align: right;">${r.luas_ha.toFixed(1)}</td>
              <td style="text-align: right;">${r.realisasi_luas_ha.toFixed(1)}</td>
              <td style="text-align: center; font-weight: 700;">${r.capaian_persen}%</td>
              <td><span class="badge ${getBadgeClass(r.kondisi)}">${r.kondisi}</span></td>
              <td>${r.kontraktor}</td>
              <td style="text-align: center; font-size: 9px;">${r.update_peta}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <div class="signatures">
        <div class="sign-box">
          <div class="sign-title">Dibuat Oleh (Mandor)</div>
          <div class="sign-name">Mandor Operasional</div>
        </div>
        <div class="sign-box">
          <div class="sign-title">Diperiksa Oleh (Asisten)</div>
          <div class="sign-name">Asisten Afdeling</div>
        </div>
        <div class="sign-box">
          <div class="sign-title">Disetujui Oleh (Askep)</div>
          <div class="sign-name">Asisten Kepala</div>
        </div>
      </div>
    </body>
    </html>
  `;

  triggerPrintWindow(html);
}


/**
 * Cetak Peta Kartografi Blok Afdeling (Format A4 Landscape Berstandar RustGIS)
 */
export function printPetaKartografi(params: {
  estate: string;
  afdeling: string;
  blocks: { blok: string; luas_ha: number; kondisi: string; statusColor: string }[];
  totalHa: number;
}) {
  const currentDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Peta Kartografi Kerja Blok - ${params.afdeling}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 8mm 10mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 0;
        }
        .map-sheet {
          border: 2px solid #0f172a;
          padding: 8px;
          height: calc(100vh - 20px);
          display: flex;
          flex-direction: column;
        }
        .map-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 6px;
          margin-bottom: 8px;
        }
        .kop-title {
          font-size: 14px;
          font-weight: 800;
          text-transform: uppercase;
          margin: 0;
        }
        .kop-meta {
          font-size: 10px;
          color: #475569;
        }
        .canvas-container {
          flex: 1;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          overflow: hidden;
        }
        .block-grid-simulation {
          display: grid;
          grid-template-columns: repeat(3, 110px);
          grid-template-rows: repeat(2, 80px);
          gap: 12px;
          padding: 20px;
        }
        .block-card-sim {
          border-radius: 6px;
          border: 2px solid rgba(0,0,0,0.25);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 800;
          text-shadow: 0 1px 2px rgba(0,0,0,0.6);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .north-arrow {
          position: absolute;
          top: 15px;
          right: 20px;
          text-align: center;
          font-size: 10px;
          font-weight: 800;
        }
        .north-arrow svg {
          width: 32px;
          height: 32px;
        }
        .scale-bar {
          position: absolute;
          bottom: 12px;
          left: 15px;
          background: rgba(255,255,255,0.9);
          padding: 4px 8px;
          border: 1px solid #94a3b8;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 700;
        }
        .map-footer {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 12px;
          border-top: 1.5px solid #0f172a;
          padding-top: 6px;
          margin-top: 8px;
          font-size: 9.5px;
        }
        .legend-box {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }
      </style>
    </head>
    <body>
      <div class="map-sheet">
        <div class="map-header">
          <div>
            <h1 class="kop-title">Peta Spasial Realisasi Kerja Blok — ${params.afdeling} (${params.estate})</h1>
            <div class="kop-meta">Sistem Informasi Geospasial Perkebunan • Proyeksi EPSG:3857 (WGS 84)</div>
          </div>
          <div style="text-align: right; font-size: 9.5px;">
            Tanggal: <strong>${currentDate}</strong><br>
            Total Luas: <strong>${params.totalHa.toFixed(1)} Ha</strong>
          </div>
        </div>

        <div class="canvas-container">
          <div class="north-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2">
              <polygon points="12,2 19,21 12,17 5,21" fill="#0f172a" />
            </svg>
            <div>U</div>
          </div>

          <div class="block-grid-simulation">
            ${params.blocks
              .map(
                (b) => `
              <div class="block-card-sim" style="background: ${b.statusColor};">
                <span style="font-size: 14px;">${b.blok}</span>
                <span style="font-size: 9.5px; opacity: 0.9;">${b.luas_ha} Ha</span>
                <span style="font-size: 8px; font-weight: normal; margin-top: 2px; background: rgba(0,0,0,0.3); padding: 1px 4px; border-radius: 3px;">${b.kondisi}</span>
              </div>
            `
              )
              .join("")}
          </div>

          <div class="scale-bar">
            Skala 1:5.000 &bull; 0 ── 250m ── 500m
          </div>
        </div>

        <div class="map-footer">
          <div class="legend-box">
            <strong>LEGENDA:</strong>
            <div class="legend-item"><div class="legend-color" style="background: #15803d;"></div> BAPP / Selesai</div>
            <div class="legend-item"><div class="legend-color" style="background: #22c55e;"></div> Baik / Rotasi 2</div>
            <div class="legend-item"><div class="legend-color" style="background: #eab308;"></div> Sedang / Rotasi 1</div>
            <div class="legend-item"><div class="legend-color" style="background: #ef4444;"></div> Berat / Belum</div>
          </div>
          <div style="text-align: center;">
            <div>Diperiksa: Asisten Afdeling</div>
            <div style="margin-top: 20px; font-weight: 700;">( .................................... )</div>
          </div>
          <div style="text-align: center;">
            <div>Disetujui: Askep Estate</div>
            <div style="margin-top: 20px; font-weight: 700;">( .................................... )</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  triggerPrintWindow(html);
}
