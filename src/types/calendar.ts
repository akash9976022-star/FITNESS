export type FestivalCategory =
  | 'major_festival'
  | 'viratham'
  | 'sashti'
  | 'purattasi_sani'
  | 'ekadashi'
  | 'pradosham'
  | 'amavasai'
  | 'pournami'
  | 'custom';

export type FastingType =
  | 'strict_water'
  | 'fruit_milk'
  | 'sattvic_vegetarian'
  | 'single_meal'
  | 'intermittent_16_8'
  | 'none';

export interface TamilDate {
  gregorianDate: string; // YYYY-MM-DD
  tamilYearEn: string;
  tamilYearTa: string;
  tamilMonthEn: string;
  tamilMonthTa: string;
  tamilMonthIndex: number; // 1 to 12
  tamilDay: number;
  dayOfWeekEn: string;
  dayOfWeekTa: string;
}

export interface TamilFestival {
  id: string;
  nameEn: string;
  nameTa: string;
  date: string; // YYYY-MM-DD
  category: FestivalCategory;
  deity?: string;
  isFastingDay: boolean;
  fastingType: FastingType;
  significanceEn: string;
  significanceTa?: string;
  dietaryGuidance: string;
  workoutGuidance: string;
  specialNote?: string;
  isCustom?: boolean;
}

export type CustomFestivalCategory =
  | 'temple_festival'
  | 'family_pooja'
  | 'custom_fast'
  | 'community'
  | 'milestone';

export interface CustomFestival {
  id: string;
  userId?: string;
  title: string;
  titleTa?: string;
  date: string; // YYYY-MM-DD
  category: CustomFestivalCategory;
  dietaryPreference: 'vegetarian' | 'fruit_milk' | 'water_fast' | 'feast' | 'standard';
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  totalActiveDays: number;
  weeklyActivity: boolean[]; // 7 days of current week (Sun to Sat or Mon to Sun)
  level: string;
  nextMilestone: number;
  updatedAt?: any;
}

export interface PanchangamTimings {
  date: string; // YYYY-MM-DD
  dayOfWeekEn: string;
  dayOfWeekTa: string;
  nallaNeramMorning: string;
  nallaNeramEvening: string;
  gowriNallaNeramMorning: string;
  gowriNallaNeramEvening: string;
  ragukalam: string;
  yemagandam: string;
  kuligai: string;
  tithiEn: string;
  tithiTa: string;
  nakshatramEn: string;
  nakshatramTa: string;
  chandrashtamamRasiEn?: string;
  chandrashtamamRasiTa?: string;
  auspiciousSummary: string;
}

export type TamilRasiId =
  | 'mesham'
  | 'rishabham'
  | 'mithunam'
  | 'katagam'
  | 'simmam'
  | 'kanni'
  | 'tula'
  | 'vrichigam'
  | 'dhanusu'
  | 'magaram'
  | 'kumbham'
  | 'meenam';

export interface TamilZodiacSign {
  id: TamilRasiId;
  nameEn: string;
  nameTa: string;
  symbol: string;
  westernSign: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  elementTa: string;
  rulingPlanet: string;
  rulingPlanetTa: string;
}

export interface RasipalanPrediction {
  rasiId: TamilRasiId;
  date: string;
  generalOutlookEn: string;
  generalOutlookTa: string;
  energyScore: number; // 1 to 100
  fitnessFocusEn: string;
  fitnessFocusTa: string;
  nutritionTipEn: string;
  nutritionTipTa: string;
  workoutRecommendation: 'heavy_strength' | 'hypertrophy' | 'active_recovery' | 'hiit_cardio' | 'mobility_yoga';
  luckyColor: string;
  luckyDirection: string;
}
