import React, { useState } from 'react';
import {
  Trophy,
  Flame,
  Clock,
  Dumbbell,
  CheckCircle,
  Share2,
  Sparkles,
  Layers,
  X,
  Check,
} from 'lucide-react';

export interface WorkoutCompletionMetrics {
  routineName: string;
  durationSeconds: number;
  durationMinutes: number;
  totalVolumeKg: number;
  totalSets: number;
  totalExercises: number;
  trainedMuscles: string[];
  milestoneCount: number;
  streakCount: number;
}

interface WorkoutCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: WorkoutCompletionMetrics | null;
  onShareSuccess?: (message: string) => void;
}

export const WorkoutCompletionModal: React.FC<WorkoutCompletionModalProps> = ({
  isOpen,
  onClose,
  metrics,
  onShareSuccess,
}) => {
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);

  if (!isOpen || !metrics) return null;

  // Format seconds into "42m 15s" or "1h 12m 30s"
  const formatAccurateDuration = (totalSeconds: number): string => {
    const s = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // 3D Tilt calculation based on cursor relative to card center
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: -(y * 12),
      y: x * 12,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleShare = async () => {
    const musclesText =
      metrics.trainedMuscles.length > 0
        ? metrics.trainedMuscles.slice(0, 4).join(', ')
        : 'Full Body';

    const shareText = `💪 Just crushed "${metrics.routineName}" on FitMaintenance AI!\n⏱️ Duration: ${formatAccurateDuration(
      metrics.durationSeconds
    )}\n🏋️‍♂️ Volume: ${metrics.totalVolumeKg.toLocaleString()} kg (${metrics.totalSets} sets)\n🎯 Muscles: ${musclesText}\n🔥 Milestone: Workout #${
      metrics.milestoneCount
    } Completed!\n#Fitness #FitMaintenanceAI #MaintenanceMode`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FitMaintenance AI Workout Summary',
          text: shareText,
        });
        if (onShareSuccess) onShareSuccess('Workout summary shared successfully!');
        return;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.warn('Share aborted or failed, falling back to clipboard:', err);
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      if (onShareSuccess) onShareSuccess('Summary copied to clipboard!');
    } catch (clipErr) {
      console.error('Clipboard copy error:', clipErr);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/80 backdrop-blur-md transition-all duration-300 animate-in fade-in">
      {/* Perspective Container */}
      <div
        className="w-full max-w-lg my-auto transition-transform duration-200 ease-out"
        style={{ perspective: '1200px' }}
      >
        {/* 3D Flash Card Body */}
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transformStyle: 'preserve-3d',
          }}
          className="relative rounded-3xl p-[2px] bg-gradient-to-br from-emerald-400 via-teal-400 to-indigo-500 shadow-2xl shadow-emerald-500/30 dark:shadow-emerald-500/20 transition-transform duration-150 ease-out"
        >
          {/* Ambient Glowing Orb behind card */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-500/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-teal-500/30 rounded-full blur-3xl pointer-events-none" />

          {/* Inner Card Content */}
          <div className="relative rounded-[22px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-5 sm:p-7 space-y-5 text-slate-900 dark:text-white border border-white/50 dark:border-slate-800 shadow-inner">
            {/* Top Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Celebration Header */}
            <div className="text-center space-y-2 pt-1">
              <div className="relative inline-flex items-center justify-center">
                {/* Glowing ring animation */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-amber-400 to-emerald-400 blur-lg opacity-60 animate-pulse" />
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-amber-300 via-emerald-400 to-teal-500 p-0.5 shadow-xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                  <div className="w-full h-full rounded-[22px] bg-white dark:bg-slate-900 flex items-center justify-center">
                    <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500 dark:text-amber-400 animate-bounce" />
                  </div>
                </div>
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                  <span>Workout Completed!</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {metrics.routineName}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Outstanding performance! All sets &amp; telemetry synced to Firestore.
                </p>
              </div>

              {/* Milestone & Streak Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold shadow-sm">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>Workout #{metrics.milestoneCount} Milestone</span>
                </span>
                {metrics.streakCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold shadow-sm">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    <span>{metrics.streakCount}-Day Streak Active</span>
                  </span>
                )}
              </div>
            </div>

            {/* 3D Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Duration Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Time Taken
                  </p>
                  <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                    {formatAccurateDuration(metrics.durationSeconds)}
                  </p>
                </div>
              </div>

              {/* Volume Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Volume Lifted
                  </p>
                  <p className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 truncate">
                    {metrics.totalVolumeKg.toLocaleString()} <span className="text-xs font-semibold text-slate-400">kg</span>
                  </p>
                </div>
              </div>

              {/* Sets Completed */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Sets Completed
                  </p>
                  <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                    {metrics.totalSets} <span className="text-xs font-semibold text-slate-400">sets</span>
                  </p>
                </div>
              </div>

              {/* Exercises Total */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Movements
                  </p>
                  <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                    {metrics.totalExercises} <span className="text-xs font-semibold text-slate-400">exercises</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Targeted Muscles Breakdown */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Targeted Muscle Groups</span>
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  {metrics.trainedMuscles.length} Focus Areas
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {metrics.trainedMuscles.length > 0 ? (
                  metrics.trainedMuscles.map((muscle, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-xs flex items-center gap-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{muscle}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                    Full Body Conditioning
                  </span>
                )}
              </div>
            </div>

            {/* Motivational Banner */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border-l-4 border-emerald-500 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              &ldquo;Progress is forged one disciplined session at a time. Your body composition equilibrium has been fortified today.&rdquo;
            </div>

            {/* User Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                onClick={handleShare}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Copied Summary!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-teal-500" />
                    <span>Share Summary</span>
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-98"
              >
                <CheckCircle className="w-4 h-4 text-slate-950" />
                <span>Awesome! (Close)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutCompletionModal;

