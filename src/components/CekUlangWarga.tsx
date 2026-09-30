import React, { useState } from 'react';
import { 
  Search, 
  AlertCircle, 
  MapPin, 
  Printer, 
  ShieldCheck, 
  Check, 
  Clock, 
  MessageCircle, 
  UserPlus,
  Phone
} from 'lucide-react';
import { WargaKatolik } from '../types';
import { cariWargaOlehNikAtauKk } from '../utils/storage';
import { maskSensitiveId } from '../utils/encryption';
import { SapaLogo } from './SapaLogo';

interface CekUlangWargaProps {
  onOpenBukti: (warga: WargaKatolik) => void;
  onGoToInput: () => void;
}

export const CekUlangWarga: React.FC<CekUlangWargaProps> = ({
  onOpenBukti,
  onGoToInput,
}) => {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<WargaKatolik[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    const data = cariWargaOlehNikAtauKk(keyword);
    setResults(data);
    setHasSearched(true);
  };

  const handleClear = () => {
    setKeyword('');
    setResults(null);
    setHasSearched(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
      
      {/* Search Box Card with Orange Border */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-orange-500 shadow-md p-4 sm:p-7">
        <div className="flex items-center gap-3 mb-3 sm:mb-4">
          <SapaLogo size="sm" />
          <div>
            <h2 className="text-base sm:text-2xl font-extrabold text-sky-950">
              Cek Ulang & Verifikasi Mandiri
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Periksa status pendaftaran Anda atau anggota keluarga dalam database St. Maria Magdalena Semampir Kediri.
            </p>
          </div>
        </div>

        {/* Search Input Field */}
        <form onSubmit={handleSearch} className="mt-3 sm:mt-5">
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Ketik NIK, No. KK, atau Nama Warga..."
                className="w-full pl-10 pr-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border-2 border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-base sm:text-sm font-medium bg-slate-50 focus:bg-white min-h-[48px]"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5 sm:top-4" />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-3 sm:py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl sm:rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 border border-orange-600 shrink-0 min-h-[48px]"
              >
                <Search className="w-4 h-4" />
                <span>Cari Data</span>
              </button>

              {hasSearched && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-3 sm:py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl sm:rounded-2xl transition shrink-0 min-h-[48px]"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-2">
            💡 Masukkan 16 digit NIK atau Nomor Kartu Keluarga (KK) untuk melihat anggota keluarga yang sudah terdaftar.
          </p>
        </form>
      </div>

      {/* Results Section */}
      {hasSearched && (
        <div className="space-y-3.5 sm:space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
              Hasil ({results?.length || 0} Data Ditemukan)
            </h3>
            <span className="text-[11px] text-slate-500 truncate max-w-[180px] sm:max-w-none">
              Kata Kunci: <strong className="text-sky-950">"{keyword}"</strong>
            </span>
          </div>

          {results && results.length > 0 ? (
            <div className="grid grid-cols-1 gap-3.5 sm:gap-4">
              {results.map((warga) => {
                const isKatolik = (warga.agama || 'Katolik') === 'Katolik';
                return (
                  <div
                    key={warga.id}
                    className="bg-white rounded-2xl border-2 border-sky-200 hover:border-orange-400 transition-all p-4 sm:p-5 shadow-xs space-y-3.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border ${
                            isKatolik
                              ? 'bg-orange-50 text-orange-900 border-orange-300'
                              : 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}>
                            {warga.agama || 'Katolik'}
                          </span>

                          {isKatolik && warga.namaBaptis && (
                            <span className="text-xs font-bold text-sky-900 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                              {warga.namaBaptis}
                            </span>
                          )}

                          <span className="text-xs font-semibold text-slate-500">
                            ({warga.hubunganKeluarga})
                          </span>
                        </div>
                        <h4 className="text-base sm:text-lg font-extrabold text-sky-950 mt-1">
                          {warga.namaLengkap}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-slate-500 font-mono mt-0.5">
                          NIK: {maskSensitiveId(warga.nik)} • KK: {maskSensitiveId(warga.noKk)}
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-1">
                        <span
                          className={`text-[11px] sm:text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border ${
                            warga.statusVerifikasi === 'Terverifikasi'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          {warga.statusVerifikasi === 'Terverifikasi' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Terverifikasi</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Menunggu</span>
                            </>
                          )}
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                          {warga.rtRw} Semampir
                        </span>
                      </div>
                    </div>

                    {/* Church & Sacramental Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="bg-sky-50/60 p-2.5 rounded-xl border border-sky-100">
                        <span className="text-slate-500 font-medium block text-[10px] tracking-wider">
                          {isKatolik ? 'Tempat Baptis:' : 'Agama & Domisili:'}
                        </span>
                        <span className="font-bold text-sky-950 block mt-0.5 truncate">
                          {isKatolik ? (warga.tempatBaptis || 'Gereja St. Vincentius a Paulo Kediri') : (warga.agama || 'Katolik')}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {isKatolik ? warga.parokiKotaBaptis : warga.rtRw}
                        </span>
                      </div>

                      <div className="bg-sky-50/60 p-2.5 rounded-xl border border-sky-100">
                        <span className="text-slate-500 font-medium block text-[10px] tracking-wider">
                          {isKatolik ? 'Akta / Surat Baptis:' : 'Tanggal Lahir:'}
                        </span>
                        <span className="font-mono font-bold text-orange-800 block mt-0.5 truncate">
                          {isKatolik ? (warga.noSuratBaptis || 'Buku Register Paroki') : (warga.tanggalLahir || '-')}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {isKatolik ? `Tgl Baptis: ${warga.tanggalBaptis || '-'}` : `Lahir: ${warga.tanggalLahir || '-'}`}
                        </span>
                      </div>

                      <div className="bg-sky-50/60 p-2.5 rounded-xl border border-sky-100">
                        <span className="text-slate-500 font-medium block text-[10px] tracking-wider">
                          {isKatolik ? 'Status Sakramen:' : 'Status Hubungan:'}
                        </span>
                        {isKatolik ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${warga.sakramenLain?.komuniPertama ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                              Komuni {warga.sakramenLain?.komuniPertama ? '✓' : '✗'}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${warga.sakramenLain?.krisma ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                              Krisma {warga.sakramenLain?.krisma ? '✓' : '✗'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-700 block mt-1">
                            {warga.statusPerkawinan}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Action Buttons (Mobile-Friendly) */}
                    <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{warga.alamatDomisili}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenBukti(warga)}
                          className="flex-1 sm:flex-none px-3.5 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-900 font-bold text-xs rounded-xl border border-sky-300 flex items-center justify-center gap-1.5 min-h-[44px]"
                        >
                          <Printer className="w-4 h-4 text-sky-600" />
                          <span>Cetak Bukti</span>
                        </button>

                        <a
                          href={`https://wa.me/6281233445566?text=Halo%20Sekretaris%20Lingkungan%20St.%20Maria%20Magdalena%20Semampir,%20saya%20ingin%20konfirmasi%20data%20SAPA%20atas%20nama%20${encodeURIComponent((warga.namaBaptis ? warga.namaBaptis + ' ' : '') + warga.namaLengkap)}%20(NIK:%20${warga.nik})`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 sm:flex-none px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs rounded-xl border border-emerald-300 flex items-center justify-center gap-1.5 min-h-[44px]"
                        >
                          <MessageCircle className="w-4 h-4 text-emerald-600" />
                          <span>Konfirmasi WA</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-slate-200 p-6 sm:p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-800">
                Data Tidak Ditemukan
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Data dengan kata kunci <strong>"{keyword}"</strong> belum terdaftar di database Lingkungan St. Maria Magdalena Semampir Kediri.
              </p>
              <div className="pt-2">
                <button
                  onClick={onGoToInput}
                  className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm rounded-xl shadow-md border border-orange-600 min-h-[44px] flex items-center justify-center gap-2 mx-auto"
                >
                  <UserPlus className="w-4 h-4 text-orange-100" />
                  <span>Daftarkan Data Warga Baru Sekarang</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Notice Box */}
      <div className="bg-gradient-to-r from-sky-50 via-white to-sky-50 p-4 rounded-xl sm:rounded-2xl border border-sky-200 text-xs text-slate-600 flex items-start gap-2.5">
        <ShieldCheck className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-sky-950 text-xs">
            Kerahasiaan & Keamanan Data Jemaat Terjamin
          </p>
          <p className="text-[11px] leading-relaxed">
            Nomor Induk Kependudukan (NIK) dan No. KK disamarkan sebagian demi menjaga privasi warga pada tampilan umum. Data tersimpan dengan aman di database terenkripsi Paroki St. Vincentius a Paulo Kediri.
          </p>
        </div>
      </div>

    </div>
  );
};
