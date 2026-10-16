import React from 'react';
import dpAvatar1 from '../assets/images/dp_avatar_1_1791784644128.jpg';
import dpAvatar2 from '../assets/images/dp_avatar_2_1791784657189.jpg';
import dpAvatar3 from '../assets/images/dp_avatar_3_1791784668899.jpg';
import dpAvatar4 from '../assets/images/dp_avatar_4_1791784682683.jpg';
import dpAvatar5 from '../assets/images/dp_avatar_5_1791784692977.jpg';
import dpAvatar6 from '../assets/images/dp_avatar_6_1791784703425.jpg';
import dpAvatar7 from '../assets/images/dp_avatar_7_1791784747099.jpg';
import dpAvatar8 from '../assets/images/dp_avatar_8_1791784758216.jpg';
import dpAvatar9 from '../assets/images/dp_avatar_9_1791784769766.jpg';
import dpAvatar10 from '../assets/images/dp_avatar_10_1791784779997.jpg';
import dpAvatar11 from '../assets/images/dp_avatar_11_1791784790765.jpg';
import dpAvatar12 from '../assets/images/dp_avatar_12_1791784801830.jpg';
import dealer1Img from '../assets/images/live_casino_dealer_1_1791773456259.jpg';
import dealer2Img from '../assets/images/live_casino_dealer_2_1791773468986.jpg';
import chickenRoadImg from '../assets/images/crash_chicken_road2_1791783504396.jpg';
import vortexImg from '../assets/images/crash_vortex_tornado_1791783517519.jpg';

import cricketXImg from '../assets/images/crash_cricket_bat_1791783529802.jpg';
import pubgImg from '../assets/images/crash_pubg_helmet_1791783541999.jpg';
import fishingSharkImg from '../assets/images/game_fishing_shark_1791775370559.jpg';
import gatesOlympusImg from '../assets/images/game_gates_olympus_1791775381161.jpg';
import fishingOctopusImg from '../assets/images/game_fishing_octopus_1791778233303.jpg';
import fishingCaishenImg from '../assets/images/game_fishing_caishen_1791778247591.jpg';
import sportsPlayersImg from '../assets/images/game_sports_players_1791778261191.jpg';
import limboRocketImg from '../assets/images/game_limbo_rocket_1791778272368.jpg';
import hubLotteryImg from '../assets/images/hub_lottery_art_1791785865464.jpg';
import hubCrashImg from '../assets/images/hub_crash_art_1791785875339.jpg';
import hubSlotsImg from '../assets/images/hub_slots_art_1791785885989.jpg';
import hubSportsImg from '../assets/images/hub_sports_art_1791785897628.jpg';
import hubFishingImg from '../assets/images/hub_fishing_art_1791785908547.jpg';
import hubCasinoImg from '../assets/images/hub_casino_art_1791785918059.jpg';
import hubPokerImg from '../assets/images/hub_poker_art_1791785928361.jpg';
import homeDailyCheckinImg from '../assets/images/home_daily_checkin_icon_1791786981552.jpg';
import homeDepositWheelImg from '../assets/images/home_deposit_wheel_icon_1791786993056.jpg';
import { MaanWinLogo } from './BrandLogo';

export const DP_AVATARS: string[] = [
  dpAvatar1,
  dpAvatar2,
  dpAvatar3,
  dpAvatar4,
  dpAvatar5,
  dpAvatar6,
  dpAvatar7,
  dpAvatar8,
  dpAvatar9,
  dpAvatar10,
  dpAvatar11,
  dpAvatar12,
];

const userAvatarImg = dpAvatar1;

export {
  userAvatarImg,
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
  limboRocketImg,
  hubLotteryImg,
  hubCrashImg,
  hubSlotsImg,
  hubSportsImg,
  hubFishingImg,
  hubCasinoImg,
  hubPokerImg,
  homeDailyCheckinImg,
  homeDepositWheelImg,
};

export const HeroBannerSlide: React.FC<{ index: number; onClick?: () => void }> = ({
  index,
  onClick,
}) => {
  if (index === 0) {
    // Slide 1: INVITE FRIENDS & EARN MORE! (00:00)
    return (
      <div
        onClick={onClick}
        className="w-full h-40 rounded-2xl bg-gradient-to-r from-[#131922] via-[#1c232d] to-[#2b2218] border border-amber-500/20 p-4 relative overflow-hidden cursor-pointer flex flex-col justify-between select-none"
      >
        <div className="absolute -right-6 -bottom-6 w-44 h-44 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start justify-between z-10">
          <div>
            <h2 className="font-display font-black text-lg leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-[#ffe299] via-[#ffb547] to-[#e67e00]">
              INVITE FRIENDS &<br />
              EARN MORE!
            </h2>
            <p className="text-[11px] text-slate-200 mt-1 max-w-[195px] leading-snug">
              Invite more friends and unlock exciting rewards!
            </p>
          </div>
          <div className="scale-75 origin-top-right">
            <MaanWinLogo size="sm" />
          </div>
        </div>
        <p className="text-[9px] text-amber-300/80 z-10">
          Your journey to bigger rewards starts here!
        </p>

        {/* Right 3D Black & Gold Gift Box + Network Avatars SVG */}
        <svg
          viewBox="0 0 140 110"
          className="w-36 h-28 absolute right-1 bottom-1 pointer-events-none"
        >
          <defs>
            <linearGradient id="goldRibbon" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFE58F" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id="darkCube" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#374151" />
              <stop offset="100%" stopColor="#111827" />
            </linearGradient>
          </defs>
          <path
            d="M30 35 Q70 5 115 30"
            stroke="url(#goldRibbon)"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="3 2"
          />
          <path
            d="M15 75 Q65 105 120 75"
            stroke="url(#goldRibbon)"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="28" cy="40" r="13" fill="url(#darkCube)" stroke="url(#goldRibbon)" strokeWidth="2" />
          <circle cx="28" cy="36" r="4" fill="url(#goldRibbon)" />
          <path d="M21 46 C21 41 35 41 35 46" fill="url(#goldRibbon)" />

          <circle cx="116" cy="36" r="12" fill="url(#darkCube)" stroke="url(#goldRibbon)" strokeWidth="2" />
          <circle cx="116" cy="32" r="3.5" fill="url(#goldRibbon)" />
          <path d="M110 42 C110 38 122 38 122 42" fill="url(#goldRibbon)" />

          <circle cx="112" cy="78" r="14" fill="url(#darkCube)" stroke="url(#goldRibbon)" strokeWidth="2" />
          <circle cx="112" cy="74" r="4.5" fill="url(#goldRibbon)" />
          <path d="M104 85 C104 79 120 79 120 85" fill="url(#goldRibbon)" />

          <rect
            x="48"
            y="42"
            width="42"
            height="38"
            rx="6"
            fill="url(#darkCube)"
            stroke="url(#goldRibbon)"
            strokeWidth="2"
          />
          <rect x="65" y="42" width="8" height="38" fill="url(#goldRibbon)" />
          <rect x="48" y="57" width="42" height="8" fill="url(#goldRibbon)" />
          <path
            d="M69 42 C58 28 48 38 64 42 C74 38 80 28 69 42"
            fill="none"
            stroke="url(#goldRibbon)"
            strokeWidth="4"
          />
        </svg>
      </div>
    );
  }

  if (index === 1) {
    // Slide 2: FIRST DEPOSIT BONUS - WELCOME TO MAAN.WIN! (00:20)
    return (
      <div
        onClick={onClick}
        className="w-full h-40 rounded-2xl bg-gradient-to-r from-[#161c24] via-[#242118] to-[#3a280e] border border-amber-500/25 p-4 relative overflow-hidden cursor-pointer flex flex-col justify-between select-none"
      >
        <div className="flex items-start justify-between z-10">
          <div>
            <h2 className="font-display font-black text-xl leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-[#fff2b2] via-[#ffc145] to-[#e07b00]">
              FIRST DEPOSIT
              <br />
              BONUS
            </h2>
            <p className="text-[11px] font-bold tracking-wider text-amber-100/90 mt-2">
              WELCOME TO XG WIN 99!
            </p>
          </div>
          <div className="scale-75 origin-top-right">
            <MaanWinLogo size="sm" />
          </div>
        </div>
        <div className="text-[10px] text-amber-300/80 z-10">
          Instant extra bonus on your first recharge
        </div>
        <svg viewBox="0 0 130 110" className="w-36 h-28 absolute right-2 bottom-1 pointer-events-none">
          <defs>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFF099" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>
          </defs>
          <rect
            x="38"
            y="24"
            width="68"
            height="56"
            rx="10"
            fill="#1f242d"
            stroke="url(#goldGrad)"
            strokeWidth="3"
          />
          <rect x="82" y="42" width="28" height="20" rx="5" fill="url(#goldGrad)" />
          <circle cx="91" cy="52" r="3.5" fill="#1f242d" />
          <text x="55" y="63" fill="url(#goldGrad)" fontSize="32" fontWeight="900" fontFamily="sans-serif">
            ₹
          </text>
          <circle cx="30" cy="78" r="12" fill="url(#goldGrad)" stroke="#FFF" strokeWidth="1" />
          <text x="26" y="83" fill="#78350F" fontSize="13" fontWeight="bold">₹</text>
          <circle cx="52" cy="86" r="10" fill="url(#goldGrad)" stroke="#FFF" strokeWidth="1" />
          <circle cx="75" cy="88" r="11" fill="url(#goldGrad)" stroke="#FFF" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  if (index === 2) {
    // Slide 3: VIP LEVEL UP, REWARDS LEVEL UP! (00:09)
    return (
      <div
        onClick={onClick}
        className="w-full h-40 rounded-2xl bg-gradient-to-r from-[#131820] via-[#1f242d] to-[#2e2415] border border-amber-500/20 p-4 relative overflow-hidden cursor-pointer flex flex-col justify-between select-none"
      >
        <div className="flex items-start justify-between z-10">
          <div>
            <h2 className="font-display font-black text-lg leading-tight text-transparent bg-clip-text bg-gradient-to-b from-[#ffe8a3] via-[#f59e0b] to-[#d97706]">
              VIP LEVEL UP,
              <br />
              REWARDS LEVEL UP!
            </h2>
            <p className="text-[11px] text-slate-200 mt-1 max-w-[190px]">
              The higher your VIP level, the bigger your rewards.
            </p>
          </div>
          <div className="scale-75 origin-top-right">
            <MaanWinLogo size="sm" />
          </div>
        </div>
        <p className="text-[10px] text-amber-300/90 z-10">
          VIP Upgrade Bonus + Weekly Rewards
        </p>
        <svg viewBox="0 0 130 100" className="w-36 h-26 absolute right-1 bottom-2 pointer-events-none">
          <g transform="rotate(-10 65 55)">
            <rect
              x="25"
              y="22"
              width="78"
              height="52"
              rx="8"
              fill="#181c24"
              stroke="#F59E0B"
              strokeWidth="2.5"
            />
            <polygon points="48,46 54,32 64,41 74,32 80,46" fill="#FBBF24" />
            <text x="48" y="64" fill="#FBBF24" fontSize="16" fontWeight="900">
              VIP
            </text>
          </g>
        </svg>
      </div>
    );
  }

  // Slide 4: ₹500,000 RED ENVELOPE RAIN EVERY DAY! (00:24 & 01:59)
  return (
    <div
      onClick={onClick}
      className="w-full h-40 rounded-2xl bg-gradient-to-r from-[#141a24] via-[#2b191c] to-[#4c1616] border border-red-500/25 p-4 relative overflow-hidden cursor-pointer flex flex-col justify-between select-none"
    >
      <div className="flex items-start justify-between z-10">
        <div>
          <div className="font-display font-black text-2xl leading-none text-[#ffc837]">
            ₹500,000
          </div>
          <h2 className="font-display font-extrabold text-sm text-white mt-1 leading-tight">
            RED ENVELOPE RAIN
            <br />
            EVERY DAY!
          </h2>
        </div>
        <div className="scale-75 origin-top-right">
          <MaanWinLogo size="sm" />
        </div>
      </div>
      <p className="text-[10px] font-semibold text-amber-200/90 z-10">
        EVERY HOUR · 24/7 · NEVER STOPS!
      </p>
      <svg viewBox="0 0 130 105" className="w-36 h-28 absolute right-1 bottom-0 pointer-events-none">
        <rect
          x="52"
          y="18"
          width="48"
          height="68"
          rx="6"
          fill="#DC2626"
          stroke="#FCA5A5"
          strokeWidth="1.5"
        />
        <path d="M52 36 Q76 52 100 36" fill="none" stroke="#FBBF24" strokeWidth="2" />
        <circle cx="76" cy="44" r="9" fill="#FBBF24" />
        <text x="72" y="48" fill="#991B1B" fontSize="11" fontWeight="bold">
          ₹
        </text>
        <circle cx="42" cy="76" r="11" fill="#FBBF24" stroke="#FEF08A" strokeWidth="1" />
        <circle cx="96" cy="80" r="12" fill="#FBBF24" stroke="#FEF08A" strokeWidth="1" />
        <circle cx="68" cy="84" r="10" fill="#F59E0B" stroke="#FEF08A" strokeWidth="1" />
      </svg>
    </div>
  );
};

export type PopularGameType =
  | 'wingo'
  | 'aviator'
  | 'chicken'
  | 'vortex'
  | 'k3'
  | '5d'
  | 'cricket'
  | 'moto'
  | 'fortunegems2'
  | 'mines'
  | 'queenbounty'
  | 'crazy777'
  | 'moneycoming'
  | 'moneycoming2'
  | 'superace'
  | 'crazy777_2'
  | 'luckyneko'
  | 'superace2';

export interface PopularGameItem {
  id: string;
  title: string;
  winRate: string;
  type: PopularGameType;
  action: 'wingo-30s' | 'wingo-1m' | 'aviator' | 'chicken' | 'vortex' | 'toast';
}

export const POPULAR_GAMES_LIST: PopularGameItem[] = [
  { id: 'pg-1', title: 'WinGo 30sec', winRate: '98%', type: 'wingo', action: 'wingo-30s' },
  { id: 'pg-2', title: 'Spribe Aviator', winRate: '98%', type: 'aviator', action: 'aviator' },
  { id: 'pg-3', title: 'Chicken Road 2', winRate: '97%', type: 'chicken', action: 'chicken' },
  { id: 'pg-4', title: 'Vortex', winRate: '99%', type: 'vortex', action: 'vortex' },
  { id: 'pg-5', title: 'K3 1 Min', winRate: '99%', type: 'k3', action: 'wingo-1m' },
  { id: 'pg-6', title: '5D 1 Min', winRate: '98%', type: '5d', action: 'wingo-1m' },
  { id: 'pg-7', title: 'Cricket', winRate: '98%', type: 'cricket', action: 'toast' },
  { id: 'pg-8', title: 'Moto Racing', winRate: '98%', type: 'moto', action: 'toast' },
  { id: 'pg-9', title: 'Fortune Gems 2', winRate: '99%', type: 'fortunegems2', action: 'toast' },
  { id: 'pg-10', title: 'Mines', winRate: '99%', type: 'mines', action: 'toast' },
  { id: 'pg-11', title: 'Queen Of Bounty', winRate: '98%', type: 'queenbounty', action: 'toast' },
  { id: 'pg-12', title: 'Crazy777', winRate: '98%', type: 'crazy777', action: 'toast' },
  { id: 'pg-13', title: 'Money Coming', winRate: '97%', type: 'moneycoming', action: 'toast' },
  { id: 'pg-14', title: 'Money Coming 2', winRate: '99%', type: 'moneycoming2', action: 'toast' },
  { id: 'pg-15', title: 'Super Ace', winRate: '99%', type: 'superace', action: 'toast' },
  { id: 'pg-16', title: 'Crazy777 2', winRate: '98%', type: 'crazy777_2', action: 'toast' },
  { id: 'pg-17', title: 'Lucky Neko', winRate: '99%', type: 'luckyneko', action: 'toast' },
  { id: 'pg-18', title: 'Super Ace 2', winRate: '98%', type: 'superace2', action: 'toast' },
];

export const PopularGameCard: React.FC<{
  title: string;
  winRate: string;
  type: PopularGameType;
  onPlay: () => void;
  className?: string;
}> = ({ title, winRate, type, onPlay, className = 'w-[126px] shrink-0' }) => {
  return (
    <div
      onClick={onPlay}
      className={`bg-[#151e2b] border border-[#2c3a4e] rounded-xl p-2 flex flex-col justify-between cursor-pointer active:scale-[0.98] transition-transform shadow-md select-none ${className}`}
    >
      {/* Square Artwork Thumbnail inside Card — Exact match to video */}
      <div className="w-full aspect-square rounded-lg overflow-hidden relative mb-2 shadow-inner bg-[#0f1722]">
        {/* 1. WinGo 30sec */}
        {type === 'wingo' && (
          <div className="w-full h-full bg-gradient-to-b from-[#dc2626] via-[#b91c1c] to-[#7f1d1d] flex flex-col items-center justify-center relative overflow-hidden">
            {/* Radial Halftone Dots Pattern */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'radial-gradient(#ffffff 1.2px, transparent 1.2px)',
                backgroundSize: '8px 8px',
              }}
            />
            {/* Top-left 30s Timer Badge */}
            <div className="absolute top-1 left-1 z-20 w-6 h-6 rounded-full bg-gradient-to-b from-[#fca5a5] to-[#ef4444] border border-white flex items-center justify-center shadow">
              <span className="font-mono-num font-black text-[7.5px] text-white leading-none">
                30s
              </span>
            </div>
            {/* Floating Background Lottery Balls */}
            <div className="w-6 h-6 rounded-full bg-gradient-to-b from-[#4ade80] to-[#15803d] border border-white/80 absolute top-2 right-1.5 flex items-center justify-center font-mono-num text-[9px] font-black text-white shadow">
              6
            </div>
            <div className="w-6 h-6 rounded-full bg-gradient-to-b from-[#4ade80] to-[#15803d] border border-white/80 absolute bottom-2 left-1 flex items-center justify-center font-mono-num text-[9px] font-black text-white shadow">
              9
            </div>
            <div className="w-5 h-5 rounded-full bg-gradient-to-b from-[#f87171] to-[#b91c1c] border border-white/80 absolute bottom-7 right-1 flex items-center justify-center font-mono-num text-[8px] font-black text-white shadow">
              0
            </div>
            <div className="w-6 h-6 rounded-full bg-gradient-to-b from-[#4ade80] to-[#15803d] border border-white/80 absolute -bottom-1 right-3 flex items-center justify-center font-mono-num text-[9px] font-black text-white shadow">
              1
            </div>

            {/* Center 3D Green #5 Lottery Sphere */}
            <div className="w-18 h-18 rounded-full bg-gradient-to-b from-[#4ade80] via-[#16a34a] to-[#14532d] border-[2.5px] border-white/90 shadow-[0_4px_12px_rgba(0,0,0,0.6)] flex items-center justify-center relative z-10">
              <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center font-mono-num font-black text-2xl text-[#15803d] shadow-inner -mt-1">
                5
              </div>
            </div>

            {/* Metallic 3D WINGO Banner across Lower Center */}
            <div className="-mt-3.5 z-20 px-2 py-0.5 rounded bg-gradient-to-b from-[#fef08a] via-[#f59e0b] to-[#b45309] border border-white shadow-lg">
              <span className="font-display font-black text-[12px] tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                WINGO
              </span>
            </div>
          </div>
        )}

        {/* 2. Spribe Aviator */}
        {type === 'aviator' && (
          <div className="w-full h-full bg-[#1a0509] flex flex-col items-center justify-center p-2 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-65"
              style={{
                background:
                  'repeating-conic-gradient(from 0deg, #4c0814 0deg 12deg, #1c0308 12deg 24deg)',
              }}
            />
            {/* Red Biplane / Propeller Plane */}
            <svg
              viewBox="0 0 120 60"
              className="w-20 h-11 relative z-10 drop-shadow-[0_4px_6px_rgba(0,0,0,0.85)]"
            >
              <path
                d="M14 42 L44 30 L38 18 L58 24 L90 13 C100 10, 108 15, 105 23 L70 39 L22 49 Z"
                fill="#e11d48"
              />
              <path d="M20 38 L8 30 L16 28 L28 35" fill="#fb7185" />
              <line
                x1="98"
                y1="5"
                x2="112"
                y2="33"
                stroke="#fda4af"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="105" cy="19" r="3.5" fill="#fff" />
            </svg>
            <div className="relative z-10 font-display font-black italic text-xl text-[#f41f46] tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] -mt-1">
              Aviator
            </div>
            <div className="w-12 h-0.5 bg-[#f41f46]/80 rounded-full relative z-10 mt-0.5" />
          </div>
        )}

        {/* 3. Chicken Road 2 */}
        {type === 'chicken' && (
          <div className="w-full h-full relative overflow-hidden bg-[#15803d]">
            <img
              src={chickenRoadImg}
              alt="Chicken Road 2"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent pt-3 pb-1 px-1 text-center">
              <div className="font-display font-black text-[10px] leading-none text-white drop-shadow">
                CHICKEN
              </div>
              <div className="font-display font-black text-[11px] leading-none text-[#fbbf24] drop-shadow">
                ROAD 2
              </div>
            </div>
          </div>
        )}

        {/* 4. Vortex */}
        {type === 'vortex' && (
          <div className="w-full h-full relative overflow-hidden bg-[#090d16]">
            <img
              src={vortexImg}
              alt="Vortex"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-x-0 top-1 text-center">
              <span className="font-display font-black text-xs tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-[#fef08a] to-[#f59e0b] drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                VORTEX
              </span>
            </div>
          </div>
        )}

        {/* 5. K3 1 Min — Exact cream card with 3D orange & red dice */}
        {type === 'k3' && (
          <svg viewBox="0 0 120 120" className="w-full h-full block">
            <rect width="120" height="120" fill="#fff5ea" />
            <polygon points="0,35 120,0 120,45 0,80" fill="#ffedd5" />
            {/* Bottom Orange Diagonal Platform */}
            <path d="M0 98 L120 74 L120 120 L0 120 Z" fill="#f97316" />
            <path d="M0 105 L120 82 L120 120 L0 120 Z" fill="#ea580c" />
            {/* Big Orange 3D Die */}
            <g transform="translate(66, 46) rotate(16)">
              <rect
                x="-24"
                y="-24"
                width="48"
                height="48"
                rx="10"
                fill="#fb923c"
                stroke="#fed7aa"
                strokeWidth="1.5"
              />
              <circle cx="-11" cy="-11" r="3.5" fill="#7c2d12" />
              <circle cx="0" cy="0" r="4" fill="#fff" />
              <circle cx="11" cy="11" r="3.5" fill="#7c2d12" />
              <circle cx="11" cy="-11" r="3.5" fill="#7c2d12" />
              <circle cx="-11" cy="11" r="3.5" fill="#7c2d12" />
            </g>
            {/* Smaller Red/Pink 3D Die */}
            <g transform="translate(36, 76) rotate(-18)">
              <rect
                x="-16"
                y="-16"
                width="32"
                height="32"
                rx="7"
                fill="#f43f5e"
                stroke="#fecdd3"
                strokeWidth="1.2"
              />
              <circle cx="-6" cy="-6" r="2.5" fill="#fff" />
              <circle cx="6" cy="6" r="2.5" fill="#fff" />
              <circle cx="6" cy="-6" r="2.5" fill="#fff" />
              <circle cx="-6" cy="6" r="2.5" fill="#fff" />
            </g>
            {/* Gold Coins */}
            <circle cx="20" cy="52" r="7" fill="#fbbf24" stroke="#fef08a" strokeWidth="1" />
            <circle cx="94" cy="78" r="8" fill="#f59e0b" stroke="#fef08a" strokeWidth="1" />
            <circle cx="100" cy="102" r="10" fill="#ffedd5" opacity="0.35" />
          </svg>
        )}

        {/* 6. 5D 1 Min — Exact cream card with 5D peach sphere + green 5 + pink D */}
        {type === '5d' && (
          <svg viewBox="0 0 120 120" className="w-full h-full block">
            <rect width="120" height="120" fill="#fff5ea" />
            <polygon points="0,35 120,0 120,45 0,80" fill="#ffedd5" />
            <path d="M0 98 L120 74 L120 120 L0 120 Z" fill="#f97316" />
            <path d="M0 105 L120 82 L120 120 L0 120 Z" fill="#ea580c" />
            {/* Main Peach/Gold 5D Sphere */}
            <circle cx="64" cy="48" r="28" fill="#fdba74" stroke="#fed7aa" strokeWidth="2" />
            <circle cx="62" cy="47" r="19" fill="#fff7ed" />
            <text
              x="62"
              y="54"
              textAnchor="middle"
              fill="#ea580c"
              fontSize="20"
              fontWeight="900"
            >
              5D
            </text>
            {/* Green 5 Ball */}
            <circle cx="32" cy="76" r="15" fill="#22c55e" stroke="#bbf7d0" strokeWidth="1.5" />
            <circle cx="32" cy="76" r="10" fill="#ffffff" />
            <text
              x="32"
              y="80"
              textAnchor="middle"
              fill="#15803d"
              fontSize="12"
              fontWeight="900"
            >
              5
            </text>
            {/* Pink D Ball */}
            <circle cx="92" cy="70" r="11" fill="#f43f5e" stroke="#fecdd3" strokeWidth="1" />
            <circle cx="92" cy="70" r="7" fill="#ffffff" />
            <text
              x="92"
              y="73.5"
              textAnchor="middle"
              fill="#be123c"
              fontSize="9"
              fontWeight="900"
            >
              D
            </text>
          </svg>
        )}

        {/* 7. Cricket */}
        {type === 'cricket' && (
          <div className="w-full h-full relative overflow-hidden bg-[#0f172a]">
            <img
              src={cricketXImg}
              alt="Cricket"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent py-1 text-center">
              <span className="font-display font-black text-xs text-white tracking-wide drop-shadow">
                CRICKET
              </span>
            </div>
          </div>
        )}

        {/* 8. Moto Racing — Cream card with motorcycle wheelie + green 7 ball */}
        {type === 'moto' && (
          <svg viewBox="0 0 120 120" className="w-full h-full block">
            <rect width="120" height="120" fill="#fff5ea" />
            <polygon points="0,35 120,0 120,45 0,80" fill="#ffedd5" />
            <path d="M0 98 L120 74 L120 120 L0 120 Z" fill="#f97316" />
            <path d="M0 105 L120 82 L120 120 L0 120 Z" fill="#ea580c" />
            {/* Rear Wheel */}
            <circle cx="34" cy="76" r="14" fill="#1e293b" stroke="#94a3b8" strokeWidth="3" />
            <circle cx="34" cy="76" r="6" fill="#f59e0b" />
            {/* Front Wheel High in Air (Wheelie) */}
            <circle cx="84" cy="34" r="13" fill="#1e293b" stroke="#94a3b8" strokeWidth="3" />
            <circle cx="84" cy="34" r="5" fill="#f59e0b" />
            {/* Bike Frame & Rider in Gold/Black */}
            <path
              d="M34 76 L58 54 L84 34 L66 32 L46 48 Z"
              fill="#f59e0b"
              stroke="#1e293b"
              strokeWidth="2"
            />
            {/* Rider Helmet & Torso */}
            <circle cx="48" cy="24" r="8" fill="#d97706" stroke="#1e293b" strokeWidth="1.5" />
            <path d="M44 22 L53 22 L52 26 L45 26 Z" fill="#0f172a" />
            <path
              d="M38 48 C36 34, 46 30, 56 36 L66 42 L48 56 Z"
              fill="#1e293b"
            />
            {/* Green #7 Ball on Bottom Right */}
            <circle cx="90" cy="74" r="14" fill="#22c55e" stroke="#bbf7d0" strokeWidth="1.5" />
            <circle cx="90" cy="74" r="9" fill="#ffffff" />
            <text
              x="90"
              y="78"
              textAnchor="middle"
              fill="#15803d"
              fontSize="12"
              fontWeight="900"
            >
              7
            </text>
          </svg>
        )}

        {/* 9. Fortune Gems 2 (JILI) */}
        {type === 'fortunegems2' && (
          <div className="w-full h-full bg-gradient-to-b from-[#311042] via-[#1e1b4b] to-[#451a03] flex flex-col items-center justify-between p-1.5 relative overflow-hidden">
            <span className="self-end bg-gradient-to-b from-[#fde047] to-[#ca8a04] text-slate-950 font-black text-[7px] px-1.5 py-0.5 rounded shadow z-20">
              JILI
            </span>
            {/* Golden Multiplier Wheel + Garuda Mask */}
            <div className="w-17 h-17 rounded-full border-[3px] border-[#fbbf24] bg-gradient-to-tr from-[#7c2d12] via-[#d97706] to-[#fef08a] flex items-center justify-center relative shadow-[0_0_15px_rgba(251,191,36,0.6)] -mt-1">
              <div className="w-11 h-11 rounded-full bg-[#b91c1c] border-2 border-[#fde047] flex flex-col items-center justify-center">
                <span className="text-[7px] font-black text-[#fde047] leading-none">15X</span>
                <span className="text-xs font-black text-white leading-none">👑</span>
              </div>
            </div>
            <div className="w-full bg-gradient-to-r from-[#92400e] via-[#fbbf24] to-[#92400e] rounded px-1 py-0.5 text-center border border-yellow-200/70 z-10">
              <div className="font-display font-black text-[8px] text-[#451a03] leading-none">
                FORTUNE GEMS 2
              </div>
            </div>
          </div>
        )}

        {/* 10. Mines */}
        {type === 'mines' && (
          <div className="w-full h-full bg-gradient-to-b from-[#7f1d1d] via-[#450a0a] to-[#090d16] flex flex-col items-center justify-between p-2 relative overflow-hidden">
            {/* Sparking Fuse */}
            <div className="w-2 h-2 rounded-full bg-[#fde047] shadow-[0_0_10px_#fde047] animate-ping mt-1" />
            {/* 3D Black Bomb Sphere */}
            <div className="w-15 h-15 rounded-full bg-gradient-to-br from-[#475569] via-[#1e293b] to-[#020617] border border-white/20 shadow-[0_6px_14px_rgba(0,0,0,0.9)] flex items-center justify-center relative -mt-2">
              <div className="w-4 h-4 rounded-full bg-white/25 absolute top-2.5 left-3 blur-[1px]" />
              <div className="w-3 h-2 bg-[#334155] border border-slate-400 rounded-t -top-2 absolute" />
            </div>
            <div className="font-display font-black text-xs tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              MINES
            </div>
          </div>
        )}

        {/* 11. Queen Of Bounty */}
        {type === 'queenbounty' && (
          <div className="w-full h-full bg-gradient-to-b from-[#f59e0b] via-[#b45309] to-[#451a03] flex flex-col items-center justify-between p-1.5 relative overflow-hidden">
            {/* Pirate Hat & Captain Silhouette / Emblem */}
            <svg viewBox="0 0 100 80" className="w-20 h-16 mt-0.5">
              {/* Tricorn Pirate Hat */}
              <path
                d="M12 34 Q50 8 88 34 Q72 42 50 40 Q28 42 12 34 Z"
                fill="#7f1d1d"
                stroke="#fbbf24"
                strokeWidth="2"
              />
              {/* Face & Red Hair */}
              <path d="M26 38 Q20 62 32 72 L68 72 Q80 62 74 38 Z" fill="#dc2626" />
              <circle cx="50" cy="48" r="13" fill="#fed7aa" />
              <circle cx="45" cy="46" r="2" fill="#1e293b" />
              <circle cx="55" cy="46" r="2" fill="#1e293b" />
              <path d="M46 54 Q50 57 54 54" stroke="#be123c" strokeWidth="2" fill="none" />
            </svg>
            <div className="w-full bg-gradient-to-r from-[#451a03] via-[#78350f] to-[#451a03] border border-[#fbbf24] rounded px-1 py-0.5 text-center z-10">
              <div className="font-display font-black text-[8px] text-[#fde047] leading-none">
                QUEEN OF BOUNTY
              </div>
            </div>
          </div>
        )}

        {/* 12. Crazy777 (JILI) */}
        {type === 'crazy777' && (
          <div className="w-full h-full bg-gradient-to-b from-[#0284c7] via-[#1d4ed8] to-[#1e1b4b] flex flex-col items-center justify-between p-1.5 relative overflow-hidden">
            <span className="self-end bg-gradient-to-b from-[#fde047] to-[#ca8a04] text-slate-950 font-black text-[7px] px-1.5 py-0.5 rounded shadow z-20">
              JILI
            </span>
            <div className="font-display font-black italic text-4xl text-transparent bg-clip-text bg-gradient-to-b from-[#fef08a] via-[#ef4444] to-[#991b1b] drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)] -my-2">
              777
            </div>
            <div className="w-full bg-gradient-to-r from-[#b91c1c] via-[#f59e0b] to-[#b91c1c] rounded px-1 py-0.5 text-center border border-yellow-200 z-10">
              <span className="font-display font-black text-[8.5px] text-white leading-none">
                CRAZY 777
              </span>
            </div>
          </div>
        )}

        {/* 13. Money Coming (JILI) */}
        {type === 'moneycoming' && (
          <div className="w-full h-full bg-gradient-to-b from-[#991b1b] via-[#15803d] to-[#052e16] flex flex-col items-center justify-between p-1.5 relative overflow-hidden">
            <span className="self-end bg-gradient-to-b from-[#fde047] to-[#ca8a04] text-slate-950 font-black text-[7px] px-1.5 py-0.5 rounded shadow z-20">
              JILI
            </span>
            {/* Flying Green Cash Bills Stack */}
            <div className="relative flex items-center justify-center my-auto">
              <div className="w-16 h-10 rounded bg-gradient-to-r from-[#22c55e] to-[#15803d] border-2 border-[#bbf7d0] -rotate-12 flex items-center justify-center shadow-lg">
                <span className="font-mono-num font-black text-xl text-[#fef08a] drop-shadow">
                  $$$
                </span>
              </div>
            </div>
            <div className="w-full bg-gradient-to-r from-[#b45309] via-[#fbbf24] to-[#b45309] rounded px-1 py-0.5 text-center border border-white z-10">
              <span className="font-display font-black text-[8px] text-[#7f1d1d] leading-none">
                MONEY COMING
              </span>
            </div>
          </div>
        )}

        {/* 14. Money Coming 2 (JILI) */}
        {type === 'moneycoming2' && (
          <div className="w-full h-full bg-gradient-to-b from-[#7f1d1d] via-[#166534] to-[#064e3b] flex flex-col items-center justify-between p-1.5 relative overflow-hidden">
            <span className="self-end bg-gradient-to-b from-[#fde047] to-[#ca8a04] text-slate-950 font-black text-[7px] px-1.5 py-0.5 rounded shadow z-20">
              JILI
            </span>
            <div className="relative flex flex-col items-center my-auto">
              <div className="px-1.5 py-0.5 rounded bg-sky-500 border border-white text-[7px] font-black text-white shadow mb-0.5">
                10X UP WIN
              </div>
              <div className="w-15 h-8 rounded bg-gradient-to-r from-[#22c55e] to-[#15803d] border border-[#bbf7d0] -rotate-6 flex items-center justify-center shadow">
                <span className="font-mono-num font-black text-sm text-[#fef08a]">3 $$$</span>
              </div>
            </div>
            <div className="w-full bg-gradient-to-r from-[#991b1b] via-[#fbbf24] to-[#991b1b] rounded px-1 py-0.5 text-center border border-yellow-200 z-10">
              <span className="font-display font-black text-[7.5px] text-white leading-none">
                MONEY COMING 2
              </span>
            </div>
          </div>
        )}

        {/* 15. Super Ace (JILI) */}
        {type === 'superace' && (
          <div className="w-full h-full bg-gradient-to-b from-[#16a34a] via-[#15803d] to-[#052e16] flex flex-col items-center justify-between p-1.5 relative overflow-hidden">
            <span className="self-end bg-gradient-to-b from-[#fde047] to-[#ca8a04] text-slate-950 font-black text-[7px] px-1.5 py-0.5 rounded shadow z-20">
              JILI
            </span>
            {/* Royal Red & Gold Crown */}
            <svg viewBox="0 0 80 55" className="w-16 h-12 -my-1 drop-shadow">
              <path
                d="M10 42 L16 14 L30 28 L40 8 L50 28 L64 14 L70 42 Z"
                fill="#ef4444"
                stroke="#fde047"
                strokeWidth="3"
              />
              <circle cx="16" cy="11" r="3.5" fill="#fde047" />
              <circle cx="40" cy="5" r="4" fill="#fde047" />
              <circle cx="64" cy="11" r="3.5" fill="#fde047" />
            </svg>
            <div className="w-full bg-gradient-to-r from-[#ca8a04] via-[#fef08a] to-[#ca8a04] rounded px-1 py-0.5 text-center border border-white z-10">
              <span className="font-display font-black text-[8.5px] text-[#14532d] leading-none">
                SUPER ACE
              </span>
            </div>
          </div>
        )}

        {/* 16. Crazy777 2 (JILI) */}
        {type === 'crazy777_2' && (
          <div className="w-full h-full bg-gradient-to-b from-[#581c87] via-[#1d4ed8] to-[#0f172a] flex flex-col items-center justify-between p-1.5 relative overflow-hidden">
            <span className="self-end bg-gradient-to-b from-[#fde047] to-[#ca8a04] text-slate-950 font-black text-[7px] px-1.5 py-0.5 rounded shadow z-20">
              JILI
            </span>
            <div className="font-display font-black italic text-3xl text-transparent bg-clip-text bg-gradient-to-b from-[#fef08a] via-[#f97316] to-[#dc2626] drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)] -my-1">
              777
            </div>
            <div className="w-full bg-gradient-to-r from-[#7e22ce] via-[#fbbf24] to-[#7e22ce] rounded px-1 py-0.5 text-center border border-yellow-200 z-10">
              <span className="font-display font-black text-[8px] text-white leading-none">
                CRAZY 777 2
              </span>
            </div>
          </div>
        )}

        {/* 17. Lucky Neko */}
        {type === 'luckyneko' && (
          <div className="w-full h-full bg-gradient-to-b from-[#991b1b] via-[#b45309] to-[#451a03] flex flex-col items-center justify-between p-1.5 relative overflow-hidden">
            {/* White Beckoning Maneki-Neko Fortune Cat */}
            <svg viewBox="0 0 90 70" className="w-18 h-14 mt-0.5">
              {/* Cat Ears */}
              <polygon points="24,26 28,8 40,20" fill="#ffffff" stroke="#f59e0b" strokeWidth="1.5" />
              <polygon points="30,22 30,12 37,20" fill="#ef4444" />
              <polygon points="66,26 62,8 50,20" fill="#ffffff" stroke="#f59e0b" strokeWidth="1.5" />
              <polygon points="60,22 60,12 53,20" fill="#ef4444" />
              {/* Cat Head */}
              <ellipse cx="45" cy="36" rx="22" ry="18" fill="#ffffff" stroke="#fde047" strokeWidth="1.5" />
              {/* Smiling Closed Eyes */}
              <path d="M34 33 Q38 29 42 33" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M48 33 Q52 29 56 33" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />
              {/* Red Nose & Smile */}
              <circle cx="45" cy="38" r="2" fill="#ef4444" />
              <path d="M41 42 Q45 46 49 42" stroke="#ef4444" strokeWidth="1.8" fill="none" />
              {/* Raised Beckoning Paw + Gold Coin */}
              <ellipse cx="22" cy="38" rx="6" ry="9" fill="#ffffff" stroke="#f59e0b" strokeWidth="1.5" />
              <circle cx="45" cy="54" r="7" fill="#fbbf24" stroke="#fef08a" strokeWidth="1" />
            </svg>
            <div className="w-full bg-gradient-to-r from-[#581c87] via-[#a855f7] to-[#581c87] rounded px-1 py-0.5 text-center border border-[#fde047] z-10">
              <span className="font-display font-black text-[8px] text-[#fef08a] leading-none">
                LUCKY NEKO
              </span>
            </div>
          </div>
        )}

        {/* 18. Super Ace 2 (JILI) */}
        {type === 'superace2' && (
          <div className="w-full h-full bg-gradient-to-b from-[#15803d] via-[#991b1b] to-[#450a0a] flex flex-col items-center justify-between p-1.5 relative overflow-hidden">
            <span className="self-end bg-gradient-to-b from-[#fde047] to-[#ca8a04] text-slate-950 font-black text-[7px] px-1.5 py-0.5 rounded shadow z-20">
              JILI
            </span>
            <div className="flex items-center justify-center gap-1 -my-1">
              <div className="w-7 h-9 rounded bg-gradient-to-b from-[#fef08a] to-[#d97706] border border-white flex items-center justify-center -rotate-12 shadow">
                <span className="font-black text-xs text-[#7f1d1d]">A♠</span>
              </div>
              <svg viewBox="0 0 60 45" className="w-11 h-9 drop-shadow">
                <path
                  d="M6 36 L12 12 L24 24 L30 6 L36 24 L48 12 L54 36 Z"
                  fill="#ef4444"
                  stroke="#fde047"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
            <div className="w-full bg-gradient-to-r from-[#b45309] via-[#fef08a] to-[#b45309] rounded px-1 py-0.5 text-center border border-white z-10">
              <span className="font-display font-black text-[8px] text-[#7f1d1d] leading-none">
                SUPER ACE 2
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Game Title */}
      <div className="text-[12.5px] font-bold text-white truncate mb-1.5 leading-tight">
        {title}
      </div>

      {/* Win Rate Row — Exact match to video */}
      <div className="flex items-center justify-between text-[10.5px] mb-1">
        <span className="text-slate-400 font-medium">Win Rate</span>
        <span className="text-white font-mono-num font-extrabold">{winRate}</span>
      </div>

      {/* Green Progress Bar — Exact match to video */}
      <div className="w-full h-1.5 bg-[#0b1018] rounded-full overflow-hidden mb-2.5">
        <div
          className="h-full bg-gradient-to-r from-[#16a34a] to-[#22c55e] rounded-full"
          style={{ width: winRate }}
        />
      </div>

      {/* Orange Play Now Button — Exact match to video */}
      <button
        type="button"
        className="w-full py-1.5 rounded-lg bg-gradient-to-b from-[#ff9833] to-[#ea6508] text-white text-xs font-bold shadow-[0_2px_6px_rgba(234,101,8,0.35)] active:opacity-90 cursor-pointer"
      >
        Play Now
      </button>
    </div>
  );
};

