import React from 'react';
import { Sparkles, BookOpen, Heart, Church } from 'lucide-react';

export const KisahStMariaMagdalena: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-orange-100 overflow-hidden text-slate-800 flex flex-col h-full">
      {/* Header Visual Banner */}
      <div className="bg-gradient-to-br from-orange-600 via-amber-600 to-orange-700 p-6 text-white relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-amber-200">
            <Church className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold tracking-widest text-amber-200 uppercase">Santo Pelindung</span>
            <h2 className="text-xl font-extrabold text-white leading-tight">St. Maria Magdalena</h2>
          </div>
        </div>
        <p className="text-xs text-orange-100 leading-relaxed font-medium">
          Pelindung Lingkungan St. Maria Magdalena • Paroki St. Vincentius a Paulo Kediri
        </p>
      </div>

      <div className="p-5 sm:p-6 space-y-5 flex-1 overflow-y-auto text-sm">
        {/* Spiritualitas */}
        <div className="bg-orange-50/80 rounded-xl p-4 border border-orange-200/60">
          <div className="flex items-center gap-2 text-orange-800 font-bold mb-2">
            <Sparkles className="w-4 h-4 text-orange-600" />
            <span>Spiritualitas & Teladan Impian</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            St. Maria Magdalena dikenal sebagai <strong>"Apostolorum Apostola" (Rasul dari para Rasul)</strong>. Beliau adalah murid yang sangat setia mengikut Yesus, berada di kaki Salib Kristus, dan merupakan saksi pertama yang diutus menyampaikan kabar sukacita Kebangkitan Kristus kepada para rasul.
          </p>
        </div>

        {/* Kisah Singkat */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>Kisah Hidup & Keteladanan</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Setelah disembuhkan dan disentuh oleh Kasih Allah, Maria Magdalena mempersembahkan seluruh hidupnya untuk melayani Kristus dan para murid. Kesetiaannya yang tak tergoyahkan mengajarkan kita umat Lingkungan St. Maria Magdalena untuk selalu bertobat, beriman teguh, dan berani bersaksi atas kebaikan Tuhan di tengah masyarakat Kediri.
          </p>
        </div>

        {/* Doa Lingkungan */}
        <div className="bg-amber-50/80 rounded-xl p-4 border border-amber-200/80">
          <div className="flex items-center gap-2 text-amber-900 font-bold mb-2">
            <Heart className="w-4 h-4 text-amber-600" />
            <span>Doa Santo Pelindung Lingkungan</span>
          </div>
          <p className="text-xs italic text-slate-700 leading-relaxed">
            "Ya Santa Maria Magdalena, pendoa dan saksi kebangkitan Kristus, doakanlah seluruh keluarga kami di Lingkungan St. Maria Magdalena - Paroki St. Vincentius a Paulo Kediri. Bimbinglah kami agar selalu hidup rukun, penuh kasih, rajin beribadat, dan setia melayani sesama. Amin."
          </p>
        </div>

        {/* Informasi Paroki */}
        <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-500 flex flex-col gap-1">
          <div className="font-semibold text-slate-700">Gereja Katolik Paroki St. Vincentius a Paulo Kediri</div>
          <div>Wilayah Pelayanan: Wilayah Timur St. Maria Magdalena Kediri</div>
          <div>Sistem Aplikasi Pelayanan Administrasi (SAPA)</div>
        </div>
      </div>
    </div>
  );
};
