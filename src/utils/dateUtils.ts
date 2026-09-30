/**
 * Utility untuk Format Tanggal Standar Indonesia DD/MM/YYYY
 */

/**
 * Format input string menjadi DD/MM/YYYY saat user mengetik angka
 * Contoh: "15" -> "15", "1508" -> "15/08", "15081995" -> "15/08/1995"
 */
export function formatInputToDdMmYyyy(value: string): string {
  // Hanya ambil digit angka
  const clean = value.replace(/\D/g, '').slice(0, 8);
  
  if (clean.length <= 2) {
    return clean;
  }
  if (clean.length <= 4) {
    return `${clean.slice(0, 2)}/${clean.slice(2)}`;
  }
  return `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4, 8)}`;
}

/**
 * Konversi tanggal dari YYYY-MM-DD ke DD/MM/YYYY
 */
export function isoToDdMmYyyy(isoDate?: string): string {
  if (!isoDate) return '';
  if (isoDate.includes('/')) return isoDate; // Sudah format DD/MM/YYYY
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  return isoDate;
}

/**
 * Konversi tanggal dari DD/MM/YYYY ke YYYY-MM-DD
 */
export function ddMmYyyyToIso(ddMmYyyy?: string): string {
  if (!ddMmYyyy) return '';
  if (ddMmYyyy.includes('-')) return ddMmYyyy; // Sudah format ISO
  const parts = ddMmYyyy.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return ddMmYyyy;
}

/**
 * Validasi apakah string merupakan tanggal DD/MM/YYYY yang valid
 */
export function isValidDdMmYyyy(str: string): boolean {
  if (!str) return false;
  const match = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;

  return true;
}
