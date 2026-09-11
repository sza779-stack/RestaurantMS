import React, { useState, useEffect, Suspense, lazy, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer as ToastifyContainer, toast as toastify } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useTheme } from './hooks/useTheme';

// Import extracted pages
import LandingPage from './pages/LandingPage';
import MenuPage from './pages/MenuPage';
import CheckoutPage, { CheckoutMethodId, CheckoutMethodOption } from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import RewardsPage from './pages/RewardsPage';
import CartPage from './pages/CartPage';
import ConfirmationPage from './pages/ConfirmationPage';
import AccountPage from './pages/AccountPage';
import GlobalHeader from './components/GlobalHeader';
import PayPalCallbackPage, { STORAGE_STORE as PAYPAL_SESSION_KEY } from './pages/PayPalCallbackPage';
import type { SquareCardHandle } from './components/SquareCardForm';

// Lazy load build components
const BuildYourOwnPizza = lazy(() => import('./components/build/BuildYourOwnPizza'));
const BuildYourOwnSub = lazy(() => import('./components/build/BuildYourOwnSub'));
const BuildYourOwnPasta = lazy(() => import('./components/build/BuildYourOwnPasta'));

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type StorePaymentCaps = {
  acceptCash: boolean;
  acceptCard: boolean;
  acceptOnlinePayment: boolean;
  stripe: { checkoutEnabled: boolean };
  paypal: { enabled: boolean };
  square: { enabled: boolean; applicationId: string | null; locationId: string | null };
};
// ============== TYPES ==============
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  description?: string;
  modifiers?: string[];
}

interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  loyaltyPoints: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  savedAddresses: any[];
  orderHistory: any[];
  preferences: {
    dietaryRestrictions: string[];
    favoriteItems: string[];
  };
}

type RecentOrder = {
  orderId?: string;
  orderNumber: string;
  total: number;
  status: string;
  type?: 'delivery' | 'pickup';
  payments?: Array<{ method: string; status: string; amount?: number }>;
  items?: Array<{ name: string; quantity: number; price?: number }>;
  createdAt: string;
  lastUpdateAt?: string;
};

interface DeliveryAddressForm {
  street: string;
  city: string;
  state: string;
  zip: string;
  unit?: string;
  instructions?: string;
}

const FEATURED_ITEMS = [
  { id: '1', name: 'Cyber Pepperoni', description: 'Loaded with premium pepperoni and molten mozzarella', price: 18.99, image: '/images/pepperoni.png', category: 'pizza', rating: 4.8, reviews: 234, isPopular: true, calories: 280 },
  { id: '2', name: 'Quantum BBQ Chicken', description: 'Grilled chicken, BBQ sauce, red onions, cilantro', price: 19.99, image: '/images/bbq-chicken.png', category: 'pizza', rating: 4.7, reviews: 189, isNew: true, calories: 310 },
  { id: '3', name: 'Nebula Veggie', description: 'Fresh mushrooms, peppers, onions, olives, tomatoes', price: 17.99, image: '/images/veggie.png', category: 'pizza', rating: 4.6, reviews: 156, calories: 240 },
  { id: '4', name: 'Solar Meat Lovers', description: 'Pepperoni, sausage, bacon, ham, beef', price: 21.99, image: '/images/meat-lovers.png', category: 'pizza', rating: 4.9, reviews: 312, isPopular: true, calories: 350 },
];

const REWARDS_TIERS = [
  { name: 'Bronze', points: 0, color: 'from-amber-700 to-amber-600', benefits: ['Earn 1 point per $1', 'Birthday reward'] },
  { name: 'Silver', points: 500, color: 'from-gray-400 to-gray-300', benefits: ['Earn 1.25 points per $1', 'Free delivery', 'Early access to deals'] },
  { name: 'Gold', points: 1500, color: 'from-yellow-400 to-yellow-300', benefits: ['Earn 1.5 points per $1', 'Priority support', 'Exclusive menu items'] },
  { name: 'Platinum', points: 5000, color: 'from-purple-500 to-pink-500', benefits: ['Earn 2 points per $1', 'Personal offers', 'VIP events'] },
];

function AppContent() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [storeId, setStoreId] = useState('default-store');
  const [storeOptions, setStoreOptions] = useState<
    Array<{
      id: string;
      name: string;
      code?: string;
      taxRate?: number | string;
      deliveryFee?: number | string;
      address?: string;
      phone?: string;
    }>
  >([]);
  const [activeOrderNumber, setActiveOrderNumber] = useState('');
  const activeOrderNumberRef = useRef('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentCapabilities, setPaymentCapabilities] = useState<StorePaymentCaps | null>(null);
  const [capabilitiesLoading, setCapabilitiesLoading] = useState(true);
  const squareCardRef = useRef<SquareCardHandle | null>(null);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<CheckoutMethodId>('CASH');
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddressForm>({
    street: '', city: '', state: '', zip: '', unit: '', instructions: ''
  });
  const { theme, toggleTheme } = useTheme();
  const [combos, setCombos] = useState<any[]>([]);
  const [combosLoading, setCombosLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [loyaltyPointsUsed, setLoyaltyPointsUsed] = useState(0);

  // Bridge our internal toast helper to the already-mounted react-toastify container.
  // Console fallback is kept so headless contexts (tests, SSR) don't crash.
  //
  // Each toast carries a stable `toastId` derived from its type+message so duplicate
  // events (e.g. the gateway re-broadcasting "Menu updated") collapse into a single
  // visible toast instead of spamming the corner.
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (typeof window === 'undefined') {
      console.log(`Toast [${type}]: ${message}`);
      return;
    }
    const toastId = `${type}:${message}`;
    const opts = {
      position: 'top-right' as const,
      autoClose: type === 'error' ? 5000 : 3000,
      toastId,
    };
    if (type === 'success') toastify.success(message, opts);
    else if (type === 'error') toastify.error(message, opts);
    else toastify.info(message, opts);
  };

  useEffect(() => {
    activeOrderNumberRef.current = activeOrderNumber;
  }, [activeOrderNumber]);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/v1/orders/public/default-store`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_URL}/api/v1/orders/public/stores`).then((r) => (r.ok ? r.json() : [])),
    ]).then(([defaultStore, stores]) => {
      if (Array.isArray(stores)) setStoreOptions(stores);
      if (defaultStore?.storeId) setStoreId(defaultStore.storeId);
    }).catch(() => { });
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('web-online-recent-orders');
      if (raw) setRecentOrders(JSON.parse(raw));
    } catch { setRecentOrders([]); }
  }, []);

  useEffect(() => {
    const newSocket = io(`${API_URL}/ws`, { transports: ['websocket'], auth: { token: 'online-token' } });
    setSocket(newSocket);
    newSocket.on('connect', () => { newSocket.emit('online:subscribe', storeId); });

    const handleStatus = (payload: any) => {
      const orderData = payload?.data || payload;
      const orderNumber = orderData?.orderNumber;
      if (orderNumber) setActiveOrderNumber(orderNumber);
    };

    newSocket.on('order:status:changed', handleStatus);
    newSocket.on('menu:updated', () => {
      console.log('Menu updated, reloading combos...');
      showToast('Menu updated in real-time!', 'info');
      loadCombos();
    });
    return () => { newSocket.close(); };
  }, [storeId]);

  const loadCombos = () => {
    if (!storeId) return;
    setCombosLoading(true);
    fetch(`${API_URL}/api/v1/combos/available?storeId=${storeId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setCombos(data))
      .catch(() => setCombos([]))
      .finally(() => setCombosLoading(false));
  };

  useEffect(() => {
    loadCombos();
  }, [storeId]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Pull tax/delivery from the currently-selected store so customers see the same totals
  // they'd see at the POS. Backend stores `taxRate` as a fraction (0.0825 = 8.25%) and
  // `deliveryFee` as a dollar amount. Fall back to historical defaults only if the API
  // hasn't responded yet, so the cart still renders something sensible during initial load.
  const selectedStore = storeOptions.find((s) => s.id === storeId);
  const taxRateFraction = (() => {
    const n = Number(selectedStore?.taxRate);
    return Number.isFinite(n) && n >= 0 ? n : 0.08;
  })();
  const deliveryFeeAmount = (() => {
    const n = Number(selectedStore?.deliveryFee);
    return Number.isFinite(n) && n >= 0 ? n : 3.99;
  })();
  const tax = cartTotal * taxRateFraction;
  const deliveryFee = orderType === 'delivery' ? deliveryFeeAmount : 0;
  const loyaltyDiscount = loyaltyPointsUsed / 100;
  const total = cart.length > 0 ? Math.max(0, cartTotal + tax + deliveryFee + tipAmount - loyaltyDiscount) : 0;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!storeId) return;
      setCapabilitiesLoading(true);
      try {
        const url = `${API_URL}/api/v1/payments/capabilities?storeId=${encodeURIComponent(storeId)}`;
        const res = await fetch(url);
        const raw = await res.json().catch(() => null);
        if (!cancelled && res.ok && raw && typeof raw === 'object') {
          setPaymentCapabilities(raw as StorePaymentCaps);
        } else if (!cancelled) {
          setPaymentCapabilities(null);
        }
      } catch {
        if (!cancelled) setPaymentCapabilities(null);
      } finally {
        if (!cancelled) setCapabilitiesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const checkoutMethodOptions = useMemo((): CheckoutMethodOption[] => {
    const cap = paymentCapabilities;
    if (!cap) return [];
    const opts: CheckoutMethodOption[] = [];
    if (cap.acceptCash) {
      opts.push({ id: 'CASH', label: 'Cash · pay at pickup' });
    }
    const online = cap.acceptOnlinePayment;
    if (online && cap.stripe.checkoutEnabled) opts.push({ id: 'STRIPE', label: 'Card · Stripe' });
    if (online && cap.paypal.enabled) opts.push({ id: 'PAYPAL', label: 'PayPal' });
    if (online && cap.square.enabled) opts.push({ id: 'SQUARE', label: 'Square' });
    return opts;
  }, [paymentCapabilities]);

  useEffect(() => {
    if (!checkoutMethodOptions.length) return;
    setSelectedPaymentMethod((prev) =>
      checkoutMethodOptions.some((m) => m.id === prev)
        ? prev
        : checkoutMethodOptions[0].id,
    );
  }, [checkoutMethodOptions]);

  const squareIntegration = useMemo(
    () =>
      ({
        enabled: Boolean(
          paymentCapabilities?.acceptOnlinePayment && paymentCapabilities?.square.enabled,
        ),
        applicationId: paymentCapabilities?.square.applicationId ?? null,
        locationId: paymentCapabilities?.square.locationId ?? null,
      }) satisfies {
        enabled: boolean;
        applicationId: string | null;
        locationId: string | null;
      },
    [paymentCapabilities],
  );

  const persistRecentOrderLocal = (
    ord: any,
    displayTotal: number,
    extras?: Partial<RecentOrder>,
  ) => {
    const orderNumber = ord.orderNumber || ord.id;
    setRecentOrders((prev) => {
      const row: RecentOrder = {
        orderId: ord.id,
        orderNumber,
        total: displayTotal,
        status: ord.status || 'PENDING',
        type: orderType,
        items: cart.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        createdAt: new Date().toISOString(),
        ...extras,
      };
      const next = [row, ...prev].slice(0, 20);
      localStorage.setItem('web-online-recent-orders', JSON.stringify(next));
      return next;
    });
    if (socket?.connected) {
      socket.emit('order:placed', { ...ord, storeId });
    }
    setActiveOrderNumber(orderNumber);
  };

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i)).filter((i) => i.quantity > 0));
  };

  const handleUnifiedCheckout = async () => {
    if (cart.length === 0 || isSubmitting) return;
    if (!paymentCapabilities) {
      showToast('Payment settings are loading. Try again in a moment.', 'error');
      return;
    }

    const allowedIds = checkoutMethodOptions.map((m) => m.id);
    if (!allowedIds.includes(selectedPaymentMethod)) {
      showToast('Pick a listed payment option for web ordering.', 'error');
      return;
    }

    if (loyaltyPointsUsed > 0 && !customer?.phone?.replace(/\D/g, '')) {
      showToast('Add your phone number in Account before redeeming loyalty points.', 'error');
      return;
    }

    const baseTotalBeforePoints = cartTotal + tax + deliveryFee + tipAmount;

    const buildOrderBody = () => ({
      storeId,
      type: orderType === 'delivery' ? 'DELIVERY' : 'PICKUP',
      customerName: customer?.name || undefined,
      customerPhone: customer?.phone || undefined,
      customerEmail: customer?.email || undefined,
      deliveryAddress:
        orderType === 'delivery' && deliveryAddress.street
          ? {
              street: deliveryAddress.street,
              city: deliveryAddress.city,
              state: deliveryAddress.state,
              zipCode: deliveryAddress.zip,
              unit: deliveryAddress.unit,
              instructions: deliveryAddress.instructions,
            }
          : undefined,
      items: cart.map((item) => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        modifiers: item.modifiers || [],
      })),
      subtotal: cartTotal,
      taxAmount: tax,
      deliveryFee,
      tipAmount,
      total: baseTotalBeforePoints,
      loyaltyPointsUsed: loyaltyPointsUsed > 0 ? loyaltyPointsUsed : undefined,
      source: 'WEB',
      payments: [] as unknown[],
    });

    const postJson = async <T = any>(
      path: string,
      payload: Record<string, unknown>,
    ): Promise<{ ok: boolean; json: T; status: number }> => {
      const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as T;
      return { ok: res.ok, json, status: res.status };
    };

    const placeOrderOnline = async () => {
      const payload = buildOrderBody();
      const res = await postJson(`/api/v1/orders`, payload);
      if (!res.ok)
        throw new Error(
          typeof (res.json as any).message === 'string'
            ? (res.json as any).message
            : `Order failed (${res.status})`,
        );
      return res.json as any;
    };

    const origin =
      typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';

    setIsSubmitting(true);
    try {
      if (selectedPaymentMethod === 'CASH') {
        const order = await placeOrderOnline();
        persistRecentOrderLocal(order, total);
        showToast('Order placed · pay cash at pickup', 'success');
        setCart([]);
        navigate(`/confirmation${order?.id ? `?orderId=${encodeURIComponent(order.id)}` : ''}`);
        setTipAmount(0);
        setLoyaltyPointsUsed(0);
        return;
      }

      if (selectedPaymentMethod === 'STRIPE') {
        const order = await placeOrderOnline();
        const successUrl = `${origin}/confirmation?checkout=stripe`;
        const cancelUrl = `${origin}/checkout`;

        const { ok, json } = await postJson(`/api/v1/payments/checkout-session`, {
          orderId: order.id,
          customerEmail: customer?.email,
          successUrl,
          cancelUrl,
        });

        if (!ok || !(json as any)?.checkoutUrl) {
          throw new Error(
            (json as any)?.message ||
              'Stripe Checkout is unavailable. Confirm Admin → Payments → Stripe is configured.',
          );
        }

        persistRecentOrderLocal(order, total, { payments: [{ method: 'ONLINE', status: 'PROCESSING' }] });
        window.location.href = (json as any).checkoutUrl;
        return;
      }

      if (selectedPaymentMethod === 'PAYPAL') {
        const order = await placeOrderOnline();
        sessionStorage.setItem(PAYPAL_SESSION_KEY, storeId);

        const { ok, json } = await postJson(`/api/v1/payments/paypal/create-order`, {
          orderId: order.id,
          storeId,
          returnUrl: `${origin}/paypal-callback`,
          cancelUrl: `${origin}/checkout?paypal=cancel`,
        });

        if (!ok || !(json as any)?.approvalUrl) {
          sessionStorage.removeItem(PAYPAL_SESSION_KEY);
          throw new Error((json as any)?.message || 'PayPal Checkout could not start.');
        }

        persistRecentOrderLocal(order, total, { payments: [{ method: 'ONLINE', status: 'PROCESSING' }] });
        window.location.href = (json as any).approvalUrl;
        return;
      }

      if (selectedPaymentMethod === 'SQUARE') {
        const token = await squareCardRef.current?.tokenize?.();
        if (!token) {
          throw new Error('Enter your Square card details to continue.');
        }
        const order = await placeOrderOnline();
        const { ok, json } = await postJson(`/api/v1/payments/square/charge`, {
          orderId: order.id,
          storeId,
          sourceId: token,
        });
        if (!ok) throw new Error((json as any)?.message || 'Square payment declined.');
        persistRecentOrderLocal(order, total, { payments: [{ method: 'ONLINE', status: 'COMPLETED' }] });
        setCart([]);
        setTipAmount(0);
        setLoyaltyPointsUsed(0);
        showToast('Square payment succeeded', 'success');
        navigate(`/confirmation?orderId=${encodeURIComponent(order.id)}`);
        return;
      }
    } catch (error: any) {
      console.error('Online checkout failed:', error);
      showToast(error?.message || 'Failed to place order. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const normalizeStatusLabel = (status?: string) => {
    const labels: Record<string, string> = { PENDING: 'Pending', CONFIRMED: 'Paid', READY: 'Ready' };
    return labels[String(status || '').toUpperCase()] || (status || 'Placed');
  };

  const setView = (view: string) => {
    navigate(view === 'home' || view === '' ? '/' : `/${view}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <GlobalHeader 
        storeId={storeId}
        setStoreId={setStoreId}
        storeOptions={storeOptions}
        itemCount={itemCount}
        theme={theme}
        toggleTheme={toggleTheme}
        customer={customer}
      />
      <div className="flex-1 flex flex-col relative pt-24">
        <Routes>
          <Route path="/" element={
        <LandingPage
          setView={setView}
          customer={customer}
          itemCount={itemCount}
          total={total}
          storeId={storeId}
          setStoreId={setStoreId}
          storeOptions={storeOptions}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      } />
      <Route path="/menu" element={
        <MenuPage
          setView={setView}
          storeId={storeId}
          setStoreId={setStoreId}
          storeOptions={storeOptions}
          itemCount={itemCount}
          combos={combos}
          combosLoading={combosLoading}
          addToCart={addToCart}
          showToast={showToast}
          FEATURED_ITEMS={FEATURED_ITEMS}
          total={total}
          customer={customer}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      } />
      <Route path="/cart" element={
        <CartPage
          setView={setView}
          storeId={storeId}
          setStoreId={setStoreId}
          storeOptions={storeOptions}
          cart={cart}
          updateQuantity={updateQuantity}
          cartTotal={cartTotal}
          tax={tax}
          total={total}
          itemCount={itemCount}
          customer={customer}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      } />
      <Route path="/checkout" element={
        <CheckoutPage
          setView={setView}
          orderType={orderType}
          setOrderType={setOrderType}
          deliveryAddress={deliveryAddress}
          setDeliveryAddress={setDeliveryAddress}
          selectedPaymentMethod={selectedPaymentMethod}
          setSelectedPaymentMethod={setSelectedPaymentMethod}
          checkoutMethodOptions={checkoutMethodOptions}
          squareIntegration={squareIntegration}
          squareCardRef={squareCardRef}
          cartTotal={cartTotal}
          tax={tax}
          deliveryFee={deliveryFee}
          total={total}
          isSubmitting={isSubmitting}
          cart={cart}
          onCheckout={handleUnifiedCheckout}
          showToast={showToast}
          loyaltyPointsAvailable={customer?.loyaltyPoints ?? 150}
          loyaltyPointsUsed={loyaltyPointsUsed}
          setLoyaltyPointsUsed={setLoyaltyPointsUsed}
          tipAmount={tipAmount}
          setTipAmount={setTipAmount}
          capabilitiesLoading={capabilitiesLoading}
        />
      } />
      <Route path="/paypal-callback" element={<PayPalCallbackPage showToast={showToast} />} />
      <Route path="/confirmation" element={<ConfirmationPage setView={setView} activeOrderNumber={activeOrderNumber} />} />
      <Route path="/orders" element={<OrdersPage setView={setView} activeOrderNumber={activeOrderNumber} recentOrders={recentOrders} normalizeStatusLabel={normalizeStatusLabel} />} />
      <Route path="/rewards" element={<RewardsPage setView={setView} customer={customer} REWARDS_TIERS={REWARDS_TIERS} />} />
      <Route path="/account" element={<AccountPage setView={setView} customer={customer} setCustomer={setCustomer} />} />

      {/* Build Routes */}
      <Route path="/build-pizza" element={
        <Suspense fallback={<div>Loading...</div>}>
          <BuildYourOwnPizza onAdd={addToCart} onCancel={() => navigate('/menu')} />
        </Suspense>
      } />
      <Route path="/build-sub" element={
        <Suspense fallback={<div>Loading...</div>}>
          <BuildYourOwnSub onAdd={addToCart} onCancel={() => navigate('/menu')} />
        </Suspense>
      } />
      <Route path="/build-pasta" element={
        <Suspense fallback={<div>Loading...</div>}>
          <BuildYourOwnPasta onAdd={addToCart} onCancel={() => navigate('/menu')} />
        </Suspense>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
      <ToastifyContainer position="top-right" autoClose={3000} />
    </BrowserRouter>
  );
}

export default App;
