export function calculateAge(birthDateString: string): number {
  if (!birthDateString) return 0;

  let birthDate: Date;
  const cleanStr = birthDateString.trim();

  // Handle DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/.test(cleanStr)) {
    const parts = cleanStr.split(/[\/-]/);
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    birthDate = new Date(year, month, day);
  } else {
    birthDate = new Date(cleanStr);
  }

  if (isNaN(birthDate.getTime())) return 0;

  // Always sync with current date & year dynamically (e.g., 2026, 2027, etc.)
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
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
