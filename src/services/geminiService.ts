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

const SYSTEM_INSTRUCTION = `You are FitMaintenance AI Coach — an elite sports nutritionist, hypertrophy exercise scientist, and metabolic rate coach.
Your core mission is to help athletes and fitness enthusiasts calculate their true maintenance calories, optimize macronutrients (Protein, Carbs, Fats), navigate reverse dieting, and apply progressive overload.
Always give concise, scientifically grounded, and practical answers formatted clearly with clean bullet points or short paragraphs.`;

function fallbackFitnessAnswer(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes('leg') || lower.includes('heavy') || lower.includes('split')) {
    return 'On heavy compound leg days, your glycogen consumption spikes drastically. Consider shifting 30–40g of carbohydrates from rest days into your peri-workout meals (90 mins before and right after training) while maintaining your weekly average caloric balance.';
  }
  if (lower.includes('macro') || lower.includes('protein') || lower.includes('muscle')) {
    return 'For optimal body recomposition at maintenance:\n• **Protein**: 1.8–2.2g per kg bodyweight to preserve lean mass\n• **Fats**: 20–25% of total caloric intake for hormone and joint health\n• **Carbohydrates**: Remainder of your calories to fuel anaerobic output and glycogen replenishment.';
  }
  if (lower.includes('metabolic') || lower.includes('reverse') || lower.includes('cut')) {
    return 'To restore thyroid and leptin levels after a deficit without gaining fat, reverse diet by increasing calories by +100 to +150 kcal per week until reaching your estimated maintenance. Monitor your 7-day average body weight to confirm equilibrium.';
  }
  return 'To determine your true maintenance caloric intake: consume your calculated baseline calories for 14 consecutive days and track your morning fasted weight. If your 7-day rolling weight average changes by less than ±0.3%, you are in true thermodynamic equilibrium.';
}

export async function askFitMaintenanceAI(prompt: string): Promise<string> {
  if (!aiClient || !apiKey) {
    return fallbackFitnessAnswer(prompt);
  }

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    if (response?.text) {
      return response.text;
    }
    return fallbackFitnessAnswer(prompt);
  } catch (error) {
    console.warn('Gemini API call encountered an issue, using scientific fallback response:', error);
    return fallbackFitnessAnswer(prompt);
  }
}
