import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sun,
  Footprints,
  Dumbbell,
  Moon,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  ArrowRight,
  Droplets,
  CheckCircle2,
} from 'lucide-react';
import {
  type RoutineType,
  ROUTINE_DEFINITIONS,
  speakRoutineVoiceReminder,
  stopRoutineSpeech,
  buildSpokenPhrase,
} from '../../utils/routineVoiceEngine';
import {
  type CustomRoutineItem,
  logWaterIntake,
  getTodayDateString,
  type VoiceLanguageMode,
} from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';

interface RoutineReminderModalProps {
  isOpen: boolean;
  routineType?: RoutineType;
  customRoutine?: CustomRoutineItem | null;
  routine?: RoutineType | CustomRoutineItem | null;
  userName?: string;
  language?: VoiceLanguageMode;
  voiceRate?: number;
  onDismiss: () => void;
  onAcknowledge?: () => void;
}

export const RoutineReminderModal: React.FC<RoutineReminderModalProps> = ({
  isOpen,
  routineType,
  customRoutine,
  routine,
  userName = 'Athlete',
  language = 'tanglish',
  voiceRate = 0.95,
  onDismiss,
  onAcknowledge,
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isWaterLogged, setIsWaterLogged] = useState(false);
  const [isLoggingWater, setIsLoggingWater] = useState(false);

  const resolvedRoutine = routine || customRoutine || routineType || 'wakeUp';
  const isCustom = typeof resolvedRoutine === 'object' && resolvedRoutine !== null;
  const activeCustom = isCustom ? (resolvedRoutine as CustomRoutineItem) : null;

  const isHydration =
    routineType === 'hydration' ||
    activeCustom?.category?.toLowerCase() === 'hydration' ||
    activeCustom?.name?.toLowerCase().includes('hydration') ||
    activeCustom?.name?.toLowerCase().includes('water') ||
    activeCustom?.name?.toLowerCase().includes('தண்ணீர்');

  const activeType: RoutineType = !isCustom
    ? (resolvedRoutine as RoutineType)
    : isHydration
    ? 'hydration'
    : (activeCustom?.category?.toLowerCase().includes('walk') || activeCustom?.name?.toLowerCase().includes('walk')
        ? 'walking'
        : activeCustom?.category?.toLowerCase().includes('workout') || activeCustom?.name?.toLowerCase().includes('workout')
        ? 'workout'
        : activeCustom?.category?.toLowerCase().includes('bed') || activeCustom?.name?.toLowerCase().includes('bed')
        ? 'bedtime'
        : 'wakeUp');

  const def = ROUTINE_DEFINITIONS[activeType] || ROUTINE_DEFINITIONS.wakeUp;
  const firstName = (userName || 'Athlete').trim().split(' ')[0];

  const title = activeCustom?.name || def.title;
  const titleTamil = activeCustom?.nameTamil || (activeCustom ? `${activeCustom.category || 'Routine'} Alert` : def.titleTamil);
  const displayEmoji = activeCustom?.icon || def.icon;
  const [currentLanguage, setCurrentLanguage] = useState<VoiceLanguageMode>(language || 'tanglish');

  useEffect(() => {
    setCurrentLanguage(language || 'tanglish');
  }, [language]);

  const spokenQuote = buildSpokenPhrase(resolvedRoutine, firstName, currentLanguage);

  // Replay speech handler
  const handleReplayVoice = (mode: VoiceLanguageMode = currentLanguage) => {
    setIsSpeaking(true);
    speakRoutineVoiceReminder(resolvedRoutine, firstName, {
      language: mode,
      rate: voiceRate,
      playChimeFirst: false,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  };

  const handleStopSpeech = () => {
    stopRoutineSpeech();
    setIsSpeaking(false);
  };

  const handleLogWater = async () => {
    if (!currentUser?.uid || isLoggingWater || isWaterLogged) return;
    setIsLoggingWater(true);
    try {
      await logWaterIntake(currentUser.uid, getTodayDateString(), 250);
      setIsWaterLogged(true);
      handleStopSpeech();
      setTimeout(() => {
        onAcknowledge?.();
        onDismiss();
      }, 1000);
    } catch (err) {
      console.warn('Error logging water intake from reminder:', err);
      onDismiss();
    } finally {
      setIsLoggingWater(false);
    }
  };

  const handlePrimaryAction = () => {
    handleStopSpeech();
    onAcknowledge?.();
    onDismiss();

    if (activeType === 'workout' || activeCustom?.name?.toLowerCase().includes('workout')) {
      navigate('/workouts');
    } else if (activeType === 'walking' || activeCustom?.name?.toLowerCase().includes('walk')) {
      navigate('/');
    }
  };

  const handleClose = () => {
    handleStopSpeech();
    onDismiss();
  };

  // Stop speech if modal closes
  useEffect(() => {
    if (!isOpen) {
      stopRoutineSpeech();
      setIsSpeaking(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Type-specific icon and theme colors
  const getThemeDetails = () => {
    const lowerName = (activeCustom?.name || activeType).toLowerCase();
    const lowerCat = (activeCustom?.category || '').toLowerCase();

    if (isHydration) {
      return {
        icon: Droplets,
        gradient: 'from-cyan-500 via-blue-500 to-indigo-600',
        badgeBg: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/30',
        ringGlow: 'shadow-[0_0_50px_rgba(6,182,212,0.25)]',
        primaryBtn: 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-600 hover:to-blue-700 text-white',
        btnText: 'Logged (+250ml)',
        isHydration: true,
      };
    }

    if (activeType === 'wakeUp' || lowerName.includes('wake') || lowerCat.includes('wake')) {
      return {
        icon: Sun,
        gradient: 'from-amber-500 via-orange-500 to-amber-600',
        badgeBg: 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/30',
        ringGlow: 'shadow-[0_0_50px_rgba(245,158,11,0.25)]',
        primaryBtn: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white',
        btnText: "I'm Awake & Ready",
      };
    }

    if (activeType === 'walking' || lowerName.includes('walk') || lowerName.includes('cardio') || lowerCat.includes('cardio')) {
      return {
        icon: Footprints,
        gradient: 'from-emerald-500 via-teal-500 to-emerald-600',
        badgeBg: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30',
        ringGlow: 'shadow-[0_0_50px_rgba(16,185,129,0.25)]',
        primaryBtn: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white',
        btnText: 'Start Walking & Steps Tracker',
      };
    }

    if (activeType === 'workout' || lowerName.includes('workout') || lowerName.includes('exercise') || lowerCat.includes('workout')) {
      return {
        icon: Dumbbell,
        gradient: 'from-indigo-500 via-purple-500 to-blue-600',
        badgeBg: 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-500/30',
        ringGlow: 'shadow-[0_0_50px_rgba(147,51,234,0.25)]',
        primaryBtn: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white',
        btnText: 'Open Workout Dashboard',
      };
    }

    if (activeType === 'bedtime' || lowerName.includes('bed') || lowerName.includes('sleep') || lowerCat.includes('bed')) {
      return {
        icon: Moon,
        gradient: 'from-indigo-600 via-slate-700 to-indigo-900',
        badgeBg: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/30',
        ringGlow: 'shadow-[0_0_50px_rgba(99,102,241,0.25)]',
        primaryBtn: 'bg-gradient-to-r from-indigo-700 to-slate-800 hover:from-indigo-800 hover:to-slate-900 text-white',
        btnText: 'Wind Down & Good Night',
      };
    }

    // Default custom routine theme
    return {
      icon: Sparkles,
      gradient: 'from-teal-500 via-emerald-600 to-cyan-600',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30',
      ringGlow: 'shadow-[0_0_50px_rgba(20,184,166,0.25)]',
      primaryBtn: 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white',
      btnText: `Start ${activeCustom?.name || 'Routine'}`,
    };
  };

  const theme = getThemeDetails();
  const IconComponent = theme.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden relative shadow-2xl ${theme.ringGlow} transform transition-all`}
        style={{
          transform: 'perspective(1000px) rotateX(1deg)',
        }}
      >
        {/* Glowing Top Ambient Header */}
        <div className={`h-2.5 w-full bg-gradient-to-r ${theme.gradient}`} />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-7 space-y-5 text-center">
          {/* Animated Deity / Icon Badge */}
          <div className="flex justify-center">
            <div className="relative">
              <div
                className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white shadow-xl shadow-current/20 transform -rotate-3 hover:rotate-0 transition-transform duration-300`}
              >
                <IconComponent className="w-10 h-10" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white dark:bg-slate-900 shadow-md">
                <span className="text-lg">{displayEmoji}</span>
              </div>
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-xs">
              <span className={`px-2 py-0.5 rounded-full ${theme.badgeBg}`}>
                {titleTamil}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight pt-1">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Personalized Natural Voice Schedule Alert
            </p>
          </div>

          {/* 4-Way Language Selector */}
          <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl">
            {(
              [
                { id: 'en', label: 'English' },
                { id: 'ta', label: 'தமிழ்' },
                { id: 'tanglish', label: 'Tanglish' },
                { id: 'both', label: 'Both' },
              ] as const
            ).map((opt) => {
              const isActive = currentLanguage === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setCurrentLanguage(opt.id);
                    handleReplayVoice(opt.id);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Spoken Quote Card with Animated Waveform */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-left space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Voice Reminder Message</span>
              </span>
              {isSpeaking && (
                <div className="flex items-center gap-1">
                  <span className="w-1 h-3 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="w-1 h-4 bg-emerald-500 rounded-full animate-pulse delay-75" />
                  <span className="w-1 h-2 bg-emerald-500 rounded-full animate-pulse delay-150" />
                </div>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed italic">
              "{spokenQuote}"
            </p>

            {/* Replay / Audio Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800/60">
              <button
                type="button"
                onClick={isSpeaking ? handleStopSpeech : () => handleReplayVoice(currentLanguage)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-rose-500">Stop Speech</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Replay Voice Reminder</span>
                  </>
                )}
              </button>

              <span className="text-[10px] text-slate-400 font-mono">
                Cadence: {voiceRate}x
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {isHydration ? (
              <button
                onClick={handleLogWater}
                disabled={isLoggingWater || isWaterLogged}
                className={`w-full py-3.5 px-5 rounded-2xl font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98] ${
                  isWaterLogged
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-cyan-500/25'
                }`}
              >
                {isWaterLogged ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 animate-bounce" />
                    <span>Logged (+250ml)! Added to Daily Goal</span>
                  </>
                ) : isLoggingWater ? (
                  <>
                    <Droplets className="w-4 h-4 animate-spin" />
                    <span>Logging Intake...</span>
                  </>
                ) : (
                  <>
                    <Droplets className="w-4 h-4 fill-white/20" />
                    <span>Logged (+250ml)</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handlePrimaryAction}
                className={`w-full py-3.5 px-5 rounded-2xl font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98] ${theme.primaryBtn}`}
              >
                <span>{theme.btnText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleClose}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Dismiss for Today
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoutineReminderModal;
