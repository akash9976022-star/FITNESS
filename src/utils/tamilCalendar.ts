import type { TamilDate } from '../types/calendar';

export interface TamilMonthMetadata {
  index: number;
  nameEn: string;
  nameTa: string;
  zodiacEn: string;
  zodiacTa: string;
  approxStartMonth: number; // 0-indexed Gregorian month (0 = Jan)
  approxStartDay: number;
}

export const TAMIL_MONTHS: TamilMonthMetadata[] = [
  { index: 1, nameEn: 'Chithirai', nameTa: 'சித்திரை', zodiacEn: 'Aries', zodiacTa: 'மேஷம்', approxStartMonth: 3, approxStartDay: 14 },
  { index: 2, nameEn: 'Vaikasi', nameTa: 'வைகாசி', zodiacEn: 'Taurus', zodiacTa: 'ரிஷபம்', approxStartMonth: 4, approxStartDay: 15 },
  { index: 3, nameEn: 'Aani', nameTa: 'ஆனி', zodiacEn: 'Gemini', zodiacTa: 'மிதுனம்', approxStartMonth: 5, approxStartDay: 15 },
  { index: 4, nameEn: 'Aadi', nameTa: 'ஆடி', zodiacEn: 'Cancer', zodiacTa: 'கடகம்', approxStartMonth: 6, approxStartDay: 16 },
  { index: 5, nameEn: 'Aavani', nameTa: 'ஆவணி', zodiacEn: 'Leo', zodiacTa: 'சிம்மம்', approxStartMonth: 7, approxStartDay: 17 },
  { index: 6, nameEn: 'Purattasi', nameTa: 'புரட்டாசி', zodiacEn: 'Virgo', zodiacTa: 'கன்னி', approxStartMonth: 8, approxStartDay: 17 },
  { index: 7, nameEn: 'Aippasi', nameTa: 'ஐப்பசி', zodiacEn: 'Libra', zodiacTa: 'துலாம்', approxStartMonth: 9, approxStartDay: 17 },
  { index: 8, nameEn: 'Karthigai', nameTa: 'கார்த்திகை', zodiacEn: 'Scorpio', zodiacTa: 'விருச்சிகம்', approxStartMonth: 10, approxStartDay: 16 },
  { index: 9, nameEn: 'Margazhi', nameTa: 'மார்கழி', zodiacEn: 'Sagittarius', zodiacTa: 'தனுசு', approxStartMonth: 11, approxStartDay: 16 },
  { index: 10, nameEn: 'Thai', nameTa: 'தை', zodiacEn: 'Capricorn', zodiacTa: 'மகரம்', approxStartMonth: 0, approxStartDay: 14 },
  { index: 11, nameEn: 'Maasi', nameTa: 'மாசி', zodiacEn: 'Aquarius', zodiacTa: 'கும்பம்', approxStartMonth: 1, approxStartDay: 13 },
  { index: 12, nameEn: 'Panguni', nameTa: 'பங்குனி', zodiacEn: 'Pisces', zodiacTa: 'மீனம்', approxStartMonth: 2, approxStartDay: 14 },
];

export const TAMIL_DAYS_OF_WEEK = [
  { en: 'Sunday', ta: 'ஞாயிறு', shortEn: 'Sun', shortTa: 'ஞா' },
  { en: 'Monday', ta: 'திங்கள்', shortEn: 'Mon', shortTa: 'தி' },
  { en: 'Tuesday', ta: 'செவ்வாய்', shortEn: 'Tue', shortTa: 'செ' },
  { en: 'Wednesday', ta: 'புதன்', shortEn: 'Wed', shortTa: 'பு' },
  { en: 'Thursday', ta: 'வியாழன்', shortEn: 'Thu', shortTa: 'வி' },
  { en: 'Friday', ta: 'வெள்ளி', shortEn: 'Fri', shortTa: 'வெ' },
  { en: 'Saturday', ta: 'சனி', shortEn: 'Sat', shortTa: 'ச' },
];

/**
 * Transition dates for 2026 & 2027 Tamil calendar (exact solar ingress / Sankranti days).
 */
interface IngressDate {
  year: number;
  monthIndex: number; // 1 to 12
  gregorianMonth: number; // 1 to 12
  gregorianDay: number;
}

const SOLAR_INGRESS_TABLE: IngressDate[] = [
  // 2026
  { year: 2026, monthIndex: 10, gregorianMonth: 1, gregorianDay: 14 }, // Thai 1
  { year: 2026, monthIndex: 11, gregorianMonth: 2, gregorianDay: 13 }, // Maasi 1
  { year: 2026, monthIndex: 12, gregorianMonth: 3, gregorianDay: 14 }, // Panguni 1
  { year: 2026, monthIndex: 1, gregorianMonth: 4, gregorianDay: 14 },  // Chithirai 1 (Puthandu)
  { year: 2026, monthIndex: 2, gregorianMonth: 5, gregorianDay: 15 },  // Vaikasi 1
  { year: 2026, monthIndex: 3, gregorianMonth: 6, gregorianDay: 15 },  // Aani 1
  { year: 2026, monthIndex: 4, gregorianMonth: 7, gregorianDay: 16 },  // Aadi 1
  { year: 2026, monthIndex: 5, gregorianMonth: 8, gregorianDay: 17 },  // Aavani 1
  { year: 2026, monthIndex: 6, gregorianMonth: 9, gregorianDay: 17 },  // Purattasi 1
  { year: 2026, monthIndex: 7, gregorianMonth: 10, gregorianDay: 17 }, // Aippasi 1
  { year: 2026, monthIndex: 8, gregorianMonth: 11, gregorianDay: 16 }, // Karthigai 1
  { year: 2026, monthIndex: 9, gregorianMonth: 12, gregorianDay: 16 }, // Margazhi 1

  // 2027
  { year: 2027, monthIndex: 10, gregorianMonth: 1, gregorianDay: 14 }, // Thai 1
  { year: 2027, monthIndex: 11, gregorianMonth: 2, gregorianDay: 13 }, // Maasi 1
  { year: 2027, monthIndex: 12, gregorianMonth: 3, gregorianDay: 14 }, // Panguni 1
  { year: 2027, monthIndex: 1, gregorianMonth: 4, gregorianDay: 14 },  // Chithirai 1 (Puthandu)
  { year: 2027, monthIndex: 2, gregorianMonth: 5, gregorianDay: 15 },  // Vaikasi 1
  { year: 2027, monthIndex: 3, gregorianMonth: 6, gregorianDay: 15 },  // Aani 1
  { year: 2027, monthIndex: 4, gregorianMonth: 7, gregorianDay: 17 },  // Aadi 1
  { year: 2027, monthIndex: 5, gregorianMonth: 8, gregorianDay: 17 },  // Aavani 1
  { year: 2027, monthIndex: 6, gregorianMonth: 9, gregorianDay: 17 },  // Purattasi 1
  { year: 2027, monthIndex: 7, gregorianMonth: 10, gregorianDay: 17 }, // Aippasi 1
  { year: 2027, monthIndex: 8, gregorianMonth: 11, gregorianDay: 16 }, // Karthigai 1
  { year: 2027, monthIndex: 9, gregorianMonth: 12, gregorianDay: 16 }, // Margazhi 1
];

/**
 * Calculate Tamil Date from Gregorian Date
 */
export function getTamilDate(inputDate: Date | string): TamilDate {
  const d = typeof inputDate === 'string' ? new Date(inputDate + 'T00:00:00') : new Date(inputDate);
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  const day = d.getDate();
  const dayOfWeekIndex = d.getDay(); // 0-6

  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // Find the prevailing Tamil Year name
  // April 14, 2026 is Puthandu (start of Parabhava year)
  let tamilYearEn = 'Visvavasu';
  let tamilYearTa = 'விசுவாவசு';
  if (year === 2026) {
    if (month > 4 || (month === 4 && day >= 14)) {
      tamilYearEn = 'Parabhava';
      tamilYearTa = 'பராபவ';
    } else {
      tamilYearEn = 'Visvavasu';
      tamilYearTa = 'விசுவாவசு';
    }
  } else if (year >= 2027) {
    if (month > 4 || (month === 4 && day >= 14)) {
      tamilYearEn = 'Plavanga';
      tamilYearTa = 'பிலவங்க';
    } else {
      tamilYearEn = 'Parabhava';
      tamilYearTa = 'பராபவ';
    }
  }

  // Find the active Tamil month & day
  // Check against ingress table
  let activeMonthIndex = 1;

  // Find the latest ingress that is on or before this date
  const ingressList = SOLAR_INGRESS_TABLE.filter(
    (item) => item.year === year || item.year === year - 1
  );

  let currentIngress: IngressDate | null = null;
  for (let i = 0; i < ingressList.length; i++) {
    const item = ingressList[i];
    const ingressDate = new Date(item.year, item.gregorianMonth - 1, item.gregorianDay);
    if (d >= ingressDate) {
      if (!currentIngress || ingressDate > new Date(currentIngress.year, currentIngress.gregorianMonth - 1, currentIngress.gregorianDay)) {
        currentIngress = item;
      }
    }
  }

  if (currentIngress) {
    activeMonthIndex = currentIngress.monthIndex;
    const ingressStart = new Date(currentIngress.year, currentIngress.gregorianMonth - 1, currentIngress.gregorianDay);
    const diffTime = d.getTime() - ingressStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const tamilDay = diffDays + 1;

    const monthMeta = TAMIL_MONTHS.find((m) => m.index === activeMonthIndex) || TAMIL_MONTHS[0];

    return {
      gregorianDate: dateStr,
      tamilYearEn,
      tamilYearTa,
      tamilMonthEn: monthMeta.nameEn,
      tamilMonthTa: monthMeta.nameTa,
      tamilMonthIndex: activeMonthIndex,
      tamilDay: Math.max(1, tamilDay),
      dayOfWeekEn: TAMIL_DAYS_OF_WEEK[dayOfWeekIndex].en,
      dayOfWeekTa: TAMIL_DAYS_OF_WEEK[dayOfWeekIndex].ta,
    };
  }

  // Fallback estimation
  const fallbackMeta = TAMIL_MONTHS[0];
  return {
    gregorianDate: dateStr,
    tamilYearEn,
    tamilYearTa,
    tamilMonthEn: fallbackMeta.nameEn,
    tamilMonthTa: fallbackMeta.nameTa,
    tamilMonthIndex: 1,
    tamilDay: day,
    dayOfWeekEn: TAMIL_DAYS_OF_WEEK[dayOfWeekIndex].en,
    dayOfWeekTa: TAMIL_DAYS_OF_WEEK[dayOfWeekIndex].ta,
  };
}

/**
 * Format bilingual Tamil/English date string
 */
export function formatBilingualDate(inputDate: Date | string): {
  englishFormatted: string;
  tamilFormatted: string;
} {
  const td = getTamilDate(inputDate);
  const d = typeof inputDate === 'string' ? new Date(inputDate + 'T00:00:00') : new Date(inputDate);

  const englishFormatted = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const tamilFormatted = `${td.tamilMonthTa} ${td.tamilDay}, ${td.tamilYearTa} (${td.dayOfWeekTa})`;

  return { englishFormatted, tamilFormatted };
}
