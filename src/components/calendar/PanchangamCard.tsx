import React from 'react';
import {
  Sparkles,
  Sun,
  Moon,
  AlertTriangle,
  Compass,
  ShieldAlert,
} from 'lucide-react';
import type { TamilDateInfo } from '../../utils/tamilCalendar';
import CalendarDayThumbnail, {
  getCalendarDayThumbnail,
} from './CalendarDayThumbnail';

interface PanchangamCardProps {
  dayInfo: TamilDateInfo;
  className?: string;
}

export const PanchangamCard: React.FC<PanchangamCardProps> = ({ dayInfo, className = '' }) => {
  const { panchangam } = dayInfo;
  const thumbnail = getCalendarDayThumbnail(dayInfo);

  return (
    <div
      className={`rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-5 transition-all ${className}`}
    >
      {/* Panchangam Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20 flex-shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                தினசரி பஞ்சாங்கம் (Daily Panchangam)
              </h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-500/30">
                {dayInfo.tamilDayName}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {dayInfo.tamilYearName} வருடம் • {dayInfo.tamilMonthName} மாதம் {dayInfo.tamilDate}-ஆம் நாள் ({dayInfo.gregorianDate})
            </p>
          </div>
        </div>

        {/* Sunrise / Sunset */}
        <div className="flex items-center gap-3 self-start sm:self-auto text-xs bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
            <Sun className="w-3.5 h-3.5" />
            <span>உதயம்: {panchangam.sunrise}</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
            <Moon className="w-3.5 h-3.5" />
            <span>அஸ்தமனம்: {panchangam.sunset}</span>
          </div>
        </div>
      </div>

      {/* Sacred Day Deity / Occasion Highlight Card */}
      {thumbnail && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300 dark:border-amber-500/30 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <CalendarDayThumbnail info={thumbnail} size="md" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-200">
                  {thumbnail.titleTamil}
                </span>
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                  • {thumbnail.titleEnglish}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                {thumbnail.reason}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 shadow-xs flex-shrink-0">
            புனித நாள்
          </span>
        </div>
      )}

      {/* Auspicious & Inauspicious Timings Split View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AUSPICIOUS TIMINGS (சுப நேரங்கள்) */}
        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/15 border border-emerald-200/80 dark:border-emerald-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>சுப நேரங்கள் (Auspicious Slots)</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20">
              Shubh Muhurtham
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Nalla Neram */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-500/10 flex items-center justify-between shadow-xs">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">நல்ல நேரம் (Nalla Neram)</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">காலை & மாலை சுப முகூர்த்தம்</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 block text-[11px]">
                  காலை: {panchangam.nallaNeramMorning}
                </span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 block text-[11px]">
                  மாலை: {panchangam.nallaNeramEvening}
                </span>
              </div>
            </div>

            {/* Gowri Nalla Neram */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-500/10 flex items-center justify-between shadow-xs">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">கௌரி நல்ல நேரம் (Gowri Neram)</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">மங்கலகரமான விசேஷ நேரம்</span>
              </div>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                {panchangam.gowriNallaNeram}
              </span>
            </div>

            {/* Kuligai */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-500/10 flex items-center justify-between shadow-xs">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">குளிகை (Kuligai)</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">வளர்ச்சி & பன்மடங்கு பெருக்கும்</span>
              </div>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                {panchangam.kuligai}
              </span>
            </div>
          </div>
        </div>

        {/* INAUSPICIOUS TIMINGS (அசுப நேரங்கள்) */}
        <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/15 border border-rose-200/80 dark:border-rose-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-rose-800 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>கவனிக்க வேண்டிய நேரங்கள் (Caution Slots)</span>
            </span>
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/20">
              Varjyam
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Ragukalam */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-500/10 flex items-center justify-between shadow-xs">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">இராகு காலம் (Ragukalam)</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">புதிய முயற்சிகள் தவிர்க்கவும்</span>
              </div>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs">
                {panchangam.ragukalam}
              </span>
            </div>

            {/* Yemagandam */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-500/10 flex items-center justify-between shadow-xs">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">எமகண்டம் (Yemagandam)</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">பயணங்கள் & முக்கிய விவாதங்கள் தவிர்ப்பு</span>
              </div>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs">
                {panchangam.yemagandam}
              </span>
            </div>

            {/* Chandrashtamam Advisory Pill */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/20 flex items-center justify-between shadow-xs">
              <div>
                <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  <span>சந்திராஷ்டமம் (Chandrashtamam)</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {panchangam.chandrashtamamRasi.nameTamil} ராசியினருக்கு எச்சரிக்கை
                </span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">
                {panchangam.chandrashtamamRasi.nameTamil} ({panchangam.chandrashtamamRasi.nameEnglish})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Celestial Panchangam 4-Grid Attributes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Thithi */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            திதி (Thithi)
          </span>
          <span className="font-bold text-slate-900 dark:text-white block text-sm">
            {panchangam.thithi.nameTamil}
          </span>
          <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold block mt-0.5">
            {panchangam.thithi.paksham}
          </span>
        </div>

        {/* Nakshatram */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            நட்சத்திரம் (Nakshatra)
          </span>
          <span className="font-bold text-slate-900 dark:text-white block text-sm">
            {panchangam.nakshatram.nameTamil}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
            {panchangam.nakshatram.nameEnglish} • பாதம் {panchangam.nakshatram.pada}
          </span>
        </div>

        {/* Yogam */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            யோகம் (Yogam)
          </span>
          <span className="font-bold text-slate-900 dark:text-white block text-sm">
            {panchangam.yogam.nameTamil}
          </span>
          <span
            className={`text-[11px] font-semibold block mt-0.5 ${
              panchangam.yogam.isAuspicious
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {panchangam.yogam.isAuspicious ? 'நற்பலன் தரும் யோகம்' : 'நிதானம் தேவை'}
          </span>
        </div>

        {/* Tamil Solar Date */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            தமிழ் தேதி (Tamil Solar Date)
          </span>
          <span className="font-bold text-slate-900 dark:text-white block text-sm">
            {dayInfo.tamilMonthName} {dayInfo.tamilDate}
          </span>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold block mt-0.5">
            {dayInfo.tamilMonthEnglish} Month
          </span>
        </div>
      </div>
    </div>
  );
};

export default PanchangamCard;
