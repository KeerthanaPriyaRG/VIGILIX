import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading security telemetry...', size = 'md' }) {
  const sizeClasses = size === 'lg' ? 'w-10 h-10' : size === 'sm' ? 'w-5 h-5' : 'w-7 h-7';

  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
      <Loader2 className={`${sizeClasses} text-cyan-500 animate-spin`} />
      <span className="text-xs font-medium tracking-wide text-slate-400">{message}</span>
    </div>
  );
}
