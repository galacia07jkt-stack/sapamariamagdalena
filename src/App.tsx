import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { FormInputWarga } from './components/FormInputWarga';
import { CekUlangWarga } from './components/CekUlangWarga';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminTable } from './components/AdminTable';
import { AdminLoginModal } from './components/AdminLoginModal';
import { EditWargaModal } from './components/EditWargaModal';
import { BuktiRegistrasiModal } from './components/BuktiRegistrasiModal';
import { EnkripsiSecurityModal } from './components/EnkripsiSecurityModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { WargaKatolik, StatistikParoki } from './types';
import { 
  getStoredWarga, 
  hitungStatistikParoki, 
  isAdminAuthenticated, 
  logoutAdmin,
  syncWithServer,
  initStorageFromIndexedDb,
  subscribeToWargaFirestore,
  saveStoredWarga 
} from './utils/storage';
import { 
  ShieldCheck, 
  MapPin, 
  Phone, 
  FileSpreadsheet, 
  CheckCircle2,
  Wifi,
  RefreshCw
} from 'lucide-react';

export default function App() {
  const [wargaList, setWargaList] = useState<WargaKatolik[]>([]);
  const [activeTab, setActiveTab] = useState<'input' | 'cek' | 'admin'>('input');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [securityVaultOpen, setSecurityVaultOpen] = useState(false);
  const [editingWarga, setEditingWarga] = useState<WargaKatolik | null>(null);
  const [viewingBukti, setViewingBukti] = useState<WargaKatolik | null>(null);
  const [buktiMode, setBuktiMode] = useState<'registration' | 'admin'>('registration');
  const [isServerOnline, setIsServerOnline] = useState<boolean>(true);

  // Sync data from storage & server
  const refreshData = () => {
    const data = getStoredWarga();
    setWargaList(data);
    setIsAdmin(isAdminAuthenticated());
  };

  useEffect(() => {
    refreshData();

    // 0. Pulihkan dari IndexedDB jika localStorage kosong setelah restart/hari baru
    initStorageFromIndexedDb().then((idbData) => {
      if (idbData && idbData.length > 0) {
        setWargaList(idbData);
      }
    });

    // 1. Initial sync dengan Database Online Firestore
    syncWithServer()
      .then((data) => {
        setWargaList(data);
        setIsServerOnline(true);
      })
      .catch(() => {
        setIsServerOnline(false);
      });

    // 2. REAL-TIME PUSH SUBSCRIPTION CLOUD FIRESTORE:
    // Setiap kali warga di HP mana pun menekan 'Simpan Data', 
    // data langsung otomatis masuk dan muncul di layar admin seketika tanpa perlu reload!
    const unsubscribeFirestore = subscribeToWargaFirestore(
      (onlineData) => {
        if (onlineData && Array.isArray(onlineData)) {
          console.log(`[SAPA Realtime] Pembaruan diterima: ${onlineData.length} jemaat.`);
          setWargaList(onlineData);
          saveStoredWarga(onlineData);
          setIsServerOnline(true);
        }
      },
      () => {
        setIsServerOnline(false);
      }
    );

    // 3. Fallback Auto-Polling setiap 5 detik
    const pollingInterval = setInterval(() => {
      syncWithServer()
        .then((data) => {
          setWargaList(data);
          setIsServerOnline(true);
        })
        .catch(() => {
          setIsServerOnline(false);
        });
    }, 5000);

    // 4. Listener perubahan saat tab/layar diaktifkan kembali
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncWithServer().then((data) => setWargaList(data));
      }
    };

    const handleFocus = () => {
      syncWithServer().then((data) => setWargaList(data));
    };

    const handleUpdate = () => {
      refreshData();
    };

    const handleAuth = () => {
      setIsAdmin(isAdminAuthenticated());
    };

    window.addEventListener('sapa-warga-updated', handleUpdate);
    window.addEventListener('sapa-auth-changed', handleAuth);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      unsubscribeFirestore();
      clearInterval(pollingInterval);
      window.removeEventListener('sapa-warga-updated', handleUpdate);
      window.removeEventListener('sapa-auth-changed', handleAuth);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const stats: StatistikParoki = React.useMemo(() => {
    return hitungStatistikParoki(wargaList);
  }, [wargaList]);

  // Handle citizen registration success: Warga Input Mandiri
  const handleWargaRegistered = (newWarga: WargaKatolik) => {
    refreshData();
    setBuktiMode('registration'); // Mode Registrasi Warga: Tombol adalah "Selesai & Kembali ke Form"
    setViewingBukti(newWarga);
    syncWithServer();
  };

  // Handle admin login success
  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    setActiveTab('admin');
  };

  // Handle logout
  const handleLogout = () => {
    logoutAdmin();
    setIsAdmin(false);
    setSecurityVaultOpen(false);
    if (activeTab === 'admin') {
      setActiveTab('input');
    }
  };

  // Enkripsi hanya bisa dibuka hanya di akses admin
  const handleOpenSecurityVault = () => {
    if (isAdmin) {
      setSecurityVaultOpen(true);
    } else {
      setLoginModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-sky-50/50 text-slate-800 selection:bg-orange-100 selection:text-orange-900">
      
      {/* Top Parish Navigation Bar with Official SAPA Logo */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'admin' && !isAdmin) {
            setLoginModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        isAdmin={isAdmin}
        onOpenLogin={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenSecurityVault={handleOpenSecurityVault}
        totalJiwa={stats.totalJiwa}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
        
        {/* Status Indikator Sinkronisasi Database Online Real-Time untuk Admin */}
        {isAdmin && activeTab === 'admin' && (
          <div className="mb-4 px-3.5 py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-950 shadow-xs">
            <div className="flex items-center gap-2 font-medium">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span>
                <strong>Database Online Real-Time Aktif (Cloud Firestore):</strong> Terkoneksi ke satu database cloud terpadu. Setiap input dari HP warga mana pun langsung masuk secara otomatis dan termonitor di layar admin seketika.
              </span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => {
                  syncWithServer(true).then((data) => setWargaList(data));
                }}
                className="flex items-center gap-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                title="Tarik pembaruan data dari database online sekarang"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Segarkan Data</span>
              </button>
              <div className="hidden sm:flex items-center gap-1 font-mono text-[11px] text-emerald-800 bg-white/80 border border-emerald-300 px-2 py-0.5 rounded-md font-bold">
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>Online Real-Time</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Pendaftaran Mandiri Warga */}
        {activeTab === 'input' && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            {/* Banner Pemulihan / Deteksi Pendaftaran Mandiri di HP Warga */}
            {!isAdmin && wargaList.length > 0 && (
              <div className="mb-4 p-3.5 bg-gradient-to-r from-sky-50 to-emerald-50 border-2 border-emerald-400 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-sky-950">
                      Data Keluarga Anda Tersimpan di HP Ini ({wargaList.length} Jiwa)
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Terakhir mendaftar: <strong>{wargaList[0].namaLengkap}</strong> ({wargaList[0].rtRw}).
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      setBuktiMode('registration');
                      setViewingBukti(wargaList[0]);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Lihat QR & Bukti</span>
                  </button>
                </div>
              </div>
            )}

            <FormInputWarga onSuccess={handleWargaRegistered} />
          </div>
        )}

        {/* Tab 2: Cek Ulang & Verifikasi Mandiri */}
        {activeTab === 'cek' && (
          <div className="animate-fade-in">
            <CekUlangWarga
              onOpenBukti={(w) => {
                setBuktiMode('registration');
                setViewingBukti(w);
              }}
              onGoToInput={() => setActiveTab('input')}
            />
          </div>
        )}

        {/* Tab 3: Portal Admin & Pelaporan Excel */}
        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-6 sm:space-y-8 animate-fade-in">
            {/* Statistics Section */}
            <AdminDashboard stats={stats} wargaList={wargaList} />

            {/* Excel Reporting & Management Table */}
            <AdminTable
              wargaList={wargaList}
              onAddNew={() => setActiveTab('input')}
              onEdit={(w) => setEditingWarga(w)}
              onViewBukti={(w) => {
                setBuktiMode('admin'); // Akses Admin: Tombol adalah "Cetak / PDF"
                setViewingBukti(w);
              }}
            />
          </div>
        )}

      </main>

      {/* Mobile Bottom Navigation Bar for Android & iPhone */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'admin' && !isAdmin) {
            setLoginModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        isAdmin={isAdmin}
        onOpenLogin={() => setLoginModalOpen(true)}
        onOpenSecurityVault={handleOpenSecurityVault}
      />

      {/* Parish Footer with Official SAPA Logo */}
      <footer className="bg-sky-950 text-white border-t-4 border-orange-500 mt-12 sm:mt-16 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Column 1: Parish Info with New Logo */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white p-0.5 border-2 border-orange-400 overflow-hidden flex items-center justify-center shrink-0">
                  <img
                    src="/logo-sapa.png"
                    alt="Logo SAPA"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg tracking-wide text-orange-400">
                    SAPA ST. MARIA MAGDALENA
                  </h3>
                  <p className="text-xs text-sky-200">
                    Semampir Kota Kediri
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sistem Administrasi dan Pendataan Warga Katolik Lingkungan St. Maria Magdalena Semampir, 
                Paroki St. Vincentius a Paulo Kota Kediri — Keuskupan Surabaya.
              </p>
              <div className="flex items-center gap-2 text-xs text-orange-300 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Enkripsi Kriptografi AES-256 Informasi Jemaat</span>
              </div>
            </div>

            {/* Column 2: Secretariat & Address */}
            <div className="space-y-2 text-xs text-slate-300">
              <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-2">
                Sekretariat & Wilayah
              </h4>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <span>
                  Kelurahan Semampir, Kecamatan Kota, Kota Kediri, Jawa Timur
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <span>
                  Wilayah Paroki St. Vincentius a Paulo Kota Kediri
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <span>
                  Layanan Koordinasi Lingkungan (WhatsApp Pengurus)
                </span>
              </div>
            </div>

            {/* Column 3: Features */}
            <div className="space-y-2.5 text-xs text-slate-300">
              <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-2">
                Fitur & Pelaporan Resmi
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                  <span>Pelaporan Excel Resmi dengan Border Lengkap</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                  <span>Format Teks NIK & No. KK Tanpa Scientific Notation</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                  <span>Responsif di HP Android & iPhone (iOS)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                  <span>Database Centralized: Input HP langsung masuk ke Laptop Admin</span>
                </li>
              </ul>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-sky-900/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-300 gap-2">
            <p className="text-center sm:text-left">
              © {new Date().getFullYear()} SAPA St. Maria Magdalena Semampir Kediri • Hak Cipta: <span className="text-orange-400 font-bold">sisirumah@Stefanus RizkiSBH.</span>
            </p>
            <p className="text-[11px] text-slate-400 text-center sm:text-right">
              Paroki St. Vincentius a Paulo Kota Kediri — Keuskupan Surabaya.
            </p>
          </div>
        </div>
      </footer>

      {/* Admin Login Modal (Secret Password sapa123 without UI hint) */}
      <AdminLoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* Edit Citizen Modal */}
      <EditWargaModal
        warga={editingWarga}
        isOpen={!!editingWarga}
        onClose={() => setEditingWarga(null)}
        onSuccess={() => {
          refreshData();
          syncWithServer();
          setEditingWarga(null);
        }}
      />

      {/* Bukti Registrasi Modal */}
      <BuktiRegistrasiModal
        warga={viewingBukti}
        isOpen={!!viewingBukti}
        onClose={() => {
          setViewingBukti(null);
          setActiveTab('input');
        }}
        mode={buktiMode}
      />

      {/* Security & Encryption Vault Modal (Hanya Akses Admin) */}
      <EnkripsiSecurityModal
        isOpen={securityVaultOpen}
        onClose={() => setSecurityVaultOpen(false)}
        onDataRestored={() => {
          refreshData();
          syncWithServer();
        }}
        isAdmin={isAdmin}
        onOpenLogin={() => setLoginModalOpen(true)}
      />

    </div>
  );
}
