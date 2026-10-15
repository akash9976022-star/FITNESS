import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Filter,
  CheckCircle2,
  Utensils,
  Dumbbell,
  MapPin,
  Info,
  Clock,
  Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ConsistencyStreakCard } from '../components/calendar/ConsistencyStreakCard';
import { FestivalDetailModal } from '../components/calendar/FestivalDetailModal';
import { CustomFestivalManagerModal } from '../components/calendar/CustomFestivalManagerModal';
import { PanchangamCard } from '../components/calendar/PanchangamCard';
import { DailyRasipalanCard } from '../components/calendar/DailyRasipalanCard';
import {
  getFestivalsForMonth,
  getFestivalsForDate,
} from '../data/tamilFestivalsData';
import {
  getTamilDate,
  formatBilingualDate,
  TAMIL_DAYS_OF_WEEK,
} from '../utils/tamilCalendar';
import type { TamilFestival } from '../types/calendar';

export const CalendarPage: React.FC = () => {
  const { streakData, customFestivals, addCustomFestival, deleteCustomFestival, checkIns, currentWorkout } =
    useAuth();

  const today = useMemo(() => new Date(), []);
  const todayYMD = useMemo(() => today.toISOString().split('T')[0], [today]);

  const [currentYear, setCurrentYear] = useState<number>(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => today.getMonth() + 1); // 1-12
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayYMD);

  // Active filter category
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'viratham' | 'skanda_sashti' | 'major_festival' | 'purattasi_sani' | 'custom'
  >('all');

  // Modal States
  const [activeFestivalDetail, setActiveFestivalDetail] = useState<TamilFestival | null>(null);
  const [isCustomManagerOpen, setIsCustomManagerOpen] = useState(false);

  // Month Navigation Handlers
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
    setSelectedDateStr(todayYMD);
  };

  // Preloaded Tamil festivals for current viewing month
  const monthFestivals = useMemo(() => {
    return getFestivalsForMonth(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Merge custom festivals for current viewing month
  const combinedFestivals = useMemo(() => {
    const monthStr = String(currentMonth).padStart(2, '0');
    const prefix = `${currentYear}-${monthStr}`;

    const customConverted: TamilFestival[] = customFestivals
      .filter((cf) => cf.date.startsWith(prefix))
      .map((cf) => ({
        id: cf.id,
        nameEn: cf.title,
        nameTa: cf.titleTa || cf.title,
        date: cf.date,
        category: 'custom',
        deity: cf.category === 'family_pooja' ? 'Kula Deivam / Ancestors' : 'Local Deity',
        isFastingDay: cf.dietaryPreference !== 'feast' && cf.dietaryPreference !== 'standard',
        fastingType:
          cf.dietaryPreference === 'water_fast'
            ? 'strict_water'
            : cf.dietaryPreference === 'fruit_milk'
            ? 'fruit_milk'
            : cf.dietaryPreference === 'vegetarian'
            ? 'sattvic_vegetarian'
            : 'none',
        significanceEn: `Custom local event (${cf.category.replace('_', ' ')}).`,
        significanceTa: cf.titleTa ? `உள்ளூர் திருவிழா / குடும்ப விழா: ${cf.titleTa}` : undefined,
        dietaryGuidance: `Observance Diet: ${cf.dietaryPreference.replace('_', ' ')}. Maintain hydration and hit daily protein target.`,
        workoutGuidance: 'Perform your scheduled maintenance workout or take a recovery walk.',
        specialNote: cf.notes,
        isCustom: true,
      }));

    return [...monthFestivals, ...customConverted];
  }, [monthFestivals, customFestivals, currentYear, currentMonth]);

  // Filtered festivals based on selected tab filter
  const filteredMonthFestivals = useMemo(() => {
    if (activeFilter === 'all') return combinedFestivals;
    if (activeFilter === 'viratham') return combinedFestivals.filter((f) => f.isFastingDay);
    if (activeFilter === 'skanda_sashti')
      return combinedFestivals.filter(
        (f) =>
          f.id.includes('skanda_sashti') ||
          f.category === 'sashti' ||
          f.nameEn.toLowerCase().includes('sashti') ||
          f.nameTa?.includes('சஷ்டி')
      );
    if (activeFilter === 'major_festival')
      return combinedFestivals.filter((f) => f.category === 'major_festival' || (f.isCustom && !f.isFastingDay));
    if (activeFilter === 'purattasi_sani')
      return combinedFestivals.filter(
        (f) =>
          f.category === 'purattasi_sani' ||
          f.nameEn.toLowerCase().includes('purattasi') ||
          f.nameTa?.includes('புரட்டாசி')
      );
    if (activeFilter === 'custom') return combinedFestivals.filter((f) => f.isCustom);
    return combinedFestivals;
  }, [combinedFestivals, activeFilter]);

  // Festivals occurring on the selected date
  const selectedDateFestivals = useMemo(() => {
    const standard = getFestivalsForDate(selectedDateStr);
    const custom = customFestivals
      .filter((cf) => cf.date === selectedDateStr)
      .map(
        (cf): TamilFestival => ({
          id: cf.id,
          nameEn: cf.title,
          nameTa: cf.titleTa || cf.title,
          date: cf.date,
          category: 'custom',
          deity: 'Local Temple / Family',
          isFastingDay: cf.dietaryPreference !== 'feast' && cf.dietaryPreference !== 'standard',
          fastingType:
            cf.dietaryPreference === 'water_fast'
              ? 'strict_water'
              : cf.dietaryPreference === 'fruit_milk'
              ? 'fruit_milk'
              : cf.dietaryPreference === 'vegetarian'
              ? 'sattvic_vegetarian'
              : 'none',
          significanceEn: cf.notes || 'Local celebration or personalized fasting event.',
          significanceTa: cf.titleTa,
          dietaryGuidance: `Preferred Protocol: ${cf.dietaryPreference}.`,
          workoutGuidance: 'Adjust workout intensity to match caloric intake.',
          specialNote: cf.notes,
          isCustom: true,
        })
      );
    return [...standard, ...custom];
  }, [selectedDateStr, customFestivals]);

  // Check-in or Workout on selected date
  const selectedDateCheckin = checkIns.find((c) => c.date === selectedDateStr);
  const selectedDateWorkout =
    currentWorkout && currentWorkout.date === selectedDateStr ? currentWorkout : null;

  // Selected date Tamil representation
  const selectedTamilDate = useMemo(() => {
    return getTamilDate(selectedDateStr);
  }, [selectedDateStr]);

  // Month grid day construction
  const calendarGrid = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 is Sunday

    const days: {
      dayNumber: number;
      dateStr: string;
      tamilDate: ReturnType<typeof getTamilDate>;
      festivals: TamilFestival[];
      hasCheckIn: boolean;
      hasWorkout: boolean;
      isToday: boolean;
      isSelected: boolean;
    }[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const tDate = getTamilDate(dStr);
      const dayFests = combinedFestivals.filter((f) => f.date === dStr);
      const hasCheckIn = checkIns.some((c) => c.date === dStr);
      const hasWorkout = Boolean(currentWorkout && currentWorkout.date === dStr && currentWorkout.completed);

      days.push({
        dayNumber: day,
        dateStr: dStr,
        tamilDate: tDate,
        festivals: dayFests,
        hasCheckIn,
        hasWorkout,
        isToday: dStr === todayYMD,
        isSelected: dStr === selectedDateStr,
      });
    }

    return { firstDayIndex, days };
  }, [currentYear, currentMonth, combinedFestivals, checkIns, currentWorkout, todayYMD, selectedDateStr]);

  // Current month header name (English + Tamil month span)
  const monthHeaderInfo = useMemo(() => {
    const sampleDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`;
    const td = getTamilDate(sampleDate);
    const monthNamesEn = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return {
      englishMonth: monthNamesEn[currentMonth - 1],
      tamilMonth: td.tamilMonthTa,
      tamilYear: td.tamilYearTa,
    };
  }, [currentYear, currentMonth]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* 1. TOP CONSISTENCY STREAK CARD */}
      <ConsistencyStreakCard streakData={streakData} />

      {/* 2. CALENDAR HEADER & ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <CalendarIcon className="w-7 h-7 text-brand-500" />
              Tamil Fitness Calendar
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              தமிழ் நாட்காட்டி
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 max-w-2xl">
            Seamlessly align training volume and energy intake with traditional Tamil Virathams (கந்த சஷ்டி, புரட்டாசி சனி, ஏகாதசி) and local temple festivals.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Manage Local Festivals CTA */}
          <button
            onClick={() => setIsCustomManagerOpen(true)}
            className="px-3.5 py-2.5 rounded-2xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <MapPin className="w-4 h-4 text-purple-500" />
            <span>Manage Local Festivals</span>
          </button>

          {/* Jump to Today */}
          <button
            onClick={handleJumpToToday}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold transition-all shadow-sm"
          >
            Today
          </button>

          {/* Month Steppers */}
          <div className="flex items-center bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl p-1 shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-black font-mono text-slate-900 dark:text-white">
              {monthHeaderInfo.englishMonth} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. BILINGUAL MONTH HIGHLIGHT BANNER */}
      <div className="p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-md backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-600 dark:text-brand-300 flex items-center justify-center font-bold text-sm shrink-0">
            ☀️
          </div>
          <div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Current Tamil Solar Month
            </div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{monthHeaderInfo.tamilMonth} மாதம்</span>
              <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                • {monthHeaderInfo.tamilYear} ஆண்டு
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>
            {filteredMonthFestivals.length} Observance{filteredMonthFestivals.length === 1 ? '' : 's'} in {monthHeaderInfo.englishMonth}
          </span>
        </div>
      </div>

      {/* 4. FILTER PILLS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 shrink-0 pl-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>

        {[
          { id: 'all', label: 'All Dates' },
          { id: 'viratham', label: 'Viratham / Fasting Days 🪔' },
          { id: 'skanda_sashti', label: 'Skanda Sashti / சூரசம்ஹாரம் ⚡' },
          { id: 'purattasi_sani', label: 'Purattasi Saturdays (புரட்டாசி சனி) 🪷' },
          { id: 'major_festival', label: 'Major Festivals (பொங்கல்/தீபாவளி)' },
          { id: 'custom', label: `Local Custom (${customFestivals.length})` },
        ].map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20 font-black'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white shadow-sm'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 5. MAIN BILINGUAL CALENDAR GRID */}
      <div className="rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xl backdrop-blur-xl">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
          {TAMIL_DAYS_OF_WEEK.map((d, i) => (
            <div
              key={i}
              className={`py-2 px-0.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider flex flex-col items-center justify-center text-center ${
                i === 0 || i === 6
                  ? 'text-amber-700 dark:text-amber-400 bg-amber-500/5 dark:bg-amber-500/10'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <div>{d.shortEn}</div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {d.shortTa}
              </div>
            </div>
          ))}
        </div>

        {/* Calendar days grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Empty cells before month start */}
          {Array.from({ length: calendarGrid.firstDayIndex }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="min-h-[72px] sm:min-h-[98px] rounded-2xl bg-slate-50/40 dark:bg-slate-950/20 border border-transparent"
            />
          ))}

          {/* Month Day Cells */}
          {calendarGrid.days.map((dayObj) => {
            const hasFestivals = dayObj.festivals.length > 0;
            const primaryFest = dayObj.festivals[0];

            return (
              <div
                key={dayObj.dateStr}
                onClick={() => setSelectedDateStr(dayObj.dateStr)}
                className={`min-h-[72px] sm:min-h-[98px] w-full min-w-0 overflow-hidden p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative ${
                  dayObj.isSelected
                    ? 'ring-2 ring-brand-500 bg-brand-500/10 border-brand-500/50 shadow-md'
                    : dayObj.isToday
                    ? 'border-amber-500/60 bg-amber-500/5 dark:bg-amber-500/10'
                    : 'border-slate-200/90 dark:border-slate-800/90 bg-white/70 dark:bg-slate-950/50 hover:border-brand-500/40 hover:bg-slate-50 dark:hover:bg-slate-900/80'
                }`}
              >
                {/* Cell Top Bar: English Date & Tamil Date */}
                <div className="flex items-start justify-between">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-xs sm:text-sm font-black ${
                        dayObj.isToday
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {dayObj.dayNumber}
                    </span>
                    {dayObj.isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    )}
                  </div>

                  {/* Tamil date subscript */}
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate max-w-[50px] text-right">
                    {dayObj.tamilDate.tamilDay}
                  </span>
                </div>

                {/* Center: Festival badges */}
                <div className="my-1 space-y-0.5 overflow-hidden">
                  {hasFestivals && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFestivalDetail(primaryFest);
                      }}
                      className={`px-1 sm:px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold truncate transition-transform hover:scale-[1.02] ${
                        primaryFest.isCustom
                          ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                          : primaryFest.isFastingDay
                          ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                      }`}
                      title={`${primaryFest.nameEn} (${primaryFest.nameTa})`}
                    >
                      {primaryFest.nameEn}
                    </div>
                  )}

                  {dayObj.festivals.length > 1 && (
                    <div className="text-[8px] sm:text-[9px] font-bold text-slate-400 dark:text-slate-500 pl-0.5">
                      +{dayObj.festivals.length - 1} more
                    </div>
                  )}
                </div>

                {/* Bottom: Activity Dots (Checkin + Workout) */}
                <div className="flex items-center justify-between pt-0.5 border-t border-slate-100 dark:border-slate-800/40">
                  <div className="flex items-center gap-1">
                    {dayObj.hasCheckIn && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm"
                        title="Morning Check-In Logged"
                      />
                    )}
                    {dayObj.hasWorkout && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-sm"
                        title="Workout Completed"
                      />
                    )}
                  </div>
                  <span className="text-[8px] font-mono text-slate-400 dark:text-slate-500">
                    {dayObj.tamilDate.tamilMonthTa.slice(0, 3)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. SELECTED DATE DEEP-DIVE & OBSERVANCE GUIDELINES */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
              Selected Day Breakdown
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5 flex items-center gap-2">
              <span>{formatBilingualDate(selectedDateStr).englishFormatted}</span>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                ({selectedTamilDate.tamilMonthTa} {selectedTamilDate.tamilDay})
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {selectedDateCheckin && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Check-in: {selectedDateCheckin.weight} kg
              </span>
            )}
            {selectedDateWorkout && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 flex items-center gap-1">
                <Dumbbell className="w-3.5 h-3.5 text-teal-500" />
                {selectedDateWorkout.name || 'Workout Finished'}
              </span>
            )}
          </div>
        </div>

        {/* Observances on selected day */}
        <div className="mt-5 space-y-4">
          {selectedDateFestivals.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 text-center">
              <CalendarIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Standard Maintenance Day
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                No major fasting observances or festivals for this date. Execute your standard workout volume and hit your maintenance macronutrient targets!
              </p>
            </div>
          ) : (
            selectedDateFestivals.map((fest) => (
              <div
                key={fest.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3 hover:border-brand-500/30 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        {fest.nameEn}
                      </span>
                      {fest.nameTa && (
                        <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
                          ({fest.nameTa})
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        {fest.fastingType.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    {fest.deity && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                        Presiding Veneration: <strong className="text-slate-700 dark:text-slate-300">{fest.deity}</strong>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setActiveFestivalDetail(fest)}
                    className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shrink-0 flex items-center gap-1.5"
                  >
                    <Info className="w-3.5 h-3.5 text-brand-500" />
                    <span>View Lore & Plan</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
                    <div className="font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Fasting & Nutrition Directive</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {fest.dietaryGuidance}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/20">
                    <div className="font-bold text-brand-700 dark:text-brand-400 mb-1 flex items-center gap-1.5">
                      <Dumbbell className="w-3.5 h-3.5 text-brand-500" />
                      <span>Workout Volume Strategy</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {fest.workoutGuidance}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 7 & 8: PANCHANGAM & RASIPALAN SIDE-BY-SIDE ON DESKTOP, STACKED ON MOBILE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <PanchangamCard selectedDateStr={selectedDateStr} />
        <DailyRasipalanCard selectedDateStr={selectedDateStr} />
      </div>

      {/* 9. UPCOMING OBSERVANCES TIMELINE THIS MONTH */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Observances & Fasting Timeline: {monthHeaderInfo.englishMonth} {currentYear}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              Plan your weekly meal preps and deload blocks around key religious fasts.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredMonthFestivals.length === 0 ? (
            <div className="col-span-full text-center py-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800">
              <CalendarIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No festivals or fasting days scheduled for this month
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Add your local temple festivals, family poojas, or virathams using our 1-click observance templates!
              </p>
              <button
                type="button"
                onClick={() => setIsCustomManagerOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md inline-flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Local Festival / Viratham</span>
              </button>
            </div>
          ) : (
            filteredMonthFestivals.map((fest) => {
            const fbDate = formatBilingualDate(fest.date);
            return (
              <div
                key={fest.id}
                onClick={() => {
                  setSelectedDateStr(fest.date);
                  setActiveFestivalDetail(fest);
                }}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 hover:border-brand-500/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                      {fbDate.englishFormatted}
                    </span>
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      {fbDate.tamilFormatted.split('(')[0]}
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {fest.nameEn}
                  </h4>
                  {fest.nameTa && (
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                      {fest.nameTa}
                    </div>
                  )}

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {fest.significanceEn}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate">
                    {fest.isFastingDay ? 'Viratham Fast' : 'Festive Feast'}
                  </span>
                  <span className="text-brand-600 dark:text-brand-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                    Explore →
                  </span>
                </div>
              </div>
            );
          })
          )}
        </div>
      </div>

      {/* 10. FESTIVAL DETAIL MODAL */}
      <FestivalDetailModal
        festival={activeFestivalDetail}
        onClose={() => setActiveFestivalDetail(null)}
      />

      {/* 11. CUSTOM LOCAL FESTIVAL MANAGER MODAL */}
      <CustomFestivalManagerModal
        isOpen={isCustomManagerOpen}
        onClose={() => setIsCustomManagerOpen(false)}
        customFestivals={customFestivals}
        onAddFestival={addCustomFestival}
        onDeleteFestival={deleteCustomFestival}
      />
    </div>
  );
};
