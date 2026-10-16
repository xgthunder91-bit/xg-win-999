import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  Wallet,
  Volume2,
  VolumeX,
  HelpCircle,
  Menu,
  Users,
  TrendingUp,
} from 'lucide-react';
import { MaanWinLogo } from './BrandLogo';
import { vortexImg, DP_AVATARS } from './GameArtwork';
import { BetResultOverlay } from './BetResultOverlay';
import { apiGet, apiPost } from '../utils/api';

interface VortexGameProps {
  balance: number;
  userId: string | null;
  onBalanceSync: (value: number) => void;
  onBack: () => void;
  onOpenDeposit: () => void;
}

type VortexState = 'WAITING' | 'FLYING' | 'CRASHED';

interface VortexHistoryItem {
  roundId: number;
  crashAt: number;
  at: string;
}

interface VortexMyBet {
  amount: number;
  cashed: boolean;
  payout: number;
}

interface VortexLiveBetItem {
  id: string;
  user: string;
  avatar: string;
  bet: number;
  mult: string;
  status: 'cashed' | 'playing' | 'crashed';
  winAmount: number;
  isSelf?: boolean;
}

/** Mirrors the server progression table so the number climbs smoothly. */
function vortexIncrement(multiplier: number): number {
  if (multiplier < 1.5) return 0.006;
  if (multiplier < 2.2) return 0.009;
  if (multiplier < 4.0) return 0.021;
  if (multiplier < 10.0) return 0.038;
  if (multiplier < 25.0) return 0.09;
  return 0.24;
}

const BET_PRESETS = [10, 50, 100, 500, 1000];

function createRandomVortexBet(seq: number): VortexLiveBetItem {
  const bets = [20, 50, 100, 200, 500, 1000, 2000];
  const bet = bets[Math.floor(Math.random() * bets.length)];
  const roll = Math.random();
  const status: 'cashed' | 'playing' | 'crashed' =
    roll < 0.6 ? 'cashed' : roll < 0.84 ? 'playing' : 'crashed';
  const multVal =
    status === 'crashed' ? +(1.0 + Math.random() * 0.6).toFixed(2) : +(1.2 + Math.random() * 4.5).toFixed(2);
  const prefixes = ['91', '98', '87', '76', '99', '84', '93', '70'];
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const tail = String(100 + Math.floor(Math.random() * 900));
  return {
    id: `vtx-${Date.now()}-${seq}-${Math.random()}`,
    user: `${p}***${tail}`,
    avatar: DP_AVATARS[Math.floor(Math.random() * DP_AVATARS.length)],
    bet,
    mult: `${multVal.toFixed(2)}x`,
    status,
    winAmount: status === 'cashed' ? +(bet * multVal).toFixed(2) : 0,
  };
}

export const VortexGame: React.FC<VortexGameProps> = ({
  balance,
  userId,
  onBalanceSync,
  onBack,
  onOpenDeposit,
}) => {
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [serverState, setServerState] = useState<VortexState>('WAITING');
  const [displayMult, setDisplayMult] = useState(1.0);
  const [roundId, setRoundId] = useState<number>(0);
  const [lastCrash, setLastCrash] = useState<number | null>(null);
  const [history, setHistory] = useState<VortexHistoryItem[]>([]);
  const [myBet, setMyBet] = useState<VortexMyBet | null>(null);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [placing, setPlacing] = useState(false);
  const [cashing, setCashing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [overlayResult, setOverlayResult] = useState<{
    won: boolean;
    amount: number;
    multText: string;
  } | null>(null);

  const [onlinePlayers, setOnlinePlayers] = useState(1684);
  const [activeBetsCount, setActiveBetsCount] = useState(1142);
  const [totalPool, setTotalPool] = useState(284650);
  const [liveFeed, setLiveFeed] = useState<VortexLiveBetItem[]>(() =>
    Array.from({ length: 6 }, (_, i) => createRandomVortexBet(i))
  );

  const mountedRef = useRef(true);
  const stateRef = useRef<{ state: VortexState; myBet: VortexMyBet | null }>({
    state: 'WAITING',
    myBet: null,
  });
  const phaseEndsAtRef = useRef<number>(0);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const handleCloseOverlay = useCallback(() => setOverlayResult(null), []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 750);
    return () => clearTimeout(t);
  }, []);

  // Fake social proof ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlinePlayers((p) => Math.max(1320, p + (Math.floor(Math.random() * 25) - 11)));
      setActiveBetsCount((b) => Math.max(850, b + (Math.floor(Math.random() * 19) - 8)));
      const newEntry = createRandomVortexBet(Date.now());
      setTotalPool((pool) => Math.max(180000, pool + newEntry.bet * 3 - 450));
      setLiveFeed((prev) => [newEntry, ...prev.slice(0, 5)]);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  // Poll the server-owned round state.
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      const q = userId ? `?userId=${encodeURIComponent(userId)}` : '';
      const res = await apiGet(`/game/vortex/state${q}`);
      if (cancelled || !mountedRef.current || !res?.success) return;
      const d = res.data;
      const prev = stateRef.current;

      if (prev.state === 'FLYING' && d.state === 'CRASHED' && prev.myBet && !prev.myBet.cashed) {
        setOverlayResult({
          won: false,
          amount: prev.myBet.amount,
          multText: `Crashed @ ${Number(d.multiplier).toFixed(2)}x`,
        });
      }

      setServerState(d.state);
      setDisplayMult(Number(d.multiplier) || 1);
      setRoundId(Number(d.roundId) || 0);
      setLastCrash(d.lastCrash != null ? Number(d.lastCrash) : null);
      if (Array.isArray(d.history)) setHistory(d.history);
      setMyBet(d.myBet || null);
      phaseEndsAtRef.current = Date.now() + (Number(d.phaseRemainingMs) || 0);

      stateRef.current = { state: d.state, myBet: d.myBet || null };
    };

    poll();
    const interval = setInterval(poll, 140);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userId]);

  // Smooth the rising number between polls.
  useEffect(() => {
    const interval = setInterval(() => {
      if (stateRef.current.state === 'FLYING') {
        setDisplayMult((m) => +(m + vortexIncrement(m)).toFixed(2));
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Countdown for the betting window.
  useEffect(() => {
    const interval = setInterval(() => {
      if (stateRef.current.state === 'WAITING') {
        setCountdown(Math.max(0, Math.ceil((phaseEndsAtRef.current - Date.now()) / 1000)));
      } else {
        setCountdown(0);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const placeBet = async () => {
    if (!userId) {
      showToast('Please login to play');
      return;
    }
    if (serverState !== 'WAITING') {
      showToast('Betting is closed — wait for the next round');
      return;
    }
    if (myBet) {
      showToast('You already have a bet this round');
      return;
    }
    if (betAmount > balance) {
      showToast('Insufficient balance');
      onOpenDeposit();
      return;
    }

    setPlacing(true);
    const res = await apiPost('/game/vortex/bet', { userId, amount: betAmount });
    if (!mountedRef.current) return;
    setPlacing(false);

    if (!res?.success) {
      showToast(res?.message || 'Could not place bet');
      return;
    }

    onBalanceSync(Number(res.data.balance));
    setMyBet({ amount: betAmount, cashed: false, payout: 0 });
    setActiveBetsCount((b) => b + 1);
    setTotalPool((p) => p + betAmount);
    setLiveFeed((prev) => [
      {
        id: `self-${Date.now()}`,
        user: 'You',
        avatar: DP_AVATARS[0],
        bet: betAmount,
        mult: '1.00x',
        status: 'playing',
        winAmount: 0,
        isSelf: true,
      },
      ...prev.slice(0, 5),
    ]);
  };

  const cashOut = async () => {
    if (!userId || !myBet || myBet.cashed || serverState !== 'FLYING') return;
    setCashing(true);
    const res = await apiPost('/game/vortex/cashout', { userId });
    if (!mountedRef.current) return;
    setCashing(false);

    if (!res?.success) {
      showToast(res?.message || 'Cash out failed');
      return;
    }

    const mult = Number(res.data.multiplier) || 1;
    const payout = Number(res.data.payout) || 0;
    onBalanceSync(Number(res.data.balance));
    setMyBet((m) => (m ? { ...m, cashed: true, payout } : m));
    // Sync the ref right away so a crash poll arriving before the next poll
    // can never mistake a won round for a loss.
    stateRef.current = {
      state: stateRef.current.state,
      myBet: { amount: myBet.amount, cashed: true, payout },
    };
    setLiveFeed((prev) => [
      {
        id: `self-win-${Date.now()}`,
        user: 'You',
        avatar: DP_AVATARS[0],
        bet: myBet.amount,
        mult: `${mult.toFixed(2)}x`,
        status: 'cashed',
        winAmount: payout,
        isSelf: true,
      },
      ...prev.slice(0, 5),
    ]);
    setOverlayResult({ won: true, amount: payout, multText: `${mult.toFixed(2)}x` });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#151821] text-white flex flex-col items-center justify-center p-6 select-none">
        <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-fuchsia-400 shadow-2xl mb-4">
          <img
            src={vortexImg}
            alt="Vortex"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="font-display font-black text-2xl text-fuchsia-400 tracking-wide mb-1">
          VORTEX
        </div>
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-5">
          XG Win99 · Crash
        </div>
        <div className="w-48 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/10">
          <div className="h-full bg-gradient-to-r from-[#a855f7] to-[#ff7b1b] w-4/5 animate-pulse rounded-full" />
        </div>
      </div>
    );
  }

  const canBet = serverState === 'WAITING' && !myBet && !placing;
  const canCash = serverState === 'FLYING' && Boolean(myBet) && !myBet?.cashed && !cashing;
  const cashValue = myBet ? +(myBet.amount * displayMult).toFixed(2) : 0;
  const ringSpeed = serverState === 'FLYING' ? '0.9s' : '2.4s';
  const ringSpeedRev = serverState === 'FLYING' ? '1.2s' : '3.1s';
  const flying = serverState === 'FLYING';
  const crashed = serverState === 'CRASHED';

  return (
    <div className="min-h-screen bg-[#141720] text-white flex flex-col justify-between select-none pb-5">
      {/* Top Frame Bar */}
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

      {/* Sub-Header */}
      <div className="bg-[#1b1f2b] px-3 py-2 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="font-display font-black text-sm text-white tracking-tight">
            VORTEX
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono-num font-bold text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            {onlinePlayers.toLocaleString()} Playing
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#11141c] px-3 py-1 rounded-lg border border-white/10 font-mono-num text-xs font-extrabold text-white">
            {balance.toFixed(2)} <span className="text-slate-400">INR</span>
          </div>
          <button
            type="button"
            onClick={() => setMuted(!muted)}
            className="w-7 h-7 rounded-lg bg-[#252b3b] flex items-center justify-center text-slate-300 cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <a
            href="https://t.me/xgwin99"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => showToast('Support & Help: https://t.me/xgwin99')}
            title="Support & Help (https://t.me/xgwin99)"
            className="w-7 h-7 rounded-lg bg-[#252b3b] flex items-center justify-center text-slate-300 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </a>
          <a
            href="https://t.me/xgwin99"
            target="_blank"
            rel="noopener noreferrer"
            title="Official Telegram (https://t.me/xgwin99)"
            className="w-7 h-7 rounded-lg bg-[#252b3b] flex items-center justify-center text-slate-300 cursor-pointer"
          >
            <Menu className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Live Players & Active Bets Bar */}
      <div className="px-2.5 pt-2">
        <div className="bg-[#1b202e] rounded-xl px-3 py-1.5 border border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {DP_AVATARS.slice(0, 3).map((av, idx) => (
                <img
                  key={idx}
                  src={av}
                  alt="p"
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 rounded-full object-cover border border-[#1b202e]"
                />
              ))}
            </div>
            <span className="font-mono-num font-bold text-amber-400">
              🔥 {activeBetsCount.toLocaleString()} Active Bets
            </span>
          </div>
          <div className="font-mono-num text-[11px] font-bold text-emerald-400">
            Pool: ₹{totalPool.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Main Vortex Stage */}
      <div className="px-2.5 my-2 flex-1 flex flex-col">
        <div className="relative flex-1 min-h-[300px] rounded-2xl bg-gradient-to-b from-[#1a1430] via-[#191d2e] to-[#0f1420] border-2 border-[#3a2d52] overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[radial-gradient(circle_at_50%_40%,#fff_0%,transparent_60%)]" />

          {/* Round + status chips */}
          <div className="relative z-10 flex items-center justify-between px-3 pt-3">
            <span className="px-2 py-0.5 rounded-md bg-black/40 border border-white/10 font-mono-num text-[10px] font-bold text-slate-300">
              Period #{roundId || '—'}
            </span>
            <span
              className={`px-2 py-0.5 rounded-md font-mono-num text-[10px] font-black ${
                crashed
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                  : flying
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
              }`}
            >
              {crashed ? 'CRASHED' : flying ? 'FLYING' : 'BETTING OPEN'}
            </span>
          </div>

          {/* Vortex + multiplier */}
          <div className="relative z-10 flex flex-1 items-center justify-center">
            <div className="relative w-[230px] h-[230px] flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle, rgba(168,85,247,0.35) 0%, rgba(255,123,27,0.10) 45%, transparent 70%)',
                  filter: 'blur(6px)',
                }}
              />
              <div
                className="absolute inset-0 rounded-full border-4 border-transparent"
                style={{
                  borderTopColor: '#ff7b1b',
                  borderRightColor: '#ff7b1b',
                  animation: `vortexSpin ${ringSpeed} linear infinite`,
                }}
              />
              <div
                className="absolute inset-5 rounded-full border-4 border-transparent"
                style={{
                  borderBottomColor: '#a855f7',
                  borderLeftColor: '#a855f7',
                  animation: `vortexSpinRev ${ringSpeedRev} linear infinite`,
                }}
              />
              <div
                className="absolute inset-10 rounded-full border-4 border-transparent"
                style={{
                  borderTopColor: '#facc15',
                  animation: `vortexSpin ${ringSpeed} linear infinite`,
                }}
              />

              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={`font-mono-num font-black leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] ${
                    crashed ? 'text-rose-400 text-5xl' : flying ? 'text-emerald-300 text-6xl' : 'text-white text-5xl'
                  }`}
                >
                  {displayMult.toFixed(2)}x
                </div>
                <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  {crashed ? (
                    <span className="text-rose-300">Flew away at {lastCrash?.toFixed(2)}x</span>
                  ) : flying ? (
                    'Vortex rising'
                  ) : (
                    `Next round in ${countdown}s`
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* History strip */}
          <div className="relative z-10 px-3 pb-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-fuchsia-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Last Crashes
              </span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {history.length === 0 && (
                <span className="text-[11px] text-slate-500">Waiting for first round…</span>
              )}
              {history.slice(0, 12).map((h) => (
                <span
                  key={h.roundId}
                  className={`shrink-0 px-2 py-1 rounded-md font-mono-num text-[10px] font-bold border ${
                    h.crashAt >= 10
                      ? 'bg-fuchsia-500/15 border-fuchsia-500/40 text-fuchsia-300'
                      : h.crashAt >= 2
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {h.crashAt.toFixed(2)}x
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bet Panel */}
        <div className="mt-3 bg-[#1b202e] rounded-2xl p-3 border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Bet Amount
            </span>
            <span className="font-mono-num text-[11px] text-slate-400">
              Bal: ₹{balance.toFixed(2)}
            </span>
          </div>

          <div className="flex gap-1.5 mb-2.5">
            {BET_PRESETS.map((v) => (
              <button
                key={v}
                type="button"
                disabled={Boolean(myBet) || serverState !== 'WAITING'}
                onClick={() => setBetAmount(v)}
                className={`flex-1 py-1.5 rounded-lg font-mono-num text-xs font-bold transition-colors disabled:opacity-50 border ${
                  betAmount === v
                    ? 'bg-[#333d54] text-white shadow border-white/15'
                    : 'bg-[#151924] text-slate-300 border-white/5'
                }`}
              >
                ₹{v}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              disabled={Boolean(myBet) || serverState !== 'WAITING'}
              onClick={() => setBetAmount((b) => Math.max(10, +(b - 10).toFixed(2)))}
              className="w-9 h-9 rounded-lg bg-[#252b3b] text-white font-black disabled:opacity-40 cursor-pointer"
            >
              −
            </button>
            <div className="flex-1 bg-[#11141c] rounded-lg border border-white/10 py-2 text-center font-mono-num text-sm font-extrabold">
              ₹{betAmount}
            </div>
            <button
              type="button"
              disabled={Boolean(myBet) || serverState !== 'WAITING'}
              onClick={() => setBetAmount((b) => +(b + 10).toFixed(2))}
              className="w-9 h-9 rounded-lg bg-[#252b3b] text-white font-black disabled:opacity-40 cursor-pointer"
            >
              +
            </button>
          </div>

          {canCash ? (
            <button
              type="button"
              onClick={cashOut}
              disabled={cashing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-b from-[#fde047] to-[#eab308] text-slate-950 font-display font-black text-base shadow-lg active:scale-[0.99] cursor-pointer flex flex-col items-center justify-center leading-tight disabled:opacity-70"
            >
              <span>CASH OUT @ {displayMult.toFixed(2)}x</span>
              <span className="font-mono-num text-xs">₹{cashValue.toFixed(2)}</span>
            </button>
          ) : canBet ? (
            <button
              type="button"
              onClick={placeBet}
              disabled={placing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-b from-[#22c55e] to-[#15803d] text-white font-display font-black text-lg tracking-wide shadow-[0_4px_14px_rgba(34,197,94,0.4)] active:scale-[0.99] cursor-pointer disabled:opacity-70"
            >
              {placing ? 'PLACING…' : `PLACE BET ₹${betAmount}`}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className={`w-full py-3.5 rounded-xl font-display font-black text-base tracking-wide cursor-default ${
                serverState === 'WAITING' && myBet && !myBet.cashed
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : myBet?.cashed
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                    : 'bg-[#2a3040] text-slate-400'
              }`}
            >
              {serverState === 'WAITING' && myBet && !myBet.cashed
                ? 'YOU ARE IN — WAIT FOR TAKEOFF'
                : myBet?.cashed
                  ? `CASHED OUT @ ${(myBet.payout / myBet.amount).toFixed(2)}x`
                  : crashed
                    ? `CRASHED @ ${lastCrash?.toFixed(2)}x`
                    : 'ROUND IN PROGRESS'}
            </button>
          )}
        </div>

        {/* Live Players Bets Stream */}
        <div className="mt-3 bg-[#202634] rounded-2xl p-3 border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-white">Live Players & Bets</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-mono-num font-bold text-emerald-400">
                LIVE
              </span>
            </div>
            <span className="font-mono-num text-[11px] text-slate-400">
              {activeBetsCount.toLocaleString()} Betting
            </span>
          </div>

          <div className="space-y-1.5">
            {liveFeed.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs ${
                  item.status === 'cashed'
                    ? 'bg-emerald-950/50 border border-emerald-500/30'
                    : item.isSelf
                      ? 'bg-amber-500/15 border border-amber-400/40'
                      : 'bg-[#151924]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <img
                    src={item.avatar}
                    alt={item.user}
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover border border-white/15"
                  />
                  <span className="font-mono-num text-[11px] text-slate-200 font-semibold">
                    {item.user}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono-num text-[11px] text-slate-300">₹{item.bet}</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#252c3d] font-mono-num text-[10px] font-bold text-fuchsia-400">
                    {item.mult}
                  </span>
                </div>

                <div className="text-right font-mono-num font-bold text-[11px]">
                  {item.status === 'cashed' ? (
                    <span className="text-[#22c55e]">+₹{item.winAmount.toFixed(0)}</span>
                  ) : item.status === 'playing' ? (
                    <span className="text-sky-400">Playing…</span>
                  ) : (
                    <span className="text-rose-400">Crashed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center max-w-[430px] mx-auto">
          <div className="bg-black/85 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-white/10 shadow-2xl">
            {toast}
          </div>
        </div>
      )}

      <BetResultOverlay
        key={overlayResult ? `vortex-${overlayResult.amount}-${overlayResult.won}` : 'idle'}
        open={Boolean(overlayResult)}
        won={Boolean(overlayResult?.won)}
        amount={overlayResult?.amount || 0}
        gameTitle="Vortex"
        multiplierText={overlayResult?.multText}
        selectionText="Vortex Crash"
        onClose={handleCloseOverlay}
      />
    </div>
  );
};
