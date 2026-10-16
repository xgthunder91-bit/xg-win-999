import React, { useEffect, useState } from 'react';
import type { RollOutcome } from '../game/types.ts';
import {
  WaterSymbol3D,
  FireSymbol3D,
  EarthSymbol3D,
  WindSymbol3D,
  SkullSymbol3D,
} from './Symbols3D.tsx';

interface VortexCenterReelProps {
  isSpinning: boolean;
  outcome: RollOutcome | null;
  isBust: boolean;
  size?: number;
}

export const VortexCenterReel: React.FC<VortexCenterReelProps> = ({
  isSpinning,
  outcome,
  isBust,
  size = 112,
}) => {
  const [blurIndex, setBlurIndex] = useState(0);

  // Fast vertical reel cycle while spinning
  useEffect(() => {
    if (!isSpinning) return;
    const interval = setInterval(() => {
      setBlurIndex((prev) => (prev + 1) % 5);
    }, 60);
    return () => clearInterval(interval);
  }, [isSpinning]);

  const blurImages = [
    '/assets/sym_water_blur.png',
    '/assets/sym_nature_blur.png',
    '/assets/sym_fire_blur.png',
    '/assets/sym_wind_blur.png',
    '/assets/sym_skull_blur.png',
  ];

  return (
    <div
      className={`relative rounded-full flex items-center justify-center select-none overflow-hidden ${
        isBust ? 'animate-shake' : ''
      }`}
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle, #0e1522 0%, #070b13 70%, #04060a 100%)',
        boxShadow: isBust
          ? 'inset 0 0 15px rgba(239, 68, 68, 0.8), 0 0 12px rgba(239, 68, 68, 0.6)'
          : 'inset 0 0 18px rgba(0, 0, 0, 0.95), 0 0 8px rgba(30, 41, 59, 0.5)',
        border: isBust ? '2px solid rgba(239, 68, 68, 0.9)' : '2px solid #1e293b',
      }}
    >
      {/* Background Rotating Vortex Swirl */}
      <img
        src="/assets/bg_vortex.png"
        alt="Vortex Swirl"
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${
          isSpinning ? 'opacity-40 animate-spin' : 'opacity-10'
        }`}
        style={{
          animationDuration: isSpinning ? '0.4s' : '15s',
          mixBlendMode: 'screen',
        }}
      />

      {/* When Spinning: Vertical Reel Motion Blur */}
      {isSpinning && (
        <div className="relative z-10 flex flex-col items-center justify-center animate-pulse">
          <img
            src={blurImages[blurIndex]}
            alt="Spinning Reel"
            className="w-16 h-16 object-contain filter drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]"
          />
        </div>
      )}

      {/* When Stopped: Render Active Landed Symbol with 3D Depth */}
      {!isSpinning && (
        <div className="relative z-10 flex items-center justify-center animate-pop-in">
          {outcome === 'skull' && <SkullSymbol3D size={58} />}
          {outcome === 'cloud' && <WindSymbol3D size={58} />}
          {outcome === 'water' && <WaterSymbol3D size={58} />}
          {outcome === 'fire' && <FireSymbol3D size={58} />}
          {outcome === 'earth' && <EarthSymbol3D size={58} />}
          {outcome === 'bonus' && <FireSymbol3D size={58} />}

          {/* Default initial idle symbol (Wind symbol as in real loaded screenshot) */}
          {!outcome && <WindSymbol3D size={58} />}
        </div>
      )}
    </div>
  );
};
