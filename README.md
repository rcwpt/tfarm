# TFARM Timika - Peternakan Ayam Broiler Modern Closed House
## 3D CAD/BIM Digital Twin & Sketsa Teknis + RAB Material (Model 26 × 12 m, 3 Susun, 7.000 Ekor)

Sistem peternakan ayam broiler modern berbasis teknologi *Closed House* di Timika, Papua. Repositori ini berisi **3D CAD/BIM Digital Twin Interaktif**, **Sketsa Teknis 2D CAD**, dan **Bill of Materials (RAB Material tanpa harga)**, yang dibangun berdasarkan sumber utama file SketchUp Ruby:

```
build_kandang_LENGKAP.rb (Source of Truth)
```

Seluruh ukuran, koordinat, material, elevasi, jumlah komponen, dan hubungan spasial diekstrak **100% presisi** dari kode Ruby tanpa pembulatan atau asumsi fiktif.

---

## 🌟 Arsitektur Sistem & Aplikasi Web

Repositori ini berpusat pada **Halaman Utama Peternakan** (`index.html`) yang didukung oleh **4 Sub-Halaman Rekayasa Teknik & Visualisasi 3D**:

```
[index.html] Portal Utama TFARM Timika (Fokus Peternakan & Operasional Kandang 26×12m 7.000 Ekor)
   │
   ├── 💻 Sub-Halaman 1: kandang-3d/index.html       (Fullscreen BIM/CAD Digital Twin 3D)
   ├── 📱 Sub-Halaman 2: kandang_broiler_3d.html      (3D CAD Mobile Touch Specialist)
   ├── ⚡ Sub-Halaman 3: kandang_broiler_3d_viewer.html (3D Lightweight Single-File Viewer)
   └── 📑 Sub-Halaman 4: sketsa-rab-26x12.html       (2D CAD Work Drawings & Bill of Materials)
```

---

### 🏠 Portal Utama Peternakan (`index.html`)
Pusat informasi komprehensif operasional dan rekayasa peternakan modern closed house di Timika, Papua:
- **Farm Overview**: Kapasitas 7.000 ekor broiler, 3 tier baterai, sistem ventilasi tunnel negative pressure.
- **Kalkulator Indeks Performa (IP) Live**: Hitung IP, FCR, deplesi/mortalitas, dan rata-rata bobot panen secara interaktif.
- **Jurnal Konstruksi Lapangan**: Dokumentasi 23 foto riil pembangunan bertahap di Timika dengan fitur lightbox zoom.
- **Showcase & Navigasi Sub-Halaman**: Embed interaktif mini viewer dan tautan langsung ke seluruh sub-halaman 3D & 2D.
- **Tabel Rekayasa Mekanikal-Elektrikal**: Spesifikasi daya genset, debit udara blower 264.000 CFM, dan kebutuhan air minum otomatis.

---

### 🎮 Sub-Halaman 1: Fullscreen 3D CAD/BIM Digital Twin (`kandang-3d/index.html`)
Aplikasi web 3D berbasis **Three.js (Offline-First)** yang berfungsi sebagai workstation CAD/BIM profesional:
- **Navigasi Kamera Penuh**: Orbit 360°, Pan, Zoom, Presets (*Isometric, Top, Front, Back, Left, Right, Interior Walkway, Roof, Structure*).
- **5 Mode Render Material**: *Realistic (PBR)*, *Technical (Color-coded Kategori)*, *Wireframe*, *X-Ray*, *Transparent*.
- **Sistem Dimensi CAD**: Menampilkan elevasi aktual Ruby (0.00, 0.03, 0.25, 0.95, 1.20, 1.90, 2.15, 2.85, 2.97, 3.00, 4.30, 4.90, 5.76, 5.86, 5.92m) dan dimensi keseluruhan (26.00m × 12.00m).
- **19 Layer SketchUp**: Kontrol visibilitas layer mandiri, tombol *Solo/Isolate*, *Zoom/Focus*, dan transparansi.
- **Inspektor Objek Interaktif**: Klik objek apa saja di canvas 3D untuk melihat Nama, ID, Kategori, Material, Dimensi (L, W, H), Posisi (X, Y, Z), Volume, Luas, dan **Traceability Baris Kode Ruby (`sourceLine`)**.
- **Mesin Pencari Objek**: Cari nama/nomor komponen (misal: `Tiang 17`, `Blower A`, `Rak B1`, `Nipple`, `Talang`) -> kamera otomatis fokus ke objek.
- **Rangka Rak 3 Susun & Slat**: 6 lajur rak 24m (Rak A, B1, B2, C1, C2, D) lengkap dengan lantai slat mesh plastik, pintu galvanis + slot kunci, alas kotoran tripleks, talang pakan profil U terbuka, dan 1.440 unit nipple drinker 360° + drip cup kuning.
- **6 Unit Exhaust Fan Box 50" & Sistem Transmisi Presisi**: 11 louver/sirip miring, motor hub, brackets, 6 propeller blade stainless yang berputar dinamis saat ventilasi aktif. As transmisi 10.4m dan puli penggerak berposisi statis sesuai mekanika riil.
- **Visualisasi Aliran Udara & Air**: Simulasi partikel udara dari Celldeck menuju exhaust fan dengan kontrol kecepatan aliran, serta tetesan air pada Celldeck cooling pad.
- **Animasi Pembangunan 8 Tahap**:
  - `[1/8]` Pondasi & Lantai Cor
  - `[2/8]` Got Drainase & Papan Ulin
  - `[3/8]` Tiang Komposit Kayu Besi 15x10 (naik dari bawah tanah)
  - `[4/8]` Rangka Dinding Vertikal & Sabuk
  - `[5/8]` Rak 3 Susun, Slat, Pintu & Talang Pakan
  - `[6/8]` Exhaust Fan 50" & Sistem Penggerak Transmisi
  - `[7/8]` Terpal Dinding & Celldeck Cooling Pad
  - `[8/8]` Kuda-Kuda, Gording Miring & Spandek Bergelombang
- **Perekam Video Konstruksi (MediaRecorder API)**: Merekam animasi pembangunan dan kamera sinematik menjadi file video `.webm` (durasi 30s, 60s, 90s).
- **Cutaway / Section Plane**: Potongan bidang X, Y, Z interaktif dengan slider.
- **Alat Ukur Titik ke Titik**: Klik 2 titik pada model untuk mengukur jarak 3D, ΔX, ΔY, dan ΔZ.
- **Mode Presentasi (P)**: Tampilan bersih tanpa UI untuk presentasi ke owner, investor, konsultan, atau tukang.

---

### 💥 Fitur Unggulan: Interactive Exploded View Engine (0% - 100%)
Fitur penguraian visual rekayasa (*Exploded Assembly*) yang memisahkan seluruh komponen bangunan menjadi 8 subsistem terisolasi secara radial dan vertikal:
1. **Atap & Spandek Bergelombang**: Terangkat vertikal +7.0 m s.d +8.5 m di atas bangunan.
2. **Kuda-Kuda Kayu Besi & Gording**: Terangkat vertikal +4.5 m memperlihatkan sistem sambungan pasak tiang.
3. **Rangka Dinding Vertikal & Sabuk**: Berekspansi keluar secara lateral pada sumbu Y (±2.5 m).
4. **Dinding Terpal Biru A8 & Penutup Samping**: Membuka ke arah luar memperlihatkan rangka interior.
5. **6 Lajur Rak 3 Susun & Slat Mesh**: Terangkat +2.0 m dan sedikit merenggang untuk inspeksi alas kotoran tripleks.
6. **Sistem Perpipaan Nipple & Talang Pakan**: Terangkat independen di atas rak ayam.
7. **Bantalan Evaporatif Celldeck (Inlet Udara)**: Bergeser ke arah depan sepanjang sumbu X (+4.0 m).
8. **6 Unit Exhaust Fan Box 50" (Outlet Udara)**: Bergeser ke arah belakang sepanjang sumbu X (-4.0 m).

> Kontrol fleksibel disediakan via slider continuous 0% – 100%, preset cepat (0%, 25%, 50%, 75%, 100%), serta tombol animasi transisi otomatis.

---

### 📱 Sub-Halaman 2: 3D CAD Mobile Specialist (`kandang_broiler_3d.html` / `kandang-3d/mobile.html`)
Dioptimalkan secara khusus untuk pengalaman peninjauan di lapangan melalui smartphone dan tablet:
- **Touch-First Navigation**: Orbit satu jari, pan dua jari, dan pinch-to-zoom dengan akselerasi inertial halus.
- **Bottom Sheet Drawer**: Panel layer dan tools didesain ramah jempol (*thumb-friendly*).
- **Tampilan Default Rangka**: Atap, dinding terpal, dan celldeck dinonaktifkan pada kondisi awal buka (*default unchecked*) sehingga struktur rangka kayu besi (`rangka bangunan`) langsung terekspos jelas.
- **Rotasi Blower Presisi**: Hanya propeller blades berputar saat ventilasi aktif, puli dan belt tetap statis.
- **Horizon Tanah Luas**: Bidang tanah 800×800m dengan grid tak terpotong saat digeser.

---

### ⚡ Sub-Halaman 3: 3D Lightweight Single-File Viewer (`kandang_broiler_3d_viewer.html`)
Solusi visualisasi 3D instan dalam format **satu file HTML mandiri**:
- **Zero Configuration**: Tanpa dependensi server atau folder eksternal, langsung jalan di browser apapun.
- **Kamera Awal Isometrik**: Tampilan sudut isometrik teknis yang proporsional saat pertama kali dibuka.
- **Default Rangka Terbuka**: Checkbox Atap, Dinding, dan Celldeck default tidak tercentang agar rangka terlihat utuh.
- **Interactive Exploded Slider**: Slider ledakan komponen visual 0–100% untuk membedah interior kandang secara instan.
- **As Transmisi Statis**: Batang as 10.4m dan puli penggerak diam kokoh di tempatnya.
- **Tanah Tanpa Batas**: Bidang tanah 800×800m dengan jarak pandang kamera (far plane) 1.500m.

---

### 📑 Sub-Halaman 4: Sketsa Teknis 2D Interaktif + RAB Material Lengkap (`sketsa-rab-26x12.html`)
Aplikasi mandiri untuk rekayasa teknis, estimasi, dan pengadaan bahan:
- **Sketsa Vektor 2D CAD Interaktif (SVG)**:
  - *Denah Tata Letak (Tampak Atas)*: Grid 8×4 tiang, 6 rak, 3 got drainase, 3 lorong inspeksi (1.0m), celldeck, dan blower.
  - *Potongan Melintang (Bentang 12m)*: Bentang kuda-kuda, monitor roof, 3 tingkat rak ayam, elevasi benchmark.
  - *Tampak Depan*: Celldeck cooling pad 12.0 × 1.7 m dan talang stainless.
  - *Tampak Belakang*: 6 unit exhaust fan box 50", mesin diesel penggerak, dan as transmisi kinetik.
  - *Tampak Samping (26m)*: Dinding vertikal 1.5x6cm spasi 30cm, 3 sabuk dinding, kemiringan atap 16.7°.
- **Rekapitulasi Kebutuhan Raw Material (Baku) vs Installed Pieces**:
  - Kayu Besi Ulin 10x10 cm: 64 batang @ 3,0 m (netto 2.97m).
  - Kayu 5x10 cm: 1.124,5 meter (~282 batang @ 4m).
  - Kayu 5x5 cm: 2.186,4 meter (~547 batang @ 4m).
  - Kayu 1.5x6 cm: 7.701,9 meter (~1.926 batang @ 4m).
  - Papan Ulin Got 2.5x20 cm: 75,0 meter (3 jalur @ 25m).
  - Atap Spandek Galvalum: 180 lembar (90 lembar 6m + 90 lembar 2m, lebar efektif 0.70m).
  - Slat Mesh Plastik: 864,0 m² (lantai & dinding belakang).
  - Tripleks Alas Kotoran 8mm: 432,0 m² (~146 lembar 122x244 cm).
  - Pipa Nipple 3/4": 108 batang @ 4m (432,0 m), 1.440 nipple drinker, 1.440 drip cup, 18 regulator, 18 flush valve.
  - Talang Pakan PVC: 432,0 m profil U terbuka + 36 end cap.
  - Waste Factor: Diberi keterangan tegas `TIDAK DIDEFINISIKAN DI RUBY SCRIPT` (tanpa asumsi fiktif).
- **RAB Bahan Tanpa Harga**: Tabel 300 baris kelompok komponen berdasarkan 15 Bagian Bangunan dan 30 Jenis Material lengkap dengan filter multi-kolom, pencarian instan, dan export CSV, JSON, serta cetak PDF.
- **Audit & Validasi Ruby**: Pengecekan otomatis yang memverifikasi 8.564 objek terurai tanpa ada komponen yang terlewat.
- **Source Code Ruby Viewer**: Menampilkan keseluruhan 790 baris `build_kandang_LENGKAP.rb` dengan nomor baris dan penyorotan sintaks.

---

## 📁 Struktur Berkas Proyek

```text
tfarm/
│
├── index.html                      # Portal utama peternakan TFARM Timika
├── 9000.html                       # Pengalihan resmi ke proyek standar 26x12m
├── sketsa-rab-26x12.html            # Sketsa Teknis 2D Interaktif + RAB Material Lengkap
│
├── kandang-3d/                     # Aplikasi Interactive 3D Digital Twin Viewer
│   ├── index.html                  # HTML Viewer 3D
│   ├── style.css                   # Stylesheet CAD/BIM theme
│   ├── app.js                      # Main application bootstrap
│   ├── scene.js                    # Three.js 3D scene hierarchy & geometry
│   ├── camera.js                   # Presets & smooth camera transitions
│   ├── controls.js                 # OrbitControls setup & damping
│   ├── dimensions.js               # CAD dimensions & elevation benchmarks
│   ├── measurements.js             # 3D point-to-point measurement ruler
│   ├── construction.js             # 8-stage assembly animation manager
│   ├── animation.js                # Fan rotation, airflow, water, exploded & video recording
│   ├── materials.js                # PBR, technical, wireframe & transparent materials
│   ├── data/
│   │   ├── kandang-data.js         # Digital Twin dataset JS (8.564 objek)
│   │   └── kandang-data.json       # Digital Twin dataset JSON murni
│   └── assets/
│       └── js/
│           ├── three.min.js        # Three.js r128 (Offline bundle)
│           └── OrbitControls.js    # OrbitControls (Offline bundle)
│
├── logo.png                        # Logo resmi TFARM
├── prestasi index.jpg              # Sertifikat prestasi panen
└── README.md                       # Dokumentasi teknik lengkap
```

---

## 🚀 Cara Menjalankan Aplikasi (Offline-First)

Aplikasi dirancang **100% Offline-First** tanpa dependensi server eksternal:

### Opsi A: Buka Langsung di Browser
1. Dobel klik `index.html` untuk membuka portal utama.
2. Klik tombol **"3D 26x12m"** pada menu navigasi untuk membuka Digital Twin 3D (`kandang-3d/index.html`).
3. Klik tombol **"Sketsa & RAB"** untuk membuka gambar kerja 2D dan RAB bahan (`sketsa-rab-26x12.html`).

### Opsi B: Menggunakan Local Web Server (Direkomendasikan)
Jika ingin menjalankan modul JavaScript ES Modules secara optimal di browser modern:
```bash
# Menggunakan Python bawaan:
python -m http.server 8000

# Buka di browser:
# http://localhost:8000/
# http://localhost:8000/kandang-3d/
# http://localhost:8000/sketsa-rab-26x12.html
```

---

## 🔍 Hasil Validasi Geometri Model

Berdasarkan perbandingan langsung antara hasil eksekusi `build_kandang_LENGKAP.rb` dan geometri WebGL Three.js:

| Parameter Rekayasa | Target Ruby Script | Realisasi WebGL 3D | Status Validasi |
| :--- | :--- | :--- | :---: |
| **Panjang Bangunan (X)** | 26.00 meter | 26.00 meter | **VALID (1:1)** |
| **Lebar Bentang (Y)** | 12.00 meter | 12.00 meter | **VALID (1:1)** |
| **Elevasi Puncak Atap** | 5.92 meter | 5.92 meter | **VALID (1:1)** |
| **Jumlah Tiang Struktur** | 32 Tiang Komposit (Grid 8×4) | 32 Tiang (160 bilah & blok) | **VALID (1:1)** |
| **Jumlah Kuda-Kuda Atap** | 14 Bentang (Spasi 2.0m) | 14 Bentang (126 elemen) | **VALID (1:1)** |
| **Jumlah Jalur Gording 5x10** | 13 Jalur Menerus Canted 16.7° | 13 Jalur x 26.0m (338m) | **VALID (1:1)** |
| **Lembar Spandek Bergelombang** | 90 lembar 6m + 90 lembar 2m | 180 Lembar (630 ribs) | **VALID (1:1)** |
| **Lajur Rak 3 Susun** | 6 Lajur @ 24m (Rak A s.d D) | 6 Lajur (984 elemen kayu) | **VALID (1:1)** |
| **Elevasi Susun Rak Ayam** | T1=0.25, T2=1.20, T3=2.15m | Z: 0.25, 1.20, 2.15 m | **VALID (1:1)** |
| **Unit Exhaust Fan 50"** | 6 Unit Box Fan Heavy Duty | 6 Unit (66 louver, 36 blade) | **VALID (1:1)** |
| **Mesin Penggerak Kinetik** | 1 Unit Mesin Diesel | 1 Unit + As Puli 10.4m | **VALID (1:1)** |
| **Cooling Pad Evaporatif** | Celldeck 7090 (12.0 × 1.7 m) | 12.0 x 1.7 m + Talang SS | **VALID (1:1)** |
| **Total Objek Geometri** | 8.564 Objek Terurai | 8.564 Objek Terurai | **100% LENGKAP** |

---

## 🔄 Cara Regenerasi Data dari Ruby Script

Jika sewaktu-waktu file `build_kandang_LENGKAP.rb` diperbarui di masa mendatang:
1. Pastikan Python terinstal di sistem.
2. Jalankan script parser otomatis:
   ```bash
   python parse_ruby_kandang.py
   python generate_qto_data.py
   python build_sketsa_rab.py
   ```
3. Script akan membaca ulang file Ruby dari baris 1 sampai baris terakhir, menghitung ulang QTO, dan memperbarui seluruh data model `kandang-data.js`, `kandang-data.json`, serta file `sketsa-rab-26x12.html`.

---

## 📄 Lisensi & Hak Cipta
© 2025–2026 **TFARM Timika**. All rights reserved.  
Dikembangkan untuk standardisasi efisiensi agrobisnis peternakan closed house modern di Tanah Papua.
