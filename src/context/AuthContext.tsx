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
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user: User | null) => {
        if (user) {
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || (user.isAnonymous ? 'Guest Athlete' : user.email?.split('@')[0] || 'Athlete'),
            photoURL: user.photoURL,
            isAnonymous: user.isAnonymous,
          });
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Firebase Auth state error:', err);
        setError(err.message);
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
      const message = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setError(message);
      throw err;
    }
  };

  const loginAnonymously = async () => {
    setError(null);
    if (!auth) {
      throw new Error('Firebase Auth is not initialized. Please verify your .env credentials.');
    }
    try {
      const result = await signInAnonymously(auth);
      setCurrentUser({
        uid: result.user.uid,
        email: null,
        displayName: 'Guest Athlete',
        photoURL: null,
        isAnonymous: true,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start guest session';
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
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
