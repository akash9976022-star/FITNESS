import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Dumbbell,
  Search,
  Sparkles,
  Wrench,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import {
  type CustomExercise,
  addCustomExercise,
  deleteCustomExercise,
} from '../../services/firestoreService';

interface CustomExerciseLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  customExercises: CustomExercise[];
  onSelectExercise?: (exercise: CustomExercise) => void;
  showToast?: (message: string) => void;
}

const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Biceps',
  'Triceps',
  'Core',
  'Calves',
  'Full Body',
];

const SPLIT_CATEGORIES: { id: CustomExercise['splitCategory']; label: string }[] = [
  { id: 'push', label: 'Push' },
  { id: 'pull', label: 'Pull' },
  { id: 'legs', label: 'Legs' },
  { id: 'upper', label: 'Upper Body' },
  { id: 'lower', label: 'Lower Body' },
  { id: 'full_body', label: 'Full Body' },
  { id: 'arms', label: 'Arms' },
  { id: 'core', label: 'Core' },
];

const EQUIPMENT_OPTIONS = [
  'Dumbbells',
  'Barbell',
  'Cables & Pulleys',
  'Machine',
  'Bodyweight',
  'Resistance Bands',
  'Smith Machine',
  'Kettlebell',
];

export const CustomExerciseLibraryModal: React.FC<CustomExerciseLibraryModalProps> = ({
  isOpen,
  onClose,
  userId,
  customExercises,
  onSelectExercise,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState('All');
  const [isCreating, setIsCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New Exercise Form States
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState(MUSCLE_GROUPS[0]);
  const [splitCategory, setSplitCategory] = useState<CustomExercise['splitCategory']>('push');
  const [requiredEquipment, setRequiredEquipment] = useState(EQUIPMENT_OPTIONS[0]);
  const [defaultWeightKg, setDefaultWeightKg] = useState('20');
  const [defaultReps, setDefaultReps] = useState('10');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !userId) return;

    try {
      setSubmitting(true);
      await addCustomExercise(userId, {
        name: name.trim(),
        muscle,
        splitCategory,
        requiredEquipment,
        defaultWeightKg: Number(defaultWeightKg) || 0,
        defaultReps: Number(defaultReps) || 10,
        notes: notes.trim(),
      });

      setName('');
      setNotes('');
      setIsCreating(false);
      showToast?.(`Custom movement "${name.trim()}" created & synced!`);
    } catch (err) {
      console.error('Failed to create custom exercise:', err);
      showToast?.('Error creating custom movement. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, ex: CustomExercise) => {
    e.stopPropagation();
    if (!userId) return;

    const confirmed = window.confirm(
      `Permanently delete "${ex.name}" from your custom exercise library? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(ex.id);
      await deleteCustomExercise(userId, ex.id);
      showToast?.(`Deleted "${ex.name}" from your custom exercise library.`);
    } catch (err) {
      console.error('Failed to delete exercise:', err);
      showToast?.('Error deleting custom exercise.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredExercises = customExercises.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.muscle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.requiredEquipment && ex.requiredEquipment.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMuscle =
      selectedMuscleFilter === 'All' || ex.muscle.toLowerCase() === selectedMuscleFilter.toLowerCase();

    return matchesSearch && matchesMuscle;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0 bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner border border-emerald-500/30">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Custom Movement Library</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                  {customExercises.length} Movements
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalized movements with permanent deletion & real-time sync.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Movement</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Create Movement Form Drawer */}
        {isCreating && (
          <form
            onSubmit={handleCreate}
            className="p-4 sm:p-5 border-b border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3.5 flex-shrink-0 animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Create Custom Movement
              </h4>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Movement Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Incline Cable Chest Press"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Muscle Target
                </label>
                <select
                  value={muscle}
                  onChange={(e) => setMuscle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  {MUSCLE_GROUPS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Split Category
                </label>
                <select
                  value={splitCategory}
                  onChange={(e) => setSplitCategory(e.target.value as CustomExercise['splitCategory'])}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold capitalize"
                >
                  {SPLIT_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Equipment Needed
                </label>
                <select
                  value={requiredEquipment}
                  onChange={(e) => setRequiredEquipment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  {EQUIPMENT_OPTIONS.map((eq) => (
                    <option key={eq} value={eq}>
                      {eq}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Default Weight (kg)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={defaultWeightKg}
                  onChange={(e) => setDefaultWeightKg(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Default Target Reps
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={defaultReps}
                  onChange={(e) => setDefaultReps(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Save to Library</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Filter & Search Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col sm:flex-row gap-2.5 flex-shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search custom movements, muscles, equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'].map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMuscleFilter(m)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedMuscleFilter === m
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Exercises List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredExercises.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Dumbbell className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {customExercises.length === 0
                  ? 'No custom movements created yet'
                  : 'No movements match your search'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {customExercises.length === 0
                  ? 'Tap "New Movement" above to create custom movements for cables, dumbbells, and specialty variations.'
                  : 'Try adjusting your search query or muscle filter.'}
              </p>
              {customExercises.length === 0 && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Custom Movement</span>
                </button>
              )}
            </div>
          ) : (
            filteredExercises.map((ex) => (
              <div
                key={ex.id}
                onClick={() => onSelectExercise && onSelectExercise(ex)}
                className={`pt-2.5 first:pt-0 flex items-center justify-between gap-3 group rounded-xl p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition ${
                  onSelectExercise ? 'cursor-pointer hover:border-emerald-500/40' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {ex.name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                      {ex.muscle}
                    </span>
                    {ex.splitCategory && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                        {ex.splitCategory}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {ex.requiredEquipment && (
                      <span className="flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-slate-400" />
                        <span>{ex.requiredEquipment}</span>
                      </span>
                    )}
                    <span>•</span>
                    <span>
                      Default: <strong className="text-slate-700 dark:text-slate-200">{ex.defaultWeightKg} kg</strong> ×{' '}
                      <strong className="text-slate-700 dark:text-slate-200">{ex.defaultReps} reps</strong>
                    </span>
                  </div>

                  {ex.notes && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-0.5 truncate">
                      "{ex.notes}"
                    </p>
                  )}
                </div>

                {/* Actions: Add to session + Delete (Trash icon) */}
                <div className="flex items-center gap-1.5">
                  {onSelectExercise && (
                    <button
                      type="button"
                      onClick={() => onSelectExercise(ex)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 border border-emerald-500/30 transition"
                      title="Add to active session"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Add</span>
                    </button>
                  )}

                  {/* Permanent Trash Delete Button */}
                  <button
                    type="button"
                    disabled={deletingId === ex.id}
                    onClick={(e) => handleDelete(e, ex)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 transition"
                    title={`Delete "${ex.name}" permanently`}
                    aria-label={`Delete ${ex.name}`}
                  >
                    {deletingId === ex.id ? (
                      <Loader2 className="w-4 h-4 text-rose-500 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
          <span>
            {filteredExercises.length} of {customExercises.length} movements shown
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomExerciseLibraryModal;
