import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { analyzeFoodImage, type AiNutritionAnalysisResult } from '../../utils/aiVisionNutrition';
import type { MealCategory } from '../../types/auth';
import {
  Camera,
  Upload,
  X,
  Sparkles,
  Bot,
  Check,
  AlertCircle,
  Flame,
  RotateCcw,
  FlipHorizontal,
  Info,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { isMobileDevice, hasMediaDeviceSupport } from '../../utils/deviceDetection';
import { capturePhotoWithNativeCamera, isNativePlatform } from '../../services/nativeMobileService';
import { IndianFoodSearchModal } from './IndianFoodSearchModal';
import type { IndianFoodItem } from '../../data/indianFoodDatabase';
import { detectMealTypeByDish } from '../../utils/aiVisionNutrition';

interface AiFoodPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogCompleted?: () => void;
}

export const AiFoodPhotoModal: React.FC<AiFoodPhotoModalProps> = ({
  isOpen,
  onClose,
  onLogCompleted,
}) => {
  const { saveNutritionLog } = useAuth();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMobile = isMobileDevice();
  const hasCamera = hasMediaDeviceSupport();

  const [mode, setMode] = useState<'camera' | 'upload'>(() => {
    return hasMediaDeviceSupport() ? 'camera' : 'upload';
  });
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Photo & Analysis state
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [userHint, setUserHint] = useState<string>('');

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AiNutritionAnalysisResult | null>(null);

  // Indian Food Database Override & Enhanced Components
  const [showIndianSearchModal, setShowIndianSearchModal] = useState<boolean>(false);
  const [detectedComponents, setDetectedComponents] = useState<string[]>([]);
  const [confidenceScore, setConfidenceScore] = useState<'High' | 'Medium' | 'Low'>('High');

  // Editable analysis values
  const [editedFoodName, setEditedFoodName] = useState<string>('');
  const [editedCalories, setEditedCalories] = useState<number>(0);
  const [editedProtein, setEditedProtein] = useState<number>(0);
  const [editedCarbs, setEditedCarbs] = useState<number>(0);
  const [editedFats, setEditedFats] = useState<number>(0);
  const [selectedMealType, setSelectedMealType] = useState<MealCategory>('Lunch');

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Camera initialization
  const startCamera = async (facing: 'environment' | 'user') => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser.');
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Food camera error:', err);
      setErrorMessage('Unable to access camera. Switched to upload mode.');
      setMode('upload');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const resetState = () => {
    setPhotoBlob(null);
    setPhotoPreview(null);
    setAnalysisResult(null);
    setUserHint('');
    setErrorMessage(null);
    setSaveSuccess(false);
    setIsScanning(false);
    setDetectedComponents([]);
    setConfidenceScore('High');
  };

  useEffect(() => {
    if (isOpen) {
      resetState();
      if (mode === 'camera') {
        startCamera(facingMode);
      }
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, mode, facingMode]);

  // Run AI Vision Analysis
  const triggerAiAnalysis = async (imgSource: Blob | File | string, hint?: string) => {
    setIsScanning(true);
    setScanStep('AI Vision Engine: Initializing deep plate scanning...');
    setErrorMessage(null);

    const stepTimer1 = setTimeout(() => {
      setScanStep('Segmenting ingredients & detecting macronutrient density...');
    }, 350);

    const stepTimer2 = setTimeout(() => {
      setScanStep('Calculating caloric portion volume & protein yield...');
    }, 650);

    try {
      const result = await analyzeFoodImage(imgSource, hint || userHint);
      setAnalysisResult(result);
      setEditedFoodName(result.food_name);
      setEditedCalories(result.calories);
      setEditedProtein(result.protein_g);
      setEditedCarbs(result.carbs_g);
      setEditedFats(result.fats_g);
      setSelectedMealType(result.meal_type);
      setDetectedComponents(result.detected_components || []);
      setConfidenceScore(result.confidence_score || 'High');

      // Auto-open Indian food quick-add fallback if confidence is low
      if (result.confidence_score === 'Low') {
        setShowIndianSearchModal(true);
      }
    } catch (err: any) {
      console.error('AI vision error:', err);
      setErrorMessage('AI vision could not parse image. Opening Indian food quick-add fallback...');
      // Automatically display fallback modal containing popular Indian fitness staples
      setShowIndianSearchModal(true);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsScanning(false);
    }
  };

  const handleNativeCameraCapture = async (source: 'camera' | 'photos' | 'prompt' = 'camera') => {
    const res = await capturePhotoWithNativeCamera(source);
    if (res) {
      setPhotoBlob(res.blob);
      setPhotoPreview(res.dataUrl);
      stopCamera();
      triggerAiAnalysis(res.blob);
    }
  };

  const handleCaptureSnapshot = () => {
    if (isNativePlatform()) {
      handleNativeCameraCapture('camera');
      return;
    }

    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 720;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const previewUrl = URL.createObjectURL(blob);
          setPhotoBlob(blob);
          setPhotoPreview(previewUrl);
          stopCamera();
          triggerAiAnalysis(blob);
        }
      },
      'image/jpeg',
      0.92
    );
  };

  // Clipboard paste listener for desktop photo convenience
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            const previewUrl = URL.createObjectURL(file);
            setPhotoBlob(file);
            setPhotoPreview(previewUrl);
            stopCamera();
            triggerAiAnalysis(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && files[0].type.startsWith('image/')) {
      const file = files[0];
      const previewUrl = URL.createObjectURL(file);
      setPhotoBlob(file);
      setPhotoPreview(previewUrl);
      stopCamera();
      triggerAiAnalysis(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPhotoBlob(file);
      setPhotoPreview(previewUrl);
      stopCamera();
      triggerAiAnalysis(file);
    }
  };

  // Select item from preloaded Indian food database
  const handleSelectIndianFood = (item: IndianFoodItem, multiplier: number) => {
    const dishTitle = multiplier === 1 ? item.name : `${item.name} (${multiplier}x portion)`;
    const calculatedCals = Math.round(item.calories * multiplier);
    const calculatedP = Math.round(item.protein_g * multiplier * 10) / 10;
    const calculatedC = Math.round(item.carbs_g * multiplier * 10) / 10;
    const calculatedF = Math.round(item.fats_g * multiplier * 10) / 10;
    const mealCat = detectMealTypeByDish(item.name);

    setEditedFoodName(dishTitle);
    setEditedCalories(calculatedCals);
    setEditedProtein(calculatedP);
    setEditedCarbs(calculatedC);
    setEditedFats(calculatedF);
    setSelectedMealType(mealCat);
    setDetectedComponents(item.components || [item.name]);
    setConfidenceScore('High');

    // Create an artificial analysis result to transition smoothly into the review/verification view
    const simulatedResult: AiNutritionAnalysisResult = {
      food_name: dishTitle,
      detected_components: item.components || [item.name],
      calories: calculatedCals,
      protein_g: calculatedP,
      carbs_g: calculatedC,
      fats_g: calculatedF,
      confidence: 0.98,
      confidence_score: 'High',
      meal_type: mealCat,
      breakdown_notes: `Verified Indian Database: ${item.hindi_name || item.tamil_name || item.name} (${item.serving_size}). Cooking Fat: ${item.cooking_fat || 'Standard'}.`,
    };

    setAnalysisResult(simulatedResult);
    setShowIndianSearchModal(false);
  };

  // Save entry to Firestore sub-collection
  const handleSaveEntry = async () => {
    if (!editedFoodName.trim()) {
      setErrorMessage('Please enter a meal name.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const todayIso = new Date().toISOString().split('T')[0];

      // Formulate detailed breakdown notes preserving detected components
      const notesParts = [
        analysisResult?.breakdown_notes || userHint || '',
        detectedComponents.length > 0 ? `Components: ${detectedComponents.join(', ')}` : '',
        `AI Confidence: ${confidenceScore}`,
      ].filter(Boolean);

      const numericConfidence =
        confidenceScore === 'High' ? 0.95 : confidenceScore === 'Medium' ? 0.75 : 0.55;

      await saveNutritionLog(
        {
          date: todayIso,
          food_name: editedFoodName.trim(),
          calories: editedCalories || 0,
          protein_g: editedProtein || 0,
          carbs_g: editedCarbs || 0,
          fats_g: editedFats || 0,
          meal_type: selectedMealType,
          photo_url: photoPreview || undefined,
          notes: notesParts.join(' | '),
          confidence: numericConfidence,
        },
        photoBlob || undefined
      );

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        if (onLogCompleted) onLogCompleted();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Failed to save nutrition log:', err);
      setErrorMessage(err.message || 'Failed to save to Firestore. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-auto flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-white/95 dark:bg-slate-900/90 z-20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-brand-500/20 to-teal-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  AI Food Vision & Macro Tracker
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-brand-500/15 dark:bg-brand-500/20 text-brand-600 dark:text-brand-300 text-[10px] font-bold border border-brand-500/30">
                  Multimodal Vision
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Snap or upload a meal to extract calories and macros automatically
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5 font-semibold">
              <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>Nutrition entry saved & synced to Cloud Firestore!</span>
            </div>
          )}

          {/* STEP 1: CAPTURE / UPLOAD / SAMPLE SELECTION (if not yet analyzed or during preview) */}
          {!analysisResult && !isScanning && !photoPreview && (
            <div className="space-y-4">
              {/* Quick Indian Food Search Shortcut Banner */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Logging Indian Staples?</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">Idli, Dosa, Poha, Rotis, Dals, Paneer, Chana & more</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIndianSearchModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
                >
                  <Search className="w-3 h-3" />
                  <span>Search</span>
                </button>
              </div>

              {/* Tab Selector: Camera vs Upload vs Demos */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => hasCamera && setMode('camera')}
                  disabled={!hasCamera}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    !hasCamera
                      ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
                      : mode === 'camera'
                      ? 'bg-brand-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={hasCamera ? 'Live Camera' : 'Camera not supported in this environment'}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{hasCamera ? 'Live Camera' : 'Camera N/A'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('upload')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'upload'
                      ? 'bg-brand-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image</span>
                </button>
              </div>

              {/* LIVE CAMERA MODE */}
              {mode === 'camera' && (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] w-full flex items-center justify-center border border-slate-800">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className={`w-full h-full object-cover ${
                        facingMode === 'user' ? 'scale-x-[-1]' : ''
                      }`}
                    />

                    {/* Camera Overlay Guide */}
                    <div className="absolute inset-4 pointer-events-none border-2 border-dashed border-brand-400/50 rounded-2xl flex flex-col items-center justify-between p-3">
                      <span className="px-3 py-1 rounded-full bg-slate-950/80 text-[11px] font-mono text-brand-300">
                        Frame your meal or plate inside guidelines
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Top-down or 45° angle gives best portion accuracy
                      </span>
                    </div>

                    {/* Camera switch button */}
                    <button
                      type="button"
                      onClick={() =>
                        setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                      }
                      className="absolute top-3 right-3 p-2 rounded-xl bg-slate-950/80 text-slate-300 hover:text-white border border-slate-700"
                      title="Switch Camera"
                    >
                      <FlipHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Shutter Button */}
                  <div className="flex items-center justify-center pt-1">
                    <button
                      type="button"
                      onClick={handleCaptureSnapshot}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-500 to-teal-500 hover:from-brand-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-glow flex items-center gap-2 active:scale-95 transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Capture & Analyze Food</span>
                    </button>
                  </div>
                </div>
              )}

              {/* FILE UPLOAD MODE */}
              {mode === 'upload' && (
                <div
                  onClick={() => {
                    if (isNativePlatform()) {
                      handleNativeCameraCapture('prompt');
                    } else {
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`w-full border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group ${
                    isDragging
                      ? 'border-brand-400 bg-brand-500/10 ring-4 ring-brand-500/20 scale-[0.99]'
                      : 'border-slate-300 dark:border-slate-700 hover:border-brand-500 bg-slate-50/70 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-950/80'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors">
                      {isDragging
                        ? 'Drop Food Photo Here'
                        : isMobile
                        ? 'Tap to Snap or Choose Food Photo'
                        : 'Choose File, Drag Food Photo, or Paste (Ctrl+V)'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Supports JPG, PNG, WEBP from mobile camera, files, or clipboard
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SCANNING RADAR HUD OVERLAY */}
          {isScanning && (
            <div className="relative rounded-3xl overflow-hidden bg-black p-6 border border-brand-500/40 flex flex-col items-center justify-center min-h-[280px]">
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Scanning food"
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
              )}

              {/* Animated Glowing Laser Scan Bar */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-brand-400 to-transparent shadow-glow animate-pulse top-1/2 -translate-y-1/2" />

              <div className="relative z-10 text-center flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full border-4 border-brand-500 border-t-transparent animate-spin flex items-center justify-center">
                  <Bot className="w-6 h-6 text-brand-400 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white tracking-tight">
                    Analyzing Indian Meal with Gemini AI...
                  </h4>
                  <p className="text-xs text-brand-300 font-mono mt-1 max-w-sm">
                    {scanStep || 'Extracting portion weights and macronutrient density...'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: RESULTS REVIEW & MACRO VERIFICATION */}
          {analysisResult && !isScanning && (
            <div className="space-y-4 animate-fadeIn">
              {/* Photo & Confidence Bar */}
              <div className="relative rounded-2xl overflow-hidden bg-black max-h-44 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                {photoPreview && (
                  <img
                    src={photoPreview}
                    alt="Analyzed food"
                    className="w-full h-44 object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent flex items-end justify-between p-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 shadow-md ${
                      confidenceScore === 'High'
                        ? 'bg-emerald-500/90 text-slate-950'
                        : confidenceScore === 'Medium'
                        ? 'bg-amber-500/90 text-slate-950'
                        : 'bg-rose-500/90 text-slate-950'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    AI Vision Confidence: {confidenceScore} ({Math.round((analysisResult.confidence || 0.95) * 100)}%)
                  </span>
                  <button
                    type="button"
                    onClick={resetState}
                    className="px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-xs text-slate-200 border border-slate-700 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake</span>
                  </button>
                </div>
              </div>

              {/* Low / Medium Confidence Warning & Quick Database Override */}
              {confidenceScore !== 'High' && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="leading-snug">
                      Confidence is <span className="font-bold underline">{confidenceScore}</span>. If local cooking fats (ghee/oil) or portions differ, verify with our verified Indian food database.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowIndianSearchModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shrink-0 transition-colors shadow-sm"
                  >
                    Verify Database
                  </button>
                </div>
              )}

              {/* Detected Dish Components & Fillings Breakdown */}
              {detectedComponents.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
                      Detected Ingredients, Curries & Cooking Fats:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowIndianSearchModal(true)}
                      className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-bold flex items-center gap-1"
                    >
                      <Search className="w-3 h-3" />
                      <span>Adjust with Indian Database</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {detectedComponents.map((comp, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-brand-600 dark:text-brand-300 text-xs font-medium shadow-sm"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Food Name (Editable) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Identified Meal / Dish
                </label>
                <input
                  type="text"
                  required
                  value={editedFoodName}
                  onChange={(e) => setEditedFoodName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Meal Category & Calories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Meal Timing Category
                  </label>
                  <select
                    value={selectedMealType}
                    onChange={(e: any) => setSelectedMealType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snacks">Snacks / Pre-Post Workout</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    Total Calories (kcal)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={editedCalories}
                    onChange={(e) => setEditedCalories(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-extrabold font-mono text-amber-600 dark:text-amber-300 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Macro Breakdown Inputs (Protein, Carbs, Fats) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Macronutrient Breakdown (Grams)
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-brand-500/30 shadow-sm">
                    <span className="text-[10px] font-bold text-brand-600 dark:text-brand-300 uppercase">Protein</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <input
                        type="number"
                        min="0"
                        value={editedProtein}
                        onChange={(e) => setEditedProtein(parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-transparent font-extrabold font-mono text-xl text-brand-600 dark:text-brand-400 focus:outline-none"
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">g</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-sky-500/30 shadow-sm">
                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-300 uppercase">Carbohydrates</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <input
                        type="number"
                        min="0"
                        value={editedCarbs}
                        onChange={(e) => setEditedCarbs(parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-transparent font-extrabold font-mono text-xl text-sky-600 dark:text-sky-400 focus:outline-none"
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">g</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-teal-500/30 shadow-sm">
                    <span className="text-[10px] font-bold text-teal-600 dark:text-teal-300 uppercase">Fats</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <input
                        type="number"
                        min="0"
                        value={editedFats}
                        onChange={(e) => setEditedFats(parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-transparent font-extrabold font-mono text-xl text-teal-600 dark:text-teal-400 focus:outline-none"
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">g</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Vision Notes */}
              {analysisResult.breakdown_notes && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                  <Info className="w-4 h-4 text-brand-500 dark:text-brand-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{analysisResult.breakdown_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Hidden Canvas and File Input */}
          <canvas ref={canvasRef} className="hidden" />
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture={isMobile ? 'environment' : undefined}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
          >
            Cancel
          </button>

          {analysisResult && (
            <button
              type="button"
              disabled={isSaving || saveSuccess}
              onClick={handleSaveEntry}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-brand-500 to-teal-500 hover:from-brand-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-glow flex items-center gap-2 transition-all disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Syncing to Firestore...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  <span>Save to Nutrition Log</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Quick Indian Food Search Modal Override */}
      <IndianFoodSearchModal
        isOpen={showIndianSearchModal}
        onClose={() => setShowIndianSearchModal(false)}
        onSelectFood={handleSelectIndianFood}
      />
    </div>
  );
};
