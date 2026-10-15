export type ReminderFrequency = 'daily' | 'weekdays' | 'weekends';

export interface NotificationSchedule {
  enabled: boolean;
  time: string; // "HH:MM" in 24h format (e.g. "08:00")
  label: string;
  description: string;
}

export interface NotificationSettings {
  id?: string;
  remindersEnabled: boolean;
  
  // 1. Morning Check-in & Progress Photo
  morningReminder: boolean;
  morningReminderTime: string; // "08:00"

  // 2. Meal Logging
  mealReminders: boolean;
  mealBreakfast: boolean;
  mealBreakfastTime: string; // "09:00"
  mealLunch: boolean;
  mealLunchTime: string; // "13:30"
  mealDinner: boolean;
  mealDinnerTime: string; // "20:30"

  // 3. Evening Workout
  workoutReminder: boolean;
  workoutReminderTime: string; // "18:00"

  // Heavy-Sleeper Alarm & Devotional Audio Briefing
  heavySleeperAlarmEnabled?: boolean;
  heavySleeperAlarmTime?: string; // default "06:00"
  alarmMaxVolume?: boolean; // default true
  devotionalMusicEnabled?: boolean; // default true
  preferredRasi?: string; // default "mesham"

  // System & Delivery Channels
  soundEnabled: boolean;
  fcmEnabled?: boolean;
  fcmToken?: string;
  
  // Google Calendar & Tasks Integration
  googleSyncEnabled?: boolean;
  googleSyncType?: 'calendar' | 'tasks' | 'both';

  // SMS / WhatsApp Hooks (Architecture-ready)
  smsEnabled?: boolean;
  smsPhoneNumber?: string;
  whatsappEnabled?: boolean;
  whatsappNumber?: string;

  // Metadata
  lastNotifiedAt?: Record<string, string>; // Maps reminder key -> "YYYY-MM-DD"
  createdAt?: any;
  updatedAt?: any;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  id: 'notifications',
  remindersEnabled: true,
  heavySleeperAlarmEnabled: true,
  heavySleeperAlarmTime: '06:00',
  alarmMaxVolume: true,
  devotionalMusicEnabled: true,
  preferredRasi: 'mesham',
  morningReminder: true,
  morningReminderTime: '08:00',
  mealReminders: true,
  mealBreakfast: true,
  mealBreakfastTime: '09:00',
  mealLunch: true,
  mealLunchTime: '13:30',
  mealDinner: true,
  mealDinnerTime: '20:30',
  workoutReminder: true,
  workoutReminderTime: '18:00',
  soundEnabled: true,
  fcmEnabled: false,
  googleSyncEnabled: false,
  googleSyncType: 'calendar',
  smsEnabled: false,
  whatsappEnabled: false,
  lastNotifiedAt: {},
};

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: Record<string, any>;
}

export interface GoogleCalendarEventTemplate {
  title: string;
  description: string;
  startTime: string; // "HH:MM"
  durationMinutes: number;
  recurrenceRule: string; // "RRULE:FREQ=DAILY"
}
