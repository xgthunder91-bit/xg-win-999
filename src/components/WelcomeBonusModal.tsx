import React from 'react';
import { PartyPopper, Gift, ShieldAlert, ArrowRight, Sparkles } from 'lucide-react';

interface Props {
  bonusAmount: number;
  unlockTarget: number;
  onPlay: () => void;
  onDeposit: () => void;
  onClose: () => void;
}

const fmt = (n: number) => n.toLocaleString('en-IN');

/**
 * Shown right after a brand new account is created: the welcome gift lands in
 * the wallet straight away, together with the one rule the player must know -
 * it is bettable, but only becomes withdrawable after the first deposit.
 */
export const WelcomeBonusModal: React.FC<Props> = ({
  bonusAmount,
  unlockTarget,
  onPlay,
  onDeposit,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-[3px]" onClick={onClose} />

      <div className="relative w-full max-w-[380px] bg-gradient-to-b from-[#1b2436] to-[#0f1620] rounded-3xl border border-[#ff8a1e]/25 shadow-[0_24px_70px_rgba(0,0,0,0.7)] overflow-hidden animate-[fadeUp_.3s_ease-out]">
        {/* Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full bg-[#ff8a1e]/20 blur-3xl pointer-events-none" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10"
          aria-label="Close"
        >
          <span className="text-slate-400 text-lg leading-none">×</span>
        </button>

        {/* Body */}
        <div className="relative px-6 pt-8 pb-5 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#ff9429] to-[#ff5500] flex items-center justify-center mx-auto mb-3 shadow-[0_10px_30px_rgba(255,85,0,0.45)]">
            <Gift className="w-9 h-9 text-white" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2ebd59]/15 border border-[#2ebd59]/30 text-[10px] font-black text-[#5ddb86] mb-2">
            <PartyPopper className="w-3 h-3" />
            ACCOUNT CREATED
          </div>

          <h3 className="text-[22px] font-black text-white leading-tight">
            Congratulations!
          </h3>
          <p className="text-[12px] text-slate-400 mt-1">
            Welcome gift added to your wallet
          </p>

          <div className="mt-4 inline-flex items-baseline gap-1.5 px-5 py-2.5 rounded-2xl bg-[#ff8a1e]/10 border border-[#ff8a1e]/35">
            <span className="text-3xl font-black font-mono-num text-[#ff8a1e]">
              ₹{fmt(bonusAmount)}
            </span>
            <span className="text-[11px] font-bold text-[#ffb066]">FREE</span>
          </div>

          {/* Rules */}
          <div className="mt-4 space-y-2 text-left">
            <div className="flex items-start gap-2.5 bg-[#2ebd59]/10 border border-[#2ebd59]/25 rounded-xl px-3 py-2.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2ebd59] mt-0.5 shrink-0" />
              <p className="text-[11px] text-slate-200 leading-relaxed">
                Use it to play WinGo, Aviator and Chicken Road right now.
              </p>
            </div>

            <div className="flex items-start gap-2.5 bg-[#ef4444]/10 border border-[#ef4444]/25 rounded-xl px-3 py-2.5">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-slate-200 leading-relaxed">
                This gift and anything you win with it{' '}
                <b className="text-red-300">cannot be withdrawn yet</b>. Deposit at least{' '}
                <b className="text-white">₹{fmt(unlockTarget)}</b> once and your whole wallet
                becomes withdrawable.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 space-y-2">
            <button
              type="button"
              onClick={onPlay}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#2ebd59] to-[#1f9e4a] text-white text-sm font-black flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(46,189,89,0.35)] active:scale-[0.98] transition-transform cursor-pointer"
            >
              Start Playing
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onDeposit}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#ff9429] to-[#ff5500] text-white text-sm font-black shadow-[0_6px_20px_rgba(255,85,0,0.35)] active:scale-[0.98] transition-transform cursor-pointer"
            >
              Deposit ₹{fmt(unlockTarget)} &amp; Unlock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};