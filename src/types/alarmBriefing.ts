export type AlarmPlaybackState = 'idle' | 'ringing' | 'briefing' | 'devotional';

export type BriefingLanguage = 'en' | 'ta';

export type BriefingSectionKey =
  | 'greeting'
  | 'panchangam'
  | 'rasipalan'
  | 'fitness_goals'
  | 'motivation'
  | 'spiritual_transition';

export interface BriefingSectionData {
  key: BriefingSectionKey;
  order: number;
  labelEn: string;
  labelTa: string;
  textEn: string;
  textTa: string;
  iconName: string;
}

export interface DevotionalTrack {
  id: 'kanda_sashti_kavasam' | 'sivapuranam';
  titleEn: string;
  titleTa: string;
  deity: string;
  authorEn: string;
  authorTa: string;
  durationSeconds: number;
  descriptionEn: string;
  descriptionTa: string;
  audioUrl?: string;
  fallbackCdnUrl?: string;
  verses: Array<{
    lineTa: string;
    lineEn: string;
    meaningEn?: string;
  }>;
}

export interface VoiceDiagnostics {
  hasEnglishVoice: boolean;
  englishVoiceName: string;
  hasTamilVoice: boolean;
  tamilVoiceName: string;
  totalVoicesAvailable: number;
}

export type AlarmTestStage =
  | 'idle'
  | 'testing_alarm'
  | 'speaking_en'
  | 'speaking_ta'
  | 'playing_devotional';

export interface AlarmBriefingState {
  playbackState: AlarmPlaybackState;
  isAlarmRinging: boolean;
  activeSectionIndex: number;
  activeLanguage: BriefingLanguage;
  currentUtteranceText: string;
  isBriefingPaused: boolean;
  
  // Test simulation state
  isTestMode: boolean;
  testStage: AlarmTestStage;
  testStageLabel: string;
  voiceDiagnostics: VoiceDiagnostics;

  // Devotional state
  activeDevotionalTrackId: 'kanda_sashti_kavasam' | 'sivapuranam';
  isDevotionalPlaying: boolean;
  devotionalProgress: number; // 0 to 100
  devotionalCurrentTime: number; // in seconds
  volume: number; // 0.0 to 1.0
  
  // Live soundwave visualizer data (0-255 amplitudes)
  audioFrequencies: number[];
}
