import React, { useState, useEffect } from 'react';
import { Droplets, Plus, Minus, RotateCcw, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeDailyHydration,
  logWaterIntake,
  resetWaterIntake,
  getTodayDateString,
  type DailyHydration,
  DEFAULT_DAILY_HYDRATION,
} from '../../services/firestoreService';

interface WaterIntakeWidgetProps {
  compact?: boolean;
  onHydrationChange?: (ml: number) => void;
}

export const WaterIntakeWidget: React.FC<WaterIntakeWidgetProps> = ({
  compact = false,
  onHydrationChange,
}) => {
  const { currentUser } = useAuth();
  const todayStr = getTodayDateString();

  const [hydration, setHydration] = useState<DailyHydration>({
    ...DEFAULT_DAILY_HYDRATION,
    date: todayStr,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [justLogged, setJustLogged] = useState<number | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsub = subscribeDailyHydration(currentUser.uid, todayStr, (data) => {
      setHydration(data);
      if (onHydrationChange) {
        onHydrationChange(data.waterMl);
      }
    });

    return () => unsub();
  }, [currentUser?.uid, todayStr]);

  const handleAddWater = async (deltaMl: number) => {
    if (!currentUser?.uid || isUpdating) return;
    setIsUpdating(true);
    try {
      const newAmount = await logWaterIntake(currentUser.uid, todayStr, deltaMl, hydration.targetMl);
      setJustLogged(deltaMl);
      setTimeout(() => setJustLogged(null), 2000);
      if (onHydrationChange) {
        onHydrationChange(newAmount);
      }
    } catch (err) {
      console.error('Failed to log water intake:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReset = async () => {
    if (!currentUser?.uid || isUpdating) return;
    if (hydration.waterMl === 0) return;
    if (!window.confirm("Reset today's water intake to 0 ml?")) return;

    setIsUpdating(true);
    try {
      await resetWaterIntake(currentUser.uid, todayStr, hydration.targetMl);
      if (onHydrationChange) {
        onHydrationChange(0);
      }
    } catch (err) {
      console.error('Failed to reset water intake:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const target = hydration.targetMl || 3000;
  const current = hydration.waterMl || 0;
  const percent = Math.min(100, Math.round((current / target) * 100));
  const remainingMl = Math.max(0, target - current);
  const isGoalMet = current >= target;

  // SVG Progress Ring calculations
  const radius = compact ? 36 : 46;
  const strokeWidth = compact ? 7 : 9;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all duration-200">
      {/* Background soft ambient glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-cyan-500/10 dark:bg-cyan-500/10 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-cyan-100 dark:bg-cyan-500/15 border border-cyan-300 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 flex-shrink-0 shadow-sm">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                Hydration Engine
              </h3>
              {isGoalMet && (
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Met
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daily target: {(target / 1000).toFixed(1)}L ({(target).toLocaleString()} ml)
            </p>
          </div>
        </div>

        {current > 0 && (
          <button
            onClick={handleReset}
            disabled={isUpdating}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Reset today's water"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Central Visual Progress Ring & Metrics */}
      <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 my-2">
        <div className="relative flex items-center justify-center flex-shrink-0">
          <svg
            height={radius * 2}
            width={radius * 2}
            className="rotate-[-90deg] transition-all duration-500"
          >
            {/* Background Track */}
            <circle
              stroke="currentColor"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className="text-slate-100 dark:text-slate-800"
            />
            {/* Progress Stroke with Gradient / Color */}
            <circle
              stroke="currentColor"
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className={`transition-all duration-700 ease-out ${
                isGoalMet
                  ? 'text-emerald-500 dark:text-emerald-400'
                  : 'text-cyan-500 dark:text-cyan-400'
              }`}
            />
          </svg>

          {/* Centered Percentage */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-none">
              {percent}%
            </span>
            <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 mt-0.5">
              Target
            </span>
          </div>
        </div>

        {/* Text Breakdown */}
        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex items-baseline justify-center sm:justify-start gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {(current / 1000).toFixed(2)}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              / {(target / 1000).toFixed(1)} Liters
            </span>
          </div>

          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {isGoalMet ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center sm:justify-start gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Optimal cellular hydration achieved!
              </span>
            ) : (
              <span>
                <strong className="text-slate-900 dark:text-white">{remainingMl.toLocaleString()} ml</strong> remaining today
              </span>
            )}
          </p>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Sufficient water preserves kidney filtration, joints, and metabolic maintenance rate.
          </p>
        </div>
      </div>

      {/* Quick Increment Buttons */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => handleAddWater(250)}
          disabled={isUpdating}
          className="py-2 px-3 rounded-2xl bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+250ml</span>
          <span className="text-[10px] opacity-75 hidden sm:inline">(Glass)</span>
        </button>

        <button
          type="button"
          onClick={() => handleAddWater(500)}
          disabled={isUpdating}
          className="py-2 px-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+500ml</span>
          <span className="text-[10px] opacity-90 hidden sm:inline">(Bottle)</span>
        </button>

        <button
          type="button"
          onClick={() => handleAddWater(-250)}
          disabled={isUpdating || current === 0}
          className="py-2 px-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold flex items-center justify-center gap-1 transition active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
        >
          <Minus className="w-3.5 h-3.5" />
          <span>-250ml</span>
        </button>
      </div>

      {/* 1-second floating confirmation */}
      {justLogged && (
        <div className="absolute bottom-2 right-4 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 animate-fade-in flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          <span>+{justLogged}ml synced to Firestore</span>
        </div>
      )}
    </div>
  );
};

export default WaterIntakeWidget;

