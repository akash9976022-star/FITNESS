import React from 'react';
import {
  Trophy,
  Flame,
  Footprints,
  Anchor,
  Camera,
  Shield,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { type UserReward } from '../../services/firestoreService';

interface BadgeUnlockModalProps {
  rewards: UserReward[];
  onClose: () => void;
}

export const BadgeUnlockModal: React.FC<BadgeUnlockModalProps> = ({
  rewards,
  onClose,
}) => {
  if (!rewards || rewards.length === 0) return null;

  const currentBadge = rewards[0];

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-10 h-10 text-amber-400" />;
      case 'Footprints':
        return <Footprints className="w-10 h-10 text-emerald-400" />;
      case 'Anchor':
        return <Anchor className="w-10 h-10 text-teal-400" />;
      case 'Camera':
        return <Camera className="w-10 h-10 text-indigo-400" />;
      case 'Shield':
        return <Shield className="w-10 h-10 text-purple-400" />;
      case 'Trophy':
      default:
        return <Trophy className="w-10 h-10 text-amber-400" />;
    }
  };

  const getTierStyles = (tier: string) => {
    switch (tier) {
      case 'diamond':
        return 'from-purple-600 via-indigo-500 to-teal-400 text-purple-300 border-purple-500/40 shadow-purple-500/30';
      case 'gold':
        return 'from-amber-500 via-yellow-400 to-orange-500 text-amber-300 border-amber-500/40 shadow-amber-500/30';
      case 'silver':
        return 'from-slate-400 via-slate-300 to-slate-500 text-slate-200 border-slate-400/40 shadow-slate-400/20';
      case 'bronze':
      default:
        return 'from-amber-700 via-orange-600 to-amber-800 text-amber-200 border-amber-700/40 shadow-amber-700/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 text-center shadow-2xl overflow-hidden space-y-5">
        {/* Ambient Glow */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Celebratory Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Milestone Unlocked!</span>
        </div>

        {/* Shimmering Badge Icon */}
        <div className="relative mx-auto w-24 h-24 rounded-3xl bg-gradient-to-tr p-1 shadow-xl flex items-center justify-center animate-bounce-short">
          <div
            className={`w-full h-full rounded-3xl bg-gradient-to-br ${getTierStyles(
              currentBadge.tier
            )} flex items-center justify-center border`}
          >
            {getBadgeIcon(currentBadge.icon)}
          </div>
        </div>

        {/* Badge Metadata */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block">
            {currentBadge.tier} Tier Achievement
          </span>
          <h3 className="text-xl font-black text-white tracking-tight">
            {currentBadge.title}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
            {currentBadge.description}
          </p>
        </div>

        {/* Additional Badge Count if multiple */}
        {rewards.length > 1 && (
          <div className="p-2 rounded-xl bg-slate-800/60 text-xs text-slate-400">
            +{rewards.length - 1} more achievements unlocked today!
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <CheckCircle className="w-4 h-4 stroke-[2.5]" />
          <span>Claim Reward & Continue</span>
        </button>
      </div>
    </div>
  );
};

export default BadgeUnlockModal;
