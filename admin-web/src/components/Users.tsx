import React, { useState } from 'react';
import { Search, Eye, StickyNote, Ban } from 'lucide-react';
import type { User } from '../types';
import { money, num, timeAgo, screenLabel } from '../utils/format';

const Avatar: React.FC<{ user: User }> = ({ user }) => {
  const [broken, setBroken] = useState(false);
  if (user.avatar && !broken) {
    return (
      <img
        src={user.avatar}
        alt={user.phone}
        onError={() => setBroken(true)}
        className="w-9 h-9 rounded-full object-cover border border-white/10 bg-[#0b1017] shrink-0"
      />
    );
  }
  return (
    <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ff9429] to-[#ff5500] flex items-center justify-center text-[11px] font-black text-white shrink-0">
      {user.phone.slice(0, 2)}
    </span>
  );
};

export type UserFilter = 'all' | 'online' | 'offline' | 'betting' | 'nonbetting' | 'banned';

interface Props {
  users: User[];
  search: string;
  onSearch: (v: string) => void;
  filter: UserFilter;
  onFilter: (f: UserFilter) => void;
  onSelect: (u: User) => void;
  loading: boolean;
}

const FILTERS: { key: UserFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'online', label: 'Online' },
  { key: 'offline', label: 'Offline' },
  { key: 'betting', label: 'Betting' },
  { key: 'nonbetting', label: 'Non-Betting' },
  { key: 'banned', label: 'Banned' },
];

export const Users: React.FC<Props> = ({ users, search, onSearch, filter, onFilter, onSelect, loading }) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 glass rounded-xl px-3 py-2.5 w-80 max-w-full focus-within:border-[#ff8a1e]/70 transition-colors">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by phone number or UID…"
            className="bg-transparent outline-none text-sm text-white w-full placeholder:text-slate-600"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => onFilter(f.key)}
              className={`text-xs rounded-xl px-3 py-2 cursor-pointer chip ${
                filter === f.key ? 'chip-active' : ''
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="ml-auto text-xs text-slate-500">
          {loading ? 'Loading…' : `${users.length} user${users.length === 1 ? '' : 's'}`}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {/* Mobile: card list */}
        <div className="md:hidden divide-y divide-white/5">
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => onSelect(u)}
              className="w-full text-left px-4 py-3.5 active:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <Avatar user={u} />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0f1621] ${
                      u.online ? 'bg-green-400' : 'bg-slate-600'
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white truncate">{u.phone}</span>
                    {u.banned && (
                      <span className="text-[10px] font-bold text-red-300 bg-red-500/15 rounded px-1.5 py-0.5 shrink-0">
                        BANNED
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">UID {u.uid}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-emerald-400">{money(u.balance)}</div>
                  <div className="text-[10px] text-slate-500">{timeAgo(u.lastSeenAt)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2.5 text-[11px] text-slate-400">
                <span>
                  Bets <b className="text-slate-200">{num(u.totalBets)}</b>
                </span>
                <span>
                  Wagered <b className="text-slate-200">{money(u.totalWagered)}</b>
                </span>
                <span className="truncate">{screenLabel(u.currentScreen)}</span>
                <span className="ml-auto text-[#ff8a1e] font-bold">Manage</span>
              </div>
            </button>
          ))}
          {users.length === 0 && !loading && (
            <div className="px-4 py-10 text-center text-slate-500 text-sm">No users found.</div>
          )}
        </div>

        {/* Desktop: table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm table-premium">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-white/5">
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">UID</th>
                <th className="px-4 py-3 font-semibold text-right">Balance</th>
                <th className="px-4 py-3 font-semibold text-right">Bets</th>
                <th className="px-4 py-3 font-semibold text-right">Wagered</th>
                <th className="px-4 py-3 font-semibold text-right">Won</th>
                <th className="px-4 py-3 font-semibold">On Screen</th>
                <th className="px-4 py-3 font-semibold">Last Seen</th>
                <th className="px-4 py-3 font-semibold">Note</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          u.online ? 'bg-green-400' : 'bg-slate-600'
                        }`}
                        title={u.online ? 'Online' : 'Offline'}
                      />
                      {u.banned && (
                        <span className="text-[10px] font-bold text-red-300 bg-red-500/15 rounded px-1.5 py-0.5">
                          <Ban className="w-3 h-3 inline" /> BANNED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar user={u} />
                      <span className="font-semibold text-white">{u.phone}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">{u.uid}</td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-400">{money(u.balance)}</td>
                  <td className="px-4 py-3 text-right text-slate-200">{num(u.totalBets)}</td>
                  <td className="px-4 py-3 text-right text-slate-200">{money(u.totalWagered)}</td>
                  <td className="px-4 py-3 text-right text-slate-200">{money(u.totalWon)}</td>
                  <td className="px-4 py-3 text-slate-300">{screenLabel(u.currentScreen)}</td>
                  <td className="px-4 py-3 text-slate-400">{timeAgo(u.lastSeenAt)}</td>
                  <td className="px-4 py-3">
                    {u.note ? (
                      <span className="flex items-center gap-1 text-amber-300 text-xs max-w-[160px] truncate" title={u.note}>
                        <StickyNote className="w-3 h-3 shrink-0" />
                        {u.note}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onSelect(u)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#1c2635]/70 border border-white/10 rounded-lg px-3 py-1.5 hover:border-[#ff8a1e]/60 hover:text-[#ff8a1e] hover:-translate-y-0.5 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
