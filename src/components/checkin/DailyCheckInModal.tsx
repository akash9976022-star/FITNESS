import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GhostCameraModal } from '../camera/GhostCameraModal';
import type { ReadinessLevel, ExperienceLevel } from '../../types/auth';
import type { AiPhysiqueAnalysis } from '../../types/rewards';
import { analyzePhysiquePhoto } from '../../utils/aiPhysiqueAnalysis';
import {
  X,
  Camera,
  Scale,
  Zap,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  Trash2,
  Info,
  Activity,
  Lightbulb,
} from 'lucide-react';

interface DailyCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckInCompleted?: () => void;
}

export const DailyCheckInModal: React.FC<DailyCheckInModalProps> = ({
  isOpen,
  onClose,
  onCheckInCompleted,
}) => {
  const { userProfile, saveCheckIn } = useAuth();

  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [weightValue, setWeightValue] = useState<string>(
    userProfile.weightKg ? userProfile.weightKg.toString() : '75.0'
  );
  const [readiness, setReadiness] = useState<ReadinessLevel>('moderate');
  const [notes, setNotes] = useState<string>('');
  const experienceLevel: ExperienceLevel = userProfile.experienceLevel || 'intermediate';

  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);

  const [aiAnalysis, setAiAnalysis] = useState<AiPhysiqueAnalysis | null>(null);
  const [isAnalyzingPhysique, setIsAnalyzingPhysique] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  // Handle weight unit toggle
  const handleToggleUnit = (unit: 'kg' | 'lbs') => {
    if (unit === weightUnit) return;
    const currentNum = parseFloat(weightValue) || 75;
    if (unit === 'lbs') {
      setWeightValue((currentNum * 2.20462).toFixed(1));
    } else {
      setWeightValue((currentNum / 2.20462).toFixed(1));
    }
    setWeightUnit(unit);
  };

  const handlePhotoCaptured = async (blob: Blob, previewUrl: string) => {
    setPhotoBlob(blob);
    setPhotoPreview(previewUrl);
    setAnalysisError(null);

    // Automatically trigger Gemini AI Body Type & Physique Analysis
    setIsAnalyzingPhysique(true);
    try {
      const numericWeight = parseFloat(weightValue) || userProfile.weightKg || 74.5;
      const weightInKg =
        weightUnit === 'lbs'
          ? parseFloat((numericWeight / 2.20462).toFixed(2))
          : parseFloat(numericWeight.toFixed(2));
      const targetWeight = userProfile.targetMaintenanceWeightKg || userProfile.weightKg || weightInKg;

      const analysis = await analyzePhysiquePhoto(blob, {
        weightKg: weightInKg,
        targetWeightKg: targetWeight,
        experienceLevel,
        maintenanceGoal: userProfile.maintenanceGoal || 'maintenance',
        notes: notes.trim(),
      });
      setAiAnalysis(analysis);
    } catch (err: any) {
      console.warn('AI Physique analysis notice:', err);
      setAnalysisError('AI analysis unavailable. Standard metrics will be recorded.');
    } finally {
      setIsAnalyzingPhysique(false);
    }
  };

  const handleRemovePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoBlob(null);
    setPhotoPreview(null);
    setAiAnalysis(null);
    setAnalysisError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const numericWeight = parseFloat(weightValue);
    if (!numericWeight || numericWeight <= 20 || numericWeight > 300) {
      setSubmitError('Please enter a valid body weight (e.g., 74.5 kg).');
      return;
    }

    const weightInKg =
      weightUnit === 'lbs'
        ? parseFloat((numericWeight / 2.20462).toFixed(2))
        : parseFloat(numericWeight.toFixed(2));

    setIsSubmitting(true);

    try {
      const todayIso = new Date().toISOString().split('T')[0];

      await saveCheckIn(
        {
          date: todayIso,
          weight: weightInKg,
          readiness,
          experience_level: experienceLevel,
          notes: notes.trim(),
          aiPhysiqueAnalysis: aiAnalysis || undefined,
        },
        photoBlob || undefined
      );

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        if (onCheckInCompleted) onCheckInCompleted();
        onClose();
      }, 1400);
    } catch (err: any) {
      console.error('Check-in error:', err);
      setSubmitError(err.message || 'Failed to record check-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
        <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-auto flex flex-col max-h-[92vh] text-slate-900 dark:text-slate-100 transition-colors">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-slate-900/95 shrink-0 z-20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  Daily Check-In
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono font-medium">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Track weight equilibrium, biofeedback & progress alignment
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
            {submitError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 font-semibold">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 dark:text-emerald-400" />
                <span>Check-in successfully recorded & synchronized to Cloud!</span>
              </div>
            )}

            {/* 1. Morning Weight Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <Scale className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                  Morning Weigh-In (Fasted)
                </label>
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => handleToggleUnit('kg')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all ${
                      weightUnit === 'kg'
                        ? 'bg-brand-500 text-slate-950 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleUnit('lbs')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all ${
                      weightUnit === 'lbs'
                        ? 'bg-brand-500 text-slate-950 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    lbs
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  required
                  value={weightValue}
                  onChange={(e) => setWeightValue(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700/80 rounded-2xl px-4 py-3.5 text-2xl font-extrabold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  placeholder={weightUnit === 'kg' ? '74.5' : '164.2'}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 dark:text-slate-400 font-mono">
                  {weightUnit}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs">
                <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-slate-500" />
                  Target weight: <strong className="text-slate-800 dark:text-slate-300">{userProfile.targetMaintenanceWeightKg || userProfile.weightKg} kg</strong>
                </p>
                <div className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 text-brand-700 dark:text-brand-300 border border-slate-200 dark:border-slate-700/60 font-semibold flex items-center gap-1">
                  <span>BMI:</span>
                  <span className="text-slate-900 dark:text-white font-bold">
                    {(
                      ((parseFloat(weightValue) || 75) / (weightUnit === 'lbs' ? 2.20462 : 1)) /
                      Math.pow((userProfile.heightCm || 178) / 100, 2)
                    ).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Readiness / Fatigue Energy Level */}
            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2.5 uppercase tracking-wider">
                <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                Daily Fatigue & Readiness Rating
              </label>

              <div className="grid grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'low',
                    label: 'Low Energy',
                    desc: 'High fatigue / sore',
                    color: 'from-rose-500/20 to-amber-500/10 border-rose-500/40 text-rose-700 dark:text-rose-300',
                    dot: 'bg-rose-500 dark:bg-rose-400',
                  },
                  {
                    id: 'moderate',
                    label: 'Moderate',
                    desc: 'Balanced / normal',
                    color: 'from-amber-500/20 to-brand-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300',
                    dot: 'bg-amber-500 dark:bg-amber-400',
                  },
                  {
                    id: 'high',
                    label: 'High Energy',
                    desc: 'Prime readiness',
                    color: 'from-brand-500/25 to-teal-500/15 border-brand-500/50 text-brand-700 dark:text-brand-300',
                    dot: 'bg-brand-500 dark:bg-brand-400',
                  },
                ].map((item) => {
                  const isSelected = readiness === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setReadiness(item.id as ReadinessLevel)}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 ${
                        isSelected
                          ? `bg-gradient-to-br ${item.color} shadow-sm ring-1 ring-brand-500/30`
                          : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">{item.label}</span>
                        <div className={`w-2 h-2 rounded-full ${item.dot}`} />
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Ghost Camera Progress Photo */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <Camera className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                  Daily Progress Photo (Front View)
                </label>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Optional but recommended</span>
              </div>

              {!photoPreview ? (
                <div
                  onClick={() => setIsCameraOpen(true)}
                  className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700/80 hover:border-brand-500 dark:hover:border-brand-500/60 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors">
                      Open Ghost Overlay Camera
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Includes silhouette guide for consistent framing
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-black max-h-48 flex items-center justify-center">
                  <img
                    src={photoPreview}
                    alt="Check-in preview"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end justify-between p-3">
                    <span className="text-xs text-white font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Ready to upload
                    </span>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="p-1.5 rounded-xl bg-rose-500/80 hover:bg-rose-500 text-white transition-colors"
                      title="Remove photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* AI Body Type & Physique Analysis Card */}
              {isAnalyzingPhysique && (
                <div className="mt-3 p-4 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center gap-3 animate-pulse">
                  <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-brand-700 dark:text-brand-300">
                      Analyzing Physique with Gemini AI...
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Evaluating muscle definition, posture alignment & maintenance equilibrium
                    </p>
                  </div>
                </div>
              )}

              {analysisError && !isAnalyzingPhysique && (
                <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{analysisError}</span>
                </div>
              )}

              {aiAnalysis && !isAnalyzingPhysique && (
                <div className="mt-3 p-4 rounded-2xl bg-white dark:bg-slate-950 border border-brand-500/30 space-y-3 animate-fadeIn shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
                        AI Physique & Posture Insights
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Confidence: {aiAnalysis.confidenceScore}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold mb-0.5">
                        Muscle Definition
                      </span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                        {aiAnalysis.perceivedDefinition}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold mb-0.5">
                        Posture Alignment
                      </span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                        {aiAnalysis.postureAlignment}
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-brand-500/5 border border-brand-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Equilibrium Rating</span>
                        <span className="text-xs font-extrabold text-brand-700 dark:text-brand-300">
                          {aiAnalysis.maintenanceRating}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 text-right max-w-[50%] truncate font-mono font-medium">
                      {aiAnalysis.bodyCompositionTrend}
                    </span>
                  </div>

                  {aiAnalysis.keyObservations && aiAnalysis.keyObservations.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                        Key Observations:
                      </span>
                      <ul className="space-y-1">
                        {aiAnalysis.keyObservations.slice(0, 3).map((obs, idx) => (
                          <li key={idx} className="text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-1.5 leading-snug">
                            <span className="text-brand-500 dark:text-brand-400 font-bold mt-0.5">•</span>
                            <span>{obs}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiAnalysis.recommendedAction && (
                    <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-500/20 text-[11px] text-teal-800 dark:text-teal-300 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span>{aiAnalysis.recommendedAction}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Notes / Biofeedback */}
            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2 uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                Notes & Biofeedback (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="E.g., Slept 8 hrs, slight chest soreness from bench day, hydrated well..."
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700/80 rounded-2xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || submitSuccess}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-teal-500 hover:from-brand-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-glow flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Syncing Check-In...</span>
                  </>
                ) : submitSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Completed!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Save Check-In</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Ghost Camera Modal */}
      <GhostCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={handlePhotoCaptured}
      />
    </>
  );
};
