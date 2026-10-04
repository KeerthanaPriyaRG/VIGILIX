import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  Play,
  FileText,
} from 'lucide-react';
import { incidentsApi, playbooksApi } from '../services/api';
import SeverityBadge from '../components/common/SeverityBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import IncidentTimeline from '../components/incidents/IncidentTimeline';
import PlaybookExecutionModal from '../components/playbooks/PlaybookExecutionModal';
import { useNotification } from '../context/NotificationContext';

export default function IncidentsPage() {
  const { showToast } = useNotification();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [severity, setSeverity] = useState('all');

  // Modals
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [playbookToExecute, setPlaybookToExecute] = useState(null);

  // Quick Action / Note state
  const [newNote, setNewNote] = useState('');
  const [newAction, setNewAction] = useState('');

  // New Incident form
  const [newIncidentForm, setNewIncidentForm] = useState({
    incident_id: `INC-2026-${Math.floor(Math.random() * 900 + 100)}`,
    title: 'Anomalous Token Duplication and Lateral Movement Attempt',
    description: 'LSASS memory dump detected followed by unauthorized administrative group modification.',
    severity: 'critical',
    priority: 'P1',
    status: 'Detected',
    affected_asset: 'WIN-SRV-CORE-02',
    assigned_to: 'Alex Mercer',
    playbook_id: 'PB-PRIV-04',
  });

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await incidentsApi.getIncidents({
        status: status !== 'all' ? status : undefined,
        severity: severity !== 'all' ? severity : undefined,
        search: search || undefined,
      });
      setIncidents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [status, severity]);

  const handleUpdateStatus = async (incId, newStatus) => {
    try {
      const updated = await incidentsApi.updateIncident(incId, { status: newStatus });
      showToast(`Incident status updated to ${newStatus}`, 'success');
      fetchIncidents();
      if (selectedIncident && selectedIncident.id === updated.id) {
        setSelectedIncident(updated);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAddAction = async () => {
    if (!newAction.trim() || !selectedIncident) return;
    try {
      await incidentsApi.executeAction(selectedIncident.id, {
        action_name: newAction,
        executed_by: 'Alex Mercer',
        notes: 'Manual analyst intervention',
      });
      showToast('Response action executed and logged to timeline.', 'success');
      setNewAction('');
      // Refresh detail
      const refreshed = await incidentsApi.getIncident(selectedIncident.id);
      setSelectedIncident(refreshed);
      fetchIncidents();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    try {
      await incidentsApi.createIncident(newIncidentForm);
      showToast('New security incident declared.', 'success');
      setIsCreateOpen(false);
      fetchIncidents();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleLaunchPlaybook = async (pbId) => {
    try {
      const pb = await playbooksApi.getPlaybook(pbId || 'PB-BRUTE-01');
      setPlaybookToExecute(pb);
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
            <AlertOctagon className="w-5 h-5 text-amber-400" />
            INCIDENT RESPONSE & LIFECYCLE MANAGEMENT
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage SOC incident lifecycles: Detected → Investigating → Contained → Eradicated → Resolved.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/40 transition"
          >
            <Plus className="w-4 h-4" /> Declare Incident
          </button>
          <button
            onClick={fetchIncidents}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by incident ID, title, affected asset, or assignee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchIncidents()}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-mono">Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="all">All Lifecycles</option>
              <option value="Detected">Detected</option>
              <option value="Investigating">Investigating</option>
              <option value="Contained">Contained</option>
              <option value="Eradicated">Eradicated</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

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
        </div>
      </div>

      {/* Incidents Board Table */}
      {loading ? (
        <LoadingSpinner message="Loading SOC incident ledger..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchIncidents} />
      ) : incidents.length === 0 ? (
        <EmptyState
          title="No incidents found"
          description="There are currently no active or closed incidents matching your filters."
          actionText="Reset Filters"
          onAction={() => { setSearch(''); setStatus('all'); setSeverity('all'); }}
        />
      ) : (
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800 bg-slate-950/60">
                <tr>
                  <th className="py-3 px-3">Incident ID</th>
                  <th className="py-3 px-3">Title & Description</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Lifecycle State</th>
                  <th className="py-3 px-3">Target Asset</th>
                  <th className="py-3 px-3">Assignee</th>
                  <th className="py-3 px-3">Declared</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-bold text-cyan-400 whitespace-nowrap">
                      {inc.incident_id}
                    </td>
                    <td className="py-2.5 px-3 max-w-sm truncate">
                      <div className="font-semibold text-slate-200">{inc.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{inc.description}</div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <SeverityBadge severity={inc.severity} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-200">
                        {inc.priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                        inc.status === 'Resolved'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : inc.status === 'Eradicated'
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                          : inc.status === 'Contained'
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                          : inc.status === 'Investigating'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                      }`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                      {inc.affected_asset}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                      {inc.assigned_to}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap text-[11px]">
                      {new Date(inc.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedIncident(inc)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Incident Detail & Management Modal */}
      <Modal
        isOpen={!!selectedIncident}
        onClose={() => setSelectedIncident(null)}
        title={`Incident Command: ${selectedIncident?.incident_id}`}
        subtitle={selectedIncident?.title}
        maxWidth="max-w-4xl"
      >
        {selectedIncident && (
          <div className="space-y-6">
            {/* Status Transition Header */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">Current Status:</span>
                  <span className="px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono font-bold text-cyan-300 uppercase">
                    {selectedIncident.status}
                  </span>
                </div>

                {/* Status Transitions */}
                <div className="flex items-center flex-wrap gap-2">
                  {['Detected', 'Investigating', 'Contained', 'Eradicated', 'Resolved'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedIncident.id, st)}
                      className={`px-2.5 py-1 rounded text-xs font-mono transition ${
                        selectedIncident.status === st
                          ? 'bg-cyan-500 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-2 border-t border-slate-800/80">
                <div><span className="text-slate-500">Asset:</span> <strong className="text-slate-200">{selectedIncident.affected_asset}</strong></div>
                <div><span className="text-slate-500">Assignee:</span> <strong className="text-slate-200">{selectedIncident.assigned_to}</strong></div>
                <div><span className="text-slate-500">Priority:</span> <strong className="text-amber-400">{selectedIncident.priority}</strong></div>
                <div><span className="text-slate-500">Threat Ref:</span> <span className="text-cyan-400">{selectedIncident.threat_id || 'Direct'}</span></div>
              </div>
            </div>

            {/* Recommended Playbook Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-500/30 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  Automated SOAR Recommendation:
                </span>
                <h4 className="text-sm font-bold text-slate-100 mt-0.5">
                  Playbook: {selectedIncident.playbook_id || 'PB-BRUTE-01'}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Executes automated containment, IP firewall drop, and account credential quarantine.
                </p>
              </div>

              <button
                onClick={() => handleLaunchPlaybook(selectedIncident.playbook_id)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shrink-0 transition"
              >
                <Play className="w-3.5 h-3.5" /> Execute Playbook
              </button>
            </div>

            {/* Interactive Response Action Dispatcher */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 font-mono">
                Execute Targeted Containment Action:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Block IP 185.220.101.5 on perimeter firewall..."
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleAddAction}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold"
                >
                  Dispatch Action
                </button>
              </div>
            </div>

            {/* Visual Incident Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Incident Lifecycle Timeline & Response History
              </h4>
              <IncidentTimeline timeline={selectedIncident.timeline} />
            </div>
          </div>
        )}
      </Modal>

      {/* Declare New Incident Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Declare Security Incident"
        subtitle="Escalate an anomaly or threat into a formal SOC incident."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateIncident} className="space-y-3 font-mono text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Incident Title</label>
            <input
              type="text"
              value={newIncidentForm.title}
              onChange={(e) => setNewIncidentForm({ ...newIncidentForm, title: e.target.value })}
              className="w-full p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Description & Scope</label>
            <textarea
              rows={2}
              value={newIncidentForm.description}
              onChange={(e) => setNewIncidentForm({ ...newIncidentForm, description: e.target.value })}
              className="w-full p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Severity</label>
              <select
                value={newIncidentForm.severity}
                onChange={(e) => setNewIncidentForm({ ...newIncidentForm, severity: e.target.value })}
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-slate-200"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Priority</label>
              <select
                value={newIncidentForm.priority}
                onChange={(e) => setNewIncidentForm({ ...newIncidentForm, priority: e.target.value })}
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-slate-200"
              >
                <option value="P1">P1 - Urgent</option>
                <option value="P2">P2 - High</option>
                <option value="P3">P3 - Medium</option>
                <option value="P4">P4 - Low</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Target Asset</label>
              <input
                type="text"
                value={newIncidentForm.affected_asset}
                onChange={(e) => setNewIncidentForm({ ...newIncidentForm, affected_asset: e.target.value })}
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-slate-200"
              />
            </div>
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
              Declare Incident
            </button>
          </div>
        </form>
      </Modal>

      {/* Playbook Execution Runner Modal */}
      {playbookToExecute && (
        <PlaybookExecutionModal
          isOpen={!!playbookToExecute}
          onClose={() => setPlaybookToExecute(null)}
          playbook={playbookToExecute}
          incidentId={selectedIncident?.incident_id}
          onSuccess={() => {
            fetchIncidents();
            if (selectedIncident) {
              incidentsApi.getIncident(selectedIncident.id).then(setSelectedIncident);
            }
          }}
        />
      )}
    </div>
  );
}
