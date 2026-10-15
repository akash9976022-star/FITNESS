import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AiFoodPhotoModal } from '../components/nutrition/AiFoodPhotoModal';
import { IndianFoodSearchModal } from '../components/nutrition/IndianFoodSearchModal';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import type { IndianFoodItem } from '../data/indianFoodDatabase';
import type { MealCategory } from '../types/auth';
import {
  Utensils,
  Plus,
  Sparkles,
  Trash2,
  Bot,
  Camera,
  Calendar,
  Flame,
  Search,
} from 'lucide-react';

export const NutritionPage: React.FC = () => {
  const {
    userProfile,
    nutritionLogs,
    saveNutritionLog,
    deleteNutritionLog,
    fetchNutritionLogs,
  } = useAuth();

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [showAiScanModal, setShowAiScanModal] = useState<boolean>(false);
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [showIndianSearchModal, setShowIndianSearchModal] = useState<boolean>(false);

  // Manual meal form state
  const [manualName, setManualName] = useState<string>('');
  const [manualCategory, setManualCategory] = useState<MealCategory>('Dinner');
  const [manualCalories, setManualCalories] = useState<string>('');
  const [manualProtein, setManualProtein] = useState<string>('');
  const [manualCarbs, setManualCarbs] = useState<string>('');
  const [manualFats, setManualFats] = useState<string>('');

  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  useEffect(() => {
    fetchNutritionLogs(selectedDate);
  }, [selectedDate]);

  // Filter logs for selected date
  const filteredLogs = nutritionLogs.filter((log) => log.date === selectedDate);

  // Compute daily totals
  const totalCalories = filteredLogs.reduce((sum, m) => sum + (m.calories || 0), 0);
  const totalProtein = filteredLogs.reduce((sum, m) => sum + (m.protein_g || 0), 0);
  const totalCarbs = filteredLogs.reduce((sum, m) => sum + (m.carbs_g || 0), 0);
  const totalFats = filteredLogs.reduce((sum, m) => sum + (m.fats_g || 0), 0);

  const calorieDelta = totalCalories - userProfile.targetCalories;
  const isEquilibrium = Math.abs(calorieDelta) <= 150;

  const handleManualAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualCalories) return;

    const cals = parseInt(manualCalories, 10) || 300;
    const protein = parseInt(manualProtein, 10) || Math.round((cals * 0.3) / 4);
    const carbs = parseInt(manualCarbs, 10) || Math.round((cals * 0.45) / 4);
    const fats = parseInt(manualFats, 10) || Math.round((cals * 0.25) / 9);

    await saveNutritionLog({
      date: selectedDate,
      food_name: manualName.trim(),
      calories: cals,
      protein_g: protein,
      carbs_g: carbs,
      fats_g: fats,
      meal_type: manualCategory,
      notes: 'Manually logged meal',
    });

    setManualName('');
    setManualCalories('');
    setManualProtein('');
    setManualCarbs('');
    setManualFats('');
    setShowManualModal(false);
  };

  const handleSelectIndianFood = async (item: IndianFoodItem, multiplier: number) => {
    const dishTitle = multiplier === 1 ? item.name : `${item.name} (${multiplier}x portion)`;
    const calculatedCals = Math.round(item.calories * multiplier);
    const calculatedP = Math.round(item.protein_g * multiplier * 10) / 10;
    const calculatedC = Math.round(item.carbs_g * multiplier * 10) / 10;
    const calculatedF = Math.round(item.fats_g * multiplier * 10) / 10;

    if (showManualModal) {
      setManualName(dishTitle);
      setManualCalories(String(calculatedCals));
      setManualProtein(String(Math.round(calculatedP)));
      setManualCarbs(String(Math.round(calculatedC)));
      setManualFats(String(Math.round(calculatedF)));
      setShowIndianSearchModal(false);
      return;
    }

    const hour = new Date().getHours();
    const cat: MealCategory =
      hour < 11 ? 'Breakfast' : hour < 16 ? 'Lunch' : hour < 20 ? 'Snacks' : 'Dinner';

    await saveNutritionLog({
      date: selectedDate,
      food_name: dishTitle,
      calories: calculatedCals,
      protein_g: calculatedP,
      carbs_g: calculatedC,
      fats_g: calculatedF,
      meal_type: cat,
      notes: `Indian Database: ${item.hindi_name || item.tamil_name || item.name} | Serving: ${item.serving_size} | Cooking Fat: ${item.cooking_fat || 'Standard'}`,
      confidence: 0.98,
    });

    setShowIndianSearchModal(false);
  };

  const handleGenerateAiMeal = () => {
    setAiGenerating(true);
    setAiSuggestion(null);
    setTimeout(() => {
      const remainingCals = Math.max(150, userProfile.targetCalories - totalCalories);
      const remainingP = Math.max(15, userProfile.targetProtein - totalProtein);
      setAiSuggestion(
        `AI Dinner Recommendation (${remainingCals} kcal, ~${remainingP}g protein): Pan-seared Wild Salmon fillet (200g) with roasted sweet potato wedges and steamed asparagus with light olive oil. Replenishes muscle glycogen with zero metabolic fat spillover!`
      );
      setAiGenerating(false);
    }, 700);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Utensils className="w-6 h-6 text-brand-500 dark:text-brand-400" />
            Maintenance Nutrition & Fuel
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Targeting isodynamic balance: keep energy intake matched with daily TDEE.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* AI Photo Scan Button (Primary CTA) */}
          <button
            onClick={() => setShowAiScanModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-teal-500 hover:from-brand-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-glow flex items-center gap-2 transition-all active:scale-95"
          >
            <Camera className="w-4 h-4 text-slate-950" />
            <span>Snap Meal (AI Vision)</span>
          </button>

          {/* Quick Indian Staples Search */}
          <button
            onClick={() => setShowIndianSearchModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Search className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Indian Staples</span>
          </button>

          {/* AI Suggestion */}
          <button
            onClick={handleGenerateAiMeal}
            disabled={aiGenerating}
            className="px-3.5 py-2.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-600 dark:text-brand-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
            <span className="hidden sm:inline">{aiGenerating ? 'Analyzing...' : 'AI Meal Copilot'}</span>
          </button>

          {/* Manual Log */}
          <button
            onClick={() => setShowManualModal(true)}
            className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Manual</span>
          </button>
        </div>
      </div>

      {/* Date Switcher */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-500 dark:text-brand-400" />
          <span className="text-xs font-bold text-slate-900 dark:text-white">Viewing Date:</span>
          <span className="text-xs font-mono text-brand-600 dark:text-brand-300 font-bold">{selectedDate}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              selectedDate === new Date().toISOString().split('T')[0]
                ? 'bg-brand-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Today
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* AI Suggestion Banner */}
      {aiSuggestion && (
        <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-500/30 text-xs text-slate-700 dark:text-slate-200 flex items-start gap-3 shadow-lg animate-fadeIn">
          <div className="p-2 rounded-xl bg-brand-500/20 text-brand-600 dark:text-brand-400 shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-brand-700 dark:text-brand-300 mb-1">AI Nutrition Copilot</div>
            <p>{aiSuggestion}</p>
          </div>
        </div>
      )}

      {/* Real-Time Macro Scorecard & Progress Bars */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Calories Consumed vs Maintenance Target */}
        <div className="glass-card rounded-2xl p-4 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
            <span className="uppercase">Total Calories</span>
            <div className="p-1 rounded bg-amber-500/10 text-amber-500 dark:text-amber-400">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {totalCalories} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ {userProfile.targetCalories} kcal</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalCalories > userProfile.targetCalories
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-amber-500 to-brand-400'
              }`}
              style={{ width: `${Math.min(100, (totalCalories / userProfile.targetCalories) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-mono">
            <span>{Math.round((totalCalories / userProfile.targetCalories) * 100)}% of TDEE</span>
            <span className={isEquilibrium ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-500 dark:text-slate-400'}>
              {calorieDelta > 0 ? `+${calorieDelta} kcal surplus` : `${Math.abs(calorieDelta)} kcal left`}
            </span>
          </div>
        </div>

        {/* Protein Retention */}
        <div className="glass-card rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">
            <span>Protein</span>
            <span className="text-[10px] text-brand-600 dark:text-brand-400 font-mono">2.2g/kg</span>
          </div>
          <div className="text-2xl font-bold font-mono text-brand-600 dark:text-brand-400">
            {totalProtein}g <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ {userProfile.targetProtein}g</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2.5">
            <div
              className="bg-brand-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (totalProtein / userProfile.targetProtein) * 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-mono">
            {Math.max(0, userProfile.targetProtein - totalProtein)}g remaining for MPS
          </div>
        </div>

        {/* Carbohydrates */}
        <div className="glass-card rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">
            <span>Carbohydrates</span>
            <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono">Glycogen</span>
          </div>
          <div className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400">
            {totalCarbs}g <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ {userProfile.targetCarbs}g</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2.5">
            <div
              className="bg-sky-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (totalCarbs / userProfile.targetCarbs) * 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-mono">
            {Math.max(0, userProfile.targetCarbs - totalCarbs)}g left for training energy
          </div>
        </div>

        {/* Fats */}
        <div className="glass-card rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">
            <span>Fats</span>
            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">Hormones</span>
          </div>
          <div className="text-2xl font-bold font-mono text-teal-600 dark:text-teal-400">
            {totalFats}g <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ {userProfile.targetFats}g</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2.5">
            <div
              className="bg-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (totalFats / userProfile.targetFats) * 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-mono">
            Essential lipids & recovery
          </div>
        </div>
      </div>

      {/* Logged Meals List for Selected Date */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Meals & Plates for {selectedDate}</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                {filteredLogs.length} Logged
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Entries synchronized with Cloud Firestore (`users/{'{userId}'}/nutrition_logs`)
            </p>
          </div>

          <button
            onClick={() => setShowAiScanModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-300 border border-brand-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan Plate</span>
          </button>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 flex items-center justify-center">
              <Utensils className="w-6 h-6 text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">No meals logged for this date</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Snap a photo with the AI Vision Camera to calculate calories and macros in seconds!
              </p>
            </div>
            <button
              onClick={() => setShowAiScanModal(true)}
              className="mt-1 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-extrabold text-xs shadow-glow flex items-center gap-2 transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>Launch AI Food Camera</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((meal) => (
              <div
                key={meal.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-950/60 hover:bg-slate-50 dark:hover:bg-slate-900/60 border border-slate-200 dark:border-slate-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-center gap-3.5">
                  {/* Photo Thumbnail or Fork Icon */}
                  {meal.photo_url ? (
                    <img
                      src={meal.photo_url}
                      alt={meal.food_name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-center text-brand-500 dark:text-brand-400">
                      <Utensils className="w-5 h-5" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                        {meal.food_name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {meal.meal_type || 'Meal'}
                      </span>
                      {meal.photo_url && (
                        <span className="px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-300 text-[9px] font-bold border border-brand-500/30 flex items-center gap-1">
                          <Bot className="w-3 h-3" /> AI Vision Calibrated
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-amber-600 dark:text-amber-300">{meal.calories} kcal</span>
                      <span className="text-slate-400 dark:text-slate-600">•</span>
                      <span className="text-brand-600 dark:text-brand-400">P: {meal.protein_g}g</span>
                      <span className="text-slate-400 dark:text-slate-600">•</span>
                      <span className="text-sky-600 dark:text-sky-400">C: {meal.carbs_g}g</span>
                      <span className="text-slate-400 dark:text-slate-600">•</span>
                      <span className="text-teal-600 dark:text-teal-400">F: {meal.fats_g}g</span>
                    </div>

                    {meal.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic line-clamp-1">
                        {meal.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => deleteNutritionLog(meal.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                    title="Delete log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Food Photo Modal */}
      <ErrorBoundary moduleName="AI Food Vision Scanner">
        <AiFoodPhotoModal
          isOpen={showAiScanModal}
          onClose={() => setShowAiScanModal(false)}
          onLogCompleted={() => fetchNutritionLogs(selectedDate)}
        />
      </ErrorBoundary>

      {/* Manual Meal Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                Log Custom Meal
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualAddMeal} className="space-y-4">
              {/* Quick Indian Database Autofill Button */}
              <button
                type="button"
                onClick={() => setShowIndianSearchModal(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Autofill from Indian Food Database</span>
              </button>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Meal Name</label>
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="e.g. Grilled Chicken Breast with Brown Rice"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Meal Timing</label>
                  <select
                    value={manualCategory}
                    onChange={(e: any) => setManualCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snacks">Snacks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    required
                    value={manualCalories}
                    onChange={(e) => setManualCalories(e.target.value)}
                    placeholder="e.g. 550"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={manualProtein}
                    onChange={(e) => setManualProtein(e.target.value)}
                    placeholder="e.g. 40"
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={manualCarbs}
                    onChange={(e) => setManualCarbs(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Fats (g)</label>
                  <input
                    type="number"
                    value={manualFats}
                    onChange={(e) => setManualFats(e.target.value)}
                    placeholder="e.g. 15"
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-xs text-slate-950 font-bold shadow-glow"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Preloaded Indian Food Database Modal */}
      <IndianFoodSearchModal
        isOpen={showIndianSearchModal}
        onClose={() => setShowIndianSearchModal(false)}
        onSelectFood={handleSelectIndianFood}
      />
    </div>
  );
};
