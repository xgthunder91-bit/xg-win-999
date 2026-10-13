import React, { useState, useEffect } from 'react';
import { ChevronLeft, Lock } from 'lucide-react';

interface DepositWheelViewProps {
  balance: number;
  onBack: () => void;
  onOpenDeposit: () => void;
}

type WheelTier = 'silver' | 'gold' | 'diamond';

interface WheelSector {
  label: string;
  subLabel?: string;
  isDarkSector: boolean;
  iconType: 'coins3' | 'coin1' | 'cash' | 'miniWheel';
}

const LIVE_WIN_TICKER = [
  'Me**U4 win Silver Spins X1',
  'Me**U4 win ₹2.00',
  'Me**6L win ₹2.00',
  'Me**EL win ₹2.00',
  'Me**SQ win ₹2.00',
  'Me**6L win ₹2.00',
  'Me**FJ win ₹59.00',
  'Me**UL win Silver Spins X1',
  'Me**UL win ₹2.00',
];

const SILVER_SECTORS: WheelSector[] = [
  { label: '₹199', isDarkSector: true, iconType: 'coins3' },
  { label: '₹59,999', isDarkSector: false, iconType: 'coins3' },
  { label: '₹19,999', isDarkSector: true, iconType: 'coins3' },
  { label: '₹1,599', isDarkSector: false, iconType: 'coins3' },
  { label: '₹599', isDarkSector: true, iconType: 'coin1' },
  { label: '₹2', isDarkSector: false, iconType: 'coin1' },
  { label: '₹59', isDarkSector: true, iconType: 'coins3' },
  { label: 'Silver Spin', subLabel: 'X1', isDarkSector: false, iconType: 'miniWheel' },
];

const GOLD_SECTORS: WheelSector[] = [
  { label: '₹39', isDarkSector: true, iconType: 'cash' },
  { label: '₹15,999', isDarkSector: false, iconType: 'coins3' },
  { label: '₹6,999', isDarkSector: true, iconType: 'coins3' },
  { label: 'Gold Spin X1', isDarkSector: false, iconType: 'miniWheel' },
  { label: '₹999', isDarkSector: true, iconType: 'coins3' },
  { label: '₹109', isDarkSector: false, iconType: 'coin1' },
  { label: '₹99,999', isDarkSector: true, iconType: 'coins3' },
  { label: '₹19', isDarkSector: false, iconType: 'coin1' },
];

const DIAMOND_SECTORS: WheelSector[] = [
  { label: '₹59', isDarkSector: true, iconType: 'cash' },
  { label: '₹399,999', isDarkSector: false, iconType: 'coins3' },
  { label: '₹999', isDarkSector: true, iconType: 'coins3' },
  { label: 'Diamond', subLabel: 'Spin X1', isDarkSector: false, iconType: 'miniWheel' },
  { label: '₹299', isDarkSector: true, iconType: 'coin1' },
  { label: '₹59,999', isDarkSector: false, iconType: 'coins3' },
  { label: '₹19,999', isDarkSector: true, iconType: 'cash' },
  { label: '₹6,999', isDarkSector: false, iconType: 'cash' },
];

const TIER_CONFIG: Record<
  WheelTier,
  {
    promptAmount: string;
    milestones: { amount: string; spinText: string }[];
    fullPageBg: string;
    topGlowColor: string;
    promptTextColor: string;
    lineColor: string;
    trackBg: string;
    milestoneAmountColor: string;
    milestoneSpinColor: string;
    rimOuter: string;
    rimInner: string;
    rimBorder: string;
    gemFill: string;
    gemStroke: string;
    darkSectorFill: string;
    lightSectorFill: string;
    lightSectorText: string;
    sectors: WheelSector[];
  }
> = {
  silver: {
    promptAmount: '₹500',
    milestones: [
      { amount: '₹500', spinText: '+1 Spin' },
      { amount: '₹3,000', spinText: '+1 Spin' },
      { amount: '₹5,000', spinText: '+2 Spin' },
    ],
    fullPageBg:
      'linear-gradient(180deg, #1b3b75 0%, #3163bd 16%, #689bf0 31%, #d6e7ff 44%, #a5c6fa 74%, #75a2f0 100%)',
    topGlowColor: '#60a5fa',
    promptTextColor: '#294c82',
    lineColor: '#5c84c4',
    trackBg: '#324259',
    milestoneAmountColor: '#486ca8',
    milestoneSpinColor: '#294c82',
    rimOuter: '#7ba3e8',
    rimInner: '#9dc0fa',
    rimBorder: '#5780cc',
    gemFill: '#ffffff',
    gemStroke: '#b8d4ff',
    darkSectorFill: '#4d7fe0',
    lightSectorFill: '#d6e6ff',
    lightSectorText: '#264b82',
    sectors: SILVER_SECTORS,
  },
  gold: {
    promptAmount: '₹7,000',
    milestones: [
      { amount: '₹7,000', spinText: '+1 Spin' },
      { amount: '₹30,000', spinText: '+2 Spin' },
      { amount: '₹50,000', spinText: '+2 Spin' },
    ],
    fullPageBg:
      'linear-gradient(180deg, #633905 0%, #a8660c 16%, #e3a736 31%, #fff2cc 44%, #f5d384 74%, #e6b44c 100%)',
    topGlowColor: '#fbbf24',
    promptTextColor: '#875814',
    lineColor: '#b88a32',
    trackBg: '#705528',
    milestoneAmountColor: '#8f6520',
    milestoneSpinColor: '#875814',
    rimOuter: '#e3a829',
    rimInner: '#fcd462',
    rimBorder: '#b87d0e',
    gemFill: '#fff7d6',
    gemStroke: '#f59e0b',
    darkSectorFill: '#ebad28',
    lightSectorFill: '#fff1c4',
    lightSectorText: '#875814',
    sectors: GOLD_SECTORS,
  },
  diamond: {
    promptAmount: '₹50,000',
    milestones: [
      { amount: '₹50,000', spinText: '+1 Spin' },
      { amount: '₹80,000', spinText: '+2 Spin' },
      { amount: '₹120,000', spinText: '+2 Spin' },
    ],
    fullPageBg:
      'linear-gradient(180deg, #3b1469 0%, #6d28b8 16%, #ab62f0 31%, #f2e0ff 44%, #d4a6ff 74%, #ad68f2 100%)',
    topGlowColor: '#c084fc',
    promptTextColor: '#5e2a8c',
    lineColor: '#9457cc',
    trackBg: '#493559',
    milestoneAmountColor: '#6f3b9e',
    milestoneSpinColor: '#5e2a8c',
    rimOuter: '#a448f0',
    rimInner: '#cfa0ff',
    rimBorder: '#7c22cb',
    gemFill: '#fae8ff',
    gemStroke: '#c084fc',
    darkSectorFill: '#9c36e8',
    lightSectorFill: '#eed6ff',
    lightSectorText: '#5e2a8c',
    sectors: DIAMOND_SECTORS,
  },
};

// Reusable Mini Wheel Icon for Tier Tabs & Progress Milestones
const MiniWheelBadge: React.FC<{
  variant:
    | 'silver'
    | 'gold'
    | 'diamond'
    | 'special'
    | 'milestone-silver'
    | 'milestone-gold'
    | 'milestone-diamond';
  size?: number;
}> = ({ variant, size = 38 }) => {
  const palette =
    variant === 'silver' || variant === 'milestone-silver'
      ? {
          rim: '#8bb4f7',
          s1: '#3b73db',
          s2: '#d9e8ff',
          center: variant === 'milestone-silver' ? '#94a3b8' : '#f59e0b',
        }
      : variant === 'gold' || variant === 'milestone-gold'
        ? {
            rim: '#fbbf24',
            s1: '#d97706',
            s2: '#fef08a',
            center: '#f59e0b',
          }
        : variant === 'diamond' || variant === 'milestone-diamond'
          ? {
              rim: '#c084fc',
              s1: '#7e22ce',
              s2: '#f3e8ff',
              center: '#f59e0b',
            }
          : {
              rim: '#991b1b',
              s1: '#7f1d1d',
              s2: '#450a0a',
              center: '#ef4444',
            };

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="shrink-0 drop-shadow">
      <circle cx="20" cy="20" r="18" fill={palette.rim} />
      <circle cx="20" cy="20" r="15" fill={palette.s2} />
      {[0, 90, 180, 270].map((deg) => (
        <path
          key={deg}
          d="M20,20 L20,5 A15,15 0 0,1 30.6,9.4 Z"
          fill={palette.s1}
          transform={`rotate(${deg} 20 20)`}
        />
      ))}
      {[45, 135, 225, 315].map((deg) => (
        <path
          key={deg}
          d="M20,20 L20,5 A15,15 0 0,1 30.6,9.4 Z"
          fill={palette.s1}
          opacity="0.75"
          transform={`rotate(${deg} 20 20)`}
        />
      ))}
      {/* Rim studs */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <circle
          key={deg}
          cx="20"
          cy="3.3"
          r="1.1"
          fill="#ffffff"
          transform={`rotate(${deg} 20 20)`}
        />
      ))}
      <circle cx="20" cy="20" r="5.2" fill="#ffffff" />
      <circle cx="20" cy="20" r="3.8" fill={palette.center} />
    </svg>
  );
};

export const DepositWheelView: React.FC<DepositWheelViewProps> = ({
  balance,
  onBack,
  onOpenDeposit,
}) => {
  const [selectedTier, setSelectedTier] = useState<WheelTier>('silver');
  const [tickerIdx, setTickerIdx] = useState(0);
  const [wheelAngle, setWheelAngle] = useState(0);
  const [noSpinToast, setNoSpinToast] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState<'winnings' | 'spins'>('winnings');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);

  // Live Winner Ticker rotation (matches video 00:07 -> 00:55)
  useEffect(() => {
    const id = setInterval(() => {
      setTickerIdx((prev) => (prev + 1) % LIVE_WIN_TICKER.length);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  // Smooth continuous clockwise wheel rotation matching the video
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;
      // Rotate ~13 degrees per second clockwise, steady and smooth like the video
      setWheelAngle((prev) => (prev + dt * 0.013) % 360);
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleClickGo = () => {
    setNoSpinToast(true);
    setTimeout(() => {
      setNoSpinToast(false);
    }, 1800);
  };

  const handleClickDepositNow = () => {
    setDepositLoading(true);
    setTimeout(() => {
      setDepositLoading(false);
      onOpenDeposit();
    }, 320);
  };

  const handleSwitchHistoryTab = (tab: 'winnings' | 'spins') => {
    if (tab === historyTab) return;
    setHistoryTab(tab);
    setHistoryLoading(true);
    setTimeout(() => {
      setHistoryLoading(false);
    }, 320);
  };

  const activeConfig = TIER_CONFIG[selectedTier];
  const displayWheelBalance = balance >= 5 ? balance.toFixed(0) : '5';

  // Full-Screen Wheel History View (00:40 - 00:42 in video)
  if (historyOpen) {
    return (
      <div className="min-h-screen bg-[#0c1118] text-white select-none flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-[#0c1118] px-3.5 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setHistoryOpen(false)}
            className="p-1 text-white active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[17px] font-bold text-white">Wheel History</h1>
          <div className="w-7" />
        </header>

        {/* Two Tabs: Winnings Record & Spins Record */}
        <div className="grid grid-cols-2 pt-2 pb-3">
          <button
            type="button"
            onClick={() => handleSwitchHistoryTab('winnings')}
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <span
              className={`text-sm font-bold transition-colors ${
                historyTab === 'winnings' ? 'text-white' : 'text-slate-300'
              }`}
            >
              Winnings Record
            </span>
            <span
              className={`h-[3px] w-8 rounded-full mt-1.5 transition-opacity ${
                historyTab === 'winnings' ? 'bg-[#ff7b1b] opacity-100' : 'opacity-0'
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => handleSwitchHistoryTab('spins')}
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <span
              className={`text-sm font-bold transition-colors ${
                historyTab === 'spins' ? 'text-white' : 'text-slate-300'
              }`}
            >
              Spins Record
            </span>
            <span
              className={`h-[3px] w-8 rounded-full mt-1.5 transition-opacity ${
                historyTab === 'spins' ? 'bg-[#ff7b1b] opacity-100' : 'opacity-0'
              }`}
            />
          </button>
        </div>

        {/* Empty State Document Icon + Reflection + No Records (00:40 - 00:42) */}
        <div className="flex-1 flex flex-col items-center justify-start pt-20">
          <div className="relative flex flex-col items-center">
            <svg width="110" height="125" viewBox="0 0 110 125" fill="none">
              {/* Back Document Sheet */}
              <rect x="34" y="10" width="52" height="66" rx="7" fill="#3a3f47" />
              {/* Front Document Sheet */}
              <rect x="22" y="20" width="54" height="68" rx="7" fill="#6c727a" />
              {/* Horizontal Lines on Front Sheet */}
              <rect x="31" y="34" width="36" height="4.5" rx="2.2" fill="#4b5057" />
              <rect x="31" y="46" width="36" height="4.5" rx="2.2" fill="#4b5057" />
              <rect x="31" y="58" width="36" height="4.5" rx="2.2" fill="#4b5057" />
              <rect x="31" y="70" width="22" height="4.5" rx="2.2" fill="#4b5057" />
              {/* Subtle Bottom Reflection */}
              <defs>
                <linearGradient id="docReflect" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6c727a" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#0c1118" stopOpacity="0" />
                </linearGradient>
              </defs>
              <rect x="22" y="90" width="54" height="30" rx="7" fill="url(#docReflect)" />
            </svg>
            <div className="text-xs text-slate-400 font-medium -mt-1">No Records</div>
            {historyLoading && (
              <div className="mt-4 text-sm text-white font-medium flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>loading</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Helper to render sector icon at (0, -76) inside rotated sector group
  const renderSectorIcon = (iconType: WheelSector['iconType']) => {
    if (iconType === 'miniWheel') {
      return (
        <g transform="translate(-14, -92)">
          <MiniWheelBadge variant={selectedTier} size={28} />
        </g>
      );
    }
    if (iconType === 'cash') {
      // Green cash banknote stack icon (seen on Gold & Diamond wheels in video 00:17 & 00:21)
      return (
        <g transform="translate(0, -78)">
          <rect
            x="-13"
            y="-9"
            width="24"
            height="14"
            rx="2"
            fill="#16a34a"
            stroke="#bbf7d0"
            strokeWidth="1"
            transform="rotate(-14)"
          />
          <rect
            x="-11"
            y="-7"
            width="24"
            height="14"
            rx="2"
            fill="#22c55e"
            stroke="#dcfce7"
            strokeWidth="1"
            transform="rotate(-4)"
          />
          <circle cx="1" cy="0" r="3.5" fill="#bbf7d0" opacity="0.85" />
        </g>
      );
    }
    if (iconType === 'coin1') {
      // Single 3D Gold Coin with Star
      return (
        <g transform="translate(0, -76)">
          <circle cx="0" cy="1.5" r="11" fill="#d97706" />
          <circle cx="0" cy="0" r="11" fill="#fbbf24" stroke="#fde68a" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="7.5" fill="#f59e0b" />
          <polygon
            points="0,-4.5 1.3,-1.3 4.7,-1.3 2,0.8 3,4.2 0,2.2 -3,4.2 -2,0.8 -4.7,-1.3 -1.3,-1.3"
            fill="#fef08a"
          />
        </g>
      );
    }
    // 'coins3' — Cluster of 3 Gold Coins with Stars
    return (
      <g transform="translate(0, -78)">
        {/* Left coin */}
        <g transform="translate(-8, 4)">
          <circle cx="0" cy="1" r="8.5" fill="#d97706" />
          <circle cx="0" cy="0" r="8.5" fill="#fbbf24" stroke="#fde68a" strokeWidth="1.2" />
          <circle cx="0" cy="0" r="5.5" fill="#f59e0b" />
        </g>
        {/* Right coin */}
        <g transform="translate(8, 4)">
          <circle cx="0" cy="1" r="8.5" fill="#d97706" />
          <circle cx="0" cy="0" r="8.5" fill="#fbbf24" stroke="#fde68a" strokeWidth="1.2" />
          <circle cx="0" cy="0" r="5.5" fill="#f59e0b" />
        </g>
        {/* Top/Front center coin */}
        <g transform="translate(0, -3)">
          <circle cx="0" cy="1.2" r="9.2" fill="#b45309" />
          <circle cx="0" cy="0" r="9.2" fill="#fbbf24" stroke="#fef08a" strokeWidth="1.3" />
          <circle cx="0" cy="0" r="6.2" fill="#f59e0b" />
          <polygon
            points="0,-3.5 1,-1 3.6,-1 1.5,0.6 2.3,3.2 0,1.7 -2.3,3.2 -1.5,0.6 -3.6,-1 -1,-1"
            fill="#fef08a"
          />
        </g>
      </g>
    );
  };

  return (
    <div
      className="min-h-screen flex flex-col text-white select-none relative overflow-x-hidden transition-colors duration-300"
      style={{ background: activeConfig.fullPageBg }}
    >
      {/* Top App Bar (00:07 in video) */}
      <header className="sticky top-0 z-30 bg-[#0c1118] px-3 py-2.5 flex items-center justify-between border-b border-white/5 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="p-1 text-white active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <h1 className="text-[17px] font-bold text-white tracking-tight">Deposit Wheel</h1>

        {/* Right Gold Coin + ₹5 Pill Badge */}
        <div className="bg-[#1b222d] border border-white/10 rounded-full pl-1 pr-3 py-0.5 flex items-center gap-1.5 shadow-inner">
          <svg width="22" height="22" viewBox="0 0 24 24" className="shrink-0">
            <circle cx="12" cy="12" r="11" fill="#f59e0b" />
            <circle cx="12" cy="12" r="9" fill="#fbbf24" stroke="#fde68a" strokeWidth="1" />
            <circle cx="12" cy="12" r="6.5" fill="#d97706" opacity="0.45" />
            <path
              d="M9.5 8.5H14.5M9.5 11H14.5M11.5 8.5C12.8 8.5 13.5 9.2 13.5 10.2C13.5 11.2 12.8 12 11.5 12H10L13.8 16"
              stroke="#fffbeb"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <span className="font-mono-num font-extrabold text-sm text-[#ff9a2e]">
            ₹{displayWheelBalance}
          </span>
        </div>
      </header>

      {/* UNIFIED FULL-SCREEN BACKGROUND & CONTENT AREA (Covers 100% from below header to bottom of screen) */}
      <div
        className="relative flex-1 flex flex-col justify-between pb-10 overflow-hidden transition-colors duration-300"
        style={{ background: activeConfig.fullPageBg }}
      >
        {/* Full-Page Continuous Decorative Background Artwork (Top Hero Wheel + Sunburst Rays + Floating Coins + Treasure Chest) */}
        <svg
          viewBox="0 0 430 900"
          preserveAspectRatio="xMidYMid slice"
          className="pointer-events-none absolute inset-0 w-full h-full"
        >
          <defs>
            <radialGradient id="topHeroAura" cx="50%" cy="16%" r="48%">
              <stop offset="0%" stopColor="#ffae34" stopOpacity="0.65" />
              <stop offset="45%" stopColor={activeConfig.topGlowColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="wheelStageGlow" cx="50%" cy="68%" r="42%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="60%" stopColor={activeConfig.rimInner} stopOpacity="0.25" />
              <stop offset="100%" stopColor={activeConfig.rimOuter} stopOpacity="0" />
            </radialGradient>
            <linearGradient id="heroGoldRim" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fff3b0" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>

          {/* Top Hero Radial Sunburst Rays & Golden Wheel Aura */}
          <rect x="0" y="0" width="430" height="900" fill="url(#topHeroAura)" />
          <rect x="0" y="0" width="430" height="900" fill="url(#wheelStageGlow)" />

          {/* Sunburst Light Beams radiating across top & middle */}
          <g transform="translate(215, 135)" opacity="0.22">
            {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340].map(
              (deg) => (
                <polygon
                  key={deg}
                  points="0,0 -24,-650 24,-650"
                  fill="#ffffff"
                  transform={`rotate(${deg})`}
                />
              )
            )}
          </g>

          {/* Decorative Giant 3D Fortune Wheel Arch behind "Reward up to ₹599,999" & "Deposit now" */}
          <g transform="translate(215, 175)" opacity="0.32">
            <circle cx="0" cy="0" r="145" fill="none" stroke="url(#heroGoldRim)" strokeWidth="14" />
            <circle cx="0" cy="0" r="128" fill="none" stroke="#ffffff" strokeWidth="2.5" />
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <g key={deg} transform={`rotate(${deg})`}>
                <line x1="0" y1="0" x2="0" y2="-135" stroke="url(#heroGoldRim)" strokeWidth="3" />
                <circle cx="0" cy="-145" r="4" fill="#fffbeb" />
              </g>
            ))}
          </g>

          {/* Smooth Curved Glowing Ribbon/Cloud Blending Top Hero into Lower Wheel Section */}
          <path
            d="M -20 290 Q 215 245 450 290 L 450 900 L -20 900 Z"
            fill={activeConfig.lightSectorFill}
            opacity="0.35"
          />
          <path
            d="M -20 320 Q 215 275 450 320 L 450 900 L -20 900 Z"
            fill={activeConfig.rimInner}
            opacity="0.25"
          />

          {/* Top-Left & Top-Right Floating 3D Gold Coins in Hero Section */}
          <g transform="translate(36, 95) rotate(-22)" opacity="0.8">
            <ellipse cx="0" cy="2" rx="16" ry="11" fill="#b45309" />
            <ellipse cx="0" cy="0" rx="16" ry="11" fill="#fbbf24" stroke="#fef08a" strokeWidth="1.5" />
            <ellipse cx="0" cy="0" rx="10" ry="6.5" fill="#f59e0b" />
          </g>
          <g transform="translate(392, 88) rotate(25)" opacity="0.8">
            <ellipse cx="0" cy="2" rx="18" ry="12" fill="#b45309" />
            <ellipse cx="0" cy="0" rx="18" ry="12" fill="#fbbf24" stroke="#fef08a" strokeWidth="1.5" />
            <ellipse cx="0" cy="0" rx="11.5" ry="7.5" fill="#f59e0b" />
          </g>
          <g transform="translate(56, 178) rotate(15)" opacity="0.65">
            <ellipse cx="0" cy="1.5" rx="12" ry="8" fill="#d97706" />
            <ellipse cx="0" cy="0" rx="12" ry="8" fill="#fcd34d" />
          </g>
          <g transform="translate(376, 172) rotate(-18)" opacity="0.65">
            <ellipse cx="0" cy="1.5" rx="13" ry="8.5" fill="#d97706" />
            <ellipse cx="0" cy="0" rx="13" ry="8.5" fill="#fcd34d" />
          </g>

          {/* Middle & Lower Arena Floating Coins (matching 00:10, 00:17, 00:21) */}
          <g transform="translate(388, 435) rotate(22)" opacity="0.65">
            <ellipse cx="0" cy="0" rx="22" ry="15" fill={activeConfig.rimOuter} />
            <ellipse cx="0" cy="-2" rx="16" ry="10" fill={activeConfig.rimInner} />
          </g>
          <g transform="translate(26, 540) rotate(-28)" opacity="0.6">
            <ellipse cx="0" cy="0" rx="17" ry="11.5" fill={activeConfig.rimOuter} />
            <ellipse cx="0" cy="-1.5" rx="12" ry="7.5" fill={activeConfig.rimInner} />
          </g>
          <g transform="translate(382, 755) rotate(-18)" opacity="0.65">
            <ellipse cx="0" cy="0" rx="21" ry="14.5" fill={activeConfig.rimOuter} />
            <ellipse cx="0" cy="-2" rx="15" ry="9.5" fill={activeConfig.rimInner} />
          </g>

          {/* Bottom-Left Overflowing Treasure Chest Illustration (00:11 in video) */}
          <g transform="translate(8, 725)" opacity="0.62">
            {/* Chest base */}
            <path d="M10 48 L96 32 L105 80 L18 96 Z" fill={activeConfig.rimBorder} />
            {/* Chest lid open */}
            <path d="M4 25 L88 10 L96 32 L10 48 Z" fill={activeConfig.rimOuter} />
            {/* Overflowing coins & pearls inside chest */}
            <circle cx="34" cy="36" r="7.5" fill="#ffffff" opacity="0.9" />
            <circle cx="50" cy="32" r="8.5" fill={activeConfig.rimInner} />
            <circle cx="67" cy="30" r="7.5" fill="#ffffff" opacity="0.9" />
            <circle cx="58" cy="40" r="6.5" fill="#ffffff" opacity="0.8" />
            <circle cx="25" cy="42" r="6.5" fill={activeConfig.rimInner} />
          </g>
        </svg>

        {/* TOP HERO CONTENT: History, Live Ticker, Rules, Headline, Deposit Now & 4 Tier Tabs */}
        <div className="relative z-10 pt-2.5">
          {/* Row 1: History Button | Live Marquee Ticker | Rules Button */}
          <div className="flex items-center justify-between px-0">
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="px-3.5 py-1.5 rounded-r-lg bg-gradient-to-b from-[#ff9e32] to-[#e65c00] text-white font-bold text-xs shadow-md active:scale-95 cursor-pointer"
            >
              History
            </button>

            {/* Live Winner Ticker */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/45 border border-white/15 max-w-[235px] overflow-hidden backdrop-blur-xs">
              {/* Orange Speaker SVG */}
              <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none">
                <path d="M3 9.5V14.5H7L12.5 19V5L7 9.5H3Z" fill="#ff8a1e" />
                <path
                  d="M15.5 8.5C16.8 9.6 17.5 10.8 17.5 12C17.5 13.2 16.8 14.4 15.5 15.5"
                  stroke="#ff8a1e"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M18.2 6C20.2 7.6 21.2 9.7 21.2 12C21.2 14.3 20.2 16.4 18.2 18"
                  stroke="#ff8a1e"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span
                key={tickerIdx}
                className="text-xs font-semibold text-[#ffb057] truncate animate-fade-in"
              >
                {LIVE_WIN_TICKER[tickerIdx]}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setRulesModalOpen(true)}
              className="px-4 py-1.5 rounded-l-lg bg-gradient-to-b from-[#ff9e32] to-[#e65c00] text-white font-bold text-xs shadow-md active:scale-95 cursor-pointer"
            >
              Rules
            </button>
          </div>

          {/* Headline & Subtitle */}
          <div className="text-center px-4 mt-2.5">
            <h2
              className="font-display font-black text-[24px] tracking-tight bg-gradient-to-b from-[#fff3a6] via-[#ffb547] to-[#f26400] bg-clip-text text-transparent"
              style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.45))' }}
            >
              Reward up to ₹599,999
            </h2>
            <p
              className="text-[11.5px] text-white font-semibold leading-snug mt-1"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.55)' }}
            >
              Complete the deposit task to participate in the wheel spin
              <br />
              activity and win up to{' '}
              <span className="text-[#ffd166] font-extrabold">₹599,999</span>
            </p>

            {/* Deposit now Pill Button */}
            <div className="mt-3 mb-2 flex justify-center">
              <button
                type="button"
                onClick={handleClickDepositNow}
                className="w-60 py-2.5 rounded-full bg-gradient-to-b from-[#ffc45c] via-[#ff8e1d] to-[#e05200] text-white font-bold text-[15px] shadow-[0_4px_15px_rgba(255,136,27,0.55)] border border-[#ffd885]/50 active:scale-95 transition-transform cursor-pointer"
              >
                Deposit now
              </button>
            </div>
          </div>

          {/* 4 Wheel Tier Tabs Row (00:07 - 00:24) */}
          <div className="grid grid-cols-4 gap-2 px-3 pt-1 pb-2">
            {/* Tab 1: Up to ₹59,999 (Silver/Blue) */}
            <button
              type="button"
              onClick={() => setSelectedTier('silver')}
              className={`relative rounded-xl py-2 px-1 flex flex-col items-center justify-center transition-all cursor-pointer ${
                selectedTier === 'silver'
                  ? 'bg-gradient-to-b from-[#436499] via-[#709ce0] to-[#a6c8ff] text-white shadow-lg border border-[#b8d4ff]'
                  : 'bg-[#1b222c]/90 text-[#7ab3ff] border border-white/10'
              }`}
            >
              <MiniWheelBadge variant="silver" size={40} />
              <div className="text-[11px] font-bold leading-tight mt-1.5">Up to</div>
              <div className="font-mono-num text-xs font-extrabold leading-tight">₹59,999</div>
              {selectedTier === 'silver' && (
                <span
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: '7px solid transparent',
                    borderRight: '7px solid transparent',
                    borderTop: '8px solid #a6c8ff',
                  }}
                />
              )}
            </button>

            {/* Tab 2: Up to ₹99,999 (Gold) */}
            <button
              type="button"
              onClick={() => setSelectedTier('gold')}
              className={`relative rounded-xl py-2 px-1 flex flex-col items-center justify-center transition-all cursor-pointer ${
                selectedTier === 'gold'
                  ? 'bg-gradient-to-b from-[#785920] via-[#c79938] to-[#ffe291] text-[#6e4608] shadow-lg border border-[#ffe8a3]'
                  : 'bg-[#1b222c]/90 text-[#fbbf24] border border-white/10'
              }`}
            >
              <MiniWheelBadge variant="gold" size={40} />
              <div className="text-[11px] font-bold leading-tight mt-1.5">Up to</div>
              <div className="font-mono-num text-xs font-extrabold leading-tight">₹99,999</div>
              {selectedTier === 'gold' && (
                <span
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: '7px solid transparent',
                    borderRight: '7px solid transparent',
                    borderTop: '8px solid #ffe291',
                  }}
                />
              )}
            </button>

            {/* Tab 3: Up to ₹399,999 (Diamond/Purple) */}
            <button
              type="button"
              onClick={() => setSelectedTier('diamond')}
              className={`relative rounded-xl py-2 px-1 flex flex-col items-center justify-center transition-all cursor-pointer ${
                selectedTier === 'diamond'
                  ? 'bg-gradient-to-b from-[#54307a] via-[#9657d6] to-[#e0b8ff] text-white shadow-lg border border-[#e9ccff]'
                  : 'bg-[#1b222c]/90 text-[#c084fc] border border-white/10'
              }`}
            >
              <MiniWheelBadge variant="diamond" size={40} />
              <div className="text-[11px] font-bold leading-tight mt-1.5">Up to</div>
              <div className="font-mono-num text-xs font-extrabold leading-tight">₹399,999</div>
              {selectedTier === 'diamond' && (
                <span
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: '7px solid transparent',
                    borderRight: '7px solid transparent',
                    borderTop: '8px solid #e0b8ff',
                  }}
                />
              )}
            </button>

            {/* Tab 4: Special Wheel (Locked) */}
            <button
              type="button"
              onClick={handleClickGo}
              className="relative rounded-xl py-2 px-1 flex flex-col items-center justify-center bg-[#1b222c]/90 text-[#fb7185] border border-white/10 cursor-pointer active:scale-95"
            >
              <div className="relative flex items-center justify-center">
                <MiniWheelBadge variant="special" size={40} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-black/55 flex items-center justify-center">
                    <Lock className="w-3.5 h-3.5 text-[#f43f5e]" />
                  </div>
                </div>
              </div>
              <div className="text-[11px] font-bold leading-tight mt-1.5">Special</div>
              <div className="text-xs font-extrabold leading-tight">Wheel</div>
            </button>
          </div>
        </div>

        {/* LOWER WHEEL ARENA CONTENT (Progress Milestones + Rotating 8-Sector Wheel) */}
        <div className="relative z-10 pt-2 px-3.5 flex-1 flex flex-col justify-start">
          {/* Deposit Task Prompt Title + Decorative Diamond Divider Line */}
          <div className="text-center">
            <div
              className="text-sm font-bold tracking-tight"
              style={{ color: activeConfig.promptTextColor }}
            >
              Deposit <span className="font-extrabold">{activeConfig.promptAmount}</span> to get{' '}
              <span className="font-extrabold">1</span> spins
            </div>

            {/* Decorative Line with Left/Right Diamonds & Center Downward Pointer */}
            <div className="flex items-center justify-center mt-1.5 mb-2.5 px-6">
              <span
                className="w-1.5 h-1.5 rotate-45 shrink-0"
                style={{ backgroundColor: activeConfig.lineColor }}
              />
              <div
                className="h-[1px] flex-1"
                style={{ backgroundColor: activeConfig.lineColor, opacity: 0.55 }}
              />
              <span
                className="w-0 h-0 mx-1"
                style={{
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderTop: `5px solid ${activeConfig.lineColor}`,
                }}
              />
              <div
                className="h-[1px] flex-1"
                style={{ backgroundColor: activeConfig.lineColor, opacity: 0.55 }}
              />
              <span
                className="w-1.5 h-1.5 rotate-45 shrink-0"
                style={{ backgroundColor: activeConfig.lineColor }}
              />
            </div>
          </div>

          {/* 3 Milestone Progress Bar + Amounts & +Spin Labels */}
          <div className="px-1">
            <div
              className="h-7 rounded-full flex items-center justify-between px-5 shadow-inner"
              style={{ backgroundColor: activeConfig.trackBg }}
            >
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center justify-center">
                  <MiniWheelBadge
                    variant={
                      selectedTier === 'silver'
                        ? 'milestone-silver'
                        : selectedTier === 'gold'
                          ? 'milestone-gold'
                          : 'milestone-diamond'
                    }
                    size={23}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 text-center mt-1.5">
              {activeConfig.milestones.map((m, idx) => (
                <div
                  key={idx}
                  className={
                    idx === 0 ? 'text-left pl-2' : idx === 1 ? 'text-center' : 'text-right pr-2'
                  }
                >
                  <div
                    className="font-mono-num text-xs font-bold leading-tight"
                    style={{ color: activeConfig.milestoneAmountColor }}
                  >
                    {m.amount}
                  </div>
                  <div
                    className="text-xs font-extrabold leading-tight mt-0.5"
                    style={{ color: activeConfig.milestoneSpinColor }}
                  >
                    {m.spinText}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LARGE 8-SECTOR ROTATING WHEEL + STATIONARY CENTER "GO / spin 0" BUTTON */}
          <div className="relative mt-4 flex items-center justify-center">
            {/* "No spin count" Toast Overlay (00:25 - 00:28, 00:33 - 00:34 in video) */}
            {noSpinToast && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 bg-black/80 text-white text-xs font-medium px-5 py-3 rounded-xl shadow-2xl whitespace-nowrap pointer-events-none">
                No spin count
              </div>
            )}

            <div className="relative w-[328px] h-[328px] flex items-center justify-center">
              {/* Rotating Wheel SVG */}
              <svg
                viewBox="0 0 340 340"
                className="w-full h-full drop-shadow-[0_14px_28px_rgba(0,0,0,0.28)]"
                style={{ transform: `rotate(${wheelAngle}deg)` }}
              >
                {/* Outer 3D Shadow/Bevel Ring */}
                <circle cx="170" cy="170" r="166" fill={activeConfig.rimBorder} />
                <circle cx="170" cy="170" r="162" fill={activeConfig.rimOuter} />
                <circle
                  cx="170"
                  cy="170"
                  r="150"
                  fill="none"
                  stroke={activeConfig.rimInner}
                  strokeWidth="3.5"
                />
                <circle cx="170" cy="170" r="142" fill={activeConfig.rimBorder} />

                {/* 8 Alternating 45-Degree Pie Sectors */}
                {activeConfig.sectors.map((sec, idx) => {
                  const startDeg = idx * 45;
                  const centerDeg = startDeg + 22.5;
                  return (
                    <g key={idx}>
                      <path
                        d="M 170 170 L 170 30 A 140 140 0 0 1 268.995 71.005 Z"
                        fill={
                          sec.isDarkSector
                            ? activeConfig.darkSectorFill
                            : activeConfig.lightSectorFill
                        }
                        stroke={activeConfig.rimInner}
                        strokeWidth="1"
                        transform={`rotate(${startDeg} 170 170)`}
                      />

                      {/* Sector Label & Icon rotated to sector center */}
                      <g transform={`translate(170, 170) rotate(${centerDeg})`}>
                        {sec.subLabel ? (
                          <>
                            <text
                              x="0"
                              y="-116"
                              textAnchor="middle"
                              fill={sec.isDarkSector ? '#ffffff' : activeConfig.lightSectorText}
                              fontSize="11.5"
                              fontWeight="800"
                            >
                              {sec.label}
                            </text>
                            <text
                              x="0"
                              y="-103"
                              textAnchor="middle"
                              fill={sec.isDarkSector ? '#ffffff' : activeConfig.lightSectorText}
                              fontSize="11"
                              fontWeight="800"
                            >
                              {sec.subLabel}
                            </text>
                          </>
                        ) : (
                          <text
                            x="0"
                            y="-110"
                            textAnchor="middle"
                            fill={sec.isDarkSector ? '#ffffff' : activeConfig.lightSectorText}
                            fontSize="13"
                            fontWeight="800"
                          >
                            {sec.label}
                          </text>
                        )}
                        {renderSectorIcon(sec.iconType)}
                      </g>
                    </g>
                  );
                })}

                {/* 8 Sparkling Diamond Gems on Outer Rim at Sector Dividers */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                  <g key={deg} transform={`rotate(${deg} 170 170)`}>
                    {/* Faceted Diamond Gem at (170, 19) */}
                    <polygon
                      points="170,11 176,19 170,27 164,19"
                      fill={activeConfig.gemFill}
                      stroke={activeConfig.gemStroke}
                      strokeWidth="1.2"
                    />
                    <polygon points="170,13 173.5,19 170,25 166.5,19" fill="#ffffff" />
                  </g>
                ))}
              </svg>

              {/* Stationary Center "GO / spin 0" Button with Top Golden Arrow Pointer */}
              <button
                type="button"
                onClick={handleClickGo}
                className="absolute z-20 flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer group"
                style={{ width: 92, height: 112, marginTop: -12 }}
              >
                <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-lg">
                  <defs>
                    <radialGradient id="goBtnGrad" cx="50%" cy="35%" r="65%">
                      <stop offset="0%" stopColor="#ffd86b" />
                      <stop offset="55%" stopColor="#ff9419" />
                      <stop offset="100%" stopColor="#d95300" />
                    </radialGradient>
                    <linearGradient id="goRimGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fffbeb" />
                      <stop offset="50%" stopColor="#fde68a" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                  </defs>

                  {/* Upward Pointer Arrow at 12 o'clock */}
                  <polygon
                    points="50,2 64,34 36,34"
                    fill="url(#goRimGrad)"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                  />
                  <polygon points="50,5 60,31 50,27" fill="#fbbf24" />

                  {/* Outer Cream/Gold Ring */}
                  <circle
                    cx="50"
                    cy="70"
                    r="41"
                    fill="url(#goRimGrad)"
                    stroke="#f59e0b"
                    strokeWidth="2"
                  />
                  {/* Inner Glossy Orange-Gold Circle */}
                  <circle
                    cx="50"
                    cy="70"
                    r="33"
                    fill="url(#goBtnGrad)"
                    stroke="#fef08a"
                    strokeWidth="1.5"
                  />
                  {/* Top Glossy Highlight Arc */}
                  <ellipse cx="50" cy="53" rx="20" ry="9" fill="#ffffff" opacity="0.28" />

                  {/* "GO" and "spin 0" Text */}
                  <text
                    x="50"
                    cy="69"
                    y="69"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="20"
                    fontWeight="900"
                    style={{ filter: 'drop-shadow(0 1px 2px rgba(140,45,0,0.8))' }}
                  >
                    GO
                  </text>
                  <text
                    x="50"
                    y="84"
                    textAnchor="middle"
                    fill="#fffbeb"
                    fontSize="10.5"
                    fontWeight="700"
                  >
                    spin 0
                  </text>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Brief "loading" Overlay when clicking Deposit now (00:55 in video) */}
      {depositLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 max-w-[430px] mx-auto">
          <div className="bg-black/80 text-white text-xs font-medium px-6 py-4 rounded-xl flex flex-col items-center gap-2 shadow-2xl">
            <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            <span>loading</span>
          </div>
        </div>
      )}

      {/* RULES MODAL (00:45 - 00:50 in video) */}
      {rulesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-5 max-w-[430px] mx-auto">
          <div className="bg-[#17202c] border border-white/10 rounded-2xl w-full max-w-[355px] p-5 shadow-2xl flex flex-col max-h-[78vh]">
            <h3 className="text-center text-base font-bold text-white mb-3 tracking-wide">
              • Rules •
            </h3>

            <div className="overflow-y-auto pr-1 space-y-3.5 text-[13px] text-slate-200 leading-relaxed flex-1">
              <p>
                1. Event Description: Deposit Wheel is a limited-time event. Users can get
                corresponding wheel spin chances after completing the specified deposit amount.
              </p>
              <p>
                2. Participation Conditions: Users must meet the deposit amount requirements shown
                on the event page before they can get the corresponding wheel spin chances.
              </p>
              <p>
                3. Activation Rules: The Deposit Wheel event will only be activated after the first
                deposit is completed. The first deposit will not be counted toward the wheel tasks.
              </p>
              <p>
                4. Spin Rules: Each spin consumes 1 wheel spin chance, and users may randomly win
                cash rewards or additional spin chances.
              </p>
              <p>
                5. Reward Details: Reward content and reward amount are subject to the event page
                display.
              </p>
              <p>
                6. Distribution Rules: After winning, rewards will be automatically credited to the
                corresponding account.
              </p>
              <p>
                7. Spin Chance Rules: Wheel spin chances cannot be accumulated. Please use them
                within the valid period.
              </p>
              <p>
                8. Final Explanation: If violations or abnormal behavior are detected, the platform
                reserves the right to disqualify participation and revoke rewards. The platform
                reserves the final right of interpretation of this event.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setRulesModalOpen(false)}
              className="mt-4 w-full py-3 rounded-full bg-gradient-to-b from-[#ffc45c] via-[#ff8e1d] to-[#e05200] text-white font-bold text-base shadow-lg active:scale-95 transition-transform cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
