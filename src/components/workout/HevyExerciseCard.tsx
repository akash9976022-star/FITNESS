import React, { useState } from 'react';
import type { WorkoutExerciseItem, ExerciseSetItem, SetType } from '../../types/workout';
import { ensureExerciseSets } from '../../types/workout';
import {
  Check,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Edit2,
  MessageSquare,
} from 'lucide-react';

interface HevyExerciseCardProps {
  exercise: WorkoutExerciseItem;
  exerciseIndex: number;
  totalExercises: number;
  onUpdateExercise: (updated: WorkoutExerciseItem) => void;
  onDeleteExercise: (id: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onSwapExercise?: () => void;
  onStartRestTimer?: (durationSeconds: number) => void;
}

export const HevyExerciseCard: React.FC<HevyExerciseCardProps> = ({
  exercise,
  exerciseIndex,
  totalExercises,
  onUpdateExercise,
  onDeleteExercise,
  onMoveUp,
  onMoveDown,
  onSwapExercise,
  onStartRestTimer,
}) => {
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editName, setEditName] = useState(exercise.name);
  const [editMuscle, setEditMuscle] = useState(exercise.targetMuscle);
  const [showNotes, setShowNotes] = useState(Boolean(exercise.notes));
  const [exerciseNotes, setExerciseNotes] = useState(exercise.notes || '');

  const sets = ensureExerciseSets(exercise);

  // Toggle set completion like Hevy app
  const handleToggleSet = (setId: string) => {
    let justCompleted = false;
    const updatedSets = sets.map((s) => {
      if (s.id === setId) {
        const next = !s.completed;
        if (next) justCompleted = true;
        return { ...s, completed: next };
      }
      return s;
    });

    const completedCount = updatedSets.filter((s) => s.completed).length;
    const isAllDone = updatedSets.length > 0 && completedCount === updatedSets.length;

    onUpdateExercise({
      ...exercise,
      setList: updatedSets,
      sets: updatedSets.length,
      completedSets: completedCount,
      completed: isAllDone,
    });

    // Auto-trigger rest timer on set completion (default 90s)
    if (justCompleted && onStartRestTimer) {
      onStartRestTimer(90);
    }
  };

  // Update specific set values (weight, reps, type)
  const handleUpdateSetValue = (
    setId: string,
    field: 'weight' | 'reps' | 'type',
    value: string
  ) => {
    const updatedSets = sets.map((s) => {
      if (s.id === setId) {
        return { ...s, [field]: value };
      }
      return s;
    });

    // Derive top-level reps/weight from first set for compatibility
    const firstSet = updatedSets[0];
    onUpdateExercise({
      ...exercise,
      setList: updatedSets,
      weight: firstSet ? firstSet.weight : exercise.weight,
      reps: firstSet ? firstSet.reps : exercise.reps,
    });
  };

  // Toggle set type (normal -> warmup -> drop -> failure)
  const handleCycleSetType = (setId: string) => {
    const currentSet = sets.find((s) => s.id === setId);
    if (!currentSet) return;

    const cycle: SetType[] = ['normal', 'warmup', 'drop', 'failure'];
    const currentIndex = cycle.indexOf((currentSet.type as SetType) || 'normal');
    const nextType = cycle[(currentIndex + 1) % cycle.length];

    handleUpdateSetValue(setId, 'type', nextType);
  };

  // Add new set row
  const handleAddSet = () => {
    const lastSet = sets[sets.length - 1];
    const newNumber = sets.length + 1;
    const newSet: ExerciseSetItem = {
      id: `${exercise.id}_set_${Date.now()}`,
      setNumber: newNumber,
      type: 'normal',
      weight: lastSet ? lastSet.weight : exercise.weight || '25 kg',
      reps: lastSet ? lastSet.reps : exercise.reps || '10',
      completed: false,
      previous: lastSet ? `${lastSet.weight} × ${lastSet.reps}` : '—',
    };

    const updatedSets = [...sets, newSet];
    onUpdateExercise({
      ...exercise,
      setList: updatedSets,
      sets: updatedSets.length,
      completed: false,
    });
  };

  // Delete a set
  const handleDeleteSet = (setId: string) => {
    if (sets.length <= 1) return; // Keep at least 1 set
    const remaining = sets
      .filter((s) => s.id !== setId)
      .map((s, idx) => ({ ...s, setNumber: idx + 1 }));

    const completedCount = remaining.filter((s) => s.completed).length;

    onUpdateExercise({
      ...exercise,
      setList: remaining,
      sets: remaining.length,
      completedSets: completedCount,
      completed: remaining.length > 0 && completedCount === remaining.length,
    });
  };

  // Save inline title/muscle edits
  const handleSaveHeaderEdits = () => {
    onUpdateExercise({
      ...exercise,
      name: editName.trim() || exercise.name,
      targetMuscle: editMuscle.trim() || exercise.targetMuscle,
    });
    setIsEditingHeader(false);
  };

  // Save notes
  const handleSaveNotes = (notesVal: string) => {
    setExerciseNotes(notesVal);
    onUpdateExercise({
      ...exercise,
      notes: notesVal.trim(),
    });
  };

  const completedSetsCount = sets.filter((s) => s.completed).length;
  const isExerciseDone = sets.length > 0 && completedSetsCount === sets.length;

  return (
    <div
      className={`glass-card rounded-2xl border transition-all duration-300 overflow-hidden ${
        isExerciseDone
          ? 'border-brand-500/40 bg-brand-50/70 dark:bg-brand-950/20 shadow-md shadow-brand-500/5'
          : 'border-slate-200 dark:border-slate-800/90 bg-white/95 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700/80 shadow-sm'
      }`}
    >
      {/* Exercise Card Header */}
      <div className="p-4 sm:p-5 pb-3 border-b border-slate-200 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-950/40">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Exercise Index Badge */}
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                isExerciseDone
                  ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60'
              }`}
            >
              {isExerciseDone ? <Check className="w-4 h-4 stroke-[3]" /> : exerciseIndex + 1}
            </div>

            {/* Title & Muscle Tags */}
            <div className="flex-1 min-w-0">
              {isEditingHeader ? (
                <div className="space-y-2 mb-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm sm:text-base px-3 py-1.5 rounded-lg border border-brand-500/60 focus:outline-none"
                    placeholder="Exercise name"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editMuscle}
                      onChange={(e) => setEditMuscle(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none"
                      placeholder="Target muscle"
                    />
                    <button
                      onClick={handleSaveHeaderEdits}
                      className="px-3 py-1 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs rounded-lg transition-all"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditName(exercise.name);
                        setEditMuscle(exercise.targetMuscle);
                        setIsEditingHeader(false);
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4
                      onClick={() => setIsEditingHeader(true)}
                      className="text-slate-900 dark:text-white font-bold text-sm sm:text-base tracking-wide hover:text-brand-600 dark:hover:text-brand-300 cursor-pointer transition-colors truncate"
                      title="Click to edit exercise name"
                    >
                      {exercise.name}
                    </h4>
                    <button
                      onClick={() => setIsEditingHeader(true)}
                      className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-0.5"
                      title="Edit Exercise Name"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      {exercise.targetMuscle}
                    </span>
                    <span className="text-slate-400 dark:text-slate-600">•</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-slate-800/80 text-brand-700 dark:text-brand-300 border border-slate-200 dark:border-slate-700/60 font-semibold">
                      {exercise.equipmentLabel || 'Free Weights'}
                    </span>
                    {exercise.category && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/40">
                        {exercise.category}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card Action Controls (Reorder, Swap, Delete) */}
          <div className="flex items-center gap-1 shrink-0">
            {onMoveUp && (
              <button
                onClick={onMoveUp}
                disabled={exerciseIndex === 0}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent transition-all"
                title="Move exercise up"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            )}
            {onMoveDown && (
              <button
                onClick={onMoveDown}
                disabled={exerciseIndex === totalExercises - 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent transition-all"
                title="Move exercise down"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
            {onSwapExercise && (
              <button
                onClick={onSwapExercise}
                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 hover:bg-brand-500/10 transition-all"
                title="Swap with equipment alternative"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onDeleteExercise(exercise.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              title="Delete exercise"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notes Toggle / Input */}
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/40 flex items-center justify-between text-xs">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300 flex items-center gap-1.5 text-[11px] font-medium transition-colors"
          >
            <MessageSquare className="w-3 h-3" />
            {showNotes ? 'Hide Notes' : exerciseNotes ? 'View Notes' : '+ Add Note / Form Cue'}
          </button>
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            {completedSetsCount} / {sets.length} sets completed
          </div>
        </div>

        {showNotes && (
          <div className="mt-2">
            <textarea
              rows={2}
              value={exerciseNotes}
              onChange={(e) => handleSaveNotes(e.target.value)}
              placeholder="E.g., 3-sec eccentric, pause at bottom, RPE 8..."
              className="w-full bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-800 focus:border-brand-500/50 focus:outline-none resize-none"
            />
          </div>
        )}
      </div>

      {/* Hevy-Style Set Logging Table */}
      <div className="p-3 sm:p-4 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/60">
              <th className="pb-2 pl-2 w-12 text-center">SET</th>
              <th className="pb-2 px-2 text-slate-500 dark:text-slate-400 hidden sm:table-cell">PREVIOUS</th>
              <th className="pb-2 px-2 text-center w-28 sm:w-32">KG / LBS</th>
              <th className="pb-2 px-2 text-center w-24 sm:w-28">REPS</th>
              <th className="pb-2 pr-2 text-center w-14">DONE</th>
              <th className="pb-2 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
            {sets.map((set) => {
              const isWarmup = set.type === 'warmup';
              const isDrop = set.type === 'drop';
              const isFailure = set.type === 'failure';

              return (
                <tr
                  key={set.id}
                  className={`transition-colors group ${
                    set.completed
                      ? 'bg-brand-500/10 text-slate-900 dark:text-white'
                      : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/30 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {/* Set Type & Number */}
                  <td className="py-2.5 pl-2 text-center">
                    <button
                      onClick={() => handleCycleSetType(set.id)}
                      className={`w-8 h-8 rounded-lg font-mono font-bold text-xs inline-flex items-center justify-center transition-colors cursor-pointer ${
                        isWarmup
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40'
                          : isDrop
                          ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-500/40'
                          : isFailure
                          ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50'
                      }`}
                      title="Click to toggle set type (Normal, Warmup, Drop, Failure)"
                    >
                      {isWarmup ? 'W' : isDrop ? 'D' : isFailure ? 'F' : set.setNumber}
                    </button>
                  </td>

                  {/* Previous Benchmark */}
                  <td className="py-2.5 px-2 text-xs font-mono text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                    {set.previous || '—'}
                  </td>

                  {/* Weight Input */}
                  <td className="py-2.5 px-2 text-center">
                    <div className="flex items-center justify-center">
                      <input
                        type="text"
                        value={set.weight}
                        onChange={(e) => handleUpdateSetValue(set.id, 'weight', e.target.value)}
                        className={`w-24 sm:w-28 text-center text-xs sm:text-sm font-mono font-bold py-2 sm:py-2.5 px-2 rounded-xl border focus:outline-none transition-all ${
                          set.completed
                            ? 'bg-brand-500/15 dark:bg-brand-950/40 border-brand-500/40 text-brand-800 dark:text-brand-200'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-brand-500/60'
                        }`}
                        placeholder="25 kg"
                      />
                    </div>
                  </td>

                  {/* Reps Input */}
                  <td className="py-2.5 px-2 text-center">
                    <div className="flex items-center justify-center">
                      <input
                        type="text"
                        value={set.reps}
                        onChange={(e) => handleUpdateSetValue(set.id, 'reps', e.target.value)}
                        className={`w-20 sm:w-24 text-center text-xs sm:text-sm font-mono font-bold py-2 sm:py-2.5 px-2 rounded-xl border focus:outline-none transition-all ${
                          set.completed
                            ? 'bg-brand-500/15 dark:bg-brand-950/40 border-brand-500/40 text-brand-800 dark:text-brand-200'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-brand-500/60'
                        }`}
                        placeholder="10"
                      />
                    </div>
                  </td>

                  {/* Set Completion Checkbox */}
                  <td className="py-2.5 pr-2 text-center">
                    <button
                      onClick={() => handleToggleSet(set.id)}
                      className={`w-9 h-9 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer mx-auto active:scale-95 ${
                        set.completed
                          ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/40 ring-2 ring-brand-400'
                          : 'bg-slate-100 dark:bg-slate-800/90 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/60'
                      }`}
                      title={set.completed ? 'Mark incomplete' : 'Complete set & trigger rest timer'}
                    >
                      <Check
                        className={`w-4 h-4 stroke-[3] transition-transform ${
                          set.completed ? 'scale-110' : 'scale-90 opacity-60'
                        }`}
                      />
                    </button>
                  </td>

                  {/* Delete Set */}
                  <td className="py-2 text-right">
                    <button
                      onClick={() => handleDeleteSet(set.id)}
                      disabled={sets.length <= 1}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 dark:text-slate-600 dark:hover:text-rose-400 disabled:opacity-0 transition-all"
                      title="Delete set"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Add Set Button */}
        <div className="mt-3 pt-2 flex items-center justify-between">
          <button
            onClick={handleAddSet}
            className="w-full min-h-[48px] py-3 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 hover:border-brand-500/40 bg-slate-50/80 dark:bg-slate-900/40 hover:bg-brand-500/5 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-300 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" /> Add Set
          </button>
        </div>
      </div>
    </div>
  );
};
