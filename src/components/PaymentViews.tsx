import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  Headphones,
  HelpCircle,
  Copy,
  Check,
  X,
  QrCode,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import QRCode from 'qrcode';
import { apiPost, apiGet } from '../utils/api';
import { WithdrawView } from './WithdrawView';

interface PaymentViewProps {
  mode: 'deposit' | 'withdraw';
  balance: number;
  userId?: string;
  onBack: () => void;
  onOpenSupport: () => void;
  onOpenFaq?: () => void;
  onDepositSuccess?: (amount: number, orderId: string) => void;
}

interface QrData {
  orderId: string;
  amount: number;
  qrUrl?: string;
  upiString?: string;
  upiId?: string;
  upiName?: string;
  note?: string;
  status?: string;
  expiresIn?: number;
}

const DEPOSIT_PRESETS = [
  { amount: 100, bonus: 15 },
  { amount: 200, bonus: 29 },
  { amount: 300, bonus: 29 },
  { amount: 400, bonus: 29 },
  { amount: 500, bonus: 59 },
  { amount: 600, bonus: 59 },
  { amount: 1000, bonus: 109 },
  { amount: 1500, bonus: 109 },
  { amount: 2000, bonus: 109 },
  { amount: 3000, bonus: 229 },
  { amount: 5000, bonus: 229 },
  { amount: 10000, bonus: 599 },
  { amount: 20000, bonus: 599 },
  { amount: 30000, bonus: 599 },
  { amount: 50000, bonus: 2999 },
];

const PRIMARY_BUTTON =
  'bg-gradient-to-r from-[#ff9429] to-[#ff5500] text-white';

export const PaymentView: React.FC<PaymentViewProps> = ({
  mode,
  balance,
  userId,
  onBack,
  onOpenSupport,
  onOpenFaq,
  onDepositSuccess,
}) => {
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('upi-qr');
  const [comingSoonModal, setComingSoonModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [txnNumber, setTxnNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [qrImage, setQrImage] = useState<string>('');
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [verifyState, setVerifyState] = useState<
    'idle' | 'submitted' | 'approved' | 'rejected'
  >('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const pollRef = useRef<number | null>(null);

  const depositAmount = useMemo(() => Number(customAmount) || 0, [customAmount]);
  const activeBonus =
    DEPOSIT_PRESETS.find((p) => p.amount === depositAmount)?.bonus ?? 0;
  const hasValidAmount = depositAmount >= 100;

  const visiblePresets = useMemo(() => {
    const allowed = customAmount
      ? [200, 300, 400, 500, 600, 1500, 2000, 3000, 5000]
      : [100, 200, 300, 500, 1000, 2000, 3000, 5000, 10000, 20000, 30000, 50000];
    return DEPOSIT_PRESETS.filter((p) => allowed.includes(p.amount));
  }, [customAmount]);

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  const stopPolling = () => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopySuccess(key);
    window.setTimeout(() => setCopySuccess(null), 1500);
  };

  const generateQr = async (data: QrData) => {
    const payload =
      data.upiString ||
      `upi://pay?pa=${encodeURIComponent(data.upiId || '')}&pn=${encodeURIComponent(
        data.upiName || ''
      )}&am=${data.amount}&cu=INR&tn=${encodeURIComponent(data.note || '')}`;
    try {
      const url = await QRCode.toDataURL(payload, {
        width: 640,
        margin: 1,
        color: { dark: '#111923', light: '#ffffff' },
      });
      setQrImage(url);
    } catch (err) {
      console.error('QR generation failed', err);
      setQrImage('');
    }
  };

  const handlePayNow = async () => {
    if (mode !== 'deposit') {
      setComingSoonModal(true);
      return;
    }
    if (!hasValidAmount) {
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost('/deposit/create', {
        amount: depositAmount,
        method: selectedMethod,
        userId: userId || 'guest',
      });
      if (res.success) {
        setQrData(res.data);
        setCurrentOrderId(res.data.orderId);
        setUtrNumber('');
        setTxnNumber('');
        setVerifyState('idle');
        setStatusMessage('');
        await generateQr(res.data);
        setShowQrModal(true);
      } else {
        alert(res.message || 'Failed to create deposit request');
      }
    } catch (error) {
      console.error(error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (orderId: string, amount: number) => {
    stopPolling();
    pollRef.current = window.setInterval(async () => {
      try {
        const res = await apiGet(`/deposit/status/${orderId}`);
        if (res.success && res.data) {
          const status = res.data.status;
          if (status === 'approved') {
            stopPolling();
            setVerifyState('approved');
            setStatusMessage('Payment verified. Amount credited to your wallet.');
            if (onDepositSuccess) onDepositSuccess(amount, orderId);
          } else if (status === 'rejected') {
            stopPolling();
            setVerifyState('rejected');
            setStatusMessage(res.data.rejectionReason || 'Payment verification failed.');
          }
        }
      } catch (error) {
        console.error('status poll failed', error);
      }
    }, 5000);
  };

  const handleSubmitProof = async () => {
    const utr = utrNumber.trim();
    const txn = txnNumber.trim();
    if (!utr && !txn) {
      alert('Please enter UTR / Reference Number (or Transaction ID)');
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost('/deposit/submit', {
        orderId: currentOrderId,
        utr,
        txnId: txn,
        amount: depositAmount,
        method: selectedMethod,
        userId: userId || 'guest',
      });
      if (res.success) {
        const orderId = res.data?.orderId || currentOrderId || '';
        setVerifyState('submitted');
        setStatusMessage(
          res.message || 'Your deposit is under verification. It will be credited within 1-5 minutes.'
        );
        startPolling(orderId, depositAmount);
      } else {
        alert(res.message || 'Failed to submit deposit');
      }
    } catch (error) {
      console.error(error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeQrModal = () => {
    stopPolling();
    setShowQrModal(false);
  };

  const displayUpiId = qrData?.upiId || '';

  return (
    <div className="min-h-screen bg-[#111923] text-white pb-24 select-none relative">
      <header className="sticky top-0 z-30 bg-[#111923] px-4 py-3.5 flex items-center justify-between border-b border-white/5">
        <button type="button" onClick={onBack} className="p-1 text-slate-200 active:scale-95 cursor-pointer">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-base font-bold text-white">{mode === 'deposit' ? 'Deposit' : 'Withdraw'}</h1>
        <div className="flex items-center gap-3">
          {onOpenFaq && (
            <button
              type="button"
              onClick={onOpenFaq}
              title="Deposit, Withdrawal & Bonus FAQs"
              className="text-[#ff7b1b] cursor-pointer active:scale-90 transition-transform"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          )}
          <a
            href="https://t.me/xgwin99"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onOpenSupport}
            title="24/7 Support & Help"
            className="text-[#ff7b1b] cursor-pointer"
          >
            <Headphones className="w-5 h-5" />
          </a>
        </div>
      </header>

      <div className="px-3.5 pt-3.5 space-y-4">
        {mode === 'deposit' ? (
          <div>
            <div className="bg-[#151e2b] border border-slate-700/80 rounded-xl px-3.5 py-3 flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-lg font-extrabold text-[#ff8a1e]">₹</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setUtrNumber('');
                    setTxnNumber('');
                  }}
                  placeholder="Enter amount"
                  className="bg-transparent text-white font-bold text-base w-full focus:outline-none placeholder:text-slate-500"
                />
              </div>
              {customAmount && (
                <button
                  type="button"
                  onClick={() => setCustomAmount('')}
                  className="w-5 h-5 rounded-full bg-slate-600/60 text-slate-300 flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {activeBonus > 0 && (
              <div className="text-xs font-bold text-white mb-2.5">
                Get ₹{customAmount} + Bonus ₹{activeBonus}
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {visiblePresets.map((preset) => {
                const isSel = depositAmount === preset.amount;
                return (
                  <button
                    key={preset.amount}
                    type="button"
                    onClick={() => {
                      setCustomAmount(String(preset.amount));
                      setUtrNumber('');
                      setTxnNumber('');
                    }}
                    className={`py-2.5 px-1.5 rounded-xl font-bold text-xs relative ${
                      isSel
                        ? 'bg-gradient-to-r from-[#ff9429] to-[#ff5500] text-white'
                        : 'bg-[#1c2635] text-slate-300 border border-white/5'
                    }`}
                  >
                    <span className="text-[9px] absolute top-0 right-0 bg-[#ff8a1e] text-white px-1 rounded-bl">
                      +{preset.bonus}
                    </span>
                    <div className="mt-1">₹{preset.amount}</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <div className="text-xs font-bold mb-2">Payment Method</div>
              <button
                type="button"
                onClick={() => setSelectedMethod('upi-qr')}
                className={`w-full p-3 rounded-xl flex items-center gap-3 ${
                  selectedMethod === 'upi-qr'
                    ? PRIMARY_BUTTON
                    : 'bg-[#1c2635] border border-white/5'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <div className="text-sm font-bold">UPI QR</div>
                {selectedMethod === 'upi-qr' && <Check className="ml-auto w-4 h-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={handlePayNow}
              disabled={!hasValidAmount || loading}
              className={`w-full mt-4 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${
                !hasValidAmount || loading
                  ? 'bg-[#27313e] text-slate-400'
                  : 'bg-gradient-to-b from-[#ffb347] to-[#e85d00] text-white active:scale-[0.99]'
              }`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Please wait...' : 'Pay now'}
            </button>
            <p className="text-[10px] text-slate-500 mt-2 text-center">
              Minimum deposit ₹100. Bonus is credited automatically.
            </p>
          </div>
        ) : (
          <WithdrawView
            balance={balance}
            userId={userId}
            onBack={onBack}
          />
        )}
      </div>

      {showQrModal && qrData && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1c2635] rounded-2xl w-full max-w-sm overflow-hidden max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#ff8a1e]" />
                <h3 className="text-sm font-bold">Scan QR to Pay</h3>
              </div>
              <button onClick={closeQrModal} className="p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 py-3 space-y-3 overflow-y-auto">
              <div className="text-center">
                <div className="text-xs text-slate-300">Amount to Pay</div>
                <div className="font-bold text-2xl text-[#ff8a1e]">₹{qrData.amount}</div>
                {displayUpiId && (
                  <div className="text-xs mt-2 flex items-center justify-center gap-2">
                    <span>UPI:</span>
                    <span className="font-mono">{displayUpiId}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(displayUpiId, 'upi')}
                      className="cursor-pointer text-slate-300"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {copySuccess === 'upi' && <span className="text-green-400">Copied</span>}
                  </div>
                )}
              </div>

              {qrImage ? (
                <div className="bg-white rounded-xl p-3 flex items-center justify-center">
                  <img
                    src={qrImage}
                    alt="UPI QR"
                    className="w-full max-w-[220px] aspect-square object-contain"
                  />
                </div>
              ) : qrData.qrUrl ? (
                <div className="bg-white rounded-xl p-3 flex items-center justify-center">
                  <img
                    src={qrData.qrUrl}
                    alt="UPI QR"
                    className="w-full max-w-[220px] aspect-square object-contain"
                  />
                </div>
              ) : (
                <div className="bg-white/5 rounded-xl p-6 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#ff8a1e]" />
                </div>
              )}

              {qrData.note && (
                <div className="bg-[#151e2b] rounded-lg px-3 py-2 text-xs flex items-center justify-between">
                  <span className="text-slate-400">Order Ref</span>
                  <span className="font-mono text-slate-200 flex items-center gap-2">
                    {qrData.note}
                    <button
                      type="button"
                      onClick={() => copyToClipboard(qrData.note!, 'note')}
                      className="cursor-pointer text-slate-300"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {copySuccess === 'note' && <span className="text-green-400">Copied</span>}
                  </span>
                </div>
              )}

              {verifyState === 'idle' ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-slate-300 mb-1 block">
                      UTR / Reference Number *
                    </label>
                    <input
                      type="text"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      placeholder="Enter UTR Number"
                      className="w-full bg-[#151e2b] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff8a1e]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 mb-1 block">
                      Additional Transaction ID (optional)
                    </label>
                    <input
                      type="text"
                      value={txnNumber}
                      onChange={(e) => setTxnNumber(e.target.value)}
                      placeholder="If no UTR, enter Transaction ID"
                      className="w-full bg-[#151e2b] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff8a1e]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Pay the exact amount, then submit the UTR. Verification usually takes 1-5 minutes.
                  </p>
                </div>
              ) : (
                <div className="text-center py-2">
                  {verifyState === 'submitted' && (
                    <Loader2 className="w-8 h-8 animate-spin text-[#ff8a1e] mx-auto mb-2" />
                  )}
                  {verifyState === 'approved' && (
                    <CheckCircle2 className="w-9 h-9 text-green-400 mx-auto mb-2" />
                  )}
                  {verifyState === 'rejected' && (
                    <XCircle className="w-9 h-9 text-red-400 mx-auto mb-2" />
                  )}
                  <div
                    className={`text-sm font-bold mb-1 ${
                      verifyState === 'approved'
                        ? 'text-green-400'
                        : verifyState === 'rejected'
                        ? 'text-red-400'
                        : 'text-[#ff8a1e]'
                    }`}
                  >
                    {verifyState === 'submitted'
                      ? 'Verification Pending'
                      : verifyState === 'approved'
                      ? 'Payment Successful'
                      : 'Payment Rejected'}
                  </div>
                  <p className="text-xs text-slate-300">{statusMessage}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 px-4 py-3 border-t border-white/5">
              {verifyState === 'idle' ? (
                <>
                  <button
                    onClick={closeQrModal}
                    className="flex-1 py-2.5 rounded-lg bg-[#27313e] text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitProof}
                    disabled={loading}
                    className={`flex-1 py-2.5 rounded-lg ${PRIMARY_BUTTON} font-bold text-xs flex items-center justify-center gap-2 cursor-pointer`}
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    I have paid
                  </button>
                </>
              ) : (
                <button
                  onClick={closeQrModal}
                  className={`w-full py-2.5 rounded-lg ${PRIMARY_BUTTON} font-bold text-xs cursor-pointer`}
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {comingSoonModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-5">
          <div className="bg-[#1c2635] rounded-2xl p-6 text-center w-full max-w-xs">
            <div className="w-12 h-12 rounded-full bg-[#ff7b1b]/20 text-[#ff8a1e] flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-black text-xl text-[#ff8a1e] mb-1">Coming Soon</h3>
            <p className="text-xs text-slate-300 mb-4">
              {mode === 'deposit' ? 'Deposit payment section coming soon!' : 'Withdraw section coming soon!'}
            </p>
            <button
              onClick={() => setComingSoonModal(false)}
              className={`w-full py-2.5 rounded-full ${PRIMARY_BUTTON} font-bold text-xs cursor-pointer`}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
