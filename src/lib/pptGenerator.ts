import pptxgen from 'pptxgenjs';

export async function generateSapaPresentation(): Promise<void> {
  const pptx = new pptxgen();

  // Widescreen 16:9 layout (13.333 x 7.5 inches)
  pptx.defineLayout({ name: 'WIDE_16_9', width: 13.333, height: 7.5 });
  pptx.layout = 'WIDE_16_9';
  pptx.title = 'Panduan & Tutorial SAPA Lingkungan St. Maria Magdalena';
  pptx.author = 'Pengurus Lingkungan St. Maria Magdalena';
  pptx.company = 'Paroki St. Vincentius a Paulo Kediri';

  // --- Theme Colors ---
  const COLOR_PRIMARY = 'D97706';   // Amber / Orange
  const COLOR_SECONDARY = 'EA580C'; // Dark Orange
  const COLOR_DARK = '1E293B';      // Slate Dark Text
  const COLOR_LIGHT = 'F8FAFC';     // Light Background
  const COLOR_MUTED = '475569';     // Muted Gray Text
  const COLOR_BLUE = '2563EB';      // Blue Accent

  // Helper function for slide titles
  const addSlideHeader = (slide: pptxgen.Slide, category: string, title: string, subtitle: string) => {
    slide.addText(category.toUpperCase(), {
      x: 0.8,
      y: 0.4,
      w: 11.733,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: COLOR_PRIMARY,
      fontFace: 'Arial'
    });

    slide.addText(title, {
      x: 0.8,
      y: 0.7,
      w: 11.733,
      h: 0.5,
      fontSize: 22,
      bold: true,
      color: COLOR_DARK,
      fontFace: 'Arial'
    });

    slide.addText(subtitle, {
      x: 0.8,
      y: 1.2,
      w: 11.733,
      h: 0.3,
      fontSize: 12,
      color: COLOR_MUTED,
      fontFace: 'Arial'
    });

    slide.addShape(pptx.ShapeType.rect, {
      x: 0.8,
      y: 1.55,
      w: 2.2,
      h: 0.04,
      fill: { color: COLOR_PRIMARY }
    });
  };

  // ================= SLIDE 1: COVER =================
  const slide1 = pptx.addSlide();
  slide1.background = { color: '1E1B4B' };

  slide1.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.15,
    fill: { color: COLOR_PRIMARY }
  });

  slide1.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 0.8,
    w: 5.2,
    h: 0.45,
    fill: { color: '2E2A72' },
    line: { color: COLOR_PRIMARY, width: 1 }
  });

  slide1.addText('PANDUAN & TUTORIAL PENGGUNAAN LENGKAP', {
    x: 1.0,
    y: 0.88,
    w: 4.8,
    h: 0.3,
    fontSize: 11,
    bold: true,
    color: 'FCD34D',
    fontFace: 'Arial'
  });

  slide1.addText('SAPA LINGKUNGAN ST. MARIA MAGDALENA', {
    x: 0.8,
    y: 1.6,
    w: 11.733,
    h: 1.3,
    fontSize: 30,
    bold: true,
    color: 'FFFFFF',
    fontFace: 'Arial'
  });

  slide1.addText('Sistem Informasi Administrasi Umat, Kartu Keluarga Digital & Warta Paroki Interaktif', {
    x: 0.8,
    y: 2.9,
    w: 11.733,
    h: 0.7,
    fontSize: 17,
    bold: true,
    color: 'FCD34D',
    fontFace: 'Arial'
  });

  slide1.addText('Paroki St. Vincentius a Paulo Kediri • Lingkungan St. Maria Magdalena', {
    x: 0.8,
    y: 3.8,
    w: 11.733,
    h: 0.5,
    fontSize: 14,
    color: 'E2E8F0',
    fontFace: 'Arial'
  });

  slide1.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 5.0,
    w: 11.733,
    h: 1.6,
    fill: { color: '2E2A72' },
    line: { color: COLOR_PRIMARY, width: 1.5 }
  });

  slide1.addText('Panduan PPT ini mencakup:\n1. Akses Login & Hak Akses Role  •  2. Panduan Umat / Warga  •  3. Panduan Pengurus Lingkungan\n4. Fitur Cetak KK Digital (PDF)  •  5. Pengolahan Inventaris & Sinkronisasi Cloud Firestore', {
    x: 1.1,
    y: 5.2,
    w: 11.133,
    h: 1.2,
    fontSize: 13,
    color: 'FFFFFF',
    fontFace: 'Arial'
  });

  // ================= SLIDE 2: LOGIN & HAK AKSES =================
  const slide2 = pptx.addSlide();
  slide2.background = { color: COLOR_LIGHT };
  addSlideHeader(slide2, 'PANDUAN 1: HAK AKSES & LOGIN', 'Sistem Akses Login Bertingkat (Role-Based)', 'Pemisahan hak akses demi keamanan data pribadi warga dan kelancaran administrasi');

  // Warga Role Box
  slide2.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.8,
    w: 5.6,
    h: 5.0,
    fill: { color: 'EFF6FF' },
    line: { color: '3B82F6', width: 1.5 }
  });

  slide2.addText('1. Akses Umat / Warga (Read-Only)', {
    x: 1.1,
    y: 2.0,
    w: 5.0,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: '1D4ED8',
    fontFace: 'Arial'
  });

  const wargaPoints = [
    { text: '• Username Default: warga  |  Password: warga123\n', options: { fontSize: 12, bold: true, color: COLOR_DARK } },
    { text: '• Membaca Beranda Warta Paroki & Poster Flyer\n', options: { fontSize: 12, color: COLOR_DARK } },
    { text: '• Mencari Data KK & Status 7 Sakramen Mandiri\n', options: { fontSize: 12, color: COLOR_DARK } },
    { text: '• Mencetak Kartu Keluarga Digital (PDF)\n', options: { fontSize: 12, color: COLOR_DARK } },
    { text: '• Mengajukan Layanan Surat/Pengantar ke Pengurus', options: { fontSize: 12, color: COLOR_DARK } }
  ];
  slide2.addText(wargaPoints, { x: 1.1, y: 2.5, w: 5.0, h: 4.0, fontFace: 'Arial' });

  // Pengurus Role Box
  slide2.addShape(pptx.ShapeType.roundRect, {
    x: 6.9,
    y: 1.8,
    w: 5.6,
    h: 5.0,
    fill: { color: 'FFF7ED' },
    line: { color: COLOR_PRIMARY, width: 1.5 }
  });

  slide2.addText('2. Akses Pengurus Lingkungan (Admin)', {
    x: 7.2,
    y: 2.0,
    w: 5.0,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: COLOR_SECONDARY,
    fontFace: 'Arial'
  });

  const pengurusPoints = [
    { text: '• Username Default: pengurus  |  Password: pengurus123\n', options: { fontSize: 12, bold: true, color: COLOR_DARK } },
    { text: '• Tambah, Edit, Hapus Data KK & Anggota Keluarga\n', options: { fontSize: 12, color: COLOR_DARK } },
    { text: '• Menerbitkan Warta & Upload Gambar Poster Flyer\n', options: { fontSize: 12, color: COLOR_DARK } },
    { text: '• Kelola Inventaris Barang & Laporan Keuangan\n', options: { fontSize: 12, color: COLOR_DARK } },
    { text: '• Akses Sinkronisasi Realtime Google Cloud Firestore', options: { fontSize: 12, color: COLOR_DARK } }
  ];
  slide2.addText(pengurusPoints, { x: 7.2, y: 2.5, w: 5.0, h: 4.0, fontFace: 'Arial' });

  // ================= SLIDE 3: WARGA - WARTA & FLYER =================
  const slide3 = pptx.addSlide();
  slide3.background = { color: COLOR_LIGHT };
  addSlideHeader(slide3, 'PANDUAN 2: WARGA / UMAT', 'Beranda Warta Paroki & Poster Flyer Interaktif', 'Akses berita paroki, pengumuman misa, dan gambar flyer kegiatan lingkungan');

  const wartaSteps = [
    { num: '01', title: 'Akses Papan Informasi', desc: 'Buka Halaman Warta di beranda utama untuk melihat jadwal misa, doa rosario, dan pengumuman katekese.' },
    { num: '02', title: 'Filter Kategori', desc: 'Gunakan tombol filter untuk memilah pengumuman Misa, Kegiatan Lingkungan, atau Berita Paroki.' },
    { num: '03', title: 'Pop-Up Perbesar Gambar', desc: 'Klik pada gambar Poster/Flyer untuk membuka tampilan fullscreen beresolusi tinggi di layar.' },
    { num: '04', title: 'Responsif Mobile', desc: 'Dapat diakses dengan nyaman melalui layar Smartphone, Tablet, maupun Laptop.' }
  ];

  wartaSteps.forEach((st, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.8 + col * 6.1;
    const y = 1.8 + row * 2.5;

    slide3.addShape(pptx.ShapeType.roundRect, {
      x, y, w: 5.6, h: 2.2, fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 1 }
    });

    slide3.addText(st.num, {
      x: x + 0.3, y: y + 0.2, w: 0.8, h: 0.4, fontSize: 18, bold: true, color: COLOR_PRIMARY, fontFace: 'Arial'
    });

    slide3.addText(st.title, {
      x: x + 1.2, y: y + 0.2, w: 4.0, h: 0.4, fontSize: 15, bold: true, color: COLOR_DARK, fontFace: 'Arial'
    });

    slide3.addText(st.desc, {
      x: x + 0.3, y: y + 0.7, w: 5.0, h: 1.2, fontSize: 12, color: COLOR_MUTED, fontFace: 'Arial'
    });
  });

  // ================= SLIDE 4: WARGA - PENCARIAN & CETAK KK =================
  const slide4 = pptx.addSlide();
  slide4.background = { color: COLOR_LIGHT };
  addSlideHeader(slide4, 'PANDUAN 3: WARGA / UMAT', 'Pencarian Data KK & Cetak Kartu Keluarga (PDF)', 'Mencari data keluarga instan dan mengunduh berkas KK Digital standar Paroki');

  slide4.addTable(
    [
      [
        { text: 'Langkah', options: { fill: { color: COLOR_PRIMARY }, color: 'FFFFFF', bold: true, fontSize: 13 } },
        { text: 'Fitur Utama', options: { fill: { color: COLOR_PRIMARY }, color: 'FFFFFF', bold: true, fontSize: 13 } },
        { text: 'Petunjuk Penggunaan', options: { fill: { color: COLOR_PRIMARY }, color: 'FFFFFF', bold: true, fontSize: 13 } }
      ],
      [
        { text: '1', options: { fontSize: 12, bold: true, color: COLOR_DARK } },
        { text: 'Cari Data Keluarga', options: { fontSize: 12, bold: true, color: COLOR_DARK } },
        { text: 'Ketikkan NIK, Nomor KK, atau Nama Kepala Keluarga pada kolom pencarian instan.', options: { fontSize: 12, color: COLOR_DARK } }
      ],
      [
        { text: '2', options: { fontSize: 12, bold: true, color: COLOR_DARK } },
        { text: 'Periksa Status Sakramen', options: { fontSize: 12, bold: true, color: COLOR_DARK } },
        { text: 'Klik "Detail Keluarga" untuk melihat tanggal dan status penerimaan 7 Sakramen Gereja.', options: { fontSize: 12, color: COLOR_DARK } }
      ],
      [
        { text: '3', options: { fontSize: 12, bold: true, color: COLOR_DARK } },
        { text: 'Cetak Kartu Keluarga PDF', options: { fontSize: 12, bold: true, color: COLOR_DARK } },
        { text: 'Tekan tombol "Cetak KK (PDF)" untuk mengunduh dokumen resmi standar Paroki Kediri.', options: { fontSize: 12, color: COLOR_DARK } }
      ],
      [
        { text: '4', options: { fontSize: 12, bold: true, color: COLOR_DARK } },
        { text: 'Format Layout Rapi', options: { fontSize: 12, bold: true, color: COLOR_DARK } },
        { text: 'PDF dirancang dengan batas margin A4 presisi, bebas terpotong, dan siap dicetak.', options: { fontSize: 12, color: COLOR_DARK } }
      ]
    ],
    {
      x: 0.8, y: 1.8, w: 11.733, h: 4.8, colW: [1.2, 3.5, 7.033], border: { pt: 1, color: 'CBD5E1' }
    }
  );

  // ================= SLIDE 5: WARGA - PENGAJUAN SURAT =================
  const slide5 = pptx.addSlide();
  slide5.background = { color: COLOR_LIGHT };
  addSlideHeader(slide5, 'PANDUAN 4: WARGA / UMAT', 'Formulir Permohonan Surat & Layanan Umat', 'Mengajukan permohonan surat pengantar sakramen dan doa ke pengurus lingkungan');

  const suratBoxes = [
    { title: 'Surat Pengantar Sakramen', desc: 'Permohonan Surat Pengantar Baptis Bayi/Dewasa, Krisma, Pernikahan, atau Komuni Pertama.' },
    { title: 'Permohonan Doa & Misa', desc: 'Pengajuan intension Doa Arwah, Peringatan Meninggal, Syukuran Rumah, atau Pengandutan.' },
    { title: 'Pembaruan Data Keluarga', desc: 'Pengajuan perubahan data NIK, alamat RT/RW, kelahiran anak, atau pendaftaran anggota KK baru.' }
  ];

  suratBoxes.forEach((sb, idx) => {
    const x = 0.8 + idx * 4.0;
    slide5.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.8, w: 3.733, h: 4.8, fill: { color: 'FFFFFF' }, line: { color: 'CBD5E1', width: 1 }
    });

    slide5.addText(sb.title, {
      x: x + 0.3, y: 2.1, w: 3.133, h: 0.5, fontSize: 15, bold: true, color: COLOR_SECONDARY, fontFace: 'Arial'
    });

    slide5.addText(sb.desc, {
      x: x + 0.3, y: 2.7, w: 3.133, h: 3.5, fontSize: 12, color: COLOR_DARK, fontFace: 'Arial'
    });
  });

  // ================= SLIDE 6: PENGURUS - KELOLA KK & SAKRAMEN =================
  const slide6 = pptx.addSlide();
  slide6.background = { color: COLOR_LIGHT };
  addSlideHeader(slide6, 'PANDUAN 5: PENGURUS LINGKUNGAN', 'Pengelolaan Data KK, NIK & Status 7 Sakramen', 'Manajemen pendataan seluruh warga lingkungan St. Maria Magdalena');

  slide6.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: 1.8, w: 11.733, h: 5.0, fill: { color: 'FFFFFF' }, line: { color: COLOR_PRIMARY, width: 1.5 }
  });

  const pengurusSteps = [
    { text: '1. Menambah Kartu Keluarga Baru:\n   Klik "+ Tambah KK Baru", isi nomor KK, nama kepala keluarga, RT/RW, dan anggota keluarga.\n', options: { fontSize: 13, color: COLOR_DARK } },
    { text: '2. Hitung Usia Otomatis:\n   Sistem secara otomatis menghitung usia dan mengelompokkan kategori umur (Anak/Remaja/Lansia).\n', options: { fontSize: 13, color: COLOR_DARK } },
    { text: '3. Pendataan 7 Sakramen Gereja:\n   Centang dan isi tanggal penerimaan Baptis, Krisma, Ekaristi, Pengakuan Dosa, Imamat, Nikah, & Minyak Suci.\n', options: { fontSize: 13, color: COLOR_DARK } },
    { text: '4. Edit & Hapus Data:\n   Pengurus memiliki kewenangan penuh untuk memperbarui data saat terjadi perubahan status warga.', options: { fontSize: 13, color: COLOR_DARK } }
  ];

  slide6.addText(pengurusSteps, { x: 1.2, y: 2.1, w: 10.933, h: 4.4, fontFace: 'Arial' });

  // ================= SLIDE 7: PENGURUS - PUBLIKASI WARTA =================
  const slide7 = pptx.addSlide();
  slide7.background = { color: COLOR_LIGHT };
  addSlideHeader(slide7, 'PANDUAN 6: PENGURUS LINGKUNGAN', 'Publikasi Warta & Upload Poster Flyer Gambar', 'Menerbitkan pengumuman resmi dan mengunggah poster kegiatan paroki');

  const wartaPubSteps = [
    { num: 'A', title: 'Tulis Pengumuman / Warta', desc: 'Isi judul warta, tanggal kegiatan, lokasi acara, dan penjelasan lengkap pesan warta.' },
    { num: 'B', title: 'Upload Poster Flyer Gambar', desc: 'Pilih file gambar poster (JPG/PNG). Sistem akan mengompresi gambar otomatis.' },
    { num: 'C', title: 'Pilih Kategori Warta', desc: 'Tentukan kategori Misa, Doa Lingkungan, Katekese, atau Pengumuman Darurat.' },
    { num: 'D', title: 'Publikasi & Edit/Hapus', desc: 'Klik "Terbitkan". Warta lama dapat diubah atau dihapus kapan saja oleh pengurus.' }
  ];

  wartaPubSteps.forEach((wp, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.8 + col * 6.1;
    const y = 1.8 + row * 2.5;

    slide7.addShape(pptx.ShapeType.roundRect, {
      x, y, w: 5.6, h: 2.2, fill: { color: 'FEF3C7' }, line: { color: COLOR_PRIMARY, width: 1 }
    });

    slide7.addText(wp.num, {
      x: x + 0.3, y: y + 0.2, w: 0.6, h: 0.4, fontSize: 18, bold: true, color: COLOR_SECONDARY, fontFace: 'Arial'
    });

    slide7.addText(wp.title, {
      x: x + 1.0, y: y + 0.2, w: 4.2, h: 0.4, fontSize: 15, bold: true, color: COLOR_DARK, fontFace: 'Arial'
    });

    slide7.addText(wp.desc, {
      x: x + 0.3, y: y + 0.7, w: 5.0, h: 1.2, fontSize: 12, color: COLOR_DARK, fontFace: 'Arial'
    });
  });

  // ================= SLIDE 8: INVENTARIS & GRAFIK DEMOGRAFI =================
  const slide8 = pptx.addSlide();
  slide8.background = { color: COLOR_LIGHT };
  addSlideHeader(slide8, 'PANDUAN 7: PENGURUS LINGKUNGAN', 'Pendataan Inventaris Barang & Laporan Demografi', 'Inventarisasi alat ibadat dan laporan grafik statistik demografi warga');

  // Left Box: Inventaris
  slide8.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: 1.8, w: 5.6, h: 5.0, fill: { color: 'FFFFFF' }, line: { color: 'CBD5E1', width: 1 }
  });

  slide8.addText('1. Inventaris Barang Lingkungan', {
    x: 1.1, y: 2.0, w: 5.0, h: 0.4, fontSize: 15, bold: true, color: COLOR_SECONDARY, fontFace: 'Arial'
  });

  const invList = [
    { text: '• Pencatatan perlengkapan ibadat (Salib, Lilin, Taplak Altar, Sound System Portable, Piala)\n', options: { fontSize: 12, color: COLOR_DARK } },
    { text: '• Pemantauan jumlah barang dan lokasi penyimpanan\n', options: { fontSize: 12, color: COLOR_DARK } },
    { text: '• Status kondisi barang: Baik / Rusak / Perlu Perbaikan', options: { fontSize: 12, color: COLOR_DARK } }
  ];
  slide8.addText(invList, { x: 1.1, y: 2.5, w: 5.0, h: 4.0, fontFace: 'Arial' });

  // Right Box: Grafik Demografi
  slide8.addShape(pptx.ShapeType.roundRect, {
    x: 6.9, y: 1.8, w: 5.6, h: 5.0, fill: { color: 'FFFFFF' }, line: { color: 'CBD5E1', width: 1 }
  });

  slide8.addText('2. Grafik Demografi & Statistik', {
    x: 7.2, y: 2.0, w: 5.0, h: 0.4, fontSize: 15, bold: true, color: COLOR_PRIMARY, fontFace: 'Arial'
  });

  const statList = [
    { text: '• Grafik distribusi kelompok umur (Anak, Remaja, Orang Tua, Lansia)\n', options: { fontSize: 12, color: COLOR_DARK } },
    { text: '• Rekapitulasi jumlah penerima Sakramen Baptis, Krisma, & Pernikahan\n', options: { fontSize: 12, color: COLOR_DARK } },
    { text: '• Pemetaan jumlah KK per wilayah RT/RW Lingkungan', options: { fontSize: 12, color: COLOR_DARK } }
  ];
  slide8.addText(statList, { x: 7.2, y: 2.5, w: 5.0, h: 4.0, fontFace: 'Arial' });

  // ================= SLIDE 9: ARSITEKTUR HYBRID & CLOUD SYNC =================
  const slide9 = pptx.addSlide();
  slide9.background = { color: COLOR_LIGHT };
  addSlideHeader(slide9, 'PANDUAN 8: TEKNOLOGI & SINKRONISASI', 'Arsitektur Hybrid SQLite & Google Cloud Firestore', 'Kombinasi kecepatan database lokal dengan keandalan simpan online Cloud Server');

  slide9.addTable(
    [
      [
        { text: 'Fitur Sistem', options: { fill: { color: COLOR_PRIMARY }, color: 'FFFFFF', bold: true, fontSize: 13 } },
        { text: 'Database Lokal (SQLite)', options: { fill: { color: COLOR_PRIMARY }, color: 'FFFFFF', bold: true, fontSize: 13 } },
        { text: 'Cloud Server (Firestore)', options: { fill: { color: COLOR_PRIMARY }, color: 'FFFFFF', bold: true, fontSize: 13 } }
      ],
      [
        { text: 'Kecepatan Akses', options: { fontSize: 12, bold: true, color: COLOR_DARK } },
        { text: 'Sangat Cepat (Instan / WASM)', options: { fontSize: 12, color: COLOR_DARK } },
        { text: 'Realtime Sync Jaringan', options: { fontSize: 12, color: COLOR_DARK } }
      ],
      [
        { text: 'Akses Tanpa Sinyal', options: { fontSize: 12, bold: true, color: COLOR_DARK } },
        { text: 'Tetap Berfungsi 100% Offline', options: { fontSize: 12, color: COLOR_DARK } },
        { text: 'Otomatis Sync saat Online', options: { fontSize: 12, color: COLOR_DARK } }
      ],
      [
        { text: 'Rekonsiliasi Data', options: { fontSize: 12, bold: true, color: COLOR_DARK } },
        { text: 'Tersimpan lokal di Browser', options: { fontSize: 12, color: COLOR_DARK } },
        { text: 'Tombol "Tarik Data Cloud"', options: { fontSize: 12, color: COLOR_DARK } }
      ]
    ],
    {
      x: 0.8, y: 1.8, w: 11.733, h: 4.8, colW: [3.0, 4.366, 4.366], border: { pt: 1, color: 'CBD5E1' }
    }
  );

  // ================= SLIDE 10: RANGKUMAN & PENUTUP =================
  const slide10 = pptx.addSlide();
  slide10.background = { color: '1E1B4B' };

  slide10.addText('RANGKUMAN & KESIMPULAN', {
    x: 0.8, y: 0.5, w: 11.733, h: 0.3, fontSize: 11, bold: true, color: 'FCD34D', fontFace: 'Arial'
  });

  slide10.addText('SAPA Lingkungan St. Maria Magdalena Kediri', {
    x: 0.8, y: 0.8, w: 11.733, h: 0.6, fontSize: 24, bold: true, color: 'FFFFFF', fontFace: 'Arial'
  });

  slide10.addShape(pptx.ShapeType.rect, {
    x: 0.8, y: 1.5, w: 2.2, h: 0.05, fill: { color: COLOR_PRIMARY }
  });

  const conclusions = [
    { title: '1. Pelayanan Umat Efisien', desc: 'Prosedur pendataan, pencarian NIK/KK, dan cetak Kartu Keluarga Digital selesai dalam hitungan detik.' },
    { title: '2. Informasi Transparan', desc: 'Warta Paroki, jadwal Misa, dan flyer kegiatan lingkungan tersampaikan cepat ke seluruh keluarga.' },
    { title: '3. Data Aman & Rapi', desc: 'Penyimpanan hybrid terenkripsi dengan pemisahan hak akses role warga dan pengurus yang jelas.' }
  ];

  conclusions.forEach((item, idx) => {
    const x = 0.8 + idx * 4.0;
    slide10.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.8, w: 3.733, h: 3.6, fill: { color: '2E2A72' }, line: { color: COLOR_PRIMARY, width: 1 }
    });

    slide10.addText(item.title, {
      x: x + 0.25, y: 2.1, w: 3.233, h: 0.5, fontSize: 15, bold: true, color: 'FCD34D', fontFace: 'Arial'
    });

    slide10.addText(item.desc, {
      x: x + 0.25, y: 2.7, w: 3.233, h: 2.4, fontSize: 12, color: 'E2E8F0', fontFace: 'Arial'
    });
  });

  slide10.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: 5.7, w: 11.733, h: 1.1, fill: { color: '2E2A72' }, line: { color: 'FCD34D', width: 1.5 }
  });

  slide10.addText('Terima Kasih - Berkah Dalem\nPengurus Lingkungan St. Maria Magdalena • Paroki St. Vincentius a Paulo Kediri', {
    x: 0.8, y: 5.85, w: 11.733, h: 0.8, fontSize: 15, bold: true, align: 'center', color: 'FBBF24', fontFace: 'Arial'
  });

  // Export Downloadable PowerPoint (.pptx) file
  await pptx.writeFile({ fileName: 'Panduan_Tutorial_SAPA_Lingkungan_St_Maria_Magdalena.pptx' });
}
