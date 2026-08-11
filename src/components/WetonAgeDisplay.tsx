import React, { useState } from 'react';
import { calculateAgeDetail } from '../lib/helpers';
import { Calculator } from 'lucide-react';
import { WetonDetailModal } from './WetonDetailModal';

interface WetonAgeDisplayProps {
  birthDateString: string;
  nama?: string;
  className?: string;
  variant?: 'inline' | 'card';
}

export const WetonAgeDisplay: React.FC<WetonAgeDisplayProps> = ({
  birthDateString,
  nama,
  className = '',
  variant = 'inline',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!birthDateString) return null;

  const detail = calculateAgeDetail(birthDateString);

  if (variant === 'card') {
    return (
      <>
        <div className={`p-2.5 bg-gradient-to-r from-amber-50 to-orange-50/80 rounded-xl border border-amber-200/80 shadow-2xs flex items-center justify-between text-xs ${className}`}>
          <div className="flex items-center gap-1.5 font-bold text-slate-800 truncate">
            <span className="px-2 py-0.5 bg-amber-200/90 text-amber-950 rounded-md font-extrabold text-[11px] shrink-0">
              {detail.wetonJawa || '---'}
            </span>
            <span className="text-slate-700 font-bold shrink-0">• Usia: {detail.years} Thn</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer active:scale-95 shrink-0 print:hidden"
            title="Lihat rincian perhitungan Weton & Neptu"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rincian</span>
          </button>
        </div>

        <WetonDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          birthDateString={birthDateString}
          nama={nama}
        />
      </>
    );
  }

  // Inline variant (default for tables / lists)
  return (
    <>
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <span className="font-medium">
          {detail.wetonJawa ? `${detail.wetonJawa} • ` : ''}{detail.years} Thn
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(true);
          }}
          title="Klik untuk melihat rincian perhitungan Weton, Hari Lahir & Neptu"
          className="inline-flex items-center justify-center p-1 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0 print:hidden"
        >
          <Calculator className="w-3 h-3 text-amber-700" />
        </button>
      </span>

      <WetonDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        birthDateString={birthDateString}
        nama={nama}
      />
    </>
  );
};
