import React, { useState } from 'react';
import {
  Dumbbell,
  Plus,
  Check,
  Flame,
  Clock,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface ExerciseSet {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
}

interface Exercise {
  id: string;
  name: string;
  muscle: string;
  sets: ExerciseSet[];
}

export const Workouts: React.FC = () => {
  const [activeRoutine, setActiveRoutine] = useState('Push (Hypertrophy)');
  const [exercises, setExercises] = useState<Exercise[]>([
    {
      id: 'ex-1',
      name: 'Barbell Incline Bench Press',
      muscle: 'Upper Chest / Front Delts',
      sets: [
        { id: 's1', setNumber: 1, weight: 80, reps: 8, completed: true },
        { id: 's2', setNumber: 2, weight: 85, reps: 8, completed: true },
        { id: 's3', setNumber: 3, weight: 85, reps: 7, completed: false },
        { id: 's4', setNumber: 4, weight: 80, reps: 8, completed: false },
      ],
    },
    {
      id: 'ex-2',
      name: 'Dumbbell Shoulder Press',
      muscle: 'Deltoids / Triceps',
      sets: [
        { id: 's5', setNumber: 1, weight: 26, reps: 10, completed: true },
        { id: 's6', setNumber: 2, weight: 26, reps: 10, completed: false },
        { id: 's7', setNumber: 3, weight: 28, reps: 8, completed: false },
      ],
    },
    {
      id: 'ex-3',
      name: 'Cable Triceps Rope Pushdown',
      muscle: 'Triceps Lateral Head',
      sets: [
        { id: 's8', setNumber: 1, weight: 35, reps: 12, completed: false },
        { id: 's9', setNumber: 2, weight: 35, reps: 12, completed: false },
        { id: 's10', setNumber: 3, weight: 35, reps: 10, completed: false },
      ],
    },
  ]);

  const toggleSetCompleted = (exerciseId: string, setId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => (s.id === setId ? { ...s, completed: !s.completed } : s)),
        };
      })
    );
  };

  const updateSet = (exerciseId: string, setId: string, field: 'weight' | 'reps', value: number) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)),
        };
      })
    );
  };

  const addSet = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: ExerciseSet = {
          id: `s-${Date.now()}`,
          setNumber: ex.sets.length + 1,
          weight: lastSet ? lastSet.weight : 20,
          reps: lastSet ? lastSet.reps : 10,
          completed: false,
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      })
    );
  };

  const totalVolume = exercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets.reduce((setAcc, s) => (s.completed ? setAcc + s.weight * s.reps : setAcc), 0)
    );
  }, 0);

  const completedSetsCount = exercises.reduce((acc, ex) => {
    return acc + ex.sets.filter((s) => s.completed).length;
  }, 0);

  const totalSetsCount = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

  return (
    <div className="space-y-6">
      {/* Header & Routine Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Active Workout Session</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Log your weights and reps to sync volume with your maintenance caloric expenditure.
          </p>
        </div>

        {/* Routine tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          {['Push (Hypertrophy)', 'Pull (Back & Bi)', 'Legs & Core'].map((routine) => (
            <button
              key={routine}
              onClick={() => setActiveRoutine(routine)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeRoutine === routine
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {routine}
            </button>
          ))}
        </div>
      </div>

      {/* Workout Progress Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Volume Moved</div>
            <div className="text-lg font-bold text-white">{totalVolume.toLocaleString()} kg</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Elapsed Time</div>
            <div className="text-lg font-bold text-white">42:15 min</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Completed Sets</div>
            <div className="text-lg font-bold text-white">
              {completedSetsCount} / {totalSetsCount}
            </div>
          </div>
        </div>
      </div>

      {/* Exercise Cards */}
      <div className="space-y-4">
        {exercises.map((exercise) => (
          <div
            key={exercise.id}
            className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">{exercise.name}</h3>
                  <span className="text-[11px] text-slate-400">{exercise.muscle}</span>
                </div>
              </div>

              <button
                onClick={() => addSet(exercise.id)}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Set</span>
              </button>
            </div>

            {/* Sets Header */}
            <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-slate-400 px-2 py-1">
              <span className="col-span-2 text-center">SET</span>
              <span className="col-span-4 text-center">KG</span>
              <span className="col-span-4 text-center">REPS</span>
              <span className="col-span-2 text-center">DONE</span>
            </div>

            {/* Sets Rows */}
            <div className="space-y-1.5">
              {exercise.sets.map((set) => (
                <div
                  key={set.id}
                  className={`grid grid-cols-12 gap-2 items-center px-2 py-1.5 rounded-xl border transition ${
                    set.completed
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-200'
                  }`}
                >
                  <span className="col-span-2 text-center text-xs font-bold">{set.setNumber}</span>
                  <div className="col-span-4 px-1">
                    <input
                      type="number"
                      value={set.weight}
                      onChange={(e) =>
                        updateSet(exercise.id, set.id, 'weight', Number(e.target.value))
                      }
                      className="w-full text-center py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div className="col-span-4 px-1">
                    <input
                      type="number"
                      value={set.reps}
                      onChange={(e) =>
                        updateSet(exercise.id, set.id, 'reps', Number(e.target.value))
                      }
                      className="w-full text-center py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <button
                      onClick={() => toggleSetCompleted(exercise.id, set.id)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                        set.completed
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* AI Assistance Footer */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Progressive overload logged sets update Firestore and metabolic recovery.</span>
        </div>
      </div>
    </div>
  );
};

export default Workouts;

