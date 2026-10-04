import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  AlertOctagon,
  Activity,
  Cpu,
  CheckCircle2,
  Clock,
  Gauge,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

import { dashboardApi } from '../services/api';
import MetricCard from '../components/common/MetricCard';
import SeverityBadge from '../components/common/SeverityBadge';
import ConfidenceGauge from '../components/common/ConfidenceGauge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/common/ErrorState';
import ThreatDNA from '../components/threats/ThreatDNA';
import Modal from '../components/common/Modal';

const SEVERITY_COLORS = {
  critical: '#f43f5e',
  high: '#f97316',
  medium: '#eab308',
  low: '#10b981',
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedThreatDna, setSelectedThreatDna] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getSummary();
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner message="Aggregating enterprise SOC telemetry and AI models..." size="lg" />;
  if (error) return <ErrorState message={error} onRetry={fetchDashboard} />;
  if (!data) return null;

  const { metrics, threat_distribution, recent_threats, recent_incidents, recent_logs, ai_insights } = data;

  // Formatting chart data
  const severityChartData = [
    { name: 'Critical', count: threat_distribution.by_severity.critical || 0, color: SEVERITY_COLORS.critical },
    { name: 'High', count: threat_distribution.by_severity.high || 0, color: SEVERITY_COLORS.high },
    { name: 'Medium', count: threat_distribution.by_severity.medium || 0, color: SEVERITY_COLORS.medium },
    { name: 'Low', count: threat_distribution.by_severity.low || 0, color: SEVERITY_COLORS.low },
  ];

  const typeChartData = Object.entries(threat_distribution.by_type || {})
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({ type, count }));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>SOC Intelligence & Defense Operations</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
              Live Real-Time
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitoring telemetry feeds, AI threat scoring, incident lifecycles, and maturity posture.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/simulation"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/40 transition"
          >
            <Terminal className="w-3.5 h-3.5" />
            Attack Simulation
          </Link>
          <button
            onClick={fetchDashboard}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top 8 Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Security Maturity"
          value={`${metrics.security_maturity_score.toFixed(1)}/100`}
          subtitle={`Tier: ${metrics.maturity_level}`}
          trend="+3.8%"
          trendDirection="up"
          icon={Gauge}
          variant="cyan"
        />
        <MetricCard
          title="Active Threats"
          value={metrics.active_threats}
          subtitle="Requiring active triage"
          trend="Live"
          trendDirection="neutral"
          icon={ShieldAlert}
          variant="rose"
        />
        <MetricCard
          title="Critical Incidents"
          value={metrics.critical_incidents}
          subtitle="P1 High-impact"
          trend={metrics.critical_incidents > 0 ? "Action Required" : "Zero Critical"}
          trendDirection={metrics.critical_incidents > 0 ? "down" : "up"}
          icon={AlertOctagon}
          variant="amber"
        />
        <MetricCard
          title="Events Analyzed"
          value={metrics.events_analyzed.toLocaleString()}
          subtitle="Ingested security logs"
          trend="100% Normalized"
          trendDirection="up"
          icon={Activity}
          variant="purple"
        />
        <MetricCard
          title="Threats Detected"
          value={metrics.threats_detected}
          subtitle="Heuristic + ML flagged"
          trend="Multi-vector"
          trendDirection="neutral"
          icon={ShieldAlert}
          variant="cyan"
        />
        <MetricCard
          title="Avg AI Confidence"
          value={`${metrics.avg_ai_confidence.toFixed(1)}%`}
          subtitle="Scored via Random Forest"
          trend="High Accuracy"
          trendDirection="up"
          icon={Cpu}
          variant="cyan"
        />
        <MetricCard
          title="Resolution Rate"
          value={`${metrics.incident_resolution_rate.toFixed(1)}%`}
          subtitle={`${metrics.incidents_resolved} cases resolved`}
          trend="SOAR accelerated"
          trendDirection="up"
          icon={CheckCircle2}
          variant="emerald"
        />
        <MetricCard
          title="Mean Response Time"
          value={`${metrics.mean_response_time_minutes}m`}
          subtitle="MTTR Containment speed"
          trend="-18% vs benchmark"
          trendDirection="up"
          icon={Clock}
          variant="emerald"
        />
      </div>

      {/* Charts Section: Severity Distribution & Threat Types */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Distribution */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Threats by Severity
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              {metrics.threats_detected} Total
            </span>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '11px', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {severityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Type Distribution */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Threat Classification Breakdown
            </h3>
            <span className="text-[11px] text-cyan-400 font-mono">MITRE ATT&CK Mapped</span>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeChartData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis dataKey="type" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={110} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '11px', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Insights & Recommended Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insights Card */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                AI Autonomous Insights & Anomaly Alerts
              </h3>
            </div>
            <span className="text-[10px] text-cyan-400/80 font-mono">Isolation Forest Engine</span>
          </div>

          <div className="space-y-2.5">
            {ai_insights?.map((insight) => (
              <div
                key={insight.id}
                className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-cyan-300">{insight.title}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono uppercase bg-slate-800 text-slate-400">
                    {insight.type}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{insight.description}</p>
                <div className="mt-1 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-1 pt-1 border-t border-slate-900">
                  <span>Impact: <strong className="text-slate-300">{insight.impact}</strong></span>
                  <span className="text-cyan-400">Action: {insight.suggested_action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Maturity Quick Card */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Security Maturity
              </h3>
              <Link to="/maturity" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                Details <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-4xl font-extrabold font-mono text-cyan-400">
                {metrics.security_maturity_score.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                {metrics.maturity_level}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Evaluated across 10 operational categories using strict mathematical telemetry analysis.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Key Recommended Improvements:
            </span>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              {data.recommended_actions?.slice(0, 2).map((rec, i) => (
                <li key={i} className="text-slate-300 leading-snug">{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Tables: Recent Threats & Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Threats Table */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Recent Detected Threats
            </h3>
            <Link to="/threats" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              View All ({metrics.threats_detected}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800 bg-slate-950/40">
                <tr>
                  <th className="py-2.5 px-3">Threat</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">AI Confidence</th>
                  <th className="py-2.5 px-3">Target Asset</th>
                  <th className="py-2.5 px-3 text-right">DNA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {recent_threats?.map((threat) => (
                  <tr key={threat.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2 px-3 font-semibold text-slate-200">{threat.threat_type}</td>
                    <td className="py-2 px-3"><SeverityBadge severity={threat.severity} /></td>
                    <td className="py-2 px-3">
                      <ConfidenceGauge score={threat.confidence_score} size="sm" showLabel={false} />
                    </td>
                    <td className="py-2 px-3 text-slate-400">{threat.affected_asset}</td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => setSelectedThreatDna(threat.threat_dna)}
                        className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Incidents Table */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Active Incidents Lifecycle
            </h3>
            <Link to="/incidents" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              Incident Board <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800 bg-slate-950/40">
                <tr>
                  <th className="py-2.5 px-3">Incident</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Assigned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {recent_incidents?.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2 px-3">
                      <div className="font-semibold text-slate-200">{inc.incident_id}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{inc.title}</div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-300">
                        {inc.priority}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        inc.status === 'Resolved'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : inc.status === 'Contained'
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-300">{inc.assigned_to}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Live Event Feed Preview */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Live Security Telemetry Stream
            </h3>
          </div>
          <Link to="/logs" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
            Log Explorer ({metrics.events_analyzed}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-1.5 font-mono text-xs max-h-48 overflow-y-auto">
          {recent_logs?.slice(0, 6).map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-2 rounded bg-slate-950/40 border border-slate-800/60 hover:bg-slate-900/50"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-[11px] text-slate-500 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 shrink-0">
                  {log.source}
                </span>
                <span className="text-slate-300 truncate">{log.message}</span>
              </div>
              <SeverityBadge severity={log.severity} size="sm" />
            </div>
          ))}
        </div>
      </div>

      {/* Threat DNA Modal Drawer */}
      <Modal
        isOpen={!!selectedThreatDna}
        onClose={() => setSelectedThreatDna(null)}
        title="Threat DNA Inspection"
        maxWidth="max-w-4xl"
      >
        <ThreatDNA dna={selectedThreatDna} />
      </Modal>
    </div>
  );
}
