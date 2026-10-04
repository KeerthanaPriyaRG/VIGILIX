import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function EmptyState({
  title = 'No records found',
  description = 'There are currently no security records matching the specified criteria.',
  icon: Icon = ShieldAlert,
  actionText,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl bg-slate-900/40 border border-slate-800/80 my-4">
      <div className="p-3 rounded-full bg-slate-800 text-slate-400 mb-3">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      <p className="mt-1 text-xs text-slate-400 max-w-sm">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
