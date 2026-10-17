import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Activity,
  Layers,
  Wrench,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeUserProfile,
  saveUserProfile,
  calculateMifflinStJeor,
  EQUIPMENT_CATALOG,
  type ExperienceLevel,
} from '../services/firestoreService';

export const Onboarding: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Step 1: Baseline Metrics
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<number>(25);
  const [heightCm, setHeightCm] = useState<number>(175);
  const [currentWeightKg, setCurrentWeightKg] = useState<number>(75);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(75);
  const [activityMultiplier, setActivityMultiplier] = useState<number>(1.55);

  // Step 2: Experience Level
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('intermediate');

  // Step 3: Granular Machine Inventory
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([
    'Barbell',
    'Dumbbells',
    'Adjustable Bench',
    'Pull-up Bar',
    'Lat Pulldown',
    'Cable Crossover',
    'Leg Press',
  ]);

  // Load existing profile from Firestore if previously saved
  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    const unsub = subscribeUserProfile(currentUser.uid, (profile) => {
      if (profile) {
        if (profile.gender) setGender(profile.gender);
        if (profile.age) setAge(profile.age);
        if (profile.heightCm) setHeightCm(profile.heightCm);
        if (profile.currentWeightKg) setCurrentWeightKg(profile.currentWeightKg);
        if (profile.targetWeightKg) setTargetWeightKg(profile.targetWeightKg);
        if (profile.activityMultiplier) setActivityMultiplier(profile.activityMultiplier);
        if (profile.experienceLevel) setExperienceLevel(profile.experienceLevel);
        if (profile.equipment && profile.equipment.length > 0) {
          setSelectedEquipment(profile.equipment);
        }
      }
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser?.uid]);

  // Real-time Mifflin-St Jeor Calculation
  const { bmr, calculatedTdee } = useMemo(() => {
    return calculateMifflinStJeor(gender, currentWeightKg, heightCm, age, activityMultiplier);
  }, [gender, currentWeightKg, heightCm, age, activityMultiplier]);

  // Equipment toggle handlers
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

  const handleFinishOnboarding = async () => {
    if (!currentUser?.uid) return;
    setSubmitting(true);
    try {
      await saveUserProfile(currentUser.uid, {
        gender,
        age,
        heightCm,
        currentWeightKg,
        targetWeightKg,
        activityMultiplier,
        experienceLevel,
        calculatedTdee,
        bmr,
        equipment: selectedEquipment,
        onboardingCompleted: true,
      });

      navigate('/', { replace: true });
    } catch (err) {
      console.error('Failed to save onboarding profile:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
        Loading user onboarding profile...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-2 sm:py-6 space-y-6">
      {/* Wizard Progress Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <img
              src="./logo.png"
              alt="FitMaintenance AI Logo"
              className="w-10 h-10 rounded-xl object-cover shadow-md shadow-emerald-500/20"
            />
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Athlete Onboarding & Machine Inventory
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Step {currentStep} of 4: {currentStep === 1 ? 'Baseline Metrics' : currentStep === 2 ? 'Experience Level' : currentStep === 3 ? 'Machine Inventory' : 'Review & TDEE'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {Math.round((currentStep / 4) * 100)}% Complete
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* ================= STEP 1: BASELINE BIOMETRICS ================= */}
      {currentStep === 1 && (
        <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>1. Baseline Profile & Caloric Parameters</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Used by the Mifflin-St Jeor engine to compute your Basal Metabolic Rate and maintenance baseline.
            </p>
          </div>

          {/* Biological Sex */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Biological Sex
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-3 px-4 rounded-xl text-xs font-bold border transition flex items-center justify-between min-h-[48px] ${
                  gender === 'male'
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>Male</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30">
                  +5 kcal
                </span>
              </button>

              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-3 px-4 rounded-xl text-xs font-bold border transition flex items-center justify-between min-h-[48px] ${
                  gender === 'female'
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>Female</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30">
                  -161 kcal
                </span>
              </button>
            </div>
          </div>

          {/* Age & Height */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Age</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{age} years</span>
              </div>
              <input
                type="number"
                min="14"
                max="95"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 min-h-[48px]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Height</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{heightCm} cm</span>
              </div>
              <input
                type="number"
                min="120"
                max="230"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 min-h-[48px]"
              />
            </div>
          </div>

          {/* Current Weight & Target Maintenance Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Current Weight</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{currentWeightKg} kg</span>
              </div>
              <input
                type="number"
                min="35"
                max="180"
                step="0.5"
                value={currentWeightKg}
                onChange={(e) => setCurrentWeightKg(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 min-h-[48px]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Target Maintenance Weight</span>
                <span className="text-teal-600 dark:text-teal-400 font-bold">{targetWeightKg} kg</span>
              </div>
              <input
                type="number"
                min="35"
                max="180"
                step="0.5"
                value={targetWeightKg}
                onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 min-h-[48px]"
              />
            </div>
          </div>

          {/* Activity Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Daily Activity & Training Frequency
            </label>
            <select
              value={activityMultiplier}
              onChange={(e) => setActivityMultiplier(Number(e.target.value))}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 min-h-[48px]"
            >
              <option value={1.2}>Sedentary (Desk job, little to no weekly exercise)</option>
              <option value={1.375}>Lightly Active (Light exercise 1-3 days/week)</option>
              <option value={1.55}>Moderately Active (Moderate training 3-5 days/week)</option>
              <option value={1.725}>Very Active (Intense training 6-7 days/week)</option>
              <option value={1.9}>Athlete / Heavy Physical Demand (2x daily sessions)</option>
            </select>
          </div>

          {/* Live Calculated TDEE Preview on Step 1 */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block">
                Calculated Maintenance (TDEE)
              </span>
              <span className="text-xl font-black text-emerald-900 dark:text-white">
                {calculatedTdee.toLocaleString()} kcal/day
              </span>
            </div>
            <span className="text-xs text-slate-600 dark:text-slate-400">BMR: {bmr.toLocaleString()} kcal</span>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm inline-flex items-center gap-2 shadow-md min-h-[48px] transition"
            >
              <span>Next: Experience Level</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: EXPERIENCE LEVEL ================= */}
      {currentStep === 2 && (
        <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>2. Experience Level & AI Tone Intensity</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Dictates training volume thresholds, RPE tracking, and the pedagogical tone of your Gemini AI Coach.
            </p>
          </div>

          <div className="space-y-3.5">
            {/* Beginner */}
            <div
              onClick={() => setExperienceLevel('beginner')}
              className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition flex items-start gap-3.5 ${
                experienceLevel === 'beginner'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  experienceLevel === 'beginner' ? 'bg-emerald-500 text-slate-950 font-bold' : 'border border-slate-300 dark:border-slate-700'
                }`}
              >
                {experienceLevel === 'beginner' && <Check className="w-4 h-4 stroke-[3]" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Beginner (0 - 1 Years)</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                    Instructional & Form
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Focuses on foundational compound mechanics, motor unit recruitment, safety cues, and conservative volume (8-12 sets/muscle/week).
                </p>
                <div className="mt-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> AI Tone: Supportive, educational, conservative progressive overload.
                </div>
              </div>
            </div>

            {/* Intermediate */}
            <div
              onClick={() => setExperienceLevel('intermediate')}
              className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition flex items-start gap-3.5 ${
                experienceLevel === 'intermediate'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  experienceLevel === 'intermediate' ? 'bg-emerald-500 text-slate-950 font-bold' : 'border border-slate-300 dark:border-slate-700'
                }`}
              >
                {experienceLevel === 'intermediate' && <Check className="w-4 h-4 stroke-[3]" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Intermediate (1 - 3 Years)</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-500/30">
                    Hypertrophy & RPE
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Focuses on hypertrophy periodization, proximity to muscular failure (RPE 7-9), volume accumulation (12-18 sets/week), and systematic deloads.
                </p>
                <div className="mt-2 text-[11px] font-semibold text-teal-700 dark:text-teal-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> AI Tone: Analytical, volume-focused, progressive overload metrics.
                </div>
              </div>
            </div>

            {/* Pro / Advanced */}
            <div
              onClick={() => setExperienceLevel('pro')}
              className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition flex items-start gap-3.5 ${
                experienceLevel === 'pro'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  experienceLevel === 'pro' ? 'bg-emerald-500 text-slate-950 font-bold' : 'border border-slate-300 dark:border-slate-700'
                }`}
              >
                {experienceLevel === 'pro' && <Check className="w-4 h-4 stroke-[3]" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pro / Advanced (3+ Years)</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-500/30">
                    MRV & High-Intensity
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Maximum Recoverable Volume (MRV) management, advanced failure techniques (myo-reps, drop sets), fatigue autoregulation, and precision metabolic tuning.
                </p>
                <div className="mt-2 text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> AI Tone: Direct, high-intensity, micro-cycle fatigue autoregulation.
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 min-h-[48px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm inline-flex items-center gap-2 shadow-md min-h-[48px] transition"
            >
              <span>Next: Gym Inventory</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: GRANULAR MACHINE INVENTORY ================= */}
      {currentStep === 3 && (
        <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>3. Granular Gym Machine Inventory</span>
              </h2>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {selectedEquipment.length} Selected
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select the machines and equipment you have access to. FitMaintenance AI only generates workouts based on this inventory.
            </p>
          </div>

          <div className="space-y-6">
            {EQUIPMENT_CATALOG.map((catGroup) => {
              const allCategorySelected = catGroup.items.every((item) =>
                selectedEquipment.includes(item)
              );

              return (
                <div
                  key={catGroup.category}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {catGroup.category}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {catGroup.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleCategory(catGroup.items)}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1"
                    >
                      {allCategorySelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {catGroup.items.map((item) => {
                      const isSelected = selectedEquipment.includes(item);
                      return (
                        <div
                          key={item}
                          onClick={() => toggleEquipment(item)}
                          className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between min-h-[48px] select-none ${
                            isSelected
                              ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-sm text-slate-900 dark:text-white'
                              : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <span className="text-xs font-semibold">{item}</span>
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center transition ${
                              isSelected
                                ? 'bg-emerald-500 text-slate-950 font-bold'
                                : 'border border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 min-h-[48px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm inline-flex items-center gap-2 shadow-md min-h-[48px] transition"
            >
              <span>Next: Summary & Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 4: SUMMARY & TDEE CONFIRMATION ================= */}
      {currentStep === 4 && (
        <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>4. Profile Summary & Calculated TDEE Review</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Verify your metrics before syncing directly to your Firestore profile (<code className="text-emerald-600 dark:text-emerald-400 font-mono">users/{currentUser?.uid}</code>).
            </p>
          </div>

          {/* Primary TDEE Metric Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white dark:via-slate-900 to-teal-500/10 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                Mifflin-St Jeor Engine
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold shadow-sm">
                Active Target
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white">
                {calculatedTdee.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">kcal / day (TDEE)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">BMR</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{bmr.toLocaleString()} kcal</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Current Weight</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{currentWeightKg} kg</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Target Weight</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{targetWeightKg} kg</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Weight Delta</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {targetWeightKg === currentWeightKg
                    ? '0 kg (Maintenance)'
                    : targetWeightKg > currentWeightKg
                    ? `+${(targetWeightKg - currentWeightKg).toFixed(1)} kg`
                    : `${(targetWeightKg - currentWeightKg).toFixed(1)} kg`}
                </span>
              </div>
            </div>
          </div>

          {/* Experience & AI Persona Review */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                  {experienceLevel} Athlete
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  AI feedback volume tuned to {experienceLevel} threshold
                </div>
              </div>
            </div>
            <button
              onClick={() => setCurrentStep(2)}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Change
            </button>
          </div>

          {/* Equipment Inventory Review */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Available Equipment ({selectedEquipment.length} Selected)
              </div>
              <button
                onClick={() => setCurrentStep(3)}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Edit Machines
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedEquipment.map((eq) => (
                <span
                  key={eq}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-xs"
                >
                  {eq}
                </span>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 min-h-[48px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleFinishOnboarding}
              className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm inline-flex items-center gap-2 shadow-lg shadow-emerald-500/25 min-h-[48px] transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{submitting ? 'Saving to Firestore...' : 'Launch FitMaintenance AI'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;

