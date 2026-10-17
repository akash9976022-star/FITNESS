import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Volume2,
  Sparkles,
  Flame,
  ChevronRight,
  Video,
} from 'lucide-react';
import {
  tibetanBowlSynth,
  normalizeVideoUrl,
} from '../../utils/audioAlarmEngine';
import { resolveVideoUrl } from '../../utils/indexedDBVideoStore';
import type { AlarmVideoItem, UserAlarmSettings } from '../../services/firestoreService';
import type { TamilDateInfo } from '../../utils/tamilCalendar';

interface AlarmModalProps {
  isOpen: boolean;
  alarmSettings: UserAlarmSettings;
  customVideos: AlarmVideoItem[];
  tamilDateInfo: TamilDateInfo;
  onDismissAndStartBriefing: () => void;
  onSnooze?: () => void;
}

export const AlarmModal: React.FC<AlarmModalProps> = ({
  isOpen,
  alarmSettings,
  customVideos,
  tamilDateInfo,
  onDismissAndStartBriefing,
  onSnooze,
}) => {
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<AlarmVideoItem | null>(null);
  const [playableUrl, setPlayableUrl] = useState<string>('');
  const [videoError, setVideoError] = useState(false);
  const [isMutedAutoplay, setIsMutedAutoplay] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Digital clock update
  useEffect(() => {
    if (!isOpen) return;

    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDateStr(
        now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Determine active video song
  useEffect(() => {
    if (!isOpen) return;

    setVideoError(false);
    setIsMutedAutoplay(false);
    const videoId = alarmSettings.selectedVideoId;

    if (videoId) {
      const custom = customVideos.find((v) => v.id === videoId);
      if (custom) {
        setSelectedVideo(custom);
        return;
      }
    }

    // Direct check of cached videos from localStorage if not yet in state
    try {
      const cached = localStorage.getItem('fit_alarm_videos_cache');
      if (cached) {
        const parsed: AlarmVideoItem[] = JSON.parse(cached);
        const match = videoId ? parsed.find((v) => v.id === videoId) : parsed[0];
        if (match) {
          setSelectedVideo(match);
          return;
        }
      }
    } catch {
      // ignore
    }

    // Default to first user-uploaded video if available, or null (Tibetan singing bowl)
    setSelectedVideo(customVideos[0] || null);
  }, [isOpen, alarmSettings.selectedVideoId, customVideos]);

  // Asynchronously resolve playable URL (for IndexedDB blobs and remote URLs)
  useEffect(() => {
    let isCancelled = false;
    if (selectedVideo?.videoUrl) {
      resolveVideoUrl(selectedVideo.videoUrl)
        .then((url) => {
          if (!isCancelled) {
            setPlayableUrl(url);
          }
        })
        .catch(() => {
          if (!isCancelled) setPlayableUrl('');
        });
    } else {
      setPlayableUrl('');
    }
    return () => {
      isCancelled = true;
    };
  }, [selectedVideo]);

  // Max-Volume Audio / Video Trigger with Mobile Autoplay Policy Resilience
  useEffect(() => {
    if (!isOpen) {
      tibetanBowlSynth.stopAlarm();
      return;
    }

    // If no video is selected or video explicitly failed, start Tibetan singing bowl immediately
    if (!selectedVideo || videoError) {
      tibetanBowlSynth.startAlarm(1.0);
      return;
    }

    // Wait until playableUrl has resolved
    if (!playableUrl) {
      return;
    }

    const normalized = normalizeVideoUrl(playableUrl);

    if (!normalized.isYouTube && videoRef.current) {
      const videoEl = videoRef.current;
      videoEl.volume = 1.0;
      videoEl.muted = false;

      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Unmuted autoplay succeeded
            setIsMutedAutoplay(false);
            tibetanBowlSynth.stopAlarm();
          })
          .catch((err) => {
            console.warn(
              'Unmuted autoplay blocked by browser/mobile policy; enabling muted video + chime backup:',
              err
            );
            // Muted video playback is 100% permitted across all browsers, iOS Safari, and Android Chrome
            videoEl.muted = true;
            videoEl.play().catch((e) => {
              console.error('Muted autoplay error:', e);
              setVideoError(true);
              tibetanBowlSynth.startAlarm(1.0);
            });
            setIsMutedAutoplay(true);
            // Sound the alarm bowl chime so heavy sleeper is awakened
            tibetanBowlSynth.startAlarm(1.0);
          });
      }
    }

    return () => {
      tibetanBowlSynth.stopAlarm();
    };
  }, [isOpen, selectedVideo, playableUrl, videoError]);

  if (!isOpen) return null;

  const normalized = playableUrl ? normalizeVideoUrl(playableUrl) : null;

  const handleScreenUnmute = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
      videoRef.current.play().catch(() => {});
    }
    tibetanBowlSynth.stopAlarm();
    setIsMutedAutoplay(false);
  };

  const handleDismiss = () => {
    // Fade out and stop alarm sounds
    tibetanBowlSynth.stopAlarm();
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onDismissAndStartBriefing();
  };

  return (
    <div
      onClick={handleScreenUnmute}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-black text-white overflow-hidden select-none cursor-pointer"
      style={{ touchAction: 'none' }}
    >
      {/* ================= BACKGROUND VIDEO / AMBIENT LAYER ================= */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {normalized && !videoError ? (
          normalized.isYouTube ? (
            <iframe
              src={`${normalized.embedUrl}&controls=0&mute=0`}
              title="Wake-Up Video Song"
              allow="autoplay; encrypted-media; picture-in-picture"
              className="w-full h-full object-cover scale-[1.35] opacity-60 pointer-events-auto"
              onError={() => setVideoError(true)}
            />
          ) : (
            <video
              ref={videoRef}
              src={normalized.embedUrl}
              autoPlay
              playsInline
              loop
              className="w-full h-full object-cover opacity-75"
              onError={(e) => {
                console.warn('Media element encountered decode issue, activating alarm audio backup:', e);
                setVideoError(true);
                tibetanBowlSynth.startAlarm(1.0);
              }}
            />
          )
        ) : (
          // Vibrant Sunrise Glow Background when purely Tibetan Bowl Synth is active
          <div className="w-full h-full bg-gradient-to-b from-amber-600/30 via-slate-950 to-emerald-950 animate-pulse duration-1000" />
        )}

        {/* Cinematic Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70 pointer-events-none" />
      </div>

      {/* ================= TOP STATUS BAR ================= */}
      <div className="relative z-10 w-full max-w-4xl pt-8 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 backdrop-blur-md flex items-center justify-center animate-bounce">
            <Bell className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                FitMaintenance AI
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/30 border border-rose-400/40 text-rose-300 flex items-center gap-1">
                <Volume2 className="w-3 h-3 animate-ping" />
                <span>MAX VOLUME 100%</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">Heavy-Sleeper Awakening Protocol</p>
          </div>
        </div>

        {selectedVideo && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-xs">
            <Video className="w-4 h-4 text-emerald-400" />
            <span className="font-bold truncate max-w-[200px]">{selectedVideo.title}</span>
          </div>
        )}
      </div>

      {/* ================= CENTER TIME & CALENDAR DISPLAY ================= */}
      <div className="relative z-10 text-center px-4 my-auto space-y-4 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 backdrop-blur-md text-emerald-300 text-xs font-black tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>GOOD MORNING • காலை வணக்கம்</span>
        </div>

        {/* Digital Time */}
        <div className="space-y-1">
          <h1 className="text-6xl sm:text-8xl md:text-9xl font-black font-mono tracking-tight text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
            {currentTimeStr || '06:00:00'}
          </h1>
          <p className="text-sm sm:text-base font-bold text-slate-200 tracking-wide drop-shadow">
            {currentDateStr}
          </p>
        </div>

        {/* Tamil Calendar Ingress Banner */}
        <div className="inline-block p-3 sm:p-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/80 shadow-2xl text-xs sm:text-sm">
          <p className="font-black text-amber-400 text-sm sm:text-base flex items-center justify-center gap-2">
            <Flame className="w-4 h-4" />
            <span>{tamilDateInfo.tamilYearName} வருடம் • {tamilDateInfo.tamilMonthName} மாதம் {tamilDateInfo.tamilDate} ஆம் நாள்</span>
          </p>
          <p className="text-[11px] sm:text-xs text-slate-300 font-semibold mt-1">
            திதி: <span className="text-emerald-400 font-bold">{tamilDateInfo.panchangam.thithi.nameTamil}</span> •{' '}
            நட்சத்திரம்: <span className="text-cyan-400 font-bold">{tamilDateInfo.panchangam.nakshatram.nameTamil}</span> •{' '}
            நல்ல நேரம்: <span className="text-amber-300 font-bold">{tamilDateInfo.panchangam.nallaNeramMorning}</span>
          </p>
        </div>
      </div>

      {/* ================= BOTTOM DISMISSAL GATE ================= */}
      <div className="relative z-10 w-full max-w-lg px-6 pb-12 sm:pb-16 space-y-3">
        {/* Floating Tap-to-Unmute Banner if Browser Policy Enforced Muted Autoplay */}
        {isMutedAutoplay && (
          <div
            onClick={handleScreenUnmute}
            className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 animate-bounce transition cursor-pointer"
          >
            <Volume2 className="w-4 h-4 animate-ping" />
            <span>🔊 TAP SCREEN TO ENABLE FULL VIDEO SOUND</span>
          </div>
        )}

        {/* Un-swipable Stop Alarm & Start Briefing Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="w-full py-5 px-6 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-base sm:text-lg shadow-[0_0_40px_rgba(16,185,129,0.6)] flex items-center justify-center gap-3 transition-all transform active:scale-95 animate-pulse"
        >
          <Bell className="w-6 h-6 stroke-[2.5]" />
          <span>STOP ALARM & START BRIEFING</span>
          <ChevronRight className="w-5 h-5 stroke-[3]" />
        </button>

        {onSnooze && (
          <button
            type="button"
            onClick={onSnooze}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-slate-300 hover:text-white font-bold text-xs transition"
          >
            Snooze for 5 Minutes
          </button>
        )}

        <p className="text-center text-[11px] text-slate-400">
          Tapping will stop alarm playback and initiate your dual-language English & Tamil voice briefing with devotional audio.
        </p>
      </div>
    </div>
  );
};

export default AlarmModal;
