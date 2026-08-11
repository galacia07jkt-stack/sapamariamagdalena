import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { SapaLogo } from './SapaLogo';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Hapus',
  cancelText = 'Batal',
  variant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        
        {/* Header bar matching modal theme */}
        <div className={`px-5 py-3.5 text-white flex items-center justify-between shadow-sm ${
          variant === 'danger'
            ? 'bg-gradient-to-r from-red-600 to-rose-700'
            : variant === 'warning'
            ? 'bg-gradient-to-r from-amber-500 to-orange-600'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="bg-white p-1 px-2 rounded-xl shadow-sm shrink-0">
              <SapaLogo size="xs" showText={false} />
            </div>
            <span className="font-extrabold text-sm tracking-tight">{title}</span>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex items-start gap-4">
          <div className={`p-3 rounded-2xl shrink-0 ${
            variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-medium">{message}</p>
          </div>
        </div>

        <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              variant === 'danger' 
                ? 'bg-red-600 hover:bg-red-700 active:scale-95' 
                : 'bg-amber-600 hover:bg-amber-700 active:scale-95'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>{isLoading ? 'Memproses...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
