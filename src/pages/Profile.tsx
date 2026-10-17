import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Loader2,
  AlertCircle,
  Trash2,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeUserProfile,
  saveUserProfile,
  calculateMifflinStJeor,
  EQUIPMENT_CATALOG,
  flushUserAppData,
  type UserProfile,
  type ExperienceLevel,
  type FlushDataProgress,
} from '../services/firestoreService';

export const DEFAULT_PROFILE: UserProfile = {
  gender: 'male',
  age: 25,
  heightCm: 175,
  currentWeightKg: 75,
  targetWeightKg: 75,
  activityMultiplier: 1.55,
  experienceLevel: 'intermediate',
  equipment: ['Barbell', 'Dumbbells', 'Adjustable Bench', 'Pull-up Bar', 'Resistance Bands'],
  calculatedTdee: 2450,
  bmr: 1700,
  onboardingCompleted: false,
};

export const Profile: React.FC = () => {
  const { currentUser } = useAuth();

  // Firestore profile state with guaranteed safe default fallback
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Flush / Reset App Data States
  const [isFlushModalOpen, setIsFlushModalOpen] = useState<boolean>(false);
  const [confirmTextInput, setConfirmTextInput] = useState<string>('');
  const [isFlushing, setIsFlushing] = useState<boolean>(false);
  const [flushProgress, setFlushProgress] = useState<FlushDataProgress | null>(null);

  // Form edit states
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<number>(25);
  const [heightCm, setHeightCm] = useState<number>(175);
  const [currentWeightKg, setCurrentWeightKg] = useState<number>(75);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(75);
  const [activityMultiplier, setActivityMultiplier] = useState<number>(1.55);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('intermediate');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(DEFAULT_PROFILE.equipment);

  // Load real user profile from Firestore onSnapshot
  useEffect(() => {
    if (!currentUser?.uid) {
      setProfile(DEFAULT_PROFILE);
      setGender(DEFAULT_PROFILE.gender);
      setAge(DEFAULT_PROFILE.age);
      setHeightCm(DEFAULT_PROFILE.heightCm);
      setCurrentWeightKg(DEFAULT_PROFILE.currentWeightKg);
      setTargetWeightKg(DEFAULT_PROFILE.targetWeightKg);
      setActivityMultiplier(DEFAULT_PROFILE.activityMultiplier);
      setExperienceLevel(DEFAULT_PROFILE.experienceLevel);
      setSelectedEquipment(DEFAULT_PROFILE.equipment);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeUserProfile(currentUser.uid, (data) => {
      // Safe fallback if document does not exist yet in Firestore (brand new sign-up)
      const safeProfile: UserProfile = data
        ? {
            gender: data.gender || DEFAULT_PROFILE.gender,
            age: Number(data.age) || DEFAULT_PROFILE.age,
            heightCm: Number(data.heightCm) || DEFAULT_PROFILE.heightCm,
            currentWeightKg: Number(data.currentWeightKg) || DEFAULT_PROFILE.currentWeightKg,
            targetWeightKg: Number(data.targetWeightKg) || Number(data.currentWeightKg) || DEFAULT_PROFILE.targetWeightKg,
            activityMultiplier: Number(data.activityMultiplier) || DEFAULT_PROFILE.activityMultiplier,
            experienceLevel: (data.experienceLevel as ExperienceLevel) || DEFAULT_PROFILE.experienceLevel,
            equipment: Array.isArray(data.equipment) ? data.equipment : DEFAULT_PROFILE.equipment,
            calculatedTdee: Number(data.calculatedTdee) || DEFAULT_PROFILE.calculatedTdee,
            bmr: Number(data.bmr) || DEFAULT_PROFILE.bmr,
            onboardingCompleted: Boolean(data.onboardingCompleted),
          }
        : { ...DEFAULT_PROFILE };

      setProfile(safeProfile);
      setGender(safeProfile.gender);
      setAge(safeProfile.age);
      setHeightCm(safeProfile.heightCm);
      setCurrentWeightKg(safeProfile.currentWeightKg);
      setTargetWeightKg(safeProfile.targetWeightKg);
      setActivityMultiplier(safeProfile.activityMultiplier);
      setExperienceLevel(safeProfile.experienceLevel);
      setSelectedEquipment(safeProfile.equipment);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser?.uid]);

  // Live Mifflin-St Jeor Calculation with strictly sanitized numeric parsing
  const { bmr, calculatedTdee } = useMemo(() => {
    const safeAge = parseInt(String(age), 10) || 25;
    const safeHeight = parseFloat(String(heightCm)) || 175;
    const safeCurrentWeight = parseFloat(String(currentWeightKg)) || 75;
    const safeActivity = parseFloat(String(activityMultiplier)) || 1.55;

    return calculateMifflinStJeor(gender, safeCurrentWeight, safeHeight, safeAge, safeActivity);
  }, [gender, currentWeightKg, heightCm, age, activityMultiplier]);

  // Macro target estimates
  const macroBreakdown = useMemo(() => {
    const safeWeight = parseFloat(String(currentWeightKg)) || 75;
    const safeTdee = calculatedTdee || 2450;

    const proteinGrams = Math.round(safeWeight * 2.0);
    const proteinKcal = proteinGrams * 4;
    const fatsKcal = safeTdee * 0.25;
    const fatsGrams = Math.round(fatsKcal / 9);
    const carbsKcal = Math.max(0, safeTdee - proteinKcal - fatsKcal);
    const carbsGrams = Math.round(carbsKcal / 4);

    return { proteinGrams, fatsGrams, carbsGrams };
  }, [currentWeightKg, calculatedTdee]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCancelEdit = () => {
    const source = profile || DEFAULT_PROFILE;
    setGender(source.gender || 'male');
    setAge(Number(source.age) || 25);
    setHeightCm(Number(source.heightCm) || 175);
    setCurrentWeightKg(Number(source.currentWeightKg) || 75);
    setTargetWeightKg(Number(source.targetWeightKg) || Number(source.currentWeightKg) || 75);
    setActivityMultiplier(Number(source.activityMultiplier) || 1.55);
    setExperienceLevel(source.experienceLevel || 'intermediate');
    setSelectedEquipment(Array.isArray(source.equipment) ? source.equipment : []);
    setErrorMessage(null);
    setIsEditing(false);
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser?.uid) return;

    setErrorMessage(null);

    // Strict numeric type parsing with explicit parseInt / parseFloat / Number
    const parsedAge = parseInt(String(age), 10);
    const parsedHeight = parseFloat(String(heightCm));
    const parsedCurrentWeight = parseFloat(String(currentWeightKg));
    const parsedTargetWeight = parseFloat(String(targetWeightKg));
    const parsedActivity = parseFloat(String(activityMultiplier));

    if (isNaN(parsedAge) || parsedAge < 10 || parsedAge > 120) {
      setErrorMessage('Please enter a valid age between 10 and 120 years.');
      return;
    }
    if (isNaN(parsedHeight) || parsedHeight < 80 || parsedHeight > 250) {
      setErrorMessage('Please enter a valid height between 80 and 250 cm.');
      return;
    }
    if (isNaN(parsedCurrentWeight) || parsedCurrentWeight < 25 || parsedCurrentWeight > 350) {
      setErrorMessage('Please enter a valid current weight between 25 and 350 kg.');
      return;
    }
    if (isNaN(parsedTargetWeight) || parsedTargetWeight < 25 || parsedTargetWeight > 350) {
      setErrorMessage('Please enter a valid target weight between 25 and 350 kg.');
      return;
    }
    if (isNaN(parsedActivity) || parsedActivity < 1.0) {
      setErrorMessage('Please select a valid physical activity level.');
      return;
    }

    const safeAge = Number(parsedAge);
    const safeHeight = Number(parsedHeight);
    const safeCurrentWeight = Number(parsedCurrentWeight);
    const safeTargetWeight = Number(parsedTargetWeight);
    const safeActivity = Number(parsedActivity);

    // Explicitly recalculate Mifflin-St Jeor TDEE with verified numeric types
    const { bmr: freshBmr, calculatedTdee: freshTdee } = calculateMifflinStJeor(
      gender,
      safeCurrentWeight,
      safeHeight,
      safeAge,
      safeActivity
    );

    setSaving(true);
    try {
      const updatedProfile: UserProfile = {
        gender,
        age: safeAge,
        heightCm: safeHeight,
        currentWeightKg: safeCurrentWeight,
        targetWeightKg: safeTargetWeight,
        activityMultiplier: safeActivity,
        experienceLevel,
        calculatedTdee: Number(freshTdee),
        bmr: Number(freshBmr),
        equipment: selectedEquipment.length > 0 ? selectedEquipment : ['None'],
        onboardingCompleted: true,
      };

      await saveUserProfile(currentUser.uid, updatedProfile);

      // Local state confirmation
      setProfile(updatedProfile);
      setAge(safeAge);
      setHeightCm(safeHeight);
      setCurrentWeightKg(safeCurrentWeight);
      setTargetWeightKg(safeTargetWeight);
      setActivityMultiplier(safeActivity);

      setIsEditing(false);
      showToast('Profile and equipment updated successfully!');
    } catch (err: unknown) {
      console.error('Failed to update profile:', err);
      let msg = err instanceof Error ? err.message : 'Error writing to Firestore. Please check your connection and security rules.';
      if (msg.toLowerCase().includes('permission')) {
        msg = 'Missing or insufficient permissions: Your Firebase Firestore Security Rules in the Firebase Console currently deny writes to users/{userId}. Please paste the provided firestore.rules into your Firebase Console > Firestore Database > Rules tab.';
      }
      setErrorMessage(msg);
      showToast('Failed to save profile changes. See error details above.');
    } finally {
      setSaving(false);
    }
  };

  const handleExecuteFlush = async () => {
    if (!currentUser?.uid || confirmTextInput.trim() !== 'CONFIRM') return;

    setIsFlushing(true);
    setErrorMessage(null);
    try {
      await flushUserAppData(currentUser.uid, (p) => {
        setFlushProgress(p);
      });

      showToast('App data flushed successfully. Starting fresh!');

      // Brief delay for visual feedback before navigating to onboarding
      setTimeout(() => {
        setIsFlushModalOpen(false);
        setIsFlushing(false);
        navigate('/onboarding', { replace: true });
      }, 1200);
    } catch (err: unknown) {
      console.error('Error during data flush:', err);
      const msg = err instanceof Error ? err.message : 'Error flushing data from Firestore.';
      setErrorMessage(`Flush Error: ${msg}`);
      setIsFlushing(false);
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

  // Loading spinner while fetching data from Firestore
  if (loading || !currentUser) {
    return (
      <div className="min-h-[450px] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-4 shadow-sm">
          <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Loading Profile...
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Connecting to Cloud Firestore and initializing biometric baseline...
        </p>
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

      {/* Inline Error Alert Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-start gap-3 text-xs shadow-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="font-bold text-sm text-rose-900 dark:text-rose-100 flex items-center gap-1.5">
              <span>Profile Update Error</span>
            </div>
            <p className="text-rose-700 dark:text-rose-300 leading-relaxed">
              {errorMessage}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-1 text-rose-500 hover:text-rose-800 dark:hover:text-rose-200 rounded-lg transition"
            title="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl card-3d flex flex-col md:flex-row md:items-center justify-between gap-5">
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
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/25 transition active:scale-[0.98]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setIsEditing(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 transition active:scale-[0.98]"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Profile & Inventory</span>
            </button>
          )}
        </div>
      </div>

      {/* METABOLIC TARGETS CARD (Live TDEE from Mifflin-St Jeor) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl card-3d space-y-4">
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
      <div className="p-6 sm:p-7 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl card-3d space-y-6">
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
              onClick={() => {
                setErrorMessage(null);
                setIsEditing(true);
              }}
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
                      ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-950 dark:text-emerald-300 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
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
                      ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-950 dark:text-emerald-300 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
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
                  max="120"
                  value={age === 0 ? '' : age}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                    setAge(isNaN(val) ? 0 : val);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-sm"
                  placeholder="e.g. 25"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  min="100"
                  max="250"
                  step="0.5"
                  value={heightCm === 0 ? '' : heightCm}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    setHeightCm(isNaN(val) ? 0 : val);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-sm"
                  placeholder="e.g. 175"
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
                  min="30"
                  max="300"
                  step="0.1"
                  value={currentWeightKg === 0 ? '' : currentWeightKg}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    setCurrentWeightKg(isNaN(val) ? 0 : val);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-sm"
                  placeholder="e.g. 75.0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Maintenance Weight (kg)
                </label>
                <input
                  type="number"
                  min="30"
                  max="300"
                  step="0.1"
                  value={targetWeightKg === 0 ? '' : targetWeightKg}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    setTargetWeightKg(isNaN(val) ? 0 : val);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-sm"
                  placeholder="e.g. 75.0"
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
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-bold shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold">{act.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
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
                        ? 'bg-teal-50 dark:bg-teal-500/15 border-teal-500 text-teal-950 dark:text-teal-100 font-bold shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
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
      <div className="p-6 sm:p-7 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl card-3d space-y-6">
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
                  {(selectedEquipment || []).length} Selected
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Workouts generated by FitMaintenance AI are strictly calibrated to this inventory.
              </p>
            </div>
          </div>

          {!isEditing && (
            <button
              onClick={() => {
                setErrorMessage(null);
                setIsEditing(true);
              }}
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
            const categoryItems = category.items || [];
            const categorySelectedCount = categoryItems.filter((i) => (selectedEquipment || []).includes(i)).length;
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
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 transition"
                    >
                      {allSelected ? 'Deselect Category' : 'Select All'}
                    </button>
                  )}
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
                  {categoryItems.map((item) => {
                    const isSelected = (selectedEquipment || []).includes(item);

                    if (!isEditing) {
                      // VIEW MODE: Show badges
                      return (
                        <div
                          key={item}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-200 font-semibold'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 text-slate-400 opacity-60'
                          }`}
                        >
                          <span className="truncate">{item}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
                        </div>
                      );
                    }

                    // EDIT MODE: Checkable buttons with high-contrast borders & text
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleEquipment(item)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition text-left ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-500 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-600'
                        }`}
                      >
                        <span className="truncate">{item}</span>
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                            isSelected
                              ? 'bg-slate-950 border-slate-950 text-white'
                              : 'border-slate-300 dark:border-slate-600'
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
              <Info className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Saving updates your baseline TDEE and workouts in Firestore.</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 transition"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Save Profile & Inventory</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================== DANGER ZONE: FLUSH / RESET APP DATA ==================== */}
      <div className="p-5 sm:p-7 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border-2 border-rose-200 dark:border-rose-900/40 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 shadow-xs border border-rose-200 dark:border-rose-800">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-rose-950 dark:text-rose-200">
                  Danger Zone: Reset App Data
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-200/80 dark:bg-rose-500/20 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                  Irreversible
                </span>
              </div>
              <p className="text-xs text-rose-700/90 dark:text-rose-400/90 font-medium pt-0.5 max-w-xl">
                Permanently purge all personal check-ins, custom workout programs, video alarms, nutrition logs, and routine reminders while keeping your account login intact.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setConfirmTextInput('');
              setIsFlushModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-rose-950/90 border-2 border-rose-500 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white text-xs sm:text-sm font-black transition-all shadow-md shadow-rose-500/10 active:scale-[0.98] self-start sm:self-auto shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Flush / Reset App Data</span>
          </button>
        </div>
      </div>

      {/* ==================== SECURE TYPE-TO-CONFIRM DELETION MODAL ==================== */}
      {isFlushModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative">
            {/* Top Danger Gradient Stripe */}
            <div className="h-2.5 w-full bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600" />

            {/* Close Button (disabled while flushing) */}
            {!isFlushing && (
              <button
                type="button"
                onClick={() => setIsFlushModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="p-6 sm:p-7 space-y-5">
              {/* Warning Icon & Heading */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-500/20">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    Flush / Reset All App Data?
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">
                    This action is permanent and cannot be undone
                  </p>
                </div>
              </div>

              {/* Warning Checklist of What Will Be Purged */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 pb-1 border-b border-slate-200 dark:border-slate-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>The following items will be completely purged:</span>
                </div>
                <ul className="space-y-1.5 text-[11px] sm:text-xs">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                    <span><strong>Check-ins & Physique:</strong> All morning weight logs, body metrics, and progress photos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                    <span><strong>Workouts & History:</strong> All completed workout logs, custom routine templates, and exercises.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                    <span><strong>Nutrition & Diet:</strong> Daily meal logs, macro calculations, and food vision data.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                    <span><strong>Media & Alarms:</strong> Custom video alarms, wake-up library files, and custom daily routine timings.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                    <span><strong>Streak & Badges:</strong> Active workout streaks, rewards, and AI coach history.</span>
                  </li>
                </ul>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span><strong>Account Stays Active:</strong> Your login authentication remains intact. You will be redirected to fresh setup.</span>
                </div>
              </div>

              {/* Flush Progress State (shown while purging) */}
              {isFlushing ? (
                <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{flushProgress?.step || 'Flushing application data...'}</span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${flushProgress?.progressPercent || 15}%` }}
                    />
                  </div>

                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">
                    {flushProgress?.progressPercent || 15}% complete • Please do not close the app
                  </span>
                </div>
              ) : (
                /* Type to Confirm Form */
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-900 dark:text-white block">
                      Type <span className="font-mono text-rose-600 dark:text-rose-400 font-extrabold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-800">CONFIRM</span> to verify:
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      To prevent accidental deletion, type the exact word CONFIRM in capital letters.
                    </p>
                  </div>

                  <input
                    type="text"
                    autoFocus
                    value={confirmTextInput}
                    onChange={(e) => setConfirmTextInput(e.target.value)}
                    placeholder="CONFIRM"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-sm font-mono font-bold tracking-widest text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder:text-slate-400 uppercase"
                  />

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsFlushModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={confirmTextInput.trim() !== 'CONFIRM'}
                      onClick={handleExecuteFlush}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-black shadow-lg shadow-rose-600/25 transition active:scale-[0.98]"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Permanently Flush All Data</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
