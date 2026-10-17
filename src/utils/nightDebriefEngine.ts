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
 * 3. Dual-Language & Fluent Voice Synthesis:
 *    - Authentic colloquial, native-spoken Tamil ('ta-IN') and natural conversational Indian/International English ('en-IN').
 *    - Segmented pacing (rate=0.95, pitch modulation).
 * 4. Sleep Blackout trigger coordination.
 */

import type { DailyPerformanceSummary, NightDebriefLanguage } from '../services/firestoreService';

export interface DebriefSegmentItem {
  id: string;
  category: 'achievement' | 'scold' | 'motivation' | 'windDown';
  titleEn: string;
  titleTa: string;
  badge: string;
  badgeColor: 'emerald' | 'amber' | 'cyan' | 'purple';
  textEn: string;
  textTa: string;
}

export interface DebriefScript {
  userName: string;
  date: string;
  escapedScold: boolean;
  segments: DebriefSegmentItem[];
}

/**
 * Discovers and selects the most natural, relaxed human-sounding voice available
 */
export function getBestDebriefVoice(lang: 'en' | 'ta'): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  if (lang === 'ta') {
    // 1. Natural / Neural Online voices
    const naturalTaVoice = voices.find((v) => {
      const l = v.lang.toLowerCase().replace('_', '-');
      const n = v.name.toLowerCase();
      return (
        (l.startsWith('ta') || n.includes('tamil') || n.includes('தமிழ்')) &&
        (n.includes('natural') || n.includes('neural') || n.includes('online'))
      );
    });
    if (naturalTaVoice) return naturalTaVoice;

    // 2. High priority: Google தமிழ் (Android / Chrome standard), ta-IN, ta-LK, ta-SG
    const googleTaVoice = voices.find((v) => {
      const n = v.name.toLowerCase();
      const l = v.lang.toLowerCase().replace('_', '-');
      return (l === 'ta-in' || l === 'ta_in' || l.startsWith('ta')) && (n.includes('google') || n.includes('தமிழ்'));
    });
    if (googleTaVoice) return googleTaVoice;

    // 3. Microsoft Pallavi / Latha
    const pallaviVoice = voices.find((v) => v.name.toLowerCase().includes('pallavi'));
    if (pallaviVoice) return pallaviVoice;

    const lathaVoice = voices.find((v) => v.name.toLowerCase().includes('latha'));
    if (lathaVoice) return lathaVoice;

    // 4. Any other Tamil voice
    const exactTaVoice = voices.find((v) => {
      const l = v.lang.toLowerCase().replace('_', '-');
      const n = v.name.toLowerCase();
      return (
        l === 'ta-in' ||
        l === 'ta_in' ||
        l === 'ta-lk' ||
        l === 'ta-sg' ||
        n.includes('valluvar') ||
        n.includes('tamil') ||
        n.includes('தமிழ்')
      );
    });
    if (exactTaVoice) return exactTaVoice;

    const anyTaVoice = voices.find((v) => v.lang.toLowerCase().startsWith('ta'));
    if (anyTaVoice) return anyTaVoice;

    return null;
  } else {
    // English: Select highest quality natural / Indian English conversational voice
    const indianEnVoice =
      voices.find((v) => {
        const l = v.lang.toLowerCase().replace('_', '-');
        const n = v.name.toLowerCase();
        return l === 'en-in' && (n.includes('natural') || n.includes('neural') || n.includes('online'));
      }) ||
      voices.find((v) => {
        const l = v.lang.toLowerCase().replace('_', '-');
        const n = v.name.toLowerCase();
        return l === 'en-in' || n.includes('india') || n.includes('ravi') || n.includes('heera') || n.includes('neerja');
      }) ||
      voices.find((v) => {
        const l = v.lang.toLowerCase().replace('_', '-');
        const n = v.name.toLowerCase();
        return l.startsWith('en') && (n.includes('natural') || n.includes('google') || n.includes('samantha') || n.includes('karen'));
      }) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
      voices[0];

    return indianEnVoice || null;
  }
}

/**
 * Builds the dynamic 4-pillar script based on today's real Firestore metrics
 */
export function buildNightDebriefScript(
  summary: DailyPerformanceSummary,
  userName = 'Athlete'
): DebriefScript {
  const firstName = (userName || 'Athlete').trim().split(' ')[0] || 'Athlete';

  // --- 1. Evaluate Achievements ---
  const achievementsEn: string[] = [];
  const achievementsTa: string[] = [];

  if (summary.workoutCompleted) {
    const mins = summary.workoutDurationMinutes || 45;
    const vol = summary.workoutVolumeKg ? ` pushing ${summary.workoutVolumeKg.toLocaleString()} kilograms of volume` : '';
    const volTa = summary.workoutVolumeKg ? ` ${summary.workoutVolumeKg.toLocaleString()} கிலோ எடையைத் தூக்கி` : '';
    achievementsEn.push(
      `You crushed your scheduled workout session today, putting in ${mins} intense minutes of training${vol}.`
    );
    achievementsTa.push(
      `இன்னைக்கு ${mins} நிமிஷம் வெறித்தனமா உடற்பயிற்சி பண்ணி${volTa} கலக்கிட்டீங்க!`
    );
  }

  if (summary.waterPercent >= 85) {
    achievementsEn.push(
      `Your hydration was locked in at ${(summary.waterMl / 1000).toFixed(1)} liters, hitting ${summary.waterPercent}% of your daily fluid target.`
    );
    achievementsTa.push(
      `தண்ணீர் குடிக்கும் இலக்கை ${summary.waterPercent} சதவீதம் அடைஞ்சு, உடம்பை நீர்ச்சத்தோட பாதுகாத்துட்டீங்க.`
    );
  }

  if (summary.steps >= 8000) {
    achievementsEn.push(
      `You stayed on your feet and logged ${summary.steps.toLocaleString()} steps of active movement.`
    );
    achievementsTa.push(
      `மொத்தம் ${summary.steps.toLocaleString()} அடிகள் நடந்து செம்ம சுறுசுறுப்பா இருந்திருக்கீங்க.`
    );
  }

  if (summary.caloriesConsumed > 0 && Math.abs(summary.calorieDelta) <= 250) {
    achievementsEn.push(
      `Your nutrition was right on equilibrium with ${summary.caloriesConsumed.toLocaleString()} calories, maintaining energy balance.`
    );
    achievementsTa.push(
      `உணவுக் கட்டுப்பாட்டுல சரியா ${summary.caloriesConsumed.toLocaleString()} கலோரி எடுத்து எனர்ஜியை கச்சிதமா பேலன்ஸ் பண்ணிருக்கீங்க.`
    );
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
  }

  // Fallback if no specific target was hit
  if (achievementsEn.length === 0) {
    achievementsEn.push(
      `You made time to show up for your evening debrief tonight. Showing up for accountability is where real transformation begins.`
    );
    achievementsTa.push(
      `இன்னைக்கு இந்த இரவு ரிவ்யூக்கு வந்து நின்னதே பெரிய விஷயம். சுய கட்டுப்பாடு தான் உங்களை அடுத்த கட்டத்துக்கு கொண்டு போகும்.`
    );
  }

  const praiseTextEn = `Good evening ${firstName}! Let's review what you accomplished today. ${achievementsEn.join(' ')}`;
  const praiseTextTa = `வணக்கம் ${firstName}! இன்னைக்கு நீங்க என்னெல்லாம் சாதிச்சீங்கனு பார்ப்போம். ${achievementsTa.join(' ')}`;

  // --- 2. Evaluate Scold (Strict Coach Tough-Love) ---
  const scoldsEn: string[] = [];
  const scoldsTa: string[] = [];

  if (!summary.workoutCompleted) {
    scoldsEn.push(
      `Now for the harsh reality, ${firstName}. You skipped your workout today. There were twenty-four full hours on the clock, and you couldn't dedicate forty-five minutes to your own physical vessel? Excuses do not build stamina, and they certainly will not build muscle. That was pure procrastination.`
    );
    scoldsTa.push(
      `இப்ப கசப்பான உண்மைக்கு வருவோம் ${firstName}. இன்னைக்கு உடற்பயிற்சியை முழுசா கோட்டை விட்டுட்டீங்க! நாள் முழுக்க இருபத்து நான்கு மணி நேரம் இருந்துச்சு, உடம்பை பார்த்துக்க ஒரு நாற்பத்தைந்து நிமிஷம் ஒதுக்க முடியலையா? சாக்குபோக்கு சொன்னா உடம்பு ஏறாது, இது சுத்த சோம்பேறித்தனம்!`
    );
  }

  if (summary.waterPercent < 60) {
    scoldsEn.push(
      `Your hydration was pitiful today — only ${summary.waterMl} milliliters logged. How do you expect your muscles to recover, your joints to stay lubricated, and your brain to function when you are dehydrating your system?`
    );
    scoldsTa.push(
      `அப்புறம் இந்த தண்ணீர் அளவு. வெறும் ${summary.waterMl} மில்லி தான் குடிச்சிருக்கீங்க! உடம்புல நீர்ச்சத்து இல்லாம தசை எப்படி வளரும்? தாகம் எடுத்தா மட்டும் தண்ணி குடிக்கிறது தப்பு!`
    );
  }

  if (summary.steps < 5000 && summary.steps > 0) {
    scoldsEn.push(
      `Only ${summary.steps.toLocaleString()} steps today? You basically lived in your chair. Sedentary habits destroy metabolic momentum.`
    );
    scoldsTa.push(
      `இன்னைக்கு வெறும் ${summary.steps.toLocaleString()} அடிகள் தானா? நாற்காலியிலேயே உட்கார்ந்து நாளை கழிச்சுட்டீங்களா? கொஞ்சம் கூட நடக்க மாட்டேன்னு அடம் பிடிக்கிறீங்களா?`
    );
  }

  if (summary.caloriesConsumed > summary.targetCalories + 300) {
    scoldsEn.push(
      `You overshot your caloric maintenance baseline by ${Math.round(summary.caloriesConsumed - summary.targetCalories)} calories. Mindless eating will quickly undo your discipline if you don't control the fork.`
    );
    scoldsTa.push(
      `உங்களோட கலோரி அளவை விட ${Math.round(summary.caloriesConsumed - summary.targetCalories)} கலோரி அதிகமா சாப்பிட்டிருக்கீங்க. கண்டதை தின்னா அப்புறம் ஃபிட்னஸ் எப்படி வரும்? நாவடக்கம் ரொம்ப முக்கியம்!`
    );
  } else if (summary.caloriesConsumed > 0 && summary.caloriesConsumed < summary.targetCalories - 450 && !summary.isFasting) {
    scoldsEn.push(
      `You undereaten by ${Math.abs(summary.calorieDelta)} calories today. Starving your body starves muscle repair.`
    );
    scoldsTa.push(
      `தேவையான அளவை விட ${Math.abs(summary.calorieDelta)} கலோரி கம்மியா சாப்பிட்டு பட்டினி கிடந்திருக்கீங்க. போதுமான சத்து இல்லாம உடம்பு எப்படி தேறும்?`
    );
  }

  const escapedScold = scoldsEn.length === 0;
  let scoldTextEn = '';
  let scoldTextTa = '';

  if (escapedScold) {
    scoldTextEn = `Honestly, ${firstName}? I came prepared to give you a ruthless coach grilling tonight. But looking at your daily logs, you executed your targets cleanly. You escaped my scolding tonight — don't let it go to your head, because tomorrow sets a brand new standard.`;
    scoldTextTa = `உண்மையை சொல்லனும்னா ${firstName}, இன்னைக்கு உங்களை கண்டபடி திட்டலாம்னு தான் வந்தேன். ஆனா உங்களோட தினசரி ரெக்கார்டை பார்த்தா எல்லா இலக்கையும் கச்சிதமா முடிச்சுட்டீங்க! இன்னைக்கு எங்கிட்ட இருந்து தப்பிச்சுட்டீங்க, ஆனா தலைக்கனம் ஏறிடக்கூடாது!`;
  } else {
    scoldTextEn = scoldsEn.join(' ');
    scoldTextTa = scoldsTa.join(' ');
  }

  // --- 3. Tomorrow's Motivation ---
  const motivationTextEn = `Whatever happened today is now written in the books. Good or bad, yesterday cannot be changed. Tomorrow morning at six A.M., the alarm rings and you have a completely fresh slate to dominate your routine. Fix your mind on execution.`;
  const motivationTextTa = `இன்னைக்கு நடந்தது முடிஞ்சு போச்சு. நல்லதோ கெட்டதோ, தூங்கி எந்திரிச்சா ஒரு புது அத்தியாயம். நாளைக்கு காலைல ஆறு மணிக்கு அலாரம் அடிக்கும் போது எவ்வித தயக்கமும் இல்லாம புத்துணர்ச்சியோட களத்துல இறங்கணும்!`;

  // --- 4. Wind-Down & Sleep Blackout Command ---
  const windDownTextEn = `Now, follow this final command: put your phone down immediately. Do not scroll reels. Do not check social media. The screen is powering down into pitch-black recovery mode right now. Close your eyes, breathe deeply, and give your body the deep sleep it needs. Goodnight, champion.`;
  const windDownTextTa = `இப்ப நான் சொல்றத ஒழுங்கா கேளுங்க. போன உடனே கீழே வைங்க. தேவையில்லாம போனை நோண்டிட்டு நேரத்தை வீணாக்காதீங்க. ஸ்க்ரீன் இப்பவே முழுசா ஆஃப் ஆகுது. கண்ணை மூடி ஆழ்ந்த தூக்கத்துக்கு போங்க. குட் நைட், நாளைக்கு பாப்போம்!`;

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

let activeDebriefSpeechSession = false;

/**
 * Halts any active debrief voice speech synthesis immediately
 */
export function stopNightDebriefSpeech(): void {
  activeDebriefSpeechSession = false;
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Executes the sequential, natural human-like voice synthesis pipeline for the debrief
 */
export async function speakNightDebrief(
  script: DebriefScript,
  language: NightDebriefLanguage = 'both',
  callbacks: SpeakDebriefCallbacks = {}
): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    callbacks.onComplete?.();
    return;
  }

  stopNightDebriefSpeech();
  activeDebriefSpeechSession = true;

  const voicesLoaded = () =>
    new Promise<void>((resolve) => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        resolve();
      } else {
        window.speechSynthesis.onvoiceschanged = () => resolve();
        setTimeout(resolve, 350);
      }
    });

  await voicesLoaded();

  const englishVoice = getBestDebriefVoice('en');
  const tamilVoice = getBestDebriefVoice('ta');

  const speakSegmentText = (
    text: string,
    lang: 'en' | 'ta',
    isFinalWindDown = false
  ): Promise<void> => {
    return new Promise((resolve) => {
      if (!activeDebriefSpeechSession) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
      utterance.rate = 0.95; // Relaxed conversational cadence
      utterance.pitch = isFinalWindDown ? 0.92 : 1.0;
      utterance.volume = 1.0;

      if (lang === 'ta' && tamilVoice) {
        utterance.voice = tamilVoice;
      } else if (lang === 'en' && englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onboundary = (e) => {
        if (e.name === 'sentence' || e.charIndex !== undefined) {
          callbacks.onSentence?.(text, lang === 'ta');
        }
      };

      utterance.onend = () => {
        resolve();
      };

      utterance.onerror = (err) => {
        console.warn('Speech segment utterance error:', err);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  };

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  try {
    // 1. Speak in English if requested ('en' or 'both')
    if (language === 'en' || language === 'both') {
      for (const segment of script.segments) {
        if (!activeDebriefSpeechSession) break;
        callbacks.onSegmentStart?.(segment, false);
        callbacks.onSentence?.(segment.textEn, false);

        const isWindDown = segment.category === 'windDown';
        await speakSegmentText(segment.textEn, 'en', isWindDown);
        await delay(350); // Natural conversational breath pause
      }
    }

    // Brief inter-language bridge pause
    if (language === 'both' && activeDebriefSpeechSession) {
      await delay(650);
    }

    // 2. Speak in Tamil if requested ('ta' or 'both')
    if ((language === 'ta' || language === 'both') && activeDebriefSpeechSession) {
      for (const segment of script.segments) {
        if (!activeDebriefSpeechSession) break;
        callbacks.onSegmentStart?.(segment, true);
        callbacks.onSentence?.(segment.textTa, true);

        const isWindDown = segment.category === 'windDown';
        await speakSegmentText(segment.textTa, 'ta', isWindDown);
        await delay(350); // Natural conversational breath pause
      }
    }

    if (activeDebriefSpeechSession) {
      activeDebriefSpeechSession = false;
      callbacks.onComplete?.();
    }
  } catch (err) {
    callbacks.onError?.(err);
    callbacks.onComplete?.();
  }
}

