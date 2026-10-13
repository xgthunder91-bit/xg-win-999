import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Check, X, ShieldCheck, Loader2 } from 'lucide-react';
import { apiGet, apiPost } from '../utils/api';

interface DepositRecord {
  orderId: string;
  userId: string;
  amount: number;
  method: string;
  status: 'pending' | 'pending_verification' | 'approved' | 'rejected';
  utr: string | null;
  txnId: string | null;
  note: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-300',
  pending_verification: 'bg-orange-500/20 text-orange-300',
  approved: 'bg-green-500/20 text-green-300',
  rejected: 'bg-red-500/20 text-red-300',
};

export const AdminPanel: React.FC = () => {
  const [adminKey, setAdminKey] = useState<string>(
    () => localStorage.getItem('xgwin99_admin_key') || ''
  );
  const [keyInput, setKeyInput] = useState('');
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadDeposits = useCallback(
    async (key: string) => {
      if (!key) return;
      setLoading(true);
      setError('');
      try {
        const res = await apiGet(`/admin/deposits?key=${encodeURIComponent(key)}`);
        if (res.success) {
          setDeposits(res.data || []);
        } else {
          setError(res.message || 'Failed to load deposits');
        }
      } catch (err) {
        console.error(err);
        setError('Network error. Is the backend running?');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (adminKey) loadDeposits(adminKey);
  }, [adminKey, loadDeposits]);

  const saveKey = () => {
    const k = keyInput.trim();
    if (!k) return;
    localStorage.setItem('xgwin99_admin_key', k);
    setAdminKey(k);
    setKeyInput('');
  };

  const changeKey = () => {
    localStorage.removeItem('xgwin99_admin_key');
    setAdminKey('');
    setDeposits([]);
    setError('');
    setKeyInput('');
  };

  const approve = async (orderId: string) => {
    setBusyId(orderId);
    try {
      const res = await apiPost('/admin/deposit/approve', { orderId, adminKey });
      if (!res.success) alert(res.message || 'Approve failed');
      await loadDeposits(adminKey);
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (orderId: string) => {
    const reason = window.prompt('Rejection reason (optional):') || 'Invalid UTR / payment not received';
    setBusyId(orderId);
    try {
      const res = await apiPost('/admin/deposit/reject', { orderId, reason, adminKey });
      if (!res.success) alert(res.message || 'Reject failed');
      await loadDeposits(adminKey);
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1017] text-white px-3 py-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#ff8a1e]" />
            <h1 className="text-lg font-black">XG Win 99 — Admin Deposits</h1>
          </div>
          <button
            onClick={() => loadDeposits(adminKey)}
            className="flex items-center gap-1.5 text-xs font-bold bg-[#1c2635] border border-white/10 rounded-lg px-3 py-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {adminKey && (
          <div className="flex items-center justify-between bg-[#151e2b] border border-white/10 rounded-xl px-3 py-2 mb-3">
            <span className="text-[11px] text-slate-400">
              Signed in as admin <span className="font-mono text-slate-500">({adminKey})</span>
            </span>
            <button
              onClick={changeKey}
              className="text-[11px] font-bold text-[#ff8a1e] cursor-pointer hover:underline"
            >
              Change key
            </button>
          </div>
        )}

        {!adminKey ? (
          <div className="bg-[#151e2b] border border-white/10 rounded-xl p-4">
            <p className="text-sm text-slate-300 mb-3">Enter the admin key to view deposit requests.</p>
            <div className="flex gap-2">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Admin key"
                className="flex-1 bg-[#0b1017] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#ff8a1e]"
              />
              <button
                onClick={saveKey}
                className="bg-gradient-to-r from-[#ff9429] to-[#ff5500] rounded-lg px-4 py-2 text-sm font-bold cursor-pointer"
              >
                Unlock
              </button>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-500/15 border border-red-500/30 text-red-300 text-xs rounded-lg px-3 py-2 mb-3">
                {error}
              </div>
            )}

            <div className="space-y-2">
              {deposits.length === 0 && !loading && (
                <div className="text-center text-slate-500 text-sm py-10">No deposit requests yet.</div>
              )}
              {deposits.map((d) => (
                <div key={d.orderId} className="bg-[#151e2b] border border-white/10 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-[#ff8a1e] text-lg">₹{d.amount}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{d.orderId}</div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        STATUS_STYLES[d.status] || 'bg-slate-500/20 text-slate-300'
                      }`}
                    >
                      {d.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2 text-slate-300">
                    <div>
                      <span className="text-slate-500">User: </span>
                      {d.userId}
                    </div>
                    <div>
                      <span className="text-slate-500">Method: </span>
                      {d.method}
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500">UTR: </span>
                      <span className="font-mono">{d.utr || '—'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500">TXN: </span>
                      <span className="font-mono">{d.txnId || '—'}</span>
                    </div>
                    <div className="col-span-2 text-slate-500">
                      {new Date(d.createdAt).toLocaleString()}
                    </div>
                    {d.rejectionReason && (
                      <div className="col-span-2 text-red-300">Reason: {d.rejectionReason}</div>
                    )}
                  </div>

                  {(d.status === 'pending_verification' || d.status === 'pending') && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => approve(d.orderId)}
                        disabled={busyId === d.orderId}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-green-600/90 hover:bg-green-600 rounded-lg py-2 text-xs font-bold cursor-pointer disabled:opacity-60"
                      >
                        {busyId === d.orderId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Approve & Credit
                      </button>
                      <button
                        onClick={() => reject(d.orderId)}
                        disabled={busyId === d.orderId}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-red-600/80 hover:bg-red-600 rounded-lg py-2 text-xs font-bold cursor-pointer disabled:opacity-60"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
