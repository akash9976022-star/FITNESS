import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Scale,
  Flame,
  Wrench,
  Edit2,
  Check,
  X,
  Sparkles,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeUserProfile,
  saveUserProfile,
  calculateMifflinStJeor,
  EQUIPMENT_CATALOG,
  type UserProfile,
  type ExperienceLevel,
} from '../services/firestoreService';

export const Profile: React.FC = () => {
  const { currentUser } = useAuth();

  // Firestore profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form edit states
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<number>(25);
  const [heightCm, setHeightCm] = useState<number>(175);
  const [currentWeightKg, setCurrentWeightKg] = useState<number>(75);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(75);
  const [activityMultiplier, setActivityMultiplier] = useState<number>(1.55);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('intermediate');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

  // Load real user profile from Firestore onSnapshot
  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    const unsub = subscribeUserProfile(currentUser.uid, (data) => {
      setProfile(data);
      if (data) {
        setGender(data.gender || 'male');
        setAge(data.age || 25);
        setHeightCm(data.heightCm || 175);
        setCurrentWeightKg(data.currentWeightKg || 75);
        setTargetWeightKg(data.targetWeightKg || data.currentWeightKg || 75);
        setActivityMultiplier(data.activityMultiplier || 1.55);
        setExperienceLevel(data.experienceLevel || 'intermediate');
        setSelectedEquipment(data.equipment || []);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser?.uid]);

  // Live Mifflin-St Jeor Calculation
  const { bmr, calculatedTdee } = useMemo(() => {
    return calculateMifflinStJeor(gender, currentWeightKg, heightCm, age, activityMultiplier);
  }, [gender, currentWeightKg, heightCm, age, activityMultiplier]);

  // Macro target estimates
  const macroBreakdown = useMemo(() => {
    const proteinGrams = Math.round(currentWeightKg * 2.0);
    const proteinKcal = proteinGrams * 4;
    const fatsKcal = calculatedTdee * 0.25;
    const fatsGrams = Math.round(fatsKcal / 9);
    const carbsKcal = Math.max(0, calculatedTdee - proteinKcal - fatsKcal);
    const carbsGrams = Math.round(carbsKcal / 4);

    return { proteinGrams, fatsGrams, carbsGrams };
  }, [currentWeightKg, calculatedTdee]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCancelEdit = () => {
    if (profile) {
      setGender(profile.gender || 'male');
      setAge(profile.age || 25);
      setHeightCm(profile.heightCm || 175);
      setCurrentWeightKg(profile.currentWeightKg || 75);
      setTargetWeightKg(profile.targetWeightKg || profile.currentWeightKg || 75);
      setActivityMultiplier(profile.activityMultiplier || 1.55);
      setExperienceLevel(profile.experienceLevel || 'intermediate');
      setSelectedEquipment(profile.equipment || []);
    }
    setIsEditing(false);
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser?.uid) return;

    setSaving(true);
    try {
      await saveUserProfile(currentUser.uid, {
        gender,
        age: Number(age),
        heightCm: Number(heightCm),
        currentWeightKg: Number(currentWeightKg),
        targetWeightKg: Number(targetWeightKg),
        activityMultiplier: Number(activityMultiplier),
        experienceLevel,
        calculatedTdee,
        bmr,
        equipment: selectedEquipment,
        onboardingCompleted: true,
      });

      setIsEditing(false);
      showToast('Profile and equipment updated successfully!');
    } catch (err) {
      console.error('Failed to update profile:', err);
      showToast('Error updating profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleEquipment = (item: string) => {
    setSelectedEquipment((prev) => {
      if (item === 'None') {
        return prev.includes('None') ? [] : ['None'];
      }
      const filtered = prev.filter((i) => i !== 'None');
      return filtered.includes(item)
        ? filtered.filter((i) => i !== item)
        : [...filtered, item];
    });
  };

  const toggleCategory = (categoryItems: string[]) => {
    const allSelected = categoryItems.every((item) => selectedEquipment.includes(item));
    if (allSelected) {
      setSelectedEquipment((prev) => prev.filter((item) => !categoryItems.includes(item)));
    } else {
      setSelectedEquipment((prev) => {
        const withoutCategory = prev.filter((item) => !categoryItems.includes(item) && item !== 'None');
        return [...withoutCategory, ...categoryItems];
      });
    }
  };

  const getActivityLabel = (mult: number) => {
    if (mult <= 1.25) return 'Sedentary (Desk Job)';
    if (mult <= 1.45) return 'Lightly Active (1-3 days/wk)';
    if (mult <= 1.65) return 'Moderately Active (3-5 days/wk)';
    if (mult <= 1.8) return 'Very Active (6-7 days/wk)';
    return 'Extremely Active (Heavy Labor / 2x Training)';
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
        Syncing athlete profile from Firestore...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2.5 border border-emerald-500/40 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          {currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt="Avatar"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-2xl uppercase shadow-md shadow-emerald-500/20">
              {currentUser?.displayName ? currentUser.displayName[0] : <User className="w-8 h-8" />}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {currentUser?.displayName || 'Active Athlete'}
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30">
                Firestore Synced
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {currentUser?.email || (currentUser?.isAnonymous ? 'Live Guest Session' : 'Authenticated Athlete')}
            </p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              UID: {currentUser?.uid ? `${currentUser.uid.slice(0, 12)}...` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Edit / Save Actions */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/25 transition active:scale-[0.98]"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 transition active:scale-[0.98]"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Profile & Inventory</span>
            </button>
          )}
        </div>
      </div>

      {/* METABOLIC TARGETS CARD (Live TDEE from Mifflin-St Jeor) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Calculated Metabolic Maintenance Baseline
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scientific Mifflin-St Jeor Formula based on real-time biometric inputs.
              </p>
            </div>
          </div>

          {isEditing && (
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1 self-start sm:self-auto">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recalculating Live</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* TDEE */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Maintenance TDEE
            </span>
            <div className="flex items-baseline justify-center gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {calculatedTdee.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-semibold">kcal</span>
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium block mt-0.5">
              Energy Equilibrium
            </span>
          </div>

          {/* BMR */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Basal Metabolic Rate
            </span>
            <div className="flex items-baseline justify-center gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {bmr.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-semibold">kcal</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
              At Complete Rest
            </span>
          </div>

          {/* Daily Protein Target */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Daily Protein Target
            </span>
            <div className="flex items-baseline justify-center gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                {macroBreakdown.proteinGrams}
              </span>
              <span className="text-xs text-slate-400 font-semibold">grams</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
              2.0g per kg mass
            </span>
          </div>

          {/* Carbohydrates & Fats */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Carbs / Fats Ratio
            </span>
            <div className="flex items-baseline justify-center gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-400">
                {macroBreakdown.carbsGrams}g
              </span>
              <span className="text-xs text-slate-400 font-semibold">/</span>
              <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                {macroBreakdown.fatsGrams}g
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
              Fuel & Hormones
            </span>
          </div>
        </div>
      </div>

      {/* PERSONAL METRICS SECTION */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Personal Metrics & Biometrics
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing
                  ? 'Update your age, measurements, and training tier below.'
                  : 'Your recorded physical measurements stored in Firestore.'}
              </p>
            </div>
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1"
            >
              <span>Edit Metrics</span>
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {isEditing ? (
          /* ================= EDIT MODE: BIOMETRICS FORM ================= */
          <div className="space-y-5">
            {/* Biological Sex */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Biological Sex (Mifflin-St Jeor Offset)
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition flex items-center justify-between ${
                    gender === 'male'
                      ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span>Male</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30">
                    +5 kcal offset
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition flex items-center justify-between ${
                    gender === 'female'
                      ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span>Female</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30">
                    -161 kcal offset
                  </span>
                </button>
              </div>
            </div>

            {/* Age & Height */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Age (years)
                </label>
                <input
                  type="number"
                  min="14"
                  max="95"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  min="120"
                  max="230"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Current Weight & Target Maintenance Weight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Weight (kg)
                </label>
                <input
                  type="number"
                  min="35"
                  max="200"
                  step="0.5"
                  value={currentWeightKg}
                  onChange={(e) => setCurrentWeightKg(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Maintenance Weight (kg)
                </label>
                <input
                  type="number"
                  min="35"
                  max="200"
                  step="0.5"
                  value={targetWeightKg}
                  onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Activity Multiplier */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Physical Activity Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {[
                  { mult: 1.2, title: 'Sedentary', desc: 'Desk job, little to no exercise' },
                  { mult: 1.375, title: 'Lightly Active', desc: 'Light workouts 1-3 days per week' },
                  { mult: 1.55, title: 'Moderately Active', desc: 'Moderate training 3-5 days per week' },
                  { mult: 1.725, title: 'Very Active', desc: 'Hard training 6-7 days per week' },
                  { mult: 1.9, title: 'Extremely Active', desc: 'Athlete or high physical labor' },
                ].map((act) => (
                  <button
                    key={act.mult}
                    type="button"
                    onClick={() => setActivityMultiplier(act.mult)}
                    className={`p-3 rounded-xl border text-left transition ${
                      activityMultiplier === act.mult
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-950 dark:text-emerald-200'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold">{act.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {act.mult}x
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {act.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Experience Level Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Experience Level (AI Training Intensity)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    level: 'beginner' as const,
                    title: 'Beginner',
                    desc: 'Focus on movement mechanics, joint safety, and foundation sets (RPE 7).',
                  },
                  {
                    level: 'intermediate' as const,
                    title: 'Intermediate',
                    desc: 'Balanced progressive overload with hypertrophy rep ranges (RPE 8).',
                  },
                  {
                    level: 'pro' as const,
                    title: 'Pro',
                    desc: 'High mechanical tension, intense volume, and tactical periodization (RPE 8.5+).',
                  },
                ].map((exp) => (
                  <button
                    key={exp.level}
                    type="button"
                    onClick={() => setExperienceLevel(exp.level)}
                    className={`p-3.5 rounded-2xl border text-left transition ${
                      experienceLevel === exp.level
                        ? 'bg-teal-50 dark:bg-teal-500/15 border-teal-500 text-teal-950 dark:text-teal-200 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs font-black uppercase tracking-wider block mb-1">
                      {exp.title}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {exp.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ================= VIEW MODE: BIOMETRICS CARDS ================= */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Biological Sex
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white capitalize">
                {gender}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                {gender === 'male' ? '+5 MSJ offset' : '-161 MSJ offset'}
              </span>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Age
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                {age} years
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Metabolic factor
              </span>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Height
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                {heightCm} cm
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                {Math.floor(heightCm / 30.48)}&apos; {Math.round((heightCm % 30.48) / 2.54)}&quot;
              </span>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Current Weight
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                {currentWeightKg} kg
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                {(currentWeightKg * 2.20462).toFixed(1)} lbs
              </span>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Target Maintenance
              </span>
              <span className="text-sm sm:text-base font-black text-teal-600 dark:text-teal-400">
                {targetWeightKg} kg
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                {Math.abs(currentWeightKg - targetWeightKg) <= 0.5
                  ? 'At equilibrium'
                  : currentWeightKg > targetWeightKg
                  ? `+${(currentWeightKg - targetWeightKg).toFixed(1)} kg delta`
                  : `-${(targetWeightKg - currentWeightKg).toFixed(1)} kg delta`}
              </span>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Activity Multiplier
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                {activityMultiplier}x
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block mt-0.5">
                {getActivityLabel(activityMultiplier)}
              </span>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Experience Tier
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 capitalize">
                  {experienceLevel}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {experienceLevel === 'beginner'
                    ? '• 2-3 sets per exercise (RPE 7)'
                    : experienceLevel === 'intermediate'
                    ? '• 3-4 sets per exercise (RPE 8)'
                    : '• 4-5 sets with overload (RPE 8.5+)'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* GYM EQUIPMENT INVENTORY CARD */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Gym Equipment & Machine Inventory
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-500/15 text-teal-800 dark:text-teal-300 font-bold border border-teal-500/20">
                  {selectedEquipment.length} Selected
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Workouts generated by FitMaintenance AI are strictly calibrated to this inventory.
              </p>
            </div>
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Edit Equipment</span>
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Equipment Categories */}
        <div className="space-y-6">
          {EQUIPMENT_CATALOG.map((category) => {
            const categoryItems = category.items;
            const categorySelectedCount = categoryItems.filter((i) => selectedEquipment.includes(i)).length;
            const allSelected = categorySelectedCount === categoryItems.length;

            return (
              <div
                key={category.category}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {category.category}
                      </h3>
                      <span className="text-[11px] font-semibold text-slate-400">
                        ({categorySelectedCount}/{categoryItems.length} active)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {category.description}
                    </p>
                  </div>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => toggleCategory(categoryItems)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                    >
                      {allSelected ? 'Deselect Category' : 'Select All'}
                    </button>
                  )}
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
                  {categoryItems.map((item) => {
                    const isSelected = selectedEquipment.includes(item);

                    if (!isEditing) {
                      // VIEW MODE: Show badges
                      return (
                        <div
                          key={item}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 font-semibold'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 text-slate-400 opacity-60'
                          }`}
                        >
                          <span className="truncate">{item}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
                        </div>
                      );
                    }

                    // EDIT MODE: Checkable buttons
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleEquipment(item)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition text-left ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-500 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <span className="truncate">{item}</span>
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                            isSelected
                              ? 'bg-slate-950 border-slate-950 text-white'
                              : 'border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating / Bottom Save Bar when editing */}
        {isEditing && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-500" />
              <span>Saving updates your baseline TDEE and workouts in Firestore.</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20"
              >
                {saving ? 'Saving...' : 'Save Profile & Inventory'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
