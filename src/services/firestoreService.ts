import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  writeBatch,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { clearAllStoredVideos } from '../utils/indexedDBVideoStore';

/* ==================== USER PROFILE & ONBOARDING ==================== */
export type ExperienceLevel = 'beginner' | 'intermediate' | 'pro';

export interface UserProfile {
  age: number;
  gender: 'male' | 'female';
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  activityMultiplier: number;
  experienceLevel: ExperienceLevel;
  calculatedTdee: number;
  bmr: number;
  equipment: string[];
  onboardingCompleted: boolean;
  updatedAt?: unknown;
}

export interface EquipmentCategory {
  category: string;
  description: string;
  items: string[];
}

export const EQUIPMENT_CATALOG: EquipmentCategory[] = [
  {
    category: 'Cables & Pulleys',
    description: 'Constant tension cable stacks for isolated hypertrophy and unilateral angles',
    items: ['Lat Pulldown', 'Cable Crossover', 'Seated Cable Row'],
  },
  {
    category: 'Machines',
    description: 'Guided track leverage machines for joint-friendly maximum mechanical load',
    items: ['Leg Press', 'Leg Extension', 'Hamstring Curl', 'Smith Machine', 'Chest/Shoulder Press'],
  },
  {
    category: 'Free Weights & Benches',
    description: 'Core barbell and dumbbell platforms for compound overload',
    items: ['Barbell', 'Dumbbells', 'Adjustable Bench', 'Pull-up Bar'],
  },
  {
    category: 'Bodyweight / Minimal',
    description: 'Calisthenics, portable resistance, and floor-based mobility work',
    items: ['Resistance Bands', 'Yoga Mat', 'None'],
  },
];

export const calculateMifflinStJeor = (
  gender: 'male' | 'female',
  weightKg: number,
  heightCm: number,
  age: number,
  activityMultiplier: number
) => {
  let baseBmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  baseBmr += gender === 'male' ? 5 : -161;
  const bmr = Math.round(baseBmr);
  const calculatedTdee = Math.round(baseBmr * activityMultiplier);
  return { bmr, calculatedTdee };
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  gender: 'male',
  age: 25,
  heightCm: 175,
  currentWeightKg: 75,
  targetWeightKg: 75,
  activityMultiplier: 1.55,
  experienceLevel: 'intermediate',
  equipment: [],
  calculatedTdee: 2450,
  bmr: 1700,
  onboardingCompleted: true,
};

/**
 * Checks if the user's Firestore document (users/{userId}) exists.
 * If missing, automatically creates it with safe baseline metrics and an empty equipment array.
 */
export const ensureUserProfileExists = async (
  userId: string,
  defaults?: Partial<UserProfile>
): Promise<UserProfile> => {
  if (!userId) return DEFAULT_USER_PROFILE;

  const cacheKey = `fit_user_profile_${userId}`;
  let cachedProfile: UserProfile = { ...DEFAULT_USER_PROFILE, ...defaults };
  try {
    const stored = localStorage.getItem(cacheKey);
    if (stored) {
      cachedProfile = { ...cachedProfile, ...JSON.parse(stored) };
    } else {
      localStorage.setItem(cacheKey, JSON.stringify(cachedProfile));
    }
  } catch {
    // Ignored
  }

  // If local guest or no db or unauthenticated, return cached profile immediately
  if (!db || userId.startsWith('guest_') || !auth?.currentUser) {
    return cachedProfile;
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      await setDoc(
        userDocRef,
        {
          ...cachedProfile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      return cachedProfile;
    }
    const data = snap.data() as UserProfile;
    try {
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch {}
    return data;
  } catch (err) {
    console.warn('Notice while ensuring user profile in Firestore, using cache:', err);
    return cachedProfile;
  }
};

export const subscribeUserProfile = (
  userId: string,
  callback: (profile: UserProfile | null) => void
): Unsubscribe => {
  if (!userId) {
    callback(null);
    return () => {};
  }

  const cacheKey = `fit_user_profile_${userId}`;
  const getCachedProfile = (): UserProfile => {
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_USER_PROFILE;
  };

  const initial = getCachedProfile();
  callback(initial);

  if (!db || userId.startsWith('guest_') || !auth?.currentUser) {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === cacheKey && e.newValue) {
        try {
          callback(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }

  const userDocRef = doc(db, 'users', userId);
  return onSnapshot(
    userDocRef,
    async (snapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserProfile;
          try {
            localStorage.setItem(cacheKey, JSON.stringify(data));
          } catch {}
          callback(data);
        } else {
          // Auto-initialize missing Firestore user documents
          await setDoc(
            userDocRef,
            {
              ...initial,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
          callback(initial);
        }
      } catch (err) {
        console.warn('Notice in subscribeUserProfile onSnapshot handler, using cache:', err);
        callback(getCachedProfile());
      }
    },
    (error) => {
      console.warn('Firestore user profile snapshot notice, falling back to local store:', error);
      callback(getCachedProfile());
    }
  );
};

export const saveUserProfile = async (
  userId: string,
  profile: Partial<UserProfile>
): Promise<void> => {
  if (!userId) return;

  const cacheKey = `fit_user_profile_${userId}`;
  let merged = { ...DEFAULT_USER_PROFILE, ...profile };
  try {
    const existing = localStorage.getItem(cacheKey);
    if (existing) {
      merged = { ...JSON.parse(existing), ...profile };
    }
    localStorage.setItem(cacheKey, JSON.stringify(merged));
  } catch (err) {
    console.warn('Notice caching user profile to localStorage:', err);
  }

  if (!db || userId.startsWith('guest_') || !auth?.currentUser) return;

  try {
    const userDocRef = doc(db, 'users', userId);
    const dataToSave = {
      ...profile,
      updatedAt: serverTimestamp(),
    };

    await setDoc(userDocRef, dataToSave, { merge: true });

    // Sync to biometrics subdocument for backwards-compatibility with nutrition engine
    if (
      profile.gender &&
      profile.currentWeightKg &&
      profile.heightCm &&
      profile.age &&
      profile.activityMultiplier
    ) {
      const biometricsRef = doc(db, 'users', userId, 'data', 'biometrics');
      await setDoc(
        biometricsRef,
        {
          gender: profile.gender,
          weightKg: profile.currentWeightKg,
          heightCm: profile.heightCm,
          age: profile.age,
          activityMultiplier: profile.activityMultiplier,
          goal: 'maintain',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('Notice saving profile to Firestore, preserved locally:', err);
  }
};

/* ==================== BIOMETRICS & NUTRITION ==================== */
export interface UserBiometrics {
  gender: 'male' | 'female';
  weightKg: number;
  heightCm: number;
  age: number;
  activityMultiplier: number;
  goal: 'maintain' | 'lean_bulk' | 'cut';
  updatedAt?: unknown;
}

export const subscribeUserBiometrics = (
  userId: string,
  callback: (biometrics: UserBiometrics | null) => void
): Unsubscribe => {
  if (!userId) {
    callback(null);
    return () => {};
  }

  const cacheKey = `fit_biometrics_${userId}`;
  const getCachedBio = (): UserBiometrics => {
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) return JSON.parse(stored);
      const profileStr = localStorage.getItem(`fit_user_profile_${userId}`);
      if (profileStr) {
        const p = JSON.parse(profileStr);
        return {
          gender: p.gender || 'male',
          weightKg: p.currentWeightKg || 75,
          heightCm: p.heightCm || 175,
          age: p.age || 25,
          activityMultiplier: p.activityMultiplier || 1.55,
          goal: 'maintain',
        };
      }
    } catch {}
    return {
      gender: 'male',
      weightKg: 75,
      heightCm: 175,
      age: 25,
      activityMultiplier: 1.55,
      goal: 'maintain',
    };
  };

  const initial = getCachedBio();
  callback(initial);

  if (!db || userId.startsWith('guest_') || !auth?.currentUser) {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === cacheKey && e.newValue) {
        try {
          callback(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }

  const biometricsRef = doc(db, 'users', userId, 'data', 'biometrics');
  return onSnapshot(
    biometricsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserBiometrics;
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch {}
        callback(data);
      } else {
        callback(initial);
      }
    },
    (error) => {
      console.warn('Firestore biometrics snapshot notice, using local cache:', error);
      callback(getCachedBio());
    }
  );
};

export const saveUserBiometrics = async (
  userId: string,
  biometrics: UserBiometrics
): Promise<void> => {
  if (!userId) return;
  const cacheKey = `fit_biometrics_${userId}`;
  try {
    localStorage.setItem(cacheKey, JSON.stringify(biometrics));
  } catch {}

  if (!db || userId.startsWith('guest_') || !auth?.currentUser) return;
  try {
    const biometricsRef = doc(db, 'users', userId, 'data', 'biometrics');
    await setDoc(
      biometricsRef,
      {
        ...biometrics,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Notice saving biometrics to Firestore, preserved locally:', err);
  }
};

/* ==================== ACTIVE & COMPLETED WORKOUTS ==================== */
export interface ExerciseSet {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface ExerciseItem {
  id: string;
  name: string;
  muscle: string;
  sets: ExerciseSet[];
}

export interface WorkoutSession {
  routineName: string;
  startedAt?: number;
  isPaused?: boolean;
  pausedElapsedMs?: number;
  durationMinutes?: number;
  duration_minutes?: number;
  exercises: ExerciseItem[];
}

export interface CompletedWorkout {
  id: string;
  routineName: string;
  completedAt: unknown;
  totalVolumeKg: number;
  totalSets: number;
  durationMinutes: number;
  duration_minutes?: number;
  exercises: ExerciseItem[];
}

export const subscribeActiveWorkout = (
  userId: string,
  callback: (session: WorkoutSession | null) => void
): Unsubscribe => {
  if (!db || !userId) {
    callback(null);
    return () => {};
  }

  const activeRef = doc(db, 'users', userId, 'data', 'active_workout');
  return onSnapshot(
    activeRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as WorkoutSession);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.warn('Firestore active workout snapshot error:', error);
      callback(null);
    }
  );
};

export const saveActiveWorkout = async (
  userId: string,
  session: WorkoutSession | null
): Promise<void> => {
  if (!db || !userId) return;
  const activeRef = doc(db, 'users', userId, 'data', 'active_workout');
  if (session === null) {
    await deleteDoc(activeRef);
  } else {
    await setDoc(activeRef, session, { merge: true });
  }
};

export interface WorkoutCompletionResult {
  logId: string;
  milestoneCount: number;
  streakCount: number;
  totalVolumeKg: number;
  totalSets: number;
  durationMinutes: number;
}

export const finishAndSaveWorkout = async (
  userId: string,
  session: WorkoutSession,
  durationMinutes = 45
): Promise<WorkoutCompletionResult | null> => {
  if (!db || !userId) return null;

  const totalVolumeKg = session.exercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets.reduce((setAcc, s) => (s.completed ? setAcc + s.weight * s.reps : setAcc), 0)
    );
  }, 0);

  const totalSets = session.exercises.reduce((acc, ex) => {
    return acc + ex.sets.filter((s) => s.completed).length;
  }, 0);

  const finalDurationMinutes = Math.max(1, Math.round(durationMinutes));

  // 1. Add to completed_workouts collection
  const completedRef = collection(db, 'users', userId, 'completed_workouts');
  const compDoc = await addDoc(completedRef, {
    routineName: session.routineName || 'Custom Workout',
    completedAt: serverTimestamp(),
    totalVolumeKg,
    totalSets,
    durationMinutes: finalDurationMinutes,
    duration_minutes: finalDurationMinutes,
    exercises: session.exercises,
  });

  // 2. Also log to workouts collection with duration_minutes using identical ID
  try {
    const workoutsRef = collection(db, 'users', userId, 'workouts');
    await setDoc(doc(workoutsRef, compDoc.id), {
      routineName: session.routineName || 'Custom Workout',
      savedAt: serverTimestamp(),
      completedAt: serverTimestamp(),
      totalVolumeKg,
      totalSets,
      durationMinutes: finalDurationMinutes,
      duration_minutes: finalDurationMinutes,
      exercises: session.exercises,
      isCompleted: true,
    });
  } catch (err) {
    console.warn('workouts collection sync error:', err);
  }

  // 3. Also log to dedicated workout_logs subcollection using identical ID
  try {
    const workoutLogsRef = collection(db, 'users', userId, 'workout_logs');
    await setDoc(doc(workoutLogsRef, compDoc.id), {
      routineName: session.routineName || 'Custom Workout',
      loggedAt: serverTimestamp(),
      completedAt: serverTimestamp(),
      totalVolumeKg,
      totalSets,
      durationMinutes: finalDurationMinutes,
      duration_minutes: finalDurationMinutes,
      exercises: session.exercises,
    });
  } catch (err) {
    console.warn('workout_logs collection sync error:', err);
  }

  // Clear active workout session
  await saveActiveWorkout(userId, null);

  // Automatically record core maintenance goal for streak
  const streak = await recordStreakActivity(userId, 'workout');

  // Increment user workout stats & milestones in users/{userId}/stats
  const milestoneCount = await incrementUserWorkoutStats(userId, {
    volumeKg: totalVolumeKg,
    durationMinutes: finalDurationMinutes,
  });

  return {
    logId: compDoc.id,
    milestoneCount,
    streakCount: streak?.currentStreak || 1,
    totalVolumeKg,
    totalSets,
    durationMinutes: finalDurationMinutes,
  };
};

/**
 * Permanently deletes a completed workout log from Firestore:
 * removes it across workout_logs, completed_workouts, and workouts collections.
 */
export const deleteCompletedWorkoutLog = async (
  userId: string,
  logId: string
): Promise<void> => {
  if (!db || !userId || !logId) return;

  // 1. Delete from workout_logs
  try {
    const workoutLogRef = doc(db, 'users', userId, 'workout_logs', logId);
    await deleteDoc(workoutLogRef);
  } catch (err) {
    console.warn('Error deleting from workout_logs:', err);
  }

  // 2. Delete from completed_workouts
  try {
    const completedRef = doc(db, 'users', userId, 'completed_workouts', logId);
    await deleteDoc(completedRef);
  } catch (err) {
    console.warn('Error deleting from completed_workouts:', err);
  }

  // 3. Delete from workouts
  try {
    const workoutRef = doc(db, 'users', userId, 'workouts', logId);
    await deleteDoc(workoutRef);
  } catch (err) {
    console.warn('Error deleting from workouts:', err);
  }
};

/**
 * Real-time listener for dedicated workout_logs and completed_workouts,
 * merging and deduplicating them by ID so all past logs are visible and deletable.
 */
export const subscribeWorkoutLogs = (
  userId: string,
  callback: (workouts: CompletedWorkout[]) => void,
  limitCount = 50
): Unsubscribe => {
  if (!db || !userId) {
    callback([]);
    return () => {};
  }

  const logsMap = new Map<string, CompletedWorkout>();
  const completedMap = new Map<string, CompletedWorkout>();

  const emit = () => {
    const combined = new Map<string, CompletedWorkout>();
    completedMap.forEach((val, key) => combined.set(key, val));
    logsMap.forEach((val, key) => combined.set(key, val));

    const list = Array.from(combined.values());
    list.sort((a, b) => {
      const getMillis = (t: unknown): number => {
        if (!t) return 0;
        if (typeof (t as { toMillis?: () => number }).toMillis === 'function') {
          return (t as { toMillis: () => number }).toMillis();
        }
        if (t instanceof Date) return t.getTime();
        if (typeof t === 'number') return t;
        if (typeof t === 'string') return new Date(t).getTime() || 0;
        return 0;
      };
      return getMillis(b.completedAt) - getMillis(a.completedAt);
    });
    callback(list.slice(0, limitCount));
  };

  const logsRef = collection(db, 'users', userId, 'workout_logs');
  const qLogs = query(logsRef, orderBy('completedAt', 'desc'), limit(limitCount));
  const unsubLogs = onSnapshot(
    qLogs,
    (snapshot) => {
      logsMap.clear();
      snapshot.docs.forEach((docSnap) => {
        logsMap.set(docSnap.id, {
          id: docSnap.id,
          ...(docSnap.data() as Omit<CompletedWorkout, 'id'>),
        });
      });
      emit();
    },
    (err) => {
      console.warn('workout_logs subscription notice:', err);
    }
  );

  const completedRef = collection(db, 'users', userId, 'completed_workouts');
  const qCompleted = query(completedRef, orderBy('completedAt', 'desc'), limit(limitCount));
  const unsubCompleted = onSnapshot(
    qCompleted,
    (snapshot) => {
      completedMap.clear();
      snapshot.docs.forEach((docSnap) => {
        completedMap.set(docSnap.id, {
          id: docSnap.id,
          ...(docSnap.data() as Omit<CompletedWorkout, 'id'>),
        });
      });
      emit();
    },
    (err) => {
      console.warn('completed_workouts subscription notice:', err);
    }
  );

  return () => {
    unsubLogs();
    unsubCompleted();
  };
};

export const subscribeCompletedWorkouts = subscribeWorkoutLogs;

/* ==================== AI COACH CHAT HISTORY ==================== */
export interface CoachMessageItem {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  createdAt?: unknown;
}

export const subscribeCoachMessages = (
  userId: string,
  callback: (messages: CoachMessageItem[]) => void
): Unsubscribe => {
  if (!db || !userId) {
    callback([]);
    return () => {};
  }

  const chatRef = collection(db, 'users', userId, 'coach_messages');
  const q = query(chatRef, orderBy('createdAt', 'asc'), limit(50));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: CoachMessageItem[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<CoachMessageItem, 'id'>),
      }));
      callback(messages);
    },
    (error) => {
      console.warn('Firestore coach messages snapshot error:', error);
      callback([]);
    }
  );
};

export const addCoachMessage = async (
  userId: string,
  message: { sender: 'ai' | 'user'; text: string }
): Promise<void> => {
  if (!db || !userId) return;
  const chatRef = collection(db, 'users', userId, 'coach_messages');
  await addDoc(chatRef, {
    ...message,
    createdAt: serverTimestamp(),
  });
};

/* ==================== NUTRITION LOGS & INDIAN STAPLES ==================== */
export interface NutritionLogItem {
  id: string;
  foodName: string;
  detectedComponents: string[];
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  confidenceScore: 'High' | 'Medium' | 'Low' | 'Manual';
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  imageUrl?: string;
  loggedAt?: unknown;
}

export interface IndianStaple {
  id: string;
  name: string;
  hindiName?: string;
  servingDescription: string;
  servingUnit: string;
  defaultServingQty: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  category: 'Legumes & Pulses' | 'Grains & Breads' | 'Nuts & Seeds' | 'Dairy & Protein';
  detectedComponents: string[];
}

export const INDIAN_STAPLES_PRESETS: IndianStaple[] = [
  {
    id: 'boiled-chana',
    name: 'Boiled Chana (Chickpeas)',
    hindiName: 'उबला चना',
    servingDescription: '1 medium katori (~150g boiled, light cumin & rock salt)',
    servingUnit: 'katori (150g)',
    defaultServingQty: 1,
    calories: 240,
    proteinG: 13,
    carbsG: 40,
    fatsG: 4,
    category: 'Legumes & Pulses',
    detectedComponents: ['Boiled Bengal Gram / Chickpeas', 'Water', 'Cumin & Rock Salt'],
  },
  {
    id: 'roasted-peanuts',
    name: 'Roasted Peanuts (Moongphali)',
    hindiName: 'भुनी मूंगफली',
    servingDescription: '1 handful (~35g dry roasted)',
    servingUnit: 'handful (35g)',
    defaultServingQty: 1,
    calories: 200,
    proteinG: 9,
    carbsG: 6,
    fatsG: 17,
    category: 'Nuts & Seeds',
    detectedComponents: ['Dry Roasted Peanuts / Moongphali'],
  },
  {
    id: 'green-gram',
    name: 'Boiled Green Gram (Moong)',
    hindiName: 'उबली हरी मूंग',
    servingDescription: '1 katori (~150g boiled whole moong with lemon)',
    servingUnit: 'katori (150g)',
    defaultServingQty: 1,
    calories: 165,
    proteinG: 12,
    carbsG: 28,
    fatsG: 1,
    category: 'Legumes & Pulses',
    detectedComponents: ['Whole Green Moong', 'Lemon Juice', 'Spices'],
  },
  {
    id: 'roti-ghee',
    name: 'Whole Wheat Roti (Phulka)',
    hindiName: 'रोटी / फुल्का',
    servingDescription: '2 medium rotis with light desi ghee brushing',
    servingUnit: '2 rotis',
    defaultServingQty: 1,
    calories: 210,
    proteinG: 6,
    carbsG: 34,
    fatsG: 6,
    category: 'Grains & Breads',
    detectedComponents: ['Whole Wheat Atta', 'Desi Ghee (~1 tsp)'],
  },
  {
    id: 'dal-tadka',
    name: 'Yellow Dal Tadka',
    hindiName: 'दाल तड़का',
    servingDescription: '1 standard katori (~180g cooked toor/moong dal with ghee tadka)',
    servingUnit: 'katori (180g)',
    defaultServingQty: 1,
    calories: 185,
    proteinG: 9,
    carbsG: 24,
    fatsG: 6,
    category: 'Legumes & Pulses',
    detectedComponents: ['Cooked Toor/Moong Dal', 'Desi Ghee Tadka', 'Jeera, Hing, Tomato, Onion'],
  },
  {
    id: 'paneer-bhurji',
    name: 'Paneer Bhurji / Curry',
    hindiName: 'पनीर भुर्जी',
    servingDescription: '1 katori (~150g fresh paneer sauteed with onion & tomato)',
    servingUnit: 'katori (150g)',
    defaultServingQty: 1,
    calories: 280,
    proteinG: 16,
    carbsG: 8,
    fatsG: 21,
    category: 'Dairy & Protein',
    detectedComponents: ['Fresh Paneer (Cottage Cheese)', 'Mustard/Sunflower Oil', 'Onion, Tomato & Masalas'],
  },
  {
    id: 'steamed-rice',
    name: 'Steamed White Rice (Chawal)',
    hindiName: 'चावल',
    servingDescription: '1 medium katori (~150g cooked white rice)',
    servingUnit: 'katori (150g)',
    defaultServingQty: 1,
    calories: 195,
    proteinG: 4,
    carbsG: 43,
    fatsG: 0.5,
    category: 'Grains & Breads',
    detectedComponents: ['Cooked White Rice'],
  },
  {
    id: 'curd-dahi',
    name: 'Homemade Curd (Dahi)',
    hindiName: 'दही',
    servingDescription: '1 katori (~150g fresh plain curd)',
    servingUnit: 'katori (150g)',
    defaultServingQty: 1,
    calories: 95,
    proteinG: 5,
    carbsG: 6,
    fatsG: 6,
    category: 'Dairy & Protein',
    detectedComponents: ['Fresh Fermented Milk Curd'],
  },
];

export const addNutritionLog = async (
  userId: string,
  log: Omit<NutritionLogItem, 'id' | 'loggedAt'>
): Promise<string | null> => {
  if (!db || !userId) return null;
  const colRef = collection(db, 'users', userId, 'nutrition_logs');
  const docRef = await addDoc(colRef, {
    ...log,
    loggedAt: serverTimestamp(),
  });

  // Automatically record core maintenance goal for streak
  await recordStreakActivity(userId, 'meal');

  return docRef.id;
};

export const deleteNutritionLog = async (
  userId: string,
  logId: string
): Promise<void> => {
  if (!db || !userId || !logId) return;
  const logRef = doc(db, 'users', userId, 'nutrition_logs', logId);
  await deleteDoc(logRef);
};

export const subscribeNutritionLogs = (
  userId: string,
  callback: (logs: NutritionLogItem[]) => void,
  limitCount = 60
): Unsubscribe => {
  if (!db || !userId) {
    callback([]);
    return () => {};
  }

  const colRef = collection(db, 'users', userId, 'nutrition_logs');
  const q = query(colRef, orderBy('loggedAt', 'desc'), limit(limitCount));

  return onSnapshot(
    q,
    (snapshot) => {
      const logs: NutritionLogItem[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<NutritionLogItem, 'id'>),
      }));
      callback(logs);
    },
    (error) => {
      console.warn('Firestore nutrition logs snapshot error:', error);
      callback([]);
    }
  );
};

/* ==================== DAILY CHECK-INS & REWARDS ==================== */
export interface AiPhysiqueAnalysis {
  bodyTypeEstimate: string;
  physiqueObservations: string[];
  symmetryNotes: string;
  recoveryAdjustment: string;
  volumeRecommendation: string;
}

export interface CheckInItem {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  fatigueRating: number; // 1 (exhausted) to 5 (peak readiness)
  fatigueLevel?: number;
  sorenessNotes?: string;
  photoUrl: string;
  aiPhysiqueAnalysis?: AiPhysiqueAnalysis;
  restingHeartRateBpm?: number;
  sleepHours?: number;
  energyLevel?: 'low' | 'moderate' | 'high';
  steps?: number;
  isFasting?: boolean;
  fastingType?: 'none' | 'partial_fruit' | 'water_only' | 'traditional_viratham';
  fastingNotes?: string;
  waterMl?: number;
  caloriesConsumed?: number;
  proteinG?: number;
  nutritionScore?: number;
  createdAt?: unknown;
}

export interface UserReward {
  id: string;
  badgeId: string;
  title: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  icon: string;
  category?: 'streak' | 'workout' | 'steps' | 'hydration' | 'nutrition' | 'fasting' | 'physique' | 'routine';
  unlockedAt?: unknown;
}

export const BADGE_DEFINITIONS: Omit<UserReward, 'id' | 'unlockedAt'>[] = [
  // --- Longevity & Consistency Streaks ---
  {
    badgeId: 'first-step',
    title: 'First Step',
    description: 'Logged your very first morning check-in and weight record.',
    tier: 'bronze',
    icon: 'Footprints',
    category: 'streak',
  },
  {
    badgeId: 'streak-3',
    title: 'Consistency Ignition',
    description: 'Maintained 3 consecutive check-in milestones.',
    tier: 'silver',
    icon: 'Flame',
    category: 'streak',
  },
  {
    badgeId: 'streak-7',
    title: 'Streak Master',
    description: 'Completed a 7-day uninterrupted check-in streak.',
    tier: 'gold',
    icon: 'Trophy',
    category: 'streak',
  },
  {
    badgeId: 'streak-14',
    title: 'Two-Week Titan',
    description: 'Maintained a 14-day consecutive fitness maintenance streak.',
    tier: 'gold',
    icon: 'Shield',
    category: 'streak',
  },
  {
    badgeId: 'streak-30',
    title: 'Maintenance Legend',
    description: 'Completed a 30-day uninterrupted maintenance streak.',
    tier: 'diamond',
    icon: 'Sparkles',
    category: 'streak',
  },
  {
    badgeId: 'streak-60',
    title: 'Diamond Discipline',
    description: 'Maintained an unbroken 60-day fitness & wellness streak.',
    tier: 'diamond',
    icon: 'Crown',
    category: 'streak',
  },
  {
    badgeId: 'streak-100',
    title: 'Centurion Athlete',
    description: 'Reached the pinnacle 100-day uninterrupted fitness streak.',
    tier: 'diamond',
    icon: 'Award',
    category: 'streak',
  },

  // --- Strength, Workouts & Volume ---
  {
    badgeId: 'first-workout',
    title: 'Iron Initiate',
    description: 'Logged and completed your first workout session in the training tracker.',
    tier: 'bronze',
    icon: 'Dumbbell',
    category: 'workout',
  },
  {
    badgeId: 'workout-5',
    title: 'High-Frequency Grinder',
    description: 'Completed 5 logged workouts with tracked exercises and sets.',
    tier: 'silver',
    icon: 'Dumbbell',
    category: 'workout',
  },
  {
    badgeId: 'workout-20',
    title: 'Century Set Master',
    description: 'Crushed 20 full workout sessions with progressive overload.',
    tier: 'gold',
    icon: 'Zap',
    category: 'workout',
  },
  {
    badgeId: 'volume-10k',
    title: '10 Ton Lifter',
    description: 'Moved over 10,000 kg in cumulative training volume across tracked workouts.',
    tier: 'silver',
    icon: 'Dumbbell',
    category: 'workout',
  },
  {
    badgeId: 'volume-50k',
    title: 'Heavy Metal Hero',
    description: 'Surpassed 50,000 kg in total training volume across all completed lifts.',
    tier: 'gold',
    icon: 'Zap',
    category: 'workout',
  },
  {
    badgeId: 'volume-100k',
    title: 'Titan of Iron',
    description: 'Moved over 100,000 kg in cumulative lifted volume in the gym.',
    tier: 'diamond',
    icon: 'Crown',
    category: 'workout',
  },

  // --- Cardio, Steps & Energy ---
  {
    badgeId: 'steps-10k',
    title: '10K Step Stride',
    description: 'Hit 10,000 steps in a single day for optimal daily energy expenditure.',
    tier: 'bronze',
    icon: 'Footprints',
    category: 'steps',
  },
  {
    badgeId: 'steps-50k',
    title: 'Endurance Explorer',
    description: 'Accumulated 50,000 steps across your tracked daily walks.',
    tier: 'silver',
    icon: 'Footprints',
    category: 'steps',
  },
  {
    badgeId: 'steps-100k',
    title: 'Centurion Walker',
    description: 'Surpassed 100,000 cumulative steps on your walking & cardio journey.',
    tier: 'gold',
    icon: 'Footprints',
    category: 'steps',
  },
  {
    badgeId: 'dawn-patrol',
    title: 'Dawn Patrol',
    description: 'Completed an early morning cardio or check-in session before 8:00 AM.',
    tier: 'bronze',
    icon: 'Sun',
    category: 'steps',
  },

  // --- Hydration & Cellular Health ---
  {
    badgeId: 'hydro-beast',
    title: 'Hydration Vanguard',
    description: 'Drank 3,000ml+ water in a single day for peak cellular hydration.',
    tier: 'bronze',
    icon: 'Droplets',
    category: 'hydration',
  },
  {
    badgeId: 'hydro-streak-5',
    title: 'Pure Flow Streak',
    description: 'Hit your daily water intake target for 5 consecutive check-in days.',
    tier: 'silver',
    icon: 'Droplets',
    category: 'hydration',
  },
  {
    badgeId: 'hydration-master',
    title: 'Hydro Equilibrium',
    description: 'Logged 10 days of hitting full hydration target during training & fasting.',
    tier: 'gold',
    icon: 'Droplets',
    category: 'hydration',
  },

  // --- Nutrition & Macros ---
  {
    badgeId: 'smart-fueler',
    title: 'Smart Fueler',
    description: 'Logged your first meal with AI camera macro and calorie recognition.',
    tier: 'bronze',
    icon: 'Utensils',
    category: 'nutrition',
  },
  {
    badgeId: 'protein-architect',
    title: 'Protein Architect',
    description: 'Hit your daily optimal protein goal for muscle repair and satiety.',
    tier: 'silver',
    icon: 'Target',
    category: 'nutrition',
  },
  {
    badgeId: 'macro-sniper',
    title: 'Macro Sniper',
    description: 'Maintained calories and macros within ±5% of your maintenance target.',
    tier: 'gold',
    icon: 'Target',
    category: 'nutrition',
  },
  {
    badgeId: 'nutrient-diversity',
    title: 'Culinary Alchemist',
    description: 'Logged 5 or more diverse whole-food Indian meals & nutrient staples.',
    tier: 'silver',
    icon: 'Apple',
    category: 'nutrition',
  },

  // --- Fasting & Recovery ---
  {
    badgeId: 'fasting-harmony',
    title: 'Fasting Harmony',
    description: 'Observed a scheduled fasting day and aligned training & hydration.',
    tier: 'silver',
    icon: 'Flame',
    category: 'fasting',
  },
  {
    badgeId: 'fasting-warrior',
    title: 'Metabolic Sage',
    description: 'Completed 3 scheduled intermittent or traditional viratham fasting days.',
    tier: 'gold',
    icon: 'Moon',
    category: 'fasting',
  },
  {
    badgeId: 'zen-recovery',
    title: 'Deep Recovery',
    description: 'Logged 8+ hours of quality sleep with low resting physical fatigue.',
    tier: 'bronze',
    icon: 'HeartPulse',
    category: 'fasting',
  },

  // --- Physique & Readiness ---
  {
    badgeId: 'maintenance-anchor',
    title: 'Maintenance Anchor',
    description: 'Maintained body weight within ±0.75kg target variance over 5 check-ins.',
    tier: 'gold',
    icon: 'Anchor',
    category: 'physique',
  },
  {
    badgeId: 'physique-pioneer',
    title: 'Physique Pioneer',
    description: 'Unlocked your first Gemini AI vision body type & symmetry analysis.',
    tier: 'silver',
    icon: 'Camera',
    category: 'physique',
  },
  {
    badgeId: 'iron-will',
    title: 'Iron Will & Readiness',
    description: 'Completed 10 full readiness and recovery fatigue evaluations.',
    tier: 'diamond',
    icon: 'Shield',
    category: 'physique',
  },

  // --- Routine & Discipline ---
  {
    badgeId: 'routine-architect',
    title: 'Master of Routine',
    description: 'Configured personalized daily routine timings & natural voice reminders.',
    tier: 'bronze',
    icon: 'Clock',
    category: 'routine',
  },
  {
    badgeId: 'alarm-pioneer',
    title: 'Cinema Awakening',
    description: 'Personalized your wake-up alarm with a custom video song or motivating media.',
    tier: 'bronze',
    icon: 'Sparkles',
    category: 'routine',
  },
];

export const addCheckIn = async (
  userId: string,
  checkIn: Partial<Omit<CheckInItem, 'id' | 'createdAt'>> & { date: string }
): Promise<string | null> => {
  if (!db || !userId) return null;
  const dateStr = checkIn.date || getTodayDateString();
  const dateDocRef = doc(db, 'users', userId, 'checkins', dateStr);
  await setDoc(
    dateDocRef,
    {
      ...checkIn,
      date: dateStr,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // Also write to collection for legacy auto-id listeners if needed
  const colRef = collection(db, 'users', userId, 'checkins');
  await addDoc(colRef, {
    ...checkIn,
    date: dateStr,
    createdAt: serverTimestamp(),
  });

  // Automatically record core maintenance goal for streak
  await recordStreakActivity(userId, 'checkin', dateStr);

  return dateStr;
};

export const deleteCheckIn = async (
  userId: string,
  checkInId: string
): Promise<void> => {
  if (!db || !userId || !checkInId) return;
  const docRef = doc(db, 'users', userId, 'checkins', checkInId);
  await deleteDoc(docRef);
};

export const subscribeCheckIns = (
  userId: string,
  callback: (checkIns: CheckInItem[]) => void,
  limitCount = 60
): Unsubscribe => {
  if (!db || !userId) {
    callback([]);
    return () => {};
  }

  const colRef = collection(db, 'users', userId, 'checkins');
  const q = query(colRef, orderBy('date', 'desc'), limit(limitCount));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: CheckInItem[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<CheckInItem, 'id'>),
      }));
      callback(items);
    },
    (error) => {
      console.warn('Firestore checkins snapshot error:', error);
      callback([]);
    }
  );
};

export const subscribeRewards = (
  userId: string,
  callback: (rewards: UserReward[]) => void
): Unsubscribe => {
  if (!db || !userId) {
    callback([]);
    return () => {};
  }

  const colRef = collection(db, 'users', userId, 'rewards');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: UserReward[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<UserReward, 'id'>),
      }));
      callback(items);
    },
    (error) => {
      console.warn('Firestore rewards snapshot error:', error);
      callback([]);
    }
  );
};

export const unlockReward = async (
  userId: string,
  badge: Omit<UserReward, 'id' | 'unlockedAt'>
): Promise<void> => {
  if (!db || !userId) return;
  const docRef = doc(db, 'users', userId, 'rewards', badge.badgeId);
  await setDoc(
    docRef,
    {
      ...badge,
      unlockedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

/**
 * Evaluates user progress and automatically unlocks newly earned badges in Firestore.
 * Returns any newly unlocked rewards to trigger the celebration animation.
 */
export const evaluateAndUnlockBadges = async (
  userId: string,
  checkIns: CheckInItem[],
  currentRewards: UserReward[],
  targetWeightKg?: number,
  currentStreak = 0,
  extraContext?: {
    totalWorkouts?: number;
    totalVolumeKg?: number;
    totalSteps?: number;
    waterMlToday?: number;
    nutritionLogsCount?: number;
    customRoutinesCount?: number;
    hasAlarmVideo?: boolean;
  }
): Promise<UserReward[]> => {
  if (!userId || checkIns.length === 0) return [];

  const existingBadgeIds = new Set(currentRewards.map((r) => r.badgeId));
  const newlyUnlocked: UserReward[] = [];

  const checkAndUnlock = async (badgeDef: Omit<UserReward, 'id' | 'unlockedAt'>) => {
    if (!existingBadgeIds.has(badgeDef.badgeId)) {
      await unlockReward(userId, badgeDef);
      newlyUnlocked.push({
        id: badgeDef.badgeId,
        ...badgeDef,
        unlockedAt: new Date(),
      });
      existingBadgeIds.add(badgeDef.badgeId);
    }
  };

  // Resolve cached workout stats and effective streak if not provided
  let statsWorkouts = extraContext?.totalWorkouts ?? 0;
  let statsVolume = extraContext?.totalVolumeKg ?? 0;
  const cachedStatsStr = localStorage.getItem(`fit_user_stats_${userId}`);
  if (cachedStatsStr) {
    try {
      const parsed = JSON.parse(cachedStatsStr);
      if (parsed.totalWorkoutsCompleted) {
        statsWorkouts = Math.max(statsWorkouts, Number(parsed.totalWorkoutsCompleted) || 0);
      }
      if (parsed.totalVolumeLiftedKg) {
        statsVolume = Math.max(statsVolume, Number(parsed.totalVolumeLiftedKg) || 0);
      }
    } catch {
      // Ignored
    }
  }

  let effStreak = currentStreak;
  if (!effStreak) {
    const cachedStreakStr = localStorage.getItem(`fit_user_streak_${userId}`);
    if (cachedStreakStr) {
      try {
        const parsed = JSON.parse(cachedStreakStr);
        effStreak = Number(parsed.currentStreak) || 0;
      } catch {
        // Ignored
      }
    }
  }

  // --- 1. Streak & Longevity Badges ---
  // First Step (1 checkin)
  if (checkIns.length >= 1) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'first-step');
    if (b) await checkAndUnlock(b);
  }

  // Consistency Ignition (3 checkins or 3-day streak)
  if (checkIns.length >= 3 || effStreak >= 3) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'streak-3');
    if (b) await checkAndUnlock(b);
  }

  // Streak Master (7 checkins or 7-day streak)
  if (checkIns.length >= 7 || effStreak >= 7) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'streak-7');
    if (b) await checkAndUnlock(b);
  }

  // Two-Week Titan (14-day streak or 14 checkins)
  if (effStreak >= 14 || checkIns.length >= 14) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'streak-14');
    if (b) await checkAndUnlock(b);
  }

  // Maintenance Legend (30-day streak or 30 checkins)
  if (effStreak >= 30 || checkIns.length >= 30) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'streak-30');
    if (b) await checkAndUnlock(b);
  }

  // Diamond Discipline (60-day streak or 60 checkins)
  if (effStreak >= 60 || checkIns.length >= 60) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'streak-60');
    if (b) await checkAndUnlock(b);
  }

  // Centurion Athlete (100-day streak or 100 checkins)
  if (effStreak >= 100 || checkIns.length >= 100) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'streak-100');
    if (b) await checkAndUnlock(b);
  }

  // --- 2. Workouts & Lifted Volume Badges ---
  if (statsWorkouts >= 1) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'first-workout');
    if (b) await checkAndUnlock(b);
  }
  if (statsWorkouts >= 5) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'workout-5');
    if (b) await checkAndUnlock(b);
  }
  if (statsWorkouts >= 20) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'workout-20');
    if (b) await checkAndUnlock(b);
  }
  if (statsVolume >= 10000) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'volume-10k');
    if (b) await checkAndUnlock(b);
  }
  if (statsVolume >= 50000) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'volume-50k');
    if (b) await checkAndUnlock(b);
  }
  if (statsVolume >= 100000) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'volume-100k');
    if (b) await checkAndUnlock(b);
  }

  // --- 3. Steps & Cardio Badges ---
  const cumulativeSteps = checkIns.reduce((sum, c) => sum + (c.steps || 0), 0);
  if (checkIns.some((c) => (c.steps || 0) >= 10000) || (extraContext?.totalSteps || 0) >= 10000) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'steps-10k');
    if (b) await checkAndUnlock(b);
  }
  if (cumulativeSteps >= 50000 || checkIns.some((c) => (c.steps || 0) >= 15000)) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'steps-50k');
    if (b) await checkAndUnlock(b);
  }
  if (cumulativeSteps >= 100000) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'steps-100k');
    if (b) await checkAndUnlock(b);
  }
  // Dawn Patrol: early morning cardio or checkin
  if (
    checkIns.some((c) => {
      const s = c.sorenessNotes?.toLowerCase() || '';
      return s.includes('dawn') || s.includes('morning walk') || s.includes('cardio');
    }) ||
    checkIns.length >= 2
  ) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'dawn-patrol');
    if (b) await checkAndUnlock(b);
  }

  // --- 4. Hydration & Cellular Health Badges ---
  if (checkIns.some((c) => (c.waterMl || 0) >= 3000) || (extraContext?.waterMlToday || 0) >= 3000) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'hydro-beast');
    if (b) await checkAndUnlock(b);
  }
  const goodHydrationDays = checkIns.filter((c) => (c.waterMl || 0) >= 2000).length;
  if (goodHydrationDays >= 5) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'hydro-streak-5');
    if (b) await checkAndUnlock(b);
  }
  if (goodHydrationDays >= 10) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'hydration-master');
    if (b) await checkAndUnlock(b);
  }

  // --- 5. Nutrition & Macro Badges ---
  if (
    checkIns.some((c) => (c.caloriesConsumed || 0) > 0) ||
    (extraContext?.nutritionLogsCount || 0) >= 1
  ) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'smart-fueler');
    if (b) await checkAndUnlock(b);
  }
  if (checkIns.some((c) => (c.proteinG || 0) >= 90)) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'protein-architect');
    if (b) await checkAndUnlock(b);
  }
  if (checkIns.some((c) => (c.nutritionScore || 0) >= 80 || (c.caloriesConsumed || 0) >= 1400)) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'macro-sniper');
    if (b) await checkAndUnlock(b);
  }
  if (checkIns.length >= 5) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'nutrient-diversity');
    if (b) await checkAndUnlock(b);
  }

  // --- 6. Fasting & Recovery Badges ---
  if (checkIns.some((c) => Boolean(c.isFasting) || (c.fastingType && c.fastingType !== 'none'))) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'fasting-harmony');
    if (b) await checkAndUnlock(b);
  }
  const fastingDays = checkIns.filter(
    (c) => Boolean(c.isFasting) || (c.fastingType && c.fastingType !== 'none')
  ).length;
  if (fastingDays >= 3) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'fasting-warrior');
    if (b) await checkAndUnlock(b);
  }
  if (
    checkIns.some(
      (c) => (c.sleepHours || 0) >= 8 && ((c.fatigueRating || 0) >= 4 || (c.fatigueLevel || 0) <= 2)
    )
  ) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'zen-recovery');
    if (b) await checkAndUnlock(b);
  }

  // --- 7. Physique & Readiness Badges ---
  if (checkIns.some((c) => Boolean(c.aiPhysiqueAnalysis))) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'physique-pioneer');
    if (b) await checkAndUnlock(b);
  }

  if (targetWeightKg && checkIns.length >= 3) {
    const withinMaintenance = checkIns.filter(
      (c) => Math.abs(c.weightKg - targetWeightKg) <= 0.75
    ).length;
    if (withinMaintenance >= 3) {
      const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'maintenance-anchor');
      if (b) await checkAndUnlock(b);
    }
  }

  if (checkIns.length >= 10) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'iron-will');
    if (b) await checkAndUnlock(b);
  }

  // --- 8. Routine & Discipline Badges ---
  if (
    (extraContext?.customRoutinesCount || 0) >= 1 ||
    localStorage.getItem(`fit_user_routine_settings_${userId}`) !== null ||
    localStorage.getItem(`fit_routine_settings_${userId}`) !== null
  ) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'routine-architect');
    if (b) await checkAndUnlock(b);
  }
  if (
    extraContext?.hasAlarmVideo === true ||
    localStorage.getItem(`fit_alarm_videos_${userId}`) !== null
  ) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'alarm-pioneer');
    if (b) await checkAndUnlock(b);
  }

  return newlyUnlocked;
};

/* ==================== DATE UTILITIES ==================== */
export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isToday = (timestamp: unknown): boolean => {
  if (!timestamp) return false;
  let date: Date;
  if (typeof (timestamp as { toDate?: () => Date }).toDate === 'function') {
    date = (timestamp as { toDate: () => Date }).toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else {
    return false;
  }
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/* ==================== DAILY WATER INTAKE (HYDRATION ENGINE) ==================== */
export interface DailyHydration {
  date: string; // YYYY-MM-DD
  waterMl: number;
  targetMl: number;
  updatedAt?: unknown;
}

export const DEFAULT_DAILY_HYDRATION: DailyHydration = {
  date: getTodayDateString(),
  waterMl: 0,
  targetMl: 3000,
};

export const subscribeDailyHydration = (
  userId: string,
  dateStr: string,
  callback: (hydration: DailyHydration) => void
): Unsubscribe => {
  if (!userId) {
    callback({ ...DEFAULT_DAILY_HYDRATION, date: dateStr });
    return () => {};
  }

  const cacheKey = `fit_hydration_${userId}_${dateStr}`;
  const getCachedHydration = (): DailyHydration => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          date: dateStr,
          waterMl: Number(parsed.waterMl) || 0,
          targetMl: Number(parsed.targetMl) || 3000,
        };
      }
    } catch {}
    return { ...DEFAULT_DAILY_HYDRATION, date: dateStr };
  };

  callback(getCachedHydration());

  if (!db || userId.startsWith('guest_') || !auth?.currentUser) {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === cacheKey && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          callback({
            date: dateStr,
            waterMl: Number(parsed.waterMl) || 0,
            targetMl: Number(parsed.targetMl) || 3000,
          });
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }

  const docRef = doc(db, 'users', userId, 'data', `hydration_${dateStr}`);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const obj = {
          date: dateStr,
          waterMl: Number(data.waterMl) || 0,
          targetMl: Number(data.targetMl) || 3000,
          updatedAt: data.updatedAt,
        };
        try {
          localStorage.setItem(cacheKey, JSON.stringify(obj));
        } catch {}
        callback(obj);
      } else {
        callback(getCachedHydration());
      }
    },
    (err) => {
      console.warn('Daily hydration snapshot notice, falling back to local cache:', err);
      callback(getCachedHydration());
    }
  );
};

export const logWaterIntake = async (
  userId: string,
  dateStr: string,
  deltaMl: number,
  targetMl = 3000
): Promise<number> => {
  if (!userId) return 0;
  const cacheKey = `fit_hydration_${userId}_${dateStr}`;
  let currentMl = 0;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) currentMl = Number(JSON.parse(cached).waterMl) || 0;
  } catch {}

  const newAmount = Math.max(0, currentMl + deltaMl);
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ date: dateStr, waterMl: newAmount, targetMl }));
  } catch {}

  if (db && !userId.startsWith('guest_') && auth?.currentUser) {
    try {
      const docRef = doc(db, 'users', userId, 'data', `hydration_${dateStr}`);
      await setDoc(
        docRef,
        {
          date: dateStr,
          waterMl: newAmount,
          targetMl,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Notice saving water intake to Firestore, preserved locally:', err);
    }
  }

  if (newAmount >= 3000) {
    try {
      const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'hydro-beast');
      if (b) await unlockReward(userId, b);
    } catch {
      // Non-blocking
    }
  }

  return newAmount;
};

export const resetWaterIntake = async (
  userId: string,
  dateStr: string,
  targetMl = 3000
): Promise<void> => {
  if (!userId) return;
  const cacheKey = `fit_hydration_${userId}_${dateStr}`;
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ date: dateStr, waterMl: 0, targetMl }));
  } catch {}

  if (db && !userId.startsWith('guest_') && auth?.currentUser) {
    try {
      const docRef = doc(db, 'users', userId, 'data', `hydration_${dateStr}`);
      await setDoc(
        docRef,
        {
          date: dateStr,
          waterMl: 0,
          targetMl,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Notice resetting water intake in Firestore, preserved locally:', err);
    }
  }
};

/* ==================== DAILY STEPS & ACTIVITY TRACKER ==================== */
export interface DailyActivity {
  date: string; // YYYY-MM-DD
  steps: number;
  goalSteps: number;
  distanceKm?: number;
  caloriesBurned?: number;
  updatedAt?: unknown;
}

export const DEFAULT_DAILY_ACTIVITY: DailyActivity = {
  date: getTodayDateString(),
  steps: 0,
  goalSteps: 10000,
  distanceKm: 0,
  caloriesBurned: 0,
};

export const subscribeDailyActivity = (
  userId: string,
  dateStr: string,
  callback: (activity: DailyActivity) => void
): Unsubscribe => {
  if (!userId) {
    callback({ ...DEFAULT_DAILY_ACTIVITY, date: dateStr });
    return () => {};
  }

  const cacheKey = `fit_activity_${userId}_${dateStr}`;
  const getCachedActivity = (): DailyActivity => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {}
    return { ...DEFAULT_DAILY_ACTIVITY, date: dateStr };
  };

  callback(getCachedActivity());

  if (!db || userId.startsWith('guest_') || !auth?.currentUser) {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === cacheKey && e.newValue) {
        try {
          callback(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }

  const docRef = doc(db, 'users', userId, 'data', `activity_${dateStr}`);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const steps = Number(data.steps) || 0;
        const goalSteps = Number(data.goalSteps) || 10000;
        const obj = {
          date: dateStr,
          steps,
          goalSteps,
          distanceKm: parseFloat((steps * 0.00076).toFixed(2)),
          caloriesBurned: Math.round(steps * 0.04),
          updatedAt: data.updatedAt,
        };
        try {
          localStorage.setItem(cacheKey, JSON.stringify(obj));
        } catch {}
        callback(obj);
      } else {
        callback(getCachedActivity());
      }
    },
    (err) => {
      console.warn('Daily activity snapshot notice, falling back to local cache:', err);
      callback(getCachedActivity());
    }
  );
};

export const logDailySteps = async (
  userId: string,
  dateStr: string,
  steps: number,
  goalSteps = 10000
): Promise<void> => {
  if (!userId) return;
  const safeSteps = Math.max(0, Math.round(steps));
  const activityData: DailyActivity = {
    date: dateStr,
    steps: safeSteps,
    goalSteps,
    distanceKm: parseFloat((safeSteps * 0.00076).toFixed(2)),
    caloriesBurned: Math.round(safeSteps * 0.04),
  };

  const cacheKey = `fit_activity_${userId}_${dateStr}`;
  try {
    localStorage.setItem(cacheKey, JSON.stringify(activityData));
  } catch {}

  if (db && !userId.startsWith('guest_') && auth?.currentUser) {
    try {
      const docRef = doc(db, 'users', userId, 'data', `activity_${dateStr}`);
      await setDoc(
        docRef,
        {
          ...activityData,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Notice saving steps to Firestore, preserved locally:', err);
    }
  }
};

/* ==================== BODY MAINTENANCE BALANCE (BMB) SCORE ==================== */
export interface BmbScoreResult {
  score: number; // 0 - 100
  status: 'optimal' | 'stable' | 'surplus' | 'deficit' | 'fatigue';
  statusLabel: string;
  calorieDeviationPct: number;
  calorieDiff: number;
  todayCalories: number;
  targetCalories: number;
  breakdown: {
    calorieScore: number;
    recoveryScore: number;
    consistencyScore: number;
    hydrationScore: number;
    activityScore: number;
  };
  todayWaterMl: number;
  waterTargetMl: number;
  todaySteps: number;
  stepsGoal: number;
  vitals?: {
    restingHeartRateBpm?: number;
    sleepHours?: number;
    energyLevel?: 'low' | 'moderate' | 'high';
  };
  recommendation: string;
  suggestedAdjustment: {
    type: 'increase_volume' | 'reduce_volume' | 'none';
    setsDelta: number;
    badgeTitle: string;
    message: string;
    actionLabel: string;
  };
}

export const calculateBmbScore = (
  targetCalories: number,
  todayCalories: number,
  latestCheckIn?: CheckInItem | null,
  recentWorkouts?: CompletedWorkout[],
  todayWaterMl = 0,
  waterTargetMl = 3000,
  todaySteps = 0,
  stepsGoal = 10000,
  fastingState?: { isFasting: boolean; fastingType?: 'none' | 'partial_fruit' | 'water_only' | 'traditional_viratham' }
): BmbScoreResult => {
  const isFastingActive = Boolean(fastingState?.isFasting && fastingState.fastingType && fastingState.fastingType !== 'none');
  const isWaterFast = fastingState?.fastingType === 'water_only';

  const safeTarget = isWaterFast ? 0 : Math.max(isFastingActive ? 400 : 1200, targetCalories || (isFastingActive ? 800 : 2000));
  const calorieDiff = todayCalories - safeTarget;
  const calorieDeviationPct =
    isWaterFast
      ? (todayCalories > 50 ? 100 : 0)
      : safeTarget > 0 && todayCalories > 0
      ? Math.round(((todayCalories - safeTarget) / safeTarget) * 1000) / 10
      : 0;

  // 1. Caloric Alignment (max 35 pts)
  let calorieScore = 30; // Neutral baseline
  if (isWaterFast) {
    calorieScore = todayCalories <= 50 ? 35 : todayCalories <= 150 ? 25 : 10;
  } else if (todayCalories > 0 || isFastingActive) {
    const absDev = Math.abs(calorieDeviationPct);
    if (absDev <= 10) calorieScore = 35;
    else if (absDev <= 20) calorieScore = 30;
    else if (absDev <= 30) calorieScore = 22;
    else calorieScore = 12;
  }

  // 2. Recovery & Vitals (max 25 pts)
  let recoveryScore = 18;
  if (latestCheckIn) {
    let sub = 0;
    // Fatigue rating (1-5) -> up to 12 pts
    const rating = Math.min(5, Math.max(1, latestCheckIn.fatigueRating || 3));
    sub += rating * 2.4;

    // Sleep hours (optimal: 7-9 hours) -> up to 8 pts
    if (latestCheckIn.sleepHours) {
      const s = latestCheckIn.sleepHours;
      if (s >= 7 && s <= 9) sub += 8;
      else if (s >= 6) sub += 6;
      else sub += 3;
    } else {
      sub += 5; // Default assumption
    }

    // Energy level -> up to 5 pts
    if (latestCheckIn.energyLevel === 'high') sub += 5;
    else if (latestCheckIn.energyLevel === 'moderate') sub += 4;
    else if (latestCheckIn.energyLevel === 'low') sub += 1;
    else sub += 3;

    recoveryScore = Math.min(25, Math.round(sub));
  }

  // 3. Training Consistency & Volume (max 20 pts)
  const workoutsLast7Days = (recentWorkouts || []).length;
  let consistencyScore = 8;
  if (workoutsLast7Days >= 3 && workoutsLast7Days <= 5) {
    consistencyScore = 20;
  } else if (workoutsLast7Days === 2) {
    consistencyScore = 15;
  } else if (workoutsLast7Days === 1) {
    consistencyScore = 10;
  } else if (workoutsLast7Days > 5) {
    consistencyScore = 16;
  }

  // 4. Hydration Engine Adherence (max 10 pts)
  let hydrationScore = 5;
  if (todayWaterMl > 0) {
    const hydRatio = Math.min(1.0, todayWaterMl / Math.max(1000, waterTargetMl));
    hydrationScore = Math.min(10, Math.round(hydRatio * 10));
  }

  // 5. Steps / Active Movement (max 10 pts)
  let activityScore = 5;
  if (todaySteps > 0) {
    const stepRatio = Math.min(1.0, todaySteps / Math.max(5000, stepsGoal));
    activityScore = Math.min(10, Math.round(stepRatio * 10));
  }

  const score = Math.min(
    100,
    Math.max(0, calorieScore + recoveryScore + consistencyScore + hydrationScore + activityScore)
  );

  // Determine Status & Reactive Alert Criteria
  let status: 'optimal' | 'stable' | 'surplus' | 'deficit' | 'fatigue' = 'stable';
  let statusLabel = 'Stable Maintenance';

  const isSurplusAlert = !isWaterFast && calorieDeviationPct > 15;
  const isDeficitAlert = !isFastingActive && calorieDeviationPct < -15 && todayCalories > 0;
  const isFatigueAlert = Boolean(latestCheckIn && (latestCheckIn.fatigueRating <= 2 || latestCheckIn.energyLevel === 'low'));

  if (isWaterFast) {
    status = 'optimal';
    statusLabel = 'Water Fast Equilibrium (Autophagy)';
  } else if (isFastingActive) {
    status = 'optimal';
    statusLabel = 'Fasting Mode Balance';
  } else if (isFatigueAlert) {
    status = 'fatigue';
    statusLabel = 'High Fatigue / Deload Advisory';
  } else if (isSurplusAlert) {
    status = 'surplus';
    statusLabel = 'Caloric Surplus Alert (>15%)';
  } else if (isDeficitAlert) {
    status = 'deficit';
    statusLabel = 'Deficit Drift Alert (>15%)';
  } else if (score >= 82) {
    status = 'optimal';
    statusLabel = 'Optimal Maintenance Equilibrium';
  }

  // Dynamic Suggestion & Adjustment
  let suggestedAdjustment: BmbScoreResult['suggestedAdjustment'] = {
    type: 'none',
    setsDelta: 0,
    badgeTitle: 'Equilibrium Maintained',
    message:
      'Energy balance, hydration, and recovery readiness are within nominal maintenance tolerances (±15%). Execute scheduled workout volume as planned.',
    actionLabel: 'Preserve Routine Volume',
  };

  if (isWaterFast) {
    suggestedAdjustment = {
      type: 'reduce_volume',
      setsDelta: -1,
      badgeTitle: 'Fasting Protection Active',
      message: 'Strict Water Fast active. Heavy compound lifting is scaled back in favor of active recovery and joint mobility to protect lean mass and vital energy.',
      actionLabel: 'Preserve Recovery Routine',
    };
  } else if (isFastingActive) {
    suggestedAdjustment = {
      type: 'none',
      setsDelta: 0,
      badgeTitle: 'Fasting Equilibrium',
      message: 'Fasting targets active. Macro and hydration targets have been recalibrated. Maintain moderate training intensity.',
      actionLabel: 'Preserve Fasting Routine',
    };
  } else if (isSurplusAlert) {
    suggestedAdjustment = {
      type: 'increase_volume',
      setsDelta: 2,
      badgeTitle: 'Surplus Buffer Active',
      message: `Intake is +${calorieDeviationPct}% above maintenance (+${calorieDiff} kcal). FitMaintenance AI recommends +2 volume sets across your active workout exercises to accelerate glycogen replenishment and maintain baseline leanness.`,
      actionLabel: 'Apply Volume Adjustment (+2 Sets)',
    };
  } else if (isDeficitAlert) {
    suggestedAdjustment = {
      type: 'reduce_volume',
      setsDelta: -1,
      badgeTitle: 'Deficit Protection Active',
      message: `Intake is ${Math.abs(calorieDeviationPct)}% below maintenance (${calorieDiff} kcal). FitMaintenance AI recommends trimming 1 set per exercise to conserve central nervous system resources and prevent lean tissue catabolism.`,
      actionLabel: 'Apply Volume Reduction (-1 Set)',
    };
  } else if (isFatigueAlert) {
    suggestedAdjustment = {
      type: 'reduce_volume',
      setsDelta: -1,
      badgeTitle: 'Fatigue Mitigation Active',
      message: `Readiness rating or energy indicates elevated fatigue. Reduce training intensity or volume by 1 set to prevent overtraining syndrome.`,
      actionLabel: 'Apply Volume Reduction (-1 Set)',
    };
  }

  // Dynamic recommendation text
  let recommendation = 'Your body composition maintenance balance is stable. Continue consistent training, hydration, and recovery.';
  if (isWaterFast) {
    recommendation = 'Strict Water Fasting protocol active. Emphasize 3.8L+ hydration, pinch of mineral pink salt, and restorative mobility.';
  } else if (isFastingActive) {
    recommendation = 'Fasting Mode active. Calorie and macro thresholds adapted. Maintain elevated hydration and avoid extreme fatigue.';
  } else if (isSurplusAlert) {
    recommendation = `Calorie surplus of +${calorieDiff} kcal detected. Tap "Apply Adjustment" to automatically inject +2 volume sets into your workout.`;
  } else if (isDeficitAlert) {
    recommendation = `Calorie deficit of ${Math.abs(calorieDiff)} kcal detected. Tap "Apply Adjustment" to safely scale down volume by -1 set.`;
  } else if (isFatigueAlert) {
    recommendation = 'Vitals & readiness rating indicate elevated strain. Focus on hydration, 8 hours of restorative sleep, and lighter training loads today.';
  } else if (score >= 85) {
    recommendation = 'Exceptional maintenance adherence. Energy intake, movement volume, hydration, and recovery vitals are synchronized.';
  }

  return {
    score,
    status,
    statusLabel,
    calorieDeviationPct,
    calorieDiff,
    todayCalories,
    targetCalories: safeTarget,
    breakdown: {
      calorieScore,
      recoveryScore,
      consistencyScore,
      hydrationScore,
      activityScore,
    },
    todayWaterMl,
    waterTargetMl,
    todaySteps,
    stepsGoal,
    vitals: latestCheckIn
      ? {
          restingHeartRateBpm: latestCheckIn.restingHeartRateBpm,
          sleepHours: latestCheckIn.sleepHours,
          energyLevel: latestCheckIn.energyLevel,
        }
      : undefined,
    recommendation,
    suggestedAdjustment,
  };
};

/* ==================== EQUIPMENT-AWARE EXERCISE CATALOG & ROUTINES ==================== */
export interface EquipmentExerciseDef {
  id: string;
  name: string;
  muscle: string;
  splitCategory: 'Push' | 'Pull' | 'Legs' | 'Core';
  requiredEquipment: string[]; // Strict: user must own ALL of these items, or ['None']
  defaultWeightKg: number;
  defaultReps: number;
}

export const EQUIPMENT_EXERCISE_DB: EquipmentExerciseDef[] = [
  // --- Cables & Pulleys ---
  {
    id: 'lat-pulldown-wide',
    name: 'Lat Pulldown (Wide Grip)',
    muscle: 'Back / Lats',
    splitCategory: 'Pull',
    requiredEquipment: ['Lat Pulldown'],
    defaultWeightKg: 45,
    defaultReps: 10,
  },
  {
    id: 'close-grip-pulldown',
    name: 'Close-Grip Neutral Lat Pulldown',
    muscle: 'Back / Lower Lats',
    splitCategory: 'Pull',
    requiredEquipment: ['Lat Pulldown'],
    defaultWeightKg: 40,
    defaultReps: 10,
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    muscle: 'Mid-Back / Rhomboids',
    splitCategory: 'Pull',
    requiredEquipment: ['Seated Cable Row'],
    defaultWeightKg: 45,
    defaultReps: 10,
  },
  {
    id: 'cable-chest-fly',
    name: 'Cable Crossover Chest Fly',
    muscle: 'Chest / Pectorals',
    splitCategory: 'Push',
    requiredEquipment: ['Cable Crossover'],
    defaultWeightKg: 15,
    defaultReps: 12,
  },
  {
    id: 'cable-face-pull',
    name: 'Cable Face Pull',
    muscle: 'Rear Delts & Rotators',
    splitCategory: 'Pull',
    requiredEquipment: ['Cable Crossover'],
    defaultWeightKg: 17.5,
    defaultReps: 15,
  },
  {
    id: 'cable-tricep-pushdown',
    name: 'Cable Tricep Pushdown',
    muscle: 'Triceps',
    splitCategory: 'Push',
    requiredEquipment: ['Cable Crossover'],
    defaultWeightKg: 20,
    defaultReps: 12,
  },
  {
    id: 'cable-bicep-curl',
    name: 'Cable Bicep Curl',
    muscle: 'Biceps',
    splitCategory: 'Pull',
    requiredEquipment: ['Cable Crossover'],
    defaultWeightKg: 17.5,
    defaultReps: 12,
  },

  // --- Machines ---
  {
    id: 'machine-chest-press',
    name: 'Machine Chest Press',
    muscle: 'Chest / Anterior Deltoid',
    splitCategory: 'Push',
    requiredEquipment: ['Chest/Shoulder Press'],
    defaultWeightKg: 50,
    defaultReps: 10,
  },
  {
    id: 'machine-shoulder-press',
    name: 'Machine Overhead Shoulder Press',
    muscle: 'Shoulders / Deltoids',
    splitCategory: 'Push',
    requiredEquipment: ['Chest/Shoulder Press'],
    defaultWeightKg: 35,
    defaultReps: 10,
  },
  {
    id: 'leg-press-45',
    name: '45° Leg Press',
    muscle: 'Quads & Glutes',
    splitCategory: 'Legs',
    requiredEquipment: ['Leg Press'],
    defaultWeightKg: 120,
    defaultReps: 10,
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    muscle: 'Quadriceps',
    splitCategory: 'Legs',
    requiredEquipment: ['Leg Extension'],
    defaultWeightKg: 40,
    defaultReps: 12,
  },
  {
    id: 'hamstring-curl',
    name: 'Lying / Seated Hamstring Curl',
    muscle: 'Hamstrings',
    splitCategory: 'Legs',
    requiredEquipment: ['Hamstring Curl'],
    defaultWeightKg: 35,
    defaultReps: 12,
  },
  {
    id: 'smith-machine-squat',
    name: 'Smith Machine Squat',
    muscle: 'Quads & Glutes',
    splitCategory: 'Legs',
    requiredEquipment: ['Smith Machine'],
    defaultWeightKg: 60,
    defaultReps: 10,
  },
  {
    id: 'smith-machine-incline',
    name: 'Smith Machine Incline Press',
    muscle: 'Upper Chest',
    splitCategory: 'Push',
    requiredEquipment: ['Smith Machine', 'Adjustable Bench'],
    defaultWeightKg: 45,
    defaultReps: 8,
  },

  // --- Free Weights & Benches ---
  {
    id: 'barbell-bench-press',
    name: 'Barbell Flat Bench Press',
    muscle: 'Chest & Triceps',
    splitCategory: 'Push',
    requiredEquipment: ['Barbell', 'Adjustable Bench'],
    defaultWeightKg: 60,
    defaultReps: 8,
  },
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    muscle: 'Upper Chest & Shoulders',
    splitCategory: 'Push',
    requiredEquipment: ['Dumbbells', 'Adjustable Bench'],
    defaultWeightKg: 22,
    defaultReps: 10,
  },
  {
    id: 'flat-dumbbell-press',
    name: 'Flat Dumbbell Press',
    muscle: 'Chest',
    splitCategory: 'Push',
    requiredEquipment: ['Dumbbells', 'Adjustable Bench'],
    defaultWeightKg: 24,
    defaultReps: 10,
  },
  {
    id: 'barbell-back-squat',
    name: 'Barbell Back Squat',
    muscle: 'Quads, Glutes & Adductors',
    splitCategory: 'Legs',
    requiredEquipment: ['Barbell'],
    defaultWeightKg: 70,
    defaultReps: 8,
  },
  {
    id: 'barbell-rdl',
    name: 'Barbell Romanian Deadlift (RDL)',
    muscle: 'Hamstrings & Posterior Chain',
    splitCategory: 'Legs',
    requiredEquipment: ['Barbell'],
    defaultWeightKg: 65,
    defaultReps: 10,
  },
  {
    id: 'barbell-bent-row',
    name: 'Barbell Bent-Over Row',
    muscle: 'Back & Rhomboids',
    splitCategory: 'Pull',
    requiredEquipment: ['Barbell'],
    defaultWeightKg: 50,
    defaultReps: 8,
  },
  {
    id: 'barbell-overhead-press',
    name: 'Standing Barbell Overhead Press',
    muscle: 'Shoulders & Core',
    splitCategory: 'Push',
    requiredEquipment: ['Barbell'],
    defaultWeightKg: 40,
    defaultReps: 8,
  },
  {
    id: 'dumbbell-goblet-squat',
    name: 'Dumbbell Goblet Squat',
    muscle: 'Quads & Glutes',
    splitCategory: 'Legs',
    requiredEquipment: ['Dumbbells'],
    defaultWeightKg: 24,
    defaultReps: 12,
  },
  {
    id: 'dumbbell-rdl',
    name: 'Dumbbell Romanian Deadlift',
    muscle: 'Hamstrings & Glutes',
    splitCategory: 'Legs',
    requiredEquipment: ['Dumbbells'],
    defaultWeightKg: 22,
    defaultReps: 10,
  },
  {
    id: 'dumbbell-shoulder-press',
    name: 'Seated Dumbbell Shoulder Press',
    muscle: 'Shoulders',
    splitCategory: 'Push',
    requiredEquipment: ['Dumbbells', 'Adjustable Bench'],
    defaultWeightKg: 18,
    defaultReps: 10,
  },
  {
    id: 'dumbbell-lateral-raise',
    name: 'Dumbbell Lateral Raise',
    muscle: 'Lateral Deltoids',
    splitCategory: 'Push',
    requiredEquipment: ['Dumbbells'],
    defaultWeightKg: 8,
    defaultReps: 15,
  },
  {
    id: 'dumbbell-bicep-curl',
    name: 'Standing Dumbbell Bicep Curl',
    muscle: 'Biceps',
    splitCategory: 'Pull',
    requiredEquipment: ['Dumbbells'],
    defaultWeightKg: 12,
    defaultReps: 12,
  },
  {
    id: 'pull-ups',
    name: 'Overhand Pull-Ups',
    muscle: 'Lats & Upper Back',
    splitCategory: 'Pull',
    requiredEquipment: ['Pull-up Bar'],
    defaultWeightKg: 0,
    defaultReps: 8,
  },
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Knee / Leg Raise',
    muscle: 'Abdominals & Core',
    splitCategory: 'Core',
    requiredEquipment: ['Pull-up Bar'],
    defaultWeightKg: 0,
    defaultReps: 12,
  },

  // --- Bodyweight / Minimal ---
  {
    id: 'band-pushups',
    name: 'Resistance Band Push-Ups',
    muscle: 'Chest & Triceps',
    splitCategory: 'Push',
    requiredEquipment: ['Resistance Bands'],
    defaultWeightKg: 0,
    defaultReps: 12,
  },
  {
    id: 'band-pull-aparts',
    name: 'Band Pull-Aparts',
    muscle: 'Rear Delts & Postural Traps',
    splitCategory: 'Pull',
    requiredEquipment: ['Resistance Bands'],
    defaultWeightKg: 0,
    defaultReps: 20,
  },
  {
    id: 'bodyweight-pushups',
    name: 'Standard Push-Ups',
    muscle: 'Chest & Core',
    splitCategory: 'Push',
    requiredEquipment: ['None'],
    defaultWeightKg: 0,
    defaultReps: 15,
  },
  {
    id: 'bodyweight-squats',
    name: 'Bodyweight Air Squats',
    muscle: 'Quads & Glutes',
    splitCategory: 'Legs',
    requiredEquipment: ['None'],
    defaultWeightKg: 0,
    defaultReps: 20,
  },
  {
    id: 'walking-lunges',
    name: 'Bodyweight Walking Lunges',
    muscle: 'Quads & Glutes',
    splitCategory: 'Legs',
    requiredEquipment: ['None'],
    defaultWeightKg: 0,
    defaultReps: 12,
  },
  {
    id: 'plank-hold',
    name: 'Forearm Plank Hold',
    muscle: 'Core Stability',
    splitCategory: 'Core',
    requiredEquipment: ['Yoga Mat'],
    defaultWeightKg: 0,
    defaultReps: 45,
  },
];

/**
 * Filter exercises strictly matching the user's registered gym equipment inventory.
 */
export const getFilteredExercisesForUser = (userEquipment: string[] = []): EquipmentExerciseDef[] => {
  const eqSet = new Set(userEquipment);
  return EQUIPMENT_EXERCISE_DB.filter((ex) => {
    if (ex.requiredEquipment.includes('None')) return true;
    return ex.requiredEquipment.every((item) => eqSet.has(item));
  });
};

/**
 * Generates a calibrated daily maintenance routine strictly tailored to available equipment
 * and experience level volume constraints.
 */
export const generateEquipmentAwareRoutine = (
  userEquipment: string[] = [],
  experienceLevel: ExperienceLevel = 'intermediate',
  split: 'full_body' | 'upper' | 'lower' = 'full_body'
): WorkoutSession => {
  const available = getFilteredExercisesForUser(userEquipment);

  // Volume parameters per experience level
  let baseSets = 3;
  let repTarget = 10;
  if (experienceLevel === 'beginner') {
    baseSets = 3;
    repTarget = 12;
  } else if (experienceLevel === 'pro') {
    baseSets = 4;
    repTarget = 8;
  }

  // Filter by split category
  const pushExercises = available.filter((e) => e.splitCategory === 'Push');
  const pullExercises = available.filter((e) => e.splitCategory === 'Pull');
  const legExercises = available.filter((e) => e.splitCategory === 'Legs');
  const coreExercises = available.filter((e) => e.splitCategory === 'Core');

  const selectedDefs: EquipmentExerciseDef[] = [];

  if (split === 'full_body') {
    if (pushExercises.length > 0) selectedDefs.push(pushExercises[0]);
    if (pullExercises.length > 0) selectedDefs.push(pullExercises[0]);
    if (legExercises.length > 0) selectedDefs.push(legExercises[0]);
    if (pushExercises.length > 1) selectedDefs.push(pushExercises[1]);
    else if (pullExercises.length > 1) selectedDefs.push(pullExercises[1]);
    else if (legExercises.length > 1) selectedDefs.push(legExercises[1]);
    if (coreExercises.length > 0) selectedDefs.push(coreExercises[0]);
  } else if (split === 'upper') {
    pushExercises.slice(0, 3).forEach((e) => selectedDefs.push(e));
    pullExercises.slice(0, 3).forEach((e) => selectedDefs.push(e));
  } else {
    legExercises.slice(0, 4).forEach((e) => selectedDefs.push(e));
    coreExercises.slice(0, 2).forEach((e) => selectedDefs.push(e));
  }

  // If equipment pool is very sparse, fall back to safe minimal bodyweight
  if (selectedDefs.length < 3) {
    const minimalFallbacks = EQUIPMENT_EXERCISE_DB.filter((e) => e.requiredEquipment.includes('None'));
    minimalFallbacks.forEach((fb) => {
      if (!selectedDefs.some((s) => s.id === fb.id) && selectedDefs.length < 4) {
        selectedDefs.push(fb);
      }
    });
  }

  const routineTitle =
    split === 'full_body'
      ? `Equipment Maintenance Full Body (${experienceLevel.toUpperCase()})`
      : split === 'upper'
      ? `Equipment Maintenance Upper Body (${experienceLevel.toUpperCase()})`
      : `Equipment Maintenance Lower & Core (${experienceLevel.toUpperCase()})`;

  const exercises: ExerciseItem[] = selectedDefs.map((def, exIndex) => {
    const sets: ExerciseSet[] = Array.from({ length: baseSets }, (_, sIdx) => ({
      id: `s-${Date.now()}-${exIndex}-${sIdx + 1}`,
      setNumber: sIdx + 1,
      weight: def.defaultWeightKg,
      reps: def.defaultReps || repTarget,
      completed: false,
    }));

    return {
      id: `ex-${Date.now()}-${exIndex}`,
      name: def.name,
      muscle: def.muscle,
      sets,
    };
  });

  return {
    routineName: routineTitle,
    startedAt: Date.now(),
    exercises,
  };
};

/**
 * Saves a workout routine template to users/{userId}/saved_routines (and mirrors to workouts)
 */
export const saveSavedWorkoutRoutine = async (
  userId: string,
  session: WorkoutSession
): Promise<string | null> => {
  if (!db || !userId) return null;

  // 1. Save to saved_routines
  const savedColRef = collection(db, 'users', userId, 'saved_routines');
  const docRef = await addDoc(savedColRef, {
    ...session,
    savedAt: serverTimestamp(),
  });

  // 2. Also mirror to workouts collection with same ID
  try {
    const workoutsColRef = collection(db, 'users', userId, 'workouts');
    await setDoc(doc(workoutsColRef, docRef.id), {
      ...session,
      savedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Syncing saved routine to workouts notice:', err);
  }

  return docRef.id;
};

export const saveWorkoutToCollection = saveSavedWorkoutRoutine;

/**
 * Permanently deletes a saved routine template from users/{userId}/saved_routines and workouts
 */
export const deleteSavedWorkoutRoutine = async (
  userId: string,
  routineId: string
): Promise<void> => {
  if (!db || !userId || !routineId) return;

  // 1. Delete from saved_routines
  try {
    const savedRef = doc(db, 'users', userId, 'saved_routines', routineId);
    await deleteDoc(savedRef);
  } catch (err) {
    console.warn('Error deleting from saved_routines:', err);
  }

  // 2. Delete from workouts
  try {
    const workoutsRef = doc(db, 'users', userId, 'workouts', routineId);
    await deleteDoc(workoutsRef);
  } catch (err) {
    console.warn('Error deleting from workouts:', err);
  }
};

/**
 * Subscribes to custom workouts saved in users/{userId}/saved_routines and workouts,
 * merging and deduplicating them so all templates can be loaded or deleted.
 */
export const subscribeSavedWorkoutRoutines = (
  userId: string,
  callback: (workouts: (WorkoutSession & { id: string })[]) => void
): Unsubscribe => {
  if (!db || !userId) {
    callback([]);
    return () => {};
  }

  const savedMap = new Map<string, WorkoutSession & { id: string }>();
  const workoutsMap = new Map<string, WorkoutSession & { id: string }>();

  const emit = () => {
    const combined = new Map<string, WorkoutSession & { id: string }>();
    workoutsMap.forEach((val, key) => combined.set(key, val));
    savedMap.forEach((val, key) => combined.set(key, val));

    // Exclude sessions that are marked as completed workout logs
    const list = Array.from(combined.values()).filter(
      (w) => !(w as unknown as { isCompleted?: boolean }).isCompleted
    );

    // Sort newest saved first
    list.sort((a, b) => {
      const getMillis = (t: unknown): number => {
        if (!t) return 0;
        if (typeof (t as { toMillis?: () => number }).toMillis === 'function') {
          return (t as { toMillis: () => number }).toMillis();
        }
        if (t instanceof Date) return t.getTime();
        if (typeof t === 'number') return t;
        if (typeof t === 'string') return new Date(t).getTime() || 0;
        return 0;
      };
      return getMillis((b as unknown as { savedAt?: unknown }).savedAt) - getMillis((a as unknown as { savedAt?: unknown }).savedAt);
    });

    callback(list);
  };

  const savedColRef = collection(db, 'users', userId, 'saved_routines');
  const unsubSaved = onSnapshot(
    savedColRef,
    (snapshot) => {
      savedMap.clear();
      snapshot.docs.forEach((docSnap) => {
        savedMap.set(docSnap.id, {
          id: docSnap.id,
          ...(docSnap.data() as WorkoutSession),
        });
      });
      emit();
    },
    (err) => {
      console.warn('Firestore saved_routines snapshot error:', err);
    }
  );

  const workoutsColRef = collection(db, 'users', userId, 'workouts');
  const unsubWorkouts = onSnapshot(
    workoutsColRef,
    (snapshot) => {
      workoutsMap.clear();
      snapshot.docs.forEach((docSnap) => {
        workoutsMap.set(docSnap.id, {
          id: docSnap.id,
          ...(docSnap.data() as WorkoutSession),
        });
      });
      emit();
    },
    (err) => {
      console.warn('Firestore workouts collection snapshot error:', err);
    }
  );

  return () => {
    unsubSaved();
    unsubWorkouts();
  };
};

export const subscribeWorkoutsCollection = subscribeSavedWorkoutRoutines;

/**
 * Applies reactive workout volume adjustment (+2 sets on caloric surplus, or -1 set on deficit)
 * directly to the active workout session in Firestore (and syncs to users/{userId}/workouts).
 */
export const applyWorkoutVolumeAdjustment = async (
  userId: string,
  setsDelta: number,
  fallbackEquipment: string[] = [],
  fallbackExperienceLevel: ExperienceLevel = 'intermediate'
): Promise<WorkoutSession | null> => {
  if (!db || !userId) return null;

  const activeRef = doc(db, 'users', userId, 'data', 'active_workout');
  const snap = await getDoc(activeRef);

  let currentSession: WorkoutSession | null = null;
  if (snap.exists()) {
    currentSession = snap.data() as WorkoutSession;
  }

  // If no active workout session exists, generate one from user's equipment inventory
  if (!currentSession || currentSession.exercises.length === 0) {
    currentSession = generateEquipmentAwareRoutine(
      fallbackEquipment,
      fallbackExperienceLevel,
      'full_body'
    );
  }

  const updatedExercises = currentSession.exercises.map((ex, exIdx) => {
    const newSets = [...ex.sets];

    if (setsDelta > 0) {
      // Add volume sets
      for (let i = 0; i < setsDelta; i++) {
        const lastSet = newSets[newSets.length - 1];
        newSets.push({
          id: `s-adj-${Date.now()}-${exIdx}-${newSets.length + 1}`,
          setNumber: newSets.length + 1,
          weight: lastSet ? lastSet.weight : 20,
          reps: lastSet ? lastSet.reps : 10,
          completed: false,
        });
      }
    } else if (setsDelta < 0) {
      // Reduce volume set (preserve minimum 2 sets)
      if (newSets.length > 2) {
        newSets.pop();
      }
    }

    return {
      ...ex,
      sets: newSets,
    };
  });

  const adjustmentTag = setsDelta > 0 ? ` (+${setsDelta} Vol Adj)` : ` (${setsDelta} Vol Deficit Adj)`;
  const cleanedName = currentSession.routineName.replace(/\s\([+-]\d+\sVol.*\)/g, '');
  const updatedSession: WorkoutSession = {
    ...currentSession,
    routineName: `${cleanedName}${adjustmentTag}`,
    exercises: updatedExercises,
  };

  // Sync to active_workout and workouts collection
  await setDoc(activeRef, updatedSession, { merge: true });
  await saveWorkoutToCollection(userId, updatedSession);

  return updatedSession;
};

/* ==================== CUSTOM FESTIVALS & VIRATHAM MANAGER ==================== */
export interface CustomFestivalItem {
  id: string;
  nameEnglish: string;
  nameTamil?: string;
  date: string; // YYYY-MM-DD
  category: 'Temple Festival' | 'Fasting / Viratham' | 'Personal Milestone' | 'Pooja';
  deity?: string;
  templeLocation?: string;
  fastingNotes?: string;
  reminderEnabled?: boolean;
  createdAt?: unknown;
}

/**
 * Subscribes in real-time to user's custom local temple festivals & fasting days
 * stored at users/{userId}/custom_festivals
 */
export const subscribeCustomFestivals = (
  userId: string,
  callback: (festivals: CustomFestivalItem[]) => void
): Unsubscribe => {
  if (!db || !userId) {
    callback([]);
    return () => {};
  }

  const festivalsRef = collection(db, 'users', userId, 'custom_festivals');
  const q = query(festivalsRef, orderBy('date', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: CustomFestivalItem[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<CustomFestivalItem, 'id'>),
      }));
      callback(items);
    },
    (err) => {
      console.warn('Custom festivals snapshot error:', err);
      callback([]);
    }
  );
};

/**
 * Adds a new custom festival or fasting day to users/{userId}/custom_festivals
 */
export const addCustomFestival = async (
  userId: string,
  festival: Omit<CustomFestivalItem, 'id' | 'createdAt'>
): Promise<string | null> => {
  if (!db || !userId) return null;
  const festivalsRef = collection(db, 'users', userId, 'custom_festivals');
  const docRef = await addDoc(festivalsRef, {
    ...festival,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

/**
 * Deletes a custom festival from users/{userId}/custom_festivals
 */
export const deleteCustomFestival = async (
  userId: string,
  festivalId: string
): Promise<void> => {
  if (!db || !userId || !festivalId) return;
  const docRef = doc(db, 'users', userId, 'custom_festivals', festivalId);
  await deleteDoc(docRef);
};

/* ==================== CUSTOM ALARM VIDEO SONGS & SETTINGS ==================== */

export interface AlarmVideoItem {
  id: string;
  title: string;
  artistOrDeity?: string;
  videoUrl: string;
  videoType: 'direct' | 'youtube' | 'upload';
  isDefault?: boolean;
  duration?: string;
  thumbnailUrl?: string;
  createdAt?: unknown;
}

export interface UserAlarmSettings {
  enabled: boolean;
  time: string; // '06:00'
  maxVolume: boolean;
  selectedVideoId: string | null;
  selectedRasi: string;
  playDevotionals: boolean;
  backgroundMusicVolume: number; // 0.0 - 1.0
  lastDismissedDate?: string; // YYYY-MM-DD
  briefingLanguage?: 'en' | 'ta' | 'both';
}

export const DEFAULT_ALARM_SETTINGS: UserAlarmSettings = {
  enabled: true,
  time: '06:00',
  maxVolume: true,
  selectedVideoId: null,
  selectedRasi: 'mesham',
  playDevotionals: true,
  backgroundMusicVolume: 0.15,
  briefingLanguage: 'both',
};

/**
 * Subscribes to custom alarm videos stored at users/{userId}/alarm_videos
 * with zero-latency local cache emission and Firestore real-time sync.
 */
export const subscribeAlarmVideos = (
  userId: string,
  callback: (videos: AlarmVideoItem[]) => void
): Unsubscribe => {
  if (!userId) {
    callback([]);
    return () => {};
  }

  // 1. Immediately emit cached videos for zero latency
  const cached = localStorage.getItem(`fit_alarm_videos_${userId}`);
  if (cached) {
    try {
      callback(JSON.parse(cached));
    } catch {
      // Ignored
    }
  }

  if (!db) {
    return () => {};
  }

  const videosRef = collection(db, 'users', userId, 'alarm_videos');
  const q = query(videosRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: AlarmVideoItem[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<AlarmVideoItem, 'id'>),
      }));
      try {
        localStorage.setItem(`fit_alarm_videos_${userId}`, JSON.stringify(items));
      } catch {
        // Ignored
      }
      callback(items);
    },
    (err) => {
      console.warn('Alarm videos snapshot notice:', err);
      // Retain cached list so videos never disappear on network error
      const fallback = localStorage.getItem(`fit_alarm_videos_${userId}`);
      if (fallback) {
        try {
          callback(JSON.parse(fallback));
          return;
        } catch {
          // Ignored
        }
      }
      callback([]);
    }
  );
};

/**
 * Adds a new custom alarm video to users/{userId}/alarm_videos
 * with optimistic local caching.
 */
export const addAlarmVideo = async (
  userId: string,
  video: Omit<AlarmVideoItem, 'id' | 'createdAt'>
): Promise<string | null> => {
  if (!userId) return null;

  const tempId = `vid_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newRecord: AlarmVideoItem = {
    id: tempId,
    ...video,
    createdAt: new Date().toISOString(),
  };

  // 1. Immediately cache in localStorage for instant UI updates
  try {
    const cachedStr = localStorage.getItem(`fit_alarm_videos_${userId}`);
    const list: AlarmVideoItem[] = cachedStr ? JSON.parse(cachedStr) : [];
    const updated = [newRecord, ...list.filter((x) => x.id !== tempId)];
    localStorage.setItem(`fit_alarm_videos_${userId}`, JSON.stringify(updated));
  } catch (err) {
    console.warn('localStorage cache notice for alarm video:', err);
  }

  // 2. Persist to Firestore
  if (db) {
    try {
      const videosRef = collection(db, 'users', userId, 'alarm_videos');
      const docRef = await addDoc(videosRef, {
        ...video,
        createdAt: serverTimestamp(),
      });

      // Update cache with real Firestore document ID
      try {
        const cachedStr = localStorage.getItem(`fit_alarm_videos_${userId}`);
        if (cachedStr) {
          const list: AlarmVideoItem[] = JSON.parse(cachedStr);
          const updated = list.map((item) =>
            item.id === tempId ? { ...item, id: docRef.id } : item
          );
          localStorage.setItem(`fit_alarm_videos_${userId}`, JSON.stringify(updated));
        }
      } catch {
        // Ignored
      }

      return docRef.id;
    } catch (err) {
      console.warn('Firestore addDoc alarm video notice, preserved locally:', err);
      return tempId;
    }
  }

  return tempId;
};

/**
 * Deletes a custom alarm video from users/{userId}/alarm_videos and local cache
 */
export const deleteAlarmVideo = async (
  userId: string,
  videoId: string
): Promise<void> => {
  if (!userId || !videoId) return;

  // 1. Immediately purge from local cache
  try {
    const cachedStr = localStorage.getItem(`fit_alarm_videos_${userId}`);
    if (cachedStr) {
      const list: AlarmVideoItem[] = JSON.parse(cachedStr);
      const filtered = list.filter((v) => v.id !== videoId);
      localStorage.setItem(`fit_alarm_videos_${userId}`, JSON.stringify(filtered));
    }
  } catch {
    // Ignored
  }

  // 2. Purge from Firestore
  if (db) {
    try {
      const docRef = doc(db, 'users', userId, 'alarm_videos', videoId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Error deleting alarm video from Firestore:', err);
    }
  }
};

/**
 * Subscribes in real-time to user's alarm settings stored at users/{userId}/data/alarm_settings
 */
export const subscribeAlarmSettings = (
  userId: string,
  callback: (settings: UserAlarmSettings) => void
): Unsubscribe => {
  if (!db || !userId) {
    const cached = localStorage.getItem(`fit_alarm_settings_${userId}`);
    if (cached) {
      try {
        callback({ ...DEFAULT_ALARM_SETTINGS, ...JSON.parse(cached) });
      } catch {
        callback(DEFAULT_ALARM_SETTINGS);
      }
    } else {
      callback(DEFAULT_ALARM_SETTINGS);
    }
    return () => {};
  }

  const settingsDocRef = doc(db, 'users', userId, 'data', 'alarm_settings');

  return onSnapshot(
    settingsDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserAlarmSettings;
        const merged = { ...DEFAULT_ALARM_SETTINGS, ...data };
        localStorage.setItem(`fit_alarm_settings_${userId}`, JSON.stringify(merged));
        callback(merged);
      } else {
        const cached = localStorage.getItem(`fit_alarm_settings_${userId}`);
        if (cached) {
          try {
            callback({ ...DEFAULT_ALARM_SETTINGS, ...JSON.parse(cached) });
            return;
          } catch {
            // Ignored
          }
        }
        callback(DEFAULT_ALARM_SETTINGS);
      }
    },
    (err) => {
      console.warn('Alarm settings snapshot notice:', err);
      const cached = localStorage.getItem(`fit_alarm_settings_${userId}`);
      if (cached) {
        try {
          callback({ ...DEFAULT_ALARM_SETTINGS, ...JSON.parse(cached) });
          return;
        } catch {
          // Ignored
        }
      }
      callback(DEFAULT_ALARM_SETTINGS);
    }
  );
};

/**
 * Saves alarm settings to users/{userId}/data/alarm_settings
 */
export const saveAlarmSettings = async (
  userId: string,
  settings: Partial<UserAlarmSettings>
): Promise<void> => {
  if (!userId) return;
  // Always update local cache instantly
  const cached = localStorage.getItem(`fit_alarm_settings_${userId}`);
  const current = cached ? JSON.parse(cached) : DEFAULT_ALARM_SETTINGS;
  const updated = { ...current, ...settings };
  localStorage.setItem(`fit_alarm_settings_${userId}`, JSON.stringify(updated));

  if (!db) return;
  const settingsDocRef = doc(db, 'users', userId, 'data', 'alarm_settings');
  await setDoc(settingsDocRef, updated, { merge: true });
};

/* ==================== STREAK MAINTENANCE & CONSISTENCY ENGINE ==================== */

export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  historyDates: string[]; // List of YYYY-MM-DD when a maintenance goal was completed
  shieldsRemaining: number;
  shieldUsedToday?: boolean;
  updatedAt?: unknown;
}

export const DEFAULT_USER_STREAK: UserStreak = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: '',
  historyDates: [],
  shieldsRemaining: 1,
};

/**
 * Subscribes in real-time to user's consistency streak stored at users/{userId}/streak/current
 */
export const subscribeUserStreak = (
  userId: string,
  callback: (streak: UserStreak) => void
): Unsubscribe => {
  if (!db || !userId) {
    const cached = localStorage.getItem(`fit_user_streak_${userId}`);
    if (cached) {
      try {
        callback({ ...DEFAULT_USER_STREAK, ...JSON.parse(cached) });
      } catch {
        callback(DEFAULT_USER_STREAK);
      }
    } else {
      callback(DEFAULT_USER_STREAK);
    }
    return () => {};
  }

  const streakDocRef = doc(db, 'users', userId, 'streak', 'current');
  return onSnapshot(
    streakDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserStreak;
        const merged: UserStreak = {
          currentStreak: Number(data.currentStreak) || 0,
          longestStreak: Number(data.longestStreak) || 0,
          lastActiveDate: data.lastActiveDate || '',
          historyDates: Array.isArray(data.historyDates) ? data.historyDates : [],
          shieldsRemaining: data.shieldsRemaining !== undefined ? Number(data.shieldsRemaining) : 1,
          shieldUsedToday: Boolean(data.shieldUsedToday),
          updatedAt: data.updatedAt,
        };
        localStorage.setItem(`fit_user_streak_${userId}`, JSON.stringify(merged));
        callback(merged);
      } else {
        const cached = localStorage.getItem(`fit_user_streak_${userId}`);
        if (cached) {
          try {
            callback({ ...DEFAULT_USER_STREAK, ...JSON.parse(cached) });
            return;
          } catch {
            // Ignored
          }
        }
        callback(DEFAULT_USER_STREAK);
      }
    },
    (err) => {
      console.warn('Streak snapshot notice:', err);
      const cached = localStorage.getItem(`fit_user_streak_${userId}`);
      if (cached) {
        try {
          callback({ ...DEFAULT_USER_STREAK, ...JSON.parse(cached) });
          return;
        } catch {
          // Ignored
        }
      }
      callback(DEFAULT_USER_STREAK);
    }
  );
};

/**
 * Records a core maintenance activity (meal logged, workout completed, check-in, or fasting)
 * Increments streak by 1 if today is a new active day, protects 1 missed day with shield,
 * and automatically unlocks celebratory milestone rewards (3, 7, 14, 30 days).
 */
export const recordStreakActivity = async (
  userId: string,
  _activityType: 'meal' | 'workout' | 'checkin' | 'fasting',
  dateStr = getTodayDateString()
): Promise<UserStreak> => {
  if (!db || !userId) return DEFAULT_USER_STREAK;

  const streakDocRef = doc(db, 'users', userId, 'streak', 'current');
  let currentStreakData: UserStreak = { ...DEFAULT_USER_STREAK };

  try {
    const snap = await getDoc(streakDocRef);
    if (snap.exists()) {
      currentStreakData = {
        ...DEFAULT_USER_STREAK,
        ...(snap.data() as UserStreak),
      };
    } else {
      const cached = localStorage.getItem(`fit_user_streak_${userId}`);
      if (cached) {
        currentStreakData = { ...DEFAULT_USER_STREAK, ...JSON.parse(cached) };
      }
    }
  } catch (err) {
    console.warn('Notice reading streak document:', err);
  }

  const historySet = new Set(currentStreakData.historyDates || []);
  const wasAlreadyActiveToday = historySet.has(dateStr);

  let newCurrent = currentStreakData.currentStreak;
  let newLongest = currentStreakData.longestStreak;
  let newShields = currentStreakData.shieldsRemaining ?? 1;
  let shieldUsed = false;

  if (!wasAlreadyActiveToday) {
    historySet.add(dateStr);

    if (!currentStreakData.lastActiveDate) {
      newCurrent = 1;
      newLongest = Math.max(1, newLongest);
    } else {
      const lastDate = new Date(currentStreakData.lastActiveDate + 'T00:00:00');
      const todayDate = new Date(dateStr + 'T00:00:00');
      const diffMs = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newCurrent = currentStreakData.currentStreak + 1;
        newLongest = Math.max(newCurrent, newLongest);
      } else if (diffDays === 2 && newShields > 0) {
        newShields = Math.max(0, newShields - 1);
        shieldUsed = true;
        newCurrent = currentStreakData.currentStreak + 1;
        newLongest = Math.max(newCurrent, newLongest);
      } else if (diffDays > 1) {
        newCurrent = 1;
      }
    }
  }

  const updatedStreak: UserStreak = {
    currentStreak: newCurrent,
    longestStreak: newLongest,
    lastActiveDate: dateStr,
    historyDates: Array.from(historySet).slice(-180),
    shieldsRemaining: newShields,
    shieldUsedToday: shieldUsed,
    updatedAt: serverTimestamp(),
  };

  localStorage.setItem(`fit_user_streak_${userId}`, JSON.stringify(updatedStreak));

  if (db) {
    try {
      await setDoc(streakDocRef, updatedStreak, { merge: true });
      await setDoc(
        doc(db, 'users', userId),
        { streak: updatedStreak, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (writeErr) {
      console.warn('Error saving streak to Firestore:', writeErr);
    }
  }

  // Check milestones and unlock badges
  try {
    if (newCurrent >= 100) {
      const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'streak-100');
      if (b) await unlockReward(userId, b);
    }
    if (newCurrent >= 60) {
      const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'streak-60');
      if (b) await unlockReward(userId, b);
    }
    if (newCurrent >= 30) {
      const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'streak-30');
      if (b) await unlockReward(userId, b);
    }
    if (newCurrent >= 14) {
      const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'streak-14');
      if (b) await unlockReward(userId, b);
    }
    if (newCurrent >= 7) {
      const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'streak-7');
      if (b) await unlockReward(userId, b);
    }
    if (newCurrent >= 3) {
      const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'streak-3');
      if (b) await unlockReward(userId, b);
    }
  } catch {
    // Non-blocking
  }

  return updatedStreak;
};

/**
 * Re-synchronizes streak from historical check-ins, workouts, and nutrition logs
 * ensuring existing users with prior activity retain their full streak credit.
 */
export const syncStreakFromHistory = async (
  userId: string,
  checkIns: CheckInItem[] = [],
  completedWorkouts: CompletedWorkout[] = [],
  nutritionLogs: NutritionLogItem[] = []
): Promise<UserStreak> => {
  if (!userId) return DEFAULT_USER_STREAK;

  const dateSet = new Set<string>();

  checkIns.forEach((c) => {
    if (c.date) dateSet.add(c.date);
  });

  completedWorkouts.forEach((w) => {
    if (w.completedAt) {
      try {
        let d: Date | null = null;
        if (typeof (w.completedAt as { toDate?: () => Date }).toDate === 'function') {
          d = (w.completedAt as { toDate: () => Date }).toDate();
        } else if (w.completedAt instanceof Date) {
          d = w.completedAt;
        } else if (typeof w.completedAt === 'string') {
          d = new Date(w.completedAt);
        }
        if (d && !isNaN(d.getTime())) {
          dateSet.add(d.toISOString().split('T')[0]);
        }
      } catch {
        // Ignored
      }
    }
  });

  nutritionLogs.forEach((l) => {
    if (l.loggedAt) {
      try {
        let d: Date | null = null;
        if (typeof (l.loggedAt as { toDate?: () => Date }).toDate === 'function') {
          d = (l.loggedAt as { toDate: () => Date }).toDate();
        } else if (l.loggedAt instanceof Date) {
          d = l.loggedAt;
        } else if (typeof l.loggedAt === 'string') {
          d = new Date(l.loggedAt);
        }
        if (d && !isNaN(d.getTime())) {
          dateSet.add(d.toISOString().split('T')[0]);
        }
      } catch {
        // Ignored
      }
    }
  });

  const sortedDates = Array.from(dateSet).sort();
  if (sortedDates.length === 0) return DEFAULT_USER_STREAK;

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(sortedDates[i - 1] + 'T00:00:00');
      const curr = new Date(sortedDates[i] + 'T00:00:00');
      const diff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

      if (diff === 1) {
        tempStreak += 1;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  const lastActiveDate = sortedDates[sortedDates.length - 1];
  const todayStr = getTodayDateString();
  const todayDate = new Date(todayStr + 'T00:00:00');
  const lastDate = new Date(lastActiveDate + 'T00:00:00');
  const diffFromToday = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffFromToday <= 1) {
    currentStreak = tempStreak;
  } else {
    currentStreak = 0;
  }

  const streakData: UserStreak = {
    currentStreak,
    longestStreak,
    lastActiveDate,
    historyDates: sortedDates.slice(-180),
    shieldsRemaining: 1,
    updatedAt: serverTimestamp(),
  };

  localStorage.setItem(`fit_user_streak_${userId}`, JSON.stringify(streakData));

  if (db) {
    try {
      await setDoc(doc(db, 'users', userId, 'streak', 'current'), streakData, { merge: true });
      await setDoc(doc(db, 'users', userId), { streak: streakData }, { merge: true });
    } catch {
      // Ignored
    }
  }

  return streakData;
};

/* ==================== DAILY FASTING ENGINE & ADAPTATION LOOP ==================== */

export type FastingType = 'none' | 'partial_fruit' | 'water_only' | 'traditional_viratham';

export interface FastingConfig {
  type: FastingType;
  title: string;
  tamilTitle: string;
  badge: string;
  description: string;
  workoutGuideline: string;
  hydrationTargetMl: number;
  hydrationGuideline: string;
  calorieTargetMultiplier: number;
  macroSplit: {
    proteinPct: number;
    carbsPct: number;
    fatsPct: number;
  };
  recommendedFoods: string[];
}

export const FASTING_CONFIGS: Record<FastingType, FastingConfig> = {
  none: {
    type: 'none',
    title: 'Standard Maintenance (No Fast)',
    tamilTitle: 'இயல்பு நிலை (விரதம் இல்லை)',
    badge: 'Standard Diet & Training',
    description: 'Regular nutrition with full maintenance calories and progressive overload resistance training.',
    workoutGuideline: 'Execute scheduled compound lifting and full volume routine as planned.',
    hydrationTargetMl: 3000,
    hydrationGuideline: 'Standard baseline hydration: 3.0 Liters throughout the day.',
    calorieTargetMultiplier: 1.0,
    macroSplit: { proteinPct: 30, carbsPct: 45, fatsPct: 25 },
    recommendedFoods: ['Dal Tadka', 'Paneer', 'Brown Rice', 'Chana', 'Curd'],
  },
  partial_fruit: {
    type: 'partial_fruit',
    title: 'Partial / Fruit Fast',
    tamilTitle: 'பழ விரதம் / சுஹாஹார்',
    badge: 'Light Satvic & Fruit Intake',
    description: 'Clean fruit and satvic fasting. Fresh fruits, nuts, seeds, and light dairy only.',
    workoutGuideline: 'Moderate intensity. Swap heavy compound barbell lifts for moderate dumbbell accessories and mobility (2 sets/exercise, 12-15 reps).',
    hydrationTargetMl: 3500,
    hydrationGuideline: 'Elevated hydration: 3.5 Liters. Drink water infused with lemon or coconut water.',
    calorieTargetMultiplier: 0.65,
    macroSplit: { proteinPct: 20, carbsPct: 60, fatsPct: 20 },
    recommendedFoods: ['Apples', 'Pomegranates', 'Papaya', 'Roasted Almonds', 'Fresh Curd', 'Coconut Water'],
  },
  water_only: {
    type: 'water_only',
    title: 'Strict Water Fast',
    tamilTitle: 'ஜல விரதம் (முழு விரதம்)',
    badge: 'Zero Solid Calories / Deep Detox',
    description: 'Zero caloric intake. Pure hydration, pink salt, electrolyte balance, and autophagy focus.',
    workoutGuideline: 'Active Recovery & Mobility ONLY. 20-30 min brisk walk, yoga flow, or deep stretching. Avoid heavy lifting.',
    hydrationTargetMl: 3800,
    hydrationGuideline: 'Maximum hydration: 3.8 - 4.0 Liters with pinch of Himalayan pink salt or electrolyte minerals.',
    calorieTargetMultiplier: 0,
    macroSplit: { proteinPct: 0, carbsPct: 0, fatsPct: 0 },
    recommendedFoods: ['Filtered Water', 'Warm Lemon Water', 'Electrolyte Mineral Water', 'Herbal Infusions'],
  },
  traditional_viratham: {
    type: 'traditional_viratham',
    title: 'Traditional Viratham (Ekadashi / Purattasi / Sashti)',
    tamilTitle: 'புனித விரதம் (ஏகாதசி / சஷ்டி / புரட்டாசி)',
    badge: 'Spiritual Temple Fasting',
    description: 'Sacred Hindu observance. No grains/cereals on Ekadashi, no onion/garlic, single evening satvic meal.',
    workoutGuideline: 'Spiritual Satvic Core & Mobility Flow. Calisthenics, bodyweight squats, Surya Namaskar, and breathwork.',
    hydrationTargetMl: 3300,
    hydrationGuideline: '3.3 Liters. Jeera water, tulsi tea, and warm water throughout the day.',
    calorieTargetMultiplier: 0.50,
    macroSplit: { proteinPct: 20, carbsPct: 55, fatsPct: 25 },
    recommendedFoods: ['Sabudana Khichdi (light ghee)', 'Singhara Atta Roti', 'Makhana', 'Fruit Salad', 'Milk / Curd'],
  },
};

export interface DailyFastingState {
  date: string;
  isFasting: boolean;
  fastingType: FastingType;
  fastingNotes?: string;
  updatedAt?: unknown;
}

export const DEFAULT_DAILY_FASTING: DailyFastingState = {
  date: getTodayDateString(),
  isFasting: false,
  fastingType: 'none',
};

/**
 * Subscribes in real-time to user's daily fasting selection stored in users/{userId}/data/fasting_{date}
 */
export const subscribeDailyFasting = (
  userId: string,
  dateStr: string,
  callback: (state: DailyFastingState) => void
): Unsubscribe => {
  if (!db || !userId) {
    const cached = localStorage.getItem(`fit_fasting_${userId}_${dateStr}`);
    if (cached) {
      try {
        callback({ ...DEFAULT_DAILY_FASTING, ...JSON.parse(cached), date: dateStr });
      } catch {
        callback({ ...DEFAULT_DAILY_FASTING, date: dateStr });
      }
    } else {
      callback({ ...DEFAULT_DAILY_FASTING, date: dateStr });
    }
    return () => {};
  }

  const docRef = doc(db, 'users', userId, 'data', `fasting_${dateStr}`);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const state: DailyFastingState = {
          date: dateStr,
          isFasting: Boolean(data.isFasting),
          fastingType: (data.fastingType as FastingType) || 'none',
          fastingNotes: data.fastingNotes || '',
          updatedAt: data.updatedAt,
        };
        localStorage.setItem(`fit_fasting_${userId}_${dateStr}`, JSON.stringify(state));
        callback(state);
      } else {
        callback({ ...DEFAULT_DAILY_FASTING, date: dateStr });
      }
    },
    (err) => {
      console.warn('Daily fasting snapshot error:', err);
      callback({ ...DEFAULT_DAILY_FASTING, date: dateStr });
    }
  );
};

/**
 * Saves user's daily fasting selection to today's Firestore checkin document (users/{userId}/checkins/{date})
 * and adjusts hydration targets and records streak activity.
 */
export const saveDailyFasting = async (
  userId: string,
  dateStr: string,
  fastingType: FastingType,
  fastingNotes = ''
): Promise<DailyFastingState> => {
  const isFasting = fastingType !== 'none';
  const state: DailyFastingState = {
    date: dateStr,
    isFasting,
    fastingType,
    fastingNotes,
  };

  localStorage.setItem(`fit_fasting_${userId}_${dateStr}`, JSON.stringify(state));

  if (!userId) return state;

  if (db) {
    try {
      const checkinDocRef = doc(db, 'users', userId, 'checkins', dateStr);
      await setDoc(
        checkinDocRef,
        {
          date: dateStr,
          isFasting,
          fastingType,
          fastingNotes,
          fastingUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Error updating checkins fasting doc:', err);
    }

    try {
      const dataDocRef = doc(db, 'users', userId, 'data', `fasting_${dateStr}`);
      await setDoc(
        dataDocRef,
        {
          ...state,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Error updating fasting data doc:', err);
    }

    try {
      const targetWaterMl = FASTING_CONFIGS[fastingType].hydrationTargetMl;
      const hydRef = doc(db, 'users', userId, 'data', `hydration_${dateStr}`);
      await setDoc(hydRef, { date: dateStr, targetMl: targetWaterMl, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.warn('Error adjusting hydration target on fast:', err);
    }
  }

  // Record streak activity
  await recordStreakActivity(userId, 'fasting', dateStr);

  // Unlock fasting-harmony badge if fasting is active
  if (isFasting) {
    try {
      const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'fasting-harmony');
      if (b) await unlockReward(userId, b);
    } catch {
      // Ignored
    }
  }

  return state;
};

/**
 * Generates an active recovery / mobility routine tailored to the fasting style
 */
export const generateFastingRecoveryWorkout = (
  _userEquipment: string[] = [],
  fastingType: FastingType = 'partial_fruit'
): WorkoutSession => {
  let routineName = 'Fasting Active Recovery & Mobility Flow';
  let exercises: ExerciseItem[] = [];

  if (fastingType === 'water_only') {
    routineName = 'Water Fast Active Recovery & Joint Decompression';
    exercises = [
      {
        id: 'ex-fast-1',
        name: 'Low-Pace Walking / Breath Cadence',
        muscle: 'Cardiovascular / CNS Reset',
        sets: [{ id: 's-f-1', setNumber: 1, weight: 0, reps: 20, completed: false }],
      },
      {
        id: 'ex-fast-2',
        name: 'Cat-Cow & Thoracic Spine Flow',
        muscle: 'Spinal Mobility',
        sets: [
          { id: 's-f-2a', setNumber: 1, weight: 0, reps: 15, completed: false },
          { id: 's-f-2b', setNumber: 2, weight: 0, reps: 15, completed: false },
        ],
      },
      {
        id: 'ex-fast-3',
        name: 'Bodyweight Air Squats (Slow Tempo)',
        muscle: 'Lower Body Flush',
        sets: [
          { id: 's-f-3a', setNumber: 1, weight: 0, reps: 12, completed: false },
          { id: 's-f-3b', setNumber: 2, weight: 0, reps: 12, completed: false },
        ],
      },
      {
        id: 'ex-fast-4',
        name: 'Forearm Plank Hold',
        muscle: 'Core Stability',
        sets: [
          { id: 's-f-4a', setNumber: 1, weight: 0, reps: 30, completed: false },
          { id: 's-f-4b', setNumber: 2, weight: 0, reps: 30, completed: false },
        ],
      },
    ];
  } else if (fastingType === 'traditional_viratham') {
    routineName = 'Traditional Viratham Satvic Core & Flow';
    exercises = [
      {
        id: 'ex-fast-1',
        name: 'Surya Namaskar / Sun Salutation Flow',
        muscle: 'Full Body Mobility & Prana',
        sets: [
          { id: 's-f-1a', setNumber: 1, weight: 0, reps: 6, completed: false },
          { id: 's-f-1b', setNumber: 2, weight: 0, reps: 6, completed: false },
        ],
      },
      {
        id: 'ex-fast-2',
        name: 'Bodyweight Walking Lunges (Gentle)',
        muscle: 'Quads & Glutes',
        sets: [
          { id: 's-f-2a', setNumber: 1, weight: 0, reps: 10, completed: false },
          { id: 's-f-2b', setNumber: 2, weight: 0, reps: 10, completed: false },
        ],
      },
      {
        id: 'ex-fast-3',
        name: 'Resistance Band Pull-Aparts',
        muscle: 'Upper Back & Posture',
        sets: [
          { id: 's-f-3a', setNumber: 1, weight: 0, reps: 15, completed: false },
          { id: 's-f-3b', setNumber: 2, weight: 0, reps: 15, completed: false },
        ],
      },
      {
        id: 'ex-fast-4',
        name: 'Hanging Knee Raise / Floor Leg Raise',
        muscle: 'Core Stability',
        sets: [
          { id: 's-f-4a', setNumber: 1, weight: 0, reps: 12, completed: false },
          { id: 's-f-4b', setNumber: 2, weight: 0, reps: 12, completed: false },
        ],
      },
    ];
  } else {
    // partial_fruit
    routineName = 'Fruit Fast Moderate Hypertrophy & Mobility';
    exercises = [
      {
        id: 'ex-fast-1',
        name: 'Dumbbell Goblet Squat (Light Tempo)',
        muscle: 'Quads & Glutes',
        sets: [
          { id: 's-f-1a', setNumber: 1, weight: 12, reps: 12, completed: false },
          { id: 's-f-1b', setNumber: 2, weight: 12, reps: 12, completed: false },
        ],
      },
      {
        id: 'ex-fast-2',
        name: 'Lat Pulldown (Moderate Weight)',
        muscle: 'Lats & Upper Back',
        sets: [
          { id: 's-f-2a', setNumber: 1, weight: 30, reps: 12, completed: false },
          { id: 's-f-2b', setNumber: 2, weight: 30, reps: 12, completed: false },
        ],
      },
      {
        id: 'ex-fast-3',
        name: 'Push-Ups (Controlled Negative)',
        muscle: 'Chest & Triceps',
        sets: [
          { id: 's-f-3a', setNumber: 1, weight: 0, reps: 12, completed: false },
          { id: 's-f-3b', setNumber: 2, weight: 0, reps: 12, completed: false },
        ],
      },
      {
        id: 'ex-fast-4',
        name: 'Forearm Plank Hold',
        muscle: 'Core Stability',
        sets: [
          { id: 's-f-4a', setNumber: 1, weight: 0, reps: 35, completed: false },
          { id: 's-f-4b', setNumber: 2, weight: 0, reps: 35, completed: false },
        ],
      },
    ];
  }

  return {
    routineName,
    startedAt: Date.now(),
    exercises,
  };
};

/**
 * Applies fasting recovery workout directly into users/{userId}/data/active_workout
 * and custom workouts collection in Firestore.
 */
export const applyFastingWorkoutAdjustment = async (
  userId: string,
  fastingType: FastingType,
  userEquipment: string[] = []
): Promise<WorkoutSession | null> => {
  if (!db || !userId) return null;

  const fastingSession = generateFastingRecoveryWorkout(userEquipment, fastingType);
  const activeRef = doc(db, 'users', userId, 'data', 'active_workout');

  await setDoc(activeRef, fastingSession, { merge: true });
  await saveWorkoutToCollection(userId, fastingSession);

  return fastingSession;
};

/* ==================== CUSTOM EXERCISE LIBRARY (DELETABLE) ==================== */
export interface CustomExercise {
  id: string;
  name: string;
  muscle: string;
  splitCategory?: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full_body' | 'arms' | 'core';
  requiredEquipment?: string;
  defaultWeightKg: number;
  defaultReps: number;
  notes?: string;
  createdAt?: unknown;
}

export const subscribeCustomExercises = (
  userId: string,
  callback: (exercises: CustomExercise[]) => void
): Unsubscribe => {
  if (!db || !userId) {
    callback([]);
    return () => {};
  }

  const customExRef = collection(db, 'users', userId, 'custom_exercises');
  return onSnapshot(
    customExRef,
    (snapshot) => {
      const items: CustomExercise[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<CustomExercise, 'id'>),
      }));

      // In-memory sort by createdAt descending
      items.sort((a, b) => {
        const timeA = (a.createdAt as { toMillis?: () => number })?.toMillis?.() || 0;
        const timeB = (b.createdAt as { toMillis?: () => number })?.toMillis?.() || 0;
        return timeB - timeA;
      });

      callback(items);
    },
    (err) => {
      console.warn('subscribeCustomExercises snapshot error:', err);
      callback([]);
    }
  );
};

export const addCustomExercise = async (
  userId: string,
  exercise: Omit<CustomExercise, 'id'>
): Promise<string> => {
  if (!db || !userId) throw new Error('User not authenticated');
  const customExRef = collection(db, 'users', userId, 'custom_exercises');
  const docRef = await addDoc(customExRef, {
    ...exercise,
    defaultWeightKg: Number(exercise.defaultWeightKg) || 0,
    defaultReps: Number(exercise.defaultReps) || 10,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const deleteCustomExercise = async (
  userId: string,
  exerciseId: string
): Promise<void> => {
  if (!db || !userId) return;
  const exDocRef = doc(db, 'users', userId, 'custom_exercises', exerciseId);
  await deleteDoc(exDocRef);
};

/* ==================== HEVY-STYLE DAY-BY-DAY ROUTINE MANAGEMENT ==================== */
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface DayRoutineTemplate {
  dayId: DayOfWeek;
  dayName: string;
  routineName: string;
  splitCategory: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full_body' | 'rest';
  targetDurationMinutes: number;
  exercises: ExerciseItem[];
  notes?: string;
  isRestDay?: boolean;
  updatedAt?: unknown;
}

export const DEFAULT_WEEKLY_SPLIT: Record<DayOfWeek, DayRoutineTemplate> = {
  monday: {
    dayId: 'monday',
    dayName: 'Monday',
    routineName: 'Monday - Heavy Push Overload',
    splitCategory: 'push',
    targetDurationMinutes: 50,
    isRestDay: false,
    exercises: [
      {
        id: 'ex-mon-1',
        name: 'Incline Dumbbell Chest Press',
        muscle: 'Upper Chest & Front Delts',
        sets: [
          { id: 's-m1-1', setNumber: 1, weight: 22, reps: 10, completed: false },
          { id: 's-m1-2', setNumber: 2, weight: 24, reps: 8, completed: false },
          { id: 's-m1-3', setNumber: 3, weight: 26, reps: 8, completed: false },
        ],
      },
      {
        id: 'ex-mon-2',
        name: 'Standing Overhead Dumbbell Press',
        muscle: 'Deltoids & Triceps',
        sets: [
          { id: 's-m2-1', setNumber: 1, weight: 16, reps: 10, completed: false },
          { id: 's-m2-2', setNumber: 2, weight: 18, reps: 8, completed: false },
          { id: 's-m2-3', setNumber: 3, weight: 18, reps: 8, completed: false },
        ],
      },
      {
        id: 'ex-mon-3',
        name: 'Dumbbell Lateral Raise',
        muscle: 'Side Delts',
        sets: [
          { id: 's-m3-1', setNumber: 1, weight: 10, reps: 15, completed: false },
          { id: 's-m3-2', setNumber: 2, weight: 10, reps: 12, completed: false },
          { id: 's-m3-3', setNumber: 3, weight: 10, reps: 12, completed: false },
        ],
      },
      {
        id: 'ex-mon-4',
        name: 'Cable Tricep Pushdown / Rope Pressdown',
        muscle: 'Triceps Lateral Head',
        sets: [
          { id: 's-m4-1', setNumber: 1, weight: 25, reps: 12, completed: false },
          { id: 's-m4-2', setNumber: 2, weight: 30, reps: 10, completed: false },
          { id: 's-m4-3', setNumber: 3, weight: 30, reps: 10, completed: false },
        ],
      },
    ],
  },
  tuesday: {
    dayId: 'tuesday',
    dayName: 'Tuesday',
    routineName: 'Tuesday - Power Pull & Thickness',
    splitCategory: 'pull',
    targetDurationMinutes: 50,
    isRestDay: false,
    exercises: [
      {
        id: 'ex-tue-1',
        name: 'Wide-Grip Lat Pulldown',
        muscle: 'Lats & Teres Major',
        sets: [
          { id: 's-t1-1', setNumber: 1, weight: 45, reps: 10, completed: false },
          { id: 's-t1-2', setNumber: 2, weight: 50, reps: 8, completed: false },
          { id: 's-t1-3', setNumber: 3, weight: 55, reps: 8, completed: false },
        ],
      },
      {
        id: 'ex-tue-2',
        name: 'Seated Cable Row (Close Grip)',
        muscle: 'Rhomboids & Mid-Back',
        sets: [
          { id: 's-t2-1', setNumber: 1, weight: 45, reps: 10, completed: false },
          { id: 's-t2-2', setNumber: 2, weight: 50, reps: 8, completed: false },
          { id: 's-t2-3', setNumber: 3, weight: 50, reps: 8, completed: false },
        ],
      },
      {
        id: 'ex-tue-3',
        name: 'Rope Face Pulls',
        muscle: 'Rear Delts & Rotator Cuff',
        sets: [
          { id: 's-t3-1', setNumber: 1, weight: 20, reps: 15, completed: false },
          { id: 's-t3-2', setNumber: 2, weight: 25, reps: 12, completed: false },
        ],
      },
      {
        id: 'ex-tue-4',
        name: 'Incline Dumbbell Bicep Curl',
        muscle: 'Biceps Long Head',
        sets: [
          { id: 's-t4-1', setNumber: 1, weight: 12, reps: 10, completed: false },
          { id: 's-t4-2', setNumber: 2, weight: 14, reps: 8, completed: false },
        ],
      },
    ],
  },
  wednesday: {
    dayId: 'wednesday',
    dayName: 'Wednesday',
    routineName: 'Wednesday - Quad & Posterior Chain Overload',
    splitCategory: 'legs',
    targetDurationMinutes: 55,
    isRestDay: false,
    exercises: [
      {
        id: 'ex-wed-1',
        name: 'Leg Press 45-Degree',
        muscle: 'Quadriceps & Glute Max',
        sets: [
          { id: 's-w1-1', setNumber: 1, weight: 120, reps: 12, completed: false },
          { id: 's-w1-2', setNumber: 2, weight: 150, reps: 10, completed: false },
          { id: 's-w1-3', setNumber: 3, weight: 180, reps: 8, completed: false },
        ],
      },
      {
        id: 'ex-wed-2',
        name: 'Dumbbell Romanian Deadlift (RDL)',
        muscle: 'Hamstrings & Glutes',
        sets: [
          { id: 's-w2-1', setNumber: 1, weight: 24, reps: 10, completed: false },
          { id: 's-w2-2', setNumber: 2, weight: 28, reps: 8, completed: false },
        ],
      },
      {
        id: 'ex-wed-3',
        name: 'Seated Leg Extension',
        muscle: 'Quads Rectus Femoris',
        sets: [
          { id: 's-w3-1', setNumber: 1, weight: 45, reps: 12, completed: false },
          { id: 's-w3-2', setNumber: 2, weight: 50, reps: 10, completed: false },
        ],
      },
      {
        id: 'ex-wed-4',
        name: 'Standing Calf Raise',
        muscle: 'Gastrocnemius & Soleus',
        sets: [
          { id: 's-w4-1', setNumber: 1, weight: 40, reps: 15, completed: false },
          { id: 's-w4-2', setNumber: 2, weight: 40, reps: 15, completed: false },
        ],
      },
    ],
  },
  thursday: {
    dayId: 'thursday',
    dayName: 'Thursday',
    routineName: 'Thursday - Active Recovery & Core Stabilization',
    splitCategory: 'rest',
    targetDurationMinutes: 30,
    isRestDay: true,
    exercises: [
      {
        id: 'ex-thu-1',
        name: 'Hanging Knee Raises / Captains Chair',
        muscle: 'Lower Rectus Abdominis',
        sets: [
          { id: 's-th1-1', setNumber: 1, weight: 0, reps: 15, completed: false },
          { id: 's-th1-2', setNumber: 2, weight: 0, reps: 15, completed: false },
        ],
      },
      {
        id: 'ex-thu-2',
        name: 'Forearm Plank Hold',
        muscle: 'Transverse Abdominis & Deep Core',
        sets: [
          { id: 's-th2-1', setNumber: 1, weight: 0, reps: 45, completed: false },
          { id: 's-th2-2', setNumber: 2, weight: 0, reps: 45, completed: false },
        ],
      },
      {
        id: 'ex-thu-3',
        name: 'Dynamic Thoracic & Hip Mobility Flow',
        muscle: 'Full Body Mobility',
        sets: [
          { id: 's-th3-1', setNumber: 1, weight: 0, reps: 10, completed: false },
          { id: 's-th3-2', setNumber: 2, weight: 0, reps: 10, completed: false },
        ],
      },
    ],
  },
  friday: {
    dayId: 'friday',
    dayName: 'Friday',
    routineName: 'Friday - Upper Body Aesthetics & Hypertrophy',
    splitCategory: 'upper',
    targetDurationMinutes: 50,
    isRestDay: false,
    exercises: [
      {
        id: 'ex-fri-1',
        name: 'Flat Dumbbell Bench Press',
        muscle: 'Pectoralis Major',
        sets: [
          { id: 's-f1-1', setNumber: 1, weight: 24, reps: 10, completed: false },
          { id: 's-f1-2', setNumber: 2, weight: 26, reps: 8, completed: false },
          { id: 's-f1-3', setNumber: 3, weight: 28, reps: 6, completed: false },
        ],
      },
      {
        id: 'ex-fri-2',
        name: 'Chest Supported Dumbbell Row',
        muscle: 'Mid-Back & Lats',
        sets: [
          { id: 's-f2-1', setNumber: 1, weight: 22, reps: 10, completed: false },
          { id: 's-f2-2', setNumber: 2, weight: 24, reps: 8, completed: false },
        ],
      },
      {
        id: 'ex-fri-3',
        name: 'Cable Flyes (Middle Peak)',
        muscle: 'Sternal Pecs',
        sets: [
          { id: 's-f3-1', setNumber: 1, weight: 15, reps: 12, completed: false },
          { id: 's-f3-2', setNumber: 2, weight: 15, reps: 12, completed: false },
        ],
      },
      {
        id: 'ex-fri-4',
        name: 'Hammer Curls paired with Overhead Tricep Extension',
        muscle: 'Brachialis & Triceps Long Head',
        sets: [
          { id: 's-f4-1', setNumber: 1, weight: 14, reps: 10, completed: false },
          { id: 's-f4-2', setNumber: 2, weight: 14, reps: 10, completed: false },
        ],
      },
    ],
  },
  saturday: {
    dayId: 'saturday',
    dayName: 'Saturday',
    routineName: 'Saturday - Posterior & Unilateral Leg Drive',
    splitCategory: 'lower',
    targetDurationMinutes: 50,
    isRestDay: false,
    exercises: [
      {
        id: 'ex-sat-1',
        name: 'Dumbbell Walking Lunges',
        muscle: 'Quads & Glutes',
        sets: [
          { id: 's-sa1-1', setNumber: 1, weight: 14, reps: 12, completed: false },
          { id: 's-sa1-2', setNumber: 2, weight: 16, reps: 10, completed: false },
        ],
      },
      {
        id: 'ex-sat-2',
        name: 'Lying Hamstring Leg Curl',
        muscle: 'Biceps Femoris',
        sets: [
          { id: 's-sa2-1', setNumber: 1, weight: 35, reps: 10, completed: false },
          { id: 's-sa2-2', setNumber: 2, weight: 40, reps: 8, completed: false },
        ],
      },
      {
        id: 'ex-sat-3',
        name: 'Dumbbell Goblet Squats',
        muscle: 'Quads & Hip Drive',
        sets: [
          { id: 's-sa3-1', setNumber: 1, weight: 24, reps: 10, completed: false },
          { id: 's-sa3-2', setNumber: 2, weight: 26, reps: 10, completed: false },
        ],
      },
    ],
  },
  sunday: {
    dayId: 'sunday',
    dayName: 'Sunday',
    routineName: 'Sunday - Sacred Rest & Total Rejuvenation',
    splitCategory: 'rest',
    targetDurationMinutes: 20,
    isRestDay: true,
    exercises: [
      {
        id: 'ex-sun-1',
        name: 'Full Body Static Stretch & Deep Breathing',
        muscle: 'Total Body Recovery',
        sets: [
          { id: 's-su1-1', setNumber: 1, weight: 0, reps: 10, completed: false },
        ],
      },
    ],
  },
};

export const subscribeDailyRoutines = (
  userId: string,
  callback: (routines: Record<DayOfWeek, DayRoutineTemplate>) => void
): Unsubscribe => {
  if (!db || !userId) {
    callback(DEFAULT_WEEKLY_SPLIT);
    return () => {};
  }

  const routinesRef = collection(db, 'users', userId, 'daily_routines');
  return onSnapshot(
    routinesRef,
    (snapshot) => {
      const merged: Record<DayOfWeek, DayRoutineTemplate> = { ...DEFAULT_WEEKLY_SPLIT };
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() as DayRoutineTemplate;
        const dayId = docSnap.id.toLowerCase() as DayOfWeek;
        if (merged[dayId]) {
          merged[dayId] = {
            ...merged[dayId],
            ...data,
            dayId,
          };
        }
      });
      callback(merged);
    },
    (err) => {
      console.warn('subscribeDailyRoutines snapshot error:', err);
      callback(DEFAULT_WEEKLY_SPLIT);
    }
  );
};

export const saveDailyRoutine = async (
  userId: string,
  dayId: DayOfWeek,
  routine: Partial<DayRoutineTemplate>
): Promise<void> => {
  if (!db || !userId) return;
  const routineRef = doc(db, 'users', userId, 'daily_routines', dayId.toLowerCase());
  await setDoc(
    routineRef,
    {
      ...routine,
      dayId: dayId.toLowerCase(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const startDayRoutineWorkout = async (
  userId: string,
  routine: DayRoutineTemplate
): Promise<WorkoutSession> => {
  if (!db || !userId) throw new Error('User not authenticated');

  const newSession: WorkoutSession = {
    routineName: routine.routineName,
    startedAt: Date.now(),
    isPaused: false,
    durationMinutes: routine.targetDurationMinutes || 45,
    duration_minutes: routine.targetDurationMinutes || 45,
    exercises: (routine.exercises || []).map((ex, exIdx) => ({
      ...ex,
      id: ex.id || `ex-${Date.now()}-${exIdx}`,
      sets: (ex.sets || []).map((s, sIdx) => ({
        ...s,
        id: s.id || `s-${Date.now()}-${exIdx}-${sIdx}`,
        completed: false,
      })),
    })),
  };

  const activeRef = doc(db, 'users', userId, 'data', 'active_workout');
  await setDoc(activeRef, newSession);
  await saveWorkoutToCollection(userId, newSession);

  return newSession;
};

/* ==================== USER WORKOUT STATS & COMPLETION MILESTONES ==================== */
export interface UserWorkoutStats {
  totalWorkoutsCompleted: number;
  totalVolumeLiftedKg: number;
  totalDurationMinutes: number;
  lastWorkoutDate?: string;
  updatedAt?: unknown;
}

export const DEFAULT_USER_WORKOUT_STATS: UserWorkoutStats = {
  totalWorkoutsCompleted: 0,
  totalVolumeLiftedKg: 0,
  totalDurationMinutes: 0,
};

/**
 * Subscribes in real-time to user's workout completion milestones and stats
 * stored at users/{userId}/stats/summary
 */
export const subscribeUserWorkoutStats = (
  userId: string,
  callback: (stats: UserWorkoutStats) => void
): Unsubscribe => {
  if (!db || !userId) {
    const cached = localStorage.getItem(`fit_user_stats_${userId}`);
    if (cached) {
      try {
        callback({ ...DEFAULT_USER_WORKOUT_STATS, ...JSON.parse(cached) });
        return () => {};
      } catch {
        // Ignored
      }
    }
    callback(DEFAULT_USER_WORKOUT_STATS);
    return () => {};
  }

  const statsDocRef = doc(db, 'users', userId, 'stats', 'summary');
  return onSnapshot(
    statsDocRef,
    (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        const stats: UserWorkoutStats = {
          totalWorkoutsCompleted: Number(d.totalWorkoutsCompleted) || 0,
          totalVolumeLiftedKg: Number(d.totalVolumeLiftedKg) || 0,
          totalDurationMinutes: Number(d.totalDurationMinutes) || 0,
          lastWorkoutDate: d.lastWorkoutDate || getTodayDateString(),
          updatedAt: d.updatedAt,
        };
        localStorage.setItem(`fit_user_stats_${userId}`, JSON.stringify(stats));
        callback(stats);
      } else {
        const cached = localStorage.getItem(`fit_user_stats_${userId}`);
        if (cached) {
          try {
            callback({ ...DEFAULT_USER_WORKOUT_STATS, ...JSON.parse(cached) });
            return;
          } catch {
            // Ignored
          }
        }
        callback(DEFAULT_USER_WORKOUT_STATS);
      }
    },
    (err) => {
      console.warn('User workout stats snapshot error:', err);
      callback(DEFAULT_USER_WORKOUT_STATS);
    }
  );
};

/**
 * Atomically increments user's total completed workouts count and volume in Firestore
 * (users/{userId}/stats/summary and users/{userId}), returning the new milestone count.
 */
export const incrementUserWorkoutStats = async (
  userId: string,
  sessionMetrics: {
    volumeKg: number;
    durationMinutes: number;
  }
): Promise<number> => {
  if (!userId) return 1;

  let currentCount = 0;
  let currentVol = 0;
  let currentDur = 0;

  const cached = localStorage.getItem(`fit_user_stats_${userId}`);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      currentCount = Number(parsed.totalWorkoutsCompleted) || 0;
      currentVol = Number(parsed.totalVolumeLiftedKg) || 0;
      currentDur = Number(parsed.totalDurationMinutes) || 0;
    } catch {
      // Ignored
    }
  }

  let updatedTotal = currentCount + 1;
  const newVol = currentVol + sessionMetrics.volumeKg;
  const newDur = currentDur + sessionMetrics.durationMinutes;

  if (db) {
    try {
      const statsDocRef = doc(db, 'users', userId, 'stats', 'summary');
      const snap = await getDoc(statsDocRef);

      if (snap.exists()) {
        const data = snap.data();
        const firestoreCount = Number(data.totalWorkoutsCompleted) || 0;
        updatedTotal = Math.max(updatedTotal, firestoreCount + 1);
        const firestoreVol = (Number(data.totalVolumeLiftedKg) || 0) + sessionMetrics.volumeKg;
        const firestoreDur = (Number(data.totalDurationMinutes) || 0) + sessionMetrics.durationMinutes;

        await setDoc(
          statsDocRef,
          {
            totalWorkoutsCompleted: updatedTotal,
            totalVolumeLiftedKg: firestoreVol,
            totalDurationMinutes: firestoreDur,
            lastWorkoutDate: getTodayDateString(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        await setDoc(
          statsDocRef,
          {
            totalWorkoutsCompleted: updatedTotal,
            totalVolumeLiftedKg: newVol,
            totalDurationMinutes: newDur,
            lastWorkoutDate: getTodayDateString(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      // Also mirror to user root document
      await setDoc(
        doc(db, 'users', userId),
        {
          stats: {
            totalWorkoutsCompleted: updatedTotal,
            lastWorkoutDate: getTodayDateString(),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Error saving workout stats to Firestore:', err);
    }
  }

  localStorage.setItem(
    `fit_user_stats_${userId}`,
    JSON.stringify({
      totalWorkoutsCompleted: updatedTotal,
      totalVolumeLiftedKg: newVol,
      totalDurationMinutes: newDur,
      lastWorkoutDate: getTodayDateString(),
    })
  );

  // Evaluate and unlock workout & volume badges
  try {
    const checkWorkoutBadge = async (bId: string) => {
      const b = BADGE_DEFINITIONS.find((x) => x.badgeId === bId);
      if (b) await unlockReward(userId, b);
    };
    if (updatedTotal >= 1) await checkWorkoutBadge('first-workout');
    if (updatedTotal >= 5) await checkWorkoutBadge('workout-5');
    if (updatedTotal >= 20) await checkWorkoutBadge('workout-20');
    if (newVol >= 10000) await checkWorkoutBadge('volume-10k');
    if (newVol >= 50000) await checkWorkoutBadge('volume-50k');
    if (newVol >= 100000) await checkWorkoutBadge('volume-100k');
  } catch {
    // Non-blocking
  }

  return updatedTotal;
};

/* ==================== USER ROUTINE TIMINGS & NATURAL VOICE REMINDERS ==================== */
export interface RoutineItemSetting {
  time: string; // "06:00" in 24h format
  enabled: boolean;
  labelEn: string;
  labelTa: string;
}

export interface HydrationIntervalConfig {
  intervalHours: number; // e.g. 1, 2, 3, 4
  startTime: string; // e.g. '09:00'
  endTime: string; // e.g. '20:00'
  enabled: boolean;
  voicePrompt?: string;
}

export type NightDebriefLanguage = 'en' | 'ta' | 'both';

export interface NightDebriefConfig {
  time: string; // e.g. "21:00" in 24h format (9:00 PM)
  enabled: boolean;
  language: NightDebriefLanguage; // 'en' | 'ta' | 'both'
  blackoutEnabled: boolean; // Screen-off sleep blackout mode after speech
  lastDebriefDate?: string;
}

export interface UserRoutineSettings {
  wakeUp: RoutineItemSetting;
  walking: RoutineItemSetting;
  workout: RoutineItemSetting;
  bedtime: RoutineItemSetting;
  hydrationInterval?: HydrationIntervalConfig;
  nightDebrief: NightDebriefConfig;
  voiceRemindersEnabled: boolean;
  voiceRate: number; // default: 0.95 (relaxed natural human cadence)
  voicePitch: number; // default: 1.0
  inAppNotificationEnabled: boolean;
  lastDismissedDate?: Record<string, string>; // { wakeUp: '2026-10-17', ... }
  updatedAt?: unknown;
}

export const DEFAULT_ROUTINE_SETTINGS: UserRoutineSettings = {
  wakeUp: {
    time: '06:00',
    enabled: true,
    labelEn: 'Wake-Up Routine',
    labelTa: 'காலை விழிப்பு நேரம்',
  },
  walking: {
    time: '06:30',
    enabled: true,
    labelEn: 'Walking & Cardio Session',
    labelTa: 'காலை நடைப்பயிற்சி',
  },
  workout: {
    time: '17:00',
    enabled: true,
    labelEn: 'Exercise & Workout Time',
    labelTa: 'மாலை உடற்பயிற்சி நேரம்',
  },
  bedtime: {
    time: '22:00',
    enabled: true,
    labelEn: 'Bedtime & Night Recovery',
    labelTa: 'இரவு உறக்க நேரம்',
  },
  hydrationInterval: {
    intervalHours: 2,
    startTime: '09:00',
    endTime: '20:00',
    enabled: true,
    voicePrompt: '{name}, time for a hydration break! Drink a glass of water to stay fresh.',
  },
  nightDebrief: {
    time: '21:00',
    enabled: true,
    language: 'both',
    blackoutEnabled: true,
  },
  voiceRemindersEnabled: true,
  voiceRate: 0.95,
  voicePitch: 1.0,
  inAppNotificationEnabled: true,
  lastDismissedDate: {},
};

/**
 * Subscribes in real-time to user's routine settings stored at users/{userId}/routine_settings/default
 */
export const subscribeRoutineSettings = (
  userId: string,
  callback: (settings: UserRoutineSettings) => void
): Unsubscribe => {
  if (!db || !userId) {
    const cached = localStorage.getItem(`fit_routine_settings_${userId}`);
    if (cached) {
      try {
        callback({ ...DEFAULT_ROUTINE_SETTINGS, ...JSON.parse(cached) });
        return () => {};
      } catch {
        // Ignored
      }
    }
    callback(DEFAULT_ROUTINE_SETTINGS);
    return () => {};
  }

  const routineDocRef = doc(db, 'users', userId, 'routine_settings', 'default');
  return onSnapshot(
    routineDocRef,
    (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        const merged: UserRoutineSettings = {
          wakeUp: { ...DEFAULT_ROUTINE_SETTINGS.wakeUp, ...(d.wakeUp || {}) },
          walking: { ...DEFAULT_ROUTINE_SETTINGS.walking, ...(d.walking || {}) },
          workout: { ...DEFAULT_ROUTINE_SETTINGS.workout, ...(d.workout || {}) },
          bedtime: { ...DEFAULT_ROUTINE_SETTINGS.bedtime, ...(d.bedtime || {}) },
          hydrationInterval: d.hydrationInterval
            ? { ...DEFAULT_ROUTINE_SETTINGS.hydrationInterval, ...d.hydrationInterval }
            : DEFAULT_ROUTINE_SETTINGS.hydrationInterval,
          nightDebrief: d.nightDebrief
            ? { ...DEFAULT_ROUTINE_SETTINGS.nightDebrief, ...d.nightDebrief }
            : DEFAULT_ROUTINE_SETTINGS.nightDebrief,
          voiceRemindersEnabled: d.voiceRemindersEnabled !== undefined ? Boolean(d.voiceRemindersEnabled) : true,
          voiceRate: Number(d.voiceRate) || 0.95,
          voicePitch: Number(d.voicePitch) || 1.0,
          inAppNotificationEnabled: d.inAppNotificationEnabled !== undefined ? Boolean(d.inAppNotificationEnabled) : true,
          lastDismissedDate: d.lastDismissedDate || {},
          updatedAt: d.updatedAt,
        };
        localStorage.setItem(`fit_routine_settings_${userId}`, JSON.stringify(merged));
        callback(merged);
      } else {
        const cached = localStorage.getItem(`fit_routine_settings_${userId}`);
        if (cached) {
          try {
            callback({ ...DEFAULT_ROUTINE_SETTINGS, ...JSON.parse(cached) });
            return;
          } catch {
            // Ignored
          }
        }
        callback(DEFAULT_ROUTINE_SETTINGS);
      }
    },
    (err) => {
      console.warn('Routine settings snapshot notice:', err);
      const cached = localStorage.getItem(`fit_routine_settings_${userId}`);
      if (cached) {
        try {
          callback({ ...DEFAULT_ROUTINE_SETTINGS, ...JSON.parse(cached) });
          return;
        } catch {
          // Ignored
        }
      }
      callback(DEFAULT_ROUTINE_SETTINGS);
    }
  );
};

/**
 * Saves or updates routine timing settings in Firestore (users/{userId}/routine_settings/default)
 */
export const saveRoutineSettings = async (
  userId: string,
  updates: Partial<UserRoutineSettings>
): Promise<void> => {
  if (!userId) return;

  const cached = localStorage.getItem(`fit_routine_settings_${userId}`);
  let current = DEFAULT_ROUTINE_SETTINGS;
  if (cached) {
    try {
      current = { ...DEFAULT_ROUTINE_SETTINGS, ...JSON.parse(cached) };
    } catch {
      // Ignored
    }
  }

  const merged: UserRoutineSettings = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(`fit_routine_settings_${userId}`, JSON.stringify(merged));

  if (db) {
    try {
      const routineDocRef = doc(db, 'users', userId, 'routine_settings', 'default');
      await setDoc(
        routineDocRef,
        {
          ...updates,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Error saving routine settings to Firestore:', err);
    }
  }
};

/**
 * Marks a routine reminder as dismissed for a given date (e.g. today) so it doesn't fire repeatedly
 */
export const dismissRoutineForToday = async (
  userId: string,
  routineKey: 'wakeUp' | 'walking' | 'workout' | 'bedtime',
  dateStr = getTodayDateString()
): Promise<void> => {
  if (!userId) return;

  const cached = localStorage.getItem(`fit_routine_settings_${userId}`);
  let dismissedMap: Record<string, string> = {};
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      dismissedMap = parsed.lastDismissedDate || {};
    } catch {
      // Ignored
    }
  }
  dismissedMap[routineKey] = dateStr;

  await saveRoutineSettings(userId, {
    lastDismissedDate: dismissedMap,
  });
};

/**
 * Dismisses or marks night debrief as completed for today
 */
export const dismissNightDebriefForToday = async (
  userId: string,
  dateStr = getTodayDateString()
): Promise<void> => {
  if (!userId) return;
  const cached = localStorage.getItem(`fit_routine_settings_${userId}`);
  let currentDebrief = DEFAULT_ROUTINE_SETTINGS.nightDebrief;
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed.nightDebrief) {
        currentDebrief = { ...currentDebrief, ...parsed.nightDebrief };
      }
    } catch {
      // Ignored
    }
  }
  await saveRoutineSettings(userId, {
    nightDebrief: {
      ...currentDebrief,
      lastDebriefDate: dateStr,
    },
  });
};

export interface DailyPerformanceSummary {
  date: string;
  workoutCompleted: boolean;
  workoutDurationMinutes: number;
  workoutVolumeKg: number;
  workoutCount: number;
  workoutNames: string[];
  caloriesConsumed: number;
  targetCalories: number;
  calorieDelta: number;
  proteinGrams: number;
  proteinTargetGrams: number;
  waterMl: number;
  waterTargetMl: number;
  waterPercent: number;
  steps: number;
  goalSteps: number;
  stepsPercent: number;
  checkInCompleted: boolean;
  isFasting: boolean;
  fastingType?: string;
  streakCount: number;
}

/**
 * Fetches today's comprehensive performance data across all Firestore collections
 */
export const fetchTodayPerformanceData = async (
  userId: string
): Promise<DailyPerformanceSummary> => {
  const todayStr = getTodayDateString();
  const summary: DailyPerformanceSummary = {
    date: todayStr,
    workoutCompleted: false,
    workoutDurationMinutes: 0,
    workoutVolumeKg: 0,
    workoutCount: 0,
    workoutNames: [],
    caloriesConsumed: 0,
    targetCalories: 2200,
    calorieDelta: 0,
    proteinGrams: 0,
    proteinTargetGrams: 140,
    waterMl: 0,
    waterTargetMl: 3000,
    waterPercent: 0,
    steps: 0,
    goalSteps: 10000,
    stepsPercent: 0,
    checkInCompleted: false,
    isFasting: false,
    streakCount: 0,
  };

  if (!userId) return summary;

  // 1. Check Profile for baseline TDEE & targets
  try {
    const profileCached = localStorage.getItem(`fit_user_profile_${userId}`);
    if (profileCached) {
      const p = JSON.parse(profileCached);
      if (p.calculatedTdee) summary.targetCalories = p.calculatedTdee;
      if (p.currentWeightKg) summary.proteinTargetGrams = Math.round(p.currentWeightKg * 2.0);
    }
  } catch {
    // Ignored
  }

  // 2. Hydration
  try {
    const hydCached = localStorage.getItem(`fit_hydration_${userId}_${todayStr}`);
    if (hydCached) {
      const hyd = JSON.parse(hydCached);
      summary.waterMl = Number(hyd.waterMl) || 0;
      summary.waterTargetMl = Number(hyd.targetMl) || 3000;
    }
    if (db) {
      const hydSnap = await getDoc(doc(db, 'users', userId, 'hydration', todayStr));
      if (hydSnap.exists()) {
        const hydData = hydSnap.data();
        summary.waterMl = Number(hydData.waterMl) || summary.waterMl;
        summary.waterTargetMl = Number(hydData.targetMl) || summary.waterTargetMl;
      }
    }
    summary.waterPercent = Math.min(100, Math.round((summary.waterMl / Math.max(1, summary.waterTargetMl)) * 100));
  } catch {
    // Ignored
  }

  // 3. Daily Activity (Steps)
  try {
    const actCached = localStorage.getItem(`fit_activity_${userId}_${todayStr}`);
    if (actCached) {
      const act = JSON.parse(actCached);
      summary.steps = Number(act.steps) || 0;
      summary.goalSteps = Number(act.goalSteps) || 10000;
    }
    if (db) {
      const actSnap = await getDoc(doc(db, 'users', userId, 'activity', todayStr));
      if (actSnap.exists()) {
        const actData = actSnap.data();
        summary.steps = Number(actData.steps) || summary.steps;
        summary.goalSteps = Number(actData.goalSteps) || summary.goalSteps;
      }
    }
    summary.stepsPercent = Math.min(100, Math.round((summary.steps / Math.max(1, summary.goalSteps)) * 100));
  } catch {
    // Ignored
  }

  // 4. Fasting
  try {
    const fastCached = localStorage.getItem(`fit_fasting_${userId}_${todayStr}`);
    if (fastCached) {
      const f = JSON.parse(fastCached);
      summary.isFasting = Boolean(f.isFasting && f.fastingType !== 'none');
      summary.fastingType = f.fastingType;
    }
    if (db) {
      const fastSnap = await getDoc(doc(db, 'users', userId, 'fasting', todayStr));
      if (fastSnap.exists()) {
        const fData = fastSnap.data();
        summary.isFasting = Boolean(fData.isFasting && fData.fastingType !== 'none');
        summary.fastingType = fData.fastingType;
      }
    }
  } catch {
    // Ignored
  }

  // 5. Workouts Completed Today
  try {
    const isTodayDate = (dateVal: unknown): boolean => {
      if (!dateVal) return false;
      try {
        const d = dateVal instanceof Date ? dateVal : new Date(String(dateVal));
        return !isNaN(d.getTime()) && d.toISOString().split('T')[0] === todayStr;
      } catch {
        return false;
      }
    };

    if (db) {
      const workoutsSnap = await getDocs(query(collection(db, 'users', userId, 'completed_workouts'), limit(30)));
      const todayWorkouts = workoutsSnap.docs
        .map((d) => d.data())
        .filter((w) => isTodayDate(w.completedAt));

      if (todayWorkouts.length > 0) {
        summary.workoutCompleted = true;
        summary.workoutCount = todayWorkouts.length;
        summary.workoutDurationMinutes = todayWorkouts.reduce((acc, w) => acc + (Number(w.durationMinutes || w.duration_minutes) || 0), 0);
        summary.workoutVolumeKg = todayWorkouts.reduce((acc, w) => acc + (Number(w.totalVolumeKg) || 0), 0);
        summary.workoutNames = todayWorkouts.map((w) => String(w.routineName || w.name || 'Workout')).filter(Boolean);
      }
    }
  } catch {
    // Ignored
  }

  // 6. Nutrition Logs Today
  try {
    if (db) {
      const nutSnap = await getDocs(query(collection(db, 'users', userId, 'nutrition_logs'), limit(50)));
      const todayLogs = nutSnap.docs
        .map((d) => d.data())
        .filter((l) => {
          if (!l.loggedAt) return false;
          const d = l.loggedAt instanceof Date ? l.loggedAt : new Date(String(l.loggedAt));
          return !isNaN(d.getTime()) && d.toISOString().split('T')[0] === todayStr;
        });

      summary.caloriesConsumed = todayLogs.reduce((acc, l) => acc + (Number(l.calories) || 0), 0);
      summary.proteinGrams = todayLogs.reduce((acc, l) => acc + (Number(l.protein) || 0), 0);
      summary.calorieDelta = summary.caloriesConsumed - summary.targetCalories;
    }
  } catch {
    // Ignored
  }

  // 7. Check-Ins Today
  try {
    if (db) {
      const checkSnap = await getDocs(query(collection(db, 'users', userId, 'checkins'), limit(10)));
      const hasTodayCheckin = checkSnap.docs.some((d) => {
        const data = d.data();
        const dateVal = data.date || data.createdAt;
        if (!dateVal) return false;
        const dt = dateVal instanceof Date ? dateVal : new Date(String(dateVal));
        return !isNaN(dt.getTime()) && dt.toISOString().split('T')[0] === todayStr;
      });
      summary.checkInCompleted = hasTodayCheckin;
    }
  } catch {
    // Ignored
  }

  // 8. Streak
  try {
    const streakCached = localStorage.getItem(`fit_streak_${userId}`);
    if (streakCached) {
      const st = JSON.parse(streakCached);
      summary.streakCount = Number(st.currentStreak) || 0;
    }
    if (db) {
      const streakSnap = await getDoc(doc(db, 'users', userId, 'streak', 'user_streak'));
      if (streakSnap.exists()) {
        summary.streakCount = Number(streakSnap.data().currentStreak) || summary.streakCount;
      }
    }
  } catch {
    // Ignored
  }

  return summary;
};

/* ==================== CUSTOM ROUTINES & DAILY VOICE REMINDERS ==================== */

export type RoutineRepeatFrequency = 'daily' | 'weekdays' | 'weekends';

export interface CustomRoutineItem {
  id: string;
  name: string;
  nameTamil?: string;
  time: string; // '07:00' (24-hour format HH:mm)
  voicePrompt?: string; // Optional custom voice prompt, e.g. "{name}, time for your evening meditation!"
  repeat: RoutineRepeatFrequency; // 'daily' | 'weekdays' | 'weekends'
  enabled: boolean;
  category?: string; // 'Wake-Up' | 'Cardio' | 'Workout' | 'Bedtime' | 'Nutrition' | 'Meditation' | 'Hydration' | 'Custom'
  icon?: string; // e.g. '🌅', '🚶', '🏋️', '🌙', '💧', '🧘', '🥗', '⏰'
  isDefault?: boolean;
  lastDismissedDate?: string; // YYYY-MM-DD
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const DEFAULT_CUSTOM_ROUTINES: Omit<CustomRoutineItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Wake-Up Routine',
    nameTamil: 'காலை விழிப்பு',
    time: '06:00',
    voicePrompt: 'Good morning {name}! It is time to wake up, hydrate, and start your day energized. Have a wonderful and productive day ahead!',
    repeat: 'daily',
    enabled: true,
    category: 'Wake-Up',
    icon: '🌅',
    isDefault: true,
  },
  {
    name: 'Morning Walk & Cardio',
    nameTamil: 'காலை நடைப்பயிற்சி',
    time: '06:30',
    voicePrompt: '{name}, it is time for your morning walking and cardio session! Step outside, breathe in the fresh air, and let us get those steps in.',
    repeat: 'daily',
    enabled: true,
    category: 'Cardio',
    icon: '🚶',
    isDefault: true,
  },
  {
    name: 'Exercise & Workout',
    nameTamil: 'உடற்பயிற்சி நேரம்',
    time: '17:00',
    voicePrompt: '{name}, it is time for your scheduled exercise and strength training session! Let us get moving, hit your sets, and stay consistent with your fitness goals.',
    repeat: 'daily',
    enabled: true,
    category: 'Workout',
    icon: '🏋️',
    isDefault: true,
  },
  {
    name: 'Bedtime & Night Recovery',
    nameTamil: 'இரவு உறக்கம்',
    time: '22:00',
    voicePrompt: 'Good evening {name}. It is time for your bedtime routine. Dim the lights, put away your screens, and enjoy deep, restorative sleep for tomorrow.',
    repeat: 'daily',
    enabled: true,
    category: 'Bedtime',
    icon: '🌙',
    isDefault: true,
  },
];

/**
 * Subscribes in real-time to user's custom daily routines stored at users/{userId}/custom_routines
 * Seeds defaults automatically if collection is empty.
 */
export const subscribeCustomRoutines = (
  userId: string,
  callback: (routines: CustomRoutineItem[]) => void
): Unsubscribe => {
  if (!userId) {
    callback([]);
    return () => {};
  }

  // Load from local storage cache initially for fast render
  const cacheKey = `fit_custom_routines_${userId}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        callback(parsed);
      }
    } catch {
      // Ignored
    }
  }

  if (!db) {
    if (!cached) {
      const seedRoutines: CustomRoutineItem[] = DEFAULT_CUSTOM_ROUTINES.map((item, idx) => ({
        id: `default-${idx + 1}`,
        ...item,
      }));
      callback(seedRoutines);
    }
    return () => {};
  }

  const routinesRef = collection(db, 'users', userId, 'custom_routines');
  const q = query(routinesRef, orderBy('time', 'asc'));

  return onSnapshot(
    q,
    async (snapshot) => {
      if (snapshot.empty) {
        // If collection is completely empty, automatically seed baseline defaults
        const seedRoutines: CustomRoutineItem[] = [];
        for (let i = 0; i < DEFAULT_CUSTOM_ROUTINES.length; i++) {
          const item = DEFAULT_CUSTOM_ROUTINES[i];
          try {
            const docRef = await addDoc(routinesRef, {
              ...item,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            seedRoutines.push({
              id: docRef.id,
              ...item,
            });
          } catch (e) {
            console.warn('Seeding routine notice:', e);
            seedRoutines.push({
              id: `default-${i + 1}`,
              ...item,
            });
          }
        }
        localStorage.setItem(cacheKey, JSON.stringify(seedRoutines));
        callback(seedRoutines);
      } else {
        const items: CustomRoutineItem[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<CustomRoutineItem, 'id'>),
        }));
        // Ensure sorted by time
        items.sort((a, b) => a.time.localeCompare(b.time));
        localStorage.setItem(cacheKey, JSON.stringify(items));
        callback(items);
      }
    },
    (err) => {
      console.warn('Custom routines snapshot error/offline:', err);
      const fallback = localStorage.getItem(cacheKey);
      if (fallback) {
        try {
          callback(JSON.parse(fallback));
          return;
        } catch {
          // Ignored
        }
      }
      callback(DEFAULT_CUSTOM_ROUTINES.map((item, idx) => ({ id: `default-${idx + 1}`, ...item })));
    }
  );
};

/**
 * Adds a new custom routine to users/{userId}/custom_routines
 */
export const addCustomRoutine = async (
  userId: string,
  routine: Omit<CustomRoutineItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string | null> => {
  if (!userId) return null;

  const cacheKey = `fit_custom_routines_${userId}`;
  const newId = `routine_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newItem: CustomRoutineItem = {
    id: newId,
    ...routine,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Optimistic local cache update
  try {
    const cached = localStorage.getItem(cacheKey);
    const list: CustomRoutineItem[] = cached ? JSON.parse(cached) : [];
    list.push(newItem);
    list.sort((a, b) => a.time.localeCompare(b.time));
    localStorage.setItem(cacheKey, JSON.stringify(list));
  } catch {
    // Ignored
  }

  if (db) {
    try {
      const routinesRef = collection(db, 'users', userId, 'custom_routines');
      const docRef = await addDoc(routinesRef, {
        ...routine,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (err) {
      console.warn('Error adding custom routine to Firestore:', err);
    }
  }

  return newId;
};

/**
 * Updates an existing custom routine in users/{userId}/custom_routines
 */
export const updateCustomRoutine = async (
  userId: string,
  routineId: string,
  updates: Partial<CustomRoutineItem>
): Promise<void> => {
  if (!userId || !routineId) return;

  const cacheKey = `fit_custom_routines_${userId}`;

  // Optimistic cache update
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const list: CustomRoutineItem[] = JSON.parse(cached);
      const updatedList = list.map((item) =>
        item.id === routineId ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
      );
      updatedList.sort((a, b) => a.time.localeCompare(b.time));
      localStorage.setItem(cacheKey, JSON.stringify(updatedList));
    }
  } catch {
    // Ignored
  }

  if (db) {
    try {
      const routineDocRef = doc(db, 'users', userId, 'custom_routines', routineId);
      await setDoc(
        routineDocRef,
        {
          ...updates,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Error updating custom routine in Firestore:', err);
    }
  }
};

/**
 * Permanently deletes a custom routine from users/{userId}/custom_routines
 */
export const deleteCustomRoutine = async (
  userId: string,
  routineId: string
): Promise<void> => {
  if (!userId || !routineId) return;

  const cacheKey = `fit_custom_routines_${userId}`;

  // Optimistic cache update
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const list: CustomRoutineItem[] = JSON.parse(cached);
      const updatedList = list.filter((item) => item.id !== routineId);
      localStorage.setItem(cacheKey, JSON.stringify(updatedList));
    }
  } catch {
    // Ignored
  }

  if (db) {
    try {
      const routineDocRef = doc(db, 'users', userId, 'custom_routines', routineId);
      await deleteDoc(routineDocRef);
    } catch (err) {
      console.warn('Error deleting custom routine from Firestore:', err);
    }
  }
};

/**
 * Marks a custom routine as dismissed for today so it does not re-trigger in the same minute
 */
export const dismissCustomRoutineForToday = async (
  userId: string,
  routineId: string,
  dateStr = getTodayDateString()
): Promise<void> => {
  await updateCustomRoutine(userId, routineId, {
    lastDismissedDate: dateStr,
  });
};

/**
 * Calculates recurring hydration time slots between startTime and endTime
 * based on the provided interval in hours
 */
export const calculateHydrationSlots = (
  startTime: string,
  endTime: string,
  intervalHours: number
): { time: string; displayTime: string }[] => {
  const parseMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const format24Hour = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const format12Hour = (time24: string) => {
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
  };

  const startMin = parseMinutes(startTime);
  const endMin = parseMinutes(endTime);
  const stepMin = Math.round(intervalHours * 60);

  if (stepMin <= 0 || endMin <= startMin) return [];

  const slots: { time: string; displayTime: string }[] = [];
  for (let m = startMin; m <= endMin; m += stepMin) {
    const time24 = format24Hour(m);
    slots.push({
      time: time24,
      displayTime: format12Hour(time24),
    });
  }
  return slots;
};

/**
 * Automatically generates, replaces, and saves a recurring interval hydration schedule
 * in Firestore (users/{userId}/custom_routines) and updates routine_settings.
 */
export const generateAndSaveHydrationSchedule = async (
  userId: string,
  config: HydrationIntervalConfig,
  _userName = 'Athlete'
): Promise<CustomRoutineItem[]> => {
  if (!userId) return [];

  const slots = calculateHydrationSlots(config.startTime, config.endTime, config.intervalHours);
  if (slots.length === 0) return [];

  const promptTemplate =
    config.voicePrompt?.trim() ||
    '{name}, time for a hydration break! Drink a glass of water to stay fresh.';

  // 1. Fetch current routines to identify existing hydration breaks
  const cacheKey = `fit_custom_routines_${userId}`;
  let currentRoutines: CustomRoutineItem[] = [];
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) currentRoutines = JSON.parse(cached);
  } catch {
    // Ignored
  }

  // 2. Remove previously generated hydration breaks to prevent duplicates
  const nonHydrationRoutines = currentRoutines.filter(
    (r) =>
      r.category?.toLowerCase() !== 'hydration' &&
      !r.name.toLowerCase().includes('hydration') &&
      !r.name.toLowerCase().includes('தண்ணீர்')
  );

  const hydrationToDelete = currentRoutines.filter(
    (r) =>
      r.category?.toLowerCase() === 'hydration' ||
      r.name.toLowerCase().includes('hydration') ||
      r.name.toLowerCase().includes('தண்ணீர்')
  );

  if (db) {
    for (const oldItem of hydrationToDelete) {
      try {
        await deleteDoc(doc(db, 'users', userId, 'custom_routines', oldItem.id));
      } catch (err) {
        console.warn('Error clearing old hydration break:', err);
      }
    }
  }

  // 3. Create the new hydration routine items
  const createdRoutines: CustomRoutineItem[] = [];
  const routinesRef = db ? collection(db, 'users', userId, 'custom_routines') : null;

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const newRoutineData: Omit<CustomRoutineItem, 'id'> = {
      name: `Hydration Break (${slot.displayTime})`,
      nameTamil: 'தண்ணீர் இடைவேளை',
      time: slot.time,
      voicePrompt: promptTemplate,
      repeat: 'daily',
      enabled: config.enabled ?? true,
      category: 'Hydration',
      icon: '💧',
      isDefault: false,
    };

    let newId = `hydration_${Date.now()}_${i}`;
    if (routinesRef) {
      try {
        const docRef = await addDoc(routinesRef, {
          ...newRoutineData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        newId = docRef.id;
      } catch (err) {
        console.warn('Error saving hydration routine to Firestore:', err);
      }
    }

    createdRoutines.push({
      id: newId,
      ...newRoutineData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // 4. Update local storage cache optimistically
  const mergedList = [...nonHydrationRoutines, ...createdRoutines].sort((a, b) =>
    a.time.localeCompare(b.time)
  );
  try {
    localStorage.setItem(cacheKey, JSON.stringify(mergedList));
  } catch {
    // Ignored
  }

  // 5. Save the generator configuration in routine_settings
  await saveRoutineSettings(userId, {
    hydrationInterval: config,
  });

  return createdRoutines;
};

/**
 * Removes all auto-generated hydration routines from users/{userId}/custom_routines
 */
export const clearHydrationSchedule = async (userId: string): Promise<number> => {
  if (!userId) return 0;

  const cacheKey = `fit_custom_routines_${userId}`;
  let currentRoutines: CustomRoutineItem[] = [];
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) currentRoutines = JSON.parse(cached);
  } catch {
    // Ignored
  }

  const hydrationItems = currentRoutines.filter(
    (r) =>
      r.category?.toLowerCase() === 'hydration' ||
      r.name.toLowerCase().includes('hydration') ||
      r.name.toLowerCase().includes('தண்ணீர்')
  );

  const retainedRoutines = currentRoutines.filter(
    (r) =>
      r.category?.toLowerCase() !== 'hydration' &&
      !r.name.toLowerCase().includes('hydration') &&
      !r.name.toLowerCase().includes('தண்ணீர்')
  );

  try {
    localStorage.setItem(cacheKey, JSON.stringify(retainedRoutines));
  } catch {
    // Ignored
  }

  if (db) {
    for (const item of hydrationItems) {
      try {
        await deleteDoc(doc(db, 'users', userId, 'custom_routines', item.id));
      } catch (err) {
        console.warn('Error deleting hydration item from Firestore:', err);
      }
    }
  }

  return hydrationItems.length;
};

/* ==================== FLUSH & RESET USER APP DATA ==================== */

export interface FlushDataProgress {
  step: string;
  progressPercent: number;
}

/**
 * Executes a comprehensive, secure purge of all user application data
 * across Firestore subcollections, media stores, and local storage caches
 * while keeping the Firebase Auth account authenticated.
 */
export async function flushUserAppData(
  userId: string,
  onProgress?: (progress: FlushDataProgress) => void
): Promise<void> {
  if (!userId) return;

  onProgress?.({ step: 'Initializing secure data flush...', progressPercent: 5 });

  // List of all user subcollections to purge
  const subcollections = [
    'checkins',
    'nutrition_logs',
    'workouts',
    'completed_workouts',
    'workout_logs',
    'saved_routines',
    'custom_exercises',
    'daily_routines',
    'stats',
    'alarm_videos',
    'custom_festivals',
    'custom_routines',
    'routine_settings',
    'streak',
    'rewards',
    'coach_messages',
    'data',
  ];

  if (db) {
    for (let i = 0; i < subcollections.length; i++) {
      const subcol = subcollections[i];
      const percent = Math.round(10 + (i / subcollections.length) * 70);
      onProgress?.({ step: `Purging ${subcol.replace(/_/g, ' ')}...`, progressPercent: percent });

      try {
        const colRef = collection(db, 'users', userId, subcol);
        const snapshot = await getDocs(colRef);
        if (!snapshot.empty) {
          // Process deletes in batches (up to 500 ops per batch)
          let batch = writeBatch(db);
          let count = 0;

          for (const docSnap of snapshot.docs) {
            batch.delete(docSnap.ref);
            count++;
            if (count >= 400) {
              await batch.commit();
              batch = writeBatch(db);
              count = 0;
            }
          }

          if (count > 0) {
            await batch.commit();
          }
        }
      } catch (err) {
        console.warn(`Notice while clearing subcollection ${subcol}:`, err);
      }
    }

    // Reset root user profile document to un-onboarded defaults
    onProgress?.({ step: 'Resetting baseline metrics and onboarding state...', progressPercent: 85 });
    try {
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, {
        gender: 'male',
        age: 25,
        heightCm: 175,
        currentWeightKg: 75,
        targetWeightKg: 75,
        activityMultiplier: 1.55,
        experienceLevel: 'intermediate',
        equipment: ['Barbell', 'Dumbbells', 'Adjustable Bench', 'Pull-up Bar', 'Resistance Bands'],
        calculatedTdee: 2450,
        bmr: 1700,
        onboardingCompleted: false,
        updatedAt: serverTimestamp(),
        flushedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Notice while resetting root user profile document:', err);
    }
  }

  // Clear local storage items associated with this user / app
  onProgress?.({ step: 'Wiping local cache & offline storage...', progressPercent: 92 });
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes(userId) || key.startsWith('fit_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (err) {
      console.warn('Notice while clearing localStorage:', err);
    }
  }

  // Clear local IndexedDB video store
  onProgress?.({ step: 'Wiping custom alarm video media...', progressPercent: 97 });
  try {
    await clearAllStoredVideos();
  } catch (err) {
    console.warn('Notice while clearing IndexedDB:', err);
  }

  onProgress?.({ step: 'App data flushed successfully!', progressPercent: 100 });
}









