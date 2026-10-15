import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Flame,
  Sparkles,
  Zap,
  Info,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  INDIAN_FOOD_DATABASE,
  type IndianFoodItem,
} from '../../data/indianFoodDatabase';

interface IndianFoodSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFood: (item: IndianFoodItem, multiplier: number) => void;
  initialQuery?: string;
  title?: string;
  subtitle?: string;
}

export const IndianFoodSearchModal: React.FC<IndianFoodSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectFood,
  initialQuery = '',
  title = 'Indian Foods & Fitness Staples Database',
  subtitle = 'Verified macros based on ICMR/NIN standards for authentic home, street, and restaurant preparations',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1);
  const [highProteinOnly, setHighProteinOnly] = useState<boolean>(false);

  // Quick staple chips
  const quickChips = [
    { label: 'Boiled Chana', query: 'chana' },
    { label: 'Green Gram / Moong', query: 'moong' },
    { label: 'Peanuts', query: 'peanut' },
    { label: 'Paneer', query: 'paneer' },
    { label: 'Curd / Dahi', query: 'curd' },
    { label: 'Roti / Phulka', query: 'roti' },
    { label: 'Idli / Dosa', query: 'dosa' },
    { label: 'Dal Tadka', query: 'dal' },
    { label: 'Egg Bhurji', query: 'egg' },
    { label: 'Chicken Biryani', query: 'biryani' },
  ];

  // Filter food items
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return INDIAN_FOOD_DATABASE.filter((item) => {
      // High protein filter
      if (highProteinOnly && !item.is_high_protein) return false;

      // Region filter
      if (selectedRegion !== 'All' && item.region !== selectedRegion) return false;

      // Query filter
      if (!q) return true;

      const inName = item.name.toLowerCase().includes(q);
      const inHindi = item.hindi_name ? item.hindi_name.toLowerCase().includes(q) : false;
      const inTamil = item.tamil_name ? item.tamil_name.toLowerCase().includes(q) : false;
      const inTags = item.tags.some((t) => t.toLowerCase().includes(q));
      const inComponents = item.components.some((c) => c.toLowerCase().includes(q));

      return inName || inHindi || inTamil || inTags || inComponents;
    });
  }, [searchQuery, selectedRegion, highProteinOnly]);

  if (!isOpen) return null;

  const handleItemClick = (item: IndianFoodItem) => {
    onSelectFood(item, portionMultiplier);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-white/95 dark:bg-slate-900/90 z-20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-brand-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {title}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-500/30">
                  Desi Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md line-clamp-1">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/80 dark:bg-slate-950/60">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Indian dishes (e.g. Dosa, Boiled Chana, Roti, Paneer, Sundal)..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {quickChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => setSearchQuery(chip.query)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap border transition-all ${
                  searchQuery.toLowerCase() === chip.query
                    ? 'bg-brand-500 text-slate-950 border-brand-400 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Region Tabs & Portion Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-1">
            {/* Regions */}
            <div className="flex items-center gap-1 flex-wrap">
              {(['All', 'South Indian', 'North Indian', 'Home-cooked Fitness', 'Street Food'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRegion(r)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    selectedRegion === r
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  {r === 'Home-cooked Fitness' ? 'Fitness Staples' : r}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setHighProteinOnly(!highProteinOnly)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${
                  highProteinOnly
                    ? 'bg-brand-500/20 text-brand-600 dark:text-brand-300 border-brand-500/40'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Zap className="w-3 h-3 text-brand-500 dark:text-brand-400" />
                <span>High Protein (15g+)</span>
              </button>
            </div>

            {/* Portion multiplier */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 px-1.5">Portion:</span>
              {[0.5, 1, 1.5, 2].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPortionMultiplier(m)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    portionMultiplier === m
                      ? 'bg-brand-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {m}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-2.5 flex-1 max-h-[55vh]">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <Info className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              <p className="text-xs font-bold text-slate-900 dark:text-white">No Indian dishes found matching "{searchQuery}"</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
                Try searching for common terms like "roti", "paneer", "dosa", "chana", or "dal".
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const scaledCalories = Math.round(item.calories * portionMultiplier);
              const scaledProtein = Number((item.protein_g * portionMultiplier).toFixed(1));
              const scaledCarbs = Number((item.carbs_g * portionMultiplier).toFixed(1));
              const scaledFats = Number((item.fats_g * portionMultiplier).toFixed(1));

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-brand-500/60 cursor-pointer transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                >
                  {/* Left Column: Food Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors">
                        {item.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {item.region}
                      </span>
                      {item.is_high_protein && (
                        <span className="px-1.5 py-0.5 rounded-md bg-brand-500/15 text-[9px] font-bold text-brand-600 dark:text-brand-300 border border-brand-500/30">
                          High Protein
                        </span>
                      )}
                    </div>

                    {/* Regional Names */}
                    {(item.hindi_name || item.tamil_name) && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                        {item.hindi_name && <span>{item.hindi_name}</span>}
                        {item.tamil_name && <span>• {item.tamil_name}</span>}
                      </p>
                    )}

                    {/* Serving & Cooking Fat */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex-wrap">
                      <span>Serving: <strong className="text-slate-700 dark:text-slate-300">{item.serving_size}</strong></span>
                      <span>Fat: <strong className="text-amber-600 dark:text-amber-400">{item.cooking_fat}</strong></span>
                    </div>

                    {/* Components Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      {item.components.slice(0, 4).map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 text-[10px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Macros Breakdown & Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800/80">
                    <div className="flex items-center gap-2 text-right">
                      {/* Calories */}
                      <div className="text-center px-2 py-1 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-mono font-extrabold text-amber-600 dark:text-amber-300 flex items-center justify-center gap-0.5">
                          <Flame className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                          {scaledCalories}
                        </span>
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase">kcal</span>
                      </div>

                      {/* Protein */}
                      <div className="text-center px-2 py-1 rounded-xl bg-slate-50 dark:bg-slate-900 border border-brand-500/30">
                        <span className="text-xs font-mono font-extrabold text-brand-600 dark:text-brand-400">
                          {scaledProtein}g
                        </span>
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase">Prot</span>
                      </div>

                      {/* Carbs */}
                      <div className="text-center px-2 py-1 rounded-xl bg-slate-50 dark:bg-slate-900 border border-sky-500/30">
                        <span className="text-xs font-mono font-extrabold text-sky-600 dark:text-sky-400">
                          {scaledCarbs}g
                        </span>
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase">Carb</span>
                      </div>

                      {/* Fats */}
                      <div className="text-center px-2 py-1 rounded-xl bg-slate-50 dark:bg-slate-900 border border-teal-500/30">
                        <span className="text-xs font-mono font-extrabold text-teal-600 dark:text-teal-400">
                          {scaledFats}g
                        </span>
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase">Fat</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 group-hover:bg-brand-500 group-hover:text-slate-950 transition-colors"
                      title="Select this dish"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Layers className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
            Showing {filteredItems.length} verified Indian fitness staples
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
