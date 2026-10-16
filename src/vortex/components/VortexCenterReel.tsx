import React, { useEffect, useRef } from 'react';
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
  size = 114,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  // Intense Emerald Green Swirling Cyclone Animation while spinning (matching 00:15 / 00:19 of video!)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rot = 0;
    const particles: Array<{
      radius: number;
      angle: number;
      speed: number;
      size: number;
      alpha: number;
      color: string;
    }> = [];

    for (let i = 0; i < 35; i++) {
      particles.push({
        radius: Math.random() * (size / 2 - 6) + 4,
        angle: Math.random() * Math.PI * 2,
        speed: (Math.random() * 0.08 + 0.04) * (Math.random() > 0.5 ? 1 : -1),
        size: Math.random() * 3 + 1.5,
        alpha: Math.random() * 0.8 + 0.2,
        color: i % 2 === 0 ? '#10B981' : '#34D399',
      });
    }

    let active = true;

    const render = () => {
      if (!active) return;
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;

      if (isSpinning) {
        rot += 0.2;

        // Bright Green Cyclone Core
        const radGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, cx - 4);
        radGrad.addColorStop(0, 'rgba(52, 211, 153, 0.95)');
        radGrad.addColorStop(0.35, 'rgba(16, 185, 129, 0.85)');
        radGrad.addColorStop(0.7, 'rgba(5, 150, 105, 0.4)');
        radGrad.addColorStop(1, 'rgba(6, 78, 59, 0)');

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, cx - 6, 0, Math.PI * 2);
        ctx.fill();

        // 3 Energetic Cyclone Spiral Arms
        for (let i = 0; i < 3; i++) {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(rot + (i * Math.PI * 2) / 3);

          ctx.beginPath();
          ctx.arc(0, 0, cx - 10, 0, Math.PI / 1.5);
          ctx.lineWidth = 10;
          ctx.strokeStyle = 'rgba(110, 231, 183, 0.7)';
          ctx.lineCap = 'round';
          ctx.stroke();

          ctx.restore();
        }

        // Fast Inward-Spiraling Green Sparks
        particles.forEach((p) => {
          p.angle += p.speed * 3.5;
          p.radius -= 0.6;
          if (p.radius < 4) {
            p.radius = cx - 8;
            p.angle = Math.random() * Math.PI * 2;
          }

          const px = cx + Math.cos(p.angle) * p.radius;
          const py = cy + Math.sin(p.angle) * p.radius;

          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fill();
        });
        ctx.globalAlpha = 1.0;
      }

      animRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      active = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isSpinning, size]);

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
          ? 'inset 0 0 16px rgba(239, 68, 68, 0.9), 0 0 14px rgba(239, 68, 68, 0.7)'
          : isSpinning
          ? 'inset 0 0 20px rgba(16, 185, 129, 0.9), 0 0 18px rgba(16, 185, 129, 0.8)'
          : 'inset 0 0 18px rgba(0, 0, 0, 0.95), 0 0 10px rgba(6, 182, 212, 0.4)',
        border: isBust
          ? '2.5px solid rgba(239, 68, 68, 0.9)'
          : isSpinning
          ? '2.5px solid rgba(52, 211, 153, 0.95)'
          : '2px solid rgba(56, 189, 248, 0.6)',
      }}
    >
      {/* Background Rotating Vortex Swirl Texture */}
      <img
        src="/assets/bg_vortex.png"
        alt="Vortex"
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${
          isSpinning ? 'opacity-30 animate-spin' : 'opacity-10'
        }`}
        style={{ animationDuration: '0.5s', mixBlendMode: 'screen' }}
      />

      {/* When Spinning: Emerald Green Cyclone Canvas */}
      {isSpinning && (
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="absolute inset-0 z-10 pointer-events-none"
        />
      )}

      {/* When Stopped: Render Landed 3D Symbol matching real game */}
      {!isSpinning && (
        <div className="relative z-10 flex items-center justify-center animate-pop-in">
          {outcome === 'skull' && (
            <img
              src="/assets/sym_skull.png"
              alt="Skull Bust"
              className="w-16 h-16 object-contain drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]"
            />
          )}
          {outcome === 'water' && (
            <img
              src="/assets/sym_water.png"
              alt="Water Wave"
              className="w-16 h-16 object-contain drop-shadow-[0_0_14px_rgba(56,189,248,0.9)]"
            />
          )}
          {outcome === 'earth' && (
            <img
              src="/assets/sym_nature.png"
              alt="Earth Nature"
              className="w-16 h-16 object-contain drop-shadow-[0_0_14px_rgba(16,185,129,0.9)]"
            />
          )}
          {outcome === 'fire' && (
            <img
              src="/assets/sym_fire.png"
              alt="Fire Flame"
              className="w-16 h-16 object-contain drop-shadow-[0_0_14px_rgba(239,68,68,0.9)]"
            />
          )}
          {(outcome === 'cloud' || outcome === 'bonus') && (
            <img
              src="/assets/sym_wind.png"
              alt="Wind Swirl"
              className="w-16 h-16 object-contain drop-shadow-[0_0_10px_rgba(148,163,184,0.7)]"
            />
          )}
          {/* Default initial symbol from real game (00:00): Silver embossed Cloud Swirl */}
          {!outcome && (
            <img
              src="/assets/sym_wind.png"
              alt="Vortex Cloud"
              className="w-16 h-16 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] filter brightness-110"
            />
          )}
        </div>
      )}
    </div>
  );
};
