import React, { useState } from 'react';
import { Loader2, AlertTriangle, Lock, User, KeyRound, Crown, Sparkles } from 'lucide-react';
import { adminLogin, adminGet, API_BASE_URL } from '../api';

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
    <div className="login-shell min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Floating gold orbs */}
      <div className="fixed w-72 h-72 rounded-full bg-[var(--b2)]/20 blur-[90px] animate-xg-float -top-20 -left-20" />
      <div className="fixed w-72 h-72 rounded-full bg-[var(--b1)]/15 blur-[90px] animate-xg-float -bottom-24 -right-16" />
      <div className="fixed w-40 h-40 rounded-full bg-[var(--b2)]/20 blur-[80px] top-1/3 right-1/4 animate-xg-float" />

      <div className="w-full max-w-[430px] relative fade-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex flex-col items-center mb-7 text-center">
          <div className="relative">
            <div className="absolute -inset-4 rounded-[32px] bg-[var(--b2)] opacity-60 blur-2xl animate-xg-glow" />
            <div className="absolute -inset-1 rounded-[30px] bg-[var(--b-grad)] opacity-70 blur-[2px]" />
            <div className="relative w-24 h-24 rounded-[27px] overflow-hidden shadow-2xl shadow-black/70 border border-white/20 bg-[#070b16]">
              <img
                src="/emblem.png"
                alt="XG Win 99"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-[#0b1020] border border-[var(--b1)]/50 flex items-center justify-center shadow-lg shadow-[var(--b1)]/20">
              <Sparkles className="w-4 h-4 text-[var(--b1)]" />
            </span>
          </div>

          <p className="login-eyebrow mt-5 flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5" /> XG WIN 99 • VIP CONSOLE
          </p>
          <h1 className="login-hello mt-1.5">
            Hello <span>Admin</span>
          </h1>
          <p className="login-tagline mt-2">Aapka control center ready hai. Chalo shuru karein.</p>
        </div>

        <form onSubmit={submit} className="login-card relative vip-card p-6 overflow-hidden">
          <div className="login-shine" aria-hidden="true" />
          <div className="relative flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-[var(--b1)]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#b3a88f]">
              Secure Access
            </span>
          </div>

          <label className="block text-xs font-semibold text-[#cbc0a8] mb-2">Username</label>
          <div className="flex items-center gap-2 bg-black/40 border border-[var(--b1)]/20 rounded-xl px-3.5 py-3 mb-3 focus-within:border-[var(--b1)]/70 focus-within:shadow-[0_0_0_3px_rgba(247,196,83,0.14)] transition-all">
            <User className="w-4 h-4 text-[#8a8070]" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoFocus
              autoComplete="username"
              className="bg-transparent outline-none text-sm text-[var(--b-ink)] w-full placeholder:text-[#5d5648]"
            />
          </div>

          <label className="block text-xs font-semibold text-[#cbc0a8] mb-2">Password</label>
          <div className="flex items-center gap-2 bg-black/40 border border-[var(--b1)]/20 rounded-xl px-3.5 py-3 mb-3 focus-within:border-[var(--b1)]/70 focus-within:shadow-[0_0_0_3px_rgba(247,196,83,0.14)] transition-all">
            <KeyRound className="w-4 h-4 text-[#8a8070]" />
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              className="bg-transparent outline-none text-sm text-[var(--b-ink)] w-full placeholder:text-[#5d5648]"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="text-xs font-bold text-[var(--b1)] hover:text-[var(--b-ink)] cursor-pointer shrink-0"
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

        <p className="text-center text-[11px] text-[#6b6355] mt-5 truncate">
          API: {API_BASE_URL}
        </p>
      </div>
    </div>
  );
};