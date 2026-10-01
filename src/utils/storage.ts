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
 * Dipanggil secara berkala (real-time polling setiap 3.5 detik) agar:
 * Saat warga mengisi dari HP / laptop lain, admin langsung melihat data masuk secara real-time!
 * Melindungi dari kehilangan data jika server sempat restart/fresh.
 */
export async function syncWithServer(): Promise<WargaKatolik[]> {
  try {
    const localRaw = localStorage.getItem(STORAGE_KEY);
    const localData: WargaKatolik[] = localRaw ? JSON.parse(localRaw) : [];

    const res = await fetch('/api/warga');
    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.data)) {
        const serverData: WargaKatolik[] = json.data;

        // Jika data di server masih kosong tapi di perangkat lokal sudah ada data yang pernah diinput,
        // sinkronkan data lokal naik ke server agar tidak hilang saat server restart.
        if (localData.length > 0 && serverData.length === 0) {
          fetch('/api/warga/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ list: localData }),
          }).catch(() => {});
          return localData;
        }

        // Penggabungan (Merge) data server dan lokal berdasarkan ID unik jemaat
        const mergedMap = new Map<string, WargaKatolik>();
        serverData.forEach((item) => mergedMap.set(item.id, item));

        // Jika ada data di lokal yang belum sempat terkirim ke server, pertahankan dan kirim
        const unpushed: WargaKatolik[] = [];
        localData.forEach((item) => {
          if (!mergedMap.has(item.id)) {
            mergedMap.set(item.id, item);
            unpushed.push(item);
          }
        });

        if (unpushed.length > 0) {
          unpushed.forEach((item) => {
            fetch('/api/warga', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item),
            }).catch(() => {});
          });
        }

        const mergedList = Array.from(mergedMap.values());
        // Urutkan dari data terbaru
        mergedList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        const isDifferent = JSON.stringify(mergedList) !== JSON.stringify(localData);
        if (isDifferent) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedList));
          localStorage.setItem(INITIALIZED_FLAG_KEY, 'true');
          window.dispatchEvent(new CustomEvent('sapa-warga-updated', { detail: mergedList }));
        }
        return mergedList;
      }
    }
  } catch (err) {
    // Jika koneksi terputus atau offline, tetap gunakan cache lokal
  }
  return getStoredWarga();
}

/**
 * Mengosongkan seluruh data jemaat / data demo secara permanen (Otoritas Admin)
 * Menghapus baik di localStorage maupun di server backend pusat!
 */
export function kosongkanSemuaWarga(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(INITIALIZED_FLAG_KEY, 'true');
    window.dispatchEvent(new CustomEvent('sapa-warga-updated', { detail: [] }));

    // Hapus di server pusat
    fetch('/api/warga', {
      method: 'DELETE',
    }).catch((err) => console.error('Gagal hapus database di server:', err));
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

    // Kirim sinkronisasi ke server
    fetch('/api/warga/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ list: INITIAL_WARGA_DATA }),
    }).catch((err) => console.error('Gagal kirim reset demo ke server:', err));
  } catch (err) {
    console.error('Gagal memuat ulang data demo:', err);
  }
}

/**
 * Tambah warga baru (dari formulir mandiri warga atau admin)
 * Langsung disimpan ke cache lokal DAN dikirim ke server pusat secara real-time!
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

  // Kirim secara langsung ke server pusat agar admin dan pengguna lain langsung melihatnya
  fetch('/api/warga', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newWarga),
  })
    .then((res) => res.json())
    .then((json) => {
      console.log('[SAPA Sync] Data berhasil tersimpan di server:', json);
    })
    .catch((err) => {
      console.error('[SAPA Sync] Gagal kirim ke server:', err);
    });

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

  // Kirim pembaruan ke server
  fetch(`/api/warga/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated),
  }).catch((err) => console.error('Gagal update di server:', err));

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

  // Hapus di server
  fetch(`/api/warga/${id}`, {
    method: 'DELETE',
  }).catch((err) => console.error('Gagal hapus di server:', err));

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

