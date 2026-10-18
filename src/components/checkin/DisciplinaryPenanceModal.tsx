import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Volume2,
  VolumeX,
  X,
  Minus,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { unlockAudio } from '../../utils/voiceSynthesisHelper';

export interface PenanceOption {
  id: 'pushups' | 'burpees' | 'squats' | 'steps';
  label: string;
  icon: string;
  targetCount: number;
  unit: string;
  intensity: string;
  description: string;
}

export const PENANCE_OPTIONS: PenanceOption[] = [
  {
    id: 'pushups',
    label: '30 Strict Push-Ups',
    icon: '🏋️',
    targetCount: 30,
    unit: 'reps',
    intensity: 'High Strength',
    description: 'Strict form, chest touches the floor, complete lockout at top. Zero sloppy reps allowed.',
  },
  {
    id: 'burpees',
    label: '50 Penalty Burpees',
    icon: '💥',
    targetCount: 50,
    unit: 'reps',
    intensity: 'Extreme Conditioning',
    description: 'Full chest-to-ground drop followed by maximum vertical leap and overhead clap.',
  },
  {
    id: 'squats',
    label: '75 Deep Bodyweight Squats',
    icon: '🦵',
    targetCount: 75,
    unit: 'reps',
    intensity: 'Muscular Endurance',
    description: 'Break parallel on every rep, maintain upright torso, and squeeze glutes at the top.',
  },
  {
    id: 'steps',
    label: '3,000 Extra Discipline Steps',
    icon: '🚶',
    targetCount: 3000,
    unit: 'steps',
    intensity: 'Cardio Penance',
    description: 'Walk or march in place to complete 3,000 extra steps above your daily step goal.',
  },
];

interface DisciplinaryPenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  missedDate: string;
  reason: 'missed_post_workout_checkin' | 'missed_daily_checkin';
  userName?: string;
  onCompletePenance: (penanceType: 'burpees' | 'pushups' | 'squats' | 'steps', reps: number) => Promise<void>;
  onProceedToCheckIn: () => void;
}

export const DisciplinaryPenanceModal: React.FC<DisciplinaryPenanceModalProps> = ({
  isOpen,
  onClose,
  missedDate,
  reason,
  userName = 'Athlete',
  onCompletePenance,
  onProceedToCheckIn,
}) => {
  const [selectedPenanceId, setSelectedPenanceId] = useState<'pushups' | 'burpees' | 'squats' | 'steps'>('pushups');
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [pledgeChecked, setPledgeChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!isOpen) return null;

  const currentPenance = PENANCE_OPTIONS.find((p) => p.id === selectedPenanceId) || PENANCE_OPTIONS[0];
  const target = currentPenance.targetCount;
  const progressPercent = Math.min(100, Math.round((completedCount / target) * 100));
  const isGoalReached = completedCount >= target;

  const handleSelectPenance = (id: 'pushups' | 'burpees' | 'squats' | 'steps') => {
    setSelectedPenanceId(id);
    setCompletedCount(0);
    setPledgeChecked(false);
  };

  const handleIncrement = (amount: number) => {
    setCompletedCount((prev) => Math.min(target * 2, Math.max(0, prev + amount)));
  };

  const handleSpeakCoachReprimand = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    unlockAudio();
    window.speechSynthesis.cancel();

    const speechText =
      reason === 'missed_post_workout_checkin'
        ? `Attention ${userName}! You completed your gym workout, but you skipped your post-workout recovery check-in! In this program, recovery tracking is just as important as lifting the iron. Execute your ${target} ${currentPenance.label} with absolute integrity, then log your check-in to clear your disciplinary record!`
        : `Attention ${userName}! You missed your daily check-in for ${missedDate}. Consistency is our sacred law. Perform your ${target} ${currentPenance.label} now to restore your honor and maintain your streak!`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 1.05;
    utterance.pitch = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmitPenance = async () => {
    if (!isGoalReached || !pledgeChecked || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onCompletePenance(selectedPenanceId, completedCount);
      onClose();
      onProceedToCheckIn();
    } catch (err) {
      console.error('Failed to submit penance:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-rose-500/40 shadow-2xl shadow-rose-950/50 p-5 sm:p-7 text-white overflow-hidden my-auto">
        {/* Top Crimson Neon Ambience Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-rose-500/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-500/20 animate-pulse">
              <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-rose-500/25 text-rose-300 border border-rose-500/40">
                  🚨 DISCIPLINARY PENALTY ACTIVE
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {missedDate}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                {reason === 'missed_post_workout_checkin'
                  ? 'Missed Post-Gym Check-In Penance'
                  : 'Missed Daily Check-In Punishment'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Dismiss temporarily"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Coach Reprimand Speech Card */}
        <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-amber-950/40 border border-rose-500/30 flex items-start justify-between gap-3">
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold uppercase tracking-wider text-[10px]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>AI Coach Disciplinary Reprimand</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-medium">
              &ldquo;{userName}, you crushed your workout, but skipping post-workout check-in leaves your recovery, soreness, and biometrics untracked. A true champion accounts for every session. Execute your penance reps now to restore your athlete honor!&rdquo;
            </p>
          </div>

          <button
            type="button"
            onClick={handleSpeakCoachReprimand}
            className={`p-2.5 rounded-xl border transition shrink-0 self-center btn-tactile ${
              isSpeaking
                ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-rose-300 border-rose-500/30'
            }`}
            title="Hear Coach Reprimand Voice"
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Penance Selection Grid */}
        <div className="mt-4 space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Choose Your Disciplinary Penance</span>
            <span className="text-[10px] text-rose-400 font-semibold">Strict Form Required</span>
          </label>

          <div className="grid grid-cols-2 gap-2">
            {PENANCE_OPTIONS.map((opt) => {
              const isSelected = selectedPenanceId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectPenance(opt.id)}
                  className={`p-3 rounded-2xl border text-left transition relative btn-tactile ${
                    isSelected
                      ? 'bg-rose-500/20 border-rose-500 text-white shadow-md shadow-rose-500/20'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{opt.icon}</span>
                    <span className={`text-[10px] font-black uppercase px-1.5 py-0.2 rounded ${
                      isSelected ? 'bg-rose-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {opt.targetCount} {opt.unit}
                    </span>
                  </div>
                  <div className="text-xs font-black mt-1.5 text-white truncate">
                    {opt.label}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {opt.intensity}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Penance Detail & Interactive Counter */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">
              {currentPenance.description}
            </span>
          </div>

          {/* Large Digital Counter */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-black tracking-tight ${
                isGoalReached ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {completedCount}
              </span>
              <span className="text-sm font-bold text-slate-500">
                / {target} {currentPenance.unit}
              </span>
            </div>

            {/* Quick Increment Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleIncrement(-1)}
                disabled={completedCount <= 0}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold flex items-center justify-center transition"
                title="Subtract 1"
              >
                <Minus className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleIncrement(1)}
                className="px-2.5 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center transition"
                title="Add 1"
              >
                +1
              </button>

              <button
                type="button"
                onClick={() => handleIncrement(currentPenance.id === 'steps' ? 500 : 5)}
                className="px-2.5 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center transition"
              >
                +{currentPenance.id === 'steps' ? '500' : '5'}
              </button>

              <button
                type="button"
                onClick={() => setCompletedCount(target)}
                className="px-3 h-8 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-black text-xs flex items-center justify-center transition"
              >
                Max ({target})
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isGoalReached
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-rose-500 to-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Integrity Pledge Checkbox */}
        <div className="mt-4">
          <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition cursor-pointer">
            <input
              type="checkbox"
              checked={pledgeChecked}
              onChange={(e) => setPledgeChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-700 bg-slate-900"
            />
            <span className="text-xs text-slate-300 leading-snug">
              <strong>Athlete's Integrity Pledge:</strong> I solemnly swear on my honor that I have completed every single one of these {target} {currentPenance.unit} with strict form and zero shortcuts.
            </span>
          </label>
        </div>

        {/* Submit & Proceed Button */}
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-xs transition"
          >
            Later
          </button>

          <button
            type="button"
            onClick={handleSubmitPenance}
            disabled={!isGoalReached || !pledgeChecked || isSubmitting}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition btn-tactile ${
              isGoalReached && pledgeChecked
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25 animate-pulse'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            {isSubmitting ? (
              <span>Clearing Record...</span>
            ) : isGoalReached && pledgeChecked ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Penance Served • Log Check-In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <span>Complete Reps & Check Pledge</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisciplinaryPenanceModal;

