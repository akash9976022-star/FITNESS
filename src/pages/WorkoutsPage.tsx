import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  generateMaintenanceRoutine,
  processAiCoachChat,
  EXERCISE_DATABASE,
  isExerciseAvailable,
} from '../services/aiWorkoutCoach';
import type { WorkoutSessionItem, WorkoutExerciseItem, CoachChatMessage } from '../types/workout';
import { calculateWorkoutVolumeKg } from '../types/workout';
import { HevyExerciseCard } from '../components/workout/HevyExerciseCard';
import { WorkoutCompletedModal } from '../components/workout/WorkoutCompletedModal';
import { AddExerciseModal } from '../components/dashboard/AddExerciseModal';
import {
  Dumbbell,
  Sparkles,
  Send,
  Clock,
  Pause,
  Play,
  Bot,
  Check,
  Plus,
  Edit2,
  CheckCircle2,
  History,
  Cloud,
  CheckCheck,
  Loader2,
  AlertTriangle,
  X,
  ChevronRight,
  Flame,
} from 'lucide-react';

export const WorkoutsPage: React.FC = () => {
  const {
    userProfile,
    saveWorkout,
    fetchWorkouts,
    currentWorkout,
    setCurrentWorkout,
  } = useAuth();

  // Active workout routine name editing
  const [isEditingWorkoutName, setIsEditingWorkoutName] = useState(false);
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [showNotesField, setShowNotesField] = useState(false);

  // Modals & Drawers
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAiCoachDrawer, setShowAiCoachDrawer] = useState(false);

  // Cloud Sync state indicator
  const [syncState, setSyncState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Saved workouts history
  const [savedWorkoutsList, setSavedWorkoutsList] = useState<WorkoutSessionItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Workout Session Stopwatch (Stopwatch elapsed seconds)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(true);

  // Rest Timer State (Auto-triggers when set completed)
  const [restTimerSeconds, setRestTimerSeconds] = useState(0);
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);

  // AI Chat Coach State
  const [chatMessages, setChatMessages] = useState<CoachChatMessage[]>([
    {
      id: 'm_welcome',
      sender: 'coach',
      text: `Welcome to your Hevy-style workout tracker! All exercises, sets, weights, and reps can be edited directly inline or added manually. If you need any alternative movement or form advice, type below!`,
      timestamp: 'Just now',
      actionTaken: 'advice',
    },
  ]);
  const [coachInput, setCoachInput] = useState('');
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Synchronize local title and notes when currentWorkout loads
  useEffect(() => {
    if (currentWorkout) {
      setWorkoutTitle(currentWorkout.routineName || currentWorkout.name || 'Daily Routine');
      setWorkoutNotes(currentWorkout.notes || '');
      if (currentWorkout.notes) setShowNotesField(true);
    }
  }, [currentWorkout?.id]);


  // Live Stopwatch Ticker
  useEffect(() => {
    let interval: any = null;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  // Rest Timer Ticker
  useEffect(() => {
    let interval: any = null;
    if (isRestTimerActive && restTimerSeconds > 0) {
      interval = setInterval(() => {
        setRestTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (restTimerSeconds === 0 && isRestTimerActive) {
      setIsRestTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isRestTimerActive, restTimerSeconds]);

  // Helper to format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Helper to start rest timer (triggered by HevyExerciseCard when checking a set)
  const handleStartRestTimer = (durationSeconds: number = 90) => {
    setRestTimerSeconds(durationSeconds);
    setIsRestTimerActive(true);
  };

  // Persist workout state to React Context and Cloud Firestore
  const persistWorkoutChanges = async (
    updated: WorkoutSessionItem,
    customMsg?: string
  ) => {
    setCurrentWorkout(updated);
    setSyncState('saving');
    try {
      await saveWorkout(updated);
      setSyncState('saved');
      if (customMsg) {
        setStatusMessage(customMsg);
        setTimeout(() => setStatusMessage(null), 3000);
      }
      setTimeout(() => setSyncState('idle'), 2500);
    } catch (err) {
      console.warn('Failed to sync workout to Firestore:', err);
      setSyncState('error');
      setTimeout(() => setSyncState('idle'), 3500);
    }
  };

  // Update a single exercise in the active workout
  const handleUpdateExercise = async (updatedEx: WorkoutExerciseItem) => {
    if (!currentWorkout) return;

    const updatedExercises = currentWorkout.exercises.map((ex) =>
      ex.id === updatedEx.id ? updatedEx : ex
    );

    const totalSets = updatedExercises.reduce(
      (a, b) => a + (b.setList?.length || b.sets),
      0
    );
    const totalCompletedSets = updatedExercises.reduce(
      (a, b) => a + b.completedSets,
      0
    );
    const isAllDone =
      updatedExercises.length > 0 &&
      updatedExercises.every((e) => e.completed);

    const updatedWorkout: WorkoutSessionItem = {
      ...currentWorkout,
      exercises: updatedExercises,
      sets: totalSets,
      completedSets: totalCompletedSets,
      completed: isAllDone,
      durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
      updatedAt: new Date(),
    };

    await persistWorkoutChanges(updatedWorkout);
  };

  // Delete an exercise
  const handleDeleteExercise = async (exerciseId: string) => {
    if (!currentWorkout) return;

    const remaining = currentWorkout.exercises.filter((e) => e.id !== exerciseId);
    const totalSets = remaining.reduce(
      (a, b) => a + (b.setList?.length || b.sets),
      0
    );
    const totalCompletedSets = remaining.reduce(
      (a, b) => a + b.completedSets,
      0
    );

    const updatedWorkout: WorkoutSessionItem = {
      ...currentWorkout,
      exercises: remaining,
      sets: totalSets,
      completedSets: totalCompletedSets,
      completed: remaining.length > 0 && remaining.every((e) => e.completed),
      updatedAt: new Date(),
    };

    await persistWorkoutChanges(updatedWorkout, 'Exercise removed and synced to Firestore');
  };

  // Move exercise up in sequence
  const handleMoveUp = async (index: number) => {
    if (!currentWorkout || index <= 0) return;
    const items = [...currentWorkout.exercises];
    const temp = items[index - 1];
    items[index - 1] = items[index];
    items[index] = temp;

    const updatedWorkout: WorkoutSessionItem = {
      ...currentWorkout,
      exercises: items,
      updatedAt: new Date(),
    };
    await persistWorkoutChanges(updatedWorkout);
  };

  // Move exercise down in sequence
  const handleMoveDown = async (index: number) => {
    if (!currentWorkout || index >= currentWorkout.exercises.length - 1) return;
    const items = [...currentWorkout.exercises];
    const temp = items[index + 1];
    items[index + 1] = items[index];
    items[index] = temp;

    const updatedWorkout: WorkoutSessionItem = {
      ...currentWorkout,
      exercises: items,
      updatedAt: new Date(),
    };
    await persistWorkoutChanges(updatedWorkout);
  };

  // Swap exercise with an alternative from the database
  const handleSwapExercise = async (exerciseId: string) => {
    if (!currentWorkout) return;
    const targetEx = currentWorkout.exercises.find((e) => e.id === exerciseId);
    if (!targetEx) return;

    const userEquip = userProfile.equipment || ['dumbbells', 'adjustable_bench'];
    const candidates = EXERCISE_DATABASE.filter(
      (dbEx) =>
        dbEx.name.toLowerCase() !== targetEx.name.toLowerCase() &&
        dbEx.category === targetEx.category &&
        isExerciseAvailable(dbEx, userEquip)
    );

    const replacementDef = candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : null;

    if (!replacementDef) {
      setStatusMessage('No alternative exercise found matching your current equipment.');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    const defaultWeight = replacementDef.isBodyweight ? 'Bodyweight' : targetEx.weight;
    const replacementEx: WorkoutExerciseItem = {
      id: `ex_swap_${Date.now()}`,
      name: replacementDef.name,
      targetMuscle: replacementDef.targetMuscle,
      category: replacementDef.category,
      equipmentRequired: replacementDef.equipmentRequired,
      equipmentLabel: replacementDef.equipmentLabel,
      sets: targetEx.sets,
      reps: replacementDef.defaultReps || targetEx.reps,
      weight: defaultWeight,
      completedSets: 0,
      completed: false,
      notes: replacementDef.formCue,
      replacedReason: `Swapped from ${targetEx.name}`,
      setList: Array.from({ length: targetEx.sets }, (_, i) => ({
        id: `set_swap_${Date.now()}_${i + 1}`,
        setNumber: i + 1,
        type: 'normal',
        weight: defaultWeight,
        reps: replacementDef.defaultReps || targetEx.reps,
        completed: false,
        previous: '—',
      })),
    };

    const updatedExercises = currentWorkout.exercises.map((e) =>
      e.id === exerciseId ? replacementEx : e
    );

    const updatedWorkout: WorkoutSessionItem = {
      ...currentWorkout,
      exercises: updatedExercises,
      updatedAt: new Date(),
    };

    await persistWorkoutChanges(
      updatedWorkout,
      `Swapped ${targetEx.name} for ${replacementDef.name}!`
    );
  };

  // Add exercise from modal
  const handleAddExerciseFromModal = async (newEx: WorkoutExerciseItem) => {
    if (!currentWorkout) return;

    const updatedExercises = [...currentWorkout.exercises, newEx];
    const totalSets = updatedExercises.reduce(
      (a, b) => a + (b.setList?.length || b.sets),
      0
    );
    const totalCompletedSets = updatedExercises.reduce(
      (a, b) => a + b.completedSets,
      0
    );

    const updatedWorkout: WorkoutSessionItem = {
      ...currentWorkout,
      exercises: updatedExercises,
      sets: totalSets,
      completedSets: totalCompletedSets,
      completed: false,
      updatedAt: new Date(),
    };

    await persistWorkoutChanges(
      updatedWorkout,
      `Added ${newEx.name} to routine!`
    );
  };

  // Save edited workout title & notes
  const handleSaveWorkoutDetails = async () => {
    if (!currentWorkout) return;
    const updatedWorkout: WorkoutSessionItem = {
      ...currentWorkout,
      routineName: workoutTitle.trim() || currentWorkout.routineName,
      name: workoutTitle.trim() || currentWorkout.name,
      notes: workoutNotes.trim(),
      updatedAt: new Date(),
    };
    setIsEditingWorkoutName(false);
    await persistWorkoutChanges(updatedWorkout, 'Workout details updated & saved to Firestore');
  };

  // Start an empty blank workout session like Hevy
  const handleStartEmptyWorkout = async () => {
    const emptyWorkout: WorkoutSessionItem = {
      id: `workout_empty_${Date.now()}`,
      name: 'Custom Workout',
      routineName: 'Custom Workout',
      routine: 'Custom',
      durationMinutes: 0,
      notes: '',
      date: new Date().toISOString().split('T')[0],
      completed: false,
      exercises: [],
      sets: 0,
      completedSets: 0,
      equipmentUsed: userProfile.equipment || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setElapsedSeconds(0);
    setIsStopwatchRunning(true);
    setWorkoutTitle('Custom Workout');
    setWorkoutNotes('');
    await persistWorkoutChanges(emptyWorkout, 'New blank workout started! Add your exercises below.');
  };

  // Regenerate standard maintenance routine
  const handleRegenerateRoutine = async (type: 'Upper' | 'Lower' | 'Full Body') => {
    const routine = generateMaintenanceRoutine(
      type,
      userProfile.equipment || ['dumbbells', 'adjustable_bench', 'pull_up_bar'],
      userProfile.experienceLevel || 'intermediate',
      userProfile.weightKg || 75
    );
    setElapsedSeconds(0);
    setIsStopwatchRunning(true);
    await persistWorkoutChanges(
      routine,
      `Loaded fresh ${type} maintenance routine for your gym gear.`
    );
  };

  // Generate AI workout handler for empty state
  const handleGenerateAiWorkout = () => {
    handleRegenerateRoutine('Full Body');
  };

  // Finish Workout (Hevy celebration modal & persist to Firestore)
  const handleFinishWorkout = async () => {
    if (!currentWorkout) return;

    const durationMins = Math.max(1, Math.round(elapsedSeconds / 60));
    const completedWorkout: WorkoutSessionItem = {
      ...currentWorkout,
      completed: true,
      durationMinutes: durationMins,
      updatedAt: new Date(),
    };

    setIsStopwatchRunning(false);
    await persistWorkoutChanges(completedWorkout);
    setShowCompletedModal(true);
  };

  // Load Workout History
  const handleOpenHistoryModal = async () => {
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const items = await fetchWorkouts();
      setSavedWorkoutsList(items || []);
    } catch (err) {
      console.warn('Error fetching workout history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Repeat a saved workout from history
  const handleLoadWorkoutFromHistory = async (saved: WorkoutSessionItem) => {
    const clonedWorkout: WorkoutSessionItem = {
      ...saved,
      id: `workout_clone_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      completed: false,
      completedSets: 0,
      exercises: saved.exercises.map((ex) => ({
        ...ex,
        completed: false,
        completedSets: 0,
        setList: (ex.setList || []).map((s) => ({ ...s, completed: false })),
      })),
      updatedAt: new Date(),
    };

    setElapsedSeconds(0);
    setIsStopwatchRunning(true);
    await persistWorkoutChanges(clonedWorkout, `Loaded "${saved.routineName}" as today's workout!`);
    setShowHistoryModal(false);
  };

  // AI Coach chat submission
  const handleSendCoachPrompt = async () => {
    if (!coachInput.trim() || !currentWorkout) return;

    const userMsg: CoachChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: coachInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    const prompt = coachInput.trim();
    setCoachInput('');
    setIsProcessingAi(true);

    try {
      await new Promise((r) => setTimeout(r, 400));
      const result = processAiCoachChat(
        currentWorkout,
        prompt,
        userProfile.equipment || ['dumbbells', 'adjustable_bench']
      );

      const coachReply: CoachChatMessage = {
        id: `c_${Date.now()}`,
        sender: 'coach',
        text: result.coachMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modifiedExerciseName: result.modifiedExerciseName,
        actionTaken: result.actionTaken,
      };

      setChatMessages((prev) => [...prev, coachReply]);

      if (result.updatedWorkout) {
        await persistWorkoutChanges(
          result.updatedWorkout,
          'AI Coach adapted your workout & saved to Cloud Firestore!'
        );
      }
    } catch (err) {
      console.error('AI Coach error:', err);
    } finally {
      setIsProcessingAi(false);
    }
  };

  const totalVolumeKg = currentWorkout ? calculateWorkoutVolumeKg(currentWorkout) : 0;
  const totalSetsCount = currentWorkout?.exercises.reduce(
    (a, b) => a + (b.setList?.length || b.sets),
    0
  ) || 0;
  const completedSetsCount = currentWorkout?.exercises.reduce(
    (a, b) => a + b.completedSets,
    0
  ) || 0;

  return (
    <div className="space-y-6 pb-28 animate-fadeIn max-w-5xl mx-auto">
      {/* Toast Notification */}
      {statusMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 border border-brand-500/50 text-brand-300 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-slideDown">
          <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}


      {/* =========================================================================
          SECTION 1: HEVY-STYLE WORKOUT HEADER & CONTROLS
      ========================================================================= */}
      {!currentWorkout ? (
        <div className="glass-card rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-md mx-auto space-y-4 relative z-10">
            <div className="w-16 h-16 rounded-3xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto border border-brand-500/20 shadow-lg shadow-brand-500/10">
              <Dumbbell className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">No Active Workout Session</h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Start with a clean slate or generate an AI-optimized routine tailored to your equipment and maintenance goals.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleStartEmptyWorkout}
                className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-gradient-to-r from-brand-500 to-teal-400 hover:from-brand-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Start Blank Workout</span>
              </button>
              <button
                onClick={handleGenerateAiWorkout}
                className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Generate AI Routine</span>
              </button>
            </div>
            <div className="pt-3 flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <button
                onClick={handleOpenHistoryModal}
                className="hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
              >
                <History className="w-3.5 h-3.5" />
                <span>Saved History</span>
              </button>
              <span>•</span>
              <button
                onClick={() => setShowAiCoachDrawer(true)}
                className="hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Coach Assistant</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="glass-card rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          {/* Workout Title & Editable Routine Name */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-500/30">
                Live Workout Session
              </span>

              {/* Cloud Sync Status Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border">
                {syncState === 'saving' && (
                  <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-300 bg-cyan-500/10 border-cyan-500/30">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Saving to Cloud...</span>
                  </span>
                )}
                {syncState === 'saved' && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30">
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Saved to Firestore</span>
                  </span>
                )}
                {syncState === 'error' && (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-300 bg-amber-500/10 border-amber-500/30">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Offline Cached</span>
                  </span>
                )}
                {syncState === 'idle' && (
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60">
                    <Cloud className="w-3 h-3 text-brand-500 dark:text-brand-400" />
                    <span>Firestore Synced</span>
                  </span>
                )}
              </div>
            </div>

            {/* Editable Workout Routine Title */}
            {isEditingWorkoutName ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={workoutTitle}
                  onChange={(e) => setWorkoutTitle(e.target.value)}
                  className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-brand-500/80 focus:outline-none"
                  placeholder="Workout Name (e.g. Push Day A)"
                  autoFocus
                />
                <button
                  onClick={handleSaveWorkoutDetails}
                  className="p-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold"
                  title="Save Name"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsEditingWorkoutName(false)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 group">
                <h1
                  onClick={() => setIsEditingWorkoutName(true)}
                  className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight hover:text-brand-600 dark:hover:text-brand-300 cursor-pointer transition-colors"
                  title="Click to rename workout"
                >
                  {workoutTitle || currentWorkout?.routineName || 'Daily Workout'}
                </h1>
                <button
                  onClick={() => setIsEditingWorkoutName(true)}
                  className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-brand-500 dark:hover:text-brand-300 transition-colors"
                  title="Rename workout routine"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Routine details */}
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              <span>•</span>
              <span className="text-brand-600 dark:text-brand-400 font-medium">
                {currentWorkout?.exercises.length || 0} Movements
              </span>
              <span>•</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                {totalVolumeKg > 0 ? `${totalVolumeKg.toLocaleString()} kg Volume` : 'Bodyweight'}
              </span>
            </div>
          </div>

          {/* Right Controls: Stopwatch & Hevy Finish Button */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            {/* Live Stopwatch Pill */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-inner">
              <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                {formatTime(elapsedSeconds)}
              </span>
              <button
                onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                title={isStopwatchRunning ? 'Pause timer' : 'Resume timer'}
              >
                {isStopwatchRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Primary Hevy "Finish Workout" Button */}
            <button
              onClick={handleFinishWorkout}
              className="py-2.5 px-5 rounded-2xl bg-gradient-to-r from-brand-500 to-teal-400 hover:from-brand-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-brand-500/25 transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Finish Workout</span>
            </button>
          </div>
        </div>

        {/* Quick Toolbar (Start Empty, Regenerate, History, AI Coach) */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleStartEmptyWorkout}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700/60 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
              <span>Empty Workout</span>
            </button>

            <button
              onClick={handleOpenHistoryModal}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700/60 transition-all flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
              <span>Saved History</span>
            </button>

            <button
              onClick={() => setShowAiCoachDrawer(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700/60 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>AI Coach Assistant</span>
            </button>
          </div>

          {/* Quick Routine Loaders */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-medium hidden sm:inline">Load Preset:</span>
            {(['Upper', 'Lower', 'Full Body'] as const).map((r) => (
              <button
                key={r}
                onClick={() => handleRegenerateRoutine(r)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-brand-50 dark:hover:bg-brand-500/10 text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700/40 transition-colors"
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Workout Notes Section */}
        <div className="mt-4">
          {!showNotesField ? (
            <button
              onClick={() => setShowNotesField(true)}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 font-medium flex items-center gap-1 transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              <span>+ Add overall workout notes</span>
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                rows={2}
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                onBlur={handleSaveWorkoutDetails}
                placeholder="Workout notes (e.g., Felt strong today, increased bench press weight, RPE 8)..."
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 text-xs p-3 rounded-2xl border border-slate-300 dark:border-slate-800 focus:border-brand-500 focus:outline-none resize-none"
              />
              <div className="flex justify-end gap-2 text-[11px]">
                <button
                  onClick={handleSaveWorkoutDetails}
                  className="px-2.5 py-1 bg-brand-500 text-slate-950 font-bold rounded-lg shadow-sm"
                >
                  Save Notes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: WORKOUT SUMMARY STATS (VOLUME & SETS COMPLETED)
      ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card rounded-2xl p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Total Volume</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {totalVolumeKg > 0 ? `${totalVolumeKg.toLocaleString()} kg` : '0 kg'}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <Dumbbell className="w-4 h-4" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Sets Logged</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {completedSetsCount} / {totalSetsCount}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Elapsed Time</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {formatTime(elapsedSeconds)}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Est. Burn</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              ~{Math.round(Math.max(1, elapsedSeconds / 60) * 6.8)} kcal
            </div>
          </div>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Flame className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: HEVY EXERCISES CHECKLIST & SET LOGGING
      ========================================================================= */}
      <div className="space-y-4">
        {currentWorkout?.exercises && currentWorkout.exercises.length > 0 ? (
          currentWorkout.exercises.map((exercise, idx) => (
            <HevyExerciseCard
              key={exercise.id}
              exercise={exercise}
              exerciseIndex={idx}
              totalExercises={currentWorkout.exercises.length}
              onUpdateExercise={handleUpdateExercise}
              onDeleteExercise={handleDeleteExercise}
              onMoveUp={idx > 0 ? () => handleMoveUp(idx) : undefined}
              onMoveDown={
                idx < currentWorkout.exercises.length - 1
                  ? () => handleMoveDown(idx)
                  : undefined
              }
              onSwapExercise={() => handleSwapExercise(exercise.id)}
              onStartRestTimer={handleStartRestTimer}
            />
          ))
        ) : (
          <div className="glass-card rounded-3xl p-12 border border-dashed border-slate-300 dark:border-slate-800 text-center bg-white/95 dark:bg-slate-900/40 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-4 border border-brand-500/20">
              <Dumbbell className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Your workout is currently empty</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto mb-6">
              Manually add exercises below or choose a preset maintenance routine to get started.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowAddExerciseModal(true)}
                className="py-2.5 px-5 rounded-2xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Exercise</span>
              </button>
              <button
                onClick={() => handleRegenerateRoutine('Upper')}
                className="py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all"
              >
                Load Preset Routine
              </button>
            </div>
          </div>
        )}

        {/* Big "+ Add Exercise" Button (Like Hevy) */}
        <button
          onClick={() => setShowAddExerciseModal(true)}
          className="w-full py-4 px-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-brand-500/50 bg-white/80 dark:bg-slate-900/50 hover:bg-brand-500/5 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-300 text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5 text-brand-500 dark:text-brand-400" />
          <span>Add Exercise</span>
        </button>
      </div>

      {/* Bottom Hevy "Finish Workout" Bar */}
      {currentWorkout?.exercises && currentWorkout.exercises.length > 0 && (
        <div className="pt-4 flex items-center justify-end">
          <button
            onClick={handleFinishWorkout}
            className="py-3 px-8 rounded-2xl bg-gradient-to-r from-brand-500 to-teal-400 hover:from-brand-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-brand-500/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            <span>Finish Workout & Log Volume</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          SECTION 4: FLOATING REST TIMER (HEVY STYLE)
      ========================================================================= */}
      {isRestTimerActive && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border border-brand-500/60 shadow-2xl shadow-brand-500/30 px-5 py-3 rounded-full flex items-center gap-4 backdrop-blur-md animate-slideUp">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Rest Timer:</span>
            <span className="font-mono text-lg font-black text-white">
              {formatTime(restTimerSeconds)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
            <button
              onClick={() => setRestTimerSeconds((prev) => Math.max(0, prev - 15))}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
            >
              -15s
            </button>
            <button
              onClick={() => setRestTimerSeconds((prev) => prev + 15)}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
            >
              +15s
            </button>
            <button
              onClick={() => setIsRestTimerActive(false)}
              className="p-1 rounded-lg text-slate-500 hover:text-white ml-1"
              title="Dismiss Rest Timer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS & DRAWERS
      ========================================================================= */}

      {/* 1. Add Exercise Modal */}
      <AddExerciseModal
        isOpen={showAddExerciseModal}
        onClose={() => setShowAddExerciseModal(false)}
        userEquipment={userProfile.equipment || []}
        onAddExercise={handleAddExerciseFromModal}
      />

      {/* 2. Workout Completed Celebration Modal */}
      {currentWorkout && (
        <WorkoutCompletedModal
          isOpen={showCompletedModal}
          onClose={() => setShowCompletedModal(false)}
          workout={currentWorkout}
          elapsedSeconds={elapsedSeconds}
        />
      )}

      {/* 3. Workout History / Saved Routines Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="glass-card w-full max-w-xl max-h-[85vh] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col shadow-2xl bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Workout History & Saved Routines</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Fetched from Cloud Firestore collection `users/{'{userId}'}/workouts`.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-1">
              {loadingHistory ? (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-500 dark:text-brand-400" />
                  <span>Loading cloud routines...</span>
                </div>
              ) : savedWorkoutsList.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No saved workouts found yet. Finish and save a workout to see it here!
                </div>
              ) : (
                savedWorkoutsList.map((w) => (
                  <div
                    key={w.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {w.routineName || w.name || 'Workout Session'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span>{w.date || 'Recent'}</span>
                        <span>•</span>
                        <span>{w.exercises?.length || 0} Exercises</span>
                        <span>•</span>
                        <span className="font-mono text-brand-600 dark:text-brand-300 font-semibold">
                          {calculateWorkoutVolumeKg(w)} kg
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleLoadWorkoutFromHistory(w)}
                      className="px-3 py-1.5 rounded-xl bg-brand-500/15 hover:bg-brand-500 text-brand-700 dark:text-brand-300 hover:text-slate-950 text-xs font-bold border border-brand-500/30 transition-all flex items-center gap-1 shrink-0"
                    >
                      <span>Load Routine</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. AI Coach Assistant Drawer */}
      {showAiCoachDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-5 flex flex-col shadow-2xl animate-slideLeft">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-500/15 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-500/30">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">AI Workout Coach</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Dynamic routine adaptations</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiCoachDrawer(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-1 text-xs">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 ${
                      msg.sender === 'user'
                        ? 'bg-brand-500 text-slate-950 font-medium'
                        : 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                    <span
                      className={`block text-[10px] mt-1 ${
                        msg.sender === 'user' ? 'text-slate-900/70' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}
              {isProcessingAi && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 text-xs rounded-2xl p-3 flex items-center gap-2 border border-slate-200 dark:border-slate-700/60">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500 dark:text-brand-400" />
                    <span>Coach is adapting your workout...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Suggestions */}
            <div className="py-2 flex items-center gap-1.5 overflow-x-auto text-[11px]">
              {[
                'My shoulder hurts, swap press',
                'Lower back feels tight',
                'Add more chest volume',
              ].map((cue) => (
                <button
                  key={cue}
                  onClick={() => {
                    setCoachInput(cue);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-nowrap border border-slate-200 dark:border-slate-700/60 transition-colors"
                >
                  {cue}
                </button>
              ))}
            </div>

            {/* Coach Input Bar */}
            <div className="pt-2 flex items-center gap-2 border-t border-slate-200 dark:border-slate-800">
              <input
                type="text"
                value={coachInput}
                onChange={(e) => setCoachInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendCoachPrompt()}
                placeholder="Ask coach for exercise swap or cue..."
                className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 focus:outline-none focus:border-brand-500"
              />
              <button
                onClick={handleSendCoachPrompt}
                disabled={!coachInput.trim() || isProcessingAi}
                className="p-2.5 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-slate-950 rounded-xl transition-all font-bold"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
