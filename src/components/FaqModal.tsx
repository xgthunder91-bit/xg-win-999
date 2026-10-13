import React, { useState, useEffect } from 'react';
import {
  X,
  HelpCircle,
  ChevronDown,
  Search,
  CreditCard,
  ArrowUpRight,
  Gift,
  Send,
} from 'lucide-react';

export type FaqCategory = 'all' | 'deposits' | 'withdrawals' | 'bonus';

interface FaqItem {
  id: string;
  category: Exclude<FaqCategory, 'all'>;
  question: string;
  answer: string;
  highlight?: string;
}

const FAQ_ITEMS: FaqItem[] = [
  // DEPOSITS
  {
    id: 'dep-1',
    category: 'deposits',
    question: 'What is the minimum and maximum deposit amount?',
    answer:
      'On XG Win 99, the minimum deposit amount is ₹100 and the maximum is ₹50,000 per transaction. You can recharge using UPI-QR, Innate UPI-QR, PayTM, USDT, or ARPay.',
    highlight: 'Min: ₹100 • Max: ₹50,000',
  },
  {
    id: 'dep-2',
    category: 'deposits',
    question: 'How long does it take for my deposit to be credited?',
    answer:
      'Each deposit is automatically credited within 1 to 5 minutes after successful payment. Please return to the XG Win 99 deposit page to refresh your balance. If your deposit does not arrive within 30 minutes, contact our 24/7 support on Telegram (@xgwin99) with your UTR/Reference number.',
    highlight: 'Credited in 1–5 Minutes',
  },
  {
    id: 'dep-3',
    category: 'deposits',
    question: 'Can I reuse a saved QR code or modify the payment amount?',
    answer:
      'No. Never reuse saved UPI QR codes or bank details from previous transactions, and do not modify the exact deposit order amount. Always create a fresh payment request on the Deposit page to avoid delays.',
  },
  // WITHDRAWALS
  {
    id: 'wit-1',
    category: 'withdrawals',
    question: 'What are the withdrawal limits and daily withdrawal hours?',
    answer:
      'You can withdraw between ₹110.00 and ₹50,000.00 per transaction via Bank Card or USDT. Withdrawals are open 24 hours a day (00:00–23:59), with up to 3 withdrawals allowed per day.',
    highlight: '₹110 – ₹50,000 • 3 Times/Day',
  },
  {
    id: 'wit-2',
    category: 'withdrawals',
    question: 'Why do I need to complete a betting turnover before withdrawing?',
    answer:
      'To comply with anti-money-laundering and platform security rules, deposited funds require a standard 1x valid betting turnover (and bonus funds require their respective activity turnover) before they move to your Withdrawable balance.',
  },
  {
    id: 'wit-3',
    category: 'withdrawals',
    question: 'How fast are withdrawals credited to my Bank or USDT wallet?',
    answer:
      'Most withdrawals are reviewed and paid out within 5 to 30 minutes. During peak banking hours or bank maintenance, it may take up to 2 hours. Make sure your Bank Card IFSC and account number or USDT address are accurate.',
    highlight: 'Fast 5–30 Min Payouts',
  },
  // BONUS RULES
  {
    id: 'bon-1',
    category: 'bonus',
    question: 'How do Deposit Bonus tiers work on XG Win 99?',
    answer:
      'When you select preset recharge amounts, you get an instant extra bonus: ₹100 (+₹15), ₹200–₹400 (+₹29), ₹500–₹600 (+₹59), ₹1,000–₹2,000 (+₹109), ₹3,000–₹5,000 (+₹229), ₹10,000–₹30,000 (+₹599), and ₹50,000 (+₹2,999).',
    highlight: 'Up to +₹2,999 Instant Bonus',
  },
  {
    id: 'bon-2',
    category: 'bonus',
    question: 'How do I get spins on the Lucky Deposit Wheel?',
    answer:
      'Qualifying single or cumulative daily deposits unlock free spin attempts across Bronze, Silver, Gold, and Diamond Wheels. Spin to win guaranteed cash bonuses up to ₹10,000 and special rewards!',
  },
  {
    id: 'bon-3',
    category: 'bonus',
    question: 'How do Daily Check-In, Red Envelope Rain & Referral bonuses work?',
    answer:
      'After completing your first deposit, check in for 7 consecutive days to claim up to ₹7,777. Red Envelope Rain runs every hour 24/7 on the home page, and inviting friends via your exclusive QR/link earns daily multi-tier agency commissions.',
    highlight: 'Up to ₹7,777 Check-In + Hourly Rain',
  },
];

interface FaqModalProps {
  isOpen: boolean;
  initialCategory?: FaqCategory;
  onClose: () => void;
  onOpenSupport?: () => void;
}

export const FaqModal: React.FC<FaqModalProps> = ({
  isOpen,
  initialCategory = 'all',
  onClose,
  onOpenSupport,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openId, setOpenId] = useState<string | null>('dep-1');

  useEffect(() => {
    if (isOpen) {
      setSelectedCategory(initialCategory);
      const firstMatch = FAQ_ITEMS.find(
        (item) => initialCategory === 'all' || item.category === initialCategory
      );
      setOpenId(firstMatch ? firstMatch.id : null);
    }
  }, [isOpen, initialCategory]);

  if (!isOpen) return null;

  const filteredFaqs = FAQ_ITEMS.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const getCategoryBadge = (category: Exclude<FaqCategory, 'all'>) => {
    switch (category) {
      case 'deposits':
        return {
          label: 'Deposits',
          icon: <CreditCard className="w-3 h-3" />,
          color: 'bg-[#ff7b1b]/15 text-[#ff8a1e] border-[#ff7b1b]/30',
        };
      case 'withdrawals':
        return {
          label: 'Withdrawals',
          icon: <ArrowUpRight className="w-3 h-3" />,
          color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        };
      case 'bonus':
        return {
          label: 'Bonus Rules',
          icon: <Gift className="w-3 h-3" />,
          color: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 max-w-[430px] mx-auto select-none">
      <div className="bg-[#161f2c] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Top Modal Header */}
        <div className="bg-gradient-to-r from-[#1c2635] via-[#233044] to-[#1c2635] px-4 py-3.5 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff9429] to-[#ff6300] flex items-center justify-center text-white shadow-md">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-sm text-white leading-tight">
                XG Win 99 — Help &amp; FAQ Center
              </h2>
              <p className="text-[11px] text-slate-400">
                Deposits, Withdrawals &amp; Bonus Rules
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input + Category Filter Tabs */}
        <div className="p-3.5 pb-2.5 bg-[#111923]/90 border-b border-white/5 space-y-2.5 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deposit, withdrawal, or bonus questions..."
              className="w-full bg-[#1c2635] border border-slate-700/80 focus:border-[#ff8a1e] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'deposits', label: 'Deposits' },
                { id: 'withdrawals', label: 'Withdraw' },
                { id: 'bonus', label: 'Bonuses' },
              ] as { id: FaqCategory; label: string }[]
            ).map((tab) => {
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-[#ff9429] to-[#ff6300] text-white shadow'
                      : 'bg-[#1c2635] text-slate-300 hover:bg-[#232f42] border border-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Accordion FAQ List */}
        <div className="p-3.5 overflow-y-auto space-y-2.5 flex-1">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-8 px-4">
              <HelpCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-300">
                No matching questions found
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Try clearing your search or contact our 24/7 Telegram support below.
              </p>
            </div>
          ) : (
            filteredFaqs.map((item) => {
              const isExpanded = openId === item.id;
              const badge = getCategoryBadge(item.category);
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border transition-colors overflow-hidden ${
                    isExpanded
                      ? 'bg-[#1c2635] border-[#ff8a1e]/50 shadow-md'
                      : 'bg-[#1a2332]/90 border-white/5 hover:border-white/10'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(isExpanded ? null : item.id)}
                    className="w-full p-3 text-left flex items-start justify-between gap-2.5 cursor-pointer"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.color}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                        {item.highlight && (
                          <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-mono-num font-bold text-slate-300">
                            {item.highlight}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-white leading-snug">
                        {item.question}
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full bg-[#111923] flex items-center justify-center text-slate-400 shrink-0 mt-0.5 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180 text-[#ff8a1e]' : ''
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-white/5 text-xs text-slate-300 leading-relaxed">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Support CTA */}
        <div className="p-3.5 bg-[#111923] border-t border-white/10 shrink-0 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
            <span>Still need help with your account?</span>
            <span className="font-mono-num font-bold text-[#38bdf8]">@xgwin99</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <a
              href="https://t.me/xgwin99"
              target="_blank"
              rel="noopener noreferrer"
              onClick={onOpenSupport}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#0284c7] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95 transition-transform"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram Support</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-3 rounded-xl bg-[#232e3e] border border-white/10 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
            >
              <span>Got It, Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
