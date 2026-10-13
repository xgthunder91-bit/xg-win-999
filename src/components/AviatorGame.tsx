import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  Wallet,
  Menu,
  MessageSquare,
  History,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { MaanWinLogo } from './BrandLogo';
import { DP_AVATARS } from './GameArtwork';
import { BetResultOverlay } from './BetResultOverlay';
import { apiGet } from '../utils/api';
import { reportBet } from '../utils/track';

interface AviatorGameProps {
  balance: number;
  onBalanceChange?: React.Dispatch<React.SetStateAction<number>>;
  onBack: () => void;
  onOpenDeposit: () => void;
}

export interface AviatorHistoryItem {
  id: string;
  val: string;
  num: number;
  color: string;
  badgeStyle: string;
  time: string;
}

export interface AviatorLiveBetRow {
  id: string;
  user: string;
  avatar: string;
  betNum: number;
  targetCashout: number;
  cashed: boolean;
  cashedMult: string;
  winNum: number;
  isSelf?: boolean;
}

const MAX_AVIATOR_HISTORY = 30;

// Unpredictable cryptographic random float in [0, 1)
function getCryptoRandomFloat(): number {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return arr[0] / (0xffffffff + 1);
  }
  return Math.random();
}

// Realistic unpredictable Spribe Aviator crash multiplier generator
function generateCryptoCrashMultiplier(): number {
  const r = getCryptoRandomFloat();
  if (r < 0.04) return 1.0; // instant 1.00x crash (~4% chance)
  if (r < 0.44) {
    // 1.06x to 1.99x (Blue)
    return +(1.06 + getCryptoRandomFloat() * 0.93).toFixed(2);
  }
  if (r < 0.68) {
    // 2.00x to 4.20x (Purple lower)
    return +(2.0 + getCryptoRandomFloat() * 2.2).toFixed(2);
  }
  if (r < 0.90) {
    // 4.20x to 11.80x (Purple/Pink extended flight so 4x+ top float is seen frequently)
    return +(4.2 + getCryptoRandomFloat() * 7.6).toFixed(2);
  }
  // 11.80x to 48.50x (Pink/Magenta)
  return +(11.8 + getCryptoRandomFloat() * 36.7).toFixed(2);
}

function createHistoryEntry(multNum: number, seq: number): AviatorHistoryItem {
  const color =
    multNum < 2 ? 'text-[#3498db]' : multNum < 10 ? 'text-[#9b59b6]' : 'text-[#e83e8c]';
  const badgeStyle =
    multNum < 2
      ? 'bg-[#132639] border-[#3498db]/40 text-[#3498db]'
      : multNum < 10
        ? 'bg-[#251536] border-[#9b59b6]/40 text-[#b87ce6]'
        : 'bg-[#381028] border-[#e83e8c]/50 text-[#f45ca2]';
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    id: `av-hist-${Date.now()}-${seq}-${Math.random()}`,
    val: `${multNum.toFixed(2)}x`,
    num: multNum,
    color,
    badgeStyle,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
  };
}

const SEED_MULTIPLIERS = [
  1.42, 7.46, 1.0, 2.87, 29.54, 5.2, 2.4, 1.2, 2.94, 2.78, 1.23, 4.15, 1.88, 14.62, 1.09,
  3.45, 1.67, 6.12, 1.34, 2.18, 19.4, 1.51, 3.82, 1.12, 8.74, 1.95, 2.64, 1.29, 11.8, 1.76,
];

function generateInitialHistory30(): AviatorHistoryItem[] {
  return SEED_MULTIPLIERS.slice(0, MAX_AVIATOR_HISTORY).map((m, idx) =>
    createHistoryEntry(m, idx)
  );
}

function generateRoundBets(): AviatorLiveBetRow[] {
  const letters = ['z', 'y', 'm', 'x', 'c', 'u', 'g', 'l', 'd', 'r', 's', 'a', 'k', 'v', 'p'];
  const betPool = [8000, 8000, 7800, 7500, 7400, 6900, 5500, 5000, 4200, 3500, 2500, 2000, 1500, 1000];
  return Array.from({ length: 12 }, (_, idx) => {
    const ch = letters[(idx + Math.floor(Math.random() * letters.length)) % letters.length];
    const d = Math.floor(Math.random() * 9) + 1;
    const betNum = betPool[idx % betPool.length];
    const targetCashout = +(1.14 + getCryptoRandomFloat() * 4.5).toFixed(2);
    return {
      id: `av-${Date.now()}-${idx}-${Math.random()}`,
      user: `${ch}***${d}`,
      avatar: DP_AVATARS[idx % DP_AVATARS.length],
      betNum,
      targetCashout,
      cashed: false,
      cashedMult: '',
      winNum: 0,
    };
  });
}

const TOP_X_RECORDS = [
  { date: '19.05.26 11:58', mult: '123,106.01x' },
  { date: '10.05.26 19:33', mult: '84,911.91x' },
  { date: '28.04.26 06:08', mult: '71,233.96x' },
  { date: '30.03.26 11:28', mult: '70,794.56x' },
  { date: '11.06.26 16:00', mult: '62,254.27x' },
  { date: '14.07.26 07:42', mult: '57,361.60x' },
  { date: '18.06.26 11:30', mult: '46,232.44x' },
  { date: '08.08.26 07:48', mult: '28,678.44x' },
];

const TOP_WIN_RECORDS = [
  { user: 's***5', date: '12.10.26', bet: '8,000.00', win: '800,000.00', mult: '100.00x', max: '160.80x' },
  { user: 'r***3', date: '12.10.26', bet: '8,000.00', win: '800,000.00', mult: '100.00x', max: '142.08x' },
  { user: 'a***9', date: '12.10.26', bet: '6,200.00', win: '799,986.00', mult: '129.03x', max: '193.04x' },
  { user: 'b***2', date: '12.10.26', bet: '5,300.00', win: '799,982.00', mult: '150.94x', max: '395.36x' },
];

interface UserPanelState {
  amount: number;
  mode: 'bet' | 'auto';
  queued: boolean;
  inFlight: boolean;
  cashedOut: boolean;
  cashedMult: number;
}

// Persistent Module-Level Live Aviator State — runs 24/7 even when user navigates away or doesn't bet
const AVIATOR_LIVE = {
  roundCounter: 8942105,
  gameState: 'FLYING' as 'WAITING' | 'FLYING' | 'CRASHED',
  multiplier: 1.0,
  flightElapsedMs: 0,
  crashTarget: +(8.6 + getCryptoRandomFloat() * 5.8).toFixed(2),
  phaseRemainingMs: 0,
  history: generateInitialHistory30(), // Always exactly 30 items (latest at index 0, 30th at index 29)
  onlinePlayers: 2348,
  totalRoundBets: 1695,
  activeFlightPlayers: 1689,
  totalWinInr: 55140.88,
  liveBets: generateRoundBets(),
  previousRoundBets: generateRoundBets(),
  panels: {
    1: { amount: 10, mode: 'bet', queued: false, inFlight: false, cashedOut: false, cashedMult: 0 } as UserPanelState,
    2: { amount: 10, mode: 'bet', queued: false, inFlight: false, cashedOut: false, cashedMult: 0 } as UserPanelState,
  },
  lastWinBanner: null as string | null,
};

const aviatorListeners = new Set<() => void>();
const aviatorCrashLossListeners = new Set<(lostAmount: number, crashMult: number, roundId: number) => void>();
let aviatorEngineStarted = false;

// Crash point for the next flight comes from the backend (admin can override it).
let pendingAviatorCrash: number | null = null;
let aviatorServerRoundId: number | null = null;

async function prefetchAviatorCrash() {
  try {
    const res: any = await apiGet('/game/aviator/next');
    if (res && res.data && typeof res.data.crashAt === 'number') {
      pendingAviatorCrash = res.data.crashAt;
      aviatorServerRoundId = res.data.roundId;
    }
  } catch {
    // offline: local random fallback
  }
}

function notifyAviatorListeners() {
  aviatorListeners.forEach((cb) => cb());
}

function startGlobalAviatorEngine() {
  if (aviatorEngineStarted || typeof window === 'undefined') return;
  aviatorEngineStarted = true;

  void prefetchAviatorCrash();

  const TICK_MS = 50;

  setInterval(() => {
    // Fluctuate online players occasionally
    if (Math.random() < 0.08) {
      AVIATOR_LIVE.onlinePlayers = Math.max(
        1850,
        AVIATOR_LIVE.onlinePlayers + (Math.floor(Math.random() * 25) - 11)
      );
    }

    if (AVIATOR_LIVE.gameState === 'FLYING') {
      AVIATOR_LIVE.flightElapsedMs += TICK_MS;

      // Calm, authentic Spribe Aviator multiplier progression matching the video
      const increment =
        AVIATOR_LIVE.multiplier < 1.5
          ? 0.006
          : AVIATOR_LIVE.multiplier < 2.2
            ? 0.009
            : AVIATOR_LIVE.multiplier < 4.0
              ? 0.021
              : AVIATOR_LIVE.multiplier < 10.0
                ? 0.038
                : AVIATOR_LIVE.multiplier < 25.0
                  ? 0.09
                  : 0.24;

      const next = +(AVIATOR_LIVE.multiplier + increment).toFixed(2);

      if (next >= AVIATOR_LIVE.crashTarget) {
        // CRASH HAPPENS NOW!
        const finalCrash = AVIATOR_LIVE.crashTarget;
        AVIATOR_LIVE.multiplier = finalCrash;
        AVIATOR_LIVE.gameState = 'CRASHED';
        AVIATOR_LIVE.phaseRemainingMs = 2400;
        AVIATOR_LIVE.roundCounter += 1;

        // Prepend new crash multiplier at index 0 and drop the 30th (index 29) item automatically
        const newHistEntry = createHistoryEntry(finalCrash, AVIATOR_LIVE.roundCounter);
        AVIATOR_LIVE.history = [
          newHistEntry,
          ...AVIATOR_LIVE.history.slice(0, MAX_AVIATOR_HISTORY - 1),
        ];

        // Any user bet still inFlight without cashing out is lost on crash
        let totalCrashLoss = 0;
        ([1, 2] as const).forEach((pid) => {
          if (AVIATOR_LIVE.panels[pid].inFlight && !AVIATOR_LIVE.panels[pid].cashedOut) {
            totalCrashLoss += AVIATOR_LIVE.panels[pid].amount;
            AVIATOR_LIVE.panels[pid].inFlight = false;
          }
        });
        if (totalCrashLoss > 0) {
          aviatorCrashLossListeners.forEach((cb) =>
            cb(totalCrashLoss, finalCrash, AVIATOR_LIVE.roundCounter)
          );
        }
      } else {
        AVIATOR_LIVE.multiplier = next;

        // Check which simulated players cash out at this multiplier
        AVIATOR_LIVE.liveBets = AVIATOR_LIVE.liveBets.map((r) => {
          if (!r.cashed && !r.isSelf && next >= r.targetCashout) {
            const winAmount = +(r.betNum * next).toFixed(2);
            return {
              ...r,
              cashed: true,
              cashedMult: `${next.toFixed(2)}x`,
              winNum: winAmount,
            };
          }
          return r;
        });

        if (Math.random() < 0.35) {
          AVIATOR_LIVE.activeFlightPlayers = Math.max(
            95,
            AVIATOR_LIVE.activeFlightPlayers - Math.floor(Math.random() * 10)
          );
          AVIATOR_LIVE.totalWinInr = +(AVIATOR_LIVE.totalWinInr + Math.random() * 2600).toFixed(2);
        }
      }
    } else if (AVIATOR_LIVE.gameState === 'CRASHED') {
      AVIATOR_LIVE.phaseRemainingMs -= TICK_MS;
      if (AVIATOR_LIVE.phaseRemainingMs <= 0) {
        // Transition CRASHED -> WAITING
        AVIATOR_LIVE.previousRoundBets = AVIATOR_LIVE.liveBets;
        AVIATOR_LIVE.totalRoundBets = 165 + Math.floor(Math.random() * 60);
        AVIATOR_LIVE.activeFlightPlayers = AVIATOR_LIVE.totalRoundBets;
        AVIATOR_LIVE.totalWinInr = 0;
        AVIATOR_LIVE.liveBets = generateRoundBets();
        AVIATOR_LIVE.gameState = 'WAITING';
        AVIATOR_LIVE.phaseRemainingMs = 2700;
      }
    } else if (AVIATOR_LIVE.gameState === 'WAITING') {
      AVIATOR_LIVE.phaseRemainingMs -= TICK_MS;
      // Climb live bets while waiting for next takeoff
      const added = 24 + Math.floor(Math.random() * 35);
      AVIATOR_LIVE.totalRoundBets += added;
      AVIATOR_LIVE.activeFlightPlayers = AVIATOR_LIVE.totalRoundBets;

      if (AVIATOR_LIVE.phaseRemainingMs <= 0) {
        // Transition WAITING -> FLYING
        AVIATOR_LIVE.multiplier = 1.0;
        AVIATOR_LIVE.flightElapsedMs = 0;
        AVIATOR_LIVE.crashTarget =
          pendingAviatorCrash != null ? pendingAviatorCrash : generateCryptoCrashMultiplier();
        if (typeof aviatorServerRoundId === 'number') {
          AVIATOR_LIVE.roundCounter = aviatorServerRoundId;
        }
        pendingAviatorCrash = null;
        void prefetchAviatorCrash();
        AVIATOR_LIVE.gameState = 'FLYING';

        // Activate any queued user bets for this flight
        ([1, 2] as const).forEach((pid) => {
          const p = AVIATOR_LIVE.panels[pid];
          if (p.queued) {
            p.queued = false;
            p.inFlight = true;
            p.cashedOut = false;
            p.cashedMult = 0;
            AVIATOR_LIVE.liveBets = [
              {
                id: `self-${pid}-${Date.now()}`,
                user: `You (Panel ${pid})`,
                avatar: DP_AVATARS[0],
                betNum: p.amount,
                targetCashout: 999,
                cashed: false,
                cashedMult: '',
                winNum: 0,
                isSelf: true,
              },
              ...AVIATOR_LIVE.liveBets.slice(0, 11),
            ];
          } else {
            p.inFlight = false;
            p.cashedOut = false;
          }
        });
      }
    }

    notifyAviatorListeners();
  }, TICK_MS);
}

startGlobalAviatorEngine();

export const AviatorGame: React.FC<AviatorGameProps> = ({
  balance,
  onBalanceChange,
  onBack,
  onOpenDeposit,
}) => {
  const [, setTick] = useState(0);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [overlayResult, setOverlayResult] = useState<{
    won: boolean;
    amount: number;
    multText: string;
    roundId: number;
  } | null>(null);

  const handleCloseOverlay = useCallback(() => {
    setOverlayResult(null);
  }, []);

  // Web Audio API refs for realistic continuous Spribe Aviator propeller engine & flight SFX
  const audioCtxRef = useRef<AudioContext | null>(null);
  const engineOscRef = useRef<OscillatorNode | null>(null);
  const propSubOscRef = useRef<OscillatorNode | null>(null);
  const lfoOscRef = useRef<OscillatorNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const prevGameStateRef = useRef<'WAITING' | 'FLYING' | 'CRASHED'>(AVIATOR_LIVE.gameState);

  // Bottom Leaderboard Tabs
  const [bottomTab, setBottomTab] = useState<'all' | 'previous' | 'top'>('all');
  const [topSubTab, setTopSubTab] = useState<'x' | 'win' | 'rounds'>('x');
  const [topTimeTab, setTopTimeTab] = useState<'day' | 'month' | 'year'>('day');

  // Stop & clean up continuous engine nodes
  const stopEngineLoop = () => {
    try {
      engineOscRef.current?.stop();
      engineOscRef.current?.disconnect();
    } catch {
      // ignore if already stopped
    }
    try {
      propSubOscRef.current?.stop();
      propSubOscRef.current?.disconnect();
    } catch {
      // ignore
    }
    try {
      lfoOscRef.current?.stop();
      lfoOscRef.current?.disconnect();
    } catch {
      // ignore
    }
    engineOscRef.current = null;
    propSubOscRef.current = null;
    lfoOscRef.current = null;
    masterGainRef.current = null;
  };

  // Start synthesized propeller aircraft engine hum + rhythmic blade chop
  const startEngineLoop = (ctx: AudioContext) => {
    stopEngineLoop();
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    const initialGain = AVIATOR_LIVE.gameState === 'FLYING' ? 0.11 : 0.025;
    masterGain.gain.exponentialRampToValueAtTime(initialGain, now + 0.25);

    // Low-pass filter to keep the engine warm and non-harsh
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(290, now);
    filter.Q.setValueAtTime(2.2, now);

    // Main engine drone oscillator
    const engineOsc = ctx.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.setValueAtTime(74, now);

    // Sub-harmonic turbine body oscillator
    const propSubOsc = ctx.createOscillator();
    propSubOsc.type = 'triangle';
    propSubOsc.frequency.setValueAtTime(37, now);

    // Propeller blade chop LFO modulating filter cutoff
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(14, now);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(85, now);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    engineOsc.connect(filter);
    propSubOsc.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    engineOsc.start(now);
    propSubOsc.start(now);
    lfo.start(now);

    engineOscRef.current = engineOsc;
    propSubOscRef.current = propSubOsc;
    lfoOscRef.current = lfo;
    masterGainRef.current = masterGain;
  };

  // Play fly-away whoosh effect when plane crashes / flies away
  const playFlyAwayWhoosh = (ctx: AudioContext) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(85, now + 0.48);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.52);
  };

  // Play cashout win chime when user cashes out while sound is enabled
  const playCashoutChime = () => {
    if (!soundEnabled || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    [587.33, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.12, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.3);
    });
  };

  const handleToggleSound = () => {
    const nextEnabled = !soundEnabled;
    setSoundEnabled(nextEnabled);

    if (nextEnabled) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current) {
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume().catch(() => {});
        }
        startEngineLoop(audioCtxRef.current);
      }
    } else {
      stopEngineLoop();
    }
  };

  useEffect(() => {
    startGlobalAviatorEngine();
    const onUpdate = () => setTick((t) => t + 1);
    const onCrashLoss = (lostAmount: number, crashMult: number, roundId: number) => {
      setOverlayResult({
        won: false,
        amount: lostAmount,
        multText: `Flew Away @ ${crashMult.toFixed(2)}x`,
        roundId,
      });
    };
    aviatorListeners.add(onUpdate);
    aviatorCrashLossListeners.add(onCrashLoss);
    return () => {
      aviatorListeners.delete(onUpdate);
      aviatorCrashLossListeners.delete(onCrashLoss);
      stopEngineLoop();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  // Dynamically modulate engine pitch and volume based on live flight state and multiplier
  useEffect(() => {
    if (!soundEnabled || !audioCtxRef.current) {
      prevGameStateRef.current = AVIATOR_LIVE.gameState;
      return;
    }

    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;
    const currentState = AVIATOR_LIVE.gameState;
    const prevState = prevGameStateRef.current;

    if (!engineOscRef.current || !masterGainRef.current) {
      startEngineLoop(ctx);
    }

    if (currentState === 'FLYING') {
      // Smoothly increase pitch as jet climbs up to ~4.5x, then hold steady high-altitude cruise hum
      const climbRatio = Math.min(1, (AVIATOR_LIVE.multiplier - 1) / 3.5);
      const targetFreq = 72 + climbRatio * 46;
      engineOscRef.current?.frequency.setTargetAtTime(targetFreq, now, 0.08);
      propSubOscRef.current?.frequency.setTargetAtTime(targetFreq * 0.5, now, 0.08);
      lfoOscRef.current?.frequency.setTargetAtTime(13 + climbRatio * 7, now, 0.08);
      masterGainRef.current?.gain.setTargetAtTime(0.11, now, 0.1);
    } else if (currentState === 'CRASHED') {
      // Cut engine thrust & trigger fly-away whoosh on transition from FLYING -> CRASHED
      masterGainRef.current?.gain.setTargetAtTime(0.001, now, 0.06);
      if (prevState === 'FLYING') {
        playFlyAwayWhoosh(ctx);
      }
    } else if (currentState === 'WAITING') {
      // Subtle low idle hum while waiting on runway for next takeoff
      engineOscRef.current?.frequency.setTargetAtTime(56, now, 0.12);
      propSubOscRef.current?.frequency.setTargetAtTime(28, now, 0.12);
      lfoOscRef.current?.frequency.setTargetAtTime(9, now, 0.12);
      masterGainRef.current?.gain.setTargetAtTime(0.025, now, 0.15);
    }

    prevGameStateRef.current = currentState;
  }, [soundEnabled, AVIATOR_LIVE.gameState, AVIATOR_LIVE.multiplier]);

  const {
    gameState,
    multiplier,
    flightElapsedMs,
    history,
    onlinePlayers,
    totalRoundBets,
    activeFlightPlayers,
    totalWinInr,
    liveBets,
    previousRoundBets,
    panels,
    lastWinBanner,
    phaseRemainingMs,
  } = AVIATOR_LIVE;

  // Latest 9 crash multipliers for the top bar strip, and full 30 for the history drawer
  const latest9History = history.slice(0, 9);
  const full30History = history.slice(0, MAX_AVIATOR_HISTORY);

  const handleQueueOrCancelBet = (pid: 1 | 2) => {
    const p = AVIATOR_LIVE.panels[pid];
    if (p.inFlight && gameState === 'FLYING' && !p.cashedOut) {
      // Cash out immediately at current live multiplier!
      const cashMult = AVIATOR_LIVE.multiplier;
      const winVal = +(p.amount * cashMult).toFixed(2);
      p.cashedOut = true;
      p.inFlight = false;
      p.cashedMult = cashMult;
      onBalanceChange?.((prev) => +(prev + winVal).toFixed(2));
      AVIATOR_LIVE.totalWinInr = +(AVIATOR_LIVE.totalWinInr + winVal).toFixed(2);
      AVIATOR_LIVE.liveBets = AVIATOR_LIVE.liveBets.map((row) =>
        row.isSelf && !row.cashed
          ? {
              ...row,
              cashed: true,
              cashedMult: `${cashMult.toFixed(2)}x`,
              winNum: winVal,
            }
          : row
      );
      AVIATOR_LIVE.lastWinBanner = `Cashed Out at ${cashMult.toFixed(2)}x · Won ₹${winVal.toFixed(2)}!`;
      playCashoutChime();
      setOverlayResult({
        won: true,
        amount: winVal,
        multText: `Cashed Out @ ${cashMult.toFixed(2)}x`,
        roundId: AVIATOR_LIVE.roundCounter,
      });
      setTimeout(() => {
        AVIATOR_LIVE.lastWinBanner = null;
        notifyAviatorListeners();
      }, 2500);
      notifyAviatorListeners();
      return;
    }

    if (p.queued) {
      p.queued = false;
      onBalanceChange?.((prev) => +(prev + p.amount).toFixed(2));
      notifyAviatorListeners();
      return;
    }

    if (p.amount > balance) {
      return;
    }

    // Deduct bet amount when queuing bet
    onBalanceChange?.((prev) => Math.max(0, +(prev - p.amount).toFixed(2)));
    p.queued = true;
    reportBet('aviator', p.amount, {
      mode: 'aviator',
      selection: `Cash Out (Panel ${pid})`,
      period: String(AVIATOR_LIVE.roundCounter),
    });
    AVIATOR_LIVE.totalRoundBets += 1;
    AVIATOR_LIVE.activeFlightPlayers += 1;
    if (gameState === 'WAITING') {
      AVIATOR_LIVE.liveBets = [
        {
          id: `self-wait-${pid}-${Date.now()}`,
          user: `You (Panel ${pid})`,
          avatar: DP_AVATARS[0],
          betNum: p.amount,
          targetCashout: 999,
          cashed: false,
          cashedMult: '',
          winNum: 0,
          isSelf: true,
        },
        ...AVIATOR_LIVE.liveBets.slice(0, 11),
      ];
    }
    notifyAviatorListeners();
  };

  // Compute authentic, calm Spribe Aviator curve & red propeller jet coordinates (viewBox 360 x 190)
  // 1. Climb Phase (0 -> 8.5s, reaching top right around ~3.5x - 4.0x):
  //    Glides smoothly and steadily from bottom-left (8, 178) to the top-right peak (262, 48).
  // 2. High-Altitude Float Phase (after reaching top / > 4x):
  //    First comes slightly down very slowly (~3.4s down by 18 units), then goes back up very slowly (~3.4s up)
  //    with ZERO horizontal shaking.
  const CLIMB_DURATION_MS = 8500;
  const rawProgress = Math.min(1, flightElapsedMs / CLIMB_DURATION_MS);
  const easedProgress = 1 - Math.pow(1 - rawProgress, 1.65);

  const postClimbMs = Math.max(0, flightElapsedMs - CLIMB_DURATION_MS);
  const floatWavePhase = (postClimbMs / 6800) * Math.PI * 2;
  const gentleGlideY =
    postClimbMs > 0 ? ((1 - Math.cos(floatWavePhase)) / 2) * 18 : 0;

  const baseCurveX = 8 + easedProgress * 254;
  const baseCurveY = 178 - Math.pow(easedProgress, 1.32) * 130 + gentleGlideY;

  // During CRASHED ("FLEW AWAY!"), the jet flies smoothly forward off the right edge of the canvas
  const crashElapsedMs = gameState === 'CRASHED' ? Math.max(0, 2400 - phaseRemainingMs) : 0;
  const flyAwayFactor = Math.min(1.4, crashElapsedMs / 550);
  const jetX =
    gameState === 'WAITING'
      ? 6
      : gameState === 'CRASHED'
        ? baseCurveX + flyAwayFactor * 150
        : baseCurveX;
  const jetY =
    gameState === 'WAITING'
      ? 178
      : gameState === 'CRASHED'
        ? baseCurveY - flyAwayFactor * 36
        : baseCurveY;

  // High-speed propeller spin toggle
  const propFlip = Math.floor(Date.now() / 65) % 2 === 0;

  // Waiting countdown bar percentage (drains from 100% to 0% during WAITING)
  const waitingBarPct =
    gameState === 'WAITING' ? Math.max(0, Math.min(100, (phaseRemainingMs / 2700) * 100)) : 0;

  // Multiplier background glow color matching video (<2x cyan, >=2x purple, >=10x pink)
  const glowColorClass =
    multiplier < 2
      ? 'bg-sky-400/30'
      : multiplier < 10
        ? 'bg-purple-500/35'
        : 'bg-pink-500/40';

  // Reusable Spribe Red Propeller Jet SVG Group (origin (0,0) is at the bottom-tail contact point on the curve)
  const renderSpribeJet = (x: number, y: number, scale = 1, tiltDeg = -13) => (
    <g transform={`translate(${x}, ${y}) rotate(${tiltDeg}) scale(${scale})`}>
      {/* Soft red engine glow beneath jet */}
      <ellipse cx="32" cy="-6" rx="26" ry="9" fill="#e11d48" opacity="0.22" />

      {/* Swept Vertical Tail Fin (Rear Left) */}
      <path
        d="M 0 -2 L -4 -20 L 6 -20 L 14 -6 Z"
        fill="#e11d48"
      />
      {/* Tail Fin Dark Racing Cutout */}
      <path
        d="M -1 -17 L 4 -17 L 8 -9 L 2 -9 Z"
        fill="#0b0c0d"
      />
      {/* Horizontal Tailplane */}
      <path
        d="M -3 -3 L 10 -5 L 12 -1 L -1 0 Z"
        fill="#be123c"
      />

      {/* Main Aerobatic Fuselage Body */}
      <path
        d="M 2 -2 L 14 -11 L 28 -13 L 36 -17 L 58 -15 L 66 -11 L 64 -4 L 46 -2 L 16 -1 Z"
        fill="#e11d48"
      />

      {/* Dark Open Cockpit Canopy Silhouette & Rear Racing Stripe Cutout */}
      <path
        d="M 25 -12 C 28 -16, 36 -16, 40 -12 L 24 -10 Z"
        fill="#0b0c0d"
      />
      <path
        d="M 9 -6 L 26 -9 L 25 -6 L 8 -4 Z"
        fill="#0b0c0d"
      />
      <path
        d="M 42 -11 L 57 -11 L 55 -8 L 41 -8 Z"
        fill="#0b0c0d"
      />

      {/* Forward-Swept Low Wing with Iconic 'X' Racing Cutout */}
      <path
        d="M 22 -5 L 48 -7 L 54 1 L 30 2 Z"
        fill="#f43f5e"
      />
      <path
        d="M 24 -4 L 46 -6 L 51 0 L 29 1 Z"
        fill="#e11d48"
      />
      {/* Iconic Dark 'X' Mark on Wing */}
      <path
        d="M 35 -4 L 41 0 M 41 -4 L 35 0"
        stroke="#0b0c0d"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Pointed Red Nose Cone Spinner */}
      <path
        d="M 65 -11 L 72 -8 L 65 -5 Z"
        fill="#ff1e42"
      />

      {/* High-Speed Spinning Front Propeller Blades */}
      <g transform="translate(68, -8)">
        {/* Main Propeller Blade Line */}
        <line
          x1="2"
          y1="-14"
          x2="-2"
          y2="14"
          stroke="#ff1e42"
          strokeWidth={propFlip ? '2.4' : '1.5'}
          strokeLinecap="round"
        />
        {/* Secondary Motion-Blur Propeller Blade */}
        <line
          x1="0"
          y1="-11"
          x2="0"
          y2="11"
          stroke="#fb7185"
          strokeWidth={propFlip ? '1.2' : '2.4'}
          strokeLinecap="round"
          opacity={propFlip ? '0.65' : '0.95'}
        />
        {/* Propeller Hub Cap */}
        <circle cx="0" cy="0" r="2" fill="#ffe4e6" />
      </g>
    </g>
  );

  return (
    <div className="min-h-screen bg-[#0e0f11] text-white pb-10 select-none relative">
      {/* Cashout Win Toast Banner */}
      {lastWinBanner && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#12351a] border-2 border-[#28a909] text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-[#72f238] animate-ping" />
          <span>{lastWinBanner}</span>
        </div>
      )}

      {/* Top Maan.win Bar */}
      <header className="bg-[#141a24] px-3 py-2.5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="p-1 text-slate-200 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <MaanWinLogo size="md" />
        </div>

        <button
          type="button"
          onClick={onOpenDeposit}
          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#ff9429] to-[#ff6300] text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Deposit</span>
        </button>
      </header>

      {/* Aviator Internal Bar */}
      <div className="bg-[#18191b] px-3 py-1.5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="font-display font-black italic text-lg text-[#e11d48] tracking-tight">
            Aviator
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono-num font-bold text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            {onlinePlayers.toLocaleString()} Online
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-xs font-mono-num font-bold">
            <span className="text-[#28a909]">
              {balance === 0.24 ? '0.00' : balance.toFixed(2)}
            </span>{' '}
            <span className="text-slate-400">INR</span>
          </div>

          <button
            type="button"
            onClick={handleToggleSound}
            aria-label={soundEnabled ? 'Mute engine sound effects' : 'Unmute engine sound effects'}
            title={soundEnabled ? 'Mute Engine Sound' : 'Unmute Engine Sound'}
            className={`px-2 py-1 rounded-full border text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
              soundEnabled
                ? 'bg-[#e11d48]/20 border-[#e11d48]/60 text-[#ff4d6d] shadow-[0_0_10px_rgba(225,29,72,0.25)]'
                : 'bg-[#222326] border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#ff4d6d] animate-pulse" />
                <span>Sound On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span>Muted</span>
              </>
            )}
          </button>

          <a
            href="https://t.me/xgwin99"
            target="_blank"
            rel="noopener noreferrer"
            title="Support & Help (https://t.me/xgwin99)"
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <Menu className="w-4 h-4" />
          </a>
          <a
            href="https://t.me/xgwin99"
            target="_blank"
            rel="noopener noreferrer"
            title="Official Telegram Support (https://t.me/xgwin99)"
            className="text-slate-400 hover:text-[#38bdf8] cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Recent Multipliers Strip: Shows Latest 9 Multipliers + Button to view Last 30 */}
      <div className="px-2.5 py-1.5 bg-[#121314] relative z-20">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1">
            {latest9History.map((m, i) => (
              <span
                key={m.id}
                className={`px-2 py-0.5 rounded-full border font-mono-num text-[10px] font-bold shrink-0 transition-all ${
                  m.badgeStyle
                } ${i === 0 ? 'ring-1 ring-white/40 scale-[1.03]' : ''}`}
              >
                {m.val}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setHistoryDrawerOpen((o) => !o)}
            title="View Last 30 Rounds History"
            className={`px-2 py-1 rounded-full border text-[10px] font-mono-num font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors ${
              historyDrawerOpen
                ? 'bg-[#e11d48] border-[#e11d48] text-white'
                : 'bg-[#222326] border-white/15 text-slate-300 hover:text-white'
            }`}
          >
            <History className="w-3 h-3" />
            <span>30</span>
            {historyDrawerOpen ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>

        {/* Expandable 30-Round Rolling History Drawer */}
        {historyDrawerOpen && (
          <div className="mt-2 p-2.5 rounded-2xl bg-[#18191c] border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                <span>Round History (Latest 30 Multipliers)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono-num">
                Auto-updates on crash
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {full30History.map((m, idx) => (
                <div
                  key={m.id}
                  className={`px-2 py-0.5 rounded-full border font-mono-num text-[10px] font-bold flex items-center gap-1 ${
                    m.badgeStyle
                  } ${idx === 0 ? 'ring-1 ring-amber-400' : ''}`}
                >
                  {idx === 0 && (
                    <span className="text-[8px] bg-amber-400 text-slate-950 font-black px-1 rounded-full">
                      NEW
                    </span>
                  )}
                  <span>{m.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Flight Canvas — Exact Match to Uploaded Spribe Aviator Video */}
      <div className="px-2.5 mb-2.5">
        <div className="w-full h-56 rounded-2xl bg-[#0b0c0e] border border-white/10 relative overflow-hidden flex items-center justify-center">
          {/* Full-Bleed Rotating Sunburst Rays originating from bottom-left corner (1100px radius so edges never clip) */}
          <div
            className="w-[2200px] h-[2200px] absolute -bottom-[1100px] -left-[1100px] aviator-rays opacity-95 pointer-events-none"
            style={{
              animationPlayState: gameState === 'FLYING' ? 'running' : 'paused',
            }}
          />
          {/* Subtle inner vignette so rotating rays blend smoothly into the dark frame */}
          <div
            className="absolute inset-0 pointer-events-none z-[1]"
            style={{
              background:
                'radial-gradient(circle at 0% 100%, transparent 35%, rgba(11, 12, 14, 0.45) 100%)',
            }}
          />

          {/* SVG Layer: Curve, Shaded Area, and Spribe Red Propeller Jet */}
          <svg
            viewBox="0 0 360 190"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none z-[5]"
          >
            <defs>
              <linearGradient id="avFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e11d48" stopOpacity="0.55" />
                <stop offset="75%" stopColor="#9f1239" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#881337" stopOpacity="0.12" />
              </linearGradient>
            </defs>

            {/* Red Exponential Curve & Vertical Red Fill Area (Only during FLYING) */}
            {gameState === 'FLYING' && (
              <>
                <path
                  d={`M 0 186 Q ${baseCurveX * 0.56} 184 ${baseCurveX} ${baseCurveY} L ${baseCurveX} 186 Z`}
                  fill="url(#avFill)"
                />
                <path
                  d={`M 0 186 Q ${baseCurveX * 0.56} 184 ${baseCurveX} ${baseCurveY}`}
                  fill="none"
                  stroke="#e11d48"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </>
            )}

            {/* Spribe Red Propeller Jet:
                - WAITING: Parked at bottom-left corner with spinning propeller
                - FLYING: Riding the exact tip of the red curve
                - CRASHED: Streaking rapidly off the right edge ("FLEW AWAY!") */}
            {(gameState === 'WAITING' ||
              gameState === 'FLYING' ||
              (gameState === 'CRASHED' && crashElapsedMs < 650)) &&
              renderSpribeJet(
                jetX,
                jetY,
                1.05,
                gameState === 'CRASHED' ? -18 : -13
              )}
          </svg>

          {/* WAITING Overlay: UFC | Aviator OFFICIAL PARTNERS + Draining Red Bar + SPRIBE Badge */}
          {gameState === 'WAITING' && phaseRemainingMs > 220 && (
            <div className="relative z-10 flex flex-col items-center text-center px-4">
              <div className="flex items-center gap-3.5 mb-0.5">
                <span className="font-display font-black italic text-4xl text-[#e11d48] tracking-tighter leading-none">
                  UFC
                </span>
                <span className="h-9 w-[1.5px] bg-white/70" />
                <div className="flex flex-col items-center">
                  {/* Mini Red Spribe Plane above Aviator text */}
                  <svg viewBox="-6 -24 85 28" className="w-16 h-6 overflow-visible -mb-1">
                    {renderSpribeJet(0, 0, 0.85, -10)}
                  </svg>
                  <span className="font-display font-black italic text-xl text-[#e11d48] tracking-tight leading-none">
                    Aviator
                  </span>
                </div>
              </div>

              <div className="text-sm font-black tracking-[0.06em] text-white uppercase mb-2">
                OFFICIAL PARTNERS
              </div>

              {/* Thin Red Countdown Loading Bar right below OFFICIAL PARTNERS */}
              <div className="w-32 h-1 bg-white/15 rounded-full overflow-hidden mb-2.5">
                <div
                  className="h-full bg-[#e11d48] rounded-full transition-all duration-75"
                  style={{ width: `${waitingBarPct}%` }}
                />
              </div>

              {/* Official SPRIBE Green Badge */}
              <div className="bg-[#141e19]/95 border border-[#2ebd59]/45 rounded-lg px-3 py-1.5 flex flex-col items-center shadow-lg">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-3.5 h-3.5 rounded-sm bg-[#2ebd59] text-slate-950 font-black text-[9px] flex items-center justify-center">
                    S
                  </span>
                  <span className="font-display font-extrabold text-[11px] tracking-wider text-white">
                    SPRIBE
                  </span>
                </div>
                <div className="px-2 py-0.5 rounded bg-[#2ebd59] text-slate-950 text-[8px] font-extrabold flex items-center gap-1 leading-none mb-0.5">
                  <span>Official Game</span>
                  <ShieldCheck className="w-2.5 h-2.5" />
                </div>
                <div className="text-[8px] text-slate-300 font-semibold">Since 2018</div>
              </div>
            </div>
          )}

          {/* FLYING Center Multiplier with Dynamic Cyan / Purple / Pink Radial Glow */}
          {gameState === 'FLYING' && (
            <div className="relative z-10 flex items-center justify-center">
              <div
                className={`absolute w-48 h-24 rounded-full blur-2xl pointer-events-none transition-colors duration-500 ${glowColorClass}`}
              />
              <div className="relative font-mono-num font-black text-5xl sm:text-6xl text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)]">
                {multiplier.toFixed(2)}x
              </div>
            </div>
          )}

          {/* CRASHED ("FLEW AWAY!") Center Display */}
          {gameState === 'CRASHED' && (
            <div className="relative z-10 text-center">
              <div className="text-lg font-semibold text-white tracking-wider mb-0.5 uppercase">
                FLEW AWAY!
              </div>
              <div className="font-mono-num font-black text-5xl sm:text-6xl text-[#e11d48] tracking-tight">
                {multiplier.toFixed(2)}x
              </div>
            </div>
          )}

          {/* Bottom-right Active Players Counter Pill */}
          <div className="absolute bottom-2 right-2.5 z-10 flex items-center gap-1.5 text-[11px] text-slate-200 bg-black/65 px-2 py-0.5 rounded-full border border-white/10">
            <div className="flex -space-x-1.5">
              {DP_AVATARS.slice(0, 3).map((av, idx) => (
                <img
                  key={idx}
                  src={av}
                  alt="p"
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 rounded-full object-cover border border-black"
                />
              ))}
            </div>
            <span className="font-mono-num font-bold text-white">
              {activeFlightPlayers.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Dual Bet Panels (Panel 1 & Panel 2) */}
      <div className="px-2.5 space-y-2.5 mb-3">
        {([1, 2] as const).map((pid) => {
          const panel = panels[pid];
          const isCashingOutNow = panel.inFlight && gameState === 'FLYING' && !panel.cashedOut;
          return (
            <div
              key={pid}
              className={`bg-[#1b1c1e] rounded-2xl p-3 border ${
                isCashingOutNow
                  ? 'border-amber-400/80'
                  : panel.queued
                    ? 'border-[#e11d48]/70'
                    : 'border-white/5'
              }`}
            >
              {/* Top Segmented Toggle: Bet | Auto */}
              <div className="flex justify-center mb-2.5">
                <div className="bg-[#121315] rounded-full p-0.5 flex items-center w-44 border border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      panel.mode = 'bet';
                      notifyAviatorListeners();
                    }}
                    className={`w-1/2 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                      panel.mode === 'bet' ? 'bg-[#2c2d30] text-white' : 'text-slate-400'
                    }`}
                  >
                    Bet
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      panel.mode = 'auto';
                      notifyAviatorListeners();
                    }}
                    className={`w-1/2 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                      panel.mode === 'auto' ? 'bg-[#2c2d30] text-white' : 'text-slate-400'
                    }`}
                  >
                    Auto
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-2.5 items-center">
                {/* Left Amount Spinner & Presets */}
                <div className="col-span-5">
                  <div className="bg-[#121315] rounded-full px-2 py-1 flex items-center justify-between border border-white/10 mb-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        panel.amount = Math.max(10, panel.amount - 10);
                        notifyAviatorListeners();
                      }}
                      className="w-6 h-6 rounded-full bg-[#26282b] text-slate-200 font-bold text-sm flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono-num font-extrabold text-sm text-white">
                      {panel.amount.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        panel.amount = panel.amount + 10;
                        notifyAviatorListeners();
                      }}
                      className="w-6 h-6 rounded-full bg-[#26282b] text-slate-200 font-bold text-sm flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1">
                    {[100, 200, 500, 1000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          panel.amount = preset;
                          notifyAviatorListeners();
                        }}
                        className="py-0.5 rounded-full bg-[#141517] border border-white/5 text-[11px] font-mono-num text-slate-400 hover:text-white cursor-pointer"
                      >
                        {preset.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Big Action Button */}
                <div className="col-span-7">
                  {isCashingOutNow ? (
                    <button
                      type="button"
                      onClick={() => handleQueueOrCancelBet(pid)}
                      className="w-full h-20 rounded-2xl bg-gradient-to-b from-[#f59e0b] to-[#d97706] border border-amber-200/70 text-white flex flex-col items-center justify-center shadow-lg active:scale-[0.98] cursor-pointer"
                    >
                      <span className="text-base font-extrabold leading-tight uppercase">
                        Cash Out
                      </span>
                      <span className="font-mono-num text-base font-black">
                        {(panel.amount * multiplier).toFixed(2)} INR
                      </span>
                    </button>
                  ) : panel.queued ? (
                    <button
                      type="button"
                      onClick={() => handleQueueOrCancelBet(pid)}
                      className="w-full h-20 rounded-2xl bg-[#cb0b23] border border-red-400/40 text-white flex flex-col items-center justify-center shadow-lg active:scale-[0.98] cursor-pointer"
                    >
                      <span className="text-lg font-bold leading-tight">Cancel</span>
                      <span className="text-[11px] text-red-100 mt-0.5">
                        Waiting for next round
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleQueueOrCancelBet(pid)}
                      className="w-full h-20 rounded-2xl bg-[#28a909] border border-[#72f238]/50 text-white flex flex-col items-center justify-center shadow-lg active:scale-[0.98] cursor-pointer"
                    >
                      <span className="text-lg font-bold leading-tight">Bet</span>
                      <span className="font-mono-num text-base font-extrabold">
                        {panel.amount.toFixed(2)} INR
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Leaderboard Container (All Bets | Previous | Top) */}
      <div className="px-2.5">
        <div className="bg-[#1b1c1e] rounded-2xl p-2.5 border border-white/5">
          {/* Tabs */}
          <div className="bg-[#121315] rounded-full p-0.5 grid grid-cols-3 mb-3 border border-white/5">
            {[
              { id: 'all', label: `All Bets (${totalRoundBets})` },
              { id: 'previous', label: 'Previous' },
              { id: 'top', label: 'Top' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setBottomTab(t.id as 'all' | 'previous' | 'top')}
                className={`py-1 rounded-full text-xs font-semibold cursor-pointer ${
                  bottomTab === t.id ? 'bg-[#2c2d30] text-white' : 'text-slate-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {bottomTab === 'all' && (
            <div>
              <div className="flex items-center justify-between px-1 pb-2 border-b border-white/5 mb-2">
                <div>
                  <div className="flex -space-x-1.5 mb-1">
                    {DP_AVATARS.slice(0, 3).map((av, idx) => (
                      <img
                        key={idx}
                        src={av}
                        alt="p"
                        referrerPolicy="no-referrer"
                        className="w-4 h-4 rounded-full object-cover border border-black"
                      />
                    ))}
                  </div>
                  <div className="font-mono-num text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                    <span>
                      {activeFlightPlayers.toLocaleString()}/{totalRoundBets.toLocaleString()} Bets
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono-num text-sm font-bold text-[#28a909]">
                    ₹{totalWinInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-400">Total win INR</div>
                </div>
              </div>

              <div className="grid grid-cols-12 text-[10px] text-slate-400 px-2 py-1">
                <div className="col-span-4">Player</div>
                <div className="col-span-3">Bet INR</div>
                <div className="col-span-2 text-center">X</div>
                <div className="col-span-3 text-right">Win INR</div>
              </div>

              <div className="space-y-1 mt-1">
                {liveBets.map((b) => (
                  <div
                    key={b.id}
                    className={`grid grid-cols-12 items-center px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      b.cashed
                        ? 'bg-[#12351a]/75 border border-[#28a909]/45'
                        : b.isSelf
                          ? 'bg-[#e11d48]/15 border border-[#e11d48]/40'
                          : 'bg-[#121315]'
                    }`}
                  >
                    <div className="col-span-4 flex items-center gap-2">
                      <img
                        src={b.avatar}
                        alt={b.user}
                        referrerPolicy="no-referrer"
                        className="w-5 h-5 rounded-full object-cover border border-white/15"
                      />
                      <span className="text-slate-200 font-mono-num text-[11px] truncate">
                        {b.user}
                      </span>
                    </div>
                    <div className="col-span-3 font-mono-num text-slate-200">
                      {b.betNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="col-span-2 text-center">
                      {b.cashed && b.cashedMult && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#1e293b] text-[#38bdf8] font-mono-num text-[10px] font-bold">
                          {b.cashedMult}
                        </span>
                      )}
                    </div>
                    <div className="col-span-3 text-right font-mono-num font-bold text-[#28a909]">
                      {b.cashed
                        ? b.winNum.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bottomTab === 'previous' && (
            <div>
              <div className="bg-[#121315] rounded-xl py-2 px-3 text-center mb-2 border border-white/5">
                <div className="text-[11px] text-slate-400">Round Result</div>
                <div className={`font-mono-num font-extrabold text-base ${history[0]?.color || 'text-[#3498db]'}`}>
                  {history[0]?.val || '1.84x'}
                </div>
              </div>
              <div className="space-y-1">
                {previousRoundBets.slice(0, 8).map((b) => (
                  <div
                    key={b.id}
                    className={`grid grid-cols-12 items-center px-2.5 py-1.5 rounded-lg text-xs ${
                      b.cashed ? 'bg-[#12351a]/60 border border-[#28a909]/30' : 'bg-[#121315]'
                    }`}
                  >
                    <div className="col-span-4 flex items-center gap-2">
                      <img
                        src={b.avatar}
                        alt={b.user}
                        referrerPolicy="no-referrer"
                        className="w-5 h-5 rounded-full object-cover border border-white/15"
                      />
                      <span className="text-slate-300 font-mono-num">{b.user}</span>
                    </div>
                    <div className="col-span-4 font-mono-num text-slate-200">
                      {b.betNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="col-span-4 text-right font-mono-num font-bold text-[#28a909]">
                      {b.cashed
                        ? b.winNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })
                        : '-'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bottomTab === 'top' && (
            <div>
              {/* Sub filters X | Win | Rounds */}
              <div className="bg-[#121315] rounded-full p-0.5 grid grid-cols-3 mb-2">
                {(['x', 'win', 'rounds'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setTopSubTab(st)}
                    className={`py-1 rounded-full text-xs font-semibold capitalize cursor-pointer ${
                      topSubTab === st ? 'bg-[#2c2d30] text-white' : 'text-slate-400'
                    }`}
                  >
                    {st === 'x' ? 'X' : st}
                  </button>
                ))}
              </div>
              {/* Day | Month | Year */}
              <div className="bg-[#121315] rounded-full p-0.5 grid grid-cols-3 mb-3">
                {(['day', 'month', 'year'] as const).map((tt) => (
                  <button
                    key={tt}
                    type="button"
                    onClick={() => setTopTimeTab(tt)}
                    className={`py-1 rounded-full text-xs font-semibold capitalize cursor-pointer ${
                      topTimeTab === tt ? 'bg-[#2c2d30] text-white' : 'text-slate-400'
                    }`}
                  >
                    {tt}
                  </button>
                ))}
              </div>

              {topSubTab === 'win' ? (
                <div className="space-y-2">
                  {TOP_WIN_RECORDS.map((r, i) => (
                    <div
                      key={i}
                      className="bg-[#121315] rounded-xl p-2.5 flex items-center justify-between text-xs border border-white/5"
                    >
                      <div>
                        <div className="font-mono-num font-bold text-slate-200">{r.user}</div>
                        <div className="text-[10px] text-slate-500">{r.date}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-slate-400">
                          Bet INR <span className="text-white font-mono-num">{r.bet}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Win INR <span className="text-[#28a909] font-mono-num font-bold">{r.win}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="px-2 py-0.5 rounded-full bg-pink-950/80 text-[#e83e8c] font-mono-num text-[11px] font-bold">
                          {r.mult}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{r.max}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {TOP_X_RECORDS.map((r, i) => (
                    <div
                      key={i}
                      className="bg-[#121315] rounded-xl px-3 py-2 flex items-center justify-between text-xs"
                    >
                      <span className="font-mono-num text-slate-300">{r.date}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-pink-950/70 border border-[#e83e8c]/40 text-[#e83e8c] font-mono-num font-bold">
                        {r.mult}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reusable BetResultOverlay for Aviator Cashout Win or Crash Loss */}
      <BetResultOverlay
        key={overlayResult ? `aviator-${overlayResult.roundId}-${overlayResult.won}` : 'idle'}
        open={Boolean(overlayResult)}
        won={Boolean(overlayResult?.won)}
        amount={overlayResult?.amount || 0}
        gameTitle="Aviator Crash"
        multiplierText={overlayResult?.multText}
        periodLabel={overlayResult ? `Round #${overlayResult.roundId}` : undefined}
        onClose={handleCloseOverlay}
      />
    </div>
  );
};
