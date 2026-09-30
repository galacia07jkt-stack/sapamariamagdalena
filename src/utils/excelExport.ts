import ExcelJS from 'exceljs';
import { WargaKatolik } from '../types';
import { toTitleCase } from './textUtils';

/**
 * Utility untuk mengekspor data jemaat ke file Excel (.xlsx)
 * dengan border rapi, kolom agama, styling warna biru muda & oranye khas paroki,
 * serta format teks agar NIK dan No KK tidak terpotong.
 */
export async function exportWargaToExcel(
  daftarWarga: WargaKatolik[],
  customTitle?: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SAPA Paroki St. Vincentius a Paulo Kediri';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Data Jemaat St Maria Magdalena', {
    pageSetup: { orientation: 'landscape', paperSize: 9 }, // A4 Landscape
    views: [{ state: 'frozen', ySplit: 7 }] // Freeze header baris ke-7
  });

  // Border styles
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF94A3B8' } },
    left: { style: 'thin', color: { argb: 'FF94A3B8' } },
    bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
    right: { style: 'thin', color: { argb: 'FF94A3B8' } },
  };

  const headerBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'medium', color: { argb: 'FF0284C7' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'double', color: { argb: 'FFEA580C' } }, // Double orange border di bawah header
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  };

  // 1. HEADER KOP SURAT PAROKI & LINGKUNGAN (19 Kolom: A sampai S)
  worksheet.mergeCells('A1:S1');
  const titleRow1 = worksheet.getCell('A1');
  titleRow1.value = 'SAPA - SISTEM ADMINISTRASI PENDATAAN WARGA KATOLIK';
  titleRow1.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF0369A1' } };
  titleRow1.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 28;

  worksheet.mergeCells('A2:S2');
  const titleRow2 = worksheet.getCell('A2');
  titleRow2.value = 'LINGKUNGAN ST. MARIA MAGDALENA - SEMAMPIR KOTA KEDIRI';
  titleRow2.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFEA580C' } };
  titleRow2.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 22;

  worksheet.mergeCells('A3:S3');
  const titleRow3 = worksheet.getCell('A3');
  titleRow3.value = 'PAROKI ST. VINCENTIUS A PAULO KOTA KEDIRI - KEUSKUPAN SURABAYA';
  titleRow3.font = { name: 'Arial', size: 11, bold: false, italic: true, color: { argb: 'FF334155' } };
  titleRow3.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(3).height = 20;

  // Garis oranye pembatas
  worksheet.mergeCells('A4:S4');
  const dividerRow = worksheet.getCell('A4');
  dividerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF97316' }, // Warna oranye
  };
  worksheet.getRow(4).height = 4;

  // Baris Info Tanggal & Filter
  worksheet.mergeCells('A5:I5');
  const infoLeft = worksheet.getCell('A5');
  const dateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  infoLeft.value = `Tanggal Unduh: ${dateStr} | Status: ${customTitle || 'Semua Data Terdaftar'}`;
  infoLeft.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF475569' } };
  infoLeft.alignment = { horizontal: 'left', vertical: 'middle' };

  worksheet.mergeCells('J5:S5');
  const infoRight = worksheet.getCell('J5');
  const totalKkCount = new Set(daftarWarga.map((w) => w.noKk).filter(Boolean)).size;
  const totalKatolik = daftarWarga.filter((w) => (w.agama || 'Katolik') === 'Katolik').length;
  infoRight.value = `Rekap: ${daftarWarga.length} Jiwa (${totalKatolik} Katolik) | ${totalKkCount} KK`;
  infoRight.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF0284C7' } };
  infoRight.alignment = { horizontal: 'right', vertical: 'middle' };
  worksheet.getRow(5).height = 18;

  worksheet.getRow(6).height = 8; // Spasi kecil

  // 2. HEADER TABEL KOLOM (BARIS 7)
  const columns = [
    { header: 'NO', key: 'no', width: 6 },
    { header: 'NO. KK (KARTU KELUARGA)', key: 'noKk', width: 22 },
    { header: 'NIK (KTP)', key: 'nik', width: 22 },
    { header: 'AGAMA', key: 'agama', width: 14 },
    { header: 'NAMA BAPTIS (SANTO/A)', key: 'namaBaptis', width: 24 },
    { header: 'NAMA LENGKAP WARGA', key: 'namaLengkap', width: 28 },
    { header: 'L/P', key: 'jenisKelamin', width: 6 },
    { header: 'HUB. KELUARGA', key: 'hubunganKeluarga', width: 16 },
    { header: 'ALAMAT DOMISILI (SEMAMPIR)', key: 'alamatDomisili', width: 34 },
    { header: 'RT/RW', key: 'rtRw', width: 14 },
    { header: 'TEMPAT BAPTIS', key: 'tempatBaptis', width: 26 },
    { header: 'PAROKI / KOTA BAPTIS', key: 'parokiKotaBaptis', width: 26 },
    { header: 'TGL BAPTIS', key: 'tanggalBaptis', width: 14 },
    { header: 'NO. SURAT BAPTIS', key: 'noSuratBaptis', width: 20 },
    { header: 'KOMUNI I', key: 'komuni', width: 11 },
    { header: 'KRISMA', key: 'krisma', width: 11 },
    { header: 'STATUS NIKAH', key: 'statusPerkawinan', width: 18 },
    { header: 'NO. WHATSAPP / HP', key: 'noHpWhatsapp', width: 18 },
    { header: 'VERIFIKASI', key: 'statusVerifikasi', width: 16 },
  ];

  const headerRow = worksheet.getRow(7);
  headerRow.height = 32;

  columns.forEach((col, idx) => {
    const colNumber = idx + 1;
    const cell = headerRow.getCell(colNumber);
    cell.value = col.header;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0284C7' }, // Biru Elegan
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = headerBorder;

    worksheet.getColumn(colNumber).width = col.width;
  });

  // 3. PENGISIAN DATA JEMAAT (Semua Teks Huruf Kapital Sesuai Instruksi)
  daftarWarga.forEach((warga, index) => {
    const rowIdx = 8 + index;
    const row = worksheet.getRow(rowIdx);
    row.height = 24;

    const isZebra = index % 2 === 1;
    const rowFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: isZebra ? 'FFF0F9FF' : 'FFFFFFFF' },
    };

    const isKatolik = (warga.agama || 'Katolik') === 'Katolik';
    const tglBaptisFormatted = isKatolik && warga.tanggalBaptis ? warga.tanggalBaptis : '-';

    row.getCell(1).value = index + 1; // NO
    row.getCell(2).value = warga.noKk; // NO KK
    row.getCell(3).value = warga.nik; // NIK
    row.getCell(4).value = warga.agama || 'Katolik'; // AGAMA
    row.getCell(5).value = isKatolik ? (toTitleCase(warga.namaBaptis || '') || '-') : '-'; // NAMA BAPTIS
    row.getCell(6).value = toTitleCase(warga.namaLengkap || ''); // NAMA LENGKAP
    row.getCell(7).value = warga.jenisKelamin; // L/P
    row.getCell(8).value = toTitleCase(warga.hubunganKeluarga || '');
    row.getCell(9).value = toTitleCase(warga.alamatDomisili || '');
    row.getCell(10).value = warga.rtRw || '';
    row.getCell(11).value = isKatolik ? (toTitleCase(warga.tempatBaptis || '') || '-') : '-';
    row.getCell(12).value = isKatolik ? (toTitleCase(warga.parokiKotaBaptis || '') || '-') : '-';
    row.getCell(13).value = tglBaptisFormatted;
    row.getCell(14).value = isKatolik ? (warga.noSuratBaptis || '-') : '-';
    row.getCell(15).value = isKatolik ? (warga.sakramenLain?.komuniPertama ? 'Sudah' : 'Belum') : '-';
    row.getCell(16).value = isKatolik ? (warga.sakramenLain?.krisma ? 'Sudah' : 'Belum') : '-';
    row.getCell(17).value = toTitleCase(warga.statusPerkawinan || '');
    row.getCell(18).value = warga.noHpWhatsapp || '-';
    row.getCell(19).value = warga.statusVerifikasi || 'Menunggu';

    // Apply borders and format on each cell (19 columns)
    for (let c = 1; c <= 19; c++) {
      const cell = row.getCell(c);
      cell.border = thinBorder;
      cell.fill = rowFill;
      cell.font = { name: 'Arial', size: 9.5 };

      // Pastikan No KK dan NIK sebagai teks murni agar 16 digit tidak menjadi scientific notation
      if (c === 2 || c === 3 || c === 14 || c === 18) {
        cell.numFmt = '@'; // Text format
      }

      // Alignment khusus
      if (c === 1 || c === 4 || c === 7 || c === 10 || c === 13 || c === 15 || c === 16 || c === 19) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (c === 2 || c === 3) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      }

      // Berikan warna oranye pada nama baptis agar estetik
      if (c === 5) {
        cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFC2410C' } };
      }
      if (c === 6) {
        cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
      }
    }
  });

  // 4. TOTAL REKAP ROW DI BAWAH DATA
  const lastDataRow = 7 + daftarWarga.length;
  const summaryRowIdx = lastDataRow + 1;
  const summaryRow = worksheet.getRow(summaryRowIdx);
  summaryRow.height = 26;

  worksheet.mergeCells(`A${summaryRowIdx}:C${summaryRowIdx}`);
  const summaryCell = summaryRow.getCell(1);
  summaryCell.value = 'JUMLAH TOTAL WARGA';
  summaryCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  summaryCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEA580C' }, // Oranye terang
  };
  summaryCell.alignment = { horizontal: 'center', vertical: 'middle' };

  for (let c = 1; c <= 19; c++) {
    const cell = summaryRow.getCell(c);
    cell.border = {
      top: { style: 'medium', color: { argb: 'FFEA580C' } },
      bottom: { style: 'medium', color: { argb: 'FFEA580C' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
    if (c > 3) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFEDD5' }, // Oranye muda lembut
      };
      cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF9A3412' } };
    }
  }

  summaryRow.getCell(4).value = `${totalKatolik} Katolik`;
  summaryRow.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };

  summaryRow.getCell(6).value = `${daftarWarga.length} Jiwa`;
  summaryRow.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };

  summaryRow.getCell(7).value = `L: ${daftarWarga.filter((w) => w.jenisKelamin === 'L').length} | P: ${daftarWarga.filter((w) => w.jenisKelamin === 'P').length}`;
  summaryRow.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };

  // 5. BLOK TANDA TANGAN RESMI PAROKI
  const signRowStart = summaryRowIdx + 3;

  worksheet.mergeCells(`B${signRowStart}:E${signRowStart}`);
  const signTitleLeft = worksheet.getCell(`B${signRowStart}`);
  signTitleLeft.value = 'Mengetahui,\nKetua Lingkungan St. Maria Magdalena';
  signTitleLeft.font = { name: 'Arial', size: 10, bold: true };
  signTitleLeft.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  worksheet.mergeCells(`O${signRowStart}:R${signRowStart}`);
  const signTitleRight = worksheet.getCell(`O${signRowStart}`);
  signTitleRight.value = `Kediri, ${dateStr}\nSekretaris Lingkungan`;
  signTitleRight.font = { name: 'Arial', size: 10, bold: true };
  signTitleRight.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  const signSpaceRow = signRowStart + 4;
  worksheet.mergeCells(`B${signSpaceRow}:E${signSpaceRow}`);
  const signNameLeft = worksheet.getCell(`B${signSpaceRow}`);
  signNameLeft.value = '( .................................................... )';
  signNameLeft.font = { name: 'Arial', size: 10 };
  signNameLeft.alignment = { horizontal: 'center', vertical: 'bottom' };

  worksheet.mergeCells(`O${signSpaceRow}:R${signSpaceRow}`);
  const signNameRight = worksheet.getCell(`O${signSpaceRow}`);
  signNameRight.value = '( .................................................... )';
  signNameRight.font = { name: 'Arial', size: 10 };
  signNameRight.alignment = { horizontal: 'center', vertical: 'bottom' };

  // Generate Buffer and Trigger Browser Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const now = new Date();
  const filename = `SAPA_St_Maria_Magdalena_Semampir_Kediri_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.xlsx`;

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
