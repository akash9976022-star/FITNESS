import React, { useState, useMemo } from 'react';
import {
  Flame,
  Calculator,
  Scale,
  Zap,
} from 'lucide-react';

export const Nutrition: React.FC = () => {
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [weightKg, setWeightKg] = useState(78);
  const [heightCm, setHeightCm] = useState(178);
  const [age, setAge] = useState(27);
  const [activityMultiplier, setActivityMultiplier] = useState(1.55); // Moderately active
  const [goal, setGoal] = useState<'maintain' | 'lean_bulk' | 'cut'>('maintain');

  // Mifflin-St Jeor Formula
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
    // Protein: 2.0g per kg
    const protein = Math.round(weightKg * 2.0);
    const proteinKcal = protein * 4;

    // Fats: 25% of target
    const fatsKcal = target * 0.25;
    const fats = Math.round(fatsKcal / 9);

    // Carbs: remaining kcal
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Maintenance Calorie & Macro Engine
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Scientifically computed using the Mifflin-St Jeor metabolic expenditure equation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-5 p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-sm font-bold text-white">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span>Biometric Parameters</span>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Biological Sex</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  gender === 'male'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Male (+5 kcal)
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  gender === 'female'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Female (-161 kcal)
              </button>
            </div>
          </div>

          {/* Weight & Height */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Body Weight ({weightKg} kg)
              </label>
              <input
                type="range"
                min="40"
                max="160"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Height ({heightCm} cm)
              </label>
              <input
                type="range"
                min="130"
                max="220"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>

          {/* Age */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1">
              <span>Age</span>
              <span className="text-emerald-400 font-bold">{age} years</span>
            </div>
            <input
              type="range"
              min="16"
              max="90"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          {/* Activity Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Daily Activity & Training Frequency
            </label>
            <select
              value={activityMultiplier}
              onChange={(e) => setActivityMultiplier(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value={1.2}>Sedentary (Desk job, little to no exercise)</option>
              <option value={1.375}>Lightly Active (Light workout 1-3 days/week)</option>
              <option value={1.55}>Moderately Active (Moderate workout 3-5 days/week)</option>
              <option value={1.725}>Very Active (Hard workout 6-7 days/week)</option>
              <option value={1.9}>Athlete / Physical Job (Heavy 2x daily training)</option>
            </select>
          </div>

          {/* Goal Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Caloric Target Objective</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setGoal('maintain')}
                className={`py-2.5 px-2 rounded-xl text-xs font-semibold border text-center transition ${
                  goal === 'maintain'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Maintenance
              </button>
              <button
                type="button"
                onClick={() => setGoal('lean_bulk')}
                className={`py-2.5 px-2 rounded-xl text-xs font-semibold border text-center transition ${
                  goal === 'lean_bulk'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Lean Surplus (+250)
              </button>
              <button
                type="button"
                onClick={() => setGoal('cut')}
                className={`py-2.5 px-2 rounded-xl text-xs font-semibold border text-center transition ${
                  goal === 'cut'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Fat Loss (-450)
              </button>
            </div>
          </div>
        </div>

        {/* Right Output: Calculations & Macros (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Calorie Output */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-emerald-500/30">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4" /> Recommended Intake
              </span>
              <span className="capitalize">{goal.replace('_', ' ')}</span>
            </div>

            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-black text-white tracking-tight">
                {targetCalories.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-slate-400">kcal / day</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Basal Metabolic Rate (BMR)</span>
                <span className="font-bold text-slate-200">{bmr.toLocaleString()} kcal</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Baseline TDEE</span>
                <span className="font-bold text-slate-200">{tdee.toLocaleString()} kcal</span>
              </div>
            </div>
          </div>

          {/* Macro Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>Target Macronutrient Distribution</span>
            </h3>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Protein */}
              <div className="p-3 rounded-xl bg-slate-950 border border-rose-500/30 text-center">
                <span className="text-[10px] uppercase font-bold text-rose-400 block mb-0.5">Protein</span>
                <span className="text-xl font-black text-white">{proteinGrams}g</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{proteinGrams * 4} kcal</span>
              </div>

              {/* Carbs */}
              <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-400 block mb-0.5">Carbs</span>
                <span className="text-xl font-black text-white">{carbsGrams}g</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{carbsGrams * 4} kcal</span>
              </div>

              {/* Fats */}
              <div className="p-3 rounded-xl bg-slate-950 border border-teal-500/30 text-center">
                <span className="text-[10px] uppercase font-bold text-teal-400 block mb-0.5">Fats</span>
                <span className="text-xl font-black text-white">{fatsGrams}g</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{fatsGrams * 9} kcal</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-300">
              <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                Maintenance calories represent energy balance equilibrium. High protein intake (2g/kg) guarantees
                muscle retention while stabilizing glycogen stores.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Nutrition;
