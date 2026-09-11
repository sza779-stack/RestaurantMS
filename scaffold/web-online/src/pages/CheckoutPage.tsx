import React, { useMemo, useState } from 'react';
import type { RefObject } from 'react';
import {
  CheckCircle,
  CreditCard,
  Star,
  Zap,
  Clock,
  ShoppingBag,
  CreditCard as CardIcon,
  Banknote as CashIcon,
  Layers,
  ChefHat,
} from 'lucide-react';

import SquareCardForm, { type SquareCardHandle } from '../components/SquareCardForm';

export type CheckoutMethodId = 'CASH' | 'STRIPE' | 'PAYPAL' | 'SQUARE';

export interface CheckoutMethodOption {
  id: CheckoutMethodId;
  label: string;
}

interface CheckoutPageProps {
  setView: (view: any) => void;
  orderType: 'delivery' | 'pickup';
  setOrderType: (type: 'delivery' | 'pickup') => void;
  deliveryAddress: any;
  setDeliveryAddress: (address: any) => void;
  selectedPaymentMethod: CheckoutMethodId;
  setSelectedPaymentMethod: (method: CheckoutMethodId) => void;
  checkoutMethodOptions: CheckoutMethodOption[];
  squareIntegration: {
    enabled: boolean;
    applicationId: string | null;
    locationId: string | null;
  };
  squareCardRef: RefObject<SquareCardHandle | null>;

  cartTotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  isSubmitting: boolean;
  cart: any[];

  /** Unified checkout: routes internally by `selectedPaymentMethod`. */
  onCheckout: () => Promise<void>;

  showToast: (message: string, type: any) => void;
  loyaltyPointsAvailable: number;
  loyaltyPointsUsed: number;
  setLoyaltyPointsUsed: (pts: number) => void;
  tipAmount: number;
  setTipAmount: (tip: number) => void;

  capabilitiesLoading?: boolean;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({
  setView,
  orderType,
  setOrderType,
  deliveryAddress,
  setDeliveryAddress,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  checkoutMethodOptions,
  squareIntegration,
  squareCardRef,

  cartTotal,
  tax,
  deliveryFee,
  total,
  isSubmitting,
  cart,

  onCheckout,
  showToast,
  loyaltyPointsAvailable,
  loyaltyPointsUsed,
  setLoyaltyPointsUsed,
  tipAmount,
  setTipAmount,
  capabilitiesLoading,
}) => {
  const [showCustomTip, setShowCustomTip] = useState(false);
  const [customTipValue, setCustomTipValue] = useState('');

  const tipPresets = [
    { label: 'No Tip', value: 0 },
    { label: '10%', value: cartTotal * 0.1 },
    { label: '15%', value: cartTotal * 0.15 },
    { label: '18%', value: cartTotal * 0.18 },
    { label: '20%', value: cartTotal * 0.2 },
    { label: '25%', value: cartTotal * 0.25 },
  ];

  const gridCols =
    checkoutMethodOptions.length <= 2
      ? 'grid-cols-2'
      : checkoutMethodOptions.length === 3
        ? 'grid-cols-3'
        : 'grid-cols-2 sm:grid-cols-4';

  const methodIcon = (id: CheckoutMethodId) => {
    switch (id) {
      case 'CASH':
        return <CashIcon className="w-5 h-5" />;
      case 'STRIPE':
        return <CardIcon className="w-5 h-5" />;
      case 'PAYPAL':
        return <span className="text-lg font-black text-[#00457C]">P</span>;
      case 'SQUARE':
        return <Layers className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const payLabel = useMemo(() => {
    switch (selectedPaymentMethod) {
      case 'STRIPE':
        return `Pay securely $${total.toFixed(2)}`;
      case 'PAYPAL':
        return `PayPal · $${total.toFixed(2)}`;
      case 'SQUARE':
        return `Pay with Square $${total.toFixed(2)}`;
      case 'CASH':
      default:
        return `Place order · $${total.toFixed(2)}`;
    }
  }, [selectedPaymentMethod, total]);

  const handleCustomTipSubmit = () => {
    const val = parseFloat(customTipValue);
    if (!isNaN(val)) {
      setTipAmount(val);
      setShowCustomTip(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-purple-500/30">
      <div className="max-w-xl mx-auto px-6 py-8 space-y-6 pb-32">
        {capabilitiesLoading && (
          <p className="text-center text-[11px] text-indigo-300 font-bold uppercase tracking-widest">
            Loading accepted payment methods…
          </p>
        )}
        {/* Amount Due Card */}
        <div className="bg-[#1e293b]/50 border border-white/5 rounded-lg p-8 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Amount Due</p>
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="text-3xl font-medium text-gray-400">$</span>
            <h2 className="text-6xl font-black tracking-tight">{total.toFixed(2)}</h2>
          </div>
          <p className="text-sm text-gray-500 font-medium">
            Tax: ${tax.toFixed(2)}
            {deliveryFee > 0 ? ` · Delivery ${deliveryFee.toFixed(2)}` : ''}
          </p>

          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full">
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
              {orderType}
            </span>
          </div>
        </div>

        {/* Loyalty */}
        <div className="bg-[#1e293b]/40 border border-purple-500/20 rounded-lg p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Star className="w-12 h-12 text-purple-400" />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-purple-400 fill-purple-400" />
            <h3 className="text-sm font-bold text-purple-200">
              Loyalty Points Available: {loyaltyPointsAvailable}
            </h3>
          </div>

          <div className="space-y-4">
            <input
              type="range"
              min={0}
              max={Math.min(loyaltyPointsAvailable, Math.floor(cartTotal * 100))}
              step={10}
              value={loyaltyPointsUsed}
              onChange={(e) => setLoyaltyPointsUsed(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between items-center text-[11px] font-bold tracking-wider">
              <span className="text-gray-500 uppercase">Apply Points</span>
              <span className="text-purple-400 text-sm font-black">{loyaltyPointsUsed} pts</span>
            </div>
            <p className="text-[10px] text-gray-500 italic">* 100 points = $1.00 Off</p>
          </div>
        </div>

        {/* Delivery */}
        <div className="bg-[#1e293b]/30 border border-white/5 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Delivery Details</h3>
            <button
              type="button"
              onClick={() => setOrderType(orderType === 'delivery' ? 'pickup' : 'delivery')}
              className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300"
            >
              Change
            </button>
          </div>

          {orderType === 'delivery' ? (
            <div className="space-y-4">
              <input
                type="text"
                value={deliveryAddress.street}
                onChange={(e) =>
                  setDeliveryAddress((prev: any) => ({ ...prev, street: e.target.value }))
                }
                placeholder="Street Address"
                className="w-full bg-[#0f172a]/50 border border-white/5 rounded-lg px-5 py-4 text-sm focus:border-indigo-500 focus:outline-none transition-all placeholder:text-gray-600"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={deliveryAddress.city}
                  onChange={(e) =>
                    setDeliveryAddress((prev: any) => ({ ...prev, city: e.target.value }))
                  }
                  placeholder="City"
                  className="bg-[#0f172a]/50 border border-white/5 rounded-lg px-5 py-4 text-sm focus:border-indigo-500 focus:outline-none transition-all placeholder:text-gray-600"
                />
                <input
                  type="text"
                  value={deliveryAddress.zip}
                  onChange={(e) =>
                    setDeliveryAddress((prev: any) => ({ ...prev, zip: e.target.value }))
                  }
                  placeholder="ZIP"
                  className="bg-[#0f172a]/50 border border-white/5 rounded-lg px-5 py-4 text-sm focus:border-indigo-500 focus:outline-none transition-all placeholder:text-gray-600"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-sm font-bold text-indigo-200">Ready in 15-20 mins</p>
                <p className="text-xs text-indigo-400/60">Pickup from store counter</p>
              </div>
            </div>
          )}
        </div>

        {/* Tip */}
        <div className="bg-[#1e293b]/40 border border-orange-500/10 rounded-lg p-6 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-6">
            <Star className="w-5 h-5 text-orange-400" />
            <h3 className="text-sm font-bold text-orange-200 uppercase tracking-widest">Add Tip</h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {tipPresets.map((preset) => (
              <button
                type="button"
                key={preset.label}
                onClick={() => {
                  setTipAmount(preset.value);
                  setShowCustomTip(false);
                }}
                className={`flex flex-col items-center justify-center py-4 rounded-lg border transition-all ${
                  tipAmount === preset.value && !showCustomTip
                    ? 'bg-orange-500/10 border-orange-500/50 shadow-lg shadow-orange-500/10'
                    : 'bg-[#0f172a]/40 border-white/5 hover:border-white/10'
                }`}
              >
                <span className="text-sm font-black">{preset.label}</span>
                {preset.value > 0 && (
                  <span className="text-[10px] text-gray-500 mt-1">${preset.value.toFixed(2)}</span>
                )}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowCustomTip(true)}
              className={`flex items-center justify-center py-4 rounded-lg border transition-all ${
                showCustomTip
                  ? 'bg-orange-500/10 border-orange-500/50 shadow-lg shadow-orange-500/10'
                  : 'bg-[#0f172a]/40 border-white/5 hover:border-white/10'
              }`}
            >
              <span className="text-sm font-black uppercase">Custom</span>
            </button>
          </div>

          {showCustomTip && (
            <div className="mt-4 flex gap-2">
              <input
                type="number"
                value={customTipValue}
                onChange={(e) => setCustomTipValue(e.target.value)}
                placeholder="Enter amount"
                autoFocus
                className="flex-1 bg-[#0f172a]/50 border border-orange-500/30 rounded-lg px-5 py-4 text-sm focus:border-orange-500 focus:outline-none transition-all placeholder:text-gray-700"
              />
              <button
                type="button"
                onClick={handleCustomTipSubmit}
                className="px-6 bg-orange-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-orange-500/20"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Payment methods from store caps */}
        <div className="space-y-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2">
            Select Payment Method
          </p>
          {!checkoutMethodOptions.length && (
            <p className="text-xs text-amber-200 text-center px-2">
              No payment methods enabled for web ordering. Ask the store Admin to configure Settings → Payments.
            </p>
          )}
          <div className={`grid ${gridCols} gap-3`}>
            {checkoutMethodOptions.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setSelectedPaymentMethod(method.id)}
                className={`flex flex-col items-center justify-center py-5 rounded-lg border transition-all min-h-[100px] ${
                  selectedPaymentMethod === method.id
                    ? 'bg-indigo-500/10 border-indigo-400 shadow-xl shadow-indigo-500/10 ring-4 ring-indigo-500/20'
                    : 'bg-[#1e293b]/40 border-white/5 hover:bg-[#1e293b]/60'
                }`}
              >
                <div
                  className={`${
                    selectedPaymentMethod === method.id ? 'text-indigo-400' : 'text-gray-500'
                  } mb-2`}
                >
                  {methodIcon(method.id)}
                </div>
                <span
                  className={`text-[11px] font-black uppercase tracking-wider text-center leading-tight px-1 ${
                    selectedPaymentMethod === method.id ? 'text-indigo-200' : 'text-gray-500'
                  }`}
                >
                  {method.label}
                </span>
              </button>
            ))}
          </div>
          {squareIntegration.enabled && selectedPaymentMethod === 'SQUARE' && (
            <div className="mt-6 p-5 rounded-xl bg-[#131b2f] border border-white/10">
              <CreditCard className="w-4 h-4 text-indigo-300 mb-3" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300 mb-3">
                Card details (Square)
              </p>
              <SquareCardForm
                ref={squareCardRef}
                disabled={isSubmitting}
                applicationId={squareIntegration.applicationId || ''}
                locationId={squareIntegration.locationId || ''}
              />
            </div>
          )}
        </div>

        {(selectedPaymentMethod === 'STRIPE' ||
          selectedPaymentMethod === 'PAYPAL' ||
          selectedPaymentMethod === 'SQUARE') && (
          <p className="text-[10px] text-center text-gray-600 leading-relaxed px-4">
            You&apos;ll finalize payment securely on the{' '}
            {selectedPaymentMethod === 'STRIPE'
              ? 'Stripe'
              : selectedPaymentMethod === 'PAYPAL'
                ? 'PayPal'
                : 'Square'}{' '}
            page. Your kitchen ticket is queued after confirmation.
          </p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0f172a]/90 backdrop-blur-2xl border-t border-white/5 p-6 z-50">
        <div className="max-w-xl mx-auto grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setView('menu')}
            className="flex items-center justify-center gap-3 py-4 rounded-lg bg-orange-950/20 border border-orange-500/10 text-orange-200/60 font-bold text-sm hover:bg-orange-950/30 transition-all"
          >
            <ChefHat className="w-4 h-4" />
            Send to Kitchen
          </button>

          <button
            type="button"
            disabled={
              isSubmitting ||
              capabilitiesLoading ||
              cart.length === 0 ||
              !checkoutMethodOptions.length ||
              (orderType === 'delivery' && !deliveryAddress.street)
            }
            onClick={() =>
              onCheckout().catch(() => showToast('Unable to place order right now.', 'error'))
            }
            className="flex flex-col items-center justify-center gap-0.5 py-4 rounded-lg bg-green-500 text-green-950 font-black text-sm shadow-xl shadow-green-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              {isSubmitting ? 'Processing…' : payLabel}
            </span>
          </button>
        </div>
        <button
          type="button"
          className="w-full mt-4 text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em] hover:text-gray-400 transition-colors"
          onClick={() => setView('cart')}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;
