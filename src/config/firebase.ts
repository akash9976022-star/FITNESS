import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCYJGM0nxhkDODuAG8gJUc5MjAijQYSnrc',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'fitmaintenance-ai-614ac.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'fitmaintenance-ai-614ac',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'fitmaintenance-ai-614ac.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '346245120541',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:346245120541:web:792b2fec6a8f4219c23cf4',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-BJ9QFCLEWS',
};

// Check if critical Firebase keys are present
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;
const googleProvider = new GoogleAuthProvider();

// Custom parameters for Google OAuth
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    try {
      storage = getStorage(app);
    } catch (storageErr) {
      console.warn('Firebase Storage initialization notice:', storageErr);
    }

    // Initialize Analytics if supported in this browser environment
    isSupported().then((supported) => {
      if (supported && app) {
        analytics = getAnalytics(app);
      }
    }).catch(() => {
      // Analytics unsupported (e.g. non-browser environment or indexedDB disabled)
    });
  } catch (error) {
    console.error('Failed to initialize Firebase SDK:', error);
  }
} else {
  console.warn(
    'Firebase environment variables are missing or incomplete. ' +
    'Please set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, and VITE_FIREBASE_PROJECT_ID in your .env file.'
  );
}

export { app, auth, db, storage, analytics, googleProvider, firebaseConfig };
