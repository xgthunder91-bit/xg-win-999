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
  Crown,
  Palette,
} from 'lucide-react';

export type PageKey =
  | 'overview'
  | 'livebets'
  | 'gameinfo'
  | 'users'
  | 'deposits'
  | 'withdrawals'
  | 'admins'
  | 'theme';

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
  { key: 'theme', label: 'Theme', icon: <Palette className="w-[18px] h-[18px]" /> },
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
  const [menuOpen, setMenuOpen] = useState(false);
  const isDesktop = useIsDesktop();

  // Close the drawer whenever a section is picked or the viewport grows.
  useEffect(() => {
    setMenuOpen(false);
  }, [page]);
  useEffect(() => {
    if (isDesktop) setMenuOpen(false);
  }, [isDesktop]);

  const badgeFor = (key: PageKey) => {
    if (key === 'deposits' && pendingDeposits > 0) return pendingDeposits;
    if (key === 'withdrawals' && pendingWithdrawals > 0) return pendingWithdrawals;
    return 0;
  };

  const sidebar = (
    <>
      <div className="px-4 sm:px-5 py-4 sm:py-5 flex items-center gap-3 border-b border-[var(--b1)]/15">
        <div className="relative shrink-0">
          <div className="absolute -inset-1 rounded-2xl bg-[var(--b2)] opacity-50 blur-md animate-xg-glow" />
          <div className="relative w-10 h-10 rounded-2xl overflow-hidden shadow-lg shadow-black/60 border border-[var(--b1)]/40">
            <img src="/emblem.png" alt="XG Win 99" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-sm font-black text-[var(--b-ink)] leading-tight flex items-center gap-1 truncate">
            XG Win 99
          </div>
          <div className="text-[10px] tracking-[0.2em] text-[var(--b1)] font-bold flex items-center gap-1">
            <Crown className="w-3 h-3" /> VIP CONSOLE
          </div>
        </div>
      </div>

      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {NAV.map((item) => {
          const active = page === item.key;
          const badge = badgeFor(item.key);
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`group relative w-full flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                active
                  ? 'text-[var(--b-ink)] shadow-[0_10px_30px_-18px_rgba(224,169,46,0.9)]'
                  : 'text-[#a89c86] hover:text-[var(--b-ink)] hover:bg-white/[0.05]'
              }`}
            >
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full transition-all duration-300 ${
                  active ? 'h-7 w-1' : 'h-0 w-1'
                }`}
                style={{ background: 'var(--b-grad)' }}
              />
              {active && (
                <span
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(247,196,83,0.20), rgba(247,196,83,0.03) 70%, transparent)',
                    border: '1px solid rgba(247,196,83,0.28)',
                  }}
                />
              )}
              <span
                className={`relative shrink-0 ${active ? 'text-[var(--b1)]' : ''}`}
                style={
                  active
                    ? { filter: 'drop-shadow(0 0 8px rgba(247,196,83,0.7))' }
                    : undefined
                }
              >
                {item.icon}
              </span>
              <span className="relative flex-1 text-left truncate">{item.label}</span>
              {badge > 0 && (
                <span className="relative text-[10px] font-black rounded-full px-1.5 py-0.5 min-w-[18px] text-center text-[#241803]" style={{ background: 'var(--b-grad)' }}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[var(--b1)]/15">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-3 sm:py-2.5 rounded-xl text-sm font-semibold text-[#a89c86] hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 glass border-r border-[var(--b1)]/15 flex-col relative z-10 sticky top-0 h-screen">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {!isDesktop && (
        <>
          {menuOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
          )}
          <aside
            className={`fixed z-50 left-0 top-0 h-full w-[82vw] max-w-[290px] glass border-r border-[var(--b1)]/25 flex flex-col transition-transform duration-300 ease-out safe-top safe-bottom ${
              menuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {sidebar}
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="shrink-0 glass border-b border-[var(--b1)]/15 px-3 sm:px-6 min-h-[60px] flex items-center justify-between gap-2 sticky top-0 z-20 safe-top">
          <div className="flex items-center gap-2.5 min-w-0">
            {!isDesktop && (
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Toggle menu"
                className="w-10 h-10 shrink-0 rounded-xl bg-[var(--b1)]/10 border border-[var(--b1)]/25 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              >
                <span className="flex flex-col gap-[4px]">
                  <span
                    className={`block h-[2px] w-5 rounded-full bg-[var(--b1)] transition-transform duration-300 ${
                      menuOpen ? 'translate-y-[6px] rotate-45' : ''
                    }`}
                  />
                  <span
                    className={`block h-[2px] w-5 rounded-full bg-[var(--b1)] transition-opacity duration-200 ${
                      menuOpen ? 'opacity-0' : ''
                    }`}
                  />
                  <span
                    className={`block h-[2px] w-5 rounded-full bg-[var(--b1)] transition-transform duration-300 ${
                      menuOpen ? '-translate-y-[6px] -rotate-45' : ''
                    }`}
                  />
                </span>
              </button>
            )}

            <h1 className="text-sm sm:text-lg font-black text-[var(--b-ink)] flex items-center gap-2 min-w-0">
              <span
                className="w-1.5 h-4 sm:h-5 rounded-full shrink-0"
                style={{ background: 'var(--b-grad)' }}
              />
              <span className="truncate">{NAV.find((n) => n.key === page)?.label}</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden lg:block">
              <LiveClock />
            </div>

            <span
              className={`flex items-center gap-1.5 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border ${
                apiOk
                  ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
                  : 'text-red-300 border-red-500/30 bg-red-500/10'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${apiOk ? 'bg-emerald-400 live-dot' : 'bg-red-400'}`} />
              {apiOk ? 'LIVE' : 'OFF'}
            </span>

            <button
              onClick={onRefresh}
              aria-label="Refresh"
              className="flex items-center gap-2 text-xs font-bold glass rounded-xl px-3 py-2.5 cursor-pointer hover:border-[var(--b1)]/60 transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[var(--b1)] ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        <main
          className="flex-1 overflow-y-auto p-3 sm:p-6"
          style={{ paddingBottom: 'calc(1.5rem + var(--sab))' }}
        >
          <div key={page} className="fade-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

/** True on real desktop/laptop screens; false on phones and small tablets. */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isDesktop;
}
