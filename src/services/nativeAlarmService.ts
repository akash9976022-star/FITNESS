import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { CustomRoutineItem } from './firestoreService';

export const ALARM_NOTIFICATION_ID = 9901;
export const SNOOZE_NOTIFICATION_ID = 9902;
export const ROUTINE_NOTIFICATION_BASE_ID = 2000;
export const ALARM_CHANNEL_ID = 'fitness_alarm_channel';

/**
 * Initialize high-priority alarm notification channel for Android.
 * Android 8.0+ (including Android 14/15 on Samsung One UI) requires notification
 * channels with MAX importance to sound alarms and pop up over the lock screen.
 */
export const initAlarmChannel = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    await LocalNotifications.createChannel({
      id: ALARM_CHANNEL_ID,
      name: 'Fitness Morning Alarm',
      description: 'High-priority wake-up alarms with sound and vibration that wake the device',
      importance: 5, // MAX importance: makes sound, heads-up banner, turns screen on
      visibility: 1, // VISIBILITY_PUBLIC: displays on lock screen
      vibration: true,
      lights: true,
      lightColor: '#3B82F6',
    });
    return true;
  } catch (error) {
    console.error('[NativeAlarm] Failed to create notification channel:', error);
    return false;
  }
};

/**
 * Request notification and exact alarm permissions for Android 13+.
 */
export const requestAlarmPermissions = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const check = await LocalNotifications.checkPermissions();
    if (check.display === 'granted') {
      return true;
    }
    const req = await LocalNotifications.requestPermissions();
    return req.display === 'granted';
  } catch (error) {
    console.error('[NativeAlarm] Permission request failed:', error);
    return false;
  }
};

/**
 * Schedule an exact native OS alarm for a given time (e.g. "06:00").
 * Uses Android RTC_WAKEUP via allowWhileIdle: true to bypass Samsung / Android
 * battery optimization (Doze mode) and ring even when the app is completely closed.
 */
export const scheduleNativeAlarm = async (timeStr: string): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const hasPermission = await requestAlarmPermissions();
    if (!hasPermission) {
      console.warn('[NativeAlarm] Notification permissions not granted');
      return false;
    }

    await initAlarmChannel();

    // Cancel any previous scheduled wake-up alarm
    await cancelNativeAlarm(ALARM_NOTIFICATION_ID);

    // Compute next trigger Date
    const [hours, minutes] = timeStr.split(':').map(Number);
    const scheduleDate = new Date();
    scheduleDate.setHours(hours, minutes, 0, 0);

    // If time has already passed today, schedule for tomorrow
    if (scheduleDate.getTime() <= Date.now()) {
      scheduleDate.setDate(scheduleDate.getDate() + 1);
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: ALARM_NOTIFICATION_ID,
          title: '⏰ Wake Up Athlete! Rise & Conquer',
          body: 'Your FitMaintenance AI morning briefing, devotional chant & workout are ready.',
          schedule: {
            at: scheduleDate,
            allowWhileIdle: true, // Wakes phone up even in Android deep sleep / when app is closed
          },
          channelId: ALARM_CHANNEL_ID,
          ongoing: true,
          autoCancel: true,
          extra: {
            action: 'OPEN_ALARM_MODAL',
            scheduledTime: timeStr,
          },
        },
      ],
    });

    console.log(`[NativeAlarm] Successfully scheduled native alarm for: ${scheduleDate.toLocaleString()}`);
    return true;
  } catch (error) {
    console.error('[NativeAlarm] Failed to schedule native alarm:', error);
    return false;
  }
};

/**
 * Schedule a native snooze alarm (e.g. 5 minutes from now) when app is closed.
 */
export const scheduleNativeSnooze = async (minutes: number = 5): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    await initAlarmChannel();
    const snoozeDate = new Date(Date.now() + minutes * 60 * 1000);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: SNOOZE_NOTIFICATION_ID,
          title: '⏰ Alarm Snooze Over!',
          body: 'Time to get up and begin your morning routine!',
          schedule: {
            at: snoozeDate,
            allowWhileIdle: true,
          },
          channelId: ALARM_CHANNEL_ID,
          ongoing: true,
          autoCancel: true,
          extra: {
            action: 'OPEN_ALARM_MODAL',
          },
        },
      ],
    });

    console.log(`[NativeAlarm] Snooze alarm scheduled for: ${snoozeDate.toLocaleTimeString()}`);
    return true;
  } catch (error) {
    console.error('[NativeAlarm] Failed to schedule snooze alarm:', error);
    return false;
  }
};

/**
 * Cancel an alarm by notification ID.
 */
export const cancelNativeAlarm = async (id: number = ALARM_NOTIFICATION_ID): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await LocalNotifications.cancel({
      notifications: [{ id }],
    });
  } catch (error) {
    console.error('[NativeAlarm] Failed to cancel alarm:', error);
  }
};

/**
 * Synchronize all custom routines as native exact Android alarms.
 * Guarantees routine timings (wake-up, walks, hydration, workouts) fire
 * even when the app is completely closed or screen is turned off.
 */
export const syncNativeRoutines = async (routines: CustomRoutineItem[]): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const hasPermission = await requestAlarmPermissions();
    if (!hasPermission) return;

    await initAlarmChannel();

    // Cancel previously scheduled routine notifications (IDs 2000 to 2099)
    const existingIds = Array.from({ length: 100 }, (_, i) => ({ id: ROUTINE_NOTIFICATION_BASE_ID + i }));
    await LocalNotifications.cancel({ notifications: existingIds }).catch(() => {});

    const now = new Date();
    const scheduledNotifications = [];
    const enabledRoutines = (routines || []).filter((r) => r.enabled && r.time);

    for (let i = 0; i < Math.min(enabledRoutines.length, 50); i++) {
      const routine = enabledRoutines[i];
      const [hours, minutes] = routine.time.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) continue;

      const schedDate = new Date();
      schedDate.setHours(hours, minutes, 0, 0);

      // If routine time has already passed today, schedule for next day
      if (schedDate.getTime() <= now.getTime()) {
        schedDate.setDate(schedDate.getDate() + 1);
      }

      scheduledNotifications.push({
        id: ROUTINE_NOTIFICATION_BASE_ID + i,
        title: `⏰ ${routine.icon || '⏰'} ${routine.name}`,
        body: routine.voicePrompt?.replace('{name}', 'Athlete') || `Time for your scheduled ${routine.name} routine!`,
        schedule: {
          at: schedDate,
          allowWhileIdle: true,
        },
        channelId: ALARM_CHANNEL_ID,
        extra: {
          action: 'OPEN_ROUTINE_REMINDER',
          routineId: routine.id,
          routineName: routine.name,
        },
      });
    }

    if (scheduledNotifications.length > 0) {
      await LocalNotifications.schedule({ notifications: scheduledNotifications });
      console.log(`[NativeAlarm] Scheduled ${scheduledNotifications.length} native routine reminders`);
    }
  } catch (error) {
    console.error('[NativeAlarm] Failed to sync native routines:', error);
  }
};
