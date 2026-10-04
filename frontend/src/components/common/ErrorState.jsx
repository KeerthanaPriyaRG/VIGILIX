import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({
  title = 'Failed to load telemetry',
  message = 'An error occurred while communicating with the backend API.',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-rose-950/20 border border-rose-500/30 text-center my-4">
      <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
      <h3 className="text-sm font-semibold text-rose-200">{title}</h3>
      <p className="mt-1 text-xs text-rose-300/80 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-medium transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Connection
        </button>
      )}
    </div>
  );
}
