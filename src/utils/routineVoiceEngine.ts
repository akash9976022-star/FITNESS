/**
 * FitMaintenance AI - Routine Voice Reminder & Audio Synthesis Engine
 * 
 * Features:
 * 1. Web Speech API SpeechSynthesis with relaxed cadence (rate: 0.95) and natural voice prioritization.
 * 2. Web Audio API harmonic gentle chime alerting the user before speech begins.
 * 3. User-gesture audio unlocker for cross-browser and mobile Capacitor/WebView compatibility.
 * 4. Personalized, human-like phrases for Wake-Up, Walking, Workout, and Bedtime routines.
 */

export type RoutineType = 'wakeUp' | 'walking' | 'workout' | 'bedtime';

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
 * Plays a soft, resonant two-tone harmonic notification chime (528 Hz & 660 Hz)
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
      primaryOsc.frequency.setValueAtTime(528, now); // Solfeggio frequency

      secondaryOsc.type = 'sine';
      secondaryOsc.frequency.setValueAtTime(660, now + 0.12); // Harmonic fifth

      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.35, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      primaryOsc.connect(gainNode);
      secondaryOsc.connect(gainNode);
      gainNode.connect(ctx.destination);

      primaryOsc.start(now);
      secondaryOsc.start(now + 0.12);

      primaryOsc.stop(now + 0.9);
      secondaryOsc.stop(now + 0.9);

      setTimeout(resolve, 600);
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

/**
 * Constructs a human-like, personalized voice phrase for any routine (built-in or custom)
 */
export function buildSpokenPhrase(
  routine: RoutineType | RoutineVoiceTarget,
  userName = 'Athlete'
): string {
  const cleanedName = (userName || 'Athlete').trim().split(' ')[0];

  if (typeof routine === 'string') {
    const def = ROUTINE_DEFINITIONS[routine] || ROUTINE_DEFINITIONS.wakeUp;
    return def.phrase(cleanedName);
  }

  if (routine.voicePrompt && routine.voicePrompt.trim().length > 0) {
    const prompt = routine.voicePrompt.trim();
    if (/{name}/i.test(prompt)) {
      return prompt.replace(/{name}/gi, cleanedName);
    }
    return `${cleanedName}, ${prompt}`;
  }

  return `Good day ${cleanedName}! It is time for your scheduled ${routine.name}. Let's stay consistent and make great progress today!`;
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
 * Discovers and selects the most natural, relaxed human-sounding English voice available
 */
export function getBestNaturalVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Natural Google / Edge / Apple neural voices
  const naturalMatch = voices.find(
    (v) =>
      v.lang.startsWith('en') &&
      /natural|google|samantha|karen|ava|serena|oliver|victoria|daniel/i.test(v.name)
  );
  if (naturalMatch) return naturalMatch;

  // 2. Any English voice
  const englishMatch = voices.find((v) => v.lang.startsWith('en'));
  if (englishMatch) return englishMatch;

  // 3. System default
  return voices[0] || null;
}

/**
 * Speaks a natural, personalized voice reminder for the specified routine type or custom routine
 */
export async function speakRoutineVoiceReminder(
  routine: RoutineType | RoutineVoiceTarget,
  userName = 'Athlete',
  options: {
    rate?: number;
    pitch?: number;
    playChimeFirst?: boolean;
    onStart?: () => void;
    onEnd?: () => void;
  } = {}
): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('SpeechSynthesis is not supported on this device/browser.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Play gentle alert chime before voice begins
  if (options.playChimeFirst !== false) {
    await playHarmonicChime();
  }

  const textToSpeak = buildSpokenPhrase(routine, userName);

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.rate = options.rate ?? 0.95; // Relaxed natural cadence
  utterance.pitch = options.pitch ?? 1.0;
  utterance.volume = 1.0;

  const naturalVoice = getBestNaturalVoice();
  if (naturalVoice) {
    utterance.voice = naturalVoice;
  }

  utterance.onstart = () => {
    options.onStart?.();
  };

  utterance.onend = () => {
    options.onEnd?.();
  };

  utterance.onerror = (e) => {
    console.warn('SpeechSynthesis error:', e);
    options.onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Stops any active speech synthesis
 */
export function stopRoutineSpeech(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
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

