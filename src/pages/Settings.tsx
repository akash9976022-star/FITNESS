import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Smartphone,
  Globe,
  Database,
  Lock,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { firebaseConfig, isFirebaseConfigured } from '../config/firebase';
import { getPlatform, isNativeApp } from '../utils/platform';

export const Settings: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const platform = getPlatform();
  const isNative = isNativeApp();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">System & Account Settings</h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Inspect Firebase modular SDK status, Capacitor Android runtime, and routing configuration.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt="Avatar"
              className="w-14 h-14 rounded-2xl object-cover border border-emerald-500/30"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-xl uppercase shadow-md">
              {currentUser?.displayName ? currentUser.displayName[0] : 'U'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">{currentUser?.displayName || 'Active User'}</h3>
              {currentUser?.isDemo && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                  Demo Session
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">{currentUser?.email || 'No email attached'}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">UID: {currentUser?.uid}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Firebase Diagnostics */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Firebase Modular SDK & Firestore</h3>
          </div>
          {isFirebaseConfigured ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5" />
              Awaiting .env Keys
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-400 block mb-1">Project ID</span>
            <span className="font-mono text-slate-200">
              {firebaseConfig.projectId || '(Not configured)'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-400 block mb-1">Auth Domain</span>
            <span className="font-mono text-slate-200">
              {firebaseConfig.authDomain || '(Not configured)'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-400 block mb-1">API Key Configured</span>
            <span className="font-mono text-slate-200">
              {firebaseConfig.apiKey ? '••••••••••••••••' + firebaseConfig.apiKey.slice(-4) : 'Missing'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-400 block mb-1">Supported Auth Providers</span>
            <span className="font-semibold text-emerald-400">
              Email/Password + Google Sign-In
            </span>
          </div>
        </div>

        {!isFirebaseConfigured && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p>
              To enable live Firebase Auth & Firestore persistence, add your Firebase keys to{' '}
              <code className="text-white font-mono bg-amber-950/60 px-1 py-0.5 rounded">.env</code> using the format provided in{' '}
              <code className="text-white font-mono bg-amber-950/60 px-1 py-0.5 rounded">.env.example</code>.
            </p>
          </div>
        )}
      </div>

      {/* Deployment & Capacitor Android Runtime */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <Smartphone className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Hosting & Android Capacitor Architecture</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Router Strategy</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Configured with <code className="text-emerald-400 font-mono">HashRouter</code>. Routes use URL fragments (e.g.{' '}
              <span className="font-mono text-slate-300">/#/workouts</span>), preventing 404 errors on GitHub Pages refreshes and Capacitor Android file protocols.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
              <Lock className="w-4 h-4 text-teal-400" />
              <span>Platform Target</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Current environment: <span className="font-bold text-white capitalize">{platform}</span>{' '}
              ({isNative ? 'Capacitor Native Shell' : 'Web Browser'}). Base asset path set to{' '}
              <code className="text-teal-400 font-mono">./</code> in Vite for universal APK and subpath resolution.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 space-y-1">
          <span className="font-bold text-white block">Capacitor Android Build Command:</span>
          <pre className="font-mono text-emerald-400 bg-slate-950 p-2 rounded-lg text-[11px] overflow-x-auto">
            npm run build &#38;&#38; npx cap sync android &#38;&#38; npx cap open android
          </pre>
        </div>
      </div>
    </div>
  );
};

export default Settings;
