/**
 * FitMaintenance AI - Local IndexedDB Video & Media Storage
 * 
 * Provides instantaneous, reliable, offline-first client storage for large user-uploaded
 * alarm video songs (supporting .mp4, .MP4, .mov, .MOV, .webm, .WEBM, .mkv, .MKV, and all video formats)
 * with zero cloud latency, zero 1MB Firestore limitations, and seamless playback in HTML5 video elements.
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
 * Normalizes and infers the correct video MIME type across lowercase/uppercase extensions
 * (.mp4, .MP4, .mov, .MOV, .webm, .WEBM, .mkv, .MKV, .3gp, .3GP, .avi, .AVI, etc.)
 */
export function getCleanVideoMimeType(fileName: string, rawMime?: string): string {
  if (rawMime && rawMime.startsWith('video/')) return rawMime;
  const ext = (fileName || '').split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'mp4':
    case 'm4v':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'mov':
      return 'video/quicktime';
    case 'mkv':
      return 'video/x-matroska';
    case '3gp':
      return 'video/3gpp';
    case 'avi':
      return 'video/x-msvideo';
    case 'ts':
      return 'video/mp2t';
    case 'wmv':
      return 'video/x-ms-wmv';
    case 'ogv':
      return 'video/ogg';
    default:
      return 'video/mp4';
  }
}

/**
 * Stores a video file/blob into IndexedDB with format normalization
 */
export async function storeVideoBlob(
  id: string,
  blob: Blob,
  fileName: string = 'alarm_video.mp4'
): Promise<void> {
  const db = await getDB();
  const mimeType = getCleanVideoMimeType(fileName, blob.type);
  const cleanBlob = blob.type && blob.type.startsWith('video/') ? blob : new Blob([blob], { type: mimeType });

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const record: StoredVideoRecord = {
      id,
      blob: cleanBlob,
      fileName,
      mimeType,
      size: cleanBlob.size,
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
 * Completely clears all stored video blobs from IndexedDB and revokes object URLs
 */
export async function clearAllStoredVideos(): Promise<void> {
  // Clear blob URL cache
  for (const url of blobUrlCache.values()) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }
  blobUrlCache.clear();

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Error clearing videos from IndexedDB:', err);
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

      const cleanup = () => {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // ignore
        }
      };

      const timer = setTimeout(() => {
        cleanup();
        resolve('05:00');
      }, 3500);

      tempVideo.onloadedmetadata = () => {
        clearTimeout(timer);
        cleanup();
        const sec = Math.round(tempVideo.duration) || 0;
        if (sec > 0) {
          const mins = Math.floor(sec / 60);
          const remSec = sec % 60;
          resolve(`${String(mins).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`);
        } else {
          resolve('05:00');
        }
      };

      tempVideo.onerror = () => {
        clearTimeout(timer);
        cleanup();
        resolve('05:00');
      };

      tempVideo.src = objectUrl;
    } catch {
      resolve('05:00');
    }
  });
}
