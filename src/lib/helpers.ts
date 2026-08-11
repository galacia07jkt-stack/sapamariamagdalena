export function parseBirthDate(birthDateString: string): Date | null {
  if (!birthDateString) return null;
  const cleanStr = birthDateString.trim();
  let birthDate: Date;

  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    const parts = cleanStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    birthDate = new Date(year, month, day);
  } else if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/.test(cleanStr)) {
    const parts = cleanStr.split(/[\/-]/);
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
      birthDate = new Date(year, month, day);
    } else {
      return null;
    }
  } else {
    birthDate = new Date(cleanStr);
  }

  if (isNaN(birthDate.getTime())) return null;
  return birthDate;
}

export function formatDateToYYYYMMDD(birthDateString: string): string {
  const dt = parseBirthDate(birthDateString);
  if (!dt) return birthDateString || '';
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDateToDDMMYYYY(birthDateString: string): string {
  const dt = parseBirthDate(birthDateString);
  if (!dt) return birthDateString || '';
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy}`;
}

export interface WetonResult {
  hari: string;
  pasaran: string;
  weton: string;
  neptuHari: number;
  neptuPasaran: number;
  neptuTotal: number;
  neptuDetail: string;
}

export function getWetonJawa(birthDateString: string): WetonResult {
  const dt = parseBirthDate(birthDateString);
  if (!dt) {
    return {
      hari: '',
      pasaran: '',
      weton: '',
      neptuHari: 0,
      neptuPasaran: 0,
      neptuTotal: 0,
      neptuDetail: ''
    };
  }

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const hari = days[dt.getDay()];

  // Pasaran cycle: Legi, Pahing, Pon, Wage, Kliwon
  // Anchor date: 1970-01-01 is Thursday Wage (daysSinceEpoch = 0, pasaranIndex = 3)
  const pasaranList = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];
  const utcMillis = Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate());
  const daysSinceEpoch = Math.floor(utcMillis / (1000 * 60 * 60 * 24));
  const pasaranIndex = ((daysSinceEpoch + 3) % 5 + 5) % 5;
  const pasaran = pasaranList[pasaranIndex];

  // Neptu Values
  const neptuHariMap: Record<string, number> = {
    'Minggu': 5,
    'Senin': 4,
    'Selasa': 3,
    'Rabu': 7,
    'Kamis': 8,
    'Jumat': 6,
    'Sabtu': 9,
  };

  const neptuPasaranMap: Record<string, number> = {
    'Legi': 5,
    'Pahing': 9,
    'Pon': 7,
    'Wage': 4,
    'Kliwon': 8,
  };

  const neptuHari = neptuHariMap[hari] || 0;
  const neptuPasaran = neptuPasaranMap[pasaran] || 0;
  const neptuTotal = neptuHari + neptuPasaran;
  const neptuDetail = `${hari} (${neptuHari}) + ${pasaran} (${neptuPasaran}) = ${neptuTotal}`;

  return {
    hari,
    pasaran,
    weton: `${hari} ${pasaran}`,
    neptuHari,
    neptuPasaran,
    neptuTotal,
    neptuDetail
  };
}

export interface DetailedAge {
  years: number;
  months: number;
  days: number;
  yearDiff: number;
  extraDays: number;
  totalDays: number;
  hariLahir: string;
  pasaranJawa: string;
  wetonJawa: string;
  neptuHari: number;
  neptuPasaran: number;
  neptuTotal: number;
  neptuDetail: string;
  formatted: string;
  fullFormatted: string;
}

export function calculateAgeDetail(birthDateString: string): DetailedAge {
  const birthDate = parseBirthDate(birthDateString);
  const wetonObj = getWetonJawa(birthDateString);

  if (!birthDate) {
    return {
      years: 0,
      months: 0,
      days: 0,
      yearDiff: 0,
      extraDays: 0,
      totalDays: 0,
      hariLahir: '',
      pasaranJawa: '',
      wetonJawa: '',
      neptuHari: 0,
      neptuPasaran: 0,
      neptuTotal: 0,
      neptuDetail: '',
      formatted: '0 Tahun, 0 Bulan, 0 Hari',
      fullFormatted: '0 Tahun'
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const birth = new Date(birthDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  const currentYear = today.getFullYear();
  const birthYear = birth.getFullYear();

  // Calendar year diff
  const yearDiff = Math.max(0, currentYear - birthYear);

  // Calculate exact Years, Months, Days
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years < 0) {
    years = 0;
    months = 0;
    days = 0;
  }

  // Days since last birthday
  const lastBirthday = new Date(currentYear, birth.getMonth(), birth.getDate());
  if (today < lastBirthday) {
    lastBirthday.setFullYear(currentYear - 1);
  }
  const diffTime = today.getTime() - lastBirthday.getTime();
  const extraDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  // Total days lived
  const totalDiffTime = today.getTime() - birth.getTime();
  const totalDays = Math.max(0, Math.floor(totalDiffTime / (1000 * 60 * 60 * 24)));

  const formatted = `${years} Tahun, ${months} Bulan, ${days} Hari`;
  const fullFormatted = `${wetonObj.weton ? wetonObj.weton + ' • ' : ''}${formatted}`;

  return {
    years,
    months,
    days,
    yearDiff,
    extraDays,
    totalDays,
    hariLahir: wetonObj.hari,
    pasaranJawa: wetonObj.pasaran,
    wetonJawa: wetonObj.weton,
    neptuHari: wetonObj.neptuHari,
    neptuPasaran: wetonObj.neptuPasaran,
    neptuTotal: wetonObj.neptuTotal,
    neptuDetail: wetonObj.neptuDetail,
    formatted,
    fullFormatted
  };
}

export function calculateAge(birthDateString: string): number {
  return calculateAgeDetail(birthDateString).years;
}

export function formatAgeWithDays(birthDateString: string): string {
  const detail = calculateAgeDetail(birthDateString);
  if (!detail.wetonJawa) return `${detail.years} Thn`;
  return `${detail.wetonJawa} • ${detail.years} Thn`;
}

export function generateNIK(noKK: string, sequenceNumber: number): string {
  const cleanKK = (noKK || '').replace(/\D/g, '');
  const base14 = cleanKK.length >= 14 
    ? cleanKK.substring(0, 14) 
    : (cleanKK || '35060100000000').padEnd(14, '0');
  const seqStr = sequenceNumber.toString().padStart(2, '0');
  return `${base14}${seqStr}`;
}

export function formatUppercase(text: string | undefined | null): string {
  if (!text) return '';
  return text.toUpperCase();
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function getDayName(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[date.getDay()];
}

export function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
