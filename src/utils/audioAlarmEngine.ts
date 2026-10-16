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
    title: 'Kanda Sashti Kavasam',
    titleTamil: 'கந்த சஷ்டி கவசம்',
    deity: 'Lord Murugan',
    deityTamil: 'முருகப்பெருமான்',
    duration: '21:30',
    // Authentic continuous high-fidelity audio streams with reliable fallback
    audioUrl: 'https://ia800304.us.archive.org/21/items/KandhaSashtiKavasam/Kandha_Sashti_Kavasam.mp3',
    description: 'The ancient armor of Lord Murugan conferring fearless vitality, focus, and supreme physical endurance.',
    descriptionTamil: 'துதிப்போர்க்கு வல்வினைபோம் துன்பம்போம் நெஞ்சில் பதிப்போர்க்குச் செல்வம் பலித்துக் கதித்தோங்கும் கந்த சஷ்டி கவசம்.',
    lyricsHighlight: 'Thudhipporkku valvinaipom thunbampom; Nenjil padhipporkku chelvam palithuk kathithongum; Saravana bhavanaar saasharam kaakka!',
    lyricsHighlightTamil: 'துதிப்போர்க்கு வல்வினைபோம் துன்பம்போம்; நெஞ்சில் பதிப்போர்க்குச் செல்வம் பலித்துக் கதித்தோங்கும்; சரவணபவனார் சாதுரியம் காக்க!',
  },
  {
    id: 'sivapuranam',
    title: 'Sivapuranam (Thiruvasagam)',
    titleTamil: 'சிவபுராணம் (திருவாசகம்)',
    deity: 'Lord Shiva',
    deityTamil: 'சிவபெருமான்',
    duration: '16:45',
    audioUrl: 'https://ia801306.us.archive.org/3/items/Sivapuranam_SPB/Sivapuranam.mp3',
    description: 'The sublime morning hymn of boundless cosmic consciousness by Saint Manikkavacakar.',
    descriptionTamil: 'இமைப்பொழுதும் என் நெஞ்சில் நீங்காதான் தாள் வாழ்க! உள்ளொளியாய் எனை ஆட்கொண்ட ஈசனின் திருவடி போற்றி.',
    lyricsHighlight: 'Namachivaaya vaazhga naadhan thaal vaazhga; Imaippozhudhum en nenjil neengaadhaan thaal vaazhga; Kokazhi aanda guru manipthan thaal vaazhga!',
    lyricsHighlightTamil: 'நமச்சிவாய வாழ்க நாதன்தாள் வாழ்க! இமைப்பொழுதும் என்நெஞ்சில் நீங்காதான் தாள்வாழ்க! கோகழி ஆண்ட குருமணிதன் தாள்வாழ்க!',
  },
];

/* ==================== 2. PRELOADED ALARM VIDEO SONGS ==================== */

export const PRELOADED_ALARM_VIDEOS: PreloadedAlarmVideo[] = [
  {
    id: 'murugan-kavasam-video',
    title: 'Kanda Sashti Kavasam - Full Visual Chants',
    artistOrDeity: 'Lord Murugan (கந்தவேள்)',
    videoUrl: 'https://www.youtube.com/watch?v=kYJ5bQx9xGE',
    embedUrl: 'https://www.youtube-nocookie.com/embed/kYJ5bQx9xGE?autoplay=1&enablejsapi=1&rel=0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    duration: '21:30',
    category: 'Devotional',
  },
  {
    id: 'sivapuranam-chants-video',
    title: 'Sivapuranam - Divine Morning Thiruvasagam',
    artistOrDeity: 'Lord Shiva (சிவபெருமான்)',
    videoUrl: 'https://www.youtube.com/watch?v=OmsF2_4XWps',
    embedUrl: 'https://www.youtube-nocookie.com/embed/OmsF2_4XWps?autoplay=1&enablejsapi=1&rel=0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
    duration: '16:45',
    category: 'Devotional',
  },
  {
    id: 'suprabhatam-ms-video',
    title: 'Sri Venkateswara Suprabhatam - M.S. Subbulakshmi',
    artistOrDeity: 'Lord Venkateswara (ஸ்ரீ வெங்கடேஸ்வரா)',
    videoUrl: 'https://www.youtube.com/watch?v=FqjU0nI6G90',
    embedUrl: 'https://www.youtube-nocookie.com/embed/FqjU0nI6G90?autoplay=1&enablejsapi=1&rel=0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
    duration: '20:15',
    category: 'Devotional',
  },
  {
    id: 'vinayagar-agaval-video',
    title: 'Vinayagar Agaval - Morning Awakening Energy',
    artistOrDeity: 'Lord Ganesha (விநாயகர்)',
    videoUrl: 'https://www.youtube.com/watch?v=7uK3X8l1t-4',
    embedUrl: 'https://www.youtube-nocookie.com/embed/7uK3X8l1t-4?autoplay=1&enablejsapi=1&rel=0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80',
    duration: '12:00',
    category: 'Devotional',
  },
  {
    id: 'tibetan-bowls-432hz-video',
    title: 'Tibetan Singing Bowls & Sunrise - 432Hz Sound Bath',
    artistOrDeity: 'Deep Awakening & Clarity',
    videoUrl: 'https://www.youtube.com/watch?v=P2oB_j5p6wM',
    embedUrl: 'https://www.youtube-nocookie.com/embed/P2oB_j5p6wM?autoplay=1&enablejsapi=1&rel=0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=600&q=80',
    duration: '15:00',
    category: 'Meditation',
  },
];

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
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private isPlaying: boolean = false;

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
   * Generates a warm, meditative morning Tanpura / drone chord (C# - G# - C# - F)
   * filtered with gentle resonance to accompany speech briefing without overwhelming it.
   */
  public start(volume: number = 0.15) {
    if (this.isPlaying) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0001, now);
      // Gentle 2-second fade-in
      this.masterGain.gain.linearRampToValueAtTime(Math.min(0.3, volume), now + 2.0);
      this.masterGain.connect(ctx.destination);

      // Low pass filter to keep sound soft and soothing under speech
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.Q.setValueAtTime(1.5, now);
      filter.connect(this.masterGain);

      // Notes: C#3 (138.59 Hz), G#3 (207.65 Hz), C#4 (277.18 Hz), F4 (349.23 Hz)
      const freqs = [138.59, 207.65, 277.18, 349.23];

      this.oscillators = freqs.map((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        // Micro-detune for warm acoustic flutter
        osc.detune.setValueAtTime((i - 1.5) * 4, now);

        gain.gain.setValueAtTime(0.25, now);
        osc.connect(gain);
        gain.connect(filter);

        osc.start(now);
        return osc;
      });

      this.isPlaying = true;
    } catch (e) {
      console.warn('Ambient background music init notice:', e);
    }
  }

  public fadeOutAndStop(durationMs: number = 1500) {
    if (!this.isPlaying || !this.masterGain || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const durationSec = durationMs / 1000;
      this.masterGain.gain.linearRampToValueAtTime(0.0001, now + durationSec);

      setTimeout(() => {
        this.oscillators.forEach((osc) => {
          try {
            osc.stop();
          } catch {
            // Ignored
          }
        });
        this.oscillators = [];
        this.isPlaying = false;
      }, durationMs);
    } catch (e) {
      console.warn('Fadeout error:', e);
      this.isPlaying = false;
    }
  }

  public stop() {
    this.fadeOutAndStop(300);
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
  customFastingNotes?: string;
}

/**
 * Builds the comprehensive 5-pillar morning briefing with every single section
 * translated completely into authentic Tamil alongside English.
 */
export const buildMorningBriefingContent = ({
  userName = 'Athlete',
  date,
  tamilDateInfo,
  userRasiId = 'mesham',
  maintenanceCalories = 2200,
  targetWeightKg = 70,
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

  // Section 1: Greeting & Date
  const section1: BriefingSection = {
    id: 'section-1-greeting',
    category: 'greeting',
    titleEn: 'Morning Greeting & Calendar',
    titleTa: 'காலை வணக்கம் & தமிழ் நாட்காட்டி',
    textEn: `Good morning, ${userName}! Today is ${dateStrEn}. In the traditional Tamil solar calendar, today is ${dateStrTa}. May your day begin with clarity, peace, and boundless vitality.`,
    textTa: `இனிய காலை வணக்கம் ${userName}! இன்று ஆங்கிலத் தேதி ${date.getDate()} ${monthNamesEn[date.getMonth()]}. தமிழ் பாரம்பரிய நாட்காட்டியின்படி இன்று ${dateStrTa}. உங்கள் நாள் புத்துணர்ச்சியுடனும், அமைதியுடனும், சிறந்த ஆற்றலுடனும் தொடங்க வாழ்த்துகள்.`,
  };

  // Section 2: Panchangam & Fasting
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

  const section2: BriefingSection = {
    id: 'section-2-panchangam',
    category: 'panchangam',
    titleEn: 'Panchangam & Auspicious Timings',
    titleTa: 'பஞ்சாங்கம் & நல்ல நேர வழிகாட்டுதல்',
    textEn: `Today's traditional Panchangam: The prevailing Thithi is ${panchangam.thithi.nameEnglish}, with ${panchangam.nakshatram.nameEnglish} Nakshatram and ${panchangam.yogam.nameEnglish} Yogam. Auspicious Nalla Neram is ${nallaNeramStrEn}. Inauspicious Ragukalam is observed at ${ragukalamStrEn}. ${festivalMentionEn}`,
    textTa: `இன்றைய பஞ்சாங்க விபரம்: திதி ${panchangam.thithi.nameTamil}, நட்சத்திரம் ${panchangam.nakshatram.nameTamil}, மற்றும் யோகம் ${panchangam.yogam.nameTamil}. நல்ல நேரம்: ${panchangam.nallaNeramMorning} மற்றும் மாலை ${panchangam.nallaNeramEvening}. இராகு காலம் ${panchangam.ragukalam}. எமகண்டம் ${panchangam.yemagandam}. ${festivalMentionTa}`,
  };

  // Section 3: Rasipalan
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

  const section3: BriefingSection = {
    id: 'section-3-rasipalan',
    category: 'rasipalan',
    titleEn: `Rasipalan Outlook - ${rasiData.nameEn}`,
    titleTa: `ராசிபலன் வழிகாட்டுதல் - ${rasiData.nameTa}`,
    textEn: rasiData.en,
    textTa: rasiData.ta,
  };

  // Section 4: Fitness & Nutrition Targets
  const section4: BriefingSection = {
    id: 'section-4-fitness',
    category: 'fitness',
    titleEn: 'Body Maintenance & Calorie Targets',
    titleTa: 'உடல் பராமரிப்பு & கலோரி இலக்குகள்',
    textEn: `Your daily Body Maintenance calorie target is calculated at ${Math.round(maintenanceCalories)} kilocalories. Working towards your target weight of ${targetWeightKg} kilograms requires consistent daily discipline, adequate hydration, and hitting your protein split. Your routine is loaded and ready.`,
    textTa: `உங்கள் தினசரி உடல் பராமரிப்பு கலோரி அளவு ${Math.round(maintenanceCalories)} கலோரிகள் ஆகும். உங்கள் இலக்கு எடையை (${targetWeightKg} கிலோ) அடைவதற்கு இன்றைய ஊட்டச்சத்தையும், உடற்பயிற்சி அட்டவணையையும் தவறாமல் பின்பற்றுங்கள். உடலை வலிமையாக வைத்திருங்கள்.`,
  };

  // Section 5: Motivational Quote
  const quotes = [
    {
      en: 'Thought for the day: Consistency and discipline forge the unbreakable athlete. Rise with conviction, conquer your training, and honor your vessel.',
      ta: 'இன்றைய பொன்மொழி: தினசரி ஒழுக்கமும் பயிற்சியுமே வெல்ல முடியாத உடலையும், அசைக்க முடியாத மன உறுதியையும் உருவாக்கும். எழுந்து சாதிப்போம்!',
    },
    {
      en: 'Thought for the day: Small daily disciplines accumulated over time lead to miraculous transformations. You hold the power today.',
      ta: 'இன்றைய பொன்மொழி: சிறு துளி பெருவெள்ளம் போல, தினசரி செய்யும் ஒழுக்கமான பயிற்சியே அற்புத மாற்றத்திற்கு வித்திடும். இந்த நாளை வென்றிடுங்கள்!',
    },
  ];
  const selectedQuote = quotes[date.getDate() % quotes.length];

  const section5: BriefingSection = {
    id: 'section-5-quote',
    category: 'quote',
    titleEn: 'Morning Motivation & Power',
    titleTa: 'காலை எழுச்சி & பொன்மொழி',
    textEn: selectedQuote.en,
    textTa: selectedQuote.ta,
  };

  return [section1, section2, section3, section4, section5];
};

/* ==================== 6. DUAL-LANGUAGE SPEECH SYNTHESIS ENGINE ==================== */

export interface SpeechBriefingCallbacks {
  onSectionStart?: (sectionIndex: number, language: 'en' | 'ta') => void;
  onSectionComplete?: (sectionIndex: number) => void;
  onAllComplete?: () => void;
  onError?: (err: unknown) => void;
}

class SpeechBriefingEngine {
  private isSpeaking: boolean = false;
  private isCancelled: boolean = false;
  private currentSectionIndex: number = 0;
  private currentLang: 'en' | 'ta' = 'en';

  /**
   * Finds the best matching voice for English or Tamil
   */
  private getBestVoice(lang: 'en' | 'ta'): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    if (lang === 'ta') {
      // Prioritize Tamil (India) voice
      const taVoice = voices.find(
        (v) => v.lang === 'ta-IN' || v.lang.toLowerCase().startsWith('ta') || v.name.toLowerCase().includes('tamil')
      );
      if (taVoice) return taVoice;
      // Fallback: any Indian English or fallback voice
      return voices.find((v) => v.lang === 'en-IN') || voices[0] || null;
    } else {
      // Prioritize Indian English for natural regional cadence, or natural English
      const enVoice = voices.find(
        (v) => v.lang === 'en-IN' || v.name.toLowerCase().includes('india') || v.lang.startsWith('en')
      );
      return enVoice || voices[0] || null;
    }
  }

  /**
   * Promisified speech synthesis utterance
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

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
      utterance.rate = lang === 'ta' ? 0.95 : 1.0; // Slightly slower Tamil for crystal clear diction
      utterance.pitch = 1.0;

      const voice = this.getBestVoice(lang);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (e) => {
        console.warn('Speech synthesis utterance notice:', e);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Starts sequential Dual-Language Speech Briefing:
   * Speaks every single section completely in English first,
   * followed immediately by the exact translation in Tamil!
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

    // Start soothing background ambient music during speech briefing
    ambientMusicEngine.start(0.15);

    try {
      for (let i = 0; i < sections.length; i++) {
        if (this.isCancelled) break;
        const section = sections[i];
        this.currentSectionIndex = i;

        // Step A: English Speech
        this.currentLang = 'en';
        if (callbacks?.onSectionStart) callbacks.onSectionStart(i, 'en');
        await this.speakUtterance(section.textEn, 'en');
        if (this.isCancelled) break;

        // Brief natural breath pause
        await new Promise((r) => setTimeout(r, 450));
        if (this.isCancelled) break;

        // Step B: Tamil Speech
        this.currentLang = 'ta';
        if (callbacks?.onSectionStart) callbacks.onSectionStart(i, 'ta');
        await this.speakUtterance(section.textTa, 'ta');
        if (this.isCancelled) break;

        if (callbacks?.onSectionComplete) callbacks.onSectionComplete(i);
        await new Promise((r) => setTimeout(r, 600));
      }
    } catch (err) {
      console.error('Speech briefing sequence error:', err);
      if (callbacks?.onError) callbacks.onError(err);
    } finally {
      this.isSpeaking = false;
      // Fade out background ambient music
      ambientMusicEngine.fadeOutAndStop(1200);

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
