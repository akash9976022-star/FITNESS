import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Flame,
  Apple,
  Dumbbell,
  Droplet,
  Sparkles,
  Plus,
  Minus,
  CheckCircle2,
  Circle,
  Zap,
  Activity,
  ArrowUpRight,
  Camera,
  Scale,
  Utensils,
  Edit3,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Check,
  Clock,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { useAlarmBriefing } from '../context/AlarmBriefingContext';
import { DailyCheckInModal } from '../components/checkin/DailyCheckInModal';
import { AiFoodPhotoModal } from '../components/nutrition/AiFoodPhotoModal';
import { AddExerciseModal } from '../components/dashboard/AddExerciseModal';
import { VitalsHub } from '../components/dashboard/VitalsHub';
import { AchievementsRewardsSection } from '../components/dashboard/AchievementsRewardsSection';
import { MorningBriefingCard } from '../components/dashboard/MorningBriefingCard';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { WorkoutCardSkeleton } from '../components/common/SkeletonLoader';
import {
  generateMaintenanceRoutine,
  EXERCISE_DATABASE,
  isExerciseAvailable,
} from '../services/aiWorkoutCoach';
import type { DailyCheckInItem } from '../types/auth';
import type { WorkoutSessionItem, WorkoutExerciseItem } from '../types/workout';

export const DashboardPage: React.FC = () => {
  const {
    user,
    userProfile,
    fetchCheckIns,
    checkIns,
    todaysCaloriesConsumed,
    nutritionLogs,
    fetchNutritionLogs,
    currentWorkout,
    setCurrentWorkout,
    saveWorkout,
    fetchWorkouts,
    rewards,
    rewardsSummary,
  } = useAuth();
  const { triggerAlarmTest } = useAlarmBriefing();

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [waterLogged, setWaterLogged] = useState(2250);
  const [aiTipIndex, setAiTipIndex] = useState(0);

  // Modals state
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showFoodPhotoModal, setShowFoodPhotoModal] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);

  // Today's Check-in
  const [latestCheckIn, setLatestCheckIn] = useState<DailyCheckInItem | null>(null);

  // Workout Inline Edit state
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSets, setEditSets] = useState(3);
  const [editReps, setEditReps] = useState('8-10');
  const [editWeight, setEditWeight] = useState('25 kg');

  // Real-time Cloud Sync state indicator
  const [workoutSyncState, setWorkoutSyncState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Rest Timer State
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [timerRunning, setTimerRunning] = useState(false);

  // Status feedback toast
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // 1. Initial Load: Fetch Check-ins, Nutrition Logs, and Workouts from Firestore
  useEffect(() => {
    const initializeData = async () => {
      try {
        const [remoteCheckins, workouts] = await Promise.all([
          fetchCheckIns(),
          fetchWorkouts(),
          fetchNutritionLogs(),
        ]);

        const allCheckins = checkIns && checkIns.length > 0 ? checkIns : remoteCheckins;
        if (allCheckins && allCheckins.length > 0) {
          // Check if today's check-in exists
          const todayCheckin = allCheckins.find((c) => c.date === todayStr);
          setLatestCheckIn(todayCheckin || allCheckins[0]);
        }

        // If today's workout exists in remote Firestore list, adopt it
        if (workouts && workouts.length > 0) {
          const todayWorkout = workouts.find((w) => w.date === todayStr);
          if (todayWorkout) {
            setCurrentWorkout(todayWorkout);
            return;
          }
        }

      } catch (err) {
        console.warn('Dashboard initial sync fallback:', err);
      } finally {
        setIsInitialLoading(false);
      }
    };

    initializeData();
  }, []);

  // React in real time whenever checkIns change from Firestore snapshot
  useEffect(() => {
    if (checkIns && checkIns.length > 0) {
      const todayCheckin = checkIns.find((c) => c.date === todayStr);
      setLatestCheckIn(todayCheckin || checkIns[0]);
    }
  }, [checkIns, todayStr]);

  // Rest timer interval
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleStartTimer = (secs: number = 90) => {
    setTimerSeconds(secs);
    setTimerRunning(true);
  };

  const handleAddWater = () => {
    setWaterLogged((prev) => Math.min(prev + 250, 4500));
  };

  // -------------------------------------------------------------------------
  // NUTRITION & CALORIE STATS
  // -------------------------------------------------------------------------
  const caloriesConsumed = todaysCaloriesConsumed;
  const targetCalories = userProfile.targetCalories || 2450;
  const calorieDiff = caloriesConsumed - targetCalories;
  const calorieDeviationRatio = targetCalories > 0 ? calorieDiff / targetCalories : 0;
  const calorieDeviationPercent = Math.round(calorieDeviationRatio * 100);

  const todaysProtein = useMemo(() => {
    return nutritionLogs
      .filter((l) => l.date === todayStr)
      .reduce((sum, l) => sum + (l.protein_g || 0), 0);
  }, [nutritionLogs, todayStr]);

  const targetProtein = userProfile.targetProtein || 165;
  const remainingCalories = Math.max(0, targetCalories - caloriesConsumed);

  // -------------------------------------------------------------------------
  // 1. CENTRAL BODY MAINTENANCE BALANCE (BMB) SCORE CALCULATION
  // -------------------------------------------------------------------------
  const bmbScoreData = useMemo(() => {
    // Nutrition Score (35% weight)
    let nutrition = 80;
    if (caloriesConsumed > 0) {
      const ratio = caloriesConsumed / targetCalories;
      if (ratio >= 0.92 && ratio <= 1.08) {
        nutrition = 100;
      } else if (ratio >= 0.85 && ratio <= 1.15) {
        nutrition = 90;
      } else if (ratio >= 0.75 && ratio <= 1.25) {
        nutrition = 75;
      } else {
        nutrition = Math.max(40, Math.round(100 - Math.abs(ratio - 1) * 85));
      }
    } else {
      nutrition = 70; // baseline start of day
    }

    // Protein adherence factor
    const proteinFactor = Math.min(1.0, todaysProtein / targetProtein);
    nutrition = Math.round(nutrition * 0.75 + (proteinFactor * 100) * 0.25);

    // Workout Volume Score (35% weight)
    let workout = 70;
    if (currentWorkout && currentWorkout.exercises.length > 0) {
      const totalSets = currentWorkout.sets || currentWorkout.exercises.reduce((a, b) => a + b.sets, 0);
      const doneSets = currentWorkout.completedSets || currentWorkout.exercises.reduce((a, b) => a + b.completedSets, 0);

      if (currentWorkout.completed) {
        workout = 100;
      } else if (totalSets > 0) {
        workout = Math.round(60 + (doneSets / totalSets) * 40);
      }
    }

    // Recovery & Check-in Score (30% weight)
    let recovery = 75;
    if (latestCheckIn) {
      const readinessMap: Record<string, number> = { high: 100, moderate: 85, low: 70 };
      const rScore = readinessMap[latestCheckIn.readiness] || 85;

      const targetW = userProfile.targetMaintenanceWeightKg || userProfile.weightKg || 75;
      const weightDelta = Math.abs(latestCheckIn.weight - targetW);
      const wScore = weightDelta <= 0.3 ? 100 : weightDelta <= 0.6 ? 90 : weightDelta <= 1.0 ? 80 : 65;

      recovery = Math.round(rScore * 0.6 + wScore * 0.4);
    }

    const overall = Math.min(100, Math.max(30, Math.round(nutrition * 0.35 + workout * 0.35 + recovery * 0.30)));

    let status = 'Optimal Maintenance';
    let ringColor = '#10b981'; // emerald-500
    if (overall >= 90) {
      status = 'Perfect Equilibrium';
      ringColor = '#10b981';
    } else if (overall >= 75) {
      status = 'Balanced Maintenance';
      ringColor = '#14b8a6'; // teal-500
    } else if (overall >= 60) {
      status = 'Moderate Drift';
      ringColor = '#f59e0b'; // amber-500
    } else {
      status = 'Rebalance Advised';
      ringColor = '#f43f5e'; // rose-500
    }

    return {
      overall,
      nutrition,
      workout,
      recovery,
      status,
      ringColor,
    };
  }, [caloriesConsumed, targetCalories, todaysProtein, targetProtein, currentWorkout, latestCheckIn, userProfile]);

  // -------------------------------------------------------------------------
  // 2. INTELLIGENT REACTIVE LOGIC & ALERT BANNER (>15% DEVIATION)
  // -------------------------------------------------------------------------
  const isSurplusExceeded = calorieDeviationRatio > 0.15; // > +15%
  const isDeficitExceeded = calorieDeviationRatio < -0.15 && caloriesConsumed > 0; // > -15%
  const [adjustmentApplied, setAdjustmentApplied] = useState(false);

  // Apply automatic adjustment to today's workout
  const handleApplyAdjustment = async () => {
    if (!currentWorkout) return;

    if (isSurplusExceeded) {
      // Add 15 mins metabolic cardio flush to offset surplus
      const cardioFlushExercise: WorkoutExerciseItem = {
        id: `ex_adj_${Date.now()}`,
        name: 'Zone 2 Metabolic Incline Flush',
        targetMuscle: 'Cardiovascular & Fat Oxidation',
        category: 'Cardio',
        equipmentRequired: ['bodyweight_only'],
        equipmentLabel: 'Treadmill / Outdoor',
        sets: 1,
        reps: '15 mins',
        weight: 'Zone 2 (130-140 BPM)',
        completedSets: 0,
        completed: false,
        notes: `AI Reactive Adjustment: Compensates +${Math.round(calorieDiff)} kcal surplus to preserve maintenance equilibrium.`,
        replacedReason: 'Calorie Surplus Offset (+15m Cardio)',
      };

      const updatedWorkout: WorkoutSessionItem = {
        ...currentWorkout,
        exercises: [...currentWorkout.exercises, cardioFlushExercise],
        sets: currentWorkout.sets + 1,
        durationMinutes: (currentWorkout.durationMinutes || 45) + 15,
        notes: `AI Reactive Adjustment applied: Added 15m metabolic cardio flush to neutralize +${Math.round(calorieDiff)} kcal intake.`,
        updatedAt: new Date(),
      };

      setAdjustmentApplied(true);
      await persistWorkoutChanges(
        updatedWorkout,
        'Workout adjusted with 15-min Metabolic Flush & synced to Cloud Firestore!'
      );
    } else if (isDeficitExceeded) {
      // Cap exercises to RPE 7 and reduce volume to prevent catabolic breakdown
      const cappedExercises = currentWorkout.exercises.map((e) => ({
        ...e,
        sets: Math.min(e.sets, 2),
        notes: 'AI Reactive Adjustment: Volume capped at 2 sets to avoid muscle catabolism during deficit.',
        replacedReason: 'Deficit Deload Cap (RPE 7)',
      }));

      const updatedWorkout: WorkoutSessionItem = {
        ...currentWorkout,
        exercises: cappedExercises,
        sets: cappedExercises.reduce((a, b) => a + b.sets, 0),
        notes: 'AI Reactive Adjustment applied: Volume capped to preserve lean tissue recovery under caloric deficit.',
        updatedAt: new Date(),
      };

      setAdjustmentApplied(true);
      await persistWorkoutChanges(
        updatedWorkout,
        'Workout volume reduced to RPE 7 maintenance cap & synced to Cloud Firestore!'
      );
    }
  };

  // -------------------------------------------------------------------------
  // 3. FULLY EDITABLE WORKOUTS LOGIC & INLINE MODIFICATIONS
  // -------------------------------------------------------------------------
  // Helper to persist workout updates to React state & Cloud Firestore with visual sync state
  const persistWorkoutChanges = async (updatedWorkout: WorkoutSessionItem, message?: string) => {
    setWorkoutSyncState('saving');
    try {
      setCurrentWorkout(updatedWorkout);
      await saveWorkout(updatedWorkout);
      setWorkoutSyncState('saved');
      if (message) {
        setStatusMessage(message);
        setTimeout(() => setStatusMessage(null), 3500);
      }
      setTimeout(() => setWorkoutSyncState('idle'), 3500);
    } catch (err) {
      console.error('Failed to sync workout to Cloud Firestore:', err);
      setWorkoutSyncState('error');
      setTimeout(() => setWorkoutSyncState('idle'), 4000);
    }
  };

  // Toggle set completion
  const handleToggleSet = async (exerciseId: string, setIndex: number) => {
    if (!currentWorkout) return;

    const updatedExercises = currentWorkout.exercises.map((ex) => {
      if (ex.id === exerciseId) {
        let nextCompleted = ex.completedSets;
        if (setIndex < ex.completedSets) {
          nextCompleted = setIndex;
        } else {
          nextCompleted = setIndex + 1;
          handleStartTimer(90); // auto-trigger rest timer
        }
        return {
          ...ex,
          completedSets: nextCompleted,
          completed: nextCompleted >= ex.sets,
        };
      }
      return ex;
    });

    const totalSets = updatedExercises.reduce((a, b) => a + b.sets, 0);
    const totalCompleted = updatedExercises.reduce((a, b) => a + b.completedSets, 0);

    const updatedWorkout: WorkoutSessionItem = {
      ...currentWorkout,
      exercises: updatedExercises,
      sets: totalSets,
      completedSets: totalCompleted,
      completed: updatedExercises.every((e) => e.completed),
      updatedAt: new Date(),
    };

    await persistWorkoutChanges(updatedWorkout);
  };

  // Toggle full exercise completion checkbox
  const handleToggleExerciseDone = async (exerciseId: string) => {
    if (!currentWorkout) return;

    const updatedExercises = currentWorkout.exercises.map((ex) => {
      if (ex.id === exerciseId) {
        const nextDone = !ex.completed;
        return {
          ...ex,
          completed: nextDone,
          completedSets: nextDone ? ex.sets : 0,
        };
      }
      return ex;
    });

    const totalCompleted = updatedExercises.reduce((a, b) => a + b.completedSets, 0);

    const updatedWorkout: WorkoutSessionItem = {
      ...currentWorkout,
      exercises: updatedExercises,
      completedSets: totalCompleted,
      completed: updatedExercises.every((e) => e.completed),
      updatedAt: new Date(),
    };

    await persistWorkoutChanges(updatedWorkout);
  };

  // Adjust weight on the fly (+ / - 2.5kg)
  const handleAdjustWeight = async (exerciseId: string, deltaKg: number) => {
    if (!currentWorkout) return;

    const updatedExercises = currentWorkout.exercises.map((ex) => {
      if (ex.id === exerciseId) {
        const match = ex.weight.match(/(\d+(\.\d+)?)/);
        if (match) {
          const currentKg = parseFloat(match[1]);
          const newKg = Math.max(0, currentKg + deltaKg);
          const newWeightStr = ex.weight.replace(match[1], newKg.toFixed(1).replace('.0', ''));
          return { ...ex, weight: newWeightStr };
        }
      }
      return ex;
    });

    const updatedWorkout = { ...currentWorkout, exercises: updatedExercises, updatedAt: new Date() };
    await persistWorkoutChanges(updatedWorkout);
  };

  // Delete exercise from session
  const handleDeleteExercise = async (exerciseId: string) => {
    if (!currentWorkout || currentWorkout.exercises.length <= 1) {
      alert('Your workout must contain at least one exercise.');
      return;
    }

    const exToDelete = currentWorkout.exercises.find((e) => e.id === exerciseId);
    const filtered = currentWorkout.exercises.filter((e) => e.id !== exerciseId);
    const updatedWorkout: WorkoutSessionItem = {
      ...currentWorkout,
      exercises: filtered,
      sets: filtered.reduce((a, b) => a + b.sets, 0),
      completedSets: filtered.reduce((a, b) => a + b.completedSets, 0),
      completed: filtered.every((e) => e.completed),
      updatedAt: new Date(),
    };

    await persistWorkoutChanges(
      updatedWorkout,
      `Removed ${exToDelete?.name || 'exercise'} & saved to Firestore.`
    );
  };

  // Swap exercise with next available in same movement category
  const handleSwapExercise = async (exerciseId: string) => {
    if (!currentWorkout) return;

    const currentEx = currentWorkout.exercises.find((e) => e.id === exerciseId);
    if (!currentEx) return;

    const availableMatches = EXERCISE_DATABASE.filter(
      (def) =>
        isExerciseAvailable(def, userProfile.equipment || ['dumbbells', 'adjustable_bench']) &&
        def.category === currentEx.category &&
        def.name !== currentEx.name &&
        !currentWorkout.exercises.some((e) => e.name === def.name)
    );

    if (availableMatches.length === 0) {
      setStatusMessage('No alternative exercise available for your active equipment inventory.');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    const replacement = availableMatches[0];
    const updatedExercises = currentWorkout.exercises.map((ex) => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          name: replacement.name,
          targetMuscle: replacement.targetMuscle,
          equipmentRequired: replacement.equipmentRequired,
          equipmentLabel: replacement.equipmentLabel,
          reps: replacement.defaultReps,
          notes: `Swapped: ${replacement.formCue}`,
          replacedReason: 'Equipment-Aware Swap',
        };
      }
      return ex;
    });

    const updatedWorkout: WorkoutSessionItem = {
      ...currentWorkout,
      exercises: updatedExercises,
      updatedAt: new Date(),
    };

    await persistWorkoutChanges(
      updatedWorkout,
      `Swapped to ${replacement.name} & saved to Cloud Firestore!`
    );
  };

  // Open inline edit for an exercise
  const startEditExercise = (ex: WorkoutExerciseItem) => {
    setEditingExerciseId(ex.id);
    setEditName(ex.name);
    setEditSets(ex.sets);
    setEditReps(ex.reps);
    setEditWeight(ex.weight);
  };

  // Save inline edit
  const saveInlineEdit = async (exerciseId: string) => {
    if (!currentWorkout) return;

    const updatedExercises = currentWorkout.exercises.map((ex) => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          name: editName.trim() || ex.name,
          sets: editSets,
          reps: editReps.trim() || ex.reps,
          weight: editWeight.trim() || ex.weight,
        };
      }
      return ex;
    });

    const updatedWorkout: WorkoutSessionItem = {
      ...currentWorkout,
      exercises: updatedExercises,
      sets: updatedExercises.reduce((a, b) => a + b.sets, 0),
      completedSets: updatedExercises.reduce((a, b) => a + b.completedSets, 0),
      completed: updatedExercises.every((e) => e.completed),
      updatedAt: new Date(),
    };

    setEditingExerciseId(null);
    await persistWorkoutChanges(
      updatedWorkout,
      `Updated ${editName.trim()} & saved to Cloud Firestore!`
    );
  };

  // Add exercise from modal
  const handleAddExerciseFromModal = async (newEx: WorkoutExerciseItem) => {
    const baseWorkout: WorkoutSessionItem = currentWorkout || {
      id: `workout_${Date.now()}`,
      name: 'Custom Routine',
      routineName: 'Custom Session',
      routine: 'Custom',
      durationMinutes: 45,
      completed: false,
      exercises: [],
      sets: 0,
      completedSets: 0,
      date: todayStr,
      notes: '',
      equipmentUsed: userProfile.equipment || [],
    };

    const updatedExercises = [...baseWorkout.exercises, newEx];
    const updatedWorkout: WorkoutSessionItem = {
      ...baseWorkout,
      exercises: updatedExercises,
      sets: updatedExercises.reduce((a, b) => a + b.sets, 0),
      completedSets: updatedExercises.reduce((a, b) => a + b.completedSets, 0),
      completed: updatedExercises.every((e) => e.completed),
      updatedAt: new Date(),
    };

    await persistWorkoutChanges(
      updatedWorkout,
      `Added ${newEx.name} & saved to Cloud Firestore!`
    );
  };

  // Regenerate routine
  const handleRegenerateWorkout = async () => {
    const routine = generateMaintenanceRoutine(
      (currentWorkout?.routine as any) || 'Upper',
      userProfile.equipment || ['dumbbells', 'adjustable_bench', 'pull_up_bar'],
      userProfile.experienceLevel || 'intermediate',
      userProfile.weightKg || 75
    );

    await persistWorkoutChanges(
      routine,
      'Regenerated maintenance workout from your equipment inventory & saved to Firestore.'
    );
  };

  // SVG circular gauge calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * bmbScoreData.overall) / 100;

  const aiTips = [
    "Equilibrium Status: Your caloric intake and daily training output are in closed-loop synchronization for zero unwanted fat gain.",
    "Protein Distribution: Aim for ~40g protein across your remaining meals today to stimulate continuous muscle protein synthesis (MPS).",
    "Rest & Recovery: Maintain training volume within RPE 7-8 to ensure 100% muscle retention with no neural burnout.",
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* =========================================================================
          SECTION 1: HERO HEADER & REAL-TIME CLOSED-LOOP STATUS
      ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl p-6 lg:p-8 bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900/95 dark:to-brand-950/40 border border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-600 dark:text-brand-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Closed-Loop Body Maintenance Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back, {user?.displayName || 'Athlete'}! 💪
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
              Target Equilibrium: <strong className="text-slate-900 dark:text-white font-mono">{userProfile.weightKg} kg</strong>. Nutrition logs, equipment-aware workouts, and weigh-ins are synchronized.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowFoodPhotoModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-brand-500 hover:from-amber-400 hover:to-brand-400 text-slate-950 font-extrabold text-xs shadow-glow flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Utensils className="w-4 h-4 text-slate-950" />
              <span>Scan Food</span>
            </button>

            <button
              onClick={() => setShowCheckInModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-teal-500 hover:from-brand-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-glow flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Camera className="w-4 h-4 text-slate-950" />
              <span>Daily Check-In</span>
            </button>

            <button
              onClick={triggerAlarmTest}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-extrabold text-xs shadow-glow flex items-center gap-1.5 transition-all active:scale-95"
              title="Test Morning Alarm & Devotional Audio Briefing"
            >
              <Sun className="w-4 h-4 text-slate-950 animate-spin-slow" />
              <span>Test Morning Alarm</span>
            </button>

            <button
              onClick={() => setAiTipIndex((prev) => (prev + 1) % aiTips.length)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700/90 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-2 shadow-sm"
              title="Next AI Coaching Tip"
            >
              <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span className="hidden sm:inline">Cycle Tip</span>
            </button>
          </div>
        </div>

        {/* Dynamic AI Tip Alert */}
        <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-brand-500/20 flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
          <div className="p-1.5 rounded-lg bg-brand-500/15 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <span className="font-bold text-brand-600 dark:text-brand-300 mr-1.5">Equilibrium Intelligence:</span>
            {aiTips[aiTipIndex]}
          </div>
        </div>

        {/* Toast / Sync Status Message */}
        {statusMessage && (
          <div className="mt-3 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 1.5: HEAVY-SLEEPER BILINGUAL MORNING BRIEFING & DEVOTIONAL AUDIO
      ========================================================================= */}
      <ErrorBoundary moduleName="Morning Audio Briefing & Alarm">
        <MorningBriefingCard />
      </ErrorBoundary>

      {/* =========================================================================
          SECTION 2: INTELLIGENT REACTIVE ALERT BANNER (>15% DEVIATION)
      ========================================================================= */}
      {(isSurplusExceeded || isDeficitExceeded) && (
        <div
          className={`p-5 rounded-3xl border-2 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn backdrop-blur-xl ${
            isSurplusExceeded
              ? 'bg-amber-500/10 dark:bg-amber-950/80 border-amber-500/40 text-amber-950 dark:text-amber-100'
              : 'bg-rose-500/10 dark:bg-rose-950/80 border-rose-500/40 text-rose-950 dark:text-rose-100'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
                isSurplusExceeded
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/40'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm text-slate-900 dark:text-white">
                  {isSurplusExceeded
                    ? `Calorie Surplus Detected (+${Math.round(calorieDiff)} kcal • +${calorieDeviationPercent}%)`
                    : `Calorie Deficit Drift (${Math.round(calorieDiff)} kcal • ${calorieDeviationPercent}%)`}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono border border-slate-300 dark:border-slate-700 shadow-sm">
                  Target: {targetCalories} kcal
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 max-w-2xl leading-relaxed font-medium">
                {isSurplusExceeded
                  ? `Your energy intake is running ${calorieDeviationPercent}% above your maintenance ceiling. To protect your body composition without unwanted adipose accumulation, AI Coach suggests adding a 15-min Metabolic Flush to today's workout.`
                  : `Your intake is ${Math.abs(calorieDeviationPercent)}% below maintenance. High training volume in a deficit risks lean muscle catabolism. AI Coach recommends capping workout volume to RPE 7 to safeguard recovery.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
            <button
              onClick={handleApplyAdjustment}
              disabled={adjustmentApplied}
              className={`px-4 py-2.5 rounded-xl font-black text-xs shadow-glow transition-all flex items-center gap-1.5 ${
                adjustmentApplied
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                  : 'bg-gradient-to-r from-brand-500 to-teal-400 hover:from-brand-400 hover:to-teal-300 text-slate-950 active:scale-95'
              }`}
            >
              <Zap className="w-4 h-4 text-slate-950" />
              <span>{adjustmentApplied ? 'Adjustment Applied' : 'Apply Adjustment to Workout'}</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 3: CENTRAL BMB SCORE CARD & METRIC KPIS
      ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Central "Body Maintenance Balance (BMB) Score" Card */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between bg-white dark:bg-slate-900 md:col-span-2 lg:col-span-1 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Closed-Loop Metric
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Body Maintenance Balance (BMB)</h2>
            </div>
            <span
              className="px-2.5 py-1 rounded-full text-[11px] font-bold border"
              style={{
                backgroundColor: `${bmbScoreData.ringColor}15`,
                color: bmbScoreData.ringColor,
                borderColor: `${bmbScoreData.ringColor}35`,
              }}
            >
              {bmbScoreData.status}
            </span>
          </div>

          {/* Circular SVG Status Gauge & Sub-metrics */}
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-center gap-6 my-2">
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-36 h-36 transform -rotate-90">
                {/* Background track */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  className="text-slate-200 dark:text-slate-800"
                />
                {/* Progress bar */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  stroke={bmbScoreData.ringColor}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
                  {bmbScoreData.overall}%
                </span>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 tracking-wider uppercase">
                  BMB Index
                </span>
              </div>
            </div>

            {/* Sub-Metric Pillars */}
            <div className="space-y-3 w-full sm:w-56 lg:w-full xl:w-52 text-xs">
              <div>
                <div className="flex justify-between text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  <span>Nutrition Equilibrium</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{bmbScoreData.nutrition}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 dark:bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${bmbScoreData.nutrition}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  <span>Training Protocol</span>
                  <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{bmbScoreData.workout}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-brand-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${bmbScoreData.workout}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  <span>Recovery & Check-In</span>
                  <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{bmbScoreData.recovery}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-500 dark:bg-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${bmbScoreData.recovery}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>Equilibrium State</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> 100% Lean Tissue Preservation
            </span>
          </div>
        </div>

        {/* Supporting Metric Cards (2 Columns on Desktop) */}
        <div className="md:col-span-2 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Caloric Balance Card */}
          <div className="glass-card rounded-3xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-2">
              <span className="font-bold uppercase tracking-wider">Maintenance Energy</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">{remainingCalories}</span>
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">kcal left</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 mt-2 font-mono font-medium">
                <span>Consumed: {caloriesConsumed}</span>
                <span>Target: {targetCalories}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-1.5">
                <div
                  className="bg-gradient-to-r from-amber-500 to-brand-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (caloriesConsumed / targetCalories) * 100)}%` }}
                />
              </div>
            </div>
            <div className="mt-3 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <span>Deviation Variance</span>
              <span className={`font-mono font-bold ${
                isSurplusExceeded ? 'text-amber-600 dark:text-amber-400' : isDeficitExceeded ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {calorieDiff > 0 ? `+${calorieDiff} kcal` : `${calorieDiff} kcal`}
              </span>
            </div>
          </div>

          {/* Protein Retention Card */}
          <div className="glass-card rounded-3xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-2">
              <span className="font-bold uppercase tracking-wider">Protein Maintenance</span>
              <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <Apple className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">{todaysProtein}</span>
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">/ {targetProtein}g</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 mt-2 font-mono font-medium">
                <span>Muscle Protein Synthesis</span>
                <span>{Math.round((todaysProtein / targetProtein) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-1.5">
                <div
                  className="bg-gradient-to-r from-brand-500 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (todaysProtein / targetProtein) * 100)}%` }}
                />
              </div>
            </div>
            <div className="mt-3 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <span>Anabolic Equilibrium</span>
              <span className="font-bold text-teal-600 dark:text-teal-400">Optimal Amino Pool</span>
            </div>
          </div>

          {/* Check-In & Bodyweight Card */}
          <div className="glass-card rounded-3xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-2">
              <span className="font-bold uppercase tracking-wider">Morning Fasted Weight</span>
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {latestCheckIn ? latestCheckIn.weight : userProfile.weightKg}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">kg (Target: {userProfile.targetMaintenanceWeightKg || userProfile.weightKg} kg)</span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-2 flex items-center gap-2">
                <span>Readiness:</span>
                <span className="px-2 py-0.5 rounded-md font-bold uppercase text-[10px] bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-300 border border-slate-200 dark:border-slate-700">
                  {latestCheckIn ? latestCheckIn.readiness : 'Pending'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowCheckInModal(true)}
              className="mt-3 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 flex items-center gap-1"
            >
              <span>{latestCheckIn ? 'Update Check-In & Cam' : 'Log Morning Weigh-In'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Hydration Balance Card */}
          <div className="glass-card rounded-3xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-2">
              <span className="font-bold uppercase tracking-wider">Hydration Intake</span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <Droplet className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">{waterLogged}</span>
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">/ {userProfile.waterGoalMl} ml</span>
                </div>
                <button
                  onClick={handleAddWater}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 text-xs font-bold border border-cyan-500/30 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> 250ml
                </button>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-sky-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (waterLogged / userProfile.waterGoalMl) * 100)}%` }}
                />
              </div>
            </div>
            <div className="mt-3 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <span>Cellular Hydration</span>
              <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{Math.round((waterLogged / userProfile.waterGoalMl) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION: DAILY BIOMETRICS & VITALS (WATER INTAKE, TOTAL STEPS, BMI)
      ========================================================================= */}
      <VitalsHub
        onOpenCheckInModal={() => setShowCheckInModal(true)}
        latestWeightKg={latestCheckIn ? latestCheckIn.weight : userProfile.weightKg}
      />

      {/* =========================================================================
          SECTION 4: FULLY EDITABLE WORKOUTS MODULE
      ========================================================================= */}
      {isInitialLoading && !currentWorkout ? (
        <WorkoutCardSkeleton />
      ) : !currentWorkout ? (
        <div className="glass-card rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 text-center">
          <div className="w-16 h-16 rounded-3xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            No Workout Scheduled For Today
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto">
            You're starting with a completely clean slate! Generate an adaptive maintenance routine tailored to your available equipment or manually assemble your exercises.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
            <button
              onClick={handleRegenerateWorkout}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-500 to-teal-500 hover:from-brand-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-glow flex items-center gap-2 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Generate AI Workout Routine</span>
            </button>
            <button
              onClick={() => setShowAddExerciseModal(true)}
              className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Exercise</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Today's Protocol
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-brand-500/15 text-brand-600 dark:text-brand-300 border border-brand-500/30">
                Equipment-Derived
              </span>

              {/* Real-Time Cloud Sync State Indicator */}
              {workoutSyncState === 'saving' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-500/15 text-brand-600 dark:text-brand-300 border border-brand-500/30 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin text-brand-500 dark:text-brand-400" />
                  <span>Saving to Cloud...</span>
                </span>
              )}
              {workoutSyncState === 'saved' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 animate-fadeIn">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span>Saved Changes to Firestore</span>
                </span>
              )}
              {workoutSyncState === 'error' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                  <span>Sync Error</span>
                </span>
              )}
              {workoutSyncState === 'idle' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  <ShieldCheck className="w-3 h-3 text-teal-500 dark:text-teal-400" />
                  <span>Firestore Synced</span>
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-brand-500 dark:text-brand-400" />
              <span>{currentWorkout?.name || 'Upper Body Strength Maintenance'}</span>
            </h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
              <span>Active Gear:</span>
              {(userProfile.equipment || ['dumbbells', 'adjustable_bench']).slice(0, 4).map((eq) => (
                <span key={eq} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] border border-slate-200 dark:border-slate-700">
                  {eq.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Action buttons & Rest Timer widget */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Rest Timer Widget */}
            <div className="flex items-center gap-2 p-1.5 px-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
              <Clock className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{formatTimer(timerSeconds)}</span>
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                title={timerRunning ? 'Pause' : 'Start'}
              >
                {timerRunning ? <Pause className="w-3 h-3 text-amber-500 dark:text-amber-400" /> : <Play className="w-3 h-3 text-brand-500 dark:text-brand-400" />}
              </button>
              <button
                onClick={() => {
                  setTimerRunning(false);
                  setTimerSeconds(90);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                title="Reset"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Add Exercise Button */}
            <button
              onClick={() => setShowAddExerciseModal(true)}
              className="px-3.5 py-2 rounded-xl bg-brand-500/15 hover:bg-brand-500/25 text-brand-600 dark:text-brand-300 text-xs font-bold border border-brand-500/30 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Exercise</span>
            </button>

            {/* Regenerate Button */}
            <button
              onClick={handleRegenerateWorkout}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
              title="Regenerate for current equipment"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Exercises Checklist */}
        <div className="mt-5 space-y-3">
          {currentWorkout?.exercises.map((ex, idx) => {
            const isEditingThis = editingExerciseId === ex.id;
            return (
              <div
                key={ex.id}
                className={`p-4 rounded-2xl border transition-all duration-200 ${
                  ex.completed
                    ? 'bg-brand-50/70 dark:bg-brand-950/20 border-brand-500/30 text-slate-800 dark:text-slate-200'
                    : 'bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                }`}
              >
                {!isEditingThis ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Exercise Info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => handleToggleExerciseDone(ex.id)}
                        className="mt-0.5 text-slate-400 hover:text-brand-500 dark:text-slate-500 dark:hover:text-brand-400 transition-colors shrink-0"
                        title={ex.completed ? 'Mark incomplete' : 'Mark completed'}
                      >
                        {ex.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-brand-500 dark:text-brand-400 fill-brand-400/20" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-slate-400 dark:text-slate-500 font-bold">#{idx + 1}</span>
                          <span
                            onClick={() => startEditExercise(ex)}
                            className={`text-sm font-bold text-slate-900 dark:text-white cursor-pointer hover:text-brand-500 dark:hover:text-brand-400 transition-colors ${
                              ex.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                            }`}
                            title="Click to edit exercise inline"
                          >
                            {ex.name}
                          </span>

                          {ex.replacedReason && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                              <Zap className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                              {ex.replacedReason}
                            </span>
                          )}

                          {ex.completed && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                              Completed
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                          <span className="text-brand-600 dark:text-brand-400 font-medium">{ex.targetMuscle}</span>
                          <span>•</span>
                          <span className="text-teal-600 dark:text-teal-300">{ex.equipmentLabel}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-600 dark:text-slate-300">{ex.sets} sets × {ex.reps} reps</span>
                          <span>•</span>
                          <span className="font-mono text-amber-600 dark:text-amber-300 font-bold">{ex.weight}</span>
                        </div>
                      </div>
                    </div>

                    {/* Set Checklist Bubbles, Stepper & Action Controls */}
                    <div className="flex items-center gap-2.5 self-end sm:self-center flex-wrap shrink-0">
                      {/* Weight Stepper */}
                      <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                        <button
                          onClick={() => handleAdjustWeight(ex.id, -2.5)}
                          className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                          title="Decrease 2.5kg"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-300 px-1">Load</span>
                        <button
                          onClick={() => handleAdjustWeight(ex.id, 2.5)}
                          className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                          title="Increase 2.5kg"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Interactive Set Circles */}
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: ex.sets }).map((_, sIdx) => {
                          const isDone = sIdx < ex.completedSets;
                          return (
                            <button
                              key={sIdx}
                              onClick={() => handleToggleSet(ex.id, sIdx)}
                              className={`w-8 h-8 rounded-lg font-mono text-xs font-extrabold flex items-center justify-center transition-all ${
                                isDone
                                  ? 'bg-brand-500 text-slate-950 shadow-glow'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                              }`}
                              title={`Set ${sIdx + 1} (${isDone ? 'Completed' : 'Click to log'})`}
                            >
                              {isDone ? '✓' : sIdx + 1}
                            </button>
                          );
                        })}
                      </div>

                      {/* ALWAYS-ACCESSIBLE Action Buttons: Edit, Swap, Delete */}
                      <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-800">
                        <button
                          onClick={() => startEditExercise(ex)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300 hover:bg-brand-500/15 border border-transparent hover:border-brand-500/30 transition-all"
                          title="Edit Exercise Inline (Name, Sets, Reps, Weight)"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSwapExercise(ex.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-300 hover:bg-teal-500/15 border border-transparent hover:border-teal-500/30 transition-all"
                          title="Swap with equipment-friendly alternative"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExercise(ex.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30 transition-all"
                          title="Delete this exercise"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Inline Edit Form */
                  <div className="p-4 space-y-3.5 bg-slate-50 dark:bg-slate-900/95 rounded-2xl border border-brand-500/40 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs font-bold text-brand-600 dark:text-brand-300">
                      <div className="flex items-center gap-1.5">
                        <Edit3 className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                        <span>Edit Exercise Inline</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Syncs immediately to Cloud Firestore</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Exercise Name *</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                          placeholder="Exercise Name"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Target Sets</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={editSets}
                          onChange={(e) => setEditSets(parseInt(e.target.value) || 3)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Target Reps</label>
                        <input
                          type="text"
                          value={editReps}
                          onChange={(e) => setEditReps(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-brand-500"
                          placeholder="8-10"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                      <div className="w-full sm:w-60">
                        <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Target Weight / Load</label>
                        <input
                          type="text"
                          value={editWeight}
                          onChange={(e) => setEditWeight(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-brand-500"
                          placeholder="e.g. 24 kg"
                        />
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => setEditingExerciseId(null)}
                          className="px-3.5 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveInlineEdit(ex.id)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-teal-400 hover:from-brand-400 hover:to-teal-300 text-slate-950 text-xs font-extrabold shadow-glow flex items-center gap-1.5 transition-all"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Prominent Full-Width "Add Exercise" CTA at the bottom of the workout card */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80">
          <button
            onClick={() => setShowAddExerciseModal(true)}
            className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-brand-500/50 bg-slate-50 dark:bg-slate-950/40 hover:bg-brand-500/5 text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 transition-all flex items-center justify-center gap-2 text-xs font-bold group shadow-sm active:scale-[0.99]"
          >
            <Plus className="w-4 h-4 text-brand-500 dark:text-brand-400 group-hover:scale-125 transition-transform" />
            <span>Add Exercise to Today's Routine</span>
          </button>
        </div>
      </div>
      )}

      {/* =========================================================================
          SECTION 4.5: GAMIFIED ACHIEVEMENTS & MILESTONE REWARDS
      ========================================================================= */}
      <AchievementsRewardsSection
        badges={rewards}
        totalPoints={rewardsSummary.totalPoints}
        unlockedCount={rewardsSummary.unlockedCount}
      />

      {/* =========================================================================
          SECTION 5: QUICK ACTIONS GRID
      ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setShowFoodPhotoModal(true)}
          className="p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-left transition-all group shadow-sm hover:shadow-md hover:border-amber-500/40"
        >
          <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform shadow-sm">
            <Utensils className="w-5 h-5" />
          </div>
          <div className="text-xs font-black text-slate-900 dark:text-white">Scan Food Photo</div>
          <div className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5 font-medium">AI vision macro estimation</div>
        </button>

        <button
          onClick={() => setShowCheckInModal(true)}
          className="p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-left transition-all group shadow-sm hover:shadow-md hover:border-brand-500/40"
        >
          <div className="w-9 h-9 rounded-2xl bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform shadow-sm">
            <Camera className="w-5 h-5" />
          </div>
          <div className="text-xs font-black text-slate-900 dark:text-white">Ghost Cam Check-In</div>
          <div className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5 font-medium">Fasted weight & silhouette</div>
        </button>

        <button
          onClick={() => setShowAddExerciseModal(true)}
          className="p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-left transition-all group shadow-sm hover:shadow-md hover:border-teal-500/40"
        >
          <div className="w-9 h-9 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform shadow-sm">
            <Plus className="w-5 h-5" />
          </div>
          <div className="text-xs font-black text-slate-900 dark:text-white">Add Exercise</div>
          <div className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5 font-medium">Equipment-matched library</div>
        </button>

        <button
          onClick={handleRegenerateWorkout}
          className="p-4 rounded-3xl bg-brand-500/10 dark:bg-brand-950/70 hover:bg-brand-500/20 dark:hover:bg-brand-900/80 border border-brand-500/30 dark:border-brand-500/40 text-left transition-all group shadow-sm hover:shadow-md"
        >
          <div className="w-9 h-9 rounded-2xl bg-brand-500/20 text-brand-600 dark:text-brand-300 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-xs font-black text-brand-700 dark:text-brand-300">Sync Closed-Loop</div>
          <div className="text-[10px] text-brand-700/80 dark:text-brand-300/80 mt-0.5 font-medium">Recalculate BMB Score</div>
        </button>
      </div>

      {/* Daily Check-In Modal with Ghost Camera */}
      <DailyCheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        onCheckInCompleted={async () => {
          const list = await fetchCheckIns();
          if (list && list.length > 0) {
            setLatestCheckIn(list[0]);
          }
        }}
      />

      {/* AI Food Photo Modal */}
      <AiFoodPhotoModal
        isOpen={showFoodPhotoModal}
        onClose={() => setShowFoodPhotoModal(false)}
        onLogCompleted={() => fetchNutritionLogs()}
      />

      {/* Add Exercise Modal */}
      <AddExerciseModal
        isOpen={showAddExerciseModal}
        onClose={() => setShowAddExerciseModal(false)}
        userEquipment={userProfile.equipment || ['dumbbells', 'adjustable_bench']}
        onAddExercise={handleAddExerciseFromModal}
      />
    </div>
  );
};
