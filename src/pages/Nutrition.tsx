import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  Calculator,
  Scale,
  Zap,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeUserBiometrics,
  saveUserBiometrics,
  type UserBiometrics,
} from '../services/firestoreService';

export const Nutrition: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);

  // Biometrics state (100% dynamic from Firestore)
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [weightKg, setWeightKg] = useState<number>(70);
  const [heightCm, setHeightCm] = useState<number>(175);
  const [age, setAge] = useState<number>(25);
  const [activityMultiplier, setActivityMultiplier] = useState<number>(1.55);
  const [goal, setGoal] = useState<'maintain' | 'lean_bulk' | 'cut'>('maintain');

  // Real-time Firestore Subscription (Zero Mock Data)
  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeUserBiometrics(currentUser.uid, (data) => {
      if (data) {
        setGender(data.gender || 'male');
        setWeightKg(data.weightKg || 70);
        setHeightCm(data.heightCm || 175);
        setAge(data.age || 25);
        setActivityMultiplier(data.activityMultiplier || 1.55);
        setGoal(data.goal || 'maintain');
        setHasProfile(true);
      } else {
        setHasProfile(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const handleSaveToFirestore = async (customBiometrics?: Partial<UserBiometrics>) => {
    if (!currentUser?.uid) return;
    const toSave: UserBiometrics = {
      gender: customBiometrics?.gender || gender,
      weightKg: customBiometrics?.weightKg !== undefined ? customBiometrics.weightKg : weightKg,
      heightCm: customBiometrics?.heightCm !== undefined ? customBiometrics.heightCm : heightCm,
      age: customBiometrics?.age !== undefined ? customBiometrics.age : age,
      activityMultiplier:
        customBiometrics?.activityMultiplier !== undefined
          ? customBiometrics.activityMultiplier
          : activityMultiplier,
      goal: customBiometrics?.goal || goal,
    };

    try {
      await saveUserBiometrics(currentUser.uid, toSave);
      setHasProfile(true);
      setSavedStatus('Synced to Firestore in real-time');
      setTimeout(() => setSavedStatus(null), 2500);
    } catch (e) {
      console.error('Failed to save biometrics:', e);
    }
  };

  // Scientific Mifflin-St Jeor Formula
  const { bmr, tdee, targetCalories, proteinGrams, carbsGrams, fatsGrams } = useMemo(() => {
    let baseBmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
    if (gender === 'male') {
      baseBmr += 5;
    } else {
      baseBmr -= 161;
    }

    const calculatedTdee = Math.round(baseBmr * activityMultiplier);

    let target = calculatedTdee;
    if (goal === 'lean_bulk') target = calculatedTdee + 250;
    if (goal === 'cut') target = calculatedTdee - 450;

    // Macro distribution:
    // Protein: 2.0g per kg bodyweight
    const protein = Math.round(weightKg * 2.0);
    const proteinKcal = protein * 4;

    // Fats: 25% of target
    const fatsKcal = target * 0.25;
    const fats = Math.round(fatsKcal / 9);

    // Carbs: remainder
    const carbsKcal = Math.max(0, target - proteinKcal - fatsKcal);
    const carbs = Math.round(carbsKcal / 4);

    return {
      bmr: Math.round(baseBmr),
      tdee: calculatedTdee,
      targetCalories: target,
      proteinGrams: protein,
      carbsGrams: carbs,
      fatsGrams: fats,
    };
  }, [gender, weightKg, heightCm, age, activityMultiplier, goal]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
        Retrieving user biometrics from Firestore...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Maintenance Calorie & Macro Engine
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Mifflin-St Jeor metabolic expenditure calculations synced in real-time to Firestore.
          </p>
        </div>

        {savedStatus && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {savedStatus}
          </span>
        )}
      </div>

      {!hasProfile && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Zero-Mock-Data Policy Active</p>
            <p className="mt-0.5 text-amber-700 dark:text-amber-300">
              You do not have stored biometric records yet. Adjust your weight, height, age, and activity below, then click "Save Biometrics" to sync your real metabolic profile to Firestore!
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Inputs (7 cols) with Solid Card Opacity */}
        <div className="lg:col-span-7 space-y-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Biometric Parameters</span>
            </div>
            <button
              onClick={() => handleSaveToFirestore()}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 shadow"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Biometrics</span>
            </button>
          </div>

          {/* Biological Sex */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Biological Sex
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setGender('male');
                  handleSaveToFirestore({ gender: 'male' });
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  gender === 'male'
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Male (+5 kcal)
              </button>
              <button
                type="button"
                onClick={() => {
                  setGender('female');
                  handleSaveToFirestore({ gender: 'female' });
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  gender === 'female'
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Female (-161 kcal)
              </button>
            </div>
          </div>

          {/* Weight & Height */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Weight</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{weightKg} kg</span>
              </div>
              <input
                type="range"
                min="35"
                max="160"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                onMouseUp={() => handleSaveToFirestore()}
                onTouchEnd={() => handleSaveToFirestore()}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Height</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{heightCm} cm</span>
              </div>
              <input
                type="range"
                min="130"
                max="220"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                onMouseUp={() => handleSaveToFirestore()}
                onTouchEnd={() => handleSaveToFirestore()}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Age */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <span>Age</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{age} years</span>
            </div>
            <input
              type="range"
              min="16"
              max="90"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              onMouseUp={() => handleSaveToFirestore()}
              onTouchEnd={() => handleSaveToFirestore()}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Activity Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Daily Activity & Training Frequency
            </label>
            <select
              value={activityMultiplier}
              onChange={(e) => {
                const val = Number(e.target.value);
                setActivityMultiplier(val);
                handleSaveToFirestore({ activityMultiplier: val });
              }}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value={1.2}>Sedentary (Desk job, little to no exercise)</option>
              <option value={1.375}>Lightly Active (Light workout 1-3 days/week)</option>
              <option value={1.55}>Moderately Active (Moderate workout 3-5 days/week)</option>
              <option value={1.725}>Very Active (Hard workout 6-7 days/week)</option>
              <option value={1.9}>Athlete / Physical Job (Heavy 2x daily training)</option>
            </select>
          </div>

          {/* Caloric Objective Goal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Caloric Target Objective
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setGoal('maintain');
                  handleSaveToFirestore({ goal: 'maintain' });
                }}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border text-center transition ${
                  goal === 'maintain'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Maintenance
              </button>
              <button
                type="button"
                onClick={() => {
                  setGoal('lean_bulk');
                  handleSaveToFirestore({ goal: 'lean_bulk' });
                }}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border text-center transition ${
                  goal === 'lean_bulk'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Surplus (+250)
              </button>
              <button
                type="button"
                onClick={() => {
                  setGoal('cut');
                  handleSaveToFirestore({ goal: 'cut' });
                }}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border text-center transition ${
                  goal === 'cut'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Deficit (-450)
              </button>
            </div>
          </div>
        </div>

        {/* Right Output: Calculations & Macros (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Calorie Output with warm amber highlights for calorie alert */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 fill-current" /> Caloric Target Alert
              </span>
              <span className="capitalize px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-500/30">
                {goal.replace('_', ' ')}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {targetCalories.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">kcal / day</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">
                  Basal Metabolic Rate
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{bmr.toLocaleString()} kcal</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">
                  Maintenance TDEE
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{tdee.toLocaleString()} kcal</span>
              </div>
            </div>
          </div>

          {/* Macro Breakdown with solid card surfaces */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Target Macronutrient Distribution</span>
            </h3>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Protein */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-rose-300 dark:border-rose-500/30 text-center">
                <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block mb-0.5">
                  Protein
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{proteinGrams}g</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                  {proteinGrams * 4} kcal
                </span>
              </div>

              {/* Carbs */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-amber-300 dark:border-amber-500/30 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                  Carbs
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{carbsGrams}g</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                  {carbsGrams * 4} kcal
                </span>
              </div>

              {/* Fats */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-teal-300 dark:border-teal-500/30 text-center">
                <span className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400 block mb-0.5">
                  Fats
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{fatsGrams}g</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                  {fatsGrams * 9} kcal
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
              <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                Protein is anchored at 2.0g per kg of your real weight ({weightKg} kg) to ensure complete nitrogen balance and muscle protein synthesis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Nutrition;
