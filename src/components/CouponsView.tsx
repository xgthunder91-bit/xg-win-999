import React, { useState } from 'react';
import {
  ChevronLeft,
  Ticket,
  Copy,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export interface CouponItem {
  id: string;
  code: string;
  amount: number;
  title: string;
  condition: string;
  expiryDate: string;
  status: 'unused' | 'used' | 'expired';
}

interface CouponsViewProps {
  onBack: () => void;
  onApplyBonus: (amount: number, couponTitle: string) => void;
  onOpenGame?: () => void;
}

const DEFAULT_COUPONS: CouponItem[] = [
  {
    id: 'cpn-1',
    code: 'WELCOME50',
    amount: 50,
    title: 'Newbie Welcome Gift Voucher',
    condition: 'Applicable on WinGo 30S & Aviator · No wager required',
    expiryDate: '2026-10-31 23:59:59',
    status: 'unused',
  },
  {
    id: 'cpn-2',
    code: 'XGWIN99',
    amount: 100,
    title: 'XG Win 99 Exclusive Deposit Booster',
    condition: 'Recharge ₹200+ to unlock · Applicable on all games',
    expiryDate: '2026-11-15 23:59:59',
    status: 'unused',
  },
  {
    id: 'cpn-3',
    code: 'VIP999',
    amount: 20,
    title: 'Daily VIP Activity Reward',
    condition: 'Daily login bonus · Unlimited withdrawable credits',
    expiryDate: '2026-10-25 23:59:59',
    status: 'unused',
  },
];

export const CouponsView: React.FC<CouponsViewProps> = ({
  onBack,
  onApplyBonus,
  onOpenGame,
}) => {
  const [coupons, setCoupons] = useState<CouponItem[]>(() => {
    try {
      const saved = localStorage.getItem('xgwin99_coupons');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_COUPONS;
  });

  const [activeTab, setActiveTab] = useState<'unused' | 'used' | 'expired'>('unused');
  const [inputCode, setInputCode] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const saveCoupons = (newList: CouponItem[]) => {
    setCoupons(newList);
    try {
      localStorage.setItem('xgwin99_coupons', JSON.stringify(newList));
    } catch {
      // ignore
    }
  };

  const handleRedeemCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inputCode.trim().toUpperCase();
    if (!cleanCode) {
      showToast('Please enter a coupon code');
      return;
    }

    // Check if code already redeemed or exists
    const existing = coupons.find((c) => c.code === cleanCode);
    if (existing) {
      if (existing.status === 'used') {
        showToast('This coupon code has already been used');
        return;
      }
      showToast(`Coupon already in your list: ₹${existing.amount}`);
      setInputCode('');
      return;
    }

    // Check valid promo codes
    if (cleanCode === 'XGWIN99' || cleanCode === 'XG99') {
      const newCpn: CouponItem = {
        id: `cpn-${Date.now()}`,
        code: cleanCode,
        amount: 100,
        title: 'XG Win 99 Official Promotion Bonus',
        condition: 'Valid on WinGo & Aviator · Instant credit',
        expiryDate: '2026-11-30 23:59:59',
        status: 'unused',
      };
      saveCoupons([newCpn, ...coupons]);
      setInputCode('');
      showToast('Success! ₹100 Coupon added to your wallet');
    } else if (cleanCode === 'WINBONUS' || cleanCode === 'BONUS88') {
      const newCpn: CouponItem = {
        id: `cpn-${Date.now()}`,
        code: cleanCode,
        amount: 88,
        title: 'Lucky Red Envelope Special Coupon',
        condition: 'Valid for all lottery games',
        expiryDate: '2026-11-20 23:59:59',
        status: 'unused',
      };
      saveCoupons([newCpn, ...coupons]);
      setInputCode('');
      showToast('Success! ₹88 Coupon added');
    } else {
      showToast('Invalid or expired coupon code');
    }
  };

  const handleUseCoupon = (coupon: CouponItem) => {
    const updated = coupons.map((c) =>
      c.id === coupon.id ? { ...c, status: 'used' as const } : c
    );
    saveCoupons(updated);
    onApplyBonus(coupon.amount, coupon.title);
    showToast(`Bonus ₹${coupon.amount} credited to your balance!`);
  };

  const unusedCount = coupons.filter((c) => c.status === 'unused').length;
  const filteredList = coupons.filter((c) => c.status === activeTab);

  return (
    <div className="min-h-screen bg-[#111923] text-white flex flex-col select-none relative">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#111923] px-4 py-3.5 flex items-center justify-between border-b border-white/5">
        <button
          type="button"
          onClick={onBack}
          className="p-1 text-slate-200 active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-base font-bold text-white">Coupons</h1>
        <div className="w-6" />
      </header>

      {/* Coupon Code Redemption Input Strip (01:14 in video) */}
      <div className="p-3.5 bg-[#182230] border-b border-white/5">
        <form onSubmit={handleRedeemCode} className="flex items-center gap-2">
          <div className="flex-1 bg-[#111923] border border-slate-700/80 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-[#ff8a1e] shrink-0" />
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Please enter the coupon code"
              className="w-full bg-transparent text-xs text-white uppercase placeholder:normal-case placeholder:text-slate-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff9a2e] to-[#ff6300] text-white font-bold text-xs shadow-md active:scale-95 cursor-pointer shrink-0"
          >
            Exchange
          </button>
        </form>
        <div className="text-[10px] text-slate-400 mt-2 px-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
          <span>Try codes: <b className="text-amber-400 font-mono-num">WELCOME50</b>, <b className="text-amber-400 font-mono-num">XGWIN99</b></span>
        </div>
      </div>

      {/* Tabs: Unused, Used, Expired */}
      <div className="bg-[#182230] px-4 pt-1 border-b border-white/5">
        <div className="flex">
          {(
            [
              { key: 'unused', label: 'Unused', count: unusedCount },
              { key: 'used', label: 'Used' },
              { key: 'expired', label: 'Expired' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-xs font-bold text-center relative cursor-pointer transition-colors ${
                activeTab === tab.key
                  ? 'text-[#ff8a1e]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {'count' in tab && tab.count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-[#ff7b1b] text-white text-[10px] font-mono-num font-bold">
                  {tab.count}
                </span>
              )}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-[#ff8a1e] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Coupon Cards List */}
      <div className="flex-1 p-3.5 space-y-3.5 overflow-y-auto">
        {filteredList.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-full bg-[#1a2332] flex items-center justify-center text-slate-600 mb-4 border border-white/5">
              <Ticket className="w-12 h-12 stroke-[1.2]" />
            </div>
            <div className="text-sm font-semibold text-slate-300">No data</div>
            <div className="text-xs text-slate-500 mt-1 max-w-[220px]">
              {activeTab === 'unused'
                ? 'No unused coupons right now. Enter a redemption code above to get bonuses!'
                : activeTab === 'used'
                  ? 'No used coupons yet'
                  : 'No expired coupons'}
            </div>
          </div>
        ) : (
          filteredList.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl overflow-hidden flex border shadow-lg relative ${
                item.status === 'unused'
                  ? 'border-amber-500/30 bg-[#1a2332]'
                  : 'border-white/5 bg-[#161e2b] opacity-60'
              }`}
            >
              {/* Left Stub with Notches */}
              <div
                className={`w-28 p-3 flex flex-col items-center justify-center text-center relative shrink-0 ${
                  item.status === 'unused'
                    ? 'bg-gradient-to-br from-[#ff9a2e] via-[#ea580c] to-[#b45309] text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {/* Circular punch cutouts */}
                <div className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-[#111923]" />
                <div className="absolute -bottom-2.5 -right-2.5 w-5 h-5 rounded-full bg-[#111923]" />

                <div className="text-[10px] font-bold tracking-wider uppercase opacity-90">
                  Voucher
                </div>
                <div className="font-mono-num font-black text-2xl my-0.5 tracking-tight">
                  ₹{item.amount}
                </div>
                <div className="text-[9px] font-mono-num opacity-80">
                  {item.code}
                </div>
              </div>

              {/* Dashed vertical separator */}
              <div className="border-r border-dashed border-white/20" />

              {/* Right Details Container */}
              <div className="flex-1 p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <h3 className="text-xs font-bold text-white leading-tight">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-snug line-clamp-2">
                    {item.condition}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/5 mt-2">
                  <div className="text-[9px] font-mono-num text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>Exp: {item.expiryDate.split(' ')[0]}</span>
                  </div>

                  {item.status === 'unused' ? (
                    <button
                      type="button"
                      onClick={() => handleUseCoupon(item)}
                      className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#ff9a2e] to-[#ff6300] text-white text-[11px] font-bold shadow active:scale-95 cursor-pointer"
                    >
                      Use Now
                    </button>
                  ) : item.status === 'used' ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      Redeemed
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-400 text-[10px] font-bold">
                      Expired
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center max-w-[430px] mx-auto">
          <div className="bg-black/85 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl border border-white/10">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
};
