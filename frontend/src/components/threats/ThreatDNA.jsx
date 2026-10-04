import React from 'react';
import { Dna, ShieldAlert, Cpu, Network, Target, Radio, Database, Lock } from 'lucide-react';
import SeverityBadge from '../common/SeverityBadge';

export default function ThreatDNA({ dna, compact = false }) {
  if (!dna) return null;

  const items = [
    { label: 'Threat Type', value: dna.threat_type, icon: ShieldAlert, highlight: true },
    { label: 'Attack Vector', value: dna.attack_vector, icon: Network },
    { label: 'MITRE Technique', value: dna.mitre, icon: Lock, badge: true },
    { label: 'Behavior', value: dna.behavior, icon: Cpu },
    { label: 'Target Asset', value: dna.target, icon: Target },
    { label: 'Threat Origin', value: dna.source, icon: Radio },
    { label: 'Anomaly Deviation', value: dna.anomaly, icon: Dna, alert: true },
    { label: 'Persistence Vector', value: dna.persistence || 'None Observed', icon: Database },
    { label: 'Exfiltration Method', value: dna.exfiltration || 'None Observed', icon: Network },
  ];

  if (compact) {
    return (
      <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3 space-y-2 font-mono text-xs">
        <div className="flex items-center justify-between text-[11px] pb-1 border-b border-slate-800 text-cyan-400 font-bold">
          <span className="flex items-center gap-1.5">
            <Dna className="w-3.5 h-3.5" /> THREAT DNA
          </span>
          <span className="text-[10px] text-slate-500">{dna.dna_signature || 'VIGILIX-SIG'}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div><span className="text-slate-500">Type:</span> <span className="text-slate-200">{dna.threat_type}</span></div>
          <div><span className="text-slate-500">MITRE:</span> <span className="text-cyan-300">{dna.mitre}</span></div>
          <div><span className="text-slate-500">Target:</span> <span className="text-slate-200">{dna.target}</span></div>
          <div><span className="text-slate-500">Anomaly:</span> <span className="text-amber-400">{dna.anomaly}</span></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-cyan-500/30 p-5 shadow-xl shadow-cyan-950/20 backdrop-blur-md overflow-hidden">
      {/* Background Cyber DNA Watermark */}
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Dna className="w-64 h-64 text-cyan-400" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Dna className="w-5 h-5 animate-pulse-subtle" />
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-wider text-slate-100 uppercase font-mono flex items-center gap-2">
              THREAT DNA FINGERPRINT
            </h4>
            <span className="text-[11px] text-cyan-400/80 font-mono">
              {dna.dna_signature || 'VIGILIX-STANDARDIZED-SIG'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dna.severity && <SeverityBadge severity={dna.severity} size="lg" />}
          {dna.confidence && (
            <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-200">
              {dna.confidence}
            </span>
          )}
        </div>
      </div>

      {/* Attribute Grid */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                <Icon className="w-3.5 h-3.5 text-cyan-400/70" />
                <span>{item.label}</span>
              </div>
              <div className="mt-1.5 text-xs font-semibold text-slate-200 break-words font-mono">
                {item.badge ? (
                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    {item.value}
                  </span>
                ) : item.alert ? (
                  <span className="text-amber-400">{item.value}</span>
                ) : (
                  item.value
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
