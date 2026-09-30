/**
 * Konfigurasi Sistem SAPA St. Maria Magdalena Semampir Kediri
 * Pengaturan Parameter Model & Determinisme (Temperature 0.0 / 0.1)
 */

const TEMPERATURE_STORAGE_KEY = 'SAPA_PARAM_TEMPERATURE';

export function getAppTemperature(): number {
  try {
    const val = localStorage.getItem(TEMPERATURE_STORAGE_KEY);
    if (val !== null) {
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) return parsed;
    }
  } catch {
    // Ignore error
  }
  return 0.1; // Default 0.1 sesuai instruksi
}

export function setAppTemperature(temp: number): void {
  try {
    localStorage.setItem(TEMPERATURE_STORAGE_KEY, temp.toFixed(1));
    window.dispatchEvent(new CustomEvent('sapa-config-changed', { detail: { temperature: temp } }));
  } catch {
    // Ignore error
  }
}

export const APP_CONFIG = {
  appName: 'SAPA St. Maria Magdalena Semampir',
  paroki: 'Paroki St. Vincentius a Paulo Kota Kediri',
  keuskupan: 'Keuskupan Surabaya',
  // Pengaturan parameter temperature presisi tinggi (diturunkan ke 0.1 / 0.0 sesuai instruksi)
  get temperature() {
    return getAppTemperature();
  },
  topP: 0.95,
  seed: 42,
  textFormat: 'Title Case (Huruf Pertama Di Setiap Kata Wajib Kapital / Besar)',
  dateFormat: 'DD/MM/YYYY',
};
