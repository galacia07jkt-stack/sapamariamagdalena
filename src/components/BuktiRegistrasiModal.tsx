import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  CheckCircle2, 
  UserPlus, 
  MessageSquare, 
  QrCode, 
  Copy, 
  Check, 
  Share2 
} from 'lucide-react';
import { WargaKatolik } from '../types';
import { SapaLogo } from './SapaLogo';
import { generateQrPayload, generateWhatsAppMessage } from '../utils/dataTransfer';
import QRCode from 'qrcode';

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
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowThankYou(false);
      setCopiedCode(false);
    }
  }, [isOpen, warga?.id]);

  useEffect(() => {
    if (warga) {
      const payload = generateQrPayload(warga);
      QRCode.toDataURL(payload, {
        width: 150,
        margin: 1,
        color: {
          dark: '#0c4a6e',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => {});
    }
  }, [warga]);

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

  const handleSendToWhatsApp = () => {
    if (!warga) return;
    const msg = generateWhatsAppMessage(warga);
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleCopySyncCode = () => {
    if (!warga) return;
    const msg = generateWhatsAppMessage(warga);
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    });
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
              className="w-full h-full object-cover object-top"
              loading="lazy"
            />
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 my-2 text-center w-full">
            <h3 className="font-black text-sm sm:text-base text-orange-950 mb-0.5">
              Maturnuwun Sanget, Berkah Dalem!
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              Data pendaftaran jemaat atas nama{' '}
              <strong className="text-sky-950 font-extrabold">{warga.namaLengkap}</strong>{' '}
              telah berhasil dicatat.
            </p>
          </div>

          {/* Tombol Kirim ke WhatsApp Admin Sebelum Keluar */}
          <div className="w-full space-y-2 mb-3">
            <button
              type="button"
              onClick={handleSendToWhatsApp}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Kirim Data Registrasi ke WhatsApp Admin</span>
            </button>
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
              {/* Mode Registrasi */}
              {isRegistrationMode ? (
                <button
                  type="button"
                  onClick={handleFinishAndReturn}
                  className="px-3 sm:px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md border border-orange-400 flex items-center gap-1.5 transition active:scale-95 min-h-[38px] cursor-pointer"
                  title="Selesai dan kembali ke form pendataan warga"
                >
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  <span className="hidden sm:inline">Selesai & Kembali</span>
                  <span className="sm:hidden">Selesai</span>
                </button>
              ) : (
                /* Mode Admin */
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

          {/* Action Ribbon: Kirim ke WhatsApp Admin */}
          <div className="print:hidden bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-emerald-950 font-medium">
              <Share2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Pastikan data Anda masuk ke Admin Paroki dengan mengirimkan bukti ini:</span>
            </div>
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSendToWhatsApp}
                className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Kirim via WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleCopySyncCode}
                className="px-2.5 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold rounded-lg flex items-center gap-1 transition cursor-pointer"
                title="Salin rincian data untuk dikirim manual"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copiedCode ? 'Tersalin' : 'Salin Kode'}</span>
              </button>
            </div>
          </div>

          {/* Printable Certificate Content */}
          <div className="p-4 sm:p-7 bg-white border-4 sm:border-8 border-double border-orange-400 m-2 sm:m-3 rounded-xl sm:rounded-2xl relative overflow-y-auto">
            
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

            {/* Citizen Details Table & QR Code Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 my-3">
              
              {/* Detail fields */}
              <div className="md:col-span-3 space-y-1.5 text-xs text-slate-800 bg-slate-50/70 p-3 sm:p-4 rounded-xl border border-slate-200">
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
                  <span className="text-slate-500 font-semibold">Tempat, Tgl Lahir:</span>
                  <span className="col-span-2 font-medium text-slate-900">
                    {warga.tempatLahir ? `${warga.tempatLahir}, ` : ''}{warga.tanggalLahir || '-'}
                  </span>
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
                      <span className="text-slate-500 font-semibold">No. Akta Baptis:</span>
                      <span className="col-span-2 font-mono font-bold text-orange-800">{warga.noSuratBaptis || '-'}</span>
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

              {/* QR Code Container on Certificate */}
              <div className="md:col-span-1 flex flex-col items-center justify-center p-3 bg-sky-50/60 rounded-xl border border-sky-200 text-center">
                <span className="text-[10px] font-black uppercase text-sky-900 mb-1 tracking-wide">
                  QR Bukti SAPA
                </span>
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Bukti Pendataan SAPA"
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg border border-sky-300 bg-white p-1 shadow-2xs"
                  />
                ) : (
                  <div className="w-28 h-28 bg-slate-200 animate-pulse rounded-lg flex items-center justify-center text-[10px] text-slate-500">
                    Memuat QR...
                  </div>
                )}
                <span className="text-[9px] text-slate-500 mt-1 font-medium leading-tight">
                  Pindai lewat HP Admin untuk himpun data otomatis
                </span>
              </div>

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
                <div className="h-10 flex items-center justify-center">
                  <span className="text-[10px] text-slate-400 italic">( Tanda Tangan & Cap )</span>
                </div>
                <p className="font-bold text-slate-900 border-t border-slate-400 pt-0.5 text-[11px]">
                  Ketua / Sekretaris
                </p>
              </div>
            </div>

            {/* Tombol Besar Selesai & Kembali ke Form Pendataan di Bagian Bawah Kartu */}
            {isRegistrationMode && (
              <div className="print:hidden mt-5 pt-4 border-t-2 border-orange-200 space-y-2">
                <button
                  type="button"
                  onClick={handleSendToWhatsApp}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition active:scale-98 min-h-[44px] cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Kirim Data Registrasi ke WhatsApp Admin Sekarang</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinishAndReturn}
                  className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md border border-orange-600 flex items-center justify-center gap-2 transition active:scale-98 min-h-[44px] cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
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
