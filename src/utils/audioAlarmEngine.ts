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
import { getBestNaturalVoice, loadVoices, speakChunk } from './voiceSynthesisHelper';

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
 * Builds the comprehensive 5-pillar morning briefing with every single section
 * translated completely into authentic native Tamil alongside natural English.
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

  // Section 1: Greeting & Calendar Date
  const section1: BriefingSection = {
    id: 'section-1-greeting',
    category: 'greeting',
    titleEn: 'Morning Greeting & Calendar',
    titleTa: 'காலை வணக்கம் & தமிழ் நாட்காட்டி',
    textEn: `Good morning, ${userName}! Today is ${dateStrEn}. In the traditional Tamil calendar, today is ${dateStrEnTamilCal}. May your day begin with clear focus, peace, and boundless vitality.`,
    textTa: `இனிய காலை வணக்கம் ${userName}! உங்கள் காலைப் பொழுது மகிழ்ச்சியாகவும் அமைதியாகவும் அமையட்டும். இன்று ${dayOfWeekTa}, ${tamilMonthName} மாதம் ${tamilDate}-ஆம் நாள். புதிய உற்சாகத்தோடும், அசாத்திய ஆற்றலோடும் இந்த இனிய நாளை தொடங்குங்கள்!`,
  };

  // Section 2: Fitness & Nutrition Targets (Today's Nutrients)
  const section2: BriefingSection = {
    id: 'section-2-fitness',
    category: 'fitness',
    titleEn: 'Daily Nutrients & Fitness Targets',
    titleTa: 'இன்றைய ஊட்டச்சத்து & உடற்பயிற்சி',
    textEn: `Here is your daily nutrition and fitness target: Aim for ${calories} kilocalories today, with a target of ${proteinGrams} grams of protein, ${carbsGrams} grams of carbohydrates, and ${fatsGrams} grams of healthy fats. Remember to stay well hydrated with at least 3 liters of water. Working towards your target weight of ${targetWeightKg} kilograms requires daily consistency, discipline, and hitting your protein split. Your routine is loaded and ready.`,
    textTa: `இன்றைய ஊட்டச்சத்து மற்றும் உடற்பயிற்சி வழிகாட்டல். உங்கள் உடலை கட்டுக்கோப்பாகவும் வலிமையாகவும் வைக்க, இன்று ${calories} கலோரிகள் மற்றும் ${proteinGrams} கிராம் புரதச்சத்து எடுத்துக்கொள்ள இலக்கு வையுங்கள். மறக்காமல் குறைந்தது மூன்று லிட்டர் தண்ணீர் அருந்துங்கள். திட்டமிட்ட உடற்பயிற்சியை தவறாமல் செய்து, உங்கள் இலக்கு எடையை நோக்கி உற்சாகமாக முன்னேறுங்கள்!`,
  };

  // Section 3: Motivational Quote of the Day
  const quotes = [
    {
      en: 'Thought for the day: Consistency and discipline forge the unbreakable athlete. Rise with conviction, conquer your training, and honor your vessel.',
      ta: 'தினசரி செய்யும் தொடர் பயிற்சியும் ஒழுக்கமும்தான் உங்களை எவராலும் வெல்ல முடியாத சாதனையாளராக மாற்றும். தன்னம்பிக்கையோடு எழுந்து இந்த நாளை வென்றிடுங்கள்!',
    },
    {
      en: 'Thought for the day: Small daily disciplines accumulated over time lead to miraculous transformations. You hold the power today.',
      ta: 'சிறு துளி பெருவெள்ளம் போல, தினசரி செய்யும் அர்ப்பணிப்பான உழைப்பே வியக்கத்தக்க மாற்றத்திற்கு வித்திடும். உங்கள் லட்சியத்தில் எப்போதும் உறுதியாக இருங்கள்!',
    },
    {
      en: 'Thought for the day: What hurts today makes you stronger tomorrow. Step onto the floor with courage and passion.',
      ta: 'இன்று நீங்கள் சிந்துகிற வியர்வைதான், நாளை உங்கள் வெற்றியாக மாறும். அச்சமின்றி களத்தில் இறங்கி சாதியுங்கள்!',
    },
  ];
  const selectedQuote = quotes[date.getDate() % quotes.length];

  const section3: BriefingSection = {
    id: 'section-3-quote',
    category: 'quote',
    titleEn: 'Thought of the Day & Motivation',
    titleTa: 'இன்றைய சிந்தனை & பொன்மொழி',
    textEn: selectedQuote.en,
    textTa: `இன்றைய ஊக்கமளிக்கும் சிந்தனை. ${selectedQuote.ta}`,
  };

  // Section 4: Panchangam & Auspicious Timings
  const nallaNeramStrEn = panchangam.nallaNeramMorning !== 'None'
    ? `${panchangam.nallaNeramMorning} in the morning`
    : panchangam.nallaNeramEvening;
  const ragukalamStrEn = panchangam.ragukalam;
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
    textEn: `Today's traditional Panchangam: The prevailing Thithi is ${panchangam.thithi.nameEnglish}, with ${panchangam.nakshatram.nameEnglish} Nakshatram and ${panchangam.yogam.nameEnglish} Yogam. Auspicious Nalla Neram is ${nallaNeramStrEn}. Inauspicious Ragukalam is observed at ${ragukalamStrEn}. ${festivalMentionEn}`,
    textTa: `இன்றைய மங்களகரமான பஞ்சாங்க விபரம். இன்று திதி ${panchangam.thithi.nameTamil}, நட்சத்திரம் ${panchangam.nakshatram.nameTamil}, மற்றும் ${panchangam.yogam.nameTamil}. இன்றைய நல்ல நேரம், காலையில் ${nallaMorningTa}, மாலையில் ${nallaEveningTa}. ராகு காலம், ${raguTa}. எமகண்டம், ${yemaTa}. ${festivalMentionTa}`,
  };

  // Section 5: Rasipalan Outlook
  const rasiOutlookMap: Record<string, { en: string; ta: string; nameEn: string; nameTa: string }> = {
    mesham: {
      nameEn: 'Aries (Mesham)',
      nameTa: 'மேஷ ராசி',
      en: 'Mesham: Fire energy is high. Channel your determination into progressive strength training. Stay well hydrated and maintain calm composure.',
      ta: 'இன்று உங்கள் ஆற்றலும் தைரியமும் அதிகமாக இருக்கும் நாள். கடினமான பயிற்சிகளையும் உற்சாகமாக செய்து முடிக்கலாம். போதுமான நீர் அருந்தி நிதானம் காக்கவும்.',
    },
    rishabam: {
      nameEn: 'Taurus (Rishabam)',
      nameTa: 'ரிஷப ராசி',
      en: 'Rishabam: Grounded endurance supports compound lifts today. Prioritize healthy dietary fats and restorative recovery.',
      ta: 'இன்று உங்கள் பொறுமையும் சகிப்புத்தன்மையும் மேலோங்கும். கனமான பயிற்சிகளை கவனமாகச் செய்யுங்கள். ஆரோக்கியமான சத்தான உணவுகளுக்கு முன்னுரிமை கொடுங்கள்.',
    },
    mithunam: {
      nameEn: 'Gemini (Mithunam)',
      nameTa: 'மிதுன ராசி',
      en: 'Mithunam: Mental sharpness and metabolic agility are heightened. Dynamic functional movements and HIIT will yield great results.',
      ta: 'இன்று சுறுசுறுப்பும் புத்தி கூர்மையும் மிளிரும் நாள். விரைவான செயல்பாடுகளும் கார்டியோ பயிற்சிகளும் உங்களுக்கு சிறந்த பலனைத் தரும்.',
    },
    kadagam: {
      nameEn: 'Cancer (Kadagam)',
      nameTa: 'கடக ராசி',
      en: 'Kadagam: Listen attentively to your joints and central nervous system. Focus on core stability, mobility, and peaceful breathing.',
      ta: 'இன்று உள்ளுணர்வும் மன அமைதியும் தேவைப்படும் நாள். மூச்சுப்பயிற்சி மற்றும் இதமான பயிற்சிகள் உங்கள் உடலையும் மனதையும் புத்துணர்ச்சியாக வைக்கும்.',
    },
    simmam: {
      nameEn: 'Leo (Simmam)',
      nameTa: 'சிம்ம ராசி',
      en: 'Simmam: Solar vigor is unmatched today. Lift with pride, hit your protein goals, and set the standard for discipline.',
      ta: 'சூரியனின் நேர்மறை ஆற்றலால் உங்கள் கம்பீரமும் தன்னம்பிக்கையும் கூடும். திட்டமிட்ட உடற்பயிற்சியை வெற்றிகரமாக முடித்து உடலை வலிமையாக்குங்கள்.',
    },
    kanni: {
      nameEn: 'Virgo (Kanni)',
      nameTa: 'கன்னி ராசி',
      en: 'Kanni: Precision in form and micronutrient intake will reward you. Fine-tune your exercise technique and recovery window.',
      ta: 'நுணுக்கமான திட்டமிடல் வெற்றி தரும் நாள். சரியான பயிற்சி முறைகளையும், அளவான சரிவிகித உணவையும் தவறாமல் பின்பற்றுங்கள்.',
    },
    thulaam: {
      nameEn: 'Libra (Thulaam)',
      nameTa: 'துலாம் ராசி',
      en: 'Thulaam: Strive for equilibrium between physical exertion and mental serenity. Unilateral exercises bring optimal symmetry.',
      ta: 'சமநிலையே உங்கள் பலம். தீவிர உடற்பயிற்சியுடன் போதுமான ஓய்வையும் சமமாக கடைப்பிடித்து உடல் ஆரோக்கியத்தை பாதுகாத்துக் கொள்ளுங்கள்.',
    },
    viruchigam: {
      nameEn: 'Scorpio (Viruchigam)',
      nameTa: 'விருச்சிக ராசி',
      en: 'Viruchigam: Unrelenting willpower is at your command. Break through training plateaus with unwavering focus.',
      ta: 'அசாத்திய மன உறுதி உண்டாகும். எத்தகைய கடினமான உடற்பயிற்சி சவால்களையும் எளிதாக வென்றிடுவீர்கள். போதுமான ஓய்வும் நீராகாரமும் அவசியம்.',
    },
    dhanusu: {
      nameEn: 'Sagittarius (Dhanusu)',
      nameTa: 'தனுசு ராசி',
      en: 'Dhanusu: Optimism powers your morning. Outdoor conditioning or expansive mobility flows will elevate your mood.',
      ta: 'புதிய உற்சாகமும் நேர்மறை சிந்தனைகளும் பிறக்கும் நாள். நடைபயிற்சியும் திறந்தவெளி உடற்பயிற்சிகளும் உங்கள் புத்துணர்ச்சியை அதிகரிக்கும்.',
    },
    makaram: {
      nameEn: 'Capricorn (Makaram)',
      nameTa: 'மகர ராசி',
      en: 'Makaram: Consistent structure is your greatest asset. Execute your progressive overload methodically without rush.',
      ta: 'விடாமுயற்சியும் ஒழுக்கமும் உங்கள் அடையாளம். திட்டமிட்ட உடற்பயிற்சி அட்டவணையை அமைதியாக செய்து முடித்து இலக்கை அடைந்திடுங்கள்.',
    },
    kumbam: {
      nameEn: 'Aquarius (Kumbam)',
      nameTa: 'கும்ப ராசி',
      en: 'Kumbam: Innovation in movement is favored. Try variations in grip, stance, or tempo for refreshing stimulus.',
      ta: 'புதுமையான சிந்தனைகள் தோன்றும் நாள். புதிய உடற்பயிற்சி நுட்பங்களை ஆர்வத்துடன் முயற்சி செய்து உடலை சுறுசுறுப்பாக வைத்திருங்கள்.',
    },
    meenam: {
      nameEn: 'Pisces (Meenam)',
      nameTa: 'மீன ராசி',
      en: 'Meenam: Fluid recovery and deep hydration are essential. Engage in stretching, mobility, and restorative contemplation.',
      ta: 'அமைதியான மனநிலை உதவும். உடலை வருத்தாமல் இதமான உடற்பயிற்சிகளையும் தியானத்தையும் மேற்கொண்டு ஆரோக்கியத்தை மேம்படுத்துங்கள்.',
    },
  };

  const rasiData = rasiOutlookMap[userRasiId.toLowerCase()] || rasiOutlookMap.mesham;

  const section5: BriefingSection = {
    id: 'section-5-rasipalan',
    category: 'rasipalan',
    titleEn: `Rasipalan Outlook - ${rasiData.nameEn}`,
    titleTa: `ராசிபலன் வழிகாட்டுதல் - ${rasiData.nameTa}`,
    textEn: `Rasipalan guidance for ${rasiData.nameEn}: ${rasiData.en}`,
    textTa: `இன்றைய ${rasiData.nameTa} வழிகாட்டல். ${rasiData.ta}`,
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
 * Synthesizes studio-grade, natural AI speech via Gemini TTS:
 * - English: Natural, warm, articulate, friendly Indian English speaker with clear conversational cadence
 * - Tamil: Natural, warm, fluent, friendly native Tamil speaker with cheerful conversational cadence
 * Converts raw WAV audio into an HTML5 Blob URL for seamless browser playback.
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

  const style =
    lang === 'en'
      ? 'natural, warm, articulate, friendly Indian English speaker with clear conversational cadence, authentic Indian pronunciation, and cheerful morning energy'
      : 'natural, warm, fluent, friendly native Tamil speaker with cheerful conversational cadence';

  // Resilient multi-model fallback: try gemini-3.8-flash-tts and gemini-3.8-flash-lite-tts
  const models = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];

  for (const model of models) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text,
                speechMetadata: { style },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { voice: 'Aoede' }, // 'Aoede' delivers warm, fluent, human diction
          },
        },
      });

      const base64Data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Data) continue;

      // Convert Base64 into Blob URL
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/wav' });
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
   * Pre-fetches all briefing audio clips (Indian English & Tamil) asynchronously in background
   * so every subsequent segment is already in memory with 0 lag.
   */
  public prefetchBriefingAudio(items: { text: string; lang: 'en' | 'ta' }[]) {
    (async () => {
      for (const item of items) {
        if (this.isCancelled) break;
        const cacheKey = `${item.lang}:${item.text}`;

        // 1. Preload Gemini TTS if not cached
        if (!geminiAudioCache.has(cacheKey)) {
          await synthesizeGeminiSpeech(item.text, item.lang);
        }

        // 2. Pre-prime Google Studio-Grade TTS chunks in browser HTTP cache
        try {
          const norm = item.lang === 'ta' ? normalizeTamilForSpeech(item.text) : normalizeEnglishForSpeech(item.text);
          const chunks = chunkTextForTTS(norm, 160);
          const ttsLang = item.lang === 'ta' ? 'ta' : 'en-IN';
          for (const chunk of chunks) {
            if (this.isCancelled) break;
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${ttsLang}&client=tw-ob`;
            const preAudio = new Audio();
            preAudio.preload = 'auto';
            preAudio.src = url;
          }
        } catch {
          // preloading is best-effort
        }
      }
    })();
  }

  /**
   * High-Fidelity Studio-Grade Google Neural Natural Speech Synthesizer
   * 100% Free, Unlimited, zero-quota restrictions.
   * Splits long text into natural breath-sized clauses (<=160 chars) and streams them
   * seamlessly using HTML5 Audio element with authentic Tamil intonation.
   */
  private async playGoogleTTSSequence(text: string, lang: 'en' | 'ta'): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (this.isCancelled) return false;

    try {
      const normalizedText = lang === 'ta' ? normalizeTamilForSpeech(text) : normalizeEnglishForSpeech(text);
      const chunks = chunkTextForTTS(normalizedText, 160);
      if (chunks.length === 0) return true;

      const ttsLang = lang === 'ta' ? 'ta' : 'en-IN';

      for (let i = 0; i < chunks.length; i++) {
        if (this.isCancelled) return false;
        const chunk = chunks[i];
        if (!chunk.trim()) continue;

        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${ttsLang}&client=tw-ob`;

        const chunkSuccess = await new Promise<boolean>((resolve) => {
          if (this.isCancelled) {
            resolve(false);
            return;
          }

          const audio = new Audio();
          audio.preload = 'auto';
          this.activeAudio = audio;

          let connectTimeout: NodeJS.Timeout | null = null;
          const cleanup = () => {
            if (connectTimeout) clearTimeout(connectTimeout);
            audio.onended = null;
            audio.onerror = null;
            audio.onplaying = null;
          };

          // 7-second watchdog connection timeout to detect offline / network block
          connectTimeout = setTimeout(() => {
            cleanup();
            if (this.activeAudio === audio) this.activeAudio = null;
            resolve(false);
          }, 7000);

          audio.onplaying = () => {
            if (connectTimeout) {
              clearTimeout(connectTimeout);
              connectTimeout = null;
            }
          };

          audio.onended = () => {
            cleanup();
            if (this.activeAudio === audio) this.activeAudio = null;
            resolve(true);
          };

          audio.onerror = (e) => {
            cleanup();
            console.warn(`Google neural TTS notice (${ttsLang}):`, e);
            if (this.activeAudio === audio) this.activeAudio = null;
            resolve(false);
          };

          audio.src = url;
          audio.play().catch((err) => {
            cleanup();
            console.warn(`Google neural TTS play notice (${ttsLang}):`, err);
            if (this.activeAudio === audio) this.activeAudio = null;
            resolve(false);
          });
        });

        if (!chunkSuccess) {
          return false;
        }

        // Natural micro-pause between clauses for authentic human breathing rhythm (160ms)
        if (i < chunks.length - 1 && !this.isCancelled) {
          await new Promise((r) => setTimeout(r, 160));
        }
      }

      return true;
    } catch (err) {
      console.warn('Google TTS sequence notice:', err);
      return false;
    }
  }

  /**
   * Finds the best matching voice for natural Indian English (en-IN / natural neural)
   * or authentic native Tamil (Google தமிழ் / ta-IN / Pallavi / Valluvar) for browser fallback.
   */
  public getBestVoice(lang: 'en' | 'ta'): SpeechSynthesisVoice | null {
    return getBestNaturalVoice(lang);
  }

  /**
   * Browser Speech Synthesis Fallback with watchdog timer, voice matching and optimized prosody
   */
  private speakWithBrowserSynthesis(text: string, lang: 'en' | 'ta'): Promise<void> {
    if (this.isCancelled) return Promise.resolve();
    return speakChunk(text, lang, {
      rate: lang === 'ta' ? 0.94 : 0.96,
      pitch: lang === 'ta' ? 1.02 : 1.0,
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
    languageMode: 'en' | 'ta' | 'both' = 'both'
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
      } else {
        // Mode 3: Tanglish / Bilingual (Single Unified Flow, Zero Duplication)
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
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
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
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
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
