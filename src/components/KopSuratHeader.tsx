import React from 'react';
import { LogoStMariaMagdalena } from './LogoStMariaMagdalena';

interface KopSuratHeaderProps {
  title?: string;
  noDokumen?: string;
  showSubtext?: boolean;
  className?: string;
  logoUrl?: string;
  logoVariant?: 'photo' | 'svg' | 'blank';
}

export const KopSuratHeader: React.FC<KopSuratHeaderProps> = ({
  title = "KARTU KELUARGA LINGKUNGAN ST. MARIA MAGDALENA",
  noDokumen,
  showSubtext = true,
  className = "",
  logoUrl,
  logoVariant = 'photo'
}) => {
  return (
    <div className={`w-full text-slate-900 font-sans print:text-black ${className}`}>
      {/* Official Kop Surat Block */}
      <div className="w-full pb-3 border-b-[3px] border-double border-[#7C2D12] print:border-black">
        
        {/* Header Layout: Left Logo + Center Header Text + Right Spacer for Balance */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left Side: Logo Santa Maria Magdalena */}
          <div className="shrink-0 flex items-center justify-center w-20 sm:w-24 md:w-28 min-h-[5rem]">
            {logoVariant !== 'blank' && (
              logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Logo St. Maria Magdalena" 
                  className="h-20 sm:h-24 md:h-28 w-auto object-contain drop-shadow-xs print:drop-shadow-none" 
                />
              ) : (
                <LogoStMariaMagdalena size="md" variant={logoVariant} className="w-20 h-24 sm:w-24 sm:h-28 drop-shadow-xs print:drop-shadow-none" />
              )
            )}
          </div>

          {/* Center Column: Cop Surat Text (Centered) */}
          <div className="flex-1 text-center space-y-1 px-1">
            <h3 className="text-[11px] sm:text-[13px] md:text-[14px] font-extrabold text-[#7C2D12] print:text-black uppercase tracking-wider leading-tight">
              GEREJA KATOLIK PAROKI ST. VINCENTIUS A PAULO KEDIRI
            </h3>
            <h1 className="text-[13px] sm:text-[17px] md:text-[19px] font-black text-slate-900 print:text-black uppercase tracking-wide leading-tight">
              LINGKUNGAN ST. MARIA MAGDALENA - SEMAMPIR KEDIRI
            </h1>
            <h4 className="text-[10px] sm:text-[12px] font-bold text-[#9A3412] print:text-black uppercase tracking-widest leading-tight">
              KEUSKUPAN SURABAYA
            </h4>

            {showSubtext && (
              <p className="text-[9px] sm:text-[11px] text-slate-600 print:text-black font-medium pt-0.5 leading-tight">
                Sekretariat: Semampir, Kediri - Jawa Timur • Sistem Informasi Pendataan Warga Mandiri (SAPA) Kediri
              </p>
            )}
          </div>

          {/* Right Side: Equal width spacer to keep the center text perfectly balanced */}
          <div className="shrink-0 w-20 sm:w-24 md:w-28" />
        </div>

        {/* Document Title & Document Number (Centered) */}
        <div className="text-center space-y-1 mt-3">
          {title && (
            <div>
              <span className="inline-block px-4 py-1 bg-amber-50 print:bg-transparent text-amber-950 print:text-black text-[12px] sm:text-[14px] font-black rounded-lg border border-amber-300 print:border-black uppercase tracking-wide shadow-2xs print:shadow-none">
                {title}
              </span>
            </div>
          )}

          {noDokumen && (
            <p className="text-[11px] sm:text-[13px] font-black text-[#7C2D12] print:text-black pt-1">
              NO. KK LINGKUNGAN: <span className="font-mono bg-slate-100 print:bg-transparent px-2.5 py-0.5 rounded border border-slate-300 print:border-black">{noDokumen}</span>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};




