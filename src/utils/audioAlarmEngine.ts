/**
 * FitMaintenance AI - Audio Alarm & Dual-Language Speech Briefing Engine
 * 
 * Capabilities:
 * 1. Synthesized Multi-Harmonic Tibetan Singing Bowl Awakening Tone (Web Audio API, volume=1.0)
 * 2. Background Instrumental Ambient Music Synthesizer / Audio Stream during voice briefing
 * 3. Dual-Language Speech Briefing (English followed by exact Tamil translation) via Web Speech API
 * 4. Devotional Continuous Audio Streaming (Kanda Sashti Kavasam & Sivapuranam)
 * 5. Preloaded Video Alarm Songs Catalog & Embed Helper
 */

import type { TamilDateInfo } from './tamilCalendar';
import { GoogleGenAI } from '@google/genai';
import { getBestNaturalVoice, loadVoices, speakChunk, stopAllVoiceSpeech, playGoogleNeuralTTS } from './voiceSynthesisHelper';
import type { VoiceLanguageMode } from '../services/firestoreService';

export interface BriefingSection {
  id: string;
  category: 'greeting' | 'panchangam' | 'rasipalan' | 'fitness' | 'quote';
  titleEn: string;
  titleTa: string;
  textEn: string;
  textTa: string;
}

export interface DevotionalTrack {
  id: string;
  title: string;
  titleTamil: string;
  deity: string;
  deityTamil: string;
  duration: string;
  audioUrl: string;
  fallbackAudioUrl?: string;
  description: string;
  descriptionTamil: string;
  lyricsHighlight: string;
  lyricsHighlightTamil: string;
}

export interface PreloadedAlarmVideo {
  id: string;
  title: string;
  artistOrDeity: string;
  videoUrl: string;
  embedUrl: string;
  thumbnailUrl?: string;
  duration: string;
  category: 'Devotional' | 'Meditation' | 'Energetic';
}

/* ==================== 1. PRELOADED DEVOTIONAL AUDIO TRACKS ==================== */

export const DEVOTIONAL_TRACKS: DevotionalTrack[] = [
  {
    id: 'kanda-sashti-kavasam',
    title: 'Kanda Sashti Kavasam (Original Master)',
    titleTamil: 'கந்த சஷ்டி கவசம் (ஒரிஜினல் பாடல்)',
    deity: 'Lord Murugan',
    deityTamil: 'முருகப்பெருமான்',
    duration: '21:30',
    // Loaded directly from user's local music collection with streaming fallback
    audioUrl: '/audio/devotional/kanda_sashti_kavacham.mp3',
    fallbackAudioUrl: 'https://ia800304.us.archive.org/21/items/KandhaSashtiKavasam/Kandha_Sashti_Kavasam.mp3',
    description: 'The ancient armor of Lord Murugan conferring fearless vitality, focus, and supreme physical endurance.',
    descriptionTamil: 'துதிப்போர்க்கு வல்வினைபோம் துன்பம்போம் நெஞ்சில் பதிப்போர்க்குச் செல்வம் பலித்துக் கதித்தோங்கும் கந்த சஷ்டி கவசம்.',
    lyricsHighlight: 'Thudhipporkku valvinaipom thunbampom; Nenjil padhipporkku chelvam palithuk kathithongum; Saravana bhavanaar saasharam kaakka!',
    lyricsHighlightTamil: 'துதிப்போர்க்கு வல்வினைபோம் துன்பம்போம்; நெஞ்சில் பதிப்போர்க்குச் செல்வம் பலித்துக் கதித்தோங்கும்; சரவணபவனார் சாதுரியம் காக்க!',
  },
  {
    id: 'sivapuranam',
    title: 'Sivapuranam (SPB Traditional)',
    titleTamil: 'சிவபுராணம் (எஸ்.பி. பாலசுப்பிரமணியம்)',
    deity: 'Lord Shiva',
    deityTamil: 'சிவபெருமான்',
    duration: '16:45',
    // Loaded directly from user's local music collection with streaming fallback
    audioUrl: '/audio/devotional/sivapuranam_spb.mp3',
    fallbackAudioUrl: 'https://ia801306.us.archive.org/3/items/Sivapuranam_SPB/Sivapuranam.mp3',
    description: 'The sublime morning hymn of boundless cosmic consciousness by Saint Manikkavacakar, sung by S.P. Balasubrahmanyam.',
    descriptionTamil: 'இமைப்பொழுதும் என் நெஞ்சில் நீங்காதான் தாள் வாழ்க! உள்ளொளியாய் எனை ஆட்கொண்ட ஈசனின் திருவடி போற்றி.',
    lyricsHighlight: 'Namachivaaya vaazhga naadhan thaal vaazhga; Imaippozhudhum en nenjil neengaadhaan thaal vaazhga; Kokazhi aanda guru manipthan thaal vaazhga!',
    lyricsHighlightTamil: 'நமச்சிவாய வாழ்க நாதன்தாள் வாழ்க! இமைப்பொழுதும் என்நெஞ்சில் நீங்காதான் தாள்வாழ்க! கோகழி ஆண்ட குருமணிதன் தாள்வாழ்க!',
  },
];

/* ==================== 2. PRELOADED ALARM VIDEO SONGS ==================== */

// 100% User-Uploaded Alarm Video Library: No pre-imported, mock, or default video songs
export const PRELOADED_ALARM_VIDEOS: PreloadedAlarmVideo[] = [];

/**
 * Normalizes any video link (YouTube or direct URL) into an embeddable URL
 */
export const normalizeVideoUrl = (rawUrl: string): { embedUrl: string; isYouTube: boolean } => {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return { embedUrl: '', isYouTube: false };
  }

  // YouTube matchers: youtu.be/ID or youtube.com/watch?v=ID or youtube.com/embed/ID
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0&playsinline=1`,
      isYouTube: true,
    };
  }

  return { embedUrl: trimmed, isYouTube: false };
};

/* ==================== 3. TIBETAN SINGING BOWL WEB AUDIO SYNTHESIZER ==================== */

class TibetanBowlSynthesizer {
  private ctx: AudioContext | null = null;
  private isAlarmActive: boolean = false;
  private loopInterval: ReturnType<typeof setInterval> | null = null;
  private activeNodes: { osc: OscillatorNode; gain: GainNode }[] = [];

  private getAudioContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Strikes a synthesized Tibetan singing bowl with multiple harmonic overtones,
   * acoustic shimmer, and long exponential reverberant decay.
   */
  public strike(volume: number = 1.0) {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const safeVol = Math.max(0.1, Math.min(1.0, volume));

      // Master strike gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(safeVol, now);
      masterGain.connect(ctx.destination);

      // Harmonics for a 180Hz (F#3) Tibetan bronze bell
      // Fundamental + 2nd, 3rd, 4th, 5th harmonics with detuning for binaural shimmer
      const harmonics = [
        { freq: 180, detune: 0, gain: 0.65, decay: 7.0 },     // Fundamental
        { freq: 180, detune: 2.5, gain: 0.45, decay: 6.5 },   // Binaural shimmer
        { freq: 360, detune: -1.2, gain: 0.35, decay: 5.5 },  // Octave
        { freq: 540, detune: 3.1, gain: 0.22, decay: 4.5 },   // 3rd Harmonic
        { freq: 720, detune: -2.0, gain: 0.15, decay: 3.5 },  // 4th Harmonic
        { freq: 900, detune: 1.5, gain: 0.08, decay: 2.5 },   // 5th Harmonic
      ];

      harmonics.forEach(({ freq, detune, gain, decay }) => {
        const osc = ctx.createOscillator();
        const nodeGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime(detune * 10, now);

        // Immediate soft attack, followed by long singing bowl decay
        nodeGain.gain.setValueAtTime(0.0001, now);
        nodeGain.gain.exponentialRampToValueAtTime(gain, now + 0.08);
        nodeGain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(nodeGain);
        nodeGain.connect(masterGain);

        osc.start(now);
        osc.stop(now + decay);
      });
    } catch (e) {
      console.warn('Tibetan bowl audio synthesis error:', e);
    }
  }

  /**
   * Starts rhythmic max-volume Tibetan singing bowl alarm (repeats every 4 seconds)
   */
  public startAlarm(volume: number = 1.0) {
    if (this.isAlarmActive) return;
    this.isAlarmActive = true;
    this.strike(volume);

    this.loopInterval = setInterval(() => {
      if (this.isAlarmActive) {
        this.strike(volume);
      }
    }, 4200);
  }

  /**
   * Stops the ongoing alarm immediately
   */
  public stopAlarm() {
    this.isAlarmActive = false;
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
    this.activeNodes.forEach(({ osc, gain }) => {
      try {
        osc.stop();
        gain.disconnect();
      } catch {
        // Ignored
      }
    });
    this.activeNodes = [];
  }
}

export const tibetanBowlSynth = new TibetanBowlSynthesizer();

/* ==================== 4. AMBIENT BACKGROUND INSTRUMENTAL SYNTHESIZER ==================== */

class AmbientBackgroundMusicEngine {
  /**
   * Background music completely removed as per requirement for pure speech only.
   */
  public start(_volume: number = 0.20) {
    // Pure speech only: Background ambient music removed completely.
  }

  public fadeOutAndStop(_durationMs: number = 1500) {
    // Pure speech only
  }

  public stop() {
    // Pure speech only
  }
}

export const ambientMusicEngine = new AmbientBackgroundMusicEngine();

/* ==================== 5. DUAL-LANGUAGE SPEECH BRIEFING BUILDER ==================== */

interface BriefingParams {
  userName?: string;
  date: Date;
  tamilDateInfo: TamilDateInfo;
  userRasiId?: string;
  maintenanceCalories?: number;
  targetWeightKg?: number;
  targetProteinGrams?: number;
  customFastingNotes?: string;
}

/**
 * Builds the comprehensive 5-pillar morning briefing with warm, motivating human coach
 * persona speaking fluent conversational Indian English and authentic spoken Tamil (Peccu Tamil).
 */
export const buildMorningBriefingContent = ({
  userName = 'Athlete',
  date,
  tamilDateInfo,
  userRasiId = 'mesham',
  maintenanceCalories = 2200,
  targetWeightKg = 70,
  targetProteinGrams,
  customFastingNotes,
}: BriefingParams): BriefingSection[] => {
  const { panchangam, festivals, tamilMonthName, tamilDate, tamilYearName } = tamilDateInfo;

  // Day of week strings
  const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayNamesTa = ['ஞாயிற்றுக்கிழமை', 'திங்கட்கிழமை', 'செவ்வாய்க்கிழமை', 'புதன்கிழமை', 'வியாழக்கிழமை', 'வெள்ளிக்கிழமை', 'சனிக்கிழமை'];
  const dayOfWeekEn = dayNamesEn[date.getDay()];
  const dayOfWeekTa = dayNamesTa[date.getDay()];

  // Month names
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dateStrEn = `${dayOfWeekEn}, ${monthNamesEn[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  const dateStrEnTamilCal = `${tamilDateInfo.tamilMonthEnglish || tamilMonthName} ${tamilDate}, ${tamilDateInfo.tamilYearEnglish || tamilYearName} year`;

  // Calculated Nutrition Macros
  const calories = Math.round(maintenanceCalories || 2200);
  const proteinGrams = targetProteinGrams || Math.round((targetWeightKg || 70) * 2);
  const carbsGrams = Math.round((calories * 0.45) / 4);
  const fatsGrams = Math.round((calories * 0.25) / 9);

  // Friendly name extraction
  const firstName = (userName || 'Akash').trim().split(' ')[0];
  const tamilGreetingName = firstName.toLowerCase() === 'athlete' ? 'நண்பா' : `${firstName} ப்ரோ`;

  // Helper to convert English AM/PM time strings into natural spoken Tamil
  const formatTamilTimeRange = (timeStr: string): string => {
    if (!timeStr || timeStr === 'None') return 'இல்லை';
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      const [, h1, m1, p1, h2, m2, p2] = match;
      const getPeriod = (p: string, h: string) => {
        const numH = parseInt(h, 10);
        if (p.toUpperCase() === 'AM') return 'காலை';
        if (numH === 12 || numH <= 3) return 'மதியம்';
        return 'மாலை';
      };
      const period1 = getPeriod(p1, h1);
      const period2 = getPeriod(p2, h2);
      const t1 = parseInt(m1, 10) === 0 ? `${parseInt(h1, 10)} மணி` : `${parseInt(h1, 10)}:${m1}`;
      const t2 = parseInt(m2, 10) === 0 ? `${parseInt(h2, 10)} மணி` : `${parseInt(h2, 10)}:${m2}`;
      if (period1 === period2) {
        return `${period1} ${t1} முதல் ${t2} வரை`;
      }
      return `${period1} ${t1} முதல் ${period2} ${t2} வரை`;
    }
    return timeStr;
  };

  const formatEnglishTimeRange = (timeStr: string): string => {
    if (!timeStr || timeStr === 'None') return 'None';
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      const [, h1, m1, p1, h2, m2, p2] = match;
      const t1 = parseInt(m1, 10) === 0 ? `${parseInt(h1, 10)} ${p1}` : `${parseInt(h1, 10)}:${m1} ${p1}`;
      const t2 = parseInt(m2, 10) === 0 ? `${parseInt(h2, 10)} ${p2}` : `${parseInt(h2, 10)}:${m2} ${p2}`;
      return `${t1} to ${t2}`;
    }
    return timeStr;
  };

  // Section 1: Greeting & Calendar Date
  const section1: BriefingSection = {
    id: 'section-1-greeting',
    category: 'greeting',
    titleEn: 'Morning Greeting & Calendar',
    titleTa: 'காலை வணக்கம் & தமிழ் நாட்காட்டி',
    textEn: `Good morning, ${firstName}! Rise and shine, champion! Today is ${dateStrEn}. In our Tamil calendar, today is ${dateStrEnTamilCal}. Take a deep breath, shake off the sleep, and let's start this day with full positive energy and focus!`,
    textTa: `இனிய காலை வணக்கம் ${tamilGreetingName}! புதிய விடியல், புதிய உற்சாகம்! இன்று ${dayOfWeekTa}, ${tamilMonthName} மாதம் ${tamilDate}-ஆம் நாள். ஒரு ஆழமான மூச்சு விட்டு, புத்துணர்ச்சியோடும் பாசிட்டிவ் எனர்ஜியோடும் இந்த நாளை தொடங்குங்க. இன்னைக்கு நம்ம கலக்குறோம்!`,
  };

  // Section 2: Fitness & Nutrition Targets (Today's Nutrients)
  const section2: BriefingSection = {
    id: 'section-2-fitness',
    category: 'fitness',
    titleEn: 'Daily Nutrients & Fitness Targets',
    titleTa: 'இன்றைய ஊட்டச்சத்து & உடற்பயிற்சி',
    textEn: `Here is your fitness game plan for today, ${firstName}: Aim for around ${calories} calories to keep your metabolism fired up. Let's make sure you hit ${proteinGrams} grams of protein to feed and rebuild those muscles, alongside ${carbsGrams} grams of clean carbs and ${fatsGrams} grams of healthy fats. Keep your water bottle right beside you and drink at least 3 liters today. Your workout routine is loaded and ready—let's show up with full power!`,
    textTa: `இன்னைக்கு நம்ம ஃபிட்னஸ் டார்கெட் பாத்துடலாம்: உங்கள் உடலை கட்டுக்கோப்பாக வைக்க, இன்று ${calories} கலோரிகள் எடுத்துக்க இலக்கு வையுங்கள். தசை வளர்ச்சிக்கு குறைந்தது ${proteinGrams} கிராம் புரோட்டீன் கண்டிப்பா வேணும். மறக்காமல் ஒரு நாளைக்கு குறைந்தது 3 லிட்டர் தண்ணீர் குடியுங்கள். நமது ஒர்க்அவுட் செட் ரெடியா இருக்கு, முழு எனர்ஜியோடு வெறித்தனமாக முடிச்சிடுங்க!`,
  };

  // Section 3: Motivational Quote of the Day
  const quotes = [
    {
      en: 'Thought for today: Small daily disciplines, repeated every single day, create miraculous transformations. What hurts today builds your strength tomorrow. Step onto the floor with courage and passion!',
      ta: 'இன்றைய தன்னம்பிக்கை சிந்தனை: சிறு துளி பெருவெள்ளம் போல, நாம் தினசரி செய்யும் அர்ப்பணிப்பான உழைப்புதான் நாளை வியக்கத்தக்க வெற்றியை தரும். சும்மா யோசிச்சிட்டே இருக்காம, களத்தில் இறங்கி சாதியுங்கள்!',
    },
    {
      en: 'Thought for today: Real champions are built on the days they don’t feel like showing up. Consistency and discipline beat motivation every single time. Rise with conviction and conquer your training!',
      ta: 'இன்றைய தன்னம்பிக்கை சிந்தனை: தொடர் பயிற்சியும் ஒழுக்கமும்தான் உங்களை எவராலும் வெல்ல முடியாத சாதனையாளராக மாற்றும். கஷ்டங்கள் எல்லாமே தற்காலிகம்தான், உங்கள் மன உறுதி மட்டுமே நிரந்தரம். தன்னம்பிக்கையோடு களத்தில் இறங்குங்க!',
    },
    {
      en: 'Thought for today: Energy flows where your attention goes. Focus on your growth, nourish your body with wholesome care, and make every hour of this morning count!',
      ta: 'இன்றைய தன்னம்பிக்கை சிந்தனை: இன்று நீங்கள் சிந்துகிற ஒவ்வொரு துளி வியர்வையும், நாளை உங்கள் வெற்றியாக மாறும். அச்சமின்றி களத்தில் இறங்கி உங்கள் இலக்கை நோக்கி நடைபோடுங்கள்!',
    },
  ];
  const selectedQuote = quotes[date.getDate() % quotes.length];

  const section3: BriefingSection = {
    id: 'section-3-quote',
    category: 'quote',
    titleEn: 'Thought of the Day & Motivation',
    titleTa: 'இன்றைய சிந்தனை & பொன்மொழி',
    textEn: selectedQuote.en,
    textTa: selectedQuote.ta,
  };

  // Section 4: Panchangam & Auspicious Timings
  const nallaNeramStrEn = panchangam.nallaNeramMorning !== 'None'
    ? `${formatEnglishTimeRange(panchangam.nallaNeramMorning)} in the morning`
    : `${formatEnglishTimeRange(panchangam.nallaNeramEvening)} in the evening`;
  const ragukalamStrEn = formatEnglishTimeRange(panchangam.ragukalam);
  const primaryFestival = festivals[0] || null;
  const festivalMentionEn = primaryFestival
    ? `Today is celebrated as ${primaryFestival.nameEnglish}. ${primaryFestival.significance}`
    : 'No major fasting obligation today. Maintain consistent clean nutrition.';
  const festivalMentionTa = primaryFestival
    ? `இன்று ${primaryFestival.nameTamil} திருநாள் கொண்டாடப்படுகிறது. ${primaryFestival.significanceTamil}`
    : (customFastingNotes || 'இன்று சிறப்பு விரதங்கள் இல்லை. உங்கள் வழக்கமான சத்தான உணவை உட்கொள்ளலாம்.');

  const nallaMorningTa = formatTamilTimeRange(panchangam.nallaNeramMorning);
  const nallaEveningTa = formatTamilTimeRange(panchangam.nallaNeramEvening);
  const raguTa = formatTamilTimeRange(panchangam.ragukalam);
  const yemaTa = formatTamilTimeRange(panchangam.yemagandam);

  const section4: BriefingSection = {
    id: 'section-4-panchangam',
    category: 'panchangam',
    titleEn: 'Panchangam & Auspicious Timings',
    titleTa: 'பஞ்சாங்கம் & நல்ல நேர வழிகாட்டுதல்',
    textEn: `Looking at this morning's traditional Panchangam: Today carries the good energy of ${panchangam.thithi.nameEnglish} Thithi, with ${panchangam.nakshatram.nameEnglish} Nakshatram, and ${panchangam.yogam.nameEnglish} Yogam. Auspicious Nalla Neram is ${nallaNeramStrEn}—an ideal window to begin your most important tasks. Take care during Ragukalam between ${ragukalamStrEn}. ${festivalMentionEn}`,
    textTa: `இன்றைய மங்களகரமான பஞ்சாங்க விபரம்: இன்று திதி ${panchangam.thithi.nameTamil}, நட்சத்திரம் ${panchangam.nakshatram.nameTamil}, மற்றும் ${panchangam.yogam.nameTamil}. நல்ல காரியங்களை தொடங்க காலை நல்ல நேரம் ${nallaMorningTa}, மாலை நல்ல நேரம் ${nallaEveningTa}. ராகு காலம் ${raguTa}. எமகண்டம் ${yemaTa}. ${festivalMentionTa}`,
  };

  // Section 5: Rasipalan Outlook
  const rasiOutlookMap: Record<string, { en: string; ta: string; nameEn: string; nameTa: string }> = {
    mesham: {
      nameEn: 'Aries (Mesham)',
      nameTa: 'மேஷ ராசி',
      en: 'For Aries today: Your natural fire energy is at its peak! Channel that drive straight into your workout, lift with confidence, and stay cool and hydrated throughout the day.',
      ta: 'மேஷ ராசி நண்பர்களுக்கு: இன்று உங்கள் உடலிலும் மனதிலும் தைரியமும் உற்சாகமும் பொங்கும். ஒர்க்அவுட்ல முழு உழைப்பை செலுத்துங்க. போதுமான தண்ணீர் குடிச்சு அமைதியா இருங்க.',
    },
    rishabam: {
      nameEn: 'Taurus (Rishabam)',
      nameTa: 'ரிஷப ராசி',
      en: 'For Taurus today: Your endurance and strength are rock solid. Prioritize good lifting form, eat clean nutrient-dense food, and give yourself quality recovery.',
      ta: 'ரிஷப ராசி நண்பர்களுக்கு: இன்று உங்கள் பொறுமையும் தாங்கும் திறனும் மிகச் சிறப்பா இருக்கும். உடற்பயிற்சிகளை சரியான முறையில் செய்து, ஆரோக்கியமான சத்தான உணவை உட்கொள்ளுங்கள்.',
    },
    mithunam: {
      nameEn: 'Gemini (Mithunam)',
      nameTa: 'மிதுன ராசி',
      en: 'For Gemini today: Sharp focus and quick agility are on your side. High energy functional movements or dynamic cardio will make you feel amazing today.',
      ta: 'மிதுன ராசி நண்பர்களுக்கு: இன்று புத்துணர்ச்சியும் சுறுசுறுப்பும் மிளிரும் நாள். விரைவான செயல்பாடுகளும் கார்டியோ பயிற்சிகளும் உங்களுக்கு அருமையான எனர்ஜி தரும்.',
    },
    kadagam: {
      nameEn: 'Cancer (Kadagam)',
      nameTa: 'கடக ராசி',
      en: 'For Cancer today: Tune into your body and mind. Focus on mindful breathing, core stability, and staying centered. Peace of mind is your superpower today.',
      ta: 'கடக ராசி நண்பர்களுக்கு: இன்று மன அமைதியும் உள்ளுணர்வும் கூடும் நாள். இதமான மூச்சுப்பயிற்சிகளும் யோகாவும் உங்கள் உடலை புத்துணர்ச்சியாக வைக்கும்.',
    },
    simmam: {
      nameEn: 'Leo (Simmam)',
      nameTa: 'சிம்ம ராசி',
      en: 'For Leo today: Powerful solar vigor is backing you up today! Walk tall, conquer your nutrition targets, and inspire everyone around you with your dedication.',
      ta: 'சிம்ம ராசி நண்பர்களுக்கு: இன்று கம்பீரமும் தன்னம்பிக்கையும் கூடும் நாள். திட்டமிட்ட உடற்பயிற்சிகளை கம்பீரமாக முடித்து, உங்கள் இலக்கை நோக்கி நடைபோடுங்கள்.',
    },
    kanni: {
      nameEn: 'Virgo (Kanni)',
      nameTa: 'கன்னி ராசி',
      en: 'For Virgo today: Your eye for precision will yield great results. Pay close attention to your lifting technique and hit your macronutrient split with pride.',
      ta: 'கன்னி ராசி நண்பர்களுக்கு: நுணுக்கமான திட்டமிடல் வெற்றி தரும் நாள். உடற்பயிற்சி முறைகளை சரியாக கவனித்து செய்து, நேரத்திற்கு சத்தான உணவை சாப்பிடுங்கள்.',
    },
    thulaam: {
      nameEn: 'Libra (Thulaam)',
      nameTa: 'துலாம் ராசி',
      en: 'For Libra today: Balance is your greatest strength. Balance hard training with deep hydration and restorative sleep, keeping your physical and mental wellness in harmony.',
      ta: 'துலாம் ராசி நண்பர்களுக்கு: சமநிலையே உங்கள் பலம். தீவிர உடற்பயிற்சியோடு போதிய ஓய்வையும் சமமாக எடுத்து, உங்கள் ஆரோக்கியத்தை பேணுங்கள்.',
    },
    viruchigam: {
      nameEn: 'Scorpio (Viruchigam)',
      nameTa: 'விருச்சிக ராசி',
      en: 'For Scorpio today: Unstoppable willpower is on your side. Break through training barriers, stay locked onto your goals, and let nothing distract you.',
      ta: 'விருச்சிக ராசி நண்பர்களுக்கு: அசாத்திய மன உறுதி உண்டாகும். எத்தகைய சவாலான உடற்பயிற்சிகளையும் எளிதாக முடித்து, வெற்றியை உங்கள் வசமாக்குங்கள்.',
    },
    dhanusu: {
      nameEn: 'Sagittarius (Dhanusu)',
      nameTa: 'தனுசு ராசி',
      en: 'For Sagittarius today: Pure optimism and fresh enthusiasm will power your morning. An outdoor walk or a brisk run will elevate your spirits to the next level.',
      ta: 'தனுசு ராசி நண்பர்களுக்கு: புதிய உற்சாகமும் நேர்மறை சிந்தனைகளும் பிறக்கும் நாள். நடைபயிற்சியும் திறந்தவெளி உடற்பயிற்சிகளும் உங்கள் புத்துணர்ச்சியை இரட்டிப்பாக்கும்.',
    },
    makaram: {
      nameEn: 'Capricorn (Makaram)',
      nameTa: 'மகர ராசி',
      en: 'For Capricorn today: Relentless discipline is your hallmark. Stick to your structured routine step by step, and watch your consistency compound into victory.',
      ta: 'மகர ராசி நண்பர்களுக்கு: விடாமுயற்சியும் ஒழுக்கமும்தான் உங்கள் அடையாளம். வழக்கமான உடற்பயிற்சி அட்டவணையை அமைதியாக முடித்து இலக்கை அடைந்திடுங்கள்.',
    },
    kumbam: {
      nameEn: 'Aquarius (Kumbam)',
      nameTa: 'கும்ப ராசி',
      en: 'For Aquarius today: Creativity and dynamic movement will inspire you. Try refreshing exercise variations or a new workout flow to keep training fun and stimulating.',
      ta: 'கும்ப ராசி நண்பர்களுக்கு: புதுமையான எண்ணங்கள் தோன்றும் நாள். புதிய உடற்பயிற்சி முறைகளை ஆர்வத்தோடு முயற்சி செய்து உடலை சுறுசுறுப்பாக வைத்திருங்கள்.',
    },
    meenam: {
      nameEn: 'Pisces (Meenam)',
      nameTa: 'மீன ராசி',
      en: 'For Pisces today: Smooth recovery, deep hydration, and peaceful mindset are key. Stretch thoroughly, drink plenty of water, and nourish your body with wholesome care.',
      ta: 'மீன ராசி நண்பர்களுக்கு: அமைதியான மனநிலை உதவும். உடலை வருத்தாமல் இதமான நீட்சிப் பயிற்சிகளையும் தியானத்தையும் செய்து ஆரோக்கியத்தை கூட்டுங்கள்.',
    },
  };

  const rasiData = rasiOutlookMap[userRasiId.toLowerCase()] || rasiOutlookMap.mesham;

  const section5: BriefingSection = {
    id: 'section-5-rasipalan',
    category: 'rasipalan',
    titleEn: `Rasipalan Outlook - ${rasiData.nameEn}`,
    titleTa: `ராசிபலன் வழிகாட்டுதல் - ${rasiData.nameTa}`,
    textEn: rasiData.en,
    textTa: rasiData.ta,
  };

  return [section1, section2, section3, section4, section5];
};

/* ==================== 6. GEMINI NEURAL NATURAL SPEECH SYNTHESIZER ==================== */

const getGeminiApiKey = (): string => {
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY?.trim();
  if (envKey) return envKey;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return (
        localStorage.getItem('VITE_GEMINI_API_KEY')?.trim() ||
        localStorage.getItem('gemini_api_key')?.trim() ||
        ''
      );
    }
  } catch {
    // ignore
  }
  return '';
};

// In-memory cache for synthesized audio URLs so that we never regenerate twice in a session
const geminiAudioCache = new Map<string, string>();

/**
 * Converts 16-bit PCM audio bytes to a valid WAV Blob with a 44-byte RIFF header.
 * Ensures seamless decoding for Gemini 2.0/2.5 Flash audio output in all browsers.
 */
function pcmToWavBlob(pcmData: Uint8Array, sampleRate: number = 24000): Blob {
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // Linear PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  return new Blob([wavHeader, pcmData], { type: 'audio/wav' });
}

/**
 * Synthesizes studio-grade, natural AI speech via Gemini Audio Generation:
 * - English: Natural, warm, friendly Indian English coach with lively morning cadence
 * - Tamil: Natural, warm, fluent native Tamil speaker with cheerful conversational cadence
 * Converts raw WAV/PCM audio into an HTML5 Blob URL for seamless browser playback.
 */
export async function synthesizeGeminiSpeech(
  text: string,
  lang: 'en' | 'ta' = 'en'
): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const cacheKey = `${lang}:${text}`;
  if (geminiAudioCache.has(cacheKey)) {
    return geminiAudioCache.get(cacheKey)!;
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  // Active models that support audio output in @google/genai
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];

  for (const model of models) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const promptInstruction =
        lang === 'ta'
          ? `Read aloud the following Tamil message in a warm, friendly, natural human voice with lively morning energy. Speak with authentic spoken Tamil intonation. Output audio directly:\n\n${text}`
          : `Read aloud the following message in a warm, enthusiastic, friendly Indian English coach voice with natural morning energy. Speak clearly and smoothly. Output audio directly:\n\n${text}`;

      // 2200ms strict timeout to avoid delaying morning briefing
      const generatePromise = ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [{ text: promptInstruction }],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Aoede', // Aoede: expressive, warm, natural voice
              },
            },
          },
        },
      });

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2200));
      const response = await Promise.race([generatePromise, timeoutPromise]);

      if (!response || !('candidates' in response)) continue;

      const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      const base64Data = inlineData?.data;
      if (!base64Data) continue;

      // Convert Base64 into Blob URL
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const mime = inlineData?.mimeType || 'audio/wav';
      const blob = mime.includes('pcm') ? pcmToWavBlob(bytes, 24000) : new Blob([bytes], { type: mime });
      const audioUrl = URL.createObjectURL(blob);
      geminiAudioCache.set(cacheKey, audioUrl);
      return audioUrl;
    } catch (err) {
      console.warn(`Gemini natural TTS notice (${model}, ${lang}):`, err);
    }
  }

  return null;
}

/**
 * Normalizes Tamil written text into authentic, fluent colloquial spoken Tamil:
 * - Expands digital clock times (e.g., '07:30 AM - 08:30 AM' -> 'காலை 7:30 முதல் 8:30 வரை')
 * - Replaces colons with commas so synthesizers make natural breath pauses
 * - Strips parentheses and cleans duplicate breath phrases
 */
export function normalizeTamilForSpeech(text: string): string {
  let cleaned = text;

  // Convert digital time ranges: e.g. '07:30 AM - 08:30 AM' or '04:30 PM - 06:00 PM'
  cleaned = cleaned.replace(
    /(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/gi,
    (_match, h1, m1, p1, h2, m2, p2) => {
      const getPeriod = (p: string, h: string) => {
        const numH = parseInt(h, 10);
        if (p.toUpperCase() === 'AM') return 'காலை';
        if (numH === 12 || numH <= 3) return 'மதியம்';
        return 'மாலை';
      };
      const period1 = getPeriod(p1, h1);
      const period2 = getPeriod(p2, h2);
      const t1 = parseInt(m1, 10) === 0 ? `${parseInt(h1, 10)} மணி` : `${parseInt(h1, 10)}:${m1}`;
      const t2 = parseInt(m2, 10) === 0 ? `${parseInt(h2, 10)} மணி` : `${parseInt(h2, 10)}:${m2}`;
      if (period1 === period2) {
        return `${period1} ${t1} முதல் ${t2} வரை`;
      }
      return `${period1} ${t1} முதல் ${period2} ${t2} வரை`;
    }
  );

  // Convert standalone times: e.g. '07:30 AM' or '04:30 PM'
  cleaned = cleaned.replace(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi, (_match, h, m, p) => {
    const numH = parseInt(h, 10);
    const period = p.toUpperCase() === 'AM' ? 'காலை' : numH === 12 || numH <= 3 ? 'மதியம்' : 'மாலை';
    const t = parseInt(m, 10) === 0 ? `${numH} மணி` : `${numH}:${m}`;
    return `${period} ${t}`;
  });

  // Remove parentheses cleanly
  cleaned = cleaned.replace(/\(([^)]+)\)/g, ', $1, ');

  // Avoid repetitive "காலையில் காலை" or "மாலையில் மாலை"
  cleaned = cleaned.replace(/காலையில்\s+காலை/g, 'காலையில்');
  cleaned = cleaned.replace(/மாலையில்\s+மாலை/g, 'மாலையில்');

  // Replace colons with natural comma pauses
  cleaned = cleaned.replace(/:\s*/g, ', ');

  // Clean double commas and excessive spaces
  cleaned = cleaned.replace(/,\s*,/g, ',');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Normalizes English text for fluent natural speech cadence
 */
export function normalizeEnglishForSpeech(text: string): string {
  let cleaned = text;
  // Convert time ranges like 07:30 AM - 08:30 AM into 7:30 AM to 8:30 AM
  cleaned = cleaned.replace(/(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/gi, '$1 to $2');
  // Remove parentheses
  cleaned = cleaned.replace(/\(([^)]+)\)/g, ', $1, ');
  // Replace colons with comma pauses
  cleaned = cleaned.replace(/:\s*/g, ', ');
  cleaned = cleaned.replace(/,\s*,/g, ',');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

/**
 * Splits text into natural breath-sized clauses (<= 160 characters)
 * for optimal neural speech synthesis without cutting words
 */
export function chunkTextForTTS(text: string, maxChars: number = 160): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if (trimmed.length <= maxChars) {
      chunks.push(trimmed);
    } else {
      const clauses = trimmed.split(/(?<=[,;])\s+/);
      let currentChunk = '';
      for (const clause of clauses) {
        const clauseTrimmed = clause.trim();
        if (!clauseTrimmed) continue;

        if ((currentChunk + ' ' + clauseTrimmed).trim().length <= maxChars) {
          currentChunk = (currentChunk + ' ' + clauseTrimmed).trim();
        } else {
          if (currentChunk) chunks.push(currentChunk);
          if (clauseTrimmed.length <= maxChars) {
            currentChunk = clauseTrimmed;
          } else {
            const words = clauseTrimmed.split(/\s+/);
            currentChunk = '';
            for (const word of words) {
              if ((currentChunk + ' ' + word).trim().length <= maxChars) {
                currentChunk = (currentChunk + ' ' + word).trim();
              } else {
                if (currentChunk) chunks.push(currentChunk);
                currentChunk = word;
              }
            }
          }
        }
      }
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
    }
  }

  return chunks;
}

/* ==================== 7. DUAL-LANGUAGE SPEECH SYNTHESIS ENGINE ==================== */

export interface SpeechBriefingCallbacks {
  onSectionStart?: (sectionIndex: number, language: 'en' | 'ta', segment?: 'english' | 'tamil') => void;
  onSectionComplete?: (sectionIndex: number) => void;
  onAllComplete?: () => void;
  onError?: (err: unknown) => void;
}

class SpeechBriefingEngine {
  private isSpeaking: boolean = false;
  private isCancelled: boolean = false;
  private currentSectionIndex: number = 0;
  private currentLang: 'en' | 'ta' = 'en';
  private currentSegment: 'english' | 'tamil' = 'english';
  private activeAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const primeVoices = () => {
        window.speechSynthesis.getVoices();
      };
      primeVoices();
      if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = primeVoices;
      }
    }
  }

  /**
   * Pre-fetches briefing audio asynchronously in background if Gemini key is present
   */
  public prefetchBriefingAudio(items: { text: string; lang: 'en' | 'ta' }[]) {
    (async () => {
      for (const item of items) {
        if (this.isCancelled) break;
        const cacheKey = `${item.lang}:${item.text}`;
        if (!geminiAudioCache.has(cacheKey)) {
          await synthesizeGeminiSpeech(item.text, item.lang);
        }
      }
    })();
  }

  /**
   * High-Fidelity Studio-Grade Natural Speech Stream via unified helper
   * Uses safe clauses (<=80 chars), client=gtx, referrerpolicy="no-referrer",
   * and rapid circuit breaker to ensure zero perceived audio lag.
   */
  private async playGoogleTTSSequence(text: string, lang: 'en' | 'ta'): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (this.isCancelled) return false;

    try {
      const normalizedText = lang === 'ta' ? normalizeTamilForSpeech(text) : normalizeEnglishForSpeech(text);
      return await playGoogleNeuralTTS(normalizedText, lang);
    } catch (err) {
      console.warn('Google natural TTS sequence notice:', err);
      return false;
    }
  }

  /**
   * Finds the best matching voice for natural Indian English (en-IN / natural neural)
   * or authentic native Tamil (Samsung Tamil / Google தமிழ் / ta-IN) for browser fallback.
   */
  public getBestVoice(lang: 'en' | 'ta'): SpeechSynthesisVoice | null {
    return getBestNaturalVoice(lang);
  }

  /**
   * Browser Speech Synthesis Fallback with watchdog timer, voice matching and optimized human prosody
   */
  private speakWithBrowserSynthesis(text: string, lang: 'en' | 'ta'): Promise<void> {
    if (this.isCancelled) return Promise.resolve();
    return speakChunk(text, lang, {
      rate: lang === 'ta' ? 0.93 : 0.95,
      pitch: lang === 'ta' ? 1.02 : 1.01,
    });
  }

  /**
   * Triple-Tier Resilient Neural Voice Synthesis:
   * Tier 1: Gemini AI Studio-grade Neural Speech (if API key configured & quota available)
   * Tier 2: Google Studio-Grade Neural Natural TTS Stream (100% free, unlimited, native fluent Tamil & Indian English)
   * Tier 3: Browser Web Speech API (Offline fallback with prosody tuning & natural voice selection)
   */
  private async speakUtterance(text: string, lang: 'en' | 'ta'): Promise<void> {
    if (this.isCancelled) return;

    // 1. Try Gemini Neural Natural Spoken AI Speech first
    try {
      const audioUrl = await synthesizeGeminiSpeech(text, lang);
      if (audioUrl && !this.isCancelled) {
        const played = await new Promise<boolean>((resolve) => {
          if (this.isCancelled) {
            resolve(false);
            return;
          }

          const audio = new Audio(audioUrl);
          this.activeAudio = audio;

          audio.onended = () => {
            this.activeAudio = null;
            resolve(true);
          };

          audio.onerror = () => {
            this.activeAudio = null;
            resolve(false);
          };

          audio.play().catch(() => {
            this.activeAudio = null;
            resolve(false);
          });
        });

        if (played) return;
      }
    } catch {
      // Proceed to Tier 2
    }

    if (this.isCancelled) return;

    // 2. Primary High-Fidelity Neural Fallback: Google Studio-Grade Natural TTS Stream
    // 100% Free, Unlimited, zero quota restrictions. Delivers sweet, studio-grade, authentic native Tamil.
    const googlePlayed = await this.playGoogleTTSSequence(text, lang);
    if (googlePlayed) return;

    if (this.isCancelled) return;

    // 3. Last Resort Offline Fallback: Browser Web Speech API with prosody tuning
    const normalizedText = lang === 'ta' ? normalizeTamilForSpeech(text) : normalizeEnglishForSpeech(text);
    return this.speakWithBrowserSynthesis(normalizedText, lang);
  }

  /**
   * Bilingual Voice Briefing Sequence:
   * 1. English Segment First:
   *    - Greeting (Personalized greeting with name and date)
   *    - Today's Nutrients & Fitness Targets (Calories, Protein, Hydration)
   *    - Quote of the Day (Thought for the day)
   * 2. Tamil Segment Immediately Following (Natural Fluent Spoken Tamil):
   *    - Greeting in Tamil (வணக்கம் [Name]...)
   *    - Today's Nutrients in Tamil (இன்றைய ஊட்டச்சத்து & உடற்பயிற்சி...)
   *    - Quote of the Day in Tamil (இன்றைய சிந்தனை & பொன்மொழி...)
   *    - Panchangam & Auspicious Timings in Tamil (திதி, நட்சத்திரம், நல்ல நேரம்...)
   *    - Daily Rasipalan Guidance in Tamil (ராசிபலன் வழிகாட்டல்...)
   */
  public async startBriefing(
    sections: BriefingSection[],
    callbacks?: SpeechBriefingCallbacks,
    languageMode: VoiceLanguageMode = 'tanglish'
  ): Promise<void> {
    if (typeof window === 'undefined') {
      if (callbacks?.onAllComplete) callbacks.onAllComplete();
      return;
    }

    this.stop();
    this.isSpeaking = true;
    this.isCancelled = false;

    // Load available neural voices asynchronously before queuing
    await loadVoices();

    try {
      interface SpeechStep {
        sectionIndex: number;
        category: BriefingSection['category'];
        lang: 'en' | 'ta';
        text: string;
        segment: 'english' | 'tamil';
      }

      const steps: SpeechStep[] = [];

      if (languageMode === 'en') {
        // Mode 1: English Only - 100% natural English from start to finish
        for (let idx = 0; idx < sections.length; idx++) {
          const sec = sections[idx];
          steps.push({
            sectionIndex: idx,
            category: sec.category,
            lang: 'en',
            text: sec.textEn,
            segment: 'english',
          });
        }
      } else if (languageMode === 'ta') {
        // Mode 2: Tamil Only - 100% authentic spoken Tamil (Peccu Tamil)
        for (let idx = 0; idx < sections.length; idx++) {
          const sec = sections[idx];
          steps.push({
            sectionIndex: idx,
            category: sec.category,
            lang: 'ta',
            text: sec.textTa,
            segment: 'tamil',
          });
        }
      } else if (languageMode === 'both') {
        // Mode 4: Both (English followed completely by Tamil)
        // 1st Half: Full English sequence
        for (let idx = 0; idx < sections.length; idx++) {
          const sec = sections[idx];
          steps.push({
            sectionIndex: idx,
            category: sec.category,
            lang: 'en',
            text: sec.textEn,
            segment: 'english',
          });
        }
        // 2nd Half: Full Spoken Tamil sequence
        for (let idx = 0; idx < sections.length; idx++) {
          const sec = sections[idx];
          steps.push({
            sectionIndex: idx,
            category: sec.category,
            lang: 'ta',
            text: sec.textTa,
            segment: 'tamil',
          });
        }
      } else {
        // Mode 3: Tanglish (Single Unified Flow, Code-Switching)
        // 1. Morning Greeting in English
        const greetingIdx = sections.findIndex((s) => s.category === 'greeting');
        if (greetingIdx !== -1) {
          steps.push({
            sectionIndex: greetingIdx,
            category: 'greeting',
            lang: 'en',
            text: sections[greetingIdx].textEn,
            segment: 'english',
          });
        }

        // 2. Nutrients & Fitness Targets in English
        const fitnessIdx = sections.findIndex((s) => s.category === 'fitness');
        if (fitnessIdx !== -1) {
          steps.push({
            sectionIndex: fitnessIdx,
            category: 'fitness',
            lang: 'en',
            text: sections[fitnessIdx].textEn,
            segment: 'english',
          });
        }

        // 3. Thought of the Day in Tamil
        const quoteIdx = sections.findIndex((s) => s.category === 'quote');
        if (quoteIdx !== -1) {
          steps.push({
            sectionIndex: quoteIdx,
            category: 'quote',
            lang: 'ta',
            text: sections[quoteIdx].textTa,
            segment: 'tamil',
          });
        }

        // 4. Panchangam & Auspicious Timings in Tamil
        const panchangamIdx = sections.findIndex((s) => s.category === 'panchangam');
        if (panchangamIdx !== -1) {
          steps.push({
            sectionIndex: panchangamIdx,
            category: 'panchangam',
            lang: 'ta',
            text: sections[panchangamIdx].textTa,
            segment: 'tamil',
          });
        }

        // 5. Daily Rasipalan Guidance in Tamil
        const rasiIdx = sections.findIndex((s) => s.category === 'rasipalan');
        if (rasiIdx !== -1) {
          steps.push({
            sectionIndex: rasiIdx,
            category: 'rasipalan',
            lang: 'ta',
            text: sections[rasiIdx].textTa,
            segment: 'tamil',
          });
        }

        // Unhandled custom sections in Tamil
        sections.forEach((sec, idx) => {
          if (!['greeting', 'quote', 'panchangam', 'rasipalan', 'fitness'].includes(sec.category)) {
            steps.push({
              sectionIndex: idx,
              category: sec.category,
              lang: 'ta',
              text: sec.textTa,
              segment: 'tamil',
            });
          }
        });
      }

      // Start background prefetching for all remaining audio steps (Indian English & Tamil)
      // while the first step is playing, ensuring 0-delay playback for all subsequent sections
      const upcomingSteps = steps.slice(1).map((s) => ({ text: s.text, lang: s.lang }));
      this.prefetchBriefingAudio(upcomingSteps);

      for (let i = 0; i < steps.length; i++) {
        if (this.isCancelled) break;
        const step = steps[i];
        this.currentSectionIndex = step.sectionIndex;
        this.currentLang = step.lang;
        this.currentSegment = step.segment;

        if (callbacks?.onSectionStart) {
          callbacks.onSectionStart(step.sectionIndex, step.lang, step.segment);
        }

        await this.speakUtterance(step.text, step.lang);
        if (this.isCancelled) break;

        if (callbacks?.onSectionComplete) {
          callbacks.onSectionComplete(step.sectionIndex);
        }

        // Natural breath pause between steps (500ms)
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (err) {
      console.error('Speech briefing sequence error:', err);
      if (callbacks?.onError) callbacks.onError(err);
    } finally {
      this.isSpeaking = false;
      if (!this.isCancelled && callbacks?.onAllComplete) {
        callbacks.onAllComplete();
      }
    }
  }

  public pause() {
    if (this.activeAudio && !this.activeAudio.paused) {
      this.activeAudio.pause();
    }
    stopAllVoiceSpeech();
  }

  public resume() {
    if (this.activeAudio && this.activeAudio.paused) {
      this.activeAudio.play().catch(() => {});
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }

  public stop() {
    this.isCancelled = true;
    this.isSpeaking = false;
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.currentTime = 0;
      this.activeAudio = null;
    }
    stopAllVoiceSpeech();
    ambientMusicEngine.stop();
  }

  public getStatus() {
    return {
      isSpeaking: this.isSpeaking,
      currentSectionIndex: this.currentSectionIndex,
      currentLang: this.currentLang,
      currentSegment: this.currentSegment,
    };
  }
}

export const speechBriefingEngine = new SpeechBriefingEngine();

/* ==================== 7. DEVOTIONAL STREAMING AUDIO PLAYER ==================== */

class DevotionalAudioPlayer {
  private audio: HTMLAudioElement | null = null;
  private currentTrackIndex: number = 0;
  private isPlaying: boolean = false;
  private onTrackChangeCallbacks: ((track: DevotionalTrack) => void)[] = [];
  private onStateChangeCallbacks: ((isPlaying: boolean) => void)[] = [];
  private onTimeUpdateCallbacks: ((currentTime: number, duration: number) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.audio.preload = 'auto';

      this.audio.addEventListener('ended', () => {
        // Automatically advance to the next devotional track (e.g., Kanda Sashti Kavasam -> Sivapuranam)
        this.nextTrack();
      });

      this.audio.addEventListener('timeupdate', () => {
        if (!this.audio) return;
        const cur = this.audio.currentTime || 0;
        const dur = this.audio.duration || 0;
        this.onTimeUpdateCallbacks.forEach((cb) => cb(cur, dur));
      });

      this.audio.addEventListener('play', () => {
        this.isPlaying = true;
        this.onStateChangeCallbacks.forEach((cb) => cb(true));
      });

      this.audio.addEventListener('pause', () => {
        this.isPlaying = false;
        this.onStateChangeCallbacks.forEach((cb) => cb(false));
      });

      this.audio.addEventListener('error', () => {
        const track = this.getCurrentTrack();
        if (track.fallbackAudioUrl && this.audio && !this.audio.src.includes('archive.org')) {
          console.warn('Local audio file notice, falling back to streaming stream:', track.fallbackAudioUrl);
          this.audio.src = track.fallbackAudioUrl;
          this.audio.play().catch(console.warn);
        }
      });
    }
  }

  public getCurrentTrack(): DevotionalTrack {
    return DEVOTIONAL_TRACKS[this.currentTrackIndex] || DEVOTIONAL_TRACKS[0];
  }

  public playTrack(index: number = 0, volume: number = 0.8) {
    if (!this.audio) return;
    // Stop all briefing speech to prevent voice and devotional audio overlap
    speechBriefingEngine.stop();

    this.currentTrackIndex = Math.max(0, Math.min(DEVOTIONAL_TRACKS.length - 1, index));
    const track = this.getCurrentTrack();

    this.audio.src = track.audioUrl;
    this.audio.volume = Math.max(0, Math.min(1.0, volume));

    this.audio.play().catch((e) => {
      console.warn('Audio playback restricted or network issue:', e);
    });

    this.onTrackChangeCallbacks.forEach((cb) => cb(track));
  }

  public togglePlayPause() {
    if (!this.audio) return;
    if (this.isPlaying) {
      this.audio.pause();
    } else {
      if (!this.audio.src) {
        this.playTrack(this.currentTrackIndex);
      } else {
        this.audio.play().catch(console.warn);
      }
    }
  }

  public pause() {
    if (this.audio) this.audio.pause();
  }

  public stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.isPlaying = false;
  }

  public seek(seconds: number) {
    if (this.audio) {
      this.audio.currentTime = Math.max(0, Math.min(this.audio.duration || 0, seconds));
    }
  }

  public setVolume(vol: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1.0, vol));
    }
  }

  public nextTrack() {
    const nextIdx = (this.currentTrackIndex + 1) % DEVOTIONAL_TRACKS.length;
    this.playTrack(nextIdx, this.audio?.volume ?? 0.8);
  }

  public prevTrack() {
    const prevIdx = (this.currentTrackIndex - 1 + DEVOTIONAL_TRACKS.length) % DEVOTIONAL_TRACKS.length;
    this.playTrack(prevIdx, this.audio?.volume ?? 0.8);
  }

  public onTrackChange(cb: (track: DevotionalTrack) => void) {
    this.onTrackChangeCallbacks.push(cb);
  }

  public onStateChange(cb: (isPlaying: boolean) => void) {
    this.onStateChangeCallbacks.push(cb);
  }

  public onTimeUpdate(cb: (currentTime: number, duration: number) => void) {
    this.onTimeUpdateCallbacks.push(cb);
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const devotionalPlayer = new DevotionalAudioPlayer();
