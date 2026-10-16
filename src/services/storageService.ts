import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

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
 * Uploads a user custom alarm video (.mp4 or video/*) to Firebase Storage.
 * Falls back to Data URL if storage is unconfigured.
 */
export async function uploadAlarmVideo(
  userId: string,
  videoFile: File,
  fileName?: string
): Promise<string> {
  const sanitizedName = (fileName || videoFile.name || `${Date.now()}_alarm.mp4`).replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `users/${userId}/alarm_videos/${sanitizedName}`;

  if (storage) {
    try {
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, videoFile, {
        contentType: videoFile.type || 'video/mp4',
      });
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (storageError) {
      console.warn('Firebase Storage video upload fallback:', storageError);
    }
  }

  // Graceful fallback to Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(videoFile);
  });
}

