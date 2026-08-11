import React from 'react';
import { calculateAgeDetail, DetailedAge } from '../lib/helpers';
import { Calculator, X, Sparkles, Calendar, Clock, Award } from 'lucide-react';

interface WetonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  birthDateString: string;
  nama?: string;
}

export const WetonDetailModal: React.FC<WetonDetailModalProps> = ({
  isOpen,
  onClose,
  birthDateString,
  nama,
}) => {
  if (!isOpen || !birthDateString) return null;

  const detail: DetailedAge = calculateAgeDetail(birthDateString);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-amber-200 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 px-5 py-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl border border-white/30 backdrop-blur-xs text-amber-100">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                Rincian Perhitungan Weton & Usia
              </h3>
              {nama && (
                <p className="text-xs text-amber-100 font-medium truncate max-w-[220px]">
                  {nama}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 flex items-center justify-between">
            <span className="text-slate-600 font-medium flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-600" /> Tanggal Lahir:
            </span>
            <span className="font-black text-slate-900 text-sm">{birthDateString}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* 1. Hari & Pasaran Jawa (Weton) */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-3 rounded-xl border border-amber-200 shadow-2xs space-y-1">
              <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                1. Hari & Pasaran (Weton)
              </div>
              <div className="text-sm font-black text-amber-950">
                {detail.wetonJawa || '---'}
              </div>
            </div>

            {/* 2. Hari Lahir Masehi */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-600" />
                2. Hari Lahir (Masehi)
              </div>
              <div className="text-sm font-black text-slate-800">
                {detail.hariLahir || '---'}
              </div>
            </div>

            {/* 3. Usia Detail Saat Ini */}
            <div className="bg-orange-50/60 p-3 rounded-xl border border-orange-200 shadow-2xs space-y-1 sm:col-span-2">
              <div className="text-[10px] font-bold text-orange-800 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-orange-600" />
                3. Usia Detail Saat Ini
              </div>
              <div className="text-sm font-black text-orange-700">
                {detail.formatted || '0 Tahun'}
              </div>
              <div className="text-[10px] text-orange-900/70 font-medium">
                Kalkulasi presisi: Tahun, Bulan & Hari berdasarkan kalender.
              </div>
            </div>

            {/* 4. Perhitungan Neptu */}
            <div className="bg-amber-100/60 p-3 rounded-xl border border-amber-300 shadow-2xs space-y-1 sm:col-span-2">
              <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-700" />
                4. Perhitungan Neptu (Hari + Pasaran)
              </div>
              <div className="text-sm font-black text-amber-950">
                {detail.neptuDetail || '---'}
              </div>
              <div className="text-[10px] text-amber-900/80 font-medium">
                Rincian: {detail.hariLahir} (Neptu {detail.neptuHari}) + {detail.pasaranJawa} (Neptu {detail.neptuPasaran}) = Total Neptu {detail.neptuTotal}.
              </div>
            </div>

          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1 leading-relaxed">
            <p className="font-bold text-slate-700">📌 Patokan Pasaran Jawa:</p>
            <p>Siklus 5 Pasaran: <span className="font-semibold text-slate-800">Legi (5) • Pahing (9) • Pon (7) • Wage (4) • Kliwon (8)</span>.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
