import React from 'react';
import stMariaIcon from '../assets/images/st_m_magdalena_1786458394388.jpg';

interface LogoStMariaMagdalenaProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'photo' | 'svg' | 'blank';
}

export const LogoStMariaMagdalena: React.FC<LogoStMariaMagdalenaProps> = ({
  className = '',
  size = 'md',
  variant = 'photo'
}) => {
  if (variant === 'blank') {
    return null;
  }

  const sizeMap = {
    sm: 'w-16 h-20',
    md: 'w-20 h-26 sm:w-24 sm:h-32',
    lg: 'w-28 h-36',
    xl: 'w-36 h-48',
    '2xl': 'w-48 h-64'
  };

  const dimensions = sizeMap[size];

  if (variant === 'photo') {
    return (
      <div className={`${dimensions} ${className} shrink-0 flex items-center justify-center p-0.5 rounded-xl border-2 border-amber-800/40 bg-amber-50 shadow-md overflow-hidden transition-all hover:scale-105 print:shadow-none print:border-black`}>
        <img
          src={stMariaIcon}
          alt="Ikon Resmi St. Maria Magdalena HD"
          className="w-full h-full object-contain rounded-lg shadow-2xs image-render-crisp"
          style={{ imageRendering: '-webkit-optimize-contrast' }}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 340 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${dimensions} ${className} shrink-0`}
    >
      <defs>
        {/* Color Palette matching stamp ink */}
        <linearGradient id="stampGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B44C16" />
          <stop offset="100%" stopColor="#8C2F08" />
        </linearGradient>

        <path id="arcTopLeft" d="M 40,180 A 130,150 0 0,1 125,55" />
        <path id="arcTopRight1" d="M 215,55 A 130,150 0 0,1 300,140" />
        <path id="arcTopRight2" d="M 215,75 A 110,130 0 0,1 290,165" />
        <path id="arcBottomArc" d="M 35,225 A 135,150 0 0,0 305,225" />
      </defs>

      {/* Outer Double Ring Stamp Border */}
      <ellipse cx="170" cy="200" rx="158" ry="188" stroke="#B44C16" strokeWidth="6" fill="#FFFDFB" />
      <ellipse cx="170" cy="200" rx="150" ry="178" stroke="#8C2F08" strokeWidth="2" fill="none" />
      <ellipse cx="170" cy="200" rx="112" ry="132" stroke="#B44C16" strokeWidth="2.5" fill="none" />

      {/* Halo Behind Saint Mary Magdalene */}
      <circle cx="170" cy="120" r="54" stroke="#B44C16" strokeWidth="3" fill="none" />
      <circle cx="170" cy="120" r="48" stroke="#8C2F08" strokeWidth="1.5" fill="none" />

      {/* Wheat Ears Left */}
      <g stroke="#B44C16" strokeWidth="2" fill="#B44C16">
        <path d="M 40 185 Q 48 205 54 225" fill="none" strokeWidth="2" />
        <path d="M 38 185 C 30 180 34 170 42 180 Z" />
        <path d="M 44 196 C 35 190 40 180 47 190 Z" />
        <path d="M 49 208 C 40 202 45 192 52 202 Z" />
      </g>

      {/* Wheat Ears Right */}
      <g stroke="#B44C16" strokeWidth="2" fill="#B44C16">
        <path d="M 300 185 Q 292 205 286 225" fill="none" strokeWidth="2" />
        <path d="M 302 185 C 310 180 306 170 298 180 Z" />
        <path d="M 296 196 C 305 190 300 180 293 190 Z" />
        <path d="M 291 208 C 300 202 295 192 288 202 Z" />
      </g>

      {/* Saint Mary Magdalene Graphic */}
      <g stroke="#8C2F08" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Veil */}
        <path d="M 135 92 Q 170 65 205 92 Q 215 125 208 170 L 132 170 Q 125 125 135 92 Z" fill="#FFFDFB" />
        <path d="M 144 102 Q 170 86 196 102 Q 200 120 195 142 L 145 142 Q 140 120 144 102 Z" strokeWidth="1.5" />

        {/* Face */}
        <ellipse cx="170" cy="116" rx="12" ry="15" fill="#FFFDFB" strokeWidth="1.5" />
        <path d="M 163 114 Q 166 112 168 114" strokeWidth="1.2" />
        <path d="M 172 114 Q 174 112 177 114" strokeWidth="1.2" />
        <path d="M 170 115 L 170 123 L 173 123" strokeWidth="1.2" />
        <path d="M 166 126 Q 170 128 174 126" strokeWidth="1.2" />

        {/* Robe Folds */}
        <path d="M 132 170 L 110 250 Q 170 282 230 250 L 208 170" />
        <path d="M 138 178 C 158 195 182 195 202 178" strokeWidth="1.8" />
        <path d="M 130 200 C 155 220 185 220 210 200" strokeWidth="1.8" />
        <path d="M 124 225 C 155 248 185 248 216 225" strokeWidth="1.8" />

        {/* Red Egg in Right Hand */}
        <ellipse cx="158" cy="236" rx="9" ry="12" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="1.5" />

        {/* Alabaster Jar in Left Hand */}
        <path d="M 184 224 L 192 224 L 194 232 L 197 248 Q 188 255 179 248 L 182 232 Z" fill="#FFFDFB" stroke="#8C2F08" strokeWidth="1.8" />
        <path d="M 182 232 L 194 232" strokeWidth="1.2" />
        <path d="M 181 239 Q 188 243 195 239" strokeWidth="1.2" />
      </g>

      {/* Side Text - SAINT */}
      <text fill="#8C2F08" fontSize="22" fontWeight="900" fontFamily="Georgia, serif" letterSpacing="2">
        <textPath href="#arcTopLeft" startOffset="50%" textAnchor="middle">
          SAINT
        </textPath>
      </text>

      {/* Side Text - MARY MAGDALENE */}
      <text fill="#8C2F08" fontSize="18" fontWeight="900" fontFamily="Georgia, serif" letterSpacing="1">
        <textPath href="#arcTopRight1" startOffset="50%" textAnchor="middle">
          MARY
        </textPath>
      </text>
      <text fill="#8C2F08" fontSize="13" fontWeight="900" fontFamily="Georgia, serif" letterSpacing="1">
        <textPath href="#arcTopRight2" startOffset="50%" textAnchor="middle">
          MAGDALENE
        </textPath>
      </text>

      {/* Bottom Circular Text */}
      <text fill="#8C2F08" fontSize="11" fontWeight="900" fontFamily="Arial, sans-serif" letterSpacing="1.2">
        <textPath href="#arcBottomArc" startOffset="50%" textAnchor="middle">
          DOKUMEN LINGKUNGAN ST MARIA MAGDALENA SEMAMPIR KEDIRI
        </textPath>
      </text>
    </svg>
  );
};

