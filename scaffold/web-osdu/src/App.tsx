import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Package, CheckCircle, Volume2, VolumeX, Truck, RefreshCw, AlertTriangle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Order {
  id: string;
  tokenNumber: string;
  orderNumber?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'READY' | 'COMPLETED';
  type: 'DINE_IN' | 'PICKUP' | 'DELIVERY';
  items: number;
  customerName?: string;
  itemDetails?: Array<{
    productName: string;
    quantity: number;
  }>;
}

const mapOrderStatus = (status: string | undefined): Order['status'] | null => {
  const s = String(status || '').toUpperCase();
  if (['READY', 'PREPARED', 'PACKED', 'READY_FOR_PICKUP', 'READY_TO_SERVE', 'PACKING'].includes(s)) {
    return 'READY';
  }
	  if (['IN_PROGRESS', 'PREPARING', 'IN_OVEN', 'IN_KITCHEN', 'BAKING', 'COOKING', 'PENDING', 'CREATED', 'CONFIRMED', 'PAID'].includes(s)) {
	    return null;
	  }
  if (['COMPLETED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'OUT_FOR_DELIVERY'].includes(s)) {
    return 'COMPLETED';
  }
  // Unknown statuses: drop the order from the customer display rather than misclassifying it.
  return null;
};

const normalizeOrder = (raw: any): Order | null => {
  const orderId = raw?.id || raw?.orderId || '';
  const orderNumber = raw?.orderNumber || raw?.orderNo || raw?.order_number;
  const tokenNumber = raw?.tokenNumber || (orderNumber ? String(orderNumber).slice(-6) : '') || String(orderId).slice(-6);

  const status = mapOrderStatus(raw?.status);
  if (!status) return null;

  const customerName =
    raw?.customerName ||
    raw?.customer?.name ||
    [raw?.customer?.firstName, raw?.customer?.lastName].filter(Boolean).join(' ') ||
    '';

  const itemsArray = Array.isArray(raw?.items) ? raw.items : [];
  const detailArray = Array.isArray(raw?.itemDetails) ? raw.itemDetails : [];
  const itemsCount =
    itemsArray.length ||
    (typeof raw?.items === 'number' ? raw.items : 0) ||
    detailArray.length ||
    0;

  const itemDetails = (itemsArray.length > 0 ? itemsArray : detailArray)
    .slice(0, 5)
    .map((item: any) => ({
      productName: item?.productName || item?.name || 'Unknown Item',
      quantity: item?.quantity || 1,
    }));

  return {
    id: String(orderId),
    tokenNumber: String(tokenNumber),
    orderNumber: orderNumber ? String(orderNumber) : undefined,
    status,
    type: raw?.type || 'PICKUP',
    items: itemsCount,
    customerName: customerName || undefined,
    itemDetails,
  };
};

const STATUS_CONFIG = {
	  READY: {
	    label: 'Ready for Pickup',
	    color: 'bg-green-500',
	    textColor: 'text-green-500',
	    icon: CheckCircle,
  },
  COMPLETED: {
    label: 'Served',
    color: 'bg-gray-500',
    textColor: 'text-gray-500',
    icon: Package,
  },
};

const getItemGraphic = (productName: string) => {
  const name = (productName || '').toLowerCase();
  if (name.includes('pizza')) return '🍕';
  if (name.includes('pasta') || name.includes('spaghetti') || name.includes('lasagna')) return '🍝';
  if (name.includes('burger') || name.includes('sandwich') || name.includes('sub')) return '🍔';
  if (name.includes('salad')) return '🥗';
  if (name.includes('fries')) return '🍟';
  if (name.includes('chicken') || name.includes('wing')) return '🍗';
  if (name.includes('drink') || name.includes('soda') || name.includes('coke') || name.includes('pepsi')) return '🥤';
  if (name.includes('coffee')) return '☕';
  if (name.includes('cake') || name.includes('cookie') || name.includes('dessert')) return '🍰';
  return '🍽️';
};

function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [storeId, setStoreId] = useState('default-store');
  const [storeOptions, setStoreOptions] = useState<Array<{ id: string; name: string; code?: string }>>([]);
  const [showDeliveryOrders, setShowDeliveryOrders] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [isManualReconnecting, setIsManualReconnecting] = useState(false);
  const [socketEpoch, setSocketEpoch] = useState(0);
  const [lastFetchError, setLastFetchError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load display settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('osdu-show-delivery-orders');
      if (saved !== null) {
        setShowDeliveryOrders(JSON.parse(saved));
      }
      const settings = localStorage.getItem('osdu-display-settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        if (parsed.showDeliveryOrders !== undefined) {
          setShowDeliveryOrders(parsed.showDeliveryOrders);
        }
      }
    } catch {
      setShowDeliveryOrders(false);
    }
  }, []);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/ready-sound.mp3');
  }, []);

  // Fetch existing orders from API on mount
  const fetchShowDeliverySetting = async (targetStoreId: string) => {
    if (!targetStoreId) return;
    try {
      const response = await fetch(`${API_URL}/api/v1/stores/${targetStoreId}`);
      if (!response.ok) return;
      const store = await response.json();
      const raw = store?.operatingHours;
      let parsed: any = raw;
      if (typeof raw === 'string') {
        parsed = JSON.parse(raw);
      }
      if (typeof parsed?.osduShowDeliveryOrders === 'boolean') {
        setShowDeliveryOrders(parsed.osduShowDeliveryOrders);
        localStorage.setItem('osdu-show-delivery-orders', JSON.stringify(parsed.osduShowDeliveryOrders));
      }
    } catch {
      // Keep local setting fallback
    }
  };

  const persistShowDeliverySetting = async (targetStoreId: string, enabled: boolean) => {
    if (!targetStoreId) return;
    try {
      const getResponse = await fetch(`${API_URL}/api/v1/stores/${targetStoreId}`);
      if (!getResponse.ok) return;
      const store = await getResponse.json();
      let operatingHours: any = {};
      try {
        operatingHours =
          typeof store?.operatingHours === 'string'
            ? JSON.parse(store.operatingHours || '{}')
            : (store?.operatingHours || {});
      } catch {
        operatingHours = {};
      }
      operatingHours.osduShowDeliveryOrders = enabled;
      await fetch(`${API_URL}/api/v1/stores/${targetStoreId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatingHours }),
      });
    } catch {
      // Non-blocking; local behavior still works
    }
  };

  const fetchOrders = async () => {
    try {
	      const response = await fetch(`${API_URL}/api/v1/orders?storeId=${storeId}&status=READY,PACKED,READY_FOR_PICKUP,READY_TO_SERVE`);
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        const detail = text ? text.slice(0, 140) : `${response.status} ${response.statusText}`;
        console.error('[OSDU] GET /orders failed:', response.status, detail);
        setLastFetchError(`Cannot reach orders API (${response.status}). Display may be stale.`);
        return;
      }
      const data = await response.json();
      const mappedOrders = (Array.isArray(data) ? data : [])
        .map((order: any) => normalizeOrder(order))
        .filter((o: Order | null): o is Order => !!o);
      setOrders(mappedOrders);
      setLastFetchError(null);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setLastFetchError(
        error instanceof Error
          ? `Network error contacting orders API: ${error.message}`
          : 'Network error contacting orders API.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    await fetchOrders();
    setIsManualSyncing(false);
  };

  const handleManualReconnect = () => {
    setIsManualReconnecting(true);
    setConnectionStatus('reconnecting');
    setSocketEpoch((prev) => prev + 1);
  };

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/v1/orders/public/default-store`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_URL}/api/v1/orders/public/stores`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([defaultStore, stores]) => {
        if (Array.isArray(stores)) setStoreOptions(stores);
        if (defaultStore?.storeId) {
          setStoreId(defaultStore.storeId);
          fetchShowDeliverySetting(defaultStore.storeId);
        }
      })
      .catch(() => {})
      .finally(() => {
        fetchOrders();
      });
  }, []);

  // Re-fetch when store changes
  useEffect(() => {
    if (storeId) {
      fetchShowDeliverySetting(storeId);
      fetchOrders();
    }
  }, [storeId]);

  // Connect to WebSocket
  useEffect(() => {
    const newSocket = io(`${API_URL}/ws`, { 
      transports: ['websocket'],
      auth: { token: 'osdu-token' }
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('OSDU connected');
      setConnectionStatus('connected');
      setIsManualReconnecting(false);
      newSocket.emit('osdu:subscribe', storeId);
    });
    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });
    newSocket.on('connect_error', () => {
      setConnectionStatus('disconnected');
      setIsManualReconnecting(false);
    });

	    newSocket.on('order:update', (updatedOrders: any[]) => {
	      const next = (Array.isArray(updatedOrders) ? updatedOrders : [])
	        .map((order) => normalizeOrder(order))
	        .filter((o): o is Order => !!o);
	      setOrders(next);
    });

    const handleReadyOrder = (order: any) => {
      if (soundEnabled && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      setOrders((prev) => {
        const normalized = normalizeOrder({ ...order, status: 'READY' });
        if (!normalized) return prev;
        const orderId = normalized.id;
        const exists = prev.find((o) => o.id === orderId);
        if (exists) {
          return prev.map((o) => (o.id === orderId ? { ...o, ...normalized, status: 'READY' } : o));
        }
        return [...prev, normalized];
      });
    };
    newSocket.on('order:ready', handleReadyOrder);
    newSocket.on('osdu:order:ready', handleReadyOrder);
    newSocket.on('osdu:order-ready', handleReadyOrder);

    // Handle order completion - remove from display
    const handleOrderCompleted = (data: any) => {
      const orderId = data?.orderId || data?.id;
      if (orderId) {
        // Only remove if status is actually completed/delivered
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      }
      // Force sync to avoid stale cards when completion transitions happen quickly.
      fetchOrders();
    };
    newSocket.on('order:completed', handleOrderCompleted);
    newSocket.on('order:cancelled', handleOrderCompleted);
    newSocket.on('order:delivered', handleOrderCompleted);
    // Also listen for the ORDER_COMPLETED event from websocket gateway
    newSocket.on('ORDER_COMPLETED', handleOrderCompleted);
    newSocket.on('ORDER_CANCELLED', handleOrderCompleted);

    const handleOrderStatusChanged = (data: any) => {
      if (!data?.orderId) return;
      if (['COMPLETED', 'CANCELLED', 'DELIVERED'].includes(data.status)) {
        setOrders((prev) => prev.filter((o) => o.id !== data.orderId));
        fetchOrders();
        return;
      }
	      if (['READY', 'READY_FOR_PICKUP', 'READY_TO_SERVE', 'PACKED', 'PREPARED'].includes(data.status)) {
	        const items = data.data?.items || [];
	        handleReadyOrder({
          id: data.orderId,
          tokenNumber: data.data?.tokenNumber || data.data?.orderNumber,
          orderNumber: data.data?.orderNumber,
          type: data.data?.type || 'PICKUP',
          customerName: data.data?.customerName,
          items: items.length,
          itemDetails: items.slice(0, 5).map((item: any) => ({
            productName: item.productName || 'Unknown Item',
            quantity: item.quantity || 1,
          })),
        });
	      } else if (['PREPARING', 'IN_PROGRESS', 'IN_OVEN', 'IN_KITCHEN', 'BAKING', 'PENDING', 'PAID', 'CONFIRMED'].includes(data.status)) {
	        setOrders((prev) => prev.filter((o) => o.id !== data.orderId));
	      }
    };
    newSocket.on('order:status:changed', handleOrderStatusChanged);
    newSocket.on('order:status-changed', handleOrderStatusChanged);

    return () => {
      newSocket.close();
    };
  }, [soundEnabled, storeId, socketEpoch]);

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter orders based on display settings
  const filteredOrders = showDeliveryOrders 
    ? orders 
    : orders.filter((o) => o.type !== 'DELIVERY');

	  const readyOrders = filteredOrders.filter((o) => o.status === 'READY');

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur border-b border-gray-700 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
	            <div className="bg-green-500 p-3 rounded-xl shadow-lg shadow-green-500/20">
	              <CheckCircle size={40} className="text-white" />
	            </div>
	            <div>
	              <h1 className="text-4xl font-bold text-white">Ready for Pickup</h1>
	              <p className="text-gray-400 text-lg">Orders shown here are ready at the counter</p>
	            </div>
          </div>
          <div className="flex items-center gap-6">
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white"
            >
              {storeOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code || s.id.slice(0, 8)})
                </option>
              ))}
              {storeOptions.length === 0 ? <option value={storeId}>{storeId}</option> : null}
            </select>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              title={soundEnabled ? 'Mute ready chime' : 'Un-mute ready chime'}
              aria-pressed={soundEnabled}
            >
              {soundEnabled ? (
                <Volume2 size={24} className="text-green-400" />
              ) : (
                <VolumeX size={24} className="text-red-400" />
              )}
            </button>
            <button
              onClick={handleManualSync}
              className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              title="Sync now"
            >
              <RefreshCw
                size={24}
                className={`${isManualSyncing ? 'animate-spin' : ''} text-gray-200`}
              />
            </button>
            <button
              onClick={handleManualReconnect}
              className="px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-white text-sm"
              title="Reconnect socket"
            >
              {isManualReconnecting ? 'Reconnecting...' : 'Reconnect'}
            </button>
            <button
              onClick={() => {
                const newValue = !showDeliveryOrders;
                setShowDeliveryOrders(newValue);
                localStorage.setItem('osdu-show-delivery-orders', JSON.stringify(newValue));
                persistShowDeliverySetting(storeId, newValue);
              }}
              className={`p-3 rounded-lg transition-colors flex items-center gap-2 ${
                showDeliveryOrders 
                  ? 'bg-orange-600 hover:bg-orange-700' 
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
              title="Toggle delivery orders display"
            >
              <Truck size={24} className={showDeliveryOrders ? 'text-white' : 'text-gray-500'} />
              {showDeliveryOrders && (
                <span className="text-white text-sm font-medium">Deliveries ON</span>
              )}
            </button>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
              connectionStatus === 'connected'
                ? 'bg-green-900/20 border-green-500/30'
                : connectionStatus === 'reconnecting'
                ? 'bg-yellow-900/20 border-yellow-500/30'
                : 'bg-red-900/20 border-red-500/30'
            }`}>
              <div className="relative flex h-2 w-2">
                {connectionStatus === 'connected' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                )}
                <div className={`relative inline-flex rounded-full h-2 w-2 ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'reconnecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
              </div>
              <span className={`text-xs font-bold leading-none ${
                connectionStatus === 'connected' 
                  ? 'text-green-400'
                  : connectionStatus === 'reconnecting'
                  ? 'text-yellow-400'
                  : 'text-red-400'
              }`}>
                {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Offline'}
              </span>
            </div>
            <div className="text-right">
              <div className="text-4xl font-mono font-bold text-white">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-gray-400">
                {currentTime.toLocaleDateString([], {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Fetch error banner — visible from across the lobby */}
      {lastFetchError && (
        <div
          role="status"
          className="bg-red-600/90 text-white px-6 py-3 flex items-center justify-center gap-3 text-lg font-medium animate-pulse"
        >
          <AlertTriangle size={22} />
          <span>{lastFetchError}</span>
          <button
            onClick={handleManualSync}
            className="ml-4 underline underline-offset-2 hover:no-underline"
          >
            Retry now
          </button>
        </div>
      )}

      {/* Main Content */}
	      <div className="flex-1 overflow-hidden p-8">
	        {isLoading ? (
	          <div className="flex h-full items-center justify-center text-gray-400">
	            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mr-4"></div>
	            Loading orders...
	          </div>
	        ) : (
	          <div className="flex h-full flex-col rounded-3xl border border-gray-700 bg-gray-800/50 p-6 shadow-2xl shadow-black/20">
	            <div className="mb-6 flex items-center gap-4">
	              <div className="rounded-2xl bg-green-500 p-3 shadow-lg shadow-green-500/20">
	                <CheckCircle size={36} className="text-white" />
	              </div>
	              <div>
	                <h2 className="text-4xl font-black text-white">
	                  {showDeliveryOrders ? 'Ready Orders' : 'Ready for Pickup'}
	                </h2>
	                <p className="text-lg font-medium text-green-300">
	                  {showDeliveryOrders ? 'Counter pickup and driver pickup orders' : 'Please collect your order from the counter'}
	                </p>
	              </div>
	              <div className="ml-auto rounded-2xl border border-green-400/30 bg-green-500/15 px-6 py-3 text-3xl font-black text-green-300">
	                {readyOrders.length}
	              </div>
	            </div>

	            <div className="min-h-0 flex-1 overflow-y-auto pr-2">
	              {readyOrders.length > 0 ? (
	                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
	                  {readyOrders.map((order) => (
	                    <OrderCard key={order.id} order={order} isReady />
	                  ))}
	                </div>
	              ) : (
	                <div className="flex h-full min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-gray-700 bg-gray-900/35 text-center text-gray-500">
	                  <div>
	                    <Package size={76} className="mx-auto mb-5 opacity-30" />
	                    <p className="text-3xl font-black text-gray-300">No orders ready right now</p>
	                    <p className="mt-2 text-lg text-gray-500">Ready pickup orders will appear here automatically.</p>
	                  </div>
	                </div>
	              )}
	            </div>
	          </div>
	        )}
	      </div>

      {/* Footer */}
      <footer className="bg-black/50 backdrop-blur border-t border-gray-700 px-8 py-4">
	        <div className="flex items-center justify-center gap-8 text-gray-400">
	          <div className="flex items-center gap-2">
	            <div className="w-3 h-3 bg-green-500 rounded-full" />
	            <span>Only ready orders are displayed</span>
	          </div>
          {showDeliveryOrders && (
            <div className="flex items-center gap-2 text-orange-400">
              <Truck size={16} />
              <span>Delivery orders visible</span>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  isReady?: boolean;
}

function OrderCard({ order, isReady }: OrderCardProps) {
  const statusConfig = STATUS_CONFIG[order.status];
  const StatusIcon = statusConfig.icon;
  const displayOrderNumber = order.orderNumber || order.tokenNumber || order.id?.slice(-6) || 'N/A';
  const displayCustomerName = order.customerName || 'Guest';

  return (
    <div
      className="osdu-card ready w-full rounded-3xl border-2 border-green-500/70 bg-gradient-to-br from-green-500/20 via-gray-800 to-gray-900 p-6 shadow-xl shadow-green-950/30"
    >
      <div className="flex h-full flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className={`break-words text-5xl font-black leading-none ${statusConfig.textColor}`}>
	            #{displayOrderNumber}
            </div>

            <div className="mt-3 break-words text-2xl font-bold text-gray-100">
              {displayCustomerName}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-bold text-gray-300">
              <span className="rounded-full border border-green-400/30 bg-green-500/15 px-3 py-1 text-green-200">
                {order.type === 'DINE_IN' ? 'Dine-In' :
                 order.type === 'PICKUP' ? 'Pickup' :
                 order.type === 'DELIVERY' ? 'Delivery' : order.type}
              </span>
              <span className="flex items-center gap-2 rounded-full border border-gray-600 bg-gray-950/40 px-3 py-1">
                <Package size={16} />
                {order.items} item{order.items !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className={`inline-flex shrink-0 items-center gap-2 rounded-2xl ${statusConfig.color} px-5 py-3 shadow-lg shadow-green-500/20`}>
            <StatusIcon size={24} className="text-white" />
            <span className="whitespace-nowrap text-lg font-black text-white">Ready</span>
          </div>
        </div>

        {isReady && order.itemDetails && order.itemDetails.length > 0 && (
          <div className="grid gap-2 rounded-2xl border border-white/10 bg-gray-950/35 p-3">
            {order.itemDetails.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex min-w-0 items-center gap-3 rounded-xl bg-white/5 px-3 py-2 text-gray-200">
                <span className="text-xl">{getItemGraphic(item.productName)}</span>
                <span className="shrink-0 text-base font-black text-green-300">{item.quantity}x</span>
                <span className="min-w-0 truncate text-base font-bold">{item.productName}</span>
              </div>
            ))}
            {order.itemDetails.length > 4 && (
              <div className="px-3 text-sm font-bold text-gray-400">
                +{order.itemDetails.length - 4} more item{order.itemDetails.length - 4 === 1 ? '' : 's'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

