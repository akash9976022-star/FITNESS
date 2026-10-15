import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AiPhysiqueFeedback } from '../components/checkin/AiPhysiqueFeedback';
import { TransformationGallery } from '../components/checkin/TransformationGallery';
import { DailyCheckInModal } from '../components/checkin/DailyCheckInModal';
import type { DailyCheckInItem, ExperienceLevel } from '../types/auth';
import {
  TrendingUp,
  CheckCircle,
  Camera,
} from 'lucide-react';

export const ProgressPage: React.FC = () => {
  const { userProfile, updateUserProfile, fetchCheckIns, checkIns: liveCheckIns } = useAuth();

  const [checkIns, setCheckIns] = useState<DailyCheckInItem[]>([]);
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  // Sync real-time snapshot check-ins from AuthContext
  useEffect(() => {
    if (liveCheckIns && liveCheckIns.length > 0) {
      setCheckIns(liveCheckIns);
    }
  }, [liveCheckIns]);

  // Load check-in history from Firestore / local cache
  const loadCheckIns = async () => {
    try {
      const items = await fetchCheckIns();
      if (items && items.length > 0) {
        setCheckIns(items);
      }
    } catch (err) {
      console.warn('Error loading check-ins:', err);
    }
  };

  useEffect(() => {
    loadCheckIns();
  }, []);

  const latestCheckIn = checkIns.length > 0 ? checkIns[0] : null;
  const currentWeight = latestCheckIn?.weight || userProfile.weightKg;
  const targetWeight = userProfile.targetMaintenanceWeightKg || userProfile.weightKg;
  const variance = parseFloat((currentWeight - targetWeight).toFixed(2));
  const isEquilibrium = Math.abs(variance) <= 0.4;

  const handleExperienceLevelChange = async (newLevel: ExperienceLevel) => {
    await updateUserProfile({ experienceLevel: newLevel });
  };

  // 7-day weight corridor data (strictly derived from user's check-ins)
  const corridorData = React.useMemo(() => {
    if (checkIns.length > 0) {
      // Sort chronologically and take up to last 7 check-ins
      const sorted = [...checkIns]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-7);
      return sorted.map((c) => ({
        date: c.date.slice(5), // MM-DD
        weight: c.weight,
      }));
    }
    return [];
  }, [checkIns]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-brand-500 dark:text-brand-400" />
            Equilibrium & Body Composition
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Track weight stability, ghost-guided physique progress, and AI-adapted volume cues.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowCheckInModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-teal-500 hover:from-brand-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-glow flex items-center gap-2 transition-all active:scale-95"
          >
            <Camera className="w-4 h-4 text-slate-950" />
            <span>Daily Check-In & Ghost Cam</span>
          </button>
        </div>
      </div>

      {/* Stability & Vitals KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Maintenance Precision</span>
            <span className={`p-1 px-2 rounded-md font-bold text-[11px] ${
              isEquilibrium ? 'bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-500/20' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
            }`}>
              {isEquilibrium ? '98.8%' : '95.2%'}
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {variance >= 0 ? `+${variance}` : variance} kg
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {isEquilibrium ? 'Locked in optimal ±0.5 kg equilibrium corridor' : 'Slight metabolic variance detected'}
          </div>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Current Weight</span>
            <span className="p-1 px-2 rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-400 font-bold font-mono text-[11px] border border-teal-500/20">
              Target: {targetWeight} kg
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-teal-600 dark:text-teal-300">{currentWeight} kg</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {latestCheckIn ? `Logged on ${latestCheckIn.date}` : 'Calibrated from profile baseline'}
          </div>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Body Mass Index</span>
            <span className={`p-1 px-2 rounded-md font-bold text-[10px] ${
              (() => {
                const hM = Math.max(0.5, (userProfile.heightCm || 178) / 100);
                const b = currentWeight / (hM * hM);
                return b >= 18.5 && b <= 24.9
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20';
              })()
            }`}>
              {(() => {
                const hM = Math.max(0.5, (userProfile.heightCm || 178) / 100);
                const b = currentWeight / (hM * hM);
                return b < 18.5 ? 'Underweight' : b <= 24.9 ? 'Normal' : b <= 29.9 ? 'Overweight' : 'Obese';
              })()}
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-300">
            {(currentWeight / Math.pow(Math.max(0.5, (userProfile.heightCm || 178) / 100), 2)).toFixed(1)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Height: {userProfile.heightCm || 178} cm • Ideal: 18.5 – 24.9
          </div>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Metabolic Rate Status</span>
            <span className="p-1 px-2 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-[11px] border border-amber-500/20">TDEE</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-300">
            {userProfile.targetCalories} kcal
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Adaptive {userProfile.experienceLevel.toUpperCase()} calibration
          </div>
        </div>
      </div>

      {/* AI Physique Feedback (Adapts to Beginner, Intermediate, Pro) */}
      <AiPhysiqueFeedback
        experienceLevel={userProfile.experienceLevel || 'intermediate'}
        latestCheckIn={latestCheckIn}
        targetWeightKg={targetWeight}
        onExperienceLevelChange={handleExperienceLevelChange}
      />

      {/* Weight Corridor Graph Visualizer */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">7-Day Weight Fluctuation Corridor</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Target: {targetWeight} kg (Optimal Corridor: {(targetWeight - 0.5).toFixed(1)} kg - {(targetWeight + 0.5).toFixed(1)} kg)
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-500/30 self-start sm:self-auto">
            Status: {isEquilibrium ? 'Equilibrium Preserved' : 'Corridor Tracking'}
          </span>
        </div>

        {/* Bar/Point Visualizer */}
        {corridorData.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
            <TrendingUp className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2" />
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">No Weight History Recorded Yet</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              Log your morning check-ins with your scale weight to start visualizing your daily equilibrium corridor.
            </p>
          </div>
        ) : (
          <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2 border-b border-slate-200 dark:border-slate-800">
            {corridorData.map((item, idx) => {
              const diff = item.weight - targetWeight;
              const heightPercent = 50 + diff * 40;
              const isToday = idx === corridorData.length - 1;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                  <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300 font-semibold">{item.weight} kg</span>
                  <div
                    className={`w-full max-w-[42px] rounded-t-xl transition-all ${
                      isToday
                        ? 'bg-gradient-to-t from-brand-600 via-brand-500 to-teal-400 shadow-glow'
                        : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700'
                    }`}
                    style={{ height: `${Math.min(95, Math.max(20, heightPercent))}%` }}
                  />
                  <span className={`text-[10px] font-medium ${isToday ? 'text-brand-600 dark:text-brand-300 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                    {item.date}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transformation Gallery Component (Timeline & Before/After Comparison) */}
      <TransformationGallery
        checkIns={checkIns}
        onOpenCheckInModal={() => setShowCheckInModal(true)}
        targetWeightKg={targetWeight}
      />

      {/* Strength Benchmark Retention */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Key Strength Anchors</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Maintaining strength on baseline compound lifts guarantees zero lean muscle atrophy during maintenance.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[
            { lift: 'Incline Bench Press', weight: '85 kg × 6 reps', status: 'Maintained' },
            { lift: 'Weighted Pull-Ups', weight: '+15 kg × 8 reps', status: 'Maintained' },
            { lift: 'Barbell Back Squat', weight: '125 kg × 5 reps', status: 'Maintained' },
            { lift: 'Romanian Deadlift', weight: '130 kg × 8 reps', status: 'Maintained' },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{item.lift}</span>
                <div className="text-base font-bold text-slate-900 dark:text-white font-mono mt-1">{item.weight}</div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-brand-600 dark:text-brand-400 text-xs font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Check-In Modal with Ghost Camera */}
      <DailyCheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        onCheckInCompleted={loadCheckIns}
      />
    </div>
  );
};
