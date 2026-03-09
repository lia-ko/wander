"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    localStorage.removeItem("wander-trips");
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#1C1C1C] text-[#F5E8D8]">
        <div className="max-w-md w-full mx-4 p-6 rounded-2xl bg-white/5 border border-white/10">
          <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
          <p className="text-sm text-zinc-400 mb-4">
            Wander ran into an unexpected error. This can sometimes happen if saved data becomes corrupted.
          </p>
          {this.state.error && (
            <pre className="text-[11px] text-red-400/80 bg-black/30 rounded-lg p-3 mb-4 overflow-auto max-h-32 whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-2">
            <button
              onClick={this.handleReload}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#4E8098] text-white hover:bg-[#3D6B80] transition-colors"
            >
              Reload
            </button>
            <button
              onClick={this.handleReset}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
            >
              Reset Data
            </button>
          </div>
          <p className="text-[10px] text-zinc-500 mt-3 text-center">
            Reset Data clears all saved trips and starts fresh.
          </p>
        </div>
      </div>
    );
  }
}
