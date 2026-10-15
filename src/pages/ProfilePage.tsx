import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { calculateMifflinStJeor } from '../utils/calculator';
import { EQUIPMENT_CATALOG } from '../data/equipmentCatalog';
import type { Gender, ActivityLevel } from '../types/auth';
import {
  User,
  Key,
  LogOut,
  Save,
  Sparkles,
  Calculator,
  Check,
  RotateCcw,
} from 'lucide-react';
import { FirebaseConfigModal } from '../components/common/FirebaseConfigModal';

export const ProfilePage: React.FC = () => {
  const { user, logout, userProfile, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const [age, setAge] = useState(userProfile.age);
  const [gender, setGender] = useState<Gender>(userProfile.gender || 'male');
  const [weight, setWeight] = useState(userProfile.weightKg);
  const [targetWeight, setTargetWeight] = useState(userProfile.targetMaintenanceWeightKg || userProfile.weightKg);
  const [height, setHeight] = useState(userProfile.heightCm);
  const [activity, setActivity] = useState<ActivityLevel>(userProfile.activityLevel);
  const [goal, setGoal] = useState(userProfile.maintenanceGoal);
  const [equipment, setEquipment] = useState<string[]>(userProfile.equipment || []);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const toggleEquipment = (id: string) => {
    setEquipment((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const calculated = calculateMifflinStJeor({
      age,
      gender,
      weightKg: weight,
      heightCm: height,
      activityLevel: activity,
    });

    await updateUserProfile({
      age,
      gender,
      weightKg: weight,
      targetMaintenanceWeightKg: targetWeight,
      heightCm: height,
      activityLevel: activity,
      maintenanceGoal: goal,
      equipment,
      targetCalories: calculated.tdee,
      targetProtein: calculated.targetProtein,
      targetCarbs: calculated.targetCarbs,
      targetFats: calculated.targetFats,
      waterGoalMl: calculated.waterGoalMl,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleRestartOnboarding = async () => {
    await updateUserProfile({ onboardingCompleted: false });
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-brand-400" />
          Athlete Profile & Machine Inventory
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your metabolic parameters, granular gym machines, and Cloud Firestore sync.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Avatar'}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-500/50 shadow-glow"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-500 flex items-center justify-center text-slate-950 font-extrabold text-2xl shadow-glow">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
                </div>
              )}
              {user?.isDemo && (
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black border border-slate-950">
                  DEMO
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{user?.displayName || 'Active Athlete'}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/30">
                  Cloud Firestore Synced
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">{user?.email}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                UID: <span className="text-slate-300 font-mono text-[10px]">{user?.uid}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRestartOnboarding}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5"
              title="Re-run the initial questionnaire"
            >
              <RotateCcw className="w-3.5 h-3.5 text-brand-400" />
              <span>Re-run Onboarding</span>
            </button>
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5 text-brand-400" />
              <span>Firebase Keys</span>
            </button>
            <button
              onClick={handleSignOut}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metabolic Calibration & Equipment Form */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Mifflin-St Jeor TDEE & Equipment Calibration</h2>
              <p className="text-xs text-slate-400">Calculates maintenance targets and syncs to Cloud Firestore</p>
            </div>
          </div>

          {savedSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/40 text-brand-300 text-xs font-semibold animate-fadeIn">
              <Check className="w-3.5 h-3.5" />
              <span>Synced to Cloud Firestore!</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Row 1: Gender, Age, Height */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Gender</label>
              <select
                value={gender}
                onChange={(e: any) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="male">Male (+5 BMR)</option>
                <option value="female">Female (-161 BMR)</option>
                <option value="other">Other / Non-Binary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Age (Years)</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value, 10) || 25)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value, 10) || 175)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 2: Weights, Activity & Goal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Current Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 70)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Target Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={targetWeight}
                onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 70)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Activity Factor</label>
              <select
                value={activity}
                onChange={(e: any) => setActivity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="sedentary">Sedentary (1.2x)</option>
                <option value="light">Light Activity (1.375x)</option>
                <option value="moderate">Moderate Activity (1.55x)</option>
                <option value="very_active">Very Active (1.725x)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Maintenance Goal</label>
              <select
                value={goal}
                onChange={(e: any) => setGoal(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="maintenance">Active Maintenance</option>
                <option value="recomp">Body Recomposition</option>
                <option value="lean_bulk">Deload / Priming</option>
              </select>
            </div>
          </div>

          {/* Row 3: Granular Equipment & Machine Inventory */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-xs font-semibold text-slate-200">
                  Granular Equipment & Machine Inventory
                </label>
                <p className="text-[11px] text-slate-400">
                  Select all specific machines and free weights available in your training space.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-xl border border-brand-500/20">
                {equipment.length} Items Selected
              </span>
            </div>

            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {EQUIPMENT_CATALOG.map((cat) => (
                <div key={cat.category} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs font-bold text-white mb-2 flex items-center justify-between">
                    <span>{cat.category}</span>
                    <span className="text-[10px] text-brand-400 font-mono">
                      {cat.items.filter((i) => equipment.includes(i.id)).length} / {cat.items.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cat.items.map((item) => {
                      const isSelected = equipment.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleEquipment(item.id)}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-brand-950/40 border-brand-500/50 text-white shadow-sm'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-xs font-semibold truncate">{item.name}</div>
                            <div className="text-[10px] text-slate-500">{item.badge}</div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-brand-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Computed Target Preview */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-xs font-bold text-brand-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Computed Maintenance Blueprint (Mifflin-St Jeor)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Maintenance TDEE</span>
                <div className="text-base font-bold font-mono text-white mt-0.5">
                  {userProfile.targetCalories} kcal
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Protein Target</span>
                <div className="text-base font-bold font-mono text-brand-400 mt-0.5">
                  {userProfile.targetProtein} g
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Carb Target</span>
                <div className="text-base font-bold font-mono text-sky-400 mt-0.5">
                  {userProfile.targetCarbs} g
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Fat Target</span>
                <div className="text-base font-bold font-mono text-teal-400 mt-0.5">
                  {userProfile.targetFats} g
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-teal-500 hover:from-brand-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-glow flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save & Sync to Cloud Firestore</span>
            </button>
          </div>
        </form>
      </div>

      {/* Firebase Modal */}
      <FirebaseConfigModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} />
    </div>
  );
};
