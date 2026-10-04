import React from 'react';
import { Play, FileText, ShieldAlert, Cpu, Dna, AlertOctagon, BookOpen, CheckCircle2 } from 'lucide-react';

export default function PipelineProgress({ activeStage = 'Idle' }) {
  const stages = [
    { id: 'Trigger', label: 'Scenario Trigger', icon: Play },
    { id: 'Ingestion', label: 'Telemetry Ingested', icon: FileText },
    { id: 'Detection', label: 'SOC Rules Fired', icon: ShieldAlert },
    { id: 'AI', label: 'AI Threat Scoring', icon: Cpu },
    { id: 'DNA', label: 'Threat DNA Gen', icon: Dna },
    { id: 'Incident', label: 'Incident Created', icon: AlertOctagon },
    { id: 'Playbook', label: 'Playbook Ready', icon: BookOpen },
  ];

  const stageOrder = ['Idle', 'Trigger', 'Ingestion', 'Detection', 'AI', 'DNA', 'Incident', 'Playbook', 'Completed'];
  const currentIndex = stageOrder.indexOf(activeStage);

  return (
    <div className="w-full p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur">
      <div className="flex items-center justify-between overflow-x-auto gap-2 py-2">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const stageIndex = stageOrder.indexOf(stage.id);
          const isDone = currentIndex >= stageIndex && currentIndex > 0;
          const isCurrent = activeStage === stage.id;

          return (
            <React.Fragment key={stage.id}>
              <div className="flex flex-col items-center gap-1.5 min-w-[100px] shrink-0 text-center">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                    isCurrent
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-lg shadow-cyan-500/30 scale-105 animate-pulse'
                      : isDone
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                      : 'border-slate-800 bg-slate-950 text-slate-500'
                  }`}
                >
                  {isDone && !isCurrent ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={`text-[11px] font-mono font-medium tracking-tight ${
                    isCurrent
                      ? 'text-cyan-300 font-bold'
                      : isDone
                      ? 'text-slate-200'
                      : 'text-slate-500'
                  }`}
                >
                  {stage.label}
                </span>
              </div>

              {idx < stages.length - 1 && (
                <div
                  className={`h-0.5 flex-1 min-w-[20px] transition-colors duration-300 ${
                    currentIndex > stageIndex ? 'bg-emerald-500/60' : 'bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
