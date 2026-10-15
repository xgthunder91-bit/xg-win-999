import React, { useState } from 'react';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import type { Deposit } from '../types';
import { adminPost } from '../api';
import { money, dateTime } from '../utils/format';

interface Props {
  deposits: Deposit[];
  loading: boolean;
  onChanged: () => void;
}

const STATUSES = ['', 'pending_verification', 'approved', 'rejected'] as const;

export const Deposits: React.FC<Props> = ({ deposits, loading, onChanged }) => {
  const [busy, setBusy] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending_verification');

  const filtered = statusFilter ? deposits.filter((d) => d.status === statusFilter) : deposits;

  const approve = async (orderId: string) => {
    setBusy(orderId);
    try {
      await adminPost('/admin/deposit/approve', { orderId });
      onChanged();
    } catch (err: any) {
      alert(err?.message || 'Failed');
    } finally {
      setBusy(null);
    }
  };

  const reject = async (orderId: string) => {
    const reason = window.prompt('Rejection reason (optional):') || '';
    setBusy(orderId);
    try {
      await adminPost('/admin/deposit/reject', { orderId, reason });
      onChanged();
    } catch (err: any) {
      alert(err?.message || 'Failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`text-xs rounded-xl px-3 py-2 cursor-pointer capitalize chip ${
              statusFilter === s ? 'chip-active' : ''
            }`}
          >
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500">
          {loading ? 'Loading…' : `${filtered.length} request${filtered.length === 1 ? '' : 's'}`}
        </span>
      </div>

      <div className="glass-card overflow-hidden">
        {/* Mobile: card list */}
        <div className="md:hidden divide-y divide-white/5">
          {filtered.map((d) => (
            <div key={d.orderId} className="px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-lg font-black text-[#ff8a1e]">{money(d.amount)}</div>
                  <div className="font-semibold text-white truncate">{d.phone || '-'}</div>
                  <div className="text-[11px] text-slate-500 font-mono">UID {d.uid || '-'}</div>
                </div>
                <span
                  className={`text-[10px] px-2 py-1 capitalize pill shrink-0 ${
                    d.status === 'approved'
                      ? 'pill-green'
                      : d.status === 'rejected'
                      ? 'pill-red'
                      : 'pill-amber'
                  }`}
                >
                  {d.status.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
                <div className="bg-[#111722] rounded-lg px-2.5 py-1.5">
                  <div className="text-slate-500">UTR</div>
                  <div className="font-mono text-slate-200 truncate">{d.utr || '—'}</div>
                </div>
                <div className="bg-[#111722] rounded-lg px-2.5 py-1.5">
                  <div className="text-slate-500">TXN ID</div>
                  <div className="font-mono text-slate-200 truncate">{d.txnId || '—'}</div>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 mt-2">{dateTime(d.createdAt)}</div>

              {(d.status === 'pending' || d.status === 'pending_verification') && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => approve(d.orderId)}
                    disabled={busy === d.orderId}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-green-600/90 hover:bg-green-600 rounded-xl py-2.5 text-sm font-bold cursor-pointer disabled:opacity-60"
                  >
                    {busy === d.orderId ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Approve
                  </button>
                  <button
                    onClick={() => reject(d.orderId)}
                    disabled={busy === d.orderId}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-red-600/80 hover:bg-red-600 rounded-xl py-2.5 text-sm font-bold cursor-pointer disabled:opacity-60"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="px-4 py-10 text-center text-slate-500 text-sm">No deposit requests.</div>
          )}
        </div>

        {/* Desktop: table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm table-premium">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-white/5">
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">UID</th>
                <th className="px-4 py-3 font-semibold">UTR</th>
                <th className="px-4 py-3 font-semibold">TXN ID</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.orderId} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-bold text-[#ff8a1e]">{money(d.amount)}</td>
                  <td className="px-4 py-3 font-semibold text-white">{d.phone || '-'}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{d.uid || '-'}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{d.utr || '—'}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{d.txnId || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] px-2 py-1 capitalize pill ${
                        d.status === 'approved'
                          ? 'pill-green'
                          : d.status === 'rejected'
                          ? 'pill-red'
                          : 'pill-amber'
                      }`}
                    >
                      {d.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{dateTime(d.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {(d.status === 'pending' || d.status === 'pending_verification') && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => approve(d.orderId)}
                          disabled={busy === d.orderId}
                          className="inline-flex items-center gap-1.5 bg-green-600/90 hover:bg-green-600 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer disabled:opacity-60"
                        >
                          {busy === d.orderId ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          Approve
                        </button>
                        <button
                          onClick={() => reject(d.orderId)}
                          disabled={busy === d.orderId}
                          className="inline-flex items-center gap-1.5 bg-red-600/80 hover:bg-red-600 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer disabled:opacity-60"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    No deposit requests.
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
