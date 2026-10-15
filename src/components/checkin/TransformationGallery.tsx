import React, { useState, useRef, useCallback } from 'react';
import type { DailyCheckInItem } from '../../types/auth';
import {
  Camera,
  Maximize2,
  X,
  Plus,
  Sliders,
  Columns,
  Layers,
} from 'lucide-react';

interface TransformationGalleryProps {
  checkIns: DailyCheckInItem[];
  onOpenCheckInModal: () => void;
  targetWeightKg: number;
}

export const TransformationGallery: React.FC<TransformationGalleryProps> = ({
  checkIns,
  onOpenCheckInModal,
  targetWeightKg,
}) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'comparison'>('comparison');
  const [comparisonStyle, setComparisonStyle] = useState<'slider' | 'sideBySide'>('slider');
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0-100
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  const [lightboxPhoto, setLightboxPhoto] = useState<DailyCheckInItem | null>(null);

  // Filter check-ins with valid photo URLs, sorted newest first
  const photoCheckIns = React.useMemo(() => {
    return [...checkIns]
      .filter((c) => !!c.photo_url)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [checkIns]);

  // Selected indices for comparison (defaults: after = latest [0], before = oldest [last])
  const [afterIndex, setAfterIndex] = useState<number>(0);
  const [beforeIndex, setBeforeIndex] = useState<number>(
    photoCheckIns.length > 1 ? photoCheckIns.length - 1 : 0
  );

  // Sync index bounds if photoCheckIns list changes
  React.useEffect(() => {
    if (photoCheckIns.length > 1) {
      if (beforeIndex >= photoCheckIns.length) {
        setBeforeIndex(photoCheckIns.length - 1);
      }
      if (afterIndex >= photoCheckIns.length) {
        setAfterIndex(0);
      }
    }
  }, [photoCheckIns.length, beforeIndex, afterIndex]);

  const latestItem = photoCheckIns[afterIndex] || photoCheckIns[0];
  const baselineItem = photoCheckIns[beforeIndex] || photoCheckIns[photoCheckIns.length - 1];

  // Quick preset handlers
  const handleSelectTodayVsDay1 = () => {
    setAfterIndex(0);
    setBeforeIndex(photoCheckIns.length - 1);
  };

  const handleSelectLatestVsPrevious = () => {
    setAfterIndex(0);
    setBeforeIndex(Math.min(1, photoCheckIns.length - 1));
  };

  // Slider dragging logic
  const handleMove = useCallback(
    (clientX: number) => {
      if (!sliderContainerRef.current) return;
      const rect = sliderContainerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(pct);
    },
    []
  );

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingSlider) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingSlider) return;
    handleMove(e.clientX);
  };

  const weightDelta =
    latestItem && baselineItem
      ? parseFloat((latestItem.weight - baselineItem.weight).toFixed(2))
      : 0;

  const daysElapsed = React.useMemo(() => {
    if (!latestItem || !baselineItem) return 0;
    const d1 = new Date(baselineItem.date).getTime();
    const d2 = new Date(latestItem.date).getTime();
    const diff = Math.abs(d2 - d1);
    return Math.round(diff / (1000 * 60 * 60 * 24));
  }, [latestItem, baselineItem]);

  return (
    <div className="glass-card rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-xl space-y-6 transition-colors">
      {/* =========================================================================
          HEADER & VIEW CONTROLS
      ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              <Camera className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Transformation Gallery & Photo Comparison
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Compare ghost-guided physique photos, monitor muscular definition, and evaluate maintenance stability.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {photoCheckIns.length >= 2 && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('comparison')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'comparison'
                    ? 'bg-brand-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Compare</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'timeline'
                    ? 'bg-brand-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Timeline ({photoCheckIns.length})</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenCheckInModal}
            className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-brand-500 to-teal-500 hover:from-brand-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Photo</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          ZERO MOCK EMPTY STATES
      ========================================================================= */}
      {photoCheckIns.length === 0 ? (
        <div className="p-10 sm:p-14 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto border border-brand-500/20 shadow-inner">
            <Camera className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No Progress Photos Uploaded Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Snap your first fasted morning check-in using the Ghost Silhouette Camera to begin tracking visual body composition, muscular definition, and posture alignment.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenCheckInModal}
            className="py-2.5 px-5 rounded-2xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-extrabold text-xs inline-flex items-center gap-2 shadow-lg shadow-brand-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Take Day 1 Baseline Photo</span>
          </button>
        </div>
      ) : photoCheckIns.length === 1 ? (
        <div className="p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-500/30">
                Day 1 Baseline Captured
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                Your Baseline Check-In Photo is Logged!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Log a second progress photo to unlock side-by-side comparison and the interactive before/after split slider.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenCheckInModal}
              className="py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Check-In #2</span>
            </button>
          </div>

          <div className="max-w-xs mx-auto rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
            <img
              src={photoCheckIns[0].photo_url}
              alt="Baseline Check-In"
              className="w-full aspect-[3/4] object-cover"
            />
            <div className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">
                {photoCheckIns[0].date}
              </span>
              <span className="font-mono text-brand-600 dark:text-brand-400 font-extrabold">
                {photoCheckIns[0].weight} kg
              </span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* =========================================================================
              COMPARISON MODE (2+ PHOTOS AVAILABLE)
          ========================================================================= */}
          {viewMode === 'comparison' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Presets & Custom Selectors Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-sm">
                {/* 1-Click Preset Comparisons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Quick Presets:
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectTodayVsDay1}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      afterIndex === 0 && beforeIndex === photoCheckIns.length - 1
                        ? 'bg-brand-500 text-slate-950 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-brand-500/40'
                    }`}
                  >
                    Today vs. Day 1
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectLatestVsPrevious}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      afterIndex === 0 && beforeIndex === 1
                        ? 'bg-brand-500 text-slate-950 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-brand-500/40'
                    }`}
                  >
                    Latest vs. Previous
                  </button>
                </div>

                {/* Slider vs Side-by-Side Toggle */}
                <div className="flex items-center gap-1.5 self-start md:self-auto">
                  <button
                    type="button"
                    onClick={() => setComparisonStyle('slider')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-all ${
                      comparisonStyle === 'slider'
                        ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/40 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Split Slider</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setComparisonStyle('sideBySide')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-all ${
                      comparisonStyle === 'sideBySide'
                        ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/40 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>Side-by-Side</span>
                  </button>
                </div>
              </div>

              {/* Date Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">Before Photo:</span>
                  </div>
                  <select
                    value={beforeIndex}
                    onChange={(e) => setBeforeIndex(parseInt(e.target.value, 10))}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs font-semibold text-slate-900 dark:text-white outline-none"
                  >
                    {photoCheckIns.map((item, idx) => (
                      <option key={item.id} value={idx}>
                        {item.date} — {item.weight} kg
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-400" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">After Photo:</span>
                  </div>
                  <select
                    value={afterIndex}
                    onChange={(e) => setAfterIndex(parseInt(e.target.value, 10))}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs font-semibold text-slate-900 dark:text-white outline-none"
                  >
                    {photoCheckIns.map((item, idx) => (
                      <option key={item.id} value={idx}>
                        {item.date} — {item.weight} kg
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Delta Comparison Metric Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Weight Delta
                  </div>
                  <div
                    className={`text-xl font-extrabold font-mono mt-0.5 ${
                      Math.abs(weightDelta) <= 0.4
                        ? 'text-brand-600 dark:text-brand-400'
                        : weightDelta > 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-cyan-600 dark:text-cyan-400'
                    }`}
                  >
                    {weightDelta > 0 ? `+${weightDelta}` : weightDelta} kg
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {Math.abs(weightDelta) <= 0.4 ? 'Equilibrium Intact' : 'Variance Shift'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Days Elapsed
                  </div>
                  <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
                    {daysElapsed} {daysElapsed === 1 ? 'day' : 'days'}
                  </div>
                  <div className="text-[10px] text-slate-400">Between check-ins</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Target Equilibrium
                  </div>
                  <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
                    {latestItem?.weight || targetWeightKg} kg
                  </div>
                  <div className="text-[10px] text-slate-400">Target: {targetWeightKg} kg</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Visual Definition
                  </div>
                  <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mt-1 truncate">
                    {latestItem?.aiPhysiqueAnalysis?.maintenanceRating || 'Athletic Tone'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {latestItem?.aiPhysiqueAnalysis?.perceivedDefinition || 'Healthy muscle density'}
                  </div>
                </div>
              </div>

              {/* =========================================================================
                  VISUAL PRESENTATION: INTERACTIVE SPLIT SLIDER OR SIDE-BY-SIDE
              ========================================================================= */}
              {comparisonStyle === 'slider' && latestItem?.photo_url && baselineItem?.photo_url ? (
                <div className="space-y-2">
                  <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                    <Sliders className="w-3.5 h-3.5 text-brand-400" />
                    <span>Drag the center divider left or right to reveal transformation details:</span>
                  </div>

                  <div
                    ref={sliderContainerRef}
                    onMouseDown={() => setIsDraggingSlider(true)}
                    onMouseUp={() => setIsDraggingSlider(false)}
                    onMouseLeave={() => setIsDraggingSlider(false)}
                    onMouseMove={handleMouseMove}
                    onTouchStart={() => setIsDraggingSlider(true)}
                    onTouchEnd={() => setIsDraggingSlider(false)}
                    onTouchMove={handleTouchMove}
                    className="relative w-full max-w-xl mx-auto aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-300 dark:border-slate-700 select-none cursor-ew-resize bg-black"
                  >
                    {/* Underlying "Before" Image */}
                    <img
                      src={baselineItem.photo_url}
                      alt="Before Check-In"
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />

                    {/* Overlay "After" Image with dynamic CSS clip-path */}
                    <div
                      style={{
                        clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
                      }}
                      className="absolute inset-0 w-full h-full pointer-events-none"
                    >
                      <img
                        src={latestItem.photo_url}
                        alt="After Check-In"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>

                    {/* Vertical Dividing Line */}
                    <div
                      style={{ left: `${sliderPosition}%` }}
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(0,0,0,0.8)] pointer-events-none z-10"
                    >
                      {/* Interactive Drag Handle */}
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center border-2 border-brand-500">
                        <Sliders className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    </div>

                    {/* Floating Labels */}
                    <div className="absolute bottom-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700 text-white text-[11px] font-bold">
                      <div className="text-[9px] uppercase tracking-wider text-slate-400">Before</div>
                      <div>{baselineItem.date} ({baselineItem.weight} kg)</div>
                    </div>

                    <div className="absolute bottom-4 right-4 z-20 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-brand-500/50 text-white text-[11px] font-bold text-right">
                      <div className="text-[9px] uppercase tracking-wider text-brand-300">After</div>
                      <div>{latestItem.date} ({latestItem.weight} kg)</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* SIDE-BY-SIDE CARDS */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Before Card */}
                  <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-md">
                    <div className="p-3 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Before Baseline
                      </span>
                      <span className="font-mono text-slate-900 dark:text-white">
                        {baselineItem?.date}
                      </span>
                    </div>
                    {baselineItem?.photo_url && (
                      <div className="relative aspect-[3/4] bg-black">
                        <img
                          src={baselineItem.photo_url}
                          alt="Before Check-In"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => setLightboxPhoto(baselineItem)}
                          className="absolute bottom-3 right-3 p-2 rounded-xl bg-slate-950/70 hover:bg-slate-950 text-white border border-slate-700"
                          title="Expand Photo"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div className="p-4 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Scale Weight:</span>
                        <span className="font-bold font-mono text-slate-900 dark:text-white">
                          {baselineItem?.weight} kg
                        </span>
                      </div>
                      {baselineItem?.aiPhysiqueAnalysis?.perceivedDefinition && (
                        <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <strong>AI Tone:</strong> {baselineItem.aiPhysiqueAnalysis.perceivedDefinition}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* After Card */}
                  <div className="rounded-3xl overflow-hidden border border-brand-500/40 bg-white dark:bg-slate-950 shadow-md">
                    <div className="p-3 bg-brand-500/10 border-b border-brand-500/30 flex items-center justify-between text-xs font-bold">
                      <span className="text-brand-700 dark:text-brand-300 uppercase tracking-wider">
                        Current Check-In
                      </span>
                      <span className="font-mono text-slate-900 dark:text-white">
                        {latestItem?.date}
                      </span>
                    </div>
                    {latestItem?.photo_url && (
                      <div className="relative aspect-[3/4] bg-black">
                        <img
                          src={latestItem.photo_url}
                          alt="After Check-In"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => setLightboxPhoto(latestItem)}
                          className="absolute bottom-3 right-3 p-2 rounded-xl bg-slate-950/70 hover:bg-slate-950 text-white border border-slate-700"
                          title="Expand Photo"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div className="p-4 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Scale Weight:</span>
                        <span className="font-bold font-mono text-brand-600 dark:text-brand-400">
                          {latestItem?.weight} kg
                        </span>
                      </div>
                      {latestItem?.aiPhysiqueAnalysis?.perceivedDefinition && (
                        <div className="pt-2 text-[11px] text-brand-700 dark:text-brand-300">
                          <strong>AI Tone:</strong> {latestItem.aiPhysiqueAnalysis.perceivedDefinition}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TIMELINE GRID MODE
          ========================================================================= */}
          {viewMode === 'timeline' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Full Progress Photo Chronology ({photoCheckIns.length} Uploads)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {photoCheckIns.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => setLightboxPhoto(item)}
                    className="group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 cursor-pointer hover:border-brand-500/50 transition-all shadow-sm flex flex-col"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-black">
                      <img
                        src={item.photo_url}
                        alt={`Check-in ${item.date}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-xs text-[10px] font-mono font-bold text-white">
                        {idx === photoCheckIns.length - 1 ? 'Day 1' : `#${photoCheckIns.length - idx}`}
                      </div>
                    </div>
                    <div className="p-2.5 text-xs flex items-center justify-between">
                      <span className="font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                        {item.date}
                      </span>
                      <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                        {item.weight} kg
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* =========================================================================
          LIGHTBOX MODAL
      ========================================================================= */}
      {lightboxPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-lg w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex items-center justify-between border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Check-In: {lightboxPhoto.date}
                </h4>
                <p className="text-xs font-mono text-brand-300 font-semibold">
                  Scale Weight: {lightboxPhoto.weight} kg
                </p>
              </div>
              <button
                onClick={() => setLightboxPhoto(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-[3/4] max-h-[70vh] bg-black flex items-center justify-center">
              <img
                src={lightboxPhoto.photo_url}
                alt="Enlarged Progress Photo"
                className="w-full h-full object-contain"
              />
            </div>

            {lightboxPhoto.aiPhysiqueAnalysis && (
              <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-xs space-y-1">
                <div className="font-bold text-brand-400">AI Physique Assessment:</div>
                <div className="text-slate-300 text-[11px]">
                  {lightboxPhoto.aiPhysiqueAnalysis.visualProgressSummary}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
