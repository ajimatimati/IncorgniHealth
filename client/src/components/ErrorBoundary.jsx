import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-primary flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Something went wrong</h1>
            <p className="text-sm text-text-muted mb-6">
              An unexpected error occurred. Your data is safe — try refreshing the page.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="btn-secondary text-sm px-5"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary text-sm px-5"
              >
                Refresh Page
              </button>
            </div>
            {this.state.error && (
              <details className="mt-8 text-left">
                <summary className="text-xs text-text-dim cursor-pointer hover:text-text-muted transition">
                  Error details
                </summary>
                <pre className="mt-2 text-xs text-red-400/80 bg-red-500/5 p-3 rounded-xl overflow-x-auto border border-red-500/10">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
