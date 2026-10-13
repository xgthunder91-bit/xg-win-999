import React from 'react';

export const CasinoBall: React.FC<{
  num: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}> = ({ num, size = 'md', onClick }) => {
  const isGreen = [1, 3, 5, 7, 9].includes(num);
  const isSplit = num === 0 || num === 5;

  const dims =
    size === 'xs'
      ? 'w-6 h-6'
      : size === 'sm'
        ? 'w-8 h-8'
        : size === 'lg'
          ? 'w-20 h-20'
          : 'w-12 h-12';

  const uid = `b-${num}-${size}`;

  const renderBallHalf = (theme: 'green' | 'red' | 'violet') => {
    const outerGrad =
      theme === 'green'
        ? `url(#${uid}-outer-green)`
        : theme === 'red'
          ? `url(#${uid}-outer-red)`
          : `url(#${uid}-outer-violet)`;

    const rimColor =
      theme === 'green' ? '#179b52' : theme === 'red' ? '#d92b2b' : '#8c2df0';

    const innerGrad =
      theme === 'green'
        ? `url(#${uid}-inner-green)`
        : theme === 'red'
          ? `url(#${uid}-inner-red)`
          : `url(#${uid}-inner-violet)`;

    const textColor =
      theme === 'green' ? '#1d9a58' : theme === 'red' ? '#df3636' : '#8e31ea';

    const bottomSpotColor =
      theme === 'green' ? '#7ce8b0' : theme === 'red' ? '#ff9e9e' : '#d89eff';

    const arcHighlightColor =
      theme === 'green' ? '#68e3a3' : theme === 'red' ? '#ff8f8f' : '#d694ff';

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
        <path d="M 24 81 Q 50 93 76 81 Q 50 88 24 81 Z" fill={arcHighlightColor} opacity="0.7" />

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
          <clipPath id={`${uid}-sphere`}>
            <circle cx="50" cy="50" r="48" />
          </clipPath>
          <clipPath id={`${uid}-tl`}>
            <polygon points="0,0 100,0 0,100" />
          </clipPath>
          <clipPath id={`${uid}-br`}>
            <polygon points="100,0 100,100 0,100" />
          </clipPath>

          <radialGradient id={`${uid}-outer-green`} cx="45%" cy="22%" r="78%">
            <stop offset="0%" stopColor="#6cf0a9" />
            <stop offset="45%" stopColor="#25b869" />
            <stop offset="85%" stopColor="#148045" />
            <stop offset="100%" stopColor="#0f6937" />
          </radialGradient>

          <radialGradient id={`${uid}-outer-red`} cx="45%" cy="22%" r="78%">
            <stop offset="0%" stopColor="#ff8585" />
            <stop offset="45%" stopColor="#f44343" />
            <stop offset="85%" stopColor="#c81e1e" />
            <stop offset="100%" stopColor="#991b1b" />
          </radialGradient>

          <radialGradient id={`${uid}-outer-violet`} cx="45%" cy="22%" r="78%">
            <stop offset="0%" stopColor="#cc85ff" />
            <stop offset="45%" stopColor="#a64dff" />
            <stop offset="85%" stopColor="#7b1fa2" />
            <stop offset="100%" stopColor="#581c87" />
          </radialGradient>

          <linearGradient id={`${uid}-inner-green`} x1="20%" y1="15%" x2="85%" y2="85%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#f2fbf6" />
            <stop offset="100%" stopColor="#bcebd2" />
          </linearGradient>

          <linearGradient id={`${uid}-inner-red`} x1="20%" y1="15%" x2="85%" y2="85%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#fff2f2" />
            <stop offset="100%" stopColor="#f9c2c2" />
          </linearGradient>

          <linearGradient id={`${uid}-inner-violet`} x1="20%" y1="15%" x2="85%" y2="85%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#f6edff" />
            <stop offset="100%" stopColor="#dec0ff" />
          </linearGradient>
        </defs>

        <g clipPath={`url(#${uid}-sphere)`}>
          {isSplit ? (
            <>
              <g clipPath={`url(#${uid}-tl)`}>{renderBallHalf(num === 0 ? 'red' : 'green')}</g>
              <g clipPath={`url(#${uid}-br)`}>{renderBallHalf('violet')}</g>
            </>
          ) : (
            renderBallHalf(isGreen ? 'green' : 'red')
          )}
        </g>
      </svg>
    </button>
  );
};
