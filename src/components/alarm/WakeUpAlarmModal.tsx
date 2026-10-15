import React, { useState, useEffect } from 'react';
import {
  BellRing,
  Volume2,
  Sun,
  ArrowRight,
  ShieldAlert,
  X,
  Sparkles,
} from 'lucide-react';
import { useAlarmBriefing } from '../../context/AlarmBriefingContext';
import { getTamilDate } from '../../utils/tamilCalendar';

export const WakeUpAlarmModal: React.FC = () => {
  const {
    isAlarmRinging,
    alarmSecondsRemaining,
    stopAlarmAndStartBriefing,
    stopAll,
    isTestMode,
    testStageLabel,
  } = useAlarmBriefing();

  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [tamilDateStr, setTamilDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setCurrentDateStr(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      );
      const td = getTamilDate(now);
      setTamilDateStr(`${td.tamilMonthTa} ${td.tamilDay}, ${td.tamilYearTa} ஆண்டு`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isAlarmRinging) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alarm-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/95 backdrop-blur-2xl text-white select-none overflow-hidden animate-fadeIn"
      style={{ touchAction: 'none' }}
    >
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-rose-500/15 to-brand-500/20 pointer-events-none animate-pulse duration-1000" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Alert Card */}
      <div className="relative z-10 w-full max-w-xl bg-slate-900/90 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-500/20 text-center flex flex-col items-center">
        {/* Live Test Simulation Banner */}
        {isTestMode && (
          <div className="w-full mb-5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-brand-500/20 to-teal-500/20 border-2 border-amber-400/60 flex items-center justify-between text-xs font-black animate-pulse shadow-lg shadow-amber-500/10">
            <div className="flex items-center gap-2 text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>TEST SIMULATION</span>
            </div>
            <span className="font-mono text-[11px] text-teal-300 bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-teal-500/40">
              {testStageLabel}
            </span>
          </div>
        )}

        {/* Pulsing Alarm Bell Icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/40 animate-bounce">
            <BellRing className="w-12 h-12 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="absolute -top-1 -right-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-600 text-white border-2 border-slate-900 animate-pulse">
            MAX VOL 100%
          </span>
        </div>

        {/* Override Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold mb-3">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Peaceful Wake-Up • Max Volume 100% Override</span>
        </div>

        {/* Title */}
        <h1 id="alarm-modal-title" className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Good Morning - Wake Up!
        </h1>
        <p className="text-sm sm:text-base font-semibold text-amber-300 mt-1">
          காலை வணக்கம்! விழித்தெழுங்கள்!
        </p>

        {/* Digital Clock Display */}
        <div className="my-6 px-6 py-4 rounded-3xl bg-slate-950/80 border border-slate-800 w-full flex flex-col items-center shadow-inner">
          <span className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-white">
            {currentTimeStr || '06:00:00 AM'}
          </span>
          <div className="flex items-center justify-center gap-2 mt-2 text-xs sm:text-sm text-slate-300 font-medium flex-wrap">
            <span>{currentDateStr}</span>
            <span className="text-amber-400 font-bold">•</span>
            <span className="text-amber-400 font-bold font-mono">{tamilDateStr}</span>
          </div>
        </div>

        {/* Wakeup Chime Status */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
          <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>
            Peaceful resonant morning bell active ({alarmSecondsRemaining}s remaining) • Serene Awakening
          </span>
        </div>

        {/* Primary Action Button: Stop Alarm & Start Briefing */}
        <button
          onClick={stopAlarmAndStartBriefing}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-brand-500 to-teal-400 hover:from-amber-400 hover:via-brand-400 hover:to-teal-300 text-slate-950 font-black text-base sm:text-lg shadow-xl shadow-brand-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 group"
        >
          <Sun className="w-6 h-6 text-slate-950 group-hover:rotate-45 transition-transform" />
          <span>Stop Alarm & Start Briefing</span>
          <ArrowRight className="w-5 h-5 text-slate-950 group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="text-[11px] font-bold text-brand-300 mt-2">
          அலாரத்தை நிறுத்தி தமிழ் & ஆங்கில காலை செய்திகளைக் கேள்
        </div>

        {/* Emergency Stop / Dismiss */}
        <button
          onClick={stopAll}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors flex items-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          <span>Dismiss Alarm Completely</span>
        </button>
      </div>
    </div>
  );
};
