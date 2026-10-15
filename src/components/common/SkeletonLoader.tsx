import React from 'react';

export const SkeletonBox: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-slate-800/60 rounded-2xl animate-pulse ${className}`} />
);

export const WorkoutCardSkeleton: React.FC = () => (
  <div className="glass-card rounded-2xl p-5 border border-slate-800/80 bg-slate-900/60 space-y-4 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1">
        <SkeletonBox className="w-8 h-8 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1 max-w-xs">
          <SkeletonBox className="h-4 w-3/4 rounded-md" />
          <SkeletonBox className="h-3 w-1/2 rounded-md" />
        </div>
      </div>
      <SkeletonBox className="w-20 h-7 rounded-lg" />
    </div>
    <div className="space-y-2 pt-2 border-t border-slate-800/60">
      <SkeletonBox className="h-10 w-full rounded-xl" />
      <SkeletonBox className="h-10 w-full rounded-xl" />
      <SkeletonBox className="h-10 w-full rounded-xl" />
    </div>
  </div>
);

export const NutritionCardSkeleton: React.FC = () => (
  <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/60 flex items-center gap-4 animate-pulse">
    <SkeletonBox className="w-16 h-16 rounded-2xl shrink-0" />
    <div className="flex-1 space-y-2">
      <SkeletonBox className="h-4 w-1/3 rounded-md" />
      <div className="flex gap-2">
        <SkeletonBox className="h-3 w-16 rounded-md" />
        <SkeletonBox className="h-3 w-16 rounded-md" />
        <SkeletonBox className="h-3 w-16 rounded-md" />
      </div>
    </div>
    <SkeletonBox className="w-16 h-8 rounded-xl" />
  </div>
);

export const VitalsCardSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="glass-card rounded-3xl p-5 border border-slate-800 bg-slate-900/60 space-y-3 animate-pulse">
        <div className="flex justify-between items-center">
          <SkeletonBox className="h-3 w-24 rounded-md" />
          <SkeletonBox className="h-5 w-12 rounded-full" />
        </div>
        <SkeletonBox className="h-8 w-32 rounded-md" />
        <SkeletonBox className="h-3 w-full rounded-full" />
        <div className="flex justify-between pt-2 border-t border-slate-800/60">
          <SkeletonBox className="h-7 w-20 rounded-xl" />
          <SkeletonBox className="h-7 w-20 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);
