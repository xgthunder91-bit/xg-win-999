import React from 'react';
import { Minus, Plus, Zap, Coins, Info } from 'lucide-react';
import { sound } from '../game/sound.ts';
import { BET_PRESETS } from '../game/types.ts';

interface ControlsProps {
  betAmount: number;
  payout: number;
  partPayout: number;
  isSpinning: boolean;
  hasActiveWin: boolean;
  turbo: boolean;
  onSetBet: (bet: number) => void;
  onOpenBetModal: () => void;
  onToggleTurbo: () => void;
  onSpin: () => void;
  onCashout: () => void;
  onPartPayout: () => void;
  onOpenHelp: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  betAmount,
  payout,
  partPayout,
  isSpinning,
  hasActiveWin,
  turbo,
  onSetBet,
  onOpenBetModal,
  onToggleTurbo,
  onSpin,
  onCashout,
  onPartPayout,
  onOpenHelp,
}) => {
  const handleDecreaseBet = () => {
    sound.playChip();
    const currentIdx = BET_PRESETS.indexOf(betAmount as typeof BET_PRESETS[number]);
    if (currentIdx > 0) {
      onSetBet(BET_PRESETS[currentIdx - 1]);
    } else if (currentIdx === -1) {
      const lower = [...BET_PRESETS].reverse().find((p) => p < betAmount);
      if (lower) onSetBet(lower);
    }
  };

  const handleIncreaseBet = () => {
    sound.playChip();
    const currentIdx = BET_PRESETS.indexOf(betAmount as typeof BET_PRESETS[number]);
    if (currentIdx >= 0 && currentIdx < BET_PRESETS.length - 1) {
      onSetBet(BET_PRESETS[currentIdx + 1]);
    } else if (currentIdx === -1) {
      const higher = BET_PRESETS.find((p) => p > betAmount);
      if (higher) onSetBet(higher);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-1.5 select-none z-10 px-3">
      {/* Bet Amount Row */}
      <div className="w-full flex items-center justify-between px-2">
        {/* Coin Stack Presets Button */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenBetModal();
          }}
          aria-label="Open Bet Presets"
          className="w-11 h-11 rounded-full bg-gradient-to-b from-[#1e2738] to-[#101622] border border-[#2d3a52] hover:border-slate-300 text-slate-300 flex items-center justify-center transition-transform active:scale-90 shadow-[0_4px_12px_rgba(0,0,0,0.7)]"
        >
          {/* 3 Gold Coins Stack Icon matching real game */}
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-300 fill-current drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]">
            <ellipse cx="12" cy="6" rx="7.5" ry="2.8" fill="#FDE047" stroke="#CA8A04" strokeWidth="0.8" />
            <path d="M4.5 6 v3.8 c0 1.55 3.36 2.8 7.5 2.8 s7.5 -1.25 7.5 -2.8 v-3.8" fill="#EAB308" stroke="#CA8A04" strokeWidth="0.8" />
            <path d="M4.5 9.8 v3.8 c0 1.55 3.36 2.8 7.5 2.8 s7.5 -1.25 7.5 -2.8 v-3.8" fill="#CA8A04" stroke="#A16207" strokeWidth="0.8" />
            <path d="M4.5 13.6 v3.8 c0 1.55 3.36 2.8 7.5 2.8 s7.5 -1.25 7.5 -2.8 v-3.8" fill="#A16207" stroke="#713F12" strokeWidth="0.8" />
          </svg>
        </button>

        {/* Bet Adjuster Center */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => {
              sound.playClick();
              onOpenHelp();
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-200 transition-colors mb-0.5 tracking-tight"
          >
            <span>Bet Amount</span>
            <span className="w-3.5 h-3.5 rounded-full bg-slate-700/80 text-[9px] font-black text-slate-300 flex items-center justify-center leading-none">
              i
            </span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDecreaseBet}
              disabled={betAmount <= BET_PRESETS[0] || isSpinning}
              aria-label="Decrease Bet"
              className="w-8 h-8 rounded-full bg-gradient-to-b from-[#222c3e] to-[#121824] hover:from-[#2a374d] hover:to-[#182130] disabled:opacity-30 border border-[#33425b] flex items-center justify-center text-slate-200 active:scale-90 shadow-md transition-all cursor-pointer"
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
            </button>

            <span className="text-lg font-black text-white tracking-wider tabular-nums min-w-[95px] text-center drop-shadow-sm font-sans">
              {betAmount.toFixed(2)} INR
            </span>

            <button
              onClick={handleIncreaseBet}
              disabled={betAmount >= BET_PRESETS[BET_PRESETS.length - 1] || isSpinning}
              aria-label="Increase Bet"
              className="w-8 h-8 rounded-full bg-gradient-to-b from-[#222c3e] to-[#121824] hover:from-[#2a374d] hover:to-[#182130] disabled:opacity-30 border border-[#33425b] flex items-center justify-center text-slate-200 active:scale-90 shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Lightning / Turbo Toggle */}
        <button
          onClick={() => {
            sound.playClick();
            onToggleTurbo();
          }}
          aria-label={turbo ? "Disable Turbo Mode" : "Enable Turbo Mode"}
          className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all active:scale-90 shadow-[0_4px_12px_rgba(0,0,0,0.7)] ${
            turbo
              ? 'bg-gradient-to-b from-purple-700 to-purple-950 border-purple-400 text-purple-200 shadow-[0_0_14px_rgba(168,85,247,0.7)]'
              : 'bg-gradient-to-b from-[#1e2738] to-[#101622] border-[#2d3a52] hover:border-slate-300 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className={`w-4 h-4 stroke-[2.2] ${turbo ? 'fill-purple-300 text-purple-200 drop-shadow-[0_0_6px_#c084fc]' : ''}`} />
        </button>
      </div>

      {/* Main Integrated Action Dock matching real game */}
      <div className="w-full flex flex-col items-center mt-1">
        {/* Recessed Pill Dock containing the 3 buttons */}
        <div className="relative flex items-center justify-between w-full max-w-[340px] px-3 py-1.5 rounded-full bg-[#0d121c]/90 border border-slate-800/80 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_4px_15px_rgba(0,0,0,0.5)]">
          {/* 1. CASH OUT Button (Left) */}
          <button
            onClick={() => {
              if (hasActiveWin && !isSpinning) onCashout();
            }}
            disabled={!hasActiveWin || isSpinning}
            aria-label={`Cash Out ${payout.toFixed(2)} INR`}
            className={`w-16 h-16 rounded-full flex flex-col items-center justify-center border font-black text-xs tracking-wider transition-all select-none shadow-lg ${
              hasActiveWin && !isSpinning
                ? 'bg-gradient-to-b from-[#10B981] to-[#047857] border-emerald-300 text-white shadow-[0_0_18px_rgba(16,185,129,0.8)] active:scale-95 cursor-pointer animate-pulse'
                : 'bg-[#151c28] border-slate-700/50 text-slate-500 cursor-not-allowed opacity-50'
            }`}
          >
            <span className="leading-none text-[11px] font-black">CASH</span>
            <span className="leading-none text-[11px] font-black mt-0.5">OUT</span>
          </button>

          {/* 2. Center Glowing Neon Purple VORTEX Spin Button */}
          <div className="relative flex items-center justify-center">
            {/* Outer Purple Halo */}
            <div
              className={`absolute w-24 h-24 rounded-full bg-purple-600/50 blur-xl transition-all ${
                isSpinning ? 'scale-110 opacity-100 bg-purple-500/70' : 'opacity-70 group-hover:opacity-100'
              }`}
            />

            <button
              onClick={() => {
                if (!isSpinning) onSpin();
              }}
              disabled={isSpinning}
              aria-label="Spin Vortex"
              className="relative w-20 h-20 rounded-full bg-gradient-to-b from-[#9d3df2] via-[#7d22dc] to-[#5a11ad] border-2 border-purple-200 shadow-[0_0_25px_rgba(157,61,242,0.9),inset_0_2px_4px_rgba(255,255,255,0.4)] flex items-center justify-center focus:outline-none transition-transform active:scale-95 cursor-pointer overflow-hidden"
            >
              {/* White Spiral Icon from real game */}
              <svg viewBox="0 0 100 100" className={`w-12 h-12 transition-transform duration-500 ${isSpinning ? 'animate-spin' : ''}`}>
                <path
                  d="M50 15 C69.3 15 85 30.7 85 50 C85 69.3 69.3 85 50 85 C30.7 85 15 69.3 15 50 C15 35 24 23 37 18 C46 14 56 16 63 22 C70 28 73 38 71 47 C69 56 61 63 52 64 C43 65 35 59 34 50 C33 43 38 37 45 36 C50 35 55 38 56 43 C57 47 54 50 50 51"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="6"
                  strokeLinecap="round"
                  filter="drop-shadow(0 0 4px rgba(255,255,255,0.9))"
                />
              </svg>
            </button>
          </div>

          {/* 3. Autospin / Repeat Button (Right) */}
          <button
            onClick={() => {
              if (hasActiveWin && !isSpinning && partPayout > 0) {
                onPartPayout();
              } else if (!isSpinning) {
                onSpin();
              }
            }}
            aria-label="Spin 1 Time"
            className="w-16 h-16 rounded-full bg-[#151c28] border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
          >
            {/* Clockwise circular arrow enclosing 1 matching real game */}
            <div className="relative flex items-center justify-center w-8 h-8">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-slate-300 stroke-current fill-none stroke-[2]">
                <path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.8 1 6.4 2.6L21 8" strokeLinecap="round" />
                <polyline points="21 3 21 8 16 8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="absolute text-[11px] font-black text-slate-200">1</span>
            </div>
          </button>
        </div>

        {/* Labels below dock: Payout & Part PayOut */}
        <div className="w-full max-w-[340px] flex items-center justify-between px-4 pt-1">
          {/* Payout */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-slate-400 font-medium">Payout</span>
            <span className="text-xs font-bold text-white tabular-nums">
              {payout > 0 ? `${payout.toFixed(2)} INR` : '0.00 INR'}
            </span>
          </div>

          {/* Part PayOut */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-slate-400 font-medium">Part PayOut</span>
            <span className="text-xs font-bold text-slate-300 tabular-nums">
              {partPayout > 0 ? `${partPayout.toFixed(2)} INR` : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
