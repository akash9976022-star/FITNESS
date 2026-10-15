import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  MapPin,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import type { CustomFestival, CustomFestivalCategory } from '../../types/calendar';

interface CustomFestivalManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customFestivals: CustomFestival[];
  onAddFestival: (festival: Omit<CustomFestival, 'id'>) => Promise<CustomFestival | void>;
  onDeleteFestival: (id: string) => Promise<void>;
}

interface FestivalTemplate {
  name: string;
  nameTa: string;
  category: CustomFestivalCategory;
  dietaryPreference: 'vegetarian' | 'fruit_milk' | 'water_fast' | 'feast' | 'standard';
  notes: string;
}

const PRESET_TEMPLATES: FestivalTemplate[] = [
  {
    name: 'Skanda Sashti Viratham',
    nameTa: 'கந்த சஷ்டி விரதம்',
    category: 'custom_fast',
    dietaryPreference: 'fruit_milk',
    notes: 'Lord Murugan sacred fast. Warm milk, tender coconut water, and fresh seasonal fruits.',
  },
  {
    name: 'Soorasamharam (Murugan Peak Fast)',
    nameTa: 'சூரசம்ஹாரம் மகா விரதம்',
    category: 'custom_fast',
    dietaryPreference: 'water_fast',
    notes: 'Strict fasting until evening sunset pooja celebrating Lord Murugan victory.',
  },
  {
    name: 'Purattasi Saturday Fast',
    nameTa: 'புரட்டாசி சனிக்கிழமை விரதம்',
    category: 'custom_fast',
    dietaryPreference: 'vegetarian',
    notes: 'Strict sattvic vegetarian diet without onion/garlic dedicated to Lord Venkateswara.',
  },
  {
    name: 'Ekadashi Fast',
    nameTa: 'ஏகாதசி விரதம்',
    category: 'custom_fast',
    dietaryPreference: 'water_fast',
    notes: 'Grain-free, rice-free fasting for cellular autophagy and spiritual mindfulness.',
  },
  {
    name: 'Amavasai Fast (Pitru Tarpanam)',
    nameTa: 'அமாவாசை விரதம் (பித்ரு தர்ப்பணம்)',
    category: 'custom_fast',
    dietaryPreference: 'vegetarian',
    notes: 'Single sattvic meal with raw banana and sesame rice after ancestral prayers.',
  },
  {
    name: 'Thai Pongal Harvest Feast',
    nameTa: 'தைப்பொங்கல் தமிழர் திருநாள்',
    category: 'community',
    dietaryPreference: 'feast',
    notes: 'Thanksgiving to Surya Bhagavan and nature. Traditional sweet and ven pongal feast.',
  },
  {
    name: 'Kula Deivam / Village Temple Thiruvizha',
    nameTa: 'குலதெய்வ வழிபாடு / கோவில் திருவிழா',
    category: 'temple_festival',
    dietaryPreference: 'vegetarian',
    notes: 'Ancestral family temple worship, padayatra, and community prayer.',
  },
];

export const CustomFestivalManagerModal: React.FC<CustomFestivalManagerModalProps> = ({
  isOpen,
  onClose,
  customFestivals,
  onAddFestival,
  onDeleteFestival,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [titleTa, setTitleTa] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<CustomFestivalCategory>('temple_festival');
  const [dietaryPreference, setDietaryPreference] = useState<
    'vegetarian' | 'fruit_milk' | 'water_fast' | 'feast' | 'standard'
  >('vegetarian');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyTemplate = (tpl: FestivalTemplate) => {
    setTitle(tpl.name);
    setTitleTa(tpl.nameTa);
    setCategory(tpl.category);
    setDietaryPreference(tpl.dietaryPreference);
    setNotes(tpl.notes);
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      await onAddFestival({
        title: title.trim(),
        titleTa: titleTa.trim() || undefined,
        date,
        category,
        dietaryPreference,
        notes: notes.trim() || undefined,
      });

      setStatusMessage('Custom festival added and synced to Cloud Firestore!');
      setTitle('');
      setTitleTa('');
      setNotes('');
      setShowAddForm(false);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('Error saving custom festival:', err);
      setStatusMessage('Failed to save festival. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (cat: CustomFestivalCategory) => {
    switch (cat) {
      case 'temple_festival':
        return 'Temple Festival / திருவிழா';
      case 'family_pooja':
        return 'Family / Kula Deivam Pooja';
      case 'custom_fast':
        return 'Custom Fast / Viratham';
      case 'community':
        return 'Community Celebration';
      case 'milestone':
        return 'Personal Milestone';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 text-slate-900 dark:text-slate-100 transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-500" />
              Manage Local Festivals & Fasting Days
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add your village temple thiruvizhas, Kula Deivam poojas, or personal fasting dates to your calendar.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status message */}
        {statusMessage && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Quick-Add Preset Templates */}
        <div className="mt-5 p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Quick-Add Common Tamil Observance Templates:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800/60 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-300 transition-all active:scale-95 flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3 h-3 text-purple-500 shrink-0" />
                <span>{tpl.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-5 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Your Local Events ({customFestivals.length})
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Cancel Form' : 'Add Custom Event'}</span>
          </button>
        </div>

        {/* Add Event Form Collapsible */}
        {showAddForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-purple-500/30 space-y-4 animate-fadeIn shadow-sm"
          >
            <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create New Local Festival / Fasting Event</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Event Title (English) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mariamman Temple Thiruvizha"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tamil Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="எ.கா. மாரியம்மன் கோவில் திருவிழா"
                  value={titleTa}
                  onChange={(e) => setTitleTa(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Event Date *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Event Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CustomFestivalCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="temple_festival">Temple Festival / திருவிழா</option>
                  <option value="family_pooja">Family / Kula Deivam Pooja</option>
                  <option value="custom_fast">Custom Fast / Viratham</option>
                  <option value="community">Community Celebration</option>
                  <option value="milestone">Personal Milestone</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dietary / Fasting Protocol
                </label>
                <select
                  value={dietaryPreference}
                  onChange={(e) =>
                    setDietaryPreference(e.target.value as any)
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="vegetarian">Pure Sattvic Vegetarian (No onion/garlic)</option>
                  <option value="fruit_milk">Phalahara (Fruits & Milk Fast)</option>
                  <option value="water_fast">Strict Water / Nirjala Fast</option>
                  <option value="feast">Feast Day / Calorie Surplus</option>
                  <option value="standard">Standard Daily Maintenance</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Observance Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Temple padayatra in morning, lighting maavilakku, light evening sundal..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Saving to Cloud...' : 'Save Custom Event'}
              </button>
            </div>
          </form>
        )}

        {/* Existing Custom Festivals List */}
        <div className="mt-4 space-y-2.5">
          {customFestivals.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800">
              <Calendar className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                No custom festivals added yet
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Add your village temple festivals, special fasts, or family celebrations to display them seamlessly on the bilingual calendar!
              </p>
            </div>
          ) : (
            customFestivals.map((fest) => (
              <div
                key={fest.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-sm hover:border-purple-500/40 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {fest.title}
                    </span>
                    {fest.titleTa && (
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                        ({fest.titleTa})
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                      {getCategoryLabel(fest.category)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span className="flex items-center gap-1 font-mono font-medium">
                      <Calendar className="w-3 h-3 text-purple-500" />
                      {fest.date}
                    </span>
                    <span className="capitalize text-slate-600 dark:text-slate-300">
                      • {fest.dietaryPreference.replace('_', ' ')}
                    </span>
                  </div>

                  {fest.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {fest.notes}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => onDeleteFestival(fest.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0"
                  title="Delete Custom Festival"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
