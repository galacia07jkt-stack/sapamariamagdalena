import React from 'react';
import { ShieldCheck, UserPlus, MapPin, Search } from 'lucide-react';
import { StatistikParoki } from '../types';
import { SapaLogo } from './SapaLogo';

interface ParishHeaderProps {
  stats: StatistikParoki;
  onCekDataClick: () => void;
  onDaftarClick: () => void;
}

export const ParishHeader: React.FC<ParishHeaderProps> = ({
  stats,
  onCekDataClick,
  onDaftarClick,
}) => {
  return (
    <div className="relative overflow-hidden mb-6 sm:mb-8">
      {/* Outer Card with Light Blue Background, White Insets, and Orange Border */}
      <div className="bg-gradient-to-br from-sky-50 via-white to-sky-100/70 rounded-2xl sm:rounded-3xl border-2 border-orange-500 shadow-md p-4 sm:p-7 md:p-8 relative">
        
        {/* Mobile & Desktop Header Layout */}
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6">
          
          {/* Prominent SAPA St. Maria Magdalena Logo */}
          <div className="shrink-0 flex flex-col items-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl sm:rounded-3xl bg-white p-1 shadow-lg border-2 sm:border-3 border-orange-500 overflow-hidden flex items-center justify-center transition-transform hover:scale-105">
              <img
                src="/logo-sapa.png"
                alt="Logo SAPA St. Maria Magdalena Semampir Kediri"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-300 md:hidden">
              Logo Resmi SAPA
            </span>
          </div>

          {/* Text Content */}
          <div className="flex-1 text-center md:text-left">
            {/* Parish Location Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-orange-400 shadow-xs text-[11px] sm:text-xs font-semibold text-orange-900 mb-2 sm:mb-3">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              <MapPin className="w-3.5 h-3.5 text-orange-600" />
              <span>Semampir, Kediri • Paroki St. Vincentius a Paulo</span>
            </div>

            {/* Main Title */}
            <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-sky-950 tracking-tight leading-tight">
              SAPA St. Maria Magdalena
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-sky-800 font-bold mt-0.5">
              Wilayah Paroki St. Vincentius a Paulo Kota Kediri
            </p>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
              Sistem Administrasi dan Pendataan Warga Katolik Lingkungan St. Maria Magdalena Semampir. 
              Mendukung pendaftaran mandiri warga, verifikasi sakramen baptis, dan pelaporan format Excel rapi berbingkai resmi.
            </p>

            {/* Action CTAs for Parishioners (Full width on mobile for easy tapping) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={onDaftarClick}
                className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-md active:scale-98 transition-all border border-orange-600 flex items-center justify-center gap-2 min-h-[44px]"
              >
                <UserPlus className="w-5 h-5 text-orange-100" />
                <span>Daftarkan Warga Baru</span>
              </button>
              <button
                onClick={onCekDataClick}
                className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-white hover:bg-sky-50 text-sky-900 font-bold text-sm rounded-xl shadow-xs active:scale-98 transition-all border-2 border-sky-300 flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Search className="w-4 h-4 text-sky-700" />
                <span>Cek Ulang & Verifikasi NIK</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Snapshot Pills - Responsive 2x2 grid on mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mt-5 pt-4 sm:pt-5 border-t border-sky-200">
          <div className="bg-white/90 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl border border-sky-200 shadow-xs">
            <span className="text-[10px] sm:text-xs text-slate-500 font-semibold block">Total Jiwa Katolik</span>
            <span className="text-lg sm:text-xl font-extrabold text-sky-950">{stats.totalJiwa} Jiwa</span>
          </div>
          <div className="bg-white/90 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl border border-orange-200 shadow-xs">
            <span className="text-[10px] sm:text-xs text-slate-500 font-semibold block">Kepala Keluarga (KK)</span>
            <span className="text-lg sm:text-xl font-extrabold text-orange-700">{stats.totalKk} KK</span>
          </div>
          <div className="bg-white/90 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl border border-sky-200 shadow-xs">
            <span className="text-[10px] sm:text-xs text-slate-500 font-semibold block">Penerima Baptis</span>
            <span className="text-lg sm:text-xl font-extrabold text-sky-800">{stats.totalBaptis} Jiwa</span>
          </div>
          <div className="bg-white/90 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl border border-emerald-200 shadow-xs">
            <span className="text-[10px] sm:text-xs text-slate-500 font-semibold block">Keamanan Data</span>
            <span className="text-[11px] sm:text-xs font-bold text-emerald-800 flex items-center gap-1 mt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>AES-256 Enkripsi</span>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
