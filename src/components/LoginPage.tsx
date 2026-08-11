import React, { useState } from 'react';
import { UserAccount } from '../types';
import { authenticateUser } from '../lib/database';
import { KisahStMariaMagdalena } from './KisahStMariaMagdalena';
import { Lock, User, KeyRound, ShieldCheck, LogIn, AlertCircle } from 'lucide-react';
import { SapaLogo } from './SapaLogo';

interface LoginPageProps {
  onLoginSuccess: (user: UserAccount) => void;
  onOpenUbahPassword: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onOpenUbahPassword
}) => {
  const [username, setUsername] = useState('warga');
  const [password, setPassword] = useState('sapa123');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Quick button for Login Warga
  const handleQuickWarga = () => {
    setUsername('warga');
    setPassword('sapa123');
    setErrorMsg('');
  };

  // Quick button for Login Pengurus: Fills username "pengurus", leaves password BLANK
  const handleQuickPengurus = () => {
    setUsername('pengurus');
    setPassword(''); // MUST BE BLANK so citizen cannot see password!
    setErrorMsg('Username Pengurus diisi. Silakan masukkan password Pengurus.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('Username wajib diisi!');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Password wajib diisi!');
      return;
    }

    setIsLoading(true);
    try {
      const account = await authenticateUser(username);
      if (!account) {
        setErrorMsg('Username tidak ditemukan!');
        setIsLoading(false);
        return;
      }

      if (account.passwordHash !== password.trim()) {
        setErrorMsg('Password salah! Silakan periksa kembali.');
        setIsLoading(false);
        return;
      }

      onLoginSuccess(account);
    } catch (err) {
      setErrorMsg('Terjadi kesalahan sistem saat login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100/60 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: Spiritualitas & Kisah St. Maria Magdalena */}
        <div className="lg:col-span-7 flex flex-col">
          <KisahStMariaMagdalena />
        </div>

        {/* RIGHT COLUMN: Form Login & Tombol Pintas Akses */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="bg-white rounded-2xl shadow-xl border border-orange-200/80 p-6 sm:p-8 space-y-6">
            
            {/* Header Form */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-2.5 px-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/80 shadow-sm mb-1">
                <SapaLogo size="md" showText={true} />
              </div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">Login Aplikasi SAPA</h1>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Sistem Aplikasi Pelayanan Administrasi Lingkungan St. Maria Magdalena Kediri
              </p>
            </div>

            {/* Quick Access Shortcut Buttons */}
            <div className="space-y-2">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-red-800 text-center">
                Tombol Pintas Akses Cepat
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleQuickWarga}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ${
                    username === 'warga'
                      ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white border-red-600 shadow-red-200'
                      : 'bg-red-50/80 hover:bg-red-100 text-red-800 border-red-200'
                  }`}
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span>Login Warga</span>
                </button>

                <button
                  type="button"
                  onClick={handleQuickPengurus}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ${
                    username === 'pengurus'
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white border-orange-600 shadow-orange-200'
                      : 'bg-amber-50/80 hover:bg-amber-100 text-amber-900 border-amber-200'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Login Pengurus</span>
                </button>
              </div>
            </div>

            {/* Alert / Error Message */}
            {errorMsg && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-tight">{errorMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username..."
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-slate-50/50 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password..."
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-slate-50/50 focus:bg-white"
                    required
                  />
                </div>
                {username === 'warga' && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    Password default Warga: <code className="bg-slate-100 px-1 py-0.5 rounded text-orange-700 font-bold">sapa123</code>
                  </p>
                )}
                {username === 'pengurus' && (
                  <p className="text-[10px] text-amber-700 font-medium mt-1">
                    Akses Khusus Pengurus. Masukkan password pengurus Anda.
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-700 hover:to-orange-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-red-600/20 hover:shadow-lg transition-all transform active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{isLoading ? 'Memproses Login...' : 'Masuk ke Aplikasi SAPA'}</span>
              </button>
            </form>

            {/* Footer Action */}
            <div className="pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={onOpenUbahPassword}
                className="text-xs font-extrabold text-red-600 hover:text-orange-700 transition-colors inline-flex items-center gap-1 hover:underline cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Ubah / Lupa Password?</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
