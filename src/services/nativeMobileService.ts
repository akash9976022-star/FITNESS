import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Preferences } from '@capacitor/preferences';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * FitMaintenance AI - Native Mobile Service (Capacitor Android & Web Bridge)
 */

export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

export const getAppPlatform = (): 'android' | 'ios' | 'web' => {
  const p = Capacitor.getPlatform();
  if (p === 'android') return 'android';
  if (p === 'ios') return 'ios';
  return 'web';
};

/**
 * Status Bar Styling for Android
 */
export async function setupNativeStatusBar(isDark: boolean): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({
      color: isDark ? '#020617' : '#f8fafc',
    });
  } catch (err) {
    console.debug('StatusBar styling not supported or failed:', err);
  }
}

/**
 * Native Camera Capture via @capacitor/camera
 * Returns Blob, clean base64 data (without header), and dataUrl for direct rendering
 */
export interface NativeCapturedPhoto {
  blob: Blob;
  base64: string;
  dataUrl: string;
}

export async function capturePhotoWithNativeCamera(
  preferredSource: 'camera' | 'photos' | 'prompt' = 'prompt'
): Promise<NativeCapturedPhoto | null> {
  try {
    const source =
      preferredSource === 'camera'
        ? CameraSource.Camera
        : preferredSource === 'photos'
        ? CameraSource.Photos
        : CameraSource.Prompt;

    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source,
      promptLabelHeader: 'FitMaintenance Photo',
      promptLabelPhoto: 'Select from Gallery',
      promptLabelPicture: 'Take Live Photo',
    });

    if (!image.base64String) {
      return null;
    }

    const mimeType = image.format ? `image/${image.format}` : 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${image.base64String}`;

    // Convert base64 to Blob
    const byteCharacters = atob(image.base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    return {
      blob,
      base64: image.base64String,
      dataUrl,
    };
  } catch (err: any) {
    if (err?.message?.includes('User cancelled') || err?.message?.includes('closed')) {
      return null;
    }
    console.warn('Native camera capture fallback notice:', err);
    return null;
  }
}

/**
 * Storage Abstraction with @capacitor/preferences & localStorage fallback
 */
export const nativeStorage = {
  async get(key: string): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key });
      return value ?? (typeof window !== 'undefined' ? localStorage.getItem(key) : null);
    } catch {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      await Preferences.set({ key, value });
    } catch {
      // Fallback
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, value);
      } catch {}
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
    } catch {}
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch {}
    }
  },
};

/**
 * Native Local Notification Alarm Manager
 */
export async function scheduleNativeMorningAlarm(params: {
  id?: number;
  timeStr: string; // "HH:MM" format (e.g., "06:00")
  title: string;
  body: string;
}): Promise<boolean> {
  if (!isNativePlatform()) return false;

  try {
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return false;

    const [hourStr, minuteStr] = params.timeStr.split(':');
    const hour = parseInt(hourStr, 10) || 6;
    const minute = parseInt(minuteStr, 10) || 0;

    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, minute, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduledTime.getTime() <= now.getTime()) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const alarmId = params.id || 6000;

    // Cancel any previous notification with this id
    try {
      await LocalNotifications.cancel({ notifications: [{ id: alarmId }] });
    } catch {}

    await LocalNotifications.schedule({
      notifications: [
        {
          id: alarmId,
          title: params.title,
          body: params.body,
          schedule: {
            at: scheduledTime,
            repeats: true,
            every: 'day',
            allowWhileIdle: true,
          },
          sound: 'beep.wav',
          smallIcon: 'ic_stat_icon_config_sample',
          actionTypeId: 'OPEN_ALARM_BRIEFING',
          extra: {
            action: 'START_BRIEFING',
          },
        },
      ],
    });

    return true;
  } catch (err) {
    console.warn('Native LocalNotification schedule error:', err);
    return false;
  }
}
