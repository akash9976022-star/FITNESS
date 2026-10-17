import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { storeVideoBlob } from '../utils/indexedDBVideoStore';

/**
 * Uploads a check-in progress photo to Firebase Storage.
 * If Firebase Storage is unconfigured or blocked by security rules,
 * gracefully falls back to a persistent base64 data URL so user data is never lost.
 */
export async function uploadCheckInPhoto(
  userId: string,
  fileOrBlob: File | Blob,
  fileName?: string
): Promise<string> {
  const name = fileName || `${Date.now()}_progress.jpg`;
  const storagePath = `users/${userId}/checkin_photos/${name}`;

  if (storage) {
    try {
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, fileOrBlob, {
        contentType: fileOrBlob.type || 'image/jpeg',
      });
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (storageError) {
      console.warn(
        'Firebase Storage upload encountered an issue, falling back to base64 Data URL:',
        storageError
      );
    }
  }

  // Graceful fallback to Base64 Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Uploads a user custom alarm video (.mp4 or video/*).
 * Instantly persists to local IndexedDB for zero-lag offline wakeup playback,
 * and attempts cloud storage backup with a short non-blocking timeout.
 * Never hangs and never emits massive base64 strings that crash Firestore.
 */
export async function uploadAlarmVideo(
  userId: string,
  videoFile: File,
  fileName?: string
): Promise<string> {
  const sanitizedName = (fileName || videoFile.name || `${Date.now()}_alarm.mp4`).replace(/[^a-zA-Z0-9._-]/g, '_');
  const localKey = `video_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // 1. Immediately store in local IndexedDB (takes < 150ms, offline-ready, no size limit)
  await storeVideoBlob(localKey, videoFile, sanitizedName);
  let resolvedUrl = `indexeddb:${localKey}`;

  // 2. Try Firebase Storage with a strict 3-second race so the user is never stuck waiting
  if (storage) {
    try {
      const storagePath = `users/${userId}/alarm_videos/${Date.now()}_${sanitizedName}`;
      const storageRef = ref(storage, storagePath);

      const uploadPromise = (async () => {
        const snapshot = await uploadBytes(storageRef, videoFile, {
          contentType: videoFile.type || 'video/mp4',
        });
        return await getDownloadURL(snapshot.ref);
      })();

      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Storage timeout')), 3000)
      );

      const downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
      if (downloadUrl) {
        resolvedUrl = downloadUrl;
      }
    } catch {
      // Quiet fallback: video is safely and permanently preserved in IndexedDB
      console.info('Preserved video locally in high-speed IndexedDB media store:', sanitizedName);
    }
  }

  return resolvedUrl;
}

