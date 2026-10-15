import type { TamilRasiId, TamilZodiacSign, RasipalanPrediction } from '../types/calendar';

export const TAMIL_ZODIAC_SIGNS: TamilZodiacSign[] = [
  {
    id: 'mesham',
    nameEn: 'Mesham',
    nameTa: 'மேஷம்',
    symbol: '♈',
    westernSign: 'Aries (Ram)',
    element: 'Fire',
    elementTa: 'நெருப்பு',
    rulingPlanet: 'Sevvai (Mars)',
    rulingPlanetTa: 'செவ்வாய்',
  },
  {
    id: 'rishabham',
    nameEn: 'Rishabham',
    nameTa: 'ரிஷபம்',
    symbol: '♉',
    westernSign: 'Taurus (Bull)',
    element: 'Earth',
    elementTa: 'நிலம்',
    rulingPlanet: 'Sukran (Venus)',
    rulingPlanetTa: 'சுக்கிரன்',
  },
  {
    id: 'mithunam',
    nameEn: 'Mithunam',
    nameTa: 'மிதுனம்',
    symbol: '♊',
    westernSign: 'Gemini (Twins)',
    element: 'Air',
    elementTa: 'காற்று',
    rulingPlanet: 'Budhan (Mercury)',
    rulingPlanetTa: 'புதன்',
  },
  {
    id: 'katagam',
    nameEn: 'Katagam',
    nameTa: 'கடகம்',
    symbol: '♋',
    westernSign: 'Cancer (Crab)',
    element: 'Water',
    elementTa: 'நீர்',
    rulingPlanet: 'Chandran (Moon)',
    rulingPlanetTa: 'சந்திரன்',
  },
  {
    id: 'simmam',
    nameEn: 'Simmam',
    nameTa: 'சிம்மம்',
    symbol: '♌',
    westernSign: 'Leo (Lion)',
    element: 'Fire',
    elementTa: 'நெருப்பு',
    rulingPlanet: 'Sooriyan (Sun)',
    rulingPlanetTa: 'சூரியன்',
  },
  {
    id: 'kanni',
    nameEn: 'Kanni',
    nameTa: 'கன்னி',
    symbol: '♍',
    westernSign: 'Virgo (Maiden)',
    element: 'Earth',
    elementTa: 'நிலம்',
    rulingPlanet: 'Budhan (Mercury)',
    rulingPlanetTa: 'புதன்',
  },
  {
    id: 'tula',
    nameEn: 'Tula',
    nameTa: 'துலாம்',
    symbol: '♎',
    westernSign: 'Libra (Scales)',
    element: 'Air',
    elementTa: 'காற்று',
    rulingPlanet: 'Sukran (Venus)',
    rulingPlanetTa: 'சுக்கிரன்',
  },
  {
    id: 'vrichigam',
    nameEn: 'Vrichigam',
    nameTa: 'விருச்சிகம்',
    symbol: '♏',
    westernSign: 'Scorpio (Scorpion)',
    element: 'Water',
    elementTa: 'நீர்',
    rulingPlanet: 'Sevvai (Mars)',
    rulingPlanetTa: 'செவ்வாய்',
  },
  {
    id: 'dhanusu',
    nameEn: 'Dhanusu',
    nameTa: 'தனுசு',
    symbol: '♐',
    westernSign: 'Sagittarius (Archer)',
    element: 'Fire',
    elementTa: 'நெருப்பு',
    rulingPlanet: 'Guru (Jupiter)',
    rulingPlanetTa: 'குரு',
  },
  {
    id: 'magaram',
    nameEn: 'Magaram',
    nameTa: 'மகரம்',
    symbol: '♑',
    westernSign: 'Capricorn (Sea-Goat)',
    element: 'Earth',
    elementTa: 'நிலம்',
    rulingPlanet: 'Sani (Saturn)',
    rulingPlanetTa: 'சனி',
  },
  {
    id: 'kumbham',
    nameEn: 'Kumbham',
    nameTa: 'கும்பம்',
    symbol: '♒',
    westernSign: 'Aquarius (Water-Bearer)',
    element: 'Air',
    elementTa: 'காற்று',
    rulingPlanet: 'Sani (Saturn)',
    rulingPlanetTa: 'சனி',
  },
  {
    id: 'meenam',
    nameEn: 'Meenam',
    nameTa: 'மீனம்',
    symbol: '♓',
    westernSign: 'Pisces (Fishes)',
    element: 'Water',
    elementTa: 'நீர்',
    rulingPlanet: 'Guru (Jupiter)',
    rulingPlanetTa: 'குரு',
  },
];

/**
 * Deterministic hash generator for stable daily predictions
 */
function hashDateAndRasi(dateStr: string, rasiId: string): number {
  let hash = 0;
  const combined = `${dateStr}-${rasiId}`;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Daily Rasipalan generator blending authentic Vedic planetary qualities
 * with targeted physical training and nutritional discipline.
 */
export function getDailyRasipalan(
  rasiId: TamilRasiId,
  inputDate: Date | string
): RasipalanPrediction {
  const d = typeof inputDate === 'string' ? new Date(inputDate + 'T00:00:00') : new Date(inputDate);
  const dateStr = d.toISOString().split('T')[0];
  const rasi = TAMIL_ZODIAC_SIGNS.find((r) => r.id === rasiId) || TAMIL_ZODIAC_SIGNS[0];

  const seed = hashDateAndRasi(dateStr, rasiId);
  const energyScore = 75 + (seed % 24); // 75% to 98%

  // Workout type rotation based on element and seed
  const workoutTypes: RasipalanPrediction['workoutRecommendation'][] = [
    'heavy_strength',
    'hypertrophy',
    'active_recovery',
    'hiit_cardio',
    'mobility_yoga',
  ];
  const workoutRecommendation = workoutTypes[(seed + rasi.element.length) % workoutTypes.length];

  // Colors & Directions
  const colors = ['Crimson Red', 'Royal Gold', 'Forest Emerald', 'Ocean Cobalt', 'Pearl White', 'Saffron Yellow'];
  const directions = ['East (கிழக்கு)', 'North-East (ஈசானியம்)', 'North (வடக்கு)', 'South-East (தென்கிழக்கு)', 'West (மேற்கு)'];

  const luckyColor = colors[seed % colors.length];
  const luckyDirection = directions[(seed >> 2) % directions.length];

  // Curated outlook templates based on Rasi Element
  let outlookEn = '';
  let outlookTa = '';
  let fitnessEn = '';
  let fitnessTa = '';
  let nutritionEn = '';
  let nutritionTa = '';

  if (rasi.element === 'Fire') {
    outlookEn = `The solar energy of ${rasi.rulingPlanet} sparks intense drive and determination today. Channel this internal fire into structured gym sets and personal goal setting.`;
    outlookTa = `${rasi.rulingPlanetTa} பகவானின் தாக்கம் உங்கள் மன உறுதியையும் உத்வேகத்தையும் உயர்த்தும் நாள். தடைகளை தகர்த்து உடற்பயிற்சியில் சாதனை புரிய உகந்தது.`;
    fitnessEn = 'Prime day for explosive compound movements (Squats, Bench Press, Power Cleans). Warm up rotator cuffs thoroughly.';
    fitnessTa = 'கனமான எடைகளை தூக்கும் பயிற்சிகளுக்கு (Compound lifts) சிறந்த ஆற்றல் உண்டு. மூட்டுகளை நன்கு சூடேற்றவும்.';
    nutritionEn = 'Hydrate vigorously with coconut water and electrolyte pinch. Ensure lean protein to repair active muscle fibers.';
    nutritionTa = 'இளநீர் மற்றும் எலுமிச்சை சாறு அருந்தி நீர்ச்சத்தை பேணுங்கள். புரதச்சத்து நிறைந்த உணவை உண்பது நலம்.';
  } else if (rasi.element === 'Earth') {
    outlookEn = `Grounded planetary stability grants exceptional physical stamina. A disciplined day to follow your maintenance workout plan to the letter.`;
    outlookTa = `பூமி தத்துவத்தின் நிலைத்தன்மை உடலுக்கு ஆழ்ந்த சகிப்புத்தன்மையை வழங்கும். திட்டமிட்ட உடற்பயிற்சி முறைகளை தவறாமல் பின்பற்றுங்கள்.`;
    fitnessEn = 'Excellent endurance for high-volume hypertrophy workouts and steady-state cardiovascular conditioning.';
    fitnessTa = 'அதிக செட்கள் கொண்ட தசை வலிமைப் பயிற்சிகளுக்கும் சீரான கார்டியோ பயிற்சிகளுக்கும் உகந்த நாள்.';
    nutritionEn = 'Opt for fiber-dense complex carbohydrates (millet, oats, brown rice) and cottage cheese/paneer for sustained energy.';
    nutritionTa = 'சிறுதானியங்கள், கேழ்வரகு, மற்றும் பன்னீர் போன்ற சத்துமிக்க உணவுகள் நீண்ட நேர ஆற்றலைத் தரும்.';
  } else if (rasi.element === 'Air') {
    outlookEn = `Mental acuity and agile neuromuscular reflexes are heightened by ${rasi.rulingPlanet}. Great synchronization between mind and muscle contraction.`;
    outlookTa = `மனத் தெளிவும் நரம்பு மண்டல சுறுசுறுப்பும் உயரும் நன்னாள். உடலையும் மனதையும் ஒருமுகப்படுத்தி உடற்பயிற்சியில் கவனம் செலுத்துங்கள்.`;
    fitnessEn = 'Great day for dynamic agility, kettlebell work, calisthenics, and functional core stability drills.';
    fitnessTa = 'கெட்டில்பெல் பயிற்சிகள், உடலெடை பயிற்சிகள் (Calisthenics), மற்றும் வயிற்றுப்பகுதி பயிற்சிகளுக்கு ஏற்றது.';
    nutritionEn = 'Keep digestion light and rhythmic. Incorporate sprouted pulses, soaked almonds, and fresh buttermilk.';
    nutritionTa = 'முளைகட்டிய பயறு, ஊறவைத்த பாதாம், மற்றும் மோர் அருந்தி செரிமானத்தை சீராக வையுங்கள்.';
  } else {
    // Water
    outlookEn = `Intuitive harmony and cellular recovery are favored today under lunar guidance. Balance strength exertion with deep restorative stretching.`;
    outlookTa = `மன அமைதியும் உடல் புத்துணர்ச்சியும் பெருகும் நாள். உடல் சோர்வை போக்கி புத்துணர்வு பெற உகந்த சமநிலை நேரம்.`;
    fitnessEn = 'Focus on controlled tempo lifting, mindful breathing between sets, and lower-body mobility flows.';
    fitnessTa = 'கட்டுப்பாட்டுடன் கூடிய மிதமான பயிற்சிகளும், மூச்சுப்பயிற்சி மற்றும் யோகாசனங்களும் உடலுக்கு அபார பலன் தரும்.';
    nutritionEn = 'Emphasize anti-inflammatory foods: turmeric golden milk, chia seeds, and rich leafy greens.';
    nutritionTa = 'மஞ்சள் பால், கீரை வகைகள் மற்றும் சியா விதைகள் போன்ற வீக்கத்தைக் குறைக்கும் உணவுகளை சேர்த்துக் கொள்ளுங்கள்.';
  }

  return {
    rasiId,
    date: dateStr,
    generalOutlookEn: outlookEn,
    generalOutlookTa: outlookTa,
    energyScore,
    fitnessFocusEn: fitnessEn,
    fitnessFocusTa: fitnessTa,
    nutritionTipEn: nutritionEn,
    nutritionTipTa: nutritionTa,
    workoutRecommendation,
    luckyColor,
    luckyDirection,
  };
}
