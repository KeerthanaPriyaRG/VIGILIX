import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Activity, Cpu, Database, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const [time, setTime] = useState(new Date().toUTCString());
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toUTCString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand / Logo */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
          <Shield className="w-5 h-5 text-white" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-wider text-slate-100 font-mono">
              VIGILIX
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              v1.0 SOC
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline-block">
            Intelligent Security Monitoring & Threat Response
          </span>
        </div>
      </div>

      {/* System Status Indicators */}
      <div className="hidden md:flex items-center gap-6 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-slate-300">Engine:</span>
          <span className="font-mono text-emerald-400">ACTIVE</span>
        </div>

        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-medium text-slate-300">AI Inference:</span>
          <span className="font-mono text-cyan-400">ONLINE</span>
        </div>

        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-purple-400" />
          <span className="font-medium text-slate-300">Splunk:</span>
          <span className="font-mono text-purple-400">CONNECTED</span>
        </div>
      </div>

      {/* Right Controls (Clock & User & Logout) */}
      <div className="flex items-center gap-4">
        <div className="text-right hidden lg:block">
          <div className="text-[11px] font-mono font-medium text-slate-300">
            {time.slice(17, 25)} UTC
          </div>
          <div className="text-[10px] text-slate-500">
            {time.slice(0, 16)}
          </div>
        </div>

        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-200">
              {user?.full_name || user?.username || 'Alex Mercer'}
            </div>
            <div className="text-[10px] text-cyan-400 font-mono">
              {user?.role || 'Lead SOC Analyst'}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Sign out of VIGILIX"
            className="ml-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-red-500/40 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all flex items-center gap-1.5 text-xs font-mono group"
          >
            <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
