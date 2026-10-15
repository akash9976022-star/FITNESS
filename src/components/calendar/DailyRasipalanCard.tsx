import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Flame,
  Zap,
  Dumbbell,
  Utensils,
  Compass,
  Palette,
  Check,
} from 'lucide-react';
import type { TamilRasiId } from '../../types/calendar';
import { TAMIL_ZODIAC_SIGNS, getDailyRasipalan } from '../../utils/rasipalanEngine';

interface DailyRasipalanCardProps {
  selectedDateStr: string;
}

export const DailyRasipalanCard: React.FC<DailyRasipalanCardProps> = ({ selectedDateStr }) => {
  const [selectedRasiId, setSelectedRasiId] = useState<TamilRasiId>(() => {
    const saved = localStorage.getItem('fitmaintenance_user_rasi');
    if (saved && TAMIL_ZODIAC_SIGNS.some((r) => r.id === saved)) {
      return saved as TamilRasiId;
    }
    return 'mesham';
  });

  useEffect(() => {
    localStorage.setItem('fitmaintenance_user_rasi', selectedRasiId);
  }, [selectedRasiId]);

  const activeRasi = TAMIL_ZODIAC_SIGNS.find((r) => r.id === selectedRasiId) || TAMIL_ZODIAC_SIGNS[0];
  const prediction = getDailyRasipalan(selectedRasiId, selectedDateStr);

  const getWorkoutBadge = (type: string) => {
    switch (type) {
      case 'heavy_strength':
        return { label: 'Heavy Strength (1-5 Reps)', color: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30' };
      case 'hypertrophy':
        return { label: 'Hypertrophy & Pump (8-12 Reps)', color: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30' };
      case 'hiit_cardio':
        return { label: 'High Intensity Intervals (HIIT)', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' };
      case 'mobility_yoga':
        return { label: 'Mobility & Surya Namaskar', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' };
      default:
        return { label: 'Active Recovery & Walking', color: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30' };
    }
  };

  const workoutBadge = getWorkoutBadge(prediction.workoutRecommendation);

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xl transition-all">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-400">
              Daily Rasipalan & Fitness Vitality
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-800 dark:text-purple-300">
              தினசரி ராசிபலன்
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
            Astrological Health & Movement Insights
          </h3>
        </div>

        {/* Selected Rasi Vitality Score Pill */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-brand-500/15 to-teal-500/15 border border-brand-500/30 flex items-center gap-2">
            <Zap className="w-4 h-4 text-brand-500 animate-pulse" />
            <div className="text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Vitality: </span>
              <span className="font-mono font-black text-brand-600 dark:text-brand-400">
                {prediction.energyScore}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 12 Rasi Selector Horizontal Grid (Responsive 3 to 6 columns) */}
      <div className="mt-4">
        <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
          Select Your Tamil Rasi (12 ராசிகள்):
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-6 gap-2">
          {TAMIL_ZODIAC_SIGNS.map((r) => {
            const isSelected = r.id === selectedRasiId;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRasiId(r.id)}
                className={`p-2 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 relative group ${
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30 scale-[1.03]'
                    : 'bg-slate-50/80 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
                title={`${r.nameTa} (${r.westernSign})`}
              >
                <span className="text-base sm:text-lg leading-none">{r.symbol}</span>
                <span className="text-[11px] font-black truncate max-w-full">
                  {r.nameTa}
                </span>
                <span
                  className={`text-[9px] font-medium truncate ${
                    isSelected ? 'text-purple-200' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {r.nameEn}
                </span>
                {isSelected && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                    <Check className="w-2 h-2 text-white stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Rasi Astrological Card Breakdown */}
      <div className="mt-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        {/* Rasi Meta Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-purple-500/20 shrink-0">
              {activeRasi.symbol}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {activeRasi.nameTa} ({activeRasi.nameEn})
                </h4>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {activeRasi.westernSign}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                <span>அதிபதி: <strong className="text-slate-700 dark:text-slate-200">{activeRasi.rulingPlanetTa} ({activeRasi.rulingPlanet})</strong></span>
                <span>•</span>
                <span>தத்துவம்: <strong className="text-slate-700 dark:text-slate-200">{activeRasi.elementTa} ({activeRasi.element})</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className={`px-3 py-1 rounded-full font-bold border ${workoutBadge.color}`}>
              {workoutBadge.label}
            </span>
          </div>
        </div>

        {/* Prediction Content: General Outlook */}
        <div className="space-y-1.5">
          <div className="text-xs font-black text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-purple-500" />
            <span>பொது பலன் & உடல்நிலை தாக்கம் (General Outlook):</span>
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
            {prediction.generalOutlookTa}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
            {prediction.generalOutlookEn}
          </p>
        </div>

        {/* 2-Column Fitness & Nutrition Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Fitness Directive */}
          <div className="p-3.5 rounded-xl bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/20 space-y-1.5">
            <div className="text-xs font-bold text-brand-700 dark:text-brand-300 flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-brand-500" />
              <span>உடற்பயிற்சி வழிகாட்டல் (Workout Strategy)</span>
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
              {prediction.fitnessFocusTa}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {prediction.fitnessFocusEn}
            </p>
          </div>

          {/* Nutrition Directive */}
          <div className="p-3.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-emerald-500" />
              <span>ஊட்டச்சத்து & நீர்ச்சத்து (Nutrition Advice)</span>
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
              {prediction.nutritionTipTa}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {prediction.nutritionTipEn}
            </p>
          </div>
        </div>

        {/* Lucky Attributes Strip */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-amber-500" />
            <span>அதிர்ஷ்ட நிறம்: <strong className="text-slate-800 dark:text-slate-200">{prediction.luckyColor}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-teal-400" />
            <span>அதிர்ஷ்ட திசை: <strong className="text-slate-800 dark:text-slate-200">{prediction.luckyDirection}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
