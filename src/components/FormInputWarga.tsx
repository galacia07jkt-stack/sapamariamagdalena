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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WargaKatolik, AgamaType } from '../types';
import { tambahWarga } from '../utils/storage';
import { formatInputToDdMmYyyy, isValidDdMmYyyy } from '../utils/dateUtils';
import { toTitleCase, formatRealtimeTitleCase, formatRtRw } from '../utils/textUtils';

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
    'Kristen Protestan',
    'Islam',
    'Hindu',
    'Buddha',
    'Kepercayaan',
  ];

  const isKatolik = formData.agama === 'Katolik';

  // Handle general change with Title Case format: Huruf pertama di setiap kata wajib KAPITAL/BESAR
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === 'tanggalLahir' || name === 'tanggalBaptis') {
      // Auto format DD/MM/YYYY
      const formatted = formatInputToDdMmYyyy(value);
      setFormData((prev) => ({ ...prev, [name]: formatted }));
    } else if (name === 'noKk' || name === 'nik' || name === 'noHpWhatsapp') {
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else if (name === 'rt' || name === 'rw') {
      // Inputan RT sendiri & RW sendiri (bukan dropdown, hanya alfanumerik angka/huruf)
      const cleanVal = value.replace(/[^0-9a-zA-Z]/g, '').slice(0, 4);
      setFormData((prev) => ({ ...prev, [name]: cleanVal }));
    } else if (name === 'agama' || name === 'jenisKelamin' || name === 'hubunganKeluarga' || name === 'statusPerkawinan') {
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else {
      // Format Title Case secara realtime
      const formattedValue = formatRealtimeTitleCase(value);
      setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    }
  };

  // Blur handler to ensure full Title Case perfection on unfocus
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

    // Sanitize input
    const cleanKk = formData.noKk.replace(/\D/g, '');
    const cleanNik = formData.nik.replace(/\D/g, '');

    if (cleanKk.length !== 16) {
      setErrorMsg('Nomor Kartu Keluarga (No. KK) harus tepat 16 digit angka.');
      return;
    }

    if (cleanNik.length !== 16) {
      setErrorMsg('Nomor Induk Kependudukan (NIK) harus tepat 16 digit angka.');
      return;
    }

    if (!formData.namaLengkap.trim()) {
      setErrorMsg('Nama lengkap warga wajib diisi.');
      return;
    }

    if (!formData.rt.trim()) {
      setErrorMsg('Nomor RT wajib diisi.');
      return;
    }

    if (!formData.rw.trim()) {
      setErrorMsg('Nomor RW wajib diisi.');
      return;
    }

    if (formData.tanggalLahir && !isValidDdMmYyyy(formData.tanggalLahir)) {
      setErrorMsg('Format tanggal lahir harus DD/MM/YYYY (contoh: 15/08/1995).');
      return;
    }

    if (isKatolik && !formData.namaBaptis.trim()) {
      setErrorMsg('Untuk warga Katolik, nama baptis (Santo/Santa pelindung) wajib diisi.');
      return;
    }

    if (isKatolik && formData.tanggalBaptis && !isValidDdMmYyyy(formData.tanggalBaptis)) {
      setErrorMsg('Format tanggal baptis harus DD/MM/YYYY (contoh: 22/08/1995).');
      return;
    }

    if (!formData.alamatDomisili.trim()) {
      setErrorMsg('Alamat domisili di Semampir Kota Kediri wajib diisi.');
      return;
    }

    setSubmitting(true);

    try {
      const finalRtRw = formatRtRw(formData.rt, formData.rw);

      // Data disimpan dalam format Title Case: Huruf pertama di setiap kata wajib KAPITAL/BESAR
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

      // Confetti celebratory burst
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

      // Keep family data for next entry (termasuk RT dan RW tetap dipertahankan)
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
      {/* Form Container with Orange Border and Mobile-Ready Layout */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-orange-500 shadow-md overflow-hidden">
        
        {/* Form Title Header with Official SAPA Logo */}
        <div className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-900 text-white p-4 sm:p-7 border-b-4 border-orange-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white p-0.5 shadow-md border-2 border-orange-400 shrink-0 overflow-hidden flex items-center justify-center">
              <img
                src="/logo-sapa.png"
                alt="Logo SAPA"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-base sm:text-2xl font-extrabold tracking-tight leading-snug">
                Formulir Pendataan Warga
              </h2>
              <p className="text-[11px] sm:text-xs text-sky-200 mt-0.5 line-clamp-1">
                Lingkungan St. Maria Magdalena Semampir Kediri • Input RT & RW Mandiri • Title Case & DD/MM/YYYY
              </p>
            </div>
          </div>
          
          {/* Format Notice Pill */}
          <div className="mt-3 inline-flex items-center gap-2 bg-sky-950/60 border border-sky-400/40 px-3 py-1 rounded-lg text-[11px] text-sky-100">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Format Otomatis: <strong>Title Case</strong>, Tanggal <strong>DD/MM/YYYY</strong>, Input <strong>RT & RW Mandiri</strong></span>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successWarga && (
          <div className="m-3 sm:m-6 p-4 sm:p-5 bg-emerald-50 border-2 border-emerald-500 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fade-in">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-950 text-sm sm:text-base">
                  Data Warga Berhasil Terdaftar!
                </h4>
                <p className="text-xs sm:text-sm text-emerald-800 mt-0.5">
                  Atas nama <strong>{successWarga.namaBaptis ? `${successWarga.namaBaptis} ` : ''}{successWarga.namaLengkap}</strong> ({successWarga.agama}) telah tercatat dalam sistem SAPA Paroki.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-mono text-emerald-800">
                  <span className="bg-white/80 px-2 py-0.5 rounded border border-emerald-300">
                    NIK: {successWarga.nik}
                  </span>
                  <span className="bg-white/80 px-2 py-0.5 rounded border border-emerald-300">
                    No. KK: {successWarga.noKk}
                  </span>
                  <span className="bg-white/80 px-2 py-0.5 rounded border border-emerald-300 font-bold">
                    {successWarga.rtRw}
                  </span>
                  <span className="bg-white/80 px-2 py-0.5 rounded border border-emerald-300 font-bold">
                    Agama: {successWarga.agama}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSuccessWarga(null)}
              className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold self-end sm:self-center min-h-[36px]"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="mx-3 sm:mx-6 mt-4 p-3.5 bg-rose-50 border-2 border-rose-400 rounded-xl flex items-center gap-2.5 text-rose-800 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="font-semibold">{errorMsg}</p>
          </div>
        )}

        {/* Responsive Input Form */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-8 space-y-6 sm:space-y-8">
          
          {/* SECTION 1: DATA IDENTITAS, AGAMA & KEPENDUDUKAN */}
          <div>
            <div className="flex items-center gap-2 pb-2 border-b-2 border-orange-400 text-sky-950 font-bold text-sm sm:text-base mb-3 sm:mb-4">
              <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-extrabold shrink-0">
                1
              </span>
              <span>Data Identitas, Agama & Kependudukan (Title Case)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
              {/* No. KK */}
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nomor Kartu Keluarga (No. KK) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="noKk"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.noKk}
                  onChange={handleChange}
                  maxLength={16}
                  placeholder="357102xxxxxxxxxx (16 digit)"
                  className="w-full px-3.5 py-3 sm:py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-mono text-base sm:text-sm bg-white min-h-[44px]"
                  required
                />
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1">16 digit angka sesuai Kartu Keluarga resmi.</p>
              </div>

              {/* NIK */}
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nomor Induk Kependudukan (NIK) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="nik"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.nik}
                  onChange={handleChange}
                  maxLength={16}
                  placeholder="357102xxxxxxxxxx (16 digit)"
                  className="w-full px-3.5 py-3 sm:py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-mono text-base sm:text-sm bg-white min-h-[44px]"
                  required
                />
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1">16 digit NIK warga yang didaftarkan.</p>
              </div>

              {/* Nama Lengkap (Title Case) */}
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap Sesuai KTP <span className="text-rose-500">*</span>
                  <span className="text-[10px] text-orange-600 font-semibold normal-case ml-1">(Title Case)</span>
                </label>
                <input
                  type="text"
                  name="namaLengkap"
                  value={formData.namaLengkap}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Contoh: Bambang Trianto"
                  className="w-full px-3.5 py-3 sm:py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all text-base sm:text-sm bg-white min-h-[44px] font-semibold text-slate-900"
                  required
                />
              </div>

              {/* KOLOM AGAMA (Katolik, Kristen Protestan, Islam, Hindu, Buddha, Kepercayaan) */}
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Agama <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="agama"
                    value={formData.agama}
                    onChange={handleChange}
                    className="w-full px-3.5 py-3 sm:py-2.5 rounded-xl border-2 border-orange-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-base sm:text-sm bg-orange-50/30 font-bold text-orange-950 min-h-[44px]"
                  >
                    {agamaList.map((agm) => (
                      <option key={agm} value={agm}>
                        {agm}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1">
                  {isKatolik 
                    ? '✨ Warga Katolik: Bagian sakramen baptis & kategorial akan ditampilkan.' 
                    : 'ℹ️ Non-Katolik: Bagian sakramen gerejawi Katolik dilewati secara otomatis.'}
                </p>
              </div>

              {/* Jenis Kelamin & Hubungan Keluarga */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jenis Kelamin <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="jenisKelamin"
                    value={formData.jenisKelamin}
                    onChange={handleChange}
                    className="w-full px-3 py-3 sm:py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-base sm:text-sm bg-white min-h-[44px]"
                  >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hub. Keluarga
                  </label>
                  <select
                    name="hubunganKeluarga"
                    value={formData.hubunganKeluarga}
                    onChange={handleChange}
                    className="w-full px-3 py-3 sm:py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-base sm:text-sm bg-white min-h-[44px]"
                  >
                    <option value="Kepala Keluarga">Kepala Keluarga</option>
                    <option value="Istri">Istri</option>
                    <option value="Anak">Anak</option>
                    <option value="Orang Tua">Orang Tua</option>
                    <option value="Famili Lain">Famili Lain</option>
                  </select>
                </div>
              </div>

              {/* Tempat & Tanggal Lahir (Format DD/MM/YYYY) */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tempat Lahir
                  </label>
                  <input
                    type="text"
                    name="tempatLahir"
                    value={formData.tempatLahir}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Contoh: Kediri"
                    className="w-full px-3 py-3 sm:py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-base sm:text-sm bg-white min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tanggal Lahir (DD/MM/YYYY)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="tanggalLahir"
                      inputMode="numeric"
                      value={formData.tanggalLahir}
                      onChange={handleChange}
                      maxLength={10}
                      placeholder="HH/BB/TTTT (15/08/1995)"
                      className="w-full pl-3 pr-8 py-3 sm:py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-base sm:text-sm bg-white font-mono min-h-[44px]"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute right-2.5 top-3.5 sm:top-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Status Perkawinan & No WhatsApp */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status Pernikahan
                  </label>
                  <select
                    name="statusPerkawinan"
                    value={formData.statusPerkawinan}
                    onChange={handleChange}
                    className="w-full px-3 py-3 sm:py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-base sm:text-sm bg-white min-h-[44px]"
                  >
                    <option value="Belum Menikah">Belum Menikah</option>
                    <option value="Menikah Katolik">Menikah Katolik</option>
                    <option value="Menikah Campur">Menikah Campur</option>
                    <option value="Janda/Duda">Janda / Duda</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    No. WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    name="noHpWhatsapp"
                    value={formData.noHpWhatsapp}
                    onChange={handleChange}
                    placeholder="081234xxxx"
                    className="w-full px-3 py-3 sm:py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-base sm:text-sm bg-white font-mono min-h-[44px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: DATA SAKRAMEN BAPTIS KATOLIK (HANYA MUNCUL JIKA AGAMA KATOLIK) */}
          {isKatolik ? (
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-orange-400 text-sky-950 font-bold text-sm sm:text-base mb-3 sm:mb-4">
                <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-extrabold shrink-0">
                  2
                </span>
                <span>Data Sakramen Baptis Katolik (Format Title Case & Tanggal DD/MM/YYYY)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
                {/* Nama Baptis */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Baptis (Santo / Santa Pelindung) <span className="text-rose-500">*</span>
                    <span className="text-[10px] text-orange-600 font-semibold normal-case ml-1">(Title Case)</span>
                  </label>
                  <input
                    type="text"
                    name="namaBaptis"
                    value={formData.namaBaptis}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Contoh: Fransiskus Xaverius / Maria Magdalena"
                    className="w-full px-3.5 py-3 sm:py-2.5 rounded-xl border-2 border-orange-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-base sm:text-sm bg-orange-50/20 font-bold text-orange-950 min-h-[44px]"
                    required={isKatolik}
                  />
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1">Nama Santo / Santa yang diterima saat pembaptisan.</p>
                </div>

                {/* No. Surat / Akta Baptis */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nomor Surat / Akta Baptis (Buku Permandian)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="noSuratBaptis"
                      value={formData.noSuratBaptis}
                      onChange={handleChange}
                      placeholder="Contoh: SVP-KDR/B/1982/0142"
                      className="w-full px-3.5 py-3 sm:py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all font-mono text-base sm:text-sm bg-white min-h-[44px]"
                    />
                    <FileBadge className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 sm:top-3" />
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1">Nomor register pada buku baptis paroki.</p>
                </div>

                {/* Tempat Baptis */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tempat Pembaptisan / Gereja
                  </label>
                  <input
                    type="text"
                    name="tempatBaptis"
                    value={formData.tempatBaptis}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Contoh: Gereja Katolik St. Vincentius A Paulo"
                    className="w-full px-3.5 py-3 sm:py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-base sm:text-sm bg-white min-h-[44px]"
                  />
                </div>

                {/* Paroki / Kota Baptis */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Paroki / Kota Baptis
                  </label>
                  <input
                    type="text"
                    name="parokiKotaBaptis"
                    value={formData.parokiKotaBaptis}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Contoh: Paroki St. Vincentius A Paulo - Kota Kediri"
                    className="w-full px-3.5 py-3 sm:py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-base sm:text-sm bg-white min-h-[44px]"
                  />
                </div>

                {/* Tanggal Baptis (DD/MM/YYYY) */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tanggal Baptis (DD/MM/YYYY)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="tanggalBaptis"
                      inputMode="numeric"
                      value={formData.tanggalBaptis}
                      onChange={handleChange}
                      maxLength={10}
                      placeholder="HH/BB/TTTT (22/08/1995)"
                      className="w-full pl-3 pr-8 py-3 sm:py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-base sm:text-sm bg-white font-mono min-h-[44px]"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute right-2.5 top-3.5 sm:top-3 pointer-events-none" />
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1">Format tanggal Indonesia DD/MM/YYYY.</p>
                </div>

                {/* Penerimaan Sakramen Katolik Lainnya */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Sakramen Katolik Lainnya Yang Diterima
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSakramenToggle('komuniPertama')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 min-h-[50px] ${
                        formData.komuniPertama
                          ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-300'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${formData.komuniPertama ? 'opacity-100' : 'opacity-0'}`} />
                      <span>Komuni I</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSakramenToggle('krisma')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 min-h-[50px] ${
                        formData.krisma
                          ? 'bg-orange-500 text-white border-orange-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-300'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${formData.krisma ? 'opacity-100' : 'opacity-0'}`} />
                      <span>Krisma</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSakramenToggle('pernikahan')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 min-h-[50px] ${
                        formData.pernikahan
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-300'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${formData.pernikahan ? 'opacity-100' : 'opacity-0'}`} />
                      <span>Nikah Katolik</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Bagian sakramen Katolik (Baptis, Komuni, Krisma) tidak ditampilkan untuk pendaftar beragama {formData.agama}.</span>
            </div>
          )}

          {/* SECTION 3: DOMISILI LINGKUNGAN & SOSIAL */}
          <div>
            <div className="flex items-center gap-2 pb-2 border-b-2 border-orange-400 text-sky-950 font-bold text-sm sm:text-base mb-3 sm:mb-4">
              <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-extrabold shrink-0">
                {isKatolik ? '3' : '2'}
              </span>
              <span>Alamat Domisili Semampir & Informasi Tambahan (Title Case)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
              {/* Alamat Domisili Semampir */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Alamat Rumah / Domisili di Semampir Kota Kediri <span className="text-rose-500">*</span>
                  <span className="text-[10px] text-orange-600 font-semibold normal-case ml-1">(Title Case)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="alamatDomisili"
                    value={formData.alamatDomisili}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Contoh: Jl. Mayor Bismo No. 42, Kel. Semampir, Kota Kediri"
                    className="w-full pl-3.5 pr-8 py-3 sm:py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-base sm:text-sm bg-white min-h-[44px]"
                    required
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 sm:top-3" />
                </div>
              </div>

              {/* INPUT RT SENDIRI & RW SENDIRI (BUKAN DROPDOWN / LIST DOWN) */}
              <div className="sm:col-span-2 grid grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-sky-50/50 rounded-2xl border-2 border-sky-200">
                {/* Input RT Sendiri */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    RT (Rukun Tetangga) <span className="text-rose-500">*</span>
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
                      className="w-full pl-3 pr-10 py-3 sm:py-2.5 rounded-xl border-2 border-sky-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-base sm:text-sm bg-white font-mono font-bold text-sky-950 min-h-[44px]"
                      required
                    />
                    <span className="text-xs text-sky-700 absolute right-3 top-3.5 sm:top-3 font-bold pointer-events-none">
                      RT
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Ketik nomor RT (Input mandiri)</p>
                </div>

                {/* Input RW Sendiri */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    RW (Rukun Warga) <span className="text-rose-500">*</span>
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
                      className="w-full pl-3 pr-10 py-3 sm:py-2.5 rounded-xl border-2 border-sky-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-base sm:text-sm bg-white font-mono font-bold text-sky-950 min-h-[44px]"
                      required
                    />
                    <span className="text-xs text-sky-700 absolute right-3 top-3.5 sm:top-3 font-bold pointer-events-none">
                      RW
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Ketik nomor RW (Input mandiri)</p>
                </div>
              </div>

              {/* Pekerjaan */}
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pekerjaan / Profesi
                </label>
                <input
                  type="text"
                  name="pekerjaan"
                  value={formData.pekerjaan}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Contoh: Guru, Karyawan Swasta, Wiraswasta"
                  className="w-full px-3 py-3 sm:py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-base sm:text-sm bg-white min-h-[44px]"
                />
              </div>

              {/* Pendidikan */}
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pendidikan Terakhir
                </label>
                <input
                  type="text"
                  name="pendidikan"
                  value={formData.pendidikan}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Contoh: S1 Ekonomi, SMA/SMK, SMP, SD"
                  className="w-full px-3 py-3 sm:py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-base sm:text-sm bg-white min-h-[44px]"
                />
              </div>

              {/* Catatan / Keterlibatan Gereja */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Keterlibatan / Catatan Khusus
                </label>
                <input
                  type="text"
                  name="catatanKhusus"
                  value={formData.catatanKhusus}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Contoh: Koor, Misdinar, Pemandu Doa Rosario, Sie Liturgi"
                  className="w-full px-3.5 py-3 sm:py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-base sm:text-sm bg-white min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* Quick Option: Pertahankan No KK & Alamat untuk Anggota Keluarga Berikutnya */}
          <div 
            onClick={() => setKeepFamilyData(!keepFamilyData)}
            className="bg-orange-50/80 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-orange-300 flex items-center justify-between cursor-pointer select-none active:bg-orange-100 transition"
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                keepFamilyData ? 'bg-orange-500 border-orange-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {keepFamilyData && <Check className="w-3.5 h-3.5" />}
              </div>
              <span className="text-xs sm:text-sm font-bold text-orange-950">
                Pertahankan No. KK, Alamat, RT {formData.rt} & RW {formData.rw} untuk anggota keluarga berikutnya
              </span>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 sm:pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 self-start sm:self-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Data tersimpan aman di database Paroki St. Vincentius a Paulo.</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
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
                className="px-4 py-3 sm:py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition min-h-[48px] sm:min-h-[44px]"
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex-1 sm:flex-none px-6 py-3 sm:py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-md active:scale-98 transition-all border border-orange-600 flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[44px] disabled:opacity-50"
              >
                {submitting ? (
                  <span>Menyimpan...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-orange-100" />
                    <span>Simpan & Daftarkan Warga</span>
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
