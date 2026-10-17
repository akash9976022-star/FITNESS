import React, { useState, useEffect } from 'react';
import {
  Clock,
  Sun,
  Footprints,
  Dumbbell,
  Moon,
  Volume2,
  VolumeX,
  CheckCircle2,
  Sliders,
  Save,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeRoutineSettings,
  saveRoutineSettings,
  subscribeUserProfile,
  type UserRoutineSettings,
  type UserProfile,
  DEFAULT_ROUTINE_SETTINGS,
} from '../../services/firestoreService';
import {
  speakRoutineVoiceReminder,
  stopRoutineSpeech,
  type RoutineType,
} from '../../utils/routineVoiceEngine';

interface RoutineSettingsCardProps {
  className?: string;
  onSaved?: () => void;
}

export const RoutineSettingsCard: React.FC<RoutineSettingsCardProps> = ({
  className = '',
  onSaved,
}) => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<UserRoutineSettings>(DEFAULT_ROUTINE_SETTINGS);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTestingRoutine, setActiveTestingRoutine] = useState<RoutineType | null>(null);

  const userName = profile?.age ? currentUser?.displayName || 'Akash' : currentUser?.displayName || 'Akash';

  // Subscribe to real-time Routine Settings and User Profile
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubSettings = subscribeRoutineSettings(currentUser.uid, (data) => {
      setSettings(data);
    });

    const unsubProfile = subscribeUserProfile(currentUser.uid, (p) => {
      setProfile(p);
    });

    return () => {
      unsubSettings();
      unsubProfile();
    };
  }, [currentUser?.uid]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleTimeChange = (routineKey: 'wakeUp' | 'walking' | 'workout' | 'bedtime', time: string) => {
    setSettings((prev) => ({
      ...prev,
      [routineKey]: {
        ...prev[routineKey],
        time,
      },
    }));
  };

  const handleToggleRoutine = (routineKey: 'wakeUp' | 'walking' | 'workout' | 'bedtime') => {
    setSettings((prev) => ({
      ...prev,
      [routineKey]: {
        ...prev[routineKey],
        enabled: !prev[routineKey].enabled,
      },
    }));
  };

  const handleTestVoice = (routineKey: RoutineType) => {
    if (activeTestingRoutine === routineKey) {
      stopRoutineSpeech();
      setActiveTestingRoutine(null);
      return;
    }

    setActiveTestingRoutine(routineKey);
    speakRoutineVoiceReminder(routineKey, userName, {
      rate: settings.voiceRate,
      playChimeFirst: true,
      onStart: () => setActiveTestingRoutine(routineKey),
      onEnd: () => setActiveTestingRoutine(null),
    });
  };

  const handleSave = async () => {
    if (!currentUser?.uid) return;
    setIsSaving(true);
    try {
      await saveRoutineSettings(currentUser.uid, settings);
      showToast('Routine timings & voice settings saved to Firestore!');
      onSaved?.();
    } catch (err) {
      console.warn('Failed to save routine settings:', err);
      showToast('Saved locally in persistent cache.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    setSettings(DEFAULT_ROUTINE_SETTINGS);
    showToast('Reset to recommended daily routine schedule.');
  };

  const routineItems: Array<{
    key: 'wakeUp' | 'walking' | 'workout' | 'bedtime';
    title: string;
    tamilTitle: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    bgAccent: string;
    borderAccent: string;
    defaultTimeDisplay: string;
  }> = [
    {
      key: 'wakeUp',
      title: 'Wake-Up Routine',
      tamilTitle: 'காலை விழிப்பு',
      description: 'Awaken with positive motivation, deep hydration, and morning focus.',
      icon: Sun,
      accentColor: 'text-amber-500',
      bgAccent: 'bg-amber-50 dark:bg-amber-500/10',
      borderAccent: 'border-amber-200 dark:border-amber-500/20',
      defaultTimeDisplay: '6:00 AM',
    },
    {
      key: 'walking',
      title: 'Morning Walking & Cardio',
      tamilTitle: 'காலை நடைப்பயிற்சி',
      description: 'Lace up your walking shoes for fresh air, sunlight, and steady steps.',
      icon: Footprints,
      accentColor: 'text-emerald-500',
      bgAccent: 'bg-emerald-50 dark:bg-emerald-500/10',
      borderAccent: 'border-emerald-200 dark:border-emerald-500/20',
      defaultTimeDisplay: '6:30 AM',
    },
    {
      key: 'workout',
      title: 'Exercise & Workout Time',
      tamilTitle: 'உடற்பயிற்சி நேரம்',
      description: 'Hit the gym, execute your sets, and maintain high consistency.',
      icon: Dumbbell,
      accentColor: 'text-indigo-500',
      bgAccent: 'bg-indigo-50 dark:bg-indigo-500/10',
      borderAccent: 'border-indigo-200 dark:border-indigo-500/20',
      defaultTimeDisplay: '5:00 PM',
    },
    {
      key: 'bedtime',
      title: 'Bedtime & Night Recovery',
      tamilTitle: 'இரவு உறக்கம்',
      description: 'Dim screens, relax your nervous system, and prioritize 8 hours sleep.',
      icon: Moon,
      accentColor: 'text-purple-500',
      bgAccent: 'bg-purple-50 dark:bg-purple-500/10',
      borderAccent: 'border-purple-200 dark:border-purple-500/20',
      defaultTimeDisplay: '10:00 PM',
    },
  ];

  return (
    <div
      className={`p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 ${className}`}
    >
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
                Voice Alerts
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Daily schedule with personalized human-like natural speech reminders.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetToDefaults}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Routine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {routineItems.map((item) => {
          const setting = settings[item.key];
          const IconComp = item.icon;
          const isTesting = activeTestingRoutine === item.key;

          return (
            <div
              key={item.key}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                setting.enabled
                  ? `${item.bgAccent} ${item.borderAccent} shadow-xs`
                  : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/60 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center ${item.accentColor} shadow-xs`}
                  >
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        • {item.tamilTitle}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                      {item.description}
                    </span>
                  </div>
                </div>

                {/* On / Off Switch */}
                <button
                  type="button"
                  onClick={() => handleToggleRoutine(item.key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    setting.enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={setting.enabled}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      setting.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Time Picker & Voice Preview Controls */}
              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Set Time:
                  </span>
                  <input
                    type="time"
                    value={setting.time}
                    disabled={!setting.enabled}
                    onChange={(e) => handleTimeChange(item.key, e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 shadow-xs"
                  />
                </div>

                {/* Voice Test Button */}
                <button
                  type="button"
                  onClick={() => handleTestVoice(item.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                    isTesting
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400'
                  }`}
                >
                  {isTesting ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Stop Voice</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Test Voice</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
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
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  voiceRemindersEnabled: !prev.voiceRemindersEnabled,
                }))
              }
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
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  inAppNotificationEnabled: !prev.inAppNotificationEnabled,
                }))
              }
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
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  voiceRate: parseFloat(e.target.value),
                }))
              }
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

      {/* Save Action & Feedback */}
      <div className="flex items-center justify-between pt-2">
        {toastMessage ? (
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </span>
        ) : (
          <span className="text-xs text-slate-400 font-medium">
            Changes are securely synced to your cloud account.
          </span>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-[0.98] disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Routine Settings'}</span>
        </button>
      </div>
    </div>
  );
};

export default RoutineSettingsCard;
