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
