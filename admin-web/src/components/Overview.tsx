import React from 'react';
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
} from 'lucide-react';
import type { Overview as OverviewType } from '../types';
import type { UserFilter } from './Users';
import { money, num } from '../utils/format';
import { LiveBetsFeed } from './LiveBetsFeed';

interface Props {
  data: OverviewType | null;
  onNavigateUsers?: (filter: UserFilter) => void;
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
  value: string;
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
    className={`glass-card card-hover p-5 group ${
      onClick ? 'cursor-pointer hover:border-[#ff8a1e]/40' : ''
    }`}
  >
    <div className="flex items-start justify-between mb-4">
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <span
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ACCENTS[accent]} flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
      >
        {icon}
      </span>
    </div>
    <div className="text-[26px] leading-none font-black text-white tracking-tight">{value}</div>
    {sub && <div className="text-[11px] text-slate-500 mt-2">{sub}</div>}
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
    <span className="w-1 h-4 rounded-full bg-gradient-to-b from-[#ff9429] to-[#ff5500]" />
    {children}
  </h2>
);

export const Overview: React.FC<Props> = ({ data, onNavigateUsers }) => {
  if (!data) {
    return <div className="text-slate-500 text-sm">Loading dashboard…</div>;
  }

  return (
    <div className="space-y-7">
      <div>
        <SectionTitle>User Activity</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          <StatCard icon={<UsersIcon className="w-5 h-5" />} label="Total Users" value={num(data.totalUsers)} accent="sky" sub="tap to view all" onClick={() => onNavigateUsers?.('all')} />
          <StatCard icon={<Wifi className="w-5 h-5" />} label="Online Now" value={num(data.onlineUsers)} accent="green" sub="active in last 60s" onClick={() => onNavigateUsers?.('online')} />
          <StatCard icon={<WifiOff className="w-5 h-5" />} label="Offline" value={num(data.offlineUsers)} accent="slate" onClick={() => onNavigateUsers?.('offline')} />
          <StatCard icon={<Ban className="w-5 h-5" />} label="Banned" value={num(data.bannedUsers)} accent="red" onClick={() => onNavigateUsers?.('banned')} />
        </div>
      </div>

      <div>
        <SectionTitle>Betting</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          <StatCard icon={<Gamepad2 className="w-5 h-5" />} label="Betting Users" value={num(data.bettingUsers)} accent="green" sub="placed at least 1 bet" onClick={() => onNavigateUsers?.('betting')} />
          <StatCard icon={<Moon className="w-5 h-5" />} label="Non-Betting" value={num(data.nonBettingUsers)} accent="amber" sub="never placed a bet" onClick={() => onNavigateUsers?.('nonbetting')} />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Total Bets" value={num(data.totalBets)} accent="orange" />
          <StatCard icon={<Coins className="w-5 h-5" />} label="Total Wagered" value={money(data.totalWagered)} accent="orange" />
        </div>
      </div>

      <div>
        <SectionTitle>Money</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          <StatCard icon={<Wallet className="w-5 h-5" />} label="Wallet Balances (total)" value={money(data.totalBalance)} accent="emerald" />
          <StatCard icon={<Clock className="w-5 h-5" />} label="Pending Deposits" value={num(data.pendingDeposits)} accent="amber" />
          <StatCard icon={<BadgeCheck className="w-5 h-5" />} label="Approved Deposits" value={money(data.totalDeposited)} accent="green" sub={`${num(data.approvedDeposits)} approved`} />
          <StatCard icon={<Clock className="w-5 h-5" />} label="Pending Withdrawals" value={num(data.pendingWithdrawals)} accent="amber" />
        </div>
      </div>

      <div>
        <SectionTitle>Live Betting</SectionTitle>
        <LiveBetsFeed compact />
      </div>
    </div>
  );
};
