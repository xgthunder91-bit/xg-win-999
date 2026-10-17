import { useEffect, useRef, useState } from 'react';
import { adminGet, adminPost } from '../api';
import type { GameStateResponse, WinGoState, AviatorState, VortexState } from '../types';
import { GAME_OPTIONS } from '../utils/format';
import { Lock, X, Loader2 } from 'lucide-react';
import { CasinoBall } from './CasinoBall';
import { SpribeJet } from './SpribeJet';

const DEFAULT_PANELS = ['wingo:30s', 'wingo:1m', 'aviator', 'wingo:3m'];

export function GameInfo() {
  const [panels, setPanels] = useState<string[]>(DEFAULT_PANELS);
  const [state, setState] = useState<GameStateResponse | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => {
      adminGet('/admin/game/state')
        .then((res) => {
          if (alive) setState(res.data);
        })
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 1000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2400);
  };

  const setPanel = (idx: number, value: string) =>
    setPanels((p) => p.map((x, i) => (i === idx ? value : x)));

  return (
    <div className="space-y-5 relative">
      <div>
        <h2 className="text-lg font-black text-white">Game Info &amp; Control</h2>
        <p className="text-xs text-slate-500">
          Neeche sab games live chalte rehte hain � kisi card pe click karo to wo game usi card ke
          andar khul jayega. Phone pe 2 per line, desktop pe 4 per line.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 items-start">
        {panels.map((p, i) =>
          openIndex === i ? (
            <div
              key={i}
              id="game-panel-anchor"
              className="col-span-2 md:col-span-4 scroll-mt-4 animate-xg-pop"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-widest text-[#f7c453]/80 font-bold">
                  {GAME_OPTIONS.find((o) => o.key === p)?.label ?? 'Game'}
                </span>
                <button
                  onClick={() => setOpenIndex(null)}
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-red-400 cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Band karo
                </button>
              </div>
              <GamePanel
                index={i}
                selected={p}
                onSelect={(v) => setPanel(i, v)}
                state={state}
                onToast={showToast}
              />
            </div>
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => {
                setOpenIndex(i);
                requestAnimationFrame(() => {
                  document.getElementById('game-panel-anchor')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                  });
                });
              }}
              className="text-left focus:outline-none group"
            >
              <GameCard index={i} selected={p} state={state} />
            </button>
          ),
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 glass-card border-[#f7c453]/50 text-sm text-white px-4 py-3 rounded-xl shadow-2xl shadow-orange-900/30 animate-xg-pop">
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#f7c453] animate-xg-glow" />
            {toast}
          </span>
        </div>
      )}
    </div>
  );
}

interface PanelProps {
  index: number;
  selected: string;
  onSelect: (v: string) => void;
  state: GameStateResponse | null;
  onToast: (m: string) => void;
}

function GamePanel({ index, selected, onSelect, state, onToast }: PanelProps) {
  const isWinGo = selected.startsWith('wingo:');
  const mode = isWinGo ? selected.split(':')[1] : '';
  const wingo = isWinGo ? state?.wingo?.[mode] : null;
  const aviator = state?.aviator;
  const vortex = state?.vortex;

  return (
    <div className="glass-card card-hover p-3 sm:p-5 relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f7c453]/50 to-transparent" />
      <div className="flex items-center justify-between mb-4 shrink-0">
        <span className="text-[11px] uppercase tracking-widest text-[#f7c453]/80 font-bold">
          Panel {index + 1}
        </span>
        <select
          value={selected}
          onChange={(e) => onSelect(e.target.value)}
          className="bg-[#1c2635]/80 border border-white/10 rounded-lg text-xs font-semibold px-2.5 py-1.5 text-white cursor-pointer outline-none hover:border-[#f7c453]/60 transition-colors"
        >
          {GAME_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {isWinGo ? (
        wingo ? (
          <WinGoBody mode={mode} data={wingo} onToast={onToast} />
        ) : (
          <Loading />
        )
      ) : selected === 'vortex' ? (
        vortex ? (
          <VortexBody data={vortex} onToast={onToast} />
        ) : (
          <Loading />
        )
      ) : aviator ? (
        <AviatorBody data={aviator} onToast={onToast} />
      ) : (
        <Loading />
      )}
    </div>
  );
}

/* Compact live preview card. Click opens the full control panel in a modal. */
function GameCard({
  index,
  selected,
  state,
}: {
  index: number;
  selected: string;
  state: GameStateResponse | null;
}) {
  const label = GAME_OPTIONS.find((o) => o.key === selected)?.label ?? selected;

  return (
    <div className="glass-card card-hover p-3 relative overflow-hidden h-full flex flex-col">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f7c453]/50 to-transparent" />
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] uppercase tracking-widest text-[#f7c453]/80 font-bold">
          Game {index + 1}
        </span>
        <span className="flex items-center gap-1 text-[8px] font-black text-emerald-400 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-xg-glow" />
          LIVE
        </span>
      </div>

      <div className="text-[13px] font-black text-white truncate mb-2">{label}</div>

      <div className="h-[64px]">
        <LivePreview selected={selected} state={state} />
      </div>

      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-slate-500">Tap to open controls</span>
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4 text-[#f7c453] group-hover:translate-x-0.5 transition-transform"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      </div>
    </div>
  );
}

function useSmoothFlight(baselineMs: number, active: boolean) {
  const baseRef = useRef<{ v: number; t: number } | null>(null);
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) {
      baseRef.current = null;
      return;
    }
    let raf = 0;
    const loop = () => {
      setTick((t) => (t + 1) % 1_000_000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  if (!baseRef.current || Math.abs(baselineMs - baseRef.current.v) > 40) {
    baseRef.current = { v: baselineMs, t: Date.now() };
  }
  return baseRef.current.v + (Date.now() - baseRef.current.t);
}

function LivePreview({
  selected,
  state,
}: {
  selected: string;
  state: GameStateResponse | null;
}) {
  const isWinGo = selected.startsWith('wingo:');
  const aTop = state?.aviator;
  const liveTop = aTop?.live;
  const baseline =
    (Number(liveTop?.flightElapsedMs) || 0) + (Number(aTop?.ageMs) || 0);
  const flightNow = useSmoothFlight(
    baseline,
    selected === 'aviator' && liveTop?.state === 'FLYING',
  );

  if (isWinGo) {
    const mode = selected.split(':')[1];
    const w = state?.wingo?.[mode];
    if (!w) return <PreviewSkeleton />;
    const timeLeft = Math.max(0, Number(w.timeLeft) || 0);
    const secs = Math.ceil(timeLeft);
    const pct = w.duration ? Math.max(0, Math.min(1, timeLeft / w.duration)) : 0;
    const C = 2 * Math.PI * 15;
    return (
      <div className="flex items-center gap-2.5">
        <div className="relative w-11 h-11 shrink-0">
          <svg viewBox="0 0 40 40" className="w-11 h-11 -rotate-90">
            <circle cx="20" cy="20" r="15" fill="none" stroke="#1c2635" strokeWidth="4" />
            <circle
              cx="20"
              cy="20"
              r="15"
              fill="none"
              stroke="#f7c453"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct)}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white tabular-nums">
            {secs}
          </span>
        </div>
        <div className="min-w-0">
          <div className="text-[8px] text-slate-500 uppercase tracking-wider">Next</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <CasinoBall num={w.nextResult.number} size="sm" />
            <span className="text-[11px] font-black text-slate-200">{w.nextResult.bigSmall}</span>
          </div>
        </div>
      </div>
    );
  }

  if (selected === 'vortex') {
    const v = state?.vortex;
    if (!v) return <PreviewSkeleton />;
    const last = v.history?.[0];
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full border-2 border-purple-400/50 bg-purple-500/10 flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-purple-200"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M12 3a9 9 0 1 0 9 9" />
              <circle cx="12" cy="12" r="3.2" fill="currentColor" opacity="0.35" stroke="none" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-[8px] text-slate-500 uppercase tracking-wider">Forced</div>
            <div className="text-[12px] font-black text-white uppercase truncate">
              {v.forcedNext ? v.forcedNext : 'Random'}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-500">Last</span>
          <span className="font-black uppercase text-slate-200">{last ? last.outcome : '�'}</span>
        </div>
      </div>
    );
  }

  // aviator
  const a = state?.aviator;
  const live = a?.live;
  if (!a || !live) return <PreviewSkeleton />;
  const jet = jetPosition(live.state, flightNow, 0);
  const curve = `M 6 186 Q ${jet.baseCurveX * 0.5} 184 ${jet.baseCurveX} ${jet.baseCurveY}`;
  const mult = Number(live.multiplier) || 1;
  const crashed = live.state === 'CRASHED';
  return (
    <div className="relative h-[64px] rounded-lg bg-[#0b0c0e] border border-white/10 overflow-hidden">
      <div
        className={`absolute left-2 top-1.5 z-10 text-[14px] font-black tabular-nums ${
          crashed ? 'text-red-400' : 'text-white'
        }`}
      >
        {live.state === 'WAITING' ? 'WAITING' : `${mult.toFixed(2)}x`}
      </div>
      <div className="absolute right-1.5 top-1.5 z-10 text-[9px] font-black tabular-nums px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
        {a.nextCrash != null ? `NEXT ${a.nextCrash.toFixed(2)}x` : 'NEXT ?'}
      </div>
      <svg viewBox="0 0 290 190" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        {live.state === 'FLYING' && (
          <path d={curve} fill="none" stroke="#e11d48" strokeWidth="5" strokeLinecap="round" />
        )}
        <SpribeJet
          x={jet.x}
          y={jet.y}
          scale={0.62}
          tilt={crashed ? -18 : -13}
          propFlip={Math.floor(flightNow / 90) % 2 === 0}
        />
      </svg>
    </div>
  );
}

function PreviewSkeleton() {
  return <div className="h-[64px] rounded-lg bg-white/[0.04] animate-pulse" />;
}

function Loading() {
  return (
    <div className="h-56 flex items-center justify-center text-slate-500">
      <Loader2 className="w-6 h-6 animate-xg-ring" />
    </div>
  );
}

function fmtCountdown(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function WinGoBody({
  mode,
  data,
  onToast,
}: {
  mode: string;
  data: WinGoState;
  onToast: (m: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const next = data.nextResult;
  const pct = Math.max(0, Math.min(100, (data.timeLeft / data.duration) * 100));
  const closing = data.timeLeft <= 5;

  const set = async (number: number) => {
    setBusy(true);
    try {
      const res = await adminPost('/admin/game/wingo/set', { mode, number });
      onToast(res.message || `Locked ${number}`);
    } catch (e: any) {
      onToast(e?.message || 'Failed to set');
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    try {
      const res = await adminPost('/admin/game/wingo/clear', { mode });
      onToast(res.message || 'Cleared');
    } catch (e: any) {
      onToast(e?.message || 'Failed');
    }
  };

  return (
    <div className="space-y-4">
      {/* Timer + period */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-mono text-[11px] text-slate-400">{data.period}</span>
          <span
            className={`font-mono text-sm font-black tabular-nums ${
              closing ? 'text-red-400 animate-pulse' : 'text-white'
            }`}
          >
            {fmtCountdown(data.timeLeft)}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${
              closing ? 'bg-red-500' : 'bg-gradient-to-r from-[#f7c453] to-[#e0a92e]'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Next result card */}
      <div className="relative rounded-2xl p-4 bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
            Upcoming Result
          </span>
          {data.forced ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-[#f7c453] bg-[#f7c453]/15 px-2 py-1 rounded-full">
              <Lock className="w-3 h-3" /> LOCKED {data.forced.number}
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-slate-500">auto</span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div key={`${data.period}-${next.number}`} className="shrink-0 animate-xg-pop drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)]">
            <CasinoBall num={next.number} size="lg" />
          </div>

          <div className="min-w-0">
            <div
              key={`bs-${data.period}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-sm font-black animate-xg-pop ${
                next.bigSmall === 'Big'
                  ? 'bg-[#f7c453]/20 text-[#f7c453]'
                  : 'bg-[#5294ff]/20 text-[#5294ff]'
              }`}
            >
              {next.bigSmall === 'Big' ? 'BIG' : 'SMALL'}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              {next.colors.map((c) => (
                <span
                  key={c}
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    c === 'green'
                      ? 'bg-[#18b660]/20 text-[#18b660]'
                      : c === 'red'
                        ? 'bg-[#fb5b5b]/20 text-[#fb5b5b]'
                        : 'bg-[#b858ff]/20 text-[#b858ff]'
                  }`}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Number controls */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-2">
          Set next number
        </div>
        <div className={`grid grid-cols-5 gap-y-2 justify-items-center ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
          {Array.from({ length: 10 }, (_, n) => (
            <CasinoBall key={n} num={n} size="md" onClick={() => set(n)} />
          ))}
        </div>
        {data.forced && (
          <button
            onClick={clear}
            className="mt-2 flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-red-400 cursor-pointer"
          >
            <X className="w-3 h-3" /> Clear override
          </button>
        )}
      </div>

      {/* Recent */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-2">
          Recent
        </div>
        <div className="flex items-center gap-1 overflow-hidden">
          {data.history.slice(0, 12).map((h) => (
            <span key={h.period} className="shrink-0">
              <CasinoBall num={h.number} size="xs" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
/**
 * ---------------------------------------------------------------------------
 * AVIATOR - admin console
 * ---------------------------------------------------------------------------
 * Read top to bottom:
 *   1. CURRENT PERIOD  period number, phase and countdown
 *   2. THIS PERIOD     where the round in the air will crash
 *   3. NEXT PERIOD     where the next round will crash (decided in advance)
 *   4. LIVE            live multiplier and the same curve the players see
 *   5. BET TIMING      the betting window / flight timer
 *   6. CONTROLS        lock the next period's crash value
 *   7. HISTORY         finished periods, identical to the game's history
 */

/** Chart space matches the game canvas exactly (AviatorGame.tsx). */
const TICK_MS = 50;

/** Same progression table the backend clock uses. */
function aviatorIncrementFor(multiplier: number): number {
  if (multiplier < 1.5) return 0.006;
  if (multiplier < 2.2) return 0.009;
  if (multiplier < 4.0) return 0.021;
  if (multiplier < 10.0) return 0.038;
  if (multiplier < 25.0) return 0.09;
  return 0.24;
}

/** Multiplier as a pure, monotonic function of flight time. */
function aviatorMultiplierForElapsed(elapsedMs: number, crashTarget: number): number {
  const steps = Math.floor(elapsedMs / TICK_MS);
  let m = 1;
  for (let i = 0; i < steps && m < crashTarget; i++) {
    m = +(m + aviatorIncrementFor(m)).toFixed(2);
  }
  return Math.min(m, crashTarget);
}

/**
 * Identical maths to the game (AviatorGame.tsx: aviatorJetPosition) so the
 * admin jet always sits on the exact same pixel as the player's jet.
 */
function jetPosition(
  state: 'WAITING' | 'FLYING' | 'CRASHED',
  flightElapsedMs: number,
  crashElapsedMs: number
): { x: number; y: number; baseCurveX: number; baseCurveY: number } {
  const CLIMB_DURATION_MS = 8500;
  const rawProgress = Math.min(1, flightElapsedMs / CLIMB_DURATION_MS);
  const easedProgress = 1 - Math.pow(1 - rawProgress, 1.65);

  const postClimbMs = Math.max(0, flightElapsedMs - CLIMB_DURATION_MS);
  const floatWavePhase = (postClimbMs / 6800) * Math.PI * 2;
  const gentleGlideY = postClimbMs > 0 ? ((1 - Math.cos(floatWavePhase)) / 2) * 18 : 0;

  const baseCurveX = 8 + easedProgress * 254;
  const baseCurveY = 178 - Math.pow(easedProgress, 1.32) * 130 + gentleGlideY;

  const flyAwayFactor = Math.min(1.4, crashElapsedMs / 550);

  return {
    baseCurveX,
    baseCurveY,
    x:
      state === 'WAITING'
        ? 6
        : state === 'CRASHED'
          ? baseCurveX + flyAwayFactor * 150
          : baseCurveX,
    y:
      state === 'WAITING'
        ? 178
        : state === 'CRASHED'
          ? baseCurveY - flyAwayFactor * 36
          : baseCurveY,
  };
}

type AvRound = {
  state: 'WAITING' | 'FLYING' | 'CRASHED';
  roundId: number;
  multiplier: number;
  crashTarget: number;
  nextRoundId: number | null;
  nextCrash: number | null;
  forcedNext: number | null;
  history: { roundId: number; crashAt: number; at: string }[];
  phaseRemainingMs: number;
  ageMs: number;
  localAt: number;
  flightElapsedMs: number;
};

function AviatorBody({
  data,
  onToast,
}: {
  data: AviatorState;
  onToast: (m: string) => void;
}) {
  const [value, setValue] = useState('');
  const [round, setRound] = useState<AvRound | null>(
    data.live
      ? {
          state: data.live.state,
          roundId: data.live.roundId,
          multiplier: Number(data.live.multiplier) || 1,
          crashTarget: Number(data.currentCrash ?? data.live.crashTarget) || 2,
          nextRoundId: data.nextRoundId ?? null,
          nextCrash: data.nextCrash ?? null,
          forcedNext: data.forcedNext ?? null,
          history: data.history || [],
          phaseRemainingMs: 0,
          ageMs: 0,
          localAt: Date.now(),
          flightElapsedMs: Number(data.live.flightElapsedMs) || 0,
        }
      : null
  );
  const [, setTick] = useState(0);
  // Monotonic local anchor for the flight clock, so the jet never rubber-bands.
  const flightAnchor = useRef({ roundId: -1, localMs: 0, renderedMs: 0 });
  // ...and one for the wait/crash countdowns.
  const phaseAnchor = useRef({ key: '', localMs: 0 });

  /* Poll the authoritative round, then animate locally at 60fps. */
  useEffect(() => {
    let alive = true;
    const pull = async () => {
      try {
        const res = await adminGet('/game/aviator/state');
        const d = res?.data;
        if (!alive || !d?.live) return;

        if (d.live.state === 'FLYING') {
          const a = flightAnchor.current;
          const serverElapsed = (Number(d.live.flightElapsedMs) || 0) + (Number(d.ageMs) || 0);
          if (a.roundId !== d.live.roundId) {
            a.roundId = d.live.roundId;
            a.localMs = Date.now() - serverElapsed;
            a.renderedMs = serverElapsed;
          } else {
            const err = serverElapsed - (Date.now() - a.localMs);
            if (Math.abs(err) > 200) a.localMs = Date.now() - serverElapsed;
            else a.localMs -= err * 0.1;
          }
        }

        if (d.live.state === 'WAITING' || d.live.state === 'CRASHED') {
          const ph = phaseAnchor.current;
          const key = `${d.live.state}:${d.live.roundId}`;
          if (ph.key !== key) {
            ph.key = key;
            const dur = d.live.state === 'WAITING' ? 2700 : 2400;
            ph.localMs =
              Date.now() -
              Math.max(0, dur - (Number(d.phaseRemainingMs) || 0)) -
              (Number(d.ageMs) || 0);
          }
        }

        setRound({
          state: d.live.state,
          roundId: d.live.roundId,
          multiplier: Number(d.live.multiplier) || 1,
          crashTarget: Number(d.currentCrash ?? d.live.crashTarget) || 2,
          nextRoundId: d.nextRoundId ?? null,
          nextCrash: d.nextCrash ?? null,
          forcedNext: d.forcedNext ?? null,
          history: d.history || [],
          phaseRemainingMs: Number(d.phaseRemainingMs) || 0,
          ageMs: Number(d.ageMs) || 0,
          flightElapsedMs: Number(d.live.flightElapsedMs) || 0,
          localAt: Date.now(),
        });
      } catch {
        /* keep the last snapshot */
      }
    };
    pull();
    const id = setInterval(pull, 300);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setTick((t) => (t + 1) % 1000000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!round) {
    return (
      <div className="h-56 flex items-center justify-center text-slate-500">
        <Loader2 className="w-6 h-6 animate-xg-ring" />
      </div>
    );
  }

  const state = round.state;

  let multiplier = round.multiplier;
  let flightNow = 0;
  let phaseLeft = 0;

  if (state === 'FLYING') {
    const a = flightAnchor.current;
    const nowMs = Date.now() - a.localMs;
    flightNow = Math.max(a.renderedMs, nowMs);
    a.renderedMs = flightNow;
    multiplier = aviatorMultiplierForElapsed(flightNow, round.crashTarget);
  } else if (state === 'WAITING') {
    multiplier = 1;
    phaseLeft = Math.max(0, 2700 - (Date.now() - phaseAnchor.current.localMs));
  } else {
    multiplier = round.crashTarget;
    phaseLeft = Math.max(0, 2400 - (Date.now() - phaseAnchor.current.localMs));
  }

  const crashElapsed =
    state === 'CRASHED' ? Math.max(0, 2400 - phaseLeft) : 0;
  const jet = jetPosition(state, flightNow, crashElapsed);

  // Same curve the game draws: a quadratic from the corner to the jet's nose.
  const avFillPath = `M 0 186 Q ${jet.baseCurveX * 0.56} 184 ${jet.baseCurveX} ${jet.baseCurveY} L ${jet.baseCurveX} 186 Z`;
  const avCurvePath = `M 0 186 Q ${jet.baseCurveX * 0.56} 184 ${jet.baseCurveX} ${jet.baseCurveY}`;

  // High-speed propeller spin toggle, identical cadence to the game.
  const propFlip = Math.floor(Date.now() / 65) % 2 === 0;

  const isManual = round.forcedNext != null;
  const results = round.history || [];
  const nextPeriod = round.nextRoundId ?? round.roundId + 1;

  const phase = {
    WAITING: { label: 'BETTING OPEN', cls: 'text-emerald-300', dot: 'bg-emerald-400' },
    FLYING: { label: 'IN THE AIR', cls: 'text-[#ff6b8a]', dot: 'bg-[#e11d48] animate-pulse' },
    CRASHED: { label: 'CRASHED', cls: 'text-red-300', dot: 'bg-red-400' },
  }[state];

  const betWindowMs = 2700;
  const betProgress =
    state === 'WAITING' ? Math.min(100, Math.max(0, (1 - phaseLeft / betWindowMs) * 100)) : 100;

  const apply = async (crashAt: number) => {
    try {
      const res = await adminPost('/admin/game/aviator/set', { crashAt });
      onToast(res.message || `Locked ${crashAt}x`);
    } catch (e: any) {
      onToast(e?.message || 'Failed to set');
    }
  };
  const clearLock = async () => {
    try {
      const res = await adminPost('/admin/game/aviator/clear', {});
      onToast(res.message || 'Cleared');
    } catch (e: any) {
      onToast(e?.message || 'Failed');
    }
  };

  return (
    <div className="space-y-3">
      {/* 1. CURRENT PERIOD + PHASE */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${phase.dot}`} />
          <span className={`text-xs font-black ${phase.cls}`}>{phase.label}</span>
          {state === 'WAITING' && (
            <span className="text-[10px] font-mono-num text-slate-400">
              starts in {(phaseLeft / 1000).toFixed(1)}s
            </span>
          )}
          {state === 'FLYING' && (
            <span className="text-[10px] font-mono-num text-slate-400">
              flying {(flightNow / 1000).toFixed(1)}s
            </span>
          )}
          {state === 'CRASHED' && (
            <span className="text-[10px] font-mono-num text-slate-400">
              next in {(phaseLeft / 1000).toFixed(1)}s
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono-num text-slate-400 shrink-0">
          PERIOD #{round.roundId}
        </span>
      </div>

      {/* 2 + 3. THIS PERIOD AND NEXT PERIOD */}
      <div className="grid grid-cols-2 gap-2">
        <div
          className={`rounded-xl px-3 py-2.5 border ${
            state === 'CRASHED'
              ? 'border-red-500/40 bg-red-500/10'
              : 'border-emerald-500/30 bg-emerald-500/10'
          }`}
        >
          <div className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
            {state === 'CRASHED' ? `Period #${round.roundId} crashed` : 'This period crashes at'}
          </div>
          <div
            className={`text-[24px] font-mono-num font-black leading-none mt-1 ${
              state === 'CRASHED' ? 'text-red-300' : 'text-emerald-300'
            }`}
          >
            {round.crashTarget.toFixed(2)}x
          </div>
        </div>

        <div
          className={`rounded-xl px-3 py-2.5 border ${
            isManual
              ? 'border-[#f7c453]/50 bg-[#f7c453]/10'
              : 'border-white/10 bg-white/[0.03]'
          }`}
        >
          <div className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
            Next period #{nextPeriod}
          </div>
          <div
            className={`text-[24px] font-mono-num font-black leading-none mt-1 ${
              isManual ? 'text-[#f7c453]' : 'text-slate-200'
            }`}
          >
            {round.nextCrash != null ? `${round.nextCrash.toFixed(2)}x` : '—'}
          </div>
          <div className="text-[9px] font-mono-num text-slate-500 mt-0.5">
            {isManual ? 'Locked by you' : 'Decided in advance'}
          </div>
        </div>
      </div>

      {/* 4. LIVE - the same flight deck the players see */}
      <div className="w-full h-56 rounded-2xl bg-[#0b0c0e] border border-white/10 relative overflow-hidden flex items-center justify-center">
        {/* Rotating sunburst rays from the bottom-left corner */}
        <div
          className="w-[2200px] h-[2200px] absolute -bottom-[1100px] -left-[1100px] aviator-rays opacity-95 pointer-events-none"
          style={{ animationPlayState: state === 'FLYING' ? 'running' : 'paused' }}
        />
        {/* Vignette so the rays melt into the dark frame */}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            background:
              'radial-gradient(circle at 0% 100%, transparent 35%, rgba(11, 12, 14, 0.45) 100%)',
          }}
        />

        {/* SVG layer: curve, fill and the identical Spribe jet */}
        <svg
          viewBox="0 0 360 190"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none z-[5]"
        >
          <defs>
            <linearGradient id="avFillAdmin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e11d48" stopOpacity="0.55" />
              <stop offset="75%" stopColor="#9f1239" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#881337" stopOpacity="0.12" />
            </linearGradient>
          </defs>

          {state === 'FLYING' && (
            <>
              <path d={avFillPath} fill="url(#avFillAdmin)" />
              <path
                d={avCurvePath}
                fill="none"
                stroke="#e11d48"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </>
          )}

          {(state === 'WAITING' ||
            state === 'FLYING' ||
            (state === 'CRASHED' && crashElapsed < 650)) && (
            <SpribeJet
              x={jet.x}
              y={jet.y}
              scale={1.05}
              tilt={state === 'CRASHED' ? -18 : -13}
              propFlip={propFlip}
            />
          )}
        </svg>

        {/* WAITING overlay: the live countdown to takeoff */}
        {state === 'WAITING' && phaseLeft > 220 && (
          <div className="relative z-10 flex flex-col items-center text-center px-4">
            <div className="text-sm font-black tracking-[0.06em] text-white uppercase mb-2">
              NEXT ROUND
            </div>
            <div className="w-32 h-1 bg-white/15 rounded-full overflow-hidden mb-2.5">
              <div
                className="h-full bg-[#e11d48] rounded-full"
                style={{ width: `${Math.max(0, Math.min(100, (phaseLeft / 2700) * 100))}%` }}
              />
            </div>
            <div className="text-[10px] font-mono-num text-slate-400">
              {(phaseLeft / 1000).toFixed(1)}s
            </div>
          </div>
        )}

        {/* Live multiplier */}
        {state !== 'WAITING' && (
          <div className="relative z-10 flex items-center justify-center pointer-events-none">
            <div
              className={`absolute w-48 h-24 rounded-full blur-2xl ${
                multiplier < 2
                  ? 'bg-sky-400/30'
                  : multiplier < 10
                    ? 'bg-purple-500/35'
                    : 'bg-pink-500/40'
              }`}
            />
            <span
              className={`relative font-mono-num font-black text-5xl leading-none ${
                state === 'CRASHED' ? 'text-[#e11d48]' : 'text-white'
              }`}
            >
              {multiplier.toFixed(2)}x
            </span>
          </div>
        )}
      </div>

      {/* 5. BET TIMING */}
      <div className="rounded-xl border border-white/10 px-3 py-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
            {state === 'WAITING' ? 'Betting window' : state === 'FLYING' ? 'Flight time' : 'Next round'}
          </span>
          <span className="text-[10px] font-mono-num text-slate-400">
            {state === 'WAITING'
              ? `${(phaseLeft / 1000).toFixed(1)}s left`
              : state === 'FLYING'
                ? `${(flightNow / 1000).toFixed(1)}s`
                : `${(phaseLeft / 1000).toFixed(1)}s`}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-150 ease-linear ${
              state === 'FLYING'
                ? 'bg-[#e11d48]'
                : state === 'CRASHED'
                  ? 'bg-slate-400'
                  : 'bg-emerald-400'
            }`}
            style={{
              width:
                state === 'WAITING'
                  ? `${betProgress}%`
                  : state === 'FLYING'
                    ? `${Math.min(100, (flightNow / 12000) * 100)}%`
                    : `${Math.min(100, (1 - phaseLeft / 2400) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* 6. CONTROLS */}
      <div className="rounded-xl border border-white/10 p-3 space-y-2.5">
        <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
          Force next period crash value
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[1.0, 1.5, 2, 3, 5, 10, 25].map((p) => (
            <button
              key={p}
              onClick={() => apply(p)}
              className="flex-1 min-w-[38px] py-1.5 rounded-lg bg-[#1c2635] border border-white/10 text-[11px] font-black text-slate-200 hover:border-[#f7c453]/60 hover:text-[#f7c453] cursor-pointer transition-colors"
            >
              {p.toFixed(1)}x
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Custom e.g. 7.35"
            className="flex-1 bg-[#0b1017] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-[#f7c453]/60"
          />
          <button
            onClick={() => {
              const n = Number(value);
              if (n > 0) apply(n);
            }}
            disabled={!(Number(value) > 0)}
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-[#f7c453] to-[#ff6300] text-white text-xs font-black cursor-pointer disabled:opacity-40"
          >
            Set
          </button>
          {isManual && (
            <button
              onClick={clearLock}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-slate-300 text-xs font-bold cursor-pointer hover:bg-white/10"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 7. HISTORY - same list the game shows */}
      {results.length > 0 && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="px-3 py-1.5 bg-[#18191c] border-b border-white/5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
            Period history
          </div>
          <div className="max-h-32 overflow-y-auto px-2 py-1.5 space-y-1">
            {results.slice(0, 20).map((h) => (
              <div
                key={h.roundId}
                className="flex items-center justify-between text-[11px] font-mono-num px-2 py-1 rounded bg-white/[0.03]"
              >
                <span className="text-slate-500">#{h.roundId}</span>
                <span
                  className={`font-black ${
                    h.crashAt >= 10
                      ? 'text-purple-300'
                      : h.crashAt >= 2
                        ? 'text-[#ff6b8a]'
                        : 'text-cyan-300'
                  }`}
                >
                  {h.crashAt.toFixed(2)}x
                </span>
                <span className="text-slate-600">
                  {h.at ? new Date(h.at).toLocaleTimeString('en-IN') : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * VORTEX - 3-track elemental climb (water / earth / fire).
 * The server rolls a symbol each spin; matching symbols advance their ring,
 * skull pushes every active ring back one step (all-empty = bust), cloud is
 * safe and bonus adds a flat amount. Admin can force the next spin's outcome.
 */
function VortexBody({
  data,
  onToast,
}: {
  data: VortexState;
  onToast: (m: string) => void;
}) {
  const results = data.history || [];
  const isManual = data.forcedNext != null;
  const outcomes = ['water', 'earth', 'fire', 'cloud', 'skull', 'bonus'];

  const apply = async (outcome: string) => {
    try {
      const res = await adminPost('/admin/game/vortex/set', { outcome });
      onToast(res.message || `Next Vortex spin forced to ${outcome}`);
    } catch (e: any) {
      onToast(e?.message || 'Failed to set');
    }
  };
  const clearLock = async () => {
    try {
      const res = await adminPost('/admin/game/vortex/clear', {});
      onToast(res.message || 'Cleared');
    } catch (e: any) {
      onToast(e?.message || 'Failed');
    }
  };

  const outcomeTone = (o: string) => {
    if (o === 'skull') return 'text-rose-300';
    if (o === 'bonus') return 'text-amber-300';
    if (o === 'cloud') return 'text-sky-300';
    return 'text-emerald-300';
  };

  return (
    <div className="space-y-3">
      <div
        className={`rounded-xl px-3 py-2.5 border ${
          isManual ? 'border-[#f7c453]/50 bg-[#f7c453]/10' : 'border-white/10 bg-white/[0.03]'
        }`}
      >
        <div className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
          Next spin outcome
        </div>
        <div
          className={`text-[24px] font-mono-num font-black leading-none mt-1 uppercase ${
            isManual ? 'text-[#f7c453]' : 'text-slate-200'
          }`}
        >
          {isManual ? String(data.forcedNext) : 'Random'}
        </div>
        <div className="text-[9px] font-mono-num text-slate-500 mt-0.5">
          {isManual ? 'Locked by you - applies to 1 spin' : 'Weighted roll applies'} � {data.activeRounds || 0} active
        </div>
      </div>

      <div className="rounded-xl border border-white/10 p-3 space-y-2.5">
        <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
          Force next spin outcome
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {outcomes.map((o) => (
            <button
              key={o}
              onClick={() => apply(o)}
              className={`py-1.5 rounded-lg bg-[#1c2635] border text-[11px] font-black uppercase cursor-pointer transition-colors hover:border-[#f7c453]/60 ${
                data.forcedNext === o
                  ? 'border-[#f7c453]/60 text-[#f7c453]'
                  : 'border-white/10 text-slate-200'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
        {isManual && (
          <button
            onClick={clearLock}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-slate-300 text-xs font-bold cursor-pointer hover:bg-white/10"
          >
            Clear lock
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="px-3 py-1.5 bg-[#18191c] border-b border-white/5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
            Recent spins
          </div>
          <div className="max-h-40 overflow-y-auto px-2 py-1.5 space-y-1">
            {results.slice(0, 25).map((h) => (
              <div
                key={h.id || h.roundId}
                className="flex items-center justify-between text-[11px] font-mono-num px-2 py-1 rounded bg-white/[0.03]"
              >
                <span className="text-slate-500">#{h.roundId}</span>
                <span className="text-slate-400">Rs {h.stake}</span>
                <span className={`font-black uppercase ${outcomeTone(h.outcome)}`}>
                  {h.outcome}
                  {h.bust ? ' � BUST' : ''}
                </span>
                <span className="text-slate-500">Rs {Number(h.payout || 0).toFixed(2)}</span>
                <span className="text-slate-600">
                  {h.at ? new Date(h.at).toLocaleTimeString('en-IN') : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
