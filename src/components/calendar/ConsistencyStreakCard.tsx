import React from 'react';
import { Flame, Trophy, CalendarCheck, Zap } from 'lucide-react';
import type { StreakData } from '../../types/calendar';

interface ConsistencyStreakCardProps {
  streakData: StreakData;
  onCheckInClick?: () => void;
}

export const ConsistencyStreakCard: React.FC<ConsistencyStreakCardProps> = ({
  streakData,
  onCheckInClick: _onCheckInClick,
}) => {
  const { currentStreak, longestStreak, totalActiveDays, weeklyActivity, level, nextMilestone } =
    streakData;

  const daysUntilMilestone = Math.max(0, nextMilestone - currentStreak);
  const progressPercent = Math.min(100, Math.round((currentStreak / nextMilestone) * 100));

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayIndex = new Date().getDay();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xl backdrop-blur-xl transition-all duration-200">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Flame Counter & Level */}
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group">
              <Flame className="w-9 h-9 sm:w-11 sm:h-11 text-white animate-pulse" />
            </div>
            {currentStreak > 0 && (
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 border-2 border-white dark:border-slate-900 shadow">
                ACTIVE
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {currentStreak}
              </span>
              <span className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400">
                Day{currentStreak === 1 ? '' : 's'} Streak
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-500/30">
                {level}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
              {currentStreak > 0
                ? `You're in the flow! Keep completing daily check-ins or workouts to preserve your metabolic momentum.`
                : `Begin your streak today by logging your morning fasted check-in or completing today's routine.`}
            </p>
          </div>
        </div>

        {/* Center/Right: Weekly Activity Dots & Milestone Progress */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5 lg:gap-8">
          {/* 7-Day Activity Ring */}
          <div className="flex flex-col gap-1.5">
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              This Week's Activity
            </div>
            <div className="flex items-center gap-2">
              {weeklyActivity.map((isActive, index) => {
                const isToday = index === todayIndex;
                return (
                  <div key={index} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                        isActive
                          ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20'
                          : isToday
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 animate-pulse'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500'
                      }`}
                      title={`${dayLabels[index]}: ${isActive ? 'Active' : isToday ? 'Pending Today' : 'Rest/Missed'}`}
                    >
                      {isActive ? '✓' : isToday ? '•' : ''}
                    </div>
                    <span
                      className={`text-[10px] font-semibold ${
                        isToday
                          ? 'text-amber-600 dark:text-amber-400 font-bold'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {dayLabels[index]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-3 sm:pt-0 sm:pl-6">
            <div className="px-3 py-2 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Best Record</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                {longestStreak} Days
              </div>
            </div>

            <div className="px-3 py-2 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                <CalendarCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Total Active</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                {totalActiveDays} Days
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Milestone Progress Bar Footer */}
      <div className="mt-4 pt-3.5 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>
            Next Goal: <strong className="text-slate-900 dark:text-white font-bold">{nextMilestone} Days</strong>
            {daysUntilMilestone > 0 && ` (${daysUntilMilestone} day${daysUntilMilestone === 1 ? '' : 's'} remaining)`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-36 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
            {progressPercent}%
          </span>
        </div>
      </div>
    </div>
  );
};
