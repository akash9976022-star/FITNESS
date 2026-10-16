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
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    if (response?.text) {
      return response.text;
    }
  } catch (error) {
    console.warn('Gemini 3.8 Flash call failed, trying Gemini 3.5 Flash Lite:', error);
    try {
      const systemInstruction = buildSystemInstruction(profile);
      const fallbackRes = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
      if (fallbackRes?.text) return fallbackRes.text;
    } catch (fbErr) {
      console.warn('Gemini fallback failed:', fbErr);
    }
  }

  return fallbackFitnessAnswer(prompt, profile);
}

/* ==================== FOOD SCANNING & NUTRITION ANALYSIS ==================== */

export interface Base64ImagePart {
  mimeType: string;
  data: string;
}

export interface FoodAnalysisResult {
  food_name: string;
  detected_components: string[];
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  confidence_score: 'High' | 'Medium' | 'Low';
}

/**
 * Helper utility to convert mobile camera captures or web file uploads into clean base64 image parts.
 */
export function fileToBase64(file: File): Promise<Base64ImagePart> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIndex = result.indexOf(',');
      if (commaIndex !== -1) {
        const metadata = result.substring(0, commaIndex);
        const data = result.substring(commaIndex + 1);
        const mimeMatch = metadata.match(/^data:(.*?);base64/);
        const mimeType = mimeMatch ? mimeMatch[1] : (file.type || 'image/jpeg');
        resolve({ mimeType, data });
      } else {
        resolve({ mimeType: file.type || 'image/jpeg', data: result });
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Safe parsing utility implementing markdown stripping (`replace(/```json|```/g, '')`) before calling JSON.parse().
 */
export function safeParseNutritionJson(rawText: string): FoodAnalysisResult | null {
  try {
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (parsed && typeof parsed === 'object') {
      const rawConf = String(parsed.confidence_score || 'Medium').trim();
      let confidence_score: 'High' | 'Medium' | 'Low' = 'Medium';
      if (/high/i.test(rawConf)) confidence_score = 'High';
      else if (/low/i.test(rawConf)) confidence_score = 'Low';
      else confidence_score = 'Medium';

      const detected = Array.isArray(parsed.detected_components)
        ? parsed.detected_components.map((c: unknown) => String(c).trim()).filter(Boolean)
        : [String(parsed.food_name || 'Detected Dish')];

      return {
        food_name: String(parsed.food_name || 'Detected Meal').trim(),
        detected_components: detected.length > 0 ? detected : ['Standard serving portion'],
        calories: Math.max(0, Math.round(Number(parsed.calories) || 0)),
        protein_g: Math.max(0, Math.round(Number(parsed.protein_g) || 0)),
        carbs_g: Math.max(0, Math.round(Number(parsed.carbs_g) || 0)),
        fats_g: Math.max(0, Math.round(Number(parsed.fats_g) || 0)),
        confidence_score,
      };
    }
  } catch (err) {
    console.warn('Failed to parse Gemini nutrition JSON response:', err, rawText);
  }
  return null;
}

const INDIAN_NUTRITION_SYSTEM_INSTRUCTION = `You are an elite sports nutritionist and metabolic biochemistry specialist with deep expertise in global and Indian cuisines (North Indian, South Indian, home-cooked regional thalis, and street food).
When analyzing food images:
1. Accurately identify the main dishes, sides, breads, gravies, and discrete ingredients (e.g. Roti, Paratha, Dal, Chana Masala, Paneer, Rice, Dosa, Idli, Sambar, Chutney, Salad, Curd).
2. Rigorously account for hidden cooking fats:
   - Ghee (clarified butter), butter (makhan), mustard oil, sunflower/groundnut oil, coconut oil, dairy cream (malai), and deep-frying oils (tadka/tempering).
   - Recognize standard Indian serving containers: standard katori (~150ml / 150g cooked capacity), standard dinner thali / plate, piece counts (e.g., 2 medium rotis, 1 piece samosa, 2 idlis).
3. Compute precise macronutrients for athletic fitness:
   - calories (total energy in kcal)
   - protein_g (grams of protein)
   - carbs_g (grams of carbohydrates)
   - fats_g (grams of fats including hidden oils/ghee)
4. Assign confidence_score:
   - "High": Dish, portion size, and components are clearly visible and well-lit.
   - "Medium": Partially obscured, mixed curry/gravy, or approximate volume.
   - "Low": Blurry, ambiguous street food item, unrecognizable mixture, or non-food.
5. Strictly output valid JSON adhering to the specified schema with no markdown code blocks outside JSON.`;

const foodAnalysisJsonSchema = {
  type: 'object',
  properties: {
    food_name: { type: 'string', description: 'Name of the primary dish or full meal' },
    detected_components: {
      type: 'array',
      items: { type: 'string' },
      description: 'Individual items, ingredients, breads, and curries identified',
    },
    calories: { type: 'number', description: 'Total calories in kcal' },
    protein_g: { type: 'number', description: 'Protein in grams' },
    carbs_g: { type: 'number', description: 'Carbohydrates in grams' },
    fats_g: { type: 'number', description: 'Fats in grams including cooking oils and ghee' },
    confidence_score: {
      type: 'string',
      enum: ['High', 'Medium', 'Low'],
      description: 'Confidence score: High, Medium, or Low',
    },
  },
  required: [
    'food_name',
    'detected_components',
    'calories',
    'protein_g',
    'carbs_g',
    'fats_g',
    'confidence_score',
  ],
};

/**
 * Analyzes a food image using Gemini AI with specialized Indian & Global nutrition instruction.
 */
export async function analyzeFoodImage(
  imagePart: Base64ImagePart
): Promise<FoodAnalysisResult> {
  if (!aiClient || !apiKey) {
    throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your environment.');
  }

  const prompt = `Analyze this food image in detail. Identify the dish and all individual components.
Estimate portion size based on visual cues (plates, bowls/katori, piece sizes).
Rigorously account for hidden fats (ghee, butter, mustard/coconut oil, cream) and calculate total calories, protein_g, carbs_g, and fats_g.
Determine the confidence_score ("High", "Medium", or "Low").
Return strictly valid JSON adhering to the schema.`;

  const contents = [
    {
      inlineData: {
        mimeType: imagePart.mimeType,
        data: imagePart.data,
      },
    },
    { text: prompt },
  ];

  const config = {
    systemInstruction: INDIAN_NUTRITION_SYSTEM_INSTRUCTION,
    responseMimeType: 'application/json',
    responseSchema: foodAnalysisJsonSchema,
    temperature: 0.2,
  };

  // Primary model: gemini-3.8-flash
  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config,
    });
    if (response?.text) {
      const parsed = safeParseNutritionJson(response.text);
      if (parsed) return parsed;
    }
  } catch (primaryErr) {
    console.warn('gemini-3.8-flash scan failed, trying gemini-3.5-flash-lite fallback:', primaryErr);
  }

  // Fallback model: gemini-3.5-flash-lite
  try {
    const fallbackResponse = await aiClient.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents,
      config,
    });

    if (fallbackResponse?.text) {
      const parsed = safeParseNutritionJson(fallbackResponse.text);
      if (parsed) return parsed;
    }
  } catch (fallbackErr) {
    console.warn('gemini-3.5-flash-lite scan also failed:', fallbackErr);
    throw fallbackErr;
  }

  throw new Error('Unable to extract structured nutritional data from scan response.');
}

/* ==================== AI PHYSIQUE & BODY TYPE ANALYSIS ==================== */

export interface AiPhysiqueAnalysis {
  bodyTypeEstimate: string;
  physiqueObservations: string[];
  symmetryNotes: string;
  recoveryAdjustment: string;
  volumeRecommendation: string;
}

const physiqueAnalysisJsonSchema = {
  type: 'object',
  properties: {
    body_type_estimate: {
      type: 'string',
      description: 'Estimated structural body type and frame (e.g. Mesomorphic Athletic, Balanced Ecto-Meso, Endomorphic Strength Frame)',
    },
    physique_observations: {
      type: 'array',
      items: { type: 'string' },
      description: '3-4 scientific, constructive observations on muscle balance, posture, shoulder alignment, and frame development',
    },
    symmetry_notes: {
      type: 'string',
      description: 'Specific notes on shoulder-to-waist ratio, left/right symmetry, and postural integrity',
    },
    recovery_adjustment: {
      type: 'string',
      description: 'Actionable recovery guidance (sleep, hydration, mobility, or nervous system rest)',
    },
    volume_recommendation: {
      type: 'string',
      description: 'Recommended training intensity or volume modification based on readiness and visual muscle fatigue',
    },
  },
  required: [
    'body_type_estimate',
    'physique_observations',
    'symmetry_notes',
    'recovery_adjustment',
    'volume_recommendation',
  ],
};

export function safeParsePhysiqueJson(rawText: string): AiPhysiqueAnalysis | null {
  try {
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (parsed && typeof parsed === 'object') {
      const obs = Array.isArray(parsed.physique_observations)
        ? parsed.physique_observations.map((o: unknown) => String(o).trim()).filter(Boolean)
        : [String(parsed.physique_observations || 'Balanced overall muscular tone and posture.')];

      return {
        bodyTypeEstimate: String(parsed.body_type_estimate || 'Athletic & Balanced Build').trim(),
        physiqueObservations:
          obs.length > 0 ? obs : ['Symmetrical posture', 'Good foundation for progressive overload'],
        symmetryNotes: String(
          parsed.symmetry_notes || 'Balanced shoulder-to-hip alignment with consistent postural symmetry.'
        ).trim(),
        recoveryAdjustment: String(
          parsed.recovery_adjustment || 'Maintain 7-8 hours of restorative sleep and consistent hydration.'
        ).trim(),
        volumeRecommendation: String(
          parsed.volume_recommendation || 'Continue standard volume progression within your target training split.'
        ).trim(),
      };
    }
  } catch (err) {
    console.warn('Failed to parse Gemini physique JSON:', err, rawText);
  }
  return null;
}

/**
 * Analyzes a check-in progress photo to generate personalized physique observations,
 * body type estimation, symmetry notes, and recovery/training volume adjustments.
 */
export async function analyzePhysiqueImage(
  imagePart: Base64ImagePart,
  weightKg: number,
  experienceLevel: 'beginner' | 'intermediate' | 'pro' = 'intermediate'
): Promise<AiPhysiqueAnalysis> {
  if (!aiClient || !apiKey) {
    throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your environment.');
  }

  const prompt = `Analyze this morning physique check-in photo as an elite kinesiology biomechanist and physique coach.
Athlete Context:
- Current Morning Weight: ${weightKg} kg
- Experience Level: ${experienceLevel.toUpperCase()}

Instructions:
1. Estimate body type and structural frame tendencies (e.g., Mesomorphic Athletic, Balanced Ecto-Meso, Compact Power Frame).
2. Detail 3-4 constructive, scientific physique observations addressing posture (clavicle/scapular positioning), V-taper / proportions, and muscular fullness.
3. Observe bilateral symmetry (left/right balance, core stability, shoulder balance).
4. Provide recovery adjustments and volume recommendations calibrated strictly to their experience level:
   - For BEGINNER: Emphasize fundamental posture, joint mobility, gradual recovery, and foundational linear progression.
   - For INTERMEDIATE: Emphasize progressive overload pacing, lagging muscle volume redistribution, and RPE management.
   - For PRO: Emphasize muscular fullness, water retention variance, fatigue autoregulation, and deload scheduling.
5. Strictly output valid JSON adhering to the specified schema.`;

  const contents = [
    {
      inlineData: {
        mimeType: imagePart.mimeType,
        data: imagePart.data,
      },
    },
    { text: prompt },
  ];

  const config = {
    responseMimeType: 'application/json',
    responseSchema: physiqueAnalysisJsonSchema,
    temperature: 0.3,
  };

  // Primary model: gemini-3.8-flash
  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config,
    });
    if (response?.text) {
      const parsed = safeParsePhysiqueJson(response.text);
      if (parsed) return parsed;
    }
  } catch (primaryErr) {
    console.warn('gemini-3.8-flash physique analysis failed, trying gemini-3.5-flash-lite fallback:', primaryErr);
  }

  // Fallback model: gemini-3.5-flash-lite
  try {
    const fallbackResponse = await aiClient.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents,
      config,
    });
    if (fallbackResponse?.text) {
      const parsed = safeParsePhysiqueJson(fallbackResponse.text);
      if (parsed) return parsed;
    }
  } catch (fallbackErr) {
    console.warn('gemini-3.5-flash-lite physique analysis failed:', fallbackErr);
    throw fallbackErr;
  }

  throw new Error('Unable to generate structured physique analysis from Gemini response.');
}

