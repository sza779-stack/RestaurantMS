import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ConfirmationPageProps {
  setView: (view: any) => void;
  activeOrderNumber: string;
}

const ConfirmationPage: React.FC<ConfirmationPageProps> = ({ setView, activeOrderNumber }) => {
  const [params] = useSearchParams();
  const orderIdParam = params.get('orderId') || '';

  const [resolvedNumber, setResolvedNumber] = useState<string>('');

  const displayNumber = resolvedNumber || activeOrderNumber;

  useEffect(() => {
    if (!orderIdParam) return;
    if (activeOrderNumber) {
      setResolvedNumber(activeOrderNumber);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/orders/${encodeURIComponent(orderIdParam)}`);
        if (!res.ok) return;
        const ord = await res.json();
        if (ord?.orderNumber) setResolvedNumber(String(ord.orderNumber));
      } catch {
        /* ignore — still show fallback */
      }
    })();
  }, [orderIdParam, activeOrderNumber]);

  const subtitle = useMemo(() => {
    if (params.get('stripe')) return 'Your card payment is processing — you will receive an email shortly.';
    if (params.get('paypal')) return 'PayPal confirmation may take a few seconds.';
    return 'Your order is now in our live kitchen flow.';
  }, [params]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-slate-900/70 border border-white/10 rounded-3xl p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 mx-auto mb-4 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Order Confirmed</h1>
        <p className="text-gray-400 mb-6">{subtitle}</p>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
          <p className="text-sm text-gray-400 mb-1">Order Number</p>
          <p className="text-4xl font-black">{displayNumber || (orderIdParam ? 'Fetching…' : 'Processing')}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setView('orders')}
            className="rounded-xl py-3 bg-white/10 hover:bg-white/15 transition-colors"
          >
            Track Order
          </button>
          <button
            onClick={() => setView('menu')}
            className="rounded-xl py-3 bg-gradient-to-r from-purple-600 to-cyan-600"
          >
            Order More
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;
