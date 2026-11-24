import { getAfdelingData, getConditionColor, getModuleColors, MOCK_BLOCK_DATA } from "./mock-data";
import { MODULE_CONFIGS } from "./module-config";
import type { DashboardFilterState } from "./types";

function triggerPrint(htmlContent: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    // Fallback using iframe if popup is blocked
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

const BASE_PRINT_CSS = `
  @page {
    size: A4 portrait;
    margin: 12mm 10mm;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #1e293b;
    background: #ffffff;
    margin: 0;
    padding: 0;
    font-size: 11px;
    line-height: 1.4;
  }
  .page {
    page-break-after: always;
  }
  .page:last-child {
    page-break-after: avoid;
  }
  .header {
    border-bottom: 2px solid #0f172a;
    padding-bottom: 8px;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .header-left h1 {
    font-size: 15px;
    font-weight: 800;
    margin: 0 0 2px 0;
    color: #0f172a;
    letter-spacing: 0.5px;
  }
  .header-left h2 {
    font-size: 11px;
    font-weight: 600;
    margin: 0;
    color: #475569;
  }
  .header-right {
    text-align: right;
    font-size: 9.5px;
    color: #64748b;
  }
  .badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 700;
    font-size: 9px;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px 10px;
    margin-bottom: 12px;
  }
  .meta-item .meta-label {
    font-size: 9px;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
  }
  .meta-item .meta-val {
    font-size: 11px;
    font-weight: 700;
    color: #0f172a;
  }
  .metrics-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 14px;
  }
  .metric-card {
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 8px 10px;
    background: #ffffff;
  }
  .metric-card .title {
    font-size: 9px;
    font-weight: 600;
    color: #64748b;
  }
  .metric-card .value {
    font-size: 15px;
    font-weight: 800;
    margin-top: 2px;
  }
  .metric-card .sub {
    font-size: 8.5px;
    color: #94a3b8;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 14px;
    font-size: 9.5px;
  }
  th {
    background-color: #f1f5f9;
    color: #334155;
    font-weight: 700;
    text-align: left;
    padding: 6px 8px;
    border: 1px solid #cbd5e1;
    text-transform: uppercase;
    font-size: 8.5px;
  }
  td {
    padding: 5px 8px;
    border: 1px solid #e2e8f0;
    vertical-align: middle;
  }
  tr:nth-child(even) td {
    background-color: #f8fafc;
  }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .font-bold { font-weight: 700; }
  .kondisi-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 8.5px;
  }
  .color-dot {
    width: 7px;
    height: 7px;
    border-radius: 2px;
    display: inline-block;
  }
  .signatures {
    margin-top: 20px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    text-align: center;
  }
  .sig-box {
    border-top: 1px solid #cbd5e1;
    padding-top: 6px;
    margin-top: 45px;
    font-weight: 700;
    font-size: 10px;
  }
  .sig-role {
    font-size: 8.5px;
    color: #64748b;
    font-weight: 500;
  }
  .footer-note {
    margin-top: 15px;
    border-top: 1px dashed #cbd5e1;
    padding-top: 6px;
    display: flex;
    justify-content: space-between;
    font-size: 8px;
    color: #94a3b8;
  }
`;

/**
 * 1. Cetak Laporan PDF Tingkat Estate
 */
export function printEstatePDF(filters: DashboardFilterState) {
  const estateName = filters.estate !== "Semua" ? filters.estate : "BUM 1";
  const modConfig = MODULE_CONFIGS[filters.module || "semua"] || MODULE_CONFIGS.semua;
  const unit = modConfig.unit;
  const { realisasiColor } = getModuleColors(filters.module);

  // Ambil data afdelings di estate ini
  const afdelings = getAfdelingData(estateName, filters.module);
  const totalLuas = afdelings.reduce((sum, a) => sum + a.luasHa, 0);
  const totalReal = afdelings.reduce((sum, a) => sum + a.realisasiHa, 0);
  const avgCapaian = totalLuas > 0 ? Number(((totalReal / totalLuas) * 100).toFixed(1)) : 0;
  const sisaLuas = Math.max(0, totalLuas - totalReal);

  // Ambil blok di estate ini
  const estateBlocks = MOCK_BLOCK_DATA.filter((b) => b.estate === estateName).map((b) => {
    const col = getConditionColor(b.capaianPct, filters.module);
    return { ...b, kondisi: col.kondisi, warnaHex: col.hex };
  });

  const todayStr = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const company = filters.company === "BSL" ? "PT BANGKITGIAT USAHA MANDIRI - UNIT BSL" : "PT BANGKITGIAT USAHA MANDIRI (BUM)";

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8"/>
      <title>Laporan_Estate_${estateName.replace(/\s+/g, "_")}_2026</title>
      <style>${BASE_PRINT_CSS}</style>
    </head>
    <body>
      <div class="page">
        <!-- Header KOP -->
        <div class="header">
          <div class="header-left">
            <h1>${company}</h1>
            <h2>DEPARTEMEN GIS & MONITORING OPERASIONAL KEBUN</h2>
          </div>
          <div class="header-right">
            <div>DOKUMEN RESMI INTERNAL</div>
            <div>Dicetak: ${todayStr}</div>
          </div>
        </div>

        <!-- Judul Laporan -->
        <div style="margin-bottom: 12px;">
          <h2 style="font-size: 14px; font-weight: 800; margin: 0 0 2px 0; color: #0f172a;">
            LAPORAN KINERJA OPERASIONAL: ESTATE ${estateName.toUpperCase()}
          </h2>
          <div style="font-size: 10px; color: #64748b;">
            Aktivitas: <strong style="color: ${realisasiColor}">${modConfig.name}</strong> • Modul Resmi Operasional 2026
          </div>
        </div>

        <!-- Meta Info Grid -->
        <div class="meta-grid">
          <div class="meta-item">
            <div class="meta-label">Estate</div>
            <div class="meta-val">${estateName}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Region</div>
            <div class="meta-val">${filters.region !== "Semua" ? filters.region : "REGION 1"}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Periode</div>
            <div class="meta-val">Tahun ${filters.year || 2026} ${filters.month !== "Semua" ? `• Bulan ${filters.month}` : filters.quarter !== "Semua" ? `• ${filters.quarter}` : ""}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Jumlah Afdeling</div>
            <div class="meta-val">${afdelings.length} Afdeling</div>
          </div>
        </div>

        <!-- Ringkasan Kinerja Estate -->
        <div class="metrics-row">
          <div class="metric-card">
            <div class="title">TARGET TOTAL</div>
            <div class="value" style="color: #0f172a;">${totalLuas.toLocaleString("id-ID")} ${unit}</div>
            <div class="sub">Budget Areal ${estateName}</div>
          </div>
          <div class="metric-card">
            <div class="title">REALISASI FISIK</div>
            <div class="value" style="color: ${realisasiColor};">${totalReal.toLocaleString("id-ID")} ${unit}</div>
            <div class="sub">Kumulatif Hasil Lapangan</div>
          </div>
          <div class="metric-card">
            <div class="title">PERSENTASE CAPAIAN</div>
            <div class="value" style="color: ${avgCapaian >= 85 ? "#15803d" : "#b45309"};">${avgCapaian.toFixed(1)}%</div>
            <div class="sub">${avgCapaian >= 85 ? "Status On-Track" : "Perlu Percepatan"}</div>
          </div>
          <div class="metric-card">
            <div class="title">SISA TARGET</div>
            <div class="value" style="color: #64748b;">${sisaLuas.toLocaleString("id-ID")} ${unit}</div>
            <div class="sub">Belum Tuntas</div>
          </div>
        </div>

        <!-- Tabel 1: Rekapitulasi Kinerja per Afdeling -->
        <div style="font-weight: 700; font-size: 11px; margin-bottom: 6px; color: #0f172a;">
          I. Rekapitulasi Capaian per Afdeling
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 35px;" class="text-center">No</th>
              <th>Nama Afdeling</th>
              <th class="text-right">Target (${unit})</th>
              <th class="text-right">Realisasi (${unit})</th>
              <th class="text-center" style="width: 80px;">Capaian (%)</th>
              <th style="width: 120px;">Status Kondisi</th>
            </tr>
          </thead>
          <tbody>
            ${afdelings
              .map(
                (afd, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td class="font-bold">${afd.afdeling}</td>
                <td class="text-right">${afd.luasHa.toLocaleString("id-ID")}</td>
                <td class="text-right font-bold" style="color: ${realisasiColor}">${afd.realisasiHa.toLocaleString("id-ID")}</td>
                <td class="text-center font-bold">${afd.capaianPct.toFixed(1)}%</td>
                <td>
                  <span class="kondisi-pill" style="border: 1px solid ${afd.warnaHex};">
                    <span class="color-dot" style="background-color: ${afd.warnaHex};"></span>
                    ${afd.kondisi}
                  </span>
                </td>
              </tr>
            `
              )
              .join("")}
            <tr style="background-color: #f1f5f9; font-weight: 800;">
              <td colspan="2" class="text-center">TOTAL / RATA-RATA ESTATE</td>
              <td class="text-right">${totalLuas.toLocaleString("id-ID")} ${unit}</td>
              <td class="text-right" style="color: ${realisasiColor}">${totalReal.toLocaleString("id-ID")} ${unit}</td>
              <td class="text-center">${avgCapaian.toFixed(1)}%</td>
              <td>-</td>
            </tr>
          </tbody>
        </table>

        <!-- Tabel 2: Sampel Blok Kinerja Unggulan & Perlu Perhatian -->
        <div style="font-weight: 700; font-size: 11px; margin-bottom: 6px; color: #0f172a; margin-top: 14px;">
          II. Sampel Blok Operasional (${estateBlocks.length} Blok Terdata)
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 60px;">Afdeling</th>
              <th style="width: 50px;">Blok</th>
              <th>Pos Mandor</th>
              <th class="text-right">Target (${unit})</th>
              <th class="text-right">Realisasi (${unit})</th>
              <th class="text-center" style="width: 70px;">Capaian</th>
              <th class="text-center" style="width: 50px;">SPH</th>
              <th style="width: 110px;">Status Kondisi</th>
            </tr>
          </thead>
          <tbody>
            ${estateBlocks
              .slice(0, 10)
              .map(
                (b) => `
              <tr>
                <td>${b.afdeling}</td>
                <td class="font-bold">${b.blok}</td>
                <td>${b.warung}</td>
                <td class="text-right">${b.luasHa.toFixed(1)}</td>
                <td class="text-right font-bold" style="color: ${realisasiColor}">${b.realisasiHa.toFixed(1)}</td>
                <td class="text-center font-bold">${b.capaianPct.toFixed(1)}%</td>
                <td class="text-center">${b.sph}</td>
                <td>
                  <span class="kondisi-pill" style="border: 1px solid ${b.warnaHex};">
                    <span class="color-dot" style="background-color: ${b.warnaHex};"></span>
                    ${b.kondisi}
                  </span>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <!-- Kolom Pengesahan Tanda Tangan -->
        <div class="signatures">
          <div>
            <div class="sig-role">Dibuat Oleh:</div>
            <div class="sig-box">( Kepala Tata Usaha / KTU )</div>
          </div>
          <div>
            <div class="sig-role">Diperiksa Oleh:</div>
            <div class="sig-box">( Asisten Kepala / Askep )</div>
          </div>
          <div>
            <div class="sig-role">Mengetahui & Menyetujui:</div>
            <div class="sig-box">( Estate Manager / EM )</div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer-note">
          <div>Dicetak Otomatis dari GIS Web Dashboard • Sistem Monitoring Kebun 2026</div>
          <div>Halaman 1 dari 1</div>
        </div>
      </div>
    </body>
    </html>
  `;

  triggerPrint(html);
}

/**
 * 2. Cetak Laporan PDF Tingkat Afdeling (AFD) Tertentu
 */
export function printAfdelingPDF(estateName: string, afdelingName: string, filters: DashboardFilterState) {
  const modConfig = MODULE_CONFIGS[filters.module || "semua"] || MODULE_CONFIGS.semua;
  const unit = modConfig.unit;
  const { realisasiColor } = getModuleColors(filters.module);

  // Dapatkan blok yang ada di Afdeling ini
  let afdBlocks = MOCK_BLOCK_DATA.filter(
    (b) => b.estate === estateName && (b.afdeling?.toLowerCase() === afdelingName.toLowerCase() || b.afdeling?.includes(afdelingName))
  );

  // Jika sampel blok tidak cocok persis string, fallback cari berdasarkan afdeling
  if (afdBlocks.length === 0) {
    afdBlocks = MOCK_BLOCK_DATA.filter((b) => b.estate === estateName).slice(0, 8);
  }

  const coloredBlocks = afdBlocks.map((b) => {
    const col = getConditionColor(b.capaianPct, filters.module);
    return { ...b, kondisi: col.kondisi, warnaHex: col.hex };
  });

  const totalLuas = coloredBlocks.reduce((sum, b) => sum + b.luasHa, 0);
  const totalReal = coloredBlocks.reduce((sum, b) => sum + b.realisasiHa, 0);
  const avgCapaian = totalLuas > 0 ? Number(((totalReal / totalLuas) * 100).toFixed(1)) : 0;
  const sisaLuas = Math.max(0, totalLuas - totalReal);

  const todayStr = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const company = filters.company === "BSL" ? "PT BANGKITGIAT USAHA MANDIRI - UNIT BSL" : "PT BANGKITGIAT USAHA MANDIRI (BUM)";

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8"/>
      <title>Lembar_Kerja_${afdelingName.replace(/\s+/g, "_")}_${estateName.replace(/\s+/g, "_")}</title>
      <style>${BASE_PRINT_CSS}</style>
    </head>
    <body>
      <div class="page">
        <!-- Header KOP -->
        <div class="header">
          <div class="header-left">
            <h1>${company}</h1>
            <h2>DIVISI OPERASIONAL KEBUN KELAPA SAWIT • DEPARTEMEN GIS</h2>
          </div>
          <div class="header-right">
            <div>LEMBAR KERJA LAPANGAN (AFD)</div>
            <div>Dicetak: ${todayStr}</div>
          </div>
        </div>

        <!-- Judul Laporan -->
        <div style="margin-bottom: 12px;">
          <h2 style="font-size: 14px; font-weight: 800; margin: 0 0 2px 0; color: #0f172a;">
            LEMBAR KERJA OPERASIONAL: ${afdelingName.toUpperCase()}
          </h2>
          <div style="font-size: 10px; color: #64748b;">
            Estate: <strong>${estateName}</strong> • Modul: <strong style="color: ${realisasiColor}">${modConfig.name}</strong> (${unit})
          </div>
        </div>

        <!-- Meta Info Grid -->
        <div class="meta-grid">
          <div class="meta-item">
            <div class="meta-label">Afdeling</div>
            <div class="meta-val">${afdelingName}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Estate / Kebun</div>
            <div class="meta-val">${estateName}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Periode</div>
            <div class="meta-val">Tahun ${filters.year || 2026} ${filters.month !== "Semua" ? `• Bulan ${filters.month}` : filters.quarter !== "Semua" ? `• ${filters.quarter}` : ""}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Jumlah Blok</div>
            <div class="meta-val">${coloredBlocks.length} Blok Terdaftar</div>
          </div>
        </div>

        <!-- Ringkasan Kinerja Afdeling -->
        <div class="metrics-row">
          <div class="metric-card">
            <div class="title">LUAS TARGET AFD</div>
            <div class="value" style="color: #0f172a;">${totalLuas.toFixed(1)} ${unit}</div>
            <div class="sub">Total Areal Terdaftar</div>
          </div>
          <div class="metric-card">
            <div class="title">REALISASI SELESAI</div>
            <div class="value" style="color: ${realisasiColor};">${totalReal.toFixed(1)} ${unit}</div>
            <div class="sub">Capaian Aktual Fisik</div>
          </div>
          <div class="metric-card">
            <div class="title">PERSENTASE CAPAIAN</div>
            <div class="value" style="color: ${avgCapaian >= 85 ? "#15803d" : "#b45309"};">${avgCapaian.toFixed(1)}%</div>
            <div class="sub">${avgCapaian >= 85 ? "Target Selesai / Terkendali" : "Perlu Percepatan Pekerjaan"}</div>
          </div>
          <div class="metric-card">
            <div class="title">SISA TARGET LUAS</div>
            <div class="value" style="color: #64748b;">${sisaLuas.toFixed(1)} ${unit}</div>
            <div class="sub">Areal Belum Tuntas</div>
          </div>
        </div>

        <!-- Tabel Rincian Blok di Afdeling -->
        <div style="font-weight: 700; font-size: 11px; margin-bottom: 6px; color: #0f172a;">
          Daftar Rincian Blok & Progres ${modConfig.name}
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px;" class="text-center">No</th>
              <th style="width: 55px;">Blok</th>
              <th style="width: 100px;">Pos Mandor</th>
              <th class="text-right" style="width: 70px;">Luas (${unit})</th>
              <th class="text-right" style="width: 80px;">Realisasi (${unit})</th>
              <th class="text-center" style="width: 65px;">Capaian (%)</th>
              <th class="text-center" style="width: 50px;">SPH</th>
              <th style="width: 120px;">Status Kondisi</th>
              <th>Catatan Evaluasi Mandor</th>
            </tr>
          </thead>
          <tbody>
            ${coloredBlocks
              .map(
                (b, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td class="font-bold">${b.blok}</td>
                <td>${b.warung}</td>
                <td class="text-right">${b.luasHa.toFixed(1)}</td>
                <td class="text-right font-bold" style="color: ${realisasiColor}">${b.realisasiHa.toFixed(1)}</td>
                <td class="text-center font-bold">${b.capaianPct.toFixed(1)}%</td>
                <td class="text-center">${b.sph}</td>
                <td>
                  <span class="kondisi-pill" style="border: 1px solid ${b.warnaHex};">
                    <span class="color-dot" style="background-color: ${b.warnaHex};"></span>
                    ${b.kondisi}
                  </span>
                </td>
                <td style="font-size: 8.5px; color: #475569;">${b.keterangan || "Pekerjaan sesuai SOP standar"}</td>
              </tr>
            `
              )
              .join("")}
            <tr style="background-color: #f1f5f9; font-weight: 800;">
              <td colspan="3" class="text-center">TOTAL KESELURUHAN AFDELING</td>
              <td class="text-right">${totalLuas.toFixed(1)} ${unit}</td>
              <td class="text-right" style="color: ${realisasiColor}">${totalReal.toFixed(1)} ${unit}</td>
              <td class="text-center">${avgCapaian.toFixed(1)}%</td>
              <td class="text-center">-</td>
              <td colspan="2">-</td>
            </tr>
          </tbody>
        </table>

        <!-- Kolom Pengesahan Tanda Tangan Lapangan -->
        <div class="signatures">
          <div>
            <div class="sig-role">Dibuat Oleh:</div>
            <div class="sig-box">( Mandor / Kerani AFD )</div>
          </div>
          <div>
            <div class="sig-role">Diperiksa & Diverifikasi:</div>
            <div class="sig-box">( Asisten Afdeling )</div>
          </div>
          <div>
            <div class="sig-role">Mengetahui:</div>
            <div class="sig-box">( Estate Manager )</div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer-note">
          <div>Lembar Kerja Resmi Afdeling • PT BUM & BSL • Departemen GIS & Operasional</div>
          <div>Halaman 1 dari 1</div>
        </div>
      </div>
    </body>
    </html>
  `;

  triggerPrint(html);
}

/**
 * 3. Cetak Bundle Seluruh Afdeling Sekaligus (Setiap AFD per Lembar Terpisah)
 */
export function printAllAfdelingsPDF(estateName: string, filters: DashboardFilterState) {
  const afdelings = getAfdelingData(estateName, filters.module);
  const modConfig = MODULE_CONFIGS[filters.module || "semua"] || MODULE_CONFIGS.semua;
  const unit = modConfig.unit;
  const { realisasiColor } = getModuleColors(filters.module);

  const todayStr = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const company = filters.company === "BSL" ? "PT BANGKITGIAT USAHA MANDIRI - UNIT BSL" : "PT BANGKITGIAT USAHA MANDIRI (BUM)";

  const pagesHtml = afdelings
    .map((afd, pageIdx) => {
      let afdBlocks = MOCK_BLOCK_DATA.filter(
        (b) => b.estate === estateName && (b.afdeling?.toLowerCase() === afd.afdeling.toLowerCase() || b.afdeling?.includes(afd.afdeling))
      );
      if (afdBlocks.length === 0) {
        afdBlocks = MOCK_BLOCK_DATA.filter((b) => b.estate === estateName).slice(0, 8);
      }

      const coloredBlocks = afdBlocks.map((b) => {
        const col = getConditionColor(b.capaianPct, filters.module);
        return { ...b, kondisi: col.kondisi, warnaHex: col.hex };
      });

      const totalLuas = coloredBlocks.reduce((sum, b) => sum + b.luasHa, 0);
      const totalReal = coloredBlocks.reduce((sum, b) => sum + b.realisasiHa, 0);
      const avgCapaian = totalLuas > 0 ? Number(((totalReal / totalLuas) * 100).toFixed(1)) : 0;
      const sisaLuas = Math.max(0, totalLuas - totalReal);

      return `
        <div class="page">
          <!-- Header KOP -->
          <div class="header">
            <div class="header-left">
              <h1>${company}</h1>
              <h2>DIVISI OPERASIONAL KEBUN KELAPA SAWIT • BUNDLE AFDELING</h2>
            </div>
            <div class="header-right">
              <div>LEMBAR KERJA: ${afd.afdeling.toUpperCase()}</div>
              <div>Dicetak: ${todayStr}</div>
            </div>
          </div>

          <!-- Judul Laporan -->
          <div style="margin-bottom: 12px;">
            <h2 style="font-size: 14px; font-weight: 800; margin: 0 0 2px 0; color: #0f172a;">
              LEMBAR KERJA: ${afd.afdeling.toUpperCase()} • ESTATE ${estateName.toUpperCase()}
            </h2>
            <div style="font-size: 10px; color: #64748b;">
              Modul: <strong style="color: ${realisasiColor}">${modConfig.name}</strong> (${unit}) • Berkas Bundle Afdeling
            </div>
          </div>

          <!-- Meta Info Grid -->
          <div class="meta-grid">
            <div class="meta-item">
              <div class="meta-label">Afdeling</div>
              <div class="meta-val">${afd.afdeling}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Estate</div>
              <div class="meta-val">${estateName}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Periode</div>
              <div class="meta-val">Tahun ${filters.year || 2026} ${filters.month !== "Semua" ? `• Bulan ${filters.month}` : filters.quarter !== "Semua" ? `• ${filters.quarter}` : ""}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Dokumen Bagian</div>
              <div class="meta-val">Afdeling ${pageIdx + 1} dari ${afdelings.length}</div>
            </div>
          </div>

          <!-- Ringkasan Kinerja -->
          <div class="metrics-row">
            <div class="metric-card">
              <div class="title">TARGET AFD</div>
              <div class="value">${totalLuas.toFixed(1)} ${unit}</div>
            </div>
            <div class="metric-card">
              <div class="title">REALISASI</div>
              <div class="value" style="color: ${realisasiColor};">${totalReal.toFixed(1)} ${unit}</div>
            </div>
            <div class="metric-card">
              <div class="title">PERSENTASE</div>
              <div class="value" style="color: ${avgCapaian >= 85 ? "#15803d" : "#b45309"};">${avgCapaian.toFixed(1)}%</div>
            </div>
            <div class="metric-card">
              <div class="title">SISA TARGET</div>
              <div class="value">${sisaLuas.toFixed(1)} ${unit}</div>
            </div>
          </div>

          <!-- Tabel Blok -->
          <table>
            <thead>
              <tr>
                <th style="width: 30px;" class="text-center">No</th>
                <th style="width: 60px;">Blok</th>
                <th>Pos Mandor</th>
                <th class="text-right" style="width: 75px;">Luas (${unit})</th>
                <th class="text-right" style="width: 85px;">Realisasi (${unit})</th>
                <th class="text-center" style="width: 70px;">Capaian (%)</th>
                <th class="text-center" style="width: 50px;">SPH</th>
                <th style="width: 130px;">Status Kondisi</th>
              </tr>
            </thead>
            <tbody>
              ${coloredBlocks
                .map(
                  (b, idx) => `
                <tr>
                  <td class="text-center">${idx + 1}</td>
                  <td class="font-bold">${b.blok}</td>
                  <td>${b.warung}</td>
                  <td class="text-right">${b.luasHa.toFixed(1)}</td>
                  <td class="text-right font-bold" style="color: ${realisasiColor}">${b.realisasiHa.toFixed(1)}</td>
                  <td class="text-center font-bold">${b.capaianPct.toFixed(1)}%</td>
                  <td class="text-center">${b.sph}</td>
                  <td>
                    <span class="kondisi-pill" style="border: 1px solid ${b.warnaHex};">
                      <span class="color-dot" style="background-color: ${b.warnaHex};"></span>
                      ${b.kondisi}
                    </span>
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <!-- Signatures -->
          <div class="signatures">
            <div>
              <div class="sig-role">Dibuat Oleh:</div>
              <div class="sig-box">( Mandor / Kerani AFD )</div>
            </div>
            <div>
              <div class="sig-role">Diperiksa:</div>
              <div class="sig-box">( Asisten Afdeling )</div>
            </div>
            <div>
              <div class="sig-role">Mengetahui:</div>
              <div class="sig-box">( Estate Manager )</div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer-note">
            <div>Berkas Bundle Laporan Afdeling • ${estateName} • PT BUM & BSL</div>
            <div>Lembar ${pageIdx + 1} dari ${afdelings.length}</div>
          </div>
        </div>
      `;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8"/>
      <title>Bundle_Laporan_Seluruh_Afdeling_${estateName.replace(/\s+/g, "_")}</title>
      <style>${BASE_PRINT_CSS}</style>
    </head>
    <body>
      ${pagesHtml}
    </body>
    </html>
  `;

  triggerPrint(html);
}
