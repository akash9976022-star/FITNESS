import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { auth, googleProvider, isFirebaseConfigured } from '../config/firebase';
import { ensureUserProfileExists } from '../services/firestoreService';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGmailOrSmartAuth: (email: string, pass: string, name?: string) => Promise<void>;
  loginAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Instantly check if there is an active local guest session
    let localGuest: AppUser | null = null;
    try {
      const stored = localStorage.getItem('fit_guest_session');
      if (stored) {
        localGuest = JSON.parse(stored);
      }
    } catch {}

    if (localGuest && localGuest.uid) {
      setCurrentUser(localGuest);
      setLoading(false);
    }

    if (!auth) {
      if (!localGuest) setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user: User | null) => {
        if (user) {
          try {
            localStorage.removeItem('fit_guest_session');
          } catch {}
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || (user.isAnonymous ? 'Guest Athlete' : user.email?.split('@')[0] || 'Athlete'),
            photoURL: user.photoURL,
            isAnonymous: user.isAnonymous,
          });
          // Auto-initialize missing Firestore user document on login
          ensureUserProfileExists(user.uid).catch((err) => {
            console.warn('Auto-initialize profile on login error:', err);
          });
        } else {
          // If no Firebase user, check if we still have an active local guest session
          let activeGuest: AppUser | null = null;
          try {
            const stored = localStorage.getItem('fit_guest_session');
            if (stored) activeGuest = JSON.parse(stored);
          } catch {}

          if (activeGuest && activeGuest.uid) {
            setCurrentUser(activeGuest);
          } else {
            setCurrentUser(null);
          }
        }
        setLoading(false);
      },
      (err) => {
        console.error('Firebase Auth state error:', err);
        let activeGuest: AppUser | null = null;
        try {
          const stored = localStorage.getItem('fit_guest_session');
          if (stored) activeGuest = JSON.parse(stored);
        } catch {}

        if (activeGuest && activeGuest.uid) {
          setCurrentUser(activeGuest);
        } else {
          setError(err.message);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    if (!auth) {
      throw new Error('Firebase Auth is not initialized. Please verify your .env credentials.');
    }
    try {
      const credential = await signInWithEmailAndPassword(auth, email, pass);
      setCurrentUser({
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: credential.user.displayName || credential.user.email?.split('@')[0] || 'Athlete',
        photoURL: credential.user.photoURL,
        isAnonymous: credential.user.isAnonymous,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign in';
      setError(message);
      throw err;
    }
  };

  const signupWithEmail = async (email: string, pass: string, name?: string) => {
    setError(null);
    if (!auth) {
      throw new Error('Firebase Auth is not initialized. Please verify your .env credentials.');
    }
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, pass);
      if (name && credential.user) {
        await updateProfile(credential.user, { displayName: name });
      }
      setCurrentUser({
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: name || credential.user.email?.split('@')[0] || 'Athlete',
        photoURL: credential.user.photoURL,
        isAnonymous: credential.user.isAnonymous,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create account';
      setError(message);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    if (!auth) {
      throw new Error('Firebase Auth is not initialized. Please verify your .env credentials.');
    }
    try {
      if (Capacitor.isNativePlatform()) {
        // Native One-Tap Google Account Picker on Android APK
        await GoogleAuth.initialize({
          clientId: '346245120541-lsk3baiqqbhefr07j0ja2s75bipamq9d.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
          grantOfflineAccess: false,
        });
        const googleUser = await GoogleAuth.signIn();
        const idToken = googleUser?.authentication?.idToken || (googleUser as any)?.idToken;
        if (!idToken) {
          throw new Error('Google sign-in was cancelled or did not return a valid ID token.');
        }
        const credential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(auth, credential);
        setCurrentUser({
          uid: result.user.uid,
          email: result.user.email,
          displayName:
            result.user.displayName ||
            googleUser?.name ||
            result.user.email?.split('@')[0] ||
            'Athlete',
          photoURL: result.user.photoURL || googleUser?.imageUrl || null,
          isAnonymous: result.user.isAnonymous,
        });
      } else {
        // Web Fallback: Standard browser popup
        const result = await signInWithPopup(auth, googleProvider);
        setCurrentUser({
          uid: result.user.uid,
          email: result.user.email,
          displayName:
            result.user.displayName || result.user.email?.split('@')[0] || 'Athlete',
          photoURL: result.user.photoURL,
          isAnonymous: result.user.isAnonymous,
        });
      }
    } catch (err: unknown) {
      console.error('Google Sign-In caught error:', err);
      const errorObj = err as { code?: string | number; message?: string; error?: string };
      const rawMessage = errorObj?.message || errorObj?.error || (typeof err === 'string' ? err : '');
      const rawCode = String(errorObj?.code ?? '');

      let friendlyMessage = rawMessage || 'Failed to sign in with Google';

      if (rawCode === '10' || rawMessage.toLowerCase().includes('something went wrong')) {
        friendlyMessage =
          'Google Sign-In Error (Code 10): Ensure SHA-1 fingerprint (22:42:11:A7:15:FD:87:E4:AF:50:E9:F6:91:5B:9E:C2:F9:9B:DC:65) is registered in Firebase Console -> Project Settings -> Android App, and Google provider is enabled.';
      } else if (rawCode === '12501' || rawMessage.toLowerCase().includes('cancel')) {
        friendlyMessage = 'Google sign-in was canceled.';
      } else if (rawCode === '12500') {
        friendlyMessage = 'Google Play Services sign-in failed (Code 12500). Please check your internet connection.';
      } else if (errorObj?.code === 'auth/unauthorized-domain') {
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'your-domain';
        friendlyMessage = `Google Sign-In Domain Not Authorized: Please add "${currentHost}" to Firebase Console -> Authentication -> Settings -> Authorized Domains.`;
      } else if (errorObj?.code === 'auth/popup-blocked') {
        friendlyMessage = 'Google Sign-In popup was blocked by your browser. Please allow popups for this site.';
      } else if (errorObj?.code === 'auth/popup-closed-by-user') {
        friendlyMessage = 'Google Sign-In was closed before completing.';
      }

      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  };

  const loginWithGmailOrSmartAuth = async (email: string, pass: string, name?: string) => {
    setError(null);
    if (!auth) {
      throw new Error('Firebase Auth is not initialized. Please verify your connection.');
    }
    const cleanEmail = email.trim();
    const cleanPass = pass.trim();
    const derivedName = name?.trim() || cleanEmail.split('@')[0] || 'Athlete';

    try {
      // 1. Attempt standard email sign-in first
      const credential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      setCurrentUser({
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: credential.user.displayName || derivedName,
        photoURL: credential.user.photoURL,
        isAnonymous: credential.user.isAnonymous,
      });
      try {
        localStorage.setItem('fit_last_gmail', cleanEmail);
      } catch {}
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };

      // 2. If user doesn't exist yet, automatically create account for seamless 1-tap onboarding!
      if (
        firebaseErr?.code === 'auth/user-not-found' ||
        firebaseErr?.code === 'auth/invalid-credential'
      ) {
        try {
          const newCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
          if (newCredential.user) {
            await updateProfile(newCredential.user, { displayName: derivedName });
          }
          setCurrentUser({
            uid: newCredential.user.uid,
            email: newCredential.user.email,
            displayName: derivedName,
            photoURL: newCredential.user.photoURL,
            isAnonymous: newCredential.user.isAnonymous,
          });
          try {
            localStorage.setItem('fit_last_gmail', cleanEmail);
          } catch {}
          return;
        } catch (createErr: unknown) {
          const createFirebaseErr = createErr as { code?: string; message?: string };
          if (createFirebaseErr?.code === 'auth/email-already-in-use') {
            const msg = 'This Gmail account is registered. Please verify your password and try again.';
            setError(msg);
            throw new Error(msg);
          }
          if (createFirebaseErr?.code === 'auth/weak-password') {
            const msg = 'Password must be at least 6 characters.';
            setError(msg);
            throw new Error(msg);
          }
          const msg = createFirebaseErr?.message || 'Failed to authenticate Gmail account.';
          setError(msg);
          throw new Error(msg);
        }
      }

      if (firebaseErr?.code === 'auth/wrong-password') {
        const msg = 'Incorrect password for this Gmail account. Please try again.';
        setError(msg);
        throw new Error(msg);
      }

      const msg = firebaseErr?.message || 'Authentication failed. Please check credentials.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const loginAnonymously = async () => {
    setError(null);
    try {
      // 1. Try real Firebase anonymous auth first if available
      if (auth) {
        try {
          const result = await signInAnonymously(auth);
          const firebaseGuestUser: AppUser = {
            uid: result.user.uid,
            email: null,
            displayName: 'Guest Athlete',
            photoURL: null,
            isAnonymous: true,
          };
          try {
            localStorage.removeItem('fit_guest_session');
          } catch {}
          setCurrentUser(firebaseGuestUser);
          ensureUserProfileExists(result.user.uid).catch(() => {});
          return;
        } catch (firebaseErr: unknown) {
          console.warn(
            'Firebase anonymous authentication not enabled in console or network unavailable. Launching instant persistent guest session:',
            firebaseErr
          );
        }
      }

      // 2. Seamless Instant Guest Session fallback
      // Ensures the user can ALWAYS log in immediately without being blocked by Firebase config
      let guestUid = '';
      try {
        guestUid = localStorage.getItem('fit_guest_uid') || '';
      } catch {}

      if (!guestUid) {
        guestUid = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        try {
          localStorage.setItem('fit_guest_uid', guestUid);
        } catch {}
      }

      const localGuestUser: AppUser = {
        uid: guestUid,
        email: null,
        displayName: 'Guest Athlete',
        photoURL: null,
        isAnonymous: true,
      };

      try {
        localStorage.setItem('fit_guest_session', JSON.stringify(localGuestUser));
      } catch {}

      setCurrentUser(localGuestUser);
      ensureUserProfileExists(guestUid).catch(() => {});
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start guest session';
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      localStorage.removeItem('fit_guest_session');
      localStorage.removeItem('fit_guest_uid');
    } catch {}
    if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Sign out error:', err);
      }
    }
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isFirebaseConfigured,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        loginWithGmailOrSmartAuth,
        loginAnonymously,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
