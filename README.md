# TFARM Timika - Peternakan Ayam Broiler Modern Closed House

Sistem peternakan ayam broiler modern berbasis teknologi *Closed House* di Timika, Papua. Proyek web ini menyajikan visualisasi performa produksi (IP, FCR, Deplesi), jurnal pembangunan kandang 2 tingkat (23 tahap), serta cetak biru teknis interaktif untuk kapasitas 7.000 dan 9.000 ekor.

---

## 🌟 Fitur Utama

### 1. Website Utama (`index.html`) - Model 7.000 Ekor (24m x 8m)
- **Dashboard Performa Interaktif**: Data hasil panen aktual (IP 385, FCR 1.46, Deplesi 4.2%, Bobot 2.8 kg) selama 3 periode pemeliharaan.
- **Kalkulator IP Broiler Live**: Simulasi mandiri skor Indeks Performa (IP), daya hidup (*livability*), dan estimasi total biomassa panen.
- **Jurnal Konstruksi 23 Tahap**: Dokumentasi rekayasa kandang dari pematangan lahan hingga fase *chick-in* dilengkapi **Fullscreen Lightbox Modal** beresolusi tinggi.
- **Sertifikat Prestasi Kemitraan**: Bukti integritas hasil panen dengan fitur zoom inspeksi.
- **Lokasi & Kontak GPS**: Peta satelit Google Maps Timika dan tombol salin alamat cepat.

### 2. Cetak Biru Interaktif (`9000.html`) - Model 9.000 Ekor (12m x 50m)
- **5 Tab SVG Interaktif**:
  1. *Denah (Tampak Atas)*: Pembagian 2 segmen @ 24m, rak ganda 3m, rak samping 1.5m, 3 lorong inspeksi, dan 1 cross aisle tengah.
  2. *Potongan Melintang*: Rekayasa pilar kayu keras yang menembus ke atas menyangga bentangan kuda-kuda atap 12m tanpa baja ringan.
  3. *Tampak Depan*: 80 lembar celldex cooling pad dengan pelindung tampias hujan (*overhang*).
  4. *Tampak Belakang*: 8 Exhaust Boxfan 50" dual-power (4 Diesel + 4 Listrik).
  5. *Simulasi Sirkulasi Angin*: Aliran kecepatan udara 2.2 - 2.5 m/s dengan gradien suhu mikro.
- **Kalkulator Kepadatan & Ventilasi Kipas (CFM)**: Menghitung kebutuhan pergantian udara dan kepadatan kandang optimal (10.4 ~ 11 ekor/m²).
- **Kontrol Zoom, Pan, & Fullscreen**: Navigasi kanvas teknis yang responsif untuk desktop maupun mobile.
- **Format Siap Cetak (Print/PDF)**: Layout monokrom berstandar dokumen teknik.

---

## 📁 Struktur File

```
tfarm/
├── index.html          # Halaman utama TFARM Timika (Model 7.000 Ekor)
├── 9000.html           # Cetak Biru Interaktif 12x50m (Model 9.000 Ekor)
├── logo.png            # Logo resmi TFARM
├── prestasi index.jpg  # Sertifikat Prestasi Kemitraan TFARM
└── README.md           # Dokumentasi proyek
```

---

## 🚀 Cara Menjalankan Secara Lokal

Anda dapat langsung membuka file `.html` pada browser modern apa saja:
1. Dobel klik `index.html` untuk membuka portal utama.
2. Navigasi ke `9000.html` melalui tombol menu navigasi atau banner blueprint di beranda.

Atau gunakan server lokal sederhana:
```bash
# Menggunakan Python
python -m http.server 8000

# Atau menggunakan live-server / npx serve
npx serve .
```

---

## 📄 Lisensi & Hak Cipta
© 2025 TFARM Timika. All rights reserved. Dikembangkan untuk efisiensi agrobisnis peternakan modern di Tanah Papua.
