import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendDirection = 'neutral',
  icon: Icon,
  variant = 'cyan', // cyan, rose, amber, emerald, purple
}) {
  const variantStyles = {
    cyan: 'border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 bg-cyan-500/5',
    rose: 'border-rose-500/20 hover:border-rose-500/40 text-rose-400 bg-rose-500/5',
    amber: 'border-amber-500/20 hover:border-amber-500/40 text-amber-400 bg-amber-500/5',
    emerald: 'border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 bg-emerald-500/5',
    purple: 'border-purple-500/20 hover:border-purple-500/40 text-purple-400 bg-purple-500/5',
  };

  const currentVariant = variantStyles[variant] || variantStyles.cyan;

  return (
    <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-cyan-950/20">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-lg border ${currentVariant}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <div className="text-3xl font-bold tracking-tight text-slate-100 font-mono">
          {value}
        </div>
        {trend && (
          <div
            className={`flex items-center text-xs font-semibold ${
              trendDirection === 'up'
                ? 'text-emerald-400'
                : trendDirection === 'down'
                ? 'text-rose-400'
                : 'text-slate-400'
            }`}
          >
            {trendDirection === 'up' && <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
            {trendDirection === 'down' && <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
            {trend}
          </div>
        )}
      </div>

      {subtitle && (
        <div className="mt-1 text-xs text-slate-400">
          {subtitle}
        </div>
      )}
    </div>
  );
}
