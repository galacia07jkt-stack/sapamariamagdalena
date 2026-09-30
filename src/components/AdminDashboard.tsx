import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Home, 
  Church, 
  Flame, 
  Heart, 
  Baby, 
  GraduationCap, 
  Smile, 
  ShieldCheck,
  TrendingUp,
  MapPin,
  Sliders,
  CheckCircle2,
  Trash2,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { StatistikParoki, WargaKatolik } from '../types';
import { getAppTemperature, setAppTemperature, APP_CONFIG } from '../config/appConfig';
import { kosongkanSemuaWarga, resetKeDataDemo } from '../utils/storage';

interface AdminDashboardProps {
  stats: StatistikParoki;
  wargaList: WargaKatolik[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ stats, wargaList }) => {
  const [currentTemp, setCurrentTemp] = useState<number>(getAppTemperature());
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleConfigChange = () => {
      setCurrentTemp(getAppTemperature());
    };
    window.addEventListener('sapa-config-changed', handleConfigChange);
    return () => window.removeEventListener('sapa-config-changed', handleConfigChange);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleTempChange = (newTemp: number) => {
    setAppTemperature(newTemp);
    setCurrentTemp(newTemp);
  };

  const handleClearAll = () => {
    kosongkanSemuaWarga();
    setClearConfirmOpen(false);
    showToast('Database berhasil dikosongkan (0 data).');
  };

  const handleResetDemo = () => {
    resetKeDataDemo();
    showToast('Data demo jemaat berhasil dimuat ulang.');
  };

  return (
    <div className="space-y-6">
      
      {/* Parameter Konfigurasi & Temperature Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-sky-950 rounded-2xl sm:rounded-3xl border-2 border-orange-500 p-4 sm:p-5 text-white shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-400/50 flex items-center justify-center shrink-0">
              <Sliders className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Pengaturan Parameter Sistem & Presisi Input</span>
                <span className="text-[10px] bg-orange-500 text-white font-mono px-1.5 py-0.5 rounded">
                  Aktif
                </span>
              </h3>
              <p className="text-xs text-sky-200 mt-0.5">
                Format Teks: <strong>Title Case (Huruf pertama di setiap kata wajib KAPITAL/BESAR)</strong> • Tanggal: <strong>DD/MM/YYYY</strong>
              </p>
            </div>
          </div>

          {/* Temperature Setting Controls (0.0 / 0.1) */}
          <div className="flex items-center gap-2 bg-sky-950/80 p-1.5 rounded-xl border border-orange-400/30 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-xs font-semibold text-sky-200 pl-2">
              Parameter Temperature:
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => handleTempChange(0.0)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition min-h-[32px] ${
                  currentTemp === 0.0
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-white/10 text-sky-200 hover:bg-white/20'
                }`}
              >
                0.0 (Presisi Penuh)
              </button>
              <button
                type="button"
                onClick={() => handleTempChange(0.1)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition min-h-[32px] ${
                  currentTemp === 0.1
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-white/10 text-sky-200 hover:bg-white/20'
                }`}
              >
                0.1 (Rekomendasi)
              </button>
            </div>
          </div>
        </div>

        {/* Database Management Controls Bar */}
        <div className="mt-4 pt-3.5 border-t border-sky-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-sky-300 font-medium">Status Database Pengurus:</span>
            <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
              stats.totalJiwa > 0 
                ? 'bg-sky-500/30 text-sky-200 border border-sky-400/40' 
                : 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
            }`}>
              {stats.totalJiwa > 0 ? `${stats.totalJiwa} Jiwa Terdaftar (${stats.totalKk} KK)` : 'Bersih (0 Data)'}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {stats.totalJiwa > 0 ? (
              <button
                type="button"
                onClick={() => setClearConfirmOpen(true)}
                className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/40 font-bold transition flex items-center justify-center gap-1.5 min-h-[34px]"
                title="Hapus seluruh data demo untuk mulai dari database bersih (0 data)"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                <span>Kosongkan Database (0 Data)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetDemo}
                className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/40 font-bold transition flex items-center justify-center gap-1.5 min-h-[34px]"
                title="Muat ulang 10 data contoh demo jemaat"
              >
                <RotateCcw className="w-3.5 h-3.5 text-sky-300" />
                <span>Muat Ulang Data Contoh Demo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Zero State Alert for Real Deployment */}
      {stats.totalJiwa === 0 && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm text-emerald-950">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-300">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="text-xs sm:text-sm">
            <h4 className="font-extrabold text-emerald-900 text-sm sm:text-base">
              Database Bersih & Siap Digunakan (0 Data Jemaat)
            </h4>
            <p className="text-emerald-800 mt-1 leading-relaxed">
              Seluruh data demo telah berhasil dibersihkan dari otoritas admin pengurus. Anda dapat langsung menginput data warga jemaat asli Lingkungan St. Maria Magdalena Semampir Kediri via formulir mandiri warga atau panel admin.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Row 1: High Level Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Jiwa */}
        <div className="bg-white rounded-2xl border-2 border-orange-500 shadow-sm p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Jiwa Warga
            </span>
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-sky-950 tracking-tight">
              {stats.totalJiwa}
            </span>
            <span className="text-xs text-slate-500 ml-1 font-semibold">Jiwa</span>
          </div>
          <div className="mt-2 text-xs text-sky-800 flex items-center justify-between font-medium">
            <span>Katolik: <strong>{stats.totalKatolik}</strong></span>
            <span>Non-Katolik: <strong>{stats.totalNonKatolik}</strong></span>
          </div>
          <div className="absolute right-0 bottom-0 w-24 h-1 bg-gradient-to-r from-sky-400 to-orange-500" />
        </div>

        {/* Total Kepala Keluarga */}
        <div className="bg-white rounded-2xl border-2 border-orange-500 shadow-sm p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Kepala Keluarga (KK)
            </span>
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <Home className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-orange-600 tracking-tight">
              {stats.totalKk}
            </span>
            <span className="text-xs text-slate-500 ml-1 font-semibold">Keluarga</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Rerata {(stats.totalJiwa / Math.max(1, stats.totalKk)).toFixed(1)} jiwa / KK
          </div>
          <div className="absolute right-0 bottom-0 w-24 h-1 bg-gradient-to-r from-orange-400 to-amber-500" />
        </div>

        {/* Penerima Sakramen Baptis */}
        <div className="bg-white rounded-2xl border-2 border-sky-300 shadow-sm p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Terdaftar Baptis
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
              <Church className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-sky-800 tracking-tight">
              {stats.totalBaptis}
            </span>
            <span className="text-xs text-slate-500 ml-1 font-semibold">Warga</span>
          </div>
          <div className="mt-2 text-xs text-emerald-700 flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Tercatat Resmi</span>
          </div>
        </div>

        {/* Sakramen Krisma & Komuni */}
        <div className="bg-white rounded-2xl border-2 border-sky-300 shadow-sm p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Komuni & Krisma
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <div>
              <span className="text-2xl font-bold text-slate-800">{stats.totalKomuni}</span>
              <span className="text-[11px] text-slate-500 block">Komuni I</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-2xl font-bold text-orange-600">{stats.totalKrisma}</span>
              <span className="text-[11px] text-slate-500 block">Krisma</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Nikah Katolik: <strong>{stats.totalNikahKatolik} Pasang</strong>
          </div>
        </div>

      </div>

      {/* KPI Cards Row 2: Demografi Usia & Wilayah RT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom 1: Demografi Usia Lingkungan */}
        <div className="bg-white rounded-2xl border-2 border-sky-300 shadow-sm p-5">
          <div className="flex items-center justify-between pb-3 border-b border-sky-100">
            <h3 className="font-bold text-sky-950 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span>Demografi Kelompok Usia</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">Semampir</span>
          </div>

          <div className="space-y-3.5 mt-4">
            {/* BIAK (0-12) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Baby className="w-4 h-4 text-sky-500" />
                  <span>BIAK (Anak 0-12 thn)</span>
                </span>
                <span className="font-mono font-bold text-slate-900">{stats.kelompokUsia.biak} Jiwa</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-sky-400 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.kelompokUsia.biak / Math.max(1, stats.totalJiwa)) * 100}%` }}
                />
              </div>
            </div>

            {/* REKAT (13-17) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Smile className="w-4 h-4 text-cyan-500" />
                  <span>REKAT (Remaja 13-17 thn)</span>
                </span>
                <span className="font-mono font-bold text-slate-900">{stats.kelompokUsia.rekat} Jiwa</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.kelompokUsia.rekat / Math.max(1, stats.totalJiwa)) * 100}%` }}
                />
              </div>
            </div>

            {/* OMK (18-35) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>OMK (Muda 18-35 thn)</span>
                </span>
                <span className="font-mono font-bold text-orange-600">{stats.kelompokUsia.omk} Jiwa</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.kelompokUsia.omk / Math.max(1, stats.totalJiwa)) * 100}%` }}
                />
              </div>
            </div>

            {/* Dewasa (36-59) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <GraduationCap className="w-4 h-4 text-indigo-500" />
                  <span>Dewasa (36-59 thn)</span>
                </span>
                <span className="font-mono font-bold text-slate-900">{stats.kelompokUsia.dewasa} Jiwa</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.kelompokUsia.dewasa / Math.max(1, stats.totalJiwa)) * 100}%` }}
                />
              </div>
            </div>

            {/* Lansia (60+) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>Lansia (60+ thn)</span>
                </span>
                <span className="font-mono font-bold text-slate-900">{stats.kelompokUsia.lansia} Jiwa</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-400 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.kelompokUsia.lansia / Math.max(1, stats.totalJiwa)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Kolom 2: Rasio Gender & Keabsahan Data */}
        <div className="bg-white rounded-2xl border-2 border-sky-300 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-sky-100">
              <h3 className="font-bold text-sky-950 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600" />
                <span>Komposisi Jenis Kelamin</span>
              </h3>
              <span className="text-xs font-semibold text-slate-500">L / P</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-center">
                <span className="text-xs text-sky-700 font-semibold block">Laki-Laki</span>
                <span className="text-2xl font-extrabold text-sky-950 block mt-1">{stats.totalLakiLaki}</span>
                <span className="text-[10px] text-sky-600 font-mono">
                  {stats.totalJiwa > 0 ? Math.round((stats.totalLakiLaki / stats.totalJiwa) * 100) : 0}%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-center">
                <span className="text-xs text-orange-700 font-semibold block">Perempuan</span>
                <span className="text-2xl font-extrabold text-orange-950 block mt-1">{stats.totalPerempuan}</span>
                <span className="text-[10px] text-orange-600 font-mono">
                  {stats.totalJiwa > 0 ? Math.round((stats.totalPerempuan / stats.totalJiwa) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-sky-50/70 rounded-xl border border-sky-200 text-xs text-slate-600">
              <div className="font-semibold text-sky-950 flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Integritas Database Paroki</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Terkoneksi dengan formulir mandiri warga, fitur validasi NIK/KK, serta pengelompokan agama resmi paroki.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Standar Keamanan:</span>
            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              AES-256 GCM
            </span>
          </div>
        </div>

        {/* Kolom 3: Distribusi RT Semampir & Agama */}
        <div className="bg-white rounded-2xl border-2 border-sky-300 shadow-sm p-5">
          <div className="flex items-center justify-between pb-3 border-b border-sky-100">
            <h3 className="font-bold text-sky-950 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span>Sebaran Jemaat per RT Semampir</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">Semampir</span>
          </div>

          <div className="mt-4 space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {Object.keys(stats.distribusiRt).length === 0 && (
              <div className="py-6 text-center text-slate-400 text-xs">
                Belum ada data RT yang terdaftar.
              </div>
            )}
            {Object.entries(stats.distribusiRt).map(([rt, count]) => {
              const pct = stats.totalJiwa > 0 ? Math.round((count / stats.totalJiwa) * 100) : 0;
              return (
                <div 
                  key={rt} 
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-sky-50 transition border border-slate-100"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span className="text-xs font-bold text-slate-800">{rt}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-sky-900">{count} Jiwa</span>
                    <span className="text-[10px] bg-white px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-orange-50 rounded-xl border border-orange-200 text-xs text-orange-900 space-y-2">
            <div className="flex items-center justify-between font-bold">
              <span>Rekap Agama Warga:</span>
              <span className="text-orange-800">{stats.totalKatolik} Katolik ({stats.totalJiwa > 0 ? Math.round((stats.totalKatolik / stats.totalJiwa) * 100) : 0}%)</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {Object.entries(stats.distribusiAgama || {}).map(([agm, count]) => {
                if (count === 0) return null;
                return (
                  <span key={agm} className="bg-white/80 border border-orange-300 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-800">
                    {agm}: <strong>{count}</strong>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Kosongkan Seluruh Data / Hapus Demo Modal */}
      {clearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-rose-500 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-7 h-7" />
            </div>
            <div className="text-center">
              <h4 className="font-extrabold text-slate-900 text-lg">
                Kosongkan Seluruh Data ({stats.totalJiwa} Jiwa)?
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Tindakan ini akan <strong>menghapus seluruh data demo / jemaat</strong> dari database pengurus sehingga jumlah jiwa menjadi <strong>0</strong>.
              </p>
              <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-left text-xs text-amber-900">
                <span className="font-bold block mb-1">💡 Mengapa Opsi Ini Disediakan?</span>
                Agar pengurus/admin dapat membersihkan database demo sebelum memasukkan data jemaat yang asli. Anda dapat memuat ulang data demo kapan saja.
              </div>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setClearConfirmOpen(false)}
                className="flex-1 py-3 rounded-xl border-2 border-slate-300 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md min-h-[44px] flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Kosongkan Semua (0 Data)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-sky-950 text-white px-4 py-3 rounded-2xl shadow-xl border-2 border-orange-500 flex items-center gap-3 animate-fade-in max-w-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}

    </div>
  );
};
