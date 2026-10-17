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
  const ext = (fileName || '').split('.').pop()?.toLowerCase();
  switch (ext) {
    // Audio song formats (supported by all media players and HTML5)
    case 'mp3':
      return 'audio/mpeg';
    case 'm4a':
    case 'aac':
      return 'audio/mp4';
    case 'wav':
      return 'audio/wav';
    case 'ogg':
    case 'oga':
      return 'audio/ogg';
    case 'flac':
      return 'audio/flac';
    case 'opus':
      return 'audio/opus';

    // Video song formats
    case 'webm':
      return 'video/webm';
    case 'ogv':
      return 'video/ogg';
    case '3gp':
      return 'video/3gpp';
    case 'ts':
      return 'video/mp2t';
    case 'hvc':
    case 'hevc':
    case 'h265':
    case '265':
    case 'mp4':
    case 'm4v':
    case 'mov':
    case 'mkv':
    case 'avi':
    case 'wmv':
    default:
      if (rawMime && (rawMime.startsWith('audio/') || rawMime === 'video/webm' || rawMime === 'video/ogg')) {
        return rawMime;
      }
      // For all other video formats (H.264, HEVC, MKV, MOV), video/mp4 provides maximum native browser decoder support
      return 'video/mp4';
  }
}

/**
 * Stores a video or audio file/blob into IndexedDB with format normalization
 */
export async function storeVideoBlob(
  id: string,
  blob: Blob,
  fileName: string = 'alarm_song.mp4'
): Promise<void> {
  // Clear any existing cached blob URL for this key
  if (blobUrlCache.has(id)) {
    try {
      URL.revokeObjectURL(blobUrlCache.get(id)!);
    } catch {
      // ignore
    }
    blobUrlCache.delete(id);
  }

  const db = await getDB();
  const mimeType = getCleanVideoMimeType(fileName, blob.type);
  // Zero-copy slice to preserve atom seeking and range requests without nesting
  const cleanBlob = blob.type === mimeType ? blob : (blob.slice ? blob.slice(0, blob.size, mimeType) : blob);

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
 * Retrieves the full stored video/audio record from IndexedDB
 */
export async function getVideoRecord(id: string): Promise<StoredVideoRecord | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const result = req.result as StoredVideoRecord | undefined;
        resolve(result || null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Error reading media record from IndexedDB:', err);
    return null;
  }
}

/**
 * Retrieves a video blob from IndexedDB
 */
export async function getVideoBlob(id: string): Promise<Blob | null> {
  const record = await getVideoRecord(id);
  return record ? record.blob : null;
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
 * Resolves any video or audio URL (whether http, https, youtube, blob, or indexeddb:key)
 * into a valid, playable URL string for <video>, <audio>, or <iframe>.
 */
export async function resolveVideoUrl(videoUrl: string): Promise<string> {
  if (!videoUrl) return '';

  const trimmed = videoUrl.trim();
  if (trimmed.startsWith('indexeddb:')) {
    const key = trimmed.replace('indexeddb:', '').trim();
    if (blobUrlCache.has(key)) {
      return blobUrlCache.get(key)!;
    }
    const record = await getVideoRecord(key);
    if (record && record.blob) {
      const safeMime = record.mimeType || getCleanVideoMimeType(record.fileName || '', record.blob.type);
      const cleanBlob = record.blob.type === safeMime
        ? record.blob
        : (record.blob.slice ? record.blob.slice(0, record.blob.size, safeMime) : record.blob);
      const url = URL.createObjectURL(cleanBlob);
      blobUrlCache.set(key, url);
      return url;
    }
    const blob = await getVideoBlob(key);
    if (blob) {
      const mime = blob.type && blob.type.startsWith('audio/') ? blob.type : 'video/mp4';
      const cleanBlob = blob.type === mime
        ? blob
        : (blob.slice ? blob.slice(0, blob.size, mime) : blob);
      const url = URL.createObjectURL(cleanBlob);
      blobUrlCache.set(key, url);
      return url;
    }
    return '';
  }

  return trimmed;
}

/**
 * Helper to inspect the real duration of a local song file (video or audio) with fast 800ms fallback
 */
export function extractVideoDuration(file: File): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve('03:45');
      return;
    }
    try {
      const isAudio = file.type.startsWith('audio/') || /\.(mp3|m4a|wav|aac|flac|ogg)$/i.test(file.name);
      const mediaEl = document.createElement(isAudio ? 'audio' : 'video');
      mediaEl.preload = 'metadata';
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
        resolve('03:45');
      }, 800);

      mediaEl.onloadedmetadata = () => {
        clearTimeout(timer);
        cleanup();
        const sec = Math.round(mediaEl.duration) || 0;
        if (sec > 0) {
          const mins = Math.floor(sec / 60);
          const remSec = sec % 60;
          resolve(`${String(mins).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`);
        } else {
          resolve('03:45');
        }
      };

      mediaEl.onerror = () => {
        clearTimeout(timer);
        cleanup();
        resolve('03:45');
      };

      mediaEl.src = objectUrl;
    } catch {
      resolve('03:45');
    }
  });
}
