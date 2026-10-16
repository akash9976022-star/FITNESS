import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim() || '';

export const isGeminiConfigured = Boolean(apiKey.length > 0);

let aiClient: GoogleGenAI | null = null;
if (isGeminiConfigured) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
  }
}

export interface AiUserProfileContext {
  experienceLevel?: 'beginner' | 'intermediate' | 'pro';
  equipment?: string[];
  calculatedTdee?: number;
  currentWeightKg?: number;
  targetWeightKg?: number;
}

function buildSystemInstruction(profile?: AiUserProfileContext): string {
  let instruction = `You are FitMaintenance AI Coach — an elite sports nutritionist, hypertrophy exercise scientist, and metabolic rate coach.
Your core mission is to help athletes and fitness enthusiasts calculate their true maintenance calories, optimize macronutrients (Protein, Carbs, Fats), navigate reverse dieting, and apply progressive overload.
Always give concise, scientifically grounded, and practical answers formatted clearly with clean bullet points or short paragraphs.`;

  if (!profile) return instruction;

  instruction += `\n\n--- ATHLETE PROFILE CONTEXT ---`;

  if (profile.experienceLevel) {
    if (profile.experienceLevel === 'beginner') {
      instruction += `\n- EXPERIENCE LEVEL: BEGINNER. Adopt a patient, instructional, and encouraging tone. Prioritize fundamental compound movement mechanics, safety, conservative volume (8-12 sets per muscle group per week), and linear progression. Avoid overwhelming with extreme intensity techniques.`;
    } else if (profile.experienceLevel === 'intermediate') {
      instruction += `\n- EXPERIENCE LEVEL: INTERMEDIATE. Adopt a technical and analytical tone. Focus on hypertrophy periodization, proximity to failure (RPE 7-9), volume accumulation (12-18 sets/week), and progressive overload tracking.`;
    } else if (profile.experienceLevel === 'pro') {
      instruction += `\n- EXPERIENCE LEVEL: PRO / ADVANCED. Adopt a direct, high-intensity, and elite performance tone. Focus on maximum recoverable volume (MRV) thresholds, advanced failure techniques (drop sets, myo-reps, cluster sets), fatigue autoregulation, and precision metabolic rate tuning.`;
    }
  }

  if (profile.calculatedTdee) {
    instruction += `\n- CALCULATED MAINTENANCE (TDEE): ${profile.calculatedTdee} kcal/day.`;
  }
  if (profile.currentWeightKg) {
    instruction += `\n- CURRENT BODYWEIGHT: ${profile.currentWeightKg} kg.`;
  }
  if (profile.targetWeightKg) {
    instruction += `\n- TARGET MAINTENANCE WEIGHT: ${profile.targetWeightKg} kg.`;
  }

  if (profile.equipment && profile.equipment.length > 0) {
    instruction += `\n- AVAILABLE GYM EQUIPMENT & MACHINES: ${profile.equipment.join(', ')}. When prescribing or suggesting exercises, STRICTLY utilize machines and tools available in the user's inventory. If proposing an unlisted exercise, offer an immediate substitute using their available gear.`;
  }

  return instruction;
}

function fallbackFitnessAnswer(prompt: string, profile?: AiUserProfileContext): string {
  const lower = prompt.toLowerCase();
  const exp = profile?.experienceLevel || 'intermediate';

  if (lower.includes('leg') || lower.includes('heavy') || lower.includes('split')) {
    if (exp === 'beginner') {
      return 'For a beginner, focus on mastering the basic leg movement mechanics (3-4 sets of 8-10 reps) with at least 48-72 hours of recovery between sessions. Ensure you consume a balanced carbohydrate meal 90 minutes beforehand to fuel your sets.';
    }
    return 'On heavy compound leg days, your glycogen consumption spikes drastically. Consider shifting 30–40g of carbohydrates from rest days into your peri-workout meals (90 mins before and right after training) while maintaining your weekly average caloric balance.';
  }

  if (lower.includes('macro') || lower.includes('protein') || lower.includes('muscle')) {
    const weight = profile?.currentWeightKg || 70;
    const proteinTarget = Math.round(weight * 2.0);
    return `For optimal muscle preservation at maintenance:\n• **Protein**: ${proteinTarget}g (2.0g per kg of your ${weight}kg weight) to preserve lean mass\n• **Fats**: 20–25% of total caloric intake for hormone and joint health\n• **Carbohydrates**: Remainder of your calories to fuel anaerobic output and glycogen replenishment.`;
  }

  if (lower.includes('metabolic') || lower.includes('reverse') || lower.includes('cut')) {
    return 'To restore thyroid and leptin levels after a deficit without gaining fat, reverse diet by increasing calories by +100 to +150 kcal per week until reaching your estimated maintenance. Monitor your 7-day average body weight to confirm equilibrium.';
  }

  const tdee = profile?.calculatedTdee ? `${profile.calculatedTdee.toLocaleString()} kcal` : 'your calculated baseline';
  return `To determine your true maintenance caloric intake: consume ${tdee} for 14 consecutive days and track your morning fasted weight. If your 7-day rolling weight average changes by less than ±0.3%, you are in true thermodynamic equilibrium.`;
}

export async function askFitMaintenanceAI(
  prompt: string,
  profile?: AiUserProfileContext
): Promise<string> {
  if (!aiClient || !apiKey) {
    return fallbackFitnessAnswer(prompt, profile);
  }

  try {
    const systemInstruction = buildSystemInstruction(profile);
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    if (response?.text) {
      return response.text;
    }
    return fallbackFitnessAnswer(prompt, profile);
  } catch (error) {
    console.warn('Gemini API call encountered an issue, using scientific fallback response:', error);
    return fallbackFitnessAnswer(prompt, profile);
  }
}
