import {
  doc,
  collection,
  setDoc,
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
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as UserProfile);
      } else {
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
  exercises: ExerciseItem[];
}

export interface CompletedWorkout {
  id: string;
  routineName: string;
  completedAt: unknown;
  totalVolumeKg: number;
  totalSets: number;
  durationMinutes: number;
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

  // Add to completed_workouts collection
  const completedRef = collection(db, 'users', userId, 'completed_workouts');
  await addDoc(completedRef, {
    routineName: session.routineName || 'Custom Workout',
    completedAt: serverTimestamp(),
    totalVolumeKg,
    totalSets,
    durationMinutes,
    exercises: session.exercises,
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

  // 6. Iron Will (10 checkins)
  if (checkIns.length >= 10) {
    const b = BADGE_DEFINITIONS.find((x) => x.badgeId === 'iron-will');
    if (b) await checkAndUnlock(b);
  }

  return newlyUnlocked;
};


