import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Plus,
} from 'lucide-react';
import { addCustomFestival } from '../../services/firestoreService';

interface CustomFestivalModalProps {
  userId: string;
  initialDate?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CustomFestivalModal: React.FC<CustomFestivalModalProps> = ({
  userId,
  initialDate = new Date().toISOString().split('T')[0],
  onClose,
  onSuccess,
}) => {
  const [nameEnglish, setNameEnglish] = useState('');
  const [nameTamil, setNameTamil] = useState('');
  const [date, setDate] = useState(initialDate);
  const [category, setCategory] = useState<
    'Temple Festival' | 'Fasting / Viratham' | 'Personal Milestone' | 'Pooja'
  >('Fasting / Viratham');
  const [deity, setDeity] = useState('');
  const [templeLocation, setTempleLocation] = useState('');
  const [fastingNotes, setFastingNotes] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEnglish.trim()) {
      setErrorMessage('Please enter festival or viratham name.');
      return;
    }
    if (!date) {
      setErrorMessage('Please select a valid date.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await addCustomFestival(userId, {
        nameEnglish: nameEnglish.trim(),
        nameTamil: nameTamil.trim() || undefined,
        date,
        category,
        deity: deity.trim() || undefined,
        templeLocation: templeLocation.trim() || undefined,
        fastingNotes: fastingNotes.trim() || undefined,
        reminderEnabled,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to add custom festival:', err);
      setErrorMessage('Failed to save to Firestore. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 my-8 text-xs">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Add Custom Festival or Viratham</span>
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              Log regional temple festivals and personal fasting days synced to Firestore
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 font-semibold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Festival Name (English & Tamil) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Festival Name (English) *
              </label>
              <input
                type="text"
                placeholder="e.g., Purattasi Saturday Fasting"
                value={nameEnglish}
                onChange={(e) => setNameEnglish(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                பெயர் (Tamil Name - Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., புரட்டாசி சனிக்கிழமை விரதம்"
                value={nameTamil}
                onChange={(e) => setNameTamil(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Date & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white"
              >
                <option value="Fasting / Viratham">Fasting / Viratham (விரதம்)</option>
                <option value="Temple Festival">Temple Festival (கோவில் திருவிழா)</option>
                <option value="Pooja">Pooja (சிறப்பு பூஜை)</option>
                <option value="Personal Milestone">Personal Milestone (மங்கள நாள்)</option>
              </select>
            </div>
          </div>

          {/* Deity & Temple Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Deity (இறைவன் / இறைவி)
              </label>
              <input
                type="text"
                placeholder="e.g., Murugan, Venkateshwara, Mariamman"
                value={deity}
                onChange={(e) => setDeity(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Temple Location / Gramam
              </label>
              <input
                type="text"
                placeholder="e.g., Palani, Samayapuram, Kuladeivam temple"
                value={templeLocation}
                onChange={(e) => setTempleLocation(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Fasting & Nutrition Protocol Notes */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Fasting Protocol & Diet Notes (விரத உணவு வழிகாட்டுதல்)
            </label>
            <textarea
              rows={3}
              placeholder="e.g., Strict water fast until sunset; Single satvik meal with millets; Avoid salt and oils; Rest day from heavy lifting."
              value={fastingNotes}
              onChange={(e) => setFastingNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Notification / Reminder Toggle */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={(e) => setReminderEnabled(e.target.checked)}
              className="rounded text-amber-600 accent-amber-500 w-4 h-4 cursor-pointer"
            />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                Flag on Master Calendar & Dashboard
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Highlights this day on your bilingual calendar grid with a golden festival indicator.
              </span>
            </div>
          </label>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-950 font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving to Firestore...' : 'Save to My Festivals'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomFestivalModal;

