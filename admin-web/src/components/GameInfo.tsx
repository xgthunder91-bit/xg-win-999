import { useEffect, useState, useMemo, useRef } from 'react';
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
 * Jet curve formula — identical maths to the game canvas
 * (AviatorGame.tsx: aviatorJetPosition). Keeping both in sync means the
 * admin jet sits on the exact same pixel as the player's jet.
 */
const CHART_W = 360;
const CHART_H = 190;

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
  const last = data.history[0];
  const presets = [1.0, 1.5, 2, 3, 5, 10, 25];

  // Live round state. We poll the snapshot and then re-render the jet every
  // frame from the game's own flight clock, so it never lags behind.
  const [live, setLive] = useState<AviatorState['live']>(data.live);
  const liveRef = useRef(live);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    liveRef.current = live;
  }, [live]);

  useEffect(() => {
    const pull = async () => {
      try {
        const r = await adminGet('/game/aviator/state');
        if (r?.data?.live) setLive(r.data.live);
      } catch {
        /* keep last value */
      }
    };
    pull();
    const id = setInterval(pull, 400);
    return () => clearInterval(id);
  }, []);

  // Redraw at 60fps so the jet glides smoothly between snapshots.
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setTick((t) => (t + 1) % 1000000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const curve = live?.curve || [];
  const flying = live?.state === 'FLYING';

  // Extrapolate the flight clock between polls using the timestamp of the
  // last snapshot, then reuse the game's exact curve maths.
  const sinceSnap =
    live?.updatedAt ? Date.now() - new Date(live.updatedAt).getTime() : 0;
  const flightNow =
    live?.state === 'FLYING'
      ? (live?.flightElapsedMs ?? 0) + Math.max(0, Math.min(600, sinceSnap))
      : 0;
  const crashNow =
    live?.state === 'CRASHED'
      ? Math.max(0, Math.min(2400, sinceSnap))
      : 0;
  const jet = jetPosition(
    (live?.state as 'WAITING' | 'FLYING' | 'CRASHED') || 'WAITING',
    flightNow,
    crashNow
  );
  void tick; // re-render tick

  const W = CHART_W;
  const H = CHART_H;
  const points = curve.length;
  const maxY = Math.max(3, ...curve);
  const path = useMemo(() => {
    if (points < 2) return '';
    return curve
      .map((m, i) => {
        const x = (i / (points - 1)) * W;
        const y = H - (m / maxY) * (H - 12) - 6;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [curve, points, maxY]);

  const area = path ? `${path} L ${W} ${H} L 0 ${H} Z` : '';

  const set = async (crashAt: number) => {
    try {
      const res = await adminPost('/admin/game/aviator/set', { crashAt });
      onToast(res.message || `Locked ${crashAt}x`);
    } catch (e: any) {
      onToast(e?.message || 'Failed to set');
    }
  };

  const clear = async () => {
    try {
      const res = await adminPost('/admin/game/aviator/clear', {});
      onToast(res.message || 'Cleared');
    } catch (e: any) {
      onToast(e?.message || 'Failed');
    }
  };

  // Jet position computed locally from the game's flight clock — exact match.
  const jetLeft = (jet.x / W) * 100;
  const jetTop = (jet.y / H) * 100;

  return (
    <div className="space-y-4">
      {/* ---------- LIVE MIRROR ---------- */}
      <div className="rounded-xl bg-[#0b0c0e] border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-[#18191c] border-b border-white/5">
          <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            Live Multiplier
            {flying && <span className="w-1.5 h-1.5 rounded-full bg-[#e11d48] animate-pulse" />}
          </span>
          <span
            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              live?.state === 'FLYING'
                ? 'bg-[#e11d48]/20 text-[#ff6b8a]'
                : live?.state === 'CRASHED'
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-emerald-500/15 text-emerald-400'
            }`}
          >
            {live?.state || 'WAITING'}
          </span>
        </div>

        <div className="relative h-[132px]">
          {/* Jet riding the curve — same coordinates as the game canvas */}
          <span
            className="absolute z-10 pointer-events-none transition-[left,top] duration-100 ease-linear"
            style={{ left: `${jetLeft}%`, top: `${jetTop}%` }}
          >
            <Plane
              className={`w-4 h-4 text-[#e11d48] drop-shadow-[0_0_8px_rgba(225,29,72,.9)] -rotate-12 ${
                live?.state === 'WAITING' ? 'opacity-60' : ''
              }`}
              style={{ marginLeft: '-8px', marginTop: '-8px' }}
            />
          </span>

          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="rgba(255,255,255,.05)" strokeWidth="1" />
            ))}
          </svg>

          {area && (
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
              <defs>
                <linearGradient id="admAvFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e11d48" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#e11d48" stopOpacity="0.03" />
                </linearGradient>
              </defs>
              <path d={area} fill="url(#admAvFill)" />
              <path d={path} fill="none" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-300 mb-0.5">
              {live?.state === 'FLYING'
                ? 'Flying'
                : live?.state === 'CRASHED'
                  ? 'Flew away'
                  : 'Waiting'}
            </div>
            <div
              className={`font-mono-num font-black tracking-tight transition-colors ${
                live?.state === 'CRASHED' ? 'text-[#e11d48]' : 'text-white'
              } ${flying ? 'text-4xl' : 'text-3xl'}`}
            >
              {(live?.multiplier ?? 1).toFixed(2)}x
            </div>
            {flying && (
              <div className="text-[10px] font-bold text-[#ff6b8a]/80 mt-0.5">
                Cash out before it crashes
              </div>
            )}
            {live?.state === 'WAITING' && (
              <div className="text-[10px] font-bold text-emerald-400/80 mt-0.5">Betting open</div>
            )}
          </div>

          {points === 0 && (
            <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-slate-500">
              Waiting for the next flight…
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-3 py-1.5 bg-[#121314] border-t border-white/5 text-[10px] font-mono-num text-slate-400">
          <span>Round {live?.roundId ?? '—'}</span>
          <span>{points} samples</span>
          <span>{live?.updatedAt ? new Date(live.updatedAt).toLocaleTimeString('en-IN') : '—'}</span>
        </div>
      </div>

      {/* ---------- LAST CRASH / NEXT FLY (compact) ---------- */}
      {(() => {
        const recent = (data.history || []).slice(0, 5);
        const avg = recent.length
          ? recent.reduce((s, h) => s + h.crashAt, 0) / recent.length
          : 0;
        const lastCrash = recent[0]?.crashAt;
        const nextRound = (live?.roundId ?? data.roundId) + (live?.state === 'WAITING' ? 1 : 2);

        return (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#0b1017] rounded-lg px-2.5 py-2 border border-white/5">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                Last crash
              </div>
              <div
                className={`text-base font-mono-num font-black leading-none mt-0.5 ${
                  !lastCrash
                    ? 'text-slate-600'
                    : lastCrash >= 10
                      ? 'text-purple-300'
                      : lastCrash >= 2
                        ? 'text-[#ff6b8a]'
                        : 'text-cyan-300'
                }`}
              >
                {lastCrash ? `${lastCrash.toFixed(2)}x` : '—'}
              </div>
              {recent[0] && (
                <div className="text-[9px] font-mono-num text-slate-600 mt-0.5">
                  #{recent[0].roundId}
                </div>
              )}
            </div>

            <div className="bg-[#0b1017] rounded-lg px-2.5 py-2 border border-white/5">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                Next fly
              </div>
              <div
                className={`text-base font-mono-num font-black leading-none mt-0.5 ${
                  data.forcedNext != null ? 'text-[#ff8a1e]' : 'text-white'
                }`}
              >
                {data.forcedNext != null ? `${data.forcedNext.toFixed(2)}x` : 'AUTO'}
              </div>
              <div className="text-[9px] font-mono-num text-slate-600 mt-0.5">
                #{nextRound}
              </div>
            </div>

            <div className="bg-[#0b1017] rounded-lg px-2.5 py-2 border border-white/5">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                Avg (5)
              </div>
              <div className="text-base font-mono-num font-black leading-none mt-0.5 text-slate-200">
                {avg ? `${avg.toFixed(2)}x` : '—'}
              </div>
              <div className="text-[9px] font-mono-num text-slate-600 mt-0.5">recent</div>
            </div>
          </div>
        );
      })()}

      {/* ---------- GAME HISTORY (compact) ---------- */}
      {(data.history || []).length > 0 && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="px-3 py-1.5 bg-[#18191c] border-b border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Game History
            </span>
            <span className="text-[10px] font-mono-num text-slate-500">
              {data.history.length}
            </span>
          </div>
          <div className="max-h-24 overflow-y-auto px-2 py-1.5 space-y-1">
            {data.history.slice(0, 15).map((h) => (
              <div
                key={h.roundId}
                className="flex items-center justify-between text-[10px] font-mono-num px-1.5 py-0.5 rounded bg-white/[0.03]"
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

      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">
          Round #{live?.roundId ?? data.roundId}
        </span>
        {data.forcedNext != null ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-[#ff8a1e] bg-[#ff8a1e]/15 px-2 py-1 rounded-full">
            <Lock className="w-3 h-3" /> NEXT LOCKED {data.forcedNext.toFixed(2)}x
          </span>
        ) : (
          <span className="text-[10px] font-semibold text-slate-500">auto</span>
        )}
      </div>

      {/* Last crash card */}
      <div className="relative rounded-2xl p-4 bg-gradient-to-br from-[#3a1020] to-[#101825] border border-[#fb5b5b]/20 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-1">
              Last Crash
            </div>
            <div
              key={last?.roundId || 0}
              className={`text-4xl font-black animate-xg-pop ${
                (last?.crashAt || 0) < 2
                  ? 'text-[#3498db]'
                  : (last?.crashAt || 0) < 10
                    ? 'text-[#b87ce6]'
                    : 'text-[#f45ca2]'
              }`}
            >
              {last ? `${last.crashAt.toFixed(2)}x` : '—'}
            </div>
          </div>
          <Plane className="w-12 h-12 text-[#fb5b5b]/40 animate-xg-float" />
        </div>
      </div>

      {/* Control */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-2">
          Set next crash
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            min="1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 2.50"
            className="flex-1 bg-[#1c2635] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#ff8a1e]/60"
          />
          <button
            onClick={() => {
              const v = Number(value);
              if (!(v >= 1)) return onToast('Enter a value ≥ 1');
              set(v);
            }}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#ff9429] to-[#ff5500] text-white text-sm font-bold cursor-pointer hover:opacity-90"
          >
            Set
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => set(p)}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:border-[#ff8a1e]/50 hover:text-white cursor-pointer"
            >
              {p.toFixed(2)}x
            </button>
          ))}
          {data.forcedNext != null && (
            <button
              onClick={clear}
              className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg text-slate-400 hover:text-red-400 cursor-pointer"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Recent crashes */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-2">
          Recent
        </div>
        <div className="flex items-center gap-1.5 overflow-hidden">
          {data.history.slice(0, 10).map((h) => (
            <span
              key={h.roundId}
              className={`shrink-0 px-2 py-1 rounded-lg text-[11px] font-bold ${
                h.crashAt < 2
                  ? 'bg-[#3498db]/15 text-[#3498db]'
                  : h.crashAt < 10
                    ? 'bg-[#9b59b6]/15 text-[#b87ce6]'
                    : 'bg-[#e83e8c]/15 text-[#f45ca2]'
              }`}
            >
              {h.crashAt.toFixed(2)}x
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
