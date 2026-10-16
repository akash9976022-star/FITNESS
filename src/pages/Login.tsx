import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPlatform, isNativeApp } from '../utils/platform';

export const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    loginAnonymously,
    isFirebaseConfigured,
    error: authError,
    clearError,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (isSignUp) {
        await signupWithEmail(email, password, name.trim());
      } else {
        await loginWithEmail(email, password);
      }
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setLocalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    clearError();
    setSubmitting(true);
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign in failed';
      setLocalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLocalError(null);
    clearError();
    setSubmitting(true);
    try {
      await loginAnonymously();
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Guest access failed';
      setLocalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const platform = getPlatform();
  const isNative = isNativeApp();

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/15 dark:bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-500/15 dark:bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main card with solid opacity */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl dark:shadow-2xl p-6 sm:p-8 z-10">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-3">
            <Dumbbell className="w-7 h-7 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">FitMaintenance</h1>
            <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30">
              AI
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time Firestore sync • Maintenance calories • Workout volume logging
          </p>
        </div>

        {/* Platform & Firebase Status Banner */}
        <div className="mb-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
            {isNative ? (
              <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            )}
            <span>{platform.toUpperCase()} Target</span>
          </div>

          {isFirebaseConfigured ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Firebase Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Checking Keys...
            </span>
          )}
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setLocalError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              !isSignUp
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setLocalError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              isSignUp
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Errors */}
        {(localError || authError) && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <span className="flex-1 leading-relaxed">{localError || authError}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Smith"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="athlete@fitmaintenance.ai"
                required
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            <span>{isSignUp ? 'Create FitMaintenance Account' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-500 font-semibold tracking-wider">
              Or connect via
            </span>
          </div>
        </div>

        {/* Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={submitting}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800/80 active:scale-[0.99] border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-3 transition disabled:opacity-50 shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign In with Google</span>
        </button>

        {/* Real Anonymous Guest Access (Real Firebase UID, Real Firestore sync) */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleGuestSignIn}
            disabled={submitting}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Instant Guest Session (Real Firestore Sync)</span>
          </button>
        </div>
      </div>

      {/* Footer feature checklist */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> HashRouter 404-Free
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Capacitor Android Ready
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Live Firestore onSnapshot
        </span>
      </div>
    </div>
  );
};

export default Login;
