export type MilestoneTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type MilestoneCategory =
  | 'checkin'
  | 'streak'
  | 'nutrition'
  | 'workout'
  | 'milestone';

export interface MilestoneBadge {
  id: string;
  title: string;
  category: MilestoneCategory;
  description: string;
  iconName: string;
  tier: MilestoneTier;
  unlocked: boolean;
  unlockedAt?: string; // ISO date string (YYYY-MM-DD or timestamp)
  progress: number; // 0 to 100 percentage
  progressLabel: string; // e.g. "1 / 1 Check-ins", "5 / 7 Streak Days", "3 / 5 Days"
  createdAt?: any;
  updatedAt?: any;
}

export interface UserRewardsSummary {
  totalBadges: number;
  unlockedCount: number;
  totalPoints: number;
  badges: MilestoneBadge[];
  lastEvaluatedAt?: string;
}

export interface AiPhysiqueAnalysis {
  perceivedDefinition: string;     // e.g. "Moderate core separation & broad shoulder deltoids"
  postureAlignment: string;        // e.g. "Neutral spinal alignment with upright cervical positioning"
  bodyCompositionTrend: string;    // e.g. "Equilibrium maintained without fluid accumulation"
  visualProgressSummary: string;   // e.g. "Visual tone indicates strong glycogen fullness with minimal subcutaneous fluid accumulation."
  maintenanceRating: 'Peak Equilibrium' | 'Optimal Recomp' | 'Slight Deficit' | 'Slight Surplus';
  confidenceScore: 'High' | 'Medium' | 'Low';
  keyObservations: string[];       // 2-4 key bullet points
  recommendedAction: string;       // e.g. "Maintain current volume and hydration. Ready for tomorrow's push session."
  analyzedAt?: string;             // ISO date/time
}
