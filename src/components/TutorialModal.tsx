import React, { useState } from 'react';
import {
  X,
  BookOpen,
  User,
  ShieldCheck,
  Search,
  Printer,
  FileText,
  Database,
  RefreshCw,
  Presentation,
  KeyRound,
  BarChart3,
  Package,
  Sparkles,
  Lock,
  ChevronRight,
  Info,
  Download
} from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPresentation?: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose, onOpenPresentation }) => {
  const [activeTab, setActiveTab] = useState<'akses' | 'warga' | 'pengurus' | 'fitur'>('akses');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-red-700 via-orange-600 to-red-600 px-5 py-4 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-2xl border border-white/30 backdrop-blur-md">
              <BookOpen className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-lg sm:text-xl leading-tight">Panduan & Tutorial Penggunaan</h2>
                <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-md uppercase tracking-wider">
                  Lengkap (PPT)
                </span>
              </div>
              <p className="text-xs text-orange-100">
                SAPA Lingkungan St. Maria Magdalena • Paroki St. Vincentius a Paulo Kediri
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenPresentation && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPresentation();
                }}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                title="Buka Slide Presentasi PPT Panduan"
              >
                <Presentation className="w-4 h-4 text-orange-950" />
                <span className="hidden sm:inline">Mode Slide PPT</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              title="Tutup Panduan"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex items-center gap-1 sm:gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('akses')}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'akses'
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md font-extrabold'
                : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>1. Login & Hak Akses</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('warga')}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'warga'
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md font-extrabold'
                : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            <User className="w-4 h-4 text-blue-500" />
            <span>2. Panduan Warga (Umat)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pengurus')}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pengurus'
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md font-extrabold'
                : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>3. Panduan Pengurus</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fitur')}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'fitur'
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md font-extrabold'
                : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>4. Fitur Spesial & Sync</span>
          </button>
        </div>

        {/* Top Banner Slide Presentation Prompt */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-3 px-5 text-slate-950 font-bold text-xs flex items-center justify-between gap-2 border-b border-amber-400">
          <div className="flex items-center gap-2">
            <Presentation className="w-5 h-5 shrink-0 text-slate-950" />
            <span>Seluruh panduan ini telah disatukan dalam Slide Deck Presentasi PPT (10 Slide)!</span>
          </div>
          {onOpenPresentation && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPresentation();
              }}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-amber-300 font-black text-xs rounded-xl shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Lihat PPT Interactive</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body Content */}
        <div className="p-5 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
          
          {/* TAB 1: LOGIN & AKUN */}
          {activeTab === 'akses' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-extrabold text-orange-950 text-sm">Sistem Login Bertingkat (Role-Based Access)</h3>
                  <p className="text-orange-800 text-xs mt-1">
                    Aplikasi SAPA Lingkungan menggunakan 2 tingkat hak akses demi keamanan data umat dan kemudahan pengurus.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Warga Box */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-blue-700 font-extrabold text-sm">
                    <User className="w-4 h-4" />
                    <span>Akun Default Warga / Umat</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1 font-mono">
                    <div><span className="text-slate-400">Username:</span> <strong className="text-slate-900">warga</strong></div>
                    <div><span className="text-slate-400">Password:</span> <strong className="text-slate-900">warga123</strong></div>
                  </div>
                  <p className="text-xs text-slate-600">
                    Akses bersifat <strong>Read-Only</strong>: Membaca Warta Paroki, flyer kegiatan, mencari data KK sendiri, mencetak Kartu Keluarga Digital, dan mengajukan surat ke pengurus.
                  </p>
                </div>

                {/* Pengurus Box */}
                <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-extrabold text-sm">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Akun Default Pengurus Lingkungan</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1 font-mono">
                    <div><span className="text-slate-400">Username:</span> <strong className="text-slate-900">pengurus</strong></div>
                    <div><span className="text-slate-400">Password:</span> <strong className="text-slate-900">pengurus123</strong></div>
                  </div>
                  <p className="text-xs text-slate-600">
                    Akses <strong>Penuh (Admin)</strong>: Tambah/Edit/Hapus KK & Warga, posting flyer warta, kelola inventaris, lihat grafik statistik, dan sinkronisasi Cloud Firestore.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Langkah-Langkah Login:</h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 text-xs pl-1">
                  <li>Buka aplikasi web SAPA Lingkungan St. Maria Magdalena.</li>
                  <li>Masukkan <strong>Username</strong> dan <strong>Password</strong> sesuai hak akses Anda.</li>
                  <li>Klik tombol <strong className="text-orange-600">Masuk Aplikasi</strong>.</li>
                  <li>Untuk mengganti password, klik tombol <strong>Ubah Password</strong> di pojok kanan atas setelah login.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: PANDUAN WARGA */}
          {activeTab === 'warga' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-l-4 border-blue-500 pl-3 py-1">
                <h3 className="font-extrabold text-slate-900 text-sm">Panduan Penggunaan Akses Warga / Umat</h3>
                <p className="text-xs text-slate-500">Membantu umat mengakses informasi paroki dan dokumen keluarga mandiri.</p>
              </div>

              <div className="space-y-4">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <BookOpen className="w-4 h-4 text-orange-600" />
                    <span>A. Membaca Beranda Warta & Poster Flyer</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1 pl-6 list-disc">
                    <li>Di halaman utama Warga, Anda dapat melihat pengumuman jadwal Misa, kegiatan doa lingkungan, dan warta paroki terbaru.</li>
                    <li>Klik pada gambar <strong>Poster / Flyer</strong> untuk memperbesar tampilan (pop-up image viewer).</li>
                  </ul>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Search className="w-4 h-4 text-blue-600" />
                    <span>B. Pencarian Kartu Keluarga & Anggota Keluarga</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1 pl-6 list-disc">
                    <li>Ketikkan <strong>Nomor KK, Nama Kepala Keluarga, NIK, atau Nama Anggota</strong> di kotak pencarian.</li>
                    <li>Sistem akan mencari secara instan data keluarga Anda dari database lokal.</li>
                    <li>Klik tombol <strong>Detail Keluarga</strong> untuk melihat status penerimaan 7 Sakramen (Baptis, Krisma, Ekaristi, dll).</li>
                  </ul>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Printer className="w-4 h-4 text-emerald-600" />
                    <span>C. Mencetak Kartu Keluarga Digital (PDF)</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1 pl-6 list-disc">
                    <li>Buka detail Kartu Keluarga Anda, lalu klik tombol <strong>Cetak Kartu Keluarga (PDF)</strong>.</li>
                    <li>Sistem akan membuat berkas PDF standar resmi Kartu Keluarga Lingkungan St. Maria Magdalena Kediri yang tersusun rapi tanpa terpotong.</li>
                    <li>File PDF dapat disimpan atau dicetak langsung untuk keperluan pendaftaran sakramen paroki.</li>
                  </ul>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>D. Pengajuan Surat / Layanan Umat</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1 pl-6 list-disc">
                    <li>Gunakan formulir pengajuan layanan di bagian bawah dashboard Warga untuk mengajukan permohonan Surat Pengantar Baptis/Krisma, Doa Pengandutan/Meninggal, atau update data KK.</li>
                    <li>Pengurus lingkungan akan menerima notifikasi pengajuan Anda.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PANDUAN PENGURUS */}
          {activeTab === 'pengurus' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-l-4 border-amber-500 pl-3 py-1">
                <h3 className="font-extrabold text-slate-900 text-sm">Panduan Penggunaan Akses Pengurus Lingkungan</h3>
                <p className="text-xs text-slate-500">Akses lengkap untuk pengelolaan data KK, Warta, Inventaris, dan Laporan.</p>
              </div>

              <div className="space-y-4">
                <div className="p-3.5 bg-amber-50/40 rounded-2xl border border-amber-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>1. Kelola Data Kartu Keluarga & Anggota Umat</span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1 pl-6 list-disc">
                    <li><strong>Tambah KK Baru:</strong> Klik tombol <strong className="text-orange-600">+ Tambah KK Baru</strong>, isi nomor KK, nama kepala keluarga, alamat RT/RW, dan data anggota keluarga.</li>
                    <li><strong>Edit Data & Sakramen:</strong> Klik tombol edit pada KK atau anggota keluarga untuk mengubah data NIK, tempat/tgl lahir, dan checklist 7 Sakramen Gereja.</li>
                    <li><strong>Hapus KK:</strong> Pengurus dapat menghapus record KK yang sudah pindah paroki/lingkungan.</li>
                  </ul>
                </div>

                <div className="p-3.5 bg-amber-50/40 rounded-2xl border border-amber-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <BookOpen className="w-4 h-4 text-orange-600" />
                    <span>2. Publikasi Warta & Upload Flyer Gambar</span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1 pl-6 list-disc">
                    <li>Pengurus dapat menerbitkan pengumuman kegiatan, jadwal Misa, dan katekese lingkungan.</li>
                    <li>Sistem mendukung <strong>Upload Poster Flyer Gambar</strong> (dengan kompresi otomatis) yang langsung tampil cantik di halaman Warga.</li>
                  </ul>
                </div>

                <div className="p-3.5 bg-amber-50/40 rounded-2xl border border-amber-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <Package className="w-4 h-4 text-indigo-600" />
                    <span>3. Pendataan Inventaris Barang Lingkungan</span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1 pl-6 list-disc">
                    <li>Catat perlengkapan ibadat (salib, lilin, taplak altar, sound system Portable, piala, dll).</li>
                    <li>Pantau jumlah, kondisi barang (Baik/Rusak), dan lokasi penyimpanan.</li>
                  </ul>
                </div>

                <div className="p-3.5 bg-amber-50/40 rounded-2xl border border-amber-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    <span>4. Laporan Statistik Demografi Umat</span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1 pl-6 list-disc">
                    <li>Lihat grafik otomatis distribusi kelompok umur (Anak, Remaja, Orang Tua, Lansia).</li>
                    <li>Statistik jumlah penerima Sakramen Baptis, Krisma, Pernikahan, serta distribusi jumlah KK per RT.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FITUR SPESIAL */}
          {activeTab === 'fitur' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-l-4 border-orange-500 pl-3 py-1">
                <h3 className="font-extrabold text-slate-900 text-sm">Fitur Khusus: Sinkronisasi, Presentasi & Keamanan</h3>
                <p className="text-xs text-slate-500">Teknologi hybrid offline-online dan perlindungan data.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-orange-600">
                    <RefreshCw className="w-4 h-4" />
                    <span>Sinkronisasi Google Cloud Firestore</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Setiap perubahan data disinkronkan secara real-time ke Cloud Firestore server. Pengurus juga dapat menekan tombol <strong>Tarik Data Cloud</strong> untuk memperbarui data di perangkat lokal.
                  </p>
                </div>

                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <Presentation className="w-4 h-4 text-orange-600" />
                    <span>Export Slide Presentasi PPT</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Tersedia modul slide deck presentasi interaktif dan tombol <strong>Unduh File PPT (.pptx)</strong> standar 16:9 widescreen untuk rapat pengurus paroki/lingkungan.
                  </p>
                  {onOpenPresentation && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenPresentation();
                      }}
                      className="mt-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Buka Slide Presentasi Sekarang</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-blue-600">
                    <Database className="w-4 h-4" />
                    <span>Mesin Database SQLite WASM</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Aplikasi berjalan sangat cepat di browser tanpa tergantung kecepatan sinyal internet. Seluruh data tersimpan aman di database lokal browser.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-600">
                    <Lock className="w-4 h-4" />
                    <span>Proteksi Otomatis Sesi 10 Menit</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Demi keamanan data pribadi warga, sistem akan melakukan logout otomatis jika aplikasi ditinggalkan tanpa aktivitas selama 10 menit.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Modal */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            Paroki St. Vincentius a Paulo Kediri • Lingkungan St. Maria Magdalena
          </span>

          <div className="flex items-center gap-2">
            {onOpenPresentation && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPresentation();
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-700 hover:to-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Presentation className="w-4 h-4" />
                <span>Buka Slide PPT Interaktif</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
            >
              Tutup Panduan
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
