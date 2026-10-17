import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Droplets,
  CheckCircle2,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeRoutineSettings,
  subscribeCustomRoutines,
  subscribeUserProfile,
  dismissCustomRoutineForToday,
  dismissNightDebriefForToday,
  fetchTodayPerformanceData,
  logWaterIntake,
  getTodayDateString,
  type UserRoutineSettings,
  type CustomRoutineItem,
  type UserProfile,
  DEFAULT_ROUTINE_SETTINGS,
} from '../../services/firestoreService';
import {
  type RoutineType,
  speakRoutineVoiceReminder,
  stopRoutineSpeech,
  initUserGestureAudioUnlock,
  isRoutineActiveToday,
  buildSpokenPhrase,
} from '../../utils/routineVoiceEngine';
import {
  buildNightDebriefScript,
  type DebriefScript,
} from '../../utils/nightDebriefEngine';
import { generateAiNightDebriefScript } from '../../services/conversationalAiVoiceService';
import RoutineReminderModal from './RoutineReminderModal';
import NightDebriefModal from './NightDebriefModal';

interface ActiveToastNotification {
  routine: CustomRoutineItem | RoutineType;
  isHydration: boolean;
  title: string;
  time?: string;
  phrase: string;
  isLogging?: boolean;
  isLogged?: boolean;
}

export const RoutineManager: React.FC = () => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<UserRoutineSettings>(DEFAULT_ROUTINE_SETTINGS);
  const [customRoutines, setCustomRoutines] = useState<CustomRoutineItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Active Reminder Modal State
  const [activeRoutine, setActiveRoutine] = useState<CustomRoutineItem | RoutineType | null>(null);
  const activeRoutineRef = useRef<CustomRoutineItem | RoutineType | null>(null);
  activeRoutineRef.current = activeRoutine;

  // Active Top-Floating Toast Alert State
  const [activeToast, setActiveToast] = useState<ActiveToastNotification | null>(null);

  // 9:00 PM Night Debrief & Sleep Blackout State
  const [isDebriefModalOpen, setIsDebriefModalOpen] = useState(false);
  const [debriefScript, setDebriefScript] = useState<DebriefScript | null>(null);

  // Track latest settings & custom routines in refs to avoid stale closures in setInterval
  const settingsRef = useRef<UserRoutineSettings>(settings);
  settingsRef.current = settings;

  const customRoutinesRef = useRef<CustomRoutineItem[]>(customRoutines);
  customRoutinesRef.current = customRoutines;

  const userName = userProfile?.age
    ? currentUser?.displayName || 'Akash'
    : currentUser?.displayName || 'Akash';

  const launchNightDebrief = useCallback(async () => {
    if (!currentUser?.uid) return;
    try {
      const perfData = await fetchTodayPerformanceData(currentUser.uid);
      // Generate ultra-natural conversational script with Gemini AI or rich offline persona
      let script: DebriefScript;
      try {
        script = await generateAiNightDebriefScript(perfData, userName);
      } catch {
        script = buildNightDebriefScript(perfData, userName);
      }
      setDebriefScript(script);
      setIsDebriefModalOpen(true);
    } catch (err) {
      console.error('Failed to launch night debrief:', err);
    }
  }, [currentUser?.uid, userName]);

  // 1. Initialize user gesture audio unlock on mount
  useEffect(() => {
    const cleanup = initUserGestureAudioUnlock();
    return cleanup;
  }, []);

  // 2. Subscribe in real-time to user's routine settings, custom routines & profile
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubSettings = subscribeRoutineSettings(currentUser.uid, (data) => {
      setSettings(data);
    });

    const unsubCustom = subscribeCustomRoutines(currentUser.uid, (routines) => {
      setCustomRoutines(routines);
    });

    const unsubProfile = subscribeUserProfile(currentUser.uid, (p) => {
      setUserProfile(p);
    });

    return () => {
      unsubSettings();
      unsubCustom();
      unsubProfile();
    };
  }, [currentUser?.uid]);

  // 3. Global Event Listener for Manual Test Triggers
  useEffect(() => {
    const handleTestTrigger = (event: Event) => {
      const customEvent = event as CustomEvent<{ routine?: CustomRoutineItem; routineType?: RoutineType }>;
      const targetRoutine = customEvent.detail?.routine || customEvent.detail?.routineType || 'walking';

      const isHydration = typeof targetRoutine === 'string'
        ? targetRoutine === 'hydration'
        : targetRoutine.category?.toLowerCase() === 'hydration' ||
          targetRoutine.name.toLowerCase().includes('hydration') ||
          targetRoutine.name.toLowerCase().includes('தண்ணீர்') ||
          targetRoutine.icon === '💧';

      const phrase = buildSpokenPhrase(targetRoutine, userName);

      setActiveToast({
        routine: targetRoutine,
        isHydration,
        title: typeof targetRoutine === 'string' ? targetRoutine : targetRoutine.name,
        time: typeof targetRoutine === 'string' ? '' : targetRoutine.time,
        phrase,
      });

      if (settingsRef.current.inAppNotificationEnabled) {
        setActiveRoutine(targetRoutine);
      }

      if (settingsRef.current.voiceRemindersEnabled) {
        speakRoutineVoiceReminder(targetRoutine, userName, {
          rate: settingsRef.current.voiceRate,
          playChimeFirst: true,
        });
      }
    };

    window.addEventListener('TRIGGER_TEST_ROUTINE', handleTestTrigger);
    return () => {
      window.removeEventListener('TRIGGER_TEST_ROUTINE', handleTestTrigger);
    };
  }, [userName]);

  // 3b. Global Event Listener for Manual 9:00 PM Night Debrief Trigger
  useEffect(() => {
    const handleNightDebriefTrigger = () => {
      launchNightDebrief();
    };

    window.addEventListener('TRIGGER_NIGHT_DEBRIEF', handleNightDebriefTrigger);
    return () => {
      window.removeEventListener('TRIGGER_NIGHT_DEBRIEF', handleNightDebriefTrigger);
    };
  }, [launchNightDebrief]);

  // 4. Background Routine Clock Monitor (Runs every second)
  useEffect(() => {
    const checkRoutineTimes = () => {
      if (activeRoutineRef.current !== null || isDebriefModalOpen) return; // Modal already active

      const currentSettings = settingsRef.current;
      const routines = customRoutinesRef.current;
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;
      const todayStr = now.toISOString().split('T')[0];

      // 4a. Check Scheduled Night Debrief (Default 9:00 PM / 21:00)
      const nightDebrief = currentSettings.nightDebrief;
      if (nightDebrief && nightDebrief.enabled) {
        const debriefTime = nightDebrief.time || '21:00';
        if (currentTime === debriefTime && nightDebrief.lastDebriefDate !== todayStr) {
          if (currentUser?.uid) {
            dismissNightDebriefForToday(currentUser.uid, todayStr);
          }
          launchNightDebrief();
          return;
        }
      }

      for (const item of routines) {
        if (!item.enabled) continue;

        // Check repeat day matching (daily, weekdays, weekends)
        if (!isRoutineActiveToday(item.repeat, now)) continue;

        // Check if current time matches scheduled time (HH:mm)
        if (item.time === currentTime) {
          // Fire only if not already dismissed today
          if (item.lastDismissedDate !== todayStr) {
            const isHydration =
              item.category?.toLowerCase() === 'hydration' ||
              item.name.toLowerCase().includes('hydration') ||
              item.name.toLowerCase().includes('தண்ணீர்') ||
              item.icon === '💧';

            const phrase = buildSpokenPhrase(item, userName);

            // Trigger floating top toast alert
            setActiveToast({
              routine: item,
              isHydration,
              title: item.name,
              time: item.time,
              phrase,
            });

            // Trigger modal if inAppNotificationEnabled is true
            if (currentSettings.inAppNotificationEnabled) {
              setActiveRoutine(item);
            }

            // Mark as dismissed for today so it doesn't repeat within the same minute
            if (currentUser?.uid) {
              dismissCustomRoutineForToday(currentUser.uid, item.id, todayStr);
            }

            // Speak natural human-like voice reminder
            if (currentSettings.voiceRemindersEnabled) {
              speakRoutineVoiceReminder(item, userName, {
                rate: currentSettings.voiceRate,
                playChimeFirst: true,
              });
            }

            // Trigger native browser notification if allowed
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(item.name || 'Hydration Break', {
                  body: phrase,
                  icon: '/icon-192.png',
                });
              } catch {
                // Ignored
              }
            }

            break; // Handle one routine trigger at a time
          }
        }
      }
    };

    const timer = setInterval(checkRoutineTimes, 1000);
    return () => clearInterval(timer);
  }, [currentUser?.uid, userName]);

  // 1-Click Water Logging from Floating Toast Alert
  const handleToastLogWater = async () => {
    if (!currentUser?.uid || !activeToast || activeToast.isLogging || activeToast.isLogged) return;
    setActiveToast((prev) => (prev ? { ...prev, isLogging: true } : null));
    try {
      await logWaterIntake(currentUser.uid, getTodayDateString(), 250);
      setActiveToast((prev) => (prev ? { ...prev, isLogging: false, isLogged: true } : null));
      stopRoutineSpeech();
      setTimeout(() => {
        setActiveToast(null);
        setActiveRoutine(null);
      }, 1400);
    } catch (err) {
      console.warn('Error logging water intake from routine toast:', err);
      setActiveToast(null);
    }
  };

  const handleDismiss = () => {
    stopRoutineSpeech();
    setActiveRoutine(null);
    setActiveToast(null);
  };

  const handleAcknowledge = () => {
    stopRoutineSpeech();
    setActiveRoutine(null);
    setActiveToast(null);
  };

  return (
    <>
      {/* Top Floating Toast Notification Alert */}
      {activeToast && (
        <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none animate-in slide-in-from-top-4 duration-300">
          <div className="w-full max-w-lg rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-cyan-300 dark:border-cyan-700/80 shadow-2xl shadow-cyan-500/20 p-3.5 sm:p-4 flex items-center justify-between gap-3 pointer-events-auto">
            {/* Icon & Details */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md ${
                  activeToast.isHydration
                    ? 'bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-600 shadow-cyan-500/25'
                    : 'bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-emerald-500/25'
                }`}
              >
                {activeToast.isHydration ? (
                  <Droplets className="w-5 h-5 fill-white/20" />
                ) : (
                  <span className="text-lg">⏰</span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                    {activeToast.title}
                  </h4>
                  {activeToast.time && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {activeToast.time}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-sm">
                  {activeToast.phrase}
                </p>
              </div>
            </div>

            {/* Actions: Logged Button + Dismiss */}
            <div className="flex items-center gap-2 shrink-0">
              {activeToast.isHydration && (
                <button
                  type="button"
                  onClick={handleToastLogWater}
                  disabled={activeToast.isLogging || activeToast.isLogged}
                  className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition active:scale-95 shadow-md ${
                    activeToast.isLogged
                      ? 'bg-emerald-600 text-white shadow-emerald-500/25'
                      : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-cyan-500/25'
                  }`}
                >
                  {activeToast.isLogged ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 animate-bounce" />
                      <span>+250ml Logged!</span>
                    </>
                  ) : activeToast.isLogging ? (
                    <>
                      <Droplets className="w-3.5 h-3.5 animate-spin" />
                      <span>Logging...</span>
                    </>
                  ) : (
                    <>
                      <Droplets className="w-3.5 h-3.5 fill-white/20" />
                      <span>Logged (+250ml)</span>
                    </>
                  )}
                </button>
              )}

              {!activeRoutine && (
                <button
                  type="button"
                  onClick={() => setActiveRoutine(activeToast.routine)}
                  className="p-2 rounded-xl text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 transition text-xs font-bold"
                  title="Open full reminder"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  stopRoutineSpeech();
                  setActiveToast(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Routine Reminder Interactive Modal */}
      {activeRoutine && (
        <RoutineReminderModal
          isOpen={Boolean(activeRoutine)}
          routine={activeRoutine}
          userName={userName}
          voiceRate={settings.voiceRate}
          onDismiss={handleDismiss}
          onAcknowledge={handleAcknowledge}
        />
      )}

      {/* 9:00 PM End-of-Day AI Coach Debrief & Sleep Blackout Modal */}
      {isDebriefModalOpen && debriefScript && (
        <NightDebriefModal
          isOpen={isDebriefModalOpen}
          script={debriefScript}
          language={settings.nightDebrief?.language || 'both'}
          blackoutEnabled={settings.nightDebrief?.blackoutEnabled !== false}
          onClose={() => setIsDebriefModalOpen(false)}
          onDebriefCompleted={() => {
            if (currentUser?.uid) {
              dismissNightDebriefForToday(currentUser.uid, getTodayDateString());
            }
          }}
        />
      )}
    </>
  );
};

export default RoutineManager;


