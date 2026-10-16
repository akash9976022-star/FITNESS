import React from 'react';
import type { TamilDateInfo } from '../../utils/tamilCalendar';

// Authentic, verified sacred image assets
import muruganImg from '../../assets/calendar/murugan.jpg';
import shivaratriImg from '../../assets/calendar/shivaratri.jpg';
import pradoshamImg from '../../assets/calendar/pradosham.jpg';
import natarajarImg from '../../assets/calendar/natarajar.jpg';
import ganeshaImg from '../../assets/calendar/ganesha.jpg';
import vishnuImg from '../../assets/calendar/vishnu.jpg';
import pournamiImg from '../../assets/calendar/pournami.jpg';
import amavasaiImg from '../../assets/calendar/amavasai.jpg';
import diyaImg from '../../assets/calendar/diya.jpg';

export type ThumbnailType =
  | 'amavasai'
  | 'pournami'
  | 'shivaratri'
  | 'pradosham'
  | 'murugan'
  | 'natarajar'
  | 'ganesha'
  | 'diya'
  | 'vishnu'
  | 'shiva'; // Backwards compatibility alias for shivaratri

export interface CalendarThumbnailInfo {
  type: ThumbnailType;
  titleTamil: string;
  titleEnglish: string;
  reason: string;
}

/**
 * Authentic, verified sacred image mappings for Tamil sacred events,
 * festivals, and celestial phases. Bundled directly for instant 0ms offline loading.
 */
export const SACRED_IMAGE_URLS: Record<ThumbnailType, string> = {
  // Lord Murugan with Vel & Peacock (authentic Batu Caves golden Murugan statue & Vel)
  murugan: muruganImg,
  // Maha Shivaratri: Authentic sacred black stone Shiva Lingam with Vibhuti Tripundra & Kumkum
  shivaratri: shivaratriImg,
  shiva: shivaratriImg,
  // Pradosham: Sacred Nandi Bull at Brihadisvara Temple facing Shiva sanctum
  pradosham: pradoshamImg,
  // Arudra Darshanam: Lord Nataraja cosmic dance Chola bronze sculpture
  natarajar: natarajarImg,
  // Pournami: Radiant glowing Full Moon photograph
  pournami: pournamiImg,
  // Amavasai: Dark celestial New Moon crescent over deep sky
  amavasai: amavasaiImg,
  // Vinayagar Chaturthi: Lord Ganesha festive idol with garlands & red canopy
  ganesha: ganeshaImg,
  // Deepavali / Karthigai Deepam: Traditional terracotta clay Diya oil lamp flame
  diya: diyaImg,
  // Lord Vishnu / Perumal: Authentic Lord Vishnu Chola bronze with Sudarshana Chakra & Shankha
  vishnu: vishnuImg,
};

/**
 * Maps Tamil date info, panchangam thithi/nakshatra, and festivals
 * to specific authentic visual sacred thumbnails with strict differentiation
 * between Maha Shivaratri (Lord Shiva/Lingam) and Pradosham (Sacred Nandhi & Shiva).
 */
export const getCalendarDayThumbnail = (dayInfo: TamilDateInfo): CalendarThumbnailInfo | null => {
  if (!dayInfo) return null;

  const festIds = (dayInfo.festivals || []).map((f) => f.id.toLowerCase());
  const festNames = (dayInfo.festivals || [])
    .map((f) => `${f.nameEnglish} ${f.nameTamil}`.toLowerCase())
    .join(' ');

  const thithiEn = (dayInfo.panchangam?.thithi?.nameEnglish || '').toLowerCase();
  const thithiTa = dayInfo.panchangam?.thithi?.nameTamil || '';
  const nakshatraEn = (dayInfo.panchangam?.nakshatram?.nameEnglish || '').toLowerCase();
  const isPurattasiSaturday =
    dayInfo.dayOfWeekEnglish === 'Saturday' && dayInfo.tamilMonthEnglish === 'Purattasi';

  // Exact astronomical Thithi start and end time string (in IST)
  const timeSpan = dayInfo.panchangam?.thithi?.timingsTextTamil
    ? ` • ${dayInfo.panchangam.thithi.timingsTextTamil}`
    : '';

  // 1. Maha Shivaratri (Strict Shiva Lingam Worship) - Prioritized on Shivaratri days
  const isMahaShivaratri =
    festIds.some((id) => id.includes('shivaratri') || id === 'maha-shivaratri') ||
    festNames.includes('சிவராத்திரி') ||
    festNames.includes('shivaratri') ||
    (thithiEn.includes('chaturdashi') && dayInfo.tamilMonthEnglish?.toLowerCase() === 'maasi');

  if (isMahaShivaratri) {
    return {
      type: 'shivaratri',
      titleTamil: 'மகா சிவராத்திரி & சிவலிங்கம்',
      titleEnglish: 'Maha Shivaratri (Lord Shiva & Lingam)',
      reason: `மகா சிவராத்திரி விரதம் & லிங்கோத்பவர் ஜோதி வழிபாடு${timeSpan}`,
    };
  }

  // 2. Pradosham (Lord Shiva's sacred vehicle Nandhi seated facing Shiva shrine)
  // Differentiated from Maha Shivaratri (Trayodashi thithi or Pradosham festival)
  const isPradosham =
    festIds.some((id) => id.includes('pradosham')) ||
    festNames.includes('பிரதோஷம்') ||
    festNames.includes('pradosham') ||
    thithiEn.includes('trayodashi') ||
    thithiEn.includes('thrayodashi') ||
    thithiTa.includes('திரயோதசி');

  if (isPradosham) {
    return {
      type: 'pradosham',
      titleTamil: 'பிரதோஷம் & நந்தியம் பெருமான்',
      titleEnglish: 'Pradosham (Sacred Nandhi & Shiva)',
      reason: `பிரதோஷ கால நந்தி தேவர் & ஈஸ்வரர் சிறப்பு அபிஷேக விரதம்${timeSpan}`,
    };
  }

  // 3. Arudra Darshanam / Lord Natarajar Dancing Posture
  if (
    festIds.some((id) => id.includes('arudra') || id.includes('nataraja')) ||
    festNames.includes('arudra') ||
    festNames.includes('ஆருத்ரா') ||
    festNames.includes('நடராஜர்') ||
    nakshatraEn.includes('thiruvathirai') ||
    nakshatraEn.includes('arudra')
  ) {
    return {
      type: 'natarajar',
      titleTamil: 'நடராஜர் ஆனந்த தாண்டவம்',
      titleEnglish: 'Lord Nataraja (Arudra Darshanam)',
      reason: `ஆருத்ரா தரிசனம் / திருவாதிரை மார்கழி நடராஜர் உற்சவம்${timeSpan}`,
    };
  }

  // 4. Lord Murugan: Skanda Sashti, Karthigai, Thai Poosam, Vaikasi Visakam
  if (
    festIds.some(
      (id) =>
        id.includes('sashti') ||
        id.includes('soorasamharam') ||
        id.includes('poosam') ||
        id.includes('visakam') ||
        id.includes('panguni-uthiram')
    ) ||
    festNames.includes('sashti') ||
    festNames.includes('சஷ்டி') ||
    festNames.includes('பூசம்') ||
    festNames.includes('விசாகம்') ||
    festNames.includes('முருகன்') ||
    thithiEn.includes('sashti') ||
    nakshatraEn.includes('karthigai') ||
    nakshatraEn.includes('krithika') ||
    nakshatraEn.includes('poosam')
  ) {
    return {
      type: 'murugan',
      titleTamil: 'முருகப்பெருமான் & ஞானவேல் மயில்',
      titleEnglish: 'Lord Murugan (Vel & Peacock)',
      reason: `கந்த சஷ்டி / கார்த்திகை / தைப்பூசம் விரதம்${timeSpan}`,
    };
  }

  // 5. Vinayagar Chaturthi / Lord Ganesha
  if (
    festIds.some((id) => id.includes('vinayagar') || id.includes('ganesh')) ||
    festNames.includes('விநாயகர்') ||
    festNames.includes('சதுர்த்தி') ||
    festNames.includes('chaturthi') ||
    thithiEn.includes('chaturthi')
  ) {
    return {
      type: 'ganesha',
      titleTamil: 'முழுமுதற் கடவுள் விநாயகர்',
      titleEnglish: 'Lord Ganesha (Vinayagar)',
      reason: `விநாயகர் சதுர்த்தி / சங்கடஹர சதுர்த்தி${timeSpan}`,
    };
  }

  // 6. Deepavali & Karthigai Deepam: Diya / Sacred Lamp
  if (
    festIds.some(
      (id) => id.includes('deepam') || id.includes('deepavali') || id.includes('diwali')
    ) ||
    festNames.includes('தீபம்') ||
    festNames.includes('தீபாவளி') ||
    festNames.includes('கார்த்திகை தீபம்')
  ) {
    return {
      type: 'diya',
      titleTamil: 'மங்கள அகல் விளக்கு தீபம்',
      titleEnglish: 'Sacred Clay Diya (Deepam)',
      reason: `தீபாவளி / திருக்கார்த்திகை தீபத் திருநாள்${timeSpan}`,
    };
  }

  // 7. Lord Vishnu / Perumal: Ekadashi & Purattasi Saturdays
  if (
    festIds.some(
      (id) =>
        id.includes('ekadashi') ||
        id.includes('purattasi-saturday') ||
        id.includes('vaikunta') ||
        id.includes('krishna') ||
        id.includes('rama')
    ) ||
    festNames.includes('ஏகாதசி') ||
    festNames.includes('வைகுண்ட') ||
    festNames.includes('பெருமாள்') ||
    festNames.includes('புரட்டாசி') ||
    thithiEn.includes('ekadashi') ||
    thithiTa.includes('ஏகாதசி') ||
    isPurattasiSaturday
  ) {
    return {
      type: 'vishnu',
      titleTamil: 'திருமால் திருநாமம் & சங்கு சக்கரம்',
      titleEnglish: 'Lord Vishnu (Thiruman & Shankha-Chakra)',
      reason: `வைகுண்ட ஏகாதசி / புரட்டாசி சனிக்கிழமை பெருமாள் விரதம்${timeSpan}`,
    };
  }

  // 8. Pournami (Full Moon)
  const isPournami =
    festIds.some((id) => id.includes('pournami') || id.includes('purnima')) ||
    festNames.includes('பௌர்ணமி') ||
    festNames.includes('பவுர்ணமி') ||
    thithiEn === 'pournami' ||
    thithiTa === 'பௌர்ணமி' ||
    thithiTa.startsWith('பௌர்ணமி');

  if (isPournami) {
    return {
      type: 'pournami',
      titleTamil: 'பிரகாச பௌர்ணமி முழுநிலவு',
      titleEnglish: 'Radiant Full Moon (Pournami)',
      reason: `பௌர்ணமி விரதம் & கிரிவலம்${timeSpan}`,
    };
  }

  // 9. Amavasai (New Moon)
  const isAmavasai =
    festIds.some((id) => id.includes('amavasai') || id.includes('amavasya')) ||
    festNames.includes('அமாவாசை') ||
    thithiEn === 'amavasya' ||
    thithiEn === 'amavasai' ||
    thithiTa === 'அமாவாசை' ||
    thithiTa.startsWith('அமாவாசை');

  if (isAmavasai) {
    return {
      type: 'amavasai',
      titleTamil: 'புனித அமாவாசை',
      titleEnglish: 'Sacred New Moon (Amavasai)',
      reason: `முன்னோர் தர்ப்பண அமாவாசை புனிதம்${timeSpan}`,
    };
  }

  return null;
};

interface CalendarDayThumbnailProps {
  info: CalendarThumbnailInfo;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

export const CalendarDayThumbnail: React.FC<CalendarDayThumbnailProps> = ({
  info,
  size = 'sm',
  className = '',
  showTooltip = true,
}) => {
  const [imgError, setImgError] = React.useState(false);

  // Reset image error state whenever thumbnail event type changes
  React.useEffect(() => {
    setImgError(false);
  }, [info.type]);

  // Sizing: sm (w-7 h-7 for calendar cells), md (w-9/10 for cards), lg (w-12/14 for modals)
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9 sm:w-10 sm:h-10',
    lg: 'w-12 h-12 sm:w-14 sm:h-14',
  }[size];

  const imageUrl = SACRED_IMAGE_URLS[info.type];

  const renderVisual = () => {
    switch (info.type) {
      /* ==================== 1. MAHA SHIVARATRI (SHIVA LINGAM & DIVINE AURA) ==================== */
      case 'shivaratri':
      case 'shiva':
        return (
          <div
            className={`rounded-full bg-gradient-to-tr from-slate-950 via-indigo-950 to-blue-900 p-0.5 shadow-sm border border-slate-200 dark:border-slate-800 ring-1 ring-cyan-400/50 flex items-center justify-center text-white select-none ${sizeClasses}`}
          >
            <svg viewBox="0 0 36 36" className="w-full h-full drop-shadow-sm" fill="none">
              <defs>
                <linearGradient id="shivaCosmicGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#030712" />
                  <stop offset="0.5" stopColor="#1E1B4B" />
                  <stop offset="1" stopColor="#1E3A8A" />
                </linearGradient>
                <radialGradient id="shivaDivineAura" cx="0.5" cy="0.45" r="0.5">
                  <stop stopColor="#38BDF8" stopOpacity="0.55" />
                  <stop offset="1" stopColor="#1E1B4B" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="lingamShine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#64748B" />
                  <stop offset="0.3" stopColor="#F1F5F9" />
                  <stop offset="0.7" stopColor="#94A3B8" />
                  <stop offset="1" stopColor="#334155" />
                </linearGradient>
              </defs>
              {/* Cosmic Deep Sky Circle */}
              <circle cx="18" cy="18" r="16" fill="url(#shivaCosmicGrad)" />
              <circle cx="18" cy="16" r="14" fill="url(#shivaDivineAura)" />
              {/* Divine Golden Trishul Rising Behind */}
              <path d="M18 5 L18 31" stroke="#FACC15" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M14 9 C14 12, 16 13, 18 13 C20 13, 22 12, 22 9" stroke="#FACC15" strokeWidth="1" fill="none" />
              <path d="M13 7 L14 9 M23 7 L22 9" stroke="#FACC15" strokeWidth="1" strokeLinecap="round" />
              {/* Damaru Tied to Trishul */}
              <path d="M16 10 L20 12 L16 12 L20 10 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="0.4" />
              {/* Sacred Yoni Peedam Base */}
              <path d="M9 24 C9 22.5, 27 22.5, 27 24 L25 28 C25 28.5, 11 28.5, 11 28 Z" fill="#475569" stroke="#64748B" strokeWidth="0.5" />
              <path d="M25 24.5 L29 25 L25 26.5 Z" fill="#64748B" />
              {/* Sacred Shiva Lingam Cylindrical Dome */}
              <rect x="13.5" y="11" width="9" height="13.5" rx="4.5" fill="url(#lingamShine)" stroke="#CBD5E1" strokeWidth="0.5" />
              {/* Sacred White Vibhuti Tripundra Stripes */}
              <path d="M15 15 H21 M15 16.5 H21 M15 18 H21" stroke="#FFFFFF" strokeWidth="0.7" strokeLinecap="round" />
              {/* Sacred Red Kumkum Bindu Tilak */}
              <circle cx="18" cy="16.5" r="0.9" fill="#DC2626" />
              {/* Sacred Crescent Moon on Lingam Crown */}
              <path d="M19 7 C21.5 7.5, 22.5 10, 21.5 11.5 C21 10.5, 19.5 9, 18.5 8 Z" fill="#F8FAFC" />
            </svg>
          </div>
        );

      /* ==================== 2. PRADOSHAM (SACRED NANDHI BULL FACING SHIVA SHRINE) ==================== */
      case 'pradosham':
        return (
          <div
            className={`rounded-full bg-gradient-to-tr from-amber-950 via-orange-950 to-slate-900 p-0.5 shadow-sm border border-slate-200 dark:border-slate-800 ring-1 ring-amber-400/60 flex items-center justify-center text-white select-none ${sizeClasses}`}
          >
            <svg viewBox="0 0 36 36" className="w-full h-full drop-shadow-sm" fill="none">
              <defs>
                <linearGradient id="pradoshamSandhyaGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#451A03" />
                  <stop offset="0.5" stopColor="#78350F" />
                  <stop offset="1" stopColor="#0F172A" />
                </linearGradient>
                <radialGradient id="pradoshamAura" cx="0.75" cy="0.45" r="0.5">
                  <stop stopColor="#F59E0B" stopOpacity="0.4" />
                  <stop offset="1" stopColor="#451A03" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* Twilight Sandhya Background */}
              <circle cx="18" cy="18" r="16" fill="url(#pradoshamSandhyaGrad)" />
              <circle cx="27" cy="17" r="12" fill="url(#pradoshamAura)" />

              {/* Shiva Shrine: Small Sacred Shiva Lingam on Right */}
              <path d="M24 23 C24 22, 31 22, 31 23 L30 26 L25 26 Z" fill="#475569" />
              <rect x="25.5" y="16" width="4.5" height="7.5" rx="2.2" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.4" />
              <path d="M26.2 18.5 H29.2 M26.2 19.5 H29.2" stroke="#FFFFFF" strokeWidth="0.5" />
              <circle cx="27.7" cy="19" r="0.5" fill="#EF4444" />
              {/* Miniature Trishul beside Lingam */}
              <path d="M31.5 13 L31.5 25" stroke="#FACC15" strokeWidth="0.8" strokeLinecap="round" />
              <path d="M30 15 C30 17, 31.5 17, 31.5 17 C31.5 17, 33 17, 33 15" stroke="#FACC15" strokeWidth="0.6" fill="none" />
              {/* Ghee Deepam Lamp Flame between Nandhi & Shrine */}
              <path d="M22 24 C22 25.5, 24 25.5, 24 24 Z" fill="#CA8A04" />
              <circle cx="23" cy="22.5" r="0.8" fill="#F59E0B" />
              <circle cx="23" cy="22.5" r="0.4" fill="#FEF08A" />

              {/* Sacred Seated Nandhi Bull (Facing Right towards Shiva) */}
              {/* Nandhi Body */}
              <path
                d="M6 25 C6 21, 10 20, 14 20 C17 20, 19 22, 19 25 C19 27, 8 27, 6 25 Z"
                fill="#F8FAFC"
                stroke="#CBD5E1"
                strokeWidth="0.5"
              />
              {/* Tucked front leg */}
              <ellipse cx="17.5" cy="25" rx="2" ry="1.2" fill="#E2E8F0" />
              {/* Distinctive Nandhi Hump (Thimil) */}
              <path d="M10 20 C10 15.5, 13.5 15.5, 14.5 19 Z" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="0.4" />
              {/* Nandhi Neck & Head */}
              <path
                d="M13 19 C14 16, 16 13, 19 14 C20.5 14.5, 21.5 16, 20.5 17.5 C19.5 18.5, 17 19.5, 15 20 Z"
                fill="#FFFFFF"
                stroke="#CBD5E1"
                strokeWidth="0.5"
              />
              {/* Upward Curving Horns */}
              <path d="M17 13.5 C16.5 10, 17.5 9, 18 9 C18.2 10.5, 18 12.5, 17.5 14 Z" fill="#CA8A04" stroke="#A16207" strokeWidth="0.4" />
              <path d="M18.5 13.5 C18.5 10.5, 19.5 9.5, 20 9.5 C20 11, 19.5 12.5, 19 14 Z" fill="#EAB308" stroke="#CA8A04" strokeWidth="0.4" />
              {/* Ear */}
              <path d="M16 15 C14.5 15, 14.5 17, 16 16.5 Z" fill="#CBD5E1" />
              {/* Serene Eye */}
              <circle cx="19.5" cy="15.5" r="0.6" fill="#0F172A" />
              {/* Sacred Golden Bell Necklace / Ghanta Garland around Neck */}
              <path d="M14.5 18 C16 19, 18 19, 19 18" stroke="#EAB308" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="16" cy="19.8" r="0.7" fill="#FACC15" />
              <circle cx="17.5" cy="20" r="0.8" fill="#FDE047" />
              <circle cx="19" cy="19.5" r="0.6" fill="#FACC15" />
              {/* Red Tilak on Nandhi Forehead */}
              <circle cx="19.2" cy="14" r="0.4" fill="#DC2626" />
            </svg>
          </div>
        );

      /* ==================== 3. LORD MURUGAN (DIVINE VEL & ROYAL PEACOCK) ==================== */
      case 'murugan':
        return (
          <div
            className={`rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 p-0.5 shadow-sm border border-slate-200 dark:border-slate-800 ring-1 ring-amber-300 dark:ring-amber-500/50 flex items-center justify-center text-white select-none ${sizeClasses}`}
          >
            <svg viewBox="0 0 36 36" className="w-full h-full drop-shadow-sm" fill="none">
              <defs>
                <linearGradient id="muruganSunGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#F97316" />
                  <stop offset="0.6" stopColor="#D97706" />
                  <stop offset="1" stopColor="#991B1B" />
                </linearGradient>
                <radialGradient id="peacockEye" cx="0.5" cy="0.5" r="0.5">
                  <stop stopColor="#FDE047" />
                  <stop offset="0.4" stopColor="#0284C7" />
                  <stop offset="0.75" stopColor="#047857" />
                  <stop offset="1" stopColor="#1E3A8A" />
                </radialGradient>
              </defs>
              {/* Auspicious Saffron Background */}
              <circle cx="18" cy="18" r="16" fill="url(#muruganSunGrad)" />

              {/* Peacock Feather Fan Arch behind Vel */}
              <path d="M8 20 C8 12, 14 8, 20 8 C25 8, 28 11, 28 15 C28 20, 24 23, 19 23" stroke="#059669" strokeWidth="1" strokeDasharray="1.5 1" fill="none" opacity="0.85" />
              <circle cx="13" cy="13" r="3.2" fill="url(#peacockEye)" />
              <circle cx="13" cy="13" r="1.3" fill="#1E3A8A" />
              <circle cx="13" cy="13" r="0.6" fill="#38BDF8" />

              {/* Sacred Jnana Vel (Golden Spearhead with Central Ruby) */}
              <path
                d="M18 4 C14.5 9, 13 14, 15 18 C16.2 20.2, 17.2 21.2, 18 22 C18.8 21.2, 19.8 20.2, 21 18 C23 14, 21.5 9, 18 4 Z"
                fill="#FFD700"
                stroke="#B8860B"
                strokeWidth="0.8"
              />
              <path d="M18 6 L18 21.5" stroke="#CA8A04" strokeWidth="0.8" strokeLinecap="round" />
              <path d="M18 21 L18 32" stroke="#FFD700" strokeWidth="1.6" strokeLinecap="round" />
              {/* Sacred Ruby Bindu on Vel */}
              <circle cx="18" cy="13.5" r="1.3" fill="#E11D48" stroke="#FFE4E6" strokeWidth="0.4" />
            </svg>
          </div>
        );

      /* ==================== 4. LORD NATARAJA (ARUDRA COSMIC DANCE) ==================== */
      case 'natarajar':
        return (
          <div
            className={`rounded-full bg-gradient-to-tr from-amber-700 via-orange-600 to-yellow-500 p-0.5 shadow-sm border border-slate-200 dark:border-slate-800 ring-1 ring-amber-300 dark:ring-amber-400 flex items-center justify-center text-white select-none ${sizeClasses}`}
          >
            <svg viewBox="0 0 36 36" className="w-full h-full drop-shadow-sm" fill="none">
              <defs>
                <linearGradient id="natCosmicGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#450A0A" />
                  <stop offset="0.6" stopColor="#78350F" />
                  <stop offset="1" stopColor="#B45309" />
                </linearGradient>
              </defs>
              <circle cx="18" cy="18" r="16" fill="url(#natCosmicGrad)" />
              {/* Prabha Mandala Fiery Flame Halo */}
              <circle cx="18" cy="18" r="13.5" stroke="#FDE047" strokeWidth="1.2" strokeDasharray="2.2 1.4" />
              {/* Lotus Base */}
              <path d="M13 29 H23 L21 31 H15 Z" fill="#CA8A04" />
              {/* Nataraja Head & Crown */}
              <circle cx="18" cy="10" r="2.2" fill="#FEF08A" stroke="#B45309" strokeWidth="0.4" />
              <path d="M14 9 L17 10 M19 10 L22 9" stroke="#FDE047" strokeWidth="0.8" strokeLinecap="round" />
              {/* Divine Four Arms with Damaru & Fire */}
              <path d="M12 14 L18 15 L24 13.5" stroke="#FEF08A" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="12" cy="13.5" r="1" fill="#F59E0B" />
              <circle cx="24" cy="13" r="1.1" fill="#EF4444" />
              {/* Torso & Cosmic Raised Leg (Ananda Tandava) */}
              <path d="M18 12 L18 19.5 L24 23" stroke="#FEF08A" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M18 19.5 L16 26.5 L18 26.5" stroke="#FEF08A" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
        );

      /* ==================== 5. VINAYAGAR CHATURTHI (LORD GANESHA) ==================== */
      case 'ganesha':
        return (
          <div
            className={`rounded-full bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 p-0.5 shadow-sm border border-slate-200 dark:border-slate-800 ring-1 ring-amber-300 dark:ring-amber-400 flex items-center justify-center select-none ${sizeClasses}`}
          >
            <svg viewBox="0 0 36 36" className="w-full h-full drop-shadow-sm" fill="none">
              <defs>
                <linearGradient id="ganeshaAuspiciousGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#991B1B" />
                  <stop offset="0.6" stopColor="#B91C1C" />
                  <stop offset="1" stopColor="#D97706" />
                </linearGradient>
              </defs>
              <circle cx="18" cy="18" r="16" fill="url(#ganeshaAuspiciousGrad)" />
              {/* Golden Crown */}
              <path d="M15 8 L18 5 L21 8 Z" fill="#FDE047" stroke="#CA8A04" strokeWidth="0.5" />
              {/* Ganesha Sacred Face & Curved Trunk (Vakratunda) */}
              <path
                d="M18 8 C13 8, 11 13, 13 18 C14 20, 16 23, 16 26 C16 28, 14 28, 13 26"
                stroke="#FEF08A"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              {/* Broad Ears */}
              <path d="M13 12 C9 12, 8 16, 12 17" stroke="#FEF08A" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M22 12 C26 12, 27 16, 23 17" stroke="#FEF08A" strokeWidth="1.6" strokeLinecap="round" />
              {/* Golden Modak in Trunk Palm */}
              <circle cx="21" cy="24" r="2.2" fill="#FEF08A" stroke="#B45309" strokeWidth="0.6" />
              {/* Sacred Red Chandanam & Tilak */}
              <path d="M16 11 H20" stroke="#DC2626" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="18" cy="12" r="0.9" fill="#DC2626" />
            </svg>
          </div>
        );

      /* ==================== 6. DEEPAVALI / KARTHIGAI DEEPAM (CLAY DIYA OIL LAMP) ==================== */
      case 'diya':
        return (
          <div
            className={`rounded-full bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-400 p-0.5 shadow-sm border border-slate-200 dark:border-slate-800 ring-1 ring-amber-300 dark:ring-amber-400 flex items-center justify-center select-none ${sizeClasses}`}
          >
            <svg viewBox="0 0 36 36" className="w-full h-full drop-shadow-sm" fill="none">
              <defs>
                <linearGradient id="diyaWarmGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#78350F" />
                  <stop offset="0.6" stopColor="#B45309" />
                  <stop offset="1" stopColor="#EA580C" />
                </linearGradient>
              </defs>
              <circle cx="18" cy="18" r="16" fill="url(#diyaWarmGrad)" />
              {/* Terracotta/Brass Diya Bowl */}
              <path
                d="M9 22 C9 26, 27 26, 27 22 C27 20, 9 20, 9 22 Z"
                fill="#FDE047"
                stroke="#CA8A04"
                strokeWidth="0.8"
              />
              <path d="M13 25 L11 29 H25 L23 25 Z" fill="#EAB308" />
              {/* Radiating Flame Aura */}
              <circle cx="18" cy="15" r="7" fill="#F59E0B" opacity="0.25" />
              {/* Outer Red Flame */}
              <path
                d="M18 7 C14 13, 14 18, 18 19 C22 18, 22 13, 18 7 Z"
                fill="#EF4444"
              />
              {/* Inner Radiant Golden Flame */}
              <path
                d="M18 10 C16 14, 16 17, 18 18 C20 17, 20 14, 18 10 Z"
                fill="#FEF08A"
              />
            </svg>
          </div>
        );

      /* ==================== 7. LORD VISHNU / PERUMAL (THIRUMAN & CHAKRA) ==================== */
      case 'vishnu':
        return (
          <div
            className={`rounded-full bg-gradient-to-tr from-blue-900 via-indigo-900 to-amber-700 p-0.5 shadow-sm border border-slate-200 dark:border-slate-800 ring-1 ring-amber-400/60 flex items-center justify-center select-none ${sizeClasses}`}
          >
            <svg viewBox="0 0 36 36" className="w-full h-full drop-shadow-sm" fill="none">
              <defs>
                <linearGradient id="vishnuCelestialGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0F172A" />
                  <stop offset="0.5" stopColor="#1E3A8A" />
                  <stop offset="1" stopColor="#4338CA" />
                </linearGradient>
              </defs>
              <circle cx="18" cy="18" r="16" fill="url(#vishnuCelestialGrad)" />
              {/* Sacred Urdhva Pundra Thiruman (White U) */}
              <path
                d="M12 9 L15 25 L18 27 L21 25 L24 9 L21.5 9 L19 22 L17 22 L14.5 9 Z"
                fill="#FFFFFF"
                stroke="#CBD5E1"
                strokeWidth="0.5"
              />
              {/* Central Sacred Red Srichurnam Line */}
              <rect x="17" y="9" width="2" height="17" rx="1" fill="#DC2626" />
              {/* Sacred Shankha (Conch) on Left */}
              <circle cx="9" cy="18" r="2.8" stroke="#FDE047" strokeWidth="0.9" fill="#1E293B" />
              <path d="M8 17 L10 19 M7 18 L11 18" stroke="#FDE047" strokeWidth="0.6" />
              {/* Sacred Sudarshana Chakra on Right */}
              <circle cx="27" cy="18" r="2.8" stroke="#FDE047" strokeWidth="0.9" strokeDasharray="1.5 1" fill="#1E293B" />
              <circle cx="27" cy="18" r="1" fill="#F59E0B" />
            </svg>
          </div>
        );

      /* ==================== 8. POURNAMI (RADIANT GLOWING FULL MOON) ==================== */
      case 'pournami':
        return (
          <div
            className={`rounded-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-amber-950 p-0.5 shadow-sm border border-slate-200 dark:border-slate-800 ring-1 ring-amber-300 dark:ring-amber-400 flex items-center justify-center select-none ${sizeClasses}`}
          >
            <svg viewBox="0 0 36 36" className="w-full h-full drop-shadow" fill="none">
              <defs>
                <radialGradient id="pournamiPhotorealisticGlow" cx="0.5" cy="0.5" r="0.5" fx="0.4" fy="0.4">
                  <stop stopColor="#FFFBEB" />
                  <stop offset="0.6" stopColor="#FEF3C7" />
                  <stop offset="0.85" stopColor="#FDE68A" />
                  <stop offset="1" stopColor="#F59E0B" />
                </radialGradient>
              </defs>
              {/* Radiant Space Background */}
              <circle cx="18" cy="18" r="16" fill="#020617" />
              {/* Outer Golden Aura Ring */}
              <circle cx="18" cy="18" r="15" fill="#FDE68A" opacity="0.3" />
              {/* Full Moon Disc */}
              <circle cx="18" cy="18" r="13" fill="url(#pournamiPhotorealisticGlow)" stroke="#FDE68A" strokeWidth="0.8" />
              {/* Photorealistic Lunar Maria / Crater Details */}
              <circle cx="14" cy="14" r="2.4" fill="#D97706" opacity="0.3" />
              <circle cx="21" cy="19" r="3.2" fill="#B45309" opacity="0.25" />
              <circle cx="16" cy="22" r="1.6" fill="#D97706" opacity="0.35" />
              <circle cx="21" cy="13" r="1.4" fill="#B45309" opacity="0.25" />
            </svg>
          </div>
        );

      /* ==================== 9. AMAVASAI (DARK NEW MOON & CRESCENT OVER DARK SKY) ==================== */
      case 'amavasai':
      default:
        return (
          <div
            className={`rounded-full bg-gradient-to-tr from-slate-950 via-slate-900 to-zinc-900 p-0.5 shadow-sm border border-slate-200 dark:border-slate-800 ring-1 ring-slate-700 dark:ring-slate-600 flex items-center justify-center select-none ${sizeClasses}`}
          >
            <svg viewBox="0 0 36 36" className="w-full h-full" fill="none">
              {/* Deep Space Dark Sky */}
              <circle cx="18" cy="18" r="16" fill="#090D16" />
              {/* Darkened Moon Silhouette */}
              <circle cx="18" cy="18" r="13" fill="#0F172A" stroke="#1E293B" strokeWidth="0.5" />
              {/* Delicate Radiant Silver Crescent Moon Edge */}
              <path
                d="M23 8 C15 8, 9 13, 9 21 C9 26, 13 30, 18 31 C13 29, 12 23, 14 17 C16 12, 19 9, 23 8 Z"
                fill="#E2E8F0"
              />
              {/* Distant Twinkling Constellation Stars */}
              <circle cx="26" cy="13" r="0.8" fill="#F8FAFC" />
              <circle cx="25" cy="22" r="0.6" fill="#CBD5E1" />
              <circle cx="20" cy="26" r="0.7" fill="#94A3B8" />
              <circle cx="28" cy="18" r="0.5" fill="#E2E8F0" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-110 ${className}`}
      title={showTooltip ? `${info.titleTamil} • ${info.titleEnglish} (${info.reason})` : undefined}
    >
      {!imgError && imageUrl ? (
        <div
          className={`relative overflow-hidden rounded-full border border-amber-400/70 dark:border-amber-400/60 shadow-sm ring-1 ring-amber-400/30 bg-slate-950 flex items-center justify-center flex-shrink-0 select-none ${sizeClasses}`}
        >
          <img
            src={imageUrl}
            alt={info.titleEnglish}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover rounded-full"
          />
        </div>
      ) : (
        renderVisual()
      )}
    </div>
  );
};

export default CalendarDayThumbnail;
