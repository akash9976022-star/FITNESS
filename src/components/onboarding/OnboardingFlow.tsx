import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { calculateMifflinStJeor } from '../../utils/calculator';
import { EQUIPMENT_CATALOG, type EquipmentItem } from '../../data/equipmentCatalog';
import type { Gender, ActivityLevel } from '../../types/auth';
import {
  Sparkles,
  Dumbbell,
  Check,
  ArrowRight,
  ArrowLeft,
  Flame,
  ShieldCheck,
  CheckCircle2,
  Bot,
  Search,
  CheckSquare,
  Square,
  Cpu,
  Layers,
} from 'lucide-react';

export const OnboardingFlow: React.FC = () => {
  const { saveOnboardingData } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 1: Questionnaire state
  const [age, setAge] = useState<number>(26);
  const [gender, setGender] = useState<Gender>('male');
  const [heightCm, setHeightCm] = useState<number>(178);
  const [weightKg, setWeightKg] = useState<number>(75);
  const [targetMaintenanceWeightKg, setTargetMaintenanceWeightKg] = useState<number>(75);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');

  // Step 2: Granular Equipment & Machine Inventory State
  // Default to common core gym equipment
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([
    'lat_pulldown',
    'cable_crossover',
    'seated_cable_row',
    'leg_press',
    'leg_extension',
    'hamstring_curl',
    'chest_press_machine',
    'barbell',
    'dumbbells',
    'adjustable_bench',
    'pull_up_bar',
  ]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  // Real-time calculation using Mifflin-St Jeor
  const calculatedMacros = calculateMifflinStJeor({
    age,
    gender,
    weightKg,
    heightCm,
    activityLevel,
  });

  // Toggle single item
  const toggleItem = (id: string) => {
    setSelectedEquipment((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one item
        return prev.filter((i) => i !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Toggle all items in a specific category
  const toggleCategoryAll = (categoryItems: EquipmentItem[]) => {
    const categoryIds = categoryItems.map((i) => i.id);
    const allSelected = categoryIds.every((id) => selectedEquipment.includes(id));

    if (allSelected) {
      // Deselect all in category (ensure at least 1 remains overall)
      setSelectedEquipment((prev) => {
        const filtered = prev.filter((id) => !categoryIds.includes(id));
        return filtered.length > 0 ? filtered : ['bodyweight_only'];
      });
    } else {
      // Select all in category
      setSelectedEquipment((prev) => Array.from(new Set([...prev, ...categoryIds])));
    }
  };

  // Presets
  const applyPreset = (preset: 'commercial' | 'home' | 'minimal') => {
    if (preset === 'commercial') {
      const allExceptNone = EQUIPMENT_CATALOG.flatMap((cat) => cat.items)
        .filter((i) => i.id !== 'bodyweight_only')
        .map((i) => i.id);
      setSelectedEquipment(allExceptNone);
    } else if (preset === 'home') {
      setSelectedEquipment([
        'dumbbells',
        'adjustable_bench',
        'pull_up_bar',
        'resistance_bands',
        'yoga_mat',
      ]);
    } else if (preset === 'minimal') {
      setSelectedEquipment(['bodyweight_only', 'resistance_bands', 'yoga_mat']);
    }
  };

  const handleFinishOnboarding = async () => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      await saveOnboardingData({
        age,
        gender,
        heightCm,
        weightKg,
        targetMaintenanceWeightKg,
        activityLevel,
        equipment: selectedEquipment,
        targetCalories: calculatedMacros.tdee,
        targetProtein: calculatedMacros.targetProtein,
        targetCarbs: calculatedMacros.targetCarbs,
        targetFats: calculatedMacros.targetFats,
        waterGoalMl: calculatedMacros.waterGoalMl,
      });
    } catch (err: any) {
      console.error('Failed to save to Firestore:', err);
      setErrorMessage(
        err.message || 'Failed to sync profile to Cloud Firestore. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Filter equipment catalog
  const filteredCatalog = EQUIPMENT_CATALOG.map((cat) => {
    if (activeCategoryFilter !== 'all' && cat.category !== activeCategoryFilter) {
      return null;
    }
    const matchingItems = cat.items.filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });

    if (matchingItems.length === 0) return null;

    return {
      ...cat,
      items: matchingItems,
    };
  }).filter(Boolean) as typeof EQUIPMENT_CATALOG;

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-3 sm:p-6 lg:p-8 relative overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] right-[-10%] w-[550px] h-[550px] bg-brand-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[550px] h-[550px] bg-teal-500/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-3xl relative z-10 my-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 to-teal-400 flex items-center justify-center shadow-glow">
              <Dumbbell className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                FitMaintenance <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-teal-300">AI</span>
              </h1>
              <p className="text-xs text-slate-400">Athlete Calibration & Machine Inventory</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono font-bold text-brand-400">Step {step} of 3</span>
            <div className="text-[11px] text-slate-400">
              {step === 1 && 'Physical Questionnaire'}
              {step === 2 && 'Equipment Inventory'}
              {step === 3 && 'Blueprint & Save'}
            </div>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-slate-900 h-2 rounded-full mb-6 overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-teal-400 transition-all duration-500 rounded-full shadow-glow"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3 animate-shake">
            <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* STEP 1: PHYSICAL PROFILE QUESTIONNAIRE */}
        {step === 1 && (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl animate-fadeIn space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Step 1: Body Equilibrium Baseline
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Athlete Metabolic Profile
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Your metrics are computed using the scientific Mifflin-St Jeor formula for zero unwanted fat gain.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Biological Gender */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Biological Gender
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['male', 'female', 'other'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold capitalize transition-all border ${
                        gender === g
                          ? 'bg-brand-500/20 text-brand-300 border-brand-500/50 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Age (Years)
                </label>
                <input
                  type="number"
                  min="14"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value, 10) || 25)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Height */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Height (cm)
                </label>
                <input
                  type="number"
                  min="100"
                  max="250"
                  value={heightCm}
                  onChange={(e) => setHeightCm(parseInt(e.target.value, 10) || 175)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Current Weight */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Current Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="250"
                  value={weightKg}
                  onChange={(e) => {
                    const w = parseFloat(e.target.value) || 70;
                    setWeightKg(w);
                    setTargetMaintenanceWeightKg(w);
                  }}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Target Maintenance Weight */}
              <div className="sm:col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Target Maintenance Weight (kg)
                  </label>
                  <span className="text-[11px] text-brand-400 font-mono">
                    Variance: {(targetMaintenanceWeightKg - weightKg).toFixed(1)} kg
                  </span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="250"
                  value={targetMaintenanceWeightKg}
                  onChange={(e) => setTargetMaintenanceWeightKg(parseFloat(e.target.value) || 70)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-brand-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Keep equal to current weight for isodynamic maintenance, or adjust slightly for body recomposition.
                </p>
              </div>

              {/* Activity Level */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Weekly Activity Factor
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'sedentary', label: 'Sedentary (1.2x)', desc: 'Desk job, minimal daily movement' },
                    { id: 'light', label: 'Lightly Active (1.375x)', desc: '1-3 light sessions per week' },
                    { id: 'moderate', label: 'Moderately Active (1.55x)', desc: '3-5 gym sessions per week' },
                    { id: 'very_active', label: 'Very Active (1.725x)', desc: '6-7 intense workouts per week' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActivityLevel(item.id as ActivityLevel)}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        activityLevel === item.id
                          ? 'bg-brand-500/15 border-brand-500/50 text-white shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>{item.label}</span>
                        {activityLevel === item.id && <Check className="w-4 h-4 text-brand-400" />}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-3 px-6 bg-gradient-to-r from-brand-500 to-teal-500 hover:from-brand-400 hover:to-teal-400 text-slate-950 font-bold text-sm rounded-xl shadow-glow transition-all flex items-center gap-2 group"
              >
                <span>Continue to Machine Inventory</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: GRANULAR GYM EQUIPMENT & MACHINE INVENTORY */}
        {step === 2 && (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl animate-fadeIn space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold mb-2">
                <Cpu className="w-3.5 h-3.5" /> Step 2: Granular Gym Equipment Inventory
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Check off your available equipment
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    FitMaintenance AI will only prescribe exercises matching the exact machines you check off.
                  </p>
                </div>
                <div className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-brand-500/15 text-brand-300 border border-brand-500/30 self-start sm:self-auto">
                  {selectedEquipment.length} Machines Checked
                </div>
              </div>
            </div>

            {/* Quick Presets Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-400" /> Quick Presets:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => applyPreset('commercial')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  🏢 Full Commercial Gym
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('home')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  🏠 Home Gym (Free Weights)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('minimal')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  🧘 Minimal / Calisthenics
                </button>
              </div>
            </div>

            {/* Search and Category Filter */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search machines (e.g. Lat Pulldown, Leg Press, Smith)..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
                {['all', 'Cables & Pulleys', 'Machines', 'Free Weights & Benches', 'Bodyweight / Minimal'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all whitespace-nowrap ${
                      activeCategoryFilter === cat
                        ? 'bg-brand-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat === 'all' ? 'All Gear' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Categorized Equipment Sections */}
            <div className="space-y-6 max-h-[460px] overflow-y-auto pr-1">
              {filteredCatalog.map((catGroup) => {
                const categorySelectedCount = catGroup.items.filter((i) =>
                  selectedEquipment.includes(i.id)
                ).length;
                const isAllSelected = categorySelectedCount === catGroup.items.length;

                return (
                  <div key={catGroup.category} className="space-y-3">
                    {/* Category Title & Quick Toggle */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{catGroup.category}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-slate-800 text-brand-300 border border-slate-700">
                            {categorySelectedCount} / {catGroup.items.length}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{catGroup.description}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleCategoryAll(catGroup.items)}
                        className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
                      >
                        {isAllSelected ? (
                          <>
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Deselect All</span>
                          </>
                        ) : (
                          <>
                            <Square className="w-3.5 h-3.5" />
                            <span>Select All</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Machine Checkbox Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {catGroup.items.map((item) => {
                        const isChecked = selectedEquipment.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleItem(item.id)}
                            className={`cursor-pointer p-3.5 rounded-2xl border transition-all duration-150 flex items-start gap-3 select-none ${
                              isChecked
                                ? 'bg-brand-950/25 border-brand-500/50 shadow-sm'
                                : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-lg shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                                isChecked
                                  ? 'bg-brand-500 text-slate-950 shadow-glow'
                                  : 'border border-slate-700 bg-slate-950'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className={`text-xs font-bold leading-snug ${isChecked ? 'text-white' : 'text-slate-300'}`}>
                                  {item.name}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0 font-medium border border-slate-700">
                                  {item.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-tight line-clamp-1">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Step 2 Actions */}
            <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 border border-slate-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="py-3 px-6 bg-gradient-to-r from-brand-500 to-teal-500 hover:from-brand-400 hover:to-teal-400 text-slate-950 font-bold text-sm rounded-xl shadow-glow transition-all flex items-center gap-2 group"
              >
                <span>Calculate Maintenance Blueprint</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: MIFFLIN-ST JEOR BLUEPRINT & FIRESTORE SAVE */}
        {step === 3 && (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl animate-fadeIn space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold mb-2">
                <Bot className="w-3.5 h-3.5" /> Step 3: Calibrated Metabolic Blueprint
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Your AI Maintenance Blueprint
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Computed via Mifflin-St Jeor formula based on your gender, age, height, and activity level.
              </p>
            </div>

            {/* TDEE Hero Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-brand-950/30 to-teal-950/30 border border-brand-500/30 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5 mb-1">
                    <Flame className="w-4 h-4" /> Daily Maintenance Energy (TDEE)
                  </div>
                  <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                    {calculatedMacros.tdee}{' '}
                    <span className="text-base font-normal text-slate-400">kcal / day</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    BMR: <strong className="text-slate-200 font-mono">{calculatedMacros.bmr} kcal</strong> • Activity Factor: <strong className="text-slate-200 capitalize">{activityLevel}</strong>
                  </div>
                </div>

                <div className="px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-right self-start sm:self-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Equilibrium Target</div>
                  <div className="text-lg font-bold font-mono text-teal-300">{targetMaintenanceWeightKg} kg</div>
                  <div className="text-[10px] text-emerald-400">Zero Fat Spillover</div>
                </div>
              </div>
            </div>

            {/* Macro Breakdown Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Protein</span>
                <div className="text-xl font-extrabold font-mono text-brand-400 mt-0.5">
                  {calculatedMacros.targetProtein}g
                </div>
                <span className="text-[10px] text-slate-500">2.2g / kg lean mass</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Carbohydrates</span>
                <div className="text-xl font-extrabold font-mono text-sky-400 mt-0.5">
                  {calculatedMacros.targetCarbs}g
                </div>
                <span className="text-[10px] text-slate-500">Glycogen refill</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Fats</span>
                <div className="text-xl font-extrabold font-mono text-teal-400 mt-0.5">
                  {calculatedMacros.targetFats}g
                </div>
                <span className="text-[10px] text-slate-500">Hormonal balance</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Daily Hydration</span>
                <div className="text-xl font-extrabold font-mono text-cyan-400 mt-0.5">
                  {calculatedMacros.waterGoalMl}ml
                </div>
                <span className="text-[10px] text-slate-500">40ml / kg</span>
              </div>
            </div>

            {/* Selected Equipment Summary */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
                  Available Inventory ({selectedEquipment.length} Selected)
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-[11px] text-brand-400 hover:underline"
                >
                  Edit Gear
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {selectedEquipment.map((id) => {
                  const allItems = EQUIPMENT_CATALOG.flatMap((cat) => cat.items);
                  const found = allItems.find((i) => i.id === id);
                  return (
                    <span
                      key={id}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/90 text-slate-200 border border-slate-700/80"
                    >
                      {found?.name || id}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Save to Firestore Action */}
            <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 border border-slate-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Adjust Gear</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleFinishOnboarding}
                className="py-3.5 px-8 bg-gradient-to-r from-brand-500 to-teal-500 hover:from-brand-400 hover:to-teal-400 text-slate-950 font-bold text-sm rounded-xl shadow-glow transition-all flex items-center gap-2 group disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Saving to Cloud Firestore...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Save to Cloud Firestore & Enter</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
