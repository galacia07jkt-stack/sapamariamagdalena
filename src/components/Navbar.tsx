import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  ShieldCheck, 
  Lock, 
  LogOut, 
  Menu, 
  X, 
  Database
} from 'lucide-react';
import { SapaLogo } from './SapaLogo';

interface NavbarProps {
  activeTab: 'input' | 'cek' | 'admin';
  setActiveTab: (tab: 'input' | 'cek' | 'admin') => void;
  isAdmin: boolean;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenSecurityVault: () => void;
  totalJiwa: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isAdmin,
  onOpenLogin,
  onLogout,
  onOpenSecurityVault,
  totalJiwa,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-orange-500 shadow-xs">
      {/* Top Banner Accent */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-orange-500 text-white text-[11px] sm:text-xs py-1 px-3 sm:px-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-semibold truncate">
            Lingkungan St. Maria Magdalena Semampir • Paroki St. Vincentius a Paulo Kediri
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono bg-sky-950/40 px-2 py-0.5 rounded border border-orange-300/40 shrink-0 ml-2">
          <ShieldCheck className="w-3 h-3 text-orange-300 shrink-0" />
          <span>AES-256</span>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo Brand with Official SAPA St. Maria Magdalena Logo */}
          <div 
            onClick={() => setActiveTab('input')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none py-1"
          >
            <SapaLogo size="md" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl sm:text-2xl tracking-tight text-sky-950">
                  SAPA<span className="text-orange-500">.</span>
                </span>
                <span className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 bg-orange-100 text-orange-900 rounded-full border border-orange-300">
                  Semampir
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium tracking-tight truncate max-w-[170px] sm:max-w-none">
                St. Maria Magdalena • Kediri
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setActiveTab('input')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                activeTab === 'input'
                  ? 'bg-sky-50 text-sky-900 border-sky-300 shadow-xs ring-2 ring-sky-200'
                  : 'text-slate-600 hover:text-sky-700 hover:bg-slate-50 border-transparent'
              }`}
            >
              <FileText className="w-4 h-4 text-sky-600" />
              <span>Input Data Warga</span>
            </button>

            <button
              onClick={() => setActiveTab('cek')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                activeTab === 'cek'
                  ? 'bg-sky-50 text-sky-900 border-sky-300 shadow-xs ring-2 ring-sky-200'
                  : 'text-slate-600 hover:text-sky-700 hover:bg-slate-50 border-transparent'
              }`}
            >
              <Search className="w-4 h-4 text-orange-500" />
              <span>Cek Ulang & Verifikasi</span>
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-slate-200 mx-2" />

            {/* Security Vault Button - Hanya Akses Admin */}
            {isAdmin ? (
              <button
                onClick={onOpenSecurityVault}
                title="Keamanan Enkripsi Paroki (Akses Admin)"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-900 hover:text-sky-950 bg-sky-50 hover:bg-sky-100 rounded-xl border border-sky-300 transition-colors shadow-xs"
              >
                <Database className="w-3.5 h-3.5 text-sky-600" />
                <span>Enkripsi Vault</span>
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                title="Enkripsi Vault Terkunci - Hanya Akses Admin"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-orange-700 bg-slate-100 hover:bg-orange-50 rounded-xl border border-slate-200 transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-orange-500" />
                <span>Enkripsi 🔒</span>
              </button>
            )}

            {/* Admin Access Button */}
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${
                    activeTab === 'admin'
                      ? 'bg-orange-50 text-orange-900 border-orange-500 ring-2 ring-orange-200'
                      : 'bg-white text-orange-700 border-orange-400 hover:bg-orange-50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                  <span>Portal Admin</span>
                  <span className="ml-1 text-xs bg-orange-200 text-orange-950 px-1.5 py-0.5 rounded font-mono">
                    {totalJiwa}
                  </span>
                </button>
                <button
                  onClick={onLogout}
                  title="Keluar Admin"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm border border-orange-600 transition-all"
              >
                <Lock className="w-4 h-4 text-orange-100" />
                <span>Akses Admin</span>
              </button>
            )}
          </nav>

          {/* Mobile Right Controls */}
          <div className="md:hidden flex items-center gap-2">
            {isAdmin ? (
              <button
                onClick={() => setActiveTab('admin')}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-bold border flex items-center gap-1 ${
                  activeTab === 'admin'
                    ? 'bg-orange-500 text-white border-orange-600'
                    : 'bg-orange-50 text-orange-800 border-orange-300'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin ({totalJiwa})</span>
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="text-xs px-2.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-bold border border-orange-600 flex items-center gap-1"
              >
                <Lock className="w-3 h-3" />
                <span>Admin</span>
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Buka Menu"
              className="p-2 text-slate-700 hover:text-sky-700 hover:bg-sky-50 rounded-xl border border-slate-200 active:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b-2 border-orange-400 px-4 pt-3 pb-5 space-y-2 shadow-lg animate-fade-in">
          <button
            onClick={() => {
              setActiveTab('input');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold min-h-[48px] ${
              activeTab === 'input' ? 'bg-sky-50 text-sky-900 border-2 border-sky-400' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-5 h-5 text-sky-600 shrink-0" />
            <span>Formulir Input Data Warga</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('cek');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold min-h-[48px] ${
              activeTab === 'cek' ? 'bg-sky-50 text-sky-900 border-2 border-sky-400' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Search className="w-5 h-5 text-orange-500 shrink-0" />
            <span>Cek Ulang & Verifikasi Mandiri</span>
          </button>

          <button
            onClick={() => {
              if (isAdmin) {
                onOpenSecurityVault();
              } else {
                onOpenLogin();
              }
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium text-slate-700 hover:bg-slate-50 min-h-[48px]"
          >
            {isAdmin ? (
              <Database className="w-5 h-5 text-sky-600 shrink-0" />
            ) : (
              <Lock className="w-5 h-5 text-orange-500 shrink-0" />
            )}
            <div className="flex items-center justify-between w-full">
              <span>Keamanan Enkripsi Paroki</span>
              {!isAdmin && (
                <span className="text-[10px] bg-orange-100 text-orange-900 font-bold px-1.5 py-0.5 rounded border border-orange-300">
                  Hanya Admin
                </span>
              )}
            </div>
          </button>

          <div className="pt-2 border-t border-slate-100">
            {isAdmin ? (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setActiveTab('admin');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-orange-50 text-orange-950 border-2 border-orange-500 font-bold text-sm min-h-[48px]"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-orange-600" />
                    <span>Dashboard Admin ({totalJiwa} Jiwa)</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-rose-600 bg-rose-50 text-sm font-semibold min-h-[48px]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar Sesi Admin</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenLogin();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm shadow border border-orange-600 min-h-[48px]"
              >
                <Lock className="w-4 h-4" />
                <span>Masuk Akses Admin</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
