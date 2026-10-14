import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createClient } from '@libsql/client';
import {
  WINGO_MODES,
  WINGO_MODE_KEYS,
  periodInfo,
  formatPeriodId,
  deterministicDigit,
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
const adminSessions = new Map<string, number>();
const ONLINE_WINDOW_MS = 60 * 1000;

const UPI_ID = process.env.UPI_ID || '9125540378@fam';
const UPI_NAME = process.env.UPI_NAME || 'XG WIN 99';
const UPI_QR_URL = process.env.UPI_QR_URL || 'https://kommodo.ai/i/J2sr6AXOgBW8G8Ap2z9u';
const WELCOME_BONUS = Number(process.env.WELCOME_BONUS) || 0;

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
  userId: string;
  amount: number;
  method: string;
  address: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface Store {
  users: User[];
  transactions: Txn[];
  deposits: Deposit[];
  withdrawals: Withdrawal[];
}

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

const store: Store = { users: [], transactions: [], deposits: [], withdrawals: [] };

/* Cloud database (Turso / libSQL) — enabled when env vars are present. */
/* Falls back to a local JSON file so local development keeps working.   */

type SqlClient = {
  execute: (arg: string | Record<string, any>) => Promise<{ rows: any[] }>;
};

let db: SqlClient | null = null;

function initDb(): SqlClient | null {
  if (db) return db;
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) return null;
  try {
    db = createClient({ url, authToken: token }) as unknown as SqlClient;
    console.log('Storage: cloud database (Turso/libSQL)');
    return db;
  } catch (err) {
    console.error('Cloud storage unavailable, falling back to local file:', err);
    db = null;
    return null;
  }
}

async function dbLoad() {
  if (!db) return false;
  try {
    await db.execute(
      'CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT)'
    );
    const res = await db.execute('SELECT data FROM app_state WHERE id = 1');
    const row = res.rows && res.rows[0];
    if (!row || !row.data) {
      console.log('Storage: cloud database ready (empty)');
      return false;
    }
    const parsed = JSON.parse(String(row.data));
    store.users = parsed.users || [];
    store.transactions = parsed.transactions || [];
    store.deposits = parsed.deposits || [];
    store.withdrawals = parsed.withdrawals || [];
    console.log(
      `Storage: loaded ${store.users.length} users, ${store.transactions.length} transactions from cloud`
    );
    return true;
  } catch (err) {
    console.error('Failed to load from cloud storage:', err);
    return false;
  }
}

async function dbSave() {
  if (!db) return;
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
    const loaded = await dbLoad();
    if (loaded) return;
    // Cloud empty or unreachable — fall back to local file so the app still has data
    loadStoreFromFile();
    return;
  }
  loadStoreFromFile();
  console.log('Storage: local file (data/store.json)');
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
  res.json({ success: true, message: 'API is running' });
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
  const t = String(type || 'bet') as Txn['type'];

  if (t === 'bet') {
    user.balance = Math.max(0, +(user.balance - Math.abs(amt)).toFixed(2));
    user.totalBets += 1;
    user.totalWagered = +(user.totalWagered + Math.abs(amt)).toFixed(2);
  } else if (t === 'win' || t === 'bonus' || t === 'deposit') {
    user.balance = +(user.balance + Math.abs(amt)).toFixed(2);
    if (t === 'win') user.totalWon = +(user.totalWon + Math.abs(amt)).toFixed(2);
  } else {
    user.balance = +(user.balance + amt).toFixed(2);
  }
  user.lastSeenAt = now();
  const txn = recordTxn(user, t, amt, meta);
  persist();
  res.json({ success: true, data: { balance: user.balance, txn } });
});

app.post('/api/user/withdraw', (req, res) => {
  const { userId, amount, method, address } = req.body;
  const user = findUser(userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const amt = Number(amount) || 0;
  if (amt < 100) return res.status(400).json({ success: false, message: 'Minimum withdrawal is 100' });
  if (amt > user.balance) return res.status(400).json({ success: false, message: 'Insufficient balance' });

  user.balance = +(user.balance - amt).toFixed(2);
  const w: Withdrawal = {
    id: genId('WDR'),
    userId: user.id,
    amount: amt,
    method: method || 'upi',
    address: address || '',
    status: 'pending',
    createdAt: now(),
    updatedAt: now(),
  };
  store.withdrawals.push(w);
  recordTxn(user, 'withdraw', -amt, { withdrawalId: w.id });
  persist();
  res.json({ success: true, data: { withdrawalId: w.id, balance: user.balance } });
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
/* Admin auth middleware                                               */
/* ------------------------------------------------------------------ */

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const key = (req.query.key as string) || req.body.adminKey || req.header('x-admin-key') || '';
  const bearer = (req.header('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  const candidate = bearer || key;

  // Session token issued by POST /api/admin/login
  const expiry = adminSessions.get(candidate);
  if (expiry && expiry > Date.now()) return next();

  // Legacy single-key access stays supported
  if (key && key === ADMIN_KEY) return next();

  return res.status(401).json({ success: false, message: 'Unauthorized' });
}

/* ------------------------------------------------------------------ */
/* Admin APIs                                                          */
/* ------------------------------------------------------------------ */

app.post('/api/admin/login', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  const userOk =
    username.length > 0 &&
    crypto.timingSafeEqual(
      Buffer.from(crypto.createHash('sha256').update(username).digest()),
      Buffer.from(crypto.createHash('sha256').update(ADMIN_USERNAME).digest())
    );
  const passOk =
    password.length > 0 &&
    crypto.timingSafeEqual(
      Buffer.from(crypto.createHash('sha256').update(password).digest()),
      Buffer.from(crypto.createHash('sha256').update(ADMIN_PASSWORD).digest())
    );

  if (!userOk || !passOk) {
    return res.status(401).json({ success: false, message: 'Invalid username or password' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  adminSessions.set(token, Date.now() + ADMIN_SESSION_TTL_MS);

  res.json({
    success: true,
    data: { token, username: ADMIN_USERNAME, expiresInHours: ADMIN_SESSION_TTL_MS / 3600000 },
  });
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
  const { id } = req.body;
  const w = store.withdrawals.find((x) => x.id === id);
  if (!w) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
  w.status = 'approved';
  w.updatedAt = now();
  persist();
  res.json({ success: true, message: 'Withdrawal marked paid', data: w });
});

app.post('/api/admin/withdraw/reject', requireAdmin, (req, res) => {
  const { id, reason } = req.body;
  const w = store.withdrawals.find((x) => x.id === id);
  if (!w) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
  w.status = 'rejected';
  w.rejectionReason = reason || 'Rejected by admin';
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

const aviatorEngine = {
  roundId: 8942105,
  forcedNext: null as number | null,
  history: [] as { roundId: number; crashAt: number; at: string }[],
};

function randomCrashMultiplier(): number {
  const r = Math.random();
  if (r < 0.04) return 1.0;
  if (r < 0.44) return +(1.06 + Math.random() * 0.93).toFixed(2);
  if (r < 0.68) return +(2.0 + Math.random() * 2.2).toFixed(2);
  if (r < 0.9) return +(4.2 + Math.random() * 7.6).toFixed(2);
  return +(11.8 + Math.random() * 36.7).toFixed(2);
}

function wingoResultFor(mode: WinGoMode, period: string): WinGoResult {
  const forced = wingoForced[mode][period];
  const num = typeof forced === 'number' ? forced : deterministicDigit(period);
  return outcomeForNumber(period, num);
}

function wingoStateFor(mode: WinGoMode) {
  const info = periodInfo(mode, Date.now());
  const forced = wingoForced[mode][info.period];
  const nextDigit = typeof forced === 'number' ? forced : deterministicDigit(info.period);
  const history: WinGoResult[] = [];
  for (let i = 1; i <= 50; i++) {
    history.push(wingoResultFor(mode, formatPeriodId(mode, info.counter - i)));
  }
  return {
    mode,
    period: info.period,
    counter: info.counter,
    timeLeft: info.timeLeft,
    duration: info.duration,
    forced: typeof forced === 'number' ? { period: info.period, number: forced } : null,
    nextResult: outcomeForNumber(info.period, nextDigit),
    history,
  };
}

// Public game state
app.get('/api/game/wingo/state', (req, res) => {
  const mode = String(req.query.mode || '30s') as WinGoMode;
  if (!WINGO_MODES[mode]) return res.status(400).json({ success: false, message: 'Invalid mode' });
  res.json({ success: true, data: wingoStateFor(mode) });
});

app.get('/api/game/wingo/state/all', (_req, res) => {
  const data: Record<string, unknown> = {};
  WINGO_MODE_KEYS.forEach((m) => {
    data[m] = wingoStateFor(m);
  });
  res.json({ success: true, data });
});

app.get('/api/game/wingo/result', (req, res) => {
  const mode = String(req.query.mode || '30s') as WinGoMode;
  const period = String(req.query.period || '');
  if (!WINGO_MODES[mode] || !period) {
    return res.status(400).json({ success: false, message: 'Invalid request' });
  }
  res.json({ success: true, data: wingoResultFor(mode, period) });
});

app.get('/api/game/aviator/next', (_req, res) => {
  const crashAt =
    aviatorEngine.forcedNext != null ? aviatorEngine.forcedNext : randomCrashMultiplier();
  aviatorEngine.forcedNext = null;
  aviatorEngine.roundId += 1;
  aviatorEngine.history.unshift({ roundId: aviatorEngine.roundId, crashAt, at: now() });
  aviatorEngine.history = aviatorEngine.history.slice(0, 50);
  res.json({ success: true, data: { roundId: aviatorEngine.roundId, crashAt } });
});

app.get('/api/game/aviator/state', (_req, res) => {
  res.json({
    success: true,
    data: {
      roundId: aviatorEngine.roundId,
      forcedNext: aviatorEngine.forcedNext,
      history: aviatorEngine.history,
    },
  });
});

// Receives rich bet details for the admin live-betting feed (does NOT touch balance)
app.post('/api/game/bet', (req, res) => {
  const { userId, game, mode, period, selection, amount } = req.body || {};
  const user = findUser(userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const bet: LiveBetRecord = {
    id: genId('BET'),
    userId: user.id,
    phone: user.phone,
    uid: user.uid,
    game: String(game || 'unknown'),
    mode: mode ? String(mode) : null,
    period: period ? String(period) : null,
    selection: selection ? String(selection) : null,
    amount: Number(amount) || 0,
    createdAt: now(),
  };
  liveBets.unshift(bet);
  if (liveBets.length > 800) liveBets.length = 800;
  user.lastSeenAt = now();
  res.json({ success: true, data: bet });
});

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
    wingo[m] = wingoStateFor(m);
  });
  res.json({
    success: true,
    data: {
      wingo,
      aviator: {
        roundId: aviatorEngine.roundId,
        forcedNext: aviatorEngine.forcedNext,
        history: aviatorEngine.history,
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
  res.json({
    success: true,
    message: `Next WinGo ${mode} result locked to ${number}`,
    data: { mode, period: info.period, number },
  });
});

app.post('/api/admin/game/wingo/clear', requireAdmin, (req, res) => {
  const mode = String(req.body?.mode || '') as WinGoMode;
  if (!WINGO_MODES[mode]) return res.status(400).json({ success: false, message: 'Invalid mode' });
  const info = periodInfo(mode, Date.now());
  delete wingoForced[mode][info.period];
  res.json({ success: true, message: 'Override cleared', data: { mode, period: info.period } });
});

app.post('/api/admin/game/aviator/set', requireAdmin, (req, res) => {
  const crashAt = Number(req.body?.crashAt);
  if (!(crashAt >= 1 && crashAt <= 100000)) {
    return res.status(400).json({ success: false, message: 'crashAt must be between 1 and 100000' });
  }
  aviatorEngine.forcedNext = +crashAt.toFixed(2);
  res.json({
    success: true,
    message: `Next Aviator crash locked to ${aviatorEngine.forcedNext}x`,
    data: { crashAt: aviatorEngine.forcedNext },
  });
});

app.post('/api/admin/game/aviator/clear', requireAdmin, (_req, res) => {
  aviatorEngine.forcedNext = null;
  res.json({ success: true, message: 'Override cleared', data: {} });
});

/* ------------------------------------------------------------------ */
/* Static SPA (game app build)                                         */
/* ------------------------------------------------------------------ */

const distDir = path.join(process.cwd(), 'dist');
app.use(express.static(distDir));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distDir, 'index.html'), (err) => {
    if (err) next();
  });
});

initStore().finally(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
