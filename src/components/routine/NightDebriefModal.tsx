import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Moon,
  Volume2,
  VolumeX,
  FastForward,
  X,
  Sparkles,
  Flame,
  AlertTriangle,
  Power,
  ShieldCheck,
} from 'lucide-react';
import {
  type DebriefScript,
  type DebriefSegmentItem,
  speakNightDebrief,
  stopNightDebriefSpeech,
} from '../../utils/nightDebriefEngine';
import type { NightDebriefLanguage } from '../../services/firestoreService';

interface NightDebriefModalProps {
  script: DebriefScript;
  language?: NightDebriefLanguage;
  blackoutEnabled?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onDebriefCompleted?: () => void;
}

export const NightDebriefModal: React.FC<NightDebriefModalProps> = ({
  script,
  language = 'both',
  blackoutEnabled = true,
  isOpen,
  onClose,
  onDebriefCompleted,
}) => {
  // Speech & Active State
  const [currentSegment, setCurrentSegment] = useState<DebriefSegmentItem>(
    script.segments[0] || {
      id: 'achievement',
      category: 'achievement',
      titleEn: 'Daily Achievements',
      titleTa: 'இன்றைய சாதனைகள்',
      badge: 'Praise',
      badgeColor: 'emerald',
      textEn: '',
      textTa: '',
    }
  );
  const [currentSentence, setCurrentSentence] = useState<string>('');
  const [isTamilSpeaking, setIsTamilSpeaking] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [segmentIndex, setSegmentIndex] = useState<number>(0);
  const [currentLanguage, setCurrentLanguage] = useState<NightDebriefLanguage>(language);

  // Sync prop language when modal opens
  useEffect(() => {
    setCurrentLanguage(language);
  }, [language]);

  // Blackout Sleep State
  const [isBlackoutActive, setIsBlackoutActive] = useState<boolean>(false);
  const [blackoutFading, setBlackoutFading] = useState<boolean>(false);

  // Double-tap touch tracker for mobile wake
  const lastTouchTimeRef = useRef<number>(0);

  // Fullscreen helper
  const enterFullscreen = useCallback(() => {
    try {
      if (document.documentElement && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {
      // Ignored if browser blocks non-user gesture
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      // Ignored
    }
  }, []);

  // Transition into OLED Screen-Off Sleep Blackout Mode
  const triggerSleepBlackout = useCallback(() => {
    stopNightDebriefSpeech();
    setIsSpeaking(false);
    onDebriefCompleted?.();

    if (!blackoutEnabled) {
      onClose();
      return;
    }

    setBlackoutFading(true);
    setTimeout(() => {
      setIsBlackoutActive(true);
      setBlackoutFading(false);
      enterFullscreen();
    }, 400);
  }, [blackoutEnabled, enterFullscreen, onClose, onDebriefCompleted]);

  const triggerSleepBlackoutRef = useRef(triggerSleepBlackout);
  triggerSleepBlackoutRef.current = triggerSleepBlackout;

  // Clean exit from Sleep Blackout Mode
  const wakeFromSleepBlackout = useCallback(() => {
    exitFullscreen();
    setIsBlackoutActive(false);
    onClose();
  }, [exitFullscreen, onClose]);

  // Handle double-tap or double-click to wake
  const handleDoubleTap = useCallback(() => {
    wakeFromSleepBlackout();
  }, [wakeFromSleepBlackout]);

  const handleTouchStart = useCallback(() => {
    const now = Date.now();
    if (now - lastTouchTimeRef.current < 350) {
      // Double tap detected
      wakeFromSleepBlackout();
    }
    lastTouchTimeRef.current = now;
  }, [wakeFromSleepBlackout]);

  // Start Speech Synthesis when modal opens or language changes
  useEffect(() => {
    if (!isOpen || isBlackoutActive) {
      stopNightDebriefSpeech();
      return;
    }

    setIsSpeaking(true);
    setCurrentSegment(script.segments[0]);
    setSegmentIndex(0);

    let isSubscribed = true;

    speakNightDebrief(script, currentLanguage, {
      onSegmentStart: (seg, isTa) => {
        if (!isSubscribed) return;
        setCurrentSegment(seg);
        setIsTamilSpeaking(isTa);
        const idx = script.segments.findIndex((s) => s.id === seg.id);
        if (idx !== -1) setSegmentIndex(idx);
      },
      onSentence: (text, isTa) => {
        if (!isSubscribed) return;
        setCurrentSentence(text);
        setIsTamilSpeaking(isTa);
      },
      onComplete: () => {
        if (!isSubscribed) return;
        setIsSpeaking(false);
        triggerSleepBlackoutRef.current();
      },
      onError: (err) => {
        console.warn('Night debrief voice notice:', err);
      },
    });

    return () => {
      isSubscribed = false;
      stopNightDebriefSpeech();
    };
  }, [isOpen, script, currentLanguage, isBlackoutActive]);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isBlackoutActive) {
          wakeFromSleepBlackout();
        } else {
          stopNightDebriefSpeech();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBlackoutActive, onClose, wakeFromSleepBlackout]);

  if (!isOpen) return null;

  // ================= 1. PITCH-BLACK OLED SLEEP BLACKOUT MODE =================
  if (isBlackoutActive) {
    return (
      <div
        onDoubleClick={handleDoubleTap}
        onTouchStart={handleTouchStart}
        className="fixed inset-0 z-[99999] bg-black text-slate-500 cursor-none select-none flex flex-col justify-end items-center pb-8 px-4 transition-all duration-1000 animate-in fade-in"
        style={{ backgroundColor: '#000000' }}
        title="Double-tap anywhere to wake screen"
      >
        {/* Subtle, ultra-dimmed status prompt */}
        <div className="text-center space-y-2 opacity-15 hover:opacity-50 transition-opacity duration-300">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mx-auto animate-pulse" />
          <p className="text-[11px] font-mono tracking-widest uppercase">
            Screen Off • Prepare for Sleep
          </p>
          <p className="text-[10px] text-slate-600">
            Double-tap anywhere to wake
          </p>
        </div>

        {/* Discrete manual exit pill on hover */}
        <button
          onClick={wakeFromSleepBlackout}
          className="absolute top-6 right-6 opacity-0 hover:opacity-30 transition-opacity p-2 text-xs font-mono text-slate-600 border border-slate-900 rounded-lg"
        >
          Exit
        </button>
      </div>
    );
  }

  // ================= 2. ACTIVE 3D NIGHT DEBRIEF BRIEFING MODAL =================
  const badgeColors = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  };

  const activeBadgeColor = badgeColors[currentSegment.badgeColor] || badgeColors.emerald;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl transition-opacity duration-500 ${
        blackoutFading ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden card-3d">
        {/* Ambient Top Glow Orbs */}
        <div className="absolute -top-24 -left-24 w-60 h-60 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Moon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  9:00 PM End-of-Day AI Debrief
                </h3>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Night Protocol
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Live accountability review & screen-off transition
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
              {(['en', 'ta', 'both'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setCurrentLanguage(mode)}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition ${
                    currentLanguage === mode
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode === 'en' ? 'English' : mode === 'ta' ? 'தமிழ்' : 'Tanglish'}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                stopNightDebriefSpeech();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
              title="Close Debrief"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4-Pillar Progress Track */}
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span>Progress ({segmentIndex + 1} of {script.segments.length})</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
              {currentLanguage === 'both'
                ? isTamilSpeaking
                  ? 'Tanglish: தமிழ்'
                  : 'Tanglish: English'
                : isTamilSpeaking
                ? 'தமிழ் ஆடியோ'
                : 'English Audio'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {script.segments.map((seg, idx) => {
              const isPast = idx < segmentIndex;
              const isCurrent = idx === segmentIndex;
              return (
                <div
                  key={seg.id}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isCurrent
                      ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-sm shadow-emerald-400/50'
                      : isPast
                      ? 'bg-emerald-500/40'
                      : 'bg-slate-800'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Animated Glowing Audio Waveform */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-center gap-1.5 h-16 relative overflow-hidden">
          {/* Neon pulsating waveform bars */}
          {[18, 36, 52, 24, 48, 64, 32, 58, 44, 28, 60, 42, 20, 46, 30].map((height, i) => (
            <span
              key={i}
              className="w-1.5 rounded-full bg-gradient-to-t from-emerald-500 via-teal-400 to-cyan-300 transition-all duration-150"
              style={{
                height: isSpeaking ? `${height}px` : '4px',
                opacity: isSpeaking ? 0.9 : 0.25,
                animation: isSpeaking
                  ? `pulseSubtle 0.8s ease-in-out infinite alternate ${i * 0.06}s`
                  : 'none',
              }}
            />
          ))}
        </div>

        {/* Live Synchronized Caption Card */}
        <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3 relative z-10">
          <div className="flex items-center justify-between gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${activeBadgeColor}`}>
              {currentSegment.category === 'achievement' && <Sparkles className="w-3.5 h-3.5" />}
              {currentSegment.category === 'scold' && (
                script.escapedScold ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />
              )}
              {currentSegment.category === 'motivation' && <Flame className="w-3.5 h-3.5" />}
              {currentSegment.category === 'windDown' && <Power className="w-3.5 h-3.5" />}
              <span>{currentSegment.badge}</span>
            </span>

            <span className="text-[11px] font-bold text-slate-400">
              {isTamilSpeaking ? currentSegment.titleTa : currentSegment.titleEn}
            </span>
          </div>

          <p className="text-sm sm:text-base font-medium text-slate-200 leading-relaxed min-h-[90px]">
            {currentSentence || (isTamilSpeaking ? currentSegment.textTa : currentSegment.textEn)}
          </p>
        </div>

        {/* Footer Actions & Blackout Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 relative z-10">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                if (isMuted) {
                  setIsMuted(false);
                } else {
                  setIsMuted(true);
                  stopNightDebriefSpeech();
                }
              }}
              className="p-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
              title={isMuted ? 'Resume Voice' : 'Mute Speech'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span>{isMuted ? 'Unmute' : 'Mute Voice'}</span>
            </button>

            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Blackout triggers automatically once debrief ends
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={triggerSleepBlackout}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-slate-900 hover:from-indigo-500 hover:to-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition active:scale-95"
              title="Skip remaining voice and immediately turn screen off"
            >
              <FastForward className="w-4 h-4" />
              <span>Skip to Sleep Blackout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NightDebriefModal;

