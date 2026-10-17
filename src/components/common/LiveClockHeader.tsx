import React, { useState, useEffect } from 'react';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';
import { getTamilDateDetails } from '../../utils/tamilCalendar';

export const LiveClockHeader: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeString = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const englishDateString = now.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const tamilDetails = getTamilDateDetails(now);

  return (
    <div
      className={`inline-flex items-center gap-2 sm:gap-3 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm backdrop-blur-md select-none transition-all duration-200 ${className}`}
      title={`Live System Clock & Tamil Calendar Engine: ${tamilDetails.tamilYearName} ஆண்டு, ${tamilDetails.tamilMonthName} ${tamilDetails.tamilDate}`}
    >
      {/* Live Ticking Time with Glowing Pulse */}
      <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-black tracking-tight text-emerald-700 dark:text-emerald-400 tabular-nums">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 hidden xs:inline" />
        <span>{timeString}</span>
      </div>

      <div className="hidden xs:block h-3.5 w-px bg-slate-300 dark:bg-slate-800" />

      {/* English Date */}
      <div className="hidden md:flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
        <CalendarIcon className="w-3 h-3 text-slate-400" />
        <span>{englishDateString}</span>
      </div>

      <div className="hidden md:block h-3.5 w-px bg-slate-300 dark:bg-slate-800" />

      {/* Tamil Month & Date Pill */}
      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-500/25">
        <span className="text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-500 font-extrabold hidden sm:inline">தமிழ்:</span>
        <span className="tracking-tight">
          {tamilDetails.tamilMonthName} {tamilDetails.tamilDate}
        </span>
        <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-medium hidden lg:inline">
          ({tamilDetails.tamilMonthEnglish})
        </span>
      </div>
    </div>
  );
};

export default LiveClockHeader;

