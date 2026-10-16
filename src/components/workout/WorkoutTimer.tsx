import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';

interface WorkoutTimerProps {
  startedAt?: number;
  isPausedInitially?: boolean;
  onTimeUpdate?: (seconds: number) => void;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onReset?: () => void;
}

export const WorkoutTimer: React.FC<WorkoutTimerProps> = ({
  startedAt,
  isPausedInitially = false,
  onTimeUpdate,
  onStart,
  onPause,
  onResume,
  onReset,
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(Boolean(startedAt && !isPausedInitially));
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    if (startedAt && !isPausedInitially) {
      return Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    }
    return 0;
  });

  // Ticker interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (onTimeUpdate) onTimeUpdate(next);
          return next;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, onTimeUpdate]);

  // Sync if external startedAt changes
  useEffect(() => {
    if (startedAt) {
      const calculated = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      setElapsedSeconds(calculated);
      setIsRunning(!isPausedInitially);
    }
  }, [startedAt, isPausedInitially]);

  const handleStart = () => {
    setIsRunning(true);
    if (onStart) onStart();
  };

  const handlePause = () => {
    setIsRunning(false);
    if (onPause) onPause();
  };

  const handleResume = () => {
    setIsRunning(true);
    if (onResume) onResume();
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
    if (onReset) onReset();
  };

  // Format time MM:SS or HH:MM:SS
  const formatTime = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    const pad = (n: number) => String(n).padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  return (
    <div className="flex items-center gap-3 py-2 px-3.5 rounded-2xl bg-slate-900/90 dark:bg-slate-950 border border-slate-700/60 dark:border-slate-800 text-white shadow-md">
      {/* Timer icon + Pulsing active indicator */}
      <div className="flex items-center gap-2">
        <div className="relative flex items-center justify-center">
          <Clock className="w-4 h-4 text-emerald-400" />
          {isRunning && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          )}
        </div>

        {/* Stopwatch Readout */}
        <div className="flex flex-col">
          <span className="font-mono text-base sm:text-lg font-black tracking-wider text-emerald-400 leading-none">
            {formatTime(elapsedSeconds)}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            {isRunning ? 'Training Live' : elapsedSeconds > 0 ? 'Paused' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 border-l border-slate-700/60 dark:border-slate-800 pl-2.5">
        {!startedAt && !isRunning && elapsedSeconds === 0 ? (
          <button
            type="button"
            onClick={handleStart}
            className="py-1 px-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow transition active:scale-95"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Start</span>
          </button>
        ) : isRunning ? (
          <button
            type="button"
            onClick={handlePause}
            className="py-1 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 font-bold text-xs flex items-center gap-1 transition active:scale-95"
            title="Pause workout timer"
          >
            <Pause className="w-3 h-3 fill-current" />
            <span className="hidden sm:inline">Pause</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleResume}
            className="py-1 px-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow transition active:scale-95"
            title="Resume timer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span className="hidden sm:inline">Resume</span>
          </button>
        )}

        {elapsedSeconds > 0 && !isRunning && (
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Reset timer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default WorkoutTimer;

