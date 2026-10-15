import React, { useState } from 'react';
import type { MilestoneBadge, MilestoneTier } from '../../types/rewards';
import {
  Trophy,
  Sparkles,
  Camera,
  Flame,
  Anchor,
  Dumbbell,
  Award,
  Utensils,
  CheckCircle2,
  Lock,
  Shield,
  Zap,
} from 'lucide-react';

interface AchievementsRewardsSectionProps {
  badges: MilestoneBadge[];
  totalPoints: number;
  unlockedCount: number;
}

export const AchievementsRewardsSection: React.FC<AchievementsRewardsSectionProps> = ({
  badges,
  totalPoints,
  unlockedCount,
}) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'in_progress'>('all');

  const filteredBadges = React.useMemo(() => {
    if (filter === 'unlocked') return badges.filter((b) => b.unlocked);
    if (filter === 'in_progress') return badges.filter((b) => !b.unlocked);
    return badges;
  }, [badges, filter]);

  // Map icon name string to Lucide component
  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Camera':
        return <Camera className="w-5 h-5" />;
      case 'Flame':
        return <Flame className="w-5 h-5" />;
      case 'Trophy':
        return <Trophy className="w-5 h-5" />;
      case 'Anchor':
        return <Anchor className="w-5 h-5" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'Dumbbell':
        return <Dumbbell className="w-5 h-5" />;
      case 'Award':
        return <Award className="w-5 h-5" />;
      case 'Utensils':
        return <Utensils className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const getTierStyles = (tier: MilestoneTier, unlocked: boolean) => {
    if (!unlocked) {
      return {
        cardBorder: 'border-slate-200 dark:border-slate-800/80',
        cardBg: 'bg-slate-50/70 dark:bg-slate-900/50 opacity-80 hover:opacity-100',
        badgeBg: 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
        tierPill: 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700',
        progressBar: 'bg-slate-400 dark:bg-slate-600',
      };
    }

    switch (tier) {
      case 'platinum':
        return {
          cardBorder: 'border-cyan-500/40 hover:border-cyan-400 shadow-cyan-500/10',
          cardBg: 'bg-cyan-50/70 dark:bg-gradient-to-br dark:from-cyan-950/20 dark:to-slate-900/90',
          badgeBg: 'bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/20',
          tierPill: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
          progressBar: 'bg-gradient-to-r from-cyan-500 to-blue-500',
        };
      case 'gold':
        return {
          cardBorder: 'border-amber-500/40 hover:border-amber-400 shadow-amber-500/10',
          cardBg: 'bg-amber-50/70 dark:bg-gradient-to-br dark:from-amber-950/20 dark:to-slate-900/90',
          badgeBg: 'bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/20',
          tierPill: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
          progressBar: 'bg-gradient-to-r from-amber-500 to-yellow-400',
        };
      case 'silver':
        return {
          cardBorder: 'border-slate-400/40 hover:border-slate-300 shadow-slate-500/10',
          cardBg: 'bg-slate-100/70 dark:bg-gradient-to-br dark:from-slate-800/30 dark:to-slate-900/90',
          badgeBg: 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-950 shadow-md',
          tierPill: 'bg-slate-400/15 text-slate-700 dark:text-slate-300 border-slate-400/30',
          progressBar: 'bg-gradient-to-r from-slate-400 to-slate-300',
        };
      case 'bronze':
      default:
        return {
          cardBorder: 'border-orange-500/30 hover:border-orange-400 shadow-orange-500/10',
          cardBg: 'bg-orange-50/70 dark:bg-gradient-to-br dark:from-orange-950/20 dark:to-slate-900/90',
          badgeBg: 'bg-gradient-to-br from-amber-600 to-orange-600 text-white shadow-md',
          tierPill: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
          progressBar: 'bg-gradient-to-r from-orange-500 to-amber-500',
        };
    }
  };

  const completionPct = badges.length > 0 ? Math.round((unlockedCount / badges.length) * 100) : 0;

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-xl space-y-6 transition-colors">
      {/* =========================================================================
          HEADER & GAMIFIED SCORE BANNER
      ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Trophy className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Milestone Badges & Rewards
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Unlock achievements through consistent daily check-ins, maintenance equilibrium, and training volume.
          </p>
        </div>

        {/* Gamified Points Banner */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-brand-500/15 border border-amber-500/30 flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
            <div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Reward Points
              </div>
              <div className="text-base font-black font-mono text-amber-600 dark:text-amber-400">
                {totalPoints.toLocaleString()} XP
              </div>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Unlocked
            </div>
            <div className="text-base font-black font-mono text-slate-900 dark:text-white">
              {unlockedCount} / {badges.length}
            </div>
          </div>
        </div>
      </div>

      {/* Overall Completion Progress */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex-1">
          <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Overall Achievement Mastery</span>
            </span>
            <span className="font-mono text-brand-600 dark:text-brand-400">{completionPct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              style={{ width: `${completionPct}%` }}
              className="h-full bg-gradient-to-r from-brand-500 via-teal-400 to-amber-400 rounded-full transition-all duration-700"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 shrink-0 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-brand-500 text-slate-950 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All ({badges.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unlocked')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              filter === 'unlocked'
                ? 'bg-brand-500 text-slate-950 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Unlocked ({unlockedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('in_progress')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              filter === 'in_progress'
                ? 'bg-brand-500 text-slate-950 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            In Progress ({badges.length - unlockedCount})
          </button>
        </div>
      </div>

      {/* =========================================================================
          BADGES GRID
      ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {filteredBadges.map((badge) => {
          const styles = getTierStyles(badge.tier, badge.unlocked);

          return (
            <div
              key={badge.id}
              className={`p-4 rounded-3xl border transition-all duration-200 flex flex-col justify-between group shadow-sm ${styles.cardBorder} ${styles.cardBg}`}
            >
              <div>
                {/* Card Top: Icon & Tier Tag */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${styles.badgeBg}`}
                  >
                    {getBadgeIcon(badge.iconName)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles.tierPill}`}
                    >
                      {badge.tier}
                    </span>
                    {badge.unlocked ? (
                      <span
                        className="p-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        title="Unlocked"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span
                        className="p-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-400"
                        title="In Progress"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Badge Title & Description */}
                <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {badge.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {badge.description}
                </p>
              </div>

              {/* Card Footer: Progress or Unlocked Timestamp */}
              <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
                {badge.unlocked ? (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Unlocked
                    </span>
                    <span className="font-mono text-slate-400 text-[10px]">
                      {badge.unlockedAt ? badge.unlockedAt.split('T')[0] : 'Active'}
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                      <span>{badge.progressLabel || 'Progress'}</span>
                      <span className="font-mono font-bold">{badge.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${badge.progress}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${styles.progressBar}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
