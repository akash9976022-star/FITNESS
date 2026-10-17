/**
 * FitMaintenance AI - Ultra-Natural Conversational Voice & Script Engine
 * 
 * Capabilities:
 * 1. Generates ultra-human conversational spoken scripts via Google Gemini (@google/genai, gemini-2.5-flash).
 * 2. Strict Persona: Akash's close friend, personal fitness coach, and accountability partner.
 * 3. Speech Formatting: Natural conversational fillers ("Hey", "Listen", "பாருங்க", "சூப்பர் ப்ரோ"),
 *    contractions ("you've", "let's", "didn't"), ellipses (...) for breathing pauses, exclamation marks.
 * 4. 4 Distinct Language Modes:
 *    - Mode 1: 'en' -> Natural Indian-English
 *    - Mode 2: 'ta' -> Authentic Spoken Tamil (Peccu Tamil / பேச்சுத் தமிழ் — NOT Textbook Senthamizh)
 *    - Mode 3: 'tanglish' -> Natural Mixed Tamil + English in a single flow (alternating en-IN & ta-IN chunks)
 *    - Mode 4: 'both' -> Full natural English version first, followed cleanly by full Spoken Tamil version
 * 5. Instant Dynamic Offline Fallback: Zero latency, zero errors when offline or API key absent.
 */

import { GoogleGenAI } from '@google/genai';
import type { DailyPerformanceSummary, VoiceLanguageMode } from './firestoreService';
import type { DebriefScript, DebriefSegmentItem } from '../utils/nightDebriefEngine';

export interface SpokenChunk {
  lang: 'en-IN' | 'ta-IN' | 'en' | 'ta';
  text: string;
}

export interface GeneratedDebriefPillars {
  achievements: {
    en: string;
    ta: string;
    tanglish: SpokenChunk[];
  };
  scold: {
    en: string;
    ta: string;
    tanglish: SpokenChunk[];
  };
  motivation: {
    en: string;
    ta: string;
    tanglish: SpokenChunk[];
  };
  windDown: {
    en: string;
    ta: string;
    tanglish: SpokenChunk[];
  };
}

const getApiKey = (): string => {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
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
    // Ignored
  }
  return '';
};

let aiClient: GoogleGenAI | null = null;
let cachedKey = '';

function getClient(): GoogleGenAI | null {
  const key = getApiKey();
  if (!key) return null;
  if (!aiClient || cachedKey !== key) {
    try {
      aiClient = new GoogleGenAI({ apiKey: key });
      cachedKey = key;
    } catch {
      return null;
    }
  }
  return aiClient;
}

// In-memory session cache for today's debrief script to conserve tokens
const debriefCache = new Map<string, DebriefScript>();

/**
 * Builds high-quality, ultra-natural human conversational offline fallback scripts
 * strictly following friend/coach persona, contractions, fillers, and spoken Tamil.
 */
export function buildConversationalOfflinePillars(
  summary: DailyPerformanceSummary,
  userName = 'Akash'
): GeneratedDebriefPillars {
  const firstName = (userName || 'Akash').trim().split(' ')[0];

  // 1. ACHIEVEMENTS
  const achEn: string[] = [];
  const achTa: string[] = [];
  const achTanglish: SpokenChunk[] = [];

  if (summary.workoutCompleted) {
    const workoutLabel = summary.workoutNames?.[0] || "today's session";
    achEn.push(`You absolutely crushed ${workoutLabel}! Showing up and putting in the hard work... that's how champions are made.`);
    achTa.push(`இன்னைக்கு ஒர்க்அவுட்டை வேற லெவல்ல முடிச்சிருக்கீங்க! சோம்பேறித்தனம் பாக்காம போய் ஜிம்ல மாஸ் காட்டிட்டீங்க, செம கெத்து ப்ரோ!`);
    achTanglish.push(
      { lang: 'en-IN', text: `Hey ${firstName}! Honestly, great job crushing your workout today!` },
      { lang: 'ta-IN', text: `ஒர்க்அவுட் வேற லெவல் ப்ரோ, உண்மையாவே சூப்பரா பண்ணிருக்கீங்க!` }
    );
  }

  if (summary.waterPercent >= 80) {
    achEn.push(`Hydration was spot on... over ${summary.waterMl} milliliters logged! Your muscles and brain are thanking you.`);
    achTa.push(`தண்ணீரும் கரெக்டா குடிச்சு உடம்பை ஃப்ரெஷ்ஷா வச்சிருக்கீங்க. உடம்புல தண்ணி நல்லா இருந்தா தான் எனர்ஜி கூடும்!`);
    achTanglish.push(
      { lang: 'en-IN', text: `And hydration was on point with ${summary.waterMl} ml logged!` },
      { lang: 'ta-IN', text: `தண்ணீர் கரெக்டா குடிச்சிருக்கீங்க, பாடி நல்லா ஃப்ரெஷ்ஷா இருக்கும்.` }
    );
  }

  if (summary.streakCount > 1) {
    achEn.push(`Your consistency streak is now locked at ${summary.streakCount} days! That's real dedication, ${firstName}.`);
    achTa.push(`ஸ்ட்ரீக் வேற தொடர்ந்து ${summary.streakCount} நாளா போயிட்டே இருக்கு! இந்த விடாமுயற்சியை மட்டும் விட்றாதீங்க.`);
    achTanglish.push(
      { lang: 'en-IN', text: `Your streak is locked at ${summary.streakCount} days straight.` },
      { lang: 'ta-IN', text: `இந்த விடாமுயற்சி தான் ப்ரோ நிஜமான வெற்றி!` }
    );
  }

  if (achEn.length === 0) {
    achEn.push(`You showed up for your nightly review... and showing up for honest accountability is where real transformation starts.`);
    achTa.push(`இன்னைக்கு இந்த நைட் ரிவ்யூக்கு வந்து நின்னதே நல்ல விஷயம்தான். இந்த சுய ஒழுக்கம் தான் உங்களை மாத்தும்.`);
    achTanglish.push(
      { lang: 'en-IN', text: `Hey ${firstName}, good to see you showing up for your nightly debrief!` },
      { lang: 'ta-IN', text: `இன்னைக்கு வந்து ரிவ்யூ பண்றதே நல்ல சுய கட்டுப்பாடு தான்.` }
    );
  }

  // 2. THE SCOLD (COACH TOUGH-LOVE)
  const scoldEn: string[] = [];
  const scoldTa: string[] = [];
  const scoldTanglish: SpokenChunk[] = [];
  let escapedScold = true;

  if (!summary.workoutCompleted) {
    escapedScold = false;
    scoldEn.push(`Now listen bro... you skipped your workout today! There were twenty-four full hours on the clock, and you couldn't dedicate forty-five minutes to your own health? Excuses don't build muscle!`);
    scoldTa.push(`இப்ப விஷயத்துக்கு வருவோம் ${firstName}... இன்னைக்கு ஒர்க்அவுட்டுக்கு போகாம எஸ்கேப் ஆயிட்டீங்க! நாள் முழுக்க என்ன பண்ணீங்க? உடம்பை பாத்துக்க ஒரு அரை மணி நேரம் கூட ஒதுக்க முடியலையா? சாக்குபோக்கு சொன்னா உடம்பு ஏறாது, இது சுத்த சோம்பேறித்தனம் ப்ரோ!`);
    scoldTanglish.push(
      { lang: 'en-IN', text: `Now for the hard truth, ${firstName}. You skipped your workout today!` },
      { lang: 'ta-IN', text: `நாள் முழுக்க டைம் இருந்துச்சு, ஆனா ஒர்க்அவுட் பண்ண ஒரு அரை மணி நேரம் ஒதுக்க முடியலையா? சாக்குபோக்கு சொன்னா உடம்பு ஏறாது!` }
    );
  }

  if (summary.waterPercent < 60) {
    escapedScold = false;
    scoldEn.push(`And what happened to your water intake? Barely ${summary.waterMl} ml logged! How do you expect your muscles to recover when you're dehydrating your body?`);
    scoldTa.push(`அப்புறம் இந்த தண்ணி குடிக்கிற விஷயம்... வெறும் ${summary.waterMl} மில்லி தான் குடிச்சிருக்கீங்க! உடம்புல தண்ணி இல்லாம மசில் எப்படி வளரும்? நாளைக்கு ஒழுங்கா தண்ணி குடிக்கணும், சரியா?`);
    scoldTanglish.push(
      { lang: 'en-IN', text: `And what's with your water intake? Barely ${summary.waterMl} ml logged!` },
      { lang: 'ta-IN', text: `கொஞ்சம் கூட தண்ணி குடிக்கல, உடம்புல தண்ணி இல்லாம தசை எப்படி தேறும்? நாளைக்கு இப்படி விடக்கூடாது, சரியா?` }
    );
  }

  if (summary.steps < 4000 && summary.steps > 0) {
    escapedScold = false;
    scoldEn.push(`Only ${summary.steps.toLocaleString()} steps today? You basically lived in your chair. Sedentary habits destroy metabolic momentum.`);
    scoldTa.push(`இன்னைக்கு வெறும் ${summary.steps.toLocaleString()} ஸ்டெப்ஸ் தானா? சேர்லயே உட்கார்ந்து நாளை கழிச்சுட்டீங்களா? வாக்கிங் போகாம சோம்பேறியா இருந்தா எப்படி? கொஞ்சம் எந்திரிச்சு நடங்க ப்ரோ!`);
    scoldTanglish.push(
      { lang: 'en-IN', text: `Only ${summary.steps.toLocaleString()} steps today? You were glued to your chair all day bro!` },
      { lang: 'ta-IN', text: `வாக்கிங்கும் சுத்தமா போகல, கொஞ்சம் எந்திரிச்சு நடந்து ஆக்டிவா இருங்க!` }
    );
  }

  if (escapedScold) {
    scoldEn.push(`Honestly ${firstName}... you hit all your major targets today! You escaped a scolding tonight. Keep this exact fire burning tomorrow!`);
    scoldTa.push(`உண்மையை சொல்லனும்னா ${firstName}... இன்னைக்கு எல்லா டார்கெட்டையும் பக்காவா முடிச்சுட்டீங்க! இன்னைக்கு என்கிட்ட திட்டு வாங்காம எஸ்கேப் ஆயிட்டீங்க. இதே வேகத்தோட நாளைக்கும் கலக்கணும், சரியா?`);
    scoldTanglish.push(
      { lang: 'en-IN', text: `Honestly ${firstName}, you hit all your main targets today!` },
      { lang: 'ta-IN', text: `இன்னைக்கு என் கிட்ட திட்டு வாங்காம தப்பிச்சிட்டீங்க! இதே வேகத்தோட நாளைக்கும் கலக்கணும்.` }
    );
  }

  // 3. TOMORROW RESET (MOTIVATION)
  const motEn = `Tomorrow is a brand new page, ${firstName}. When that alarm goes off at 6:00 AM, hit the ground running with zero excuses. Hydrate early, lock into your nutrition, and let's dominate the day!`;
  const motTa = `சரி ${firstName}, இன்னைக்கு நடந்தது முடிஞ்சு போச்சு! நாளைக்கு ஒரு புது நாளு... காலைல ஆறு மணிக்கு அலாரம் அடிச்சதும் சோம்பேறித்தனம் பாக்காம சட்டுனு எந்திரிங்க! எந்திரிச்சு ஒரு கிளாஸ் தண்ணி குடிச்சிட்டு, வெறித்தனமா களத்துல இறங்குங்க... நாளைக்கு நம்ம டே!`;
  const motTanglish: SpokenChunk[] = [
    { lang: 'en-IN', text: `Tomorrow is a brand new clean slate, ${firstName}.` },
    { lang: 'ta-IN', text: `காலைல அலாரம் அடிச்சதும் சோம்பேறித்தனம் படாம எந்திரிங்க, நாளைக்கு முழு எனர்ஜியோட கலக்கலாம்!` },
    { lang: 'en-IN', text: `Hydrate early and let's crush tomorrow with full consistency!` },
  ];

  // 4. SCREEN-OFF WIND-DOWN
  const windEn = `Alright, debrief complete. It is time for sleep blackout protocol. Put your phone away, dim the lights, and let your body recover with deep restorative sleep. Goodnight!`;
  const windTa = `மணி ஆச்சு ப்ரோ... முதல்ல போனை ஓரமா வையிங்க! இந்த ரீல்ஸ் பாக்குற வேலையெல்லாம் அப்புறம் பாத்துக்கலாம். ஸ்க்ரீன் இப்பவே ஆஃப் ஆகுது. கண்ணை மூடி நிம்மதியா தூங்குங்க... நல்லா தூங்கினா தான் உடம்பு தேறும். குட் நைட் ${firstName}, நாளைக்கு பாப்போம்!`;
  const windTanglish: SpokenChunk[] = [
    { lang: 'en-IN', text: `Alright, review is done. Time for screen-off sleep blackout.` },
    { lang: 'ta-IN', text: `போனை ஓரமா வச்சிட்டு நிம்மதியா தூங்குங்க. உடம்பு நல்லா ரெஸ்ட் எடுத்தா தான் நாளைக்கு பவர்ஃபுல்லா இருக்க முடியும்.` },
    { lang: 'en-IN', text: `Sleep tight and recharge for tomorrow. Goodnight bro!` },
  ];

  return {
    achievements: {
      en: `Good evening ${firstName}! Let's review what you accomplished today. ${achEn.join(' ')}`,
      ta: `ஹலோ ${firstName} ப்ரோ! இன்னைக்கு நீங்க என்னெல்லாம் கலக்கிருக்கீங்கனு பாக்கலாமா? ${achTa.join(' ')}`,
      tanglish: achTanglish,
    },
    scold: {
      en: scoldEn.join(' '),
      ta: scoldTa.join(' '),
      tanglish: scoldTanglish,
    },
    motivation: {
      en: motEn,
      ta: motTa,
      tanglish: motTanglish,
    },
    windDown: {
      en: windEn,
      ta: windTa,
      tanglish: windTanglish,
    },
  };
}

/**
 * Dynamically generates personalized debrief pillars via Gemini 2.5 Flash,
 * with instant fallback to human-crafted offline coach scripts.
 */
export async function generateAiNightDebriefScript(
  summary: DailyPerformanceSummary,
  userName = 'Akash'
): Promise<DebriefScript> {
  const cacheKey = `${summary.date}_${userName}_${summary.workoutCompleted}_${summary.waterMl}_${summary.steps}`;
  if (debriefCache.has(cacheKey)) {
    return debriefCache.get(cacheKey)!;
  }

  const offlinePillars = buildConversationalOfflinePillars(summary, userName);
  const client = getClient();

  let finalPillars = offlinePillars;

  if (client) {
    const prompt = `You are Akash's close friend, personal fitness coach, and accountability partner in the FitMaintenance AI app.
Review his performance data today (${summary.date}) and write a warm, expressive, ultra-human spoken debrief with natural breathing pauses (...) and emotional intonation:

TODAY'S LOGS:
- User Name: ${userName}
- Workout Completed: ${summary.workoutCompleted ? `YES (${summary.workoutNames?.[0] || 'Completed session'})` : 'NO (MISSED WORKOUT)'}
- Calories: ${summary.caloriesConsumed} kcal / Target: ${summary.targetCalories} kcal
- Protein: ${summary.proteinGrams}g / Target: ${summary.proteinTargetGrams}g
- Hydration: ${summary.waterMl} ml / Target: ${summary.waterTargetMl} ml (${summary.waterPercent}% achieved)
- Steps: ${summary.steps} / Target: ${summary.goalSteps}
- Current Consistency Streak: ${summary.streakCount} days

RULES:
1. Tone: Warm, energetic friend + strict loving coach. Use natural fillers ("Hey", "Listen", "பாருங்க", "சூப்பர் ப்ரோ"), contractions ("you've", "let's", "didn't"), ellipses (...) for micro-pauses, exclamation marks.
2. English (en): 100% natural Indian-English conversational speech.
3. Tamil (ta): 100% authentic spoken Tamil (Peccu Tamil / பேச்சுத் தமிழ்). NEVER use formal Senthamizh.
4. Tanglish: Return a JSON array of alternating short chunks [ { "lang": "en-IN", "text": "..." }, { "lang": "ta-IN", "text": "..." } ] code-switching naturally in a single conversational flow.
5. Escaped Scold: If he hit 100% of his goals, playfully tell him he escaped a scolding tonight!

Return strictly valid JSON with this structure:
{
  "achievements": { "en": "...", "ta": "...", "tanglish": [ { "lang": "en-IN", "text": "..." }, { "lang": "ta-IN", "text": "..." } ] },
  "scold": { "en": "...", "ta": "...", "tanglish": [ ... ] },
  "motivation": { "en": "...", "ta": "...", "tanglish": [ ... ] },
  "windDown": { "en": "...", "ta": "...", "tanglish": [ ... ] }
}`;

    const candidateModels = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];

    for (const model of candidateModels) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.75,
            responseMimeType: 'application/json',
          },
        });

        if (response?.text) {
          const parsed = JSON.parse(response.text);
          if (parsed.achievements && parsed.scold && parsed.motivation && parsed.windDown) {
            finalPillars = parsed;
            break;
          }
        }
      } catch (err) {
        console.warn(`Gemini debrief generation with ${model} failed, trying fallback:`, err);
      }
    }
  }

  const escapedScold =
    summary.workoutCompleted &&
    summary.waterPercent >= 80 &&
    summary.steps >= 6000 &&
    summary.caloriesConsumed <= summary.targetCalories + 250;

  const segments: DebriefSegmentItem[] = [
    {
      id: 'achievement',
      category: 'achievement',
      titleEn: "Today's Victories & Wins",
      titleTa: 'இன்றைய சாதனைகள்',
      badge: 'Coach Praise',
      badgeColor: 'emerald',
      textEn: finalPillars.achievements.en,
      textTa: finalPillars.achievements.ta,
      tanglishChunks: finalPillars.achievements.tanglish,
    },
    {
      id: 'scold',
      category: 'scold',
      titleEn: 'Honest Reality & Scold',
      titleTa: 'கசப்பான உண்மை & கண்டிப்பு',
      badge: escapedScold ? '100% Target Escaped' : 'Coach Tough-Love',
      badgeColor: escapedScold ? 'cyan' : 'amber',
      textEn: finalPillars.scold.en,
      textTa: finalPillars.scold.ta,
      tanglishChunks: finalPillars.scold.tanglish,
    },
    {
      id: 'motivation',
      category: 'motivation',
      titleEn: "Tomorrow's Mindset Reset",
      titleTa: 'நாளைய விடியல் உந்துதல்',
      badge: '6:00 AM Reset',
      badgeColor: 'purple',
      textEn: finalPillars.motivation.en,
      textTa: finalPillars.motivation.ta,
      tanglishChunks: finalPillars.motivation.tanglish,
    },
    {
      id: 'windDown',
      category: 'windDown',
      titleEn: 'Sleep Protocol & Screen-Off',
      titleTa: 'இரவு உறக்கம் & திரை அணைப்பு',
      badge: 'Sleep Blackout',
      badgeColor: 'cyan',
      textEn: finalPillars.windDown.en,
      textTa: finalPillars.windDown.ta,
      tanglishChunks: finalPillars.windDown.tanglish,
    },
  ];

  const script: DebriefScript = {
    userName: (userName || 'Akash').trim().split(' ')[0],
    date: summary.date,
    escapedScold,
    segments,
  };

  debriefCache.set(cacheKey, script);
  return script;
}

/**
 * Returns conversational routine reminder spoken phrases in the 4 language modes
 * with natural human cadence, zero raw symbols/digits, and colloquial Peccu Tamil / Tanglish flow.
 */
export function getConversationalRoutinePhrase(
  routineType: string,
  userName = 'Akash',
  mode: VoiceLanguageMode = 'tanglish'
): { text: string; lang: 'en' | 'ta' } {
  const firstName = (userName || 'Akash').trim().split(' ')[0];
  const typeLower = (routineType || '').toLowerCase();

  // 1. WALKING / CARDIO
  if (typeLower.includes('walk') || typeLower.includes('cardio') || typeLower.includes('steps')) {
    if (mode === 'en') {
      return { lang: 'en', text: `Hey ${firstName}, it is time for your morning walk! Step outside, breathe in the fresh air, and let's get those steps in.` };
    }
    if (mode === 'ta') {
      return { lang: 'ta', text: `ஹலோ ${firstName} ப்ரோ! வாக்கிங் போலாம் வாங்க... வெளிய போய் நல்ல காத்து வாங்கிட்டு, சுறுசுறுப்பா கொஞ்சம் நடந்துட்டு வரலாம்!` };
    }
    // Tanglish: Spoken colloquial Tamil with modern fitness loan words
    return {
      lang: 'ta',
      text: `ஹலோ ${firstName} ப்ரோ! வாக்கிங் போலாம் வாங்க... வெளிய போய் நல்ல காத்து வாங்கிட்டு, ஸ்டெப்ஸை முடிச்சிடலாம்!`,
    };
  }

  // 2. WORKOUT / STRENGTH / EXERCISE
  if (typeLower.includes('workout') || typeLower.includes('exercise') || typeLower.includes('gym') || typeLower.includes('strength')) {
    if (mode === 'en') {
      return { lang: 'en', text: `${firstName}, it is workout time! Put your gear on, hit your sets with good form, and stay consistent.` };
    }
    if (mode === 'ta') {
      return { lang: 'ta', text: `${firstName} ப்ரோ, ஒர்க்அவுட் பண்ண கிளம்புங்க! சோம்பேறித்தனம் பாக்காம போய் செட்ஸை வெறித்தனமா முடிங்க!` };
    }
    // Tanglish
    return {
      lang: 'ta',
      text: `${firstName} ப்ரோ, ஒர்க்அவுட் டைம் ஆச்சு! சோம்பேறித்தனம் பாக்காம போய் செட்ஸை வெறித்தனமா முடிங்க!`,
    };
  }

  // 3. HYDRATION / WATER
  if (typeLower.includes('hydration') || typeLower.includes('water') || typeLower.includes('தண்ணீர்')) {
    if (mode === 'en') {
      return { lang: 'en', text: `${firstName}, quick water break! Drink a fresh glass of water right now to stay fresh and energized.` };
    }
    if (mode === 'ta') {
      return { lang: 'ta', text: `ஹலோ ${firstName} ப்ரோ! உடனே ஒரு கிளாஸ் தண்ணி குடிங்க... அப்பதான் உடம்பு நல்லா ஃப்ரெஷ்ஷா எனர்ஜியா இருக்கும்!` };
    }
    // Tanglish
    return {
      lang: 'ta',
      text: `${firstName} ப்ரோ, குயிக் வாட்டர் பிரேக்! உடனே ஒரு கிளாஸ் தண்ணி குடிங்க, பாடி நல்லா ஃப்ரெஷ்ஷா இருக்கும்!`,
    };
  }

  // 4. BEDTIME / SLEEP / NIGHT
  if (typeLower.includes('bed') || typeLower.includes('sleep') || typeLower.includes('night') || typeLower.includes('தூக்கம்')) {
    if (mode === 'en') {
      return { lang: 'en', text: `Good evening ${firstName}. Time to wrap up and sleep. Put your phone away, dim the lights, and get some deep restorative rest.` };
    }
    if (mode === 'ta') {
      return { lang: 'ta', text: `மணி ஆச்சு ${firstName} ப்ரோ! போனை ஓரமா வச்சிட்டு நிம்மதியா தூங்குங்க... நல்லா தூங்கினா தான் உடம்பு தேறும். குட் நைட்!` };
    }
    // Tanglish
    return {
      lang: 'ta',
      text: `மணி ஆச்சு ${firstName} ப்ரோ! போனை ஓரமா வச்சிட்டு தூங்குங்க... நல்லா தூங்கினா தான் நாளைக்கு எனர்ஜியா இருக்க முடியும். குட் நைட்!`,
    };
  }

  // 5. MEDITATION / MINDFULNESS
  if (typeLower.includes('meditation') || typeLower.includes('mindful') || typeLower.includes('தியானம்')) {
    if (mode === 'en') {
      return { lang: 'en', text: `${firstName}, time for a few minutes of meditation. Take a few deep breaths, calm your mind, and let go of stress.` };
    }
    if (mode === 'ta') {
      return { lang: 'ta', text: `${firstName}, கொஞ்ச நேரம் அமைதியா உக்காந்து மெடிடேஷன் பண்ணுங்க... ஆழமா மூச்சு விட்டு மைண்ட்டை ரிலாக்ஸ் பண்ணுங்க.` };
    }
    // Tanglish
    return {
      lang: 'ta',
      text: `${firstName}, கொஞ்ச நேரம் அமைதியா உக்காந்து மெடிடேஷன் பண்ணுங்க... மைண்ட் நல்லா ரிலாக்ஸ் ஆகும்.` };
  }

  // 6. NUTRITION / PROTEIN MEAL
  if (typeLower.includes('protein') || typeLower.includes('nutrition') || typeLower.includes('meal') || typeLower.includes('salad') || typeLower.includes('டயட்')) {
    if (mode === 'en') {
      return { lang: 'en', text: `${firstName}, remember to drink your protein shake or have your high-protein meal to rebuild muscle.` };
    }
    if (mode === 'ta') {
      return { lang: 'ta', text: `${firstName}, ஒர்க்அவுட் முடிஞ்சதும் புரோட்டீன் ஷேக் அல்லது நல்ல சத்தான உணவை சாப்பிட மறந்துடாதீங்க ப்ரோ!` };
    }
    // Tanglish
    return {
      lang: 'ta',
      text: `${firstName}, ஒர்க்அவுட் முடிஞ்சதும் புரோட்டீன் ஷேக் அல்லது ஹை-புரோட்டீன் மீல் சாப்பிட மறந்துடாதீங்க ப்ரோ!`,
    };
  }

  // 7. READING / JOURNAL
  if (typeLower.includes('read') || typeLower.includes('journal') || typeLower.includes('book') || typeLower.includes('வாசிப்பு')) {
    if (mode === 'en') {
      return { lang: 'en', text: `Good evening ${firstName}. Take a few peaceful minutes for reading and gratitude before sleeping.` };
    }
    if (mode === 'ta') {
      return { lang: 'ta', text: `தூங்குறதுக்கு முன்னாடி கொஞ்ச நேரம் அமைதியா புக் படிச்சிட்டு மைண்ட்டை ரிலாக்ஸ் பண்ணுங்க ${firstName}.` };
    }
    // Tanglish
    return {
      lang: 'ta',
      text: `தூங்குறதுக்கு முன்னாடி கொஞ்ச நேரம் புக் படிச்சிட்டு மைண்ட்டை ரிலாக்ஸ் பண்ணுங்க ${firstName}.`,
    };
  }

  // 8. WAKE-UP (Default)
  if (mode === 'en') {
    return { lang: 'en', text: `Good morning ${firstName}! Time to wake up, drink a tall glass of water, and dominate the day!` };
  }
  if (mode === 'ta') {
    return { lang: 'ta', text: `டேய் ${firstName}! மணி ஆச்சு ப்ரோ, சீக்கிரம் எந்திரிங்க... முதல்ல ஒரு கிளாஸ் தண்ணி குடிச்சிட்டு இன்னைக்கு நாளை வெறித்தனமா ஸ்டார்ட் பண்ணலாம்!` };
  }
  // Tanglish
  return {
    lang: 'ta',
    text: `குட் மார்னிங் ${firstName}! சீக்கிரம் எந்திரிங்க ப்ரோ... முதல்ல ஒரு கிளாஸ் தண்ணி குடிச்சிட்டு, இன்னைக்கு டேவை எனர்ஜியா ஸ்டார்ட் பண்ணலாம்!`,
  };
}

