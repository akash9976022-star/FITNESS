import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Plus,
  Minus,
  CheckCircle2,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';

export interface RestTimerBannerProps {
  isActive: boolean;
  targetSeconds: number;
  exerciseName?: string;
  setNumber?: number;
  onFinish?: () => void;
  onDismiss?: () => void;
}

export const RestTimerBanner: React.FC<RestTimerBannerProps> = ({
  isActive,
  targetSeconds,
  exerciseName,
  setNumber,
  onFinish,
  onDismiss,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(targetSeconds);
  const [totalSeconds, setTotalSeconds] = useState<number>(targetSeconds);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fit_rest_timer_muted') === 'true';
    } catch {
      return false;
    }
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastBeepSecondRef = useRef<number | null>(null);

  // Sync when targetSeconds changes or banner becomes active
  useEffect(() => {
    if (isActive) {
      const initial = Math.max(5, targetSeconds || 60);
      setSecondsRemaining(initial);
      setTotalSeconds(initial);
      setIsPaused(false);
      lastBeepSecondRef.current = null;
    }
  }, [isActive, targetSeconds]);

  // Audio tone generator using native Web Audio API (100% offline & zero dependencies)
  const playAudioTone = (frequency: number, durationMs: number, type: OscillatorType = 'sine') => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // AudioContext blocked or not available
    }
  };

  // Countdown timer ticker
  useEffect(() => {
    if (!isActive || isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        const next = prev - 1;

        // 3-second countdown warning beeps (3, 2, 1)
        if (next === 3 && lastBeepSecondRef.current !== 3) {
          lastBeepSecondRef.current = 3;
          playAudioTone(587.33, 100); // D5
        } else if (next === 2 && lastBeepSecondRef.current !== 2) {
          lastBeepSecondRef.current = 2;
          playAudioTone(587.33, 100); // D5
        } else if (next === 1 && lastBeepSecondRef.current !== 1) {
          lastBeepSecondRef.current = 1;
          playAudioTone(783.99, 120); // G5
        }

        // Timer finished
        if (next <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);

          // Completion chime: C6 -> E6 double-tone
          playAudioTone(1046.5, 180);
          setTimeout(() => playAudioTone(1318.5, 250), 120);

          // Mobile Haptic Vibration
          try {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate([120, 80, 240]);
            }
          } catch {}

          if (onFinish) onFinish();
          return 0;
        }

        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isPaused, isMuted, onFinish]);

  if (!isActive) return null;

  const togglePause = () => setIsPaused((prev) => !prev);

  const addTime = (secs: number) => {
    setSecondsRemaining((prev) => Math.max(5, prev + secs));
    setTotalSeconds((prev) => Math.max(prev, prev + secs));
  };

  const handleSkip = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (onFinish) onFinish();
    else if (onDismiss) onDismiss();
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('fit_rest_timer_muted', String(next));
      } catch {}
      return next;
    });
  };

  // Format MM:SS
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  // Circular progress calculation
  const progressRatio = totalSeconds > 0 ? Math.max(0, Math.min(1, secondsRemaining / totalSeconds)) : 0;
  const strokeDashoffset = 100 - progressRatio * 100;

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
      <div className="relative p-3.5 sm:p-4 rounded-2xl bg-slate-950/95 dark:bg-slate-950 border border-emerald-500/40 shadow-2xl shadow-emerald-950/50 backdrop-blur-xl text-white flex items-center justify-between gap-3">
        {/* Glow ambient background element */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 pointer-events-none" />

        {/* Circular Countdown Progress Ring */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-13 h-13 -rotate-90 transform" viewBox="0 0 36 36">
            {/* Background track */}
            <path
              className="text-slate-800"
              strokeWidth="3.2"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            {/* Progress line */}
            <path
              className="text-emerald-400 transition-all duration-1000 ease-linear"
              strokeDasharray="100, 100"
              strokeDashoffset={strokeDashoffset}
              strokeWidth="3.2"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>

          {/* Time readout in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono text-xs sm:text-sm font-black tracking-tighter text-emerald-300">
              {timeFormatted}
            </span>
          </div>
        </div>

        {/* Center Information */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
              <Zap className="w-2.5 h-2.5" />
              Rest Interval
            </span>
            {setNumber && (
              <span className="text-[11px] font-bold text-slate-400">
                Set {setNumber} Done
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-bold text-white truncate">
            {exerciseName || 'Next Set Coming Up'}
          </p>
          <p className="text-[10px] text-slate-400 truncate">
            {isPaused ? 'Timer paused • Take your time' : 'Breathe deep • ATP recovery active'}
          </p>
        </div>

        {/* Quick Adjustment Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* -15s Button */}
          <button
            type="button"
            onClick={() => addTime(-15)}
            title="Deduct 15 seconds"
            className="p-1.5 sm:px-2 sm:py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-mono font-bold transition flex items-center gap-0.5"
          >
            <Minus className="w-3 h-3" />
            <span className="hidden sm:inline">15s</span>
          </button>

          {/* +30s Button */}
          <button
            type="button"
            onClick={() => addTime(30)}
            title="Add 30 seconds"
            className="p-1.5 sm:px-2 sm:py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-[11px] font-mono font-bold transition flex items-center gap-0.5"
          >
            <Plus className="w-3 h-3" />
            <span className="hidden sm:inline">30s</span>
          </button>

          {/* Pause / Play */}
          <button
            type="button"
            onClick={togglePause}
            title={isPaused ? 'Resume rest timer' : 'Pause rest timer'}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition"
          >
            {isPaused ? (
              <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
            ) : (
              <Pause className="w-3.5 h-3.5 fill-current text-amber-400" />
            )}
          </button>

          {/* Sound Mute Toggle */}
          <button
            type="button"
            onClick={toggleMute}
            title={isMuted ? 'Unmute chime' : 'Mute chime'}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>

          {/* Skip / Finish Button */}
          <button
            type="button"
            onClick={handleSkip}
            title="Skip Rest & Start Next Set"
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition flex items-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ready</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestTimerBanner;
