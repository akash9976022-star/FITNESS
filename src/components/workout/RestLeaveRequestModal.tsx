import React, { useState } from 'react';
import {
  FileText,
  X,
  Award,
  Send,
  Loader2,
} from 'lucide-react';
import type { DayOfWeek, RestLeaveRequest } from '../../services/firestoreService';

interface RestLeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayName: string;
  dayId: DayOfWeek;
  userName?: string;
  onSubmitLeave: (request: Omit<RestLeaveRequest, 'id' | 'createdAt'>) => Promise<void>;
  showToast?: (msg: string) => void;
}

export const RestLeaveRequestModal: React.FC<RestLeaveRequestModalProps> = ({
  isOpen,
  onClose,
  dayName,
  dayId,
  userName = 'Athlete',
  onSubmitLeave,
  showToast,
}) => {
  const [reasonCategory, setReasonCategory] = useState<RestLeaveRequest['reasonCategory']>('soreness');
  const [explanation, setExplanation] = useState('');
  const [pledgeAccepted, setPledgeAccepted] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const getCoachVerdict = (category: RestLeaveRequest['reasonCategory'], name: string) => {
    switch (category) {
      case 'fasting':
        return `Leave Approved with Respect, ${name}. Sacred fasting requires metabolic preservation and joint hydration. Drink 3.5L water and avoid heavy CNS fatigue. We will make up the training load tomorrow.`;
      case 'illness':
        return `Medical Leave Approved, ${name}. Your body's immune system needs sleep and nutrition to heal, not heavy lifting. Rest up, stay hydrated, and report back when fever/symptoms clear.`;
      case 'work_travel':
        return `Emergency Leave Provisionally Granted, ${name}. Career and duties matter, but consistency is your true asset. Maintain high protein today and do not touch junk food. Tomorrow at 6:00 AM, zero excuses!`;
      case 'soreness':
      default:
        return `Accountability Leave Provisionally Granted, ${name}. Heavy progressive overload creates micro-tears that require deep recovery. Hydrate, hit 8 hours of sleep, and make up your volume on the floor tomorrow.`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pledgeAccepted) {
      showToast?.('Please sign the accountability pledge before submitting.');
      return;
    }

    setIsEvaluating(true);

    // AI Coach Evaluation Simulation
    const coachVerdict = getCoachVerdict(reasonCategory, userName);

    try {
      await onSubmitLeave({
        userId: '',
        date: new Date().toISOString().split('T')[0],
        dayName: dayName || (dayId ? String(dayId) : 'Rest Day'),
        reasonCategory,
        explanation: explanation.trim() || 'Official application for emergency rest recovery day.',
        status: 'granted',
        coachVerdict,
        pledgeAccepted: true,
      });

      setEvaluationResult(coachVerdict);
      showToast?.('Formal Leave Application Approved by Coach!');
    } catch {
      showToast?.('Failed to submit leave application.');
      setIsEvaluating(false);
    }
  };

  const handleFinishAndClose = () => {
    setEvaluationResult(null);
    setExplanation('');
    setPledgeAccepted(false);
    setIsEvaluating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-amber-500/30 shadow-2xl shadow-amber-950/40 text-slate-100 overflow-hidden">
        {/* Top Formal Seal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/50 via-slate-900 to-amber-950/30 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                Official Accountability Waiver
              </span>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                Formal Leave Application to AI Coach
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {evaluationResult ? (
          /* Coach Verdict Stamped View */
          <div className="p-6 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/20">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Official Decision: Leave Granted
              </span>
              <h4 className="text-lg font-black text-white">
                Emergency Rest Day Approved for {dayName}
              </h4>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 text-left space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Coach's Official Statement:
              </span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium italic">
                "{evaluationResult}"
              </p>
            </div>

            <button
              type="button"
              onClick={handleFinishAndClose}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 transition"
            >
              Acknowledge & Save Leave
            </button>
          </div>
        ) : (
          /* Formal Letter Application Form */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {/* Letter Metadata Header */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
              <p><strong className="text-amber-400">TO:</strong> Head AI Coach & Accountability Officer</p>
              <p><strong className="text-amber-400">FROM:</strong> {userName}</p>
              <p><strong className="text-amber-400">DATE:</strong> {todayFormatted}</p>
              <p><strong className="text-amber-400">SUBJECT:</strong> Request for Exemption / Extra Rest Day on {dayName}</p>
            </div>

            {/* Reason Selection */}
            <div>
              <label className="text-xs font-black text-slate-300 block mb-1.5 uppercase tracking-wider">
                Primary Reason for Rest Request:
              </label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value as RestLeaveRequest['reasonCategory'])}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="soreness">Acute Muscular Soreness & Joint Fatigue (DOMS)</option>
                <option value="fasting">Traditional Fasting / Religious Observance</option>
                <option value="illness">Sickness / Medical Condition / Recovery</option>
                <option value="work_travel">Emergency Work Deadline / Travel</option>
                <option value="personal">Personal Emergency / Mental Reset Needed</option>
              </select>
            </div>

            {/* Explanation Field */}
            <div>
              <label className="text-xs font-black text-slate-300 block mb-1.5 uppercase tracking-wider">
                Official Statement & Circumstances:
              </label>
              <textarea
                rows={3}
                required
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain why training cannot take place today and how you plan to recover..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Accountability Pledge Checkbox */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={pledgeAccepted}
                  onChange={(e) => setPledgeAccepted(e.target.checked)}
                  className="mt-0.5 rounded text-amber-500 focus:ring-amber-500 bg-slate-950 border-slate-700"
                />
                <div>
                  <span className="text-xs font-black text-amber-300 block">
                    Accountability Pledge (Mandatory)
                  </span>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    "I solemnly declare this extra rest day is an emergency exemption. I pledge to resume my scheduled workout tomorrow at 6:00 AM with zero excuses and make up my training volume."
                  </p>
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel & Train Today
              </button>
              <button
                type="submit"
                disabled={isEvaluating || !pledgeAccepted}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-95"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Coach Evaluating...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Sign & Submit to AI Coach</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RestLeaveRequestModal;
