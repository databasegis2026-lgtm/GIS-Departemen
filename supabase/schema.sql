-- ============================================================================
-- MASTER DATABASE SCHEMA POSTGIS & RBAC UNTUK WEBGIS PT BUM & BSL
-- Target Platform: Supabase (PostgreSQL 15+ / PostGIS 3.3+)
-- Project URL: https://fgczcppoaeojaqliudol.supabase.co
-- Dihasilkan pada: 24 November 2026
-- ============================================================================

-- 1. AKTIFKAN EKSTENSI SPASIAL & KEAMANAN
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. TABEL-TABEL MASTER DATA GEOSPASIAL (18 LAYER SHP RESMI)
--    Nama kolom persis sesuai kamus atribut dibatasi |
-- ============================================================================

-- 2.1 Batas Perusahaan
-- Kolom: Region | REGIONAL | Koordinator | Luas | KH | Perusahaan | Id
CREATE TABLE IF NOT EXISTS public.batas_perusahaan (
    id VARCHAR(50) PRIMARY KEY,
    region VARCHAR(100),
    regional VARCHAR(100),
    koordinator VARCHAR(150),
    luas NUMERIC(12, 2),
    kh VARCHAR(100),
    perusahaan VARCHAR(150) NOT NULL,
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_batas_perusahaan_geom ON public.batas_perusahaan USING GIST(geom);

-- 2.2 Batas Region
-- Kolom: Region | REGIONAL | KOOR_KASIE
CREATE TABLE IF NOT EXISTS public.batas_region (
    region VARCHAR(50) PRIMARY KEY,
    regional VARCHAR(100) NOT NULL,
    koor_kasie VARCHAR(150),
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_batas_region_geom ON public.batas_region USING GIST(geom);

-- 2.3 Batas Estate
-- Kolom: Region | Estate | Luas | Kasie
CREATE TABLE IF NOT EXISTS public.batas_estate (
    estate VARCHAR(50) PRIMARY KEY,
    region VARCHAR(50) NOT NULL REFERENCES public.batas_region(region) ON DELETE CASCADE,
    luas NUMERIC(10, 2),
    kasie VARCHAR(150),
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_batas_estate_geom ON public.batas_estate USING GIST(geom);

-- 2.4 Batas AFD (Afdeling)
-- Kolom: Region | Estate | JSPV_1 | JSPV_2 | SPV | KASIE | AFD
CREATE TABLE IF NOT EXISTS public.batas_afdeling (
    afd VARCHAR(50) PRIMARY KEY,
    estate VARCHAR(50) NOT NULL REFERENCES public.batas_estate(estate) ON DELETE CASCADE,
    region VARCHAR(50) NOT NULL,
    jspv_1 VARCHAR(150),
    jspv_2 VARCHAR(150),
    spv VARCHAR(150),
    kasie VARCHAR(150),
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_batas_afdeling_geom ON public.batas_afdeling USING GIST(geom);

-- 2.5 Batas BLOK
-- Kolom: Region | Estate | Afdeling | Blok | TahunTanam | Luas | TM_Pokok | JSPV_1 | JSPV_2 | SPV | KASIE | KOOR_KASIE | AFD
CREATE TABLE IF NOT EXISTS public.batas_blok (
    blok_id VARCHAR(50) PRIMARY KEY, -- gabungan Estate-AFD-Blok
    region VARCHAR(50) NOT NULL,
    estate VARCHAR(50) NOT NULL REFERENCES public.batas_estate(estate) ON DELETE CASCADE,
    afdeling VARCHAR(50) NOT NULL,
    blok VARCHAR(20) NOT NULL,
    tahuntanam INTEGER,
    luas NUMERIC(8, 2),
    tm_pokok INTEGER,
    jspv_1 VARCHAR(150),
    jspv_2 VARCHAR(150),
    spv VARCHAR(150),
    kasie VARCHAR(150),
    koor_kasie VARCHAR(150),
    afd VARCHAR(50) NOT NULL REFERENCES public.batas_afdeling(afd) ON DELETE CASCADE,
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_batas_blok_geom ON public.batas_blok USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_batas_blok_estate ON public.batas_blok(estate);
CREATE INDEX IF NOT EXISTS idx_batas_blok_region ON public.batas_blok(region);

-- 2.6 Batas Warung
-- Kolom: BLOK | AFD | ESTATE | REGION | luas | WARUNG | HARI | Drive_Wafd
CREATE TABLE IF NOT EXISTS public.batas_warung (
    id SERIAL PRIMARY KEY,
    blok VARCHAR(20) NOT NULL,
    afd VARCHAR(50) NOT NULL,
    estate VARCHAR(50) NOT NULL,
    region VARCHAR(50) NOT NULL,
    luas NUMERIC(8, 2),
    warung VARCHAR(50) NOT NULL, -- Merah, Kuning, Hijau, Biru, Ungu, Abu-abu
    hari VARCHAR(20) NOT NULL,   -- Senin s.d. Sabtu
    drive_wafd VARCHAR(100),
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_batas_warung_geom ON public.batas_warung USING GIST(geom);

-- 2.7 Batas Ancak
-- Kolom: BLOK | AFD | ESTATE | REGION | luas | WARUNG | HARI | Drive_Wafd | BLOK_1 | AFD_1 | ESTATE_1 | REGION_1 | WARUNG_1 | HARI_1 | No_Ancak | Koord_X
CREATE TABLE IF NOT EXISTS public.batas_ancak (
    id SERIAL PRIMARY KEY,
    blok VARCHAR(20) NOT NULL,
    afd VARCHAR(50) NOT NULL,
    estate VARCHAR(50) NOT NULL,
    region VARCHAR(50) NOT NULL,
    luas NUMERIC(8, 2),
    warung VARCHAR(50),
    hari VARCHAR(20),
    drive_wafd VARCHAR(100),
    blok_1 VARCHAR(20),
    afd_1 VARCHAR(50),
    estate_1 VARCHAR(50),
    region_1 VARCHAR(50),
    warung_1 VARCHAR(50),
    hari_1 VARCHAR(20),
    no_ancak VARCHAR(50) NOT NULL,
    koord_x VARCHAR(50),
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_batas_ancak_geom ON public.batas_ancak USING GIST(geom);

-- 2.8 SHP Sungai
-- Kolom: BLOK | AFD | ESTATE | REGION | KETERANGAN
CREATE TABLE IF NOT EXISTS public.shp_sungai (
    id SERIAL PRIMARY KEY,
    blok VARCHAR(20),
    afd VARCHAR(50),
    estate VARCHAR(50),
    region VARCHAR(50),
    keterangan VARCHAR(255),
    geom GEOMETRY(MultiLineString, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shp_sungai_geom ON public.shp_sungai USING GIST(geom);

-- 2.9 Nama Sungai (KML / Anotasi)
-- Kolom: NAME | LAYER | KML_STYLE | KML_FOLDER | TimeStamp
CREATE TABLE IF NOT EXISTS public.nama_sungai (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    layer VARCHAR(100),
    kml_style VARCHAR(100),
    kml_folder VARCHAR(150),
    timestamp VARCHAR(50),
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_nama_sungai_geom ON public.nama_sungai USING GIST(geom);

-- 2.10 Area Berpasir
-- Kolom: OBJECTID_1 | OBJECTID | REGION | AFD | ESTATE | Blok | WARUNG | CC | Luas | Shape_Leng | INSIDE_ | INSIDE_Y | INSIDE_Z | INSIDE_M | EXT_MIN_X | EXT_MIN_Y | EXT_MAX_X | EXT_MAX_Y | Koor_X | Koor_Y | Shape_Le_1 | Shape_Area
CREATE TABLE IF NOT EXISTS public.area_berpasir (
    objectid_1 SERIAL PRIMARY KEY,
    objectid INTEGER,
    region VARCHAR(50),
    afd VARCHAR(50),
    estate VARCHAR(50),
    blok VARCHAR(20),
    warung VARCHAR(50),
    cc VARCHAR(50),
    luas NUMERIC(10, 2),
    shape_leng NUMERIC(15, 6),
    inside_ NUMERIC(15, 6),
    inside_y NUMERIC(15, 6),
    inside_z NUMERIC(15, 6),
    inside_m NUMERIC(15, 6),
    ext_min_x NUMERIC(15, 6),
    ext_min_y NUMERIC(15, 6),
    ext_max_x NUMERIC(15, 6),
    ext_max_y NUMERIC(15, 6),
    koor_x NUMERIC(15, 6),
    koor_y NUMERIC(15, 6),
    shape_le_1 NUMERIC(15, 6),
    shape_area NUMERIC(15, 6),
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_area_berpasir_geom ON public.area_berpasir USING GIST(geom);

-- 2.11 Emparea
-- Kolom: OBJECTID | BLOK | AFD | ESTATE | REGION | TH_TANAM | POKOK | SPH | KETERANGAN | STATUS | HGU | LUA | SPH_AKTUAL | LU | INFO
CREATE TABLE IF NOT EXISTS public.emparea (
    objectid SERIAL PRIMARY KEY,
    blok VARCHAR(20),
    afd VARCHAR(50),
    estate VARCHAR(50),
    region VARCHAR(50),
    th_tanam INTEGER,
    pokok INTEGER,
    sph INTEGER,
    keterangan VARCHAR(255),
    status VARCHAR(100),
    hgu VARCHAR(100),
    lua NUMERIC(10, 2),
    sph_aktual NUMERIC(8, 2),
    lu NUMERIC(10, 2),
    info TEXT,
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_emparea_geom ON public.emparea USING GIST(geom);

-- 2.12 Emplasment
-- Kolom: X_UTM | Y_UTM | X_GEO | Y_GEO | DEPARTMENT | DIVISIONCO | GROUPLOCAT | BLOCKID | LOCATIONCO | LOCATIONNA | KETERANGAN | ESTATE | STT | EST | Luas
CREATE TABLE IF NOT EXISTS public.emplasment (
    id SERIAL PRIMARY KEY,
    x_utm NUMERIC(12, 3),
    y_utm NUMERIC(12, 3),
    x_geo NUMERIC(12, 6),
    y_geo NUMERIC(12, 6),
    department VARCHAR(100),
    divisionco VARCHAR(100),
    grouplocat VARCHAR(100),
    blockid VARCHAR(50),
    locationco VARCHAR(50),
    locationna VARCHAR(150),
    keterangan VARCHAR(255),
    estate VARCHAR(50),
    stt VARCHAR(50),
    est VARCHAR(50),
    luas NUMERIC(10, 2),
    geom GEOMETRY(Geometry, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_emplasment_geom ON public.emplasment USING GIST(geom);

-- 2.13 Implaments 1
-- Kolom: Region | Estate | Afdeling | Blok | LOCATIONNA | Ket2
CREATE TABLE IF NOT EXISTS public.implaments_1 (
    id SERIAL PRIMARY KEY,
    region VARCHAR(50),
    estate VARCHAR(50),
    afdeling VARCHAR(50),
    blok VARCHAR(20),
    locationna VARCHAR(150),
    ket2 VARCHAR(255),
    geom GEOMETRY(Geometry, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_implaments_1_geom ON public.implaments_1 USING GIST(geom);

-- 2.14 Infra Poly
-- Kolom: OBJECTID | BLOK | AFD | ESTATE | REGION | TH_TANAM | POKOK | SPH | KETERANGAN | STATUS | HGU | LUA | SPH_AKTUAL | LU | INFO
CREATE TABLE IF NOT EXISTS public.infra_poly (
    objectid SERIAL PRIMARY KEY,
    blok VARCHAR(20),
    afd VARCHAR(50),
    estate VARCHAR(50),
    region VARCHAR(50),
    th_tanam INTEGER,
    pokok INTEGER,
    sph INTEGER,
    keterangan VARCHAR(255),
    status VARCHAR(100),
    hgu VARCHAR(100),
    lua NUMERIC(10, 2),
    sph_aktual NUMERIC(8, 2),
    lu NUMERIC(10, 2),
    info TEXT,
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_infra_poly_geom ON public.infra_poly USING GIST(geom);

-- 2.15 Jalan Poros
-- Kolom: Id | Keterangan | Panjang | Estate | Keterang_1 | AFD | BEARING | LENGTH
CREATE TABLE IF NOT EXISTS public.jalan_poros (
    id VARCHAR(50) PRIMARY KEY,
    keterangan VARCHAR(255),
    panjang NUMERIC(10, 2),
    estate VARCHAR(50),
    keterang_1 VARCHAR(255),
    afd VARCHAR(50),
    bearing NUMERIC(8, 2),
    length NUMERIC(10, 2),
    geom GEOMETRY(MultiLineString, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_jalan_poros_geom ON public.jalan_poros USING GIST(geom);

-- 2.16 Kontur
-- Kolom: OBJECTID | Contour | Shape_Leng
CREATE TABLE IF NOT EXISTS public.kontur (
    objectid SERIAL PRIMARY KEY,
    contour NUMERIC(8, 2) NOT NULL,
    shape_leng NUMERIC(15, 6),
    geom GEOMETRY(MultiLineString, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kontur_geom ON public.kontur USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_kontur_elevation ON public.kontur(contour);

-- 2.17 Hirarki Update PT BUM
-- Kolom: BLOK | AFD | ESTATE | REGION | TH_TANAM | HGU | HRK_JENIS | HRK_KLOMPK | HRK_DETAL | No_HGU | ST_HGU | TALIASIH | Poten_HCV | KOP_PLASMA | KET_TA | Luas
CREATE TABLE IF NOT EXISTS public.hirarki_update_pt_bum (
    id SERIAL PRIMARY KEY,
    blok VARCHAR(20) NOT NULL,
    afd VARCHAR(50) NOT NULL,
    estate VARCHAR(50) NOT NULL,
    region VARCHAR(50) NOT NULL,
    th_tanam INTEGER,
    hgu VARCHAR(100),
    hrk_jenis VARCHAR(100),    -- Plantable / Unplantable
    hrk_klompk VARCHAR(100),   -- Planted, Unplanted, Konservasi, Infra, Topo, Sosial
    hrk_detal VARCHAR(150),    -- TM, TBM, LC, Sempadan Sungai, HCV, Jalan MR, Barak
    no_hgu VARCHAR(100),
    st_hgu VARCHAR(100),
    taliasih VARCHAR(100),
    poten_hcv VARCHAR(100),
    kop_plasma VARCHAR(100),
    ket_ta TEXT,
    luas NUMERIC(10, 2) NOT NULL,
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hirarki_update_geom ON public.hirarki_update_pt_bum USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_hirarki_update_blok ON public.hirarki_update_pt_bum(blok);

-- ============================================================================
-- 3. SISTEM PENGGUNA, RBAC (6 TINGKATAN) & AUDIT TRAIL
-- ============================================================================

-- 3.1 Tabel Peran Pengguna (User Roles)
CREATE TABLE IF NOT EXISTS public.user_roles (
    role_id INTEGER PRIMARY KEY,
    role_key VARCHAR(50) UNIQUE NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    deskripsi TEXT
);

INSERT INTO public.user_roles (role_id, role_key, role_name, deskripsi) VALUES
(1, 'superadmin', 'Superadmin GIS', 'Akses global penuh seluruh sistem, audit log, manajemen akun, dan konfigurasi master data'),
(2, 'admin_gis', 'Admin GIS Studio', 'Akses studio pemetaan, editing spasial, approval permohonan tiket peta, dan kartografi cetak'),
(3, 'user_estate', 'User Estate', 'Akses terbatas untuk 1 unit estate yang dikelola (BUM 1 - BUM 8, BSL)'),
(4, 'admin_kebun', 'User Admin Kebun', 'Akses pengawasan seluruh estate dalam 1 region (R1, R2, atau R3)'),
(5, 'regional_ho', 'User Regional HO', 'Akses monitoring eksekutif agregat regional Head Office'),
(6, 'user_global', 'User Global (Read-Only)', 'Akses pantau agregat seluruh grup perusahaan tanpa wewenang edit data')
ON CONFLICT (role_id) DO NOTHING;

-- 3.2 Tabel Akun Pengguna (User Accounts)
CREATE TABLE IF NOT EXISTS public.user_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    staff_code VARCHAR(10),
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL REFERENCES public.user_roles(role_id),
    estate_scope VARCHAR(50),
    region_scope VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Seed Default Accounts sesuai Bab 4 Rencana
INSERT INTO public.user_accounts (username, email, full_name, staff_code, password_hash, role_id, estate_scope, region_scope) VALUES
-- 1. Superadmin
('superadmin', 'ari.setyo@ptbum.co.id', 'Ari Setyo Wibowo', 'A', crypt('admin12345', gen_salt('bf')), 1, NULL, NULL),
-- 2. Admin GIS
('admin_bagja', 'bagja.arya@ptbum.co.id', 'Bagja Arya Wiguna', 'E', crypt('admin12345', gen_salt('bf')), 2, NULL, NULL),
('admin_iqbal', 'iqbal.junaidy@ptbum.co.id', 'Iqbal Tri Junaidy', 'B', crypt('admin12345', gen_salt('bf')), 2, NULL, NULL),
('admin_widodo', 'widodo.arif@ptbum.co.id', 'Widodo Arif Rohman', 'C', crypt('admin12345', gen_salt('bf')), 2, NULL, NULL),
('admin_agung', 'agung.gis@ptbum.co.id', 'Agung', 'D', crypt('admin12345', gen_salt('bf')), 2, NULL, NULL),
('admin_reki', 'reki.hamdani@ptbum.co.id', 'Reki Hamdani', 'F', crypt('admin12345', gen_salt('bf')), 2, NULL, NULL),
('admin_agus', 'agus.permana@ptbum.co.id', 'Agus Adi Permana', 'G', crypt('admin12345', gen_salt('bf')), 2, NULL, NULL),
-- 3. User Estate (9 Akun)
('estate_bum1', 'bum1@ptbum.co.id', 'Estate Manager BUM 1', NULL, crypt('user12345', gen_salt('bf')), 3, 'BUM 1', 'R1'),
('estate_bum2', 'bum2@ptbum.co.id', 'Estate Manager BUM 2', NULL, crypt('user12345', gen_salt('bf')), 3, 'BUM 2', 'R1'),
('estate_bum3', 'bum3@ptbum.co.id', 'Estate Manager BUM 3', NULL, crypt('user12345', gen_salt('bf')), 3, 'BUM 3', 'R3'),
('estate_bum4', 'bum4@ptbum.co.id', 'Estate Manager BUM 4', NULL, crypt('user12345', gen_salt('bf')), 3, 'BUM 4', 'R1'),
('estate_bum5', 'bum5@ptbum.co.id', 'Estate Manager BUM 5', NULL, crypt('user12345', gen_salt('bf')), 3, 'BUM 5', 'R2'),
('estate_bum6', 'bum6@ptbum.co.id', 'Estate Manager BUM 6', NULL, crypt('user12345', gen_salt('bf')), 3, 'BUM 6', 'R2'),
('estate_bum7', 'bum7@ptbum.co.id', 'Estate Manager BUM 7', NULL, crypt('user12345', gen_salt('bf')), 3, 'BUM 7', 'R2'),
('estate_bum8', 'bum8@ptbum.co.id', 'Estate Manager BUM 8', NULL, crypt('user12345', gen_salt('bf')), 3, 'BUM 8', 'R3'),
('estate_bsl', 'bsl@ptbsl.co.id', 'Estate Manager BSL', NULL, crypt('user12345', gen_salt('bf')), 3, 'BSL', 'R3'),
-- 4. User Admin Kebun (3 Akun Region)
('adminkebun_r1', 'adminkebun.r1@ptbum.co.id', 'Admin Kebun Region 1', NULL, crypt('user12345', gen_salt('bf')), 4, NULL, 'R1'),
('adminkebun_r2', 'adminkebun.r2@ptbum.co.id', 'Admin Kebun Region 2', NULL, crypt('user12345', gen_salt('bf')), 4, NULL, 'R2'),
('adminkebun_r3', 'adminkebun.r3@ptbum.co.id', 'Admin Kebun Region 3', NULL, crypt('user12345', gen_salt('bf')), 4, NULL, 'R3'),
-- 5. User Regional HO
('koor_reg1', 'koor.r1@ptbum.co.id', 'Koordinator Regional 1 HO', NULL, crypt('user12345', gen_salt('bf')), 5, NULL, 'R1'),
('koor_reg2', 'koor.r2@ptbum.co.id', 'Koordinator Regional 2 HO', NULL, crypt('user12345', gen_salt('bf')), 5, NULL, 'R2'),
('koor_reg3_bsl', 'koor.r3@ptbum.co.id', 'Koordinator Regional 3 & BSL HO', NULL, crypt('user12345', gen_salt('bf')), 5, NULL, 'R3'),
-- 6. User Global
('user_global', 'global.read@ptbum.co.id', 'Executive Viewer Global', NULL, crypt('user12345', gen_salt('bf')), 6, NULL, NULL)
ON CONFLICT (username) DO NOTHING;

-- 3.3 Tabel Log Audit Spasial (Audit Trail)
CREATE TABLE IF NOT EXISTS public.spatial_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_accounts(id),
    username VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE, CUT_POLYGON, UPLOAD_SHP
    entity_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100),
    ip_address VARCHAR(50),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_spatial_audit_created ON public.spatial_audit_logs(created_at DESC);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
--    Keamanan akses data spasial sesuai scope peran (Estate / Region / Global)
-- ============================================================================

ALTER TABLE public.batas_blok ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batas_afdeling ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batas_estate ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spatial_audit_logs ENABLE ROW LEVEL SECURITY;

-- 4.1 Policy untuk Batas Blok
CREATE POLICY "blok_rbac_select_policy" ON public.batas_blok
FOR SELECT
USING (
    auth.jwt() ->> 'role_key' IN ('superadmin', 'admin_gis', 'user_global')
    OR (auth.jwt() ->> 'role_key' = 'user_estate' AND estate = (auth.jwt() ->> 'estate_scope'))
    OR (auth.jwt() ->> 'role_key' IN ('admin_kebun', 'regional_ho') AND region = (auth.jwt() ->> 'region_scope'))
    OR auth.role() = 'anon' -- Izinkan preview dashboard publik
);

CREATE POLICY "blok_rbac_write_policy" ON public.batas_blok
FOR ALL
USING (
    auth.jwt() ->> 'role_key' IN ('superadmin', 'admin_gis')
);

-- 4.2 Policy untuk Audit Logs
CREATE POLICY "audit_superadmin_read_policy" ON public.spatial_audit_logs
FOR SELECT
USING (
    auth.jwt() ->> 'role_key' = 'superadmin'
);

-- ============================================================================
-- SELESAI: Skema PostGIS Supabase siap di-deploy & di-sinkronkan
-- ============================================================================
