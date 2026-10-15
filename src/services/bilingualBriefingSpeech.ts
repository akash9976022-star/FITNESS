import { getTamilDate } from '../utils/tamilCalendar';
import { getPanchangamTimings } from '../utils/panchangamEngine';
import { getDailyRasipalan, TAMIL_ZODIAC_SIGNS } from '../utils/rasipalanEngine';
import type { TamilRasiId } from '../types/calendar';
import type { BriefingSectionData, BriefingLanguage, VoiceDiagnostics } from '../types/alarmBriefing';

export interface BriefingGenerationParams {
  date?: Date | string;
  preferredRasi?: TamilRasiId | string;
  targetCalories?: number;
  targetProtein?: number;
  waterGoalMl?: number;
  workoutTitle?: string;
}

/**
 * Generate all 6 structured dual-language briefing sections
 */
export function generateDailyBriefingSections(params: BriefingGenerationParams): BriefingSectionData[] {
  const dateObj = params.date ? new Date(params.date) : new Date();
  const dateStr = dateObj.toISOString().split('T')[0];

  // 1. Calendar & Tamil Date
  const tamilDate = getTamilDate(dateStr);
  const panchangam = getPanchangamTimings(dateStr);

  // 2. Zodiac Sign & Rasipalan
  const rasiId = (params.preferredRasi as TamilRasiId) || 'mesham';
  const rasiMeta = TAMIL_ZODIAC_SIGNS.find((r) => r.id === rasiId) || TAMIL_ZODIAC_SIGNS[0];
  const rasipalan = getDailyRasipalan(rasiId, dateStr);

  // 3. Fitness Goals
  const targetCals = params.targetCalories || 2450;
  const targetProtein = params.targetProtein || 165;
  const waterGoal = params.waterGoalMl || 3000;
  const workoutRoutine = params.workoutTitle || 'Upper Body Push & Core Maintenance';

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayNameEn = dayNamesEn[dateObj.getDay()];
  const monthNameEn = monthNamesEn[dateObj.getMonth()];
  const dayNumber = dateObj.getDate();
  const yearNumber = dateObj.getFullYear();

  // Curated bilingual motivational quotes
  const quotes = [
    {
      en: 'Discipline is the bridge between maintenance goals and lifelong vitality. Stay consistent today!',
      ta: 'விடாமுயற்சியும் தொடர் பயிற்சியுமே ஆரோக்கிய வாழ்வின் அடித்தளம். இன்றைய நாளில் உங்கள் இலக்குகளை அடையுங்கள்!',
    },
    {
      en: 'Physical strength is the reflection of daily patience. Honor your body with good nutrition and movement.',
      ta: 'உடல் வலிமை என்பது தினசரி பொறுமையின் அடையாளம். சிறந்த உணவு மற்றும் உடற்பயிற்சியால் உடலைப் போற்றுங்கள்.',
    },
    {
      en: 'Consistency beats intensity every single time. One workout and one healthy meal at a time.',
      ta: 'கடும் முயற்சியை விட தொடர் பயிற்சியே நிலையான பலன் தரும். ஒவ்வொரு நாளும் இலக்கை நோக்கி முன்னேறுங்கள்.',
    },
  ];
  const selectedQuote = quotes[dateObj.getDate() % quotes.length];

  return [
    // Section 1: Greeting & Date
    {
      key: 'greeting',
      order: 1,
      labelEn: 'Greeting & Date',
      labelTa: 'காலை வணக்கம் & நாள்',
      iconName: 'Sun',
      textEn: `Good morning! Today is ${dayNameEn}, ${monthNameEn} ${dayNumber}, ${yearNumber}. In the Tamil calendar, today is ${tamilDate.tamilMonthEn} ${tamilDate.tamilDay}, in the year of ${tamilDate.tamilYearEn}.`,
      textTa: `காலை வணக்கம்! இன்று ${panchangam.dayOfWeekTa}, ${dayNumber} ${monthNameEn} ${yearNumber}. தமிழ் நாட்காட்டியின்படி இன்று ${tamilDate.tamilYearTa} ஆண்டு, ${tamilDate.tamilMonthTa} மாதம் ${tamilDate.tamilDay}-ஆம் நாள் ஆகும்.`,
    },

    // Section 2: Panchangam & Auspicious Timings
    {
      key: 'panchangam',
      order: 2,
      labelEn: 'Panchangam & Timings',
      labelTa: 'பஞ்சாங்கம் & நல்ல நேரம்',
      iconName: 'Compass',
      textEn: `Today's auspicious Panchangam timings: Tithi is ${panchangam.tithiEn}. Nakshatram is ${panchangam.nakshatramEn}. Nalla Neram is morning ${panchangam.nallaNeramMorning}, and evening ${panchangam.nallaNeramEvening}. Ragukalam is ${panchangam.ragukalam}. Yemagandam is ${panchangam.yemagandam}. Kuligai is ${panchangam.kuligai}.`,
      textTa: `இன்றைய பஞ்சாங்க விபரம்: திதி ${panchangam.tithiTa}. நட்சத்திரம் ${panchangam.nakshatramTa}. சுப காரியங்களுக்கான நல்ல நேரம் காலை ${panchangam.nallaNeramMorning}, மற்றும் மாலை ${panchangam.nallaNeramEvening}. இராகு காலம் ${panchangam.ragukalam}. எமகண்டம் ${panchangam.yemagandam}. குளிகை காலம் ${panchangam.kuligai}.`,
    },

    // Section 3: Daily Rasipalan
    {
      key: 'rasipalan',
      order: 3,
      labelEn: 'Daily Rasipalan',
      labelTa: 'இன்றைய ராசிபலன்',
      iconName: 'Sparkles',
      textEn: `Daily Rasipalan for your zodiac sign, ${rasiMeta.nameEn}: ${rasipalan.generalOutlookEn} For your training, ${rasipalan.fitnessFocusEn}`,
      textTa: `உங்கள் ${rasiMeta.nameTa} ராசிக்கான இன்றைய ராசிபலன்: ${rasipalan.generalOutlookTa} உடற்பயிற்சி குறிப்பு: ${rasipalan.fitnessFocusTa}`,
    },

    // Section 4: Fitness & Body Maintenance Goals
    {
      key: 'fitness_goals',
      order: 4,
      labelEn: 'Fitness & Body Maintenance',
      labelTa: 'உடற்பயிற்சி & ஊட்டச்சத்து',
      iconName: 'Dumbbell',
      textEn: `Today's body equilibrium targets: Caloric maintenance target is ${targetCals} kilocalories. Protein goal is ${targetProtein} grams. Hydration target is ${waterGoal} milliliters. Today's scheduled workout is ${workoutRoutine}.`,
      textTa: `இன்றைய உடல் பராமரிப்பு இலக்குகள்: கலோரி பராமரிப்பு இலக்கு ${targetCals} கிலோ கலோரி. புரதச்சத்து இலக்கு ${targetProtein} கிராம். குடிநீர் இலக்கு ${waterGoal} மில்லி லிட்டர். இன்றைய பயிற்சி முறை: ${workoutRoutine}.`,
    },

    // Section 5: Daily Motivation
    {
      key: 'motivation',
      order: 5,
      labelEn: 'Daily Motivation',
      labelTa: 'தினசரி உத்வேக வாசகம்',
      iconName: 'Flame',
      textEn: `Daily Motivation: ${selectedQuote.en}`,
      textTa: `இன்றைய உத்வேக சிந்தனை: ${selectedQuote.ta}`,
    },

    // Section 6: Spiritual Transition Announcement
    {
      key: 'spiritual_transition',
      order: 6,
      labelEn: 'Spiritual Transition',
      labelTa: 'பக்திப் பாடல் தொடக்கம்',
      iconName: 'Music',
      textEn: `Now playing soothing background music, followed by Kanda Sashti Kavasam and Sivapuranam devotional chants. Have an energized, mindful, and blessed day!`,
      textTa: `இப்போது அமைதியான பின்னணி இசையுடன் கந்த சஷ்டி கவசம் மற்றும் சிவபுராணம் பக்திப் பாடல்கள் தொடங்குகின்றன. இன்றைய நாள் உங்களுக்கு இனிய நாளாக அமையட்டும்!`,
    },
  ];
}

/**
 * Speech Synthesis Orchestrator for English -> Tamil Sequential Speech
 */
class BilingualBriefingSpeechService {
  private isSpeaking: boolean = false;
  private isPaused: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private availableVoices: SpeechSynthesisVoice[] = [];

  private onSectionChangeCb: ((sectionIndex: number, lang: BriefingLanguage, text: string) => void) | null = null;
  private onCompleteCb: (() => void) | null = null;
  private onErrorCb: ((err: any) => void) | null = null;

  private keepAliveInterval: any = null;

  constructor() {
    this.initVoices();
  }

  private initVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const load = () => {
      this.availableVoices = window.speechSynthesis.getVoices();
    };

    load();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = load;
    }
  }

  /**
   * Score voices by naturalness, neural synthesis, and language fidelity
   */
  private scoreVoice(voice: SpeechSynthesisVoice, targetLang: BriefingLanguage): number {
    const name = voice.name.toLowerCase();
    const lang = (voice.lang || '').toLowerCase().replace('_', '-');
    let score = 0;

    if (targetLang === 'en') {
      if (lang === 'en-in') score += 100;
      else if (lang === 'en-us') score += 75;
      else if (lang === 'en-gb') score += 65;
      else if (lang.startsWith('en')) score += 40;
      else return -1; // Not an English voice

      // Prioritize natural / neural / premium engines
      if (name.includes('natural') || name.includes('neural')) score += 60;
      if (name.includes('google')) score += 50;
      if (name.includes('microsoft')) score += 40;
      if (name.includes('siri') || name.includes('apple')) score += 30;
      if (name.includes('online')) score += 20;
      if (name.includes('enhanced') || name.includes('premium')) score += 20;
    } else {
      // Tamil voice
      if (lang === 'ta-in' || lang === 'ta') score += 100;
      else if (name.includes('tamil')) score += 90;
      else return -1; // Not a Tamil voice

      if (name.includes('natural') || name.includes('neural')) score += 60;
      if (name.includes('google')) score += 50;
      if (name.includes('microsoft')) score += 40;
      if (name.includes('online')) score += 20;
    }

    if (voice.localService) score += 5;
    return score;
  }

  /**
   * Find best voice for language prioritizing Google/Microsoft neural engines
   */
  public getBestVoice(lang: BriefingLanguage): SpeechSynthesisVoice | null {
    if (!this.availableVoices.length && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.availableVoices = window.speechSynthesis.getVoices();
    }

    const scored = this.availableVoices
      .map((v) => ({ voice: v, score: this.scoreVoice(v, lang) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.length > 0 ? scored[0].voice : null;
  }

  /**
   * Diagnostic inspector for speech synthesis voice packages
   */
  public getVoiceDiagnostics(): VoiceDiagnostics {
    if (!this.availableVoices.length && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.availableVoices = window.speechSynthesis.getVoices();
    }

    const enVoice = this.getBestVoice('en');
    const taVoice = this.getBestVoice('ta');

    return {
      hasEnglishVoice: !!enVoice,
      englishVoiceName: enVoice ? `${enVoice.name} (${enVoice.lang})` : 'System Default Voice',
      hasTamilVoice: !!taVoice,
      tamilVoiceName: taVoice ? `${taVoice.name} (${taVoice.lang})` : 'Web Speech Synthesizer',
      totalVoicesAvailable: this.availableVoices.length,
    };
  }

  /**
   * Split a paragraph into conversational sentence phrases for natural human cadence
   */
  private splitIntoSentences(text: string): string[] {
    const rawSentences = text
      .split(/(?<=[.!?।])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (!rawSentences.length) {
      return [text.trim()];
    }

    // Split overly long sentences (>130 characters) at clause commas for natural breathing pauses
    const result: string[] = [];
    for (const sentence of rawSentences) {
      if (sentence.length > 130 && sentence.includes(',')) {
        const parts = sentence.split(/,\s+/);
        parts.forEach((p, idx) => {
          const suffix = idx < parts.length - 1 ? ',' : '';
          result.push(`${p.trim()}${suffix}`);
        });
      } else {
        result.push(sentence);
      }
    }

    return result;
  }

  /**
   * Speak a single sentence with natural 0.95 rate and 1.0 pitch
   */
  private speakSentence(sentence: string, lang: BriefingLanguage): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setTimeout(resolve, 1200);
        return;
      }

      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
        }
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (e) {
        // Safe fallback for restricted mobile frames
      }

      const utterance = new SpeechSynthesisUtterance(sentence);
      this.currentUtterance = utterance;

      utterance.lang = lang === 'en' ? 'en-IN' : 'ta-IN';
      utterance.rate = 0.95; // Relaxed natural cadence
      utterance.pitch = 1.0; // Warm, neutral human tone

      const voice = this.getBestVoice(lang);
      if (voice) {
        utterance.voice = voice;
      }

      // Safety watchdog: resolve after 12s if browser engine stalls
      const safetyTimeout = setTimeout(() => {
        this.currentUtterance = null;
        resolve();
      }, 12000);

      utterance.onend = () => {
        clearTimeout(safetyTimeout);
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (e) => {
        clearTimeout(safetyTimeout);
        console.warn(`Speech synthesis note for ${lang}:`, e);
        this.currentUtterance = null;
        resolve();
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        clearTimeout(safetyTimeout);
        console.warn(`Speech synthesis speak execution error:`, err);
        this.currentUtterance = null;
        resolve();
      }
    });
  }

  /**
   * Start executing the full dual-language briefing sequence:
   * Speaks all English sentences with natural pauses -> Speaks all Tamil sentences -> Transitions
   */
  public async playBilingualBriefing(
    sections: BriefingSectionData[],
    callbacks: {
      onSectionChange: (sectionIndex: number, lang: BriefingLanguage, text: string) => void;
      onComplete: () => void;
      onError?: (err: any) => void;
    }
  ): Promise<void> {
    this.stopBriefing();

    this.isSpeaking = true;
    this.isPaused = false;
    this.onSectionChangeCb = callbacks.onSectionChange;
    this.onCompleteCb = callbacks.onComplete;
    this.onErrorCb = callbacks.onError || null;

    // Keep-alive heartbeat for Chromium / Android WebView
    this.keepAliveInterval = setInterval(() => {
      if (
        this.isSpeaking &&
        !this.isPaused &&
        typeof window !== 'undefined' &&
        'speechSynthesis' in window &&
        window.speechSynthesis.paused
      ) {
        window.speechSynthesis.resume();
      }
    }, 2500);

    try {
      for (let i = 0; i < sections.length; i++) {
        if (!this.isSpeaking) break;

        const sec = sections[i];

        // -------------------------------------------------------------
        // Phase 1: Conversational English Sentences
        // -------------------------------------------------------------
        const enSentences = this.splitIntoSentences(sec.textEn);
        for (const sentence of enSentences) {
          if (!this.isSpeaking) break;
          if (this.onSectionChangeCb) {
            this.onSectionChangeCb(i, 'en', sentence);
          }
          await this.speakSentence(sentence, 'en');

          // Natural breath micro-pause between sentences (220ms)
          if (!this.isSpeaking) break;
          await new Promise((res) => setTimeout(res, 220));
        }

        if (!this.isSpeaking) break;

        // Clean pause between English and Tamil translation (450ms)
        await new Promise((res) => setTimeout(res, 450));
        if (!this.isSpeaking) break;

        // -------------------------------------------------------------
        // Phase 2: Conversational Tamil Sentences
        // -------------------------------------------------------------
        const taSentences = this.splitIntoSentences(sec.textTa);
        for (const sentence of taSentences) {
          if (!this.isSpeaking) break;
          if (this.onSectionChangeCb) {
            this.onSectionChangeCb(i, 'ta', sentence);
          }
          await this.speakSentence(sentence, 'ta');

          // Natural breath micro-pause between sentences (220ms)
          if (!this.isSpeaking) break;
          await new Promise((res) => setTimeout(res, 220));
        }

        if (!this.isSpeaking) break;

        // Natural pause between briefing sections (700ms)
        await new Promise((res) => setTimeout(res, 700));
      }

      this.cleanupKeepAlive();

      if (this.isSpeaking && this.onCompleteCb) {
        this.isSpeaking = false;
        this.onCompleteCb();
      }
    } catch (err) {
      this.cleanupKeepAlive();
      console.error('Bilingual briefing speech sequence error:', err);
      if (this.onErrorCb) {
        this.onErrorCb(err);
      }
    }
  }

  private cleanupKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  public pauseBriefing(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      this.isPaused = true;
    }
  }

  public resumeBriefing(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      this.isPaused = false;
    }
  }

  public stopBriefing(): void {
    this.isSpeaking = false;
    this.isPaused = false;
    this.cleanupKeepAlive();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public getCurrentUtterance(): SpeechSynthesisUtterance | null {
    return this.currentUtterance;
  }
}

export const bilingualBriefingSpeech = new BilingualBriefingSpeechService();
