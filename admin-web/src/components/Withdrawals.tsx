import React, { useState } from 'react';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import type { Withdrawal } from '../types';
import { adminPost } from '../api';
import { money, dateTime } from '../utils/format';

interface Props {
  withdrawals: Withdrawal[];
  loading: boolean;
  onChanged: () => void;
}

const STATUSES = ['', 'pending', 'processing', 'approved', 'rejected'] as const;

export const Withdrawals: React.FC<Props> = ({ withdrawals, loading, onChanged }) => {
  const [busy, setBusy] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  const filtered = statusFilter ? withdrawals.filter((w) => w.status === statusFilter) : withdrawals;

  const setProcessing = async (id: string) => {
    setBusy(id);
    try {
      await adminPost('/admin/withdraw/processing', { id });
      onChanged();
    } catch (err: any) {
      alert(err?.message || 'Failed');
    } finally {
      setBusy(null);
    }
  };

  const approve = async (id: string) => {
    const ref = window.prompt('UTR / Transaction reference (optional):') || '';
    setBusy(id);
    try {
      await adminPost('/admin/withdraw/approve', { id, ref });
      onChanged();
    } catch (err: any) {
      alert(err?.message || 'Failed');
    } finally {
      setBusy(null);
    }
  };

  const reject = async (id: string) => {
    const reason = window.prompt('Rejection reason (optional):') || '';
    setBusy(id);
    try {
      await adminPost('/admin/withdraw/reject', { id, reason });
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
            {s || 'All'}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500">
          {loading ? 'Loading…' : `${filtered.length} request${filtered.length === 1 ? '' : 's'}`}
        </span>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-premium">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-white/5">
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">UID</th>
                <th className="px-4 py-3 font-semibold">Method</th>
                <th className="px-4 py-3 font-semibold">Address</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => (
                <tr key={w.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-bold text-[#ff8a1e]">{money(w.amount)}</td>
                  <td className="px-4 py-3 font-semibold text-white">{w.phone || '-'}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{w.uid || '-'}</td>
                  <td className="px-4 py-3 text-slate-300 capitalize">{w.method === 'upi' ? 'UPI' : 'Bank'}</td>
                  <td className="px-4 py-3 font-mono text-slate-300 max-w-[220px]">
                    <div className="truncate" title={w.address}>
                      {w.method === 'bank' ? (
                        <>
                          <div className="font-semibold text-white">{w.bankName || '—'}</div>
                          <div className="text-[11px]">A/C {w.accountNumber || '—'}</div>
                          <div className="text-[11px] text-slate-400">
                            {w.ifsc} · {w.holderName}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-semibold text-white">{w.upiId || w.address}</div>
                          <div className="text-[11px] text-slate-400">{w.holderName}</div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] px-2 py-1 capitalize pill ${
                        w.status === 'approved'
                          ? 'pill-green'
                          : w.status === 'rejected'
                          ? 'pill-red'
                          : 'pill-amber'
                      }`}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{dateTime(w.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {(w.status === 'pending' || w.status === 'processing') && (
                      <div className="flex justify-end gap-2">
                        {w.status === 'pending' && (
                          <button
                            onClick={() => setProcessing(w.id)}
                            disabled={busy === w.id}
                            className="inline-flex items-center gap-1.5 bg-sky-600/90 hover:bg-sky-600 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer disabled:opacity-60"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Processing
                          </button>
                        )}
                        <button
                          onClick={() => approve(w.id)}
                          disabled={busy === w.id}
                          className="inline-flex items-center gap-1.5 bg-green-600/90 hover:bg-green-600 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer disabled:opacity-60"
                        >
                          {busy === w.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          Mark Paid
                        </button>
                        <button
                          onClick={() => reject(w.id)}
                          disabled={busy === w.id}
                          className="inline-flex items-center gap-1.5 bg-red-600/80 hover:bg-red-600 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer disabled:opacity-60"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    )}
                    {w.paidAt && (
                      <div className="text-[11px] text-emerald-400">Paid {dateTime(w.paidAt)}</div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    No withdrawal requests.
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
