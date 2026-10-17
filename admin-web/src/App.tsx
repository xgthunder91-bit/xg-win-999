import { useCallback, useEffect, useRef, useState } from 'react';
import { Login } from './components/Login';
import { Layout, type PageKey } from './components/Layout';
import { Overview } from './components/Overview';
import { GameInfo } from './components/GameInfo';
import { LiveBetsFeed } from './components/LiveBetsFeed';
import { AdminAccounts } from './components/AdminAccounts';
import { Users, type UserFilter } from './components/Users';
import { Deposits } from './components/Deposits';
import { Withdrawals } from './components/Withdrawals';
import { ThemeSettings } from './components/ThemeSettings';
import { UserDrawer } from './components/UserDrawer';
import { adminGet, restoreAdminToken, clearAdminToken, adminLogout } from './api';
import type { Overview as OverviewType, User, Deposit, Withdrawal } from './types';

const REFRESH_MS = 10000;

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [booting, setBooting] = useState(true);
  const [page, setPage] = useState<PageKey>('overview');

  const [overview, setOverview] = useState<OverviewType | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<UserFilter>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [apiOk, setApiOk] = useState(true);

  const searchRef = useRef(search);
  const filterRef = useRef(filter);
  searchRef.current = search;
  filterRef.current = filter;

  // Try to restore session on boot
  useEffect(() => {
    const saved = restoreAdminToken();
    if (!saved) {
      setBooting(false);
      return;
    }
    adminGet('/admin/overview')
      .then(() => setAuthed(true))
      .catch(() => clearAdminToken())
      .finally(() => setBooting(false));
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, us, dep, wd] = await Promise.all([
        adminGet('/admin/overview'),
        adminGet('/admin/users', { search: searchRef.current, filter: filterRef.current }),
        adminGet('/admin/deposits'),
        adminGet('/admin/withdrawals'),
      ]);
      setOverview(ov.data);
      setUsers(us.data || []);
      setDeposits(dep.data || []);
      setWithdrawals(wd.data || []);
      setApiOk(true);
    } catch (err: any) {
      if (err?.status === 401) {
        clearAdminToken();
        setAuthed(false);
      }
      setApiOk(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when authed, and on search/filter change (users only, debounced)
  useEffect(() => {
    if (!authed) return;
    fetchAll();
    const timer = setInterval(fetchAll, REFRESH_MS);
    return () => clearInterval(timer);
  }, [authed, fetchAll]);

  // When search/filter changes, refetch just the users list quickly
  useEffect(() => {
    if (!authed) return;
    const t = setTimeout(() => {
      adminGet('/admin/users', { search, filter })
        .then((res) => setUsers(res.data || []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [search, filter, authed]);

  const logout = () => {
    void adminLogout();
    clearAdminToken();
    setAuthed(false);
  };

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1017] text-slate-500 text-sm">
        Loading…
      </div>
    );
  }

  if (!authed) {
    return <Login onAuthed={() => setAuthed(true)} />;
  }

  return (
    <>
      <Layout
        page={page}
        onNavigate={setPage}
        onRefresh={fetchAll}
        onLogout={logout}
        loading={loading}
        apiOk={apiOk}
        pendingDeposits={overview?.pendingDeposits || 0}
        pendingWithdrawals={overview?.pendingWithdrawals || 0}
      >
        {page === 'overview' && (
          <Overview
            data={overview}
            onNavigate={setPage}
            onNavigateUsers={(f) => {
              setFilter(f);
              setSearch('');
              setPage('users');
            }}
          />
        )}
        {page === 'admins' && <AdminAccounts />}
        {page === 'theme' && <ThemeSettings />}
        {page === 'livebets' && <LiveBetsFeed limit={200} />}
        {page === 'gameinfo' && <GameInfo />}
        {page === 'users' && (
          <Users
            users={users}
            search={search}
            onSearch={setSearch}
            filter={filter}
            onFilter={setFilter}
            onSelect={(u) => setSelectedUserId(u.id)}
            loading={loading}
          />
        )}
        {page === 'deposits' && <Deposits deposits={deposits} loading={loading} onChanged={fetchAll} />}
        {page === 'withdrawals' && (
          <Withdrawals withdrawals={withdrawals} loading={loading} onChanged={fetchAll} />
        )}
      </Layout>

      {selectedUserId && (
        <UserDrawer userId={selectedUserId} onClose={() => setSelectedUserId(null)} onChanged={fetchAll} />
      )}
    </>
  );
}
