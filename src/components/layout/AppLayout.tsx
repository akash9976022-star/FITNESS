import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Dumbbell,
  UtensilsCrossed,
  Sparkles,
  Settings,
  LogOut,
  Smartphone,
  Globe,
  Bell,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  Sun,
  Moon,
  User,
  Camera,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getPlatform, isNativeApp } from '../../utils/platform';
import LiveAnimatedBackground from '../common/LiveAnimatedBackground';
import AlarmManager from '../alarm/AlarmManager';
import RoutineManager from '../routine/RoutineManager';
import LiveClockHeader from '../common/LiveClockHeader';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Check-In', path: '/checkin', icon: Camera },
  { name: 'Workouts', path: '/workouts', icon: Dumbbell },
  { name: 'Nutrition', path: '/nutrition', icon: UtensilsCrossed },
  { name: 'Calendar', path: '/calendar', icon: CalendarIcon, badge: 'தமிழ்' },
  { name: 'AI Coach', path: '/ai-coach', icon: Sparkles, badge: 'AI' },
  { name: 'Profile', path: '/profile', icon: User },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const mobileBottomNavItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Check-In', path: '/checkin', icon: Camera },
  { name: 'Workouts', path: '/workouts', icon: Dumbbell },
  { name: 'Nutrition', path: '/nutrition', icon: UtensilsCrossed },
  { name: 'Profile', path: '/profile', icon: User },
];

export const AppLayout: React.FC = () => {
  const { currentUser, logout, isFirebaseConfigured } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const current = navItems.find((item) => item.path === location.pathname);
    return current ? current.name : 'FitMaintenance AI';
  };

  const platform = getPlatform();
  const isNative = isNativeApp();

  return (
    <div className="flex h-screen w-full bg-slate-50/70 dark:bg-slate-950/70 text-slate-900 dark:text-slate-100 overflow-hidden font-sans relative transition-colors duration-200">
      {/* Live Animated Background */}
      <LiveAnimatedBackground />

      {/* Global Heavy-Sleeper Alarm & Dual-Language Speech Briefing Manager */}
      <AlarmManager />

      {/* Global Personalized Routine Timing & Natural Voice Reminder Manager */}
      <RoutineManager />

      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl flex-shrink-0 select-none shadow-xl shadow-slate-950/5 dark:shadow-black/20 z-30 transition-all duration-300">
        {/* Brand / Logo */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 blur-sm opacity-50 group-hover:opacity-100 transition-opacity" />
              <img
                src="./logo.png"
                alt="FitMaintenance AI Logo"
                className="relative w-10 h-10 rounded-xl object-cover shadow-md shadow-emerald-500/20 transform group-hover:scale-105 transition-transform duration-200"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  FitMaintenance
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded-md font-extrabold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">Intelligent Body Comp</p>
            </div>
          </div>
        </div>

        {/* Platform & Status Badge */}
        <div className="px-5 py-2.5 border-b border-slate-200/60 dark:border-slate-800/40 bg-slate-100/50 dark:bg-slate-900/40 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 font-semibold">
            {isNative ? (
              <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            )}
            <span className="capitalize">{platform} Client</span>
          </div>

          {isFirebaseConfigured ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50/80 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30 shadow-xs">
              <ShieldCheck className="w-3 h-3" /> Live Firestore
            </span>
          ) : (
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">Connecting...</span>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold btn-tactile transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-teal-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10 backdrop-blur-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:border-slate-300/60 dark:hover:border-slate-700/60 border border-transparent hover:translate-x-1'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive
                        ? 'text-emerald-600 dark:text-emerald-400 scale-105'
                        : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-emerald-400 group-hover:scale-105'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge ? (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                    {item.badge}
                  </span>
                ) : (
                  isActive && <ChevronRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info & Actions */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/70">
          <div
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 mb-3 shadow-sm cursor-pointer hover:border-emerald-500/40 hover:shadow-md transition-all card-3d"
            title="View & Edit Athlete Profile"
          >
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover border-2 border-emerald-500/40"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-xs uppercase shadow-inner">
                {currentUser?.displayName ? currentUser.displayName[0] : <User className="w-4 h-4 text-white" />}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {currentUser?.displayName || 'Active Athlete'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-medium">
                {currentUser?.email || (currentUser?.isAnonymous ? 'Guest Account' : 'Authenticated')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 btn-tactile shadow-xs"
              title={`Toggle theme (currently ${resolvedTheme})`}
            >
              {resolvedTheme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Dark</span>
                </>
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center px-3 py-2 text-xs font-bold rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200/80 dark:border-rose-500/20 btn-tactile shadow-xs"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 btn-tactile"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Brand Header */}
            <div className="flex items-center gap-2 md:hidden">
              <img
                src="./logo.png"
                alt="FitMaintenance AI Logo"
                className="w-7 h-7 rounded-lg object-cover shadow-sm"
              />
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">FitMaintenance</span>
            </div>

            {/* Desktop breadcrumb / Page title */}
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Real-time Live Clock & Date Display */}
            <LiveClockHeader />

            {/* Theme Toggle in Header */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-xs btn-tactile"
              aria-label="Toggle Light and Dark Mode"
              title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
            </button>

            {/* Live Synced Status Badge (Eliminated white box bug) */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Synced</span>
            </div>

            <button
              onClick={() => window.dispatchEvent(new CustomEvent('OPEN_ALARM_SETTINGS'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition shadow-xs text-xs font-bold btn-tactile"
              title="6:00 AM Max-Volume Alarm & Video Songs Library"
            >
              <Bell className="w-3.5 h-3.5 fill-current text-amber-500 animate-pulse" />
              <span className="hidden sm:inline">Alarm & Songs</span>
            </button>

            {/* User Avatar Chip */}
            <div
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-full bg-slate-100/90 dark:bg-slate-900/90 hover:bg-slate-200/90 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 cursor-pointer transition shadow-xs btn-tactile"
              title="View & Edit Profile"
            >
              <span className="hidden sm:inline text-xs font-bold text-slate-700 dark:text-slate-200 pl-1">
                {currentUser?.displayName?.split(' ')[0] || (currentUser?.isAnonymous ? 'Guest' : 'Athlete')}
              </span>
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Avatar"
                  className="w-7 h-7 rounded-full object-cover border border-emerald-500/40"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-inner">
                  {currentUser?.displayName ? currentUser.displayName[0] : 'A'}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable View Area with Zero Mobile Horizontal Overflow */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6 md:pb-8 pb-24">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-slate-950/85 backdrop-blur-2xl border-t border-slate-200/80 dark:border-slate-800/80 shadow-2xl transition-colors duration-200"
        style={{ paddingBottom: 'var(--safe-bottom)' }}
      >
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {mobileBottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`relative flex flex-col items-center justify-center py-1 btn-tactile transition-colors ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]' : ''} transition-transform`} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight truncate max-w-[56px] font-semibold">
                  {item.name}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-8 h-1 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-sm shadow-emerald-500/50" />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* ================= MOBILE DRAWER MODAL ================= */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-4/5 max-w-xs bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full flex flex-col p-5 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <img
                  src="./logo.png"
                  alt="FitMaintenance AI Logo"
                  className="w-8 h-8 rounded-lg object-cover shadow-sm"
                />
                <span className="font-bold text-slate-900 dark:text-white text-base">FitMaintenance AI</span>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile snapshot */}
            <div
              onClick={() => {
                setMobileDrawerOpen(false);
                navigate('/profile');
              }}
              className="my-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3 cursor-pointer hover:border-emerald-500/40 transition"
              title="View & Edit Profile"
            >
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-sm">
                  {currentUser?.displayName ? currentUser.displayName[0] : 'A'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {currentUser?.displayName || 'Active Athlete'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {currentUser?.email || (currentUser?.isAnonymous ? 'Guest Account' : 'Synced')}
                </p>
              </div>
            </div>

            {/* Nav links */}
            <div className="space-y-1 flex-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>

            {/* Theme Toggle and Logout */}
            <div className="pt-4 mt-auto border-t border-slate-200 dark:border-slate-800 space-y-2">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300"
              >
                {resolvedTheme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Switch to Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-500" />
                    <span>Switch to Dark Mode</span>
                  </>
                )}
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
