import React, { useCallback, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock3,
  DollarSign,
  Eye,
  MapPinned,
  RefreshCw,
  RotateCcw,
  Route,
  TestTube2,
  Truck,
  X,
} from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import DriverDispatch from './DriverDispatch';
import DispatchMap from './components/DispatchMap';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const DEFAULT_STORE_CENTER: [number, number] = [39.17572, -76.82957];
const DEFAULT_STORE_ADDRESS = '7060 Oakland Mills Rd, Columbia, MD 21046';
const LATE_DELIVERY_THRESHOLD_MINUTES = 45;

interface DriverSummary {
  id: string;
  name: string;
  status: string;
  perDeliveryRate: number;
}

interface DeliveryOrderSummary {
  id: string;
  orderNumber?: string;
  customerName?: string;
  type: string;
  status: string;
  createdAt: string;
  deliveredAt?: string | null;
  total: number;
  tipAmount: number;
  deliveryFee: number;
  driverId?: string | null;
  deliveryAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    lat?: number;
    lng?: number;
  } | null;
}

interface DriverAnalytics {
  id: string;
  name: string;
  status: string;
  activeDeliveries: number;
  completedDeliveries: number;
  lateDeliveries: number;
  tips: number;
  deliveryFees: number;
  estimatedEarnings: number;
}

interface AnalyticsState {
  totalDeliveryOrders: number;
  activeDeliveries: number;
  completedDeliveries: number;
  lateDeliveries: number;
  avgDeliveryMinutes: number;
  totalTips: number;
  totalDeliveryFees: number;
  estimatedDriverPayout: number;
  drivers: DriverAnalytics[];
}

interface RouteSuggestion {
  driverId: string;
  driverName: string;
  queuePosition: number;
  suggestedStops: Array<{
    orderId: string;
    orderNumber: string;
    customerName: string;
    address: string;
    status: string;
    direction: string;
    sequence: number;
    distanceKm: number;
    reason: string;
  }>;
}

const initialAnalytics: AnalyticsState = {
  totalDeliveryOrders: 0,
  activeDeliveries: 0,
  completedDeliveries: 0,
  lateDeliveries: 0,
  avgDeliveryMinutes: 0,
  totalTips: 0,
  totalDeliveryFees: 0,
  estimatedDriverPayout: 0,
  drivers: [],
};

const DIRECTION_LABELS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
const DELIVERY_ROUTING_STATUSES = new Set([
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'BAKING',
  'PACKING',
  'READY',
  'READY_FOR_PICKUP',
  'READY_FOR_DISPATCH',
  'OUT_FOR_DELIVERY',
]);

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const bearingSector = (originLat: number, originLng: number, lat: number, lng: number) => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const toDeg = (v: number) => (v * 180) / Math.PI;
  const dLon = toRad(lng - originLng);
  const y = Math.sin(dLon) * Math.cos(toRad(lat));
  const x =
    Math.cos(toRad(originLat)) * Math.sin(toRad(lat)) -
    Math.sin(toRad(originLat)) * Math.cos(toRad(lat)) * Math.cos(dLon);
  const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return DIRECTION_LABELS[Math.floor((bearing + 22.5) / 45) % 8];
};

const parseAddress = (value: unknown): DeliveryOrderSummary['deliveryAddress'] => {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && parsed ? (parsed as DeliveryOrderSummary['deliveryAddress']) : null;
    } catch {
      return null;
    }
  }
  return typeof value === 'object' ? (value as DeliveryOrderSummary['deliveryAddress']) : null;
};

const formatOrderAddress = (raw: unknown) => {
  const parsed = parseAddress(raw);
  if (parsed) {
    const line = [parsed.street, parsed.city, parsed.state, parsed.zipCode].filter(Boolean).join(', ');
    if (line) return line;
  }
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  return '—';
};

const asNumber = (value: unknown, fallback = 0) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const firstNonEmpty = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

const DeliveryManagement: React.FC = () => {
  const { currentStore } = useStore();
  const [activeTab, setActiveTab] = useState<'dispatch' | 'region' | 'analytics' | 'routing'>('dispatch');
  const [loadingSeed, setLoadingSeed] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsState>(initialAnalytics);
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrderSummary[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [orderDetailError, setOrderDetailError] = useState<string | null>(null);
  const [orderDetailData, setOrderDetailData] = useState<Record<string, unknown> | null>(null);

  const activeStoreId = useMemo(() => {
    if (currentStore?.id) return currentStore.id;
    for (const key of ['interface-sync-store-id', 'pos-store-id', 'kds-store-id', 'packing-store-id', 'online-store-id']) {
      const value = localStorage.getItem(key);
      if (value) return value;
    }
    return undefined;
  }, [currentStore?.id]);

  const storeCenter = DEFAULT_STORE_CENTER;

  const storeName = useMemo(() => {
    return firstNonEmpty((currentStore as any)?.name) || 'Store';
  }, [currentStore]);

  const storeAddress = DEFAULT_STORE_ADDRESS;

  const runRequest = useCallback(async (path: string, body: Record<string, unknown>, successText: string) => {
    const response = await fetch(`${API_URL}/api/v1/drivers/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || 'Request failed');
    }

    setMessage({ type: 'success', text: successText });
  }, []);

  const loadAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    setMessage(null);
    try {
      const storeQuery = activeStoreId ? `&storeId=${encodeURIComponent(activeStoreId)}` : '';
      const [ordersRes, driversRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/orders?includeFuture=false${storeQuery}`),
        fetch(`${API_URL}/api/v1/drivers${activeStoreId ? `?storeId=${encodeURIComponent(activeStoreId)}` : ''}`),
      ]);

      const ordersRaw = ordersRes.ok ? await ordersRes.json() : [];
      const driversRaw = driversRes.ok ? await driversRes.json() : [];

      const orders: DeliveryOrderSummary[] = (Array.isArray(ordersRaw) ? ordersRaw : [])
        .filter((o: any) => String(o?.type || '').toUpperCase() === 'DELIVERY')
        .map((o: any) => ({
          id: String(o?.id ?? ''),
          orderNumber: o?.orderNumber ? String(o.orderNumber) : undefined,
          customerName: o?.customerName ? String(o.customerName) : undefined,
          type: String(o?.type ?? ''),
          status: String(o?.status ?? '').toUpperCase(),
          createdAt: String(o?.createdAt ?? new Date().toISOString()),
          deliveredAt: o?.deliveredAt ? String(o.deliveredAt) : null,
          total: Number(o?.total ?? 0),
          tipAmount: Number(o?.tipAmount ?? 0),
          deliveryFee: Number(o?.deliveryFee ?? 0),
          driverId: o?.driverId ? String(o.driverId) : null,
          deliveryAddress: parseAddress(o?.deliveryAddress),
        }));

      const drivers: DriverSummary[] = (Array.isArray(driversRaw) ? driversRaw : []).map((d: any) => ({
        id: String(d?.id ?? ''),
        name: String(d?.name ?? 'Driver'),
        status: String(d?.status ?? 'OFFLINE'),
        perDeliveryRate: Number(d?.perDeliveryRate ?? 0),
      }));

      const completedStatuses = new Set(['DELIVERED', 'COMPLETED']);
      const activeStatuses = new Set(['OUT_FOR_DELIVERY']);

      const deliveryDurations = orders
        .filter((o) => completedStatuses.has(o.status) && o.deliveredAt)
        .map((o) => {
          const minutes = Math.max(
            0,
            Math.round((new Date(String(o.deliveredAt)).getTime() - new Date(o.createdAt).getTime()) / 60000),
          );
          return minutes;
        });

      const lateDeliveries = orders.filter((o) => {
        const done = completedStatuses.has(o.status);
        if (!done || !o.deliveredAt) return false;
        const elapsed = (new Date(String(o.deliveredAt)).getTime() - new Date(o.createdAt).getTime()) / 60000;
        return elapsed > LATE_DELIVERY_THRESHOLD_MINUTES;
      }).length;

      const driverMap = new Map<string, DriverAnalytics>();
      drivers.forEach((d) => {
        driverMap.set(d.id, {
          id: d.id,
          name: d.name,
          status: d.status,
          activeDeliveries: 0,
          completedDeliveries: 0,
          lateDeliveries: 0,
          tips: 0,
          deliveryFees: 0,
          estimatedEarnings: 0,
        });
      });

      orders.forEach((o) => {
        if (!o.driverId) return;
        if (!driverMap.has(o.driverId)) {
          driverMap.set(o.driverId, {
            id: o.driverId,
            name: `Driver ${o.driverId.slice(0, 6)}`,
            status: 'UNKNOWN',
            activeDeliveries: 0,
            completedDeliveries: 0,
            lateDeliveries: 0,
            tips: 0,
            deliveryFees: 0,
            estimatedEarnings: 0,
          });
        }

        const item = driverMap.get(o.driverId)!;
        if (activeStatuses.has(o.status)) item.activeDeliveries += 1;

        if (completedStatuses.has(o.status)) {
          item.completedDeliveries += 1;
          item.tips += o.tipAmount;
          item.deliveryFees += o.deliveryFee;

          if (o.deliveredAt) {
            const elapsed = (new Date(String(o.deliveredAt)).getTime() - new Date(o.createdAt).getTime()) / 60000;
            if (elapsed > LATE_DELIVERY_THRESHOLD_MINUTES) item.lateDeliveries += 1;
          }
        }
      });

      const driverWithRates = Array.from(driverMap.values()).map((d) => {
        const rate = drivers.find((x) => x.id === d.id)?.perDeliveryRate ?? 0;
        const estimatedEarnings = d.completedDeliveries * rate + d.tips;
        return { ...d, estimatedEarnings };
      });

      const nextState: AnalyticsState = {
        totalDeliveryOrders: orders.length,
        activeDeliveries: orders.filter((o) => activeStatuses.has(o.status)).length,
        completedDeliveries: orders.filter((o) => completedStatuses.has(o.status)).length,
        lateDeliveries,
        avgDeliveryMinutes:
          deliveryDurations.length > 0
            ? Math.round(deliveryDurations.reduce((sum, m) => sum + m, 0) / deliveryDurations.length)
            : 0,
        totalTips: orders.reduce((sum, o) => sum + o.tipAmount, 0),
        totalDeliveryFees: orders.reduce((sum, o) => sum + o.deliveryFee, 0),
        estimatedDriverPayout: driverWithRates.reduce((sum, d) => sum + d.estimatedEarnings, 0),
        drivers: driverWithRates.sort((a, b) => b.completedDeliveries - a.completedDeliveries),
      };

      setAnalytics(nextState);
      setDeliveryOrders(
        [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      );
      setSelectedDriverId((prev) => {
        if (nextState.drivers.length === 0) return null;
        if (prev && nextState.drivers.some((d) => d.id === prev)) return prev;
        return nextState.drivers[0].id;
      });
      setMessage({ type: 'success', text: 'Delivery analytics refreshed.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Unable to load analytics' });
    } finally {
      setLoadingAnalytics(false);
    }
  }, [activeStoreId]);

  const handleSeed = useCallback(async () => {
    setLoadingSeed(true);
    setMessage(null);
    try {
      await runRequest(
        'seed-test-data',
        { storeId: activeStoreId },
        'Delivery test dataset created. Dispatch board is ready for end-to-end testing.',
      );
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Unable to seed delivery test data' });
    } finally {
      setLoadingSeed(false);
    }
  }, [activeStoreId, runRequest]);

  const selectedDriver = useMemo(
    () => analytics.drivers.find((d) => d.id === selectedDriverId) ?? null,
    [analytics.drivers, selectedDriverId],
  );
  const selectedDriverOrders = useMemo(
    () => (selectedDriverId ? deliveryOrders.filter((o) => o.driverId === selectedDriverId) : []),
    [deliveryOrders, selectedDriverId],
  );

  const routingSuggestions = useMemo<RouteSuggestion[]>(() => {
    const queue = [...analytics.drivers]
      .sort((a, b) => {
        const rank = (status: string) => {
          if (status === 'ONLINE') return 0;
          if (status === 'BUSY') return 1;
          if (status === 'ON_BREAK') return 2;
          return 3;
        };
        return rank(a.status) - rank(b.status) || a.activeDeliveries - b.activeDeliveries || a.name.localeCompare(b.name);
      })
      .map((d, idx) => ({
        driverId: d.id,
        driverName: d.name,
        queuePosition: idx + 1,
        suggestedStops: [] as RouteSuggestion['suggestedStops'],
      }));

    if (queue.length === 0) return [];

    const candidates = deliveryOrders.filter((o) => DELIVERY_ROUTING_STATUSES.has(o.status));
    const assigned = candidates.filter((o) => o.driverId && queue.some((q) => q.driverId === o.driverId));
    const unassigned = candidates.filter((o) => !o.driverId);

    const driverPrimaryDirection = new Map<string, string>();
    const queueByDriver = new Map(queue.map((q) => [q.driverId, q]));
    const storeLat = storeCenter[0];
    const storeLng = storeCenter[1];

    const mapOrder = (o: DeliveryOrderSummary, sequence: number, reason: string, forcedDriverId?: string) => {
      const lat = o.deliveryAddress?.lat;
      const lng = o.deliveryAddress?.lng;
      const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
      const direction = hasCoords
        ? bearingSector(storeLat, storeLng, Number(lat), Number(lng))
        : 'NA';
      const distanceKm = hasCoords
        ? haversineKm(storeLat, storeLng, Number(lat), Number(lng))
        : 0;

      if (forcedDriverId && hasCoords) {
        const current = driverPrimaryDirection.get(forcedDriverId);
        if (!current) driverPrimaryDirection.set(forcedDriverId, direction);
      }

      return {
        orderId: o.id,
        orderNumber: o.orderNumber || o.id.slice(0, 8),
        customerName: o.customerName || 'Guest',
        address:
          [o.deliveryAddress?.street, o.deliveryAddress?.city].filter(Boolean).join(', ') || 'Address pending',
        status: o.status,
        direction,
        sequence,
        distanceKm: Number(distanceKm.toFixed(2)),
        reason,
      };
    };

    for (const order of assigned) {
      const driverId = order.driverId as string;
      const entry = queueByDriver.get(driverId);
      if (!entry) continue;
      entry.suggestedStops.push(
        mapOrder(order, entry.suggestedStops.length + 1, 'Already assigned; kept with current driver.', driverId),
      );
    }

    let roundRobinIndex = 0;
    const orderedUnassigned = [...unassigned].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    for (const order of orderedUnassigned) {
      const lat = order.deliveryAddress?.lat;
      const lng = order.deliveryAddress?.lng;
      const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
      const direction = hasCoords
        ? bearingSector(storeLat, storeLng, Number(lat), Number(lng))
        : 'NA';

      let selected = queue[roundRobinIndex % queue.length];
      if (hasCoords) {
        const sameDirection = queue.find((q) => driverPrimaryDirection.get(q.driverId) === direction);
        if (sameDirection) selected = sameDirection;
      }

      selected.suggestedStops.push(
        mapOrder(
          order,
          selected.suggestedStops.length + 1,
          hasCoords
            ? `Queue-first assignment, grouped to ${direction} direction.`
            : 'Queue-first assignment; coordinates unavailable for direction grouping.',
          selected.driverId,
        ),
      );

      if (hasCoords && !driverPrimaryDirection.has(selected.driverId)) {
        driverPrimaryDirection.set(selected.driverId, direction);
      }
      roundRobinIndex += 1;
    }

    for (const q of queue) {
      q.suggestedStops.sort((a, b) => {
        const dirA = a.direction === 'NA' ? 'ZZ' : a.direction;
        const dirB = b.direction === 'NA' ? 'ZZ' : b.direction;
        return dirA.localeCompare(dirB) || a.distanceKm - b.distanceKm || a.sequence - b.sequence;
      });
      q.suggestedStops = q.suggestedStops.map((stop, idx) => ({ ...stop, sequence: idx + 1 }));
    }

    return queue;
  }, [analytics.drivers, deliveryOrders, storeCenter]);

  const handleReset = useCallback(async () => {
    setLoadingReset(true);
    setMessage(null);
    try {
      await runRequest('reset-active', { storeId: activeStoreId }, 'Active delivery assignments reset to READY.');
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Unable to reset active deliveries' });
    } finally {
      setLoadingReset(false);
    }
  }, [activeStoreId, runRequest]);

  const closeOrderDetail = useCallback(() => {
    setOrderDetailOpen(false);
    setOrderDetailData(null);
    setOrderDetailError(null);
    setOrderDetailLoading(false);
  }, []);

  const openOrderDetail = useCallback(async (orderId: string) => {
    setOrderDetailOpen(true);
    setOrderDetailLoading(true);
    setOrderDetailError(null);
    setOrderDetailData(null);
    try {
      const response = await fetch(`${API_URL}/api/v1/orders/${encodeURIComponent(orderId)}`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Failed to load order (${response.status})`);
      }
      const data = (await response.json()) as Record<string, unknown>;
      setOrderDetailData(data);
    } catch (error: any) {
      setOrderDetailError(error?.message || 'Unable to load order details');
    } finally {
      setOrderDetailLoading(false);
    }
  }, []);

  return (
    <div className="p-5 space-y-5">
      <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Route className="text-blue-400" size={22} />
              Delivery Operations
            </h1>
            <p className="text-slate-300 mt-1">
              Dispatch + region + analytics in one operational panel. Default region: Columbia, Maryland 21046.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSeed}
              disabled={loadingSeed || loadingReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <TestTube2 size={16} />
              {loadingSeed ? 'Seeding...' : 'Seed Delivery Test Data'}
            </button>
            <button
              onClick={handleReset}
              disabled={loadingSeed || loadingReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-400/40 text-amber-200 hover:bg-amber-500/10 disabled:opacity-50"
            >
              <RotateCcw size={16} className={loadingReset ? 'animate-spin' : ''} />
              {loadingReset ? 'Resetting...' : 'Reset Active Deliveries'}
            </button>
            <button
              onClick={loadAnalytics}
              disabled={loadingAnalytics}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-sky-400/40 text-sky-200 hover:bg-sky-500/10 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loadingAnalytics ? 'animate-spin' : ''} />
              {loadingAnalytics ? 'Loading...' : 'Refresh Analytics'}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'dispatch' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-300 border border-slate-700'}`}
          >
            <Truck size={14} className="inline mr-2" />
            Live Dispatch Map
          </button>
          <button
            onClick={() => setActiveTab('region')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'region' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-300 border border-slate-700'}`}
          >
            <MapPinned size={14} className="inline mr-2" />
            Delivery Area Region
          </button>
          <button
            onClick={() => {
              setActiveTab('analytics');
              if (analytics.totalDeliveryOrders === 0 && !loadingAnalytics) {
                void loadAnalytics();
              }
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-300 border border-slate-700'}`}
          >
            <BarChart3 size={14} className="inline mr-2" />
            Delivery & Driver Analytics
          </button>
          <button
            onClick={() => {
              setActiveTab('routing');
              if (analytics.totalDeliveryOrders === 0 && !loadingAnalytics) {
                void loadAnalytics();
              }
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'routing' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-300 border border-slate-700'}`}
          >
            <Route size={14} className="inline mr-2" />
            Route Suggestion Queue
          </button>
        </div>

        {message && (
          <div
            className={`mt-4 rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-900/30 border border-emerald-500/30 text-emerald-200'
                : 'bg-red-900/30 border border-red-500/30 text-red-200'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}
      </section>

      {activeTab === 'dispatch' && (
        <section className="rounded-2xl overflow-hidden">
          <DriverDispatch embedded />
        </section>
      )}

      {activeTab === 'region' && (
        <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="text-slate-200 text-sm">
            <p><strong>{storeName}:</strong> {storeAddress}</p>
            <p>Center coordinates: {storeCenter[0].toFixed(4)}, {storeCenter[1].toFixed(4)}</p>
          </div>
          <div className="rounded-2xl overflow-hidden border border-slate-800">
            <DispatchMap
              storeCenter={storeCenter}
              storeName={storeName}
              storeAddress={storeAddress}
              storeId={activeStoreId}
              orders={[]}
              drivers={[]}
              selectedOrderId={null}
              selectedDriverId={null}
              loading={false}
            />
          </div>
        </section>
      )}

      {activeTab === 'analytics' && (
        <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-slate-400 text-sm">Total Delivery Orders</p>
              <p className="text-white text-2xl font-bold">{analytics.totalDeliveryOrders}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-slate-400 text-sm">Active / Completed</p>
              <p className="text-white text-2xl font-bold">{analytics.activeDeliveries} / {analytics.completedDeliveries}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-slate-400 text-sm">Late Deliveries</p>
              <p className="text-white text-2xl font-bold">{analytics.lateDeliveries}</p>
              <p className="text-xs text-slate-400 mt-1">Threshold: {LATE_DELIVERY_THRESHOLD_MINUTES} min</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-slate-400 text-sm">Average Delivery Time</p>
              <p className="text-white text-2xl font-bold">{analytics.avgDeliveryMinutes} min</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-slate-400 text-sm">Total Tips</p>
              <p className="text-emerald-300 text-2xl font-bold flex items-center gap-1"><DollarSign size={18} />{analytics.totalTips.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-slate-400 text-sm">Delivery Charges</p>
              <p className="text-sky-300 text-2xl font-bold flex items-center gap-1"><DollarSign size={18} />{analytics.totalDeliveryFees.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-slate-400 text-sm">Estimated Driver Payout</p>
              <p className="text-amber-300 text-2xl font-bold flex items-center gap-1"><DollarSign size={18} />{analytics.estimatedDriverPayout.toFixed(2)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/90 text-slate-300">
                <tr>
                  <th className="px-3 py-2 text-left">Driver</th>
                  <th className="px-3 py-2 text-center">Status</th>
                  <th className="px-3 py-2 text-center">Active</th>
                  <th className="px-3 py-2 text-center">Completed</th>
                  <th className="px-3 py-2 text-center">Late</th>
                  <th className="px-3 py-2 text-right">Tips</th>
                  <th className="px-3 py-2 text-right">Delivery Fees</th>
                  <th className="px-3 py-2 text-right">Est. Earnings</th>
                </tr>
              </thead>
              <tbody className="bg-slate-950/60 text-slate-200">
                {analytics.drivers.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-center text-slate-400" colSpan={8}>
                      {loadingAnalytics ? 'Loading driver analytics...' : 'No driver analytics available yet.'}
                    </td>
                  </tr>
                ) : (
                  analytics.drivers.map((d) => (
                    <tr
                      key={d.id}
                      className={`border-t border-slate-800 cursor-pointer hover:bg-slate-900/60 ${
                        selectedDriverId === d.id ? 'bg-slate-900/80' : ''
                      }`}
                      onClick={() => setSelectedDriverId(d.id)}
                    >
                      <td className="px-3 py-2 font-medium">
                        {d.name}
                        {selectedDriverId === d.id && (
                          <span className="ml-2 text-xs text-blue-300">(Selected)</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">{d.status}</td>
                      <td className="px-3 py-2 text-center">{d.activeDeliveries}</td>
                      <td className="px-3 py-2 text-center">{d.completedDeliveries}</td>
                      <td className="px-3 py-2 text-center">{d.lateDeliveries}</td>
                      <td className="px-3 py-2 text-right">${d.tips.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">${d.deliveryFees.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-semibold">${d.estimatedEarnings.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 xl:col-span-1">
              <p className="text-slate-300 text-sm mb-2">Driver Summary Report</p>
              <div className="mb-3">
                <label className="block text-xs text-slate-400 mb-1">Select Driver</label>
                <select
                  value={selectedDriverId ?? ''}
                  onChange={(e) => setSelectedDriverId(e.target.value || null)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                >
                  {analytics.drivers.length === 0 ? (
                    <option value="">No drivers available</option>
                  ) : (
                    analytics.drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.status})
                      </option>
                    ))
                  )}
                </select>
              </div>
              {!selectedDriver ? (
                <p className="text-slate-400 text-sm">Select a driver to view summary details.</p>
              ) : (
                <div className="space-y-2 text-sm text-slate-200">
                  <p><span className="text-slate-400">Driver:</span> {selectedDriver.name}</p>
                  <p><span className="text-slate-400">Status:</span> {selectedDriver.status}</p>
                  <p><span className="text-slate-400">Active Deliveries:</span> {selectedDriver.activeDeliveries}</p>
                  <p><span className="text-slate-400">Completed Deliveries:</span> {selectedDriver.completedDeliveries}</p>
                  <p><span className="text-slate-400">Late Deliveries:</span> {selectedDriver.lateDeliveries}</p>
                  <p><span className="text-slate-400">Tips:</span> ${selectedDriver.tips.toFixed(2)}</p>
                  <p><span className="text-slate-400">Delivery Fees:</span> ${selectedDriver.deliveryFees.toFixed(2)}</p>
                  <p><span className="text-slate-400">Est. Earnings:</span> ${selectedDriver.estimatedEarnings.toFixed(2)}</p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-800 overflow-hidden xl:col-span-2">
              <div className="px-3 py-2 bg-slate-900/90 text-slate-300 text-sm">Delivery Orders List</div>
              <table className="min-w-full text-sm">
                <thead className="bg-slate-900/60 text-slate-300">
                  <tr>
                    <th className="px-3 py-2 text-left">Order</th>
                    <th className="px-3 py-2 text-left">Customer</th>
                    <th className="px-3 py-2 text-left">Delivery Address</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2 text-right">Tip</th>
                    <th className="px-3 py-2 text-left">Created</th>
                    <th className="px-3 py-2 text-center w-14">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-950/60 text-slate-200">
                  {selectedDriverOrders.length === 0 ? (
                    <tr>
                      <td className="px-3 py-4 text-center text-slate-400" colSpan={8}>
                        {selectedDriver ? 'No orders assigned to selected driver.' : 'Select a driver to load delivery orders.'}
                      </td>
                    </tr>
                  ) : (
                    selectedDriverOrders.map((o) => (
                      <tr key={o.id} className="border-t border-slate-800">
                        <td className="px-3 py-2 font-medium">#{o.orderNumber || o.id.slice(0, 8)}</td>
                        <td className="px-3 py-2">{o.customerName || 'Guest'}</td>
                        <td className="px-3 py-2">
                          {[o.deliveryAddress?.street, o.deliveryAddress?.city, o.deliveryAddress?.state, o.deliveryAddress?.zipCode]
                            .filter(Boolean)
                            .join(', ') || 'Address pending'}
                        </td>
                        <td className="px-3 py-2 text-center">{o.status}</td>
                        <td className="px-3 py-2 text-right">${o.total.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">${o.tipAmount.toFixed(2)}</td>
                        <td className="px-3 py-2">{new Date(o.createdAt).toLocaleString()}</td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            title="View full order"
                            onClick={() => void openOrderDetail(o.id)}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-600 bg-slate-800/80 p-1.5 text-sky-300 hover:bg-slate-700 hover:text-white"
                          >
                            <Eye size={16} aria-hidden />
                            <span className="sr-only">View full order</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Clock3 size={13} />
            Late-delivery logic: delivered/completed orders with lifecycle over {LATE_DELIVERY_THRESHOLD_MINUTES} minutes.
          </p>
        </section>
      )}

      {activeTab === 'routing' && (
        <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-slate-200 text-sm">
              Algorithm: queue-priority first, then cluster by same direction from Columbia hub. Driver higher in queue gets first stop; additional stops in similar direction are grouped to reduce zig-zag routing.
            </p>
          </div>

          {routingSuggestions.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-slate-400 text-sm">
              No drivers available for route suggestions. Refresh analytics after loading drivers/orders.
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {routingSuggestions.map((plan) => (
                <div key={plan.driverId} className="rounded-xl border border-slate-800 overflow-hidden">
                  <div className="px-3 py-2 bg-slate-900/90 text-slate-200 text-sm flex items-center justify-between">
                    <span>{plan.queuePosition}. {plan.driverName}</span>
                    <span className="text-slate-400">{plan.suggestedStops.length} suggested stops</span>
                  </div>
                  <div className="max-h-[420px] overflow-y-auto bg-slate-950/60 p-4">
                    {plan.suggestedStops.length === 0 ? (
                      <div className="py-4 text-center text-slate-400 text-sm">
                        No route suggestions for this driver yet.
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        {plan.suggestedStops.map((s, idx) => (
                          <div key={`${plan.driverId}-${s.orderId}`} className="flex flex-col items-center w-full">
                            <div className="w-full max-w-[320px] rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-blue-300">Stop {s.sequence}</span>
                                <span className="text-xs text-slate-400">{s.direction} • {s.distanceKm.toFixed(2)} km</span>
                              </div>
                              <div className="mt-1 text-sm font-medium text-slate-100">#{s.orderNumber} - {s.customerName}</div>
                              <div className="text-xs text-slate-300 truncate">{s.address}</div>
                              <div className="text-[11px] text-slate-400 mt-1">{s.reason}</div>
                            </div>
                            {idx < plan.suggestedStops.length - 1 && (
                              <div className="h-8 w-0 border-l-2 border-blue-700/80" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {orderDetailOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeOrderDetail();
          }}
          role="presentation"
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/80">
              <h2 id="order-detail-title" className="text-lg font-semibold text-white">
                Order details
              </h2>
              <button
                type="button"
                onClick={closeOrderDetail}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 text-sm text-slate-200 space-y-4">
              {orderDetailLoading && (
                <p className="text-slate-400 text-center py-8">Loading order…</p>
              )}
              {orderDetailError && !orderDetailLoading && (
                <p className="text-red-300 text-center py-4">{orderDetailError}</p>
              )}
              {orderDetailData && !orderDetailLoading && (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-2xl font-bold text-white">
                        #{String(orderDetailData.orderNumber ?? orderDetailData.id ?? '').slice(0, 32)}
                      </p>
                      <p className="text-slate-400 mt-1">
                        {String(orderDetailData.type ?? '')} · {String(orderDetailData.status ?? '')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-300">${asNumber(orderDetailData.total).toFixed(2)}</p>
                      <p className="text-xs text-slate-500">Order total</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-1">
                      <p className="text-xs uppercase text-slate-500">Customer</p>
                      <p>{firstNonEmpty(orderDetailData.customerName) || '—'}</p>
                      <p className="text-slate-400">{firstNonEmpty(orderDetailData.customerPhone) || ''}</p>
                      <p className="text-slate-400">{firstNonEmpty(orderDetailData.customerEmail) || ''}</p>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-1">
                      <p className="text-xs uppercase text-slate-500">Delivery</p>
                      <p>{formatOrderAddress(orderDetailData.deliveryAddress)}</p>
                      {orderDetailData.driverId ? (
                        <p className="text-slate-400">
                          Driver:{' '}
                          {analytics.drivers.find((d) => d.id === String(orderDetailData.driverId))?.name ??
                            String(orderDetailData.driverId).slice(0, 8)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs">
                    <p><span className="text-slate-500">Created</span>{' '}{orderDetailData.createdAt ? new Date(String(orderDetailData.createdAt)).toLocaleString() : '—'}</p>
                    <p><span className="text-slate-500">Scheduled</span>{' '}{orderDetailData.scheduledFor ? new Date(String(orderDetailData.scheduledFor)).toLocaleString() : '—'}</p>
                    <p><span className="text-slate-500">Delivered</span>{' '}{orderDetailData.deliveredAt ? new Date(String(orderDetailData.deliveredAt)).toLocaleString() : '—'}</p>
                    <p><span className="text-slate-500">Completed</span>{' '}{orderDetailData.completedAt ? new Date(String(orderDetailData.completedAt)).toLocaleString() : '—'}</p>
                  </div>

                  {(firstNonEmpty(orderDetailData.customerNotes) || firstNonEmpty(orderDetailData.kitchenNotes)) && (
                    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                      {firstNonEmpty(orderDetailData.customerNotes) ? (
                        <p><span className="text-slate-500">Customer notes:</span> {String(orderDetailData.customerNotes)}</p>
                      ) : null}
                      {firstNonEmpty(orderDetailData.kitchenNotes) ? (
                        <p><span className="text-slate-500">Kitchen notes:</span> {String(orderDetailData.kitchenNotes)}</p>
                      ) : null}
                    </div>
                  )}

                  <div>
                    <p className="text-slate-300 font-medium mb-2">Line items</p>
                    <div className="space-y-2">
                      {Array.isArray(orderDetailData.items) && orderDetailData.items.length > 0 ? (
                        (orderDetailData.items as Record<string, unknown>[]).map((item) => (
                          <div
                            key={String(item.id ?? `${item.productId}-${item.productName}`)}
                            className="flex justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-slate-100">
                                {asNumber(item.quantity, 1)}× {String(item.productName ?? 'Item')}
                              </p>
                              {item.sizeName ? (
                                <p className="text-xs text-slate-500">{String(item.sizeName)}</p>
                              ) : null}
                              {item.notes ? <p className="text-xs text-amber-200/90 mt-1">Note: {String(item.notes)}</p> : null}
                              {Array.isArray(item.addons) && item.addons.length > 0 ? (
                                <ul className="text-xs text-slate-400 mt-1 list-disc list-inside">
                                  {(item.addons as Record<string, unknown>[]).map((a, idx) => (
                                    <li key={idx}>
                                      {firstNonEmpty(a.addonName, a.name, a.optionName, a.label) || JSON.stringify(a)}
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                            <div className="shrink-0 font-medium">${asNumber(item.totalPrice ?? item.unitPrice).toFixed(2)}</div>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500">No line items.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-1 text-sm">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal</span>
                      <span>${asNumber(orderDetailData.subtotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Tax</span>
                      <span>${asNumber(orderDetailData.taxAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Discount</span>
                      <span>${asNumber(orderDetailData.discountAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Delivery fee</span>
                      <span>${asNumber(orderDetailData.deliveryFee).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Tip</span>
                      <span>${asNumber(orderDetailData.tipAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-white font-semibold pt-2 border-t border-slate-800">
                      <span>Total</span>
                      <span>${asNumber(orderDetailData.total).toFixed(2)}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-slate-300 font-medium mb-2">Payments</p>
                    {Array.isArray(orderDetailData.payments) && orderDetailData.payments.length > 0 ? (
                      <div className="space-y-2">
                        {(orderDetailData.payments as Record<string, unknown>[]).map((p) => (
                          <div
                            key={String(p.id)}
                            className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2"
                          >
                            <span className="text-slate-300">{String(p.method ?? '').replace(/_/g, ' ')}</span>
                            <span className={p.status === 'COMPLETED' ? 'text-emerald-300' : 'text-slate-400'}>
                              {String(p.status ?? '')} · ${asNumber(p.amount).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500">No payments recorded.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryManagement;
