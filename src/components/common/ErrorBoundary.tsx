import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  moduleName?: string;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary caught an error in [${this.props.moduleName || 'AppModule'}]:`, error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-rose-500/30 dark:border-rose-500/40 shadow-xl text-center space-y-4 my-4 animate-fadeIn">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {this.props.moduleName ? `${this.props.moduleName} Notice` : 'Module Temporarily Unavailable'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
              An unexpected display issue occurred in this section. Your data is safely saved in Cloud Firestore.
            </p>
          </div>

          {this.state.error && (
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 text-[11px] font-mono text-slate-700 dark:text-slate-300 max-w-lg mx-auto truncate border border-slate-200 dark:border-slate-800">
              {this.state.error.message || 'Unknown runtime error'}
            </div>
          )}

          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Module</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Page</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
