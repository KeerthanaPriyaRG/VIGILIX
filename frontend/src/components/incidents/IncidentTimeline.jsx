import React from 'react';
import { Clock, CheckCircle, ShieldCheck, AlertCircle, PlayCircle } from 'lucide-react';

export default function IncidentTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-xs text-slate-500 italic p-4 text-center">
        No timeline events recorded for this incident yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
      {timeline.map((item, index) => {
        let Icon = Clock;
        let iconBg = 'bg-slate-800 text-slate-400 border-slate-700';

        if (item.action.toLowerCase().includes('contained')) {
          Icon = ShieldCheck;
          iconBg = 'bg-orange-500/20 text-orange-400 border-orange-500/40';
        } else if (item.action.toLowerCase().includes('resolved') || item.action.toLowerCase().includes('closed')) {
          Icon = CheckCircle;
          iconBg = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
        } else if (item.action.toLowerCase().includes('action') || item.action.toLowerCase().includes('playbook')) {
          Icon = PlayCircle;
          iconBg = 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
        } else if (item.action.toLowerCase().includes('declared') || item.action.toLowerCase().includes('alert')) {
          Icon = AlertCircle;
          iconBg = 'bg-rose-500/20 text-rose-400 border-rose-500/40';
        }

        return (
          <div key={item.id || index} className="relative group">
            {/* Dot / Icon */}
            <div
              className={`absolute -left-[27px] top-0.5 w-6 h-6 rounded-full border flex items-center justify-center ${iconBg} shadow-md`}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>

            {/* Content */}
            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-200">{item.action}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(item.timestamp).toLocaleTimeString()} • {new Date(item.timestamp).toLocaleDateString()}
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-300">{item.description}</p>

              <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                <span>
                  Actor: <strong className="text-slate-300 font-medium">{item.actor}</strong>
                </span>
                {item.status_transition && (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-400 border border-slate-700">
                    {item.status_transition}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
