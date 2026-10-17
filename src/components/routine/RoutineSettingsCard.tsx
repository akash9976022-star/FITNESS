import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Pencil,
  Trash2,
  Volume2,
  VolumeX,
  CheckCircle2,
  Sliders,
  RotateCcw,
  X,
  Sparkles,
  Calendar,
  CalendarDays,
  Check,
  AlertTriangle,
  Droplets,
  Moon,
  Power,
  Play,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeRoutineSettings,
  saveRoutineSettings,
  subscribeCustomRoutines,
  addCustomRoutine,
  updateCustomRoutine,
  deleteCustomRoutine,
  subscribeUserProfile,
  calculateHydrationSlots,
  generateAndSaveHydrationSchedule,
  clearHydrationSchedule,
  type UserRoutineSettings,
  type CustomRoutineItem,
  type RoutineRepeatFrequency,
  type UserProfile,
  type HydrationIntervalConfig,
  type VoiceLanguageMode,
  DEFAULT_ROUTINE_SETTINGS,
  DEFAULT_CUSTOM_ROUTINES,
} from '../../services/firestoreService';
import {
  speakRoutineVoiceReminder,
  stopRoutineSpeech,
  buildSpokenPhrase,
} from '../../utils/routineVoiceEngine';
import { unlockAudio } from '../../utils/voiceSynthesisHelper';

interface RoutineSettingsCardProps {
  className?: string;
  onSaved?: () => void;
}

interface QuickSuggestion {
  name: string;
  nameTamil?: string;
  time: string;
  category: string;
  icon: string;
  repeat: RoutineRepeatFrequency;
  voicePrompt: string;
  voicePromptTamil?: string;
  voicePromptTanglish?: string;
}

const QUICK_SUGGESTIONS: QuickSuggestion[] = [
  {
    name: 'Morning Walk',
    nameTamil: 'காலை நடைப்பயிற்சி',
    time: '06:30',
    category: 'Cardio',
    icon: '🚶',
    repeat: 'daily',
    voicePrompt: '{name}, time for your morning walk! Step outside, breathe in the fresh air, and reach your step count.',
    voicePromptTamil: '{name} ப்ரோ, வாக்கிங் போலாம் வாங்க... நல்லா காத்து வாங்கிட்டு சுறுசுறுப்பா கொஞ்சம் நடந்துட்டு வரலாம்!',
    voicePromptTanglish: '{name} ப்ரோ, வாக்கிங் போலாம் வாங்க... வெளிய போய் ஸ்டெப்ஸை முடிச்சிடலாம்!',
  },
  {
    name: 'Post-Workout Protein',
    nameTamil: 'புரத உணவு நேரம்',
    time: '18:30',
    category: 'Nutrition',
    icon: '🥗',
    repeat: 'daily',
    voicePrompt: '{name}, remember to drink your post-workout protein shake or have a nutritious high-protein meal.',
    voicePromptTamil: '{name} ப்ரோ, ஒர்க்அவுட் முடிஞ்சதும் புரோட்டீன் ஷேக் அல்லது சத்தான உணவை சாப்பிட மறந்துடாதீங்க!',
    voicePromptTanglish: '{name} ப்ரோ, ஒர்க்அவுட் முடிஞ்சதும் புரோட்டீன் ஷேக் அல்லது ஹை-புரோட்டீன் மீல் சாப்பிட மறந்துடாதீங்க!',
  },
  {
    name: 'Evening Meditation',
    nameTamil: 'மாலை தியானம்',
    time: '20:00',
    category: 'Meditation',
    icon: '🧘',
    repeat: 'daily',
    voicePrompt: '{name}, time for your evening meditation session! Take deep breaths, calm your mind, and let go of stress.',
    voicePromptTamil: '{name}, கொஞ்ச நேரம் அமைதியா உக்காந்து மெடிடேஷன் பண்ணுங்க... ஆழமா மூச்சு விட்டு மைண்ட்டை ரிலாக்ஸ் பண்ணுங்க.',
    voicePromptTanglish: '{name}, கொஞ்ச நேரம் அமைதியா உக்காந்து மெடிடேஷன் பண்ணுங்க... மைண்ட் நல்லா ரிலாக்ஸ் ஆகும்.',
  },
  {
    name: 'Hydration Break',
    nameTamil: 'தண்ணீர் குடிக்கும் நேரம்',
    time: '11:00',
    category: 'Hydration',
    icon: '💧',
    repeat: 'daily',
    voicePrompt: '{name}, time for a hydration break! Drink a tall glass of fresh water to keep your body optimized.',
    voicePromptTamil: '{name} ப்ரோ, உடனே ஒரு கிளாஸ் தண்ணி குடிங்க... பாடி நல்லா ஃப்ரெஷ்ஷா எனர்ஜியா இருக்கும்!',
    voicePromptTanglish: '{name} ப்ரோ, உடனே ஒரு கிளாஸ் தண்ணி குடிங்க... பாடி நல்லா ஃப்ரெஷ்ஷா இருக்கும்!',
  },
  {
    name: 'Night Reading & Journal',
    nameTamil: 'இரவு வாசிப்பு',
    time: '21:30',
    category: 'Bedtime',
    icon: '📖',
    repeat: 'daily',
    voicePrompt: 'Good evening {name}. Time for your evening reading and gratitude journaling before bed.',
    voicePromptTamil: 'தூங்குறதுக்கு முன்னாடி கொஞ்ச நேரம் அமைதியா புக் படிச்சிட்டு மைண்ட்டை ரிலாக்ஸ் பண்ணுங்க {name}.',
    voicePromptTanglish: 'தூங்குறதுக்கு முன்னாடி கொஞ்ச நேரம் புக் படிச்சிட்டு மைண்ட்டை ரிலாக்ஸ் பண்ணுங்க {name}.',
  },
];

function getSuggestionPrompt(sug: QuickSuggestion, lang: VoiceLanguageMode = 'tanglish'): string {
  if (lang === 'ta' && sug.voicePromptTamil) return sug.voicePromptTamil;
  if (lang === 'tanglish' && (sug.voicePromptTanglish || sug.voicePromptTamil)) {
    return sug.voicePromptTanglish || sug.voicePromptTamil!;
  }
  return sug.voicePrompt;
}

const AVAILABLE_ICONS = ['🌅', '🚶', '🏋️', '🌙', '💧', '🧘', '🥗', '⏰', '🍎', '🚴', '📖', '💊', '🥑', '🏃', '🎯'];

export const RoutineSettingsCard: React.FC<RoutineSettingsCardProps> = ({
  className = '',
  onSaved,
}) => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<UserRoutineSettings>(DEFAULT_ROUTINE_SETTINGS);
  const [routines, setRoutines] = useState<CustomRoutineItem[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTestingId, setActiveTestingId] = useState<string | null>(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<CustomRoutineItem | null>(null);
  const [isSavingRoutine, setIsSavingRoutine] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formTime, setFormTime] = useState('07:00');
  const [formRepeat, setFormRepeat] = useState<RoutineRepeatFrequency>('daily');
  const [formPrompt, setFormPrompt] = useState('');
  const [formIcon, setFormIcon] = useState('⏰');
  const [formCategory, setFormCategory] = useState('Custom');

  // Deletion Confirmation Modal State
  const [routineToDelete, setRoutineToDelete] = useState<CustomRoutineItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Hydration Auto-Generation Engine State
  const [hydrationIntervalHours, setHydrationIntervalHours] = useState<number>(2);
  const [hydrationStartTime, setHydrationStartTime] = useState<string>('09:00');
  const [hydrationEndTime, setHydrationEndTime] = useState<string>('20:00');
  const [hydrationVoicePrompt, setHydrationVoicePrompt] = useState<string>(
    '{name}, time for a hydration break! Drink a glass of water to stay fresh.'
  );
  const [isGeneratingHydration, setIsGeneratingHydration] = useState(false);
  const [isClearingHydration, setIsClearingHydration] = useState(false);

  const userName = profile?.age ? currentUser?.displayName || 'Akash' : currentUser?.displayName || 'Akash';
  const firstName = userName.trim().split(' ')[0];

  // Subscribe to real-time Routine Settings, Custom Routines, and User Profile
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubSettings = subscribeRoutineSettings(currentUser.uid, (data) => {
      setSettings(data);
      if (data.hydrationInterval) {
        if (typeof data.hydrationInterval.intervalHours === 'number' && data.hydrationInterval.intervalHours > 0) {
          setHydrationIntervalHours(data.hydrationInterval.intervalHours);
        }
        if (data.hydrationInterval.startTime) {
          setHydrationStartTime(data.hydrationInterval.startTime);
        }
        if (data.hydrationInterval.endTime) {
          setHydrationEndTime(data.hydrationInterval.endTime);
        }
        if (data.hydrationInterval.voicePrompt) {
          setHydrationVoicePrompt(data.hydrationInterval.voicePrompt);
        }
      }
    });

    const unsubRoutines = subscribeCustomRoutines(currentUser.uid, (items) => {
      setRoutines(items);
    });

    const unsubProfile = subscribeUserProfile(currentUser.uid, (p) => {
      setProfile(p);
    });

    return () => {
      unsubSettings();
      unsubRoutines();
      unsubProfile();
    };
  }, [currentUser?.uid]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open Modal in Create Mode
  const handleOpenAddModal = () => {
    setEditingRoutine(null);
    setFormTime('07:00');
    setFormRepeat('daily');
    const lang = settings.routineLanguage || 'tanglish';
    if (lang === 'ta') {
      setFormName('காலை நடைப்பயிற்சி');
      setFormPrompt('{name} ப்ரோ, வாக்கிங் போலாம் வாங்க... நல்லா காத்து வாங்கிட்டு சுறுசுறுப்பா கொஞ்சம் நடந்துட்டு வரலாம்!');
      setFormCategory('Cardio');
      setFormIcon('🚶');
    } else if (lang === 'tanglish') {
      setFormName('Morning Walk');
      setFormPrompt('{name} ப்ரோ, வாக்கிங் போலாம் வாங்க... வெளிய போய் ஸ்டெப்ஸை முடிச்சிடலாம்!');
      setFormCategory('Cardio');
      setFormIcon('🚶');
    } else {
      setFormName('Morning Walk');
      setFormPrompt('{name}, time for your morning walk! Step outside, breathe in the fresh air, and reach your step count.');
      setFormCategory('Cardio');
      setFormIcon('🚶');
    }
    setIsModalOpen(true);
  };

  // Open Modal in Edit Mode
  const handleOpenEditModal = (item: CustomRoutineItem) => {
    setEditingRoutine(item);
    setFormName(item.name);
    setFormTime(item.time);
    setFormRepeat(item.repeat || 'daily');
    const lang = settings.routineLanguage || 'tanglish';
    const hasTamilGlyphs = /[\u0B80-\u0BFF]/.test(item.voicePrompt || '');
    // If user's active language is Tamil or Tanglish, but stored routine was English, adapt it to active language
    if ((lang === 'ta' || lang === 'tanglish') && !hasTamilGlyphs) {
      setFormPrompt(buildSpokenPhrase(item, '{name}', lang));
    } else {
      setFormPrompt(item.voicePrompt || buildSpokenPhrase(item, '{name}', lang));
    }
    setFormIcon(item.icon || '⏰');
    setFormCategory(item.category || 'Custom');
    setIsModalOpen(true);
  };

  // Quick fill suggestion
  const handleApplySuggestion = (sug: QuickSuggestion) => {
    const lang = settings.routineLanguage || 'tanglish';
    setFormName(lang === 'ta' && sug.nameTamil ? sug.nameTamil : sug.name);
    setFormTime(sug.time);
    setFormRepeat(sug.repeat);
    setFormPrompt(getSuggestionPrompt(sug, lang));
    setFormIcon(sug.icon);
    setFormCategory(sug.category);
  };

  // Save or Update Routine in Firestore
  const handleSaveRoutineForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid) return;
    if (!formName.trim()) {
      showToast('Please enter a routine name.');
      return;
    }

    setIsSavingRoutine(true);
    try {
      if (editingRoutine) {
        // Update existing routine
        await updateCustomRoutine(currentUser.uid, editingRoutine.id, {
          name: formName.trim(),
          time: formTime,
          repeat: formRepeat,
          voicePrompt: formPrompt.trim(),
          icon: formIcon,
          category: formCategory,
        });
        showToast(`Updated "${formName.trim()}" successfully!`);
      } else {
        // Add new routine
        await addCustomRoutine(currentUser.uid, {
          name: formName.trim(),
          time: formTime,
          repeat: formRepeat,
          voicePrompt: formPrompt.trim(),
          icon: formIcon,
          category: formCategory,
          enabled: true,
        });
        showToast(`Created new routine "${formName.trim()}"!`);
      }
      setIsModalOpen(false);
      onSaved?.();
    } catch (err) {
      console.warn('Error saving custom routine:', err);
      showToast('Saved routine in offline storage.');
      setIsModalOpen(false);
    } finally {
      setIsSavingRoutine(false);
    }
  };

  // Inline Toggle Enabled / Disabled
  const handleToggleRoutine = async (item: CustomRoutineItem) => {
    if (!currentUser?.uid) return;
    const nextState = !item.enabled;
    try {
      await updateCustomRoutine(currentUser.uid, item.id, { enabled: nextState });
      showToast(`${item.name} is now ${nextState ? 'enabled' : 'paused'}.`);
    } catch (err) {
      console.warn('Error toggling routine:', err);
    }
  };

  // Inline Time Change
  const handleInlineTimeChange = async (item: CustomRoutineItem, newTime: string) => {
    if (!currentUser?.uid || !newTime) return;
    try {
      await updateCustomRoutine(currentUser.uid, item.id, { time: newTime });
      showToast(`Updated time for ${item.name} to ${newTime}`);
    } catch (err) {
      console.warn('Error changing routine time:', err);
    }
  };

  // Delete Routine Handler
  const handleConfirmDelete = async () => {
    if (!currentUser?.uid || !routineToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCustomRoutine(currentUser.uid, routineToDelete.id);
      showToast(`Deleted "${routineToDelete.name}".`);
      setRoutineToDelete(null);
    } catch (err) {
      console.warn('Error deleting routine:', err);
      showToast('Error deleting routine.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Test Natural Voice Preview
  const handleTestVoice = (item: CustomRoutineItem | { name: string; voicePrompt?: string; icon?: string }) => {
    const id = 'id' in item ? item.id : 'preview';
    if (activeTestingId === id) {
      stopRoutineSpeech();
      setActiveTestingId(null);
      return;
    }

    setActiveTestingId(id);
    speakRoutineVoiceReminder(item, userName, {
      language: settings.routineLanguage || 'tanglish',
      rate: settings.voiceRate,
      playChimeFirst: true,
      onStart: () => setActiveTestingId(id),
      onEnd: () => setActiveTestingId(null),
    });
  };

  // Reset to default baseline routines
  const handleResetToDefaults = async () => {
    if (!currentUser?.uid) return;
    if (window.confirm('Reset all routines to recommended default schedule? Your custom routines will be preserved.')) {
      try {
        for (const defaultItem of DEFAULT_CUSTOM_ROUTINES) {
          const exists = routines.some((r) => r.name.toLowerCase() === defaultItem.name.toLowerCase());
          if (!exists) {
            await addCustomRoutine(currentUser.uid, defaultItem);
          }
        }
        showToast('Restored default routines.');
      } catch (err) {
        console.warn('Error resetting defaults:', err);
      }
    }
  };

  // Helper for repeat frequency badge label
  const getRepeatBadge = (repeat: RoutineRepeatFrequency) => {
    switch (repeat) {
      case 'weekdays':
        return { label: 'Mon - Fri', color: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30' };
      case 'weekends':
        return { label: 'Sat - Sun', color: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30' };
      case 'daily':
      default:
        return { label: 'Every Day', color: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30' };
    }
  };

  // Real-time preview of calculated hydration slots based on current inputs
  const previewHydrationSlots = calculateHydrationSlots(
    hydrationStartTime,
    hydrationEndTime,
    hydrationIntervalHours
  );

  // List of active hydration routines currently saved in Firestore/routines
  const existingHydrationRoutines = routines.filter(
    (r) =>
      r.category?.toLowerCase() === 'hydration' ||
      r.name.toLowerCase().includes('hydration') ||
      r.name.toLowerCase().includes('தண்ணீர்')
  );

  // Auto-generate hydration schedule across active hours
  const handleGenerateHydrationSchedule = async () => {
    if (!currentUser?.uid) return;
    if (previewHydrationSlots.length === 0) {
      showToast('End time must be later than start time.');
      return;
    }

    setIsGeneratingHydration(true);
    try {
      const config: HydrationIntervalConfig = {
        enabled: true,
        intervalHours: hydrationIntervalHours,
        startTime: hydrationStartTime,
        endTime: hydrationEndTime,
        voicePrompt: hydrationVoicePrompt.trim(),
      };
      const created = await generateAndSaveHydrationSchedule(
        currentUser.uid,
        config,
        firstName
      );
      showToast(`Generated ${created.length} hydration breaks every ${hydrationIntervalHours}h!`);
      onSaved?.();
    } catch (err) {
      console.warn('Error generating hydration schedule:', err);
      showToast('Error generating hydration schedule.');
    } finally {
      setIsGeneratingHydration(false);
    }
  };

  // Clear all auto-generated hydration routines
  const handleClearHydrationBreaks = async () => {
    if (!currentUser?.uid) return;
    if (existingHydrationRoutines.length === 0) {
      showToast('No active hydration breaks to clear.');
      return;
    }
    setIsClearingHydration(true);
    try {
      const count = await clearHydrationSchedule(currentUser.uid);
      showToast(`Removed ${count} hydration breaks.`);
      onSaved?.();
    } catch (err) {
      console.warn('Error clearing hydration schedule:', err);
      showToast('Error clearing hydration breaks.');
    } finally {
      setIsClearingHydration(false);
    }
  };

  // Helper to format 24h string to 12h AM/PM
  const formatTime12h = (time24?: string): string => {
    if (!time24) return '9:00 PM';
    const [hStr, mStr] = time24.split(':');
    const h = parseInt(hStr, 10);
    const m = mStr || '00';
    if (isNaN(h)) return time24;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour}:${m} ${period}`;
  };

  // Update Night Debrief configuration
  const handleUpdateNightDebrief = async (updates: Partial<typeof DEFAULT_ROUTINE_SETTINGS.nightDebrief>) => {
    if (!currentUser?.uid) return;
    const currentConfig = settings.nightDebrief || DEFAULT_ROUTINE_SETTINGS.nightDebrief;
    const updatedDebrief = { ...currentConfig, ...updates };

    setSettings((prev) => ({
      ...prev,
      nightDebrief: updatedDebrief,
    }));

    try {
      await saveRoutineSettings(currentUser.uid, {
        nightDebrief: updatedDebrief,
      });
      showToast('Updated Night Debrief & Sleep settings.');
      onSaved?.();
    } catch (err) {
      console.warn('Error saving night debrief settings:', err);
      showToast('Failed to save night debrief settings.');
    }
  };

  // Update Routine Reminders Language
  const handleUpdateRoutineLanguage = async (newLang: VoiceLanguageMode) => {
    if (!currentUser?.uid) return;
    setSettings((prev) => ({
      ...prev,
      routineLanguage: newLang,
    }));

    try {
      await saveRoutineSettings(currentUser.uid, {
        routineLanguage: newLang,
      });
      const langNames: Record<VoiceLanguageMode, string> = {
        en: 'English',
        ta: 'Tamil (தமிழ்)',
        tanglish: 'Tanglish',
        both: 'Both (English + தமிழ்)',
      };
      showToast(`Routine reminders language set to ${langNames[newLang]}!`);
      onSaved?.();
    } catch (err) {
      console.warn('Error saving routine language:', err);
      showToast('Failed to save routine language.');
    }
  };

  // Trigger manual test of Night Debrief
  const handleTestNightDebrief = () => {
    unlockAudio();
    window.dispatchEvent(new CustomEvent('TRIGGER_NIGHT_DEBRIEF'));
    showToast('Starting 9:00 PM AI Coach Night Debrief...');
  };

  return (
    <div
      className={`p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 ${className}`}
    >
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 text-white dark:bg-emerald-600 shadow-xl border border-white/10 text-xs font-bold animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Routine & Alarm Timings
              </h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                Voice Reminders
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Create, edit, and manage custom daily routines with natural spoken voice alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Routine</span>
          </button>
        </div>
      </div>

      {/* ==================== ROUTINE VOICE REMINDER LANGUAGE BAR ==================== */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Routine Voice Reminders Language
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                4 Modes
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalized spoken coach language for wake-up, workouts, hydration breaks, and custom schedules.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full sm:w-auto">
          {(
            [
              { id: 'en', label: 'English' },
              { id: 'ta', label: 'தமிழ்' },
              { id: 'tanglish', label: 'Tanglish' },
              { id: 'both', label: 'Both' },
            ] as const
          ).map((opt) => {
            const isActive = (settings.routineLanguage || 'tanglish') === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleUpdateRoutineLanguage(opt.id)}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all text-center ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================== AUTO-GENERATE HYDRATION BREAKS SECTION ==================== */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-cyan-50/70 via-blue-50/40 to-indigo-50/30 dark:from-cyan-950/20 dark:via-blue-950/15 dark:to-slate-900/40 border border-cyan-200/80 dark:border-cyan-800/40 shadow-sm space-y-5 transition-all">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-100 dark:border-cyan-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/25">
              <Droplets className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Auto-Generate Hydration Breaks
                </h4>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30">
                  Smart Interval Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Set interval hours and active window to automatically generate recurring spoken hydration reminders.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {existingHydrationRoutines.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                {existingHydrationRoutines.length} Breaks Active
              </span>
            ) : (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                Not Configured
              </span>
            )}
          </div>
        </div>

        {/* Configuration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Interval Selector & Active Time Pickers (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Interval Hours Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Interval Frequency
                </label>
                <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  Every {hydrationIntervalHours} {hydrationIntervalHours === 1 ? 'Hour' : 'Hours'}
                </span>
              </div>

              {/* Quick Select Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((hours) => {
                  const isSelected = hydrationIntervalHours === hours;
                  return (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setHydrationIntervalHours(hours)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                        isSelected
                          ? 'bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-600/25 dark:bg-cyan-500 dark:border-cyan-500'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-600'
                      }`}
                    >
                      <Droplets className={`w-3.5 h-3.5 ${isSelected ? 'fill-white/30' : 'text-cyan-500'}`} />
                      <span>Every {hours}h</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Interval Stepper Input */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Custom Interval:
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0.5"
                    max="8"
                    step="0.5"
                    value={hydrationIntervalHours}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0) setHydrationIntervalHours(val);
                    }}
                    className="w-20 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">hours</span>
                </div>
              </div>
            </div>

            {/* Active Start and End Time Pickers */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Active Hydration Hours Window
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                    Start Reminders
                  </span>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <input
                      type="time"
                      value={hydrationStartTime}
                      onChange={(e) => setHydrationStartTime(e.target.value)}
                      className="bg-transparent text-sm font-black font-mono text-slate-900 dark:text-white focus:outline-none w-full cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                    End Reminders
                  </span>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <input
                      type="time"
                      value={hydrationEndTime}
                      onChange={(e) => setHydrationEndTime(e.target.value)}
                      className="bg-transparent text-sm font-black font-mono text-slate-900 dark:text-white focus:outline-none w-full cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Voice Prompt Customization */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Personalized Spoken Voice Reminder
                </label>
                <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono font-semibold">
                  Use {'{name}'} for personalized user name
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={hydrationVoicePrompt}
                  onChange={(e) => setHydrationVoicePrompt(e.target.value)}
                  placeholder="{name}, time for a hydration break! Drink a glass of water to stay fresh."
                  className="w-full px-3.5 py-2.5 pr-20 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleTestVoice({
                      name: 'Hydration Break',
                      voicePrompt: hydrationVoicePrompt,
                      icon: '💧',
                    })
                  }
                  className="absolute right-1.5 top-1.5 px-2.5 py-1 rounded-lg bg-cyan-600 text-white text-[11px] font-bold hover:bg-cyan-500 transition shadow-xs flex items-center gap-1"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Preview</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Calculated Slots Live Preview & Actions (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between p-4 rounded-2xl bg-white/90 dark:bg-slate-800/80 border border-cyan-100 dark:border-cyan-900/30 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Schedule Preview
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300">
                  {previewHydrationSlots.length} Slots Computed
                </span>
              </div>

              {previewHydrationSlots.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                  {previewHydrationSlots.map((slot, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/40"
                    >
                      <span>💧</span>
                      <span>{slot.displayTime}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-rose-500 font-medium">
                  End time must be after start time to compute slots.
                </div>
              )}

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Clicking generate will calculate recurring intervals, save them to your routines, and enable voice alerts with 1-click water logging.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleGenerateHydrationSchedule}
                disabled={isGeneratingHydration || previewHydrationSlots.length === 0}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-cyan-600/25 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Droplets className="w-4 h-4 fill-white/20" />
                <span>{isGeneratingHydration ? 'Generating Slots...' : 'Generate Hydration Schedule'}</span>
              </button>

              {existingHydrationRoutines.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHydrationBreaks}
                  disabled={isClearingHydration}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isClearingHydration ? 'Clearing...' : 'Clear All Hydration Breaks'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 9:00 PM End-of-Day AI Coach Debrief & Sleep Blackout Section */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-purple-950/30 border border-indigo-500/30 dark:border-indigo-500/20 shadow-lg relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative space-y-5">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
                <Moon className="w-5 h-5 fill-white/20" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-wide">
                    End-of-Day Review & Sleep Mode
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {formatTime12h(settings.nightDebrief?.time || '21:00')}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>AI Coach</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated night voice debrief evaluating today's targets, followed by pitch-black OLED sleep mode.
                </p>
              </div>
            </div>

            {/* Master Toggle */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="text-xs font-bold text-slate-300">
                {settings.nightDebrief?.enabled !== false ? 'Active' : 'Disabled'}
              </span>
              <button
                type="button"
                onClick={() =>
                  handleUpdateNightDebrief({
                    enabled: settings.nightDebrief ? !settings.nightDebrief.enabled : false,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                  settings.nightDebrief?.enabled !== false ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.nightDebrief?.enabled !== false ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Time Selector & Blackout Setting */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-indigo-500/20 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    Debrief Scheduled Time
                  </span>
                  <span className="text-[11px] font-mono text-indigo-400 font-bold">
                    {formatTime12h(settings.nightDebrief?.time || '21:00')}
                  </span>
                </label>
                <input
                  type="time"
                  value={settings.nightDebrief?.time || '21:00'}
                  onChange={(e) => handleUpdateNightDebrief({ time: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Default is 9:00 PM. Triggers evaluation of workouts, nutrition, water & steps.
                </p>
              </div>

              {/* Blackout Mode Checkbox */}
              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.nightDebrief?.blackoutEnabled !== false}
                    onChange={(e) =>
                      handleUpdateNightDebrief({ blackoutEnabled: e.target.checked })
                    }
                    className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-950"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Power className="w-3 h-3 text-emerald-400" />
                      Auto-enter Pitch-Black Sleep Mode
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Fades the display into a 100% black OLED screen-off mode with double-tap wake when speech finishes.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* 2. Spoken Language & Test Button */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-indigo-500/20 flex flex-col justify-between space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  Spoken Voice Language
                </label>

                {/* 4-way Segmented Language Pill Selector */}
                <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleUpdateNightDebrief({ language: 'en' })}
                    className={`py-2 px-1 text-xs font-bold rounded-lg transition-all text-center ${
                      (settings.nightDebrief?.language || 'both') === 'en'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateNightDebrief({ language: 'ta' })}
                    className={`py-2 px-1 text-xs font-bold rounded-lg transition-all text-center ${
                      (settings.nightDebrief?.language || 'both') === 'ta'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    தமிழ்
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateNightDebrief({ language: 'tanglish' })}
                    className={`py-2 px-1 text-xs font-bold rounded-lg transition-all text-center ${
                      (settings.nightDebrief?.language || 'both') === 'tanglish'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tanglish
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateNightDebrief({ language: 'both' })}
                    className={`py-2 px-1 text-xs font-bold rounded-lg transition-all text-center ${
                      (settings.nightDebrief?.language || 'both') === 'both'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Both
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 mt-1.5">
                  {(settings.nightDebrief?.language || 'both') === 'en' &&
                    'Mode 1: Speaks 100% in natural, fluent Indian-English from start to finish.'}
                  {(settings.nightDebrief?.language || 'both') === 'ta' &&
                    'Mode 2: Speaks 100% in authentic, conversational spoken Tamil (Peccu Tamil).'}
                  {(settings.nightDebrief?.language || 'both') === 'tanglish' &&
                    'Mode 3: Speaks in a single unified Tanglish flow (English & Tamil code-switching with natural neural accents).'}
                  {(settings.nightDebrief?.language || 'both') === 'both' &&
                    'Mode 4: Speaks full natural English debrief first, followed cleanly by full Spoken Tamil debrief.'}
                </p>
              </div>

              {/* Test Button */}
              <button
                type="button"
                onClick={handleTestNightDebrief}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-black shadow-md shadow-indigo-600/30 transition active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Test 9 PM Night Debrief Now</span>
              </button>
            </div>
          </div>

          {/* 4-Pillar Overview Badges */}
          <div className="pt-2 border-t border-indigo-500/10 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-[10px] font-black text-emerald-400 block uppercase tracking-wider">
                1. Achievements
              </span>
              <span className="text-[11px] text-slate-300">Praise today's wins</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <span className="text-[10px] font-black text-amber-400 block uppercase tracking-wider">
                2. Coach Reality
              </span>
              <span className="text-[11px] text-slate-300">Firm accountability</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
              <span className="text-[10px] font-black text-indigo-400 block uppercase tracking-wider">
                3. Tomorrow Reset
              </span>
              <span className="text-[11px] text-slate-300">6:00 AM wake-up drive</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
              <span className="text-[10px] font-black text-purple-400 block uppercase tracking-wider">
                4. Screen Off
              </span>
              <span className="text-[11px] text-slate-300">OLED Sleep Blackout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Routine Cards List / Grid */}
      <div className="space-y-3">
        {routines.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
            <Clock className="w-8 h-8 text-slate-400 mx-auto animate-bounce" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No daily routines configured yet.
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click the button below to add your first routine or restore the default schedule.
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-500 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Routine</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routines.map((item) => {
              const isTesting = activeTestingId === item.id;
              const repeatBadge = getRepeatBadge(item.repeat || 'daily');
              const displayPhrase = buildSpokenPhrase(item, firstName, settings.routineLanguage || 'tanglish');

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all relative group ${
                    item.enabled
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 dark:hover:border-emerald-500/40'
                      : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/60 opacity-65'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl shadow-xs">
                        {item.icon || '⏰'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {item.name}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${repeatBadge.color}`}
                          >
                            {repeatBadge.label}
                          </span>
                          {item.nameTamil && (
                            <span className="text-[10px] font-bold text-slate-400">
                              • {item.nameTamil}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1 italic pt-0.5">
                          "{displayPhrase}"
                        </span>
                      </div>
                    </div>

                    {/* Enable / Disable Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleRoutine(item)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        item.enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      role="switch"
                      aria-checked={item.enabled}
                      title={item.enabled ? 'Routine is active' : 'Routine is paused'}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          item.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Time Picker, Voice Test & Action Controls */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        Time:
                      </span>
                      <input
                        type="time"
                        value={item.time}
                        disabled={!item.enabled}
                        onChange={(e) => handleInlineTimeChange(item, e.target.value)}
                        className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 shadow-xs cursor-pointer"
                        title="Click to edit routine time"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Voice Test Button */}
                      <button
                        type="button"
                        onClick={() => handleTestVoice(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                          isTesting
                            ? 'bg-rose-500 text-white animate-pulse'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400'
                        }`}
                        title="Test voice reminder"
                      >
                        {isTesting ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Test Voice</span>
                          </>
                        )}
                      </button>

                      {/* Edit Button (Pencil Icon) */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition"
                        title="Edit Routine & Spoken Prompt"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Delete Button (Trash Icon) */}
                      <button
                        type="button"
                        onClick={() => setRoutineToDelete(item)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                        title="Delete Routine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Global Voice & Alert Customization Controls */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
          <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Speech Cadence & Notification Preferences</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Master Voice Reminders Toggle */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                Voice Reminders
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Natural speech on routine time
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !settings.voiceRemindersEnabled;
                setSettings((p) => ({ ...p, voiceRemindersEnabled: next }));
                if (currentUser?.uid) {
                  saveRoutineSettings(currentUser.uid, { voiceRemindersEnabled: next });
                }
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.voiceRemindersEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.voiceRemindersEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Master In-App Notifications Toggle */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                In-App Modals
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Visual interactive alert card
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !settings.inAppNotificationEnabled;
                setSettings((p) => ({ ...p, inAppNotificationEnabled: next }));
                if (currentUser?.uid) {
                  saveRoutineSettings(currentUser.uid, { inAppNotificationEnabled: next });
                }
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.inAppNotificationEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.inAppNotificationEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Speech Rate Cadence Slider */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">
                Speech Cadence
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {settings.voiceRate}x
              </span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.05"
              value={settings.voiceRate}
              onChange={(e) => {
                const rate = parseFloat(e.target.value);
                setSettings((p) => ({ ...p, voiceRate: rate }));
                if (currentUser?.uid) {
                  saveRoutineSettings(currentUser.uid, { voiceRate: rate });
                }
              }}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Relaxed (0.8x)</span>
              <span>Natural (0.95x)</span>
              <span>Fast (1.2x)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== ADD / EDIT ROUTINE MODAL ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
            {/* Modal Ambient Top Header */}
            <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              {/* Modal Title & Close */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-lg">
                    {formIcon}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {editingRoutine ? 'Edit Routine & Voice Reminder' : 'Add New Daily Routine'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Personalized schedule & natural spoken voice prompt
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Template Suggestions (Shown when creating new) */}
              {!editingRoutine && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    <span>Quick Suggestions (Click to Autofill)</span>
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {QUICK_SUGGESTIONS.map((sug) => (
                      <button
                        key={sug.name}
                        type="button"
                        onClick={() => handleApplySuggestion(sug)}
                        className="shrink-0 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <span>{sug.icon}</span>
                        <span>{sug.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Content */}
              <form onSubmit={handleSaveRoutineForm} className="space-y-4">
                {/* 1. Routine Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Routine Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Morning Walk, Evening Meditation, Hydration Break"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* 2. Scheduled Time & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Scheduled Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Category
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Cardio">Cardio / Walk</option>
                      <option value="Workout">Workout / Exercise</option>
                      <option value="Wake-Up">Wake-Up</option>
                      <option value="Bedtime">Bedtime / Sleep</option>
                      <option value="Nutrition">Nutrition / Meal</option>
                      <option value="Meditation">Meditation / Mindfulness</option>
                      <option value="Hydration">Hydration / Water</option>
                      <option value="Custom">Custom Routine</option>
                    </select>
                  </div>
                </div>

                {/* 3. Repeat Frequency Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Repeat Frequency
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'daily', label: 'Daily', sub: 'Every day', icon: CalendarDays },
                      { value: 'weekdays', label: 'Weekdays', sub: 'Mon - Fri', icon: Calendar },
                      { value: 'weekends', label: 'Weekends', sub: 'Sat - Sun', icon: Calendar },
                    ].map((opt) => {
                      const isSelected = formRepeat === opt.value;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormRepeat(opt.value as RoutineRepeatFrequency)}
                          className={`p-2.5 rounded-xl border text-center transition ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-black shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
                          <div className="text-xs">{opt.label}</div>
                          <div className="text-[10px] opacity-75">{opt.sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Choose Icon */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Routine Icon
                  </label>
                  <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                    {AVAILABLE_ICONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormIcon(emoji)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition ${
                          formIcon === emoji
                            ? 'bg-emerald-500 text-white scale-110 shadow-md ring-2 ring-emerald-500/50'
                            : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Custom Spoken Voice Prompt */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Spoken Voice Reminder Prompt
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400">Fill in:</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormPrompt(
                            buildSpokenPhrase({ name: formName || 'Routine', category: formCategory }, '{name}', 'en')
                          )
                        }
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-500 hover:text-white transition"
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormPrompt(
                            buildSpokenPhrase({ name: formName || 'ரொட்டீன்', category: formCategory }, '{name}', 'ta')
                          )
                        }
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-500 hover:text-white transition"
                      >
                        தமிழ்
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormPrompt(
                            buildSpokenPhrase({ name: formName || 'Routine', category: formCategory }, '{name}', 'tanglish')
                          )
                        }
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-500 hover:text-white transition"
                      >
                        Tanglish
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={formPrompt}
                    onChange={(e) => setFormPrompt(e.target.value)}
                    placeholder="e.g. Akash, time for your evening meditation session!"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  {/* Spoken Preview Box & Voice Test */}
                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-700 dark:text-slate-300 italic line-clamp-2">
                      🗣️ "{buildSpokenPhrase({ name: formName || 'Routine', voicePrompt: formPrompt }, firstName, settings.routineLanguage || 'tanglish')}"
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleTestVoice({
                          name: formName || 'Routine',
                          voicePrompt: formPrompt,
                          icon: formIcon,
                        })
                      }
                      className="shrink-0 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition shadow-xs flex items-center gap-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Hear It</span>
                    </button>
                  </div>
                </div>

                {/* Submit & Cancel Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingRoutine}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition active:scale-[0.98] disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSavingRoutine ? 'Saving...' : editingRoutine ? 'Save Routine Changes' : 'Create Routine'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {routineToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Delete "{routineToDelete.name}"?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to permanently remove this daily routine and its voice reminder?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRoutineToDelete(null)}
                className="w-1/2 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Routine'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineSettingsCard;
