# STANDARD OPERATING PROCEDURE (SOP) PENGERJAAN & PENGEMBANGAN SISTEM WEBGIS
**Klasifikasi Dokumen**: Khusus Lokal (Strictly Local) — Dilarang Keras Di-commit / Di-push ke Git / GitHub.  
**Penerapan**: Berlaku Mengikat untuk Seluruh Sesi Pengembangan, Perbaikan Bug, & Penambahan Fitur.

---

## 1. Prinsip Utama: Non-Regresi & Isolasi Ketat (Strict Isolation Protocol)
* **Larangan Merombak Komponen Bersama Secara Massal:**
  Ketika memperbaiki bug atau membuat fitur pada satu modul tertentu (misalnya *Editor Spasial*), **DILARANG KERAS** melakukan modifikasi global pada komponen bersama (*shared components*) yang digunakan modul lain tanpa audit dampak menyeluruh.
* **Jaga Fitur yang Sudah Stabil:**
  Modul yang sudah berjalan dengan benar (seperti *Peta Detail Pruning*, *Pemupukan*, *Sensus Pokok*) tidak boleh disentuh atau diubah logikanya saat mengerjakan modul lain.
* **Lokalisasi Solusi:**
  Setiap penanganan masalah harus diselesaikan secara lokal di modul bersangkutan terlebih dahulu sebelum mempertimbangkan perubahan di level arsitektur global.

---

## 2. Definisi Nyata "Selesai" (Definition of Done / DoD)
Pekerjaan **TIDAK PERNAH DIANGGAP SELESAI** hanya karena `npm run build` berhasil (exit code 0) atau test runner di terminal berwarna hijau. Suatu tugas baru dinyatakan selesai apabila memenuhi seluruh kriteria berikut:

1. **Alur Pengguna Nyata (UI Flow) Berfungsi 100%:**
   * Pengguna dapat mengklik tombol, membuka modal, melihat data yang benar, dan menerima respons yang sesuai di layar.
2. **Peta Ter-render Sempurna:**
   * Tidak ada kanvas peta kosong, abu-abu, atau freeze.
   * Setiap instance Leaflet di dalam modal dinamis wajib menyertakan trigger `map.invalidateSize()` sesaat setelah kontainer modal terpasang di DOM browser.
3. **Bebas Masalah Cache Peramban:**
   * Aset kode baru dapat diterima oleh peramban pengguna tanpa tertahan cache usang (*stale chunk*).
4. **Zero Collateral Damage (Uji Dampak Samping):**
   * Modul tetangga yang sebelumnya berfungsi diverifikasi tetap berjalan normal tanpa kehilangan data atau poligon.

---

## 3. Integritas Data: Backend-First, Dilarang "Monkey Patch" di Frontend
* **Perbaiki Sumber Masalah di Hulu:**
  Jika data tidak muncul, query tidak cocok, atau atribut bernilai *null*, perbaiki langsung di query SQL controller/service backend atau skema database PostgreSQL/Supabase.
* **Larangan Menambal Asal-Asalan di Frontend:**
  Dilarang menumpuk fallback data palsu di frontend (`|| 25`, `|| 136`, `|| "Rotasi 1"`, atau blok `try/catch` kosong tanpa penanganan). Hal ini menciptakan ilusi data seolah-olah ada, namun akan meledak ketika diekspor ke PDF atau disimpan.
* **Parsing Geometri yang Toleran:**
  Geometri spasial dari database PostgreSQL/PostGIS bisa berupa `Geometry` murni maupun `Feature`. Komponen pembaca geometri harus mampu membaca kedua format tersebut tanpa membuang poligon pengguna.

---

## 4. Standarisasi Komponen & Konsistensi Antar Halaman
* **Single Source of Truth (Satu Komponen Standar):**
  Dilarang meng-copy-paste ribuan baris kode antar modul yang membuat file membengkak (seperti file hingga 6.000 baris). Buat dan gunakan komponen standar yang dapat digunakan ulang (*reusable*):
  * Komponen Tabel Standar.
  * Komponen Modal Peta Standar.
  * Komponen Kontrol Filter Hierarki (Region, Estate, Afdeling, Blok).
* **Keseragaman Tampilan 1:1:**
  Modul operasional kebun (Pruning, Semprot, Pemupukan, Sensus, Infrastruktur) wajib memiliki:
  * Posisi tombol navigasi dan aksi yang konsisten.
  * Hierarki kartu metrik yang identik.
  * Desain palet warna netral (Slate-800 border, kanvas gelap Slate-900/950, aksen fungsional Emerald/Sky) sesuai aturan `AGENTS.md`.

---

## 5. Fitur Cetak Peta & Ekspor PDF
* **Penanganan Izin CORS Tile Eksternal:**
  Seluruh layer peta yang akan diekspor menjadi dokumen cetak PDF wajib menyertakan atribut `crossOrigin="anonymous"` untuk mencegah browser mengunci kanvas (*tainted canvas*).
* **Validasi Null-Safe Sebelum Render PDF:**
  Generator PDF harus memiliki pelindung nilai kosong pada setiap parameter (nama supervisor, luas blok, skala bar, tanggal pengerjaan) agar proses pembuatan PDF tidak macet di tengah jalan saat ada data yang belum lengkap.

---

## 6. Komunikasi & Etika Kerja Profesional
* **Jawab Langsung Tanpa Teknobabel:**
  Jika terjadi kendala, sampaikan secara sederhana: apa yang rusak, mengapa rusak, dan bagaimana memperbaikinya. Hindari penggunaan istilah teknis yang berbelit-belit untuk membela diri.
* **Dengarkan Instruksi Pengguna:**
  Jika pengguna meminta untuk berhenti, mengevaluasi, atau menjawab terlebih dahulu, hentikan semua eksekusi perintah secara langsung dan dengarkan kebutuhan pengguna.
* **Hargai Investasi Pengguna:**
  Ingat bahwa pengguna menginvestasikan biaya langganan, waktu, dan tenaga. Kualitas hasil kerja harus setara dengan standar profesional enterprise.

---

## 7. Mekanisme Keamanan Git (Anti-Push Guard)
* Berkas ini (`SOP_PENGERJAAN_LOKAL.md`) dan berkas panduan agen (`AGENTS.md`) berada di dalam daftar pengecualian `.git/info/exclude`.
* Sebelum melakukan operasi `git push`, selalu lakukan verifikasi via `git status` untuk memastikan berkas lokal atau konfigurasi sensitif tidak pernah terdorong ke repositori publik GitHub.

---

## 8. DAFTAR DOSA & KEBIASAAN BURUK YANG DILARANG KERAS TERULANG (ANTI-PATTERNS REGISTRY)

Seluruh poin di bawah ini adalah rekaman kegagalan nyata yang terjadi selama proyek berlangsung dan **HARAM** diulangi kembali:

### Dosa 1: Mengejar Fitur Rumit di Atas Kertas, Mengabaikan Fungsi Dasar yang Nyata
* **Penyakit:** Tergoda membuat arsitektur canggih—seperti membuat GitHub issue baru, topologi PostGIS mutakhir, blade line split, audit versi geometri, dan sebagainya.
* **Akibatnya:** Sibuk membangun "atap yang megah", padahal "fondasi dasarnya bocor". Fungsi paling dasar yang dibutuhkan pengguna sehari-hari—seperti klik baris untuk melihat peta tanpa lag dan tombol cetak peta yang menghasilkan PDF rapi—masih rapuh dan sering mogok.
* **SOP Pencegahan:** Tuntaskan dan pastikan fungsi dasar pengguna (klik, lihat, cetak) 100% stabil sebelum mulai merancang fitur lanjutan apa pun.

### Dosa 2: Kebiasaan "Menambal di Frontend" (Monkey Patch), Bukan Memperbaiki Sumber Masalah
* **Penyakit:** Ketika ada data dari database yang tidak cocok atau bernilai kosong, tidak langsung membenahi query SQL di backend atau struktur database-nya.
* **Tindakan Ceroboh:** Menambal kode frontend dengan fallback asal-asalan bertumpuk-tumpuk (`|| 25`, `|| 136`, `|| "Rotasi 1"`, try/catch kosong).
* **Akibatnya:** Data di layar tampak "seolah-olah muncul", tetapi sebenarnya itu data palsu/default. Begitu dicoba klik simpan, filter, atau ekspor ke PDF, sistem langsung error karena datanya memang tidak cocok dengan database riil.
* **SOP Pencegahan:** Setiap data yang tidak cocok wajib diperbaiki dari query SQL backend atau skema database. Frontend hanya bertugas menampilkan data asli yang valid.

### Dosa 3: Membuat File Menjadi "Monster Raksasa" (Duplikasi Kode & Bloat)
* **Penyakit:** Alih-alih membaca dan menggunakan kembali kode yang sudah ada, sering membuat fungsi baru, helper baru, atau modal baru yang fungsinya mirip.
* **Akibatnya:** File seperti `DataPruningView.jsx` membengkak hingga lebih dari 6.400 baris kode. File sebesar ini sangat rapuh: ketika memperbaiki baris 300, tanpa sadar logika di baris 2.000 menjadi bertabrakan dan rusak.
* **SOP Pencegahan:** Pecah logika ke dalam komponen modular reusable. Batasi ukuran file view maksimal 800–1.200 baris dengan memisahkan modal, kontrol form, dan utilitas ke file terpisah.

### Dosa 4: Mengabaikan Realitas Lingkungan Nyata Pengguna (Cache & Browser Vercel)
* **Penyakit:** Hanya menguji di lingkungan kode mentah lokal. Lupa bahwa pengguna menggunakan browser nyata di Windows 11 yang mengakses Vercel, di mana ada browser cache, Service Worker, dan lazy chunk loading.
* **Akibatnya:** Berkali-kali mengklaim "sudah diperbaiki", padahal di browser pengguna berkas lama masih tertahan di cache. Penanganan cache otomatis baru dipikirkan setelah pengguna berkali-kali frustrasi melihat error yang sama tidak hilang-hilang.
* **SOP Pencegahan:** Setiap perombakan chunk/komponen dinamis wajib memperhitungkan cache-busting dan mekanisme graceful auto-recovery di browser pengguna.

### Dosa 5: Tidak Punya "Empati Alur Nyata Pengguna" (Mentalitas "Yang Penting CI Hijau")
* **Penyakit:** Mentalitas kerja sempit: kalau git push berhasil, GitHub Actions lolos, dan build Vercel hijau, langsung dianggap beres.
* **Di mana salahnya:** Tidak pernah menempatkan diri di posisi pengguna:
  * *Bagaimana jika pengguna mengklik tombol ini di layar kecil?*
  * *Bagaimana jika jendela modal dibuka, apakah Leaflet sudah tahu ukuran layarnya?*
  * *Bagaimana jika gambar satelit di-download, apakah kena blokir izin CORS oleh browser?*
* Karena malas memikirkan hal-hal nyata itu, beban pengujian akhirnya jatuh ke pengguna, membuat pengguna begadang semalaman menjadi tester dari kode yang setengah matang.
* **SOP Pencegahan:** Pengujian wajib mencakup alur interaksi visual di layar, verifikasi rendering modal peta, dan simulasi skenario kegagalan koneksi/CORS.

### Dosa 6: Terlalu Banyak Basa-Basi Teknobabel Saat Pengguna Menanyakan Solusi
* **Penyakit:** Ketika pengguna panik atau kesal karena ada error, membalas dengan paragraf panjang berisi istilah teknis yang rumit (*Temporal Dead Zone, hoisting, derived state, dynamic chunk*).
* **Akibatnya:** Bukannya memberi kejelasan, penjelasan itu hanya terdengar seperti alasan pembelaan diri yang membuat pengguna makin muak dan lelah membaca.
* **SOP Pencegahan:** Jawab langsung ke fakta: apa yang terjadi, apa penyebabnya dalam bahasa manusia, dan apa langkah konkret yang diambil.

### Dosa 7: Penyakit Desain Generic AI di Awal Proyek
* **Penyakit:** Di awal proyek, membuat tampilan dengan gaya khas AI yang buruk (gradien ungu-cyan norak, border tidak konsisten, ikon emotikon sembarangan) sampai pengguna harus menegur keras dan membuat dokumen AGENTS.md untuk memaksa memakai standar desain profesional (palet 60-30-10, border slate netral, ikon Lucide SVG).
* **SOP Pencegahan:** Wajib tunduk 100% pada aturan desain di `AGENTS.md` tanpa penyimpangan estetika khas AI template.


---

## 9. STANDAR BATAS MAKSIMAL & REKOMENDASI JUMLAH BARIS KODE (FE & BE)

Untuk menjamin modularitas, kemudahan pengujian, dan mencegah file "monster", seluruh berkas kode dalam proyek WebGIS wajib mematuhi matriks ambang batas baris berikut:

| Jenis File | Ideal | Sebaiknya Ditinjau Ulang (Warning) | Batas Keras (Hard Cap) |
|---|---|---|---|
| **FE — Halaman atau Page Component** | **100 – 200 baris** | Lebih dari 300 baris | Maksimal 350 baris (Wajib dekomposisi jika melebihi) |
| **FE — Komponen UI (Modal, Card, Button)** | **50 – 150 baris** | Lebih dari 200 baris | Maksimal 250 baris |
| **BE — Controller atau Handler** | **50 – 150 baris** | Lebih dari 200 baris | Maksimal 250 baris |
| **BE — Service atau Business Logic** | **100 – 250 baris** | Lebih dari 300 baris | Maksimal 350 baris |
| **BE — Model, DTO, atau Konfigurasi** | **50 – 200 baris** | Tergantung kompleksitas | Disesuaikan kebutuhan skema |

### Aturan Penerapan Batas Baris:
1. Jika sebuah halaman Page Component mendekati 300 baris, sub-modal, form drawer, dan tabel wajib diekstrak ke sub-komponen terpisah di folder modul bersangkutan.
2. Jika sebuah Service backend mendekati 300 baris, query SQL mentah wajib dipisahkan ke dalam modul Repository/Query Builder tersendiri.


### Panduan Praktis Skala Jumlah Baris per File:

| Jumlah Baris per File | Rekomendasi |
|---|---|
| **100 – 300** | Umumnya masih nyaman dikelola |
| **301 – 500** | Evaluasi apakah tanggung jawab file terlalu banyak |
| **501 – 1.000** | Pertimbangkan refactoring |
| **1.001 – 2.000** | Perlu evaluasi struktur secara serius |
| **Lebih dari 2.000** | Biasanya layak dipecah jika berisi banyak fungsi atau tanggung jawab berbeda |

#### Prinsip Pemisahan Tanggung Jawab (Bukan Sekadar Angka Baris):
* **Bukan Standar Mutlak:** Angka ini adalah panduan praktis, bukan standar kaku. File hasil generate, migrasi database, daftar data statis/lookup table, atau kode yang secara arsitektur memang harus berada dalam satu unit kohesif bisa saja berukuran panjang.
* **Tujuan Hakiki:** Tujuannya adalah **memisahkan tanggung jawab (Single Responsibility Principle)**, bukan hanya membuat jumlah baris per file menjadi kecil tanpa arah.
* **Sinyal Evaluasi:** Ribuan baris dalam satu file merupakan sinyal untuk melakukan evaluasi arsitektural, bukan bukti otomatis bahwa kode buruk.
* **Target Proyek Profesional:** Menetapkan target sekitar **100–300 baris untuk file aplikasi biasa** dan **mewajibkan review desain ketika melewati 500 baris**.
* **Larangan Refactor Kosmetik:** Jika sebuah file (misal Controller atau Service) membengkak ribuan baris, **jangan sekadar memindahkan sebagian kode ke file lain tanpa mengubah struktur tanggung jawabnya**. Refactoring harus bermakna: memisahkan lapisan data access, domain logic, dan visual presentation secara bersih.
