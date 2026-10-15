import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  Activity,
  Dumbbell,
  Target,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900/40 via-slate-900 to-slate-900 border border-emerald-500/20 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Body Maintenance Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {currentUser?.displayName?.split(' ')[0] || 'Athlete'}
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Your maintenance baseline is dynamically tuned based on your weekly active burn and metabolic rate.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/nutrition')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
            >
              <span>Recalculate Calories</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Maintenance Calories */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Daily Maintenance</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white">2,450</span>
              <span className="text-xs text-slate-400 font-semibold">kcal/day</span>
            </div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <TrendingUp className="w-3 h-3" /> ±35 kcal variance
            </span>
          </div>
        </div>

        {/* Metric 2: Protein Target */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Protein Target</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white">165</span>
              <span className="text-xs text-slate-400 font-semibold">grams</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              2.0g per kg bodyweight
            </span>
          </div>
        </div>

        {/* Metric 3: Weekly Workouts */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Workouts This Week</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white">4</span>
              <span className="text-xs text-slate-400 font-semibold">/ 5 sessions</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full w-4/5" />
            </div>
          </div>
        </div>

        {/* Metric 4: Recovery Score */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Recovery Score</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white">92%</span>
              <span className="text-xs text-emerald-400 font-semibold">Optimal</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Ready for hypertrophy load
            </span>
          </div>
        </div>
      </div>

      {/* Split Dashboard View: Macro Split & Today's Workout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Today's Schedule & Workout */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Today's Program: Upper Body Power</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Estimated time: 55 mins • 4 exercises</p>
              </div>
              <button
                onClick={() => navigate('/workouts')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
              >
                <span>View Logger</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {[
                { name: 'Barbell Incline Bench Press', sets: '4 sets × 6-8 reps', load: '85 kg', done: true },
                { name: 'Weighted Pull-Ups', sets: '3 sets × 6 reps', load: '+15 kg', done: true },
                { name: 'Seated Cable Row', sets: '3 sets × 10 reps', load: '75 kg', done: false },
                { name: 'Overhead Dumbbell Press', sets: '3 sets × 10-12 reps', load: '26 kg/hand', done: false },
              ].map((exercise, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700/80 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        exercise.done ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-600'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-200">{exercise.name}</p>
                      <p className="text-[11px] text-slate-400">{exercise.sets}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      {exercise.load}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Coach Insight Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center flex-shrink-0 text-slate-950 shadow-md shadow-emerald-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">FitMaintenance AI Recommendation</h4>
                  <span className="text-[10px] text-slate-400">10m ago</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Based on your higher step count yesterday (+3,200 steps), your expenditure increased by approximately
                  130 kcal. You can either consume an additional 30g complex carbohydrates post-workout or maintain a
                  mild deficit for body recomposition.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => navigate('/ai-coach')}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition"
                  >
                    Discuss with AI Coach
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Macro Distribution & Target Meter */}
        <div className="space-y-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80">
            <h3 className="text-base font-bold text-white mb-4">Target Macronutrients</h3>

            {/* Macro Bars */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Protein (30%)</span>
                  <span className="text-rose-400">165g / 180g</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: '91%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Carbohydrates (45%)</span>
                  <span className="text-amber-400">220g / 275g</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: '80%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Fats (25%)</span>
                  <span className="text-teal-400">62g / 68g</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div className="bg-teal-400 h-full rounded-full" style={{ width: '91%' }} />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Next Log: Dinner
              </span>
              <button
                onClick={() => navigate('/nutrition')}
                className="text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                Adjust Plan
              </button>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Navigation</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => navigate('/workouts')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-left border border-slate-800/80 transition"
              >
                <Dumbbell className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="font-semibold block text-slate-200">Log Sets</span>
                <span className="text-[10px] text-slate-400">Reps & Weight</span>
              </button>
              <button
                onClick={() => navigate('/ai-coach')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-left border border-slate-800/80 transition"
              >
                <Sparkles className="w-4 h-4 text-teal-400 mb-1" />
                <span className="font-semibold block text-slate-200">AI Prompt</span>
                <span className="text-[10px] text-slate-400">Form & Diet</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

