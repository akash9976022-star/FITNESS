import React, { useState } from 'react';
import type { DailyCheckInItem, ExperienceLevel, ReadinessLevel } from '../../types/auth';
import {
  Bot,
  Brain,
  Activity,
  Dumbbell,
  HeartPulse,
  RefreshCw,
  Sparkles,
  Lightbulb,
} from 'lucide-react';

interface AiPhysiqueFeedbackProps {
  experienceLevel: ExperienceLevel;
  latestCheckIn?: DailyCheckInItem | null;
  targetWeightKg: number;
  onExperienceLevelChange?: (level: ExperienceLevel) => void;
}

export const AiPhysiqueFeedback: React.FC<AiPhysiqueFeedbackProps> = ({
  experienceLevel: initialExpLevel,
  latestCheckIn,
  targetWeightKg,
  onExperienceLevelChange,
}) => {
  const [activeExpLevel, setActiveExpLevel] = useState<ExperienceLevel>(initialExpLevel);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync internal state when parent prop changes
  React.useEffect(() => {
    setActiveExpLevel(initialExpLevel);
  }, [initialExpLevel]);

  const handleSelectLevel = (level: ExperienceLevel) => {
    setActiveExpLevel(level);
    if (onExperienceLevelChange) {
      onExperienceLevelChange(level);
    }
  };

  const handleSimulateRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Readiness context
  const readiness: ReadinessLevel = latestCheckIn?.readiness || 'moderate';
  const currentWeight = latestCheckIn?.weight || targetWeightKg;
  const weightVariance = parseFloat((currentWeight - targetWeightKg).toFixed(2));
  const isSteady = Math.abs(weightVariance) <= 0.4;

  // Generate adaptive advice based on experienceLevel + readiness + weight trend
  const getFeedbackContent = () => {
    switch (activeExpLevel) {
      case 'beginner':
        return {
          roleTitle: 'Foundations & Consistency Coach',
          levelBadge: 'Beginner Mode Active',
          badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          summary: isSteady
            ? 'Awesome consistency! Your body weight is right on track. Focus today on establishing a reliable workout habit and locking down your sleep.'
            : weightVariance > 0
            ? 'Slight weight fluctuation detected. This is mostly water retention from new workouts or sodium. Do not stress or cut food!'
            : 'Weight is slightly lower than target. Ensure you are finishing your wholesome meals and not skipping snacks.',
          trainingCue: {
            title: 'Form & Effort Cue',
            description: 'Leave 2-3 reps in the tank (do not train to complete exhaustion). Prioritize clean technique and smooth movement over lifting heavy.',
          },
          volumeRec: readiness === 'low'
            ? 'Low energy day: Take a 20-minute brisk walk or do light bodyweight stretching instead of a heavy workout.'
            : 'Do 3 sets of 8-10 reps on your core exercises. Focus on feeling the target muscle contract.',
          recoveryTip: {
            title: 'Beginner Recovery Focus',
            text: 'Drink at least 2.5–3 liters of water today and aim for 8 hours of uninterrupted sleep to let your muscles rebuild.',
          },
          targetRir: 'RIR 2-3 (Comfortable Reserve)',
        };

      case 'pro':
        return {
          roleTitle: 'CNS & High-Performance Optimization Engine',
          levelBadge: 'Pro Mode Active',
          badgeColor: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
          summary: isSteady
            ? `Equilibrium Variance: ${weightVariance >= 0 ? '+' : ''}${weightVariance} kg. Perfect energy balance maintained without glycogen depletion or water bloat.`
            : weightVariance > 0
            ? `Extracellular water or glycogen supercompensation: +${weightVariance} kg. Monitor subcutaneous fluid retention before altering maintenance macros.`
            : `Deficit detected: ${weightVariance} kg. Increase clean complex carbohydrates by 30-40g to prevent catabolic signaling.`,
          trainingCue: {
            title: 'Neuromuscular & RPE Directive',
            description: readiness === 'high'
              ? 'Peak CNS readiness confirmed: Execute top set at RPE 9.5 on primary compound. Explode through concentric phase.'
              : 'Systemic fatigue threshold exceeded: Deload today. Limit training to restorative blood-flow isolation work (RPE ≤ 6.5).',
          },
          volumeRec: readiness === 'high'
            ? 'Max effective volume (MEV to MAV): Add 2 drop-sets on lat pulldowns / hack squats to induce mechanical tension.'
            : 'Volume reduction: Decrease working sets by 40% today to allow neuromuscular and tendon recovery.',
          recoveryTip: {
            title: 'Advanced Biofeedback Protocol',
            text: 'Electrolyte replenishment (400mg magnesium glycinate post-workout), cold finish shower, and carb refeed window.',
          },
          targetRir: 'RIR 0-1 on Top Set, Auto-regulated',
        };

      case 'intermediate':
      default:
        return {
          roleTitle: 'Hypertrophy & Progressive Overload Engine',
          levelBadge: 'Intermediate Mode Active',
          badgeColor: 'bg-brand-500/15 text-brand-700 dark:text-brand-300 border-brand-500/30',
          summary: isSteady
            ? `Stable metabolic state. Weight variance is ±${Math.abs(weightVariance)} kg, maintaining lean muscle density without accumulating adipose tissue.`
            : weightVariance > 0
            ? `Minor scale bump (+${weightVariance} kg). Track sodium and evening carb timing before adjusting caloric targets.`
            : `Scale dip (${weightVariance} kg). Increase healthy fats or pre-workout intra carbs to maintain training pump.`,
          trainingCue: {
            title: 'Progressive Overload Target',
            description: 'Aim for +1 rep on your heaviest dumbbell or barbell set today, maintaining strict 2-second eccentric descent.',
          },
          volumeRec: readiness === 'low'
            ? 'Moderate fatigue noted: Stick strictly to your programmed sets. Avoid taking sets to failure.'
            : 'Strong readiness: You can push your final accessory set to absolute failure (RPE 10).',
          recoveryTip: {
            title: 'Intermediate Nutrition & Recovery',
            text: 'Distribute your 165g+ protein evenly across 4 meals (approx 40g per meal) to maximize continuous muscle protein synthesis.',
          },
          targetRir: 'RIR 1-2 (Near Technical Failure)',
        };
    }
  };

  const feedback = getFeedbackContent();

  return (
    <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-gradient-to-br dark:from-slate-900/90 dark:via-slate-900 dark:to-slate-950 shadow-xl relative overflow-hidden animate-fadeIn transition-colors">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-brand-500/20 to-teal-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                AI Physique Feedback
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${feedback.badgeColor}`}>
                {feedback.levelBadge}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{feedback.roleTitle}</p>
          </div>
        </div>

        {/* Level Switcher (Beginner / Intermediate / Pro) */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleSelectLevel('beginner')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeExpLevel === 'beginner'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Beginner
          </button>
          <button
            type="button"
            onClick={() => handleSelectLevel('intermediate')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeExpLevel === 'intermediate'
                ? 'bg-brand-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Intermediate
          </button>
          <button
            type="button"
            onClick={() => handleSelectLevel('pro')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeExpLevel === 'pro'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pro
          </button>

          <button
            type="button"
            onClick={handleSimulateRefresh}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors ml-1"
            title="Recalculate AI Analysis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-500 dark:text-brand-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Analysis Summary Card */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/90 mb-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5">
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                Latest Biofeedback Evaluation
              </span>
              {latestCheckIn && (
                <span className="text-[10px] text-slate-500 font-mono">
                  ({latestCheckIn.date} • {latestCheckIn.weight} kg)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{feedback.summary}</p>

            {/* Multimodal Gemini AI Vision Analysis (if present on latest checkin) */}
            {latestCheckIn?.aiPhysiqueAnalysis && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-brand-700 dark:text-brand-400 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gemini AI Vision Analysis</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/20">
                    {latestCheckIn.aiPhysiqueAnalysis.maintenanceRating}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Visual Definition:</span>
                    <span className="text-slate-800 dark:text-slate-200">{latestCheckIn.aiPhysiqueAnalysis.perceivedDefinition}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Posture & Biomechanics:</span>
                    <span className="text-slate-800 dark:text-slate-200">{latestCheckIn.aiPhysiqueAnalysis.postureAlignment}</span>
                  </div>
                </div>

                {latestCheckIn.aiPhysiqueAnalysis.recommendedAction && (
                  <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 text-[11px] text-teal-800 dark:text-teal-300 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>{latestCheckIn.aiPhysiqueAnalysis.recommendedAction}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Adaptive Grid: Training Cue, Volume Advice, Recovery */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Training & Form Cue */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
              <span className="flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                {feedback.trainingCue.title}
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{feedback.targetRir}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {feedback.trainingCue.description}
            </p>
          </div>
        </div>

        {/* Volume & Intensity Directive */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Volume & Intensity
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                readiness === 'high' ? 'bg-brand-500/15 text-brand-700 dark:text-brand-300' : readiness === 'low' ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
              }`}>
                {readiness.toUpperCase()} ENERGY
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {feedback.volumeRec}
            </p>
          </div>
        </div>

        {/* Recovery & Nutrition */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
              <span className="flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                {feedback.recoveryTip.title}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {feedback.recoveryTip.text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
