'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error to console in development
    console.error('❌ Error Boundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // In production, you could send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg-light p-6">
          <div className="max-w-2xl w-full border-4 border-alert-orange bg-white p-8 shadow-[8px_8px_0px_0px_rgba(18,18,18,1)]">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="p-4 border-4 border-dark bg-alert-orange">
                <AlertTriangle size={48} className="text-dark" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-dark mb-4 text-center">
              Oops! Something Went Wrong
            </h1>

            {/* Message */}
            <p className="text-dark/80 mb-6 text-center font-serif">
              An unexpected error occurred. This has been logged and we'll look into it.
              You can try refreshing the page or going back to the dashboard.
            </p>

            {/* Error details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 border-2 border-dark bg-alert-orange/10 font-mono text-xs overflow-auto max-h-40">
                <p className="font-bold text-dark mb-2">Error Details (dev only):</p>
                <p className="text-dark/80">{this.state.error.message}</p>
                {this.state.error.stack && (
                  <pre className="mt-2 text-dark/60 text-[10px] whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-6 py-3 border-4 border-dark bg-cool-blue text-dark font-bold hover:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] transition-all"
              >
                <RefreshCw size={20} />
                Refresh Page
              </button>

              <button
                onClick={() => (window.location.href = '/admin')}
                className="flex items-center gap-2 px-6 py-3 border-4 border-dark bg-white text-dark font-bold hover:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] transition-all"
              >
                <Home size={20} />
                Go to Dashboard
              </button>
            </div>

            {/* Try again button (resets error boundary without full page reload) */}
            <div className="mt-4 text-center">
              <button
                onClick={this.handleReset}
                className="text-sm text-dark/60 hover:text-dark underline"
              >
                Try rendering this component again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lightweight error boundary for smaller components
 */
export function SimpleErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 border-4 border-alert-orange bg-alert-orange/10">
          <p className="text-dark font-bold mb-2">⚠️ Component Error</p>
          <p className="text-sm text-dark/70">
            This component failed to load. Try refreshing the page.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
