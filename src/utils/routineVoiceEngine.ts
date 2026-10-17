/**
 * FitMaintenance AI - Routine Voice Reminder & Audio Synthesis Engine
 * 
 * Features:
 * 1. Web Speech API SpeechSynthesis with relaxed cadence (rate: 0.95) and natural voice prioritization.
 * 2. Web Audio API harmonic gentle chime alerting the user before speech begins.
 * 3. User-gesture audio unlocker for cross-browser and mobile Capacitor/WebView compatibility.
 * 4. Personalized, human-like phrases for Wake-Up, Walking, Workout, and Bedtime routines.
 */

export type RoutineType = 'wakeUp' | 'walking' | 'workout' | 'bedtime' | 'hydration';

interface RoutineSpeechContent {
  title: string;
  titleTamil: string;
  phrase: (name: string) => string;
  icon: string;
}

export const ROUTINE_DEFINITIONS: Record<RoutineType, RoutineSpeechContent> = {
  wakeUp: {
    title: 'Wake-Up Routine',
    titleTamil: 'காலை விழிப்பு நேரம்',
    phrase: (name) =>
      `Good morning ${name}! It is time to wake up, hydrate, and start your day energized. Have a wonderful and productive day ahead!`,
    icon: '🌅',
  },
  walking: {
    title: 'Walking & Cardio Session',
    titleTamil: 'காலை நடைப்பயிற்சி',
    phrase: (name) =>
      `${name}, it is time for your morning walking and cardio session! Step outside, breathe in the fresh air, and let's get those steps in.`,
    icon: '🚶',
  },
  workout: {
    title: 'Exercise & Strength Workout',
    titleTamil: 'உடற்பயிற்சி நேரம்',
    phrase: (name) =>
      `${name}, it is time for your scheduled exercise and strength training session! Let's get moving, hit your sets, and stay consistent with your fitness goals.`,
    icon: '🏋️',
  },
  bedtime: {
    title: 'Bedtime & Night Recovery',
    titleTamil: 'இரவு உறக்க நேரம்',
    phrase: (name) =>
      `Good evening ${name}. It is time for your bedtime routine. Dim the lights, put away your screens, and enjoy deep, restorative sleep for tomorrow.`,
    icon: '🌙',
  },
  hydration: {
    title: 'Hydration Break',
    titleTamil: 'தண்ணீர் குடிக்கும் நேரம்',
    phrase: (name) =>
      `${name}, time for a hydration break! Drink a glass of water to stay fresh and energized.`,
    icon: '💧',
  },
};

// Singleton AudioContext for gentle chimes
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays a soft, resonant two-tone harmonic notification chime (528 Hz & 660 Hz).
 * Resolves with a 200ms silent breath buffer before speech starts to eliminate audio collision.
 */
export function playHarmonicChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) {
        resolve();
        return;
      }

      const now = ctx.currentTime;
      const primaryOsc = ctx.createOscillator();
      const secondaryOsc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      primaryOsc.type = 'sine';
      primaryOsc.frequency.setValueAtTime(528, now); // Solfeggio 528 Hz tone

      secondaryOsc.type = 'sine';
      secondaryOsc.frequency.setValueAtTime(660, now + 0.10); // Harmonic fifth 660 Hz

      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.25, now + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.60);

      primaryOsc.connect(gainNode);
      secondaryOsc.connect(gainNode);
      gainNode.connect(ctx.destination);

      primaryOsc.start(now);
      secondaryOsc.start(now + 0.10);

      primaryOsc.stop(now + 0.65);
      secondaryOsc.stop(now + 0.65);

      // Resolves at 800ms allowing a 200ms silent breath before speech begins
      setTimeout(resolve, 800);
    } catch {
      resolve();
    }
  });
}

export interface RoutineVoiceTarget {
  name: string;
  voicePrompt?: string;
  icon?: string;
  category?: string;
  titleTamil?: string;
}

import {
  loadVoices,
  getBestNaturalVoice as getBestVoiceHelper,
  speakChunk,
  splitIntoSentences,
  stopAllVoiceSpeech,
} from './voiceSynthesisHelper';
import { getConversationalRoutinePhrase } from '../services/conversationalAiVoiceService';
import type { VoiceLanguageMode } from '../services/firestoreService';

/**
 * Constructs a human-like, personalized voice phrase for any routine (built-in or custom)
 */
export function buildSpokenPhrase(
  routine: RoutineType | RoutineVoiceTarget,
  userName = 'Athlete',
  mode: VoiceLanguageMode = 'tanglish'
): string {
  const cleanedName = (userName || 'Athlete').trim().split(' ')[0];

  if (typeof routine === 'string') {
    return getConversationalRoutinePhrase(routine, cleanedName, mode).text;
  }

  const prompt = routine.voicePrompt?.trim() || '';
  const category = routine.category || routine.name;

  // If user selected Tamil or Tanglish, but prompt is empty or default English placeholder,
  // return the rich colloquial Tamil / Tanglish phrase!
  const isDefaultEnglishPrompt =
    !prompt ||
    /time for your morning walk/i.test(prompt) ||
    /time for your scheduled/i.test(prompt) ||
    /hydration break/i.test(prompt) ||
    /drink a glass of water/i.test(prompt) ||
    /protein shake/i.test(prompt) ||
    /evening meditation/i.test(prompt) ||
    /bedtime routine/i.test(prompt) ||
    /scheduled routine/i.test(prompt);

  if ((mode === 'ta' || mode === 'tanglish') && isDefaultEnglishPrompt) {
    return getConversationalRoutinePhrase(category, cleanedName, mode).text;
  }

  if (mode === 'en' && isDefaultEnglishPrompt) {
    return getConversationalRoutinePhrase(category, cleanedName, 'en').text;
  }

  if (prompt) {
    if (/{name}/i.test(prompt)) {
      return prompt.replace(/{name}/gi, cleanedName);
    }
    return `${cleanedName}, ${prompt}`;
  }

  return getConversationalRoutinePhrase(category, cleanedName, mode).text;
}

/**
 * Checks whether a given repeat frequency ('daily' | 'weekdays' | 'weekends') is active on a specific date
 */
export function isRoutineActiveToday(
  repeat: 'daily' | 'weekdays' | 'weekends',
  date: Date = new Date()
): boolean {
  if (repeat === 'daily') return true;
  const day = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  if (repeat === 'weekdays') {
    return day >= 1 && day <= 5;
  }
  if (repeat === 'weekends') {
    return day === 0 || day === 6;
  }
  return true;
}

/**
 * Discovers and selects the most natural, relaxed human-sounding voice available
 */
export function getBestNaturalVoice(lang: 'en' | 'ta' = 'en'): SpeechSynthesisVoice | null {
  return getBestVoiceHelper(lang);
}

/**
 * Speaks a natural, personalized voice reminder for the specified routine type or custom routine
 * supporting the 4 distinct language selections (en, ta, tanglish, both) with zero audio cut-offs.
 */
export async function speakRoutineVoiceReminder(
  routine: RoutineType | RoutineVoiceTarget,
  userName = 'Athlete',
  options: {
    language?: VoiceLanguageMode;
    rate?: number;
    pitch?: number;
    playChimeFirst?: boolean;
    onStart?: () => void;
    onEnd?: () => void;
  } = {}
): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  // Cancel any ongoing speech
  stopAllVoiceSpeech();

  // Play gentle alert chime before voice begins
  if (options.playChimeFirst !== false) {
    await playHarmonicChime();
  }

  const mode = options.language || 'tanglish';
  const cleanedName = (userName || 'Athlete').trim().split(' ')[0];
  const routineKey = typeof routine === 'string' ? routine : routine.category || routine.name;
  const hasCustomPrompt = typeof routine !== 'string' && routine.voicePrompt && routine.voicePrompt.trim().length > 0;
  const phraseInfo = getConversationalRoutinePhrase(routineKey, cleanedName, mode);

  options.onStart?.();

  try {
    await loadVoices();

    if (mode === 'both') {
      // Bilingual Mode: Full natural English first, followed cleanly by full Spoken Tamil
      const enText = hasCustomPrompt
        ? buildSpokenPhrase(routine, userName, 'en')
        : getConversationalRoutinePhrase(routineKey, cleanedName, 'en').text;

      const taText = getConversationalRoutinePhrase(routineKey, cleanedName, 'ta').text;

      // Phase 1: Natural English
      const enSentences = splitIntoSentences(enText);
      for (const s of enSentences) {
        await speakChunk(s, 'en', {
          rate: options.rate ?? 0.95,
          pitch: options.pitch ?? 1.0,
        });
      }

      // Natural pause between languages
      await new Promise((r) => setTimeout(r, 350));

      // Phase 2: Authentic Spoken Tamil
      const taSentences = splitIntoSentences(taText);
      for (const s of taSentences) {
        await speakChunk(s, 'ta', {
          rate: options.rate ?? 0.94,
          pitch: options.pitch ?? 1.0,
        });
      }
    } else {
      // Single Language Mode: 'en', 'ta', or 'tanglish'
      const textToSpeak = hasCustomPrompt
        ? buildSpokenPhrase(routine, userName, mode)
        : phraseInfo.text;

      const hasTamilGlyphs = /[\u0B80-\u0BFF]/.test(textToSpeak);
      const targetLang: 'en' | 'ta' = hasTamilGlyphs ? 'ta' : (mode === 'ta' ? 'ta' : 'en');

      const sentences = splitIntoSentences(textToSpeak);
      for (let i = 0; i < sentences.length; i++) {
        await speakChunk(sentences[i], targetLang, {
          rate: options.rate ?? (targetLang === 'ta' ? 0.94 : 0.95),
          pitch: options.pitch ?? 1.0,
          volume: 1.0,
        });

        if (i < sentences.length - 1) {
          await new Promise((r) => setTimeout(r, 160));
        }
      }
    }
  } catch (err) {
    console.warn('Routine voice reminder error:', err);
  } finally {
    options.onEnd?.();
  }
}

/**
 * Stops any active speech synthesis
 */
export function stopRoutineSpeech(): void {
  stopAllVoiceSpeech();
}

/**
 * Initializes and unlocks AudioContext and SpeechSynthesis on first user interaction
 */
export function initUserGestureAudioUnlock(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleInteraction = () => {
    try {
      getAudioContext();
      if (window.speechSynthesis && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch {
      // Ignored
    }
  };

  window.addEventListener('click', handleInteraction, { passive: true, once: false });
  window.addEventListener('touchstart', handleInteraction, { passive: true, once: false });
  window.addEventListener('keydown', handleInteraction, { passive: true, once: false });

  return () => {
    window.removeEventListener('click', handleInteraction);
    window.removeEventListener('touchstart', handleInteraction);
    window.removeEventListener('keydown', handleInteraction);
  };
}

