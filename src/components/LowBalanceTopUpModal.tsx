import React, { useState } from 'react';
import { X, Check, Wallet, Gift } from 'lucide-react';

/** Mirror of the first-deposit offers shown on the deposit screen. */
export interface TopUpOffer {
  amount: number;
  bonus: number;
}

interface Props {
  offers: TopUpOffer[];
  /** Current wallet balance, used to draw the progress bars. */
  balance: number;
  onDeposit: (amount: number) => void;
  onActivity: () => void;
  onClose: () => void;
}

const fmt = (n: number) => n.toLocaleString('en-IN');

/**
 * Low-balance nudge.
 *
 * Shown when the player tries to leave a game section with almost no money in
 * the wallet. Every card deep-links straight into the deposit screen with that
 * amount already filled in.
 */
export const LowBalanceTopUpModal: React.FC<Props> = ({
  offers,
  balance,
  onDeposit,
  onActivity,
  onClose,
}) => {
  const [muteToday, setMuteToday] = useState(false);

  const pick = (amount: number) => {
    if (muteToday) {
      try {
        localStorage.setItem('xgwin99_topup_mute_date', new Date().toDateString());
      } catch {
        /* storage blocked - ignore */
      }
    }
    onDeposit(amount);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
      {/* Dimmed backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative w-full max-w-[400px] sm:mx-4 mb-0 sm:mb-0 bg-[#f7f7f8] rounded-t-3xl sm:rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.6)] overflow-hidden animate-[fadeUp_.28s_ease-out]">
        {/* Header */}
        <div className="relative px-5 pt-5 pb-3.5 text-center bg-gradient-to-b from-[#fff6ee] to-[#f7f7f8]">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-white/80 border border-[#ff8a1e]/30 flex items-center justify-center cursor-pointer hover:bg-white"
          >
            <X className="w-3.5 h-3.5 text-[#ff8a1e]" />
          </button>

          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#ff9429] to-[#ff5500] flex items-center justify-center mx-auto mb-2 shadow-[0_6px_16px_rgba(255,85,0,0.35)]">
            <Gift className="w-5 h-5 text-white" />
          </div>

          <h3 className="text-[15px] font-bold text-slate-900 leading-tight">
            Extra first deposit bonus
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Each account can only receive rewards once
          </p>
        </div>

        <div className="h-px bg-slate-200/80" />

        {/* Offer cards */}
        <div className="max-h-[46vh] sm:max-h-[52vh] overflow-y-auto px-3.5 py-3 space-y-2.5">
          {offers.map((o) => {
            const done = Math.min(o.amount, Math.max(0, balance));
            const pct = Math.min(100, (done / o.amount) * 100);
            return (
              <div
                key={o.amount}
                className="rounded-2xl bg-white border border-slate-200/80 px-3.5 py-3 shadow-[0_1px_2px_rgba(15,23,42,.05)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[13px] text-slate-700 leading-tight">
                    First deposit{' '}
                    <span className="text-[#ff8a1e] font-bold">{fmt(o.amount)}</span>
                  </div>
                  <div className="text-[13px] text-[#ff8a1e] font-bold shrink-0">
                    + ₹{fmt(o.bonus)}
                  </div>
                </div>

                <p className="text-[10.5px] text-slate-400 leading-relaxed mt-1">
                  Deposit {fmt(o.amount)} for the first time and you will receive {o.bonus} bonus
                </p>

                <div className="flex items-center justify-between gap-3 mt-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="text-[9.5px] text-slate-400 font-medium mb-1">
                      {fmt(done)}/{fmt(o.amount)}
                    </div>
                    <div className="h-1 rounded-full bg-slate-200/80 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#ff9429] to-[#ff5500] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => pick(o.amount)}
                    className="shrink-0 px-3.5 py-1.5 rounded-xl bg-white border border-[#ff8a1e]/70 text-[#ff8a1e] text-[11px] font-bold active:scale-95 transition-transform cursor-pointer"
                  >
                    Deposit
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="h-px bg-slate-200/80" />

        {/* Footer */}
        <div className="px-3.5 py-3 flex items-center justify-between gap-3 bg-white">
          <label className="flex items-center gap-2 cursor-pointer select-none min-w-0">
            <span
              onClick={() => setMuteToday((v) => !v)}
              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                muteToday
                  ? 'bg-[#ff8a1e] border-[#ff8a1e]'
                  : 'bg-white border-slate-300'
              }`}
            >
              {muteToday && <Check className="w-2.5 h-2.5 text-white" />}
            </span>
            <span className="text-[11px] text-slate-500 truncate">
              No more reminders today
            </span>
          </label>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onActivity}
              className="px-3.5 py-2 rounded-xl bg-[#f1f2f4] border border-slate-200 text-[11px] font-bold text-slate-500 cursor-pointer active:scale-95 transition-transform"
            >
              Activity
            </button>
            <button
              type="button"
              onClick={() => pick(offers[0]?.amount ?? 100)}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#ff7a45] to-[#f5222d] text-white text-[11px] font-black flex items-center gap-1.5 shadow-[0_4px_14px_rgba(245,34,45,0.35)] active:scale-95 transition-transform cursor-pointer"
            >
              <Wallet className="w-3 h-3" />
              Deposit Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};