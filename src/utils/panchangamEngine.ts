import type { PanchangamTimings } from '../types/calendar';

/**
 * Standard Panchangam Day-of-Week Table for Tamil Nadu.
 * Timings follow standard Tamil Vaakya / Thirukkanitha Panchangam conventions.
 */
interface DayTimingPreset {
  en: string;
  ta: string;
  nallaNeramMorning: string;
  nallaNeramEvening: string;
  gowriNallaNeramMorning: string;
  gowriNallaNeramEvening: string;
  ragukalam: string;
  yemagandam: string;
  kuligai: string;
}

const PANCHANGAM_DAY_TABLE: DayTimingPreset[] = [
  // 0 - Sunday (ஞாயிறு)
  {
    en: 'Sunday',
    ta: 'ஞாயிற்றுக்கிழமை',
    nallaNeramMorning: '07:30 AM - 08:30 AM',
    nallaNeramEvening: '03:15 PM - 04:15 PM',
    gowriNallaNeramMorning: '10:30 AM - 11:30 AM',
    gowriNallaNeramEvening: '01:30 PM - 02:30 PM',
    ragukalam: '04:30 PM - 06:00 PM',
    yemagandam: '12:00 PM - 01:30 PM',
    kuligai: '03:00 PM - 04:30 PM',
  },
  // 1 - Monday (திங்கள்)
  {
    en: 'Monday',
    ta: 'திங்கட்கிழமை',
    nallaNeramMorning: '06:30 AM - 07:30 AM',
    nallaNeramEvening: '04:30 PM - 05:30 PM',
    gowriNallaNeramMorning: '09:15 AM - 10:15 AM',
    gowriNallaNeramEvening: '07:30 PM - 08:30 PM',
    ragukalam: '07:30 AM - 09:00 AM',
    yemagandam: '10:30 AM - 12:00 PM',
    kuligai: '01:30 PM - 03:00 PM',
  },
  // 2 - Tuesday (செவ்வாய்)
  {
    en: 'Tuesday',
    ta: 'செவ்வாய்க்கிழமை',
    nallaNeramMorning: '07:30 AM - 08:30 AM',
    nallaNeramEvening: '04:30 PM - 05:30 PM',
    gowriNallaNeramMorning: '10:30 AM - 11:30 AM',
    gowriNallaNeramEvening: '07:30 PM - 08:30 PM',
    ragukalam: '03:00 PM - 04:30 PM',
    yemagandam: '09:00 AM - 10:30 AM',
    kuligai: '12:00 PM - 01:30 PM',
  },
  // 3 - Wednesday (புதன்)
  {
    en: 'Wednesday',
    ta: 'புதன்கிழமை',
    nallaNeramMorning: '09:15 AM - 10:15 AM',
    nallaNeramEvening: '04:45 PM - 05:45 PM',
    gowriNallaNeramMorning: '10:30 AM - 11:30 AM',
    gowriNallaNeramEvening: '06:30 PM - 07:30 PM',
    ragukalam: '12:00 PM - 01:30 PM',
    yemagandam: '07:30 AM - 09:00 AM',
    kuligai: '10:30 AM - 12:00 PM',
  },
  // 4 - Thursday (வியாழன்)
  {
    en: 'Thursday',
    ta: 'வியாழக்கிழமை',
    nallaNeramMorning: '09:15 AM - 10:15 AM',
    nallaNeramEvening: '04:30 PM - 05:30 PM',
    gowriNallaNeramMorning: '12:15 PM - 01:15 PM',
    gowriNallaNeramEvening: '06:30 PM - 07:30 PM',
    ragukalam: '01:30 PM - 03:00 PM',
    yemagandam: '06:00 AM - 07:30 AM',
    kuligai: '09:00 AM - 10:30 AM',
  },
  // 5 - Friday (வெள்ளி)
  {
    en: 'Friday',
    ta: 'வெள்ளிக்கிழமை',
    nallaNeramMorning: '09:15 AM - 10:15 AM',
    nallaNeramEvening: '04:30 PM - 05:30 PM',
    gowriNallaNeramMorning: '12:15 PM - 01:15 PM',
    gowriNallaNeramEvening: '06:30 PM - 07:30 PM',
    ragukalam: '10:30 AM - 12:00 PM',
    yemagandam: '03:00 PM - 04:30 PM',
    kuligai: '07:30 AM - 09:00 AM',
  },
  // 6 - Saturday (சனி)
  {
    en: 'Saturday',
    ta: 'சனிக்கிழமை',
    nallaNeramMorning: '07:30 AM - 08:30 AM',
    nallaNeramEvening: '04:30 PM - 05:30 PM',
    gowriNallaNeramMorning: '10:30 AM - 11:30 AM',
    gowriNallaNeramEvening: '07:30 PM - 08:30 PM',
    ragukalam: '09:00 AM - 10:30 AM',
    yemagandam: '01:30 PM - 03:00 PM',
    kuligai: '06:00 AM - 07:30 AM',
  },
];

/**
 * 27 Tamil Nakshatrams (நட்சத்திரங்கள்)
 */
const NAKSHATRAMS = [
  { en: 'Ashwini', ta: 'அஸ்வினி', rasiEn: 'Mesham', rasiTa: 'மேஷம்' },
  { en: 'Bharani', ta: 'பரணி', rasiEn: 'Mesham', rasiTa: 'மேஷம்' },
  { en: 'Karthigai', ta: 'கார்த்திகை', rasiEn: 'Rishabham', rasiTa: 'ரிஷபம்' },
  { en: 'Rohini', ta: 'ரோகிணி', rasiEn: 'Rishabham', rasiTa: 'ரிஷபம்' },
  { en: 'Mrigashirsham', ta: 'மிருகசீரிஷம்', rasiEn: 'Mithunam', rasiTa: 'மிதுனம்' },
  { en: 'Thiruvathirai', ta: 'திருவாதிரை', rasiEn: 'Mithunam', rasiTa: 'மிதுனம்' },
  { en: 'Punarpoosam', ta: 'புனர்பூசம்', rasiEn: 'Katagam', rasiTa: 'கடகம்' },
  { en: 'Poosam', ta: 'பூசம்', rasiEn: 'Katagam', rasiTa: 'கடகம்' },
  { en: 'Aayilyam', ta: 'ஆயில்யம்', rasiEn: 'Katagam', rasiTa: 'கடகம்' },
  { en: 'Magam', ta: 'மகம்', rasiEn: 'Simmam', rasiTa: 'சிம்மம்' },
  { en: 'Pooram', ta: 'பூரம்', rasiEn: 'Simmam', rasiTa: 'சிம்மம்' },
  { en: 'Uthiram', ta: 'உத்திரம்', rasiEn: 'Kanni', rasiTa: 'கன்னி' },
  { en: 'Hastham', ta: 'அஸ்தம்', rasiEn: 'Kanni', rasiTa: 'கன்னி' },
  { en: 'Chithirai', ta: 'சித்திரை', rasiEn: 'Tula', rasiTa: 'துலாம்' },
  { en: 'Swathi', ta: 'சுவாதி', rasiEn: 'Tula', rasiTa: 'துலாம்' },
  { en: 'Visagam', ta: 'விசாகம்', rasiEn: 'Vrichigam', rasiTa: 'விருச்சிகம்' },
  { en: 'Anusham', ta: 'அனுஷம்', rasiEn: 'Vrichigam', rasiTa: 'விருச்சிகம்' },
  { en: 'Kettai', ta: 'கேட்டை', rasiEn: 'Vrichigam', rasiTa: 'விருச்சிகம்' },
  { en: 'Moolam', ta: 'மூலம்', rasiEn: 'Dhanusu', rasiTa: 'தனுசு' },
  { en: 'Pooradam', ta: 'பூராடம்', rasiEn: 'Dhanusu', rasiTa: 'தனுசு' },
  { en: 'Uthiradam', ta: 'உத்திராடம்', rasiEn: 'Magaram', rasiTa: 'மகரம்' },
  { en: 'Thiruvonam', ta: 'திருவோணம்', rasiEn: 'Magaram', rasiTa: 'மகரம்' },
  { en: 'Avittam', ta: 'அவிட்டம்', rasiEn: 'Kumbham', rasiTa: 'கும்பம்' },
  { en: 'Sadayam', ta: 'சதயம்', rasiEn: 'Kumbham', rasiTa: 'கும்பம்' },
  { en: 'Poorattathi', ta: 'பூரட்டாதி', rasiEn: 'Meenam', rasiTa: 'மீனம்' },
  { en: 'Uthirattathi', ta: 'உத்திரட்டாதி', rasiEn: 'Meenam', rasiTa: 'மீனம்' },
  { en: 'Revathi', ta: 'ரேவதி', rasiEn: 'Meenam', rasiTa: 'மீனம்' },
];

/**
 * 30 Tithis in Lunar Cycle (திதிகள்)
 */
const TITHI_NAMES = [
  { en: 'Shukla Paksha Prathamai', ta: 'வளர்பிறை பிரதமை' },
  { en: 'Shukla Paksha Dwitiyai', ta: 'வளர்பிறை துவிதியை' },
  { en: 'Shukla Paksha Tritiyai', ta: 'வளர்பிறை திருதியை' },
  { en: 'Shukla Paksha Chaturthi', ta: 'வளர்பிறை சதுர்த்தி' },
  { en: 'Shukla Paksha Panchami', ta: 'வளர்பிறை பஞ்சமி' },
  { en: 'Shukla Paksha Sashti', ta: 'வளர்பிறை சஷ்டி' },
  { en: 'Shukla Paksha Saptami', ta: 'வளர்பிறை சப்தமி' },
  { en: 'Shukla Paksha Ashtami', ta: 'வளர்பிறை அஷ்டமி' },
  { en: 'Shukla Paksha Navami', ta: 'வளர்பிறை நவமி' },
  { en: 'Shukla Paksha Dasami', ta: 'வளர்பிறை தசமி' },
  { en: 'Shukla Paksha Ekadashi', ta: 'வளர்பிறை ஏகாதசி' },
  { en: 'Shukla Paksha Dwadashi', ta: 'வளர்பிறை துவாதசி' },
  { en: 'Shukla Paksha Trayodashi', ta: 'வளர்பிறை திரயோதசி' },
  { en: 'Shukla Paksha Chaturdashi', ta: 'வளர்பிறை சதுர்த்தசி' },
  { en: 'Pournami (Full Moon)', ta: 'பௌர்ணமி (முழு நிலவு)' },
  { en: 'Krishna Paksha Prathamai', ta: 'தேய்பிறை பிரதமை' },
  { en: 'Krishna Paksha Dwitiyai', ta: 'தேய்பிறை துவிதியை' },
  { en: 'Krishna Paksha Tritiyai', ta: 'தேய்பிறை திருதியை' },
  { en: 'Krishna Paksha Chaturthi', ta: 'தேய்பிறை சங்கடஹர சதுர்த்தி' },
  { en: 'Krishna Paksha Panchami', ta: 'தேய்பிறை பஞ்சமி' },
  { en: 'Krishna Paksha Sashti', ta: 'தேய்பிறை சஷ்டி' },
  { en: 'Krishna Paksha Saptami', ta: 'தேய்பிறை சப்தமி' },
  { en: 'Krishna Paksha Ashtami', ta: 'தேய்பிறை அஷ்டமி' },
  { en: 'Krishna Paksha Navami', ta: 'தேய்பிறை நவமி' },
  { en: 'Krishna Paksha Dasami', ta: 'தேய்பிறை தசமி' },
  { en: 'Krishna Paksha Ekadashi', ta: 'தேய்பிறை ஏகாதசி' },
  { en: 'Krishna Paksha Dwadashi', ta: 'தேய்பிறை துவாதசி' },
  { en: 'Krishna Paksha Trayodashi', ta: 'தேய்பிறை திரயோதசி (பிரதோஷம்)' },
  { en: 'Krishna Paksha Chaturdashi', ta: 'தேய்பிறை மாத சிவராத்திரி' },
  { en: 'Amavasai (New Moon)', ta: 'அமாவாசை (பித்ரு நாள்)' },
];

/**
 * 12 Chandrashtamam pairings (When moon is in 8th house from natal sign)
 */
const RASI_ORDER = [
  { en: 'Mesham', ta: 'மேஷம்' },
  { en: 'Rishabham', ta: 'ரிஷபம்' },
  { en: 'Mithunam', ta: 'மிதுனம்' },
  { en: 'Katagam', ta: 'கடகம்' },
  { en: 'Simmam', ta: 'சிம்மம்' },
  { en: 'Kanni', ta: 'கன்னி' },
  { en: 'Tula', ta: 'துலாம்' },
  { en: 'Vrichigam', ta: 'விருச்சிகம்' },
  { en: 'Dhanusu', ta: 'தனுசு' },
  { en: 'Magaram', ta: 'மகரம்' },
  { en: 'Kumbham', ta: 'கும்பம்' },
  { en: 'Meenam', ta: 'மீனம்' },
];

/**
 * Calculate traditional Panchangam timings for any Gregorian date string (YYYY-MM-DD) or Date object.
 */
export function getPanchangamTimings(inputDate: Date | string): PanchangamTimings {
  const d = typeof inputDate === 'string' ? new Date(inputDate + 'T00:00:00') : new Date(inputDate);
  const dateStr = d.toISOString().split('T')[0];
  const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat

  const dayData = PANCHANGAM_DAY_TABLE[dayOfWeek];

  // Astronomical approximation based on synodic month (~29.530588 days)
  // Known reference new moon: Jan 18, 2026 (epoch timestamp: 1768780800000)
  const refNewMoonEpoch = new Date('2026-01-18T18:00:00Z').getTime();
  const currentEpoch = d.getTime();
  const diffDays = (currentEpoch - refNewMoonEpoch) / (1000 * 60 * 60 * 24);

  // Lunar age in cycle (0 to 29.53)
  const synodicMonth = 29.530588853;
  let lunarAge = ((diffDays % synodicMonth) + synodicMonth) % synodicMonth;
  const tithiIndex = Math.min(29, Math.floor((lunarAge / synodicMonth) * 30));
  const tithi = TITHI_NAMES[tithiIndex];

  // Sidereal Moon transit through 27 Nakshatrams (~27.321661 days)
  // Known reference: Jan 18, 2026 Moon in Shravana / Thiruvonam (Nakshatra index 21)
  const siderealMonth = 27.321661;
  const nakshatraCycle = ((diffDays % siderealMonth) + siderealMonth) % siderealMonth;
  const nakshatraIndex = Math.floor((nakshatraCycle / siderealMonth) * 27) % 27;
  const nakshatra = NAKSHATRAMS[nakshatraIndex];

  // Chandrashtamam is the sign which is 6 signs ahead (i.e. moon is in 8th house from it: (index + 5) % 12)
  const moonRasiIndex = RASI_ORDER.findIndex((r) => r.en === nakshatra.rasiEn);
  const chandrashtamamIndex = (moonRasiIndex + 5) % 12;
  const chandrashtamam = RASI_ORDER[chandrashtamamIndex];

  // Auspicious summary text
  const auspiciousSummary =
    dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 4 || dayOfWeek === 5
      ? 'Auspicious day for physical training, starting healthy routines, and devotional vows.'
      : 'Optimal for consistent maintenance, disciplined recovery, and mental grounding.';

  return {
    date: dateStr,
    dayOfWeekEn: dayData.en,
    dayOfWeekTa: dayData.ta,
    nallaNeramMorning: dayData.nallaNeramMorning,
    nallaNeramEvening: dayData.nallaNeramEvening,
    gowriNallaNeramMorning: dayData.gowriNallaNeramMorning,
    gowriNallaNeramEvening: dayData.gowriNallaNeramEvening,
    ragukalam: dayData.ragukalam,
    yemagandam: dayData.yemagandam,
    kuligai: dayData.kuligai,
    tithiEn: tithi.en,
    tithiTa: tithi.ta,
    nakshatramEn: nakshatra.en,
    nakshatramTa: nakshatra.ta,
    chandrashtamamRasiEn: chandrashtamam.en,
    chandrashtamamRasiTa: chandrashtamam.ta,
    auspiciousSummary,
  };
}
