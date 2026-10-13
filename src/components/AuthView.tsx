import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Headphones,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  Check,
  Gift,
  X,
} from 'lucide-react';
import { MaanWinLogo, MaanWinSquareLogo } from './BrandLogo';
import { LanguagePickerModal } from './LanguagePickerModal';
import { apiPost } from '../utils/api';
import {
  SupportedLanguage,
  getTranslation,
  getLanguageInfo,
} from '../utils/i18n';

interface AuthResult {
  ok: boolean;
  message?: string;
}

interface AuthViewProps {
  initialMode?: 'login' | 'register';
  onBack: () => void;
  onSuccessLogin: (
    phone: string,
    password: string,
    mode: 'login' | 'register',
    inviteCode?: string
  ) => Promise<AuthResult>;
  onOpenSupport: () => void;
  onModeChange?: (mode: 'login' | 'register') => void;
  currentLanguage?: SupportedLanguage;
  onChangeLanguage?: (lang: SupportedLanguage) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode = 'login',
  onBack,
  onSuccessLogin,
  onOpenSupport,
  onModeChange,
  currentLanguage = 'en',
  onChangeLanguage,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [langModalOpen, setLangModalOpen] = useState(false);
  const t = (key: string) => getTranslation(currentLanguage, key);
  const currentLangInfo = getLanguageInfo(currentLanguage);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'menu' | 'change'>('menu');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotOldPw, setForgotOldPw] = useState('');
  const [forgotNewPw, setForgotNewPw] = useState('');
  const [forgotConfirmPw, setForgotConfirmPw] = useState('');
  const [forgotShowPw, setForgotShowPw] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  const openForgotModal = () => {
    setForgotStep('menu');
    setForgotPhone(phone.replace(/\D/g, ''));
    setForgotOldPw('');
    setForgotNewPw('');
    setForgotConfirmPw('');
    setForgotError('');
    setForgotSuccess('');
    setForgotSubmitting(false);
    setForgotModal(true);
  };

  const closeForgotModal = () => {
    setForgotModal(false);
    setForgotStep('menu');
  };

  const handleForgotChangePassword = async () => {
    if (forgotSubmitting) return;
    setForgotError('');
    setForgotSuccess('');
    const cleanPhone = forgotPhone.replace(/\D/g, '');
    if (!/^\d{10}$/.test(cleanPhone)) {
      setForgotError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!forgotOldPw) {
      setForgotError('Please enter your current password');
      return;
    }
    if (forgotNewPw.length < 6) {
      setForgotError('New password must be at least 6 characters');
      return;
    }
    if (forgotNewPw !== forgotConfirmPw) {
      setForgotError('New passwords do not match');
      return;
    }
    setForgotSubmitting(true);
    try {
      const res = await apiPost('/user/change-password', {
        phone: cleanPhone,
        oldPassword: forgotOldPw,
        newPassword: forgotNewPw,
      });
      if (res && res.success) {
        setForgotSuccess('Password updated successfully. You can login now.');
        setForgotSubmitting(false);
      } else {
        setForgotError((res && res.message) || 'Unable to update password. Please try again.');
        setForgotSubmitting(false);
      }
    } catch {
      setForgotError('Unable to connect to the server. Please try again.');
      setForgotSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');

    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^\d{10}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (!agreedPrivacy) {
        setError('Please read and agree to the Privacy Agreement');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const result = await onSuccessLogin(cleanPhone, password, mode, inviteCode.trim() || undefined);
      if (!result || !result.ok) {
        setError(result?.message || 'Something went wrong. Please try again.');
        setIsSubmitting(false);
      }
      // On success the parent navigates away and this component unmounts.
    } catch {
      setError('Unable to connect to the server. Please check your connection.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111923] text-white flex flex-col select-none relative overflow-hidden pb-10">
      {/* Subtle Casino Lounge Backdrop Header (00:10 in video) */}
      <div className="relative pb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a273b]/70 via-[#131d2b]/85 to-[#111923] pointer-events-none" />
        {/* Decorative chandelier/arch lines in background */}
        <svg
          viewBox="0 0 400 180"
          className="w-full h-44 absolute top-0 left-0 opacity-15 pointer-events-none"
        >
          <rect x="20" y="30" width="70" height="110" rx="6" stroke="#94a3b8" strokeWidth="2" fill="none" />
          <rect x="310" y="30" width="70" height="110" rx="6" stroke="#94a3b8" strokeWidth="2" fill="none" />
          <path d="M140 0 Q200 60 260 0" stroke="#f59e0b" strokeWidth="2" fill="none" />
          <circle cx="200" cy="40" r="18" stroke="#f59e0b" strokeWidth="1.5" fill="none" />
        </svg>

        {/* Top Bar */}
        <header className="relative z-10 px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="p-1 text-slate-200 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <MaanWinLogo size="sm" />
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://t.me/xgwin99"
              target="_blank"
              rel="noopener noreferrer"
              onClick={onOpenSupport}
              title="24/7 Live Support (https://t.me/xgwin99)"
              className="text-[#ff7b1b] cursor-pointer"
            >
              <Headphones className="w-5 h-5" />
            </a>
            <button
              type="button"
              onClick={() => setLangModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-amber-400 cursor-pointer active:scale-95 transition-transform"
            >
              <span className="text-base leading-none">{currentLangInfo.flag}</span>
              <span className="uppercase font-mono-num">{currentLangInfo.code}</span>
            </button>
          </div>
        </header>

        {/* Centered Glowing Square Logo (00:10 in video) */}
        <div className="relative z-10 flex justify-center mt-3">
          <MaanWinSquareLogo />
        </div>
      </div>

      {/* Form Area (/login?type=0 & /register) */}
      <form onSubmit={handleSubmit} className="px-5 space-y-4 relative z-10 flex-1">
        {/* Phone Input */}
        <div className="bg-[#182232] border border-slate-700/70 rounded-xl px-3.5 py-3.5 flex items-center gap-3">
          <Smartphone className="w-5 h-5 text-slate-400 shrink-0" />
          <span className="text-white font-bold text-sm shrink-0">+91</span>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter your phone number"
            className="bg-transparent text-white font-mono-num text-sm w-full focus:outline-none placeholder:text-slate-500"
          />
        </div>

        {/* Password Input */}
        <div className="bg-[#182232] border border-slate-700/70 rounded-xl px-3.5 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <Lock className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Please enter the password"
              className="bg-transparent text-white text-sm w-full focus:outline-none placeholder:text-slate-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            {showPass ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>

        {mode === 'register' && (
          <>
            {/* Confirm Password Input (/register) */}
            <div className="bg-[#182232] border border-slate-700/70 rounded-xl px-3.5 py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <Lock className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Please confirm the password"
                  className="bg-transparent text-white text-sm w-full focus:outline-none placeholder:text-slate-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                {showConfirmPass ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>

            {/* Invite Code Input (/register) */}
            <div className="bg-[#182232] border border-slate-700/70 rounded-xl px-3.5 py-3.5 flex items-center gap-3">
              <Gift className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Please enter the invitation code"
                className="bg-transparent text-white font-mono-num text-sm w-full focus:outline-none placeholder:text-slate-500"
              />
            </div>
          </>
        )}

        {/* Remember Password (/login) or Privacy Agreement (/register) */}
        {mode === 'login' ? (
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setRemember(!remember)}
              className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer"
            >
              <span
                className={`w-4 h-4 rounded flex items-center justify-center border ${
                  remember
                    ? 'bg-[#ff7b1b] border-[#ff7b1b] text-white'
                    : 'border-slate-600 bg-transparent'
                }`}
              >
                {remember && <Check className="w-3 h-3 stroke-[3]" />}
              </span>
              <span>Remember password</span>
            </button>

            <button
              type="button"
                onClick={openForgotModal}
              className="text-xs text-[#ff8a1e] underline font-medium cursor-pointer"
            >
              Forgot Password
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setAgreedPrivacy(!agreedPrivacy)}
              className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer"
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                  agreedPrivacy
                    ? 'bg-[#ff7b1b] border-[#ff7b1b] text-white'
                    : 'border-slate-600 bg-transparent'
                }`}
              >
                {agreedPrivacy && <Check className="w-3 h-3 stroke-[3]" />}
              </span>
              <span>
                I have read and agree <b className="text-[#ff8a1e]">【Privacy Agreement】</b>
              </span>
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3.5 py-2.5">
            <span className="mt-0.5">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Orange Spinner when submitting (00:18 in video) */}
        <div className="h-7 flex items-center justify-center">
          {isSubmitting && (
            <div className="w-6 h-6 border-2 border-[#ff7b1b] border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Primary & Secondary Buttons */}
        <div className="space-y-3.5">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#ff9a2e] to-[#ff6300] text-white font-bold text-base shadow-lg active:scale-[0.99] transition-transform cursor-pointer"
          >
            {isSubmitting
              ? mode === 'login'
                ? 'Logining'
                : 'Registering'
              : mode === 'login'
                ? 'Login'
                : 'Register'}
          </button>

          <button
            type="button"
            onClick={() => {
              const next = mode === 'login' ? 'register' : 'login';
              setMode(next);
              setError('');
              onModeChange?.(next);
            }}
            className="w-full py-3.5 rounded-full border border-[#ff7b1b] text-[#ff8a1e] font-bold text-base bg-transparent active:scale-[0.99] transition-transform cursor-pointer"
          >
            {mode === 'login' ? 'Register Now' : 'I have an account Login'}
          </button>

          {/* Direct 24/7 Customer Support / Help Telegram Link */}
          <div className="pt-2 flex justify-center">
            <a
              href="https://t.me/xgwin99"
              target="_blank"
              rel="noopener noreferrer"
              onClick={onOpenSupport}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#182232] border border-white/10 text-xs font-semibold text-slate-200 hover:text-white active:scale-95 transition-transform"
            >
              <Headphones className="w-4 h-4 text-[#ff8a1e]" />
              <span>Customer Service / Help (@xgwin99)</span>
            </a>
          </div>
        </div>
      </form>

      {forgotModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-5 max-w-[430px] mx-auto">
          <div className="bg-[#1c2635] rounded-2xl p-5 border border-white/10 w-full max-w-xs">
            {forgotStep === 'menu' ? (
              <>
                <h3 className="font-bold text-base text-white mb-2 text-center">Forgot Password</h3>
                <p className="text-xs text-slate-300 mb-3 text-center">
                  Choose how you want to reset your password:
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotError('');
                    setForgotSuccess('');
                    setForgotStep('change');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 mb-2 rounded-full bg-gradient-to-r from-[#ff9429] to-[#ff6300] text-white font-bold text-xs shadow cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  I remember my old password
                </button>
                <p className="text-[10px] text-slate-400 mb-3 text-center">
                  Change password instantly using your current password.
                </p>
                <p className="text-xs text-slate-300 mb-2 text-center">
                  Forgot your old password? Contact 24/7 Live Support on Telegram with your registered
                  mobile number (+91) as proof of ownership:
                </p>
                <a
                  href="https://t.me/xgwin99"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2.5 mb-2 rounded-full bg-gradient-to-r from-[#38bdf8] to-[#0284c7] text-white font-bold text-xs text-center shadow cursor-pointer"
                >
                  Contact Support (t.me/xgwin99)
                </a>
                <button
                  type="button"
                  onClick={closeForgotModal}
                  className="w-full py-2 rounded-full bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#ff8a1e]" />
                    Change Password
                  </h3>
                  <button
                    type="button"
                    onClick={closeForgotModal}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {forgotSuccess ? (
                  <p className="text-xs text-emerald-400 text-center py-3 leading-snug">
                    {forgotSuccess}
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Registered mobile number"
                      className="w-full bg-[#111923] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#ff8a1e]/60"
                    />
                    <input
                      type={forgotShowPw ? 'text' : 'password'}
                      value={forgotOldPw}
                      onChange={(e) => setForgotOldPw(e.target.value)}
                      placeholder="Current password"
                      className="w-full bg-[#111923] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#ff8a1e]/60"
                    />
                    <input
                      type={forgotShowPw ? 'text' : 'password'}
                      value={forgotNewPw}
                      onChange={(e) => setForgotNewPw(e.target.value)}
                      placeholder="New password (min 6 chars)"
                      className="w-full bg-[#111923] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#ff8a1e]/60"
                    />
                    <input
                      type={forgotShowPw ? 'text' : 'password'}
                      value={forgotConfirmPw}
                      onChange={(e) => setForgotConfirmPw(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full bg-[#111923] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#ff8a1e]/60"
                    />
                    <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={forgotShowPw}
                        onChange={(e) => setForgotShowPw(e.target.checked)}
                        className="accent-[#ff8a1e]"
                      />
                      Show password
                    </label>
                    {forgotError && (
                      <p className="text-[11px] text-red-400 leading-snug">{forgotError}</p>
                    )}
                  </div>
                )}

                {!forgotSuccess && (
                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setForgotStep('menu')}
                      className="flex-1 py-2.5 rounded-full bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={forgotSubmitting}
                      onClick={handleForgotChangePassword}
                      className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-[#ff9429] to-[#ff6300] text-white font-bold text-xs cursor-pointer shadow-md disabled:opacity-60"
                    >
                      {forgotSubmitting ? 'Updating…' : 'Update'}
                    </button>
                  </div>
                )}

                {forgotSuccess && (
                  <button
                    type="button"
                    onClick={closeForgotModal}
                    className="w-full py-2.5 rounded-full bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
                  >
                    Close
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {langModalOpen && (
        <LanguagePickerModal
          currentLanguage={currentLanguage}
          onClose={() => setLangModalOpen(false)}
          onSelectLanguage={(lang) => {
            onChangeLanguage?.(lang);
          }}
        />
      )}
    </div>
  );
};
