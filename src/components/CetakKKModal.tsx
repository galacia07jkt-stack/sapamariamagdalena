import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { KepalaKeluarga, AnggotaKeluarga, PelayananLingkungan } from '../types';
import { getPelayananList } from '../lib/database';
import { calculateAge } from '../lib/helpers';
import { Printer, X, Download, Loader2, UserCheck } from 'lucide-react';
import { SapaLogo } from './SapaLogo';
import { KopSuratHeader } from './KopSuratHeader';

interface CetakKKModalProps {
  kk: KepalaKeluarga;
  members: AnggotaKeluarga[];
  isOpen: boolean;
  onClose: () => void;
}

export const CetakKKModal: React.FC<CetakKKModalProps> = ({
  kk,
  members,
  isOpen,
  onClose
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [logoVariant, setLogoVariant] = useState<'photo' | 'svg' | 'blank'>('photo');

  // Dynamic Ketua Lingkungan from Pelayanan database table
  const [ketuaLingkunganName, setKetuaLingkunganName] = useState('Antonius Bambang Setiawan');
  const [ketuaLingkunganJabatan, setKetuaLingkunganJabatan] = useState('Ketua Lingkungan');
  const [pelayananList, setPelayananList] = useState<PelayananLingkungan[]>([]);

  const fetchPelayananData = () => {
    getPelayananList()
      .then((list) => {
        setPelayananList(list);
        if (list.length > 0) {
          const reversed = [...list].reverse();
          const ketua =
            reversed.find((p) => p.kategori === 'Ketua Lingkungan') ||
            reversed.find(
              (p) =>
                p.kategori?.toLowerCase().includes('ketua') ||
                p.jabatan_tugas?.toLowerCase().includes('ketua')
            ) ||
            reversed.find(
              (p) =>
                p.kategori?.toLowerCase().includes('pengurus') ||
                p.jabatan_tugas?.toLowerCase().includes('pengurus')
            ) ||
            list[0];

          if (ketua && ketua.nama_petugas) {
            setKetuaLingkunganName(ketua.nama_petugas);
            setKetuaLingkunganJabatan(ketua.jabatan_tugas || ketua.kategori || 'Ketua Lingkungan');
          }
        }
      })
      .catch((err) => {
        console.error('Gagal memuat data pelayanan/pengurus untuk tanda tangan:', err);
      });
  };

  useEffect(() => {
    if (isOpen) {
      fetchPelayananData();
      window.addEventListener('sapa-db-updated', fetchPelayananData);
      return () => {
        window.removeEventListener('sapa-db-updated', fetchPelayananData);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const cleanName = (kk.nama_kepala_keluarga || 'Warga').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `KK_Lingkungan_${cleanName}_${kk.no_kk || '3571'}.pdf`;

      const element = printAreaRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1024
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // 10mm margin
      const imgWidth = pdfWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - (margin * 2));

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - (margin * 2));
      }

      pdf.save(filename);
    } catch (error) {
      console.error('Gagal mengunduh PDF:', error);
      alert('Gagal mengunduh PDF secara otomatis. Membuka dialog cetak browser...');
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 overflow-y-auto">
      
      {/* Container Modal */}
      <div className="bg-white rounded-2xl w-full max-w-5xl my-auto shadow-2xl border border-orange-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white flex flex-wrap items-center justify-between shrink-0 print:hidden shadow-md gap-3">
          
          {/* Top Left Area: Logo & Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md p-1.5 px-3 rounded-2xl border border-white/25 shadow-2xs">
              <div className="bg-white p-1 rounded-xl shadow-2xs">
                <SapaLogo size="xs" showText={false} />
              </div>
              <div>
                <h2 className="font-black text-xs sm:text-sm text-white leading-tight">
                  Cetak / Simpan KK Lingkungan
                </h2>
                <p className="text-[10px] text-amber-100 font-semibold">
                  Lingkungan St. Maria Magdalena
                </p>
              </div>
            </div>

            {/* Tombol Aksi di Sebelah Kiri Atas */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                title="Unduh Langsung File PDF ke Komputer / HP"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Membuat PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Simpan PDF</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 bg-white text-orange-950 hover:bg-orange-50 active:scale-95 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                title="Buka Dialog Cetak / Print Browser"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / Print</span>
              </button>

              {/* Selector Mode Logo Kop Surat */}
              <div className="flex items-center bg-black/20 p-1 rounded-xl border border-white/20 text-[11px] font-bold">
                <span className="text-orange-100 px-2 hidden lg:inline">Logo Kop:</span>
                <button
                  type="button"
                  onClick={() => setLogoVariant('photo')}
                  className={`px-2 py-1 rounded-lg transition-all ${logoVariant === 'photo' ? 'bg-amber-400 text-amber-950 font-black shadow-xs' : 'text-white hover:bg-white/10'}`}
                  title="Gunakan Foto Ikon Asli St. Maria Magdalena"
                >
                  🖼️ Foto Logo
                </button>
                <button
                  type="button"
                  onClick={() => setLogoVariant('blank')}
                  className={`px-2 py-1 rounded-lg transition-all ${logoVariant === 'blank' ? 'bg-amber-400 text-amber-950 font-black shadow-xs' : 'text-white hover:bg-white/10'}`}
                  title="Hilangkan Logo (Kosong)"
                >
                  🚫 Kosong
                </button>
              </div>

              {/* Selector & Edit Penandatangan Ketua Lingkungan */}
              <div className="flex flex-wrap items-center gap-1.5 bg-black/20 px-2 py-1 rounded-xl border border-white/20 text-[11px] font-semibold text-white">
                <UserCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="hidden xl:inline text-orange-100 font-bold">Penandatangan:</span>
                
                {pelayananList.length > 0 && (
                  <select
                    value={pelayananList.some(p => p.nama_petugas === ketuaLingkunganName) ? ketuaLingkunganName : 'custom'}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      if (selectedName !== 'custom') {
                        setKetuaLingkunganName(selectedName);
                        const found = pelayananList.find((p) => p.nama_petugas === selectedName);
                        if (found) {
                          setKetuaLingkunganJabatan(found.jabatan_tugas || 'Pengurus Lingkungan');
                        }
                      }
                    }}
                    className="bg-slate-900/90 text-amber-200 text-xs px-2 py-1 rounded-lg font-bold border border-amber-500/40 focus:outline-none cursor-pointer max-w-[150px] truncate"
                    title="Pilih Pengurus Lingkungan dari Tabel Pelayanan"
                  >
                    {pelayananList.map((p) => (
                      <option key={p.id} value={p.nama_petugas} className="bg-slate-900 text-white font-medium">
                        {p.nama_petugas} ({p.jabatan_tugas || p.kategori})
                      </option>
                    ))}
                    <option value="custom" className="bg-slate-900 text-amber-300 font-semibold italic">✏️ Tulis Manual</option>
                  </select>
                )}

                <input
                  type="text"
                  value={ketuaLingkunganName}
                  onChange={(e) => setKetuaLingkunganName(e.target.value)}
                  placeholder="Nama Ketua Lingkungan"
                  className="bg-slate-900/90 text-white text-xs px-2 py-1 rounded-lg border border-white/30 focus:border-amber-400 focus:outline-none w-36 sm:w-44 font-bold"
                  title="Ketik atau edit nama penandatangan secara langsung"
                />
              </div>
            </div>
          </div>

          {/* Tombol Tutup di Sebelah Kanan */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 font-sans print:p-0 print:m-0 print:overflow-visible print:max-h-none print:w-full bg-white">
          
          <div ref={printAreaRef} id="printable-kk-content" className="space-y-6 bg-white p-2">
            
            {/* Kop Surat Header Official KK */}
            <KopSuratHeader 
              title="KARTU KELUARGA LINGKUNGAN ST. MARIA MAGDALENA" 
              noDokumen={kk.no_kk} 
              logoVariant={logoVariant}
            />

            {/* General Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium border border-slate-300 p-4 rounded-xl bg-slate-50/50 print:bg-transparent print:border-black">
              <div className="space-y-1.5">
                <div className="flex">
                  <span className="w-36 font-bold text-slate-600 print:text-black">Nama Kepala Keluarga</span>
                  <span>: <strong className="text-slate-900 print:text-black">{kk.nama_kepala_keluarga}</strong></span>
                </div>
                <div className="flex">
                  <span className="w-36 font-bold text-slate-600 print:text-black">Alamat Rumah</span>
                  <span>: {kk.alamat}</span>
                </div>
                <div className="flex">
                  <span className="w-36 font-bold text-slate-600 print:text-black">RT / RW</span>
                  <span>: RT {kk.rt} / RW {kk.rw}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex">
                  <span className="w-36 font-bold text-slate-600 print:text-black">Wilayah Lingkungan</span>
                  <span>: {kk.wilayah}</span>
                </div>
                <div className="flex">
                  <span className="w-36 font-bold text-slate-600 print:text-black">Status Keanggotaan</span>
                  <span>: <strong className="text-orange-900 print:text-black">{kk.status_warga}</strong></span>
                </div>
                <div className="flex">
                  <span className="w-36 font-bold text-slate-600 print:text-black">Status Kartu Paroki</span>
                  <span>: {kk.kartu_biru_paroki?.memiliki ? `Kartu Biru (${kk.kartu_biru_paroki.no_kartu || 'Ada'})` : 'Belum Ada'} / {kk.kartu_merah_lingkungan?.memiliki ? `Kartu Merah (${kk.kartu_merah_lingkungan.no_kartu || 'Ada'})` : 'Belum Ada'}</span>
                </div>
              </div>
            </div>

            {/* Table 1: Data Kepala & Anggota Keluarga */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-xs uppercase text-slate-800 print:text-black border-l-4 border-orange-600 print:border-black pl-2">
                I. DAFTAR ANGGOTA KELUARGA ({members.length} ORANG)
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse border border-slate-300 print:border-black text-left">
                  <thead>
                    <tr className="bg-slate-100 print:bg-slate-200 text-slate-900 print:text-black font-extrabold">
                      <th className="border border-slate-300 print:border-black p-2 text-center w-8">NO</th>
                      <th className="border border-slate-300 print:border-black p-2">NAMA LENGKAP</th>
                      <th className="border border-slate-300 print:border-black p-2">NIK LINGKUNGAN</th>
                      <th className="border border-slate-300 print:border-black p-2">HUB. KELUARGA</th>
                      <th className="border border-slate-300 print:border-black p-2 text-center">JK</th>
                      <th className="border border-slate-300 print:border-black p-2">TEMPAT, TGL LAHIR</th>
                      <th className="border border-slate-300 print:border-black p-2 text-center">USIA</th>
                      <th className="border border-slate-300 print:border-black p-2">AGAMA</th>
                      <th className="border border-slate-300 print:border-black p-2">PENDIDIKAN</th>
                      <th className="border border-slate-300 print:border-black p-2">PEKERJAAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 print:divide-black">
                    {members.map((ak, idx) => (
                      <tr key={ak.id || idx} className="hover:bg-slate-50">
                        <td className="border border-slate-300 print:border-black p-2 text-center font-bold">{idx + 1}</td>
                        <td className="border border-slate-300 print:border-black p-2 font-bold">{ak.nama_lengkap}</td>
                        <td className="border border-slate-300 print:border-black p-2 font-mono">{ak.nik}</td>
                        <td className="border border-slate-300 print:border-black p-2 font-semibold">{ak.hub_keluarga}</td>
                        <td className="border border-slate-300 print:border-black p-2 text-center">{ak.jenis_kelamin === 'Laki-laki' ? 'L' : 'P'}</td>
                        <td className="border border-slate-300 print:border-black p-2">{ak.tempat_lahir}, {ak.tanggal_lahir}</td>
                        <td className="border border-slate-300 print:border-black p-2 text-center">{calculateAge(ak.tanggal_lahir)} th</td>
                        <td className="border border-slate-300 print:border-black p-2 font-medium">{ak.agama}</td>
                        <td className="border border-slate-300 print:border-black p-2">{ak.pendidikan_terakhir}</td>
                        <td className="border border-slate-300 print:border-black p-2">{ak.pekerjaan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Catatan Sakramen Gereja Katolik */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-xs uppercase text-slate-800 print:text-black border-l-4 border-orange-600 print:border-black pl-2">
                II. CATATAN SAKRAMEN GEREJA KATOLIK ANGGOTA KELUARGA
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-[10.5px] border-collapse border border-slate-300 print:border-black text-left">
                  <thead>
                    <tr className="bg-slate-100 print:bg-slate-200 text-slate-900 print:text-black font-extrabold">
                      <th className="border border-slate-300 print:border-black p-2 text-center w-8">NO</th>
                      <th className="border border-slate-300 print:border-black p-2">NAMA LENGKAP</th>
                      <th className="border border-slate-300 print:border-black p-2">SAKRAMEN BAPTIS</th>
                      <th className="border border-slate-300 print:border-black p-2">KOMUNI PERTAMA</th>
                      <th className="border border-slate-300 print:border-black p-2">SAKRAMEN KRISMA</th>
                      <th className="border border-slate-300 print:border-black p-2">PERKAWINAN & DISPENSASI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 print:divide-black">
                    {members.map((ak, idx) => {
                      const hasBaptis = !!(ak.baptis?.nama_baptis || ak.baptis?.no_surat_baptis || ak.baptis?.tgl_baptis || ak.baptis?.tempat_baptis);
                      const hasKomuni = !!(ak.komuni_pertama?.no_surat_komper || ak.komuni_pertama?.tgl_komuni_pertama || ak.komuni_pertama?.tempat_komuni_pertama);
                      const hasKrisma = !!(ak.krisma?.nama_krisma || ak.krisma?.no_surat_krisma || ak.krisma?.tgl_krisma || ak.krisma?.tempat_krisma);
                      const hasNikah = !!(ak.perkawinan?.no_surat_perkawinan || ak.perkawinan?.tgl_perkawinan || ak.perkawinan?.tempat_perkawinan || ak.perkawinan?.is_dispensasi);

                      return (
                        <tr key={`sak-${ak.id || idx}`} className="hover:bg-slate-50">
                          <td className="border border-slate-300 print:border-black p-1.5 text-center font-bold align-top">{idx + 1}</td>
                          <td className="border border-slate-300 print:border-black p-1.5 font-bold align-top">{ak.nama_lengkap}</td>
                          
                          {/* 1. BAPTIS */}
                          <td className="border border-slate-300 print:border-black p-1.5 align-top">
                            {hasBaptis ? (
                              <div className="space-y-0.5">
                                {ak.baptis?.nama_baptis && (
                                  <div className="font-bold text-slate-900 print:text-black uppercase text-[11px]">
                                    {ak.baptis.nama_baptis}
                                  </div>
                                )}
                                <div className="text-[10px] text-slate-700 print:text-black">
                                  <div><span className="font-semibold">No. Surat:</span> {ak.baptis?.no_surat_baptis || '-'}</div>
                                  <div><span className="font-semibold">Tgl:</span> {ak.baptis?.tgl_baptis || '-'}</div>
                                  <div><span className="font-semibold">Tempat:</span> {ak.baptis?.tempat_baptis || '-'}</div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 print:text-black italic">Belum Ada</span>
                            )}
                          </td>

                          {/* 2. KOMUNI PERTAMA */}
                          <td className="border border-slate-300 print:border-black p-1.5 align-top">
                            {hasKomuni ? (
                              <div className="space-y-0.5 text-[10px] text-slate-700 print:text-black">
                                <div><span className="font-semibold">No. Surat:</span> {ak.komuni_pertama?.no_surat_komper || '-'}</div>
                                <div><span className="font-semibold">Tgl:</span> {ak.komuni_pertama?.tgl_komuni_pertama || '-'}</div>
                                <div><span className="font-semibold">Tempat:</span> {ak.komuni_pertama?.tempat_komuni_pertama || '-'}</div>
                              </div>
                            ) : (
                              <span className="text-slate-400 print:text-black italic">Belum Ada</span>
                            )}
                          </td>

                          {/* 3. KRISMA */}
                          <td className="border border-slate-300 print:border-black p-1.5 align-top">
                            {hasKrisma ? (
                              <div className="space-y-0.5">
                                {ak.krisma?.nama_krisma && (
                                  <div className="font-bold text-slate-900 print:text-black uppercase text-[11px]">
                                    {ak.krisma.nama_krisma}
                                  </div>
                                )}
                                <div className="text-[10px] text-slate-700 print:text-black">
                                  <div><span className="font-semibold">No. Surat:</span> {ak.krisma?.no_surat_krisma || '-'}</div>
                                  <div><span className="font-semibold">Tgl:</span> {ak.krisma?.tgl_krisma || '-'}</div>
                                  <div><span className="font-semibold">Tempat:</span> {ak.krisma?.tempat_krisma || '-'}</div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 print:text-black italic">Belum Ada</span>
                            )}
                          </td>

                          {/* 4. PERKAWINAN & DISPENSASI */}
                          <td className="border border-slate-300 print:border-black p-1.5 align-top">
                            {hasNikah ? (
                              <div className="space-y-1">
                                <div className="space-y-0.5 text-[10px] text-slate-700 print:text-black">
                                  <div><span className="font-semibold">No. Surat:</span> {ak.perkawinan?.no_surat_perkawinan || '-'}</div>
                                  <div><span className="font-semibold">Tgl:</span> {ak.perkawinan?.tgl_perkawinan || '-'}</div>
                                  <div><span className="font-semibold">Tempat:</span> {ak.perkawinan?.tempat_perkawinan || '-'}</div>
                                </div>
                                {ak.perkawinan?.is_dispensasi && (
                                  <div className="p-1 rounded bg-orange-50 print:bg-transparent border border-orange-200 print:border-slate-300 text-[9.5px] text-orange-950 print:text-black space-y-0.5">
                                    <div className="font-bold uppercase text-[9px] text-orange-800 print:text-black">Dispensasi Nikah:</div>
                                    <div><span className="font-semibold">No. Surat:</span> {ak.perkawinan?.no_surat_dispensasi || '-'}</div>
                                    <div><span className="font-semibold">Tgl:</span> {ak.perkawinan?.tgl_dispensasi || '-'}</div>
                                    <div><span className="font-semibold">Tempat:</span> {ak.perkawinan?.tempat_dispensasi || '-'}</div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 print:text-black italic">Belum / Non</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signature Area */}
            <div className="pt-6 grid grid-cols-2 gap-8 text-xs font-semibold text-center print:pt-10">
              <div className="space-y-12">
                <p>Mengetahui,<br /><b>Pengurus Lingkungan St. Maria Magdalena</b></p>
                
                <div className="pt-6 space-y-1">
                  <input
                    type="text"
                    value={ketuaLingkunganName}
                    onChange={(e) => setKetuaLingkunganName(e.target.value)}
                    className="w-full text-center font-black underline uppercase bg-transparent outline-none border-b border-dashed border-amber-300 hover:border-amber-600 focus:border-amber-700 focus:bg-amber-50/50 print:border-none print:bg-transparent"
                    title="Otomatis dari Tabel Pelayanan Lingkungan"
                  />
                  <input
                    type="text"
                    value={ketuaLingkunganJabatan}
                    onChange={(e) => setKetuaLingkunganJabatan(e.target.value)}
                    className="w-full text-center text-[10px] text-slate-500 print:text-black bg-transparent outline-none border-b border-dashed border-slate-200 hover:border-slate-400 focus:border-amber-700 focus:bg-amber-50/50 print:border-none print:bg-transparent font-medium"
                    title="Jabatan Penandatangan"
                  />
                </div>
              </div>

              <div className="space-y-10">
                <p>Kediri, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}<br /><b>Kepala Keluarga</b></p>
                <div className="pt-8 space-y-1">
                  <p className="font-black underline uppercase">{kk.nama_kepala_keluarga}</p>
                  <p className="text-[10px] text-slate-500 print:text-black">Penanggung Jawab KK</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Print Stylesheet Injector */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-kk-content, #printable-kk-content * {
            visibility: visible !important;
          }
          #printable-kk-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 10mm !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

    </div>
  );
};

