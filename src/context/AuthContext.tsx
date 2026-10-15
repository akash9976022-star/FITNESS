import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, googleProvider, db, storage, isFirebaseConfigured } from '../firebase/config';
import type { AppUser, UserProfileData, DailyCheckInItem, ExperienceLevel, NutritionLogItem, WorkoutSessionItem } from '../types/auth';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithDemo: () => Promise<void>;
  logout: () => Promise<void>;
  isFirebaseReady: boolean;
  userProfile: UserProfileData;
  updateUserProfile: (profile: Partial<UserProfileData>) => Promise<void>;
  saveOnboardingData: (profile: Partial<UserProfileData>) => Promise<void>;
  saveCheckIn: (
    checkInData: Omit<DailyCheckInItem, 'id' | 'experience_level'> & { experience_level?: ExperienceLevel },
    photoBlob?: Blob | File
  ) => Promise<DailyCheckInItem>;
  fetchCheckIns: () => Promise<DailyCheckInItem[]>;
  checkIns: DailyCheckInItem[];
  // Workout methods
  currentWorkout: WorkoutSessionItem | null;
  setCurrentWorkout: (workout: WorkoutSessionItem | null) => void;
  saveWorkout: (workout: WorkoutSessionItem) => Promise<void>;
  fetchWorkouts: () => Promise<WorkoutSessionItem[]>;
  // Nutrition methods
  nutritionLogs: NutritionLogItem[];
  saveNutritionLog: (log: NutritionLogItem) => Promise<void>;
  deleteNutritionLog: (logId: string) => Promise<void>;
  fetchNutritionLogs: () => Promise<NutritionLogItem[]>;
}

export const defaultProfile: UserProfileData = {
  age: 26,
  gender: 'male',
  weightKg: 74.5,
  heightCm: 178,
  targetMaintenanceWeightKg: 74.5,
  activityLevel: 'moderate',
  maintenanceGoal: 'maintenance',
  experienceLevel: 'intermediate',
  equipment: ['lat_pulldown', 'cable_crossover', 'barbell', 'dumbbells', 'adjustable_bench', 'pull_up_bar'],
  onboardingCompleted: false,
  targetCalories: 2450,
  targetProtein: 165,
  targetCarbs: 260,
  targetFats: 75,
  waterGoalMl: 3200,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData>(() => {
    const saved = localStorage.getItem('fitmaintenance_user_profile');
    if (saved) {
      try {
        return { ...defaultProfile, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Error parsing stored user profile:', e);
      }
    }
    return defaultProfile;
  });
  const [checkIns, setCheckIns] = useState<DailyCheckInItem[]>([]);
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutSessionItem | null>(null);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLogItem[]>([]);

  const clearError = () => setError(null);

  // Helper to load profile from Firestore
  const loadProfileFromFirestore = async (fbUser: FirebaseUser) => {
    if (!db) return;
    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<UserProfileData>;
        setUserProfile((prev) => {
          const merged: UserProfileData = {
            ...prev,
            ...data,
            experienceLevel: (data.experienceLevel as ExperienceLevel) || prev.experienceLevel || 'intermediate',
            onboardingCompleted: data.onboardingCompleted ?? true,
          };
          localStorage.setItem('fitmaintenance_user_profile', JSON.stringify(merged));
          return merged;
        });
      } else {
        // Document does not exist yet -> New user needing onboarding
        setUserProfile((prev) => {
          const fresh = { ...prev, onboardingCompleted: false };
          localStorage.setItem('fitmaintenance_user_profile', JSON.stringify(fresh));
          return fresh;
        });
      }
    } catch (err) {
      console.warn('Could not read user profile from Firestore, using local cache:', err);
    }
  };

  const updateUserProfile = async (newProfile: Partial<UserProfileData>) => {
    const updated = { ...userProfile, ...newProfile };
    setUserProfile(updated);
    localStorage.setItem('fitmaintenance_user_profile', JSON.stringify(updated));

    if (db && user && !user.isDemo) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(
          userDocRef,
          {
            ...updated,
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('Failed to sync profile update to Firestore:', err);
      }
    }
  };

  const saveOnboardingData = async (onboardingData: Partial<UserProfileData>) => {
    setError(null);
    const updated: UserProfileData = {
      ...userProfile,
      ...onboardingData,
      onboardingCompleted: true,
    };

    setUserProfile(updated);
    localStorage.setItem('fitmaintenance_user_profile', JSON.stringify(updated));

    if (db && user && !user.isDemo) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(
          userDocRef,
          {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.email?.split('@')[0] || 'Athlete',
            photoURL: user.photoURL || null,
            providerId: user.providerId || 'password',
            isDemo: false,
            age: updated.age,
            gender: updated.gender,
            weightKg: updated.weightKg,
            heightCm: updated.heightCm,
            targetMaintenanceWeightKg: updated.targetMaintenanceWeightKg,
            activityLevel: updated.activityLevel,
            maintenanceGoal: updated.maintenanceGoal,
            experienceLevel: updated.experienceLevel || 'intermediate',
            equipment: updated.equipment,
            onboardingCompleted: true,
            targetCalories: updated.targetCalories,
            targetProtein: updated.targetProtein,
            targetCarbs: updated.targetCarbs,
            targetFats: updated.targetFats,
            waterGoalMl: updated.waterGoalMl,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err: any) {
        console.error('Error saving onboarding data to Firestore:', err);
        setError('Saved locally, but failed to sync to Cloud Firestore. Check your Firestore connection.');
        throw err;
      }
    }
  };

  // Upload Progress Photo & Save Check-In Document
  const saveCheckIn = async (
    checkInData: Omit<DailyCheckInItem, 'id' | 'experience_level'> & { experience_level?: ExperienceLevel },
    photoBlob?: Blob | File
  ): Promise<DailyCheckInItem> => {
    const checkinId = 'checkin_' + Date.now();
    const resolvedExpLevel: ExperienceLevel =
      checkInData.experience_level || userProfile.experienceLevel || 'intermediate';

    let photoUrl = checkInData.photo_url || '';

    // 1. Upload to Firebase Storage if available
    if (photoBlob) {
      if (storage && user && !user.isDemo) {
        try {
          const storageRef = ref(storage, `users/${user.uid}/checkins/${Date.now()}.jpg`);
          const uploadResult = await uploadBytes(storageRef, photoBlob, {
            contentType: 'image/jpeg',
          });
          photoUrl = await getDownloadURL(uploadResult.ref);
        } catch (storageErr) {
          console.warn('Firebase Storage upload failed or not enabled, converting locally:', storageErr);
          // Fallback to data URL
          photoUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(photoBlob);
          });
        }
      } else {
        // Local/Demo Mode data URL conversion
        photoUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(photoBlob);
        });
      }
    }

    const checkInRecord: DailyCheckInItem = {
      id: checkinId,
      date: checkInData.date,
      weight: checkInData.weight,
      readiness: checkInData.readiness,
      photo_url: photoUrl,
      experience_level: resolvedExpLevel,
      notes: checkInData.notes || '',
    };

    // 2. Persist to Firestore subcollection `users/{userId}/checkins/{checkinId}`
    if (db && user && !user.isDemo) {
      try {
        const checkinDocRef = doc(db, 'users', user.uid, 'checkins', checkinId);
        await setDoc(checkinDocRef, {
          ...checkInRecord,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('Failed to save checkin to Firestore:', err);
      }
    }

    // 3. Cache locally
    const cacheKey = `fitmaintenance_checkins_${user?.uid || 'guest'}`;
    const existing = JSON.parse(localStorage.getItem(cacheKey) || '[]');
    const updatedList = [checkInRecord, ...existing];
    localStorage.setItem(cacheKey, JSON.stringify(updatedList));

    // 4. Update the user's current weight in state and Firestore
    await updateUserProfile({ weightKg: checkInData.weight });

    return checkInRecord;
  };

  // Fetch all Check-Ins
  const fetchCheckIns = async (): Promise<DailyCheckInItem[]> => {
    const cacheKey = `fitmaintenance_checkins_${user?.uid || 'guest'}`;
    const localList: DailyCheckInItem[] = JSON.parse(localStorage.getItem(cacheKey) || '[]');

    if (db && user && !user.isDemo) {
      try {
        const checkinsRef = collection(db, 'users', user.uid, 'checkins');
        const q = query(checkinsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const remoteList: DailyCheckInItem[] = [];
        querySnapshot.forEach((docSnap) => {
          remoteList.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });

        if (remoteList.length > 0) {
          localStorage.setItem(cacheKey, JSON.stringify(remoteList));
          return remoteList;
        }
      } catch (err) {
        console.warn('Could not fetch check-ins from Firestore, falling back to local storage:', err);
      }
    }

    return localList;
  };

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          const appUser: AppUser = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Athlete',
            photoURL: fbUser.photoURL,
            providerId: fbUser.providerData?.[0]?.providerId || 'password',
            isDemo: false,
          };
          setUser(appUser);
          await loadProfileFromFirestore(fbUser);
        } else {
          // Check if local simulated user was stored
          const savedSimUser = localStorage.getItem('fitmaintenance_sim_user');
          if (savedSimUser) {
            try {
              setUser(JSON.parse(savedSimUser));
            } catch {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Local fallback mode when Firebase credentials are not yet populated
      const savedSimUser = localStorage.getItem('fitmaintenance_sim_user');
      if (savedSimUser) {
        try {
          setUser(JSON.parse(savedSimUser));
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    }
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      if (auth) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        const appUser: AppUser = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Athlete',
          photoURL: fbUser.photoURL,
          providerId: 'password',
          isDemo: false,
        };
        setUser(appUser);
        await loadProfileFromFirestore(fbUser);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600));
        const simUser: AppUser = {
          uid: 'sim_' + Date.now(),
          email: email.trim().toLowerCase(),
          displayName: email.split('@')[0] || 'Fit Athlete',
          photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
          providerId: 'password',
          isDemo: true,
        };
        localStorage.setItem('fitmaintenance_sim_user', JSON.stringify(simUser));
        setUser(simUser);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      let message = 'Failed to sign in. Please check your credentials.';
      if (err.code === 'auth/operation-not-allowed') {
        message = 'Email/Password sign-in is not enabled in Firebase Console! Go to Firebase Console -> Authentication -> Sign-in method -> enable "Email/Password".';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password. If you haven\'t created an account yet, click "Create Account" above!';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (err.code === 'auth/unauthorized-domain') {
        message = 'Domain not authorized. In Firebase Console -> Authentication -> Settings -> Authorized domains, add "localhost" and "127.0.0.1".';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Access is temporarily locked. Try again later.';
      } else if (err.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your internet connection.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signupWithEmail = async (email: string, password: string, name?: string) => {
    setError(null);
    setLoading(true);
    try {
      if (auth) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        if (name && name.trim()) {
          try {
            await updateProfile(fbUser, { displayName: name.trim() });
          } catch (e) {
            console.warn('Could not set displayName during signup', e);
          }
        }
        const appUser: AppUser = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: name?.trim() || fbUser.displayName || fbUser.email?.split('@')[0] || 'Athlete',
          photoURL: fbUser.photoURL,
          providerId: 'password',
          isDemo: false,
        };
        setUser(appUser);
        setUserProfile((prev) => {
          const fresh = { ...prev, onboardingCompleted: false };
          localStorage.setItem('fitmaintenance_user_profile', JSON.stringify(fresh));
          return fresh;
        });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 700));
        const displayName = name?.trim() || email.split('@')[0] || 'Athlete';
        const simUser: AppUser = {
          uid: 'sim_' + Date.now(),
          email: email.trim().toLowerCase(),
          displayName,
          photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(displayName)}`,
          providerId: 'password',
          isDemo: true,
        };
        localStorage.setItem('fitmaintenance_sim_user', JSON.stringify(simUser));
        setUser(simUser);
        setUserProfile((prev) => {
          const fresh = { ...prev, onboardingCompleted: false };
          localStorage.setItem('fitmaintenance_user_profile', JSON.stringify(fresh));
          return fresh;
        });
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      let message = 'Failed to create account.';
      if (err.code === 'auth/operation-not-allowed') {
        message = 'Email/Password sign-in is not enabled in Firebase Console! Go to Firebase Console -> Authentication -> Sign-in method -> enable "Email/Password".';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered! Please switch to the "Sign In" tab.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (err.code === 'auth/unauthorized-domain') {
        message = 'Domain not authorized. In Firebase Console -> Authentication -> Settings -> Authorized domains, add "localhost" and "127.0.0.1".';
      } else if (err.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your internet connection.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      if (auth) {
        const result = await signInWithPopup(auth, googleProvider);
        const fbUser = result.user;
        const appUser: AppUser = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || 'Google Athlete',
          photoURL: fbUser.photoURL,
          providerId: 'google.com',
          isDemo: false,
        };
        setUser(appUser);
        await loadProfileFromFirestore(fbUser);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600));
        const simUser: AppUser = {
          uid: 'sim_google_' + Date.now(),
          email: 'alex.champion@gmail.com',
          displayName: 'Alex Champion',
          photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
          providerId: 'google.com',
          isDemo: true,
        };
        localStorage.setItem('fitmaintenance_sim_user', JSON.stringify(simUser));
        setUser(simUser);
      }
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      let message = 'Google sign-in was cancelled or failed.';
      if (err.code === 'auth/operation-not-allowed') {
        message = 'Google sign-in is not enabled in Firebase Console! Go to Firebase Console -> Authentication -> Sign-in method -> enable "Google".';
      } else if (err.code === 'auth/popup-closed-by-user') {
        message = 'Sign-in popup was closed before completion.';
      } else if (err.code === 'auth/unauthorized-domain') {
        message = 'Domain not authorized. In Firebase Console -> Authentication -> Settings -> Authorized domains, add "localhost" and "127.0.0.1".';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const demoUser: AppUser = {
        uid: 'demo_athlete_01',
        email: 'alex.fitness@fitmaintenance.ai',
        displayName: 'Alex Jordan',
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
        providerId: 'demo',
        isDemo: true,
      };
      localStorage.setItem('fitmaintenance_sim_user', JSON.stringify(demoUser));
      setUser(demoUser);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      if (auth && !user?.isDemo) {
        await firebaseSignOut(auth);
      }
      localStorage.removeItem('fitmaintenance_sim_user');
      setUser(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message || 'Error signing out.');
    }
  };

  // ==================== WORKOUT FUNCTIONS ====================
  const saveWorkout = async (workout: WorkoutSessionItem) => {
    if (!user || user.isDemo) return;
    if (!db) return;
    try {
      const workoutRef = doc(db, 'users', user.uid, 'workouts', workout.id);
      await setDoc(workoutRef, { ...workout, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err: any) {
      console.error('Error saving workout:', err);
    }
  };

  const fetchWorkouts = async (): Promise<WorkoutSessionItem[]> => {
    if (!user || user.isDemo || !db) return [];
    try {
      const q = query(collection(db, 'users', user.uid, 'workouts'), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WorkoutSessionItem));
      return items;
    } catch (err: any) {
      console.error('Error fetching workouts:', err);
      return [];
    }
  };

  // ==================== NUTRITION LOG FUNCTIONS ====================
  const saveNutritionLog = async (log: NutritionLogItem) => {
    if (!user || user.isDemo) return;
    if (!db) return;
    try {
      const logRef = doc(db, 'users', user.uid, 'nutrition_logs', log.id);
      await setDoc(logRef, { ...log, updatedAt: serverTimestamp() }, { merge: true });
      setNutritionLogs((prev) => {
        const idx = prev.findIndex((p) => p.id === log.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = log;
          return copy;
        }
        return [log, ...prev];
      });
    } catch (err: any) {
      console.error('Error saving nutrition log:', err);
    }
  };

  const deleteNutritionLog = async (logId: string) => {
    if (!user || user.isDemo) return;
    if (!db) return;
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'users', user.uid, 'nutrition_logs', logId));
      setNutritionLogs((prev) => prev.filter((l) => l.id !== logId));
    } catch (err: any) {
      console.error('Error deleting nutrition log:', err);
    }
  };

  const fetchNutritionLogs = async (): Promise<NutritionLogItem[]> => {
    if (!user || user.isDemo || !db) return [];
    try {
      const q = query(collection(db, 'users', user.uid, 'nutrition_logs'), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as NutritionLogItem));
      setNutritionLogs(items);
      return items;
    } catch (err: any) {
      console.error('Error fetching nutrition logs:', err);
      return [];
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      clearError,
      loginWithEmail,
      signupWithEmail,
      loginWithGoogle,
      loginWithDemo,
      logout,
      isFirebaseReady: isFirebaseConfigured,
      userProfile,
      updateUserProfile,
      saveOnboardingData,
      saveCheckIn,
      fetchCheckIns,
      checkIns,
      currentWorkout,
      setCurrentWorkout,
      saveWorkout,
      fetchWorkouts,
      nutritionLogs,
      saveNutritionLog,
      deleteNutritionLog,
      fetchNutritionLogs,
    }),
    [user, loading, error, userProfile, checkIns, currentWorkout, nutritionLogs]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
