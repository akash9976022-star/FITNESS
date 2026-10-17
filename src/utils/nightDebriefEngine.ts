/**
 * FitMaintenance AI - 9:00 PM End-of-Day AI Coach Debrief & Sleep Blackout Engine
 * 
 * Capabilities:
 * 1. Evaluates real-time daily metrics: workouts, nutrition, water intake, steps, check-in, streak, and fasting.
 * 2. Generates dynamic, conversational script with 4 distinct pillars:
 *    - Pillar 1: Achievements (Genuine praise for daily victories)
 *    - Pillar 2: The Scold (Firm, slightly witty "strict big-brother / head coach" accountability tough-love)
 *    - Pillar 3: Tomorrow's Motivation (Calm, grounding mindset reset for tomorrow's 6:00 AM wake-up)
 *    - Pillar 4: Wind-Down Command (Put the phone away and prepare for sleep)
 * 3. Strict 3-Mode Routing:
 *    - Mode 1: English Only ('en') -> 100% natural Indian/International English, spoken once.
 *    - Mode 2: Tamil Only ('ta') -> 100% natural colloquial spoken Tamil (Peccu Tamil), spoken once.
 *    - Mode 3: Tanglish ('both') -> Single unified code-switched script (alternating en-IN and ta-IN chunks in a single flow).
 * 4. Micro-pauses and natural human-like cadence (rate=0.96, pitch=1.02, dropping to rate=0.92, pitch=0.96 for sleep).
 * 5. Execution lock and callback nullification to guarantee zero duplicate loops.
 */

import type { DailyPerformanceSummary, NightDebriefLanguage } from '../services/firestoreService';
import {
  loadVoices,
  getBestNaturalVoice,
  splitIntoSentences,
  speakChunk,
  stopAllVoiceSpeech,
  normalizeLanguageTag,
} from './voiceSynthesisHelper';

export interface DebriefSegmentItem {
  id: string;
  category: 'achievement' | 'scold' | 'motivation' | 'windDown';
  titleEn: string;
  titleTa: string;
  badge: string;
  badgeColor: 'emerald' | 'amber' | 'cyan' | 'purple';
  textEn: string;
  textTa: string;
  tanglishChunks?: Array<{ lang: 'en' | 'ta' | 'en-IN' | 'ta-IN' | string; text: string }>;
}

export interface DebriefScript {
  userName: string;
  date: string;
  escapedScold: boolean;
  segments: DebriefSegmentItem[];
}

/**
 * Backward compatibility voice finder delegating to the universal helper
 */
export function getBestDebriefVoice(
  lang: 'en' | 'ta',
  voices?: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  return getBestNaturalVoice(lang, voices);
}

/**
 * Builds the dynamic 4-pillar script based on today's real Firestore metrics
 * with English, Spoken Tamil, and True Tanglish code-switched chunks.
 */
export function buildNightDebriefScript(
  summary: DailyPerformanceSummary,
  userName = 'Athlete'
): DebriefScript {
  const firstName = (userName || 'Athlete').trim().split(' ')[0] || 'Athlete';

  // =========================================================================
  // 1. EVALUATE ACHIEVEMENTS (PRAISE)
  // =========================================================================
  const achievementsEn: string[] = [];
  const achievementsTa: string[] = [];
  const tanglishAchievementChunks: Array<{ lang: 'en' | 'ta'; text: string }> = [
    {
      lang: 'en',
      text: `Hey ${firstName}! Good evening bro. Let's check what you crushed today.`,
    },
  ];

  if (summary.workoutCompleted) {
    const mins = summary.workoutDurationMinutes || 45;
    const vol = summary.workoutVolumeKg
      ? ` pushing ${summary.workoutVolumeKg.toLocaleString()} kilograms of volume`
      : '';
    achievementsEn.push(
      `You crushed your scheduled workout today, putting in ${mins} intense minutes of training${vol}.`
    );
    achievementsTa.push(
      `இன்னைக்கு ${mins} நிமிஷம் ஜிம்ல ஒர்க்அவுட் பண்ணி கலக்கிட்டீங்க, செம மாஸ்!`
    );
    tanglishAchievementChunks.push({
      lang: 'ta',
      text: `இன்னைக்கு ${mins} நிமிஷம் ஒர்க்அவுட் செமையா பண்ணிருக்கீங்க, உண்மையாவே சூப்பர்!`,
    });
  }

  if (summary.waterPercent >= 85) {
    achievementsEn.push(
      `Your hydration was locked in at ${(summary.waterMl / 1000).toFixed(1)} liters, hitting ${summary.waterPercent}% of your daily fluid target.`
    );
    achievementsTa.push(
      `தண்ணீர் குடிக்கும் இலக்கை ${summary.waterPercent} சதவீதம் அடைஞ்சு, உடம்பை நீர்ச்சத்தோட வச்சிருக்கீங்க.`
    );
    tanglishAchievementChunks.push({
      lang: 'ta',
      text: `தண்ணீரும் கரெக்டா குடிச்சு உடம்பை ஃப்ரெஷ்ஷா வச்சிருக்கீங்க.`,
    });
  }

  if (summary.steps >= 8000) {
    achievementsEn.push(
      `You stayed on your feet and logged ${summary.steps.toLocaleString()} steps of active movement.`
    );
    achievementsTa.push(
      `மொத்தம் ${summary.steps.toLocaleString()} அடிகள் நடந்து செம்ம சுறுசுறுப்பா இருந்திருக்கீங்க.`
    );
    tanglishAchievementChunks.push({
      lang: 'en',
      text: `You also crushed your movement target with ${summary.steps.toLocaleString()} steps today!`,
    });
  }

  if (summary.caloriesConsumed > 0 && Math.abs(summary.calorieDelta) <= 250) {
    achievementsEn.push(
      `Your nutrition was right on equilibrium with ${summary.caloriesConsumed.toLocaleString()} calories, maintaining energy balance.`
    );
    achievementsTa.push(
      `உணவுக் கட்டுப்பாட்டுல சரியா ${summary.caloriesConsumed.toLocaleString()} கலோரி எடுத்து எனர்ஜியை கச்சிதமா பேலன்ஸ் பண்ணிட்டீங்க.`
    );
    tanglishAchievementChunks.push({
      lang: 'ta',
      text: `டயட்டையும் கரெக்டா மெயின்டெய்ன் பண்ணி கலோரியை பக்காவா பேலன்ஸ் பண்ணிருக்கீங்க.`,
    });
  }

  if (summary.checkInCompleted) {
    achievementsEn.push(
      `You started your day intentionally with your morning biometric check-in.`
    );
    achievementsTa.push(
      `காலையிலேயே செக்-இன் பண்ணி தினசரி தொடக்கத்தை நேர்த்தியா ஆரம்பிச்சீங்க.`
    );
  }

  if (summary.streakCount > 0) {
    achievementsEn.push(
      `Your unbroken consistency streak now stands tall at ${summary.streakCount} ${summary.streakCount === 1 ? 'day' : 'days'}.`
    );
    achievementsTa.push(
      `உங்களோட தொடர் பழக்கவழக்க ஸ்ட்ரீக் இப்ப ${summary.streakCount} நாளா வெற்றிகரமா தொடருது.`
    );
    tanglishAchievementChunks.push({
      lang: 'en',
      text: `Your consistency streak is now locked in at ${summary.streakCount} ${summary.streakCount === 1 ? 'day' : 'days'}. That's true dedication!`,
    });
  }

  // Fallback if no specific target was hit
  if (achievementsEn.length === 0) {
    achievementsEn.push(
      `You made time to show up for your evening debrief tonight. Showing up for accountability is where real transformation begins.`
    );
    achievementsTa.push(
      `இன்னைக்கு இந்த இரவு ரிவ்யூக்கு வந்து நின்னதே பெரிய விஷயம். இந்த சுய கட்டுப்பாடுதான் உங்களை அடுத்த கட்டத்துக்கு கொண்டு போகும்!`
    );
    tanglishAchievementChunks.push({
      lang: 'ta',
      text: `இன்னைக்கு இந்த இரவு ரிவ்யூக்கு வந்து நின்னதே நல்ல தொடக்கம்தான்.`,
    });
    tanglishAchievementChunks.push({
      lang: 'en',
      text: `Showing up for daily accountability is where real transformation starts.`,
    });
  }

  const praiseTextEn = `Good evening ${firstName}! Let's review what you accomplished today. ${achievementsEn.join(' ')}`;
  const praiseTextTa = `வணக்கம் ${firstName}! இன்னைக்கு நீங்க என்னெல்லாம் சாதிச்சிருக்கீங்கனு பார்ப்போம். ${achievementsTa.join(' ')}`;

  // =========================================================================
  // 2. EVALUATE SCOLD (STRICT COACH TOUGH-LOVE)
  // =========================================================================
  const scoldsEn: string[] = [];
  const scoldsTa: string[] = [];
  const tanglishScoldChunks: Array<{ lang: 'en' | 'ta'; text: string }> = [];

  if (!summary.workoutCompleted) {
    scoldsEn.push(
      `Now for the harsh reality, ${firstName}. You skipped your workout today. There were twenty-four full hours on the clock, and you couldn't dedicate forty-five minutes to your own physical vessel? Excuses do not build stamina, and they certainly will not build muscle. That was pure procrastination.`
    );
    scoldsTa.push(
      `இப்ப கசப்பான உண்மைக்கு வருவோம் ${firstName}. இன்னைக்கு உடற்பயிற்சியை முழுசா கோட்டை விட்டுட்டீங்க! நாள் முழுக்க இருபத்து நான்கு மணி நேரம் இருந்துச்சு, உடம்பை பார்த்துக்க ஒரு நாற்பத்தைந்து நிமிஷம் ஒதுக்க முடியலையா? சாக்குபோக்கு சொன்னா உடம்பு ஏறாது, இது சுத்த சோம்பேறித்தனம்!`
    );
    tanglishScoldChunks.push(
      {
        lang: 'en',
        text: `Now for the harsh reality, ${firstName}. You completely skipped your workout today!`,
      },
      {
        lang: 'ta',
        text: `நாள் முழுக்க இருபத்து நான்கு மணி நேரம் இருந்துச்சு, ஆனா உடம்பை பார்த்துக்க ஒரு முக்கால் மணி நேரம் ஒதுக்க முடியலையா? சாக்குபோக்கு சொன்னா உடம்பு ஏறாது, இது சுத்த சோம்பேறித்தனம்!`,
      }
    );
  }

  if (summary.waterPercent < 60) {
    scoldsEn.push(
      `Your hydration was pitiful today — only ${summary.waterMl} milliliters logged. How do you expect your muscles to recover, your joints to stay lubricated, and your brain to function when you are dehydrating your system?`
    );
    scoldsTa.push(
      `அப்புறம் இந்த தண்ணீர் அளவு. வெறும் ${summary.waterMl} மில்லி தான் குடிச்சிருக்கீங்க! உடம்புல நீர்ச்சத்து இல்லாம தசை எப்படி வளரும்? தாகம் எடுக்கும் போது மட்டும் தண்ணி குடிக்கிறது தப்பு!`
    );
    tanglishScoldChunks.push(
      {
        lang: 'en',
        text: `And what happened to your water intake? Barely ${summary.waterMl} ml logged today!`,
      },
      {
        lang: 'ta',
        text: `கொஞ்சம் கூட தண்ணி குடிக்கல, உடம்புல நீர்ச்சத்து இல்லாம தசை எப்படி தேறும்? நாளைக்கு இப்படி ஏமாத்தக் கூடாது, சரியா?`,
      }
    );
  }

  if (summary.steps < 5000 && summary.steps > 0) {
    scoldsEn.push(
      `Only ${summary.steps.toLocaleString()} steps today? You basically lived in your chair. Sedentary habits destroy metabolic momentum.`
    );
    scoldsTa.push(
      `இன்னைக்கு வெறும் ${summary.steps.toLocaleString()} அடிகள் தானா? நாற்காலியிலேயே உட்கார்ந்து நாளை கழிச்சுட்டீங்களா? கொஞ்சம் கூட நடக்க மாட்டேன்னு அடம் பிடிக்கிறீங்களா?`
    );
    tanglishScoldChunks.push(
      {
        lang: 'en',
        text: `Only ${summary.steps.toLocaleString()} steps today? You were glued to your chair all day bro.`,
      },
      {
        lang: 'ta',
        text: `வாக்கிங்கும் சுத்தமா போகல. இப்படியே இருந்தா மெட்டபாலிசம் ஸ்லோ ஆயிடும், கொஞ்சம் எந்திரிச்சு நடங்க!`,
      }
    );
  }

  if (summary.caloriesConsumed > summary.targetCalories + 300) {
    scoldsEn.push(
      `You overshot your caloric maintenance baseline by ${Math.round(summary.caloriesConsumed - summary.targetCalories)} calories. Mindless eating will quickly undo your discipline if you don't control the fork.`
    );
    scoldsTa.push(
      `உங்களோட கலோரி அளவை விட ${Math.round(summary.caloriesConsumed - summary.targetCalories)} கலோரி அதிகமா சாப்பிட்டிருக்கீங்க. கண்டதை தின்னா அப்புறம் ஃபிட்னஸ் எப்படி வரும்? நாவடக்கம் ரொம்ப முக்கியம்!`
    );
    tanglishScoldChunks.push(
      {
        lang: 'en',
        text: `You overshot your maintenance calories by ${Math.round(summary.caloriesConsumed - summary.targetCalories)} calories!`,
      },
      {
        lang: 'ta',
        text: `கண்டதை சாப்பிட்டு உடம்பை கெடுத்துக்காதீங்க, ஃபுட் கன்ட்ரோல் ரொம்ப முக்கியம்!`,
      }
    );
  } else if (summary.caloriesConsumed > 0 && summary.caloriesConsumed < summary.targetCalories - 450 && !summary.isFasting) {
    scoldsEn.push(
      `You undereaten by ${Math.abs(summary.calorieDelta)} calories today. Starving your body starves muscle repair.`
    );
    scoldsTa.push(
      `தேவையான அளவை விட ${Math.abs(summary.calorieDelta)} கலோரி கம்மியா சாப்பிட்டு பட்டினி கிடந்திருக்கீங்க. போதுமான சத்து இல்லாம உடம்பு எப்படி தேறும்?`
    );
    tanglishScoldChunks.push(
      {
        lang: 'en',
        text: `You undereaten by ${Math.abs(summary.calorieDelta)} calories today.`,
      },
      {
        lang: 'ta',
        text: `பட்டினி கிடந்தா மசில் வளராது. உடம்புக்கு தேவையான ஊட்டச்சத்தை கரெக்டா கொடுக்கணும்!`,
      }
    );
  }

  const escapedScold = scoldsEn.length === 0;
  let scoldTextEn = '';
  let scoldTextTa = '';

  if (escapedScold) {
    scoldTextEn = `Honestly, ${firstName}? I came prepared to give you a ruthless coach grilling tonight. But looking at your daily logs, you executed your targets cleanly. You escaped my scolding tonight — don't let it go to your head, because tomorrow sets a brand new standard.`;
    scoldTextTa = `உண்மையை சொல்லனும்னா ${firstName}, இன்னைக்கு உங்களை கண்டபடி திட்டலாம்னு தான் வந்தேன். ஆனா உங்களோட தினசரி ரெக்கார்டை பார்த்தா எல்லா இலக்கையும் கச்சிதமா முடிச்சுட்டீங்க! இன்னைக்கு என்கிட்ட இருந்து தப்பிச்சுட்டீங்க, ஆனா தலைக்கனம் ஏறிடக்கூடாது!`;
    tanglishScoldChunks.push(
      {
        lang: 'en',
        text: `Honestly, ${firstName}? I came ready to give you a serious coach reality check tonight.`,
      },
      {
        lang: 'ta',
        text: `ஆனா உங்களோட லாக்கைப் பார்த்தா, எல்லா டார்கெட்டையும் பக்காவா முடிச்சுட்டீங்க! இன்னைக்கு என்கிட்ட இருந்து தப்பிச்சுட்டீங்க.`,
      },
      {
        lang: 'en',
        text: `Don't get complacent though, because tomorrow morning the grind resets!`,
      }
    );
  } else {
    scoldTextEn = scoldsEn.join(' ');
    scoldTextTa = scoldsTa.join(' ');
  }

  // =========================================================================
  // 3. TOMORROW'S MOTIVATION
  // =========================================================================
  const motivationTextEn = `Whatever happened today is now written in the books. Good or bad, yesterday cannot be changed. Tomorrow morning at six A.M., the alarm rings and you have a completely fresh slate to dominate your routine. Fix your mind on execution.`;
  const motivationTextTa = `இன்னைக்கு நடந்தது முடிஞ்சு போச்சு. நல்லதோ கெட்டதோ, தூங்கி எந்திரிச்சா ஒரு புது அத்தியாயம். நாளைக்கு காலைல ஆறு மணிக்கு அலாரம் அடிக்கும் போது எவ்வித தயக்கமும் இல்லாம புத்துணர்ச்சியோட களத்துல இறங்கணும்!`;
  const tanglishMotivationChunks: Array<{ lang: 'en' | 'ta'; text: string }> = [
    {
      lang: 'en',
      text: `Whatever happened today is in the past now. Good or bad, yesterday cannot be changed.`,
    },
    {
      lang: 'ta',
      text: `நாளைக்கு காலைல ஆறு மணிக்கு அலாரம் அடிக்கும் போது, சலிக்காம புத்துணர்ச்சியோட எந்திரிங்க!`,
    },
    {
      lang: 'en',
      text: `Fix your mind on clean execution from the moment you open your eyes.`,
    },
  ];

  // =========================================================================
  // 4. WIND-DOWN & SLEEP BLACKOUT COMMAND
  // =========================================================================
  const windDownTextEn = `Now, follow this final command: put your phone down immediately. Do not scroll reels. Do not check social media. The screen is powering down into pitch-black recovery mode right now. Close your eyes, breathe deeply, and give your body the deep sleep it needs. Goodnight, champion.`;
  const windDownTextTa = `இப்ப நான் சொல்றத ஒழுங்கா கேளுங்க. போனை உடனே கீழே வைங்க. தேவையில்லாம போனை நோண்டிட்டு நேரத்தை வீணாக்காதீங்க. ஸ்க்ரீன் இப்பவே முழுசா ஆஃப் ஆகுது. கண்ணை மூடி ஆழ்ந்த தூக்கத்துக்கு போங்க. குட் நைட், நாளைக்கு பாப்போம்!`;
  const tanglishWindDownChunks: Array<{ lang: 'en' | 'ta'; text: string }> = [
    {
      lang: 'en',
      text: `Alright, time to rest now. Follow this final command: put your phone down immediately.`,
    },
    {
      lang: 'ta',
      text: `தேவையில்லாம ரீல்ஸ் பாத்துட்டு நேரத்தை வீணாக்காதீங்க. ஸ்க்ரீன் இப்பவே முழுசா ஆஃப் ஆகுது.`,
    },
    {
      lang: 'en',
      text: `Close your eyes, breathe deep, and get some restorative sleep. Goodnight ${firstName}!`,
    },
  ];

  const segments: DebriefSegmentItem[] = [
    {
      id: 'achievement',
      category: 'achievement',
      titleEn: 'Daily Achievements & Praise',
      titleTa: 'இன்றைய சாதனைகள் & பாராட்டு',
      badge: 'Praise & Victories',
      badgeColor: 'emerald',
      textEn: praiseTextEn,
      textTa: praiseTextTa,
      tanglishChunks: tanglishAchievementChunks,
    },
    {
      id: 'scold',
      category: 'scold',
      titleEn: escapedScold ? 'Coach Inspection: Escaped!' : 'The Coach Scold: Reality Check',
      titleTa: escapedScold ? 'பயிற்சியாளர் பார்வை: தப்பித்தீர்!' : 'கண்டிப்பான பயிற்சியாளர் ஆய்வு',
      badge: escapedScold ? '100% Target Escaped' : 'Coach Tough-Love',
      badgeColor: escapedScold ? 'cyan' : 'amber',
      textEn: scoldTextEn,
      textTa: scoldTextTa,
      tanglishChunks: tanglishScoldChunks,
    },
    {
      id: 'motivation',
      category: 'motivation',
      titleEn: "Tomorrow's Mindset Reset",
      titleTa: 'நாளைய விடியல் உந்துதல்',
      badge: '6:00 AM Reset',
      badgeColor: 'purple',
      textEn: motivationTextEn,
      textTa: motivationTextTa,
      tanglishChunks: tanglishMotivationChunks,
    },
    {
      id: 'windDown',
      category: 'windDown',
      titleEn: 'Sleep Protocol & Screen-Off',
      titleTa: 'இரவு உறக்கம் & திரை அணைப்பு',
      badge: 'Sleep Blackout',
      badgeColor: 'cyan',
      textEn: windDownTextEn,
      textTa: windDownTextTa,
      tanglishChunks: tanglishWindDownChunks,
    },
  ];

  return {
    userName: firstName,
    date: summary.date,
    escapedScold,
    segments,
  };
}

export interface SpeakDebriefCallbacks {
  onSegmentStart?: (segment: DebriefSegmentItem, isTamil: boolean) => void;
  onSentence?: (sentence: string, isTamil: boolean) => void;
  onComplete?: () => void;
  onError?: (err: unknown) => void;
}

// Global active session & lock state
let activeSpeechLock = false;
let currentSpeechSessionId = 0;

/**
 * Halts any active debrief voice speech synthesis immediately
 */
export function stopNightDebriefSpeech(): void {
  activeSpeechLock = false;
  currentSpeechSessionId++;
  stopAllVoiceSpeech();
}

/**
 * Executes the sequential, natural human-like voice synthesis pipeline for the debrief.
 * 
 * Rules:
 * - 'en': Speaks 100% in fluent English from start to finish. Spoken once.
 * - 'ta': Speaks 100% in authentic spoken Tamil (Peccu Tamil). Spoken once.
 * - 'both': Speaks in seamless Tanglish code-switching in a single continuous pass. Spoken once.
 */
export async function speakNightDebrief(
  script: DebriefScript,
  language: NightDebriefLanguage = 'both',
  callbacks: SpeakDebriefCallbacks = {}
): Promise<void> {
  if (typeof window === 'undefined') {
    callbacks.onComplete?.();
    return;
  }

  // 1. Strict execution lock & cancel prior speech session
  stopNightDebriefSpeech();
  const sessionId = ++currentSpeechSessionId;
  activeSpeechLock = true;

  // 2. Await asynchronous voice loading
  const voices = await loadVoices();

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  // Helper chunk executor with session lock guard
  const speakSafeChunk = async (
    text: string,
    lang: 'en' | 'ta',
    rate = 0.96,
    pitch = 1.02
  ): Promise<void> => {
    if (sessionId !== currentSpeechSessionId || !activeSpeechLock) return;
    await speakChunk(text, lang, {
      rate,
      pitch,
      voices,
    });
  };

  try {
    for (let segIdx = 0; segIdx < script.segments.length; segIdx++) {
      if (sessionId !== currentSpeechSessionId || !activeSpeechLock) break;
      const segment = script.segments[segIdx];
      const isWindDown = segment.category === 'windDown';
      // Calm, warm cadence: 0.96 for normal, 0.92 for wind-down; pitch 1.02 for motivation, 0.96 for wind-down
      const segRate = isWindDown ? 0.92 : 0.96;
      const segPitch = isWindDown ? 0.96 : 1.02;

      callbacks.onSegmentStart?.(segment, language === 'ta');

      if (language === 'en') {
        // Mode 1: English Only - 100% natural conversational Indian-English
        const sentences = splitIntoSentences(segment.textEn);
        for (const sentence of sentences) {
          if (sessionId !== currentSpeechSessionId || !activeSpeechLock) break;
          callbacks.onSentence?.(sentence, false);
          await speakSafeChunk(sentence, 'en', segRate, segPitch);
          await delay(200); // Natural breath pause
        }
      } else if (language === 'ta') {
        // Mode 2: Tamil Only - 100% authentic spoken Tamil (Peccu Tamil)
        const sentences = splitIntoSentences(segment.textTa);
        for (const sentence of sentences) {
          if (sessionId !== currentSpeechSessionId || !activeSpeechLock) break;
          callbacks.onSentence?.(sentence, true);
          await speakSafeChunk(sentence, 'ta', segRate, segPitch);
          await delay(200); // Natural breath pause
        }
      } else if (language === 'tanglish') {
        // Mode 3: Tanglish - Single unified conversational flow with alternating neural voices
        const chunks = segment.tanglishChunks && segment.tanglishChunks.length > 0
          ? segment.tanglishChunks
          : [
              { lang: 'en-IN' as const, text: segment.textEn },
              { lang: 'ta-IN' as const, text: segment.textTa },
            ];

        for (const chunk of chunks) {
          if (sessionId !== currentSpeechSessionId || !activeSpeechLock) break;
          const normLang = normalizeLanguageTag(chunk.lang);
          const isChunkTa = normLang === 'ta';
          callbacks.onSegmentStart?.(segment, isChunkTa);

          const sentences = splitIntoSentences(chunk.text);
          for (const sentence of sentences) {
            if (sessionId !== currentSpeechSessionId || !activeSpeechLock) break;
            callbacks.onSentence?.(sentence, isChunkTa);
            await speakSafeChunk(sentence, normLang, segRate, segPitch);
            await delay(160); // Micro-pause between sentences
          }
          await delay(120); // Micro-pause between code-switch chunks
        }
      } else {
        // Mode 4: Both (English + Tamil) - Speaks full natural English first, then full Spoken Tamil
        // Phase 1: Natural English
        callbacks.onSegmentStart?.(segment, false);
        const sentencesEn = splitIntoSentences(segment.textEn);
        for (const sentence of sentencesEn) {
          if (sessionId !== currentSpeechSessionId || !activeSpeechLock) break;
          callbacks.onSentence?.(sentence, false);
          await speakSafeChunk(sentence, 'en', segRate, segPitch);
          await delay(200);
        }

        await delay(350); // Natural transition pause between English and Tamil

        // Phase 2: Authentic Spoken Tamil
        callbacks.onSegmentStart?.(segment, true);
        const sentencesTa = splitIntoSentences(segment.textTa);
        for (const sentence of sentencesTa) {
          if (sessionId !== currentSpeechSessionId || !activeSpeechLock) break;
          callbacks.onSentence?.(sentence, true);
          await speakSafeChunk(sentence, 'ta', segRate, segPitch);
          await delay(200);
        }
      }

      await delay(250); // Pause between major pillars
    }

    if (sessionId === currentSpeechSessionId && activeSpeechLock) {
      activeSpeechLock = false;
      callbacks.onComplete?.();
    }
  } catch (err) {
    console.warn('Debrief speech error:', err);
    if (sessionId === currentSpeechSessionId) {
      callbacks.onError?.(err);
      callbacks.onComplete?.();
    }
  }
}
