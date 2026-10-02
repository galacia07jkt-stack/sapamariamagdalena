import React, { useState } from 'react';
import { 
  UserPlus, 
  CheckCircle, 
  AlertCircle, 
  MapPin, 
  FileBadge, 
  ShieldCheck, 
  Check, 
  Calendar,
  RotateCcw,
  Save
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WargaKatolik, AgamaType } from '../types';
import { tambahWarga } from '../utils/storage';
import { formatInputToDdMmYyyy, isValidDdMmYyyy } from '../utils/dateUtils';
import { toTitleCase, formatRealtimeTitleCase } from '../utils/textUtils';

interface FormInputWargaProps {
  onSuccess: (newWarga: WargaKatolik) => void;
}

export const FormInputWarga: React.FC<FormInputWargaProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    noKk: '',
    nik: '',
    namaLengkap: '',
    agama: 'Katolik' as AgamaType,
    namaBaptis: '',
    jenisKelamin: 'L' as 'L' | 'P',
    tempatLahir: 'Kediri',
    tanggalLahir: '',
    alamatDomisili: '',
    rt: '02',
    rw: '01',
    tempatBaptis: 'Gereja Katolik St. Vincentius A Paulo',
    parokiKotaBaptis: 'Paroki St. Vincentius A Paulo - Kota Kediri',
    tanggalBaptis: '',
    noSuratBaptis: '',
    hubunganKeluarga: 'Kepala Keluarga' as WargaKatolik['hubunganKeluarga'],
    statusPerkawinan: 'Menikah Katolik' as WargaKatolik['statusPerkawinan'],
    komuniPertama: true,
    krisma: false,
    pernikahan: false,
    noHpWhatsapp: '',
    pekerjaan: '',
    pendidikan: '',
    catatanKhusus: '',
  });

  const [keepFamilyData, setKeepFamilyData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successWarga, setSuccessWarga] = useState<WargaKatolik | null>(null);

  const agamaList: AgamaType[] = [
    'Katolik',
    'Islam',
    'Hindu',
    'Buddha',
    'Protestan',
    'Kepercayaan',
  ];

  const isKatolik = formData.agama === 'Katolik';

  // Format Title Case & sanitasi input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === 'tanggalLahir' || name === 'tanggalBaptis') {
      const formatted = formatInputToDdMmYyyy(value);
      setFormData((prev) => ({ ...prev, [name]: formatted }));
    } else if (name === 'noKk' || name === 'nik' || name === 'noHpWhatsapp') {
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else if (name === 'rt' || name === 'rw') {
      const cleanVal = value.replace(/[^0-9a-zA-Z]/g, '').slice(0, 4);
      setFormData((prev) => ({ ...prev, [name]: cleanVal }));
    } else if (name === 'agama' || name === 'jenisKelamin' || name === 'hubunganKeluarga' || name === 'statusPerkawinan') {
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else {
      const formattedValue = formatRealtimeTitleCase(value);
      setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (
      name === 'namaLengkap' || 
      name === 'namaBaptis' || 
      name === 'tempatLahir' || 
      name === 'alamatDomisili' || 
      name === 'tempatBaptis' || 
      name === 'parokiKotaBaptis' || 
      name === 'pekerjaan' || 
      name === 'pendidikan' || 
      name === 'catatanKhusus'
    ) {
      setFormData((prev) => ({ ...prev, [name]: toTitleCase(value) }));
    }
  };

  const handleSakramenToggle = (field: 'komuniPertama' | 'krisma' | 'pernikahan') => {
    setFormData((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanKk = formData.noKk.replace(/\D/g, '');
    const cleanNik = formData.nik.replace(/\D/g, '');

    const reportError = (msg: string, elementId?: string) => {
      setErrorMsg(msg);
      if (elementId) {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
          return;
        }
      }
      window.scrollTo({ top: 120, behavior: 'smooth' });
    };

    if (cleanKk.length !== 16) {
      reportError(`Nomor Kartu Keluarga (No. KK) harus tepat 16 digit angka (saat ini: ${cleanKk.length} digit).`, 'input-no-kk');
      return;
    }

    if (cleanNik.length !== 16) {
      reportError(`Nomor Induk Kependudukan (NIK) harus tepat 16 digit angka (saat ini: ${cleanNik.length} digit).`, 'input-nik');
      return;
    }

    if (!formData.namaLengkap.trim()) {
      reportError('Nama lengkap jemaat/warga sesuai KTP wajib diisi.', 'input-nama-lengkap');
      return;
    }

    if (!formData.rt.trim()) {
      reportError('Nomor RT wajib diisi (contoh: 02).', 'input-rt');
      return;
    }

    if (!formData.rw.trim()) {
      reportError('Nomor RW wajib diisi (contoh: 01).', 'input-rw');
      return;
    }

    if (formData.tanggalLahir && !isValidDdMmYyyy(formData.tanggalLahir)) {
      reportError('Format tanggal lahir harus DD/MM/YYYY (contoh: 15/08/1995).', 'input-tanggal-lahir');
      return;
    }

    if (isKatolik && !formData.namaBaptis.trim()) {
      reportError('Untuk jemaat Katolik, mohon isi nama baptis Santo/Santa (jika belum ada, ketik tanda - ).', 'input-nama-baptis');
      return;
    }

    if (isKatolik && formData.tanggalBaptis && !isValidDdMmYyyy(formData.tanggalBaptis)) {
      reportError('Format tanggal baptis harus DD/MM/YYYY (contoh: 22/08/1995).', 'input-tanggal-baptis');
      return;
    }

    setSubmitting(true);

    try {
      const padRt = formData.rt.padStart(2, '0');
      const padRw = formData.rw.padStart(2, '0');
      const finalRtRw = `RT ${padRt} / RW ${padRw}`;

      const created = tambahWarga({
        noKk: cleanKk,
        nik: cleanNik,
        namaLengkap: toTitleCase(formData.namaLengkap.trim()),
        agama: formData.agama,
        namaBaptis: isKatolik ? toTitleCase(formData.namaBaptis.trim()) : '',
        jenisKelamin: formData.jenisKelamin,
        tempatLahir: toTitleCase(formData.tempatLahir.trim()),
        tanggalLahir: formData.tanggalLahir,
        alamatDomisili: toTitleCase(formData.alamatDomisili.trim()),
        rtRw: finalRtRw,
        tempatBaptis: isKatolik ? (toTitleCase(formData.tempatBaptis.trim()) || 'Gereja Katolik St. Vincentius A Paulo') : undefined,
        parokiKotaBaptis: isKatolik ? (toTitleCase(formData.parokiKotaBaptis.trim()) || 'Paroki St. Vincentius A Paulo - Kota Kediri') : undefined,
        tanggalBaptis: isKatolik ? formData.tanggalBaptis : undefined,
        noSuratBaptis: isKatolik ? formData.noSuratBaptis.trim() : undefined,
        hubunganKeluarga: formData.hubunganKeluarga,
        statusPerkawinan: formData.statusPerkawinan,
        sakramenLain: isKatolik ? {
          komuniPertama: formData.komuniPertama,
          krisma: formData.krisma,
          pernikahan: formData.pernikahan,
        } : undefined,
        noHpWhatsapp: formData.noHpWhatsapp.trim(),
        pekerjaan: toTitleCase(formData.pekerjaan.trim()),
        pendidikan: toTitleCase(formData.pendidikan.trim()),
        statusVerifikasi: 'Menunggu Verifikasi',
        catatanKhusus: toTitleCase(formData.catatanKhusus.trim()),
      });

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0284c7', '#ea580c', '#38bdf8', '#fbbf24'],
        });
      } catch {
        // Fallback
      }

      setSuccessWarga(created);
      onSuccess(created);

      if (keepFamilyData) {
        setFormData((prev) => ({
          ...prev,
          nik: '',
          namaLengkap: '',
          namaBaptis: '',
          tanggalLahir: '',
          tanggalBaptis: '',
          noSuratBaptis: '',
          hubunganKeluarga: 'Anak',
          catatanKhusus: '',
        }));
      } else {
        setFormData({
          noKk: '',
          nik: '',
          namaLengkap: '',
          agama: 'Katolik',
          namaBaptis: '',
          jenisKelamin: 'L',
          tempatLahir: 'Kediri',
          tanggalLahir: '',
          alamatDomisili: '',
          rt: '02',
          rw: '01',
          tempatBaptis: 'Gereja Katolik St. Vincentius A Paulo',
          parokiKotaBaptis: 'Paroki St. Vincentius A Paulo - Kota Kediri',
          tanggalBaptis: '',
          noSuratBaptis: '',
          hubunganKeluarga: 'Kepala Keluarga',
          statusPerkawinan: 'Menikah Katolik',
          komuniPertama: true,
          krisma: false,
          pernikahan: false,
          noHpWhatsapp: '',
          pekerjaan: '',
          pendidikan: '',
          catatanKhusus: '',
        });
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Terjadi kendala saat menyimpan data jemaat. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Form Container with High-Contrast Border and Mobile-First Alignment */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-orange-500 shadow-xl overflow-hidden">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-sky-950 via-sky-900 to-sky-950 text-white p-4 sm:p-7 border-b-4 border-orange-500">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-white p-1 shadow-md border-2 border-orange-400 shrink-0 overflow-hidden flex items-center justify-center">
              <img
                src="/logo-sapa.png"
                alt="Logo SAPA"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight leading-snug">
                Formulir Pendataan Warga
              </h2>
              <p className="text-xs sm:text-sm text-sky-200 mt-0.5 font-medium">
                Lingkungan St. Maria Magdalena Semampir Kediri
              </p>
            </div>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successWarga && (
          <div className="m-3 sm:m-6 p-4 sm:p-5 bg-emerald-50 border-2 border-emerald-500 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-fade-in">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-emerald-950 text-sm sm:text-base">
                  Data Warga Berhasil Terdaftar!
                </h4>
                <p className="text-xs sm:text-sm text-emerald-800 mt-1">
                  Atas nama <strong>{successWarga.namaBaptis ? `${successWarga.namaBaptis} ` : ''}{successWarga.namaLengkap}</strong> ({successWarga.agama}) telah tersimpan di database pusat.
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-mono font-bold text-emerald-900">
                  <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-300">
                    NIK: {successWarga.nik}
                  </span>
                  <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-300">
                    No. KK: {successWarga.noKk}
                  </span>
                  <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-300">
                    {successWarga.rtRw}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSuccessWarga(null)}
              className="text-xs sm:text-sm px-4 py-2 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 font-bold self-end sm:self-center min-h-[40px] cursor-pointer"
            >
              Tutup Pesan
            </button>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="mx-3 sm:mx-6 mt-4 p-4 bg-rose-50 border-2 border-rose-500 rounded-2xl flex items-center gap-3 text-rose-900 text-sm sm:text-base font-bold shadow-xs">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Form Isi Data: Layout Rapi, Vertikal Teratur, Tanpa Naik Turun */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-7 sm:space-y-9">
          
          {/* ========================================================
              SECTION 1: DATA IDENTITAS, AGAMA & KEPENDUDUKAN
             ======================================================== */}
          <div className="space-y-5">
            {/* Section Header */}
            <div className="bg-sky-900 text-white p-3.5 sm:p-4 rounded-2xl flex items-center gap-3 border-l-6 border-orange-500 shadow-xs">
              <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-black shrink-0 shadow-sm">
                1
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide">
                  Data Identitas, Agama & Kependudukan
                </h3>
                <p className="text-xs text-sky-200 mt-0.5">
                  Isikan nomor identitas resmi dan data pribadi jemaat.
                </p>
              </div>
            </div>

            {/* Form Fields: Grid 1 Kolom di HP, 2 Kolom di Desktop (Tertata Rapi) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              
              {/* No. KK */}
              <div className="flex flex-col">
                <label className="text-sm sm:text-base font-extrabold text-sky-950 mb-1.5 flex items-center justify-between">
                  <span>Nomor Kartu Keluarga (No. KK) <span className="text-rose-600 font-black">*</span></span>
                  <span className="text-xs text-slate-500 font-normal">Wajib 16 digit</span>
                </label>
                <input
                  id="input-no-kk"
                  type="text"
                  name="noKk"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.noKk}
                  onChange={handleChange}
                  maxLength={16}
                  placeholder="Contoh: 3571020101900001"
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-orange-500 focus:bg-orange-50/15 focus:ring-4 focus:ring-orange-100 transition-all font-mono font-bold text-base sm:text-lg text-slate-900 bg-white min-h-[52px] sm:min-h-[56px] shadow-2xs"
                  required
                />
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">
                  16 angka sesuai lembar Kartu Keluarga resmi.
                </p>
              </div>

              {/* NIK */}
              <div className="flex flex-col">
                <label className="text-sm sm:text-base font-extrabold text-sky-950 mb-1.5 flex items-center justify-between">
                  <span>Nomor Induk Kependudukan (NIK) <span className="text-rose-600 font-black">*</span></span>
                  <span className="text-xs text-slate-500 font-normal">Wajib 16 digit</span>
                </label>
                <input
                  id="input-nik"
                  type="text"
                  name="nik"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.nik}
                  onChange={handleChange}
                  maxLength={16}
                  placeholder="Contoh: 3571021508950002"
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-orange-500 focus:bg-orange-50/15 focus:ring-4 focus:ring-orange-100 transition-all font-mono font-bold text-base sm:text-lg text-slate-900 bg-white min-h-[52px] sm:min-h-[56px] shadow-2xs"
                  required
                />
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">
                  16 angka NIK KTP warga yang didaftarkan.
                </p>
              </div>

              {/* Nama Lengkap (Full Width) */}
              <div className="flex flex-col md:col-span-2">
                <label className="text-sm sm:text-base font-extrabold text-sky-950 mb-1.5 flex items-center justify-between">
                  <span>Nama Lengkap Sesuai KTP <span className="text-rose-600 font-black">*</span></span>
                  <span className="text-xs text-orange-700 font-bold bg-orange-100 px-2 py-0.5 rounded">Huruf Awal Kapital Otomatis</span>
                </label>
                <input
                  id="input-nama-lengkap"
                  type="text"
                  name="namaLengkap"
                  value={formData.namaLengkap}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Contoh: Yohanes Stefanus Bambang Santoso"
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-orange-500 focus:bg-orange-50/15 focus:ring-4 focus:ring-orange-100 transition-all text-base sm:text-lg font-bold text-slate-900 bg-white min-h-[52px] sm:min-h-[56px] shadow-2xs"
                  required
                />
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">
                  Nama lengkap warga resmi (tanpa disingkat jika memungkinkan).
                </p>
              </div>

              {/* Agama (Katolik / Non-Katolik) */}
              <div className="flex flex-col md:col-span-2">
                <label className="text-sm sm:text-base font-extrabold text-sky-950 mb-1.5">
                  Agama Jemaat / Warga <span className="text-rose-600 font-black">*</span>
                </label>
                <select
                  name="agama"
                  value={formData.agama}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-orange-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 text-base sm:text-lg bg-orange-50/40 font-black text-sky-950 min-h-[52px] sm:min-h-[56px] shadow-2xs cursor-pointer"
                >
                  {agamaList.map((agm) => (
                    <option key={agm} value={agm}>
                      {agm}
                    </option>
                  ))}
                </select>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">
                  {isKatolik 
                    ? '✝️ Warga Katolik: Bagian data Sakramen Baptis, Komuni, & Krisma akan dibuka di bawah.' 
                    : 'ℹ️ Non-Katolik: Bagian sakramen gerejawi Katolik dilewati secara otomatis.'}
                </p>
              </div>

              {/* Jenis Kelamin (Tombol Pilihan Besar Ramah Lansia) */}
              <div className="flex flex-col">
                <label className="text-sm sm:text-base font-extrabold text-sky-950 mb-1.5">
                  Jenis Kelamin <span className="text-rose-600 font-black">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, jenisKelamin: 'L' }))}
                    className={`py-3.5 px-3 rounded-2xl border-2 font-black text-sm sm:text-base flex items-center justify-center gap-2 transition min-h-[52px] cursor-pointer ${
                      formData.jenisKelamin === 'L'
                        ? 'bg-sky-900 border-sky-950 text-white shadow-md'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>👨 Laki-Laki (L)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, jenisKelamin: 'P' }))}
                    className={`py-3.5 px-3 rounded-2xl border-2 font-black text-sm sm:text-base flex items-center justify-center gap-2 transition min-h-[52px] cursor-pointer ${
                      formData.jenisKelamin === 'P'
                        ? 'bg-orange-600 border-orange-700 text-white shadow-md'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>👩 Perempuan (P)</span>
                  </button>
                </div>
              </div>

              {/* Hubungan Keluarga */}
              <div className="flex flex-col">
                <label className="text-sm sm:text-base font-extrabold text-sky-950 mb-1.5">
                  Hubungan Dalam Keluarga <span className="text-rose-600 font-black">*</span>
                </label>
                <select
                  name="hubunganKeluarga"
                  value={formData.hubunganKeluarga}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 text-base sm:text-lg font-bold text-slate-900 bg-white min-h-[52px] sm:min-h-[56px] shadow-2xs cursor-pointer"
                >
                  <option value="Kepala Keluarga">Kepala Keluarga</option>
                  <option value="Istri">Istri</option>
                  <option value="Anak">Anak</option>
                  <option value="Orang Tua">Orang Tua</option>
                  <option value="Famili Lain">Famili Lain</option>
                </select>
              </div>

              {/* Tempat Lahir */}
              <div className="flex flex-col">
                <label className="text-sm sm:text-base font-extrabold text-sky-950 mb-1.5">
                  Kota / Tempat Lahir
                </label>
                <input
                  type="text"
                  name="tempatLahir"
                  value={formData.tempatLahir}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Contoh: Kediri"
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-orange-500 focus:bg-orange-50/15 focus:ring-4 focus:ring-orange-100 text-base sm:text-lg font-bold text-slate-900 bg-white min-h-[52px] sm:min-h-[56px] shadow-2xs"
                />
              </div>

              {/* Tanggal Lahir (DD/MM/YYYY) */}
              <div className="flex flex-col">
                <label className="text-sm sm:text-base font-extrabold text-sky-950 mb-1.5 flex items-center justify-between">
                  <span>Tanggal Lahir (DD/MM/YYYY)</span>
                  <span className="text-xs text-slate-500 font-mono">Format: HH/BB/TTTT</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="tanggalLahir"
                    inputMode="numeric"
                    value={formData.tanggalLahir}
                    onChange={handleChange}
                    maxLength={10}
                    placeholder="Contoh: 15/08/1995"
                    className="w-full pl-4 pr-11 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-orange-500 focus:bg-orange-50/15 focus:ring-4 focus:ring-orange-100 text-base sm:text-lg font-mono font-bold text-slate-900 bg-white min-h-[52px] sm:min-h-[56px] shadow-2xs"
                  />
                  <Calendar className="w-5 h-5 text-slate-400 absolute right-3.5 top-4 pointer-events-none" />
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">
                  Contoh penulisan: 15/08/1995 (hari / bulan / tahun).
                </p>
              </div>

              {/* Status Pernikahan */}
              <div className="flex flex-col">
                <label className="text-sm sm:text-base font-extrabold text-sky-950 mb-1.5">
                  Status Pernikahan
                </label>
                <select
                  name="statusPerkawinan"
                  value={formData.statusPerkawinan}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 text-base sm:text-lg font-bold text-slate-900 bg-white min-h-[52px] sm:min-h-[56px] shadow-2xs cursor-pointer"
                >
                  <option value="Belum Menikah">Belum Menikah</option>
                  <option value="Menikah Katolik">Menikah Katolik</option>
                  <option value="Menikah Campur">Menikah Campur</option>
                  <option value="Janda/Duda">Janda / Duda</option>
                </select>
              </div>

              {/* No. WhatsApp / HP */}
              <div className="flex flex-col">
                <label className="text-sm sm:text-base font-extrabold text-sky-950 mb-1.5">
                  Nomor WhatsApp / HP
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  name="noHpWhatsapp"
                  value={formData.noHpWhatsapp}
                  onChange={handleChange}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-orange-500 focus:bg-orange-50/15 focus:ring-4 focus:ring-orange-100 text-base sm:text-lg font-mono font-bold text-slate-900 bg-white min-h-[52px] sm:min-h-[56px] shadow-2xs"
                />
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">
                  Digunakan untuk informasi kegiatan lingkungan & doa.
                </p>
              </div>

            </div>
          </div>

          {/* ========================================================
              SECTION 2: DATA SAKRAMEN BAPTIS KATOLIK (KHUSUS KATOLIK)
             ======================================================== */}
          {isKatolik ? (
            <div className="space-y-5 animate-fade-in pt-3 border-t-2 border-slate-200">
              {/* Section Header */}
              <div className="bg-sky-900 text-white p-3.5 sm:p-4 rounded-2xl flex items-center gap-3 border-l-6 border-orange-500 shadow-xs">
                <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-black shrink-0 shadow-sm">
                  2
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide">
                    Data Sakramen Baptis Katolik
                  </h3>
                  <p className="text-xs text-sky-200 mt-0.5">
                    Informasi buku permandian, Santo/Santa pelindung, dan sakramen gereja.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                
                {/* Nama Baptis (Full Width) */}
                <div className="flex flex-col md:col-span-2">
                  <label className="text-sm sm:text-base font-extrabold text-sky-950 mb-1.5 flex items-center justify-between">
                    <span>Nama Baptis (Santo / Santa Pelindung) <span className="text-rose-600 font-black">*</span></span>
                    <span className="text-xs text-orange-700 font-bold bg-orange-100 px-2 py-0.5 rounded">Huruf Awal Kapital</span>
                  </label>
                  <input
                    type="text"
                    name="namaBaptis"
                    value={formData.namaBaptis}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Contoh: Fransiskus Xaverius / Maria Magdalena"
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-orange-400 focus:border-orange-500 focus:bg-orange-50/20 focus:ring-4 focus:ring-orange-100 transition-all text-base sm:text-lg font-black text-sky-950 bg-orange-50/20 min-h-[52px] sm:min-h-[56px] shadow-2xs"
                    required={isKatolik}
                  />
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">
                    Nama Santo / Santa pelindung yang diterima saat pembaptisan.
                  </p>
                </div>

                {/* Nomor Surat / Akta Baptis */}
                <div className="flex flex-col">
                  <label className="text-sm sm:text-base font-extrabold text-sky-950 mb-1.5">
                    Nomor Surat / Akta Baptis (Buku Permandian)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="noSuratBaptis"
                      value={formData.noSuratBaptis}
                      onChange={handleChange}
                      placeholder="Contoh: SVP-KDR/B/1982/0142"
                      className="w-full pl-4 pr-11 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-orange-500 focus:bg-orange-50/15 focus:ring-4 focus:ring-orange-100 transition-all font-mono font-bold text-base sm:text-lg text-slate-900 bg-white min-h-[52px] sm:min-h-[56px] shadow-2xs"
                    />
                    <FileBadge className="w-5 h-5 text-slate-400 absolute right-3.5 top-4 pointer-events-none" />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">
                    Tercantum pada surat baptis (jika ada).
                  </p>
                </div>

                {/* Tanggal Baptis (DD/MM/YYYY) */}
                <div className="flex flex-col">
                  <label className="text-sm sm:text-base font-extrabold text-sky-950 mb-1.5 flex items-center justify-between">
                    <span>Tanggal Baptis (DD/MM/YYYY)</span>
                    <span className="text-xs text-slate-500 font-mono">Format: HH/BB/TTTT</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="tanggalBaptis"
                      inputMode="numeric"
                      value={formData.tanggalBaptis}
                      onChange={handleChange}
                      maxLength={10}
                      placeholder="Contoh: 22/08/1995"
                      className="w-full pl-4 pr-11 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-orange-500 focus:bg-orange-50/15 focus:ring-4 focus:ring-orange-100 text-base sm:text-lg font-mono font-bold text-slate-900 bg-white min-h-[52px] sm:min-h-[56px] shadow-2xs"
                    />
                    <Calendar className="w-5 h-5 text-slate-400 absolute right-3.5 top-4 pointer-events-none" />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">
                    Format penulisan DD/MM/YYYY (contoh: 22/08/1995).
                  </p>
                </div>

                {/* Tempat Baptis / Nama Gereja */}
                <div className="flex flex-col">
                  <label className="text-sm sm:text-base font-extrabold text-sky-950 mb-1.5">
                    Tempat Pembaptisan / Nama Gereja
                  </label>
                  <input
                    type="text"
                    name="tempatBaptis"
                    value={formData.tempatBaptis}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Contoh: Gereja Katolik St. Vincentius A Paulo"
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-orange-500 focus:bg-orange-50/15 focus:ring-4 focus:ring-orange-100 text-base sm:text-lg font-bold text-slate-900 bg-white min-h-[52px] sm:min-h-[56px] shadow-2xs"
                  />
                </div>

                {/* Paroki / Kota Baptis */}
                <div className="flex flex-col">
                  <label className="text-sm sm:text-base font-extrabold text-sky-950 mb-1.5">
                    Paroki & Kota Tempat Baptis
                  </label>
                  <input
                    type="text"
                    name="parokiKotaBaptis"
                    value={formData.parokiKotaBaptis}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Contoh: Paroki St. Vincentius A Paulo - Kota Kediri"
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-orange-500 focus:bg-orange-50/15 focus:ring-4 focus:ring-orange-100 text-base sm:text-lg font-bold text-slate-900 bg-white min-h-[52px] sm:min-h-[56px] shadow-2xs"
                  />
                </div>

                {/* Sakramen Lainnya (Tombol Kartu Besar Ramah Lansia) */}
                <div className="flex flex-col md:col-span-2">
                  <label className="text-sm sm:text-base font-extrabold text-sky-950 mb-2">
                    Sakramen Katolik Lainnya Yang Sudah Diterima
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* Komuni 1 */}
                    <button
                      type="button"
                      onClick={() => handleSakramenToggle('komuniPertama')}
                      className={`p-3.5 rounded-2xl border-2 font-bold text-sm sm:text-base transition flex items-center justify-between min-h-[54px] cursor-pointer ${
                        formData.komuniPertama
                          ? 'bg-sky-900 border-sky-950 text-white shadow-md'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                          formData.komuniPertama ? 'bg-orange-500 border-orange-400 text-white' : 'border-slate-400 bg-white'
                        }`}>
                          {formData.komuniPertama && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span>Komuni 1</span>
                      </div>
                      <span className="text-xs font-normal opacity-80">{formData.komuniPertama ? 'Sudah' : 'Belum'}</span>
                    </button>

                    {/* Krisma */}
                    <button
                      type="button"
                      onClick={() => handleSakramenToggle('krisma')}
                      className={`p-3.5 rounded-2xl border-2 font-bold text-sm sm:text-base transition flex items-center justify-between min-h-[54px] cursor-pointer ${
                        formData.krisma
                          ? 'bg-orange-600 border-orange-700 text-white shadow-md'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                          formData.krisma ? 'bg-white text-orange-600' : 'border-slate-400 bg-white'
                        }`}>
                          {formData.krisma && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span>Krisma</span>
                      </div>
                      <span className="text-xs font-normal opacity-80">{formData.krisma ? 'Sudah' : 'Belum'}</span>
                    </button>

                    {/* Perkawinan */}
                    <button
                      type="button"
                      onClick={() => handleSakramenToggle('pernikahan')}
                      className={`p-3.5 rounded-2xl border-2 font-bold text-sm sm:text-base transition flex items-center justify-between min-h-[54px] cursor-pointer ${
                        formData.pernikahan
                          ? 'bg-emerald-700 border-emerald-800 text-white shadow-md'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                          formData.pernikahan ? 'bg-white text-emerald-700' : 'border-slate-400 bg-white'
                        }`}>
                          {formData.pernikahan && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span>Perkawinan</span>
                      </div>
                      <span className="text-xs font-normal opacity-80">{formData.pernikahan ? 'Sudah' : 'Belum'}</span>
                    </button>

                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl text-xs sm:text-sm text-slate-700 flex items-center gap-2 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" />
              <span>Bagian sakramen Katolik (Baptis, Komuni, Krisma) dilewati untuk pendaftar beragama {formData.agama}.</span>
            </div>
          )}

          {/* ========================================================
              SECTION 3: ALAMAT DOMISILI, RT/RW & INFORMASI TAMBAHAN
             ======================================================== */}
          <div className="space-y-5 pt-3 border-t-2 border-slate-200">
            {/* Section Header */}
            <div className="bg-sky-900 text-white p-3.5 sm:p-4 rounded-2xl flex items-center gap-3 border-l-6 border-orange-500 shadow-xs">
              <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-black shrink-0 shadow-sm">
                {isKatolik ? '3' : '2'}
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide">
                  Alamat Domisili Semampir & Wilayah RT / RW
                </h3>
                <p className="text-xs text-sky-200 mt-0.5">
                  Isikan alamat rumah tinggal dan nomor RT/RW di Kelurahan Semampir.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              
              {/* Alamat Rumah Lengkap (Full Width) */}
              <div className="flex flex-col md:col-span-2">
                <label className="text-sm sm:text-base font-extrabold text-sky-950 mb-1.5 flex items-center justify-between">
                  <span>Alamat Rumah / Domisili di Semampir <span className="text-rose-600 font-black">*</span></span>
                  <span className="text-xs text-orange-700 font-bold bg-orange-100 px-2 py-0.5 rounded">Huruf Awal Kapital</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="alamatDomisili"
                    value={formData.alamatDomisili}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Contoh: Jl. Mayor Bismo No. 42, Kelurahan Semampir, Kota Kediri"
                    className="w-full pl-4 pr-11 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-orange-500 focus:bg-orange-50/15 focus:ring-4 focus:ring-orange-100 text-base sm:text-lg font-bold text-slate-900 bg-white min-h-[52px] sm:min-h-[56px] shadow-2xs"
                    required
                  />
                  <MapPin className="w-5 h-5 text-slate-400 absolute right-3.5 top-4 pointer-events-none" />
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">
                  Alamat jalan, gang, atau nomor rumah tempat tinggal saat ini.
                </p>
              </div>

              {/* CARD KHUSUS INPUT RT & RW SECARA MANDIRI (SEIMBANG & SIMETRIS) */}
              <div className="md:col-span-2 bg-gradient-to-br from-sky-50 via-white to-orange-50/30 p-4 sm:p-6 rounded-2xl border-2 border-sky-300 shadow-sm">
                <div className="mb-3.5">
                  <h4 className="text-sm sm:text-base font-black text-sky-950">
                    Nomor Rukun Tetangga (RT) & Rukun Warga (RW) <span className="text-rose-600">*</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Ketik langsung nomor RT dan RW domisili Anda di Kelurahan Semampir.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-6">
                  {/* RT */}
                  <div className="flex flex-col">
                    <label className="text-xs sm:text-sm font-extrabold text-sky-900 mb-1">
                      Nomor RT <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="rt"
                        inputMode="numeric"
                        value={formData.rt}
                        onChange={handleChange}
                        placeholder="02"
                        maxLength={4}
                        className="w-full pl-4 pr-12 py-3.5 rounded-xl border-2 border-sky-400 focus:border-sky-600 focus:ring-4 focus:ring-sky-100 text-lg sm:text-xl font-mono font-black text-sky-950 bg-white min-h-[52px] shadow-2xs"
                        required
                      />
                      <span className="text-xs sm:text-sm font-black text-sky-700 bg-sky-100 px-2 py-1 rounded-md absolute right-2.5 top-3 pointer-events-none">
                        RT
                      </span>
                    </div>
                  </div>

                  {/* RW */}
                  <div className="flex flex-col">
                    <label className="text-xs sm:text-sm font-extrabold text-sky-900 mb-1">
                      Nomor RW <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="rw"
                        inputMode="numeric"
                        value={formData.rw}
                        onChange={handleChange}
                        placeholder="01"
                        maxLength={4}
                        className="w-full pl-4 pr-12 py-3.5 rounded-xl border-2 border-sky-400 focus:border-sky-600 focus:ring-4 focus:ring-sky-100 text-lg sm:text-xl font-mono font-black text-sky-950 bg-white min-h-[52px] shadow-2xs"
                        required
                      />
                      <span className="text-xs sm:text-sm font-black text-sky-700 bg-sky-100 px-2 py-1 rounded-md absolute right-2.5 top-3 pointer-events-none">
                        RW
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pekerjaan */}
              <div className="flex flex-col">
                <label className="text-sm sm:text-base font-extrabold text-sky-950 mb-1.5">
                  Pekerjaan / Profesi
                </label>
                <input
                  type="text"
                  name="pekerjaan"
                  value={formData.pekerjaan}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Contoh: Guru, Karyawan Swasta, Pensiunan"
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-orange-500 focus:bg-orange-50/15 focus:ring-4 focus:ring-orange-100 text-base sm:text-lg font-bold text-slate-900 bg-white min-h-[52px] sm:min-h-[56px] shadow-2xs"
                />
              </div>

              {/* Pendidikan Terakhir */}
              <div className="flex flex-col">
                <label className="text-sm sm:text-base font-extrabold text-sky-950 mb-1.5">
                  Pendidikan Terakhir
                </label>
                <input
                  type="text"
                  name="pendidikan"
                  value={formData.pendidikan}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Contoh: S1 Ekonomi, SMA/SMK, SMP, SD"
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-orange-500 focus:bg-orange-50/15 focus:ring-4 focus:ring-orange-100 text-base sm:text-lg font-bold text-slate-900 bg-white min-h-[52px] sm:min-h-[56px] shadow-2xs"
                />
              </div>

              {/* Catatan Khusus / Keterlibatan Gereja (Full Width) */}
              <div className="flex flex-col md:col-span-2">
                <label className="text-sm sm:text-base font-extrabold text-sky-950 mb-1.5">
                  Keterlibatan Pelayanan Gereja / Catatan Khusus
                </label>
                <input
                  type="text"
                  name="catatanKhusus"
                  value={formData.catatanKhusus}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Contoh: Koor, Misdinar, Pemandu Doa Rosario, Lansia Butuh Komuni Sakit"
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-orange-500 focus:bg-orange-50/15 focus:ring-4 focus:ring-orange-100 text-base sm:text-lg font-bold text-slate-900 bg-white min-h-[52px] sm:min-h-[56px] shadow-2xs"
                />
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">
                  Catatan pelayanan atau kondisi khusus lansia (misal: kunjungan pastor/romo, komuni orang sakit).
                </p>
              </div>

            </div>
          </div>

          {/* Opsi Kunci No. KK & Alamat untuk Input Anggota Keluarga Berikutnya (Super Responsif di HP) */}
          <div 
            onClick={() => setKeepFamilyData(!keepFamilyData)}
            role="checkbox"
            aria-checked={keepFamilyData}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setKeepFamilyData(!keepFamilyData); } }}
            className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer select-none active:scale-[0.99] shadow-sm flex items-start sm:items-center justify-between gap-3 sm:gap-4 ${
              keepFamilyData 
                ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-200' 
                : 'bg-slate-50 hover:bg-slate-100 border-slate-300'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
              {/* Checkbox Icon Box (Explicit shrink-0, perfectly square on all phones) */}
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border-2 shrink-0 transition-all mt-0.5 sm:mt-0 ${
                keepFamilyData 
                  ? 'bg-orange-600 border-orange-700 text-white shadow-sm' 
                  : 'bg-white border-slate-400 text-transparent'
              }`}>
                <Check className={`w-5 h-5 stroke-[3] transition-transform ${keepFamilyData ? 'scale-100' : 'scale-50 opacity-0'}`} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm sm:text-base font-black text-sky-950 block">
                    Pertahankan No. KK, Alamat, RT {formData.rt} & RW {formData.rw}
                  </span>
                  <span className={`text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    keepFamilyData ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {keepFamilyData ? '✓ Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 leading-relaxed">
                  Data No. KK {formData.noKk ? `(${formData.noKk})` : ''}, Alamat, RT {formData.rt || '02'} & RW {formData.rw || '01'} otomatis tetap tersimpan untuk input anggota keluarga berikutnya.
                </p>
              </div>
            </div>
          </div>

          {/* Error Banner Dekat Tombol Simpan (Minimalis, Kontras Jelas, Ramah Lansia) */}
          {errorMsg && (
            <div className="p-4 sm:p-5 bg-rose-50 border-2 border-rose-500 rounded-2xl flex items-start gap-3.5 text-rose-950 shadow-sm animate-fade-in">
              <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-black text-rose-900 text-sm sm:text-base block">
                  Perhatian: Data Belum Lengkap / Perlu Diperbaiki
                </span>
                <p className="text-xs sm:text-sm font-semibold text-rose-800 mt-0.5 leading-relaxed">
                  {errorMsg}
                </p>
              </div>
            </div>
          )}

          {/* Tombol Aksi Simpan & Reset: Desain Minimalis, Font Besar & Ramah Lansia */}
          <div className="pt-4 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 font-medium self-start sm:self-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Data tersimpan aman di database Paroki St. Vincentius a Paulo.</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Tombol Reset */}
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    noKk: '',
                    nik: '',
                    namaLengkap: '',
                    agama: 'Katolik',
                    namaBaptis: '',
                    jenisKelamin: 'L',
                    tempatLahir: 'Kediri',
                    tanggalLahir: '',
                    alamatDomisili: '',
                    rt: '02',
                    rw: '01',
                    tempatBaptis: 'Gereja Katolik St. Vincentius A Paulo',
                    parokiKotaBaptis: 'Paroki St. Vincentius A Paulo - Kota Kediri',
                    tanggalBaptis: '',
                    noSuratBaptis: '',
                    hubunganKeluarga: 'Kepala Keluarga',
                    statusPerkawinan: 'Menikah Katolik',
                    komuniPertama: true,
                    krisma: false,
                    pernikahan: false,
                    noHpWhatsapp: '',
                    pekerjaan: '',
                    pendidikan: '',
                    catatanKhusus: '',
                  });
                  setErrorMsg(null);
                }}
                className="px-5 py-3.5 rounded-2xl border-2 border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-sm sm:text-base font-bold transition min-h-[52px] sm:min-h-[56px] flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-2xs"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>Reset</span>
              </button>

              {/* Tombol Simpan dengan Icon Save (Minimalis, Kontras Tinggi & Ramah Lansia) */}
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 sm:flex-none px-7 sm:px-9 py-3.5 sm:py-4 rounded-2xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-black text-base sm:text-lg shadow-md active:scale-[0.98] transition-all border-2 border-orange-700 flex items-center justify-center gap-3 min-h-[54px] sm:min-h-[58px] disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <span>Menyimpan ke Database...</span>
                ) : (
                  <>
                    <Save className="w-6 h-6 text-white shrink-0" />
                    <span>Simpan Data Warga</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
