import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeRoutineSettings,
  subscribeUserProfile,
  dismissRoutineForToday,
  type UserRoutineSettings,
  type UserProfile,
  DEFAULT_ROUTINE_SETTINGS,
} from '../../services/firestoreService';
import {
  type RoutineType,
  speakRoutineVoiceReminder,
  stopRoutineSpeech,
  initUserGestureAudioUnlock,
} from '../../utils/routineVoiceEngine';
import RoutineReminderModal from './RoutineReminderModal';

export const RoutineManager: React.FC = () => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<UserRoutineSettings>(DEFAULT_ROUTINE_SETTINGS);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Active Reminder Modal State
  const [activeRoutine, setActiveRoutine] = useState<RoutineType | null>(null);
  const activeRoutineRef = useRef<RoutineType | null>(null);
  activeRoutineRef.current = activeRoutine;

  // Track latest settings in ref to avoid stale closures in setInterval
  const settingsRef = useRef<UserRoutineSettings>(settings);
  settingsRef.current = settings;

  const userName = userProfile?.age
    ? currentUser?.displayName || 'Akash'
    : currentUser?.displayName || 'Akash';

  // 1. Initialize user gesture audio unlock on mount
  useEffect(() => {
    const cleanup = initUserGestureAudioUnlock();
    return cleanup;
  }, []);

  // 2. Subscribe in real-time to user's routine settings & profile
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubSettings = subscribeRoutineSettings(currentUser.uid, (data) => {
      setSettings(data);
    });

    const unsubProfile = subscribeUserProfile(currentUser.uid, (p) => {
      setUserProfile(p);
    });

    return () => {
      unsubSettings();
      unsubProfile();
    };
  }, [currentUser?.uid]);

  // 3. Global Event Listener for Manual Test Triggers
  useEffect(() => {
    const handleTestTrigger = (event: Event) => {
      const customEvent = event as CustomEvent<{ routineType?: RoutineType }>;
      const targetType = customEvent.detail?.routineType || 'walking';

      setActiveRoutine(targetType);
      if (settingsRef.current.voiceRemindersEnabled) {
        speakRoutineVoiceReminder(targetType, userName, {
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

  // 4. Background Routine Clock Monitor (Runs every second)
  useEffect(() => {
    const checkRoutineTimes = () => {
      if (activeRoutineRef.current !== null) return; // Modal already active

      const currentSettings = settingsRef.current;
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;
      const todayStr = now.toISOString().split('T')[0];

      const routinesToCheck: RoutineType[] = ['wakeUp', 'walking', 'workout', 'bedtime'];

      for (const key of routinesToCheck) {
        const item = currentSettings[key];
        if (!item || !item.enabled) continue;

        // Check if current time matches scheduled time
        if (item.time === currentTime) {
          const dismissedDates = currentSettings.lastDismissedDate || {};
          const lastDismissed = dismissedDates[key];

          // Fire only if not already dismissed today
          if (lastDismissed !== todayStr) {
            setActiveRoutine(key);

            // Mark as dismissed for today so it doesn't repeat within the same minute
            if (currentUser?.uid) {
              dismissRoutineForToday(currentUser.uid, key, todayStr);
            }

            // Speak natural voice reminder
            if (currentSettings.voiceRemindersEnabled) {
              speakRoutineVoiceReminder(key, userName, {
                rate: currentSettings.voiceRate,
                playChimeFirst: true,
              });
            }

            break; // Handle one routine trigger at a time
          }
        }
      }
    };

    const timer = setInterval(checkRoutineTimes, 1000);
    return () => clearInterval(timer);
  }, [currentUser?.uid, userName]);

  const handleDismiss = () => {
    stopRoutineSpeech();
    setActiveRoutine(null);
  };

  const handleAcknowledge = () => {
    stopRoutineSpeech();
    setActiveRoutine(null);
  };

  return (
    <>
      {activeRoutine && (
        <RoutineReminderModal
          isOpen={Boolean(activeRoutine)}
          routineType={activeRoutine}
          userName={userName}
          voiceRate={settings.voiceRate}
          onDismiss={handleDismiss}
          onAcknowledge={handleAcknowledge}
        />
      )}
    </>
  );
};

export default RoutineManager;
