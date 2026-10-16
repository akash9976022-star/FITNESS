import React from 'react';
import type { TamilDateInfo } from '../../utils/tamilCalendar';

export type ThumbnailType =
  | 'murugan'
  | 'shiva'
  | 'natarajar'
  | 'pournami'
  | 'amavasai'
  | 'vishnu'
  | 'ganesha'
  | 'diya';

export interface CalendarThumbnailInfo {
  type: ThumbnailType;
  titleTamil: string;
  titleEnglish: string;
  reason: string;
}

/**
 * Maps Tamil date info, panchangam thithi/nakshatra, and festivals
 * to specific authentic visual sacred thumbnails.
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

  // 1. Arudra Darshanam / Lord Natarajar
  if (
    festIds.some((id) => id.includes('arudra') || id.includes('nataraja')) ||
    festNames.includes('arudra') ||
    festNames.includes('ஆருத்ரா') ||
    nakshatraEn.includes('thiruvathirai') ||
    nakshatraEn.includes('arudra')
  ) {
    return {
      type: 'natarajar',
      titleTamil: 'நடராஜர் ஆனந்த தாண்டவம்',
      titleEnglish: 'Lord Nataraja (Arudra)',
      reason: 'ஆருத்ரா தரிசனம் / திருவாதிரை நடராஜர் உற்சவம்',
    };
  }

  // 2. Lord Murugan: Skanda Sashti, Karthigai, Thai Poosam, Vaikasi Visakam
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
    thithiEn.includes('sashti') ||
    nakshatraEn.includes('karthigai') ||
    nakshatraEn.includes('krithika') ||
    nakshatraEn.includes('poosam')
  ) {
    return {
      type: 'murugan',
      titleTamil: 'முருகப்பெருமான் & ஞானவேல்',
      titleEnglish: 'Lord Murugan (Vel & Peacock)',
      reason: 'கந்த சஷ்டி / கார்த்திகை / தைப்பூசம் விரதம்',
    };
  }

  // 3. Lord Shiva & Nandhi: Maha Shivaratri & Pradosham
  if (
    festIds.some((id) => id.includes('shivaratri') || id.includes('pradosham')) ||
    festNames.includes('சிவராத்திரி') ||
    festNames.includes('பிரதோஷம்') ||
    festNames.includes('shivaratri') ||
    thithiEn.includes('thrayodashi') ||
    thithiEn.includes('chaturdashi')
  ) {
    return {
      type: 'shiva',
      titleTamil: 'சிவபெருமான் & நந்தி',
      titleEnglish: 'Lord Shiva & Sacred Nandhi',
      reason: 'மகா சிவராத்திரி / பிரதோஷ சிவ விரதம்',
    };
  }

  // 4. Vinayagar Chaturthi / Lord Ganesha
  if (
    festIds.some((id) => id.includes('vinayagar') || id.includes('ganesh')) ||
    festNames.includes('விநாயகர்') ||
    festNames.includes('chaturthi') ||
    thithiEn.includes('chaturthi')
  ) {
    return {
      type: 'ganesha',
      titleTamil: 'முழுமுதற் கடவுள் விநாயகர்',
      titleEnglish: 'Lord Ganesha',
      reason: 'விநாயகர் சதுர்த்தி / சங்கடஹர சதுர்த்தி',
    };
  }

  // 5. Deepavali & Karthigai Deepam: Diya / Sacred Lamp
  if (
    festIds.some((id) => id.includes('deepam') || id.includes('deepavali') || id.includes('diwali')) ||
    festNames.includes('தீபம்') ||
    festNames.includes('தீபாவளி')
  ) {
    return {
      type: 'diya',
      titleTamil: 'மங்கள கார்த்திகை தீபம்',
      titleEnglish: 'Sacred Diya (Deepam)',
      reason: 'தீபாவளி / திருக்கார்த்திகை தீபத் திருநாள்',
    };
  }

  // 6. Lord Vishnu / Perumal: Ekadashi & Purattasi Saturdays
  if (
    festIds.some((id) => id.includes('ekadashi') || id.includes('purattasi-saturday')) ||
    festNames.includes('ஏகாதசி') ||
    festNames.includes('வைகுண்ட') ||
    festNames.includes('பெருமாள்') ||
    thithiEn.includes('ekadashi') ||
    thithiTa.includes('ஏகாதசி') ||
    isPurattasiSaturday
  ) {
    return {
      type: 'vishnu',
      titleTamil: 'திருமால் திருநாமம் & சங்கு சக்கரம்',
      titleEnglish: 'Lord Vishnu (Thiruman & Shankha)',
      reason: 'வைகுண்ட ஏகாதசி / புரட்டாசி விரத சனிக்கிழமை',
    };
  }

  // 7. Pournami (Full Moon)
  if (
    festIds.some((id) => id.includes('pournami') || id.includes('purnima')) ||
    festNames.includes('பௌர்ணமி') ||
    thithiEn.includes('pournami') ||
    thithiEn.includes('purnima') ||
    thithiTa.includes('பௌர்ணமி')
  ) {
    return {
      type: 'pournami',
      titleTamil: 'புனித பௌர்ணமி',
      titleEnglish: 'Full Moon (Pournami)',
      reason: 'கிரிவலம் மற்றும் பௌர்ணமி சிறப்பு வழிபாடு',
    };
  }

  // 8. Amavasai (No Moon)
  if (
    festIds.some((id) => id.includes('amavasai') || id.includes('amavasya')) ||
    festNames.includes('அமாவாசை') ||
    thithiEn.includes('amavasai') ||
    thithiEn.includes('amavasya') ||
    thithiTa.includes('அமாவாசை')
  ) {
    return {
      type: 'amavasai',
      titleTamil: 'புனித அமாவாசை',
      titleEnglish: 'New Moon (Amavasai)',
      reason: 'முன்னோர் தர்ப்பண அமாவாசை புனிதம்',
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
  const sizeClasses = {
    sm: 'w-5 h-5 sm:w-6 sm:h-6',
    md: 'w-7 h-7 sm:w-8 sm:h-8',
    lg: 'w-10 h-10 sm:w-12 sm:h-12',
  }[size];

  const renderVisual = () => {
    switch (info.type) {
      /* ==================== 1. LORD MURUGAN (VEL & PEACOCK FEATHER) ==================== */
      case 'murugan':
        return (
          <div
            className={`rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 p-0.5 shadow-sm border border-amber-300 dark:border-amber-500/50 flex items-center justify-center text-white select-none ${sizeClasses}`}
          >
            <svg viewBox="0 0 36 36" className="w-full h-full drop-shadow-sm" fill="none">
              {/* Peacock Aura Background */}
              <circle cx="18" cy="18" r="16" fill="url(#muruganGrad)" />
              {/* Sacred Vel Spear */}
              <path
                d="M18 4 C15 9, 13 14, 15 18 C16 20, 17 21, 18 22 C19 21, 20 20, 21 18 C23 14, 21 9, 18 4 Z"
                fill="#FFD700"
                stroke="#B8860B"
                strokeWidth="0.8"
              />
              <path d="M18 10 L18 32" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" />
              {/* Sacred Bindu */}
              <circle cx="18" cy="13" r="1.2" fill="#E11D48" />
              <defs>
                <linearGradient id="muruganGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#F97316" />
                  <stop offset="0.6" stopColor="#D97706" />
                  <stop offset="1" stopColor="#0D9488" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        );

      /* ==================== 2. LORD SHIVA & NANDHI ==================== */
      case 'shiva':
        return (
          <div
            className={`rounded-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-900 p-0.5 shadow-sm border border-cyan-400/50 flex items-center justify-center text-white select-none ${sizeClasses}`}
          >
            <svg viewBox="0 0 36 36" className="w-full h-full drop-shadow-sm" fill="none">
              <circle cx="18" cy="18" r="16" fill="url(#shivaGrad)" />
              {/* Sacred Shiva Lingam */}
              <rect x="13" y="10" width="10" height="15" rx="5" fill="#E2E8F0" />
              {/* Sacred Tripundra Stripes */}
              <path d="M14.5 14 H21.5 M14.5 16 H21.5 M14.5 18 H21.5" stroke="#94A3B8" strokeWidth="0.8" />
              <circle cx="18" cy="16" r="1" fill="#DC2626" />
              {/* Sacred Crescent Moon on Crown */}
              <path
                d="M19 6 C21 6, 22.5 8, 22 10 C21 9, 19.5 8.5, 19 6 Z"
                fill="#F8FAFC"
              />
              {/* Yoni Peedam base */}
              <path d="M10 24 C10 23, 26 23, 26 24 L24 28 L12 28 Z" fill="#64748B" />
              <defs>
                <linearGradient id="shivaGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0F172A" />
                  <stop offset="1" stopColor="#1E3A8A" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        );

      /* ==================== 3. LORD NATARAJA (COSMIC DANCE) ==================== */
      case 'natarajar':
        return (
          <div
            className={`rounded-full bg-gradient-to-tr from-amber-700 via-orange-600 to-yellow-500 p-0.5 shadow-sm border border-amber-300 dark:border-amber-400 flex items-center justify-center text-white select-none ${sizeClasses}`}
          >
            <svg viewBox="0 0 36 36" className="w-full h-full drop-shadow-sm" fill="none">
              <circle cx="18" cy="18" r="16" fill="url(#natGrad)" />
              {/* Prabha Mandala Flame Ring */}
              <circle cx="18" cy="18" r="13" stroke="#FDE047" strokeWidth="1.2" strokeDasharray="2 1.5" />
              {/* Nataraja Silhouette Dancing Pose */}
              <circle cx="18" cy="10" r="2.2" fill="#FEF08A" />
              {/* Torso & Raised Leg */}
              <path d="M18 12 L18 20 L23 23" stroke="#FEF08A" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M18 20 L16 27 L18 27" stroke="#FEF08A" strokeWidth="1.8" strokeLinecap="round" />
              {/* Dynamic 4 Hands with Damaru & Fire */}
              <path d="M12 15 L18 16 L24 14" stroke="#FEF08A" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="24" cy="13" r="1.2" fill="#EF4444" />
              <defs>
                <linearGradient id="natGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#78350F" />
                  <stop offset="1" stopColor="#B45309" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        );

      /* ==================== 4. POURNAMI (GLOWING FULL MOON) ==================== */
      case 'pournami':
        return (
          <div
            className={`rounded-full bg-gradient-to-tr from-amber-200 via-yellow-100 to-white p-0.5 shadow-md shadow-amber-400/30 border border-amber-300 dark:border-amber-400 flex items-center justify-center select-none ${sizeClasses}`}
          >
            <svg viewBox="0 0 36 36" className="w-full h-full drop-shadow" fill="none">
              {/* Radiant Moon Glow */}
              <circle cx="18" cy="18" r="16" fill="url(#pournamiGlow)" />
              <circle cx="18" cy="18" r="14" fill="#FEF3C7" stroke="#FDE68A" strokeWidth="0.8" />
              {/* Craters & Maria */}
              <circle cx="14" cy="14" r="2.5" fill="#FCD34D" opacity="0.6" />
              <circle cx="21" cy="19" r="3.2" fill="#FCD34D" opacity="0.5" />
              <circle cx="16" cy="22" r="1.8" fill="#FCD34D" opacity="0.7" />
              <circle cx="22" cy="13" r="1.5" fill="#FCD34D" opacity="0.5" />
              <defs>
                <radialGradient id="pournamiGlow" cx="0.5" cy="0.5" r="0.5" fx="0.4" fy="0.4">
                  <stop stopColor="#FFFBEB" />
                  <stop offset="0.7" stopColor="#FDE68A" />
                  <stop offset="1" stopColor="#F59E0B" />
                </radialGradient>
              </defs>
            </svg>
          </div>
        );

      /* ==================== 5. AMAVASAI (DARK NEW MOON & CRESCENT) ==================== */
      case 'amavasai':
        return (
          <div
            className={`rounded-full bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 p-0.5 shadow-sm border border-slate-700 dark:border-slate-600 flex items-center justify-center select-none ${sizeClasses}`}
          >
            <svg viewBox="0 0 36 36" className="w-full h-full" fill="none">
              <circle cx="18" cy="18" r="16" fill="#090D16" />
              {/* Delicate Silver Crescent Edge */}
              <path
                d="M23 8 C15 8, 9 13, 9 21 C9 26, 13 30, 18 31 C13 29, 12 23, 14 17 C16 12, 19 9, 23 8 Z"
                fill="#E2E8F0"
              />
              {/* Distant Stars */}
              <circle cx="26" cy="14" r="0.8" fill="#94A3B8" />
              <circle cx="24" cy="22" r="0.6" fill="#CBD5E1" />
              <circle cx="20" cy="25" r="0.7" fill="#94A3B8" />
            </svg>
          </div>
        );

      /* ==================== 6. LORD VISHNU / PERUMAL (THIRUMAN & CHAKRA) ==================== */
      case 'vishnu':
        return (
          <div
            className={`rounded-full bg-gradient-to-tr from-blue-900 via-indigo-900 to-amber-700 p-0.5 shadow-sm border border-amber-400/60 flex items-center justify-center select-none ${sizeClasses}`}
          >
            <svg viewBox="0 0 36 36" className="w-full h-full drop-shadow-sm" fill="none">
              <circle cx="18" cy="18" r="16" fill="url(#vishnuGrad)" />
              {/* Sacred Urdhva Pundra Thiruman (White U) */}
              <path
                d="M12 9 L15 25 L18 27 L21 25 L24 9 L21.5 9 L19 22 L17 22 L14.5 9 Z"
                fill="#FFFFFF"
                stroke="#CBD5E1"
                strokeWidth="0.5"
              />
              {/* Sacred Red Srichurnam Line */}
              <rect x="17" y="9" width="2" height="17" rx="1" fill="#DC2626" />
              {/* Holy Shankha & Chakra Symbols */}
              <circle cx="9" cy="18" r="2.5" stroke="#FDE047" strokeWidth="0.8" />
              <circle cx="27" cy="18" r="2.5" stroke="#FDE047" strokeWidth="0.8" strokeDasharray="1.5 1" />
              <defs>
                <linearGradient id="vishnuGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#1E3A8A" />
                  <stop offset="1" stopColor="#4338CA" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        );

      /* ==================== 7. LORD GANESHA ==================== */
      case 'ganesha':
        return (
          <div
            className={`rounded-full bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 p-0.5 shadow-sm border border-amber-300 dark:border-amber-400 flex items-center justify-center select-none ${sizeClasses}`}
          >
            <svg viewBox="0 0 36 36" className="w-full h-full drop-shadow-sm" fill="none">
              <circle cx="18" cy="18" r="16" fill="url(#ganeshaGrad)" />
              {/* Sacred Ganesha Face Curve & Curved Trunk */}
              <path
                d="M18 8 C13 8, 11 13, 13 18 C14 20, 16 23, 16 26 C16 28, 14 28, 13 26"
                stroke="#FEF08A"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              {/* Sacred Ears */}
              <path d="M13 12 C9 12, 8 16, 12 17" stroke="#FEF08A" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M22 12 C26 12, 27 16, 23 17" stroke="#FEF08A" strokeWidth="1.5" strokeLinecap="round" />
              {/* Modak Delight */}
              <circle cx="21" cy="24" r="2" fill="#FEF08A" stroke="#B45309" strokeWidth="0.6" />
              {/* Sacred Tilak */}
              <path d="M16 11 H20" stroke="#DC2626" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="18" cy="12" r="0.8" fill="#DC2626" />
              <defs>
                <linearGradient id="ganeshaGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#991B1B" />
                  <stop offset="1" stopColor="#D97706" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        );

      /* ==================== 8. DIYA / SACRED LAMP ==================== */
      case 'diya':
      default:
        return (
          <div
            className={`rounded-full bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-400 p-0.5 shadow-sm border border-amber-300 dark:border-amber-400 flex items-center justify-center select-none ${sizeClasses}`}
          >
            <svg viewBox="0 0 36 36" className="w-full h-full drop-shadow-sm" fill="none">
              <circle cx="18" cy="18" r="16" fill="url(#diyaGrad)" />
              {/* Brass Diya Bowl */}
              <path
                d="M9 22 C9 26, 27 26, 27 22 C27 20, 9 20, 9 22 Z"
                fill="#FDE047"
                stroke="#CA8A04"
                strokeWidth="0.8"
              />
              <path d="M13 25 L11 29 H25 L23 25 Z" fill="#EAB308" />
              {/* Radiant Dancing Flame */}
              <path
                d="M18 7 C14 13, 14 18, 18 19 C22 18, 22 13, 18 7 Z"
                fill="#EF4444"
              />
              <path
                d="M18 10 C16 14, 16 17, 18 18 C20 17, 20 14, 18 10 Z"
                fill="#FEF08A"
              />
              <defs>
                <linearGradient id="diyaGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#78350F" />
                  <stop offset="0.6" stopColor="#B45309" />
                  <stop offset="1" stopColor="#EA580C" />
                </linearGradient>
              </defs>
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
      {renderVisual()}
    </div>
  );
};

export default CalendarDayThumbnail;

