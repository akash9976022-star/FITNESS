import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeAlarmSettings,
  subscribeAlarmVideos,
  saveAlarmSettings,
  subscribeUserProfile,
  type UserAlarmSettings,
  type AlarmVideoItem,
  type UserProfile,
  DEFAULT_ALARM_SETTINGS,
} from '../../services/firestoreService';
import { getCalendarDayInfo } from '../../utils/tamilCalendar';
import { buildMorningBriefingContent } from '../../utils/audioAlarmEngine';
import AlarmModal from './AlarmModal';
import MorningBriefingModal from './MorningBriefingModal';
import AlarmSettingsModal from './AlarmSettingsModal';

export const AlarmManager: React.FC = () => {
  const { currentUser } = useAuth();

  // Settings & Custom Videos from Firestore
  const [alarmSettings, setAlarmSettings] = useState<UserAlarmSettings>(DEFAULT_ALARM_SETTINGS);
  const [customVideos, setCustomVideos] = useState<AlarmVideoItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Modals Visibility
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [isBriefingModalOpen, setIsBriefingModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const today = useMemo(() => new Date(), [isAlarmModalOpen, isBriefingModalOpen]);
  const tamilDateInfo = useMemo(() => getCalendarDayInfo(today), [today]);

  // Subscribe to Alarm Settings & Custom Videos
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubSettings = subscribeAlarmSettings(currentUser.uid, (settings) => {
      setAlarmSettings(settings);
    });

    const unsubVideos = subscribeAlarmVideos(currentUser.uid, (videos) => {
      setCustomVideos(videos);
    });

    const unsubProfile = subscribeUserProfile(currentUser.uid, (profile) => {
      setUserProfile(profile);
    });

    return () => {
      unsubSettings();
      unsubVideos();
      unsubProfile();
    };
  }, [currentUser?.uid]);

  // Global Event Listeners for Manual Triggers (e.g. from Dashboard "Test Alarm" or Settings)
  useEffect(() => {
    const handleTriggerTest = () => {
      setIsAlarmModalOpen(true);
    };

    const handleOpenSettings = () => {
      setIsSettingsModalOpen(true);
    };

    window.addEventListener('TRIGGER_TEST_ALARM', handleTriggerTest);
    window.addEventListener('OPEN_ALARM_SETTINGS', handleOpenSettings);

    return () => {
      window.removeEventListener('TRIGGER_TEST_ALARM', handleTriggerTest);
      window.removeEventListener('OPEN_ALARM_SETTINGS', handleOpenSettings);
    };
  }, []);

  // Background 6:00 AM Alarm Ticker
  useEffect(() => {
    if (!alarmSettings.enabled) return;

    const checkAlarmTime = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeFormatted = `${currentHours}:${currentMinutes}`;
      const todayDateStr = now.toISOString().split('T')[0];

      // Check if current time matches scheduled alarm time (e.g. 06:00)
      if (currentTimeFormatted === alarmSettings.time) {
        // Only fire if not already dismissed today
        if (alarmSettings.lastDismissedDate !== todayDateStr && !isAlarmModalOpen && !isBriefingModalOpen) {
          setIsAlarmModalOpen(true);
        }
      }
    };

    // Check every second
    const interval = setInterval(checkAlarmTime, 1000);
    return () => clearInterval(interval);
  }, [alarmSettings, isAlarmModalOpen, isBriefingModalOpen]);

  // Handle Alarm Dismissal -> Immediately Start Morning Briefing
  const handleDismissAndStartBriefing = async () => {
    setIsAlarmModalOpen(false);

    if (currentUser?.uid) {
      const todayDateStr = new Date().toISOString().split('T')[0];
      await saveAlarmSettings(currentUser.uid, {
        lastDismissedDate: todayDateStr,
      });
    }

    setIsBriefingModalOpen(true);
  };

  const handleSnooze = () => {
    setIsAlarmModalOpen(false);
    // Snooze 5 minutes: re-trigger after 5 mins
    setTimeout(() => {
      setIsAlarmModalOpen(true);
    }, 5 * 60 * 1000);
  };

  // Build the 5-pillar Dual-Language briefing content
  const briefingSections = useMemo(() => {
    return buildMorningBriefingContent({
      userName: currentUser?.displayName || 'Athlete',
      date: today,
      tamilDateInfo,
      userRasiId: alarmSettings.selectedRasi || 'mesham',
      maintenanceCalories: userProfile?.calculatedTdee || 2200,
      targetWeightKg: userProfile?.targetWeightKg || 70,
      targetProteinGrams: Math.round((userProfile?.currentWeightKg || userProfile?.targetWeightKg || 70) * 2),
    });
  }, [currentUser, userProfile, today, tamilDateInfo, alarmSettings.selectedRasi]);

  return (
    <>
      {/* 1. Full-Screen Video Playback Heavy-Sleeper Alarm Modal */}
      <AlarmModal
        isOpen={isAlarmModalOpen}
        alarmSettings={alarmSettings}
        customVideos={customVideos}
        tamilDateInfo={tamilDateInfo}
        onDismissAndStartBriefing={handleDismissAndStartBriefing}
        onSnooze={handleSnooze}
      />

      {/* 2. Dual-Language Speech Briefing & Devotional Streaming Modal */}
      <MorningBriefingModal
        isOpen={isBriefingModalOpen}
        sections={briefingSections}
        onClose={() => setIsBriefingModalOpen(false)}
        autoStartDevotionals={alarmSettings.playDevotionals}
      />

      {/* 3. Alarm & Video Song Library Settings Modal */}
      {currentUser?.uid && (
        <AlarmSettingsModal
          isOpen={isSettingsModalOpen}
          userId={currentUser.uid}
          alarmSettings={alarmSettings}
          customVideos={customVideos}
          onClose={() => setIsSettingsModalOpen(false)}
          onTriggerTestAlarm={() => setIsAlarmModalOpen(true)}
          onUpdateSettings={(newSettings) => {
            setAlarmSettings((prev) => ({ ...prev, ...newSettings }));
          }}
        />
      )}
    </>
  );
};

export default AlarmManager;
