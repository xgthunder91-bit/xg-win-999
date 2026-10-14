import React, { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  Smartphone,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Lock,
  ChevronRight,
  ChevronLeft,
  History,
  Copy,
  Check,
} from 'lucide-react';
import { apiPost, apiGet } from '../utils/api';

interface Props {
  balance: number;
  userId?: string;
  onBalanceChange?: (newBalance: number) => void;
  onBack: () => void;
}

type Method = 'upi' | 'bank';

/** Minimum payout amount in rupees (keep in sync with server MIN_WITHDRAWAL). */
const MIN_WITHDRAWAL = 110;

interface WithdrawalRecord {
  id: string;
  orderId: string;
  amount: number;
  fee: number;
  method: Method;
  address: string;
  holderName?: string;
bankName?: string;
  ifsc?: string;
  accountNumber?: string;
  status: 'pending' | 'processing' | 'approved' | 'rejected';
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string | null;
}

const inputCls =
  'w-full bg-[#111923] border border-white/10 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#ff8a1e]/70';

const Label: React.FC<{ children: React.ReactNode; hint?: string }> = ({ children, hint }) => (
  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
    {children}
    {hint && <span className="text-slate-500 font-normal"> ({hint})</span>}
  </label>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { cls: string; label: string; icon: React.ReactNode }> = {
    pending: { cls: 'bg-amber-500/15 text-amber-300', label: 'Pending', icon: <Clock className="w-3.5 h-3.5" /> },
    processing: { cls: 'bg-sky-500/15 text-sky-300', label: 'Processing', icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
    approved: { cls: 'bg-emerald-500/15 text-emerald-300', label: 'Paid', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    rejected: { cls: 'bg-red-500/15 text-red-300', label: 'Rejected', icon: <XCircle className="w-3.5 h-3.5" /> },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${s.cls}`}>
      {s.icon}
      {s.label}
    </span>
  );
};

const TIMELINE = ['pending', 'processing', 'approved'] as const;

export const WithdrawView: React.FC<Props> = ({ balance, userId, onBalanceChange, onBack }) => {
  const [tab, setTab] = useState<'form' | 'history'>('form');
  const [method, setMethod] = useState<Method>('upi');

  // amount + auth
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // upi
  const [upiId, setUpiId] = useState('');
  const [holderName, setHolderName] = useState('');

  // bank
  const [banks, setBanks] = useState<{ code: string; name: string }[]>([]);
  const [bankName, setBankName] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [resolvedBank, setResolvedBank] = useState('');
  const [ifscLoading, setIfscLoading] = useState(false);
  const [ifscError, setIfscError] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccount, setConfirmAccount] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<WithdrawalRecord | null>(null);

  const [history, setHistory] = useState<WithdrawalRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [copied, setCopied] = useState('');

  const loadHistory = useCallback(async () => {
    if (!userId) return;
    setHistoryLoading(true);
    try {
      const res = await apiGet(`/user/withdrawals?userId=${encodeURIComponent(userId)}`);
      setHistory(res.data || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    apiGet('/banks')
      .then((r) => setBanks(r.data?.banks || []))
      .catch(() => setBanks([]));
  }, []);

  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab, loadHistory]);

  /** Resolve the bank name from the IFSC code automatically. */
  const lookupIfsc = async (code: string) => {
    const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setIfsc(clean);
    setResolvedBank('');
    setIfscError('');
    if (clean.length < 11) return;
    setIfscLoading(true);
    try {
      const r = await apiGet(`/bank/ifsc?ifsc=${encodeURIComponent(clean)}`);
      if (r.success) {
        setResolvedBank(r.data.bankName);
        setBankName(r.data.bankName);
        setIfscError('');
      } else {
        setIfscError(r.message || 'Bank not recognised');
      }
    } catch (e: any) {
      setIfscError(e?.message || 'Could not verify IFSC');
    } finally {
      setIfscLoading(false);
    }
  };

const accountMatch = accountNumber.length > 0 && accountNumber === confirmAccount;

  /** Everything still required before the submit button unlocks. */
  const missing: string[] = [];
  if (!userId) missing.push('Not logged in — please sign in again');
  if (!(Number(amount) >= MIN_WITHDRAWAL)) missing.push(`Enter an amount of at least ₹${MIN_WITHDRAWAL}`);
  if (!password) missing.push('Enter your login password');
  if (method === 'upi') {
    if (!/^[\w.\-]{2,64}@[a-zA-Z]{2,64}$/.test(upiId)) missing.push('Enter a valid UPI ID (name@bank)');
    if (!holderName.trim()) missing.push('Enter your name');
  } else {
    if (!bankName) missing.push('Select your bank');
    if (!resolvedBank) missing.push('Enter a valid IFSC code (11 characters)');
    if (!/^\d{9,18}$/.test(accountNumber)) missing.push('Enter your account number');
    if (!accountMatch) missing.push('Account numbers must match');
    if (!holderName.trim()) missing.push('Enter the account holder name');
  }
  const canSubmit = missing.length === 0;

const submit = async () => {
    if (submitting) return;
    if (missing.length > 0) {
      setError(missing[0]);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload: Record<string, any> = {
        userId,
        amount: Number(amount),
        method,
        password,
        holderName: holderName.trim(),
      };
      if (method === 'upi') {
        payload.upiId = upiId.trim();
      } else {
        payload.bankName = bankName;
        payload.ifsc = ifsc;
        payload.accountNumber = accountNumber.trim();
        payload.confirmAccountNumber = confirmAccount.trim();
      }
      const r = await apiPost('/user/withdraw', payload);
      if (!r.success) throw new Error(r.message || 'Withdrawal failed');
      setSuccess(r.data);
      onBalanceChange?.(r.data.balance);
      loadHistory();
    } catch (e: any) {
      setError(e?.message || 'Withdrawal failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  /* ---------------- success screen ---------------- */
  if (success) {
    const step = TIMELINE.indexOf(success.status as any);
    return (
      <div className="min-h-screen bg-[#111923] text-white">
        <Header onBack={onBack} />
        <div className="px-4 py-8 space-y-4 max-w-md mx-auto">
          <div className="bg-[#151e2b] border border-emerald-500/30 rounded-2xl p-5 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="font-bold text-lg">Withdrawal Requested</h2>
            <p className="text-xs text-slate-400 mt-1">Your request has been received</p>

            <div className="mt-4 flex items-center justify-center gap-1">
              {TIMELINE.map((s, i) => (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        i <= step ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/40 text-slate-500'
                      }`}
                    >
                      {i <= step ? <Check className="w-4 h-4" /> : <span className="text-xs">{i + 1}</span>}
                    </div>
                    <span className={`text-[10px] ${i <= step ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {s === 'pending' ? 'Submitted' : s === 'processing' ? 'Processing' : 'Paid'}
                    </span>
                  </div>
                  {i < TIMELINE.length - 1 && (
                    <div className={`w-10 h-0.5 -mt-4 ${i < step ? 'bg-emerald-500/50' : 'bg-slate-700/50'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="bg-[#151e2b] border border-white/5 rounded-2xl p-4 space-y-2 text-sm">
            <Row label="Order ID" value={success.orderId} onCopy={() => copy(success.orderId, 'oid')} />
            <Row label="Amount" value={`₹${success.amount}`} />
            <Row label="Fee" value={`₹${success.fee}`} />
            <Row label="You will receive" value={`₹${success.amount - success.fee}`} accent />
            <Row label="To" value={success.method === 'upi' ? success.address : `${success.bankName} ${success.accountNumber}`} onCopy={() => copy(success.address, 'addr')} />
            <Row label="Requested" value={fmt(success.createdAt)} />
          </div>

          <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 text-xs text-sky-200">
            Payout is usually processed within 1 hour. Keep this order ID — you can track it in
            <b> History</b>.
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setSuccess(null); setTab('history'); }}
              className="flex-1 py-3 rounded-full bg-[#1c2635] border border-white/10 text-xs font-bold"
            >
              View History
            </button>
            <button
              onClick={() => {
                setSuccess(null); setAmount(''); setPassword(''); setUpiId(''); setIfsc('');
                setAccountNumber(''); setConfirmAccount(''); setHolderName('');
              }}
              className="flex-1 py-3 rounded-full bg-gradient-to-r from-[#ff9429] to-[#ff6300] text-white text-xs font-bold"
            >
              New Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- main ---------------- */
  return (
    <div className="min-h-screen bg-[#111923] text-white">
      <Header onBack={onBack} />

      <div className="px-3.5 pt-3.5 space-y-4 pb-10">
        {/* tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab('form')}
            className={`flex-1 py-2.5 rounded-full text-xs font-bold ${
              tab === 'form'
                ? 'bg-gradient-to-r from-[#ff9429] to-[#ff6300] text-white'
                : 'bg-[#151e2b] border border-white/10 text-slate-300'
            }`}
          >
            New Withdrawal
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-bold ${
              tab === 'history'
                ? 'bg-gradient-to-r from-[#ff9429] to-[#ff6300] text-white'
                : 'bg-[#151e2b] border border-white/10 text-slate-300'
            }`}
          >
            <History className="w-3.5 h-3.5" /> History
          </button>
        </div>

        {tab === 'form' ? (
          <>
            {/* balance */}
            <div className="bg-[#151e2b] border border-slate-700/80 rounded-xl px-3.5 py-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">Available balance</span>
              <span className="font-black text-[#ff8a1e]">₹{Number(balance).toFixed(2)}</span>
            </div>

            {/* method */}
            <div>
              <Label>Withdraw to</Label>
              <div className="grid grid-cols-2 gap-2">
                <MethodBtn active={method === 'upi'} onClick={() => setMethod('upi')} icon={<Smartphone className="w-4 h-4" />} title="UPI" sub="Instant" />
                <MethodBtn active={method === 'bank'} onClick={() => setMethod('bank')} icon={<Building2 className="w-4 h-4" />} title="Bank" sub="1 hour" />
              </div>
            </div>

            {/* amount */}
            <div>
              <Label hint={`min ₹${MIN_WITHDRAWAL}`}>Amount</Label>
              <div className="bg-[#151e2b] border border-slate-700/80 rounded-xl px-3.5 py-3 flex items-center gap-2">
                <span className="text-lg font-extrabold text-[#ff8a1e]">₹</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="bg-transparent text-white font-bold text-base w-full focus:outline-none placeholder:text-slate-500"
                />
                <button
                  onClick={() => setAmount(String(Math.floor(Number(balance))))}
                  className="text-[11px] font-bold text-[#ff8a1e] px-2 py-1 rounded-full bg-[#ff8a1e]/10 shrink-0"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* UPI fields */}
            {method === 'upi' && (
              <div className="space-y-3">
                <div>
                  <Label hint="e.g. yourname@okhdfcbank">UPI ID</Label>
                  <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@bank" className={inputCls} />
                </div>
                <div>
                  <Label>Name as on UPI</Label>
                  <input value={holderName} onChange={(e) => setHolderName(e.target.value)} placeholder="Full name" className={inputCls} />
                </div>
              </div>
            )}

            {/* Bank fields */}
            {method === 'bank' && (
              <div className="space-y-3">
                <div>
                  <Label>Select bank</Label>
                  <div className="relative">
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className={`${inputCls} appearance-none pr-10`}
                    >
                      <option value="" className="bg-[#111923]">Choose your bank</option>
                      {banks.map((b) => (
                        <option key={b.code} value={b.name} className="bg-[#111923]">
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <Label hint="11 characters">IFSC code</Label>
                  <div className="relative">
                    <input
                      value={ifsc}
                      onChange={(e) => lookupIfsc(e.target.value)}
                      placeholder="SBIN0001234"
                      maxLength={11}
                      className={`${inputCls} pr-10 uppercase`}
                    />
                    {ifscLoading ? (
                      <Loader2 className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    )}
                  </div>
                  {resolvedBank && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {resolvedBank}
                    </div>
                  )}
                  {ifscError && <div className="mt-1.5 text-xs text-red-400">{ifscError}</div>}
                </div>

                <div>
                  <Label>Account number</Label>
                  <input
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter account number"
                    inputMode="numeric"
                    className={inputCls}
                  />
                </div>

                <div>
                  <Label>Confirm account number</Label>
                  <input
                    value={confirmAccount}
                    onChange={(e) => setConfirmAccount(e.target.value.replace(/\D/g, ''))}
                    placeholder="Re-enter account number"
                    inputMode="numeric"
                    className={`${inputCls} ${accountNumber ? (accountMatch ? '!border-emerald-500/60' : '!border-red-500/50') : ''}`}
                  />
                  {accountNumber && (
                    <div className={`mt-1.5 text-xs flex items-center gap-1.5 ${accountMatch ? 'text-emerald-400' : 'text-red-400'}`}>
                      {accountMatch ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      {accountMatch ? 'Account numbers match' : 'Account numbers do not match'}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Account holder name</Label>
                  <input value={holderName} onChange={(e) => setHolderName(e.target.value)} placeholder="Name on bank records" className={inputCls} />
                </div>
              </div>
            )}

            {/* password */}
            <div>
              <Label hint="security check">Game login password</Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your login password"
                  className={`${inputCls} pl-9 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400"
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

{!canSubmit && missing.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3.5 py-3 space-y-1">
                <div className="text-[11px] font-bold text-amber-300">Complete these to continue:</div>
                {missing.map((m) => (
                  <div key={m} className="text-[11px] text-amber-200/80 flex items-start gap-1.5">
                    <span className="text-amber-400">•</span>
                    <span>{m}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={submit}
              disabled={submitting}
              className={`w-full py-3.5 rounded-full text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 ${
                canSubmit
                  ? 'bg-gradient-to-r from-[#ff9429] to-[#ff6300]'
                  : 'bg-[#2a3547] text-slate-300'
              } disabled:opacity-60`}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Submitting…' : `Withdraw ₹${amount || '0'}`}
            </button>

            <div className="flex items-start gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                Minimum ₹{MIN_WITHDRAWAL}. Payout is sent to your account within 1 hour after
                approval. Your balance is deducted now and refunded automatically if rejected.
              </span>
            </div>
          </>
        ) : (
          <div className="space-y-2.5">
            {historyLoading ? (
              <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 text-slate-500 animate-spin" /></div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">No withdrawals yet.</div>
            ) : (
              history.map((w) => (
                <div key={w.id} className="bg-[#151e2b] border border-white/5 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#ff8a1e]">₹{w.amount}</div>
                      <div className="text-[10px] text-slate-500">{w.orderId}</div>
                    </div>
                    <StatusBadge status={w.status} />
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    <div>{w.method === 'upi' ? 'UPI' : w.bankName} · {w.address}</div>
                    <div>Requested: {fmt(w.createdAt)}</div>
                    {w.paidAt && <div className="text-emerald-400">Paid: {fmt(w.paidAt)}</div>}
                    {w.adminNote && <div className="text-amber-300">Note: {w.adminNote}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------- small pieces ---------- */

const Header: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <header className="px-4 py-3.5 flex items-center justify-between">
    <button onClick={onBack} className="p-1 text-slate-200 active:scale-90 transition-transform">
      <ChevronLeft className="w-6 h-6" />
    </button>
    <span className="font-bold text-sm">Withdraw</span>
    <div className="w-6" />
  </header>
);

const MethodBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; title: string; sub: string }> = ({
  active, onClick, icon, title, sub,
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border text-left ${
      active ? 'border-[#ff8a1e] bg-[#ff8a1e]/10' : 'border-white/10 bg-[#151e2b]'
    }`}
  >
    <span className={active ? 'text-[#ff8a1e]' : 'text-slate-400'}>{icon}</span>
    <div>
      <div className="text-xs font-bold text-white">{title}</div>
      <div className="text-[10px] text-slate-500">{sub}</div>
    </div>
  </button>
);

const Row: React.FC<{ label: string; value: string; onCopy?: () => void; accent?: boolean }> = ({
  label, value, onCopy, accent,
}) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-xs text-slate-400">{label}</span>
    <span className={`text-xs font-bold flex items-center gap-1.5 ${accent ? 'text-emerald-400' : 'text-white'}`}>
      {value}
      {onCopy && (
        <button onClick={onCopy} className="text-slate-400 hover:text-white">
          {copiedIcon(label)}
        </button>
      )}
    </span>
  </div>
);

const copiedIcon = (_: string) => <Copy className="w-3 h-3" />;