import React, { useState, useEffect } from 'react';
import { UserAccount, ToastMessage } from './types';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { WargaDashboard } from './components/WargaDashboard';
import { PengurusDashboard } from './components/PengurusDashboard';
import { ModalUbahPassword } from './components/ModalUbahPassword';
import { ToastContainer } from './components/ToastContainer';
import { getDb } from './lib/database';

export default function App() {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isUbahPasswordOpen, setIsUbahPasswordOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isDbReady, setIsDbReady] = useState(false);

  // Initialize SQLite database on boot
  useEffect(() => {
    getDb()
      .then(() => setIsDbReady(true))
      .catch((err) => {
        console.error('Failed to initialize SQLite database:', err);
        setIsDbReady(true);
      });
  }, []);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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
