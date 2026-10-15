import React from 'react';
import {
  X,
  Sparkles,
  Flame,
  Utensils,
  Dumbbell,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import type { TamilFestival } from '../../types/calendar';
import { formatBilingualDate } from '../../utils/tamilCalendar';

interface FestivalDetailModalProps {
  festival: TamilFestival | null;
  onClose: () => void;
  onAddCustomMeal?: () => void;
}

export const FestivalDetailModal: React.FC<FestivalDetailModalProps> = ({
  festival,
  onClose,
  onAddCustomMeal,
}) => {
  if (!festival) return null;

  const bilingualDate = formatBilingualDate(festival.date);

  const getFastingBadge = (type: string) => {
    switch (type) {
      case 'strict_water':
        return {
          label: 'Strict Water / Nirjala Fast',
          color: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
        };
      case 'fruit_milk':
        return {
          label: 'Phalahara (Fruits & Milk)',
          color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
        };
      case 'sattvic_vegetarian':
        return {
          label: 'Pure Sattvic Vegetarian',
          color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        };
      case 'single_meal':
        return {
          label: 'Single Meal (Oru Pozhuthu)',
          color: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
        };
      default:
        return {
          label: 'Festive Celebration',
          color: 'bg-brand-500/15 text-brand-700 dark:text-brand-300 border-brand-500/30',
        };
    }
  };

  const fastBadge = getFastingBadge(festival.fastingType);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 text-slate-900 dark:text-slate-100 transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Tags */}
        <div className="flex items-center gap-2 flex-wrap pr-10 mb-2.5">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${fastBadge.color} flex items-center gap-1.5`}
          >
            <Flame className="w-3.5 h-3.5" />
            {fastBadge.label}
          </span>
          {festival.deity && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {festival.deity}
            </span>
          )}
          {festival.isCustom && (
            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30">
              Custom Festival
            </span>
          )}
        </div>

        {/* Title: English & Tamil */}
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {festival.nameEn}
        </h2>
        {festival.nameTa && (
          <p className="text-base sm:text-lg font-bold text-brand-600 dark:text-brand-400 mt-0.5">
            {festival.nameTa}
          </p>
        )}

        {/* Bilingual Date Pill */}
        <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {bilingualDate.englishFormatted}
            </span>
          </div>
          <span className="font-bold text-brand-600 dark:text-brand-300 font-mono">
            {bilingualDate.tamilFormatted}
          </span>
        </div>

        {/* Significance Section */}
        <div className="mt-5 space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 mb-1.5 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Significance & Observance
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {festival.significanceEn}
            </p>
            {festival.significanceTa && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium leading-relaxed italic border-t border-amber-500/15 pt-2">
                "{festival.significanceTa}"
              </p>
            )}
            {festival.specialNote && (
              <div className="mt-2.5 text-xs text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{festival.specialNote}</span>
              </div>
            )}
          </div>

          {/* Precision Nutrition & Fasting Guidance */}
          <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1.5 uppercase tracking-wider">
              <Utensils className="w-4 h-4 text-emerald-500" />
              FitMaintenance Nutrition Strategy
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {festival.dietaryGuidance}
            </p>
          </div>

          {/* Workout & Training Adjustment Guidance */}
          <div className="p-4 rounded-2xl bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/20">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-700 dark:text-brand-400 mb-1.5 uppercase tracking-wider">
              <Dumbbell className="w-4 h-4 text-brand-500" />
              Training & Energy Adjustment
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {festival.workoutGuidance}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
          >
            Close
          </button>

          {onAddCustomMeal && (
            <button
              onClick={() => {
                onClose();
                onAddCustomMeal();
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-teal-500 hover:from-brand-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold shadow-glow flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Log Aligned Sattvic Meal</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
