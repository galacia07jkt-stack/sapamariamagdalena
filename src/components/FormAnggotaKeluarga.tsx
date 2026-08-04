import React, { useState, useEffect } from 'react';
import { AnggotaKeluarga, SakramenBaptis, SakramenKomuniPertama, SakramenKrisma, SakramenPerkawinan } from '../types';
import { saveAnggotaKeluarga, getAnggotaKeluargaByKK } from '../lib/database';
import { calculateAge, generateNIK } from '../lib/helpers';
import { UserPlus, Check, X, Lock, Heart, GraduationCap, Briefcase, Church } from 'lucide-react';
import { SapaLogo } from './SapaLogo';

interface FormAnggotaProps {
  idKK: string;
  noKK: string;
  initialData?: Partial<AnggotaKeluarga>;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (ak: AnggotaKeluarga) => void;
}

export const FormAnggotaKeluarga: React.FC<FormAnggotaProps> = ({
  idKK,
  noKK,
  initialData,
  isOpen,
  onClose,
  onSaved
}) => {
  const [nik, setNik] = useState(initialData?.nik || '');
  const [namaLengkap, setNamaLengkap] = useState(initialData?.nama_lengkap || '');
  const [namaPanggilan, setNamaPanggilan] = useState(initialData?.nama_panggilan || '');
  const [jenisKelamin, setJenisKelamin] = useState<'Laki-laki' | 'Perempuan'>(initialData?.jenis_kelamin || 'Laki-laki');
  const [tempatLahir, setTempatLahir] = useState(initialData?.tempat_lahir || '');
  const [tanggalLahir, setTanggalLahir] = useState(initialData?.tanggal_lahir || '');
  const [golonganDarah, setGolonganDarah] = useState(initialData?.golongan_darah || 'Belum Tahu');
  const [hubKeluarga, setHubKeluarga] = useState(initialData?.hub_keluarga || 'Anak');
  const [statusPerkawinan, setStatusPerkawinan] = useState(initialData?.status_perkawinan || 'Belum Menikah (Single)');
  const [noHp, setNoHp] = useState(initialData?.no_hp || '');

  // Dynamic Age
  const [calculatedAge, setCalculatedAge] = useState<number>(0);

  // Pendidikan
  const [pendidikanTerakhir, setPendidikanTerakhir] = useState(initialData?.pendidikan_terakhir || 'SMA / Sederajat');
  const [masihSekolah, setMasihSekolah] = useState(initialData?.masih_sekolah || false);
  const [namaSekolah, setNamaSekolah] = useState(initialData?.nama_sekolah || '');
  const [alamatSekolah, setAlamatSekolah] = useState(initialData?.alamat_sekolah || '');

  // Pekerjaan
  const [pekerjaan, setPekerjaan] = useState(initialData?.pekerjaan || 'Karyawan Swasta');
  const [namaPerusahaan, setNamaPerusahaan] = useState(initialData?.nama_perusahaan || '');
  const [alamatPerusahaan, setAlamatPerusahaan] = useState(initialData?.alamat_perusahaan || '');

  // Agama
  const [agama, setAgama] = useState(initialData?.agama || 'Katolik');

  // Sakramen
  const [baptis, setBaptis] = useState<SakramenBaptis>(initialData?.baptis || {});
  const [komuni, setKomuni] = useState<SakramenKomuniPertama>(initialData?.komuni_pertama || {});
  const [krisma, setKrisma] = useState<SakramenKrisma>(initialData?.krisma || {});
  const [perkawinan, setPerkawinan] = useState<SakramenPerkawinan>(initialData?.perkawinan || {});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Auto NIK generation on open if new
  useEffect(() => {
    if (isOpen) {
      if (tanggalLahir) {
        setCalculatedAge(calculateAge(tanggalLahir));
      }
      if (!initialData?.id && !nik) {
        getAnggotaKeluargaByKK(idKK, noKK).then((existing) => {
          const seq = existing.length + 1;
          setNik(generateNIK(noKK, seq));
        });
      }
    }
  }, [isOpen, tanggalLahir, idKK, noKK, initialData?.id, nik]);

  if (!isOpen) return null;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value;
    setTanggalLahir(d);
    setCalculatedAge(calculateAge(d));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!namaLengkap.trim()) {
      setError('Nama Lengkap Wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<AnggotaKeluarga> = {
        id: initialData?.id,
        id_keluarga: idKK,
        no_kk: noKK,
        nik,
        nama_lengkap: namaLengkap.trim().toUpperCase(),
        nama_panggilan: namaPanggilan.trim().toUpperCase(),
        jenis_kelamin: jenisKelamin,
        tempat_lahir: tempatLahir.trim().toUpperCase(),
        tanggal_lahir: tanggalLahir,
        golongan_darah: golonganDarah,
        hub_keluarga: hubKeluarga,
        status_perkawinan: statusPerkawinan,
        no_hp: noHp.trim(),
        pendidikan_terakhir: pendidikanTerakhir,
        masih_sekolah: masihSekolah,
        nama_sekolah: masihSekolah ? namaSekolah.trim().toUpperCase() : '',
        alamat_sekolah: masihSekolah ? alamatSekolah.trim().toUpperCase() : '',
        pekerjaan: pekerjaan.trim().toUpperCase(),
        nama_perusahaan: namaPerusahaan.trim().toUpperCase(),
        alamat_perusahaan: alamatPerusahaan.trim().toUpperCase(),
        agama,
        baptis: agama === 'Katolik' ? baptis : undefined,
        komuni_pertama: agama === 'Katolik' ? komuni : undefined,
        krisma: agama === 'Katolik' ? krisma : undefined,
        perkawinan: agama === 'Katolik' ? perkawinan : undefined
      };

      const saved = await saveAnggotaKeluarga(payload);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError('Gagal menyimpan data Anggota Keluarga.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-orange-200 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="shrink-0 bg-gradient-to-r from-orange-600 to-amber-600 px-4 sm:px-6 py-3.5 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5 sm:gap-3 font-extrabold text-sm sm:text-lg">
            <div className="bg-white/95 p-1 px-2.5 rounded-xl shadow-sm border border-orange-200 shrink-0">
              <SapaLogo size="xs" showText={false} />
            </div>
            <span className="truncate">{initialData?.id ? 'Edit Data Anggota Keluarga' : 'Tambah Anggota Keluarga Baru'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 text-xs text-slate-800">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-semibold">
                {error}
              </div>
            )}

          {/* Section 1: Identitas Diri */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-extrabold text-orange-900 border-b border-orange-200 pb-1 text-sm">
              <UserPlus className="w-4 h-4 text-orange-600" />
              <span>Identitas & Data Pribadi</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* NIK Lingkungan (LOCKED READ-ONLY DEFAULT) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-orange-600" /> NIK Lingkungan (Terkunci)
                </label>
                <input
                  type="text"
                  value={nik}
                  readOnly
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-500">Otomatis berdasar No. KK & nomor urut</span>
              </div>

              {/* Nama Lengkap (AUTOMATIC UPPERCASE) */}
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap (KAPITAL) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value.toUpperCase())}
                  placeholder="CONTOH: FRANSISKUS XAVERIUS KEVIN"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              {/* Nama Panggilan (AUTOMATIC UPPERCASE) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Panggilan (KAPITAL)</label>
                <input
                  type="text"
                  value={namaPanggilan}
                  onChange={(e) => setNamaPanggilan(e.target.value.toUpperCase())}
                  placeholder="KEVIN"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Jenis Kelamin */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                <select
                  value={jenisKelamin}
                  onChange={(e) => setJenisKelamin(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              {/* Hubungan Keluarga */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Hubungan Keluarga</label>
                <select
                  value={hubKeluarga}
                  onChange={(e) => setHubKeluarga(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="Kepala Keluarga">Kepala Keluarga</option>
                  <option value="Suami">Suami</option>
                  <option value="Istri">Istri</option>
                  <option value="Anak">Anak</option>
                  <option value="Orang Tua / Ibu">Orang Tua / Ibu</option>
                  <option value="Orang Tua / Bapak">Orang Tua / Bapak</option>
                  <option value="Mertua">Mertua</option>
                  <option value="Keponakan / Famili Lain">Keponakan / Famili Lain</option>
                </select>
              </div>

              {/* Status Perkawinan / Pernikahan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Perkawinan / Pernikahan</label>
                <select
                  value={statusPerkawinan}
                  onChange={(e) => setStatusPerkawinan(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="Belum Menikah (Single)">Belum Menikah / Single</option>
                  <option value="Menikah (Katolik)">Menikah (Katolik)</option>
                  <option value="Menikah (Beda Agama)">Menikah (Beda Agama)</option>
                  <option value="Menikah (Sipil / Awam)">Menikah (Sipil / Awam)</option>
                  <option value="Cerai Mati (Duda / Janda)">Cerai Mati (Duda / Janda)</option>
                  <option value="Cerai Hidup">Cerai Hidup</option>
                </select>
              </div>

              {/* Tempat Lahir */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tempat Lahir (KAPITAL)</label>
                <input
                  type="text"
                  value={tempatLahir}
                  onChange={(e) => setTempatLahir(e.target.value.toUpperCase())}
                  placeholder="KEDIRI"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Tanggal Lahir & Age Calculation */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Lahir</label>
                <input
                  type="date"
                  value={tanggalLahir}
                  onChange={handleDateChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {tanggalLahir && (
                  <div className="mt-1 text-[11px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 inline-block">
                    Usia Saat Ini: {calculatedAge} Tahun
                  </div>
                )}
              </div>

              {/* Golongan Darah */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Golongan Darah</label>
                <select
                  value={golonganDarah}
                  onChange={(e) => setGolonganDarah(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Belum Tahu">Belum Tahu</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>

              {/* No. HP */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">No. Handphone / WA</label>
                <input
                  type="text"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Agama */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Agama</label>
                <select
                  value={agama}
                  onChange={(e) => setAgama(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-orange-900 bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Katolik">Katolik</option>
                  <option value="Kristen Protestan">Kristen Protestan</option>
                  <option value="Islam">Islam</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Buddha">Buddha</option>
                  <option value="Konghucu">Konghucu</option>
                </select>
              </div>

            </div>
          </div>

          {/* Section 2: Pendidikan */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 font-extrabold text-slate-800 border-b border-slate-200 pb-1 text-sm">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>Pendidikan</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pendidikan Terakhir</label>
                <select
                  value={pendidikanTerakhir}
                  onChange={(e) => setPendidikanTerakhir(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="SD / Sederajat">SD / Sederajat</option>
                  <option value="SMP / Sederajat">SMP / Sederajat</option>
                  <option value="SMA / Sederajat">SMA / Sederajat</option>
                  <option value="D3 / Diploma">D3 / Diploma</option>
                  <option value="S1 / Sarjana">S1 / Sarjana</option>
                  <option value="S2 / Magister">S2 / Magister</option>
                  <option value="S3 / Doktor">S3 / Doktor</option>
                  <option value="Belum Sekolah">Belum Sekolah</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="chkSekolah"
                  checked={masihSekolah}
                  onChange={(e) => setMasihSekolah(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                <label htmlFor="chkSekolah" className="font-bold text-slate-800 cursor-pointer">
                  Masih Aktif Sekolah / Kuliah
                </label>
              </div>

              {masihSekolah && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Sekolah / Kampus (KAPITAL)</label>
                    <input
                      type="text"
                      value={namaSekolah}
                      onChange={(e) => setNamaSekolah(e.target.value.toUpperCase())}
                      placeholder="SDK ST. MARIA KEDIRI"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block font-bold text-slate-700 mb-1">Alamat Sekolah / Kampus (KAPITAL)</label>
                    <input
                      type="text"
                      value={alamatSekolah}
                      onChange={(e) => setAlamatSekolah(e.target.value.toUpperCase())}
                      placeholder="JL. DHOHO KEDIRI"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 3: Pekerjaan */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 font-extrabold text-slate-800 border-b border-slate-200 pb-1 text-sm">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <span>Pekerjaan</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Jenis Pekerjaan (KAPITAL)</label>
                <input
                  type="text"
                  value={pekerjaan}
                  onChange={(e) => setPekerjaan(e.target.value.toUpperCase())}
                  placeholder="PNS / SWASTA / WIRASWASTA / IBU RUMAH TANGGA"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Perusahaan / Instansi (KAPITAL)</label>
                <input
                  type="text"
                  value={namaPerusahaan}
                  onChange={(e) => setNamaPerusahaan(e.target.value.toUpperCase())}
                  placeholder="PT. XYZ KEDIRI"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Tempat Kerja (KAPITAL)</label>
                <input
                  type="text"
                  value={alamatPerusahaan}
                  onChange={(e) => setAlamatPerusahaan(e.target.value.toUpperCase())}
                  placeholder="JL. MAYOR BISMO NO. 10 KEDIRI"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Sakramen-Sakramen (HANYA JIKA AGAMA KATOLIK) */}
          {agama === 'Katolik' && (
            <div className="space-y-4 pt-3 bg-amber-50/60 p-4 rounded-xl border border-amber-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-200 pb-2 gap-1">
                <div className="flex items-center gap-2 font-extrabold text-amber-900 text-sm">
                  <Church className="w-4 h-4 text-amber-600" />
                  <span>Data Sakramen Gereja Katolik</span>
                </div>
                <span className="text-[11px] text-amber-800 italic">
                  * No. Surat, Tanggal & Tempat boleh KOSONG jika lupa atau tidak ada surat paroki
                </span>
              </div>

              {/* 1. Sakramen Baptis */}
              <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 space-y-2">
                <h4 className="font-extrabold text-slate-800 text-xs text-amber-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Sakramen Baptis
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nama Baptis (KAPITAL)</label>
                    <input
                      type="text"
                      value={baptis.nama_baptis || ''}
                      onChange={(e) => setBaptis({ ...baptis, nama_baptis: e.target.value.toUpperCase() })}
                      placeholder="FRANSISKUS"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">No. Surat Baptis</label>
                    <input
                      type="text"
                      value={baptis.no_surat_baptis || ''}
                      onChange={(e) => setBaptis({ ...baptis, no_surat_baptis: e.target.value })}
                      placeholder="BAP/2005/012 (Boleh Kosong)"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tgl. Baptis</label>
                    <input
                      type="date"
                      value={baptis.tgl_baptis || ''}
                      onChange={(e) => setBaptis({ ...baptis, tgl_baptis: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tempat Baptis</label>
                    <input
                      type="text"
                      value={baptis.tempat_baptis || ''}
                      onChange={(e) => setBaptis({ ...baptis, tempat_baptis: e.target.value })}
                      placeholder="Paroki St. Vincentius Kediri"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Sakramen Komuni Pertama */}
              <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 space-y-2">
                <h4 className="font-extrabold text-slate-800 text-xs text-amber-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Sakramen Komuni Pertama
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">No. Surat Komuni Pertama</label>
                    <input
                      type="text"
                      value={komuni.no_surat_komper || ''}
                      onChange={(e) => setKomuni({ ...komuni, no_surat_komper: e.target.value })}
                      placeholder="KOM/2015/044 (Boleh Kosong)"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tgl. Komuni Pertama</label>
                    <input
                      type="date"
                      value={komuni.tgl_komuni_pertama || ''}
                      onChange={(e) => setKomuni({ ...komuni, tgl_komuni_pertama: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tempat Komuni Pertama</label>
                    <input
                      type="text"
                      value={komuni.tempat_komuni_pertama || ''}
                      onChange={(e) => setKomuni({ ...komuni, tempat_komuni_pertama: e.target.value })}
                      placeholder="Paroki St. Vincentius Kediri"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Sakramen Krisma */}
              <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 space-y-2">
                <h4 className="font-extrabold text-slate-800 text-xs text-amber-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Sakramen Krisma
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nama Krisma (KAPITAL)</label>
                    <input
                      type="text"
                      value={krisma.nama_krisma || ''}
                      onChange={(e) => setKrisma({ ...krisma, nama_krisma: e.target.value.toUpperCase() })}
                      placeholder="FRANSISKUS"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">No. Surat Krisma</label>
                    <input
                      type="text"
                      value={krisma.no_surat_krisma || ''}
                      onChange={(e) => setKrisma({ ...krisma, no_surat_krisma: e.target.value })}
                      placeholder="KRI/2021/088 (Boleh Kosong)"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tgl. Krisma</label>
                    <input
                      type="date"
                      value={krisma.tgl_krisma || ''}
                      onChange={(e) => setKrisma({ ...krisma, tgl_krisma: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tempat Krisma</label>
                    <input
                      type="text"
                      value={krisma.tempat_krisma || ''}
                      onChange={(e) => setKrisma({ ...krisma, tempat_krisma: e.target.value })}
                      placeholder="Gereja St. Vincentius Kediri"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Sakramen Perkawinan & Dispensasi */}
              <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 space-y-3">
                <h4 className="font-extrabold text-slate-800 text-xs text-amber-900 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" /> Sakramen Perkawinan
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">No. Surat Perkawinan</label>
                    <input
                      type="text"
                      value={perkawinan.no_surat_perkawinan || ''}
                      onChange={(e) => setPerkawinan({ ...perkawinan, no_surat_perkawinan: e.target.value })}
                      placeholder="KAW/2010/012 (Boleh Kosong)"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tgl. Perkawinan</label>
                    <input
                      type="date"
                      value={perkawinan.tgl_perkawinan || ''}
                      onChange={(e) => setPerkawinan({ ...perkawinan, tgl_perkawinan: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tempat Perkawinan</label>
                    <input
                      type="text"
                      value={perkawinan.tempat_perkawinan || ''}
                      onChange={(e) => setPerkawinan({ ...perkawinan, tempat_perkawinan: e.target.value })}
                      placeholder="Paroki St. Vincentius Kediri"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Sub-section Dispensasi Pernikahan Campur */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="inline-flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!perkawinan.is_dispensasi}
                      onChange={(e) => setPerkawinan({ ...perkawinan, is_dispensasi: e.target.checked })}
                      className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                    />
                    <span>Ada Dispensasi untuk Pernikahan Campur Beda Agama / Beda Gereja</span>
                  </label>

                  {perkawinan.is_dispensasi && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2 bg-orange-50/80 p-3 rounded-lg border border-orange-200">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">No. Surat Dispensasi</label>
                        <input
                          type="text"
                          value={perkawinan.no_surat_dispensasi || ''}
                          onChange={(e) => setPerkawinan({ ...perkawinan, no_surat_dispensasi: e.target.value })}
                          placeholder="DISP/2010/003"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tgl. Surat Dispensasi</label>
                        <input
                          type="date"
                          value={perkawinan.tgl_dispensasi || ''}
                          onChange={(e) => setPerkawinan({ ...perkawinan, tgl_dispensasi: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tempat / Keuskupan Penerbit</label>
                        <input
                          type="text"
                          value={perkawinan.tempat_dispensasi || ''}
                          onChange={(e) => setPerkawinan({ ...perkawinan, tempat_dispensasi: e.target.value })}
                          placeholder="Keuskupan Surabaya"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          </div>

          {/* Form Actions - Fixed Footer */}
          <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 sm:py-2 rounded-xl text-slate-600 hover:bg-slate-200/70 font-bold transition-colors cursor-pointer text-sm sm:text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 sm:py-2 rounded-xl font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer text-sm sm:text-xs"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Anggota Keluarga'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
