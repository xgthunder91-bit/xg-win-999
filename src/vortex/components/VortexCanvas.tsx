import React, { useEffect, useRef } from 'react';
import type { RollOutcome } from '../game/types.ts';

interface VortexCanvasProps {
  isSpinning: boolean;
  outcome: RollOutcome | null;
  isBust: boolean;
  size?: number;
}

export const VortexCanvas: React.FC<VortexCanvasProps> = ({
  isSpinning,
  outcome,
  isBust,
  size = 130,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    const particles: Array<{
      radius: number;
      angle: number;
      speed: number;
      size: number;
      color: string;
      alpha: number;
    }> = [];

    // Initialize 45 spiral vortex particles
    for (let i = 0; i < 45; i++) {
      particles.push({
        radius: Math.random() * (size / 2 - 8) + 6,
        angle: Math.random() * Math.PI * 2,
        speed: (Math.random() * 0.04 + 0.02) * (Math.random() > 0.5 ? 1 : 1),
        size: Math.random() * 2.5 + 1.2,
        color: i % 3 === 0 ? '#10B981' : i % 3 === 1 ? '#06B6D4' : '#8B5CF6',
        alpha: Math.random() * 0.7 + 0.3,
      });
    }

    let running = true;

    const render = () => {
      if (!running) return;

      const center = size / 2;
      ctx.clearRect(0, 0, size, size);

      // Deep dark void background
      ctx.beginPath();
      ctx.arc(center, center, center - 2, 0, Math.PI * 2);
      const bgGrad = ctx.createRadialGradient(center, center, 5, center, center, center);
      bgGrad.addColorStop(0, '#060910');
      bgGrad.addColorStop(0.7, '#0b101c');
      bgGrad.addColorStop(1, '#151d2e');
      ctx.fillStyle = bgGrad;
      ctx.fill();

      // Outer metallic rim
      ctx.lineWidth = 3;
      ctx.strokeStyle = isBust
        ? 'rgba(239, 68, 68, 0.7)'
        : isSpinning
        ? 'rgba(16, 185, 129, 0.8)'
        : 'rgba(56, 189, 248, 0.3)';
      ctx.stroke();

      if (isSpinning) {
        // High speed swirling energetic particles
        angle += 0.12;

        // Spiral arms
        for (let arm = 0; arm < 3; arm++) {
          ctx.save();
          ctx.translate(center, center);
          ctx.rotate(angle + (arm * Math.PI * 2) / 3);

          const armGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, center - 6);
          armGrad.addColorStop(0, 'rgba(52, 211, 153, 0.8)');
          armGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.4)');
          armGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

          ctx.beginPath();
          ctx.arc(0, 0, center - 12, 0, Math.PI / 1.8);
          ctx.lineWidth = 8;
          ctx.strokeStyle = armGrad;
          ctx.stroke();
          ctx.restore();
        }

        // Swirling particles
        particles.forEach((p) => {
          p.angle += p.speed * 4;
          p.radius -= 0.35;
          if (p.radius < 4) {
            p.radius = size / 2 - 10;
            p.angle = Math.random() * Math.PI * 2;
          }

          const px = center + Math.cos(p.angle) * p.radius;
          const py = center + Math.sin(p.angle) * p.radius;

          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fill();
        });
        ctx.globalAlpha = 1.0;
      } else {
        // Subtle ambient idle particles
        angle += 0.015;
        particles.slice(0, 15).forEach((p) => {
          p.angle += p.speed * 0.5;
          const px = center + Math.cos(p.angle + angle) * (p.radius * 0.7);
          const py = center + Math.sin(p.angle + angle) * (p.radius * 0.7);

          ctx.beginPath();
          ctx.arc(px, py, p.size * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.fill();
        });
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isSpinning, isBust, size]);

  return (
    <div
      className={`relative rounded-full flex items-center justify-center select-none ${
        isBust ? 'animate-shake' : ''
      }`}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="absolute inset-0 rounded-full"
      />

      {/* Render Rolled Symbol when not spinning */}
      {!isSpinning && outcome && (
        <div className="relative z-10 flex items-center justify-center animate-fade-in transition-transform">
          {outcome === 'water' && (
            <div className="flex flex-col items-center justify-center text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]">
              <svg viewBox="0 0 48 48" className="w-16 h-16 fill-current">
                {/* Stylized elemental water droplet with swirl */}
                <path d="M24 4 C24 4 10 20 10 30 C10 37.7 16.3 44 24 44 C31.7 44 38 37.7 38 30 C38 20 24 4 24 4 Z" fill="url(#water-grad)" />
                <path d="M22 18 C20 24 16 28 16 32 C16 36.4 19.6 40 24 40 C28.4 40 32 36.4 32 32 C32 26 28 22 28 22" fill="none" stroke="#fff" strokeWidth="2.5" opacity="0.6" strokeLinecap="round" />
                <defs>
                  <linearGradient id="water-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#0284C7" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}

          {outcome === 'earth' && (
            <div className="flex flex-col items-center justify-center text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]">
              <svg viewBox="0 0 48 48" className="w-16 h-16">
                <circle cx="24" cy="24" r="18" fill="url(#earth-grad)" />
                <path d="M24 10 C16 16 16 30 24 38 C32 30 32 16 24 10 Z" fill="#34D399" opacity="0.8" />
                <path d="M24 10 L24 38 M18 20 Q24 24 30 20 M18 28 Q24 32 30 28" stroke="#064E3B" strokeWidth="2" strokeLinecap="round" />
                <defs>
                  <linearGradient id="earth-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}

          {outcome === 'fire' && (
            <div className="flex flex-col items-center justify-center text-rose-500 drop-shadow-[0_0_14px_rgba(239,68,68,0.9)]">
              <svg viewBox="0 0 48 48" className="w-16 h-16">
                <path d="M24 4 C27 12 36 18 36 28 C36 36.8 29.8 44 22 44 C15.4 44 10 38.6 10 32 C10 24 18 16 20 12 C21 16 22 18 25 18 C26 14 24 10 24 4 Z" fill="url(#fire-grad)" />
                <path d="M22 24 C24 28 30 30 28 36 C27 39 24 40 22 40 C19 40 17 38 17 35 C17 30 21 27 22 24 Z" fill="#FDE047" opacity="0.9" />
                <defs>
                  <linearGradient id="fire-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#F97316" />
                    <stop offset="50%" stopColor="#EF4444" />
                    <stop offset="100%" stopColor="#B91C1C" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}

          {outcome === 'cloud' && (
            <div className="flex flex-col items-center justify-center text-slate-400 drop-shadow-[0_0_8px_rgba(148,163,184,0.5)]">
              <svg viewBox="0 0 48 48" className="w-16 h-16 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 32 C8 32 6 28 8 24 C8 20 12 18 15 19 C17 13 25 11 30 16 C34 14 40 18 39 23 C42 25 42 30 39 32 C36 34 14 34 12 32 Z" fill="#334155" opacity="0.8" />
                <path d="M16 26 C20 22 28 22 32 26" stroke="#94A3B8" opacity="0.6" />
              </svg>
            </div>
          )}

          {outcome === 'skull' && (
            <div className="flex flex-col items-center justify-center text-amber-200/90 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]">
              <svg viewBox="0 0 48 48" className="w-16 h-16">
                {/* Golden Skull as in video 00:16 */}
                <path d="M12 20 C12 11 17 6 24 6 C31 6 36 11 36 20 C36 27 33 30 31 34 L31 39 C31 40 30 41 29 41 L19 41 C18 41 17 40 17 39 L17 34 C15 30 12 27 12 20 Z" fill="url(#skull-grad)" />
                {/* Eyes */}
                <ellipse cx="19" cy="22" rx="3.5" ry="4.5" fill="#111827" />
                <ellipse cx="29" cy="22" rx="3.5" ry="4.5" fill="#111827" />
                {/* Nose hole */}
                <polygon points="24,28 22.5,32 25.5,32" fill="#111827" />
                {/* Teeth slots */}
                <line x1="20" y1="36" x2="20" y2="40" stroke="#111827" strokeWidth="1.5" />
                <line x1="24" y1="36" x2="24" y2="40" stroke="#111827" strokeWidth="1.5" />
                <line x1="28" y1="36" x2="28" y2="40" stroke="#111827" strokeWidth="1.5" />
                <defs>
                  <linearGradient id="skull-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FEF08A" />
                    <stop offset="50%" stopColor="#D97706" />
                    <stop offset="100%" stopColor="#78350F" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}

          {outcome === 'bonus' && (
            <div className="flex flex-col items-center justify-center text-purple-400 drop-shadow-[0_0_14px_rgba(168,85,247,0.9)]">
              <svg viewBox="0 0 48 48" className="w-16 h-16 fill-none stroke-current" strokeWidth="3">
                <polygon points="24,4 30,16 44,18 34,28 36,42 24,35 12,42 14,28 4,18 18,16" fill="url(#star-grad)" stroke="#C084FC" />
                <defs>
                  <linearGradient id="star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E9D5FF" />
                    <stop offset="100%" stopColor="#9333EA" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Initial state default symbol if no outcome yet */}
      {!isSpinning && !outcome && (
        <div className="relative z-10 flex flex-col items-center justify-center text-cyan-400/80 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
          <svg viewBox="0 0 48 48" className="w-14 h-14 fill-current">
            <path d="M24 4 C24 4 10 20 10 30 C10 37.7 16.3 44 24 44 C31.7 44 38 37.7 38 30 C38 20 24 4 24 4 Z" fill="url(#init-water-grad)" />
            <path d="M22 18 C20 24 16 28 16 32 C16 36.4 19.6 40 24 40 C28.4 40 32 36.4 32 32 C32 26 28 22 28 22" fill="none" stroke="#fff" strokeWidth="2.5" opacity="0.6" strokeLinecap="round" />
            <defs>
              <linearGradient id="init-water-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}
    </div>
  );
};
