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
 * Mengambil data jemaat dari localStorage (cache instan)
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
        return parsed.map((item) => ({
          ...item,
          agama: item.agama || 'Katolik',
        }));
      }
    }

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
 * Sinkronisasi data dengan Server Database Pusat (/api/warga)
 * Server bertindak sebagai SINGLE SOURCE OF TRUTH (Pusat Kebenaran Mutlak):
 * - Saat warga mengisi dari HP mana pun, data masuk ke server.
 * - Saat admin atau warga menarik data / polling, server mengirimkan data resmi.
 * - Saat data dihapus di server, data langsung hilang permanen dan TIDAK AKAN PERNAH muncul kembali!
 */
export async function syncWithServer(force = false): Promise<WargaKatolik[]> {
  try {
    const res = await fetch(`/api/warga?t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.data)) {
        const serverData: WargaKatolik[] = json.data;

        const localRaw = localStorage.getItem(STORAGE_KEY);
        const localData: WargaKatolik[] = localRaw ? JSON.parse(localRaw) : [];

        // Bandingkan apakah isi data berubah atau dipaksa refresh
        const isDifferent = JSON.stringify(serverData) !== JSON.stringify(localData);
        if (isDifferent || force) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
          localStorage.setItem(INITIALIZED_FLAG_KEY, 'true');
          window.dispatchEvent(new CustomEvent('sapa-warga-updated', { detail: serverData }));
        }
        return serverData;
      }
    }
  } catch (err) {
    console.warn('[SAPA Sync] Gagal koneksi ke server, menggunakan data lokal cache:', err);
  }
  return getStoredWarga();
}

/**
 * Mengosongkan seluruh data jemaat / data demo secara permanen (Otoritas Admin)
 * Menghapus baik di server backend pusat maupun di cache lokal!
 */
export async function kosongkanSemuaWarga(): Promise<void> {
  try {
    const res = await fetch('/api/warga', {
      method: 'DELETE',
      headers: { 'Cache-Control': 'no-store' },
    });
    if (res.ok) {
      console.log('[SAPA Sync] Database di server berhasil dikosongkan.');
    }
  } catch (err) {
    console.error('Gagal hapus database di server:', err);
  }

  saveStoredWarga([]);
  localStorage.setItem(INITIALIZED_FLAG_KEY, 'true');
  window.dispatchEvent(new CustomEvent('sapa-warga-updated', { detail: [] }));
}

/**
 * Memuat kembali data contoh/demo bawaan untuk keperluan uji coba
 */
export async function resetKeDataDemo(): Promise<void> {
  try {
    await fetch('/api/warga/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ list: INITIAL_WARGA_DATA }),
    });
  } catch (err) {
    console.error('Gagal kirim reset demo ke server:', err);
  }

  saveStoredWarga(INITIAL_WARGA_DATA);
  await syncWithServer(true);
}

/**
 * Tambah warga baru (dari formulir mandiri HP umat atau laptop admin)
 * Wajib menunggu respon dari server pusat (AWAIT) agar data pasti tersimpan di database server!
 */
export async function tambahWarga(wargaData: Omit<WargaKatolik, 'id' | 'createdAt' | 'updatedAt'>): Promise<WargaKatolik> {
  const now = new Date().toISOString();
  const newWarga: WargaKatolik = {
    ...wargaData,
    id: `sapa-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: now,
    updatedAt: now,
  };

  // 1. Simpan langsung ke server backend pusat dan tunggu konfirmasi
  try {
    const res = await fetch('/api/warga', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
      body: JSON.stringify(newWarga),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Server menolak penyimpanan data.');
    }

    console.log('[SAPA Sync] Berhasil disimpan di database pusat:', newWarga.namaLengkap);
  } catch (err) {
    console.error('[SAPA Sync] Gagal kirim ke server pusat:', err);
    throw err;
  }

  // 2. Tarik data terbaru dari server agar sinkron
  await syncWithServer(true);

  return newWarga;
}

/**
 * Perbarui data warga
 * Mengirim pembaruan langsung ke database server pusat dan memperbarui state lokal
 */
export async function updateWarga(id: string, updatedFields: Partial<WargaKatolik>): Promise<WargaKatolik | null> {
  let updatedRecord: WargaKatolik | null = null;

  // 1. Kirim pembaruan ke database server pusat terlebih dahulu
  try {
    const res = await fetch(`/api/warga/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify(updatedFields),
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.data) {
        updatedRecord = json.data;
        console.log(`[SAPA Sync] Data ${id} berhasil diperbarui di server:`, updatedFields);
      }
    }
  } catch (err) {
    console.error('[SAPA Sync] Gagal update di server:', err);
  }

  // 2. Perbarui data lokal
  const list = getStoredWarga();
  const index = list.findIndex((w) => w.id === id);

  if (index !== -1) {
    list[index] = {
      ...list[index],
      ...updatedFields,
      updatedAt: new Date().toISOString(),
    };
    if (!updatedRecord) updatedRecord = list[index];
    saveStoredWarga(list);
  } else if (updatedRecord) {
    saveStoredWarga([updatedRecord, ...list]);
  }

  // 3. Tarik data terbaru dari server
  await syncWithServer(true);

  return updatedRecord;
}

/**
 * Hapus data warga secara permanen
 * Menghapus dari server pusat terlebih dahulu agar saat perangkat lain refresh/tarik data, data tidak muncul lagi!
 */
export async function hapusWarga(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/warga/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Cache-Control': 'no-store' },
    });
    if (res.ok) {
      console.log(`[SAPA Sync] Data ${id} berhasil dihapus dari server pusat.`);
    }
  } catch (err) {
    console.error('Gagal hapus di server:', err);
  }

  const list = getStoredWarga();
  const filtered = list.filter((w) => w.id !== id);
  saveStoredWarga(filtered);
  await syncWithServer(true);

  return true;
}

/**
 * Pencarian data untuk fitur "Cek Ulang Warga"
 * Berdasarkan NIK atau Nomor KK
 */
export function cariWargaByNikAtauKk(keyword: string): WargaKatolik[] {
  const cleanKeyword = keyword.trim().toLowerCase();
  if (!cleanKeyword) return [];

  const list = getStoredWarga();
  return list.filter((warga) => {
    return (
      warga.nik.toLowerCase().includes(cleanKeyword) ||
      warga.noKk.toLowerCase().includes(cleanKeyword) ||
      warga.namaLengkap.toLowerCase().includes(cleanKeyword) ||
      warga.namaBaptis.toLowerCase().includes(cleanKeyword)
    );
  });
}

/**
 * Menghitung rekapitulasi statistik demografi jemaat
 */
export function hitungStatistikParoki(list: WargaKatolik[]): StatistikParoki {
  const totalJiwa = list.length;
  const uniqueKk = new Set(list.map((w) => w.noKk).filter(Boolean));
  const totalKk = uniqueKk.size;

  let totalLakiLaki = 0;
  let totalPerempuan = 0;
  let totalBaptis = 0;
  let totalKomuni = 0;
  let totalKrisma = 0;
  let totalNikahKatolik = 0;
  let totalKatolik = 0;
  let totalNonKatolik = 0;

  const kelompokUsia = {
    biak: 0,
    rekat: 0,
    omk: 0,
    dewasa: 0,
    lansia: 0,
  };

  const distribusiRt: Record<string, number> = {};
  const distribusiAgama: Record<string, number> = {
    Katolik: 0,
    'Kristen Protestan': 0,
    Islam: 0,
    Hindu: 0,
    Buddha: 0,
    Kepercayaan: 0,
  };

  const currentYear = new Date().getFullYear();

  list.forEach((w) => {
    // Hitung Agama
    const agm = w.agama || 'Katolik';
    distribusiAgama[agm] = (distribusiAgama[agm] || 0) + 1;

    if (agm === 'Katolik') {
      totalKatolik++;
    } else {
      totalNonKatolik++;
    }

    // Gender
    if (w.jenisKelamin === 'L') totalLakiLaki++;
    if (w.jenisKelamin === 'P') totalPerempuan++;

    // Sakramen
    if (w.noSuratBaptis || w.tanggalBaptis) totalBaptis++;
    if (w.sakramenLain?.komuniPertama) totalKomuni++;
    if (w.sakramenLain?.krisma) totalKrisma++;
    if (w.statusPerkawinan === 'Menikah Katolik') totalNikahKatolik++;

    // Usia
    let usia = 30; // default jika tanggal lahir tidak diisi
    if (w.tanggalLahir) {
      const birthYear = parseInt(w.tanggalLahir.split('-')[0] || w.tanggalLahir.split('/')[2] || '1995', 10);
      if (!isNaN(birthYear)) {
        usia = Math.max(0, currentYear - birthYear);
      }
    }

    if (usia <= 12) kelompokUsia.biak++;
    else if (usia <= 17) kelompokUsia.rekat++;
    else if (usia <= 35) kelompokUsia.omk++;
    else if (usia <= 59) kelompokUsia.dewasa++;
    else kelompokUsia.lansia++;

    // Distribusi RT
    const rt = w.rtRw || 'RT Belum Terdata';
    distribusiRt[rt] = (distribusiRt[rt] || 0) + 1;
  });

  return {
    totalJiwa,
    totalKk,
    totalLakiLaki,
    totalPerempuan,
    totalBaptis,
    totalKomuni,
    totalKrisma,
    totalNikahKatolik,
    totalKatolik,
    totalNonKatolik,
    kelompokUsia,
    distribusiRt,
    distribusiAgama,
  };
}

// ==========================================
// KELOLA AUTENTIKASI ADMIN & ENKRIPSI VAULT
// ==========================================

export function authenticateAdmin(passwordInput: string): boolean {
  if (passwordInput === ADMIN_SECRET_HASH) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    window.dispatchEvent(new CustomEvent('sapa-auth-changed', { detail: true }));
    return true;
  }
  return false;
}

export function isAdminAuthenticated(): boolean {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

export function logoutAdmin(): void {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  window.dispatchEvent(new CustomEvent('sapa-auth-changed', { detail: false }));
}

/**
 * Unduh backup arsip terenkripsi (.sapa) menggunakan AES-GCM 256
 */
export async function downloadEncryptedVault(passkey: string = 'sapa123-semampir-kediri-secure'): Promise<string> {
  const currentData = getStoredWarga();
  const payload = {
    exportedAt: new Date().toISOString(),
    paroki: 'St. Vincentius a Paulo Kediri',
    lingkungan: 'St. Maria Magdalena - Semampir',
    totalRecords: currentData.length,
    data: currentData,
  };
  const jsonStr = JSON.stringify(payload);
  const encrypted = await encryptData(jsonStr, passkey);
  localStorage.setItem(ENCRYPTED_BACKUP_KEY, encrypted);

  // Trigger file download otomatis
  const blob = new Blob([encrypted], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SAPA_BACKUP_VAULT_${new Date().toISOString().slice(0, 10)}.sapa`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return encrypted;
}

/**
 * Pulihkan data dari string arsip terenkripsi (.sapa)
 */
export async function restoreFromEncryptedVault(encryptedStr: string, passkey: string = 'sapa123-semampir-kediri-secure'): Promise<boolean> {
  try {
    const decryptedJson = await decryptData(encryptedStr, passkey);
    if (!decryptedJson) return false;

    const payload = JSON.parse(decryptedJson);
    if (payload && Array.isArray(payload.data)) {
      saveStoredWarga(payload.data);
      // Kirim sinkronisasi ke server juga
      fetch('/api/warga/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ list: payload.data }),
      }).catch((err) => console.error('Gagal sync restore ke server:', err));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Export aliases untuk kompatibilitas komponen
export const cariWargaOlehNikAtauKk = cariWargaByNikAtauKk;
export const verifikasiAdminPassword = authenticateAdmin;
export const exportEncryptedBackup = downloadEncryptedVault;
export const restoreEncryptedBackup = restoreFromEncryptedVault;

