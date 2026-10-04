import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'warga.json');

// Pastikan folder data tersedia
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Baca database warga secara aman
function readDb(): any[] {
  try {
    if (!fs.existsSync(DB_FILE)) {
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

// Tulis database warga secara atomik agar data tidak korup
function writeDb(data: any[]): boolean {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
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
    res.json({
      status: 'online',
      storage: 'centralized-json',
      totalWarga: data.length,
      serverTime: new Date().toISOString()
    });
  });

  // GET: Ambil seluruh data warga (tersinkronisasi untuk semua perangkat HP & Laptop)
  app.get('/api/warga', (req, res) => {
    const data = readDb();
    res.json({
      success: true,
      count: data.length,
      data
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
      current.unshift(warga);
    }

    writeDb(current);
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

  // DELETE: Kosongkan seluruh database (0 data)
  app.delete('/api/warga', (req, res) => {
    writeDb([]);
    console.log('[SAPA DB] Database berhasil dikosongkan (0 data)');
    res.json({ success: true, message: 'Database jemaat berhasil dikosongkan (0 data)' });
  });

  // POST: Sync batch list (misalnya restore backup)
  app.post('/api/warga/sync', (req, res) => {
    const { list } = req.body;
    if (Array.isArray(list)) {
      writeDb(list);
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
