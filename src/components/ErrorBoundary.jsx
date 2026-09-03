import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('TechZen ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0b0b] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="text-red-accent font-mono text-xs font-bold uppercase mb-2">00 / SYSTEM ERROR</div>
          <h1 className="text-3xl font-extrabold font-outfit mb-2">Something went wrong.</h1>
          <p className="text-xs text-zinc-400 max-w-md mb-6">
            An internal interface error occurred. Please refresh or return home.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-5 py-2.5 rounded-sm bg-red-accent hover:bg-red-600 text-white font-mono text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-red-500/20"
          >
            Return to Signal ►
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
