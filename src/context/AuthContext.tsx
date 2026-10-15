import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
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
  isDemo?: boolean;
}

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  loginDemo: (role?: string) => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if demo user is stored in sessionStorage
    const storedDemoUser = sessionStorage.getItem('fit_demo_user');
    if (storedDemoUser) {
      try {
        setCurrentUser(JSON.parse(storedDemoUser));
        setLoading(false);
        return;
      } catch (e) {
        console.error('Failed to parse demo user', e);
      }
    }

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
            displayName: user.displayName || user.email?.split('@')[0] || 'Athlete',
            photoURL: user.photoURL,
          });
        } else {
          // If no firebase user, and not in demo mode
          if (!sessionStorage.getItem('fit_demo_user')) {
            setCurrentUser(null);
          }
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
      throw new Error('Firebase Auth is not initialized. Please configure your .env credentials.');
    }
    try {
      sessionStorage.removeItem('fit_demo_user');
      const credential = await signInWithEmailAndPassword(auth, email, pass);
      setCurrentUser({
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: credential.user.displayName || credential.user.email?.split('@')[0] || 'Athlete',
        photoURL: credential.user.photoURL,
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
      throw new Error('Firebase Auth is not initialized. Please configure your .env credentials.');
    }
    try {
      sessionStorage.removeItem('fit_demo_user');
      const credential = await createUserWithEmailAndPassword(auth, email, pass);
      if (name && credential.user) {
        await updateProfile(credential.user, { displayName: name });
      }
      setCurrentUser({
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: name || credential.user.email?.split('@')[0] || 'Athlete',
        photoURL: credential.user.photoURL,
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
      throw new Error('Firebase Auth is not initialized. Please configure your .env credentials.');
    }
    try {
      sessionStorage.removeItem('fit_demo_user');
      const result = await signInWithPopup(auth, googleProvider);
      setCurrentUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Athlete',
        photoURL: result.user.photoURL,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setError(message);
      throw err;
    }
  };

  const loginDemo = (role = 'Coach / Athlete') => {
    const demoUser: AppUser = {
      uid: 'demo-user-12345',
      email: 'alex.fitness@example.com',
      displayName: `Alex Rivera (${role})`,
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isDemo: true,
    };
    sessionStorage.setItem('fit_demo_user', JSON.stringify(demoUser));
    setCurrentUser(demoUser);
    setError(null);
  };

  const logout = async () => {
    setError(null);
    sessionStorage.removeItem('fit_demo_user');
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
        logout,
        loginDemo,
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

