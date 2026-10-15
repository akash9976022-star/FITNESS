import type {
  DailyCheckInItem,
  NutritionLogItem,
  WorkoutSessionItem,
} from '../types/auth';
import type { StreakData } from '../types/calendar';
import type { MilestoneBadge, UserRewardsSummary } from '../types/rewards';

export const INITIAL_BADGES_DEFINITIONS: Omit<MilestoneBadge, 'unlocked' | 'progress' | 'progressLabel' | 'unlockedAt'>[] = [
  {
    id: 'first_step',
    title: 'First Step',
    category: 'checkin',
    description: 'Completed your very first daily check-in & progress photo.',
    iconName: 'Camera',
    tier: 'bronze',
  },
  {
    id: 'streak_master_7',
    title: 'Consistency King',
    category: 'streak',
    description: 'Maintained an unbroken 7-day check-in & workout streak.',
    iconName: 'Flame',
    tier: 'silver',
  },
  {
    id: 'streak_master_30',
    title: 'Streak Master',
    category: 'streak',
    description: 'Maintained an extraordinary 30-day consistency streak.',
    iconName: 'Trophy',
    tier: 'gold',
  },
  {
    id: 'maintenance_anchor',
    title: 'Maintenance Anchor',
    category: 'nutrition',
    description: 'Successfully hit maintenance calorie equilibrium for 5 consecutive days.',
    iconName: 'Anchor',
    tier: 'gold',
  },
  {
    id: 'visual_milestone',
    title: 'Visual Milestone',
    category: 'milestone',
    description: 'Uploaded ghost-guided check-in photos across 4 distinct weeks.',
    iconName: 'Sparkles',
    tier: 'platinum',
  },
  {
    id: 'iron_starter',
    title: 'Iron Starter',
    category: 'workout',
    description: 'Completed and logged your first equipment-aware workout session.',
    iconName: 'Dumbbell',
    tier: 'bronze',
  },
  {
    id: 'volume_crusher',
    title: 'Volume Crusher',
    category: 'workout',
    description: 'Accumulated over 10,000 kg of total workout volume.',
    iconName: 'Award',
    tier: 'silver',
  },
  {
    id: 'clean_fuel',
    title: 'Clean Fuel Architect',
    category: 'nutrition',
    description: 'Logged 10 wholesome nutrition meals using AI food vision.',
    iconName: 'Utensils',
    tier: 'bronze',
  },
];

/**
 * Helper to compute ISO week number for photo distribution
 */
const getWeekKey = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return `${d.getFullYear()}-W${weekNumber}`;
};

/**
 * Calculates current status and unlocks for all milestone badges.
 */
export const evaluateMilestones = (params: {
  checkIns: DailyCheckInItem[];
  streakData: StreakData;
  nutritionLogs: NutritionLogItem[];
  workoutsHistory: WorkoutSessionItem[];
  targetCalories?: number;
  existingRewards?: MilestoneBadge[];
}): UserRewardsSummary => {
  const {
    checkIns = [],
    streakData,
    nutritionLogs = [],
    workoutsHistory = [],
    targetCalories = 2450,
    existingRewards = [],
  } = params;

  const existingMap = new Map<string, MilestoneBadge>();
  existingRewards.forEach((b) => existingMap.set(b.id, b));

  const badges: MilestoneBadge[] = INITIAL_BADGES_DEFINITIONS.map((def) => {
    const existing = existingMap.get(def.id);
    let unlocked = existing?.unlocked || false;
    let unlockedAt = existing?.unlockedAt;
    let progress = 0;
    let progressLabel = '';

    const todayStr = new Date().toISOString().split('T')[0];

    switch (def.id) {
      case 'first_step': {
        const hasPhotoCheckIn = checkIns.some((c) => !!c.photo_url);
        progress = hasPhotoCheckIn ? 100 : checkIns.length > 0 ? 50 : 0;
        progressLabel = hasPhotoCheckIn ? '1 / 1 Check-In Photo' : '0 / 1 Check-In Photo';
        if (hasPhotoCheckIn && !unlocked) {
          unlocked = true;
          unlockedAt = checkIns.find((c) => !!c.photo_url)?.date || todayStr;
        }
        break;
      }

      case 'streak_master_7': {
        const bestStreak = Math.max(streakData?.currentStreak || 0, streakData?.longestStreak || 0);
        progress = Math.min(100, Math.round((bestStreak / 7) * 100));
        progressLabel = `${Math.min(7, bestStreak)} / 7 Days`;
        if (bestStreak >= 7 && !unlocked) {
          unlocked = true;
          unlockedAt = todayStr;
        }
        break;
      }

      case 'streak_master_30': {
        const bestStreak = Math.max(streakData?.currentStreak || 0, streakData?.longestStreak || 0);
        progress = Math.min(100, Math.round((bestStreak / 30) * 100));
        progressLabel = `${Math.min(30, bestStreak)} / 30 Days`;
        if (bestStreak >= 30 && !unlocked) {
          unlocked = true;
          unlockedAt = todayStr;
        }
        break;
      }

      case 'maintenance_anchor': {
        // Group nutrition logs by date and calculate total calories
        const caloriesByDate = new Map<string, number>();
        nutritionLogs.forEach((log) => {
          caloriesByDate.set(
            log.date,
            (caloriesByDate.get(log.date) || 0) + (log.calories || 0)
          );
        });

        // Count days within ±15% of target calories
        let balancedDays = 0;
        const minTarget = targetCalories * 0.85;
        const maxTarget = targetCalories * 1.15;

        caloriesByDate.forEach((cals) => {
          if (cals >= minTarget && cals <= maxTarget) {
            balancedDays++;
          }
        });

        progress = Math.min(100, Math.round((balancedDays / 5) * 100));
        progressLabel = `${Math.min(5, balancedDays)} / 5 Days Balanced`;
        if (balancedDays >= 5 && !unlocked) {
          unlocked = true;
          unlockedAt = todayStr;
        }
        break;
      }

      case 'visual_milestone': {
        const photoWeeks = new Set<string>();
        checkIns.forEach((c) => {
          if (c.photo_url) {
            photoWeeks.add(getWeekKey(c.date));
          }
        });
        const distinctWeeks = photoWeeks.size;
        progress = Math.min(100, Math.round((distinctWeeks / 4) * 100));
        progressLabel = `${Math.min(4, distinctWeeks)} / 4 Distinct Weeks`;
        if (distinctWeeks >= 4 && !unlocked) {
          unlocked = true;
          unlockedAt = todayStr;
        }
        break;
      }

      case 'iron_starter': {
        const completedWorkouts = workoutsHistory.filter((w) => w.completed).length;
        progress = completedWorkouts > 0 ? 100 : 0;
        progressLabel = completedWorkouts > 0 ? '1 / 1 Workout Finished' : '0 / 1 Completed Workout';
        if (completedWorkouts > 0 && !unlocked) {
          unlocked = true;
          unlockedAt = workoutsHistory.find((w) => w.completed)?.date || todayStr;
        }
        break;
      }

      case 'volume_crusher': {
        let totalVol = 0;
        workoutsHistory.forEach((w) => {
          w.exercises?.forEach((ex) => {
            if (ex.setList && ex.setList.length > 0) {
              ex.setList.forEach((s) => {
                if (s.completed) {
                  const wNum = parseFloat(s.weight) || 0;
                  const rNum = parseInt(s.reps, 10) || 0;
                  totalVol += wNum * rNum;
                }
              });
            } else if (ex.completed) {
              const wNum = parseFloat(ex.weight) || 0;
              const rNum = parseInt(ex.reps, 10) || 10;
              totalVol += wNum * rNum * (ex.completedSets || ex.sets || 1);
            }
          });
        });

        const targetVol = 10000;
        progress = Math.min(100, Math.round((totalVol / targetVol) * 100));
        progressLabel = `${Math.round(totalVol).toLocaleString()} / 10,000 kg`;
        if (totalVol >= targetVol && !unlocked) {
          unlocked = true;
          unlockedAt = todayStr;
        }
        break;
      }

      case 'clean_fuel': {
        const count = nutritionLogs.length;
        progress = Math.min(100, Math.round((count / 10) * 100));
        progressLabel = `${Math.min(10, count)} / 10 Meals Logged`;
        if (count >= 10 && !unlocked) {
          unlocked = true;
          unlockedAt = todayStr;
        }
        break;
      }
    }

    return {
      ...def,
      unlocked,
      unlockedAt,
      progress,
      progressLabel,
    };
  });

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  // Calculate points: Bronze = 100, Silver = 250, Gold = 500, Platinum = 1000
  const totalPoints = badges.reduce((acc, b) => {
    if (!b.unlocked) return acc;
    switch (b.tier) {
      case 'bronze':
        return acc + 100;
      case 'silver':
        return acc + 250;
      case 'gold':
        return acc + 500;
      case 'platinum':
        return acc + 1000;
      default:
        return acc + 100;
    }
  }, 0);

  return {
    totalBadges: badges.length,
    unlockedCount,
    totalPoints,
    badges,
    lastEvaluatedAt: new Date().toISOString(),
  };
};
