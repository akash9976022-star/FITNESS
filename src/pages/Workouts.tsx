import React, { useState, useEffect } from 'react';
import {
  Dumbbell,
  Plus,
  Check,
  Flame,
  Clock,
  RotateCcw,
  Trash2,
  Play,
  CheckCircle,
  History,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeActiveWorkout,
  saveActiveWorkout,
  finishAndSaveWorkout,
  subscribeCompletedWorkouts,
  type WorkoutSession,
  type ExerciseItem,
  type ExerciseSet,
  type CompletedWorkout,
} from '../services/firestoreService';

export const Workouts: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [completedList, setCompletedList] = useState<CompletedWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for adding custom exercises
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState('');
  const [newRoutineName, setNewRoutineName] = useState('Daily Hypertrophy');

  // Real-time Firestore subscriptions (Zero Mock Data)
  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    const unsubActive = subscribeActiveWorkout(currentUser.uid, (session) => {
      setActiveSession(session);
      setLoading(false);
    });

    const unsubHistory = subscribeCompletedWorkouts(currentUser.uid, (history) => {
      setCompletedList(history);
    });

    return () => {
      unsubActive();
      unsubHistory();
    };
  }, [currentUser?.uid]);

  const handleStartNewSession = async () => {
    if (!currentUser?.uid) return;
    const initialSession: WorkoutSession = {
      routineName: newRoutineName.trim() || 'Custom Training Session',
      startedAt: Date.now(),
      exercises: [],
    };
    await saveActiveWorkout(currentUser.uid, initialSession);
  };

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid || !activeSession || !newExerciseName.trim()) return;

    const newEx: ExerciseItem = {
      id: `ex-${Date.now()}`,
      name: newExerciseName.trim(),
      muscle: newExerciseMuscle.trim() || 'General / Compound',
      sets: [
        { id: `s-${Date.now()}-1`, setNumber: 1, weight: 20, reps: 10, completed: false },
      ],
    };

    const updatedSession: WorkoutSession = {
      ...activeSession,
      exercises: [...activeSession.exercises, newEx],
    };

    await saveActiveWorkout(currentUser.uid, updatedSession);
    setNewExerciseName('');
    setNewExerciseMuscle('');
    setShowAddModal(false);
  };

  const handleRemoveExercise = async (exerciseId: string) => {
    if (!currentUser?.uid || !activeSession) return;
    const updatedExercises = activeSession.exercises.filter((ex) => ex.id !== exerciseId);
    await saveActiveWorkout(currentUser.uid, { ...activeSession, exercises: updatedExercises });
  };

  const handleToggleSet = async (exerciseId: string, setId: string) => {
    if (!currentUser?.uid || !activeSession) return;
    const updatedExercises = activeSession.exercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s) => (s.id === setId ? { ...s, completed: !s.completed } : s)),
      };
    });
    await saveActiveWorkout(currentUser.uid, { ...activeSession, exercises: updatedExercises });
  };

  const handleUpdateSet = async (
    exerciseId: string,
    setId: string,
    field: 'weight' | 'reps',
    value: number
  ) => {
    if (!currentUser?.uid || !activeSession) return;
    const updatedExercises = activeSession.exercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: Math.max(0, value) } : s)),
      };
    });
    await saveActiveWorkout(currentUser.uid, { ...activeSession, exercises: updatedExercises });
  };

  const handleAddSet = async (exerciseId: string) => {
    if (!currentUser?.uid || !activeSession) return;
    const updatedExercises = activeSession.exercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;
      const lastSet = ex.sets[ex.sets.length - 1];
      const newSet: ExerciseSet = {
        id: `s-${Date.now()}-${ex.sets.length + 1}`,
        setNumber: ex.sets.length + 1,
        weight: lastSet ? lastSet.weight : 20,
        reps: lastSet ? lastSet.reps : 10,
        completed: false,
      };
      return { ...ex, sets: [...ex.sets, newSet] };
    });
    await saveActiveWorkout(currentUser.uid, { ...activeSession, exercises: updatedExercises });
  };

  const handleFinishWorkout = async () => {
    if (!currentUser?.uid || !activeSession) return;
    if (activeSession.exercises.length === 0) {
      await saveActiveWorkout(currentUser.uid, null);
      return;
    }
    const durationMinutes = activeSession.startedAt
      ? Math.max(1, Math.round((Date.now() - activeSession.startedAt) / 60000))
      : 45;

    await finishAndSaveWorkout(currentUser.uid, activeSession, durationMinutes);
  };

  const handleDiscardWorkout = async () => {
    if (!currentUser?.uid) return;
    if (window.confirm('Discard active workout session?')) {
      await saveActiveWorkout(currentUser.uid, null);
    }
  };

  // Calculations from real Firestore session
  const totalVolume = activeSession
    ? activeSession.exercises.reduce((acc, ex) => {
        return (
          acc +
          ex.sets.reduce((setAcc, s) => (s.completed ? setAcc + s.weight * s.reps : setAcc), 0)
        );
      }, 0)
    : 0;

  const completedSetsCount = activeSession
    ? activeSession.exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => s.completed).length, 0)
    : 0;

  const totalSetsCount = activeSession
    ? activeSession.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)
    : 0;

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
        Connecting to Firestore real-time workout stream...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Workout Session Tracker
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time Firestore persistence (<code className="text-emerald-600 dark:text-emerald-400 font-mono">onSnapshot</code>). Zero mock presets.
          </p>
        </div>

        {activeSession && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Exercise</span>
            </button>
            <button
              onClick={handleFinishWorkout}
              className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
              <span>Finish & Save</span>
            </button>
            <button
              onClick={handleDiscardWorkout}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 transition"
              title="Discard Session"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ACTIVE WORKOUT SESSION */}
      {activeSession ? (
        <div className="space-y-4">
          {/* Real-time Session Metrics Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-0.5">
                Active Routine
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {activeSession.routineName}
              </h3>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Volume Moved</div>
                  <div className="text-base font-black text-slate-900 dark:text-white">
                    {totalVolume.toLocaleString()} kg
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Sets Done</div>
                  <div className="text-base font-black text-slate-900 dark:text-white">
                    {completedSetsCount} / {totalSetsCount}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Exercise List */}
          {activeSession.exercises.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Dumbbell className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Session Started!</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Add your first exercise to begin logging real sets, reps, and volume.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Exercise</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeSession.exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Dumbbell className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          {exercise.name}
                        </h3>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {exercise.muscle}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAddSet(exercise.id)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Set</span>
                      </button>
                      <button
                        onClick={() => handleRemoveExercise(exercise.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                        title="Delete Exercise"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
                            ? 'bg-emerald-50/70 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-medium'
                            : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200'
                        }`}
                      >
                        <span className="col-span-2 text-center text-xs font-bold">{set.setNumber}</span>
                        <div className="col-span-4 px-1">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={set.weight}
                            onChange={(e) =>
                              handleUpdateSet(exercise.id, set.id, 'weight', Number(e.target.value))
                            }
                            className="w-full text-center py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div className="col-span-4 px-1">
                          <input
                            type="number"
                            min="0"
                            value={set.reps}
                            onChange={(e) =>
                              handleUpdateSet(exercise.id, set.id, 'reps', Number(e.target.value))
                            }
                            className="w-full text-center py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <button
                            onClick={() => handleToggleSet(exercise.id, set.id)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                              set.completed
                                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
          )}
        </div>
      ) : (
        /* ZERO MOCK EMPTY STATE: User starts their own real session */
        <div className="p-8 sm:p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <Play className="w-8 h-8 ml-0.5" />
          </div>

          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No Active Workout In Progress
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Start an empty session to log your live sets, reps, and weights. Everything syncs straight to your Firestore account in real-time.
            </p>
          </div>

          <div className="max-w-xs mx-auto flex items-center gap-2 pt-2">
            <input
              type="text"
              value={newRoutineName}
              onChange={(e) => setNewRoutineName(e.target.value)}
              placeholder="Session Title (e.g. Upper Hypertrophy)"
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleStartNewSession}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 whitespace-nowrap transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Session</span>
            </button>
          </div>
        </div>
      )}

      {/* COMPLETED WORKOUTS HISTORY (Real Firestore onSnapshot) */}
      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Completed Workout History ({completedList.length})
          </h3>
        </div>

        {completedList.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            No completed workouts saved yet. Finish your first workout above to record your history!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {completedList.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {item.routineName}
                  </h4>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20">
                    {item.totalVolumeKg.toLocaleString()} kg
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{item.exercises.length} exercises • {item.totalSets} sets</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-slate-400" /> {item.durationMinutes}m
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD EXERCISE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add New Exercise</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddExercise} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Exercise Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Barbell Squat, Pull-Ups"
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Muscle Group
                </label>
                <input
                  type="text"
                  placeholder="e.g. Quads, Back, Chest"
                  value={newExerciseMuscle}
                  onChange={(e) => setNewExerciseMuscle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow"
                >
                  Add Exercise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workouts;
