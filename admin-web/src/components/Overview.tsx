import React, { useEffect, useState } from 'react';
import {
  Users as UsersIcon,
  Wifi,
  WifiOff,
  Gamepad2,
  Moon,
  Ban,
  Coins,
  TrendingUp,
  Wallet,
  Clock,
  BadgeCheck,
  ArrowRight,
} from 'lucide-react';
import type { Overview as OverviewType } from '../types';
import type { UserFilter } from './Users';
import type { PageKey } from './Layout';
import { money, num } from '../utils/format';
import { LiveBetsFeed } from './LiveBetsFeed';
import { CountUp } from './CountUp';

interface Props {
  data: OverviewType | null;
  onNavigateUsers?: (filter: UserFilter) => void;
  onNavigate?: (p: PageKey) => void;
}

const ACCENTS: Record<string, string> = {
  sky: 'from-[#3b82f6] to-[#1d4ed8] shadow-blue-900/40',
  green: 'from-[#22c55e] to-[#15803d] shadow-green-900/40',
  slate: 'from-[#64748b] to-[#334155] shadow-slate-900/40',
  red: 'from-[#f43f5e] to-[#9f1239] shadow-red-900/40',
  amber: 'from-[#f59e0b] to-[#b45309] shadow-amber-900/40',
  orange: 'from-[#ff9429] to-[#ff5500] shadow-orange-900/40',
  emerald: 'from-[#10b981] to-[#047857] shadow-emerald-900/40',
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent?: keyof typeof ACCENTS;
  sub?: string;
  onClick?: () => void;
}> = ({ icon, label, value, accent = 'orange', sub, onClick }) => (
  <div
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={(e) => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick();
      }
    }}
    className={`glass-card card-hover stat-card p-4 sm:p-5 group ${
      onClick ? 'cursor-pointer hover:border-[#ff8a1e]/40' : ''
    }`}
  >
    <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
      <span className="text-[11px] sm:text-xs font-semibold text-slate-400 leading-tight">
        {label}
      </span>
      <span
        className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-gradient-to-br ${ACCENTS[accent]} flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
      >
        {icon}
      </span>
    </div>
    <div className="text-[22px] sm:text-[26px] leading-none font-black text-white tracking-tight tabular">
      {value}
    </div>
    {sub ? (
      <div className="text-[10px] sm:text-[11px] text-slate-500 mt-2 flex items-center gap-1">
        {sub}
        {onClick && (
          <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
        )}
      </div>
    ) : null}
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
    <span className="w-1 h-4 rounded-full bg-gradient-to-b from-[#ff9429] to-[#ff5500]" />
    {children}
  </h2>
);

function HeroClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="tabular">
      {now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
      {' · '}
      {now.toLocaleTimeString('en-IN', { hour12: false })}
    </span>
  );
}

export const Overview: React.FC<Props> = ({ data, onNavigateUsers, onNavigate }) => {
  if (!data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass-card p-5 h-[128px] shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* Hero */}
      <div className="hero p-5 sm:p-7">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative shrink-0">
              <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-br from-[#ff9a2e] to-[#ff5500] opacity-50 blur-lg animate-xg-glow" />
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-white/15 shadow-2xl shadow-orange-900/50">
                <img src="/emblem.png" alt="XG Win 99" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-lg sm:text-2xl font-black text-white tracking-tight truncate">
                Welcome back, Admin
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] sm:text-xs">
                <span className="flex items-center gap-1.5 font-bold text-green-300">
                  <span className="w-2 h-2 rounded-full bg-green-400 live-dot" />
                  LIVE
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400">
                  <HeroClock />
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 lg:ml-auto w-full lg:w-auto">
            <HeroStat
              label="Online"
              value={num(data.onlineUsers)}
              tone="green"
              onClick={() => onNavigateUsers?.('online')}
            />
            <HeroStat
              label="Pending Dep"
              value={num(data.pendingDeposits)}
              tone="amber"
              onClick={() => onNavigate?.('deposits')}
            />
            <HeroStat
              label="Pending WD"
              value={num(data.pendingWithdrawals)}
              tone="rose"
              onClick={() => onNavigate?.('withdrawals')}
            />
          </div>
        </div>
      </div>

      <div>
        <SectionTitle>User Activity</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger">
          <StatCard icon={<UsersIcon className="w-5 h-5" />} label="Total Users" value={<CountUp value={data.totalUsers} format={num} />} accent="sky" sub="tap to view all" onClick={() => onNavigateUsers?.('all')} />
          <StatCard icon={<Wifi className="w-5 h-5" />} label="Online Now" value={<CountUp value={data.onlineUsers} format={num} />} accent="green" sub="active in last 60s" onClick={() => onNavigateUsers?.('online')} />
          <StatCard icon={<WifiOff className="w-5 h-5" />} label="Offline" value={<CountUp value={data.offlineUsers} format={num} />} accent="slate" onClick={() => onNavigateUsers?.('offline')} />
          <StatCard icon={<Ban className="w-5 h-5" />} label="Banned" value={<CountUp value={data.bannedUsers} format={num} />} accent="red" onClick={() => onNavigateUsers?.('banned')} />
        </div>
      </div>

      <div>
        <SectionTitle>Betting</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger">
          <StatCard icon={<Gamepad2 className="w-5 h-5" />} label="Betting Users" value={<CountUp value={data.bettingUsers} format={num} />} accent="green" sub="placed at least 1 bet" onClick={() => onNavigateUsers?.('betting')} />
          <StatCard icon={<Moon className="w-5 h-5" />} label="Non-Betting" value={<CountUp value={data.nonBettingUsers} format={num} />} accent="amber" sub="never placed a bet" onClick={() => onNavigateUsers?.('nonbetting')} />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Total Bets" value={<CountUp value={data.totalBets} format={num} />} accent="orange" />
          <StatCard icon={<Coins className="w-5 h-5" />} label="Total Wagered" value={<CountUp value={data.totalWagered} format={money} />} accent="orange" />
        </div>
      </div>

      <div>
        <SectionTitle>Money</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger">
          <StatCard icon={<Wallet className="w-5 h-5" />} label="Wallet Balances" value={<CountUp value={data.totalBalance} format={money} />} accent="emerald" sub="total across users" />
          <StatCard icon={<Clock className="w-5 h-5" />} label="Pending Deposits" value={<CountUp value={data.pendingDeposits} format={num} />} accent="amber" sub="needs review" onClick={() => onNavigate?.('deposits')} />
          <StatCard icon={<BadgeCheck className="w-5 h-5" />} label="Approved Deposits" value={<CountUp value={data.totalDeposited} format={money} />} accent="green" sub={`${num(data.approvedDeposits)} approved`} />
          <StatCard icon={<Clock className="w-5 h-5" />} label="Pending Withdrawals" value={<CountUp value={data.pendingWithdrawals} format={num} />} accent="amber" sub="needs payout" onClick={() => onNavigate?.('withdrawals')} />
        </div>
      </div>

      <div>
        <SectionTitle>Live Betting</SectionTitle>
        <LiveBetsFeed compact />
      </div>
    </div>
  );
};

const HERO_TONES: Record<string, string> = {
  green: 'text-green-300 border-green-500/25 bg-green-500/10',
  amber: 'text-amber-300 border-amber-500/25 bg-amber-500/10',
  rose: 'text-rose-300 border-rose-500/25 bg-rose-500/10',
};

const HeroStat: React.FC<{
  label: string;
  value: string;
  tone: keyof typeof HERO_TONES;
  onClick?: () => void;
}> = ({ label, value, tone, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-left rounded-xl border px-3 py-2.5 backdrop-blur-sm transition-all hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer ${HERO_TONES[tone]}`}
  >
    <div className="text-lg sm:text-2xl font-black leading-none tabular">{value}</div>
    <div className="text-[10px] sm:text-[11px] font-semibold opacity-80 mt-1">{label}</div>
  </button>
);
