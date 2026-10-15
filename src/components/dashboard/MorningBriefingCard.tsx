import React, { useState } from 'react';
import {
  Sun,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Bell,
  Music,
  FastForward,
} from 'lucide-react';
import { useAlarmBriefing } from '../../context/AlarmBriefingContext';
import { DEVOTIONAL_TRACKS } from '../../data/devotionalAudioData';

export const MorningBriefingCard: React.FC = () => {
  const {
    playbackState,
    activeSectionIndex,
    activeLanguage,
    currentUtteranceText,
    activeSections,
    isBriefingPaused,
    activeDevotionalTrackId,
    activeDevotionalTrack,
    devotionalVerseIndex,
    devotionalProgress,
    isDevotionalPlaying,
    volume,
    audioFrequencies,
    triggerAlarmTest,
    isTestMode,
    testStage,
    testStageLabel,
    voiceDiagnostics,
    skipBriefingToDevotional,
    startBriefingDirect,
    pauseResumeBriefing,
    stopAll,
    switchDevotionalTrack,
    toggleDevotionalPlayback,
    setMasterVolume,
  } = useAlarmBriefing();

  const [activeTab, setActiveTab] = useState<'briefing' | 'devotional'>('briefing');
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const isAudioActive = playbackState !== 'idle';
  const currentSection = activeSections[activeSectionIndex] || activeSections[0];

  return (
    <div className="rounded-3xl p-5 sm:p-6 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-xl relative overflow-hidden transition-colors">
      {/* Dynamic Background Glow */}
      <div
        className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${
          isAudioActive
            ? 'opacity-30 bg-gradient-to-bl from-amber-500 via-brand-500 to-teal-400'
            : 'opacity-10 bg-brand-500'
        }`}
      />

      {/* Card Header & Status */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-brand-500 flex items-center justify-center text-slate-950 shadow-md shadow-brand-500/20 shrink-0">
            <Sun className="w-6 h-6 stroke-[2.2] animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Morning Audio Briefing & Alarm
              </h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                Heavy-Sleeper 6:00 AM
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Dual-Language (English → தமிழ்) Panchangam, Rasipalan & Devotional Chants
            </p>
          </div>
        </div>

        {/* Status Indicators & Controls */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
          {/* Active Status Badge */}
          <div
            className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors ${
              playbackState === 'ringing'
                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/40 animate-pulse'
                : playbackState === 'briefing'
                ? 'bg-brand-500/15 text-brand-700 dark:text-brand-300 border-brand-500/30'
                : playbackState === 'devotional'
                ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isAudioActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
              }`}
            />
            <span className="capitalize">
              {playbackState === 'ringing'
                ? 'Peaceful Bell Ringing'
                : playbackState === 'briefing'
                ? `Briefing (${activeLanguage.toUpperCase()})`
                : playbackState === 'devotional'
                ? 'Devotional Music'
                : `6:00 AM Armed`}
            </span>
          </div>

          {/* Volume Control Button */}
          <div className="relative">
            <button
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Volume Control"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            {showVolumeSlider && (
              <div className="absolute right-0 top-12 z-20 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl flex items-center gap-2 w-48">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Vol</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                  className="w-full accent-brand-500"
                />
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-white">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Test Morning Alarm & Briefing Trigger */}
          <button
            onClick={triggerAlarmTest}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 shadow-md shadow-amber-500/20"
            title="Simulate full morning wake-up sequence (Alarm -> Dismiss -> English & Tamil Briefing -> Devotional Chants)"
          >
            <Bell className="w-3.5 h-3.5 fill-current" />
            <span>Test Alarm & Briefing</span>
          </button>
        </div>
      </div>

      {/* Live Test Simulation Banner */}
      {isTestMode && (
        <div className="relative z-10 my-3.5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 border-2 border-amber-400/50 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30 shrink-0">
              <Sparkles className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Morning Wake-Up Simulation
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-sm">
                  {testStage.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                Status: <strong className="text-amber-600 dark:text-amber-400 font-bold">{testStageLabel}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            {playbackState === 'briefing' && (
              <button
                type="button"
                onClick={skipBriefingToDevotional}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all active:scale-95"
                title="Fast forward directly to Step 4: Devotional Chants"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Skip to Devotional</span>
              </button>
            )}
            <button
              type="button"
              onClick={stopAll}
              className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-rose-500 hover:text-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
            >
              Stop Test
            </button>
          </div>
        </div>
      )}

      {/* Animated Soundwave Visualizer Bar */}
      <div className="relative z-10 py-3.5 flex items-center justify-between gap-4">
        {/* Real-time Dancing Frequency Waveform */}
        <div className="flex items-center gap-1 sm:gap-1.5 h-9 flex-1">
          {audioFrequencies.map((amp, idx) => {
            const heightPercent = isAudioActive ? Math.max(12, Math.min(100, (amp / 255) * 100)) : 15;
            return (
              <div
                key={idx}
                className="flex-1 rounded-full transition-all duration-75"
                style={{
                  height: `${heightPercent}%`,
                  backgroundColor:
                    playbackState === 'ringing'
                      ? '#f43f5e'
                      : playbackState === 'devotional'
                      ? '#a855f7'
                      : activeLanguage === 'ta'
                      ? '#f59e0b'
                      : '#10b981',
                }}
              />
            );
          })}
        </div>

        {/* Master Audio Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {playbackState === 'idle' ? (
            <button
              onClick={startBriefingDirect}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-teal-400 hover:from-brand-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-md shadow-brand-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Briefing</span>
            </button>
          ) : playbackState === 'briefing' ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={pauseResumeBriefing}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 transition-colors"
                title={isBriefingPaused ? 'Resume' : 'Pause'}
              >
                {isBriefingPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
              </button>
              <button
                onClick={stopAll}
                className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 transition-colors"
                title="Stop Audio"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleDevotionalPlayback}
                className="p-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 border border-purple-500/30 transition-colors"
                title={isDevotionalPlaying ? 'Pause Devotional' : 'Play Devotional'}
              >
                {isDevotionalPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
              <button
                onClick={stopAll}
                className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 transition-colors"
                title="Stop Devotional"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Speech Engine Voice Diagnostic Indicators */}
      <div className="relative z-10 py-1.5 px-1 flex items-center justify-between gap-2 border-t border-slate-200/60 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-700 dark:text-slate-300">Voice Diagnostics:</span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] ${
              voiceDiagnostics.hasEnglishVoice
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${voiceDiagnostics.hasEnglishVoice ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            EN: {voiceDiagnostics.englishVoiceName ? voiceDiagnostics.englishVoiceName.slice(0, 24) : 'System Default'}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] ${
              voiceDiagnostics.hasTamilVoice
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${voiceDiagnostics.hasTamilVoice ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            TA: {voiceDiagnostics.tamilVoiceName ? voiceDiagnostics.tamilVoiceName.slice(0, 24) : (voiceDiagnostics.hasTamilVoice ? 'Native Tamil' : 'Phonetic Fallback')}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono hidden md:inline">
          Alarm (100%) ➔ English Briefing ➔ தமிழ் Briefing ➔ Devotional Chants
        </span>
      </div>

      {/* Tabs: Bilingual Speech Briefing vs Devotional Chants */}
      <div className="relative z-10 flex items-center gap-2 mt-2 mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('briefing')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'briefing'
              ? 'bg-brand-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Bilingual Morning Briefing</span>
        </button>

        <button
          onClick={() => setActiveTab('devotional')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'devotional'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Devotional Music Stream</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/20 text-white font-mono">2 Tracks</span>
        </button>
      </div>

      {/* TAB CONTENT 1: BILINGUAL MORNING BRIEFING */}
      {activeTab === 'briefing' && (
        <div className="relative z-10 space-y-3">
          {/* Active Language & Progress Bar */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500 dark:text-slate-400">Speaking in:</span>
              <span
                className={`px-2 py-0.5 rounded-md font-black text-[11px] ${
                  activeLanguage === 'en'
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                }`}
              >
                {activeLanguage === 'en' ? 'English (ஆங்கிலம்)' : 'தமிழ் (Tamil)'}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
              Section {activeSectionIndex + 1} of {activeSections.length}
            </span>
          </div>

          {/* Active Spoken Sentence Teleprompter */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-inner">
            <div className="flex items-center justify-between text-xs font-bold text-brand-600 dark:text-brand-400 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                {currentSection.labelEn} • {currentSection.labelTa}
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                {activeLanguage === 'en' ? 'Phase 1: English' : 'Phase 2: தமிழ் மொழிபெயர்ப்பு'}
              </span>
            </div>
            <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-relaxed">
              {currentUtteranceText ||
                (activeLanguage === 'en' ? currentSection.textEn : currentSection.textTa)}
            </p>
          </div>

          {/* Section Step Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
            {activeSections.map((sec, i) => {
              const isPast = i < activeSectionIndex;
              const isCurrent = i === activeSectionIndex;
              return (
                <div
                  key={sec.key}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    isCurrent
                      ? 'bg-brand-500/15 border-brand-500 text-brand-700 dark:text-brand-300 font-bold'
                      : isPast
                      ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                      : 'bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-850 text-slate-400'
                  }`}
                >
                  <div className="text-[10px] font-mono">0{i + 1}</div>
                  <div className="text-[11px] truncate font-medium">{sec.labelEn}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: DEVOTIONAL MUSIC STREAM */}
      {activeTab === 'devotional' && (
        <div className="relative z-10 space-y-4 animate-fadeIn">
          {/* Track Selector Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEVOTIONAL_TRACKS.map((track) => {
              const isSelected = activeDevotionalTrackId === track.id;
              return (
                <button
                  key={track.id}
                  onClick={() => switchDevotionalTrack(track.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-purple-500/15 dark:bg-purple-950/60 border-purple-500 text-purple-900 dark:text-purple-100 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-400'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      {track.deity}
                    </div>
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {track.titleEn}
                    </div>
                    <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      {track.titleTa}
                    </div>
                  </div>
                  {isSelected && isDevotionalPlaying && (
                    <span className="p-1.5 rounded-lg bg-purple-500 text-white animate-pulse shrink-0">
                      <Music className="w-4 h-4" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Devotional Verse Teleprompter */}
          <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/70 dark:bg-gradient-to-br dark:from-purple-950/20 dark:via-slate-900/60 dark:to-slate-950 border border-purple-200 dark:border-purple-500/30 transition-colors">
            <div className="flex items-center justify-between text-xs text-purple-700 dark:text-purple-400 mb-2 font-mono font-semibold">
              <span>{activeDevotionalTrack.titleEn} Recitation</span>
              <span>
                Verse {devotionalVerseIndex + 1} of {activeDevotionalTrack.verses.length}
              </span>
            </div>

            {/* Tamil Verse */}
            <div className="text-base sm:text-lg font-black text-amber-800 dark:text-amber-300 leading-relaxed font-sans mb-1">
              {activeDevotionalTrack.verses[devotionalVerseIndex]?.lineTa ||
                activeDevotionalTrack.verses[0].lineTa}
            </div>

            {/* Transliteration */}
            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic font-mono mb-2">
              "{activeDevotionalTrack.verses[devotionalVerseIndex]?.lineEn ||
                activeDevotionalTrack.verses[0].lineEn}"
            </div>

            {/* English Meaning */}
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium border-t border-purple-200 dark:border-purple-900/40 pt-2">
              Meaning: {activeDevotionalTrack.verses[devotionalVerseIndex]?.meaningEn ||
                activeDevotionalTrack.verses[0].meaningEn}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-purple-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="bg-gradient-to-r from-purple-500 to-amber-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${devotionalProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
