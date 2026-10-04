import React from 'react';

export default function ConfidenceGauge({ score = 0, size = 'md', showLabel = true }) {
  const numScore = Math.min(100, Math.max(0, Number(score) || 0));

  let color = '#10b981'; // emerald
  let label = 'Low Confidence';
  let badgeColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';

  if (numScore >= 85) {
    color = '#f43f5e'; // rose / critical
    label = 'High Confidence Malicious';
    badgeColor = 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  } else if (numScore >= 65) {
    color = '#f97316'; // orange / high
    label = 'Suspicious Activity';
    badgeColor = 'text-orange-400 border-orange-500/30 bg-orange-500/10';
  } else if (numScore >= 40) {
    color = '#eab308'; // yellow / medium
    label = 'Elevated Risk';
    badgeColor = 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
  }

  const dimensions = size === 'lg' ? 90 : size === 'sm' ? 44 : 64;
  const strokeWidth = size === 'lg' ? 7 : size === 'sm' ? 4 : 5;
  const radius = (dimensions - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (numScore / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      <div className="relative inline-flex items-center justify-center" style={{ width: dimensions, height: dimensions }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${dimensions} ${dimensions}`}>
          {/* Track */}
          <circle
            cx={dimensions / 2}
            cy={dimensions / 2}
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress */}
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
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span className={`absolute font-mono font-bold text-slate-100 ${size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>
          {Math.round(numScore)}%
        </span>
      </div>

      {showLabel && (
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">AI Confidence</span>
          <span className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-semibold rounded border ${badgeColor}`}>
            {label}
          </span>
        </div>
      )}
    </div>
  );
}
