import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit3,
  RefreshCw,
  Bell,
  Ticket,
  CreditCard,
  Gamepad2,
  PieChart,
  ShieldCheck,
  Headphones,
  Gift,
  Globe,
  Settings,
  Users,
  FileSpreadsheet,
  UserPlus,
  BookOpen,
  Percent,
  LogOut,
  Check,
  X,
  Camera,
  Send,
  HelpCircle,
  Volume2,
  VolumeX,
  Trash2,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { MaanWinLogo, TreasureChestIcon } from './BrandLogo';
import { userAvatarImg, DP_AVATARS, HeroBannerSlide } from './GameArtwork';
import { LanguagePickerModal } from './LanguagePickerModal';
import { apiPost } from '../utils/api';
import {
  SupportedLanguage,
  getTranslation,
  getLanguageInfo,
} from '../utils/i18n';

export const ShareTabView: React.FC<{
  onBack: () => void;
  onOpenEarn: () => void;
}> = ({ onBack, onOpenEarn }) => {
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/register?invite_code=8714V5N`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    triggerToast('Copy successful');
  };

  const handleCopyInviteCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('8714V5N').catch(() => {});
    }
    triggerToast('Invite code 8714V5N copied');
  };

  const CHEST_TIERS = [
    { count: 1, reward: 55, current: 0 },
    { count: 3, reward: 155, current: 0 },
    { count: 10, reward: 555, current: 0 },
    { count: 30, reward: 1777, current: 0 },
    { count: 50, reward: 2777, current: 0 },
    { count: 100, reward: 5777, current: 0 },
  ];

  return (
    <div className="min-h-screen bg-[#111923] text-white pb-24 select-none">
      {/* Header (/shareTab) */}
      <header className="sticky top-0 z-30 bg-[#111923] px-4 py-3.5 flex items-center justify-between border-b border-white/5">
        <button
          type="button"
          onClick={onBack}
          className="p-1 text-slate-200 active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-base font-bold text-white">Invite Friends</h1>
        <button
          type="button"
          onClick={onOpenEarn}
          className="text-xs font-semibold text-[#ff8a1e] cursor-pointer"
        >
          Earn
        </button>
      </header>

      <div className="p-3.5 space-y-4">
        <p className="text-xs text-slate-400 text-center">
          Please swipe left - right to choose your favorite poster
        </p>

        {/* Poster Card with QR Code matching /shareTab */}
        <div className="w-72 mx-auto rounded-2xl bg-gradient-to-b from-[#232f42] via-[#1a2332] to-[#121822] border-2 border-amber-500/40 p-4 shadow-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <MaanWinLogo size="sm" />
            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-[10px] font-bold text-amber-300">
              Official Partner
            </span>
          </div>

          <div className="text-center my-2">
            <div className="font-display font-black text-lg text-transparent bg-clip-text bg-gradient-to-b from-[#fff2b2] via-[#ffc145] to-[#e07b00] leading-tight">
              INVITE FRIENDS &amp;
              <br />
              EARN UP TO 85%
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              Fair and justice · Open and transparent
            </div>
          </div>

          <div className="my-3 flex justify-center">
            <TreasureChestIcon className="w-20 h-20" />
          </div>

          {/* Bottom White QR Strip */}
          <div className="bg-white rounded-xl p-2.5 flex items-center justify-between text-slate-900">
            <div>
              <div className="text-[10px] font-bold text-slate-500">Invite Code</div>
              <div className="font-mono-num font-black text-base text-[#ea580c]">8714V5N</div>
              <div className="text-[9px] text-slate-500">Scan QR to join XG Win 99</div>
            </div>
            {/* Crisp SVG QR Code */}
            <svg viewBox="0 0 40 40" className="w-12 h-12 border border-slate-300 p-0.5 rounded">
              <rect x="2" y="2" width="12" height="12" fill="none" stroke="#0f172a" strokeWidth="2.5" />
              <rect x="5" y="5" width="6" height="6" fill="#0f172a" />
              <rect x="26" y="2" width="12" height="12" fill="none" stroke="#0f172a" strokeWidth="2.5" />
              <rect x="29" y="5" width="6" height="6" fill="#0f172a" />
              <rect x="2" y="26" width="12" height="12" fill="none" stroke="#0f172a" strokeWidth="2.5" />
              <rect x="5" y="29" width="6" height="6" fill="#0f172a" />
              <rect x="17" y="6" width="5" height="5" fill="#0f172a" />
              <rect x="17" y="16" width="6" height="6" fill="#ea580c" />
              <rect x="26" y="18" width="5" height="5" fill="#0f172a" />
              <rect x="18" y="27" width="6" height="5" fill="#0f172a" />
              <rect x="27" y="27" width="9" height="9" fill="#0f172a" />
            </svg>
          </div>
        </div>

        {/* Invited Stats Row */}
        <div className="flex items-center justify-around text-xs text-slate-300 py-1">
          <div>
            Invite friends <b className="text-[#ef4444] font-mono-num">1</b>
          </div>
          <div>
            Daily commission <b className="text-[#ff8a1e] font-mono-num">85%</b>
          </div>
        </div>

        {/* Primary Orange Pill Button + Outlined Copy Code Button */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleCopyShareLink}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#ff9a2e] to-[#ff6300] text-white font-bold text-sm tracking-wide shadow-lg active:scale-[0.99] cursor-pointer"
          >
            INVITATION LINK
          </button>

          <button
            type="button"
            onClick={handleCopyInviteCode}
            className="w-full py-3 rounded-full border border-[#ff7b1b] text-[#ff8a1e] font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            <span>Copy invitation code (8714V5N)</span>
          </button>
        </div>

        {/* Golden Treasure Chest Rewards Grid */}
        <div className="pt-2">
          <h2 className="font-display font-bold text-sm text-white mb-2.5">
            Referral Activity Treasure Chests
          </h2>
          <div className="grid grid-cols-3 gap-2.5">
            {CHEST_TIERS.map((tier) => (
              <div
                key={tier.count}
                onClick={() =>
                  triggerToast(`Invite ${tier.count} valid friends to claim ₹${tier.reward}!`)
                }
                className="bg-[#1a2332] rounded-2xl p-3 border border-amber-500/20 flex flex-col items-center text-center cursor-pointer active:scale-95 transition-transform"
              >
                <TreasureChestIcon className="w-12 h-12 mb-1" />
                <div className="font-mono-num font-black text-sm text-[#ff8a1e]">
                  ₹{tier.reward}
                </div>
                <div className="text-[10px] text-slate-300 mt-0.5">
                  Invite {tier.count} {tier.count === 1 ? 'Friend' : 'Friends'}
                </div>
                <div className="mt-2 w-full py-1 rounded-full bg-[#253142] text-[10px] font-mono-num text-slate-300">
                  {tier.current}/{tier.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center max-w-[430px] mx-auto">
          <div className="bg-black/85 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
};

export const PromotionsView: React.FC<{
  onBack: () => void;
  onOpenWheel: () => void;
  onOpenCheckIn: () => void;
}> = ({ onBack, onOpenWheel, onOpenCheckIn }) => {
  return (
    <div className="min-h-screen bg-[#111923] text-white pb-24 select-none">
      {/* Header (/activity) */}
      <header className="sticky top-0 z-30 bg-[#111923] px-4 py-3.5 flex items-center justify-between border-b border-white/5">
        <button
          type="button"
          onClick={onBack}
          className="p-1 text-slate-200 active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-base font-bold text-white">Promotions</h1>
        <div className="w-6" />
      </header>

      <div className="p-3.5 space-y-3.5">
        {/* Card 1: LUCKY WHEEL SPIN & WIN! (01:00 in video) */}
        <div
          onClick={onOpenWheel}
          className="w-full h-40 rounded-2xl bg-gradient-to-r from-[#141a22] via-[#222018] to-[#3b290e] border border-amber-500/25 p-4 relative overflow-hidden cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start justify-between z-10">
            <div>
              <div className="scale-75 origin-top-left mb-1">
                <MaanWinLogo size="sm" />
              </div>
              <h2 className="font-display font-black text-xl leading-tight text-transparent bg-clip-text bg-gradient-to-b from-[#fff2b2] via-[#ffc145] to-[#e07b00]">
                LUCKY WHEEL
                <br />
                SPIN &amp; WIN!
              </h2>
            </div>

            <div className="bg-white/95 rounded-xl px-3 py-1.5 text-center shadow">
              <div className="w-20 h-1.5 bg-slate-200 rounded-full mb-1 overflow-hidden">
                <div className="w-2 h-full bg-[#ff7b1b]" />
              </div>
              <span className="font-mono-num text-xs font-extrabold text-[#d97706]">
                ₹0/2500
              </span>
            </div>
          </div>

          <svg viewBox="0 0 120 100" className="w-32 h-28 absolute right-2 bottom-0 pointer-events-none">
            <circle cx="65" cy="52" r="36" fill="#1f242d" stroke="#F59E0B" strokeWidth="5" />
            <circle cx="65" cy="52" r="26" fill="none" stroke="#FBBF24" strokeWidth="2" strokeDasharray="6 4" />
            <line x1="65" y1="16" x2="65" y2="88" stroke="#F59E0B" strokeWidth="2" />
            <line x1="29" y1="52" x2="101" y2="52" stroke="#F59E0B" strokeWidth="2" />
            <line x1="40" y1="27" x2="90" y2="77" stroke="#F59E0B" strokeWidth="2" />
            <line x1="90" y1="27" x2="40" y2="77" stroke="#F59E0B" strokeWidth="2" />
            <circle cx="65" cy="52" r="8" fill="#FBBF24" />
          </svg>
        </div>

        {/* Card 2: VIP LEVEL UP, REWARDS LEVEL UP! */}
        <div
          onClick={onOpenCheckIn}
          className="w-full h-40 rounded-2xl bg-gradient-to-r from-[#131820] via-[#1f242d] to-[#2e2415] border border-amber-500/20 p-4 relative overflow-hidden cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start justify-between z-10">
            <div>
              <div className="scale-75 origin-top-left mb-1">
                <MaanWinLogo size="sm" />
              </div>
              <h2 className="font-display font-black text-lg leading-tight text-transparent bg-clip-text bg-gradient-to-b from-[#ffe8a3] via-[#f59e0b] to-[#d97706]">
                VIP LEVEL UP,
                <br />
                REWARDS LEVEL UP!
              </h2>
            </div>

            <div className="bg-white/95 rounded-xl px-3 py-1.5 text-center shadow">
              <div className="w-20 h-1.5 bg-slate-200 rounded-full mb-1 overflow-hidden">
                <div className="w-3 h-full bg-[#ff7b1b]" />
              </div>
              <span className="font-mono-num text-xs font-extrabold text-[#d97706]">
                ₹64.12/₹3K
              </span>
            </div>
          </div>

          <svg viewBox="0 0 130 100" className="w-32 h-24 absolute right-2 bottom-1 pointer-events-none">
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

        {/* Card 3: WE PLAY WITH YOU. WE STAND WITH YOU. */}
        <div
          onClick={onOpenCheckIn}
          className="w-full h-40 rounded-2xl bg-gradient-to-r from-[#141a22] via-[#1f232a] to-[#2e2415] border border-amber-500/20 p-4 relative overflow-hidden cursor-pointer flex flex-col justify-between"
        >
          <div className="z-10">
            <div className="scale-75 origin-top-left mb-1">
              <MaanWinLogo size="sm" />
            </div>
            <h2 className="font-display font-black text-lg leading-tight text-transparent bg-clip-text bg-gradient-to-b from-[#ffe8a3] via-[#f59e0b] to-[#d97706]">
              WE PLAY WITH YOU.
              <br />
              WE STAND WITH YOU.
            </h2>
          </div>

          <svg viewBox="0 0 110 100" className="w-28 h-28 absolute right-3 bottom-1 pointer-events-none">
            <path
              d="M55 12 L90 26 L90 52 C90 74 55 90 55 90 C55 90 20 74 20 52 L20 26 Z"
              fill="#1f242d"
              stroke="#F59E0B"
              strokeWidth="4"
            />
            <path
              d="M55 66 C55 66 38 54 38 43 C38 36 44 33 49 37 L55 43 L61 37 C66 33 72 36 72 43 C72 54 55 66 55 66 Z"
              fill="#FBBF24"
            />
          </svg>
        </div>

        {/* Card 4: FIRST DEPOSIT BONUS */}
        <HeroBannerSlide index={1} onClick={onOpenCheckIn} />
      </div>
    </div>
  );
};

export const EarnView: React.FC<{
  onBack: () => void;
  onOpenShareTab?: () => void;
}> = ({ onBack, onOpenShareTab }) => {
  const [slideIdx, setSlideIdx] = useState<0 | 1>(0);
  const [toast, setToast] = useState<string | null>(null);
  const [giftCodeModal, setGiftCodeModal] = useState(false);
  const [giftInput, setGiftInput] = useState('');

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('8714V5N').catch(() => {});
    }
    triggerToast('Invite code 8714V5N copied!');
  };

  return (
    <div className="min-h-screen bg-[#111923] text-white pb-24 select-none">
      {/* Header (/earn - 01:01 in video) */}
      <header className="sticky top-0 z-30 bg-[#111923] px-4 py-3.5 flex items-center justify-between border-b border-white/5">
        <button
          type="button"
          onClick={onBack}
          className="p-1 text-slate-200 active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-base font-bold text-white">Earn</h1>
        <div className="w-6" />
      </header>

      <div className="p-3.5">
        {/* Top Commission Card (01:02 in video) */}
        <div className="rounded-2xl overflow-hidden bg-[#1a2332] border border-white/5 shadow-lg">
          <div className="bg-gradient-to-b from-[#434b59] to-[#272f3b] py-5 px-4 text-center relative">
            <div className="text-xs font-semibold text-slate-200 mb-1">
              Yesterday&apos;s commission
            </div>
            <div className="font-mono-num font-black text-3xl text-[#ff8a1e]">
              ₹0.00
            </div>
          </div>

          {slideIdx === 0 ? (
            <div
              onClick={() => setSlideIdx(1)}
              className="grid grid-cols-2 divide-x divide-slate-800 cursor-pointer"
            >
              <div>
                <div className="bg-[#10b981] text-white text-xs font-bold py-2.5 text-center">
                  Direct Invitees
                </div>
                <div className="p-3 text-center space-y-2.5">
                  <div>
                    <div className="font-mono-num font-bold text-sm text-white">1</div>
                    <div className="text-[11px] text-slate-400">Registered Users</div>
                  </div>
                  <div>
                    <div className="font-mono-num font-bold text-sm text-[#10b981]">0</div>
                    <div className="text-[11px] text-slate-400">Deposit Users</div>
                  </div>
                  <div>
                    <div className="font-mono-num font-bold text-sm text-[#ff8a1e]">₹0.00</div>
                    <div className="text-[11px] text-slate-400">Deposit Amount</div>
                  </div>
                  <div>
                    <div className="font-mono-num font-bold text-sm text-white">0</div>
                    <div className="text-[11px] text-slate-400">First Deposit Users</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-[#059669] text-white text-xs font-bold py-2.5 text-center">
                  Team Invitees
                </div>
                <div className="p-3 text-center space-y-2.5">
                  <div>
                    <div className="font-mono-num font-bold text-sm text-white">4</div>
                    <div className="text-[11px] text-slate-400">Registered Users</div>
                  </div>
                  <div>
                    <div className="font-mono-num font-bold text-sm text-[#10b981]">0</div>
                    <div className="text-[11px] text-slate-400">Deposit Users</div>
                  </div>
                  <div>
                    <div className="font-mono-num font-bold text-sm text-[#ff8a1e]">₹0.00</div>
                    <div className="text-[11px] text-slate-400">Deposit Amount</div>
                  </div>
                  <div>
                    <div className="font-mono-num font-bold text-sm text-white">0</div>
                    <div className="text-[11px] text-slate-400">First Deposit Users</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setSlideIdx(0)}
              className="grid grid-cols-2 divide-x divide-y divide-slate-800 p-2 text-center cursor-pointer"
            >
              <div className="p-4">
                <div className="text-xs text-slate-300 mb-1">This Week</div>
                <div className="font-mono-num font-bold text-base text-[#ff8a1e]">₹0.00</div>
              </div>
              <div className="p-4">
                <div className="text-xs text-slate-300 mb-1">Total commission</div>
                <div className="font-mono-num font-bold text-base text-white">₹0.00</div>
              </div>
              <div className="p-4">
                <div className="font-mono-num font-bold text-base text-white">1</div>
                <div className="text-xs text-slate-300 mt-0.5">Direct Invitees</div>
              </div>
              <div className="p-4">
                <div className="font-mono-num font-bold text-base text-white">4</div>
                <div className="text-xs text-slate-300 mt-0.5">Team Invitees</div>
              </div>
            </div>
          )}
        </div>

        {/* Slide Indicator Dots */}
        <div className="flex items-center justify-center gap-1.5 my-3">
          <button
            type="button"
            onClick={() => setSlideIdx(0)}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              slideIdx === 0 ? 'w-4 bg-[#ff7b1b]' : 'w-1.5 bg-slate-600'
            }`}
          />
          <button
            type="button"
            onClick={() => setSlideIdx(1)}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              slideIdx === 1 ? 'w-4 bg-[#ff7b1b]' : 'w-1.5 bg-slate-600'
            }`}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            if (onOpenShareTab) {
              onOpenShareTab();
            } else {
              handleCopyCode();
            }
          }}
          className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#ff9a2e] to-[#ff6300] text-white font-bold text-sm tracking-wide shadow-lg active:scale-[0.99] cursor-pointer mb-4"
        >
          INVITE FRIENDS TO GET MONEY
        </button>

        {/* 8 Agency Menu Rows */}
        <div className="bg-[#1a2332] rounded-2xl divide-y divide-slate-800/80 border border-white/5 overflow-hidden">
          <a
            href="https://t.me/xgwin99"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerToast('Opening Agent Partner Support: https://t.me/xgwin99')}
            className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-medium text-slate-200 hover:bg-white/5 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-[#38bdf8]" />
              <span>Agent Partner</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono-num font-bold text-[#38bdf8]">@xgwin99</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
          </a>

          <button
            type="button"
            onClick={handleCopyCode}
            className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-medium text-slate-200 hover:bg-white/5 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-4 h-4 text-[#38bdf8]" />
              <span>Invite Code</span>
            </div>
            <div className="flex items-center gap-2 font-mono-num text-white font-semibold">
              <span>8714V5N</span>
              <Copy className="w-4 h-4 text-slate-400" />
            </div>
          </button>

          {[
            { icon: FileSpreadsheet, label: 'Commission Details' },
            { icon: Users, label: 'Invitees Overview' },
            { icon: UserPlus, label: 'New Invitees' },
            { icon: BookOpen, label: 'Invitation Rules' },
            { icon: Percent, label: 'Rebate Ratio' },
          ].map((row) => {
            const Icon = row.icon;
            return (
              <button
                key={row.label}
                type="button"
                onClick={() => triggerToast(`${row.label}: Up to 85% commission rebate`)}
                className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-medium text-slate-200 hover:bg-white/5 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-[#10b981]" />
                  <span>{row.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setGiftCodeModal(true)}
            className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-medium text-slate-200 hover:bg-white/5 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Gift className="w-4 h-4 text-[#38bdf8]" />
              <span>Gift Code</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {giftCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-5 max-w-[430px] mx-auto">
          <div className="bg-[#1c2635] rounded-2xl p-5 border border-white/10 w-full max-w-xs text-center">
            <h3 className="font-bold text-sm text-white mb-3">Redeem Gift Code</h3>
            <input
              type="text"
              value={giftInput}
              onChange={(e) => setGiftInput(e.target.value)}
              placeholder="Please enter gift code"
              className="w-full bg-[#111923] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white mb-4 focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGiftCodeModal(false)}
                className="py-2 rounded-full bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setGiftCodeModal(false);
                  triggerToast('Invalid or expired gift code');
                }}
                className="py-2 rounded-full bg-gradient-to-r from-[#ff9429] to-[#ff6300] text-white text-xs font-bold cursor-pointer"
              >
                Receive
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center max-w-[430px] mx-auto">
          <div className="bg-black/85 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
};

export const AvatarPickerModal: React.FC<{
  currentAvatar: string;
  uid?: string;
  onClose: () => void;
  onSaveAvatar: (newAvatar: string) => void;
}> = ({ currentAvatar, uid = '', onClose, onSaveAvatar }) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 max-w-[430px] mx-auto select-none">
      <div className="bg-[#182230] rounded-3xl border border-amber-500/30 w-full max-w-sm overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.85)] animate-[depositPop_0.25s_ease-out]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#d97706] via-[#ea580c] to-[#b45309] px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-white" />
            <h3 className="font-display font-extrabold text-sm text-white tracking-wide">
              Select Profile Avatar (DP)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/25 text-white flex items-center justify-center active:scale-90 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Selected Avatar Preview */}
        <div className="px-4 pt-4 pb-3 flex items-center gap-3.5 bg-[#131b26] border-b border-white/5">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#ff8a1e] shadow-[0_0_16px_rgba(255,138,30,0.5)] shrink-0 bg-black">
            <img
              src={selectedAvatar}
              alt="Selected Avatar Preview"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="text-xs font-extrabold text-white">UID: {uid || '—'}</div>
            <div className="text-[11px] text-amber-400 font-medium mt-0.5">
              Tap any DP logo below and press Save
            </div>
          </div>
        </div>

        {/* 12 User-Provided Anime DP Logos Grid */}
        <div className="p-4 max-h-[340px] overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-3 gap-3.5">
            {DP_AVATARS.map((avatarUrl, idx) => {
              const isSelected = selectedAvatar === avatarUrl;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedAvatar(avatarUrl)}
                  className={`relative aspect-square rounded-full p-0.5 transition-all duration-200 cursor-pointer active:scale-90 ${
                    isSelected
                      ? 'ring-3 ring-[#ff8a1e] shadow-[0_0_18px_rgba(255,138,30,0.75)] scale-105'
                      : 'ring-1 ring-white/15 hover:ring-amber-400/60 opacity-85 hover:opacity-100'
                  }`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-black">
                    <img
                      src={avatarUrl}
                      alt={`Avatar DP ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isSelected && (
                    <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-gradient-to-r from-[#ff9429] to-[#ff5500] border-2 border-[#182230] text-white flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="px-4 py-3.5 bg-[#131b26] border-t border-white/5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 rounded-full bg-[#243042] text-slate-200 text-xs font-bold active:scale-95 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSaveAvatar(selectedAvatar);
              onClose();
            }}
            className="py-2.5 rounded-full bg-gradient-to-r from-[#ff9429] to-[#ff6300] text-white text-xs font-extrabold shadow-[0_4px_14px_rgba(255,102,0,0.45)] active:scale-95 cursor-pointer"
          >
            Save Avatar
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProfileView: React.FC<{
  balance: number;
  uid?: string;
  phone?: string;
  avatarUrl?: string;
  onChangeAvatar?: (newAvatar: string) => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenSupport: () => void;
  onOpenFaq?: () => void;
  onOpenWinGoHistory: () => void;
  onOpenNotifications?: () => void;
  onOpenCoupons?: () => void;
  unreadNotificationCount?: number;
  currentLanguage?: SupportedLanguage;
  onChangeLanguage?: (lang: SupportedLanguage) => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onLogout: () => void;
}> = ({
  balance,
  uid = '',
  phone = '',
  avatarUrl = userAvatarImg,
  onChangeAvatar,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenSupport,
  onOpenFaq,
  onOpenWinGoHistory,
  onOpenNotifications,
  onOpenCoupons,
  unreadNotificationCount = 1,
  currentLanguage = 'en',
  onChangeLanguage,
  soundEnabled = true,
  onToggleSound,
  onLogout,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [nickname, setNickname] = useState(`Member${phone || uid || 'User'}`);
  const [editingName, setEditingName] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [logoutConfirmModal, setLogoutConfirmModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeSubModal, setActiveSubModal] = useState<string | null>(null);

  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmNewPw, setConfirmNewPw] = useState('');
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const t = (key: string) => getTranslation(currentLanguage, key);
  const currentLangInfo = getLanguageInfo(currentLanguage);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const closePwModal = () => {
    setPwModalOpen(false);
    setOldPw('');
    setNewPw('');
    setConfirmNewPw('');
    setShowOldPw(false);
    setShowNewPw(false);
    setPwError('');
    setPwSubmitting(false);
  };

  const handleChangePassword = async () => {
    if (pwSubmitting) return;
    setPwError('');
    if (!phone) {
      setPwError('Registered mobile number not available.');
      return;
    }
    if (!oldPw) {
      setPwError('Please enter your current password.');
      return;
    }
    if (newPw.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (newPw !== confirmNewPw) {
      setPwError('New passwords do not match.');
      return;
    }
    setPwSubmitting(true);
    try {
      const res = await apiPost('/user/change-password', {
        phone,
        oldPassword: oldPw,
        newPassword: newPw,
      });
      if (res && res.success) {
        closePwModal();
        setActiveSubModal(null);
        triggerToast('Password updated successfully');
      } else {
        setPwError((res && res.message) || 'Unable to update password. Please try again.');
        setPwSubmitting(false);
      }
    } catch {
      setPwError('Unable to connect to the server. Please try again.');
      setPwSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111923] text-white pb-24 select-none">
      {/* Top Orange Header with curved downward dip (matching screenshot) */}
      <div className="relative bg-gradient-to-b from-[#ff851b] via-[#ff7708] to-[#f46800] pt-6 pb-6 px-5 rounded-b-[36px] shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAvatarModalOpen(true)}
              className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/90 bg-black shrink-0 shadow-md active:scale-95 transition-transform cursor-pointer"
              title="Tap to change avatar"
            >
              <img
                src={avatarUrl}
                alt="Member Avatar"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </button>
            <div>
              <div className="flex items-center gap-2 text-white font-bold text-sm tracking-wide">
                <span>UID: {uid || '—'}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (uid) {
                      try {
                        navigator.clipboard?.writeText(uid);
                      } catch {
                        // ignore
                      }
                    }
                    triggerToast(`UID ${uid || ''} copied`.trim());
                  }}
                  className="text-white hover:text-white/80 active:scale-90 transition-transform cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-white text-xs mt-1 font-semibold">
                <span>{nickname}</span>
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="text-white hover:text-white/80 active:scale-90 transition-transform cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right VIP Shield & VIP0 Pill Badge matching screenshot */}
          <div className="flex flex-col items-center">
            {/* Metallic VIP Emblem */}
            <div className="w-12 h-12 relative flex items-center justify-center filter drop-shadow">
              <svg viewBox="0 0 60 60" className="w-full h-full">
                <polygon
                  points="30,4 53,16 53,44 30,56 7,44 7,16"
                  fill="#cbd5e1"
                  stroke="#f1f5f9"
                  strokeWidth="2"
                />
                <polygon
                  points="30,9 48,19 48,41 30,51 12,41 12,19"
                  fill="#3b82f6"
                  opacity="0.9"
                />
                <polygon points="30,17 38,24 35,35 25,35 22,24" fill="#60a5fa" />
                <text
                  x="30"
                  y="34"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  0
                </text>
              </svg>
            </div>
            {/* VIP0 White Rounded Pill Badge with orange text */}
            <div className="bg-white text-[#ff7200] font-display font-black text-[11px] px-3.5 py-0.5 rounded-full shadow mt-1 tracking-wider">
              VIP0
            </div>
          </div>
        </div>
      </div>

      {/* Balance & Deposit / Withdraw Strip (matching screenshot) */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-800/60">
        {/* Left Balance ₹... ↻ */}
        <div className="flex items-center gap-2">
          <span className="font-mono-num font-black text-2xl text-[#ff7200] tracking-tight">
            ₹{balance.toFixed(2)}
          </span>
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 600);
            }}
            className="text-slate-400 hover:text-white cursor-pointer active:scale-90 transition-transform"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#ff7200]' : ''}`} />
          </button>
        </div>

        {/* Right Deposit & Withdraw Actions matching screenshot icons */}
        <div className="flex items-center gap-6">
          {/* Deposit Button with purse icon */}
          <button
            type="button"
            onClick={onOpenDeposit}
            className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-8 h-8">
                <rect x="4" y="10" width="24" height="18" rx="5" fill="#f59e0b" />
                <rect x="6" y="8" width="20" height="4" rx="2" fill="#d97706" />
                <path d="M12 8 C12 4, 20 4, 20 8" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                <ellipse cx="16" cy="18" rx="4" ry="2.5" fill="#fef08a" />
                <circle cx="16" cy="18" r="1.5" fill="#b45309" />
              </svg>
            </div>
            <span className="text-xs text-slate-300 font-medium">{t('deposit')}</span>
          </button>

          {/* Withdraw Button with green wallet card & upward arrow */}
          <button
            type="button"
            onClick={onOpenWithdraw}
            className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-8 h-8">
                <rect x="4" y="12" width="24" height="16" rx="4" fill="#10b981" />
                <rect x="4" y="8" width="18" height="6" rx="2" fill="#059669" />
                <path d="M16 16 L16 3 M12 7 L16 3 L20 7" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xs text-slate-300 font-medium">{t('withdraw')}</span>
          </button>
        </div>
      </div>

      {/* Menu List Rows (1-10 matching screenshot order and clean styling) */}
      <div className="px-4 py-2 space-y-0.5">
        {/* 1. Notifications */}
        <button
          type="button"
          onClick={() => {
            if (onOpenNotifications) {
              onOpenNotifications();
            } else {
              setActiveSubModal('Notifications');
            }
          }}
          className="w-full py-3.5 flex items-center justify-between text-xs font-medium text-slate-200 hover:text-white cursor-pointer active:scale-[0.99] border-b border-white/[0.04]"
        >
          <div className="flex items-center gap-3.5">
            <Bell className="w-5 h-5 text-[#8899aa]" />
            <span className="text-sm text-slate-200">{t('notifications')}</span>
          </div>
          <div className="flex items-center gap-2">
            {unreadNotificationCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#ff7b1b] text-white font-mono-num text-[10px] font-bold">
                {unreadNotificationCount}
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </div>
        </button>

        {/* 2. Coupons */}
        <button
          type="button"
          onClick={() => {
            if (onOpenCoupons) {
              onOpenCoupons();
            } else {
              setActiveSubModal('Coupons');
            }
          }}
          className="w-full py-3.5 flex items-center justify-between text-xs font-medium text-slate-200 hover:text-white cursor-pointer active:scale-[0.99] border-b border-white/[0.04]"
        >
          <div className="flex items-center gap-3.5">
            <Ticket className="w-5 h-5 text-[#8899aa]" />
            <span className="text-sm text-slate-200">{t('coupons')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* 3. Balance Record */}
        <button
          type="button"
          onClick={() => setActiveSubModal('Balance Record')}
          className="w-full py-3.5 flex items-center justify-between text-xs font-medium text-slate-200 hover:text-white cursor-pointer active:scale-[0.99] border-b border-white/[0.04]"
        >
          <div className="flex items-center gap-3.5">
            <CreditCard className="w-5 h-5 text-[#8899aa]" />
            <span className="text-sm text-slate-200">{t('balanceRecord')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* 4. Game History */}
        <button
          type="button"
          onClick={onOpenWinGoHistory}
          className="w-full py-3.5 flex items-center justify-between text-xs font-medium text-slate-200 hover:text-white cursor-pointer active:scale-[0.99] border-b border-white/[0.04]"
        >
          <div className="flex items-center gap-3.5">
            <Gamepad2 className="w-5 h-5 text-[#8899aa]" />
            <span className="text-sm text-slate-200">{t('gameHistory')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* 5. Game Statistics */}
        <button
          type="button"
          onClick={() => setActiveSubModal('Game Statistics')}
          className="w-full py-3.5 flex items-center justify-between text-xs font-medium text-slate-200 hover:text-white cursor-pointer active:scale-[0.99] border-b border-white/[0.04]"
        >
          <div className="flex items-center gap-3.5">
            <PieChart className="w-5 h-5 text-[#8899aa]" />
            <span className="text-sm text-slate-200">{t('gameStats')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* 6. Account & Security */}
        <button
          type="button"
          onClick={() => setActiveSubModal('Account & Security')}
          className="w-full py-3.5 flex items-center justify-between text-xs font-medium text-slate-200 hover:text-white cursor-pointer active:scale-[0.99] border-b border-white/[0.04]"
        >
          <div className="flex items-center gap-3.5">
            <ShieldCheck className="w-5 h-5 text-[#8899aa]" />
            <span className="text-sm text-slate-200">{t('accountSecurity')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* 7. Live Support */}
        <a
          href="https://t.me/xgwin99"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onOpenSupport}
          className="w-full py-3.5 flex items-center justify-between text-xs font-medium text-slate-200 hover:text-white cursor-pointer active:scale-[0.99] border-b border-white/[0.04]"
        >
          <div className="flex items-center gap-3.5">
            <Headphones className="w-5 h-5 text-[#8899aa]" />
            <span className="text-sm text-slate-200">{t('liveSupport')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </a>

        {/* 8. Gifts */}
        <button
          type="button"
          onClick={() => setActiveSubModal('Gifts')}
          className="w-full py-3.5 flex items-center justify-between text-xs font-medium text-slate-200 hover:text-white cursor-pointer active:scale-[0.99] border-b border-white/[0.04]"
        >
          <div className="flex items-center gap-3.5">
            <Gift className="w-5 h-5 text-[#8899aa]" />
            <span className="text-sm text-slate-200">{t('gifts')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* 9. Language (with EN > or current code, opens all countries language modal) */}
        <button
          type="button"
          onClick={() => setLangModalOpen(true)}
          className="w-full py-3.5 flex items-center justify-between text-xs font-medium text-slate-200 hover:text-white cursor-pointer active:scale-[0.99] border-b border-white/[0.04]"
        >
          <div className="flex items-center gap-3.5">
            <Globe className="w-5 h-5 text-[#8899aa]" />
            <span className="text-sm text-slate-200">{t('language')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="text-sm font-semibold text-slate-300 uppercase">
              {currentLangInfo.code.toUpperCase()}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </div>
        </button>

        {/* 10. Settings */}
        <button
          type="button"
          onClick={() => setActiveSubModal('Settings')}
          className="w-full py-3.5 flex items-center justify-between text-xs font-medium text-slate-200 hover:text-white cursor-pointer active:scale-[0.99]"
        >
          <div className="flex items-center gap-3.5">
            <Settings className="w-5 h-5 text-[#8899aa]" />
            <span className="text-sm text-slate-200">{t('settings')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* LOG OUT BUTTON AT THE VERY BOTTOM (matching screenshot orange outline pill) */}
      <div className="px-5 pt-8 pb-10">
        <button
          type="button"
          onClick={() => setLogoutConfirmModal(true)}
          className="w-full py-3 rounded-full border border-[#ff7b1b] bg-transparent text-[#ff7b1b] font-medium text-sm flex items-center justify-center cursor-pointer active:scale-[0.98] transition-all hover:bg-[#ff7b1b]/10 tracking-wide"
        >
          Log out
        </button>
      </div>

      {/* LOGOUT CONFIRMATION MODAL */}
      {logoutConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-5 max-w-[430px] mx-auto animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-[#1c2635] rounded-3xl p-5 border border-white/10 w-full max-w-xs text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3 border border-red-500/30">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white mb-1.5">{t('logoutConfirmTitle')}</h3>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              {t('logoutConfirmDesc')} (UID: {uid || '—'})
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLogoutConfirmModal(false)}
                className="py-2.5 rounded-full bg-[#243042] text-slate-200 text-xs font-bold active:scale-95 cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogoutConfirmModal(false);
                  onLogout();
                }}
                className="py-2.5 rounded-full bg-gradient-to-r from-red-600 to-rose-700 text-white text-xs font-extrabold shadow-lg active:scale-95 cursor-pointer"
              >
                {t('logOut')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL ALL COUNTRY LANGUAGE PICKER MODAL */}
      {langModalOpen && (
        <LanguagePickerModal
          currentLanguage={currentLanguage}
          onClose={() => setLangModalOpen(false)}
          onSelectLanguage={(lang) => {
            onChangeLanguage?.(lang);
            triggerToast(`Language switched to ${getLanguageInfo(lang).nativeName}`);
          }}
        />
      )}

      {avatarModalOpen && (
        <AvatarPickerModal
          currentAvatar={avatarUrl}
          uid={uid}
          onClose={() => setAvatarModalOpen(false)}
          onSaveAvatar={(newAvatar) => {
            onChangeAvatar?.(newAvatar);
            triggerToast('Profile Avatar saved!');
          }}
        />
      )}

      {editingName && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-5 max-w-[430px] mx-auto">
          <div className="bg-[#1c2635] rounded-2xl p-5 border border-white/10 w-full max-w-xs">
            <h3 className="font-bold text-sm text-white mb-3">Edit Member Name</h3>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-[#111923] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mb-4"
            />
            <button
              type="button"
              onClick={() => setEditingName(false)}
              className="w-full py-2 rounded-full bg-gradient-to-r from-[#ff9429] to-[#ff6300] text-white text-xs font-bold cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* SUB-MODALS */}
      {activeSubModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-5 max-w-[430px] mx-auto animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-[#1c2635] rounded-2xl p-5 border border-white/10 w-full max-w-xs shadow-2xl">
            <h3 className="font-bold text-sm text-white mb-3 flex items-center justify-between">
              <span>{activeSubModal}</span>
              <button
                type="button"
                onClick={() => setActiveSubModal(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </h3>

            {/* SETTINGS MODAL (Contains Sound & Language as specifically requested by user) */}
            {activeSubModal === 'Settings' ? (
              <div className="space-y-3.5 mb-4">
                {/* 1. SOUND TOGGLE OPTION */}
                <div className="bg-[#111923] rounded-xl p-3 flex items-center justify-between border border-white/5">
                  <div className="flex items-center gap-3">
                    {soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-[#ff8a1e]" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-slate-500" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-white">{t('sound')}</div>
                      <div className="text-[10px] text-slate-400">{t('soundDesc')}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onToggleSound?.();
                      triggerToast(
                        soundEnabled ? 'Sound Effects muted' : 'Sound Effects enabled'
                      );
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      soundEnabled ? 'bg-[#ff7b1b]' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md absolute top-0.5 ${
                        soundEnabled ? 'left-6.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* 2. LANGUAGE OPTION IN SETTINGS */}
                <div
                  onClick={() => {
                    setActiveSubModal(null);
                    setLangModalOpen(true);
                  }}
                  className="bg-[#111923] rounded-xl p-3 flex items-center justify-between border border-white/5 cursor-pointer hover:bg-white/5 active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-[#38bdf8]" />
                    <div>
                      <div className="text-xs font-bold text-white">{t('language')}</div>
                      <div className="text-[10px] text-slate-400">{t('allCountries')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{currentLangInfo.flag}</span>
                    <span className="text-xs font-bold text-amber-400">
                      {currentLangInfo.nativeName}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>

                {/* 3. CLEAR CACHE */}
                <div
                  onClick={() => triggerToast(t('cacheCleared'))}
                  className="bg-[#111923] rounded-xl p-3 flex items-center justify-between border border-white/5 cursor-pointer hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-xs font-bold text-white">{t('clearCache')}</div>
                      <div className="text-[10px] text-slate-400">14.2 MB cached files</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>

                {/* App Version Info */}
                <div className="text-center pt-1 text-[11px] text-slate-500">
                  {t('appVersion')}: v2.4.1 (Build 2026.10)
                </div>
              </div>
            ) : activeSubModal === 'Balance Record' ? (
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto no-scrollbar">
                {[
                  { type: 'Deposit', amount: '+₹500.00', status: 'Success', time: 'Today 14:22' },
                  { type: 'WinGo Bet', amount: '-₹10.00', status: 'Settled', time: 'Today 12:15' },
                  { type: 'Win Bonus', amount: '+₹19.60', status: 'Credited', time: 'Today 12:15' },
                  { type: 'Aviator Win', amount: '+₹75.40', status: 'Credited', time: 'Yesterday 21:04' },
                ].map((rec, i) => (
                  <div key={i} className="bg-[#111923] rounded-xl p-2.5 flex items-center justify-between border border-white/5">
                    <div>
                      <div className="text-xs font-bold text-white">{rec.type}</div>
                      <div className="text-[10px] text-slate-500 font-mono-num">{rec.time}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-mono-num font-bold ${rec.amount.startsWith('+') ? 'text-[#10b981]' : 'text-red-400'}`}>
                        {rec.amount}
                      </div>
                      <span className="text-[9px] text-slate-400">{rec.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : activeSubModal === 'Game Statistics' ? (
              <div className="space-y-2.5 mb-4">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-[#111923] p-2.5 rounded-xl border border-white/5">
                    <div className="text-[10px] text-slate-400">Total Rounds</div>
                    <div className="text-sm font-bold text-white font-mono-num">142</div>
                  </div>
                  <div className="bg-[#111923] p-2.5 rounded-xl border border-white/5">
                    <div className="text-[10px] text-slate-400">Win Rate</div>
                    <div className="text-sm font-bold text-[#10b981] font-mono-num">68.4%</div>
                  </div>
                </div>
                <div className="bg-[#111923] p-2.5 rounded-xl border border-white/5 text-xs text-slate-300">
                  <span className="text-slate-400">Favorite Game:</span> <b className="text-[#ff8a1e]">WinGo 30S</b>
                </div>
              </div>
            ) : activeSubModal === 'Account & Security' ? (
              <div className="space-y-2 mb-4 text-xs">
                <div className="bg-[#111923] p-2.5 rounded-xl border border-white/5 flex justify-between">
                  <span className="text-slate-400">Mobile Phone:</span>
                  <span className="font-mono-num font-bold text-white">
                    {phone ? `+91 ${phone}` : '—'}
                  </span>
                </div>
                <div className="bg-[#111923] p-2.5 rounded-xl border border-white/5 flex justify-between">
                  <span className="text-slate-400">Security Status:</span>
                  <span className="font-bold text-[#10b981]">High Protection</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPwError('');
                    setPwModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between bg-[#111923] p-2.5 rounded-xl border border-white/5 hover:border-[#ff8a1e]/40 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2 text-slate-200">
                    <Lock className="w-4 h-4 text-[#ff8a1e]" />
                    Change Password
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mb-4">
                10 recent records synced with your UID {uid || '—'}.
              </p>
            )}

            <button
              type="button"
              onClick={() => setActiveSubModal(null)}
              className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#ff9429] to-[#ff6300] text-white text-xs font-bold cursor-pointer shadow-md"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {pwModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-5 max-w-[430px] mx-auto">
          <div className="bg-[#1c2635] rounded-2xl p-5 border border-white/10 w-full max-w-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#ff8a1e]" />
                Change Password
              </h3>
              <button
                type="button"
                onClick={closePwModal}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="relative">
                <input
                  type={showOldPw ? 'text' : 'password'}
                  value={oldPw}
                  onChange={(e) => setOldPw(e.target.value)}
                  placeholder="Current password"
                  className="w-full bg-[#111923] border border-white/10 rounded-xl px-3 py-2.5 pr-10 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#ff8a1e]/60"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                >
                  {showOldPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="New password (min 6 chars)"
                  className="w-full bg-[#111923] border border-white/10 rounded-xl px-3 py-2.5 pr-10 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#ff8a1e]/60"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <input
                type={showNewPw ? 'text' : 'password'}
                value={confirmNewPw}
                onChange={(e) => setConfirmNewPw(e.target.value)}
                placeholder="Confirm new password"
                className="w-full bg-[#111923] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#ff8a1e]/60"
              />

              {pwError && (
                <p className="text-[11px] text-red-400 leading-snug">{pwError}</p>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={closePwModal}
                className="flex-1 py-2.5 rounded-full bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pwSubmitting}
                onClick={handleChangePassword}
                className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-[#ff9429] to-[#ff6300] text-white font-bold text-xs cursor-pointer shadow-md disabled:opacity-60"
              >
                {pwSubmitting ? 'Updating…' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center max-w-[430px] mx-auto">
          <div className="bg-black/85 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
};

