import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  Presentation,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Church,
  ShieldCheck,
  Database,
  Users,
  Printer,
  KeyRound,
  FileText,
  Search,
  Package,
  BarChart3,
  RefreshCw,
  Lock
} from 'lucide-react';
import { generateSapaPresentation } from '../lib/pptGenerator';

interface PresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  initialSlide?: number;
}

export const PresentationModal: React.FC<PresentationModalProps> = ({ isOpen, onClose, addToast, initialSlide = 0 }) => {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGeneratingPpt, setIsGeneratingPpt] = useState(false);

  useEffect(() => {
    setCurrentSlide(initialSlide);
  }, [initialSlide, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentSlide, isFullscreen]);

  if (!isOpen) return null;

  const slides = [
    // SLIDE 1: COVER
    {
      title: 'SAPA LINGKUNGAN ST. MARIA MAGDALENA',
      subtitle: 'Panduan & Tutorial Penggunaan Aplikasi Web Administrasi Umat',
      category: 'PAROKI ST. VINCENTIUS A PAULO KEDIRI',
      bgGradient: 'from-slate-900 via-indigo-950 to-slate-900',
      content: (
        <div className="flex flex-col items-center justify-center text-center h-full space-y-4 sm:space-y-5 px-2 sm:px-4 py-2">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-xl backdrop-blur-md shrink-0">
            <Church className="w-9 h-9 sm:w-12 sm:h-12" />
          </div>

          <div className="space-y-2 sm:space-y-3 max-w-3xl">
            <span className="inline-block px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 font-black text-[10px] sm:text-xs tracking-widest uppercase">
              Slide Deck Panduan Tutorial Lengkap
            </span>
            <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-white leading-tight drop-shadow-md">
              SAPA Lingkungan St. Maria Magdalena
            </h1>
            <p className="text-xs sm:text-base text-amber-200/90 font-medium max-w-2xl mx-auto leading-relaxed">
              Panduan Langkah-demi-Langkah Penggunaan Aplikasi Administrasi Umat, Kartu Keluarga Digital & Warta Paroki
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-2 sm:px-6 sm:py-2.5 rounded-2xl border border-white/20 text-xs sm:text-sm text-slate-200 font-semibold max-w-xl">
            📍 Paroki St. Vincentius a Paulo Kediri • Pengurus Lingkungan St. Maria Magdalena
          </div>
        </div>
      )
    },

    // SLIDE 2: AKUN LOGIN & HAK AKSES ROLE
    {
      title: 'Akses Login & Hak Akses Role System',
      subtitle: 'Pemisahan Kewenangan Antara Akses Umat/Warga dan Pengurus Lingkungan',
      category: 'PANDUAN 1: HAK AKSES LOGIN',
      bgGradient: 'from-slate-900 via-stone-900 to-amber-950',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 h-full items-stretch py-1">
          {/* Warga Box */}
          <div className="bg-blue-950/40 backdrop-blur-md rounded-2xl p-4 border border-blue-400/30 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-blue-300 font-black text-xs uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-400 shrink-0" />
                <span>1. Akses Umat / Warga</span>
              </div>
              <span className="px-2 py-0.5 bg-blue-500/30 rounded-md text-[10px] text-blue-200 font-bold">Read-Only</span>
            </div>

            <div className="p-2.5 bg-blue-900/40 rounded-xl border border-blue-400/20 font-mono text-xs text-blue-100 space-y-1">
              <div><span className="text-blue-300 font-sans">Username:</span> <strong>warga</strong></div>
              <div><span className="text-blue-300 font-sans">Password:</span> <strong>warga123</strong></div>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-200 leading-relaxed">
              <li className="flex items-start gap-1.5">🔹 Membaca Warta Paroki, Pengumuman Misa & Poster Flyer</li>
              <li className="flex items-start gap-1.5">🔹 Pencarian Data Kartu Keluarga & Status 7 Sakramen</li>
              <li className="flex items-start gap-1.5">🔹 Cetak Kartu Keluarga Digital (PDF) Standar Paroki</li>
              <li className="flex items-start gap-1.5">🔹 Mengajukan Layanan Surat/Pengantar ke Pengurus</li>
            </ul>

            <div className="text-[11px] text-blue-200 bg-blue-900/30 p-2 rounded-xl">
              💡 Aman untuk dibuka di smartphone warga tanpa risiko mengubah data.
            </div>
          </div>

          {/* Pengurus Box */}
          <div className="bg-amber-950/40 backdrop-blur-md rounded-2xl p-4 border border-amber-400/30 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-amber-300 font-black text-xs uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>2. Akses Pengurus Lingkungan</span>
              </div>
              <span className="px-2 py-0.5 bg-amber-500/30 rounded-md text-[10px] text-amber-200 font-bold">Admin Penuh</span>
            </div>

            <div className="p-2.5 bg-amber-900/40 rounded-xl border border-amber-400/20 font-mono text-xs text-amber-100 space-y-1">
              <div><span className="text-amber-300 font-sans">Username:</span> <strong>pengurus</strong></div>
              <div><span className="text-amber-300 font-sans">Password:</span> <strong>pengurus123</strong></div>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-200 leading-relaxed">
              <li className="flex items-start gap-1.5">🔸 Menambah, Mengedit & Menghapus Record KK & Umat</li>
              <li className="flex items-start gap-1.5">🔸 Menerbitkan Warta & Mengunggah Poster Flyer Gambar</li>
              <li className="flex items-start gap-1.5">🔸 Mengelola Data Inventaris Barang & Keuangan</li>
              <li className="flex items-start gap-1.5">🔸 Sinkronisasi Realtime dengan Google Cloud Server</li>
            </ul>

            <div className="text-[11px] text-amber-200 bg-amber-900/30 p-2 rounded-xl">
              💡 Akses lengkap untuk kelancaran administrasi lingkungan.
            </div>
          </div>
        </div>
      )
    },

    // SLIDE 3: WARGA - WARTA & FLYER
    {
      title: 'Beranda Warta & Poster Flyer Interaktif',
      subtitle: 'Panduan Umat Membaca Berita Paroki, Jadwal Misa & Perbesar Gambar Poster',
      category: 'PANDUAN 2: WARGA / UMAT',
      bgGradient: 'from-amber-900 via-orange-950 to-slate-900',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 h-full py-1">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-2 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-black text-xs sm:text-sm">
              <BookOpen className="w-4 h-4 text-orange-400 shrink-0" />
              <span>1. Membaca Warta & Pengumuman</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              Seluruh warta paroki, pengumuman jadwal Misa, katekese, dan doa rosario lingkungan ditampilkan secara kronologis di halaman utama.
            </p>
            <div className="text-[11px] bg-white/5 p-2 rounded-xl text-amber-200">
              Gunakan filter kategori (Misa / Doa / Katekese) untuk menyaring warta dengan cepat.
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-2 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-black text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>2. Fitur Pop-Up Image Viewer Poster</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              Klik pada gambar <strong>Poster Flyer Kegiatan</strong> untuk membuka tampilan layar penuh (Pop-up Lightbox) dengan tombol zoom.
            </p>
            <div className="text-[11px] bg-white/5 p-2 rounded-xl text-amber-200">
              Memudahkan umat membaca teks brosur/poster kecil langsung dari layar HP.
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-2 flex flex-col justify-between sm:col-span-2">
            <div className="flex items-center gap-2 text-amber-300 font-black text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>3. Responsif di Seluruh Layar HP, Tablet & Laptop</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              Tampilan beranda dirancang fleksibel menyesuaikan ukuran layar tanpa merusak tata letak gambar maupun tulisan warta.
            </p>
          </div>
        </div>
      )
    },

    // SLIDE 4: WARGA - PENCARIAN & CETAK KK
    {
      title: 'Pencarian Data KK & Cetak Kartu Keluarga (PDF)',
      subtitle: 'Petunjuk Mencari Data Keluarga & Mengunduh Berkas PDF Standar Paroki Kediri',
      category: 'PANDUAN 3: WARGA / UMAT',
      bgGradient: 'from-slate-900 via-blue-950 to-slate-900',
      content: (
        <div className="space-y-3 py-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15 space-y-1.5">
              <div className="flex items-center gap-2 text-blue-300 font-black text-xs">
                <Search className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Langkah 1: Pencarian Instan</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ketikkan NIK, Nomor KK, atau Nama Kepala Keluarga pada kolom pencarian. Hasil muncul dalam hitungan milidetik.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-300 font-black text-xs">
                <Users className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Langkah 2: Status Sakramen</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Klik &quot;Detail Keluarga&quot; untuk memeriksa status pendaftaran penerimaan 7 Sakramen Gereja seluruh anggota keluarga.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-300 font-black text-xs">
                <Printer className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Langkah 3: Export PDF</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tekan tombol &quot;Cetak KK (PDF)&quot; untuk mengunduh dokumen Kartu Keluarga Lingkungan resmi berformat A4 rapi.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-blue-900/30 rounded-2xl border border-blue-400/30 text-xs text-blue-100 space-y-1">
            <div className="font-bold text-blue-300">📄 Format Dokumen KK Digital Standar Resmi:</div>
            <p className="text-[11px] leading-relaxed text-blue-200">
              Dokumen PDF dibuat lengkap dengan Kop Paroki St. Vincentius a Paulo Kediri, tabel anggota keluarga, alamat RT/RW, serta nomor KK terformat rapi tanpa ada teks yang terpotong.
            </p>
          </div>
        </div>
      )
    },

    // SLIDE 5: WARGA - PENGAJUAN SURAT
    {
      title: 'Formulir Permohonan Surat & Layanan Umat',
      subtitle: 'Prosedur Mengajukan Permohonan Layanan Administratif ke Pengurus Lingkungan',
      category: 'PANDUAN 4: WARGA / UMAT',
      bgGradient: 'from-slate-900 via-indigo-950 to-slate-900',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 h-full py-1">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-2 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-black text-xs">
              <FileText className="w-4 h-4 text-orange-400 shrink-0" />
              <span>Surat Pengantar Sakramen</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pengajuan Surat Pengantar Baptis Bayi/Dewasa, Komuni Pertama, Krisma, dan Pernikahan Gereja.
            </p>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-1 rounded-lg font-bold w-fit">
              Keperluan Paroki
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-2 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-black text-xs">
              <Church className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Permohonan Doa & Misa</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Permohonan Doa Arwah/Meninggal, Misa Pemberkatan Rumah, Doa Pengandutan, dan Syukuran Keluarga.
            </p>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-1 rounded-lg font-bold w-fit">
              Kegiatan Lingkungan
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-2 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-black text-xs">
              <Users className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Pembaruan Data Keluarga</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pengajuan koreksi NIK, penambahan kelahiran anak, perpindahan RT, atau pendaftaran KK baru.
            </p>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-1 rounded-lg font-bold w-fit">
              Update Database
            </span>
          </div>
        </div>
      )
    },

    // SLIDE 6: PENGURUS - KELOLA KK & SAKRAMEN
    {
      title: 'Manajemen Pendataan KK, NIK & 7 Sakramen',
      subtitle: 'Petunjuk Pengurus Menambah, Mengedit, dan Memperbarui Data Umat',
      category: 'PANDUAN 5: PENGURUS LINGKUNGAN',
      bgGradient: 'from-amber-950 via-slate-900 to-amber-950',
      content: (
        <div className="space-y-3 py-1">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-2">
            <h4 className="font-bold text-amber-300 text-xs sm:text-sm">Langkah-Langkah Pengelolaan Data Kartu Keluarga:</h4>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-200 leading-relaxed pl-1">
              <li><strong>Tambah Record KK Baru:</strong> Klik tombol <strong className="text-amber-400">+ Tambah KK Baru</strong> di dashboard Pengurus. Isi Nomor KK, Alamat RT/RW, dan Kepala Keluarga.</li>
              <li><strong>Hitung Usia Otomatis:</strong> Masukkan tanggal lahir anggota keluarga. Sistem otomatis menghitung umur dan mengelompokkan kategori (Anak/Remaja/Dewasa/Lansia).</li>
              <li><strong>Checklist 7 Sakramen Gereja:</strong> Centang penerimaan Sakramen Baptis, Krisma, Ekaristi, Pengakuan Dosa, Imamat, Pernikahan, dan Minyak Suci beserta tanggal penerimaannya.</li>
              <li><strong>Pembaruan & Penghapusan:</strong> Pengurus dapat mengubah data kapan saja saat ada perubahan status sipil atau gerejani.</li>
            </ol>
          </div>

          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-400/30 text-[11px] text-amber-200">
            ✅ Seluruh data yang diinput pengurus akan langsung otomatis tersimpan di database lokal dan disinkronkan ke Cloud Server.
          </div>
        </div>
      )
    },

    // SLIDE 7: PENGURUS - PUBLIKASI WARTA
    {
      title: 'Publikasi Warta Paroki & Upload Poster Flyer Gambar',
      subtitle: 'Panduan Menerbitkan Berita, Pengumuman Misa, dan Poster Acara Lingkungan',
      category: 'PANDUAN 6: PENGURUS LINGKUNGAN',
      bgGradient: 'from-slate-900 via-orange-950 to-slate-900',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 h-full py-1">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-2 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-black text-xs sm:text-sm">
              <BookOpen className="w-4 h-4 text-orange-400 shrink-0" />
              <span>1. Form Input Warta</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Isi judul warta, tanggal pelaksanaan kegiatan, lokasi tempat acara, serta pesan utama pengumuman paroki/lingkungan.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-2 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-black text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>2. Upload Poster Flyer Gambar</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pilih file foto/brosur gambar (JPG, PNG). Sistem otomatis mengompresi ukuran file agar cepat dibuka di smartphone warga.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-2 flex flex-col justify-between sm:col-span-2">
            <div className="flex items-center gap-2 text-amber-300 font-black text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>3. Edit & Hapus Warta Lama</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Warta yang telah kedaluwarsa atau membutuhkan revisi dapat dengan mudah diubah atau dihapus oleh pengurus lingkungan dari dashboard Admin.
            </p>
          </div>
        </div>
      )
    },

    // SLIDE 8: INVENTARIS & GRAFIK DEMOGRAFI
    {
      title: 'Inventaris Barang Lingkungan & Grafik Demografi',
      subtitle: 'Pencatatan Perlengkapan Ibadat dan Pemantauan Statistik Demografi Warga',
      category: 'PANDUAN 7: PENGURUS LINGKUNGAN',
      bgGradient: 'from-slate-900 via-emerald-950 to-slate-900',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 h-full py-1">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-2 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-emerald-300 font-black text-xs sm:text-sm">
              <Package className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>1. Pendataan Inventaris Barang</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
              <li>Pencatatan Salib, Lilin, Taplak Altar, Piala, Sound System Portable</li>
              <li>Jumlah unit dan penanggung jawab lokasi barang</li>
              <li>Status kondisi fisik: Baik, Perlu Perbaikan, atau Rusak</li>
            </ul>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-2 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-black text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>2. Grafik Laporan Statistik Demografi</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
              <li>Grafik komposisi usia (Anak, Remaja, Dewasa, Lansia)</li>
              <li>Statistik penerima Sakramen Baptis, Krisma, & Pernikahan</li>
              <li>Pemetaan persebaran Kartu Keluarga per RT/RW</li>
            </ul>
          </div>
        </div>
      )
    },

    // SLIDE 9: ARSITEKTUR HYBRID & CLOUD SYNC
    {
      title: 'Arsitektur Hybrid SQLite & Google Cloud Firestore',
      subtitle: 'Sistem Sinkronisasi Data Realtime dan Kemampuan Akses Tanpa Sinyal Internet',
      category: 'PANDUAN 8: TEKNOLOGI & SYNC',
      bgGradient: 'from-slate-900 via-indigo-950 to-slate-900',
      content: (
        <div className="space-y-3 py-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 space-y-2">
              <div className="flex items-center gap-2 text-emerald-300 font-black text-xs">
                <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>SQLite Database Lokal (WASM)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Menyimpan data langsung di browser perangkat. Pencarian nama/NIK terasa kilat (0.01 detik) dan tetap dapat dipakai saat mati listrik atau tidak ada internet.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-black text-xs">
                <RefreshCw className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Google Cloud Firestore Server</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Menyimpan cadangan data online. Pengurus dapat menekan tombol &quot;Tarik Data Cloud&quot; kapan saja untuk menyelaraskan data antar perangkat laptop/HP pengurus.
              </p>
            </div>
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-xs text-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Keamanan: Proteksi Sesi Logout Otomatis 10 Menit tanpa Aktivitas</span>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md font-bold">Terproteksi</span>
          </div>
        </div>
      )
    },

    // SLIDE 10: RANGKUMAN & KESIMPULAN
    {
      title: 'Rangkuman & Kesimpulan Pelayanan Umat',
      subtitle: 'Komitmen Pelayanan Umat Lingkungan St. Maria Magdalena Kediri',
      category: 'DOKUMENTASI & PENUTUP',
      bgGradient: 'from-amber-900 via-rose-950 to-slate-900',
      content: (
        <div className="flex flex-col items-center justify-between text-center h-full space-y-3 py-1">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs sm:text-sm font-medium max-w-2xl leading-relaxed">
            &quot;Melayani Tuhan melalui kerapian administrasi dan kemudahan akses warta bagi seluruh keluarga umat.&quot;
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-3xl text-left text-xs">
            <div className="bg-white/10 p-3 rounded-xl border border-white/15 space-y-1">
              <span className="font-extrabold text-amber-300">1. Efisiensi Tinggi</span>
              <p className="text-slate-300 text-[11px]">Pencarian NIK, KK, dan cetak dokumen PDF selesai dalam hitungan detik.</p>
            </div>
            <div className="bg-white/10 p-3 rounded-xl border border-white/15 space-y-1">
              <span className="font-extrabold text-amber-300">2. Warta Transparansi</span>
              <p className="text-slate-300 text-[11px]">Pengumuman misa dan poster flyer langsung sampai ke layar smartphone warga.</p>
            </div>
            <div className="bg-white/10 p-3 rounded-xl border border-white/15 space-y-1">
              <span className="font-extrabold text-amber-300">3. Keamanan Data</span>
              <p className="text-slate-300 text-[11px]">Pemisahan hak akses role warga dan pengurus terenkripsi dengan aman.</p>
            </div>
          </div>

          <div className="pt-1">
            <h3 className="text-base sm:text-lg font-black text-amber-300">Terima Kasih - Berkah Dalem</h3>
            <p className="text-[11px] text-slate-300">Paroki St. Vincentius a Paulo Kediri • Lingkungan St. Maria Magdalena</p>
          </div>
        </div>
      )
    }
  ];

  const current = slides[currentSlide];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev < slides.length - 1 ? prev + 1 : prev));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleDownloadPptx = async () => {
    setIsGeneratingPpt(true);
    try {
      await generateSapaPresentation();
      addToast('File Presentasi PowerPoint (.pptx) berhasil diunduh!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Gagal mengunduh file PPT.', 'error');
    } finally {
      setIsGeneratingPpt(false);
    }
  };

  const handlePrintSlide = () => {
    window.print();
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-3 sm:p-5 transition-all duration-300 ${
        isFullscreen ? 'p-0' : ''
      }`}
    >
      {/* Top Bar Controls */}
      <div className="flex items-center justify-between text-white bg-slate-900/90 px-4 py-2.5 rounded-2xl border border-white/10 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          <Presentation className="w-5 h-5 text-amber-400" />
          <span className="font-black text-xs sm:text-sm">Presentasi PPT Panduan SAPA Lingkungan</span>
          <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
            Slide {currentSlide + 1} / {slides.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPptx}
            disabled={isGeneratingPpt}
            className="px-3.5 py-2 bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-700 hover:to-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-95 border border-orange-400/30"
            title="Unduh File PowerPoint (.pptx)"
          >
            <Download className={`w-4 h-4 ${isGeneratingPpt ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">
              {isGeneratingPpt ? 'Mempersiapkan PPT...' : 'Unduh File PPT (.pptx)'}
            </span>
          </button>

          <button
            type="button"
            onClick={handlePrintSlide}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl cursor-pointer"
            title="Cetak Slide / Save as PDF"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl cursor-pointer"
            title="Full Screen Slide Mode"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl cursor-pointer"
            title="Tutup Presentasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slide Canvas Area */}
      <div className="flex-1 my-2 sm:my-3 flex items-center justify-center overflow-hidden min-h-0">
        <div
          className={`w-full max-w-5xl h-full sm:max-h-[85vh] aspect-16/9 bg-gradient-to-br ${current.bgGradient} rounded-2xl sm:rounded-3xl p-4 sm:p-8 text-white shadow-2xl border border-white/20 flex flex-col justify-between relative overflow-hidden transition-all duration-300`}
        >
          {/* Header of current slide */}
          <div className="flex items-center justify-between border-b border-white/15 pb-2.5 shrink-0">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                {current.category}
              </span>
              <h2 className="text-sm sm:text-xl font-black text-white">{current.title}</h2>
              <p className="text-[10px] sm:text-xs text-slate-300">{current.subtitle}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 text-xs font-black shrink-0">
              {currentSlide + 1}
            </div>
          </div>

          {/* Main Slide Content */}
          <div className="flex-1 py-2 sm:py-3 overflow-y-auto min-h-0">{current.content}</div>

          {/* Footer of current slide */}
          <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-semibold shrink-0">
            <span>SAPA Lingkungan St. Maria Magdalena Kediri</span>
            <span>Gunakan Navigasi [←] [→] atau Tombol di Bawah</span>
          </div>
        </div>
      </div>

      {/* Bottom Navigation & Thumbnails */}
      <div className="bg-slate-900/90 px-4 py-2.5 rounded-2xl border border-white/10 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
        {/* Slide Selector Thumbnails */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {slides.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-xs whitespace-nowrap transition-all cursor-pointer ${
                currentSlide === idx
                  ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-md font-black scale-105 border border-orange-300/40'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              Slide {idx + 1}
            </button>
          ))}
        </div>

        {/* Prev / Next Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Sebelumnya</span>
          </button>

          <span className="text-xs font-black text-amber-300 px-1.5">
            {currentSlide + 1} / {slides.length}
          </span>

          <button
            type="button"
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-black text-xs rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-md active:scale-95 transition-all border border-orange-400/30"
          >
            <span>Selanjutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
