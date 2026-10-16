import React from 'react';
import { X, ShieldAlert, Award, Sparkles, Droplets, Leaf, Flame } from 'lucide-react';
import { sound } from '../game/sound.ts';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-[#101622] border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">How to Play Vortex</h2>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            aria-label="Close Rules"
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mt-4 text-sm leading-relaxed">
          {/* Objective */}
          <div className="bg-[#172030]/80 p-3.5 rounded-xl border border-slate-700/50">
            <h3 className="font-semibold text-white mb-1 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-cyan-400" />
              Game Objective
            </h3>
            <p className="text-slate-300 text-xs">
              Place your bet and spin the center Vortex. Each elemental symbol advances its corresponding concentric track, unlocking increasingly massive multipliers!
            </p>
          </div>

          {/* Elemental Tracks */}
          <div className="space-y-2">
            <h3 className="font-semibold text-white text-xs uppercase tracking-wider text-slate-400">
              The 3 Multiplier Tracks
            </h3>

            <div className="flex items-start gap-3 bg-[#0f1724] p-3 rounded-xl border border-cyan-900/50">
              <Droplets className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-cyan-400">Water Track (Inner Ring)</span>
                <p className="text-xs text-slate-300 mt-0.5">
                  Frequent hits. Steps: 1.55X → 4.85X → 16X → 10X → +7X Bonus → +20.5X Bonus.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-[#0f1724] p-3 rounded-xl border border-emerald-900/50">
              <Leaf className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-400">Earth Track (Middle Ring)</span>
                <p className="text-xs text-slate-300 mt-0.5">
                  Balanced risk & reward. Steps: 2.5X → 7.7X → 52X → 27.5X → 44X → BONUS Mystery.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-[#0f1724] p-3 rounded-xl border border-rose-900/50">
              <Flame className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-400">Fire Track (Outer Ring)</span>
                <p className="text-xs text-slate-300 mt-0.5">
                  High roller jackpot ladder! Steps: 3.9X → 12.5X → 28X → 85X → 133X → 200X Jackpot!
                </p>
              </div>
            </div>
          </div>

          {/* Risks & Safe Outcomes */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-[#1f1717] p-3 rounded-xl border border-rose-900/40">
              <div className="flex items-center gap-1.5 font-bold text-rose-400 text-xs mb-1">
                <ShieldAlert className="w-4 h-4" />
                Skull (Bust)
              </div>
              <p className="text-xs text-slate-300">
                Resets all progress and voids accumulated payout. Cash out before the skull strikes!
              </p>
            </div>

            <div className="bg-[#172030] p-3 rounded-xl border border-slate-700/40">
              <div className="font-bold text-slate-200 text-xs mb-1">
                Cloud (Safe Roll)
              </div>
              <p className="text-xs text-slate-300">
                Neutral mist. No step gained, but your current multiplier is 100% safe to spin again!
              </p>
            </div>
          </div>

          {/* Strategy Tip: Part Payout */}
          <div className="bg-purple-950/40 border border-purple-800/40 p-3 rounded-xl">
            <span className="font-bold text-purple-300 text-xs block mb-1">
              Smart Strategy: Part PayOut (1/2)
            </span>
            <p className="text-xs text-purple-200/90">
              Use Part PayOut to secure 50% of your winnings directly into your balance, while continuing your run to hunt for bigger 50X - 200X multipliers!
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="w-full mt-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition-colors shadow-lg active:scale-98"
        >
          Got It
        </button>
      </div>
    </div>
  );
};
