import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Loader2 } from 'lucide-react';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 mb-4 shadow-lg shadow-cyan-500/10">
          <Shield className="w-8 h-8 text-cyan-400 animate-pulse" />
          <div className="absolute inset-0 rounded-2xl border border-cyan-400/40 animate-ping opacity-25" />
        </div>
        <div className="flex items-center gap-2 text-sm font-mono text-cyan-400 font-semibold mb-1">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span>AUTHENTICATING VIGILIX TERMINAL...</span>
        </div>
        <p className="text-xs text-slate-500 font-mono">Verifying SOC credentials & cryptography</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
