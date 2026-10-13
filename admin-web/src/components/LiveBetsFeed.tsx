import { useEffect, useState } from 'react';
import { adminGet } from '../api';
import type { LiveBet } from '../types';
import { money, timeAgo, gameLabel } from '../utils/format';

interface Props {
  compact?: boolean;
  limit?: number;
}

export function LiveBetsFeed({ compact = false, limit = 60 }: Props) {
  const [bets, setBets] = useState<LiveBet[]>([]);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () => {
      adminGet('/admin/bets', { limit: String(limit) })
        .then((res) => {
          if (!alive) return;
          setBets(res.data || []);
          setErr(false);
        })
        .catch(() => {
          if (alive) setErr(true);
        });
    };
    load();
    const t = setInterval(load, 3000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [limit]);

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <h2 className="font-bold text-white">Live Betting</h2>
          <span className="text-[11px] font-semibold text-slate-500">kaun · kitna · kya lagaya</span>
        </div>
        <span className="text-xs text-slate-500">{bets.length} bets</span>
      </div>

      {bets.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-500">
          {err ? 'Unable to load live bets.' : 'Waiting for bets… real player bets appear here live.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-premium">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 bg-white/[0.02]">
                <th className="px-5 py-2.5 font-semibold">Time</th>
                <th className="px-3 py-2.5 font-semibold">User</th>
                <th className="px-3 py-2.5 font-semibold">Game</th>
                {!compact && <th className="px-3 py-2.5 font-semibold">Period</th>}
                <th className="px-3 py-2.5 font-semibold">Selection</th>
                <th className="px-5 py-2.5 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bets.map((b) => (
                <tr key={b.id} className="border-t border-white/5 hover:bg-white/[0.02] animate-xg-rise">
                  <td className="px-5 py-2.5 text-slate-400 whitespace-nowrap">{timeAgo(b.createdAt)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-[#ff9429] to-[#ff5500] flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-orange-900/30">
                        {b.phone.slice(0, 2)}
                      </span>
                      <div>
                        <div className="text-white font-semibold leading-tight">{b.phone}</div>
                        <div className="text-[11px] text-slate-500">UID {b.uid}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs font-semibold text-[#ff8a1e] bg-[#ff8a1e]/10 px-2 py-1 rounded-lg whitespace-nowrap">
                      {gameLabel(b.game, b.mode)}
                    </span>
                  </td>
                  {!compact && (
                    <td className="px-3 py-2.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {b.period || '-'}
                    </td>
                  )}
                  <td className="px-3 py-2.5">
                    <span className="text-xs font-bold text-slate-100 bg-white/[0.06] border border-white/10 rounded-lg px-2 py-1 whitespace-nowrap">
                      {b.selection || '-'}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-right font-bold text-white whitespace-nowrap">
                    {money(b.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
