import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { CreditCard, Banknote, Smartphone, ChefHat, X, CheckCircle, Loader2, Wallet, DollarSign, Star, Info, AlertCircle } from 'lucide-react';

// Toast types
type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

// Toast Item Component
const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    const duration = 3000;

    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => {
      clearTimeout(dismissTimer);
    };
  }, [handleDismiss]);

  const iconConfig = {
    success: { icon: CheckCircle, bgColor: 'bg-green-500', borderColor: 'border-green-500', textColor: 'text-green-600' },
    error: { icon: AlertCircle, bgColor: 'bg-red-500', borderColor: 'border-red-500', textColor: 'text-red-600' },
    info: { icon: Info, bgColor: 'bg-blue-500', borderColor: 'border-blue-500', textColor: 'text-blue-600' },
  };

  const config = iconConfig[toast.type];
  const Icon = config.icon;

  return (
    <div
      className={`relative flex items-center gap-3 min-w-[300px] max-w-md p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border-l-4 ${config.borderColor} transform transition-all duration-300 ${
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
      style={{
        animation: isExiting ? undefined : 'slideInRight 0.3s ease-out',
      }}
    >
      <div className={`flex-shrink-0 w-10 h-10 ${config.bgColor} rounded-full flex items-center justify-center`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{toast.message}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
      >
        <X size={18} />
      </button>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

// Toast Container Component
interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

interface PaymentModalProps {
  total: number;
  taxAmount?: number;
  onPay: (paymentData: any) => Promise<void> | void;
  onCancel: () => void;
  onSendToKitchen?: () => Promise<void>;
  orderType?: string;
  initialTaxExempt?: boolean;
  initialTaxExemptIdRef?: string;
  availableLoyaltyPoints?: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  total,
  taxAmount = 0,
  onPay,
  onCancel,
  onSendToKitchen,
  orderType,
  initialTaxExempt = false,
  initialTaxExemptIdRef = '',
  availableLoyaltyPoints = 0,
}) => {
  const [method, setMethod] = useState<'CASH' | 'CARD' | 'TAP' | 'OTHER'>('CASH');
  const [amountTendered, setAmountTendered] = useState(total);
  const [cardLast4, setCardLast4] = useState('');
  const [cardType, setCardType] = useState<'CREDIT_CARD' | 'DEBIT_CARD'>('CREDIT_CARD');
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingToKitchen, setIsSendingToKitchen] = useState(false);
  const [tapStep, setTapStep] = useState<'idle' | 'ready' | 'processing'>('idle');
  
  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [taxExempt, setTaxExempt] = useState(initialTaxExempt);
  const [taxExemptIdRef, setTaxExemptIdRef] = useState(initialTaxExemptIdRef);
  
  // Tip state
  const [tipAmount, setTipAmount] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [showCustomTip, setShowCustomTip] = useState(false);
  const [otherPaymentNote, setOtherPaymentNote] = useState('');

  // Loyalty Points state
  const [loyaltyPointsUsed, setLoyaltyPointsUsed] = useState(0);
  const maxRedeemablePoints = useMemo(() => {
    // 100 points = $1 discount
    const currentTotalCents = Math.floor(Math.max(0, Number(total || 0)) * 100);
    // Can only redeem up to the total cost (can't have negative balance)
    return Math.min(availableLoyaltyPoints, currentTotalCents);
  }, [availableLoyaltyPoints, total]);

  const isCash = method === 'CASH';
  const needsReference = method !== 'CASH' && method !== 'OTHER';
  const isCard = method === 'CARD';
  const isTap = method === 'TAP';
  const isOther = method === 'OTHER';
  
  const effectiveTax = taxExempt ? 0 : Number(taxAmount || 0);
  const baseBeforeTax = Math.max(0, Number(total || 0) - Number(taxAmount || 0));
  const loyaltyDiscount = loyaltyPointsUsed / 100;
  const amountDue = Math.max(0, Number((baseBeforeTax + effectiveTax - loyaltyDiscount).toFixed(2)));

  // Calculate totals with tip
  const grandTotal = amountDue + tipAmount;
  const change = Math.max(0, amountTendered - grandTotal);
  
  const canSubmitCash = amountTendered >= grandTotal;
  const canSubmitCard = cardLast4.trim().length === 4;
  const canSubmitTap = tapStep === 'ready';
  const canSubmitOther = otherPaymentNote.trim().length > 0;
  const canComplete =
    !isSubmitting &&
    !isSendingToKitchen &&
    ((isCash && canSubmitCash) || (isCard && canSubmitCard) || (isTap && canSubmitTap) || (isOther && canSubmitOther));
  const canSendToKitchen = !isSubmitting && !isSendingToKitchen;

  const suggestedCashAmounts = useMemo(() => {
    const ceilTo = (value: number, increment: number) => Math.ceil(value / increment) * increment;
    return Array.from(
      new Set([
        Number(grandTotal.toFixed(2)),
        ceilTo(grandTotal, 5),
        ceilTo(grandTotal, 10),
        ceilTo(grandTotal, 20),
      ]),
    );
  }, [grandTotal]);

  useEffect(() => {
    if (isCash) {
      setAmountTendered((previous) => {
        if (Math.abs(previous - grandTotal) < 0.01 || previous < grandTotal) {
          return grandTotal;
        }
        return previous;
      });
    }
  }, [grandTotal, isCash]);

  const tipPercentages = [0, 10, 15, 18, 20, 25];

  // Toast helpers
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleTipSelect = (percent: number) => {
    if (percent === 0) {
      setTipAmount(0);
      setShowCustomTip(false);
    } else {
      setTipAmount(Number((amountDue * (percent / 100)).toFixed(2)));
      setShowCustomTip(false);
    }
    setCustomTip('');
  };

  const handleCustomTipChange = (value: string) => {
    setCustomTip(value);
    const numValue = parseFloat(value) || 0;
    setTipAmount(numValue);
  };

  const handleSubmit = async () => {
    if (!canComplete) return;
    if (taxExempt && !taxExemptIdRef.trim()) {
      showToast('Tax ID reference is required for tax exempt payment.', 'error');
      return;
    }
    setIsSubmitting(true);

    try {
      if (isTap) {
        setTapStep('processing');
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }

      const nowId = `${Date.now()}`;
      const txId = reference || `TX-${nowId}`;

      const paymentData: any = {
        method: isCash ? 'CASH' : isCard ? cardType : 'CREDIT_CARD',
        amount: Number(amountDue.toFixed(2)),
        tipAmount: Number(tipAmount.toFixed(2)),
        totalWithTip: Number(grandTotal.toFixed(2)),
        transactionId: txId,
        taxExempt,
        taxExemptIdRef: taxExempt ? taxExemptIdRef.trim() : undefined,
        loyaltyPointsUsed,
      };

      if (isCash) {
        paymentData.tenderedAmount = Number(amountTendered.toFixed(2));
        paymentData.changeDue = Number(change.toFixed(2));
      }

      if (isCard || isTap) {
        paymentData.cardLast4 = isTap ? 'TAP' : cardLast4.trim();
      }

      if (isOther) {
        paymentData.method = 'OTHER';
        paymentData.notes = otherPaymentNote.trim();
        paymentData.transactionId = `OTHER-${Date.now()}`;
      }

      await onPay(paymentData);
      onCancel();
    } finally {
      if (isTap) setTapStep('ready');
      setIsSubmitting(false);
    }
  };

  const handleSendToKitchen = async () => {
    if (!onSendToKitchen) return;
    
    setIsSendingToKitchen(true);
    try {
      await onSendToKitchen();
      onCancel();
    } catch (error: any) {
      console.error('Failed to send to kitchen:', error);
      const errorMessage = typeof error === 'string' ? error : error?.message || 'Unknown error occurred';
      showToast(`Failed to send order: ${errorMessage}`, 'error');
    } finally {
      setIsSendingToKitchen(false);
    }
  };

  const paymentMethods = [
    { id: 'CASH', label: 'Cash', icon: Banknote, color: 'green' },
    { id: 'CARD', label: 'Card', icon: CreditCard, color: 'blue' },
    { id: 'TAP', label: 'Tap', icon: Smartphone, color: 'orange' },
    { id: 'OTHER', label: 'Other', icon: Wallet, color: 'purple' },
  ] as const;

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle size={24} />
              Payment
            </h2>
            <button 
              onClick={onCancel}
              className="text-white/80 hover:text-white p-1 hover:bg-white/20 rounded-lg transition-colors"
              disabled={isSubmitting || isSendingToKitchen}
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            {/* Order Total */}
            <div className="text-center mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-1">
                Amount Due
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                ${amountDue.toFixed(2)}
              </div>
              {Number(taxAmount || 0) > 0 && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Tax: {taxExempt ? '$0.00 (Exempt)' : `$${Number(taxAmount).toFixed(2)}`}
                </div>
              )}
              {orderType && (
                <div className="mt-2 inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                  {orderType.replace('_', ' ')}
                </div>
              )}
            </div>

            {/* Loyalty Points Redemption */}
            {availableLoyaltyPoints > 0 && (
              <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 font-semibold">
                    <Star size={18} />
                    Loyalty Points Available: {availableLoyaltyPoints}
                  </div>
                  {loyaltyPointsUsed > 0 && (
                    <div className="text-sm font-bold text-green-600 dark:text-green-400">
                      -${(loyaltyPointsUsed / 100).toFixed(2)} Savings
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max={maxRedeemablePoints}
                    step="100"
                    value={loyaltyPointsUsed}
                    onChange={(e) => setLoyaltyPointsUsed(Number(e.target.value))}
                    disabled={isSubmitting || isSendingToKitchen}
                    className="flex-1 mt-2 focus:outline-none"
                    style={{ accentColor: '#9333ea' }}
                  />
                  <div className="w-16 text-right font-medium text-gray-700 dark:text-gray-300">
                    {loyaltyPointsUsed} pts
                  </div>
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-400 mt-2">
                  * 100 points = $1.00 Off
                </p>
              </div>
            )}

            {Number(taxAmount || 0) > 0 && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-blue-800 dark:text-blue-200">
                      <input
                        type="checkbox"
                        checked={taxExempt}
                        onChange={(e) => setTaxExempt(e.target.checked)}
                        disabled={isSubmitting || isSendingToKitchen}
                      />
                      Tax Exempt
                    </label>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Remove tax from this payment and save tax ID reference.
                    </p>
                  </div>
                  {taxExempt && (
                    <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                      -${Number(taxAmount).toFixed(2)}
                    </span>
                  )}
                </div>
                {taxExempt && (
                  <input
                    type="text"
                    value={taxExemptIdRef}
                    onChange={(e) => setTaxExemptIdRef(e.target.value)}
                    disabled={isSubmitting || isSendingToKitchen}
                    className="mt-3 w-full px-3 py-2 text-sm border border-blue-300 dark:border-blue-700 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                    placeholder="Tax ID Reference"
                  />
                )}
              </div>
            )}

            {/* Tip Section */}
            <div className="mb-6 p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 mb-3">
                <Star className="text-yellow-500" size={20} />
                <label className="font-semibold text-gray-800 dark:text-gray-200">Add Tip</label>
                {tipAmount > 0 && (
                  <span className="ml-auto text-lg font-bold text-yellow-600 dark:text-yellow-400">
                    +${tipAmount.toFixed(2)}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                {tipPercentages.map((percent) => (
                  <button
                    key={percent}
                    onClick={() => handleTipSelect(percent)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      !showCustomTip && Math.abs(tipAmount - (amountDue * percent / 100)) < 0.01 && percent > 0
                        ? 'bg-yellow-500 text-white'
                        : percent === 0 && tipAmount === 0
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                    }`}
                  >
                    {percent === 0 ? 'No Tip' : `${percent}%`}
                    {percent > 0 && (
                      <span className="block text-xs opacity-70">
                        ${(amountDue * percent / 100).toFixed(2)}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Tip */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCustomTip(!showCustomTip)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    showCustomTip
                      ? 'bg-yellow-500 text-white'
                      : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Custom
                </button>
                {showCustomTip && (
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={customTip}
                      onChange={(e) => handleCustomTipChange(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 text-sm border-2 border-yellow-300 rounded-lg focus:outline-none focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Grand Total with Tip */}
            {tipAmount > 0 && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-green-700 dark:text-green-400 font-medium">Grand Total</div>
                      <div className="text-xs text-green-600 dark:text-green-500">
                      ${amountDue.toFixed(2)} + ${tipAmount.toFixed(2)} tip
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                    ${grandTotal.toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Select Payment Method
              </label>
              <div className="grid grid-cols-4 gap-3">
                {paymentMethods.map((m) => {
                  const Icon = m.icon;
                  const isSelected = method === m.id;
                   const colorClasses = {
                    green: isSelected ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-200 hover:border-green-400 hover:bg-green-50',
                    blue: isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50',
                    orange: isSelected ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-700 border-gray-200 hover:border-orange-400 hover:bg-orange-50',
                    purple: isSelected ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-200 hover:border-purple-400 hover:bg-purple-50',
                  };
                  
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      disabled={isSubmitting || isSendingToKitchen}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${colorClasses[m.color]} ${
                        isSelected ? 'ring-2 ring-offset-1 ring-offset-transparent ring-blue-300 shadow-lg scale-[1.01]' : ''
                      } dark:bg-gray-700 dark:text-white dark:border-gray-600 disabled:opacity-50`}
                    >
                      <Icon size={20} className={isSelected ? 'text-white' : ''} />
                      <span className="font-medium">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Method Specific Inputs */}
            {isCash && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Amount Received
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                  <input
                    type="number"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(parseFloat(e.target.value) || 0)}
                    disabled={isSubmitting || isSendingToKitchen}
                    className="w-full pl-10 pr-4 py-3 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white font-semibold disabled:opacity-50"
                    step="0.01"
                    min={grandTotal}
                  />
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {suggestedCashAmounts.map((amt) => (
                    <button
                      key={`cash-${amt}`}
                      onClick={() => setAmountTendered(amt)}
                      disabled={isSubmitting || isSendingToKitchen}
                      className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      ${amt.toFixed(2)}
                    </button>
                  ))}
                  <button
                    onClick={() => setAmountTendered(grandTotal)}
                    disabled={isSubmitting || isSendingToKitchen}
                    className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-50"
                  >
                    Exact
                  </button>
                </div>
              </div>
            )}

            {isCard && (
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Card Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCardType('CREDIT_CARD')}
                      className={`flex-1 py-2 rounded-lg border ${cardType === 'CREDIT_CARD' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
                      disabled={isSubmitting || isSendingToKitchen}
                    >
                      Credit
                    </button>
                    <button
                      onClick={() => setCardType('DEBIT_CARD')}
                      className={`flex-1 py-2 rounded-lg border ${cardType === 'DEBIT_CARD' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
                      disabled={isSubmitting || isSendingToKitchen}
                    >
                      Debit
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Last 4 Digits
                  </label>
                  <input
                    type="text"
                    value={cardLast4}
                    onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    disabled={isSubmitting || isSendingToKitchen}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                    placeholder="1234"
                  />
                </div>
                <div className="col-span-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCardType('CREDIT_CARD');
                      setCardLast4('4242');
                      setReference(`DEMO-VISA-4242-${Date.now()}`);
                    }}
                    disabled={isSubmitting || isSendingToKitchen}
                    className="w-full py-2.5 px-3 rounded-lg border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    Use Demo Credit Card (Visa •••• 4242)
                  </button>
                </div>
              </div>
            )}

            {isTap && (
              <div className="mb-4 p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet size={18} className="text-blue-600 dark:text-blue-300" />
                    <span className="font-medium text-blue-700 dark:text-blue-200">Tap to Pay Terminal</span>
                  </div>
                  <button
                    onClick={() => setTapStep(tapStep === 'ready' ? 'idle' : 'ready')}
                    disabled={isSubmitting || isSendingToKitchen}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {tapStep === 'ready' ? 'Terminal Ready' : 'Enable Tap'}
                  </button>
                </div>
                <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  {tapStep === 'processing'
                    ? 'Processing NFC payment...'
                    : tapStep === 'ready'
                    ? 'Ask customer to tap card or phone on terminal.'
                    : 'Enable terminal before processing payment.'}
                </p>
              </div>
            )}

                        {/* Other Payment Method */}
            {isOther && (
              <div className="mb-4 p-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet size={18} className="text-purple-600 dark:text-purple-300" />
                  <span className="font-medium text-purple-700 dark:text-purple-200">Other Payment Method</span>
                </div>
                <input
                  type="text"
                  value={otherPaymentNote}
                  onChange={(e) => setOtherPaymentNote(e.target.value)}
                  disabled={isSubmitting || isSendingToKitchen}
                  className="w-full px-4 py-3 border-2 border-purple-200 dark:border-purple-700 rounded-xl focus:outline-none focus:border-purple-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  placeholder="e.g., Check #1234, Voucher, Invoice, House Account..."
                />
                <p className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                  Describe the payment type. This will be recorded with the transaction.
                </p>
              </div>
            )}

            {/* Reference Number for card payments */}
            {needsReference && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Reference / Transaction ID
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  disabled={isSubmitting || isSendingToKitchen}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  placeholder="Enter transaction reference..."
                />
              </div>
            )}

            {/* Change Display */}
            {isCash && change > 0 && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-green-700 dark:text-green-400 font-medium">Change Due:</span>
                  <span className="text-2xl font-bold text-green-700 dark:text-green-400">${change.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Error message if amount is insufficient */}
            {isCash && amountTendered < grandTotal && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                  Amount must be at least ${grandTotal.toFixed(2)}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {/* Send to Kitchen Button - Only show if handler provided */}
              {onSendToKitchen && (
                <button
                  onClick={handleSendToKitchen}
                  disabled={!canSendToKitchen}
                  className="flex-1 py-3 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-xl font-semibold hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingToKitchen ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <ChefHat size={20} />
                      Send to Kitchen
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={handleSubmit}
                disabled={!canComplete}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign size={20} />
                    Pay ${grandTotal.toFixed(2)}
                  </>
                )}
              </button>
            </div>

            <button
              onClick={onCancel}
              disabled={isSubmitting || isSendingToKitchen}
              className="w-full mt-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentModal;
