import React from 'react';

interface SymbolProps {
  className?: string;
  size?: number;
}

/**
 * High-Fidelity 3D Water Droplet matching the video:
 * Glossy cyan/blue drop with specular highlight, inner glow, and 3 small ambient droplets.
 */
export const WaterSymbol3D: React.FC<SymbolProps> = ({ className = '', size = 64 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className={`drop-shadow-[0_0_16px_rgba(6,182,212,0.8)] ${className}`}
  >
    <defs>
      <linearGradient id="water-outer" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="45%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#0369A1" />
      </linearGradient>

      <radialGradient id="water-inner-glow" cx="50%" cy="65%" r="45%">
        <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.95" />
        <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
      </radialGradient>

      <linearGradient id="water-highlight" x1="20%" y1="0%" x2="60%" y2="80%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
    </defs>

    {/* Main Droplet Body */}
    <path
      d="M50 14 C50 14 22 46 22 66 C22 81.5 34.5 92 50 92 C65.5 92 78 81.5 78 66 C78 46 50 14 50 14 Z"
      fill="url(#water-outer)"
      stroke="#7DD3FC"
      strokeWidth="2.5"
    />

    {/* Inner Liquid Core Glow */}
    <path
      d="M50 24 C50 24 28 50 28 66 C28 78 37.8 86 50 86 C62.2 86 72 78 72 66 C72 50 50 24 50 24 Z"
      fill="url(#water-inner-glow)"
    />

    {/* Glossy Curved Highlight */}
    <path
      d="M48 24 C45 36 34 50 34 62 C34 72 40 78 46 80 C40 76 38 68 38 60 C38 50 46 36 48 24 Z"
      fill="url(#water-highlight)"
    />

    {/* Three floating ambient bubbles/droplets as seen in video */}
    <circle cx="82" cy="48" r="4" fill="#38BDF8" opacity="0.9" filter="drop-shadow(0 0 4px #38BDF8)" />
    <circle cx="20" cy="54" r="3.5" fill="#38BDF8" opacity="0.8" filter="drop-shadow(0 0 3px #38BDF8)" />
    <circle cx="76" cy="74" r="2.8" fill="#7DD3FC" opacity="0.85" />
  </svg>
);

/**
 * High-Fidelity 3D Fire Flame matching the video:
 * Multi-layer blazing flame with incandescent core and licking tongues of fire.
 */
export const FireSymbol3D: React.FC<SymbolProps> = ({ className = '', size = 64 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className={`drop-shadow-[0_0_18px_rgba(239,68,68,0.9)] ${className}`}
  >
    <defs>
      <linearGradient id="fire-outer" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#F97316" />
        <stop offset="40%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#991B1B" />
      </linearGradient>

      <linearGradient id="fire-inner" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="45%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#DC2626" />
      </linearGradient>

      <radialGradient id="fire-core" cx="50%" cy="75%" r="35%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="60%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#EA580C" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Outer Blazing Flame */}
    <path
      d="M50 8 C58 24 78 36 78 58 C78 74 65.5 88 50 88 C34.5 88 22 74 22 58 C22 42 36 28 42 20 C44 28 48 32 52 32 C54 26 50 16 50 8 Z"
      fill="url(#fire-outer)"
      stroke="#FCA5A5"
      strokeWidth="1.5"
    />

    {/* Middle Flame Tier */}
    <path
      d="M50 26 C55 36 68 46 68 62 C68 73 59.9 82 50 82 C40.1 82 32 73 32 62 C32 52 40 44 44 38 C46 42 48 45 52 45 C53 40 50 32 50 26 Z"
      fill="url(#fire-inner)"
    />

    {/* Bright Core Tongue */}
    <path
      d="M50 48 C53 54 58 60 58 68 C58 74 54.4 78 50 78 C45.6 78 42 74 42 68 C42 62 46 56 48 52 Z"
      fill="url(#fire-core)"
    />
  </svg>
);

/**
 * High-Fidelity 3D Earth / Nature Orb matching the video:
 * Emerald sphere with circular crystal swirl and nature energy.
 */
export const EarthSymbol3D: React.FC<SymbolProps> = ({ className = '', size = 64 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className={`drop-shadow-[0_0_16px_rgba(16,185,129,0.85)] ${className}`}
  >
    <defs>
      <radialGradient id="earth-orb" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#6EE7B7" />
        <stop offset="35%" stopColor="#10B981" />
        <stop offset="85%" stopColor="#047857" />
        <stop offset="100%" stopColor="#064E3B" />
      </radialGradient>

      <linearGradient id="earth-ring" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A7F3D0" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>

    {/* Base Sphere */}
    <circle cx="50" cy="50" r="38" fill="url(#earth-orb)" stroke="#34D399" strokeWidth="2" />

    {/* Internal Nature Swirls */}
    <path
      d="M50 22 C34 32 34 58 50 76 C66 58 66 32 50 22 Z"
      fill="none"
      stroke="url(#earth-ring)"
      strokeWidth="4"
      strokeLinecap="round"
      opacity="0.9"
    />
    <path
      d="M38 42 Q50 52 62 42"
      fill="none"
      stroke="#D1FAE5"
      strokeWidth="3.5"
      strokeLinecap="round"
      opacity="0.8"
    />
    <path
      d="M40 58 Q50 66 60 58"
      fill="none"
      stroke="#A7F3D0"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.75"
    />

    {/* Specular Glint */}
    <ellipse cx="38" cy="32" rx="7" ry="4" transform="rotate(-30 38 32)" fill="#FFFFFF" opacity="0.6" />
  </svg>
);

/**
 * High-Fidelity 3D Wind / Mist / Cyclone Symbol matching the video (00:20):
 * Metallic grey circular swirl with concentric aerodynamic spiral arms.
 */
export const WindSymbol3D: React.FC<SymbolProps> = ({ className = '', size = 64 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className={`drop-shadow-[0_0_12px_rgba(148,163,184,0.5)] ${className}`}
  >
    <defs>
      <linearGradient id="wind-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#CBD5E1" />
        <stop offset="50%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
    </defs>

    {/* Concentric Air Swirls */}
    <circle cx="50" cy="50" r="36" fill="#1E293B" stroke="#64748B" strokeWidth="2.5" />
    <path
      d="M50 26 C63 26 74 37 74 50 C74 58 68 64 61 64 C55 64 50 59 50 53 C50 49 53 45 57 45"
      fill="none"
      stroke="url(#wind-grad)"
      strokeWidth="5"
      strokeLinecap="round"
    />
    <path
      d="M36 62 C29 55 28 45 33 37 C37 31 44 28 50 31"
      fill="none"
      stroke="#94A3B8"
      strokeWidth="4"
      strokeLinecap="round"
      opacity="0.75"
    />
    <path
      d="M38 52 C38 60 44 68 53 70 C60 71 67 68 70 62"
      fill="none"
      stroke="#CBD5E1"
      strokeWidth="3.5"
      strokeLinecap="round"
      opacity="0.65"
    />
  </svg>
);

/**
 * High-Fidelity 3D Golden/Ivory Skull matching the video (00:16):
 * Realistic skull anatomy with bone texture, deep eye sockets, and gold/bronze luster.
 */
export const SkullSymbol3D: React.FC<SymbolProps> = ({ className = '', size = 64 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className={`drop-shadow-[0_0_16px_rgba(245,158,11,0.7)] ${className}`}
  >
    <defs>
      <linearGradient id="skull-bone" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="35%" stopColor="#EAB308" />
        <stop offset="85%" stopColor="#B45309" />
        <stop offset="100%" stopColor="#78350F" />
      </linearGradient>

      <radialGradient id="skull-highlight" cx="45%" cy="30%" r="40%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Cranium / Skull Outline */}
    <path
      d="M24 44 C24 24 35 14 50 14 C65 14 76 24 76 44 C76 56 70 64 66 70 L66 82 C66 84 64 86 62 86 L38 86 C36 86 34 84 34 82 L34 70 C30 64 24 56 24 44 Z"
      fill="url(#skull-bone)"
      stroke="#FDE047"
      strokeWidth="2"
    />

    {/* Cranium Highlight */}
    <ellipse cx="48" cy="28" rx="18" ry="10" fill="url(#skull-highlight)" />

    {/* Hollow Eye Sockets */}
    <ellipse cx="38" cy="48" rx="8" ry="10" fill="#0F172A" stroke="#451A03" strokeWidth="1.5" />
    <ellipse cx="62" cy="48" rx="8" ry="10" fill="#0F172A" stroke="#451A03" strokeWidth="1.5" />

    {/* Nasal Cavity (Inverted Heart) */}
    <path d="M50 58 L46 66 L54 66 Z" fill="#0F172A" />

    {/* Jaw / Teeth Vertical Separators */}
    <rect x="36" y="74" width="28" height="9" rx="2" fill="#451A03" opacity="0.6" />
    <line x1="42" y1="74" x2="42" y2="83" stroke="#FEF08A" strokeWidth="2" strokeLinecap="round" />
    <line x1="48" y1="74" x2="48" y2="83" stroke="#FEF08A" strokeWidth="2" strokeLinecap="round" />
    <line x1="54" y1="74" x2="54" y2="83" stroke="#FEF08A" strokeWidth="2" strokeLinecap="round" />
    <line x1="60" y1="74" x2="60" y2="83" stroke="#FEF08A" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
