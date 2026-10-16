/**
 * Tamil Calendar, Panchangam Calculations, Rasipalan, and Traditional Festivals Engine
 * Provides solar date mapping (Chithirai - Panguni), Jovian year cycles,
 * daily Nalla Neram, Ragukalam, Yemagandam, Kuligai, Thithi, Nakshatram,
 * and fitness & maintenance guidance for all 12 Rasis.
 */

export interface TamilDateInfo {
  gregorianDate: string; // YYYY-MM-DD
  day: number;
  month: number;
  year: number;
  tamilMonthName: string; // e.g. "புரட்டாசி"
  tamilMonthEnglish: string; // e.g. "Purattasi"
  tamilMonthIndex: number; // 1 to 12
  tamilDate: number; // 1 to 32
  tamilYearName: string; // e.g. "பராபவ" / "Parabhava"
  tamilYearEnglish: string;
  tamilDayName: string; // e.g. "வெள்ளிக்கிழமை"
  dayOfWeekEnglish: string; // e.g. "Friday"
  festivals: TamilFestival[];
  panchangam: PanchangamTimings;
  isSpecialDay: boolean;
  isFastingDay: boolean;
}

export interface PanchangamTimings {
  nallaNeramMorning: string;
  nallaNeramEvening: string;
  gowriNallaNeram: string;
  ragukalam: string;
  yemagandam: string;
  kuligai: string;
  thithi: {
    nameTamil: string;
    nameEnglish: string;
    paksham: 'சுக்ல பட்சம் (Valarpirai)' | 'கிருஷ்ண பட்சம் (Theipirai)';
    startTime?: string;
    endTime?: string;
    timingsTextTamil?: string;
    timingsTextEnglish?: string;
  };
  nakshatram: {
    nameTamil: string;
    nameEnglish: string;
    pada: number;
  };
  yogam: {
    nameTamil: string;
    nameEnglish: string;
    type: 'Siddha' | 'Amrutha' | 'Marana';
    isAuspicious: boolean;
  };
  chandrashtamamRasi: {
    nameTamil: string;
    nameEnglish: string;
  };
  sunrise: string;
  sunset: string;
}

export interface TamilFestival {
  id: string;
  nameEnglish: string;
  nameTamil: string;
  date: string; // YYYY-MM-DD or MM-DD for recurring
  month: number;
  day: number;
  tamilMonth?: string;
  tamilDateApprox?: string;
  category: 'Major Festival' | 'Temple Festival' | 'Viratham / Fasting' | 'Monthly Sacred Day';
  deity: string;
  significance: string;
  significanceTamil: string;
  nutritionDietGuidance: string;
  fitnessWorkoutGuidance: string;
  isCustom?: boolean;
}

export interface CustomFestivalDoc {
  id: string;
  userId: string;
  nameEnglish: string;
  nameTamil: string;
  date: string; // YYYY-MM-DD
  category: 'Temple Festival' | 'Fasting / Viratham' | 'Personal Milestone' | 'Pooja';
  deity?: string;
  templeLocation?: string;
  fastingNotes?: string;
  reminderEnabled?: boolean;
  createdAt?: unknown;
}

export interface RasipalanData {
  id: string;
  nameEnglish: string;
  nameTamil: string;
  westernSign: string;
  symbol: string;
  rulingPlanet: string;
  rulingPlanetTamil: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  luckyColor: string;
  luckyNumber: string;
  healthOutlook: string;
  healthOutlookTamil: string;
  workoutAdvice: string;
  workoutAdviceTamil: string;
  nutritionAdvice: string;
  nutritionAdviceTamil: string;
  vitalityScore: number; // 60 - 98
}

// 12 Tamil Solar Months
export const TAMIL_MONTHS = [
  { index: 1, nameTamil: 'சித்திரை', nameEnglish: 'Chithirai', approxStart: { m: 4, d: 14 } },
  { index: 2, nameTamil: 'வைகாசி', nameEnglish: 'Vaikasi', approxStart: { m: 5, d: 15 } },
  { index: 3, nameTamil: 'ஆனி', nameEnglish: 'Aani', approxStart: { m: 6, d: 15 } },
  { index: 4, nameTamil: 'ஆடி', nameEnglish: 'Aadi', approxStart: { m: 7, d: 16 } },
  { index: 5, nameTamil: 'ஆவணி', nameEnglish: 'Aavani', approxStart: { m: 8, d: 17 } },
  { index: 6, nameTamil: 'புரட்டாசி', nameEnglish: 'Purattasi', approxStart: { m: 9, d: 17 } },
  { index: 7, nameTamil: 'ஐப்பசி', nameEnglish: 'Aippasi', approxStart: { m: 10, d: 18 } },
  { index: 8, nameTamil: 'கார்த்திகை', nameEnglish: 'Karthigai', approxStart: { m: 11, d: 17 } },
  { index: 9, nameTamil: 'மார்கழி', nameEnglish: 'Margazhi', approxStart: { m: 12, d: 16 } },
  { index: 10, nameTamil: 'தை', nameEnglish: 'Thai', approxStart: { m: 1, d: 15 } },
  { index: 11, nameTamil: 'மாசி', nameEnglish: 'Maasi', approxStart: { m: 2, d: 13 } },
  { index: 12, nameTamil: 'பங்குனி', nameEnglish: 'Panguni', approxStart: { m: 3, d: 15 } },
];

// Tamil 60-Year Cycle Names (அறுபது தமிழ் வருடங்கள்)
export const TAMIL_YEAR_NAMES = [
  { tamil: 'பிரபவ', english: 'Prabhava' },
  { tamil: 'விபவ', english: 'Vibhava' },
  { tamil: 'சுக்ல', english: 'Sukla' },
  { tamil: 'பிரமோதூத', english: 'Pramodoota' },
  { tamil: 'பிரஜோற்பத்தி', english: 'Prajothpatti' },
  { tamil: 'ஆங்கீரச', english: 'Angirasa' },
  { tamil: 'ஸ்ரீமுக', english: 'Srimukha' },
  { tamil: 'பவ', english: 'Bhava' },
  { tamil: 'யுவ', english: 'Yuva' },
  { tamil: 'தாது', english: 'Dhaathu' },
  { tamil: 'ஈஸ்வர', english: 'Eswara' },
  { tamil: 'வெகுதானிய', english: 'Bahudhanya' },
  { tamil: 'பிரமாதி', english: 'Pramathi' },
  { tamil: 'விக்ரம', english: 'Vikrama' },
  { tamil: 'விஷு', english: 'Vishu' },
  { tamil: 'சித்ரபானு', english: 'Chitrabanu' },
  { tamil: 'சுபானு', english: 'Subhanu' },
  { tamil: 'தாரண', english: 'Tharana' },
  { tamil: 'பார்த்திப', english: 'Parthiba' },
  { tamil: 'விய', english: 'Viya' },
  { tamil: 'சர்வசித்து', english: 'Sarvajith' },
  { tamil: 'சர்வதாரி', english: 'Sarvadhari' },
  { tamil: 'विरोதி', english: 'Virodhi' },
  { tamil: 'விக்ருதி', english: 'Vikruthi' },
  { tamil: 'கர', english: 'Kara' },
  { tamil: 'நந்தன', english: 'Nandhana' },
  { tamil: 'விஜய', english: 'Vijaya' },
  { tamil: 'ஜய', english: 'Jaya' },
  { tamil: 'மன்மத', english: 'Manmatha' },
  { tamil: 'துன்முகி', english: 'Dhunmuki' },
  { tamil: 'ஹேவிளம்பி', english: 'Hevilambi' },
  { tamil: 'விளம்பி', english: 'Vilambi' },
  { tamil: 'விகாரி', english: 'Vikari' },
  { tamil: 'சார்வரி', english: 'Sarvari' },
  { tamil: 'பிலவ', english: 'Plava' },
  { tamil: 'சுபகிருது', english: 'Subhakruth' },
  { tamil: 'சோபகிருது', english: 'Sobhakruth' },
  { tamil: 'குரோதி', english: 'Krodhi' }, // 2024 - 2025
  { tamil: 'விஸ்வாவசு', english: 'Viswavasu' }, // 2025 - 2026
  { tamil: 'பராபவ', english: 'Parabhava' }, // 2026 - 2027
  { tamil: 'பிலவங்க', english: 'Plavanga' }, // 2027 - 2028
  { tamil: 'கீலக', english: 'Keelaka' },
  { tamil: 'சௌமிய', english: 'Saumya' },
  { tamil: 'சாதாரண', english: 'Sadharana' },
  { tamil: 'விரோதகிருது', english: 'Virodhakruth' },
  { tamil: 'பரிதாபி', english: 'Paridhabi' },
  { tamil: 'பிரமாதீச', english: 'Pramadheesa' },
  { tamil: 'ஆனந்த', english: 'Anandha' },
  { tamil: 'ராட்சச', english: 'Rakshasa' },
  { tamil: 'நள', english: 'Nala' },
  { tamil: 'பிங்கள', english: 'Pingala' },
  { tamil: 'காளயுக்தி', english: 'Kalayukthi' },
  { tamil: 'சித்தார்த்தி', english: 'Siddharthi' },
  { tamil: 'ரௌத்திரி', english: 'Raudhri' },
  { tamil: 'துர்மதி', english: 'Durmathi' },
  { tamil: 'துந்துபி', english: 'Dhundhubhi' },
  { tamil: 'ருத்ரோத்காரி', english: 'Rudhrodhkari' },
  { tamil: 'ரக்தாட்சி', english: 'Raktakshi' },
  { tamil: 'குரோதன', english: 'Krodhana' },
  { tamil: 'அட்சய', english: 'Akshaya' },
];

export const TAMIL_DAYS_OF_WEEK = [
  { index: 0, tamil: 'ஞாயிற்றுக்கிழமை', english: 'Sunday' },
  { index: 1, tamil: 'திங்கட்கிழமை', english: 'Monday' },
  { index: 2, tamil: 'செவ்வாய்க்கிழமை', english: 'Tuesday' },
  { index: 3, tamil: 'புதன்கிழமை', english: 'Wednesday' },
  { index: 4, tamil: 'வியாழக்கிழமை', english: 'Thursday' },
  { index: 5, tamil: 'வெள்ளிக்கிழமை', english: 'Friday' },
  { index: 6, tamil: 'சனிக்கிழமை', english: 'Saturday' },
];

export const NAKSHATRAS = [
  { nameTamil: 'அசுவினி', nameEnglish: 'Ashwini' },
  { nameTamil: 'பரணி', nameEnglish: 'Bharani' },
  { nameTamil: 'கார்த்திகை', nameEnglish: 'Krittika' },
  { nameTamil: 'ரோகிணி', nameEnglish: 'Rohini' },
  { nameTamil: 'மிருகசீரிஷம்', nameEnglish: 'Mrigashirsha' },
  { nameTamil: 'திருவாதிரை', nameEnglish: 'Ardra' },
  { nameTamil: 'புனர்பூசம்', nameEnglish: 'Punarvasu' },
  { nameTamil: 'பூசம்', nameEnglish: 'Pushya' },
  { nameTamil: 'ஆயில்யம்', nameEnglish: 'Ashlesha' },
  { nameTamil: 'மகம்', nameEnglish: 'Magha' },
  { nameTamil: 'பூரம்', nameEnglish: 'Purva Phalguni' },
  { nameTamil: 'உத்திரம்', nameEnglish: 'Uttara Phalguni' },
  { nameTamil: 'அஸ்தம்', nameEnglish: 'Hasta' },
  { nameTamil: 'சித்திரை', nameEnglish: 'Chitra' },
  { nameTamil: 'சுவாதி', nameEnglish: 'Swati' },
  { nameTamil: 'விசாகம்', nameEnglish: 'Vishakha' },
  { nameTamil: 'அனுஷம்', nameEnglish: 'Anuradha' },
  { nameTamil: 'கேட்டை', nameEnglish: 'Jyeshtha' },
  { nameTamil: 'மூலம்', nameEnglish: 'Mula' },
  { nameTamil: 'பூராடம்', nameEnglish: 'Purva Ashadha' },
  { nameTamil: 'உத்திராடம்', nameEnglish: 'Uttara Ashadha' },
  { nameTamil: 'திருவோணம்', nameEnglish: 'Shravana' },
  { nameTamil: 'அவிட்டம்', nameEnglish: 'Dhanishta' },
  { nameTamil: 'சதயம்', nameEnglish: 'Shatabhisha' },
  { nameTamil: 'பூரட்டாதி', nameEnglish: 'Purva Bhadrapada' },
  { nameTamil: 'உத்திரட்டாதி', nameEnglish: 'Uttara Bhadrapada' },
  { nameTamil: 'ரேவதி', nameEnglish: 'Revati' },
];

export const THITHIS = [
  { nameTamil: 'பிரதமை', nameEnglish: 'Prathama' },
  { nameTamil: 'துவிதியை', nameEnglish: 'Dvitiya' },
  { nameTamil: 'திருதியை', nameEnglish: 'Tritiya' },
  { nameTamil: 'சதுர்த்தி', nameEnglish: 'Chaturthi' },
  { nameTamil: 'பஞ்சமி', nameEnglish: 'Panchami' },
  { nameTamil: 'சஷ்டி', nameEnglish: 'Sashti' },
  { nameTamil: 'சப்தமி', nameEnglish: 'Saptami' },
  { nameTamil: 'அஷ்டமி', nameEnglish: 'Ashtami' },
  { nameTamil: 'நவமி', nameEnglish: 'Navami' },
  { nameTamil: 'தசமி', nameEnglish: 'Dashami' },
  { nameTamil: 'ஏகாதசி', nameEnglish: 'Ekadashi' },
  { nameTamil: 'துவாதசி', nameEnglish: 'Dvadashi' },
  { nameTamil: 'திரயோதசி', nameEnglish: 'Trayodashi' },
  { nameTamil: 'சதுர்த்தசி', nameEnglish: 'Chaturdashi' },
  { nameTamil: 'பௌர்ணமி', nameEnglish: 'Pournami' },
];

export const AMAVASAI_THITHI = { nameTamil: 'அமாவாசை', nameEnglish: 'Amavasya' };

// Fixed Traditional Almanac Timing Rules (By Day of Week: 0=Sun to 6=Sat)
export const DAY_TIMINGS_TABLE: Record<
  number,
  {
    nallaMorning: string;
    nallaEvening: string;
    gowri: string;
    ragu: string;
    yema: string;
    kuli: string;
  }
> = {
  0: {
    // Sunday
    nallaMorning: '07:30 AM - 08:30 AM',
    nallaEvening: '03:30 PM - 04:30 PM',
    gowri: '10:30 AM - 11:30 AM',
    ragu: '04:30 PM - 06:00 PM',
    yema: '12:00 PM - 01:30 PM',
    kuli: '03:00 PM - 04:30 PM',
  },
  1: {
    // Monday
    nallaMorning: '06:30 AM - 07:30 AM',
    nallaEvening: '04:30 PM - 05:30 PM',
    gowri: '09:30 AM - 10:30 AM',
    ragu: '07:30 AM - 09:00 AM',
    yema: '10:30 AM - 12:00 PM',
    kuli: '01:30 PM - 03:00 PM',
  },
  2: {
    // Tuesday
    nallaMorning: '07:30 AM - 08:30 AM',
    nallaEvening: '04:30 PM - 05:30 PM',
    gowri: '10:30 AM - 11:30 AM',
    ragu: '03:00 PM - 04:30 PM',
    yema: '09:00 AM - 10:30 AM',
    kuli: '12:00 PM - 01:30 PM',
  },
  3: {
    // Wednesday
    nallaMorning: '09:15 AM - 10:15 AM',
    nallaEvening: '04:45 PM - 05:45 PM',
    gowri: '12:30 PM - 01:30 PM',
    ragu: '12:00 PM - 01:30 PM',
    yema: '07:30 AM - 09:00 AM',
    kuli: '10:30 AM - 12:00 PM',
  },
  4: {
    // Thursday
    nallaMorning: '09:30 AM - 10:30 AM',
    nallaEvening: '06:30 PM - 07:30 PM',
    gowri: '01:30 PM - 02:30 PM',
    ragu: '01:30 PM - 03:00 PM',
    yema: '06:00 AM - 07:30 AM',
    kuli: '09:00 AM - 10:30 AM',
  },
  5: {
    // Friday
    nallaMorning: '09:15 AM - 10:15 AM',
    nallaEvening: '04:30 PM - 05:30 PM',
    gowri: '06:30 PM - 07:30 PM',
    ragu: '10:30 AM - 12:00 PM',
    yema: '03:00 PM - 04:30 PM',
    kuli: '07:30 AM - 09:00 AM',
  },
  6: {
    // Saturday
    nallaMorning: '07:30 AM - 08:30 AM',
    nallaEvening: '05:00 PM - 06:00 PM',
    gowri: '09:30 AM - 10:30 AM',
    ragu: '09:00 AM - 10:30 AM',
    yema: '01:30 PM - 03:00 PM',
    kuli: '06:00 AM - 07:30 AM',
  },
};

// 12 Tamil Rasis (Mesham to Meenam)
export const TAMIL_RASIS: RasipalanData[] = [
  {
    id: 'mesham',
    nameEnglish: 'Mesham',
    nameTamil: 'மேஷம்',
    westernSign: 'Aries',
    symbol: '♈',
    rulingPlanet: 'Mars (Kuja / Sevvai)',
    rulingPlanetTamil: 'செவ்வாய்',
    element: 'Fire',
    luckyColor: 'Red / Crimson',
    luckyNumber: '9',
    healthOutlook: 'High metabolic fire & vitality. Excellent day for explosive movements and compound sets. Watch out for heat exhaustion; drink tender coconut water.',
    healthOutlookTamil: 'உடல் ஆற்றலும் சுறுசுறுப்பும் மிக அதிகம். கடின உடற்பயிற்சிகளை எளிதில் செய்து முடிப்பீர்கள். உடல் சூட்டைத் தணிக்க இளநீர் அருந்தவும்.',
    workoutAdvice: 'Target heavy barbell lifts: Squats, Bench Press, Overhead Press. Peak strength window between 7:30 AM and 9:00 AM.',
    workoutAdviceTamil: 'கனமான பளு தூக்கும் பயிற்சிகள் மற்றும் தோள்பட்டை பயிற்சிகளுக்கு உகந்த நாள். காலை வேளையில் பயிற்சி செய்வது சிறப்பு.',
    nutritionAdvice: 'Focus on high-protein lean sources and cooling foods (curd rice, watermelon, electrolytes). Avoid excessive spicy chilies.',
    nutritionAdviceTamil: 'அதிக புரதச்சத்து மற்றும் குளிர்ச்சியூட்டும் தயிர், வெள்ளரி ஆகியவற்றை உட்கொள்ளவும்.',
    vitalityScore: 92,
  },
  {
    id: 'rishabam',
    nameEnglish: 'Rishabam',
    nameTamil: 'ரிஷபம்',
    westernSign: 'Taurus',
    symbol: '♉',
    rulingPlanet: 'Venus (Sukran)',
    rulingPlanetTamil: 'சுக்கிரன்',
    element: 'Earth',
    luckyColor: 'White / Cream',
    luckyNumber: '6',
    healthOutlook: 'Steady stamina and enduring power. Ideal for hypertrophy volume work. Watch throat, neck, and vocal strain.',
    healthOutlookTamil: 'நிலையான உடல் பலம் மற்றும் சகிப்புத்தன்மை நீடிக்கும். தொண்டை மற்றும் கழுத்து பகுதிக்கு அதிக அழுத்தம் தருவதைத் தவிர்க்கவும்.',
    workoutAdvice: 'Moderate weight, high repetition hypertrophy training (12-15 reps). Focus on back, lats, and pull movements.',
    workoutAdviceTamil: 'முதுகு மற்றும் தோள்பட்டை பயிற்சிகளில் சீரான தொடர் செட்கள் செய்யவும். மிதமான எடையில் அதிக ரெப்கள் சிறந்தது.',
    nutritionAdvice: 'Maintain hydration with mint-infused water. Limit high-sugar sweets and heavy ghee sweets.',
    nutritionAdviceTamil: 'மிதமான இனிப்பு மற்றும் நீர்ச்சத்து நிறைந்த உணவுகளை எடுத்துக் கொள்ளவும்.',
    vitalityScore: 88,
  },
  {
    id: 'mithunam',
    nameEnglish: 'Mithunam',
    nameTamil: 'மிதுனம்',
    westernSign: 'Gemini',
    symbol: '♊',
    rulingPlanet: 'Mercury (Budhan)',
    rulingPlanetTamil: 'புதன்',
    element: 'Air',
    luckyColor: 'Green / Emerald',
    luckyNumber: '5',
    healthOutlook: 'High mental agility and rapid reflexes. Excellent coordination for agility drills, skipping rope, and athletic conditioning.',
    healthOutlookTamil: 'மன ஒருமைப்பாடும் வேகமான செயல்பாடும் கூடும். சுறுசுறுப்பான கார்டியோ மற்றும் ஏரோபிக்ஸ் பயிற்சிகளுக்கு ஏற்ற நாள்.',
    workoutAdvice: 'High-intensity interval training (HIIT), calisthenics, push-ups, and pull-ups. Keep rest intervals brief (45s).',
    workoutAdviceTamil: 'HIIT கார்டியோ, தண்டால் மற்றும் புல்-அப்ஸ் பயிற்சிகளுக்கு அதிக முன்னுரிமை அளிக்கவும்.',
    nutritionAdvice: 'Light, nutrient-dense meals: sprouted green gram (moong), soaked almonds, and green leafy sabji.',
    nutritionAdviceTamil: 'முளைகட்டிய பாசிப்பயறு, பாதாம் மற்றும் பச்சைக் காய்கறிகளைச் சேர்க்கவும்.',
    vitalityScore: 85,
  },
  {
    id: 'kadagam',
    nameEnglish: 'Kadagam',
    nameTamil: 'கடகம்',
    westernSign: 'Cancer',
    symbol: '♋',
    rulingPlanet: 'Moon (Chandran)',
    rulingPlanetTamil: 'சந்திரன்',
    element: 'Water',
    luckyColor: 'Pearl White / Silver',
    luckyNumber: '2',
    healthOutlook: 'Emotion-driven physical recovery. Sleep depth and digestive hydration are key today. Avoid training on a bloated stomach.',
    healthOutlookTamil: 'உடல் ஓய்வு மற்றும் சீரான செரிமானம் தேவைப்படும் நாள். போதுமான தூக்கமும் அமைதியான மனநிலையும் புத்துணர்ச்சி தரும்.',
    workoutAdvice: 'Core conditioning, Pilates, planks, and steady low-impact treadmill incline walks. Avoid maximal 1RM attempts.',
    workoutAdviceTamil: 'வயிற்றுப் பகுதி (Core) பயிற்சிகள், பலகைப் பயிற்சி (Planks) மற்றும் மிதமான நடைபயிற்சி சிறந்தது.',
    nutritionAdvice: 'Warm soups, jeera water, steamed idlis, and easy-to-digest dal. Keep sodium intake strictly balanced.',
    nutritionAdviceTamil: 'சீரகத் தண்ணீர், ஆவியில் வெந்த இட்லி, மிளகு ரசம் போன்ற எளிதில் செரிக்கும் உணவுகள் உகந்தது.',
    vitalityScore: 81,
  },
  {
    id: 'simmam',
    nameEnglish: 'Simmam',
    nameTamil: 'சிம்மம்',
    westernSign: 'Leo',
    symbol: '♌',
    rulingPlanet: 'Sun (Suriyan)',
    rulingPlanetTamil: 'சூரியன்',
    element: 'Fire',
    luckyColor: 'Gold / Orange',
    luckyNumber: '1',
    healthOutlook: 'Radiant cardiovascular vitality and spinal strength. High confidence in the gym. Maintain spinal posture during deadlifts.',
    healthOutlookTamil: 'இதய நலம் மற்றும் முதுகெலும்பு பலம் சிறக்கும். தன்னம்பிக்கையுடன் உடற்பயிற்சி செய்ய உகந்த உன்னதமான நாள்.',
    workoutAdvice: 'Heavy compound leg day: Barbell Squats, Romanian Deadlifts, and Farmer Walks. Train with commanding focus.',
    workoutAdviceTamil: 'முதுகுத்தண்டு மற்றும் கால் தசைப் பயிற்சிகள் (Squats, Deadlifts) செய்ய சிறந்த நாள்.',
    nutritionAdvice: 'Solar-energized foods: oranges, citrus fruits, amla (gooseberry), pomegranate, and protein-packed dal tadka.',
    nutritionAdviceTamil: 'நெல்லிக்காய், மாதுளை, ஆரஞ்சு மற்றும் சத்தான பருப்பு வகைகளை உணவில் சேர்க்கவும்.',
    vitalityScore: 95,
  },
  {
    id: 'kanni',
    nameEnglish: 'Kanni',
    nameTamil: 'கன்னி',
    westernSign: 'Virgo',
    symbol: '♍',
    rulingPlanet: 'Mercury (Budhan)',
    rulingPlanetTamil: 'புதன்',
    element: 'Earth',
    luckyColor: 'Light Green / Yellow',
    luckyNumber: '5',
    healthOutlook: 'High precision and discipline in calorie tracking and form execution. Perfect day for perfecting lifting biomechanics.',
    healthOutlookTamil: 'உடற்பயிற்சி நிலைகளை (Posture) துல்லியமாகப் பின்பற்றி உடலை சீரமைக்க சிறந்த நாள். செரிமானத்தில் கவனம் தேவை.',
    workoutAdvice: 'Unilateral isolation exercises: dumbbell lunges, single-arm cable rows, and rotator cuff mobility drills.',
    workoutAdviceTamil: 'தனித்தனி கைகள் மற்றும் கால்களுக்கான டம்பெல் பயிற்சிகளும் மூட்டு நெகிழ்வுத்தன்மை பயிற்சிகளும் சிறந்தது.',
    nutritionAdvice: 'Gut-friendly probiotics: buttermilk with curry leaves & ginger, chia seeds, and dietary fiber from boiled vegetables.',
    nutritionAdviceTamil: 'இஞ்சி, கறிவேப்பிலை கலந்த மோர் மற்றும் நார்சத்து மிகுந்த உணவுகளை உட்கொள்ளவும்.',
    vitalityScore: 90,
  },
  {
    id: 'thulaam',
    nameEnglish: 'Thulaam',
    nameTamil: 'துலாம்',
    westernSign: 'Libra',
    symbol: '♎',
    rulingPlanet: 'Venus (Sukran)',
    rulingPlanetTamil: 'சுக்கிரன்',
    element: 'Air',
    luckyColor: 'Sky Blue / White',
    luckyNumber: '6',
    healthOutlook: 'Body symmetry and muscular balance in equilibrium. Kidney filtration is active; maintain 3.0L clean water intake.',
    healthOutlookTamil: 'உடல் தசைகளின் சமநிலை கூடும். சிறுநீரக நலம் காக்க குறைந்தது 3 லிட்டர் தண்ணீர் பருகுவதை உறுதி செய்யவும்.',
    workoutAdvice: 'Chest and back antagonist supersets: Incline Dumbbell Press paired with Lat Pulldowns. Aesthetic balance focus.',
    workoutAdviceTamil: 'மார்பு மற்றும் முதுகு தசைகளை சமமாக இயக்கும் சூப்பர்-செட் பயிற்சிகள் உடலை அழகாக்கும்.',
    nutritionAdvice: 'Balanced macronutrients (40% carbs, 30% protein, 30% healthy fats). Add walnuts, flaxseeds, and boiled chickpeas.',
    nutritionAdviceTamil: 'சுண்டல், அக்ரூட் பருப்பு மற்றும் சமச்சீரான ஊட்டச்சத்து உணவுகளை உண்ணவும்.',
    vitalityScore: 87,
  },
  {
    id: 'viruchigam',
    nameEnglish: 'Viruchigam',
    nameTamil: 'விருச்சிகம்',
    westernSign: 'Scorpio',
    symbol: '♏',
    rulingPlanet: 'Mars (Kuja / Sevvai)',
    rulingPlanetTamil: 'செவ்வாய்',
    element: 'Water',
    luckyColor: 'Dark Red / Maroon',
    luckyNumber: '9',
    healthOutlook: 'Deep inner resilience and intensity. Pushing through muscular barriers. Ensure thorough warm-up to prevent hamstring pull.',
    healthOutlookTamil: 'ஆழ்ந்த மன உறுதி மற்றும் தீவிர உடற்பயிற்சி வேட்கை உண்டாகும். தசைப்பிடிப்பு ஏற்படாமல் இருக்க வார்ம்-அப் அவசியம்.',
    workoutAdvice: 'High-intensity leg press, hamstring curls, and heavy farmer carries. Maximum focus under working sets.',
    workoutAdviceTamil: 'லெக் பிரஸ், தொடை தசை பயிற்சிகள் மற்றும் அதிக எடையுடன் நடக்கும் பயிற்சிகள் பயன் தரும்.',
    nutritionAdvice: 'Iron-rich replenishment: beetroot juice, dates, spinach sabji, and paneer bhurji for tissue rebuilding.',
    nutritionAdviceTamil: 'பீட்ரூட் சாறு, பேரிச்சம்பழம் மற்றும் கீரை போன்ற இரும்புச்சத்து நிறைந்த உணவுகள் உடலை வலுவாக்கும்.',
    vitalityScore: 91,
  },
  {
    id: 'dhanusu',
    nameEnglish: 'Dhanusu',
    nameTamil: 'தனுசு',
    westernSign: 'Sagittarius',
    symbol: '♐',
    rulingPlanet: 'Jupiter (Guru)',
    rulingPlanetTamil: 'குரு',
    element: 'Fire',
    luckyColor: 'Yellow / Saffron',
    luckyNumber: '3',
    healthOutlook: 'Expansive physical energy and optimism. Great stamina for outdoor runs, cycling, or long compound training sessions.',
    healthOutlookTamil: 'எண்ணற்ற ஆற்றலும் உற்சாகமும் வெளிப்படும். நீண்ட தூர ஓட்டம், சைக்கிள் ஓட்டுதல் போன்ற திறந்தவெளி பயிற்சிகளுக்கு நன்று.',
    workoutAdvice: 'Full-body functional training: Clean and press, kettlebell swings, and rowing machine intervals.',
    workoutAdviceTamil: 'கெட்டில்பெல் சுவிங் மற்றும் முழு உடலையும் இயக்கும் செயல்பாட்டுப் பயிற்சிகளை மேற்கொள்ளவும்.',
    nutritionAdvice: 'Sattvic protein meals: yellow dal with turmeric, roasted almonds, boiled corn, and herbal tulsi tea.',
    nutritionAdviceTamil: 'மஞ்சள் சேர்த்த பருப்பு, பாதாம் மற்றும் துளசி தேநீர் ஆரோக்கியத்திற்கு உகந்தது.',
    vitalityScore: 94,
  },
  {
    id: 'makaram',
    nameEnglish: 'Makaram',
    nameTamil: 'மகரம்',
    westernSign: 'Capricorn',
    symbol: '♑',
    rulingPlanet: 'Saturn (Sani)',
    rulingPlanetTamil: 'சனி',
    element: 'Earth',
    luckyColor: 'Blue / Charcoal',
    luckyNumber: '8',
    healthOutlook: 'Unyielding perseverance and joint structural fortitude. Knee and lower back alignment require steady attention.',
    healthOutlookTamil: 'விடாமுயற்சியும் கட்டுக்கோப்பான உடற்பயிற்சியும் பலன் தரும். முழங்கால் மற்றும் இடுப்பு மூட்டுகளில் கவனம் தேவை.',
    workoutAdvice: 'Heavy progressive overload on machines: Smith Machine Squats, Seated Cable Rows, and Calf Raises.',
    workoutAdviceTamil: 'மெஷின் வழியிலான துல்லியமான பயிற்சிகள் மற்றும் கெண்டைக்கால் பயிற்சிகள் நற்பலன் தரும்.',
    nutritionAdvice: 'Calcium and bone-density support: sesame seeds (ellu), ragi porridge / ragi roti, and fresh cottage cheese (paneer).',
    nutritionAdviceTamil: 'எள், கேழ்வரகு (ராகி கூழ்/களி) மற்றும் பால் சார்ந்த கால்சியம் நிறைந்த உணவுகள் சிறப்பு.',
    vitalityScore: 89,
  },
  {
    id: 'kumbam',
    nameEnglish: 'Kumbam',
    nameTamil: 'கும்பம்',
    westernSign: 'Aquarius',
    symbol: '♒',
    rulingPlanet: 'Saturn (Sani)',
    rulingPlanetTamil: 'சனி',
    element: 'Air',
    luckyColor: 'Electric Blue / Navy',
    luckyNumber: '8',
    healthOutlook: 'Superior peripheral circulation and breathing control. Calves, shins, and ankles respond well to active conditioning.',
    healthOutlookTamil: 'இரத்த ஓட்டமும் சுவாசத் திறனும் மேலோங்கும். கணுக்கால் மற்றும் கால்களின் இரத்த ஓட்டம் சீராக இருக்கும்.',
    workoutAdvice: 'Calisthenics, agility ladder footwork, jump rope, and brisk stair climbing sessions.',
    workoutAdviceTamil: 'ஸ்கிப்பிங் கயிறு பயிற்சி, படிக்கட்டு ஏறுதல் மற்றும் சுறுசுறுப்பான தரைப்பயிற்சிகள் ஏற்றவை.',
    nutritionAdvice: 'Circulation-enhancing foods: pomegranate, garlic tadka in rasam, green tea, and electrolyte hydration.',
    nutritionAdviceTamil: 'பூண்டு ரசம், மாதுளை மற்றும் கிரீன் டீ போன்றவை இரத்த ஓட்டத்தை மேம்படுத்தும்.',
    vitalityScore: 86,
  },
  {
    id: 'meenam',
    nameEnglish: 'Meenam',
    nameTamil: 'மீனம்',
    westernSign: 'Pisces',
    symbol: '♓',
    rulingPlanet: 'Jupiter (Guru)',
    rulingPlanetTamil: 'குரு',
    element: 'Water',
    luckyColor: 'Golden Yellow / Pale Blue',
    luckyNumber: '3',
    healthOutlook: 'Peaceful body awareness and deep cellular recovery. Excellent day for swimming, stretching, and mindful breathwork.',
    healthOutlookTamil: 'உடலும் மனமும் அமைதி பெறும். நீச்சல், யோகாசனம் மற்றும் மூச்சுப் பயிற்சிகள் உடலுக்கு பேரமைதி தரும்.',
    workoutAdvice: 'Mobility flow, dynamic yoga stretches (Surya Namaskar), light deload training, and foam rolling.',
    workoutAdviceTamil: 'சூரிய நமஸ்காரம், யோகாசனம் மற்றும் எளிய தசை நீட்சிப் பயிற்சிகளைச் செய்வது மிக உகந்தது.',
    nutritionAdvice: 'Purifying hydration: coconut water, warm turmeric milk before sleep, and steamed green vegetables.',
    nutritionAdviceTamil: 'இளநீர் மற்றும் இரவில் வெதுவெதுப்பான மஞ்சள் பால் அருந்துவது செரிமானத்திற்கும் தூக்கத்திற்கும் நல்லது.',
    vitalityScore: 92,
  },
];

// Preloaded Authentic Tamil Hindu Festivals Database
export const AUTHENTIC_TAMIL_FESTIVALS: TamilFestival[] = [
  {
    id: 'thai-pongal',
    nameEnglish: 'Thai Pongal (Makara Sankranti)',
    nameTamil: 'தை பொங்கல்',
    date: '2026-01-15',
    month: 1,
    day: 15,
    tamilMonth: 'தை',
    tamilDateApprox: 'தை 1',
    category: 'Major Festival',
    deity: 'Suriyan (Lord Surya)',
    significance: 'Tamil harvest thanksgiving festival worshiping the Sun God for energy, agriculture, and life.',
    significanceTamil: 'உழவுக்கும் இயற்கைக்கும் சூரியனுக்கும் நன்றி தெரிவிக்கும் உன்னதத் தமிழர் அறுவடைத் திருநாள்.',
    nutritionDietGuidance: 'Traditional Sweet Pongal (jaggery, rice, moong dal, ghee, cashews) and Ven Pongal. Balance jaggery with fiber-rich harvest vegetables (avarakkai, pumpkin).',
    fitnessWorkoutGuidance: 'Outdoor morning sun salutations (Surya Namaskar 12 rounds) and light bodyweight calisthenics.',
  },
  {
    id: 'mattu-pongal',
    nameEnglish: 'Mattu Pongal / Kanum Pongal',
    nameTamil: 'மாட்டுப் பொங்கல் / காணும் பொங்கல்',
    date: '2026-01-16',
    month: 1,
    day: 16,
    tamilMonth: 'தை',
    tamilDateApprox: 'தை 2',
    category: 'Major Festival',
    deity: 'Nandi & Mother Earth',
    significance: 'Honoring sacred cattle and livestock who assist in agriculture, followed by family reunions.',
    significanceTamil: 'வேளாண்மைக்குத் துணை நிற்கும் மாடுகளுக்கு நன்றி செலுத்தும் திருநாள்.',
    nutritionDietGuidance: 'Variety rices (lemon rice, curd rice, tamarind rice) with high antioxidant herbs.',
    fitnessWorkoutGuidance: 'Active recovery walk with family; outdoor mobility routines.',
  },
  {
    id: 'thai-poosam',
    nameEnglish: 'Thai Poosam',
    nameTamil: 'தைப்பூசம்',
    date: '2026-02-01',
    month: 2,
    day: 1,
    tamilMonth: 'தை',
    tamilDateApprox: 'தை 18',
    category: 'Major Festival',
    deity: 'Lord Murugan',
    significance: 'Celebrates Goddess Parvati presenting the sacred Vel (Spear) to Lord Murugan to vanquish evil forces.',
    significanceTamil: 'சூரபத்மனை அழிக்க அன்னை பராசக்தி முருகப் பெருமானுக்கு ஞானவேல் வழங்கிய திருநாள்.',
    nutritionDietGuidance: 'Strict vegetarian viratham; tender coconut, panchamirtham in small moderation, fruits, and millets.',
    fitnessWorkoutGuidance: 'High-endurance mental conditioning; long walking pilgrimage (Padayatra) or core endurance training.',
  },
  {
    id: 'maha-shivaratri',
    nameEnglish: 'Maha Shivaratri',
    nameTamil: 'மகா சிவராத்திரி',
    date: '2026-02-15',
    month: 2,
    day: 15,
    tamilMonth: 'மாசி',
    tamilDateApprox: 'மாசி 3',
    category: 'Viratham / Fasting',
    deity: 'Lord Shiva',
    significance: 'The Great Night of Shiva commemorating cosmic dance (Tandava) and victory over darkness through all-night vigil.',
    significanceTamil: 'அகிலத்தை ஆளும் ஈசனுக்குரிய விரத இரவு; விழித்திருந்து சிவ சிந்தனையில் திளைக்கும் திருநாள்.',
    nutritionDietGuidance: 'Complete fast or fruit/milk fasting. Break fast gently with warm buttermilk and boiled moong dal.',
    fitnessWorkoutGuidance: 'Light restorative stretching, Pranayama breathwork, and posture alignment.',
  },
  {
    id: 'masi-magam',
    nameEnglish: 'Masi Magam',
    nameTamil: 'மாசி மகம்',
    date: '2026-03-03',
    month: 3,
    day: 3,
    tamilMonth: 'மாசி',
    tamilDateApprox: 'மாசி 19',
    category: 'Temple Festival',
    deity: 'Lord Shiva & Murugan',
    significance: 'Auspicious full moon day in Magha nakshatra where deities are taken for the sacred Theerthavari water immersion.',
    significanceTamil: 'கடற்கரை மற்றும் புண்ணிய நதிகளில் தீர்த்தவாரி உற்சவம் நடைபெறும் புண்ணிய நாள்.',
    nutritionDietGuidance: 'Light vegetarian fasting meals with tender coconut and boiled legumes.',
    fitnessWorkoutGuidance: 'Swimming, water aerobics, and dynamic joint mobility work.',
  },
  {
    id: 'panguni-uthiram',
    nameEnglish: 'Panguni Uthiram',
    nameTamil: 'பங்குனி உத்திரம்',
    date: '2026-03-31',
    month: 3,
    day: 31,
    tamilMonth: 'பங்குனி',
    tamilDateApprox: 'பங்குனி 18',
    category: 'Temple Festival',
    deity: 'Murugan - Deivanai / Shiva - Parvati',
    significance: 'The celestial wedding day of divine couples (Murugan & Valli/Deivanai, Rama & Sita, Shiva & Parvati).',
    significanceTamil: 'தெய்வீகத் திருக்கல்யாணங்கள் நிகழ்ந்த மிக மங்களகரமான பங்குனி உத்திரத் திருநாள்.',
    nutritionDietGuidance: 'Festive prasad: payasam, vadai, and curd rice. Keep portions controlled to hit daily maintenance calories.',
    fitnessWorkoutGuidance: 'Balanced push-pull superset session.',
  },
  {
    id: 'tamil-new-year',
    nameEnglish: 'Tamil New Year (Puthandu / Chithirai Vishu)',
    nameTamil: 'தமிழ்ப் புத்தாண்டு',
    date: '2026-04-14',
    month: 4,
    day: 14,
    tamilMonth: 'சித்திரை',
    tamilDateApprox: 'சித்திரை 1',
    category: 'Major Festival',
    deity: 'Lord Brahma & Kanni Rasi',
    significance: 'Beginning of the new Tamil Year (Parabhava Year). Marks renewal, new fitness goals, and reading of the new Panchangam.',
    significanceTamil: 'புதிய தமிழ் ஆண்டின் தொடக்கம்; அறுசுவை உணவும் புதிய சங்கல்பங்களும் ஏற்கும் மங்கள நாள்.',
    nutritionDietGuidance: 'Traditional Maanga Pachadi (incorporating sweet, sour, bitter neem, salt, astringent, spicy to represent life aspects).',
    fitnessWorkoutGuidance: 'Inaugural fitness baseline benchmark testing: record 1RM estimates and update biometrics.',
  },
  {
    id: 'chitra-pournami',
    nameEnglish: 'Chitra Pournami',
    nameTamil: 'சித்ரா பௌர்ணமி',
    date: '2026-05-01',
    month: 5,
    day: 1,
    tamilMonth: 'சித்திரை',
    tamilDateApprox: 'சித்திரை 18',
    category: 'Monthly Sacred Day',
    deity: 'Chitragupta & Lord Shiva',
    significance: 'Full moon dedicated to Chitragupta (keeper of good and bad deeds) and Girivalam circumambulation around Annamalaiyar.',
    significanceTamil: 'சித்ரகுப்தர் வழிபாடு மற்றும் திருவண்ணாமலை கிரிவலம் செய்வதற்குரிய புனித பௌர்ணமி.',
    nutritionDietGuidance: 'Cooling curd rice, cucumber salad, and tender coconut water.',
    fitnessWorkoutGuidance: 'Girivalam endurance walking (14 km equivalent) or 15,000 steps target.',
  },
  {
    id: 'vaikasi-visakam',
    nameEnglish: 'Vaikasi Visakam',
    nameTamil: 'வைகாசி விசாகம்',
    date: '2026-05-30',
    month: 5,
    day: 30,
    tamilMonth: 'வைகாசி',
    tamilDateApprox: 'வைகாசி 16',
    category: 'Temple Festival',
    deity: 'Lord Murugan',
    significance: 'The divine incarnation day of Lord Murugan from Lord Shiva’s third eye as six sparks of fire.',
    significanceTamil: 'முத்துக்குமரனின் அவதாரத் திருநாள்; ஆலயங்களில் சிறப்பு பாலாபிஷேகங்கள் நடைபெறும் நாள்.',
    nutritionDietGuidance: 'Pure vegetarian diet with milk, fruits, and millets.',
    fitnessWorkoutGuidance: 'High-intensity interval training focusing on agility and explosive power.',
  },
  {
    id: 'aadi-perukku',
    nameEnglish: 'Aadi Perukku (Aadi 18)',
    nameTamil: 'ஆடிப் பெருக்கு',
    date: '2026-08-03',
    month: 8,
    day: 3,
    tamilMonth: 'ஆடி',
    tamilDateApprox: 'ஆடி 18',
    category: 'Major Festival',
    deity: 'Kaveri Amman (Mother River)',
    significance: 'Worship of life-sustaining river waters, fertility, and prosperity as Kaveri swells during monsoon.',
    significanceTamil: 'காவிரித் தாய்க்கும் நீர் வளத்திற்கும் நன்றி செலுத்தும் ஆடி பதினெட்டாம் பெருக்கு விழா.',
    nutritionDietGuidance: 'Traditional 18-variety rices (lemon, coconut, tamarind, sesame, jaggery rice). Exercise portion control.',
    fitnessWorkoutGuidance: 'Hydration and endurance cardio workout; outdoor river-bank brisk walk.',
  },
  {
    id: 'aadi-amavasai',
    nameEnglish: 'Aadi Amavasai',
    nameTamil: 'ஆடி அமாவாசை',
    date: '2026-08-12',
    month: 8,
    day: 12,
    tamilMonth: 'ஆடி',
    tamilDateApprox: 'ஆடி 27',
    category: 'Viratham / Fasting',
    deity: 'Pitrus (Ancestors)',
    significance: 'Sacred New Moon day dedicated to offering oblations (Tharpanam) to ancestors for family wellbeing.',
    significanceTamil: 'முன்னோர்களுக்குத் தர்ப்பணம் அளித்து அவர்தம் ஆசிகளைப் பெறும் புனித அமாவாசை.',
    nutritionDietGuidance: 'Fasting until afternoon Tharpanam. Traditional satvik meal with raw banana (vazhaikkai), sesame, and agathi keerai.',
    fitnessWorkoutGuidance: 'Light mobility and restorative yoga; avoid strenuous maximal lifts.',
  },
  {
    id: 'vinayagar-chaturthi',
    nameEnglish: 'Vinayagar Chaturthi (Ganesh Chaturthi)',
    nameTamil: 'விநாயகர் சதுர்த்தி',
    date: '2026-09-14',
    month: 9,
    day: 14,
    tamilMonth: 'ஆவணி',
    tamilDateApprox: 'ஆவணி 28',
    category: 'Major Festival',
    deity: 'Lord Ganesha',
    significance: 'Celebration of the birth of Lord Ganesha, remover of obstacles and patron of wisdom.',
    significanceTamil: 'முழுமுதற் கடவுளான விநாயகப் பெருமானின் திரு அவதார நன்னாள்.',
    nutritionDietGuidance: 'Steamed Kozhukattai (rice flour with jaggery & coconut stuffing - steamed, not deep-fried), sundal (steamed chickpea snack - high protein).',
    fitnessWorkoutGuidance: 'Shoulder press, overhead barbell presses, and posture-strengthening back workouts.',
  },
  {
    id: 'purattasi-saturday',
    nameEnglish: 'Purattasi Sanikkizhamai (Purattasi Saturdays)',
    nameTamil: 'புரட்டாசி சனிக்கிழமை',
    date: '2026-09-19',
    month: 9,
    day: 19,
    tamilMonth: 'புரட்டாசி',
    tamilDateApprox: 'புரட்டாசி 3',
    category: 'Viratham / Fasting',
    deity: 'Lord Venkateshwara (Balaji)',
    significance: 'Sacred fasting Saturdays of Purattasi month dedicated to Lord Venkateshwara to counter planetary malefic effects.',
    significanceTamil: 'ஏழுமலையானுக்குரிய புரட்டாசி விரத சனிக்கிழமை; மாவிளக்கு ஏற்றி வழிபடும் புனிதம்.',
    nutritionDietGuidance: 'Strict single-meal vegetarian diet (Thaligai): ven pongal, vada, and tulsi teertham. High in clean plant protein.',
    fitnessWorkoutGuidance: 'Mid-intensity bodybuilding workout focusing on control and endurance.',
  },
  {
    id: 'saraswathi-pooja',
    nameEnglish: 'Saraswathi Pooja & Ayudha Pooja',
    nameTamil: 'சரஸ்வதி பூஜை / ஆயுத பூஜை',
    date: '2026-10-19',
    month: 10,
    day: 19,
    tamilMonth: 'ஐப்பசி',
    tamilDateApprox: 'ஐப்பசி 2',
    category: 'Major Festival',
    deity: 'Goddess Saraswathi & Durga',
    significance: 'Honoring knowledge, books, and gym equipment/tools of livelihood with blessings of prosperity.',
    significanceTamil: 'கல்விக்கும் நாம் செய்யும் தொழிலுக்கும் கருவிகளுக்கும் நன்றி செலுத்தும் பூஜை நன்னாள்.',
    nutritionDietGuidance: 'Pori (puffed rice with roasted gram & jaggery) and white chana sundal (high protein, zero deep-frying).',
    fitnessWorkoutGuidance: 'Sanitize and clean your gym equipment and machines; complete a celebratory full-body calibration routine.',
  },
  {
    id: 'vijayadashami',
    nameEnglish: 'Vijayadashami',
    nameTamil: 'விஜயதசமி',
    date: '2026-10-20',
    month: 10,
    day: 20,
    tamilMonth: 'ஐப்பசி',
    tamilDateApprox: 'ஐப்பசி 3',
    category: 'Major Festival',
    deity: 'Goddess Durga',
    significance: 'Triumph of righteousness over evil. Auspicious day to start new ventures, training programs, or skills.',
    significanceTamil: 'தீமையை வென்று நன்மையை நிலைநாட்டிய வெற்றித் திருநாள்; புதிய முயற்சிகளுக்கு நற்பலன் தரும்.',
    nutritionDietGuidance: 'Nutritious festive meal balanced with green vegetables and lentils.',
    fitnessWorkoutGuidance: 'Start a new progressive overload workout cycle or routine split.',
  },
  {
    id: 'deepavali',
    nameEnglish: 'Deepavali (Diwali)',
    nameTamil: 'தீபாவளி',
    date: '2026-11-08',
    month: 11,
    day: 8,
    tamilMonth: 'ஐப்பசி',
    tamilDateApprox: 'ஐப்பசி 22',
    category: 'Major Festival',
    deity: 'Lord Krishna & Goddess Lakshmi',
    significance: 'Festival of Lights, Ganga Snanam oil bath before dawn, celebrating the triumph of divine radiance.',
    significanceTamil: 'கங்கா ஸ்நானமும் தீப ஒளியும் இருள் விலக்கி நல்வாழ்வு தரும் தித்திக்கும் தீபாவளி.',
    nutritionDietGuidance: 'Traditional Deepavali Legiyam (herbal digestive paste with ginger, pepper, cumin, honey) before sweets. Enjoy sweets mindfully within calorie allowances.',
    fitnessWorkoutGuidance: 'High-calorie burn session: 45-minute HIIT or full-body compound circuits.',
  },
  {
    id: 'soorasamharam',
    nameEnglish: 'Skanda Sashti & Soorasamharam',
    nameTamil: 'ஸ்கந்த சஷ்டி விரதம் / சூரசம்ஹாரம்',
    date: '2026-11-15',
    month: 11,
    day: 15,
    tamilMonth: 'கார்த்திகை',
    tamilDateApprox: 'கார்த்திகை 29',
    category: 'Viratham / Fasting',
    deity: 'Lord Murugan',
    significance: 'Culmination of the 6-day fasting viratham depicting Lord Murugan vanquishing ego and ignorance.',
    significanceTamil: 'அகந்தையை அழித்து ஞானத்தை அருளிய முருகனின் சூரசம்ஹார நிறைவுத் திருநாள்.',
    nutritionDietGuidance: 'Millets, pepper rasam, and fruit juices for breaking viratham safely without stomach upset.',
    fitnessWorkoutGuidance: 'Functional core and isometric hold workouts; cultivate supreme discipline.',
  },
  {
    id: 'karthigai-deepam',
    nameEnglish: 'Karthigai Deepam (Thiruvannamalai Maha Deepam)',
    nameTamil: 'கார்த்திகை தீபம்',
    date: '2026-11-23',
    month: 11,
    day: 23,
    tamilMonth: 'கார்த்திகை',
    tamilDateApprox: 'கார்த்திகை 7',
    category: 'Major Festival',
    deity: 'Lord Shiva (Arunachaleswarar)',
    significance: 'Lord Shiva manifesting as the infinite column of cosmic fire (Agni Lingam) at Tiruvannamalai.',
    significanceTamil: 'அண்ணாமலை உச்சியில் ஜோதி வடிவாக ஈசன் காட்சி தரும் திருக்கார்த்திகைத் திருநாள்.',
    nutritionDietGuidance: 'Traditional Pori Urundai (puffed rice balls with jaggery and cardamom) and Appam.',
    fitnessWorkoutGuidance: 'Evening outdoor hill sprint or incline treadmill climb honoring the sacred mountain.',
  },
  {
    id: 'vaikunta-ekadashi',
    nameEnglish: 'Vaikunta Ekadashi',
    nameTamil: 'வைகுண்ட ஏகாதசி',
    date: '2026-12-20',
    month: 12,
    day: 20,
    tamilMonth: 'மார்கழி',
    tamilDateApprox: 'மார்கழி 5',
    category: 'Viratham / Fasting',
    deity: 'Lord Vishnu (Ranganatha)',
    significance: 'Opening of the Paramapada Vaasal (Heaven’s Gate) at Srirangam; supreme fasting day for spiritual liberation.',
    significanceTamil: 'சொர்க்கவாசல் திறக்கும் வைகுண்ட நன்னாள்; மோட்ச ஏகாதசி விரதம் கடைப்பிடிக்கும் புனிதம்.',
    nutritionDietGuidance: 'Complete fast or water/fruit fast. Next day Dwadashi meal must include Agathi keerai (hummingbird tree leaves) and Amla for digestive cleansing.',
    fitnessWorkoutGuidance: 'Rest day or light walking. Conserve physical energy for cellular autophagy and mental focus.',
  },
  {
    id: 'arudra-darisanam',
    nameEnglish: 'Arudra Darisanam',
    nameTamil: 'ஆருத்ரா தரிசனம்',
    date: '2026-12-23',
    month: 12,
    day: 23,
    tamilMonth: 'மார்கழி',
    tamilDateApprox: 'மார்கழி 8',
    category: 'Major Festival',
    deity: 'Lord Nataraja (Chidambaram)',
    significance: 'Cosmic dance of Lord Nataraja on the longest night of the year in Thiruvathirai nakshatra.',
    significanceTamil: 'தில்லை அம்பலத்தில் நடராஜப் பெருமானின் ஆனந்த தாண்டவ தரிசனம்.',
    nutritionDietGuidance: 'Thiruvathirai Kali (steamed rice-jaggery delicacy) and Ezhu Kari Kootu (7-vegetable fiber stew).',
    fitnessWorkoutGuidance: 'Fluid movement, dynamic stretching, mobility, and dance-based cardio.',
  },
];

/**
 * Calculates accurate Tamil Month, Date, and Jovian Year from Gregorian date
 */
export function getTamilDateDetails(date: Date): {
  tamilMonthName: string;
  tamilMonthEnglish: string;
  tamilMonthIndex: number;
  tamilDate: number;
  tamilYearName: string;
  tamilYearEnglish: string;
  tamilDayName: string;
  dayOfWeekEnglish: string;
} {
  const gYear = date.getFullYear();
  const gMonth = date.getMonth() + 1; // 1 - 12
  const gDay = date.getDate();
  const dayOfWeek = date.getDay(); // 0 - 6

  // Ingress approximate transition day in Gregorian month
  // [Gregorian Month: { transitionDay, monthBefore, monthAfter }]
  const ingressTable: Record<
    number,
    { transitionDay: number; before: { nameTamil: string; nameEnglish: string; index: number }; after: { nameTamil: string; nameEnglish: string; index: number } }
  > = {
    1: {
      transitionDay: 15, // Thai starts Jan 15
      before: { nameTamil: 'மார்கழி', nameEnglish: 'Margazhi', index: 9 },
      after: { nameTamil: 'தை', nameEnglish: 'Thai', index: 10 },
    },
    2: {
      transitionDay: 13, // Maasi starts Feb 13
      before: { nameTamil: 'தை', nameEnglish: 'Thai', index: 10 },
      after: { nameTamil: 'மாசி', nameEnglish: 'Maasi', index: 11 },
    },
    3: {
      transitionDay: 15, // Panguni starts Mar 15
      before: { nameTamil: 'மாசி', nameEnglish: 'Maasi', index: 11 },
      after: { nameTamil: 'பங்குனி', nameEnglish: 'Panguni', index: 12 },
    },
    4: {
      transitionDay: 14, // Chithirai starts Apr 14 (Tamil New Year)
      before: { nameTamil: 'பங்குனி', nameEnglish: 'Panguni', index: 12 },
      after: { nameTamil: 'சித்திரை', nameEnglish: 'Chithirai', index: 1 },
    },
    5: {
      transitionDay: 15, // Vaikasi starts May 15
      before: { nameTamil: 'சித்திரை', nameEnglish: 'Chithirai', index: 1 },
      after: { nameTamil: 'வைகாசி', nameEnglish: 'Vaikasi', index: 2 },
    },
    6: {
      transitionDay: 15, // Aani starts Jun 15
      before: { nameTamil: 'வைகாசி', nameEnglish: 'Vaikasi', index: 2 },
      after: { nameTamil: 'ஆனி', nameEnglish: 'Aani', index: 3 },
    },
    7: {
      transitionDay: 16, // Aadi starts Jul 16
      before: { nameTamil: 'ஆனி', nameEnglish: 'Aani', index: 3 },
      after: { nameTamil: 'ஆடி', nameEnglish: 'Aadi', index: 4 },
    },
    8: {
      transitionDay: 17, // Aavani starts Aug 17
      before: { nameTamil: 'ஆடி', nameEnglish: 'Aadi', index: 4 },
      after: { nameTamil: 'ஆவணி', nameEnglish: 'Aavani', index: 5 },
    },
    9: {
      transitionDay: 17, // Purattasi starts Sep 17
      before: { nameTamil: 'ஆவணி', nameEnglish: 'Aavani', index: 5 },
      after: { nameTamil: 'புரட்டாசி', nameEnglish: 'Purattasi', index: 6 },
    },
    10: {
      transitionDay: 18, // Aippasi starts Oct 18
      before: { nameTamil: 'புரட்டாசி', nameEnglish: 'Purattasi', index: 6 },
      after: { nameTamil: 'ஐப்பசி', nameEnglish: 'Aippasi', index: 7 },
    },
    11: {
      transitionDay: 17, // Karthigai starts Nov 17
      before: { nameTamil: 'ஐப்பசி', nameEnglish: 'Aippasi', index: 7 },
      after: { nameTamil: 'கார்த்திகை', nameEnglish: 'Karthigai', index: 8 },
    },
    12: {
      transitionDay: 16, // Margazhi starts Dec 16
      before: { nameTamil: 'கார்த்திகை', nameEnglish: 'Karthigai', index: 8 },
      after: { nameTamil: 'மார்கழி', nameEnglish: 'Margazhi', index: 9 },
    },
  };

  const ingress = ingressTable[gMonth];
  let selectedMonth: { nameTamil: string; nameEnglish: string; index: number };
  let tamilDateNum: number;

  if (gDay >= ingress.transitionDay) {
    selectedMonth = ingress.after;
    tamilDateNum = gDay - ingress.transitionDay + 1;
  } else {
    selectedMonth = ingress.before;
    // Calculate days remaining from previous month
    const prevMonthDays = new Date(gYear, gMonth - 1, 0).getDate();
    const prevIngressTransition = ingressTable[gMonth === 1 ? 12 : gMonth - 1].transitionDay;
    tamilDateNum = prevMonthDays - prevIngressTransition + 1 + gDay;
  }

  // Calculate Tamil 60-year Jovian Cycle Name
  // Base offset: 1987 is Prabhava (Year 0 in cycle)
  let tamilYearIndex = (gYear - 1987) % 60;
  if (tamilYearIndex < 0) tamilYearIndex += 60;
  // If date is before April 14, it belongs to the previous Tamil year
  if (gMonth < 4 || (gMonth === 4 && gDay < 14)) {
    tamilYearIndex = (tamilYearIndex - 1 + 60) % 60;
  }
  const yearObj = TAMIL_YEAR_NAMES[tamilYearIndex] || TAMIL_YEAR_NAMES[39];

  const dayObj = TAMIL_DAYS_OF_WEEK[dayOfWeek];

  return {
    tamilMonthName: selectedMonth.nameTamil,
    tamilMonthEnglish: selectedMonth.nameEnglish,
    tamilMonthIndex: selectedMonth.index,
    tamilDate: tamilDateNum,
    tamilYearName: yearObj.tamil,
    tamilYearEnglish: yearObj.english,
    tamilDayName: dayObj.tamil,
    dayOfWeekEnglish: dayObj.english,
  };
}

/**
 * High-precision astronomical calculation of Sun and Moon ecliptic longitudes (Jean Meeus algorithm)
 */
export function getCelestialAngles(date: Date): { sunLon: number; moonLon: number; elong: number } {
  // Julian Date
  const jd = date.getTime() / 86400000.0 + 2440587.5;
  const T = (jd - 2451545.0) / 36525.0; // Julian centuries since J2000.0

  // Geometric mean longitude of the Sun
  let L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  L0 = ((L0 % 360) + 360) % 360;

  // Mean anomaly of the Sun
  const M = ((357.52911 + 35999.05029 * T - 0.0001537 * T * T) % 360) * (Math.PI / 180);

  // Sun's Equation of the Center
  const C = (1.914602 - 0.004817 * T) * Math.sin(M) + 0.019993 * Math.sin(2 * M);
  const sunLon = ((L0 + C) % 360 + 360) % 360;

  // Moon's mean longitude & fundamental arguments
  const Lp = 218.3164477 + 481267.88123421 * T;
  const D = ((297.8501921 + 445267.1114034 * T) % 360) * (Math.PI / 180);
  const Mm = ((134.9633964 + 477198.8675055 * T) % 360) * (Math.PI / 180);
  const F = ((93.272095 + 483202.0175233 * T) % 360) * (Math.PI / 180);

  // Moon's true longitude including major perturbations
  let moonLon =
    Lp +
    6.288774 * Math.sin(Mm) +
    1.274027 * Math.sin(2 * D - Mm) +
    0.658309 * Math.sin(2 * D) +
    0.213618 * Math.sin(2 * Mm) -
    0.185116 * Math.sin(M) -
    0.114332 * Math.sin(2 * F);
  moonLon = ((moonLon % 360) + 360) % 360;

  // Angular elongation (Moon - Sun)
  const elong = ((moonLon - sunLon) % 360 + 360) % 360;
  return { sunLon, moonLon, elong };
}

/**
 * High-precision bisection search to locate the exact crossing time for a target elongation angle
 */
export function findThithiCrossing(targetDeg: number, centerTime: Date): Date {
  let low = centerTime.getTime() - 36 * 3600 * 1000;
  let high = centerTime.getTime() + 36 * 3600 * 1000;
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const el = getCelestialAngles(new Date(mid)).elong;
    const diff = ((el - targetDeg + 540) % 360) - 180;
    if (diff > 0) high = mid;
    else low = mid;
  }
  return new Date((low + high) / 2);
}

function formatISTDateTime(d: Date): string {
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Calculates Panchangam timings (Nalla Neram, Ragukalam, Yemagandam, Kuligai, Thithi, Nakshatram)
 * with astronomically exact Thithi start and end times.
 */
export function getPanchangamTimings(date: Date): PanchangamTimings {
  const dayOfWeek = date.getDay(); // 0 - 6
  const timings = DAY_TIMINGS_TABLE[dayOfWeek] || DAY_TIMINGS_TABLE[0];

  // Evaluate at local sunrise (~06:00 IST / 00:30 UTC) for Udaya Thithi
  const sunriseDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 30));
  const { elong: elongSunrise, moonLon } = getCelestialAngles(sunriseDate);

  // Evaluate at evening (~18:00 IST / 12:30 UTC) to catch afternoon/evening transitions (e.g. Pournami / Amavasai)
  const eveningDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 30));
  const { elong: elongEvening } = getCelestialAngles(eveningDate);

  let thithiIndex = Math.floor(elongSunrise / 12); // 0 to 29
  const eveningThithiIndex = Math.floor(elongEvening / 12);

  // Prioritize Pournami (14) or Amavasai (29) if active during the day or evening
  if (thithiIndex !== 14 && eveningThithiIndex === 14) {
    thithiIndex = 14;
  } else if (thithiIndex !== 29 && eveningThithiIndex === 29) {
    thithiIndex = 29;
  }

  const isValarpirai = thithiIndex < 15;
  let thithiNameTamil = '';
  let thithiNameEnglish = '';

  if (isValarpirai) {
    if (thithiIndex === 14) {
      thithiNameTamil = 'பௌர்ணமி';
      thithiNameEnglish = 'Pournami';
    } else {
      thithiNameTamil = THITHIS[thithiIndex].nameTamil;
      thithiNameEnglish = THITHIS[thithiIndex].nameEnglish;
    }
  } else {
    if (thithiIndex === 29) {
      thithiNameTamil = 'அமாவாசை';
      thithiNameEnglish = 'Amavasya';
    } else {
      thithiNameTamil = THITHIS[thithiIndex - 15].nameTamil;
      thithiNameEnglish = THITHIS[thithiIndex - 15].nameEnglish;
    }
  }

  // Calculate exact start and end times for this active Thithi
  const targetStart = thithiIndex * 12;
  const targetEnd = ((thithiIndex + 1) % 30) * 12;
  const tStart = findThithiCrossing(targetStart, sunriseDate);
  const tEnd = findThithiCrossing(targetEnd, new Date(tStart.getTime() + 22 * 3600 * 1000));

  const startTimeStr = formatISTDateTime(tStart);
  const endTimeStr = formatISTDateTime(tEnd);
  const timingsTextTamil = `ஆரம்பம்: ${startTimeStr} | முடிவு: ${endTimeStr}`;
  const timingsTextEnglish = `Starts: ${startTimeStr} | Ends: ${endTimeStr}`;

  // Nakshatra determination from sidereal moon position (~27 segments of 13°20')
  // Lahiri Ayanamsha offset: ~24.16° in 2026
  const ayanamsha = 24.16;
  const siderealMoonLon = ((moonLon - ayanamsha) % 360 + 360) % 360;
  const nakshatraIndex = Math.floor(siderealMoonLon / (360 / 27)) % 27;
  const nakshatraObj = NAKSHATRAS[nakshatraIndex] || NAKSHATRAS[0];

  // Yogam (Siddha, Amrutha, Marana) derived from Day + Nakshatra rules
  const yogamType =
    (dayOfWeek + nakshatraIndex) % 3 === 0
      ? 'Amrutha'
      : (dayOfWeek + nakshatraIndex) % 3 === 1
      ? 'Siddha'
      : 'Marana';
  const yogamTamil =
    yogamType === 'Amrutha'
      ? 'அமிர்த யோகம்'
      : yogamType === 'Siddha'
      ? 'சித்த யோகம்'
      : 'மரண யோகம்';

  // Chandrashtamam (8th moon sign): changes every 2.25 days
  const rasiIdx = Math.floor((nakshatraIndex + 8) % 12);
  const chandrashtamam = TAMIL_RASIS[rasiIdx] || TAMIL_RASIS[0];

  return {
    nallaNeramMorning: timings.nallaMorning,
    nallaNeramEvening: timings.nallaEvening,
    gowriNallaNeram: timings.gowri,
    ragukalam: timings.ragu,
    yemagandam: timings.yema,
    kuligai: timings.kuli,
    thithi: {
      nameTamil: thithiNameTamil,
      nameEnglish: thithiNameEnglish,
      paksham: isValarpirai ? 'சுக்ல பட்சம் (Valarpirai)' : 'கிருஷ்ண பட்சம் (Theipirai)',
      startTime: startTimeStr,
      endTime: endTimeStr,
      timingsTextTamil,
      timingsTextEnglish,
    },
    nakshatram: {
      nameTamil: nakshatraObj.nameTamil,
      nameEnglish: nakshatraObj.nameEnglish,
      pada: ((nakshatraIndex * 4 + date.getDate()) % 4) + 1,
    },
    yogam: {
      nameTamil: yogamTamil,
      nameEnglish: `${yogamType} Yogam`,
      type: yogamType as 'Siddha' | 'Amrutha' | 'Marana',
      isAuspicious: yogamType !== 'Marana',
    },
    chandrashtamamRasi: {
      nameTamil: chandrashtamam.nameTamil,
      nameEnglish: chandrashtamam.nameEnglish,
    },
    sunrise: '06:05 AM',
    sunset: '06:20 PM',
  };
}

/**
 * Aggregates complete bilingual calendar day details for a specific Date
 */
export function getCalendarDayInfo(
  date: Date,
  customFestivals: CustomFestivalDoc[] = []
): TamilDateInfo {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  const gregorianDateStr = `${year}-${pad(month)}-${pad(day)}`;

  const tamilDetails = getTamilDateDetails(date);
  const panchangam = getPanchangamTimings(date);

  // Match authentic festivals by YYYY-MM-DD or MM-DD
  const matchedPreloaded = AUTHENTIC_TAMIL_FESTIVALS.filter(
    (f) =>
      f.date === gregorianDateStr ||
      (f.month === month && f.day === day)
  );

  // Match user custom festivals
  const matchedCustom: TamilFestival[] = customFestivals
    .filter((cf) => cf.date === gregorianDateStr)
    .map((cf) => ({
      id: `custom-${cf.id}`,
      nameEnglish: cf.nameEnglish,
      nameTamil: cf.nameTamil || cf.nameEnglish,
      date: cf.date,
      month,
      day,
      category: cf.category as any,
      deity: cf.deity || 'Regional Deity',
      significance: cf.fastingNotes || 'Custom festival / viratham logged by athlete.',
      significanceTamil: cf.fastingNotes || 'பயனரால் சேர்க்கப்பட்ட சிறப்பு விரத / திருவிழா நாள்.',
      nutritionDietGuidance: cf.fastingNotes || 'Follow personalized fasting or meal prep protocol.',
      fitnessWorkoutGuidance: 'Adjust workout intensity to complement fasting schedule.',
      isCustom: true,
    }));

  const allFestivals = [...matchedPreloaded, ...matchedCustom];

  // Specific fasting flags (e.g. Ekadashi, Sashti, Pradosham, Purattasi Saturday)
  const isPurattasiSaturday = tamilDetails.tamilMonthName === 'புரட்டாசி' && date.getDay() === 6;
  const isFastingDay =
    allFestivals.some((f) => f.category === 'Viratham / Fasting') ||
    panchangam.thithi.nameEnglish.includes('Ekadashi') ||
    panchangam.thithi.nameEnglish.includes('Sashti') ||
    isPurattasiSaturday;

  return {
    gregorianDate: gregorianDateStr,
    day,
    month,
    year,
    ...tamilDetails,
    festivals: allFestivals,
    panchangam,
    isSpecialDay: allFestivals.length > 0 || isFastingDay,
    isFastingDay,
  };
}

