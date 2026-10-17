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
    achTa.push(`இன்னைக்கு ஒர்க்அவுட்டை வேற லெவல்ல முடிச்சிருக்கீங்க! சோம்பேறித்தனம் படாம போய் உடற்பயிற்சி பண்ணதே செம கெத்து.`);
    achTanglish.push(
      { lang: 'en-IN', text: `Hey ${firstName}! Honestly, great job crushing your workout today!` },
      { lang: 'ta-IN', text: `ஒர்க்அவுட் வேற லெவல் ப்ரோ, உண்மையாவே சூப்பரா பண்ணிருக்கீங்க!` }
    );
  }

  if (summary.waterPercent >= 80) {
    achEn.push(`Hydration was spot on... over ${summary.waterMl} milliliters logged! Your muscles and brain are thanking you.`);
    achTa.push(`தண்ணீர் அளவும் பக்காவா மெயின்டெய்ன் பண்ணிருக்கீங்க. உடம்பு நல்லா ஹைட்ரேட்டடா இருந்தா தான் எனர்ஜி கூடும்.`);
    achTanglish.push(
      { lang: 'en-IN', text: `And hydration was on point with ${summary.waterMl} ml logged!` },
      { lang: 'ta-IN', text: `தண்ணீர் கரெக்டா குடிச்சிருக்கீங்க, உடம்பு நல்லா பிரெஷ்ஷா இருக்கும்.` }
    );
  }

  if (summary.streakCount > 1) {
    achEn.push(`Your consistency streak is now locked at ${summary.streakCount} days! That's real dedication, ${firstName}.`);
    achTa.push(`தொடர்ந்து ${summary.streakCount} நாள் ஸ்ட்ரீக் மெயின்டெய்ன் பண்ணிருக்கீங்க! இந்த கட்டுப்பாடு தான் உங்களை அடுத்த கட்டத்துக்கு கொண்டு போகும்.`);
    achTanglish.push(
      { lang: 'en-IN', text: `Your streak is locked at ${summary.streakCount} days straight.` },
      { lang: 'ta-IN', text: `இந்த விடாமுயற்சி தான் ப்ரோ நிஜமான வெற்றி!` }
    );
  }

  if (achEn.length === 0) {
    achEn.push(`You showed up for your nightly review... and showing up for honest accountability is where real transformation starts.`);
    achTa.push(`இன்னைக்கு இந்த இரவு ரிவ்யூக்கு வந்து நின்னதே நல்ல தொடக்கம்தான். இந்த சுய ஒழுக்கம் தான் நாளைய மாற்றத்துக்கு விதை.`);
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
    scoldTa.push(`இப்ப விஷயத்துக்கு வருவோம் ${firstName}... இன்னைக்கு ஒர்க்அவுட்டை சுத்தமா விட்டுட்டீங்க! நாள் முழுக்க இருபத்து நான்கு மணி நேரம் இருந்துச்சு, உடம்பை பார்த்துக்க ஒரு முக்கால் மணி நேரம் ஒதுக்க முடியலையா? சாக்குபோக்கு சொன்னா உடம்பு ஏறாது ப்ரோ!`);
    scoldTanglish.push(
      { lang: 'en-IN', text: `Now for the hard truth, ${firstName}. You skipped your workout today!` },
      { lang: 'ta-IN', text: `நாள் முழுக்க டைம் இருந்துச்சு, ஆனா உடற்பயிற்சி பண்ண ஒரு நாற்பது நிமிஷம் ஒதுக்க முடியலையா? சாக்குபோக்கு சொன்னா உடம்பு ஏறாது!` }
    );
  }

  if (summary.waterPercent < 60) {
    escapedScold = false;
    scoldEn.push(`And what happened to your water intake? Barely ${summary.waterMl} ml logged! How do you expect your muscles to recover when you're dehydrating your body?`);
    scoldTa.push(`அப்புறம் இந்த தண்ணீர் விஷயம்... வெறும் ${summary.waterMl} மில்லி தான் குடிச்சிருக்கீங்க! தாகம் எடுக்கும் போது மட்டும் தண்ணி குடிக்கிறது தப்பு, உடம்புல நீர்ச்சத்து இல்லாம மசில் எப்படி வளரும்?`);
    scoldTanglish.push(
      { lang: 'en-IN', text: `And what's with your water intake? Barely ${summary.waterMl} ml logged!` },
      { lang: 'ta-IN', text: `கொஞ்சம் கூட தண்ணி குடிக்கல, உடம்புல நீர்ச்சத்து இல்லாம தசை எப்படி தேறும்? நாளைக்கு இப்படி விடக்கூடாது, சரியா?` }
    );
  }

  if (summary.steps < 4000 && summary.steps > 0) {
    escapedScold = false;
    scoldEn.push(`Only ${summary.steps.toLocaleString()} steps today? You basically lived in your chair. Sedentary habits destroy metabolic momentum.`);
    scoldTa.push(`இன்னைக்கு வெறும் ${summary.steps.toLocaleString()} அடிகள் தானா? நாற்காலியிலேயே உட்கார்ந்து நாளை கழிச்சுட்டீங்களா? கொஞ்சம் எந்திரிச்சு நடங்க ப்ரோ!`);
    scoldTanglish.push(
      { lang: 'en-IN', text: `Only ${summary.steps.toLocaleString()} steps today? You were glued to your chair all day bro!` },
      { lang: 'ta-IN', text: `வாக்கிங்கும் சுத்தமா போகல, கொஞ்சம் எந்திரிச்சு நடந்து ஆக்டிவா இருங்க!` }
    );
  }

  if (escapedScold) {
    scoldEn.push(`Honestly ${firstName}... you hit all your major targets today! You escaped a scolding tonight. Keep this exact fire burning tomorrow!`);
    scoldTa.push(`உண்மையாவே சொல்லணும்னா ${firstName}... இன்னைக்கு எல்லா டார்கெட்டையும் பக்காவா முடிச்சிட்டீங்க! இன்னைக்கு என் கிட்ட திட்டு வாங்காம தப்பிச்சிட்டீங்க. இதே உத்வேகத்தோட நாளைக்கும் தொடரணும், சரியா?`);
    scoldTanglish.push(
      { lang: 'en-IN', text: `Honestly ${firstName}, you hit all your main targets today!` },
      { lang: 'ta-IN', text: `இன்னைக்கு என் கிட்ட திட்டு வாங்காம தப்பிச்சிட்டீங்க! இதே வேகத்தோட நாளைக்கும் கலக்கணும்.` }
    );
  }

  // 3. TOMORROW RESET (MOTIVATION)
  const motEn = `Tomorrow is a brand new page, ${firstName}. When that alarm goes off at 6:00 AM, hit the ground running with zero excuses. Hydrate early, lock into your nutrition, and let's dominate the day!`;
  const motTa = `நாளைக்கு ஒரு புத்தம் புதிய நாள் ${firstName}. காலைல ஆறு மணிக்கு அலாரம் அடிக்கும் போது, ஒரு நொடி கூட யோசிக்காம எந்திரிங்க. முதல்ல தண்ணி குடிங்க, ஒர்க்அவுட்டை ஒழுங்கா பண்ணுங்க... நாளைக்கு நம்ம நாள்!`;
  const motTanglish: SpokenChunk[] = [
    { lang: 'en-IN', text: `Tomorrow is a brand new clean slate, ${firstName}.` },
    { lang: 'ta-IN', text: `காலைல அலாரம் அடிச்சதும் சோம்பேறித்தனம் படாம எந்திரிங்க, நாளைக்கு முழு எனர்ஜியோட கலக்கலாம்!` },
    { lang: 'en-IN', text: `Hydrate early and let's crush tomorrow with full consistency!` },
  ];

  // 4. SCREEN-OFF WIND-DOWN
  const windEn = `Alright, debrief complete. It is time for sleep blackout protocol. Put your phone away, dim the lights, and let your body recover with deep restorative sleep. Goodnight!`;
  const windTa = `சரி, இன்னைய ரிவ்யூ முடிஞ்சுது. இனி தூங்குற நேரம்... போனை ஒரு ஓரமா வச்சிட்டு, மனசை அமைதியாக்கி நிம்மதியா தூங்குங்க. உடம்பு நல்லா ரெஸ்ட் எடுத்தா தான் நாளைக்கு பவர்ஃபுல்லா இருக்க முடியும். குட் நைட்!`;
  const windTanglish: SpokenChunk[] = [
    { lang: 'en-IN', text: `Alright, review is done. Time for screen-off sleep blackout.` },
    { lang: 'ta-IN', text: `போனை ஓரமா வச்சிட்டு நிம்மதியா தூங்குங்க. உடம்பு நல்லா ரெஸ்ட் எடுத்தா தான் நாளைக்கு பவர்ஃபுல்லா இருக்க முடியும்.` },
    { lang: 'en-IN', text: `Sleep tight and recharge for tomorrow. Goodnight bro!` },
  ];

  return {
    achievements: {
      en: `Good evening ${firstName}! Let's review what you accomplished today. ${achEn.join(' ')}`,
      ta: `வணக்கம் ${firstName}! இன்னைக்கு நீங்க என்னெல்லாம் சாதிச்சிருக்கீங்கனு பார்ப்போம். ${achTa.join(' ')}`,
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

    const candidateModels = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'];

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
 */
export function getConversationalRoutinePhrase(
  routineType: string,
  userName = 'Akash',
  mode: VoiceLanguageMode = 'tanglish'
): { text: string; lang: 'en' | 'ta'; tanglishChunks?: SpokenChunk[] } {
  const firstName = (userName || 'Akash').trim().split(' ')[0];
  const typeLower = (routineType || '').toLowerCase();

  if (typeLower.includes('walk') || typeLower.includes('cardio')) {
    if (mode === 'en') {
      return { lang: 'en', text: `Hey ${firstName}, it is time for your morning walk! Step outside, breathe in the fresh air, and let's get those steps in.` };
    }
    if (mode === 'ta') {
      return { lang: 'ta', text: `ஹாய் ${firstName}, வாக்கிங் போக வேண்டிய நேரம் வந்துடுச்சு! வெளிய போய் நல்ல காத்து வாங்கிட்டு, ஸ்டெப்ஸ் டார்கெட்டை முடிச்சிடலாம் வாங்க!` };
    }
    if (mode === 'tanglish') {
      return {
        lang: 'en',
        text: `Hey ${firstName}, time for your walking session! வாங்க, let's step outside and crush those steps!`,
        tanglishChunks: [
          { lang: 'en-IN', text: `Hey ${firstName}, time for your morning walking session!` },
          { lang: 'ta-IN', text: `வாங்க ப்ரோ, வெளிய போய் நல்ல காத்து வாங்கிட்டு ஸ்டெப்ஸ் டார்கெட்டை முடிச்சிடலாம்!` },
        ],
      };
    }
    // Both
    return {
      lang: 'en',
      text: `Hey ${firstName}, time for your morning walk! வாங்க, வெளிய போய் ஸ்டெப்ஸ் டார்கெட்டை முடிச்சிடலாம்!`,
      tanglishChunks: [
        { lang: 'en-IN', text: `Hey ${firstName}, it is time for your morning walking session! Step outside and let's get those steps in.` },
        { lang: 'ta-IN', text: `ஹாய் ${firstName}, வாக்கிங் போக வேண்டிய நேரம் வந்துடுச்சு! வெளிய போய் நல்ல காத்து வாங்கிட்டு ஸ்டெப்ஸ் டார்கெட்டை முடிச்சிடலாம் வாங்க!` },
      ],
    };
  }

  if (typeLower.includes('workout') || typeLower.includes('exercise')) {
    if (mode === 'en') {
      return { lang: 'en', text: `${firstName}, it's workout time! Let's hit your sets with good form and stay consistent with your goals.` };
    }
    if (mode === 'ta') {
      return { lang: 'ta', text: `${firstName}, உடற்பயிற்சி நேரம் ஆரம்பிச்சிடுச்சு! சோம்பேறித்தனம் படாம போய் ஒர்க்அவுட்டை முடிங்க, உடம்பு நல்லா பிட்டா இருக்கணும்ல!` };
    }
    if (mode === 'tanglish') {
      return {
        lang: 'en',
        text: `${firstName} bro, workout time வந்துடுச்சு! Time to hit your sets and crush today's session!`,
        tanglishChunks: [
          { lang: 'en-IN', text: `${firstName} bro, workout time is here!` },
          { lang: 'ta-IN', text: `சோம்பேறித்தனம் படாம போய் ஒர்க்அவுட்டை முடிங்க, அப்பதான் உடம்பு பிட்டா இருக்கும்!` },
        ],
      };
    }
    // Both
    return {
      lang: 'en',
      text: `${firstName}, it is time for your workout session! உடற்பயிற்சி நேரம் ஆரம்பிச்சிடுச்சு, வாங்க!`,
      tanglishChunks: [
        { lang: 'en-IN', text: `${firstName}, it is time for your scheduled exercise and strength training! Let's get moving and hit your sets.` },
        { lang: 'ta-IN', text: `${firstName}, உடற்பயிற்சி நேரம் ஆரம்பிச்சிடுச்சு! சோம்பேறித்தனம் படாம போய் ஒர்க்அவுட்டை முடிங்க, உடம்பு நல்லா பிட்டா இருக்கணும்ல!` },
      ],
    };
  }

  if (typeLower.includes('hydration') || typeLower.includes('water')) {
    if (mode === 'en') {
      return { lang: 'en', text: `${firstName}, quick hydration check! Drink a glass of water right now to stay fresh and energized.` };
    }
    if (mode === 'ta') {
      return { lang: 'ta', text: `${firstName}, உடனே ஒரு கிளாஸ் தண்ணி குடிங்க! உடம்புல நீர்ச்சத்து குறையாம பார்த்துக்கோங்க, அப்பதான் பிரெஷ்ஷா இருக்கும்!` };
    }
    if (mode === 'tanglish') {
      return {
        lang: 'en',
        text: `${firstName}, quick hydration check! ஒரு கிளாஸ் தண்ணி குடிங்க to keep your body fresh and energized.`,
        tanglishChunks: [
          { lang: 'en-IN', text: `${firstName}, quick hydration break!` },
          { lang: 'ta-IN', text: `உடனே ஒரு கிளாஸ் தண்ணி குடிங்க, உடம்புல நீர்ச்சத்து குறையாம இருக்கணும்!` },
        ],
      };
    }
    // Both
    return {
      lang: 'en',
      text: `${firstName}, time for a hydration break! ஒரு கிளாஸ் தண்ணி குடிங்க.`,
      tanglishChunks: [
        { lang: 'en-IN', text: `${firstName}, time for a hydration break! Drink a fresh glass of water right now.` },
        { lang: 'ta-IN', text: `${firstName}, உடனே ஒரு கிளாஸ் தண்ணி குடிங்க! உடம்புல நீர்ச்சத்து குறையாம பார்த்துக்கோங்க!` },
      ],
    };
  }

  if (typeLower.includes('bed') || typeLower.includes('sleep')) {
    if (mode === 'en') {
      return { lang: 'en', text: `Good evening ${firstName}. Time to wind down. Put your phone away, dim the lights, and enjoy deep restorative sleep.` };
    }
    if (mode === 'ta') {
      return { lang: 'ta', text: `இரவு வணக்கம் ${firstName}. தூங்க வேண்டிய நேரம் வந்துடுச்சு. போனை ஒரு ஓரமா வச்சிட்டு, நிம்மதியா தூங்கி ரெஸ்ட் எடுங்க.` };
    }
    if (mode === 'tanglish') {
      return {
        lang: 'en',
        text: `Good evening ${firstName}! Time to wind down... போனை ஓரமா வச்சிட்டு get some deep restorative sleep.`,
        tanglishChunks: [
          { lang: 'en-IN', text: `Good evening ${firstName}! Time to wind down for the night.` },
          { lang: 'ta-IN', text: `போனை ஓரமா வச்சிட்டு நிம்மதியா தூங்குங்க, நாளைக்கு எனர்ஜியா எந்திரிக்கலாம்!` },
        ],
      };
    }
    // Both
    return {
      lang: 'en',
      text: `Good evening ${firstName}. Time for your bedtime routine. போனை ஓரமா வச்சிட்டு நிம்மதியா தூங்குங்க.`,
      tanglishChunks: [
        { lang: 'en-IN', text: `Good evening ${firstName}. It is time for your bedtime routine. Dim the lights and get deep restorative sleep.` },
        { lang: 'ta-IN', text: `இரவு வணக்கம் ${firstName}. தூங்க வேண்டிய நேரம் வந்துடுச்சு. போனை ஒரு ஓரமா வச்சிட்டு, நிம்மதியா தூங்கி ரெஸ்ட் எடுங்க.` },
      ],
    };
  }

  // Wake up (default)
  if (mode === 'en') {
    return { lang: 'en', text: `Good morning ${firstName}! Time to wake up, drink a tall glass of water, and start your day energized. Have a great day!` };
  }
  if (mode === 'ta') {
    return { lang: 'ta', text: `காலை வணக்கம் ${firstName}! சீக்கிரம் எந்திரிங்க, முதல்ல ஒரு கிளாஸ் தண்ணி குடிச்சிட்டு இன்னைக்கு நாளை எனர்ஜியா ஸ்டார்ட் பண்ணலாம்!` };
  }
  if (mode === 'tanglish') {
    return {
      lang: 'en',
      text: `Morning ${firstName}! சீக்கிரம் எந்திரிங்க... First drink a glass of water and let's get energized for the day!`,
      tanglishChunks: [
        { lang: 'en-IN', text: `Good morning ${firstName}! Time to wake up and get moving!` },
        { lang: 'ta-IN', text: `முதல்ல ஒரு கிளாஸ் தண்ணி குடிச்சிட்டு இன்னைக்கு நாளை புத்துணர்ச்சியோட தொடங்குங்க!` },
      ],
    };
  }
  // Both
  return {
    lang: 'en',
    text: `Good morning ${firstName}! Time to wake up. காலை வணக்கம், இன்னைக்கு நாளை எனர்ஜியா தொடங்குங்க!`,
    tanglishChunks: [
      { lang: 'en-IN', text: `Good morning ${firstName}! It is time to wake up, hydrate, and start your day energized. Have a wonderful day ahead!` },
      { lang: 'ta-IN', text: `காலை வணக்கம் ${firstName}! சீக்கிரம் எந்திரிங்க, முதல்ல ஒரு கிளாஸ் தண்ணி குடிச்சிட்டு இன்னைக்கு நாளை எனர்ஜியா ஸ்டார்ட் பண்ணலாம்!` },
    ],
  };
}

