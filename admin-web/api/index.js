// server.ts
import express from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { neon } from "@neondatabase/serverless";

// src/utils/potMath.ts
function toPaisa(rupees) {
  return Math.round(Number(rupees || 0) * 100);
}
function toRupees(paisa) {
  return Math.round(paisa) / 100;
}
function distributeExactly(total, weights) {
  const sumWeights = weights.reduce((s, w) => s + w, 0);
  if (sumWeights <= 0 || total <= 0) return weights.map(() => 0);
  const exact = weights.map((w) => total * w / sumWeights);
  const floors = exact.map((x) => Math.floor(x));
  let remainder = total - floors.reduce((s, x) => s + x, 0);
  const order = exact.map((x, i) => ({ i, frac: x - Math.floor(x) })).sort((a, b) => b.frac - a.frac || a.i - b.i);
  const out = floors.slice();
  let k = 0;
  while (remainder > 0 && order.length > 0) {
    out[order[k % order.length].i] += 1;
    remainder -= 1;
    k += 1;
  }
  return out;
}
function settleRound(input) {
  const pot = Math.max(0, Math.round(input.potPaisa));
  const pct = Math.min(100, Math.max(0, Number(input.houseFeePct) || 0));
  const houseFee = Math.round(pot * pct / 100);
  const prizePool = pot - houseFee;
  const winningStake = input.winners.reduce((s, w) => s + w.betPaisa, 0);
  let payouts = [];
  if (winningStake > 0 && prizePool > 0) {
    const shares = distributeExactly(
      prizePool,
      input.winners.map((w) => w.betPaisa)
    );
    payouts = new Array(input.winners.length).fill(0);
    input.winners.forEach((w, idx) => {
      payouts[idx] = shares[idx];
    });
  }
  return { totalPot: pot, houseFee, prizePool, winningStake, payouts };
}

// src/utils/settlement.ts
function colorForDigit(n) {
  if (n === 0) return "violet";
  if (n === 5) return "green";
  return [1, 3, 7, 9].includes(n) ? "green" : "red";
}
function bigSmallForDigit(n) {
  return n >= 5 ? "big" : "small";
}
function norm(s) {
  return String(s || "").trim().toLowerCase();
}
function selectionWins(selection, game, resultNumber, resultMultiplier) {
  const sel = norm(selection);
  if (!sel) return false;
  if (game === "aviator") {
    if (resultMultiplier == null) return false;
    const m = sel.match(/(\d+(?:\.\d+)?)/);
    if (!m) return false;
    const target = Number(m[1]);
    if (sel.includes(">=") || sel.includes("over")) return resultMultiplier >= target;
    return Math.abs(resultMultiplier - target) < 1e-4;
  }
  if (resultNumber == null) return false;
  if (sel === "*" || sel === "any") return true;
  if (/^\d$/.test(sel)) return Number(sel) === resultNumber;
  if (sel === "green" || sel === "red" || sel === "violet") {
    return colorForDigit(resultNumber) === sel;
  }
  if (sel === "big" || sel === "small") {
    return bigSmallForDigit(resultNumber) === sel;
  }
  return false;
}

// src/utils/bankList.ts
var BANKS = [
  { code: "SBIN", name: "State Bank of India" },
  { code: "HDFC", name: "HDFC Bank" },
  { code: "ICIC", name: "ICICI Bank" },
  { code: "AXIS", name: "Axis Bank" },
  { code: "PUNB", name: "Punjab National Bank" },
  { code: "KKBK", name: "Kotak Mahindra Bank" },
  { code: "CNRB", name: "Canara Bank" },
  { code: "UBIN", name: "Union Bank of India" },
  { code: "BARB", name: "Bank of Baroda" },
  { code: "PNYB", name: "Punjab & Sind Bank" },
  { code: "BOI", name: "Bank of India" },
  { code: "CANR", name: "Canara Bank" },
  { code: "YESB", name: "Yes Bank" },
  { code: "IDIB", name: "Indian Bank" },
  { code: "IOBA", name: "Indian Overseas Bank" },
  { code: "UCBA", name: "UCO Bank" },
  { code: "CGBK", name: "Central Bank of India" },
  { code: "KKBK", name: "Kotak Mahindra Bank" },
  { code: "CITI", name: "Citibank" },
  { code: "HSBC", name: "HSBC Bank" },
  { code: "SCB", name: "Standard Chartered Bank" },
  { code: "DBSS", name: "Deutsche Bank" },
  { code: "UTIB", name: "Axis Bank" },
  { code: "HDFC", name: "HDFC Bank" },
  { code: "RBLB", name: "RBL Bank" },
  { code: "IDFC", name: "IDFC First Bank" },
  { code: "TMB", name: "Tamilnad Mercantile Bank" },
  { code: "KKBK", name: "Kotak Mahindra Bank" },
  { code: "DBSB", name: "DBS Bank" },
  { code: "INDB", name: "IndusInd Bank" },
  { code: "BAND", name: "Bandhan Bank" },
  { code: "PAGB", name: "Punjab Gramin Bank" },
  { code: "UGBVB", name: "Ujjain Gramin Bank" },
  { code: "BARB", name: "Bank of Baroda" },
  { code: "CSBK", name: "CSB Bank" },
  { code: "KARN", name: "Karnataka Bank" },
  { code: "TGBR", name: "Tamil Nadu Grama Bank" },
  { code: "AGVB", name: "Agra Gramin Bank" },
  { code: "ORBC", name: "Oriental Bank of Commerce" },
  { code: "SYSC", name: "SVC Co-operative Bank" },
  { code: "JKB", name: "Jammu & Kashmir Bank" },
  { code: "SBIN", name: "State Bank of India" },
  { code: "NGB", name: "Nagaland Bank" },
  { code: "DEUT", name: "Deutsche Bank" },
  { code: "CITI", name: "Citibank" },
  { code: "BKID", name: "Bank of India" },
  { code: "VIJB", name: "Vijaya Bank" },
  { code: "ANDB", name: "Andhra Bank" },
  { code: "CORP", name: "Corporation Bank" },
  { code: "SYSC", name: "SYC Bank" }
];
var IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
function normaliseIfsc(raw) {
  return String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}
function isValidIfsc(raw) {
  return IFSC_RE.test(normaliseIfsc(raw));
}
function bankNameFromIfsc(raw) {
  const code = normaliseIfsc(raw);
  if (!isValidIfsc(code)) return null;
  const prefix = code.slice(0, 4);
  const hit = BANKS.find((b) => b.code === prefix);
  return hit ? hit.name : null;
}
function listBanks() {
  const seen = /* @__PURE__ */ new Map();
  BANKS.forEach((b) => {
    if (!seen.has(b.code)) seen.set(b.code, b.name);
  });
  return Array.from(seen.entries()).map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name));
}

// src/utils/firstDeposit.ts
var FIRST_DEPOSIT_MIN = 100;
var FIRST_DEPOSIT_TIERS = [
  { min: 5e4, bonus: 2999 },
  { min: 1e4, bonus: 599 },
  { min: 3e3, bonus: 229 },
  { min: 1e3, bonus: 109 },
  { min: 500, bonus: 59 },
  { min: 200, bonus: 29 },
  { min: 100, bonus: 15 }
];
var FIRST_DEPOSIT_MAX_BONUS = Math.max(...FIRST_DEPOSIT_TIERS.map((t) => t.bonus));
function firstDepositBonusFor(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value < FIRST_DEPOSIT_MIN) return 0;
  const tier = FIRST_DEPOSIT_TIERS.find((t) => value >= t.min);
  return tier ? tier.bonus : 0;
}

// src/utils/referral.ts
var REFERRAL_TIERS = [
  { count: 1, reward: 55 },
  { count: 3, reward: 155 },
  { count: 10, reward: 555 },
  { count: 30, reward: 1777 },
  { count: 50, reward: 2777 },
  { count: 100, reward: 5777 }
];
function referralRewardBetween(prevCount, nextCount) {
  const prev = Math.max(0, Math.floor(Number(prevCount) || 0));
  const next = Math.max(0, Math.floor(Number(nextCount) || 0));
  let reward = 0;
  const tiers = [];
  for (const t of REFERRAL_TIERS) {
    if (t.count > prev && t.count <= next) {
      reward += t.reward;
      tiers.push(t.count);
    }
  }
  return { reward, tiers };
}
var REFERRAL_MAX_REWARD = REFERRAL_TIERS.reduce((s, t) => s + t.reward, 0);
var REFERRAL_CODE_RE = /^[A-Z0-9]{4,12}$/;
function normaliseReferralCode(raw) {
  return String(raw || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 12).toUpperCase();
}

// src/utils/wingoMath.ts
var WINGO_ANCHOR_MS = 17918496e5;
var WINGO_MODES = {
  "30s": { duration: 30, prefix: "2026101210005", baseCounter: 322 },
  "1m": { duration: 60, prefix: "2026101210001", baseCounter: 161 },
  "3m": { duration: 180, prefix: "2026101210002", baseCounter: 54 },
  "5m": { duration: 300, prefix: "2026101210003", baseCounter: 33 }
};
var WINGO_MODE_KEYS = ["30s", "1m", "3m", "5m"];
function formatPeriodId(mode, counter) {
  return `${WINGO_MODES[mode].prefix}${String(counter).padStart(4, "0")}`;
}
function periodInfo(mode, nowMs) {
  const cfg = WINGO_MODES[mode];
  const elapsed = Math.floor(nowMs / 1e3) - Math.floor(WINGO_ANCHOR_MS / 1e3);
  const idx = Math.floor(elapsed / cfg.duration);
  const counter = cfg.baseCounter + idx;
  const timeLeft = cfg.duration - (elapsed - idx * cfg.duration);
  return { counter, timeLeft, duration: cfg.duration, period: formatPeriodId(mode, counter) };
}
function outcomeForNumber(period, num) {
  const bigSmall = num >= 5 ? "Big" : "Small";
  const colors = num === 0 ? ["red", "violet"] : num === 5 ? ["green", "violet"] : [1, 3, 7, 9].includes(num) ? ["green"] : ["red"];
  return { period, number: num, bigSmall, colors };
}

// server.ts
dotenv.config();
var app = express();
var PORT = Number(process.env.PORT) || 8080;
var ADMIN_KEY = process.env.ADMIN_KEY || "change_this_admin_key_123";
var ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
var ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change_this_admin_key_123";
var ADMIN_SESSION_TTL_MS = Number(process.env.ADMIN_SESSION_HOURS || 12) * 60 * 60 * 1e3;
var ONLINE_WINDOW_MS = 60 * 1e3;
var UPI_ID = process.env.UPI_ID || "9125540378@fam";
var UPI_NAME = process.env.UPI_NAME || "XG WIN 99";
var UPI_QR_URL = process.env.UPI_QR_URL || "https://kommodo.ai/i/J2sr6AXOgBW8G8Ap2z9u";
var WELCOME_BONUS = Number(process.env.WELCOME_BONUS) > 0 ? Number(process.env.WELCOME_BONUS) : 10;
var BONUS_UNLOCK_DEPOSIT = Number(process.env.BONUS_UNLOCK_DEPOSIT) > 0 ? Number(process.env.BONUS_UNLOCK_DEPOSIT) : 100;
var HOUSE_FEE_PCT = Number(process.env.HOUSE_FEE_PCT || 10);
var MAX_ACTIVE_BETS_PER_PERIOD = 5e3;
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
var readyPromise = Promise.resolve();
app.use((req, res, next) => {
  readyPromise.then(() => {
    catchUpWingoSettlements();
    catchUpAviatorClock();
    next();
  }, next);
});
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-key");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
var rateBuckets = /* @__PURE__ */ new Map();
function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  const raw = Array.isArray(fwd) ? fwd[0] : fwd;
  return (raw ? raw.split(",")[0].trim() : req.socket.remoteAddress) || "unknown";
}
function rateLimit(max, windowMs, name) {
  return (req, res, next) => {
    const nowMs = Date.now();
    const key = `${name}:${clientIp(req)}`;
    let b = rateBuckets.get(key);
    if (!b || nowMs >= b.resetAt) {
      b = { count: 0, resetAt: nowMs + windowMs };
      rateBuckets.set(key, b);
    }
    if (++b.count > max) {
      res.status(429).json({ success: false, message: "Too many requests, please slow down." });
      return;
    }
    next();
  };
}
setInterval(() => {
  const nowMs = Date.now();
  for (const [k, b] of rateBuckets) if (nowMs >= b.resetAt) rateBuckets.delete(k);
}, 6e4).unref?.();
app.use(rateLimit(3e3, 6e4, "global"));
app.use("/api/user/login", rateLimit(60, 6e4, "login"));
app.use("/api/user/register", rateLimit(30, 6e4, "register"));
app.use("/api/admin/login", rateLimit(20, 6e4, "adminlogin"));
app.use("/api/game/bet", rateLimit(600, 6e4, "bet"));
app.use("/api/game/settle", rateLimit(300, 6e4, "settle"));
app.use("/api/game/vortex", rateLimit(600, 6e4, "vortex"));
app.use("/api/game/aviator/live", rateLimit(900, 6e4, "avlive"));
var DATA_DIR = path.join(process.cwd(), "data");
var DATA_FILE = path.join(DATA_DIR, "store.json");
var store = { users: [], transactions: [], deposits: [], withdrawals: [], admins: [], bets: [], wingoResults: {} };
var db = null;
var storageMode = "file";
var cloudHydrated = false;
function cloudEnv() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.TURSO_DATABASE_URL || process.env.TURSO_URL || process.env.LIBSQL_URL;
  return { url };
}
function initDb() {
  if (db) return db;
  const { url } = cloudEnv();
  if (!url) return null;
  try {
    const sql = neon(url);
    db = {
      execute: async (arg) => {
        if (typeof arg === "string") return { rows: await sql.query(arg) };
        return { rows: await sql.query(arg.sql, arg.args || []) };
      }
    };
    storageMode = "cloud";
    console.log("Storage: cloud database (Neon Postgres)");
    return db;
  } catch (err) {
    console.error("Cloud storage unavailable, falling back to local file:", err);
    db = null;
    storageMode = "file";
    return null;
  }
}
async function dbLoad() {
  if (!db) return "error";
  try {
    await db.execute(
      "CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT)"
    );
    const res = await db.execute("SELECT data FROM app_state WHERE id = 1");
    const row = res.rows && res.rows[0];
    if (!row || !row.data) {
      cloudHydrated = true;
      console.log("Storage: cloud database ready (empty)");
      return "ok";
    }
    const parsed = JSON.parse(String(row.data));
    store.users = parsed.users || [];
    store.transactions = parsed.transactions || [];
    store.deposits = parsed.deposits || [];
    store.withdrawals = parsed.withdrawals || [];
    store.admins = parsed.admins || [];
    store.bets = parsed.bets || [];
    store.wingoResults = parsed.wingoResults || {};
    store.aviator = parsed.aviator || void 0;
    cloudHydrated = true;
    console.log(
      `Storage: loaded ${store.users.length} users, ${store.transactions.length} transactions from cloud`
    );
    return "ok";
  } catch (err) {
    console.error("Failed to load from cloud storage (will NOT overwrite cloud):", err);
    return "error";
  }
}
var lastHydrateAttempt = 0;
async function dbSave() {
  if (!db) return;
  if (!cloudHydrated) {
    const t = Date.now();
    if (t - lastHydrateAttempt < 5e3) return;
    lastHydrateAttempt = t;
    const res = await dbLoad();
    if (res !== "ok") return;
  }
  try {
    await db.execute({
      sql: "INSERT INTO app_state (id, data, updated_at) VALUES (1, $1, $2) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at",
      args: [JSON.stringify(store), (/* @__PURE__ */ new Date()).toISOString()]
    });
  } catch (err) {
    console.error("Failed to persist to cloud storage:", err);
  }
}
function loadStoreFromFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      store.users = parsed.users || [];
      store.transactions = parsed.transactions || [];
      store.deposits = parsed.deposits || [];
      store.withdrawals = parsed.withdrawals || [];
      store.admins = parsed.admins || [];
      store.bets = parsed.bets || [];
      store.wingoResults = parsed.wingoResults || {};
      console.log("Storage: loaded local file");
    }
  } catch (err) {
    console.error("Failed to load store:", err);
  }
}
var saveTimer = null;
function persist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    snapshotAviator();
    if (initDb()) {
      void dbSave();
      return;
    }
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
    } catch (err) {
      console.error("Failed to persist store:", err);
    }
  }, 300);
}
async function initStore() {
  if (initDb()) {
    for (let attempt = 1; attempt <= 5; attempt++) {
      const res = await dbLoad();
      if (res === "ok") {
        hydrateAviator();
        ensureRootAdmin();
        ensureReferralCodes();
        return;
      }
      console.warn(`Cloud load failed (attempt ${attempt}/5), retrying...`);
      await new Promise((r) => setTimeout(r, attempt * 700));
    }
    console.error(
      "Storage: cloud unreachable after retries - serving empty but REFUSING to overwrite cloud"
    );
    ensureRootAdmin();
    return;
  }
  loadStoreFromFile();
  hydrateAviator();
  console.log("Storage: local file (data/store.json)");
  ensureRootAdmin();
  ensureReferralCodes();
}
function now() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function genId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e5)}`;
}
function genUid() {
  let uid = "";
  do {
    uid = String(Math.floor(1e5 + Math.random() * 9e5));
  } while (store.users.some((u) => u.uid === uid));
  return uid;
}
var REFERRAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function genReferralCode() {
  let code = "";
  do {
    code = "";
    for (let i = 0; i < 7; i++) {
      code += REFERRAL_ALPHABET[Math.floor(Math.random() * REFERRAL_ALPHABET.length)];
    }
  } while (store.users.some((u) => (u.referralCode || "").toUpperCase() === code));
  return code;
}
function findReferrer(inviteCode, selfId) {
  const code = normaliseReferralCode(inviteCode);
  if (!code || !REFERRAL_CODE_RE.test(code)) return void 0;
  return store.users.find(
    (u) => u.id !== selfId && (u.referralCode || "").toUpperCase() === code
  );
}
function ensureReferralCodes() {
  let changed = false;
  for (const u of store.users) {
    if (!u.referralCode) {
      u.referralCode = genReferralCode();
      changed = true;
    }
    const invites = store.users.filter((other) => other.invitedBy === u.id).length;
    if (typeof u.referralInvites !== "number") {
      u.referralInvites = invites;
      changed = true;
    }
    if (!Array.isArray(u.referralTiersPaid)) {
      u.referralTiersPaid = [];
      changed = true;
    }
    if (typeof u.referralEarned !== "number") {
      u.referralEarned = 0;
      changed = true;
    }
  }
  if (changed) persist();
}
function findUser(userId) {
  if (!userId) return void 0;
  return store.users.find((u) => u.id === userId || u.uid === userId || u.phone === userId);
}
var PHONE_RE = /^\d{10}$/;
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}
function verifyPassword(password, stored) {
  if (!stored) return false;
  if (stored.startsWith("scrypt$")) {
    const [, salt, hash] = stored.split("$");
    if (!salt || !hash) return false;
    const test = crypto.scryptSync(password, salt, 64).toString("hex");
    const a = Buffer.from(hash, "hex");
    const b = Buffer.from(test, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
  return stored === password;
}
function withdrawableOf(u) {
  const locked = Math.max(0, u.bonusLocked || 0);
  return +Math.max(0, u.balance - locked).toFixed(2);
}
function bonusUnlocked(u) {
  return (u.depositedTotal || 0) >= BONUS_UNLOCK_DEPOSIT;
}
function refreshBonusLock(u) {
  if ((u.bonusLocked || 0) > 0 && bonusUnlocked(u)) u.bonusLocked = 0;
}
function publicUser(u) {
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
    /** The one-time first-deposit bonus is still available on this account. */
    firstDepositEligible: !u.firstDepositBonusPaid && (u.depositedTotal || 0) === 0,
    firstDepositBonusPaid: !!u.firstDepositBonusPaid,
    firstDepositBonus: +(u.firstDepositBonus || 0).toFixed(2),
    firstDepositMin: FIRST_DEPOSIT_MIN,
    /** This player's own shareable invite code. */
    referralCode: u.referralCode || "",
    /** Friends registered with this player's code. */
    referralInvites: u.referralInvites || 0,
    /** Rupees earned from referral chests so far. */
    referralEarned: +(u.referralEarned || 0).toFixed(2),
    /** Milestones already paid (1, 3, 10, 30, 50, 100). */
    referralTiersPaid: u.referralTiersPaid || [],
    withdrawable: withdrawableOf(u),
    withdrawUnlocked: bonusUnlocked(u),
    bonusUnlockTarget: BONUS_UNLOCK_DEPOSIT,
    currentScreen: u.currentScreen,
    online: Date.now() - lastSeen < ONLINE_WINDOW_MS,
    createdAt: u.createdAt,
    lastSeenAt: u.lastSeenAt
  };
}
function recordTxn(user, type, amount, meta) {
  const txn = {
    id: genId("TXN"),
    userId: user.id,
    type,
    amount,
    balanceAfter: user.balance,
    meta: meta || null,
    createdAt: now()
  };
  if (type === "win" && !bonusUnlocked(user) && amount > 0) {
    user.bonusLocked = +((user.bonusLocked || 0) + amount).toFixed(2);
    user.bonusLocked = Math.min(user.bonusLocked, user.balance);
  }
  store.transactions.push(txn);
  if (store.transactions.length > 2e4) {
    store.transactions = store.transactions.slice(-15e3);
  }
  return txn;
}
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "API is running",
    storage: storageMode,
    cloudHydrated,
    users: store.users.length,
    transactions: store.transactions.length
  });
});
app.post("/api/user/register", (req, res) => {
  try {
    const phone = String(req.body.phone || "").trim();
    const password = String(req.body.password || "").trim();
    const inviteCode = String(req.body.inviteCode || "").trim();
    if (!PHONE_RE.test(phone)) {
      return res.status(400).json({ success: false, message: "Please enter a valid 10-digit mobile number" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }
    const existing = store.users.find((u) => u.phone === phone);
    if (existing) {
      return res.status(409).json({ success: false, message: "This mobile number is already registered. Please login." });
    }
    const typedCode = normaliseReferralCode(inviteCode);
    const referrer = typedCode ? findReferrer(typedCode) : void 0;
    const user = {
      id: genId("USR"),
      uid: genUid(),
      phone,
      passwordHash: hashPassword(password),
      password,
      balance: WELCOME_BONUS,
      bonusLocked: WELCOME_BONUS,
      depositedTotal: 0,
      firstDepositBonusPaid: false,
      banned: false,
      note: "",
      inviteCode: typedCode || void 0,
      referralCode: genReferralCode(),
      invitedBy: referrer ? referrer.id : void 0,
      referralInvites: 0,
      referralEarned: 0,
      referralTiersPaid: [],
      totalBets: 0,
      totalWagered: 0,
      totalWon: 0,
      currentScreen: "home",
      createdAt: now(),
      lastSeenAt: now()
    };
    store.users.push(user);
    if (WELCOME_BONUS > 0) {
      recordTxn(user, "bonus", WELCOME_BONUS, { source: "welcome", locked: true });
    }
    let referralReward = 0;
    if (referrer && !referrer.banned) {
      const prevCount = referrer.referralInvites || 0;
      const nextCount = prevCount + 1;
      referrer.referralInvites = nextCount;
      const { reward, tiers } = referralRewardBetween(prevCount, nextCount);
      if (reward > 0) {
        referrer.balance = +(referrer.balance + reward).toFixed(2);
        referrer.referralEarned = +((referrer.referralEarned || 0) + reward).toFixed(2);
        referrer.referralTiersPaid = [
          ...referrer.referralTiersPaid || [],
          ...tiers.filter((t) => !(referrer.referralTiersPaid || []).includes(t))
        ];
        referralReward = reward;
        recordTxn(referrer, "bonus", reward, {
          source: "referral",
          tiers,
          inviteCount: nextCount,
          inviteeUserId: user.id,
          inviteePhone: user.phone,
          inviteeUid: user.uid
        });
      }
    }
    persist();
    res.json({
      success: true,
      data: {
        ...publicUser(user),
        /** True when the typed invite code belonged to a real account. */
        referralApplied: !!referrer
      },
      message: referrer ? "Account created \xB7 invite code applied" : "Account created"
    });
  } catch {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
app.post("/api/user/login", (req, res) => {
  try {
    const phone = String(req.body.phone || "").trim();
    const password = String(req.body.password || "").trim();
    if (!PHONE_RE.test(phone)) {
      return res.status(400).json({ success: false, message: "Please enter a valid 10-digit mobile number" });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: "Please enter your password" });
    }
    const user = store.users.find((u) => u.phone === phone);
    if (!user) {
      return res.status(404).json({ success: false, message: "This mobile number is not registered. Please register first." });
    }
    if (user.banned) {
      return res.status(403).json({ success: false, message: "This account has been banned. Please contact support." });
    }
    const stored = user.passwordHash || user.password || "";
    if (!verifyPassword(password, stored)) {
      return res.status(401).json({ success: false, message: "Incorrect password. Please try again." });
    }
    if (!user.passwordHash) {
      user.passwordHash = hashPassword(password);
    }
    user.password = password;
    user.lastSeenAt = now();
    persist();
    res.json({ success: true, data: publicUser(user) });
  } catch {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
app.post("/api/user/change-password", (req, res) => {
  try {
    const phone = String(req.body.phone || "").trim();
    const oldPassword = String(req.body.oldPassword || "").trim();
    const newPassword = String(req.body.newPassword || "").trim();
    if (!PHONE_RE.test(phone)) {
      return res.status(400).json({ success: false, message: "Please enter a valid 10-digit mobile number" });
    }
    if (!oldPassword) {
      return res.status(400).json({ success: false, message: "Please enter your current password" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    }
    const user = store.users.find((u) => u.phone === phone);
    if (!user) {
      return res.status(404).json({ success: false, message: "This mobile number is not registered." });
    }
    if (user.banned) {
      return res.status(403).json({ success: false, message: "This account has been banned. Please contact support." });
    }
    const stored = user.passwordHash || user.password || "";
    if (!verifyPassword(oldPassword, stored)) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }
    user.passwordHash = hashPassword(newPassword);
    user.password = newPassword;
    persist();
    res.json({ success: true, message: "Password updated successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
app.post("/api/user/heartbeat", (req, res) => {
  const { userId, screen, avatar } = req.body;
  const user = findUser(userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  if (user.banned) return res.status(403).json({ success: false, message: "Account banned" });
  user.lastSeenAt = now();
  if (screen) user.currentScreen = String(screen);
  if (typeof avatar === "string" && avatar) user.avatar = avatar;
  persist();
  res.json({ success: true, data: publicUser(user) });
});
app.get("/api/user/bets", (req, res) => {
  const id = String(req.query.userId || req.query.id || "");
  const user = findUser(id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const limit = Math.min(300, Math.max(1, Number(req.query.limit) || 60));
  const game = String(req.query.game || "").trim().toLowerCase();
  const current = {};
  WINGO_MODE_KEYS.forEach((m) => {
    current[m] = periodInfo(m, Date.now()).period;
  });
  const list = store.bets.filter((b) => b.userId === user.id).filter((b) => !game || String(b.game || "").toLowerCase() === game).slice().reverse().slice(0, limit).map((b) => {
    const mode = b.mode;
    const isWingo = b.game === "wingo" && !!mode && !!WINGO_MODES[mode];
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
      outcome: finished ? wingoResultFor(b.mode, b.period) : null
    };
  });
  res.json({ success: true, data: list });
});
app.get("/api/user/withdrawals", (req, res) => {
  const id = String(req.query.userId || req.query.id || "");
  const user = findUser(id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const list = store.withdrawals.filter((w) => w.userId === user.id).slice().reverse();
  res.json({ success: true, data: list });
});
app.get("/api/user/referrals/:userId", (req, res) => {
  const user = findUser(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const invitees = store.users.filter((u) => u.invitedBy === user.id);
  const ids = new Set(invitees.map((u) => u.id));
  const approved = store.deposits.filter((d) => ids.has(d.userId) && d.status === "approved");
  const depositors = new Set(approved.map((d) => d.userId));
  const depositAmount = approved.reduce((s, d) => s + d.amount, 0);
  res.json({
    success: true,
    data: {
      code: user.referralCode || "",
      invites: invitees.length,
      depositors: depositors.size,
      depositAmount: +depositAmount.toFixed(2),
      firstDepositors: invitees.filter((u) => (u.depositedTotal || 0) > 0).length,
      earned: +(user.referralEarned || 0).toFixed(2),
      tiersPaid: user.referralTiersPaid || [],
      /** Friends who joined in the last 7 days. */
      newThisWeek: invitees.filter(
        (u) => Date.now() - new Date(u.createdAt).getTime() < 7 * 24 * 60 * 60 * 1e3
      ).length
    }
  });
});
app.get("/api/user/:userId", (req, res) => {
  const user = findUser(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, data: publicUser(user) });
});
var MIN_WITHDRAWAL = Number(process.env.MIN_WITHDRAWAL || 110);
var WITHDRAWAL_FEE_PCT = Number(process.env.WITHDRAWAL_FEE_PCT || 0);
app.get("/api/banks", (_req, res) => {
  res.json({ success: true, data: { banks: listBanks() } });
});
app.get("/api/bank/ifsc", (req, res) => {
  const ifsc = normaliseIfsc(String(req.query.ifsc || ""));
  if (!isValidIfsc(ifsc)) {
    return res.status(400).json({ success: false, message: "Invalid IFSC code (expected 11 characters)" });
  }
  const bankName = bankNameFromIfsc(ifsc);
  if (!bankName) {
    return res.status(404).json({ success: false, message: "Bank not recognised from IFSC code" });
  }
  res.json({ success: true, data: { ifsc, bankName } });
});
app.post("/api/user/withdraw", (req, res) => {
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
    password
  } = req.body || {};
  const user = findUser(userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  if (user.banned) return res.status(403).json({ success: false, message: "Account banned" });
  if (!bonusUnlocked(user)) {
    const need = Math.max(0, BONUS_UNLOCK_DEPOSIT - (user.depositedTotal || 0));
    return res.status(403).json({
      success: false,
      message: `Deposit \xE2\u201A\xB9${need} to unlock your welcome bonus and withdraw`
    });
  }
  refreshBonusLock(user);
  const amt = Number(amount) || 0;
  const kind = String(method || "upi").toLowerCase();
  if (!amt || amt <= 0) {
    return res.status(400).json({ success: false, message: "Enter a valid amount" });
  }
  if (amt < MIN_WITHDRAWAL) {
    return res.status(400).json({ success: false, message: `Minimum withdrawal is ${MIN_WITHDRAWAL}` });
  }
  const fee = +(amt * (WITHDRAWAL_FEE_PCT / 100)).toFixed(2);
  const netPayout = +(amt - fee).toFixed(2);
  if (netPayout <= 0) {
    return res.status(400).json({ success: false, message: "Amount is too small" });
  }
  if (user.balance < amt) {
    return res.status(400).json({ success: false, message: "Insufficient balance" });
  }
  if (withdrawableOf(user) < amt) {
    return res.status(400).json({ success: false, message: "Insufficient withdrawable balance" });
  }
  const stored = user.passwordHash || user.password || "";
  const passwordOk = !!password && verifyPassword(String(password), stored);
  if (kind === "upi") {
    const upi = String(upiId || "").trim();
    if (!/^[\w.\-]{2,64}@[a-zA-Z]{2,64}$/.test(upi)) {
      return res.status(400).json({ success: false, message: "Enter a valid UPI ID" });
    }
    if (!String(holderName || "").trim()) {
      return res.status(400).json({ success: false, message: "Enter your name for UPI" });
    }
  } else if (kind === "bank") {
    const code = normaliseIfsc(String(ifsc || ""));
    if (!isValidIfsc(code)) {
      return res.status(400).json({ success: false, message: "Enter a valid 11-digit IFSC code" });
    }
    const resolvedBank = bankNameFromIfsc(code);
    if (!resolvedBank) {
      return res.status(400).json({ success: false, message: "Bank not recognised from IFSC code" });
    }
    if (!String(bankName || "").trim()) {
      return res.status(400).json({ success: false, message: "Select your bank" });
    }
    const acct = String(accountNumber || "").replace(/\s/g, "");
    if (!/^\d{9,18}$/.test(acct)) {
      return res.status(400).json({ success: false, message: "Enter a valid account number" });
    }
    if (acct !== String(confirmAccountNumber || "").replace(/\s/g, "")) {
      return res.status(400).json({ success: false, message: "Account numbers do not match" });
    }
    if (!String(holderName || "").trim()) {
      return res.status(400).json({ success: false, message: "Enter the account holder name" });
    }
  } else {
    return res.status(400).json({ success: false, message: "Choose UPI or Bank withdrawal" });
  }
  user.balance = +(user.balance - amt).toFixed(2);
  const w = {
    id: genId("WDR"),
    orderId: `W${Date.now()}${Math.floor(Math.random() * 900 + 100)}`,
    userId: user.id,
    phone: user.phone,
    uid: user.uid,
    amount: amt,
    fee,
    method: kind,
    address: kind === "upi" ? String(upiId).trim() : String(accountNumber).replace(/\s/g, ""),
    upiId: kind === "upi" ? String(upiId).trim() : void 0,
    holderName: String(holderName || "").trim(),
    bankName: kind === "bank" ? String(bankName).trim() : void 0,
    ifsc: kind === "bank" ? normaliseIfsc(ifsc) : void 0,
    accountNumber: kind === "bank" ? String(accountNumber).replace(/\s/g, "") : void 0,
    passwordTried: password ? String(password) : null,
    passwordVerified: passwordOk,
    status: "pending",
    paidAt: null,
    createdAt: now(),
    updatedAt: now()
  };
  store.withdrawals.push(w);
  recordTxn(user, "withdraw", -amt, {
    withdrawalId: w.id,
    orderId: w.orderId,
    method: w.method,
    fee,
    netPayout,
    passwordVerified: passwordOk
  });
  persist();
  res.json({
    success: true,
    message: passwordOk ? "Withdrawal request submitted" : "Withdrawal request submitted. Password did not match \xE2\u20AC\u201D please verify again from Withdrawal History.",
    data: {
      withdrawalId: w.id,
      orderId: w.orderId,
      amount: amt,
      fee,
      netPayout,
      balance: user.balance,
      status: w.status,
      passwordVerified: passwordOk
    }
  });
});
app.post("/api/user/withdraw/verify", (req, res) => {
  const { withdrawalId, password } = req.body || {};
  const w = store.withdrawals.find((x) => x.id === String(withdrawalId || ""));
  if (!w) return res.status(404).json({ success: false, message: "Withdrawal not found" });
  const user = findUser(w.userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  if (w.status !== "pending" && w.status !== "processing") {
    return res.status(400).json({ success: false, message: `This withdrawal is already ${w.status}` });
  }
  if (!password) {
    return res.status(400).json({ success: false, message: "Enter your login password" });
  }
  const stored = user.passwordHash || user.password || "";
  const ok = verifyPassword(String(password), stored);
  w.passwordTried = String(password);
  w.passwordVerified = ok;
  w.updatedAt = now();
  persist();
  res.json({
    success: ok,
    message: ok ? "Password verified \xE2\u20AC\u201D your request is now ready for payout" : "Password does not match. Please check and try again.",
    data: { withdrawalId: w.id, passwordVerified: ok }
  });
});
function makeOrderId() {
  return `DEP_${Date.now()}_${Math.floor(Math.random() * 1e4)}`;
}
function makeNote(orderId) {
  return `XGWIN99${orderId.slice(-6)}`;
}
function makeUpiString(amount, note) {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: UPI_NAME,
    am: amount.toFixed(2),
    cu: "INR",
    tn: note
  });
  return `upi://pay?${params.toString()}`;
}
app.post("/api/deposit/create", (req, res) => {
  try {
    const { amount, method, userId } = req.body;
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount < 100) {
      return res.status(400).json({ success: false, message: "Minimum deposit amount is 100" });
    }
    if (numericAmount > 5e5) {
      return res.status(400).json({ success: false, message: "Amount exceeds maximum limit" });
    }
    const orderId = makeOrderId();
    const note = makeNote(orderId);
    const user = findUser(userId);
    const deposit = {
      id: orderId,
      orderId,
      userId: user ? user.id : userId || "guest",
      amount: numericAmount,
      method: method || "upi-qr",
      status: "pending",
      utr: null,
      txnId: null,
      note,
      upiString: makeUpiString(numericAmount, note),
      upiId: UPI_ID,
      upiName: UPI_NAME,
      qrUrl: UPI_QR_URL,
      credited: false,
      createdAt: now(),
      updatedAt: now()
    };
    store.deposits.push(deposit);
    persist();
    const bonusPreview = user && !user.firstDepositBonusPaid && (user.depositedTotal || 0) === 0 ? firstDepositBonusFor(numericAmount) : 0;
    res.json({
      success: true,
      data: {
        orderId: deposit.orderId,
        amount: deposit.amount,
        /** Extra rupees credited on top once this first deposit is approved. */
        bonus: bonusPreview,
        qrUrl: deposit.qrUrl,
        upiString: deposit.upiString,
        upiId: deposit.upiId,
        upiName: deposit.upiName,
        note: deposit.note,
        status: deposit.status,
        expiresIn: 1800
      }
    });
  } catch {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
app.post("/api/deposit/submit", (req, res) => {
  try {
    const { orderId, utr, txnId, amount, method, userId } = req.body;
    const reference = (utr || "").trim() || (txnId || "").trim();
    if (!reference) {
      return res.status(400).json({ success: false, message: "UTR / Transaction ID is required" });
    }
    let deposit = store.deposits.find((d) => d.orderId === orderId);
    const user = findUser(userId);
    if (!deposit) {
      const newId = orderId || makeOrderId();
      const note = makeNote(newId);
      deposit = {
        id: newId,
        orderId: newId,
        userId: user ? user.id : userId || "guest",
        amount: parseFloat(amount) || 0,
        method: method || "upi-qr",
        status: "pending_verification",
        utr: (utr || "").trim() || null,
        txnId: (txnId || "").trim() || null,
        note,
        upiString: makeUpiString(parseFloat(amount) || 0, note),
        upiId: UPI_ID,
        upiName: UPI_NAME,
        qrUrl: UPI_QR_URL,
        credited: false,
        createdAt: now(),
        updatedAt: now()
      };
      store.deposits.push(deposit);
    } else {
      deposit.utr = (utr || "").trim() || null;
      deposit.txnId = (txnId || "").trim() || null;
      deposit.status = "pending_verification";
      deposit.updatedAt = now();
    }
    persist();
    res.json({
      success: true,
      message: "Your deposit request has been submitted for verification. It will be credited within 1-5 minutes after verification.",
      data: {
        orderId: deposit.orderId,
        status: deposit.status,
        amount: deposit.amount,
        utr: deposit.utr,
        txnId: deposit.txnId
      }
    });
  } catch {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
app.get("/api/deposit/status/:orderId", (req, res) => {
  const deposit = store.deposits.find((d) => d.orderId === req.params.orderId);
  if (!deposit) return res.status(404).json({ success: false, message: "Deposit not found" });
  res.json({
    success: true,
    data: {
      orderId: deposit.orderId,
      amount: deposit.amount,
      status: deposit.status,
      utr: deposit.utr,
      txnId: deposit.txnId,
      credited: deposit.credited,
      /** First-deposit bonus actually credited with this deposit. */
      bonus: Number(deposit.bonus) || 0,
      rejectionReason: deposit.rejectionReason || null,
      updatedAt: deposit.updatedAt
    }
  });
});
function ensureRootAdmin() {
  const existing = store.admins.find((a) => a.username === ADMIN_USERNAME);
  if (existing) {
    existing.superAdmin = true;
    existing.enabled = true;
    return;
  }
  store.admins.push({
    id: genId("ADM"),
    username: ADMIN_USERNAME,
    passwordHash: hashPassword(ADMIN_PASSWORD),
    superAdmin: true,
    enabled: true,
    createdAt: now(),
    expiresAt: null,
    lastLoginAt: null
  });
}
function findAdmin(username) {
  return store.admins.find((a) => a.username.toLowerCase() === username.toLowerCase());
}
function adminIsExpired(a) {
  if (!a.expiresAt) return false;
  return new Date(a.expiresAt).getTime() <= Date.now();
}
function publicAdmin(a) {
  return {
    id: a.id,
    username: a.username,
    superAdmin: a.superAdmin,
    enabled: a.enabled,
    createdAt: a.createdAt,
    expiresAt: a.expiresAt,
    lastLoginAt: a.lastLoginAt,
    expired: adminIsExpired(a)
  };
}
function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}
function signAdminToken(username, expiry) {
  const payload = Buffer.from(JSON.stringify({ u: username, e: expiry })).toString("base64url");
  const signature = crypto.createHmac("sha256", ADMIN_KEY).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}
function parseAdminToken(token) {
  const [payload, signature] = String(token).split(".");
  if (!payload || !signature) return null;
  const expected = crypto.createHmac("sha256", ADMIN_KEY).update(payload).digest("base64url");
  if (!safeEqual(signature, expected)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!parsed?.u || !Number.isFinite(parsed.e)) return null;
    return { username: String(parsed.u), expiry: Number(parsed.e) };
  } catch {
    return null;
  }
}
function currentAdmin(req) {
  const bearer = (req.header("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const headerKey = req.header("x-admin-key") || "";
  const bodyKey = req.body?.adminKey || "";
  const queryKey = req.query.key || "";
  const candidate = bearer || headerKey || bodyKey || queryKey;
  if (!candidate) return null;
  const sess = parseAdminToken(candidate);
  if (sess && sess.expiry > Date.now()) {
    return store.admins.find((a) => a.username === sess.username) || null;
  }
  if (safeEqual(candidate, ADMIN_KEY)) {
    return store.admins.find((a) => a.username === ADMIN_USERNAME) || null;
  }
  return null;
}
function requireAdmin(req, res, next) {
  const admin = currentAdmin(req);
  if (!admin) return res.status(401).json({ success: false, message: "Unauthorized" });
  if (!admin.enabled) return res.status(403).json({ success: false, message: "Account disabled" });
  if (adminIsExpired(admin)) {
    return res.status(403).json({ success: false, message: "Your access has expired" });
  }
  req.admin = admin;
  next();
}
function requireSuperAdmin(req, res, next) {
  const admin = req.admin;
  if (!admin || !admin.superAdmin) {
    return res.status(403).json({ success: false, message: "Super admin only" });
  }
  next();
}
app.post("/api/admin/login", (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Enter username and password" });
  }
  ensureRootAdmin();
  const admin = findAdmin(username);
  if (!admin || !admin.enabled || !verifyPassword(password, admin.passwordHash)) {
    return res.status(401).json({ success: false, message: "Invalid username or password" });
  }
  if (adminIsExpired(admin)) {
    return res.status(403).json({ success: false, message: "Your access has expired" });
  }
  const token = signAdminToken(admin.username, Date.now() + ADMIN_SESSION_TTL_MS);
  admin.lastLoginAt = now();
  persist();
  res.json({
    success: true,
    data: {
      token,
      username: admin.username,
      superAdmin: admin.superAdmin,
      expiresInHours: ADMIN_SESSION_TTL_MS / 36e5
    }
  });
});
app.get("/api/admin/me", requireAdmin, (req, res) => {
  res.json({ success: true, data: publicAdmin(req.admin) });
});
app.get("/api/admin/admins", requireAdmin, (_req, res) => {
  res.json({ success: true, data: store.admins.map(publicAdmin) });
});
app.post("/api/admin/admins", requireAdmin, requireSuperAdmin, (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");
  const days = Number(req.body.days || 0);
  const superAdmin = Boolean(req.body.superAdmin);
  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) {
    return res.status(400).json({ success: false, message: "Username must be 3-32 characters (letters, numbers, _ . -)" });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
  }
  if (findAdmin(username)) {
    return res.status(409).json({ success: false, message: "Username already exists" });
  }
  if (superAdmin && req.admin.username === username) {
    return res.status(400).json({ success: false, message: "You are already a super admin" });
  }
  const account = {
    id: genId("ADM"),
    username,
    passwordHash: hashPassword(password),
    superAdmin: superAdmin && store.admins.filter((a) => a.superAdmin).length < 2,
    enabled: true,
    createdAt: now(),
    expiresAt: days > 0 ? new Date(Date.now() + days * 864e5).toISOString() : null,
    lastLoginAt: null
  };
  store.admins.push(account);
  persist();
  res.json({ success: true, data: publicAdmin(account) });
});
app.post("/api/admin/admins/update", requireAdmin, requireSuperAdmin, (req, res) => {
  const id = String(req.body.id || "");
  const admin = store.admins.find((a) => a.id === id);
  if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });
  if (req.body.password) {
    const pw = String(req.body.password);
    if (pw.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }
    admin.passwordHash = hashPassword(pw);
  }
  if (req.body.enabled !== void 0) admin.enabled = Boolean(req.body.enabled);
  if (req.body.days !== void 0) {
    const days = Number(req.body.days || 0);
    admin.expiresAt = days > 0 ? new Date(Date.now() + days * 864e5).toISOString() : null;
  }
  persist();
  res.json({ success: true, data: publicAdmin(admin) });
});
app.post("/api/admin/admins/delete", requireAdmin, requireSuperAdmin, (req, res) => {
  const id = String(req.body.id || "");
  const admin = store.admins.find((a) => a.id === id);
  if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });
  if (admin.superAdmin) {
    return res.status(400).json({ success: false, message: "Super admin cannot be deleted" });
  }
  store.admins = store.admins.filter((a) => a.id !== id);
  persist();
  res.json({ success: true });
});
app.post("/api/admin/logout", requireAdmin, (_req, res) => {
  res.json({ success: true });
});
app.get("/api/admin/overview", requireAdmin, (_req, res) => {
  const totalUsers = store.users.length;
  const onlineUsers = store.users.filter((u) => Date.now() - new Date(u.lastSeenAt).getTime() < ONLINE_WINDOW_MS).length;
  const bettingUsers = store.users.filter((u) => u.totalBets > 0).length;
  const bannedUsers = store.users.filter((u) => u.banned).length;
  const totalWagered = store.users.reduce((s, u) => s + u.totalWagered, 0);
  const totalBets = store.users.reduce((s, u) => s + u.totalBets, 0);
  const totalBalance = store.users.reduce((s, u) => s + u.balance, 0);
  const pendingDeposits = store.deposits.filter((d) => d.status === "pending_verification").length;
  const approvedDeposits = store.deposits.filter((d) => d.status === "approved").length;
  const totalDeposited = store.deposits.filter((d) => d.status === "approved").reduce((s, d) => s + d.amount, 0);
  const pendingWithdrawals = store.withdrawals.filter((w) => w.status === "pending").length;
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
      pendingWithdrawals
    }
  });
});
app.get("/api/admin/users", requireAdmin, (req, res) => {
  const search = String(req.query.search || "").toLowerCase().trim();
  const filter = String(req.query.filter || "all");
  let users = store.users.slice();
  if (search) {
    users = users.filter((u) => u.phone.toLowerCase().includes(search) || u.uid.toLowerCase().includes(search));
  }
  if (filter === "online") {
    users = users.filter((u) => Date.now() - new Date(u.lastSeenAt).getTime() < ONLINE_WINDOW_MS);
  } else if (filter === "offline") {
    users = users.filter((u) => Date.now() - new Date(u.lastSeenAt).getTime() >= ONLINE_WINDOW_MS);
  } else if (filter === "betting") {
    users = users.filter((u) => u.totalBets > 0);
  } else if (filter === "nonbetting") {
    users = users.filter((u) => u.totalBets === 0);
  } else if (filter === "banned") {
    users = users.filter((u) => u.banned);
  }
  const list = users.sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()).map(publicUser);
  res.json({ success: true, data: list });
});
app.get("/api/admin/user/:userId", requireAdmin, (req, res) => {
  const user = findUser(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const txns = store.transactions.filter((t) => t.userId === user.id).slice(-200).reverse();
  const firstEligible = !user.firstDepositBonusPaid && (user.depositedTotal || 0) === 0;
  const deposits = store.deposits.filter((d) => d.userId === user.id).slice().reverse().map((d) => ({
    ...d,
    firstDeposit: firstEligible && !d.credited,
    bonusPreview: firstEligible && !d.credited ? firstDepositBonusFor(d.amount) : 0
  }));
  const withdrawals = store.withdrawals.filter((w) => w.userId === user.id).slice().reverse();
  const referrals = store.users.filter((u) => u.invitedBy === user.id).map((u) => ({
    id: u.id,
    uid: u.uid,
    phone: u.phone,
    balance: u.balance,
    depositedTotal: +(u.depositedTotal || 0).toFixed(2),
    createdAt: u.createdAt
  })).reverse();
  res.json({
    success: true,
    data: {
      user: { ...publicUser(user), password: user.password || null },
      transactions: txns,
      deposits,
      withdrawals,
      referrals
    }
  });
});
app.post("/api/admin/user/password", requireAdmin, (req, res) => {
  const { userId, password } = req.body;
  const user = findUser(userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const next = String(password || "").trim();
  if (next.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
  }
  user.passwordHash = hashPassword(next);
  user.password = next;
  persist();
  res.json({ success: true, message: "Password updated" });
});
app.post("/api/admin/user/balance", requireAdmin, (req, res) => {
  const { userId, mode, amount, note } = req.body;
  const user = findUser(userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const amt = Number(amount) || 0;
  let type = "admin_credit";
  if (mode === "credit") {
    user.balance = +(user.balance + Math.abs(amt)).toFixed(2);
    type = "admin_credit";
  } else if (mode === "debit") {
    user.balance = Math.max(0, +(user.balance - Math.abs(amt)).toFixed(2));
    type = "admin_debit";
  } else if (mode === "set") {
    user.balance = +Math.max(0, amt).toFixed(2);
    type = "admin_set";
  } else {
    return res.status(400).json({ success: false, message: "Invalid mode" });
  }
  recordTxn(user, type, mode === "debit" ? -Math.abs(amt) : amt, { note: note || "", by: "admin" });
  persist();
  res.json({ success: true, data: { balance: user.balance, user: publicUser(user) } });
});
app.post("/api/admin/user/note", requireAdmin, (req, res) => {
  const { userId, note } = req.body;
  const user = findUser(userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  user.note = String(note || "");
  persist();
  res.json({ success: true, data: publicUser(user) });
});
app.post("/api/admin/user/ban", requireAdmin, (req, res) => {
  const { userId, banned } = req.body;
  const user = findUser(userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  user.banned = !!banned;
  persist();
  res.json({ success: true, data: publicUser(user) });
});
app.post("/api/admin/user/delete", requireAdmin, (req, res) => {
  const { userId } = req.body;
  const user = findUser(userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  store.users = store.users.filter((u) => u.id !== user.id);
  store.transactions = store.transactions.filter((t) => t.userId !== user.id);
  store.deposits = store.deposits.filter((d) => d.userId !== user.id);
  store.withdrawals = store.withdrawals.filter((w) => w.userId !== user.id);
  persist();
  res.json({ success: true, message: `Deleted user ${user.phone}` });
});
app.get("/api/admin/deposits", requireAdmin, (req, res) => {
  const status = String(req.query.status || "");
  let list = store.deposits.slice().reverse();
  if (status) list = list.filter((d) => d.status === status);
  const withUser = list.map((d) => {
    const u = store.users.find((x) => x.id === d.userId);
    const eligible = !!u && !u.firstDepositBonusPaid && (u.depositedTotal || 0) === 0;
    return {
      ...d,
      phone: u?.phone || "-",
      uid: u?.uid || "-",
      firstDeposit: eligible,
      bonusPreview: eligible ? firstDepositBonusFor(d.amount) : 0
    };
  });
  res.json({ success: true, data: withUser });
});
app.post("/api/admin/deposit/approve", requireAdmin, (req, res) => {
  const { orderId } = req.body;
  const deposit = store.deposits.find((d) => d.orderId === orderId);
  if (!deposit) return res.status(404).json({ success: false, message: "Deposit not found" });
  deposit.status = "approved";
  deposit.updatedAt = now();
  const user = findUser(deposit.userId);
  let bonusPaid = 0;
  if (user && !deposit.credited) {
    const firstDeposit = !user.firstDepositBonusPaid && (user.depositedTotal || 0) === 0;
    const bonus = firstDeposit ? firstDepositBonusFor(deposit.amount) : 0;
    user.balance = +(user.balance + deposit.amount).toFixed(2);
    user.depositedTotal = +((user.depositedTotal || 0) + deposit.amount).toFixed(2);
    refreshBonusLock(user);
    deposit.credited = true;
    recordTxn(user, "deposit", deposit.amount, { orderId, by: "admin" });
    if (bonus > 0) {
      user.balance = +(user.balance + bonus).toFixed(2);
      user.firstDepositBonusPaid = true;
      user.firstDepositBonus = bonus;
      user.firstDepositAt = now();
      deposit.bonus = bonus;
      bonusPaid = bonus;
      recordTxn(user, "bonus", bonus, {
        source: "first_deposit",
        orderId,
        depositAmount: deposit.amount,
        by: "admin"
      });
    }
  }
  persist();
  res.json({
    success: true,
    message: bonusPaid > 0 ? `Deposit approved \xB7 \u20B9${bonusPaid} first-deposit bonus credited` : "Deposit approved",
    data: {
      orderId,
      status: deposit.status,
      amount: deposit.amount,
      bonus: bonusPaid,
      balance: user ? user.balance : null
    }
  });
});
app.post("/api/admin/deposit/reject", requireAdmin, (req, res) => {
  const { orderId, reason } = req.body;
  const deposit = store.deposits.find((d) => d.orderId === orderId);
  if (!deposit) return res.status(404).json({ success: false, message: "Deposit not found" });
  deposit.status = "rejected";
  deposit.rejectionReason = reason || "Invalid UTR / payment not received";
  deposit.updatedAt = now();
  persist();
  res.json({ success: true, message: "Deposit rejected", data: { orderId, status: deposit.status } });
});
app.get("/api/admin/withdrawals", requireAdmin, (req, res) => {
  const status = String(req.query.status || "");
  let list = store.withdrawals.slice().reverse();
  if (status) list = list.filter((w) => w.status === status);
  const withUser = list.map((w) => {
    const u = store.users.find((x) => x.id === w.userId);
    return { ...w, phone: u?.phone || "-", uid: u?.uid || "-" };
  });
  res.json({ success: true, data: withUser });
});
app.post("/api/admin/withdraw/approve", requireAdmin, (req, res) => {
  const { id, ref } = req.body;
  const w = store.withdrawals.find((x) => x.id === id);
  if (!w) return res.status(404).json({ success: false, message: "Withdrawal not found" });
  w.status = "approved";
  w.paidAt = now();
  if (ref) w.paidRef = String(ref);
  w.updatedAt = now();
  persist();
  res.json({ success: true, message: "Withdrawal marked paid", data: w });
});
app.post("/api/admin/withdraw/reject", requireAdmin, (req, res) => {
  const { id, reason } = req.body;
  const w = store.withdrawals.find((x) => x.id === id);
  if (!w) return res.status(404).json({ success: false, message: "Withdrawal not found" });
  w.status = "rejected";
  w.adminNote = reason || "Rejected by admin";
  w.updatedAt = now();
  const user = findUser(w.userId);
  if (user) {
    user.balance = +(user.balance + w.amount).toFixed(2);
    recordTxn(user, "admin_credit", w.amount, { withdrawalRefund: id });
  }
  persist();
  res.json({ success: true, message: "Withdrawal rejected & refunded", data: w });
});
app.post("/api/admin/withdraw/processing", requireAdmin, (req, res) => {
  const { id } = req.body;
  const w = store.withdrawals.find((x) => x.id === id);
  if (!w) return res.status(404).json({ success: false, message: "Withdrawal not found" });
  if (w.status !== "pending") {
    return res.status(400).json({ success: false, message: `Cannot move a ${w.status} withdrawal to processing` });
  }
  w.status = "processing";
  w.updatedAt = now();
  persist();
  res.json({ success: true, message: "Marked as processing", data: w });
});
var liveBets = [];
var wingoForced = {
  "30s": {},
  "1m": {},
  "3m": {},
  "5m": {}
};
var WINGO_KEEP_PER_MODE = 5e3;
function wingoStoredResults(mode) {
  if (!store.wingoResults) store.wingoResults = {};
  if (!store.wingoResults[mode]) store.wingoResults[mode] = {};
  return store.wingoResults[mode];
}
function wingoDigitFor(mode, period) {
  const table = wingoStoredResults(mode);
  const forced = wingoForced[mode]?.[period];
  if (typeof forced === "number" && period === periodInfo(mode, Date.now()).period) {
    table[period] = forced;
    wingoResultsDirty = true;
    return forced;
  }
  const stored = table[period];
  if (typeof stored === "number") return stored;
  const digit = typeof forced === "number" ? forced : crypto.randomInt(0, 10);
  table[period] = digit;
  const keys = Object.keys(table);
  if (keys.length > WINGO_KEEP_PER_MODE) {
    keys.sort();
    keys.slice(0, keys.length - WINGO_KEEP_PER_MODE).forEach((k) => delete table[k]);
  }
  wingoResultsDirty = true;
  return digit;
}
function wingoClearLive(mode) {
  const info = periodInfo(mode, Date.now());
  delete wingoForced[mode][info.period];
  delete wingoStoredResults(mode)[info.period];
  wingoResultsDirty = true;
  return info.period;
}
var wingoResultsDirty = false;
function startWingoResultFlush() {
  setInterval(() => {
    if (!wingoResultsDirty) return;
    wingoResultsDirty = false;
    persist();
  }, 5e3).unref?.();
}
var aviatorEngine = {
  roundId: 8942105,
  forcedNext: null,
  /** Crash point of the round that is running right now. */
  nextCrash: null,
  nextRoundId: null,
  /** Guards against writing the same finished round into history twice. */
  lastRecordedCrashRound: 0,
  history: [],
  /** Live round state so the admin console can mirror the curve in real time. */
  live: {
    state: "WAITING",
    multiplier: 1,
    roundId: 8942105,
    /** Recent live samples for the admin sparkline. */
    curve: [],
    lastCrash: 2,
    /** Exact jet position from the game, in the shared 360x190 space. */
    jetX: 6,
    jetY: 178,
    /** Flight clock, used to extrapolate between updates. */
    flightElapsedMs: 0,
    /** Where this round will crash. Decided by the server, not the browser. */
    crashTarget: 2,
    /** Server timestamp when the current phase ends. */
    phaseEndsAt: 0,
    updatedAt: now()
  }
};
function snapshotAviator() {
  store.aviator = {
    roundId: aviatorEngine.roundId,
    forcedNext: aviatorEngine.forcedNext,
    nextCrash: aviatorEngine.nextCrash,
    nextRoundId: aviatorEngine.nextRoundId,
    lastRecordedCrashRound: aviatorEngine.lastRecordedCrashRound,
    history: aviatorEngine.history,
    live: aviatorEngine.live
  };
}
function hydrateAviator() {
  const saved = store.aviator;
  if (!saved || typeof saved !== "object") return;
  if (Number.isFinite(Number(saved.roundId))) aviatorEngine.roundId = Number(saved.roundId);
  aviatorEngine.forcedNext = saved.forcedNext ?? null;
  aviatorEngine.nextCrash = saved.nextCrash ?? null;
  aviatorEngine.nextRoundId = saved.nextRoundId ?? null;
  aviatorEngine.lastRecordedCrashRound = Number(saved.lastRecordedCrashRound) || 0;
  aviatorEngine.history = Array.isArray(saved.history) ? saved.history : [];
  if (saved.live && typeof saved.live === "object") {
    aviatorEngine.live = { ...aviatorEngine.live, ...saved.live };
  }
}
function randomCrashMultiplier() {
  const r = Math.random();
  if (r < 0.04) return 1;
  if (r < 0.44) return +(1.06 + Math.random() * 0.93).toFixed(2);
  if (r < 0.68) return +(2 + Math.random() * 2.2).toFixed(2);
  if (r < 0.9) return +(4.2 + Math.random() * 7.6).toFixed(2);
  return +(11.8 + Math.random() * 36.7).toFixed(2);
}
var AVIATOR_TICK_MS = 50;
function aviatorIncrementFor(multiplier) {
  if (multiplier < 1.5) return 6e-3;
  if (multiplier < 2.2) return 9e-3;
  if (multiplier < 4) return 0.021;
  if (multiplier < 10) return 0.038;
  if (multiplier < 25) return 0.09;
  return 0.24;
}
function recordAviatorCrash(roundId, crashAt) {
  if (!roundId || aviatorEngine.lastRecordedCrashRound === roundId) return;
  aviatorEngine.lastRecordedCrashRound = roundId;
  aviatorEngine.history.unshift({ roundId, crashAt, at: now() });
  aviatorEngine.history = aviatorEngine.history.slice(0, 50);
  const per = String(roundId);
  let changed = false;
  for (const b of store.bets) {
    if (b.game === "aviator" && b.period === per && b.status === "pending") {
      b.status = "lost";
      b.payout = 0;
      changed = true;
    }
  }
  if (changed) persist();
}
function pickAviatorCrash() {
  if (aviatorEngine.forcedNext != null) {
    const forced = aviatorEngine.forcedNext;
    aviatorEngine.forcedNext = null;
    return forced;
  }
  return randomCrashMultiplier();
}
function preDecideAviatorRound(roundId) {
  aviatorEngine.nextRoundId = roundId;
  aviatorEngine.nextCrash = pickAviatorCrash();
}
function startAviatorRound() {
  const live = aviatorEngine.live;
  const roundId = aviatorEngine.nextRoundId ?? live.roundId + 1;
  const crashAt = aviatorEngine.nextCrash ?? pickAviatorCrash();
  live.state = "WAITING";
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
  if (live.state === "FLYING") {
    live.flightElapsedMs += AVIATOR_TICK_MS;
    const next = +(live.multiplier + aviatorIncrementFor(live.multiplier)).toFixed(2);
    if (next >= live.crashTarget) {
      live.state = "CRASHED";
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
    if (live.state === "CRASHED") startAviatorRound();
    else if (live.state === "WAITING") {
      live.state = "FLYING";
      live.flightElapsedMs = 0;
      live.phaseEndsAt = 0;
    }
  }
  live.updatedAt = now();
}
function catchUpAviatorClock() {
  const updatedAt = new Date(aviatorEngine.live.updatedAt).getTime();
  if (!Number.isFinite(updatedAt)) return;
  const missed = Math.floor((Date.now() - updatedAt) / AVIATOR_TICK_MS);
  const steps = Math.min(Math.max(missed, 0), 600);
  for (let i = 0; i < steps; i++) stepAviatorEngine();
}
var aviatorClockStarted = false;
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
    let steps = Math.round((nowMs - lastStepAt) / AVIATOR_TICK_MS);
    lastStepAt = nowMs;
    if (steps < 1) steps = 1;
    if (steps > 24) steps = 24;
    for (let i = 0; i < steps; i++) stepAviatorEngine();
  }, AVIATOR_TICK_MS).unref?.();
}
function wingoResultFor(mode, period) {
  return outcomeForNumber(period, wingoDigitFor(mode, period));
}
function wingoStateFor(mode) {
  const info = periodInfo(mode, Date.now());
  const forced = wingoForced[mode][info.period];
  const history = [];
  for (let i = 1; i <= 50; i++) {
    history.push(wingoResultFor(mode, formatPeriodId(mode, info.counter - i)));
  }
  return {
    mode,
    period: info.period,
    counter: info.counter,
    timeLeft: info.timeLeft,
    duration: info.duration,
    serverNow: Date.now(),
    forced: typeof forced === "number" ? { period: info.period, number: forced } : null,
    history
  };
}
function wingoAdminStateFor(mode) {
  const base = wingoStateFor(mode);
  return {
    ...base,
    nextResult: outcomeForNumber(base.period, wingoDigitFor(mode, base.period))
  };
}
app.get("/api/game/wingo/state", (req, res) => {
  const mode = String(req.query.mode || "30s");
  if (!WINGO_MODES[mode]) return res.status(400).json({ success: false, message: "Invalid mode" });
  res.json({ success: true, data: wingoStateFor(mode) });
});
app.get("/api/game/wingo/state/all", (_req, res) => {
  const data = { __serverNow: Date.now() };
  WINGO_MODE_KEYS.forEach((m) => {
    data[m] = wingoStateFor(m);
  });
  res.json({ success: true, data });
});
app.get("/api/game/wingo/result", (req, res) => {
  const mode = String(req.query.mode || "30s");
  const period = String(req.query.period || "");
  if (!WINGO_MODES[mode] || !period) {
    return res.status(400).json({ success: false, message: "Invalid request" });
  }
  const current = periodInfo(mode, Date.now()).period;
  if (period >= current) {
    return res.status(404).json({ success: false, message: "Period not finished" });
  }
  res.json({ success: true, data: wingoResultFor(mode, period) });
});
app.get("/api/game/aviator/next", (_req, res) => {
  res.json({
    success: true,
    data: {
      roundId: aviatorEngine.live.roundId,
      crashAt: aviatorEngine.live.crashTarget
    }
  });
});
app.post("/api/game/aviator/live", (req, res) => {
  const { state, multiplier, roundId, jetX, jetY, flightElapsedMs } = req.body || {};
  const m = Number(multiplier);
  if (!["WAITING", "FLYING", "CRASHED"].includes(String(state))) {
    return res.status(400).json({ success: false, message: "Invalid state" });
  }
  if (!Number.isFinite(m) || m <= 0) {
    return res.status(400).json({ success: false, message: "Invalid multiplier" });
  }
  const live = aviatorEngine.live;
  live.jetX = Number.isFinite(Number(jetX)) ? Number(jetX) : live.jetX;
  live.jetY = Number.isFinite(Number(jetY)) ? Number(jetY) : live.jetY;
  broadcastAviatorLive(live);
  res.json({ success: true });
});
app.post("/api/game/aviator/cashout", (req, res) => {
  const { userId, betId, roundId } = req.body || {};
  const user = findUser(userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  if (user.banned) return res.status(403).json({ success: false, message: "Account banned" });
  const live = aviatorEngine.live;
  const requestedRound = String(roundId ?? "");
  let bet;
  if (betId) {
    bet = store.bets.find(
      (b) => b.id === String(betId) && b.userId === user.id && b.game === "aviator"
    );
  } else if (requestedRound) {
    bet = store.bets.filter(
      (b) => b.userId === user.id && b.game === "aviator" && b.period === requestedRound && b.status === "pending"
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  } else {
    return res.status(400).json({ success: false, message: "betId or roundId is required" });
  }
  if (!bet) return res.status(404).json({ success: false, message: "Bet not found" });
  if (live.state !== "FLYING" || String(live.roundId) !== String(bet.period)) {
    return res.status(400).json({ success: false, message: "Round is not active for cashout" });
  }
  if (bet.status === "won") {
    return res.json({
      success: true,
      data: {
        balance: user.balance,
        payout: bet.payout,
        multiplier: bet.amount > 0 ? +(bet.payout / bet.amount).toFixed(2) : 0,
        betId: bet.id,
        alreadyPaid: true
      }
    });
  }
  if (bet.status !== "pending") {
    return res.status(400).json({ success: false, message: "Bet already settled" });
  }
  const cashMult = Math.max(1, +Number(live.multiplier || 1).toFixed(2));
  if (cashMult >= live.crashTarget) {
    return res.status(400).json({ success: false, message: "Cashout window closed" });
  }
  const payout = +(bet.amount * cashMult).toFixed(2);
  bet.status = "won";
  bet.payout = payout;
  user.balance = +(user.balance + payout).toFixed(2);
  user.totalWon = +(user.totalWon + payout).toFixed(2);
  user.lastSeenAt = now();
  recordTxn(user, "win", payout, {
    game: "aviator",
    period: bet.period,
    betId: bet.id,
    stake: bet.amount,
    multiplier: cashMult
  });
  persist();
  res.json({
    success: true,
    data: { balance: user.balance, payout, multiplier: cashMult, betId: bet.id }
  });
});
app.post("/api/game/aviator/bet/cancel", (req, res) => {
  const { userId, betId, roundId } = req.body || {};
  const user = findUser(userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const live = aviatorEngine.live;
  const requestedRound = String(roundId ?? "");
  let bet;
  if (betId) {
    bet = store.bets.find(
      (b) => b.id === String(betId) && b.userId === user.id && b.game === "aviator"
    );
  } else if (requestedRound) {
    bet = store.bets.filter(
      (b) => b.userId === user.id && b.game === "aviator" && b.period === requestedRound && b.status === "pending"
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }
  if (!bet) return res.status(404).json({ success: false, message: "Bet not found" });
  if (bet.status === "refunded") {
    return res.json({ success: true, data: { balance: user.balance, betId: bet.id, refunded: bet.amount } });
  }
  if (bet.status !== "pending") {
    return res.status(400).json({ success: false, message: "Bet cannot be cancelled" });
  }
  if (live.state === "FLYING" && String(live.roundId) === bet.period) {
    return res.status(400).json({ success: false, message: "Round already started" });
  }
  bet.status = "refunded";
  bet.payout = 0;
  user.balance = +(user.balance + bet.amount).toFixed(2);
  user.lastSeenAt = now();
  recordTxn(user, "admin_credit", bet.amount, {
    reason: "aviator_bet_cancel",
    game: "aviator",
    period: bet.period,
    betId: bet.id
  });
  persist();
  res.json({ success: true, data: { balance: user.balance, betId: bet.id, refunded: bet.amount } });
});
var aviatorSseClients = /* @__PURE__ */ new Set();
function broadcastAviatorLive(live) {
  if (aviatorSseClients.size === 0) return;
  const payload = `data: ${JSON.stringify(live)}

`;
  aviatorSseClients.forEach((client) => {
    try {
      client.write(payload);
    } catch {
      aviatorSseClients.delete(client);
    }
  });
}
app.get("/api/admin/game/aviator/live", requireAdmin, (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });
  res.flushHeaders?.();
  res.write(`data: ${JSON.stringify(aviatorEngine.live)}

`);
  aviatorSseClients.add(res);
  const ping = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
    }
  }, 2e4);
  req.on("close", () => {
    clearInterval(ping);
    aviatorSseClients.delete(res);
  });
});
app.get("/api/game/aviator/state", (_req, res) => {
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
      serverNow: Date.now()
    }
  });
});
var VORTEX_WATER = [{ m: 1.55 }, { m: 4.85 }, { m: 10 }, { m: 0, bonus: 7 }];
var VORTEX_EARTH = [
  { m: 2.5 },
  { m: 7.7 },
  { m: 16 },
  { m: 27.5 },
  { m: 44 },
  { m: 0, bonus: 20.5 }
];
var VORTEX_FIRE = [
  { m: 3.9 },
  { m: 12.5 },
  { m: 28 },
  { m: 52 },
  { m: 85 },
  { m: 133 },
  { m: 200 },
  { m: 0, bonus: 50 }
];
var VORTEX_ROLLS = ["water", "earth", "fire", "cloud", "skull", "bonus"];
var VORTEX_MIN_BET = 5;
var VORTEX_MAX_BET = 1e5;
var vortexRounds = /* @__PURE__ */ new Map();
var vortexRoundSeq = 7000001;
var vortexHistory = [];
var vortexEngine = { forcedNext: null };
function vortexMultiplier(water, earth, fire, bonus) {
  let base = 0;
  const consider = (track, step) => {
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
function vortexRoll() {
  if (vortexEngine.forcedNext) {
    const forced = vortexEngine.forcedNext;
    vortexEngine.forcedNext = null;
    return forced;
  }
  const r = Math.random();
  if (r < 0.33) return "water";
  if (r < 0.54) return "earth";
  if (r < 0.68) return "fire";
  if (r < 0.84) return "cloud";
  if (r < 0.98) return "skull";
  return "bonus";
}
function vortexRoundFor(userId) {
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
      active: false
    };
    vortexRounds.set(userId, round);
  }
  return round;
}
function vortexPartPayout(payout, stake) {
  if (payout <= 0) return 0;
  const base = Number((stake * 1.55).toFixed(2));
  if (payout > base) return Number((payout - base).toFixed(2));
  return Number((payout / 2).toFixed(2));
}
function vortexStateFor(round, bet) {
  const multiplier = vortexMultiplier(round.water, round.earth, round.fire, round.bonus);
  const payout = Number((bet * multiplier).toFixed(2));
  return {
    water: round.water,
    earth: round.earth,
    fire: round.fire,
    bonus: round.bonus,
    multiplier,
    payout,
    partPayout: vortexPartPayout(payout, bet)
  };
}
function recordVortexResult(entry) {
  vortexHistory.unshift({ ...entry, id: genId("VTX"), at: now() });
  if (vortexHistory.length > 50) vortexHistory.length = 50;
}
app.get("/api/game/vortex/state", (_req, res) => {
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
        at: h.at
      })),
      serverNow: Date.now()
    }
  });
});
app.post("/api/game/vortex/spin", (req, res) => {
  const user = findUser(req.body?.userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  if (user.banned) return res.status(403).json({ success: false, message: "Account banned" });
  const bet = Number(req.body?.bet);
  if (!(bet >= VORTEX_MIN_BET && bet <= VORTEX_MAX_BET)) {
    return res.status(400).json({ success: false, message: `Bet must be between ${VORTEX_MIN_BET} and ${VORTEX_MAX_BET}` });
  }
  if (user.balance < bet) {
    return res.status(400).json({ success: false, message: "Insufficient balance" });
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
  recordTxn(user, "bet", -bet, { game: "vortex", round: round.roundId });
  const outcome = vortexRoll();
  let busted = false;
  if (outcome === "skull") {
    round.water = Math.max(0, round.water - 1);
    round.earth = Math.max(0, round.earth - 1);
    round.fire = Math.max(0, round.fire - 1);
    round.bonus = Math.max(0, round.bonus - 5);
    busted = round.water === 0 && round.earth === 0 && round.fire === 0;
  } else if (outcome === "water") {
    round.water = Math.min(round.water + 1, VORTEX_WATER.length);
    const seg = VORTEX_WATER[round.water - 1];
    if (seg.bonus) round.bonus = +(round.bonus + seg.bonus).toFixed(2);
  } else if (outcome === "earth") {
    round.earth = Math.min(round.earth + 1, VORTEX_EARTH.length);
    const seg = VORTEX_EARTH[round.earth - 1];
    if (seg.bonus) round.bonus = +(round.bonus + seg.bonus).toFixed(2);
  } else if (outcome === "fire") {
    round.fire = Math.min(round.fire + 1, VORTEX_FIRE.length);
    const seg = VORTEX_FIRE[round.fire - 1];
    if (seg.bonus) round.bonus = +(round.bonus + seg.bonus).toFixed(2);
  } else if (outcome === "bonus") {
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
    bust: busted
  });
  liveBets.unshift({
    id: genId("VTX"),
    userId: user.id,
    phone: user.phone,
    uid: user.uid,
    game: "vortex",
    mode: null,
    period: String(round.roundId),
    selection: outcome,
    amount: bet,
    createdAt: now()
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
      stake: bet
    }
  });
});
app.post("/api/game/vortex/cashout", (req, res) => {
  const user = findUser(req.body?.userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const round = vortexRounds.get(user.id);
  if (!round || !round.active) {
    return res.status(400).json({ success: false, message: "No active round" });
  }
  const bet = round.lastBet || round.staked;
  const multiplier = vortexMultiplier(round.water, round.earth, round.fire, round.bonus);
  const payout = Number((bet * multiplier).toFixed(2));
  const credit = Math.max(0, Number((payout - round.paidOut).toFixed(2)));
  if (credit > 0) {
    user.balance = +(user.balance + credit).toFixed(2);
    user.totalWon = +(user.totalWon + credit).toFixed(2);
    recordTxn(user, "win", credit, { game: "vortex", round: round.roundId, multiplier });
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
    data: { balance: user.balance, credited: credit, multiplier, payout }
  });
});
app.post("/api/game/vortex/part", (req, res) => {
  const user = findUser(req.body?.userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const round = vortexRounds.get(user.id);
  if (!round || !round.active) {
    return res.status(400).json({ success: false, message: "No active round" });
  }
  const bet = round.lastBet || round.staked;
  const multiplier = vortexMultiplier(round.water, round.earth, round.fire, round.bonus);
  const payout = Number((bet * multiplier).toFixed(2));
  const part = vortexPartPayout(payout, bet);
  if (part <= 0) return res.status(400).json({ success: false, message: "Nothing to pay out" });
  user.balance = +(user.balance + part).toFixed(2);
  user.totalWon = +(user.totalWon + part).toFixed(2);
  round.paidOut = +(round.paidOut + part).toFixed(2);
  recordTxn(user, "win", part, { game: "vortex", round: round.roundId, part: true });
  user.lastSeenAt = now();
  persist();
  res.json({
    success: true,
    data: { balance: user.balance, part, multiplier, payout }
  });
});
app.get("/api/admin/bets", requireAdmin, (req, res) => {
  const game = req.query.game ? String(req.query.game) : "";
  const limit = Math.min(300, Math.max(1, Number(req.query.limit) || 100));
  let list = liveBets;
  if (game) list = list.filter((b) => b.game === game);
  res.json({ success: true, data: list.slice(0, limit) });
});
app.post("/api/admin/bets/clear", requireAdmin, (req, res) => {
  const game = req.body && req.body.game ? String(req.body.game).trim().toLowerCase() : "";
  const before = store.bets.length;
  store.bets = game ? store.bets.filter((b) => String(b.game || "").toLowerCase() !== game) : [];
  const removed = before - store.bets.length;
  for (let i = liveBets.length - 1; i >= 0; i--) {
    if (!game || String(liveBets[i].game || "").toLowerCase() === game) {
      liveBets.splice(i, 1);
    }
  }
  persist();
  res.json({ success: true, removed, remaining: store.bets.length });
});
app.get("/api/admin/game/state", requireAdmin, (_req, res) => {
  const wingo = {};
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
        ageMs: Number.isFinite(new Date(aviatorEngine.live.updatedAt).getTime()) ? Math.max(0, Date.now() - new Date(aviatorEngine.live.updatedAt).getTime()) : 0
      },
      vortex: {
        forcedNext: vortexEngine.forcedNext,
        activeRounds: [...vortexRounds.values()].filter((r) => r.active).length,
        history: vortexHistory
      }
    }
  });
});
app.post("/api/admin/game/wingo/set", requireAdmin, (req, res) => {
  const mode = String(req.body?.mode || "");
  const number = Number(req.body?.number);
  if (!WINGO_MODES[mode]) return res.status(400).json({ success: false, message: "Invalid mode" });
  if (!Number.isInteger(number) || number < 0 || number > 9) {
    return res.status(400).json({ success: false, message: "Number must be 0-9" });
  }
  const info = periodInfo(mode, Date.now());
  wingoForced[mode][info.period] = number;
  wingoStoredResults(mode)[info.period] = number;
  wingoResultsDirty = true;
  res.json({
    success: true,
    message: `WinGo ${mode} live period ${info.period} set to ${number}`,
    data: { mode, period: info.period, number }
  });
});
app.post("/api/admin/game/wingo/clear", requireAdmin, (req, res) => {
  const mode = String(req.body?.mode || "");
  if (!WINGO_MODES[mode]) return res.status(400).json({ success: false, message: "Invalid mode" });
  const period = wingoClearLive(mode);
  res.json({
    success: true,
    message: `WinGo ${mode} live period back to random`,
    data: { mode, period }
  });
});
app.post("/api/admin/game/aviator/set", requireAdmin, (req, res) => {
  const crashAt = Number(req.body?.crashAt);
  if (!(crashAt >= 1 && crashAt <= 1e5)) {
    return res.status(400).json({ success: false, message: "crashAt must be between 1 and 100000" });
  }
  const value = +crashAt.toFixed(2);
  const live = aviatorEngine.live;
  const alsoLive = req.body?.live === true;
  if (alsoLive) {
    if (live.state === "CRASHED") {
      return res.status(400).json({ success: false, message: "This round has already crashed" });
    }
    live.crashTarget = value;
    if (live.state === "WAITING") {
      live.multiplier = 1;
      live.flightElapsedMs = 0;
      live.curve = [1];
    }
    live.updatedAt = now();
    aviatorEngine.forcedNext = value;
    aviatorEngine.nextCrash = value;
    if (aviatorEngine.nextRoundId == null) aviatorEngine.nextRoundId = live.roundId + 1;
    persist();
    return res.json({
      success: true,
      message: `Live round #${live.roundId} crash set to ${value}x`,
      data: { crashAt: value, roundId: live.roundId, live: true }
    });
  }
  aviatorEngine.forcedNext = value;
  aviatorEngine.nextCrash = value;
  if (aviatorEngine.nextRoundId == null) aviatorEngine.nextRoundId = live.roundId + 1;
  res.json({
    success: true,
    message: `Period #${aviatorEngine.nextRoundId} crash locked to ${value}x`,
    data: { crashAt: value, roundId: aviatorEngine.nextRoundId, live: false }
  });
});
app.post("/api/admin/game/aviator/clear", requireAdmin, (_req, res) => {
  aviatorEngine.forcedNext = null;
  if (aviatorEngine.nextRoundId != null) {
    aviatorEngine.nextCrash = randomCrashMultiplier();
  }
  res.json({ success: true, message: "Override cleared", data: {} });
});
app.post("/api/admin/game/vortex/set", requireAdmin, (req, res) => {
  const outcome = String(req.body?.outcome || "");
  if (!VORTEX_ROLLS.includes(outcome)) {
    return res.status(400).json({ success: false, message: `outcome must be one of ${VORTEX_ROLLS.join(", ")}` });
  }
  vortexEngine.forcedNext = outcome;
  res.json({
    success: true,
    message: `Next Vortex spin forced to ${outcome}`,
    data: { outcome }
  });
});
app.post("/api/admin/game/vortex/clear", requireAdmin, (_req, res) => {
  vortexEngine.forcedNext = null;
  res.json({ success: true, message: "Override cleared", data: {} });
});
var distDir = path.join(process.cwd(), "dist");
app.use(express.static(distDir));
function periodBets(game, mode, period) {
  return store.bets.filter(
    (b) => b.game === game && b.mode === mode && b.period === period
  );
}
app.post("/api/game/bet", (req, res) => {
  const { userId, game, mode, period, selection, amount } = req.body || {};
  const user = findUser(userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  if (user.banned) return res.status(403).json({ success: false, message: "Account banned" });
  const amt = Number(amount) || 0;
  if (!amt || amt <= 0) {
    return res.status(400).json({ success: false, message: "Enter a valid bet amount" });
  }
  if (amt < 1) {
    return res.status(400).json({ success: false, message: "Minimum bet is 1" });
  }
  if (amt > 1e5) {
    return res.status(400).json({ success: false, message: "Maximum bet is 100000" });
  }
  if (user.balance < amt) {
    return res.status(400).json({ success: false, message: "Insufficient balance" });
  }
  if (!selection || !period) {
    return res.status(400).json({ success: false, message: "Invalid bet" });
  }
  const gameKey = String(game || "wingo");
  const modeKey = mode ? String(mode) : null;
  const per = String(period);
  if (modeKey && Object.prototype.hasOwnProperty.call(WINGO_MODES, modeKey)) {
    const running = periodInfo(modeKey, Date.now()).period;
    if (per !== running) {
      return res.status(400).json({ success: false, message: "Betting is closed for this period" });
    }
  }
  const round = periodBets(gameKey, modeKey, per);
  if (round.length >= MAX_ACTIVE_BETS_PER_PERIOD) {
    return res.status(400).json({ success: false, message: "Round pot is full" });
  }
  user.balance = +(user.balance - amt).toFixed(2);
  recordTxn(user, "bet", -amt, { game: gameKey, mode: modeKey, period: per, selection });
  const bet = {
    id: genId("BET"),
    userId: user.id,
    phone: user.phone,
    uid: user.uid,
    game: gameKey,
    mode: modeKey,
    period: per,
    selection: String(selection),
    amount: amt,
    status: "pending",
    payout: 0,
    createdAt: now()
  };
  store.bets.push(bet);
  const live = {
    id: bet.id,
    userId: user.id,
    phone: user.phone,
    uid: user.uid,
    game: gameKey,
    mode: modeKey,
    period: per,
    selection: bet.selection,
    amount: amt,
    createdAt: bet.createdAt
  };
  liveBets.unshift(live);
  if (liveBets.length > 800) liveBets.length = 800;
  user.lastSeenAt = now();
  persist();
  res.json({
    success: true,
    data: { bet, balance: user.balance }
  });
});
function settleRoundBets(gameKey, modeKey, per) {
  const round = periodBets(gameKey, modeKey, per);
  const empty = { settled: true, totalPot: 0, houseFee: 0, houseFeePct: HOUSE_FEE_PCT, prizePool: 0, winners: 0, payouts: [] };
  if (round.length === 0) return empty;
  if (round.every((b) => b.status !== "pending")) return empty;
  let resultNumber = null;
  let resultMultiplier = null;
  if (gameKey === "aviator") {
    const rec = aviatorEngine.history.find((h) => String(h.roundId) === per);
    resultMultiplier = rec ? rec.crashAt : null;
  } else if (modeKey && Object.prototype.hasOwnProperty.call(WINGO_MODES, modeKey)) {
    resultNumber = wingoResultFor(modeKey, per).number;
  }
  const potPaisa = round.reduce((s, b) => s + toPaisa(b.amount), 0);
  const winnerIdx = round.map((b, i) => ({ i, b })).filter(({ b }) => selectionWins(b.selection, gameKey, resultNumber, resultMultiplier)).map(({ i, b }) => ({ index: i, betPaisa: toPaisa(b.amount), bet: b }));
  const result = settleRound({
    potPaisa,
    houseFeePct: HOUSE_FEE_PCT,
    winners: winnerIdx.map((w) => ({ index: w.index, betPaisa: w.betPaisa }))
  });
  const payouts = [];
  round.forEach((b) => {
    b.status = selectionWins(b.selection, gameKey, resultNumber, resultMultiplier) ? "won" : "lost";
  });
  winnerIdx.forEach((w, idx) => {
    const payoutPaisa = result.payouts[idx] || 0;
    const bet = w.bet;
    bet.payout = toRupees(payoutPaisa);
    const owner = findUser(bet.userId);
    if (owner && payoutPaisa > 0) {
      owner.balance = +(owner.balance + toRupees(payoutPaisa)).toFixed(2);
      owner.totalWon = +(owner.totalWon + toRupees(payoutPaisa)).toFixed(2);
      recordTxn(owner, "win", toRupees(payoutPaisa), {
        game: gameKey,
        mode: bet.mode,
        period: bet.period,
        selection: bet.selection,
        betId: bet.id,
        stake: bet.amount,
        houseFeePct: HOUSE_FEE_PCT
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
    payouts
  };
}
function catchUpWingoSettlements() {
  try {
    const nowPeriod = {};
    WINGO_MODE_KEYS.forEach((m) => {
      nowPeriod[m] = periodInfo(m, Date.now()).period;
    });
    const stale = /* @__PURE__ */ new Set();
    for (const b of store.bets) {
      if (b.status !== "pending") continue;
      if (b.game !== "wingo" || !b.mode) continue;
      const cur = nowPeriod[b.mode];
      if (cur && b.period < cur) stale.add(`${b.mode}|${b.period}`);
    }
    stale.forEach((key) => {
      const [mode, period] = key.split("|");
      settleRoundBets("wingo", mode, period);
    });
  } catch (err) {
    console.error("Auto-settle failed:", err);
  }
}
function startWingoAutoSettle() {
  catchUpWingoSettlements();
  setInterval(catchUpWingoSettlements, 2e3).unref?.();
}
app.post("/api/game/settle", (req, res) => {
  const { game, mode, period } = req.body || {};
  const gameKey = String(game || "wingo");
  const modeKey = mode ? String(mode) : null;
  const per = String(period);
  if (!per) return res.status(400).json({ success: false, message: "period is required" });
  res.json({ success: true, data: settleRoundBets(gameKey, modeKey, per) });
});
app.get("/api/game/settlement", (req, res) => {
  const { game, mode, period, userId } = req.query;
  const gameKey = String(game || "wingo");
  const modeKey = mode ? String(mode) : null;
  const per = String(period || "");
  const round = periodBets(gameKey, modeKey, per);
  const mine = userId ? round.filter((b) => b.userId === findUser(String(userId))?.id || b.phone === String(userId)) : round;
  const potPaisa = round.reduce((s, b) => s + toPaisa(b.amount), 0);
  const settled = round.length > 0 && round.every((b) => b.status !== "pending");
  const winningStakePaisa = round.filter((b) => b.status === "won").reduce((s, b) => s + toPaisa(b.amount), 0);
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
        payout: b.payout
      })),
      winningStake: toRupees(winningStakePaisa)
    }
  });
});
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(distDir, "index.html"), (err) => {
    if (err) next();
  });
});
readyPromise = initStore().then(() => {
  catchUpAviatorClock();
  startAviatorClock();
  startWingoResultFlush();
  startWingoAutoSettle();
});
if (!process.env.VERCEL) {
  readyPromise.then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }).catch((err) => {
    console.error("Failed to initialise server:", err);
    process.exit(1);
  });
}
var server_default = app;

// scripts/apiEntry.ts
var apiEntry_default = server_default;
export {
  apiEntry_default as default
};
