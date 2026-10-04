import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Cpu,
  Database,
  Bell,
  Save,
  CheckCircle2,
  Sliders,
  Server,
  Key,
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export default function SettingsPage() {
  const { showToast } = useNotification();

  const [settings, setSettings] = useState({
    // Detection Thresholds
    bruteForceThreshold: 8,
    portScanThreshold: 20,
    egressAlertMB: 500,
    // AI Weights (35 / 20 / 30 / 15)
    weightModel: 35,
    weightAnomaly: 20,
    weightRules: 30,
    weightCorrelation: 15,
    // Splunk Settings
    splunkMode: 'mock',
    splunkHost: 'localhost',
    splunkPort: 8089,
    splunkHecUrl: 'http://localhost:8088/services/collector',
    // Notifications
    emailAlerts: true,
    autoPlaybookExecution: true,
  });

  const handleSave = (e) => {
    e.preventDefault();
    showToast('Platform security configurations saved successfully.', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-mono">
            <Settings className="w-5 h-5 text-cyan-400" />
            PLATFORM CONFIGURATION & SOC SETTINGS
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Tune hybrid detection engine rules, AI confidence weights, Splunk connectors, and automated SOAR triggers.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/40 transition"
        >
          <Save className="w-4 h-4" /> Save Preferences
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Detection Engine Thresholds */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-cyan-400 pb-2 border-b border-slate-800">
            <Shield className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
              Detection Engine Sensitivity Thresholds
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Brute Force Burst Limit</label>
              <input
                type="number"
                value={settings.bruteForceThreshold}
                onChange={(e) => setSettings({ ...settings, bruteForceThreshold: Number(e.target.value) })}
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-slate-200"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Logons / 5 mins</span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Port Scan Trigger Rate</label>
              <input
                type="number"
                value={settings.portScanThreshold}
                onChange={(e) => setSettings({ ...settings, portScanThreshold: Number(e.target.value) })}
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-slate-200"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Unique ports / 30s</span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Egress Threshold (MB)</label>
              <input
                type="number"
                value={settings.egressAlertMB}
                onChange={(e) => setSettings({ ...settings, egressAlertMB: Number(e.target.value) })}
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-slate-200"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Outbound per host</span>
            </div>
          </div>
        </div>

        {/* AI Confidence Weighting Engine */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-cyan-400 pb-2 border-b border-slate-800">
            <Cpu className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
              AI Threat Confidence Engine Formula Allocation
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div>
              <label className="block text-slate-400 mb-1">AI Classifier (35%)</label>
              <input
                type="number"
                value={settings.weightModel}
                onChange={(e) => setSettings({ ...settings, weightModel: Number(e.target.value) })}
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Anomaly Engine (20%)</label>
              <input
                type="number"
                value={settings.weightAnomaly}
                onChange={(e) => setSettings({ ...settings, weightAnomaly: Number(e.target.value) })}
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">SOC Rule Match (30%)</label>
              <input
                type="number"
                value={settings.weightRules}
                onChange={(e) => setSettings({ ...settings, weightRules: Number(e.target.value) })}
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Historical Correlation (15%)</label>
              <input
                type="number"
                value={settings.weightCorrelation}
                onChange={(e) => setSettings({ ...settings, weightCorrelation: Number(e.target.value) })}
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-slate-200"
              />
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Total Weight: <strong className="text-cyan-400">{settings.weightModel + settings.weightAnomaly + settings.weightRules + settings.weightCorrelation}%</strong> (Normalized to 100.0)
          </div>
        </div>

        {/* External Splunk SIEM Integration Settings */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-purple-400 pb-2 border-b border-slate-800">
            <Database className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
              Splunk SIEM Telemetry Connector
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Splunk Mode</label>
              <select
                value={settings.splunkMode}
                onChange={(e) => setSettings({ ...settings, splunkMode: e.target.value })}
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-slate-200"
              >
                <option value="mock">Mock Sandbox Mode (Zero Setup)</option>
                <option value="live">Live Enterprise Splunk Instance</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Splunk Hostname / IP</label>
              <input
                type="text"
                value={settings.splunkHost}
                onChange={(e) => setSettings({ ...settings, splunkHost: e.target.value })}
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Management REST Port</label>
              <input
                type="number"
                value={settings.splunkPort}
                onChange={(e) => setSettings({ ...settings, splunkPort: Number(e.target.value) })}
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">HTTP Event Collector (HEC) URL</label>
              <input
                type="text"
                value={settings.splunkHecUrl}
                onChange={(e) => setSettings({ ...settings, splunkHecUrl: e.target.value })}
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Database & Diagnostics */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-emerald-400 pb-2 border-b border-slate-800">
            <Server className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              System Environment & Diagnostics
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div><span className="text-slate-500">Platform:</span> <strong className="text-slate-200">VIGILIX v1.0.0</strong></div>
            <div><span className="text-slate-500">Database Engine:</span> <strong className="text-emerald-400">PostgreSQL (with SQLite Fallback)</strong></div>
            <div><span className="text-slate-500">AI ML Runtimes:</span> <strong className="text-cyan-400">scikit-learn 1.9.0 + joblib</strong></div>
            <div><span className="text-slate-500">Classifier:</span> <span className="text-slate-300">RandomForest (100 Trees)</span></div>
            <div><span className="text-slate-500">Anomaly Model:</span> <span className="text-slate-300">IsolationForest (0.10 Contam)</span></div>
            <div><span className="text-slate-500">Environment:</span> <span className="text-purple-400">Development / Lab</span></div>
          </div>
        </div>
      </form>
    </div>
  );
}
