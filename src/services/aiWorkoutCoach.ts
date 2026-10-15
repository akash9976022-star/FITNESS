import type { WorkoutExerciseItem, WorkoutSessionItem } from '../types/workout';
import type { ExperienceLevel } from '../types/auth';

export interface ExerciseDefinition {
  id: string;
  name: string;
  targetMuscle: string;
  category: 'Push' | 'Pull' | 'Legs' | 'Core' | 'Cardio';
  equipmentRequired: string[];
  equipmentLabel: string;
  defaultSets: number;
  defaultReps: string;
  suggestedWeightMultiplier: number; // multiplied by bodyweight (kg) or baseline
  isBodyweight: boolean;
  jointFriendlyTags: string[]; // e.g. 'shoulder_friendly', 'low_back_friendly', 'knee_friendly'
  formCue: string;
}

// =========================================================================
// MASTER EXERCISE KNOWLEDGE BASE
// =========================================================================
export const EXERCISE_DATABASE: ExerciseDefinition[] = [
  // ---------------- CHEST & HORIZONTAL PUSH ----------------
  {
    id: 'barbell_bench_press',
    name: 'Barbell Flat Bench Press',
    targetMuscle: 'Mid-Pectorals & Triceps',
    category: 'Push',
    equipmentRequired: ['barbell', 'flat_bench'],
    equipmentLabel: 'Barbell & Bench',
    defaultSets: 3,
    defaultReps: '6-8',
    suggestedWeightMultiplier: 0.85,
    isBodyweight: false,
    jointFriendlyTags: ['heavy_compound'],
    formCue: 'Retract scapulae, slight arch in thoracic spine, lower to mid-sternum.',
  },
  {
    id: 'incline_dumbbell_press',
    name: 'Incline Dumbbell Press',
    targetMuscle: 'Clavicular Head (Upper Chest) & Front Delts',
    category: 'Push',
    equipmentRequired: ['dumbbells', 'adjustable_bench'],
    equipmentLabel: 'Dumbbells & Incline Bench',
    defaultSets: 3,
    defaultReps: '8-10',
    suggestedWeightMultiplier: 0.32, // per dumbbell
    isBodyweight: false,
    jointFriendlyTags: ['shoulder_friendly', 'wrist_friendly'],
    formCue: 'Set bench to 30°, maintain 45° elbow flare, converge dumbbells at top.',
  },
  {
    id: 'flat_dumbbell_press',
    name: 'Flat Dumbbell Bench Press',
    targetMuscle: 'Pectoralis Major & Triceps',
    category: 'Push',
    equipmentRequired: ['dumbbells', 'flat_bench'],
    equipmentLabel: 'Dumbbells & Flat Bench',
    defaultSets: 3,
    defaultReps: '8-10',
    suggestedWeightMultiplier: 0.34,
    isBodyweight: false,
    jointFriendlyTags: ['shoulder_friendly'],
    formCue: 'Natural converging arc, full stretch at the bottom without bounce.',
  },
  {
    id: 'chest_press_machine_ex',
    name: 'Selectorized Chest Press Machine',
    targetMuscle: 'Chest & Anterior Deltoids',
    category: 'Push',
    equipmentRequired: ['chest_press_machine'],
    equipmentLabel: 'Chest Press Machine',
    defaultSets: 3,
    defaultReps: '10-12',
    suggestedWeightMultiplier: 0.7,
    isBodyweight: false,
    jointFriendlyTags: ['shoulder_friendly', 'stabilizer_safe', 'low_back_friendly'],
    formCue: 'Align handles with mid-chest, drive smoothly, 2-second negative.',
  },
  {
    id: 'cable_crossover_flyes',
    name: 'Standing Cable Crossover Flyes',
    targetMuscle: 'Sternal Pectorals (Inner Chest)',
    category: 'Push',
    equipmentRequired: ['cable_crossover'],
    equipmentLabel: 'Dual Cable Pulleys',
    defaultSets: 3,
    defaultReps: '12-15',
    suggestedWeightMultiplier: 0.2, // per side
    isBodyweight: false,
    jointFriendlyTags: ['shoulder_friendly', 'rotator_safe'],
    formCue: 'Soft elbow bend, squeeze pec fibers hard at peak contraction.',
  },
  {
    id: 'parallel_bar_dips',
    name: 'Bodyweight Parallel Bar Dips',
    targetMuscle: 'Lower Chest & Triceps',
    category: 'Push',
    equipmentRequired: ['dip_station'],
    equipmentLabel: 'Dip Station',
    defaultSets: 3,
    defaultReps: '8-12',
    suggestedWeightMultiplier: 1.0,
    isBodyweight: true,
    jointFriendlyTags: [],
    formCue: 'Lean torso forward 15° for chest focus; lower until 90° elbow bend.',
  },
  {
    id: 'standard_pushups',
    name: 'Standard Calisthenic Push-ups',
    targetMuscle: 'Chest, Triceps & Core',
    category: 'Push',
    equipmentRequired: ['bodyweight_only'],
    equipmentLabel: 'Bodyweight',
    defaultSets: 3,
    defaultReps: '15-20',
    suggestedWeightMultiplier: 0.65,
    isBodyweight: true,
    jointFriendlyTags: ['shoulder_friendly', 'low_back_friendly', 'spine_safe'],
    formCue: 'Straight line from heels to head, lock core, full depth.',
  },
  {
    id: 'band_pushups',
    name: 'Resistance Band Resisted Push-ups',
    targetMuscle: 'Pectorals & Triceps Overload',
    category: 'Push',
    equipmentRequired: ['resistance_bands'],
    equipmentLabel: 'Resistance Bands',
    defaultSets: 3,
    defaultReps: '10-14',
    suggestedWeightMultiplier: 0.75,
    isBodyweight: true,
    jointFriendlyTags: ['shoulder_friendly'],
    formCue: 'Loop band across upper back, explode through lockout against elastic peak tension.',
  },

  // ---------------- SHOULDERS & VERTICAL PUSH ----------------
  {
    id: 'standing_barbell_ohp',
    name: 'Standing Overhead Barbell Press',
    targetMuscle: 'Anterior/Lateral Delts & Triceps',
    category: 'Push',
    equipmentRequired: ['barbell'],
    equipmentLabel: 'Barbell',
    defaultSets: 3,
    defaultReps: '6-8',
    suggestedWeightMultiplier: 0.6,
    isBodyweight: false,
    jointFriendlyTags: ['heavy_compound'],
    formCue: 'Squeeze glutes to protect spine, press vertically around face into lockout.',
  },
  {
    id: 'seated_dumbbell_shoulder_press',
    name: 'Seated Dumbbell Shoulder Press',
    targetMuscle: 'Anterior & Medial Deltoids',
    category: 'Push',
    equipmentRequired: ['dumbbells', 'adjustable_bench'],
    equipmentLabel: 'Dumbbells & Bench',
    defaultSets: 3,
    defaultReps: '8-10',
    suggestedWeightMultiplier: 0.25,
    isBodyweight: false,
    jointFriendlyTags: ['shoulder_friendly', 'rotator_safe'],
    formCue: 'Keep elbows slightly in front of shoulders (scapular plane), press without clinking.',
  },
  {
    id: 'machine_shoulder_press',
    name: 'Selectorized Shoulder Press Machine',
    targetMuscle: 'Deltoid Trio & Triceps',
    category: 'Push',
    equipmentRequired: ['shoulder_press_machine'],
    equipmentLabel: 'Shoulder Press Machine',
    defaultSets: 3,
    defaultReps: '10-12',
    suggestedWeightMultiplier: 0.55,
    isBodyweight: false,
    jointFriendlyTags: ['shoulder_friendly', 'stabilizer_safe'],
    formCue: 'Neutral grip handle reduces subacromial shoulder friction.',
  },
  {
    id: 'dumbbell_lateral_raises',
    name: 'Neutral-Grip Dumbbell Lateral Raises',
    targetMuscle: 'Lateral Deltoids (Cap Width)',
    category: 'Push',
    equipmentRequired: ['dumbbells'],
    equipmentLabel: 'Dumbbells',
    defaultSets: 3,
    defaultReps: '12-15',
    suggestedWeightMultiplier: 0.12,
    isBodyweight: false,
    jointFriendlyTags: ['shoulder_friendly', 'low_back_friendly', 'rotator_safe'],
    formCue: 'Lead with elbows, slight forward torso tilt, raise to shoulder height.',
  },
  {
    id: 'cable_lateral_raise',
    name: 'Single-Arm Cable Lateral Raise',
    targetMuscle: 'Lateral Deltoid (Constant Tension)',
    category: 'Push',
    equipmentRequired: ['cable_crossover'],
    equipmentLabel: 'Cable Pulley',
    defaultSets: 3,
    defaultReps: '12-15',
    suggestedWeightMultiplier: 0.1,
    isBodyweight: false,
    jointFriendlyTags: ['shoulder_friendly', 'rotator_safe'],
    formCue: 'Set pulley to wrist height, pull across body for constant resistance.',
  },
  {
    id: 'pike_pushups',
    name: 'Elevated Pike Push-ups',
    targetMuscle: 'Deltoids & Upper Traps',
    category: 'Push',
    equipmentRequired: ['bodyweight_only'],
    equipmentLabel: 'Bodyweight',
    defaultSets: 3,
    defaultReps: '10-12',
    suggestedWeightMultiplier: 0.6,
    isBodyweight: true,
    jointFriendlyTags: ['low_back_friendly'],
    formCue: 'Hips high in V-shape, lower crown of head in front of hands.',
  },

  // ---------------- BACK & VERTICAL PULL ----------------
  {
    id: 'lat_pulldown_ex',
    name: 'Wide-Grip Lat Pulldown',
    targetMuscle: 'Latissimus Dorsi & Teres Major',
    category: 'Pull',
    equipmentRequired: ['lat_pulldown'],
    equipmentLabel: 'Lat Pulldown Station',
    defaultSets: 3,
    defaultReps: '8-10',
    suggestedWeightMultiplier: 0.75,
    isBodyweight: false,
    jointFriendlyTags: ['low_back_friendly', 'shoulder_friendly'],
    formCue: 'Drive elbows down and into back pockets, slight torso lean.',
  },
  {
    id: 'pullups_bodyweight',
    name: 'Neutral-Grip Bodyweight Pull-ups',
    targetMuscle: 'Lats, Rhomboids & Brachialis',
    category: 'Pull',
    equipmentRequired: ['pull_up_bar'],
    equipmentLabel: 'Pull-up Bar',
    defaultSets: 3,
    defaultReps: '6-10',
    suggestedWeightMultiplier: 1.0,
    isBodyweight: true,
    jointFriendlyTags: ['shoulder_friendly'],
    formCue: 'Depress shoulders before initiating pull, chin clear over bar.',
  },
  {
    id: 'band_assisted_pullups',
    name: 'Band-Assisted Pull-ups',
    targetMuscle: 'Lats & Upper Back',
    category: 'Pull',
    equipmentRequired: ['pull_up_bar', 'resistance_bands'],
    equipmentLabel: 'Pull-up Bar & Band',
    defaultSets: 3,
    defaultReps: '8-12',
    suggestedWeightMultiplier: 0.7,
    isBodyweight: true,
    jointFriendlyTags: ['shoulder_friendly', 'rotator_safe'],
    formCue: 'Anchor band under foot, steady controlled cadence.',
  },

  // ---------------- BACK & HORIZONTAL PULL ----------------
  {
    id: 'barbell_bent_over_row',
    name: 'Barbell Bent-Over Row',
    targetMuscle: 'Mid-Back, Rhomboids & Lats',
    category: 'Pull',
    equipmentRequired: ['barbell'],
    equipmentLabel: 'Barbell',
    defaultSets: 3,
    defaultReps: '8-10',
    suggestedWeightMultiplier: 0.7,
    isBodyweight: false,
    jointFriendlyTags: [],
    formCue: 'Hinge at 45°, brace core, pull bar to belly button.',
  },
  {
    id: 'seated_cable_row_ex',
    name: 'Seated Cable Row (Close-Grip V-Bar)',
    targetMuscle: 'Rhomboids, Mid-Traps & Lats',
    category: 'Pull',
    equipmentRequired: ['seated_cable_row'],
    equipmentLabel: 'Seated Cable Row',
    defaultSets: 3,
    defaultReps: '10-12',
    suggestedWeightMultiplier: 0.75,
    isBodyweight: false,
    jointFriendlyTags: ['low_back_friendly', 'shoulder_friendly'],
    formCue: 'Chest up, avoid excessive swaying, pull to navel with full back pinch.',
  },
  {
    id: 'one_arm_dumbbell_row',
    name: 'One-Arm Supported Dumbbell Row',
    targetMuscle: 'Lat Thickness & Spinal Erectors',
    category: 'Pull',
    equipmentRequired: ['dumbbells', 'flat_bench'],
    equipmentLabel: 'Dumbbell & Bench',
    defaultSets: 3,
    defaultReps: '8-10',
    suggestedWeightMultiplier: 0.35,
    isBodyweight: false,
    jointFriendlyTags: ['low_back_friendly', 'shoulder_friendly'],
    formCue: 'Hand and knee anchored on bench, row dumbbell in arc towards hip pocket.',
  },
  {
    id: 'chest_supported_incline_row',
    name: 'Chest-Supported Incline Dumbbell Row',
    targetMuscle: 'Upper & Mid Back (Zero Lumbar Strain)',
    category: 'Pull',
    equipmentRequired: ['dumbbells', 'adjustable_bench'],
    equipmentLabel: 'Dumbbells & Incline Bench',
    defaultSets: 3,
    defaultReps: '10-12',
    suggestedWeightMultiplier: 0.28,
    isBodyweight: false,
    jointFriendlyTags: ['low_back_friendly', 'spine_safe', 'shoulder_friendly'],
    formCue: 'Face down on 30° bench, zero lower back shear, pure upper back contraction.',
  },
  {
    id: 'band_seated_rows',
    name: 'Resistance Band Seated Row',
    targetMuscle: 'Upper Back & Lats',
    category: 'Pull',
    equipmentRequired: ['resistance_bands'],
    equipmentLabel: 'Resistance Bands',
    defaultSets: 3,
    defaultReps: '12-16',
    suggestedWeightMultiplier: 0.4,
    isBodyweight: false,
    jointFriendlyTags: ['low_back_friendly', 'shoulder_friendly'],
    formCue: 'Wrap band around feet, pull handles into ribs with 2-second isometric hold.',
  },

  // ---------------- LEGS & LOWER BODY (QUADS) ----------------
  {
    id: 'barbell_back_squat',
    name: 'Barbell High-Bar Back Squat',
    targetMuscle: 'Quadriceps, Glutes & Core',
    category: 'Legs',
    equipmentRequired: ['barbell'],
    equipmentLabel: 'Barbell Squat Rack',
    defaultSets: 3,
    defaultReps: '6-8',
    suggestedWeightMultiplier: 1.1,
    isBodyweight: false,
    jointFriendlyTags: ['heavy_compound'],
    formCue: 'Chest up, break at hips and knees simultaneously, descend to parallel.',
  },
  {
    id: 'leg_press_45',
    name: '45-Degree Sled Leg Press',
    targetMuscle: 'Quadriceps & Glute Max',
    category: 'Legs',
    equipmentRequired: ['leg_press'],
    equipmentLabel: 'Leg Press Machine',
    defaultSets: 3,
    defaultReps: '10-12',
    suggestedWeightMultiplier: 1.6,
    isBodyweight: false,
    jointFriendlyTags: ['low_back_friendly', 'spine_safe'],
    formCue: 'Feet hip-width on sled, lower smoothly without lifting lower back off pad.',
  },
  {
    id: 'hack_squat_ex',
    name: 'Machine Hack Squat',
    targetMuscle: 'Vastus Medialis & Deep Knee Flexion',
    category: 'Legs',
    equipmentRequired: ['hack_squat'],
    equipmentLabel: 'Hack Squat Machine',
    defaultSets: 3,
    defaultReps: '8-10',
    suggestedWeightMultiplier: 1.2,
    isBodyweight: false,
    jointFriendlyTags: ['spine_safe'],
    formCue: 'Keep back flush against pad, descend slowly to 90° knee angle.',
  },
  {
    id: 'dumbbell_goblet_squat',
    name: 'Dumbbell Goblet Squat',
    targetMuscle: 'Quadriceps, Core & Hip Mobility',
    category: 'Legs',
    equipmentRequired: ['dumbbells'],
    equipmentLabel: 'Dumbbells',
    defaultSets: 3,
    defaultReps: '10-12',
    suggestedWeightMultiplier: 0.35,
    isBodyweight: false,
    jointFriendlyTags: ['low_back_friendly', 'knee_friendly', 'spine_safe'],
    formCue: 'Hold dumbbell vertically against sternum, elbows between knees at bottom.',
  },
  {
    id: 'bulgarian_split_squat',
    name: 'Rear-Foot Elevated Bulgarian Split Squats',
    targetMuscle: 'Unilateral Quads & Glute Medius',
    category: 'Legs',
    equipmentRequired: ['dumbbells', 'flat_bench'],
    equipmentLabel: 'Dumbbells & Bench',
    defaultSets: 3,
    defaultReps: '8-10/leg',
    suggestedWeightMultiplier: 0.22,
    isBodyweight: false,
    jointFriendlyTags: ['low_back_friendly', 'spine_safe'],
    formCue: 'Rear foot laces on bench, drop straight down until front thigh is parallel.',
  },
  {
    id: 'bodyweight_prisoner_squats',
    name: 'Bodyweight Prisoner Tempo Squats',
    targetMuscle: 'Quads & Hip Mobility',
    category: 'Legs',
    equipmentRequired: ['bodyweight_only'],
    equipmentLabel: 'Bodyweight',
    defaultSets: 3,
    defaultReps: '15-20',
    suggestedWeightMultiplier: 1.0,
    isBodyweight: true,
    jointFriendlyTags: ['low_back_friendly', 'knee_friendly', 'spine_safe'],
    formCue: 'Hands behind head, 3-second descent, explode up.',
  },
  {
    id: 'walking_lunges_bodyweight',
    name: 'Walking Bodyweight Lunges',
    targetMuscle: 'Quads, Glutes & Balance',
    category: 'Legs',
    equipmentRequired: ['bodyweight_only'],
    equipmentLabel: 'Bodyweight',
    defaultSets: 3,
    defaultReps: '12/leg',
    suggestedWeightMultiplier: 1.0,
    isBodyweight: true,
    jointFriendlyTags: ['low_back_friendly'],
    formCue: '90° angles on both knees, torso upright, step through smoothly.',
  },
  {
    id: 'leg_extension_ex',
    name: 'Isolated Leg Extension',
    targetMuscle: 'Rectus Femoris (Quad Peak)',
    category: 'Legs',
    equipmentRequired: ['leg_extension'],
    equipmentLabel: 'Leg Extension Machine',
    defaultSets: 3,
    defaultReps: '12-15',
    suggestedWeightMultiplier: 0.6,
    isBodyweight: false,
    jointFriendlyTags: ['low_back_friendly', 'spine_safe'],
    formCue: 'Lock hips against seat, pause 1 second at top extension.',
  },

  // ---------------- POSTERIOR CHAIN & HAMSTRINGS ----------------
  {
    id: 'barbell_rdl',
    name: 'Barbell Romanian Deadlift (RDL)',
    targetMuscle: 'Hamstrings, Glutes & Posterior Chain',
    category: 'Legs',
    equipmentRequired: ['barbell'],
    equipmentLabel: 'Barbell',
    defaultSets: 3,
    defaultReps: '8-10',
    suggestedWeightMultiplier: 0.9,
    isBodyweight: false,
    jointFriendlyTags: ['knee_friendly'],
    formCue: 'Soft knee bend, push hips directly back towards wall until deep hamstring stretch.',
  },
  {
    id: 'dumbbell_rdl',
    name: 'Dumbbell Romanian Deadlift (RDL)',
    targetMuscle: 'Hamstrings & Glute-Ham Tie-in',
    category: 'Legs',
    equipmentRequired: ['dumbbells'],
    equipmentLabel: 'Dumbbells',
    defaultSets: 3,
    defaultReps: '10-12',
    suggestedWeightMultiplier: 0.3,
    isBodyweight: false,
    jointFriendlyTags: ['knee_friendly', 'low_back_friendly'],
    formCue: 'Trace dumbbells down shins, flat spine, snap hips forward to finish.',
  },
  {
    id: 'hamstring_curl_ex',
    name: 'Seated or Lying Hamstring Curl',
    targetMuscle: 'Biceps Femoris & Knee Flexors',
    category: 'Legs',
    equipmentRequired: ['hamstring_curl'],
    equipmentLabel: 'Hamstring Curl Machine',
    defaultSets: 3,
    defaultReps: '10-12',
    suggestedWeightMultiplier: 0.55,
    isBodyweight: false,
    jointFriendlyTags: ['low_back_friendly', 'spine_safe'],
    formCue: 'Keep toes dorsiflexed, flex knees smoothly without hip lifting.',
  },
  {
    id: 'glute_bridges_mat',
    name: 'Single-Leg Elevated Glute Bridge',
    targetMuscle: 'Gluteus Maximus & Hamstrings',
    category: 'Legs',
    equipmentRequired: ['bodyweight_only'],
    equipmentLabel: 'Bodyweight / Mat',
    defaultSets: 3,
    defaultReps: '12-15/leg',
    suggestedWeightMultiplier: 1.0,
    isBodyweight: true,
    jointFriendlyTags: ['knee_friendly', 'low_back_friendly', 'spine_safe'],
    formCue: 'Drive through heel, tuck pelvis at peak contraction for maximum glute engagement.',
  },

  // ---------------- ARMS (BICEPS & TRICEPS) ----------------
  {
    id: 'incline_dumbbell_bicep_curl',
    name: 'Incline Dumbbell Bicep Curl',
    targetMuscle: 'Long Head Biceps (Peak Stretch)',
    category: 'Pull',
    equipmentRequired: ['dumbbells', 'adjustable_bench'],
    equipmentLabel: 'Dumbbells & Bench',
    defaultSets: 3,
    defaultReps: '10-12',
    suggestedWeightMultiplier: 0.16,
    isBodyweight: false,
    jointFriendlyTags: ['elbow_friendly'],
    formCue: 'Lean back at 45°, let arms hang plumb, supinate wrists at top.',
  },
  {
    id: 'standing_dumbbell_hammer_curl',
    name: 'Standing Neutral-Grip Hammer Curl',
    targetMuscle: 'Brachialis & Forearm Brachioradialis',
    category: 'Pull',
    equipmentRequired: ['dumbbells'],
    equipmentLabel: 'Dumbbells',
    defaultSets: 3,
    defaultReps: '10-12',
    suggestedWeightMultiplier: 0.18,
    isBodyweight: false,
    jointFriendlyTags: ['elbow_friendly', 'wrist_friendly'],
    formCue: 'Thumbs point upward throughout, zero swinging momentum.',
  },
  {
    id: 'ez_curl_bar_preacher',
    name: 'EZ-Curl Bar Bicep Curl',
    targetMuscle: 'Biceps Brachii',
    category: 'Pull',
    equipmentRequired: ['ez_curl_bar'],
    equipmentLabel: 'EZ-Curl Bar',
    defaultSets: 3,
    defaultReps: '8-10',
    suggestedWeightMultiplier: 0.35,
    isBodyweight: false,
    jointFriendlyTags: ['wrist_friendly'],
    formCue: 'Cambered grip spares wrists, squeeze peaks for 1 second.',
  },
  {
    id: 'cable_tricep_pushdown',
    name: 'Cable Rope Tricep Pushdown',
    targetMuscle: 'Lateral & Medial Tricep Heads',
    category: 'Push',
    equipmentRequired: ['cable_crossover'],
    equipmentLabel: 'Cable Pulley',
    defaultSets: 3,
    defaultReps: '12-15',
    suggestedWeightMultiplier: 0.3,
    isBodyweight: false,
    jointFriendlyTags: ['elbow_friendly'],
    formCue: 'Pin elbows to ribs, spread ropes outward at bottom lockout.',
  },
  {
    id: 'overhead_dumbbell_tricep_ext',
    name: 'Seated Two-Hand Dumbbell Overhead Extension',
    targetMuscle: 'Long Head Triceps',
    category: 'Push',
    equipmentRequired: ['dumbbells'],
    equipmentLabel: 'Dumbbells',
    defaultSets: 3,
    defaultReps: '10-12',
    suggestedWeightMultiplier: 0.25,
    isBodyweight: false,
    jointFriendlyTags: [],
    formCue: 'Lower weight behind neck with elbows pointing up, press upward to lock.',
  },
  {
    id: 'band_bicep_curls',
    name: 'Standing Resistance Band Curls',
    targetMuscle: 'Biceps Peak Contraction',
    category: 'Pull',
    equipmentRequired: ['resistance_bands'],
    equipmentLabel: 'Resistance Bands',
    defaultSets: 3,
    defaultReps: '15-20',
    suggestedWeightMultiplier: 0.25,
    isBodyweight: false,
    jointFriendlyTags: ['elbow_friendly', 'wrist_friendly'],
    formCue: 'Step on band, constant tension throughout entire range of motion.',
  },
  {
    id: 'close_grip_pushups_triceps',
    name: 'Diamond / Close-Grip Push-ups',
    targetMuscle: 'Triceps & Inner Chest',
    category: 'Push',
    equipmentRequired: ['bodyweight_only'],
    equipmentLabel: 'Bodyweight',
    defaultSets: 3,
    defaultReps: '12-15',
    suggestedWeightMultiplier: 0.65,
    isBodyweight: true,
    jointFriendlyTags: ['low_back_friendly'],
    formCue: 'Hands close under sternum, keep elbows tucked closely to ribs.',
  },

  // ---------------- CORE & METABOLIC ----------------
  {
    id: 'hanging_knee_raises',
    name: 'Hanging Knee / Leg Raises',
    targetMuscle: 'Rectus Abdominis & Hip Flexors',
    category: 'Core',
    equipmentRequired: ['pull_up_bar'],
    equipmentLabel: 'Pull-up Bar',
    defaultSets: 3,
    defaultReps: '12-15',
    suggestedWeightMultiplier: 1.0,
    isBodyweight: true,
    jointFriendlyTags: ['low_back_friendly', 'spine_safe'],
    formCue: 'Roll pelvis upward into ribs; do not simply swing legs.',
  },
  {
    id: 'rkc_plank_hold',
    name: 'High-Tension RKC Plank Hold',
    targetMuscle: 'Deep Transverse Abdominis & Core Stability',
    category: 'Core',
    equipmentRequired: ['bodyweight_only'],
    equipmentLabel: 'Mat / Floor',
    defaultSets: 3,
    defaultReps: '45-60s hold',
    suggestedWeightMultiplier: 1.0,
    isBodyweight: true,
    jointFriendlyTags: ['low_back_friendly', 'spine_safe', 'shoulder_friendly'],
    formCue: 'Clench glutes and pull elbows towards toes for active tension.',
  },
];

// =========================================================================
// STRICT EQUIPMENT FILTERING UTILITY
// =========================================================================
/**
 * Checks whether an exercise is executable given the user's available equipment.
 * Strict rules:
 * - Bodyweight exercises require only 'bodyweight_only' (always available).
 * - If user has 'adjustable_bench', it also satisfies 'flat_bench'.
 * - If user has 'cable_crossover', it satisfies cable pulleys.
 * - Every single item in `exercise.equipmentRequired` must be covered by userEquipment!
 */
export const isExerciseAvailable = (
  exercise: ExerciseDefinition,
  userEquipment: string[]
): boolean => {
  if (!userEquipment || userEquipment.length === 0) {
    // If equipment array is completely empty, default to bodyweight only
    return exercise.isBodyweight || exercise.equipmentRequired.includes('bodyweight_only');
  }

  // If user only selected bodyweight
  const isOnlyBodyweight =
    userEquipment.length === 1 && userEquipment[0] === 'bodyweight_only';
  if (isOnlyBodyweight) {
    return exercise.isBodyweight || exercise.equipmentRequired.includes('bodyweight_only');
  }

  // Normalize user equipment set for flexible substitutions
  const availableSet = new Set(userEquipment);
  // An adjustable bench can do everything a flat bench can do
  if (availableSet.has('adjustable_bench')) {
    availableSet.add('flat_bench');
  }
  // Dual cable crossover satisfies generic cable pulleys
  if (availableSet.has('cable_crossover')) {
    availableSet.add('seated_cable_row');
  }

  // Pure bodyweight exercises are always available unless user explicitly filtered them
  if (exercise.equipmentRequired.length === 1 && exercise.equipmentRequired[0] === 'bodyweight_only') {
    return true;
  }

  // All required pieces must be present in availableSet
  return exercise.equipmentRequired.every((eq) => availableSet.has(eq));
};

// =========================================================================
// ROUTINE GENERATOR (EQUIPMENT-AWARE)
// =========================================================================
export const generateMaintenanceRoutine = (
  routineType: 'Upper' | 'Lower' | 'Full Body' | 'Conditioning',
  userEquipment: string[],
  experienceLevel: ExperienceLevel = 'intermediate',
  weightKg: number = 75
): WorkoutSessionItem => {
  const availableExercises = EXERCISE_DATABASE.filter((ex) =>
    isExerciseAvailable(ex, userEquipment)
  );

  // Fallback if user's selected equipment has very few matches
  const fallbackList = availableExercises.length >= 4
    ? availableExercises
    : EXERCISE_DATABASE.filter((ex) => ex.isBodyweight || isExerciseAvailable(ex, userEquipment));

  const selectedDefs: ExerciseDefinition[] = [];

  if (routineType === 'Upper') {
    // Need: 1-2 Horizontal Push, 1 Vertical/Horizontal Pull, 1 Shoulder, 1 Arms
    const pushChest = fallbackList.find((e) => e.category === 'Push' && e.targetMuscle.toLowerCase().includes('chest'))
      || fallbackList.find((e) => e.category === 'Push');
    if (pushChest) selectedDefs.push(pushChest);

    const pullBack = fallbackList.find((e) => e.category === 'Pull' && (e.targetMuscle.toLowerCase().includes('lat') || e.targetMuscle.toLowerCase().includes('back')) && !selectedDefs.includes(e))
      || fallbackList.find((e) => e.category === 'Pull' && !selectedDefs.includes(e));
    if (pullBack) selectedDefs.push(pullBack);

    const shoulder = fallbackList.find((e) => (e.targetMuscle.toLowerCase().includes('delt') || e.targetMuscle.toLowerCase().includes('shoulder')) && !selectedDefs.includes(e))
      || fallbackList.find((e) => e.category === 'Push' && !selectedDefs.includes(e));
    if (shoulder) selectedDefs.push(shoulder);

    const arm = fallbackList.find((e) => (e.targetMuscle.toLowerCase().includes('bicep') || e.targetMuscle.toLowerCase().includes('tricep')) && !selectedDefs.includes(e))
      || fallbackList.find((e) => !selectedDefs.includes(e));
    if (arm) selectedDefs.push(arm);

    const core = fallbackList.find((e) => e.category === 'Core' && !selectedDefs.includes(e))
      || fallbackList.find((e) => !selectedDefs.includes(e));
    if (core) selectedDefs.push(core);
  } else if (routineType === 'Lower') {
    // Need: 1-2 Quad compound, 1 Posterior Chain/Hamstring, 1 Unilateral, 1 Calves/Core
    const quad = fallbackList.find((e) => e.category === 'Legs' && (e.targetMuscle.toLowerCase().includes('quad') || e.name.toLowerCase().includes('squat') || e.name.toLowerCase().includes('press')))
      || fallbackList.find((e) => e.category === 'Legs');
    if (quad) selectedDefs.push(quad);

    const ham = fallbackList.find((e) => e.category === 'Legs' && (e.targetMuscle.toLowerCase().includes('hamstring') || e.name.toLowerCase().includes('rdl') || e.name.toLowerCase().includes('curl')) && !selectedDefs.includes(e))
      || fallbackList.find((e) => e.category === 'Legs' && !selectedDefs.includes(e));
    if (ham) selectedDefs.push(ham);

    const unilateral = fallbackList.find((e) => e.category === 'Legs' && (e.name.toLowerCase().includes('split') || e.name.toLowerCase().includes('lunge') || e.name.toLowerCase().includes('goblet')) && !selectedDefs.includes(e))
      || fallbackList.find((e) => e.category === 'Legs' && !selectedDefs.includes(e));
    if (unilateral) selectedDefs.push(unilateral);

    const accessory = fallbackList.find((e) => e.category === 'Legs' && !selectedDefs.includes(e))
      || fallbackList.find((e) => e.category === 'Core' && !selectedDefs.includes(e));
    if (accessory) selectedDefs.push(accessory);

    const core = fallbackList.find((e) => e.category === 'Core' && !selectedDefs.includes(e))
      || fallbackList.find((e) => !selectedDefs.includes(e));
    if (core) selectedDefs.push(core);
  } else {
    // Full Body or Conditioning
    const push = fallbackList.find((e) => e.category === 'Push');
    const pull = fallbackList.find((e) => e.category === 'Pull' && !selectedDefs.includes(e));
    const legs = fallbackList.find((e) => e.category === 'Legs' && !selectedDefs.includes(e));
    const core = fallbackList.find((e) => e.category === 'Core' && !selectedDefs.includes(e));
    const arm = fallbackList.find((e) => (e.targetMuscle.toLowerCase().includes('bicep') || e.targetMuscle.toLowerCase().includes('tricep')) && !selectedDefs.includes(e));

    if (push) selectedDefs.push(push);
    if (pull) selectedDefs.push(pull);
    if (legs) selectedDefs.push(legs);
    if (core) selectedDefs.push(core);
    if (arm) selectedDefs.push(arm);
  }

  // Deduplicate and ensure at least 4 exercises
  const uniqueDefs = Array.from(new Set(selectedDefs)).filter(Boolean);
  while (uniqueDefs.length < 4 && fallbackList.length > uniqueDefs.length) {
    const extra = fallbackList.find((e) => !uniqueDefs.includes(e));
    if (extra) uniqueDefs.push(extra);
    else break;
  }

  // Experience level volume adjustments
  const setsCount = experienceLevel === 'beginner' ? 2 : experienceLevel === 'pro' ? 4 : 3;

  // Convert definitions to interactive WorkoutExerciseItem
  const exercises: WorkoutExerciseItem[] = uniqueDefs.map((def, idx) => {
    // Calculate suggested weight in kg based on multiplier & bodyweight
    let weightText = 'Bodyweight';
    if (!def.isBodyweight && def.suggestedWeightMultiplier > 0) {
      const calculatedKg = Math.round(weightKg * def.suggestedWeightMultiplier);
      if (def.equipmentRequired.includes('dumbbells')) {
        weightText = `${Math.round(calculatedKg)} kg / hand`;
      } else {
        weightText = `${calculatedKg} kg`;
      }
    }

    return {
      id: `ex_${Date.now()}_${idx}`,
      name: def.name,
      targetMuscle: def.targetMuscle,
      category: def.category,
      equipmentRequired: def.equipmentRequired,
      equipmentLabel: def.equipmentLabel,
      sets: setsCount,
      reps: def.defaultReps,
      weight: weightText,
      completedSets: 0,
      completed: false,
      notes: def.formCue,
    };
  });

  const todayStr = new Date().toISOString().split('T')[0];

  return {
    id: `workout_${Date.now()}`,
    name: `${routineType} Maintenance Protocol`,
    routineName: `${routineType} Equilibrium Training`,
    routine: routineType,
    durationMinutes: 45,
    notes: `Equilibrium-calibrated maintenance workout. Keep RPE strictly between 7-8 to preserve all lean muscle mass without inducing systemic central nervous system fatigue.`,
    date: todayStr,
    completed: false,
    exercises,
    sets: exercises.reduce((acc, curr) => acc + curr.sets, 0),
    completedSets: 0,
    equipmentUsed: userEquipment,
  };
};

// =========================================================================
// AI CHAT COACH MODIFICATION ENGINE
// =========================================================================
export interface AiCoachModificationResult {
  updatedWorkout: WorkoutSessionItem;
  coachMessage: string;
  modifiedExerciseName?: string;
  actionTaken: 'replaced' | 'adjusted_volume' | 'adjusted_intensity' | 'advice';
}

/**
 * Natural language processor for workout adjustments based on user prompt & equipment inventory.
 */
export const processAiCoachChat = (
  currentWorkout: WorkoutSessionItem,
  prompt: string,
  userEquipment: string[]
): AiCoachModificationResult => {
  const p = prompt.toLowerCase();
  const availableDefs = EXERCISE_DATABASE.filter((e) => isExerciseAvailable(e, userEquipment));

  // 1. SHOULDER TIGHTNESS / PAIN
  if (p.includes('shoulder') || p.includes('rotator') || p.includes('overhead')) {
    // Find an overhead or heavy shoulder press exercise in current workout
    const targetIdx = currentWorkout.exercises.findIndex(
      (e) =>
        e.name.toLowerCase().includes('overhead') ||
        e.name.toLowerCase().includes('press') ||
        e.targetMuscle.toLowerCase().includes('delt')
    );

    if (targetIdx !== -1) {
      const currentEx = currentWorkout.exercises[targetIdx];
      // Pick a shoulder-friendly replacement matching available equipment
      const replacementDef =
        availableDefs.find(
          (d) =>
            d.jointFriendlyTags.includes('shoulder_friendly') &&
            d.id !== currentEx.id &&
            !currentWorkout.exercises.some((e) => e.name === d.name)
        ) ||
        availableDefs.find(
          (d) =>
            d.category === 'Push' &&
            d.id !== currentEx.id &&
            !currentWorkout.exercises.some((e) => e.name === d.name)
        );

      if (replacementDef) {
        const updatedEx: WorkoutExerciseItem = {
          ...currentEx,
          name: replacementDef.name,
          targetMuscle: replacementDef.targetMuscle,
          equipmentRequired: replacementDef.equipmentRequired,
          equipmentLabel: replacementDef.equipmentLabel,
          reps: replacementDef.defaultReps,
          notes: `AI Replaced: Shoulder-relief substitute. ${replacementDef.formCue}`,
          replacedReason: 'Shoulder Impingement Relief',
        };

        const updatedExercises = [...currentWorkout.exercises];
        updatedExercises[targetIdx] = updatedEx;

        return {
          updatedWorkout: {
            ...currentWorkout,
            exercises: updatedExercises,
            updatedAt: new Date(),
          },
          coachMessage: `I've replaced **${currentEx.name}** with **${replacementDef.name}**! This modification utilizes your ${replacementDef.equipmentLabel} while keeping your humerus within the scapular plane, eliminating acromial pinch without sacrificing deltoid stimulus.`,
          modifiedExerciseName: replacementDef.name,
          actionTaken: 'replaced',
        };
      }
    }
  }

  // 2. LOWER BACK FATIGUE / SORENESS
  if (p.includes('back') || p.includes('spine') || p.includes('lumbar')) {
    // Find an axial-loaded exercise (Squat, Deadlift, Bent Row)
    const targetIdx = currentWorkout.exercises.findIndex(
      (e) =>
        e.name.toLowerCase().includes('squat') ||
        e.name.toLowerCase().includes('deadlift') ||
        e.name.toLowerCase().includes('rdl') ||
        e.name.toLowerCase().includes('bent-over')
    );

    if (targetIdx !== -1) {
      const currentEx = currentWorkout.exercises[targetIdx];
      const replacementDef =
        availableDefs.find(
          (d) =>
            d.jointFriendlyTags.includes('low_back_friendly') &&
            d.category === currentEx.category &&
            !currentWorkout.exercises.some((e) => e.name === d.name)
        ) ||
        availableDefs.find(
          (d) =>
            d.jointFriendlyTags.includes('low_back_friendly') &&
            !currentWorkout.exercises.some((e) => e.name === d.name)
        );

      if (replacementDef) {
        const updatedEx: WorkoutExerciseItem = {
          ...currentEx,
          name: replacementDef.name,
          targetMuscle: replacementDef.targetMuscle,
          equipmentRequired: replacementDef.equipmentRequired,
          equipmentLabel: replacementDef.equipmentLabel,
          reps: replacementDef.defaultReps,
          notes: `AI Replaced: Lumbar spine unloaded. ${replacementDef.formCue}`,
          replacedReason: 'Lower Back / Spine Deload',
        };

        const updatedExercises = [...currentWorkout.exercises];
        updatedExercises[targetIdx] = updatedEx;

        return {
          updatedWorkout: {
            ...currentWorkout,
            exercises: updatedExercises,
            updatedAt: new Date(),
          },
          coachMessage: `Protected your lumbar spine! Swapped **${currentEx.name}** for **${replacementDef.name}**. This eliminates spinal compression shear forces while maintaining high mechanical tension in your ${replacementDef.targetMuscle}.`,
          modifiedExerciseName: replacementDef.name,
          actionTaken: 'replaced',
        };
      }
    }
  }

  // 3. KNEE PAIN / DISCOMFORT
  if (p.includes('knee') || p.includes('patella')) {
    const targetIdx = currentWorkout.exercises.findIndex(
      (e) =>
        e.name.toLowerCase().includes('squat') ||
        e.name.toLowerCase().includes('extension') ||
        e.name.toLowerCase().includes('lunge')
    );

    if (targetIdx !== -1) {
      const currentEx = currentWorkout.exercises[targetIdx];
      const replacementDef = availableDefs.find(
        (d) =>
          d.jointFriendlyTags.includes('knee_friendly') &&
          !currentWorkout.exercises.some((e) => e.name === d.name)
      );

      if (replacementDef) {
        const updatedEx: WorkoutExerciseItem = {
          ...currentEx,
          name: replacementDef.name,
          targetMuscle: replacementDef.targetMuscle,
          equipmentRequired: replacementDef.equipmentRequired,
          equipmentLabel: replacementDef.equipmentLabel,
          reps: replacementDef.defaultReps,
          notes: `AI Replaced: Patellar tendon friendly. ${replacementDef.formCue}`,
          replacedReason: 'Knee Joint Relief',
        };

        const updatedExercises = [...currentWorkout.exercises];
        updatedExercises[targetIdx] = updatedEx;

        return {
          updatedWorkout: {
            ...currentWorkout,
            exercises: updatedExercises,
            updatedAt: new Date(),
          },
          coachMessage: `Understood! I've swapped **${currentEx.name}** for **${replacementDef.name}**. This shifts recruitment to the posterior chain/hip hinge to give your patellar tendons complete recovery while maintaining maintenance volume.`,
          modifiedExerciseName: replacementDef.name,
          actionTaken: 'replaced',
        };
      }
    }
  }

  // 4. SPECIFIC EXERCISE SWAP (e.g., "replace X with Y" or "swap X")
  const targetExerciseToSwap = currentWorkout.exercises.find((ex) =>
    p.includes(ex.name.toLowerCase().split(' ')[0]) ||
    p.includes(ex.name.toLowerCase().split(' ')[1] || '---')
  );

  if (targetExerciseToSwap) {
    const targetIdx = currentWorkout.exercises.indexOf(targetExerciseToSwap);
    // Find alternative in same category
    const replacementDef =
      availableDefs.find(
        (d) =>
          d.category === targetExerciseToSwap.category &&
          d.name !== targetExerciseToSwap.name &&
          !currentWorkout.exercises.some((e) => e.name === d.name)
      ) ||
      availableDefs.find(
        (d) =>
          d.name !== targetExerciseToSwap.name &&
          !currentWorkout.exercises.some((e) => e.name === d.name)
      );

    if (replacementDef) {
      const updatedEx: WorkoutExerciseItem = {
        ...targetExerciseToSwap,
        name: replacementDef.name,
        targetMuscle: replacementDef.targetMuscle,
        equipmentRequired: replacementDef.equipmentRequired,
        equipmentLabel: replacementDef.equipmentLabel,
        reps: replacementDef.defaultReps,
        notes: `AI Custom Swap: ${replacementDef.formCue}`,
        replacedReason: 'Athlete Preference Request',
      };

      const updatedExercises = [...currentWorkout.exercises];
      updatedExercises[targetIdx] = updatedEx;

      return {
        updatedWorkout: {
          ...currentWorkout,
          exercises: updatedExercises,
          updatedAt: new Date(),
        },
        coachMessage: `Successfully updated your checklist! Replaced **${targetExerciseToSwap.name}** with **${replacementDef.name}** using your ${replacementDef.equipmentLabel}.`,
        modifiedExerciseName: replacementDef.name,
        actionTaken: 'replaced',
      };
    }
  }

  // 5. TIME SHORTAGE (e.g. "only 20 minutes", "short on time", "quicker workout")
  if (p.includes('time') || p.includes('minute') || p.includes('quick') || p.includes('short') || p.includes('rush')) {
    const condensedExercises = currentWorkout.exercises.slice(0, 3).map((ex) => ({
      ...ex,
      sets: 2,
      notes: `${ex.notes || ''} [Time Saver: Superset pairing, 60s rest]`,
    }));

    return {
      updatedWorkout: {
        ...currentWorkout,
        exercises: condensedExercises,
        durationMinutes: 20,
        sets: condensedExercises.reduce((a, b) => a + b.sets, 0),
        notes: 'High-density 20-minute maintenance protocol with 2 high-intensity working sets per movement.',
        updatedAt: new Date(),
      },
      coachMessage: `Condensation applied! Trimmed the session to 3 core compound anchors with 2 working sets each (20 minutes total). This delivers ~80% of total hypertrophic stimulus in half the time!`,
      actionTaken: 'adjusted_volume',
    };
  }

  // 6. DEFAULT / FALLBACK SMART COACHING ADVICE
  // If user asked something general or wanted to modify the first exercise
  const firstEx = currentWorkout.exercises[0];
  const altDef = availableDefs.find(
    (d) =>
      d.category === firstEx.category &&
      d.name !== firstEx.name &&
      !currentWorkout.exercises.some((e) => e.name === d.name)
  );

  if (altDef) {
    const updatedEx: WorkoutExerciseItem = {
      ...firstEx,
      name: altDef.name,
      targetMuscle: altDef.targetMuscle,
      equipmentRequired: altDef.equipmentRequired,
      equipmentLabel: altDef.equipmentLabel,
      reps: altDef.defaultReps,
      notes: `AI Optimized: ${altDef.formCue}`,
      replacedReason: 'AI Coach Calibration',
    };

    const updatedExercises = [...currentWorkout.exercises];
    updatedExercises[0] = updatedEx;

    return {
      updatedWorkout: {
        ...currentWorkout,
        exercises: updatedExercises,
        updatedAt: new Date(),
      },
      coachMessage: `Coach Note: Calibrated **${firstEx.name}** to **${altDef.name}** based on your feedback. All exercises remain strictly matched to your active gear (${altDef.equipmentLabel}). Log your sets when ready!`,
      modifiedExerciseName: altDef.name,
      actionTaken: 'replaced',
    };
  }

  return {
    updatedWorkout: currentWorkout,
    coachMessage: `Your current maintenance protocol is already calibrated to your active equipment profile (${userEquipment.join(', ').replace(/_/g, ' ') || 'Commercial Gym'}). Target 2-3 reps in reserve (RIR) on all working sets for equilibrium preservation!`,
    actionTaken: 'advice',
  };
};
