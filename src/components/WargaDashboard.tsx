import React, { useState, useEffect } from 'react';
import { UserAccount, KepalaKeluarga, AnggotaKeluarga, JadwalKegiatan, Inventaris } from '../types';
import {
  getKepalaKeluargaList,
  searchKepalaKeluargaByCitizen,
  getAnggotaKeluargaByKK,
  deleteAnggotaKeluarga,
  getJadwalKegiatanList,
  getDashboardStats,
  getInventarisList
} from '../lib/database';
import { FormKK } from './FormKK';
import { FormAnggotaKeluarga } from './FormAnggotaKeluarga';
import { CetakKKModal } from './CetakKKModal';
import { ConfirmModal } from './ConfirmModal';
import { calculateAge, formatRupiah, getDayName } from '../lib/helpers';
import {
  Search,
  Plus,
  Home,
  User,
  Users,
  Building2,
  CreditCard,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Church,
  Calendar,
  BarChart3,
  Package,
  CheckCircle2,
  AlertTriangle,
  ImageIcon,
  MapPin,
  Clock,
  Printer,
  Megaphone,
  Eye,
  X,
  Maximize2
} from 'lucide-react';

interface WargaDashboardProps {
  user: UserAccount;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const WargaDashboard: React.FC<WargaDashboardProps> = ({ user, addToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<'pencarian' | 'kegiatan' | 'statistik'>('pencarian');

  // Lightbox Modal State & Sub-filter State for Flyer / Pengumuman
  const [selectedFlyerImage, setSelectedFlyerImage] = useState<{ url: string; title: string } | null>(null);
  const [kegiatanCategoryFilter, setKegiatanCategoryFilter] = useState<'Semua' | 'Pengumuman' | 'Jadwal'>('Semua');

  // Search & Family state
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [myFamilies, setMyFamilies] = useState<KepalaKeluarga[]>([]);
  const [familyMembersMap, setFamilyMembersMap] = useState<Record<string, AnggotaKeluarga[]>>({});
  const [expandedKKId, setExpandedKKId] = useState<string | null>(null);

  // Modals for KK & Anggota
  const [isFormKKOpen, setIsFormKKOpen] = useState(false);
  const [selectedKKToEdit, setSelectedKKToEdit] = useState<Partial<KepalaKeluarga> | undefined>(undefined);

  const [isFormAnggotaOpen, setIsFormAnggotaOpen] = useState(false);
  const [selectedKKForAnggota, setSelectedKKForAnggota] = useState<{ id: string; no_kk: string } | null>(null);
  const [selectedAnggotaToEdit, setSelectedAnggotaToEdit] = useState<Partial<AnggotaKeluarga> | undefined>(undefined);

  // Cetak KK Modal State
  const [isCetakModalOpen, setIsCetakModalOpen] = useState(false);
  const [kkToPrint, setKkToPrint] = useState<KepalaKeluarga | null>(null);
  const [membersToPrint, setMembersToPrint] = useState<AnggotaKeluarga[]>([]);

  const handleOpenCetakKK = async (kk: KepalaKeluarga) => {
    setKkToPrint(kk);
    let mems = familyMembersMap[kk.id];
    if (!mems) {
      mems = await getAnggotaKeluargaByKK(kk.id, kk.no_kk);
    }
    setMembersToPrint(mems || []);
    setIsCetakModalOpen(true);
  };

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const requestConfirm = (
    title: string,
    message: string,
    onConfirm: () => Promise<void> | void
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  const closeConfirm = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Kegiatan & Stats State
  const [kegiatanList, setKegiatanList] = useState<JadwalKegiatan[]>([]);
  const [stats, setStats] = useState({
    totalKK: 0,
    totalWarga: 0,
    totalKartuMerah: 0,
    totalKartuBiru: 0,
    totalInventaris: 0,
    totalUnitInventaris: 0,
    inventarisBaikCount: 0,
    inventarisRusakCount: 0
  });
  const [inventarisList, setInventarisList] = useState<Inventaris[]>([]);

  // Citizen search: search KK and members
  const loadCitizenSearch = async (query: string) => {
    const clean = query.trim();
    if (!clean) {
      setMyFamilies([]);
      setHasSearched(false);
      return;
    }

    const results = await searchKepalaKeluargaByCitizen(clean);
    setMyFamilies(results);
    setHasSearched(true);
    if (results.length > 0) {
      setExpandedKKId(results[0].id);
      fetchMembersForKK(results[0].id, results[0].no_kk);
    }
  };

  const loadKegiatanData = async () => {
    const list = await getJadwalKegiatanList();
    setKegiatanList(list);
  };

  const loadStatistikData = async () => {
    const s = await getDashboardStats();
    setStats(s);
    const inv = await getInventarisList();
    setInventarisList(inv);
  };

  useEffect(() => {
    if (user.no_kk) {
      setSearchTerm(user.no_kk);
      loadCitizenSearch(user.no_kk);
    } else {
      loadCitizenSearch('');
    }
  }, [user.no_kk]);

  useEffect(() => {
    if (activeSubTab === 'kegiatan') loadKegiatanData();
    if (activeSubTab === 'statistik') loadStatistikData();
  }, [activeSubTab]);

  useEffect(() => {
    const handleDbUpdate = () => {
      if (searchTerm) loadCitizenSearch(searchTerm);
      if (activeSubTab === 'kegiatan') loadKegiatanData();
      if (activeSubTab === 'statistik') loadStatistikData();
    };

    window.addEventListener('sapa-db-updated', handleDbUpdate);
    return () => {
      window.removeEventListener('sapa-db-updated', handleDbUpdate);
    };
  }, [searchTerm, activeSubTab]);

  const fetchMembersForKK = async (idKK: string, noKK: string) => {
    const members = await getAnggotaKeluargaByKK(idKK, noKK);
    setFamilyMembersMap((prev) => ({ ...prev, [idKK]: members }));
    return members;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      addToast('Ketikkan 6 angka terakhir No. KK atau Nama Kepala Keluarga!', 'info');
      return;
    }
    loadCitizenSearch(searchTerm);
  };

  const handleToggleExpand = (idKK: string, noKK: string) => {
    if (expandedKKId === idKK) {
      setExpandedKKId(null);
    } else {
      setExpandedKKId(idKK);
      fetchMembersForKK(idKK, noKK);
    }
  };

  // Handlers for KK Modal
  const handleOpenAddKK = () => {
    setSelectedKKToEdit(undefined);
    setIsFormKKOpen(true);
  };

  const handleOpenEditKK = (kk: KepalaKeluarga) => {
    setSelectedKKToEdit(kk);
    setIsFormKKOpen(true);
  };

  const handleKKSaved = (kk: KepalaKeluarga) => {
    addToast('Data Kepala Keluarga berhasil disimpan!', 'success');
    loadCitizenSearch(searchTerm);
  };

  // Handlers for Anggota
  const handleOpenAddAnggota = (kk: KepalaKeluarga) => {
    setSelectedKKForAnggota({ id: kk.id, no_kk: kk.no_kk });
    setSelectedAnggotaToEdit(undefined);
    setIsFormAnggotaOpen(true);
  };

  const handleOpenEditAnggota = (kk: KepalaKeluarga, ak: AnggotaKeluarga) => {
    setSelectedKKForAnggota({ id: kk.id, no_kk: kk.no_kk });
    setSelectedAnggotaToEdit(ak);
    setIsFormAnggotaOpen(true);
  };

  const handleAnggotaSaved = (ak: AnggotaKeluarga) => {
    addToast('Data Anggota Keluarga berhasil disimpan!', 'success');
    if (selectedKKForAnggota) {
      fetchMembersForKK(selectedKKForAnggota.id, selectedKKForAnggota.no_kk);
    }
  };

  const handleDeleteAnggota = (idAk: string, idKK: string, noKK: string) => {
    requestConfirm(
      'Konfirmasi Hapus Anggota Keluarga',
      'Apakah Anda yakin ingin menghapus data anggota keluarga ini?',
      async () => {
        try {
          await deleteAnggotaKeluarga(idAk);
          addToast('Data Anggota Keluarga berhasil dihapus.', 'info');
          fetchMembersForKK(idKK, noKK);
        } catch (err) {
          console.error('Error deleting anggota:', err);
          addToast('Gagal menghapus anggota keluarga', 'error');
        } finally {
          closeConfirm();
        }
      }
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Banner Selamat Datang Warga */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-10 pointer-events-none">
          <Church className="w-48 h-48" />
        </div>
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold text-amber-200 border border-white/30 backdrop-blur-xs">
            <ShieldCheck className="w-4 h-4" /> Akses Khusus Warga Lingkungan
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Selamat Datang di Portal Mandiri SAPA
          </h1>
          <p className="text-xs sm:text-sm text-orange-100 leading-relaxed font-medium">
            Pendataan Warga Mandiri Lingkungan St. Maria Magdalena - Paroki St. Vincentius a Paulo Kediri. Anda dapat mencari & mengelola data KK, melihat jadwal kegiatan, foto kegiatan, serta grafik statistik lingkungan.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-orange-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('pencarian')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'pencarian'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'bg-white text-slate-700 hover:bg-orange-50 border border-slate-200'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Pencarian Data Warga</span>
        </button>

        <button
          onClick={() => setActiveSubTab('kegiatan')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'kegiatan'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'bg-white text-slate-700 hover:bg-orange-50 border border-slate-200'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Pengumuman, Flyer & Jadwal</span>
        </button>

        <button
          onClick={() => setActiveSubTab('statistik')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'statistik'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'bg-white text-slate-700 hover:bg-orange-50 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Grafik & Statistik Lingkungan</span>
        </button>
      </div>

      {/* ================= TAB 1: PENCARIAN DATA WARGA ================= */}
      {activeSubTab === 'pencarian' && (
        <div className="space-y-6">
          
          {/* Control Bar: Search & Button Input KK Baru */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-orange-100 space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Ketik 6 angka belakang No. KK atau Nama Kepala Keluarga..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <Search className="w-4 h-4" /> Cari Warga
                </button>
              </form>

              <button
                onClick={handleOpenAddKK}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Input KK Baru</span>
              </button>
            </div>
            
            <p className="text-[11px] text-amber-800 font-semibold flex items-center gap-1.5 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Petunjuk Pencarian: Masukkan <strong>6 angka terakhir dari No. KK</strong> (misal: <code>000001</code>) atau <strong>Nama Kepala Keluarga</strong> (misal: <code>Sugeng</code>).</span>
            </p>
          </div>

          {/* List Cards for Found Families */}
          <div className="space-y-4">
            {myFamilies.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-orange-200 space-y-4">
                <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 mx-auto flex items-center justify-center border border-orange-100">
                  <Search className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="text-slate-800 font-extrabold text-sm">
                    {hasSearched ? `Data Keluarga "${searchTerm}" Tidak Ditemukan` : 'Pencarian Data Kartu Keluarga'}
                  </div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    {hasSearched
                      ? `Tidak ada data keluarga yang sesuai dengan kata kunci "${searchTerm}". Pastikan No. KK atau nama yang Anda ketik sudah sesuai, atau daftarkan KK baru.`
                      : 'Untuk privasi dan keamanan data warga, daftar keluarga tidak ditampilkan secara terbuka. Silakan ketikkan Nomor Kartu Keluarga (No. KK) atau Nama Kepala / Anggota Keluarga Anda pada kolom pencarian di atas.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedKKToEdit({ no_kk: searchTerm.trim() });
                      setIsFormKKOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Input KK Baru {searchTerm.trim() ? `(No. ${searchTerm.trim()})` : 'Sekarang'}</span>
                  </button>
                </div>
              </div>
            ) : (
              myFamilies.map((kk) => {
                const isExpanded = expandedKKId === kk.id;
                const members = familyMembersMap[kk.id] || [];

                return (
                  <div
                    key={kk.id}
                    className="bg-white rounded-2xl shadow-sm border border-orange-200/80 overflow-hidden transition-all duration-200 hover:shadow-md"
                  >
                    {/* KK Header */}
                    <div className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-orange-50/80 via-white to-amber-50/50">
                      <div className="flex items-start gap-3">
                        <div className="p-3 bg-orange-600 text-white rounded-xl shrink-0 shadow-sm mt-0.5">
                          <Home className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                              {kk.nama_kepala_keluarga}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                              {kk.status_warga}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 font-medium flex items-center gap-2 flex-wrap">
                            <span>No. KK: <code className="font-bold text-slate-800">{kk.no_kk}</code></span>
                            <span>•</span>
                            <span>{kk.alamat} (RT {kk.rt} / RW {kk.rw})</span>
                          </div>
                          <div className="text-[11px] text-amber-800 font-semibold flex items-center gap-3">
                            <span>{kk.wilayah}</span>
                            {kk.kartu_biru_paroki?.memiliki && (
                              <span className="text-blue-700 flex items-center gap-1">
                                <Building2 className="w-3 h-3" /> Kartu Biru Paroki
                              </span>
                            )}
                            {kk.kartu_merah_lingkungan?.memiliki && (
                              <span className="text-red-700 flex items-center gap-1">
                                <CreditCard className="w-3 h-3" /> Kartu Merah Lingkungan
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions for KK */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0 flex-wrap">
                        <button
                          onClick={() => handleOpenEditKK(kk)}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-600" />
                          <span>Edit KK</span>
                        </button>

                        <button
                          onClick={() => handleOpenAddAnggota(kk)}
                          className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Anggota</span>
                        </button>

                        <button
                          onClick={() => handleToggleExpand(kk.id, kk.no_kk)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title={isExpanded ? 'Sembunyikan Anggota' : 'Lihat Anggota Keluarga'}
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Family Members Area */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-orange-600" />
                            <span>Daftar Anggota Keluarga ({members.length} Orang)</span>
                          </h3>
                          <button
                            onClick={() => handleOpenAddAnggota(kk)}
                            className="text-xs font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1 cursor-pointer hover:underline"
                          >
                            <Plus className="w-3.5 h-3.5" /> Tambah Anggota
                          </button>
                        </div>

                        {members.length === 0 ? (
                          <div className="text-center py-6 bg-white rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                            Belum ada anggota keluarga terdaftar pada KK ini. Silakan klik <strong>"Tambah Anggota"</strong>.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {members.map((ak) => (
                              <div
                                key={ak.id}
                                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-orange-200 transition-all space-y-3"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-slate-900 text-sm">{ak.nama_lengkap}</span>
                                    {ak.nama_panggilan && (
                                      <span className="text-xs text-slate-500 italic">({ak.nama_panggilan})</span>
                                    )}
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                                      {ak.hub_keluarga}
                                    </span>
                                    {ak.status_perkawinan && (
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                                        {ak.status_perkawinan}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleOpenEditAnggota(kk, ak)}
                                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                                      title="Edit Anggota"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteAnggota(ak.id, kk.id, kk.no_kk)}
                                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                      title="Hapus Anggota"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Detail Member Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-700">
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">NIK Lingkungan:</span>
                                    <code className="font-bold text-slate-800">{ak.nik}</code>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Lahir & Usia:</span>
                                    <span className="font-medium">{ak.tempat_lahir}, {ak.tanggal_lahir} ({calculateAge(ak.tanggal_lahir)} th)</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Kelamin / Gol. Darah:</span>
                                    <span className="font-medium">{ak.jenis_kelamin} / Goldar {ak.golongan_darah}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Agama:</span>
                                    <span className="font-bold text-orange-800">{ak.agama}</span>
                                  </div>
                                </div>

                                {/* Education & Occupation */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                  <div>
                                    <span className="font-semibold text-slate-800">Pendidikan: </span>
                                    {ak.pendidikan_terakhir} {ak.masih_sekolah && `(Aktif di ${ak.nama_sekolah || '-'})`}
                                  </div>
                                  <div>
                                    <span className="font-semibold text-slate-800">Pekerjaan: </span>
                                    {ak.pekerjaan} {ak.nama_perusahaan && `(${ak.nama_perusahaan})`}
                                  </div>
                                </div>

                                {/* Sakramen Summary if Katolik */}
                                {ak.agama === 'Katolik' && (
                                  <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/60 text-[11px] text-amber-950 space-y-1">
                                    <div className="font-bold text-amber-900 flex items-center gap-1">
                                      <Church className="w-3.5 h-3.5 text-amber-600" /> Catatan Sakramen Katolik:
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-[11px]">
                                      <div className="bg-amber-50/60 p-2 rounded-lg border border-amber-200/60">
                                        <div className="font-bold text-amber-900 border-b border-amber-200/50 pb-0.5 mb-1">Baptis:</div>
                                        {ak.baptis?.nama_baptis || ak.baptis?.no_surat_baptis || ak.baptis?.tgl_baptis ? (
                                          <div className="space-y-0.5">
                                            {ak.baptis.nama_baptis && <div className="font-extrabold text-slate-800 uppercase">{ak.baptis.nama_baptis}</div>}
                                            <div className="text-slate-600"><span className="font-semibold">No:</span> {ak.baptis.no_surat_baptis || '-'}</div>
                                            <div className="text-slate-600"><span className="font-semibold">Tgl:</span> {ak.baptis.tgl_baptis || '-'}</div>
                                            <div className="text-slate-600"><span className="font-semibold">Tempat:</span> {ak.baptis.tempat_baptis || '-'}</div>
                                          </div>
                                        ) : (
                                          <span className="text-slate-400 italic">Belum Ada</span>
                                        )}
                                      </div>

                                      <div className="bg-amber-50/60 p-2 rounded-lg border border-amber-200/60">
                                        <div className="font-bold text-amber-900 border-b border-amber-200/50 pb-0.5 mb-1">Komuni Pertama:</div>
                                        {ak.komuni_pertama?.no_surat_komper || ak.komuni_pertama?.tgl_komuni_pertama ? (
                                          <div className="space-y-0.5 text-slate-600">
                                            <div><span className="font-semibold">No:</span> {ak.komuni_pertama.no_surat_komper || '-'}</div>
                                            <div><span className="font-semibold">Tgl:</span> {ak.komuni_pertama.tgl_komuni_pertama || '-'}</div>
                                            <div><span className="font-semibold">Tempat:</span> {ak.komuni_pertama.tempat_komuni_pertama || '-'}</div>
                                          </div>
                                        ) : (
                                          <span className="text-slate-400 italic">Belum Ada</span>
                                        )}
                                      </div>

                                      <div className="bg-amber-50/60 p-2 rounded-lg border border-amber-200/60">
                                        <div className="font-bold text-amber-900 border-b border-amber-200/50 pb-0.5 mb-1">Krisma:</div>
                                        {ak.krisma?.nama_krisma || ak.krisma?.no_surat_krisma || ak.krisma?.tgl_krisma ? (
                                          <div className="space-y-0.5">
                                            {ak.krisma.nama_krisma && <div className="font-extrabold text-slate-800 uppercase">{ak.krisma.nama_krisma}</div>}
                                            <div className="text-slate-600"><span className="font-semibold">No:</span> {ak.krisma.no_surat_krisma || '-'}</div>
                                            <div className="text-slate-600"><span className="font-semibold">Tgl:</span> {ak.krisma.tgl_krisma || '-'}</div>
                                            <div className="text-slate-600"><span className="font-semibold">Tempat:</span> {ak.krisma.tempat_krisma || '-'}</div>
                                          </div>
                                        ) : (
                                          <span className="text-slate-400 italic">Belum Ada</span>
                                        )}
                                      </div>

                                      <div className="bg-amber-50/60 p-2 rounded-lg border border-amber-200/60">
                                        <div className="font-bold text-amber-900 border-b border-amber-200/50 pb-0.5 mb-1">Perkawinan & Dispensasi:</div>
                                        {ak.perkawinan?.no_surat_perkawinan || ak.perkawinan?.tgl_perkawinan || ak.perkawinan?.is_dispensasi ? (
                                          <div className="space-y-1 text-slate-600">
                                            <div><span className="font-semibold">No:</span> {ak.perkawinan.no_surat_perkawinan || '-'}</div>
                                            <div><span className="font-semibold">Tgl:</span> {ak.perkawinan.tgl_perkawinan || '-'}</div>
                                            <div><span className="font-semibold">Tempat:</span> {ak.perkawinan.tempat_perkawinan || '-'}</div>
                                            {ak.perkawinan.is_dispensasi && (
                                              <div className="mt-1 pt-1 border-t border-amber-200/60 text-[10px] text-amber-900 font-medium">
                                                <div className="font-bold text-rose-700">Dispensasi:</div>
                                                <div>No: {ak.perkawinan.no_surat_dispensasi || '-'}</div>
                                                <div>Tgl: {ak.perkawinan.tgl_dispensasi || '-'}</div>
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-slate-400 italic">Belum / Non</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}

                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* ================= TAB 2: PENGUMUMAN WARGA, FLYER & JADWAL KEGIATAN ================= */}
      {activeSubTab === 'kegiatan' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-orange-600" />
                <span>Pengumuman Warga, Flyer & Jadwal Kegiatan</span>
              </h2>
              <p className="text-xs text-slate-500">
                Papan informasi resmi Lingkungan St. Maria Magdalena. Baca pengumuman penting, flyer visual, jadwal doa, dan Misa lingkungan.
              </p>
            </div>
            <div className="bg-orange-50 border border-orange-200 text-orange-900 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 self-start sm:self-auto flex items-center gap-1.5">
              <span>👁️ Akses Membaca Warga</span>
            </div>
          </div>

          {/* Filter Sub-Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setKegiatanCategoryFilter('Semua')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                kegiatanCategoryFilter === 'Semua'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Semua Informasi ({kegiatanList.length})
            </button>
            <button
              onClick={() => setKegiatanCategoryFilter('Pengumuman')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                kegiatanCategoryFilter === 'Pengumuman'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Pengumuman & Flyer ({kegiatanList.filter(k => k.kategori.includes('Pengumuman')).length})</span>
            </button>
            <button
              onClick={() => setKegiatanCategoryFilter('Jadwal')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                kegiatanCategoryFilter === 'Jadwal'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Jadwal & Doa ({kegiatanList.filter(k => !k.kategori.includes('Pengumuman')).length})</span>
            </button>
          </div>

          {/* Cards List */}
          {kegiatanList.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl text-center border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
              <Megaphone className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700">Belum ada pengumuman atau jadwal kegiatan yang dipublikasikan.</p>
              <p className="text-[11px] text-slate-400">Pengurus akan mengunggah pengumuman dan flyer terbaru di sini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {kegiatanList
                .filter((jg) => {
                  if (kegiatanCategoryFilter === 'Pengumuman') return jg.kategori.includes('Pengumuman');
                  if (kegiatanCategoryFilter === 'Jadwal') return !jg.kategori.includes('Pengumuman');
                  return true;
                })
                .map((jg) => {
                  const isPengumuman = jg.kategori.includes('Pengumuman');
                  return (
                    <div
                      key={jg.id}
                      className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:shadow-md ${
                        isPengumuman ? 'border-rose-200 ring-1 ring-rose-100' : 'border-orange-100'
                      }`}
                    >
                      {/* Flyer / Foto Display with Lightbox Trigger */}
                      {jg.foto_base64 && (
                        <div
                          className="h-56 w-full bg-slate-950 overflow-hidden relative group cursor-pointer"
                          onClick={() => setSelectedFlyerImage({ url: jg.foto_base64!, title: jg.judul_kegiatan })}
                        >
                          <img
                            src={jg.foto_base64}
                            alt={jg.judul_kegiatan}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-95 group-hover:opacity-100"
                          />
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-2 backdrop-blur-xs">
                            <Eye className="w-4 h-4 text-amber-300" />
                            <span>Klik untuk Memperbesar Flyer / Foto</span>
                          </div>
                          {isPengumuman && (
                            <div className="absolute top-3 left-3 bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                              <Megaphone className="w-3.5 h-3.5" /> FLYER RESMI
                            </div>
                          )}
                        </div>
                      )}

                      <div className="p-5 space-y-3.5 flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${
                              isPengumuman
                                ? 'bg-rose-100 text-rose-900 border-rose-200'
                                : 'bg-orange-100 text-orange-900 border-orange-200'
                            }`}
                          >
                            {jg.kategori}
                          </span>
                          <span className="text-xs font-extrabold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-orange-500" /> {jg.waktu}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-slate-900 text-base leading-snug">{jg.judul_kegiatan}</h3>

                        <div className="space-y-1.5 text-xs text-slate-600 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-orange-600 shrink-0" />
                            <span className="font-bold">Hari {getDayName(jg.tanggal)}, {jg.tanggal}</span>
                          </div>
                          {jg.lokasi && (
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                              <span className="font-semibold text-slate-800">{jg.lokasi}</span>
                            </div>
                          )}
                        </div>

                        {jg.keterangan && (
                          <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/70 text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-line">
                            {jg.keterangan}
                          </div>
                        )}
                      </div>

                      {/* Footer actions for Warga */}
                      {jg.foto_base64 && (
                        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-[10px] text-slate-400 font-medium">Ada Gambar Flyer / Foto</span>
                          <button
                            type="button"
                            onClick={() => setSelectedFlyerImage({ url: jg.foto_base64!, title: jg.judul_kegiatan })}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" /> Lihat Flyer Full
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ================= LIGHTBOX FLYER MODAL FOR WARGA ================= */}
      {selectedFlyerImage && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6" onClick={() => setSelectedFlyerImage(null)}>
          <div className="bg-slate-900 text-white max-w-3xl w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-700 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800">
              <span className="font-extrabold text-sm sm:text-base text-amber-400 flex items-center gap-2 truncate">
                <Megaphone className="w-4 h-4 text-orange-500" />
                <span>{selectedFlyerImage.title}</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedFlyerImage(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 sm:p-4 flex-1 flex items-center justify-center overflow-auto bg-black">
              <img
                src={selectedFlyerImage.url}
                alt={selectedFlyerImage.title}
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: GRAFIK & STATISTIK LINGKUNGAN ================= */}
      {activeSubTab === 'statistik' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-600" />
              <span>Statistik & Demografi Lingkungan</span>
            </h2>
            <p className="text-xs text-slate-500">
              Ringkasan data jumlah warga, kepemilikan kartu, dan inventaris barang lingkungan.
            </p>
          </div>

          {/* Cards Metrics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-orange-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                <span>Total Warga</span>
                <Users className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.totalWarga} <span className="text-xs text-slate-500 font-medium">Jiwa</span></div>
              <div className="text-[10px] text-slate-500 font-semibold">{stats.totalKK} Kepala Keluarga</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                <span>Kartu Biru Paroki</span>
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-blue-950">{stats.totalKartuBiru} <span className="text-xs text-slate-500 font-medium">KK</span></div>
              <div className="text-[10px] text-blue-700 font-semibold">Tercatat di Paroki Kediri</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                <span>Kartu Merah Lingkungan</span>
                <CreditCard className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-2xl font-black text-red-950">{stats.totalKartuMerah} <span className="text-xs text-slate-500 font-medium">KK</span></div>
              <div className="text-[10px] text-red-700 font-semibold">Aktif Iuran Kas Lingkungan</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                <span>Inventaris Barang</span>
                <Package className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-950">{stats.totalUnitInventaris} <span className="text-xs text-slate-500 font-medium">Unit</span></div>
              <div className="text-[10px] text-amber-800 font-semibold">{stats.totalInventaris} Jenis Barang Aset</div>
            </div>
          </div>

          {/* Visual Charts Comparison Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Chart 1: Kepemilikan Kartu */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-xs uppercase text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <CreditCard className="w-4 h-4 text-orange-600" />
                <span>Statistik Kepemilikan Kartu Warga</span>
              </h3>

              <div className="space-y-3 text-xs font-semibold">
                {/* Kartu Biru Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-700">
                    <span>Kartu Biru Paroki</span>
                    <span>{stats.totalKartuBiru} / {stats.totalKK} KK ({stats.totalKK > 0 ? Math.round((stats.totalKartuBiru / stats.totalKK) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${stats.totalKK > 0 ? (stats.totalKartuBiru / stats.totalKK) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Kartu Merah Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-700">
                    <span>Kartu Merah Lingkungan</span>
                    <span>{stats.totalKartuMerah} / {stats.totalKK} KK ({stats.totalKK > 0 ? Math.round((stats.totalKartuMerah / stats.totalKK) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600 transition-all duration-500"
                      style={{ width: `${stats.totalKK > 0 ? (stats.totalKartuMerah / stats.totalKK) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 2: Kondisi Inventaris */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-xs uppercase text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Package className="w-4 h-4 text-orange-600" />
                <span>Status & Kondisi Inventaris Barang</span>
              </h3>

              <div className="space-y-3 text-xs font-semibold">
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-700">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Kondisi Baik / Siap Pakai
                    </span>
                    <span>{stats.inventarisBaikCount} Jenis</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${stats.totalInventaris > 0 ? (stats.inventarisBaikCount / stats.totalInventaris) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-slate-700">
                    <span className="flex items-center gap-1 text-amber-700">
                      <AlertTriangle className="w-3.5 h-3.5" /> Perlu Perbaikan / Rusak
                    </span>
                    <span>{stats.inventarisRusakCount} Jenis</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${stats.totalInventaris > 0 ? (stats.inventarisRusakCount / stats.totalInventaris) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* List Inventaris Preview for Citizens */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-extrabold text-xs uppercase text-slate-800 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-orange-600" />
              <span>Daftar Aset & Inventaris Lingkungan</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700 border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-900 font-bold">
                  <tr>
                    <th className="p-2.5 text-center">No</th>
                    <th className="p-2.5">Nama Barang Inventaris</th>
                    <th className="p-2.5 text-center">Jumlah</th>
                    <th className="p-2.5">Tempat Penyimpanan</th>
                    <th className="p-2.5 text-center">Kondisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {inventarisList.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="p-2.5 text-center font-bold text-slate-500">{inv.no_urut}</td>
                      <td className="p-2.5 font-extrabold text-slate-900">{inv.nama_barang}</td>
                      <td className="p-2.5 text-center font-bold">{inv.jumlah} unit</td>
                      <td className="p-2.5 text-slate-600">{inv.tempat_penyimpanan}</td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          inv.kondisi === 'Baik' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inv.kondisi}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Form KK Modal */}
      {isFormKKOpen && (
        <FormKK
          initialData={selectedKKToEdit}
          isOpen={isFormKKOpen}
          onClose={() => setIsFormKKOpen(false)}
          onSaved={handleKKSaved}
          currentUsername={user.username}
        />
      )}

      {/* Form Anggota Modal */}
      {isFormAnggotaOpen && selectedKKForAnggota && (
        <FormAnggotaKeluarga
          idKK={selectedKKForAnggota.id}
          noKK={selectedKKForAnggota.no_kk}
          initialData={selectedAnggotaToEdit}
          isOpen={isFormAnggotaOpen}
          onClose={() => setIsFormAnggotaOpen(false)}
          onSaved={handleAnggotaSaved}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
      />

      {/* Cetak KK Modal */}
      {isCetakModalOpen && kkToPrint && (
        <CetakKKModal
          kk={kkToPrint}
          members={membersToPrint}
          isOpen={isCetakModalOpen}
          onClose={() => setIsCetakModalOpen(false)}
        />
      )}

    </div>
  );
};
