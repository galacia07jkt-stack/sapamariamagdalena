import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Download, 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle,
  Lock,
  KeyRound
} from 'lucide-react';
import { 
  downloadEncryptedVault, 
  restoreFromEncryptedVault 
} from '../utils/storage';
import { SapaLogo } from './SapaLogo';

interface EnkripsiSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored: () => void;
  isAdmin?: boolean;
  onOpenLogin?: () => void;
}

export const EnkripsiSecurityModal: React.FC<EnkripsiSecurityModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
  isAdmin = false,
  onOpenLogin,
}) => {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Jika bukan admin, tolak akses dan arahkan ke login admin
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-orange-500 shadow-2xl max-w-md w-full overflow-hidden p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto border border-orange-300">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Akses Enkripsi Dibatasi (Hanya Admin)
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Modul keamanan & arsip kriptografi AES-256 Paroki St. Vincentius a Paulo Kediri bersifat tertutup dan <strong>hanya dapat dibuka melalui hak akses Administrator resmi</strong>.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 min-h-[44px]"
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenLogin) onOpenLogin();
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <KeyRound className="w-4 h-4" />
              <span>Login Admin</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleBackupDownload = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      await downloadEncryptedVault();
      setStatusMessage({
        type: 'success',
        text: 'File cadangan arsip terenkripsi (.sapa) berhasil diunduh dan diamankan dengan algoritma AES-256.',
      });
    } catch (err) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: 'Gagal membuat arsip cadangan.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) {
        setStatusMessage({ type: 'error', text: 'File kosong atau tidak terbaca.' });
        setLoading(false);
        return;
      }

      const success = await restoreFromEncryptedVault(content);
      if (success) {
        setStatusMessage({
          type: 'success',
          text: 'Arsip terenkripsi berhasil didekripsi dan seluruh data jemaat berhasil dipulihkan!',
        });
        onDataRestored();
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Gagal memulihkan arsip. Pastikan file valid (.sapa).',
        });
      }
      setLoading(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-orange-500 shadow-2xl max-w-lg w-full my-auto overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-900 text-white p-4 sm:p-5 flex items-center justify-between border-b-4 border-orange-500">
          <div className="flex items-center gap-2.5">
            <SapaLogo size="xs" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">Keamanan & Enkripsi Data Paroki</h3>
              <p className="text-[10px] sm:text-xs text-sky-200">Lingkungan St. Maria Magdalena Semampir Kediri</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-sky-200 hover:text-white hover:bg-white/10 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4">
          
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs sm:text-sm animate-fade-in ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <p>{statusMessage.text}</p>
            </div>
          )}

          {/* Encryption Technical Info */}
          <div className="bg-sky-50/60 p-4 rounded-xl border border-sky-200 space-y-2 text-xs text-slate-700">
            <div className="flex items-center gap-2 font-bold text-sky-950">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Standar Keamanan Informasi: AES-256-GCM</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Data sensus warga dilindungi menggunakan Web Cryptography API dengan standar industri militer AES-GCM 256-bit dan autentikasi tag HMAC, mencegah akses data tanpa izin.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-mono text-sky-900">
              <span className="bg-white px-2 py-0.5 rounded border border-sky-200">Algoritma: AES-GCM</span>
              <span className="bg-white px-2 py-0.5 rounded border border-sky-200">Panjang Kunci: 256-bit</span>
              <span className="bg-white px-2 py-0.5 rounded border border-sky-200">Format Vault: .sapa</span>
            </div>
          </div>

          {/* Action 1: Export Vault */}
          <div className="p-4 rounded-xl border-2 border-slate-200 hover:border-orange-400 transition-all space-y-2">
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-orange-600" />
              <span>Unduh Arsip Cadangan Terenkripsi (.sapa)</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Simpan seluruh database jemaat ke file berkas terenkripsi untuk arsip sekretariat paroki secara berkala.
            </p>
            <button
              onClick={handleBackupDownload}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{loading ? 'Memproses Enkripsi...' : 'Unduh File Vault .sapa'}</span>
            </button>
          </div>

          {/* Action 2: Import Vault */}
          <div className="p-4 rounded-xl border-2 border-slate-200 hover:border-sky-400 transition-all space-y-2">
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-sky-600" />
              <span>Pulihkan Database dari Arsip (.sapa)</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Unggah file arsip .sapa yang valid untuk mengembalikan data jemaat sebelumnya ke sistem ini.
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 font-bold text-xs rounded-xl cursor-pointer transition min-h-[44px]">
              <Upload className="w-4 h-4 text-sky-700" />
              <span>Pilih File .sapa</span>
              <input
                type="file"
                accept=".sapa"
                onChange={handleFileUpload}
                disabled={loading}
                className="hidden"
              />
            </label>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition min-h-[40px]"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
