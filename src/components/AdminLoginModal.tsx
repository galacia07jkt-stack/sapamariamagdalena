import React, { useState } from 'react';
import { Lock, Eye, EyeOff, X, ShieldAlert } from 'lucide-react';
import { verifikasiAdminPassword } from '../utils/storage';
import { SapaLogo } from './SapaLogo';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);

    if (verifikasiAdminPassword(password)) {
      setPassword('');
      setError(false);
      onSuccess();
      onClose();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-orange-500 shadow-2xl max-w-sm sm:max-w-md w-full overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-900 p-4 sm:p-5 text-white flex items-center justify-between border-b-4 border-orange-500">
          <div className="flex items-center gap-2.5">
            <SapaLogo size="xs" />
            <div>
              <h3 className="font-bold text-sm sm:text-base tracking-tight">
                Akses Pengurus Admin
              </h3>
              <p className="text-[10px] sm:text-xs text-sky-200">
                St. Maria Magdalena Semampir Kediri
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-sky-200 hover:text-white hover:bg-white/10 min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6">
          <div className="text-center mb-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1 shadow-md border-2 border-orange-500 mx-auto mb-3 overflow-hidden flex items-center justify-center">
              <img
                src="/logo-sapa.png"
                alt="Logo SAPA"
                className="w-full h-full object-contain"
              />
            </div>
            <h4 className="font-extrabold text-slate-800 text-base sm:text-lg">
              Portal Otorisasi Pengurus
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Halaman ini diperuntukkan bagi Ketua Lingkungan dan Sekretaris Paroki.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>Kata sandi otorisasi tidak valid. Periksa kembali.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kata Sandi Otorisasi Admin
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  autoFocus
                  required
                  className="w-full pl-3.5 pr-11 py-3 sm:py-2.5 rounded-xl border-2 border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-base sm:text-sm bg-slate-50 focus:bg-white min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 sm:py-2.5 border border-slate-300 rounded-xl text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-3 sm:py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md border border-orange-600 transition min-h-[44px]"
              >
                Buka Admin
              </button>
            </div>
          </form>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400">
              Paroki St. Vincentius a Paulo • Kota Kediri
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
