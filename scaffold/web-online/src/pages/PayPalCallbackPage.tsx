import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const STORAGE_STORE = 'web-online-paypal-storeId';

/**
 * Full-page return from PayPal. Query `token` = PayPal order id (sandbox & live Orders v2).
 */
const PayPalCallbackPage: React.FC<{ showToast?: (msg: string, type: 'success' | 'error') => void }> = ({
  showToast,
}) => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [msg, setMsg] = useState('Completing PayPal payment…');

  useEffect(() => {
    const token = params.get('token');
    const storeId = sessionStorage.getItem(STORAGE_STORE);
    sessionStorage.removeItem(STORAGE_STORE);

    if (!token || !storeId) {
      setMsg('Missing payment session — start checkout again.');
      showToast?.('PayPal session expired. Try again.', 'error');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/payments/paypal/capture`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paypalOrderId: token, storeId }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((json as any).message || 'Capture failed');

        const orderId = (json as any).orderId as string | undefined;
        showToast?.('Payment received via PayPal', 'success');
        navigate(`/confirmation${orderId ? `?orderId=${encodeURIComponent(orderId)}` : ''}`);
      } catch (e: any) {
        console.error('[PayPal return]', e);
        setMsg(e?.message || 'PayPal completion failed.');
        showToast?.(e?.message || 'PayPal failed', 'error');
      }
    })();
  }, [navigate, params, showToast]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-4">
        <div className="animate-pulse h-14 w-14 rounded-full border-4 border-blue-400 border-t-transparent mx-auto" />
        <p className="text-gray-300 text-sm">{msg}</p>
      </div>
    </div>
  );
};

export default PayPalCallbackPage;
export { STORAGE_STORE };
