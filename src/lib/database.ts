import initSqlJs, { Database } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { generateNIK } from './helpers';
import {
  saveToFirestore,
  deleteFromFirestore,
  clearFirestoreCollection,
  wipeAllFirestoreData,
  syncFirestoreWithSqlite,
  forcePushLocalToFirestore,
  forcePullFirestoreToLocal
} from './firestoreSync';
import {
  UserAccount,
  KepalaKeluarga,
  AnggotaKeluarga,
  Inventaris,
  IuranKartuMerah,
  PelayananLingkungan,
  JadwalKegiatan,
  LIST_16_WILAYAH
} from '../types';

const DB_LOCAL_STORAGE_KEY = 'SAPA_ST_MARIA_MAGDALENA_SQLITE_DB';

let dbInstance: Database | null = null;

// Initialize SQLite database
export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  let SQL;
  try {
    SQL = await initSqlJs({
      locateFile: () => sqlWasmUrl
    });
  } catch (err) {
    console.warn('Default sql.js locateFile failed, trying wasmBinary ArrayBuffer fallback...', err);
    try {
      const res = await fetch(sqlWasmUrl);
      const wasmBinary = await res.arrayBuffer();
      SQL = await initSqlJs({ wasmBinary });
    } catch (fallbackErr) {
      console.error('Failed to load WASM binary:', fallbackErr);
      throw fallbackErr;
    }
  }

  const savedDbStr = localStorage.getItem(DB_LOCAL_STORAGE_KEY);
  if (savedDbStr) {
    try {
      const uInt8Array = new Uint8Array(JSON.parse(savedDbStr));
      dbInstance = new SQL.Database(uInt8Array);
      try {
        dbInstance.run("UPDATE anggota_keluarga SET nik = REPLACE(nik, '-', '') WHERE nik LIKE '%-%'");
        dbInstance.run("UPDATE anggota_keluarga SET nik = SUBSTR(nik, 1, 14) || SUBSTR(nik, LENGTH(nik)-1, 2) WHERE LENGTH(nik) > 16");
        try {
          dbInstance.run("ALTER TABLE anggota_keluarga ADD COLUMN status_perkawinan TEXT");
        } catch (e) {
          // Column already exists
        }
        try {
          dbInstance.run("ALTER TABLE inventaris ADD COLUMN satuan TEXT");
        } catch (e) {
          // Column already exists
        }
        saveDb(dbInstance);
      } catch (e) {
        // Table might not exist yet if corrupt, ignored
      }
      console.log('Loaded SQLite database from storage successfully.');
    } catch (e) {
      console.error('Failed to restore database from storage, initializing fresh DB.', e);
    }
  }

  if (!dbInstance) {
    // Create new SQLite database if not exists
    dbInstance = new SQL.Database();
    initializeTables(dbInstance);
    seedInitialData(dbInstance);
    saveDb(dbInstance);
  }

  // Trigger real-time background sync with Firebase Cloud Firestore
  syncFirestoreWithSqlite(dbInstance, seedInitialData).catch((err) => {
    console.error('Firestore sync error:', err);
  });

  return dbInstance;
}

export function saveDb(db: Database = dbInstance!): void {
  if (!db) return;
  try {
    const binaryArray = db.export();
    const arrayBuffer = Array.from(binaryArray);
    localStorage.setItem(DB_LOCAL_STORAGE_KEY, JSON.stringify(arrayBuffer));
  } catch (err) {
    console.error('Error saving SQLite database to LocalStorage:', err);
  }
}

function initializeTables(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      nama_lengkap TEXT NOT NULL,
      no_kk TEXT
    );

    CREATE TABLE IF NOT EXISTS kepala_keluarga (
      id TEXT PRIMARY KEY,
      no_kk TEXT UNIQUE NOT NULL,
      nama_kepala_keluarga TEXT NOT NULL,
      alamat TEXT NOT NULL,
      rt TEXT NOT NULL,
      rw TEXT NOT NULL,
      wilayah TEXT NOT NULL,
      status_warga TEXT NOT NULL,
      agama_kk TEXT NOT NULL,
      kartu_biru_json TEXT,
      kartu_merah_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      created_by_user TEXT
    );

    CREATE TABLE IF NOT EXISTS anggota_keluarga (
      id TEXT PRIMARY KEY,
      id_keluarga TEXT NOT NULL,
      no_kk TEXT NOT NULL,
      nik TEXT NOT NULL,
      nama_lengkap TEXT NOT NULL,
      nama_panggilan TEXT,
      jenis_kelamin TEXT NOT NULL,
      tempat_lahir TEXT NOT NULL,
      tanggal_lahir TEXT NOT NULL,
      golongan_darah TEXT NOT NULL,
      hub_keluarga TEXT NOT NULL,
      no_hp TEXT,
      pendidikan_terakhir TEXT NOT NULL,
      masih_sekolah INTEGER NOT NULL,
      nama_sekolah TEXT,
      alamat_sekolah TEXT,
      pekerjaan TEXT NOT NULL,
      nama_perusahaan TEXT,
      alamat_perusahaan TEXT,
      agama TEXT NOT NULL,
      baptis_json TEXT,
      komuni_json TEXT,
      krisma_json TEXT,
      perkawinan_json TEXT,
      status_perkawinan TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (id_keluarga) REFERENCES kepala_keluarga(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS inventaris (
      id TEXT PRIMARY KEY,
      no_urut INTEGER NOT NULL,
      nama_barang TEXT NOT NULL,
      jumlah INTEGER NOT NULL,
      satuan TEXT,
      tempat_penyimpanan TEXT NOT NULL,
      kondisi TEXT NOT NULL,
      keterangan TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS iuran_kartu_merah (
      id TEXT PRIMARY KEY,
      no_kk TEXT NOT NULL,
      nama_kk TEXT NOT NULL,
      tanggal_bayar TEXT NOT NULL,
      hari TEXT NOT NULL,
      bulan TEXT NOT NULL,
      tahun TEXT NOT NULL,
      jumlah_iuran REAL NOT NULL,
      jenis_iuran TEXT NOT NULL,
      catatan TEXT,
      diinput_oleh TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pelayanan_lingkungan (
      id TEXT PRIMARY KEY,
      kategori TEXT NOT NULL,
      nama_petugas TEXT NOT NULL,
      jabatan_tugas TEXT NOT NULL,
      no_hp TEXT,
      periode TEXT,
      keterangan TEXT
    );

    CREATE TABLE IF NOT EXISTS jadwal_kegiatan (
      id TEXT PRIMARY KEY,
      judul_kegiatan TEXT NOT NULL,
      kategori TEXT NOT NULL,
      tanggal TEXT NOT NULL,
      waktu TEXT NOT NULL,
      lokasi TEXT NOT NULL,
      keterangan TEXT,
      foto_base64 TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

function seedInitialData(db: Database) {
  const now = new Date().toISOString();

  // 1. Seed Users
  db.run(`INSERT INTO users VALUES ('u1', 'warga', 'sapa123', 'warga', 'Warga Lingkungan St. Maria Magdalena', '3506012023000001')`);
  db.run(`INSERT INTO users VALUES ('u2', 'pengurus', 'sapa123', 'pengurus', 'Pengurus Lingkungan St. Maria Magdalena', '')`);

  // 2. Seed Initial KK
  const kk1Id = 'kk-001';
  const kk1No = '3506012023000001';
  db.run(`
    INSERT INTO kepala_keluarga VALUES (
      '${kk1Id}',
      '${kk1No}',
      'YOHANES BAPTISTA SUGENG RIYADI',
      'Jl. Veteran No. 45, Kediri',
      '002',
      '005',
      'Wilayah Timur St. Maria Magdalena',
      'Aktif',
      'Katolik',
      '${JSON.stringify({ memiliki: true, no_kartu: 'KB-PAROKI-1029' })}',
      '${JSON.stringify({ memiliki: true, no_kartu: 'KM-MM-001' })}',
      '${now}',
      '${now}',
      'warga'
    )
  `);

  const kk2Id = 'kk-002';
  const kk2No = '3506012023000002';
  db.run(`
    INSERT INTO kepala_keluarga VALUES (
      '${kk2Id}',
      '${kk2No}',
      'ANTONIUS BAMBANG SETIAWAN',
      'Jl. Pemuda No. 12, Kediri',
      '001',
      '005',
      'Wilayah Timur St. Maria Magdalena',
      'Aktif',
      'Katolik',
      '${JSON.stringify({ memiliki: true, no_kartu: 'KB-PAROKI-1030' })}',
      '${JSON.stringify({ memiliki: true, no_kartu: 'KM-MM-002' })}',
      '${now}',
      '${now}',
      'pengurus'
    )
  `);

  const kk3Id = 'kk-003';
  const kk3No = '3506012023840005';
  db.run(`
    INSERT INTO kepala_keluarga VALUES (
      '${kk3Id}',
      '${kk3No}',
      'PETRUS AGUS SURYONO',
      'Jl. Hayam Wuruk No. 88, Kediri',
      '003',
      '005',
      'Wilayah Barat St. Maria Magdalena',
      'Aktif',
      'Katolik',
      '${JSON.stringify({ memiliki: true, no_kartu: 'KB-PAROKI-1031' })}',
      '${JSON.stringify({ memiliki: true, no_kartu: 'KM-MM-003' })}',
      '${now}',
      '${now}',
      'warga'
    )
  `);

  // 3. Seed Anggota Keluarga for KK1
  db.run(`
    INSERT INTO anggota_keluarga VALUES (
      'ak-001',
      '${kk1Id}',
      '${kk1No}',
      '${generateNIK(kk1No, 1)}',
      'YOHANES BAPTISTA SUGENG RIYADI',
      'SUGENG',
      'Laki-laki',
      'Kediri',
      '1975-08-17',
      'O',
      'Kepala Keluarga',
      '081234567890',
      'S1 / Sarjana',
      0,
      '',
      '',
      'PNS / Aparat Sipil',
      'Dinas Pendidikan Kediri',
      'Jl. Mayor Bismo No. 8',
      'Katolik',
      '${JSON.stringify({ nama_baptis: 'Yohanes Baptista', no_surat_baptis: 'BAP/1975/08/112', tgl_baptis: '1975-09-10', tempat_baptis: 'Gereja St. Vincentius a Paulo Kediri' })}',
      '${JSON.stringify({ no_surat_komper: 'KOM/1985/04/045', tgl_komuni_pertama: '1985-05-12', tempat_komuni_pertama: 'Paroki St. Vincentius a Paulo Kediri' })}',
      '${JSON.stringify({ nama_krisma: 'Yohanes', no_surat_krisma: 'KRI/1991/06/078', tgl_krisma: '1991-06-20', tempat_krisma: 'Katedral Surabaya' })}',
      '${JSON.stringify({ no_surat_perkawinan: 'KAW/2001/09/012', tgl_perkawinan: '2001-09-15', tempat_perkawinan: 'Gereja St. Vincentius a Paulo Kediri', is_dispensasi: false })}',
      '${now}',
      '${now}'
    )
  `);

  db.run(`
    INSERT INTO anggota_keluarga VALUES (
      'ak-002',
      '${kk1Id}',
      '${kk1No}',
      '${generateNIK(kk1No, 2)}',
      'MARIA THERESIA SRI WAHYUNI',
      'SRI',
      'Perempuan',
      'Kediri',
      '1978-05-20',
      'A',
      'Istri',
      '081398765432',
      'S1 / Sarjana',
      0,
      '',
      '',
      'Guru',
      'SDK St. Maria Kediri',
      'Jl. Dhoho No. 22',
      'Katolik',
      '${JSON.stringify({ nama_baptis: 'Maria Theresia', no_surat_baptis: 'BAP/1978/06/201', tgl_baptis: '1978-06-15', tempat_baptis: 'Gereja St. Vincentius a Paulo Kediri' })}',
      '${JSON.stringify({ no_surat_komper: 'KOM/1988/05/110', tgl_komuni_pertama: '1988-06-01', tempat_komuni_pertama: 'Paroki St. Vincentius a Paulo Kediri' })}',
      '${JSON.stringify({ nama_krisma: 'Theresia', no_surat_krisma: 'KRI/1994/08/102', tgl_krisma: '1994-08-15', tempat_krisma: 'Gereja St. Vincentius a Paulo Kediri' })}',
      '${JSON.stringify({ no_surat_perkawinan: 'KAW/2001/09/012', tgl_perkawinan: '2001-09-15', tempat_perkawinan: 'Gereja St. Vincentius a Paulo Kediri' })}',
      '${now}',
      '${now}'
    )
  `);

  db.run(`
    INSERT INTO anggota_keluarga VALUES (
      'ak-003',
      '${kk1Id}',
      '${kk1No}',
      '${generateNIK(kk1No, 3)}',
      'FRANSISKUS XAVERIUS KEVIN RIYADI',
      'KEVIN',
      'Laki-laki',
      'Kediri',
      '2005-12-03',
      'O',
      'Anak',
      '081511223344',
      'SMA / Sederajat',
      1,
      'SMA Katolik St. Augustinus',
      'Jl. Veteran Kediri',
      'Pelajar / Mahasiswa',
      '',
      '',
      'Katolik',
      '${JSON.stringify({ nama_baptis: 'Fransiskus Xaverius', no_surat_baptis: 'BAP/2006/01/008', tgl_baptis: '2006-01-14', tempat_baptis: 'Gereja St. Vincentius a Paulo Kediri' })}',
      '${JSON.stringify({ no_surat_komper: 'KOM/2015/05/033', tgl_komuni_pertama: '2015-05-24', tempat_komuni_pertama: 'Paroki St. Vincentius a Paulo Kediri' })}',
      '${JSON.stringify({ nama_krisma: 'Fransiskus', no_surat_krisma: 'KRI/2021/10/041', tgl_krisma: '2021-10-10', tempat_krisma: 'Gereja St. Vincentius a Paulo Kediri' })}',
      '{}',
      '${now}',
      '${now}'
    )
  `);

  // 4. Seed Inventaris
  const inventarisItems = [
    [1, 'Sound System Portable Wireless & Mic', 2, 'Set', 'Gudang Sekretariat Lingkungan', 'Baik', 'Aman dipakai ibadat lingkungan'],
    [2, 'Kursi Lipat Chitose', 40, 'Buah', 'Rumah Ketua Lingkungan', 'Baik', 'Lengkap dengan stiker nama lingkungan'],
    [3, 'Meja Altar Portabel Lingkungan', 1, 'Unit', 'Rumah Pengurus Liturgi', 'Baik', 'Kain taplak warna putih & hijau lengkap'],
    [4, 'Buku Puji Syukur & Madah Bakti', 30, 'Buah', 'Sekretariat Lingkungan', 'Baik', 'Gereja St. Vincentius'],
    [5, 'Tenda Pelindung 3x6m', 1, 'Unit', 'Gudang RT 02', 'Rusak Ringan', 'Perlu sedikit perbaikan di tiang kanan'],
    [6, 'Lilin Altar & Tempat Lilin Kuningan', 4, 'Set', 'Rumah Seksi Liturgi', 'Baik', 'Siap digunakan untuk Misa Wilayah']
  ];

  inventarisItems.forEach(([no, nama, jml, sat, tempat, kond, ket]) => {
    db.run(`INSERT INTO inventaris VALUES ('inv-${no}', ${no}, '${nama}', ${jml}, '${sat}', '${tempat}', '${kond}', '${ket}', '${now}')`);
  });

  // 5. Seed Iuran Kartu Merah
  db.run(`
    INSERT INTO iuran_kartu_merah VALUES (
      'iuran-1',
      '${kk1No}',
      'YOHANES BAPTISTA SUGENG RIYADI',
      '2026-01-10',
      'Sabtu',
      'Januari',
      '2026',
      50000,
      'Kas Lingkungan',
      'Lunas Iuran Bulanan Januari 2026',
      'Bendahara Lingkungan',
      '${now}'
    )
  `);
  db.run(`
    INSERT INTO iuran_kartu_merah VALUES (
      'iuran-2',
      '${kk1No}',
      'YOHANES BAPTISTA SUGENG RIYADI',
      '2026-02-05',
      'Kamis',
      'Februari',
      '2026',
      50000,
      'Kas Lingkungan',
      'Lunas Iuran Bulanan Februari 2026',
      'Bendahara Lingkungan',
      '${now}'
    )
  `);

  // 6. Seed Pelayanan Lingkungan
  const pelayananData = [
    ['Seksi Liturgi', 'Agnes Dwi Astuti', 'Koordinator Liturgi & Nyanyian', '081234998877'],
    ['Asisten Imam', 'Yohanes Baptista Sugeng', 'Prodiakon Wilayah Timur', '081234567890'],
    ['Misdinar', 'Kevin Riyadi & Tim', 'Pendamping Misdinar Lingkungan', '081511223344'],
    ['Ketua Lingkungan', 'Antonius Bambang Setiawan', 'Ketua Lingkungan St. Maria Magdalena', '081122334455'],
    ['Sekretaris', 'Maria Lucia Heni', 'Sekretaris & Administrasi SAPA', '081334455667'],
    ['Bendahara', 'Catharina Tri Mulyani', 'Bendahara Kas & Kartu Merah', '081556677889']
  ];

  pelayananData.forEach(([kat, nama, jab, hp], idx) => {
    db.run(`INSERT INTO pelayanan_lingkungan VALUES ('pel-${idx + 1}', '${kat}', '${nama}', '${jab}', '${hp}', '2024-2027', 'Aktif melayani')`);
  });

  // 7. Seed Jadwal Kegiatan & Warta Paroki/Lingkungan
  const sampleFlyer1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23d97706"/><stop offset="50%" stop-color="%23ea580c"/><stop offset="100%" stop-color="%23be123c"/></linearGradient></defs><rect width="800" height="400" fill="url(%23g)" rx="16"/><circle cx="700" cy="80" r="120" fill="%23ffffff" opacity="0.1"/><circle cx="100" cy="320" r="140" fill="%23ffffff" opacity="0.1"/><text x="400" y="140" font-family="sans-serif" font-size="32" font-weight="900" fill="%23ffffff" text-anchor="middle">WARTA PAROKI %26 LINGKUNGAN</text><text x="400" y="190" font-family="sans-serif" font-size="22" font-weight="bold" fill="%23fef3c7" text-anchor="middle">PESTA PELINDUNG ST. MARIA MAGDALENA 2026</text><rect x="250" y="230" width="300" height="2" fill="%23ffffff" opacity="0.5"/><text x="400" y="270" font-family="sans-serif" font-size="16" fill="%23ffffff" text-anchor="middle">Sabtu, 22 Agustus 2026 • 17:00 WIB</text><text x="400" y="300" font-family="sans-serif" font-size="15" fill="%23fed7aa" text-anchor="middle">Gereja St. Vincentius a Paulo Kediri</text></svg>`;

  const sampleFlyer2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%232563eb"/><stop offset="100%" stop-color="%234f46e5"/></linearGradient></defs><rect width="800" height="400" fill="url(%23g2)" rx="16"/><text x="400" y="150" font-family="sans-serif" font-size="30" font-weight="900" fill="%23ffffff" text-anchor="middle">PENDAFTARAN SAKRAMEN KRISMA 2026</text><text x="400" y="200" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23bfdbfe" text-anchor="middle">PAROKI ST. VINCENTIUS A PAULO KEDIRI</text><rect x="200" y="235" width="400" height="2" fill="%23ffffff" opacity="0.4"/><text x="400" y="280" font-family="sans-serif" font-size="16" fill="%23ffffff" text-anchor="middle">Buka Pendaftaran Umat Lingkungan</text><text x="400" y="310" font-family="sans-serif" font-size="14" fill="%23dbeafe" text-anchor="middle">Syarat: Fotokopi Surat Baptis %26 Kartu Keluarga Paroki</text></svg>`;

  db.run(`
    INSERT INTO jadwal_kegiatan VALUES (
      'jg-1',
      'Warta Paroki: Syukuran Pesta Pelindung St. Maria Magdalena & Misa Wilayah',
      'Warta Paroki & Lingkungan',
      '2026-08-22',
      '17:00 WIB - Selesai',
      'Gereja St. Vincentius a Paulo Kediri',
      'Diumumkan kepada seluruh umat Lingkungan St. Maria Magdalena bahwa Misa Kudus Syukuran Pesta Pelindung akan dilaksanakan secara konselebrasi wilayah. Umat diimbau hadir bersama keluarga mengenakan pakaian bebas rapi/batik. Bawa Buku Puji Syukur.',
      '${sampleFlyer1}',
      '${now}'
    )
  `);

  db.run(`
    INSERT INTO jadwal_kegiatan VALUES (
      'jg-2',
      'Pengumuman: Pendaftaran Sakramen Krisma & Komuni Pertama Tahun 2026',
      'Pengumuman / Flyer Warga',
      '2026-08-15',
      'Bada Misa / Setiap Jam Kerja',
      'Sekretariat Paroki & Pengurus Lingkungan',
      'Bagi putra-putri umat yang telah memenuhi syarat usia untuk penerimaan Sakramen Komuni Pertama (minimal kelas 4 SD) dan Sakramen Krisma (minimal kelas 8 SMP/SMA), formulir pendaftaran dapat diambil melalui Sekretaris Lingkungan atau Sekretariat Paroki.',
      '${sampleFlyer2}',
      '${now}'
    )
  `);

  db.run(`
    INSERT INTO jadwal_kegiatan VALUES (
      'jg-3',
      'Doa Rosario & Ibadat Lingkungan Rutin Pekan Ini',
      'Doa Lingkungan',
      '2026-08-12',
      '18:30 WIB',
      'Rumah Bpk. Yohanes Sugeng (RT 02 / RW 05)',
      'Mohon kehadiran seluruh umat keluarga Lingkungan St. Maria Magdalena. Tuan rumah menyediakan tempat dan konsumsi ringan, umat mohon membawa Buku Puji Syukur & Rosario masing-masing.',
      '',
      '${now}'
    )
  `);
}

/* =========================================================================
   DATABASE ACCESS API FUNCTIONS (SQL QUERIES)
   ========================================================================= */

// USER AUTHENTICATION & PASSWORDS
export async function authenticateUser(username: string): Promise<UserAccount | null> {
  const db = await getDb();
  const stmt = db.prepare(`SELECT * FROM users WHERE LOWER(username) = LOWER(:u)`);
  stmt.bind({ ':u': username.trim() });
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return {
      id: row.id as string,
      username: row.username as string,
      passwordHash: row.password_hash as string,
      role: row.role as 'warga' | 'pengurus',
      namaLengkap: row.nama_lengkap as string,
      noKK: row.no_kk as string
    };
  }
  stmt.free();
  return null;
}

export async function updateUserPassword(username: string, newPassword: string): Promise<boolean> {
  const db = await getDb();
  db.run(`UPDATE users SET password_hash = ? WHERE LOWER(username) = LOWER(?)`, [newPassword, username.trim()]);
  saveDb(db);
  
  const user = await authenticateUser(username);
  if (user) {
    await saveToFirestore('users', user.id, {
      id: user.id,
      username: user.username,
      password_hash: newPassword,
      role: user.role,
      nama_lengkap: user.namaLengkap,
      no_kk: user.noKK || ''
    });
  }
  return true;
}

export async function getAllUsers(): Promise<UserAccount[]> {
  const db = await getDb();
  const res = db.exec(`SELECT * FROM users ORDER BY username ASC`);
  if (!res.length) return [];
  return res[0].values.map((r) => ({
    id: r[0] as string,
    username: r[1] as string,
    passwordHash: r[2] as string,
    role: r[3] as 'warga' | 'pengurus',
    namaLengkap: r[4] as string,
    noKK: r[5] as string
  }));
}

// KEPALA KELUARGA (KK) CRUD
export async function getKepalaKeluargaList(filterWilayah?: string, filterStatus?: string): Promise<KepalaKeluarga[]> {
  const db = await getDb();
  let query = `SELECT * FROM kepala_keluarga WHERE 1=1`;
  const params: any[] = [];

  if (filterWilayah && filterWilayah !== 'Semua Wilayah') {
    query += ` AND wilayah = ?`;
    params.push(filterWilayah);
  }
  if (filterStatus && filterStatus !== 'Semua Status') {
    query += ` AND status_warga = ?`;
    params.push(filterStatus);
  }

  query += ` ORDER BY nama_kepala_keluarga ASC`;

  const stmt = db.prepare(query);
  stmt.bind(params);

  const list: KepalaKeluarga[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    list.push({
      id: row.id as string,
      no_kk: row.no_kk as string,
      nama_kepala_keluarga: row.nama_kepala_keluarga as string,
      alamat: row.alamat as string,
      rt: row.rt as string,
      rw: row.rw as string,
      wilayah: row.wilayah as string,
      status_warga: row.status_warga as any,
      agama_kk: row.agama_kk as string,
      kartu_biru_paroki: row.kartu_biru_json ? JSON.parse(row.kartu_biru_json as string) : { memiliki: false },
      kartu_merah_lingkungan: row.kartu_merah_json ? JSON.parse(row.kartu_merah_json as string) : { memiliki: false },
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      created_by_user: row.created_by_user as string
    });
  }
  stmt.free();
  return list;
}

export async function searchKepalaKeluargaByCitizen(searchTerm: string): Promise<KepalaKeluarga[]> {
  const db = await getDb();
  const clean = searchTerm.trim();
  if (!clean) return [];

  const cleanDigits = clean.replace(/\D/g, '');
  const termUpper = `%${clean.toUpperCase()}%`;
  const termExact = `%${clean}%`;

  const query = `
    SELECT DISTINCT k.* 
    FROM kepala_keluarga k
    LEFT JOIN anggota_keluarga a ON k.id = a.id_keluarga OR k.no_kk = a.no_kk
    WHERE 
      UPPER(k.nama_kepala_keluarga) LIKE ?
      OR k.no_kk LIKE ?
      OR UPPER(k.alamat) LIKE ?
      OR UPPER(a.nama_lengkap) LIKE ?
      OR UPPER(a.nama_panggilan) LIKE ?
      OR a.nik LIKE ?
      OR a.no_kk LIKE ?
    ORDER BY k.nama_kepala_keluarga ASC
  `;

  const stmt = db.prepare(query);
  stmt.bind([
    termUpper,
    termExact,
    termUpper,
    termUpper,
    termUpper,
    termExact,
    termExact
  ]);

  const list: KepalaKeluarga[] = [];
  const seenIds = new Set<string>();

  while (stmt.step()) {
    const row = stmt.getAsObject();
    const id = row.id as string;
    if (!seenIds.has(id)) {
      seenIds.add(id);
      list.push({
        id,
        no_kk: row.no_kk as string,
        nama_kepala_keluarga: row.nama_kepala_keluarga as string,
        alamat: row.alamat as string,
        rt: row.rt as string,
        rw: row.rw as string,
        wilayah: row.wilayah as string,
        status_warga: row.status_warga as any,
        agama_kk: row.agama_kk as string,
        kartu_biru_paroki: row.kartu_biru_json ? JSON.parse(row.kartu_biru_json as string) : { memiliki: false },
        kartu_merah_lingkungan: row.kartu_merah_json ? JSON.parse(row.kartu_merah_json as string) : { memiliki: false },
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
        created_by_user: row.created_by_user as string
      });
    }
  }
  stmt.free();

  // If no direct matches and cleanDigits has at least 3 digits (e.g. 840005)
  if (list.length === 0 && cleanDigits.length >= 3) {
    const digitPattern = `%${cleanDigits}%`;
    const fallbackQuery = `
      SELECT DISTINCT k.*
      FROM kepala_keluarga k
      LEFT JOIN anggota_keluarga a ON k.id = a.id_keluarga OR k.no_kk = a.no_kk
      WHERE k.no_kk LIKE ? OR a.nik LIKE ? OR a.no_kk LIKE ?
      ORDER BY k.nama_kepala_keluarga ASC
    `;
    const fStmt = db.prepare(fallbackQuery);
    fStmt.bind([digitPattern, digitPattern, digitPattern]);
    while (fStmt.step()) {
      const row = fStmt.getAsObject();
      const id = row.id as string;
      if (!seenIds.has(id)) {
        seenIds.add(id);
        list.push({
          id,
          no_kk: row.no_kk as string,
          nama_kepala_keluarga: row.nama_kepala_keluarga as string,
          alamat: row.alamat as string,
          rt: row.rt as string,
          rw: row.rw as string,
          wilayah: row.wilayah as string,
          status_warga: row.status_warga as any,
          agama_kk: row.agama_kk as string,
          kartu_biru_paroki: row.kartu_biru_json ? JSON.parse(row.kartu_biru_json as string) : { memiliki: false },
          kartu_merah_lingkungan: row.kartu_merah_json ? JSON.parse(row.kartu_merah_json as string) : { memiliki: false },
          created_at: row.created_at as string,
          updated_at: row.updated_at as string,
          created_by_user: row.created_by_user as string
        });
      }
    }
    fStmt.free();
  }

  return list;
}

export async function getDashboardStats(): Promise<{
  totalKK: number;
  totalWarga: number;
  totalKartuMerah: number;
  totalKartuBiru: number;
  totalInventaris: number;
  totalUnitInventaris: number;
  inventarisBaikCount: number;
  inventarisRusakCount: number;
}> {
  const db = await getDb();

  // 1. Total KK
  const resKK = db.exec(`SELECT COUNT(*) FROM kepala_keluarga`);
  const totalKK = resKK.length > 0 ? Number(resKK[0].values[0][0]) : 0;

  // 2. Total Warga (Anggota Keluarga)
  const resAK = db.exec(`SELECT COUNT(*) FROM anggota_keluarga`);
  const totalWarga = resAK.length > 0 ? Number(resAK[0].values[0][0]) : 0;

  // 3. Kartu Merah & Kartu Biru
  const allKKs = await getKepalaKeluargaList();
  const totalKartuMerah = allKKs.filter((k) => k.kartu_merah_lingkungan?.memiliki).length;
  const totalKartuBiru = allKKs.filter((k) => k.kartu_biru_paroki?.memiliki).length;

  // 4. Inventaris Stats
  const resInv = db.exec(`SELECT COUNT(*), SUM(jumlah) FROM inventaris`);
  const totalInventaris = resInv.length > 0 && resInv[0].values[0][0] ? Number(resInv[0].values[0][0]) : 0;
  const totalUnitInventaris = resInv.length > 0 && resInv[0].values[0][1] ? Number(resInv[0].values[0][1]) : 0;

  const resBaik = db.exec(`SELECT COUNT(*) FROM inventaris WHERE kondisi = 'Baik'`);
  const inventarisBaikCount = resBaik.length > 0 ? Number(resBaik[0].values[0][0]) : 0;

  const resRusak = db.exec(`SELECT COUNT(*) FROM inventaris WHERE kondisi LIKE '%Rusak%'`);
  const inventarisRusakCount = resRusak.length > 0 ? Number(resRusak[0].values[0][0]) : 0;

  return {
    totalKK,
    totalWarga,
    totalKartuMerah,
    totalKartuBiru,
    totalInventaris,
    totalUnitInventaris,
    inventarisBaikCount,
    inventarisRusakCount
  };
}

export async function saveKepalaKeluarga(kk: Partial<KepalaKeluarga>, createdBy: string): Promise<KepalaKeluarga> {
  const db = await getDb();
  const now = new Date().toISOString();
  const isEdit = !!kk.id;
  const id = kk.id || `kk-${Date.now()}`;
  const no_kk = kk.no_kk?.trim() || '';
  const nama_kepala_keluarga = (kk.nama_kepala_keluarga || '').toUpperCase().trim();
  const alamat = kk.alamat?.trim() || '';
  const rt = kk.rt?.trim() || '001';
  const rw = kk.rw?.trim() || '001';
  const wilayah = kk.wilayah || LIST_16_WILAYAH[0];
  const status_warga = kk.status_warga || 'Aktif';
  const agama_kk = kk.agama_kk || 'Katolik';
  const kartu_biru_json = JSON.stringify(kk.kartu_biru_paroki || { memiliki: false });
  const kartu_merah_json = JSON.stringify(kk.kartu_merah_lingkungan || { memiliki: false });

  if (isEdit) {
    db.run(
      `UPDATE kepala_keluarga SET 
        no_kk = ?,
        nama_kepala_keluarga = ?,
        alamat = ?,
        rt = ?,
        rw = ?,
        wilayah = ?,
        status_warga = ?,
        agama_kk = ?,
        kartu_biru_json = ?,
        kartu_merah_json = ?,
        updated_at = ?
       WHERE id = ?`,
      [no_kk, nama_kepala_keluarga, alamat, rt, rw, wilayah, status_warga, agama_kk, kartu_biru_json, kartu_merah_json, now, id]
    );
  } else {
    db.run(
      `INSERT INTO kepala_keluarga VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, no_kk, nama_kepala_keluarga, alamat, rt, rw, wilayah, status_warga, agama_kk, kartu_biru_json, kartu_merah_json, now, now, createdBy]
    );
  }

  saveDb(db);
  await saveToFirestore('kepala_keluarga', id, {
    id,
    no_kk,
    nama_kepala_keluarga,
    alamat,
    rt,
    rw,
    wilayah,
    status_warga,
    agama_kk,
    kartu_biru_json,
    kartu_merah_json,
    created_at: kk.created_at || now,
    updated_at: now,
    created_by_user: createdBy
  });

  window.dispatchEvent(new CustomEvent('sapa-db-updated'));

  return {
    id,
    no_kk,
    nama_kepala_keluarga,
    alamat,
    rt,
    rw,
    wilayah,
    status_warga,
    agama_kk,
    kartu_biru_paroki: kk.kartu_biru_paroki,
    kartu_merah_lingkungan: kk.kartu_merah_lingkungan,
    created_at: now,
    updated_at: now,
    created_by_user: createdBy
  };
}

// CASCADING DELETE KEPALA KELUARGA & ALL FAMILY MEMBERS & IURAN
export async function deleteKepalaKeluargaCascading(idKK: string, noKK: string): Promise<boolean> {
  const db = await getDb();
  
  // Get associated Anggota Keluarga IDs to delete from Firestore
  const members = await getAnggotaKeluargaByKK(idKK, noKK);
  for (const m of members) {
    await deleteFromFirestore('anggota_keluarga', m.id);
  }
  const iurans = await getIuranList(noKK);
  for (const i of iurans) {
    await deleteFromFirestore('iuran_kartu_merah', i.id);
  }
  await deleteFromFirestore('kepala_keluarga', idKK);

  // 1. Delete all Anggota Keluarga
  db.run(`DELETE FROM anggota_keluarga WHERE id_keluarga = ? OR no_kk = ?`, [idKK, noKK]);
  // 2. Delete all Iuran records
  db.run(`DELETE FROM iuran_kartu_merah WHERE no_kk = ?`, [noKK]);
  // 3. Delete KK
  db.run(`DELETE FROM kepala_keluarga WHERE id = ? OR no_kk = ?`, [idKK, noKK]);

  saveDb(db);
  window.dispatchEvent(new CustomEvent('sapa-db-updated'));
  return true;
}

// ANGGOTA KELUARGA CRUD
export async function getAnggotaKeluargaByKK(idKK: string, noKK?: string): Promise<AnggotaKeluarga[]> {
  const db = await getDb();
  const query = `SELECT * FROM anggota_keluarga WHERE id_keluarga = ? OR no_kk = ? ORDER BY NIK ASC`;
  const stmt = db.prepare(query);
  stmt.bind([idKK, noKK || '']);

  const list: AnggotaKeluarga[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    list.push({
      id: row.id as string,
      id_keluarga: row.id_keluarga as string,
      no_kk: row.no_kk as string,
      nik: row.nik as string,
      nama_lengkap: row.nama_lengkap as string,
      nama_panggilan: row.nama_panggilan as string,
      jenis_kelamin: row.jenis_kelamin as any,
      tempat_lahir: row.tempat_lahir as string,
      tanggal_lahir: row.tanggal_lahir as string,
      golongan_darah: row.golongan_darah as any,
      hub_keluarga: row.hub_keluarga as any,
      no_hp: row.no_hp as string,
      pendidikan_terakhir: row.pendidikan_terakhir as string,
      masih_sekolah: Boolean(row.masih_sekolah),
      nama_sekolah: row.nama_sekolah as string,
      alamat_sekolah: row.alamat_sekolah as string,
      pekerjaan: row.pekerjaan as string,
      nama_perusahaan: row.nama_perusahaan as string,
      alamat_perusahaan: row.alamat_perusahaan as string,
      agama: row.agama as string,
      baptis: row.baptis_json ? JSON.parse(row.baptis_json as string) : undefined,
      komuni_pertama: row.komuni_json ? JSON.parse(row.komuni_json as string) : undefined,
      krisma: row.krisma_json ? JSON.parse(row.krisma_json as string) : undefined,
      perkawinan: row.perkawinan_json ? JSON.parse(row.perkawinan_json as string) : undefined,
      status_perkawinan: (row.status_perkawinan as string) || 'Belum Menikah (Single)',
      created_at: row.created_at as string,
      updated_at: row.updated_at as string
    });
  }
  stmt.free();
  return list;
}

export async function saveAnggotaKeluarga(data: Partial<AnggotaKeluarga>): Promise<AnggotaKeluarga> {
  const db = await getDb();
  const now = new Date().toISOString();
  const isEdit = !!data.id;
  const id = data.id || `ak-${Date.now()}`;

  // Get current member count for this KK to generate sequence NIK if not provided
  let nik = data.nik || '';
  if (!nik) {
    const existing = await getAnggotaKeluargaByKK(data.id_keluarga || '', data.no_kk || '');
    const seq = existing.length + 1;
    nik = generateNIK(data.no_kk || '', seq);
  }

  const nama_lengkap = (data.nama_lengkap || '').toUpperCase().trim();
  const nama_panggilan = (data.nama_panggilan || '').toUpperCase().trim();

  const baptis_json = JSON.stringify(data.baptis || {});
  const komuni_json = JSON.stringify(data.komuni_pertama || {});
  const krisma_json = JSON.stringify(data.krisma || {});
  const perkawinan_json = JSON.stringify(data.perkawinan || {});

  if (isEdit) {
    db.run(
      `UPDATE anggota_keluarga SET
        nik = ?,
        nama_lengkap = ?,
        nama_panggilan = ?,
        jenis_kelamin = ?,
        tempat_lahir = ?,
        tanggal_lahir = ?,
        golongan_darah = ?,
        hub_keluarga = ?,
        status_perkawinan = ?,
        no_hp = ?,
        pendidikan_terakhir = ?,
        masih_sekolah = ?,
        nama_sekolah = ?,
        alamat_sekolah = ?,
        pekerjaan = ?,
        nama_perusahaan = ?,
        alamat_perusahaan = ?,
        agama = ?,
        baptis_json = ?,
        komuni_json = ?,
        krisma_json = ?,
        perkawinan_json = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        nik,
        nama_lengkap,
        nama_panggilan,
        data.jenis_kelamin || 'Laki-laki',
        data.tempat_lahir || '',
        data.tanggal_lahir || '',
        data.golongan_darah || 'Belum Tahu',
        data.hub_keluarga || 'Anak',
        data.status_perkawinan || 'Belum Menikah (Single)',
        data.no_hp || '',
        data.pendidikan_terakhir || '-',
        data.masih_sekolah ? 1 : 0,
        data.nama_sekolah || '',
        data.alamat_sekolah || '',
        data.pekerjaan || '-',
        data.nama_perusahaan || '',
        data.alamat_perusahaan || '',
        data.agama || 'Katolik',
        baptis_json,
        komuni_json,
        krisma_json,
        perkawinan_json,
        now,
        id
      ]
    );
  } else {
    db.run(
      `INSERT INTO anggota_keluarga (
        id, id_keluarga, no_kk, nik, nama_lengkap, nama_panggilan, jenis_kelamin,
        tempat_lahir, tanggal_lahir, golongan_darah, hub_keluarga, status_perkawinan,
        no_hp, pendidikan_terakhir, masih_sekolah, nama_sekolah, alamat_sekolah,
        pekerjaan, nama_perusahaan, alamat_perusahaan, agama, baptis_json,
        komuni_json, krisma_json, perkawinan_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.id_keluarga || '',
        data.no_kk || '',
        nik,
        nama_lengkap,
        nama_panggilan,
        data.jenis_kelamin || 'Laki-laki',
        data.tempat_lahir || '',
        data.tanggal_lahir || '',
        data.golongan_darah || 'Belum Tahu',
        data.hub_keluarga || 'Anak',
        data.status_perkawinan || 'Belum Menikah (Single)',
        data.no_hp || '',
        data.pendidikan_terakhir || '-',
        data.masih_sekolah ? 1 : 0,
        data.nama_sekolah || '',
        data.alamat_sekolah || '',
        data.pekerjaan || '-',
        data.nama_perusahaan || '',
        data.alamat_perusahaan || '',
        data.agama || 'Katolik',
        baptis_json,
        komuni_json,
        krisma_json,
        perkawinan_json,
        now,
        now
      ]
    );
  }

  saveDb(db);
  await saveToFirestore('anggota_keluarga', id, {
    id,
    id_keluarga: data.id_keluarga || '',
    no_kk: data.no_kk || '',
    nik,
    nama_lengkap,
    nama_panggilan,
    jenis_kelamin: data.jenis_kelamin || 'Laki-laki',
    tempat_lahir: data.tempat_lahir || '',
    tanggal_lahir: data.tanggal_lahir || '',
    golongan_darah: data.golongan_darah || 'Belum Tahu',
    hub_keluarga: data.hub_keluarga || 'Anak',
    status_perkawinan: data.status_perkawinan || 'Belum Menikah (Single)',
    no_hp: data.no_hp || '',
    pendidikan_terakhir: data.pendidikan_terakhir || '-',
    masih_sekolah: data.masih_sekolah ? 1 : 0,
    nama_sekolah: data.nama_sekolah || '',
    alamat_sekolah: data.alamat_sekolah || '',
    pekerjaan: data.pekerjaan || '-',
    nama_perusahaan: data.nama_perusahaan || '',
    alamat_perusahaan: data.alamat_perusahaan || '',
    agama: data.agama || 'Katolik',
    baptis_json,
    komuni_json,
    krisma_json,
    perkawinan_json,
    created_at: data.created_at || now,
    updated_at: now
  });

  window.dispatchEvent(new CustomEvent('sapa-db-updated'));

  return {
    id,
    id_keluarga: data.id_keluarga!,
    no_kk: data.no_kk!,
    nik,
    nama_lengkap,
    nama_panggilan,
    jenis_kelamin: data.jenis_kelamin || 'Laki-laki',
    tempat_lahir: data.tempat_lahir || '',
    tanggal_lahir: data.tanggal_lahir || '',
    golongan_darah: data.golongan_darah || 'Belum Tahu',
    hub_keluarga: data.hub_keluarga || 'Anak',
    status_perkawinan: data.status_perkawinan || 'Belum Menikah (Single)',
    no_hp: data.no_hp,
    pendidikan_terakhir: data.pendidikan_terakhir || '-',
    masih_sekolah: !!data.masih_sekolah,
    nama_sekolah: data.nama_sekolah,
    alamat_sekolah: data.alamat_sekolah,
    pekerjaan: data.pekerjaan || '-',
    nama_perusahaan: data.nama_perusahaan,
    alamat_perusahaan: data.alamat_perusahaan,
    agama: data.agama || 'Katolik',
    baptis: data.baptis,
    komuni_pertama: data.komuni_pertama,
    krisma: data.krisma,
    perkawinan: data.perkawinan,
    created_at: now,
    updated_at: now
  };
}

export async function deleteAnggotaKeluarga(id: string): Promise<boolean> {
  const db = await getDb();
  await deleteFromFirestore('anggota_keluarga', id);
  db.run(`DELETE FROM anggota_keluarga WHERE id = ?`, [id]);
  saveDb(db);
  window.dispatchEvent(new CustomEvent('sapa-db-updated'));
  return true;
}

// INVENTARIS LINGKUNGAN CRUD
export async function getInventarisList(): Promise<Inventaris[]> {
  const db = await getDb();
  const res = db.exec(`SELECT id, no_urut, nama_barang, jumlah, satuan, tempat_penyimpanan, kondisi, keterangan, updated_at FROM inventaris ORDER BY no_urut ASC`);
  if (!res.length) return [];
  return res[0].values.map((r) => ({
    id: r[0] as string,
    no_urut: Number(r[1]),
    nama_barang: r[2] as string,
    jumlah: Number(r[3]),
    satuan: (r[4] as string) || 'Unit',
    tempat_penyimpanan: r[5] as string,
    kondisi: r[6] as any,
    keterangan: r[7] as string,
    updated_at: r[8] as string
  }));
}

export async function saveInventaris(inv: Partial<Inventaris>): Promise<Inventaris> {
  const db = await getDb();
  const now = new Date().toISOString();
  const isEdit = !!inv.id;
  const id = inv.id || `inv-${Date.now()}`;
  const satuan = inv.satuan || 'Unit';

  let no_urut = inv.no_urut;
  if (!no_urut) {
    const list = await getInventarisList();
    no_urut = list.length + 1;
  }

  if (isEdit) {
    db.run(
      `UPDATE inventaris SET no_urut = ?, nama_barang = ?, jumlah = ?, satuan = ?, tempat_penyimpanan = ?, kondisi = ?, keterangan = ?, updated_at = ? WHERE id = ?`,
      [no_urut, inv.nama_barang, inv.jumlah, satuan, inv.tempat_penyimpanan, inv.kondisi, inv.keterangan || '', now, id]
    );
  } else {
    db.run(
      `INSERT INTO inventaris (id, no_urut, nama_barang, jumlah, satuan, tempat_penyimpanan, kondisi, keterangan, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, no_urut, inv.nama_barang, inv.jumlah, satuan, inv.tempat_penyimpanan, inv.kondisi, inv.keterangan || '', now]
    );
  }
  saveDb(db);
  await saveToFirestore('inventaris', id, {
    id,
    no_urut,
    nama_barang: inv.nama_barang || '',
    jumlah: inv.jumlah || 1,
    satuan,
    tempat_penyimpanan: inv.tempat_penyimpanan || '',
    kondisi: inv.kondisi || 'Baik',
    keterangan: inv.keterangan || '',
    updated_at: now
  });

  window.dispatchEvent(new CustomEvent('sapa-db-updated'));

  return {
    id,
    no_urut,
    nama_barang: inv.nama_barang || '',
    jumlah: inv.jumlah || 1,
    satuan,
    tempat_penyimpanan: inv.tempat_penyimpanan || '',
    kondisi: inv.kondisi || 'Baik',
    keterangan: inv.keterangan,
    updated_at: now
  };
}

export async function deleteInventaris(id: string): Promise<boolean> {
  const db = await getDb();
  await deleteFromFirestore('inventaris', id);
  db.run(`DELETE FROM inventaris WHERE id = ?`, [id]);
  saveDb(db);
  window.dispatchEvent(new CustomEvent('sapa-db-updated'));
  return true;
}

// IURAN KARTU MERAH LINGKUNGAN CRUD
export async function getIuranList(noKKFilter?: string): Promise<IuranKartuMerah[]> {
  const db = await getDb();
  let query = `SELECT * FROM iuran_kartu_merah`;
  const params: string[] = [];
  if (noKKFilter) {
    query += ` WHERE no_kk = ?`;
    params.push(noKKFilter);
  }
  query += ` ORDER BY tanggal_bayar DESC`;

  const stmt = db.prepare(query);
  stmt.bind(params);

  const list: IuranKartuMerah[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    list.push({
      id: row.id as string,
      no_kk: row.no_kk as string,
      nama_kk: row.nama_kk as string,
      tanggal_bayar: row.tanggal_bayar as string,
      hari: row.hari as string,
      bulan: row.bulan as string,
      tahun: row.tahun as string,
      jumlah_iuran: Number(row.jumlah_iuran),
      jenis_iuran: row.jenis_iuran as any,
      catatan: row.catatan as string,
      diinput_oleh: row.diinput_oleh as string,
      created_at: row.created_at as string
    });
  }
  stmt.free();
  return list;
}

export async function saveIuran(iuran: Partial<IuranKartuMerah>): Promise<IuranKartuMerah> {
  const db = await getDb();
  const now = new Date().toISOString();
  const id = iuran.id || `iuran-${Date.now()}`;
  const isEdit = !!iuran.id;

  if (isEdit) {
    db.run(
      `UPDATE iuran_kartu_merah SET no_kk = ?, nama_kk = ?, tanggal_bayar = ?, hari = ?, bulan = ?, tahun = ?, jumlah_iuran = ?, jenis_iuran = ?, catatan = ?, diinput_oleh = ? WHERE id = ?`,
      [iuran.no_kk, iuran.nama_kk, iuran.tanggal_bayar, iuran.hari, iuran.bulan, iuran.tahun, iuran.jumlah_iuran, iuran.jenis_iuran, iuran.catatan || '', iuran.diinput_oleh || 'Pengurus', id]
    );
  } else {
    db.run(
      `INSERT INTO iuran_kartu_merah VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, iuran.no_kk, iuran.nama_kk, iuran.tanggal_bayar, iuran.hari, iuran.bulan, iuran.tahun, iuran.jumlah_iuran, iuran.jenis_iuran, iuran.catatan || '', iuran.diinput_oleh || 'Pengurus', now]
    );
  }
  saveDb(db);
  await saveToFirestore('iuran_kartu_merah', id, {
    id,
    no_kk: iuran.no_kk || '',
    nama_kk: iuran.nama_kk || '',
    tanggal_bayar: iuran.tanggal_bayar || '',
    hari: iuran.hari || '',
    bulan: iuran.bulan || '',
    tahun: iuran.tahun || '',
    jumlah_iuran: iuran.jumlah_iuran || 0,
    jenis_iuran: iuran.jenis_iuran || 'Kas Lingkungan',
    catatan: iuran.catatan || '',
    diinput_oleh: iuran.diinput_oleh || 'Pengurus',
    created_at: iuran.created_at || now
  });

  window.dispatchEvent(new CustomEvent('sapa-db-updated'));

  return {
    id,
    no_kk: iuran.no_kk || '',
    nama_kk: iuran.nama_kk || '',
    tanggal_bayar: iuran.tanggal_bayar || '',
    hari: iuran.hari || '',
    bulan: iuran.bulan || '',
    tahun: iuran.tahun || '',
    jumlah_iuran: iuran.jumlah_iuran || 0,
    jenis_iuran: iuran.jenis_iuran || 'Kas Lingkungan',
    catatan: iuran.catatan,
    diinput_oleh: iuran.diinput_oleh || 'Pengurus',
    created_at: now
  };
}

export async function deleteIuran(id: string): Promise<boolean> {
  const db = await getDb();
  await deleteFromFirestore('iuran_kartu_merah', id);
  db.run(`DELETE FROM iuran_kartu_merah WHERE id = ?`, [id]);
  saveDb(db);
  window.dispatchEvent(new CustomEvent('sapa-db-updated'));
  return true;
}

// PELAYANAN LINGKUNGAN CRUD
export async function getPelayananList(): Promise<PelayananLingkungan[]> {
  const db = await getDb();
  const res = db.exec(`SELECT * FROM pelayanan_lingkungan ORDER BY id ASC`);
  if (!res.length) return [];
  return res[0].values.map((r) => ({
    id: r[0] as string,
    kategori: r[1] as any,
    nama_petugas: r[2] as string,
    jabatan_tugas: r[3] as string,
    no_hp: r[4] as string,
    periode: r[5] as string,
    keterangan: r[6] as string
  }));
}

export async function savePelayanan(data: Partial<PelayananLingkungan>): Promise<PelayananLingkungan> {
  const db = await getDb();
  const id = data.id || `pel-${Date.now()}`;
  const isEdit = !!data.id;

  if (isEdit) {
    db.run(
      `UPDATE pelayanan_lingkungan SET kategori = ?, nama_petugas = ?, jabatan_tugas = ?, no_hp = ?, periode = ?, keterangan = ? WHERE id = ?`,
      [data.kategori, data.nama_petugas, data.jabatan_tugas, data.no_hp || '', data.periode || '2024-2027', data.keterangan || '', id]
    );
  } else {
    db.run(
      `INSERT INTO pelayanan_lingkungan VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.kategori, data.nama_petugas, data.jabatan_tugas, data.no_hp || '', data.periode || '2024-2027', data.keterangan || '']
    );
  }
  saveDb(db);
  await saveToFirestore('pelayanan_lingkungan', id, {
    id,
    kategori: data.kategori || 'Pengurus Lingkungan',
    nama_petugas: data.nama_petugas || '',
    jabatan_tugas: data.jabatan_tugas || '',
    no_hp: data.no_hp || '',
    periode: data.periode || '2024-2027',
    keterangan: data.keterangan || ''
  });

  window.dispatchEvent(new CustomEvent('sapa-db-updated'));

  return {
    id,
    kategori: data.kategori || 'Pengurus Lingkungan',
    nama_petugas: data.nama_petugas || '',
    jabatan_tugas: data.jabatan_tugas || '',
    no_hp: data.no_hp,
    periode: data.periode,
    keterangan: data.keterangan
  };
}

export async function deletePelayanan(id: string): Promise<boolean> {
  const db = await getDb();
  await deleteFromFirestore('pelayanan_lingkungan', id);
  db.run(`DELETE FROM pelayanan_lingkungan WHERE id = ?`, [id]);
  saveDb(db);
  window.dispatchEvent(new CustomEvent('sapa-db-updated'));
  return true;
}

// JADWAL & FOTO KEGIATAN CRUD
export async function getJadwalKegiatanList(): Promise<JadwalKegiatan[]> {
  const db = await getDb();
  const res = db.exec(`SELECT * FROM jadwal_kegiatan ORDER BY tanggal DESC, created_at DESC`);
  if (!res.length) return [];
  return res[0].values.map((r) => ({
    id: r[0] as string,
    judul_kegiatan: r[1] as string,
    kategori: r[2] as any,
    tanggal: r[3] as string,
    waktu: r[4] as string,
    lokasi: r[5] as string,
    keterangan: r[6] as string,
    foto_base64: r[7] as string,
    created_at: r[8] as string
  }));
}

export async function saveJadwalKegiatan(data: Partial<JadwalKegiatan>): Promise<JadwalKegiatan> {
  const db = await getDb();
  const now = new Date().toISOString();
  const id = data.id || `jg-${Date.now()}`;
  const isEdit = !!data.id;

  if (isEdit) {
    db.run(
      `UPDATE jadwal_kegiatan SET judul_kegiatan = ?, kategori = ?, tanggal = ?, waktu = ?, lokasi = ?, keterangan = ?, foto_base64 = ? WHERE id = ?`,
      [data.judul_kegiatan, data.kategori, data.tanggal, data.waktu, data.lokasi, data.keterangan || '', data.foto_base64 || '', id]
    );
  } else {
    db.run(
      `INSERT INTO jadwal_kegiatan VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.judul_kegiatan, data.kategori, data.tanggal, data.waktu, data.lokasi, data.keterangan || '', data.foto_base64 || '', now]
    );
  }
  saveDb(db);
  await saveToFirestore('jadwal_kegiatan', id, {
    id,
    judul_kegiatan: data.judul_kegiatan || '',
    kategori: data.kategori || 'Doa Lingkungan',
    tanggal: data.tanggal || '',
    waktu: data.waktu || '',
    lokasi: data.lokasi || '',
    keterangan: data.keterangan || '',
    foto_base64: data.foto_base64 || '',
    created_at: data.created_at || now
  });

  window.dispatchEvent(new CustomEvent('sapa-db-updated'));

  return {
    id,
    judul_kegiatan: data.judul_kegiatan || '',
    kategori: data.kategori || 'Doa Lingkungan',
    tanggal: data.tanggal || '',
    waktu: data.waktu || '',
    lokasi: data.lokasi || '',
    keterangan: data.keterangan,
    foto_base64: data.foto_base64,
    created_at: now
  };
}

export async function deleteJadwalKegiatan(id: string): Promise<boolean> {
  const db = await getDb();
  await deleteFromFirestore('jadwal_kegiatan', id);
  db.run(`DELETE FROM jadwal_kegiatan WHERE id = ?`, [id]);
  saveDb(db);
  window.dispatchEvent(new CustomEvent('sapa-db-updated'));
  return true;
}

export async function resetAndWipeAllDatabaseData(): Promise<boolean> {
  const db = await getDb();
  db.run(`DELETE FROM kepala_keluarga`);
  db.run(`DELETE FROM anggota_keluarga`);
  db.run(`DELETE FROM inventaris`);
  db.run(`DELETE FROM iuran_kartu_merah`);
  db.run(`DELETE FROM pelayanan_lingkungan`);
  db.run(`DELETE FROM jadwal_kegiatan`);
  saveDb(db);

  await wipeAllFirestoreData();
  window.dispatchEvent(new CustomEvent('sapa-db-updated'));
  return true;
}

export async function pushAllLocalDataToCloud(): Promise<boolean> {
  const db = await getDb();
  const res = await forcePushLocalToFirestore(db);
  if (res) {
    window.dispatchEvent(new CustomEvent('sapa-db-updated'));
  }
  return res;
}

export async function pullAllDataFromCloud(): Promise<boolean> {
  const db = await getDb();
  const res = await forcePullFirestoreToLocal(db);
  if (res) {
    window.dispatchEvent(new CustomEvent('sapa-db-updated'));
  }
  return res;
}

