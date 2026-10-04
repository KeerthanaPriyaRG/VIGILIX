import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Cpu,
  RefreshCw,
  Dna,
  Lock,
  Target,
  Radio,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { threatsApi, incidentsApi } from '../services/api';
import SeverityBadge from '../components/common/SeverityBadge';
import ConfidenceGauge from '../components/common/ConfidenceGauge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import ThreatDNA from '../components/threats/ThreatDNA';
import AIExplanationCard from '../components/threats/AIExplanationCard';
import { useNotification } from '../context/NotificationContext';

export default function ThreatsPage() {
  const { showToast } = useNotification();

  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('all');
  const [status, setStatus] = useState('all');

  // Selected Threat for Inspection Drawer
  const [inspectThreat, setInspectThreat] = useState(null);

  const fetchThreats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await threatsApi.getThreats({
        severity: severity !== 'all' ? severity : undefined,
        status: status !== 'all' ? status : undefined,
        search: search || undefined,
      });
      setThreats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreats();
  }, [severity, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchThreats();
  };

  const handleUpdateStatus = async (threatId, newStatus) => {
    try {
      await threatsApi.updateStatus(threatId, newStatus);
      showToast(`Threat status updated to ${newStatus}.`, 'success');
      fetchThreats();
      if (inspectThreat) {
        setInspectThreat((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-mono">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            THREAT DETECTION & AI CONFIDENCE BOARD
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active threat detections scored with multi-factor AI confidence, MITRE techniques, and Threat DNA.
          </p>
        </div>

        <button
          onClick={fetchThreats}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by threat ID, type, target asset, source IP, or MITRE..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-mono">Severity:</span>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-mono">Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Mitigated">Mitigated</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Threats Grid */}
      {loading ? (
        <LoadingSpinner message="Evaluating active threat intelligence..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchThreats} />
      ) : threats.length === 0 ? (
        <EmptyState
          title="No active threats"
          description="No security threats match the specified search or filter parameters."
          actionText="Reset Filters"
          onAction={() => { setSearch(''); setSeverity('all'); setStatus('all'); }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {threats.map((threat) => (
            <div
              key={threat.id}
              className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-lg"
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold uppercase">
                      {threat.threat_id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-100">{threat.threat_type}</h3>
                  </div>
                  <SeverityBadge severity={threat.severity} />
                </div>

                {/* AI Confidence Meter */}
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <ConfidenceGauge score={threat.confidence_score} size="md" showLabel={true} />
                </div>
              </div>

              {/* Context Details */}
              <div className="space-y-1.5 text-xs font-mono text-slate-300 pt-1 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" /> Target:
                  </span>
                  <span className="text-slate-200 font-semibold">{threat.affected_asset}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Radio className="w-3.5 h-3.5" /> Origin:
                  </span>
                  <span className="text-slate-400">{threat.source || 'Unknown'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> MITRE:
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px]">
                    {threat.mitre_technique || 'T1078'}
                  </span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                  threat.status === 'Resolved'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : threat.status === 'Active'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {threat.status}
                </span>

                <button
                  onClick={() => setInspectThreat(threat)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
                >
                  <Dna className="w-3.5 h-3.5" /> Inspect DNA
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Threat Inspection Modal */}
      <Modal
        isOpen={!!inspectThreat}
        onClose={() => setInspectThreat(null)}
        title={`Threat Profile • ${inspectThreat?.threat_id}`}
        subtitle={`Detected ${new Date(inspectThreat?.created_at).toLocaleString()}`}
        maxWidth="max-w-4xl"
      >
        {inspectThreat && (
          <div className="space-y-5">
            {/* Status Changer Bar */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Current Status:</span>
                <span className="text-xs font-bold text-slate-200">{inspectThreat.status}</span>
              </div>
              <div className="flex items-center gap-2">
                {['Active', 'Under Investigation', 'Mitigated', 'Resolved'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(inspectThreat.threat_id, st)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono transition ${
                      inspectThreat.status === st
                        ? 'bg-cyan-500 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Mark {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Threat DNA Fingerprint */}
            <ThreatDNA dna={inspectThreat.threat_dna} />

            {/* AI Explanation and Decomposition */}
            <AIExplanationCard
              confidenceScore={inspectThreat.confidence_score}
              breakdown={{
                ai_model: inspectThreat.model_probability,
                anomaly_detection: inspectThreat.anomaly_score,
                rule_match: inspectThreat.rule_score,
                historical_correlation: inspectThreat.correlation_score,
              }}
              explanation={inspectThreat.explanation}
              contributingFactors={[
                { factor: 'Rule Match Strength', weight: `${inspectThreat.rule_score?.toFixed(0)}%`, description: `Matched security rule pattern for ${inspectThreat.threat_type}` },
                { factor: 'Isolation Forest Anomaly', weight: `${inspectThreat.anomaly_score?.toFixed(0)}%`, description: 'Telemetry pattern deviation from baseline' }
              ]}
            />

            {/* Recommended Action */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                Recommended Response Action
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-mono">
                {inspectThreat.recommended_action}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
