import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserAccount, ToastMessage } from './types';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { WargaDashboard } from './components/WargaDashboard';
import { PengurusDashboard } from './components/PengurusDashboard';
import { ModalUbahPassword } from './components/ModalUbahPassword';
import { ToastContainer } from './components/ToastContainer';
import { getDb } from './lib/database';

const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 Menit standby

export default function App() {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isUbahPasswordOpen, setIsUbahPasswordOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isDbReady, setIsDbReady] = useState(false);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Timer Idle Auto-Logout jika tidak digunakan selama 10 Menit
  useEffect(() => {
    if (!user) {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      return;
    }

    const resetIdleTimer = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = setTimeout(() => {
        setUser(null);
        addToast('Sesi Anda telah berakhir secara otomatis karena tidak ada aktivitas selama 10 menit.', 'info');
      }, IDLE_TIMEOUT_MS);
    };

    // Listener aktivitas user (mouse, keyboard, sentuhan, scroll, klik)
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, resetIdleTimer, { passive: true });
    });

    // Inisialisasi timer saat user aktif/login
    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, resetIdleTimer);
      });
    };
  }, [user, addToast]);

  // Initialize SQLite database on boot and sync on tab focus
  useEffect(() => {
    getDb()
      .then(() => setIsDbReady(true))
      .catch((err) => {
        console.error('Failed to initialize SQLite database:', err);
        setIsDbReady(true);
      });

    const handleFocusSync = () => {
      if (document.visibilityState === 'visible') {
        getDb().catch((e) => console.error('Error re-syncing on focus:', e));
      }
    };

    window.addEventListener('visibilitychange', handleFocusSync);
    window.addEventListener('focus', handleFocusSync);

    return () => {
      window.removeEventListener('visibilitychange', handleFocusSync);
      window.removeEventListener('focus', handleFocusSync);
    };
  }, []);

  const handleLogout = () => {
    setUser(null);
    addToast('Anda telah keluar dari aplikasi SAPA.', 'info');
  };

  if (!isDbReady) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-600 border-t-transparent mb-3" />
        <p className="text-orange-900 font-bold text-sm">Memuat SQLite Database SAPA...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800 font-sans antialiased selection:bg-orange-500 selection:text-white">
      {/* Header */}
      <Header
        user={user}
        onLogout={handleLogout}
        onOpenUbahPassword={() => setIsUbahPasswordOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {!user ? (
          <LoginPage
            onLoginSuccess={(loggedInUser) => {
              setUser(loggedInUser);
              addToast(`Selamat datang, ${loggedInUser.namaLengkap}!`, 'success');
            }}
            onOpenUbahPassword={() => setIsUbahPasswordOpen(true)}
          />
        ) : user.role === 'pengurus' ? (
          <PengurusDashboard user={user} addToast={addToast} />
        ) : (
          <WargaDashboard user={user} addToast={addToast} />
        )}
      </main>

      {/* Modal Ubah Password */}
      <ModalUbahPassword
        isOpen={isUbahPasswordOpen}
        onClose={() => setIsUbahPasswordOpen(false)}
        defaultUsername={user?.username || 'warga'}
        onSuccessToast={(msg) => addToast(msg, 'success')}
      />

      {/* Toast Notifications Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
