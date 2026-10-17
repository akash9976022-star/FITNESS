/**
 * FitMaintenance AI - Local IndexedDB Video & Media Storage
 * 
 * Provides instantaneous, reliable, offline-first client storage for large user-uploaded
 * alarm video songs (.mp4, .webm, .mov) with zero cloud latency, zero 1MB Firestore limitations,
 * and seamless playback in HTML5 video elements.
 */

const DB_NAME = 'FitMaintenanceAI_MediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'alarm_videos';

interface StoredVideoRecord {
  id: string;
  blob: Blob;
  fileName: string;
  mimeType: string;
  size: number;
  updatedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB is not available in this environment.'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
    });
  }

  return dbPromise;
}

// In-memory cache of resolved blob URLs so createObjectURL is called once per key
const blobUrlCache = new Map<string, string>();

/**
 * Stores a video file/blob into IndexedDB
 */
export async function storeVideoBlob(
  id: string,
  blob: Blob,
  fileName: string = 'alarm_video.mp4'
): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const record: StoredVideoRecord = {
      id,
      blob,
      fileName,
      mimeType: blob.type || 'video/mp4',
      size: blob.size,
      updatedAt: Date.now(),
    };
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieves a video blob from IndexedDB
 */
export async function getVideoBlob(id: string): Promise<Blob | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const result = req.result as StoredVideoRecord | undefined;
        resolve(result ? result.blob : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Error reading video from IndexedDB:', err);
    return null;
  }
}

/**
 * Deletes a video from IndexedDB
 */
export async function deleteVideoBlob(id: string): Promise<void> {
  if (blobUrlCache.has(id)) {
    try {
      URL.revokeObjectURL(blobUrlCache.get(id)!);
    } catch {
      // ignore
    }
    blobUrlCache.delete(id);
  }

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Error deleting video from IndexedDB:', err);
  }
}

/**
 * Resolves any video URL (whether http, https, youtube, blob, or indexeddb:key)
 * into a valid, playable URL string for <video> or <iframe>.
 */
export async function resolveVideoUrl(videoUrl: string): Promise<string> {
  if (!videoUrl) return '';

  const trimmed = videoUrl.trim();
  if (trimmed.startsWith('indexeddb:')) {
    const key = trimmed.replace('indexeddb:', '').trim();
    if (blobUrlCache.has(key)) {
      return blobUrlCache.get(key)!;
    }
    const blob = await getVideoBlob(key);
    if (blob) {
      const url = URL.createObjectURL(blob);
      blobUrlCache.set(key, url);
      return url;
    }
    return '';
  }

  return trimmed;
}

/**
 * Helper to inspect the real duration of a local video file
 */
export function extractVideoDuration(file: File): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve('05:00');
      return;
    }
    try {
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      const objectUrl = URL.createObjectURL(file);
      tempVideo.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        const sec = Math.round(tempVideo.duration) || 0;
        const mins = Math.floor(sec / 60);
        const remSec = sec % 60;
        resolve(`${String(mins).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`);
      };
      tempVideo.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve('05:00');
      };
      tempVideo.src = objectUrl;
    } catch {
      resolve('05:00');
    }
  });
}

