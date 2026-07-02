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
    // Future telemetry: api.post('/telemetry/crash', { error, errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 text-on-background">
          <div className="text-center w-full max-w-md bg-surface-container-low border border-outline-variant/10 rounded-[32px] p-8">
            <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6 text-error">
              <span className="material-symbols-outlined text-4xl">warning</span>
            </div>
            <h1 className="font-headline text-2xl font-bold text-on-surface mb-2">Something went wrong</h1>
            <p className="font-body text-sm text-on-surface-variant opacity-80 mb-8">
              An unexpected error occurred. Your encrypted session is preserved — try refreshing the application.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <button onClick={this.handleReset} className="btn btn-secondary px-6">Try Again</button>
              <button onClick={() => window.location.reload()} className="btn btn-danger px-6">Refresh Page</button>
            </div>
            {this.state.error && (
              <details className="text-left group">
                <summary className="font-label text-xs text-on-surface-variant cursor-pointer hover:text-on-surface uppercase tracking-widest transition-colors outline-none list-none flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm transition-transform group-open:rotate-180">expand_more</span>
                  Diagnostic Logs
                </summary>
                <div className="mt-4 p-4 rounded-2xl bg-surface-container-highest border border-outline-variant/5 overflow-x-auto max-h-[300px] custom-scrollbar">
                  <pre className="font-body text-[10px] text-error/80 whitespace-pre-wrap leading-relaxed">
                    {this.state.error.stack || this.state.error.toString()}
                  </pre>
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

export default ErrorBoundary;
