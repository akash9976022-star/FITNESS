import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  X,
  Music,
  CheckCircle2,
  Heart,
  ChevronRight,
  Flame,
  Dumbbell,
  Compass,
} from 'lucide-react';
import {
  speechBriefingEngine,
  devotionalPlayer,
  DEVOTIONAL_TRACKS,
  type BriefingSection,
  type DevotionalTrack,
} from '../../utils/audioAlarmEngine';

interface MorningBriefingModalProps {
  isOpen: boolean;
  sections: BriefingSection[];
  onClose: () => void;
  autoStartDevotionals?: boolean;
}

export const MorningBriefingModal: React.FC<MorningBriefingModalProps> = ({
  isOpen,
  sections,
  onClose,
  autoStartDevotionals = true,
}) => {
  // Speech State
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'ta'>('en');
  const [activeSegment, setActiveSegment] = useState<'english' | 'tamil'>('english');
  const [isSpeechSpeaking, setIsSpeechSpeaking] = useState(false);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);
  const [speechCompleted, setSpeechCompleted] = useState(false);

  // Devotional Player State
  const [activeTab, setActiveTab] = useState<'briefing' | 'devotionals'>('briefing');
  const [devotionalTrack, setDevotionalTrack] = useState<DevotionalTrack>(DEVOTIONAL_TRACKS[0]);
  const [isDevotionalPlaying, setIsDevotionalPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize and register devotional callbacks
  useEffect(() => {
    devotionalPlayer.onTrackChange((track) => setDevotionalTrack(track));
    devotionalPlayer.onStateChange((playing) => setIsDevotionalPlaying(playing));
    devotionalPlayer.onTimeUpdate((cur, dur) => {
      setCurrentTime(cur);
      setDuration(dur);
    });
  }, []);

  // Trigger speech briefing when modal opens
  useEffect(() => {
    if (!isOpen || sections.length === 0) return;

    setActiveSectionIndex(0);
    setActiveLanguage('en');
    setActiveSegment('english');
    setSpeechCompleted(false);
    setIsSpeechSpeaking(true);
    setIsSpeechPaused(false);
    setActiveTab('briefing');

    speechBriefingEngine.startBriefing(sections, {
      onSectionStart: (idx, lang, segment) => {
        setActiveSectionIndex(idx);
        setActiveLanguage(lang);
        if (segment) setActiveSegment(segment);
      },
      onSectionComplete: () => {
        // Progressively highlight completion
      },
      onAllComplete: () => {
        setIsSpeechSpeaking(false);
        setSpeechCompleted(true);
        if (autoStartDevotionals) {
          // Auto handoff to continuous devotional playback
          setActiveTab('devotionals');
          devotionalPlayer.playTrack(0, volume);
        }
      },
      onError: () => {
        setIsSpeechSpeaking(false);
      },
    });

    return () => {
      speechBriefingEngine.stop();
    };
  }, [isOpen, sections, autoStartDevotionals, volume]);

  if (!isOpen) return null;

  const handlePauseResumeSpeech = () => {
    if (isSpeechPaused) {
      speechBriefingEngine.resume();
      setIsSpeechPaused(false);
    } else {
      speechBriefingEngine.pause();
      setIsSpeechPaused(true);
    }
  };

  const handleSkipToDevotionals = () => {
    speechBriefingEngine.stop();
    setIsSpeechSpeaking(false);
    setSpeechCompleted(true);
    setActiveTab('devotionals');
    devotionalPlayer.playTrack(0, volume);
  };

  const handleClose = () => {
    speechBriefingEngine.stop();
    devotionalPlayer.stop();
    onClose();
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const activeSection = sections[activeSectionIndex] || sections[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 md:p-6 flex items-start sm:items-center justify-center min-h-screen">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] sm:max-h-[88vh] transition-colors duration-200">
        {/* ================= MODAL HEADER ================= */}
        <div className="flex-shrink-0 px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20 flex-shrink-0">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base md:text-lg text-slate-900 dark:text-white leading-tight">
                  Morning Awakening & Voice Briefing
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                  EN ➔ தமிழ்
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                Bilingual oral briefing: English (Greeting, Nutrients & Quote) ➔ தமிழ் (முழுமையான வழிகாட்டல்)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition flex-shrink-0"
            title="Close briefing"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= TAB NAVIGATION ================= */}
        <div className="flex-shrink-0 flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 pt-1 sm:pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('briefing')}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition ${
              activeTab === 'briefing'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Dual Speech Briefing (5 Pillars)</span>
            {isSpeechSpeaking && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('devotionals');
              if (!isDevotionalPlaying && speechCompleted) {
                devotionalPlayer.playTrack(0, volume);
              }
            }}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition ${
              activeTab === 'devotionals'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Devotional Audio (கவசம் & புராணம்)</span>
            {isDevotionalPlaying && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* ================= TAB CONTENT (SCROLLABLE BODY) ================= */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5">
          {activeTab === 'briefing' ? (
            <div className="space-y-5">
              {/* Pillar Step Progression */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {sections.map((sec, idx) => {
                  const isCurrent = idx === activeSectionIndex;
                  const isPast = idx < activeSectionIndex;
                  return (
                    <div
                      key={sec.id}
                      className={`p-2 rounded-xl text-center border transition ${
                        isCurrent
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold shadow-sm ring-1 ring-emerald-500/30'
                          : isPast
                          ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1 mb-1">
                        {sec.category === 'greeting' && <Sparkles className="w-3.5 h-3.5 text-emerald-500" />}
                        {sec.category === 'fitness' && <Dumbbell className="w-3.5 h-3.5 text-cyan-500" />}
                        {sec.category === 'quote' && <Heart className="w-3.5 h-3.5 text-rose-500" />}
                        {sec.category === 'panchangam' && <Flame className="w-3.5 h-3.5 text-amber-500" />}
                        {sec.category === 'rasipalan' && <Compass className="w-3.5 h-3.5 text-purple-500" />}
                        <span className="text-[10px] font-bold">Pillar {idx + 1}</span>
                      </div>
                      <p className="text-[9px] sm:text-[10px] truncate">{sec.titleEn.split(' ')[0]}</p>
                    </div>
                  );
                })}
              </div>

              {/* Live Speech Voice Indicator & Subtitles Card */}
              {activeSection && (
                <div className="p-4 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm relative overflow-hidden">
                  {/* Segment Phase Notification Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition ${
                          activeSegment === 'english'
                            ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500/50'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {activeSegment === 'english' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        )}
                        Phase 1: English (Greeting, Nutrients & Quote)
                      </span>

                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition ${
                          activeSegment === 'tamil'
                            ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500/50'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {activeSegment === 'tamil' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        )}
                        Phase 2: தமிழ் ஒலிபரப்பு (அனைத்து வழிகாட்டல்கள்)
                      </span>
                    </div>

                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      {activeLanguage === 'en'
                        ? 'Natural English (Conversational)'
                        : 'Gemini AI Fluent Voice (இயற்கையான தாய்மொழி தமிழ்)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950">
                        <Volume2 className="w-4 h-4 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          {activeSection.titleEn}
                        </span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          {activeSection.titleTa}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Speaking:{' '}
                        <span className="text-emerald-600 dark:text-emerald-400 font-black">
                          {activeLanguage === 'en'
                            ? 'English Segment (1st)'
                            : 'தமிழ் ஒலிபரப்பு (2nd)'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Dual Language Captions */}
                  <div className="space-y-3 text-xs sm:text-sm">
                    {/* English Caption */}
                    <div
                      className={`p-3.5 rounded-2xl border transition ${
                        activeLanguage === 'en'
                          ? 'bg-white dark:bg-slate-900 border-blue-500 shadow-md ring-1 ring-blue-500/30'
                          : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
                        <span>English Broadcast</span>
                        {activeLanguage === 'en' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />}
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                        {activeSection.textEn}
                      </p>
                    </div>

                    {/* Tamil Caption */}
                    <div
                      className={`p-3.5 rounded-2xl border transition ${
                        activeLanguage === 'ta'
                          ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                          : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                        <span>தமிழ் நேரடி உரை & வழிகாட்டல்</span>
                        {activeLanguage === 'ta' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">
                        {activeSection.textTa}
                      </p>
                    </div>
                  </div>

                  {/* Pure Speech Notice */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Pure voice briefing audio • Clear speech synthesis with natural human pacing.</span>
                  </div>
                </div>
              )}

              {/* Briefing Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePauseResumeSpeech}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 shadow-sm transition"
                  >
                    {isSpeechPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                    <span>{isSpeechPaused ? 'Resume Speech' : 'Pause Speech'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSkipToDevotionals}
                  className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md transition"
                >
                  <span>Skip to Devotional Audio (கவசம்)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* ================= DEVOTIONAL STREAMING PLAYER ================= */
            <div className="space-y-6">
              {/* Active Track Showcase Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900/5 to-emerald-500/10 border border-amber-300 dark:border-amber-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                      Continuous Devotional Stream
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {devotionalTrack.titleTamil}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">
                      {devotionalTrack.title} • {devotionalTrack.deityTamil} ({devotionalTrack.deity})
                    </p>
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                    Duration: {devotionalTrack.duration}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  "{devotionalTrack.descriptionTamil}"
                </p>

                {/* Lyrics Highlight Quote Box */}
                <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    <span>புனித வரிகள் (Sacred Chants)</span>
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-amber-200 leading-snug">
                    {devotionalTrack.lyricsHighlightTamil}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {devotionalTrack.lyricsHighlight}
                  </p>
                </div>

                {/* Audio Progress Bar */}
                <div className="space-y-1.5 pt-2">
                  <div
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const percent = (e.clientX - rect.left) / rect.width;
                      devotionalPlayer.seek(percent * duration);
                    }}
                    className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 cursor-pointer overflow-hidden relative"
                  >
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all"
                      style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <span>{formatSeconds(currentTime)}</span>
                    <span>{duration ? formatSeconds(duration) : devotionalTrack.duration}</span>
                  </div>
                </div>

                {/* Player Controls */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => devotionalPlayer.prevTrack()}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                      title="Previous Track"
                    >
                      <SkipForward className="w-4 h-4 rotate-180" />
                    </button>

                    <button
                      type="button"
                      onClick={() => devotionalPlayer.togglePlayPause()}
                      className="py-2.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-md transition transform active:scale-95"
                    >
                      {isDevotionalPlaying ? (
                        <>
                          <Pause className="w-4 h-4 fill-current" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Play</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => devotionalPlayer.nextTrack()}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                      title="Next Track"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Volume Slider */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newMute = !isMuted;
                        setIsMuted(newMute);
                        devotionalPlayer.setVolume(newMute ? 0 : volume);
                      }}
                      className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                      {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setVolume(val);
                        setIsMuted(false);
                        devotionalPlayer.setVolume(val);
                      }}
                      className="w-20 sm:w-28 accent-amber-500 cursor-pointer h-1.5"
                    />
                  </div>
                </div>
              </div>

              {/* Devotional Playlist Selection */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Devotional Sequence (Continuous Queue):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DEVOTIONAL_TRACKS.map((track, i) => {
                    const isSelected = devotionalTrack.id === track.id;
                    return (
                      <div
                        key={track.id}
                        onClick={() => devotionalPlayer.playTrack(i, volume)}
                        className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between gap-3 transition ${
                          isSelected
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {isSelected && isDevotionalPlaying ? (
                              <Volume2 className="w-4 h-4 animate-bounce" />
                            ) : (
                              <span>{i + 1}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              {track.titleTamil}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {track.title} • {track.deity}
                            </p>
                          </div>
                        </div>

                        <span className="text-[11px] font-mono text-slate-400">{track.duration}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="flex-shrink-0 px-4 py-3 sm:px-6 sm:py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span className="line-clamp-1">Ready for training • Consistency ensures body maintenance success</span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-950 font-bold transition shadow flex-shrink-0"
          >
            Done & Enter Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default MorningBriefingModal;

