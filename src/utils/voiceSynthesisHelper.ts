/**
 * FitMaintenance AI - Universal Neural Voice & Speech Synthesis Helper
 * 
 * Provides:
 * 1. Asynchronous voice loading with onvoiceschanged + timeout fallback.
 * 2. High-priority neural voice selection for en-IN, en-US, and ta-IN.
 * 3. Strict assignment of both utterance.voice and utterance.lang.
 * 4. Micro-pause and sentence chunking to eliminate robotic monotony.
 * 5. Execution lock and single-resolution Promises with callback nullification to eliminate duplicate speech loops.
 */

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve([]);
      return;
    }

    const immediate = window.speechSynthesis.getVoices();
    if (immediate && immediate.length > 0) {
      resolve(immediate);
      return;
    }

    let resolved = false;
    const finish = () => {
      if (!resolved) {
        resolved = true;
        resolve(window.speechSynthesis.getVoices() || []);
      }
    };

    window.speechSynthesis.onvoiceschanged = finish;
    setTimeout(finish, 350);
  });
}

/**
 * Discovers and selects the most natural, human-sounding voice available
 * strictly matching target language ('en' | 'ta').
 */
export function getBestNaturalVoice(
  lang: 'en' | 'ta',
  providedVoices?: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = providedVoices && providedVoices.length > 0
    ? providedVoices
    : window.speechSynthesis.getVoices();

  if (!voices || voices.length === 0) return null;

  if (lang === 'ta') {
    // 1. Natural / Neural Online Tamil: Google தமிழ், Microsoft Pallavi Online, Microsoft Valluvar Online
    const topTamil = voices.find((v) => {
      const n = v.name.toLowerCase();
      const l = v.lang.toLowerCase().replace('_', '-');
      const isTa = l.startsWith('ta') || n.includes('tamil') || n.includes('தமிழ்');
      return (
        isTa &&
        (n.includes('google') ||
         n.includes('pallavi') ||
         n.includes('valluvar') ||
         n.includes('natural') ||
         n.includes('neural') ||
         n.includes('online'))
      );
    });
    if (topTamil) return topTamil;

    // 2. Exact ta-IN / ta-LK or any Tamil voice
    const anyTa = voices.find((v) => {
      const l = v.lang.toLowerCase().replace('_', '-');
      const n = v.name.toLowerCase();
      return (l.startsWith('ta') || n.includes('tamil') || n.includes('தமிழ்')) && !n.includes('english');
    });
    if (anyTa) return anyTa;

    return null;
  } else {
    // English
    // 1. Prioritize: "Google English (India)" / "Microsoft Neerja Online (Natural)" / "Microsoft Prabhat Online (Natural)" (en-IN)
    const indianEn = voices.find((v) => {
      const l = v.lang.toLowerCase().replace('_', '-');
      const n = v.name.toLowerCase();
      const isEnIn = l === 'en-in';
      return (
        isEnIn &&
        (n.includes('google') ||
         n.includes('neerja') ||
         n.includes('prabhat') ||
         n.includes('natural') ||
         n.includes('neural') ||
         n.includes('online'))
      );
    }) || voices.find((v) => {
      const l = v.lang.toLowerCase().replace('_', '-');
      const n = v.name.toLowerCase();
      return (
        l === 'en-in' ||
        n.includes('india') ||
        n.includes('neerja') ||
        n.includes('prabhat') ||
        n.includes('ravi') ||
        n.includes('heera')
      );
    });
    if (indianEn) return indianEn;

    // 2. "Google US English" / "Microsoft Aria Online (Natural)" (en-US)
    const usEn = voices.find((v) => {
      const l = v.lang.toLowerCase().replace('_', '-');
      const n = v.name.toLowerCase();
      return (
        (l === 'en-us' || l.startsWith('en')) &&
        (n.includes('google') ||
         n.includes('aria') ||
         n.includes('natural') ||
         n.includes('neural') ||
         n.includes('online') ||
         n.includes('jenny') ||
         n.includes('guy') ||
         n.includes('samantha'))
      );
    });
    if (usEn) return usEn;

    // 3. Any English voice starting with 'en'
    const anyEn = voices.find((v) => {
      const l = v.lang.toLowerCase().replace('_', '-');
      return l.startsWith('en');
    });
    if (anyEn) return anyEn;

    return null;
  }
}

/**
 * Breaks a long paragraph into clean, natural conversational sentences
 * by splitting on punctuation marks (. ! ? ।).
 */
export function splitIntoSentences(text: string): string[] {
  if (!text) return [];
  const raw = text.split(/([.!?।]+[\s$]+)/);
  const sentences: string[] = [];
  let buffer = '';

  for (let i = 0; i < raw.length; i++) {
    buffer += raw[i];
    if (/[.!?।]$/.test(buffer.trim()) || i === raw.length - 1) {
      const trimmed = buffer.trim();
      if (trimmed.length > 0) {
        sentences.push(trimmed);
      }
      buffer = '';
    }
  }

  return sentences.length > 0 ? sentences : [text.trim()];
}

/**
 * Single sequential speech chunk executor with strict callback nullification,
 * watchdog timeout, and voice matching.
 */
export function speakChunk(
  text: string,
  lang: 'en' | 'ta',
  options: {
    rate?: number;
    pitch?: number;
    volume?: number;
    voices?: SpeechSynthesisVoice[];
    onStart?: () => void;
    onEnd?: () => void;
    onBoundary?: (e: SpeechSynthesisEvent) => void;
  } = {}
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }

    const trimmed = (text || '').trim();
    if (!trimmed) {
      resolve();
      return;
    }

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(trimmed);
    const voice = getBestNaturalVoice(lang, options.voices);

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || (lang === 'ta' ? 'ta-IN' : 'en-IN');
    } else {
      utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
    }

    utterance.rate = options.rate ?? (lang === 'ta' ? 0.94 : 0.96);
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

    let hasResolved = false;
    let watchdogTimer: any = null;

    const cleanupAndResolve = () => {
      if (hasResolved) return;
      hasResolved = true;
      if (watchdogTimer) clearTimeout(watchdogTimer);
      utterance.onend = null;
      utterance.onerror = null;
      utterance.onboundary = null;
      utterance.onstart = null;
      options.onEnd?.();
      resolve();
    };

    // Watchdog to prevent TTS hang on mobile / Chrome
    const maxTimeoutMs = Math.max(5000, trimmed.length * 160 + 2500);
    watchdogTimer = setTimeout(cleanupAndResolve, maxTimeoutMs);

    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onboundary = (e) => {
      options.onBoundary?.(e);
    };

    utterance.onend = () => {
      cleanupAndResolve();
    };

    utterance.onerror = (e) => {
      console.warn('Speech chunk notice:', e);
      cleanupAndResolve();
    };

    window.speechSynthesis.speak(utterance);
  });
}

