import React, { useState, useEffect, useMemo } from 'react';
import {
  Camera,
  Calendar,
  Scale,
  Activity,
  Flame,
  Trophy,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Maximize2,
  Footprints,
  Anchor,
  Shield,
  Heart,
  Moon,
  BatteryCharging,
  Droplets,
  Sun,
  Apple,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeCheckIns,
  addCheckIn,
  deleteCheckIn,
  subscribeRewards,
  evaluateAndUnlockBadges,
  subscribeUserProfile,
  logDailySteps,
  subscribeDailyHydration,
  logWaterIntake,
  subscribeDailyActivity,
  subscribeUserStreak,
  recordStreakActivity,
  subscribeDailyFasting,
  saveDailyFasting,
  calculateBmbScore,
  getTodayDateString,
  BADGE_DEFINITIONS,
  DEFAULT_USER_STREAK,
  DEFAULT_DAILY_FASTING,
  FASTING_CONFIGS,
  type CheckInItem,
  type UserReward,
  type UserProfile,
  type AiPhysiqueAnalysis,
  type UserStreak,
  type DailyHydration,
  type DailyActivity,
  type DailyFastingState,
  type FastingType,
} from '../services/firestoreService';
import { uploadCheckInPhoto } from '../services/storageService';
import {
  fileToBase64,
  analyzePhysiqueImage,
  isGeminiConfigured,
  compressImage,
  type Base64ImagePart,
} from '../services/geminiService';
import GhostOverlayCamera from '../components/camera/GhostOverlayCamera';
import BadgeUnlockModal from '../components/rewards/BadgeUnlockModal';
import { StreakBadge } from '../components/streak/StreakBadge';

type CheckInTab = 'checkin' | 'end_of_day' | 'gallery' | 'rewards';

export const CheckIn: React.FC = () => {
  const { currentUser } = useAuth();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<CheckInTab>('checkin');

  // Firestore Subscriptions (Zero-Mock Data)
  const [checkIns, setCheckIns] = useState<CheckInItem[]>([]);
  const [rewards, setRewards] = useState<UserReward[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStreak, setUserStreak] = useState<UserStreak>(DEFAULT_USER_STREAK);
  const [dailyFasting, setDailyFasting] = useState<DailyFastingState>(DEFAULT_DAILY_FASTING);
  const [dailyHydration, setDailyHydration] = useState<DailyHydration | null>(null);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Morning Check-In Form State
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInDate, setCheckInDate] = useState<string>(getTodayDateString());
  const [morningWeight, setMorningWeight] = useState<number>(70);
  const [fatigueRating, setFatigueRating] = useState<number>(4); // 1-5
  const [sorenessNotes, setSorenessNotes] = useState<string>('');
  const [restingHeartRate, setRestingHeartRate] = useState<number | ''>(68);
  const [sleepHours, setSleepHours] = useState<number | ''>(7.5);
  const [energyLevel, setEnergyLevel] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [observingFast, setObservingFast] = useState<FastingType>('none');
  const [fastingNotes, setFastingNotes] = useState<string>('');
  const [checkInPhotoBlob, setCheckInPhotoBlob] = useState<Blob | File | null>(null);
  const [checkInPhotoPreview, setCheckInPhotoPreview] = useState<string | null>(null);
  const [runAiAnalysis, setRunAiAnalysis] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // End-of-Day Review & Steps Form State
  const [endOfDayDate, setEndOfDayDate] = useState<string>(getTodayDateString());
  const [endOfDaySteps, setEndOfDaySteps] = useState<number>(8500);
  const [endOfDayEnergy, setEndOfDayEnergy] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [endOfDayNotes, setEndOfDayNotes] = useState<string>('');
  const [isSavingEndOfDay, setIsSavingEndOfDay] = useState(false);
  const [endOfDaySuccess, setEndOfDaySuccess] = useState<string | null>(null);

  // Unlock Animation Modal State
  const [newlyUnlockedBadges, setNewlyUnlockedBadges] = useState<UserReward[]>([]);

  // Transformation Gallery State
  const [beforeCheckInId, setBeforeCheckInId] = useState<string>('');
  const [afterCheckInId, setAfterCheckInId] = useState<string>('');
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 - 100
  const [selectedCheckInForModal, setSelectedCheckInForModal] = useState<CheckInItem | null>(null);

  // Subscribe to real-time data
  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    const unsubCheckIns = subscribeCheckIns(currentUser.uid, (items) => {
      setCheckIns(items);
      setLoading(false);
      if (items.length > 0) {
        if (!beforeCheckInId) setBeforeCheckInId(items[items.length - 1].id);
        if (!afterCheckInId) setAfterCheckInId(items[0].id);
        setMorningWeight(items[0].weightKg);
      }
    });

    const unsubRewards = subscribeRewards(currentUser.uid, (rew) => {
      setRewards(rew);
    });

    const unsubProfile = subscribeUserProfile(currentUser.uid, (prof) => {
      setUserProfile(prof);
      if (prof?.currentWeightKg && checkIns.length === 0) {
        setMorningWeight(prof.currentWeightKg);
      }
    });

    const unsubStreak = subscribeUserStreak(currentUser.uid, (streakData) => {
      setUserStreak(streakData);
    });

    const todayStr = getTodayDateString();
    const unsubFasting = subscribeDailyFasting(currentUser.uid, todayStr, (fastState) => {
      setDailyFasting(fastState);
      if (fastState?.isFasting && fastState?.fastingType) {
        setObservingFast(fastState.fastingType);
        setFastingNotes(fastState.fastingNotes || '');
      }
    });

    const unsubHydration = subscribeDailyHydration(currentUser.uid, todayStr, (hyd) => {
      setDailyHydration(hyd);
    });

    const unsubActivity = subscribeDailyActivity(currentUser.uid, todayStr, (act) => {
      setDailyActivity(act);
      if (act?.steps) {
        setEndOfDaySteps(act.steps);
      }
    });

    return () => {
      unsubCheckIns();
      unsubRewards();
      unsubProfile();
      unsubStreak();
      unsubFasting();
      unsubHydration();
      unsubActivity();
    };
  }, [currentUser?.uid]);

  // Handle Photo Capture from Ghost Overlay Camera
  const handlePhotoCaptured = (blob: Blob) => {
    setCheckInPhotoBlob(blob);
    setCheckInPhotoPreview(URL.createObjectURL(blob));
    setShowCamera(false);
  };

  // Submit Morning Check-In (with client-side image compression & timeout-safe AI analysis)
  const handleSubmitCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid) return;

    if (!checkInPhotoBlob) {
      alert('Please capture or upload a check-in progress photo.');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('Compressing photo for fast analysis...');

    try {
      // 1. Client-Side Image Compression: downscale to max 800px width (~150KB)
      let compressedFile: File;
      let compressedBase64: Base64ImagePart | null = null;
      try {
        const compressed = await compressImage(checkInPhotoBlob, 800, 0.82);
        compressedFile = compressed.file;
        compressedBase64 = compressed.base64Part;
      } catch (compErr) {
        console.warn('Canvas compression fallback to original photo:', compErr);
        compressedFile =
          checkInPhotoBlob instanceof File
            ? checkInPhotoBlob
            : new File([checkInPhotoBlob], 'checkin.jpg', { type: 'image/jpeg' });
      }

      // 2. Upload photo to Firebase Storage
      setStatusMessage('Uploading photo to storage...');
      const photoUrl = await uploadCheckInPhoto(
        currentUser.uid,
        compressedFile,
        `${checkInDate}_checkin.jpg`
      );

      // 3. AI Body Type & Physique Analysis via Gemini AI Vision
      let aiAnalysisResult: AiPhysiqueAnalysis | undefined = undefined;
      if (runAiAnalysis && isGeminiConfigured) {
        try {
          setStatusMessage('Analyzing symmetry & posture with Gemini AI...');
          const base64Part = compressedBase64 || (await fileToBase64(compressedFile));

          aiAnalysisResult = await analyzePhysiqueImage(
            base64Part,
            morningWeight,
            userProfile?.experienceLevel || 'intermediate'
          );
        } catch (aiErr) {
          console.warn('AI Physique analysis encountered an issue (graceful fallback):', aiErr);
        }
      }

      // 4. Save to Firestore (users/{userId}/checkins/{date})
      setStatusMessage('Saving check-in to Firestore...');
      await addCheckIn(currentUser.uid, {
        date: checkInDate,
        weightKg: Number(morningWeight),
        fatigueRating: Number(fatigueRating),
        sorenessNotes: sorenessNotes.trim(),
        photoUrl,
        aiPhysiqueAnalysis: aiAnalysisResult,
        restingHeartRateBpm: restingHeartRate !== '' ? Number(restingHeartRate) : undefined,
        sleepHours: sleepHours !== '' ? Number(sleepHours) : undefined,
        energyLevel,
        isFasting: observingFast !== 'none',
        fastingType: observingFast,
        fastingNotes: fastingNotes.trim(),
      });

      // Also record fasting if fast was selected
      if (observingFast !== 'none') {
        await saveDailyFasting(currentUser.uid, checkInDate, observingFast, fastingNotes);
      }

      // Automatically maintain / record consistency streak
      const updatedStreak = await recordStreakActivity(currentUser.uid, 'checkin', checkInDate);
      setUserStreak(updatedStreak);

      // 5. Automatically Evaluate & Unlock Gamified Badges
      const updatedCheckIns: CheckInItem[] = [
        {
          id: 'temp',
          date: checkInDate,
          weightKg: Number(morningWeight),
          fatigueRating: Number(fatigueRating),
          photoUrl,
          aiPhysiqueAnalysis: aiAnalysisResult,
          restingHeartRateBpm: restingHeartRate !== '' ? Number(restingHeartRate) : undefined,
          sleepHours: sleepHours !== '' ? Number(sleepHours) : undefined,
          energyLevel,
          isFasting: observingFast !== 'none',
          fastingType: observingFast,
          fastingNotes: fastingNotes.trim(),
        },
        ...checkIns,
      ];

      const unlocked = await evaluateAndUnlockBadges(
        currentUser.uid,
        updatedCheckIns,
        rewards,
        userProfile?.targetWeightKg
      );

      // Reset modal state
      setShowCheckInModal(false);
      setCheckInPhotoBlob(null);
      setCheckInPhotoPreview(null);
      setSorenessNotes('');

      // Show celebratory reward unlock if any
      if (unlocked.length > 0) {
        setNewlyUnlockedBadges(unlocked);
      }

      setStatusMessage('Morning check-in logged & streak updated!');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('Failed to submit check-in:', err);
      alert('Failed to save check-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit End-of-Day Daily Summary & Steps Log
  const handleSaveEndOfDay = async () => {
    if (!currentUser?.uid) return;
    setIsSavingEndOfDay(true);
    try {
      // 1. Sync steps to activity collection
      await logDailySteps(currentUser.uid, endOfDayDate, Number(endOfDaySteps));

      // 2. Update checkin doc for today with steps & evening reflection
      await addCheckIn(currentUser.uid, {
        date: endOfDayDate,
        steps: Number(endOfDaySteps),
        energyLevel: endOfDayEnergy,
        sorenessNotes: endOfDayNotes ? `[Evening Review] ${endOfDayNotes}` : undefined,
      });

      // 3. Record streak activity
      const updatedStreak = await recordStreakActivity(currentUser.uid, 'checkin', endOfDayDate);
      setUserStreak(updatedStreak);

      // 4. Evaluate badges
      const unlocked = await evaluateAndUnlockBadges(
        currentUser.uid,
        checkIns,
        rewards,
        userProfile?.targetWeightKg
      );
      if (unlocked.length > 0) {
        setNewlyUnlockedBadges(unlocked);
      }

      setEndOfDaySuccess('End-of-day summary & steps saved! Consistency streak protected.');
      setTimeout(() => setEndOfDaySuccess(null), 4000);
    } catch (err) {
      console.error('Failed to save end-of-day review:', err);
      alert('Could not save end-of-day review. Please try again.');
    } finally {
      setIsSavingEndOfDay(false);
    }
  };

  // Quick hydration logger helper inside End-of-Day
  const handleAddWaterQuick = async (amountMl: number) => {
    if (!currentUser?.uid) return;
    try {
      await logWaterIntake(currentUser.uid, endOfDayDate, amountMl);
    } catch (err) {
      console.error('Failed to add water in review:', err);
    }
  };

  const handleDeleteCheckIn = async (id: string) => {
    if (!currentUser?.uid || !id) return;
    if (confirm('Are you sure you want to delete this check-in entry?')) {
      await deleteCheckIn(currentUser.uid, id);
    }
  };

  // Selected Before & After Check-Ins for Comparison
  const beforeCheckIn = useMemo(() => {
    return checkIns.find((c) => c.id === beforeCheckInId) || checkIns[checkIns.length - 1];
  }, [checkIns, beforeCheckInId]);

  const afterCheckIn = useMemo(() => {
    return checkIns.find((c) => c.id === afterCheckInId) || checkIns[0];
  }, [checkIns, afterCheckInId]);

  const weightDelta = useMemo(() => {
    if (!beforeCheckIn || !afterCheckIn) return 0;
    return Number((afterCheckIn.weightKg - beforeCheckIn.weightKg).toFixed(1));
  }, [beforeCheckIn, afterCheckIn]);

  const fatigueLabels: Record<number, { label: string; color: string }> = {
    1: { label: 'Exhausted / High Soreness', color: 'text-rose-500' },
    2: { label: 'Fatigued / Tight Joints', color: 'text-orange-500' },
    3: { label: 'Moderate / Ready for Standard Sets', color: 'text-amber-500' },
    4: { label: 'Fresh / High Neural Drive', color: 'text-emerald-400' },
    5: { label: 'Peak Readiness / PR Attempt Mode', color: 'text-emerald-500' },
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-5 h-5 text-amber-500" />;
      case 'Footprints':
        return <Footprints className="w-5 h-5 text-emerald-500" />;
      case 'Anchor':
        return <Anchor className="w-5 h-5 text-teal-500" />;
      case 'Camera':
        return <Camera className="w-5 h-5 text-indigo-500" />;
      case 'Shield':
        return <Shield className="w-5 h-5 text-purple-500" />;
      case 'Trophy':
      default:
        return <Trophy className="w-5 h-5 text-amber-500" />;
    }
  };

  // Computed live maintenance targets for End-of-Day review
  const dailyTargetCalories = useMemo(() => {
    const weight = userProfile?.currentWeightKg || morningWeight || 70;
    const height = userProfile?.heightCm || 175;
    const age = userProfile?.age || 25;
    const gender = userProfile?.gender || 'male';
    const activity = userProfile?.activityMultiplier || 1.375;
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr += gender === 'male' ? 5 : -161;
    return Math.round(bmr * activity);
  }, [userProfile, morningWeight]);

  // Live BMB Score preview for End-of-Day
  const endOfDayBmb = useMemo(() => {
    return calculateBmbScore(
      dailyTargetCalories,
      dailyTargetCalories,
      checkIns[0] || null,
      [],
      dailyHydration?.waterMl || 0,
      dailyHydration?.targetMl || 3000,
      endOfDaySteps || 0,
      10000,
      dailyFasting
    );
  }, [dailyTargetCalories, checkIns, dailyHydration, endOfDaySteps, dailyFasting]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
        Retrieving check-ins and physique history from Firestore...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Daily Check-In & AI Physique</span>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
              Ghost Camera Active
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Streamlined morning check-in, Ghost Overlay photos, Gemini AI symmetry analysis, and End-of-Day steps review.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {statusMessage && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {statusMessage}
            </span>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('end_of_day')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition active:scale-[0.98] cursor-pointer shadow-sm ${
              activeTab === 'end_of_day'
                ? 'bg-teal-600 text-white border-teal-500 shadow-teal-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Footprints className="w-4 h-4 text-teal-400 stroke-[2.5]" />
            <span>End-of-Day Steps</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCheckInModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Morning Check-In</span>
          </button>
        </div>
      </div>

      {/* Real-time Streak Maintenance & Consistency Engine Badge */}
      <StreakBadge
        streak={userStreak}
        todayCompleted={checkIns.some((c) => c.date === getTodayDateString())}
        completedGoals={{
          checkin: checkIns.some((c) => c.date === getTodayDateString()),
          meal: false,
          workout: false,
        }}
      />

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveTab('checkin')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
            activeTab === 'checkin'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Timeline & History</span>
          {checkIns.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-extrabold">
              {checkIns.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('end_of_day')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
            activeTab === 'end_of_day'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Footprints className="w-4 h-4" />
          <span>End-of-Day Review & Steps</span>
          {dailyActivity?.steps ? (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 font-extrabold">
              {dailyActivity.steps.toLocaleString()}
            </span>
          ) : null}
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
            activeTab === 'gallery'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Transformation Slider</span>
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
            activeTab === 'rewards'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Gamified Rewards</span>
          {rewards.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-extrabold">
              {rewards.length}
            </span>
          )}
        </button>
      </div>

      {/* ==================== TAB 1: TIMELINE & LATEST CHECK-IN ==================== */}
      {activeTab === 'checkin' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Latest Weight</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {checkIns[0]?.weightKg || morningWeight}
                </span>
                <span className="text-xs text-slate-400">kg</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Readiness Rating</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {checkIns[0]?.fatigueRating ? `${checkIns[0].fatigueRating} / 5` : 'Pending'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Total Check-Ins</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {checkIns.length}
                </span>
                <span className="text-xs text-slate-400">days logged</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Badges Unlocked</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-amber-500">
                  {rewards.length} / {BADGE_DEFINITIONS.length}
                </span>
              </div>
            </div>
          </div>

          {/* Latest AI Physique Insight Card */}
          {checkIns[0]?.aiPhysiqueAnalysis ? (
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 text-white border border-emerald-500/30 shadow-lg space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold">
                    Latest Gemini AI Physique & Symmetry Breakdown
                  </h3>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {checkIns[0].aiPhysiqueAnalysis.bodyTypeEstimate}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Visual Observations */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block">
                    Physique & Postural Observations
                  </span>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                    {checkIns[0].aiPhysiqueAnalysis.physiqueObservations.map((obs, i) => (
                      <li key={i} className="leading-relaxed">
                        {obs}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Symmetry & Volume Adjustments */}
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80">
                    <span className="font-bold text-teal-400 block mb-0.5">Symmetry Notes:</span>
                    <p className="text-slate-300 leading-relaxed">
                      {checkIns[0].aiPhysiqueAnalysis.symmetryNotes}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80">
                    <span className="font-bold text-amber-400 block mb-0.5">
                      Recovery & Volume Adjustment:
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {checkIns[0].aiPhysiqueAnalysis.recoveryAdjustment}{' '}
                      {checkIns[0].aiPhysiqueAnalysis.volumeRecommendation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">No AI Physique Analysis Logged Yet</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                  Click "Morning Check-In" to take your progress photo with the Ghost Overlay Camera and receive AI symmetry and posture analysis.
                </p>
              </div>
            </div>
          )}

          {/* Timeline Feed */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Historical Check-In Timeline</span>
            </h3>

            {checkIns.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-3">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Zero Mock Data Active: No check-in records found.
                </p>
                <p>
                  Consistent check-ins unlock your transformation gallery and earn streak badges!
                </p>
                <button
                  type="button"
                  onClick={() => setShowCheckInModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start First Check-In</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {checkIns.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between gap-3 text-xs group"
                  >
                    <div className="space-y-2">
                      <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-[3/4] max-h-48 flex items-center justify-center">
                        <img
                          src={item.photoUrl}
                          alt={`Checkin ${item.date}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-slate-950/80 text-white text-[10px] font-bold backdrop-blur">
                          {item.date}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedCheckInForModal(item)}
                          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-slate-950/80 text-white hover:text-emerald-400 backdrop-blur"
                          title="View Full Analysis"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 font-extrabold text-slate-900 dark:text-white text-sm">
                          <Scale className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.weightKg} kg</span>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            fatigueLabels[item.fatigueRating]?.color || 'text-slate-400'
                          } bg-slate-200 dark:bg-slate-800`}
                        >
                          Readiness: {item.fatigueRating}/5
                        </span>
                      </div>

                      {item.aiPhysiqueAnalysis && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {item.aiPhysiqueAnalysis.bodyTypeEstimate}:{' '}
                          {item.aiPhysiqueAnalysis.physiqueObservations[0]}
                        </p>
                      )}

                      {/* Vitals & Movement Pill Row */}
                      {(item.restingHeartRateBpm || item.sleepHours || item.energyLevel || item.steps) && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.restingHeartRateBpm && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                              <Heart className="w-2.5 h-2.5" />
                              <span>{item.restingHeartRateBpm} BPM</span>
                            </span>
                          )}
                          {item.sleepHours && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40">
                              <Moon className="w-2.5 h-2.5" />
                              <span>{item.sleepHours}h sleep</span>
                            </span>
                          )}
                          {item.steps && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-900/40">
                              <Footprints className="w-2.5 h-2.5" />
                              <span>{item.steps.toLocaleString()} steps</span>
                            </span>
                          )}
                          {item.energyLevel && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                              <BatteryCharging className="w-2.5 h-2.5" />
                              <span>{item.energyLevel}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSelectedCheckInForModal(item)}
                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                      >
                        Details & AI Notes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCheckIn(item.id)}
                        className="text-slate-400 hover:text-rose-500 transition p-1"
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

      {/* ==================== TAB 2: END-OF-DAY DAILY SUMMARY & STEPS LOG ==================== */}
      {activeTab === 'end_of_day' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-slate-900/10 border border-teal-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center flex-shrink-0 text-teal-600 dark:text-teal-400">
                <Footprints className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase text-teal-700 dark:text-teal-400 tracking-wider">
                    Nightly Maintenance Finalization
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-500/30">
                    Streak Shield Protected
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  End-of-Day Review & Steps Log
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
                  Log your total daily steps, review today's hydration target, verify your final Body Maintenance Balance score, and protect your streak before midnight.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Review Date:</label>
              <input
                type="date"
                value={endOfDayDate}
                onChange={(e) => setEndOfDayDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {endOfDaySuccess && (
            <div className="p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-400/40 text-emerald-900 dark:text-emerald-300 flex items-center gap-3 text-xs font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>{endOfDaySuccess}</span>
            </div>
          )}

          {/* Grid Layout: Steps Counter + Hydration Review */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Steps Counter & Stepper Engine */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <Footprints className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Daily Step Counter
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Standard Maintenance Target: 10,000 steps
                    </span>
                  </div>
                </div>

                <span className="text-xs font-black text-teal-600 dark:text-teal-400 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60">
                  {Math.round(((endOfDaySteps || 0) / 10000) * 100)}% of goal
                </span>
              </div>

              {/* Steps Value Display & Direct Input */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={endOfDaySteps}
                    onChange={(e) => setEndOfDaySteps(Math.max(0, Number(e.target.value)))}
                    className="w-36 sm:w-44 text-center bg-transparent border-b-2 border-teal-500 font-black text-slate-900 dark:text-white focus:outline-none"
                  />
                  <span className="text-sm font-semibold text-slate-400">steps</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${Math.min(100, ((endOfDaySteps || 0) / 10000) * 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <span>0</span>
                  <span>5,000</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">10,000+</span>
                </div>
              </div>

              {/* Stepper Increment Buttons */}
              <div className="grid grid-cols-5 gap-1.5 text-xs">
                {[-1000, -500, 500, 1000, 2500].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => setEndOfDaySteps((prev) => Math.max(0, (prev || 0) + delta))}
                    className="py-2 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-slate-800 dark:text-slate-200 transition text-center"
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </button>
                ))}
              </div>

              {/* Distance & Burn Badges */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Estimated Distance
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white block mt-0.5">
                    {((endOfDaySteps || 0) * 0.000762).toFixed(2)} km
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Active Calorie Burn
                  </span>
                  <span className="text-sm font-black text-amber-500 block mt-0.5">
                    ~{Math.round((endOfDaySteps || 0) * 0.04)} kcal
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Hydration Review & Quick Logger */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Hydration Engine Review
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        Today's Target: {dailyHydration?.targetMl || 3000} ml
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-black text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60">
                    {dailyHydration ? `${dailyHydration.waterMl} ml` : '0 ml'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Logged Water</span>
                    <span>
                      {Math.round(
                        ((dailyHydration?.waterMl || 0) / (dailyHydration?.targetMl || 3000)) * 100
                      )}
                      % Completed
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-teal-400 h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          ((dailyHydration?.waterMl || 0) / (dailyHydration?.targetMl || 3000)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {(dailyHydration?.waterMl || 0) >= (dailyHydration?.targetMl || 3000)
                      ? 'Optimal hydration achieved for cellular recovery and protein synthesis.'
                      : `Drink ${(dailyHydration?.targetMl || 3000) - (dailyHydration?.waterMl || 0)} ml more to hit your daily hydration target.`}
                  </p>
                </div>
              </div>

              {/* Quick Add Hydration Buttons */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                  Quick Hydration Entry:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddWaterQuick(250)}
                    className="py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    <span>+250 ml (Glass)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddWaterQuick(500)}
                    className="py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    <span>+500 ml (Bottle)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Evening Energy Level & Daily Reflection Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <BatteryCharging className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Evening Energy Level & Readiness
                </h4>
                <span className="text-[10px] text-slate-400">
                  Assess how your nervous system, joints, and muscular recovery feel tonight
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {(
                [
                  { lvl: 'low', label: 'Low Energy', sub: 'High fatigue / Need rest', color: 'bg-rose-600 text-white border-rose-600' },
                  { lvl: 'moderate', label: 'Moderate Energy', sub: 'Balanced / Normal fatigue', color: 'bg-amber-500 text-slate-950 font-black border-amber-500' },
                  { lvl: 'high', label: 'High Energy', sub: 'Fresh & High neural drive', color: 'bg-emerald-600 text-white border-emerald-600' },
                ] as const
              ).map(({ lvl, label, sub, color }) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setEndOfDayEnergy(lvl)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    endOfDayEnergy === lvl
                      ? color
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span className="font-bold text-xs block">{label}</span>
                  <span className="text-[10px] opacity-80 mt-1 block">{sub}</span>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Evening Reflection & Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Completed 10k steps after dinner, good hamstring recovery, feeling ready for tomorrow's pull workout."
                value={endOfDayNotes}
                onChange={(e) => setEndOfDayNotes(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Live Calculated Body Maintenance Balance (BMB) Score Preview */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 text-white border border-teal-500/30 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-400" />
                <h4 className="text-sm font-bold">
                  Live Calculated Body Maintenance Balance (BMB) Score
                </h4>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {endOfDayBmb.statusLabel}
              </span>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="text-center md:text-left flex-shrink-0">
                <span className="text-4xl sm:text-5xl font-black text-teal-400">
                  {endOfDayBmb.score}
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">/ 100 Final Daily BMB</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center flex-1 w-full text-xs">
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase block">Calorie Pillar</span>
                  <span className="font-bold text-slate-200 mt-0.5 block">
                    {endOfDayBmb.breakdown.calorieScore} / 35
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase block">Recovery</span>
                  <span className="font-bold text-slate-200 mt-0.5 block">
                    {endOfDayBmb.breakdown.recoveryScore} / 25
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase block">Consistency</span>
                  <span className="font-bold text-slate-200 mt-0.5 block">
                    {endOfDayBmb.breakdown.consistencyScore} / 20
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase block">Hydration</span>
                  <span className="font-bold text-slate-200 mt-0.5 block">
                    {endOfDayBmb.breakdown.hydrationScore} / 10
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase block">Movement Steps</span>
                  <span className="font-bold text-teal-400 mt-0.5 block">
                    {endOfDayBmb.breakdown.activityScore} / 10
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-800 pt-3">
              {endOfDayBmb.recommendation}
            </p>
          </div>

          {/* Save Action Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleSaveEndOfDay}
              disabled={isSavingEndOfDay}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/20 transition transform active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSavingEndOfDay ? 'Saving End-of-Day Review...' : 'COMPLETE & SAVE END-OF-DAY REVIEW'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: TRANSFORMATION SLIDER & GALLERY ==================== */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          {checkIns.length < 2 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-3">
              <Sliders className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-800 dark:text-slate-200">
                At Least 2 Check-Ins Required for Slider Comparison
              </p>
              <p className="max-w-md mx-auto">
                Log consecutive check-in photos using the Ghost Overlay Camera to unlock the side-by-side historical comparison wipe!
              </p>
              <button
                type="button"
                onClick={() => setShowCheckInModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Check-In Photo</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Date Selectors & Delta Banner */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Before Milestone
                    </label>
                    <select
                      value={beforeCheckInId}
                      onChange={(e) => setBeforeCheckInId(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      {checkIns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.date} ({c.weightKg} kg)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      After Milestone
                    </label>
                    <select
                      value={afterCheckInId}
                      onChange={(e) => setAfterCheckInId(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      {checkIns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.date} ({c.weightKg} kg)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-bold uppercase">
                      Weight Change
                    </span>
                    <span
                      className={`text-base font-black ${
                        weightDelta > 0
                          ? 'text-amber-500'
                          : weightDelta < 0
                          ? 'text-emerald-500'
                          : 'text-slate-400'
                      }`}
                    >
                      {weightDelta > 0 ? `+${weightDelta}` : weightDelta} kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Split Slider Comparison */}
              {beforeCheckIn && afterCheckIn && (
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-500" />
                      <span>Interactive Historical Reveal Slider</span>
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Drag horizontal slider below
                    </span>
                  </div>

                  <div className="relative w-full aspect-[4/5] sm:aspect-[16/10] max-h-[500px] rounded-2xl overflow-hidden bg-black select-none">
                    {/* After Image (Background) */}
                    <img
                      src={afterCheckIn.photoUrl}
                      alt="After progress"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-emerald-600/90 text-white text-xs font-bold shadow backdrop-blur">
                      After: {afterCheckIn.date} ({afterCheckIn.weightKg} kg)
                    </div>

                    {/* Before Image (Foreground Clipped) */}
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ width: `${sliderPosition}%` }}
                    >
                      <img
                        src={beforeCheckIn.photoUrl}
                        alt="Before progress"
                        className="absolute inset-0 w-full h-full object-contain max-w-none"
                        style={{
                          width: '100%',
                          minWidth: '100%',
                        }}
                      />
                      <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-slate-900/90 text-white text-xs font-bold shadow backdrop-blur">
                        Before: {beforeCheckIn.date} ({beforeCheckIn.weightKg} kg)
                      </div>
                    </div>

                    {/* Divider Line */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl pointer-events-none"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-950 flex items-center justify-center font-bold shadow-xl">
                        ⇄
                      </div>
                    </div>

                    {/* Transparent Range Input Slider */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderPosition}
                      onChange={(e) => setSliderPosition(Number(e.target.value))}
                      className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-20"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 3: GAMIFIED REWARDS & BADGES ==================== */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span>Consistency & Maintenance Badge Engine</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Earned automatically as you maintain check-in streaks, achieve metabolic equilibrium, and submit AI physique scans.
                </p>
              </div>

              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                {rewards.length} / {BADGE_DEFINITIONS.length} Badges Unlocked
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {BADGE_DEFINITIONS.map((badgeDef) => {
                const isUnlocked = rewards.some((r) => r.badgeId === badgeDef.badgeId);

                return (
                  <div
                    key={badgeDef.badgeId}
                    className={`p-4 rounded-2xl border transition-all duration-200 space-y-3 relative overflow-hidden ${
                      isUnlocked
                        ? 'bg-slate-50 dark:bg-slate-950 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-100/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                          isUnlocked
                            ? 'bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-500 border border-emerald-500/30'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {getBadgeIcon(badgeDef.icon)}
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          isUnlocked
                            ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {isUnlocked ? 'Unlocked' : 'Locked'}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {badgeDef.title}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          • {badgeDef.tier}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {badgeDef.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== DAILY CHECK-IN MODAL ==================== */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Morning Check-In</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Track weight, fatigue, and posture with ghost alignment
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckInModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCheckIn} className="space-y-4 text-xs">
              {/* Date & Morning Weight */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Check-In Date
                  </label>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Morning Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="200"
                    value={morningWeight}
                    onChange={(e) => setMorningWeight(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Fatigue & Readiness Rating */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Fatigue / Readiness Rating:
                  </label>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {fatigueRating} / 5
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFatigueRating(lvl)}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        fatigueRating === lvl
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {fatigueLabels[fatigueRating]?.label}
                </p>
              </div>

              {/* Soreness Notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Soreness / Recovery Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Hamstrings tight from RDLs, 8 hrs solid sleep"
                  value={sorenessNotes}
                  onChange={(e) => setSorenessNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Vitals & Daily Movement Engine */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>Daily Vitals & Movement Log</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Recovery Tracking
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Resting Heart Rate */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-500" />
                      <span>Resting HR (BPM)</span>
                    </label>
                    <input
                      type="number"
                      min="35"
                      max="140"
                      placeholder="e.g. 64"
                      value={restingHeartRate}
                      onChange={(e) =>
                        setRestingHeartRate(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white text-xs"
                    />
                  </div>

                  {/* Sleep Duration */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <Moon className="w-3 h-3 text-indigo-400" />
                      <span>Sleep Duration (Hrs)</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      placeholder="e.g. 7.5"
                      value={sleepHours}
                      onChange={(e) =>
                        setSleepHours(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Energy / Fatigue Level */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <BatteryCharging className="w-3 h-3 text-amber-500" />
                      <span>Energy Level</span>
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['low', 'moderate', 'high'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setEnergyLevel(lvl)}
                          className={`py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${
                            energyLevel === lvl
                              ? lvl === 'high'
                                ? 'bg-emerald-600 text-white'
                                : lvl === 'moderate'
                                ? 'bg-amber-500 text-slate-950 font-black'
                                : 'bg-rose-600 text-white'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Daily Steps Moved Notice */}
                  <div className="flex flex-col justify-center p-2 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/40 text-[11px] text-teal-800 dark:text-teal-300">
                    <span className="font-bold flex items-center gap-1">
                      <Footprints className="w-3 h-3 text-teal-500" />
                      <span>Steps Tracking:</span>
                    </span>
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5">
                      Logged in End-of-Day Review
                    </span>
                  </div>
                </div>
              </div>

              {/* Daily Fasting Observance Engine */}
              <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Are you observing a fast today?</span>
                  </label>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                    Fasting Mode
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(
                    [
                      { type: 'none', label: 'No Fast', sub: 'Standard Fueling', icon: <Sun className="w-3.5 h-3.5 text-amber-500" /> },
                      { type: 'partial_fruit', label: 'Fruit Fast', sub: 'Satvic Fruits', icon: <Apple className="w-3.5 h-3.5 text-emerald-500" /> },
                      { type: 'water_only', label: 'Water Fast', sub: 'Autophagy Reset', icon: <Droplets className="w-3.5 h-3.5 text-blue-500" /> },
                      { type: 'traditional_viratham', label: 'Viratham', sub: 'Sacred Fast', icon: <Sparkles className="w-3.5 h-3.5 text-purple-500" /> },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setObservingFast(opt.type)}
                      className={`p-2 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        observingFast === opt.type
                          ? 'bg-amber-500/20 border-amber-500 dark:border-amber-400 text-slate-950 dark:text-white shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {opt.icon}
                        <span className="font-bold text-[11px] truncate">{opt.label}</span>
                      </div>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                        {opt.sub}
                      </span>
                    </button>
                  ))}
                </div>

                {observingFast !== 'none' && (
                  <div className="pt-1">
                    <input
                      type="text"
                      placeholder="Optional fasting notes (e.g., Purattasi Saturday, coconut water allowed)"
                      value={fastingNotes}
                      onChange={(e) => setFastingNotes(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1">
                      {FASTING_CONFIGS[observingFast]?.description} AI will automatically adjust your workout, water target, and maintenance calorie thresholds.
                    </p>
                  </div>
                )}
              </div>

              {/* Ghost Overlay Camera Trigger & Photo Preview */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Progress Photo (Ghost Overlay Guided)
                </label>

                {checkInPhotoPreview ? (
                  <div className="relative rounded-2xl overflow-hidden bg-black max-h-52 flex items-center justify-center border border-slate-200 dark:border-slate-800">
                    <img
                      src={checkInPhotoPreview}
                      alt="Captured preview"
                      className="max-h-52 object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCamera(true)}
                      className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white font-bold text-xs backdrop-blur"
                    >
                      Retake with Ghost Camera
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className="w-full py-6 rounded-2xl border-2 border-dashed border-emerald-400/40 hover:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-500/5 flex flex-col items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      Launch Ghost Overlay Camera
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Align your posture with yesterday's ghost silhouette
                    </span>
                  </button>
                )}
              </div>

              {/* Gemini AI Analysis Checkbox */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={runAiAnalysis}
                  onChange={(e) => setRunAiAnalysis(e.target.checked)}
                  className="rounded text-emerald-600 accent-emerald-500 w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Run Gemini AI Body Type & Physique Vision Analysis
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Calculates symmetry, posture cues, and volume autoregulation
                  </span>
                </div>
              </label>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCheckInModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !checkInPhotoBlob}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Save Morning Check-In</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== GHOST OVERLAY CAMERA MODAL ==================== */}
      {showCamera && (
        <GhostOverlayCamera
          onCapture={handlePhotoCaptured}
          onCancel={() => setShowCamera(false)}
          previousPhotoUrl={checkIns[0]?.photoUrl}
        />
      )}

      {/* ==================== BADGE UNLOCK MODAL ==================== */}
      {newlyUnlockedBadges.length > 0 && (
        <BadgeUnlockModal
          rewards={newlyUnlockedBadges}
          onClose={() => setNewlyUnlockedBadges([])}
        />
      )}

      {/* ==================== SINGLE CHECK-IN DETAILS MODAL ==================== */}
      {selectedCheckInForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Check-In on {selectedCheckInForModal.date}
                </h4>
                <p className="text-slate-500 dark:text-slate-400">
                  Weight: {selectedCheckInForModal.weightKg} kg • Readiness:{' '}
                  {selectedCheckInForModal.fatigueRating}/5
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCheckInForModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black max-h-64 flex items-center justify-center">
              <img
                src={selectedCheckInForModal.photoUrl}
                alt="Checkin full"
                className="max-h-64 object-contain"
              />
            </div>

            {selectedCheckInForModal.aiPhysiqueAnalysis ? (
              <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                  Body Type: {selectedCheckInForModal.aiPhysiqueAnalysis.bodyTypeEstimate}
                </span>

                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Observations:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                    {selectedCheckInForModal.aiPhysiqueAnalysis.physiqueObservations.map((obs, i) => (
                      <li key={i}>{obs}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                    Symmetry & Posture:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">
                    {selectedCheckInForModal.aiPhysiqueAnalysis.symmetryNotes}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                    Recovery Pacing:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">
                    {selectedCheckInForModal.aiPhysiqueAnalysis.recoveryAdjustment}{' '}
                    {selectedCheckInForModal.aiPhysiqueAnalysis.volumeRecommendation}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 italic">No AI physique scan was run on this entry.</p>
            )}

            {/* Vitals & Movement Log */}
            {(selectedCheckInForModal.restingHeartRateBpm ||
              selectedCheckInForModal.sleepHours ||
              selectedCheckInForModal.energyLevel ||
              selectedCheckInForModal.steps) && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>Vitals & Daily Movement</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  {selectedCheckInForModal.restingHeartRateBpm && (
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Resting HR</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {selectedCheckInForModal.restingHeartRateBpm} BPM
                      </span>
                    </div>
                  )}
                  {selectedCheckInForModal.sleepHours && (
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Sleep</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {selectedCheckInForModal.sleepHours} hrs
                      </span>
                    </div>
                  )}
                  {selectedCheckInForModal.energyLevel && (
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Energy</span>
                      <span className="font-bold text-slate-900 dark:text-white uppercase">
                        {selectedCheckInForModal.energyLevel}
                      </span>
                    </div>
                  )}
                  {selectedCheckInForModal.steps && (
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Steps</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {selectedCheckInForModal.steps.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedCheckInForModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckIn;
