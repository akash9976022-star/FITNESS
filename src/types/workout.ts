export type SetType = 'normal' | 'warmup' | 'drop' | 'failure';

export interface ExerciseSetItem {
  id: string;
  setNumber: number;
  type?: SetType;
  weight: string; // e.g. "25" or "25 kg"
  reps: string;   // e.g. "10" or "8-10"
  completed: boolean;
  previous?: string; // e.g. "22.5 kg × 10"
  rpe?: number;
}

export interface WorkoutExerciseItem {
  id: string;
  name: string;
  targetMuscle: string;
  category: 'Push' | 'Pull' | 'Legs' | 'Core' | 'Cardio';
  equipmentRequired: string[]; // List of equipment IDs required, e.g. ['dumbbells', 'adjustable_bench']
  equipmentLabel: string;      // Human-readable, e.g. 'Dumbbells & Bench'
  sets: number;
  reps: string;
  weight: string;
  completedSets: number;
  completed: boolean;
  notes?: string;
  tempo?: string;
  replacedReason?: string;
  setList?: ExerciseSetItem[]; // Hevy-style individual set tracking
}

export interface WorkoutSessionItem {
  id: string;
  name: string;
  routineName: string;
  routine: string; // 'Upper' | 'Lower' | 'Full Body' | 'Conditioning' | 'Custom'
  durationMinutes: number;
  notes?: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  exercises: WorkoutExerciseItem[];
  sets: number;
  completedSets: number;
  equipmentUsed: string[];
  aiCoachNotes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface CoachChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
  modifiedExerciseName?: string;
  actionTaken?: 'replaced' | 'adjusted_volume' | 'adjusted_intensity' | 'advice';
}

/**
 * Ensures an exercise has an active setList array, creating default sets from sets/reps/weight if missing.
 */
export function ensureExerciseSets(exercise: WorkoutExerciseItem): ExerciseSetItem[] {
  if (exercise.setList && exercise.setList.length > 0) {
    return exercise.setList;
  }
  const total = Math.max(1, exercise.sets || 3);
  const cleanWeight = exercise.weight || '20 kg';
  const cleanReps = exercise.reps || '10';
  const sets: ExerciseSetItem[] = [];

  for (let i = 1; i <= total; i++) {
    sets.push({
      id: `${exercise.id}_set_${i}`,
      setNumber: i,
      type: 'normal',
      weight: cleanWeight,
      reps: cleanReps,
      completed: i <= (exercise.completedSets || 0),
      previous: `${cleanWeight} × ${cleanReps}`,
    });
  }
  return sets;
}

/**
 * Calculate total volume lifted in kg from a workout session (like Hevy).
 */
export function calculateWorkoutVolumeKg(workout: WorkoutSessionItem): number {
  let totalVolume = 0;
  for (const ex of workout.exercises) {
    const sets = ensureExerciseSets(ex);
    for (const set of sets) {
      if (set.completed) {
        // Extract numeric weight
        const weightMatch = String(set.weight).match(/(\d+(\.\d+)?)/);
        const weightNum = weightMatch ? parseFloat(weightMatch[1]) : 0;
        // Extract numeric reps (take first number if range like 8-10)
        const repsMatch = String(set.reps).match(/(\d+)/);
        const repsNum = repsMatch ? parseInt(repsMatch[1], 10) : 10;
        totalVolume += weightNum * repsNum;
      }
    }
  }
  return Math.round(totalVolume);
}
