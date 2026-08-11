import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db as firestoreDb } from './firebase';
import { saveDb } from './database';
import type { Database } from 'sql.js';

let isSyncing = false;
let listenersInitialized = false;

// Helper to get actual existing columns in SQLite table
function getTableColumns(sqliteDb: Database, tableName: string): Set<string> {
  try {
    const res = sqliteDb.exec(`PRAGMA table_info(${tableName})`);
    if (res.length && res[0].values) {
      return new Set(res[0].values.map((row) => String(row[1])));
    }
  } catch (e) {
    console.error(`Error getting columns for table ${tableName}:`, e);
  }
  return new Set();
}

// Helper to push a document to Firestore
export async function saveToFirestore(collectionName: string, id: string, data: Record<string, any>) {
  try {
    const docRef = doc(firestoreDb, collectionName, id);
    // Sanitize undefined values for Firestore
    const sanitizedData: Record<string, any> = { id };
    Object.keys(data).forEach((key) => {
      sanitizedData[key] = data[key] === undefined ? null : data[key];
    });
    await setDoc(docRef, sanitizedData, { merge: true });
  } catch (err) {
    console.error(`Error saving to Firestore [${collectionName}/${id}]:`, err);
  }
}

// Helper to delete a document from Firestore
export async function deleteFromFirestore(collectionName: string, id: string) {
  try {
    const docRef = doc(firestoreDb, collectionName, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`Error deleting from Firestore [${collectionName}/${id}]:`, err);
  }
}

// Helper to wipe a collection from Firestore
export async function clearFirestoreCollection(collectionName: string) {
  try {
    const querySnapshot = await getDocs(collection(firestoreDb, collectionName));
    const batch = writeBatch(firestoreDb);
    querySnapshot.forEach((document) => {
      batch.delete(document.ref);
    });
    await batch.commit();
  } catch (err) {
    console.error(`Error clearing Firestore collection [${collectionName}]:`, err);
  }
}

// Helper to wipe all data collections from Firestore
export async function wipeAllFirestoreData() {
  const collections = [
    'kepala_keluarga',
    'anggota_keluarga',
    'inventaris',
    'iuran_kartu_merah',
    'pelayanan_lingkungan',
    'jadwal_kegiatan'
  ];
  for (const c of collections) {
    await clearFirestoreCollection(c);
  }
  const metaRef = doc(firestoreDb, 'app_metadata', 'init_status');
  await setDoc(metaRef, { initialized: true, wiped_at: new Date().toISOString() }, { merge: true });
}

// Sync Firestore -> SQLite
export async function syncFirestoreWithSqlite(sqliteDb: Database, seedFn?: (db: Database) => void): Promise<boolean> {
  if (isSyncing) return false;
  isSyncing = true;

  try {
    // Check if Firestore initialized
    const metaRef = doc(firestoreDb, 'app_metadata', 'init_status');
    const metaSnap = await getDoc(metaRef);

    if (!metaSnap.exists()) {
      // First time running on Firestore -> Seed initial SQLite data into Firestore
      console.log('Seeding initial data from local SQLite to Firestore Cloud...');
      if (seedFn) {
        seedFn(sqliteDb);
        saveDb(sqliteDb);
      }
      await uploadSqliteToFirestore(sqliteDb);
      await setDoc(metaRef, { initialized: true, created_at: new Date().toISOString() });
    } else {
      // Load cloud data from Firestore into SQLite
      console.log('Fetching live cloud data from Firestore...');
      await loadFirestoreIntoSqlite(sqliteDb);
    }

    // Set up real-time snapshot listeners for multi-device live updates
    if (!listenersInitialized) {
      setupSnapshotListeners(sqliteDb);
      listenersInitialized = true;
    }

    isSyncing = false;
    return true;
  } catch (err) {
    console.error('Error syncing Firestore with SQLite:', err);
    isSyncing = false;
    return false;
  }
}

export async function uploadSqliteToFirestore(sqliteDb: Database) {
  const tables = [
    'users',
    'kepala_keluarga',
    'anggota_keluarga',
    'inventaris',
    'iuran_kartu_merah',
    'pelayanan_lingkungan',
    'jadwal_kegiatan'
  ];

  for (const table of tables) {
    try {
      const res = sqliteDb.exec(`SELECT * FROM ${table}`);
      if (!res.length) continue;
      const columns = res[0].columns;
      const values = res[0].values;

      for (const row of values) {
        const docData: Record<string, any> = {};
        columns.forEach((col, idx) => {
          docData[col] = row[idx];
        });

        const docId = docData.id ? String(docData.id) : `doc_${Math.random().toString(36).substring(2)}`;
        await saveToFirestore(table, docId, docData);
      }
    } catch (e) {
      console.error(`Error uploading table ${table} to Firestore:`, e);
    }
  }
}

export async function forcePushLocalToFirestore(sqliteDb: Database): Promise<boolean> {
  try {
    await uploadSqliteToFirestore(sqliteDb);
    const metaRef = doc(firestoreDb, 'app_metadata', 'init_status');
    await setDoc(metaRef, { initialized: true, updated_at: new Date().toISOString() });
    return true;
  } catch (err) {
    console.error('Error force pushing local data to Firestore:', err);
    return false;
  }
}

export async function forcePullFirestoreToLocal(sqliteDb: Database): Promise<boolean> {
  try {
    await loadFirestoreIntoSqlite(sqliteDb);
    return true;
  } catch (err) {
    console.error('Error force pulling Firestore data to local SQLite:', err);
    return false;
  }
}

export async function loadFirestoreIntoSqlite(sqliteDb: Database) {
  const collections = [
    { name: 'users', query: 'SELECT * FROM users' },
    { name: 'kepala_keluarga', query: 'SELECT * FROM kepala_keluarga' },
    { name: 'anggota_keluarga', query: 'SELECT * FROM anggota_keluarga' },
    { name: 'inventaris', query: 'SELECT * FROM inventaris' },
    { name: 'iuran_kartu_merah', query: 'SELECT * FROM iuran_kartu_merah' },
    { name: 'pelayanan_lingkungan', query: 'SELECT * FROM pelayanan_lingkungan' },
    { name: 'jadwal_kegiatan', query: 'SELECT * FROM jadwal_kegiatan' }
  ];

  for (const item of collections) {
    try {
      const querySnapshot = await getDocs(collection(firestoreDb, item.name));
      const validColumns = getTableColumns(sqliteDb, item.name);

      if (!querySnapshot.empty) {
        // Clear local table to match cloud state
        sqliteDb.run(`DELETE FROM ${item.name}`);

        querySnapshot.forEach((docSnap) => {
          const rawData = docSnap.data();
          const docId = docSnap.id;
          const data = { id: docId, ...rawData };

          const validKeys = Object.keys(data).filter((k) => validColumns.has(k));
          if (validKeys.length === 0) return;

          const placeholders = validKeys.map(() => '?').join(', ');
          const sql = `INSERT OR REPLACE INTO ${item.name} (${validKeys.join(', ')}) VALUES (${placeholders})`;
          const values = validKeys.map((k) => (data[k] === null || data[k] === undefined ? '' : data[k]));

          try {
            sqliteDb.run(sql, values);
          } catch (insertErr) {
            console.warn(`Error inserting doc ${docId} into ${item.name}:`, insertErr);
          }
        });
      }
    } catch (e) {
      console.error(`Error loading collection ${item.name} from Firestore:`, e);
    }
  }

  saveDb(sqliteDb);
  // Trigger global update event so React components re-render with fresh data
  window.dispatchEvent(new CustomEvent('sapa-db-updated'));
}

function setupSnapshotListeners(sqliteDb: Database) {
  const collections = [
    'users',
    'kepala_keluarga',
    'anggota_keluarga',
    'inventaris',
    'iuran_kartu_merah',
    'pelayanan_lingkungan',
    'jadwal_kegiatan'
  ];

  collections.forEach((colName) => {
    onSnapshot(collection(firestoreDb, colName), (snapshot) => {
      // Ignore writes that originated locally on this client
      if (snapshot.metadata.hasPendingWrites) return;

      let hasChanges = false;
      const validColumns = getTableColumns(sqliteDb, colName);

      snapshot.docChanges().forEach((change) => {
        const rawData = change.doc.data();
        const docId = change.doc.id;
        const data = { id: docId, ...rawData };

        if (change.type === 'removed') {
          try {
            sqliteDb.run(`DELETE FROM ${colName} WHERE id = ?`, [docId]);
            hasChanges = true;
          } catch (e) {
            console.error(`Error deleting from ${colName}/${docId}:`, e);
          }
        } else if (change.type === 'added' || change.type === 'modified') {
          const validKeys = Object.keys(data).filter((k) => validColumns.has(k));
          if (validKeys.length === 0) return;

          const placeholders = validKeys.map(() => '?').join(', ');
          const sql = `INSERT OR REPLACE INTO ${colName} (${validKeys.join(', ')}) VALUES (${placeholders})`;
          const values = validKeys.map((k) => (data[k] === null || data[k] === undefined ? '' : data[k]));

          try {
            sqliteDb.run(sql, values);
            hasChanges = true;
          } catch (e) {
            console.error(`Error updating ${colName}/${docId}:`, e);
          }
        }
      });

      if (hasChanges) {
        saveDb(sqliteDb);
        // Dispatch event so UI updates live on HP / Laptop
        window.dispatchEvent(new CustomEvent('sapa-db-updated'));
      }
    });
  });
}
