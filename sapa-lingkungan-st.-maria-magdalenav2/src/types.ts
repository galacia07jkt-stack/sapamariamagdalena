export type UserRole = 'warga' | 'pengurus';

export interface UserAccount {
  id: string;
  username: string;
  role: UserRole;
  passwordHash: string;
  namaLengkap: string;
  noKK?: string;
}

export type StatusWarga = 'Aktif' | 'Pindah Wilayah' | 'Meninggal Dunia' | 'Non-Aktif / Pasif';

export interface KepalaKeluarga {
  id: string; // UUID or string
  no_kk: string;
  nama_kepala_keluarga: string; // Auto uppercase
  alamat: string;
  rt: string;
  rw: string;
  wilayah: string; // Default: Wilayah Timur St. Maria Magdalena
  status_warga: StatusWarga;
  agama_kk: string;
  kartu_biru_paroki?: {
    memiliki: boolean;
    no_kartu?: string;
  };
  kartu_merah_lingkungan?: {
    memiliki: boolean;
    no_kartu?: string;
  };
  created_at: string;
  updated_at: string;
  created_by_user?: string;
}

export interface SakramenBaptis {
  nama_baptis?: string;
  no_surat_baptis?: string;
  tgl_baptis?: string;
  tempat_baptis?: string;
}

export interface SakramenKomuniPertama {
  no_surat_komper?: string;
  tgl_komuni_pertama?: string;
  tempat_komuni_pertama?: string;
}

export interface SakramenKrisma {
  nama_krisma?: string;
  no_surat_krisma?: string;
  tgl_krisma?: string;
  tempat_krisma?: string;
}

export interface SakramenPerkawinan {
  no_surat_perkawinan?: string;
  tgl_perkawinan?: string;
  tempat_perkawinan?: string;
  is_dispensasi?: boolean;
  no_surat_dispensasi?: string;
  tgl_dispensasi?: string;
  tempat_dispensasi?: string;
}

export interface AnggotaKeluarga {
  id: string;
  id_keluarga: string; // ref to KK id
  no_kk: string;
  nik: string; // Auto generated locked: [no_kk]-01, [no_kk]-02
  nama_lengkap: string; // Auto uppercase
  nama_panggilan?: string; // Auto uppercase
  jenis_kelamin: 'Laki-laki' | 'Perempuan';
  tempat_lahir: string;
  tanggal_lahir: string;
  usia?: number; // Calculated dynamically
  golongan_darah: 'A' | 'B' | 'AB' | 'O' | 'Belum Tahu';
  hub_keluarga: 'Kepala Keluarga' | 'Suami' | 'Istri' | 'Anak' | 'Orang Tua / Ibu' | 'Orang Tua / Bapak' | 'Mertua' | 'Keponakan / Famili Lain' | string;
  status_perkawinan?: 'Belum Menikah (Single)' | 'Menikah' | 'Menikah (Katolik)' | 'Menikah (Beda Agama)' | 'Menikah (Sipil)' | 'Cerai Mati (Duda / Janda)' | 'Cerai Hidup' | string;
  no_hp?: string;
  
  // Pendidikan
  pendidikan_terakhir: string;
  masih_sekolah: boolean;
  nama_sekolah?: string;
  alamat_sekolah?: string;

  // Pekerjaan
  pekerjaan: string;
  nama_perusahaan?: string;
  alamat_perusahaan?: string;

  // Agama & Sakramen
  agama: string;
  baptis?: SakramenBaptis;
  komuni_pertama?: SakramenKomuniPertama;
  krisma?: SakramenKrisma;
  perkawinan?: SakramenPerkawinan;

  created_at: string;
  updated_at: string;
}

export interface Inventaris {
  id: string;
  no_urut: number;
  nama_barang: string;
  jumlah: number;
  satuan?: string;
  tempat_penyimpanan: string;
  kondisi: 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
  keterangan?: string;
  updated_at: string;
}

export interface IuranKartuMerah {
  id: string;
  no_kk: string;
  nama_kk: string;
  tanggal_bayar: string;
  hari: string;
  bulan: string;
  tahun: string;
  jumlah_iuran: number;
  jenis_iuran: 'Kas Lingkungan' | 'Iuran Duka' | 'Paskah & Natal' | 'Sukarela';
  catatan?: string;
  diinput_oleh: string;
  created_at: string;
}

export interface PelayananLingkungan {
  id: string;
  kategori: 'Seksi Liturgi' | 'Asisten Imam' | 'Misdinar' | 'Pengurus Lingkungan' | 'Ketua Lingkungan' | 'Sekretaris' | 'Bendahara' | 'Seksi Humas' | 'Seksi Diakonia' | 'Lainnya';
  nama_petugas: string;
  jabatan_tugas: string;
  no_hp?: string;
  periode?: string;
  keterangan?: string;
}

export interface JadwalKegiatan {
  id: string;
  judul_kegiatan: string;
  kategori: 'Pengumuman / Flyer Warga' | 'Pengumuman Penting' | 'Doa Lingkungan' | 'Ibadat Sabda' | 'Misa Lingkungan' | 'Rapat Pengurus' | 'Kerja Bakti' | 'Perayaan Sektor/Paroki' | 'Lainnya' | string;
  tanggal: string;
  waktu: string;
  lokasi: string;
  keterangan?: string;
  foto_base64?: string; // Compressed lightweight photo or flyer image
  created_at: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export const LIST_16_WILAYAH = [
  'Stasi Gereja Gringging',
  'Stasi Gereja Puhsarang',
  'Wilayah Utara St. Teresia Avila - Mojoroto Utara',
  'Wilayah Utara St. Markus - Mrican',
  'St. Maria - Mojoroto Selatan',
  'St. Ignatius - Dermo',
  'St. Benediktus - Ngampel',
  'St. Augustinus - Mojoroto Tengah',
  'Wilayah Timur St. Monica - Brawijaya',
  'St. Maria Magdalena - Semampir',
  'St. Kristoforus - Jongbiru',
  'St. Giovanni - Diponegoro',
  'Wilayah Selatan St. Yusuf - Bandar Barat',
  'St. Yosef - Sukorame Utara',
  'Wilayah Selatan St. Yoh. Pemandi - Bujel',
  'Wilayah Selatan St. Helena - Wilis Indah',
  'St. F. Xaverius - Bandar',
  'St. Andreas - Sukorame Selatan'
];
