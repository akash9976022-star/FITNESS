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
  const dateStrTa = `${tamilYearName} வருடம், ${tamilMonthName} மாதம் ${tamilDate} ஆம் நாள், ${dayOfWeekTa}`;

  // Calculated Nutrition Macros
  const calories = Math.round(maintenanceCalories || 2200);
  const proteinGrams = targetProteinGrams || Math.round((targetWeightKg || 70) * 2);
  const carbsGrams = Math.round((calories * 0.45) / 4);
  const fatsGrams = Math.round((calories * 0.25) / 9);

  // Section 1: Greeting & Calendar Date
  const section1: BriefingSection = {
    id: 'section-1-greeting',
    category: 'greeting',
    titleEn: 'Morning Greeting & Calendar',
    titleTa: 'காலை வணக்கம் & தமிழ் நாட்காட்டி',
    textEn: `Good morning, ${userName}! Today is ${dateStrEn}. In the traditional Tamil solar calendar, today is ${dateStrTa}. May your day begin with clear focus, peace, and boundless vitality.`,
    textTa: `வணக்கம் ${userName}, உங்கள் காலைப் பொழுது இனிதாக அமையட்டும். இன்று ஆங்கிலத் தேதி ${date.getDate()} ${monthNamesEn[date.getMonth()]}. தமிழ் பாரம்பரிய நாட்காட்டியின்படி இன்று ${dateStrTa}. உங்கள் நாள் புத்துணர்ச்சியுடனும், அமைதியுடனும், சிறந்த ஆற்றலுடனும் தொடங்க வாழ்த்துகள்.`,
  };

  // Section 2: Fitness & Nutrition Targets (Today's Nutrients)
  const section2: BriefingSection = {
    id: 'section-2-fitness',
    category: 'fitness',
    titleEn: 'Daily Nutrients & Fitness Targets',
    titleTa: 'இன்றைய ஊட்டச்சத்து & உடற்பயிற்சி',
    textEn: `Here is your daily nutrition and fitness target: Aim for ${calories} kilocalories today, with a target of ${proteinGrams} grams of protein, ${carbsGrams} grams of carbohydrates, and ${fatsGrams} grams of healthy fats. Remember to stay well hydrated with at least 3 liters of water. Working towards your target weight of ${targetWeightKg} kilograms requires daily consistency, discipline, and hitting your protein split. Your routine is loaded and ready.`,
    textTa: `இன்றைய ஊட்டச்சத்து மற்றும் உடற்பயிற்சி வழிகாட்டல்: உங்கள் தினசரி உடல் பராமரிப்பு கலோரி அளவு ${calories} கலோரிகள் ஆகும். இன்று ${proteinGrams} கிராம் புரதச்சத்து, ${carbsGrams} கிராம் மாவுச்சத்து, மற்றும் ${fatsGrams} கிராம் ஆரோக்கியமான கொழுப்பு உட்கொள்ள இலக்கு வையுங்கள். குறைந்தது மூன்று லிட்டர் தண்ணீர் அருந்தி, உங்கள் உடற்பயிற்சி அட்டவணையை தவறாமல் பின்பற்றி உடலை கட்டுக்கோப்பாக வைத்துக் கொள்ளுங்கள்.`,
  };

  // Section 3: Motivational Quote of the Day
  const quotes = [
    {
      en: 'Thought for the day: Consistency and discipline forge the unbreakable athlete. Rise with conviction, conquer your training, and honor your vessel.',
      ta: 'இன்றைய சிந்தனை மற்றும் ஊக்கமளிக்கும் பொன்மொழி: தினசரி ஒழுக்கமும் பயிற்சியுமே வெல்ல முடியாத உடலையும், அசைக்க முடியாத மன உறுதியையும் உருவாக்கும். எழுந்து சாதிப்போம்!',
    },
    {
      en: 'Thought for the day: Small daily disciplines accumulated over time lead to miraculous transformations. You hold the power today.',
      ta: 'இன்றைய சிந்தனை மற்றும் ஊக்கமளிக்கும் பொன்மொழி: சிறு துளி பெருவெள்ளம் போல, தினசரி செய்யும் ஒழுக்கமான பயிற்சியே அற்புத மாற்றத்திற்கு வித்திடும். இந்த நாளை வென்றிடுங்கள்!',
    },
    {
      en: 'Thought for the day: What hurts today makes you stronger tomorrow. Step onto the floor with courage and passion.',
      ta: 'இன்றைய சிந்தனை மற்றும் ஊக்கமளிக்கும் பொன்மொழி: இன்று நீங்கள் செய்யும் அர்ப்பணிப்பான உடற்பயிற்சியே நாளைய வலிமையாக மாறும். தன்னம்பிக்கையுடன் இந்த நாளை தொடங்குங்கள்!',
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

  const section4: BriefingSection = {
    id: 'section-4-panchangam',
    category: 'panchangam',
    titleEn: 'Panchangam & Auspicious Timings',
    titleTa: 'பஞ்சாங்கம் & நல்ல நேர வழிகாட்டுதல்',
    textEn: `Today's traditional Panchangam: The prevailing Thithi is ${panchangam.thithi.nameEnglish}, with ${panchangam.nakshatram.nameEnglish} Nakshatram and ${panchangam.yogam.nameEnglish} Yogam. Auspicious Nalla Neram is ${nallaNeramStrEn}. Inauspicious Ragukalam is observed at ${ragukalamStrEn}. ${festivalMentionEn}`,
    textTa: `இன்றைய மங்களகரமான பஞ்சாங்க விபரம்: திதி ${panchangam.thithi.nameTamil}, நட்சத்திரம் ${panchangam.nakshatram.nameTamil}, மற்றும் யோகம் ${panchangam.yogam.nameTamil}. நல்ல நேரம்: காலையில் ${panchangam.nallaNeramMorning}, மற்றும் மாலையில் ${panchangam.nallaNeramEvening}. இராகு காலம் ${panchangam.ragukalam}. எமகண்டம் ${panchangam.yemagandam}. ${festivalMentionTa}`,
  };

  // Section 5: Rasipalan Outlook
  const rasiOutlookMap: Record<string, { en: string; ta: string; nameEn: string; nameTa: string }> = {
    mesham: {
      nameEn: 'Aries (Mesham)',
      nameTa: 'மேஷ ராசி',
      en: 'Mesham: Fire energy is high. Channel your determination into progressive strength training. Stay well hydrated and maintain calm composure.',
      ta: 'மேஷம்: செவ்வாயின் ஆதிக்கம் நிறைந்த நாள். அதீத ஆற்றல் உண்டாகும். தீவிர உடற்பயிற்சிகளை துணிச்சலுடன் செய்து முடிக்கலாம். போதுமான நீர் அருந்தி நிதானம் காக்கவும்.',
    },
    rishabam: {
      nameEn: 'Taurus (Rishabam)',
      nameTa: 'ரிஷப ராசி',
      en: 'Rishabam: Grounded endurance supports compound lifts today. Prioritize healthy dietary fats and restorative recovery.',
      ta: 'ரிஷபம்: நிதானமும் சகிப்புத்தன்மையும் கூடும். கனமான பயிற்சிகளை கவனமாகச் செய்யலாம். சத்தான ஆரோக்கிய உணவுகளுக்கு முன்னுரிமை அளியுங்கள்.',
    },
    mithunam: {
      nameEn: 'Gemini (Mithunam)',
      nameTa: 'மிதுன ராசி',
      en: 'Mithunam: Mental sharpness and metabolic agility are heightened. Dynamic functional movements and HIIT will yield great results.',
      ta: 'மிதுனம்: சுறுசுறுப்பும் புத்தி கூர்மையும் மிளிரும் நாள். விரைவான செயல்பாடுகளும் கார்டியோ பயிற்சிகளும் சிறந்த பலனைத் தரும்.',
    },
    kadagam: {
      nameEn: 'Cancer (Kadagam)',
      nameTa: 'கடக ராசி',
      en: 'Kadagam: Listen attentively to your joints and central nervous system. Focus on core stability, mobility, and peaceful breathing.',
      ta: 'கடகம்: உள்ளுணர்வும் அமைதியும் தேவைப்படும் நாள். மூச்சுப்பயிற்சி மற்றும் யோகாசனங்கள் மன அமைதியையும் உடல் ஆரோக்கியத்தையும் பெருக்கும்.',
    },
    simmam: {
      nameEn: 'Leo (Simmam)',
      nameTa: 'சிம்ம ராசி',
      en: 'Simmam: Solar vigor is unmatched today. Lift with pride, hit your protein goals, and set the standard for discipline.',
      ta: 'சிம்மம்: சூரியனின் ஆற்றலால் கம்பீரமும் தைரியமும் கூடும். திட்டமிட்ட உடற்பயிற்சியை வெற்றிகரமாக செய்து முடித்து ஆரோக்கியத்தை நிலைநிறுத்துங்கள்.',
    },
    kanni: {
      nameEn: 'Virgo (Kanni)',
      nameTa: 'கன்னி ராசி',
      en: 'Kanni: Precision in form and micronutrient intake will reward you. Fine-tune your exercise technique and recovery window.',
      ta: 'கன்னி: நுணுக்கமான திட்டமிடல் வெற்றி தரும் நாள். சரியான உடற்பயிற்சி முறைகளையும், அளவான சரிவிகித உணவையும் தவறாது பின்பற்றுங்கள்.',
    },
    thulaam: {
      nameEn: 'Libra (Thulaam)',
      nameTa: 'துலாம் ராசி',
      en: 'Thulaam: Strive for equilibrium between physical exertion and mental serenity. Unilateral exercises bring optimal symmetry.',
      ta: 'துலாம்: சமநிலையே உங்கள் பலம். தீவிர உடற்பயிற்சியுடன் போதுமான ஓய்வையும் சமமாக கடைப்பிடித்து உடல் அழகையும் ஆரோக்கியத்தையும் காத்திடுங்கள்.',
    },
    viruchigam: {
      nameEn: 'Scorpio (Viruchigam)',
      nameTa: 'விருச்சிக ராசி',
      en: 'Viruchigam: Unrelenting willpower is at your command. Break through training plateaus with unwavering focus.',
      ta: 'விருச்சிகம்: அசாத்திய மன உறுதி உண்டாகும். கடினமான இலக்குகளையும் எளிதில் அடைவீர்கள். போதுமான ஓய்வும் நீராகாரமும் அவசியம்.',
    },
    dhanusu: {
      nameEn: 'Sagittarius (Dhanusu)',
      nameTa: 'தனுசு ராசி',
      en: 'Dhanusu: Optimism powers your morning. Outdoor conditioning or expansive mobility flows will elevate your mood.',
      ta: 'தனுசு: புதிய உற்சாகமும் நம்பிக்கையும் பிறக்கும் நாள். நடைபயிற்சி மற்றும் திறந்தவெளி பயிற்சிகள் உங்கள் புத்துணர்ச்சியை இரட்டிப்பாக்கும்.',
    },
    makaram: {
      nameEn: 'Capricorn (Makaram)',
      nameTa: 'மகர ராசி',
      en: 'Makaram: Consistent structure is your greatest asset. Execute your progressive overload methodically without rush.',
      ta: 'மகரம்: விடாமுயற்சியும் கடமை உணர்வும் மேலோங்கும். திட்டமிட்ட உடற்பயிற்சி அட்டவணையை அமைதியாக செய்து உடலை வலிமையாக்குங்கள்.',
    },
    kumbam: {
      nameEn: 'Aquarius (Kumbam)',
      nameTa: 'கும்ப ராசி',
      en: 'Kumbam: Innovation in movement is favored. Try variations in grip, stance, or tempo for refreshing stimulus.',
      ta: 'கும்பம்: புதுமையான சிந்தனைகள் தோன்றும். புதிய உடற்பயிற்சி நுட்பங்களை முயற்சி செய்து உடலை உற்சாகமாக வைத்திருங்கள்.',
    },
    meenam: {
      nameEn: 'Pisces (Meenam)',
      nameTa: 'மீன ராசி',
      en: 'Meenam: Fluid recovery and deep hydration are essential. Engage in stretching, mobility, and restorative contemplation.',
      ta: 'மீனம்: அமைதியான மனநிலை உதவும். உடலை வருத்தாமல் இதமான உடற்பயிற்சிகளையும் தியானத்தையும் மேற்கொண்டு உடலையும் உள்ளத்தையும் பாதுகாக்கவும்.',
    },
  };

  const rasiData = rasiOutlookMap[userRasiId.toLowerCase()] || rasiOutlookMap.mesham;

  const section5: BriefingSection = {
    id: 'section-5-rasipalan',
    category: 'rasipalan',
    titleEn: `Rasipalan Outlook - ${rasiData.nameEn}`,
    titleTa: `ராசிபலன் வழிகாட்டுதல் - ${rasiData.nameTa}`,
    textEn: `Rasipalan guidance for ${rasiData.nameEn}: ${rasiData.en}`,
    textTa: `இன்றைய ராசிபலன் வழிகாட்டுதல், ${rasiData.nameTa}: ${rasiData.ta}`,
  };

  return [section1, section2, section3, section4, section5];
};

/* ==================== 6. DUAL-LANGUAGE SPEECH SYNTHESIS ENGINE ==================== */

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
   * Finds the best matching voice for natural English (en-IN / en-US / natural neural)
   * or authentic native Tamil (Google தமிழ் / ta-IN / Valluvar).
   */
  private getBestVoice(lang: 'en' | 'ta'): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    if (lang === 'ta') {
      // 1. High priority: Google தமிழ் (Android / Chrome standard), ta-IN, ta-LK, ta-SG
      const googleTaVoice = voices.find((v) => {
        const n = v.name.toLowerCase();
        const l = v.lang.toLowerCase().replace('_', '-');
        return (l === 'ta-in' || l === 'ta_in' || l.startsWith('ta')) && (n.includes('google') || n.includes('தமிழ்'));
      });
      if (googleTaVoice) return googleTaVoice;

      // 2. Microsoft Valluvar, Microsoft Latha, or any ta-IN / Tamil voice
      const exactTaVoice = voices.find((v) => {
        const l = v.lang.toLowerCase().replace('_', '-');
        const n = v.name.toLowerCase();
        return (
          l === 'ta-in' ||
          l === 'ta_in' ||
          l === 'ta-lk' ||
          l === 'ta-sg' ||
          n.includes('valluvar') ||
          n.includes('latha') ||
          n.includes('tamil') ||
          n.includes('தமிழ்')
        );
      });
      if (exactTaVoice) return exactTaVoice;

      // 3. Any voice where language code starts with 'ta'
      const anyTaVoice = voices.find((v) => v.lang.toLowerCase().startsWith('ta'));
      if (anyTaVoice) return anyTaVoice;

      // CRITICAL: NEVER return an English voice when speaking Tamil!
      // Returning null allows the browser engine to route by utterance.lang = 'ta-IN'
      return null;
    } else {
      // English: Select highest quality natural / conversational voice
      const naturalEnVoice =
        // Natural / Neural online voices
        voices.find((v) => {
          const l = v.lang.toLowerCase().replace('_', '-');
          const n = v.name.toLowerCase();
          return (
            (l === 'en-in' || l === 'en-us' || l === 'en-gb') &&
            (n.includes('natural') || n.includes('neural') || n.includes('online'))
          );
        }) ||
        // Indian English (natural & clear)
        voices.find((v) => {
          const l = v.lang.toLowerCase().replace('_', '-');
          const n = v.name.toLowerCase();
          return l === 'en-in' || n.includes('india') || n.includes('ravi') || n.includes('heera');
        }) ||
        // Google English voices
        voices.find((v) => {
          const l = v.lang.toLowerCase().replace('_', '-');
          const n = v.name.toLowerCase();
          return l.startsWith('en') && n.includes('google');
        }) ||
        // Standard high-quality voices
        voices.find((v) => {
          const n = v.name.toLowerCase();
          return (
            n.includes('samantha') ||
            n.includes('ava') ||
            n.includes('jenny') ||
            n.includes('oliver') ||
            n.includes('karen')
          );
        }) ||
        // Any English voice
        voices.find((v) => v.lang.toLowerCase().startsWith('en'));

      return naturalEnVoice || voices[0] || null;
    }
  }

  /**
   * Promisified speech synthesis utterance with watchdog timeout and natural pacing
   */
  private speakUtterance(text: string, lang: 'en' | 'ta'): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        resolve();
        return;
      }

      if (this.isCancelled) {
        resolve();
        return;
      }

      // Wake up speech synthesis if paused
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
      
      // Natural pacing:
      // English: 0.94x (comfortable, relaxed natural conversational cadence)
      // Tamil: 0.88x (clear native Dravidian articulation, respecting long vowels & pauses)
      utterance.rate = lang === 'ta' ? 0.88 : 0.94;
      utterance.pitch = 1.0;

      const voice = this.getBestVoice(lang);
      if (voice) {
        utterance.voice = voice;
      }

      // Safety timeout safeguard based on text length (~120ms per character + 3s buffer)
      let timer: NodeJS.Timeout | null = null;
      const cleanup = () => {
        if (timer) clearTimeout(timer);
      };

      const timeoutMs = Math.max(8000, text.length * 120 + 3000);
      timer = setTimeout(() => {
        cleanup();
        resolve();
      }, timeoutMs);

      utterance.onend = () => {
        cleanup();
        resolve();
      };
      utterance.onerror = (e) => {
        cleanup();
        console.warn('Speech synthesis utterance notice:', e);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Refined Bilingual Voice Briefing Sequence:
   * 1. English Segment First:
   *    - Greeting (Personalized greeting with name and date)
   *    - Today's Nutrients & Fitness Targets (Calories, Protein, Hydration)
   *    - Quote of the Day (Thought for the day)
   * 2. Tamil Segment Immediately Following:
   *    - Greeting in Tamil (வணக்கம் [Name]...)
   *    - Today's Nutrients in Tamil (இன்றைய ஊட்டச்சத்து & உடற்பயிற்சி...)
   *    - Quote of the Day in Tamil (இன்றைய சிந்தனை & பொன்மொழி...)
   *    - Panchangam & Auspicious Timings in Tamil (திதி, நட்சத்திரம், நல்ல நேரம்...)
   *    - Daily Rasipalan Guidance in Tamil (ராசிபலன் வழிகாட்டல்...)
   */
  public async startBriefing(
    sections: BriefingSection[],
    callbacks?: SpeechBriefingCallbacks
  ): Promise<void> {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (callbacks?.onAllComplete) callbacks.onAllComplete();
      return;
    }

    this.stop();
    this.isSpeaking = true;
    this.isCancelled = false;

    try {
      interface SpeechStep {
        sectionIndex: number;
        category: BriefingSection['category'];
        lang: 'en' | 'ta';
        text: string;
        segment: 'english' | 'tamil';
      }

      const steps: SpeechStep[] = [];

      // =========================================================================
      // PHASE 1: ENGLISH (Greeting -> Today's Nutrients -> Quote of the Day)
      // =========================================================================
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

      const quoteIdx = sections.findIndex((s) => s.category === 'quote');
      if (quoteIdx !== -1) {
        steps.push({
          sectionIndex: quoteIdx,
          category: 'quote',
          lang: 'en',
          text: sections[quoteIdx].textEn,
          segment: 'english',
        });
      }

      // =========================================================================
      // PHASE 2: TAMIL (Greeting -> Nutrients -> Quote -> Panchangam -> Rasipalan)
      // "after reading english start in taml start with greeting all content is tell in tamil"
      // =========================================================================
      if (greetingIdx !== -1) {
        steps.push({
          sectionIndex: greetingIdx,
          category: 'greeting',
          lang: 'ta',
          text: sections[greetingIdx].textTa,
          segment: 'tamil',
        });
      }

      if (fitnessIdx !== -1) {
        steps.push({
          sectionIndex: fitnessIdx,
          category: 'fitness',
          lang: 'ta',
          text: sections[fitnessIdx].textTa,
          segment: 'tamil',
        });
      }

      if (quoteIdx !== -1) {
        steps.push({
          sectionIndex: quoteIdx,
          category: 'quote',
          lang: 'ta',
          text: sections[quoteIdx].textTa,
          segment: 'tamil',
        });
      }

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

      // Fallback: any other unhandled sections spoken in Tamil
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
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
  }

  public resume() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }

  public stop() {
    this.isCancelled = true;
    this.isSpeaking = false;
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
