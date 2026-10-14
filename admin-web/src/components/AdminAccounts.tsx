import React, { useCallback, useEffect, useState } from 'react';
import {
  ShieldCheck,
  Users,
  Plus,
  Trash2,
  KeyRound,
  Ban,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { adminGet, adminPost } from '../api';
import { dateTime } from '../utils/format';

export interface AdminAccount {
  id: string;
  username: string;
  superAdmin: boolean;
  enabled: boolean;
  createdAt: string;
  expiresAt: string | null;
  lastLoginAt: string | null;
  expired: boolean;
}

export interface Me {
  username: string;
  superAdmin: boolean;
}

const Pill: React.FC<{ tone: string; children: React.ReactNode }> = ({ tone, children }) => (
  <span className={`text-[10px] px-2 py-1 rounded-full font-bold pill ${tone}`}>{children}</span>
);

const expiryLabel = (iso: string | null) => {
  if (!iso) return 'Never expires';
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (days <= 0) return 'Expired';
  if (days === 1) return '1 day left';
  return `${days} days left`;
};

export const AdminAccounts: React.FC = () => {
  const [list, setList] = useState<AdminAccount[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [days, setDays] = useState('30');
  const [superAdmin, setSuperAdmin] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, m] = await Promise.all([
        adminGet('/admin/admins'),
        adminGet('/admin/me'),
      ]);
      setList(a.data || []);
      setMe(m.data);
    } catch (err: any) {
      setError(err?.message || 'Could not load admins');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (msg: string) => {
    setOk(msg);
    setError('');
    setTimeout(() => setOk(''), 2500);
  };

  const create = async () => {
    if (busy) return;
    setError('');
    if (!username.trim() || password.length < 6) {
      setError('Username dein aur password kam se kam 6 characters ka rakhein');
      return;
    }
    setBusy(true);
    try {
      await adminPost('/admin/admins', {
        username: username.trim(),
        password,
        days: Number(days) || 0,
        superAdmin,
      });
      setUsername('');
      setPassword('');
      setSuperAdmin(false);
      await load();
      flash('Admin ban gaya');
    } catch (err: any) {
      setError(err?.message || 'Could not create admin');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (a: AdminAccount) => {
    setBusy(true);
    setError('');
    try {
      await adminPost('/admin/admins/update', { id: a.id, enabled: !a.enabled });
      await load();
      flash(a.enabled ? 'Admin disabled' : 'Admin enabled');
    } catch (err: any) {
      setError(err?.message || 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const extend = async (a: AdminAccount) => {
    setBusy(true);
    setError('');
    try {
      await adminPost('/admin/admins/update', { id: a.id, days: 30 });
      await load();
      flash('Expiry 30 din badha diya');
    } catch (err: any) {
      setError(err?.message || 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (a: AdminAccount) => {
    if (!window.confirm(`${a.username} ko delete karein?`)) return;
    setBusy(true);
    setError('');
    try {
      await adminPost('/admin/admins/delete', { id: a.id });
      await load();
      flash('Admin delete ho gaya');
    } catch (err: any) {
      setError(err?.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#ff8a1e]" />
          Admin Accounts
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Har admin ka apna username aur password. Kisi ko bhi access de sakte ho, aur expiry set kar
          sakte ho.
          {me && (
            <>
              {' '}
              Aap logged in ho as <b className="text-white">{me.username}</b>
              {me.superAdmin ? ' (Super Admin)' : ''}
            </>
          )}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {ok && (
        <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3.5 py-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {ok}
        </div>
      )}

      {/* Create */}
      {me?.superAdmin && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#ff8a1e]" /> Naya Admin Banayein
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            <div className="flex items-center gap-2 bg-[#0b1017] border border-slate-700 rounded-lg px-3">
              <Users className="w-4 h-4 text-slate-500" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username (e.g. raju)"
                className="flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-600"
              />
            </div>
            <div className="flex items-center gap-2 bg-[#0b1017] border border-slate-700 rounded-lg px-3">
              <KeyRound className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 chars)"
                className="flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-3">
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              Valid for
              <input
                type="number"
                min={0}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-16 bg-[#0b1017] border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
              />
              days
            </label>
            <span className="text-[11px] text-slate-500">0 = never expires</span>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={superAdmin}
                onChange={(e) => setSuperAdmin(e.target.checked)}
                className="accent-[#ff8a1e]"
              />
              Super Admin (admins manage kar sake)
            </label>
          </div>

          <button onClick={create} disabled={busy} className="btn-primary w-full py-2.5 text-sm disabled:opacity-60">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Admin
          </button>
        </div>
      )}

      {/* List */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-premium">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-xs">
                  <th className="px-4 py-3 font-semibold">Admin</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Expiry</th>
                  <th className="px-4 py-3 font-semibold">Last Login</th>
                  {me?.superAdmin && <th className="px-4 py-3 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff9429] to-[#ff5500] flex items-center justify-center text-[11px] font-black text-white shrink-0">
                          {a.username.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <div className="font-semibold text-white">{a.username}</div>
                          <div className="text-[10px] text-slate-500">Created {dateTime(a.createdAt)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {a.superAdmin ? (
                        <Pill tone="pill-orange">Super Admin</Pill>
                      ) : (
                        <Pill tone="bg-slate-500/20 text-slate-300">Admin</Pill>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {a.expired ? (
                        <Pill tone="pill-red">Expired</Pill>
                      ) : a.enabled ? (
                        <Pill tone="pill-green">Active</Pill>
                      ) : (
                        <Pill tone="bg-slate-500/20 text-slate-300">Disabled</Pill>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {expiryLabel(a.expiresAt)}
                      {a.expiresAt && (
                        <div className="text-[10px] text-slate-500">{dateTime(a.expiresAt)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {a.lastLoginAt ? dateTime(a.lastLoginAt) : 'Never'}
                    </td>
                    {me?.superAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => extend(a)}
                            disabled={busy}
                            title="Expiry 30 din badhao"
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer disabled:opacity-50"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggle(a)}
                            disabled={busy || a.superAdmin}
                            title={a.enabled ? 'Disable' : 'Enable'}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer disabled:opacity-30"
                          >
                            {a.enabled ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => remove(a)}
                            disabled={busy || a.superAdmin}
                            title="Delete"
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 cursor-pointer disabled:opacity-30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};