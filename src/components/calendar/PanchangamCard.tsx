import React from 'react';
import {
  Clock,
  Sparkles,
  Sun,
  Moon,
  AlertTriangle,
  Compass,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import { getPanchangamTimings } from '../../utils/panchangamEngine';
import { getTamilDate, formatBilingualDate } from '../../utils/tamilCalendar';

interface PanchangamCardProps {
  selectedDateStr: string;
}

export const PanchangamCard: React.FC<PanchangamCardProps> = ({ selectedDateStr }) => {
  const panchangam = getPanchangamTimings(selectedDateStr);
  const tamilDate = getTamilDate(selectedDateStr);
  const bilingual = formatBilingualDate(selectedDateStr);

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xl transition-all">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Sun className="w-4 h-4" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Traditional Tamil Panchangam
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300">
              தினசரி பஞ்சாங்கம்
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
            {bilingual.englishFormatted}
            <span className="ml-2 text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">
              • {tamilDate.tamilMonthTa} {tamilDate.tamilDay} ({tamilDate.dayOfWeekTa})
            </span>
          </h3>
        </div>

        {/* Tithi & Nakshatra Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1 rounded-xl bg-brand-500/10 border border-brand-500/30 text-xs font-bold text-brand-700 dark:text-brand-300 flex items-center gap-1.5">
            <Moon className="w-3.5 h-3.5 text-brand-500" />
            <span>திதி: {panchangam.tithiTa}</span>
          </div>
          <div className="px-3 py-1 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>நட்சத்திரம்: {panchangam.nakshatramTa}</span>
          </div>
        </div>
      </div>

      {/* Grid of Key Auspicious and Inauspicious Timings (2x2 Grid for spacious alignment) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-5">
        {/* 1. Nalla Neram */}
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              நல்ல நேரம்
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 uppercase">
              Auspicious
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-800 dark:text-slate-200">
              <span className="text-slate-600 dark:text-slate-400 font-medium">காலை:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{panchangam.nallaNeramMorning}</span>
            </div>
            <div className="flex justify-between items-center text-slate-800 dark:text-slate-200">
              <span className="text-slate-600 dark:text-slate-400 font-medium">மாலை:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{panchangam.nallaNeramEvening}</span>
            </div>
          </div>
          <div className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold pt-1 border-t border-emerald-500/20">
            Optimal for starting workouts or heavy sets.
          </div>
        </div>

        {/* 2. Ragukalam */}
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              இராகு காலம்
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-700 dark:text-rose-300 uppercase">
              Avoid
            </span>
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-rose-700 dark:text-rose-300 tracking-tight">
            {panchangam.ragukalam}
          </div>
          <div className="text-[10px] text-rose-800 dark:text-rose-300 font-medium">
            Avoid signing new agreements or high-risk max attempts.
          </div>
        </div>

        {/* 3. Yemagandam */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              எமகண்டம்
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 uppercase">
              Caution
            </span>
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-amber-800 dark:text-amber-300 tracking-tight">
            {panchangam.yemagandam}
          </div>
          <div className="text-[10px] text-amber-800 dark:text-amber-300 font-medium">
            Focus on steady, controlled form and hydration.
          </div>
        </div>

        {/* 4. Kuligai */}
        <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-teal-400" />
              குளிகை காலம்
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-teal-500/20 text-teal-700 dark:text-teal-300 uppercase">
              Growth
            </span>
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-teal-800 dark:text-teal-300 tracking-tight">
            {panchangam.kuligai}
          </div>
          <div className="text-[10px] text-teal-800 dark:text-teal-300 font-medium">
            Actions repeated multiply: great for healthy habits!
          </div>
        </div>
      </div>

      {/* Gowri & Chandrashtamam Strip */}
      <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            கௌரி நல்ல நேரம்:
          </span>
          <span className="font-mono text-slate-600 dark:text-slate-400">
            காலை: <strong className="text-slate-800 dark:text-slate-200">{panchangam.gowriNallaNeramMorning}</strong>
          </span>
          <span className="text-slate-400">•</span>
          <span className="font-mono text-slate-600 dark:text-slate-400">
            மாலை: <strong className="text-slate-800 dark:text-slate-200">{panchangam.gowriNallaNeramEvening}</strong>
          </span>
        </div>

        {panchangam.chandrashtamamRasiTa && (
          <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-semibold bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>சந்திராஷ்டமம்: <strong>{panchangam.chandrashtamamRasiTa}</strong> ({panchangam.chandrashtamamRasiEn})</span>
          </div>
        )}
      </div>
    </div>
  );
};
