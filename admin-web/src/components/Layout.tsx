import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users as UsersIcon,
  Wallet,
  Banknote,
  RefreshCw,
  LogOut,
  ShieldCheck,
Radio,
  Gamepad2,
  Sparkles,
} from 'lucide-react';

export type PageKey =
  | 'overview'
  | 'livebets'
  | 'gameinfo'
  | 'users'
  | 'deposits'
  | 'withdrawals'
  | 'admins';

interface Props {
  page: PageKey;
  onNavigate: (p: PageKey) => void;
  onRefresh: () => void;
  onLogout: () => void;
  loading: boolean;
  apiOk: boolean;
  pendingDeposits: number;
  pendingWithdrawals: number;
  children: React.ReactNode;
}

const NAV: { key: PageKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
  { key: 'livebets', label: 'Live Betting', icon: <Radio className="w-[18px] h-[18px]" /> },
  { key: 'gameinfo', label: 'Game Info', icon: <Gamepad2 className="w-[18px] h-[18px]" /> },
  { key: 'users', label: 'Users', icon: <UsersIcon className="w-[18px] h-[18px]" /> },
  { key: 'deposits', label: 'Deposits', icon: <Wallet className="w-[18px] h-[18px]" /> },
  { key: 'withdrawals', label: 'Withdrawals', icon: <Banknote className="w-[18px] h-[18px]" /> },
  { key: 'admins', label: 'Admins', icon: <ShieldCheck className="w-[18px] h-[18px]" /> },
];

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="hidden md:flex flex-col items-end leading-tight">
      <span className="text-sm font-black text-white tabular-nums">
        {now.toLocaleTimeString('en-IN', { hour12: false })}
      </span>
      <span className="text-[10px] text-slate-500">
        {now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
      </span>
    </div>
  );
}

export const Layout: React.FC<Props> = ({
  page,
  onNavigate,
  onRefresh,
  onLogout,
  loading,
  apiOk,
  pendingDeposits,
  pendingWithdrawals,
  children,
}) => {
  const badgeFor = (key: PageKey) => {
    if (key === 'deposits' && pendingDeposits > 0) return pendingDeposits;
    if (key === 'withdrawals' && pendingWithdrawals > 0) return pendingWithdrawals;
    return 0;
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 glass border-r border-white/[0.06] flex flex-col relative z-10">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-white/[0.06]">
          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-[#ff9a2e] to-[#ff5500] opacity-40 blur-md animate-xg-glow" />
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ff9a2e] to-[#ff5500] flex items-center justify-center shadow-lg shadow-orange-900/40">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <div className="text-sm font-black text-white leading-tight flex items-center gap-1">
              XG Win 99
            </div>
            <div className="text-[10px] tracking-widest text-[#ff8a1e] font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> ADMIN CONSOLE
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1 flex-1">
          {NAV.map((item) => {
            const active = page === item.key;
            const badge = badgeFor(item.key);
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-[#ff8a1e]/20 to-transparent text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04] hover:translate-x-0.5'
                }`}
              >
                <span
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-gradient-to-b from-[#ff9429] to-[#ff5500] transition-all duration-300 ${
                    active ? 'h-6 opacity-100' : 'h-0 opacity-0'
                  }`}
                />
                <span className={active ? 'text-[#ff8a1e] drop-shadow-[0_0_8px_rgba(255,138,30,0.7)]' : ''}>
                  {item.icon}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {badge > 0 && (
                  <span className="text-[10px] font-bold bg-gradient-to-r from-[#ff5500] to-[#ff3d00] text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center shadow-lg shadow-orange-900/40">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="h-[68px] shrink-0 glass border-b border-white/[0.06] px-6 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-lg font-black text-white capitalize flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-[#ff9429] to-[#ff5500]" />
              {NAV.find((n) => n.key === page)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-5">
            <LiveClock />

            <span
              className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border ${
                apiOk
                  ? 'text-green-300 border-green-500/25 bg-green-500/10'
                  : 'text-red-300 border-red-500/25 bg-red-500/10'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${apiOk ? 'bg-green-400 live-dot' : 'bg-red-400'}`} />
              {apiOk ? 'LIVE' : 'OFFLINE'}
            </span>

            <button
              onClick={onRefresh}
              className="flex items-center gap-2 text-xs font-bold glass rounded-xl px-3.5 py-2.5 cursor-pointer hover:border-[#ff8a1e]/50 hover:text-[#ff8a1e] transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div key={page} className="fade-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
