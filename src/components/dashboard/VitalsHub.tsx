import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Droplet,
  Footprints,
  Activity,
  Plus,
  Minus,
  Scale,
  TrendingUp,
  Flame,
} from 'lucide-react';
import type { BmiCategory } from '../../types/auth';

interface VitalsHubProps {
  onOpenCheckInModal?: () => void;
  latestWeightKg?: number;
}

export const VitalsHub: React.FC<VitalsHubProps> = ({
  onOpenCheckInModal,
  latestWeightKg,
}) => {
  const { userProfile, user } = useAuth();

  const todayStr = new Date().toISOString().split('T')[0];
  const userKey = user?.uid || 'guest';

  // Water Intake State
  const waterStorageKey = `fitmaintenance_water_${userKey}_${todayStr}`;
  const [waterLogged, setWaterLogged] = useState<number>(() => {
    const saved = localStorage.getItem(waterStorageKey);
    return saved ? parseInt(saved, 10) : 1750;
  });
  const waterGoal = userProfile.waterGoalMl || 3000;

  // Daily Steps State
  const stepsStorageKey = `fitmaintenance_steps_${userKey}_${todayStr}`;
  const [stepsLogged, setStepsLogged] = useState<number>(() => {
    const saved = localStorage.getItem(stepsStorageKey);
    return saved ? parseInt(saved, 10) : 6850;
  });
  const stepGoal = userProfile.stepGoal || 10000;

  // Custom Step Modal State
  const [showCustomStepInput, setShowCustomStepInput] = useState(false);
  const [customStepVal, setCustomStepVal] = useState('');

  // Persist water to storage
  const handleUpdateWater = (deltaMl: number) => {
    setWaterLogged((prev) => {
      const next = Math.max(0, Math.min(10000, prev + deltaMl));
      localStorage.setItem(waterStorageKey, next.toString());
      return next;
    });
  };

  // Persist steps to storage
  const handleUpdateSteps = (deltaSteps: number) => {
    setStepsLogged((prev) => {
      const next = Math.max(0, Math.min(100000, prev + deltaSteps));
      localStorage.setItem(stepsStorageKey, next.toString());
      return next;
    });
  };

  // Custom step input submit
  const handleSetCustomSteps = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customStepVal, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setStepsLogged(parsed);
      localStorage.setItem(stepsStorageKey, parsed.toString());
      setShowCustomStepInput(false);
      setCustomStepVal('');
    }
  };

  // -------------------------------------------------------------
  // BMI (Body Mass Index) Calculation
  // -------------------------------------------------------------
  const currentWeight = latestWeightKg || userProfile.weightKg || 75;
  const currentHeightCm = userProfile.heightCm || 178;
  const heightM = Math.max(0.5, currentHeightCm / 100);

  const bmiVal = parseFloat((currentWeight / (heightM * heightM)).toFixed(1));
  const healthyMinKg = parseFloat((18.5 * heightM * heightM).toFixed(1));
  const healthyMaxKg = parseFloat((24.9 * heightM * heightM).toFixed(1));

  let bmiCategory: BmiCategory = 'Normal';
  let bmiColor = 'text-emerald-400';
  let bmiBadgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  let gaugeNeedlePercent = 50;

  if (bmiVal < 18.5) {
    bmiCategory = 'Underweight';
    bmiColor = 'text-sky-400';
    bmiBadgeBg = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
    gaugeNeedlePercent = Math.max(5, (bmiVal / 18.5) * 25);
  } else if (bmiVal <= 24.9) {
    bmiCategory = 'Normal';
    bmiColor = 'text-emerald-400';
    bmiBadgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    gaugeNeedlePercent = 25 + ((bmiVal - 18.5) / (24.9 - 18.5)) * 30;
  } else if (bmiVal <= 29.9) {
    bmiCategory = 'Overweight';
    bmiColor = 'text-amber-400';
    bmiBadgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    gaugeNeedlePercent = 55 + ((bmiVal - 25.0) / (29.9 - 25.0)) * 25;
  } else {
    bmiCategory = 'Obese';
    bmiColor = 'text-rose-400';
    bmiBadgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    gaugeNeedlePercent = Math.min(98, 80 + ((bmiVal - 30) / 10) * 18);
  }

  // Calculated Metrics
  const distanceKm = (stepsLogged * 0.00076).toFixed(1);
  const neatCaloriesBurned = Math.round(stepsLogged * 0.04);
  const waterPercent = Math.min(100, Math.round((waterLogged / waterGoal) * 100));
  const stepsPercent = Math.min(100, Math.round((stepsLogged / stepGoal) * 100));

  return (
    <div className="space-y-4">
      {/* Vitals Hub Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 shadow-sm">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Daily Biometrics & Vitals</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Real-time hydration, non-exercise activity (NEAT), and mass equilibrium.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">
          Target: Equilibrium Corridor
        </span>
      </div>

      {/* Grid of 3 Primary Vitals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* =========================================================
            CARD 1: WATER INTAKE (HYDRATION)
        ========================================================= */}
        <div className="rounded-3xl p-5 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 shadow-lg flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Header */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300 flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                Water Intake
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                {waterPercent}%
              </span>
            </div>

            {/* Current Level */}
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{waterLogged.toLocaleString()}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/ {waterGoal.toLocaleString()} ml</span>
            </div>

            {/* Visual Fluid Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800/90 h-3 rounded-full overflow-hidden mt-3 p-0.5 border border-slate-200 dark:border-slate-700/50">
              <div
                className="bg-gradient-to-r from-cyan-500 via-sky-400 to-teal-300 h-full rounded-full transition-all duration-500 shadow-sm shadow-cyan-500/50"
                style={{ width: `${waterPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 mt-2 font-mono">
              <span>{Math.max(0, waterGoal - waterLogged)} ml remaining</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                {waterLogged >= waterGoal ? 'Optimal State' : 'Hydrating'}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => handleUpdateWater(250)}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500 text-cyan-700 dark:text-cyan-300 hover:text-slate-950 text-xs font-bold border border-cyan-500/30 transition-all flex items-center gap-1 shadow-sm"
              title="Add a 250ml cup of water"
            >
              <Plus className="w-3 h-3" />
              <span>250ml</span>
            </button>
            <button
              onClick={() => handleUpdateWater(500)}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500 text-cyan-700 dark:text-cyan-300 hover:text-slate-950 text-xs font-bold border border-cyan-500/30 transition-all flex items-center gap-1 shadow-sm"
              title="Add a 500ml water bottle"
            >
              <Plus className="w-3 h-3" />
              <span>500ml</span>
            </button>
            <button
              onClick={() => handleUpdateWater(750)}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500 text-cyan-700 dark:text-cyan-300 hover:text-slate-950 text-xs font-bold border border-cyan-500/30 transition-all flex items-center gap-1 shadow-sm"
              title="Add a 750ml shaker bottle"
            >
              <Plus className="w-3 h-3" />
              <span>750ml</span>
            </button>
            <button
              onClick={() => handleUpdateWater(-250)}
              disabled={waterLogged === 0}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white disabled:opacity-30 border border-slate-200 dark:border-slate-700/60 transition-all ml-auto shadow-sm"
              title="Undo 250ml"
            >
              <Minus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* =========================================================
            CARD 2: TOTAL STEPS (NEAT EXPENDITURE)
        ========================================================= */}
        <div className="rounded-3xl p-5 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 shadow-lg flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Header */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <Footprints className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                Total Steps
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                {stepsPercent}%
              </span>
            </div>

            {/* Current Level */}
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{stepsLogged.toLocaleString()}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/ {stepGoal.toLocaleString()}</span>
            </div>

            {/* Visual Step Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800/90 h-3 rounded-full overflow-hidden mt-3 p-0.5 border border-slate-200 dark:border-slate-700/50">
              <div
                className="bg-gradient-to-r from-amber-500 via-orange-400 to-brand-400 h-full rounded-full transition-all duration-500 shadow-sm shadow-amber-500/50"
                style={{ width: `${stepsPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 mt-2 font-mono">
              <span className="flex items-center gap-1 text-slate-700 dark:text-slate-200 font-medium">
                <TrendingUp className="w-3 h-3 text-brand-500 dark:text-brand-400" /> {distanceKm} km
              </span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                <Flame className="w-3 h-3 text-amber-500 dark:text-amber-400" /> ~{neatCaloriesBurned} kcal
              </span>
            </div>
          </div>

          {/* Quick Step Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => handleUpdateSteps(500)}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-slate-950 text-xs font-bold border border-amber-500/30 transition-all flex items-center gap-1 shadow-sm"
              title="Add 500 steps (short walk)"
            >
              <Plus className="w-3 h-3" />
              <span>500</span>
            </button>
            <button
              onClick={() => handleUpdateSteps(1000)}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-slate-950 text-xs font-bold border border-amber-500/30 transition-all flex items-center gap-1 shadow-sm"
              title="Add 1,000 steps"
            >
              <Plus className="w-3 h-3" />
              <span>1k</span>
            </button>
            <button
              onClick={() => handleUpdateSteps(2500)}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-slate-950 text-xs font-bold border border-amber-500/30 transition-all flex items-center gap-1 shadow-sm"
              title="Add 2,500 steps (long walk)"
            >
              <Plus className="w-3 h-3" />
              <span>2.5k</span>
            </button>
            <button
              onClick={() => setShowCustomStepInput(!showCustomStepInput)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700/60 transition-all ml-auto shadow-sm"
            >
              Set
            </button>
          </div>

          {showCustomStepInput && (
            <form onSubmit={handleSetCustomSteps} className="mt-2 flex gap-1.5">
              <input
                type="number"
                min={0}
                max={100000}
                value={customStepVal}
                onChange={(e) => setCustomStepVal(e.target.value)}
                placeholder="Exact step count..."
                className="flex-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-amber-500 shadow-sm"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-amber-500 text-slate-950 font-black text-xs rounded-lg shadow-sm"
              >
                Save
              </button>
            </form>
          )}
        </div>

        {/* =========================================================
            CARD 3: BODY MASS INDEX (BMI)
        ========================================================= */}
        <div className="rounded-3xl p-5 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 shadow-lg flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Header */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                Body Mass Index (BMI)
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${bmiBadgeBg}`}>
                {bmiCategory}
              </span>
            </div>

            {/* BMI Value Display */}
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-3xl font-black font-mono ${bmiColor}`}>{bmiVal}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">kg/m² ({currentWeight} kg / {currentHeightCm} cm)</span>
            </div>

            {/* Visual Multi-Zone BMI Gauge Spectrum */}
            <div className="mt-3">
              <div className="relative w-full h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700/50 flex">
                <div className="w-[25%] bg-sky-500/70 h-full rounded-l-full" title="Underweight (< 18.5)" />
                <div className="w-[30%] bg-emerald-500/80 h-full" title="Normal Corridor (18.5 - 24.9)" />
                <div className="w-[25%] bg-amber-500/80 h-full" title="Overweight (25 - 29.9)" />
                <div className="w-[20%] bg-rose-500/80 h-full rounded-r-full" title="Obese (≥ 30)" />

                {/* Needle Indicator */}
                <div
                  className="absolute top-0 bottom-0 w-2.5 bg-slate-900 dark:bg-white rounded-full shadow-md -translate-x-1/2 transition-all duration-500"
                  style={{ left: `${gaugeNeedlePercent}%` }}
                />
              </div>

              {/* Spectrum Labels */}
              <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1.5">
                <span className="text-sky-600 dark:text-sky-400 font-medium">Under &lt;18.5</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">18.5 - 24.9</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">25 - 29.9</span>
                <span className="text-rose-600 dark:text-rose-400 font-medium">30+</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-2 font-mono flex items-center justify-between">
              <span>Ideal Corridor:</span>
              <span className="text-slate-900 dark:text-white font-bold">{healthyMinKg} – {healthyMaxKg} kg</span>
            </div>
          </div>

          {/* BMI Maintenance Recommendation */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              {bmiCategory === 'Normal'
                ? 'Prime maintenance balance achieved'
                : `Target: ${healthyMinKg}-${healthyMaxKg} kg range`}
            </span>
            {onOpenCheckInModal && (
              <button
                onClick={onOpenCheckInModal}
                className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 transition-colors flex items-center gap-1"
              >
                <span>Weigh-in</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
