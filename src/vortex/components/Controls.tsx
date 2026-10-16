import React from 'react';
import { Minus, Plus, Zap, Coins, Info, RotateCw } from 'lucide-react';
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
  onHoldStart?: () => void;
  onHoldEnd?: () => void;
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
  onHoldStart,
  onHoldEnd,
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

  const startHold = () => {
    onHoldStart ? onHoldStart() : onSpin();
  };

  const stopHold = () => {
    onHoldEnd ? onHoldEnd() : undefined;
  };

  return (
    <div className="w-full max-w-sm px-2 flex flex-col items-center gap-2.5 select-none z-10">
      {/* Bet Amount Row */}
      <div className="w-full flex items-center justify-between px-3">
        {/* Coin Stack Presets Button */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenBetModal();
          }}
          aria-label="Open Bet Presets"
          className="w-11 h-11 rounded-full bg-gradient-to-b from-[#242e42] to-[#121824] border border-[#334155]/60 hover:border-slate-400 text-slate-300 flex items-center justify-center transition-transform active:scale-90 shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
        >
          <Coins className="w-5 h-5 text-amber-300 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]" />
        </button>

        {/* Bet Adjuster Pill */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => {
              sound.playClick();
              onOpenHelp();
            }}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition-colors mb-0.5"
          >
            <span>Bet Amount</span>
            <Info className="w-3 h-3 text-slate-500" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDecreaseBet}
              disabled={betAmount <= BET_PRESETS[0] || isSpinning}
              aria-label="Decrease Bet"
              className="w-8 h-8 rounded-full bg-gradient-to-b from-[#222b3d] to-[#141b27] hover:from-[#2d3a52] hover:to-[#1a2333] disabled:opacity-30 border border-slate-700/80 flex items-center justify-center text-slate-200 active:scale-90 shadow-md transition-all"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <span className="text-base font-black text-white tracking-wider tabular-nums min-w-[85px] text-center drop-shadow-sm">
              {betAmount.toFixed(2)} INR
            </span>

            <button
              onClick={handleIncreaseBet}
              disabled={betAmount >= BET_PRESETS[BET_PRESETS.length - 1] || isSpinning}
              aria-label="Increase Bet"
              className="w-8 h-8 rounded-full bg-gradient-to-b from-[#222b3d] to-[#141b27] hover:from-[#2d3a52] hover:to-[#1a2333] disabled:opacity-30 border border-slate-700/80 flex items-center justify-center text-slate-200 active:scale-90 shadow-md transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Turbo Mode Lightning Toggle */}
        <button
          onClick={() => {
            sound.playClick();
            onToggleTurbo();
          }}
          aria-label={turbo ? "Disable Turbo Mode" : "Enable Turbo Mode"}
          className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all active:scale-90 shadow-[0_4px_10px_rgba(0,0,0,0.5)] ${
            turbo
              ? 'bg-gradient-to-b from-purple-800 to-purple-950 border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.5)]'
              : 'bg-gradient-to-b from-[#242e42] to-[#121824] border-[#334155]/60 hover:border-slate-400 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className={`w-5 h-5 ${turbo ? 'fill-purple-300 text-purple-200 drop-shadow-[0_0_6px_#c084fc]' : ''}`} />
        </button>
      </div>

      {/* Main Action Bar: CASH OUT | Big Purple VORTEX SPIN | Part PayOut */}
      <div className="w-full flex items-center justify-between px-2 pt-1">
        {/* Cash Out Button */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => {
              if (hasActiveWin && !isSpinning) onCashout();
            }}
            disabled={!hasActiveWin || isSpinning}
            aria-label={`Cash Out ${payout.toFixed(2)} INR`}
            className={`w-20 h-16 rounded-2xl flex flex-col items-center justify-center border font-black text-xs tracking-wider transition-all select-none shadow-lg ${
              hasActiveWin && !isSpinning
                ? 'bg-gradient-to-b from-[#1e293b] to-[#0f172a] border-cyan-400 text-white shadow-[0_0_18px_rgba(6,182,212,0.5)] active:scale-95 cursor-pointer hover:border-cyan-300'
                : 'bg-[#121824]/60 border-slate-800 text-slate-600 cursor-not-allowed opacity-40'
            }`}
          >
            <span className="leading-tight">CASH</span>
            <span className="leading-tight">OUT</span>
          </button>
          <div className="mt-1 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-medium">Payout</span>
            <span className="text-xs font-bold text-slate-200 tabular-nums">
              {payout > 0 ? `${payout.toFixed(2)} INR` : '0.00 INR'}
            </span>
          </div>
        </div>

        {/* Center: Official Purple Galaxy Swirl Spin Button */}
        <div className="relative flex flex-col items-center -mt-1">
          <button
            onMouseDown={startHold}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={(e) => {
              e.preventDefault();
              startHold();
            }}
            onTouchEnd={stopHold}
            aria-label="Hold to Spin Vortex"
            className="group relative w-22 h-22 rounded-full p-1 focus:outline-none transition-transform active:scale-95"
          >
            {/* Bright Luminous Magenta/Purple Neon Glow Halo */}
            <div
              className={`absolute inset-[-4px] rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-600 to-indigo-500 blur-lg opacity-85 group-hover:opacity-100 transition-opacity ${
                isSpinning ? 'animate-spin' : ''
              }`}
            />

            {/* Main Button Body */}
            <div className="relative w-full h-full rounded-full bg-gradient-to-b from-[#9333EA] via-[#7E22CE] to-[#581C87] border-2 border-purple-200 shadow-[0_4px_20px_rgba(147,51,234,0.7)] flex flex-col items-center justify-center overflow-hidden">
              {/* Official Two-Arm Vortex Swirl Icon */}
              <svg
                viewBox="0 0 100 100"
                className={`w-14 h-14 text-white fill-none stroke-current transition-transform duration-500 ${
                  isSpinning ? 'animate-spin' : 'group-hover:rotate-90'
                }`}
                strokeWidth="5"
                strokeLinecap="round"
              >
                {/* Clean two-arm spiral matching real game */}
                <path d="M50 20 A30 30 0 0 1 80 50 A30 30 0 0 1 50 80 A30 30 0 0 1 20 50 A30 30 0 0 1 50 20 Z" opacity="0.3" strokeWidth="2" />
                <path d="M50 15 A35 35 0 0 1 85 50 A35 35 0 0 1 50 85 A35 35 0 0 1 15 50 A25 25 0 0 1 50 25 A25 25 0 0 1 75 50 A15 15 0 0 1 50 65 A15 15 0 0 1 35 50 A5 5 0 0 1 50 45" />
              </svg>
            </div>
          </button>
        </div>

        {/* Part PayOut Button (1 or 1/2) */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => {
              if (hasActiveWin && !isSpinning && partPayout > 0) onPartPayout();
            }}
            disabled={!hasActiveWin || isSpinning || partPayout <= 0}
            aria-label={`Part PayOut ${partPayout.toFixed(2)} INR`}
            className={`w-16 h-16 rounded-full flex flex-col items-center justify-center border font-black transition-all select-none shadow-lg ${
              hasActiveWin && !isSpinning && partPayout > 0
                ? 'bg-gradient-to-b from-[#1e293b] to-[#0f172a] border-purple-400 text-white shadow-[0_0_16px_rgba(168,85,247,0.5)] active:scale-95 cursor-pointer hover:border-purple-300'
                : 'bg-[#121824]/60 border-slate-800 text-slate-600 cursor-not-allowed opacity-40'
            }`}
          >
            <div className="flex items-center gap-0.5">
              <RotateCw className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-sm font-extrabold text-slate-200">1</span>
            </div>
          </button>
          <div className="mt-1 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-medium">Part PayOut</span>
            <span className="text-xs font-bold text-slate-200 tabular-nums">
              {partPayout > 0 ? `${partPayout.toFixed(2)} INR` : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
