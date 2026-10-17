import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  Dumbbell,
  Target,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  Play,
  Wrench,
  Layers,
  Camera,
  Activity,
  Zap,
  ArrowRight,
  Loader2,
  Heart,
  Moon,
  BatteryCharging,
  Timer,
  Bell,
  Video,
  Volume2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeUserBiometrics,
  subscribeUserProfile,
  subscribeActiveWorkout,
  subscribeCompletedWorkouts,
  subscribeNutritionLogs,
  subscribeCheckIns,
  subscribeDailyHydration,
  subscribeDailyActivity,
  subscribeUserStreak,
  subscribeDailyFasting,
  saveDailyFasting,
  applyFastingWorkoutAdjustment,
  getTodayDateString,
  calculateBmbScore,
  applyWorkoutVolumeAdjustment,
  isToday,
  DEFAULT_USER_STREAK,
  DEFAULT_DAILY_FASTING,
  FASTING_CONFIGS,
  type UserBiometrics,
  type UserProfile,
  type WorkoutSession,
  type CompletedWorkout,
  type NutritionLogItem,
  type CheckInItem,
  type DailyHydration,
  type DailyActivity,
  type UserStreak,
  type DailyFastingState,
  type FastingType,
} from '../services/firestoreService';
import WaterIntakeWidget from '../components/hydration/WaterIntakeWidget';
import StepsCounterWidget from '../components/activity/StepsCounterWidget';
import { StreakBadge } from '../components/streak/StreakBadge';
import { DailyFastingCard } from '../components/fasting/DailyFastingCard';
import { FastingBanner } from '../components/fasting/FastingBanner';

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [biometrics, setBiometrics] = useState<UserBiometrics | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLogItem[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInItem[]>([]);
  const [dailyHydration, setDailyHydration] = useState<DailyHydration | null>(null);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity | null>(null);
  const [userStreak, setUserStreak] = useState<UserStreak>(DEFAULT_USER_STREAK);
  const [dailyFasting, setDailyFasting] = useState<DailyFastingState>(DEFAULT_DAILY_FASTING);
  const [loading, setLoading] = useState(true);

  // Fasting Workout & Mode State
  const [isApplyingFastingWorkout, setIsApplyingFastingWorkout] = useState(false);
  const [isChangingFastingMode, setIsChangingFastingMode] = useState(false);

  // Volume Adjustment Action State
  const [isApplyingAdjustment, setIsApplyingAdjustment] = useState(false);
  const [adjustmentApplied, setAdjustmentApplied] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    const unsubBio = subscribeUserBiometrics(currentUser.uid, (data) => {
      setBiometrics(data);
      setLoading(false);
    });

    const unsubProfile = subscribeUserProfile(currentUser.uid, (profile) => {
      setUserProfile(profile);
    });

    const unsubActive = subscribeActiveWorkout(currentUser.uid, (session) => {
      setActiveSession(session);
    });

    const unsubCompleted = subscribeCompletedWorkouts(currentUser.uid, (workouts) => {
      setCompletedWorkouts(workouts);
    });

    const unsubNutrition = subscribeNutritionLogs(currentUser.uid, (logs) => {
      setNutritionLogs(logs);
    });

    const unsubCheckIns = subscribeCheckIns(currentUser.uid, (items) => {
      setCheckIns(items);
    });

    const todayStr = getTodayDateString();
    const unsubHydration = subscribeDailyHydration(currentUser.uid, todayStr, (data) => {
      setDailyHydration(data);
    });

    const unsubActivity = subscribeDailyActivity(currentUser.uid, todayStr, (data) => {
      setDailyActivity(data);
    });

    const unsubStreak = subscribeUserStreak(currentUser.uid, (streakData) => {
      setUserStreak(streakData);
    });

    const unsubFasting = subscribeDailyFasting(currentUser.uid, todayStr, (fastingData) => {
      setDailyFasting(fastingData);
    });

    return () => {
      unsubBio();
      unsubProfile();
      unsubActive();
      unsubCompleted();
      unsubNutrition();
      unsubCheckIns();
      unsubHydration();
      unsubActivity();
      unsubStreak();
      unsubFasting();
    };
  }, [currentUser?.uid]);

  // Compute real maintenance calories & macros from user biometrics / profile doc, adapted to fasting mode
  const { targetCalories, proteinTargetGrams, carbsTargetGrams, fatsTargetGrams } = React.useMemo(() => {
    const weight = userProfile?.currentWeightKg || biometrics?.weightKg;
    const height = userProfile?.heightCm || biometrics?.heightCm;
    const age = userProfile?.age || biometrics?.age;
    const gender = userProfile?.gender || biometrics?.gender;
    const activity = userProfile?.activityMultiplier || biometrics?.activityMultiplier;
    const goal = biometrics?.goal || 'maintain';

    if (!weight || !height || !age || !gender || !activity) {
      return {
        targetCalories: 2000,
        proteinTargetGrams: 140,
        carbsTargetGrams: 220,
        fatsTargetGrams: 55,
      };
    }

    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr += gender === 'male' ? 5 : -161;
    const tdee = Math.round(bmr * activity);

    let target = tdee;
    if (goal === 'lean_bulk') target = tdee + 250;
    if (goal === 'cut') target = tdee - 450;

    // Fasting Adaptation Loop: If fasting is active today, scale targets
    const isFastingActive = Boolean(
      dailyFasting?.isFasting &&
      dailyFasting?.fastingType &&
      dailyFasting.fastingType !== 'none'
    );

    if (isFastingActive && dailyFasting.fastingType) {
      const cfg = FASTING_CONFIGS[dailyFasting.fastingType];
      const adaptedTarget = Math.round(target * cfg.calorieTargetMultiplier);

      if (dailyFasting.fastingType === 'water_only') {
        return {
          targetCalories: 0,
          proteinTargetGrams: 0,
          carbsTargetGrams: 0,
          fatsTargetGrams: 0,
        };
      }

      const pGrams = Math.round((adaptedTarget * (cfg.macroSplit.proteinPct / 100)) / 4);
      const cGrams = Math.round((adaptedTarget * (cfg.macroSplit.carbsPct / 100)) / 4);
      const fGrams = Math.round((adaptedTarget * (cfg.macroSplit.fatsPct / 100)) / 9);

      return {
        targetCalories: adaptedTarget,
        proteinTargetGrams: pGrams,
        carbsTargetGrams: cGrams,
        fatsTargetGrams: fGrams,
      };
    }

    const protein = Math.round(weight * 2.0);
    const fats = Math.round((target * 0.25) / 9);
    const carbs = Math.max(0, Math.round((target - protein * 4 - fats * 9) / 4));

    return {
      targetCalories: target,
      proteinTargetGrams: protein,
      carbsTargetGrams: carbs,
      fatsTargetGrams: fats,
    };
  }, [biometrics, userProfile, dailyFasting]);

  // Real volume from completed workouts in the past 7 days
  const weeklyWorkoutsCount = (completedWorkouts || []).length;
  const weeklyVolumeKg = (completedWorkouts || []).reduce((acc, w) => acc + (w.totalVolumeKg || 0), 0);

  // Today's completed workout duration tracking
  const todayWorkoutMinutes = useMemo(() => {
    const todaysWorkouts = (completedWorkouts || []).filter((w) => isToday(w.completedAt));
    return todaysWorkouts.reduce(
      (sum, w) => sum + (w.durationMinutes || w.duration_minutes || 0),
      0
    );
  }, [completedWorkouts]);

  // Real today's calories from Firestore nutrition_logs (Zero Mock Data)
  const todaysNutritionLogs = useMemo(() => {
    return (nutritionLogs || []).filter((l) => isToday(l.loggedAt));
  }, [nutritionLogs]);

  const todayCalories = useMemo(() => {
    return (todaysNutritionLogs || []).reduce((acc, log) => acc + (log.calories || 0), 0);
  }, [todaysNutritionLogs]);

  // Latest check-in from Firestore
  const latestCheckIn = (checkIns || [])[0] || null;

  // Real Body Maintenance Balance (BMB) Score (5-Pillar Composite)
  const bmbResult = useMemo(() => {
    return calculateBmbScore(
      targetCalories,
      todayCalories,
      latestCheckIn,
      completedWorkouts || [],
      dailyHydration?.waterMl || 0,
      dailyHydration?.targetMl || 3000,
      dailyActivity?.steps || 0,
      dailyActivity?.goalSteps || 10000,
      dailyFasting
    );
  }, [
    targetCalories,
    todayCalories,
    latestCheckIn,
    completedWorkouts,
    dailyHydration?.waterMl,
    dailyHydration?.targetMl,
    dailyActivity?.steps,
    dailyActivity?.goalSteps,
    dailyFasting,
  ]);

  // Fasting Selection Handler
  const handleSelectFasting = async (type: FastingType, notes = '') => {
    if (!currentUser?.uid) return;
    try {
      const todayStr = getTodayDateString();
      await saveDailyFasting(currentUser.uid, todayStr, type, notes);
      setIsChangingFastingMode(false);
    } catch (err) {
      console.error('Failed to save fasting selection:', err);
    }
  };

  // Fasting Recovery Workout Handler
  const handleApplyFastingWorkout = async () => {
    if (!currentUser?.uid || !dailyFasting?.fastingType) return;
    setIsApplyingFastingWorkout(true);
    try {
      await applyFastingWorkoutAdjustment(
        currentUser.uid,
        dailyFasting.fastingType,
        userProfile?.equipment || []
      );
      navigate('/workouts');
    } catch (err) {
      console.error('Failed to apply fasting workout:', err);
    } finally {
      setIsApplyingFastingWorkout(false);
    }
  };

  // Handle Reactive Workout Volume Adjustment
  const handleApplyAdjustment = async () => {
    if (!currentUser?.uid) return;
    setIsApplyingAdjustment(true);
    try {
      await applyWorkoutVolumeAdjustment(
        currentUser.uid,
        bmbResult.suggestedAdjustment.setsDelta,
        userProfile?.equipment || [],
        userProfile?.experienceLevel || 'intermediate'
      );
      setAdjustmentApplied(true);
      setTimeout(() => setAdjustmentApplied(false), 6000);
    } catch (err) {
      console.error('Failed to apply volume adjustment:', err);
    } finally {
      setIsApplyingAdjustment(false);
    }
  };

  const dialStrokeColor =
    bmbResult.status === 'optimal'
      ? 'text-emerald-500'
      : bmbResult.status === 'stable'
      ? 'text-teal-500'
      : bmbResult.status === 'surplus' || bmbResult.status === 'deficit'
      ? 'text-amber-500'
      : 'text-rose-500';

  const statusBadgeClass =
    bmbResult.status === 'optimal'
      ? 'bg-emerald-100 dark:bg-emerald-500/15 border-emerald-500/30 text-emerald-800 dark:text-emerald-400'
      : bmbResult.status === 'stable'
      ? 'bg-teal-100 dark:bg-teal-500/15 border-teal-500/30 text-teal-800 dark:text-teal-400'
      : bmbResult.status === 'surplus' || bmbResult.status === 'deficit'
      ? 'bg-amber-100 dark:bg-amber-500/15 border-amber-500/30 text-amber-800 dark:text-amber-400'
      : 'bg-rose-100 dark:bg-rose-500/15 border-rose-500/30 text-rose-800 dark:text-rose-400';

  // Defensive Guard Clause: Return clean loading spinner if userData or currentUser is loading/null
  if (loading || !currentUser) {
    return (
      <div className="min-h-[450px] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-4 shadow-sm">
          <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Loading Athlete Dashboard...
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Connecting to Cloud Firestore and aggregating real-time balance metrics...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/15 via-white dark:via-slate-900 to-white dark:to-slate-900 border border-emerald-500/30 p-6 md:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-400 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time Firestore Sync Active</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome, {currentUser?.displayName?.split(' ')[0] || 'Athlete'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
              {userProfile?.equipment?.length
                ? `Tuned for ${userProfile.experienceLevel ? userProfile.experienceLevel.toUpperCase() : 'INTERMEDIATE'} training intensity with ${userProfile.equipment.length} registered gym machines.`
                : 'Track your real-time nutrition balance, maintenance calories, and equipment workouts.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/profile')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 transition"
            >
              <span>Edit Inventory & Profile</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Streak Maintenance & Consistency Engine Badge */}
      <StreakBadge
        streak={userStreak}
        todayCompleted={
          todayCalories > 0 ||
          (completedWorkouts || []).some((w) => isToday(w.completedAt)) ||
          (checkIns || []).some((c) => isToday(c.date) || isToday(c.createdAt)) ||
          Boolean(dailyFasting.isFasting && dailyFasting.fastingType !== 'none')
        }
        completedGoals={{
          meal: todayCalories > 0,
          workout: (completedWorkouts || []).some((w) => isToday(w.completedAt)),
          checkin: (checkIns || []).some((c) => isToday(c.date) || isToday(c.createdAt)),
        }}
      />

      {/* Daily Fasting Mode & AI Adaptation Engine */}
      {dailyFasting.isFasting && dailyFasting.fastingType !== 'none' && !isChangingFastingMode ? (
        <FastingBanner
          fastingState={dailyFasting}
          onApplyFastingWorkout={handleApplyFastingWorkout}
          onChangeFastingMode={() => setIsChangingFastingMode(true)}
          isApplyingWorkout={isApplyingFastingWorkout}
        />
      ) : (
        <DailyFastingCard
          currentFasting={dailyFasting}
          onSelectFasting={handleSelectFasting}
        />
      )}

      {/* Heavy-Sleeper Max-Volume Alarm & Dual-Language Voice Briefing Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-emerald-500/10 border border-amber-300 dark:border-amber-500/30 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">
                  Heavy-Sleeper Protocol
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                  Dual-Language: English ➔ தமிழ்
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                6:00 AM Max-Volume Alarm & Oral Briefing
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
                Plays Tibetan singing bowl or selected video song at max volume (100%), followed by 5-pillar English & Tamil speech briefing and continuous devotional audio (கந்த சஷ்டி கவசம் & சிவபுராணம்).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Configure personalized daily routine schedule (Wake-up, Walking, Workout, Bedtime)"
            >
              <Clock className="w-4 h-4 text-emerald-500" />
              <span>Routine Timings</span>
            </button>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('TRIGGER_TEST_ROUTINE', { detail: { routineType: 'walking' } }))}
              className="py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Test natural personalized voice reminder"
            >
              <Volume2 className="w-4 h-4 text-teal-500" />
              <span>Test Voice Alert</span>
            </button>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('OPEN_ALARM_SETTINGS'))}
              className="py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Select custom video songs and adjust wake-up time"
            >
              <Video className="w-4 h-4 text-emerald-500" />
              <span>Alarm & Songs</span>
            </button>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('TRIGGER_TEST_ALARM'))}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 transition transform active:scale-95"
              title="Test the complete alarm, speech briefing, and devotional playback sequence"
            >
              <Bell className="w-4 h-4 fill-current" />
              <span>TEST ALARM & BRIEFING</span>
            </button>
          </div>
        </div>
      </div>

      {/* Central Body Maintenance Balance (BMB) Score Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Dial & Meta */}
          <div className="flex items-center gap-5 sm:gap-6">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-100 dark:text-slate-800"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={264}
                  strokeDashoffset={264 - (264 * bmbResult.score) / 100}
                  strokeLinecap="round"
                  className={`${dialStrokeColor} transition-all duration-1000 ease-out`}
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                  {bmbResult.score}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  BMB Score
                </span>
              </div>
            </div>

            <div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-2 ${statusBadgeClass}`}>
                <Activity className="w-3.5 h-3.5" />
                <span>{bmbResult.statusLabel}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Body Maintenance Balance
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md leading-relaxed">
                {bmbResult.recommendation}
              </p>
            </div>
          </div>

          {/* Right: Real-time 5-Pillar Composite Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 w-full lg:w-auto">
            {/* Pillar 1: Caloric Alignment */}
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Calories
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white block mt-1">
                {todayCalories} / {targetCalories}
              </span>
              <span className={`text-[11px] font-semibold block mt-0.5 ${
                Math.abs(bmbResult.calorieDeviationPct) > 15 ? 'text-amber-500' : 'text-emerald-500'
              }`}>
                {todayCalories === 0
                  ? 'Pending Meals'
                  : bmbResult.calorieDeviationPct > 0
                  ? `+${bmbResult.calorieDeviationPct}%`
                  : `${bmbResult.calorieDeviationPct}%`}
              </span>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                {bmbResult.breakdown.calorieScore} / 35 pts
              </span>
            </div>

            {/* Pillar 2: Recovery / Readiness */}
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Readiness
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white block mt-1">
                {latestCheckIn ? `${latestCheckIn.fatigueRating} / 5` : 'N/A'}
              </span>
              <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 block mt-0.5">
                {latestCheckIn
                  ? latestCheckIn.fatigueRating >= 4
                    ? 'High Ready'
                    : latestCheckIn.fatigueRating >= 3
                    ? 'Moderate'
                    : 'Fatigued'
                  : 'Check-In Due'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                {bmbResult.breakdown.recoveryScore} / 25 pts
              </span>
            </div>

            {/* Pillar 3: Volume Stimulus */}
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Workouts
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white block mt-1">
                {weeklyWorkoutsCount} sessions
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                {weeklyVolumeKg > 0 ? `${(weeklyVolumeKg / 1000).toFixed(1)}t load` : '0 kg'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                {bmbResult.breakdown.consistencyScore} / 20 pts
              </span>
            </div>

            {/* Pillar 4: Hydration */}
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Hydration
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white block mt-1">
                {((dailyHydration?.waterMl || 0) / 1000).toFixed(1)}L
              </span>
              <span className="text-[11px] font-semibold text-blue-500 block mt-0.5">
                {dailyHydration && dailyHydration.waterMl >= dailyHydration.targetMl
                  ? 'Target Hit!'
                  : `${Math.round(((dailyHydration?.waterMl || 0) / (dailyHydration?.targetMl || 3000)) * 100)}%`}
              </span>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                {bmbResult.breakdown.hydrationScore} / 10 pts
              </span>
            </div>

            {/* Pillar 5: Daily Activity (Steps) */}
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Steps
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white block mt-1">
                {(dailyActivity?.steps || 0).toLocaleString()}
              </span>
              <span className="text-[11px] font-semibold text-emerald-500 block mt-0.5">
                {dailyActivity && dailyActivity.steps >= dailyActivity.goalSteps
                  ? 'Goal Hit!'
                  : `${Math.round(((dailyActivity?.steps || 0) / (dailyActivity?.goalSteps || 10000)) * 100)}%`}
              </span>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                {bmbResult.breakdown.activityScore} / 10 pts
              </span>
            </div>
          </div>
        </div>

        {/* REACTIVE ALERT BANNER (>15% Calorie Deviation or Fatigue Alert) */}
        {(bmbResult.suggestedAdjustment.type !== 'none' ||
          bmbResult.status === 'surplus' ||
          bmbResult.status === 'deficit') && (
          <div
            className={`mt-6 p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
              bmbResult.status === 'surplus'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
                : bmbResult.status === 'deficit'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  bmbResult.status === 'surplus' || bmbResult.status === 'deficit'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-rose-500 text-white shadow-sm'
                }`}
              >
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300">
                    {bmbResult.suggestedAdjustment.badgeTitle}
                  </span>
                  <span className="text-xs font-bold">
                    {bmbResult.calorieDeviationPct > 0
                      ? `+${bmbResult.calorieDeviationPct}% deviation from maintenance`
                      : `${bmbResult.calorieDeviationPct}% deviation from maintenance`}
                  </span>
                </div>
                <p className="text-xs sm:text-sm mt-1.5 leading-relaxed text-slate-700 dark:text-slate-300">
                  {bmbResult.suggestedAdjustment.message}
                </p>
              </div>
            </div>

            <div className="flex-shrink-0 flex items-center gap-2">
              {adjustmentApplied ? (
                <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold shadow">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Volume Adjusted!</span>
                  <button
                    onClick={() => navigate('/workouts')}
                    className="underline ml-1 hover:opacity-80"
                  >
                    Open Session
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleApplyAdjustment}
                  disabled={isApplyingAdjustment}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition ${
                    bmbResult.status === 'surplus' || bmbResult.status === 'deficit'
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                      : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                  }`}
                >
                  <span>
                    {isApplyingAdjustment
                      ? 'Adjusting Volume in Firestore...'
                      : bmbResult.suggestedAdjustment.actionLabel}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Real Dynamic Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Real Target Maintenance Calories with warm amber alerts */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold">Daily Calorie Target</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Flame className="w-4 h-4 fill-current" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {targetCalories.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">kcal/day</span>
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1 font-semibold">
              <TrendingUp className="w-3 h-3" /> {biometrics ? biometrics.goal.replace('_', ' ') : 'Mifflin-St Jeor'}
            </span>
          </div>
        </div>

        {/* Metric 2: Real Protein Target */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold">Protein Target</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {proteinTargetGrams}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">grams</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-medium">
              2.0g per kg bodyweight
            </span>
          </div>
        </div>

        {/* Metric 3: Machine Inventory Count */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold">Gym Machines</span>
            <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {userProfile?.equipment ? userProfile.equipment.length : 0}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">available</span>
            </div>
            <span className="text-[11px] text-teal-600 dark:text-teal-400 mt-1 block font-semibold">
              {userProfile?.experienceLevel ? `${userProfile.experienceLevel.toUpperCase()} Tier` : 'Configuring...'}
            </span>
          </div>
        </div>

        {/* Metric 4: Completed Workouts */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold">Completed Sessions</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {weeklyWorkoutsCount}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">total</span>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block font-semibold">
              {weeklyVolumeKg > 0 ? `${weeklyVolumeKg.toLocaleString()} kg moved` : 'Awaiting first session'}
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Hydration & Steps Counter Engine */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <WaterIntakeWidget />
        <StepsCounterWidget />
      </div>

      {/* Real-time Vitals & Recovery Monitoring Bar */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-rose-500/20 flex-shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Vitals & Recovery Monitoring
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/15 text-indigo-800 dark:text-indigo-400">
                  Daily Check-In Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Central nervous system recovery, sleep duration, resting heart rate, and training time.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkin')}
            className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
            <span>{latestCheckIn ? 'Update Check-In' : 'Log Morning Check-In'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {/* Workout Training Duration Today */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider">Workout Time</span>
              <Timer className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {todayWorkoutMinutes > 0 ? `${todayWorkoutMinutes} mins` : activeSession ? 'In Progress' : '0 mins'}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 block">
              {todayWorkoutMinutes > 0 ? 'Logged to Firestore' : activeSession ? 'Timer Active' : 'No workout yet'}
            </span>
          </div>

          {/* Resting Heart Rate */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider">Resting HR</span>
              <Heart className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {latestCheckIn?.restingHeartRateBpm ? `${latestCheckIn.restingHeartRateBpm} BPM` : 'Unlogged'}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 block">
              {latestCheckIn?.restingHeartRateBpm
                ? latestCheckIn.restingHeartRateBpm <= 65
                  ? 'Excellent Baseline'
                  : 'Normal Baseline'
                : '1-tap check-in'}
            </span>
          </div>

          {/* Sleep Duration */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider">Sleep Hours</span>
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {latestCheckIn?.sleepHours ? `${latestCheckIn.sleepHours} hrs` : 'Unlogged'}
            </div>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5 block">
              {latestCheckIn?.sleepHours
                ? latestCheckIn.sleepHours >= 7
                  ? 'Optimal Recovery'
                  : 'Sleep Debt Noted'
                : 'Target: 7-9 hrs'}
            </span>
          </div>

          {/* Energy / Fatigue Readiness */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider">Energy Level</span>
              <BatteryCharging className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase">
              {latestCheckIn?.energyLevel || (latestCheckIn ? `Rating ${latestCheckIn.fatigueRating}/5` : 'Pending')}
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 block">
              {latestCheckIn ? 'Autoregulated' : 'Log morning check-in'}
            </span>
          </div>
        </div>
      </div>

      {/* Split Dashboard View: Active Session / Schedule & Macro Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Live Workout Stream & Routine Summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {activeSession ? `Active: ${activeSession.routineName}` : 'Workout Hub'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeSession
                    ? `${(activeSession.exercises || []).length} exercises logged in live session`
                    : 'No active session currently running.'}
                </p>
              </div>
              <button
                onClick={() => navigate('/workouts')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1 transition"
              >
                <span>{activeSession ? 'Open Logger' : 'Start Session'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeSession && (activeSession.exercises || []).length > 0 ? (
              <div className="space-y-2.5">
                {(activeSession.exercises || []).slice(0, 4).map((exercise) => {
                  const completedSets = (exercise.sets || []).filter((s) => s.completed).length;
                  const totalSets = (exercise.sets || []).length;
                  return (
                    <div
                      key={exercise.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            completedSets === totalSets && completedSets > 0
                              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10'
                              : 'text-slate-400 bg-slate-200 dark:bg-slate-800'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {exercise.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {completedSets} / {exercise.sets.length} sets completed • {exercise.muscle}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                <Dumbbell className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto opacity-70" />
                <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                  Zero pre-filled mock workouts.
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Start an empty workout in the Workouts tab to log your live sets, exercises, and volume!
                </p>
                <button
                  onClick={() => navigate('/workouts')}
                  className="mt-2 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Live Workout</span>
                </button>
              </div>
            )}
          </div>

          {/* AI Coach Insight Card with Experience Tier */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/30 shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center flex-shrink-0 text-slate-950 shadow-md shadow-emerald-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    FitMaintenance AI Guidance ({userProfile?.experienceLevel ? userProfile.experienceLevel.toUpperCase() : 'ATHLETE'})
                  </h4>
                  <span className="text-[10px] text-slate-400 font-semibold">Gemini Live</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {userProfile?.calculatedTdee
                    ? `Your maintenance baseline is locked at ${userProfile.calculatedTdee.toLocaleString()} kcal. Your AI Coach is configured for ${userProfile.experienceLevel} progression using your ${userProfile.equipment?.length || 0} registered gym machines.`
                    : 'Set up your biometric profile to enable tailored metabolic and exercise recommendations.'}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => navigate('/ai-coach')}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 transition"
                  >
                    Ask Gemini Coach
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Macro Distribution & Equipment Quick View */}
        <div className="space-y-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Live Macro Target Breakdown
            </h3>

            {/* Macro Bars */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Protein (Target)</span>
                  <span className="text-rose-600 dark:text-rose-400">{proteinTargetGrams}g</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-800">
                  <div className="bg-rose-500 h-full rounded-full w-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Carbohydrates (Target)</span>
                  <span className="text-amber-600 dark:text-amber-400">{carbsTargetGrams}g</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-800">
                  <div className="bg-amber-500 h-full rounded-full w-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Fats (Target)</span>
                  <span className="text-teal-600 dark:text-teal-400">{fatsTargetGrams}g</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-800">
                  <div className="bg-teal-500 h-full rounded-full w-full" />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5" /> Real-time Firestore Sync
              </span>
              <button
                onClick={() => navigate('/nutrition')}
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-bold"
              >
                Adjust Intake
              </button>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Inventory & Config</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => navigate('/checkin')}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-left border border-slate-200 dark:border-slate-800 transition"
              >
                <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
                <span className="font-bold block text-slate-800 dark:text-slate-200">Check-In</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Ghost Cam
                </span>
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-left border border-slate-200 dark:border-slate-800 transition"
              >
                <Wrench className="w-4 h-4 text-teal-600 dark:text-teal-400 mb-1" />
                <span className="font-bold block text-slate-800 dark:text-slate-200">Machines</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {userProfile?.equipment ? `${userProfile.equipment.length} tools` : 'Setup'}
                </span>
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-left border border-slate-200 dark:border-slate-800 transition"
              >
                <Layers className="w-4 h-4 text-amber-500 mb-1" />
                <span className="font-bold block text-slate-800 dark:text-slate-200">Tier</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                  {userProfile?.experienceLevel || 'Beginner'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
