import { WargaKatolik, StatistikParoki } from '../types';
import { INITIAL_WARGA_DATA } from './mockData';
import { encryptData, decryptData } from './encryption';
import { saveToIndexedDb, loadFromIndexedDb, clearIndexedDb } from './indexedDb';

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
 * Jika pengguna membuka browser baru atau setelah restart dan localStorage kosong,
 * fungsi ini memeriksa IndexedDB dan memulihkan data jika tersedia.
 */
export async function initStorageFromIndexedDb(): Promise<WargaKatolik[]> {
  const current = getStoredWarga();
  if (current.length > 0) {
    // Pastikan IndexedDB tersinkron
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
 * Sinkronisasi data dua arah dengan Server Database Pusat (/api/warga)
 * Dilengkapi SISTEM ANTI-KEHILANGAN DATA:
 * 1. Jika server mengalami restart atau baru hidup (0 data), data lokal TIDAK AKAN PERNAH DIHAPUS.
 *    Sebaliknya, data lokal otomatis diunggah kembali ke server untuk memulihkan database server.
 * 2. Jika kedua pihak memiliki data, dilakukan penggabungan cerdas (two-way merge) tanpa duplikasi.
 * 3. Data hanya dihapus jika admin secara eksplisit menekan tombol "Kosongkan Semua Data".
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
        const serverLastClearedAt: number = json.lastClearedAt || 0;

        let localData = getStoredWarga();
        if (localData.length === 0) {
          const idbData = await loadFromIndexedDb();
          if (Array.isArray(idbData) && idbData.length > 0) {
            localData = idbData;
            saveStoredWarga(localData);
          }
        }

        const clientLastCleared = Number(localStorage.getItem(LAST_CLEARED_KEY) || 0);

        // KASUS 1: Server Kosong (0 data), TETAPI Local memiliki data jemaat
        // Terjadi saat server container baru hidup / restart di hari berikutnya
        if (serverData.length === 0 && localData.length > 0) {
          const wasExplicitlyCleared = serverLastClearedAt > 0 && serverLastClearedAt >= clientLastCleared;

          if (wasExplicitlyCleared) {
            // Admin memang sengaja mengosongkan data dari server
            saveStoredWarga([]);
            await clearIndexedDb();
            localStorage.removeItem(PERSISTENT_VAULT_KEY);
            return [];
          } else {
            // JANGAN HAPUS DATA LOKAL!
            // Unggah kembali data lokal ke server pusat agar server terisi kembali
            console.log('[SAPA Anti-Loss] Server baru hidup kembali. Mengunggah data lokal ke server...');
            fetch('/api/warga/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
              body: JSON.stringify({ list: localData }),
            }).catch((err) => console.error('Gagal re-seed server:', err));

            return localData;
          }
        }

        // KASUS 2: Server memiliki data, Local kosong (pengguna buka dari HP baru / browser baru)
        if (serverData.length > 0 && localData.length === 0) {
          saveStoredWarga(serverData);
          return serverData;
        }

        // KASUS 3: Keduanya memiliki data -> Penggabungan Cerdas (Two-Way Merge)
        if (serverData.length > 0 && localData.length > 0) {
          const map = new Map<string, WargaKatolik>();
          // Masukkan data lokal
          localData.forEach((w) => map.set(w.id, w));

          let needsServerUpdate = false;

          // Gabungkan data server
          serverData.forEach((sw) => {
            const lw = map.get(sw.id);
            if (!lw) {
              map.set(sw.id, sw);
            } else {
              const timeS = new Date(sw.updatedAt || sw.createdAt || 0).getTime();
              const timeL = new Date(lw.updatedAt || lw.createdAt || 0).getTime();
              if (timeS >= timeL) {
                map.set(sw.id, sw);
              } else {
                needsServerUpdate = true;
              }
            }
          });

          // Cek apakah ada record lokal yang belum ada di server
          localData.forEach((lw) => {
            if (!serverData.some((sw) => sw.id === lw.id)) {
              needsServerUpdate = true;
            }
          });

          const merged = Array.from(map.values());
          saveStoredWarga(merged);

          if (needsServerUpdate) {
            fetch('/api/warga/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
              body: JSON.stringify({ list: merged }),
            }).catch(() => {});
          }

          return merged;
        }

        return localData;
      }
    }
  } catch (err) {
    console.warn('[SAPA Sync] Gagal koneksi ke server, menggunakan data lokal cache:', err);
  }
  return getStoredWarga();
}

/**
 * Mengosongkan seluruh data jemaat secara permanen (Hanya atas Otoritas Admin)
 * Menghapus baik di server backend pusat maupun di semua lapisan penyimpanan lokal
 */
export async function kosongkanSemuaWarga(): Promise<void> {
  const now = Date.now();
  localStorage.setItem(LAST_CLEARED_KEY, String(now));

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

  // Simpan segera ke local database agar tidak hilang jika koneksi mendadak putus
  const currentLocal = getStoredWarga();
  saveStoredWarga([...currentLocal, newWarga]);

  // Simpan langsung ke server backend pusat dan tunggu konfirmasi
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

  // Tarik data terbaru dari server agar sinkron
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
  // 1. Hapus dari server backend pusat terlebih dahulu
  try {
    const res = await fetch(`/api/warga/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Cache-Control': 'no-store' },
    });

    if (!res.ok) {
      console.warn('[SAPA Sync] Gagal menghapus di server, melanjutkan penghapusan lokal.');
    } else {
      console.log(`[SAPA Sync] Data ${id} berhasil dihapus permanen dari server.`);
    }
  } catch (err) {
    console.error('Error saat request hapus ke server:', err);
  }

  // 2. Hapus dari database lokal
  const list = getStoredWarga();
  const filtered = list.filter((w) => w.id !== id);
  saveStoredWarga(filtered);

  // 3. Tarik data terbaru dari server
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
