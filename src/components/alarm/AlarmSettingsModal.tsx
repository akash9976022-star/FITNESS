import React, { useState, useRef } from 'react';
import {
  Bell,
  Clock,
  Volume2,
  Video,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  Sparkles,
  X,
  Link as LinkIcon,
  Upload,
} from 'lucide-react';
import { normalizeVideoUrl } from '../../utils/audioAlarmEngine';
import {
  addAlarmVideo,
  deleteAlarmVideo,
  saveAlarmSettings,
  type AlarmVideoItem,
  type UserAlarmSettings,
} from '../../services/firestoreService';
import { uploadAlarmVideo } from '../../services/storageService';
import {
  resolveVideoUrl,
  deleteVideoBlob,
  extractVideoDuration,
} from '../../utils/indexedDBVideoStore';
import { TAMIL_RASIS } from '../../utils/tamilCalendar';

interface AlarmSettingsModalProps {
  isOpen: boolean;
  userId: string;
  alarmSettings: UserAlarmSettings;
  customVideos: AlarmVideoItem[];
  onClose: () => void;
  onTriggerTestAlarm: () => void;
  onUpdateSettings?: (settings: Partial<UserAlarmSettings>) => void;
}

export const AlarmSettingsModal: React.FC<AlarmSettingsModalProps> = ({
  isOpen,
  userId,
  alarmSettings,
  customVideos,
  onClose,
  onTriggerTestAlarm,
  onUpdateSettings,
}) => {
  // Local Videos List State (Optimistic & Local-First)
  const [videosList, setVideosList] = useState<AlarmVideoItem[]>(customVideos);

  // Form State
  const [enabled, setEnabled] = useState(alarmSettings.enabled ?? true);
  const [alarmTime, setAlarmTime] = useState(alarmSettings.time || '06:00');
  const [maxVolume, setMaxVolume] = useState(alarmSettings.maxVolume ?? true);
  const [selectedVideoId, setSelectedVideoId] = useState<string>(
    alarmSettings.selectedVideoId || customVideos[0]?.id || ''
  );
  const [selectedRasi, setSelectedRasi] = useState<string>(alarmSettings.selectedRasi || 'mesham');
  const [playDevotionals, setPlayDevotionals] = useState(alarmSettings.playDevotionals ?? true);

  // Sync videosList when prop updates
  React.useEffect(() => {
    if (customVideos && customVideos.length >= 0) {
      setVideosList(customVideos);
      if (!selectedVideoId && customVideos.length > 0) {
        setSelectedVideoId(customVideos[0].id);
      }
    }
  }, [customVideos]);

  // File Upload and Add Custom Video State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [showAddVideoForm, setShowAddVideoForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const newDuration = '05:00';
  const [isSubmittingVideo, setIsSubmittingVideo] = useState(false);
  const [videoPreviewItem, setVideoPreviewItem] = useState<{ title: string; url: string } | null>(null);
  const [previewVideoError, setPreviewVideoError] = useState(false);

  if (!isOpen) return null;

  const handleSelectVideo = async (videoId: string) => {
    setSelectedVideoId(videoId);
    if (onUpdateSettings) onUpdateSettings({ selectedVideoId: videoId });
    await saveAlarmSettings(userId, { selectedVideoId: videoId });
  };

  const handleSaveAll = async () => {
    const updated: Partial<UserAlarmSettings> = {
      enabled,
      time: alarmTime,
      maxVolume,
      selectedVideoId,
      selectedRasi,
      playDevotionals,
    };

    if (onUpdateSettings) onUpdateSettings(updated);
    await saveAlarmSettings(userId, updated);
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate that the file is a recognized video or audio song format (supporting .mp4, .mp3, .m4a, .hvc, .hevc, .mov, .webm, .mkv, .wav, etc.)
    const isSong =
      file.type.startsWith('video/') ||
      file.type.startsWith('audio/') ||
      /\.(mp4|mp3|m4a|mov|webm|mkv|m4v|hvc|hevc|h265|265|wav|aac|flac|ogg|opus|3gp|avi|ts|wmv|flv|ogv)$/i.test(file.name);

    if (!isSong) {
      alert('Please select a valid song file (e.g. .mp4, .mp3, .m4a, .hvc, .hevc, .mov, .webm, .mkv, .wav).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploadingVideo(true);
    setUploadStatus('Saving video song to library...');
    try {
      // Calculate real video duration in parallel with persisting
      const [downloadUrl, duration] = await Promise.all([
        uploadAlarmVideo(userId, file, file.name),
        extractVideoDuration(file),
      ]);
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      const videoId = await addAlarmVideo(userId, {
        title: cleanTitle || 'Custom Wake-Up Song',
        artistOrDeity: 'User Uploaded',
        videoUrl: downloadUrl,
        videoType: 'upload',
        duration: duration || '05:00',
      });

      const effectiveId = videoId || `upload_${Date.now()}`;
      const newVideoItem: AlarmVideoItem = {
        id: effectiveId,
        title: cleanTitle || 'Custom Wake-Up Song',
        artistOrDeity: 'User Uploaded',
        videoUrl: downloadUrl,
        videoType: 'upload',
        duration: duration || '05:00',
        createdAt: Date.now(),
      };

      // Optimistically add to local list immediately
      setVideosList((prev) => [newVideoItem, ...prev.filter((v) => v.id !== effectiveId)]);
      setSelectedVideoId(effectiveId);

      // Auto-save this video as the active selected alarm video
      if (onUpdateSettings) onUpdateSettings({ selectedVideoId: effectiveId });
      await saveAlarmSettings(userId, { selectedVideoId: effectiveId });

      setUploadStatus('Video song added to your library successfully!');
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (err) {
      console.error('Failed to upload video:', err);
      alert('Could not add video. Please ensure the file is a valid video file.');
    } finally {
      setIsUploadingVideo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    setIsSubmittingVideo(true);
    try {
      const normalized = normalizeVideoUrl(newUrl.trim());
      const videoId = await addAlarmVideo(userId, {
        title: newTitle.trim(),
        artistOrDeity: newArtist.trim() || undefined,
        videoUrl: normalized.embedUrl || newUrl.trim(),
        videoType: normalized.isYouTube ? 'youtube' : 'direct',
        duration: newDuration || '05:00',
      });

      const effectiveId = videoId || `link_${Date.now()}`;
      const newVideoItem: AlarmVideoItem = {
        id: effectiveId,
        title: newTitle.trim(),
        artistOrDeity: newArtist.trim() || undefined,
        videoUrl: normalized.embedUrl || newUrl.trim(),
        videoType: normalized.isYouTube ? 'youtube' : 'direct',
        duration: newDuration || '05:00',
        createdAt: Date.now(),
      };

      setVideosList((prev) => [newVideoItem, ...prev.filter((v) => v.id !== effectiveId)]);
      setSelectedVideoId(effectiveId);
      if (onUpdateSettings) onUpdateSettings({ selectedVideoId: effectiveId });
      await saveAlarmSettings(userId, { selectedVideoId: effectiveId });

      setNewTitle('');
      setNewArtist('');
      setNewUrl('');
      setShowAddVideoForm(false);
    } catch (err) {
      console.error('Failed to add custom alarm video:', err);
    } finally {
      setIsSubmittingVideo(false);
    }
  };

  const handleDeleteCustomVideo = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this custom alarm video?')) return;

    // Optimistically remove from local list
    const remaining = videosList.filter((v) => v.id !== videoId);
    setVideosList(remaining);

    const targetVideo = videosList.find((v) => v.id === videoId);
    if (targetVideo?.videoUrl?.startsWith('indexeddb:')) {
      const localKey = targetVideo.videoUrl.replace('indexeddb:', '').trim();
      deleteVideoBlob(localKey);
    }
    await deleteAlarmVideo(userId, videoId);

    if (selectedVideoId === videoId) {
      const nextId = remaining[0]?.id || '';
      setSelectedVideoId(nextId);
      if (onUpdateSettings) onUpdateSettings({ selectedVideoId: nextId });
      await saveAlarmSettings(userId, { selectedVideoId: nextId });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-6 transition-colors duration-200">
        {/* ================= MODAL HEADER ================= */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center shadow-md shadow-amber-500/20">
              <Bell className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>Alarm & Video Song Settings</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                  Heavy-Sleeper
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure your 6:00 AM alarm, custom wake-up video songs, and dual speech briefing
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= MODAL BODY ================= */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick Action: Instant Test Alarm & Briefing */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-amber-500/15 border border-emerald-300 dark:border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>One-Click Audio & Video Verification</span>
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                Test Morning Alarm & Dual Voice Briefing
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Immediately launches the full-screen alarm overlay, stopping gate, English-Tamil speech, and devotionals.
              </p>
            </div>

            <button
              type="button"
              onClick={async () => {
                const updated: Partial<UserAlarmSettings> = {
                  enabled,
                  time: alarmTime,
                  maxVolume,
                  selectedVideoId,
                  selectedRasi,
                  playDevotionals,
                };
                if (onUpdateSettings) onUpdateSettings(updated);
                await saveAlarmSettings(userId, updated);
                onClose();
                onTriggerTestAlarm();
              }}
              className="py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition shrink-0 transform active:scale-95"
            >
              <Bell className="w-4 h-4 fill-current" />
              <span>TEST ALARM & BRIEFING</span>
            </button>
          </div>

          {/* Time & Volume Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Alarm Time Picker */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span>Wake-Up Time</span>
              </label>
              <input
                type="time"
                value={alarmTime}
                onChange={(e) => setAlarmTime(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-lg font-black text-slate-900 dark:text-white text-center"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block text-center">
                Standard: 06:00 AM (Brahma Muhurtham)
              </span>
            </div>

            {/* Max Volume Override */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-amber-500" />
                <span>Max Volume Override</span>
              </label>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                  Force 100% Volume
                </span>
                <input
                  type="checkbox"
                  checked={maxVolume}
                  onChange={(e) => setMaxVolume(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                Ensures heavy sleepers are awakened reliably.
              </span>
            </div>

            {/* Daily Rasipalan Zodiac Sign Selector */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-500" />
                <span>My Zodiac (ராசி)</span>
              </label>
              <select
                value={selectedRasi}
                onChange={(e) => setSelectedRasi(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              >
                {TAMIL_RASIS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nameTamil} ({r.nameEnglish})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                Dictates morning speech horoscope outlook.
              </span>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Alarm Active Daily
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Fires automatically every morning at {alarmTime}
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={playDevotionals}
                onChange={(e) => setPlayDevotionals(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Auto-Play Devotional Audio
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Kanda Sashti Kavasam & Sivapuranam queue
                </span>
              </div>
            </label>
          </div>

          {/* ================= VIDEO SONG LIBRARY & SELECTOR (100% USER-UPLOADED) ================= */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Video className="w-4 h-4 text-emerald-500" />
                  <span>Wake-Up Song Library (Video & Audio Songs)</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload your favorite video songs (.mp4, .hvc, .hevc, .mov, .webm, .mkv) or audio songs (.mp3, .m4a, .wav, .aac, .flac) to play during morning alarm.
                </p>
              </div>

              {/* Action Buttons: File Upload & Link Form */}
              <div className="flex items-center gap-2">
                {/* Hidden File Input for All Video & Audio Formats */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,audio/*,.mp4,.MP4,.mp3,.MP3,.m4a,.M4A,.hvc,.HVC,.hevc,.HEVC,.h265,.H265,.mov,.MOV,.webm,.WEBM,.mkv,.MKV,.m4v,.M4V,.wav,.WAV,.aac,.AAC,.flac,.FLAC,.ogg,.OGG,.3gp,.3GP,.avi,.AVI,.ts,.TS"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingVideo}
                  className="py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingVideo ? 'Saving Song...' : 'Upload Song'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddVideoForm(!showAddVideoForm)}
                  className="py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddVideoForm ? 'Close' : 'Add Link'}</span>
                </button>
              </div>
            </div>

            {/* Upload Status Banner */}
            {uploadStatus && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200 font-bold">
                <Sparkles className="w-4 h-4 text-emerald-500 animate-spin" />
                <span>{uploadStatus}</span>
              </div>
            )}

            {/* Add Custom Video Song by Link Form */}
            {showAddVideoForm && (
              <form
                onSubmit={handleAddVideoSubmit}
                className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-3.5"
              >
                <span className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400 block">
                  Add Video Song via URL / Stream (Firestore Synced)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Video Song Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Kanda Sashti Kavasam"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Artist or Deity (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Lord Murugan, Soolamangalam Sisters"
                      value={newArtist}
                      onChange={(e) => setNewArtist(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Video URL (YouTube or Direct MP4 link) *
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=... or direct .mp4 CDN"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      required
                      className="w-full p-2 pl-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                    You can paste standard YouTube links or direct MP4/WebM CDN stream links.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddVideoForm(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingVideo}
                    className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow cursor-pointer"
                  >
                    {isSubmittingVideo ? 'Saving to Firestore...' : 'Save to Library'}
                  </button>
                </div>
              </form>
            )}

            {/* Video Cards Grid / Empty State */}
            {videosList.length === 0 ? (
              <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3 bg-slate-50/50 dark:bg-slate-950/30">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                    No Wake-Up Songs Uploaded Yet
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                    Upload your video songs (.mp4, .hvc, .hevc, .mov, .webm, .mkv) or audio songs (.mp3, .m4a, .wav, .aac, .flac) to play during morning alarm. If left empty, the peaceful Tibetan singing bowl awakening tone will play.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Song (MP4, MP3, M4A, HVC, HEVC, MOV, WAV, MKV)</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {videosList.map((video) => {
                  const isSelected = selectedVideoId === video.id;
                  return (
                    <div
                      key={video.id}
                      onClick={() => handleSelectVideo(video.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer flex flex-col justify-between space-y-3 transition ${
                        isSelected
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 shadow-sm ring-1 ring-emerald-500/30'
                          : 'bg-slate-50/60 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          {/* Radio Checkbox */}
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                                : 'border-slate-400 dark:border-slate-600'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                          </div>

                          <div>
                            <p className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                              {video.title}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {video.artistOrDeity || 'Custom Wake-Up Video'}
                            </p>
                          </div>
                        </div>

                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {video.videoType === 'youtube' ? 'YouTube' : 'Uploaded'}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                        <span className="text-slate-400 font-mono text-[10px]">{video.duration}</span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              setPreviewVideoError(false);
                              const playableUrl = await resolveVideoUrl(video.videoUrl);
                              setVideoPreviewItem({ title: video.title, url: playableUrl });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-500 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Preview</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomVideo(video.id, e)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition cursor-pointer"
                            title="Delete custom video"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Settings sync automatically across devices via Firestore</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-950 font-bold shadow transition"
            >
              Save Alarm Settings
            </button>
          </div>
        </div>

        {/* ================= VIDEO PREVIEW MODAL ================= */}
        {videoPreviewItem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl space-y-3 p-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-white">
                <span className="font-bold text-xs truncate">{videoPreviewItem.title}</span>
                <button
                  type="button"
                  onClick={() => setVideoPreviewItem(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black relative">
                {normalizeVideoUrl(videoPreviewItem.url).isYouTube ? (
                  <iframe
                    src={normalizeVideoUrl(videoPreviewItem.url).embedUrl}
                    title="Preview"
                    allow="autoplay; encrypted-media"
                    className="w-full h-full"
                  />
                ) : (
                  <>
                    <video
                      key={videoPreviewItem.url}
                      src={videoPreviewItem.url}
                      controls
                      autoPlay
                      playsInline
                      preload="auto"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        console.warn('Video preview decoder error:', e);
                        setPreviewVideoError(true);
                      }}
                    />

                    {previewVideoError && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-slate-950/95 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                          <Volume2 className="w-6 h-6 animate-pulse" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-white text-xs sm:text-sm">
                            High-Efficiency (HEVC / H.265) Format Detected
                          </p>
                          <p className="text-[11px] text-slate-300 max-w-sm mx-auto">
                            Standalone media players (like VLC) use bundled software decoders, while desktop browsers require Windows HEVC codecs.
                          </p>
                          <p className="text-[11px] text-emerald-400 font-semibold">
                            ✅ This video will play with full hardware acceleration on your Android phone during tomorrow's alarm.
                          </p>
                        </div>

                        {/* Dedicated Audio Track Player so user can listen on desktop right now */}
                        <div className="w-full max-w-md pt-2 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Preview Audio Track Directly:
                          </span>
                          <audio
                            src={videoPreviewItem.url}
                            controls
                            autoPlay
                            className="w-full h-10 rounded-xl"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlarmSettingsModal;
