import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  Wallet,
  Volume2,
  VolumeX,
  HelpCircle,
  Menu,
  Flame,
  Users,
} from 'lucide-react';
import { MaanWinLogo } from './BrandLogo';
import { chickenRoadImg, DP_AVATARS } from './GameArtwork';
import { BetResultOverlay } from './BetResultOverlay';

interface ChickenRoadGameProps {
  balance: number;
  onBalanceChange?: React.Dispatch<React.SetStateAction<number>>;
  onBack: () => void;
  onOpenDeposit: () => void;
}

type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Hardcore';

const MULTIPLIER_TABLES: Record<Difficulty, number[]> = {
  Easy: [1.03, 1.07, 1.12, 1.17, 1.23, 1.3, 1.38, 1.47, 1.58, 1.71, 2.0, 24.5],
  Medium: [1.12, 1.28, 1.47, 1.7, 1.98, 2.33, 2.76, 3.3, 4.0, 5.2, 8.5, 100.0],
  Hard: [1.23, 1.55, 1.98, 2.56, 3.36, 4.49, 6.1, 8.5, 12.4, 19.5, 35.0, 500.0],
  Hardcore: [1.68, 2.8, 4.95, 9.08, 17.5, 35.0, 75.0, 165.0, 380.0, 950.0, 2500.0, 10000.0],
};

interface ChickenLiveBetItem {
  id: string;
  user: string;
  avatar: string;
  difficulty: Difficulty;
  bet: number;
  mult: string;
  status: 'cashed' | 'playing' | 'roasted';
  winAmount: number;
  isSelf?: boolean;
}

function createRandomChickenBet(seq: number): ChickenLiveBetItem {
  const diffs: Difficulty[] = ['Easy', 'Medium', 'Hard', 'Hardcore'];
  const diff = diffs[Math.floor(Math.random() * diffs.length)];
  const table = MULTIPLIER_TABLES[diff];
  const stepIdx = Math.floor(Math.random() * 6);
  const multVal = table[stepIdx];
  const bets = [20, 50, 100, 200, 500, 1000, 2000];
  const bet = bets[Math.floor(Math.random() * bets.length)];
  const roll = Math.random();
  const status: 'cashed' | 'playing' | 'roasted' =
    roll < 0.58 ? 'cashed' : roll < 0.82 ? 'playing' : 'roasted';
  const prefixes = ['91', '98', '87', '76', '99', '84', '93', '70'];
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const tail = String(100 + Math.floor(Math.random() * 900));
  return {
    id: `chk-${Date.now()}-${seq}-${Math.random()}`,
    user: `${p}***${tail}`,
    avatar: DP_AVATARS[Math.floor(Math.random() * DP_AVATARS.length)],
    difficulty: diff,
    bet,
    mult: `${multVal.toFixed(2)}x`,
    status,
    winAmount: status === 'cashed' ? +(bet * multVal).toFixed(2) : 0,
  };
}

export const ChickenRoadGame: React.FC<ChickenRoadGameProps> = ({
  balance,
  onBalanceChange,
  onBack,
  onOpenDeposit,
}) => {
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'CRASHED' | 'CASHED_OUT'>('IDLE');
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [hazardStep, setHazardStep] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [overlayResult, setOverlayResult] = useState<{
    won: boolean;
    amount: number;
    multText: string;
  } | null>(null);

  const handleCloseOverlay = useCallback(() => {
    setOverlayResult(null);
  }, []);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Live Players & Live Bets State
  const [onlinePlayers, setOnlinePlayers] = useState(1684);
  const [activeBetsCount, setActiveBetsCount] = useState(1142);
  const [totalPool, setTotalPool] = useState(284650);
  const [liveFeed, setLiveFeed] = useState<ChickenLiveBetItem[]>(() =>
    Array.from({ length: 6 }, (_, i) => createRandomChickenBet(i))
  );

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 750);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlinePlayers((p) => Math.max(1320, p + (Math.floor(Math.random() * 25) - 11)));
      setActiveBetsCount((b) => Math.max(850, b + (Math.floor(Math.random() * 19) - 8)));
      const newEntry = createRandomChickenBet(Date.now());
      setTotalPool((pool) => Math.max(180000, pool + newEntry.bet * 3 - 450));
      setLiveFeed((prev) => [newEntry, ...prev.slice(0, 5)]);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const multipliers = MULTIPLIER_TABLES[difficulty];

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    if (currentStep <= 0) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      const targetLeft = Math.max(0, currentStep * 88 - 80);
      scrollContainerRef.current.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }
  }, [currentStep]);

  const handleStartGame = () => {
    if (betAmount > balance) {
      showToast('Insufficient balance');
      return;
    }
    onBalanceChange?.((prev) => Math.max(0, +(prev - betAmount).toFixed(2)));
    setHazardStep(null);
    setOverlayResult(null);
    setCurrentStep(0);
    setGameState('PLAYING');
    setActiveBetsCount((b) => b + 1);
    setTotalPool((p) => p + betAmount);
    setLiveFeed((prev) => [
      {
        id: `self-${Date.now()}`,
        user: 'You (650170)',
        avatar: DP_AVATARS[0],
        difficulty,
        bet: betAmount,
        mult: `${multipliers[0].toFixed(2)}x`,
        status: 'playing',
        winAmount: 0,
        isSelf: true,
      },
      ...prev.slice(0, 5),
    ]);
  };

  const handleNextStep = () => {
    if (gameState !== 'PLAYING') return;
    const nextIdx = currentStep + 1;
    const crashChance =
      difficulty === 'Easy'
        ? 0.16
        : difficulty === 'Medium'
          ? 0.28
          : difficulty === 'Hard'
            ? 0.42
            : 0.58;

    if (Math.random() < crashChance) {
      setHazardStep(nextIdx);
      setCurrentStep(nextIdx);
      setGameState('CRASHED');
      setOverlayResult({
        won: false,
        amount: betAmount,
        multText: `Roasted @ Step #${nextIdx + 1}`,
      });
    } else {
      setCurrentStep(nextIdx);
      if (nextIdx >= multipliers.length - 1) {
        const finalWin = +(betAmount * multipliers[nextIdx]).toFixed(2);
        onBalanceChange?.((prev) => +(prev + finalWin).toFixed(2));
        setGameState('CASHED_OUT');
        setOverlayResult({
          won: true,
          amount: finalWin,
          multText: `Golden Egg ${multipliers[nextIdx].toFixed(2)}x`,
        });
      }
    }
  };

  const handleCashOut = () => {
    if (gameState !== 'PLAYING' || currentStep < 0) return;
    const multVal = multipliers[currentStep];
    const winVal = +(betAmount * multVal).toFixed(2);
    onBalanceChange?.((prev) => +(prev + winVal).toFixed(2));
    setGameState('CASHED_OUT');
    setLiveFeed((prev) => [
      {
        id: `self-win-${Date.now()}`,
        user: 'You (650170)',
        avatar: DP_AVATARS[0],
        difficulty,
        bet: betAmount,
        mult: `${multVal.toFixed(2)}x`,
        status: 'cashed',
        winAmount: winVal,
        isSelf: true,
      },
      ...prev.slice(0, 5),
    ]);
    setOverlayResult({
      won: true,
      amount: winVal,
      multText: `${multVal.toFixed(2)}x`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#151821] text-white flex flex-col items-center justify-center p-6 select-none">
        <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-amber-400 shadow-2xl mb-4">
          <img
            src={chickenRoadImg}
            alt="Chicken Road"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="font-display font-black text-2xl text-amber-400 tracking-wide mb-1">
          CHICKEN ROAD
        </div>
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-5">
          InOut Games · v40
        </div>
        <div className="w-48 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/10">
          <div className="h-full bg-gradient-to-r from-[#f59e0b] to-[#22c55e] w-4/5 animate-pulse rounded-full" />
        </div>
      </div>
    );
  }

  const activeMultiplier = currentStep >= 0 ? multipliers[currentStep] : 1.0;

  return (
    <div className="min-h-screen bg-[#141720] text-white flex flex-col justify-between select-none pb-5">
      {/* Top maan.win Frame Bar */}
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

      {/* InOut Games Top Sub-Header (v40 style) */}
      <div className="bg-[#1b1f2b] px-3 py-2 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="leading-none">
            <span className="font-display font-black text-sm text-white block tracking-tight">
              CHICKEN
            </span>
            <span className="font-display font-black text-xs text-[#fbbf24] block -mt-0.5">
              ROAD
            </span>
          </div>
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

      {/* Main Dungeon / Grate Lane Viewport (v40) */}
      <div className="px-2.5 my-2 flex-1 flex flex-col">
        <div className="relative flex-1 min-h-[285px] rounded-2xl bg-[#1e2330] border-2 border-[#2d3548] overflow-hidden flex flex-col justify-between">
          {/* Horizontal Scrollable Dungeon Lanes */}
          <div
            ref={scrollContainerRef}
            className="flex-1 flex items-stretch overflow-x-auto no-scrollbar relative"
          >
            {/* Starting Safe Sidewalk Zone (Left) */}
            <div className="w-24 shrink-0 bg-gradient-to-b from-[#2b3346] via-[#232a3a] to-[#1a202c] border-r-4 border-dashed border-slate-500/60 flex flex-col items-center justify-between py-4 px-2 relative">
              <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 bg-black/30 px-2 py-0.5 rounded">
                START
              </div>

              {/* Cartoon Chicken on Start Sidewalk when IDLE */}
              <div className="my-auto flex flex-col items-center justify-center h-24">
                {currentStep === -1 ? (
                  <div className="relative flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-300 shadow-[0_6px_15px_rgba(0,0,0,0.6)]">
                      <img
                        src={chickenRoadImg}
                        alt="Chicken"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover scale-110"
                      />
                    </div>
                    <span className="mt-1 px-2 py-0.5 rounded-full bg-emerald-500 text-[9px] font-black text-slate-950">
                      READY
                    </span>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-800/70 border border-slate-600 flex items-center justify-center text-xs text-emerald-400 font-bold">
                    ✓
                  </div>
                )}
              </div>

              <div className="w-full h-3 rounded bg-[#333c52] border border-slate-600" />
            </div>

            {/* 12 Multiplier Grate Lanes + Final Golden Egg */}
            {multipliers.map((mult, idx) => {
              const isCurrent = currentStep === idx;
              const isPassed = currentStep > idx;
              const isCrashedHere = hazardStep === idx && gameState === 'CRASHED';
              const isFinalEgg = idx === multipliers.length - 1;

              return (
                <div
                  key={idx}
                  className={`w-[88px] shrink-0 border-r-2 border-dashed border-slate-600/60 flex flex-col items-center justify-between py-3 px-1.5 relative transition-colors ${
                    isCrashedHere
                      ? 'bg-gradient-to-b from-red-950/90 via-red-900/50 to-[#1e2330]'
                      : isCurrent
                        ? 'bg-gradient-to-b from-emerald-950/70 via-[#253142] to-[#1e2330]'
                        : 'bg-gradient-to-b from-[#1a1f2c] via-[#222838] to-[#191e2b]'
                  }`}
                >
                  {/* Top Dungeon Arch / Flame Vent */}
                  <div className="w-16 h-9 rounded-t-full bg-[#11151f] border-2 border-[#333c52] flex items-center justify-center shadow-inner">
                    <div
                      className={`w-8 h-4 rounded-t-full ${
                        isCrashedHere ? 'bg-orange-500 animate-pulse' : 'bg-[#090b10]'
                      }`}
                    />
                  </div>

                  {/* Metallic Multiplier Shield Badge */}
                  <div
                    className={`w-16 h-11 rounded-full flex items-center justify-center border-2 shadow-md font-mono-num font-black text-xs ${
                      isCurrent
                        ? 'bg-gradient-to-b from-[#22c55e] to-[#15803d] border-emerald-200 text-white scale-105'
                        : isPassed
                          ? 'bg-[#263246] border-emerald-500/50 text-emerald-400'
                          : isFinalEgg
                            ? 'bg-gradient-to-b from-[#fde047] via-[#f59e0b] to-[#b45309] border-yellow-100 text-slate-950'
                            : 'bg-gradient-to-b from-[#3b445e] to-[#23293a] border-[#525e7a] text-slate-100'
                    }`}
                  >
                    {mult >= 100 ? `${mult.toFixed(0)}x` : `${mult.toFixed(2)}x`}
                  </div>

                  {/* Chicken / Roasted Fire / Golden Egg Stage */}
                  <div className="h-20 flex items-center justify-center relative">
                    {isCrashedHere ? (
                      <div className="flex flex-col items-center animate-bounce">
                        <Flame className="w-12 h-12 fill-orange-500 text-red-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.9)]" />
                        <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase -mt-1">
                          ROASTED!
                        </span>
                      </div>
                    ) : isCurrent ? (
                      <div className="flex flex-col items-center animate-bounce">
                        <div className="w-15 h-15 rounded-2xl overflow-hidden border-2 border-[#22c55e] shadow-[0_0_16px_rgba(34,197,94,0.7)]">
                          <img
                            src={chickenRoadImg}
                            alt="Active Chicken"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover scale-115"
                          />
                        </div>
                      </div>
                    ) : isFinalEgg ? (
                      <svg viewBox="0 0 60 70" className="w-14 h-16 drop-shadow-[0_0_12px_rgba(251,191,36,0.7)]">
                        <defs>
                          <radialGradient id="goldEggGrad" cx="35%" cy="30%" r="70%">
                            <stop offset="0%" stopColor="#fef9c3" />
                            <stop offset="45%" stopColor="#facc15" />
                            <stop offset="100%" stopColor="#b45309" />
                          </radialGradient>
                        </defs>
                        <path
                          d="M30 6 C46 6 52 28 52 44 C52 58 42 66 30 66 C18 66 8 58 8 44 C8 28 14 6 30 6 Z"
                          fill="url(#goldEggGrad)"
                          stroke="#fef08a"
                          strokeWidth="2"
                        />
                      </svg>
                    ) : (
                      <div className="w-10 h-10 rounded-full border border-slate-700/60 bg-slate-900/40 flex items-center justify-center text-[10px] font-mono-num text-slate-500">
                        #{idx + 1}
                      </div>
                    )}
                  </div>

                  {/* Bottom Iron Grate Bars */}
                  <div className="w-16 h-5 rounded bg-[#141822] border border-[#384157] grid grid-cols-5 gap-0.5 p-1">
                    <span className="bg-[#2c3446] rounded-xs" />
                    <span className="bg-[#2c3446] rounded-xs" />
                    <span className="bg-[#2c3446] rounded-xs" />
                    <span className="bg-[#2c3446] rounded-xs" />
                    <span className="bg-[#2c3446] rounded-xs" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom InOut Games v40 Control Deck */}
      <div className="px-2.5 space-y-2.5">
        <div className="bg-[#202634] rounded-2xl p-3 border border-white/10 space-y-2.5 shadow-xl">
          {/* Row 1: MIN | Bet Input | MAX + Quick Preset Pills */}
          <div className="bg-[#151924] rounded-xl p-2 border border-white/5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={gameState === 'PLAYING'}
                onClick={() => setBetAmount(10)}
                className="px-2.5 py-1.5 rounded-lg bg-[#252c3d] text-[10px] font-extrabold text-slate-300 cursor-pointer"
              >
                MIN
              </button>

              <button
                type="button"
                disabled={gameState === 'PLAYING'}
                onClick={() => setBetAmount((b) => Math.max(10, b - 10))}
                className="w-8 h-8 rounded-lg bg-[#252c3d] text-white font-bold cursor-pointer"
              >
                -
              </button>

              <div className="flex-1 text-center font-mono-num font-extrabold text-base text-white">
                ₹{betAmount}
              </div>

              <button
                type="button"
                disabled={gameState === 'PLAYING'}
                onClick={() => setBetAmount((b) => Math.min(10000, b + 10))}
                className="w-8 h-8 rounded-lg bg-[#252c3d] text-white font-bold cursor-pointer"
              >
                +
              </button>

              <button
                type="button"
                disabled={gameState === 'PLAYING'}
                onClick={() => setBetAmount(1000)}
                className="px-2.5 py-1.5 rounded-lg bg-[#252c3d] text-[10px] font-extrabold text-slate-300 cursor-pointer"
              >
                MAX
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[10, 20, 50, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={gameState === 'PLAYING'}
                  onClick={() => setBetAmount(preset)}
                  className={`py-1 rounded-lg font-mono-num font-bold text-xs cursor-pointer ${
                    betAmount === preset
                      ? 'bg-[#354059] text-white border border-white/20'
                      : 'bg-[#202636] text-slate-300'
                  }`}
                >
                  {preset} ₹
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Difficulty Tabs (Easy | Medium | Hard | Hardcore) */}
          <div>
            <div className="text-[10px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
              <span>Difficulty</span>
              <span className="text-amber-400 font-mono-num">
                Max Win: {multipliers[multipliers.length - 1]}x
              </span>
            </div>
            <div className="bg-[#151924] rounded-xl p-1 grid grid-cols-4 gap-1 border border-white/5">
              {(['Easy', 'Medium', 'Hard', 'Hardcore'] as Difficulty[]).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  disabled={gameState === 'PLAYING'}
                  onClick={() => {
                    setDifficulty(diff);
                    setCurrentStep(-1);
                    setGameState('IDLE');
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    difficulty === diff
                      ? 'bg-[#333d54] text-white shadow border border-white/15'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Play / Cash Out + Go Action Buttons */}
          {gameState === 'PLAYING' ? (
            <div className="grid grid-cols-2 gap-2.5 pt-0.5">
              <button
                type="button"
                onClick={handleCashOut}
                className="py-3.5 rounded-xl bg-gradient-to-b from-[#fde047] to-[#eab308] text-slate-950 font-display font-black text-sm shadow-lg active:scale-95 cursor-pointer flex flex-col items-center justify-center leading-tight"
              >
                <span>CASH OUT</span>
                <span className="font-mono-num text-xs">
                  {(betAmount * activeMultiplier).toFixed(2)} INR
                </span>
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="py-3.5 rounded-xl bg-gradient-to-b from-[#22c55e] to-[#16a34a] text-white font-display font-black text-lg shadow-lg active:scale-95 cursor-pointer"
              >
                GO
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartGame}
              className="w-full py-3.5 rounded-xl bg-gradient-to-b from-[#22c55e] to-[#15803d] text-white font-display font-black text-lg tracking-wide shadow-[0_4px_14px_rgba(34,197,94,0.4)] active:scale-[0.99] cursor-pointer"
            >
              Play
            </button>
          )}
        </div>

        {/* Live Players Bets & Cashouts Stream */}
        <div className="bg-[#202634] rounded-2xl p-3 border border-white/10 shadow-xl">
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
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] font-bold text-slate-300">
                    {item.difficulty}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono-num text-[11px] text-slate-300">
                    ₹{item.bet}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#252c3d] font-mono-num text-[10px] font-bold text-amber-400">
                    {item.mult}
                  </span>
                </div>

                <div className="text-right font-mono-num font-bold text-[11px]">
                  {item.status === 'cashed' ? (
                    <span className="text-[#22c55e]">+₹{item.winAmount.toFixed(0)}</span>
                  ) : item.status === 'playing' ? (
                    <span className="text-sky-400">Playing...</span>
                  ) : (
                    <span className="text-rose-400">Roasted</span>
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

      {/* Reusable BetResultOverlay for Chicken Road Win or Loss */}
      <BetResultOverlay
        key={overlayResult ? `chicken-${overlayResult.amount}-${overlayResult.won}` : 'idle'}
        open={Boolean(overlayResult)}
        won={Boolean(overlayResult?.won)}
        amount={overlayResult?.amount || 0}
        gameTitle="Chicken Road"
        multiplierText={overlayResult?.multText}
        selectionText={difficulty}
        onClose={handleCloseOverlay}
      />
    </div>
  );
};
