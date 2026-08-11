import React, { useState, useEffect } from 'react';
import { KepalaKeluarga, AnggotaKeluarga, LIST_16_WILAYAH, WILAYAH_GROUPS, StatusWarga } from '../types';
import { saveKepalaKeluarga, saveAnggotaKeluarga, getAnggotaKeluargaByKK, deleteAnggotaKeluarga } from '../lib/database';
import { Home, Check, X, CreditCard, Building2, ChevronRight, ChevronLeft, UserPlus, Users, Edit, Trash2, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { SapaLogo } from './SapaLogo';
import { FormAnggotaKeluarga } from './FormAnggotaKeluarga';

interface FormKKProps {
  initialData?: Partial<KepalaKeluarga>;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (kk: KepalaKeluarga) => void;
  currentUsername: string;
}

export const FormKK: React.FC<FormKKProps> = ({
  initialData,
  isOpen,
  onClose,
  onSaved,
  currentUsername
}) => {
  // Step State: 1 = Input/Edit Data KK, 2 = Cek Data & Anggota Keluarga
  const [step, setStep] = useState<1 | 2>(1);

  // KK Fields
  const [noKK, setNoKK] = useState(initialData?.no_kk || '');
  const [namaKepala, setNamaKepala] = useState(initialData?.nama_kepala_keluarga || '');
  const [alamat, setAlamat] = useState(initialData?.alamat || '');
  const [rt, setRt] = useState(initialData?.rt || '001');
  const [rw, setRw] = useState(initialData?.rw || '005');
  const [wilayah, setWilayah] = useState(initialData?.wilayah || LIST_16_WILAYAH[0]);
  const [statusWarga, setStatusWarga] = useState<StatusWarga>(initialData?.status_warga || 'Aktif');
  const [agamaKK, setAgamaKK] = useState(initialData?.agama_kk || 'Katolik');

  // Kartu Biru & Merah
  const [hasKartuBiru, setHasKartuBiru] = useState(initialData?.kartu_biru_paroki?.memiliki ?? true);
  const [noKartuBiru, setNoKartuBiru] = useState(initialData?.kartu_biru_paroki?.no_kartu || '');

  const [hasKartuMerah, setHasKartuMerah] = useState(initialData?.kartu_merah_lingkungan?.memiliki ?? true);
  const [noKartuMerah, setNoKartuMerah] = useState(initialData?.kartu_merah_lingkungan?.no_kartu || '');

  // Draft Anggota Keluarga
  const [draftMembers, setDraftMembers] = useState<AnggotaKeluarga[]>([]);
  const [isFormAnggotaOpen, setIsFormAnggotaOpen] = useState(false);
  const [selectedAnggotaToEdit, setSelectedAnggotaToEdit] = useState<Partial<AnggotaKeluarga> | undefined>(undefined);

  // Submitting & Errors
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Confirmation modal state before final saving
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Load / reset state when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setShowConfirmModal(false);
      setNoKK(initialData?.no_kk || '');
      setNamaKepala(initialData?.nama_kepala_keluarga || '');
      setAlamat(initialData?.alamat || '');
      setRt(initialData?.rt || '001');
      setRw(initialData?.rw || '005');
      setWilayah(initialData?.wilayah || LIST_16_WILAYAH[0]);
      setStatusWarga(initialData?.status_warga || 'Aktif');
      setAgamaKK(initialData?.agama_kk || 'Katolik');
      setHasKartuBiru(initialData?.kartu_biru_paroki?.memiliki ?? true);
      setNoKartuBiru(initialData?.kartu_biru_paroki?.no_kartu || '');
      setHasKartuMerah(initialData?.kartu_merah_lingkungan?.memiliki ?? true);
      setNoKartuMerah(initialData?.kartu_merah_lingkungan?.no_kartu || '');
      setError('');

      // Fetch existing members if editing an existing KK
      if (initialData?.id && initialData?.no_kk) {
        getAnggotaKeluargaByKK(initialData.id, initialData.no_kk).then((members) => {
          setDraftMembers(members);
        });
      } else {
        setDraftMembers([]);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Handler to enforce UPPERCASE for Nama
  const handleNamaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNamaKepala(e.target.value.toUpperCase());
  };

  // Step 1 -> Step 2 validation
  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanKK = noKK.trim();
    if (!cleanKK) {
      setError('Nomor Kartu Keluarga (No. KK) wajib diisi!');
      return;
    }
    if (!namaKepala.trim()) {
      setError('Nama Lengkap Kepala Keluarga wajib diisi!');
      return;
    }
    if (!alamat.trim()) {
      setError('Alamat Rumah / Tempat Tinggal wajib diisi!');
      return;
    }

    setStep(2);
  };

  // Anggota Sub-Modal Handlers
  const handleOpenAddAnggota = () => {
    setSelectedAnggotaToEdit(undefined);
    setIsFormAnggotaOpen(true);
  };

  const handleOpenEditAnggota = (ak: AnggotaKeluarga) => {
    setSelectedAnggotaToEdit(ak);
    setIsFormAnggotaOpen(true);
  };

  const handleAnggotaSaved = (savedMember: AnggotaKeluarga) => {
    setDraftMembers((prev) => {
      const idx = prev.findIndex((m) => m.id === savedMember.id || (m.nik && m.nik === savedMember.nik));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedMember;
        return copy;
      }
      return [...prev, savedMember];
    });
    setIsFormAnggotaOpen(false);
  };

  const handleDeleteDraftMember = async (memberToDelete: AnggotaKeluarga) => {
    if (memberToDelete.id && !memberToDelete.id.startsWith('temp-')) {
      try {
        await deleteAnggotaKeluarga(memberToDelete.id);
      } catch (err) {
        console.error('Error deleting member from DB:', err);
      }
    }
    setDraftMembers((prev) => prev.filter((m) => m.id !== memberToDelete.id && m.nik !== memberToDelete.nik));
  };

  // Final Save Action after user confirms
  const handleFinalSave = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const payload: Partial<KepalaKeluarga> = {
        id: initialData?.id,
        no_kk: noKK.trim(),
        nama_kepala_keluarga: namaKepala.trim().toUpperCase(),
        alamat: alamat.trim().toUpperCase(),
        rt: rt.trim(),
        rw: rw.trim(),
        wilayah,
        status_warga: statusWarga,
        agama_kk: agamaKK,
        kartu_biru_paroki: {
          memiliki: hasKartuBiru,
          no_kartu: noKartuBiru.trim()
        },
        kartu_merah_lingkungan: {
          memiliki: hasKartuMerah,
          no_kartu: noKartuMerah.trim()
        }
      };

      // 1. Save Kepala Keluarga
      const savedKK = await saveKepalaKeluarga(payload, currentUsername);

      // 2. Save any draft family members linked to this KK
      for (const member of draftMembers) {
        await saveAnggotaKeluarga({
          ...member,
          id_keluarga: savedKK.id,
          no_kk: savedKK.no_kk
        });
      }

      onSaved(savedKK);
      setShowConfirmModal(false);
      onClose();
    } catch (err) {
      console.error('Error saving KK:', err);
      setError('Gagal menyimpan data Kartu Keluarga & Anggota Keluarga.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-orange-200 animate-in fade-in zoom-in duration-200 relative">
        
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-red-700 via-orange-600 to-red-600 px-4 sm:px-6 py-3.5 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5 sm:gap-3 font-extrabold text-sm sm:text-lg">
            <div className="bg-white p-1 px-2.5 rounded-xl shadow-sm border border-white/40 shrink-0">
              <SapaLogo size="xs" showText={false} />
            </div>
            <span className="truncate">{initialData?.id ? 'Edit Data Kartu Keluarga' : 'Input KK Baru'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Navigation Bar */}
        <div className="shrink-0 bg-orange-50/80 px-4 sm:px-6 py-2.5 border-b border-orange-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 w-full max-w-md mx-auto">
            {/* Step 1 Pill */}
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl font-bold transition-all ${
                step === 1
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-orange-200 hover:bg-orange-100/50'
              }`}
            >
              <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-extrabold ${
                step === 1 ? 'bg-white text-orange-600' : 'bg-orange-200 text-orange-800'
              }`}>
                1
              </span>
              <span>1. Data Kepala Keluarga</span>
            </button>

            <ChevronRight className="w-4 h-4 text-orange-400 shrink-0" />

            {/* Step 2 Pill */}
            <button
              type="button"
              onClick={() => {
                if (noKK.trim() && namaKepala.trim() && alamat.trim()) {
                  setStep(2);
                } else {
                  setError('Isi terlebih dahulu No. KK, Nama Kepala Keluarga, dan Alamat!');
                }
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl font-bold transition-all ${
                step === 2
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-orange-200 hover:bg-orange-100/50'
              }`}
            >
              <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-extrabold ${
                step === 2 ? 'bg-white text-orange-600' : 'bg-orange-200 text-orange-800'
              }`}>
                2
              </span>
              <span>2. Cek Data & Anggota</span>
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs text-slate-800">
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* ================= STEP 1: INPUT DATA KEPALA KELUARGA ================= */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4 sm:space-y-5">
              
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 text-amber-900 font-medium">
                <p className="font-bold">Langkah 1 dari 2: Pengisian Data Kepala Keluarga</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Silakan masukkan Nomor Kartu Keluarga, Nama Kepala Keluarga, Alamat, Wilayah, dan informasi kartu. Setelah diisi, klik tombol <strong>Lanjut ke Cek Data & Anggota &gt;</strong> di bawah.
                </p>
              </div>

              {/* Grid Informasi Utama */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                
                {/* No KK */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor Kartu Keluarga (No. KK - 16 Digit) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={noKK}
                    onChange={(e) => setNoKK(e.target.value)}
                    placeholder="Contoh: 3506012023000001"
                    className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    required
                  />
                  <span className="text-[10px] text-slate-500 italic">Format angka 16 digit sesuai Kartu Keluarga</span>
                </div>

                {/* Nama Kepala Keluarga (Kapital Otomatis) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Lengkap Kepala Keluarga (KAPITAL) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={namaKepala}
                    onChange={handleNamaChange}
                    placeholder="CONTOH: YOHANES BAPTISTA"
                    className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    required
                  />
                  <span className="text-[10px] text-orange-600 italic">Otomatis diformat huruf KAPITAL</span>
                </div>

                {/* Alamat Lengkap */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Alamat Rumah / Tempat Tinggal (KAPITAL) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value.toUpperCase())}
                    placeholder="JL. VETERAN NO. 45, KEDIRI"
                    className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    required
                  />
                </div>

                {/* RT & RW */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">RT</label>
                  <input
                    type="text"
                    value={rt}
                    onChange={(e) => setRt(e.target.value)}
                    placeholder="001"
                    className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">RW</label>
                  <input
                    type="text"
                    value={rw}
                    onChange={(e) => setRw(e.target.value)}
                    placeholder="005"
                    className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  />
                </div>

                {/* Wilayah */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Wilayah Administrasi / Stasi
                  </label>
                  <select
                    value={wilayah}
                    onChange={(e) => setWilayah(e.target.value)}
                    className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {WILAYAH_GROUPS.map((group) => (
                      <optgroup key={group.category} label={`── ${group.category} ──`}>
                        {group.items.map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Status Warga */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status Keberadaan Warga
                  </label>
                  <select
                    value={statusWarga}
                    onChange={(e) => setStatusWarga(e.target.value as StatusWarga)}
                    className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Pindah Wilayah">Pindah Wilayah</option>
                    <option value="Meninggal Dunia">Meninggal Dunia</option>
                    <option value="Non-Aktif / Pasif">Non-Aktif / Pasif</option>
                  </select>
                </div>

                {/* Agama */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Agama Kepala Keluarga</label>
                  <select
                    value={agamaKK}
                    onChange={(e) => setAgamaKK(e.target.value)}
                    className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Katolik">Katolik</option>
                    <option value="Kristen Protestan">Kristen Protestan</option>
                    <option value="Islam">Islam</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

              </div>

              {/* Section Kartu Biru Paroki & Kartu Merah Lingkungan (Jika Katolik) */}
              {agamaKK === 'Katolik' && (
                <div className="bg-orange-50/70 p-4 rounded-xl border border-orange-200 space-y-4">
                  <div className="flex items-center gap-2 font-bold text-orange-900 border-b border-orange-200/80 pb-2">
                    <CreditCard className="w-4 h-4 text-orange-600" />
                    <span>Kepemilikan Kartu Gereja & Lingkungan</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Kartu Biru Paroki */}
                    <div className="bg-white p-3 rounded-lg border border-orange-200/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-blue-600" /> Kartu Biru Paroki
                        </span>
                        <label className="inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hasKartuBiru}
                            onChange={(e) => setHasKartuBiru(e.target.checked)}
                            className="rounded text-orange-600 focus:ring-orange-500"
                          />
                          <span>Ada / Memiliki</span>
                        </label>
                      </div>

                      {hasKartuBiru && (
                        <input
                          type="text"
                          value={noKartuBiru}
                          onChange={(e) => setNoKartuBiru(e.target.value)}
                          placeholder="No. Kartu Biru Paroki (Opsional)"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                      )}
                    </div>

                    {/* Kartu Merah Lingkungan */}
                    <div className="bg-white p-3 rounded-lg border border-orange-200/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5 text-red-600" /> Kartu Merah Lingkungan
                        </span>
                        <label className="inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hasKartuMerah}
                            onChange={(e) => setHasKartuMerah(e.target.checked)}
                            className="rounded text-orange-600 focus:ring-orange-500"
                          />
                          <span>Ada / Memiliki</span>
                        </label>
                      </div>

                      {hasKartuMerah && (
                        <input
                          type="text"
                          value={noKartuMerah}
                          onChange={(e) => setNoKartuMerah(e.target.value)}
                          placeholder="No. Kartu Merah Lingkungan (Opsional)"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* Step 1 Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <span>Lanjut ke Cek Data & Anggota</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </form>
          )}

          {/* ================= STEP 2: CEK DATA KK & TAMBAH ANGGOTA KELUARGA ================= */}
          {step === 2 && (
            <div className="space-y-5">
              
              {/* Box Cek Data Kepala Keluarga */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-300/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200/80 pb-2.5">
                  <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-amber-600" />
                    <span>Cek Data Kepala Keluarga (Ringkasan Input)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-3 py-1 bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Kembali & Edit KK</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-slate-800 font-medium text-xs">
                  <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200/60">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Nomor KK</span>
                    <span className="font-extrabold text-slate-900 text-sm">{noKK || '-'}</span>
                  </div>

                  <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200/60">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Nama Kepala Keluarga</span>
                    <span className="font-extrabold text-slate-900 uppercase text-xs">{namaKepala || '-'}</span>
                  </div>

                  <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200/60">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Alamat & RT/RW</span>
                    <span className="font-bold text-slate-900">{alamat} (RT {rt} / RW {rw})</span>
                  </div>

                  <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200/60">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Wilayah / Stasi</span>
                    <span className="font-bold text-slate-900">{wilayah}</span>
                  </div>

                  <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200/60">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Status & Agama</span>
                    <span className="font-bold text-slate-900">{statusWarga} • {agamaKK}</span>
                  </div>

                  {agamaKK === 'Katolik' && (
                    <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200/60">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Kartu Biru / Merah</span>
                      <span className="font-bold text-slate-900">
                        {hasKartuBiru ? `Biru (${noKartuBiru || 'Ada'})` : 'Biru (-)'} • {hasKartuMerah ? `Merah (${noKartuMerah || 'Ada'})` : 'Merah (-)'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section Tambah Anggota Keluarga */}
              <div className="bg-white p-4.5 rounded-2xl border border-orange-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <Users className="w-4.5 h-4.5 text-orange-600" />
                      <span>Data Anggota Keluarga</span>
                      <span className="bg-orange-100 text-orange-800 text-[11px] px-2 py-0.5 rounded-full font-bold">
                        {draftMembers.length} Orang
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tambahkan anggota keluarga (istri, anak, orang tua, dll) jika ada. Jika tidak menambah anggota keluarga, Anda dapat langsung menekan tombol <strong>Simpan Data</strong>.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddAnggota}
                    className="px-3.5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ Tambah Anggota Keluarga</span>
                  </button>
                </div>

                {/* List / Table Anggota Keluarga */}
                {draftMembers.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center space-y-2">
                    <p className="font-bold text-slate-700 text-xs">Belum ada anggota keluarga tambahan.</p>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                      Klik tombol <strong>+ Tambah Anggota Keluarga</strong> di atas untuk mendaftarkan anggota keluarga, atau langsung klik tombol <strong>Simpan Data</strong> di bawah jika hanya ingin mendaftarkan Kepala Keluarga.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-orange-50/80 text-orange-950 font-extrabold border-b border-orange-200">
                          <th className="p-2.5 text-center w-10">No</th>
                          <th className="p-2.5">Nama Lengkap & NIK</th>
                          <th className="p-2.5">Hubungan</th>
                          <th className="p-2.5">L/P</th>
                          <th className="p-2.5">Pekerjaan</th>
                          <th className="p-2.5 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {draftMembers.map((ak, idx) => (
                          <tr key={ak.id || idx} className="hover:bg-orange-50/30 transition-colors">
                            <td className="p-2.5 text-center font-bold text-slate-500">{idx + 1}</td>
                            <td className="p-2.5">
                              <div className="font-extrabold text-slate-900 uppercase">{ak.nama_lengkap}</div>
                              <div className="text-[10px] text-slate-500 font-mono">NIK: {ak.nik || '-'}</div>
                            </td>
                            <td className="p-2.5">
                              <div className="font-bold text-amber-800">{ak.hub_keluarga || '-'}</div>
                              {ak.status_perkawinan && (
                                <div className="text-[10px] text-slate-500 font-medium">{ak.status_perkawinan}</div>
                              )}
                            </td>
                            <td className="p-2.5 font-semibold text-slate-700">{ak.jenis_kelamin || '-'}</td>
                            <td className="p-2.5 font-medium text-slate-700">{ak.pekerjaan || '-'}</td>
                            <td className="p-2.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditAnggota(ak)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Anggota"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDraftMember(ak)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Anggota"
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
                )}
              </div>

              {/* Step 2 Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4.5 h-4.5" />
                  <span>Simpan Data</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Sub-Modal: Form Anggota Keluarga */}
      {isFormAnggotaOpen && (
        <FormAnggotaKeluarga
          idKK={initialData?.id || `temp-kk-${Date.now()}`}
          noKK={noKK}
          initialData={selectedAnggotaToEdit}
          isOpen={isFormAnggotaOpen}
          onClose={() => setIsFormAnggotaOpen(false)}
          onSaved={handleAnggotaSaved}
        />
      )}

      {/* Confirmation Modal: "Apakah Data Sudah Benar?" */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-orange-200 text-center animate-in zoom-in-95 duration-150">
            
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
              <HelpCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">Konfirmasi Simpan Data</h3>
              <p className="text-xs font-bold text-slate-700">
                Apakah seluruh data yang Anda masukkan sudah benar?
              </p>
            </div>

            {/* Summary Box inside Confirmation Modal */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left text-xs space-y-1.5 text-slate-700 font-medium">
              <div><span className="font-bold text-slate-900">No. KK:</span> {noKK}</div>
              <div><span className="font-bold text-slate-900">Kepala Keluarga:</span> <span className="uppercase font-bold text-slate-900">{namaKepala}</span></div>
              <div><span className="font-bold text-slate-900">Wilayah:</span> {wilayah}</div>
              <div><span className="font-bold text-slate-900">Jumlah Anggota Keluarga:</span> {draftMembers.length} Orang</div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-xs cursor-pointer"
              >
                Cek Kembali
              </button>

              <button
                type="button"
                onClick={handleFinalSave}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md transition-all text-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <span>Menyimpan...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Ya, Sudah Benar</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
