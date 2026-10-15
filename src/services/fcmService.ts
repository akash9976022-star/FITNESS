import { getMessaging, getToken, onMessage, isSupported, type Messaging } from 'firebase/messaging';
import { app } from '../firebase/config';

let messagingInstance: Messaging | null = null;

/**
 * Initialize Firebase Cloud Messaging if supported in current browser
 */
export const initFcmMessaging = async (): Promise<Messaging | null> => {
  if (typeof window === 'undefined') return null;

  try {
    const supported = await isSupported();
    if (!supported || !app) {
      console.info('FCM is not supported in this browser environment or Firebase app not initialized.');
      return null;
    }

    if (!messagingInstance) {
      messagingInstance = getMessaging(app);
    }
    return messagingInstance;
  } catch (err) {
    console.warn('FCM initialization notice:', err);
    return null;
  }
};

/**
 * Request FCM device token
 */
export const requestFcmDeviceToken = async (vapidKey?: string): Promise<string | null> => {
  try {
    const messaging = await initFcmMessaging();
    if (!messaging) return null;

    // Use environment VAPID key or passed parameter or default
    const key = vapidKey || import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined;

    // Ensure service worker is registered
    let swReg: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      swReg = await navigator.serviceWorker.ready;
    }

    const token = await getToken(messaging, {
      vapidKey: key,
      serviceWorkerRegistration: swReg,
    });

    if (token) {
      return token;
    } else {
      console.warn('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.warn('Failed to retrieve FCM device token:', err);
    return null;
  }
};

/**
 * Setup foreground push message listener
 */
export const setupFcmForegroundListener = async (onMessageReceived: (payload: any) => void) => {
  const messaging = await initFcmMessaging();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    onMessageReceived(payload);
  });
};
