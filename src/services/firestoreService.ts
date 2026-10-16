import {
  doc,
  collection,
  setDoc,
  getDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';

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
  if (!db || !userId) return DEFAULT_USER_PROFILE;
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      const defaultProfile: UserProfile = {
        ...DEFAULT_USER_PROFILE,
        ...defaults,
      };
      await setDoc(
        userDocRef,
        {
          ...defaultProfile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      return defaultProfile;
    }
    return snap.data() as UserProfile;
  } catch (err) {
    console.warn('Failed to ensure user profile exists in Firestore:', err);
    return DEFAULT_USER_PROFILE;
  }
};

export const subscribeUserProfile = (
  userId: string,
  callback: (profile: UserProfile | null) => void
): Unsubscribe => {
  if (!db || !userId) {
    callback(null);
    return () => {};
  }

  const userDocRef = doc(db, 'users', userId);
  return onSnapshot(
    userDocRef,
    async (snapshot) => {
      try {
        if (snapshot.exists()) {
          callback(snapshot.data() as UserProfile);
        } else {
          // Auto-initialize missing Firestore user documents
          const defaultProfile: UserProfile = {
            ...DEFAULT_USER_PROFILE,
          };
          await setDoc(
            userDocRef,
            {
              ...defaultProfile,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
          callback(defaultProfile);
        }
      } catch (err) {
        console.error('Error in subscribeUserProfile onSnapshot handler:', err);
        callback(null);
      }
    },
    (error) => {
      console.warn('Firestore user profile snapshot error:', error);
      callback(null);
    }
  );
};

export const saveUserProfile = async (
  userId: string,
  profile: Partial<UserProfile>
): Promise<void> => {
  if (!db || !userId) return;

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
  if (!db || !userId) {
    callback(null);
    return () => {};
  }

  const biometricsRef = doc(db, 'users', userId, 'data', 'biometrics');
  return onSnapshot(
    biometricsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as UserBiometrics);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.warn('Firestore biometrics snapshot error:', error);
      callback(null);
    }
  );
};

export const saveUserBiometrics = async (
  userId: string,
  biometrics: UserBiometrics
): Promise<void> => {
  if (!db || !userId) return;
  const biometricsRef = doc(db, 'users', userId, 'data', 'biometrics');
  await setDoc(
    biometricsRef,
    {
      ...biometrics,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
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

export const finishAndSaveWorkout = async (
  userId: string,
  session: WorkoutSession,
  durationMinutes = 45
): Promise<void> => {
  if (!db || !userId) return;

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
  await addDoc(completedRef, {
    routineName: session.routineName || 'Custom Workout',
    completedAt: serverTimestamp(),
    totalVolumeKg,
    totalSets,
    durationMinutes: finalDurationMinutes,
    duration_minutes: finalDurationMinutes,
    exercises: session.exercises,
  });

  // 2. Also log to workouts collection with duration_minutes
  const workoutsRef = collection(db, 'users', userId, 'workouts');
  await addDoc(workoutsRef, {
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

  // Clear active workout session
  await saveActiveWorkout(userId, null);
};

export const subscribeCompletedWorkouts = (
  userId: string,
  callback: (workouts: CompletedWorkout[]) => void,
  limitCount = 20
): Unsubscribe => {
  if (!db || !userId) {
    callback([]);
    return () => {};
  }

  const completedRef = collection(db, 'users', userId, 'completed_workouts');
  const q = query(completedRef, orderBy('completedAt', 'desc'), limit(limitCount));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: CompletedWorkout[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<CompletedWorkout, 'id'>),
      }));
      callback(items);
    },
    (error) => {
      console.warn('Firestore completed workouts snapshot error:', error);
      callback([]);
    }
  );
};

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
  sorenessNotes?: string;
  photoUrl: string;
  aiPhysiqueAnalysis?: AiPhysiqueAnalysis;
  restingHeartRateBpm?: number;
  sleepHours?: number;
  energyLevel?: 'low' | 'moderate' | 'high';
  steps?: number;
  createdAt?: unknown;
}

export interface UserReward {
  id: string;
  badgeId: string;
  title: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  icon: string;
  unlockedAt?: unknown;
}

export const BADGE_DEFINITIONS: Omit<UserReward, 'id' | 'unlockedAt'>[] = [
  {
    badgeId: 'first-step',
    title: 'First Step',
    description: 'Logged your very first morning check-in and weight record.',
    tier: 'bronze',
    icon: 'Footprints',
  },
  {
    badgeId: 'streak-3',
    title: 'Consistency Ignition',
    description: 'Maintained 3 consecutive check-in milestones.',
    tier: 'silver',
    icon: 'Flame',
  },
  {
    badgeId: 'streak-7',
    title: 'Streak Master',
    description: 'Completed a 7-day uninterrupted check-in streak.',
    tier: 'gold',
    icon: 'Trophy',
  },
  {
    badgeId: 'maintenance-anchor',
    title: 'Maintenance Anchor',
    description: 'Maintained body weight within ±0.75kg target variance over 5 check-ins.',
    tier: 'gold',
    icon: 'Anchor',
  },
  {
    badgeId: 'physique-pioneer',
    title: 'Physique Pioneer',
    description: 'Unlocked your first Gemini AI vision body type & symmetry analysis.',
    tier: 'silver',
    icon: 'Camera',
  },
  {
    badgeId: 'iron-will',
    title: 'Iron Will & Readiness',
    description: 'Completed 10 full readiness and recovery fatigue evaluations.',
    tier: 'diamond',
    icon: 'Shield',
  },
];

export const addCheckIn = async (
  userId: string,
  checkIn: Omit<CheckInItem, 'id' | 'createdAt'>
): Promise<string | null> => {
  if (!db || !userId) return null;
  const colRef = collection(db, 'users', userId, 'checkins');
  const docRef = await addDoc(colRef, {
    ...checkIn,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
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
  targetWeightKg?: number
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

  // 1. First Step (1 checkin)
  if (checkIns.length >= 1) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'first-step');
    if (b) await checkAndUnlock(b);
  }

  // 2. Consistency Ignition (3 checkins)
  if (checkIns.length >= 3) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'streak-3');
    if (b) await checkAndUnlock(b);
  }

  // 3. Streak Master (7 checkins)
  if (checkIns.length >= 7) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'streak-7');
    if (b) await checkAndUnlock(b);
  }

  // 4. Physique Pioneer (has at least 1 checkin with aiPhysiqueAnalysis)
  if (checkIns.some((c) => Boolean(c.aiPhysiqueAnalysis))) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'physique-pioneer');
    if (b) await checkAndUnlock(b);
  }

  // 5. Maintenance Anchor (within ±0.75kg target for at least 3 checkins)
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
  if (!db || !userId) {
    callback({ ...DEFAULT_DAILY_HYDRATION, date: dateStr });
    return () => {};
  }

  const docRef = doc(db, 'users', userId, 'data', `hydration_${dateStr}`);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({
          date: dateStr,
          waterMl: Number(data.waterMl) || 0,
          targetMl: Number(data.targetMl) || 3000,
          updatedAt: data.updatedAt,
        });
      } else {
        callback({ ...DEFAULT_DAILY_HYDRATION, date: dateStr });
      }
    },
    (err) => {
      console.warn('Daily hydration snapshot error:', err);
      callback({ ...DEFAULT_DAILY_HYDRATION, date: dateStr });
    }
  );
};

export const logWaterIntake = async (
  userId: string,
  dateStr: string,
  deltaMl: number,
  targetMl = 3000
): Promise<number> => {
  if (!db || !userId) return 0;
  const docRef = doc(db, 'users', userId, 'data', `hydration_${dateStr}`);
  const snap = await getDoc(docRef);
  let currentMl = 0;
  if (snap.exists()) {
    currentMl = Number(snap.data()?.waterMl) || 0;
  }
  const newAmount = Math.max(0, currentMl + deltaMl);
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
  return newAmount;
};

export const resetWaterIntake = async (
  userId: string,
  dateStr: string,
  targetMl = 3000
): Promise<void> => {
  if (!db || !userId) return;
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
  if (!db || !userId) {
    callback({ ...DEFAULT_DAILY_ACTIVITY, date: dateStr });
    return () => {};
  }

  const docRef = doc(db, 'users', userId, 'data', `activity_${dateStr}`);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const steps = Number(data.steps) || 0;
        const goalSteps = Number(data.goalSteps) || 10000;
        callback({
          date: dateStr,
          steps,
          goalSteps,
          distanceKm: parseFloat((steps * 0.00076).toFixed(2)),
          caloriesBurned: Math.round(steps * 0.04),
          updatedAt: data.updatedAt,
        });
      } else {
        callback({ ...DEFAULT_DAILY_ACTIVITY, date: dateStr });
      }
    },
    (err) => {
      console.warn('Daily activity snapshot error:', err);
      callback({ ...DEFAULT_DAILY_ACTIVITY, date: dateStr });
    }
  );
};

export const logDailySteps = async (
  userId: string,
  dateStr: string,
  steps: number,
  goalSteps = 10000
): Promise<void> => {
  if (!db || !userId) return;
  const docRef = doc(db, 'users', userId, 'data', `activity_${dateStr}`);
  const safeSteps = Math.max(0, Math.round(steps));
  await setDoc(
    docRef,
    {
      date: dateStr,
      steps: safeSteps,
      goalSteps,
      distanceKm: parseFloat((safeSteps * 0.00076).toFixed(2)),
      caloriesBurned: Math.round(safeSteps * 0.04),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
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
  stepsGoal = 10000
): BmbScoreResult => {
  const safeTarget = Math.max(1200, targetCalories || 2000);
  const calorieDiff = todayCalories - safeTarget;
  const calorieDeviationPct =
    todayCalories > 0
      ? Math.round(((todayCalories - safeTarget) / safeTarget) * 1000) / 10
      : 0;

  // 1. Caloric Alignment (max 35 pts)
  let calorieScore = 30; // Neutral baseline
  if (todayCalories > 0) {
    const absDev = Math.abs(calorieDeviationPct);
    if (absDev <= 5) calorieScore = 35;
    else if (absDev <= 10) calorieScore = 32;
    else if (absDev <= 15) calorieScore = 25;
    else if (absDev <= 25) calorieScore = 15;
    else calorieScore = 8;
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

  // Determine Status & Reactive Alert Criteria (>15% deviation or high fatigue)
  let status: 'optimal' | 'stable' | 'surplus' | 'deficit' | 'fatigue' = 'stable';
  let statusLabel = 'Stable Maintenance';

  const isSurplusAlert = calorieDeviationPct > 15;
  const isDeficitAlert = calorieDeviationPct < -15 && todayCalories > 0;
  const isFatigueAlert = Boolean(latestCheckIn && (latestCheckIn.fatigueRating <= 2 || latestCheckIn.energyLevel === 'low'));

  if (isFatigueAlert) {
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

  if (isSurplusAlert) {
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
  if (isSurplusAlert) {
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
 * Saves a workout routine to users/{userId}/workouts collection
 */
export const saveWorkoutToCollection = async (
  userId: string,
  session: WorkoutSession
): Promise<string | null> => {
  if (!db || !userId) return null;
  const colRef = collection(db, 'users', userId, 'workouts');
  const docRef = await addDoc(colRef, {
    ...session,
    savedAt: serverTimestamp(),
  });
  return docRef.id;
};

/**
 * Subscribes to custom workouts saved in users/{userId}/workouts
 */
export const subscribeWorkoutsCollection = (
  userId: string,
  callback: (workouts: (WorkoutSession & { id: string })[]) => void
): Unsubscribe => {
  if (!db || !userId) {
    callback([]);
    return () => {};
  }
  const colRef = collection(db, 'users', userId, 'workouts');
  const q = query(colRef, orderBy('savedAt', 'desc'), limit(20));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as WorkoutSession),
      }));
      callback(items);
    },
    (err) => {
      console.warn('Firestore workouts collection snapshot error:', err);
      callback([]);
    }
  );
};

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



