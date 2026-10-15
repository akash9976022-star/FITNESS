import { GoogleGenAI } from '@google/genai';
import type { ExperienceLevel, MaintenanceGoal } from '../types/auth';
import type { AiPhysiqueAnalysis } from '../types/rewards';
import { fileToBase64 } from './aiVisionNutrition';

/**
 * Clean and parse Gemini response JSON, handling markdown formatting (```json ... ```)
 */
const cleanAndParsePhysiqueJson = (rawText: string): any => {
  if (!rawText) {
    throw new Error('Received empty text from Gemini API');
  }

  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
  }

  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    console.error('Failed to parse Gemini physique JSON:', cleaned);
    throw new Error(`JSON parsing syntax error: ${err.message}`);
  }
};

/**
 * Deterministic fallback physique analysis in case of network unavailability or offline usage.
 */
export const generateFallbackPhysiqueAnalysis = (options: {
  weightKg: number;
  targetWeightKg: number;
  experienceLevel: ExperienceLevel;
  maintenanceGoal?: MaintenanceGoal;
}): AiPhysiqueAnalysis => {
  const { weightKg, targetWeightKg, experienceLevel, maintenanceGoal = 'maintenance' } = options;
  const variance = parseFloat((weightKg - targetWeightKg).toFixed(2));
  const absVariance = Math.abs(variance);

  let maintenanceRating: AiPhysiqueAnalysis['maintenanceRating'] = 'Peak Equilibrium';
  let perceivedDefinition = 'Solid muscular fullness with moderate core separation';
  let postureAlignment = 'Neutral spine with symmetrical clavicle alignment';
  let bodyCompositionTrend = 'Stable lean mass balance with optimal hydration';
  let summary = `Weight is closely aligned at ${weightKg} kg (±${absVariance} kg from maintenance target). Muscle tone is preserved.`;

  if (absVariance <= 0.4) {
    maintenanceRating = 'Peak Equilibrium';
    perceivedDefinition =
      experienceLevel === 'pro'
        ? 'High vascularity and prominent deltoid/abdominal separation with minimal extracellular water'
        : 'Clear core definition and balanced upper torso muscularity';
    postureAlignment = 'Upright posture, neutral scapular retracted position, level hips';
    bodyCompositionTrend = 'Closed-loop metabolic equilibrium with zero unwanted adipose gain';
    summary = `Physique reflects immaculate energy balance at ${weightKg} kg. Glycogen reserves are full while subcutaneous fluid is minimal.`;
  } else if (variance > 0.4) {
    maintenanceRating = 'Slight Surplus';
    perceivedDefinition = 'Full muscle bellies with minor temporary water retention';
    postureAlignment = 'Slight anterior pelvic tilt potential; maintain abdominal brace';
    bodyCompositionTrend = 'Mild positive caloric surplus (+ ' + variance + ' kg)';
    summary = `Temporary scale elevation of +${variance} kg detected. Visual appearance suggests normal glycogen supercompensation or hydration retention.`;
  } else {
    maintenanceRating = 'Slight Deficit';
    perceivedDefinition = 'Sharper muscle striations with slightly reduced intracellular glycogen pump';
    postureAlignment = 'Slight thoracic flexion; focus on active rear delt retraction';
    bodyCompositionTrend = 'Mild negative caloric flux (' + variance + ' kg)';
    summary = `Scale is -${absVariance} kg below target. Physique remains lean and athletic; consider adding a clean carbohydrate refeed.`;
  }

  const keyObservations = [
    `Current scale weight: ${weightKg} kg vs. ${targetWeightKg} kg target (${variance >= 0 ? '+' : ''}${variance} kg delta).`,
    `Biomechanical alignment is solid for ${experienceLevel} level athletes with focus on ${maintenanceGoal}.`,
    `Silhouette indicates consistent training volume and steady metabolic homeostasis.`,
  ];

  const recommendedAction =
    absVariance <= 0.4
      ? 'Maintain current training sets and caloric targets. Ready for programmed maintenance session.'
      : variance > 0
      ? 'Keep dietary sodium steady and maintain scheduled hydration. No need to drastically cut calories.'
      : 'Include an extra serving of complex carbs (oats, sweet potato, or rice) to restore optimal muscle fullness.';

  return {
    perceivedDefinition,
    postureAlignment,
    bodyCompositionTrend,
    visualProgressSummary: summary,
    maintenanceRating,
    confidenceScore: 'Medium',
    keyObservations,
    recommendedAction,
    analyzedAt: new Date().toISOString(),
  };
};

/**
 * Multimodal AI Body Type & Physique Analysis
 * Uses official @google/genai SDK to analyze daily check-in photos.
 */
export const analyzePhysiquePhoto = async (
  image: Blob | File | string,
  options: {
    weightKg: number;
    targetWeightKg: number;
    experienceLevel: ExperienceLevel;
    maintenanceGoal?: MaintenanceGoal;
    notes?: string;
  }
): Promise<AiPhysiqueAnalysis> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  // 1. Convert image to clean base64
  let base64Data = '';
  let mimeType = 'image/jpeg';

  try {
    if (typeof image === 'string') {
      if (image.startsWith('data:')) {
        const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        } else {
          base64Data = image.split(',')[1] || image;
        }
      } else if (image.startsWith('http://') || image.startsWith('https://')) {
        const resp = await fetch(image);
        const blob = await resp.blob();
        mimeType = blob.type || 'image/jpeg';
        base64Data = await fileToBase64(blob);
      }
    } else {
      mimeType = image.type || 'image/jpeg';
      base64Data = await fileToBase64(image);
    }
  } catch (err) {
    console.warn('Failed to extract base64 from physique photo:', err);
  }

  // 2. Call Gemini AI if API key and base64 exist
  if (apiKey && base64Data) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are an elite sports physiologist and physique assessment AI specializing in athletic body maintenance, muscular definition tracking, and biomechanical posture analysis.
Analyze the user's physique check-in photo with clinical precision relative to their current weight (${options.weightKg} kg), target maintenance weight (${options.targetWeightKg} kg), experience level (${options.experienceLevel}), and maintenance goal (${options.maintenanceGoal || 'maintenance'}).
${options.notes ? `User notes: "${options.notes}"` : ''}

Evaluate:
1. Perceived visual muscle definition (core separation, shoulder/deltoid cap, chest/back tone, vascularity).
2. Postural alignment (shoulder level symmetry, thoracic neutrality, head/neck alignment).
3. Body composition trends relative to their maintenance equilibrium (e.g., lean density vs fluid retention).
4. Provide 3 specific, encouraging, and scientifically sound key observations.
5. Provide 1 actionable training/recovery recommendation for today.

Return the result STRICTLY as a valid JSON object matching this schema:
{
  "perceivedDefinition": "string",
  "postureAlignment": "string",
  "bodyCompositionTrend": "string",
  "visualProgressSummary": "string",
  "maintenanceRating": "Peak Equilibrium" | "Optimal Recomp" | "Slight Deficit" | "Slight Surplus",
  "confidenceScore": "High" | "Medium" | "Low",
  "keyObservations": ["string", "string", "string"],
  "recommendedAction": "string"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
      });

      const parsed = cleanAndParsePhysiqueJson(response.text || '');

      return {
        perceivedDefinition: parsed.perceivedDefinition || 'Sustained athletic muscle density',
        postureAlignment: parsed.postureAlignment || 'Neutral spinal alignment',
        bodyCompositionTrend: parsed.bodyCompositionTrend || 'Stable maintenance equilibrium',
        visualProgressSummary: parsed.visualProgressSummary || 'Physique matches maintenance benchmarks.',
        maintenanceRating: parsed.maintenanceRating || 'Peak Equilibrium',
        confidenceScore: parsed.confidenceScore || 'High',
        keyObservations: Array.isArray(parsed.keyObservations) && parsed.keyObservations.length > 0
          ? parsed.keyObservations
          : [
              'Stable body composition observed.',
              'Good posture and muscular balance.',
              'On track with target equilibrium.',
            ],
        recommendedAction: parsed.recommendedAction || 'Continue your programmed maintenance routine.',
        analyzedAt: new Date().toISOString(),
      };
    } catch (aiErr) {
      console.warn('Gemini physique analysis error, falling back to deterministic heuristic:', aiErr);
    }
  }

  // 3. Graceful Fallback
  return generateFallbackPhysiqueAnalysis(options);
};
