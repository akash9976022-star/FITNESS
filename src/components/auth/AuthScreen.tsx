import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Dumbbell,
  Sparkles,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Zap,
  Settings,
} from 'lucide-react';

interface AuthScreenProps {
  onOpenFirebaseConfig?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onOpenFirebaseConfig }) => {
  const {
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    loginWithDemo,
    error,
    clearError,
    isFirebaseReady,
  } = useAuth();

  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [localValidation, setLocalValidation] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalValidation(null);
    clearError();

    if (!email || !password) {
      setLocalValidation('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setLocalValidation('Password must be at least 6 characters.');
      return;
    }

    if (isSignUp) {
      if (password !== confirmPassword) {
        setLocalValidation('Passwords do not match.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isSignUp) {
        await signupWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
    } catch {
      // Error handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalValidation(null);
    clearError();
    setSubmitting(true);
    try {
      await loginWithGoogle();
    } catch {
      // Error handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoSignIn = async () => {
    setLocalValidation(null);
    clearError();
    setSubmitting(true);
    try {
      await loginWithDemo();
    } finally {
      setSubmitting(false);
    }
  };

  const activeError = localValidation || error;

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Dynamic ambient lighting & grid glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-500/15 rounded-full blur-[140px] pointer-events-none" />
      
      {/* Background subtle fitness pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)`,
          backgroundSize: '100px 100px'
        }}
      />

      {/* Header bar / Firebase status indicator */}
      <div className="w-full max-w-md flex justify-between items-center mb-6 z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-teal-400 flex items-center justify-center shadow-glow">
            <Dumbbell className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
              FitMaintenance <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-teal-300">AI</span>
            </h1>
          </div>
        </div>

        {/* Firebase Config / Status Badge */}
        <button
          onClick={onOpenFirebaseConfig}
          title="Configure Firebase Keys"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-700/80 bg-slate-900/60 text-slate-300 hover:border-slate-500 hover:text-white transition-all backdrop-blur-md"
        >
          <span className={`w-2 h-2 rounded-full ${isFirebaseReady ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span>{isFirebaseReady ? 'Firebase Live' : 'Demo / Config'}</span>
          <Settings className="w-3 h-3 text-slate-400 ml-0.5" />
        </button>
      </div>

      {/* Main Glass Card */}
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 border border-slate-800">
        {/* Card Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            AI-Powered Maintenance & Body Recomp
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isSignUp ? 'Create your athlete account' : 'Welcome back to your zone'}
          </h2>
          <p className="text-sm text-slate-400 mt-1.5">
            {isSignUp
              ? 'Lock in your maintenance calories, workouts, and macro balance'
              : 'Sign in to access your maintenance dashboard & AI coach'}
          </p>
        </div>

        {/* Tab switch between Sign In and Sign Up */}
        <div className="grid grid-cols-2 p-1 bg-slate-900/80 rounded-2xl mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              clearError();
              setLocalValidation(null);
            }}
            className={`py-2 text-sm font-semibold rounded-xl transition-all ${
              !isSignUp
                ? 'bg-gradient-to-r from-brand-500 to-teal-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              clearError();
              setLocalValidation(null);
            }}
            className={`py-2 text-sm font-semibold rounded-xl transition-all ${
              isSignUp
                ? 'bg-gradient-to-r from-brand-500 to-teal-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {activeError && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1 font-medium">{activeError}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="athlete@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              {!isSignUp && (
                <span className="text-xs text-brand-400 hover:text-brand-300 cursor-pointer">
                  Forgot?
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-gradient-to-r from-brand-500 to-teal-500 hover:from-brand-400 hover:to-teal-400 text-slate-950 font-bold text-sm rounded-xl shadow-glow transition-all flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? 'Create Free Athlete Account' : 'Sign In to Dashboard'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900/90 px-3 text-slate-500 font-semibold">Or continue with</span>
          </div>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={submitting}
          className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:border-slate-600"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12c0 2.03.45 3.84 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Quick Demo Access One-Click Button */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 hover:border-brand-500/50 rounded-xl text-xs font-semibold text-brand-300 transition-all flex items-center justify-center gap-2 group"
          >
            <Zap className="w-3.5 h-3.5 text-brand-400 group-hover:scale-110 transition-transform" />
            <span>⚡ Instant One-Click Demo Mode (Explore Instantly)</span>
          </button>
        </div>

        {/* Feature Badges Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" /> Web & Mobile
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" /> Firebase Auth
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" /> AI Coach
          </span>
        </div>
      </div>
    </div>
  );
};
