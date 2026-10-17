import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Compass,
  Star,
  Plus,
  Trash2,
  Utensils,
  Dumbbell,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getCalendarDayInfo,
  AUTHENTIC_TAMIL_FESTIVALS,
  type TamilDateInfo,
  type TamilFestival,
  type CustomFestivalDoc,
} from '../utils/tamilCalendar';
import {
  subscribeCustomFestivals,
  deleteCustomFestival,
  type CustomFestivalItem,
} from '../services/firestoreService';
import PanchangamCard from '../components/calendar/PanchangamCard';
import RasipalanCard from '../components/calendar/RasipalanCard';
import CustomFestivalModal from '../components/calendar/CustomFestivalModal';
import CalendarDayThumbnail, {
  getCalendarDayThumbnail,
} from '../components/calendar/CalendarDayThumbnail';

export const CalendarPage: React.FC = () => {
  const { currentUser } = useAuth();

  // Navigation Tabs: 'calendar' | 'rasipalan' | 'festivals'
  const [activeTab, setActiveTab] = useState<'calendar' | 'rasipalan' | 'festivals'>('calendar');

  // Calendar Date State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Custom Festivals from Firestore (Zero Mock Data)
  const [customFestivals, setCustomFestivals] = useState<CustomFestivalItem[]>([]);
  const [showAddFestivalModal, setShowAddFestivalModal] = useState(false);
  const [festivalCategoryFilter, setFestivalCategoryFilter] = useState<string>('All');
  const [festivalSearchQuery, setFestivalSearchQuery] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Subscribe to user custom festivals in Firestore
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = subscribeCustomFestivals(currentUser.uid, (items) => {
      setCustomFestivals(items);
    });
    return () => unsub();
  }, [currentUser?.uid]);

  // Current year & month for calendar grid
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0 - 11

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  // Generate calendar days for current month view
  const calendarGridDays: (TamilDateInfo | null)[] = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0=Sun to 6=Sat
    const totalDays = lastDayOfMonth.getDate();

    const days: (TamilDateInfo | null)[] = [];

    // Empty lead slots
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Days in current month
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(currentYear, currentMonth, d);
      const info = getCalendarDayInfo(dateObj, customFestivals as CustomFestivalDoc[]);
      days.push(info);
    }

    return days;
  }, [currentYear, currentMonth, customFestivals]);

  // Selected Day Details
  const selectedDayInfo: TamilDateInfo = useMemo(() => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return getCalendarDayInfo(dateObj, customFestivals as CustomFestivalDoc[]);
  }, [selectedDateStr, customFestivals]);

  // Handle Delete Custom Festival
  const handleDeleteCustomFestival = async (festivalId: string, name: string) => {
    if (!currentUser?.uid) return;
    if (window.confirm(`Delete "${name}" from your custom festivals?`)) {
      try {
        await deleteCustomFestival(currentUser.uid, festivalId);
        showToast(`Removed "${name}" from your festivals.`);
      } catch (err) {
        console.error('Failed to delete festival:', err);
        showToast('Error removing festival.');
      }
    }
  };

  // Filtered Festivals for Tab 3
  const allDisplayFestivals = useMemo(() => {
    const preloaded = AUTHENTIC_TAMIL_FESTIVALS;
    const customs: TamilFestival[] = customFestivals.map((cf) => ({
      id: `custom-${cf.id}`,
      nameEnglish: cf.nameEnglish,
      nameTamil: cf.nameTamil || cf.nameEnglish,
      date: cf.date,
      month: Number(cf.date.split('-')[1]),
      day: Number(cf.date.split('-')[2]),
      category: cf.category as any,
      deity: cf.deity || 'Regional Deity',
      significance: cf.fastingNotes || 'Custom festival logged by athlete.',
      significanceTamil: cf.fastingNotes || 'பயனரால் சேர்க்கப்பட்ட சிறப்பு விரத / திருவிழா நாள்.',
      nutritionDietGuidance: cf.fastingNotes || 'Follow personalized fasting or meal prep protocol.',
      fitnessWorkoutGuidance: 'Adjust workout intensity to complement fasting schedule.',
      isCustom: true,
    }));

    const combined = [...preloaded, ...customs];

    return combined.filter((f) => {
      const matchesSearch =
        f.nameEnglish.toLowerCase().includes(festivalSearchQuery.toLowerCase()) ||
        f.nameTamil.toLowerCase().includes(festivalSearchQuery.toLowerCase()) ||
        f.deity.toLowerCase().includes(festivalSearchQuery.toLowerCase());
      const matchesCat =
        festivalCategoryFilter === 'All' ||
        (festivalCategoryFilter === 'My Custom' ? f.isCustom : f.category === festivalCategoryFilter);
      return matchesSearch && matchesCat;
    });
  }, [customFestivals, festivalSearchQuery, festivalCategoryFilter]);

  const monthNamesEnglish = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs shadow-xl flex items-center gap-2 border border-emerald-500/40 animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400 dark:text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-400 text-xs font-bold mb-1">
            <Compass className="w-3.5 h-3.5" />
            <span>தமிழ் & ஆங்கில நாள்காட்டி (Bilingual Almanac)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Tamil Calendar & Panchangam</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30">
              Live Almanac
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Solar Tamil months (Chithirai to Panguni), daily auspicious timings, 12 Rasis Rasipalan, and cultural festivals.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowAddFestivalModal(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Festival / Viratham</span>
          </button>
        </div>
      </div>

      {/* Main Feature Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`pb-3 px-3 sm:px-4 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'calendar'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Bilingual Calendar & Panchangam</span>
        </button>

        <button
          onClick={() => setActiveTab('rasipalan')}
          className={`pb-3 px-3 sm:px-4 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'rasipalan'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>12 Rasis Rasipalan Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('festivals')}
          className={`pb-3 px-3 sm:px-4 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'festivals'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Festivals & Viratham Guide</span>
          {customFestivals.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-extrabold">
              {customFestivals.length} Custom
            </span>
          )}
        </button>
      </div>

      {/* ==================== TAB 1: BILINGUAL CALENDAR GRID & DAILY PANCHANGAM ==================== */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {/* Calendar Controller Bar */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg card-3d flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition btn-tactile"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition btn-tactile"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{monthNamesEnglish[currentMonth]} {currentYear}</span>
                </h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                  {selectedDayInfo.tamilYearName} வருடம் • {selectedDayInfo.tamilMonthName} / {selectedDayInfo.tamilMonthEnglish} பருவம்
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleJumpToToday}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition btn-tactile shadow-xs"
              >
                இன்று (Today)
              </button>
              <span className="text-[11px] text-slate-400 font-semibold hidden md:inline">
                Tap date for detailed Panchangam
              </span>
            </div>
          </div>

          {/* Interactive Bilingual Calendar Grid */}
          <div className="p-4 sm:p-6 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg space-y-3">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center pb-2 border-b border-slate-100 dark:border-slate-800">
              {[
                { en: 'Sun', ta: 'ஞாயிறு' },
                { en: 'Mon', ta: 'திங்கள்' },
                { en: 'Tue', ta: 'செவ்வாய்' },
                { en: 'Wed', ta: 'புதன்' },
                { en: 'Thu', ta: 'வியாழன்' },
                { en: 'Fri', ta: 'வெள்ளி' },
                { en: 'Sat', ta: 'சனி' },
              ].map((day, idx) => (
                <div key={idx} className="py-1">
                  <span className="block text-[11px] sm:text-xs font-black text-slate-800 dark:text-slate-200">
                    {day.en}
                  </span>
                  <span className="block text-[9px] sm:text-[10px] font-bold text-slate-400 truncate">
                    {day.ta}
                  </span>
                </div>
              ))}
            </div>

            {/* Calendar Day Cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarGridDays.map((dayInfo, idx) => {
                if (!dayInfo) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-[72px] sm:min-h-[88px] rounded-2xl bg-slate-50/30 dark:bg-slate-950/20 border border-transparent"
                    />
                  );
                }

                const isSelected = dayInfo.gregorianDate === selectedDateStr;
                const isToday =
                  dayInfo.gregorianDate === new Date().toISOString().split('T')[0];
                const hasMajorFestival = dayInfo.festivals.some(
                  (f) => f.category === 'Major Festival' || f.category === 'Temple Festival'
                );
                const hasFasting = dayInfo.isFastingDay;
                const hasCustom = dayInfo.festivals.some((f) => f.isCustom);
                const thumbnail = getCalendarDayThumbnail(dayInfo);

                return (
                  <button
                    key={dayInfo.gregorianDate}
                    type="button"
                    onClick={() => setSelectedDateStr(dayInfo.gregorianDate)}
                    className={`min-h-[76px] sm:min-h-[92px] p-1.5 sm:p-2 rounded-2xl flex flex-col justify-between text-left transition-all cursor-pointer relative group overflow-hidden btn-tactile ${
                      isSelected
                        ? 'bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-100 dark:to-slate-200 text-white dark:text-slate-950 shadow-xl scale-102 ring-2 ring-emerald-500'
                        : isToday
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 text-slate-900 dark:text-white border-2 border-emerald-500/70 shadow-md shadow-emerald-500/10'
                        : 'bg-white/80 dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-102'
                    }`}
                  >
                    {/* Top Row: Western Date & Tamil Date */}
                    <div className="flex items-start justify-between w-full">
                      <span
                        className={`text-sm sm:text-base font-black leading-none ${
                          isSelected ? 'text-white dark:text-slate-950' : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {dayInfo.day}
                      </span>

                      {/* Tamil Date Subtitle */}
                      <span
                        className={`text-[9px] sm:text-[10px] font-bold text-right leading-tight ${
                          isSelected
                            ? 'text-amber-300 dark:text-amber-700'
                            : 'text-amber-600 dark:text-amber-400 font-extrabold'
                        }`}
                        title={`${dayInfo.tamilMonthName} ${dayInfo.tamilDate}`}
                      >
                        {dayInfo.tamilMonthName.slice(0, 3)} {dayInfo.tamilDate}
                      </span>
                    </div>

                    {/* Sacred Day Deity / Occasion Visual Thumbnail */}
                    {thumbnail ? (
                      <div className="w-full flex items-center justify-center my-0.5 sm:my-1">
                        <CalendarDayThumbnail info={thumbnail} size="sm" />
                      </div>
                    ) : (
                      <div className="w-full h-7 my-0.5 sm:my-1" />
                    )}

                    {/* Festival / Fasting Indicators */}
                    <div className="w-full space-y-0.5 mt-auto pt-1">
                      {dayInfo.festivals.length > 0 && (
                        <div
                          className={`text-[8px] sm:text-[9px] font-extrabold px-1 py-0.5 rounded truncate ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                          }`}
                          title={dayInfo.festivals[0].nameTamil}
                        >
                          {dayInfo.festivals[0].nameTamil}
                        </div>
                      )}

                      {/* Small Dots Bar for Multiple Attributes */}
                      <div className="flex items-center gap-1 pt-0.5">
                        {hasMajorFestival && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-amber-400"
                            title="Major Festival"
                          />
                        )}
                        {hasFasting && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-orange-500"
                            title="Fasting / Viratham Day"
                          />
                        )}
                        {hasCustom && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-purple-500"
                            title="Custom Local Festival"
                          />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend Bar */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>விசேஷ திருவிழா (Major Festival)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>விரத நாள் (Viratham / Fasting)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>தனிப்பயன் விழா (Custom Festival)</span>
                </span>
              </div>
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Current Jovian Year: {selectedDayInfo.tamilYearName} ({selectedDayInfo.tamilYearEnglish})
              </span>
            </div>

            {/* Sacred Day Deity Icon Key */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 overflow-x-auto pb-1 gap-4 scrollbar-none">
              <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">
                புனித நாள் குறியீடுகள் (Sacred Observance Icons):
              </span>
              <div className="flex items-center gap-3.5 shrink-0">
                <span className="flex items-center gap-1.5" title="Maha Shivaratri: Lord Shiva Lingam with divine aura">
                  <CalendarDayThumbnail info={{ type: 'shivaratri', titleTamil: 'மகா சிவராத்திரி', titleEnglish: 'Maha Shivaratri', reason: '' }} size="sm" showTooltip={false} />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">மகா சிவராத்திரி (Shiva Lingam)</span>
                </span>
                <span className="flex items-center gap-1.5" title="Pradosham: Sacred Nandhi Bull facing Lord Shiva">
                  <CalendarDayThumbnail info={{ type: 'pradosham', titleTamil: 'பிரதோஷம்', titleEnglish: 'Pradosham', reason: '' }} size="sm" showTooltip={false} />
                  <span className="font-semibold text-amber-700 dark:text-amber-400">பிரதோஷம் (Sacred Nandhi)</span>
                </span>
                <span className="flex items-center gap-1.5" title="Skanda Sashti / Thai Poosam: Lord Murugan Vel & Peacock">
                  <CalendarDayThumbnail info={{ type: 'murugan', titleTamil: 'முருகன்', titleEnglish: 'Murugan', reason: '' }} size="sm" showTooltip={false} />
                  <span>முருகன் (Vel & Peacock)</span>
                </span>
                <span className="flex items-center gap-1.5" title="Arudra Darshanam: Lord Nataraja Dancing Pose">
                  <CalendarDayThumbnail info={{ type: 'natarajar', titleTamil: 'நடராஜர்', titleEnglish: 'Nataraja', reason: '' }} size="sm" showTooltip={false} />
                  <span>நடராஜர் (Cosmic Dance)</span>
                </span>
                <span className="flex items-center gap-1.5" title="Vinayagar Chaturthi: Lord Ganesha">
                  <CalendarDayThumbnail info={{ type: 'ganesha', titleTamil: 'விநாயகர்', titleEnglish: 'Ganesha', reason: '' }} size="sm" showTooltip={false} />
                  <span>விநாயகர் (Ganesha)</span>
                </span>
                <span className="flex items-center gap-1.5" title="Ekadashi / Purattasi Saturdays: Lord Vishnu Thiruman & Shankha-Chakra">
                  <CalendarDayThumbnail info={{ type: 'vishnu', titleTamil: 'பெருமாள்', titleEnglish: 'Vishnu', reason: '' }} size="sm" showTooltip={false} />
                  <span>பெருமாள் (Vishnu)</span>
                </span>
                <span className="flex items-center gap-1.5" title="Pournami: Full Moon">
                  <CalendarDayThumbnail info={{ type: 'pournami', titleTamil: 'பௌர்ணமி', titleEnglish: 'Pournami', reason: '' }} size="sm" showTooltip={false} />
                  <span>பௌர்ணமி (Full Moon)</span>
                </span>
                <span className="flex items-center gap-1.5" title="Amavasai: New Moon & Crescent">
                  <CalendarDayThumbnail info={{ type: 'amavasai', titleTamil: 'அமாவாசை', titleEnglish: 'Amavasai', reason: '' }} size="sm" showTooltip={false} />
                  <span>அமாவாசை (New Moon)</span>
                </span>
                <span className="flex items-center gap-1.5" title="Deepavali / Karthigai Deepam: Sacred Diya">
                  <CalendarDayThumbnail info={{ type: 'diya', titleTamil: 'தீபம்', titleEnglish: 'Diya', reason: '' }} size="sm" showTooltip={false} />
                  <span>தீபம் (Diya)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Selected Date Detailed Panchangam & Cultural Card */}
          <PanchangamCard dayInfo={selectedDayInfo} />

          {/* Active Festivals for Selected Date */}
          {selectedDayInfo.festivals.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-current" />
                <span>
                  {selectedDayInfo.gregorianDate} திருவிழாக்கள் & விசேஷங்கள் (Festivals on this Day)
                </span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedDayInfo.festivals.map((festival) => (
                  <div
                    key={festival.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-amber-300/80 dark:border-amber-500/30 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-black text-slate-900 dark:text-white">
                            {festival.nameTamil}
                          </h4>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                            {festival.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                          {festival.nameEnglish} • தெய்வம்: {festival.deity}
                        </p>
                      </div>

                      {festival.isCustom && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteCustomFestival(
                              festival.id.replace('custom-', ''),
                              festival.nameEnglish
                            )
                          }
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                          title="Delete Custom Festival"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {festival.significanceTamil}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                      {/* Nutrition / Prasad Guidance */}
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                          <Utensils className="w-3 h-3" />
                          <span>பிரசாதம் & உணவு முறை</span>
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 leading-snug">
                          {festival.nutritionDietGuidance}
                        </p>
                      </div>

                      {/* Workout & Fitness Guidance */}
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Dumbbell className="w-3 h-3" />
                          <span>உடற்பயிற்சி வழிகாட்டல்</span>
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 leading-snug">
                          {festival.fitnessWorkoutGuidance}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 2: 12 RASIS RASIPALAN ENGINE ==================== */}
      {activeTab === 'rasipalan' && (
        <div className="space-y-6">
          <RasipalanCard />
        </div>
      )}

      {/* ==================== TAB 3: AUTHENTIC FESTIVALS & CUSTOM MANAGER ==================== */}
      {activeTab === 'festivals' && (
        <div className="space-y-6">
          {/* Search & Category Filter Controls */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search festival, viratham, or deity (e.g., Pongal, Murugan)..."
                value={festivalSearchQuery}
                onChange={(e) => setFestivalSearchQuery(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                'All',
                'Major Festival',
                'Viratham / Fasting',
                'Temple Festival',
                'My Custom',
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFestivalCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    festivalCategoryFilter === cat
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Festival Cards Catalog */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allDisplayFestivals.map((festival) => (
              <div
                key={festival.id}
                className={`p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm space-y-3.5 transition ${
                  festival.isCustom
                    ? 'border-purple-300 dark:border-purple-500/30'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        {festival.nameTamil}
                      </h4>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                        {festival.category}
                      </span>
                      {festival.isCustom && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/15 text-purple-800 dark:text-purple-400 border border-purple-300 dark:border-purple-500/30">
                          Custom Local
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                      {festival.nameEnglish} • {festival.deity} •{' '}
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {festival.tamilDateApprox || festival.date}
                      </span>
                    </p>
                  </div>

                  {festival.isCustom && (
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteCustomFestival(
                          festival.id.replace('custom-', ''),
                          festival.nameEnglish
                        )
                      }
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                      title="Delete Custom Festival"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {festival.significanceTamil}
                </p>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
                  {festival.significance}
                </p>

                {/* Cultural Prasad & Workout Protocols */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                      <Utensils className="w-3.5 h-3.5" />
                      <span>பிரசாத உணவு நெறிமுறை</span>
                    </span>
                    <p className="text-slate-600 dark:text-slate-400 leading-snug">
                      {festival.nutritionDietGuidance}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Dumbbell className="w-3.5 h-3.5" />
                      <span>உடற்பயிற்சி சமநிலை</span>
                    </span>
                    <p className="text-slate-600 dark:text-slate-400 leading-snug">
                      {festival.fitnessWorkoutGuidance}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Custom Festival / Fasting Modal */}
      {showAddFestivalModal && currentUser?.uid && (
        <CustomFestivalModal
          userId={currentUser.uid}
          initialDate={selectedDateStr}
          onClose={() => setShowAddFestivalModal(false)}
          onSuccess={() => showToast('Custom festival logged and synced to Firestore!')}
        />
      )}
    </div>
  );
};

export default CalendarPage;
