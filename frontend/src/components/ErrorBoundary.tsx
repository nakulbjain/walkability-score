import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-slate-900 border border-rose-500/30 rounded-2xl text-center">
          <h3 className="text-sm font-bold text-rose-400">
            {this.props.fallbackTitle || 'Component Error'}
          </h3>
          <p className="text-xs text-slate-400 mt-2">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
