import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Bike, CheckSquare, Clock, Filter, MapPin, Package, RefreshCw, RotateCcw, Route, Search, Square, Truck, User } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import DispatchMap from './components/DispatchMap';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const CLOSED_STATUSES = new Set(['DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED']);
const ACTIVE_DELIVERY_STATUSES = new Set(['PENDING', 'CONFIRMED', 'PREPARING', 'BAKING', 'PACKING', 'READY', 'READY_FOR_PICKUP', 'READY_FOR_DISPATCH', 'OUT_FOR_DELIVERY']);
const ASSIGNABLE_STATUSES = new Set(['PENDING', 'CONFIRMED', 'PREPARING', 'BAKING', 'PACKING', 'READY', 'READY_FOR_PICKUP', 'READY_FOR_DISPATCH']);
const DEFAULT_STORE_CENTER: [number, number] = [39.17572, -76.82957]; // 7060 Oakland Mills Rd, Columbia, MD 21046
const DEFAULT_STORE_ADDRESS = '7060 Oakland Mills Rd, Columbia, MD 21046';

interface Driver {
  id: string;
  name: string;
  phone?: string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'ON_BREAK';
  vehicleType?: string;
  perDeliveryRate?: number;
  currentLocation?: { lat: number; lng: number };
  activeDeliveries?: number;
}

interface DeliveryOrder {
  id: string;
  orderNumber: string;
  tokenNumber?: string;
  customerName?: string;
  customerPhone?: string;
  total: number;
  deliveryFee: number;
  tipAmount?: number;
  estimatedDistance?: number;
  createdAt: string;
  status: string;
  driverId?: string | null;
  driverName?: string;
  deliveryAddress?: { street?: string; city?: string; lat?: number; lng?: number };
  items: Array<{ productName: string; quantity: number }>;
}

interface DriverDispatchProps {
  embedded?: boolean;
}

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

const parseAddress = (value: unknown): DeliveryOrder['deliveryAddress'] => {
  if (!value) return undefined;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  return typeof value === 'object' ? (value as DeliveryOrder['deliveryAddress']) : undefined;
};

const normalizeOrder = (order: any): DeliveryOrder => ({
  id: String(order?.id ?? ''),
  orderNumber: String(order?.orderNumber ?? ''),
  tokenNumber: order?.tokenNumber ? String(order.tokenNumber) : undefined,
  customerName: order?.customerName ? String(order.customerName) : 'Guest',
  customerPhone: order?.customerPhone ? String(order.customerPhone) : undefined,
  total: asNumber(order?.total, 0),
  deliveryFee: asNumber(order?.deliveryFee, 0),
  tipAmount: asNumber(order?.tipAmount, 0),
  estimatedDistance: asNumber(order?.estimatedDistance, 0),
  createdAt: order?.createdAt ? String(order.createdAt) : new Date().toISOString(),
  status: String(order?.status ?? 'READY').toUpperCase(),
  driverId: order?.driverId ? String(order.driverId) : null,
  driverName: order?.driver?.name ? String(order.driver.name) : undefined,
  deliveryAddress: parseAddress(order?.deliveryAddress),
  items: (Array.isArray(order?.items) ? order.items : []).map((it: any) => ({
    productName: String(it?.productName ?? it?.name ?? 'Item'),
    quantity: asNumber(it?.quantity, 1),
  })),
});

const DriverDispatch: React.FC<DriverDispatchProps> = ({ embedded = false }) => {
  const { currentStore } = useStore();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [allOrders, setAllOrders] = useState<DeliveryOrder[]>([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [selectedAssignedOrders, setSelectedAssignedOrders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'oldest' | 'newest' | 'distance'>('oldest');
  const [activeTab, setActiveTab] = useState<'dispatch' | 'flow'>('dispatch');
  const [focusedOrderId, setFocusedOrderId] = useState<string | null>(null);
  const [focusedDriverId, setFocusedDriverId] = useState<string | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [driversError, setDriversError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [unassigning, setUnassigning] = useState(false);
  const [resetting, setResetting] = useState(false);

  const getActiveStoreId = useCallback(() => {
    if (currentStore?.id) return currentStore.id;
    for (const key of ['interface-sync-store-id', 'pos-store-id', 'kds-store-id', 'packing-store-id', 'online-store-id']) {
      const value = localStorage.getItem(key);
      if (value) return value;
    }
    return undefined;
  }, [currentStore?.id]);

  const activeStoreId = getActiveStoreId();

  const storeCenter = DEFAULT_STORE_CENTER;

  const storeName = useMemo(() => {
    return firstNonEmpty((currentStore as any)?.name) || 'Store';
  }, [currentStore]);

  const storeAddress = DEFAULT_STORE_ADDRESS;

  const fetchDrivers = useCallback(async (storeId?: string) => {
    setLoadingDrivers(true);
    setDriversError(null);
    try {
      const scoped = storeId ? `${API_URL}/api/v1/drivers?storeId=${encodeURIComponent(storeId)}` : `${API_URL}/api/v1/drivers`;
      const res = await fetch(scoped);
      let data = res.ok ? await res.json() : [];
      if (storeId && Array.isArray(data) && data.length === 0) {
        const fallbackRes = await fetch(`${API_URL}/api/v1/drivers`);
        if (fallbackRes.ok) data = await fallbackRes.json();
      }
      const normalized: Driver[] = (Array.isArray(data) ? data : []).map((d: any) => ({
        id: String(d?.id ?? ''),
        name: String(d?.name ?? 'Driver'),
        phone: d?.phone ? String(d.phone) : '',
        status: String(d?.status ?? 'OFFLINE') as Driver['status'],
        vehicleType: d?.vehicleType ? String(d.vehicleType) : 'Car',
        perDeliveryRate: asNumber(d?.perDeliveryRate, 5),
        currentLocation: d?.currentLocation,
      }));
      setDrivers(normalized);
    } catch {
      setDriversError('Unable to load drivers');
      setDrivers([]);
    } finally {
      setLoadingDrivers(false);
    }
  }, []);

  const fetchOrders = useCallback(async (storeId?: string) => {
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const scoped = `${API_URL}/api/v1/orders?includeFuture=false${storeId ? `&storeId=${encodeURIComponent(storeId)}` : ''}`;
      let data: any[] = [];
      const scopedRes = await fetch(scoped);
      if (scopedRes.ok) data = await scopedRes.json();
      if (storeId && Array.isArray(data) && data.length === 0) {
        const fallbackRes = await fetch(`${API_URL}/api/v1/orders?includeFuture=false`);
        if (fallbackRes.ok) data = await fallbackRes.json();
      }
      const activeDeliveries = (Array.isArray(data) ? data : [])
        .filter((o: any) => {
          const type = String(o?.type || '').toUpperCase();
          const status = String(o?.status || '').toUpperCase();
          return type === 'DELIVERY' && ACTIVE_DELIVERY_STATUSES.has(status) && !CLOSED_STATUSES.has(status);
        })
        .map(normalizeOrder);
      setAllOrders(activeDeliveries);
    } catch {
      setOrdersError('Unable to load delivery orders');
      setAllOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    const storeId = getActiveStoreId();
    await Promise.all([fetchDrivers(storeId), fetchOrders(storeId)]);
  }, [fetchDrivers, fetchOrders, getActiveStoreId]);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 60000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const availableOrders = useMemo(
    () =>
      allOrders
        .filter((o) => !o.driverId && ASSIGNABLE_STATUSES.has(o.status))
        .filter((o) => {
          const q = searchQuery.toLowerCase().trim();
          if (!q) return true;
          return `${o.customerName} ${o.customerPhone} ${o.orderNumber} ${o.tokenNumber} ${o.deliveryAddress?.street}`.toLowerCase().includes(q);
        })
        .sort((a, b) => {
          if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          if (sortBy === 'distance') return (a.estimatedDistance || 0) - (b.estimatedDistance || 0);
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }),
    [allOrders, searchQuery, sortBy],
  );

  const assignedOrders = useMemo(() => allOrders.filter((o) => !!o.driverId), [allOrders]);
  const filteredAssignedOrders = useMemo(() => (selectedDriver ? assignedOrders.filter((o) => o.driverId === selectedDriver) : assignedOrders), [assignedOrders, selectedDriver]);
  const loading = loadingDrivers || loadingOrders;

  const toggleSelectAll = () => {
    if (selectedOrders.size === availableOrders.length) setSelectedOrders(new Set());
    else setSelectedOrders(new Set(availableOrders.map((o) => o.id)));
  };

  const toggleOrder = (id: string) => {
    const next = new Set(selectedOrders);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedOrders(next);
    setFocusedOrderId(id);
  };

  const toggleAssignedOrder = (id: string) => {
    const next = new Set(selectedAssignedOrders);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedAssignedOrders(next);
    setFocusedOrderId(id);
  };

  const assignOrders = async () => {
    if (!selectedDriver || selectedOrders.size === 0) return;
    setAssigning(true);
    try {
      await fetch(`${API_URL}/api/v1/drivers/${selectedDriver}/assign-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: Array.from(selectedOrders), storeId: getActiveStoreId() }),
      });
      setSelectedOrders(new Set());
      await fetchData();
    } finally {
      setAssigning(false);
    }
  };

  const unassignOrders = async () => {
    if (selectedAssignedOrders.size === 0) return;
    setUnassigning(true);
    try {
      await fetch(`${API_URL}/api/v1/drivers/unassign-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: Array.from(selectedAssignedOrders), storeId: getActiveStoreId() }),
      });
      setSelectedAssignedOrders(new Set());
      await fetchData();
    } finally {
      setUnassigning(false);
    }
  };

  useEffect(() => {
    const visibleAssigned = new Set(filteredAssignedOrders.map((o) => o.id));
    setSelectedAssignedOrders((prev) => new Set(Array.from(prev).filter((id) => visibleAssigned.has(id))));
  }, [filteredAssignedOrders]);

  const resetActive = async () => {
    setResetting(true);
    try {
      await fetch(`${API_URL}/api/v1/drivers/reset-active`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storeId: getActiveStoreId() }) });
      await fetchData();
    } finally {
      setResetting(false);
    }
  };

  const panel = embedded ? 'bg-slate-950/70 border border-slate-800 text-slate-100' : 'bg-white border border-slate-200 text-slate-900';
  const muted = embedded ? 'text-slate-300' : 'text-slate-600';

  return (
    <div className={embedded ? 'p-5' : 'min-h-screen bg-slate-50 p-6'}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold flex items-center gap-2 ${embedded ? 'text-white' : 'text-slate-900'}`}><Route className="text-blue-500" />Driver Dispatch</h1>
          <p className={muted}>Assign multiple delivery orders to drivers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className={`px-3 py-2 rounded-lg border ${embedded ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-700'}`}><RefreshCw className={`inline mr-2 ${loading ? 'animate-spin' : ''}`} size={14} />Refresh</button>
          <button onClick={resetActive} className={`px-3 py-2 rounded-lg border ${embedded ? 'border-amber-500/40 text-amber-200' : 'border-amber-300 text-amber-700'}`}><RotateCcw className={`inline mr-2 ${resetting ? 'animate-spin' : ''}`} size={14} />Reset Active</button>
        </div>
      </div>

      <div className="mb-4 inline-flex rounded-lg border border-slate-700/70 bg-slate-900/60 p-1">
        <button onClick={() => setActiveTab('dispatch')} className={`px-3 py-1.5 rounded-md text-sm ${activeTab === 'dispatch' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}>Dispatch Board</button>
        <button onClick={() => setActiveTab('flow')} className={`px-3 py-1.5 rounded-md text-sm ${activeTab === 'flow' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}>Flow & Instructions</button>
      </div>

      {activeTab === 'flow' ? (
        <div className={`${panel} rounded-2xl p-6 space-y-3`}>
          <h2 className="text-xl font-semibold">Delivery Flow Instructions</h2>
          <p className={muted}>1. Orders appear in Available Deliveries when type is DELIVERY, active status, and no driver assigned.</p>
          <p className={muted}>2. Select a driver from Drivers list, choose one or more deliveries, then click Assign.</p>
          <p className={muted}>3. Assigned deliveries move to Assigned Deliveries and are highlighted on the map.</p>
          <p className={muted}>4. Use Reset Active to move OUT_FOR_DELIVERY test orders back to READY for re-testing.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4">
            <section className={`col-span-12 lg:col-span-3 rounded-2xl ${panel}`}>
              <div className="p-4 border-b border-slate-800"><h3 className="font-semibold flex items-center gap-2"><Bike size={16} className="text-orange-400" />Drivers</h3></div>
              <div className="p-3 space-y-2 max-h-[430px] overflow-y-auto">
                {loadingDrivers ? <div className="h-28 rounded-lg bg-slate-800/70 animate-pulse" /> : driversError ? <p className="text-red-400">{driversError}</p> : drivers.map((d) => (
                  <button key={d.id} onClick={() => { setSelectedDriver(d.id); setFocusedDriverId(d.id); }} className={`w-full rounded-lg border p-3 text-left ${selectedDriver === d.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-900/60'}`}>
                    <div className="flex items-center justify-between"><p className="font-medium">{d.name}</p><span className="text-xs">{d.status}</span></div>
                    <p className={`text-xs mt-1 ${muted}`}>{d.phone || 'No phone'} - {d.vehicleType || 'Vehicle'}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className={`col-span-12 lg:col-span-5 rounded-2xl ${panel}`}>
              <div className="p-4 border-b border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2"><Package size={16} className="text-blue-400" />Available Deliveries ({availableOrders.length})</h3>
                  <button onClick={toggleSelectAll} className={`text-xs inline-flex items-center gap-1 ${embedded ? 'text-blue-300' : 'text-blue-600'}`}>{selectedOrders.size === availableOrders.length && availableOrders.length > 0 ? <><CheckSquare size={14} />Deselect All</> : <><Square size={14} />Select All</>}</button>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1"><Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search orders..." className={`w-full pl-7 pr-2 py-2 rounded-lg border text-sm ${embedded ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300'}`} /></div>
                  <div className="relative"><Filter size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" /><select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className={`pl-7 pr-7 py-2 rounded-lg border text-sm ${embedded ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300'}`}><option value="oldest">Oldest First</option><option value="newest">Newest First</option><option value="distance">Nearest First</option></select></div>
                </div>
              </div>
              <div className="p-3 space-y-2 max-h-[380px] overflow-y-auto">
                {loadingOrders ? <div className="h-28 rounded-lg bg-slate-800/70 animate-pulse" /> : ordersError ? <p className="text-red-400">{ordersError}</p> : availableOrders.length === 0 ? (
                  <div className={`rounded-lg border p-5 text-center ${embedded ? 'border-slate-700 bg-slate-900/60 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'}`}><AlertCircle className="mx-auto mb-2 h-6 w-6" /><p>No available deliveries</p></div>
                ) : availableOrders.map((o) => (
                  <div key={o.id} className={`rounded-lg border p-3 ${embedded ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'}`} onClick={() => setFocusedOrderId(o.id)}>
                    <div className="flex items-center justify-between"><button onClick={() => toggleOrder(o.id)} className="mr-2">{selectedOrders.has(o.id) ? <CheckSquare size={16} className="text-blue-400" /> : <Square size={16} className="text-slate-400" />}</button><p className="font-semibold flex-1">#{o.tokenNumber || o.orderNumber}</p><p className="font-semibold">${o.total.toFixed(2)}</p></div>
                    <p className={`text-xs mt-1 ${muted} flex items-center gap-1`}><Clock size={12} />{Math.max(1, Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000))}m ago</p>
                    <p className={`text-xs mt-1 ${muted} flex items-center gap-1`}><MapPin size={12} />{o.deliveryAddress?.street || 'Address pending'}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-800 p-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button disabled={!selectedDriver || selectedOrders.size === 0 || assigning} onClick={assignOrders} className="w-full py-2.5 rounded-lg bg-blue-600 text-white disabled:opacity-50"><Truck size={15} className="inline mr-2" />{assigning ? 'Assigning...' : 'Assign to Driver'}</button>
                  <button disabled={selectedAssignedOrders.size === 0 || unassigning} onClick={unassignOrders} className="w-full py-2.5 rounded-lg bg-amber-600 text-white disabled:opacity-50"><RotateCcw size={15} className="inline mr-2" />{unassigning ? 'Unassigning...' : 'Unassign Selected'}</button>
                </div>
              </div>
            </section>

            <section className={`col-span-12 lg:col-span-4 rounded-2xl ${panel}`}>
              <div className="p-4 border-b border-slate-800">
                <h3 className="font-semibold flex items-center gap-2"><User size={16} className="text-emerald-400" />Assigned Deliveries ({filteredAssignedOrders.length})</h3>
              </div>
              <div className="p-3 space-y-2 max-h-[508px] overflow-y-auto">
                {filteredAssignedOrders.length === 0 ? <p className={muted}>No assigned deliveries</p> : filteredAssignedOrders.map((o) => (
                  <div key={o.id} className={`rounded-lg border p-3 ${embedded ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'}`} onClick={() => setFocusedOrderId(o.id)}>
                    <div className="flex items-center justify-between">
                      <button onClick={(e) => { e.stopPropagation(); toggleAssignedOrder(o.id); }} className="mr-2">{selectedAssignedOrders.has(o.id) ? <CheckSquare size={16} className="text-amber-400" /> : <Square size={16} className="text-slate-400" />}</button>
                      <p className="font-semibold flex-1">#{o.tokenNumber || o.orderNumber}</p>
                      <p className="font-semibold">${o.total.toFixed(2)}</p>
                    </div>
                    <p className={`text-xs mt-1 ${muted}`}>{o.driverName || o.driverId || 'Assigned'}</p>
                    <p className={`text-xs mt-1 ${muted}`}>{o.status}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className={`${panel} rounded-2xl overflow-hidden`}>
            <DispatchMap
              storeCenter={storeCenter}
              storeName={storeName}
              storeAddress={storeAddress}
              storeId={activeStoreId}
              orders={[...availableOrders, ...assignedOrders]}
              drivers={drivers}
              selectedOrderId={focusedOrderId}
              selectedDriverId={focusedDriverId}
              onOrderClick={(id) => setFocusedOrderId(id)}
              onDriverClick={(id) => { setFocusedDriverId(id); setSelectedDriver(id); }}
              loading={loading}
            />
          </section>
        </div>
      )}
    </div>
  );
};

export default DriverDispatch;
