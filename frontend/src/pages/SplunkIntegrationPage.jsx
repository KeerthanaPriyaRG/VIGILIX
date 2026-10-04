import React, { useState, useEffect } from 'react';
import {
  Layers,
  Database,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Send,
  Sliders,
  Radio,
  ExternalLink,
  Cpu,
} from 'lucide-react';
import { splunkApi } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/common/ErrorState';
import { useNotification } from '../context/NotificationContext';

export default function SplunkIntegrationPage() {
  const { showToast } = useNotification();

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('index=* | head 20');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchMeta, setSearchMeta] = useState(null);

  // Testing & HEC State
  const [testing, setTesting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [sendingHec, setSendingHec] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await splunkApi.getStatus();
      setStatus(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await splunkApi.testConnection();
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'warning');
      }
      fetchStatus();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleRunSearch = async (e) => {
    if (e) e.preventDefault();
    setSearching(true);
    try {
      const res = await splunkApi.search({ query: searchQuery });
      setSearchResults(res.events || []);
      setSearchMeta({
        total: res.total_results,
        time: res.execution_time_sec,
      });
      showToast(`Splunk query returned ${res.total_results} events in ${res.execution_time_sec}s`, 'info');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleImportEvents = async () => {
    if (searchResults.length === 0) {
      showToast('Run a search query first to obtain events to import.', 'warning');
      return;
    }
    setImporting(true);
    try {
      const res = await splunkApi.importEvents({
        events: searchResults,
        run_detection: true,
      });
      showToast(res.message, 'success');
      fetchStatus();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleSendTestHec = async () => {
    setSendingHec(true);
    try {
      const res = await splunkApi.sendHec({
        event: {
          alert: 'VIGILIX_CORRELATED_THREAT',
          severity: 'high',
          confidence: 91.5,
          timestamp: new Date().toISOString(),
          details: 'High-confidence brute force attack flagged on domain controller.',
        },
        sourcetype: 'vigilix:alert',
        index: 'main',
      });
      showToast(`Sent to Splunk HEC: ${res.message}`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSendingHec(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-mono">
            <Layers className="w-5 h-5 text-purple-400" />
            SPLUNK SIEM INTEGRATION & INGESTION BRIDGE
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Bi-directional telemetry synchronization: query Splunk indexes, import into VIGILIX, and push alerts to Splunk HEC.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Connection Status & Metadata Card */}
      {loading ? (
        <LoadingSpinner message="Checking Splunk REST API and HEC endpoints..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchStatus} />
      ) : (
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border ${status?.is_connected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-100">
                    Splunk Enterprise Connector
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${status?.mode === 'mock' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'}`}>
                    {status?.mode === 'mock' ? 'Mock / Sandbox Mode' : 'Live Enterprise'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Host: {status?.host}:{status?.port} • HEC: {status?.hec_url}
                </p>
              </div>
            </div>

            {/* Test Connection Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                {testing ? 'Testing...' : 'Test Connection'}
              </button>

              <button
                onClick={handleSendTestHec}
                disabled={sendingHec}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition"
              >
                <Send className="w-3.5 h-3.5" />
                {sendingHec ? 'Sending...' : 'Send Test HEC'}
              </button>
            </div>
          </div>

          {/* Integration Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500">Connection State:</span>
              <div className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {status?.is_connected ? 'CONNECTED' : 'DISCONNECTED'}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500">Events Ingested:</span>
              <div className="font-bold text-slate-200 mt-0.5">{status?.events_imported_count} Events</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500">Splunk Build:</span>
              <div className="font-bold text-cyan-400 mt-0.5">{status?.server_info?.version || 'v9.2.1'}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500">Active Indexes:</span>
              <div className="font-bold text-purple-300 mt-0.5 truncate">
                {status?.server_info?.active_indexes?.join(', ') || 'wineventlog, pan_logs, auth'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Splunk Search / SPL Query Console */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Search className="w-4 h-4 text-cyan-400" />
            Splunk Search Processing Language (SPL) Query Explorer
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">REST API Endpoint</span>
        </div>

        <form onSubmit={handleRunSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g. index=wineventlog EventCode=4625 | head 20"
            className="flex-1 px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition disabled:opacity-50"
          >
            {searching ? 'Querying...' : 'Search Splunk'}
          </button>
        </form>

        {/* Quick Query Templates */}
        <div className="flex items-center flex-wrap gap-2 text-[11px] font-mono text-slate-400">
          <span>Preset Queries:</span>
          {[
            'index=wineventlog EventCode=4625',
            'index=pan_logs bytes_out>500000000',
            'index=auth action=failure',
            'index=* | head 15',
          ].map((q) => (
            <button
              key={q}
              onClick={() => { setSearchQuery(q); }}
              className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Results Toolbar */}
        {searchResults.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-xs font-mono text-slate-300">
              Found <strong>{searchMeta?.total} events</strong> in {searchMeta?.time}s
            </span>

            <button
              onClick={handleImportEvents}
              disabled={importing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {importing ? 'Importing & Analyzing...' : 'Import Events into VIGILIX Pipeline'}
            </button>
          </div>
        )}

        {/* Events Table */}
        {searchResults.length > 0 && (
          <div className="rounded-lg border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-slate-400 uppercase text-[10px] border-b border-slate-800 bg-slate-950/60 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">_time</th>
                    <th className="py-2.5 px-3">Index</th>
                    <th className="py-2.5 px-3">Sourcetype</th>
                    <th className="py-2.5 px-3">Host</th>
                    <th className="py-2.5 px-3">Message / Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {searchResults.map((ev, i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 text-slate-400 whitespace-nowrap">{ev._time || '-'}</td>
                      <td className="py-2 px-3 text-cyan-400 whitespace-nowrap">{ev.index}</td>
                      <td className="py-2 px-3 text-purple-300 whitespace-nowrap">{ev.sourcetype}</td>
                      <td className="py-2 px-3 text-slate-300 whitespace-nowrap">{ev.host}</td>
                      <td className="py-2 px-3 text-slate-200 truncate max-w-md" title={ev.message}>
                        {ev.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
