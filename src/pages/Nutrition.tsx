import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Flame,
  Calculator,
  Scale,
  Zap,
  Save,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Camera,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  Utensils,
  Search,
  X,
  RotateCcw,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeUserBiometrics,
  saveUserBiometrics,
  subscribeUserProfile,
  subscribeNutritionLogs,
  addNutritionLog,
  deleteNutritionLog,
  INDIAN_STAPLES_PRESETS,
  type UserBiometrics,
  type UserProfile,
  type NutritionLogItem,
  type IndianStaple,
} from '../services/firestoreService';
import {
  fileToBase64,
  analyzeFoodImage,
  type FoodAnalysisResult,
  isGeminiConfigured,
} from '../services/geminiService';

export const Nutrition: React.FC = () => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Tab View
  const [activeTab, setActiveTab] = useState<'scanner' | 'calculator'>('scanner');
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Real-time Nutrition Logs
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLogItem[]>([]);

  // AI Food Scanner State
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<FoodAnalysisResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [isSavingLog, setIsSavingLog] = useState(false);

  // Indian Staples Quick-Add Modal State
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeStaple, setActiveStaple] = useState<IndianStaple | null>(null);
  const [stapleQty, setStapleQty] = useState<number>(1);
  const [quickAddMealType, setQuickAddMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');

  // Real-time Firestore Subscriptions (Zero Mock Data)
  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribeBio = subscribeUserBiometrics(currentUser.uid, (data) => {
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

    const unsubscribeProfile = subscribeUserProfile(currentUser.uid, (profile) => {
      setUserProfile(profile);
    });

    const unsubscribeLogs = subscribeNutritionLogs(currentUser.uid, (logs) => {
      setNutritionLogs(logs);
    });

    return () => {
      unsubscribeBio();
      unsubscribeProfile();
      unsubscribeLogs();
    };
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

    // If user has an onboarding profile with custom TDEE, prioritize it
    if (userProfile?.calculatedTdee && goal === 'maintain') {
      target = userProfile.calculatedTdee;
    }

    const protein = Math.round(weightKg * 2.0);
    const proteinKcal = protein * 4;
    const fatsKcal = target * 0.25;
    const fats = Math.round(fatsKcal / 9);
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
  }, [gender, weightKg, heightCm, age, activityMultiplier, goal, userProfile]);

  // Today's Logs & Totals
  const isToday = (timestamp: unknown): boolean => {
    if (!timestamp) return true;
    let date: Date;
    if (typeof (timestamp as { toDate?: () => Date }).toDate === 'function') {
      date = (timestamp as { toDate: () => Date }).toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return true;
    }
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const todaysLogs = useMemo(() => {
    return nutritionLogs.filter((l) => isToday(l.loggedAt));
  }, [nutritionLogs]);

  const dailyTotals = useMemo(() => {
    return todaysLogs.reduce(
      (acc, log) => ({
        calories: acc.calories + (log.calories || 0),
        protein: acc.protein + (log.proteinG || 0),
        carbs: acc.carbs + (log.carbsG || 0),
        fats: acc.fats + (log.fatsG || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, [todaysLogs]);

  // Image Selection Handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setScanResult(null);
      setScanError(null);
    }
  };

  // Perform AI Food Scan
  const handleScanFood = async () => {
    if (!selectedImageFile) return;
    setIsScanning(true);
    setScanError(null);

    try {
      const base64Part = await fileToBase64(selectedImageFile);
      const result = await analyzeFoodImage(base64Part);
      setScanResult(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Food scan failed. Check your network connection or API key.';
      setScanError(message);
    } finally {
      setIsScanning(false);
    }
  };

  // Save Scanned Meal to Firestore
  const handleSaveScannedMeal = async () => {
    if (!currentUser?.uid || !scanResult) return;
    setIsSavingLog(true);

    try {
      await addNutritionLog(currentUser.uid, {
        foodName: scanResult.food_name,
        detectedComponents: scanResult.detected_components,
        calories: scanResult.calories,
        proteinG: scanResult.protein_g,
        carbsG: scanResult.carbs_g,
        fatsG: scanResult.fats_g,
        confidenceScore: scanResult.confidence_score,
        mealType: selectedMealType,
      });

      setSelectedImageFile(null);
      setImagePreviewUrl(null);
      setScanResult(null);
      setSavedStatus('Scanned meal logged to Firestore');
      setTimeout(() => setSavedStatus(null), 3000);
    } catch (err) {
      console.error('Failed to log meal:', err);
    } finally {
      setIsSavingLog(false);
    }
  };

  // Quick-Add Indian Staple to Firestore
  const handleQuickAddStaple = async () => {
    if (!currentUser?.uid || !activeStaple) return;
    try {
      const qtyName =
        stapleQty === 1
          ? activeStaple.name
          : `${activeStaple.name} (${stapleQty}x)`;

      await addNutritionLog(currentUser.uid, {
        foodName: qtyName,
        detectedComponents: activeStaple.detectedComponents,
        calories: Math.round(activeStaple.calories * stapleQty),
        proteinG: Math.round(activeStaple.proteinG * stapleQty),
        carbsG: Math.round(activeStaple.carbsG * stapleQty),
        fatsG: Math.round(activeStaple.fatsG * stapleQty),
        confidenceScore: 'Manual',
        mealType: quickAddMealType,
      });

      setShowQuickAddModal(false);
      setActiveStaple(null);
      setStapleQty(1);
      setSavedStatus(`${activeStaple.name} logged`);
      setTimeout(() => setSavedStatus(null), 2500);
    } catch (err) {
      console.error('Failed to log Indian staple:', err);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!currentUser?.uid || !id) return;
    try {
      await deleteNutritionLog(currentUser.uid, id);
    } catch (err) {
      console.error('Failed to delete nutrition log:', err);
    }
  };

  // Filtered Indian Staples
  const filteredStaples = useMemo(() => {
    return INDIAN_STAPLES_PRESETS.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.hindiName && item.hindiName.includes(searchQuery)) ||
        item.detectedComponents.some((c) =>
          c.toLowerCase().includes(searchQuery.toLowerCase())
        );
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const stapleCategories = ['All', 'Legumes & Pulses', 'Grains & Breads', 'Nuts & Seeds', 'Dairy & Protein'];

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
        Retrieving user nutrition logs & biometrics from Firestore...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Nutrition & AI Food Vision</span>
            {isGeminiConfigured ? (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                @google/genai Live
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                API Key Needed
              </span>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Multimodal food recognition, Indian cuisine nutrition intelligence, and Mifflin-St Jeor metabolic tracking.
          </p>
        </div>

        {savedStatus && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {savedStatus}
          </span>
        )}
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('scanner')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'scanner'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>AI Food Scanner & Daily Log</span>
          {todaysLogs.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-extrabold">
              {todaysLogs.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'calculator'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Metabolic Target Engine</span>
        </button>
      </div>

      {/* ==================== TAB 1: AI FOOD SCANNER & LOGS ==================== */}
      {activeTab === 'scanner' && (
        <div className="space-y-6">
          {/* Daily Calorie & Macro Progress Gauge */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-2.5">
                <Flame className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Today's Intake vs. Maintenance Target
                </h3>
              </div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Target: <span className="font-bold text-slate-900 dark:text-white">{targetCalories} kcal</span>
                {targetCalories > dailyTotals.calories ? (
                  <span className="text-emerald-600 dark:text-emerald-400 ml-1.5">
                    ({targetCalories - dailyTotals.calories} kcal remaining)
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 ml-1.5">
                    (+{dailyTotals.calories - targetCalories} kcal surplus)
                  </span>
                )}
              </div>
            </div>

            {/* Macro Progress Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {/* Calories */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Calories</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {dailyTotals.calories} / {targetCalories}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (dailyTotals.calories / (targetCalories || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Protein */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-rose-600 dark:text-rose-400 font-bold">Protein</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {dailyTotals.protein}g / {proteinGrams}g
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (dailyTotals.protein / (proteinGrams || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Carbs */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">Carbs</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {dailyTotals.carbs}g / {carbsGrams}g
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (dailyTotals.carbs / (carbsGrams || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Fats */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-teal-600 dark:text-teal-400 font-bold">Fats (Hidden Oils)</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {dailyTotals.fats}g / {fatsGrams}g
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (dailyTotals.fats / (fatsGrams || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AI Vision Food Scanner Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div className="flex items-center gap-2.5">
                <Camera className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Gemini Multimodal Food Scanner
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Snap or upload meal photos to automatically detect Indian & global dishes, hidden ghee/oils, and portion volumes.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowQuickAddModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 text-xs font-bold transition self-start sm:self-auto"
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Quick-Add Indian Staples</span>
              </button>
            </div>

            {/* Hidden File Inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageFileChange}
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleImageFileChange}
              className="hidden"
            />

            {/* Image Upload Area */}
            {!imagePreviewUrl ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-6 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-500/30 hover:border-emerald-500 dark:hover:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/5 flex flex-col items-center justify-center gap-2 text-center transition group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow group-hover:scale-105 transition">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Capture with Mobile Camera
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Instant photo of your plate, katori, or snacks
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-2 text-center transition group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Upload Food Image
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    JPG, PNG, WebP from your library
                  </span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 max-h-72 flex items-center justify-center">
                  <img
                    src={imagePreviewUrl}
                    alt="Food preview"
                    className="max-h-72 w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImageFile(null);
                      setImagePreviewUrl(null);
                      setScanResult(null);
                      setScanError(null);
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-bold backdrop-blur transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={isScanning}
                    onClick={handleScanFood}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isScanning ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>Gemini AI Analyzing Cuisine & Hidden Oils...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Run Gemini AI Food Analysis</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isScanning}
                    onClick={() => {
                      setSelectedImageFile(null);
                      setImagePreviewUrl(null);
                      setScanResult(null);
                    }}
                    className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
                  >
                    <RotateCcw className="w-4 h-4 inline mr-1" />
                    Retake
                  </button>
                </div>
              </div>
            )}

            {/* Error or Low Confidence Fallback Banner */}
            {scanError && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 space-y-2">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Scan Encountered an Issue: {scanError}</span>
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-300">
                  You can instantly log your meal using our Indian food quick-add presets below:
                </p>
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition inline-flex items-center gap-1.5"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Open Indian Food Quick-Add Modal</span>
                </button>
              </div>
            )}

            {/* Structured Scan Result Card */}
            {scanResult && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-emerald-500/40 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                      Detected Dish
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {scanResult.food_name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                        scanResult.confidence_score === 'High'
                          ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                          : scanResult.confidence_score === 'Medium'
                          ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
                          : 'bg-rose-100 dark:bg-rose-500/15 text-rose-800 dark:text-rose-400 border-rose-300 dark:border-rose-500/30'
                      }`}
                    >
                      {scanResult.confidence_score} Confidence
                    </span>
                  </div>
                </div>

                {/* Low Confidence Warning & Quick-Add Trigger */}
                {scanResult.confidence_score === 'Low' && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-amber-800 dark:text-amber-300 block">
                        Ambiguous Portion or Complex Curry
                      </span>
                      <p className="text-amber-700 dark:text-amber-400 text-[11px]">
                        Confidence is low due to lighting or mixed ingredients. Verify with verified Indian staples.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowQuickAddModal(true)}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold shrink-0 transition text-xs"
                    >
                      Quick-Add Staples
                    </button>
                  </div>
                )}

                {/* Detected Components Chips */}
                {scanResult.detected_components && scanResult.detected_components.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                      Detected Components & Hidden Fats:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {scanResult.detected_components.map((comp, i) => (
                        <span
                          key={i}
                          className="text-xs px-2.5 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                        >
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Macro Breakdown */}
                <div className="grid grid-cols-4 gap-2.5 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                      Calories
                    </span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white">
                      {scanResult.calories}
                    </span>
                    <span className="text-[10px] text-slate-400 block">kcal</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block mb-0.5">
                      Protein
                    </span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white">
                      {scanResult.protein_g}g
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {scanResult.protein_g * 4} kcal
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                      Carbs
                    </span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white">
                      {scanResult.carbs_g}g
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {scanResult.carbs_g * 4} kcal
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400 block mb-0.5">
                      Fats
                    </span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white">
                      {scanResult.fats_g}g
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {scanResult.fats_g * 9} kcal
                    </span>
                  </div>
                </div>

                {/* Meal Type & Save Action */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Meal Type:
                    </span>
                    <div className="flex gap-1">
                      {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setSelectedMealType(m)}
                          className={`text-xs capitalize px-2.5 py-1 rounded-lg border font-medium transition ${
                            selectedMealType === m
                              ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isSavingLog}
                    onClick={handleSaveScannedMeal}
                    className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow transition flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingLog ? 'Logging to Firestore...' : 'Save Meal to Daily Log'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Today's Logged Meals Feed (Zero Mock Data) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Today's Real-Time Meal Feed ({todaysLogs.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAddModal(true)}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {todaysLogs.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Zero Mock Data Active: No meals recorded for today yet.
                </p>
                <p>
                  Use the camera scanner above or click "Quick-Add Indian Staples" to log Boiled Chana, Roti, Peanuts, Green Gram, or Dal!
                </p>
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Quick-Add Staple Meal</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todaysLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {log.foodName}
                        </span>
                        <span className="capitalize text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {log.mealType}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            log.confidenceScore === 'High'
                              ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                              : log.confidenceScore === 'Manual'
                              ? 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-800 dark:text-indigo-400 border-indigo-300 dark:border-indigo-500/30'
                              : 'bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
                          }`}
                        >
                          {log.confidenceScore === 'Manual' ? 'Indian Preset' : `${log.confidenceScore} Conf.`}
                        </span>
                      </div>

                      {log.detectedComponents && log.detectedComponents.length > 0 && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {log.detectedComponents.join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <div className="flex items-center gap-2.5 text-right">
                        <div>
                          <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {log.calories}
                          </span>
                          <span className="text-[10px] text-slate-400 block -mt-0.5">kcal</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium pl-2 border-l border-slate-200 dark:border-slate-800">
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">{log.proteinG}g P</span>
                          {' • '}
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">{log.carbsG}g C</span>
                          {' • '}
                          <span className="text-teal-600 dark:text-teal-400 font-semibold">{log.fatsG}g F</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: METABOLIC TARGET ENGINE (MIFFLIN-ST JEOR) ==================== */}
      {activeTab === 'calculator' && (
        <div className="space-y-6">
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
                  type="button"
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
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{age} yrs</span>
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
                  Activity Multiplier
                </label>
                <select
                  value={activityMultiplier}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setActivityMultiplier(val);
                    handleSaveToFirestore({ activityMultiplier: val });
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={1.2}>Sedentary (Desk job, little to no gym: 1.2x)</option>
                  <option value={1.375}>Lightly Active (1-3 gym sessions/wk: 1.375x)</option>
                  <option value={1.55}>Moderately Active (3-5 intense gym sessions/wk: 1.55x)</option>
                  <option value={1.725}>Very Active (6-7 intense training sessions/wk: 1.725x)</option>
                  <option value={1.9}>Extra Athlete (Twice daily training or physical labor: 1.9x)</option>
                </select>
              </div>

              {/* Athletic Target Goal */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Phase / Calorie Target
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGoal('maintain');
                      handleSaveToFirestore({ goal: 'maintain' });
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition ${
                      goal === 'maintain'
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Maintenance (TDEE)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGoal('lean_bulk');
                      handleSaveToFirestore({ goal: 'lean_bulk' });
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition ${
                      goal === 'lean_bulk'
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Lean Bulk (+250 kcal)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGoal('cut');
                      handleSaveToFirestore({ goal: 'cut' });
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition ${
                      goal === 'cut'
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Fat Loss (-450 kcal)
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side: Metabolic Output Cards (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Calculated Intake Target
                  </span>
                  <span className="capitalize px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-500/30 text-xs">
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

              {/* Target Macronutrient Distribution */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Target Macronutrient Distribution</span>
                </h3>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-rose-300 dark:border-rose-500/30 text-center">
                    <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block mb-0.5">
                      Protein
                    </span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">{proteinGrams}g</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                      {proteinGrams * 4} kcal
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-amber-300 dark:border-amber-500/30 text-center">
                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                      Carbs
                    </span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">{carbsGrams}g</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                      {carbsGrams * 4} kcal
                    </span>
                  </div>

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
                    Protein is anchored at 2.0g per kg of bodyweight ({weightKg} kg) to ensure positive nitrogen retention and muscle recovery.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== INDIAN FOOD QUICK-ADD MODAL ==================== */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Indian Food Staples Quick-Add</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verified macronutrients for authentic home-cooked and gym staples.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowQuickAddModal(false);
                  setActiveStaple(null);
                }}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search & Categories */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50 dark:bg-slate-950">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Chana, Peanuts, Green Gram, Roti, Dal, Paneer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {stapleCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-[11px] font-bold px-3 py-1 rounded-lg shrink-0 transition ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body: Staples List or Selected Portion Config */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {activeStaple ? (
                <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {activeStaple.name}
                        </h4>
                        {activeStaple.hindiName && (
                          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                            ({activeStaple.hindiName})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {activeStaple.servingDescription}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveStaple(null)}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold"
                    >
                      Change Item
                    </button>
                  </div>

                  {/* Quantity Multiplier */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Portion Multiplier:
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[0.5, 1, 1.5, 2, 3].map((qty) => (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => setStapleQty(qty)}
                          className={`py-1.5 rounded-xl text-xs font-bold border transition ${
                            stapleQty === qty
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {qty}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Meal Type Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Meal Type:
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setQuickAddMealType(m)}
                          className={`py-1.5 capitalize rounded-xl text-xs font-bold border transition ${
                            quickAddMealType === m
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Calculated Macros Preview */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-4 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Calories</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {Math.round(activeStaple.calories * stapleQty)} kcal
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-500 block">Protein</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {Math.round(activeStaple.proteinG * stapleQty)}g
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-500 block">Carbs</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {Math.round(activeStaple.carbsG * stapleQty)}g
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-teal-500 block">Fats</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {Math.round(activeStaple.fatsG * stapleQty)}g
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleQuickAddStaple}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Log {activeStaple.name} to Firestore</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredStaples.map((staple) => (
                    <button
                      key={staple.id}
                      type="button"
                      onClick={() => {
                        setActiveStaple(staple);
                        setStapleQty(1);
                      }}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-400 text-left transition flex flex-col justify-between gap-2 group cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                            {staple.name}
                          </span>
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            {staple.calories} kcal
                          </span>
                        </div>
                        {staple.hindiName && (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">
                            {staple.hindiName}
                          </span>
                        )}
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                          {staple.servingDescription}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">{staple.proteinG}g P</span>
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">{staple.carbsG}g C</span>
                        <span className="text-teal-600 dark:text-teal-400 font-semibold">{staple.fatsG}g F</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase">
                          Select +
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Nutrition;
