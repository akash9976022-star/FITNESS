import React, { useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Utensils,
  Dumbbell,
  TrendingUp,
  User,
  LogOut,
  Sparkles,
  Zap,
  Flame,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { FirebaseConfigModal } from '../common/FirebaseConfigModal';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { id: 'nutrition', label: 'Nutrition', path: '/nutrition', icon: Utensils, badge: 'Track' },
  { id: 'workouts', label: 'Workouts', path: '/workouts', icon: Dumbbell },
  { id: 'progress', label: 'Progress', path: '/progress', icon: TrendingUp },
  { id: 'profile', label: 'Profile', path: '/profile', icon: User },
];

export const AppLayout: React.FC = () => {
  const { user, logout, isFirebaseReady, userProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [configModalOpen, setConfigModalOpen] = useState(false);

  const currentTab = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path)) || NAV_ITEMS[0];

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-brand-500 selection:text-white">
      {/* Background glow effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* DESKTOP SIDEBAR (Visible on md: and above) */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-slate-900/90 border-r border-slate-800/80 p-5 shrink-0 sticky top-0 h-screen z-30 backdrop-blur-xl">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-2 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 to-teal-400 flex items-center justify-center shadow-glow shrink-0">
            <Dumbbell className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">FitMaintenance</span>
              <span className="text-xs px-1.5 py-0.5 rounded-md font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                AI
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Smart Equilibrium Coach</span>
            </div>
          </div>
        </div>

        {/* AI Quick Status Pill */}
        <div className="mx-1 mb-6 p-3 rounded-2xl bg-gradient-to-r from-brand-950/40 via-slate-900 to-teal-950/40 border border-brand-500/20 shadow-sm">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 font-semibold text-brand-300">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" /> Maintenance Target
            </span>
            <span className="text-white font-mono font-bold text-xs">{userProfile.targetCalories} kcal</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div className="bg-gradient-to-r from-brand-500 to-teal-400 h-full rounded-full" style={{ width: '68%' }} />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-mono">
            <span>Burned: 1,650 kcal</span>
            <span>Bal: +800</span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-2 mb-2 text-[11px] font-bold tracking-wider uppercase text-slate-300">
          Core Navigation
        </div>
        <nav className="flex-1 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isActive ? 'bg-brand-500/20 text-brand-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      isActive ? 'text-brand-400 translate-x-0.5' : 'text-slate-600 group-hover:text-slate-400'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Firebase Config / Integration Button */}
        <div className="pt-3 border-t border-slate-800/80 mb-3">
          <button
            onClick={() => setConfigModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/70 border border-transparent hover:border-slate-700 transition-all"
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isFirebaseReady ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>{isFirebaseReady ? 'Firebase Connected' : 'Demo / Firebase Key'}</span>
            </div>
            <Settings className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>

        {/* User Profile Pill at Bottom of Desktop Sidebar */}
        <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Avatar'}
                  className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-500 flex items-center justify-center text-slate-950 font-bold text-sm">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              {user?.isDemo && (
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-slate-950 flex items-center justify-center text-[7px] font-black text-slate-950" title="Demo Mode">
                  ⚡
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                {user?.displayName || 'Active Athlete'}
              </div>
              <div className="text-[11px] text-slate-400 truncate font-mono">
                {user?.email || 'Logged in'}
              </div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* MOBILE TOP BAR (Visible only on < md) */}
      <header className="md:hidden sticky top-0 z-40 bg-slate-950/90 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-500 to-teal-400 flex items-center justify-center shadow-glow">
            <Dumbbell className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1">
              FitMaintenance <span className="text-brand-400">AI</span>
            </div>
            <div className="text-[10px] text-brand-300 font-medium capitalize">
              {currentTab.label}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user?.isDemo && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Demo
            </span>
          )}
          <button
            onClick={() => setConfigModalOpen(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="w-8 h-8 rounded-xl overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-brand-400">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT / CONTENT OUTLET */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen pb-24 md:pb-8 overflow-x-hidden">
        {/* Desktop Top Header Info Bar */}
        <div className="hidden md:flex items-center justify-between px-8 py-4 border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-sm">
          <div>
            <h2 className="text-xl font-bold text-white capitalize flex items-center gap-2">
              {currentTab.label}
              <span className="text-xs font-normal text-slate-400">
                • FitMaintenance Precision Engine
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-300">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>5 Day Consistency Streak</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-500/10 border border-brand-500/30 text-xs font-semibold text-brand-300">
              <Zap className="w-3.5 h-3.5 text-brand-400" />
              <span>AI Coach: Active</span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR (Visible only on < md) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-2xl px-2 py-1.5"
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all relative ${
                  isActive ? 'text-brand-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div
                  className={`relative p-1 rounded-xl transition-all ${
                    isActive ? 'bg-brand-500/15' : ''
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                  {item.badge && !isActive && (
                    <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-teal-400" />
                  )}
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 w-5 h-0.5 bg-gradient-to-r from-brand-400 to-teal-400 rounded-full shadow-glow" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Firebase Configuration Modal */}
      <FirebaseConfigModal isOpen={configModalOpen} onClose={() => setConfigModalOpen(false)} />
    </div>
  );
};
