import type { NotificationSettings } from '../types/notifications';

/**
 * Format a Date object into Google Calendar ISO format: YYYYMMDDTHHmmSSZ
 */
const formatGoogleCalendarDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

/**
 * Build a standard recurring Google Calendar Web Intent URL
 * This allows 1-click addition of daily repeating reminders directly into Google Calendar on mobile & web.
 */
export const buildGoogleCalendarIntentUrl = (options: {
  title: string;
  description: string;
  timeStr: string; // "HH:MM"
  durationMinutes?: number;
  recurrence?: string; // Default: "RRULE:FREQ=DAILY"
  location?: string;
}): string => {
  const {
    title,
    description,
    timeStr,
    durationMinutes = 30,
    recurrence = 'RRULE:FREQ=DAILY',
    location = 'FitMaintenance AI App (localhost:5173)',
  } = options;

  const [hours, minutes] = timeStr.split(':').map((n) => parseInt(n, 10));

  // Set start time for tomorrow or today
  const start = new Date();
  start.setHours(hours, minutes, 0, 0);
  if (start.getTime() <= Date.now()) {
    start.setDate(start.getDate() + 1);
  }

  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const startFormatted = formatGoogleCalendarDate(start);
  const endFormatted = formatGoogleCalendarDate(end);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: `${description}\n\nAutomated via FitMaintenance AI: Closed-Loop Body Maintenance.`,
    dates: `${startFormatted}/${endFormatted}`,
    recur: recurrence,
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export interface GoogleReminderIntentItem {
  id: string;
  label: string;
  category: 'checkin' | 'meal' | 'workout';
  time: string;
  intentUrl: string;
  description: string;
}

/**
 * Generate all direct Google Calendar intent links for enabled reminders
 */
export const generateAllCalendarIntents = (settings: NotificationSettings): GoogleReminderIntentItem[] => {
  const items: GoogleReminderIntentItem[] = [];

  if (settings.morningReminder) {
    items.push({
      id: 'morning_checkin',
      label: 'Morning Check-In & Ghost Photo',
      category: 'checkin',
      time: settings.morningReminderTime,
      description: 'Daily weigh-in and front-view silhouette photo to track body composition equilibrium.',
      intentUrl: buildGoogleCalendarIntentUrl({
        title: '🌅 Morning Check-In & Fasted Weigh-In',
        description: 'Track daily morning scale weight and ghost camera photo in FitMaintenance AI.',
        timeStr: settings.morningReminderTime,
        durationMinutes: 15,
      }),
    });
  }

  if (settings.mealReminders) {
    if (settings.mealBreakfast) {
      items.push({
        id: 'meal_breakfast',
        label: 'Breakfast Nutrition Log',
        category: 'meal',
        time: settings.mealBreakfastTime,
        description: 'Scan or log breakfast macros with AI Food Scanner to start the day in caloric balance.',
        intentUrl: buildGoogleCalendarIntentUrl({
          title: '🍳 Breakfast Nutrition Log',
          description: 'Log breakfast calories and protein with FitMaintenance AI Food Scanner.',
          timeStr: settings.mealBreakfastTime,
          durationMinutes: 15,
        }),
      });
    }

    if (settings.mealLunch) {
      items.push({
        id: 'meal_lunch',
        label: 'Lunch Nutrition Log',
        category: 'meal',
        time: settings.mealLunchTime,
        description: 'Midday meal tracking to keep muscle protein synthesis and amino pool optimal.',
        intentUrl: buildGoogleCalendarIntentUrl({
          title: '🥗 Lunch Nutrition Log',
          description: 'Log midday meal macros in FitMaintenance AI.',
          timeStr: settings.mealLunchTime,
          durationMinutes: 15,
        }),
      });
    }

    if (settings.mealDinner) {
      items.push({
        id: 'meal_dinner',
        label: 'Dinner & Daily Review',
        category: 'meal',
        time: settings.mealDinnerTime,
        description: 'Final meal check to verify meeting daily protein targets and maintenance corridor.',
        intentUrl: buildGoogleCalendarIntentUrl({
          title: '🍲 Dinner & Daily Calorie Review',
          description: 'Final check of daily macronutrients and maintenance equilibrium in FitMaintenance AI.',
          timeStr: settings.mealDinnerTime,
          durationMinutes: 15,
        }),
      });
    }
  }

  if (settings.workoutReminder) {
    items.push({
      id: 'workout_session',
      label: 'Equipment-Aware Workout',
      category: 'workout',
      time: settings.workoutReminderTime,
      description: 'Daily training routine tailored to available gym machines and compound retention.',
      intentUrl: buildGoogleCalendarIntentUrl({
        title: '🏋️ Equipment Workout Session',
        description: 'Execute your programmed maintenance workout routine in FitMaintenance AI.',
        timeStr: settings.workoutReminderTime,
        durationMinutes: 60,
      }),
    });
  }

  return items;
};

/**
 * Google Tasks API Sync:
 * Creates a dedicated "FitMaintenance AI" Task List and adds daily tasks
 */
export const syncWithGoogleTasksApi = async (accessToken: string, settings: NotificationSettings) => {
  try {
    // 1. Get or create TaskList
    const listRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const listsData = await listRes.json();
    let targetListId = listsData.items?.find((l: any) => l.title === 'FitMaintenance AI')?.id;

    if (!targetListId) {
      const createListRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'FitMaintenance AI' }),
      });
      const createdList = await createListRes.json();
      targetListId = createdList.id;
    }

    // 2. Add tasks for enabled reminders
    const tasksToAdd = [
      {
        enabled: settings.morningReminder,
        title: `Morning Check-In & Photo (${settings.morningReminderTime})`,
        notes: 'Fasted scale weigh-in and ghost silhouette progress photo.',
      },
      {
        enabled: settings.mealReminders,
        title: 'Log Nutrition & AI Food Scans',
        notes: 'Track breakfast, lunch, and dinner to stay in maintenance equilibrium.',
      },
      {
        enabled: settings.workoutReminder,
        title: `Workout Session (${settings.workoutReminderTime})`,
        notes: 'Log completed sets and weights in FitMaintenance AI.',
      },
    ];

    const results = [];
    for (const task of tasksToAdd) {
      if (!task.enabled) continue;
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${targetListId}/tasks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: task.title,
          notes: task.notes,
        }),
      });
      results.push(await res.json());
    }

    return { success: true, count: results.length };
  } catch (err: any) {
    console.error('Google Tasks API sync failed:', err);
    throw new Error(err.message || 'Google Tasks sync failed.');
  }
};

/**
 * Google Calendar API Sync (Direct REST API insertion with daily recurrence)
 */
export const syncWithGoogleCalendarApi = async (accessToken: string, settings: NotificationSettings) => {
  const events = [
    {
      enabled: settings.morningReminder,
      summary: '🌅 FitMaintenance: Morning Check-In & Photo',
      description: 'Daily weigh-in and ghost overlay silhouette photo in FitMaintenance AI.',
      timeStr: settings.morningReminderTime,
      durationMinutes: 15,
    },
    {
      enabled: settings.workoutReminder,
      summary: '🏋️ FitMaintenance: Scheduled Workout',
      description: 'Equipment-aware workout routine in FitMaintenance AI.',
      timeStr: settings.workoutReminderTime,
      durationMinutes: 60,
    },
  ];

  try {
    let createdCount = 0;
    for (const item of events) {
      if (!item.enabled) continue;

      const [hours, minutes] = item.timeStr.split(':').map((n) => parseInt(n, 10));
      const start = new Date();
      start.setHours(hours, minutes, 0, 0);
      const end = new Date(start.getTime() + item.durationMinutes * 60 * 1000);

      const body = {
        summary: item.summary,
        description: item.description,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        recurrence: ['RRULE:FREQ=DAILY'],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 10 },
            { method: 'notification', minutes: 0 },
          ],
        },
      };

      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        createdCount++;
      }
    }

    return { success: true, createdCount };
  } catch (err: any) {
    console.error('Google Calendar API sync failed:', err);
    throw new Error(err.message || 'Google Calendar sync failed.');
  }
};
