import React, { useState } from 'react';
import {
  Sparkles,
  Dumbbell,
  Droplets,
  Flame,
  CheckCircle2,
  ArrowRight,
  Loader2,
  RefreshCw,
  Edit2,
} from 'lucide-react';
import {
  FASTING_CONFIGS,
  type DailyFastingState,
} from '../../services/firestoreService';

interface FastingBannerProps {
  fastingState: DailyFastingState;
  onApplyFastingWorkout?: () => Promise<void>;
  onChangeFastingMode?: () => void;
  isApplyingWorkout?: boolean;
  className?: string;
}

export const FastingBanner: React.FC<FastingBannerProps> = ({
  fastingState,
  onApplyFastingWorkout,
  onChangeFastingMode,
  isApplyingWorkout = false,
  className = '',
}) => {
  const [workoutApplied, setWorkoutApplied] = useState(false);

  if (!fastingState.isFasting || fastingState.fastingType === 'none') {
    return null;
  }

  const config = FASTING_CONFIGS[fastingState.fastingType];

  const handleApply = async () => {
    if (onApplyFastingWorkout) {
      await onApplyFastingWorkout();
      setWorkoutApplied(true);
      setTimeout(() => setWorkoutApplied(false), 5000);
    }
  };

  const getFastingGradient = () => {
    switch (fastingState.fastingType) {
      case 'water_only':
        return 'from-blue-600/15 via-teal-500/10 to-indigo-600/15 border-blue-400/30';
      case 'partial_fruit':
        return 'from-emerald-500/15 via-amber-500/10 to-orange-500/15 border-emerald-400/30';
      case 'traditional_viratham':
      default:
        return 'from-purple-600/15 via-amber-500/10 to-orange-500/15 border-purple-400/30';
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${getFastingGradient()} border p-5 sm:p-7 shadow-sm transition-all duration-300 ${className}`}
    >
      {/* Background Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Banner Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-purple-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-400/40">
                  Fasting Mode Active
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {config.title}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                {config.tamilTitle}
              </h3>
            </div>
          </div>

          {onChangeFastingMode && (
            <button
              type="button"
              onClick={onChangeFastingMode}
              className="self-start sm:self-center px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Modify Fasting</span>
            </button>
          )}
        </div>

        {/* 3 Pillars Adaptation Grid (Workouts, Hydration, Nutrition) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Pillar 1: Workouts Adaptation */}
          <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center gap-2 text-rose-500 font-bold text-xs mb-1">
              <Dumbbell className="w-4 h-4" />
              <span>Workouts Scaled</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
              {config.workoutGuideline}
            </p>
          </div>

          {/* Pillar 2: Hydration Target Adjusted */}
          <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center gap-2 text-blue-500 font-bold text-xs mb-1">
              <Droplets className="w-4 h-4" />
              <span>Hydration Target: {(config.hydrationTargetMl / 1000).toFixed(1)}L</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
              {config.hydrationGuideline}
            </p>
          </div>

          {/* Pillar 3: Nutrition / Calorie Target */}
          <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center gap-2 text-amber-500 font-bold text-xs mb-1">
              <Flame className="w-4 h-4" />
              <span>
                Nutrition:{' '}
                {config.calorieTargetMultiplier === 0
                  ? '0 kcal (Water Fast)'
                  : `${Math.round(config.calorieTargetMultiplier * 100)}% TDEE`}
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
              {config.recommendedFoods.slice(0, 4).join(', ')}
            </p>
          </div>
        </div>

        {/* Action Button: Apply Fasting Recovery Routine */}
        {onApplyFastingWorkout && (
          <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              FitMaintenance AI can rewrite today's active workout session to a gentle mobility & active recovery routine.
            </span>

            {workoutApplied ? (
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold shadow flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>Fasting Routine Loaded!</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleApply}
                disabled={isApplyingWorkout}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-950 text-xs font-bold transition flex items-center justify-center gap-2 shadow flex-shrink-0"
              >
                {isApplyingWorkout ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Adapting in Firestore...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                    <span>Apply Fasting Recovery Workout</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FastingBanner;
