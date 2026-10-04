import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Loader2,
  CheckCircle2,
  KeyRound,
  Terminal,
  Activity,
} from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activePreset, setActivePreset] = useState(null);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const trimmedUser = username.trim();
    if (!trimmedUser) {
      setError('Please provide a valid username or email address.');
      return;
    }
    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(trimmedUser, password);
      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillPreset = (u, p, label) => {
    setUsername(u);
    setPassword(p);
    setError('');
    setActivePreset(label);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Background Cyber Grid & Glow Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0f_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20">
            <Shield className="w-4 h-4 text-white" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-950" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-wider text-slate-100 font-mono">
              VIGILIX
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              v1.0 SOC
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300">DEFENSE CORE:</span>
            <span className="text-emerald-400 font-bold">ARMED</span>
          </span>
        </div>
      </header>

      {/* Main Authentication Center Box */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-cyan-950/20 overflow-hidden">
            {/* Header / Brand Title */}
            <div className="p-6 pb-4 border-b border-slate-800/80 bg-slate-950/40 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-transparent border border-cyan-500/40 mb-3 shadow-lg shadow-cyan-500/10">
                <Shield className="w-7 h-7 text-cyan-400" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-100 font-mono">
                SOC ACCESS GATEWAY
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Enter your security credentials to access the VIGILIX telemetry dashboard & response center.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Error Alert */}
              {error && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-red-950/40 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold text-red-300">Authentication Failed:</span>{' '}
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Username / Email Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="username"
                  className="block text-xs font-semibold text-slate-300 font-mono tracking-wide"
                >
                  OPERATOR ID / EMAIL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    disabled={isLoading}
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="admin or analyst@vigilix.internal"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-slate-300 font-mono tracking-wide"
                  >
                    PASSPHRASE KEY
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">Bcrypt/Argon2</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs tracking-wider uppercase font-mono shadow-lg shadow-cyan-600/25 border border-cyan-400/30 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-cyan-500/40 active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>AUTHENTICATING OPERATOR...</span>
                  </>
                ) : (
                  <>
                    <span>AUTHENTICATE & ENTER SOC</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick-Fill Presets for SOC Testing */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>Demo Operator Quick-Fill</span>
                <span className="text-[10px] text-slate-500 lowercase font-sans ml-auto">
                  (validated via backend)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Admin Preset */}
                <button
                  type="button"
                  onClick={() => fillPreset('admin', 'admin123', 'admin')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    activePreset === 'admin'
                      ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-200 shadow-sm shadow-cyan-950'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-slate-200">Admin</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                      Full SOC
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    admin / admin123
                  </div>
                </button>

                {/* Analyst Preset */}
                <button
                  type="button"
                  onClick={() => fillPreset('analyst', 'analyst123', 'analyst')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    activePreset === 'analyst'
                      ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-200 shadow-sm shadow-cyan-950'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-slate-200">Lead Analyst</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                      Responder
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    analyst / analyst123
                  </div>
                </button>
              </div>
            </div>

            {/* Footer Compliance Info */}
            <div className="px-6 py-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Zero-Trust Token Session
              </span>
              <span>NIST SP 800-61 Rev 2</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-3 border-t border-slate-900 bg-slate-950/80 text-center text-xs text-slate-600 font-mono relative z-10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>VIGILIX Intelligent Threat Monitoring & Adaptive Response</div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span>Local SOC Engine: 127.0.0.1:8000</span>
          <span>•</span>
          <span>Splunk HEC: Connected</span>
        </div>
      </footer>
    </div>
  );
}
