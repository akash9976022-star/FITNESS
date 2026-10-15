import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`relative p-2 rounded-xl transition-all duration-200 flex items-center gap-2 group active:scale-95 ${
        isDark
          ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-slate-800 hover:border-slate-700'
          : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-sm'
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300 stroke-[2.2]" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700 group-hover:-rotate-12 transition-transform duration-300 stroke-[2.2]" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-semibold select-none capitalize">
          {theme} Mode
        </span>
      )}
    </button>
  );
};
