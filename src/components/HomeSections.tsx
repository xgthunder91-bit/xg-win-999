import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  dealer1Img,
  dealer2Img,
  chickenRoadImg,
  vortexImg,
  cricketXImg,
  pubgImg,
  fishingSharkImg,
  gatesOlympusImg,
  fishingOctopusImg,
  fishingCaishenImg,
  sportsPlayersImg,
  hubLotteryImg,
  hubCrashImg,
  hubSlotsImg,
  hubSportsImg,
  hubFishingImg,
  hubCasinoImg,
  hubPokerImg,
} from './GameArtwork';

interface HomeSectionsProps {
  onOpenWinGo: (mode: '30s' | '1m' | '3m' | '5m') => void;
  onOpenAviator: () => void;
  onSelectGameToast: (gameName: string) => void;
}

const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  onSeeAll: () => void;
}> = ({ icon, title, onSeeAll }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      {icon}
      <h3 className="font-display font-bold text-lg text-white">{title}</h3>
    </div>
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onSeeAll}
        className="px-3.5 py-1.5 rounded-lg bg-[#242c3a] text-white text-xs font-semibold active:scale-95 cursor-pointer"
      >
        See All
      </button>
      <button
        type="button"
        onClick={onSeeAll}
        className="p-1.5 rounded-lg bg-[#1c232f] text-slate-500 active:scale-95 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onSeeAll}
        className="p-1.5 rounded-lg bg-[#242c3a] text-white active:scale-95 cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);

interface LotteryCardSvgProps {
  title: string;
  variant: 'wingo-30s' | 'wingo-1m' | 'wingo-3m' | 'wingo-5m' | 'k3-1m' | 'k3-3m';
}

const LotteryCardArtwork: React.FC<LotteryCardSvgProps> = ({ title, variant }) => {
  const isK3 = variant.startsWith('k3');

  // Theme palettes matching Screenshot #1 exactly
  const palette =
    variant === 'wingo-30s'
      ? {
          bg1: '#ffc7c7',
          bg2: '#ff9d9d',
          bg3: '#ff7b7b',
          ballLight: '#ff7575',
          ballMid: '#f22c2c',
          ballDark: '#b80d0d',
          numColor: '#d91b1b',
          crownGem: '#ef4444',
          smallBallLight: '#ffc66b',
          smallBallDark: '#d97706',
          smallNumColor: '#b45309',
          waveTop: '#d61f1f',
          waveBottom: '#ed3b3b',
          pennant: '#ff6b6b',
          timerColor: '#e11d48',
          timerText: '30',
        }
      : variant === 'wingo-1m' || variant === 'k3-1m'
        ? {
            bg1: '#ffe4c4',
            bg2: '#ffc88a',
            bg3: '#ffad52',
            ballLight: '#ffc168',
            ballMid: '#f5881f',
            ballDark: '#c25906',
            numColor: '#e07a16',
            crownGem: '#ea580c',
            smallBallLight: '#ff7082',
            smallBallDark: '#be123c',
            smallNumColor: '#9f1239',
            waveTop: '#c96408',
            waveBottom: '#ea861e',
            pennant: '#ffad42',
            timerColor: '#d97706',
            timerText: '1',
          }
        : variant === 'wingo-3m' || variant === 'k3-3m'
          ? {
              bg1: '#9bf8e2',
              bg2: '#6ce8cb',
              bg3: '#3fd4b3',
              ballLight: '#56e39f',
              ballMid: '#1ca861',
              ballDark: '#0b6e3b',
              numColor: '#15803d',
              crownGem: '#16a34a',
              smallBallLight: '#ffc66b',
              smallBallDark: '#d97706',
              smallNumColor: '#b45309',
              waveTop: '#0d7a43',
              waveBottom: '#1ba35c',
              pennant: '#34d399',
              timerColor: '#15803d',
              timerText: '3',
            }
          : {
              // wingo-5m
              bg1: '#bae6fd',
              bg2: '#7dd3fc',
              bg3: '#38bdf8',
              ballLight: '#60a5fa',
              ballMid: '#2563eb',
              ballDark: '#1d4ed8',
              numColor: '#1d4ed8',
              crownGem: '#2563eb',
              smallBallLight: '#ff7082',
              smallBallDark: '#be123c',
              smallNumColor: '#9f1239',
              waveTop: '#1d4ed8',
              waveBottom: '#3b82f6',
              pennant: '#60a5fa',
              timerColor: '#1d4ed8',
              timerText: '5',
            };

  const id = `lot-${variant}`;

  return (
    <svg viewBox="0 0 220 285" className="w-full h-full block select-none">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.bg1} />
          <stop offset="55%" stopColor={palette.bg2} />
          <stop offset="100%" stopColor={palette.bg3} />
        </linearGradient>

        <radialGradient id={`${id}-mainBall`} cx="38%" cy="28%" r="70%">
          <stop offset="0%" stopColor={palette.ballLight} />
          <stop offset="55%" stopColor={palette.ballMid} />
          <stop offset="100%" stopColor={palette.ballDark} />
        </radialGradient>

        <radialGradient id={`${id}-subBall`} cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor={palette.smallBallLight} />
          <stop offset="100%" stopColor={palette.smallBallDark} />
        </radialGradient>

        <linearGradient id={`${id}-crown`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff3a8" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        <linearGradient id={`${id}-wave`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.waveTop} />
          <stop offset="100%" stopColor={palette.waveBottom} />
        </linearGradient>
      </defs>

      {/* Soft Diagonal Pastel Background */}
      <rect width="220" height="285" fill={`url(#${id}-bg)`} />
      <polygon points="0,70 220,0 220,95 0,165" fill="#ffffff" opacity="0.18" />
      <polygon points="0,155 220,85 220,175 0,245" fill="#ffffff" opacity="0.12" />

      {!isK3 ? (
        <>
          {/* Main Center 3D Ball (#1) */}
          <circle cx="115" cy="112" r="62" fill={`url(#${id}-mainBall)`} />
          {/* Glossy rim arc on main ball */}
          <path
            d="M 65 90 A 52 52 0 0 1 145 64"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            opacity="0.45"
          />
          {/* Inner White Circle on Main Ball */}
          <circle cx="112" cy="112" r="41" fill="#ffffff" opacity="0.92" />
          <text
            x="110"
            y="132"
            textAnchor="middle"
            fill={palette.numColor}
            fontSize="60"
            fontWeight="900"
            fontStyle="italic"
            fontFamily="'Plus Jakarta Sans', sans-serif"
          >
            1
          </text>

          {/* Tilted 3D Golden Crown on Top-Right of #1 Ball */}
          <g transform="translate(148, 42) rotate(22)">
            <path
              d="M -28 16 L -24 -12 L -9 4 L 0 -16 L 9 4 L 24 -12 L 28 16 Z"
              fill={`url(#${id}-crown)`}
              stroke="#f59e0b"
              strokeWidth="1.5"
            />
            <rect x="-26" y="15" width="52" height="8" rx="4" fill="#d97706" />
            <circle cx="-24" cy="-14" r="3.5" fill="#fef08a" />
            <circle cx="0" cy="-18" r="4" fill="#fef08a" />
            <circle cx="24" cy="-14" r="3.5" fill="#fef08a" />
            {/* Center V-leaf Gem on Crown */}
            <path
              d="M -5 5 C -5 -2, 0 2, 0 9 C 0 2, 5 -2, 5 5 C 5 11, 0 13, 0 13 C 0 13, -5 11, -5 5 Z"
              fill={palette.crownGem}
            />
          </g>

          {/* Bottom-Left Smaller 3D Ball (#8) */}
          <circle cx="62" cy="158" r="31" fill={`url(#${id}-subBall)`} />
          <circle cx="60" cy="158" r="20" fill="#ffffff" opacity="0.9" />
          <text
            x="60"
            y="168"
            textAnchor="middle"
            fill={palette.smallNumColor}
            fontSize="28"
            fontWeight="900"
            fontStyle="italic"
            fontFamily="'Plus Jakarta Sans', sans-serif"
          >
            8
          </text>

          {/* Bottom-Right Gold Coin ($) */}
          <g transform="translate(162, 166) rotate(-20)">
            <ellipse cx="0" cy="4" rx="22" ry="17" fill="#b45309" />
            <ellipse cx="0" cy="0" rx="22" ry="17" fill="#fbbf24" stroke="#fef08a" strokeWidth="2" />
            <ellipse cx="0" cy="0" rx="16" ry="12" fill="#d97706" />
            <text
              x="0"
              y="6"
              textAnchor="middle"
              fill="#fef08a"
              fontSize="18"
              fontWeight="900"
            >
              $
            </text>
          </g>
        </>
      ) : (
        /* K3 1Min & K3 3Min 3D Dice Artwork matching Screenshot #1 */
        <>
          {/* Soft Background Cube Silhouette */}
          <polygon
            points="15,105 45,88 65,115 35,132"
            fill={palette.ballMid}
            opacity="0.18"
          />

          {/* Left Small Gold Coin ($) */}
          <g transform="translate(46, 118) rotate(18)">
            <ellipse cx="0" cy="3" rx="14" ry="11" fill="#b45309" />
            <ellipse cx="0" cy="0" rx="14" ry="11" fill="#fbbf24" stroke="#fef08a" strokeWidth="1.5" />
            <text x="0" y="4" textAnchor="middle" fill="#b45309" fontSize="12" fontWeight="900">
              $
            </text>
          </g>

          {/* Giant Center 3D Tilted Die (Orange for K3 1Min, Green for K3 3Min) */}
          <g transform="translate(115, 96) rotate(-16)">
            {/* Top Face */}
            <polygon
              points="0,-54 52,-28 0,-2 -52,-28"
              fill={palette.ballLight}
              stroke="#ffffff"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            {/* Left Face */}
            <polygon
              points="-52,-28 0,-2 0,54 -52,26"
              fill={palette.ballMid}
            />
            {/* Right Face */}
            <polygon
              points="0,-2 52,-28 52,26 0,54"
              fill={palette.ballDark}
            />
            {/* Top Face 1 Big Pip */}
            <ellipse cx="0" cy="-28" rx="10" ry="6" fill={palette.ballDark} opacity="0.7" />
            {/* Left Face 5 White Pips */}
            <circle cx="-36" cy="-12" r="4.5" fill="#ffffff" />
            <circle cx="-14" cy="-1" r="4.5" fill="#ffffff" />
            <circle cx="-25" cy="6" r="4.5" fill="#ffffff" />
            <circle cx="-36" cy="14" r="4.5" fill="#ffffff" />
            <circle cx="-14" cy="25" r="4.5" fill="#ffffff" />
            {/* Right Face 2 White Pips */}
            <circle cx="18" cy="18" r="5" fill="#ffffff" />
            <circle cx="36" cy="8" r="5" fill="#ffffff" />
          </g>

          {/* Bottom-Left Smaller 3D Red Die */}
          <g transform="translate(76, 156) rotate(14)">
            <polygon points="0,-28 28,-14 0,0 -28,-14" fill="#ff6b81" />
            <polygon points="-28,-14 0,0 0,28 -28,14" fill="#e11d48" />
            <polygon points="0,0 28,-14 28,14 0,28" fill="#9f1239" />
            {/* White Pips on Red Die */}
            <circle cx="-18" cy="-4" r="2.8" fill="#ffffff" />
            <circle cx="-10" cy="4" r="2.8" fill="#ffffff" />
            <circle cx="-18" cy="10" r="2.8" fill="#ffffff" />
            <circle cx="-6" cy="16" r="2.8" fill="#ffffff" />
            <circle cx="10" cy="10" r="2.8" fill="#ffffff" />
            <circle cx="18" cy="2" r="2.8" fill="#ffffff" />
          </g>

          {/* Bottom-Right Gold Coin ($) */}
          <g transform="translate(158, 166) rotate(-20)">
            <ellipse cx="0" cy="4" rx="22" ry="17" fill="#b45309" />
            <ellipse cx="0" cy="0" rx="22" ry="17" fill="#fbbf24" stroke="#fef08a" strokeWidth="2" />
            <ellipse cx="0" cy="0" rx="16" ry="12" fill="#d97706" />
            <text x="0" y="6" textAnchor="middle" fill="#fef08a" fontSize="18" fontWeight="900">
              $
            </text>
          </g>
        </>
      )}

      {/* White 4-Point Sparkle Stars matching Screenshot #1 */}
      <path
        d="M 196 122 Q 196 132 186 132 Q 196 132 196 142 Q 196 132 206 132 Q 196 132 196 122 Z"
        fill="#ffffff"
      />
      <path
        d="M 32 186 Q 32 192 26 192 Q 32 192 32 198 Q 32 192 38 192 Q 32 192 32 186 Z"
        fill="#ffffff"
        opacity="0.85"
      />

      {/* Curved Sloped Bottom Wave Banner */}
      <path
        d="M 0 202 Q 115 182 220 158 L 220 285 L 0 285 Z"
        fill={`url(#${id}-wave)`}
      />

      {/* Decorative Pennant Triangles along top edge of wave */}
      <path
        d="M 10 202 L 22 214 L 34 198 L 46 210 L 58 194 L 70 206 L 82 190 L 94 202 L 106 186 L 118 198 L 130 182 L 142 194"
        fill={palette.pennant}
        opacity="0.35"
      />

      {/* Subtle LOTTERY Script Watermark */}
      <text
        x="95"
        y="242"
        textAnchor="middle"
        fill="#ffffff"
        opacity="0.13"
        fontSize="30"
        fontWeight="900"
        fontStyle="italic"
        transform="rotate(-8 95 242)"
      >
        LOTTERY
      </text>

      {/* 3D Stopwatch / Timer Badge on Right of Wave */}
      <g transform="translate(174, 198)">
        {/* Stopwatch Top Button & Ears */}
        <rect x="-5" y="-26" width="10" height="5" rx="2" fill="#ffffff" />
        <rect x="-2" y="-22" width="4" height="4" fill="#cbd5e1" />
        <rect
          x="12"
          y="-19"
          width="6"
          height="4"
          rx="1.5"
          transform="rotate(35 15 -17)"
          fill="#ffffff"
        />
        {/* Outer Glossy Circle */}
        <circle
          cx="0"
          cy="0"
          r="20"
          fill="#ffffff"
          stroke={palette.waveTop}
          strokeWidth="2.5"
        />
        <circle
          cx="0"
          cy="0"
          r="15"
          fill="none"
          stroke={palette.timerColor}
          strokeWidth="2"
          strokeDasharray="4 2"
        />
        {palette.timerText === '1' ? (
          /* Vertical Clock Hand for 1Min */
          <rect x="-2" y="-9" width="4" height="14" rx="2" fill={palette.timerColor} />
        ) : (
          <text
            x="0"
            y="6"
            textAnchor="middle"
            fill={palette.timerColor}
            fontSize="16"
            fontWeight="900"
            fontFamily="'JetBrains Mono', sans-serif"
          >
            {palette.timerText}
          </text>
        )}
      </g>

      {/* Bottom Centered Bold White Card Title */}
      <text
        x="110"
        y="262"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="24"
        fontWeight="800"
        fontFamily="'Plus Jakarta Sans', sans-serif"
        style={{ filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.35))' }}
      >
        {title}
      </text>
    </svg>
  );
};

const HubGamepadIcon: React.FC<{ color?: string }> = ({ color = '#2dd4bf' }) => (
  <svg viewBox="0 0 24 22" className="w-3.5 h-3.5 shrink-0" fill="none">
    {/* 3 tiny stars on top */}
    <circle cx="7" cy="3.5" r="1.3" fill={color} />
    <circle cx="12" cy="2" r="1.6" fill={color} />
    <circle cx="17" cy="3.5" r="1.3" fill={color} />
    {/* Gamepad body */}
    <path
      d="M5 8 C3 8, 2 11, 2.5 15 C3 18.5, 5.5 19, 7.5 16.5 L9.5 14.5 L14.5 14.5 L16.5 16.5 C18.5 19, 21 18.5, 21.5 15 C22 11, 21 8, 19 8 Z"
      fill={color}
    />
    {/* D-pad & buttons */}
    <path d="M6.5 11.5 H9.5 M8 10 V13" stroke="#1e293b" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="15.5" cy="11" r="1" fill="#1e293b" />
    <circle cx="17.5" cy="12.2" r="1" fill="#1e293b" />
  </svg>
);

const MandalaWatermark: React.FC<{ color?: string }> = ({ color = '#ffffff' }) => (
  <svg
    viewBox="0 0 120 120"
    className="w-32 h-32 absolute -left-4 -bottom-6 opacity-[0.07] pointer-events-none select-none"
    fill="none"
    stroke={color}
  >
    <circle cx="60" cy="60" r="52" strokeWidth="1.5" strokeDasharray="4 3" />
    <circle cx="60" cy="60" r="40" strokeWidth="1.2" />
    <circle cx="60" cy="60" r="28" strokeWidth="1.2" strokeDasharray="2 2" />
    <circle cx="60" cy="60" r="14" strokeWidth="1.5" />
    <path
      d="M60 8 Q72 34 60 60 Q48 34 60 8 Z M60 112 Q72 86 60 60 Q48 86 60 112 Z M8 60 Q34 72 60 60 Q34 48 8 60 Z M112 60 Q86 72 60 60 Q86 48 112 60 Z"
      strokeWidth="1.2"
    />
    <path
      d="M23 23 Q48 42 60 60 Q42 48 23 23 Z M97 97 Q72 78 60 60 Q78 72 97 97 Z M97 23 Q78 48 60 60 Q72 42 97 23 Z M23 97 Q42 72 60 60 Q48 78 23 97 Z"
      strokeWidth="1.2"
    />
  </svg>
);

const LiveGameBadge: React.FC<{
  basePlayers: number;
  compact?: boolean;
  position?: 'top-left' | 'top-right';
}> = ({ basePlayers, compact = false, position = 'top-left' }) => {
  const [counts, setCounts] = React.useState(() => ({
    players: basePlayers,
    bets: Math.floor(basePlayers * 0.68),
  }));

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCounts((prev) => {
        const dP = Math.floor(Math.random() * 27) - 12;
        const dB = Math.floor(Math.random() * 21) - 8;
        const nextP = Math.max(Math.floor(basePlayers * 0.75), prev.players + dP);
        const nextB = Math.max(
          Math.floor(nextP * 0.52),
          Math.min(nextP - 20, prev.bets + dB)
        );
        return { players: nextP, bets: nextB };
      });
    }, 1700 + (basePlayers % 700));
    return () => clearInterval(interval);
  }, [basePlayers]);

  const posClass =
    position === 'top-right' ? 'top-1.5 right-1.5' : 'top-1.5 left-1.5';

  return (
    <div
      className={`absolute ${posClass} z-20 bg-black/70 backdrop-blur-[2px] border border-white/15 rounded-full px-1.5 py-0.5 flex items-center gap-1 pointer-events-none shadow`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse shrink-0" />
      <span className="font-mono-num font-bold text-[8.5px] text-white leading-none">
        {counts.players.toLocaleString()}
      </span>
      {!compact && (
        <span className="font-mono-num font-bold text-[8px] text-amber-300 leading-none border-l border-white/20 pl-1">
          {counts.bets.toLocaleString()} Bet
        </span>
      )}
    </div>
  );
};

export const HomeSections: React.FC<HomeSectionsProps> = ({
  onOpenWinGo,
  onOpenAviator,
  onSelectGameToast,
}) => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* YOUR GAMES HUB — Exact Match to User Screenshot */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          {/* Red/Orange 3D Gamepad with 3 Gold Stars Above */}
          <svg viewBox="0 0 32 28" className="w-7 h-6 shrink-0">
            {/* 3 Gold Stars */}
            <polygon
              points="8,3 9,5.2 11.3,5.5 9.6,7 10,9.2 8,8 6,9.2 6.4,7 4.7,5.5 7,5.2"
              fill="#fbbf24"
            />
            <polygon
              points="16,0.5 17.3,3.2 20.2,3.6 18.1,5.6 18.6,8.4 16,7 13.4,8.4 13.9,5.6 11.8,3.6 14.7,3.2"
              fill="#fde047"
            />
            <polygon
              points="24,3 25,5.2 27.3,5.5 25.6,7 26,9.2 24,8 22,9.2 22.4,7 20.7,5.5 23,5.2"
              fill="#fbbf24"
            />
            {/* Red/Orange 3D Controller */}
            <path
              d="M6 11 C3.5 11, 2 14.5, 2.8 20 C3.5 24.5, 7 25.5, 9.5 22 L12 19 L20 19 L22.5 22 C25 25.5, 28.5 24.5, 29.2 20 C30 14.5, 28.5 11, 26 11 Z"
              fill="#ea580c"
              stroke="#fbbf24"
              strokeWidth="1"
            />
            <path d="M7.5 15.5 H11.5 M9.5 13.5 V17.5" stroke="#fef08a" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="21" cy="14.5" r="1.3" fill="#fef08a" />
            <circle cx="23.5" cy="16.5" r="1.3" fill="#fde047" />
          </svg>
          <h3 className="font-display font-extrabold text-lg text-white tracking-tight">
            Your Games hub
          </h3>
        </div>

        {/* Row 1: Lottery (13) & Crash (49) */}
        <div className="grid grid-cols-2 gap-2.5 mb-2.5">
          {/* Lottery Hub Card */}
          <div
            onClick={() => scrollToSection('sec-lottery')}
            className="h-24 rounded-2xl bg-gradient-to-r from-[#f5c242] via-[#eea027] to-[#e5811b] border border-[#fde68a]/80 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform shadow-md"
          >
            <MandalaWatermark color="#78350f" />

            {/* Right 3D Crown + Bingo Balls + Gold Coins Illustration */}
            <img
              src={hubLotteryImg}
              alt="Lottery"
              referrerPolicy="no-referrer"
              className="w-25 h-25 object-cover absolute -right-1 -bottom-1 pointer-events-none select-none"
              style={{
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 22%, black 100%)',
                maskImage: 'linear-gradient(to right, transparent 0%, black 22%, black 100%)',
              }}
            />

            {/* Top-Left Corner Count Tab Badge (13) */}
            <div className="absolute top-0 left-0 bg-gradient-to-r from-[#ffda65] to-[#f4a522] px-3 py-0.5 rounded-br-xl flex items-center gap-1 shadow-sm z-10">
              <HubGamepadIcon color="#b93800" />
              <span className="font-mono-num font-black text-xs text-[#b93800]">13</span>
            </div>

            {/* Middle-Left Lottery Text */}
            <span
              className="font-display font-black text-lg text-white absolute left-3 top-1/2 -translate-y-1/2 z-10 tracking-tight"
              style={{
                textShadow:
                  '0 1px 0 #78350f, 0 -1px 0 #78350f, 1px 0 0 #78350f, -1px 0 0 #78350f, 0 2px 4px rgba(0,0,0,0.45)',
              }}
            >
              Lottery
            </span>
          </div>

          {/* Crash Hub Card */}
          <div
            onClick={() => scrollToSection('sec-crash')}
            className="h-24 rounded-2xl bg-[#414d5c] border border-slate-400/50 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform shadow-md"
          >
            <MandalaWatermark color="#ffffff" />

            {/* Right 3D Ornate Gamepad + Prize Wheel + Bird Illustration */}
            <img
              src={hubCrashImg}
              alt="Crash"
              referrerPolicy="no-referrer"
              className="w-25 h-25 object-cover absolute -right-1 -bottom-1 pointer-events-none select-none"
              style={{
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 18%, black 100%)',
                maskImage: 'linear-gradient(to right, transparent 0%, black 18%, black 100%)',
              }}
            />

            {/* Top-Left Corner Count Tab Badge (49) */}
            <div className="absolute top-0 left-0 bg-[#4f6072] px-3 py-0.5 rounded-br-xl flex items-center gap-1 shadow-sm z-10">
              <HubGamepadIcon color="#2dd4bf" />
              <span className="font-mono-num font-black text-xs text-[#2dd4bf]">49</span>
            </div>

            {/* Middle-Left Crash Text */}
            <span className="font-display font-black text-lg text-white absolute left-3 top-1/2 -translate-y-1/2 z-10 drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)]">
              Crash
            </span>
          </div>
        </div>

        {/* Row 2: Slots (2110), Sports (5), Fishing (44) */}
        <div className="grid grid-cols-3 gap-2.5 mb-2.5">
          {[
            { title: 'Slots', count: '2110', section: 'sec-featured', img: hubSlotsImg },
            { title: 'Sports', count: '5', section: 'sec-sports', img: hubSportsImg },
            { title: 'Fishing', count: '44', section: 'sec-fishing', img: hubFishingImg },
          ].map((item) => (
            <div
              key={item.title}
              onClick={() => scrollToSection(item.section)}
              className="h-22 rounded-2xl bg-[#414d5c] border border-slate-400/50 relative overflow-hidden cursor-pointer active:scale-95 transition-transform shadow-md"
            >
              <MandalaWatermark color="#ffffff" />

              {/* Bottom-Right 3D Category Artwork */}
              <img
                src={item.img}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="w-20 h-20 object-cover absolute -right-1 -bottom-1 pointer-events-none select-none"
                style={{
                  WebkitMaskImage:
                    'radial-gradient(circle at 75% 75%, black 55%, transparent 95%)',
                  maskImage: 'radial-gradient(circle at 75% 75%, black 55%, transparent 95%)',
                }}
              />

              {/* Top-Left Title */}
              <span className="font-display font-extrabold text-sm text-white absolute top-2.5 left-3 z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]">
                {item.title}
              </span>

              {/* Bottom-Left Corner Count Tab Badge */}
              <div className="absolute bottom-0 left-0 bg-[#4f6072]/95 px-2.5 py-0.5 rounded-tr-xl flex items-center gap-1 z-10">
                <HubGamepadIcon color="#2dd4bf" />
                <span className="font-mono-num font-black text-xs text-[#2dd4bf]">
                  {item.count}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Row 3: Casino (642) & Poker (74) */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { title: 'Casino', count: '642', section: 'sec-casino', img: hubCasinoImg },
            { title: 'Poker', count: '74', section: 'sec-poker', img: hubPokerImg },
          ].map((item) => (
            <div
              key={item.title}
              onClick={() => scrollToSection(item.section)}
              className="h-22 rounded-2xl bg-[#414d5c] border border-slate-400/50 relative overflow-hidden cursor-pointer active:scale-95 transition-transform shadow-md"
            >
              <MandalaWatermark color="#ffffff" />

              {/* Bottom-Right 3D Category Artwork */}
              <img
                src={item.img}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="w-20 h-20 object-cover absolute -right-1 -bottom-1 pointer-events-none select-none"
                style={{
                  WebkitMaskImage:
                    'radial-gradient(circle at 75% 75%, black 55%, transparent 95%)',
                  maskImage: 'radial-gradient(circle at 75% 75%, black 55%, transparent 95%)',
                }}
              />

              {/* Top-Left Title */}
              <span className="font-display font-extrabold text-sm text-white absolute top-2.5 left-3 z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]">
                {item.title}
              </span>

              {/* Bottom-Left Corner Count Tab Badge */}
              <div className="absolute bottom-0 left-0 bg-[#4f6072]/95 px-2.5 py-0.5 rounded-tr-xl flex items-center gap-1 z-10">
                <HubGamepadIcon color="#2dd4bf" />
                <span className="font-mono-num font-black text-xs text-[#2dd4bf]">
                  {item.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 1: LOTTERY — Exact Match to Screenshot #1 + Live Players/Bets Badge */}
      <div id="sec-lottery">
        <SectionHeader
          icon={
            <svg viewBox="0 0 32 32" className="w-7 h-7 shrink-0">
              <circle cx="15" cy="13" r="9" fill="#2563eb" stroke="#93c5fd" strokeWidth="1" />
              <circle cx="15" cy="13" r="5" fill="#ffffff" />
              <text x="15" y="16" textAnchor="middle" fill="#1d4ed8" fontSize="8" fontWeight="900">
                8
              </text>
              <circle cx="8" cy="18" r="6" fill="#16a34a" />
              <circle cx="23" cy="17" r="6.5" fill="#e11d48" />
              <rect x="4" y="21" width="24" height="7" rx="3.5" fill="#ea580c" stroke="#fde047" strokeWidth="1" />
              <text x="16" y="26.5" textAnchor="middle" fill="#ffffff" fontSize="5.5" fontWeight="900">
                WINGO
              </text>
            </svg>
          }
          title="Lottery"
          onSeeAll={() => onOpenWinGo('30s')}
        />

        <div className="grid grid-cols-3 gap-3">
          {[
            { title: 'Wingo 30S', mode: '30s' as const, variant: 'wingo-30s' as const, base: 2840 },
            { title: 'Wingo 1Min', mode: '1m' as const, variant: 'wingo-1m' as const, base: 1960 },
            { title: 'Wingo 3Min', mode: '3m' as const, variant: 'wingo-3m' as const, base: 1420 },
            { title: 'Wingo 5Min', mode: '5m' as const, variant: 'wingo-5m' as const, base: 1185 },
            { title: 'K3 1Min', mode: '1m' as const, variant: 'k3-1m' as const, base: 945 },
            { title: 'K3 3Min', mode: '3m' as const, variant: 'k3-3m' as const, base: 810 },
          ].map((card) => (
            <div
              key={card.title}
              onClick={() => onOpenWinGo(card.mode)}
              className="aspect-[220/285] rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform shadow-lg relative"
            >
              <LiveGameBadge basePlayers={card.base} />
              <LotteryCardArtwork title={card.title} variant={card.variant} />
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: CRASH — Exact Match to Screenshot #2 + Live Players/Bets Badge */}
      <div id="sec-crash">
        <SectionHeader
          icon={
            <svg viewBox="0 0 32 32" className="w-7 h-7 shrink-0">
              <defs>
                <linearGradient id="padGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
              </defs>
              <path
                d="M6 12 C6 8, 26 8, 26 12 L29 22 C30 26, 25 28, 22 24 L19 20 L13 20 L10 24 C7 28, 2 26, 3 22 Z"
                fill="url(#padGrad)"
                stroke="#7dd3fc"
                strokeWidth="1.2"
              />
              <circle cx="11" cy="15" r="2" fill="#e0f2fe" />
              <circle cx="21" cy="14" r="1.5" fill="#fde047" />
              <circle cx="23" cy="17" r="1.5" fill="#f43f5e" />
            </svg>
          }
          title="Crash"
          onSeeAll={onOpenAviator}
        />

        <div className="grid grid-cols-3 gap-3">
          {/* 1. AVIATOR — Exact dark sunburst + compass rings + red plane + script logo */}
          <div
            onClick={onOpenAviator}
            className="aspect-[220/285] rounded-2xl bg-[#1a1817] relative overflow-hidden cursor-pointer active:scale-95 transition-transform flex flex-col justify-between p-3 shadow-lg"
          >
            <LiveGameBadge basePlayers={2340} />
            {/* Dark Sunburst Rays */}
            <div
              className="absolute inset-0 opacity-45"
              style={{
                background:
                  'repeating-conic-gradient(from 0deg, #2b2726 0deg 10deg, #171514 10deg 20deg)',
              }}
            />

            {/* Top Faint Red Compass Rings */}
            <svg
              viewBox="0 0 200 100"
              className="w-full h-20 absolute top-0 left-0 opacity-35 pointer-events-none"
            >
              <circle cx="100" cy="10" r="65" fill="none" stroke="#e11d48" strokeWidth="1.5" />
              <circle
                cx="100"
                cy="10"
                r="52"
                fill="none"
                stroke="#e11d48"
                strokeWidth="1"
                strokeDasharray="4 3"
              />
              <line x1="100" y1="-50" x2="100" y2="75" stroke="#e11d48" strokeWidth="1" />
              <line x1="35" y1="10" x2="165" y2="10" stroke="#e11d48" strokeWidth="1" />
            </svg>

            <div className="my-auto relative z-10 flex flex-col items-center pt-3">
              {/* Red Biplane/Propeller Plane Icon */}
              <svg viewBox="0 0 140 70" className="w-28 h-14">
                <path
                  d="M15 48 L48 34 L42 22 L62 28 L96 16 C106 13, 114 18, 112 26 L75 44 L25 56 Z"
                  fill="none"
                  stroke="#f41f46"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />
                <path d="M22 44 L8 36 L18 33 L30 41" fill="#f41f46" />
                <line
                  x1="106"
                  y1="6"
                  x2="122"
                  y2="38"
                  stroke="#f41f46"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <circle cx="114" cy="22" r="4" fill="#f41f46" />
              </svg>

              {/* Italic Red Aviator Script */}
              <div className="font-display font-black italic text-2xl text-[#f41f46] tracking-tight -mt-1">
                Aviator
              </div>

              {/* Two Horizontal Red Lines under Aviator */}
              <div className="w-10 h-1 bg-[#f41f46] rounded-full mt-1" />
              <div className="w-6 h-1 bg-[#f41f46] rounded-full mt-1" />
            </div>

            <div className="relative z-10 font-display font-extrabold text-sm text-white text-center tracking-wide">
              AVIATOR
            </div>
          </div>

          {/* 2. CHICKEN ROAD 2 */}
          <div
            onClick={() => onSelectGameToast('Chicken Road 2')}
            className="aspect-[220/285] rounded-2xl bg-[#65a30d] relative overflow-hidden cursor-pointer active:scale-95 transition-transform shadow-lg"
          >
            <LiveGameBadge basePlayers={1680} />
            <img
              src={chickenRoadImg}
              alt="Chicken Road 2"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#4d7c0f] via-[#4d7c0f]/90 to-transparent flex items-end justify-center pb-2.5 px-1">
              <span className="font-display font-extrabold text-[12px] text-white tracking-tight text-center leading-none drop-shadow">
                CHICKEN ROAD 2
              </span>
            </div>
          </div>

          {/* 3. VORTEX */}
          <div
            onClick={() => onSelectGameToast('Vortex')}
            className="aspect-[220/285] rounded-2xl bg-[#090d16] relative overflow-hidden cursor-pointer active:scale-95 transition-transform shadow-lg"
          >
            <LiveGameBadge basePlayers={1140} />
            <img
              src={vortexImg}
              alt="Vortex"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex items-end justify-center pb-2.5">
              <span className="font-display font-extrabold text-sm text-white tracking-wide drop-shadow">
                VORTEX
              </span>
            </div>
          </div>

          {/* 4. CRICKET */}
          <div
            onClick={() => onSelectGameToast('Cricket')}
            className="aspect-[220/285] rounded-2xl bg-[#0f172a] relative overflow-hidden cursor-pointer active:scale-95 transition-transform shadow-lg"
          >
            <LiveGameBadge basePlayers={1520} />
            <img
              src={cricketXImg}
              alt="Cricket"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/95 via-black/75 to-transparent flex items-end justify-center pb-2.5">
              <span className="font-display font-extrabold text-sm text-white tracking-wide drop-shadow">
                CRICKET
              </span>
            </div>
          </div>

          {/* 5. PUBG 1MIN */}
          <div
            onClick={() => onSelectGameToast('PUBG 1MIN')}
            className="aspect-[220/285] rounded-2xl bg-[#1c140d] relative overflow-hidden cursor-pointer active:scale-95 transition-transform shadow-lg"
          >
            <LiveGameBadge basePlayers={1390} />
            <img
              src={pubgImg}
              alt="PUBG 1MIN"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#1a130c] via-[#1a130c]/90 to-transparent flex items-end justify-center pb-2.5">
              <span className="font-display font-extrabold text-sm text-white tracking-wide drop-shadow">
                PUBG 1MIN
              </span>
            </div>
          </div>

          {/* 6. LIMBO — Exact dark asteroid space + gold LIMBO title + red retro rocket */}
          <div
            onClick={() => onSelectGameToast('Limbo')}
            className="aspect-[220/285] rounded-2xl bg-gradient-to-b from-[#0b0e14] via-[#161a22] to-[#1e1510] relative overflow-hidden cursor-pointer active:scale-95 transition-transform flex flex-col justify-between p-3 shadow-lg"
          >
            <LiveGameBadge basePlayers={1060} />
            {/* Top 3D Gold Metallic LIMBO Title */}
            <div className="relative z-10 text-center pt-3">
              <span className="font-display font-black text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-[#fffbeb] via-[#fbbf24] to-[#b45309] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                LIMBO
              </span>
            </div>

            {/* Center Retro Red 3D Rocket + Asteroids + Thruster Flame */}
            <svg viewBox="0 0 160 180" className="w-full h-36 my-auto relative z-10 overflow-visible">
              {/* Floating Space Asteroids */}
              <polygon points="18,125 32,118 38,132 24,142 12,135" fill="#4b3621" />
              <polygon points="135,108 148,102 154,116 140,122" fill="#5c4028" />
              <circle cx="28" cy="40" r="1" fill="#ffffff" opacity="0.6" />
              <circle cx="136" cy="48" r="1.5" fill="#ffffff" opacity="0.5" />
              <circle cx="122" cy="82" r="1" fill="#ffffff" opacity="0.7" />

              {/* Bright Thruster Exhaust Plume */}
              <path
                d="M66 125 L80 178 L94 125 Z"
                fill="#f97316"
                opacity="0.85"
              />
              <path
                d="M71 125 L80 165 L89 125 Z"
                fill="#fde047"
              />

              {/* Left & Right Red Rocket Fins */}
              <polygon points="58,92 38,118 42,134 62,118" fill="#b91c1c" />
              <polygon points="102,92 122,118 118,134 98,118" fill="#991b1b" />

              {/* Main Red Rocket Fuselage */}
              <path
                d="M80 14 C102 42, 104 88, 98 122 L62 122 C56 88, 58 42, 80 14 Z"
                fill="#ef4444"
              />
              {/* Glossy Highlight on Left of Rocket */}
              <path
                d="M78 20 C65 45, 64 85, 68 118"
                stroke="#fca5a5"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
                opacity="0.65"
              />
              {/* Center Vertical Fin */}
              <rect x="77" y="92" width="6" height="36" rx="3" fill="#dc2626" />

              {/* Metallic Porthole Window */}
              <circle cx="80" cy="60" r="11" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
              <circle cx="80" cy="60" r="7.5" fill="#0f172a" />
              <circle cx="77" cy="57" r="2.5" fill="#ffffff" opacity="0.8" />
            </svg>

            <div className="relative z-10 font-display font-extrabold text-sm text-white text-center tracking-wide">
              LIMBO
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: SPORTS (00:04 - 00:05 in video) */}
      <div id="sec-sports">
        <SectionHeader
          icon={
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <circle cx="12" cy="12" r="10" fill="#f8fafc" stroke="#334155" strokeWidth="1.5" />
              <polygon points="12,7 16,10 14,15 10,15 8,10" fill="#0f172a" />
            </svg>
          }
          title="Sports"
          onSeeAll={() => onSelectGameToast('Sportsbook')}
        />
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { name: '9 SPORTS', base: 1450 },
            { name: 'ARBET', base: 920 },
            { name: 'CMD SPORTS', base: 1130 },
            { name: 'IN SPORTS', base: 860 },
            { name: 'EA SPORTS', base: 1290 },
          ].map((sp) => (
            <div
              key={sp.name}
              onClick={() => onSelectGameToast(sp.name)}
              className="aspect-[3/3.8] rounded-2xl relative overflow-hidden cursor-pointer active:scale-95 border border-white/10 shadow-md"
            >
              <img
                src={sportsPlayersImg}
                alt={sp.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-bottom"
              />
              <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#172236] via-[#172236]/90 to-transparent pt-2.5 px-1.5 text-center">
                <span className="font-display font-black text-xs text-white tracking-tight drop-shadow">
                  {sp.name}
                </span>
              </div>
              <div className="absolute bottom-1.5 left-1.5 right-1.5 z-20 bg-black/75 backdrop-blur-xs rounded-full px-2 py-0.5 flex items-center justify-between border border-white/15">
                <span className="flex items-center gap-1 font-mono-num text-[8.5px] font-bold text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                  {sp.base}
                </span>
                <span className="font-mono-num text-[8px] font-bold text-amber-300">
                  {Math.floor(sp.base * 0.65)} Bet
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: FISHING (00:05 in video) */}
      <div id="sec-fishing">
        <SectionHeader
          icon={
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M2 12 C6 5 15 5 20 12 C15 19 6 19 2 12 Z" fill="#38bdf8" />
              <polygon points="19,12 23,7 23,17" fill="#0284c7" />
              <circle cx="7" cy="11" r="1.5" fill="#0f172a" />
            </svg>
          }
          title="Fishing"
          onSeeAll={() => onSelectGameToast('Fishing Games')}
        />
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { title: 'JACKPOT\nFISHING', tag: 'JILI', img: fishingSharkImg, base: 1320 },
            { title: 'MEGA FISHING', tag: 'JILI', img: fishingOctopusImg, base: 1085 },
            { title: 'HAPPY FISHING', tag: 'JILI', img: fishingSharkImg, base: 940 },
            { title: 'DRAGON\nFISHING', tag: 'JDB', img: fishingCaishenImg, base: 875 },
            { title: 'CAISHEN\nFISHING', tag: 'JDB', img: fishingCaishenImg, base: 1190 },
            { title: 'SHADE DRAGONS\nFISHING', tag: 'JDB', img: fishingOctopusImg, base: 760 },
          ].map((fish) => (
            <div
              key={fish.title}
              onClick={() => onSelectGameToast(fish.title.replace('\n', ' '))}
              className="aspect-[3/3.8] rounded-2xl relative overflow-hidden cursor-pointer active:scale-95 flex flex-col justify-between border border-sky-400/30 shadow-md"
            >
              <LiveGameBadge basePlayers={fish.base} compact />
              <img
                src={fish.img}
                alt={fish.title}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="relative z-10 p-1.5 text-right">
                <span className="bg-black/55 px-1.5 py-0.5 rounded text-[8px] font-display font-black text-amber-300">
                  {fish.tag}
                </span>
              </div>
              <div className="relative z-10 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-2 text-center">
                <div className="font-display font-black text-[10px] leading-tight text-transparent bg-clip-text bg-gradient-to-b from-[#fffbeb] via-[#fde047] to-[#f59e0b] uppercase whitespace-pre-line drop-shadow">
                  {fish.title}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 5: CASINO (00:06 in video) */}
      <div id="sec-casino">
        <SectionHeader
          icon={
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <rect x="3" y="4" width="12" height="16" rx="2" fill="#f8fafc" />
              <rect x="9" y="4" width="12" height="16" rx="2" fill="#ef4444" />
              <text x="12" y="15" fill="#fff" fontSize="9" fontWeight="bold">♥</text>
            </svg>
          }
          title="Casino"
          onSeeAll={() => onSelectGameToast('Live Casino')}
        />
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { brand: 'N', img: dealer1Img, title: 'N Live', base: 1580 },
            { brand: 'V', img: dealer2Img, title: 'V Live', base: 1240 },
            { brand: 'Evo', img: dealer1Img, title: 'Evolution', base: 2490 },
            { brand: 'MG LIVE\nGRAND', img: dealer2Img, title: 'MG Live Grand', base: 980 },
            { brand: 'Sexy', img: dealer1Img, title: 'Sexy Gaming', base: 1870 },
          ].map((cas) => (
            <div
              key={cas.title}
              onClick={() => onSelectGameToast(cas.title)}
              className="aspect-[3/3.8] rounded-2xl bg-gradient-to-b from-[#334155] via-[#1e293b] to-[#0f172a] relative overflow-hidden cursor-pointer active:scale-95 border border-white/10 shadow-md"
            >
              <LiveGameBadge basePlayers={cas.base} position="top-right" compact />
              <img
                src={cas.img}
                alt={cas.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/35" />
              <div className="absolute top-2 left-2.5 font-display font-black text-[11px] leading-tight text-white whitespace-pre-line drop-shadow">
                {cas.brand}
              </div>
              <div className="absolute bottom-2 right-2 flex -space-x-1">
                <span className="w-5 h-5 rounded-full bg-slate-800 border-2 border-dashed border-white/80 inline-block shadow" />
                <span className="w-5 h-5 rounded-full bg-rose-600 border-2 border-dashed border-white/80 inline-block shadow" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 6: POKER (00:06 - 00:07 in video) */}
      <div id="sec-poker">
        <SectionHeader
          icon={
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <circle cx="12" cy="12" r="10" fill="#a855f7" stroke="#f3e8ff" strokeWidth="1.5" strokeDasharray="3 2" />
              <text x="8" y="16" fill="#fff" fontSize="11" fontWeight="bold">♠</text>
            </svg>
          }
          title="Poker"
          onSeeAll={() => onSelectGameToast('Poker Rooms')}
        />
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { title: '365', mode: 'roulette', base: 1120 },
            { title: 'KOOLBET', mode: 'chips', base: 890 },
            { title: 'V8\nPOKER', mode: 'v8', base: 1340 },
          ].map((pk) => (
            <div
              key={pk.title}
              onClick={() => onSelectGameToast(pk.title.replace('\n', ' '))}
              className="aspect-[3/3.8] rounded-2xl bg-gradient-to-b from-[#3b4963] via-[#253146] to-[#161f2e] p-2.5 relative overflow-hidden cursor-pointer active:scale-95 flex flex-col justify-between border border-white/10 shadow-md"
            >
              <LiveGameBadge basePlayers={pk.base} compact />
              <div className="font-display font-black text-sm leading-tight text-white text-center whitespace-pre-line pt-3">
                {pk.title}
              </div>

              <div className="my-auto relative flex items-center justify-center pt-1">
                <div className="w-11 h-15 rounded-lg bg-white text-slate-900 font-black text-sm flex flex-col items-center justify-center shadow-lg -rotate-12 border border-slate-200">
                  <span>A</span>
                  <span>♠</span>
                </div>
                <div className="w-11 h-15 rounded-lg bg-white text-red-600 font-black text-sm flex flex-col items-center justify-center shadow-lg rotate-12 -ml-3 border border-slate-200">
                  <span>A</span>
                  <span>♥</span>
                </div>
              </div>

              <div className="h-5 rounded-full bg-gradient-to-r from-[#b45309] via-[#fbbf24] to-[#b45309] border border-amber-200/60 shadow-inner flex items-center justify-around px-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 border border-white" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-white" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 7: FEATURED GAMES ORNAMENTAL RIBBON & 4 ICONS (00:07 in video) */}
      <div id="sec-featured" className="pt-2 pb-4">
        <div className="flex justify-center mb-4">
          <div className="relative px-8 py-1.5 rounded-lg bg-gradient-to-b from-[#3b2510] to-[#1f1308] border-2 border-[#fbbf24] shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <span className="font-display font-extrabold text-xs text-[#fde68a] tracking-wide">
              Featured Games
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {/* 1. LUCKY JAGUAR */}
          <div
            onClick={() => onSelectGameToast('Lucky Jaguar')}
            className="aspect-square rounded-2xl bg-gradient-to-b from-[#d97706] via-[#92400e] to-[#451a03] p-1.5 flex flex-col items-center justify-between border border-amber-400/50 shadow cursor-pointer active:scale-95 relative overflow-hidden"
          >
            <LiveGameBadge basePlayers={940} compact />
            <svg viewBox="0 0 60 50" className="w-12 h-10 mt-2">
              <circle cx="30" cy="24" r="18" fill="#fbbf24" stroke="#78350f" strokeWidth="2" />
              <polygon points="16,10 22,18 14,20" fill="#f59e0b" />
              <polygon points="44,10 38,18 46,20" fill="#f59e0b" />
              <circle cx="24" cy="22" r="2.5" fill="#16a34a" />
              <circle cx="36" cy="22" r="2.5" fill="#16a34a" />
              <polygon points="27,28 33,28 30,33" fill="#78350f" />
            </svg>
            <span className="font-display font-black text-[8px] leading-none text-center text-amber-200 uppercase z-10">
              LUCKY JAGUAR
            </span>
          </div>

          {/* 2. GATES OF OLYMPUS */}
          <div
            onClick={() => onSelectGameToast('Gates of Olympus')}
            className="aspect-square rounded-2xl relative overflow-hidden border border-amber-400/50 shadow cursor-pointer active:scale-95"
          >
            <LiveGameBadge basePlayers={1820} compact />
            <img
              src={gatesOlympusImg}
              alt="Gates of Olympus"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-black/70 py-0.5 text-center">
              <span className="font-display font-black text-[7px] leading-none text-amber-200 uppercase block">
                GATES OF OLYMPUS
              </span>
            </div>
          </div>

          {/* 3. DOUBLE FORTUNE */}
          <div
            onClick={() => onSelectGameToast('Double Fortune')}
            className="aspect-square rounded-2xl bg-gradient-to-b from-[#581c87] via-[#3b0764] to-[#1e1b4b] p-1.5 flex flex-col items-center justify-between border border-purple-400/50 shadow cursor-pointer active:scale-95 relative overflow-hidden"
          >
            <LiveGameBadge basePlayers={830} compact />
            <svg viewBox="0 0 60 50" className="w-12 h-10 mt-2 drop-shadow">
              <polygon points="18,10 42,10 52,22 30,46 8,22" fill="#e879f9" stroke="#f5d0fe" strokeWidth="1.5" />
              <polygon points="18,10 42,10 38,22 22,22" fill="#f0abfc" />
              <polygon points="22,22 38,22 30,46" fill="#c026d3" />
            </svg>
            <span className="font-display font-black text-[8px] leading-none text-center text-purple-200 uppercase">
              DOUBLE FORTUNE
            </span>
          </div>

          {/* 4. FORTUNE GEMS */}
          <div
            onClick={() => onSelectGameToast('Fortune Gems')}
            className="aspect-square rounded-2xl bg-gradient-to-b from-[#b45309] via-[#991b1b] to-[#450a0a] p-1.5 flex flex-col items-center justify-between border border-amber-400/50 shadow cursor-pointer active:scale-95 relative overflow-hidden"
          >
            <LiveGameBadge basePlayers={1490} compact />
            <span className="absolute top-1 right-1 bg-amber-400 text-slate-950 font-black text-[6px] px-1 rounded z-20">
              JILI
            </span>
            <svg viewBox="0 0 60 50" className="w-11 h-9 mt-2">
              <polygon points="30,4 48,18 40,42 20,42 12,18" fill="#fbbf24" stroke="#fef08a" strokeWidth="1.5" />
              <polygon points="30,12 38,22 30,34 22,22" fill="#ef4444" />
            </svg>
            <span className="font-display font-black text-[8px] leading-none text-center text-amber-200 uppercase">
              FORTUNE GEMS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
