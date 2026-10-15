import React from 'react';
import type { WorkoutSessionItem } from '../../types/workout';
import { calculateWorkoutVolumeKg } from '../../types/workout';
import {
  Trophy,
  Dumbbell,
  Clock,
  CheckCircle,
  Flame,
  Sparkles,
  X,
} from 'lucide-react';

interface WorkoutCompletedModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: WorkoutSessionItem;
  elapsedSeconds: number;
}

export const WorkoutCompletedModal: React.FC<WorkoutCompletedModalProps> = ({
  isOpen,
  onClose,
  workout,
  elapsedSeconds,
}) => {
  if (!isOpen) return null;

  const totalVolumeKg = calculateWorkoutVolumeKg(workout);
  const totalSets = workout.exercises.reduce((a, b) => a + (b.setList?.length || b.sets), 0);
  const completedSets = workout.exercises.reduce((a, b) => a + b.completedSets, 0);

  const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
  const estCaloriesBurned = Math.round(durationMinutes * 6.8); // ~6.8 kcal/min resistance training

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-md w-full border border-brand-500/40 bg-white/95 dark:bg-slate-900/95 shadow-2xl shadow-brand-500/20 text-center relative overflow-hidden transition-colors">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="p-1.5 absolute top-4 right-4 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Trophy Badge */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-500 to-teal-400 p-0.5 mx-auto mb-5 shadow-lg shadow-brand-500/30 flex items-center justify-center">
          <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[22px] flex items-center justify-center">
            <Trophy className="w-10 h-10 text-brand-500 dark:text-brand-400 animate-bounce" />
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-500/30 inline-block mb-2">
          Workout Finished & Saved
        </span>

        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {workout.routineName || workout.name || 'Great Workout!'}
        </h3>

        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-xs mx-auto">
          Logged and synced securely to your Cloud Firestore profile.
        </p>

        {/* Hevy-Style Metric Grid */}
        <div className="grid grid-cols-2 gap-3 my-6">
          {/* Total Volume */}
          <div className="glass-card p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-col items-center shadow-sm">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
              <Dumbbell className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
              <span>Total Volume</span>
            </div>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              {totalVolumeKg > 0 ? `${totalVolumeKg.toLocaleString()} kg` : 'Bodyweight'}
            </span>
          </div>

          {/* Time Elapsed */}
          <div className="glass-card p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-col items-center shadow-sm">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
              <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Duration</span>
            </div>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              {durationMinutes} min
            </span>
          </div>

          {/* Sets Completed */}
          <div className="glass-card p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-col items-center shadow-sm">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Sets Done</span>
            </div>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              {completedSets} / {totalSets}
            </span>
          </div>

          {/* Calorie Maintenance Burn */}
          <div className="glass-card p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-col items-center shadow-sm">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
              <Flame className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>Est. Energy</span>
            </div>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              ~{estCaloriesBurned} kcal
            </span>
          </div>
        </div>

        {/* Motivational Quote */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2 mb-6 text-left">
          <Sparkles className="w-4 h-4 text-brand-500 dark:text-brand-400 shrink-0" />
          <span>
            Consistent maintenance stimuli preserve lean tissue and balance caloric equilibrium.
          </span>
        </div>

        {/* Primary CTA */}
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-teal-400 hover:from-brand-400 hover:to-teal-300 text-slate-950 font-extrabold text-sm shadow-lg shadow-brand-500/25 transition-all cursor-pointer"
        >
          Done & Close Summary
        </button>
      </div>
    </div>
  );
};
