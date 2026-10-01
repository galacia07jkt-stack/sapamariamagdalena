import fs from 'fs';
import path from 'path';

// Memory cache fallback for serverless
let memoryCache: any[] = [];
const TMP_FILE = '/tmp/sapa_warga_db.json';

function getDb(): any[] {
  try {
    if (fs.existsSync(TMP_FILE)) {
      const data = fs.readFileSync(TMP_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        memoryCache = parsed;
        return parsed;
      }
    }
  } catch (err) {
    // fallback to memory
  }
  return memoryCache;
}

function saveDb(data: any[]): void {
  memoryCache = data;
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(data), 'utf-8');
  } catch (err) {
    // fallback
  }
}

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const method = req.method;

  if (method === 'GET') {
    const data = getDb();
    return res.status(200).json({ success: true, count: data.length, data });
  }

  if (method === 'POST') {
    const body = req.body;
    if (body && body.list && Array.isArray(body.list)) {
      saveDb(body.list);
      return res.status(200).json({ success: true, total: body.list.length });
    }

    if (!body || !body.namaLengkap) {
      return res.status(400).json({ error: 'Nama Lengkap wajib diisi' });
    }

    const current = getDb();
    const idx = current.findIndex((w: any) => w.id === body.id);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...body, updatedAt: new Date().toISOString() };
    } else {
      current.unshift(body);
    }
    saveDb(current);
    return res.status(200).json({ success: true, data: body, total: current.length });
  }

  if (method === 'DELETE') {
    saveDb([]);
    return res.status(200).json({ success: true, message: 'Database jemaat berhasil dikosongkan (0 data)' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
