/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell,
  X,
  Headphones,
  Send,
  HelpCircle,
} from 'lucide-react';
import {
  MaanWinLogo,
  TreasureChestIcon,
  NavHomeIcon,
  NavPromoIcon,
  NavEarnIcon,
  NavProfileIcon,
  xgWin99LogoImg,
} from './components/BrandLogo';
import {
  HeroBannerSlide,
  PopularGameCard,
  POPULAR_GAMES_LIST,
  userAvatarImg,
  DP_AVATARS,
  homeDailyCheckinImg,
  homeDepositWheelImg,
} from './components/GameArtwork';
import { HomeSections } from './components/HomeSections';
import { WinGoGame } from './components/WinGoGame';
import { AviatorGame } from './components/AviatorGame';
import { ChickenRoadGame } from './components/ChickenRoadGame';
import { PaymentView } from './components/PaymentViews';
import { DepositWheelView } from './components/DepositWheelView';
import { AuthView } from './components/AuthView';
import { AdminPanel } from './components/AdminPanel';
import {
  ShareTabView,
  PromotionsView,
  EarnView,
  ProfileView,
  AvatarPickerModal,
} from './components/PromoEarnProfileViews';
import { NotificationView, NotificationItem } from './components/NotificationView';
import { CouponsView } from './components/CouponsView';
import { FaqModal, FaqCategory } from './components/FaqModal';
import {
  LowBalanceTopUpModal,
  type TopUpOffer,
} from './components/LowBalanceTopUpModal';
import { WelcomeBonusModal } from './components/WelcomeBonusModal';
import {
  SupportedLanguage,
  getTranslation,
  getLanguageInfo,
} from './utils/i18n';
import { apiPost } from './utils/api';
import {
  setTrackUser,
  reportBalanceDelta,
  reportTxn,
  sendHeartbeat,
  fetchUser,
} from './utils/track';

type ActiveScreen =
  | 'home'
  | 'promo'
  | 'shareTab'
  | 'earn'
  | 'profile'
  | 'login'
  | 'register'
  | 'wingo'
  | 'aviator'
  | 'chicken'
  | 'deposit'
  | 'withdraw'
  | 'depositWheel'
  | 'notifications'
  | 'coupons';

function parsePathToRoute(pathname: string): {
  screen: ActiveScreen;
  wingoMode?: '30s' | '1m' | '3m' | '5m';
} {
  const lower = pathname.toLowerCase();
  if (lower.startsWith('/login')) return { screen: 'login' };
  if (lower.startsWith('/register')) return { screen: 'register' };
  if (lower.startsWith('/activity')) return { screen: 'promo' };
  if (lower.startsWith('/sharetab')) return { screen: 'shareTab' };
  if (lower.startsWith('/earn')) return { screen: 'earn' };
  if (lower.startsWith('/main')) return { screen: 'profile' };
  if (lower.startsWith('/notifications') || lower.startsWith('/message'))
    return { screen: 'notifications' };
  if (lower.startsWith('/coupons') || lower.startsWith('/voucher'))
    return { screen: 'coupons' };
  if (lower.includes('/wingo/wingo_1m')) return { screen: 'wingo', wingoMode: '1m' };
  if (lower.includes('/wingo/wingo_3m')) return { screen: 'wingo', wingoMode: '3m' };
  if (lower.includes('/wingo/wingo_5m')) return { screen: 'wingo', wingoMode: '5m' };
  if (lower.includes('/wingo')) return { screen: 'wingo', wingoMode: '30s' };
  if (lower.startsWith('/wallet/recharge')) return { screen: 'deposit' };
  if (lower.startsWith('/wallet/withdraw')) return { screen: 'withdraw' };
  if (lower.startsWith('/deposit-wheel') || lower.startsWith('/wheel')) return { screen: 'depositWheel' };
  if (lower.startsWith('/aviator')) return { screen: 'aviator' };
  if (lower.startsWith('/chicken')) return { screen: 'chicken' };
  return { screen: 'home' };
}

function getPathForRoute(
  screen: ActiveScreen,
  wingoMode: '30s' | '1m' | '3m' | '5m' = '30s'
): string {
  switch (screen) {
    case 'login':
      return '/login?type=0';
    case 'register':
      return '/register';
    case 'promo':
      return '/activity';
    case 'shareTab':
      return '/shareTab';
    case 'earn':
      return '/earn';
    case 'profile':
      return '/main';
    case 'notifications':
      return '/notifications';
    case 'coupons':
      return '/coupons';
    case 'wingo':
      return wingoMode === '1m'
        ? '/WinGo/WinGo_1M'
        : wingoMode === '3m'
          ? '/WinGo/WinGo_3M'
          : wingoMode === '5m'
            ? '/WinGo/WinGo_5M'
            : '/WinGo/WinGo_30S';
    case 'deposit':
      return '/wallet/recharge';
    case 'withdraw':
      return '/wallet/withdraw';
    case 'depositWheel':
      return '/deposit-wheel';
    case 'aviator':
      return '/aviator';
    case 'chicken':
      return '/chicken-road';
    default:
      return '/';
  }
}

export default function App() {
  const initialRoute = parsePathToRoute(window.location.pathname);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem('xgwin99_user_id');
    } catch {
      return false;
    }
  });
  // Starts at 0 so the real wallet balance from the backend never gets masked
// by a placeholder while the session is being restored.
const [balance, setBalance] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('xgwin99_user_id');
    } catch {
      return null;
    }
  });
  const [userUid, setUserUid] = useState<string>(() => {
    try {
      return localStorage.getItem('xgwin99_user_uid') || '';
    } catch {
      return '';
    }
  });
  const [userPhone, setUserPhone] = useState<string>(() => {
    try {
      return localStorage.getItem('xgwin99_user_phone') || '';
    } catch {
      return '';
    }
  });
  const screenRef = useRef<ActiveScreen>(initialRoute.screen);
  const avatarRef = useRef<string>('');
  const getAbsoluteAvatar = () => {
    try {
      return new URL(avatarRef.current, window.location.origin).href;
    } catch {
      return avatarRef.current;
    }
  };
  const [userAvatar, setUserAvatar] = useState<string>(() => {
    try {
      const savedIdx = Number(localStorage.getItem('maanwin_user_avatar_idx'));
      if (!Number.isNaN(savedIdx) && savedIdx >= 0 && savedIdx < DP_AVATARS.length) {
        return DP_AVATARS[savedIdx];
      }
    } catch {
      // ignore storage errors
    }
    return userAvatarImg;
  });
  useEffect(() => {
    avatarRef.current = userAvatar;
  }, [userAvatar]);
  const [homeAvatarModalOpen, setHomeAvatarModalOpen] = useState<boolean>(false);
  const [screen, setScreen] = useState<ActiveScreen>(initialRoute.screen);
  const [wingoMode, setWingoMode] = useState<'30s' | '1m' | '3m' | '5m'>(
    initialRoute.wingoMode || '30s'
  );
  const [bannerIndex, setBannerIndex] = useState<number>(0);
  const [showDownloadBar, setShowDownloadBar] = useState<boolean>(true);
  const [popularViewAll, setPopularViewAll] = useState<boolean>(false);
  const [depositReturnScreen, setDepositReturnScreen] = useState<ActiveScreen>('home');

  /* ------------------------------------------------------------------ */
  /* Low-balance top-up nudge                                            */
  /* ------------------------------------------------------------------ */
  const LOW_BALANCE_THRESHOLD = 10;
  const [topUpPrompt, setTopUpPrompt] = useState<boolean>(false);
  const [topUpPendingTarget, setTopUpPendingTarget] = useState<ActiveScreen>('home');
  const [depositPresetAmount, setDepositPresetAmount] = useState<number | undefined>(undefined);

  /** Welcome-bonus wallet state (locked amount + withdraw unlock rule). */
  const [welcomeBonus, setWelcomeBonus] = useState<{
    amount: number;
    unlockTarget: number;
  } | null>(null);
  const [wallet, setWallet] = useState({
    bonusLocked: 0,
    depositedTotal: 0,
    withdrawable: 0,
    withdrawUnlocked: false,
    bonusUnlockTarget: 100,
  });

  /** Each trigger fires once, then stays quiet for a day. */
  const TOP_UP_REASON_KEY = {
    exit: 'xgwin99_topup_seen_exit',
    login: 'xgwin99_topup_seen_login',
  } as const;
  const TOP_UP_COOLDOWN_MS = 24 * 60 * 60 * 1000;
  const TOP_UP_AWAY_MS = 2 * 60 * 60 * 1000;

  const TOP_UP_OFFERS: TopUpOffer[] = [
    { amount: 100, bonus: 15 },
    { amount: 500, bonus: 59 },
    { amount: 1000, bonus: 109 },
    { amount: 2000, bonus: 109 },
    { amount: 5000, bonus: 229 },
  ];

  const canShowTopUp = (reason: keyof typeof TOP_UP_REASON_KEY) => {
    try {
      const last = Number(localStorage.getItem(TOP_UP_REASON_KEY[reason]) || 0);
      if (last && Date.now() - last < TOP_UP_COOLDOWN_MS) return false;
      if (localStorage.getItem('xgwin99_topup_mute_date') === new Date().toDateString()) {
        return false;
      }
    } catch {
      /* storage blocked - allow the nudge */
    }
    return true;
  };

  const markTopUpShown = (reason: keyof typeof TOP_UP_REASON_KEY) => {
    try {
      localStorage.setItem(TOP_UP_REASON_KEY[reason], String(Date.now()));
    } catch {
      /* ignore */
    }
  };

  // Multi-language & Sound settings state
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem('xgwin99_lang') as SupportedLanguage;
      if (saved) return saved;
    } catch {
      // ignore
    }
    return 'en';
  });

  const handleSetLanguage = (lang: SupportedLanguage) => {
    setLanguage(lang);
    try {
      localStorage.setItem('xgwin99_lang', lang);
    } catch {
      // ignore
    }
  };

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('xgwin99_sound');
      if (saved !== null) return saved === 'true';
    } catch {
      // ignore
    }
    return true;
  });

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('xgwin99_sound', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const t = (key: string) => getTranslation(language, key);

  // Notifications state with initial Welcome Message from XG Win 99
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('xgwin99_notifications');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'msg-welcome-1',
        title: 'Welcome to XG Win 99!',
        time: '2026-10-12 17:24',
        summary:
          'Welcome to XG Win 99! Experience fair lottery gaming with WinGo 30S, Aviator, and instant 24/7 withdrawals.',
        content: `Dear Member,

Welcome to XG Win 99! We are thrilled to welcome you to our official online lottery and entertainment platform.

Here are some quick highlights to start winning:
• WinGo 30S: Ultra-fast lottery prediction with verified fair cryptographic results.
• Aviator: High-flying multiplayer crash game with cashout multipliers up to 100x+.
• Instant Deposits & Fast Withdrawals: Recharge easily using UPI, QR Code, Paytm, PhonePe, or USDT.
• Hourly Red Envelope Rain: Free cash bonuses dropping every hour around the clock.
• Up to 85% Referral Commission: Invite friends and build lifetime passive income.

Need assistance? Our official Customer Support is available 24/7 on Telegram: @xgwin99.

Wishing you big wins and good fortune!

Best regards,
XG Win 99 Official Management`,
        isRead: false,
        type: 'user',
      },
    ];
  });

  const saveNotifications = (newList: NotificationItem[]) => {
    setNotifications(newList);
    try {
      localStorage.setItem('xgwin99_notifications', JSON.stringify(newList));
    } catch {
      // ignore
    }
  };

  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    saveNotifications(updated);
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    saveNotifications(updated);
  };

  const handleDeleteNotification = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    saveNotifications(updated);
  };

  // Interactive Modals
  const [checkInModal, setCheckInModal] = useState<boolean>(false);
  const [wheelModal, setWheelModal] = useState<boolean>(false);
  const [wheelSpinning, setWheelSpinning] = useState<boolean>(false);
  const [supportModal, setSupportModal] = useState<boolean>(false);
  const [faqModalOpen, setFaqModalOpen] = useState<boolean>(false);
  const [faqCategory, setFaqCategory] = useState<FaqCategory>('all');
  const [detailsModal, setDetailsModal] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 2200);
  }, []);

  const openFaqWithCategory = (category: FaqCategory = 'all') => {
    setFaqCategory(category);
    setFaqModalOpen(true);
  };

  const handleSaveAvatar = (newAvatar: string) => {
    setUserAvatar(newAvatar);
    try {
      const idx = DP_AVATARS.indexOf(newAvatar);
      if (idx !== -1) {
        localStorage.setItem('maanwin_user_avatar_idx', String(idx));
      }
    } catch {
      // ignore storage errors
    }
  };

  const navigateTo = useCallback(
    (nextScreen: ActiveScreen, nextWingoMode?: '30s' | '1m' | '3m' | '5m') => {
      const protectedScreens: ActiveScreen[] = ['wingo', 'aviator', 'chicken', 'deposit', 'withdraw'];
      let target = nextScreen;
      if (!isLoggedIn && protectedScreens.includes(nextScreen)) {
        showToast('Please login to continue');
        target = 'login';
      }
      const modeToUse = nextWingoMode || wingoMode;
      if (nextWingoMode) {
        setWingoMode(nextWingoMode);
      }
      setScreen(target);
      const targetUrl = getPathForRoute(target, modeToUse);
      if (window.location.pathname + window.location.search !== targetUrl) {
        window.history.pushState({}, '', targetUrl);
      }
      window.scrollTo(0, 0);
    },
    [wingoMode, isLoggedIn, showToast]
  );

  /**
   * Leaving a game / money section while the wallet is nearly empty pops the
   * top-up offer once. Skipped when the player is already heading to a money
   * screen, is logged out, muted it, or has already seen it today.
   */
  const leaveTo = useCallback(
    (target: ActiveScreen) => {
      const moneyScreens: ActiveScreen[] = ['deposit', 'withdraw', 'login', 'register'];
      const shouldNudge =
        isLoggedIn &&
        canShowTopUp('exit') &&
        balance < LOW_BALANCE_THRESHOLD &&
        !moneyScreens.includes(target);

      if (shouldNudge) {
        markTopUpShown('exit');
        setTopUpPendingTarget(target);
        setTopUpPrompt(true);
        return;
      }
      navigateTo(target);
    },
    [balance, isLoggedIn, navigateTo]
  );

  const closeTopUp = useCallback(() => {
    setTopUpPrompt(false);
    navigateTo(topUpPendingTarget);
  }, [navigateTo, topUpPendingTarget]);

  const goDepositWith = useCallback(
    (amount: number) => {
      setTopUpPrompt(false);
      setDepositPresetAmount(amount);
      setDepositReturnScreen(topUpPendingTarget);
      navigateTo('deposit');
    },
    [navigateTo, topUpPendingTarget]
  );

  useEffect(() => {
    const handlePopState = () => {
      const parsed = parsePathToRoute(window.location.pathname);
      if (parsed.wingoMode) {
        setWingoMode(parsed.wingoMode);
      }
      setScreen(parsed.screen);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Require a valid session before entering games / money screens (e.g. direct URL loads)
  const PROTECTED_SCREENS: ActiveScreen[] = ['wingo', 'aviator', 'chicken', 'deposit', 'withdraw'];
  useEffect(() => {
    if (!isLoggedIn && PROTECTED_SCREENS.includes(screen)) {
      navigateTo('login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, screen, navigateTo]);

  // Keep the current screen in a ref so the balance reporter can tag transactions
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  // Keep the tracking module aware of the logged-in user
  useEffect(() => {
    if (userId) {
      setTrackUser(userId);
      try {
        localStorage.setItem('xgwin99_user_id', userId);
      } catch {
        // ignore
      }
    } else {
      setTrackUser(null);
    }
  }, [userId]);

  // Persist the displayed profile identity (uid / phone) for instant display after reload
  useEffect(() => {
    try {
      if (userUid) localStorage.setItem('xgwin99_user_uid', userUid);
      if (userPhone) localStorage.setItem('xgwin99_user_phone', userPhone);
    } catch {
      // ignore
    }
  }, [userUid, userPhone]);

  // On boot, restore the session (wallet balance) from the backend for the stored user
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = (() => {
        try {
          return localStorage.getItem('xgwin99_user_id');
        } catch {
          return null;
        }
      })();
      if (!stored) {
        setIsLoggedIn(false);
        return;
      }
      const res = await fetchUser(stored);
      if (cancelled) return;
      if (!res || !res.success || !res.data) {
        try {
          localStorage.removeItem('xgwin99_user_id');
        } catch {
          // ignore
        }
        setIsLoggedIn(false);
        setUserId(null);
        return;
      }
      setUserId(res.data.id);
      setBalance(res.data.balance);
      setWallet({
        bonusLocked: Number(res.data.bonusLocked) || 0,
        depositedTotal: Number(res.data.depositedTotal) || 0,
        withdrawable: Number(res.data.withdrawable) || 0,
        withdrawUnlocked: !!res.data.withdrawUnlocked,
        bonusUnlockTarget: Number(res.data.bonusUnlockTarget) || 100,
      });
      if (res.data.uid) setUserUid(String(res.data.uid));
      if (res.data.phone) setUserPhone(String(res.data.phone));
      setIsLoggedIn(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Heartbeat so the admin panel can show who is online / which game they are on
  useEffect(() => {
    if (!userId) return;
    sendHeartbeat(userId, screenRef.current, getAbsoluteAvatar());
    const interval = setInterval(async () => {
      const res = await sendHeartbeat(userId, screenRef.current, getAbsoluteAvatar());
      const s = screenRef.current;
      const isGameScreen = s === 'wingo' || s === 'aviator' || s === 'chicken';
      if (res && res.success && res.data && !isGameScreen) {
        setBalance(res.data.balance);
        setWallet((prev) => ({
          ...prev,
          bonusLocked: Number(res.data.bonusLocked) || 0,
          depositedTotal: Number(res.data.depositedTotal) || prev.depositedTotal,
          withdrawable: Number(res.data.withdrawable) || 0,
          withdrawUnlocked: !!res.data.withdrawUnlocked,
          bonusUnlockTarget: Number(res.data.bonusUnlockTarget) || prev.bonusUnlockTarget,
        }));
      }
    }, 25000);
    return () => clearInterval(interval);
  }, [userId]);

  // Coming back after a long break with an almost-empty wallet gets one nudge.
  const awayCheckedRef = useRef(false);
  useEffect(() => {
    if (awayCheckedRef.current) return;
    if (!isLoggedIn) return;
    awayCheckedRef.current = true;

    let lastSeen = 0;
    try {
      lastSeen = Number(localStorage.getItem('xgwin99_last_seen') || 0);
    } catch {
      /* ignore */
    }

    const awayFor = lastSeen ? Date.now() - lastSeen : 0;
    try {
      localStorage.setItem('xgwin99_last_seen', String(Date.now()));
    } catch {
      /* ignore */
    }

    if (awayFor > TOP_UP_AWAY_MS && canShowTopUp('login') && balance < LOW_BALANCE_THRESHOLD) {
      markTopUpShown('login');
      setTopUpPendingTarget('home');
      setTopUpPrompt(true);
    }
  }, [isLoggedIn, balance]);

  // Wrapper that reports stake/win deltas to the backend for admin analytics
  const handleBalanceChange = useCallback<React.Dispatch<React.SetStateAction<number>>>(
    (action) => {
      setBalance((prev) => {
        const next =
          typeof action === 'function' ? (action as (p: number) => number)(prev) : action;
        const delta = +(next - prev).toFixed(2);
        if (Math.abs(delta) >= 0.01) {
          reportBalanceDelta(delta, screenRef.current);
        }
        return next;
      });
    },
    []
  );

  const handleAuthSuccess = useCallback(
    async (
      phone: string,
      password: string,
      authMode: 'login' | 'register',
      inviteCode?: string
    ): Promise<{ ok: boolean; message?: string }> => {
      try {
        const endpoint = authMode === 'register' ? '/user/register' : '/user/login';
        const res = await apiPost(endpoint, { phone, password, inviteCode });
        if (!res || !res.success || !res.data) {
          const message = (res && res.message) || 'Unable to authenticate. Please try again.';
          showToast(message);
          return { ok: false, message };
        }
        setUserId(res.data.id);
        setBalance(res.data.balance);
        if (res.data.uid) setUserUid(String(res.data.uid));
        if (res.data.phone) setUserPhone(String(res.data.phone));
        if (authMode === 'register') {
          setWallet((prev) => ({
            ...prev,
            bonusLocked: Number(res.data.bonusLocked) || 0,
            depositedTotal: Number(res.data.depositedTotal) || 0,
            withdrawUnlocked: !!res.data.withdrawUnlocked,
            withdrawable: Number(res.data.withdrawable) || 0,
            bonusUnlockTarget: Number(res.data.bonusUnlockTarget) || 100,
          }));
          setWelcomeBonus({
            amount: Number(res.data.bonusLocked) || Number(res.data.balance) || 0,
            unlockTarget: Number(res.data.bonusUnlockTarget) || 100,
          });
        }
      } catch {
        const message = 'Unable to connect to the server. Please check your connection.';
        showToast(message);
        return { ok: false, message };
      }

      setIsLoggedIn(true);

      setNotifications((prev) => {
        const hasWelcome = prev.some((n) => n.id === 'msg-welcome-1');
        if (hasWelcome) return prev;
        const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
        const updated: NotificationItem[] = [
          {
            id: 'msg-welcome-1',
            title: 'Welcome to XG Win 99!',
            time: nowStr,
            summary:
              'Welcome to XG Win 99! Experience fair lottery gaming with WinGo 30S, Aviator, and instant 24/7 withdrawals.',
            content: `Dear Member,

Welcome to XG Win 99! We are thrilled to welcome you to our official online lottery and entertainment platform.`,
            isRead: false,
            type: 'user',
          },
          ...prev,
        ];
        try {
          localStorage.setItem('xgwin99_notifications', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });

      showToast(
        authMode === 'register'
          ? 'Registration successful! Welcome to XG Win 99'
          : 'Login successful! Welcome to XG Win 99'
      );
      navigateTo('home');
      return { ok: true };
    },
    [navigateTo]
  );

  useEffect(() => {
    if (screen !== 'home') return;
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % 4);
    }, 3500);
    return () => clearInterval(interval);
  }, [screen]);

  const handleOpenWinGo = (mode: '30s' | '1m' | '3m' | '5m' = '30s') => {
    navigateTo('wingo', mode);
  };

  const handleOpenAviator = () => {
    navigateTo('aviator');
  };

  const handleOpenChickenRoad = () => {
    navigateTo('chicken');
  };

  const handleSpinWheel = () => {
    if (wheelSpinning) return;
    setWheelSpinning(true);
    setTimeout(() => {
      setWheelSpinning(false);
      showToast('Deposit ₹200 more to unlock Lucky Wheel spin!');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#080c11] flex justify-center">
      {window.location.pathname === '/admin' ? (
        <AdminPanel />
      ) : (
      <>
      {/* Strict Mobile Viewport Container matching the video layout */}
      <div className="w-full max-w-[430px] min-h-screen bg-[#111923] text-white relative overflow-x-hidden shadow-2xl border-x border-white/5">
        {screen === 'login' || screen === 'register' ? (
          <AuthView
            initialMode={screen === 'register' ? 'register' : 'login'}
            onBack={() => navigateTo('home')}
            onModeChange={(nextMode) => navigateTo(nextMode)}
            onSuccessLogin={(phone, password, mode, inviteCode) =>
              handleAuthSuccess(phone, password, mode, inviteCode)
            }
            onOpenSupport={() => setSupportModal(true)}
            currentLanguage={language}
            onChangeLanguage={handleSetLanguage}
          />
        ) : screen === 'notifications' ? (
          <NotificationView
            notifications={notifications}
            onBack={() => navigateTo('profile')}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDeleteNotification={handleDeleteNotification}
          />
        ) : screen === 'coupons' ? (
          <CouponsView
            onBack={() => navigateTo('profile')}
            onApplyBonus={(amount, couponTitle) => {
              setBalance((prev) => prev + amount);
              reportTxn('bonus', amount, { source: 'coupon', title: couponTitle });
              showToast(`Bonus ₹${amount} credited from ${couponTitle}!`);
            }}
            onOpenGame={() => handleOpenWinGo('30s')}
          />
        ) : screen === 'wingo' ? (
          <WinGoGame
            initialMode={wingoMode}
            balance={balance}
            onBalanceChange={handleBalanceChange}
            onBack={() => leaveTo('home')}
            onOpenDeposit={() => navigateTo('deposit')}
            onOpenWithdraw={() => navigateTo('withdraw')}
            onOpenSupport={() => setSupportModal(true)}
            onModeChange={(nextMode) => navigateTo('wingo', nextMode)}
          />
        ) : screen === 'aviator' ? (
          <AviatorGame
            balance={isLoggedIn ? balance : 0}
            onBalanceChange={handleBalanceChange}
            onBack={() => leaveTo('home')}
            onOpenDeposit={() => navigateTo('deposit')}
          />
        ) : screen === 'chicken' ? (
          <ChickenRoadGame
            balance={isLoggedIn ? balance : 0}
            onBalanceChange={handleBalanceChange}
            onBack={() => leaveTo('home')}
            onOpenDeposit={() => navigateTo('deposit')}
          />
        ) : screen === 'depositWheel' ? (
          <DepositWheelView
            balance={isLoggedIn ? balance : 5}
            onBack={() => leaveTo('home')}
            onOpenDeposit={() => {
              setDepositReturnScreen('depositWheel');
              navigateTo('deposit');
            }}
          />
        ) : screen === 'deposit' ? (
          <PaymentView
            mode="deposit"
            balance={balance}
            userId={userId || undefined}
            initialAmount={depositPresetAmount}
            onBack={() => {
              const target = depositReturnScreen;
              setDepositReturnScreen('home');
              setDepositPresetAmount(undefined);
              navigateTo(target);
            }}
            onOpenSupport={() => setSupportModal(true)}
            onOpenFaq={() => openFaqWithCategory('deposits')}
            onDepositSuccess={(amount) => {
              setBalance((prev) => prev + amount);
              showToast(`Deposit ₹${amount} verified & credited to your wallet!`);
            }}
          />
        ) : screen === 'withdraw' ? (
          <PaymentView
            mode="withdraw"
            balance={balance}
            userId={userId || undefined}
            onBack={() => navigateTo('home')}
            onOpenSupport={() => setSupportModal(true)}
            onOpenFaq={() => openFaqWithCategory('withdrawals')}
            onOpenDeposit={() => {
              setDepositReturnScreen('withdraw');
              navigateTo('deposit');
            }}
          />
        ) : (
          <>
            {screen === 'promo' && (
              <PromotionsView
                onBack={() => navigateTo('home')}
                onOpenWheel={() => navigateTo('depositWheel')}
                onOpenCheckIn={() => setCheckInModal(true)}
              />
            )}

            {screen === 'shareTab' && (
              <ShareTabView
                onBack={() => navigateTo('home')}
                onOpenEarn={() => navigateTo('earn')}
              />
            )}

            {screen === 'earn' && (
              <EarnView
                onBack={() => navigateTo('home')}
                onOpenShareTab={() => navigateTo('shareTab')}
              />
            )}

            {screen === 'profile' && (
              <ProfileView
                balance={balance}
                uid={userUid}
                phone={userPhone}
                avatarUrl={userAvatar}
                onChangeAvatar={handleSaveAvatar}
                onOpenDeposit={() => navigateTo('deposit')}
                onOpenWithdraw={() => navigateTo('withdraw')}
                onOpenSupport={() => setSupportModal(true)}
                onOpenFaq={() => openFaqWithCategory('all')}
                onOpenWinGoHistory={() => handleOpenWinGo('30s')}
                onOpenNotifications={() => navigateTo('notifications')}
                onOpenCoupons={() => navigateTo('coupons')}
                unreadNotificationCount={notifications.filter((n) => n.type === 'user' && !n.isRead).length}
                currentLanguage={language}
                onChangeLanguage={handleSetLanguage}
                soundEnabled={soundEnabled}
                onToggleSound={handleToggleSound}
                onLogout={() => {
                  try {
                    localStorage.removeItem('xgwin99_user_id');
                    localStorage.removeItem('xgwin99_user_uid');
                    localStorage.removeItem('xgwin99_user_phone');
                  } catch {
                    // ignore
                  }
                  setUserId(null);
                  setUserUid('');
                  setUserPhone('');
                  setIsLoggedIn(false);
                  navigateTo('login');
                }}
              />
            )}

            {screen === 'home' && (
              <div className="pb-28 select-none">
                {/* Top App Header (00:00 & 00:20 in video) */}
                <header className="sticky top-0 z-30 bg-[#111923]/95 backdrop-blur-md px-3.5 py-3 flex items-center justify-between">
                  <MaanWinLogo size="md" />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openFaqWithCategory('all')}
                      title="Help & FAQ"
                      className="px-2.5 h-9 rounded-full bg-[#1c2635] border border-white/5 flex items-center gap-1 text-slate-200 hover:text-white active:scale-95 cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-[#ff8a1e]" />
                      <span className="text-[11px] font-bold">FAQ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateTo('notifications')}
                      className="w-9 h-9 rounded-full bg-[#1c2635] border border-white/5 flex items-center justify-center text-slate-300 relative active:scale-95 cursor-pointer"
                    >
                      <Bell className="w-4 h-4" />
                      {notifications.filter((n) => n.type === 'user' && !n.isRead).length > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ef4444] shadow-[0_0_6px_#ef4444]" />
                      )}
                    </button>
                  </div>
                </header>

                <main className="px-3.5 space-y-3.5">
                  {/* Wallet / Login-Register Bar (00:00 vs 00:21 in video) */}
                  <div className="bg-[#1c2635] rounded-2xl p-3 flex items-center justify-between border border-white/5 shadow-md">
                    {!isLoggedIn ? (
                      <>
                        <div className="flex items-center gap-2.5">
                          {/* 3D Brown/Orange Wallet Icon with Card */}
                          <svg viewBox="0 0 40 40" className="w-10 h-10 shrink-0">
                            <rect
                              x="6"
                              y="8"
                              width="24"
                              height="16"
                              rx="3"
                              fill="#38bdf8"
                              transform="rotate(-8 18 16)"
                            />
                            <rect
                              x="4"
                              y="12"
                              width="32"
                              height="22"
                              rx="5"
                              fill="#d97706"
                              stroke="#fbbf24"
                              strokeWidth="1.5"
                            />
                            <rect x="24" y="19" width="12" height="8" rx="3" fill="#92400e" />
                            <circle cx="28" cy="23" r="2" fill="#fde047" />
                          </svg>
                          <div>
                            <div className="text-[11px] text-slate-300 font-medium">
                              Your Balance
                            </div>
                            <div className="font-mono-num font-black text-base text-[#ff8a1e] tracking-widest leading-tight">
                              ---
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigateTo('register')}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff9429] to-[#ff6300] text-white font-bold text-xs shadow active:scale-95 cursor-pointer"
                          >
                            Register
                          </button>
                          <button
                            type="button"
                            onClick={() => navigateTo('login')}
                            className="px-5 py-2 rounded-xl bg-[#232e3e] border border-[#ff851b]/60 text-white font-bold text-xs active:scale-95 cursor-pointer"
                          >
                            Login
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5">
                          <div
                            onClick={() => setHomeAvatarModalOpen(true)}
                            title="Tap to change profile picture"
                            className="w-10 h-10 rounded-full overflow-hidden border border-amber-400/70 bg-black cursor-pointer shrink-0 active:scale-90 transition-transform"
                          >
                            <img
                              src={userAvatar}
                              alt="User"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="text-[11px] text-slate-300 font-medium">
                              Your Balance
                            </div>
                            <div className="font-mono-num font-extrabold text-lg text-white leading-tight">
                              ₹{balance.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigateTo('deposit')}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff9429] to-[#ff6300] text-white font-bold text-xs shadow active:scale-95 cursor-pointer"
                          >
                            Deposit
                          </button>
                          <button
                            type="button"
                            onClick={() => navigateTo('withdraw')}
                            className="px-3.5 py-2 rounded-xl bg-[#232e3e] border border-[#ff851b]/60 text-white font-bold text-xs active:scale-95 cursor-pointer"
                          >
                            Withdraw
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Hero Banner Carousel + Indicator Dots */}
                  <div>
                    <HeroBannerSlide
                      index={bannerIndex}
                      onClick={() =>
                        bannerIndex === 0
                          ? navigateTo('shareTab')
                          : bannerIndex === 1
                            ? navigateTo('deposit')
                            : navigateTo('promo')
                      }
                    />
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                      {[0, 1, 2, 3].map((idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setBannerIndex(idx)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            bannerIndex === idx ? 'w-4 bg-[#ff7b1b]' : 'w-1.5 bg-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Announcement Bar — Exact Match to User Screenshot */}
                  <div className="bg-[#27313e] rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-2 relative overflow-hidden">
                    {/* Faint Right Sugar-Skull with Sombrero Watermark Silhouette */}
                    <svg
                      viewBox="0 0 80 70"
                      className="w-18 h-15 absolute right-20 -bottom-1 opacity-[0.14] pointer-events-none select-none"
                      fill="#cbd5e1"
                    >
                      {/* Sombrero Hat */}
                      <ellipse cx="40" cy="18" rx="34" ry="8" />
                      <path d="M24 18 C26 4, 54 4, 56 18 Z" />
                      {/* Skull Head */}
                      <circle cx="40" cy="36" r="16" />
                      <rect x="31" y="46" width="18" height="10" rx="3" />
                      {/* Eye Sockets & Nose */}
                      <circle cx="34" cy="36" r="4" fill="#27313e" />
                      <circle cx="46" cy="36" r="4" fill="#27313e" />
                      <polygon points="40,40 37,45 43,45" fill="#27313e" />
                    </svg>

                    <div className="flex items-center gap-2.5 min-w-0 flex-1 z-10">
                      {/* Solid White Speaker Icon with Sound Waves */}
                      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none">
                        <path
                          d="M3 9.5V14.5H7L12.5 19V5L7 9.5H3Z"
                          fill="#ffffff"
                        />
                        <path
                          d="M15.5 8.5C16.8 9.6 17.5 10.8 17.5 12C17.5 13.2 16.8 14.4 15.5 15.5"
                          stroke="#ffffff"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M18.2 6C20.2 7.6 21.2 9.7 21.2 12C21.2 14.3 20.2 16.4 18.2 18"
                          stroke="#ffffff"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>

                      <div className="truncate text-xs text-[#9ba6b5] font-medium tracking-wide">
                        🎉 WELCOME TO XG WIN 99! 🎉
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDetailsModal(true)}
                      className="px-5 py-1.5 rounded-full bg-gradient-to-b from-[#ff9f2e] to-[#f77707] text-white font-display font-extrabold text-xs shrink-0 shadow cursor-pointer active:scale-95 z-10"
                    >
                      Details
                    </button>
                  </div>

                  {/* Daily Check in & Deposit Wheel Cards — Exact Match to User Screenshot */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Daily Check in */}
                    <div
                      onClick={() => setCheckInModal(true)}
                      className="bg-[#1c2430] rounded-2xl px-2.5 py-2.5 flex items-center gap-2.5 border border-[#64748b]/60 cursor-pointer active:scale-95 transition-transform relative overflow-hidden shadow-md"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                        <img
                          src={homeDailyCheckinImg}
                          alt="Daily Check in"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover scale-110"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-display font-extrabold text-[14px] text-white leading-tight truncate">
                          Daily Check in
                        </div>
                        <div className="text-xs text-[#ff7b1b] font-semibold mt-1 flex items-center gap-1">
                          <span>Collect Now</span>
                          <span>→</span>
                        </div>
                      </div>
                    </div>

                    {/* Deposit Wheel */}
                    <div
                      onClick={() => navigateTo('depositWheel')}
                      className="bg-[#1c2430] rounded-2xl px-2.5 py-2.5 flex items-center gap-2.5 border border-[#64748b]/60 cursor-pointer active:scale-95 transition-transform relative overflow-hidden shadow-md"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                        <img
                          src={homeDepositWheelImg}
                          alt="Deposit Wheel"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover scale-110"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-display font-extrabold text-[14px] text-white leading-tight truncate">
                          Deposit Wheel
                        </div>
                        <div className="text-xs text-[#ff7b1b] font-semibold mt-1 flex items-center gap-1">
                          <span>Spin Now</span>
                          <span>→</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Popular Games Section — Exact Match to Uploaded Video (18 Horizontal Scrolling Cards) */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        {/* Orange-Gold Flame SVG Icon matching video */}
                        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                          <defs>
                            <linearGradient id="popFlameGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#fde047" />
                              <stop offset="50%" stopColor="#fb923c" />
                              <stop offset="100%" stopColor="#ea580c" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M13.5 2C13.5 2 15.8 5.2 14.8 8.4C14.8 8.4 16.8 7.2 17.2 5.2C19.6 7.8 20.5 11.4 19.2 14.8C18.1 17.8 15.2 20 12 20C8.5 20 5.5 17.5 4.8 14C4.2 10.8 6 7.6 8.5 5.8C8.5 5.8 8.2 8.2 9.6 9.2C9.2 6.2 11 3.5 13.5 2Z"
                            fill="url(#popFlameGrad)"
                          />
                          <path
                            d="M12 11.5C13.2 12.8 13.8 14.5 13.2 16.2C12.8 17.4 11.6 18.2 10.4 17.8C9.2 17.4 8.6 16 9.1 14.6C9.5 13.4 10.8 12.6 12 11.5Z"
                            fill="#fef08a"
                          />
                        </svg>
                        <h3 className="font-display font-extrabold text-[17px] text-white tracking-tight">
                          Popular games
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPopularViewAll((v) => !v)}
                        className="text-xs font-semibold text-[#14b8a6] hover:text-[#2dd4bf] cursor-pointer"
                      >
                        {popularViewAll ? 'Show Less' : 'View All'}
                      </button>
                    </div>

                    <div
                      className={
                        popularViewAll
                          ? 'grid grid-cols-3 gap-2.5'
                          : 'flex items-stretch gap-2.5 overflow-x-auto no-scrollbar pb-1 -mx-0.5 px-0.5'
                      }
                    >
                      {POPULAR_GAMES_LIST.map((game) => (
                        <PopularGameCard
                          key={game.id}
                          title={game.title}
                          winRate={game.winRate}
                          type={game.type}
                          className={popularViewAll ? 'w-full' : 'w-[126px] shrink-0'}
                          onPlay={() => {
                            if (game.action === 'wingo-30s') {
                              handleOpenWinGo('30s');
                            } else if (game.action === 'wingo-1m') {
                              handleOpenWinGo('1m');
                            } else if (game.action === 'aviator') {
                              handleOpenAviator();
                            } else if (game.action === 'chicken') {
                              handleOpenChickenRoad();
                            } else {
                              handleOpenWinGo('30s');
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* All Remaining Game Hub & Category Grids */}
                  <HomeSections
                    onOpenWinGo={handleOpenWinGo}
                    onOpenAviator={handleOpenAviator}
                    onSelectGameToast={(name) => {
                      if (name.toLowerCase().includes('chicken')) {
                        handleOpenChickenRoad();
                      } else if (name.toLowerCase().includes('aviator')) {
                        handleOpenAviator();
                      } else {
                        handleOpenWinGo('30s');
                      }
                    }}
                  />
                </main>

                {/* Floating Right-Edge Action Widgets (3D Gift Chest, 24/7 Support, Telegram) */}
                <div className="fixed right-3 bottom-28 z-30 flex flex-col items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCheckInModal(true)}
                    className="w-13 h-13 active:scale-90 cursor-pointer"
                  >
                    <TreasureChestIcon className="w-13 h-13" />
                  </button>

                  <a
                    href="https://t.me/xgwin99"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setSupportModal(true)}
                    title="24/7 Live Support (https://t.me/xgwin99)"
                    className="w-11 h-11 rounded-full bg-gradient-to-b from-[#ff4b5c] to-[#c81e32] border-2 border-white/60 flex flex-col items-center justify-center shadow-lg active:scale-90 cursor-pointer"
                  >
                    <Headphones className="w-4 h-4 text-white" />
                    <span className="text-[8px] font-black text-white leading-none mt-0.5">
                      24/7
                    </span>
                  </a>

                  <a
                    href="https://t.me/xgwin99"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => showToast('Official Telegram Channel: https://t.me/xgwin99')}
                    title="Official Telegram Channel (https://t.me/xgwin99)"
                    className="w-11 h-11 rounded-full bg-gradient-to-b from-[#38bdf8] to-[#0284c7] border-2 border-white/60 flex items-center justify-center shadow-lg active:scale-90 cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-white -ml-0.5" />
                  </a>
                </div>

                {/* Floating "Download APP for a Better Experience" Bar (00:00, 00:21, 01:57) */}
                {showDownloadBar && (
                  <div className="fixed bottom-[68px] left-1/2 -translate-x-1/2 z-30 w-[86%] max-w-[360px]">
                    <div className="bg-gradient-to-r from-[#ff9429] to-[#ff6300] rounded-full px-3 py-1.5 flex items-center justify-between shadow-xl border border-amber-300/40">
                      <div
                        onClick={() => showToast('XG Win 99 Mobile App is ready!')}
                        className="flex items-center gap-2.5 cursor-pointer flex-1"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#111923] overflow-hidden flex items-center justify-center shrink-0 border border-amber-300/60 shadow">
                          <img
                            src={xgWin99LogoImg}
                            alt="XG Win 99"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover scale-105"
                          />
                        </div>
                        <span className="text-[11px] font-bold text-white leading-tight text-center">
                          Download XG Win 99 APP for a Better Experience
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDownloadBar(false)}
                        className="p-1 text-white/90 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FIXED BOTTOM NAVIGATION BAR WITH ANIMATED 3D ICONS & CENTER TREASURE CHEST */}
            <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-[64px] bg-[#161f2c] border-t border-white/10 z-40 grid grid-cols-5 items-center px-1 select-none shadow-[0_-4px_20px_rgba(0,0,0,0.45)]">
              <button
                type="button"
                onClick={() => navigateTo('home')}
                className="flex flex-col items-center justify-center gap-0.5 py-1 cursor-pointer group active:scale-90 transition-transform"
              >
                <NavHomeIcon key={screen === 'home' ? 'home-active' : 'home-inactive'} active={screen === 'home'} />
                <span
                  className={`text-[11px] leading-tight transition-colors duration-200 ${
                    screen === 'home' ? 'font-bold text-[#ff8a1e]' : 'font-medium text-[#64748b]'
                  }`}
                >
                  {t('home')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('promo')}
                className="flex flex-col items-center justify-center gap-0.5 py-1 cursor-pointer group active:scale-90 transition-transform"
              >
                <NavPromoIcon key={screen === 'promo' ? 'promo-active' : 'promo-inactive'} active={screen === 'promo'} />
                <span
                  className={`text-[11px] leading-tight transition-colors duration-200 ${
                    screen === 'promo' ? 'font-bold text-[#ff8a1e]' : 'font-medium text-[#64748b]'
                  }`}
                >
                  {t('promo')}
                </span>
              </button>

              {/* Center Floating 3D Animated Treasure Chest (/shareTab) */}
              <div className="flex items-center justify-center relative">
                <button
                  type="button"
                  onClick={() => navigateTo('shareTab')}
                  className="-mt-6 active:scale-90 transition-transform cursor-pointer"
                >
                  <TreasureChestIcon className="w-16 h-16" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigateTo('earn')}
                className="flex flex-col items-center justify-center gap-0.5 py-1 cursor-pointer group active:scale-90 transition-transform"
              >
                <NavEarnIcon key={screen === 'earn' ? 'earn-active' : 'earn-inactive'} active={screen === 'earn'} />
                <span
                  className={`text-[11px] leading-tight transition-colors duration-200 ${
                    screen === 'earn' ? 'font-bold text-[#ff8a1e]' : 'font-medium text-[#64748b]'
                  }`}
                >
                  {t('earn')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isLoggedIn) {
                    navigateTo('login');
                  } else {
                    navigateTo('profile');
                  }
                }}
                className="flex flex-col items-center justify-center gap-0.5 py-1 cursor-pointer group active:scale-90 transition-transform"
              >
                <NavProfileIcon key={screen === 'profile' ? 'profile-active' : 'profile-inactive'} active={screen === 'profile'} />
                <span
                  className={`text-[11px] leading-tight transition-colors duration-200 ${
                    screen === 'profile' ? 'font-bold text-[#ff8a1e]' : 'font-medium text-[#64748b]'
                  }`}
                >
                  {t('profile')}
                </span>
              </button>
            </nav>
          </>
        )}

        {/* DAILY CHECK-IN MODAL */}
        {checkInModal && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-5 max-w-[430px] mx-auto">
            <div className="bg-[#1c2635] rounded-2xl p-5 border border-amber-500/30 w-full max-w-xs text-center">
              <h3 className="font-display font-black text-base text-white mb-1">
                Daily Check In
              </h3>
              <p className="text-xs text-slate-300 mb-4">
                Sign in 7 consecutive days to claim up to ₹7,777 bonus rewards!
              </p>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <div
                    key={d}
                    className={`rounded-xl p-2 text-center border ${
                      d === 1
                        ? 'bg-[#ff7b1b]/20 border-[#ff7b1b] text-[#ff8a1e]'
                        : 'bg-[#111923] border-white/5 text-slate-400'
                    }`}
                  >
                    <div className="text-[10px] font-bold">Day {d}</div>
                    <div className="font-mono-num text-xs font-extrabold mt-0.5">+₹{d * 7}</div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setCheckInModal(false);
                  showToast('Complete first deposit to unlock Check-In!');
                }}
                className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#ff9429] to-[#ff6300] text-white font-bold text-xs cursor-pointer"
              >
                Collect Now
              </button>
            </div>
          </div>
        )}

        {/* DEPOSIT WHEEL MODAL */}
        {wheelModal && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-5 max-w-[430px] mx-auto">
            <div className="bg-[#1c2635] rounded-2xl p-5 border border-amber-500/30 w-full max-w-xs text-center">
              <h3 className="font-display font-black text-base text-amber-400 mb-1">
                LUCKY DEPOSIT WHEEL
              </h3>
              <p className="text-xs text-slate-300 mb-4">Spin to win up to ₹10,000 Cash Bonus</p>
              <div
                className={`w-36 h-36 rounded-full mx-auto mb-4 border-4 border-amber-400 bg-gradient-to-tr from-rose-600 via-amber-500 to-purple-600 flex items-center justify-center shadow-xl ${
                  wheelSpinning ? 'animate-spin' : ''
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-[#111923] border-2 border-amber-300 flex items-center justify-center font-display font-black text-xs text-amber-400">
                  SPIN
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWheelModal(false)}
                  className="py-2.5 rounded-full bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSpinWheel}
                  className="py-2.5 rounded-full bg-gradient-to-r from-[#ff9429] to-[#ff6300] text-white font-bold text-xs cursor-pointer"
                >
                  Spin Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 24/7 CUSTOMER SUPPORT & OFFICIAL TELEGRAM MODAL */}
        {supportModal && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-5 max-w-[430px] mx-auto">
            <div className="bg-[#1c2635] rounded-2xl p-5 border border-white/10 w-full max-w-xs text-center">
              <div className="w-12 h-12 rounded-full bg-[#38bdf8]/20 text-[#38bdf8] flex items-center justify-center mx-auto mb-3">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white mb-1">24/7 Live Support &amp; Help</h3>
              <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                Contact our official support team and join our official Telegram channel for instant
                account, deposit, withdrawal, and bonus help:
              </p>

              <a
                href="https://t.me/xgwin99"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-[#111923] border border-[#38bdf8]/40 rounded-xl px-3 py-2.5 mb-3 text-xs font-mono-num font-bold text-[#38bdf8] hover:bg-[#162230] transition-colors"
              >
                https://t.me/xgwin99
              </a>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setSupportModal(false);
                    openFaqWithCategory('all');
                  }}
                  className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#ff9429] to-[#ff6300] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>View FAQs (Deposits, Withdrawals &amp; Bonus)</span>
                </button>

                <a
                  href="https://t.me/xgwin99"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setSupportModal(false)}
                  className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#38bdf8] to-[#0284c7] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Open Telegram (@xgwin99)</span>
                </a>

                <button
                  type="button"
                  onClick={() => setSupportModal(false)}
                  className="w-full py-2 rounded-full bg-slate-700/80 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAQ MODAL (DEPOSITS, WITHDRAWALS & BONUS RULES) */}
        <FaqModal
          isOpen={faqModalOpen}
          initialCategory={faqCategory}
          onClose={() => setFaqModalOpen(false)}
          onOpenSupport={() => {
            setFaqModalOpen(false);
            setSupportModal(true);
          }}
        />

        {/* ANNOUNCEMENT DETAILS MODAL */}
        {detailsModal && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-5 max-w-[430px] mx-auto">
            <div className="bg-[#1c2635] rounded-2xl p-5 border border-white/10 w-full max-w-xs text-center">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-amber-400/70 mx-auto mb-2.5 shadow-lg">
                <img
                  src={xgWin99LogoImg}
                  alt="XG Win 99"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-bold text-base text-[#ff8a1e] mb-2">
                Welcome to XG Win 99!
              </h3>
              <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                Play WinGo 30sec, Spribe Aviator, Chicken Road 2, and invite friends to earn daily
                commissions. Red Envelope Rain happens every hour 24/7!
              </p>
              <a
                href="https://t.me/xgwin99"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 mb-2 rounded-full bg-gradient-to-r from-[#38bdf8] to-[#0284c7] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Official Telegram: t.me/xgwin99</span>
              </a>
              <button
                type="button"
                onClick={() => setDetailsModal(false)}
                className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#ff9429] to-[#ff6300] text-white font-bold text-xs cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        )}

        {/* HOME AVATAR PICKER MODAL */}
        {homeAvatarModalOpen && (
          <AvatarPickerModal
            currentAvatar={userAvatar}
            onClose={() => setHomeAvatarModalOpen(false)}
            onSaveAvatar={(newAvatar) => {
              handleSaveAvatar(newAvatar);
              showToast('Profile Avatar saved!');
            }}
          />
        )}

        {/* GLOBAL TOAST */}
        {toastMsg && (
          <div className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center max-w-[430px] mx-auto">
            <div className="bg-black/85 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-xl border border-white/10">
              {toastMsg}
            </div>
          </div>
        )}

        {/* WELCOME BONUS (new registrations) */}
        {welcomeBonus && (
          <WelcomeBonusModal
            bonusAmount={welcomeBonus.amount}
            unlockTarget={welcomeBonus.unlockTarget}
            onPlay={() => {
              setWelcomeBonus(null);
              navigateTo('home');
            }}
            onDeposit={() => {
              setWelcomeBonus(null);
              setDepositReturnScreen('home');
              navigateTo('deposit');
            }}
            onClose={() => setWelcomeBonus(null)}
          />
        )}

        {/* LOW BALANCE TOP-UP NUDGE */}
        {topUpPrompt && (
          <LowBalanceTopUpModal
            offers={TOP_UP_OFFERS}
            balance={isLoggedIn ? balance : 0}
            onDeposit={goDepositWith}
            onActivity={() => {
              setTopUpPrompt(false);
              navigateTo('promo');
            }}
            onClose={closeTopUp}
          />
        )}
      </div>
      </>
      )}
    </div>
  );
}
