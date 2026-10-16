import React, { useEffect, useRef, useState } from 'react';
import { Header } from '../vortex/components/Header.tsx';
import { Footer } from '../vortex/components/Footer.tsx';
import { VortexWheel } from '../vortex/components/VortexWheel.tsx';
import { Controls } from '../vortex/components/Controls.tsx';
import { BetModal } from '../vortex/components/BetModal.tsx';
import { HelpModal } from '../vortex/components/HelpModal.tsx';
import { CashoutPopup } from '../vortex/components/CashoutPopup.tsx';
import { sound } from '../vortex/game/sound.ts';
import type { RollOutcome } from '../vortex/game/types.ts';
import { apiPost } from '../utils/api';

interface VortexGameProps {
  balance: number;
  userId: string | null;
  onBalanceSync: (balance: number) => void;
  onBack: () => void;
  onOpenDeposit: () => void;
}

interface SpinData {
  balance: number;
  outcome: RollOutcome;
  bust: boolean;
  water: number;
  earth: number;
  fire: number;
  bonus: number;
  multiplier: number;
  payout: number;
  partPayout: number;
  active: boolean;
  roundId: number;
  stake: number;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const VortexGame: React.FC<VortexGameProps> = ({
  balance,
  userId,
  onBalanceSync,
  onBack,
  onOpenDeposit,
}) => {
  const [bet, setBet] = useState<number>(10);
  const [turbo, setTurbo] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [spinning, setSpinning] = useState(false);
  const [outcome, setOutcome] = useState<RollOutcome | null>(null);
  const [water, setWater] = useState(0);
  const [earth, setEarth] = useState(0);
  const [fire, setFire] = useState(0);
  const [multiplier, setMultiplier] = useState(0);
  const [payout, setPayout] = useState(0);
  const [partPayout, setPartPayout] = useState(0);
  const [roundActive, setRoundActive] = useState(false);
  const [isBust, setIsBust] = useState(false);

  const [showBetModal, setShowBetModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // keep live values readable from the async hold loop
  const betRef = useRef(bet);
  const balanceRef = useRef(balance);
  const turboRef = useRef(turbo);
  const spinLockRef = useRef(false);
  const holdingRef = useRef(false);
  const toastAtRef = useRef(0);

  useEffect(() => {
    betRef.current = bet;
  }, [bet]);
  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);
  useEffect(() => {
    turboRef.current = turbo;
  }, [turbo]);
  useEffect(() => {
    sound.enabled = soundEnabled;
  }, [soundEnabled]);

  const flash = (msg: string) => {
    const t = Date.now();
    if (t - toastAtRef.current < 900) return;
    toastAtRef.current = t;
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 1800);
  };

  // Safety: if the pointer is released anywhere, stop the hold loop.
  useEffect(() => {
    const stop = () => {
      holdingRef.current = false;
    };
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    window.addEventListener('touchend', stop);
    return () => {
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
      window.removeEventListener('touchend', stop);
    };
  }, []);

  const spinOnce = async (): Promise<boolean> => {
    if (spinLockRef.current) return true;
    if (!userId) {
      flash('Login required');
      onOpenDeposit();
      return false;
    }
    const stake = betRef.current;
    if (balanceRef.current < stake) {
      flash('Insufficient balance');
      return false;
    }

    spinLockRef.current = true;
    setSpinning(true);
    setIsBust(false);
    setOutcome(null);
    sound.playSpinStart();
    sound.playVortexDrone(turboRef.current ? 0.3 : 0.6);

    let ok = true;
    try {
      const res: any = await apiPost('/game/vortex/spin', { userId, bet: stake });
      if (!res?.success || !res?.data) {
        flash(res?.message || 'Spin failed');
        ok = false;
        return ok;
      }
      await delay(turboRef.current ? 240 : 620);
      const d = res.data as SpinData;
      setOutcome(d.outcome);
      setWater(d.water);
      setEarth(d.earth);
      setFire(d.fire);
      setMultiplier(d.multiplier);
      setPayout(d.payout);
      setPartPayout(d.partPayout);
      setRoundActive(d.active);
      setIsBust(d.bust);
      onBalanceSync(d.balance);

      if (d.bust) sound.playSkullBust();
      else if (d.outcome === 'water') sound.playWaterHit();
      else if (d.outcome === 'earth') sound.playEarthHit();
      else if (d.outcome === 'fire') sound.playFireHit();
      else if (d.outcome === 'cloud') sound.playCloudHit();
      else if (d.outcome === 'bonus') sound.playCashout();
      if (d.bust) ok = false;
    } catch {
      flash('Network error');
      ok = false;
    } finally {
      setSpinning(false);
      spinLockRef.current = false;
    }
    return ok;
  };

  const runHold = async () => {
    holdingRef.current = true;
    while (holdingRef.current) {
      const ok = await spinOnce();
      if (!ok) break;
      if (!holdingRef.current) break;
      await delay(turboRef.current ? 60 : 130);
    }
    holdingRef.current = false;
  };

  const onHoldStart = () => {
    if (holdingRef.current || spinLockRef.current) return;
    void runHold();
  };
  const onHoldEnd = () => {
    holdingRef.current = false;
  };

  const doCashout = async () => {
    if (spinLockRef.current || !roundActive) return;
    spinLockRef.current = true;
    try {
      const res: any = await apiPost('/game/vortex/cashout', { userId, bet: betRef.current });
      if (!res?.success || !res?.data) {
        flash(res?.message || 'Cash out failed');
        return;
      }
      sound.playCashout();
      onBalanceSync(res.data.balance);
      flash(`Cashed out ${Number(res.data.credited).toFixed(2)} INR`);
      setWater(0);
      setEarth(0);
      setFire(0);
      setMultiplier(0);
      setPayout(0);
      setPartPayout(0);
      setRoundActive(false);
      setOutcome(null);
    } catch {
      flash('Network error');
    } finally {
      spinLockRef.current = false;
    }
  };

  const doPartPayout = async () => {
    if (spinLockRef.current || !roundActive || partPayout <= 0) return;
    spinLockRef.current = true;
    try {
      const res: any = await apiPost('/game/vortex/part', { userId, bet: betRef.current });
      if (!res?.success || !res?.data) {
        flash(res?.message || 'Part payout failed');
        return;
      }
      sound.playCashout();
      onBalanceSync(res.data.balance);
      flash(`Part payout ${Number(res.data.part).toFixed(2)} INR`);
      setPartPayout(0);
    } catch {
      flash('Network error');
    } finally {
      spinLockRef.current = false;
    }
  };

  const hasActiveWin = roundActive && multiplier > 0;

  return (
    <div className="relative min-h-screen w-full bg-[#0a0d14] text-white flex flex-col items-center justify-between overflow-hidden select-none">
      {/* ambient backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(circle at 50% 38%, rgba(88,28,135,0.35) 0%, rgba(10,13,20,0) 60%)',
        }}
      />

      <Header
        balance={balance}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((s) => !s)}
        onOpenHelp={() => setShowHelpModal(true)}
        onResetBalance={onOpenDeposit}
        onBack={onBack}
      />

      <main className="relative flex-1 w-full flex flex-col items-center justify-center gap-3 py-1">
        <VortexWheel
          waterStep={water}
          earthStep={earth}
          fireStep={fire}
          isSpinning={spinning}
          outcome={outcome}
          isBust={isBust}
          onOpenBonusInfo={() => setShowHelpModal(true)}
        />

        {hasActiveWin && !spinning && (
          <CashoutPopup
            multiplier={multiplier}
            payout={payout}
            onCashout={doCashout}
          />
        )}

        {toast && (
          <div className="absolute top-2 z-30 px-3 py-1.5 rounded-full bg-black/80 border border-white/15 text-xs font-bold text-white animate-pop-in">
            {toast}
          </div>
        )}

        <Controls
          betAmount={bet}
          payout={payout}
          partPayout={partPayout}
          isSpinning={spinning}
          hasActiveWin={hasActiveWin}
          turbo={turbo}
          onSetBet={setBet}
          onOpenBetModal={() => setShowBetModal(true)}
          onToggleTurbo={() => setTurbo((t) => !t)}
          onSpin={() => void spinOnce()}
          onHoldStart={onHoldStart}
          onHoldEnd={onHoldEnd}
          onCashout={doCashout}
          onPartPayout={doPartPayout}
          onOpenHelp={() => setShowHelpModal(true)}
        />
      </main>

      <Footer />

      {showBetModal && (
        <BetModal
          currentBet={bet}
          onSelectBet={(b) => {
            setBet(b);
            sound.playChip();
          }}
          onClose={() => setShowBetModal(false)}
        />
      )}

      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}
    </div>
  );
};
