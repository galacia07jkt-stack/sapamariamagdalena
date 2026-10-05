import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'warga.json');
const BACKUP_FILE = path.join(DATA_DIR, 'warga-backup.json');
const META_FILE = path.join(DATA_DIR, 'meta.json');

// Pastikan folder data tersedia
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readMeta(): { lastClearedAt: number } {
  try {
    if (!fs.existsSync(META_FILE)) {
      return { lastClearedAt: 0 };
    }
    return JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
  } catch {
    return { lastClearedAt: 0 };
  }
}

function writeMeta(meta: { lastClearedAt: number }) {
  try {
    fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2), 'utf-8');
  } catch {}
}

// Baca database warga secara aman dengan fallback ke backup
function readDb(): any[] {
  try {
    if (!fs.existsSync(DB_FILE)) {
      if (fs.existsSync(BACKUP_FILE)) {
        try {
          const backupContent = fs.readFileSync(BACKUP_FILE, 'utf-8');
          const backupParsed = JSON.parse(backupContent);
          if (Array.isArray(backupParsed) && backupParsed.length > 0) {
            fs.writeFileSync(DB_FILE, backupContent, 'utf-8');
            return backupParsed;
          }
        } catch {}
      }
      fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[SAPA DB] Gagal membaca data warga:', err);
    return [];
  }
}

// Tulis database warga secara atomik & simpan snapshot backup
function writeDb(data: any[]): boolean {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);

    // Simpan redundansi ke file backup jika data berisi
    if (Array.isArray(data) && data.length > 0) {
      try {
        fs.writeFileSync(BACKUP_FILE, JSON.stringify(data, null, 2), 'utf-8');
      } catch {}
    }
    return true;
  } catch (err) {
    console.error('[SAPA DB] Gagal menulis data warga:', err);
    return false;
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware body parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Disable caching for all API responses so mobile devices always get fresh server data
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // API Status & Health Check
  app.get('/api/status', (req, res) => {
    const data = readDb();
    const meta = readMeta();
    res.json({
      status: 'online',
      storage: 'centralized-json',
      totalWarga: data.length,
      lastClearedAt: meta.lastClearedAt,
      serverTime: new Date().toISOString()
    });
  });

  // GET: Ambil seluruh data warga beserta metadata status hapus
  app.get('/api/warga', (req, res) => {
    const data = readDb();
    const meta = readMeta();
    res.json({
      success: true,
      count: data.length,
      data,
      lastClearedAt: meta.lastClearedAt || 0
    });
  });

  // POST: Tambah data warga baru dari HP / Laptop mana saja
  app.post('/api/warga', (req, res) => {
    const warga = req.body;
    if (!warga || !warga.namaLengkap) {
      return res.status(400).json({ error: 'Nama Lengkap wajib diisi' });
    }

    const current = readDb();
    const existingIndex = current.findIndex((w) => w.id === warga.id);

    if (existingIndex >= 0) {
      current[existingIndex] = {
        ...current[existingIndex],
        ...warga,
        updatedAt: new Date().toISOString()
      };
    } else {
      current.push(warga);
    }

    writeDb(current);
    writeMeta({ lastClearedAt: 0 }); // Reset cleared flag jika ada data baru
    console.log(`[SAPA DB] Data warga tersimpan: ${warga.namaLengkap} (Total di server: ${current.length})`);
    
    res.json({
      success: true,
      data: warga,
      total: current.length
    });
  });

  // PUT: Perbarui data warga
  app.put('/api/warga/:id', (req, res) => {
    const { id } = req.params;
    const current = readDb();
    const idx = current.findIndex((w) => w.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Data jemaat tidak ditemukan' });
    }

    current[idx] = {
      ...current[idx],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    writeDb(current);
    writeMeta({ lastClearedAt: 0 });
    res.json({ success: true, data: current[idx] });
  });

  // DELETE: Hapus 1 data warga
  app.delete('/api/warga/:id', (req, res) => {
    const { id } = req.params;
    const current = readDb();
    const filtered = current.filter((w) => w.id !== id);
    writeDb(filtered);
    res.json({ success: true, deletedId: id, total: filtered.length });
  });

  // DELETE: Kosongkan seluruh database (0 data) dengan cap waktu
  app.delete('/api/warga', (req, res) => {
    writeDb([]);
    if (fs.existsSync(BACKUP_FILE)) {
      try { fs.unlinkSync(BACKUP_FILE); } catch {}
    }
    const clearedTimestamp = Date.now();
    writeMeta({ lastClearedAt: clearedTimestamp });
    console.log('[SAPA DB] Database berhasil dikosongkan (0 data)');
    res.json({ success: true, message: 'Database jemaat berhasil dikosongkan (0 data)', lastClearedAt: clearedTimestamp });
  });

  // POST: Sync batch list (misalnya restore backup atau auto-rehydrate dari client)
  app.post('/api/warga/sync', (req, res) => {
    const { list } = req.body;
    if (Array.isArray(list)) {
      writeDb(list);
      if (list.length > 0) {
        writeMeta({ lastClearedAt: 0 });
      }
    }
    res.json({ success: true, total: readDb().length });
  });

  // Vite middleware in dev / static in production
  const isProduction = process.env.NODE_ENV === 'production';
  const distPath = path.join(__dirname, 'dist');

  if (isProduction && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[SAPA Server] Server Aktif di port ${PORT} (Database Centralized Aktif)`);
  });
}

startServer();
