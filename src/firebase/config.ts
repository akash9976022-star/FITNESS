import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// Helper to check if credentials are valid
export const getStoredFirebaseConfig = () => {
  const localConfigStr = localStorage.getItem('fitmaintenance_firebase_config');
  if (localConfigStr) {
    try {
      const parsed = JSON.parse(localConfigStr);
      if (parsed.apiKey && parsed.apiKey.trim().length > 10) {
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse stored Firebase config', e);
    }
  }

  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (envApiKey && envApiKey.trim().length > 10 && !envApiKey.includes('your_api_key_here')) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
  }

  // Standard client fallback for APK and production web builds
  return {
    apiKey: 'AIzaSyCnF6sIo_iRdgZWuhqM-3-7AL2cjK47R6o',
    authDomain: 'fitmaintenance-ai.firebaseapp.com',
    projectId: 'fitmaintenance-ai',
    storageBucket: 'fitmaintenance-ai.firebasestorage.app',
    messagingSenderId: '421324524046',
    appId: '1:421324524046:web:408140d2abbede33fd8a5f',
  };
};

const activeConfig = getStoredFirebaseConfig();

export const isFirebaseConfigured = Boolean(activeConfig && activeConfig.apiKey);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured && activeConfig) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(activeConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.warn('Firebase initialization error, defaulting to local simulated auth:', error);
    auth = null;
    app = null;
    db = null;
    storage = null;
  }
}

export const googleProvider = new GoogleAuthProvider();
export { app, auth, db, storage };
