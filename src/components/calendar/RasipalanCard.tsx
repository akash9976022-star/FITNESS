import React, { useState } from 'react';
import {
  Dumbbell,
  Utensils,
  Heart,
  Activity,
} from 'lucide-react';
import { TAMIL_RASIS } from '../../utils/tamilCalendar';

interface RasipalanCardProps {
  className?: string;
  initialRasiId?: string;
}

export const RasipalanCard: React.FC<RasipalanCardProps> = ({
  className = '',
  initialRasiId = 'mesham',
}) => {
  const [selectedRasiId, setSelectedRasiId] = useState<string>(() => {
    return localStorage.getItem('fit_selected_rasi') || initialRasiId;
  });

  const selectedRasi =
    TAMIL_RASIS.find((r) => r.id === selectedRasiId) || TAMIL_RASIS[0];

  const handleSelectRasi = (id: string) => {
    setSelectedRasiId(id);
    localStorage.setItem('fit_selected_rasi', id);
  };

  return (
    <div
      className={`rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-5 transition-all ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-black shadow-md shadow-purple-500/20 flex-shrink-0 text-xl">
            <span>{selectedRasi.symbol}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                ராசிபலன் & ஆரோக்கிய வழிகாட்டல் (Rasipalan Health Engine)
              </h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/15 text-purple-800 dark:text-purple-400 border border-purple-500/30">
                12 Rasis
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Traditional astrological physical energy forecasting, workout intensity pacing, and dietary nourishment.
            </p>
          </div>
        </div>

        {/* Selected Rasi Vitality Score */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 dark:bg-slate-950 px-3.5 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Activity className="w-4 h-4 text-emerald-500" />
          <div className="text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">
              Vitality Meter
            </span>
            <span className="font-black text-slate-900 dark:text-white text-sm">
              {selectedRasi.vitalityScore}%
            </span>
          </div>
        </div>
      </div>

      {/* 12 Rasis Interactive Horizontal Grid Selector */}
      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
          உங்கள் ராசியைத் தேர்ந்தெடுக்கவும் (Select Zodiac Sign)
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1.5">
          {TAMIL_RASIS.map((rasi) => {
            const isSelected = rasi.id === selectedRasi.id;
            return (
              <button
                key={rasi.id}
                type="button"
                onClick={() => handleSelectRasi(rasi.id)}
                className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-md scale-102 ring-2 ring-emerald-500/50'
                    : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <span className="text-base leading-none mb-1">{rasi.symbol}</span>
                <span className="text-[11px] font-black tracking-tight leading-none">
                  {rasi.nameTamil}
                </span>
                <span
                  className={`text-[9px] font-medium leading-tight mt-0.5 truncate w-full text-center ${
                    isSelected ? 'text-slate-300 dark:text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {rasi.nameEnglish}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Rasi Detailed Health & Maintenance Breakdown */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4">
        {/* Banner with Meta Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{selectedRasi.symbol}</span>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{selectedRasi.nameTamil} ({selectedRasi.nameEnglish} - {selectedRasi.westernSign})</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                அதிபதி (Ruler): <strong className="text-slate-800 dark:text-slate-200">{selectedRasi.rulingPlanetTamil} ({selectedRasi.rulingPlanet})</strong> • பூதம்: {selectedRasi.element}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              நிறம்: <span className="text-emerald-600 dark:text-emerald-400">{selectedRasi.luckyColor}</span>
            </span>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              அதிர்ஷ்ட எண்: <span className="text-amber-500">{selectedRasi.luckyNumber}</span>
            </span>
          </div>
        </div>

        {/* 3 Pillars: Health, Workout, Nutrition */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          {/* 1. Health Outlook */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-black uppercase text-rose-600 dark:text-rose-400 flex items-center gap-1.5 tracking-wider">
              <Heart className="w-3.5 h-3.5" />
              <span>உடல் ஆரோக்கியம் (Health Outlook)</span>
            </span>
            <p className="font-semibold text-slate-900 dark:text-white leading-relaxed text-xs">
              {selectedRasi.healthOutlookTamil}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed pt-1 border-t border-slate-100 dark:border-slate-800">
              {selectedRasi.healthOutlook}
            </p>
          </div>

          {/* 2. Workout Guidance */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 tracking-wider">
              <Dumbbell className="w-3.5 h-3.5" />
              <span>உடற்பயிற்சி முறை (Workout Guidance)</span>
            </span>
            <p className="font-semibold text-slate-900 dark:text-white leading-relaxed text-xs">
              {selectedRasi.workoutAdviceTamil}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed pt-1 border-t border-slate-100 dark:border-slate-800">
              {selectedRasi.workoutAdvice}
            </p>
          </div>

          {/* 3. Nutrition Guidance */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-black uppercase text-teal-600 dark:text-teal-400 flex items-center gap-1.5 tracking-wider">
              <Utensils className="w-3.5 h-3.5" />
              <span>உணவு & நீர்ச்சத்து (Nutrition Guidance)</span>
            </span>
            <p className="font-semibold text-slate-900 dark:text-white leading-relaxed text-xs">
              {selectedRasi.nutritionAdviceTamil}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed pt-1 border-t border-slate-100 dark:border-slate-800">
              {selectedRasi.nutritionAdvice}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RasipalanCard;

