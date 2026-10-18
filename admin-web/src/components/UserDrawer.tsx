import React, { useEffect, useState, useCallback } from 'react';
import {
  X,
  Ban,
  CheckCircle2,
  Loader2,
  StickyNote,
  PlusCircle,
  MinusCircle,
  SlidersHorizontal,
  Wallet,
  ListOrdered,
Trash2,
  Lock,
  KeyRound,
  Copy,
} from 'lucide-react';
import type { User, Txn, Deposit, Withdrawal } from '../types';
import { adminGet, adminPost } from '../api';
import { money, num, dateTime, timeAgo, screenLabel } from '../utils/format';

interface Props {
  userId: string;
  onClose: () => void;
  onChanged: () => void;
}

interface Detail {
  user: User;
  transactions: Txn[];
  deposits: Deposit[];
  withdrawals: Withdrawal[];
}

type Tab = 'transactions' | 'deposits' | 'withdrawals';

export const UserDrawer: React.FC<Props> = ({ userId, onClose, onChanged }) => {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>('transactions');

  const [mode, setMode] = useState<'credit' | 'debit' | 'set'>('credit');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [copiedPw, setCopiedPw] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGet(`/admin/user/${userId}`);
      setDetail(res.data);
      setNoteDraft(res.data.user.note || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const applyBalance = async () => {
    const amt = Number(amount);
    if (!amt && mode !== 'set') return;
    if (isNaN(amt)) return;
    setBusy(true);
    try {
      await adminPost('/admin/user/balance', { userId, mode, amount: amt, note });
      setAmount('');
      setNote('');
      await load();
      onChanged();
    } catch (err: any) {
      alert(err?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const toggleBan = async () => {
    if (!detail) return;
    setBusy(true);
    try {
      await adminPost('/admin/user/ban', { userId, banned: !detail.user.banned });
      await load();
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const deleteUser = async () => {
    if (!detail) return;
    if (!window.confirm(`Permanently delete ${detail.user.phone}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await adminPost('/admin/user/delete', { userId });
      onChanged();
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async () => {
    if (!detail) return;
    const newPw = window.prompt('Enter new password for ' + detail.user.phone + ' (min 6 chars):');
    if (newPw === null || newPw.trim() === '') return;
    const pw = newPw.trim();
    if (pw.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      await adminPost('/admin/user/password', { userId, password: pw });
      await load();
      alert('Password updated successfully');
    } catch (err: any) {
      alert(err?.message || 'Failed to update password');
    } finally {
      setBusy(false);
    }
  };

  const saveNote = async () => {
    setBusy(true);
    try {
      await adminPost('/admin/user/note', { userId, note: noteDraft });
      await load();
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const approveDeposit = async (orderId: string) => {
    setBusy(true);
    try {
      await adminPost('/admin/deposit/approve', { orderId });
      await load();
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const rejectDeposit = async (orderId: string) => {
    const reason = window.prompt('Rejection reason (optional):') || '';
    setBusy(true);
    try {
      await adminPost('/admin/deposit/reject', { orderId, reason });
      await load();
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-xl glass border-l border-white/10 h-full overflow-y-auto safe-top">
        <div className="sticky top-0 glass border-b border-white/10 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-base font-bold text-white">User Details</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading || !detail ? (
          <div className="p-10 flex items-center justify-center text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <div className="p-5 space-y-5" style={{ paddingBottom: 'calc(1.5rem + var(--sab))' }}>
            {/* Header card */}
            <div className="glass-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {detail.user.avatar ? (
                    <img
                      src={detail.user.avatar}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover border border-white/10 bg-[#0b1017] shrink-0"
                    />
                  ) : (
                    <span className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--b1)] to-[var(--b2)] flex items-center justify-center text-sm font-black text-white shrink-0">
                      {detail.user.phone.slice(0, 2)}
                    </span>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-white">{detail.user.phone}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          detail.user.online ? 'bg-green-400' : 'bg-slate-600'
                        }`}
                      />
                      <span className="text-xs text-slate-400">{detail.user.online ? 'Online' : 'Offline'}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      UID <span className="font-mono text-slate-300">{detail.user.uid}</span> · Last seen {timeAgo(detail.user.lastSeenAt)} · On {screenLabel(detail.user.currentScreen)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-400">{money(detail.user.balance)}</div>
                  <div className="text-[11px] text-slate-500">Wallet balance</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-[#0b1017] rounded-xl px-3 py-2">
                  <div className="text-[10px] text-slate-500">Bets</div>
                  <div className="text-sm font-bold text-white">{num(detail.user.totalBets)}</div>
                </div>
                <div className="bg-[#0b1017] rounded-xl px-3 py-2">
                  <div className="text-[10px] text-slate-500">Wagered</div>
                  <div className="text-sm font-bold text-white">{money(detail.user.totalWagered)}</div>
                </div>
                <div className="bg-[#0b1017] rounded-xl px-3 py-2">
                  <div className="text-[10px] text-slate-500">Won</div>
                  <div className="text-sm font-bold text-white">{money(detail.user.totalWon)}</div>
</div>
            </div>

            {/* Login password — used to verify withdrawal requests */}
            <div className="glass-card p-4 border-amber-500/20">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  Login Password
                </h3>
                {detail.user.password ? (
                  <button
                    onClick={() => setShowPw((v) => !v)}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 cursor-pointer px-2 py-1 rounded-lg hover:bg-amber-500/10 transition-colors"
                  >
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                ) : null}
              </div>

              {detail.user.password ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#0b1017] border border-amber-500/25 rounded-lg px-3 py-2.5 font-mono text-sm text-amber-300 tracking-wider truncate">
                    {showPw ? detail.user.password : '••••••••••'}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(detail.user.password || '');
                      setCopiedPw(true);
                      setTimeout(() => setCopiedPw(false), 1500);
                    }}
                    title="Copy password"
                    className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500/20 cursor-pointer transition-colors shrink-0"
                  >
                    {copiedPw ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Password not stored yet. It saves automatically when the user logs in once, or you
                  can set a new one below.
                </p>
              )}

              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                Match this against the password the user typed on the withdrawal request to verify
                they own the number.
              </p>
            </div>

            <button
              onClick={toggleBan}
              disabled={busy}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                detail.user.banned
                  ? 'bg-green-600/90 hover:bg-green-600 text-white'
                  : 'bg-red-600/80 hover:bg-red-600 text-white'
              }`}
            >
              <Ban className="w-4 h-4" />
              {detail.user.banned ? 'Unban User' : 'Ban User'}
            </button>

              <button
                onClick={deleteUser}
                disabled={busy}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold cursor-pointer bg-white/5 border border-red-500/30 text-red-300 hover:bg-red-500/10 hover:border-red-500/60 transition-colors disabled:opacity-60"
              >
                <Trash2 className="w-4 h-4" />
                Delete User
              </button>

<button
                onClick={changePassword}
                disabled={busy}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold cursor-pointer bg-white/5 border border-slate-700/30 text-slate-300 hover:bg-slate-700/60 transition-colors disabled:opacity-60"
              >
                <Lock className="w-4 h-4 text-[var(--b1)]" />
                Change Password
              </button>
            </div>

            {/* Balance adjust */}
            <div className="glass-card p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[var(--b1)]" /> Adjust Balance
              </h3>
              <div className="flex gap-2 mb-3">
                {(['credit', 'debit', 'set'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 cursor-pointer capitalize chip ${
                      mode === m ? 'chip-active' : ''
                    }`}
                  >
                    {m === 'credit' && <PlusCircle className="w-3.5 h-3.5" />}
                    {m === 'debit' && <MinusCircle className="w-3.5 h-3.5" />}
                    {m === 'set' && <SlidersHorizontal className="w-3.5 h-3.5" />}
                    {m === 'set' ? 'Set to' : m}
                  </button>
                ))}
              </div>
              <div className="space-y-2 mb-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount (₹)"
                  className="w-full min-w-0 bg-[#0b1017] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--b1)]"
                />
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Reason / note (optional)"
                  className="w-full min-w-0 bg-[#0b1017] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--b1)]"
                />
              </div>
              <button
                onClick={applyBalance}
                disabled={busy}
                className="btn-primary w-full py-2.5 text-sm disabled:opacity-60"
              >
                Apply
              </button>
              <p className="text-[11px] text-slate-500 mt-2">
                Use <b>Set to</b> to force the wallet to an exact amount (e.g. fix a stuck/withdrawn balance).
              </p>
            </div>

            {/* Note */}
            <div className="glass-card p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-400" /> Problem / Note
              </h3>
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={2}
                placeholder="e.g. Payment not credited, KYC pending…"
                className="w-full bg-[#0b1017] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--b1)] resize-none"
              />
              <button
                onClick={saveNote}
                disabled={busy}
                className="mt-2 py-2 px-4 rounded-lg bg-[#1c2635] border border-white/10 text-xs font-bold hover:border-[var(--b1)]/50 cursor-pointer disabled:opacity-60"
              >
                Save Note
              </button>
            </div>

            {/* History tabs */}
            <div className="glass-card overflow-hidden">
              <div className="flex border-b border-white/10">
                {([
                  ['transactions', `Transactions (${detail.transactions.length})`],
                  ['deposits', `Deposits (${detail.deposits.length})`],
                  ['withdrawals', `Withdrawals (${detail.withdrawals.length})`],
                ] as [Tab, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`flex-1 text-xs font-bold py-3 cursor-pointer ${
                      tab === key ? 'text-[var(--b1)] border-b-2 border-[var(--b1)]' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {tab === 'transactions' &&
                  (detail.transactions.length === 0 ? (
                    <Empty />
                  ) : (
                    detail.transactions.map((t) => (
                      <div key={t.id} className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 text-sm">
                        <div>
                          <div className="font-semibold text-white capitalize flex items-center gap-1.5">
                            <ListOrdered className="w-3.5 h-3.5 text-slate-500" />
                            {t.type.replace('_', ' ')}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {dateTime(t.createdAt)} · bal {money(t.balanceAfter)}
                            {t.meta?.note ? ` · ${t.meta.note}` : ''}
                          </div>
                        </div>
                        <div className={`font-bold ${t.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {t.amount < 0 ? '-' : '+'}
                          {money(Math.abs(t.amount))}
                        </div>
                      </div>
                    ))
                  ))}

                {tab === 'deposits' &&
                  (detail.deposits.length === 0 ? (
                    <Empty />
                  ) : (
                    detail.deposits.map((d) => (
                      <div key={d.orderId} className="px-4 py-3 border-b border-white/5 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[var(--b1)]">{money(d.amount)}</span>
                          <StatusPill status={d.status} />
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 font-mono">{d.orderId}</div>
                        <div className="text-[11px] text-slate-500">
                          UTR {d.utr || '—'} · TXN {d.txnId || '—'} · {dateTime(d.createdAt)}
                        </div>
                        {(d.status === 'pending' || d.status === 'pending_verification') && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => approveDeposit(d.orderId)}
                              disabled={busy}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-green-600/90 hover:bg-green-600 rounded-lg py-1.5 text-xs font-bold cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Credit
                            </button>
                            <button
                              onClick={() => rejectDeposit(d.orderId)}
                              disabled={busy}
                              className="flex-1 bg-red-600/80 hover:bg-red-600 rounded-lg py-1.5 text-xs font-bold cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ))}

                {tab === 'withdrawals' &&
                  (detail.withdrawals.length === 0 ? (
                    <Empty />
                  ) : (
                    detail.withdrawals.map((w) => (
                      <div key={w.id} className="px-4 py-3 border-b border-white/5 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[var(--b1)]">{money(w.amount)}</span>
                          <StatusPill status={w.status} />
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {w.method} · {w.address || '—'} · {dateTime(w.createdAt)}
                        </div>
                      </div>
                    ))
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Empty: React.FC = () => (
  <div className="px-4 py-8 text-center text-slate-500 text-sm">Nothing here yet.</div>
);

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    pending: 'pill-amber',
    pending_verification: 'pill-amber',
    approved: 'pill-green',
    rejected: 'pill-red',
  };
  return (
    <span className={`text-[10px] px-2 py-1 capitalize pill ${map[status] || 'bg-slate-500/20 text-slate-300'}`}>
      {status.replace('_', ' ')}
    </span>
  );
};
