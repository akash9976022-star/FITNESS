import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth';
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
      const result = await signInWithPopup(auth, googleProvider);
      setCurrentUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Athlete',
        photoURL: result.user.photoURL,
        isAnonymous: result.user.isAnonymous,
      });
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      let friendlyMessage = firebaseErr?.message || 'Failed to sign in with Google';

      if (firebaseErr?.code === 'auth/unauthorized-domain') {
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'your-domain';
        friendlyMessage = `Google Sign-In Domain Not Authorized: Please add "${currentHost}" to Firebase Console -> Authentication -> Settings -> Authorized Domains.`;
      } else if (firebaseErr?.code === 'auth/popup-blocked') {
        friendlyMessage = 'Google Sign-In popup was blocked by your browser. Please allow popups for this site or use email sign-in.';
      } else if (firebaseErr?.code === 'auth/popup-closed-by-user') {
        friendlyMessage = 'Google Sign-In popup was closed before completing.';
      }

      setError(friendlyMessage);
      throw new Error(friendlyMessage);
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
