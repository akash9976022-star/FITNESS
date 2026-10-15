import type { WorkoutExerciseItem, WorkoutSessionItem, ExerciseSetItem } from './workout';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerId?: string;
  isDemo?: boolean;
}

export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active';
export type MaintenanceGoal = 'maintenance' | 'recomp' | 'lean_bulk';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'pro';
export type ReadinessLevel = 'low' | 'moderate' | 'high';

export type BmiCategory =
  | 'underweight'
  | 'normal'
  | 'overweight'
  | 'obese'
  | 'Underweight'
  | 'Normal'
  | 'Overweight'
  | 'Obese';

export interface EquipmentItemDefinition {
  id: string;
  name: string;
  category: 'Cables & Pulleys' | 'Machines' | 'Free Weights & Benches' | 'Bodyweight / Minimal';
  description?: string;
}

export interface UserProfileData {
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  targetMaintenanceWeightKg: number;
  activityLevel: ActivityLevel;
  maintenanceGoal: MaintenanceGoal;
  experienceLevel: ExperienceLevel;
  equipment: string[];
  onboardingCompleted: boolean;
  targetCalories: number;
  targetProtein: number; // in grams
  targetCarbs: number;   // in grams
  targetFats: number;    // in grams
  waterGoalMl: number;
  stepGoal?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface AiPhysiqueAnalysis {
  maintenanceRating?: string;
  perceivedDefinition?: string;
  postureAlignment?: string;
  recommendedAction?: string;
  rawJson?: any;
  estimatedBodyFat?: string | number;
  muscleMassRating?: string;
  keyStrengths?: string[];
  areasToTarget?: string[];
  [key: string]: any;
}

export interface DailyCheckInItem {
  id: string;
  date: string;
  weight: number;
  readiness: ReadinessLevel;
  photo_url?: string;
  experience_level: ExperienceLevel;
  notes?: string;
  aiPhysiqueAnalysis?: AiPhysiqueAnalysis;
  createdAt?: any;
  updatedAt?: any;
}

export type MealCategory =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'Breakfast'
  | 'Lunch'
  | 'Dinner'
  | 'Snacks';

export interface NutritionLogItem {
  id?: string;
  date: string;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  photo_url?: string;
  meal_type?: MealCategory;
  notes?: string;
  confidence?: number;
  createdAt?: any;
  updatedAt?: any;
}

export type { WorkoutExerciseItem, ExerciseSetItem, WorkoutSessionItem };
export type WorkoutExercise = WorkoutExerciseItem;

