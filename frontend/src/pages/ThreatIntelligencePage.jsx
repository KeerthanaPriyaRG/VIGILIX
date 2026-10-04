import React, { useState, useEffect } from 'react';
import {
  Crosshair,
  Shield,
  Lock,
  Globe,
  Database,
  Radio,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { threatsApi } from '../services/api';
import SeverityBadge from '../components/common/SeverityBadge';
import ConfidenceGauge from '../components/common/ConfidenceGauge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/common/ErrorState';
import ThreatDNA from '../components/threats/ThreatDNA';
import Modal from '../components/common/Modal';

const MITRE_MATRIX = [
  { tactic: 'Initial Access', technique: 'T1078 (Valid Accounts)', count: 8, severity: 'high' },
  { tactic: 'Execution', technique: 'T1059.001 (PowerShell)', count: 6, severity: 'critical' },
  { tactic: 'Persistence', technique: 'T1098 (Account Manipulation)', count: 4, severity: 'high' },
  { tactic: 'Privilege Escalation', technique: 'T1068 (Exploitation for Privilege)', count: 5, severity: 'critical' },
  { tactic: 'Defense Evasion', technique: 'T1562 (Impair Defenses)', count: 3, severity: 'medium' },
  { tactic: 'Credential Access', technique: 'T1110 (Brute Force)', count: 12, severity: 'critical' },
  { tactic: 'Discovery', technique: 'T1046 (Network Service Scan)', count: 9, severity: 'medium' },
  { tactic: 'Exfiltration', technique: 'T1048 (Exfiltration Over Protocol)', count: 4, severity: 'critical' },
];

const COLORS = ['#06b6d4', '#8b5cf6', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6'];

export default function ThreatIntelligencePage() {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedThreatDna, setSelectedThreatDna] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');

  const fetchThreats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await threatsApi.getThreats({
        severity: filterSeverity !== 'all' ? filterSeverity : undefined,
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
  }, [filterSeverity]);

  if (loading) return <LoadingSpinner message="Querying global threat intelligence and MITRE mappings..." />;
  if (error) return <ErrorState message={error} onRetry={fetchThreats} />;

  // Aggregating threat tactics for pie chart
  const tacticCounts = threats.reduce((acc, t) => {
    const stage = t.attack_stage || 'Initial Access';
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(tacticCounts).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-mono">
            <Crosshair className="w-5 h-5 text-cyan-400" />
            THREAT INTELLIGENCE & ATTACK TAXONOMY
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            MITRE ATT&CK enterprise tactics, indicators of compromise (IOCs), and adversary profiling.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 font-mono"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button
            onClick={fetchThreats}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MITRE ATT&CK Matrix Grid */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            MITRE ATT&CK Enterprise Tactical Heat-Grid
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">v14.1 Framework</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-2">
          {MITRE_MATRIX.map((m, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border text-center space-y-1.5 transition ${
                m.severity === 'critical'
                  ? 'border-rose-500/40 bg-rose-950/20'
                  : m.severity === 'high'
                  ? 'border-orange-500/40 bg-orange-950/20'
                  : 'border-cyan-500/40 bg-cyan-950/20'
              }`}
            >
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {m.tactic}
              </div>
              <div className="text-xs font-mono font-bold text-slate-100 truncate" title={m.technique}>
                {m.technique.split(' ')[0]}
              </div>
              <div className="text-[11px] font-mono text-cyan-300">
                {m.count} hits
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts & Tactic Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attack Stage Breakdown */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
            Observed Attack Kill Chain Stages
          </h3>

          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '11px', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Threat Feed Indicators (IOCs) */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              Active Indicators of Compromise (IOCs)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Automated correlation across Tor exit relays, bulletproof hosters, and suspicious ASN ranges.
            </p>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {[
              { type: 'IP (Tor Exit)', val: '185.220.101.5', score: '98/100', threat: 'Brute Force Spray' },
              { type: 'IP (Proxy)', val: '194.26.29.88', score: '84/100', threat: 'SYN Reconnaissance' },
              { type: 'SHA-256', val: 'e3b0c44298fc1c149afbf4c8996fb924...', score: '99/100', threat: 'Cobalt Strike Beacon' },
              { type: 'Domain', val: 'telemetry-cdn-sync.xyz', score: '91/100', threat: 'Data Exfiltration' },
            ].map((ioc, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300"
              >
                <div>
                  <span className="text-[10px] text-cyan-400 uppercase font-bold mr-2">{ioc.type}:</span>
                  <span className="text-slate-100">{ioc.val}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">{ioc.threat}</span>
                  <span className="px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                    {ioc.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Threat Profiles Table */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
          Correlated Threat Profiles & DNA Fingerprints
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-slate-400 uppercase text-[10px] border-b border-slate-800 bg-slate-950/40">
              <tr>
                <th className="py-2.5 px-3">Threat Type</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Attack Stage</th>
                <th className="py-2.5 px-3">MITRE Technique</th>
                <th className="py-2.5 px-3">AI Confidence</th>
                <th className="py-2.5 px-3 text-right">DNA Fingerprint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {threats.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{t.threat_type}</td>
                  <td className="py-2.5 px-3"><SeverityBadge severity={t.severity} /></td>
                  <td className="py-2.5 px-3 text-slate-300">{t.attack_stage}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px]">
                      {t.mitre_technique || 'T1078'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <ConfidenceGauge score={t.confidence_score} size="sm" showLabel={false} />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => setSelectedThreatDna(t.threat_dna)}
                      className="px-2.5 py-1 rounded bg-cyan-600/80 hover:bg-cyan-500 text-white text-[10px] font-semibold"
                    >
                      View DNA
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DNA Inspection Modal */}
      <Modal
        isOpen={!!selectedThreatDna}
        onClose={() => setSelectedThreatDna(null)}
        title="Standardized Threat DNA Fingerprint"
        maxWidth="max-w-4xl"
      >
        <ThreatDNA dna={selectedThreatDna} />
      </Modal>
    </div>
  );
}
