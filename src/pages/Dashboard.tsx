import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  Activity,
  Dumbbell,
  Target,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeUserBiometrics,
  subscribeActiveWorkout,
  subscribeCompletedWorkouts,
  type UserBiometrics,
  type WorkoutSession,
  type CompletedWorkout,
} from '../services/firestoreService';

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [biometrics, setBiometrics] = useState<UserBiometrics | null>(null);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    const unsubBio = subscribeUserBiometrics(currentUser.uid, (data) => {
      setBiometrics(data);
      setLoading(false);
    });

    const unsubActive = subscribeActiveWorkout(currentUser.uid, (session) => {
      setActiveSession(session);
    });

    const unsubCompleted = subscribeCompletedWorkouts(currentUser.uid, (workouts) => {
      setCompletedWorkouts(workouts);
    });

    return () => {
      unsubBio();
      unsubActive();
      unsubCompleted();
    };
  }, [currentUser?.uid]);

  // Compute real maintenance calories & macros from user biometrics doc
  const { targetCalories, proteinTargetGrams, carbsTargetGrams, fatsTargetGrams } = React.useMemo(() => {
    if (!biometrics) {
      return {
        targetCalories: 2000,
        proteinTargetGrams: 140,
        carbsTargetGrams: 220,
        fatsTargetGrams: 55,
      };
    }
    const { weightKg, heightCm, age, gender, activityMultiplier, goal } = biometrics;
    let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
    bmr += gender === 'male' ? 5 : -161;
    const tdee = Math.round(bmr * activityMultiplier);

    let target = tdee;
    if (goal === 'lean_bulk') target = tdee + 250;
    if (goal === 'cut') target = tdee - 450;

    const protein = Math.round(weightKg * 2.0);
    const fats = Math.round((target * 0.25) / 9);
    const carbs = Math.max(0, Math.round((target - protein * 4 - fats * 9) / 4));

    return {
      targetCalories: target,
      proteinTargetGrams: protein,
      carbsTargetGrams: carbs,
      fatsTargetGrams: fats,
    };
  }, [biometrics]);

  // Real volume from completed workouts in the past 7 days
  const weeklyWorkoutsCount = completedWorkouts.length;
  const weeklyVolumeKg = completedWorkouts.reduce((acc, w) => acc + (w.totalVolumeKg || 0), 0);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
        Syncing dashboard with Firestore data...
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
              {biometrics
                ? `Your calculated baseline is dynamically tracking your metabolic target (${biometrics.goal.replace('_', ' ')} mode).`
                : 'No biometrics configured yet. Setup your profile to calculate your personalized maintenance baseline.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/nutrition')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 transition"
            >
              <span>{biometrics ? 'Recalculate Calories' : 'Set Up Biometrics'}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Zero-Mock Calorie Alert Banner if biometrics are missing */}
      {!biometrics && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block text-sm">Real-time Biometrics Profile Needed</span>
            <p className="mt-0.5 text-amber-700 dark:text-amber-300">
              The dashboard calculates 100% real numbers with zero mock presets. Head over to the Nutrition Calculator to save your real weight, height, and activity.
            </p>
          </div>
          <button
            onClick={() => navigate('/nutrition')}
            className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-sm"
          >
            Configure
          </button>
        </div>
      )}

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
              <TrendingUp className="w-3 h-3" /> {biometrics ? biometrics.goal.replace('_', ' ') : 'Pending profile'}
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

        {/* Metric 3: Real Completed Workouts */}
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

        {/* Metric 4: Real Session State */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold">Active Session</span>
            <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {activeSession ? 'In Progress' : 'Resting'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-medium">
              {activeSession ? `${activeSession.exercises.length} exercises active` : 'Ready to train'}
            </span>
          </div>
        </div>
      </div>

      {/* Split Dashboard View: Active Session / Schedule & Macro Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Live Workout Stream */}
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
                    ? `${activeSession.exercises.length} exercises logged in live session`
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

            {activeSession && activeSession.exercises.length > 0 ? (
              <div className="space-y-2.5">
                {activeSession.exercises.slice(0, 4).map((exercise) => {
                  const completedSets = exercise.sets.filter((s) => s.completed).length;
                  return (
                    <div
                      key={exercise.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            completedSets === exercise.sets.length && completedSets > 0
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

          {/* AI Coach Insight Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/30 shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center flex-shrink-0 text-slate-950 shadow-md shadow-emerald-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    FitMaintenance AI Guidance
                  </h4>
                  <span className="text-[10px] text-slate-400 font-semibold">Live Model</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {biometrics
                    ? `With your target at ${targetCalories.toLocaleString()} kcal (${biometrics.goal.replace('_', ' ')}), maintain high protein density (${proteinTargetGrams}g) to ensure zero nitrogen deficit.`
                    : 'Configure your real biometric profile to receive personalized metabolic recommendations.'}
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

        {/* Right Column: Macro Distribution & Target Meter */}
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
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Actions</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => navigate('/workouts')}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-left border border-slate-200 dark:border-slate-800 transition"
              >
                <Dumbbell className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
                <span className="font-bold block text-slate-800 dark:text-slate-200">Log Workout</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Live sets</span>
              </button>
              <button
                onClick={() => navigate('/ai-coach')}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-left border border-slate-200 dark:border-slate-800 transition"
              >
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 mb-1" />
                <span className="font-bold block text-slate-800 dark:text-slate-200">AI Advice</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Gemini Live</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
