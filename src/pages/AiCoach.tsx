import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const AiCoach: React.FC = () => {
  const { currentUser } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: `Hello ${
        currentUser?.displayName?.split(' ')[0] || 'Athlete'
      }! I am your FitMaintenance AI Coach. I continuously evaluate your workout load, body composition, and caloric expenditure to keep your maintenance phase accurate and fatigue-free. What can I help you optimize today?`,
      timestamp: 'Just now',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const samplePrompts = [
    'How do I accurately identify my maintenance calorie baseline?',
    'Should I eat more calories on heavy leg days?',
    'What is the ideal macro split for maintaining muscle mass?',
    'How to prevent metabolic adaptation after a long diet?',
  ];

  const handleSend = (textToSend?: string) => {
    const prompt = textToSend || input;
    if (!prompt.trim()) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    // Contextual AI fitness response
    setTimeout(() => {
      let reply =
        "To dial in your true maintenance calories, track your body weight average across 14 consecutive days while consuming the calculated baseline. If your 7-day rolling weight average fluctuates by less than 0.3%, you have nailed your exact maintenance intake!";
      const lower = prompt.toLowerCase();
      if (lower.includes('leg') || lower.includes('heavy')) {
        reply =
          "Calorie cycling is a great approach! On heavy compound leg days, consider shifting 30–40g of carbohydrates from your rest days into your pre- and post-workout meals while keeping weekly average calories at maintenance.";
      } else if (lower.includes('macro') || lower.includes('muscle')) {
        reply =
          "For muscle preservation at maintenance: Aim for 1.8–2.2g of protein per kg of body weight, 20–25% total calories from healthy fats (hormonal support), and the remaining calories from complex carbohydrates to maximize glycogen re-synthesis.";
      } else if (lower.includes('metabolic') || lower.includes('adaptation')) {
        reply =
          "After prolonged dieting, reverse diet by increasing calories by +100 to +150 kcal per week until reaching your calculated maintenance. This restores thyroid hormones (T3/T4) and leptin while avoiding sudden visceral fat accumulation.";
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-h-[850px] rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">FitMaintenance AI Assistant</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Metabolic & Hypertrophy Specialist</p>
          </div>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                m.sender === 'user'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-emerald-400 border border-slate-700'
              }`}
            >
              {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none'
                  : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none'
              }`}
            >
              <p>{m.text}</p>
              <span className="text-[10px] text-slate-400 block mt-1.5 text-right opacity-80">
                {m.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
            <Bot className="w-4 h-4 text-emerald-400 animate-bounce" />
            <span>FitMaintenance AI is analyzing metabolic science...</span>
          </div>
        )}
      </div>

      {/* Prompt suggestions */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/30 overflow-x-auto flex gap-2 no-scrollbar">
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="flex-shrink-0 text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60 transition flex items-center gap-1"
          >
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80">
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
            className="flex-1 py-2 px-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold transition disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiCoach;

