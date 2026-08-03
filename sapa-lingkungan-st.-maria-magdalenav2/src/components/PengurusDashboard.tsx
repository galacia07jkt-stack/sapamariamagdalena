import React, { useState, useEffect } from 'react';
import {
  UserAccount,
  KepalaKeluarga,
  AnggotaKeluarga,
  Inventaris,
  IuranKartuMerah,
  PelayananLingkungan,
  JadwalKegiatan,
  LIST_16_WILAYAH,
  StatusWarga
} from '../types';
import {
  getKepalaKeluargaList,
  getAnggotaKeluargaByKK,
  deleteKepalaKeluargaCascading,
  deleteAnggotaKeluarga,
  getInventarisList,
  saveInventaris,
  deleteInventaris,
  getIuranList,
  saveIuran,
  deleteIuran,
  getPelayananList,
  savePelayanan,
  deletePelayanan,
  getJadwalKegiatanList,
  saveJadwalKegiatan,
  deleteJadwalKegiatan,
  resetAndWipeAllDatabaseData,
  pushAllLocalDataToCloud,
  pullAllDataFromCloud
} from '../lib/database';
import { FormKK } from './FormKK';
import { FormAnggotaKeluarga } from './FormAnggotaKeluarga';
import { CetakKKModal } from './CetakKKModal';
import { ConfirmModal } from './ConfirmModal';
import { SapaLogo } from './SapaLogo';
import { exportWargaToExcel, exportInventarisToExcel, exportIuranToExcel } from '../lib/exportExcel';
import { calculateAge, formatRupiah, getDayName, compressImage } from '../lib/helpers';

const SATUAN_OPTIONS = [
  'pcs',
  'dus',
  'kotak',
  'box',
  'kg',
  'gram',
  'meter',
  'Unit',
  'Buah',
  'Set',
  'Roll',
  'Lembar',
  'Pack',
  'Botol',
  'Pasang'
];
import {
  Users,
  Package,
  CreditCard,
  Calendar,
  UserCheck,
  ShieldCheck,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Home,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Church,
  Check,
  X,
  Building2,
  DollarSign,
  Printer,
  FileSpreadsheet,
  Megaphone,
  Bell,
  Maximize2,
  Eye,
  CloudUpload,
  CloudDownload,
  RefreshCw
} from 'lucide-react';

interface PengurusDashboardProps {
  user: UserAccount;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const PengurusDashboard: React.FC<PengurusDashboardProps> = ({ user, addToast }) => {
  const [activeTab, setActiveTab] = useState<
    'warga' | 'inventaris' | 'iuran' | 'pelayanan' | 'kegiatan'
  >('warga');

  // --- TAB 1: WARGA STATE ---
  const [kkList, setKkList] = useState<KepalaKeluarga[]>([]);
  const [filterWilayah, setFilterWilayah] = useState('Semua Wilayah');
  const [filterStatus, setFilterStatus] = useState('Semua Status');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedKKId, setExpandedKKId] = useState<string | null>(null);
  const [familyMembersMap, setFamilyMembersMap] = useState<Record<string, AnggotaKeluarga[]>>({});

  // Modals for KK & Anggota
  const [isFormKKOpen, setIsFormKKOpen] = useState(false);
  const [selectedKKToEdit, setSelectedKKToEdit] = useState<Partial<KepalaKeluarga> | undefined>(undefined);

  const [isFormAnggotaOpen, setIsFormAnggotaOpen] = useState(false);
  const [selectedKKForAnggota, setSelectedKKForAnggota] = useState<{ id: string; no_kk: string } | null>(null);
  const [selectedAnggotaToEdit, setSelectedAnggotaToEdit] = useState<Partial<AnggotaKeluarga> | undefined>(undefined);

  // Modal Cetak KK
  const [isCetakModalOpen, setIsCetakModalOpen] = useState(false);
  const [kkToPrint, setKkToPrint] = useState<KepalaKeluarga | null>(null);
  const [membersToPrint, setMembersToPrint] = useState<AnggotaKeluarga[]>([]);

  const handleOpenCetakKK = async (kk: KepalaKeluarga) => {
    let m = familyMembersMap[kk.id];
    if (!m) {
      m = await getAnggotaKeluargaByKK(kk.id, kk.no_kk);
      setFamilyMembersMap((prev) => ({ ...prev, [kk.id]: m }));
    }
    setKkToPrint(kk);
    setMembersToPrint(m || []);
    setIsCetakModalOpen(true);
  };

  // --- TAB 2: INVENTARIS STATE ---
  const [inventarisList, setInventarisList] = useState<Inventaris[]>([]);
  const [isModalInvOpen, setIsModalInvOpen] = useState(false);
  const [invForm, setInvForm] = useState<Partial<Inventaris>>({});

  // --- TAB 3: IURAN STATE ---
  const [iuranList, setIuranList] = useState<IuranKartuMerah[]>([]);
  const [isModalIuranOpen, setIsModalIuranOpen] = useState(false);
  const [iuranForm, setIuranForm] = useState<Partial<IuranKartuMerah>>({});
  const [iuranSearchQuery, setIuranSearchQuery] = useState('');
  const [iuranMonthFilter, setIuranMonthFilter] = useState('Semua Bulan');
  const [iuranYearFilter, setIuranYearFilter] = useState('Semua Tahun');
  const [iuranJenisFilter, setIuranJenisFilter] = useState('Semua Jenis');

  // --- TAB 4: PELAYANAN STATE ---
  const [pelayananList, setPelayananList] = useState<PelayananLingkungan[]>([]);
  const [isModalPelayananOpen, setIsModalPelayananOpen] = useState(false);
  const [pelayananForm, setPelayananForm] = useState<Partial<PelayananLingkungan>>({});

  // --- TAB 5: KEGIATAN STATE ---
  const [kegiatanList, setKegiatanList] = useState<JadwalKegiatan[]>([]);
  const [isModalKegiatanOpen, setIsModalKegiatanOpen] = useState(false);
  const [kegiatanForm, setKegiatanForm] = useState<Partial<JadwalKegiatan>>({});

  // Lightbox Modal State for Flyer Image
  const [selectedFlyerImage, setSelectedFlyerImage] = useState<{ url: string; title: string } | null>(null);
  const [kegiatanTabFilter, setKegiatanTabFilter] = useState<'Semua' | 'Pengumuman' | 'Jadwal'>('Semua');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
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
    onConfirm: () => Promise<void> | void,
    confirmText = 'Hapus'
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      onConfirm
    });
  };

  const closeConfirm = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  // ================= LOAD DATA =================
  const loadKkData = async () => {
    const list = await getKepalaKeluargaList(filterWilayah, filterStatus);
    setKkList(list);
  };

  const fetchMembers = async (idKK: string, noKK: string) => {
    const members = await getAnggotaKeluargaByKK(idKK, noKK);
    setFamilyMembersMap((prev) => ({ ...prev, [idKK]: members }));
  };

  const loadInventaris = async () => {
    const list = await getInventarisList();
    setInventarisList(list);
  };

  const loadIuran = async () => {
    const list = await getIuranList();
    setIuranList(list);
  };

  const loadPelayanan = async () => {
    const list = await getPelayananList();
    setPelayananList(list);
  };

  const loadKegiatan = async () => {
    const list = await getJadwalKegiatanList();
    setKegiatanList(list);
  };

  const refreshAllCurrentTab = () => {
    if (activeTab === 'warga') loadKkData();
    if (activeTab === 'inventaris') loadInventaris();
    if (activeTab === 'iuran') {
      loadIuran();
      loadKkData();
    }
    if (activeTab === 'pelayanan') loadPelayanan();
    if (activeTab === 'kegiatan') loadKegiatan();
  };

  useEffect(() => {
    refreshAllCurrentTab();

    const handleDbUpdate = () => {
      refreshAllCurrentTab();
    };

    window.addEventListener('sapa-db-updated', handleDbUpdate);
    return () => {
      window.removeEventListener('sapa-db-updated', handleDbUpdate);
    };
  }, [activeTab, filterWilayah, filterStatus]);

  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  const handlePushLocalToCloud = async () => {
    setIsSyncingCloud(true);
    try {
      const ok = await pushAllLocalDataToCloud();
      if (ok) {
        addToast('Data lokal berhasil diunggah dan disinkronkan ke Cloud Firestore!', 'success');
        refreshAllCurrentTab();
      } else {
        addToast('Gagal mengunggah data ke Cloud Firestore', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Terjadi kesalahan saat mengunggah data ke Cloud', 'error');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handlePullCloudToLocal = async () => {
    setIsSyncingCloud(true);
    try {
      const ok = await pullAllDataFromCloud();
      if (ok) {
        addToast('Data terbaru dari Cloud Firestore berhasil diambil!', 'success');
        refreshAllCurrentTab();
      } else {
        addToast('Gagal mengambil data dari Cloud Firestore', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Terjadi kesalahan saat mengambil data dari Cloud', 'error');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleResetAllDemoData = () => {
    requestConfirm(
      'Konfirmasi Kosongkan Seluruh Data Demo',
      'Apakah Anda yakin ingin MENGHAPUS SELURUH Data Demo dari Cloud Firestore & Semua Perangkat?\n\nSemua KK demo, warga, inventaris, iuran, dan jadwal kegiatan demo akan dibersihkan secara permanen sehingga database bersih untuk diisi data riil!',
      async () => {
        try {
          await resetAndWipeAllDatabaseData();
          addToast('Seluruh data demo berhasil dihapus dari Cloud Firestore!', 'success');
          setKkList([]);
          setFamilyMembersMap({});
          setInventarisList([]);
          setIuranList([]);
          setPelayananList([]);
          setKegiatanList([]);
        } catch (err) {
          console.error('Failed resetting demo data:', err);
          addToast('Gagal menghapus data demo', 'error');
        } finally {
          closeConfirm();
        }
      },
      'Hapus Seluruh Data Demo'
    );
  };

  // Expand KK
  const handleToggleExpand = (idKK: string, noKK: string) => {
    if (expandedKKId === idKK) {
      setExpandedKKId(null);
    } else {
      setExpandedKKId(idKK);
      fetchMembers(idKK, noKK);
    }
  };

  // CASCADING DELETE KEPALA KELUARGA
  const handleDeleteKK = (kk: KepalaKeluarga) => {
    requestConfirm(
      'Konfirmasi Hapus Kepala Keluarga',
      `Apakah Anda yakin ingin menghapus data KK '${kk.nama_kepala_keluarga}' (No. KK: ${kk.no_kk})?\n\nPenghapusan ini bersifat CASCADING (KK, Seluruh Anggota Keluarga, Sakramen, dan Iuran akan terhapus secara permanen)!`,
      async () => {
        try {
          await deleteKepalaKeluargaCascading(kk.id, kk.no_kk);
          addToast(`Data Kepala Keluarga '${kk.nama_kepala_keluarga}' & anggotanya berhasil dihapus!`, 'info');
          if (expandedKKId === kk.id) setExpandedKKId(null);
          setFamilyMembersMap((prev) => {
            const next = { ...prev };
            delete next[kk.id];
            return next;
          });
          await loadKkData();
        } catch (err) {
          console.error('Error deleting KK:', err);
          addToast('Gagal menghapus data KK', 'error');
        } finally {
          closeConfirm();
        }
      }
    );
  };

  // DELETE ANGGOTA KELUARGA
  const handleDeleteAnggota = (idAk: string, idKK: string, noKK: string) => {
    requestConfirm(
      'Konfirmasi Hapus Anggota Keluarga',
      'Apakah Anda yakin ingin menghapus data anggota keluarga ini?',
      async () => {
        try {
          await deleteAnggotaKeluarga(idAk);
          addToast('Data Anggota Keluarga berhasil dihapus.', 'info');
          await fetchMembers(idKK, noKK);
        } catch (err) {
          console.error('Error deleting anggota:', err);
          addToast('Gagal menghapus anggota keluarga', 'error');
        } finally {
          closeConfirm();
        }
      }
    );
  };

  // Saved callbacks
  const handleKKSaved = () => {
    addToast('Data Kepala Keluarga berhasil disimpan!', 'success');
    loadKkData();
  };

  const handleAnggotaSaved = () => {
    addToast('Data Anggota Keluarga berhasil disimpan!', 'success');
    if (selectedKKForAnggota) {
      fetchMembers(selectedKKForAnggota.id, selectedKKForAnggota.no_kk);
    }
  };

  // --- INVENTARIS ACTIONS ---
  const handleSaveInv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invForm.nama_barang) return;
    await saveInventaris(invForm);
    addToast('Data Inventaris berhasil disimpan!', 'success');
    setIsModalInvOpen(false);
    loadInventaris();
  };

  const handleDeleteInv = (id: string) => {
    requestConfirm(
      'Konfirmasi Hapus Barang Inventaris',
      'Apakah Anda yakin ingin menghapus barang inventaris ini?',
      async () => {
        await deleteInventaris(id);
        addToast('Barang inventaris dihapus.', 'info');
        loadInventaris();
        closeConfirm();
      }
    );
  };

  // --- IURAN ACTIONS ---
  const handleQuickSetorIuran = (kk: KepalaKeluarga) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const dateObj = new Date(todayStr);
    const day = getDayName(todayStr);
    const month = dateObj.toLocaleString('id-ID', { month: 'long' });
    const year = dateObj.getFullYear().toString();

    setIuranForm({
      id: undefined,
      no_kk: kk.no_kk,
      nama_kk: kk.nama_kepala_keluarga,
      tanggal_bayar: todayStr,
      hari: day,
      bulan: month,
      tahun: year,
      jumlah_iuran: 50000,
      jenis_iuran: 'Kas Lingkungan',
      catatan: `Setoran Iuran Bulan ${month} ${year}`
    });
    setIsModalIuranOpen(true);
  };

  const handleEditIuran = (iur: IuranKartuMerah) => {
    setIuranForm({ ...iur });
    setIsModalIuranOpen(true);
  };

  const handleIuranDateChange = (dateVal: string) => {
    if (!dateVal) {
      setIuranForm((prev) => ({ ...prev, tanggal_bayar: '' }));
      return;
    }
    const dateObj = new Date(dateVal);
    const day = getDayName(dateVal);
    const month = dateObj.toLocaleString('id-ID', { month: 'long' });
    const year = dateObj.getFullYear().toString();

    setIuranForm((prev) => ({
      ...prev,
      tanggal_bayar: dateVal,
      hari: day,
      bulan: month,
      tahun: year,
      catatan: prev.catatan || `Setoran Iuran Bulan ${month} ${year}`
    }));
  };

  const handleSaveIuran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!iuranForm.no_kk || !iuranForm.nama_kk || !iuranForm.jumlah_iuran) {
      addToast('Mohon pilih Kepala Keluarga dan masukan jumlah iuran!', 'error');
      return;
    }

    const dateVal = iuranForm.tanggal_bayar || new Date().toISOString().split('T')[0];
    const dateObj = new Date(dateVal);
    const day = iuranForm.hari || getDayName(dateVal);
    const month = iuranForm.bulan || dateObj.toLocaleString('id-ID', { month: 'long' });
    const year = iuranForm.tahun || dateObj.getFullYear().toString();

    await saveIuran({
      ...iuranForm,
      tanggal_bayar: dateVal,
      hari: day,
      bulan: month,
      tahun: year,
      diinput_oleh: user.namaLengkap || 'Pengurus'
    });

    addToast(
      iuranForm.id
        ? 'Data setoran iuran berhasil diperbarui!'
        : 'Setoran Iuran Kartu Merah berhasil dicatat!',
      'success'
    );
    setIsModalIuranOpen(false);
    loadIuran();
  };

  const handleDeleteIuran = (id: string) => {
    requestConfirm(
      'Konfirmasi Hapus Catatan Iuran',
      'Apakah Anda yakin ingin menghapus catatan iuran ini?',
      async () => {
        await deleteIuran(id);
        addToast('Catatan iuran dihapus.', 'info');
        loadIuran();
        closeConfirm();
      }
    );
  };

  // --- PELAYANAN ACTIONS ---
  const handleSavePelayanan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pelayananForm.nama_petugas) return;
    await savePelayanan(pelayananForm);
    addToast('Data Petugas Pelayanan berhasil disimpan!', 'success');
    setIsModalPelayananOpen(false);
    loadPelayanan();
  };

  const handleDeletePelayanan = (id: string) => {
    requestConfirm(
      'Konfirmasi Hapus Petugas Pelayanan',
      'Apakah Anda yakin ingin menghapus data petugas pelayanan ini?',
      async () => {
        await deletePelayanan(id);
        addToast('Data petugas pelayanan dihapus.', 'info');
        loadPelayanan();
        closeConfirm();
      }
    );
  };

  // --- KEGIATAN ACTIONS ---
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 800, 0.7);
        setKegiatanForm((prev) => ({ ...prev, foto_base64: compressedBase64 }));
      } catch (err) {
        alert('Gagal mengolah foto kegiatan.');
      }
    }
  };

  const handleSaveKegiatan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kegiatanForm.judul_kegiatan) return;
    await saveJadwalKegiatan(kegiatanForm);
    addToast('Jadwal / Foto Kegiatan berhasil disimpan!', 'success');
    setIsModalKegiatanOpen(false);
    loadKegiatan();
  };

  const handleDeleteKegiatan = (id: string) => {
    requestConfirm(
      'Konfirmasi Hapus Jadwal Kegiatan',
      'Apakah Anda yakin ingin menghapus jadwal kegiatan ini?',
      async () => {
        await deleteJadwalKegiatan(id);
        addToast('Jadwal kegiatan dihapus.', 'info');
        loadKegiatan();
        closeConfirm();
      }
    );
  };

  // Filter Search Results for KK
  const filteredKkList = kkList.filter((kk) => {
    const q = searchQuery.toUpperCase().trim();
    if (!q) return true;
    return (
      kk.nama_kepala_keluarga.includes(q) ||
      kk.no_kk.includes(q) ||
      kk.alamat.toUpperCase().includes(q)
    );
  });

  // Filter Search & Statistics for Iuran Kartu Merah
  const filteredIuranList = iuranList.filter((iur) => {
    const q = iuranSearchQuery.toLowerCase().trim();
    if (q) {
      const matchNoKk = iur.no_kk.toLowerCase().includes(q);
      const matchNamaKk = iur.nama_kk.toLowerCase().includes(q);
      const matchCatatan = (iur.catatan || '').toLowerCase().includes(q);
      const matchJenis = iur.jenis_iuran.toLowerCase().includes(q);
      if (!matchNoKk && !matchNamaKk && !matchCatatan && !matchJenis) return false;
    }
    if (iuranMonthFilter !== 'Semua Bulan' && iur.bulan.toLowerCase() !== iuranMonthFilter.toLowerCase()) {
      return false;
    }
    if (iuranYearFilter !== 'Semua Tahun' && iur.tahun !== iuranYearFilter) {
      return false;
    }
    if (iuranJenisFilter !== 'Semua Jenis' && iur.jenis_iuran !== iuranJenisFilter) {
      return false;
    }
    return true;
  });

  const totalIuranFiltered = filteredIuranList.reduce((acc, curr) => acc + curr.jumlah_iuran, 0);
  const totalKasLingkungan = filteredIuranList.filter(i => i.jenis_iuran === 'Kas Lingkungan').reduce((a, b) => a + b.jumlah_iuran, 0);
  const totalIuranDuka = filteredIuranList.filter(i => i.jenis_iuran === 'Iuran Duka').reduce((a, b) => a + b.jumlah_iuran, 0);
  const totalPaskahNatal = filteredIuranList.filter(i => i.jenis_iuran === 'Paskah & Natal').reduce((a, b) => a + b.jumlah_iuran, 0);
  const totalSukarela = filteredIuranList.filter(i => i.jenis_iuran === 'Sukarela').reduce((a, b) => a + b.jumlah_iuran, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Pengurus Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold text-amber-100 border border-white/30 backdrop-blur-xs">
              <ShieldCheck className="w-4 h-4" /> Mode Pengurus Lingkungan (Akses Penuh CRUD)
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Dasbor Pengurus Lingkungan St. Maria Magdalena
            </h1>
            <p className="text-xs text-orange-100">
              Kelola Pendataan KK, Inventaris, Kartu Merah Iuran, Pelayanan Liturgi & Jadwal Kegiatan
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handlePushLocalToCloud}
              disabled={isSyncingCloud}
              className="px-3 py-2 bg-amber-900/80 hover:bg-amber-900 text-amber-100 font-bold text-xs rounded-xl border border-amber-400/50 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 whitespace-nowrap disabled:opacity-50"
              title="Unggah data yang diisi di browser/HP ini ke Cloud Firestore agar dapat dibuka di Vercel/HP/Laptop lain"
            >
              {isSyncingCloud ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5 text-amber-300" />}
              <span>Unggah ke Cloud</span>
            </button>

            <button
              type="button"
              onClick={handlePullCloudToLocal}
              disabled={isSyncingCloud}
              className="px-3 py-2 bg-orange-950/80 hover:bg-orange-950 text-orange-100 font-bold text-xs rounded-xl border border-orange-400/50 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 whitespace-nowrap disabled:opacity-50"
              title="Tarik & perbarui data terbaru yang tersimpan di Cloud Firestore"
            >
              {isSyncingCloud ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CloudDownload className="w-3.5 h-3.5 text-orange-300" />}
              <span>Tarik dari Cloud</span>
            </button>

            <button
              type="button"
              onClick={handleResetAllDemoData}
              className="px-3 py-2 bg-red-800/80 hover:bg-red-900 text-white font-bold text-xs rounded-xl border border-red-400/50 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
              title="Hapus seluruh data demo dari Firestore & Perangkat agar database bersih"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-200" />
              <span>Kosongkan Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white p-2 rounded-2xl shadow-xs border border-orange-200/80 flex items-center gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('warga')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'warga'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'text-slate-600 hover:bg-orange-50 hover:text-orange-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Pendataan KK & Warga</span>
        </button>

        <button
          onClick={() => setActiveTab('inventaris')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'inventaris'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'text-slate-600 hover:bg-orange-50 hover:text-orange-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Inventaris Lingkungan</span>
        </button>

        <button
          onClick={() => setActiveTab('iuran')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'iuran'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'text-slate-600 hover:bg-orange-50 hover:text-orange-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Iuran Kartu Merah</span>
        </button>

        <button
          onClick={() => setActiveTab('pelayanan')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'pelayanan'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'text-slate-600 hover:bg-orange-50 hover:text-orange-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Tabel Pelayanan</span>
        </button>

        <button
          onClick={() => setActiveTab('kegiatan')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'kegiatan'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'text-slate-600 hover:bg-orange-50 hover:text-orange-900'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Jadwal, Pengumuman & Flyer</span>
        </button>
      </div>

      {/* ================= TAB 1: PENDATAAN KK & WARGA ================= */}
      {activeTab === 'warga' && (
        <div className="space-y-4">
          
          {/* Filters & Control Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Nama KK, No. KK, atau Alamat..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Filter Wilayah */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-orange-600 shrink-0" />
              <select
                value={filterWilayah}
                onChange={(e) => setFilterWilayah(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl font-semibold bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="Semua Wilayah">-- Semua Wilayah / Stasi --</option>
                {LIST_16_WILAYAH.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl font-semibold bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="Semua Status">-- Semua Status Warga --</option>
                <option value="Aktif">Aktif</option>
                <option value="Pindah Wilayah">Pindah Wilayah</option>
                <option value="Meninggal Dunia">Meninggal Dunia</option>
                <option value="Non-Aktif / Pasif">Non-Aktif / Pasif</option>
              </select>
            </div>

            {/* Export & Button Add KK */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportWargaToExcel(filteredKkList, familyMembersMap)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                title="Export Data Warga ke Format Excel Tersusun Rapi"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={() => {
                  setSelectedKKToEdit(undefined);
                  setIsFormKKOpen(true);
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah KK Baru</span>
              </button>
            </div>

          </div>

          {/* List KK */}
          <div className="space-y-3">
            {filteredKkList.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl text-center border border-dashed border-slate-200 text-xs text-slate-500">
                Tidak ada data Kepala Keluarga yang cocok dengan filter atau pencarian Anda.
              </div>
            ) : (
              filteredKkList.map((kk) => {
                const isExpanded = expandedKKId === kk.id;
                const members = familyMembersMap[kk.id] || [];

                return (
                  <div
                    key={kk.id}
                    className="bg-white rounded-2xl border border-orange-200/80 shadow-xs overflow-hidden transition-all duration-200"
                  >
                    <div className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-orange-50/60 to-white">
                      
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-orange-600 text-white rounded-xl shrink-0 mt-0.5">
                          <Home className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-slate-900 text-sm">{kk.nama_kepala_keluarga}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 border border-orange-200">
                              {kk.status_warga}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                            <span>No. KK: <code className="font-bold text-slate-800">{kk.no_kk}</code></span>
                            <span>•</span>
                            <span>{kk.alamat} (RT {kk.rt} / RW {kk.rw})</span>
                          </div>
                          <div className="text-[11px] font-bold text-amber-800 flex items-center gap-3">
                            <span>{kk.wilayah}</span>
                            {kk.kartu_biru_paroki?.memiliki && (
                              <span className="text-blue-700 flex items-center gap-0.5">
                                <Building2 className="w-3 h-3" /> Kartu Biru
                              </span>
                            )}
                            {kk.kartu_merah_lingkungan?.memiliki && (
                              <span className="text-red-700 flex items-center gap-0.5">
                                <CreditCard className="w-3 h-3" /> Kartu Merah
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Controls for Pengurus */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
                        <button
                          onClick={() => handleQuickSetorIuran(kk)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                          title="Catat Setoran Iuran per KK Ini"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> + Setor
                        </button>

                        <button
                          onClick={() => handleOpenCetakKK(kk)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                          title="Cetak Kartu Keluarga"
                        >
                          <Printer className="w-3.5 h-3.5" /> Cetak KK
                        </button>

                        <button
                          onClick={() => {
                            setSelectedKKToEdit(kk);
                            setIsFormKKOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>

                        <button
                          onClick={() => {
                            setSelectedKKForAnggota({ id: kk.id, no_kk: kk.no_kk });
                            setSelectedAnggotaToEdit(undefined);
                            setIsFormAnggotaOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> + Anggota
                        </button>

                        {/* Cascading Delete Button */}
                        <button
                          onClick={() => handleDeleteKK(kk)}
                          className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="Hapus Cascading KK & Seluruh Anggota"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>

                        <button
                          onClick={() => handleToggleExpand(kk.id, kk.no_kk)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>

                    </div>

                    {/* Expand Anggota Keluarga */}
                    {isExpanded && (
                      <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
                        <div className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-orange-600" />
                          <span>Anggota Keluarga ({members.length} Orang)</span>
                        </div>

                        {members.length === 0 ? (
                          <div className="text-xs text-slate-500 py-3 text-center italic">
                            Belum ada anggota keluarga. Klik "+ Anggota" untuk menambahkan.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {members.map((ak) => (
                              <div
                                key={ak.id}
                                className="bg-white p-3 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                              >
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-900 flex items-center gap-2">
                                    <span>{ak.nama_lengkap}</span>
                                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                      {ak.hub_keluarga}
                                    </span>
                                    {ak.status_perkawinan && (
                                      <span className="text-[10px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                        {ak.status_perkawinan}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 flex items-center gap-3">
                                    <span>NIK: <code className="font-bold text-slate-800">{ak.nik}</code></span>
                                    <span>• Usia: {calculateAge(ak.tanggal_lahir)} Thn</span>
                                    <span>• {ak.jenis_kelamin}</span>
                                    <span>• Agama: <strong className="text-orange-800">{ak.agama}</strong></span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center">
                                  <button
                                    onClick={() => {
                                      setSelectedKKForAnggota({ id: kk.id, no_kk: kk.no_kk });
                                      setSelectedAnggotaToEdit(ak);
                                      setIsFormAnggotaOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAnggota(ak.id, kk.id, kk.no_kk)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
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

      {/* ================= TAB 2: INVENTARIS LINGKUNGAN ================= */}
      {activeTab === 'inventaris' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-800">Tabel Inventaris Lingkungan</h2>
              <p className="text-xs text-slate-500">
                Pendataan barang & aset milik Lingkungan St. Maria Magdalena Kediri
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportInventarisToExcel(inventarisList)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Export Data Inventaris ke Excel"
              >
                <FileSpreadsheet className="w-4 h-4" /> Export Excel
              </button>
              <button
                onClick={() => {
                  setInvForm({ kondisi: 'Baik', jumlah: 1, satuan: 'Unit' });
                  setIsModalInvOpen(true);
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tambah Barang
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-orange-100 overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-orange-50/80 text-orange-900 border-b border-orange-200 font-extrabold">
                  <th className="p-3">No.</th>
                  <th className="p-3">Nama Barang</th>
                  <th className="p-3">Jumlah</th>
                  <th className="p-3">Satuan</th>
                  <th className="p-3">Tempat Penyimpanan</th>
                  <th className="p-3">Kondisi</th>
                  <th className="p-3">Keterangan</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventarisList.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-700">{inv.no_urut}</td>
                    <td className="p-3 font-bold text-slate-900">{inv.nama_barang}</td>
                    <td className="p-3 font-extrabold text-slate-800">{inv.jumlah}</td>
                    <td className="p-3 font-semibold text-slate-700">{inv.satuan || 'Unit'}</td>
                    <td className="p-3 text-slate-700">{inv.tempat_penyimpanan}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          inv.kondisi === 'Baik'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : inv.kondisi === 'Rusak Ringan'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                      >
                        {inv.kondisi}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{inv.keterangan || '-'}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setInvForm(inv);
                            setIsModalInvOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteInv(inv.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: IURAN KARTU MERAH LINGKUNGAN ================= */}
      {activeTab === 'iuran' && (
        <div className="space-y-4">
          
          {/* Header & Export Controls */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-800">Laporan & Pencatatan Setoran Iuran Kartu Merah</h2>
              <p className="text-xs text-slate-500">
                Pencatatan iuran per No. KK & Kepala Keluarga (Kas Lingkungan, Duka, Paskah & Natal, Sukarela)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportIuranToExcel(filteredIuranList)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Export Data Iuran Terfilter ke Excel"
              >
                <FileSpreadsheet className="w-4 h-4" /> Export Excel
              </button>
              <button
                onClick={() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const dateObj = new Date(todayStr);
                  const day = getDayName(todayStr);
                  const month = dateObj.toLocaleString('id-ID', { month: 'long' });
                  const year = dateObj.getFullYear().toString();

                  setIuranForm({
                    id: undefined,
                    tanggal_bayar: todayStr,
                    hari: day,
                    bulan: month,
                    tahun: year,
                    jumlah_iuran: 50000,
                    jenis_iuran: 'Kas Lingkungan',
                    catatan: `Setoran Iuran Bulan ${month} ${year}`
                  });
                  setIsModalIuranOpen(true);
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> + Setor Iuran Baru
              </button>
            </div>
          </div>

          {/* Quick Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 text-white p-3 rounded-2xl shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-orange-100">Total Setoran</span>
              <div className="text-base font-black truncate">{formatRupiah(totalIuranFiltered)}</div>
              <div className="text-[10px] text-amber-100">{filteredIuranList.length} Transaksi</div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-orange-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Kas Lingkungan</span>
              <div className="text-sm font-extrabold text-orange-700">{formatRupiah(totalKasLingkungan)}</div>
              <div className="text-[10px] text-slate-400">Iuran Bulanan Warga</div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-red-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Iuran Duka</span>
              <div className="text-sm font-extrabold text-red-700">{formatRupiah(totalIuranDuka)}</div>
              <div className="text-[10px] text-slate-400">Dana Saling Bantu</div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-purple-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Paskah & Natal</span>
              <div className="text-sm font-extrabold text-purple-700">{formatRupiah(totalPaskahNatal)}</div>
              <div className="text-[10px] text-slate-400">Perayaan Hari Raya</div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-emerald-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Sukarela</span>
              <div className="text-sm font-extrabold text-emerald-700">{formatRupiah(totalSukarela)}</div>
              <div className="text-[10px] text-slate-400">Donasi Kebajikan</div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-blue-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Total KK Terdaftar</span>
              <div className="text-sm font-extrabold text-blue-700">{kkList.length} KK</div>
              <div className="text-[10px] text-slate-400">Kartu Merah Lingkungan</div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-orange-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={iuranSearchQuery}
                onChange={(e) => setIuranSearchQuery(e.target.value)}
                placeholder="Cari Nama KK, No. KK, Jenis, atau Catatan..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Filter Bulan */}
            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-600 hidden sm:inline">Bulan:</span>
              <select
                value={iuranMonthFilter}
                onChange={(e) => setIuranMonthFilter(e.target.value)}
                className="px-2.5 py-2 border border-slate-300 rounded-xl font-semibold bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="Semua Bulan">-- Semua Bulan --</option>
                {[
                  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                ].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Filter Tahun */}
            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-600 hidden sm:inline">Tahun:</span>
              <select
                value={iuranYearFilter}
                onChange={(e) => setIuranYearFilter(e.target.value)}
                className="px-2.5 py-2 border border-slate-300 rounded-xl font-semibold bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="Semua Tahun">-- Semua Tahun --</option>
                {['2024', '2025', '2026', '2027', '2028'].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Filter Jenis */}
            <div className="flex items-center gap-1">
              <select
                value={iuranJenisFilter}
                onChange={(e) => setIuranJenisFilter(e.target.value)}
                className="px-2.5 py-2 border border-slate-300 rounded-xl font-semibold bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="Semua Jenis">-- Semua Jenis Iuran --</option>
                <option value="Kas Lingkungan">Kas Lingkungan</option>
                <option value="Iuran Duka">Iuran Duka</option>
                <option value="Paskah & Natal">Paskah & Natal</option>
                <option value="Sukarela">Sukarela</option>
              </select>
            </div>

            {(iuranSearchQuery || iuranMonthFilter !== 'Semua Bulan' || iuranYearFilter !== 'Semua Tahun' || iuranJenisFilter !== 'Semua Jenis') && (
              <button
                onClick={() => {
                  setIuranSearchQuery('');
                  setIuranMonthFilter('Semua Bulan');
                  setIuranYearFilter('Semua Tahun');
                  setIuranJenisFilter('Semua Jenis');
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0"
              >
                Reset Filter
              </button>
            )}

          </div>

          {/* Table Setoran Iuran */}
          <div className="bg-white rounded-2xl shadow-xs border border-orange-100 overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-orange-50/90 text-orange-950 border-b border-orange-200 font-extrabold">
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Hari / Bulan / Thn</th>
                  <th className="p-3">No. KK</th>
                  <th className="p-3">Kepala Keluarga</th>
                  <th className="p-3">Jenis Iuran</th>
                  <th className="p-3">Besaran Setoran</th>
                  <th className="p-3">Catatan</th>
                  <th className="p-3">Diinput Oleh</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIuranList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 italic">
                      Tidak ada catatan setoran iuran yang sesuai dengan pencarian / filter Anda.
                    </td>
                  </tr>
                ) : (
                  filteredIuranList.map((iur) => (
                    <tr key={iur.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="p-3 font-semibold text-slate-800 whitespace-nowrap">{iur.tanggal_bayar}</td>
                      <td className="p-3 text-slate-700 font-medium whitespace-nowrap">
                        <span className="font-bold text-slate-900">{iur.hari}</span>, {iur.bulan} {iur.tahun}
                      </td>
                      <td className="p-3 font-bold text-slate-700 whitespace-nowrap">
                        <code>{iur.no_kk}</code>
                      </td>
                      <td className="p-3 font-extrabold text-slate-900">{iur.nama_kk}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] border ${
                          iur.jenis_iuran === 'Kas Lingkungan'
                            ? 'bg-orange-100 text-orange-900 border-orange-200'
                            : iur.jenis_iuran === 'Iuran Duka'
                            ? 'bg-red-100 text-red-900 border-red-200'
                            : iur.jenis_iuran === 'Paskah & Natal'
                            ? 'bg-purple-100 text-purple-900 border-purple-200'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-200'
                        }`}>
                          {iur.jenis_iuran}
                        </span>
                      </td>
                      <td className="p-3 font-extrabold text-emerald-700 whitespace-nowrap">
                        {formatRupiah(iur.jumlah_iuran)}
                      </td>
                      <td className="p-3 text-slate-600 max-w-xs truncate">{iur.catatan || '-'}</td>
                      <td className="p-3 text-slate-500 font-medium whitespace-nowrap">{iur.diinput_oleh}</td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEditIuran(iur)}
                            className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                            title="Edit Setoran Iuran Ini"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteIuran(iur.id)}
                            className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                            title="Hapus Catatan Iuran Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ================= TAB 4: TABEL PELAYANAN LINGKUNGAN ================= */}
      {activeTab === 'pelayanan' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-800">Tabel Pelayanan Lingkungan</h2>
              <p className="text-xs text-slate-500">
                Seksi Liturgi, Asisten Imam, Misdinar, Ketua, Sekretaris, Bendahara, dll.
              </p>
            </div>
            <button
              onClick={() => {
                setPelayananForm({ kategori: 'Seksi Liturgi', periode: '2024-2027' });
                setIsModalPelayananOpen(true);
              }}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Petugas Pelayanan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pelayananList.map((pel) => (
              <div
                key={pel.id}
                className="bg-white rounded-2xl p-4 border border-orange-200/80 shadow-xs space-y-2 hover:border-orange-400 transition-all"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                    {pel.kategori}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setPelayananForm(pel);
                        setIsModalPelayananOpen(true);
                      }}
                      className="p-1 rounded hover:bg-slate-100 text-slate-600"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePelayanan(pel.id)}
                      className="p-1 rounded hover:bg-red-50 text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="font-extrabold text-slate-900 text-sm">{pel.nama_petugas}</div>
                <div className="text-xs font-semibold text-orange-800">{pel.jabatan_tugas}</div>
                <div className="text-[11px] text-slate-500">
                  HP/WA: {pel.no_hp || '-'} • Periode: {pel.periode || '2024-2027'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 5: JADWAL, KEGIATAN & PENGUMUMAN / FLYER ================= */}
      {activeTab === 'kegiatan' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-orange-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-orange-600" />
                <span>Jadwal, Kegiatan & Pengumuman / Flyer Lingkungan</span>
              </h2>
              <p className="text-xs text-slate-500">
                Buat pengumuman warga, unggah flyer/poster visual, serta atur jadwal doa, Misa, dan dokumentasi acara.
              </p>
            </div>
            <button
              onClick={() => {
                const todayStr = new Date().toISOString().split('T')[0];
                setKegiatanForm({ kategori: 'Pengumuman / Flyer Warga', tanggal: todayStr, waktu: 'Setiap Saat' });
                setIsModalKegiatanOpen(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>+ Buat Pengumuman / Jadwal</span>
            </button>
          </div>

          {/* Sub Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setKegiatanTabFilter('Semua')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                kegiatanTabFilter === 'Semua'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Semua ({kegiatanList.length})
            </button>
            <button
              onClick={() => setKegiatanTabFilter('Pengumuman')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                kegiatanTabFilter === 'Pengumuman'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Pengumuman & Flyer ({kegiatanList.filter(k => k.kategori.includes('Pengumuman')).length})</span>
            </button>
            <button
              onClick={() => setKegiatanTabFilter('Jadwal')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                kegiatanTabFilter === 'Jadwal'
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
            <div className="bg-white p-8 rounded-2xl text-center border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
              <Megaphone className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Belum ada jadwal atau pengumuman yang dibuat.</p>
              <p className="text-[11px] text-slate-400">Klik tombol "+ Buat Pengumuman / Jadwal" di atas untuk menambahkan pengumuman atau flyer baru.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kegiatanList
                .filter((kg) => {
                  if (kegiatanTabFilter === 'Pengumuman') return kg.kategori.includes('Pengumuman');
                  if (kegiatanTabFilter === 'Jadwal') return !kg.kategori.includes('Pengumuman');
                  return true;
                })
                .map((kg) => {
                  const isPengumuman = kg.kategori.includes('Pengumuman');
                  return (
                    <div
                      key={kg.id}
                      className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:shadow-md ${
                        isPengumuman ? 'border-rose-200/90 ring-1 ring-rose-100' : 'border-orange-200/80'
                      }`}
                    >
                      {/* Flyer / Foto Display */}
                      {kg.foto_base64 ? (
                        <div className="h-52 w-full bg-slate-950 overflow-hidden relative group cursor-pointer" onClick={() => setSelectedFlyerImage({ url: kg.foto_base64!, title: kg.judul_kegiatan })}>
                          <img
                            src={kg.foto_base64}
                            alt={kg.judul_kegiatan}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-95 group-hover:opacity-100"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-xs">
                            <Eye className="w-4 h-4" />
                            <span>Lihat Flyer / Foto Full</span>
                          </div>
                          {isPengumuman && (
                            <div className="absolute top-3 left-3 bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                              <Megaphone className="w-3 h-3" /> FLYER PENGUMUMAN
                            </div>
                          )}
                        </div>
                      ) : null}

                      <div className="p-4 sm:p-5 space-y-3 flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                              isPengumuman
                                ? 'bg-rose-100 text-rose-900 border-rose-200'
                                : 'bg-orange-100 text-orange-900 border-orange-200'
                            }`}
                          >
                            {kg.kategori}
                          </span>
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                            📅 {kg.tanggal} {kg.waktu ? `• ⏰ ${kg.waktu}` : ''}
                          </span>
                        </div>

                        <h3 className="font-black text-slate-900 text-base leading-snug">{kg.judul_kegiatan}</h3>
                        
                        {kg.lokasi && (
                          <p className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                            📍 {kg.lokasi}
                          </p>
                        )}

                        {kg.keterangan && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 whitespace-pre-line leading-relaxed font-normal">
                            {kg.keterangan}
                          </div>
                        )}
                      </div>

                      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-400 font-medium">
                          Status: Akses Pengurus (Edit/Hapus)
                        </span>
                        <div className="flex items-center gap-1.5">
                          {kg.foto_base64 && (
                            <button
                              type="button"
                              onClick={() => setSelectedFlyerImage({ url: kg.foto_base64!, title: kg.judul_kegiatan })}
                              className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              title="Lihat Flyer / Foto"
                            >
                              <Eye className="w-3.5 h-3.5" /> Lihat
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setKegiatanForm(kg);
                              setIsModalKegiatanOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold transition-colors cursor-pointer"
                            title="Edit Pengumuman / Jadwal"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteKegiatan(kg.id)}
                            className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-bold transition-colors cursor-pointer"
                            title="Hapus Pengumuman / Jadwal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL INVENTARIS ================= */}
      {isModalInvOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-hidden">
          <form
            onSubmit={handleSaveInv}
            className="bg-white rounded-2xl max-w-md w-full max-h-[92dvh] sm:max-h-[90vh] flex flex-col text-xs shadow-2xl border border-emerald-200 overflow-hidden animate-in fade-in zoom-in duration-200"
          >
            {/* Header with Emerald background */}
            <div className="shrink-0 bg-gradient-to-r from-emerald-600 to-teal-600 px-4 sm:px-6 py-3.5 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5 sm:gap-3 font-extrabold text-sm sm:text-base">
                <div className="bg-white/95 p-1 px-2.5 rounded-xl shadow-sm border border-emerald-200 shrink-0">
                  <SapaLogo size="xs" showText={false} />
                </div>
                <span className="truncate">Tambah / Edit Barang Inventaris</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalInvOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 text-slate-800">
              <div>
                <label className="block font-bold mb-1">Nama Barang</label>
                <input
                  type="text"
                  value={invForm.nama_barang || ''}
                  onChange={(e) => setInvForm({ ...invForm, nama_barang: e.target.value })}
                  className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-medium"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Jumlah</label>
                  <input
                    type="number"
                    value={invForm.jumlah || 1}
                    onChange={(e) => setInvForm({ ...invForm, jumlah: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-medium"
                    min={1}
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Satuan Barang</label>
                  <select
                    value={
                      SATUAN_OPTIONS.includes(invForm.satuan || 'Unit')
                        ? invForm.satuan || 'Unit'
                        : 'Lainnya'
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'Lainnya') {
                        setInvForm({ ...invForm, satuan: '' });
                      } else {
                        setInvForm({ ...invForm, satuan: val });
                      }
                    }}
                    className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-medium bg-white focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  >
                    {SATUAN_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                    <option value="Lainnya">Lainnya (Ketik Manual)...</option>
                  </select>

                  {!SATUAN_OPTIONS.includes(invForm.satuan || '') && (
                    <input
                      type="text"
                      value={invForm.satuan || ''}
                      onChange={(e) => setInvForm({ ...invForm, satuan: e.target.value })}
                      placeholder="Tulis satuan khusus..."
                      className="w-full mt-2 px-3 py-2 border border-orange-300 rounded-xl text-sm sm:text-xs font-medium focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      required
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Tempat Penyimpanan</label>
                <input
                  type="text"
                  value={invForm.tempat_penyimpanan || ''}
                  onChange={(e) => setInvForm({ ...invForm, tempat_penyimpanan: e.target.value })}
                  className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-medium"
                  required
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Kondisi</label>
                <select
                  value={invForm.kondisi || 'Baik'}
                  onChange={(e) => setInvForm({ ...invForm, kondisi: e.target.value as any })}
                  className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-bold"
                >
                  <option value="Baik">Baik</option>
                  <option value="Rusak Ringan">Rusak Ringan</option>
                  <option value="Rusak Berat">Rusak Berat</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Keterangan</label>
                <input
                  type="text"
                  value={invForm.keterangan || ''}
                  onChange={(e) => setInvForm({ ...invForm, keterangan: e.target.value })}
                  className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-medium"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalInvOpen(false)}
                className="px-4 py-2 sm:py-1.5 font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl cursor-pointer text-sm sm:text-xs"
              >
                Batal
              </button>
              <button type="submit" className="px-5 py-2 sm:py-1.5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm cursor-pointer text-sm sm:text-xs">
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL IURAN ================= */}
      {isModalIuranOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-hidden">
          <form
            onSubmit={handleSaveIuran}
            className="bg-white rounded-2xl max-w-lg w-full max-h-[92dvh] sm:max-h-[90vh] flex flex-col text-xs shadow-2xl border border-orange-200 overflow-hidden animate-in fade-in zoom-in duration-200"
          >
            {/* Header with Orange/Amber background */}
            <div className="shrink-0 bg-gradient-to-r from-orange-600 to-amber-600 px-4 sm:px-6 py-3.5 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5 sm:gap-3 font-extrabold text-sm sm:text-base">
                <div className="bg-white/95 p-1 px-2.5 rounded-xl shadow-sm border border-orange-200 shrink-0">
                  <SapaLogo size="xs" showText={false} />
                </div>
                <span className="truncate">
                  {iuranForm.id ? 'Edit Catatan Setoran Iuran' : 'Input Setoran Iuran Kartu Merah'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalIuranOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 text-slate-800">
              
              {/* Select Kepala Keluarga */}
              <div>
                <label className="block font-bold mb-1">Pilih Kepala Keluarga & No. KK</label>
                <select
                  value={iuranForm.no_kk || ''}
                  onChange={(e) => {
                    const selected = kkList.find((k) => k.no_kk === e.target.value);
                    setIuranForm((prev) => ({
                      ...prev,
                      no_kk: e.target.value,
                      nama_kk: selected?.nama_kepala_keluarga || ''
                    }));
                  }}
                  className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-extrabold bg-slate-50 focus:bg-white"
                  required
                >
                  <option value="">-- Pilih Kepala Keluarga --</option>
                  {kkList.map((k) => (
                    <option key={k.id} value={k.no_kk}>
                      {k.nama_kepala_keluarga} — No. KK: {k.no_kk}
                    </option>
                  ))}
                </select>
              </div>

              {/* KK Summary Badge */}
              {iuranForm.no_kk && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-0.5">
                  <div className="text-[10px] font-bold text-amber-800 uppercase">Detail Penyetor</div>
                  <div className="font-black text-slate-900 text-sm">{iuranForm.nama_kk}</div>
                  <div className="text-xs text-slate-600 font-bold">No. KK: <code>{iuranForm.no_kk}</code></div>
                </div>
              )}

              {/* Tanggal Bayar Picker */}
              <div>
                <label className="block font-bold mb-1">Tanggal Transaksi Setoran</label>
                <input
                  type="date"
                  value={iuranForm.tanggal_bayar || ''}
                  onChange={(e) => handleIuranDateChange(e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-medium"
                  required
                />
              </div>

              {/* Detail Periode Setoran (Hari, Bulan, Tahun) */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold mb-1">Hari</label>
                  <input
                    type="text"
                    value={iuranForm.hari || ''}
                    onChange={(e) => setIuranForm({ ...iuranForm, hari: e.target.value })}
                    placeholder="Senin, Selasa..."
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Bulan Iuran</label>
                  <select
                    value={iuranForm.bulan || 'Januari'}
                    onChange={(e) => setIuranForm({ ...iuranForm, bulan: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                    required
                  >
                    {[
                      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                    ].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Tahun</label>
                  <input
                    type="text"
                    value={iuranForm.tahun || '2026'}
                    onChange={(e) => setIuranForm({ ...iuranForm, tahun: e.target.value })}
                    placeholder="2026"
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Jenis Iuran */}
              <div>
                <label className="block font-bold mb-1">Jenis Iuran Kartu Merah</label>
                <select
                  value={iuranForm.jenis_iuran || 'Kas Lingkungan'}
                  onChange={(e) => setIuranForm({ ...iuranForm, jenis_iuran: e.target.value as any })}
                  className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-bold"
                >
                  <option value="Kas Lingkungan">Kas Lingkungan (Bulanan)</option>
                  <option value="Iuran Duka">Iuran Duka (Duka Cita)</option>
                  <option value="Paskah & Natal">Paskah & Natal (Hari Raya)</option>
                  <option value="Sukarela">Sukarela (Donasi / Sumbangan)</option>
                </select>
              </div>

              {/* Besaran Setoran */}
              <div>
                <label className="block font-bold mb-1">Besaran Setoran (Rp)</label>
                <input
                  type="number"
                  value={iuranForm.jumlah_iuran || 50000}
                  onChange={(e) => setIuranForm({ ...iuranForm, jumlah_iuran: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-black text-emerald-800"
                  step={5000}
                  required
                />
              </div>

              {/* Catatan */}
              <div>
                <label className="block font-bold mb-1">Catatan / Keterangan Setoran</label>
                <input
                  type="text"
                  value={iuranForm.catatan || ''}
                  onChange={(e) => setIuranForm({ ...iuranForm, catatan: e.target.value })}
                  placeholder="Contoh: Setoran Bulan Februari 2026"
                  className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-medium"
                />
              </div>

            </div>

            {/* Footer */}
            <div className="shrink-0 px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalIuranOpen(false)}
                className="px-4 py-2 sm:py-1.5 font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl cursor-pointer text-sm sm:text-xs"
              >
                Batal
              </button>
              <button type="submit" className="px-5 py-2 sm:py-1.5 font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-sm cursor-pointer text-sm sm:text-xs">
                {iuranForm.id ? 'Simpan Perubahan' : 'Simpan Setoran'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL PELAYANAN ================= */}
      {isModalPelayananOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-hidden">
          <form
            onSubmit={handleSavePelayanan}
            className="bg-white rounded-2xl max-w-md w-full max-h-[92dvh] sm:max-h-[90vh] flex flex-col text-xs shadow-2xl border border-blue-200 overflow-hidden animate-in fade-in zoom-in duration-200"
          >
            {/* Header with Blue/Indigo background */}
            <div className="shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-3.5 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5 sm:gap-3 font-extrabold text-sm sm:text-base">
                <div className="bg-white/95 p-1 px-2.5 rounded-xl shadow-sm border border-blue-200 shrink-0">
                  <SapaLogo size="xs" showText={false} />
                </div>
                <span className="truncate">Tambah / Edit Petugas Pelayanan</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalPelayananOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 text-slate-800">
              <div>
                <label className="block font-bold mb-1">Kategori Pelayanan</label>
                <select
                  value={pelayananForm.kategori || 'Seksi Liturgi'}
                  onChange={(e) => setPelayananForm({ ...pelayananForm, kategori: e.target.value as any })}
                  className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-bold"
                >
                  <option value="Seksi Liturgi">Seksi Liturgi</option>
                  <option value="Asisten Imam">Asisten Imam (Prodiakon)</option>
                  <option value="Misdinar">Misdinar</option>
                  <option value="Ketua Lingkungan">Ketua Lingkungan</option>
                  <option value="Sekretaris">Sekretaris</option>
                  <option value="Bendahara">Bendahara</option>
                  <option value="Pengurus Lingkungan">Pengurus Lingkungan</option>
                  <option value="Seksi Humas">Seksi Humas</option>
                  <option value="Seksi Diakonia">Seksi Diakonia</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Nama Petugas</label>
                <input
                  type="text"
                  value={pelayananForm.nama_petugas || ''}
                  onChange={(e) => setPelayananForm({ ...pelayananForm, nama_petugas: e.target.value })}
                  className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-medium"
                  required
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Jabatan / Tugas</label>
                <input
                  type="text"
                  value={pelayananForm.jabatan_tugas || ''}
                  onChange={(e) => setPelayananForm({ ...pelayananForm, jabatan_tugas: e.target.value })}
                  placeholder="Koordinator Nyanyian / Asisten Imam"
                  className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-medium"
                  required
                />
              </div>
              <div>
                <label className="block font-bold mb-1">No. HP / WA</label>
                <input
                  type="text"
                  value={pelayananForm.no_hp || ''}
                  onChange={(e) => setPelayananForm({ ...pelayananForm, no_hp: e.target.value })}
                  className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-medium"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Periode Jabatan</label>
                <input
                  type="text"
                  value={pelayananForm.periode || '2024-2027'}
                  onChange={(e) => setPelayananForm({ ...pelayananForm, periode: e.target.value })}
                  className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-medium"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalPelayananOpen(false)}
                className="px-4 py-2 sm:py-1.5 font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl cursor-pointer text-sm sm:text-xs"
              >
                Batal
              </button>
              <button type="submit" className="px-5 py-2 sm:py-1.5 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm cursor-pointer text-sm sm:text-xs">
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL KEGIATAN & PENGUMUMAN ================= */}
      {isModalKegiatanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-hidden">
          <form
            onSubmit={handleSaveKegiatan}
            className="bg-white rounded-2xl max-w-md w-full max-h-[92dvh] sm:max-h-[90vh] flex flex-col text-xs shadow-2xl border border-purple-200 overflow-hidden animate-in fade-in zoom-in duration-200"
          >
            {/* Header with Orange/Amber background */}
            <div className="shrink-0 bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 px-4 sm:px-6 py-3.5 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5 sm:gap-3 font-extrabold text-sm sm:text-base">
                <div className="bg-white/95 p-1 px-2.5 rounded-xl shadow-sm border border-orange-200 shrink-0">
                  <SapaLogo size="xs" showText={false} />
                </div>
                <span className="truncate">Input Jadwal, Pengumuman & Flyer</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalKegiatanOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 text-slate-800">
              <div>
                <label className="block font-bold mb-1">Judul Kegiatan / Pengumuman</label>
                <input
                  type="text"
                  value={kegiatanForm.judul_kegiatan || ''}
                  onChange={(e) => setKegiatanForm({ ...kegiatanForm, judul_kegiatan: e.target.value })}
                  placeholder="Contoh: Pengumuman Kerja Bakti / Misa Lingkungan"
                  className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-medium focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Kategori</label>
                <select
                  value={kegiatanForm.kategori || 'Pengumuman / Flyer Warga'}
                  onChange={(e) => setKegiatanForm({ ...kegiatanForm, kategori: e.target.value as any })}
                  className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-bold bg-white focus:ring-2 focus:ring-orange-400 focus:outline-none"
                >
                  <option value="Pengumuman / Flyer Warga">📢 Pengumuman / Flyer Warga</option>
                  <option value="Pengumuman Penting">🚨 Pengumuman Penting / Darurat</option>
                  <option value="Doa Lingkungan">🙏 Doa Lingkungan / Rosario</option>
                  <option value="Ibadat Sabda">📖 Ibadat Sabda</option>
                  <option value="Misa Lingkungan">⛪ Misa Lingkungan</option>
                  <option value="Rapat Pengurus">👥 Rapat Pengurus</option>
                  <option value="Kerja Bakti">🧹 Kerja Bakti</option>
                  <option value="Perayaan Sektor/Paroki">🎉 Perayaan Sektor/Paroki</option>
                  <option value="Lainnya">📌 Lainnya</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={kegiatanForm.tanggal || ''}
                    onChange={(e) => setKegiatanForm({ ...kegiatanForm, tanggal: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Waktu</label>
                  <input
                    type="text"
                    value={kegiatanForm.waktu || ''}
                    onChange={(e) => setKegiatanForm({ ...kegiatanForm, waktu: e.target.value })}
                    placeholder="18:30 WIB / Setiap Saat"
                    className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Lokasi / Tempat</label>
                <input
                  type="text"
                  value={kegiatanForm.lokasi || ''}
                  onChange={(e) => setKegiatanForm({ ...kegiatanForm, lokasi: e.target.value })}
                  placeholder="Rumah Bpk. Sugeng / Gereja / Daring / Umum"
                  className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Keterangan / Detail Isi Pengumuman & Acara</label>
                <textarea
                  value={kegiatanForm.keterangan || ''}
                  onChange={(e) => setKegiatanForm({ ...kegiatanForm, keterangan: e.target.value })}
                  placeholder="Tuliskan rincian pengumuman, agenda acara, imbauan, atau informasi penting untuk dibaca seluruh warga..."
                  rows={4}
                  className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-medium focus:ring-2 focus:ring-orange-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Upload Gambar Flyer / Poster / Foto Dokumentasi</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-sm sm:text-xs"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Gambar akan dikompres otomatis agar hemat storage & cepat dibuka oleh warga di HP.
                </p>

                {kegiatanForm.foto_base64 && (
                  <div className="mt-2.5 p-2 bg-slate-100 rounded-xl border border-slate-200 relative group">
                    <img
                      src={kegiatanForm.foto_base64}
                      alt="Preview Flyer"
                      className="w-full max-h-40 object-contain rounded-lg bg-black/90"
                    />
                    <button
                      type="button"
                      onClick={() => setKegiatanForm((prev) => ({ ...prev, foto_base64: '' }))}
                      className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white p-1 rounded-lg text-[10px] font-bold shadow-md cursor-pointer"
                    >
                      Hapus Foto/Flyer
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalKegiatanOpen(false)}
                className="px-4 py-2 sm:py-1.5 font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl cursor-pointer text-sm sm:text-xs"
              >
                Batal
              </button>
              <button type="submit" className="px-5 py-2 sm:py-1.5 font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-sm cursor-pointer text-sm sm:text-xs">
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= LIGHTBOX FLYER MODAL ================= */}
      {selectedFlyerImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6" onClick={() => setSelectedFlyerImage(null)}>
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

      {/* Form KK Modal for Pengurus */}
      {isFormKKOpen && (
        <FormKK
          initialData={selectedKKToEdit}
          isOpen={isFormKKOpen}
          onClose={() => setIsFormKKOpen(false)}
          onSaved={handleKKSaved}
          currentUsername={user.username}
        />
      )}

      {/* Form Anggota Modal for Pengurus */}
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

      {/* Cetak KK Modal for Pengurus */}
      {isCetakModalOpen && kkToPrint && (
        <CetakKKModal
          kk={kkToPrint}
          members={membersToPrint}
          isOpen={isCetakModalOpen}
          onClose={() => setIsCetakModalOpen(false)}
        />
      )}

      {/* Reusable Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
      />

    </div>
  );
};
