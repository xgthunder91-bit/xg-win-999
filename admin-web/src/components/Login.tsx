import React, { useState } from 'react';
import { Loader2, AlertTriangle, Lock, User, KeyRound } from 'lucide-react';
import { adminLogin, adminGet } from '../api';

interface Props {
  onAuthed: () => void;
}

export const Login: React.FC<Props> = ({ onAuthed }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!username.trim() || !password) {
      setError('Please enter username and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await adminLogin(username.trim(), password);
      await adminGet('/admin/overview');
      onAuthed();
    } catch (err: any) {
      if (err?.status === 401) setError('Invalid username or password');
      else setError(err?.message || 'Could not connect to the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      {/* Floating orbs */}
      <div className="fixed w-72 h-72 rounded-full bg-orange-500/20 blur-[90px] animate-xg-float -top-20 -left-20" />
      <div className="fixed w-72 h-72 rounded-full bg-blue-500/20 blur-[90px] animate-xg-float -bottom-24 -right-16" />
      <div className="fixed w-40 h-40 rounded-full bg-purple-500/15 blur-[80px] top-1/3 right-1/4 animate-xg-float" />

      <div className="w-full max-w-sm relative fade-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex flex-col items-center mb-7">
          <div className="relative">
            <div className="absolute -inset-3 rounded-[28px] bg-gradient-to-br from-[#ff9a2e] to-[#ff5500] opacity-45 blur-xl animate-xg-glow" />
            <div className="relative w-24 h-24 rounded-[26px] overflow-hidden shadow-2xl shadow-orange-900/50 border border-white/10">
              <img
                src="/emblem.png"
                alt="XG Win 99"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white mt-4">
            XG Win <span className="gradient-text">99</span>
          </h1>
          <p className="text-[11px] tracking-[0.25em] text-slate-400 mt-1.5 font-semibold">
            ADMIN CONSOLE
          </p>
        </div>

        <form onSubmit={submit} className="relative glass-card p-6 shadow-2xl shadow-black/50">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff8a1e]/70 to-transparent" />

          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-[#ff8a1e]" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Secure Access
            </span>
          </div>

          <label className="block text-xs font-semibold text-slate-300 mb-2">Username</label>
          <div className="flex items-center gap-2 bg-[#0b1017]/70 border border-white/10 rounded-xl px-3.5 py-3 mb-3 focus-within:border-[#ff8a1e]/70 focus-within:shadow-[0_0_0_3px_rgba(255,138,30,0.12)] transition-all">
            <User className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoFocus
              autoComplete="username"
              className="bg-transparent outline-none text-sm text-white w-full placeholder:text-slate-600"
            />
          </div>

          <label className="block text-xs font-semibold text-slate-300 mb-2">Password</label>
          <div className="flex items-center gap-2 bg-[#0b1017]/70 border border-white/10 rounded-xl px-3.5 py-3 mb-3 focus-within:border-[#ff8a1e]/70 focus-within:shadow-[0_0_0_3px_rgba(255,138,30,0.12)] transition-all">
            <KeyRound className="w-4 h-4 text-slate-500" />
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              className="bg-transparent outline-none text-sm text-white w-full placeholder:text-slate-600"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="text-xs font-bold text-slate-400 hover:text-white cursor-pointer shrink-0"
            >
              {showPass ? 'Hide' : 'Show'}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5 mb-3 fade-up">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-500 mt-5">
          API: {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}
        </p>
      </div>
    </div>
  );
};