import React, { useState } from 'react';
import { X, Printer, ShieldCheck, CheckCircle2, UserPlus } from 'lucide-react';
import { WargaKatolik } from '../types';
import { SapaLogo } from './SapaLogo';

interface BuktiRegistrasiModalProps {
  warga: WargaKatolik | null;
  isOpen: boolean;
  onClose: () => void;
  mode?: 'registration' | 'admin';
}

export const BuktiRegistrasiModal: React.FC<BuktiRegistrasiModalProps> = ({
  warga,
  isOpen,
  onClose,
  mode = 'registration',
}) => {
  const [showThankYou, setShowThankYou] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setShowThankYou(false);
    }
  }, [isOpen, warga?.id]);

  if (!isOpen || !warga) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleFinishAndReturn = () => {
    setShowThankYou(true);
  };

  const handleDismissAll = () => {
    setShowThankYou(false);
    onClose();
  };

  const formattedDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const isRegistrationMode = mode === 'registration';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto print:p-0 print:bg-white">
      
      {/* SCREEN 1: MODAL TERIMA KASIH DENGAN FOTO ROMO 2 TANGAN DI DADA & PESAN RESMI */}
      {showThankYou ? (
        <div className="bg-white rounded-3xl border-2 border-orange-500 shadow-2xl max-w-lg w-full my-auto overflow-hidden animate-fade-in p-5 sm:p-7 flex flex-col items-center text-center">
          
          {/* Header with Official Logo SAPA */}
          <div className="flex items-center justify-center gap-2.5 mb-2.5">
            <div className="w-12 h-12 rounded-xl bg-white p-0.5 border-2 border-orange-400 overflow-hidden shadow-xs flex items-center justify-center">
              <img
                src="/logo-sapa.png"
                alt="Logo SAPA"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-left">
              <h4 className="font-black text-xs sm:text-sm text-sky-950 uppercase tracking-wide leading-tight">
                SAPA St. Maria Magdalena Semampir
              </h4>
              <p className="text-[10px] sm:text-xs text-orange-700 font-bold">
                Paroki St. Vincentius a Paulo Kediri
              </p>
            </div>
          </div>

          {/* Romo dengan 2 Tangan di Dada (Salam Berkah Dalem & Berkat) */}
          <div className="relative my-2 w-48 sm:w-56 h-60 sm:h-72 rounded-2xl overflow-hidden border-2 border-orange-300 shadow-md bg-white flex items-center justify-center">
            <img
              src="/romo-berkah-dalem.jpg"
              alt="Romo Salam Berkah Dalem 2 Tangan di Dada"
              className="w-full h-full object-contain object-top"
            />
          </div>

          {/* Pesan Sesuai Permintaan Pengguna */}
          <div className="my-3 w-full bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 p-4 rounded-2xl border-2 border-orange-400 shadow-xs">
            <p className="text-xs sm:text-sm font-black text-sky-950 uppercase tracking-wide leading-relaxed">
              "TERIMA KASIH Dukungan Regristrasi data Lingkungan St. Maria Magdalena, Tuhan Memberkati, Berkah Dalem"
            </p>
          </div>

          {/* Ringkasan Data Warga yang Baru Terdaftar */}
          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 mb-4 text-left space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Nama Lengkap:</span>
              <span className="font-extrabold text-sky-950 text-right">{warga.namaLengkap}</span>
            </div>
            {warga.namaBaptis && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Nama Baptis:</span>
                <span className="font-bold text-orange-700 text-right">{warga.namaBaptis}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Wilayah RT/RW:</span>
              <span className="font-semibold text-slate-800 text-right">{warga.rtRw} Semampir</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">No. Registrasi:</span>
              <span className="font-mono text-slate-600 text-right text-[11px]">{warga.id}</span>
            </div>
          </div>

          {/* Tombol Selesai & Kembali ke Form Pendataan Warga */}
          <button
            type="button"
            onClick={handleDismissAll}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg border border-orange-600 flex items-center justify-center gap-2 transition active:scale-98 min-h-[48px] cursor-pointer"
          >
            <UserPlus className="w-5 h-5" />
            <span>Kembali ke Form Pendataan Warga</span>
          </button>
        </div>
      ) : (
        /* SCREEN 2: BUKTI REGISTRASI JEMAAT KATOLIK */
        <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-orange-500 shadow-2xl max-w-2xl w-full my-auto overflow-hidden print:border-none print:shadow-none print:m-0 print:max-w-none max-h-[92vh] flex flex-col">
          
          {/* Modal Header Bar */}
          <div className="print:hidden bg-sky-950 text-white p-3.5 sm:p-4 flex items-center justify-between border-b-2 border-orange-500 shrink-0">
            <div className="flex items-center gap-2">
              <SapaLogo size="xs" />
              <span className="font-bold text-xs sm:text-sm">Bukti Registrasi Jemaat Katolik</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* JIKA MODE REGISTRASI: GANTI BUTTON CETAK DENGAN 'SELESAI & KEMBALI KE FORM PENDATAAN WARGA' */}
              {isRegistrationMode ? (
                <button
                  type="button"
                  onClick={handleFinishAndReturn}
                  className="px-3 sm:px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md border border-orange-400 flex items-center gap-1.5 transition active:scale-95 min-h-[38px] cursor-pointer"
                  title="Selesai dan kembali ke form pendataan warga"
                >
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  <span className="hidden sm:inline">Selesai & Kembali ke Form Pendataan Warga</span>
                  <span className="sm:hidden">Selesai & Kembali</span>
                </button>
              ) : (
                /* JIKA MODE ADMIN: TAMPILKAN BUTTON CETAK / PDF KHUSUS AKSES ADMIN */
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition min-h-[36px] cursor-pointer"
                  title="Cetak Bukti (Khusus Akses Admin)"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / PDF</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (isRegistrationMode) {
                    handleFinishAndReturn();
                  } else {
                    onClose();
                  }
                }}
                className="p-1.5 text-sky-200 hover:text-white rounded-lg hover:bg-white/10 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Certificate Content */}
          <div className="p-4 sm:p-8 bg-white border-4 sm:border-8 border-double border-orange-400 m-2 sm:m-3 rounded-xl sm:rounded-2xl relative overflow-y-auto">
            
            {/* Letterhead Kop Surat */}
            <div className="text-center pb-3 sm:pb-4 border-b-2 border-sky-950">
              <div className="flex items-center justify-center gap-3 mb-1">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-0.5 border border-orange-400 overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src="/logo-sapa.png"
                    alt="Logo SAPA"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-left">
                  <h3 className="font-black text-xs sm:text-base tracking-wide text-sky-950 uppercase">
                    Paroki St. Vincentius a Paulo Kediri
                  </h3>
                  <h4 className="font-extrabold text-[11px] sm:text-xs tracking-wider text-orange-700 uppercase">
                    Lingkungan St. Maria Magdalena — Semampir
                  </h4>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 italic mt-0.5">
                    Sekretariat: Kelurahan Semampir, Kota Kediri, Jawa Timur — Keuskupan Surabaya
                  </p>
                </div>
              </div>
            </div>

            {/* Certificate Title */}
            <div className="text-center my-3 sm:my-4">
              <div className="inline-block bg-sky-50 border border-sky-300 text-sky-950 font-extrabold text-[11px] sm:text-xs px-3 sm:px-4 py-1 rounded-full uppercase tracking-wider">
                Surat Bukti Pendataan Warga Katolik (SAPA)
              </div>
              <div className="text-[10px] sm:text-[11px] font-mono text-slate-500 mt-1">
                No. Register: <span className="font-bold text-orange-800">{warga.id}</span>
              </div>
            </div>

            {/* Citizen Details Table */}
            <div className="space-y-2 text-xs text-slate-800 my-4 sm:my-5 bg-slate-50/70 p-3 sm:p-4 rounded-xl border border-slate-200">
              <div className="grid grid-cols-3 py-1 border-b border-slate-200 gap-1">
                <span className="text-slate-500 font-semibold">Agama:</span>
                <span className="col-span-2 font-bold text-sky-950">{warga.agama || 'Katolik'}</span>
              </div>

              {(warga.agama || 'Katolik') === 'Katolik' && (
                <div className="grid grid-cols-3 py-1 border-b border-slate-200 gap-1">
                  <span className="text-slate-500 font-semibold">Nama Baptis:</span>
                  <span className="col-span-2 font-bold text-orange-700 text-xs sm:text-sm">{warga.namaBaptis || '-'}</span>
                </div>
              )}

              <div className="grid grid-cols-3 py-1 border-b border-slate-200 gap-1">
                <span className="text-slate-500 font-semibold">Nama Lengkap:</span>
                <span className="col-span-2 font-extrabold text-sky-950 text-xs sm:text-sm">{warga.namaLengkap}</span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-slate-200 gap-1">
                <span className="text-slate-500 font-semibold">NIK (KTP):</span>
                <span className="col-span-2 font-mono font-semibold">{warga.nik}</span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-slate-200 gap-1">
                <span className="text-slate-500 font-semibold">Nomor Kartu Keluarga:</span>
                <span className="col-span-2 font-mono font-semibold">{warga.noKk}</span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-slate-200 gap-1">
                <span className="text-slate-500 font-semibold">Hubungan Keluarga:</span>
                <span className="col-span-2 font-medium">{warga.hubunganKeluarga} ({warga.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'})</span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-slate-200 gap-1">
                <span className="text-slate-500 font-semibold">Alamat Domisili:</span>
                <span className="col-span-2 font-medium">{warga.alamatDomisili} ({warga.rtRw} Semampir)</span>
              </div>

              {(warga.agama || 'Katolik') === 'Katolik' ? (
                <>
                  <div className="grid grid-cols-3 py-1 border-b border-slate-200 gap-1">
                    <span className="text-slate-500 font-semibold">Tempat Baptis:</span>
                    <span className="col-span-2 font-medium">{warga.tempatBaptis || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 py-1 border-b border-slate-200 gap-1">
                    <span className="text-slate-500 font-semibold">Paroki / Kota:</span>
                    <span className="col-span-2 font-medium">{warga.parokiKotaBaptis || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 py-1 border-b border-slate-200 gap-1">
                    <span className="text-slate-500 font-semibold">No. Akta Baptis:</span>
                    <span className="col-span-2 font-mono font-bold text-orange-800">{warga.noSuratBaptis || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 py-1 border-b border-slate-200 gap-1">
                    <span className="text-slate-500 font-semibold">Tanggal Baptis:</span>
                    <span className="col-span-2 font-medium font-mono">{warga.tanggalBaptis || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 py-1 gap-1">
                    <span className="text-slate-500 font-semibold">Status Sakramen:</span>
                    <span className="col-span-2 font-medium">
                      Komuni: {warga.sakramenLain?.komuniPertama ? 'Sudah' : 'Belum'} • Krisma: {warga.sakramenLain?.krisma ? 'Sudah' : 'Belum'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-3 py-1 gap-1">
                  <span className="text-slate-500 font-semibold">Tgl Lahir:</span>
                  <span className="col-span-2 font-mono font-medium">{warga.tanggalLahir || '-'}</span>
                </div>
              )}
            </div>

            {/* Security & Sign Off */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between pt-3 sm:pt-4 border-t-2 border-slate-200 gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-emerald-800 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Terverifikasi Database SAPA Paroki</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  Enkripsi SHA-256 • ID: {warga.id.slice(0, 16)}
                </p>
              </div>

              <div className="text-center w-48 text-xs">
                <p className="text-[11px] text-slate-600">Kediri, {formattedDate}</p>
                <p className="font-bold text-slate-800 mt-0.5">Pengurus Lingkungan</p>
                <p className="font-semibold text-slate-700">St. Maria Magdalena</p>
                <div className="h-12 flex items-center justify-center">
                  <span className="text-[10px] text-slate-400 italic">( Tanda Tangan & Cap )</span>
                </div>
                <p className="font-bold text-slate-900 border-t border-slate-400 pt-0.5 text-[11px]">
                  Ketua / Sekretaris
                </p>
              </div>
            </div>

            {/* Tombol Besar Selesai & Kembali ke Form Pendataan di Bagian Bawah Kartu */}
            {isRegistrationMode && (
              <div className="print:hidden mt-5 pt-4 border-t-2 border-orange-200">
                <button
                  type="button"
                  onClick={handleFinishAndReturn}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-md border border-orange-600 flex items-center justify-center gap-2 transition active:scale-98 min-h-[46px] cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span>Selesai & Kembali ke Form Pendataan Warga</span>
                </button>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
