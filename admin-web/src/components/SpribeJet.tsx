/**
 * The exact Spribe red propeller jet used by the game (AviatorGame.tsx), lifted
 * out so the admin console can fly the identical aircraft. Origin (0,0) sits at
 * the bottom-tail contact point on the curve.
 */
export function SpribeJet({
  x,
  y,
  scale = 1,
  tilt = -13,
  propFlip = false,
}: {
  x: number;
  y: number;
  scale?: number;
  tilt?: number;
  propFlip?: boolean;
}) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${tilt}) scale(${scale})`}>
      {/* Soft red engine glow beneath jet */}
      <ellipse cx="32" cy="-6" rx="26" ry="9" fill="#e11d48" opacity="0.22" />

      {/* Swept Vertical Tail Fin (Rear Left) */}
      <path d="M 0 -2 L -4 -20 L 6 -20 L 14 -6 Z" fill="#e11d48" />
      {/* Tail Fin Dark Racing Cutout */}
      <path d="M -1 -17 L 4 -17 L 8 -9 L 2 -9 Z" fill="#0b0c0d" />
      {/* Horizontal Tailplane */}
      <path d="M -3 -3 L 10 -5 L 12 -1 L -1 0 Z" fill="#be123c" />

      {/* Main Aerobatic Fuselage Body */}
      <path
        d="M 2 -2 L 14 -11 L 28 -13 L 36 -17 L 58 -15 L 66 -11 L 64 -4 L 46 -2 L 16 -1 Z"
        fill="#e11d48"
      />

      {/* Dark Open Cockpit Canopy Silhouette & Rear Racing Stripe Cutout */}
      <path d="M 25 -12 C 28 -16, 36 -16, 40 -12 L 24 -10 Z" fill="#0b0c0d" />
      <path d="M 9 -6 L 26 -9 L 25 -6 L 8 -4 Z" fill="#0b0c0d" />
      <path d="M 42 -11 L 57 -11 L 55 -8 L 41 -8 Z" fill="#0b0c0d" />

      {/* Forward-Swept Low Wing with Iconic 'X' Racing Cutout */}
      <path d="M 22 -5 L 48 -7 L 54 1 L 30 2 Z" fill="#f43f5e" />
      <path d="M 24 -4 L 46 -6 L 51 0 L 29 1 Z" fill="#e11d48" />
      {/* Iconic Dark 'X' Mark on Wing */}
      <path
        d="M 35 -4 L 41 0 M 41 -4 L 35 0"
        stroke="#0b0c0d"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Pointed Red Nose Cone Spinner */}
      <path d="M 65 -11 L 72 -8 L 65 -5 Z" fill="#ff1e42" />

      {/* High-Speed Spinning Front Propeller Blades */}
      <g transform="translate(68, -8)">
        <line
          x1="2"
          y1="-14"
          x2="-2"
          y2="14"
          stroke="#ff1e42"
          strokeWidth={propFlip ? '2.4' : '1.5'}
          strokeLinecap="round"
        />
        <line
          x1="0"
          y1="-11"
          x2="0"
          y2="11"
          stroke="#fb7185"
          strokeWidth={propFlip ? '1.2' : '2.4'}
          strokeLinecap="round"
          opacity={propFlip ? '0.65' : '0.95'}
        />
        <circle cx="0" cy="0" r="2" fill="#ffe4e6" />
      </g>
    </g>
  );
}
