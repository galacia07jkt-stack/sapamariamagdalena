import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  QrCode, 
  MessageSquare, 
  FileUp, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Camera, 
  Copy, 
  Check, 
  Sparkles, 
  Users, 
  ArrowRight,
  RefreshCw,
  Share2
} from 'lucide-react';
import { WargaKatolik } from '../types';
import { parseWhatsAppMessage, parseQrPayload } from '../utils/dataTransfer';
import { saveStoredWarga, getStoredWarga, syncWithServer } from '../utils/storage';
import { Html5Qrcode } from 'html5-qrcode';

interface HimpunDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataImported: (count: number) => void;
}

export const HimpunDataModal: React.FC<HimpunDataModalProps> = ({
  isOpen,
  onClose,
  onDataImported,
}) => {
  const [activeTab, setActiveTab] = useState<'wa' | 'qr' | 'file'>('wa');
  const [waText, setWaText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<WargaKatolik[]>([]);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const qrContainerId = 'sapa-qr-reader-admin';

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setWaText('');
      setParsedPreview([]);
      setStatusMsg(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeTab === 'wa' && waText.trim()) {
      const detected = parseWhatsAppMessage(waText);
      setParsedPreview(detected);
    } else if (activeTab === 'wa') {
      setParsedPreview([]);
    }
  }, [waText, activeTab]);

  const stopScanner = () => {
    if (html5QrCodeRef.current && isScanning) {
      html5QrCodeRef.current
        .stop()
        .then(() => {
          html5QrCodeRef.current?.clear();
          setIsScanning(false);
        })
        .catch(() => {
          setIsScanning(false);
        });
    }
  };

  const startScanner = async () => {
    setStatusMsg(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(qrContainerId);
      }
      setIsScanning(true);
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleQrResult(decodedText);
        },
        () => {
          // scanning frame ignored
        }
      );
    } catch (err: any) {
      setIsScanning(false);
      setStatusMsg({
        type: 'error',
        text: 'Tidak dapat mengakses kamera. Pastikan izin kamera aktif, atau gunakan opsi Unggah Foto QR.',
      });
    }
  };

  const handleQrFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMsg(null);

    try {
      const html5Qr = new Html5Qrcode('sapa-qr-temp-reader');
      const result = await html5Qr.scanFile(file, true);
      html5Qr.clear();
      handleQrResult(result);
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: 'Gambar QR tidak terbaca. Pastikan foto QR cukup jelas dan tidak buram.',
      });
    }
  };

  const handleQrResult = (rawQr: string) => {
    const detected = parseQrPayload(rawQr);
    if (detected) {
      // Import directly
      saveWargaBatch([detected]);
      setStatusMsg({
        type: 'success',
        text: `Berhasil memindai & menyimpan: ${detected.namaLengkap} (${detected.rtRw})`,
      });
    } else {
      setStatusMsg({
        type: 'error',
        text: 'Kode QR tidak dikenali sebagai format resmi SAPA.',
      });
    }
  };

  const saveWargaBatch = (newItems: WargaKatolik[]) => {
    if (newItems.length === 0) return;

    const currentList = getStoredWarga();
    const map = new Map<string, WargaKatolik>();
    currentList.forEach((w) => map.set(w.id, w));

    let addedCount = 0;
    newItems.forEach((item) => {
      // Cek apakah NIK atau ID sudah ada
      const existingKey = Array.from(map.values()).find(
        (existing) => existing.nik === item.nik || existing.id === item.id
      );

      if (existingKey) {
        map.set(existingKey.id, { ...existingKey, ...item });
      } else {
        map.set(item.id, item);
        addedCount++;
      }
    });

    const updatedList = Array.from(map.values());
    saveStoredWarga(updatedList);

    // Sync to server if server is available
    fetch('/api/warga/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ list: updatedList }),
    }).catch(() => {});

    onDataImported(newItems.length);
  };

  const handleImportWaText = () => {
    if (parsedPreview.length === 0) {
      setStatusMsg({
        type: 'error',
        text: 'Tidak ada data valid yang terdeteksi dari teks yang ditempel.',
      });
      return;
    }

    saveWargaBatch(parsedPreview);
    setStatusMsg({
      type: 'success',
      text: `Alhamdulillah / Puji Tuhan! Berhasil menghimpun ${parsedPreview.length} data jemaat ke database admin!`,
    });
    setWaText('');
    setParsedPreview([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        let items: WargaKatolik[] = [];

        if (Array.isArray(parsed)) {
          items = parsed;
        } else if (parsed && Array.isArray(parsed.data)) {
          items = parsed.data;
        }

        if (items.length > 0) {
          saveWargaBatch(items);
          setStatusMsg({
            type: 'success',
            text: `Berhasil mengimpor ${items.length} data jemaat dari berkas!`,
          });
        } else {
          setStatusMsg({
            type: 'error',
            text: 'Berkas tidak memuat format data jemaat yang valid.',
          });
        }
      } catch {
        setStatusMsg({
          type: 'error',
          text: 'Gagal membaca berkas JSON / SAPA cadangan.',
        });
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl border-2 border-orange-500 shadow-2xl max-w-2xl w-full my-auto overflow-hidden animate-fade-in flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b-2 border-orange-500 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-400 flex items-center justify-center text-orange-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white">
                Pusat Tarik & Himpun Data Warga
              </h3>
              <p className="text-[11px] text-orange-300 font-medium">
                Kumpulkan data pendaftaran yang diinput oleh warga dari HP masing-masing
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1 shrink-0">
          <button
            onClick={() => {
              stopScanner();
              setActiveTab('wa');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'wa'
                ? 'bg-white text-emerald-700 shadow-xs border border-emerald-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Tempel WhatsApp</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('qr');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-white text-orange-700 shadow-xs border border-orange-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4 text-orange-600" />
            <span>Scan QR HP Warga</span>
          </button>

          <button
            onClick={() => {
              stopScanner();
              setActiveTab('file');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'file'
                ? 'bg-white text-sky-800 shadow-xs border border-sky-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileUp className="w-4 h-4 text-sky-600" />
            <span>Impor Berkas Cadangan</span>
          </button>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div
            className={`mx-4 mt-3 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold shrink-0 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                : 'bg-rose-50 text-rose-800 border border-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: TEMPEL KODE WHATSAPP */}
          {activeTab === 'wa' && (
            <div className="space-y-3">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-900">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Cara Paling Cepat & Praktis:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-700">
                  <li>Minta warga menekan tombol <strong>"Kirim ke WhatsApp Pengurus/Admin"</strong> pada bukti pendaftaran di HP mereka.</li>
                  <li>Buka pesan yang masuk di WhatsApp Anda, <strong>Salin (Copy)</strong> seluruh teks pesan tersebut.</li>
                  <li><strong>Tempel (Paste)</strong> ke kotak di bawah ini, lalu klik <strong>"Proses & Simpan ke Database"</strong>.</li>
                </ol>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tempel Pesan WhatsApp dari Warga di sini:
                </label>
                <textarea
                  value={waText}
                  onChange={(e) => setWaText(e.target.value)}
                  placeholder="Tempel pesan WhatsApp yang memuat [KODE_SETOR_SAPA] di sini..."
                  rows={5}
                  className="w-full p-3 border-2 border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl text-xs font-mono transition resize-none"
                />
              </div>

              {/* Detected Preview */}
              {parsedPreview.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Terdeteksi {parsedPreview.length} Data Jemaat Siap Dimasukkan:</span>
                  </p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {parsedPreview.map((w, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-2 rounded-lg border border-slate-200 text-xs flex items-center justify-between"
                      >
                        <div>
                          <strong className="text-sky-950">{w.namaLengkap}</strong>
                          {w.namaBaptis && <span className="text-orange-700 ml-1">({w.namaBaptis})</span>}
                          <p className="text-[10px] text-slate-500">
                            KK: {w.noKk} • NIK: {w.nik} • {w.rtRw}
                          </p>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          {w.hubunganKeluarga || 'Warga'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleImportWaText}
                    className="w-full mt-3 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Masukkan {parsedPreview.length} Data Ini ke Database Admin</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SCAN QR HP WARGA */}
          {activeTab === 'qr' && (
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 text-xs text-orange-950">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <QrCode className="w-4 h-4 text-orange-600" />
                  Pindai QR Bukti Pendaftaran Warga:
                </p>
                <p className="text-slate-700">
                  Setiap warga yang selesai mendaftar memiliki <strong>QR Code Bukti Registrasi</strong> di layar HP mereka. Arahkan kamera atau unggah foto/screenshot QR tersebut.
                </p>
              </div>

              {/* Camera Scanner View */}
              <div className="flex flex-col items-center">
                <div
                  id={qrContainerId}
                  className="w-full max-w-xs h-64 bg-slate-900 rounded-2xl overflow-hidden border-2 border-orange-400 flex items-center justify-center relative text-white"
                >
                  {!isScanning && (
                    <div className="text-center p-4">
                      <Camera className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-300">Kamera belum aktif</p>
                    </div>
                  )}
                </div>
                <div id="sapa-qr-temp-reader" className="hidden"></div>

                <div className="flex gap-2 mt-3 w-full max-w-xs">
                  {!isScanning ? (
                    <button
                      type="button"
                      onClick={startScanner}
                      className="flex-1 py-2 px-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Buka Kamera Scan</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopScanner}
                      className="flex-1 py-2 px-3 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      <span>Matikan Kamera</span>
                    </button>
                  )}

                  {/* Upload QR Image File */}
                  <label className="flex-1 py-2 px-3 bg-white border-2 border-orange-400 hover:bg-orange-50 text-orange-900 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer text-center">
                    <Upload className="w-4 h-4 text-orange-600" />
                    <span>Unggah Foto QR</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrFileInput}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IMPOR BERKAS CADANGAN */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3 text-xs text-sky-950">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <FileUp className="w-4 h-4 text-sky-600" />
                  Impor Berkas Cadangan (.sapa / .json):
                </p>
                <p className="text-slate-700">
                  Jika ada pengurus RT atau warga yang mengirimkan berkas ekspor cadangan SAPA, Anda dapat mengunggahnya langsung di sini untuk digabungkan secara otomatis.
                </p>
              </div>

              <div className="border-2 border-dashed border-sky-300 rounded-2xl p-6 text-center bg-sky-50/40 hover:bg-sky-50 transition">
                <Upload className="w-10 h-10 text-sky-500 mx-auto mb-2" />
                <h4 className="font-bold text-xs sm:text-sm text-sky-950 mb-1">
                  Pilih Berkas Cadangan SAPA
                </h4>
                <p className="text-[11px] text-slate-500 mb-3">
                  Format berkas: .json atau .sapa
                </p>

                <label className="inline-flex items-center gap-1.5 py-2 px-4 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition">
                  <FileUp className="w-4 h-4" />
                  <span>Jelajahi Berkas</span>
                  <input
                    type="file"
                    accept=".json,.sapa"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-3 sm:p-4 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 italic text-[11px]">
            Data yang dihimpun akan langsung tersimpan permanen di database admin.
          </span>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="py-1.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
