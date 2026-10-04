import React, { useState } from 'react';
import { Play, CheckCircle2, Loader2, Terminal, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import { playbooksApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

export default function PlaybookExecutionModal({
  isOpen,
  onClose,
  playbook,
  incidentId,
  onSuccess,
}) {
  const { showToast } = useNotification();
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  if (!playbook) return null;

  const handleRunExecution = async () => {
    setExecuting(true);
    setExecutionResult(null);
    setActiveStepIndex(0);

    try {
      // Simulate step progression
      const steps = playbook.steps || [];
      for (let i = 0; i < steps.length; i++) {
        setActiveStepIndex(i);
        await new Promise((resolve) => setTimeout(resolve, 350));
      }

      const res = await playbooksApi.executePlaybook(playbook.playbook_id, {
        incident_id: incidentId,
        simulation_mode: true,
      });

      setExecutionResult(res);
      showToast(`Playbook '${playbook.name}' executed successfully!`, 'success');
      if (onSuccess) onSuccess(res);
    } catch (err) {
      showToast(err.message || 'Playbook execution failed', 'error');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Execute Playbook: ${playbook.name}`}
      subtitle={`ID: ${playbook.playbook_id} • Target Threat: ${playbook.threat_type}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-300">{playbook.description}</p>

        {incidentId && (
          <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 flex items-center justify-between font-mono">
            <span>Linked Incident Target: <strong>{incidentId}</strong></span>
            <span className="text-[10px] text-cyan-400">Lifecycle will advance automatically</span>
          </div>
        )}

        {/* Steps List */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
            Playbook Workflow Steps ({playbook.steps?.length || 0})
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {playbook.steps?.map((step, idx) => {
              const isCurrent = executing && activeStepIndex === idx;
              const isPast = (executing && activeStepIndex > idx) || executionResult;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs transition ${
                    isCurrent
                      ? 'border-cyan-500 bg-cyan-950/20 text-cyan-200'
                      : isPast
                      ? 'border-emerald-500/30 bg-emerald-950/10 text-slate-200'
                      : 'border-slate-800 bg-slate-950/50 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isCurrent ? (
                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                      ) : isPast ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-500">
                          {idx + 1}
                        </span>
                      )}
                      <span className="font-semibold text-slate-100">{step.title}</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-400">
                      {step.phase}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400 pl-6">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Execution Output Console */}
        {executionResult && (
          <div className="p-3.5 rounded-lg bg-slate-950 border border-emerald-500/30 font-mono text-[11px] text-emerald-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-xs mb-2">
              <Terminal className="w-4 h-4" /> SOAR Execution Log Stream:
            </div>
            {executionResult.logs?.map((log, i) => (
              <div key={i} className="leading-relaxed">
                <span className="text-slate-500">[{log.phase}]</span> {log.simulated_command}
                <div className="text-slate-400 pl-4">{log.output}</div>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            {executionResult ? 'Close' : 'Cancel'}
          </button>
          {!executionResult && (
            <button
              onClick={handleRunExecution}
              disabled={executing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/50 transition disabled:opacity-50"
            >
              {executing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Executing SOAR Steps...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Automated Simulation
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
