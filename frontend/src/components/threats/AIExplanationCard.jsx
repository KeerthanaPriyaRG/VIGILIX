import React from 'react';
import { Cpu, AlertCircle, CheckCircle2, TrendingUp, Info } from 'lucide-react';

export default function AIExplanationCard({
  confidenceScore = 0,
  breakdown,
  explanation,
  contributingFactors = [],
  adaptiveModifier = 1.0,
}) {
  const metrics = [
    { label: 'AI Model Probability', weight: '35%', val: breakdown?.ai_model ?? 84.0, color: 'bg-cyan-500' },
    { label: 'Anomaly Detection', weight: '20%', val: breakdown?.anomaly_detection ?? 76.5, color: 'bg-purple-500' },
    { label: 'SOC Rule Match', weight: '30%', val: breakdown?.rule_match ?? 95.0, color: 'bg-rose-500' },
    { label: 'Historical Correlation', weight: '15%', val: breakdown?.historical_correlation ?? 88.0, color: 'bg-amber-500' },
  ];

  return (
    <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <h4 className="text-sm font-semibold text-slate-100">
            AI Threat Confidence Decomposition & Explainability
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Adaptive Trust:</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-300 font-bold">
            {adaptiveModifier ? `${(adaptiveModifier * 100).toFixed(1)}%` : '100%'}
          </span>
        </div>
      </div>

      {/* 4-Factor Decomposition Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((m, idx) => (
          <div key={idx} className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80">
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span className="font-medium">{m.label} ({m.weight})</span>
              <span className="font-mono font-bold">{m.val.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`${m.color} h-full rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(100, Math.max(0, m.val))}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Contributing Factors */}
      {contributingFactors && contributingFactors.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>Key Contributing Risk Factors:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {contributingFactors.map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/60 text-xs"
              >
                <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 font-mono font-bold shrink-0">
                  {f.weight}
                </span>
                <div>
                  <div className="font-semibold text-slate-200">{f.factor}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{f.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Textual Justification */}
      {explanation && (
        <div className="p-3.5 rounded-lg bg-slate-950/70 border border-cyan-500/20 text-xs text-slate-300 whitespace-pre-line font-mono leading-relaxed">
          <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" /> Model Decision Rationale
          </div>
          {explanation}
        </div>
      )}
    </div>
  );
}
