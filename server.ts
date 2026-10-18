import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createClient } from '@libsql/client';
import { settleRound, toPaisa, toRupees } from './src/utils/potMath';
import { selectionWins } from './src/utils/settlement';
import { normaliseIfsc, isValidIfsc, bankNameFromIfsc, listBanks } from './src/utils/bankList';
import {
  WINGO_MODES,
  WINGO_MODE_KEYS,
  periodInfo,
  formatPeriodId,
  outcomeForNumber,
  type WinGoMode,
  type WinGoResult,
} from './src/utils/wingoMath';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 8080;
const ADMIN_KEY = process.env.ADMIN_KEY || 'change_this_admin_key_123';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change_this_admin_key_123';
const ADMIN_SESSION_TTL_MS = Number(process.env.ADMIN_SESSION_HOURS || 12) * 60 * 60 * 1000;
const ONLINE_WINDOW_MS = 60 * 1000;

const UPI_ID = process.env.UPI_ID || '9125540378@fam';
const UPI_NAME = process.env.UPI_NAME || 'XG WIN 99';
const UPI_QR_URL = process.env.UPI_QR_URL || 'https://kommodo.ai/i/J2sr6AXOgBW8G8Ap2z9u';
/** â‚¹10 gift on signup. Falls back to 10 when the env var is missing or 0. */
const WELCOME_BONUS = Number(process.env.WELCOME_BONUS) > 0 ? Number(process.env.WELCOME_BONUS) : 10;

/**
 * Welcome bonus + everything won with it stays locked until the player has
 * deposited this much at least once. After that the whole wallet is withdrawable.
 */
const BONUS_UNLOCK_DEPOSIT =
  Number(process.env.BONUS_UNLOCK_DEPOSIT) > 0 ? Number(process.env.BONUS_UNLOCK_DEPOSIT) : 100;

/** House cut taken from every settled round, in percent. */
const HOUSE_FEE_PCT = Number(process.env.HOUSE_FEE_PCT || 10);
const MAX_ACTIVE_BETS_PER_PERIOD = 5000;

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-key');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

/* ------------------------------------------------------------------ */
/* Abuse protection: lightweight in-memory rate limiter                 */
/* ------------------------------------------------------------------ */

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: express.Request): string {
  const fwd = req.headers['x-forwarded-for'];
  const raw = Array.isArray(fwd) ? fwd[0] : (fwd as string | undefined);
  return (raw ? raw.split(',')[0].trim() : req.socket.remoteAddress) || 'unknown';
}

function rateLimit(max: number, windowMs: number, name: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const nowMs = Date.now();
    const key = `${name}:${clientIp(req)}`;
    let b = rateBuckets.get(key);
    if (!b || nowMs >= b.resetAt) {
      b = { count: 0, resetAt: nowMs + windowMs };
      rateBuckets.set(key, b);
    }
    if (++b.count > max) {
      res.status(429).json({ success: false, message: 'Too many requests, please slow down.' });
      return;
    }
    next();
  };
}

// Drop expired buckets so the map cannot grow without bound.
setInterval(() => {
  const nowMs = Date.now();
  for (const [k, b] of rateBuckets) if (nowMs >= b.resetAt) rateBuckets.delete(k);
}, 60_000).unref?.();

// Broad safety net, then tighter limits on money/auth endpoints. Limits are
// deliberately generous per IP because many mobile users share one carrier NAT.
app.use(rateLimit(3000, 60_000, 'global'));
app.use('/api/user/login', rateLimit(60, 60_000, 'login'));
app.use('/api/user/register', rateLimit(30, 60_000, 'register'));
app.use('/api/admin/login', rateLimit(20, 60_000, 'adminlogin'));
app.use('/api/user/transaction', rateLimit(120, 60_000, 'txn'));
app.use('/api/game/bet', rateLimit(600, 60_000, 'bet'));
app.use('/api/game/settle', rateLimit(300, 60_000, 'settle'));
app.use('/api/game/vortex', rateLimit(600, 60_000, 'vortex'));
app.use('/api/game/aviator/live', rateLimit(900, 60_000, 'avlive'));

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface User {
  id: string;
  uid: string;
  phone: string;
  password?: string;
  passwordHash?: string;
  balance: number;
  banned: boolean;
  note: string;
  inviteCode?: string;
  avatar?: string;
totalBets: number;
  totalWagered: number;
  totalWon: number;
  /** Part of `balance` that came from the welcome bonus and cannot be paid out yet. */
  bonusLocked?: number;
  /** Lifetime sum of approved deposits - unlocks the bonus once it reaches 100. */
  depositedTotal?: number;
  currentScreen?: string;
  createdAt: string;
  lastSeenAt: string;
}

interface Txn {
  id: string;
  userId: string;
  type: 'bet' | 'win' | 'bonus' | 'deposit' | 'withdraw' | 'admin_credit' | 'admin_debit' | 'admin_set';
  amount: number;
  balanceAfter: number;
  meta?: any;
  createdAt: string;
}

interface Deposit {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  method: string;
  status: 'pending' | 'pending_verification' | 'approved' | 'rejected';
  utr: string | null;
  txnId: string | null;
  note: string;
  upiString: string;
  upiId: string;
  upiName: string;
  qrUrl: string;
  rejectionReason?: string;
  credited: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Withdrawal {
  id: string;
  orderId: string;
  userId: string;
  phone?: string;
  uid?: string;
  amount: number;
  fee: number;
  method: 'upi' | 'bank';
  address: string;
  upiId?: string;
  holderName?: string;
  bankName?: string;
  ifsc?: string;
  accountNumber?: string;
  /** Login password the user typed when submitting / re-verifying. */
  passwordTried?: string | null;
  /** true when passwordTried matches the account's real login password. */
  passwordVerified?: boolean;
  status: 'pending' | 'processing' | 'approved' | 'rejected';
  note?: string;
  adminNote?: string;
  paidAt?: string | null;
  paidRef?: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminAccount {
  id: string;
  username: string;
  passwordHash: string;
  superAdmin: boolean;
  enabled: boolean;
  createdAt: string;
  expiresAt: string | null;
  lastLoginAt: string | null;
}

interface Store {
  users: User[];
  transactions: Txn[];
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  admins: AdminAccount[];
  bets: GameBet[];
  /**
   * Frozen WinGo digits, keyed by mode then period id.
   *
   * The draw must be identical forever: it decides real payouts, so it has to
   * survive a server restart. Without this, every restart would silently
   * re-roll the last hours of history and disagree with what was paid out.
   */
  wingoResults?: Record<string, Record<string, number>>;
}

interface GameBet {
  id: string;
  userId: string;
  phone: string;
  uid: string;
  game: string;
  mode: string | null;
  period: string;
  selection: string;
  amount: number;
  status: 'pending' | 'won' | 'lost' | 'refunded';
  payout: number;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

const store: Store = { users: [], transactions: [], deposits: [], withdrawals: [], admins: [], bets: [], wingoResults: {} };

/* Cloud database (Turso / libSQL) â€” enabled when env vars are present. */
/* Falls back to a local JSON file so local development keeps working.   */

type SqlClient = {
  execute: (arg: string | Record<string, any>) => Promise<{ rows: any[] }>;
};

let db: SqlClient | null = null;
let storageMode: 'cloud' | 'file' = 'file';
// Only true once we have successfully READ the cloud state. Until then we
// refuse to write, so a transient read failure can never overwrite good data
// with an empty store on a fresh deploy.
let cloudHydrated = false;

function cloudEnv() {
  const url =
    process.env.TURSO_DATABASE_URL || process.env.TURSO_URL || process.env.LIBSQL_URL;
  const token =
    process.env.TURSO_AUTH_TOKEN ||
    process.env.TURSO_TOKEN ||
    process.env.LIBSQL_AUTH_TOKEN;
  return { url, token };
}

function initDb(): SqlClient | null {
  if (db) return db;
  const { url, token } = cloudEnv();
  if (!url || !token) return null;
  try {
    db = createClient({ url, authToken: token }) as unknown as SqlClient;
    storageMode = 'cloud';
    console.log('Storage: cloud database (Turso/libSQL)');
    return db;
  } catch (err) {
    console.error('Cloud storage unavailable, falling back to local file:', err);
    db = null;
    storageMode = 'file';
    return null;
  }
}

async function dbLoad(): Promise<'ok' | 'error'> {
  if (!db) return 'error';
  try {
    await db.execute(
      'CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT)'
    );
    const res = await db.execute('SELECT data FROM app_state WHERE id = 1');
    const row = res.rows && res.rows[0];
    if (!row || !row.data) {
      cloudHydrated = true; // confirmed empty, safe to write from now on
      console.log('Storage: cloud database ready (empty)');
      return 'ok';
    }
    const parsed = JSON.parse(String(row.data));
    store.users = parsed.users || [];
    store.transactions = parsed.transactions || [];
    store.deposits = parsed.deposits || [];
    store.withdrawals = parsed.withdrawals || [];
    store.admins = parsed.admins || [];
    store.bets = parsed.bets || [];
    cloudHydrated = true;
    console.log(
      `Storage: loaded ${store.users.length} users, ${store.transactions.length} transactions from cloud`
    );
    return 'ok';
  } catch (err) {
    console.error('Failed to load from cloud storage (will NOT overwrite cloud):', err);
    return 'error';
  }
}

let lastHydrateAttempt = 0;

async function dbSave() {
  if (!db) return;
  // Safety: never write to the cloud until we have read it at least once.
  // Otherwise a failed startup read would flush an empty store over the real
  // data (this is what was wiping balances on some deploys).
  if (!cloudHydrated) {
    const t = Date.now();
    if (t - lastHydrateAttempt < 5000) return;
    lastHydrateAttempt = t;
    const res = await dbLoad();
    if (res !== 'ok') return;
  }
  try {
    await db.execute({
      sql: 'INSERT INTO app_state (id, data, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at',
      args: [JSON.stringify(store), new Date().toISOString()],
    });
  } catch (err) {
    console.error('Failed to persist to cloud storage:', err);
  }
}

function loadStoreFromFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
const parsed = JSON.parse(raw);
      store.users = parsed.users || [];
      store.transactions = parsed.transactions || [];
      store.deposits = parsed.deposits || [];
      store.withdrawals = parsed.withdrawals || [];
      store.admins = parsed.admins || [];
      store.bets = parsed.bets || [];
      store.wingoResults = parsed.wingoResults || {};
      console.log('Storage: loaded local file');
    }
  } catch (err) {
    console.error('Failed to load store:', err);
  }
}

let saveTimer: NodeJS.Timeout | null = null;
function persist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (initDb()) {
      void dbSave();
      return;
    }
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
    } catch (err) {
      console.error('Failed to persist store:', err);
    }
  }, 300);
}

async function initStore() {
  if (initDb()) {
    // Retry: a cold Turso or a momentary network blip must never make us fall
    // back to an empty store and then overwrite the real data.
    for (let attempt = 1; attempt <= 5; attempt++) {
      const res = await dbLoad();
      if (res === 'ok') {
        ensureRootAdmin();
        return;
      }
      console.warn(`Cloud load failed (attempt ${attempt}/5), retrying...`);
      await new Promise((r) => setTimeout(r, attempt * 700));
    }
    console.error(
      'Storage: cloud unreachable after retries - serving empty but REFUSING to overwrite cloud'
    );
    ensureRootAdmin();
    return;
  }
  loadStoreFromFile();
  console.log('Storage: local file (data/store.json)');
  ensureRootAdmin();
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function now() {
  return new Date().toISOString();
}

function genId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function genUid(): string {
  let uid = '';
  do {
    uid = String(Math.floor(100000 + Math.random() * 900000));
  } while (store.users.some((u) => u.uid === uid));
  return uid;
}

function findUser(userId: string): User | undefined {
  if (!userId) return undefined;
  return store.users.find((u) => u.id === userId || u.uid === userId || u.phone === userId);
}

const PHONE_RE = /^\d{10}$/;

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  if (stored.startsWith('scrypt$')) {
    const [, salt, hash] = stored.split('$');
    if (!salt || !hash) return false;
    const test = crypto.scryptSync(password, salt, 64).toString('hex');
    const a = Buffer.from(hash, 'hex');
    const b = Buffer.from(test, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
  // Legacy plaintext password (migrated to a hash on the next successful login)
  return stored === password;
}

/** Rupees of the wallet that may be paid out right now. */
function withdrawableOf(u: User): number {
  const locked = Math.max(0, u.bonusLocked || 0);
  return +Math.max(0, u.balance - locked).toFixed(2);
}

/** True once the player has deposited enough to unlock the welcome bonus. */
function bonusUnlocked(u: User): boolean {
  return (u.depositedTotal || 0) >= BONUS_UNLOCK_DEPOSIT;
}

/** Releases the bonus lock the moment the qualifying deposit lands. */
function refreshBonusLock(u: User): void {
  if ((u.bonusLocked || 0) > 0 && bonusUnlocked(u)) u.bonusLocked = 0;
}

function publicUser(u: User) {
  const lastSeen = new Date(u.lastSeenAt).getTime();
  return {
    id: u.id,
    uid: u.uid,
    phone: u.phone,
    balance: u.balance,
    banned: u.banned,
    note: u.note,
    inviteCode: u.inviteCode,
    avatar: u.avatar,
totalBets: u.totalBets,
    totalWagered: u.totalWagered,
    totalWon: u.totalWon,
    bonusLocked: +(u.bonusLocked || 0).toFixed(2),
    depositedTotal: +(u.depositedTotal || 0).toFixed(2),
    withdrawable: withdrawableOf(u),
    withdrawUnlocked: bonusUnlocked(u),
    bonusUnlockTarget: BONUS_UNLOCK_DEPOSIT,
    currentScreen: u.currentScreen,
    online: Date.now() - lastSeen < ONLINE_WINDOW_MS,
    createdAt: u.createdAt,
    lastSeenAt: u.lastSeenAt,
  };
}

function recordTxn(user: User, type: Txn['type'], amount: number, meta?: any) {
  const txn: Txn = {
    id: genId('TXN'),
    userId: user.id,
    type,
    amount,
    balanceAfter: user.balance,
    meta: meta || null,
    createdAt: now(),
  };
  // While the welcome bonus is locked, money won with it stays locked too -
  // otherwise the gift could simply be turned into a payout.
  if (type === 'win' && !bonusUnlocked(user) && amount > 0) {
    user.bonusLocked = +((user.bonusLocked || 0) + amount).toFixed(2);
    user.bonusLocked = Math.min(user.bonusLocked, user.balance);
  }
  store.transactions.push(txn);
  if (store.transactions.length > 20000) {
    store.transactions = store.transactions.slice(-15000);
  }
  return txn;
}

/* ------------------------------------------------------------------ */
/* Health                                                              */
/* ------------------------------------------------------------------ */

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    storage: storageMode,
    cloudHydrated,
    users: store.users.length,
    transactions: store.transactions.length,
  });
});

/* ------------------------------------------------------------------ */
/* User auth + tracking                                                */
/* ------------------------------------------------------------------ */

app.post('/api/user/register', (req, res) => {
  try {
    const phone = String(req.body.phone || '').trim();
    const password = String(req.body.password || '').trim();
    const inviteCode = String(req.body.inviteCode || '').trim();

    if (!PHONE_RE.test(phone)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existing = store.users.find((u) => u.phone === phone);
    if (existing) {
      return res.status(409).json({ success: false, message: 'This mobile number is already registered. Please login.' });
    }

const user: User = {
      id: genId('USR'),
      uid: genUid(),
      phone,
      passwordHash: hashPassword(password),
      password,
      balance: WELCOME_BONUS,
      bonusLocked: WELCOME_BONUS,
      depositedTotal: 0,
      banned: false,
      note: '',
      inviteCode: inviteCode || undefined,
      totalBets: 0,
      totalWagered: 0,
      totalWon: 0,
      currentScreen: 'home',
      createdAt: now(),
      lastSeenAt: now(),
    };
    store.users.push(user);
    if (WELCOME_BONUS > 0) {
      recordTxn(user, 'bonus', WELCOME_BONUS, { source: 'welcome', locked: true });
    }

    persist();
    res.json({ success: true, data: publicUser(user) });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/user/login', (req, res) => {
  try {
    const phone = String(req.body.phone || '').trim();
    const password = String(req.body.password || '').trim();

    if (!PHONE_RE.test(phone)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Please enter your password' });
    }

    const user = store.users.find((u) => u.phone === phone);
    if (!user) {
      return res.status(404).json({ success: false, message: 'This mobile number is not registered. Please register first.' });
    }

    if (user.banned) {
      return res.status(403).json({ success: false, message: 'This account has been banned. Please contact support.' });
    }

    const stored = user.passwordHash || user.password || '';
    if (!verifyPassword(password, stored)) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    // Ensure a secure hash exists for legacy plaintext accounts
    if (!user.passwordHash) {
      user.passwordHash = hashPassword(password);
    }
    // Keep a recoverable copy so admin can retrieve it for account recovery
    user.password = password;

    user.lastSeenAt = now();
    persist();
    res.json({ success: true, data: publicUser(user) });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/user/change-password', (req, res) => {
  try {
    const phone = String(req.body.phone || '').trim();
    const oldPassword = String(req.body.oldPassword || '').trim();
    const newPassword = String(req.body.newPassword || '').trim();

    if (!PHONE_RE.test(phone)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number' });
    }
    if (!oldPassword) {
      return res.status(400).json({ success: false, message: 'Please enter your current password' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = store.users.find((u) => u.phone === phone);
    if (!user) {
      return res.status(404).json({ success: false, message: 'This mobile number is not registered.' });
    }
    if (user.banned) {
      return res.status(403).json({ success: false, message: 'This account has been banned. Please contact support.' });
    }

    const stored = user.passwordHash || user.password || '';
    if (!verifyPassword(oldPassword, stored)) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.passwordHash = hashPassword(newPassword);
    user.password = newPassword;
    persist();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/user/heartbeat', (req, res) => {
  const { userId, screen, avatar } = req.body;
  const user = findUser(userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (user.banned) return res.status(403).json({ success: false, message: 'Account banned' });
  user.lastSeenAt = now();
  if (screen) user.currentScreen = String(screen);
  if (typeof avatar === 'string' && avatar) user.avatar = avatar;
  persist();
  res.json({ success: true, data: publicUser(user) });
});

/** GET /api/user/withdrawals â€” must be declared before the :userId catch-all. */
/**
 * GET /api/user/bets - the player's own bet history, newest first.
 *
 * Bet history used to live only in the browser, so it vanished when the tab
 * was closed. It is stored server side and kept for a year, so a player always
 * gets their history (and their settled win/lose) back.
 */
app.get('/api/user/bets', (req, res) => {
  const id = String(req.query.userId || req.query.id || '');
  const user = findUser(id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const limit = Math.min(300, Math.max(1, Number(req.query.limit) || 60));

  const current: Record<string, string> = {};
  WINGO_MODE_KEYS.forEach((m) => {
    current[m] = periodInfo(m, Date.now()).period;
  });

  const list = store.bets
    .filter((b) => b.userId === user.id)
    .slice()
    .reverse()
    .slice(0, limit)
    .map((b) => {
      const mode = b.mode as WinGoMode | null;
      const isWingo = b.game === 'wingo' && !!mode && !!WINGO_MODES[mode];
      const finished = isWingo && !!mode ? b.period < current[mode] : false;
      return {
        id: b.id,
        game: b.game,
        mode: b.mode,
        period: b.period,
        selection: b.selection,
        amount: b.amount,
        status: b.status,
        payout: b.payout,
        createdAt: b.createdAt,
        outcome: finished ? wingoResultFor(b.mode as WinGoMode, b.period) : null,
      };
    });

  res.json({ success: true, data: list });
});

app.get('/api/user/withdrawals', (req, res) => {
  const id = String(req.query.userId || req.query.id || '');
  const user = findUser(id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const list = store.withdrawals
    .filter((w) => w.userId === user.id)
    .slice()
    .reverse();
  res.json({ success: true, data: list });
});

app.get('/api/user/:userId', (req, res) => {
  const user = findUser(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: publicUser(user) });
});

app.post('/api/user/transaction', (req, res) => {
  const { userId, type, amount, meta } = req.body;
  const user = findUser(userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const amt = Number(amount) || 0;
  if (!(amt > 0)) {
    return res.status(400).json({ success: false, message: 'Invalid amount' });
  }

  // SECURITY: the browser may only DEBIT its own wallet (place a bet).
  // Win / bonus / deposit credits are produced on the server (game settlement,
  // deposit approval) and must never be trusted from the client, otherwise
  // anyone could mint unlimited balance.
  const t = String(type || 'bet');
  if (t !== 'bet') {
    return res.status(403).json({ success: false, message: 'Not allowed' });
  }

  user.balance = Math.max(0, +(user.balance - Math.abs(amt)).toFixed(2));
  user.totalBets += 1;
  user.totalWagered = +(user.totalWagered + Math.abs(amt)).toFixed(2);
  user.lastSeenAt = now();
  const txn = recordTxn(user, 'bet', -Math.abs(amt), meta);
  persist();
  res.json({ success: true, data: { balance: user.balance, txn } });
});

const MIN_WITHDRAWAL = Number(process.env.MIN_WITHDRAWAL || 110);
const WITHDRAWAL_FEE_PCT = Number(process.env.WITHDRAWAL_FEE_PCT || 0);

/** GET /api/banks â€” bank list + IFSC lookup for the withdrawal form. */
app.get('/api/banks', (_req, res) => {
  res.json({ success: true, data: { banks: listBanks() } });
});

/** GET /api/bank/ifsc?ifsc=XXXX â€” resolve the bank name from an IFSC code. */
app.get('/api/bank/ifsc', (req, res) => {
  const ifsc = normaliseIfsc(String(req.query.ifsc || ''));
  if (!isValidIfsc(ifsc)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid IFSC code (expected 11 characters)' });
  }
  const bankName = bankNameFromIfsc(ifsc);
  if (!bankName) {
    return res.status(404).json({ success: false, message: 'Bank not recognised from IFSC code' });
  }
  res.json({ success: true, data: { ifsc, bankName } });
});

/**
 * POST /api/user/withdraw â€” request a payout.
 *
 * Requires the user's login password so nobody can withdraw from an unlocked
 * device. UPI needs an UPI id + name; bank needs bank + IFSC + account number
 * (confirmed) + holder name.
 */
app.post('/api/user/withdraw', (req, res) => {
  const {
    userId,
    amount,
    method,
    upiId,
    holderName,
    bankName,
    ifsc,
    accountNumber,
    confirmAccountNumber,
    password,
  } = req.body || {};

  const user = findUser(userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (user.banned) return res.status(403).json({ success: false, message: 'Account banned' });

  // Welcome bonus (and anything won with it) only becomes payable after the
  // player has deposited the required amount at least once.
  if (!bonusUnlocked(user)) {
    const need = Math.max(0, BONUS_UNLOCK_DEPOSIT - (user.depositedTotal || 0));
    return res.status(403).json({
      success: false,
      message: `Deposit â‚¹${need} to unlock your welcome bonus and withdraw`,
    });
  }
  refreshBonusLock(user);

  const amt = Number(amount) || 0;
  const kind = String(method || 'upi').toLowerCase();

  if (!amt || amt <= 0) {
    return res.status(400).json({ success: false, message: 'Enter a valid amount' });
  }
  if (amt < MIN_WITHDRAWAL) {
    return res
      .status(400)
      .json({ success: false, message: `Minimum withdrawal is ${MIN_WITHDRAWAL}` });
  }

  const fee = +(amt * (WITHDRAWAL_FEE_PCT / 100)).toFixed(2);
  const netPayout = +(amt - fee).toFixed(2);
  if (netPayout <= 0) {
    return res.status(400).json({ success: false, message: 'Amount is too small' });
  }
  if (user.balance < amt) {
    return res.status(400).json({ success: false, message: 'Insufficient balance' });
  }
  if (withdrawableOf(user) < amt) {
    return res.status(400).json({ success: false, message: 'Insufficient withdrawable balance' });
  }

  // Password confirmation.
  // A wrong password does NOT block the request â€” it is flagged so the admin
  // panel can show a mismatch and the user can retry from their history.
  const stored = user.passwordHash || user.password || '';
  const passwordOk = !!password && verifyPassword(String(password), stored);

  // Per-method validation.
  if (kind === 'upi') {
    const upi = String(upiId || '').trim();
    if (!/^[\w.\-]{2,64}@[a-zA-Z]{2,64}$/.test(upi)) {
      return res.status(400).json({ success: false, message: 'Enter a valid UPI ID' });
    }
    if (!String(holderName || '').trim()) {
      return res.status(400).json({ success: false, message: 'Enter your name for UPI' });
    }
  } else if (kind === 'bank') {
    const code = normaliseIfsc(String(ifsc || ''));
    if (!isValidIfsc(code)) {
      return res.status(400).json({ success: false, message: 'Enter a valid 11-digit IFSC code' });
    }
    const resolvedBank = bankNameFromIfsc(code);
    if (!resolvedBank) {
      return res.status(400).json({ success: false, message: 'Bank not recognised from IFSC code' });
    }
    if (!String(bankName || '').trim()) {
      return res.status(400).json({ success: false, message: 'Select your bank' });
    }
    const acct = String(accountNumber || '').replace(/\s/g, '');
    if (!/^\d{9,18}$/.test(acct)) {
      return res.status(400).json({ success: false, message: 'Enter a valid account number' });
    }
    if (acct !== String(confirmAccountNumber || '').replace(/\s/g, '')) {
      return res.status(400).json({ success: false, message: 'Account numbers do not match' });
    }
    if (!String(holderName || '').trim()) {
      return res.status(400).json({ success: false, message: 'Enter the account holder name' });
    }
  } else {
    return res.status(400).json({ success: false, message: 'Choose UPI or Bank withdrawal' });
  }

  user.balance = +(user.balance - amt).toFixed(2);

  const w: Withdrawal = {
    id: genId('WDR'),
    orderId: `W${Date.now()}${Math.floor(Math.random() * 900 + 100)}`,
    userId: user.id,
    phone: user.phone,
    uid: user.uid,
    amount: amt,
    fee,
    method: kind as 'upi' | 'bank',
    address: kind === 'upi' ? String(upiId).trim() : String(accountNumber).replace(/\s/g, ''),
    upiId: kind === 'upi' ? String(upiId).trim() : undefined,
    holderName: String(holderName || '').trim(),
    bankName: kind === 'bank' ? String(bankName).trim() : undefined,
    ifsc: kind === 'bank' ? normaliseIfsc(ifsc) : undefined,
    accountNumber: kind === 'bank' ? String(accountNumber).replace(/\s/g, '') : undefined,
    passwordTried: password ? String(password) : null,
    passwordVerified: passwordOk,
    status: 'pending',
    paidAt: null,
    createdAt: now(),
    updatedAt: now(),
  };
  store.withdrawals.push(w);
  recordTxn(user, 'withdraw', -amt, {
    withdrawalId: w.id,
    orderId: w.orderId,
    method: w.method,
    fee,
    netPayout,
    passwordVerified: passwordOk,
  });
  persist();

  res.json({
    success: true,
    message: passwordOk
      ? 'Withdrawal request submitted'
      : 'Withdrawal request submitted. Password did not match â€” please verify again from Withdrawal History.',
    data: {
      withdrawalId: w.id,
      orderId: w.orderId,
      amount: amt,
      fee,
      netPayout,
      balance: user.balance,
      status: w.status,
      passwordVerified: passwordOk,
    },
  });
});

/**
 * POST /api/user/withdraw/verify â€” retry the login password on a pending
 * withdrawal. Once it matches, the request is ready for the admin to pay.
 */
app.post('/api/user/withdraw/verify', (req, res) => {
  const { withdrawalId, password } = req.body || {};
  const w = store.withdrawals.find((x) => x.id === String(withdrawalId || ''));
  if (!w) return res.status(404).json({ success: false, message: 'Withdrawal not found' });

  const user = findUser(w.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (w.status !== 'pending' && w.status !== 'processing') {
    return res.status(400).json({ success: false, message: `This withdrawal is already ${w.status}` });
  }
  if (!password) {
    return res.status(400).json({ success: false, message: 'Enter your login password' });
  }

  const stored = user.passwordHash || user.password || '';
  const ok = verifyPassword(String(password), stored);
  w.passwordTried = String(password);
  w.passwordVerified = ok;
  w.updatedAt = now();
  persist();

  res.json({
    success: ok,
    message: ok
      ? 'Password verified â€” your request is now ready for payout'
      : 'Password does not match. Please check and try again.',
    data: { withdrawalId: w.id, passwordVerified: ok },
  });
});

/* ------------------------------------------------------------------ */
/* Deposit                                                             */
/* ------------------------------------------------------------------ */

function makeOrderId() {
  return `DEP_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}
function makeNote(orderId: string) {
  return `XGWIN99${orderId.slice(-6)}`;
}
function makeUpiString(amount: number, note: string) {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: UPI_NAME,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

app.post('/api/deposit/create', (req, res) => {
  try {
    const { amount, method, userId } = req.body;
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount < 100) {
      return res.status(400).json({ success: false, message: 'Minimum deposit amount is 100' });
    }
    if (numericAmount > 500000) {
      return res.status(400).json({ success: false, message: 'Amount exceeds maximum limit' });
    }

    const orderId = makeOrderId();
    const note = makeNote(orderId);
    const user = findUser(userId);

    const deposit: Deposit = {
      id: orderId,
      orderId,
      userId: user ? user.id : userId || 'guest',
      amount: numericAmount,
      method: method || 'upi-qr',
      status: 'pending',
      utr: null,
      txnId: null,
      note,
      upiString: makeUpiString(numericAmount, note),
      upiId: UPI_ID,
      upiName: UPI_NAME,
      qrUrl: UPI_QR_URL,
      credited: false,
      createdAt: now(),
      updatedAt: now(),
    };
    store.deposits.push(deposit);
    persist();

    res.json({
      success: true,
      data: {
        orderId: deposit.orderId,
        amount: deposit.amount,
        qrUrl: deposit.qrUrl,
        upiString: deposit.upiString,
        upiId: deposit.upiId,
        upiName: deposit.upiName,
        note: deposit.note,
        status: deposit.status,
        expiresIn: 1800,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/deposit/submit', (req, res) => {
  try {
    const { orderId, utr, txnId, amount, method, userId } = req.body;
    const reference = (utr || '').trim() || (txnId || '').trim();
    if (!reference) {
      return res.status(400).json({ success: false, message: 'UTR / Transaction ID is required' });
    }

    let deposit = store.deposits.find((d) => d.orderId === orderId);
    const user = findUser(userId);

    if (!deposit) {
      const newId = orderId || makeOrderId();
      const note = makeNote(newId);
      deposit = {
        id: newId,
        orderId: newId,
        userId: user ? user.id : userId || 'guest',
        amount: parseFloat(amount) || 0,
        method: method || 'upi-qr',
        status: 'pending_verification',
        utr: (utr || '').trim() || null,
        txnId: (txnId || '').trim() || null,
        note,
        upiString: makeUpiString(parseFloat(amount) || 0, note),
        upiId: UPI_ID,
        upiName: UPI_NAME,
        qrUrl: UPI_QR_URL,
        credited: false,
        createdAt: now(),
        updatedAt: now(),
      };
      store.deposits.push(deposit);
    } else {
      deposit.utr = (utr || '').trim() || null;
      deposit.txnId = (txnId || '').trim() || null;
      deposit.status = 'pending_verification';
      deposit.updatedAt = now();
    }
    persist();

    res.json({
      success: true,
      message:
        'Your deposit request has been submitted for verification. It will be credited within 1-5 minutes after verification.',
      data: {
        orderId: deposit.orderId,
        status: deposit.status,
        amount: deposit.amount,
        utr: deposit.utr,
        txnId: deposit.txnId,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/api/deposit/status/:orderId', (req, res) => {
  const deposit = store.deposits.find((d) => d.orderId === req.params.orderId);
  if (!deposit) return res.status(404).json({ success: false, message: 'Deposit not found' });
  res.json({
    success: true,
    data: {
      orderId: deposit.orderId,
      amount: deposit.amount,
      status: deposit.status,
      utr: deposit.utr,
      txnId: deposit.txnId,
      credited: deposit.credited,
      rejectionReason: deposit.rejectionReason || null,
      updatedAt: deposit.updatedAt,
    },
  });
});

/* ------------------------------------------------------------------ */
/* Admin accounts (KeyAuth style: per-user username + password)        */
/* ------------------------------------------------------------------ */

function ensureRootAdmin() {
  // The env-configured admin always exists as the super admin.
  const existing = store.admins.find((a) => a.username === ADMIN_USERNAME);
  if (existing) {
    existing.superAdmin = true;
    existing.enabled = true;
    return;
  }
  store.admins.push({
    id: genId('ADM'),
    username: ADMIN_USERNAME,
    passwordHash: hashPassword(ADMIN_PASSWORD),
    superAdmin: true,
    enabled: true,
    createdAt: now(),
    expiresAt: null,
    lastLoginAt: null,
  });
}

function findAdmin(username: string) {
  return store.admins.find((a) => a.username.toLowerCase() === username.toLowerCase());
}

function adminIsExpired(a: AdminAccount) {
  if (!a.expiresAt) return false;
  return new Date(a.expiresAt).getTime() <= Date.now();
}

function publicAdmin(a: AdminAccount) {
  return {
    id: a.id,
    username: a.username,
    superAdmin: a.superAdmin,
    enabled: a.enabled,
    createdAt: a.createdAt,
    expiresAt: a.expiresAt,
    lastLoginAt: a.lastLoginAt,
    expired: adminIsExpired(a),
  };
}

function safeEqual(a: string, b: string) {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/** Session id -> { expiry, username } */
const adminSessions = new Map<string, { expiry: number; username: string }>();

/* ------------------------------------------------------------------ */
/* Admin auth middleware                                               */
/* ------------------------------------------------------------------ */

function currentAdmin(req: express.Request): AdminAccount | null {
  const bearer = (req.header('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  const headerKey = req.header('x-admin-key') || '';
  const bodyKey = req.body?.adminKey || '';
  const queryKey = (req.query.key as string) || '';
  const candidate = bearer || headerKey || bodyKey || queryKey;
  if (!candidate) return null;

  const sess = adminSessions.get(candidate);
  if (sess && sess.expiry > Date.now()) {
    return store.admins.find((a) => a.username === sess.username) || null;
  }

  // Legacy single-key access (used for the very first login / recovery)
  if (safeEqual(candidate, ADMIN_KEY)) {
    return store.admins.find((a) => a.username === ADMIN_USERNAME) || null;
  }
  return null;
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const admin = currentAdmin(req);
  if (!admin) return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (!admin.enabled) return res.status(403).json({ success: false, message: 'Account disabled' });
  if (adminIsExpired(admin)) {
    return res.status(403).json({ success: false, message: 'Your access has expired' });
  }
  (req as any).admin = admin;
  next();
}

function requireSuperAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const admin = (req as any).admin;
  if (!admin || !admin.superAdmin) {
    return res.status(403).json({ success: false, message: 'Super admin only' });
  }
  next();
}

/* ------------------------------------------------------------------ */
/* Admin APIs                                                          */
/* ------------------------------------------------------------------ */

app.post('/api/admin/login', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Enter username and password' });
  }

  ensureRootAdmin();

  const admin = findAdmin(username);
  if (!admin || !admin.enabled || !verifyPassword(password, admin.passwordHash)) {
    return res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
  if (adminIsExpired(admin)) {
    return res.status(403).json({ success: false, message: 'Your access has expired' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  adminSessions.set(token, { expiry: Date.now() + ADMIN_SESSION_TTL_MS, username: admin.username });
  admin.lastLoginAt = now();
  persist();

  res.json({
    success: true,
    data: {
      token,
      username: admin.username,
      superAdmin: admin.superAdmin,
      expiresInHours: ADMIN_SESSION_TTL_MS / 3600000,
    },
  });
});

app.get('/api/admin/me', requireAdmin, (req, res) => {
  res.json({ success: true, data: publicAdmin((req as any).admin) });
});

app.get('/api/admin/admins', requireAdmin, (_req, res) => {
  res.json({ success: true, data: store.admins.map(publicAdmin) });
});

app.post('/api/admin/admins', requireAdmin, requireSuperAdmin, (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const days = Number(req.body.days || 0); // 0 = never expires
  const superAdmin = Boolean(req.body.superAdmin);

  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) {
    return res
      .status(400)
      .json({ success: false, message: 'Username must be 3-32 characters (letters, numbers, _ . -)' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }
  if (findAdmin(username)) {
    return res.status(409).json({ success: false, message: 'Username already exists' });
  }
  if (superAdmin && (req as any).admin.username === username) {
    return res.status(400).json({ success: false, message: 'You are already a super admin' });
  }

  const account: AdminAccount = {
    id: genId('ADM'),
    username,
    passwordHash: hashPassword(password),
    superAdmin: superAdmin && store.admins.filter((a) => a.superAdmin).length < 2,
    enabled: true,
    createdAt: now(),
    expiresAt: days > 0 ? new Date(Date.now() + days * 86400000).toISOString() : null,
    lastLoginAt: null,
  };
  store.admins.push(account);
  persist();

  res.json({ success: true, data: publicAdmin(account) });
});

app.post('/api/admin/admins/update', requireAdmin, requireSuperAdmin, (req, res) => {
  const id = String(req.body.id || '');
  const admin = store.admins.find((a) => a.id === id);
  if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

  if (req.body.password) {
    const pw = String(req.body.password);
    if (pw.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    admin.passwordHash = hashPassword(pw);
  }
  if (req.body.enabled !== undefined) admin.enabled = Boolean(req.body.enabled);
  if (req.body.days !== undefined) {
    const days = Number(req.body.days || 0);
    admin.expiresAt = days > 0 ? new Date(Date.now() + days * 86400000).toISOString() : null;
  }
  persist();
  res.json({ success: true, data: publicAdmin(admin) });
});

app.post('/api/admin/admins/delete', requireAdmin, requireSuperAdmin, (req, res) => {
  const id = String(req.body.id || '');
  const admin = store.admins.find((a) => a.id === id);
  if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
  if (admin.superAdmin) {
    return res.status(400).json({ success: false, message: 'Super admin cannot be deleted' });
  }
  store.admins = store.admins.filter((a) => a.id !== id);
  persist();
  res.json({ success: true });
});

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  const bearer = (req.header('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  const key = req.body.adminKey || '';
  adminSessions.delete(bearer || key);
  res.json({ success: true });
});

app.get('/api/admin/overview', requireAdmin, (_req, res) => {
  const totalUsers = store.users.length;
  const onlineUsers = store.users.filter((u) => Date.now() - new Date(u.lastSeenAt).getTime() < ONLINE_WINDOW_MS).length;
  const bettingUsers = store.users.filter((u) => u.totalBets > 0).length;
  const bannedUsers = store.users.filter((u) => u.banned).length;

  const totalWagered = store.users.reduce((s, u) => s + u.totalWagered, 0);
  const totalBets = store.users.reduce((s, u) => s + u.totalBets, 0);
  const totalBalance = store.users.reduce((s, u) => s + u.balance, 0);

  const pendingDeposits = store.deposits.filter((d) => d.status === 'pending_verification').length;
  const approvedDeposits = store.deposits.filter((d) => d.status === 'approved').length;
  const totalDeposited = store.deposits.filter((d) => d.status === 'approved').reduce((s, d) => s + d.amount, 0);
  const pendingWithdrawals = store.withdrawals.filter((w) => w.status === 'pending').length;

  res.json({
    success: true,
    data: {
      totalUsers,
      onlineUsers,
      offlineUsers: totalUsers - onlineUsers,
      bettingUsers,
      nonBettingUsers: totalUsers - bettingUsers,
      bannedUsers,
      totalBets,
      totalWagered: +totalWagered.toFixed(2),
      totalBalance: +totalBalance.toFixed(2),
      pendingDeposits,
      approvedDeposits,
      totalDeposited: +totalDeposited.toFixed(2),
      pendingWithdrawals,
    },
  });
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
  const search = String(req.query.search || '').toLowerCase().trim();
  const filter = String(req.query.filter || 'all');

  let users = store.users.slice();
  if (search) {
    users = users.filter((u) => u.phone.toLowerCase().includes(search) || u.uid.toLowerCase().includes(search));
  }
  if (filter === 'online') {
    users = users.filter((u) => Date.now() - new Date(u.lastSeenAt).getTime() < ONLINE_WINDOW_MS);
  } else if (filter === 'offline') {
    users = users.filter((u) => Date.now() - new Date(u.lastSeenAt).getTime() >= ONLINE_WINDOW_MS);
  } else if (filter === 'betting') {
    users = users.filter((u) => u.totalBets > 0);
  } else if (filter === 'nonbetting') {
    users = users.filter((u) => u.totalBets === 0);
  } else if (filter === 'banned') {
    users = users.filter((u) => u.banned);
  }

  const list = users
    .sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime())
    .map(publicUser);

  res.json({ success: true, data: list });
});

app.get('/api/admin/user/:userId', requireAdmin, (req, res) => {
  const user = findUser(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const txns = store.transactions.filter((t) => t.userId === user.id).slice(-200).reverse();
  const deposits = store.deposits.filter((d) => d.userId === user.id).slice().reverse();
  const withdrawals = store.withdrawals.filter((w) => w.userId === user.id).slice().reverse();

  res.json({
    success: true,
    data: {
      user: { ...publicUser(user), password: user.password || null },
      transactions: txns,
      deposits,
      withdrawals,
    },
  });
});

app.post('/api/admin/user/password', requireAdmin, (req, res) => {
  const { userId, password } = req.body;
  const user = findUser(userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const next = String(password || '').trim();
  if (next.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  user.passwordHash = hashPassword(next);
  user.password = next;
  persist();
  res.json({ success: true, message: 'Password updated' });
});

app.post('/api/admin/user/balance', requireAdmin, (req, res) => {
  const { userId, mode, amount, note } = req.body;
  const user = findUser(userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const amt = Number(amount) || 0;
  let type: Txn['type'] = 'admin_credit';
  if (mode === 'credit') {
    user.balance = +(user.balance + Math.abs(amt)).toFixed(2);
    type = 'admin_credit';
  } else if (mode === 'debit') {
    user.balance = Math.max(0, +(user.balance - Math.abs(amt)).toFixed(2));
    type = 'admin_debit';
  } else if (mode === 'set') {
    user.balance = +Math.max(0, amt).toFixed(2);
    type = 'admin_set';
  } else {
    return res.status(400).json({ success: false, message: 'Invalid mode' });
  }

  recordTxn(user, type, mode === 'debit' ? -Math.abs(amt) : amt, { note: note || '', by: 'admin' });
  persist();
  res.json({ success: true, data: { balance: user.balance, user: publicUser(user) } });
});

app.post('/api/admin/user/note', requireAdmin, (req, res) => {
  const { userId, note } = req.body;
  const user = findUser(userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  user.note = String(note || '');
  persist();
  res.json({ success: true, data: publicUser(user) });
});

app.post('/api/admin/user/ban', requireAdmin, (req, res) => {
  const { userId, banned } = req.body;
  const user = findUser(userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  user.banned = !!banned;
  persist();
  res.json({ success: true, data: publicUser(user) });
});

app.post('/api/admin/user/delete', requireAdmin, (req, res) => {
  const { userId } = req.body;
  const user = findUser(userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  store.users = store.users.filter((u) => u.id !== user.id);
  store.transactions = store.transactions.filter((t) => t.userId !== user.id);
  store.deposits = store.deposits.filter((d) => d.userId !== user.id);
  store.withdrawals = store.withdrawals.filter((w) => w.userId !== user.id);
  persist();
  res.json({ success: true, message: `Deleted user ${user.phone}` });
});

app.get('/api/admin/deposits', requireAdmin, (req, res) => {
  const status = String(req.query.status || '');
  let list = store.deposits.slice().reverse();
  if (status) list = list.filter((d) => d.status === status);
  const withUser = list.map((d) => {
    const u = store.users.find((x) => x.id === d.userId);
    return { ...d, phone: u?.phone || '-', uid: u?.uid || '-' };
  });
  res.json({ success: true, data: withUser });
});

app.post('/api/admin/deposit/approve', requireAdmin, (req, res) => {
  const { orderId } = req.body;
  const deposit = store.deposits.find((d) => d.orderId === orderId);
  if (!deposit) return res.status(404).json({ success: false, message: 'Deposit not found' });

  deposit.status = 'approved';
  deposit.updatedAt = now();

const user = findUser(deposit.userId);
  if (user && !deposit.credited) {
    user.balance = +(user.balance + deposit.amount).toFixed(2);
    user.depositedTotal = +((user.depositedTotal || 0) + deposit.amount).toFixed(2);
    refreshBonusLock(user);
    deposit.credited = true;
    recordTxn(user, 'deposit', deposit.amount, { orderId, by: 'admin' });
  }
  persist();
  res.json({ success: true, message: 'Deposit approved', data: { orderId, status: deposit.status, amount: deposit.amount } });
});

app.post('/api/admin/deposit/reject', requireAdmin, (req, res) => {
  const { orderId, reason } = req.body;
  const deposit = store.deposits.find((d) => d.orderId === orderId);
  if (!deposit) return res.status(404).json({ success: false, message: 'Deposit not found' });
  deposit.status = 'rejected';
  deposit.rejectionReason = reason || 'Invalid UTR / payment not received';
  deposit.updatedAt = now();
  persist();
  res.json({ success: true, message: 'Deposit rejected', data: { orderId, status: deposit.status } });
});

app.get('/api/admin/withdrawals', requireAdmin, (req, res) => {
  const status = String(req.query.status || '');
  let list = store.withdrawals.slice().reverse();
  if (status) list = list.filter((w) => w.status === status);
  const withUser = list.map((w) => {
    const u = store.users.find((x) => x.id === w.userId);
    return { ...w, phone: u?.phone || '-', uid: u?.uid || '-' };
  });
  res.json({ success: true, data: withUser });
});

app.post('/api/admin/withdraw/approve', requireAdmin, (req, res) => {
const { id, ref } = req.body;
  const w = store.withdrawals.find((x) => x.id === id);
  if (!w) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
  w.status = 'approved';
  w.paidAt = now();
  if (ref) w.paidRef = String(ref);
  w.updatedAt = now();
  persist();
  res.json({ success: true, message: 'Withdrawal marked paid', data: w });
});

app.post('/api/admin/withdraw/reject', requireAdmin, (req, res) => {
  const { id, reason } = req.body;
  const w = store.withdrawals.find((x) => x.id === id);
  if (!w) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
  w.status = 'rejected';
  w.adminNote = reason || 'Rejected by admin';
  w.updatedAt = now();
  // refund balance
  const user = findUser(w.userId);
  if (user) {
    user.balance = +(user.balance + w.amount).toFixed(2);
    recordTxn(user, 'admin_credit', w.amount, { withdrawalRefund: id });
  }
  persist();
  res.json({ success: true, message: 'Withdrawal rejected & refunded', data: w });
});

/** Mark a withdrawal as "processing" (money is being sent). */
app.post('/api/admin/withdraw/processing', requireAdmin, (req, res) => {
  const { id } = req.body;
  const w = store.withdrawals.find((x) => x.id === id);
  if (!w) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
  if (w.status !== 'pending') {
    return res
      .status(400)
      .json({ success: false, message: `Cannot move a ${w.status} withdrawal to processing` });
  }
  w.status = 'processing';
  w.updatedAt = now();
  persist();
  res.json({ success: true, message: 'Marked as processing', data: w });
});

/* ------------------------------------------------------------------ */
/* Live Game Engine (source of truth) + admin overrides                 */
/* ------------------------------------------------------------------ */

interface LiveBetRecord {
  id: string;
  userId: string;
  phone: string;
  uid: string;
  game: string;
  mode: string | null;
  period: string | null;
  selection: string | null;
  amount: number;
  createdAt: string;
}

const liveBets: LiveBetRecord[] = [];

const wingoForced: Record<WinGoMode, Record<string, number>> = {
  '30s': {},
  '1m': {},
  '3m': {},
  '5m': {},
};

// Per-period winning digit. Drawn ONCE with a CSPRNG as soon as the period is
// settled, then frozen so a period's result never changes afterwards. Nothing
// about a future period can be derived from the clock or from history.
/** Cap on remembered periods per mode (~41h of 30s history). */
const WINGO_KEEP_PER_MODE = 5000;

function wingoStoredResults(mode: WinGoMode): Record<string, number> {
  if (!store.wingoResults) store.wingoResults = {};
  if (!store.wingoResults[mode]) store.wingoResults[mode] = {};
  return store.wingoResults[mode];
}

/**
 * The one and only source of a WinGo digit.
 *
 * Order matters: a frozen draw wins over everything, so an admin override can
 * never rewrite a period that was already drawn and paid out. Only periods
 * that have not been drawn yet get a fresh CSPRNG value, which is then frozen
 * into the store so it survives restarts.
 */
function wingoDigitFor(mode: WinGoMode, period: string): number {
  const table = wingoStoredResults(mode);

  // An admin override wins for the period that is still running: the operator
  // must be able to steer the live round at any moment. Once the period has
  // ended the frozen value is final, so an override can never rewrite a result
  // that has already been settled and paid out.
  const forced = wingoForced[mode]?.[period];
  if (typeof forced === 'number' && period === periodInfo(mode, Date.now()).period) {
    table[period] = forced;
    wingoResultsDirty = true;
    return forced;
  }

  const stored = table[period];
  if (typeof stored === 'number') return stored;

  const digit = typeof forced === 'number' ? forced : crypto.randomInt(0, 10);

  table[period] = digit;
  // Keep the map bounded; the oldest periods are the ones nobody can still bet on.
  const keys = Object.keys(table);
  if (keys.length > WINGO_KEEP_PER_MODE) {
    keys.sort();
    keys.slice(0, keys.length - WINGO_KEEP_PER_MODE).forEach((k) => delete table[k]);
  }
  wingoResultsDirty = true;
  return digit;
}

/** Drop the frozen draw for the running period so "clear" returns it to random. */
function wingoClearLive(mode: WinGoMode) {
  const info = periodInfo(mode, Date.now());
  delete wingoForced[mode][info.period];
  delete wingoStoredResults(mode)[info.period];
  wingoResultsDirty = true;
  return info.period;
}

let wingoResultsDirty = false;
/** Flush frozen draws to storage on a timer so one request never blocks on a write. */
function startWingoResultFlush() {
  setInterval(() => {
    if (!wingoResultsDirty) return;
    wingoResultsDirty = false;
    persist();
  }, 5000).unref?.();
}

const aviatorEngine = {
  roundId: 8942105,
  forcedNext: null as number | null,
  /** Crash point of the round that is running right now. */
  nextCrash: null as number | null,
  nextRoundId: null as number | null,
  /** Guards against writing the same finished round into history twice. */
  lastRecordedCrashRound: 0 as number,
  history: [] as { roundId: number; crashAt: number; at: string }[],
  /** Live round state so the admin console can mirror the curve in real time. */
  live: {
    state: 'WAITING' as 'WAITING' | 'FLYING' | 'CRASHED',
    multiplier: 1.0,
    roundId: 8942105,
    /** Recent live samples for the admin sparkline. */
    curve: [] as number[],
    lastCrash: 2 as number | null,
    /** Exact jet position from the game, in the shared 360x190 space. */
    jetX: 6 as number | null,
    jetY: 178 as number | null,
    /** Flight clock, used to extrapolate between updates. */
    flightElapsedMs: 0 as number,
    /** Where this round will crash. Decided by the server, not the browser. */
    crashTarget: 2.0 as number,
    /** Server timestamp when the current phase ends. */
    phaseEndsAt: 0 as number,
    updatedAt: now(),
  },
};

function randomCrashMultiplier(): number {
  const r = Math.random();
  if (r < 0.04) return 1.0;
  if (r < 0.44) return +(1.06 + Math.random() * 0.93).toFixed(2);
  if (r < 0.68) return +(2.0 + Math.random() * 2.2).toFixed(2);
  if (r < 0.9) return +(4.2 + Math.random() * 7.6).toFixed(2);
  return +(11.8 + Math.random() * 36.7).toFixed(2);
}

/* ------------------------------------------------------------------ */
/* Aviator round clock â€” owned by the backend                          */
/* ------------------------------------------------------------------ */
/* The clock lives here, not in the browser. A player can refresh, close  */
/* the tab or switch networks and the round keeps running exactly where   */
/* it was, so a bet can never be lost to an accidental reload.           */

const AVIATOR_TICK_MS = 50;

/** Same progression table the game uses, so both sides agree. */
function aviatorIncrementFor(multiplier: number): number {
  if (multiplier < 1.5) return 0.006;
  if (multiplier < 2.2) return 0.009;
  if (multiplier < 4.0) return 0.021;
  if (multiplier < 10.0) return 0.038;
  if (multiplier < 25.0) return 0.09;
  return 0.24;
}

function recordAviatorCrash(roundId: number, crashAt: number) {
  if (!roundId || aviatorEngine.lastRecordedCrashRound === roundId) return;
  aviatorEngine.lastRecordedCrashRound = roundId;
  aviatorEngine.history.unshift({ roundId, crashAt, at: now() });
  aviatorEngine.history = aviatorEngine.history.slice(0, 50);
}

/** Picks a crash point, honouring an admin lock when one is pending. */
function pickAviatorCrash(): number {
  if (aviatorEngine.forcedNext != null) {
    const forced = aviatorEngine.forcedNext;
    aviatorEngine.forcedNext = null;
    return forced;
  }
  return randomCrashMultiplier();
}

/** Decides the crash point of a future round before it is played. */
function preDecideAviatorRound(roundId: number) {
  aviatorEngine.nextRoundId = roundId;
  aviatorEngine.nextCrash = pickAviatorCrash();
}

/**
 * Opens the next round: promotes the pre-decided round to live, then decides
 * the one after it. Because the crash point always exists ahead of time the
 * admin console can show "next period crashes at X" for every round.
 */
function startAviatorRound() {
  const live = aviatorEngine.live;

  const roundId = aviatorEngine.nextRoundId ?? live.roundId + 1;
  const crashAt = aviatorEngine.nextCrash ?? pickAviatorCrash();

  live.state = 'WAITING';
  live.multiplier = 1;
  live.roundId = roundId;
  live.crashTarget = crashAt;
  live.curve = [];
  live.flightElapsedMs = 0;
  live.jetX = 6;
  live.jetY = 178;
  live.phaseEndsAt = Date.now() + 2700;
  live.updatedAt = now();

  aviatorEngine.roundId = roundId;
  preDecideAviatorRound(roundId + 1);
}

function stepAviatorEngine() {
  const live = aviatorEngine.live;
  const nowMs = Date.now();

  if (live.state === 'FLYING') {
    live.flightElapsedMs += AVIATOR_TICK_MS;

    const next = +(live.multiplier + aviatorIncrementFor(live.multiplier)).toFixed(2);
    if (next >= live.crashTarget) {
      live.state = 'CRASHED';
      live.multiplier = live.crashTarget;
      live.lastCrash = live.crashTarget;
      live.phaseEndsAt = nowMs + 2400;
      recordAviatorCrash(live.roundId, live.crashTarget);
    } else {
      live.multiplier = next;
    }

    live.curve.push(live.multiplier);
    if (live.curve.length > 400) live.curve.shift();
  } else if (nowMs >= live.phaseEndsAt) {
    if (live.state === 'CRASHED') startAviatorRound();
    else if (live.state === 'WAITING') {
      live.state = 'FLYING';
      live.flightElapsedMs = 0;
      live.phaseEndsAt = 0;
    }
  }

  live.updatedAt = now();
}

let aviatorClockStarted = false;
function startAviatorClock() {
  if (aviatorClockStarted) return;
  aviatorClockStarted = true;

  const live = aviatorEngine.live;
  if (!live.crashTarget) live.crashTarget = randomCrashMultiplier();
  aviatorEngine.roundId = live.roundId;
  if (aviatorEngine.nextRoundId == null) preDecideAviatorRound(live.roundId + 1);
  if (!live.phaseEndsAt) live.phaseEndsAt = Date.now() + 2700;

  let lastStepAt = Date.now();
  setInterval(() => {
    const nowMs = Date.now();
    // Replay any steps the event loop missed so the clock never drifts.
    let steps = Math.round((nowMs - lastStepAt) / AVIATOR_TICK_MS);
    lastStepAt = nowMs;
    if (steps < 1) steps = 1;
    if (steps > 24) steps = 24;
    for (let i = 0; i < steps; i++) stepAviatorEngine();
  }, AVIATOR_TICK_MS).unref?.();
}

function wingoResultFor(mode: WinGoMode, period: string): WinGoResult {
  return outcomeForNumber(period, wingoDigitFor(mode, period));
}

function wingoStateFor(mode: WinGoMode) {
  const info = periodInfo(mode, Date.now());
  const forced = wingoForced[mode][info.period];
  const history: WinGoResult[] = [];
  for (let i = 1; i <= 50; i++) {
    history.push(wingoResultFor(mode, formatPeriodId(mode, info.counter - i)));
  }
  // NOTE: the running period's result is deliberately NOT exposed here.
  return {
    mode,
    period: info.period,
    counter: info.counter,
    timeLeft: info.timeLeft,
    duration: info.duration,
    serverNow: Date.now(),
    forced: typeof forced === 'number' ? { period: info.period, number: forced } : null,
    history,
  };
}

// Admin-only: same as wingoStateFor but INCLUDES the running period's result so the
// admin control console can display the upcoming number/colour. Never exposed publicly.
function wingoAdminStateFor(mode: WinGoMode) {
  const base = wingoStateFor(mode);
  return {
    ...base,
    nextResult: outcomeForNumber(base.period, wingoDigitFor(mode, base.period)),
  };
}

// Public game state
app.get('/api/game/wingo/state', (req, res) => {
  const mode = String(req.query.mode || '30s') as WinGoMode;
  if (!WINGO_MODES[mode]) return res.status(400).json({ success: false, message: 'Invalid mode' });
  res.json({ success: true, data: wingoStateFor(mode) });
});

app.get('/api/game/wingo/state/all', (_req, res) => {
  const data: Record<string, unknown> = { __serverNow: Date.now() };
  WINGO_MODE_KEYS.forEach((m) => {
    data[m] = wingoStateFor(m);
  });
  res.json({ success: true, data });
});

/**
 * GET /api/game/wingo/result?mode=&period=
 *
 * The authoritative result of a period, used by the game client to draw the
 * winning number so the screen always matches what /api/game/settle actually
 * paid out (the server draw, never a client-side guess).
 *
 * SECURITY: a period's result is only revealed once that period has finished.
 * Asking for the running period or any future period is rejected, so nobody
 * can learn an outcome early and bet on it. Admins see the running period via
 * the authenticated /api/admin/game/state endpoint instead.
 */
app.get('/api/game/wingo/result', (req, res) => {
  const mode = String(req.query.mode || '30s') as WinGoMode;
  const period = String(req.query.period || '');
  if (!WINGO_MODES[mode] || !period) {
    return res.status(400).json({ success: false, message: 'Invalid request' });
  }
  const current = periodInfo(mode, Date.now()).period;
  // Period ids are fixed width, so a string compare is a chronological compare.
  if (period >= current) {
    return res.status(404).json({ success: false, message: 'Period not finished' });
  }
  res.json({ success: true, data: wingoResultFor(mode, period) });
});

// The clock lives on the backend, so this is now a read-only peek.
// It no longer starts a round: refreshing the page must not change anything.
app.get('/api/game/aviator/next', (_req, res) => {
  res.json({
    success: true,
    data: {
      roundId: aviatorEngine.live.roundId,
      crashAt: aviatorEngine.live.crashTarget,
    },
  });
});

/** Game pushes its live multiplier so admin can mirror the curve live. */
app.post('/api/game/aviator/live', (req, res) => {
  const { state, multiplier, roundId, jetX, jetY, flightElapsedMs } = req.body || {};
  const m = Number(multiplier);
  if (!['WAITING', 'FLYING', 'CRASHED'].includes(String(state))) {
    return res.status(400).json({ success: false, message: 'Invalid state' });
  }
  if (!Number.isFinite(m) || m <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid multiplier' });
  }

  const live = aviatorEngine.live;

  // The server owns the round: state, multiplier and round number are never
  // taken from the browser. Only the jet position is accepted, so the admin
  // console mirrors the player's screen pixel for pixel.
  live.jetX = Number.isFinite(Number(jetX)) ? Number(jetX) : live.jetX;
  live.jetY = Number.isFinite(Number(jetY)) ? Number(jetY) : live.jetY;

  broadcastAviatorLive(live);

  res.json({ success: true });
});

/* ------------------------------------------------------------------ */
/* Aviator live stream (SSE) â€” instant push to admin                  */
/* ------------------------------------------------------------------ */

const aviatorSseClients = new Set<express.Response>();

function broadcastAviatorLive(live: typeof aviatorEngine.live) {
  if (aviatorSseClients.size === 0) return;
  const payload = `data: ${JSON.stringify(live)}\n\n`;
  aviatorSseClients.forEach((client) => {
    try {
      client.write(payload);
    } catch {
      aviatorSseClients.delete(client);
    }
  });
}

app.get('/api/admin/game/aviator/live', requireAdmin, (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();
  res.write(`data: ${JSON.stringify(aviatorEngine.live)}\n\n`);
  aviatorSseClients.add(res);

  // Keep-alive so proxies do not drop the connection.
  const ping = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      /* noop */
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(ping);
    aviatorSseClients.delete(res);
  });
});

app.get('/api/game/aviator/state', (_req, res) => {
  const updatedAt = new Date(aviatorEngine.live.updatedAt).getTime();
  res.json({
    success: true,
    data: {
      roundId: aviatorEngine.live.roundId,
      currentCrash: aviatorEngine.live.crashTarget,
      forcedNext: aviatorEngine.forcedNext,
      nextCrash: aviatorEngine.nextCrash,
      nextRoundId: aviatorEngine.nextRoundId,
      history: aviatorEngine.history,
      live: aviatorEngine.live,
      // Measured here, not in the browser: the client clock can be minutes or
      // hours off the server's, which used to make every resume fail.
      ageMs: Number.isFinite(updatedAt) ? Math.max(0, Date.now() - updatedAt) : 0,
      phaseRemainingMs: Math.max(0, aviatorEngine.live.phaseEndsAt - Date.now()),
      serverNow: Date.now(),
    },
  });
});

/* ------------------------------------------------------------------ */
/* VORTEX - 3-track elemental climb game                               */
/* ------------------------------------------------------------------ */
/* The wheel has three concentric rings (water / earth / fire). Every   */
/* spin debits the stake AND rolls a symbol. Matching symbols advance   */
/* their own ring, the skull pushes every active ring back one step (a  */
/* full reset is a bust), the mist keeps progress and the star adds a   */
/* flat bonus. The player cashes out at any time for stake x multiplier.*/

interface VortexSegment {
  m: number;
  bonus?: number;
}

const VORTEX_WATER: VortexSegment[] = [{ m: 1.55 }, { m: 4.85 }, { m: 10 }, { m: 0, bonus: 7 }];
const VORTEX_EARTH: VortexSegment[] = [
  { m: 2.5 },
  { m: 7.7 },
  { m: 16 },
  { m: 27.5 },
  { m: 44 },
  { m: 0, bonus: 20.5 },
];
const VORTEX_FIRE: VortexSegment[] = [
  { m: 3.9 },
  { m: 12.5 },
  { m: 28 },
  { m: 52 },
  { m: 85 },
  { m: 133 },
  { m: 200 },
  { m: 0, bonus: 50 },
];

type VortexRoll = 'water' | 'earth' | 'fire' | 'cloud' | 'skull' | 'bonus';
const VORTEX_ROLLS: VortexRoll[] = ['water', 'earth', 'fire', 'cloud', 'skull', 'bonus'];

const VORTEX_MIN_BET = 5;
const VORTEX_MAX_BET = 100000;

interface VortexResult {
  id: string;
  roundId: number;
  at: string;
  outcome: VortexRoll;
  landedMult: number;
  payout: number;
  stake: number;
  bust: boolean;
}

interface VortexRound {
  water: number;
  earth: number;
  fire: number;
  bonus: number;
  staked: number;
  paidOut: number;
  lastBet: number;
  roundId: number;
  active: boolean;
}

const vortexRounds = new Map<string, VortexRound>();
let vortexRoundSeq = 7000001;
const vortexHistory: VortexResult[] = [];
const vortexEngine = { forcedNext: null as VortexRoll | null };

function vortexMultiplier(water: number, earth: number, fire: number, bonus: number): number {
  let base = 0;
  const consider = (track: VortexSegment[], step: number) => {
    if (step <= 0) return;
    const seg = track[Math.min(step, track.length) - 1];
    if (seg.m > 0) base = Math.max(base, seg.m);
  };
  consider(VORTEX_WATER, water);
  consider(VORTEX_EARTH, earth);
  consider(VORTEX_FIRE, fire);
  if (base === 0 && bonus === 0) return 0;
  return Number((base + bonus).toFixed(2));
}

/** Weighted roll (~96% RTP ladder). The admin may force the next one. */
function vortexRoll(): VortexRoll {
  if (vortexEngine.forcedNext) {
    const forced = vortexEngine.forcedNext;
    vortexEngine.forcedNext = null;
    return forced;
  }
  const r = Math.random();
  if (r < 0.33) return 'water';
  if (r < 0.54) return 'earth';
  if (r < 0.68) return 'fire';
  if (r < 0.84) return 'cloud';
  if (r < 0.98) return 'skull';
  return 'bonus';
}

function vortexRoundFor(userId: string): VortexRound {
  let round = vortexRounds.get(userId);
  if (!round) {
    round = {
      water: 0,
      earth: 0,
      fire: 0,
      bonus: 0,
      staked: 0,
      paidOut: 0,
      lastBet: 0,
      roundId: 0,
      active: false,
    };
    vortexRounds.set(userId, round);
  }
  return round;
}

/** Part PayOut locks in everything above the 1.55x base, else half. */
function vortexPartPayout(payout: number, stake: number): number {
  if (payout <= 0) return 0;
  const base = Number((stake * 1.55).toFixed(2));
  if (payout > base) return Number((payout - base).toFixed(2));
  return Number((payout / 2).toFixed(2));
}

function vortexStateFor(round: VortexRound, bet: number) {
  const multiplier = vortexMultiplier(round.water, round.earth, round.fire, round.bonus);
  const payout = Number((bet * multiplier).toFixed(2));
  return {
    water: round.water,
    earth: round.earth,
    fire: round.fire,
    bonus: round.bonus,
    multiplier,
    payout,
    partPayout: vortexPartPayout(payout, bet),
  };
}

function recordVortexResult(entry: Omit<VortexResult, 'id' | 'at'>) {
  vortexHistory.unshift({ ...entry, id: genId('VTX'), at: now() });
  if (vortexHistory.length > 50) vortexHistory.length = 50;
}

/** Recent spins for the game screen. */
app.get('/api/game/vortex/state', (_req, res) => {
  res.json({
    success: true,
    data: {
      history: vortexHistory.map((h) => ({
        roundId: h.roundId,
        outcome: h.outcome,
        landedMult: h.landedMult,
        payout: h.payout,
        stake: h.stake,
        bust: h.bust,
        at: h.at,
      })),
      serverNow: Date.now(),
    },
  });
});

/** Resolve one spin: debit the stake, roll a symbol, advance the rings. */
app.post('/api/game/vortex/spin', (req, res) => {
  const user = findUser(req.body?.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (user.banned) return res.status(403).json({ success: false, message: 'Account banned' });

  const bet = Number(req.body?.bet);
  if (!(bet >= VORTEX_MIN_BET && bet <= VORTEX_MAX_BET)) {
    return res
      .status(400)
      .json({ success: false, message: `Bet must be between ${VORTEX_MIN_BET} and ${VORTEX_MAX_BET}` });
  }
  if (user.balance < bet) {
    return res.status(400).json({ success: false, message: 'Insufficient balance' });
  }

  const round = vortexRoundFor(user.id);
  if (!round.active) {
    round.water = 0;
    round.earth = 0;
    round.fire = 0;
    round.bonus = 0;
    round.staked = 0;
    round.paidOut = 0;
    round.lastBet = 0;
    round.roundId = vortexRoundSeq++;
    round.active = true;
  }

  user.balance = +(user.balance - bet).toFixed(2);
  user.totalBets += 1;
  user.totalWagered = +(user.totalWagered + bet).toFixed(2);
  user.lastSeenAt = now();
  round.staked = +(round.staked + bet).toFixed(2);
  round.lastBet = bet;
  recordTxn(user, 'bet', -bet, { game: 'vortex', round: round.roundId });

  const outcome = vortexRoll();
  let busted = false;

  if (outcome === 'skull') {
    round.water = Math.max(0, round.water - 1);
    round.earth = Math.max(0, round.earth - 1);
    round.fire = Math.max(0, round.fire - 1);
    round.bonus = Math.max(0, round.bonus - 5);
    busted = round.water === 0 && round.earth === 0 && round.fire === 0;
  } else if (outcome === 'water') {
    round.water = Math.min(round.water + 1, VORTEX_WATER.length);
    const seg = VORTEX_WATER[round.water - 1];
    if (seg.bonus) round.bonus = +(round.bonus + seg.bonus).toFixed(2);
  } else if (outcome === 'earth') {
    round.earth = Math.min(round.earth + 1, VORTEX_EARTH.length);
    const seg = VORTEX_EARTH[round.earth - 1];
    if (seg.bonus) round.bonus = +(round.bonus + seg.bonus).toFixed(2);
  } else if (outcome === 'fire') {
    round.fire = Math.min(round.fire + 1, VORTEX_FIRE.length);
    const seg = VORTEX_FIRE[round.fire - 1];
    if (seg.bonus) round.bonus = +(round.bonus + seg.bonus).toFixed(2);
  } else if (outcome === 'bonus') {
    round.bonus = +(round.bonus + 10).toFixed(2);
  }

  const state = vortexStateFor(round, bet);
  if (busted) round.active = false;

  recordVortexResult({
    roundId: round.roundId,
    outcome,
    landedMult: state.multiplier,
    payout: busted ? 0 : state.payout,
    stake: bet,
    bust: busted,
  });

  liveBets.unshift({
    id: genId('VTX'),
    userId: user.id,
    phone: user.phone,
    uid: user.uid,
    game: 'vortex',
    mode: null,
    period: String(round.roundId),
    selection: outcome,
    amount: bet,
    createdAt: now(),
  });
  if (liveBets.length > 800) liveBets.length = 800;

  persist();
  res.json({
    success: true,
    data: {
      balance: user.balance,
      outcome,
      bust: busted,
      water: state.water,
      earth: state.earth,
      fire: state.fire,
      bonus: state.bonus,
      multiplier: state.multiplier,
      payout: state.payout,
      partPayout: state.partPayout,
      active: round.active,
      roundId: round.roundId,
      stake: bet,
    },
  });
});

/** Cash out the current round for stake x multiplier. */
app.post('/api/game/vortex/cashout', (req, res) => {
  const user = findUser(req.body?.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const round = vortexRounds.get(user.id);
  if (!round || !round.active) {
    return res.status(400).json({ success: false, message: 'No active round' });
  }

  // The stake is owned by the server: never trust a client-supplied bet.
  const bet = round.lastBet || round.staked;
  const multiplier = vortexMultiplier(round.water, round.earth, round.fire, round.bonus);
  const payout = Number((bet * multiplier).toFixed(2));
  const credit = Math.max(0, Number((payout - round.paidOut).toFixed(2)));

  if (credit > 0) {
    user.balance = +(user.balance + credit).toFixed(2);
    user.totalWon = +(user.totalWon + credit).toFixed(2);
    recordTxn(user, 'win', credit, { game: 'vortex', round: round.roundId, multiplier });
  }

  round.active = false;
  round.water = 0;
  round.earth = 0;
  round.fire = 0;
  round.bonus = 0;
  round.paidOut = 0;
  round.staked = 0;
  round.lastBet = 0;
  user.lastSeenAt = now();
  persist();
  res.json({
    success: true,
    data: { balance: user.balance, credited: credit, multiplier, payout },
  });
});

/** Take a partial payout and keep the round alive. */
app.post('/api/game/vortex/part', (req, res) => {
  const user = findUser(req.body?.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const round = vortexRounds.get(user.id);
  if (!round || !round.active) {
    return res.status(400).json({ success: false, message: 'No active round' });
  }

  // The stake is owned by the server: never trust a client-supplied bet.
  const bet = round.lastBet || round.staked;
  const multiplier = vortexMultiplier(round.water, round.earth, round.fire, round.bonus);
  const payout = Number((bet * multiplier).toFixed(2));
  const part = vortexPartPayout(payout, bet);
  if (part <= 0) return res.status(400).json({ success: false, message: 'Nothing to pay out' });

  user.balance = +(user.balance + part).toFixed(2);
  user.totalWon = +(user.totalWon + part).toFixed(2);
  round.paidOut = +(round.paidOut + part).toFixed(2);
  recordTxn(user, 'win', part, { game: 'vortex', round: round.roundId, part: true });
  user.lastSeenAt = now();
  persist();
  res.json({
    success: true,
    data: { balance: user.balance, part, multiplier, payout },
  });
});
// Receives rich bet details for the admin live-betting feed (does NOT touch balance)
// Admin game controls
app.get('/api/admin/bets', requireAdmin, (req, res) => {
  const game = req.query.game ? String(req.query.game) : '';
  const limit = Math.min(300, Math.max(1, Number(req.query.limit) || 100));
  let list = liveBets;
  if (game) list = list.filter((b) => b.game === game);
  res.json({ success: true, data: list.slice(0, limit) });
});

app.get('/api/admin/game/state', requireAdmin, (_req, res) => {
  const wingo: Record<string, unknown> = {};
  WINGO_MODE_KEYS.forEach((m) => {
    wingo[m] = wingoAdminStateFor(m);
  });
  res.json({
    success: true,
    data: {
      wingo,
aviator: {
        roundId: aviatorEngine.live.roundId,
        currentCrash: aviatorEngine.live.crashTarget,
        forcedNext: aviatorEngine.forcedNext,
        nextCrash: aviatorEngine.nextCrash,
        nextRoundId: aviatorEngine.nextRoundId,
        history: aviatorEngine.history,
        live: aviatorEngine.live,
        phaseRemainingMs: Math.max(0, aviatorEngine.live.phaseEndsAt - Date.now()),
        ageMs: Number.isFinite(new Date(aviatorEngine.live.updatedAt).getTime())
          ? Math.max(0, Date.now() - new Date(aviatorEngine.live.updatedAt).getTime())
          : 0,
      },
      vortex: {
        forcedNext: vortexEngine.forcedNext,
        activeRounds: [...vortexRounds.values()].filter((r) => r.active).length,
        history: vortexHistory,
      },
    },
  });
});

app.post('/api/admin/game/wingo/set', requireAdmin, (req, res) => {
  const mode = String(req.body?.mode || '') as WinGoMode;
  const number = Number(req.body?.number);
  if (!WINGO_MODES[mode]) return res.status(400).json({ success: false, message: 'Invalid mode' });
  if (!Number.isInteger(number) || number < 0 || number > 9) {
    return res.status(400).json({ success: false, message: 'Number must be 0-9' });
  }
  const info = periodInfo(mode, Date.now());
  wingoForced[mode][info.period] = number;
  // Write it straight into the frozen table as well, so the game, the admin
  // console and the settlement all read the very same digit immediately.
  wingoStoredResults(mode)[info.period] = number;
  wingoResultsDirty = true;
  res.json({
    success: true,
    message: `WinGo ${mode} live period ${info.period} set to ${number}`,
    data: { mode, period: info.period, number },
  });
});

app.post('/api/admin/game/wingo/clear', requireAdmin, (req, res) => {
  const mode = String(req.body?.mode || '') as WinGoMode;
  if (!WINGO_MODES[mode]) return res.status(400).json({ success: false, message: 'Invalid mode' });
  const period = wingoClearLive(mode);
  res.json({
    success: true,
    message: `WinGo ${mode} live period back to random`,
    data: { mode, period },
  });
});

app.post('/api/admin/game/aviator/set', requireAdmin, (req, res) => {
  const crashAt = Number(req.body?.crashAt);
  if (!(crashAt >= 1 && crashAt <= 100000)) {
    return res.status(400).json({ success: false, message: 'crashAt must be between 1 and 100000' });
  }
  const value = +crashAt.toFixed(2);
  const live = aviatorEngine.live;
  const alsoLive = req.body?.live === true;

  if (alsoLive) {
    // Steer the round that is in the air right now. A crashed round is already
    // paid out, so it can no longer be changed.
    if (live.state === 'CRASHED') {
      return res.status(400).json({ success: false, message: 'This round has already crashed' });
    }
    live.crashTarget = value;
    if (live.state === 'WAITING') {
      live.multiplier = 1.0;
      live.flightElapsedMs = 0;
      live.curve = [1];
    }
    live.updatedAt = now();
    // Stop any pending pre-decision for the following round from overriding it.
    aviatorEngine.forcedNext = value;
    aviatorEngine.nextCrash = value;
    if (aviatorEngine.nextRoundId == null) aviatorEngine.nextRoundId = live.roundId + 1;
    persist();
    return res.json({
      success: true,
      message: `Live round #${live.roundId} crash set to ${value}x`,
      data: { crashAt: value, roundId: live.roundId, live: true },
    });
  }

  // The lock always belongs to the round that has not taken off yet.
  aviatorEngine.forcedNext = value;
  aviatorEngine.nextCrash = value;
  if (aviatorEngine.nextRoundId == null) aviatorEngine.nextRoundId = live.roundId + 1;

  res.json({
    success: true,
    message: `Period #${aviatorEngine.nextRoundId} crash locked to ${value}x`,
    data: { crashAt: value, roundId: aviatorEngine.nextRoundId, live: false },
  });
});

app.post('/api/admin/game/aviator/clear', requireAdmin, (_req, res) => {
  aviatorEngine.forcedNext = null;
  // Give the upcoming round a fresh random target.
  if (aviatorEngine.nextRoundId != null) {
    aviatorEngine.nextCrash = randomCrashMultiplier();
  }
  res.json({ success: true, message: 'Override cleared', data: {} });
});

app.post('/api/admin/game/vortex/set', requireAdmin, (req, res) => {
  const outcome = String(req.body?.outcome || '') as VortexRoll;
  if (!VORTEX_ROLLS.includes(outcome)) {
    return res
      .status(400)
      .json({ success: false, message: `outcome must be one of ${VORTEX_ROLLS.join(', ')}` });
  }

  // The lock applies to the very next spin a player resolves.
  vortexEngine.forcedNext = outcome;

  res.json({
    success: true,
    message: `Next Vortex spin forced to ${outcome}`,
    data: { outcome },
  });
});

app.post('/api/admin/game/vortex/clear', requireAdmin, (_req, res) => {
  vortexEngine.forcedNext = null;
  res.json({ success: true, message: 'Override cleared', data: {} });
});

/* ------------------------------------------------------------------ */
/* Static SPA (game app build)                                         */
/* ------------------------------------------------------------------ */

const distDir = path.join(process.cwd(), 'dist');
app.use(express.static(distDir));

/* ------------------------------------------------------------------ */
/* Pot-based betting + fair settlement                                  */
/* ------------------------------------------------------------------ */

function periodBets(game: string, mode: string | null, period: string) {
  return store.bets.filter(
    (b) => b.game === game && b.mode === mode && b.period === period
  );
}

/**
 * POST /api/game/bet â€” place a bet.
 * Money is debited immediately and held in the round pot. The pot is only
 * paid out when the round settles, so the house can never lose more than the
 * players actually staked.
 */
app.post('/api/game/bet', (req, res) => {
  const { userId, game, mode, period, selection, amount } = req.body || {};
  const user = findUser(userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (user.banned) return res.status(403).json({ success: false, message: 'Account banned' });

  const amt = Number(amount) || 0;
  if (!amt || amt <= 0) {
    return res.status(400).json({ success: false, message: 'Enter a valid bet amount' });
  }
  if (amt < 10) {
    return res.status(400).json({ success: false, message: 'Minimum bet is 10' });
  }
  if (amt > 100000) {
    return res.status(400).json({ success: false, message: 'Maximum bet is 100000' });
  }
  if (user.balance < amt) {
    return res.status(400).json({ success: false, message: 'Insufficient balance' });
  }
  if (!selection || !period) {
    return res.status(400).json({ success: false, message: 'Invalid bet' });
  }

  const gameKey = String(game || 'wingo');
  const modeKey = mode ? String(mode) : null;
  const per = String(period);

  // SECURITY: a bet is only valid for the period that is running right now.
  // Without this check anyone could POST a bet for an already-finished period,
  // look up its frozen result and win every single time.
  // WINGO_MODES is keyed by mode ('30s', '1m', ...) so the check uses modeKey.
  if (modeKey && Object.prototype.hasOwnProperty.call(WINGO_MODES, modeKey)) {
    const running = periodInfo(modeKey as WinGoMode, Date.now()).period;
    if (per !== running) {
      return res.status(400).json({ success: false, message: 'Betting is closed for this period' });
    }
  }

  const round = periodBets(gameKey, modeKey, per);
  if (round.length >= MAX_ACTIVE_BETS_PER_PERIOD) {
    return res.status(400).json({ success: false, message: 'Round pot is full' });
  }

  // Debit the stake now â€” it sits in the pot until settlement.
  user.balance = +(user.balance - amt).toFixed(2);
  recordTxn(user, 'bet', -amt, { game: gameKey, mode: modeKey, period: per, selection });

  const bet: GameBet = {
    id: genId('BET'),
    userId: user.id,
    phone: user.phone,
    uid: user.uid,
    game: gameKey,
    mode: modeKey,
    period: per,
    selection: String(selection),
    amount: amt,
    status: 'pending',
    payout: 0,
    createdAt: now(),
  };
  store.bets.push(bet);

  const live: LiveBetRecord = {
    id: bet.id,
    userId: user.id,
    phone: user.phone,
    uid: user.uid,
    game: gameKey,
    mode: modeKey,
    period: per,
    selection: bet.selection,
    amount: amt,
    createdAt: bet.createdAt,
  };
  liveBets.unshift(live);
  if (liveBets.length > 800) liveBets.length = 800;

  user.lastSeenAt = now();
  persist();

  res.json({
    success: true,
    data: { bet, balance: user.balance },
  });
});

/**
 * Settle one round and pay the winners. Shared by the /api/game/settle
 * endpoint and the background auto-settler, so both paths behave identically.
 *
 * Idempotent: once a period is settled it is never settled twice, so a
 * duplicated call can never pay a winner twice.
 */
function settleRoundBets(gameKey: string, modeKey: string | null, per: string) {
  const round = periodBets(gameKey, modeKey, per);
  const empty = { settled: true, totalPot: 0, houseFee: 0, houseFeePct: HOUSE_FEE_PCT, prizePool: 0, winners: 0, payouts: [] as { betId: string; userId: string; phone: string; amount: number }[] };
  if (round.length === 0) return empty;
  if (round.every((b) => b.status !== 'pending')) return empty;

  // SECURITY: the outcome is decided by the server, never trusted from the
  // request body. WinGo digits come from the frozen per-period draw; Aviator
  // uses the crash point the engine already recorded for that round.
  let resultNumber: number | null = null;
  let resultMultiplier: number | null = null;
  if (gameKey === 'aviator') {
    const rec = aviatorEngine.history.find((h) => String(h.roundId) === per);
    resultMultiplier = rec ? rec.crashAt : null;
  } else if (modeKey && Object.prototype.hasOwnProperty.call(WINGO_MODES, modeKey)) {
    resultNumber = wingoResultFor(modeKey as WinGoMode, per).number;
  }

  const potPaisa = round.reduce((s, b) => s + toPaisa(b.amount), 0);

  const winnerIdx = round
    .map((b, i) => ({ i, b }))
    .filter(({ b }) => selectionWins(b.selection, gameKey, resultNumber, resultMultiplier))
    .map(({ i, b }) => ({ index: i, betPaisa: toPaisa(b.amount), bet: b }));

  const result = settleRound({
    potPaisa,
    houseFeePct: HOUSE_FEE_PCT,
    winners: winnerIdx.map((w) => ({ index: w.index, betPaisa: w.betPaisa })),
  });

  const payouts: { betId: string; userId: string; phone: string; amount: number }[] = [];

  round.forEach((b) => {
    b.status = selectionWins(b.selection, gameKey, resultNumber, resultMultiplier) ? 'won' : 'lost';
  });

  winnerIdx.forEach((w, idx) => {
    const payoutPaisa = result.payouts[idx] || 0;
    const bet = w.bet;
    bet.payout = toRupees(payoutPaisa);
    const owner = findUser(bet.userId);
    if (owner && payoutPaisa > 0) {
      owner.balance = +(owner.balance + toRupees(payoutPaisa)).toFixed(2);
      owner.totalWon = +(owner.totalWon + toRupees(payoutPaisa)).toFixed(2);
      recordTxn(owner, 'win', toRupees(payoutPaisa), {
        game: gameKey,
        mode: bet.mode,
        period: bet.period,
        selection: bet.selection,
        betId: bet.id,
        stake: bet.amount,
        houseFeePct: HOUSE_FEE_PCT,
      });
    }
    payouts.push({ betId: bet.id, userId: bet.userId, phone: bet.phone, amount: toRupees(payoutPaisa) });
  });

  persist();
  return {
    settled: true,
    totalPot: toRupees(result.totalPot),
    houseFee: toRupees(result.houseFee),
    houseFeePct: HOUSE_FEE_PCT,
    prizePool: toRupees(result.prizePool),
    winners: payouts.length,
    payouts,
  };
}

/**
 * Background auto-settler.
 *
 * The client can never be trusted to settle a round, so the server settles
 * every WinGo period on its own as soon as that period has ended. Without this
 * a player who closes the app would have their stake debited and never paid.
 */
function startWingoAutoSettle() {
  const run = () => {
    try {
      const nowPeriod: Record<string, string> = {};
      WINGO_MODE_KEYS.forEach((m) => {
        nowPeriod[m] = periodInfo(m, Date.now()).period;
      });
      const stale = new Set<string>();
      for (const b of store.bets) {
        if (b.status !== 'pending') continue;
        if (b.game !== 'wingo' || !b.mode) continue;
        const cur = nowPeriod[b.mode];
        // Period ids are fixed width, so this is a chronological comparison.
        if (cur && b.period < cur) stale.add(`${b.mode}|${b.period}`);
      }
      stale.forEach((key) => {
        const [mode, period] = key.split('|');
        settleRoundBets('wingo', mode, period);
      });
    } catch (err) {
      console.error('Auto-settle failed:', err);
    }
  };
  run();
  setInterval(run, 2000).unref?.();
}

/**
 * POST /api/game/settle - settle a round and pay the winners.
 */
app.post('/api/game/settle', (req, res) => {
  const { game, mode, period } = req.body || {};
  const gameKey = String(game || 'wingo');
  const modeKey = mode ? String(mode) : null;
  const per = String(period);
  if (!per) return res.status(400).json({ success: false, message: 'period is required' });
  res.json({ success: true, data: settleRoundBets(gameKey, modeKey, per) });
});

/** GET /api/game/settlement - what the round paid out (for the UI). */
app.get('/api/game/settlement', (req, res) => {
  const { game, mode, period, userId } = req.query;
  const gameKey = String(game || 'wingo');
  const modeKey = mode ? String(mode) : null;
  const per = String(period || '');
  const round = periodBets(gameKey, modeKey, per);
  const mine = userId
    ? round.filter((b) => b.userId === findUser(String(userId))?.id || b.phone === String(userId))
    : round;

  const potPaisa = round.reduce((s, b) => s + toPaisa(b.amount), 0);
  const settled = round.length > 0 && round.every((b) => b.status !== 'pending');
  const winningStakePaisa = round
    .filter((b) => b.status === 'won')
    .reduce((s, b) => s + toPaisa(b.amount), 0);

  res.json({
    success: true,
    data: {
      settled,
      totalBets: round.length,
      totalPot: toRupees(potPaisa),
      myBets: mine.map((b) => ({
        selection: b.selection,
        amount: b.amount,
        status: b.status,
        payout: b.payout,
      })),
      winningStake: toRupees(winningStakePaisa),
    },
  });
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distDir, 'index.html'), (err) => {
    if (err) next();
  });
});

initStore().finally(() => {
  // The Aviator clock starts with the server, so rounds keep running even
  // when no player has the page open.
  startAviatorClock();
  // Frozen WinGo draws are flushed to storage, and finished periods are settled
  // on their own, so results and payouts survive restarts and closed tabs.
  startWingoResultFlush();
  startWingoAutoSettle();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
