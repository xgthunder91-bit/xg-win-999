import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Rocket } from 'lucide-react';

export interface BetResultLotteryInfo {
  number: number;
  bigSmall: 'Big' | 'Small';
  colors: ('green' | 'red' | 'violet')[];
}

export interface BetResultOverlayProps {
  open: boolean;
  won: boolean;
  amount: number;
  gameTitle?: string;
  periodLabel?: string;
  periodModeText?: string;
  periodNumber?: string;
  multiplierText?: string;
  selectionText?: string;
  lotteryResult?: BetResultLotteryInfo;
  autoCloseDefault?: boolean;
  autoCloseSeconds?: number;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/* Theme                                                               */
/* ------------------------------------------------------------------ */

const THEME = {
  win: {
    card: 'linear-gradient(180deg,#ff9a3d 0%,#ff5f2e 32%,#ef2b26 68%,#d41414 100%)',
    cardShadow: '0 24px 60px rgba(180,20,20,.55), inset 0 1px 0 rgba(255,255,255,.35)',
    rim: '#ffcf6b',
    medallionA: '#ffd979',
    medallionB: '#f2a71b',
    medallionC: '#c67c05',
    ribbonA: '#ff8a3d',
    ribbonB: '#ef4a1f',
    ribbonC: '#c62d10',
    title: '#ffffff',
    scrollEdge: '#ef5b3a',
    scrollFace: '#ffffff',
    scrollTitle: '#e02020',
    scrollText: '#7a2a2a',
    kicker: 'rgba(255,255,255,.82)',
    badgeNum: '#22c55e',
    badgeBigSmall: '#e02020',
    autoRing: 'rgba(255,255,255,.9)',
    autoText: '#ffffff',
  },
  lose: {
    card: 'linear-gradient(180deg,#f2f7ff 0%,#dbe9ff 30%,#c3d9f7 66%,#a9c6ee 100%)',
    cardShadow: '0 24px 60px rgba(40,80,160,.35), inset 0 1px 0 rgba(255,255,255,.9)',
    rim: '#ffffff',
    medallionA: '#eef4ff',
    medallionB: '#9dc0ec',
    medallionC: '#5d86bd',
    ribbonA: '#c9dcf6',
    ribbonB: '#9cbde6',
    ribbonC: '#6f97cb',
    title: '#1d3f80',
    scrollEdge: '#4a76b8',
    scrollFace: '#ffffff',
    scrollTitle: '#1d3f80',
    scrollText: '#41608f',
    kicker: 'rgba(29,63,128,.72)',
    badgeNum: '#e11d48',
    badgeBigSmall: '#e11d48',
    autoRing: 'rgba(255,255,255,.95)',
    autoText: '#1d3f80',
  },
} as const;

const COLOR_HEX: Record<string, string> = {
  green: '#18b660',
  red: '#e02020',
  violet: '#8b5cf6',
};

/* ------------------------------------------------------------------ */
/* Decorative pieces                                                   */
/* ------------------------------------------------------------------ */

const Wings: React.FC<{ a: string; b: string; c: string }> = ({ a, b, c }) => (
  <>
    <g transform="translate(100,86) scale(-1,1)">
      <path d="M8 44 C4 22 18 6 44 2 C40 12 42 18 48 22 C38 26 30 34 28 46 Z" fill={a} />
      <path d="M16 52 C12 32 26 18 50 14 C46 24 48 30 54 34 C44 38 36 46 34 58 Z" fill={b} />
      <path d="M26 60 C22 42 36 30 58 26 C54 36 56 42 62 46 C52 50 44 58 42 70 Z" fill={c} />
      <path d="M38 68 C34 52 48 42 66 38 C62 47 64 53 70 56 C61 60 54 67 52 78 Z" fill={b} />
    </g>
    <g transform="translate(100,86)">
      <path d="M8 44 C4 22 18 6 44 2 C40 12 42 18 48 22 C38 26 30 34 28 46 Z" fill={a} />
      <path d="M16 52 C12 32 26 18 50 14 C46 24 48 30 54 34 C44 38 36 46 34 58 Z" fill={b} />
      <path d="M26 60 C22 42 36 30 58 26 C54 36 56 42 62 46 C52 50 44 58 42 70 Z" fill={c} />
      <path d="M38 68 C34 52 48 42 66 38 C62 47 64 53 70 56 C61 60 54 67 52 78 Z" fill={b} />
    </g>
  </>
);

const Medallion: React.FC<{ a: string; b: string; c: string }> = ({ a, b, c }) => (
  <svg viewBox="0 0 200 172" className="w-full h-full drop-shadow-[0_6px_14px_rgba(0,0,0,.35)]">
    <defs>
      <radialGradient id="medFace" cx="50%" cy="35%" r="70%">
        <stop offset="0%" stopColor={a} />
        <stop offset="62%" stopColor={b} />
        <stop offset="100%" stopColor={c} />
      </radialGradient>
    </defs>

    <Wings a={a} b={b} c={c} />

    {/* outer ring */}
    <circle cx="100" cy="84" r="46" fill="url(#medFace)" />
    <circle cx="100" cy="84" r="46" fill="none" stroke={a} strokeWidth="3" />
    <circle cx="100" cy="84" r="37" fill="none" stroke={a} strokeWidth="2" opacity=".85" />
    <circle cx="100" cy="84" r="31" fill={a} opacity=".22" />

    {/* rocket */}
    <g transform="translate(100,84)">
      <path
        d="M0 -21 C9 -12 12 -2 11 9 L11 20 L5 20 L5 9 L-5 9 L-5 20 L-11 20 L-11 9 C-12 -2 -9 -12 0 -21 Z"
        fill={a}
      />
      <circle cx="0" cy="-2" r="6" fill={b} />
      <circle cx="0" cy="-2" r="3" fill={c} />
    </g>
  </svg>
);

const Ribbon: React.FC<{ a: string; b: string; c: string }> = ({ a, b, c }) => (
  <svg viewBox="0 0 200 120" className="w-full h-full">
    <defs>
      <linearGradient id="rb" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={a} />
        <stop offset="100%" stopColor={b} />
      </linearGradient>
    </defs>
    <path d="M6 34 C40 18 76 14 100 26 C124 14 160 18 194 34 L194 84 C160 70 126 66 100 78 C74 66 40 70 6 84 Z" fill="url(#rb)" />
    <path d="M6 84 L30 84 L18 112 Z" fill={c} />
    <path d="M194 84 L170 84 L182 112 Z" fill={c} />
    <path d="M6 34 C40 20 76 17 100 28 C124 17 160 20 194 34" fill="none" stroke={c} strokeWidth="2.5" opacity=".55" />
  </svg>
);

/* ------------------------------------------------------------------ */

export const BetResultOverlay: React.FC<BetResultOverlayProps> = ({
  open,
  won,
  amount,
  gameTitle = 'WinGo 30sec',
  periodLabel,
  periodModeText,
  periodNumber,
  lotteryResult,
  autoCloseDefault = true,
  autoCloseSeconds = 3,
  onClose,
}) => {
  const [visible, setVisible] = useState(open);
  const [autoClose, setAutoClose] = useState(autoCloseDefault);
  const [left, setLeft] = useState(autoCloseSeconds);
  const [confetti, setConfetti] = useState<{ id: number; x: number; d: number; r: number; c: string }[]>([]);
  const seq = useRef(0);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setLeft(autoCloseSeconds);
      setAutoClose(autoCloseDefault);
      if (won) {
        const cols = ['#fde047', '#facc15', '#fb923c', '#34d399', '#f43f5e', '#ffffff'];
        const items = Array.from({ length: 26 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          d: Math.random() * 0.5,
          r: Math.random() * 360,
          c: cols[i % cols.length],
        }));
        setConfetti(items);
      } else {
        setConfetti([]);
      }
    }
  }, [open, won, autoCloseSeconds, autoCloseDefault]);

  useEffect(() => {
    if (!visible) return;
    if (!autoClose) return;
    const t = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          clearInterval(t);
          setVisible(false);
          try {
            onCloseRef.current?.();
          } catch {
            /* noop */
          }
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [visible, autoClose]);

  const close = useCallback(() => {
    setVisible(false);
    setAutoClose(false);
    try {
      onCloseRef.current?.();
    } catch {
      /* noop */
    }
  }, []);

  if (!visible) return null;

  const t = THEME[won ? 'win' : 'lose'];
  const mode = periodModeText || gameTitle;
  const num = lotteryResult?.number;
  const colors = lotteryResult?.colors || [];
  const bigSmall = lotteryResult?.bigSmall;

  const R = 13;
  const C = 2 * Math.PI * R;
  const progress = autoCloseSeconds > 0 ? Math.max(0, left) / autoCloseSeconds : 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* dim backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: won ? 'rgba(90,10,10,.55)' : 'rgba(20,40,80,.5)' }}
        onClick={close}
      />

      {/* confetti (win only) */}
      {won &&
        confetti.map((c) => (
          <span
            key={c.id}
            className="absolute pointer-events-none"
            style={{
              left: `${c.x}%`,
              top: '-6%',
              width: 8,
              height: 12,
              borderRadius: 2,
              background: c.c,
              opacity: 0.95,
              transform: `rotate(${c.r}deg)`,
              animation: `xgConfettiFall 2.6s linear ${c.d}s forwards`,
            }}
          />
        ))}

      {/* card */}
      <div
        className="relative w-full max-w-[330px] rounded-[30px] px-4 pb-5 pt-[104px] anim-celebrate-in"
        style={{ background: t.card, boxShadow: t.cardShadow }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* top medallion */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-[196px] h-[168px]">
          <div className="absolute left-1/2 -translate-x-1/2 top-4 w-[190px] h-[110px]">
            <Ribbon a={t.ribbonA} b={t.ribbonB} c={t.ribbonC} />
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[180px] h-[150px]">
            <Medallion a={t.medallionA} b={t.medallionB} c={t.medallionC} />
          </div>
        </div>

        {/* title */}
        <h2
          className="text-center text-[27px] font-black leading-none tracking-tight mb-3 anim-title-pop"
          style={{ color: t.title }}
        >
          {won ? 'Congratulations' : 'Sorry'}
        </h2>

        {/* results row */}
        <div className="flex items-center justify-between gap-2 mb-3 px-0.5">
          <span
            className="text-[11px] font-bold leading-[1.15]"
            style={{ color: t.kicker }}
          >
            Lottery
            <br />
            results
          </span>

          <div className="flex items-center gap-1.5 flex-1 justify-end flex-wrap">
            {colors.map((c) => (
              <span
                key={c}
                className="px-2.5 py-[5px] rounded-lg text-[13px] font-black text-white shadow-sm"
                style={{ background: COLOR_HEX[c] || '#64748b' }}
              >
                {c[0].toUpperCase() + c.slice(1)}
              </span>
            ))}
            {num !== undefined && (
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-black text-white shadow-sm"
                style={{ background: t.badgeNum }}
              >
                {num}
              </span>
            )}
            {bigSmall && (
              <span
                className="px-2.5 py-[5px] rounded-lg text-[13px] font-black text-white shadow-sm"
                style={{ background: t.badgeBigSmall }}
              >
                {bigSmall}
              </span>
            )}
          </div>
        </div>

        {/* scroll */}
        <div className="relative rounded-xl px-3 pb-4 pt-3" style={{ background: t.scrollFace }}>
          {/* rod */}
          <div
            className="absolute -top-[7px] left-2 right-2 h-[14px] rounded-full"
            style={{ background: t.scrollEdge, boxShadow: 'inset 0 2px 4px rgba(255,255,255,.35)' }}
          />
          <div className="text-center pt-1.5">
            <div className="text-[12px] font-black" style={{ color: t.scrollText }}>
              {won ? 'Bonus' : 'Lose'}
            </div>
            <div
              className="text-[30px] font-black leading-none mt-0.5 anim-money-pop"
              style={{ color: t.scrollTitle }}
            >
              {won ? `₹${amount.toFixed(2)}` : `₹${(amount || 0).toFixed(2)}`}
            </div>
            <div className="text-[11px] font-bold mt-1.5" style={{ color: t.scrollText }}>
              {mode}
            </div>
            <div className="text-[11px] font-bold" style={{ color: t.scrollText, opacity: 0.8 }}>
              {periodNumber || periodLabel || ''}
            </div>
          </div>
        </div>

        {/* auto close */}
        <button
          type="button"
          onClick={() => (autoClose ? setAutoClose(false) : close())}
          className="mt-4 flex items-center gap-2.5 mx-auto"
          style={{ color: t.autoText }}
        >
          <svg width="34" height="34" viewBox="0 0 34 34" className="-rotate-90">
            <circle cx="17" cy="17" r={R} fill="none" stroke={t.autoRing} strokeWidth="2.5" opacity=".45" />
            {autoClose && (
              <circle
                cx="17"
                cy="17"
                r={R}
                fill="none"
                stroke={t.autoRing}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - progress)}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            )}
          </svg>
          <span className="text-[13px] font-black">
            {autoClose ? `${left} seconds auto close` : 'Close now'}
          </span>
        </button>
      </div>
    </div>
  );
};