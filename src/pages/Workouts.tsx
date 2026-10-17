import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Sparkles,
  Wrench,
  Edit2,
  BookmarkCheck,
  Layers,
  ArrowRight,
  X,
  FileText,
  Coffee,
  Calendar,
  ShieldAlert,
  AlertCircle,
  CalendarCheck,
  HeartPulse,
  Timer,
  Loader2,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeActiveWorkout,
  saveActiveWorkout,
  finishAndSaveWorkout,
  subscribeWorkoutLogs,
  deleteCompletedWorkoutLog,
  subscribeUserProfile,
  generateEquipmentAwareRoutine,
  getFilteredExercisesForUser,
  type EquipmentExerciseDef,
  saveWorkoutToCollection,
  saveSavedWorkoutRoutine,
  deleteSavedWorkoutRoutine,
  subscribeSavedWorkoutRoutines,
  subscribeCustomExercises,
  subscribeDailyRoutines,
  saveDailyRoutine,
  startDayRoutineWorkout,
  subscribeUserWorkoutStats,
  subscribeUserStreak,
  DEFAULT_WEEKLY_SPLIT,
  type WorkoutSession,
  type ExerciseItem,
  type ExerciseSet,
  type CompletedWorkout,
  type UserProfile,
  type CustomExercise,
  type DayOfWeek,
  type DayRoutineTemplate,
  type UserWorkoutStats,
  type UserStreak,
  submitRestLeaveRequest,
  subscribeRestLeaveRequests,
  type RestLeaveRequest,
} from '../services/firestoreService';
import { getCalendarDayInfo } from '../utils/tamilCalendar';
import WorkoutTimer from '../components/workout/WorkoutTimer';
import RestTimerBanner from '../components/workout/RestTimerBanner';
import CustomExerciseLibraryModal from '../components/workout/CustomExerciseLibraryModal';
import HevyDaySplitSelector, { getTodayDayOfWeek } from '../components/workout/HevyDaySplitSelector';
import RestLeaveRequestModal from '../components/workout/RestLeaveRequestModal';
import WorkoutCompletionModal, {
  type WorkoutCompletionMetrics,
} from '../components/workout/WorkoutCompletionModal';
import Card3D from '../components/common/Card3D';

export const Workouts: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [completedList, setCompletedList] = useState<CompletedWorkout[]>([]);
  const [savedTemplates, setSavedTemplates] = useState<(WorkoutSession & { id: string })[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // User Completion Milestones & Streak
  const [userStats, setUserStats] = useState<UserWorkoutStats | null>(null);
  const [userStreak, setUserStreak] = useState<UserStreak | null>(null);

  // 3D Workout Completion Flash Card Modal State
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completionMetrics, setCompletionMetrics] = useState<WorkoutCompletionMetrics | null>(null);

  // Routine Name Inline Editing
  const [isEditingRoutineTitle, setIsEditingRoutineTitle] = useState(false);
  const [routineTitleDraft, setRoutineTitleDraft] = useState('');

  // Exercise Inline Editing States
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [exerciseNameDraft, setExerciseNameDraft] = useState('');
  const [editingMuscleId, setEditingMuscleId] = useState<string | null>(null);
  const [exerciseMuscleDraft, setExerciseMuscleDraft] = useState('');

  // Inline Custom Movement Inputs (Zero Popups)
  const [inlineExName, setInlineExName] = useState('');
  const [inlineExMuscle, setInlineExMuscle] = useState('');

  // Workout Elapsed Timer State
  const [workoutElapsedSeconds, setWorkoutElapsedSeconds] = useState(0);

  // Smart Rest Timer State
  const [isRestTimerActive, setIsRestTimerActive] = useState<boolean>(false);
  const [restTimerTargetSeconds, setRestTimerTargetSeconds] = useState<number>(90);
  const [restTimerExName, setRestTimerExName] = useState<string>('');
  const [restTimerSetNum, setRestTimerSetNum] = useState<number | undefined>(undefined);

  // Feedback Toast
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3500);
  };

  // Tabs Navigation State ('workout' | 'history' | 'templates' | 'leave_requests')
  type WorkoutTab = 'workout' | 'history' | 'templates' | 'leave_requests';
  const [activeTab, setActiveTab] = useState<WorkoutTab>('workout');

  // Formal Rest Leave Requests & Permissions
  const [leaveRequests, setLeaveRequests] = useState<RestLeaveRequest[]>([]);
  const [isManualLeaveModalOpen, setIsManualLeaveModalOpen] = useState(false);

  // Fasting Mode State (Tamil Calendar detection with manual toggle support)
  const [isFasting, setIsFasting] = useState<boolean>(() => {
    try {
      return !!getCalendarDayInfo(new Date()).isFastingDay;
    } catch {
      return false;
    }
  });

  // Custom Exercises Library Modal & Data
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>([]);
  const [isCustomLibraryOpen, setIsCustomLibraryOpen] = useState(false);

  // Hevy-Style Day-by-Day Routines
  const [dailyRoutines, setDailyRoutines] = useState<Record<DayOfWeek, DayRoutineTemplate>>(DEFAULT_WEEKLY_SPLIT);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getTodayDayOfWeek());

  // Real-time Firestore Subscriptions (Zero Mock Data)
  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    const unsubActive = subscribeActiveWorkout(currentUser.uid, (session) => {
      setActiveSession(session);
      setLoading(false);
    });

    const unsubHistory = subscribeWorkoutLogs(currentUser.uid, (history) => {
      setCompletedList(history);
    });

    const unsubProfile = subscribeUserProfile(currentUser.uid, (profile) => {
      setUserProfile(profile);
    });

    const unsubTemplates = subscribeSavedWorkoutRoutines(currentUser.uid, (templates) => {
      setSavedTemplates(templates);
    });

    const unsubCustom = subscribeCustomExercises(currentUser.uid, (list) => {
      setCustomExercises(list);
    });

    const unsubDaily = subscribeDailyRoutines(currentUser.uid, (routines) => {
      setDailyRoutines(routines);
    });

    const unsubStats = subscribeUserWorkoutStats(currentUser.uid, (stats) => {
      setUserStats(stats);
    });

    const unsubStreak = subscribeUserStreak(currentUser.uid, (streak) => {
      setUserStreak(streak);
    });

    const unsubLeaves = subscribeRestLeaveRequests(currentUser.uid, (requests) => {
      setLeaveRequests(requests);
    });

    return () => {
      unsubActive();
      unsubHistory();
      unsubProfile();
      unsubTemplates();
      unsubCustom();
      unsubDaily();
      unsubStats();
      unsubStreak();
      unsubLeaves();
    };
  }, [currentUser?.uid]);

  // Handler for submitting formal leave request
  const handleSubmitLeaveRequest = async (
    request: Omit<RestLeaveRequest, 'id' | 'createdAt'>
  ) => {
    if (!currentUser?.uid) return;
    try {
      await submitRestLeaveRequest(currentUser.uid, request);
      showToast('Formal Leave Letter registered with AI Coach!');
    } catch (err) {
      console.error('Failed to submit leave request:', err);
      showToast('Failed to submit leave letter.');
    }
  };

  // Handler for permanently deleting a completed workout log
  const handleDeleteCompletedWorkoutLog = async (logId: string, routineName: string) => {
    if (!currentUser?.uid) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete the completed workout log for "${routineName}"? This will remove it from your history and update your total volume analytics.`
    );
    if (!confirmDelete) return;

    try {
      setCompletedList((prev) => prev.filter((item) => item.id !== logId));
      await deleteCompletedWorkoutLog(currentUser.uid, logId);
      showToast(`Deleted workout log "${routineName}".`);
    } catch (err) {
      console.error('Failed to delete completed workout log:', err);
      showToast('Error deleting workout log.');
    }
  };

  // Handler for permanently deleting a saved routine template
  const handleDeleteSavedRoutine = async (routineId: string, routineName: string) => {
    if (!currentUser?.uid) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete the saved routine template "${routineName}" from your library?`
    );
    if (!confirmDelete) return;

    try {
      setSavedTemplates((prev) => prev.filter((tpl) => tpl.id !== routineId));
      await deleteSavedWorkoutRoutine(currentUser.uid, routineId);
      showToast(`Deleted routine "${routineName}" from library.`);
    } catch (err) {
      console.error('Failed to delete saved routine:', err);
      showToast('Error deleting saved routine.');
    }
  };

  // Helper for human-readable completion date formatting
  const formatCompletedDate = (timestamp: unknown): string => {
    if (!timestamp) return 'Recent';
    try {
      let d: Date | null = null;
      if (typeof (timestamp as { toDate?: () => Date }).toDate === 'function') {
        d = (timestamp as { toDate: () => Date }).toDate();
      } else if (timestamp instanceof Date) {
        d = timestamp;
      } else if (typeof timestamp === 'number' || typeof timestamp === 'string') {
        d = new Date(timestamp);
      }
      if (d && !isNaN(d.getTime())) {
        return d.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch {
      // Ignore
    }
    return 'Completed';
  };

  /* ==================== HEVY ROUTINES & CUSTOM EXERCISE HANDLERS ==================== */
  const handleStartDayRoutine = async (routine: DayRoutineTemplate) => {
    if (!currentUser?.uid) return;
    try {
      if (activeSession && (activeSession.exercises || []).length > 0) {
        const replace = window.confirm(
          `You have an active session ("${activeSession.routineName}"). Load "${routine.routineName}" as your active workout?`
        );
        if (!replace) return;
      }
      const newSession = await startDayRoutineWorkout(currentUser.uid, routine);
      setActiveSession(newSession);
      showToast(`Loaded ${routine.dayName} routine: "${routine.routineName}"! Timer started.`);
    } catch (err) {
      console.error('Failed to start day routine:', err);
      showToast('Error starting day routine.');
    }
  };

  const handleUpdateDailyRoutine = async (
    dayId: DayOfWeek,
    updated: Partial<DayRoutineTemplate>
  ) => {
    if (!currentUser?.uid) return;
    try {
      await saveDailyRoutine(currentUser.uid, dayId, updated);
    } catch (err) {
      console.error('Failed to update daily routine:', err);
      showToast('Error saving routine changes.');
    }
  };

  const handleSelectCustomExerciseFromModal = async (ex: CustomExercise) => {
    if (!currentUser?.uid) return;
    if (activeSession) {
      const newEx: ExerciseItem = {
        id: `ex-cust-${Date.now()}-${ex.id}`,
        name: ex.name,
        muscle: ex.muscle,
        sets: [
          { id: `s-${Date.now()}-1`, setNumber: 1, weight: Number(ex.defaultWeightKg) || 0, reps: Number(ex.defaultReps) || 10, completed: false },
          { id: `s-${Date.now()}-2`, setNumber: 2, weight: Number(ex.defaultWeightKg) || 0, reps: Number(ex.defaultReps) || 10, completed: false },
          { id: `s-${Date.now()}-3`, setNumber: 3, weight: Number(ex.defaultWeightKg) || 0, reps: Number(ex.defaultReps) || 10, completed: false },
        ],
      };
      const updated = {
        ...activeSession,
        exercises: [...(activeSession.exercises || []), newEx],
      };
      await saveActiveWorkout(currentUser.uid, updated);
      await saveWorkoutToCollection(currentUser.uid, updated);
      setIsCustomLibraryOpen(false);
      showToast(`Added "${ex.name}" to active workout!`);
    } else {
      const currentDay = dailyRoutines[selectedDay];
      if (!currentDay) return;
      const newEx: ExerciseItem = {
        id: `ex-cust-${Date.now()}-${ex.id}`,
        name: ex.name,
        muscle: ex.muscle,
        sets: [
          { id: `s-${Date.now()}-1`, setNumber: 1, weight: Number(ex.defaultWeightKg) || 0, reps: Number(ex.defaultReps) || 10, completed: false },
          { id: `s-${Date.now()}-2`, setNumber: 2, weight: Number(ex.defaultWeightKg) || 0, reps: Number(ex.defaultReps) || 10, completed: false },
          { id: `s-${Date.now()}-3`, setNumber: 3, weight: Number(ex.defaultWeightKg) || 0, reps: Number(ex.defaultReps) || 10, completed: false },
        ],
      };
      await handleUpdateDailyRoutine(selectedDay, {
        exercises: [...(currentDay.exercises || []), newEx],
      });
      setIsCustomLibraryOpen(false);
      showToast(`Added "${ex.name}" to ${currentDay.dayName} split template!`);
    }
  };

  /* ==================== EQUIPMENT-AWARE ROUTINE GENERATION ==================== */
  const handleGenerateRoutine = async (split: 'full_body' | 'upper' | 'lower') => {
    if (!currentUser?.uid) return;

    try {
      const equipment = userProfile?.equipment || [];
      const experience = userProfile?.experienceLevel || 'intermediate';

      const generated = generateEquipmentAwareRoutine(equipment, experience, split);
      await saveActiveWorkout(currentUser.uid, generated);
      await saveWorkoutToCollection(currentUser.uid, generated);

      showToast(`Generated ${split.replace('_', ' ')} routine tailored to your ${equipment.length} registered gym machines!`);
    } catch (err) {
      console.error('Failed to generate routine:', err);
      showToast('Error generating routine. Please try again.');
    }
  };

  /* ==================== ROUTINE TITLE EDITING ==================== */
  const handleStartEditRoutineTitle = () => {
    if (!activeSession) return;
    setRoutineTitleDraft(activeSession.routineName);
    setIsEditingRoutineTitle(true);
  };

  const handleSaveRoutineTitle = async () => {
    if (!currentUser?.uid || !activeSession) return;
    try {
      const trimmed = routineTitleDraft.trim() || 'Custom Training Session';
      const updated = { ...activeSession, routineName: trimmed };
      await saveActiveWorkout(currentUser.uid, updated);
      await saveWorkoutToCollection(currentUser.uid, updated);
      setIsEditingRoutineTitle(false);
      showToast('Routine title updated and synced to Firestore.');
    } catch (err) {
      console.error('Failed to save routine title:', err);
      showToast('Error saving routine title.');
    }
  };

  /* ==================== INLINE EXERCISE EDITING ==================== */
  const handleStartEditExerciseName = (ex: ExerciseItem) => {
    setEditingExerciseId(ex.id);
    setExerciseNameDraft(ex.name);
  };

  const handleSaveExerciseName = async (exerciseId: string) => {
    if (!currentUser?.uid || !activeSession) return;
    const trimmed = exerciseNameDraft.trim();
    if (!trimmed) {
      setEditingExerciseId(null);
      return;
    }

    try {
      const updatedExercises = (activeSession.exercises || []).map((ex) =>
        ex.id === exerciseId ? { ...ex, name: trimmed } : ex
      );
      const updated = { ...activeSession, exercises: updatedExercises };
      await saveActiveWorkout(currentUser.uid, updated);
      await saveWorkoutToCollection(currentUser.uid, updated);
      setEditingExerciseId(null);
      showToast('Exercise name updated in real-time.');
    } catch (err) {
      console.error('Failed to save exercise name:', err);
      showToast('Error updating exercise name.');
    }
  };

  const handleStartEditMuscle = (ex: ExerciseItem) => {
    setEditingMuscleId(ex.id);
    setExerciseMuscleDraft(ex.muscle);
  };

  const handleSaveMuscle = async (exerciseId: string) => {
    if (!currentUser?.uid || !activeSession) return;
    const trimmed = exerciseMuscleDraft.trim() || 'Compound';

    try {
      const updatedExercises = (activeSession.exercises || []).map((ex) =>
        ex.id === exerciseId ? { ...ex, muscle: trimmed } : ex
      );
      const updated = { ...activeSession, exercises: updatedExercises };
      await saveActiveWorkout(currentUser.uid, updated);
      await saveWorkoutToCollection(currentUser.uid, updated);
      setEditingMuscleId(null);
    } catch (err) {
      console.error('Failed to save muscle group:', err);
      showToast('Error updating muscle group.');
    }
  };

  /* ==================== SETS MANAGEMENT & SMART REST TIMER ==================== */
  const handleToggleSet = async (exerciseId: string, setId: string) => {
    if (!currentUser?.uid || !activeSession) return;
    try {
      let isNowCompleted = false;
      let targetExName = '';
      let targetSetNumber = 1;
      let targetRest = 90;

      const updatedExercises = (activeSession.exercises || []).map((ex) => {
        if (ex.id !== exerciseId) return ex;
        targetExName = ex.name;
        targetRest = ex.targetRestSeconds || 90;
        return {
          ...ex,
          sets: (ex.sets || []).map((s) => {
            if (s.id === setId) {
              isNowCompleted = !s.completed;
              targetSetNumber = s.setNumber;
              return { ...s, completed: isNowCompleted };
            }
            return s;
          }),
        };
      });

      await saveActiveWorkout(currentUser.uid, { ...activeSession, exercises: updatedExercises });

      // Automatically trigger smart rest timer upon completing a set
      if (isNowCompleted) {
        setRestTimerTargetSeconds(targetRest);
        setRestTimerExName(targetExName);
        setRestTimerSetNum(targetSetNumber);
        setIsRestTimerActive(true);
      }
    } catch (err) {
      console.error('Failed to toggle set:', err);
    }
  };

  const handleStartManualRest = (exerciseName: string, restSecs = 90) => {
    setRestTimerTargetSeconds(restSecs);
    setRestTimerExName(exerciseName);
    setRestTimerSetNum(undefined);
    setIsRestTimerActive(true);
  };

  const handleUpdateSet = async (
    exerciseId: string,
    setId: string,
    field: 'weight' | 'reps',
    value: number
  ) => {
    if (!currentUser?.uid || !activeSession) return;
    try {
      const parsedNum = Number(value);
      const safeValue = Math.max(0, isNaN(parsedNum) ? 0 : parsedNum);
      const updatedExercises = (activeSession.exercises || []).map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: (ex.sets || []).map((s) => (s.id === setId ? { ...s, [field]: safeValue } : s)),
        };
      });
      await saveActiveWorkout(currentUser.uid, { ...activeSession, exercises: updatedExercises });
    } catch (err) {
      console.error('Failed to update set:', err);
    }
  };

  const handleAddSet = async (exerciseId: string) => {
    if (!currentUser?.uid || !activeSession) return;
    try {
      const updatedExercises = (activeSession.exercises || []).map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const setsList = ex.sets || [];
        const lastSet = setsList[setsList.length - 1];
        const newSet: ExerciseSet = {
          id: `s-${Date.now()}-${setsList.length + 1}`,
          setNumber: setsList.length + 1,
          weight: lastSet ? Number(lastSet.weight) : 20,
          reps: lastSet ? Number(lastSet.reps) : 10,
          completed: false,
        };
        return { ...ex, sets: [...setsList, newSet] };
      });
      await saveActiveWorkout(currentUser.uid, { ...activeSession, exercises: updatedExercises });
    } catch (err) {
      console.error('Failed to add set:', err);
      showToast('Error adding set.');
    }
  };

  const handleDeleteSet = async (exerciseId: string, setId: string) => {
    if (!currentUser?.uid || !activeSession) return;
    try {
      const updatedExercises = (activeSession.exercises || []).map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const setsList = ex.sets || [];
        if (setsList.length <= 1) return ex; // Keep at least 1 set
        const filtered = setsList.filter((s) => s.id !== setId);
        const renumbered = filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
        return { ...ex, sets: renumbered };
      });
      await saveActiveWorkout(currentUser.uid, { ...activeSession, exercises: updatedExercises });
    } catch (err) {
      console.error('Failed to delete set:', err);
      showToast('Error deleting set.');
    }
  };

  const handleRemoveExercise = async (exerciseId: string) => {
    if (!currentUser?.uid || !activeSession) return;
    try {
      const updatedExercises = (activeSession.exercises || []).filter((ex) => ex.id !== exerciseId);
      const updated = { ...activeSession, exercises: updatedExercises };
      await saveActiveWorkout(currentUser.uid, updated);
      await saveWorkoutToCollection(currentUser.uid, updated);
      showToast('Exercise removed from active workout.');
    } catch (err) {
      console.error('Failed to remove exercise:', err);
      showToast('Error removing exercise.');
    }
  };

  /* ==================== INLINE CUSTOM MOVEMENT CREATOR ==================== */
  const handleInlineAddCustomMovement = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser?.uid || !activeSession || !inlineExName.trim()) return;

    try {
      const newEx: ExerciseItem = {
        id: `ex-${Date.now()}`,
        name: inlineExName.trim(),
        muscle: inlineExMuscle.trim() || 'General / Compound',
        sets: [
          { id: `s-${Date.now()}-1`, setNumber: 1, weight: 20, reps: 10, completed: false },
          { id: `s-${Date.now()}-2`, setNumber: 2, weight: 20, reps: 10, completed: false },
          { id: `s-${Date.now()}-3`, setNumber: 3, weight: 20, reps: 10, completed: false },
        ],
      };

      const updated = {
        ...activeSession,
        exercises: [...(activeSession.exercises || []), newEx],
      };

      await saveActiveWorkout(currentUser.uid, updated);
      await saveWorkoutToCollection(currentUser.uid, updated);

      setInlineExName('');
      setInlineExMuscle('');
      showToast(`Added "${newEx.name}" inline with 3 calibrated sets.`);
    } catch (err) {
      console.error('Failed to add custom movement:', err);
      showToast('Error adding custom movement.');
    }
  };

  /* ==================== QUICK-ADD FROM REGISTERED INVENTORY ==================== */
  const availableInventoryExercises = React.useMemo((): EquipmentExerciseDef[] => {
    const list = getFilteredExercisesForUser(userProfile?.equipment || []);
    if (!activeSession) return list;
    const activeNames = new Set((activeSession.exercises || []).map((e: ExerciseItem) => e.name.toLowerCase()));
    return list.filter((e: EquipmentExerciseDef) => !activeNames.has(e.name.toLowerCase()));
  }, [userProfile?.equipment, activeSession]);

  const handleQuickAddFromInventory = async (def: EquipmentExerciseDef) => {
    if (!currentUser?.uid || !activeSession) return;

    try {
      const newEx: ExerciseItem = {
        id: `ex-inv-${Date.now()}-${def.id}`,
        name: def.name,
        muscle: def.muscle,
        sets: [
          { id: `s-${Date.now()}-1`, setNumber: 1, weight: Number(def.defaultWeightKg), reps: Number(def.defaultReps), completed: false },
          { id: `s-${Date.now()}-2`, setNumber: 2, weight: Number(def.defaultWeightKg), reps: Number(def.defaultReps), completed: false },
          { id: `s-${Date.now()}-3`, setNumber: 3, weight: Number(def.defaultWeightKg), reps: Number(def.defaultReps), completed: false },
        ],
      };

      const updated = {
        ...activeSession,
        exercises: [...(activeSession.exercises || []), newEx],
      };

      await saveActiveWorkout(currentUser.uid, updated);
      await saveWorkoutToCollection(currentUser.uid, updated);

      showToast(`Added "${def.name}" to session.`);
    } catch (err) {
      console.error('Failed to quick-add exercise:', err);
      showToast('Error adding exercise to workout.');
    }
  };

  /* ==================== WORKOUT TIMER CONTROLS ==================== */
  const handleStartWorkoutTimer = async () => {
    if (!currentUser?.uid) return;
    const now = Date.now();
    if (!activeSession) {
      const equipment = userProfile?.equipment || [];
      const experience = userProfile?.experienceLevel || 'intermediate';
      const generated = generateEquipmentAwareRoutine(equipment, experience, 'full_body');
      generated.startedAt = now;
      generated.isPaused = false;
      await saveActiveWorkout(currentUser.uid, generated);
      await saveWorkoutToCollection(currentUser.uid, generated);
      showToast('Workout started! Live stopwatch tracking training time.');
    } else {
      const updated = {
        ...activeSession,
        startedAt: activeSession.startedAt || now,
        isPaused: false,
      };
      await saveActiveWorkout(currentUser.uid, updated);
      showToast('Workout timer running.');
    }
  };

  const handlePauseWorkoutTimer = async () => {
    if (!currentUser?.uid || !activeSession) return;
    const updated = { ...activeSession, isPaused: true };
    await saveActiveWorkout(currentUser.uid, updated);
  };

  const handleResumeWorkoutTimer = async () => {
    if (!currentUser?.uid || !activeSession) return;
    const updated = { ...activeSession, isPaused: false };
    await saveActiveWorkout(currentUser.uid, updated);
  };

  /* ==================== SESSION FINISH & 3D FLASH CARD TRIGGER ==================== */
  const handleFinishWorkout = async () => {
    if (!currentUser?.uid || !activeSession) return;
    try {
      if ((activeSession.exercises || []).length === 0) {
        await saveActiveWorkout(currentUser.uid, null);
        showToast('Empty workout cleared.');
        return;
      }

      // 1. Calculate active training duration (seconds and minutes)
      const totalSeconds = workoutElapsedSeconds > 0
        ? workoutElapsedSeconds
        : activeSession.startedAt
        ? Math.max(1, Math.floor((Date.now() - activeSession.startedAt) / 1000))
        : 2700;
      const durationMinutes = Math.max(1, Math.round(totalSeconds / 60));

      // 2. Calculate total volume
      const calculatedVolume = (activeSession.exercises || []).reduce((acc, ex) => {
        return (
          acc +
          (ex.sets || []).reduce((setAcc, s) => {
            return s.completed
              ? setAcc + (Number(s.weight) || 0) * (Number(s.reps) || 0)
              : setAcc;
          }, 0)
        );
      }, 0);

      // Fallback volume if user didn't check every individual set checkbox
      const fallbackVolume = (activeSession.exercises || []).reduce((acc, ex) => {
        return (
          acc +
          (ex.sets || []).reduce((setAcc, s) => {
            return setAcc + (Number(s.weight) || 0) * (Number(s.reps) || 0);
          }, 0)
        );
      }, 0);

      const totalVolumeKg = calculatedVolume > 0 ? calculatedVolume : fallbackVolume;

      // 3. Extract trained muscle groups
      const muscleSet = new Set<string>();
      (activeSession.exercises || []).forEach((ex) => {
        if (ex.muscle) {
          const parts = ex.muscle.split(/[/&,]/).map((m) => m.trim()).filter(Boolean);
          if (parts.length > 0) {
            parts.forEach((p) => muscleSet.add(p));
          } else {
            muscleSet.add(ex.muscle.trim());
          }
        }
      });
      const trainedMuscles = Array.from(muscleSet).slice(0, 6);
      if (trainedMuscles.length === 0) trainedMuscles.push('Full Body');

      const totalSets = (activeSession.exercises || []).reduce(
        (acc, ex) => acc + (ex.sets || []).length,
        0
      );
      const totalExercises = (activeSession.exercises || []).length;

      // 4. Save to Firestore (workout_logs, completed_workouts) & increment users/{userId}/stats
      const result = await finishAndSaveWorkout(currentUser.uid, activeSession, durationMinutes);

      const newMilestone = result?.milestoneCount || (userStats?.totalWorkoutsCompleted || 0) + 1;
      const currentStreak = result?.streakCount || userStreak?.currentStreak || 1;

      // 5. Trigger the 3D-Effect Flash Card Modal
      setCompletionMetrics({
        routineName: activeSession.routineName || 'Custom Training Session',
        durationSeconds: totalSeconds,
        durationMinutes,
        totalVolumeKg,
        totalSets,
        totalExercises,
        trainedMuscles,
        milestoneCount: newMilestone,
        streakCount: currentStreak,
      });

      setWorkoutElapsedSeconds(0);
      setIsCompletionModalOpen(true);
    } catch (err) {
      console.error('Failed to finish workout:', err);
      showToast('Error finishing workout.');
    }
  };

  const handleCloseCompletionModal = async () => {
    setIsCompletionModalOpen(false);
    setCompletionMetrics(null);
    if (currentUser?.uid) {
      await saveActiveWorkout(currentUser.uid, null);
    }
    showToast('🎉 Workout saved to history! Outstanding work.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDiscardWorkout = async () => {
    if (!currentUser?.uid) return;
    try {
      if (window.confirm('Discard active workout session?')) {
        await saveActiveWorkout(currentUser.uid, null);
        showToast('Active session discarded.');
      }
    } catch (err) {
      console.error('Failed to discard workout:', err);
      showToast('Error discarding workout session.');
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!currentUser?.uid || !activeSession) return;
    try {
      await saveSavedWorkoutRoutine(currentUser.uid, activeSession);
      showToast('Routine saved to your custom workouts library!');
    } catch (err) {
      console.error('Failed to save template:', err);
      showToast('Error saving routine template.');
    }
  };

  // Defensive Calculations
  const totalVolume = activeSession
    ? (activeSession.exercises || []).reduce((acc, ex) => {
        return (
          acc +
          (ex.sets || []).reduce((setAcc, s) => (s.completed ? setAcc + (Number(s.weight) || 0) * (Number(s.reps) || 0) : setAcc), 0)
        );
      }, 0)
    : 0;

  const completedSetsCount = activeSession
    ? (activeSession.exercises || []).reduce((acc, ex) => acc + (ex.sets || []).filter((s) => s.completed).length, 0)
    : 0;

  const totalSetsCount = activeSession
    ? (activeSession.exercises || []).reduce((acc, ex) => acc + (ex.sets || []).length, 0)
    : 0;

  // User-selected Rest Days Count (Weekly Quota: Min 1, Max 3)
  const restDayCount = Object.values(dailyRoutines).filter(
    (r) => r.splitCategory === 'rest' || r.isRestDay
  ).length;

  // Defensive Guard Clause: Loading spinner when user data or active workout is loading
  if (loading || !currentUser) {
    return (
      <div className="min-h-[450px] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-4 shadow-sm">
          <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Loading Workout Hub...
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Connecting to Cloud Firestore real-time workout stream...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {statusToast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900/95 dark:bg-slate-900/95 text-white font-bold text-xs shadow-2xl flex items-center gap-2 border border-emerald-500/50 backdrop-blur-md animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{statusToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Workout Session Tracker</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30">
              Live onSnapshot
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Equipment-aware daily maintenance routines with real-time inline editing. Zero mock data.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Custom Movement Library Trigger Button */}
          <button
            onClick={() => setIsCustomLibraryOpen(true)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition"
            title="Open deletable custom movements library"
          >
            <Dumbbell className="w-3.5 h-3.5 text-emerald-500" />
            <span>Custom Library ({customExercises.length})</span>
          </button>

          {/* Real-Time Workout Stopwatch Tracker */}
          <WorkoutTimer
            startedAt={activeSession?.startedAt}
            isPausedInitially={activeSession?.isPaused}
            onTimeUpdate={(seconds) => setWorkoutElapsedSeconds(seconds)}
            onStart={handleStartWorkoutTimer}
            onPause={handlePauseWorkoutTimer}
            onResume={handleResumeWorkoutTimer}
            onReset={() => setWorkoutElapsedSeconds(0)}
          />

          {activeSession ? (
            <>
              <button
                onClick={handleSaveAsTemplate}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition"
                title="Save snapshot to your workouts library"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-teal-500" />
                <span className="hidden sm:inline">Save Template</span>
              </button>
              <button
                onClick={handleFinishWorkout}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition active:scale-95"
              >
                <CheckCircle className="w-4 h-4 text-slate-950" />
                <span>Finish Workout</span>
              </button>
              <button
                onClick={handleDiscardWorkout}
                className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 transition"
                title="Discard Session"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={handleStartWorkoutTimer}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Workout</span>
            </button>
          )}
        </div>
      </div>

      {/* 4-Tab Modern OLED Segmented Navigation Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('workout')}
          className={`px-3 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition btn-tactile ${
            activeTab === 'workout'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60 font-bold'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Active Split &amp; Live Tracker</span>
          <span className="sm:hidden">Split &amp; Live</span>
          {activeSession && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-slate-950 text-emerald-400 animate-pulse uppercase">
              Live
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition btn-tactile ${
            activeTab === 'history'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60 font-bold'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Workout History &amp; Logs</span>
          <span className="sm:hidden">History</span>
          <span
            className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
              activeTab === 'history'
                ? 'bg-slate-950 text-emerald-400'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {(completedList || []).length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`px-3 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition btn-tactile ${
            activeTab === 'templates'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60 font-bold'
          }`}
        >
          <BookmarkCheck className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Templates &amp; Library</span>
          <span className="sm:hidden">Templates</span>
          <span
            className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
              activeTab === 'templates'
                ? 'bg-slate-950 text-emerald-400'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {(savedTemplates || []).length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('leave_requests')}
          className={`px-3 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition btn-tactile ${
            activeTab === 'leave_requests'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60 font-bold'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Leave Letters &amp; Rest Logs</span>
          <span className="sm:hidden">Rest &amp; Leave</span>
          <span
            className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
              activeTab === 'leave_requests'
                ? 'bg-slate-950 text-emerald-400'
                : restDayCount > 3
                ? 'bg-rose-500/20 text-rose-500'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {restDayCount}/3 Rest
          </span>
        </button>
      </div>

      {/* ================= TAB 1: ACTIVE SPLIT & LIVE TRACKER ================= */}
      {activeTab === 'workout' && (
        <div className="space-y-6">
          <HevyDaySplitSelector
            dailyRoutines={dailyRoutines}
            activeDay={selectedDay}
            onSelectDay={(day) => setSelectedDay(day)}
            onStartRoutine={handleStartDayRoutine}
            onUpdateRoutine={handleUpdateDailyRoutine}
            onSubmitLeaveRequest={handleSubmitLeaveRequest}
            onOpenCustomLibrary={() => setIsCustomLibraryOpen(true)}
            customExercises={customExercises}
            isWorkoutActive={!!activeSession}
            isFasting={isFasting}
            onToggleFasting={() => setIsFasting((prev) => !prev)}
            userName={currentUser?.displayName || 'Champion'}
            showToast={showToast}
          />

      {/* ACTIVE WORKOUT SESSION */}
      {activeSession ? (
        <div className="space-y-4">
          {/* Active Routine Title & Metrics Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-[220px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-0.5">
                Active Routine (Inline Editable)
              </span>

              {isEditingRoutineTitle ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={routineTitleDraft}
                    onChange={(e) => setRoutineTitleDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveRoutineTitle()}
                    className="px-2.5 py-1 text-sm font-bold rounded-lg bg-slate-50 dark:bg-slate-950 border border-emerald-500 text-slate-900 dark:text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveRoutineTitle}
                    className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                  <button
                    onClick={() => setIsEditingRoutineTitle(false)}
                    className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group cursor-pointer" onClick={handleStartEditRoutineTitle}>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                    {activeSession.routineName}
                  </h3>
                  <Edit2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 opacity-60 group-hover:opacity-100 transition" />
                </div>
              )}
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

          {/* Exercise List with Full Inline Editing */}
          {activeSession.exercises.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Dumbbell className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Empty Workout Session</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Click one of the Equipment-Aware Routine Generator buttons above or add your custom movements below!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeSession.exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                  {/* Exercise Header (Inline Editable Name & Muscle) */}
                  <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                        <Dumbbell className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* INLINE EDIT EXERCISE NAME */}
                        {editingExerciseId === exercise.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={exerciseNameDraft}
                              onChange={(e) => setExerciseNameDraft(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveExerciseName(exercise.id)}
                              className="px-2 py-0.5 text-xs sm:text-sm font-bold rounded bg-slate-50 dark:bg-slate-950 border border-emerald-500 text-slate-900 dark:text-white focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveExerciseName(exercise.id)}
                              className="p-1 rounded bg-emerald-500 text-slate-950 text-xs font-bold"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingExerciseId(null)}
                              className="p-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-400"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleStartEditExerciseName(exercise)}
                            className="flex items-center gap-1.5 group cursor-pointer"
                            title="Click to inline edit exercise name"
                          >
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                              {exercise.name}
                            </h3>
                            <Edit2 className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100 transition" />
                          </div>
                        )}

                        {/* INLINE EDIT MUSCLE GROUP */}
                        {editingMuscleId === exercise.id ? (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <input
                              type="text"
                              value={exerciseMuscleDraft}
                              onChange={(e) => setExerciseMuscleDraft(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveMuscle(exercise.id)}
                              className="px-1.5 py-0.5 text-[11px] rounded bg-slate-50 dark:bg-slate-950 border border-teal-500 text-slate-700 dark:text-slate-300 focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveMuscle(exercise.id)}
                              className="p-1 rounded bg-teal-500 text-slate-950"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleStartEditMuscle(exercise)}
                            className="flex items-center gap-1 cursor-pointer group"
                            title="Click to inline edit muscle group"
                          >
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium group-hover:text-teal-600 dark:group-hover:text-teal-400">
                              {exercise.muscle}
                            </span>
                            <Edit2 className="w-2.5 h-2.5 text-slate-400 opacity-30 group-hover:opacity-80" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      {/* Manual Rest Button */}
                      <button
                        type="button"
                        onClick={() =>
                          handleStartManualRest(
                            exercise.name,
                            exercise.targetRestSeconds || 90
                          )
                        }
                        className="text-xs font-bold px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 transition"
                        title="Start Rest Timer for this exercise"
                      >
                        <Timer className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Rest ({exercise.targetRestSeconds || 90}s)</span>
                      </button>

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
                    <span className="col-span-4 text-center">TARGET KG</span>
                    <span className="col-span-3 text-center">REPS</span>
                    <span className="col-span-2 text-center">DONE</span>
                    <span className="col-span-1 text-center"></span>
                  </div>

                  {/* Sets Rows with Direct Inline Editing & Delete */}
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

                        <div className="col-span-3 px-1">
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

                        <div className="col-span-1 flex justify-center">
                          <button
                            onClick={() => handleDeleteSet(exercise.id, set.id)}
                            className="text-slate-300 hover:text-rose-500 transition p-1"
                            title="Delete this set"
                            disabled={exercise.sets.length <= 1}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* INLINE ADD CUSTOM MOVEMENT BAR (ZERO POPUPS) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-emerald-500" />
                <span>Add Custom Movement (Inline)</span>
              </span>
              <span className="text-[11px] text-slate-400">Zero popups required</span>
            </div>

            <form onSubmit={handleInlineAddCustomMovement} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                placeholder="Exercise Name (e.g. Incline DB Fly, Nordic Curl)"
                value={inlineExName}
                onChange={(e) => setInlineExName(e.target.value)}
                className="sm:col-span-6 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                placeholder="Target Muscle (e.g. Upper Chest, Hamstrings)"
                value={inlineExMuscle}
                onChange={(e) => setInlineExMuscle(e.target.value)}
                className="sm:col-span-4 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!inlineExName.trim()}
                className="sm:col-span-2 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            {/* QUICK-ADD FROM REGISTERED INVENTORY */}
            {availableInventoryExercises.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  1-Tap Add from Registered Gym Inventory:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {availableInventoryExercises.slice(0, 8).map((ex: EquipmentExerciseDef) => (
                    <button
                      key={ex.id}
                      onClick={() => handleQuickAddFromInventory(ex)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700/60 transition flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3 text-emerald-500" />
                      <span>{ex.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* QUICK-ADD FROM CUSTOM EXERCISES LIBRARY */}
            {customExercises.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    1-Tap Add from Your Custom Movements:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCustomLibraryOpen(true)}
                    className="text-[10px] font-bold text-slate-500 hover:text-emerald-500 underline"
                  >
                    View All ({customExercises.length})
                  </button>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {customExercises.slice(0, 6).map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => handleSelectCustomExerciseFromModal(ex)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-500/30 transition flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3 text-emerald-500" />
                      <span>{ex.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* BIG PROMINENT BOTTOM FINISH WORKOUT BUTTON */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent p-4 rounded-2xl border border-emerald-500/15 shadow-sm">
              <div className="text-center sm:text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-500 animate-spin" />
                  <span>Ready to complete today&apos;s training?</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {completedSetsCount} / {totalSetsCount} sets logged • {totalVolume.toLocaleString()} kg total volume
                </p>
              </div>
              <button
                onClick={handleFinishWorkout}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-95"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Finish Workout &amp; View Summary</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ZERO MOCK EMPTY STATE: User starts their own real session */
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <Play className="w-8 h-8 ml-0.5" />
          </div>

          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              No Active Workout In Progress
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Generate an equipment-calibrated routine above or start a blank live tracker. Every set, rep, and target weight is saved directly to Firestore.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-1">
            <button
              onClick={() => handleGenerateRoutine('full_body')}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Equipment Routine</span>
            </button>
            <button
              onClick={() => {
                const emptySession: WorkoutSession = {
                  routineName: 'Custom Session',
                  startedAt: Date.now(),
                  exercises: [],
                };
                if (currentUser?.uid) {
                  saveActiveWorkout(currentUser.uid, emptySession);
                  saveWorkoutToCollection(currentUser.uid, emptySession);
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Blank Custom Session</span>
            </button>
          </div>
        </div>
      )}
        </div>
      )}

      {/* ================= TAB 2: WORKOUT HISTORY & LOGS ================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Completed Workout History ({(completedList || []).length})
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Real-time Firestore logs with volume and set telemetry
            </p>
          </div>

          {/* Dynamic Training Analytics Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Total Volume
              </p>
              <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                {(completedList || [])
                  .reduce((acc, item) => acc + (Number(item.totalVolumeKg) || 0), 0)
                  .toLocaleString()}{' '}
                <span className="text-xs font-semibold text-slate-400">kg</span>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Sessions
              </p>
              <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {(completedList || []).length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Sets Logged
              </p>
              <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {(completedList || []).reduce(
                  (acc, item) => acc + (Number(item.totalSets) || 0),
                  0
                )}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Avg Duration
              </p>
              <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {(completedList || []).length > 0
                  ? Math.round(
                      (completedList || []).reduce(
                        (acc, item) =>
                          acc +
                          (Number(item.durationMinutes || item.duration_minutes) || 0),
                        0
                      ) / (completedList || []).length
                    )
                  : 0}{' '}
                <span className="text-xs font-semibold text-slate-400">min</span>
              </p>
            </div>
          </div>

          {(completedList || []).length === 0 ? (
            <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
              No completed workouts saved yet. Finish your first workout in the Split &amp; Live tab to record your history!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(completedList || []).map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 transition hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.routineName}
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {formatCompletedDate(item.completedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20">
                        {(item.totalVolumeKg || 0).toLocaleString()} kg
                      </span>
                      <button
                        onClick={() =>
                          handleDeleteCompletedWorkoutLog(item.id, item.routineName)
                        }
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Permanently delete workout log"
                        aria-label="Delete workout log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <span>
                      {(item.exercises || []).length} exercises • {item.totalSets || 0} sets
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />{' '}
                      {item.durationMinutes || item.duration_minutes || 0}m
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: TEMPLATES & MOVEMENT LIBRARY ================= */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* EQUIPMENT-AWARE ROUTINE GENERATOR CARD */}
          <Card3D
            glowColor="emerald"
            intensity={5}
            className="p-5 sm:p-6 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg space-y-4"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20 flex-shrink-0">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Equipment-Aware Routine Generator
                    </h3>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-500/15 text-teal-800 dark:text-teal-400">
                      {userProfile?.experienceLevel ? `${userProfile.experienceLevel.toUpperCase()} Tier` : 'Configured'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {(userProfile?.equipment || []).length > 0
                      ? `Strictly filtered by your ${(userProfile?.equipment || []).length} registered gym machines & platforms.`
                      : 'No equipment registered yet. Minimal bodyweight routines will be generated.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/profile')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1 self-start md:self-auto btn-tactile"
              >
                <span>Modify Gym Inventory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3 Generator Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                onClick={() => {
                  handleGenerateRoutine('full_body');
                  setActiveTab('workout');
                }}
                className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/40 text-left transition group btn-tactile hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    Full Body Maintenance
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500 opacity-60 group-hover:opacity-100" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Balanced push, pull, leg, and core volume mapped to your equipment.
                </p>
              </button>

              <button
                onClick={() => {
                  handleGenerateRoutine('upper');
                  setActiveTab('workout');
                }}
                className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/40 text-left transition group btn-tactile hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    Upper Body Hypertrophy
                  </span>
                  <Dumbbell className="w-3.5 h-3.5 text-teal-500 opacity-60 group-hover:opacity-100" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Chest, back, shoulder, and arm focus strictly using registered machines.
                </p>
              </button>

              <button
                onClick={() => {
                  handleGenerateRoutine('lower');
                  setActiveTab('workout');
                }}
                className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/40 text-left transition group btn-tactile hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    Lower Body &amp; Core
                  </span>
                  <Layers className="w-3.5 h-3.5 text-amber-500 opacity-60 group-hover:opacity-100" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Quadriceps, hamstrings, glute drives, and posterior chain stabilization.
                </p>
              </button>
            </div>
          </Card3D>

          {/* CUSTOM MOVEMENT LIBRARY PROMPT CARD */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Personal Movement Library ({customExercises.length})
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Create, customize, and delete exercises tailored to your exact equipment.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCustomLibraryOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Manage Custom Exercises</span>
            </button>
          </div>

          {/* SAVED WORKOUT TEMPLATES FROM FIRESTORE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Saved Routines Library ({(savedTemplates || []).length})
                </h3>
              </div>
              {activeSession && (
                <button
                  onClick={handleSaveAsTemplate}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 border border-teal-500/20 text-[11px] font-semibold transition flex items-center gap-1 shadow-sm"
                >
                  <BookmarkCheck className="w-3.5 h-3.5 text-teal-500" />
                  <span>Save Active as Template</span>
                </button>
              )}
            </div>

            {(savedTemplates || []).length === 0 ? (
              <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                No saved routine templates yet. Click &quot;Save Active as Template&quot; during an active session to save custom day-by-day routines here!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(savedTemplates || []).map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-2 transition hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {tpl.routineName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {(tpl.exercises || []).length} exercises configured
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          if (currentUser?.uid) {
                            const cloned: WorkoutSession = {
                              routineName: tpl.routineName,
                              startedAt: Date.now(),
                              exercises: (tpl.exercises || []).map((ex, eIdx) => ({
                                ...ex,
                                id: `ex-${Date.now()}-${eIdx}`,
                                sets: (ex.sets || []).map((s, sIdx) => ({
                                  ...s,
                                  id: `s-${Date.now()}-${eIdx}-${sIdx}`,
                                  completed: false,
                                })),
                              })),
                            };
                            saveActiveWorkout(currentUser.uid, cloned);
                            setActiveTab('workout');
                            showToast(`Loaded routine "${tpl.routineName}"!`);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-500/10 hover:bg-teal-100 dark:hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold text-[11px] whitespace-nowrap transition"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDeleteSavedRoutine(tpl.id, tpl.routineName)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Permanently delete routine template"
                        aria-label="Delete routine template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 4: LEAVE LETTERS & REST LOGS ================= */}
      {activeTab === 'leave_requests' && (
        <div className="space-y-6">
          {/* Rest Days Balance & Policy HUD */}
          <Card3D
            glowColor="cyan"
            intensity={4}
            className="p-5 sm:p-6 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20 flex-shrink-0">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Weekly Rest Day Quota &amp; Policy
                    </h3>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        restDayCount >= 1 && restDayCount <= 3
                          ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30'
                          : restDayCount > 3
                          ? 'bg-rose-100 dark:bg-rose-500/15 text-rose-800 dark:text-rose-400 border border-rose-500/30'
                          : 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {restDayCount >= 1 && restDayCount <= 3
                        ? 'Balanced Split'
                        : restDayCount > 3
                        ? 'Quota Exceeded'
                        : 'Under Limit'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    User-selected: Minimum 1 rest day &amp; maximum 3 rest days per week. Zero inbuilt enforcement.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsManualLeaveModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition self-start sm:self-auto active:scale-95 btn-tactile"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Apply for Extra Rest Day</span>
              </button>
            </div>

            {/* Quota Progress Bar (3 Slots) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-amber-500" />
                  <span>Rest Days Balance:</span>
                  <span className="text-slate-900 dark:text-white font-black text-sm">
                    {restDayCount} / 3 Days Used
                  </span>
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  {7 - restDayCount} Training Days Active
                </span>
              </div>

              {/* 3 Visual Quota Slots */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((slot) => {
                  const isFilled = restDayCount >= slot;
                  return (
                    <div
                      key={slot}
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        isFilled
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/30'
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Dynamic Status Alert */}
              {restDayCount === 0 && (
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 pt-1">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    You currently have 0 rest days configured. We strongly recommend selecting at least 1 rest day for optimal muscular recovery!
                  </span>
                </div>
              )}
              {restDayCount >= 1 && restDayCount <= 3 && (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 pt-1">
                  <CalendarCheck className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Optimal training schedule active ({7 - restDayCount} workout days, {restDayCount} recovery days).
                  </span>
                </div>
              )}
              {restDayCount > 3 && (
                <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 pt-1">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>
                    You have selected {restDayCount} rest days (exceeds the 3-day weekly cap). Submit a formal leave application below for AI Coach approval!
                  </span>
                </div>
              )}
            </div>

            {/* Fasting Day Protocol Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent border border-teal-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Fasting Day Protocol
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        isFasting
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {isFasting ? 'ACTIVE TODAY' : 'INACTIVE'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isFasting
                      ? 'Calibrated to Moderate & Light Exercise Protocol (RPE 6–7, lighter dumbbell/machine loads, extended 90s–120s rest, mobility focus).'
                      : 'Standard progressive overload pacing active. Toggle on during Tamil/religious fasting days to adapt intensity.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFasting((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto ${
                  isFasting
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700'
                    : 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-black shadow-md shadow-teal-500/20'
                }`}
              >
                <span>{isFasting ? 'Disable Fasting Mode' : 'Enable Fasting Mode'}</span>
              </button>
            </div>
          </Card3D>

          {/* Submitted Leave Letters Archive */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Submitted Leave Letters &amp; Coach Permissions ({(leaveRequests || []).length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Official accountability logs
              </span>
            </div>

            {(leaveRequests || []).length === 0 ? (
              <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No Leave Letters Submitted
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Your attendance is in peak standing! If you ever need an extra rest day or emergency break, draft a formal application letter here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(leaveRequests || []).map((req) => (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5 relative overflow-hidden transition hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    {/* Top Status & Date */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">
                            {req.dayName} Leave Application
                          </h4>
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              req.status === 'granted'
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : req.status === 'conditional'
                                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {req.status === 'granted' ? 'Official Approval' : req.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Target Date: {req.date}</span>
                          <span className="mx-1">•</span>
                          <span className="capitalize">{req.reasonCategory.replace('_', ' ')}</span>
                        </p>
                      </div>

                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Applicant's Reason Statement */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800/60 text-xs text-slate-700 dark:text-slate-300 italic">
                      &quot;{req.explanation}&quot;
                    </div>

                    {/* Coach Verdict Box */}
                    <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        <Sparkles className="w-3 h-3" />
                        <span>AI Coach Verdict:</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {req.coachVerdict}
                      </p>
                    </div>

                    {/* Accountability Pledge Badge */}
                    {req.pledgeAccepted && (
                      <div className="flex items-center gap-1.5 text-[11px] text-teal-600 dark:text-teal-400 font-semibold pt-1 border-t border-slate-100 dark:border-slate-800/60">
                        <Check className="w-3.5 h-3.5 stroke-[3] text-teal-500" />
                        <span>Accountability Pledge: Tomorrow at 6:00 AM volume will be made up</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DELETABLE CUSTOM MOVEMENT LIBRARY MODAL */}
      {currentUser?.uid && (
        <CustomExerciseLibraryModal
          isOpen={isCustomLibraryOpen}
          onClose={() => setIsCustomLibraryOpen(false)}
          userId={currentUser.uid}
          customExercises={customExercises}
          onSelectExercise={handleSelectCustomExerciseFromModal}
          showToast={showToast}
        />
      )}

      {/* 3D-EFFECT WORKOUT COMPLETION FLASH CARD MODAL */}
      <WorkoutCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={handleCloseCompletionModal}
        metrics={completionMetrics}
        onShareSuccess={showToast}
      />

      {/* FORMAL REST LEAVE REQUEST APPLICATION MODAL */}
      <RestLeaveRequestModal
        isOpen={isManualLeaveModalOpen}
        onClose={() => setIsManualLeaveModalOpen(false)}
        dayName={dailyRoutines[selectedDay]?.dayName || 'Rest Day'}
        dayId={selectedDay}
        userName={currentUser?.displayName || 'Champion'}
        onSubmitLeave={async (req: Omit<RestLeaveRequest, 'id' | 'createdAt'>) => {
          await handleSubmitLeaveRequest(req);
          setIsManualLeaveModalOpen(false);
        }}
        showToast={showToast}
      />

      {/* SMART FLOATING REST TIMER BANNER */}
      <RestTimerBanner
        isActive={isRestTimerActive}
        targetSeconds={restTimerTargetSeconds}
        exerciseName={restTimerExName}
        setNumber={restTimerSetNum}
        onFinish={() => {
          setIsRestTimerActive(false);
          showToast('Rest complete! Ready for next set.');
        }}
        onDismiss={() => setIsRestTimerActive(false)}
      />
    </div>
  );
};

export default Workouts;
