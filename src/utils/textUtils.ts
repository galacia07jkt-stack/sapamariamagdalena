/**
 * Utility Pemformatan Teks Title Case
 * Sesuai Instruksi Pengguna:
 * "Huruf pertama di setiap kata wajib KAPITAL / BESAR" (Title Case)
 */

/**
 * Mengubah string menjadi format Title Case.
 * Huruf pertama di setiap kata dijadikan kapital/besar, dan huruf berikutnya disesuaikan.
 * Mendukung karakter tanda baca, spasi, titik, garis miring, tanda hubung.
 */
export function toTitleCase(input: string): string {
  if (!input) return '';

  return input
    .toLowerCase()
    .replace(/(?:^|[\s\-_/.()',])([a-z\u00C0-\u024F])/g, (match) => match.toUpperCase());
}

/**
 * Formatter saat pengguna mengetik (realtime typing)
 * Menjaga agar huruf pertama setiap kata langsung kapital tanpa merusak pengalaman mengetik spasi.
 */
export function formatRealtimeTitleCase(input: string): string {
  if (!input) return '';

  return input.replace(/(?:^|[\s\-_/.()',])([a-z\u00C0-\u024F])/g, (match) => match.toUpperCase());
}

/**
 * Memformat nomor RT dan RW menjadi format standar "RT XX / RW YY"
 * Contoh: ("02", "01") -> "RT 02 / RW 01"
 */
export function formatRtRw(rtInput: string, rwInput: string): string {
  const cleanRt = rtInput.trim().replace(/^RT\s*/i, '');
  const cleanRw = rwInput.trim().replace(/^RW\s*/i, '');

  const rtNum = cleanRt ? (cleanRt.length === 1 && /^\d$/.test(cleanRt) ? `0${cleanRt}` : cleanRt) : '01';
  const rwNum = cleanRw ? (cleanRw.length === 1 && /^\d$/.test(cleanRw) ? `0${cleanRw}` : cleanRw) : '01';

  return `RT ${rtNum} / RW ${rwNum}`;
}

/**
 * Memecah string RT/RW menjadi { rt: string, rw: string }
 * Contoh: "RT 02 / RW 01" -> { rt: "02", rw: "01" }
 */
export function parseRtRw(rtRwStr?: string): { rt: string; rw: string } {
  if (!rtRwStr) return { rt: '02', rw: '01' };
  const match = rtRwStr.match(/RT\s*([0-9a-zA-Z]+).*?RW\s*([0-9a-zA-Z]+)/i);
  if (match) {
    return { rt: match[1], rw: match[2] };
  }
  const parts = rtRwStr.split('/');
  if (parts.length >= 2) {
    return {
      rt: parts[0].replace(/\D/g, '') || parts[0].trim(),
      rw: parts[1].replace(/\D/g, '') || parts[1].trim(),
    };
  }
  return { rt: '02', rw: '01' };
}

