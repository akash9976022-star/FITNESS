import type { NotificationSettings, PushNotificationPayload } from '../types/notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativePlatform } from './nativeMobileService';

/**
 * Check if the platform/browser supports notifications
 */
export const isNotificationSupported = (): boolean => {
  if (isNativePlatform()) return true;
  return typeof window !== 'undefined' && 'Notification' in window;
};

/**
 * Get current notification permission
 */
export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (isNativePlatform()) {
    return 'granted';
  }
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
};

/**
 * Register Service Worker if supported
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      return reg;
    } catch (err) {
      console.warn('Service worker registration failed:', err);
    }
  }
  return null;
};

/**
 * Request notification permission (Native & Browser)
 */
export const requestNotificationPermission = async (): Promise<'granted' | 'denied' | 'default' | 'unsupported'> => {
  if (isNativePlatform()) {
    try {
      const res = await LocalNotifications.requestPermissions();
      return res.display === 'granted' ? 'granted' : 'denied';
    } catch (err) {
      console.warn('Native LocalNotifications permission request failed:', err);
      return 'denied';
    }
  }

  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerServiceWorker();
    }
    return permission;
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return 'denied';
  }
};

/**
 * Play a synthetic notification chime using Web Audio API
 */
export const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Arpeggiated friendly chime (659.25Hz -> 880Hz)
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch (err) {
    // Audio might be blocked if user hasn't interacted with page
    console.debug('Audio chime unavailable:', err);
  }
};

/**
 * Dispatch a browser or service worker notification
 */
export const sendLocalPushNotification = async (payload: PushNotificationPayload) => {
  // 1. Native Capacitor LocalNotification Dispatch
  if (isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Date.now() % 100000) + Math.floor(Math.random() * 1000),
            title: payload.title,
            body: payload.body,
            schedule: { at: new Date(Date.now() + 50) },
            sound: 'beep.wav',
            smallIcon: 'ic_stat_icon_config_sample',
            extra: {
              url: payload.url || '/',
            },
          },
        ],
      });
      playNotificationChime();
      return true;
    } catch (err) {
      console.warn('Native LocalNotifications schedule error:', err);
    }
  }

  // 2. Web / Browser Push Notifications
  if (!isNotificationSupported() || (typeof Notification !== 'undefined' && Notification.permission !== 'granted')) {
    console.warn('Notification permission not granted');
    return false;
  }

  const title = payload.title;
  const options: NotificationOptions = {
    body: payload.body,
    icon: payload.icon || '/favicon.svg',
    badge: payload.badge || '/favicon.svg',
    tag: payload.tag || 'fitmaintenance-reminder',
    data: {
      url: payload.url || '/',
      ...payload.data,
    },
  };

  try {
    // Try via service worker if available for best background/mobile experience
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, options);
        playNotificationChime();
        return true;
      }
    }
  } catch (err) {
    console.warn('Service worker showNotification fallback to window Notification:', err);
  }

  // Fallback to window Notification constructor
  try {
    const notif = new Notification(title, options);
    notif.onclick = () => {
      window.focus();
      if (payload.url && payload.url !== '/') {
        window.location.href = payload.url;
      }
      notif.close();
    };
    playNotificationChime();
    return true;
  } catch (err) {
    console.error('Failed to display browser notification:', err);
    return false;
  }
};

/**
 * Dispatch an immediate test notification to verify permissions & audio
 */
export const sendTestNotification = async (): Promise<boolean> => {
  return sendLocalPushNotification({
    title: '🔔 FitMaintenance AI Notification Test',
    body: 'Daily reminders are configured and active! You will receive timely alerts for your check-ins and workouts.',
    url: '/dashboard',
    tag: 'test-notification',
  });
};

/**
 * Check daily reminders against current time and trigger if due
 * Returns updated lastNotifiedAt map if any reminder was triggered
 */
export const checkAndTriggerScheduledReminders = async (
  settings: NotificationSettings,
  onNotificationSent?: (key: string, dateIso: string) => void
): Promise<Record<string, string> | null> => {
  if (!settings.remindersEnabled || getNotificationPermission() !== 'granted') {
    return null;
  }

  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${currentHours}:${currentMinutes}`;
  const todayDateIso = now.toISOString().split('T')[0];

  const lastNotified = { ...(settings.lastNotifiedAt || {}) };
  let hasTriggeredAny = false;

  const remindersToCheck = [
    {
      key: 'morning_checkin',
      enabled: settings.morningReminder,
      time: settings.morningReminderTime,
      title: '🌅 Morning Check-In & Fasted Weigh-In',
      body: 'Time for your daily morning weigh-in and ghost overlay progress photo to lock in your maintenance equilibrium!',
      url: '/progress',
    },
    {
      key: 'meal_breakfast',
      enabled: settings.mealReminders && settings.mealBreakfast,
      time: settings.mealBreakfastTime,
      title: '🍳 Breakfast Fuel Reminder',
      body: 'Fuel up your morning! Snap a photo with AI Food Scanner to log your protein & calories.',
      url: '/nutrition',
    },
    {
      key: 'meal_lunch',
      enabled: settings.mealReminders && settings.mealLunch,
      time: settings.mealLunchTime,
      title: '🥗 Midday Nutrition Check',
      body: 'Time to recharge! Keep your muscle protein synthesis steady by logging lunch.',
      url: '/nutrition',
    },
    {
      key: 'meal_dinner',
      enabled: settings.mealReminders && settings.mealDinner,
      time: settings.mealDinnerTime,
      title: '🍲 Evening Dinner & Equilibrium',
      body: 'Final meal of the day! Verify you have met your daily protein target and maintenance calories.',
      url: '/nutrition',
    },
    {
      key: 'workout_session',
      enabled: settings.workoutReminder,
      time: settings.workoutReminderTime,
      title: '🏋️ Equipment Workout Ready',
      body: 'Your scheduled equipment-aware maintenance workout is ready. Crush your volume and log your sets!',
      url: '/workouts',
    },
  ];

  for (const reminder of remindersToCheck) {
    if (!reminder.enabled || !reminder.time) continue;

    // Check if reminder was already sent today
    const lastSentDate = lastNotified[reminder.key];
    if (lastSentDate === todayDateIso) continue;

    // Compare time (trigger if current time matches reminder time or is within a 2-minute window)
    if (currentTime >= reminder.time) {
      const [rHour, rMin] = reminder.time.split(':').map((n) => parseInt(n, 10));
      const reminderDate = new Date();
      reminderDate.setHours(rHour, rMin, 0, 0);

      // Only trigger if reminder was scheduled within the past 60 minutes (don't alert on hours-old past times)
      const diffMs = now.getTime() - reminderDate.getTime();
      if (diffMs >= 0 && diffMs <= 60 * 60 * 1000) {
        await sendLocalPushNotification({
          title: reminder.title,
          body: reminder.body,
          url: reminder.url,
          tag: reminder.key,
        });

        lastNotified[reminder.key] = todayDateIso;
        hasTriggeredAny = true;

        if (onNotificationSent) {
          onNotificationSent(reminder.key, todayDateIso);
        }
      }
    }
  }

  return hasTriggeredAny ? lastNotified : null;
};
