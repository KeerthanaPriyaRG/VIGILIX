import React, { useState, useEffect } from 'react';
import {
  Gauge,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Award,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import { maturityApi } from '../services/api';
import MaturityGauge from '../components/maturity/MaturityGauge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/common/ErrorState';

export default function SecurityMaturityPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMaturity = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await maturityApi.getMaturity();
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaturity();
  }, []);

  if (loading) return <LoadingSpinner message="Evaluating operational security maturity algorithm..." size="lg" />;
  if (error) return <ErrorState message={error} onRetry={fetchMaturity} />;
  if (!data) return null;

  // Format category radar data
  const radarData = Object.entries(data.category_details || {}).map(([key, cat]) => ({
    category: cat.name.split(' ')[0], // Short name
    fullName: cat.name,
    score: cat.percentage,
    points: cat.points,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-mono">
            <Gauge className="w-5 h-5 text-cyan-400" />
            SECURITY MATURITY SCORING ENGINE
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent mathematical evaluation of 10 security domains (0–100 Scale) derived from live telemetry.
          </p>
        </div>

        <button
          onClick={fetchMaturity}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition self-start sm:self-auto"
          title="Recalculate Posture"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Maturity Gauge Banner */}
      <MaturityGauge
        score={data.overall_score}
        level={data.level}
        trend={data.score_trend}
      />

      {/* Radar Chart & 10 Category Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Radar Chart */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Operational Defense Radar (10 Domains)
            </h3>
            <span className="text-[11px] text-cyan-400 font-mono">100% Mathematical</span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={9} />
                <Radar
                  name="Maturity %"
                  dataKey="score"
                  stroke="#06b6d4"
                  fill="#06b6d4"
                  fillOpacity={0.25}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '11px', borderRadius: '8px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] text-slate-500 font-mono text-center">
            Zero AI hallucination • Strictly calculated from active SIEM tables
          </div>
        </div>

        {/* 10 Categories Point Breakdown */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              10-Category Scorecard (10 pts Each • Max 100)
            </h3>
            <span className="text-xs font-mono font-bold text-slate-200">
              {data.overall_score.toFixed(1)} / 100.0 pts
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-72 pr-1 font-mono">
            {Object.entries(data.category_details || {}).map(([key, cat]) => {
              let barColor = 'bg-cyan-500';
              if (cat.percentage >= 80) barColor = 'bg-emerald-500';
              else if (cat.percentage < 70) barColor = 'bg-amber-500';

              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium truncate max-w-[240px]">{cat.name}</span>
                    <span className="text-slate-200 font-bold">{cat.points} / 10.0 pts ({cat.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`${barColor} h-full rounded-full transition-all duration-700`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Strengths, Weaknesses, and Actionable Roadmap */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Strengths */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-emerald-500/20 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
              Identified Strengths
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            {data.strengths?.map((s, idx) => (
              <li key={idx} className="p-2.5 rounded-lg bg-slate-950/50 border border-emerald-500/20 leading-relaxed">
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-amber-500/20 space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
              Posture Deficiencies
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            {data.weaknesses?.map((w, idx) => (
              <li key={idx} className="p-2.5 rounded-lg bg-slate-950/50 border border-amber-500/20 leading-relaxed">
                {w}
              </li>
            ))}
          </ul>
        </div>

        {/* Actionable Recommendations */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-cyan-500/20 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <Zap className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
              Actionable Roadmap
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            {data.recommendations?.map((rec, idx) => (
              <li key={idx} className="p-2.5 rounded-lg bg-slate-950/50 border border-cyan-500/20 leading-relaxed">
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
