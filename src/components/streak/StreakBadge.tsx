import React, { useState } from 'react';
import {
  Flame,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  Dumbbell,
  Utensils,
  Camera,
} from 'lucide-react';
import { type UserStreak } from '../../services/firestoreService';

interface StreakBadgeProps {
  streak: UserStreak;
  todayCompleted?: boolean;
  completedGoals?: {
    meal: boolean;
    workout: boolean;
    checkin: boolean;
  };
  className?: string;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  streak,
  todayCompleted = false,
  completedGoals = { meal: false, workout: false, checkin: false },
  className = '',
}) => {
  const [showDetailModal, setShowDetailModal] = useState(false);

  const currentCount = streak?.currentStreak || 0;
  const longestCount = streak?.longestStreak || currentCount;
  const shieldsRemaining = streak?.shieldsRemaining ?? 1;

  // Determine next milestone
  const milestones = [
    { target: 3, label: '3-Day Consistency Ignition', tier: 'Silver', icon: 'Flame' },
    { target: 7, label: '7-Day Streak Master', tier: 'Gold', icon: 'Trophy' },
    { target: 14, label: '14-Day Two-Week Titan', tier: 'Gold', icon: 'Shield' },
    { target: 30, label: '30-Day Maintenance Legend', tier: 'Diamond', icon: 'Sparkles' },
    { target: 60, label: '60-Day Diamond Discipline', tier: 'Diamond', icon: 'Crown' },
    { target: 100, label: '100-Day Centurion Athlete', tier: 'Diamond', icon: 'Award' },
  ];

  const nextMilestone =
    milestones.find((m) => m.target > currentCount) || milestones[milestones.length - 1];
  const prevTarget =
    milestones.filter((m) => m.target <= currentCount).slice(-1)[0]?.target || 0;

  const milestoneProgressPct =
    currentCount >= 100
      ? 100
      : Math.min(
          100,
          Math.max(
            0,
            Math.round(
              ((currentCount - prevTarget) / Math.max(1, nextMilestone.target - prevTarget)) * 100
            )
          )
        );

  return (
    <>
      {/* Prominent Streak Shield & Count Card */}
      <div
        onClick={() => setShowDetailModal(true)}
        className={`group relative overflow-hidden rounded-2xl cursor-pointer p-3 sm:p-4 transition-all duration-300 transform active:scale-98 border shadow-xs hover:shadow-md ${
          todayCompleted
            ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-emerald-500/15 border-amber-400/40 dark:border-amber-500/30'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400/50'
        } ${className}`}
        role="button"
        tabIndex={0}
        title="Click to view Streak & Milestone Rewards"
      >
        {/* Subtle ambient light glow */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-all duration-500" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          {/* Left: Flame Icon + Count */}
          <div className="flex items-center gap-3">
            <div
              className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-md ${
                currentCount > 0
                  ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 shadow-amber-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
              }`}
            >
              <Flame
                className={`w-6 h-6 ${
                  currentCount > 0 ? 'fill-current animate-pulse' : ''
                }`}
              />
              {todayCompleted && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow">
                  <CheckCircle2 className="w-3 h-3 fill-current" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {currentCount} {currentCount === 1 ? 'Day' : 'Days'}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                  Streak
                </span>
              </div>

              <div className="flex items-center gap-2 mt-0.5 text-xs">
                {todayCompleted ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Maintained Today</span>
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 animate-pulse">
                    <Clock className="w-3 h-3" />
                    <span>Goal Needed Today</span>
                  </span>
                )}

                <span className="text-slate-300 dark:text-slate-700">•</span>

                {/* Streak Shield indicator */}
                <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>
                    {shieldsRemaining > 0 ? `${shieldsRemaining} Shield` : 'No Shield'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Milestone Target pill & Chevron */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Next Milestone
              </span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                {currentCount >= 100 ? '100-Day Centurion 🔥' : `${nextMilestone.target} Days (${nextMilestone.tier})`}
              </span>
              <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${milestoneProgressPct}%` }}
                />
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
          </div>
        </div>
      </div>

      {/* Streak Details & Milestone Rewards Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-amber-500/30 dark:border-amber-500/30 p-6 shadow-2xl space-y-5 overflow-hidden animate-modal-pop">
            {/* Ambient Background Gradient */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shadow-md">
                  <Flame className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Streak Consistency Engine
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Real-time consistency tracker & milestone badges
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Streak & Longest Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                  Current Streak
                </span>
                <span className="text-3xl font-black text-amber-600 dark:text-amber-400 block mt-1">
                  {currentCount} {currentCount === 1 ? 'Day' : 'Days'}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold block mt-0.5">
                  {todayCompleted ? 'Safe for today' : 'Needs action today'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Longest Streak
                </span>
                <span className="text-3xl font-black text-slate-900 dark:text-white block mt-1">
                  {longestCount} {longestCount === 1 ? 'Day' : 'Days'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">
                  Personal Record
                </span>
              </div>
            </div>

            {/* Streak Shield Status Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-teal-500/10 border border-indigo-300 dark:border-indigo-500/30 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Shield className="w-5 h-5 fill-current" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Streak Shield Protection Active
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                    {shieldsRemaining} Shield
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                  If life gets busy and you miss a day, your Streak Shield automatically absorbs the gap so your progress isn't reset.
                </p>
              </div>
            </div>

            {/* Today's Maintenance Goal Completion Checklist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Today's Core Goals (Any 1 extends streak):
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  todayCompleted
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400'
                    : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400'
                }`}>
                  {todayCompleted ? 'Streak Extended' : 'Pending Completion'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                {/* Goal 1: Nutrition Log */}
                <div className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition ${
                  completedGoals.meal
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  <Utensils className="w-4 h-4 mb-1" />
                  <span className="font-bold text-[11px]">Log Meal</span>
                  <span className="text-[10px] mt-0.5">
                    {completedGoals.meal ? '✓ Logged' : 'Pending'}
                  </span>
                </div>

                {/* Goal 2: Workout Completed */}
                <div className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition ${
                  completedGoals.workout
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  <Dumbbell className="w-4 h-4 mb-1" />
                  <span className="font-bold text-[11px]">Workout</span>
                  <span className="text-[10px] mt-0.5">
                    {completedGoals.workout ? '✓ Finished' : 'Pending'}
                  </span>
                </div>

                {/* Goal 3: Morning Check-In */}
                <div className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition ${
                  completedGoals.checkin
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  <Camera className="w-4 h-4 mb-1" />
                  <span className="font-bold text-[11px]">Check-In</span>
                  <span className="text-[10px] mt-0.5">
                    {completedGoals.checkin ? '✓ Recorded' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Milestone Roadmap */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Consistency Milestone Rewards:
              </span>
              <div className="space-y-1.5">
                {milestones.map((m) => {
                  const isUnlocked = currentCount >= m.target;
                  return (
                    <div
                      key={m.target}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
                        isUnlocked
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300'
                          : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                            isUnlocked
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isUnlocked ? '✓' : m.target}
                        </div>
                        <span className="font-bold">{m.label}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800">
                        {m.tier}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => setShowDetailModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-950 font-bold text-xs transition shadow"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default StreakBadge;
