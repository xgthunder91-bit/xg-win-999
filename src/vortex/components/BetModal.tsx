import React from 'react';
import { BET_PRESETS } from '../game/types.ts';
import { sound } from '../game/sound.ts';
import { X } from 'lucide-react';

interface BetModalProps {
  currentBet: number;
  onSelectBet: (bet: number) => void;
  onClose: () => void;
}

export const BetModal: React.FC<BetModalProps> = ({
  currentBet,
  onSelectBet,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs bg-[#121824] border border-slate-700/80 rounded-2xl shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-lg font-bold text-slate-100 tracking-wide">Bet</h2>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            aria-label="Close Bet Modal"
            className="w-7 h-7 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mt-4">
          {BET_PRESETS.map((preset) => {
            const isSelected = currentBet === preset;
            return (
              <button
                key={preset}
                onClick={() => {
                  sound.playChip();
                  onSelectBet(preset);
                  onClose();
                }}
                className={`py-2.5 px-3 rounded-xl font-bold text-base transition-all active:scale-95 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400 shadow-md shadow-cyan-900/30'
                    : 'bg-[#182030] hover:bg-[#202b40] text-slate-200 border-slate-700/60 hover:border-slate-500'
                }`}
              >
                {preset}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
