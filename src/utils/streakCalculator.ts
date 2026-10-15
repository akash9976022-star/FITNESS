import type { DailyCheckInItem, WorkoutSessionItem } from '../types/auth';
import type { StreakData } from '../types/calendar';

export function calculateConsistencyStreak(
  checkIns: DailyCheckInItem[],
  workouts: WorkoutSessionItem[],
  cachedLongestStreak = 0
): StreakData {
  // Aggregate all unique active dates (YYYY-MM-DD)
  const activeDatesSet = new Set<string>();

  checkIns.forEach((c) => {
    if (c.date) {
      activeDatesSet.add(c.date.split('T')[0]);
    }
  });

  workouts.forEach((w) => {
    if (w.date && (w.completed || (w.completedSets && w.completedSets > 0))) {
      activeDatesSet.add(w.date.split('T')[0]);
    }
  });

  const activeDates = Array.from(activeDatesSet).sort(); // Ascending order
  const totalActiveDays = activeDates.length;

  if (totalActiveDays === 0) {
    return {
      currentStreak: 0,
      longestStreak: cachedLongestStreak || 0,
      lastActiveDate: '',
      totalActiveDays: 0,
      weeklyActivity: [false, false, false, false, false, false, false],
      level: 'Spark Initiate',
      nextMilestone: 3,
    };
  }

  // Calculate today and yesterday in local timezone
  const now = new Date();
  const formatYMD = (d: Date) => d.toISOString().split('T')[0];

  const todayStr = formatYMD(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatYMD(yesterday);

  // Check current streak backwards from today or yesterday
  let streak = 0;
  let checkDate = new Date(now);

  const isActiveOnDate = (dateStr: string) => activeDatesSet.has(dateStr);

  // If today is active, start counting from today
  if (isActiveOnDate(todayStr)) {
    streak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else if (isActiveOnDate(yesterdayStr)) {
    // If today is not yet logged, but yesterday was active, the streak is alive!
    streak = 1;
    checkDate = new Date(yesterday);
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // Neither today nor yesterday was active -> streak broken
    streak = 0;
  }

  if (streak > 0) {
    while (true) {
      const prevDateStr = formatYMD(checkDate);
      if (isActiveOnDate(prevDateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak from historical list
  let maxStreak = Math.max(streak, cachedLongestStreak);
  let tempStreak = 0;
  let prevTimestamp = 0;

  for (let i = 0; i < activeDates.length; i++) {
    const curDate = new Date(activeDates[i] + 'T00:00:00');
    const curTimestamp = curDate.getTime();

    if (i === 0) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((curTimestamp - prevTimestamp) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    prevTimestamp = curTimestamp;
    if (tempStreak > maxStreak) {
      maxStreak = tempStreak;
    }
  }

  // Calculate current week activity (Sunday to Saturday)
  const currentDayOfWeek = now.getDay(); // 0 is Sunday
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - currentDayOfWeek);

  const weeklyActivity: boolean[] = [];
  for (let d = 0; d < 7; d++) {
    const dayDate = new Date(startOfWeek);
    dayDate.setDate(startOfWeek.getDate() + d);
    weeklyActivity.push(isActiveOnDate(formatYMD(dayDate)));
  }

  // Determine Level Title
  let level = 'Spark Initiate';
  if (streak >= 30) level = 'Legend of Persistence';
  else if (streak >= 14) level = 'Discipline Master';
  else if (streak >= 7) level = 'Equilibrium Athlete';
  else if (streak >= 3) level = 'Consistency Seeker';

  // Determine Next Milestone
  const milestones = [3, 7, 14, 21, 30, 60, 90, 100, 365];
  const nextMilestone = milestones.find((m) => m > streak) || streak + 10;

  return {
    currentStreak: streak,
    longestStreak: maxStreak,
    lastActiveDate: activeDates[activeDates.length - 1],
    totalActiveDays,
    weeklyActivity,
    level,
    nextMilestone,
    updatedAt: new Date().toISOString(),
  };
}
