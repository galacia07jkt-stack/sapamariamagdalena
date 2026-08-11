import React from 'react';
import { UserAccount } from '../types';
import { LogOut, User, ShieldCheck, Presentation, BookOpen, KeyRound } from 'lucide-react';
import { SapaLogo } from './SapaLogo';

interface HeaderProps {
  user: UserAccount | null;
  onLogout: () => void;
  onOpenUbahPassword: () => void;
  onOpenPresentation?: () => void;
  onOpenTutorial?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onOpenUbahPassword,
  onOpenPresentation,
  onOpenTutorial
}) => {
  return (
    <header className="bg-gradient-to-r from-red-700 via-orange-600 to-red-600 text-white shadow-lg border-b border-red-800/40 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo & Minimalist Title */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="bg-white p-1.5 rounded-xl shadow-md border border-white/40 shrink-0 transform hover:scale-105 transition-transform">
              <SapaLogo size="sm" showText={false} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-sm sm:text-base md:text-lg tracking-tight text-white drop-shadow-sm">
                  SAPA Kediri
                </span>
                <span className="hidden sm:inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/20 text-orange-100 border border-white/30">
                  St. Maria Magdalena
                </span>
              </div>
              <p className="text-[10px] sm:text-xs font-medium text-orange-100/90 hidden md:block">
                Paroki St. Vincentius a Paulo Kediri
              </p>
            </div>
          </div>

          {/* Action Buttons with Red-Orange Color Scheme & Responsive Design */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-0.5 no-scrollbar">
            {onOpenTutorial && (
              <button
                type="button"
                onClick={onOpenTutorial}
                className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-700 hover:to-orange-700 text-white shadow-md shadow-red-900/20 border border-orange-400/40 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
                title="Buka Panduan & Tutorial Penggunaan"
              >
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-200" />
                <span className="whitespace-nowrap">Panduan</span>
              </button>
            )}

            {onOpenPresentation && (
              <button
                type="button"
                onClick={onOpenPresentation}
                className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:from-red-700 hover:to-orange-600 text-white shadow-md shadow-orange-900/20 border border-amber-300/50 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
                title="Buka Slide Presentasi PPT Aplikasi"
              >
                <Presentation className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-100" />
                <span className="whitespace-nowrap">Presentasi PPT</span>
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <div className="hidden lg:flex items-center gap-2 bg-black/20 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/15">
                  {user.role === 'pengurus' ? (
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                  ) : (
                    <User className="w-4 h-4 text-orange-200" />
                  )}
                  <div className="text-[11px]">
                    <div className="font-bold text-white leading-tight truncate max-w-[120px]">{user.namaLengkap}</div>
                    <div className="text-[9px] text-orange-200 uppercase font-bold">
                      {user.role === 'pengurus' ? 'Pengurus' : 'Warga'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenUbahPassword}
                  className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white border border-orange-400/30 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-1"
                  title="Ubah Password Akun"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ubah Password</span>
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-800 hover:to-rose-800 text-white border border-red-500/50 shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
                  title="Keluar ke Halaman Login"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            ) : (
              <div className="text-[11px] text-orange-100/90 font-medium italic hidden sm:block">
                Sistem Administrasi Umat
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

