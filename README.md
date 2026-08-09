# sapastmariamagdalena-v2

Sistem Informasi Pendataan Warga Mandiri (SAPA) Kediri - Lingkungan St. Maria Magdalena, Paroki St. Vincentius a Paulo Kediri.

## 🚀 Fitur Utama

- **Pendataan Kartu Keluarga (KK) & Anggota Keluarga**: Pencatatan data warga lingkungan lengkap dengan status sakramen dan profesi.
- **Cetak Surat & Kartu Keluarga Lingkungan**: Dilengkapi Kop Surat resmi dengan Logo St. Maria Magdalena (posisi kiri, teks tengah).
- **Sinkronisasi Realtime Firebase Firestore**: Data tersimpan dengan aman dan tersinkronisasi otomatis antar HP/perangkat.
- **Multi-Akses**: Dashboard Pengurus (Admin) & Dashboard Warga.
- **Pencarian & Filter Pintar**: Kemudahan pencarian warga berdasarkan nama, blok, lingkungan, atau status sakramen.

---

## 🛠️ Cara Menghubungkan & Memperbarui GitHub (Repository Baru: sapastmariamagdalena-v2)

### Opsi A: Menggunakan Sync GitHub di AI Studio (Langkah Pembersihan & Sync)
1. Di panel bagian kanan atas AI Studio (tab **GitHub**):
2. Klik ikon **Unlink / Disconnect** (Ikon rantai terputus ⛓️❌ atau tanda silang) untuk memutuskan sambungan repository lama (`galacia07jkt-stack/sapa-stmariamagdalena` / `app-sapamm`).
3. Setelah terputus, klik **Connect to GitHub** / **Create Repository**.
4. Ketik nama repository baru: `sapastmariamagdalena-v2`.
5. Klik tombol **Create GitHub Repository** atau **Sync**.

---

### Opsi B: Mengunggah Secara Manual via Git (Command Line)

```bash
# 1. Masuk ke folder proyek lokal Anda
cd sapastmariamagdalena-v2

# 2. Inisialisasi Git baru
git init

# 3. Tambahkan remote repository GitHub baru Anda
git remote add origin https://github.com/USERNAME/sapastmariamagdalena-v2.git

# 4. Tambahkan semua file & buat commit
git add .
git commit -m "Initial commit - sapastmariamagdalena-v2"

# 5. Push ke GitHub
git branch -M main
git push -u origin main --force
```

---

## 💻 Cara Menjalankan Aplikasi di Komputer / Laptop Lokal

### 1. Prasyarat
- **Node.js**: Versi 18 atau 20 (Unduh dari [nodejs.org](https://nodejs.org/)).
- **Git**: Untuk melakukan `clone` dari GitHub.

### 2. Langkah Instalasi

```bash
# 1. Clone repository dari GitHub
git clone https://github.com/USERNAME/sapastmariamagdalena-v2.git

# 2. Masuk ke direktori proyek
cd sapastmariamagdalena-v2

# 3. Install semua dependencies
npm install

# 4. Jalankan server pengembangan lokal
npm run dev
```

Aplikasi akan berjalan di browser pada alamat: `http://localhost:3000` (atau port yang ditentukan oleh Vite).

---

## ⚙️ Konfigurasi Firebase (Firestore & Auth)

Aplikasi ini menggunakan Firebase Firestore untuk database cloud.
Secara otomatis, konfigurasi Firebase dimuat dari file `firebase-applet-config.json`.

Jika Anda ingin menghubungkan ke proyek Firebase milik Anda sendiri:
1. Buat proyek baru di [Firebase Console](https://console.firebase.google.com/).
2. Aktifkan **Firestore Database** dan **Authentication**.
3. Salin konfigurasi Web App Firebase Anda ke file `.env` atau buat file `firebase-applet-config.json` di root folder.

---

## 📜 Lisensi & Penggunaan
Aplikasi ini dikembangkan untuk Lingkungan St. Maria Magdalena - Semampir, Paroki St. Vincentius a Paulo Kediri.

