import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Dumbbell, Sparkles } from 'lucide-react';
import { OnboardingFlow } from '../onboarding/OnboardingFlow';

export const ProtectedRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, loading, userProfile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-500 to-teal-400 flex items-center justify-center shadow-glow animate-pulse">
            <Dumbbell className="w-8 h-8 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-brand-500/50 flex items-center justify-center text-brand-400">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
          </div>
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          FitMaintenance <span className="text-brand-400">AI</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">Verifying Athlete Authentication...</p>
        <div className="w-32 bg-slate-900 h-1 rounded-full overflow-hidden mt-4">
          <div className="bg-brand-500 h-full w-full animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If first-time user and onboarding is not completed, show onboarding flow
  if (!userProfile.onboardingCompleted) {
    return <OnboardingFlow />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export const PublicOnlyRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
