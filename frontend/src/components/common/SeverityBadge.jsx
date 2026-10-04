import React from 'react';

export default function SeverityBadge({ severity = 'low', size = 'sm' }) {
  const sev = String(severity).toLowerCase();

  const styles = {
    critical: 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse-subtle',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  };

  const currentStyle = styles[sev] || styles.low;
  const sizeClasses = size === 'lg' ? 'px-3 py-1 text-xs font-bold' : 'px-2 py-0.5 text-[11px] font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border uppercase tracking-wider ${sizeClasses} ${currentStyle}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          sev === 'critical'
            ? 'bg-rose-500'
            : sev === 'high'
            ? 'bg-orange-500'
            : sev === 'medium'
            ? 'bg-amber-500'
            : sev === 'info'
            ? 'bg-cyan-500'
            : 'bg-emerald-500'
        }`}
      />
      {sev}
    </span>
  );
}
