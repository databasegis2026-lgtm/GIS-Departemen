# RENCANA PERBAIKAN HALAMAN REQUEST UPDATE PETA (TICKETING UPDATE PETA)

> **Nomor Dokumen:** GIS-FIX-REQ-2026-001  
> **Target Modul:** `frontend/web/src/pages/ticketing-update-peta/`  
> **Status:** Usulan Perbaikan Komprehensif  
> **Tanggal:** 24 November 2026  
> **Departemen:** GIS PT BUM & PT BSL  

---

## 1. LATAR BELAKANG & IDENTIFIKASI TEMUAN

Setelah memeriksa kode sumber halaman **Request Update Peta** (`frontend/web/src/pages/ticketing-update-peta/`), ditemukan sejumlah ketidaksesuaian kritis antara implementasi saat ini dengan Master Data, Pedoman GIS, dan Struktur Organisasi terbaru:

| No | Komponen / Berkas | Kondisi Saat Ini (Masalah) | Standar Baru yang Seharusnya |
|---|---|---|---|
| 1 | `mock-requests.ts` (Admin GIS) | Masih mencantumkan `M. SOFIAN` (Kode D). | Diganti menjadi **AGUNG** (Kode D). Sesuai revisi pemegang kode staf. |
| 2 | `mock-requests.ts` (Pemetaan Region & Estate) | `REGION 1: BUM 1, BUM 2, BUM 3, BUM 4`<br>`REGION 2: BUM 5, BUM 6, BUM 7, BUM 8`<br>`REGION 3: BSL` | **Revisi Struktur Resmi:**<br>• **Region 1:** BUM 1, BUM 2, BUM 4<br>• **Region 2:** BUM 5, BUM 6, BUM 7<br>• **Region 3:** BUM 3, BUM 8, BSL (Total 10 Estate, 45 AFD) |
| 3 | `types.ts` & `ticket-create-form.tsx` (Hierarki Spasial) | Belum ada pemilihan **Warung** (Warung ada 6 warna: Merah, Kuning, Hijau, Biru, Ungu, Abu-abu) yang posisinya **di atas Blok**. | Hierarki permohonan harus mencerminkan: `Region -> Estate -> Afdeling -> Warung (6 Warna) -> Blok -> Cakupan/Ancak`. |
| 4 | `index.tsx` (Model Peran / Role Mode) | Masih menggunakan *manual switcher button* sederhana (`Pemohon` vs `Admin GIS`) tanpa terhubung ke sistem RBAC pengguna. | Terintegrasi dengan sistem **RBAC 6-Level**: Otomatis mengunci scope dan hak aksi berdasarkan pengguna yang sedang login (User Estate, Admin Kebun, Regional HO, Admin GIS, Superadmin, User Global). |
| 5 | `ticket-create-form.tsx` (Penugasan Admin GIS) | Penugasan otomatis hanya tertulis untuk Ari Setyo Wibowo & Iqbal. | Disesuaikan dengan daftar 5 Admin GIS aktif (Agus G, Bagja E, Reki F, Iqbal B, Widodo C) serta manajerial Ari Setyo Wibowo (A) dan Agung (D). |
| 6 | Integrasi Backend & Storage | Masih mengandalkan *mock array in-memory* statis (`INITIAL_MAP_TICKETS`). Unggah lampiran & hasil PDF belum terhubung ke Supabase Storage. | Dihubungkan ke database Supabase (`https://fgczcppoaeojaqliudol.supabase.co`) tabel `map_update_tickets` dan bucket storage `map-attachments`. |

---

## 2. DETAIL RENCANA PERBAIKAN

### 2.1 Perbaikan Data Master & Katalog (`mock-requests.ts` & `types.ts`)
1. **Pembaruan Staf Admin GIS**:
   - `A`: ARI SETYO WIBOWO (Manager GIS)
   - `B`: IQBAL TRI JUNAIDY
   - `C`: WIDODO ARIF ROHMAN
   - `D`: **AGUNG** (Menggantikan M. Sofian)
   - `E`: BAGJA ARYA WIGUNA
   - `F`: REKI HAMDANI
   - `G`: AGUS ADI PERMANA
2. **Pembaruan Pemetaan Wilayah & Afdeling**:
   ```typescript
   export const ESTATES_BY_REGION: Record<string, string[]> = {
     "REGION 1": ["BUM 1", "BUM 2", "BUM 4"],
     "REGION 2": ["BUM 5", "BUM 6", "BUM 7"],
     "REGION 3": ["BUM 3", "BUM 8", "BSL"],
   };
   ```
   - Total Afdeling BUM: 35 Afdeling (AFD 1 - AFD 35).
   - Total Afdeling BSL: 10 Afdeling (AFD 1 - AFD 10).
3. **Penambahan Master Warung (6 Warna Panen)**:
   ```typescript
   export const WARUNG_ZONES = [
     { code: "WR-MRH", name: "Merah", hex: "#EF4444" },
     { code: "WR-KNG", name: "Kuning", hex: "#EAB308" },
     { code: "WR-HJU", name: "Hijau", hex: "#22C55E" },
     { code: "WR-BRU", name: "Biru", hex: "#3B82F6" },
     { code: "WR-UNG", name: "Ungu", hex: "#A855F7" },
     { code: "WR-ABU", name: "Abu-abu", hex: "#6B7280" },
   ] as const;
   ```
4. **Pembaruan Format Nomor Peta & Nomor Tiket**:
   - Penomoran tiket standar: `TKT-[YYYY]-[MM]-[NOMOR]`
   - Penomoran peta otomatis: `MAP-[ESTATE]-[WARUNG]-[BLOK]-[KODE_KERJA]` (Contoh: `MAP-BUM1-MRH-A05-PRN`).

---

### 2.2 Perbaikan Formulir Pengajuan Tiket (`ticket-create-form.tsx`)
1. **Dropdown Hierarkis Pintar**:
   - Pemilihan **Region** otomatis menyaring pilihan **Estate**.
   - Pemilihan **Estate** otomatis menyaring pilihan **Afdeling** (BUM 1-35 sesuai region atau BSL 1-10).
   - Penambahan pilihan **Zona Warung** (6 warna) sebelum menentukan Nomor Blok.
   - Input nomor blok dilengkapi opsi deteksi blok dari daftar spasial atau manual.
2. **Kunci Scope Otomatis untuk User Estate**:
   - Jika pengguna login sebagai `estate_bum1`, dropdown Region dan Estate terkunci otomatis pada Region 1 dan BUM 1 (tidak bisa mengajukan request untuk estate lain).
3. **Penyempurnaan Upload Lampiran Dokumen**:
   - Menyediakan area *drag & drop* file lampiran acuan (.pdf, .kml, .kmz, .jpg, .png) dengan validasi ukuran file maksimal 10 MB.

---

### 2.3 Perbaikan Tabel Monitoring Tiket (`ticket-admin-table.tsx` & `ticket-user-table.tsx`)
1. **Indikator Warung & Lokasi Lengkap**:
   - Kolom lokasi menampilkan badge warna Warung di samping nama Blok, Estate, dan Afdeling.
2. **Filter & Pencarian Lanjutan**:
   - Filter cepat berdasarkan: Status Tiket, Region, Estate, Jenis Pekerjaan (16 jenis pekerjaan sesuai singkatan baku), dan Admin GIS penanggung jawab.
3. **Modal Catatan Progres & Upload Hasil PDF**:
   - Admin GIS dapat memperbarui status (`Diproses`, `Selesai`, `Revisi Diperlukan`), menuliskan catatan kendala/revisi, dan melampirkan file PDF hasil akhir yang siap diunduh oleh pemohon.

---

### 2.4 Integrasi Role-Based Access Control (RBAC 6-Level)
Sistem tampilan dan aksi disesuaikan dengan 6 level pengguna:
- **Superadmin (Ari Setyo Wibowo):** Dapat melihat semua tiket, menugaskan ulang tiket ke Admin GIS manapun, mengubah status, serta mengaudit riwayat perubahan tiket.
- **Admin GIS (Agus G, Bagja E, Reki F, Iqbal B, Widodo C):** Dapat melihat antrean tiket global, menyaring antrean berdasarkan tugas pribadinya, memperbarui progres, dan mengunggah PDF peta.
- **User Estate (BUM 1 - BUM 8, BSL):** Hanya dapat melihat dan mengajukan tiket untuk Estate miliknya.
- **User Admin Kebun & Regional HO:** Dapat memantau seluruh tiket di bawah Region yang dikelolanya.
- **User Global:** Dapat melihat rekap status seluruh tiket se-perusahaan dalam mode baca (*read-only*).

---

### 2.5 Arsitektur Tabel Supabase (`map_update_tickets`)
Untuk migrasi dari *mock data* ke Supabase PostgreSQL:
```sql
CREATE TABLE IF NOT EXISTS public.map_update_tickets (
    ticket_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(30) UNIQUE NOT NULL,
    map_number VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    assigned_admin_code VARCHAR(5) REFERENCES public.gis_staff(code),
    assigned_admin_name VARCHAR(100),
    work_type_code VARCHAR(10) NOT NULL,
    work_type_name VARCHAR(50) NOT NULL,
    map_type VARCHAR(20) NOT NULL,
    region VARCHAR(30) NOT NULL,
    estate VARCHAR(50) NOT NULL,
    afdeling VARCHAR(50) NOT NULL,
    warung_zone VARCHAR(30),
    block_number VARCHAR(20),
    target_date DATE NOT NULL,
    requester_id UUID REFERENCES public.user_accounts(id),
    requester_name VARCHAR(100) NOT NULL,
    requester_role VARCHAR(100),
    description TEXT,
    attachment_url TEXT,
    attachment_name VARCHAR(255),
    result_pdf_url TEXT,
    result_pdf_name VARCHAR(255),
    status VARCHAR(30) DEFAULT 'submitted',
    progress_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. TAHAPAN EKSEKUSI PERBAIKAN (LANGKAH KERJA)

1. **Tahap 1: Sinkronisasi Tipe & Mock Master Data**
   - Perbarui `types.ts` dan `mock-requests.ts`: ganti `M. SOFIAN` menjadi `AGUNG`, benahi pemetaan 3 Region (R1, R2, R3+BSL), tambahkan master 6 Warung.
2. **Tahap 2: Pembaruan Form Pengajuan (`ticket-create-form.tsx`)**
   - Tambahkan input seleksi Warung (Merah, Kuning, Hijau, Biru, Ungu, Abu-abu), sinkronkan daftar Estate dan Afdeling sesuai data baru.
3. **Tahap 3: Pembaruan Tabel Admin & User (`ticket-admin-table.tsx` & `ticket-user-table.tsx`)**
   - Perbaiki kolom tabel dengan menambahkan chip warna Warung, perbaiki badge status, dan perbaiki penanganan unduh lampiran/peta hasil.
4. **Tahap 4: Integrasi Halaman Utama (`index.tsx`) dengan State User & RBAC**
   - Hubungkan context autentikasi pengguna agar otomatis mengenali role login, mengunci filter estate bagi User Estate, dan menyembunyikan kontrol yang tidak berhak.
5. **Tahap 5: Pengujian & Verifikasi Build**
   - Jalankan pengecekan TypeScript / Vite build untuk memastikan tidak ada error sintaksis.
