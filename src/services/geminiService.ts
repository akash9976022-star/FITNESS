import { GoogleGenAI } from '@google/genai';

const getApiKey = (): string => {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (envKey) return envKey;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedKey =
        localStorage.getItem('VITE_GEMINI_API_KEY')?.trim() ||
        localStorage.getItem('gemini_api_key')?.trim() ||
        '';
      if (storedKey) return storedKey;
    }
  } catch {
    // ignore
  }
  return '';
};

export const isGeminiConfigured = Boolean(getApiKey().length > 0);

/**
 * Modern Google Gemini models in priority fallback order:
 * 1. gemini-3.5-flash-lite: Extremely fast, low latency, active for all keys & tiers
 * 2. gemini-3.5-flash: High intelligence multimodal workhorse
 * 3. gemini-3-flash-preview: Modern preview fallback
 * 4. gemini-3.8-flash: Next-gen flagship flash model
 * 5. gemini-2.5-flash: Legacy fallback
 * 6. gemini-1.5-flash: Legacy fallback
 */
export const GEMINI_CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-3.8-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
];

let cachedApiKey = '';
let aiClient: GoogleGenAI | null = null;

export function getAiClient(): GoogleGenAI | null {
  const currentKey = getApiKey();
  if (!currentKey) return null;
  if (!aiClient || cachedApiKey !== currentKey) {
    try {
      aiClient = new GoogleGenAI({ apiKey: currentKey });
      cachedApiKey = currentKey;
    } catch (err) {
      console.warn('Failed to initialize GoogleGenAI client:', err);
      return null;
    }
  }
  return aiClient;
}

if (isGeminiConfigured) {
  try {
    const key = getApiKey();
    aiClient = new GoogleGenAI({ apiKey: key });
    cachedApiKey = key;
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
  const client = getAiClient();
  if (!client) {
    return fallbackFitnessAnswer(prompt, profile);
  }

  const systemInstruction = buildSystemInstruction(profile);

  for (const model of GEMINI_CANDIDATE_MODELS) {
    try {
      const response = await client.models.generateContent({
        model,
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
      console.warn(`Gemini Coach generation with ${model} failed, trying next candidate:`, error);
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
 * Canvas-based client-side image compression utility.
 * Scales down large camera captures (often 5-15MB) to a maximum width (default 800px)
 * and JPEG quality 0.8 (~100-250KB), ensuring fast uploads and rapid Gemini responses.
 */
export async function compressImage(
  fileOrBlob: File | Blob,
  maxWidth = 800,
  quality = 0.8
): Promise<{ file: File; base64Part: Base64ImagePart }> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      fileToBase64(fileOrBlob as File)
        .then((b64) => {
          resolve({
            file:
              fileOrBlob instanceof File
                ? fileOrBlob
                : new File([fileOrBlob], 'image.jpg', { type: 'image/jpeg' }),
            base64Part: b64,
          });
        })
        .catch(reject);
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          fileToBase64(fileOrBlob as File)
            .then((b64) => {
              resolve({
                file:
                  fileOrBlob instanceof File
                    ? fileOrBlob
                    : new File([fileOrBlob], 'image.jpg', { type: 'image/jpeg' }),
                base64Part: b64,
              });
            })
            .catch(reject);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const commaIndex = dataUrl.indexOf(',');
        const base64Data = commaIndex !== -1 ? dataUrl.substring(commaIndex + 1) : dataUrl;

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File(
              [blob || fileOrBlob],
              fileOrBlob instanceof File ? fileOrBlob.name : 'compressed.jpg',
              { type: 'image/jpeg' }
            );

            resolve({
              file: compressedFile,
              base64Part: {
                mimeType: 'image/jpeg',
                data: base64Data,
              },
            });
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(fileOrBlob);
  });
}

// Reliable image compression and base64 helper (optimized for rapid upload & Gemini vision inference)
export function handleImageUploadAndCompression(file: Blob | File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 720; // Lightweight & crisp for high-speed AI analysis
        const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Return compressed base64 string
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Converts a base64 data URL to a standard browser File object for storage upload.
 */
export function dataUrlToFile(
  dataUrl: string,
  fileName: string = `${Date.now()}_checkin.jpg`
): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], fileName, { type: mime });
}

/**
 * Extracts pure Base64 and MIME type from Data URL or raw base64.
 */
export function extractBase64Part(dataUrlOrRaw: string): Base64ImagePart {
  const commaIndex = dataUrlOrRaw.indexOf(',');
  if (commaIndex !== -1) {
    const mimeType = dataUrlOrRaw.substring(5, commaIndex).split(';')[0] || 'image/jpeg';
    const data = dataUrlOrRaw.substring(commaIndex + 1);
    return { mimeType, data };
  }
  return { mimeType: 'image/jpeg', data: dataUrlOrRaw };
}

/**
 * Formats API errors into clean, human-readable strings, extracting the inner message
 * from raw JSON error payloads (e.g. from Google GenAI ApiError).
 */
export function formatGeminiErrorMessage(err: unknown): string {
  if (!err) return 'An unexpected error occurred during AI analysis.';
  const rawMsg = err instanceof Error ? err.message : String(err);
  try {
    const jsonMatch = rawMsg.match(/\{[\s\S]*"error"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed?.error?.message) {
        return parsed.error.message;
      }
    }
  } catch {
    // ignore parse error and return raw message
  }
  return rawMsg;
}

/**
 * Wraps an async call in a 25-second timeout with an automatic single retry attempt before erroring.
 */
export async function withTimeoutAndRetry<T>(
  asyncFn: () => Promise<T>,
  timeoutMs = 25000,
  maxRetries = 1,
  operationName = 'Gemini AI Call'
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await Promise.race([
        asyncFn(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`${operationName} timed out after ${timeoutMs / 1000}s`)),
            timeoutMs
          )
        ),
      ]);
      return result;
    } catch (err) {
      lastError = err;
      console.warn(`${operationName} attempt ${attempt + 1} failed:`, err);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }
  }

  throw lastError;
}

/**
 * Safe parsing utility implementing JSON block extraction before calling JSON.parse().
 */
export function safeParseNutritionJson(rawText: string): FoodAnalysisResult | null {
  try {
    let cleaned = rawText.trim();
    const jsonBlockMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonBlockMatch) {
      cleaned = jsonBlockMatch[0];
    } else {
      cleaned = cleaned.replace(/```json|```/g, '').trim();
    }
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
  const client = getAiClient();
  if (!client) {
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

  const runFoodScan = async () => {
    let lastError: unknown = null;

    for (const model of GEMINI_CANDIDATE_MODELS) {
      try {
        const response = await client.models.generateContent({
          model,
          contents,
          config,
        });

        if (response?.text) {
          const parsed = safeParseNutritionJson(response.text);
          if (parsed) return parsed;
        }
      } catch (modelErr) {
        console.warn(`Food scan with ${model} failed, attempting next candidate:`, modelErr);
        lastError = modelErr;
      }
    }

    if (lastError) {
      throw lastError;
    }
    throw new Error('Unable to extract structured nutritional data from scan response.');
  };

  return await withTimeoutAndRetry(runFoodScan, 25000, 1, 'Gemini Food Scan');
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
    let cleaned = rawText.trim();
    const jsonBlockMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonBlockMatch) {
      cleaned = jsonBlockMatch[0];
    } else {
      cleaned = cleaned.replace(/```json|```/g, '').trim();
    }
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
  imagePart: Base64ImagePart | string,
  weightKg: number,
  experienceLevel: 'beginner' | 'intermediate' | 'pro' = 'intermediate'
): Promise<AiPhysiqueAnalysis> {
  const client = getAiClient();
  if (!client) {
    throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your environment.');
  }

  const resolvedPart = typeof imagePart === 'string' ? extractBase64Part(imagePart) : imagePart;

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
        mimeType: resolvedPart.mimeType,
        data: resolvedPart.data,
      },
    },
    { text: prompt },
  ];

  const config = {
    responseMimeType: 'application/json',
    responseSchema: physiqueAnalysisJsonSchema,
    temperature: 0.3,
  };

  const runPhysiqueAnalysis = async () => {
    let lastError: unknown = null;

    for (const model of GEMINI_CANDIDATE_MODELS) {
      try {
        const response = await client.models.generateContent({
          model,
          contents,
          config,
        });

        if (response?.text) {
          const parsed = safeParsePhysiqueJson(response.text);
          if (parsed) return parsed;
        }
      } catch (modelErr) {
        console.warn(`Physique analysis with ${model} failed, attempting next candidate:`, modelErr);
        lastError = modelErr;
      }
    }

    if (lastError) {
      throw lastError;
    }
    throw new Error('Unable to generate structured physique analysis from Gemini response.');
  };

  return await withTimeoutAndRetry(runPhysiqueAnalysis, 25000, 1, 'Gemini Physique Analysis');
}

