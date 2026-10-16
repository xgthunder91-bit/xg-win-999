import React from 'react';
import { WATER_SEGMENTS, EARTH_SEGMENTS, FIRE_SEGMENTS } from '../game/rules.ts';
import type { RollOutcome } from '../game/types.ts';
import { VortexCenterReel } from './VortexCenterReel.tsx';

interface VortexWheelProps {
  waterStep: number;
  earthStep: number;
  fireStep: number;
  isSpinning: boolean;
  outcome: RollOutcome | null;
  isBust: boolean;
  onOpenBonusInfo?: () => void;
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeAnnularSector(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startAngle: number,
  endAngle: number
) {
  const p1 = polarToCartesian(cx, cy, rOuter, startAngle);
  const p2 = polarToCartesian(cx, cy, rOuter, endAngle);
  const p3 = polarToCartesian(cx, cy, rInner, endAngle);
  const p4 = polarToCartesian(cx, cy, rInner, startAngle);

  const angleDiff = (endAngle - startAngle + 360) % 360;
  const largeArcFlag = angleDiff > 180 ? 1 : 0;

  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ');
}

export const VortexWheel: React.FC<VortexWheelProps> = ({
  waterStep,
  earthStep,
  fireStep,
  isSpinning,
  outcome,
  isBust,
  onOpenBonusInfo,
}) => {
  const size = 370;
  const cx = size / 2;
  const cy = size / 2;

  // Exact radii corresponding to wheel_bg.png's 3 tiers
  const rCore = 56;
  const rWaterIn = 60;
  const rWaterOut = 95;
  const rEarthIn = 98;
  const rEarthOut = 132;
  const rFireIn = 135;
  const rFireOut = 170;

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      {/* 1. Official 3D Stepped Metallic Wheel Texture */}
      <img
        src="/assets/wheel_bg.png"
        alt="Vortex Multiplier Wheel"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-[0_15px_35px_rgba(0,0,0,0.9)]"
      />

      {/* 2. Interactive SVG Overlay for Illuminated Segments & Multiplier Labels */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 pointer-events-none"
      >
        <defs>
          {/* Intense Neon Glow Filters */}
          <filter id="glow-water" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-earth" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-fire" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradients */}
          <linearGradient id="fire-active-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DC2626" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#EF4444" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#F87171" stopOpacity="0.9" />
          </linearGradient>

          <linearGradient id="earth-active-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#10B981" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#34D399" stopOpacity="0.9" />
          </linearGradient>

          <linearGradient id="water-active-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284C7" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#0EA5E9" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* OUTER RING (FIRE TRACK) */}
        {FIRE_SEGMENTS.map((seg) => {
          const isLit = fireStep >= seg.stepIndex;
          const pathD = describeAnnularSector(cx, cy, rFireIn, rFireOut, seg.arcStartDeg, seg.arcEndDeg);
          const midR = (rFireIn + rFireOut) / 2;
          const textPos = polarToCartesian(cx, cy, midR, seg.angleDeg);

          return (
            <g key={seg.id} className="transition-all duration-300">
              {isLit && (
                <path
                  d={pathD}
                  fill="url(#fire-active-grad)"
                  stroke="#FCA5A5"
                  strokeWidth="2.5"
                  filter="url(#glow-fire)"
                  className="opacity-95"
                />
              )}
              {/* Radial separator tick */}
              {(() => {
                const tickStart = polarToCartesian(cx, cy, rFireIn + 3, seg.arcStartDeg);
                const tickEnd = polarToCartesian(cx, cy, rFireOut - 3, seg.arcStartDeg);
                return (
                  <line
                    x1={tickStart.x}
                    y1={tickStart.y}
                    x2={tickEnd.x}
                    y2={tickEnd.y}
                    stroke="#1E293B"
                    strokeWidth="1.5"
                    opacity="0.7"
                  />
                );
              })()}
              <text
                x={textPos.x}
                y={textPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isLit ? '#FFFFFF' : '#8E99A8'}
                fontSize="11"
                fontWeight="900"
                fontFamily="system-ui, -apple-system, sans-serif"
                className="select-none tracking-tight font-black"
                filter={isLit ? 'drop-shadow(0px 0px 5px rgba(239,68,68,0.9))' : 'drop-shadow(0 1px 1px #000)'}
              >
                {seg.label}
              </text>
            </g>
          );
        })}

        {/* MIDDLE RING (EARTH TRACK) */}
        {EARTH_SEGMENTS.map((seg) => {
          const isLit = earthStep >= seg.stepIndex;
          const pathD = describeAnnularSector(cx, cy, rEarthIn, rEarthOut, seg.arcStartDeg, seg.arcEndDeg);
          const midR = (rEarthIn + rEarthOut) / 2;
          const textPos = polarToCartesian(cx, cy, midR, seg.angleDeg);

          return (
            <g key={seg.id} className="transition-all duration-300">
              {isLit && (
                <path
                  d={pathD}
                  fill="url(#earth-active-grad)"
                  stroke="#6EE7B7"
                  strokeWidth="2.5"
                  filter="url(#glow-earth)"
                  className="opacity-95"
                />
              )}
              {(() => {
                const tickStart = polarToCartesian(cx, cy, rEarthIn + 3, seg.arcStartDeg);
                const tickEnd = polarToCartesian(cx, cy, rEarthOut - 3, seg.arcStartDeg);
                return (
                  <line
                    x1={tickStart.x}
                    y1={tickStart.y}
                    x2={tickEnd.x}
                    y2={tickEnd.y}
                    stroke="#1E293B"
                    strokeWidth="1.5"
                    opacity="0.7"
                  />
                );
              })()}
              <text
                x={textPos.x}
                y={textPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isLit ? '#FFFFFF' : '#8E99A8'}
                fontSize="10.5"
                fontWeight="900"
                fontFamily="system-ui, -apple-system, sans-serif"
                className="select-none tracking-tight font-black"
                filter={isLit ? 'drop-shadow(0px 0px 5px rgba(16,185,129,0.9))' : 'drop-shadow(0 1px 1px #000)'}
              >
                {seg.label}
              </text>
            </g>
          );
        })}

        {/* INNER RING (WATER TRACK) */}
        {WATER_SEGMENTS.map((seg) => {
          const isLit = waterStep >= seg.stepIndex;
          const pathD = describeAnnularSector(cx, cy, rWaterIn, rWaterOut, seg.arcStartDeg, seg.arcEndDeg);
          const midR = (rWaterIn + rWaterOut) / 2;
          const textPos = polarToCartesian(cx, cy, midR, seg.angleDeg);

          return (
            <g key={seg.id} className="transition-all duration-300">
              {isLit && (
                <path
                  d={pathD}
                  fill="url(#water-active-grad)"
                  stroke="#7DD3FC"
                  strokeWidth="2.5"
                  filter="url(#glow-water)"
                  className="opacity-95"
                />
              )}
              {(() => {
                const tickStart = polarToCartesian(cx, cy, rWaterIn + 3, seg.arcStartDeg);
                const tickEnd = polarToCartesian(cx, cy, rWaterOut - 3, seg.arcStartDeg);
                return (
                  <line
                    x1={tickStart.x}
                    y1={tickStart.y}
                    x2={tickEnd.x}
                    y2={tickEnd.y}
                    stroke="#1E293B"
                    strokeWidth="1.5"
                    opacity="0.7"
                  />
                );
              })()}
              <text
                x={textPos.x}
                y={textPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isLit ? '#FFFFFF' : '#8E99A8'}
                fontSize="10.5"
                fontWeight="900"
                fontFamily="system-ui, -apple-system, sans-serif"
                className="select-none tracking-tight font-black"
                filter={isLit ? 'drop-shadow(0px 0px 5px rgba(6,182,212,0.9))' : 'drop-shadow(0 1px 1px #000)'}
              >
                {seg.label}
              </text>
            </g>
          );
        })}

        {/* 3 Top Stacked 3D Elemental Badges at 12 o'clock */}
        {/* Fire Orb (Outer tier) */}
        {(() => {
          const pos = polarToCartesian(cx, cy, (rFireIn + rFireOut) / 2, 357);
          return (
            <g transform={`translate(${pos.x - 9}, ${pos.y - 9}) scale(0.75)`}>
              <circle cx="12" cy="12" r="11" fill={fireStep >= 1 ? '#EF4444' : '#141A26'} stroke="#EF4444" strokeWidth="2" filter="drop-shadow(0 0 4px #EF4444)" />
              <path d="M12 4 C14 8 18 11 18 15 C18 19 14.5 21 11.5 21 C8.5 21 6 18.5 6 15 C6 12 9 8 10 6 C10.5 8 11 9 12 9 C12.5 7 12 5 12 4 Z" fill="#FDE047" />
            </g>
          );
        })()}

        {/* Earth Orb (Middle tier) */}
        {(() => {
          const pos = polarToCartesian(cx, cy, (rEarthIn + rEarthOut) / 2, 357);
          return (
            <g transform={`translate(${pos.x - 9}, ${pos.y - 9}) scale(0.75)`}>
              <circle cx="12" cy="12" r="11" fill={earthStep >= 1 ? '#10B981' : '#141A26'} stroke="#10B981" strokeWidth="2" filter="drop-shadow(0 0 4px #10B981)" />
              <polygon points="12,5 14,9 19,9 15,12 17,17 12,14 7,17 9,12 5,9 10,9" fill="#6EE7B7" />
            </g>
          );
        })()}

        {/* Water Orb (Inner tier, top) */}
        {(() => {
          const pos = polarToCartesian(cx, cy, (rWaterIn + rWaterOut) / 2, 357);
          return (
            <g transform={`translate(${pos.x - 9}, ${pos.y - 9}) scale(0.75)`}>
              <circle cx="12" cy="12" r="11" fill={waterStep >= 1 ? '#0EA5E9' : '#141A26'} stroke="#38BDF8" strokeWidth="2" filter="drop-shadow(0 0 4px #38BDF8)" />
              <path d="M12 5 C12 5 7 12 7 15 C7 18 9 20 12 20 C15 20 17 18 17 15 C17 12 12 5 12 5 Z" fill="#BAE6FD" />
            </g>
          );
        })()}

        {/* Second Water Orb at 5:30 on the Inner Ring (matches real game!) */}
        {(() => {
          const pos = polarToCartesian(cx, cy, (rWaterIn + rWaterOut) / 2, 165);
          return (
            <g transform={`translate(${pos.x - 9}, ${pos.y - 9}) scale(0.75)`}>
              <circle cx="12" cy="12" r="11" fill={waterStep >= 2 ? '#0EA5E9' : '#141A26'} stroke="#38BDF8" strokeWidth="2" filter="drop-shadow(0 0 4px #38BDF8)" />
              <path d="M12 5 C12 5 7 12 7 15 C7 18 9 20 12 20 C15 20 17 18 17 15 C17 12 12 5 12 5 Z" fill="#BAE6FD" />
            </g>
          );
        })()}
      </svg>

      {/* 3. Center Dish Reel with 3D Physics */}
      <div className="relative z-10 flex items-center justify-center">
        <VortexCenterReel
          isSpinning={isSpinning}
          outcome={outcome}
          isBust={isBust}
          size={rCore * 2}
        />
      </div>
    </div>
  );
};
