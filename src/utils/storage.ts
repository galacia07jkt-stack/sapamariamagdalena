import { WargaKatolik, StatistikParoki } from '../types';
import { INITIAL_WARGA_DATA } from './mockData';
import { encryptData, decryptData } from './encryption';

const STORAGE_KEY = 'SAPA_ST_MARIA_MAGDALENA_WARGA_DB_V1';
const INITIALIZED_FLAG_KEY = 'SAPA_DB_INITIALIZED_FLAG_V1';
const ENCRYPTED_BACKUP_KEY = 'SAPA_ENCRYPTED_VAULT_BACKUP';
const ADMIN_SESSION_KEY = 'SAPA_ADMIN_AUTH_TOKEN';

// Admin password strictly as requested
const ADMIN_SECRET_HASH = 'sapa123';

/**
 * Mengambil seluruh data jemaat
 * Catatan penting: Jika data dikosongkan/dihapus oleh admin pengurus (panjang array = 0),
 * data akan tetap kosong ([]) dan TIDAK AKAN di-reseed otomatis dengan data demo.
 */
export function getStoredWarga(): WargaKatolik[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const hasInitialized = localStorage.getItem(INITIALIZED_FLAG_KEY);

    // Kasus 1: Pengguna pertama kali membuka aplikasi (Awal Berjalannya Aplikasi)
    // Database dimulai dalam kondisi BERSIH & KOSONG (0 data jemaat), siap untuk input data asli.
    if (raw === null && !hasInitialized) {
      saveStoredWarga([]);
      return [];
    }

    // Kasus 2: Data ada di localStorage
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // PENTING: Jika parsed adalah [] (kosong karena sudah dihapus/dikosongkan),
        // TETAP kembalikan [] dan jangan kembalikan INITIAL_WARGA_DATA!
        return parsed.map((item) => ({
          ...item,
          agama: item.agama || 'Katolik',
        }));
      }
    }

    // Kasus 3: Jika raw bernilai null setelah sebelumnya diinisialisasi
    return [];
  } catch (err) {
    console.error('Error membaca database jemaat:', err);
    return [];
  }
}

/**
 * Menyimpan data jemaat ke local database dan memicu event sinkronisasi
 */
export function saveStoredWarga(data: WargaKatolik[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(INITIALIZED_FLAG_KEY, 'true');
    window.dispatchEvent(new CustomEvent('sapa-warga-updated', { detail: data }));
  } catch (err) {
    console.error('Gagal menyimpan ke database lokal:', err);
  }
}

/**
 * Mengosongkan seluruh data jemaat / data demo secara permanen (Otoritas Admin)
 */
export function kosongkanSemuaWarga(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(INITIALIZED_FLAG_KEY, 'true');
    window.dispatchEvent(new CustomEvent('sapa-warga-updated', { detail: [] }));
  } catch (err) {
    console.error('Gagal mengosongkan database:', err);
  }
}

/**
 * Memuat kembali data contoh/demo bawaan untuk keperluan uji coba
 */
export function resetKeDataDemo(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_WARGA_DATA));
    localStorage.setItem(INITIALIZED_FLAG_KEY, 'true');
    window.dispatchEvent(new CustomEvent('sapa-warga-updated', { detail: INITIAL_WARGA_DATA }));
  } catch (err) {
    console.error('Gagal memuat ulang data demo:', err);
  }
}

/**
 * Tambah warga baru (dari formulir mandiri warga atau admin)
 */
export function tambahWarga(wargaData: Omit<WargaKatolik, 'id' | 'createdAt' | 'updatedAt'>): WargaKatolik {
  const list = getStoredWarga();
  const now = new Date().toISOString();
  const newWarga: WargaKatolik = {
    ...wargaData,
    id: `sapa-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: now,
    updatedAt: now,
  };

  const updatedList = [newWarga, ...list];
  saveStoredWarga(updatedList);
  return newWarga;
}

/**
 * Perbarui data warga
 */
export function updateWarga(id: string, updatedFields: Partial<WargaKatolik>): WargaKatolik | null {
  const list = getStoredWarga();
  const index = list.findIndex((w) => w.id === id);
  if (index === -1) return null;

  const updated: WargaKatolik = {
    ...list[index],
    ...updatedFields,
    updatedAt: new Date().toISOString(),
  };

  list[index] = updated;
  saveStoredWarga(list);
  return updated;
}

/**
 * Hapus data warga secara permanen
 */
export function hapusWarga(id: string): boolean {
  const list = getStoredWarga();
  const filtered = list.filter((w) => w.id !== id);
  if (filtered.length === list.length) return false;
  saveStoredWarga(filtered);
  return true;
}

/**
 * Pencarian data untuk fitur "Cek Ulang Warga"
 * Berdasarkan NIK atau Nomor KK
 */
export function cariWargaOlehNikAtauKk(keyword: string): WargaKatolik[] {
  const cleanKeyword = keyword.trim().toLowerCase();
  if (!cleanKeyword) return [];

  const list = getStoredWarga();
  return list.filter((w) => {
    const matchNik = w.nik.trim().toLowerCase() === cleanKeyword;
    const matchKk = w.noKk.trim().toLowerCase() === cleanKeyword;
    const matchNama = cleanKeyword.length >= 4 && (
      w.namaLengkap.toLowerCase().includes(cleanKeyword) ||
      w.namaBaptis.toLowerCase().includes(cleanKeyword)
    );
    return matchNik || matchKk || matchNama;
  });
}

/**
 * Hitung statistik agregat jemaat Lingkungan St. Maria Magdalena
 */
export function hitungStatistikParoki(list: WargaKatolik[]): StatistikParoki {
  const totalJiwa = list.length;
  const uniqueKk = new Set(list.map((w) => w.noKk).filter(Boolean));
  const totalKk = uniqueKk.size;

  let totalKatolik = 0;
  let totalNonKatolik = 0;
  let totalLakiLaki = 0;
  let totalPerempuan = 0;
  let totalBaptis = 0;
  let totalKomuni = 0;
  let totalKrisma = 0;
  let totalNikahKatolik = 0;

  const kelompokUsia = {
    biak: 0,
    rekat: 0,
    omk: 0,
    dewasa: 0,
    lansia: 0,
  };

  const distribusiRt: { [rt: string]: number } = {};
  const distribusiAgama: { [agama: string]: number } = {
    Katolik: 0,
    'Kristen Protestan': 0,
    Islam: 0,
    Hindu: 0,
    Buddha: 0,
    Kepercayaan: 0,
  };

  const currentYear = new Date().getFullYear();

  list.forEach((w) => {
    // Agama
    const agm = w.agama || 'Katolik';
    distribusiAgama[agm] = (distribusiAgama[agm] || 0) + 1;
    if (agm === 'Katolik') {
      totalKatolik++;
    } else {
      totalNonKatolik++;
    }

    if (w.jenisKelamin === 'L') totalLakiLaki++;
    if (w.jenisKelamin === 'P') totalPerempuan++;

    if (agm === 'Katolik' && (w.tanggalBaptis || w.namaBaptis)) totalBaptis++;
    if (agm === 'Katolik' && w.sakramenLain?.komuniPertama) totalKomuni++;
    if (agm === 'Katolik' && w.sakramenLain?.krisma) totalKrisma++;
    if (w.statusPerkawinan === 'Menikah Katolik') totalNikahKatolik++;

    // Hitung usia dari format DD/MM/YYYY atau YYYY-MM-DD
    if (w.tanggalLahir) {
      let birthYear = 0;
      if (w.tanggalLahir.includes('/')) {
        const parts = w.tanggalLahir.split('/');
        birthYear = parseInt(parts[2], 10);
      } else if (w.tanggalLahir.includes('-')) {
        const parts = w.tanggalLahir.split('-');
        birthYear = parseInt(parts[0], 10);
      }

      if (!isNaN(birthYear) && birthYear > 1900) {
        const age = currentYear - birthYear;
        if (age <= 12) kelompokUsia.biak++;
        else if (age <= 17) kelompokUsia.rekat++;
        else if (age <= 35) kelompokUsia.omk++;
        else if (age <= 59) kelompokUsia.dewasa++;
        else kelompokUsia.lansia++;
      } else {
        kelompokUsia.dewasa++;
      }
    } else {
      kelompokUsia.dewasa++;
    }

    // Distribusi RT
    const rtKey = w.rtRw ? w.rtRw.split('/')[0].trim() : 'Lainnya';
    distribusiRt[rtKey] = (distribusiRt[rtKey] || 0) + 1;
  });

  return {
    totalJiwa,
    totalKk,
    totalKatolik,
    totalNonKatolik,
    totalLakiLaki,
    totalPerempuan,
    totalBaptis,
    totalKomuni,
    totalKrisma,
    totalNikahKatolik,
    kelompokUsia,
    distribusiRt,
    distribusiAgama,
  };
}

/**
 * Autentikasi Admin
 * Password strictly 'sapa123'
 */
export function verifikasiAdminPassword(inputPassword: string): boolean {
  if (inputPassword === ADMIN_SECRET_HASH) {
    const sessionToken = `AUTH_SAPA_ADMIN_${Date.now()}`;
    sessionStorage.setItem(ADMIN_SESSION_KEY, sessionToken);
    return true;
  }
  return false;
}

export function isAdminAuthenticated(): boolean {
  return !!sessionStorage.getItem(ADMIN_SESSION_KEY);
}

export function logoutAdmin(): void {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  window.dispatchEvent(new CustomEvent('sapa-auth-changed'));
}

/**
 * Fitur Enkripsi Backup Data Paroki
 */
export async function buatBackupTerenkripsi(): Promise<string> {
  const list = getStoredWarga();
  const jsonStr = JSON.stringify(list, null, 2);
  const encrypted = await encryptData(jsonStr);
  localStorage.setItem(ENCRYPTED_BACKUP_KEY, encrypted);
  return encrypted;
}

/**
 * Unduh file cadangan terenkripsi (.sapa-vault)
 */
export async function downloadEncryptedVault(): Promise<void> {
  const encrypted = await buatBackupTerenkripsi();
  const blob = new Blob([encrypted], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SAPA_ENCRYPTED_VAULT_${new Date().toISOString().slice(0, 10)}.sapa`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Pulihkan data dari file cadangan terenkripsi
 */
export async function restoreFromEncryptedVault(fileContent: string): Promise<boolean> {
  try {
    const decrypted = await decryptData(fileContent);
    const parsed = JSON.parse(decrypted);
    if (Array.isArray(parsed)) {
      saveStoredWarga(parsed);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Gagal restore data:', err);
    return false;
  }
}
