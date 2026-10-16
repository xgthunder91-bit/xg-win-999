import React from 'react';
import { Volume2, VolumeX, HelpCircle, SlidersHorizontal, CreditCard, ChevronLeft } from 'lucide-react';
import { sound } from '../game/sound.ts';

interface HeaderProps {
  balance: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenHelp: () => void;
  onResetBalance: () => void;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  balance,
  soundEnabled,
  onToggleSound,
  onOpenHelp,
  onResetBalance,
  onBack,
}) => {
  return (
    <header className="w-full flex items-center justify-between px-4 pt-3 pb-1 z-20 select-none">
      {/* Balance Display matching real game (00:00) */}
      <div className="flex items-center gap-1.5">
        {onBack && (
          <button
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            aria-label="Back"
            className="w-8 h-8 rounded-full border border-slate-600/60 bg-[#121824]/80 hover:bg-[#1a2333] flex items-center justify-center text-slate-200 hover:text-white transition-all shadow-sm active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
        )}
        <button
          onClick={() => {
            sound.playClick();
            if (balance <= 5) onResetBalance();
          }}
          title="Balance (tap to reload if depleted)"
          aria-label={`Balance: ${balance.toFixed(2)} INR`}
          className="flex items-center gap-2 text-white hover:text-cyan-300 transition-colors cursor-pointer group"
        >
          <CreditCard className="w-5 h-5 text-slate-100 group-hover:text-cyan-400 stroke-[2.2]" />
          <span className="font-black tracking-wide text-white text-base tabular-nums drop-shadow-sm font-sans">
            {balance.toFixed(2)} INR
          </span>
        </button>
      </div>

      {/* Top Right 3 Icons matching real game: (?) 🔊 🎚️ */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => {
            sound.playClick();
            onOpenHelp();
          }}
          aria-label="Game Rules and Payouts"
          className="w-8 h-8 rounded-full border border-slate-600/60 bg-[#121824]/80 hover:bg-[#1a2333] flex items-center justify-center text-slate-200 hover:text-white transition-all shadow-sm active:scale-95"
        >
          <HelpCircle className="w-4 h-4 stroke-[2]" />
        </button>

        <button
          onClick={onToggleSound}
          aria-label={soundEnabled ? "Mute Sound" : "Enable Sound"}
          className="w-8 h-8 rounded-full border border-slate-600/60 bg-[#121824]/80 hover:bg-[#1a2333] flex items-center justify-center text-slate-200 hover:text-white transition-all shadow-sm active:scale-95"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-slate-100 stroke-[2]" />
          ) : (
            <VolumeX className="w-4 h-4 text-rose-400 stroke-[2]" />
          )}
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onOpenHelp();
          }}
          aria-label="Game Settings"
          className="w-8 h-8 rounded-full border border-slate-600/60 bg-[#121824]/80 hover:bg-[#1a2333] flex items-center justify-center text-slate-200 hover:text-white transition-all shadow-sm active:scale-95"
        >
          <SlidersHorizontal className="w-4 h-4 stroke-[2]" />
        </button>
      </div>
    </header>
  );
};
