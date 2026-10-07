import { WargaKatolik, StatistikParoki } from '../types';
import { INITIAL_WARGA_DATA } from './mockData';
import { encryptData, decryptData } from './encryption';
import { saveToIndexedDb, loadFromIndexedDb, clearIndexedDb } from './indexedDb';
import { 
  saveWargaToFirestore, 
  updateWargaInFirestore, 
  deleteWargaFromFirestore, 
  fetchAllWargaFromFirestore, 
  clearAllWargaInFirestore, 
  syncBatchToFirestore,
  subscribeToWargaFirestore
} from './firebase';

const STORAGE_KEY = 'SAPA_ST_MARIA_MAGDALENA_WARGA_DB_V1';
const INITIALIZED_FLAG_KEY = 'SAPA_DB_INITIALIZED_FLAG_V1';
const ENCRYPTED_BACKUP_KEY = 'SAPA_ENCRYPTED_VAULT_BACKUP';
const PERSISTENT_VAULT_KEY = 'SAPA_PERSISTENT_VAULT_BACKUP_V1';
const LAST_CLEARED_KEY = 'SAPA_CLIENT_LAST_CLEARED_AT';
const ADMIN_SESSION_KEY = 'SAPA_ADMIN_AUTH_TOKEN';

// Admin password strictly as requested
const ADMIN_SECRET_HASH = 'sapa123';

/**
 * Mengambil data jemaat dari localStorage (cache instan) dengan fallback ke Persistent Vault
 */
export function getStoredWarga(): WargaKatolik[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    // Kasus 1: Ada data di storage utama
    if (raw !== null) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item) => ({
            ...item,
            agama: item.agama || 'Katolik',
          }));
        }
      } catch {}
    }

    // Kasus 2: Storage utama kosong, cek apakah ada di Persistent Vault Backup
    const backupRaw = localStorage.getItem(PERSISTENT_VAULT_KEY);
    if (backupRaw !== null) {
      try {
        const backupParsed = JSON.parse(backupRaw);
        if (Array.isArray(backupParsed) && backupParsed.length > 0) {
          // Pulihkan kembali ke storage utama
          localStorage.setItem(STORAGE_KEY, backupRaw);
          return backupParsed.map((item) => ({
            ...item,
            agama: item.agama || 'Katolik',
          }));
        }
      } catch {}
    }

    return [];
  } catch (err) {
    console.error('Error membaca database jemaat:', err);
    return [];
  }
}

/**
 * Menyimpan data jemaat ke local database, persistent vault, dan IndexedDB tahan lama
 */
export function saveStoredWarga(data: WargaKatolik[]): void {
  try {
    const jsonStr = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, jsonStr);
    localStorage.setItem(INITIALIZED_FLAG_KEY, 'true');

    // Jika data berisi jemaat, simpan salinan tahan-lama di vault
    if (Array.isArray(data) && data.length > 0) {
      localStorage.setItem(PERSISTENT_VAULT_KEY, jsonStr);
      saveToIndexedDb(data).catch(() => {});
    }

    window.dispatchEvent(new CustomEvent('sapa-warga-updated', { detail: data }));
  } catch (err) {
    console.error('Gagal menyimpan ke database lokal:', err);
  }
}

/**
 * Inisialisasi awal dari IndexedDB browser
 */
export async function initStorageFromIndexedDb(): Promise<WargaKatolik[]> {
  const current = getStoredWarga();
  if (current.length > 0) {
    saveToIndexedDb(current).catch(() => {});
    return current;
  }

  try {
    const idbData = await loadFromIndexedDb();
    if (Array.isArray(idbData) && idbData.length > 0) {
      console.log('[SAPA Storage] Data berhasil dipulihkan dari IndexedDB:', idbData.length, 'jiwa');
      saveStoredWarga(idbData);
      return idbData;
    }
  } catch (err) {
    console.warn('[SAPA Storage] Gagal load dari IndexedDB:', err);
  }

  return [];
}

/**
 * Sinkronisasi data dengan Database Online Cloud Firestore
 * Terkoneksi langsung dan terpadu untuk semua perangkat HP & Laptop warga dan admin
 */
export async function syncWithServer(force = false): Promise<WargaKatolik[]> {
  // 1. Tarik dari Database Online Firestore (Paling Akurat & Global)
  try {
    const firestoreData = await fetchAllWargaFromFirestore();
    const localData = getStoredWarga();

    if (firestoreData.length > 0) {
      const map = new Map<string, WargaKatolik>();
      firestoreData.forEach((w) => map.set(w.id, w));

      let hasLocalUnsaved = false;
      const unuploaded: WargaKatolik[] = [];

      localData.forEach((lw) => {
        if (!map.has(lw.id)) {
          map.set(lw.id, lw);
          unuploaded.push(lw);
          hasLocalUnsaved = true;
        }
      });

      const merged = Array.from(map.values());
      saveStoredWarga(merged);

      // Jika ada data pendaftaran di perangkat ini yang belum tersimpan di Firestore online, unggah sekarang
      if (hasLocalUnsaved && unuploaded.length > 0) {
        console.log(`[SAPA Sync] Mengunggah ${unuploaded.length} data lokal baru ke Firestore Online...`);
        syncBatchToFirestore(unuploaded).catch(() => {});
      }

      return merged;
    } else if (localData.length > 0) {
      // Firestore online masih baru/kosong, migrasikan data lokal yang ada ke database online
      console.log('[SAPA Sync] Memigrasikan data pendaftaran lokal ke Database Online Firestore...');
      await syncBatchToFirestore(localData);
      return localData;
    }
  } catch (err) {
    console.warn('[SAPA Sync] Gagal koneksi Firestore online:', err);
  }

  // 2. Cadangan: Coba koneksi ke backend Express jika tersedia
  try {
    const res = await fetch(`/api/warga?t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.data) && json.data.length > 0) {
        saveStoredWarga(json.data);
        syncBatchToFirestore(json.data).catch(() => {});
        return json.data;
      }
    }
  } catch {}

  return getStoredWarga();
}

/**
 * Mengosongkan seluruh data jemaat secara permanen (Otoritas Admin)
 * Menghapus dari Database Online Firestore, Server Pusat, dan Penyimpanan Lokal
 */
export async function kosongkanSemuaWarga(): Promise<void> {
  const now = Date.now();
  localStorage.setItem(LAST_CLEARED_KEY, String(now));

  // 1. Kosongkan Database Online Firestore
  try {
    await clearAllWargaInFirestore();
    console.log('[SAPA Sync] Database Online Firestore berhasil dikosongkan.');
  } catch (err) {
    console.error('Gagal hapus Firestore:', err);
  }

  // 2. Kosongkan server backend lokal jika aktif
  try {
    await fetch('/api/warga', {
      method: 'DELETE',
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {}

  // 3. Bersihkan cache lokal
  saveStoredWarga([]);
  localStorage.removeItem(PERSISTENT_VAULT_KEY);
  await clearIndexedDb();
  localStorage.setItem(INITIALIZED_FLAG_KEY, 'true');
  window.dispatchEvent(new CustomEvent('sapa-warga-updated', { detail: [] }));
}

/**
 * Memuat kembali data contoh/demo bawaan untuk keperluan uji coba
 */
export async function resetKeDataDemo(): Promise<void> {
  localStorage.setItem(LAST_CLEARED_KEY, '0');
  
  // Masukkan ke Firestore Online
  try {
    await syncBatchToFirestore(INITIAL_WARGA_DATA);
  } catch {}

  try {
    await fetch('/api/warga/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ list: INITIAL_WARGA_DATA }),
    });
  } catch {}

  saveStoredWarga(INITIAL_WARGA_DATA);
  await syncWithServer(true);
}

/**
 * Tambah warga baru (dari formulir mandiri HP umat atau laptop admin)
 * LANGSUNG DISIMPAN KE DATABASE ONLINE FIRESTORE SECARA REAL-TIME!
 */
export async function tambahWarga(wargaData: Omit<WargaKatolik, 'id' | 'createdAt' | 'updatedAt'>): Promise<WargaKatolik> {
  const now = new Date().toISOString();
  const newWarga: WargaKatolik = {
    ...wargaData,
    id: `sapa-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: now,
    updatedAt: now,
  };

  // 1. Simpan segera ke local database agar instan
  const currentLocal = getStoredWarga();
  saveStoredWarga([...currentLocal, newWarga]);

  // 2. SIMPAN KE DATABASE ONLINE FIRESTORE (Paling Utama & Nyata)
  try {
    await saveWargaToFirestore(newWarga);
    console.log(`[SAPA Online DB] Sukses menyimpan ${newWarga.namaLengkap} ke Database Online!`);
  } catch (firestoreErr) {
    console.warn('[SAPA Online DB] Peringatan koneksi Firestore:', firestoreErr);
  }

  // 3. Kirim ke backend server jika ada
  try {
    fetch('/api/warga', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
      body: JSON.stringify(newWarga),
    }).catch(() => {});
  } catch {}

  return newWarga;
}

/**
 * Perbarui data warga
 * Mengirim pembaruan langsung ke Database Online Firestore dan memicu sinkronisasi
 */
export async function updateWarga(id: string, updatedFields: Partial<WargaKatolik>): Promise<WargaKatolik | null> {
  const now = new Date().toISOString();
  const fieldsWithTimestamp = {
    ...updatedFields,
    updatedAt: now,
  };

  // 1. Perbarui di Database Online Firestore
  try {
    await updateWargaInFirestore(id, fieldsWithTimestamp);
    console.log(`[SAPA Online DB] Data ${id} berhasil diperbarui di Database Online.`);
  } catch (err) {
    console.warn('[SAPA Online DB] Gagal update di Firestore:', err);
  }

  // 2. Perbarui data lokal
  const list = getStoredWarga();
  const index = list.findIndex((w) => w.id === id);
  let updatedRecord: WargaKatolik | null = null;

  if (index !== -1) {
    list[index] = {
      ...list[index],
      ...fieldsWithTimestamp,
    };
    updatedRecord = list[index];
    saveStoredWarga(list);
  }

  // 3. Kirim ke backend express jika ada
  fetch(`/api/warga/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(fieldsWithTimestamp),
  }).catch(() => {});

  return updatedRecord;
}

/**
 * Hapus data warga secara permanen
 * Menghapus dari Database Online Firestore dan database lokal
 */
export async function hapusWarga(id: string): Promise<boolean> {
  // 1. Hapus dari Database Online Firestore
  try {
    await deleteWargaFromFirestore(id);
    console.log(`[SAPA Online DB] Data ${id} berhasil dihapus dari Database Online.`);
  } catch (err) {
    console.warn('[SAPA Online DB] Gagal hapus dari Firestore:', err);
  }

  // 2. Hapus dari database lokal
  const list = getStoredWarga();
  const filtered = list.filter((w) => w.id !== id);
  saveStoredWarga(filtered);

  // 3. Hapus di backend Express jika ada
  fetch(`/api/warga/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'Cache-Control': 'no-store' },
  }).catch(() => {});

  return true;
}

/**
 * Pencarian data untuk fitur "Cek Ulang Warga"
 */
export function cariWargaByNikAtauKk(keyword: string): WargaKatolik[] {
  const cleanKeyword = keyword.trim().toLowerCase();
  if (!cleanKeyword) return [];

  const list = getStoredWarga();
  return list.filter((warga) => {
    return (
      (warga.nik && warga.nik.toLowerCase().includes(cleanKeyword)) ||
      (warga.noKk && warga.noKk.toLowerCase().includes(cleanKeyword)) ||
      (warga.namaLengkap && warga.namaLengkap.toLowerCase().includes(cleanKeyword)) ||
      (warga.namaBaptis && warga.namaBaptis.toLowerCase().includes(cleanKeyword))
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
    if (w.tanggalLahir && typeof w.tanggalLahir === 'string') {
      const parts = w.tanggalLahir.includes('/') ? w.tanggalLahir.split('/') : w.tanggalLahir.split('-');
      if (parts.length === 3) {
        const yearPart = parts[0].length === 4 ? parts[0] : parts[2];
        const birthYear = parseInt(yearPart, 10);
        if (!isNaN(birthYear)) {
          usia = Math.max(0, currentYear - birthYear);
        }
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
      syncBatchToFirestore(payload.data).catch(() => {});
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Re-export real-time listener dan aliases
export { subscribeToWargaFirestore };
export const cariWargaOlehNikAtauKk = cariWargaByNikAtauKk;
export const verifikasiAdminPassword = authenticateAdmin;
export const exportEncryptedBackup = downloadEncryptedVault;
export const restoreEncryptedBackup = restoreFromEncryptedVault;
