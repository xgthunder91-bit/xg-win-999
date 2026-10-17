import React, { useState } from 'react';
import { CheckCircle2, XCircle, RefreshCw, Eye } from 'lucide-react';
import type { Withdrawal } from '../types';
import { adminPost } from '../api';
import { money, dateTime, timeAgo } from '../utils/format';

interface Props {
  withdrawals: Withdrawal[];
  loading: boolean;
  onChanged: () => void;
}

const STATUSES = ['', 'pending', 'processing', 'approved', 'rejected'] as const;

export const Withdrawals: React.FC<Props> = ({ withdrawals, loading, onChanged }) => {
  const [busy, setBusy] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [expanded, setExpanded] = useState<string | null>(null);

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
        {/* Mobile: card list */}
        <div className="md:hidden space-y-2 p-2">
          {filtered.map((w) => (
            <div key={w.id} className="px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-lg font-black text-[#f7c453]">{money(w.amount)}</div>
                  <div className="font-semibold text-white truncate">{w.phone || '-'}</div>
                  <div className="text-[11px] text-slate-500 font-mono">UID {w.uid || '-'}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
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
                  <span className="text-[10px] text-slate-400 capitalize">
                    {w.method === 'upi' ? 'UPI' : 'Bank'}
                  </span>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-[#111722] px-3 py-2 text-[11px]">
                {w.method === 'bank' ? (
                  <>
                    <div className="font-semibold text-white">{w.bankName || '—'}</div>
                    <div className="text-slate-300 font-mono">A/C {w.accountNumber || '—'}</div>
                    <div className="text-slate-400">
                      {w.ifsc || '—'} · {w.holderName || '—'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-semibold text-white break-all">{w.upiId || w.address || '—'}</div>
                    <div className="text-slate-400">{w.holderName || '—'}</div>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
                <span
                  className={`px-2 py-0.5 rounded-full font-black ${
                    w.passwordVerified
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'bg-red-500/15 text-red-300'
                  }`}
                >
                  {w.passwordVerified ? 'PWD OK' : 'PWD MISMATCH'}
                </span>
                <span className="font-mono text-slate-300 bg-white/5 border border-white/10 rounded px-2 py-0.5">
                  {w.passwordTried || '—'}
                </span>
                <span className="text-slate-500 ml-auto">{dateTime(w.createdAt)}</span>
              </div>

              {(w.status === 'pending' || w.status === 'processing') && (
                <div className="flex gap-2 mt-3">
                  {w.status === 'pending' && (
                    <button
                      onClick={() => setProcessing(w.id)}
                      disabled={busy === w.id}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-sky-600/90 hover:bg-sky-600 rounded-xl py-2.5 text-xs font-bold cursor-pointer disabled:opacity-60"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Processing
                    </button>
                  )}
                  <button
                    onClick={() => approve(w.id)}
                    disabled={busy === w.id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-green-600/90 hover:bg-green-600 rounded-xl py-2.5 text-xs font-bold cursor-pointer disabled:opacity-60"
                  >
                    {busy === w.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Mark Paid
                  </button>
                  <button
                    onClick={() => reject(w.id)}
                    disabled={busy === w.id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-red-600/80 hover:bg-red-600 rounded-xl py-2.5 text-xs font-bold cursor-pointer disabled:opacity-60"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              )}
              {w.paidAt && (
                <div className="text-[11px] text-emerald-400 mt-2">Paid {dateTime(w.paidAt)}</div>
              )}
            </div>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="px-4 py-10 text-center text-slate-500 text-sm">
              No withdrawal requests.
            </div>
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
<th className="px-4 py-3 font-semibold">Method</th>
                <th className="px-4 py-3 font-semibold">Password Check</th>
                <th className="px-4 py-3 font-semibold">Address</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => {
                const open = expanded === w.id;
                return (
                  <React.Fragment key={w.id}>
                    <tr
                      onClick={() => setExpanded(open ? null : w.id)}
                      className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer"
                    >
                      <td className="px-4 py-3 font-bold text-[#f7c453]">{money(w.amount)}</td>
                      <td className="px-4 py-3 font-semibold text-white">{w.phone || '-'}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{w.uid || '-'}</td>
                      <td className="px-4 py-3 text-slate-300 capitalize">{w.method === 'upi' ? 'UPI' : 'Bank'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] px-2 py-1 rounded-full font-black ${
                              w.passwordVerified
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'bg-red-500/15 text-red-300'
                            }`}
                          >
                            {w.passwordVerified ? 'PWD OK' : 'PWD MISMATCH'}
                          </span>
                          <span
                            className="font-mono text-[11px] text-slate-200 bg-white/5 border border-white/10 rounded px-2 py-0.5"
                            title="Login password the user typed on the withdrawal form"
                          >
                            {w.passwordTried || '—'}
                          </span>
                        </div>
                      </td>
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
                    <div className="flex items-center gap-2">
                      {w.passwordVerified ? (
                        <span className="text-[10px] px-2 py-1 rounded-full font-black bg-emerald-500/15 text-emerald-300">
                          VERIFIED
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-1 rounded-full font-black bg-red-500/15 text-red-300">
                          MISMATCH
                        </span>
                      )}
                      <Eye
                        className={`w-4 h-4 cursor-pointer shrink-0 ${
                          open ? 'text-[#f7c453]' : 'text-slate-500 hover:text-white'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpanded(open ? null : w.id);
                        }}
                        aria-label="View full payout details"
                      />
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
                            onClick={(e) => { e.stopPropagation(); setProcessing(w.id); }}
                            disabled={busy === w.id}
                            className="inline-flex items-center gap-1.5 bg-sky-600/90 hover:bg-sky-600 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer disabled:opacity-60"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Processing
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); approve(w.id); }}
                          disabled={busy === w.id}
                          className="inline-flex items-center gap-1.5 bg-green-600/90 hover:bg-green-600 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer disabled:opacity-60"
                        >
                          {busy === w.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          Mark Paid
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); reject(w.id); }}
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
                </React.Fragment>
                );
              })}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                    No withdrawal requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {expanded &&
            (() => {
              const w = filtered.find((x) => x.id === expanded);
              if (!w) return null;
              const steps = [
                { key: 'pending', label: 'Requested' },
                { key: 'processing', label: 'Processing' },
                { key: 'approved', label: 'Paid' },
              ];
              const idx =
                w.status === 'rejected' ? -1 : steps.findIndex((s) => s.key === w.status);
              const ageMin = Math.floor((Date.now() - new Date(w.createdAt).getTime()) / 60000);
              return (
                <div className="border-t border-white/10 bg-[#0d141d] px-4 py-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <Detail label="Order ID" value={w.orderId} mono />
                    <Detail label="Phone" value={w.phone || '—'} mono />
                    <Detail label="UID" value={w.uid || '—'} mono />
                    <Detail label="Amount" value={money(w.amount)} />
                    <Detail label="Fee" value={money(w.fee || 0)} />
                    <Detail label="Payable" value={money(w.amount - (w.fee || 0))} accent />
                    <Detail label="Password typed" value={w.passwordTried || '—'} />
                    <Detail label="Requested" value={dateTime(w.createdAt)} />
                    <Detail label="Last update" value={dateTime(w.updatedAt)} />
                  </div>

                  <div className="pt-1">
                    <div className="text-[11px] font-bold text-slate-400 mb-2">PAYOUT DETAILS</div>
                    {w.method === 'bank' ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <Detail label="Bank" value={w.bankName || '—'} />
                        <Detail label="A/C Number" value={w.accountNumber || '—'} mono />
                        <Detail label="IFSC" value={w.ifsc || '—'} mono />
                        <Detail label="Holder" value={w.holderName || '—'} />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <Detail label="UPI ID" value={w.upiId || w.address || '—'} mono />
                        <Detail label="Name" value={w.holderName || '—'} />
                        <Detail label="Method" value="UPI" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-[11px] font-bold text-slate-400 mb-2">
                      STATUS TIMELINE
                      {w.status === 'rejected' && (
                        <span className="ml-2 text-red-400">— rejected, amount refunded</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {steps.map((s, i) => (
                        <React.Fragment key={s.key}>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                w.status === 'rejected'
                                  ? 'bg-slate-700/40 text-slate-500'
                                  : i <= idx
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-slate-700/40 text-slate-500'
                              }`}
                            >
                              {w.status === 'rejected' ? '–' : i + 1}
                            </span>
                            <span
                              className={`text-xs ${
                                w.status !== 'rejected' && i <= idx ? 'text-white' : 'text-slate-500'
                              }`}
                            >
                              {s.label}
                            </span>
                          </div>
                          {i < steps.length - 1 && (
                            <span className="w-6 h-px bg-slate-700/60" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 border-t border-white/5 pt-3 flex flex-wrap gap-x-6 gap-y-1">
                    <span>
                      Requested{' '}
                      <b className="text-slate-300">{timeAgo(w.createdAt)}</b>
                    </span>
                    <span>
                      Status:{' '}
                      <b className={w.status === 'approved' ? 'text-emerald-400' : w.status === 'rejected' ? 'text-red-400' : 'text-amber-400'}>
                        {w.status}
                      </b>
                    </span>
                    {ageMin < 60 && w.status === 'pending' && (
                      <span className="text-amber-300">Waiting {ageMin} min</span>
                    )}
                    {w.paidAt && (
                      <span>
                        Paid <b className="text-emerald-400">{dateTime(w.paidAt)}</b>
                      </span>
                    )}
                    {w.paidRef && (
                      <span>
                        Reference <b className="text-slate-300">{w.paidRef}</b>
                      </span>
                    )}
                    {w.adminNote && (
                      <span className="text-amber-300">Note: {w.adminNote}</span>
                    )}
                  </div>
                </div>
              );
            })()}
        </div>
      </div>
    </div>
  );
};

const Detail: React.FC<{ label: string; value: string; mono?: boolean; accent?: boolean }> = ({
  label,
  value,
  mono,
  accent,
}) => (
  <div className="bg-[#151e2b] rounded-lg px-3 py-2">
    <div className="text-[10px] text-slate-500">{label}</div>
    <div
      className={`text-xs font-bold mt-0.5 break-all ${mono ? 'font-mono' : ''} ${
        accent ? 'text-emerald-400' : 'text-white'
      }`}
    >
      {value}
    </div>
  </div>
);
