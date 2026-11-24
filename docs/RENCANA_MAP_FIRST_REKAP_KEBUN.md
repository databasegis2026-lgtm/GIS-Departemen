# Rencana Implementasi: Halaman Rekap Pekerjaan Kebun (Map-First Interface, Unggah SHP Riil Kebun, & Cetak PDF Khusus Kebun)

## 1. Ringkasan Eksekutif & Latar Belakang

Berdasarkan instruksi dan arahan operasional:
1. **Tampilan Admin Kebun Langsung ke Peta (Map-First View):**
   Antarmuka bagi Admin Kebun dan User Estate tidak lagi berupa tabel teks biasa yang kaku, melainkan **langsung membuka Kanvas Peta Interaktif (Map-First Full View)**. Seluruh blok afdeling, batas fisik, dan aktivitas rutin tampil secara visual di peta saat halaman dibuka.
2. **Kebutuhan Unggah SHP Riil Kebun (Base on Pokok vs Base on Luas):**
   * Di tingkat **Kebun (Estate)**: Realisasi fisik dicatat dan dibayarkan **berdasarkan Pokok Sawit** (individual trees / gawangan / jalur ancak mandor).
   * Di tingkat **Head Office (HO) & Tim GIS**: Database spasial geodatabase disimpan **berdasarkan Luas Poligon (Hektar / Ha)**.
   * Admin Kebun memerlukan tombol **"Unggah SHP Lapangan"** untuk memvisualisasikan data riil pekerjaan fisik kebun (berisi sebaran titik pokok atau deliniasi ancak gawangan) sebagai **Draf Spasial Sementara**.
3. **Konversi Langsung ke Cetak PDF (Layout Khusus Kebun):**
   Peta draf hasil unggahan SHP kebun dapat langsung dikonversi ke format **Cetak PDF (A4 Portrait/Landscape)** dengan spesifikasi khusus:
   * **Bagian Atas (~50% Lembaran):** Kop resmi, peta kartografi/citra satelit resolusi tinggi dari SHP yang diunggah, legenda, kompas, dan ringkasan metrik (Pokok, SPH, dan Luas Estimasi).
   * **Bagian Bawah (~50% Setengah Kosong):** Space kosong terstruktur khusus kebutuhan lapangan (catatan tulisan tangan mandor/asisten, sketsa lapangan, kolom inspeksi fisik, dan 4 kolom tanda tangan legalitas pengesahan BAPP kebun).

---

## 2. Saran & Rekomendasi Solusi: Menjembatani "Base on Pokok" vs "Base on Luas (Ha)"

### 2.1 Analisis Masalah
* Kebun menghitung target borongan berdasarkan populasi pokok: misalnya 3.876 pokok pruning rotasi 1.
* Tim GIS memvalidasi berdasarkan poligon tutupan spasial kanopi citra/drone: misalnya 28.50 Ha.
* Jika database hanya menyimpan salah satu satuan, akan terjadi friksi: Kebun bingung dengan nilai Ha tanpa rincian pokok, sedangkan Tim GIS kesulitan melakukan kalkulasi poligon spasial jika hanya menerima angka pokok tanpa koordinat.

### 2.2 Formula & Mekanisme Konversi Otomatis yang Direkomendasikan
Kami merekomendasikan **Pendekatan Dual-Metric Coexistence (Sinkronisasi Dua Arah)**:

1. **Formula Konversi Teoretis Berbasis SPH (Standar Pokok per Hektar):**
   $$\text{Luas Estimasi SPH (Ha)} = \frac{\text{Jumlah Pokok Realisasi}}{\text{SPH Baku Blok}}$$
   * *Contoh Kasus:* Blok A05 memiliki SPH baku 136 pokok/Ha.
   * Mandor mengklaim pengerjaan: $3.876\text{ pokok}$.
   * Maka Luas Estimasi SPH adalah:
     $$\frac{3.876}{136} = 28.50\text{ Ha}$$

2. **Kalkulasi Geometri Spasial dari Unggahan SHP (Luas Riil Poligon):**
   * Saat Admin Kebun mengunggah berkas SHP/GeoJSON (berupa titik koordinat pokok atau batas batas gawangan), WebGIS secara otomatis menghitung *Spatial Bounding / Dissolve Polygon* dan menghasilkan luasan spasial aktual ($\text{Luas Poligon GIS}$).

3. **Indikator Rasio & Batas Toleransi Deviasi ($\pm 5\%$):**
   Sistem secara otomatis menghitung persentase deviasi:
   $$\text{Deviasi (\%)} = \left| \frac{\text{Luas Poligon GIS} - \text{Luas Estimasi SPH}}{\text{Luas Estimasi SPH}} \right| \times 100\%$$
   * **Deviasi $\le 5\%$ (Status: Hijau / Presisi Tinggi):**
     Klaim pokok kebun selaras dengan poligon spasial di lapangan. Tim GIS dapat langsung menekan **"Validasi & Commit ke Database"**.
   * **Deviasi $> 5\%$ (Status: Kuning / Peringatan Anomali):**
     Sistem memberi catatan anomali otomatis:
     *Kemungkinan: Adanya pohon mati/sisipan yang belum terdata di SPH master, atau mandor melompati gawangan tertentu.* Memberi arahan tim kebun untuk verifikasi fisik sebelum masuk ke database master.

4. **Struktur Data Penyimpanan Database (PostgreSQL / Supabase):**
   Tabel `rekap_pekerjaan_rutin` di database menyimpan kedua atribut secara berdampingan:
   ```sql
   ALTER TABLE rekap_pekerjaan_rutin ADD COLUMN jumlah_pokok_realisasi INTEGER;
   ALTER TABLE rekap_pekerjaan_rutin ADD COLUMN sph_aktual NUMERIC(6,2);
   ALTER TABLE rekap_pekerjaan_rutin ADD COLUMN luas_estimasi_sph_ha NUMERIC(8,2);
   ALTER TABLE rekap_pekerjaan_rutin ADD COLUMN luas_verifikasi_gis_ha NUMERIC(8,2);
   ALTER TABLE rekap_pekerjaan_rutin ADD COLUMN deviasi_persen NUMERIC(5,2);
   ALTER TABLE rekap_pekerjaan_rutin ADD COLUMN status_verifikasi VARCHAR(30); -- 'draft_kebun', 'verified_ho'
   ALTER TABLE rekap_pekerjaan_rutin ADD COLUMN shp_raw_geojson JSONB;
   ALTER TABLE rekap_pekerjaan_rutin ADD COLUMN geom_polygon GEOMETRY(Polygon, 4326);
   ```
   **Keuntungan Strategis:** Tim Kebun tetap memiliki riwayat pengerjaan pokok untuk dasar pembayaran mandor/BAPP fisik, sedangkan Tim GIS dan Manajemen HO memiliki data luasan poligon hektar yang akurat untuk pemetaan korporasi.

---

## 3. Desain Antarmuka: Map-First Interface (UI Asli TailAdmin, Bebas AI-Slop)

### 3.1 Mode Tampilan Dinamis Berdasarkan Hak Akses
1. **Untuk Admin Kebun & User Estate (Default: Map-First Fullscreen):**
   * Begitu membuka halaman `/rekap-pekerjaan/pekerjaan-rutin`, halaman **langsung memuat kanvas peta interaktif layar penuh**.
   * Bilah atas memuat filter ringkas (Region, Estate, Afdeling, Jenis Aktivitas: Pruning, Pemupukan, dll.).
   * Tombol utama di peta: **[+ Unggah SHP Riil Kebun]** dan **[Cetak Peta Rekap PDF]**.
   * Panel samping (Collapsible Drawer) dapat ditarik untuk melihat daftar antrean blok yang sedang dikerjakan.
2. **Untuk Superadmin & Admin GIS (Kode A s.d. G):**
   * Memiliki tombol toggle tampilan di pojok kanan atas:
     * `Mode Peta Penuh (Map View)`
     * `Mode Split (Peta di Kiri, Antrean di Kanan)`
     * `Mode Tabel Lengkap (16 Kolom Master Data Operasional)`

### 3.2 Modal & Alur Unggah SHP Riil Kebun
* **Komponen:** `ShpUploadModal.tsx`
* **Format yang Diterima:** `.zip` (Shapefile ESRI: .shp, .shx, .dbf, .prj), `.geojson`, atau `.kml`.
* **Proses Pengolahan:**
  1. Pengguna memilih file atau drag-and-drop.
  2. Memilih Blok Target, Aktivitas (misal: Pruning Rotasi 1), dan menginput **Jumlah Pokok Realisasi Lapangan** (misal: 3.876 pokok).
  3. Sistem langsung membaca koordinat geometri, merender poligon/titik di kanvas peta sebagai **DRAF SPASIAL SEMENTARA (Belum Masuk Database)**, dan menghitung estimasi luasan berbasis SPH.
  4. Pengguna langsung dapat menekan tombol **"Cetak PDF Peta Rekap Kebun"** atau **"Ajukan Verifikasi ke Admin GIS"**.

---

## 4. Desain Layout Cetak PDF: Space Bawah Setengah Kosong Khusus Kebun

Sesuai instruksi: *"pada layout cetak pdf hasil unggahan beri space di bawah setngah kosong untuk keperluan kebun"*.

### 4.1 Spesifikasi Lembar Cetak A4 (Portrait)
Format lembar cetak dibagi tepat menjadi dua bagian vertikal (50% Atas & 50% Bawah):

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KOP RESMI PERUSAHAAN                            │
│           DEPARTEMEN GIS & PENGELOLAAN DATA SPASIAL KEBUN              │
│       BERITA ACARA REKAP PEKERJAAN RUTIN & HASIL UNGGAHAN SHP          │
├────────────────────────────────────────────────────────────────────────┤
│ INFORMASI BLOK:                                                        │
│ • Estate: BUM 1 (AFD 4)          • Aktivitas: PRUNING ROTASI 1         │
│ • Blok: A05 (Warung 01)          • Tanggal Kerja: 24 Februari 2026     │
│ • Realisasi: 3.876 Pokok (SPH 136) • Luas Estimasi: 28.5 Ha           │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│              KANVAS PETA HASIL UNGGAHAN SHP KEBUN                      │
│        (Overlay Batas Baku Resmi vs Draf Pengerjaan Pokok)             │
│        [ Citra Satelit + Garis Putus-Putus Draf Lapangan ]             │
│                                                                        │
│  Legenda: [---] Batas Baku Master    [- -] Draf Pengerjaan Kebun       │
│  Orientasi: [U] Arah Utara           Skala Grafis: 1:5.000             │
├────────────────────────────────────────────────────────────────────────┤
│ === BATAS TENGAH LEMBAR A4 (SEPARASI STRUKTURAL KARTOGRAFI) ========== │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│          RUANG KHUSUS CATATAN & VERIFIKASI FISIK KEBUN                 │
│                 (SPACE SETENGAH KOSONG / BLANK WORKSPACE)              │
│                                                                        │
│ 1. Catatan Mandor / Asisten Lapangan:                                  │
│    ..................................................................  │
│    ..................................................................  │
│    ..................................................................  │
│                                                                        │
│ 2. Sketsa Detail Titik Kritis / Kendala Lapangan:                      │
│    ┌──────────────────────────────────────────────────────────────┐    │
│    │                                                              │    │
│    │         [ Area Kotak Kosong untuk Sketsa Lapangan ]          │    │
│    │                                                              │    │
│    └──────────────────────────────────────────────────────────────┘    │
│                                                                        │
│ 3. Pengesahan & Tanda Tangan Multi-Pihak:                              │
│    ┌──────────────┬──────────────┬──────────────┬──────────────────┐   │
│    │ Dikerjakan:  │ Diperiksa:   │ Diverifikasi:│ Disetujui:       │   │
│    │              │              │              │                  │   │
│    │              │              │              │                  │   │
│    │ (..........) │ (..........) │ (..........) │ (..............) │   │
│    │    Mandor    │   Asisten    │ Asisten GIS  │  Estate Manager  │   │
│    └──────────────┴──────────────┴──────────────┴──────────────────┘   │
│    [Cap Stempel Operasional Estate]                                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Rencana Berkas & Struktur Komponen

| No | Berkas | Aksi | Deskripsi Tanggung Jawab |
|---|---|---|---|
| 1 | `frontend/web/src/pages/rekap-pekerjaan/pekerjaan-rutin/types.ts` | Update | Menambahkan kolom `realisasi_pokok`, `sph_blok`, `luas_estimasi_sph`, `shp_raw_data`, dan `status_database`. |
| 2 | `frontend/web/src/pages/rekap-pekerjaan/pekerjaan-rutin/components/rekap-map-first-view.tsx` | Baru | Antarmuka peta interaktif penuh (Map-First) Leaflet untuk Admin Kebun dengan HUD ringkas, toolbar unggah, dan popover blok. |
| 3 | `frontend/web/src/pages/rekap-pekerjaan/pekerjaan-rutin/components/shp-upload-modal.tsx` | Baru | Dialog modal TailAdmin untuk mengunggah SHP/GeoJSON riil kebun dengan input jumlah pokok & preview instan. |
| 4 | `frontend/web/src/pages/rekap-pekerjaan/pekerjaan-rutin/print-rekap-pdf.ts` | Baru | Mesin cetak PDF khusus: peta di 50% bagian atas dan space setengah kosong di bagian bawah untuk kebun. |
| 5 | `frontend/web/src/pages/rekap-pekerjaan/pekerjaan-rutin/index.tsx` | Refactor | Re-arsitektur tampilan: Admin Kebun langsung masuk ke Map-First View; Admin GIS memiliki opsi beralih antara Peta dan Tabel. |

---

## 6. Tahapan Eksekusi

1. **Tahap 1:** Memperbarui model data `types.ts` dengan atribut pokok, SPH, dan metadata unggahan SHP.
2. **Tahap 2:** Membangun modul cetak PDF `print-rekap-pdf.ts` yang menghasilkan dokumen A4 dengan komposisi 50% peta atas dan 50% space kosong bergaris bawah.
3. **Tahap 3:** Membangun modal unggah SHP `shp-upload-modal.tsx` dengan parsing geometri draf dan konversi pokok $\rightarrow$ estimasi luas.
4. **Tahap 4:** Membangun antarmuka peta penuh `rekap-map-first-view.tsx` dengan integrasi Leaflet, tombol cetak PDF instan, dan indikator status database.
5. **Tahap 5:** Memperbarui `index.tsx` untuk mengatur logika *role routing* (Admin Kebun otomatis membuka Map-First).
6. **Tahap 6:** Pengujian kompilasi `npm run build` dan verifikasi kualitas tampilan bebas AI-slop.
