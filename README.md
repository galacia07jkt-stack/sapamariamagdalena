# SAPA St. Maria Magdalena Semampir — Paroki St. Vincentius a Paulo Kediri

**SAPA (Sistem Administrasi & Pendataan Jemaat Warga Katolik)**  
Lingkungan St. Maria Magdalena Semampir, Wilayah Paroki St. Vincentius a Paulo Kota Kediri, Keuskupan Surabaya.

---

## 🚀 Panduan Lengkap Onlinekan ke GitHub & Vercel.app

Aplikasi ini dibangun menggunakan arsitektur **Vite + React (TypeScript)** dan telah dilengkapi dengan file konfigurasi `vercel.json` sehingga langsung siap di-*deploy* ke **Vercel** tanpa konfigurasi rumit.

---

### TAHAP 1: Upload / Push Kode ke GitHub

#### Langkah 1.1: Buat Repository Baru di GitHub
1. Buka [https://github.com](https://github.com) lalu masuk (*Sign in*) ke akun GitHub Anda.
2. Klik tombol **New** (atau tanda **+** di pojok kanan atas -> **New repository**).
3. Beri nama repository, misalnya: `sapa-semampir-kediri`.
4. Pilih opsi **Public** (atau **Private** sesuai kebutuhan lingkungan).
5. **Jangan centang** opsi "Initialize with README" karena project ini sudah memiliki file lengkap.
6. Klik **Create repository**.
7. Salin URL repository GitHub Anda, contoh:  
   `https://github.com/USERNAME_ANDA/sapa-semampir-kediri.git`

#### Langkah 1.2: Hubungkan dan Push dari Komputer / Terminal
Di dalam folder proyek ini, jalankan perintah terminal berikut:

```bash
# 1. Pastikan Anda berada di root direktori proyek
git branch -M main

# 2. Hubungkan ke repository GitHub Anda (ganti USERNAME_ANDA dengan username GitHub Anda)
git remote add origin https://github.com/USERNAME_ANDA/sapa-semampir-kediri.git

# 3. Upload / Push seluruh kode ke GitHub
git push -u origin main
```

*(Jika diminta login atau token, masukkan kredensial akun GitHub Anda).*

---

### TAHAP 2: Hubungkan GitHub ke Vercel.app (Deploy Otomatis)

1. Buka [https://vercel.com](https://vercel.com) dan masuk menggunakan akun **Continue with GitHub**.
2. Di halaman Dashboard Vercel, klik tombol **Add New...** -> pilih **Project**.
3. Pada bagian **Import Git Repository**, cari repository Anda (`sapa-semampir-kediri`), lalu klik tombol **Import**.
4. Di halaman **Configure Project**:
   - **Framework Preset**: Vercel akan otomatis mendeteksi **Vite**.
   - **Root Directory**: Biarkan `./` (default).
   - **Build Command**: `npm run build` (default).
   - **Output Directory**: `dist` (default).
   - **Install Command**: `npm install` (default).
5. Klik tombol **Deploy**.
6. Tunggu proses build selama kurang lebih 30–60 detik hingga muncul animasi kembang api tanda berhasil (*Congratulations!*).
7. Aplikasi web Anda kini telah online dan memiliki domain resmi gratis ber-SSL, contoh:  
   👉 `https://sapa-semampir-kediri.vercel.app`

---

### TAHAP 3 (Alternatif): Deploy Langsung via Vercel CLI

Jika Anda tidak ingin lewat GitHub dan ingin deploy langsung dari terminal komputer:

```bash
# 1. Install Vercel CLI secara global
npm install -g vercel

# 2. Login ke Vercel
vercel login

# 3. Jalankan perintah deploy
vercel --prod
```

---

## ⚙️ Konfigurasi Khusus yang Sudah Terpasang

- **`vercel.json`**: Menjamin semua routing halaman berjalan mulus pada Single Page Application (SPA) tanpa error 404 saat halaman di-refresh:
  ```json
  {
    "version": 2,
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```
- **`.gitignore`**: Otomatis menyaring folder `node_modules/`, `dist/`, dan file berkas lokal agar repository GitHub tetap bersih dan ringan.

---

## 🌟 Fitur Utama Aplikasi SAPA Semampir

1. **Formulir Pendaftaran Warga**:
   - Format teks otomatis **Title Case** (Huruf pertama setiap kata otomatis KAPITAL/BESAR).
   - Format tanggal standar Indonesia **DD/MM/YYYY** (`HH/BB/TTTT`).
   - Pilihan Agama lengkap dengan sakramen Gerejawi (Baptis, Komuni I, Krisma, Pernikahan) khusus pendaftar Katolik.
   - Kolom **RT** dan **RW** inputan mandiri (tanpa dropdown).
2. **Cek Ulang & Verifikasi Mandiri**:
   - Pencarian berdasarkan NIK, No. KK, atau Nama dengan proteksi sensor data pribadi.
   - Cetak Surat Bukti Registrasi resmi berlogo SAPA.
3. **Portal Admin & Pelaporan Excel**:
   - Akses Admin via PIN/Kata sandi: `sapa123`.
   - Ekspor Excel (`.xlsx`) berbingkai rapi dengan header paroki, format teks No. KK/NIK tanpa notasi ilmiah, dan kolom tanda tangan.
   - Pengaturan presisi parameter **temperature (0.0 / 0.1)**.
4. **Keamanan Enkripsi Informasi Paroki**:
   - Enkripsi AES-256-GCM khusus dibuka oleh Admin resmi.
   - Fitur Backup Vault `.sapa` dan Restore data.
5. **Responsif Penuh**:
   - Nyaman digunakan di Android & iPhone dengan bottom navigation bar khusus mobile.
