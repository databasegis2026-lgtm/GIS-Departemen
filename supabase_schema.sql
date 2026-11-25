-- ==============================================================================
-- SKRIP SQL SKEMA DATABASE SUPABASE & POSTGIS DEPARTEMEN GIS
-- SKRIP SQL SKEMA DATABASE RELASIONAL SUPABASE & POSTGIS DEPARTEMEN GIS
-- PT Bangkitgiat Usaha Mandiri (PT BUM) & Bangkitgiat Sawit Lestari (BSL)
-- Project: fgczcppoaeojaqliudol (ap-southeast-2)
-- Jalankan skrip ini di menu Supabase Dashboard -> SQL Editor -> New Query -> Run
-- Berdasarkan: ERD Database & Catatan Khusus Master Data GIS
-- Jalankan skrip ini di Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Tabel Audit Log Aktivitas
-- ------------------------------------------------------------------------------
-- 1. TABEL ROLE & AKUN PENGGUNA (RBAC)
-- ------------------------------------------------------------------------------

create table if not exists public.user_roles (
  role_id int primary key,
  role_key text unique not null,
  role_name text not null,
  deskripsi text
);

insert into public.user_roles (role_id, role_key, role_name, deskripsi) values
  (1, 'superadmin', 'Superadmin GIS', 'Akses penuh seluruh modul, audit aktivitas, dan pendaftaran akun pengguna'),
  (2, 'admin_gis', 'Admin GIS', 'Akses global seluruh data & edit peta spasial tanpa audit aktivitas & tambah akun'),
  (3, 'user_estate', 'User Estate', 'Akses terbatas pada Dashboard & Ticketing unit Estate yang dikelola'),
  (4, 'admin_kebun', 'User Admin Kebun', 'Akses operasional kebun terbatas pada Region yang dikelola'),
  (5, 'regional_ho', 'User Regional HO', 'Monitoring eksekutif wilayah Region yang dikelola'),
  (6, 'user_global', 'User Global', 'Akses lihat (read-only) skala global Holding / Direksi')
on conflict (role_id) do update set
  role_key = excluded.role_key,
  role_name = excluded.role_name,
  deskripsi = excluded.deskripsi;

create table if not exists public.gis_users (
  id text primary key,
  username text unique not null,
  password text not null,
  full_name text not null,
  title text default 'Staf Operasional GIS',
  role_id int references public.user_roles(role_id) on delete set null,
  role_key text not null default 'user_global',
  role_name text not null default 'User Global',
  staff_code text,
  estate_scope text,
  region_scope text,
  created_by text references public.gis_users(id) on delete set null,
  status text default 'active',
  created_at timestamptz default now()
);

alter table public.gis_users add column if not exists role_id int references public.user_roles(role_id) on delete set null;
alter table public.gis_users add column if not exists created_by text references public.gis_users(id) on delete set null;

-- Seed 22+ Akun Resmi Terdaftar (Hanya Superadmin yang dapat menambah akun baru via aplikasi)
insert into public.gis_users (id, username, password, full_name, title, role_id, role_key, role_name, staff_code, estate_scope, region_scope, status) values
  -- 1. Superadmin
  ('usr-sa-01', 'superadmin', 'admin12345', 'Ari Setyo Wibowo', 'Manager GIS', 1, 'superadmin', 'Superadmin GIS', 'A', null, null, 'active'),
  ('usr-sa-02', 'ari.setyo', 'admin12345', 'Ari Setyo Wibowo', 'Manager GIS', 1, 'superadmin', 'Superadmin GIS', 'A', null, null, 'active'),

  -- 2. Admin GIS (5 Akun)
  ('usr-ag-01', 'agus.permana', 'admin12345', 'Agus Adi Permana', 'Admin GIS Studio', 2, 'admin_gis', 'Admin GIS', 'G', null, null, 'active'),
  ('usr-ag-02', 'bagja.wiguna', 'admin12345', 'Bagja Arya Wiguna', 'Admin GIS Studio', 2, 'admin_gis', 'Admin GIS', 'E', null, null, 'active'),
  ('usr-ag-03', 'reki.hamdani', 'admin12345', 'Reki Hamdani', 'Admin GIS Studio', 2, 'admin_gis', 'Admin GIS', 'F', null, null, 'active'),
  ('usr-ag-04', 'iqbal.junaidy', 'admin12345', 'Iqbal Tri Junaidy', 'Admin GIS Studio', 2, 'admin_gis', 'Admin GIS', 'B', null, null, 'active'),
  ('usr-ag-05', 'widodo.rohman', 'admin12345', 'Widodo Arif Rohman', 'Admin GIS Studio', 2, 'admin_gis', 'Admin GIS', 'C', null, null, 'active'),

  -- 3. User Estate (9 Akun: BUM 1 s.d. BUM 8 & BSL)
  ('usr-est-01', 'estate_bum1', 'user12345', 'Estate Manager BUM 1', 'Asisten Kepala BUM 1', 3, 'user_estate', 'User Estate', null, 'BUM 1', 'R1', 'active'),
  ('usr-est-02', 'estate_bum2', 'user12345', 'Estate Manager BUM 2', 'Asisten Kepala BUM 2', 3, 'user_estate', 'User Estate', null, 'BUM 2', 'R1', 'active'),
  ('usr-est-03', 'estate_bum3', 'user12345', 'Estate Manager BUM 3', 'Asisten Kepala BUM 3', 3, 'user_estate', 'User Estate', null, 'BUM 3', 'R1', 'active'),
  ('usr-est-04', 'estate_bum4', 'user12345', 'Estate Manager BUM 4', 'Asisten Kepala BUM 4', 3, 'user_estate', 'User Estate', null, 'BUM 4', 'R2', 'active'),
  ('usr-est-05', 'estate_bum5', 'user12345', 'Estate Manager BUM 5', 'Asisten Kepala BUM 5', 3, 'user_estate', 'User Estate', null, 'BUM 5', 'R2', 'active'),
  ('usr-est-06', 'estate_bum6', 'user12345', 'Estate Manager BUM 6', 'Asisten Kepala BUM 6', 3, 'user_estate', 'User Estate', null, 'BUM 6', 'R2', 'active'),
  ('usr-est-07', 'estate_bum7', 'user12345', 'Estate Manager BUM 7', 'Asisten Kepala BUM 7', 3, 'user_estate', 'User Estate', null, 'BUM 7', 'R3', 'active'),
  ('usr-est-08', 'estate_bum8', 'user12345', 'Estate Manager BUM 8', 'Asisten Kepala BUM 8', 3, 'user_estate', 'User Estate', null, 'BUM 8', 'R3', 'active'),
  ('usr-est-09', 'estate_bsl', 'user12345', 'Estate Manager BSL', 'Asisten Kepala BSL', 3, 'user_estate', 'User Estate', null, 'BSL', 'BSL', 'active'),

  -- 4. User Admin Kebun (3 Akun)
  ('usr-ak-01', 'adminkebun_r1', 'user12345', 'Admin Kebun Region 1', 'Admin Operasional Kebun R1', 4, 'admin_kebun', 'User Admin Kebun', null, null, 'R1', 'active'),
  ('usr-ak-02', 'adminkebun_r2', 'user12345', 'Admin Kebun Region 2', 'Admin Operasional Kebun R2', 4, 'admin_kebun', 'User Admin Kebun', null, null, 'R2', 'active'),
  ('usr-ak-03', 'adminkebun_r3', 'user12345', 'Admin Kebun Region 3 + BSL', 'Admin Operasional Kebun R3 & BSL', 4, 'admin_kebun', 'User Admin Kebun', null, null, 'R3 + BSL', 'active'),

  -- 5. User Regional HO (3 Akun)
  ('usr-ho-01', 'koor_reg1', 'user12345', 'Koor Reg 1', 'Koordinator Wilayah Region 1', 5, 'regional_ho', 'User Regional HO', null, null, 'R1', 'active'),
  ('usr-ho-02', 'koor_reg2', 'user12345', 'Koor Reg 2', 'Koordinator Wilayah Region 2', 5, 'regional_ho', 'User Regional HO', null, null, 'R2', 'active'),
  ('usr-ho-03', 'koor_reg3', 'user12345', 'Koor Reg 3 + BSL', 'Koordinator Wilayah Region 3 & BSL', 5, 'regional_ho', 'User Regional HO', null, null, 'R3 + BSL', 'active'),

  -- 6. User Global (1 Akun)
  ('usr-gl-01', 'user_global', 'user12345', 'Executive Viewer Global', 'Direksi & BOD Viewer', 6, 'user_global', 'User Global', null, null, null, 'active')
on conflict (username) do update set
  password = excluded.password,
  full_name = excluded.full_name,
  title = excluded.title,
  role_id = excluded.role_id,
  role_key = excluded.role_key,
  role_name = excluded.role_name,
  staff_code = excluded.staff_code,
  estate_scope = excluded.estate_scope,
  region_scope = excluded.region_scope,
  status = excluded.status;

-- ------------------------------------------------------------------------------
-- 2. TABEL AUDIT LOG AKTIVITAS (Relasi ke gis_users)
-- ------------------------------------------------------------------------------

create table if not exists public.gis_audit_logs (
  id bigint generated by default as identity primary key,
  user_id text references public.gis_users(id) on delete set null,
  user_name text default 'GIS Specialist',
  action text not null,
  table_name text not null,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  details text,
  created_at timestamptz default now()
);

-- 2. Tabel Batas Perusahaan
-- ------------------------------------------------------------------------------
-- 3. HIERARKI RELASI BATAS ADMINISTRASI SPASIAL
--    Perusahaan -> Region -> Estate -> Afdeling -> Warung -> Blok -> Ancak
-- ------------------------------------------------------------------------------

-- 3.1 Batas Perusahaan (PT BUM & PT BSL)
create table if not exists public.batas_perusahaan (
  id text primary key,
  "Region" text,
  "REGIONAL" text,
  "Koordinator" text,
  "Luas" numeric,
  "KH" text,
  "Perusahaan" text,
  "Id" text,
  coordinates jsonb,
  created_at timestamptz default now()
);

-- 3. Tabel Batas Region
-- 3.2 Batas Region (Relasi FK -> batas_perusahaan)
create table if not exists public.batas_region (
  id text primary key,
  perusahaan_id text references public.batas_perusahaan(id) on delete set null,
  "Region" text,
  "REGIONAL" text,
  "KOOR_KASIE" text,
  coordinates jsonb,
  created_at timestamptz default now()
);

-- 4. Tabel Batas Estate
-- 3.3 Batas Estate (Relasi FK -> batas_region)
create table if not exists public.batas_estate (
  id text primary key,
  region_id text references public.batas_region(id) on delete set null,
  "Region" text,
  "Estate" text,
  "Luas" numeric,
  "Kasie" text,
  coordinates jsonb,
  created_at timestamptz default now()
);

-- 5. Tabel Batas Afdeling
-- 3.4 Batas Afdeling (Relasi FK -> batas_estate)
create table if not exists public.batas_afdeling (
  id text primary key,
  estate_id text references public.batas_estate(id) on delete set null,
  "Region" text,
  "Estate" text,
  "JSPV_1" text,
  "JSPV_2" text,
  "SPV" text,
  "KASIE" text,
  "AFD" text,
  coordinates jsonb,
  created_at timestamptz default now()
);

-- 6. Tabel Batas Warung
-- 3.5 Batas Warung (Di Atas Blok! Relasi FK -> batas_afdeling & batas_estate)
create table if not exists public.batas_warung (
  id text primary key,
  afdeling_id text references public.batas_afdeling(id) on delete set null,
  estate_id text references public.batas_estate(id) on delete set null,
  "BLOK" text,
  "AFD" text,
  "ESTATE" text,
  "REGION" text,
  "luas" numeric,
  "WARUNG" text,
  "HARI" text,
  "Drive_Wafd" text,
  coordinates jsonb,
  created_at timestamptz default now()
);

-- 7. Tabel Batas Blok (13 Kolom Baku)
-- 3.6 Batas Blok (13 Kolom Baku, Relasi FK -> batas_warung, batas_afdeling, batas_estate)
create table if not exists public.batas_blok (
  id text primary key,
  warung_id text references public.batas_warung(id) on delete set null,
  afdeling_id text references public.batas_afdeling(id) on delete set null,
  estate_id text references public.batas_estate(id) on delete set null,
  "Region" text,
  "Estate" text,
  "Afdeling" text,
  "Blok" text,
  "TahunTanam" text,
  "Luas" numeric,
  "TM_Pokok" numeric,
  "JSPV_1" text,
  "JSPV_2" text,
  "SPV" text,
  "KASIE" text,
  "KOOR_KASIE" text,
  "AFD" text,
  coordinates jsonb,
  created_at timestamptz default now()
);

-- 8. Tabel Batas Ancak (16 Kolom Baku)
-- 3.7 Batas Ancak Panen (16 Kolom Baku, Relasi FK -> batas_blok & batas_warung)
create table if not exists public.batas_ancak (
  id text primary key,
  blok_id text references public.batas_blok(id) on delete set null,
  warung_id text references public.batas_warung(id) on delete set null,
  "BLOK" text,
  "AFD" text,
  "ESTATE" text,
  "REGION" text,
  "luas" numeric,
  "WARUNG" text,
  "HARI" text,
  "Drive_Wafd" text,
  "BLOK_1" text,
  "AFD_1" text,
  "ESTATE_1" text,
  "REGION_1" text,
  "WARUNG_1" text,
  "HARI_1" text,
  "No_Ancak" text,
  "Koord_X" text,
  coordinates jsonb,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------------------------
-- 4. PENGAMANAN & INDEX RELASI
-- ------------------------------------------------------------------------------

-- Jika tabel sudah terbuat sebelumnya tanpa kolom relasi, tambahkan secara aman TERLEBIH DAHULU:
alter table public.gis_users add column if not exists role_id int references public.user_roles(role_id) on delete set null;
alter table public.gis_users add column if not exists created_by text references public.gis_users(id) on delete set null;
alter table public.gis_audit_logs add column if not exists user_id text references public.gis_users(id) on delete set null;
alter table public.batas_region add column if not exists perusahaan_id text references public.batas_perusahaan(id) on delete set null;
alter table public.batas_estate add column if not exists region_id text references public.batas_region(id) on delete set null;
alter table public.batas_afdeling add column if not exists estate_id text references public.batas_estate(id) on delete set null;
alter table public.batas_warung add column if not exists afdeling_id text references public.batas_afdeling(id) on delete set null;
alter table public.batas_warung add column if not exists estate_id text references public.batas_estate(id) on delete set null;
alter table public.batas_blok add column if not exists warung_id text references public.batas_warung(id) on delete set null;
alter table public.batas_blok add column if not exists afdeling_id text references public.batas_afdeling(id) on delete set null;
alter table public.batas_blok add column if not exists estate_id text references public.batas_estate(id) on delete set null;
alter table public.batas_ancak add column if not exists blok_id text references public.batas_blok(id) on delete set null;
alter table public.batas_ancak add column if not exists warung_id text references public.batas_warung(id) on delete set null;

create index if not exists idx_gis_users_username on public.gis_users(username);
create index if not exists idx_gis_users_role on public.gis_users(role_id);
create index if not exists idx_batas_region_perusahaan on public.batas_region(perusahaan_id);
create index if not exists idx_batas_estate_region on public.batas_estate(region_id);
create index if not exists idx_batas_afdeling_estate on public.batas_afdeling(estate_id);
create index if not exists idx_batas_warung_afdeling on public.batas_warung(afdeling_id);
create index if not exists idx_batas_blok_warung on public.batas_blok(warung_id);
create index if not exists idx_batas_blok_afdeling on public.batas_blok(afdeling_id);
create index if not exists idx_batas_ancak_blok on public.batas_ancak(blok_id);

-- Aktifkan Row Level Security (RLS)
alter table public.user_roles enable row level security;
alter table public.gis_users enable row level security;
alter table public.gis_audit_logs enable row level security;
alter table public.batas_perusahaan enable row level security;
alter table public.batas_region enable row level security;
alter table public.batas_estate enable row level security;
alter table public.batas_afdeling enable row level security;
alter table public.batas_warung enable row level security;
alter table public.batas_blok enable row level security;
alter table public.batas_ancak enable row level security;
alter table public.gis_users enable row level security;

-- Izinkan Akses Baca & Tulis Penuh untuk API Anonim & Otentikasi
-- Kebijakan Akses API
drop policy if exists "Allow all operations for anon" on public.user_roles;
create policy "Allow all operations for anon" on public.user_roles for all using (true) with check (true);

drop policy if exists "Allow all operations for anon" on public.gis_users;
create policy "Allow all operations for anon" on public.gis_users for all using (true) with check (true);

drop policy if exists "Allow all operations for anon" on public.gis_audit_logs;
create policy "Allow all operations for anon" on public.gis_audit_logs for all using (true) with check (true);

drop policy if exists "Allow all operations for anon" on public.batas_perusahaan;
create policy "Allow all operations for anon" on public.batas_perusahaan for all using (true) with check (true);

drop policy if exists "Allow all operations for anon" on public.batas_region;
create policy "Allow all operations for anon" on public.batas_region for all using (true) with check (true);

drop policy if exists "Allow all operations for anon" on public.batas_estate;
create policy "Allow all operations for anon" on public.batas_estate for all using (true) with check (true);

drop policy if exists "Allow all operations for anon" on public.batas_afdeling;
create policy "Allow all operations for anon" on public.batas_afdeling for all using (true) with check (true);

drop policy if exists "Allow all operations for anon" on public.batas_warung;
create policy "Allow all operations for anon" on public.batas_warung for all using (true) with check (true);

drop policy if exists "Allow all operations for anon" on public.batas_blok;
create policy "Allow all operations for anon" on public.batas_blok for all using (true) with check (true);

drop policy if exists "Allow all operations for anon" on public.batas_ancak;
create policy "Allow all operations for anon" on public.batas_ancak for all using (true) with check (true);
create policy "Allow all operations for anon" on public.gis_users for all using (true) with check (true);
create policy "Allow all operations for anon" on public.batas_estate for all using (true) with check (true);
create policy "Allow all operations for anon" on public.batas_afdeling for all using (true) with check (true);
create policy "Allow all operations for anon" on public.batas_warung for all using (true) with check (true);
create policy "Allow all operations for anon" on public.batas_blok for all using (true) with check (true);
create policy "Allow all operations for anon" on public.batas_ancak for all using (true) with check (true);

grant all on public.gis_audit_logs to anon, authenticated;
grant all on public.batas_perusahaan to anon, authenticated;
grant all on public.batas_region to anon, authenticated;
grant all on public.batas_estate to anon, authenticated;
grant all on public.batas_afdeling to anon, authenticated;
grant all on public.batas_warung to anon, authenticated;
grant all on public.batas_blok to anon, authenticated;
grant all on public.batas_ancak to anon, authenticated;
