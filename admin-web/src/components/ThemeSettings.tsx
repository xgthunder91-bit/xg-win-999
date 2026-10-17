import { useState } from 'react';
import { Check, Palette, RotateCcw, Sparkles, Wand2 } from 'lucide-react';
import { THEMES, DEFAULT_THEME, type Theme, applyTheme, saveTheme, loadTheme } from '../theme';

const grad = (c: Pick<Theme, 'c1' | 'c2' | 'c3'>) =>
  `linear-gradient(135deg, ${c.c1} 0%, ${c.c2} 50%, ${c.c3} 100%)`;

const isSame = (a: Theme, b: Theme) =>
  a.c1.toLowerCase() === b.c1.toLowerCase() &&
  a.c2.toLowerCase() === b.c2.toLowerCase() &&
  a.c3.toLowerCase() === b.c3.toLowerCase();

export function ThemeSettings() {
  const [draft, setDraft] = useState<Theme>(() => loadTheme());
  const [saved, setSaved] = useState<Theme>(() => loadTheme());
  const [toast, setToast] = useState('');
  const [applying, setApplying] = useState(false);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2400);
  };

  const apply = (t: Theme) => {
    applyTheme(t);
    saveTheme(t);
    setSaved(t);
    setDraft(t);
    setApplying(true);
    window.setTimeout(() => setApplying(false), 520);
    flash(`"${t.name}" theme lag gaya — poora panel update ho gaya ✨`);
  };

  const setChannel = (i: 1 | 2 | 3, v: string) =>
    setDraft((d) => ({ ...d, id: 'custom', name: 'Custom Theme', [`c${i}`]: v } as Theme));

  return (
    <div className="space-y-6 relative">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-black text-[var(--b-ink)] flex items-center gap-2">
            <Palette className="w-5 h-5 text-[var(--b1)]" />
            Theme &amp; Appearance
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Apna favourite colour chuno (pre-made ya custom gradient) — preview me dekh lo, phir
            <span className="text-[var(--b1)] font-semibold"> Apply </span>
            dabao. Poora admin panel usi colour me ho jayega, aur save ho jayega.
          </p>
        </div>
        <button
          onClick={() => setDraft(DEFAULT_THEME)}
          className="chip px-3 py-2 text-xs flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Default
        </button>
      </div>

      {/* ---------- BIG PREVIEW ---------- */}
      <div className={`relative overflow-hidden rounded-3xl border border-[var(--b-line-soft)] ${applying ? 'theme-applying' : ''}`}>
        <div
          className="absolute -inset-16 theme-aurora pointer-events-none"
          style={{ background: `conic-gradient(from 0deg, ${draft.c1}, ${draft.c3}, ${draft.c2}, ${draft.c1})`, opacity: 0.4 }}
        />
        <div
          className="relative p-4 sm:p-6"
          style={{
            background:
              `radial-gradient(600px 300px at 8% -20%, ${draft.c1}33, transparent 62%),` +
              `radial-gradient(520px 300px at 100% 130%, ${draft.c3}30, transparent 62%),` +
              'linear-gradient(135deg, rgba(11,13,22,0.94), rgba(6,7,13,0.96))',
          }}
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-10 h-10 rounded-2xl shrink-0 shadow-lg"
                style={{ background: grad(draft), boxShadow: `0 12px 32px -12px ${draft.c2}` }}
              />
              <div className="min-w-0">
                <div className="text-base font-black leading-tight" style={{ color: '#f2f9ff' }}>
                  XG Win <span style={{ background: grad(draft), WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>99</span>
                </div>
                <div className="text-[10px] font-bold tracking-[0.22em]" style={{ color: draft.c1 }}>
                  LIVE PREVIEW
                </div>
              </div>
            </div>
            <span
              className="text-[10px] font-black px-2 py-1 rounded-lg"
              style={{ background: `${draft.c1}22`, color: draft.c1, border: `1px solid ${draft.c1}55` }}
            >
              {draft.name}
            </span>
          </div>

          <div
            className="w-full h-2 rounded-full mb-4"
            style={{ background: grad(draft) }}
          />

          {/* mini stat cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
            {[
              { l: 'Users', v: '1,248' },
              { l: 'Bets', v: '9,730' },
              { l: 'Wagered', v: '₹4.2L' },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-xl p-2.5 sm:p-3 relative overflow-hidden"
                style={{
                  background: `linear-gradient(180deg, ${draft.c1}12, rgba(8,9,16,0.7))`,
                  border: `1px solid ${draft.c1}30`,
                }}
              >
                <div className="text-[10px] sm:text-[11px] text-slate-400">{s.l}</div>
                <div className="text-sm sm:text-lg font-black tabular" style={{ color: draft.c1 }}>
                  {s.v}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-xs font-black px-3.5 py-2 rounded-xl"
              style={{ background: grad(draft), color: '#06121c', boxShadow: `0 12px 30px -12px ${draft.c2}` }}
            >
              Apply Style
            </span>
            <span
              className="text-xs font-bold px-3 py-2 rounded-xl"
              style={{ background: `${draft.c2}18`, color: draft.c2, border: `1px solid ${draft.c2}66` }}
            >
              Chip Active
            </span>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: `${draft.c1}1e`, color: draft.c1 }}>
              ● LIVE
            </span>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: `${draft.c3}1e`, color: draft.c3 }}>
              VIP
            </span>
          </div>
        </div>
      </div>

      {/* ---------- APPLY ---------- */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => apply(draft)}
          className="btn-primary px-5 py-3 text-sm flex items-center gap-2"
        >
          <Wand2 className="w-4 h-4" />
          Apply This Theme
        </button>
        {!isSame(saved, draft) && (
          <span className="text-xs text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Apply dabao se poore panel me lag jayega
          </span>
        )}
        {isSame(saved, draft) && (
          <span className="text-xs text-emerald-300 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" /> Ye theme abhi applied hai
          </span>
        )}
      </div>

      {/* ---------- PRESETS ---------- */}
      <div>
        <h3 className="text-sm font-bold text-[var(--b-ink)] mb-3 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full" style={{ background: 'var(--b-grad)' }} />
          Ready-made Themes
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {THEMES.map((t) => {
            const active = isSame(saved, t);
            const selected = isSame(draft, t);
            return (
              <button
                key={t.id}
                onClick={() => setDraft(t)}
                className={`theme-swatch text-left ${selected ? 'theme-active-ring' : ''}`}
              >
                <div className="theme-swatch-inner">
                  <div className="h-16" style={{ background: grad(t) }} />
                  <div className="px-2 py-2 bg-[#0a0c16]">
                    <div className="text-[11px] font-bold text-slate-200 truncate flex items-center gap-1">
                      {t.name}
                      {active && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                    </div>
                    <div className="flex gap-1 mt-1.5">
                      {[t.c1, t.c2, t.c3].map((c, i) => (
                        <span
                          key={i}
                          className="w-3 h-3 rounded-full border border-white/20"
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {selected && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-black flex items-center justify-center theme-check shadow-lg">
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------- CUSTOM ---------- */}
      <div className="glass-card p-4 sm:p-5">
        <h3 className="text-sm font-bold text-[var(--b-ink)] mb-1 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full" style={{ background: 'var(--b-grad)' }} />
          Apna Custom Gradient banao
        </h3>
        <p className="text-[11px] text-slate-500 mb-4">
          3 colours chuno (start → middle → end). Upar wale preview me turant dikh jayega.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          {([1, 2, 3] as const).map((i) => (
            <label key={i} className="flex flex-col items-center gap-2">
              <input
                type="color"
                className="theme-color-input"
                value={(draft[`c${i}` as 'c1' | 'c2' | 'c3'] as string) || '#000000'}
                onChange={(e) => setChannel(i, e.target.value)}
              />
              <span className="text-[10px] font-bold text-slate-400">
                {i === 1 ? 'Start' : i === 2 ? 'Middle' : 'End'}
              </span>
            </label>
          ))}

          <div className="flex-1 min-w-[160px]">
            <div className="h-11 rounded-xl border border-white/10" style={{ background: grad(draft) }} />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['#22f0ff', '#8b5cff', '#ff2bd6', '#ffd76a', '#ff7a18', '#22c55e', '#3b82f6', '#ef4444'].map(
                (c) => (
                  <button
                    key={c}
                    onClick={() => setDraft((d) => ({ ...d, id: 'custom', name: 'Custom Theme', c3: c }))}
                    className="w-6 h-6 rounded-lg border border-white/20 hover:scale-110 transition-transform"
                    style={{ background: c }}
                    aria-label={`Use ${c}`}
                  />
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 glass-card border-[var(--b-line)]/50 text-sm text-white px-4 py-3 rounded-xl shadow-2xl animate-xg-pop max-w-[86vw]">
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--b1)] live-dot" />
            {toast}
          </span>
        </div>
      )}
    </div>
  );
}
