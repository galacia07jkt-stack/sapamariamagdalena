export type AgamaType = 
  | 'Katolik' 
  | 'Islam' 
  | 'Hindu' 
  | 'Buddha' 
  | 'Protestan' 
  | 'Kristen Protestan' 
  | 'Kepercayaan';

export interface WargaKatolik {
  id: string;
  noKk: string; // 16 digit Nomor Kartu Keluarga
  nik: string; // 16 digit NIK Kependudukan
  namaLengkap: string; // Nama lengkap KTP (HURUF KAPITAL)
  agama: AgamaType; // Katolik, Islam, Hindu, Buddha, Protestan, Kepercayaan
  namaBaptis: string; // Nama Baptis Santo/Santa pelindung (jika Katolik)
  jenisKelamin: 'L' | 'P';
  tempatLahir: string;
  tanggalLahir: string; // DD/MM/YYYY
  alamatDomisili: string; // Alamat di Semampir Kota Kediri
  rtRw: string; // Contoh: RT 02 / RW 01
  tempatBaptis?: string; // Gereja / Tempat baptis
  parokiKotaBaptis?: string; // Paroki / Kota pembaptisan (misal: St. Vincentius a Paulo Kediri)
  tanggalBaptis?: string; // DD/MM/YYYY
  noSuratBaptis?: string; // Nomor akta/surat baptis di buku permandian
  hubunganKeluarga: 'Kepala Keluarga' | 'Istri' | 'Anak' | 'Orang Tua' | 'Famili Lain';
  statusPerkawinan: 'Belum Menikah' | 'Menikah Katolik' | 'Menikah Campur' | 'Janda/Duda';
  sakramenLain?: {
    komuniPertama: boolean;
    krisma: boolean;
    pernikahan: boolean;
  };
  noHpWhatsapp: string;
  pekerjaan?: string;
  pendidikan?: string;
  statusVerifikasi: 'Terverifikasi' | 'Menunggu Verifikasi' | 'Perlu Perbaikan';
  catatanKhusus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatistikParoki {
  totalJiwa: number;
  totalKk: number;
  totalKatolik: number;
  totalNonKatolik: number;
  totalLakiLaki: number;
  totalPerempuan: number;
  totalBaptis: number;
  totalKomuni: number;
  totalKrisma: number;
  totalNikahKatolik: number;
  kelompokUsia: {
    biak: number; // 0-12
    rekat: number; // 13-17
    omk: number; // 18-35
    dewasa: number; // 36-59
    lansia: number; // 60+
  };
  distribusiRt: { [rt: string]: number };
  distribusiAgama: { [agama: string]: number };
}
