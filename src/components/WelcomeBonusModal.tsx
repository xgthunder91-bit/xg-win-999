import React from 'react';
import { PartyPopper, Gift, Lock, ArrowRight, Sparkles, ShieldAlert } from 'lucide-react';

interface Props {
  bonusAmount: number;
  unlockTarget: number;
  onPlay: () => void;
  onDeposit: () => void;
  onClose: () => void;
}

const fmt = (n: number) => n.toLocaleString('en-IN');

/**
 * Shown right after a brand new account is created. Uses the same dark
 * surfaces and orange accent as the rest of the app.
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
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[380px] bg-[#151e2b] rounded-3xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden animate-[fadeUp_.28s_ease-out]">
        {/* Orange glow bleeding from the top */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-64 -translate-x-1/2 rounded-full bg-[#ff8a1e]/25 blur-[60px]" />

        {/* Thin orange accent line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff8a1e]/70 to-transparent" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3.5 right-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#1c2635] text-slate-400 transition-colors hover:text-white cursor-pointer"
        >
          <span className="text-lg leading-none">×</span>
        </button>

        <div className="relative px-6 pb-6 pt-7">
          {/* Gift */}
          <div className="mx-auto mb-3 flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff9429] to-[#ff5500] shadow-[0_8px_24px_rgba(255,85,0,0.35)]">
            <Gift className="h-8 w-8 text-white" />
          </div>

          {/* Badge */}
          <div className="mb-2 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff8a1e]/30 bg-[#ff8a1e]/12 px-2.5 py-1 text-[10px] font-black text-[#ff8a1e]">
              <PartyPopper className="h-3 w-3" />
              ACCOUNT CREATED
            </span>
          </div>

          <h3 className="text-center text-xl font-black leading-tight text-white">
            Congratulations!
          </h3>
          <p className="mt-1 text-center text-[11px] text-slate-400">
            Welcome gift added to your wallet
          </p>

          {/* Amount */}
          <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-[#ff8a1e]/25 bg-[#0f1720] px-5 py-3">
            <span className="font-mono-num text-3xl font-black leading-none text-[#ff8a1e]">
              ₹{fmt(bonusAmount)}
            </span>
            <span className="rounded-md bg-[#ff8a1e]/15 px-1.5 py-0.5 text-[10px] font-black text-[#ff8a1e]">
              FREE
            </span>
          </div>

          {/* Rules */}
          <div className="mt-4 space-y-2">
            <div className="flex items-start gap-2.5 rounded-xl border border-[#2ebd59]/25 bg-[#2ebd59]/10 px-3 py-2.5">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2ebd59]" />
              <p className="text-[11px] leading-relaxed text-slate-300">
                Play WinGo, Aviator and Chicken Road with it right now.
              </p>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-[#ff8a1e]/25 bg-[#ff8a1e]/10 px-3 py-2.5">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff8a1e]" />
              <p className="text-[11px] leading-relaxed text-slate-300">
                This gift and whatever you win with it is{' '}
                <b className="text-[#ff8a1e]">locked for withdrawal</b>. Deposit ₹
                {fmt(unlockTarget)} once to unlock your whole wallet.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 space-y-2">
            <button
              type="button"
              onClick={onPlay}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff9429] to-[#ff6300] py-3 text-xs font-black text-white shadow-[0_6px_18px_rgba(255,99,0,0.3)] transition-transform active:scale-[0.98]"
            >
              Start Playing
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={onDeposit}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#1c2635] py-3 text-xs font-black text-slate-200 transition-colors hover:bg-[#232f42]"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-[#ff8a1e]" />
              Deposit ₹{fmt(unlockTarget)} &amp; Unlock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};