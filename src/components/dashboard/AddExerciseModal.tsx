import React, { useState } from 'react';
import { EXERCISE_DATABASE, isExerciseAvailable } from '../../services/aiWorkoutCoach';
import type { WorkoutExerciseItem } from '../../types/workout';
import {
  X,
  Plus,
  Search,
} from 'lucide-react';

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEquipment: string[];
  onAddExercise: (exercise: WorkoutExerciseItem) => void;
}

export const AddExerciseModal: React.FC<AddExerciseModalProps> = ({
  isOpen,
  onClose,
  userEquipment,
  onAddExercise,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'Push' | 'Pull' | 'Legs' | 'Core'>('all');
  const [customMode, setCustomMode] = useState(false);

  // Custom exercise state
  const [customName, setCustomName] = useState('');
  const [customMuscle, setCustomMuscle] = useState('');
  const [customSets, setCustomSets] = useState(3);
  const [customReps, setCustomReps] = useState('8-10');
  const [customWeight, setCustomWeight] = useState('20 kg');
  const [showAllEquipment, setShowAllEquipment] = useState(false);

  if (!isOpen) return null;

  // Filter exercises strictly matching user's equipment or all
  const matchingExercises = EXERCISE_DATABASE.filter((ex) => {
    if (!showAllEquipment) {
      const isAvail = isExerciseAvailable(ex, userEquipment);
      if (!isAvail) return false;
    }

    if (selectedCategory !== 'all' && ex.category !== selectedCategory) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ex.name.toLowerCase().includes(q) ||
        ex.targetMuscle.toLowerCase().includes(q) ||
        ex.equipmentLabel.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const handleSelectPredefined = (def: (typeof EXERCISE_DATABASE)[0]) => {
    const defaultWeight = def.isBodyweight ? 'Bodyweight' : '24 kg';
    const newEx: WorkoutExerciseItem = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: def.name,
      targetMuscle: def.targetMuscle,
      category: def.category,
      equipmentRequired: def.equipmentRequired,
      equipmentLabel: def.equipmentLabel,
      sets: def.defaultSets,
      reps: def.defaultReps,
      weight: defaultWeight,
      completedSets: 0,
      completed: false,
      notes: def.formCue,
      setList: Array.from({ length: def.defaultSets }, (_, i) => ({
        id: `set_${Date.now()}_${i + 1}`,
        setNumber: i + 1,
        type: 'normal',
        weight: defaultWeight,
        reps: def.defaultReps,
        completed: false,
        previous: '—',
      })),
    };
    onAddExercise(newEx);
    onClose();
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const chosenWeight = customWeight.trim() || 'Bodyweight';
    const chosenReps = customReps.trim() || '10';

    const newEx: WorkoutExerciseItem = {
      id: `ex_custom_${Date.now()}`,
      name: customName.trim(),
      targetMuscle: customMuscle.trim() || 'Full Body',
      category: selectedCategory === 'all' ? 'Push' : selectedCategory,
      equipmentRequired: ['bodyweight_only'],
      equipmentLabel: 'User Custom Gear',
      sets: customSets,
      reps: chosenReps,
      weight: chosenWeight,
      completedSets: 0,
      completed: false,
      notes: 'User custom movement logged into today’s protocol.',
      setList: Array.from({ length: customSets }, (_, i) => ({
        id: `set_custom_${Date.now()}_${i + 1}`,
        setNumber: i + 1,
        type: 'normal',
        weight: chosenWeight,
        reps: chosenReps,
        completed: false,
        previous: '—',
      })),
    };

    onAddExercise(newEx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="glass-card w-full max-w-2xl max-h-[85vh] rounded-3xl border border-slate-800 p-6 flex flex-col shadow-2xl bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Add Exercise to Today's Session</h3>
              <p className="text-xs text-slate-400">
                Filtered strictly by your active gym equipment profile.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex gap-2 pt-4">
          <button
            onClick={() => setCustomMode(false)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              !customMode
                ? 'bg-brand-500 text-slate-950 shadow-glow'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            Equipment Catalog ({matchingExercises.length} matches)
          </button>
          <button
            onClick={() => setCustomMode(true)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              customMode
                ? 'bg-brand-500 text-slate-950 shadow-glow'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            Create Custom Exercise
          </button>
        </div>

        {!customMode ? (
          <>
            {/* Search & Category Filter */}
            <div className="py-3 space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search available exercises by name, muscle, or gear..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {(['all', 'Push', 'Pull', 'Legs', 'Core'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                        selectedCategory === cat
                          ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                          : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat === 'all' ? 'All Movements' : cat}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllEquipment(!showAllEquipment)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all border ${
                    showAllEquipment
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {showAllEquipment ? 'Showing All Gear' : 'My Gear Only'}
                </button>
              </div>
            </div>

            {/* List of matching exercises */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {matchingExercises.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No matching exercises found for your active equipment inventory. Switch category or add a custom movement!
                </div>
              ) : (
                matchingExercises.map((ex) => (
                  <div
                    key={ex.id}
                    className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-brand-500/40 hover:bg-slate-900 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-brand-300 transition-colors">
                        {ex.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                        <span className="text-brand-400">{ex.targetMuscle}</span>
                        <span>•</span>
                        <span className="text-teal-300">{ex.equipmentLabel}</span>
                        <span>•</span>
                        <span>{ex.defaultSets} sets × {ex.defaultReps}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelectPredefined(ex)}
                      className="px-3 py-1.5 rounded-xl bg-brand-500/15 hover:bg-brand-500 text-brand-300 hover:text-slate-950 text-xs font-bold border border-brand-500/30 transition-all flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* Custom Exercise Form */
          <form onSubmit={handleAddCustom} className="py-4 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Exercise Name *
              </label>
              <input
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Incline DB Flyes, Nordic Curls"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Muscle
                </label>
                <input
                  type="text"
                  value={customMuscle}
                  onChange={(e) => setCustomMuscle(e.target.value)}
                  placeholder="e.g. Upper Chest, Lats"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Movement Category
                </label>
                <select
                  value={selectedCategory === 'all' ? 'Push' : selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="Push">Push (Chest/Shoulders/Triceps)</option>
                  <option value="Pull">Pull (Back/Biceps)</option>
                  <option value="Legs">Legs (Quads/Hamstrings/Glutes)</option>
                  <option value="Core">Core / Stability</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sets
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={customSets}
                  onChange={(e) => setCustomSets(parseInt(e.target.value) || 3)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reps
                </label>
                <input
                  type="text"
                  value={customReps}
                  onChange={(e) => setCustomReps(e.target.value)}
                  placeholder="8-10"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Weight
                </label>
                <input
                  type="text"
                  value={customWeight}
                  onChange={(e) => setCustomWeight(e.target.value)}
                  placeholder="24 kg"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-teal-500 text-slate-950 font-bold text-xs shadow-glow"
              >
                Add Custom Exercise
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
