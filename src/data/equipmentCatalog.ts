export interface EquipmentItem {
  id: string;
  name: string;
  category: 'Cables & Pulleys' | 'Machines' | 'Free Weights & Benches' | 'Bodyweight / Minimal';
  description: string;
  badge: string;
}

export interface EquipmentCategoryGroup {
  category: 'Cables & Pulleys' | 'Machines' | 'Free Weights & Benches' | 'Bodyweight / Minimal';
  description: string;
  items: EquipmentItem[];
}

export const EQUIPMENT_CATALOG: EquipmentCategoryGroup[] = [
  {
    category: 'Cables & Pulleys',
    description: 'Constant tension resistance and multi-angle hypertrophy lines.',
    items: [
      {
        id: 'lat_pulldown',
        name: 'Lat Pulldown',
        category: 'Cables & Pulleys',
        description: 'Overhead vertical pull station with wide/close grips.',
        badge: 'Back & Lats',
      },
      {
        id: 'cable_crossover',
        name: 'Cable Crossover / Dual Adjustable Pulley',
        category: 'Cables & Pulleys',
        description: 'Dual adjustable towers for flyes, lateral raises & triceps.',
        badge: 'Chest & Arms',
      },
      {
        id: 'seated_cable_row',
        name: 'Seated Cable Row',
        category: 'Cables & Pulleys',
        description: 'Horizontal cable pull station with footplates for back thickness.',
        badge: 'Mid-Back',
      },
      {
        id: 'low_row',
        name: 'Low Row',
        category: 'Cables & Pulleys',
        description: 'Low pulley station for single/double arm upward rows.',
        badge: 'Upper Back',
      },
    ],
  },
  {
    category: 'Machines',
    description: 'Fixed path selectorized & plate-loaded compound movements.',
    items: [
      {
        id: 'leg_press',
        name: 'Leg Press',
        category: 'Machines',
        description: '45-degree sled or horizontal leg press for quad/glute volume.',
        badge: 'Quads & Glutes',
      },
      {
        id: 'leg_extension',
        name: 'Leg Extension',
        category: 'Machines',
        description: 'Isolated knee extension machine for rectus femoris definition.',
        badge: 'Quads',
      },
      {
        id: 'hamstring_curl',
        name: 'Hamstring Curl (Seated or Lying)',
        category: 'Machines',
        description: 'Direct knee flexion machine for posterior chain balance.',
        badge: 'Hamstrings',
      },
      {
        id: 'chest_press_machine',
        name: 'Chest Press Machine',
        category: 'Machines',
        description: 'Guided horizontal press machine for safe chest overload.',
        badge: 'Pectorals',
      },
      {
        id: 'shoulder_press_machine',
        name: 'Shoulder Press Machine',
        category: 'Machines',
        description: 'Guided vertical overhead pressing station.',
        badge: 'Deltoids',
      },
      {
        id: 'smith_machine',
        name: 'Smith Machine',
        category: 'Machines',
        description: 'Track-guided barbell with safety lockout pins.',
        badge: 'Full Body',
      },
      {
        id: 'hack_squat',
        name: 'Hack Squat',
        category: 'Machines',
        description: 'Angled inverted squat machine targeting deep knee flexion.',
        badge: 'Quads Focus',
      },
    ],
  },
  {
    category: 'Free Weights & Benches',
    description: 'The foundation for stabilizer recruitment and heavy mechanical tension.',
    items: [
      {
        id: 'barbell',
        name: 'Barbell & Weight Plates',
        category: 'Free Weights & Benches',
        description: 'Olympic 20kg bar with assorted plates for compound anchors.',
        badge: 'Core Compound',
      },
      {
        id: 'dumbbells',
        name: 'Dumbbells',
        category: 'Free Weights & Benches',
        description: 'Adjustable or pairs from light warmups to heavy sets.',
        badge: 'Unilateral',
      },
      {
        id: 'adjustable_bench',
        name: 'Adjustable Bench',
        category: 'Free Weights & Benches',
        description: 'Incline, flat, and decline multi-position utility bench.',
        badge: 'Multi-Angle',
      },
      {
        id: 'flat_bench',
        name: 'Flat Bench',
        category: 'Free Weights & Benches',
        description: 'Solid competition flat pressing station.',
        badge: 'Bench Press',
      },
      {
        id: 'pull_up_bar',
        name: 'Pull-up Bar',
        category: 'Free Weights & Benches',
        description: 'Overhead bar for wide, neutral, and supinated pull-ups.',
        badge: 'Bodyweight Plus',
      },
      {
        id: 'dip_station',
        name: 'Dip Station',
        category: 'Free Weights & Benches',
        description: 'Parallel bars for triceps and lower chest dips.',
        badge: 'Triceps/Chest',
      },
      {
        id: 'ez_curl_bar',
        name: 'EZ-Curl Bar',
        category: 'Free Weights & Benches',
        description: 'Cambered barbell engineered for ergonomic wrist angles.',
        badge: 'Arms',
      },
    ],
  },
  {
    category: 'Bodyweight / Minimal',
    description: 'Accessible mobility and calisthenics tools.',
    items: [
      {
        id: 'resistance_bands',
        name: 'Resistance Bands',
        category: 'Bodyweight / Minimal',
        description: 'Loop, tube, and pull-up assist bands for variable tension.',
        badge: 'Elastic Tension',
      },
      {
        id: 'yoga_mat',
        name: 'Yoga Mat',
        category: 'Bodyweight / Minimal',
        description: 'Padded floor mat for core training, stretching, and mobility.',
        badge: 'Floor & Core',
      },
      {
        id: 'bodyweight_only',
        name: 'None (Bodyweight only)',
        category: 'Bodyweight / Minimal',
        description: 'Pure zero-equipment calisthenics using gravity and floors.',
        badge: 'Pure Calisthenics',
      },
    ],
  },
];

export const ALL_EQUIPMENT_IDS: string[] = EQUIPMENT_CATALOG.flatMap((cat) => cat.items.map((i) => i.id));
