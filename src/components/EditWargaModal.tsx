import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { WargaKatolik, AgamaType } from '../types';
import { updateWarga } from '../utils/storage';
import { formatInputToDdMmYyyy, isValidDdMmYyyy } from '../utils/dateUtils';
import { toTitleCase, formatRealtimeTitleCase, formatRtRw, parseRtRw } from '../utils/textUtils';
import { SapaLogo } from './SapaLogo';

interface EditWargaModalProps {
  warga: WargaKatolik | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: WargaKatolik) => void;
}

interface FormEditState extends WargaKatolik {
  rt: string;
  rw: string;
}

export const EditWargaModal: React.FC<EditWargaModalProps> = ({
  warga,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !warga) return null;

  const parsedRtRw = parseRtRw(warga.rtRw);
  const [form, setForm] = useState<FormEditState>({
    ...warga,
    rt: parsedRtRw.rt,
    rw: parsedRtRw.rw,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (warga) {
      const parsed = parseRtRw(warga.rtRw);
      setForm({
        ...warga,
        rt: parsed.rt,
        rw: parsed.rw,
      });
      setErrorMsg(null);
    }
  }, [warga]);

  const agamaList: AgamaType[] = [
    'Katolik',
    'Islam',
    'Hindu',
    'Buddha',
    'Protestan',
    'Kepercayaan',
  ];

  const isKatolik = form.agama === 'Katolik';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'tanggalLahir' || name === 'tanggalBaptis') {
      const formatted = formatInputToDdMmYyyy(value);
      setForm((prev) => ({ ...prev, [name]: formatted }));
    } else if (name === 'noKk' || name === 'nik' || name === 'noHpWhatsapp' || name === 'agama' || name === 'jenisKelamin' || name === 'hubunganKeluarga' || name === 'statusPerkawinan' || name === 'statusVerifikasi') {
      setForm((prev) => ({ ...prev, [name]: value }));
    } else if (name === 'rt' || name === 'rw') {
      // Inputan RT sendiri & RW sendiri (bukan dropdown, alfanumerik)
      const cleanVal = value.replace(/[^0-9a-zA-Z]/g, '').slice(0, 4);
      setForm((prev) => ({ ...prev, [name]: cleanVal }));
    } else {
      // Realtime Title Case formatting
      setForm((prev) => ({ ...prev, [name]: formatRealtimeTitleCase(value) }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (
      name === 'namaLengkap' || 
      name === 'namaBaptis' || 
      name === 'tempatLahir' || 
      name === 'alamatDomisili' || 
      name === 'tempatBaptis' || 
      name === 'parokiKotaBaptis' || 
      name === 'pekerjaan' || 
      name === 'catatanKhusus'
    ) {
      setForm((prev) => ({ ...prev, [name]: toTitleCase(value) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanKk = String(form.noKk || '').replace(/\D/g, '');
    const cleanNik = String(form.nik || '').replace(/\D/g, '');

    if (cleanKk.length !== 16) {
      setErrorMsg('Nomor KK harus 16 digit angka.');
      return;
    }
    if (cleanNik.length !== 16) {
      setErrorMsg('NIK harus 16 digit angka.');
      return;
    }

    if (!String(form.rt || '').trim()) {
      setErrorMsg('Nomor RT wajib diisi.');
      return;
    }
    if (!String(form.rw || '').trim()) {
      setErrorMsg('Nomor RW wajib diisi.');
      return;
    }

    if (form.tanggalLahir && !isValidDdMmYyyy(form.tanggalLahir)) {
      setErrorMsg('Format tanggal lahir harus DD/MM/YYYY (contoh: 15/08/1995).');
      return;
    }

    if (isKatolik && form.tanggalBaptis && !isValidDdMmYyyy(form.tanggalBaptis)) {
      setErrorMsg('Format tanggal baptis harus DD/MM/YYYY (contoh: 22/08/1995).');
      return;
    }

    const finalRtRw = formatRtRw(form.rt, form.rw);

    const updated = await updateWarga(form.id, {
      ...form,
      noKk: cleanKk,
      nik: cleanNik,
      namaLengkap: toTitleCase(String(form.namaLengkap || '').trim()),
      namaBaptis: isKatolik ? toTitleCase(String(form.namaBaptis || '').trim()) : '',
      alamatDomisili: toTitleCase(String(form.alamatDomisili || '').trim()),
      rtRw: finalRtRw,
      tempatLahir: toTitleCase(String(form.tempatLahir || '').trim()),
      tempatBaptis: isKatolik ? toTitleCase(String(form.tempatBaptis || '').trim()) : undefined,
      parokiKotaBaptis: isKatolik ? toTitleCase(String(form.parokiKotaBaptis || '').trim()) : undefined,
      pekerjaan: toTitleCase(String(form.pekerjaan || '').trim()),
      catatanKhusus: toTitleCase(String(form.catatanKhusus || '').trim()),
    });

    if (updated) {
      onSuccess(updated);
      onClose();
    } else {
      setErrorMsg('Gagal memperbarui data.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-orange-500 shadow-2xl max-w-2xl sm:max-w-3xl w-full my-auto overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-900 text-white p-4 sm:p-5 flex items-center justify-between border-b-4 border-orange-500 shrink-0">
          <div className="flex items-center gap-2.5">
            <SapaLogo size="xs" />
            <div>
              <h3 className="font-bold text-sm sm:text-lg">Perbarui Data Warga</h3>
              <p className="text-[10px] sm:text-xs text-sky-200 truncate max-w-[200px] sm:max-w-none">
                {form.namaBaptis ? `${form.namaBaptis} ` : ''}{form.namaLengkap} ({form.agama}) • RT {form.rt} / RW {form.rw}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-sky-200 hover:text-white hover:bg-white/10 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          
          {/* Identitas Kependudukan & Agama */}
          <div>
            <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-sky-950 pb-1 border-b border-orange-300 mb-3">
              Identitas Kependudukan & Agama (Format Title Case)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Kartu Keluarga (KK)</label>
                <input
                  type="text"
                  name="noKk"
                  inputMode="numeric"
                  value={form.noKk}
                  onChange={handleChange}
                  maxLength={16}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs font-mono bg-white min-h-[44px]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NIK (16 Digit)</label>
                <input
                  type="text"
                  name="nik"
                  inputMode="numeric"
                  value={form.nik}
                  onChange={handleChange}
                  maxLength={16}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs font-mono bg-white min-h-[44px]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Sesuai KTP <span className="text-orange-600 font-normal">(Title Case)</span>
                </label>
                <input
                  type="text"
                  name="namaLengkap"
                  value={form.namaLengkap}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs bg-white font-bold text-slate-900 min-h-[44px]"
                  required
                />
              </div>

              {/* Agama */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Agama</label>
                <select
                  name="agama"
                  value={form.agama}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-orange-400 text-base sm:text-xs bg-orange-50/30 font-bold text-orange-950 min-h-[44px]"
                >
                  {agamaList.map((agm) => (
                    <option key={agm} value={agm}>
                      {agm}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    name="jenisKelamin"
                    value={form.jenisKelamin}
                    onChange={handleChange}
                    className="w-full px-2.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs bg-white min-h-[44px]"
                  >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hub. Keluarga</label>
                  <select
                    name="hubunganKeluarga"
                    value={form.hubunganKeluarga}
                    onChange={handleChange}
                    className="w-full px-2.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs bg-white min-h-[44px]"
                  >
                    <option value="Kepala Keluarga">Kepala Keluarga</option>
                    <option value="Istri">Istri</option>
                    <option value="Anak">Anak</option>
                    <option value="Orang Tua">Orang Tua</option>
                    <option value="Famili Lain">Famili Lain</option>
                  </select>
                </div>
              </div>

              {/* Tanggal Lahir DD/MM/YYYY */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    name="tempatLahir"
                    value={form.tempatLahir}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-2.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs bg-white min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tgl Lahir (DD/MM/YYYY)</label>
                  <input
                    type="text"
                    name="tanggalLahir"
                    inputMode="numeric"
                    value={form.tanggalLahir}
                    onChange={handleChange}
                    placeholder="HH/BB/TTTT"
                    className="w-full px-2.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs bg-white font-mono min-h-[44px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Data Sakramen Baptis (Hanya Muncul Jika Agama Katolik) */}
          {isKatolik ? (
            <div className="animate-fade-in">
              <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-sky-950 pb-1 border-b border-orange-300 mb-3">
                Data Sakramen Baptis Katolik (Format Title Case & DD/MM/YYYY)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Baptis (Santo/Santa) <span className="text-orange-600 font-normal">(Title Case)</span>
                  </label>
                  <input
                    type="text"
                    name="namaBaptis"
                    value={form.namaBaptis}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-orange-300 text-base sm:text-xs font-bold text-orange-950 bg-orange-50/20 min-h-[44px]"
                    required={isKatolik}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. Surat / Akta Baptis</label>
                  <input
                    type="text"
                    name="noSuratBaptis"
                    value={form.noSuratBaptis || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs font-mono bg-white min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tempat Baptis (Gereja)</label>
                  <input
                    type="text"
                    name="tempatBaptis"
                    value={form.tempatBaptis || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs bg-white min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Paroki / Kota Baptis</label>
                  <input
                    type="text"
                    name="parokiKotaBaptis"
                    value={form.parokiKotaBaptis || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs bg-white min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Baptis (DD/MM/YYYY)</label>
                  <input
                    type="text"
                    name="tanggalBaptis"
                    inputMode="numeric"
                    value={form.tanggalBaptis || ''}
                    onChange={handleChange}
                    placeholder="HH/BB/TTTT"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs bg-white font-mono min-h-[44px]"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!form.sakramenLain?.komuniPertama}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          sakramenLain: { ...form.sakramenLain, komuniPertama: e.target.checked, krisma: !!form.sakramenLain?.krisma, pernikahan: !!form.sakramenLain?.pernikahan },
                        })
                      }
                      className="w-4 h-4 text-orange-600 rounded border-slate-300"
                    />
                    <span>Komuni 1</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!form.sakramenLain?.krisma}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          sakramenLain: { ...form.sakramenLain, krisma: e.target.checked, komuniPertama: !!form.sakramenLain?.komuniPertama, pernikahan: !!form.sakramenLain?.pernikahan },
                        })
                      }
                      className="w-4 h-4 text-orange-600 rounded border-slate-300"
                    />
                    <span>Krisma</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!form.sakramenLain?.pernikahan}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          sakramenLain: { ...form.sakramenLain, pernikahan: e.target.checked, komuniPertama: !!form.sakramenLain?.komuniPertama, krisma: !!form.sakramenLain?.krisma },
                        })
                      }
                      className="w-4 h-4 text-orange-600 rounded border-slate-300"
                    />
                    <span>Perkawinan</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
              <span className="font-bold">Agama: {form.agama}</span> (Sakramen gerejawi Katolik tidak berlaku).
            </div>
          )}

          {/* Domisili & Status Verifikasi */}
          <div>
            <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-sky-950 pb-1 border-b border-orange-300 mb-3">
              Domisili Semampir & Verifikasi (Title Case)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Domisili <span className="text-orange-600 font-normal">(Title Case)</span>
                </label>
                <input
                  type="text"
                  name="alamatDomisili"
                  value={form.alamatDomisili}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs bg-white min-h-[44px]"
                  required
                />
              </div>

              {/* INPUT RT SENDIRI & RW SENDIRI (BUKAN DROPDOWN / LIST DOWN) */}
              <div className="sm:col-span-2 grid grid-cols-2 gap-3 p-3 bg-sky-50/50 rounded-xl border border-sky-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    RT (Rukun Tetangga) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="rt"
                      inputMode="numeric"
                      value={form.rt}
                      onChange={handleChange}
                      placeholder="02"
                      maxLength={4}
                      className="w-full pl-3 pr-9 py-2.5 rounded-xl border-2 border-sky-300 font-mono font-bold text-sky-950 text-base sm:text-xs bg-white min-h-[44px]"
                      required
                    />
                    <span className="text-xs text-sky-700 absolute right-2.5 top-3 font-bold pointer-events-none">
                      RT
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Ketik mandiri (bukan list down)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    RW (Rukun Warga) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="rw"
                      inputMode="numeric"
                      value={form.rw}
                      onChange={handleChange}
                      placeholder="01"
                      maxLength={4}
                      className="w-full pl-3 pr-9 py-2.5 rounded-xl border-2 border-sky-300 font-mono font-bold text-sky-950 text-base sm:text-xs bg-white min-h-[44px]"
                      required
                    />
                    <span className="text-xs text-sky-700 absolute right-2.5 top-3 font-bold pointer-events-none">
                      RW
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Ketik mandiri (bukan list down)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp</label>
                <input
                  type="tel"
                  inputMode="tel"
                  name="noHpWhatsapp"
                  value={form.noHpWhatsapp || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs font-mono bg-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status Verifikasi</label>
                <select
                  name="statusVerifikasi"
                  value={form.statusVerifikasi}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-emerald-400 text-base sm:text-xs font-bold text-emerald-950 bg-emerald-50 min-h-[44px]"
                >
                  <option value="Terverifikasi">Terverifikasi</option>
                  <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                  <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Khusus</label>
                <input
                  type="text"
                  name="catatanKhusus"
                  value={form.catatanKhusus || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Pengurus / Koor / Misdinar"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs bg-white min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md border border-orange-600 flex items-center gap-1.5 min-h-[44px]"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
