import React, { useState, useEffect } from 'react';
import stMMagdalenaImg from '../assets/images/st_m_magdalena_1786458394388.jpg';
import { UserAccount, KepalaKeluarga, AnggotaKeluarga, JadwalKegiatan, Inventaris } from '../types';
import {
  getKepalaKeluargaList,
  searchKepalaKeluargaByCitizen,
  getAnggotaKeluargaByKK,
  deleteAnggotaKeluarga,
  getJadwalKegiatanList,
  saveJadwalKegiatan,
  deleteJadwalKegiatan,
  getDashboardStats,
  getInventarisList,
  pullAllDataFromCloud
} from '../lib/database';
import { FormKK } from './FormKK';
import { FormAnggotaKeluarga } from './FormAnggotaKeluarga';
import { CetakKKModal } from './CetakKKModal';
import { ConfirmModal } from './ConfirmModal';
import { WetonAgeDisplay } from './WetonAgeDisplay';
import { DateInputFormatted } from './DateInputFormatted';
import { calculateAge, formatAgeWithDays, formatRupiah, getDayName, compressImage } from '../lib/helpers';
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
  Maximize2,
  CloudDownload,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface WargaDashboardProps {
  user: UserAccount;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const WargaDashboard: React.FC<WargaDashboardProps> = ({ user, addToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<'beranda' | 'pencarian' | 'kegiatan' | 'statistik'>('beranda');

  // Lightbox Modal State & Sub-filter State for Flyer / Pengumuman
  const [selectedFlyerImage, setSelectedFlyerImage] = useState<{ url: string; title: string } | null>(null);
  const [kegiatanCategoryFilter, setKegiatanCategoryFilter] = useState<'Semua' | 'Pengumuman' | 'Jadwal'>('Semua');

  // Beranda & Warta filter states
  const [wartaCategoryFilter, setWartaCategoryFilter] = useState<string>('Semua');
  const [wartaSearchQuery, setWartaSearchQuery] = useState<string>('');
  const [selectedWartaDetail, setSelectedWartaDetail] = useState<JadwalKegiatan | null>(null);

  // Warta Edit/Add Modal State (for Pengurus access)
  const [isWartaModalOpen, setIsWartaModalOpen] = useState(false);
  const [wartaForm, setWartaForm] = useState<Partial<JadwalKegiatan>>({});

  const handleOpenAddWarta = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setWartaForm({
      id: undefined,
      judul_kegiatan: '',
      kategori: 'Warta Paroki & Lingkungan',
      tanggal: todayStr,
      waktu: '18:30 WIB',
      lokasi: 'Gereja / Lingkungan St. Maria Magdalena',
      keterangan: '',
      foto_base64: ''
    });
    setIsWartaModalOpen(true);
  };

  const handleOpenEditWarta = (item: JadwalKegiatan) => {
    setWartaForm({ ...item });
    setIsWartaModalOpen(true);
  };

  const handleFlyerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImage(file, 800, 0.7);
        setWartaForm((prev) => ({ ...prev, foto_base64: base64 }));
      } catch (err) {
        addToast('Gagal memproses gambar flyer.', 'error');
      }
    }
  };

  const handleSaveWartaFromBeranda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wartaForm.judul_kegiatan) {
      addToast('Mohon isi judul warta / pengumuman!', 'error');
      return;
    }
    await saveJadwalKegiatan(wartaForm);
    addToast(wartaForm.id ? 'Warta berhasil diperbarui!' : 'Warta / Flyer baru berhasil ditambahkan!', 'success');
    setIsWartaModalOpen(false);
    loadKegiatanData();
  };

  const handleDeleteWartaFromBeranda = (id: string, title: string) => {
    requestConfirm(
      'Konfirmasi Hapus Warta',
      `Apakah Anda yakin ingin menghapus warta '${title}'?`,
      async () => {
        await deleteJadwalKegiatan(id);
        addToast('Warta berhasil dihapus.', 'info');
        if (selectedWartaDetail?.id === id) setSelectedWartaDetail(null);
        loadKegiatanData();
        closeConfirm();
      }
    );
  };

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
    loadKegiatanData();
  }, []);

  useEffect(() => {
    if (user.no_kk) {
      setSearchTerm(user.no_kk);
      loadCitizenSearch(user.no_kk);
    } else {
      loadCitizenSearch('');
    }
  }, [user.no_kk]);

  useEffect(() => {
    if (activeSubTab === 'beranda' || activeSubTab === 'kegiatan') loadKegiatanData();
    if (activeSubTab === 'statistik') loadStatistikData();
  }, [activeSubTab]);

  useEffect(() => {
    const handleDbUpdate = () => {
      if (searchTerm) loadCitizenSearch(searchTerm);
      if (activeSubTab === 'beranda' || activeSubTab === 'kegiatan') loadKegiatanData();
      if (activeSubTab === 'statistik') loadStatistikData();
    };

    window.addEventListener('sapa-db-updated', handleDbUpdate);
    return () => {
      window.removeEventListener('sapa-db-updated', handleDbUpdate);
    };
  }, [searchTerm, activeSubTab]);

  // Filtered Warta list for Beranda
  const filteredWartaList = kegiatanList.filter((item) => {
    const matchesCat =
      wartaCategoryFilter === 'Semua' ||
      item.kategori === wartaCategoryFilter ||
      (wartaCategoryFilter === 'Warta Paroki & Lingkungan' && item.kategori?.includes('Warta')) ||
      (wartaCategoryFilter === 'Pengumuman / Flyer Warga' && item.kategori?.includes('Pengumuman')) ||
      (wartaCategoryFilter === 'Doa Lingkungan' && item.kategori?.includes('Doa')) ||
      (wartaCategoryFilter === 'Misa Lingkungan' && item.kategori?.includes('Misa'));

    const query = wartaSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      item.judul_kegiatan.toLowerCase().includes(query) ||
      (item.keterangan && item.keterangan.toLowerCase().includes(query)) ||
      (item.lokasi && item.lokasi.toLowerCase().includes(query));

    return matchesCat && matchesSearch;
  });

  // Featured warta item (1 main high impact flyer/announcement)
  const featuredWarta =
    filteredWartaList.find((k) => k.foto_base64) || filteredWartaList[0] || kegiatanList[0];

  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  const handlePullCloudToLocal = async () => {
    setIsSyncingCloud(true);
    try {
      const ok = await pullAllDataFromCloud();
      if (ok) {
        addToast('Data terbaru dari Cloud Firestore berhasil diambil!', 'success');
        if (searchTerm) loadCitizenSearch(searchTerm);
        if (activeSubTab === 'kegiatan') loadKegiatanData();
        if (activeSubTab === 'statistik') loadStatistikData();
      } else {
        addToast('Gagal mengambil data dari Cloud Firestore', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Terjadi kesalahan saat sinkronisasi Cloud', 'error');
    } finally {
      setIsSyncingCloud(false);
    }
  };

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
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 rounded-2xl p-3.5 sm:p-5 md:p-6 text-white shadow-md relative overflow-hidden flex items-center justify-between gap-3">
        <div className="relative z-10 space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold text-amber-200 border border-white/30 backdrop-blur-xs">
            <ShieldCheck className="w-3.5 h-3.5" /> Akses Khusus Warga Lingkungan
          </div>
          <h1 className="text-base sm:text-xl md:text-2xl font-black text-white leading-snug">
            Selamat Datang di Portal Mandiri SAPA
          </h1>
          <p className="text-[11px] sm:text-xs text-orange-100 leading-tight sm:leading-relaxed font-medium">
            Pendataan Warga Mandiri Lingkungan St. Maria Magdalena - Paroki St. Vincentius a Paulo Kediri.
          </p>
        </div>

        {/* Gambar St. M. Magdalena di sebelah kanan */}
        <div className="shrink-0 relative z-10 flex items-center justify-center">
          <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 border-amber-200/80 shadow-lg bg-orange-500/30 p-0.5 backdrop-blur-xs">
            <img
              src={stMMagdalenaImg}
              alt="St. M. Magdalena"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-orange-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab('beranda')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
            activeSubTab === 'beranda'
              ? 'bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white shadow-md shadow-red-600/20 border border-orange-400/40'
              : 'bg-white text-slate-700 hover:bg-orange-50 border border-slate-200'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Beranda & Warta Lingkungan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('pencarian')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
            activeSubTab === 'pencarian'
              ? 'bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white shadow-md shadow-red-600/20 border border-orange-400/40'
              : 'bg-white text-slate-700 hover:bg-orange-50 border border-slate-200'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Pencarian Data Warga</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('kegiatan')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
            activeSubTab === 'kegiatan'
              ? 'bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white shadow-md shadow-red-600/20 border border-orange-400/40'
              : 'bg-white text-slate-700 hover:bg-orange-50 border border-slate-200'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Pengumuman, Flyer & Jadwal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('statistik')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
            activeSubTab === 'statistik'
              ? 'bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white shadow-md shadow-red-600/20 border border-orange-400/40'
              : 'bg-white text-slate-700 hover:bg-orange-50 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Grafik & Statistik Lingkungan</span>
        </button>

        <button
          type="button"
          onClick={handlePullCloudToLocal}
          disabled={isSyncingCloud}
          className="ml-auto px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white shadow-sm border border-orange-400/30 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 active:scale-95"
          title="Tarik data terbaru dari server Cloud Firestore"
        >
          <CloudDownload className={`w-4 h-4 ${isSyncingCloud ? 'animate-bounce' : ''}`} />
          <span>{isSyncingCloud ? 'Mengambil...' : 'Tarik Data Cloud'}</span>
        </button>
      </div>

      {/* ================= TAB 0: BERANDA INFORMASI, FLYER & WARTA LINGKUNGAN/PAROKI ================= */}
      {activeSubTab === 'beranda' && (
        <div className="space-y-6">
          
          {/* Welcome Header Banner */}
          <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Icon Gambar St. M. Magdalena */}
                <div className="shrink-0 flex items-center justify-center">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-amber-200/80 shadow-md bg-orange-500/30 p-0.5 backdrop-blur-xs">
                    <img
                      src={stMMagdalenaImg}
                      alt="St. M. Magdalena"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-1 sm:space-y-1.5 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold text-amber-100 border border-white/30 backdrop-blur-xs">
                    {user.role === 'pengurus' ? (
                      <>
                        <Edit className="w-3 h-3 text-amber-300" />
                        <span>Akses Pengurus (Tambah, Edit & Hapus Warta)</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3 h-3 text-emerald-300" />
                        <span>Akses Warga (Membaca Warta & Pengumuman)</span>
                      </>
                    )}
                  </div>

                  <h1 className="text-sm sm:text-lg md:text-xl font-extrabold text-white leading-snug">
                    Beranda Informasi & Warta Lingkungan St. Maria Magdalena
                  </h1>

                  <p className="text-[11px] sm:text-xs text-orange-100 font-medium leading-tight">
                    Pusat berita paroki, pengumuman misa, poster flyer acara, dan warta resmi.
                  </p>
                </div>
              </div>

              {user.role === 'pengurus' && (
                <button
                  type="button"
                  onClick={handleOpenAddWarta}
                  className="px-3 py-2 bg-white text-orange-800 hover:bg-orange-50 font-extrabold text-[11px] sm:text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 self-start md:self-center"
                >
                  <Plus className="w-3.5 h-3.5 text-orange-600" />
                  <span>Tambah Warta / Flyer</span>
                </button>
              )}
            </div>
          </div>

          {/* Featured / Sorotan Utama Warta Banner */}
          {featuredWarta && (
            <div className="bg-white rounded-3xl border border-orange-200/90 shadow-md overflow-hidden transition-all hover:shadow-lg">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-2.5 text-white text-xs font-extrabold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
                  <span className="uppercase tracking-wider">Sorotan Warta Utama Paroki & Lingkungan</span>
                </span>
                <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[11px] text-amber-100">
                  {featuredWarta.kategori}
                </span>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Left / Top: Flyer Banner Image */}
                {featuredWarta.foto_base64 ? (
                  <div className="md:col-span-5 relative group overflow-hidden rounded-2xl border border-amber-200 bg-slate-900 aspect-video md:aspect-4/3 flex items-center justify-center">
                    <img
                      src={featuredWarta.foto_base64}
                      alt={featuredWarta.judul_kegiatan}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedFlyerImage({ url: featuredWarta.foto_base64!, title: featuredWarta.judul_kegiatan })}
                        className="px-3.5 py-2 bg-white/95 text-slate-900 font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer hover:bg-white transition-all"
                      >
                        <Maximize2 className="w-4 h-4 text-orange-600" /> Perbesar Flyer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="md:col-span-5 rounded-2xl bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 p-8 flex flex-col items-center justify-center text-center text-amber-900 border border-amber-200 min-h-[220px]">
                    <Megaphone className="w-12 h-12 text-orange-600 mb-2 animate-bounce" />
                    <span className="font-extrabold text-sm">{featuredWarta.kategori}</span>
                    <span className="text-xs text-amber-700 font-medium mt-1">Lingkungan St. Maria Magdalena</span>
                  </div>
                )}

                {/* Right: Content Details */}
                <div className="md:col-span-7 space-y-4">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                    {featuredWarta.judul_kegiatan}
                  </h2>

                  <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                    <div className="flex items-center gap-1.5 bg-amber-50 text-amber-900 px-3 py-1.5 rounded-xl border border-amber-200">
                      <Calendar className="w-4 h-4 text-orange-600 shrink-0" />
                      <span>Hari {getDayName(featuredWarta.tanggal)}, {featuredWarta.tanggal}</span>
                    </div>

                    {featuredWarta.waktu && (
                      <div className="flex items-center gap-1.5 bg-orange-50 text-orange-900 px-3 py-1.5 rounded-xl border border-orange-200">
                        <Clock className="w-4 h-4 text-orange-600 shrink-0" />
                        <span>{featuredWarta.waktu}</span>
                      </div>
                    )}

                    {featuredWarta.lokasi && (
                      <div className="flex items-center gap-1.5 bg-rose-50 text-rose-900 px-3 py-1.5 rounded-xl border border-rose-200">
                        <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="truncate max-w-[220px]">{featuredWarta.lokasi}</span>
                      </div>
                    )}
                  </div>

                  {featuredWarta.keterangan && (
                    <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80 line-clamp-3 whitespace-pre-line">
                      {featuredWarta.keterangan}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedWartaDetail(featuredWarta)}
                      className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Baca Selengkapnya & Detail Flyer</span>
                    </button>

                    {user.role === 'pengurus' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEditWarta(featuredWarta)}
                          className="px-3 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-xl border border-amber-300 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWartaFromBeranda(featuredWarta.id, featuredWarta.judul_kegiatan)}
                          className="px-3 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold text-xs rounded-xl border border-rose-300 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter & Search Bar for Warta Items */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-orange-100 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
                {[
                  'Semua',
                  'Warta Paroki & Lingkungan',
                  'Pengumuman / Flyer Warga',
                  'Doa Lingkungan',
                  'Misa Lingkungan'
                ].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setWartaCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                      wartaCategoryFilter === cat
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={wartaSearchQuery}
                  onChange={(e) => setWartaSearchQuery(e.target.value)}
                  placeholder="Cari kabar acara / warta..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Grid of Warta Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredWartaList.length === 0 ? (
              <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2 text-slate-500">
                <Megaphone className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-bold text-sm">Tidak ditemukan Warta / Pengumuman yang sesuai</p>
                <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau kategori filter di atas.</p>
              </div>
            ) : (
              filteredWartaList.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden"
                >
                  {/* Flyer image or header tag */}
                  {item.foto_base64 ? (
                    <div
                      className="relative h-44 bg-slate-900 group cursor-pointer overflow-hidden"
                      onClick={() => setSelectedFlyerImage({ url: item.foto_base64!, title: item.judul_kegiatan })}
                    >
                      <img
                        src={item.foto_base64}
                        alt={item.judul_kegiatan}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-amber-300 text-[10px] font-black px-2.5 py-1 rounded-lg border border-amber-400/40">
                        {item.kategori}
                      </div>
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3 py-1.5 bg-white/90 text-slate-900 font-bold text-xs rounded-xl shadow-md flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-orange-600" /> Lihat Flyer
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 flex items-center justify-between">
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-1 rounded-lg border border-amber-200">
                        {item.kategori}
                      </span>
                      <span className="text-[10px] font-extrabold text-orange-600">
                        {item.tanggal}
                      </span>
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col space-y-3">
                    <h3 className="font-black text-slate-900 text-sm leading-snug line-clamp-2">
                      {item.judul_kegiatan}
                    </h3>

                    <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                        <span>Hari {getDayName(item.tanggal)}, {item.tanggal}</span>
                      </div>
                      {item.waktu && (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                          <span>{item.waktu}</span>
                        </div>
                      )}
                      {item.lokasi && (
                        <div className="flex items-start gap-1.5 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span className="truncate">{item.lokasi}</span>
                        </div>
                      )}
                    </div>

                    {item.keterangan && (
                      <p className="text-xs text-slate-600 font-normal line-clamp-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-line">
                        {item.keterangan}
                      </p>
                    )}

                    <div className="pt-2 mt-auto flex items-center justify-between border-t border-slate-100 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedWartaDetail(item)}
                        className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                      >
                        <BookOpen className="w-3.5 h-3.5" /> Detail Warta
                      </button>

                      {user.role === 'pengurus' && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditWarta(item)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                            title="Edit Warta Ini"
                          >
                            <Edit className="w-3.5 h-3.5 text-amber-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteWartaFromBeranda(item.id, item.judul_kegiatan)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                            title="Hapus Warta Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

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
                                    <span className="font-medium inline-flex items-center gap-1">{ak.tempat_lahir}, {ak.tanggal_lahir} (<WetonAgeDisplay birthDateString={ak.tanggal_lahir} nama={ak.nama_lengkap} />)</span>
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

      {/* ================= DETAIL WARTA / FLYER MODAL ================= */}
      {selectedWartaDetail && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={() => setSelectedWartaDetail(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-orange-200 animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 text-white flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-amber-100">
                  {selectedWartaDetail.kategori}
                </span>
                <h3 className="font-extrabold text-base sm:text-lg text-white leading-tight">
                  {selectedWartaDetail.judul_kegiatan}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWartaDetail(null)}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-slate-800 text-xs">
              {/* Flyer image if present */}
              {selectedWartaDetail.foto_base64 && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 max-h-[350px] flex items-center justify-center relative group">
                  <img
                    src={selectedWartaDetail.foto_base64}
                    alt={selectedWartaDetail.judul_kegiatan}
                    className="w-full h-full object-contain max-h-[350px]"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedFlyerImage({ url: selectedWartaDetail.foto_base64!, title: selectedWartaDetail.judul_kegiatan })}
                    className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/75 hover:bg-black text-amber-300 font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" /> Perbesar Poster Flyer
                  </button>
                </div>
              )}

              {/* Metadata info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs font-semibold text-amber-950">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>Hari {getDayName(selectedWartaDetail.tanggal)}, {selectedWartaDetail.tanggal}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>{selectedWartaDetail.waktu || 'Setiap Saat'}</span>
                </div>
                {selectedWartaDetail.lokasi && (
                  <div className="sm:col-span-2 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{selectedWartaDetail.lokasi}</span>
                  </div>
                )}
              </div>

              {/* Text content */}
              {selectedWartaDetail.keterangan && (
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-orange-800">
                    Isi Informasi / Warta Lengkap
                  </label>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 text-xs font-medium leading-relaxed whitespace-pre-line">
                    {selectedWartaDetail.keterangan}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Diterbitkan untuk Umat Lingkungan St. Maria Magdalena
              </span>
              <button
                type="button"
                onClick={() => setSelectedWartaDetail(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FORM ADD/EDIT WARTA MODAL (FOR PENGURUS) ================= */}
      {isWartaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-hidden">
          <form
            onSubmit={handleSaveWartaFromBeranda}
            className="bg-white rounded-2xl max-w-lg w-full max-h-[92dvh] sm:max-h-[90vh] flex flex-col text-xs shadow-2xl border border-orange-200 overflow-hidden animate-in fade-in zoom-in duration-200"
          >
            <div className="shrink-0 bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 px-4 sm:px-6 py-3.5 text-white flex items-center justify-between shadow-md">
              <div className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-200" />
                <span>{wartaForm.id ? 'Edit Warta / Kabar Acara' : 'Tambah Warta & Flyer Baru'}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsWartaModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 text-slate-800">
              <div>
                <label className="block font-bold mb-1">Judul Warta / Pengumuman / Acara</label>
                <input
                  type="text"
                  value={wartaForm.judul_kegiatan || ''}
                  onChange={(e) => setWartaForm({ ...wartaForm, judul_kegiatan: e.target.value })}
                  placeholder="Contoh: Warta Paroki: Pesta Pelindung St. Maria Magdalena"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Kategori</label>
                <select
                  value={wartaForm.kategori || 'Warta Paroki & Lingkungan'}
                  onChange={(e) => setWartaForm({ ...wartaForm, kategori: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white"
                >
                  <option value="Warta Paroki & Lingkungan">📢 Warta Paroki & Lingkungan</option>
                  <option value="Pengumuman / Flyer Warga">🖼️ Pengumuman / Flyer Warga</option>
                  <option value="Pengumuman Penting">🚨 Pengumuman Penting / Darurat</option>
                  <option value="Doa Lingkungan">🙏 Doa Lingkungan / Rosario</option>
                  <option value="Misa Lingkungan">⛪ Misa Lingkungan</option>
                  <option value="Kerja Bakti">🧹 Kerja Bakti</option>
                  <option value="Perayaan Sektor/Paroki">🎉 Perayaan Sektor/Paroki</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <DateInputFormatted
                    label="Tanggal"
                    required
                    value={wartaForm.tanggal || ''}
                    onChange={(val) => setWartaForm({ ...wartaForm, tanggal: val })}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Waktu</label>
                  <input
                    type="text"
                    value={wartaForm.waktu || ''}
                    onChange={(e) => setWartaForm({ ...wartaForm, waktu: e.target.value })}
                    placeholder="18:30 WIB / Selesai"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Lokasi / Tempat Acara</label>
                <input
                  type="text"
                  value={wartaForm.lokasi || ''}
                  onChange={(e) => setWartaForm({ ...wartaForm, lokasi: e.target.value })}
                  placeholder="Gereja St. Vincentius / Rumah Bpk. Sugeng / Umum"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Teks Isi Warta & Pengumuman Lengkap</label>
                <textarea
                  value={wartaForm.keterangan || ''}
                  onChange={(e) => setWartaForm({ ...wartaForm, keterangan: e.target.value })}
                  placeholder="Tuliskan berita, rincian acara, imbauan, atau informasi warta untuk dibaca seluruh warga..."
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Upload Foto / Poster Flyer (Gambar)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFlyerUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
                {wartaForm.foto_base64 && (
                  <div className="mt-2 p-2 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between">
                    <img src={wartaForm.foto_base64} alt="Flyer Preview" className="h-16 w-auto object-contain rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setWartaForm({ ...wartaForm, foto_base64: '' })}
                      className="px-2 py-1 bg-rose-100 text-rose-700 font-bold text-[10px] rounded-lg hover:bg-rose-200 cursor-pointer"
                    >
                      Hapus Foto Flyer
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsWartaModalOpen(false)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl cursor-pointer text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-black bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-sm cursor-pointer text-xs"
              >
                {wartaForm.id ? 'Simpan Perubahan' : 'Terbitkan Warta Baru'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
