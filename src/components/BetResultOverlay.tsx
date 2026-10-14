import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { X, Check } from 'lucide-react';

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

interface BurstParticle {
  id: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  shape: 'circle' | 'rect' | 'star' | 'coin';
  rotation: number;
}

const WIN_COLORS = [
  '#fde047', // Gold Yellow
  '#facc15', // Vibrant Gold
  '#fb923c', // Orange Gold
  '#34d399', // Emerald Spark
  '#f43f5e', // Festive Rose
  '#ffffff', // White Spark
  '#ffedd5', // Warm Cream
];

const LOSS_COLORS = [
  '#94a3b8',
  '#64748b',
  '#f43f5e',
  '#cbd5e1',
  '#38bdf8',
];

export const BetResultOverlay: React.FC<BetResultOverlayProps> = ({
  open,
  won,
  amount,
  gameTitle = 'WinGo 30sec',
  periodLabel,
  periodModeText,
  periodNumber,
  multiplierText,
  selectionText,
  lotteryResult,
  autoCloseDefault = true,
  autoCloseSeconds = 3,
  onClose,
}) => {
  const [dismissed, setDismissed] = useState<boolean>(!open);
  const [autoClose, setAutoClose] = useState<boolean>(autoCloseDefault);
  const [countdown, setCountdown] = useState<number>(autoCloseSeconds);
  const [winImgErr, setWinImgErr] = useState<boolean>(false);
  const [lossImgErr, setLossImgErr] = useState<boolean>(false);

  // Keep latest onClose callback in a ref so parent re-renders never lose or detach it
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Unified dismiss function that immediately closes the modal internally and notifies parent
  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      onCloseRef.current?.();
    } catch {
      // safe fallback
    }
  }, []);

  // When modal open prop opens or changes, reset dismissed state and reset countdown
  useEffect(() => {
    if (open) {
      setDismissed(false);
      setCountdown(autoCloseSeconds);
      setAutoClose(autoCloseDefault);
    } else {
      setDismissed(true);
    }
  }, [open, autoCloseSeconds, autoCloseDefault]);

  // Deterministic-looking celebratory burst particles
  const particles = useMemo<BurstParticle[]>(() => {
    const palette = won ? WIN_COLORS : LOSS_COLORS;
    const count = won ? 36 : 18;
    return Array.from({ length: count }, (_, idx) => {
      const angle = (idx / count) * 360 + ((idx % 3) * 8 - 8);
      const distance = won ? 120 + (idx % 5) * 34 : 90 + (idx % 4) * 22;
      const size = won ? 6 + (idx % 4) * 3.5 : 5 + (idx % 3) * 2.5;
      const color = palette[idx % palette.length];
      const delay = (idx % 6) * 0.04;
      const duration = won ? 1.2 + (idx % 4) * 0.25 : 1.3 + (idx % 3) * 0.25;
      const shapes: BurstParticle['shape'][] = won
        ? ['coin', 'star', 'rect', 'circle']
        : ['rect', 'circle'];
      return {
        id: idx,
        angle,
        distance,
        size,
        color,
        delay,
        duration,
        shape: shapes[idx % shapes.length],
        rotation: (idx * 51) % 360,
      };
    });
  }, [won]);

  // Guaranteed 3-second auto-close timer (dual system: hard setTimeout + live interval countdown)
  useEffect(() => {
    if (!open || dismissed || !autoClose) {
      return;
    }

    const durationMs = Math.max(1000, autoCloseSeconds * 1000);
    const startTime = Date.now();

    // 1. Guaranteed hard auto-close timeout at exactly durationMs (3 seconds)
    const timerId = window.setTimeout(() => {
      handleDismiss();
    }, durationMs);

    // 2. High-precision interval for updating the live badge countdown (3s -> 2s -> 1s -> 0s)
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingSec = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
      setCountdown(remainingSec);

      if (elapsed >= durationMs) {
        window.clearInterval(intervalId);
        window.clearTimeout(timerId);
        handleDismiss();
      }
    }, 100);

    return () => {
      window.clearTimeout(timerId);
      window.clearInterval(intervalId);
    };
  }, [open, dismissed, autoClose, autoCloseSeconds, handleDismiss]);

  if (!open || dismissed) return null;

  const formattedAmount = Math.abs(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Extract period components if provided as combined string
  let displayPeriodMode = periodModeText;
  let displayPeriodNum = periodNumber;

  if (!displayPeriodMode && periodLabel) {
    if (periodLabel.includes('WinGo')) {
      const parts = periodLabel.split(' ');
      displayPeriodMode = parts.slice(0, -1).join(' ').replace('Period:', 'Period ').trim();
      displayPeriodNum = parts[parts.length - 1];
    } else {
      displayPeriodMode = periodLabel;
      displayPeriodNum = '';
    }
  }

  if (!displayPeriodMode) {
    displayPeriodMode = `WinGo 30sec`;
  }
  if (!displayPeriodNum) {
    displayPeriodNum = '20261013100050071';
  }

  // Two-tone pill badge for 0 & 5 (Green+Violet or Red+Violet)
  const isTwoTone = lotteryResult && lotteryResult.colors.length > 1;
  const primaryColor = lotteryResult?.colors[0] || 'green';

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-[4px] flex flex-col items-center justify-center px-5 max-w-[430px] mx-auto select-none overflow-hidden"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleDismiss();
        }
      }}
    >
      {/* Keyframes for Zoom-in, Sunburst rotation, and Floating Confetti */}
      <style>{`
        @keyframes betWinZoomIn {
          0% {
            opacity: 0;
            transform: scale(0.48) translateY(30px);
          }
          65% {
            opacity: 1;
            transform: scale(1.03) translateY(-4px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes betSunburstSpin {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
        @keyframes betConfettiFly {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.2);
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 0.95;
          }
          100% {
            opacity: 0;
            transform: translate(
              calc(-50% + cos(var(--angle)) * var(--distance)),
              calc(-50% + sin(var(--angle)) * var(--distance))
            ) scale(1) rotate(var(--rot));
          }
        }
        @keyframes dragonFloat {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-4px) rotate(2deg);
          }
        }
      `}</style>

      {/* Background Rotating Sunburst Rays (Only on WIN, matching WhatsApp Image) */}
      {won && (
        <div className="absolute top-[42%] left-1/2 pointer-events-none z-0">
          <svg
            viewBox="0 0 500 500"
            className="w-[480px] h-[480px] opacity-35"
            style={{ animation: 'betSunburstSpin 20s linear infinite' }}
          >
            <defs>
              <radialGradient id="sunburstGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffedd5" stopOpacity="0.9" />
                <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.6" />
                <stop offset="75%" stopColor="#ea580c" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g fill="url(#sunburstGrad)">
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = (i * 360) / 24;
                return (
                  <path
                    key={i}
                    d="M 250 250 L 235 0 L 265 0 Z"
                    transform={`rotate(${angle} 250 250)`}
                  />
                );
              })}
            </g>
          </svg>
        </div>
      )}

      {/* Confetti & Particle Burst */}
      <div className="absolute top-[42%] left-1/2 pointer-events-none z-0">
        {particles.map((p) => {
          const rad = (p.angle * Math.PI) / 180;
          return (
            <div
              key={p.id}
              className="absolute top-0 left-0"
              style={
                {
                  '--angle': `${rad}rad`,
                  '--distance': `${p.distance}px`,
                  '--rot': `${p.rotation}deg`,
                  animation: `betConfettiFly ${p.duration}s cubic-bezier(0.12, 0.8, 0.32, 1) ${p.delay}s infinite`,
                } as React.CSSProperties
              }
            >
              {p.shape === 'star' ? (
                <svg
                  width={p.size + 4}
                  height={p.size + 4}
                  viewBox="0 0 24 24"
                  fill={p.color}
                  className="drop-shadow-[0_0_6px_rgba(253,224,71,0.85)]"
                >
                  <path d="M12 2L14.8 8.5L22 9.3L16.5 14L18.2 21L12 17.3L5.8 21L7.5 14L2 9.3L9.2 8.5L12 2Z" />
                </svg>
              ) : p.shape === 'coin' ? (
                <div
                  className="rounded-full flex items-center justify-center font-bold text-[8px] text-amber-900 border border-yellow-100 shadow-[0_0_6px_rgba(250,204,21,0.8)]"
                  style={{
                    width: `${p.size + 3}px`,
                    height: `${p.size + 3}px`,
                    background: 'linear-gradient(135deg, #fffbeb, #facc15, #d97706)',
                  }}
                >
                  ₹
                </div>
              ) : (
                <div
                  className="rounded-full"
                  style={{
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    backgroundColor: p.color,
                    boxShadow: `0 0 8px ${p.color}`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Main Modal Card (Exact Shape & Proportions from WhatsApp Image) */}
      <div
        className="relative w-full max-w-[325px] pt-14 z-10"
        style={{ animation: 'betWinZoomIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
      >
        {/* Top Winged Rocket Medallion & Flowing Ribbons (Exact from WinGo_Congratulations_Bonus_Popup-removebg-preview.png) */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 w-[290px] h-36 flex items-center justify-center pointer-events-none">
          {won ? (
            !winImgErr ? (
              <img
                src="/images/wingo_win_top_header.png"
                alt="Congratulations"
                onError={() => setWinImgErr(true)}
                className="w-full h-full object-contain filter drop-shadow-[0_14px_25px_rgba(255,80,20,0.55)] select-none pointer-events-none"
              />
            ) : (
              /* WIN: Layered Gold Angel Wings + Golden Concentric Medallion + White Rocket with Lightning Bolt + Curving Satin Ribbons + Floating Confetti */
              <svg
                viewBox="0 0 280 140"
                className="w-full h-full drop-shadow-[0_14px_25px_rgba(255,80,20,0.55)]"
              >
                <defs>
                  <linearGradient id="rocketGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fffbeb" />
                    <stop offset="30%" stopColor="#fef08a" />
                    <stop offset="65%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#b45309" />
                  </linearGradient>
                  <linearGradient id="goldMedalDisc" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fff3b0" />
                    <stop offset="45%" stopColor="#fbb024" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                  <linearGradient id="ribbonRedOrange" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff8543" />
                    <stop offset="45%" stopColor="#ff5722" />
                    <stop offset="100%" stopColor="#d82512" />
                  </linearGradient>
                  <linearGradient id="wingsGoldFeathers" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="40%" stopColor="#fef08a" />
                    <stop offset="80%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>

                {/* Surrounding Floating Confetti & Sparkles */}
                <polygon
                  points="42,16 46,24 54,28 46,32 42,40 38,32 30,28 38,24"
                  fill="#d946ef"
                />
                <rect
                  x="232"
                  y="22"
                  width="8"
                  height="15"
                  rx="2"
                  fill="#22c55e"
                  transform="rotate(35 232 22)"
                />
                <rect
                  x="214"
                  y="14"
                  width="7"
                  height="7"
                  rx="1.5"
                  fill="#ec4899"
                  transform="rotate(18 214 14)"
                />
                <path
                  d="M 18 68 C 14 76 24 84 20 92 C 16 100 26 106 22 114"
                  stroke="#f43f5e"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 258 74 C 262 82 252 90 256 98 C 260 106 250 112 254 118"
                  stroke="#ec4899"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <polygon
                  points="262,42 264,47 269,48 265,52 266,57 262,54 258,57 259,52 255,48 260,47"
                  fill="#facc15"
                />

                {/* Lower Flowing Satin Ribbon Tails */}
                <path
                  d="M92 92 C52 90 24 72 12 84 C18 106 54 118 94 102 Z"
                  fill="url(#ribbonRedOrange)"
                />
                <path
                  d="M188 92 C228 90 256 72 268 84 C262 106 226 118 186 102 Z"
                  fill="url(#ribbonRedOrange)"
                />

                {/* Upper Ribbon Loops framing the medallion */}
                <path
                  d="M100 72 C70 70 50 82 40 98 C64 100 90 94 108 84 Z"
                  fill="#ea580c"
                />
                <path
                  d="M180 72 C210 70 230 82 240 98 C216 100 190 94 172 84 Z"
                  fill="#ea580c"
                />

                {/* Left Layered Golden Wings */}
                <g fill="url(#wingsGoldFeathers)">
                  <path d="M102 52 C74 28 50 22 34 32 C50 48 74 60 104 66 Z" />
                  <path d="M106 64 C80 46 58 46 44 58 C62 72 86 78 110 78 Z" />
                  <path d="M112 74 C88 66 72 70 60 84 C78 90 98 90 114 86 Z" />
                </g>

                {/* Right Layered Golden Wings */}
                <g fill="url(#wingsGoldFeathers)">
                  <path d="M178 52 C206 28 230 22 246 32 C230 48 206 60 176 66 Z" />
                  <path d="M174 64 C200 46 222 46 236 58 C218 72 194 78 170 78 Z" />
                  <path d="M168 74 C192 66 208 70 220 84 C202 90 182 90 166 86 Z" />
                </g>

                {/* Center Medallion Outer Gold Rim */}
                <circle cx="140" cy="62" r="42" fill="url(#rocketGoldGrad)" />
                <circle cx="140" cy="62" r="39" fill="#f59e0b" />
                <circle cx="140" cy="62" r="34" fill="#fffbeb" />
                <circle cx="140" cy="62" r="31" fill="#f59e0b" />
                <circle cx="140" cy="62" r="29" fill="url(#goldMedalDisc)" />

                {/* Stylized White Rocket with Lightning Bolt */}
                <g transform="translate(140, 62) scale(1.05) translate(-140, -62)">
                  <path
                    d="M140 42 C146 48 151 58 150 70 L130 70 C129 58 134 48 140 42 Z"
                    fill="#ffffff"
                    filter="drop-shadow(0 2px 3px rgba(0,0,0,0.15))"
                  />
                  <path d="M130 63 L122 73 L131 72 Z" fill="#ffffff" />
                  <path d="M150 63 L158 73 L149 72 Z" fill="#ffffff" />
                  <path d="M136 71 L140 78 L144 71 Z" fill="#fef08a" />
                  <polygon
                    points="141,50 135,57 140,57 137,64 146,55 141,55"
                    fill="#ea580c"
                  />
                </g>
              </svg>
            )
          ) : (
            !lossImgErr ? (
              <img
                src="/images/wingo_loss_top_header.png"
                alt="Sorry"
                onError={() => setLossImgErr(true)}
                className="w-full h-full object-contain filter drop-shadow-[0_14px_25px_rgba(20,50,90,0.55)] select-none pointer-events-none"
              />
            ) : (
              /* LOSS: Cool Steel-Blue Winged Rocket Emblem */
              <svg
                viewBox="0 0 280 140"
                className="w-full h-full drop-shadow-[0_14px_25px_rgba(20,50,90,0.55)]"
              >
                <defs>
                  <linearGradient id="lossSilverMedal" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f0f7ff" />
                    <stop offset="35%" stopColor="#d5e8fe" />
                    <stop offset="70%" stopColor="#96beee" />
                    <stop offset="100%" stopColor="#5586bf" />
                  </linearGradient>
                  <linearGradient id="lossRibbonSteel" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8eb6e5" />
                    <stop offset="45%" stopColor="#588bc3" />
                    <stop offset="100%" stopColor="#2c5a90" />
                  </linearGradient>
                  <linearGradient id="lossWingsSilver" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="40%" stopColor="#dbeafe" />
                    <stop offset="80%" stopColor="#93c5fd" />
                    <stop offset="100%" stopColor="#4f86c6" />
                  </linearGradient>
                </defs>

                {/* Lower Flowing Satin Ribbon Tails in Cool Steel Blue */}
                <path
                  d="M92 92 C52 90 24 72 12 84 C18 106 54 118 94 102 Z"
                  fill="url(#lossRibbonSteel)"
                />
                <path
                  d="M188 92 C228 90 256 72 268 84 C262 106 226 118 186 102 Z"
                  fill="url(#lossRibbonSteel)"
                />

                {/* Upper Ribbon Loops framing the medallion */}
                <path
                  d="M100 72 C70 70 50 82 40 98 C64 100 90 94 108 84 Z"
                  fill="#3b699c"
                />
                <path
                  d="M180 72 C210 70 230 82 240 98 C216 100 190 94 172 84 Z"
                  fill="#3b699c"
                />

                {/* Left Layered Silver-Blue Wings */}
                <g fill="url(#lossWingsSilver)">
                  <path d="M102 52 C74 28 50 22 34 32 C50 48 74 60 104 66 Z" />
                  <path d="M106 64 C80 46 58 46 44 58 C62 72 86 78 110 78 Z" />
                  <path d="M112 74 C88 66 72 70 60 84 C78 90 98 90 114 86 Z" />
                </g>

                {/* Right Layered Silver-Blue Wings */}
                <g fill="url(#lossWingsSilver)">
                  <path d="M178 52 C206 28 230 22 246 32 C230 48 206 60 176 66 Z" />
                  <path d="M174 64 C200 46 222 46 236 58 C218 72 194 78 170 78 Z" />
                  <path d="M168 74 C192 66 208 70 220 84 C202 90 182 90 166 86 Z" />
                </g>

                {/* Center Medallion Concentric Rings */}
                <circle cx="140" cy="62" r="42" fill="url(#lossSilverMedal)" />
                <circle cx="140" cy="62" r="39" fill="#5283bc" />
                <circle cx="140" cy="62" r="34" fill="#ffffff" />
                <circle cx="140" cy="62" r="31" fill="#39669e" />
                <circle cx="140" cy="62" r="29" fill="#244a79" />

                {/* Stylized White Rocket with Electric Lightning Bolt */}
                <g transform="translate(140, 62) scale(1.05) translate(-140, -62)">
                  <path
                    d="M140 42 C146 48 151 58 150 70 L130 70 C129 58 134 48 140 42 Z"
                    fill="#ffffff"
                    filter="drop-shadow(0 2px 3px rgba(0,0,0,0.2))"
                  />
                  <path d="M130 63 L122 73 L131 72 Z" fill="#ffffff" />
                  <path d="M150 63 L158 73 L149 72 Z" fill="#ffffff" />
                  <path d="M136 71 L140 78 L144 71 Z" fill="#93c5fd" />
                  <polygon
                    points="141,50 135,57 140,57 137,64 146,55 141,55"
                    fill="#3b82f6"
                  />
                </g>
              </svg>
            )
          )}
        </div>

        {/* Main Card Shell (Rounded vermilion for WIN, cool steel-blue for LOSS) */}
        <div
          className={`relative rounded-[30px] pt-11 pb-5 px-4 shadow-[0_22px_55px_rgba(0,0,0,0.45),0_12px_28px_rgba(0,0,0,0.35)] overflow-hidden ${
            won
              ? 'bg-gradient-to-b from-[#ff5338] via-[#ff3b2f] to-[#e62537]'
              : 'bg-gradient-to-b from-[#6b91bb] via-[#4d739d] to-[#32567c]'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Title: "Congratulations" or "Sorry" */}
          <h2 className="text-[26px] font-black text-white text-center tracking-tight leading-tight mt-1 mb-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.22)]">
            {won ? 'Congratulations' : 'Sorry'}
          </h2>

          {/* Lottery Results Line: "Lottery results" + | + Color pill + Number + Big/Small */}
          {lotteryResult ? (
            <div className="flex items-center justify-center gap-2.5 mb-3.5 px-2 text-white">
              <div className="text-[11px] font-bold text-white/95 leading-[1.15] text-left shrink-0">
                Lottery
                <br />
                results
              </div>

              {/* Vertical Divider Line */}
              <div className="w-[1px] h-6 bg-white/35 shrink-0" />

              {/* Color badge (e.g. Green pill or Two-tone Green Violet for 5) */}
              <div
                className={`px-3 py-1 rounded-md text-xs font-black text-white shadow-sm flex items-center justify-center tracking-wide ${
                  isTwoTone
                    ? 'bg-gradient-to-r from-[#00c06d] via-[#10b981] to-[#8b5cf6]'
                    : primaryColor === 'green'
                      ? 'bg-[#00c06d]'
                      : primaryColor === 'red'
                        ? 'bg-[#ef4444]'
                        : 'bg-[#8b5cf6]'
                }`}
              >
                {lotteryResult.colors.length > 1
                  ? lotteryResult.colors[0].charAt(0).toUpperCase() + lotteryResult.colors[0].slice(1)
                  : lotteryResult.colors[0].charAt(0).toUpperCase() + lotteryResult.colors[0].slice(1)}
              </div>

              {/* Number */}
              <span className="text-[16px] font-black font-mono-num text-white px-1">
                {lotteryResult.number}
              </span>

              {/* Big or Small */}
              <span className="text-[13px] font-bold text-white px-1">
                {lotteryResult.bigSmall}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mb-3.5 text-white text-xs font-bold">
              <span>{gameTitle}</span>
              {multiplierText && (
                <span className="px-2 py-0.5 rounded bg-black/25 font-mono-num">
                  {multiplierText}
                </span>
              )}
              {selectionText && <span>{selectionText}</span>}
            </div>
          )}

          {/* Recessed Dispenser Slot (Horizontal capsule slot matching user image) */}
          <div
            className={`w-[88%] h-4 rounded-full mx-auto relative z-10 flex items-center justify-center ${
              won
                ? 'bg-[#8b1608] shadow-[inset_0_3px_5px_rgba(0,0,0,0.7)] border border-[#c43625]/70'
                : 'bg-[#1e3b5f] shadow-[inset_0_3px_5px_rgba(0,0,0,0.7)] border border-[#3a5d85]/70'
            }`}
          >
            <div
              className={`w-[96%] h-2 rounded-full opacity-90 ${
                won ? 'bg-[#520d04]' : 'bg-[#12243b]'
              }`}
            />
          </div>

          {/* Pure White Crisp Paper Ticket Emerging Out of the Slot */}
          <div className="relative -mt-2 mx-auto w-[85%] bg-white rounded-b-2xl pt-3 pb-3.5 px-3 text-center shadow-[0_12px_28px_rgba(0,0,0,0.22)] border-t border-slate-100">
            {/* Header: "Bonus" (Win) or "Lose" (Loss) */}
            <div className="text-[13px] font-black uppercase tracking-wider mb-0.5 text-[#e53322]">
              {won ? 'Bonus' : 'Lose'}
            </div>

            {/* Large Exact Win / Loss Amount: e.g. "₹9.80" or "-₹10.00" */}
            <div className="text-[32px] font-black font-mono-num leading-tight my-0.5 tracking-tight text-[#e53322]">
              {won ? `₹${formattedAmount}` : `-₹${formattedAmount}`}
            </div>

            {/* Period Info (Matching image lines exactly) */}
            <div className="text-[11px] font-medium text-slate-500 mt-1">
              Period {displayPeriodMode}
            </div>
            <div className="text-[12px] font-bold text-slate-700 font-mono tracking-wide mt-0.5">
              {displayPeriodNum}
            </div>
          </div>

          {/* Bottom Auto Close Option Row + Bottom-Right Confetti (matching image) */}
          <div className="mt-4 px-3 flex items-center justify-between relative">
            <button
              type="button"
              onClick={() => {
                setAutoClose((prev) => {
                  const next = !prev;
                  if (next) {
                    setCountdown(autoCloseSeconds);
                  }
                  return next;
                });
              }}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div
                className={`w-5 h-5 rounded-full border transition-all flex items-center justify-center ${
                  autoClose
                    ? 'border-white bg-white/20 text-white'
                    : 'border-white/60 bg-transparent'
                }`}
              >
                {autoClose && <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />}
              </div>
              <span className="text-xs text-white/95 font-medium">
                {autoCloseSeconds} seconds auto close {autoClose ? `(${countdown}s)` : ''}
              </span>
            </button>

            {/* Bottom-Right Confetti Accents (Green strip + Pink speck from image, no dragon) */}
            <div className="pointer-events-none flex items-center gap-1">
              <div className="w-2.5 h-4.5 bg-[#22c55e] rounded-[1px] rotate-45 shadow-sm" />
              <div className="w-1.5 h-1.5 bg-[#ec4899] rounded-full shadow-sm -mt-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Outside Bottom Circular (X) Close Button (Exact matching WhatsApp image) */}
      <button
        type="button"
        onClick={handleDismiss}
        className="mt-4 w-9 h-9 rounded-full border-2 border-white bg-black/40 flex items-center justify-center text-white hover:bg-black/60 active:scale-90 transition-transform cursor-pointer z-10 shadow-lg"
        aria-label="Close celebration modal"
      >
        <X className="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>
  );
};
