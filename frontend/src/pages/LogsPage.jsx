import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Trash2,
  Cpu,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { logsApi } from '../services/api';
import SeverityBadge from '../components/common/SeverityBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import AIExplanationCard from '../components/threats/AIExplanationCard';
import ThreatDNA from '../components/threats/ThreatDNA';
import { useNotification } from '../context/NotificationContext';

export default function LogsPage() {
  const { showToast } = useNotification();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('all');
  const [source, setSource] = useState('all');
  const [page, setPage] = useState(0);
  const limit = 25;

  // Modals
  const [selectedLog, setSelectedLog] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New Log Form State
  const [newLog, setNewLog] = useState({
    source: 'Firewall',
    source_ip: '198.51.100.88',
    destination_ip: '10.0.1.5',
    user: 'admin',
    hostname: 'CORP-FW-01',
    event_type: 'Failed Login',
    action: 'failure',
    protocol: 'TCP',
    port: 22,
    message: 'Repeated authentication failure over SSH for root account',
    severity: 'high',
  });

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await logsApi.getLogs({
        skip: page * limit,
        limit,
        search: search || undefined,
        severity: severity !== 'all' ? severity : undefined,
        source: source !== 'all' ? source : undefined,
      });
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, severity, source]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchLogs();
  };

  const handleAnalyzeLog = async (log) => {
    setAnalyzing(true);
    try {
      const res = await logsApi.analyzeLog({
        log_id: log.id,
        message: log.message,
        event_type: log.event_type,
        source_ip: log.source_ip,
        user: log.user,
        severity: log.severity,
      });
      setAnalysisResult(res);
      showToast('Threat analysis completed.', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCreateLog = async (e) => {
    e.preventDefault();
    try {
      const created = await logsApi.createLog(newLog);
      showToast('Security log ingested and evaluated through detection pipeline.', 'success');
      setIsCreateOpen(false);
      fetchLogs();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteLog = async (id) => {
    if (!window.confirm('Are you sure you want to delete this log entry?')) return;
    try {
      await logsApi.deleteLog(id);
      showToast('Log entry deleted.', 'info');
      fetchLogs();
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
            <FileText className="w-5 h-5 text-cyan-400" />
            SECURITY LOG MANAGEMENT & INGESTION
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Normalized SIEM log repository with real-time SOC rules & machine learning inference.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/40 transition"
          >
            <Plus className="w-4 h-4" /> Ingest New Log
          </button>
          <button
            onClick={fetchLogs}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search logs by IP, hostname, user, message, event type..."
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
              onChange={(e) => { setSeverity(e.target.value); setPage(0); }}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-mono">Source:</span>
            <select
              value={source}
              onChange={(e) => { setSource(e.target.value); setPage(0); }}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="all">All Sources</option>
              <option value="Firewall">Firewall</option>
              <option value="ActiveDirectory">Active Directory</option>
              <option value="EDR">EDR</option>
              <option value="Splunk">Splunk</option>
              <option value="WAF">WAF</option>
              <option value="CloudTrail">CloudTrail</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <LoadingSpinner message="Fetching filtered log events..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchLogs} />
      ) : logs.length === 0 ? (
        <EmptyState
          title="No logs found"
          description="Try adjusting your search terms or filter parameters."
          actionText="Clear Filters"
          onAction={() => { setSearch(''); setSeverity('all'); setSource('all'); }}
        />
      ) : (
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800 bg-slate-950/60">
                <tr>
                  <th className="py-3 px-3">Timestamp (UTC)</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">Source</th>
                  <th className="py-3 px-3">Event Type</th>
                  <th className="py-3 px-3">Source IP</th>
                  <th className="py-3 px-3">Target / Host</th>
                  <th className="py-3 px-3">Message</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <SeverityBadge severity={log.severity} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-semibold whitespace-nowrap">
                      {log.source}
                    </td>
                    <td className="py-2.5 px-3 text-cyan-300 whitespace-nowrap">
                      {log.event_type}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {log.source_ip || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                      {log.hostname || log.user || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate" title={log.message}>
                      {log.message}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        log.status === 'Flagged'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleAnalyzeLog(log)}
                          title="Run AI & Rule Threat Analysis"
                          className="p-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        >
                          <Cpu className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedLog(log)}
                          title="Inspect Raw Log"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          title="Delete Log"
                          className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between p-3 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400 font-mono">
            <span>Showing page {page + 1} ({logs.length} entries)</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={logs.length < limit}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Raw Log Inspector Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`Log Inspector • ID #${selectedLog?.id}`}
        subtitle={`Timestamp: ${selectedLog?.timestamp}`}
        maxWidth="max-w-3xl"
      >
        {selectedLog && (
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div><span className="text-slate-500">Source:</span> <strong className="text-slate-200">{selectedLog.source}</strong></div>
              <div><span className="text-slate-500">Event Type:</span> <strong className="text-cyan-300">{selectedLog.event_type}</strong></div>
              <div><span className="text-slate-500">Severity:</span> <SeverityBadge severity={selectedLog.severity} size="sm" /></div>
              <div><span className="text-slate-500">Source IP:</span> <span className="text-slate-300">{selectedLog.source_ip || 'N/A'}</span></div>
              <div><span className="text-slate-500">Dest IP:</span> <span className="text-slate-300">{selectedLog.destination_ip || 'N/A'}</span></div>
              <div><span className="text-slate-500">Port / Proto:</span> <span className="text-slate-300">{selectedLog.port ? `${selectedLog.port}/${selectedLog.protocol}` : 'N/A'}</span></div>
              <div><span className="text-slate-500">User:</span> <span className="text-slate-300">{selectedLog.user || 'N/A'}</span></div>
              <div><span className="text-slate-500">Host:</span> <span className="text-slate-300">{selectedLog.hostname || 'N/A'}</span></div>
              <div><span className="text-slate-500">Threat Ref:</span> <span className="text-amber-400">{selectedLog.threat_id || 'None'}</span></div>
            </div>

            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Normalized Message:</span>
              <div className="mt-1 p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-200">
                {selectedLog.message}
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Raw Syslog / Audit Telemetry:</span>
              <pre className="mt-1 p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 text-[11px] overflow-x-auto whitespace-pre-wrap">
                {selectedLog.raw_log || selectedLog.message}
              </pre>
            </div>
          </div>
        )}
      </Modal>

      {/* AI Threat Analysis Result Modal */}
      <Modal
        isOpen={!!analysisResult}
        onClose={() => setAnalysisResult(null)}
        title="AI & Hybrid Threat Analysis Result"
        subtitle={`Evaluation for ${analysisResult?.threat_type}`}
        maxWidth="max-w-4xl"
      >
        {analysisResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-950 border border-cyan-500/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{analysisResult.threat_type}</h4>
                  <div className="text-xs text-slate-400 font-mono">
                    Severity: <strong className="text-rose-400 uppercase">{analysisResult.severity}</strong> • Status: {analysisResult.confidence_classification}
                  </div>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-xs text-slate-400">Threat Confidence</div>
                <div className="text-2xl font-extrabold text-cyan-400">
                  {analysisResult.confidence_score?.toFixed(1)}%
                </div>
              </div>
            </div>

            <ThreatDNA dna={analysisResult.threat_dna} />

            <AIExplanationCard
              confidenceScore={analysisResult.confidence_score}
              breakdown={analysisResult.confidence_breakdown}
              explanation={analysisResult.explanation}
              contributingFactors={analysisResult.ai_contributing_factors}
              adaptiveModifier={analysisResult.adaptive_modifier}
            />
          </div>
        )}
      </Modal>

      {/* Ingest Log Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Ingest Security Log Event"
        subtitle="Submit raw security telemetry into the VIGILIX normalization pipeline."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateLog} className="space-y-3 font-mono text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Source Device</label>
              <select
                value={newLog.source}
                onChange={(e) => setNewLog({ ...newLog, source: e.target.value })}
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-slate-200"
              >
                <option value="Firewall">Firewall</option>
                <option value="ActiveDirectory">Active Directory</option>
                <option value="EDR">EDR</option>
                <option value="Splunk">Splunk</option>
                <option value="WAF">WAF</option>
                <option value="CloudTrail">CloudTrail</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Event Type</label>
              <input
                type="text"
                value={newLog.event_type}
                onChange={(e) => setNewLog({ ...newLog, event_type: e.target.value })}
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Source IP</label>
              <input
                type="text"
                value={newLog.source_ip}
                onChange={(e) => setNewLog({ ...newLog, source_ip: e.target.value })}
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Target Host / Hostname</label>
              <input
                type="text"
                value={newLog.hostname}
                onChange={(e) => setNewLog({ ...newLog, hostname: e.target.value })}
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">User Account</label>
              <input
                type="text"
                value={newLog.user}
                onChange={(e) => setNewLog({ ...newLog, user: e.target.value })}
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Severity</label>
              <select
                value={newLog.severity}
                onChange={(e) => setNewLog({ ...newLog, severity: e.target.value })}
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-slate-200"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="info">Info</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Log Message Content</label>
            <textarea
              rows={3}
              value={newLog.message}
              onChange={(e) => setNewLog({ ...newLog, message: e.target.value })}
              className="w-full p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded bg-slate-800 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
            >
              Ingest & Analyze
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
