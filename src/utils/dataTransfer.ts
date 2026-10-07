import { WargaKatolik } from '../types';

/**
 * Utilitas Enkripsi Ringan & Transfer Data Warga SAPA
 * Memungkinkan warga menyetorkan data ke Admin lewat WhatsApp, QR Code, atau Berkas
 * tanpa ketergantungan pada backend server yang terisolasi.
 */

interface CompactWarga {
  id: string;
  noKk: string;
  nik: string;
  nl: string; // namaLengkap
  nb?: string; // namaBaptis
  ag?: string; // agama
  jk: 'L' | 'P';
  tl?: string; // tempatLahir
  tgl?: string; // tanggalLahir
  al?: string; // alamatDomisili
  rt?: string; // rtRw
  tb?: string; // tempatBaptis
  pb?: string; // parokiKotaBaptis
  tglb?: string; // tanggalBaptis
  nsb?: string; // noSuratBaptis
  hk?: string; // hubunganKeluarga
  sp?: string; // statusPerkawinan
  sak?: { kp?: boolean; kr?: boolean; nk?: boolean };
  hp?: string;
  pek?: string;
  pen?: string;
  cat?: string;
  v?: string; // statusVerifikasi
  cAt?: string;
}

export function compactWarga(w: WargaKatolik): CompactWarga {
  return {
    id: w.id,
    noKk: w.noKk,
    nik: w.nik,
    nl: w.namaLengkap,
    nb: w.namaBaptis || undefined,
    ag: w.agama || 'Katolik',
    jk: w.jenisKelamin,
    tl: w.tempatLahir || undefined,
    tgl: w.tanggalLahir || undefined,
    al: w.alamatDomisili || undefined,
    rt: w.rtRw || undefined,
    tb: w.tempatBaptis || undefined,
    pb: w.parokiKotaBaptis || undefined,
    tglb: w.tanggalBaptis || undefined,
    nsb: w.noSuratBaptis || undefined,
    hk: w.hubunganKeluarga || undefined,
    sp: w.statusPerkawinan || undefined,
    sak: w.sakramenLain ? {
      kp: w.sakramenLain.komuniPertama,
      kr: w.sakramenLain.krisma,
      nk: w.sakramenLain.pernikahan,
    } : undefined,
    hp: w.noHpWhatsapp || undefined,
    pek: w.pekerjaan || undefined,
    pen: w.pendidikan || undefined,
    cat: w.catatanKhusus || undefined,
    v: w.statusVerifikasi || 'Terverifikasi',
    cAt: w.createdAt || undefined,
  };
}

export function uncompactWarga(c: any): WargaKatolik | null {
  if (!c) return null;
  // If it's already full format
  if (c.namaLengkap && (c.nik || c.noKk)) {
    return {
      id: c.id || `sapa-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      noKk: String(c.noKk || ''),
      nik: String(c.nik || ''),
      namaLengkap: c.namaLengkap,
      agama: c.agama || 'Katolik',
      namaBaptis: c.namaBaptis || '',
      jenisKelamin: c.jenisKelamin === 'P' ? 'P' : 'L',
      tempatLahir: c.tempatLahir || '',
      tanggalLahir: c.tanggalLahir || '',
      alamatDomisili: c.alamatDomisili || '',
      rtRw: c.rtRw || 'RT 02 / RW 01',
      tempatBaptis: c.tempatBaptis,
      parokiKotaBaptis: c.parokiKotaBaptis,
      tanggalBaptis: c.tanggalBaptis,
      noSuratBaptis: c.noSuratBaptis,
      hubunganKeluarga: c.hubunganKeluarga || 'Kepala Keluarga',
      statusPerkawinan: c.statusPerkawinan || 'Menikah Katolik',
      sakramenLain: c.sakramenLain,
      noHpWhatsapp: c.noHpWhatsapp || '',
      pekerjaan: c.pekerjaan || '',
      pendidikan: c.pendidikan || '',
      statusVerifikasi: c.statusVerifikasi || 'Terverifikasi',
      catatanKhusus: c.catatanKhusus || '',
      createdAt: c.createdAt || new Date().toISOString(),
      updatedAt: c.updatedAt || new Date().toISOString(),
    };
  }

  // If compact format
  if (c.nl && (c.nik || c.noKk)) {
    return {
      id: c.id || `sapa-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      noKk: String(c.noKk || ''),
      nik: String(c.nik || ''),
      namaLengkap: c.nl,
      agama: (c.ag as any) || 'Katolik',
      namaBaptis: c.nb || '',
      jenisKelamin: c.jk === 'P' ? 'P' : 'L',
      tempatLahir: c.tl || '',
      tanggalLahir: c.tgl || '',
      alamatDomisili: c.al || '',
      rtRw: c.rt || 'RT 02 / RW 01',
      tempatBaptis: c.tb,
      parokiKotaBaptis: c.pb,
      tanggalBaptis: c.tglb,
      noSuratBaptis: c.nsb,
      hubunganKeluarga: (c.hk as any) || 'Kepala Keluarga',
      statusPerkawinan: (c.sp as any) || 'Menikah Katolik',
      sakramenLain: c.sak ? {
        komuniPertama: Boolean(c.sak.kp),
        krisma: Boolean(c.sak.kr),
        pernikahan: Boolean(c.sak.nk),
      } : undefined,
      noHpWhatsapp: c.hp || '',
      pekerjaan: c.pek || '',
      pendidikan: c.pen || '',
      statusVerifikasi: (c.v as any) || 'Terverifikasi',
      catatanKhusus: c.cat || '',
      createdAt: c.cAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Generate string payload untuk QR Code Bukti Warga
 */
export function generateQrPayload(w: WargaKatolik): string {
  try {
    const compact = compactWarga(w);
    const json = JSON.stringify(compact);
    const base64 = btoa(unescape(encodeURIComponent(json)));
    return `SAPA:${base64}`;
  } catch {
    return JSON.stringify(w);
  }
}

/**
 * Decode string payload dari QR Code
 */
export function parseQrPayload(raw: string): WargaKatolik | null {
  try {
    const clean = raw.trim();
    if (clean.startsWith('SAPA:')) {
      const b64 = clean.slice(5);
      const json = decodeURIComponent(escape(atob(b64)));
      const parsed = JSON.parse(json);
      return uncompactWarga(parsed);
    }
    // Coba parse raw JSON jika ada
    const parsed = JSON.parse(clean);
    return uncompactWarga(parsed);
  } catch {
    return null;
  }
}

/**
 * Generate teks WhatsApp lengkap dengan format rapi dan kode setor
 */
export function generateWhatsAppMessage(w: WargaKatolik, adminPhone = ''): string {
  const qrCode = generateQrPayload(w);
  const isKatolik = (w.agama || 'Katolik') === 'Katolik';

  const lines = [
    `*PENDAFTARAN WARGA KATOLIK (SAPA)*`,
    `*Lingkungan St. Maria Magdalena Semampir*`,
    `*Paroki St. Vincentius a Paulo Kediri*`,
    ``,
    `Berikut data registrasi jemaat:`,
    `👤 *Nama Lengkap:* ${w.namaLengkap}`,
    isKatolik && w.namaBaptis ? `✝️ *Nama Baptis:* ${w.namaBaptis}` : null,
    `📋 *No. KK:* ${w.noKk}`,
    `🆔 *NIK:* ${w.nik}`,
    `⛪ *Agama:* ${w.agama || 'Katolik'}`,
    `📍 *RT/RW:* ${w.rtRw}`,
    `🏠 *Alamat:* ${w.alamatDomisili}`,
    `👨‍👩‍👧‍👦 *Hubungan Keluarga:* ${w.hubunganKeluarga}`,
    `💍 *Status Kawin:* ${w.statusPerkawinan}`,
    w.tanggalLahir ? `🎂 *TTL:* ${w.tempatLahir ? w.tempatLahir + ', ' : ''}${w.tanggalLahir}` : null,
    w.noHpWhatsapp ? `📱 *No. HP:* ${w.noHpWhatsapp}` : null,
    ``,
    `----------------------------------------`,
    `*KODE SETOR DATA KE ADMIN PAROKI:*`,
    `(Salin/teruskan pesan ini ke Admin)`,
    `[KODE_SETOR_SAPA]`,
    qrCode,
    `[/KODE_SETOR_SAPA]`,
    `----------------------------------------`,
    `_Dikirim otomatis melalui Aplikasi SAPA_`,
  ].filter(Boolean);

  return lines.join('\n');
}

/**
 * Parse teks WhatsApp untuk mengambil data warga dari kode setor
 */
export function parseWhatsAppMessage(text: string): WargaKatolik[] {
  const results: WargaKatolik[] = [];
  if (!text) return results;

  // 1. Cari blok [KODE_SETOR_SAPA]...[/KODE_SETOR_SAPA]
  const regex = /\[KODE_SETOR_SAPA\]([\s\S]*?)\[\/KODE_SETOR_SAPA\]/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const rawCode = match[1].trim();
    const w = parseQrPayload(rawCode);
    if (w) results.push(w);
  }

  // 2. Jika tidak ada blok tag, cari kata SAPA:... langsung
  if (results.length === 0) {
    const sapaMatch = text.match(/SAPA:[A-Za-z0-9+/=_-]+/g);
    if (sapaMatch) {
      for (const sm of sapaMatch) {
        const w = parseQrPayload(sm);
        if (w) results.push(w);
      }
    }
  }

  // 3. Fallback: coba cari JSON langsung
  if (results.length === 0) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const w = uncompactWarga(item);
          if (w) results.push(w);
        }
      } else {
        const w = uncompactWarga(parsed);
        if (w) results.push(w);
      }
    } catch {
      // bukan JSON
    }
  }

  return results;
}
