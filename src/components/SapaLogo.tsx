import React from 'react';

interface SapaLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  bgVariant?: 'none' | 'white' | 'orange' | 'blue' | 'emerald' | 'amber' | 'slate' | 'glass' | 'auto';
  badgeBg?: string; // Custom container styling for matching each form
  monoLight?: boolean;
}

export const SapaLogo: React.FC<SapaLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  bgVariant = 'none',
  badgeBg,
  monoLight = false,
}) => {
  const dimensions = {
    xs: { icon: 'w-5 h-6', text: 'text-xs', space: 'gap-1.5' },
    sm: { icon: 'w-7 h-8', text: 'text-sm', space: 'gap-2' },
    md: { icon: 'w-9 h-10', text: 'text-base', space: 'gap-2.5' },
    lg: { icon: 'w-12 h-14', text: 'text-xl', space: 'gap-3' },
    xl: { icon: 'w-16 h-20', text: 'text-3xl', space: 'gap-3.5' },
  }[size];

  // Background styling for the logo container to adapt to each form/header color
  const getBadgeStyle = () => {
    if (badgeBg) return badgeBg;
    switch (bgVariant) {
      case 'white':
        return 'bg-white/95 shadow-md border border-slate-200/90 rounded-2xl p-1.5 px-3';
      case 'orange':
        return 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md border border-orange-400/40 rounded-2xl p-1.5 px-3';
      case 'blue':
        return 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md border border-blue-400/40 rounded-2xl p-1.5 px-3';
      case 'emerald':
        return 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md border border-emerald-400/40 rounded-2xl p-1.5 px-3';
      case 'amber':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md border border-amber-300/40 rounded-2xl p-1.5 px-3';
      case 'slate':
        return 'bg-slate-900 text-white border border-slate-800 rounded-2xl p-1.5 px-3 shadow-md';
      case 'glass':
      case 'auto':
        return 'bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-2xl p-1.5 px-3 shadow-inner';
      case 'none':
      default:
        return '';
    }
  };

  const badgeClass = getBadgeStyle();

  return (
    <div className={`inline-flex items-center ${dimensions.space} ${badgeClass} ${className}`}>
      {/* SVG Emblem representing the SAPA logo from the image */}
      <svg
        viewBox="0 0 240 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${dimensions.icon} shrink-0 drop-shadow-sm`}
      >
        <defs>
          <linearGradient id="sapaLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={monoLight ? "#FFFFFF" : "#FF6B00"} />
            <stop offset="100%" stopColor={monoLight ? "#FDE68A" : "#FF4500"} />
          </linearGradient>
          <linearGradient id="sapaTextGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={monoLight ? "#FFFFFF" : "#FFB800"} />
            <stop offset="50%" stopColor={monoLight ? "#FEF08A" : "#FF6B00"} />
            <stop offset="100%" stopColor={monoLight ? "#FFFFFF" : "#E05300"} />
          </linearGradient>
        </defs>

        {/* Emblem Top shape - stylized P / M ribbon */}
        {/* Left vertical column */}
        <path
          d="M 20 60 H 60 V 175 H 20 Z"
          fill="url(#sapaLogoGrad)"
        />
        {/* Top bar & curved right Loop folding down-left */}
        <path
          d="M 20 10 
             H 130 
             C 185 10 215 40 215 90 
             C 215 130 185 160 145 185 
             L 100 220 
             L 100 155 
             L 140 125 
             C 160 110 165 100 165 90 
             C 165 68 150 55 125 55 
             H 60 
             V 10 
             Z"
          fill="url(#sapaLogoGrad)"
        />

        {/* Text 'SAPA' at bottom */}
        <g fill="url(#sapaTextGrad)">
          {/* S */}
          <path d="M 12 245 H 52 V 254 H 24 V 260 H 52 V 278 H 12 V 268 H 40 V 262 H 12 Z" />
          {/* A */}
          <path d="M 60 278 L 78 245 H 94 L 112 278 H 98 L 94 270 H 78 L 74 278 Z M 81 258 L 88 258 L 85 251 Z" />
          {/* P */}
          <path d="M 120 245 H 152 C 162 245 168 249 168 257 C 168 265 162 268 152 268 H 134 V 278 H 120 Z M 134 253 V 260 H 150 C 153 260 155 259 155 257 C 155 254 153 253 150 253 Z" />
          {/* A */}
          <path d="M 176 278 L 194 245 H 210 L 228 278 H 214 L 210 270 H 194 L 190 278 Z M 197 258 L 204 258 L 201 251 Z" />
          {/* Square dot hovering over second A */}
          <rect x="202" y="232" width="22" height="22" rx="3" fill="url(#sapaTextGrad)" />
        </g>
      </svg>

      {/* Label Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-black tracking-tight ${dimensions.text} ${
            monoLight ? 'text-white drop-shadow-sm' : 'bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent'
          }`}>
            SAPA
          </span>
          <span className="text-[10px] font-bold text-orange-600 tracking-wider uppercase opacity-90">
            Kediri
          </span>
        </div>
      )}
    </div>
  );
};
