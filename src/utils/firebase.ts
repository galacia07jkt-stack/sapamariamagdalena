import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import { WargaKatolik } from '../types';
import configData from '../../firebase-applet-config.json';

const firebaseConfig = {
  projectId: configData.projectId,
  appId: configData.appId,
  apiKey: configData.apiKey,
  authDomain: configData.authDomain,
  storageBucket: configData.storageBucket,
  messagingSenderId: configData.messagingSenderId,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Gunakan database ID khusus yang disediakan oleh proyek
export const db = configData.firestoreDatabaseId 
  ? getFirestore(app, configData.firestoreDatabaseId)
  : getFirestore(app);

// Validasi koneksi awal sesuai arahan Firebase skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[SAPA Firebase] Terhubung ke Cloud Firestore Online Database.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[SAPA Firebase] Klien offline, beralih ke cache Firestore lokal.');
    }
  }
}
testConnection();

const WARGA_COLLECTION = 'warga';

function cleanForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanForFirestore);

  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      cleaned[k] = cleanForFirestore(v);
    }
  }
  return cleaned;
}

/**
 * Menyimpan data warga ke Cloud Firestore online
 */
export async function saveWargaToFirestore(warga: WargaKatolik): Promise<void> {
  try {
    const docRef = doc(db, WARGA_COLLECTION, warga.id);
    const cleaned = cleanForFirestore(warga);
    await setDoc(docRef, cleaned, { merge: true });
    console.log(`[SAPA Firebase] Berhasil menyimpan ${warga.namaLengkap} ke Database Online.`);
  } catch (err) {
    console.error('[SAPA Firebase] Gagal simpan ke Firestore:', err);
    throw err;
  }
}

/**
 * Memperbarui data warga di Cloud Firestore online
 */
export async function updateWargaInFirestore(id: string, updates: Partial<WargaKatolik>): Promise<void> {
  try {
    const docRef = doc(db, WARGA_COLLECTION, id);
    const cleaned = cleanForFirestore(updates);
    await updateDoc(docRef, cleaned);
    console.log(`[SAPA Firebase] Berhasil memperbarui data ${id} di Database Online.`);
  } catch (err) {
    console.error('[SAPA Firebase] Gagal update di Firestore:', err);
    throw err;
  }
}

/**
 * Menghapus data warga dari Cloud Firestore online
 */
export async function deleteWargaFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, WARGA_COLLECTION, id);
    await deleteDoc(docRef);
    console.log(`[SAPA Firebase] Berhasil menghapus ${id} dari Database Online.`);
  } catch (err) {
    console.error('[SAPA Firebase] Gagal hapus dari Firestore:', err);
    throw err;
  }
}

/**
 * Mengambil seluruh data jemaat dari Cloud Firestore online
 */
export async function fetchAllWargaFromFirestore(): Promise<WargaKatolik[]> {
  try {
    const snapshot = await getDocs(collection(db, WARGA_COLLECTION));
    const items: WargaKatolik[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as WargaKatolik;
      items.push({
        ...data,
        id: d.id,
        agama: data.agama || 'Katolik',
      });
    });
    return items;
  } catch (err) {
    console.warn('[SAPA Firebase] Gagal mengambil data dari Firestore:', err);
    return [];
  }
}

/**
 * Mengosongkan seluruh koleksi warga di Cloud Firestore online
 */
export async function clearAllWargaInFirestore(): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, WARGA_COLLECTION));
    const batch = writeBatch(db);
    snapshot.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
    console.log('[SAPA Firebase] Seluruh data di Database Online berhasil dibersihkan.');
  } catch (err) {
    console.error('[SAPA Firebase] Gagal mengosongkan Firestore:', err);
  }
}

/**
 * Menyimpan banyak data sekaligus (batch migration / re-sync) ke Cloud Firestore
 */
export async function syncBatchToFirestore(wargaList: WargaKatolik[]): Promise<void> {
  if (!wargaList || wargaList.length === 0) return;
  try {
    const batch = writeBatch(db);
    for (const w of wargaList) {
      if (w && w.id) {
        const ref = doc(db, WARGA_COLLECTION, w.id);
        batch.set(ref, cleanForFirestore(w), { merge: true });
      }
    }
    await batch.commit();
    console.log(`[SAPA Firebase] Batch sync berhasil untuk ${wargaList.length} jiwa.`);
  } catch (err) {
    console.error('[SAPA Firebase] Gagal batch sync ke Firestore:', err);
  }
}

/**
 * Mendengarkan pembaruan data secara real-time dari seluruh perangkat
 */
export function subscribeToWargaFirestore(
  onData: (data: WargaKatolik[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const colRef = collection(db, WARGA_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const items: WargaKatolik[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as WargaKatolik;
          items.push({
            ...data,
            id: d.id,
            agama: data.agama || 'Katolik',
          });
        });
        onData(items);
      },
      (error) => {
        console.warn('[SAPA Firebase] Realtime listener error:', error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err: any) {
    console.warn('[SAPA Firebase] Tidak dapat memulai real-time subscription:', err);
    return () => {};
  }
}
