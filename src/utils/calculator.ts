import type { ActivityLevel, Gender } from '../types/auth';

export interface CalculationInput {
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
}

export interface MacroBreakdown {
  bmr: number;
  tdee: number;
  targetProtein: number; // in grams
  targetCarbs: number;   // in grams
  targetFats: number;    // in grams
  waterGoalMl: number;   // in ml
}

/**
 * Calculates BMR and Maintenance Calories (TDEE) using the Mifflin-St Jeor formula:
 * Men:   BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age + 5
 * Women: BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age - 161
 * Other: average of male and female baseline
 */
export function calculateMifflinStJeor(input: CalculationInput): MacroBreakdown {
  const { age, gender, weightKg, heightCm, activityLevel } = input;

  const baseBMR = 10 * weightKg + 6.25 * heightCm - 5 * age;
  let bmr = baseBMR;

  if (gender === 'male') {
    bmr += 5;
  } else if (gender === 'female') {
    bmr -= 161;
  } else {
    // Neutral median
    bmr -= 78;
  }

  const activityMultipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,        // Little or no exercise / desk job
    light: 1.375,          // Light exercise 1-3 days/week
    moderate: 1.55,        // Moderate exercise 3-5 days/week
    very_active: 1.725,    // Hard exercise 6-7 days/week
  };

  const multiplier = activityMultipliers[activityLevel] || 1.55;
  const tdee = Math.round(bmr * multiplier);

  // Muscle Maintenance Macro Targets:
  // Protein: ~2.0g - 2.2g per kg of bodyweight for lean tissue preservation
  const targetProtein = Math.round(weightKg * 2.2);

  // Fats: ~25% of total caloric intake
  const targetFats = Math.round((tdee * 0.25) / 9);

  // Carbs: Remainder of total calories (tdee - (protein*4 + fats*9)) / 4
  const targetCarbs = Math.max(50, Math.round((tdee - (targetProtein * 4 + targetFats * 9)) / 4));

  // Daily water recommendation: ~35-40 ml per kg
  const waterGoalMl = Math.round(weightKg * 40);

  return {
    bmr: Math.round(bmr),
    tdee,
    targetProtein,
    targetCarbs,
    targetFats,
    waterGoalMl,
  };
}
