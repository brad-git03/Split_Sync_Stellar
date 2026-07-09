"use client";

import React, { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to your monitoring system
    console.error("Runtime exception caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-obsidian text-white flex flex-col items-center justify-center p-4 selection:bg-emerald-mint/30 selection:text-white">
      {/* Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-glow-emerald rounded-full pointer-events-none -z-10"></div>

      {/* Glassmorphism Card */}
      <div className="bg-slate-layer/80 border border-border-slate backdrop-blur-md rounded-2xl max-w-md w-full p-8 text-center shadow-2xl space-y-6 animate-in fade-in duration-200">
        <div className="w-16 h-16 bg-muted-crimson/10 border border-muted-crimson/20 rounded-full flex items-center justify-center text-muted-crimson text-3xl font-extrabold mx-auto">
          ⚠️
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">Application Error</h2>
          <p className="text-xs text-muted-silver leading-relaxed">
            An unexpected error occurred during execution. This event has been logged to our monitoring dashboard.
          </p>
          <div className="p-3 bg-obsidian border border-border-slate rounded-lg text-left overflow-x-auto max-h-24">
            <code className="text-[10px] text-muted-crimson font-mono whitespace-pre-wrap">
              {error.message || "Unknown error details"}
            </code>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 py-2.5 bg-emerald-mint hover:bg-opacity-90 text-center text-xs font-bold text-obsidian rounded-md shadow-lg shadow-emerald-mint/10 transition-all cursor-pointer"
          >
            Try Again
          </button>
          <a
            href="/"
            className="flex-1 py-2.5 bg-slate-layer hover:bg-opacity-95 text-center text-xs font-semibold text-white border border-border-slate rounded-md transition-all cursor-pointer"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
