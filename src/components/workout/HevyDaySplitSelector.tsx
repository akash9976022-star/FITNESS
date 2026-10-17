import React, { useState } from 'react';
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
} from 'lucide-react';
import type {
  DayOfWeek,
  DayRoutineTemplate,
  CustomExercise,
  ExerciseItem,
  ExerciseSet,
} from '../../services/firestoreService';

interface HevyDaySplitSelectorProps {
  dailyRoutines: Record<DayOfWeek, DayRoutineTemplate>;
  activeDay: DayOfWeek;
  onSelectDay: (day: DayOfWeek) => void;
  onStartRoutine: (routine: DayRoutineTemplate) => void;
  onUpdateRoutine: (dayId: DayOfWeek, updated: Partial<DayRoutineTemplate>) => Promise<void>;
  onOpenCustomLibrary: () => void;
  customExercises: CustomExercise[];
  isWorkoutActive: boolean;
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

// Helper to determine today's DayOfWeek
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
  onOpenCustomLibrary,
  customExercises,
  isWorkoutActive,
  showToast,
}) => {
  const currentDayTemplate = dailyRoutines[activeDay];
  const todayDayId = getTodayDayOfWeek();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  // Inline exercise adding states for this day's routine
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState('Chest');
  const [newExSets, setNewExSets] = useState('3');
  const [newExWeight, setNewExWeight] = useState('20');
  const [newExReps, setNewExReps] = useState('10');

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

  const handleToggleRestDay = async () => {
    const isRest = !currentDayTemplate?.isRestDay;
    await onUpdateRoutine(activeDay, {
      isRestDay: isRest,
      splitCategory: isRest ? 'rest' : 'full_body',
    });
    showToast?.(
      isRest
        ? `Marked ${currentDayTemplate?.dayName} as a Rest & Recovery day.`
        : `Marked ${currentDayTemplate?.dayName} as an active training day.`
    );
  };

  const handleAddExerciseToRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim() || !currentDayTemplate) return;

    const countSets = Math.max(1, parseInt(newExSets) || 3);
    const weightNum = Math.max(0, parseFloat(newExWeight) || 0);
    const repsNum = Math.max(1, parseInt(newExReps) || 10);

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
    };

    const updatedExercises = [...(currentDayTemplate.exercises || []), newEx];
    await onUpdateRoutine(activeDay, { exercises: updatedExercises });

    setNewExName('');
    setIsAddingExercise(false);
    showToast?.(`Added "${newEx.name}" to ${currentDayTemplate.dayName} routine.`);
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
      {/* 7-Day Hevy Week Bar */}
      <div className="p-1.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur-xl">
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {DAYS_ORDER.map((d) => {
            const isSelected = activeDay === d.id;
            const isToday = todayDayId === d.id;
            const routine = dailyRoutines[d.id];
            const isRest = routine?.isRestDay;

            return (
              <button
                key={d.id}
                onClick={() => onSelectDay(d.id)}
                className={`flex flex-col items-center justify-center py-2 sm:py-3 px-1 rounded-xl text-center transition-all duration-200 relative btn-tactile ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-lg shadow-emerald-500/25 scale-[1.03]'
                    : 'hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {/* Today Indicator Dot */}
                {isToday && (
                  <span
                    className={`absolute -top-1 px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      isSelected
                        ? 'bg-slate-950 text-emerald-400'
                        : 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                    }`}
                  >
                    Today
                  </span>
                )}

                <span className="text-[11px] sm:text-xs font-black tracking-tight uppercase">
                  {d.short}
                </span>

                <span
                  className={`text-[9px] sm:text-[10px] font-bold mt-0.5 truncate max-w-full px-1 ${
                    isSelected
                      ? 'text-slate-950 font-black'
                      : isRest
                      ? 'text-slate-400 dark:text-slate-500'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {isRest ? 'Rest' : routine?.splitCategory || 'Workout'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Routine Detail Card */}
      {currentDayTemplate && (
        <div className="rounded-3xl bg-white/85 dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-lg backdrop-blur-xl overflow-hidden transition-all duration-200">
          {/* Card Top Banner */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/50">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {currentDayTemplate.dayName} Split Template
                </span>
                {todayDayId === activeDay && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                    Active Today
                  </span>
                )}
                {currentDayTemplate.isRestDay && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                    Rest & Recovery
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
                  <span>{currentDayTemplate.targetDurationMinutes || 45} mins target</span>
                </span>
                <span>•</span>
                <span className="font-semibold">
                  {(currentDayTemplate.exercises || []).length} Movements
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={handleToggleRestDay}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                  currentDayTemplate.isRestDay
                    ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Toggle between training and rest day"
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>{currentDayTemplate.isRestDay ? 'Rest Day' : 'Mark Rest'}</span>
              </button>

              {/* Primary Start Workout CTA */}
              <button
                type="button"
                onClick={() => onStartRoutine(currentDayTemplate)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition btn-tactile flex-shrink-0"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isWorkoutActive ? 'Switch Active Session' : 'Start Workout'}</span>
              </button>
            </div>
          </div>

          {/* Exercises Schedule List for This Day */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                <span>Scheduled Routine Exercises</span>
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
                  <span>Add Exercise</span>
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

                <div className="grid grid-cols-3 gap-2.5">
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
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Target Reps</label>
                    <input
                      type="number"
                      min="1"
                      value={newExReps}
                      onChange={(e) => setNewExReps(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-semibold"
                    />
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
                <Coffee className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {currentDayTemplate.isRestDay
                    ? 'Rest & Recovery Day Scheduled'
                    : 'No exercises planned for this day'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {currentDayTemplate.isRestDay
                    ? 'Take today to recharge muscle tissue, rehydrate, and sleep.'
                    : 'Tap "Add Exercise" above or choose from your custom library.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {(currentDayTemplate.exercises || []).map((ex, index) => {
                  const setsCount = (ex.sets || []).length;
                  const firstSet = ex.sets?.[0];
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
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {ex.name}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                              {ex.muscle}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {setsCount} working sets
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
        </div>
      )}
    </div>
  );
};

export default HevyDaySplitSelector;
