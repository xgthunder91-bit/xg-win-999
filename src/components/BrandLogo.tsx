import React from 'react';

export const xgWin99LogoImg = '/xgwin99-logo.png';

export const MaanWinLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const badgeDims =
    size === 'sm'
      ? 'w-7 h-7 rounded-lg'
      : size === 'lg'
        ? 'w-10 h-10 rounded-xl'
        : 'w-8 h-8 rounded-lg';
  const textClass =
    size === 'sm'
      ? 'text-lg'
      : size === 'lg'
        ? 'text-2xl'
        : 'text-[21px]';

  return (
    <div className="inline-flex items-center gap-2 select-none shrink-0">
      <div
        className={`${badgeDims} overflow-hidden border border-amber-400/70 bg-[#111923] shadow-[0_0_10px_rgba(255,140,0,0.35)] shrink-0 flex items-center justify-center`}
      >
        <img
          src={xgWin99LogoImg}
          alt="XG Win 99 Logo"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover scale-105"
        />
      </div>
      <span className={`font-display font-extrabold tracking-tight leading-none ${textClass}`}>
        <span className="text-white">XG Win </span>
        <span className="text-[#ff7b1b]">99</span>
      </span>
    </div>
  );
};

export const MaanWinSquareLogo: React.FC = () => {
  return (
    <div className="flex flex-col items-center select-none">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-b from-[#172a46] to-[#0f1a2c] border-2 border-amber-400/70 shadow-[0_0_28px_rgba(255,140,0,0.4)] overflow-hidden flex items-center justify-center p-0.5">
        <img
          src={xgWin99LogoImg}
          alt="XG Win 99 Brand Emblem"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover rounded-[20px]"
        />
      </div>
      <div className="mt-2.5 inline-flex items-center gap-2">
        <div className="w-6 h-6 rounded-md overflow-hidden border border-amber-400/70 bg-[#111923] shadow shrink-0">
          <img
            src={xgWin99LogoImg}
            alt="XG Win 99"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover scale-105"
          />
        </div>
        <span className="font-display font-extrabold text-lg tracking-tight leading-none">
          <span className="text-white">XG Win </span>
          <span className="text-[#ff7b1b]">99</span>
        </span>
      </div>
    </div>
  );
};

export const TreasureChestIcon: React.FC<{ className?: string }> = ({ className = 'w-14 h-14' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 96 96"
        className="w-full h-full overflow-visible drop-shadow-[0_6px_12px_rgba(255,138,30,0.45)]"
      >
        <defs>
          <radialGradient id="chestAuraGlow" cx="50%" cy="52%" r="50%">
            <stop offset="0%" stopColor="#FFE066" stopOpacity="0.75" />
            <stop offset="55%" stopColor="#FF8A1E" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FF5500" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="royalGoldRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF6B7" />
            <stop offset="35%" stopColor="#FFD03B" />
            <stop offset="70%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <linearGradient id="royalGoldDark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
          <linearGradient id="chestCrimsonWood" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B91C1C" />
            <stop offset="50%" stopColor="#7F1D1D" />
            <stop offset="100%" stopColor="#450A0A" />
          </linearGradient>
          <linearGradient id="rubyGem" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B8B" />
            <stop offset="50%" stopColor="#E11D48" />
            <stop offset="100%" stopColor="#881337" />
          </linearGradient>
          <linearGradient id="emeraldGem" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6EE7B7" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#065F46" />
          </linearGradient>
        </defs>

        {/* Soft Golden Back Aura */}
        <circle cx="48" cy="52" r="38" fill="url(#chestAuraGlow)" />

        <g className="animate-chest-body">
          {/* Dark Inside Cavity (visible when lid opens) */}
          <polygon
            points="20,44 58,36 76,45 38,54"
            fill="#2A0800"
            stroke="#B45309"
            strokeWidth="1.5"
          />

          {/* Overflowing Inner Gold Coins, Rubies & Emeralds (animates up when lid opens) */}
          <g className="animate-chest-treasure">
            {/* Inner Gold Glow */}
            <ellipse cx="48" cy="43" rx="22" ry="9" fill="#FDE047" opacity="0.85" />
            {/* Pile of Gold Coins */}
            <circle cx="33" cy="43" r="6" fill="#FACC15" stroke="#B45309" strokeWidth="1" />
            <circle cx="42" cy="39" r="7" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1" />
            <circle cx="52" cy="40" r="6.5" fill="#FACC15" stroke="#B45309" strokeWidth="1" />
            <circle cx="61" cy="43" r="5.5" fill="#F59E0B" stroke="#92400E" strokeWidth="1" />
            <circle cx="38" cy="45" r="5.5" fill="#FDE047" stroke="#CA8A04" strokeWidth="1" />
            <circle cx="48" cy="44" r="6" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1" />
            {/* Glowing Gems in Treasure Pile */}
            <polygon points="39,39 43,33 47,39 43,43" fill="url(#rubyGem)" stroke="#FFE4E6" strokeWidth="0.6" />
            <polygon points="50,41 54,35 58,41 54,45" fill="url(#emeraldGem)" stroke="#D1FAE5" strokeWidth="0.6" />
            <polygon points="29,43 32,38 35,43 32,46" fill="#38BDF8" stroke="#E0F2FE" strokeWidth="0.6" />
          </g>

          {/* Animated Hinged Upper 3D Lid (Opens & Closes) */}
          <g className="animate-chest-lid">
            {/* Main Curved 3D Dome Lid */}
            <path
              d="M 18 44 C 17 26, 46 20, 58 23 C 68 25, 76 33, 76 44 L 38 53 Z"
              fill="url(#chestCrimsonWood)"
              stroke="url(#royalGoldRim)"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            {/* Right Isometric Side Panel of Lid */}
            <path
              d="M 55 24 C 66 24, 75 32, 76 44 L 58 48 C 57 36, 51 28, 45 25 Z"
              fill="url(#royalGoldDark)"
              opacity="0.45"
            />
            {/* Thick Gold Lid Ribbons/Straps */}
            <path
              d="M 27 46 C 26 31, 41 24, 49 24 L 54 25 C 45 26, 32 33, 33 48 Z"
              fill="url(#royalGoldRim)"
            />
            <path
              d="M 46 50 C 45 35, 57 27, 65 27 L 69 29 C 61 30, 51 37, 52 51 Z"
              fill="url(#royalGoldRim)"
            />
            {/* Top Lid Gems (Ruby & Emerald Studs) */}
            <ellipse
              cx="24"
              cy="37"
              rx="3.2"
              ry="2.2"
              transform="rotate(-20 24 37)"
              fill="url(#emeraldGem)"
              stroke="#FEF08A"
              strokeWidth="1"
            />
            <ellipse
              cx="39"
              cy="34"
              rx="3.8"
              ry="2.5"
              transform="rotate(-14 39 34)"
              fill="url(#rubyGem)"
              stroke="#FEF08A"
              strokeWidth="1"
            />
            <ellipse
              cx="58"
              cy="36"
              rx="3.2"
              ry="2.2"
              transform="rotate(12 58 36)"
              fill="url(#emeraldGem)"
              stroke="#FEF08A"
              strokeWidth="1"
            />
          </g>

          {/* Lower 3D Isometric Chest Base Box */}
          {/* Front-Left Face */}
          <polygon
            points="18,44 56,52 53,75 21,67"
            fill="url(#chestCrimsonWood)"
            stroke="url(#royalGoldRim)"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          {/* Front-Right Isometric Face */}
          <polygon
            points="56,52 76,44 72,66 53,75"
            fill="#5B1111"
            stroke="url(#royalGoldRim)"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />

          {/* Golden Vertical Straps & Corner Reinforcements on Base */}
          <polygon points="27,46 33,47 31,69 25,68" fill="url(#royalGoldRim)" />
          <polygon points="45,50 51,51 49,73 43,72" fill="url(#royalGoldRim)" />
          <polygon points="63,49 68,47 65,69 60,71" fill="url(#royalGoldDark)" />

          {/* Embedded Front Base Jewels (Ruby & Emerald) */}
          <circle cx="23" cy="56" r="2.6" fill="url(#rubyGem)" stroke="#FEF08A" strokeWidth="0.9" />
          <circle cx="52" cy="63" r="2.6" fill="url(#emeraldGem)" stroke="#FEF08A" strokeWidth="0.9" />
          <circle cx="66" cy="58" r="2.4" fill="url(#rubyGem)" stroke="#FEF08A" strokeWidth="0.9" />

          {/* Ornate Golden Center Lock Plate & Ruby Heart Keyhole */}
          <polygon
            points="33,45 45,48 46,60 38.5,65 32,58"
            fill="url(#royalGoldRim)"
            stroke="#FFFBEB"
            strokeWidth="1.2"
          />
          <polygon points="36,50 42,51.5 41.5,58 38.5,60.5 35.5,57" fill="url(#rubyGem)" />
          <circle cx="38.8" cy="54.5" r="1.5" fill="#2A0800" />
        </g>

        {/* Bursting Coins & 4-Point Star Sparkles */}
        <g className="animate-chest-sparkle-1">
          <circle cx="28" cy="28" r="4" fill="#FDE047" stroke="#CA8A04" strokeWidth="1" />
          <path d="M 18 22 L 20 27 L 25 29 L 20 31 L 18 36 L 16 31 L 11 29 L 16 27 Z" fill="#FFFBEB" />
        </g>
        <g className="animate-chest-sparkle-2">
          <circle cx="66" cy="26" r="4.2" fill="#FACC15" stroke="#B45309" strokeWidth="1" />
          <path d="M 76 20 L 78 25 L 83 27 L 78 29 L 76 34 L 74 29 L 69 27 L 74 25 Z" fill="#FEF08A" />
        </g>
        <g className="animate-chest-sparkle-3">
          <polygon points="48,14 52,20 48,26 44,20" fill="url(#rubyGem)" stroke="#FFF" strokeWidth="0.8" />
          <path d="M 48 6 L 50 11 L 55 13 L 50 15 L 48 20 L 46 15 L 41 13 L 46 11 Z" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
};

export const NavHomeIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    viewBox="0 0 24 24"
    className={`w-6 h-6 transition-transform duration-300 ${
      active ? 'animate-nav-tab-active drop-shadow-[0_2px_8px_rgba(255,138,30,0.45)]' : ''
    }`}
  >
    <defs>
      <linearGradient id="navActiveOrangeHome" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFB84D" />
        <stop offset="50%" stopColor="#FF851B" />
        <stop offset="100%" stopColor="#F05A00" />
      </linearGradient>
    </defs>
    <path
      d="M 10.5 3.2 C 11.4 2.4 12.6 2.4 13.5 3.2 L 20.1 9.0 C 20.7 9.5 21 10.2 21 11.0 V 18.6 C 21 20.2 19.7 21.5 18.1 21.5 H 5.9 C 4.3 21.5 3 20.2 3 18.6 V 11.0 C 3 10.2 3.3 9.5 3.9 9.0 L 10.5 3.2 Z"
      fill={active ? 'url(#navActiveOrangeHome)' : '#526075'}
    />
    <rect
      x="8.2"
      y="14.6"
      width="7.6"
      height="2.8"
      rx="1.4"
      fill={active ? '#FFE8C2' : '#161F2C'}
    />
  </svg>
);

export const NavPromoIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    viewBox="0 0 24 24"
    className={`w-6 h-6 transition-transform duration-300 ${
      active ? 'animate-nav-tab-active drop-shadow-[0_2px_8px_rgba(255,138,30,0.45)]' : ''
    }`}
  >
    <defs>
      <linearGradient id="navActiveOrangePromo" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFB84D" />
        <stop offset="50%" stopColor="#FF851B" />
        <stop offset="100%" stopColor="#F05A00" />
      </linearGradient>
    </defs>
    {/* Top Ribbon Bow */}
    <path
      d="M 12 6.4 C 10.1 3.1 6.2 3.4 6.2 5.9 C 6.2 7.3 8.6 7.8 11.2 7.8 H 12.8 C 15.4 7.8 17.8 7.3 17.8 5.9 C 17.8 3.4 13.9 3.1 12 6.4 Z"
      fill="none"
      stroke={active ? '#FFB84D' : '#526075'}
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Gift Lid */}
    <rect
      x="3"
      y="7.3"
      width="18"
      height="4.2"
      rx="1.5"
      fill={active ? 'url(#navActiveOrangePromo)' : '#526075'}
    />
    {/* Gift Lower Box */}
    <rect
      x="4.2"
      y="12.5"
      width="15.6"
      height="8.8"
      rx="2.2"
      fill={active ? 'url(#navActiveOrangePromo)' : '#526075'}
    />
    {/* Vertical & Horizontal Ribbon Cutout / Highlight */}
    <rect
      x="10.7"
      y="7.3"
      width="2.6"
      height="14"
      rx="0.8"
      fill={active ? '#FFE8C2' : '#161F2C'}
    />
  </svg>
);

export const NavEarnIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    viewBox="0 0 24 24"
    className={`w-6 h-6 transition-transform duration-300 ${
      active ? 'animate-nav-tab-active drop-shadow-[0_2px_8px_rgba(255,138,30,0.45)]' : ''
    }`}
  >
    <defs>
      <linearGradient id="navActiveOrangeEarn" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFB84D" />
        <stop offset="50%" stopColor="#FF851B" />
        <stop offset="100%" stopColor="#F05A00" />
      </linearGradient>
    </defs>
    {/* Main Coin Circle */}
    <circle
      cx="11.5"
      cy="12.5"
      r="8.3"
      fill={active ? 'url(#navActiveOrangeEarn)' : '#526075'}
    />
    {/* Top-Right Sparkle / Star Badge (matches video) */}
    <path
      d="M 19.2 2.2 L 19.9 4.1 L 21.8 4.8 L 19.9 5.5 L 19.2 7.4 L 18.5 5.5 L 16.6 4.8 L 18.5 4.1 Z"
      fill={active ? '#FFB84D' : '#526075'}
    />
    {/* Currency Emblem inside Coin (Y / ¥ with double bar as in video) */}
    <path
      d="M 8.8 8.3 L 11.5 11.8 L 14.2 8.3 M 11.5 11.6 V 16.8 M 9.1 12.6 H 13.9 M 9.1 14.8 H 13.9"
      fill="none"
      stroke={active ? '#FFE8C2' : '#161F2C'}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const NavProfileIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    viewBox="0 0 24 24"
    className={`w-6 h-6 transition-transform duration-300 ${
      active ? 'animate-nav-tab-active drop-shadow-[0_2px_8px_rgba(255,138,30,0.45)]' : ''
    }`}
  >
    <defs>
      <linearGradient id="navActiveOrangeProfile" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFB84D" />
        <stop offset="50%" stopColor="#FF851B" />
        <stop offset="100%" stopColor="#F05A00" />
      </linearGradient>
    </defs>
    {/* Head */}
    <circle
      cx="12"
      cy="7.8"
      r="4.4"
      fill={active ? 'url(#navActiveOrangeProfile)' : '#526075'}
    />
    {/* Smile Curve inside Head */}
    <path
      d="M 10.2 8.3 Q 12 10.0 13.8 8.3"
      fill="none"
      stroke={active ? '#FFE8C2' : '#161F2C'}
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    {/* Rounded Shoulders / Torso */}
    <path
      d="M 4.5 19.2 C 4.5 15.6 7.8 13.6 12 13.6 C 16.2 13.6 19.5 15.6 19.5 19.2 C 19.5 20.6 18.4 21.5 16.9 21.5 H 7.1 C 5.6 21.5 4.5 20.6 4.5 19.2 Z"
      fill={active ? 'url(#navActiveOrangeProfile)' : '#526075'}
    />
  </svg>
);


export const CasinoBall: React.FC<{
  num: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}> = ({ num, size = 'md', onClick }) => {
  // Exact match to user's uploaded reference image:
  // 0 = Diagonal split: Top-Left Red + Bottom-Right Violet (both outer ball & center numeral)
  // 5 = Diagonal split: Top-Left Green + Bottom-Right Violet (both outer ball & center numeral)
  // 1, 3, 7, 9 = Green outer ball, white/mint center circle, green numeral
  // 2, 4, 6, 8 = Red outer ball, white/rose center circle, red numeral
  const isGreen = [1, 3, 5, 7, 9].includes(num);
  const isSplit = num === 0 || num === 5;

  const dims =
    size === 'xs'
      ? 'w-5 h-5'
      : size === 'sm'
        ? 'w-7 h-7'
        : size === 'lg'
          ? 'w-14 h-14'
          : 'w-[56px] h-[56px]';

  const uid = `b-${num}-${size}`;

  const renderBallHalf = (theme: 'green' | 'red' | 'violet') => {
    const outerGrad =
      theme === 'green'
        ? `url(#${uid}-outer-green)`
        : theme === 'red'
          ? `url(#${uid}-outer-red)`
          : `url(#${uid}-outer-violet)`;

    const rimColor =
      theme === 'green'
        ? '#179b52'
        : theme === 'red'
          ? '#d92b2b'
          : '#8c2df0';

    const innerGrad =
      theme === 'green'
        ? `url(#${uid}-inner-green)`
        : theme === 'red'
          ? `url(#${uid}-inner-red)`
          : `url(#${uid}-inner-violet)`;

    const textColor =
      theme === 'green'
        ? '#1d9a58'
        : theme === 'red'
          ? '#df3636'
          : '#8e31ea';

    const bottomSpotColor =
      theme === 'green'
        ? '#7ce8b0'
        : theme === 'red'
          ? '#ff9e9e'
          : '#d89eff';

    const arcHighlightColor =
      theme === 'green'
        ? '#68e3a3'
        : theme === 'red'
          ? '#ff8f8f'
          : '#d694ff';

    return (
      <>
        {/* Colored Outer Sphere */}
        <circle cx="50" cy="50" r="48" fill={outerGrad} />

        {/* 4 White/Pastel Rim Spots at 12, 3, 6, 9 o'clock */}
        <ellipse cx="50" cy="1.5" rx="14" ry="5.5" fill="#ffffff" opacity="0.95" />
        <ellipse cx="1.5" cy="50" rx="5.5" ry="14" fill="#ffffff" opacity="0.92" />
        <ellipse cx="98.5" cy="50" rx="5.5" ry="14" fill="#ffffff" opacity="0.92" />
        <ellipse cx="50" cy="98.5" rx="14" ry="5.5" fill={bottomSpotColor} opacity="0.85" />

        {/* Bottom Glossy Curved Reflection Arc */}
        <path
          d="M 24 81 Q 50 93 76 81 Q 50 88 24 81 Z"
          fill={arcHighlightColor}
          opacity="0.7"
        />

        {/* Subtle 3D Inner Bevel Ring */}
        <circle cx="50" cy="50" r="34" fill={rimColor} opacity="0.55" />

        {/* Center White / Soft Shaded Face */}
        <circle cx="50" cy="50" r="31.5" fill={innerGrad} />

        {/* Center Numeral */}
        <text
          x="50"
          y="64"
          textAnchor="middle"
          fill={textColor}
          fontSize="42"
          fontWeight="800"
          fontFamily="'Plus Jakarta Sans', sans-serif"
        >
          {num}
        </text>
      </>
    );
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${dims} relative flex items-center justify-center active:scale-95 transition-transform mx-auto cursor-pointer select-none`}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          {/* Sphere Circle Clip */}
          <clipPath id={`${uid}-sphere`}>
            <circle cx="50" cy="50" r="48" />
          </clipPath>
          {/* Top-Left Diagonal Half Clip (for 0 and 5) */}
          <clipPath id={`${uid}-tl`}>
            <polygon points="0,0 100,0 0,100" />
          </clipPath>
          {/* Bottom-Right Diagonal Half Clip (for 0 and 5) */}
          <clipPath id={`${uid}-br`}>
            <polygon points="100,0 100,100 0,100" />
          </clipPath>

          {/* Outer Green Sphere Gradient */}
          <radialGradient id={`${uid}-outer-green`} cx="45%" cy="22%" r="78%">
            <stop offset="0%" stopColor="#6cf0a9" />
            <stop offset="45%" stopColor="#25b869" />
            <stop offset="85%" stopColor="#148045" />
            <stop offset="100%" stopColor="#0f6937" />
          </radialGradient>

          {/* Outer Red Sphere Gradient */}
          <radialGradient id={`${uid}-outer-red`} cx="45%" cy="22%" r="78%">
            <stop offset="0%" stopColor="#ff8585" />
            <stop offset="45%" stopColor="#f44343" />
            <stop offset="85%" stopColor="#c81e1e" />
            <stop offset="100%" stopColor="#991b1b" />
          </radialGradient>

          {/* Outer Violet Sphere Gradient */}
          <radialGradient id={`${uid}-outer-violet`} cx="45%" cy="22%" r="78%">
            <stop offset="0%" stopColor="#cc85ff" />
            <stop offset="45%" stopColor="#a64dff" />
            <stop offset="85%" stopColor="#7b1fa2" />
            <stop offset="100%" stopColor="#581c87" />
          </radialGradient>

          {/* Inner White-to-Mint Face Gradient */}
          <linearGradient id={`${uid}-inner-green`} x1="20%" y1="15%" x2="85%" y2="85%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#f2fbf6" />
            <stop offset="100%" stopColor="#bcebd2" />
          </linearGradient>

          {/* Inner White-to-Rose Face Gradient */}
          <linearGradient id={`${uid}-inner-red`} x1="20%" y1="15%" x2="85%" y2="85%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#fff2f2" />
            <stop offset="100%" stopColor="#f9c2c2" />
          </linearGradient>

          {/* Inner White-to-Lavender Face Gradient */}
          <linearGradient id={`${uid}-inner-violet`} x1="20%" y1="15%" x2="85%" y2="85%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#f6edff" />
            <stop offset="100%" stopColor="#dec0ff" />
          </linearGradient>
        </defs>

        <g clipPath={`url(#${uid}-sphere)`}>
          {isSplit ? (
            <>
              <g clipPath={`url(#${uid}-tl)`}>
                {renderBallHalf(num === 0 ? 'red' : 'green')}
              </g>
              <g clipPath={`url(#${uid}-br)`}>
                {renderBallHalf('violet')}
              </g>
            </>
          ) : (
            renderBallHalf(isGreen ? 'green' : 'red')
          )}
        </g>
      </svg>
    </button>
  );
};
