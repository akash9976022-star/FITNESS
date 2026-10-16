import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Zap,
  Wrench,
  Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { askFitMaintenanceAI, isGeminiConfigured } from '../services/geminiService';
import {
  subscribeCoachMessages,
  addCoachMessage,
  subscribeUserProfile,
  type CoachMessageItem,
  type UserProfile,
} from '../services/firestoreService';

export const AiCoach: React.FC = () => {
  const { currentUser } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<CoachMessageItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  // Real-time Firestore sync of chat history and user profile (Zero mock data)
  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    const unsubChat = subscribeCoachMessages(currentUser.uid, (chatHistory) => {
      setMessages(chatHistory);
      setLoading(false);
    });

    const unsubProfile = subscribeUserProfile(currentUser.uid, (profile) => {
      setUserProfile(profile);
    });

    return () => {
      unsubChat();
      unsubProfile();
    };
  }, [currentUser?.uid]);

  const samplePrompts = [
    'How do I accurately calculate my true maintenance calories?',
    'Should I cycle calories higher on heavy training days?',
    'What is the ideal macro split to preserve muscle during maintenance?',
    'How do I avoid metabolic adaptation after a caloric deficit?',
  ];

  const handleSend = async (textToSend?: string) => {
    const prompt = textToSend || input;
    if (!prompt.trim() || isTyping || !currentUser?.uid) return;

    if (!textToSend) setInput('');
    setIsTyping(true);

    try {
      // 1. Save user message to Firestore
      await addCoachMessage(currentUser.uid, {
        sender: 'user',
        text: prompt.trim(),
      });

      // 2. Query Gemini AI service with User Profile context (experience level, equipment, TDEE)
      const reply = await askFitMaintenanceAI(prompt.trim(), userProfile || undefined);

      // 3. Save AI reply to Firestore
      await addCoachMessage(currentUser.uid, {
        sender: 'ai',
        text: reply,
      });
    } catch (err) {
      console.error('Failed to process message:', err);
      if (currentUser?.uid) {
        await addCoachMessage(currentUser.uid, {
          sender: 'ai',
          text: 'I encountered an issue processing that question. Please try again.',
        });
      }
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
        Syncing chat history with Firestore...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-h-[850px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">FitMaintenance AI Assistant</h3>
              {isGeminiConfigured ? (
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 dark:bg-gradient-to-r dark:from-emerald-500/20 dark:to-teal-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                  Google Gemini Live
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 font-bold border border-emerald-500/30">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Metabolic & Hypertrophy Specialist • Synced with Firestore
            </p>
          </div>
        </div>

        {/* Profile Context Badges in Header */}
        <div className="hidden sm:flex items-center gap-2">
          {userProfile?.experienceLevel && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 capitalize">
              <Activity className="w-3 h-3 text-emerald-500" />
              {userProfile.experienceLevel} Mode
            </span>
          )}
          {userProfile?.equipment && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Wrench className="w-3 h-3 text-teal-500" />
              {userProfile.equipment.length} Machines
            </span>
          )}
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Start a Consultation with FitMaintenance AI
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                Zero mock messages. Type a question below or click a prompt. The AI automatically adapts its feedback to your{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 capitalize">{userProfile?.experienceLevel || 'athlete'}</strong> level and your{' '}
                <strong className="text-teal-600 dark:text-teal-400">{userProfile?.equipment?.length || 0} registered machines</strong>.
              </p>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  m.sender === 'user'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm'
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>
              </div>
            </div>
          ))
        )}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 p-2">
            <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-bounce" />
            <span>FitMaintenance AI is analyzing metabolic science...</span>
          </div>
        )}
      </div>

      {/* Prompt suggestions */}
      <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/30 overflow-x-auto flex gap-2 no-scrollbar">
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="flex-shrink-0 text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 transition flex items-center gap-1 shadow-sm"
          >
            <Zap className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about calories, macros, or workout programming..."
            className="flex-1 py-2 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold transition disabled:opacity-40 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiCoach;
