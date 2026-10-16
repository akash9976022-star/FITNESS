import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Smartphone,
  Globe,
  Database,
  Lock,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Moon,
  Monitor,
  Dumbbell,
  Wrench,
  ChevronRight,
  Flame,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { firebaseConfig, isFirebaseConfigured } from '../config/firebase';
import { getPlatform, isNativeApp } from '../utils/platform';
import { subscribeUserProfile, type UserProfile } from '../services/firestoreService';

export const Settings: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = subscribeUserProfile(currentUser.uid, (data) => {
      setProfile(data);
    });
    return () => unsub();
  }, [currentUser?.uid]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const platform = getPlatform();
  const isNative = isNativeApp();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          System & Account Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Persistent theme engine, Firebase modular SDK status, and Capacitor Android runtime.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt="Avatar"
              className="w-14 h-14 rounded-2xl object-cover border border-emerald-500/30"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-xl uppercase shadow-md">
              {currentUser?.displayName ? currentUser.displayName[0] : 'A'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {currentUser?.displayName || 'Active Athlete'}
              </h3>
              {currentUser?.isAnonymous && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 font-bold">
                  Live Guest UID
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {currentUser?.email || 'Anonymous Firebase session'}
            </p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">UID: {currentUser?.uid}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 text-xs font-bold transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Gym Inventory & Coaching Tier */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div className="flex items-center gap-2.5">
            <Dumbbell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Gym Inventory & Coaching Tier
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calibrated against your available equipment catalog and target maintenance volume.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition active:scale-[0.98] self-start sm:self-auto"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>{profile ? 'Manage Profile & Inventory' : 'Configure Profile'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {profile ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Coaching Tier</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 capitalize flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  {profile.experienceLevel}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Maintenance TDEE</span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  {profile.calculatedTdee} kcal
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Target Weight</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {profile.targetWeightKg} kg
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Equipment Count</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {profile.equipment?.length || 0} Registered
                </span>
              </div>
            </div>

            {profile.equipment && profile.equipment.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Active Machine & Free-Weight Inventory
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {profile.equipment.map((item) => (
                    <span
                      key={item}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="font-bold text-amber-800 dark:text-amber-400 block">
                Onboarding Setup Pending
              </span>
              <p className="text-amber-700 dark:text-amber-300">
                No inventory or biometric profile synced. Launch onboarding to customize your Gemini AI coach.
              </p>
            </div>
            <button
              onClick={() => navigate('/onboarding')}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold shrink-0 transition"
            >
              Start Setup
            </button>
          </div>
        )}
      </div>

      {/* Persistent Theme Selector */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Sun className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Persistent Theme Engine</h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium capitalize">
            Current: <strong className="text-emerald-600 dark:text-emerald-400">{resolvedTheme}</strong>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${
              theme === 'light'
                ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold shadow-sm'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500" />
            <span className="text-xs">Light Mode</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${
              theme === 'dark'
                ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold shadow-sm'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Moon className="w-5 h-5 text-indigo-500" />
            <span className="text-xs">Dark Mode</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${
              theme === 'system'
                ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold shadow-sm'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Monitor className="w-5 h-5 text-slate-500" />
            <span className="text-xs">System Default</span>
          </button>
        </div>
      </div>

      {/* Firebase Diagnostics */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Firebase Modular SDK & Firestore</h3>
          </div>
          {isFirebaseConfigured ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Connected (onSnapshot Live)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 font-semibold px-2 py-1 rounded bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5" />
              Awaiting .env Keys
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400 block mb-1">Project ID</span>
            <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
              {firebaseConfig.projectId || '(Not configured)'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400 block mb-1">Auth Domain</span>
            <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
              {firebaseConfig.authDomain || '(Not configured)'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400 block mb-1">API Key Configured</span>
            <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
              {firebaseConfig.apiKey ? '••••••••••••••••' + firebaseConfig.apiKey.slice(-4) : 'Missing'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400 block mb-1">Zero-Mock-Data Policy</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              100% Real-Time Firestore Synced
            </span>
          </div>
        </div>
      </div>

      {/* Deployment & Capacitor Android Runtime */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Hosting & Android Capacitor Architecture</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold mb-1">
              <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Router Strategy</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Configured with <code className="text-emerald-600 dark:text-emerald-400 font-mono">HashRouter</code>. Routes use URL fragments (e.g.{' '}
              <span className="font-mono text-slate-800 dark:text-slate-300">/#/workouts</span>), preventing 404 errors on GitHub Pages refreshes and Capacitor Android file protocols.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold mb-1">
              <Lock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Platform Target</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Current environment: <span className="font-bold text-slate-900 dark:text-white capitalize">{platform}</span>{' '}
              ({isNative ? 'Capacitor Native Shell' : 'Web Browser'}). Base asset path set to{' '}
              <code className="text-teal-600 dark:text-teal-400 font-mono">./</code> in Vite for universal APK and subpath resolution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;