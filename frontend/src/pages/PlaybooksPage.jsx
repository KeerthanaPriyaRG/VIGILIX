import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Play,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Zap,
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';
import { playbooksApi } from '../services/api';
import SeverityBadge from '../components/common/SeverityBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/common/ErrorState';
import PlaybookExecutionModal from '../components/playbooks/PlaybookExecutionModal';

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedPlaybook, setSelectedPlaybook] = useState(null);

  const fetchPlaybooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await playbooksApi.getPlaybooks();
      setPlaybooks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaybooks();
  }, []);

  const filteredPlaybooks = playbooks.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.playbook_id.toLowerCase().includes(q) ||
      p.threat_type.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-mono">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            AUTOMATED RESPONSE PLAYBOOKS & SOAR CATALOG
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Pre-configured incident response workflows mapping detection triggers to automated containment.
          </p>
        </div>

        <button
          onClick={fetchPlaybooks}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition self-start sm:self-auto"
          title="Refresh Playbooks"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search playbooks by title, ID, or threat category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Catalog: <strong className="text-cyan-400">{filteredPlaybooks.length} Standard Playbooks</strong>
        </div>
      </div>

      {/* Playbooks Catalog Grid */}
      {loading ? (
        <LoadingSpinner message="Loading SOAR playbook definitions..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchPlaybooks} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPlaybooks.map((pb) => (
            <div
              key={pb.id || pb.playbook_id}
              className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-xl"
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold uppercase">
                      {pb.playbook_id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-100">{pb.name}</h3>
                  </div>
                  <SeverityBadge severity={pb.severity} />
                </div>

                <p className="text-xs text-slate-300">{pb.description}</p>
              </div>

              {/* SOAR 6-Phase Badges */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                  Workflow Progression Phases:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['Trigger', 'Investigation', 'Containment', 'Eradication', 'Recovery', 'Closure'].map(
                    (phase, idx) => (
                      <span
                        key={phase}
                        className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300"
                      >
                        {idx + 1}. {phase}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Footer Details & Simulation Button */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Est: {pb.estimated_response_time}</span>
                </div>

                <button
                  onClick={() => setSelectedPlaybook(pb)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/40 transition"
                >
                  <Play className="w-3.5 h-3.5" /> Execute Simulation
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Playbook Execution Runner Modal */}
      {selectedPlaybook && (
        <PlaybookExecutionModal
          isOpen={!!selectedPlaybook}
          onClose={() => setSelectedPlaybook(null)}
          playbook={selectedPlaybook}
        />
      )}
    </div>
  );
}
