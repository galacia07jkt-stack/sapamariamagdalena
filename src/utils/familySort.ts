import { WargaKatolik } from '../types';

/**
 * Peringkat hierarki hubungan keluarga:
 * 1. Kepala Keluarga (teratas)
 * 2. Istri / Suami
 * 3. Anak (diurutkan anak tertua ke termuda)
 * 4. Orang Tua / Mertua
 * 5. Menantu
 * 6. Cucu
 * 7. Famili Lain
 */
const HUBUNGAN_RANK: Record<string, number> = {
  'kepala keluarga': 1,
  'istri': 2,
  'suami': 2,
  'anak': 3,
  'orang tua': 4,
  'ayah': 4,
  'ibu': 4,
  'mertua': 5,
  'menantu': 6,
  'cucu': 7,
  'famili lain': 8,
};

export function getHubunganRank(hubungan?: any): number {
  if (!hubungan) return 99;
  const clean = String(hubungan).toLowerCase().trim();
  if (HUBUNGAN_RANK[clean]) return HUBUNGAN_RANK[clean];
  if (clean.includes('kepala')) return 1;
  if (clean.includes('istri')) return 2;
  if (clean.includes('anak')) return 3;
  if (clean.includes('orang tua') || clean.includes('ayah') || clean.includes('ibu')) return 4;
  if (clean.includes('famili') || clean.includes('fam')) return 7;
  return 50;
}

/**
 * Mengubah string tanggal lahir (DD/MM/YYYY atau YYYY-MM-DD) menjadi angka skor pembanding
 * Tahun lebih kecil = lahir lebih awal = anak lebih tua
 */
function parseBirthDateScore(dateStr?: any): number {
  if (!dateStr) return 99999999;
  const clean = String(dateStr).trim();

  // Format DD/MM/YYYY
  const slashParts = clean.split('/');
  if (slashParts.length === 3) {
    const d = parseInt(slashParts[0], 10);
    const m = parseInt(slashParts[1], 10);
    const y = parseInt(slashParts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return y * 10000 + m * 100 + d;
    }
  }

  // Format YYYY-MM-DD
  const dashParts = clean.split('-');
  if (dashParts.length === 3) {
    const y = parseInt(dashParts[0], 10);
    const m = parseInt(dashParts[1], 10);
    const d = parseInt(dashParts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return y * 10000 + m * 100 + d;
    }
  }

  return 99999999;
}

/**
 * Mengurutkan susunan warga sesuai hierarki keluarga:
 * 1. Setiap anggota keluarga yang berada dalam 1 Kartu Keluarga (No KK yang sama)
 *    dikelompokkan bersama secara utuh berdampingan.
 * 2. Keluarga disusun dari atas ke bawah berdasarkan urutan awal pendaftaran / input.
 * 3. Di dalam setiap keluarga, urutan tersusun rapi:
 *    - Kepala Keluarga (paling atas)
 *    - Istri
 *    - Anak (anak tertua ke termuda berdasarkan tanggal lahir)
 *    - Orang Tua / Mertua
 *    - Famili Lainnya
 */
export function sortWargaByKeluarga(wargaList: WargaKatolik[]): WargaKatolik[] {
  if (!wargaList || !Array.isArray(wargaList) || wargaList.length <= 1) {
    return Array.isArray(wargaList) ? wargaList : [];
  }

  // 1. Kelompokkan warga berdasarkan Nomor KK
  const familyGroups = new Map<string, WargaKatolik[]>();
  const familyOrder: string[] = [];
  const familyEarliestTimestamp = new Map<string, number>();

  wargaList.forEach((w) => {
    if (!w) return;
    const rawKk = w.noKk !== undefined && w.noKk !== null ? String(w.noKk).trim() : '';
    const kkKey = rawKk !== '' ? rawKk : `NON_KK_${w.id || Math.random()}`;

    if (!familyGroups.has(kkKey)) {
      familyGroups.set(kkKey, []);
      familyOrder.push(kkKey);
    }
    familyGroups.get(kkKey)!.push(w);

    const ts = new Date(w.createdAt || 0).getTime() || 0;
    const currentEarliest = familyEarliestTimestamp.get(kkKey) ?? Infinity;
    if (ts < currentEarliest) {
      familyEarliestTimestamp.set(kkKey, ts);
    }
  });

  // 2. Susun urutan keluarga dari yang paling awal diinput ke yang terbaru (dari atas ke bawah)
  familyOrder.sort((a, b) => {
    const timeA = familyEarliestTimestamp.get(a) ?? 0;
    const timeB = familyEarliestTimestamp.get(b) ?? 0;
    return timeA - timeB;
  });

  // 3. Di dalam setiap KK: Kepala Keluarga -> Istri -> Anak (tertua -> termuda) -> Lainnya
  const sortedResult: WargaKatolik[] = [];

  familyOrder.forEach((kkKey) => {
    const members = familyGroups.get(kkKey);
    if (!members) return;

    members.sort((a, b) => {
      const rankA = getHubunganRank(a.hubunganKeluarga);
      const rankB = getHubunganRank(b.hubunganKeluarga);

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      // Jika sama-sama Anak, urutkan dari tanggal lahir tertua ke termuda
      if (rankA === 3) {
        const birthA = parseBirthDateScore(a.tanggalLahir);
        const birthB = parseBirthDateScore(b.tanggalLahir);
        if (birthA !== birthB && birthA !== 99999999 && birthB !== 99999999) {
          return birthA - birthB; // tahun lahir lebih awal = anak lebih tua
        }
      }

      // Fallback ke urutan waktu pendaftaran
      const timeA = new Date(a.createdAt || 0).getTime() || 0;
      const timeB = new Date(b.createdAt || 0).getTime() || 0;
      return timeA - timeB;
    });

    sortedResult.push(...members);
  });

  return sortedResult;
}

export const urutkanWargaSusunanKeluarga = sortWargaByKeluarga;
