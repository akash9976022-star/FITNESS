import React, { useState, useMemo } from 'react';
import {
  Dumbbell,
  Play,
  Edit2,
  Check,
  Plus,
  Trash2,
  Clock,
  Layers,
  Coffee,
  HeartPulse,
  Sparkles,
  Droplets,
  Footprints,
  Moon,
  Timer,
  Zap,
  Calendar,
  CalendarCheck,
  X,
  ArrowRight,
  ShieldCheck,
  Info,
} from 'lucide-react';
import {
  type DayOfWeek,
  type DayRoutineTemplate,
  type CustomExercise,
  type ExerciseItem,
  type ExerciseSet,
  type RestLeaveRequest,
  getTemplateForCategory,
} from '../../services/firestoreService';
import {
  getCalendarDayInfo,
  type TamilDateInfo,
  type CustomFestivalDoc,
} from '../../utils/tamilCalendar';
import RestLeaveRequestModal from './RestLeaveRequestModal';

export interface DayCalendarMeta {
  dayId: DayOfWeek;
  date: Date;
  dateString: string;
  dayOfMonth: number;
  monthShort: string;
  isToday: boolean;
  isFastingDay: boolean;
  festivalName: string;
  festivalTamil: string;
  shortTag: string;
  thithiName: string;
}

export function getWeekCalendarMeta(
  customFestivals: CustomFestivalDoc[] = [],
  refDate = new Date()
): Record<DayOfWeek, DayCalendarMeta> {
  const currentDay = refDate.getDay(); // 0 is Sunday, 1 is Monday...
  const distToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(refDate);
  monday.setDate(refDate.getDate() + distToMonday);
  monday.setHours(0, 0, 0, 0);

  const todayStr = refDate.toISOString().split('T')[0];
  const order: { id: DayOfWeek; offset: number }[] = [
    { id: 'monday', offset: 0 },
    { id: 'tuesday', offset: 1 },
    { id: 'wednesday', offset: 2 },
    { id: 'thursday', offset: 3 },
    { id: 'friday', offset: 4 },
    { id: 'saturday', offset: 5 },
    { id: 'sunday', offset: 6 },
  ];

  const result: Partial<Record<DayOfWeek, DayCalendarMeta>> = {};

  order.forEach(({ id, offset }) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + offset);
    const dateStr = d.toISOString().split('T')[0];
    const isToday = dateStr === todayStr;

    let calInfo: TamilDateInfo | null = null;
    try {
      calInfo = getCalendarDayInfo(d, customFestivals);
    } catch {
      calInfo = null;
    }

    const isFasting = calInfo?.isFastingDay || false;
    let festivalName = '';
    let festivalTamil = '';
    let shortTag = '';

    if (calInfo) {
      if (calInfo.festivals && calInfo.festivals.length > 0) {
        const top = calInfo.festivals.find((f) => f.category === 'Viratham / Fasting') || calInfo.festivals[0];
        festivalName = top.nameEnglish;
        festivalTamil = top.nameTamil;
        shortTag = top.nameEnglish.split(' ')[0];
      } else if (calInfo.panchangam?.thithi?.nameEnglish) {
        const t = calInfo.panchangam.thithi.nameEnglish;
        if (t.includes('Ekadashi')) {
          festivalName = 'Ekadasi Viratham';
          shortTag = 'Ekadasi';
        } else if (t.includes('Sashti')) {
          festivalName = 'Sashti Viratham';
          shortTag = 'Sashti';
        } else if (t.includes('Pradosham')) {
          festivalName = 'Pradosham';
          shortTag = 'Pradosham';
        } else if (t.includes('Pournami')) {
          festivalName = 'Pournami';
          shortTag = 'Pournami';
        } else if (t.includes('Amavasya')) {
          festivalName = 'Amavasai';
          shortTag = 'Amavasai';
        } else if (isFasting) {
          festivalName = 'Sacred Fasting Day';
          shortTag = 'Fasting';
        }
      }
    }

    result[id] = {
      dayId: id,
      date: d,
      dateString: dateStr,
      dayOfMonth: d.getDate(),
      monthShort: d.toLocaleString('en-US', { month: 'short' }),
      isToday,
      isFastingDay: isFasting,
      festivalName,
      festivalTamil,
      shortTag: shortTag || (isFasting ? 'Fasting' : ''),
      thithiName: calInfo?.panchangam?.thithi?.nameEnglish || '',
    };
  });

  return result as Record<DayOfWeek, DayCalendarMeta>;
}

interface HevyDaySplitSelectorProps {
  dailyRoutines: Record<DayOfWeek, DayRoutineTemplate>;
  activeDay: DayOfWeek;
  onSelectDay: (day: DayOfWeek) => void;
  onStartRoutine: (routine: DayRoutineTemplate) => void;
  onUpdateRoutine: (dayId: DayOfWeek, updated: Partial<DayRoutineTemplate>) => Promise<void>;
  onSubmitLeaveRequest?: (request: Omit<RestLeaveRequest, 'id' | 'createdAt'>) => Promise<void>;
  onOpenCustomLibrary: () => void;
  customExercises: CustomExercise[];
  isWorkoutActive: boolean;
  isFasting?: boolean;
  onToggleFasting?: () => void;
  onSetFasting?: (val: boolean) => void;
  customFestivals?: CustomFestivalDoc[];
  userName?: string;
  showToast?: (msg: string) => void;
}

const DAYS_ORDER: { id: DayOfWeek; short: string; label: string }[] = [
  { id: 'monday', short: 'Mon', label: 'Monday' },
  { id: 'tuesday', short: 'Tue', label: 'Tuesday' },
  { id: 'wednesday', short: 'Wed', label: 'Wednesday' },
  { id: 'thursday', short: 'Thu', label: 'Thursday' },
  { id: 'friday', short: 'Fri', label: 'Friday' },
  { id: 'saturday', short: 'Sat', label: 'Saturday' },
  { id: 'sunday', short: 'Sun', label: 'Sunday' },
];

const SPLIT_CATEGORIES: Array<{
  id: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full_body' | 'rest';
  label: string;
  icon: string;
}> = [
  { id: 'rest', label: 'Rest Day', icon: '☕' },
  { id: 'legs', label: 'Legs', icon: '🦵' },
  { id: 'push', label: 'Push', icon: '🏋️' },
  { id: 'pull', label: 'Pull', icon: '🚣' },
  { id: 'upper', label: 'Upper', icon: '⚡' },
  { id: 'lower', label: 'Lower', icon: '🏃' },
  { id: 'full_body', label: 'Full Body', icon: '🔥' },
];

export const getTodayDayOfWeek = (): DayOfWeek => {
  const dayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday
  const map: Record<number, DayOfWeek> = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
  };
  return map[dayIndex] || 'monday';
};

export const HevyDaySplitSelector: React.FC<HevyDaySplitSelectorProps> = ({
  dailyRoutines,
  activeDay,
  onSelectDay,
  onStartRoutine,
  onUpdateRoutine,
  onSubmitLeaveRequest,
  onOpenCustomLibrary,
  customExercises,
  isWorkoutActive,
  isFasting = false,
  onToggleFasting,
  onSetFasting,
  customFestivals = [],
  userName = 'Athlete',
  showToast,
}) => {
  const currentDayTemplate = dailyRoutines[activeDay];
  const todayDayId = getTodayDayOfWeek();

  // Astronomical Tamil Calendar & Fasting Detection for the active 7-day week
  const weekCalendarMeta = useMemo(() => {
    return getWeekCalendarMeta(customFestivals);
  }, [customFestivals]);

  const todayMeta = weekCalendarMeta[todayDayId];
  const currentDayMeta = weekCalendarMeta[activeDay];

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isCalendarSyncModalOpen, setIsCalendarSyncModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Inline exercise adding states for this day's routine
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState('Chest');
  const [newExSets, setNewExSets] = useState('3');
  const [newExWeight, setNewExWeight] = useState('20');
  const [newExReps, setNewExReps] = useState('10');
  const [newExRestSeconds, setNewExRestSeconds] = useState('90');

  // Compute current training and rest days counts
  const routineList = Object.values(dailyRoutines);
  const restDayCount = routineList.filter((r) => r.isRestDay).length;

  const handleTriggerCalendarSync = () => {
    if (todayMeta?.isFastingDay && !isFasting && onSetFasting) {
      onSetFasting(true);
    }
    setIsCalendarSyncModalOpen(true);
  };

  const handleSetFastingAsRestDays = async () => {
    const fastingDays = Object.values(weekCalendarMeta).filter((m) => m.isFastingDay);
    if (fastingDays.length === 0) {
      showToast?.('No fasting days detected this week to convert to rest days.');
      return;
    }

    let projectedCount = 0;
    DAYS_ORDER.forEach((d) => {
      const isFastingDay = weekCalendarMeta[d.id]?.isFastingDay;
      const currentRest = dailyRoutines[d.id]?.isRestDay;
      if (isFastingDay || currentRest) {
        projectedCount++;
      }
    });

    if (projectedCount > 3) {
      showToast?.(
        `Setting all fasting days as rest days would result in ${projectedCount} rest days (Max is 3)! Please select individual rest days or choose Moderate Fasting Pacing.`
      );
      return;
    }

    setIsSyncing(true);
    try {
      for (const fDay of fastingDays) {
        const dayTemplate = dailyRoutines[fDay.dayId];
        await onUpdateRoutine(fDay.dayId, {
          isRestDay: true,
          splitCategory: 'rest',
          routineName: `${dayTemplate?.dayName || fDay.dayId} - Sacred Fasting Rest (${fDay.shortTag || 'Viratham'})`,
          exercises: [],
        });
      }
      if (todayMeta?.isFastingDay && onSetFasting) {
        onSetFasting(true);
      }
      showToast?.(`Converted ${fastingDays.length} fasting day(s) to Sacred Rest & Recovery!`);
      setIsCalendarSyncModalOpen(false);
    } catch (err) {
      console.error('Failed to sync rest days:', err);
      showToast?.('Error syncing rest days.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApplyFastingPacing = async () => {
    setIsSyncing(true);
    try {
      const fastingDays = Object.values(weekCalendarMeta).filter((m) => m.isFastingDay);
      for (const fDay of fastingDays) {
        const dayTemplate = dailyRoutines[fDay.dayId];
        if (dayTemplate && !dayTemplate.isRestDay) {
          const cat = dayTemplate.splitCategory || 'full_body';
          const calibrated = getTemplateForCategory(cat, fDay.dayId, dayTemplate.dayName, true);
          await onUpdateRoutine(fDay.dayId, {
            ...calibrated,
            dayId: fDay.dayId,
          });
        }
      }
      if (onSetFasting) {
        onSetFasting(true);
      } else if (onToggleFasting && !isFasting) {
        onToggleFasting();
      }
      showToast?.('Calibrated fasting workout days with moderate pacing (RPE 6-7, 90s-120s rest)!');
      setIsCalendarSyncModalOpen(false);
    } catch (err) {
      console.error('Failed to apply fasting pacing:', err);
      showToast?.('Error updating fasting pacing.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncBadgesOnly = () => {
    if (todayMeta?.isFastingDay) {
      if (onSetFasting) onSetFasting(true);
      else if (onToggleFasting && !isFasting) onToggleFasting();
      showToast?.(`Calendar synced! Today is ${todayMeta.festivalName || 'Sacred Fasting'} (Fasting Mode enabled).`);
    } else {
      showToast?.('Calendar fasting badges updated on 7-day split.');
    }
    setIsCalendarSyncModalOpen(false);
  };

  const handleStartEditTitle = () => {
    setTitleDraft(currentDayTemplate?.routineName || '');
    setIsEditingTitle(true);
  };

  const handleSaveTitle = async () => {
    if (!titleDraft.trim()) {
      setIsEditingTitle(false);
      return;
    }
    await onUpdateRoutine(activeDay, { routineName: titleDraft.trim() });
    setIsEditingTitle(false);
    showToast?.(`Updated ${currentDayTemplate?.dayName} routine title.`);
  };

  /**
   * 1-Tap Category Switcher Handler
   */
  const handleSelectCategory = async (catId: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full_body' | 'rest') => {
    if (!currentDayTemplate) return;

    if (catId === 'rest') {
      // If user is already on a rest day, do nothing
      if (currentDayTemplate.isRestDay) return;

      // If user already has 3 rest days, require formal permission letter!
      if (restDayCount >= 3) {
        setIsLeaveModalOpen(true);
        return;
      }

      await onUpdateRoutine(activeDay, {
        isRestDay: true,
        splitCategory: 'rest',
        routineName: `${currentDayTemplate.dayName} - ${isFasting ? 'Sacred Fasting Rest & Recovery' : 'Rest & Muscle Rebuild'}`,
        exercises: [],
      });
      showToast?.(`Marked ${currentDayTemplate.dayName} as a Rest & Recovery day.`);
      return;
    }

    // Generate calibrated template for this category
    const generated = getTemplateForCategory(catId, activeDay, currentDayTemplate.dayName, isFasting);
    await onUpdateRoutine(activeDay, {
      ...generated,
      isRestDay: false,
      splitCategory: catId,
      dayId: activeDay,
    });

    const isRemovingLastRest = currentDayTemplate.isRestDay && restDayCount <= 1;
    showToast?.(
      isRemovingLastRest
        ? `Assigned ${catId.toUpperCase()} split to ${currentDayTemplate.dayName}! Weekly calendar updated. (Tip: Keep 1–3 rest days per week for optimal recovery).`
        : `Assigned ${catId.toUpperCase()} split to ${currentDayTemplate.dayName}! Weekly calendar updated.`
    );
  };

  /**
   * Direct Toggle Rest Day (with Leave Application trigger when > 3)
   */
  const handleToggleRestDay = async () => {
    if (!currentDayTemplate) return;
    const willBeRest = !currentDayTemplate.isRestDay;

    // If attempting to take more than 3 rest days: open formal leave modal!
    if (willBeRest && restDayCount >= 3) {
      setIsLeaveModalOpen(true);
      return;
    }

    if (willBeRest) {
      await onUpdateRoutine(activeDay, {
        isRestDay: true,
        splitCategory: 'rest',
        routineName: `${currentDayTemplate.dayName} - ${isFasting ? 'Sacred Fasting Rest & Recovery' : 'Rest & Muscle Rebuild'}`,
        exercises: [],
      });
      showToast?.(`Marked ${currentDayTemplate.dayName} as a Rest & Active Recovery day. Weekly calendar updated.`);
    } else {
      // Switching from Rest to Active Training Day: generate complete exercises & timing
      const targetCategory =
        currentDayTemplate.splitCategory && currentDayTemplate.splitCategory !== 'rest'
          ? currentDayTemplate.splitCategory
          : 'legs'; // smart default to legs split
      const generated = getTemplateForCategory(targetCategory, activeDay, currentDayTemplate.dayName, isFasting);

      await onUpdateRoutine(activeDay, {
        ...generated,
        isRestDay: false,
        splitCategory: targetCategory,
        dayId: activeDay,
      });

      const isRemovingLastRest = restDayCount <= 1;
      showToast?.(
        isRemovingLastRest
          ? `Switched ${currentDayTemplate.dayName} to ${targetCategory.toUpperCase()} workout! Weekly calendar updated. (Tip: Keep 1–3 rest days per week).`
          : `Switched ${currentDayTemplate.dayName} to ${targetCategory.toUpperCase()} workout! Weekly calendar updated.`
      );
    }
  };

  const handleLeaveSubmitted = async (request: Omit<RestLeaveRequest, 'id' | 'createdAt'>) => {
    if (onSubmitLeaveRequest) {
      await onSubmitLeaveRequest(request);
    }
    // Mark the requested day as a rest day
    await onUpdateRoutine(activeDay, {
      isRestDay: true,
      splitCategory: 'rest',
      routineName: `${currentDayTemplate.dayName} - Emergency Rest (${request.reasonCategory.toUpperCase()})`,
      exercises: [],
    });
  };

  const handleCycleExerciseRest = async (exerciseId: string, currentRest = 90) => {
    if (!currentDayTemplate) return;
    const nextRest = currentRest === 60 ? 90 : currentRest === 90 ? 120 : currentRest === 120 ? 45 : 60;
    const updatedExercises = (currentDayTemplate.exercises || []).map((ex) =>
      ex.id === exerciseId ? { ...ex, targetRestSeconds: nextRest } : ex
    );
    await onUpdateRoutine(activeDay, { exercises: updatedExercises });
    showToast?.(`Rest interval set to ${nextRest}s`);
  };

  const handleAddExerciseToRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim() || !currentDayTemplate) return;

    const countSets = Math.max(1, parseInt(newExSets) || 3);
    const weightNum = Math.max(0, parseFloat(newExWeight) || 0);
    const repsNum = Math.max(1, parseInt(newExReps) || 10);
    const restNum = Math.max(15, parseInt(newExRestSeconds) || 90);

    const generatedSets: ExerciseSet[] = Array.from({ length: countSets }).map((_, i) => ({
      id: `s-${Date.now()}-${i + 1}`,
      setNumber: i + 1,
      weight: weightNum,
      reps: repsNum,
      completed: false,
    }));

    const newEx: ExerciseItem = {
      id: `ex-${Date.now()}`,
      name: newExName.trim(),
      muscle: newExMuscle.trim() || 'General',
      sets: generatedSets,
      targetRestSeconds: restNum,
    };

    const updatedExercises = [...(currentDayTemplate.exercises || []), newEx];
    await onUpdateRoutine(activeDay, { exercises: updatedExercises });

    setNewExName('');
    setIsAddingExercise(false);
    showToast?.(`Added "${newEx.name}" with ${restNum}s rest to ${currentDayTemplate.dayName} routine.`);
  };

  const handleRemoveExerciseFromRoutine = async (exerciseId: string) => {
    if (!currentDayTemplate) return;
    const updatedExercises = (currentDayTemplate.exercises || []).filter((e) => e.id !== exerciseId);
    await onUpdateRoutine(activeDay, { exercises: updatedExercises });
    showToast?.(`Removed exercise from ${currentDayTemplate.dayName} routine.`);
  };

  const handleAddCustomExerciseDirectly = async (customEx: CustomExercise) => {
    if (!currentDayTemplate) return;

    const newEx: ExerciseItem = {
      id: `ex-cust-${Date.now()}-${customEx.id}`,
      name: customEx.name,
      muscle: customEx.muscle,
      targetRestSeconds: 90,
      sets: [
        { id: `s-${Date.now()}-1`, setNumber: 1, weight: customEx.defaultWeightKg, reps: customEx.defaultReps, completed: false },
        { id: `s-${Date.now()}-2`, setNumber: 2, weight: customEx.defaultWeightKg, reps: customEx.defaultReps, completed: false },
        { id: `s-${Date.now()}-3`, setNumber: 3, weight: customEx.defaultWeightKg, reps: customEx.defaultReps, completed: false },
      ],
    };

    const updated = [...(currentDayTemplate.exercises || []), newEx];
    await onUpdateRoutine(activeDay, { exercises: updated });
    showToast?.(`Added custom movement "${customEx.name}" to ${currentDayTemplate.dayName} split.`);
  };

  return (
    <div className="space-y-4">
      {/* 1. FASTING DETECTOR & SPIRITUAL RECOVERY HUD CARD (ALWAYS ACCESSIBLE) */}
      <div
        className={`p-3.5 sm:p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 shadow-md ${
          isFasting
            ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-amber-500/40 shadow-amber-950/20'
            : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 shadow-slate-900/5'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                isFasting
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              <Moon className={`w-5 h-5 ${isFasting ? 'fill-amber-400/20 text-amber-400' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs font-black uppercase tracking-wider ${
                    isFasting ? 'text-amber-400' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {isFasting ? 'Sacred Fasting Day Active' : 'Fasting Mode: Inactive'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                    isFasting
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {isFasting ? 'Moderate Pacing' : 'Standard Strength Pacing'}
                </span>
                {todayMeta?.isFastingDay && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    🕊️ Today: {todayMeta.festivalName || 'Sacred Viratham'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isFasting
                  ? 'Heavy failure sets paused. Rest intervals extended to 90s–120s to prevent dehydration & dizziness.'
                  : 'Standard progressive overload enabled. Click Auto-Sync or toggle anytime to activate moderate fasting protocol.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => {
                if (onSetFasting) {
                  onSetFasting(!isFasting);
                } else if (onToggleFasting) {
                  onToggleFasting();
                }
                showToast?.(
                  isFasting
                    ? 'Fasting Mode deactivated (Standard Strength pacing restored).'
                    : 'Fasting Mode activated with moderate pacing (90s–120s rest).'
                );
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 btn-tactile ${
                isFasting
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>{isFasting ? 'Turn Fasting OFF' : 'Turn Fasting ON'}</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerCalendarSync}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md shadow-amber-500/20 transition flex items-center gap-1.5 btn-tactile"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Auto-Sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 7-DAY HEVY WEEK BAR WITH VISUAL BADGES */}
      <div className="p-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur-xl">
        {/* Header HUD: Rest Days Balance & Calendar Auto-Update */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-1 pb-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5 text-emerald-500" />
            Weekly Routine Split
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                restDayCount <= 3 && restDayCount >= 1
                  ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}
            >
              <Coffee className="w-3 h-3" />
              Rest Days: {restDayCount} / 3 (Min 1, Max 3)
            </span>

            <button
              type="button"
              onClick={handleTriggerCalendarSync}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-xs transition active:scale-95"
              title="Auto-detect Tamil festivals and fasting days for this week"
            >
              <Calendar className="w-3 h-3" />
              <span>Auto Update from Calendar</span>
            </button>
          </div>
        </div>

        {/* 7-Day Day Chips */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {DAYS_ORDER.map((d) => {
            const isSelected = activeDay === d.id;
            const isToday = todayDayId === d.id;
            const routine = dailyRoutines[d.id];
            const isRest = routine?.isRestDay;
            const meta = weekCalendarMeta[d.id];

            return (
              <button
                key={d.id}
                onClick={() => onSelectDay(d.id)}
                className={`flex flex-col items-center justify-center py-2.5 sm:py-3 px-1 rounded-xl text-center transition-all duration-200 relative btn-tactile ${
                  isSelected
                    ? isRest
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black shadow-lg shadow-indigo-500/25 scale-[1.03]'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-lg shadow-emerald-500/25 scale-[1.03]'
                    : isRest
                    ? 'hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-slate-600 dark:text-slate-400'
                    : 'hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {/* Today Indicator */}
                {isToday && (
                  <span
                    className={`absolute -top-1 px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      isSelected
                        ? 'bg-slate-950 text-white'
                        : 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                    }`}
                  >
                    Today
                  </span>
                )}

                <span className="text-[11px] sm:text-xs font-black tracking-tight uppercase">
                  {d.short}
                </span>

                <div className="mt-1 flex items-center justify-center">
                  {isRest ? (
                    <Coffee className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-indigo-400'}`} />
                  ) : (
                    <Dumbbell className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-emerald-500'}`} />
                  )}
                </div>

                <span
                  className={`text-[9px] sm:text-[10px] font-bold mt-0.5 truncate max-w-full px-1 ${
                    isSelected
                      ? isRest
                        ? 'text-white font-black'
                        : 'text-slate-950 font-black'
                      : isRest
                      ? 'text-indigo-500 dark:text-indigo-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {isRest ? 'Rest' : routine?.splitCategory?.toUpperCase() || 'TRAIN'}
                </span>

                {/* Fasting Badge */}
                {meta?.isFastingDay && (
                  <span
                    className={`mt-0.5 inline-flex items-center gap-0.5 px-1 py-0.2 rounded-full text-[8px] font-black uppercase tracking-wider ${
                      isSelected
                        ? isRest
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-950/30 text-slate-950'
                        : 'bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    🕊️ {meta.shortTag || 'Fast'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 3. 1-TAP MUSCLE SPLIT QUICK-CHANGER BAR */}
        <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              1-Tap Switch {currentDayTemplate?.dayName} to:
            </span>
            <span className="text-[10px] text-slate-400">
              {currentDayTemplate?.isRestDay
                ? 'Currently Rest'
                : `Currently ${currentDayTemplate?.splitCategory?.toUpperCase()}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {SPLIT_CATEGORIES.map((cat) => {
              const isCurrent = currentDayTemplate?.isRestDay
                ? cat.id === 'rest'
                : currentDayTemplate?.splitCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition active:scale-95 ${
                    isCurrent
                      ? cat.id === 'rest'
                        ? 'bg-indigo-600 text-white shadow-md font-black'
                        : 'bg-emerald-600 text-white shadow-md font-black'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Day Fasting Insight */}
          {currentDayMeta?.isFastingDay && (
            <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 text-xs text-amber-300 animate-fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>{currentDayTemplate?.dayName}</strong> ({currentDayMeta.monthShort} {currentDayMeta.dayOfMonth}) is a sacred Tamil Fasting Day ({currentDayMeta.festivalName || 'Viratham'}).
                </span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full shrink-0">
                Pacing: Moderate 90s-120s
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4. ACTIVE DAY DETAIL: REST RECOVERY HUB vs TRAINING ROUTINE */}
      {currentDayTemplate && (
        <div className="rounded-3xl bg-white/85 dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-lg backdrop-blur-xl overflow-hidden transition-all duration-200">
          {/* Card Top Banner */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/50">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-black uppercase tracking-wider ${
                  currentDayTemplate.isRestDay ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {currentDayTemplate.dayName} {currentDayTemplate.isRestDay ? 'Recovery Day' : 'Training Routine'}
                </span>

                {todayDayId === activeDay && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                    Active Today
                  </span>
                )}

                {currentDayTemplate.isRestDay ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                    <Coffee className="w-3 h-3" />
                    Rest & Muscle Repair
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <Dumbbell className="w-3 h-3" />
                    {currentDayTemplate.splitCategory.toUpperCase()} Focus
                  </span>
                )}
              </div>

              {/* Routine Title with Edit */}
              {isEditingTitle ? (
                <div className="flex items-center gap-2 mt-1.5">
                  <input
                    type="text"
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    className="px-3 py-1.5 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 border border-emerald-500 focus:outline-none w-full max-w-md"
                    placeholder="Routine name..."
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                    title="Save title"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1 group">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {currentDayTemplate.routineName}
                  </h3>
                  <button
                    onClick={handleStartEditTitle}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded opacity-75 group-hover:opacity-100 transition"
                    title="Edit routine title"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="flex items-center gap-1 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentDayTemplate.targetDurationMinutes || 40} mins planned</span>
                </span>
                {!currentDayTemplate.isRestDay && (
                  <>
                    <span>•</span>
                    <span className="font-semibold">
                      {(currentDayTemplate.exercises || []).length} Movements
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <Timer className="w-3.5 h-3.5" />
                      <span>Smart Rest Timers Active</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Toggle Rest/Workout Day Button */}
              <button
                type="button"
                onClick={handleToggleRestDay}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                  currentDayTemplate.isRestDay
                    ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={currentDayTemplate.isRestDay ? 'Switch to Training Day' : 'Mark as Rest & Recovery Day'}
              >
                {currentDayTemplate.isRestDay ? (
                  <>
                    <Dumbbell className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Switch to Workout</span>
                  </>
                ) : (
                  <>
                    <Coffee className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Mark as Rest Day</span>
                  </>
                )}
              </button>

              {/* Start Workout Button (only for active training days) */}
              {!currentDayTemplate.isRestDay && (
                <button
                  type="button"
                  onClick={() => onStartRoutine(currentDayTemplate)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition btn-tactile flex-shrink-0"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{isWorkoutActive ? 'Switch Active Session' : 'Start Workout'}</span>
                </button>
              )}
            </div>
          </div>

          {/* VIEW A: DEDICATED REST & ACTIVE RECOVERY HUB */}
          {currentDayTemplate.isRestDay ? (
            <div className="p-4 sm:p-6 space-y-5">
              {/* Rest Day Motivational Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-teal-500/10 border border-indigo-500/20">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      Active Recovery & Muscle Rebuild Protocol
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      Muscle hypertrophy and strength adaptation don't happen in the gym — they occur while resting. Today your Central Nervous System (CNS) replenishes neurotransmitters, glycogen stores refill, and micro-tears synthesize into denser fibers.
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 Rest Day Action Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Pillar 1: Protein & Fuel */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/15 text-amber-500 shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      1. Maintain Protein Target
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Hit your 1.6–2.2g/kg daily protein target today. Muscle protein synthesis remains elevated for 24–48 hours post-workout.
                    </p>
                  </div>
                </div>

                {/* Pillar 2: Joint Hydration */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-500 shrink-0 mt-0.5">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      2. Hydrate Joint Cartilage (3.0L)
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Drink 3.0L–3.5L of water to flush metabolic lactic byproducts and replenish synovial fluid inside heavy lifting joints.
                    </p>
                  </div>
                </div>

                {/* Pillar 3: Active Recovery Walk */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-500 shrink-0 mt-0.5">
                    <Footprints className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      3. Light Walk (7,500 Steps)
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Low-intensity walking increases cardiac output and systemic blood flow without inducing muscle tissue breakdown.
                    </p>
                  </div>
                </div>

                {/* Pillar 4: Deep Sleep */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/15 text-purple-500 shrink-0 mt-0.5">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      4. 8-Hour Deep Sleep Target
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Human Growth Hormone (HGH) peaks during Stage 3 Slow-Wave Sleep. The 9:00 PM voice debrief will guide your wind-down.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* VIEW B: ACTIVE TRAINING DAY EXERCISES */
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  <span>Scheduled Movements & Rest Durations</span>
                </h4>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onOpenCustomLibrary}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Dumbbell className="w-3.5 h-3.5" />
                    <span>Custom Library ({customExercises.length})</span>
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingExercise(!isAddingExercise)}
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-500 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Movement</span>
                  </button>
                </div>
              </div>

              {/* Quick 1-tap add custom exercises to this day */}
              {customExercises.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1 pb-1">
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    + Add from library:
                  </span>
                  {customExercises.slice(0, 5).map((ce) => (
                    <button
                      key={ce.id}
                      type="button"
                      onClick={() => handleAddCustomExerciseDirectly(ce)}
                      className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/30 transition flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3 text-emerald-500" />
                      <span>{ce.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Inline Add Exercise to this day form */}
              {isAddingExercise && (
                <form
                  onSubmit={handleAddExerciseToRoutine}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Add Movement to {currentDayTemplate.dayName}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingExercise(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        required
                        placeholder="Movement name (e.g. Incline Dumbbell Press)"
                        value={newExName}
                        onChange={(e) => setNewExName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Muscle (e.g. Chest)"
                        value={newExMuscle}
                        onChange={(e) => setNewExMuscle(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Sets</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={newExSets}
                        onChange={(e) => setNewExSets(e.target.value)}
                        className="w-full px-2 py-1 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Weight (kg)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={newExWeight}
                        onChange={(e) => setNewExWeight(e.target.value)}
                        className="w-full px-2 py-1 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Reps</label>
                      <input
                        type="number"
                        min="1"
                        value={newExReps}
                        onChange={(e) => setNewExReps(e.target.value)}
                        className="w-full px-2 py-1 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Rest (sec)</label>
                      <select
                        value={newExRestSeconds}
                        onChange={(e) => setNewExRestSeconds(e.target.value)}
                        className="w-full px-2 py-1 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-semibold"
                      >
                        <option value="45">45s (Core)</option>
                        <option value="60">60s (Accessory)</option>
                        <option value="90">90s (Compound)</option>
                        <option value="120">120s (Heavy)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Append to Routine</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Exercises List */}
              {(currentDayTemplate.exercises || []).length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
                  <Dumbbell className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    No exercises planned for this training day
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Tap any of the category chips above (Legs, Push, Pull, etc.) or "Add Movement" to populate exercises.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {(currentDayTemplate.exercises || []).map((ex, index) => {
                    const setsCount = (ex.sets || []).length;
                    const firstSet = ex.sets?.[0];
                    const restSecs = ex.targetRestSeconds || 90;
                    return (
                      <div
                        key={ex.id || index}
                        className="py-2.5 flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-500">
                            {index + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                {ex.name}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                {ex.muscle}
                              </span>

                              {/* Interactive Rest Interval Pill */}
                              <button
                                type="button"
                                onClick={() => handleCycleExerciseRest(ex.id, restSecs)}
                                title="Click to cycle rest duration (45s -> 60s -> 90s -> 120s)"
                                className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 transition"
                              >
                                <Timer className="w-2.5 h-2.5 text-emerald-500" />
                                <span>{restSecs}s rest</span>
                              </button>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {setsCount} sets
                              {firstSet ? ` • ~${firstSet.weight} kg × ${firstSet.reps} reps target` : ''}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveExerciseFromRoutine(ex.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition opacity-60 group-hover:opacity-100"
                          title="Remove from this day's routine"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. FORMAL LEAVE REQUEST MODAL (FOR EXTRA REST DAYS) */}
      <RestLeaveRequestModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        dayName={currentDayTemplate?.dayName || 'Today'}
        dayId={activeDay}
        userName={userName}
        onSubmitLeave={handleLeaveSubmitted}
        showToast={showToast}
      />

      {/* 6. TAMIL CALENDAR SYNC & FASTING PACING CALIBRATION MODAL */}
      {isCalendarSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-500">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Tamil Calendar &amp; Fasting Sync</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                      Panchangam
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Week of {weekCalendarMeta['monday']?.monthShort} {weekCalendarMeta['monday']?.dayOfMonth} – {weekCalendarMeta['sunday']?.monthShort} {weekCalendarMeta['sunday']?.dayOfMonth}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCalendarSyncModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              {/* Today's astronomical highlight */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  todayMeta?.isFastingDay
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Today&apos;s Status ({todayMeta?.dateString}):
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                  {todayMeta?.isFastingDay ? (
                    <>
                      🕊️ <strong className="text-amber-500 dark:text-amber-400">{todayMeta.festivalName || 'Sacred Viratham'}</strong> detected! Fasting Mode is recommended to adjust weights and prevent dehydration.
                    </>
                  ) : (
                    <>
                      🌿 <strong>Regular Training Day</strong> ({todayMeta?.thithiName || 'Standard Panchangam Thithi'}). Progressive overload enabled.
                    </>
                  )}
                </p>
              </div>

              {/* 7-Day Fasting Scan Breakdown */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
                  <span>7-Day Calendar Scan</span>
                  <span className="text-[11px] font-bold text-amber-500">
                    {Object.values(weekCalendarMeta).filter((m) => m.isFastingDay).length} Fasting Day(s) Detected
                  </span>
                </h4>

                <div className="space-y-1.5">
                  {DAYS_ORDER.map((d) => {
                    const meta = weekCalendarMeta[d.id];
                    const routine = dailyRoutines[d.id];
                    const isFastingDay = meta?.isFastingDay;

                    return (
                      <div
                        key={d.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition ${
                          meta?.isToday
                            ? 'bg-emerald-500/10 border-emerald-500/40'
                            : isFastingDay
                            ? 'bg-amber-500/5 border-amber-500/30'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-10 font-black text-slate-700 dark:text-slate-300 uppercase">
                            {d.short}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {meta?.monthShort} {meta?.dayOfMonth}
                          </span>
                          {meta?.isToday && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-emerald-500 text-slate-950">
                              Today
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {isFastingDay ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30">
                              🕊️ {meta?.shortTag || 'Fasting'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Normal</span>
                          )}

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              routine?.isRestDay
                                ? 'bg-indigo-500/15 text-indigo-400'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {routine?.isRestDay ? 'Rest' : routine?.splitCategory?.toUpperCase() || 'TRAIN'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Calibration Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Select Auto-Calibration Action
                </h4>

                {/* Option 1: Set Fasting to Rest */}
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handleSetFastingAsRestDays}
                  className="w-full p-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800/60 text-left transition flex items-start gap-3 group active:scale-[0.99]"
                >
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-500 shrink-0 mt-0.5">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-950 dark:text-indigo-200">
                        1. Set Fasting Days as Rest &amp; Recovery
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                    </div>
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                      Automatically converts detected viratham days to active rest &amp; spiritual regeneration (validates 1–3 rest days limits).
                    </p>
                  </div>
                </button>

                {/* Option 2: Moderate Fasting Pacing */}
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handleApplyFastingPacing}
                  className="w-full p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800/60 text-left transition flex items-start gap-3 group active:scale-[0.99]"
                >
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 shrink-0 mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                        <span>2. Train with Fasting Pacing</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500 text-slate-950">
                          Recommended
                        </span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                      Maintains your split (Push, Pull, Legs), but adjusts exercises to moderate loads (RPE 6–7) and 90s–120s rest periods.
                    </p>
                  </div>
                </button>

                {/* Option 3: Badges only */}
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handleSyncBadgesOnly}
                  className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/70 border border-slate-200 dark:border-slate-800 text-left transition flex items-start gap-3 group active:scale-[0.99]"
                >
                  <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        3. Sync Fasting Badges Only
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Keeps all current routine exercises unchanged; marks days with glowing fasting tags.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Info className="w-3 h-3 text-amber-500" />
                <span>Zero hardcoded mock data • Real astronomical calculations</span>
              </span>
              <button
                type="button"
                onClick={() => setIsCalendarSyncModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HevyDaySplitSelector;
