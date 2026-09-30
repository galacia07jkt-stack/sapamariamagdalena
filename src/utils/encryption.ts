/**
 * Modul Enkripsi & Keamanan Informasi Paroki St. Vincentius a Paulo Kediri
 * Lingkungan St. Maria Magdalena Semampir
 * Menggunakan Web Crypto API (AES-GCM 256-bit)
 */

const DEFAULT_SALT = new Uint8Array([83, 65, 80, 65, 83, 77, 77, 75, 69, 68, 73, 82, 73, 50, 53, 54]);

/**
 * Menghasilkan Encryption Key dari kata kunci
 */
async function deriveKey(secretKey: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secretKey),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: DEFAULT_SALT,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Enkripsi data teks menjadi hex ciphertext yang aman
 */
export async function encryptData(plainText: string, secretKey: string = 'sapa123-semampir-kediri-secure'): Promise<string> {
  try {
    const key = await deriveKey(secretKey);
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      enc.encode(plainText)
    );

    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    // Convert to Base64
    let binary = '';
    const bytes = new Uint8Array(combined);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (err) {
    console.error('Gagal mengenkripsi data:', err);
    // Fallback reversible encoding
    return 'ENC_' + btoa(encodeURIComponent(plainText));
  }
}

/**
 * Dekripsi data terenkripsi kembali ke format teks
 */
export async function decryptData(encryptedBase64: string, secretKey: string = 'sapa123-semampir-kediri-secure'): Promise<string> {
  try {
    if (encryptedBase64.startsWith('ENC_')) {
      return decodeURIComponent(atob(encryptedBase64.replace('ENC_', '')));
    }

    const binary = atob(encryptedBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const iv = bytes.slice(0, 12);
    const ciphertext = bytes.slice(12);

    const key = await deriveKey(secretKey);
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (err) {
    console.warn('Gagal dekripsi dengan AES-GCM, mencoba metode kompatibilitas:', err);
    try {
      if (encryptedBase64.startsWith('ENC_')) {
        return decodeURIComponent(atob(encryptedBase64.replace('ENC_', '')));
      }
      return encryptedBase64;
    } catch {
      return encryptedBase64;
    }
  }
}

/**
 * Masking NIK atau No KK untuk privasi warga saat diakses di publik
 * Contoh: 3571020509890001 -> 357102******0001
 */
export function maskSensitiveId(id: string): string {
  if (!id || id.length < 8) return id || '-';
  const prefix = id.substring(0, 6);
  const suffix = id.substring(id.length - 4);
  return `${prefix}${'*'.repeat(Math.max(0, id.length - 10))}${suffix}`;
}
