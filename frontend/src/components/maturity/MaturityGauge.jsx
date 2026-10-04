import React from 'react';
import { ShieldCheck, TrendingUp, AlertTriangle } from 'lucide-react';

export default function MaturityGauge({ score = 0, level = 'Managed', trend = 0 }) {
  const numScore = Math.min(100, Math.max(0, Number(score) || 0));

  let color = '#06b6d4'; // cyan
  let levelColor = 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';

  if (numScore >= 81) {
    color = '#10b981'; // emerald / optimized
    levelColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  } else if (numScore >= 61) {
    color = '#06b6d4'; // cyan / managed
    levelColor = 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
  } else if (numScore >= 41) {
    color = '#eab308'; // yellow / defined
    levelColor = 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
  } else {
    color = '#f43f5e'; // rose / developing
    levelColor = 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  }

  const dimensions = 150;
  const strokeWidth = 10;
  const radius = (dimensions - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (numScore / 100) * circumference;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl">
      {/* Gauge Circle */}
      <div className="relative inline-flex items-center justify-center" style={{ width: dimensions, height: dimensions }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${dimensions} ${dimensions}`}>
          <circle
            cx={dimensions / 2}
            cy={dimensions / 2}
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={dimensions / 2}
            cy={dimensions / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold font-mono text-slate-100 tracking-tight">
            {numScore.toFixed(1)}
          </span>
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
            out of 100
          </span>
        </div>
      </div>

      {/* Level and Info */}
      <div className="flex-1 text-center sm:text-left space-y-2">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Security Maturity Level:
          </span>
          <span className={`px-2.5 py-0.5 rounded text-xs font-bold border uppercase font-mono ${levelColor}`}>
            {level}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Derived through transparent evaluation of 10 operational categories across real-time security events,
          rule coverage, incident resolution efficiency, and SOC automation telemetry.
        </p>

        {trend !== undefined && (
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-emerald-400 font-semibold">
            <TrendingUp className="w-4 h-4" />
            <span>+{trend}% security posture gain over last 30 days</span>
          </div>
        )}
      </div>
    </div>
  );
}
