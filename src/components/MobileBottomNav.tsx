import React from 'react';
import { FileText, Search, ShieldCheck, Database, Lock } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'input' | 'cek' | 'admin';
  setActiveTab: (tab: 'input' | 'cek' | 'admin') => void;
  isAdmin: boolean;
  onOpenLogin: () => void;
  onOpenSecurityVault: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  isAdmin,
  onOpenLogin,
  onOpenSecurityVault,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t-2 border-orange-500 shadow-xl px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
        
        {/* Tab 1: Input Data */}
        <button
          onClick={() => setActiveTab('input')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
            activeTab === 'input'
              ? 'bg-sky-50 text-sky-900 font-bold border border-sky-300'
              : 'text-slate-500 hover:text-sky-700 font-medium'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'input' ? 'text-sky-600' : 'text-slate-400'}`}>
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Input Warga</span>
        </button>

        {/* Tab 2: Cek Data */}
        <button
          onClick={() => setActiveTab('cek')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
            activeTab === 'cek'
              ? 'bg-sky-50 text-sky-900 font-bold border border-sky-300'
              : 'text-slate-500 hover:text-sky-700 font-medium'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'cek' ? 'text-orange-500' : 'text-slate-400'}`}>
            <Search className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Cek Status</span>
        </button>

        {/* Tab 3: Admin */}
        <button
          onClick={() => {
            if (isAdmin) {
              setActiveTab('admin');
            } else {
              onOpenLogin();
            }
          }}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
            activeTab === 'admin'
              ? 'bg-orange-50 text-orange-950 font-bold border border-orange-400'
              : 'text-slate-500 hover:text-orange-600 font-medium'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'admin' ? 'text-orange-600' : 'text-slate-400'}`}>
            {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">
            {isAdmin ? 'Admin' : 'Login'}
          </span>
        </button>

        {/* Tab 4: Vault Enkripsi (Hanya Akses Admin) */}
        <button
          onClick={() => {
            if (isAdmin) {
              onOpenSecurityVault();
            } else {
              onOpenLogin();
            }
          }}
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-slate-500 hover:text-sky-700 font-medium transition-all"
        >
          <div className="p-1 rounded-lg text-slate-400">
            {isAdmin ? (
              <Database className="w-5 h-5 text-sky-600" />
            ) : (
              <Lock className="w-5 h-5 text-orange-500" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">
            {isAdmin ? 'Enkripsi' : 'Enkripsi 🔒'}
          </span>
        </button>

      </div>
    </nav>
  );
};
