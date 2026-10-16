import React, { useState } from 'react';
import {
  Sun,
  Apple,
  Droplets,
  Sparkles,
  CheckCircle2,
  Loader2,
  Edit2,
} from 'lucide-react';
import {
  FASTING_CONFIGS,
  type FastingType,
  type DailyFastingState,
} from '../../services/firestoreService';

interface DailyFastingCardProps {
  currentFasting: DailyFastingState | null;
  onSelectFasting: (type: FastingType, notes?: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export const DailyFastingCard: React.FC<DailyFastingCardProps> = ({
  currentFasting,
  onSelectFasting,
  isLoading = false,
  className = '',
}) => {
  const [selectedType, setSelectedType] = useState<FastingType>(
    currentFasting?.fastingType || 'none'
  );
  const [isEditing, setIsEditing] = useState<boolean>(!currentFasting?.isFasting && !currentFasting?.fastingType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customNotes, setCustomNotes] = useState(currentFasting?.fastingNotes || '');

  const options: {
    type: FastingType;
    icon: React.ReactNode;
    color: string;
    borderActive: string;
    bgActive: string;
  }[] = [
    {
      type: 'none',
      icon: <Sun className="w-5 h-5 text-amber-500" />,
      color: 'text-amber-500',
      borderActive: 'border-amber-400 dark:border-amber-500',
      bgActive: 'bg-amber-500/10 dark:bg-amber-500/15',
    },
    {
      type: 'partial_fruit',
      icon: <Apple className="w-5 h-5 text-emerald-500" />,
      color: 'text-emerald-500',
      borderActive: 'border-emerald-400 dark:border-emerald-500',
      bgActive: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    },
    {
      type: 'water_only',
      icon: <Droplets className="w-5 h-5 text-blue-500" />,
      color: 'text-blue-500',
      borderActive: 'border-blue-400 dark:border-blue-500',
      bgActive: 'bg-blue-500/10 dark:bg-blue-500/15',
    },
    {
      type: 'traditional_viratham',
      icon: <Sparkles className="w-5 h-5 text-purple-500" />,
      color: 'text-purple-500',
      borderActive: 'border-purple-400 dark:border-purple-500',
      bgActive: 'bg-purple-500/10 dark:bg-purple-500/15',
    },
  ];

  const handleSelect = async (type: FastingType) => {
    setSelectedType(type);
    setIsSubmitting(true);
    try {
      await onSelectFasting(type, customNotes);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save daily fasting selection:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeConfig = FASTING_CONFIGS[currentFasting?.fastingType || selectedType];

  return (
    <div
      className={`rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm transition-all ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Daily Fasting Check-In
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                AI Adaptation Loop
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Are you observing a fast today? FitMaintenance AI will adjust your workouts, hydration, and nutrition.
            </p>
          </div>
        </div>

        {currentFasting?.fastingType && !isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="self-start sm:self-center px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Change Fasting State</span>
          </button>
        )}
      </div>

      {/* When Active and not editing: show current selection summary */}
      {!isEditing && currentFasting?.fastingType && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
              {options.find((o) => o.type === currentFasting.fastingType)?.icon || (
                <Sun className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {activeConfig.title}
                </span>
                <span className="text-xs text-amber-700 dark:text-amber-400 font-bold">
                  ({activeConfig.tamilTitle})
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                {activeConfig.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold flex-shrink-0">
            <div className="text-center px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Target Water</span>
              <span className="text-blue-500">{(activeConfig.hydrationTargetMl / 1000).toFixed(1)}L</span>
            </div>
            <div className="text-center px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Calorie Scale</span>
              <span className="text-amber-500">
                {activeConfig.calorieTargetMultiplier === 0
                  ? '0 kcal (Fast)'
                  : `${Math.round(activeConfig.calorieTargetMultiplier * 100)}% TDEE`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Selectable Options Grid (shown when editing or not selected yet) */}
      {(isEditing || !currentFasting?.fastingType) && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {options.map((opt) => {
              const cfg = FASTING_CONFIGS[opt.type];
              const isSelected = selectedType === opt.type;

              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => handleSelect(opt.type)}
                  disabled={isSubmitting || isLoading}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 transform active:scale-98 relative overflow-hidden group ${
                    isSelected
                      ? `${opt.borderActive} ${opt.bgActive} shadow-sm ring-2 ring-amber-400/30`
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-xs">
                        {opt.icon}
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                        </div>
                      )}
                    </div>

                    <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                      {cfg.title}
                    </h4>
                    <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold block mt-0.5">
                      {cfg.tamilTitle}
                    </span>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {cfg.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-bold">
                    <span className="text-blue-500">{(cfg.hydrationTargetMl / 1000).toFixed(1)}L Water</span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {cfg.calorieTargetMultiplier === 0
                        ? '0 kcal'
                        : `${Math.round(cfg.calorieTargetMultiplier * 100)}% TDEE`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedType !== 'none' && (
            <div className="pt-1">
              <input
                type="text"
                placeholder="Optional notes for today's fast (e.g. Purattasi Saturday, coconut water allowed)..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>
          )}

          {isSubmitting && (
            <div className="flex items-center justify-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-bold py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving today's fasting mode to Firestore & rewriting targets...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyFastingCard;
