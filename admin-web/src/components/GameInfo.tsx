import { useEffect, useState } from 'react';
import { adminGet, adminPost } from '../api';
import type { GameStateResponse, WinGoState, AviatorState } from '../types';
import { GAME_OPTIONS } from '../utils/format';
import { Lock, X, Plane, Loader2 } from 'lucide-react';
import { CasinoBall } from './CasinoBall';

const DEFAULT_PANELS = ['wingo:30s', 'wingo:1m', 'aviator', 'wingo:3m'];

export function GameInfo() {
  const [panels, setPanels] = useState<string[]>(DEFAULT_PANELS);
  const [state, setState] = useState<GameStateResponse | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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
          Har panel me koi bhi game choose karo — 4 games ek saath dekho aur control karo. Admin jo set
          karega, game me wahi result aayega.
        </p>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-5">
        {panels.map((p, i) => (
          <GamePanel
            key={i}
            index={i}
            selected={p}
            onSelect={(v) => setPanel(i, v)}
            state={state}
            onToast={showToast}
          />
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 glass-card border-[#ff8a1e]/50 text-sm text-white px-4 py-3 rounded-xl shadow-2xl shadow-orange-900/30 animate-xg-pop">
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff8a1e] animate-xg-glow" />
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

  return (
    <div className="glass-card card-hover p-5 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff8a1e]/50 to-transparent" />
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] uppercase tracking-widest text-[#ff8a1e]/80 font-bold">
          Panel {index + 1}
        </span>
        <select
          value={selected}
          onChange={(e) => onSelect(e.target.value)}
          className="bg-[#1c2635]/80 border border-white/10 rounded-lg text-xs font-semibold px-2.5 py-1.5 text-white cursor-pointer outline-none hover:border-[#ff8a1e]/60 transition-colors"
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
      ) : aviator ? (
        <AviatorBody data={aviator} onToast={onToast} />
      ) : (
        <Loading />
      )}
    </div>
  );
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
              closing ? 'bg-red-500' : 'bg-gradient-to-r from-[#ff9429] to-[#ff5500]'
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
            <span className="flex items-center gap-1 text-[10px] font-bold text-[#ff8a1e] bg-[#ff8a1e]/15 px-2 py-1 rounded-full">
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
                  ? 'bg-[#ff9429]/20 text-[#ff9429]'
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
 * Top to bottom, plain on purpose so it reads at a glance:
 *   1. STATUS   one line saying what is happening right now
 *   2. CRASH    the one number that matters: where this round will end
 *   3. CHART    live curve + jet, same maths as the player's screen
 *   4. CONTROLS lock a crash value or clear it
 *   5. RESULTS  recent crashes
 */

/** Chart space matches the game canvas exactly (AviatorGame.tsx). */
const CHART_W = 360;
const CHART_H = 190;

/**
 * Identical maths to the game (AviatorGame.tsx: aviatorJetPosition) so the
 * admin jet always sits on the exact same pixel as the player's jet.
 */
function jetPosition(
  state: 'WAITING' | 'FLYING' | 'CRASHED',
  flightElapsedMs: number,
  crashElapsedMs: number
): { x: number; y: number } {
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

function AviatorBody({
  data,
  onToast,
}: {
  data: AviatorState;
  onToast: (m: string) => void;
}) {
  const [value, setValue] = useState('');
  const [live, setLive] = useState<AviatorState['live']>(data.live);
  const [, setTick] = useState(0);

  /* Poll a snapshot, then animate locally at 60fps so nothing lags. */
  useEffect(() => {
    let alive = true;
    const pull = async () => {
      try {
        const r = await adminGet('/game/aviator/state');
        if (alive && r?.data?.live) setLive(r.data.live);
      } catch {
        /* keep last */
      }
    };
    pull();
    const id = setInterval(pull, 400);
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

  const state = (live?.state as 'WAITING' | 'FLYING' | 'CRASHED') || 'WAITING';
  const curve = live?.curve || [];
  const maxY = Math.max(3, ...curve);

  const sinceSnap = live?.updatedAt ? Date.now() - new Date(live.updatedAt).getTime() : 0;
  const flightNow =
    state === 'FLYING'
      ? (live?.flightElapsedMs ?? 0) + Math.max(0, Math.min(700, sinceSnap))
      : 0;
  const crashNow = state === 'CRASHED' ? Math.max(0, Math.min(2400, sinceSnap)) : 0;
  const jet = jetPosition(state, flightNow, crashNow);

  const path = curve
    .map((m, i) => {
      const x = (i / Math.max(1, curve.length - 1)) * CHART_W;
      const y = CHART_H - (m / maxY) * (CHART_H - 14) - 7;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  const area = path && curve.length > 1 ? `${path} L ${CHART_W} ${CHART_H} L 0 ${CHART_H} Z` : '';

  const crashTarget = data.forcedNext ?? data.nextCrash ?? null;
  const isManual = data.forcedNext != null;
  const results = data.history || [];

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

  const status = {
    WAITING: { label: 'BETTING OPEN', hint: 'No players in the air', cls: 'text-emerald-300' },
    FLYING: { label: 'IN THE AIR', hint: 'Players can cash out', cls: 'text-[#ff6b8a]' },
    CRASHED: { label: 'CRASHED', hint: 'Result below', cls: 'text-red-300' },
  }[state];

  return (
    <div className="space-y-3">
      {/* 1. STATUS */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              state === 'FLYING'
                ? 'bg-[#e11d48] animate-pulse'
                : state === 'CRASHED'
                  ? 'bg-red-400'
                  : 'bg-emerald-400'
            }`}
          />
          <span className={`text-xs font-black ${status.cls}`}>{status.label}</span>
          <span className="text-[10px] text-slate-500 truncate">{status.hint}</span>
        </div>
        <span className="text-[10px] font-mono-num text-slate-500 shrink-0">
          Round #{live?.roundId ?? data.roundId}
        </span>
      </div>

      {/* 2. CRASH TARGET */}
      <div
        className={`rounded-xl px-4 py-3 border ${
          isManual
            ? 'border-[#ff8a1e]/50 bg-[#ff8a1e]/10'
            : 'border-emerald-500/30 bg-emerald-500/10'
        }`}
      >
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-300">
              This round crashes at
            </div>
            <div className="text-[10px] font-mono-num text-slate-500 mt-0.5">
              {isManual ? 'Locked by you' : 'Auto generated'}
            </div>
          </div>
          {crashTarget != null ? (
            <span
              className={`text-[28px] font-mono-num font-black leading-none ${
                isManual ? 'text-[#ff8a1e]' : 'text-emerald-300'
              }`}
            >
              {crashTarget.toFixed(2)}x
            </span>
          ) : (
            <span className="text-xs font-mono-num font-bold text-slate-500">
              Waiting for a player
            </span>
          )}
        </div>
      </div>

      {/* 3. LIVE CHART */}
      <div className="rounded-xl bg-[#0b0c0e] border border-white/10 overflow-hidden">
        <div className="relative h-[150px]">
          <span
            className="absolute z-20 pointer-events-none"
            style={{ left: `${(jet.x / CHART_W) * 100}%`, top: `${(jet.y / CHART_H) * 100}%` }}
          >
            <Plane
              className={`w-4 h-4 text-[#e11d48] drop-shadow-[0_0_8px_rgba(225,29,72,.9)] -rotate-12 ${
                state === 'WAITING' ? 'opacity-50' : ''
              }`}
              style={{ marginLeft: '-8px', marginTop: '-8px' }}
            />
          </span>

          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
          >
            {[0.25, 0.5, 0.75].map((f) => (
              <line
                key={f}
                x1="0"
                x2={CHART_W}
                y1={CHART_H * f}
                y2={CHART_H * f}
                stroke="rgba(255,255,255,.05)"
                strokeWidth="1"
              />
            ))}
            {area && (
              <>
                <defs>
                  <linearGradient id="avFillAdmin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e11d48" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#e11d48" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <path d={area} fill="url(#avFillAdmin)" />
              </>
            )}
            {path && (
              <path
                d={path}
                fill="none"
                stroke="#e11d48"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span
              className={`font-mono-num font-black text-4xl leading-none ${
                state === 'CRASHED' ? 'text-[#e11d48]' : 'text-white'
              }`}
            >
              {(live?.multiplier ?? 1).toFixed(2)}x
            </span>
            {state !== 'WAITING' && (
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300 mt-1">
                {state === 'FLYING' ? 'Flying' : 'Flew away'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. CONTROLS */}
      <div className="rounded-xl border border-white/10 p-3 space-y-2.5">
        <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
          Force a crash value
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[1.0, 1.5, 2, 3, 5, 10, 25].map((p) => (
            <button
              key={p}
              onClick={() => apply(p)}
              className="flex-1 min-w-[38px] py-1.5 rounded-lg bg-[#1c2635] border border-white/10 text-[11px] font-black text-slate-200 hover:border-[#ff8a1e]/60 hover:text-[#ff8a1e] cursor-pointer transition-colors"
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
            className="flex-1 bg-[#0b1017] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-[#ff8a1e]/60"
          />
          <button
            onClick={() => {
              const n = Number(value);
              if (n > 0) apply(n);
            }}
            disabled={!(Number(value) > 0)}
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-[#ff9429] to-[#ff6300] text-white text-xs font-black cursor-pointer disabled:opacity-40"
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

      {/* 5. RESULTS */}
      {results.length > 0 && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="px-3 py-1.5 bg-[#18191c] border-b border-white/5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
            Recent crashes
          </div>
          <div className="max-h-28 overflow-y-auto px-2 py-1.5 space-y-1">
            {results.slice(0, 12).map((h) => (
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
