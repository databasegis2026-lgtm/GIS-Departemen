/**
 * @file print-rekap-pdf.ts
 * @description Mesin cetak PDF Berita Acara Rekap Pekerjaan Kebun & Peta Hasil Unggahan SHP.
 * Format A4 dengan 50% bagian atas memuat kartografi peta & ringkasan metrik (Pokok vs Luas),
 * dan 50% bagian bawah merupakan space kosong terstruktur untuk keperluan catatan lapangan kebun.
 */

import type { RekapPekerjaanRecord } from "./types";

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

export function printRekapPekerjaanPdf(record: RekapPekerjaanRecord) {
  const currentDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isCommitted = Boolean(record.database_committed || record.status_verifikasi === "verified");
  const pokokVal = record.realisasi_pokok || Math.round(record.realisasi_luas_ha * (record.sph || 136));
  const sphVal = record.sph_blok || record.sph || 136;
  const estimasiLuas = record.luas_estimasi_sph || (pokokVal / sphVal);

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Peta Rekap Lapangan - ${record.blok} (${record.estate})</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 8mm 10mm;
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
          font-size: 10px;
          line-height: 1.35;
        }

        .sheet {
          border: 1.5px solid #0f172a;
          padding: 10px;
          min-height: calc(100vh - 16px);
          display: flex;
          flex-direction: column;
        }

        /* ─── KOP HEADER ─── */
        .kop {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 6px;
          margin-bottom: 8px;
        }
        .kop-brand {
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .kop-dept {
          font-size: 9px;
          color: #475569;
          font-weight: 600;
        }
        .kop-doc {
          text-align: right;
        }
        .kop-title {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          color: #0f172a;
        }
        .kop-num {
          font-size: 9px;
          font-family: monospace;
          color: #64748b;
        }

        /* ─── METADATA GRID ─── */
        .meta-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
          font-size: 9.5px;
        }
        .meta-table td {
          border: 1px solid #cbd5e1;
          padding: 3px 6px;
        }
        .meta-label {
          background: #f1f5f9;
          font-weight: 700;
          color: #334155;
          width: 16%;
        }
        .meta-val {
          font-weight: 600;
          color: #0f172a;
          width: 34%;
        }

        /* ─── KANVAS PETA 50% BAGIAN ATAS ─── */
        .map-section {
          height: 250px;
          border: 1.5px solid #0f172a;
          background: #020617;
          position: relative;
          overflow: hidden;
          margin-bottom: 8px;
          border-radius: 4px;
        }
        .map-svg {
          width: 100%;
          height: 100%;
        }

        /* Watermark / Badge Status Spasial di Peta */
        .map-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          padding: 3px 8px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .badge-draft {
          background: #78350f;
          color: #fef3c7;
          border: 1px solid #f59e0b;
        }
        .badge-final {
          background: #064e3b;
          color: #a7f3d0;
          border: 1px solid #10b981;
        }

        .map-legend {
          position: absolute;
          bottom: 8px;
          left: 8px;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid #334155;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 8.5px;
          color: #e2e8f0;
        }
        .legend-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 2px;
        }

        .map-compass {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid #334155;
          border-radius: 3px;
          padding: 3px 6px;
          color: #f8fafc;
          font-size: 8px;
          font-weight: 800;
          text-align: center;
        }

        /* ─── SEPARASI GARIS TENGAH ─── */
        .divider {
          border-top: 2px dashed #0f172a;
          margin: 6px 0 8px 0;
          position: relative;
          text-align: center;
        }
        .divider-label {
          position: relative;
          top: -8px;
          background: #ffffff;
          padding: 0 12px;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #64748b;
        }

        /* ─── 50% BAGIAN BAWAH: SPACE KHUSUS KEBUN ─── */
        .estate-workspace {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .section-box {
          border: 1px solid #94a3b8;
          border-radius: 4px;
          padding: 6px 8px;
        }
        .section-title {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          color: #0f172a;
          margin-bottom: 4px;
          display: flex;
          justify-content: space-between;
        }

        /* Area Tulisan Tangan Mandor/Asisten Bergaris Halus */
        .lined-area {
          height: 110px;
          background: repeating-linear-gradient(
            to bottom,
            transparent,
            transparent 21px,
            #e2e8f0 22px
          );
          border: 1px solid #cbd5e1;
          border-radius: 3px;
        }

        /* Kotak Sketsa Lapangan */
        .sketch-area {
          height: 90px;
          border: 1px dashed #cbd5e1;
          border-radius: 3px;
          background: #fafafa;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-style: italic;
          font-size: 9px;
        }

        /* ─── MATRIKS TANDA TANGAN 4 PIHAK ─── */
        .sign-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-top: auto;
          padding-top: 4px;
        }
        .sign-card {
          border: 1px solid #0f172a;
          border-radius: 4px;
          padding: 4px;
          text-align: center;
          height: 80px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .sign-role {
          font-size: 8.5px;
          font-weight: 800;
          text-transform: uppercase;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 2px;
          color: #1e293b;
        }
        .sign-space {
          flex: 1;
        }
        .sign-name {
          font-size: 8.5px;
          font-weight: 700;
          border-top: 1px solid #64748b;
          margin: 0 4px;
          padding-top: 2px;
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        <!-- 1. KOP SURAT -->
        <div class="kop">
          <div>
            <div class="kop-brand">PT BUMI UTAMA MAKMUR</div>
            <div class="kop-dept">DEPARTEMEN SISTEM INFORMASI GEOGRAFIS (GIS) &bull; DIVISI KEBUN</div>
          </div>
          <div class="kop-doc">
            <div class="kop-title">BERITA ACARA REKAP PEKERJAAN RUTIN &amp; SHP LAPANGAN</div>
            <div class="kop-num">KODE: ${record.kode_rekap} &bull; CETAK: ${currentDate}</div>
          </div>
        </div>

        <!-- 2. TABEL METADATA BLOK & KEBUN -->
        <table class="meta-table">
          <tr>
            <td class="meta-label">Wilayah / Estate</td>
            <td class="meta-val">${record.region} &bull; ${record.estate} (${record.afdeling})</td>
            <td class="meta-label">Aktivitas Rutin</td>
            <td class="meta-val">${record.aktivitas.toUpperCase().replace("_", " ")} &bull; Kondisi: ${record.kondisi}</td>
          </tr>
          <tr>
            <td class="meta-label">Lokasi Blok &amp; Warung</td>
            <td class="meta-val">Blok ${record.blok} &bull; ${record.warung}</td>
            <td class="meta-label">Realisasi Pokok (Fisik)</td>
            <td class="meta-val"><strong>${pokokVal.toLocaleString("id-ID")} Pokok</strong> (SPH: ${sphVal})</td>
          </tr>
          <tr>
            <td class="meta-label">Luas Baku Master HO</td>
            <td class="meta-val">${record.luas_ha.toFixed(1)} Ha</td>
            <td class="meta-label">Estimasi Luas (SPH)</td>
            <td class="meta-val"><strong>${estimasiLuas.toFixed(2)} Ha</strong> (${record.capaian_persen.toFixed(0)}% Capaian)</td>
          </tr>
          <tr>
            <td class="meta-label">Mandor / Kontraktor</td>
            <td class="meta-val">${record.kontraktor}</td>
            <td class="meta-label">Berkas SHP Riil Kebun</td>
            <td class="meta-val">${record.shp_file_name || "Unggahan_SHP_Lapangan.zip"}</td>
          </tr>
        </table>

        <!-- 3. KANVAS PETA SPASIAL 50% BAGIAN ATAS -->
        <div class="map-section">
          <!-- Status Spasial Badge -->
          <div class="map-badge ${isCommitted ? "badge-final" : "badge-draft"}">
            ${isCommitted ? "TERSIMPAN DI DATABASE SPASIAL (FINAL)" : "DRAF SEMENTARA (BELUM MASUK DATABASE)"}
          </div>

          <!-- Arah Utara & Skala -->
          <div class="map-compass">
            &uarr;<br>UTARA<br><span style="font-size: 7px; font-weight: normal;">1:5.000</span>
          </div>

          <!-- Render Kartografi Peta SVG -->
          <svg class="map-svg" viewBox="0 0 800 360">
            <!-- Grid Koordinat UTM Cartographic -->
            <defs>
              <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#1e293b" stroke-width="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            <!-- Batas Blok Master Resmi (Database HO) -->
            <polygon
              points="140,40 680,40 680,310 140,310"
              fill="rgba(100, 116, 139, 0.12)"
              stroke="#94a3b8"
              stroke-width="2.5"
              stroke-dasharray="8,6"
            />
            <text x="150" y="60" fill="#cbd5e1" font-size="12" font-family="monospace" font-weight="bold">
              Batas Baku Master Blok ${record.blok}: ${record.luas_ha.toFixed(1)} Ha
            </text>

            <!-- Draf Poligon Realisasi Riil Kebun (Hasil Unggahan SHP) -->
            <polygon
              points="155,55 640,55 640,295 155,295"
              fill="${isCommitted ? "rgba(16, 185, 129, 0.28)" : "rgba(245, 158, 11, 0.25)"}"
              stroke="${isCommitted ? "#10b981" : "#f59e0b"}"
              stroke-width="3"
              stroke-dasharray="${isCommitted ? "none" : "6,5"}"
            />

            <!-- Titik Nodes P1 - P4 -->
            <circle cx="155" cy="55" r="4.5" fill="#ffffff" stroke="#0f172a" stroke-width="1.5" />
            <text x="165" y="55" fill="#f8fafc" font-size="9" font-family="monospace">P1 [Gawangan 1]</text>

            <circle cx="640" cy="55" r="4.5" fill="#ffffff" stroke="#0f172a" stroke-width="1.5" />
            <text x="560" y="55" fill="#f8fafc" font-size="9" font-family="monospace">P2</text>

            <circle cx="640" cy="295" r="4.5" fill="#ffffff" stroke="#0f172a" stroke-width="1.5" />
            <text x="560" y="290" fill="#f8fafc" font-size="9" font-family="monospace">P3</text>

            <circle cx="155" cy="295" r="4.5" fill="#ffffff" stroke="#0f172a" stroke-width="1.5" />
            <text x="165" y="290" fill="#f8fafc" font-size="9" font-family="monospace">P4</text>

            <!-- Label Tengah Cakupan Pengerjaan -->
            <rect x="290" y="150" width="240" height="45" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke="#475569" />
            <text x="410" y="168" fill="${isCommitted ? "#34d399" : "#fbbf24"}" font-size="11" font-weight="bold" text-anchor="middle">
              REALISASI: ${pokokVal.toLocaleString("id-ID")} POKOK
            </text>
            <text x="410" y="184" fill="#cbd5e1" font-size="9" text-anchor="middle">
              Estimasi SPH: ${estimasiLuas.toFixed(2)} Ha (Deviasi: ${(estimasiLuas - record.luas_ha).toFixed(2)} Ha)
            </text>
          </svg>

          <!-- Legenda Peta -->
          <div class="map-legend">
            <div style="font-weight: 800; text-transform: uppercase; margin-bottom: 2px;">LEGENDA SPASIAL</div>
            <div class="legend-row">
              <span style="display:inline-block; width:14px; height:0; border-top:2px dashed #94a3b8;"></span>
              <span>Batas Baku Master HO (${record.luas_ha.toFixed(1)} Ha)</span>
            </div>
            <div class="legend-row">
              <span style="display:inline-block; width:14px; height:8px; background:${isCommitted ? "#10b981" : "#f59e0b"}; opacity:0.6; border:1px solid #fff;"></span>
              <span>Draf Riil Unggahan SHP Kebun (${pokokVal} Pokok)</span>
            </div>
          </div>
        </div>

        <!-- 4. GARIS SEPARASI TENGAH LEMBAR A4 -->
        <div class="divider">
          <span class="divider-label">RUANG KHUSUS CATATAN &amp; VERIFIKASI FISIK KEBUN (SPACE SETENGAH KOSONG)</span>
        </div>

        <!-- 5. 50% BAGIAN BAWAH: SPACE KHUSUS KEBUN -->
        <div class="estate-workspace">
          <!-- Bagian A: Catatan Tambahan Tulisan Tangan Asisten / Mandor -->
          <div class="section-box">
            <div class="section-title">
              <span>I. Catatan Lapangan &amp; Kendala Fisik Kebun (Tulisan Tangan Mandor / Asisten Afdeling)</span>
              <span style="font-weight: normal; color: #64748b;">Gawangan / Ancak Khusus</span>
            </div>
            <div class="lined-area"></div>
          </div>

          <!-- Bagian B: Kotak Sketsa Kendala Lapangan -->
          <div class="section-box">
            <div class="section-title">
              <span>II. Sketsa Lapangan &amp; Titik Kritis (Parit Tergenang / Pohon Tumbang / Sisipan)</span>
            </div>
            <div class="sketch-area">
              [ Ruang Kosong Khusus Gambar Sketsa / Catatan Titik Koordinat Tambahan ]
            </div>
          </div>

          <!-- Bagian C: Matriks Tanda Tangan 4 Pihak & Cap Stempel -->
          <div class="sign-grid">
            <div class="sign-card">
              <div class="sign-role">Dikerjakan Oleh</div>
              <div class="sign-space"></div>
              <div class="sign-name">${record.kontraktor || "Mandor Lapangan"}</div>
            </div>
            <div class="sign-card">
              <div class="sign-role">Diperiksa Oleh</div>
              <div class="sign-space"></div>
              <div class="sign-name">Asisten Afdeling</div>
            </div>
            <div class="sign-card">
              <div class="sign-role">Diverifikasi Spasial</div>
              <div class="sign-space"></div>
              <div class="sign-name">${record.verified_by_name || "Tim Asisten GIS"}</div>
            </div>
            <div class="sign-card">
              <div class="sign-role">Disetujui Oleh</div>
              <div class="sign-space"></div>
              <div class="sign-name">Estate Manager / Askep</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  triggerPrintWindow(html);
}
