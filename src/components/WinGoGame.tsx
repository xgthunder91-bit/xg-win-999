import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  Headphones,
  Volume2,
  VolumeX,
  RefreshCw,
  Wallet,
  BookOpen,
  Check,
  ChevronRight,
  Users,
  ChevronDown,
} from 'lucide-react';
import { MaanWinLogo, CasinoBall } from './BrandLogo';
import { DP_AVATARS } from './GameArtwork';
import { BetResultOverlay } from './BetResultOverlay';
import { periodInfo, deterministicDigit, WINGO_MODE_KEYS, WINGO_MODES } from '../utils/wingoMath';
import { apiGet } from '../utils/api';
import { reportBet } from '../utils/track';

export type WinGoMode = '30s' | '1m' | '3m' | '5m';

export interface WinGoHistoryItem {
  period: string;
  number: number;
  bigSmall: 'Big' | 'Small';
  colors: ('green' | 'red' | 'violet')[];
}

export interface MyBetItem {
  id: string;
  orderId: string;
  mode: WinGoMode;
  period: string;
  time: string;
  selection: string;
  badgeColor: string;
  status: 'Win' | 'Lose' | 'Pending';
  betAmount: number;
  baseAmount: number;
  quantity: number;
  taxAmount: number;
  afterTaxAmount: number;
  winAmount: number;
  amountText: string;
  outcome?: WinGoHistoryItem;
}

export interface SettlementPopupData {
  id: string;
  mode: WinGoMode;
  period: string;
  outcome: WinGoHistoryItem;
  won: boolean;
  winAmount: number;
  lossAmount: number;
  selection: string;
}

// Sound effects synthesizer using Web Audio API
function playGameSound(type: 'tick' | 'bet' | 'win' | 'loss', muted: boolean) {
  if (muted || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'bet') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.07);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'win') {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.12, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.35);
      });
    } else if (type === 'loss') {
      const notes = [392.0, 349.23, 311.13];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.11);
        gain.gain.setValueAtTime(0.09, now + idx * 0.11);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.11);
        osc.stop(now + idx * 0.11 + 0.28);
      });
    }
  } catch {
    // Ignore audio errors if browser blocks autoplay
  }
}

// Unpredictable cryptographic random digit 0..9
function getCryptoRandomDigit(): number {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    const maxValid = Math.floor(0xffffffff / 10) * 10;
    let val = 0xffffffff;
    while (val >= maxValid) {
      window.crypto.getRandomValues(array);
      val = array[0];
    }
    return val % 10;
  }
  return Math.floor(Math.random() * 10);
}

function createOutcomeForDigit(period: string, num: number): WinGoHistoryItem {
  const bigSmall: 'Big' | 'Small' = num >= 5 ? 'Big' : 'Small';
  const colors: ('green' | 'red' | 'violet')[] =
    num === 0
      ? ['red', 'violet']
      : num === 5
        ? ['green', 'violet']
        : [1, 3, 7, 9].includes(num)
          ? ['green']
          : ['red'];
  return { period, number: num, bigSmall, colors };
}

const MODE_CONFIG: Record<
  WinGoMode,
  {
    duration: number;
    prefix: string;
    initialCounter: number;
    initialTimeLeft: number;
  }
> = (() => {
  const at = Date.now();
  const build = (m: WinGoMode) => {
    const info = periodInfo(m, at);
    return {
      duration: WINGO_MODES[m].duration,
      prefix: WINGO_MODES[m].prefix,
      initialCounter: info.counter,
      initialTimeLeft: info.timeLeft,
    };
  };
  return { '30s': build('30s'), '1m': build('1m'), '3m': build('3m'), '5m': build('5m') };
})();

function formatPeriodId(mode: WinGoMode, counter: number): string {
  return `${MODE_CONFIG[mode].prefix}${String(counter).padStart(4, '0')}`;
}

function generateInitialHistoryForMode(mode: WinGoMode, currentCounter: number): WinGoHistoryItem[] {
  const list: WinGoHistoryItem[] = [];
  for (let i = 1; i <= 500; i++) {
    const seq = Math.max(1, currentCounter - i);
    const period = formatPeriodId(mode, seq);
    const digit = deterministicDigit(period);
    list.push(createOutcomeForDigit(period, digit));
  }
  return list;
}

export interface LiveRoomBetEntry {
  id: string;
  user: string;
  avatar: string;
  selection: string;
  badgeColor: string;
  amount: number;
  isSelf?: boolean;
}

const WINGO_SELECTIONS = [
  { sel: 'Big', color: 'bg-[#ff9429]' },
  { sel: 'Small', color: 'bg-[#5294ff]' },
  { sel: 'Green', color: 'bg-[#18b660]' },
  { sel: 'Red', color: 'bg-[#fb5b5b]' },
  { sel: 'Violet', color: 'bg-[#b858ff]' },
  { sel: '7', color: 'bg-[#18b660]' },
  { sel: '0', color: 'bg-gradient-to-r from-[#fb5b5b] to-[#b858ff]' },
  { sel: '5', color: 'bg-gradient-to-r from-[#18b660] to-[#b858ff]' },
  { sel: '9', color: 'bg-[#18b660]' },
  { sel: '2', color: 'bg-[#fb5b5b]' },
  { sel: '8', color: 'bg-[#fb5b5b]' },
  { sel: '3', color: 'bg-[#18b660]' },
];

const BET_AMOUNTS_POOL = [10, 20, 50, 100, 200, 300, 500, 1000, 2000, 5000];

function createRandomLiveRoomBet(seq: number): LiveRoomBetEntry {
  const prefixes = ['91', '98', '88', '70', '99', '82', '79', '96', '63', '95'];
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const tail = String(100 + Math.floor(Math.random() * 900));
  const pick = WINGO_SELECTIONS[Math.floor(Math.random() * WINGO_SELECTIONS.length)];
  const amount = BET_AMOUNTS_POOL[Math.floor(Math.random() * BET_AMOUNTS_POOL.length)];
  const avatar = DP_AVATARS[Math.floor(Math.random() * DP_AVATARS.length)];
  return {
    id: `${Date.now()}-${seq}-${Math.random()}`,
    user: `${p}***${tail}`,
    avatar,
    selection: pick.sel,
    badgeColor: pick.color,
    amount,
  };
}

function generateInitialLiveRoomBets(): LiveRoomBetEntry[] {
  return Array.from({ length: 6 }, (_, i) => createRandomLiveRoomBet(i));
}

interface RoomState {
  counter: number;
  timeLeft: number;
  history: WinGoHistoryItem[];
  onlinePlayers: number;
  betsCount: number;
  totalPool: number;
  liveRoomBets: LiveRoomBetEntry[];
}

// Persistent module-level live engine so all 4 rooms run non-stop forever even when navigating away
const LIVE_ROOMS: Record<WinGoMode, RoomState> = {
  '30s': {
    counter: MODE_CONFIG['30s'].initialCounter,
    timeLeft: MODE_CONFIG['30s'].initialTimeLeft,
    history: generateInitialHistoryForMode('30s', MODE_CONFIG['30s'].initialCounter),
    onlinePlayers: 1180,
    betsCount: 1428,
    totalPool: 342850,
    liveRoomBets: generateInitialLiveRoomBets(),
  },
  '1m': {
    counter: MODE_CONFIG['1m'].initialCounter,
    timeLeft: MODE_CONFIG['1m'].initialTimeLeft,
    history: generateInitialHistoryForMode('1m', MODE_CONFIG['1m'].initialCounter),
    onlinePlayers: 940,
    betsCount: 982,
    totalPool: 264120,
    liveRoomBets: generateInitialLiveRoomBets(),
  },
  '3m': {
    counter: MODE_CONFIG['3m'].initialCounter,
    timeLeft: MODE_CONFIG['3m'].initialTimeLeft,
    history: generateInitialHistoryForMode('3m', MODE_CONFIG['3m'].initialCounter),
    onlinePlayers: 720,
    betsCount: 745,
    totalPool: 198400,
    liveRoomBets: generateInitialLiveRoomBets(),
  },
  '5m': {
    counter: MODE_CONFIG['5m'].initialCounter,
    timeLeft: MODE_CONFIG['5m'].initialTimeLeft,
    history: generateInitialHistoryForMode('5m', MODE_CONFIG['5m'].initialCounter),
    onlinePlayers: 560,
    betsCount: 618,
    totalPool: 168900,
    liveRoomBets: generateInitialLiveRoomBets(),
  },
};

let MY_BETS_STORE: MyBetItem[] = [];

function evaluateBetWin(selection: string, outcome: WinGoHistoryItem, betAmount: number): {
  won: boolean;
  payout: number;
} {
  if (selection === 'Big' && outcome.bigSmall === 'Big') {
    return { won: true, payout: +(betAmount * 1.96).toFixed(2) };
  }
  if (selection === 'Small' && outcome.bigSmall === 'Small') {
    return { won: true, payout: +(betAmount * 1.96).toFixed(2) };
  }
  if (selection === 'Green' && outcome.colors.includes('green')) {
    const mult = outcome.number === 5 ? 1.47 : 1.96;
    return { won: true, payout: +(betAmount * mult).toFixed(2) };
  }
  if (selection === 'Red' && outcome.colors.includes('red')) {
    const mult = outcome.number === 0 ? 1.47 : 1.96;
    return { won: true, payout: +(betAmount * mult).toFixed(2) };
  }
  if (selection === 'Violet' && outcome.colors.includes('violet')) {
    return { won: true, payout: +(betAmount * 4.41).toFixed(2) };
  }
  if (String(outcome.number) === selection) {
    return { won: true, payout: +(betAmount * 8.82).toFixed(2) };
  }
  return { won: false, payout: 0 };
}

const listeners = new Set<() => void>();
const settlementListeners = new Set<(event: SettlementPopupData) => void>();
let lastTickTimestamp = Date.now();
let engineStarted = false;

const WINGO_OVERRIDE_CACHE: Record<WinGoMode, Record<string, number>> = {
  '30s': {},
  '1m': {},
  '3m': {},
  '5m': {},
};

/**
 * The admin console derives periods from the server clock, so the game has to
 * use that same clock. Without this the two panels sit on different periods
 * whenever the device clock drifts even a few seconds.
 */
let serverClockOffsetMs = 0;
let serverClockReady = false;

function syncServerClock(serverNowMs: number) {
  if (!serverNowMs) return;
  const measured = serverNowMs - Date.now();
  if (!serverClockReady) {
    serverClockOffsetMs = measured;
    serverClockReady = true;
    return;
  }
  const err = measured - serverClockOffsetMs;
  // Nudge rather than jump, so a period boundary never flickers.
  if (Math.abs(err) > 500) serverClockOffsetMs = measured;
  else serverClockOffsetMs += err * 0.1;
}

/** Now, expressed on the backend's clock. */
function serverNowMs(): number {
  return Date.now() + serverClockOffsetMs;
}

async function refreshWingoOverrides() {
  try {
    const res: any = await apiGet('/game/wingo/state/all');
    const data = res && res.data;
    if (!data) return;
    syncServerClock(Number(data.__serverNow) || 0);
    WINGO_MODE_KEYS.forEach((m) => {
      const state = data[m];
      syncServerClock(Number(state?.serverNow) || 0);
      const forced = state && state.forced;
      if (forced && forced.period && typeof forced.number === 'number') {
        WINGO_OVERRIDE_CACHE[m][forced.period] = forced.number;
      }
    });
  } catch {
    // offline: deterministic results remain valid
  }
}

function settlePeriod(mode: WinGoMode, room: RoomState, finishedPeriod: string, record: boolean) {
  const forced = WINGO_OVERRIDE_CACHE[mode][finishedPeriod];
  const digit = typeof forced === 'number' ? forced : deterministicDigit(finishedPeriod);
  const newOutcome = createOutcomeForDigit(finishedPeriod, digit);

  if (record) {
    room.history = [newOutcome, ...room.history.slice(0, 499)];
  }

  let hadPendingBets = false;
  let totalWonPayout = 0;
  let totalLostBetAmount = 0;
  let lastSelection = '';

  MY_BETS_STORE = MY_BETS_STORE.map((b) => {
    if (b.status === 'Pending' && b.period === finishedPeriod && b.mode === mode) {
      hadPendingBets = true;
      lastSelection = b.selection;
      const res = evaluateBetWin(b.selection, newOutcome, b.betAmount);
      if (res.won) {
        totalWonPayout = +(totalWonPayout + res.payout).toFixed(2);
      } else {
        totalLostBetAmount = +(totalLostBetAmount + b.betAmount).toFixed(2);
      }
      return {
        ...b,
        status: res.won ? 'Win' : 'Lose',
        winAmount: res.won ? res.payout : 0,
        outcome: newOutcome,
        amountText: res.won ? `+₹${res.payout.toFixed(2)}` : `-₹${b.betAmount.toFixed(2)}`,
      };
    }
    return b;
  });

  if (hadPendingBets) {
    const eventData: SettlementPopupData = {
      id: `${finishedPeriod}-${Date.now()}`,
      mode,
      period: finishedPeriod,
      outcome: newOutcome,
      won: totalWonPayout > 0,
      winAmount: totalWonPayout,
      lossAmount: totalLostBetAmount,
      selection: lastSelection,
    };
    settlementListeners.forEach((cb) => cb(eventData));
  }
}

function startGlobalWinGoEngine() {
  if (engineStarted || typeof window === 'undefined') return;
  engineStarted = true;
  lastTickTimestamp = Date.now();

  void refreshWingoOverrides();
  setInterval(() => {
    void refreshWingoOverrides();
  }, 1500);

  setInterval(() => {
    const now = Date.now();

    WINGO_MODE_KEYS.forEach((m) => {
      const room = LIVE_ROOMS[m];
      const minOnline = m === '30s' ? 620 : m === '1m' ? 540 : m === '3m' ? 440 : 380;
      const maxOnline = m === '30s' ? 3400 : m === '1m' ? 2600 : m === '3m' ? 1900 : 1500;
      const step = Math.floor(Math.random() * 180) - 80;
      room.onlinePlayers = Math.min(maxOnline, Math.max(minOnline, room.onlinePlayers + step));

      const info = periodInfo(m, serverNowMs());
      const missed = info.counter - room.counter;

      if (missed > 0) {
        if (missed <= 5) {
          for (let c = room.counter; c < info.counter; c++) {
            settlePeriod(m, room, formatPeriodId(m, c), true);
          }
        } else {
          // Tab was inactive for a long while — rebuild recent history deterministically
          room.history = generateInitialHistoryForMode(m, info.counter);
          for (let c = Math.max(room.counter, info.counter - 3); c < info.counter; c++) {
            settlePeriod(m, room, formatPeriodId(m, c), false);
          }
        }

        room.betsCount = 85 + Math.floor(Math.random() * 65);
        room.totalPool = room.betsCount * (140 + Math.floor(Math.random() * 90));
        room.liveRoomBets = generateInitialLiveRoomBets();
      }

      room.counter = info.counter;
      room.timeLeft = info.timeLeft;

      // Feeds the "Live Player Bets" panel. The panel itself is collapsed by
      // default, so this only fills the list the user opens on demand.
      if (room.timeLeft > 5) {
        const addedBets = 2 + Math.floor(Math.random() * 9);
        const fresh = Array.from({ length: 1 }, (_, i) =>
          createRandomLiveRoomBet(room.betsCount + i)
        );
        room.betsCount += addedBets;
        room.totalPool +=
          addedBets * (110 + Math.floor(Math.random() * 160)) +
          fresh.reduce((s, b) => s + b.amount, 0);
        room.liveRoomBets = [...fresh, ...room.liveRoomBets.slice(0, 14)];
      }
    });

    listeners.forEach((cb) => cb());
  }, 1000);
}

startGlobalWinGoEngine();

function computeLast100Stats(history: WinGoHistoryItem[]) {
  const sample = history.slice(0, 100);
  const missing: number[] = [];
  const avgMissing: number[] = [];
  const frequency: number[] = [];
  const maxConsecutive: number[] = [];

  for (let d = 0; d <= 9; d++) {
    // Current missing (how many periods since last appearance from index 0)
    let currMiss = 0;
    for (let i = 0; i < sample.length; i++) {
      if (sample[i].number === d) break;
      currMiss++;
    }
    missing.push(currMiss);

    // Frequency, Max Consecutive, and Avg Missing
    let freq = 0;
    let maxCons = 0;
    let curCons = 0;
    let gaps = 0;
    let totalGapLen = 0;
    let curGap = 0;

    for (let i = 0; i < sample.length; i++) {
      if (sample[i].number === d) {
        freq++;
        curCons++;
        if (curCons > maxCons) maxCons = curCons;
        if (curGap > 0) {
          gaps++;
          totalGapLen += curGap;
          curGap = 0;
        }
      } else {
        curCons = 0;
        curGap++;
      }
    }
    if (curGap > 0) {
      gaps++;
      totalGapLen += curGap;
    }

    frequency.push(freq);
    maxConsecutive.push(maxCons);
    avgMissing.push(gaps > 0 ? Math.round(totalGapLen / gaps) : 10);
  }

  return { missing, avgMissing, frequency, maxConsecutive };
}

interface WinGoGameProps {
  initialMode?: WinGoMode;
  balance: number;
  onBalanceChange?: React.Dispatch<React.SetStateAction<number>>;
  onBack: () => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenSupport: () => void;
  onModeChange?: (mode: WinGoMode) => void;
}

export const WinGoGame: React.FC<WinGoGameProps> = ({
  initialMode = '30s',
  balance,
  onBalanceChange,
  onBack,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenSupport,
  onModeChange,
}) => {
  const [mode, setMode] = useState<WinGoMode>(initialMode);
  const [, setTickVersion] = useState(0);
  const [muted, setMuted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeMultiplier, setActiveMultiplier] = useState<number>(1);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'game' | 'chart' | 'my'>('game');
  const [expandedBetId, setExpandedBetId] = useState<string | null>(null);

  // Betting Modal State
  const [selectedBet, setSelectedBet] = useState<string | null>(null);
  const [baseAmount, setBaseAmount] = useState<number>(1);
  const [quantity, setQuantity] = useState<number>(1);
  const [agreedRules, setAgreedRules] = useState(true);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
const [liveBetsOpen, setLiveBetsOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Win / Loss Result Celebration Popup State
  const [resultPopup, setResultPopup] = useState<SettlementPopupData | null>(null);

  const handleCloseResultPopup = useCallback(() => {
    setResultPopup(null);
  }, []);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    startGlobalWinGoEngine();
    const onTick = () => setTickVersion((v) => v + 1);
    const onSettlement = (event: SettlementPopupData) => {
      if (event.won && event.winAmount > 0) {
        onBalanceChange?.((prev) => +(prev + event.winAmount).toFixed(2));
        playGameSound('win', muted);
      } else {
        playGameSound('loss', muted);
      }
      setResultPopup(event);
    };
    listeners.add(onTick);
    settlementListeners.add(onSettlement);
    return () => {
      listeners.delete(onTick);
      settlementListeners.delete(onSettlement);
    };
  }, [muted, onBalanceChange]);

  const currentRoom = LIVE_ROOMS[mode];
  const timeLeft = currentRoom.timeLeft;
  const currentPeriodId = formatPeriodId(mode, currentRoom.counter);
  const fullHistory = currentRoom.history;
  const stats100 = computeLast100Stats(fullHistory);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 2000);
  };

  useEffect(() => {
    if (timeLeft <= 5 && timeLeft >= 1) {
      playGameSound('tick', muted);
    }
    if (timeLeft <= 5 && selectedBet !== null) {
      setSelectedBet(null);
    }
  }, [timeLeft, selectedBet, muted]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const m1 = Math.floor(mins / 10);
  const m2 = mins % 10;
  const s1 = Math.floor(secs / 10);
  const s2 = secs % 10;

  // How much of the round has already elapsed (0 -> 100)
  const roundDuration = MODE_CONFIG[mode].duration || 30;
  const timeProgress = Math.max(0, Math.min(100, ((roundDuration - timeLeft) / roundDuration) * 100));

  const modeLabel =
    mode === '30s'
      ? 'WinGo 30sec'
      : mode === '1m'
        ? 'WinGo 1 Min'
        : mode === '3m'
          ? 'WinGo 3 Min'
          : 'WinGo 5 Min';

  const openBetSheet = (selection: string) => {
    if (timeLeft <= 5) return;
    setSelectedBet(selection);
    setBaseAmount(1);
    setQuantity(activeMultiplier);
  };

  const handleRandomPick = () => {
    if (timeLeft <= 5) return;
    const rand = getCryptoRandomDigit();
    openBetSheet(String(rand));
  };

  const totalBetAmount = baseAmount * quantity;

  const handleConfirmBet = () => {
    if (!agreedRules) {
      showToast('Please agree to Presale Rules');
      return;
    }
    if (totalBetAmount > balance) {
      showToast('Insufficient balance');
      return;
    }

    // Deduct bet amount from live wallet balance immediately
    onBalanceChange?.((prev) => Math.max(0, +(prev - totalBetAmount).toFixed(2)));
    playGameSound('bet', muted);

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
      now.getHours()
    )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const orderStamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(
      now.getHours()
    )}${pad(now.getMinutes())}${pad(now.getSeconds())}${Math.floor(100 + Math.random() * 900)}`;

    const sel = selectedBet || 'Big';
    const badgeColor = getModalBtnColor(sel);
    const taxAmt = +(totalBetAmount * 0.02).toFixed(2);
    const afterTaxAmt = +(totalBetAmount - taxAmt).toFixed(2);

    const newBetId = String(Date.now());
    MY_BETS_STORE = [
      {
        id: newBetId,
        orderId: `WG${orderStamp}`,
        mode,
        period: currentPeriodId,
        time: timeStr,
        selection: sel,
        badgeColor,
        status: 'Pending',
        betAmount: totalBetAmount,
        baseAmount,
        quantity,
        taxAmount: taxAmt,
        afterTaxAmount: afterTaxAmt,
        winAmount: 0,
        amountText: `₹${totalBetAmount.toFixed(2)}`,
      },
      ...MY_BETS_STORE,
    ];

    // Also push user's bet into the current period live room bets stream
    currentRoom.betsCount += 1;
    currentRoom.totalPool += totalBetAmount;
    currentRoom.liveRoomBets = [
      {
        id: `self-${Date.now()}`,
        user: 'You (650170)',
        avatar: DP_AVATARS[0],
        selection: sel,
        badgeColor,
        amount: totalBetAmount,
        isSelf: true,
      },
      ...currentRoom.liveRoomBets.slice(0, 5),
    ];

    reportBet('wingo', totalBetAmount, { mode, period: currentPeriodId, selection: sel });

    setSelectedBet(null);
    showToast('Bet Succeed');
  };

  const getModalTheme = (sel: string | null) => {
    if (!sel) return 'from-[#ff4b5c] to-[#ef4444]';
    if (sel === 'Green' || ['1', '3', '7', '9'].includes(sel)) {
      return 'from-[#22ad5c] to-[#10b981]';
    }
    if (sel === 'Violet') {
      return 'from-[#8b5cf6] to-[#6d28d9]';
    }
    if (sel === 'Big') {
      return 'from-[#ff9429] to-[#f57c00]';
    }
    if (sel === 'Small') {
      return 'from-[#5294ff] to-[#3b82f6]';
    }
    if (sel === '0') {
      return 'from-[#ff4b5c] via-[#d93870] to-[#8b5cf6]';
    }
    if (sel === '5') {
      return 'from-[#22ad5c] via-[#3b8296] to-[#8b5cf6]';
    }
    return 'from-[#ff4b5c] to-[#ef4444]';
  };

  const getModalBtnColor = (sel: string | null) => {
    if (!sel) return 'bg-[#ff4b5c]';
    if (sel === 'Green' || ['1', '3', '7', '9'].includes(sel)) return 'bg-[#22ad5c]';
    if (sel === 'Violet') return 'bg-[#8b5cf6]';
    if (sel === 'Big') return 'bg-[#ff9429]';
    if (sel === 'Small') return 'bg-[#5294ff]';
    return 'bg-[#ff4b5c]';
  };

  return (
    <div className="min-h-screen bg-[#111923] text-white pb-12 relative select-none">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-[#111923] px-3.5 py-2.5 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center text-slate-200 active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <MaanWinLogo size="md" />

        <div className="flex items-center gap-2">
          <a
            href="https://t.me/xgwin99"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onOpenSupport}
            title="24/7 Live Support (https://t.me/xgwin99)"
            className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center text-slate-200 cursor-pointer"
          >
            <Headphones className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={() => setMuted(!muted)}
            className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center text-slate-200 cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Curved Orange Header + Wallet Card */}
      <div className="relative px-3 pt-2 pb-3">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#ff7b1b] to-[#f56a00] rounded-b-[36px] pointer-events-none" />

        {/* Wallet Balance Card */}
        <div className="relative z-10 bg-[#1a2332] rounded-2xl p-4 shadow-xl border border-white/5 flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="font-mono-num font-extrabold text-xl text-white">
              ₹{balance === 0.24 ? '0.00' : balance.toFixed(2)}
            </span>
            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                setTimeout(() => setRefreshing(false), 600);
              }}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#ff7b1b]' : ''}`} />
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1 mb-4">
            <Wallet className="w-3.5 h-3.5 text-[#22ad5c]" />
            <span>Wallet balance</span>
          </div>

          <div className="w-full grid grid-cols-2 gap-4 px-2">
            <button
              type="button"
              onClick={onOpenWithdraw}
              className="py-2 rounded-full bg-[#ff4d5e] text-white font-bold text-sm shadow-md active:scale-95 transition-transform cursor-pointer"
            >
              Withdraw
            </button>
            <button
              type="button"
              onClick={onOpenDeposit}
              className="py-2 rounded-full bg-[#1fb155] text-white font-bold text-sm shadow-md active:scale-95 transition-transform cursor-pointer"
            >
              Deposit
            </button>
          </div>
        </div>
      </div>

      {/* 4 Mode Tabs (WinGo 30sec, 1 Min, 3 Min, 5 Min) with Live Online Count */}
      <div className="px-3 mb-3">
        <div className="bg-[#1a2332] rounded-2xl p-1 grid grid-cols-4 gap-1 border border-white/5">
          {[
            { id: '30s' as WinGoMode, label: 'WinGo\n30sec' },
            { id: '1m' as WinGoMode, label: 'WinGo 1\nMin' },
            { id: '3m' as WinGoMode, label: 'WinGo 3\nMin' },
            { id: '5m' as WinGoMode, label: 'WinGo 5\nMin' },
          ].map((item) => {
            const isActive = mode === item.id;
            const roomOnline = LIVE_ROOMS[item.id].onlinePlayers;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  const nextMode = item.id;
                  setMode(nextMode);
                  onModeChange?.(nextMode);
                }}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-b from-[#34d399] to-[#10b981] text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                    isActive ? 'bg-white/25' : 'bg-slate-700/60'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isActive ? 'border-white' : 'border-slate-400'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-slate-400'}`} />
                  </div>
                </div>
                <span className="text-[11px] font-bold leading-tight text-center whitespace-pre-line">
                  {item.label}
                </span>
                <span
                  className={`mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono-num font-bold flex items-center gap-1 ${
                    isActive ? 'bg-black/25 text-white' : 'bg-black/30 text-emerald-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                  {roomOnline.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orange Ticket Banner: How To Play + Time Remaining */}
      <div className="px-3 mb-3">
        <div className="bg-gradient-to-r from-[#ff8c1a] via-[#ff7b00] to-[#ff9914] rounded-2xl p-3 relative overflow-hidden flex items-center justify-between shadow-lg">
          <div className="w-4 h-4 rounded-full bg-[#111923] absolute -top-2 left-1/2 -translate-x-1/2" />
          <div className="w-4 h-4 rounded-full bg-[#111923] absolute -bottom-2 left-1/2 -translate-x-1/2" />
          <div className="h-full border-l border-dashed border-white/40 absolute top-0 left-1/2 -translate-x-1/2" />

          {/* Left Half */}
          <div className="w-[48%] pr-2">
            <div className="flex items-center gap-1 mb-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setHowToPlayOpen(true)}
                className="py-1 px-2 rounded-full border border-white/70 flex items-center justify-center gap-1 text-[10px] font-semibold text-white cursor-pointer hover:bg-white/10"
              >
                <BookOpen className="w-3 h-3" />
                <span>Rules</span>
              </button>
            </div>
            <div className="text-xs font-bold text-white mb-1.5">{modeLabel}</div>
            <div className="flex items-center gap-1">
              {fullHistory.slice(0, 5).map((h) => (
                <span key={h.period} className="anim-ball-pop">
                <CasinoBall num={h.number} size="xs" />
              </span>
              ))}
            </div>
          </div>

          {/* Right Half */}
          <div className="w-[48%] pl-2 flex flex-col items-end">
            <div className="text-xs font-bold text-white mb-1">Time remaining</div>
            <div className="flex items-center gap-1 mb-1.5">
              <span className="bg-white text-[#ff6700] font-mono-num font-extrabold text-base w-6 h-7 rounded flex items-center justify-center shadow">
                {m1}
              </span>
              <span className="bg-white text-[#ff6700] font-mono-num font-extrabold text-base w-6 h-7 rounded flex items-center justify-center shadow">
                {m2}
              </span>
              <span className="bg-white text-[#ff6700] font-mono-num font-extrabold text-base w-4 h-7 rounded flex items-center justify-center shadow">
                :
              </span>
              <span
                className={`bg-white text-[#ff6700] font-mono-num font-extrabold text-base w-6 h-7 rounded flex items-center justify-center shadow ${
                  timeLeft <= 5 ? 'anim-countdown-tick' : ''
                }`}
              >
                {s1}
              </span>
              <span
                className={`bg-white text-[#ff6700] font-mono-num font-extrabold text-base w-6 h-7 rounded flex items-center justify-center shadow ${
                  timeLeft <= 5 ? 'anim-countdown-tick' : ''
                }`}
              >
                {s2}
              </span>
            </div>
            <div className="font-mono-num text-[11px] font-bold text-white tracking-tight">
              {currentPeriodId}
            </div>
          </div>

          {/* Animated time progress bar */}
          <div className="absolute left-0 right-0 bottom-0 h-1 bg-black/20">
            <div
              className="h-full bg-gradient-to-r from-white via-[#fff3d6] to-white transition-[width] duration-1000 ease-linear"
              style={{ width: `${timeProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Live Winners Ticker removed - the scrolling fake wins feed was noise. */}

      {/* Betting Board Container */}
      <div className="px-3 mb-3">
        <div className="bg-[#1a2332] rounded-2xl p-3 relative overflow-hidden border border-white/5">
          {/* Live Players Online & Current Period Bets Bar */}
          <div className="bg-[#111722] rounded-xl px-2.5 py-2 mb-3 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {DP_AVATARS.slice(0, 3).map((av, idx) => (
                  <img
                    key={idx}
                    src={av}
                    alt="p"
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover border border-[#111722]"
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="font-mono-num text-xs font-extrabold text-white">
                  {currentRoom.onlinePlayers.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400">Playing</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <div className="font-mono-num text-xs font-extrabold text-[#ff9429]">
                  {currentRoom.betsCount.toLocaleString()} Bets
                </div>
                <div className="text-[9px] text-slate-400 leading-none">Current Period</div>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="text-right">
                <div className="font-mono-num text-xs font-extrabold text-[#22c55e]">
                  ₹{currentRoom.totalPool.toLocaleString('en-IN')}
                </div>
                <div className="text-[9px] text-slate-400 leading-none">Total Pool</div>
              </div>
            </div>
          </div>

          {/* 5-Second Giant Countdown Lock Overlay (00:38 - 00:43 in video) */}
          {timeLeft <= 5 && (
            <div className="absolute inset-0 z-20 bg-black/75 backdrop-blur-[2px] flex items-center justify-center gap-5">
              <div className="w-28 h-40 rounded-2xl bg-gradient-to-b from-[#1c2740] to-[#111a29] border border-white/10 shadow-2xl flex items-center justify-center font-mono-num font-extrabold text-[96px] text-[#ff7300] anim-glow-pulse">
                0
              </div>
              <div className="w-28 h-40 rounded-2xl bg-gradient-to-b from-[#1c2740] to-[#111a29] border border-white/10 shadow-2xl flex items-center justify-center font-mono-num font-extrabold text-[96px] text-[#ff7300]">
                <span className="anim-countdown-tick block">{timeLeft}</span>
              </div>
            </div>
          )}

          {/* Green / Violet / Red Row matching screenshot */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <button
              type="button"
              onClick={() => openBetSheet('Green')}
              className="py-2.5 bg-[#18b660] text-white font-semibold text-sm rounded-tr-2xl rounded-bl-2xl rounded-tl-xs rounded-br-xs shadow active:scale-95 transition-transform cursor-pointer"
            >
              Green
            </button>
            <button
              type="button"
              onClick={() => openBetSheet('Violet')}
              className="py-2.5 bg-[#b858ff] text-white font-semibold text-sm rounded-xl shadow active:scale-95 transition-transform cursor-pointer"
            >
              Violet
            </button>
            <button
              type="button"
              onClick={() => openBetSheet('Red')}
              className="py-2.5 bg-[#fb5b5b] text-white font-semibold text-sm rounded-tl-2xl rounded-br-2xl rounded-tr-xs rounded-bl-xs shadow active:scale-95 transition-transform cursor-pointer"
            >
              Red
            </button>
          </div>

          {/* 0 - 9 Balls Grid in Dark Navy Container matching screenshot */}
          <div className="bg-[#111622] rounded-2xl p-3 grid grid-cols-5 gap-y-2.5 gap-x-2 mb-3">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <CasinoBall
                key={num}
                num={num}
                size="md"
                onClick={() => openBetSheet(String(num))}
              />
            ))}
          </div>

          {/* Random + Multiplier Buttons */}
          <div className="flex items-center justify-between gap-1 mb-3">
            <button
              type="button"
              onClick={handleRandomPick}
              className="px-2.5 py-1.5 rounded-lg border border-[#ef4444] text-[#ef4444] text-xs font-semibold active:scale-95 cursor-pointer"
            >
              Random
            </button>
            {[1, 5, 10, 20, 50, 100].map((mult) => (
              <button
                key={mult}
                type="button"
                onClick={() => setActiveMultiplier(mult)}
                className={`px-2 py-1.5 rounded-lg text-xs font-mono-num font-bold transition-colors cursor-pointer ${
                  activeMultiplier === mult
                    ? 'bg-[#22ad5c] text-white'
                    : 'bg-[#243044] text-slate-300'
                }`}
              >
                X{mult}
              </button>
            ))}
          </div>

          {/* Big / Small Bar */}
          <div className="grid grid-cols-2 rounded-full overflow-hidden shadow">
            <button
              type="button"
              onClick={() => openBetSheet('Big')}
              className="py-2.5 bg-[#ff9429] text-white font-bold text-sm active:opacity-90 cursor-pointer"
            >
              Big
            </button>
            <button
              type="button"
              onClick={() => openBetSheet('Small')}
              className="py-2.5 bg-[#5294ff] text-white font-bold text-sm active:opacity-90 cursor-pointer"
            >
              Small
            </button>
          </div>
        </div>
      </div>

      {/* Live Player Bets - collapsed by default, tap the header to open */}
      <div className="px-3 mb-3">
        <div className="bg-[#1a2332] rounded-2xl border border-white/5 overflow-hidden">
          <button
            type="button"
            onClick={() => setLiveBetsOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 cursor-pointer active:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-[#ff9429]" />
              <span className="text-xs font-bold text-white">Live Player Bets</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-mono-num font-bold text-emerald-400">
                LIVE
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono-num text-[11px] text-slate-400">
                {currentRoom.betsCount.toLocaleString()} bets
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  liveBetsOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {liveBetsOpen && (
            <div className="px-3 pb-3">
              <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                {currentRoom.liveRoomBets.slice(0, 14).map((lb) => (
                  <div
                    key={lb.id}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs ${
                      lb.isSelf
                        ? 'bg-[#ff9429]/15 border border-[#ff9429]/40'
                        : 'bg-[#111722]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={lb.avatar}
                        alt={lb.user}
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-full object-cover border border-white/15 shrink-0"
                      />
                      <span className="font-mono-num text-slate-200 font-semibold text-[11px] truncate">
                        {lb.user}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md text-white font-bold text-[10px] min-w-[44px] text-center shadow shrink-0 ${lb.badgeColor}`}
                    >
                      {lb.selection}
                    </span>

                    <span className="font-mono-num font-extrabold text-xs text-amber-400 shrink-0">
                      ₹{lb.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3 History Tabs: Game history | Chart | My history */}
      <div className="px-3 mb-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'game', label: 'Game history' },
            { id: 'chart', label: 'Chart' },
            { id: 'my', label: 'My history' },
          ].map((tab) => {
            const isAct = activeHistoryTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveHistoryTab(tab.id as 'game' | 'chart' | 'my')}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isAct
                    ? 'bg-gradient-to-r from-[#ff9429] to-[#ff6700] text-white shadow'
                    : 'bg-[#1a2332] text-slate-400'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: Game history */}
      {activeHistoryTab === 'game' && (
        <div className="px-3">
          <div className="rounded-t-xl bg-[#f57c00] text-white text-xs font-bold grid grid-cols-12 py-2.5 px-3">
            <div className="col-span-5">Period</div>
            <div className="col-span-2 text-center">Number</div>
            <div className="col-span-3 text-center">Big Small</div>
            <div className="col-span-2 text-center">Color</div>
          </div>
          <div className="bg-[#1a2332] divide-y divide-slate-800/80 rounded-b-xl max-h-[380px] overflow-y-auto">
            {fullHistory.map((row) => {
              const isGreen = [1, 3, 5, 7, 9].includes(row.number);
              return (
                <div
                  key={row.period}
                  className="grid grid-cols-12 items-center py-2.5 px-3 text-xs"
                >
                  <div className="col-span-5 font-mono-num text-slate-200 text-[11px]">
                    {row.period}
                  </div>
                  <div
                    className={`col-span-2 text-center font-mono-num font-extrabold text-xl ${
                      row.number === 0
                        ? 'text-transparent bg-clip-text bg-gradient-to-b from-[#ef4444] to-[#8b5cf6]'
                        : row.number === 5
                          ? 'text-transparent bg-clip-text bg-gradient-to-b from-[#10b981] to-[#8b5cf6]'
                          : isGreen
                            ? 'text-[#10b981]'
                            : 'text-[#ef4444]'
                    }`}
                  >
                    {row.number}
                  </div>
                  <div className="col-span-3 text-center text-slate-200 font-medium">
                    {row.bigSmall}
                  </div>
                  <div className="col-span-2 flex items-center justify-center gap-1">
                    {row.colors.map((c, idx) => (
                      <span
                        key={idx}
                        className={`w-3 h-3 rounded-full ${
                          c === 'green'
                            ? 'bg-[#10b981]'
                            : c === 'red'
                              ? 'bg-[#ef4444]'
                              : 'bg-[#8b5cf6]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 bg-[#1a2332] rounded-xl py-2.5 px-6 flex items-center justify-center">
            <span className="font-mono-num text-[11px] text-slate-400">
              Showing all {fullHistory.length} periods · scroll to view
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: Chart with Red Connecting Polyline (00:39 - 00:42 in video) */}
      {activeHistoryTab === 'chart' && (
        <div className="px-3">
          <div className="rounded-t-xl bg-[#f57c00] text-white text-xs font-bold grid grid-cols-2 py-2.5 px-4">
            <div>Period</div>
            <div className="text-center">Number</div>
          </div>

          {/* Live Dynamic Statistic (last 100 Periods) */}
          <div className="bg-[#1a2332] p-3 border-b border-slate-700/70 text-[11px]">
            <div className="text-white font-semibold mb-2">
              Statistic (last 100 Periods)
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 w-28 shrink-0">Winning Numbers</span>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <span
                      key={n}
                      className="w-4 h-4 rounded-full border border-[#ef4444] text-[#ef4444] font-mono-num text-[10px] flex items-center justify-center"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
              {[
                { label: 'Missing', vals: stats100.missing },
                { label: 'Avg missing', vals: stats100.avgMissing },
                { label: 'Frequency', vals: stats100.frequency },
                { label: 'Max consecutive', vals: stats100.maxConsecutive },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between text-slate-400">
                  <span className="w-28 shrink-0">{stat.label}</span>
                  <div className="flex items-center gap-1">
                    {stat.vals.map((v, i) => (
                      <span key={i} className="w-4 text-center font-mono-num text-[10px]">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trend Rows with SVG Red Trend Line Overlay */}
          <div className="bg-[#1a2332] divide-y divide-slate-800 rounded-b-xl relative max-h-[380px] overflow-y-auto">
            {/* SVG Red Connecting Polyline across all rows */}
            <svg
              viewBox={`0 0 218 ${Math.max(44, fullHistory.length * 44)}`}
              style={{ height: fullHistory.length * 44 }}
              className="absolute right-6 top-0 w-[218px] pointer-events-none z-10"
            >
              <polyline
                fill="none"
                stroke="#ef4444"
                strokeWidth="1.8"
                points={fullHistory
                  .map((r, rowIdx) => {
                    const x = 14 + r.number * 20;
                    const y = 22 + rowIdx * 44;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
            </svg>

            {fullHistory.map((row) => (
              <div
                key={row.period}
                className="h-[44px] flex items-center justify-between px-2.5 text-[10px] relative z-20"
              >
                <span className="font-mono-num text-slate-300 shrink-0">{row.period}</span>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
                    const isHit = row.number === n;
                    return (
                      <span
                        key={n}
                        className={`w-4 h-4 rounded-full font-mono-num text-[9px] flex items-center justify-center ${
                          isHit
                            ? n === 0 || n === 5
                              ? 'bg-[#8b5cf6] text-white font-bold shadow'
                              : [1, 3, 7, 9].includes(n)
                                ? 'bg-[#10b981] text-white font-bold shadow'
                                : 'bg-[#ef4444] text-white font-bold shadow'
                            : 'border border-slate-600 bg-[#1a2332] text-slate-500'
                        }`}
                      >
                        {n}
                      </span>
                    );
                  })}
                  <span
                    className={`w-4 h-4 rounded-full font-bold text-[9px] flex items-center justify-center ml-0.5 ${
                      row.bigSmall === 'Big'
                        ? 'bg-[#ff9429] text-white'
                        : 'bg-[#5294ff] text-white'
                    }`}
                  >
                    {row.bigSmall === 'Big' ? 'B' : 'S'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 bg-[#1a2332] rounded-xl py-2.5 px-6 flex items-center justify-center">
            <span className="font-mono-num text-[11px] text-slate-400">
              Showing all {fullHistory.length} periods · scroll to view
            </span>
          </div>
        </div>
      )}

      {/* TAB 3: My history (00:44 - 00:46 in video) */}
      {activeHistoryTab === 'my' && (
        <div className="px-3">
          <div className="bg-[#1a2332] rounded-2xl p-3">
            <div className="flex justify-end mb-2">
              <button
                type="button"
                className="px-3 py-1 rounded-lg border border-slate-600 text-xs text-slate-300 flex items-center gap-1"
              >
                <span>More</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-800/80">
              {MY_BETS_STORE.map((item) => {
                const isExpanded = expandedBetId === item.id;
                return (
                  <div key={item.id} className="py-3">
                    <div
                      onClick={() => setExpandedBetId(isExpanded ? null : item.id)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg ${item.badgeColor} flex items-center justify-center text-white font-bold text-xs shadow`}
                        >
                          {item.selection}
                        </div>
                        <div>
                          <div className="font-mono-num text-xs font-semibold text-white">
                            {item.period}
                          </div>
                          <div className="font-mono-num text-[10px] text-slate-400 mt-0.5">
                            {item.time}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        {item.status !== 'Pending' ? (
                          <>
                            <span
                              className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${
                                item.status === 'Win'
                                  ? 'border-[#10b981] text-[#10b981]'
                                  : 'border-[#ef4444] text-[#ef4444]'
                              }`}
                            >
                              {item.status === 'Win' ? 'Succeed' : 'Failed'}
                            </span>
                            <span
                              className={`font-mono-num text-xs font-bold mt-1 ${
                                item.status === 'Win' ? 'text-[#10b981]' : 'text-[#ef4444]'
                              }`}
                            >
                              {item.amountText}
                            </span>
                          </>
                        ) : (
                          <span className="px-2 py-0.5 rounded border border-amber-400/80 text-amber-400 text-[10px] font-semibold animate-pulse">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] space-y-1.5 text-slate-300 bg-[#131b27] rounded-xl p-3">
                        <div className="text-xs font-bold text-white mb-1">Details</div>
                        <div className="flex justify-between py-1 px-2 bg-[#1a2434] rounded">
                          <span className="text-slate-400">Order number</span>
                          <span className="font-mono-num text-slate-200">{item.orderId}</span>
                        </div>
                        <div className="flex justify-between py-1 px-2 bg-[#1a2434] rounded">
                          <span className="text-slate-400">Period</span>
                          <span className="font-mono-num text-slate-200">{item.period}</span>
                        </div>
                        <div className="flex justify-between py-1 px-2 bg-[#1a2434] rounded">
                          <span className="text-slate-400">Purchase amount</span>
                          <span className="font-mono-num text-slate-200">₹{item.betAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-1 px-2 bg-[#1a2434] rounded">
                          <span className="text-slate-400">Quantity</span>
                          <span className="font-mono-num text-slate-200">{item.quantity}</span>
                        </div>
                        <div className="flex justify-between py-1 px-2 bg-[#1a2434] rounded">
                          <span className="text-slate-400">Amount after tax</span>
                          <span className="font-mono-num text-[#ef4444]">₹{item.afterTaxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-1 px-2 bg-[#1a2434] rounded">
                          <span className="text-slate-400">Tax</span>
                          <span className="font-mono-num text-slate-200">₹{item.taxAmount.toFixed(2)}</span>
                        </div>
                        {item.outcome && (
                          <div className="flex justify-between py-1 px-2 bg-[#1a2434] rounded">
                            <span className="text-slate-400">Result</span>
                            <span className="font-mono-num font-bold text-white">
                              {item.outcome.number}{' '}
                              <span className="text-[#10b981] capitalize">
                                {item.outcome.colors.join(', ')}
                              </span>{' '}
                              <span className="text-[#ff9429]">{item.outcome.bigSmall}</span>
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between py-1 px-2 bg-[#1a2434] rounded">
                          <span className="text-slate-400">Select</span>
                          <span className="font-bold text-white">{item.selection}</span>
                        </div>
                        <div className="flex justify-between py-1 px-2 bg-[#1a2434] rounded">
                          <span className="text-slate-400">Status</span>
                          <span
                            className={`font-bold ${
                              item.status === 'Win'
                                ? 'text-[#10b981]'
                                : item.status === 'Pending'
                                  ? 'text-amber-400'
                                  : 'text-[#ef4444]'
                            }`}
                          >
                            {item.status === 'Win'
                              ? 'Succeed'
                              : item.status === 'Pending'
                                ? 'Pending'
                                : 'Failed'}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 px-2 bg-[#1a2434] rounded">
                          <span className="text-slate-400">Win/lose</span>
                          <span
                            className={`font-mono-num font-bold ${
                              item.status === 'Win'
                                ? 'text-[#10b981]'
                                : item.status === 'Pending'
                                  ? 'text-amber-400'
                                  : 'text-[#ef4444]'
                            }`}
                          >
                            {item.status === 'Pending' ? '--' : item.amountText}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 px-2 bg-[#1a2434] rounded">
                          <span className="text-slate-400">Order time</span>
                          <span className="font-mono-num text-slate-200">{item.time}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-center gap-6">
              <button
                type="button"
                className="w-8 h-8 rounded-lg bg-[#243044] text-slate-400 flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono-num text-xs text-slate-300">1/4</span>
              <button
                type="button"
                className="w-8 h-8 rounded-lg bg-[#ff7b1b] text-white flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Green Dragon Emblem Widget on Right (00:27 - 00:55 in video) */}
      <button
        type="button"
        onClick={() => setActiveHistoryTab('chart')}
        className="fixed right-3 bottom-24 z-30 w-13 h-13 rounded-full bg-white border-2 border-amber-300 shadow-xl flex items-center justify-center active:scale-95 cursor-pointer"
      >
        <svg viewBox="0 0 50 50" className="w-10 h-10">
          <circle cx="25" cy="25" r="22" fill="#e0f2fe" />
          <path
            d="M15 32 C12 20 24 12 34 18 C28 24 36 32 24 36 C18 37 15 34 15 32 Z"
            fill="#10b981"
            stroke="#047857"
            strokeWidth="1.5"
          />
          <circle cx="28" cy="19" r="2" fill="#fde047" />
        </svg>
      </button>

      {/* BETTING BOTTOM SHEET MODAL (Exact V-chevron header & controls from video) */}
      {selectedBet !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center max-w-[430px] mx-auto">
          <div className="w-full bg-[#192231] rounded-t-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Header with V-shaped chevron cutout at bottom matching video */}
            <div className="relative pb-3">
              <div
                className={`bg-gradient-to-r ${getModalTheme(selectedBet)} pt-3.5 pb-6 px-4 text-center relative [clip-path:polygon(0_0,100%_0,100%_76%,50%_100%,0_76%)]`}
              >
                <div className="text-base font-extrabold text-white mb-2">{modeLabel}</div>
                <div className="bg-white text-slate-900 font-bold text-xs py-1.5 px-10 rounded-md inline-block shadow">
                  Select {selectedBet}
                </div>
              </div>
            </div>

            <div className="px-4 pt-1 pb-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Balance</span>
                <div className="flex items-center gap-1.5">
                  {[1, 10, 100, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setBaseAmount(amt)}
                      className={`px-3 py-1.5 rounded font-mono-num text-xs font-bold cursor-pointer transition-colors ${
                        baseAmount === amt
                          ? `${getModalBtnColor(selectedBet)} text-white shadow`
                          : 'bg-[#253042] text-slate-300'
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Quantity</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className={`w-8 h-8 rounded ${getModalBtnColor(selectedBet)} text-white font-bold text-lg flex items-center justify-center cursor-pointer active:scale-95`}
                  >
                    -
                  </button>
                  <div className="w-20 h-8 rounded bg-[#0f1621] border border-slate-700 flex items-center justify-center font-mono-num text-sm font-bold text-white">
                    {quantity}
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className={`w-8 h-8 rounded ${getModalBtnColor(selectedBet)} text-white font-bold text-lg flex items-center justify-center cursor-pointer active:scale-95`}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5">
                {[1, 5, 10, 20, 50, 100].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setQuantity(m)}
                    className={`px-2.5 py-1.5 rounded font-mono-num text-xs font-bold cursor-pointer transition-colors ${
                      quantity === m
                        ? `${getModalBtnColor(selectedBet)} text-white shadow`
                        : 'bg-[#253042] text-slate-300'
                    }`}
                  >
                    X{m}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAgreedRules(!agreedRules)}
                  className={`w-5 h-5 rounded-full flex items-center justify-center cursor-pointer ${
                    agreedRules ? 'bg-[#18b660] text-white' : 'border border-slate-500'
                  }`}
                >
                  {agreedRules && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
                <span className="text-xs text-slate-200">I agree</span>
                <span className="text-xs text-[#ef4444]">《Pre-sale rules》</span>
              </div>
            </div>

            <div className="grid grid-cols-12">
              <button
                type="button"
                onClick={() => setSelectedBet(null)}
                className="col-span-4 py-3.5 bg-[#253042] text-slate-400 font-semibold text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBet}
                className={`col-span-8 py-3.5 ${getModalBtnColor(selectedBet)} text-white font-bold text-sm cursor-pointer`}
              >
                Total amount ₹{totalBetAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable BetResultOverlay for Win ("Congratulations") & Loss ("Sorry") */}
      <BetResultOverlay
        key={resultPopup?.id || (resultPopup ? `${resultPopup.period}-${resultPopup.won}` : 'idle')}
        open={Boolean(resultPopup)}
        won={Boolean(resultPopup?.won)}
        amount={resultPopup ? (resultPopup.won ? resultPopup.winAmount : resultPopup.lossAmount) : 0}
        gameTitle={modeLabel}
        selectionText={resultPopup?.selection}
        lotteryResult={resultPopup?.outcome}
        periodModeText={
          resultPopup
            ? `WinGo ${
                resultPopup.mode === '30s'
                  ? '30sec'
                  : resultPopup.mode === '1m'
                    ? '1Min'
                    : resultPopup.mode === '3m'
                      ? '3Min'
                      : '5Min'
              }`
            : 'WinGo 30sec'
        }
        periodNumber={resultPopup?.period}
        onClose={handleCloseResultPopup}
      />

      {/* How To Play Modal */}
      {howToPlayOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-5 max-w-[430px] mx-auto">
          <div className="bg-[#1a2332] rounded-2xl border border-white/10 overflow-hidden w-full max-w-sm">
            <div className="bg-gradient-to-r from-[#ff9429] to-[#ff6300] py-3 px-4 text-center font-bold text-sm">
              How To Play WinGo
            </div>
            <div className="p-4 text-xs text-slate-300 space-y-2 max-h-72 overflow-y-auto leading-relaxed">
              <p>
                1 minute 1 issue, 55 seconds to order, 5 seconds waiting for the draw. It opens all
                day. The total number of trades is 1440 issues.
              </p>
              <p className="text-slate-400">
                If you spend 100 to trade, after deducting a 2% service fee, your contract amount is
                98:
              </p>
              <p>
                <b className="text-white">1. Select green:</b> if the result shows 1, 3, 7, 9 you get
                (98 × 2) 196; if the result shows 5 you get (98 × 1.5) 147.
              </p>
              <p>
                <b className="text-white">2. Select red:</b> if the result shows 2, 4, 6, 8 you get
                (98 × 2) 196; if the result shows 0 you get (98 × 1.5) 147.
              </p>
              <p>
                <b className="text-white">3. Select violet:</b> if the result shows 0 or 5 you get
                (98 × 4.5) 441.
              </p>
              <p>
                <b className="text-white">4. Select number:</b> if the result is the same as the
                number you selected you get (98 × 9) 882.
              </p>
              <p>
                <b className="text-white">5. Select big:</b> if the result shows 5, 6, 7, 8, 9 you
                get (98 × 2) 196.
              </p>
              <p>
                <b className="text-white">6. Select small:</b> if the result shows 0, 1, 2, 3, 4 you
                get (98 × 2) 196.
              </p>
            </div>
            <div className="p-3 bg-[#141c28] text-center">
              <button
                type="button"
                onClick={() => setHowToPlayOpen(false)}
                className="px-8 py-2 rounded-full bg-gradient-to-r from-[#ff9429] to-[#ff6300] text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center max-w-[430px] mx-auto">
          <div className="bg-black/85 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-2xl border border-white/10 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
            <span>{toastMsg}</span>
          </div>
        </div>
      )}
    </div>
  );
};

