import React, { useState } from 'react';

interface SapaLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
}

export const SapaLogo: React.FC<SapaLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeMap = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`${sizeMap[size]} shrink-0 rounded-2xl bg-white p-0.5 shadow-sm border-2 border-orange-500 overflow-hidden flex items-center justify-center`}
      >
        {!imgError ? (
          <img
            src="/logo-sapa.png"
            alt="Logo SAPA St. Maria Magdalena Semampir Kediri"
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-sky-600 to-orange-500 rounded-[10px] flex items-center justify-center text-white font-extrabold text-xs">
            SAPA
          </div>
        )}
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-sky-950">
              SAPA<span className="text-orange-500">.</span>
            </span>
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 bg-orange-100 text-orange-900 rounded-full border border-orange-300">
              Semampir
            </span>
          </div>
          <span className="text-[10px] sm:text-xs font-medium text-slate-500">
            St. Maria Magdalena • Kediri
          </span>
        </div>
      )}
    </div>
  );
};
