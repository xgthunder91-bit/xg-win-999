import React from 'react';
import { Gift, Lock, ArrowRight, Sparkles, ShieldAlert, Crown, X } from 'lucide-react';

interface Props {
  bonusAmount: number;
  unlockTarget: number;
  onPlay: () => void;
  onDeposit: () => void;
  onClose: () => void;
}

const fmt = (n: number) => n.toLocaleString('en-IN');

/** Twinkling sparkles scattered across the hero band. */
const SPARKLES = [
  { top: '20%', left: '12%', delay: '0s', size: 6 },
  { top: '32%', left: '85%', delay: '0.7s', size: 4 },
  { top: '14%', left: '60%', delay: '1.2s', size: 5 },
  { top: '60%', left: '7%', delay: '1.6s', size: 4 },
  { top: '54%', left: '92%', delay: '0.35s', size: 5 },
  { top: '78%', left: '18%', delay: '1.9s', size: 4 },
  { top: '72%', left: '87%', delay: '1.05s', size: 5 },
  { top: '88%', left: '55%', delay: '0.5s', size: 4 },
];

/**
 * Welcome gift shown right after a brand new account is created. Rendered in a
 * rich dark surface with the game's orange/gold accents so it feels native to
 * the WinGo / Aviator shell rather than a bolted-on dialog.
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
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
        aria-hidden
      />

      <div className="anim-celebrate-in relative w-full max-w-[372px] overflow-hidden rounded-[30px] border border-[#ff8a1e]/20 bg-[#0f1622] shadow-[0_30px_90px_-12px_rgba(0,0,0,0.9)]">
        {/* Warm glow bleeding into the panel */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-52 w-72 -translate-x-1/2 rounded-full bg-[#ff8a1e]/20 blur-[70px]" />

        {/* ===== Hero band ===== */}
        <div className="shimmer-wrap relative h-[134px] overflow-hidden bg-gradient-to-br from-[#ff9a2e] via-[#ff7b1b] to-[#ef5e00]">
          <div className="pointer-events-none absolute -top-10 -left-10 h-36 w-36 rounded-full bg-white/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-2 -bottom-14 h-36 w-36 rounded-full bg-[#ffe08a]/45 blur-3xl" />
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,.75) 1px, transparent 1.5px)',
              backgroundSize: '18px 18px',
            }}
          />

          {SPARKLES.map((s, i) => (
            <span
              key={i}
              className="anim-sparkle pointer-events-none absolute text-white/90"
              style={{ top: s.top, left: s.left, animationDelay: s.delay }}
            >
              <Sparkles style={{ width: s.size, height: s.size }} />
            </span>
          ))}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3.5 right-3.5 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/20 text-white/90 ring-1 ring-white/30 backdrop-blur-sm transition-colors hover:bg-black/35"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative z-10 flex h-full flex-col items-center pt-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white ring-1 ring-white/25 backdrop-blur-sm">
              <Crown className="h-3 w-3" />
              Welcome Gift
            </span>
          </div>

          {/* Gold hairline */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>

        {/* ===== Medallion ===== */}
        <div className="relative flex justify-center">
          <div className="anim-medallion-float absolute -top-9 flex h-[78px] w-[78px] items-center justify-center rounded-full bg-[#0f1622] p-[3px] shadow-[0_12px_34px_rgba(255,120,0,0.5)] ring-1 ring-white/10">
            <div className="anim-glow-pulse shimmer-wrap flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#ffd479] via-[#ff9a2e] to-[#ff6200]">
              <Gift className="relative z-10 h-9 w-9 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]" />
            </div>
          </div>
        </div>

        {/* ===== Body ===== */}
        <div className="relative px-6 pt-12 pb-6">
          <h3 className="anim-title-pop font-display text-center text-2xl font-black leading-tight text-white">
            Congratulations!
          </h3>
          <p className="mt-1.5 text-center text-[11.5px] text-slate-400">
            {`₹${fmt(bonusAmount)} welcome gift is now in your wallet`}
          </p>

          {/* Amount */}
          <div className="shimmer-wrap anim-money-pop mt-4 flex items-center justify-center gap-2.5 rounded-2xl border border-[#ff8a1e]/25 bg-[#141d2a] px-5 py-3.5">
            <span className="font-mono-num text-[34px] font-black leading-none text-[#ff9a2e]">
              ₹{fmt(bonusAmount)}
            </span>
            <span className="rounded-md bg-gradient-to-br from-[#ff9429] to-[#ff5500] px-2 py-0.5 text-[10px] font-black tracking-wide text-white">
              FREE
            </span>
          </div>

          {/* Rules */}
          <div className="mt-4 space-y-2">
            <div className="flex items-start gap-2.5 rounded-2xl border border-[#2ebd59]/25 bg-[#2ebd59]/10 px-3.5 py-3">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2ebd59]" />
              <p className="text-[11px] leading-relaxed text-slate-300">
                Play WinGo, Aviator &amp; Chicken Road with it right now.
              </p>
            </div>

            <div className="flex items-start gap-2.5 rounded-2xl border border-[#ff8a1e]/25 bg-[#ff8a1e]/10 px-3.5 py-3">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff8a1e]" />
              <p className="text-[11px] leading-relaxed text-slate-300">
                This gift and whatever you win with it is{' '}
                <b className="text-[#ff9a2e]">locked for withdrawal</b>. Deposit ₹
                {fmt(unlockTarget)} once to unlock your whole wallet.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 space-y-2.5">
            <button
              type="button"
              onClick={onPlay}
              className="shimmer-wrap flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff9429] to-[#f56a00] py-3.5 text-[13px] font-black text-white shadow-[0_10px_26px_rgba(255,105,0,0.4)] transition-transform active:scale-[0.98]"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Playing
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>

            <button
              type="button"
              onClick={onDeposit}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[#ff8a1e]/40 bg-[#141d2a] py-3.5 text-[13px] font-black text-slate-100 transition-colors hover:bg-[#1a2434]"
            >
              <ShieldAlert className="h-4 w-4 text-[#ff9a2e]" />
              Deposit ₹{fmt(unlockTarget)} &amp; Unlock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
