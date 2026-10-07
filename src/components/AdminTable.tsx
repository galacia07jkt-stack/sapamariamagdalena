import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Printer, 
  Download,
  AlertTriangle,
  LayoutGrid,
  List,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Share2,
  QrCode
} from 'lucide-react';
import { WargaKatolik, AgamaType } from '../types';
import { exportWargaToExcel } from '../utils/excelExport';
import { hapusWarga, updateWarga, kosongkanSemuaWarga, resetKeDataDemo, syncWithServer } from '../utils/storage';
import { urutkanWargaSusunanKeluarga } from '../utils/familySort';
import { SapaLogo } from './SapaLogo';
import { HimpunDataModal } from './HimpunDataModal';

interface AdminTableProps {
  wargaList: WargaKatolik[];
  onAddNew: () => void;
  onEdit: (warga: WargaKatolik) => void;
  onViewBukti: (warga: WargaKatolik) => void;
}

export const AdminTable: React.FC<AdminTableProps> = ({
  wargaList,
  onAddNew,
  onEdit,
  onViewBukti,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRt, setFilterRt] = useState('ALL');
  const [filterAgama, setFilterAgama] = useState('ALL');
  const [filterVerif, setFilterVerif] = useState('ALL');
  const [filterSakramen, setFilterSakramen] = useState('ALL');
  const [isExporting, setIsExporting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [clearAllModalOpen, setClearAllModalOpen] = useState(false);
  const [autoExportEnabled, setAutoExportEnabled] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [himpunModalOpen, setHimpunModalOpen] = useState(false);

  const agamaList: AgamaType[] = [
    'Katolik',
    'Islam',
    'Hindu',
    'Buddha',
    'Protestan',
    'Kepercayaan',
  ];

  // Extract unique RT list
  const rtOptions = useMemo(() => {
    const set = new Set<string>();
    wargaList.forEach((w) => {
      if (w.rtRw) set.add(w.rtRw);
    });
    return Array.from(set).sort();
  }, [wargaList]);

  // Filtered list
  const filteredList = useMemo(() => {
    const filtered = wargaList.filter((warga) => {
      // 1. Search keyword
      const keyword = searchTerm.trim().toLowerCase();
      const matchSearch =
        !keyword ||
        (warga.namaLengkap && warga.namaLengkap.toLowerCase().includes(keyword)) ||
        (warga.namaBaptis && warga.namaBaptis.toLowerCase().includes(keyword)) ||
        (warga.nik && warga.nik.toLowerCase().includes(keyword)) ||
        (warga.noKk && warga.noKk.toLowerCase().includes(keyword)) ||
        (warga.alamatDomisili && warga.alamatDomisili.toLowerCase().includes(keyword)) ||
        (warga.noSuratBaptis && warga.noSuratBaptis.toLowerCase().includes(keyword));

      // 2. Filter RT
      const matchRt = filterRt === 'ALL' || warga.rtRw === filterRt;

      // 3. Filter Agama
      const wargaAgama = warga.agama || 'Katolik';
      const matchAgama = filterAgama === 'ALL' || wargaAgama === filterAgama;

      // 4. Filter Status Verifikasi
      const matchVerif = filterVerif === 'ALL' || warga.statusVerifikasi === filterVerif;

      // 5. Filter Sakramen
      let matchSakramen = true;
      if (filterSakramen === 'KOMUNI') {
        matchSakramen = !!warga.sakramenLain?.komuniPertama;
      } else if (filterSakramen === 'KRISMA') {
        matchSakramen = !!warga.sakramenLain?.krisma;
      } else if (filterSakramen === 'NIKAH') {
        matchSakramen = warga.statusPerkawinan === 'Menikah Katolik';
      }

      return matchSearch && matchRt && matchAgama && matchVerif && matchSakramen;
    });

    // Susun secara hierarki resmi: Kepala Keluarga -> Istri -> Anak -> Anggota Lainnya
    return urutkanWargaSusunanKeluarga(filtered);
  }, [wargaList, searchTerm, filterRt, filterAgama, filterVerif, filterSakramen]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 3500);
  };

  const handleExportExcel = async (listToExport: WargaKatolik[], noteTitle?: string) => {
    try {
      setIsExporting(true);
      await exportWargaToExcel(listToExport, noteTitle);
    } catch (err) {
      console.error('Gagal export excel:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleManualRefresh = async () => {
    try {
      setIsRefreshing(true);
      const data = await syncWithServer(true);
      showToast(`Berhasil menarik data terbaru dari server: ${data.length} warga tercatat.`);
    } catch (err) {
      showToast('Gagal menarik data dari server pusat. Silakan periksa koneksi internet.');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleToggleVerifikasi = async (warga: WargaKatolik) => {
    const nextStatus: 'Terverifikasi' | 'Menunggu Verifikasi' =
      warga.statusVerifikasi === 'Terverifikasi'
        ? 'Menunggu Verifikasi'
        : 'Terverifikasi';

    const result = await updateWarga(warga.id, { statusVerifikasi: nextStatus });
    if (result) {
      showToast(`Status ${warga.namaLengkap} berhasil diubah ke: ${nextStatus}`);
    } else {
      showToast(`Status berhasil diperbarui: ${nextStatus}`);
    }

    if (autoExportEnabled) {
      handleExportExcel(wargaList, 'Auto Export Setelah Verifikasi');
    }
  };

  const handleDelete = async (id: string) => {
    const success = await hapusWarga(id);
    setDeleteConfirmId(null);
    if (success) {
      showToast('1 Data jemaat berhasil dihapus permanen dari server.');
    }
  };

  const handleKosongkanSemua = async () => {
    await kosongkanSemuaWarga();
    setClearAllModalOpen(false);
    showToast('Seluruh data demo/jemaat telah berhasil dibersihkan (Database: 0 data).');
  };

  const handleResetDemo = async () => {
    await resetKeDataDemo();
    showToast('Data contoh demo (10 jemaat) berhasil dimuat ulang.');
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-orange-500 shadow-md overflow-hidden relative">
      
      {/* Top Header of Table */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 border-b-4 border-orange-500">
        <div className="flex items-center gap-3">
          <SapaLogo size="sm" />
          <div>
            <h2 className="text-base sm:text-xl font-bold tracking-tight">
              Tabel & Pelaporan Jemaat
            </h2>
            <p className="text-[11px] sm:text-xs text-sky-200 mt-0.5">
              St. Maria Magdalena Semampir • Paroki St. Vincentius a Paulo Kediri
            </p>
          </div>
        </div>

        {/* Action Buttons: Himpun Data, Tarik Data Server, Add Warga, Export Excel */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Tombol Utama: Tarik & Himpun Data dari HP Warga */}
          <button
            onClick={() => setHimpunModalOpen(true)}
            className="flex-1 md:flex-none px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md border-2 border-emerald-300 flex items-center justify-center gap-1.5 transition min-h-[44px] cursor-pointer"
            title="Tarik & himpun data yang diinput warga (via WhatsApp, Scan QR HP Warga, atau Berkas)"
          >
            <Share2 className="w-4 h-4 text-emerald-100" />
            <span>Himpun Data Warga</span>
          </button>

          {/* Tombol Refresh / Tarik Data dari Server */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex-1 md:flex-none px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs border border-amber-400 flex items-center justify-center gap-1.5 transition min-h-[44px] cursor-pointer disabled:opacity-70"
            title="Tarik & perbarui data terbaru dari server pusat (sinkronisasi antar HP/Laptop)"
          >
            <RefreshCw className={`w-4 h-4 text-amber-100 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Menarik Data...' : 'Tarik Data Server'}</span>
          </button>

          <button
            onClick={onAddNew}
            className="flex-1 md:flex-none px-3.5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs border border-sky-400 flex items-center justify-center gap-1.5 transition min-h-[44px]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Warga</span>
          </button>

          <button
            onClick={() => handleExportExcel(filteredList)}
            disabled={isExporting || filteredList.length === 0}
            className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md border border-emerald-400 flex items-center justify-center gap-2 transition disabled:opacity-50 min-h-[44px]"
            title="Download Excel dengan Kolom Agama & Border Rapi"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>{isExporting ? 'Exporting...' : `Export Excel (${filteredList.length})`}</span>
          </button>

          {wargaList.length > 0 ? (
            <button
              onClick={() => setClearAllModalOpen(true)}
              className="px-3.5 py-2.5 bg-rose-700/80 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl border border-rose-400 flex items-center justify-center gap-1.5 transition min-h-[44px]"
              title="Hapus / Kosongkan seluruh data demo dari database untuk mulai dari 0"
            >
              <Trash2 className="w-4 h-4 text-rose-200" />
              <span className="hidden sm:inline">Kosongkan Database (0 Data)</span>
              <span className="sm:hidden">Kosongkan</span>
            </button>
          ) : (
            <button
              onClick={handleResetDemo}
              className="px-3.5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs sm:text-sm rounded-xl border border-sky-300 flex items-center justify-center gap-1.5 transition min-h-[44px]"
              title="Muat ulang 10 data contoh demo"
            >
              <RotateCcw className="w-4 h-4 text-sky-100" />
              <span>Muat Data Demo</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 sm:p-4 bg-sky-50/70 border-b border-sky-100 flex flex-col gap-3">
        
        {/* Search Input & View Toggle */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari Nama, NIK, No. KK, Alamat, No Surat..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-base sm:text-sm bg-white min-h-[44px]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          </div>

          {/* Toggle View Mode (Cards vs Table) */}
          <div className="flex border border-slate-300 bg-white rounded-xl p-0.5 shrink-0">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                viewMode === 'cards' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kartu</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                viewMode === 'table' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Tampilan Tabel Lengkap"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Tabel</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns including Agama */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 text-xs">
          
          {/* Agama Filter */}
          <select
            value={filterAgama}
            onChange={(e) => setFilterAgama(e.target.value)}
            className="w-full sm:w-auto px-2.5 py-2.5 rounded-xl border-2 border-orange-300 bg-white text-slate-900 font-bold focus:ring-2 focus:ring-orange-200 min-h-[44px]"
          >
            <option value="ALL">Semua Agama</option>
            {agamaList.map((agm) => (
              <option key={agm} value={agm}>
                {agm}
              </option>
            ))}
          </select>

          {/* RT Filter */}
          <select
            value={filterRt}
            onChange={(e) => setFilterRt(e.target.value)}
            className="w-full sm:w-auto px-2.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-sky-200 min-h-[44px]"
          >
            <option value="ALL">Semua RT/RW</option>
            {rtOptions.map((rt) => (
              <option key={rt} value={rt}>
                {rt}
              </option>
            ))}
          </select>

          {/* Status Verifikasi Filter */}
          <select
            value={filterVerif}
            onChange={(e) => setFilterVerif(e.target.value)}
            className="w-full sm:w-auto px-2.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-sky-200 min-h-[44px]"
          >
            <option value="ALL">Semua Verifikasi</option>
            <option value="Terverifikasi">Terverifikasi</option>
            <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
          </select>

          {/* Sakramen Filter */}
          <select
            value={filterSakramen}
            onChange={(e) => setFilterSakramen(e.target.value)}
            className="w-full sm:w-auto px-2.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-sky-200 min-h-[44px]"
          >
            <option value="ALL">Semua Sakramen</option>
            <option value="KOMUNI">Sudah Komuni 1</option>
            <option value="KRISMA">Sudah Krisma</option>
            <option value="NIKAH">Sudah Perkawinan</option>
          </select>

          {/* Auto Export Toggle */}
          <label className="col-span-2 sm:col-span-1 flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2.5 bg-white rounded-xl border border-orange-300 cursor-pointer select-none text-xs font-bold text-orange-950 min-h-[44px]">
            <input
              type="checkbox"
              checked={autoExportEnabled}
              onChange={(e) => setAutoExportEnabled(e.target.checked)}
              className="w-4 h-4 text-orange-600 rounded border-slate-300"
            />
            <span>Auto Export Excel</span>
          </label>
        </div>
      </div>

      {/* STATE 1: DATABASE BERSIH / KOSONG (0 DATA) */}
      {wargaList.length === 0 ? (
        <div className="py-16 px-4 text-center bg-slate-50/60">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 border-2 border-emerald-300 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-base sm:text-xl font-extrabold text-slate-900">
            Database Bersih & Kosong (0 Data Jemaat)
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1.5 mb-6 leading-relaxed">
            Data demo telah berhasil dibersihkan dari otoritas admin pengurus. Database kini bersih dan siap untuk penginputan data jemaat asli Lingkungan St. Maria Magdalena Semampir Kediri.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onAddNew}
              className="px-5 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow border border-sky-400 flex items-center gap-2 min-h-[44px]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Input Data Warga Baru</span>
            </button>
            <button
              onClick={handleResetDemo}
              className="px-4 py-3 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl border border-slate-300 flex items-center gap-2 min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Muat Ulang Data Contoh Demo</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* VIEW MODE 1: MOBILE CARDS VIEW */}
          {viewMode === 'cards' && (
            <div className="p-3 sm:p-5">
              {filteredList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {filteredList.map((warga) => {
                    const isKatolik = (warga.agama || 'Katolik') === 'Katolik';
                    return (
                      <div
                        key={warga.id}
                        className="bg-white rounded-2xl border-2 border-slate-200 hover:border-orange-400 p-4 shadow-xs space-y-3 transition"
                      >
                        {/* Top Row: Names & Verification */}
                        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border ${
                                isKatolik
                                  ? 'bg-orange-50 text-orange-900 border-orange-300'
                                  : 'bg-slate-100 text-slate-800 border-slate-300'
                              }`}>
                                {warga.agama || 'Katolik'}
                              </span>

                              {isKatolik && warga.namaBaptis && (
                                <span className="text-xs font-bold text-sky-900 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                                  {warga.namaBaptis}
                                </span>
                              )}
                              <span className="text-xs text-slate-400">({warga.jenisKelamin})</span>
                            </div>
                            <h3 className="font-extrabold text-sm sm:text-base text-sky-950 mt-1">
                              {warga.namaLengkap}
                            </h3>
                            <p className="text-xs text-slate-500 font-mono">
                              NIK: {warga.nik} • KK: {warga.noKk}
                            </p>
                          </div>

                          <button
                            onClick={() => handleToggleVerifikasi(warga)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${
                              warga.statusVerifikasi === 'Terverifikasi'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            {warga.statusVerifikasi === 'Terverifikasi' ? '✓ Terverifikasi' : '⏳ Menunggu'}
                          </button>
                        </div>

                        {/* Middle Info: Tempat & Tgl Lahir, Baptis, Hub Keluarga, RT */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-sky-50/60 p-2.5 rounded-xl border border-sky-100">
                            <span className="text-slate-500 block text-[10px] font-semibold">Tempat & Tgl Lahir</span>
                            <span className="font-bold text-sky-950 block truncate">
                              {warga.tempatLahir || '-'}
                            </span>
                            <span className="text-slate-600 font-mono block text-[11px]">
                              {warga.tanggalLahir || '-'}
                            </span>
                          </div>

                          <div className="bg-orange-50/50 p-2.5 rounded-xl border border-orange-100">
                            <span className="text-slate-500 block text-[10px] font-semibold">
                              {isKatolik ? 'Surat & Tgl Baptis' : 'Hub. Keluarga & RT'}
                            </span>
                            {isKatolik ? (
                              <>
                                <span className="font-mono font-bold text-sky-950 block truncate text-[11px]">
                                  {warga.noSuratBaptis || '-'}
                                </span>
                                <span className="text-slate-500 block text-[10px]">
                                  Baptis: {warga.tanggalBaptis || '-'}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="font-bold text-sky-950 block">
                                  {warga.hubunganKeluarga}
                                </span>
                                <span className="text-orange-700 font-semibold block text-[11px]">
                                  {warga.rtRw}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Actions Bar */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex gap-1">
                            {isKatolik ? (
                              <>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${warga.sakramenLain?.komuniPertama ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                                  Komuni: {warga.sakramenLain?.komuniPertama ? '✓' : '✗'}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${warga.sakramenLain?.krisma ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                                  Krisma: {warga.sakramenLain?.krisma ? '✓' : '✗'}
                                </span>
                              </>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                Non-Katolik
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onViewBukti(warga)}
                              title="Cetak Bukti"
                              className="p-2 text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-xl transition min-h-[40px] min-w-[40px] flex items-center justify-center"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => onEdit(warga)}
                              title="Edit Data"
                              className="p-2 text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-xl transition min-h-[40px] min-w-[40px] flex items-center justify-center"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setDeleteConfirmId(warga.id)}
                              title="Hapus Data"
                              className="p-2 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition min-h-[40px] min-w-[40px] flex items-center justify-center"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">Tidak ada data warga yang sesuai kriteria pencarian/filter.</p>
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE 2: FULL TABLE VIEW WITH AGAMA COLUMN */}
          {viewMode === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-sky-100/90 text-sky-950 font-bold uppercase tracking-wider border-b-2 border-orange-400">
                    <th className="py-3 px-2 text-center border-r border-sky-200 w-10">No</th>
                    <th className="py-3 px-3 border-r border-sky-200 min-w-[170px]">No. KK & NIK</th>
                    <th className="py-3 px-2.5 text-center border-r border-sky-200 min-w-[100px]">Agama</th>
                    <th className="py-3 px-3 border-r border-sky-200 min-w-[200px]">Nama Baptis & Lengkap</th>
                    <th className="py-3 px-2 text-center border-r border-sky-200 w-10">L/P</th>
                    <th className="py-3 px-3 border-r border-sky-200 min-w-[140px]">Tempat & Tgl Lahir</th>
                    <th className="py-3 px-3 border-r border-sky-200 min-w-[130px]">Hub. Keluarga</th>
                    <th className="py-3 px-3 border-r border-sky-200 min-w-[180px]">Alamat & RT Semampir</th>
                    <th className="py-3 px-3 border-r border-sky-200 min-w-[170px]">Sakramen Baptis</th>
                    <th className="py-3 px-2 text-center border-r border-sky-200 min-w-[100px]">Sakramen</th>
                    <th className="py-3 px-2 text-center border-r border-sky-200 min-w-[120px]">Status</th>
                    <th className="py-3 px-2 text-center min-w-[120px]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredList.length > 0 ? (
                    filteredList.map((warga, idx) => {
                      const isKatolik = (warga.agama || 'Katolik') === 'Katolik';
                      return (
                        <tr
                          key={warga.id}
                          className="hover:bg-amber-50/50 transition-colors group"
                        >
                          <td className="py-3 px-2 text-center border-r border-slate-100 font-mono text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3 border-r border-slate-100">
                            <div className="font-mono font-bold text-sky-950">{warga.noKk}</div>
                            <div className="font-mono text-slate-500 text-[11px]">{warga.nik}</div>
                          </td>
                          <td className="py-3 px-2 text-center border-r border-slate-100 font-bold">
                            <span className={`px-2 py-0.5 rounded text-[10px] border ${
                              isKatolik ? 'bg-orange-50 text-orange-900 border-orange-300' : 'bg-slate-100 text-slate-800 border-slate-300'
                            }`}>
                              {warga.agama || 'Katolik'}
                            </span>
                          </td>
                          <td className="py-3 px-3 border-r border-slate-100">
                            {isKatolik && warga.namaBaptis && (
                              <span className="text-[11px] font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 inline-block mb-0.5">
                                {warga.namaBaptis}
                              </span>
                            )}
                            <div className="font-extrabold text-sky-950 text-xs sm:text-sm">
                              {warga.namaLengkap}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center border-r border-slate-100 font-bold text-slate-700">
                            {warga.jenisKelamin}
                          </td>
                          <td className="py-3 px-3 border-r border-slate-100">
                            <div className="font-semibold text-slate-900 text-xs">{warga.tempatLahir || '-'}</div>
                            <div className="text-slate-500 font-mono text-[11px]">{warga.tanggalLahir || '-'}</div>
                          </td>
                          <td className="py-3 px-3 border-r border-slate-100 font-semibold text-slate-800">
                            {warga.hubunganKeluarga}
                          </td>
                          <td className="py-3 px-3 border-r border-slate-100">
                            <div className="font-semibold text-slate-900">{warga.alamatDomisili}</div>
                            <div className="text-orange-700 font-bold text-[11px]">{warga.rtRw}</div>
                          </td>
                          <td className="py-3 px-3 border-r border-slate-100">
                            {isKatolik ? (
                              <>
                                <div className="font-mono font-bold text-sky-950 text-[11px]">
                                  {warga.noSuratBaptis || '-'}
                                </div>
                                <div className="text-slate-500 text-[10px]">
                                  Baptis: {warga.tanggalBaptis || '-'}
                                </div>
                              </>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center border-r border-slate-100">
                            {isKatolik ? (
                              <div className="flex flex-col gap-0.5">
                                <span className={`text-[9px] font-bold px-1 rounded ${warga.sakramenLain?.komuniPertama ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                                  Kom: {warga.sakramenLain?.komuniPertama ? '✓' : '✗'}
                                </span>
                                <span className={`text-[9px] font-bold px-1 rounded ${warga.sakramenLain?.krisma ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                                  Kri: {warga.sakramenLain?.krisma ? '✓' : '✗'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center border-r border-slate-100">
                            <button
                              onClick={() => handleToggleVerifikasi(warga)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                                warga.statusVerifikasi === 'Terverifikasi'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                            >
                              {warga.statusVerifikasi === 'Terverifikasi' ? '✓ Terverifikasi' : '⏳ Menunggu'}
                            </button>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onViewBukti(warga)}
                                className="p-1.5 text-sky-700 hover:bg-sky-100 rounded-lg"
                                title="Cetak Bukti"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onEdit(warga)}
                                className="p-1.5 text-orange-600 hover:bg-orange-100 rounded-lg"
                                title="Edit Data"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(warga.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg"
                                title="Hapus Data"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-slate-500">
                        Tidak ada data warga yang sesuai kriteria pencarian/filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Table Footer with Summary */}
      <div className="p-3.5 sm:p-4 bg-sky-50/90 border-t-2 border-orange-400 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-700 gap-2.5">
        <div className="font-semibold text-center sm:text-left">
          Menampilkan <span className="text-orange-700 font-extrabold">{filteredList.length}</span> dari <span className="text-sky-950 font-extrabold">{wargaList.length}</span> warga terdaftar.
        </div>
        <button
          onClick={() => handleExportExcel(filteredList)}
          disabled={filteredList.length === 0}
          className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-sky-100 text-sky-950 font-bold rounded-xl border border-sky-300 flex items-center justify-center gap-1.5 shadow-xs transition disabled:opacity-50 min-h-[44px]"
        >
          <Download className="w-4 h-4 text-orange-600" />
          <span>Unduh Laporan Excel (Kolom Agama & Border Rapi)</span>
        </button>
      </div>

      {/* Single Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border-2 border-rose-500 shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-slate-800 text-base">Hapus Data Warga?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Data jemaat yang dihapus akan terhapus permanen dari database.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow min-h-[44px]"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kosongkan Seluruh Data / Hapus Demo Modal */}
      {clearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-rose-500 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-7 h-7" />
            </div>
            <div className="text-center">
              <h4 className="font-extrabold text-slate-900 text-lg">
                Kosongkan Seluruh Data ({wargaList.length} Jemaat)?
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Tindakan ini akan <strong>menghapus bersih seluruh data demo / jemaat</strong> yang ada di database pengurus sehingga jumlah warga menjadi <strong>0</strong>.
              </p>
              <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-left text-xs text-amber-900">
                <span className="font-bold block mb-1">💡 Petunjuk Pengurus / Admin:</span>
                Gunakan opsi ini agar database bersih dan bebas dari nama demo, sehingga Anda bisa menginput data jemaat yang asli. Anda tetap dapat memuat ulang data demo kapan saja jika diperlukan.
              </div>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setClearAllModalOpen(false)}
                className="flex-1 py-3 rounded-xl border-2 border-slate-300 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleKosongkanSemua}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md min-h-[44px] flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Bersihkan Semua (0 Data)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Himpun Data Warga dari HP / WhatsApp / Scan QR */}
      <HimpunDataModal
        isOpen={himpunModalOpen}
        onClose={() => setHimpunModalOpen(false)}
        onDataImported={(cnt) => {
          showToast(`Berhasil menghimpun ${cnt} data jemaat ke database admin!`);
          syncWithServer(true);
        }}
      />

      {/* Floating Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-sky-950 text-white px-4 py-3 rounded-2xl shadow-xl border-2 border-orange-500 flex items-center gap-3 animate-fade-in max-w-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{successToast}</span>
        </div>
      )}

    </div>
  );
};
