import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Bell,
  BellRing,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
  Smartphone,
  MessageSquare,
  Check,
  Send,
  ExternalLink,
  Volume2,
  Copy,
  ChevronDown,
  ChevronUp,
  Sun,
  Music,
} from 'lucide-react';
import type { NotificationSettings } from '../../types/notifications';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  playNotificationChime,
} from '../../services/notificationService';
import {
  generateAllCalendarIntents,
  syncWithGoogleTasksApi,
} from '../../services/googleCalendarTasksSync';
import { requestFcmDeviceToken } from '../../services/fcmService';
import { dispatchSmsReminder, dispatchWhatsAppReminder } from '../../services/messagingWebhooks';
import { TAMIL_ZODIAC_SIGNS } from '../../utils/rasipalanEngine';
import { useAlarmBriefing } from '../../context/AlarmBriefingContext';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { notificationSettings, updateNotificationSettings } = useAuth();
  const { triggerAlarmTest, voiceDiagnostics } = useAlarmBriefing();

  const [settings, setSettings] = useState<NotificationSettings>(notificationSettings);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [activeTab, setActiveTab] = useState<'alarm' | 'schedule' | 'google' | 'channels'>('alarm');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testSent, setTestSent] = useState(false);

  // Google Tasks token modal state
  const [googleAccessToken, setGoogleAccessToken] = useState('');
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [googleSyncMsg, setGoogleSyncMsg] = useState<string | null>(null);

  // FCM state
  const [isFetchingFcm, setIsFetchingFcm] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // SMS/WhatsApp simulation state
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [showArchDocs, setShowArchDocs] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSettings(notificationSettings);
      setPermission(getNotificationPermission());
    }
  }, [isOpen, notificationSettings]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      setSettings((prev) => ({ ...prev, remindersEnabled: true }));
      // Try fetching FCM token in background
      try {
        const token = await requestFcmDeviceToken();
        if (token) {
          setSettings((prev) => ({ ...prev, fcmToken: token, fcmEnabled: true }));
        }
      } catch (fcmErr) {
        console.debug('FCM token auto-fetch notice:', fcmErr);
      }
    }
  };

  const handleSendTest = async () => {
    playNotificationChime();
    const sent = await sendTestNotification();
    setTestSent(sent);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateNotificationSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save notification settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFetchFcmToken = async () => {
    setIsFetchingFcm(true);
    try {
      const token = await requestFcmDeviceToken();
      if (token) {
        setSettings((prev) => ({ ...prev, fcmToken: token, fcmEnabled: true }));
      }
    } finally {
      setIsFetchingFcm(false);
    }
  };

  const handleCopyToken = () => {
    if (settings.fcmToken) {
      navigator.clipboard.writeText(settings.fcmToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleTestSmsDispatch = async () => {
    if (!settings.smsPhoneNumber) {
      setDispatchStatus('Please enter a valid phone number with country code (e.g. +1... or +91...)');
      return;
    }
    const res = await dispatchSmsReminder({
      to: settings.smsPhoneNumber,
      body: 'FitMaintenance AI: Time for your morning weigh-in & ghost cam photo to lock in your maintenance equilibrium!',
    });
    setDispatchStatus(`SMS ${res.status.toUpperCase()}: Message ID ${res.messageId}`);
    setTimeout(() => setDispatchStatus(null), 4000);
  };

  const handleTestWhatsAppDispatch = async () => {
    if (!settings.whatsappNumber) {
      setDispatchStatus('Please enter a WhatsApp number with country code (e.g. +91...)');
      return;
    }
    const res = await dispatchWhatsAppReminder({
      to: settings.whatsappNumber,
      messageType: 'text',
      body: 'FitMaintenance AI Alert: Your scheduled maintenance workout is ready. Log your sets and volume!',
    });
    setDispatchStatus(`WhatsApp ${res.status.toUpperCase()}: Message ID ${res.messageId}`);
    setTimeout(() => setDispatchStatus(null), 4000);
  };

  const handleSyncGoogleTasks = async () => {
    if (!googleAccessToken.trim()) {
      setGoogleSyncMsg('Please paste a Google OAuth Access Token (with Tasks API scope).');
      return;
    }
    setGoogleSyncing(true);
    setGoogleSyncMsg(null);
    try {
      const res = await syncWithGoogleTasksApi(googleAccessToken.trim(), settings);
      setGoogleSyncMsg(`Successfully synchronized ${res.count} reminders into Google Tasks!`);
    } catch (err: any) {
      setGoogleSyncMsg(`Sync Error: ${err.message}`);
    } finally {
      setGoogleSyncing(false);
    }
  };

  const calendarIntents = generateAllCalendarIntents(settings);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Daily Reminders & Notifications
                <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[10px] font-bold border border-brand-500/20">
                  Cloud Synced
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Web push, time schedules, Google Calendar & messaging hooks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-950/40 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('alarm')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'alarm'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Heavy-Sleeper Alarm (6:00 AM)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'schedule'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Reminder Schedule</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('google')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'google'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Google Calendar & Tasks</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('channels')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'channels'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>FCM & SMS/WhatsApp</span>
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
          {/* Permission Status Banner */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  permission === 'granted'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : permission === 'denied'
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                }`}
              >
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Browser Push Permissions:
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                      permission === 'granted'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                        : permission === 'denied'
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                    }`}
                  >
                    {permission}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {permission === 'granted'
                    ? 'Browser alerts are enabled. Reminders will pop up with sound.'
                    : permission === 'denied'
                    ? 'Notifications are blocked in your browser. Please allow notifications in site settings.'
                    : 'Grant permission so your device receives timely check-in & workout reminders.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              {permission !== 'granted' ? (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-teal-500 hover:from-brand-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-glow transition-all"
                >
                  Enable Permissions
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSendTest}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Send className="w-3.5 h-3.5 text-brand-500" />
                  <span>{testSent ? 'Alert Sent!' : 'Send Test Alert'}</span>
                </button>
              )}
            </div>
          </div>

          {/* =========================================================================
              TAB 0: HEAVY-SLEEPER MORNING ALARM & DEVOTIONAL BRIEFING
          ========================================================================= */}
          {activeTab === 'alarm' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Feature Hero Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-brand-500/10 to-indigo-500/10 border border-amber-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Heavy-Sleeper Bilingual Morning Alarm
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Max volume audio override, sequential English ➔ Tamil briefing & sacred devotional music
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold uppercase border border-amber-500/30">
                    Deep Sleep Wakeup
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
                  Designed specifically to wake up deep sleepers peacefully and effectively. Plays serene morning temple bells & Tibetan singing bowl resonance at maximum volume, shows an un-dismissable full-screen overlay, reads your personalized briefing first in English and immediately in Tamil, then transitions to Kanda Sashti Kavasam & Sivapuranam.
                </p>
              </div>

              {/* Master Alarm Switch */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300">
                    <BellRing className="w-4 h-4 animate-bounce" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                      Enable Heavy-Sleeper Alarm & Briefing
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300">
                      Background time monitor checks every 15s to trigger wakeup alarm at target time
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.heavySleeperAlarmEnabled}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        heavySleeperAlarmEnabled: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
                </label>
              </div>

              {/* Alarm Config Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Alarm Time Picker */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-brand-500" />
                      <span>Wakeup Alarm Time</span>
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Default: 06:00 AM</span>
                  </div>
                  <input
                    type="time"
                    value={settings.heavySleeperAlarmTime || '06:00'}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        heavySleeperAlarmTime: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Fires persistent audio and triggers the bilingual speech sequence.
                  </p>
                </div>

                {/* Maximum Volume Override */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>100% Volume Override</span>
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.alarmMaxVolume}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            alarmMaxVolume: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Forces Web Audio master gain to 1.0 (maximum output) to bypass accidental low system levels.
                  </p>
                </div>

                {/* Preferred Zodiac Sign (Rasi) */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Preferred Zodiac Sign (Daily Rasipalan Briefing)</span>
                    </label>
                    <span className="text-[10px] font-mono text-indigo-500">
                      {settings.preferredRasi ? settings.preferredRasi.toUpperCase() : 'MESHAM'}
                    </span>
                  </div>
                  <select
                    value={settings.preferredRasi || 'mesham'}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        preferredRasi: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {TAMIL_ZODIAC_SIGNS.map((sign) => (
                      <option key={sign.id} value={sign.id}>
                        {sign.nameTa} ({sign.nameEn} - {sign.westernSign})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Your daily briefing will recite astrological predictions and celestial guidance specifically for this Rasi in English followed by Tamil.
                  </p>
                </div>

                {/* Continuous Devotional Audio Playback */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Sacred Devotional Chants Playback
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.devotionalMusicEnabled}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            devotionalMusicEnabled: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500" />
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Immediately following speech completion, seamlessly recites <strong>Kanda Sashti Kavasam</strong> (Lord Murugan) and <strong>Sivapuranam</strong> (Lord Shiva / Thiruvasagam) with live teleprompter text.
                  </p>
                </div>
              </div>

              {/* Comprehensive Morning Alarm & Briefing Test Simulation Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 border-2 border-amber-500/40 shadow-lg flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-slate-950 shadow-md shadow-amber-500/30 shrink-0">
                      <Sun className="w-6 h-6 animate-spin-slow" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          Test Morning Alarm & Briefing
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-sm">
                          Live Simulation
                        </span>
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        Instantly triggers the complete 4-step morning wake-up routine for testing.
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      triggerAlarmTest();
                    }}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-400 hover:from-amber-400 hover:via-rose-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-glow whitespace-nowrap transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0"
                  >
                    <Sun className="w-4 h-4 fill-current" />
                    <span>Test Morning Alarm & Briefing</span>
                  </button>
                </div>

                {/* 4-Step Routine Timeline Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-amber-500/20 text-[11px]">
                  <div className="p-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-amber-500/20">
                    <div className="font-mono font-bold text-amber-600 dark:text-amber-400">Step 1</div>
                    <div className="font-extrabold text-slate-900 dark:text-white">Peaceful Bell</div>
                    <div className="text-[10px] text-slate-500">Singing bowl (100% Vol)</div>
                  </div>
                  <div className="p-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-amber-500/20">
                    <div className="font-mono font-bold text-brand-600 dark:text-brand-400">Step 2</div>
                    <div className="font-extrabold text-slate-900 dark:text-white">Dismissal Gate</div>
                    <div className="text-[10px] text-slate-500">Full-screen modal</div>
                  </div>
                  <div className="p-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-amber-500/20">
                    <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">Step 3</div>
                    <div className="font-extrabold text-slate-900 dark:text-white">Dual Speech</div>
                    <div className="text-[10px] text-slate-500">English ➔ தமிழ்</div>
                  </div>
                  <div className="p-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-500/20">
                    <div className="font-mono font-bold text-purple-600 dark:text-purple-400">Step 4</div>
                    <div className="font-extrabold text-slate-900 dark:text-white">Devotional Chants</div>
                    <div className="text-[10px] text-slate-500">Sashti Kavasam & Shiva</div>
                  </div>
                </div>

                {/* Voice Diagnostic Detection */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Detected Voices:</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] ${voiceDiagnostics.hasEnglishVoice ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600'}`}>
                      <CheckCircle2 className="w-3 h-3" />
                      English Voice: {voiceDiagnostics.hasEnglishVoice ? 'Ready' : 'Default'}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] ${voiceDiagnostics.hasTamilVoice ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-brand-500/10 text-brand-600 dark:text-brand-400'}`}>
                      <CheckCircle2 className="w-3 h-3" />
                      Tamil Voice: {voiceDiagnostics.hasTamilVoice ? 'Native Tamil' : 'Phonetic Fallback'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Audio Hardware: 100% Volume Override
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 1: REMINDER SCHEDULE SETTINGS
          ========================================================================= */}
          {activeTab === 'schedule' && (
            <div className="space-y-5">
              {/* Master Reminders Switch */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-brand-500/20 text-brand-600 dark:text-brand-300">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                      Master Scheduled Reminders
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300">
                      Evaluate daily times and fire friendly local alerts
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.remindersEnabled}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, remindersEnabled: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                </label>
              </div>

              {/* 1. Morning Check-In & Photo */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Morning Fasted Weigh-In & Ghost Photo
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Daily equilibrium checkpoint before breakfast
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="time"
                      value={settings.morningReminderTime}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, morningReminderTime: e.target.value }))
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:border-brand-500"
                    />
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.morningReminder}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, morningReminder: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* 2. Meal Logging Reminders */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Meal Logging & Macro Checks
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Timely prompts to scan meals with Gemini AI vision
                    </span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.mealReminders}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, mealReminders: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
                  </label>
                </div>

                {settings.mealReminders && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 animate-fadeIn">
                    {/* Breakfast */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Breakfast</span>
                        <input
                          type="checkbox"
                          checked={settings.mealBreakfast}
                          onChange={(e) =>
                            setSettings((prev) => ({ ...prev, mealBreakfast: e.target.checked }))
                          }
                          className="rounded text-brand-500 focus:ring-brand-500"
                        />
                      </div>
                      <input
                        type="time"
                        value={settings.mealBreakfastTime}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, mealBreakfastTime: e.target.value }))
                        }
                        className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Lunch */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Lunch</span>
                        <input
                          type="checkbox"
                          checked={settings.mealLunch}
                          onChange={(e) =>
                            setSettings((prev) => ({ ...prev, mealLunch: e.target.checked }))
                          }
                          className="rounded text-brand-500 focus:ring-brand-500"
                        />
                      </div>
                      <input
                        type="time"
                        value={settings.mealLunchTime}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, mealLunchTime: e.target.value }))
                        }
                        className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Dinner */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Dinner</span>
                        <input
                          type="checkbox"
                          checked={settings.mealDinner}
                          onChange={(e) =>
                            setSettings((prev) => ({ ...prev, mealDinner: e.target.checked }))
                          }
                          className="rounded text-brand-500 focus:ring-brand-500"
                        />
                      </div>
                      <input
                        type="time"
                        value={settings.mealDinnerTime}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, mealDinnerTime: e.target.value }))
                        }
                        className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Evening Workout Session */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-brand-400" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Workout Session Reminder
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Equipment-matched routine reminder
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="time"
                      value={settings.workoutReminderTime}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, workoutReminderTime: e.target.value }))
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:border-brand-500"
                    />
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.workoutReminder}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, workoutReminder: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Audio Sound Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Volume2 className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      Sound & Audio Chime
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Plays a friendly harmonic bell chime when a notification fires
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, soundEnabled: e.target.checked }))
                  }
                  className="rounded text-brand-500 focus:ring-brand-500"
                />
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: GOOGLE CALENDAR & GOOGLE TASKS SYNC
          ========================================================================= */}
          {activeTab === 'google' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-300 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>Google Reminders & Calendar Ecosystem</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Sync daily fitness reminders directly into your official Google Calendar or Google Tasks on mobile (Android/iOS) and web with daily recurring alarms.
                </p>
              </div>

              {/* Section A: 1-Click Direct Google Calendar Sync (Universal) */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
                  <span>1-Click Universal Google Calendar Sync</span>
                  <span className="text-[10px] text-brand-600 dark:text-brand-400 lowercase font-mono">
                    Zero Setup • Daily Repeating
                  </span>
                </h3>

                <div className="space-y-2.5">
                  {calendarIntents.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {item.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.description}
                        </p>
                      </div>

                      <a
                        href={item.intentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
                      >
                        <span>Add to Google Cal</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section B: Google Tasks Direct API Sync */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Google Tasks API Direct Sync
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                    OAuth 2.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Creates a dedicated <strong>"FitMaintenance AI"</strong> task list inside your Google Tasks app with scheduled daily maintenance checkpoints.
                </p>

                <div className="space-y-2">
                  <input
                    type="password"
                    value={googleAccessToken}
                    onChange={(e) => setGoogleAccessToken(e.target.value)}
                    placeholder="Paste Google OAuth Access Token (Optional)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={handleSyncGoogleTasks}
                    disabled={googleSyncing}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 font-bold text-xs transition-colors disabled:opacity-60"
                  >
                    {googleSyncing ? 'Synchronizing Google Tasks...' : 'Sync Tasks to Google Account'}
                  </button>
                  {googleSyncMsg && (
                    <p className="text-[11px] text-brand-600 dark:text-brand-400 font-medium">
                      {googleSyncMsg}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 3: FCM & SMS / WHATSAPP HOOKS (ARCHITECTURE READY)
          ========================================================================= */}
          {activeTab === 'channels' && (
            <div className="space-y-5">
              {/* FCM Device Token Section */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-brand-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Firebase Cloud Messaging (FCM) Token
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleFetchFcmToken}
                    disabled={isFetchingFcm}
                    className="px-2.5 py-1 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 text-[11px] font-bold border border-brand-500/30 transition-all"
                  >
                    {isFetchingFcm ? 'Registering...' : 'Request Token'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Enables background web push notifications even when FitMaintenance AI is closed. Saved automatically to Cloud Firestore.
                </p>

                {settings.fcmToken ? (
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 font-mono text-[10px] text-slate-700 dark:text-slate-300">
                    <span className="truncate max-w-[85%]">{settings.fcmToken}</span>
                    <button
                      type="button"
                      onClick={handleCopyToken}
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title="Copy Token"
                    >
                      {copiedToken ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 italic">
                    No token registered yet. Click "Request Token" to register device.
                  </div>
                )}
              </div>

              {/* SMS & WhatsApp Hooks (Twilio / Meta Cloud API) */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        SMS & WhatsApp Message Alerts
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Production hooks for Twilio & WhatsApp Business API
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Architecture Ready
                  </span>
                </div>

                {/* SMS Channel */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Direct SMS Reminders (Twilio)
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.smsEnabled}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, smsEnabled: e.target.checked }))
                      }
                      className="rounded text-brand-500 focus:ring-brand-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="tel"
                      value={settings.smsPhoneNumber || ''}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, smsPhoneNumber: e.target.value }))
                      }
                      placeholder="+1234567890 or +919876543210"
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleTestSmsDispatch}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
                    >
                      Test SMS
                    </button>
                  </div>
                </div>

                {/* WhatsApp Channel */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      WhatsApp Message Alerts (Cloud API)
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.whatsappEnabled}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, whatsappEnabled: e.target.checked }))
                      }
                      className="rounded text-brand-500 focus:ring-brand-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="tel"
                      value={settings.whatsappNumber || ''}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, whatsappNumber: e.target.value }))
                      }
                      placeholder="+919876543210"
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleTestWhatsAppDispatch}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-300 transition-colors"
                    >
                      Test WhatsApp
                    </button>
                  </div>
                </div>

                {dispatchStatus && (
                  <p className="text-xs font-mono text-brand-600 dark:text-brand-400 bg-brand-500/10 p-2 rounded-xl">
                    {dispatchStatus}
                  </p>
                )}

                {/* Architecture Reference Collapsible */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowArchDocs(!showArchDocs)}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-semibold"
                  >
                    <span>View Cloud Functions / Webhook Architecture Details</span>
                    {showArchDocs ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {showArchDocs && (
                    <div className="mt-2.5 p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 font-mono animate-fadeIn">
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        Webhook Payload Format:
                      </p>
                      <pre className="text-[10px] overflow-x-auto p-2 rounded bg-slate-200 dark:bg-slate-900 text-slate-800 dark:text-slate-300">
{`{
  "to": "${settings.smsPhoneNumber || '+1234567890'}",
  "body": "FitMaintenance: Time for your morning weigh-in & ghost photo!",
  "provider": "twilio_sms | whatsapp_cloud_api"
}`}
                      </pre>
                      <p className="text-[10px] text-slate-500">
                        Preferences saved to Firestore: <code>users/{'{userId}'}/settings/notifications</code>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {saveSuccess && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 animate-fadeIn">
                  <Check className="w-4 h-4" />
                  <span>Synced to Cloud!</span>
                </span>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-brand-500 to-teal-500 hover:from-brand-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-glow flex items-center gap-2 transition-all disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Reminder Preferences</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
