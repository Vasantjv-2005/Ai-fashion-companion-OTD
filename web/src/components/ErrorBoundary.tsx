import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RotateCcw, Home, RefreshCw, ChevronDown } from 'lucide-react';
import { clearAllOtdWorkspaceStorage } from '../utils/authStorage';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    // Log crash details with actionable context for QA and engineering
    console.error('[OTD Application Error Boundary Caught]:', error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleReturnHome = (): void => {
    window.location.href = '/';
  };

  handleClearCacheAndRecover = (): void => {
    try {
      clearAllOtdWorkspaceStorage({ includeSettings: true });
      sessionStorage.clear();
      if ('indexedDB' in window && window.indexedDB) {
        window.indexedDB.deleteDatabase('otd_intake_db');
      }
    } catch (e) {
      console.warn('Cache clearing partially failed:', e);
    }
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0908] text-[#F3EFEA] flex items-center justify-center p-4 sm:p-6 selection:bg-[#C9A84C]/30 selection:text-white">
          <div className="w-full max-w-xl rounded-3xl bg-[#14120E] border border-[#C9A84C]/30 shadow-2xl p-6 sm:p-8 text-center backdrop-blur-xl relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#C9A84C]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#C9A84C]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Icon Banner */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-[#C9A84C]/15 border border-[#C9A84C]/40 flex items-center justify-center text-[#E5C158] mb-5 shadow-lg">
              <AlertCircle className="w-8 h-8" />
            </div>

            {/* Typography */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E5C158]" />
                <span className="text-[10px] uppercase font-mono font-bold tracking-[0.2em] text-[#E5C158]">
                  Stability Protection Active
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#E5C158]" />
              </div>
              <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-[#F3EFEA] leading-tight">
                The Atelier Interrupted
              </h1>
              <p className="text-xs sm:text-sm text-[#A89F91] max-w-md mx-auto leading-relaxed">
                An unexpected interface exception was safely intercepted. Your personal wardrobe items and styling data remain intact.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#C9A84C] hover:bg-[#D4B357] text-[#0A0908] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.02]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Application</span>
              </button>
              <button
                type="button"
                onClick={this.handleReturnHome}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[#C9A84C]/40 hover:bg-[#C9A84C]/10 text-[#F3EFEA] font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to Home</span>
              </button>
              <button
                type="button"
                onClick={this.handleClearCacheAndRecover}
                className="w-full sm:w-auto px-4 py-2.5 rounded-full border border-rose-500/30 hover:bg-rose-500/10 text-rose-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Clears local wardrobe cache and restarts cleanly"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Cache & Recover</span>
              </button>
            </div>

            {/* Diagnostic Details Accordion */}
            {this.state.error && (
              <details className="text-left border border-white/10 rounded-2xl bg-black/40 p-3 sm:p-4 text-xs text-[#A89F91] group">
                <summary className="cursor-pointer font-mono font-semibold flex items-center justify-between text-[#C9A84C] select-none hover:text-[#E5C158] transition-colors">
                  <span>Diagnostic Trace Details</span>
                  <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                  <p className="font-mono text-[11px] text-rose-300 break-words">
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="font-mono text-[10px] text-white/50 overflow-x-auto p-2 bg-black/60 rounded-lg max-h-36 whitespace-pre">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
