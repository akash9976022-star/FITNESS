import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { heavyAlarmEngine } from '../services/heavyAlarmEngine';
import {
  bilingualBriefingSpeech,
  generateDailyBriefingSections,
} from '../services/bilingualBriefingSpeech';
import { DEVOTIONAL_TRACKS } from '../data/devotionalAudioData';
import type {
  AlarmPlaybackState,
  BriefingLanguage,
  BriefingSectionData,
  DevotionalTrack,
  AlarmTestStage,
  VoiceDiagnostics,
} from '../types/alarmBriefing';

interface AlarmBriefingContextType {
  playbackState: AlarmPlaybackState;
  isAlarmRinging: boolean;
  activeSectionIndex: number;
  activeLanguage: BriefingLanguage;
  currentUtteranceText: string;
  activeSections: BriefingSectionData[];
  isBriefingPaused: boolean;
  alarmSecondsRemaining: number;

  // Test simulation state
  isTestMode: boolean;
  testStage: AlarmTestStage;
  testStageLabel: string;
  voiceDiagnostics: VoiceDiagnostics;

  // Devotional state
  activeDevotionalTrackId: 'kanda_sashti_kavasam' | 'sivapuranam';
  activeDevotionalTrack: DevotionalTrack;
  devotionalVerseIndex: number;
  devotionalProgress: number;
  isDevotionalPlaying: boolean;
  volume: number;

  // Real-time soundwave data
  audioFrequencies: number[];

  // Action Methods
  triggerAlarmManually: () => Promise<void>;
  triggerAlarmTest: () => Promise<void>;
  stopAlarmAndStartBriefing: () => Promise<void>;
  startBriefingDirect: () => Promise<void>;
  skipBriefingToDevotional: () => Promise<void>;
  pauseResumeBriefing: () => void;
  stopAll: () => void;
  switchDevotionalTrack: (trackId: 'kanda_sashti_kavasam' | 'sivapuranam') => Promise<void>;
  toggleDevotionalPlayback: () => void;
  setMasterVolume: (vol: number) => void;
}

const AlarmBriefingContext = createContext<AlarmBriefingContextType | undefined>(undefined);

const ALARM_TRIGGER_STORAGE_KEY = 'fitmaintenance_last_alarm_date';

export const AlarmBriefingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, currentWorkout, notificationSettings } = useAuth();

  const [playbackState, setPlaybackState] = useState<AlarmPlaybackState>('idle');
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const [alarmSecondsRemaining, setAlarmSecondsRemaining] = useState(60);

  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [activeLanguage, setActiveLanguage] = useState<BriefingLanguage>('en');
  const [currentUtteranceText, setCurrentUtteranceText] = useState('');
  const [isBriefingPaused, setIsBriefingPaused] = useState(false);

  // Devotional state
  const [activeDevotionalTrackId, setActiveDevotionalTrackId] = useState<'kanda_sashti_kavasam' | 'sivapuranam'>(
    'kanda_sashti_kavasam'
  );
  const [devotionalVerseIndex, setDevotionalVerseIndex] = useState(0);
  const [devotionalProgress, setDevotionalProgress] = useState(0);
  const [isDevotionalPlaying, setIsDevotionalPlaying] = useState(false);
  const [volume, setVolumeState] = useState(1.0);

  // Soundwave visualizer frequencies
  const [audioFrequencies, setAudioFrequencies] = useState<number[]>(() => new Array(16).fill(0));

  const [isTestMode, setIsTestMode] = useState(false);
  const [voiceDiagnostics, setVoiceDiagnostics] = useState<VoiceDiagnostics>(() =>
    bilingualBriefingSpeech.getVoiceDiagnostics()
  );

  // Re-verify speech synthesis voices when loaded
  useEffect(() => {
    const updateDiagnostics = () => {
      setVoiceDiagnostics(bilingualBriefingSpeech.getVoiceDiagnostics());
    };
    updateDiagnostics();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateDiagnostics;
    }
  }, []);

  // Compute daily briefing sections dynamically
  const activeSections = useMemo(() => {
    return generateDailyBriefingSections({
      preferredRasi: notificationSettings.preferredRasi || 'mesham',
      targetCalories: userProfile.targetCalories,
      targetProtein: userProfile.targetProtein,
      waterGoalMl: userProfile.waterGoalMl,
      workoutTitle: currentWorkout?.routineName || currentWorkout?.name || currentWorkout?.routine,
    });
  }, [notificationSettings.preferredRasi, userProfile, currentWorkout]);

  const activeDevotionalTrack = useMemo(() => {
    return (
      DEVOTIONAL_TRACKS.find((t) => t.id === activeDevotionalTrackId) ||
      DEVOTIONAL_TRACKS[0]
    );
  }, [activeDevotionalTrackId]);

  // Real-time test simulation stage
  const testStage: AlarmTestStage = useMemo(() => {
    if (playbackState === 'ringing') return 'testing_alarm';
    if (playbackState === 'briefing') {
      return activeLanguage === 'en' ? 'speaking_en' : 'speaking_ta';
    }
    if (playbackState === 'devotional') return 'playing_devotional';
    return 'idle';
  }, [playbackState, activeLanguage]);

  // Real-time live status badge label during testing or normal execution
  const testStageLabel: string = useMemo(() => {
    if (testStage === 'testing_alarm') {
      return 'Testing Alarm (Max Volume 100%)...';
    }
    if (testStage === 'speaking_en') {
      const sec = activeSections[activeSectionIndex];
      return `Speaking English (${activeSectionIndex + 1}/${activeSections.length}: ${sec?.labelEn || 'Briefing'})...`;
    }
    if (testStage === 'speaking_ta') {
      const sec = activeSections[activeSectionIndex];
      return `Speaking தமிழ் (${activeSectionIndex + 1}/${activeSections.length}: ${sec?.labelTa || 'காலை செய்திகள்'})...`;
    }
    if (testStage === 'playing_devotional') {
      return `Playing Devotional Audio (${activeDevotionalTrack.titleEn} / ${activeDevotionalTrack.titleTa})...`;
    }
    return '';
  }, [testStage, activeSectionIndex, activeSections, activeDevotionalTrack]);

  // Visualizer polling interval (when audio is active)
  useEffect(() => {
    let animId: number;
    const pollFrequencies = () => {
      if (playbackState !== 'idle') {
        const freqs = heavyAlarmEngine.getAudioFrequencyData();
        setAudioFrequencies(freqs);
      } else {
        setAudioFrequencies(new Array(16).fill(0));
      }
      animId = requestAnimationFrame(pollFrequencies);
    };

    animId = requestAnimationFrame(pollFrequencies);
    return () => cancelAnimationFrame(animId);
  }, [playbackState]);

  /**
   * Action 1: Trigger the assertive max-volume wakeup alarm
   */
  const triggerAlarmManually = async () => {
    setPlaybackState('ringing');
    setIsAlarmRinging(true);
    setAlarmSecondsRemaining(60);

    // Force volume override to 1.0 (Max device volume)
    if (notificationSettings.alarmMaxVolume ?? true) {
      heavyAlarmEngine.setMasterVolume(1.0);
      setVolumeState(1.0);
    }

    await heavyAlarmEngine.startAssertiveAlarm((remainingSecs) => {
      setAlarmSecondsRemaining(remainingSecs);
    });
  };

  /**
   * Action 2: Stop Alarm & Start Dual-Language Briefing
   */
  const stopAlarmAndStartBriefing = async () => {
    heavyAlarmEngine.stopAlarm();
    setIsAlarmRinging(false);
    setPlaybackState('briefing');
    setActiveSectionIndex(0);
    setActiveLanguage('en');
    setIsBriefingPaused(false);

    // 1. Start calming ambient instrumental background music at subtle volume (0.2)
    await heavyAlarmEngine.startBackgroundInstrumental(0.2);

    // 2. Start Dual-Language Speech Synthesis Sequence
    await bilingualBriefingSpeech.playBilingualBriefing(activeSections, {
      onSectionChange: (secIndex, lang, text) => {
        setActiveSectionIndex(secIndex);
        setActiveLanguage(lang);
        setCurrentUtteranceText(text);
      },
      onComplete: async () => {
        // 3. Once speech completes, smoothly transition into continuous devotional playback
        heavyAlarmEngine.stopBackgroundInstrumental();
        if (notificationSettings.devotionalMusicEnabled ?? true) {
          await startDevotionalContinuation('kanda_sashti_kavasam');
        } else {
          stopAll();
        }
      },
      onError: (err) => {
        console.warn('Briefing speech completed with notice, transitioning to devotional:', err);
        heavyAlarmEngine.stopBackgroundInstrumental();
        if (notificationSettings.devotionalMusicEnabled ?? true) {
          startDevotionalContinuation('kanda_sashti_kavasam');
        } else {
          stopAll();
        }
      },
    });
  };

  /**
   * Action 1.5: Trigger interactive Test of Morning Alarm & Dual-Language Briefing
   */
  const triggerAlarmTest = async () => {
    setIsTestMode(true);
    await triggerAlarmManually();
  };

  /**
   * Action 3: Directly launch briefing from Dashboard without alarm
   */
  const startBriefingDirect = async () => {
    await stopAlarmAndStartBriefing();
  };

  /**
   * Action 3.5: Fast-forward / Skip Briefing speech directly to Devotional Hymns (Step 4 testing)
   */
  const skipBriefingToDevotional = async () => {
    bilingualBriefingSpeech.stopBriefing();
    await startDevotionalContinuation('kanda_sashti_kavasam');
  };

  /**
   * Action 4: Start Devotional audio track
   */
  const startDevotionalContinuation = async (trackId: 'kanda_sashti_kavasam' | 'sivapuranam') => {
    setPlaybackState('devotional');
    setActiveDevotionalTrackId(trackId);
    setIsDevotionalPlaying(true);
    setDevotionalVerseIndex(0);
    setDevotionalProgress(0);

    const track = DEVOTIONAL_TRACKS.find((t) => t.id === trackId) || DEVOTIONAL_TRACKS[0];

    await heavyAlarmEngine.playDevotionalTrack(
      trackId,
      track.durationSeconds,
      {
        onVerseProgress: (verseIdx, progressPct) => {
          setDevotionalVerseIndex(verseIdx);
          setDevotionalProgress(progressPct);
        },
        onTrackChange: (newTrackId) => {
          setActiveDevotionalTrackId(newTrackId);
          setDevotionalVerseIndex(0);
          setDevotionalProgress(0);
        },
        onComplete: () => {
          stopAll();
        },
      }
    );
  };

  /**
   * Action 5: Switch devotional track manually
   */
  const switchDevotionalTrack = async (trackId: 'kanda_sashti_kavasam' | 'sivapuranam') => {
    await startDevotionalContinuation(trackId);
  };

  /**
   * Action 6: Pause or resume briefing speech
   */
  const pauseResumeBriefing = () => {
    if (playbackState === 'briefing') {
      if (isBriefingPaused) {
        bilingualBriefingSpeech.resumeBriefing();
        setIsBriefingPaused(false);
      } else {
        bilingualBriefingSpeech.pauseBriefing();
        setIsBriefingPaused(true);
      }
    }
  };

  /**
   * Action 7: Toggle Devotional playback
   */
  const toggleDevotionalPlayback = () => {
    if (playbackState === 'devotional') {
      if (isDevotionalPlaying) {
        heavyAlarmEngine.pauseDevotional();
        setIsDevotionalPlaying(false);
      } else {
        heavyAlarmEngine.resumeDevotional();
        setIsDevotionalPlaying(true);
      }
    }
  };

  /**
   * Action 8: Master Volume Adjustment
   */
  const setMasterVolume = (newVol: number) => {
    const clamped = Math.max(0, Math.min(1.0, newVol));
    setVolumeState(clamped);
    heavyAlarmEngine.setMasterVolume(clamped);
  };

  /**
   * Action 9: Full Stop & Reset
   */
  const stopAll = () => {
    heavyAlarmEngine.stopAllAudio();
    bilingualBriefingSpeech.stopBriefing();
    setPlaybackState('idle');
    setIsAlarmRinging(false);
    setIsDevotionalPlaying(false);
    setIsBriefingPaused(false);
    setIsTestMode(false);
    setCurrentUtteranceText('');
    setDevotionalProgress(0);
    setAudioFrequencies(new Array(16).fill(0));
  };

  /**
   * Background Alarm Watcher (Runs every 1000ms)
   * Fires exactly at notificationSettings.heavySleeperAlarmTime (default 06:00 AM)
   */
  useEffect(() => {
    const checkAlarmTime = () => {
      if (!notificationSettings.heavySleeperAlarmEnabled) return;
      if (isAlarmRinging || playbackState !== 'idle') return;

      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const targetTimeStr = notificationSettings.heavySleeperAlarmTime || '06:00';

      const todayYMD = now.toISOString().split('T')[0];
      const lastTriggeredDate = localStorage.getItem(ALARM_TRIGGER_STORAGE_KEY);

      if (currentTimeStr === targetTimeStr && lastTriggeredDate !== todayYMD) {
        localStorage.setItem(ALARM_TRIGGER_STORAGE_KEY, todayYMD);
        triggerAlarmManually();
      }
    };

    const interval = setInterval(checkAlarmTime, 1000);
    return () => clearInterval(interval);
  }, [notificationSettings.heavySleeperAlarmEnabled, notificationSettings.heavySleeperAlarmTime, isAlarmRinging, playbackState]);

  return (
    <AlarmBriefingContext.Provider
      value={{
        playbackState,
        isAlarmRinging,
        activeSectionIndex,
        activeLanguage,
        currentUtteranceText,
        activeSections,
        isBriefingPaused,
        alarmSecondsRemaining,
        isTestMode,
        testStage,
        testStageLabel,
        voiceDiagnostics,
        activeDevotionalTrackId,
        activeDevotionalTrack,
        devotionalVerseIndex,
        devotionalProgress,
        isDevotionalPlaying,
        volume,
        audioFrequencies,
        triggerAlarmManually,
        triggerAlarmTest,
        stopAlarmAndStartBriefing,
        startBriefingDirect,
        skipBriefingToDevotional,
        pauseResumeBriefing,
        stopAll,
        switchDevotionalTrack,
        toggleDevotionalPlayback,
        setMasterVolume,
      }}
    >
      {children}
    </AlarmBriefingContext.Provider>
  );
};

export const useAlarmBriefing = (): AlarmBriefingContextType => {
  const context = useContext(AlarmBriefingContext);
  if (!context) {
    throw new Error('useAlarmBriefing must be used within an AlarmBriefingProvider');
  }
  return context;
};
