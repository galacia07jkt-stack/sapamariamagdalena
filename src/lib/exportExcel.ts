import { KepalaKeluarga, AnggotaKeluarga, Inventaris, IuranKartuMerah } from '../types';
import { calculateAge, formatRupiah } from './helpers';

// Helper to trigger browser download
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getKopHeaderHtml(): string {
  try {
    const savedCustomImage = typeof localStorage !== 'undefined' ? localStorage.getItem('sapa_custom_kop_image') : null;
    const useCustomKop = typeof localStorage !== 'undefined' ? localStorage.getItem('sapa_use_custom_kop') === 'true' : false;

    if (useCustomKop && savedCustomImage) {
      return `
        <div style="text-align: center; margin-bottom: 15px; border-bottom: 3px double #7c2d12; padding-bottom: 10px;">
          <img src="${savedCustomImage}" style="max-height: 140px; width: auto; max-width: 100%; display: block; margin: 0 auto;" alt="Kop Surat" />
        </div>
      `;
    }
  } catch (e) {
    console.error(e);
  }

  return `
    <div style="width: 100%; text-align: center; margin-bottom: 15px; border-bottom: 3px double #7c2d12; padding-bottom: 8px;">
      <div style="font-size: 11pt; font-weight: bold; color: #7c2d12; text-transform: uppercase; margin-bottom: 2px;">GEREJA KATOLIK PAROKI ST. VINCENTIUS A PAULO KEDIRI</div>
      <div style="font-size: 15pt; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 2px;">LINGKUNGAN ST. MARIA MAGDALENA - SEMAMPIR KEDIRI</div>
      <div style="font-size: 10pt; font-weight: bold; color: #9a3412; text-transform: uppercase; margin-bottom: 2px;">KEUSKUPAN SURABAYA</div>
      <div style="font-size: 9pt; font-style: italic; color: #7c2d12; font-weight: bold; margin-bottom: 2px;">SAINT MARY MAGDALENE — DOKUMEN LINGKUNGAN ST MARIA MAGDALENA SEMAMPIR KEDIRI</div>
      <div style="font-size: 8.5pt; color: #475569;">Sekretariat: Semampir, Kediri - Jawa Timur | Sistem Aplikasi Pelayanan Administrasi (SAPA) Kediri</div>
    </div>
  `;
}

/**
 * Export Pendataan Warga & Anggota Keluarga to Excel (.xls HTML Table)
 */
export function exportWargaToExcel(
  kkList: KepalaKeluarga[],
  familyMembersMap: Record<string, AnggotaKeluarga[]>
) {
  const kopHtml = getKopHeaderHtml();
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Data Warga & KK</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 10pt; }
        th { background-color: #c2410c; color: #ffffff; font-weight: bold; border: 1px solid #9a3412; padding: 8px; text-align: center; }
        td { border: 1px solid #d1d5db; padding: 6px; vertical-align: middle; }
        .kop-header { text-align: center; font-family: Arial, sans-serif; margin-bottom: 15px; }
        .kop-paroki { font-size: 11pt; font-weight: bold; color: #7c2d12; text-transform: uppercase; }
        .kop-lingkungan { font-size: 15pt; font-weight: 900; color: #1e293b; text-transform: uppercase; }
        .kop-keuskupan { font-size: 10pt; font-weight: bold; color: #9a3412; text-transform: uppercase; }
        .kop-seal { font-size: 9pt; font-style: italic; color: #7c2d12; font-weight: bold; }
        .kop-sub { font-size: 9pt; color: #475569; border-bottom: 3px double #7c2d12; padding-bottom: 8px; margin-bottom: 12px; }
        .report-title { font-size: 13pt; font-weight: bold; text-align: center; color: #0f172a; margin-top: 10px; text-transform: uppercase; }
        .header-row { background-color: #ffedd5; font-weight: bold; }
        .text-center { text-align: center; }
      </style>
    </head>
    <body>
      ${kopHtml}

      <div class="report-title">LAPORAN PENDATAAN WARGA & KARTU KELUARGA</div>
      <p style="text-align: center; font-size: 10pt; color: #334155;"><b>Tanggal Export:</b> ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
      <table>
        <thead>
          <tr>
            <th>No.</th>
            <th>No. KK</th>
            <th>Kepala Keluarga / Nama Anggota</th>
            <th>NIK / Sequence</th>
            <th>Hubungan Keluarga</th>
            <th>Jenis Kelamin</th>
            <th>Tempat, Tgl Lahir</th>
            <th>Usia</th>
            <th>Agama</th>
            <th>Pendidikan</th>
            <th>Pekerjaan</th>
            <th>Alamat / RT / RW</th>
            <th>Wilayah</th>
            <th>Status Warga</th>
            <th>Kartu Biru</th>
            <th>Kartu Merah</th>
            <th>Sakramen Baptis (Nama, No. Surat, Tgl, Tempat)</th>
            <th>Komuni Pertama (No. Surat, Tgl, Tempat)</th>
            <th>Sakramen Krisma (Nama, No. Surat, Tgl, Tempat)</th>
            <th>Sakramen Perkawinan (No. Surat, Tgl, Tempat)</th>
            <th>Dispensasi Perkawinan (No. Surat, Tgl, Tempat)</th>
          </tr>
        </thead>
        <tbody>
  `;

  let rowNumber = 1;

  kkList.forEach((kk) => {
    const members = familyMembersMap[kk.id] || [];
    const kartuBiru = kk.kartu_biru_paroki?.memiliki ? `ADA (${kk.kartu_biru_paroki.no_kartu || '-'})` : 'TIDAK';
    const kartuMerah = kk.kartu_merah_lingkungan?.memiliki ? `ADA (${kk.kartu_merah_lingkungan.no_kartu || '-'})` : 'TIDAK';

    if (members.length === 0) {
      // Row if no members yet
      html += `
        <tr>
          <td class="text-center">${rowNumber++}</td>
          <td>'${kk.no_kk}</td>
          <td><b>${kk.nama_kepala_keluarga}</b></td>
          <td>-</td>
          <td>Kepala Keluarga</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>${kk.agama_kk}</td>
          <td>-</td>
          <td>-</td>
          <td>${kk.alamat} RT ${kk.rt}/RW ${kk.rw}</td>
          <td>${kk.wilayah}</td>
          <td class="text-center">${kk.status_warga}</td>
          <td class="text-center">${kartuBiru}</td>
          <td class="text-center">${kartuMerah}</td>
          <td>-</td><td>-</td><td>-</td><td>-</td><td>-</td>
        </tr>
      `;
    } else {
      members.forEach((ak, idx) => {
        const isFirst = idx === 0;

        const b = ak.baptis;
        const baptis = (b?.nama_baptis || b?.no_surat_baptis || b?.tgl_baptis || b?.tempat_baptis)
          ? `${b.nama_baptis ? b.nama_baptis + ' | ' : ''}No: ${b.no_surat_baptis || '-'} | Tgl: ${b.tgl_baptis || '-'} | Tempat: ${b.tempat_baptis || '-'}`
          : '-';

        const kp = ak.komuni_pertama;
        const komuni = (kp?.no_surat_komper || kp?.tgl_komuni_pertama || kp?.tempat_komuni_pertama)
          ? `No: ${kp.no_surat_komper || '-'} | Tgl: ${kp.tgl_komuni_pertama || '-'} | Tempat: ${kp.tempat_komuni_pertama || '-'}`
          : '-';

        const kr = ak.krisma;
        const krisma = (kr?.nama_krisma || kr?.no_surat_krisma || kr?.tgl_krisma || kr?.tempat_krisma)
          ? `${kr.nama_krisma ? kr.nama_krisma + ' | ' : ''}No: ${kr.no_surat_krisma || '-'} | Tgl: ${kr.tgl_krisma || '-'} | Tempat: ${kr.tempat_krisma || '-'}`
          : '-';

        const p = ak.perkawinan;
        const nikah = (p?.no_surat_perkawinan || p?.tgl_perkawinan || p?.tempat_perkawinan)
          ? `No: ${p.no_surat_perkawinan || '-'} | Tgl: ${p.tgl_perkawinan || '-'} | Tempat: ${p.tempat_perkawinan || '-'}`
          : '-';

        const dispensasi = (p?.is_dispensasi && (p.no_surat_dispensasi || p.tgl_dispensasi || p.tempat_dispensasi))
          ? `No: ${p.no_surat_dispensasi || '-'} | Tgl: ${p.tgl_dispensasi || '-'} | Tempat: ${p.tempat_dispensasi || '-'}`
          : (p?.is_dispensasi ? 'Ada Dispensasi' : '-');

        html += `
          <tr ${isFirst ? 'class="header-row"' : ''}>
            <td class="text-center">${isFirst ? rowNumber : ''}</td>
            <td>'${kk.no_kk}</td>
            <td><b>${ak.nama_lengkap}</b></td>
            <td>'${ak.nik}</td>
            <td>${ak.hub_keluarga}</td>
            <td class="text-center">${ak.jenis_kelamin}</td>
            <td>${ak.tempat_lahir}, ${ak.tanggal_lahir}</td>
            <td class="text-center">${calculateAge(ak.tanggal_lahir)} Thn</td>
            <td>${ak.agama}</td>
            <td>${ak.pendidikan_terakhir}</td>
            <td>${ak.pekerjaan}</td>
            <td>${kk.alamat} RT ${kk.rt}/RW ${kk.rw}</td>
            <td>${kk.wilayah}</td>
            <td class="text-center">${kk.status_warga}</td>
            <td class="text-center">${kartuBiru}</td>
            <td class="text-center">${kartuMerah}</td>
            <td>${baptis}</td>
            <td>${komuni}</td>
            <td>${krisma}</td>
            <td>${nikah}</td>
            <td>${dispensasi}</td>
          </tr>
        `;
      });
      rowNumber++;
    }
  });

  html += `
        </tbody>
      </table>
    </body>
    </html>
  `;

  const filename = `Laporan_Data_Warga_SAPA_${new Date().toISOString().split('T')[0]}.xls`;
  downloadFile(html, filename, 'application/vnd.ms-excel;charset=utf-8');
}

/**
 * Export Inventaris Lingkungan to Excel (.xls HTML Table)
 */
export function exportInventarisToExcel(inventarisList: Inventaris[]) {
  const kopHtml = getKopHeaderHtml();
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 10pt; }
        th { background-color: #c2410c; color: #ffffff; font-weight: bold; border: 1px solid #9a3412; padding: 8px; text-align: center; }
        td { border: 1px solid #d1d5db; padding: 6px; vertical-align: middle; }
        .kop-header { text-align: center; font-family: Arial, sans-serif; margin-bottom: 15px; }
        .kop-paroki { font-size: 11pt; font-weight: bold; color: #7c2d12; text-transform: uppercase; }
        .kop-lingkungan { font-size: 15pt; font-weight: 900; color: #1e293b; text-transform: uppercase; }
        .kop-keuskupan { font-size: 10pt; font-weight: bold; color: #9a3412; text-transform: uppercase; }
        .kop-seal { font-size: 9pt; font-style: italic; color: #7c2d12; font-weight: bold; }
        .kop-sub { font-size: 9pt; color: #475569; border-bottom: 3px double #7c2d12; padding-bottom: 8px; margin-bottom: 12px; }
        .report-title { font-size: 13pt; font-weight: bold; text-align: center; color: #0f172a; margin-top: 10px; text-transform: uppercase; }
        .text-center { text-align: center; }
      </style>
    </head>
    <body>
      ${kopHtml}

      <div class="report-title">LAPORAN INVENTARIS BARANG & ASET LINGKUNGAN</div>
      <p style="text-align: center; font-size: 10pt; color: #334155;"><b>Tanggal Export:</b> ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
      <table>
        <thead>
          <tr>
            <th>No. Urut</th>
            <th>Nama Barang Inventaris</th>
            <th>Jumlah</th>
            <th>Satuan</th>
            <th>Tempat Penyimpanan</th>
            <th>Kondisi Barang</th>
            <th>Keterangan / Status</th>
            <th>Terakhir Diperbarui</th>
          </tr>
        </thead>
        <tbody>
  `;

  inventarisList.forEach((inv) => {
    html += `
      <tr>
        <td class="text-center">${inv.no_urut}</td>
        <td><b>${inv.nama_barang}</b></td>
        <td class="text-center">${inv.jumlah}</td>
        <td class="text-center">${inv.satuan || 'Unit'}</td>
        <td>${inv.tempat_penyimpanan}</td>
        <td class="text-center">${inv.kondisi}</td>
        <td>${inv.keterangan || '-'}</td>
        <td>${inv.updated_at ? new Date(inv.updated_at).toLocaleDateString('id-ID') : '-'}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </body>
    </html>
  `;

  const filename = `Laporan_Inventaris_Lingkungan_${new Date().toISOString().split('T')[0]}.xls`;
  downloadFile(html, filename, 'application/vnd.ms-excel;charset=utf-8');
}

/**
 * Export Iuran Kartu Merah to Excel (.xls HTML Table)
 */
export function exportIuranToExcel(iuranList: IuranKartuMerah[]) {
  const kopHtml = getKopHeaderHtml();
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 10pt; }
        th { background-color: #c2410c; color: #ffffff; font-weight: bold; border: 1px solid #9a3412; padding: 8px; text-align: center; }
        td { border: 1px solid #d1d5db; padding: 6px; vertical-align: middle; }
        .kop-header { text-align: center; font-family: Arial, sans-serif; margin-bottom: 15px; }
        .kop-paroki { font-size: 11pt; font-weight: bold; color: #7c2d12; text-transform: uppercase; }
        .kop-lingkungan { font-size: 15pt; font-weight: 900; color: #1e293b; text-transform: uppercase; }
        .kop-keuskupan { font-size: 10pt; font-weight: bold; color: #9a3412; text-transform: uppercase; }
        .kop-seal { font-size: 9pt; font-style: italic; color: #7c2d12; font-weight: bold; }
        .kop-sub { font-size: 9pt; color: #475569; border-bottom: 3px double #7c2d12; padding-bottom: 8px; margin-bottom: 12px; }
        .report-title { font-size: 13pt; font-weight: bold; text-align: center; color: #0f172a; margin-top: 10px; text-transform: uppercase; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
      </style>
    </head>
    <body>
      ${kopHtml}

      <div class="report-title">LAPORAN IURAN KARTU MERAH LINGKUNGAN</div>
      <p style="text-align: center; font-size: 10pt; color: #334155;"><b>Tanggal Export:</b> ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
      <table>
        <thead>
          <tr>
            <th>No.</th>
            <th>Tanggal Bayar</th>
            <th>Hari / Bulan / Tahun</th>
            <th>No. KK</th>
            <th>Nama Kepala Keluarga</th>
            <th>Jenis Iuran</th>
            <th>Jumlah Iuran (Rp)</th>
            <th>Catatan</th>
            <th>Diinput Oleh</th>
          </tr>
        </thead>
        <tbody>
  `;

  let totalIuran = 0;

  iuranList.forEach((iur, idx) => {
    totalIuran += iur.jumlah_iuran;
    html += `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td class="text-center">${iur.tanggal_bayar}</td>
        <td>${iur.hari}, ${iur.bulan} ${iur.tahun}</td>
        <td>'${iur.no_kk}</td>
        <td><b>${iur.nama_kk}</b></td>
        <td class="text-center">${iur.jenis_iuran}</td>
        <td class="text-right">${formatRupiah(iur.jumlah_iuran)}</td>
        <td>${iur.catatan || '-'}</td>
        <td>${iur.diinput_oleh}</td>
      </tr>
    `;
  });

  html += `
          <tr style="background-color: #ffedd5; font-weight: bold;">
            <td colspan="6" class="text-right">TOTAL KESELURUHAN IURAN:</td>
            <td class="text-right">${formatRupiah(totalIuran)}</td>
            <td colspan="2"></td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `;

  const filename = `Laporan_Iuran_Kartu_Merah_${new Date().toISOString().split('T')[0]}.xls`;
  downloadFile(html, filename, 'application/vnd.ms-excel;charset=utf-8');
}
