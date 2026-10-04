import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Play,
  ShieldAlert,
  Cpu,
  Dna,
  AlertOctagon,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Flame,
  Activity,
  Layers,
} from 'lucide-react';
import { simulationApi, playbooksApi } from '../services/api';
import PipelineProgress from '../components/simulation/PipelineProgress';
import SeverityBadge from '../components/common/SeverityBadge';
import ConfidenceGauge from '../components/common/ConfidenceGauge';
import ThreatDNA from '../components/threats/ThreatDNA';
import PlaybookExecutionModal from '../components/playbooks/PlaybookExecutionModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/common/ErrorState';
import { useNotification } from '../context/NotificationContext';

export default function AttackSimulationPage() {
  const { showToast } = useNotification();

  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Execution State
  const [selectedScenarioId, setSelectedScenarioId] = useState('brute-force');
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [pipelineStage, setPipelineStage] = useState('Idle');

  // Playbook execution modal
  const [playbookModalData, setPlaybookModalData] = useState(null);

  const fetchScenarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await simulationApi.getScenarios();
      setScenarios(data);
      if (data.length > 0 && !selectedScenarioId) {
        setSelectedScenarioId(data[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  const handleRunSimulation = async () => {
    setSimulating(true);
    setSimulationResult(null);

    try {
      // Animate stages for realistic user experience
      setPipelineStage('Trigger');
      await new Promise((r) => setTimeout(r, 400));
      setPipelineStage('Ingestion');
      await new Promise((r) => setTimeout(r, 450));
      setPipelineStage('Detection');
      await new Promise((r) => setTimeout(r, 450));
      setPipelineStage('AI');
      await new Promise((r) => setTimeout(r, 450));
      setPipelineStage('DNA');
      await new Promise((r) => setTimeout(r, 400));

      const res = await simulationApi.runSimulation({
        scenario_id: selectedScenarioId,
      });

      setPipelineStage('Incident');
      await new Promise((r) => setTimeout(r, 350));
      setPipelineStage('Playbook');

      setSimulationResult(res);
      showToast(`Simulation completed: ${res.events_generated} logs ingested, threat detected & incident opened!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
      setPipelineStage('Idle');
    } finally {
      setSimulating(false);
    }
  };

  const handleLaunchPlaybookFromSimulation = async () => {
    if (!simulationResult?.recommended_playbook?.playbook_id) return;
    try {
      const pb = await playbooksApi.getPlaybook(simulationResult.recommended_playbook.playbook_id);
      setPlaybookModalData(pb);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/30 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Terminal className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-100 font-mono">
              DEFENSIVE ATTACK SIMULATION SANDBOX
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Safely inject synthetic cyber adversary events to exercise the complete end-to-end VIGILIX detection & response pipeline.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold self-start md:self-auto">
          Defensive Sandbox Mode • Safe Isolation
        </div>
      </div>

      {/* Live Pipeline Visualizer */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="uppercase tracking-wider font-bold">End-to-End Pipeline Progression:</span>
          <span className="text-cyan-400">Current Phase: {pipelineStage}</span>
        </div>
        <PipelineProgress activeStage={pipelineStage} />
      </div>

      {/* Scenarios Picker & Launcher */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario Selection Column */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
            Select Attack Scenario ({scenarios.length})
          </h3>

          <div className="space-y-2">
            {scenarios.map((sc) => (
              <button
                key={sc.id}
                onClick={() => {
                  setSelectedScenarioId(sc.id);
                  setSimulationResult(null);
                  setPipelineStage('Idle');
                }}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  selectedScenarioId === sc.id
                    ? 'border-cyan-500 bg-cyan-950/20 shadow-md shadow-cyan-950/40'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{sc.name}</span>
                  <SeverityBadge severity={sc.severity} size="sm" />
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{sc.category}</span>
                  <span className="text-cyan-400">{sc.mitre_technique}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Scenario Execution Details */}
        {currentScenario && (
          <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 font-semibold uppercase">
                    Scenario Specifications
                  </span>
                  <h2 className="text-base font-bold text-slate-100">{currentScenario.name}</h2>
                </div>
                <SeverityBadge severity={currentScenario.severity} size="lg" />
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {currentScenario.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs">
                <div><span className="text-slate-500">Target Asset:</span> <strong className="text-slate-200">{currentScenario.target_asset_default}</strong></div>
                <div><span className="text-slate-500">Attacker Origin:</span> <strong className="text-slate-200">{currentScenario.source_ip_default}</strong></div>
                <div><span className="text-slate-500">MITRE Technique:</span> <span className="text-cyan-300 font-bold">{currentScenario.mitre_technique}</span></div>
              </div>

              {/* Attack Sequence Steps */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase text-slate-400 font-bold tracking-wider">
                  Adversary Emulation Sequence:
                </span>
                <ol className="space-y-1 text-xs text-slate-300 font-mono list-decimal list-inside">
                  {currentScenario.attack_steps?.map((step, idx) => (
                    <li key={idx} className="leading-snug">{step}</li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                Generates ~{currentScenario.estimated_events} synthetic telemetry logs into SIEM.
              </span>

              <button
                onClick={handleRunSimulation}
                disabled={simulating}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-xl shadow-cyan-950/50 transition disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                {simulating ? 'Emulating Attack Pipeline...' : 'Run Attack Simulation'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Simulation Result Presentation Banner */}
      {simulationResult && (
        <div className="space-y-5 p-6 rounded-xl bg-slate-900 border border-cyan-500/40 shadow-2xl animate-in fade-in">
          {/* Result Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Simulation Pipeline Succeeded: Threat Flagged & Incident Opened
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Generated {simulationResult.events_generated} security logs. Detection engine triggered AI scoring and recommended response playbook.
              </p>
            </div>

            <button
              onClick={handleLaunchPlaybookFromSimulation}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition shrink-0"
            >
              <BookOpen className="w-4 h-4" />
              Execute Playbook: {simulationResult.recommended_playbook?.playbook_id}
            </button>
          </div>

          {/* Threat DNA Output Card */}
          {simulationResult.threat_detected?.threat_dna && (
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                Generated Threat DNA Fingerprint:
              </span>
              <ThreatDNA dna={simulationResult.threat_detected.threat_dna} />
            </div>
          )}

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500">Threat ID:</span>
              <div className="font-bold text-cyan-400">{simulationResult.threat_detected?.threat_id}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500">AI Confidence:</span>
              <div className="font-bold text-rose-400">{simulationResult.threat_detected?.confidence_score?.toFixed(1)}%</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500">Incident Declared:</span>
              <div className="font-bold text-slate-200">{simulationResult.incident_created?.incident_id}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500">Playbook Ready:</span>
              <div className="font-bold text-emerald-400">{simulationResult.recommended_playbook?.playbook_id}</div>
            </div>
          </div>

          {/* Execution Timeline */}
          <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Pipeline Execution Trace:
            </span>
            <div className="space-y-1.5 font-mono text-xs">
              {simulationResult.execution_timeline?.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-300">
                  <span className="text-cyan-400 shrink-0">[{step.stage}]:</span>
                  <span>{step.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Playbook Execution Modal */}
      {playbookModalData && (
        <PlaybookExecutionModal
          isOpen={!!playbookModalData}
          onClose={() => setPlaybookModalData(null)}
          playbook={playbookModalData}
          incidentId={simulationResult?.incident_created?.incident_id}
          onSuccess={() => {
            showToast('Incident transitioned to Resolved after playbook execution!', 'success');
          }}
        />
      )}
    </div>
  );
}
