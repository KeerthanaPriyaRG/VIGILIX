import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  ShieldAlert,
  AlertOctagon,
  Crosshair,
  BookOpen,
  Gauge,
  Terminal,
  Layers,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Logs Management', path: '/logs', icon: FileText },
  { name: 'Active Threats', path: '/threats', icon: ShieldAlert },
  { name: 'Incident Response', path: '/incidents', icon: AlertOctagon },
  { name: 'Threat Intelligence', path: '/intelligence', icon: Crosshair },
  { name: 'Playbook System', path: '/playbooks', icon: BookOpen },
  { name: 'Security Maturity', path: '/maturity', icon: Gauge },
  { name: 'Attack Simulation', path: '/simulation', icon: Terminal, highlight: true },
  { name: 'Splunk Integration', path: '/splunk', icon: Layers },
  { name: 'System Settings', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };
  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/60 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
          SOC Operations
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                } ${item.highlight && !isActive ? 'hover:border-cyan-500/20' : ''}`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
              {item.highlight && (
                <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
                  SIM
                </span>
              )}
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={handleLogout}
          className="w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 group"
        >
          <LogOut className="w-4 h-4 shrink-0 text-slate-500 group-hover:text-red-400 transition-colors" />
          <span>Sign Out / Lock</span>
        </button>
      </nav>

      {/* Security Engine Health Summary Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/20 m-3 rounded-lg">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Defense Health</span>
          <span className="font-mono text-emerald-400 font-bold">98.4%</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full w-[98%]"></div>
        </div>
        <div className="mt-2 text-[10px] text-slate-500 text-center">
          VIGILIX AI Defense Core • Safe Local Mode
        </div>
      </div>
    </aside>
  );
}
