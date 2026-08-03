import React from 'react';
import { UserAccount } from '../types';
import { LogOut, User, ShieldCheck } from 'lucide-react';
import { SapaLogo } from './SapaLogo';

interface HeaderProps {
  user: UserAccount | null;
  onLogout: () => void;
  onOpenUbahPassword: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, onOpenUbahPassword }) => {
  return (
    <header className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 text-white shadow-md border-b border-orange-700/20 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="bg-white/95 p-1 px-2.5 rounded-2xl shadow-md border border-white/40 shrink-0">
              <SapaLogo size="sm" showText={false} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white drop-shadow-sm">SAPA Kediri</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                  Resmi
                </span>
              </div>
              <p className="text-xs font-medium text-orange-100">
                Lingkungan St. Maria Magdalena • Paroki St. Vincentius a Paulo Kediri
              </p>
            </div>
          </div>

          {/* User Status & Action Buttons */}
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20">
                {user.role === 'pengurus' ? (
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                ) : (
                  <User className="w-4 h-4 text-orange-200" />
                )}
                <div className="text-xs">
                  <div className="font-bold text-white capitalize leading-tight">{user.namaLengkap}</div>
                  <div className="text-[10px] text-orange-200 uppercase font-semibold">
                    Role: {user.role === 'pengurus' ? 'Pengurus Lingkungan' : 'Akses Warga'}
                  </div>
                </div>
              </div>

              <button
                onClick={onOpenUbahPassword}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-orange-100 hover:text-white border border-white/20 transition-all active:scale-95"
              >
                Ubah Password
              </button>

              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-700/80 hover:bg-red-700 text-white border border-red-500/40 shadow-sm transition-all active:scale-95 cursor-pointer"
                title="Keluar ke Halaman Login"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          ) : (
            <div className="text-xs text-orange-100 font-medium italic hidden sm:block">
              Sistem Pelayanan Administrasi Lingkungan
            </div>
          )}

        </div>
      </div>
    </header>
  );
};
