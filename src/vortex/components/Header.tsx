import React from 'react';
import { Volume2, VolumeX, HelpCircle, Sliders, CreditCard, ChevronLeft } from 'lucide-react';
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
    <header className="w-full max-w-sm flex items-center justify-between px-3 py-2 z-20 select-none">
      <div className="flex items-center gap-1.5">
        {onBack && (
          <button
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            aria-label="Back"
            className="w-8 h-8 rounded-full bg-[#141b27]/80 hover:bg-[#1e2838] border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {/* Balance Badge matching live game */}
        <button
          onClick={() => {
            sound.playClick();
            onResetBalance();
          }}
          title="Account Balance"
          aria-label={`Balance: ${balance.toFixed(2)} INR`}
          className="flex items-center gap-2 bg-[#121824]/80 hover:bg-[#1a2333] border border-slate-700/60 hover:border-slate-500/80 px-2.5 py-1.5 rounded-lg shadow-sm transition-all active:scale-95"
        >
          <CreditCard className="w-4 h-4 text-cyan-400" />
          <span className="font-extrabold tracking-wider text-white text-sm tabular-nums">
            {balance.toFixed(2)} INR
          </span>
        </button>
      </div>

      {/* Top Right Utility Icons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            sound.playClick();
            onOpenHelp();
          }}
          aria-label="Game Rules and Payouts"
          className="w-8 h-8 rounded-full bg-[#141b27]/80 hover:bg-[#1e2838] border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleSound}
          aria-label={soundEnabled ? "Mute Sound" : "Enable Sound"}
          className="w-8 h-8 rounded-full bg-[#141b27]/80 hover:bg-[#1e2838] border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-slate-200" />
          ) : (
            <VolumeX className="w-4 h-4 text-rose-400" />
          )}
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onOpenHelp();
          }}
          aria-label="Settings"
          className="w-8 h-8 rounded-full bg-[#141b27]/80 hover:bg-[#1e2838] border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
