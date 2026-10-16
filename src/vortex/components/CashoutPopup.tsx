import React, { useEffect, useState } from 'react';

interface CashoutPopupProps {
  multiplier: number;
  payout: number;
  onCashout: () => void;
}

export const CashoutPopup: React.FC<CashoutPopupProps> = ({
  multiplier,
  payout,
  onCashout,
}) => {
  const [displayPayout, setDisplayPayout] = useState(payout);

  // Smooth number rollup effect as seen in video (00:31 where it smoothly counts up)
  useEffect(() => {
    let start = 0;
    const duration = 280;
    const startTime = performance.now();

    const animateRollup = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = start + (payout - start) * ease;
      setDisplayPayout(Number(current.toFixed(2)));

      if (progress < 1) {
        requestAnimationFrame(animateRollup);
      } else {
        setDisplayPayout(payout);
      }
    };

    requestAnimationFrame(animateRollup);
  }, [payout]);

  return (
    <div
      onClick={onCashout}
      className="absolute z-20 cursor-pointer animate-pop-in select-none group"
      title="Click to Cash Out"
    >
      <div className="bg-[#0b101b]/95 backdrop-blur-md border border-slate-600/70 hover:border-cyan-400/80 px-6 py-4 rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.85)] flex flex-col items-center justify-center min-w-[170px] min-h-[96px] transition-all transform hover:scale-105 active:scale-95">
        {/* Multiplier Value */}
        <span className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.25)]">
          {multiplier.toFixed(multiplier % 1 === 0 ? 1 : 2)}X
        </span>

        {/* Payout Cash Value */}
        <span className="text-sm sm:text-base font-bold text-slate-300 mt-1 tabular-nums group-hover:text-cyan-300 transition-colors">
          {displayPayout.toFixed(2)}
        </span>
      </div>
    </div>
  );
};
