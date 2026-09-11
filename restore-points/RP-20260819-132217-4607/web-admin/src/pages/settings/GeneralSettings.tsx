import React, { useEffect, useState } from 'react';
import {
  Store,
  Clock,
  CreditCard,
  Printer,
  Bell,
  Shield,
  Save,
  CheckCircle,
  Globe,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  MonitorSmartphone,
  RefreshCw,
  Link2,
  ServerCog,
  Monitor,
  Truck,
  Settings,
  ShieldCheck,
  ChevronDown,
  CreditCard as PaymentIcon
} from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { api } from '../../services/api';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const INTERFACE_REGISTRY_KEY = 'interface-sync-registry:v1';
const INTERFACE_STORE_ID_KEY = 'interface-sync-store-id';
const PAYMENT_SETTINGS_KEY = 'pos-payment-settings:v1';

type InterfaceRecord = {
  key: string;
  label: string;
  url: string;
  machineId: string;
  machineName: string;
  syncedStoreId: string;
  lastSyncedAt?: string;
};

const INTERFACE_SEED: Array<Pick<InterfaceRecord, 'key' | 'label' | 'url'>> = [
  { key: 'pos', label: 'POS (Cashier)', url: 'http://localhost:3001/pos' },
  { key: 'customer_app', label: 'Customer App', url: 'http://localhost:3002' },
  { key: 'walkin_1', label: 'Walk-in Screen 1', url: 'http://localhost:3002/menu?channel=walkin&station=front-1' },
  { key: 'walkin_2', label: 'Walk-in Screen 2', url: 'http://localhost:3002/menu?channel=walkin&station=front-2' },
  { key: 'walkin_3', label: 'Walk-in Screen 3', url: 'http://localhost:3002/menu?channel=walkin&station=front-3' },
  { key: 'kds', label: 'Kitchen Display (KDS)', url: 'http://localhost:3003' },
  { key: 'packing', label: 'Packing Display', url: 'http://localhost:3004' },
  { key: 'customer_display', label: 'Customer Display', url: 'http://localhost:3005' },
  { key: 'driver', label: 'Driver App', url: 'http://localhost:3006' },
  { key: 'admin', label: 'Admin Dashboard', url: 'http://localhost:3001/settings/general' },
];

const SETTINGS_TABS = [
  { id: 'store', label: 'Store Info', description: 'Identity, address, map defaults', icon: Store },
  { id: 'hours', label: 'Operating Hours', description: 'Weekly schedule', icon: Clock },
  { id: 'payment', label: 'Payment', description: 'Tender types, tax, gateways', icon: CreditCard },
  { id: 'printers', label: 'Printers', description: 'Kitchen and receipt devices', icon: Printer },
  { id: 'notifications', label: 'Notifications', description: 'Alerts and events', icon: Bell },
  { id: 'security', label: 'Security', description: 'Password and sessions', icon: Shield },
  { id: 'display', label: 'Pickup Display', description: 'Ready-order customer screen', icon: Monitor },
  { id: 'interfaces', label: 'Interface Sync', description: 'Store IDs across apps', icon: MonitorSmartphone },
];

const parseShowDeliveryFromStore = (store: any): boolean | null => {
  try {
    const operatingHours = store?.operatingHours;
    if (!operatingHours) return null;
    if (typeof operatingHours === 'string') {
      const parsed = JSON.parse(operatingHours);
      if (typeof parsed?.osduShowDeliveryOrders === 'boolean') return parsed.osduShowDeliveryOrders;
      return null;
    }
    if (typeof operatingHours === 'object' && typeof operatingHours.osduShowDeliveryOrders === 'boolean') {
      return operatingHours.osduShowDeliveryOrders;
    }
  } catch {}
  return null;
};

const GeneralSettings: React.FC = () => {
  const { currentStore, setStore } = useStore();
  const [activeTab, setActiveTab] = useState('store');
  const [saved, setSaved] = useState(false);
  const [measurementUnit, setMeasurementUnit] = useState<'miles' | 'km'>('miles');
  const [mapsProvider, setMapsProvider] = useState<'GOOGLE' | 'OPENSTREETMAP'>('GOOGLE');
  const [canonicalStoreId, setCanonicalStoreId] = useState('');
  const [syncMessage, setSyncMessage] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState({
    acceptCash: true,
    acceptCard: true,
    acceptTap: true,
    taxName: 'Sales Tax',
    taxRate: '8.25',
    deliveryFee: '0.00',
    acceptOnlinePayment: true,
    // New gateway configs
    stripe: {
      publishableKey: '',
      secretKey: '',
      webhookSecret: '',
    },
    paypal: {
      clientId: '',
      secret: '',
      mode: 'sandbox', // 'sandbox' or 'live'
    },
    square: {
      applicationId: '',
      accessToken: '',
      locationId: '',
      useSandbox: true,
    }
  });
  const [activePaymentSubTab, setActivePaymentSubTab] = useState('general');
  const [previewSubtotal, setPreviewSubtotal] = useState('25.00');
  
  // Display settings
  const [displaySettings, setDisplaySettings] = useState(() => {
    try {
      const saved = localStorage.getItem('osdu-display-settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      showDeliveryOrders: false,
      showOrderType: true,
      showCustomerName: true,
      showItemPreview: true,
    };
  });
  const [interfaces, setInterfaces] = useState<InterfaceRecord[]>(() => {
    const host = window.location.hostname || 'localhost';
    const machineBase = `${host}-${navigator.platform || 'web'}`.toLowerCase().replace(/\s+/g, '-');
    const seeded = INTERFACE_SEED.map((entry, idx) => ({
      ...entry,
      machineId: `${entry.key}-${machineBase}-${idx + 1}`,
      machineName: `${entry.label} @ ${host}`,
      syncedStoreId: '',
    }));

    try {
      const raw = localStorage.getItem(INTERFACE_REGISTRY_KEY);
      if (!raw) return seeded;
      const parsed = JSON.parse(raw) as InterfaceRecord[];
      return seeded.map((s) => parsed.find((p) => p.key === s.key) || s);
    } catch {
      return seeded;
    }
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PAYMENT_SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setPaymentSettings((prev) => ({
          ...prev,
          ...parsed,
        }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!currentStore) return;
    
    // Load existing settings from currentStore
    const taxRate = (Number(currentStore.taxRate || 0) * 100).toFixed(2);
    const deliveryFee = Number(currentStore.deliveryFee || 0).toFixed(2);
    
    let dbPaymentConfigs: any = {};
    try {
      const settings = currentStore.settings;
      if (settings?.paymentConfigs) {
        dbPaymentConfigs = typeof settings.paymentConfigs === 'string' 
          ? JSON.parse(settings.paymentConfigs) 
          : settings.paymentConfigs;
      }
    } catch (e) {
      console.error('Failed to parse paymentConfigs from DB', e);
    }

    setPaymentSettings((prev) => ({
      ...prev,
      taxRate,
      deliveryFee,
      stripe: dbPaymentConfigs.stripe || prev.stripe,
      paypal: dbPaymentConfigs.paypal || prev.paypal,
      square: dbPaymentConfigs.square || prev.square,
      acceptCash: currentStore.settings?.acceptCash ?? prev.acceptCash,
      acceptCard: currentStore.settings?.acceptCard ?? prev.acceptCard,
      acceptOnlinePayment: currentStore.settings?.acceptOnlinePayment ?? prev.acceptOnlinePayment,
    }));

    const storeToggle = parseShowDeliveryFromStore(currentStore);
    if (storeToggle !== null) {
      setDisplaySettings((prev: any) => ({
        ...prev,
        showDeliveryOrders: storeToggle,
      }));
    }

    const mp = currentStore.settings?.mapsProvider;
    setMapsProvider(mp === 'OPENSTREETMAP' ? 'OPENSTREETMAP' : 'GOOGLE');
    try {
      const raw = currentStore?.operatingHours;
      const parsed = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
      if (parsed?.measurementUnit === 'km' || parsed?.measurementUnit === 'miles') {
        setMeasurementUnit(parsed.measurementUnit);
      }
    } catch {}
  }, [currentStore]);

  const parseMoney = (value: string, fallback = 0): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const previewSubtotalValue = parseMoney(previewSubtotal, 25);
  const previewTaxRate = parseMoney(paymentSettings.taxRate, 0) / 100;
  const previewDeliveryFee = parseMoney(paymentSettings.deliveryFee, 0);
  const previewTax = previewSubtotalValue * previewTaxRate;
  const previewTotal = previewSubtotalValue + previewTax + previewDeliveryFee;

  const handleSave = async () => {
    localStorage.setItem(INTERFACE_REGISTRY_KEY, JSON.stringify(interfaces));
    localStorage.setItem('osdu-display-settings', JSON.stringify(displaySettings));
    localStorage.setItem(PAYMENT_SETTINGS_KEY, JSON.stringify(paymentSettings));
    // Also save to a key that OSDU can read
    localStorage.setItem('osdu-show-delivery-orders', JSON.stringify(displaySettings.showDeliveryOrders));

    if (currentStore?.id) {
      try {
        const taxRate = parseMoney(paymentSettings.taxRate, 0) / 100;
        const deliveryFee = parseMoney(paymentSettings.deliveryFee, 0);
        let nextOperatingHours: any = {};
        try {
          const existing = currentStore?.operatingHours;
          nextOperatingHours =
            typeof existing === 'string'
              ? JSON.parse(existing || '{}')
              : (existing || {});
        } catch {
          nextOperatingHours = {};
        }
        nextOperatingHours.osduShowDeliveryOrders = displaySettings.showDeliveryOrders;
        nextOperatingHours.measurementUnit = measurementUnit;

        const { data: updatedStore } = await api.stores.update(currentStore.id, {
          taxRate,
          deliveryFee,
          operatingHours: nextOperatingHours,
          settings: {
            upsert: {
              create: {
                acceptCash: paymentSettings.acceptCash,
                acceptCard: paymentSettings.acceptCard,
                acceptOnlinePayment: paymentSettings.acceptOnlinePayment,
                mapsProvider,
                paymentConfigs: {
                  stripe: paymentSettings.stripe,
                  paypal: paymentSettings.paypal,
                  square: paymentSettings.square,
                },
              },
              update: {
                acceptCash: paymentSettings.acceptCash,
                acceptCard: paymentSettings.acceptCard,
                acceptOnlinePayment: paymentSettings.acceptOnlinePayment,
                mapsProvider,
                paymentConfigs: {
                  stripe: paymentSettings.stripe,
                  paypal: paymentSettings.paypal,
                  square: paymentSettings.square,
                },
              },
            },
          },
        });
        setStore(updatedStore);
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          'Could not save to server. Check that you are logged in and the API is running.';
        toast.error(typeof msg === 'string' ? msg : 'Save failed');
        return;
      }
    }

    setSaved(true);
    toast.success('Settings saved');
    setTimeout(() => setSaved(false), 3000);
  };

  const fetchCanonicalStoreId = async () => {
    const response = await fetch(`${API_URL}/api/v1/orders/public/default-store`);
    if (!response.ok) {
      throw new Error('Failed to fetch canonical store ID');
    }
    const data = await response.json();
    if (!data?.storeId) {
      throw new Error('No store ID returned from API');
    }
    setCanonicalStoreId(data.storeId);
    return data.storeId as string;
  };

  const applyGlobalStoreIdKeys = (storeId: string) => {
    const storeKeys = [
	      'kds-store-id',
	      'packing-store-id',
	      'osdu-store-id',
	      'online-store-id',
	      'driver-store-id',
      'pos-store-id',
      INTERFACE_STORE_ID_KEY,
    ];

    for (const key of storeKeys) {
      localStorage.setItem(key, storeId);
    }
  };

  const handlePullCanonical = async () => {
    try {
      const id = await fetchCanonicalStoreId();
      setSyncMessage(`Canonical Store ID loaded: ${id}`);
    } catch (error: any) {
      setSyncMessage(error?.message || 'Failed to pull canonical ID');
    }
  };

  const handleSyncAllInterfaceIds = async () => {
    setSyncing(true);
    try {
      const storeId = canonicalStoreId || (await fetchCanonicalStoreId());
      const now = new Date().toISOString();
      const next = interfaces.map((row) => ({
        ...row,
        syncedStoreId: storeId,
        lastSyncedAt: now,
      }));
      setInterfaces(next);
      localStorage.setItem(INTERFACE_REGISTRY_KEY, JSON.stringify(next));
      applyGlobalStoreIdKeys(storeId);
      setSyncMessage(`Synced all interface IDs to store ${storeId}`);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error: any) {
      setSyncMessage(error?.message || 'Interface sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const activeTabMeta = SETTINGS_TABS.find((tab) => tab.id === activeTab) || SETTINGS_TABS[0];
  const ActiveTabIcon = activeTabMeta.icon;

  return (
    <div className="relative min-h-full overflow-hidden bg-slate-50 text-foreground dark:bg-slate-950">
      {/* Decorative background (dark mode only — matches premium settings shell) */}
      <div className="pointer-events-none fixed inset-0 hidden dark:block">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0d_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0d_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative z-10 p-5 lg:p-6">
        {/* Header */}
        <div className="mb-5 overflow-hidden rounded-2xl border border-border bg-card shadow-sm dark:border-white/10 dark:bg-slate-900/80">
          <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                <Settings size={24} />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-black tracking-tight text-foreground">General Settings</h1>
                <p className="mt-1 max-w-3xl text-sm font-medium text-muted-foreground">
                  Configure store identity, payment behavior, customer pickup display, and interface sync from one place.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <div className="rounded-xl border border-border bg-muted/40 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                <div className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">Store</div>
                <div className="max-w-[180px] truncate text-sm font-bold text-foreground">{currentStore?.name || 'Current Store'}</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                <div className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">Pickup Display</div>
                <div className="text-sm font-bold text-green-500">Ready board</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid min-h-[calc(100vh-168px)] grid-cols-1 gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* Sidebar */}
          <div className="h-full">
            <div className="h-full overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-sm dark:border-white/10 dark:bg-slate-900/75 dark:backdrop-blur-sm">
              {SETTINGS_TABS.map((item) => {
                const ItemIcon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`mb-1 flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                      isActive
                        ? 'border border-orange-500/30 bg-orange-500/10 text-foreground shadow-sm dark:bg-orange-500/15'
                        : 'border border-transparent text-muted-foreground hover:border-border hover:bg-muted/70 hover:text-foreground dark:hover:border-white/10 dark:hover:bg-white/5'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        isActive ? 'bg-orange-500 text-white' : 'bg-muted text-muted-foreground dark:bg-white/10'
                      }`}
                    >
                      <ItemIcon size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-black">{item.label}</span>
                      <span className="mt-0.5 block text-xs font-medium leading-4 text-muted-foreground">{item.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="min-w-0">
            <div className="h-full overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/75 dark:backdrop-blur-sm lg:p-6">
            <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-muted/35 p-4 dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white/10">
                  <ActiveTabIcon size={21} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-black tracking-tight text-foreground">{activeTabMeta.label}</h2>
                  <p className="text-sm font-medium text-muted-foreground">{activeTabMeta.description}</p>
                </div>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-green-600 dark:text-green-400">
                <CheckCircle size={14} />
                Live Config
              </div>
            </div>
            {activeTab === 'store' && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-6">Store Information</h2>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Store Name</label>
                    <input 
                      type="text" 
                      defaultValue="Main Street Pizza"
                      className="w-full px-4 py-2 bg-muted/60 border border-border dark:bg-slate-900/50 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground placeholder:text-muted-foreground dark:placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Store Code</label>
                    <input 
                      type="text" 
                      defaultValue="MAIN001"
                      className="w-full px-4 py-2 bg-muted/60 border border-border dark:bg-slate-900/50 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground placeholder:text-muted-foreground dark:placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input 
                      type="text" 
                      defaultValue="7060 Oakland Mills Rd, Columbia, MD 21046"
                      className="w-full pl-10 pr-4 py-2 bg-muted/60 border border-border dark:bg-slate-900/50 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground placeholder:text-muted-foreground dark:placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <input 
                        type="text" 
                        defaultValue="(555) 123-4567"
                        className="w-full pl-10 pr-4 py-2 bg-muted/60 border border-border dark:bg-slate-900/50 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground placeholder:text-muted-foreground dark:placeholder-slate-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <input 
                        type="email" 
                        defaultValue="contact@mainstreetpizza.com"
                        className="w-full pl-10 pr-4 py-2 bg-muted/60 border border-border dark:bg-slate-900/50 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground placeholder:text-muted-foreground dark:placeholder-slate-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Timezone</label>
                    <div className="relative">
                      <select className="w-full appearance-none px-4 py-2.5 pr-10 bg-muted/60 border border-border dark:bg-slate-900/50 dark:border-white/10 rounded-xl text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-900 dark:[&>option]:text-white">
                        <option>America/New_York (EST)</option>
                        <option>America/Chicago (CST)</option>
                        <option>America/Denver (MST)</option>
                        <option>America/Los_Angeles (PST)</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Currency</label>
                    <div className="relative">
                      <select className="w-full appearance-none px-4 py-2.5 pr-10 bg-muted/60 border border-border dark:bg-slate-900/50 dark:border-white/10 rounded-xl text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-900 dark:[&>option]:text-white">
                        <option>USD ($)</option>
                        <option>CAD (C$)</option>
                        <option>EUR (€)</option>
                        <option>GBP (£)</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    </div>
                  </div>
                </div>

                <div className="mt-6 max-w-sm">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Unit of Measurement</label>
                  <div className="relative">
                    <select
                      value={measurementUnit}
                      onChange={(e) => setMeasurementUnit(e.target.value as 'miles' | 'km')}
                      className="w-full appearance-none px-4 py-2.5 pr-10 bg-muted/60 border border-border dark:bg-slate-900/50 dark:border-white/10 rounded-xl text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-900 dark:[&>option]:text-white"
                    >
                      <option value="miles">Miles</option>
                      <option value="km">Kilometers (km)</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  </div>
                </div>

                <div className="mt-8 p-4 border border-cyan-500/20 rounded-xl bg-cyan-950/20">
                  <div className="flex items-start gap-3 mb-3">
                    <Truck className="text-cyan-400 shrink-0 mt-0.5" size={22} />
                    <div>
                      <p className="font-medium text-foreground">Maps for delivery & dispatch</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Embedded map in Delivery Management / Dispatch and default navigation links in the Driver app.
                        Google requires <span className="text-cyan-300 font-mono text-[11px]">VITE_GOOGLE_MAPS_API_KEY</span> on web-admin.
                      </p>
                    </div>
                  </div>
                  <div className="relative max-w-md">
                    <select
                      value={mapsProvider}
                      onChange={(e) => setMapsProvider(e.target.value as 'GOOGLE' | 'OPENSTREETMAP')}
                      className="w-full appearance-none px-4 py-2.5 pr-10 bg-muted/60 border border-border dark:bg-slate-900/50 dark:border-white/10 rounded-xl text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-900 dark:[&>option]:text-white"
                    >
                      <option value="GOOGLE">Google Maps (API key — tiles, directions, markers)</option>
                      <option value="OPENSTREETMAP">OpenStreetMap + OSRM + Photon (no API keys)</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Scroll to the bottom of this page and click <strong className="text-foreground">Save Changes</strong> to write this to the server (drivers pick it up on next login).
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'hours' && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-6">Operating Hours</h2>
                
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <div key={day} className="flex items-center gap-4 mb-4">
                    <div className="w-32 font-medium text-muted-foreground">{day}</div>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded border-border dark:border-white/20 bg-background dark:bg-slate-900/50 text-purple-500" />
                      <span className="text-sm text-muted-foreground">Open</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="time" 
                        defaultValue="11:00"
                        className="px-3 py-1.5 bg-muted/60 border border-border dark:bg-slate-900/50 dark:border-white/10 rounded-lg text-sm text-foreground"
                      />
                      <span className="text-muted-foreground">to</span>
                      <input 
                        type="time" 
                        defaultValue="22:00"
                        className="px-3 py-1.5 bg-muted/60 border border-border dark:bg-slate-900/50 dark:border-white/10 rounded-lg text-sm text-foreground"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 mb-6 border-b border-border dark:border-white/5 pb-4 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'general', label: 'General & Charges', icon: Settings },
                    { id: 'stripe', label: 'Stripe', icon: PaymentIcon },
                    { id: 'paypal', label: 'PayPal', icon: PaymentIcon },
                    { id: 'square', label: 'Square', icon: PaymentIcon },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setActivePaymentSubTab(sub.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${
                        activePaymentSubTab === sub.id
                          ? 'bg-purple-500/20 text-purple-400 font-medium border border-purple-500/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 dark:hover:bg-white/5'
                      }`}
                    >
                      <sub.icon size={14} />
                      {sub.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {activePaymentSubTab === 'general' && (
                    <div className="space-y-6">
                      <div className="p-4 border border-border rounded-xl bg-muted/30 dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                              <DollarSign className="text-green-400" size={20} />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Cash Payments</p>
                              <p className="text-sm text-muted-foreground">Accept cash payments</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={paymentSettings.acceptCash}
                              onChange={(e) => setPaymentSettings((prev) => ({ ...prev, acceptCash: e.target.checked }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-muted dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                          </label>
                        </div>
                      </div>

                      <div className="p-4 border border-border rounded-xl bg-muted/30 dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                              <PaymentIcon className="text-blue-400" size={20} />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Credit/Debit Cards</p>
                              <p className="text-sm text-muted-foreground">Accept card payments</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={paymentSettings.acceptCard}
                              onChange={(e) => setPaymentSettings((prev) => ({ ...prev, acceptCard: e.target.checked }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-muted dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                          </label>
                        </div>
                      </div>

                      <div className="p-4 border border-border rounded-xl bg-muted/30 dark:border-white/10 dark:bg-white/5">
                        <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                          <div className="w-8 h-8 bg-purple-500/20 rounded flex items-center justify-center">
                            <Settings className="text-purple-400" size={16} />
                          </div>
                          Tax & Delivery Charges
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Tax Name</label>
                            <input 
                              type="text" 
                              value={paymentSettings.taxName}
                              onChange={(e) => setPaymentSettings(p => ({ ...p, taxName: e.target.value }))}
                              className="w-full px-4 py-2 bg-background border border-border dark:bg-slate-900 dark:border-white/10 rounded-lg text-foreground text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Tax Rate (%)</label>
                            <input 
                              type="text" 
                              value={paymentSettings.taxRate}
                              onChange={(e) => setPaymentSettings(p => ({ ...p, taxRate: e.target.value }))}
                              className="w-full px-4 py-2 bg-background border border-border dark:bg-slate-900 dark:border-white/10 rounded-lg text-foreground text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Delivery Fee ($)</label>
                            <input 
                              type="text" 
                              value={paymentSettings.deliveryFee}
                              onChange={(e) => setPaymentSettings(p => ({ ...p, deliveryFee: e.target.value }))}
                              className="w-full px-4 py-2 bg-background border border-border dark:bg-slate-900 dark:border-white/10 rounded-lg text-foreground text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border border-purple-500/30 rounded-xl bg-purple-500/10">
                        <h3 className="font-medium text-purple-300 mb-3">Live Delivery Total Preview</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-purple-300 mb-1">Sample Subtotal ($)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={previewSubtotal}
                              onChange={(e) => setPreviewSubtotal(e.target.value)}
                              className="w-full px-4 py-2 bg-muted/60 border border-border dark:bg-slate-900/50 dark:border-white/10 rounded-lg text-foreground placeholder:text-muted-foreground dark:placeholder-slate-500"
                            />
                          </div>
                          <div className="bg-muted/60 border border-border dark:bg-slate-900/50 dark:border-white/10 rounded-lg p-3 text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-muted-foreground">Subtotal</span>
                              <span className="font-medium text-foreground">${previewSubtotalValue.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-muted-foreground">{paymentSettings.taxName || 'Tax'} ({(previewTaxRate * 100).toFixed(2)}%)</span>
                              <span className="font-medium text-foreground">${previewTax.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-muted-foreground">Delivery Fee</span>
                              <span className="font-medium text-foreground">${previewDeliveryFee.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-border dark:border-white/10 pt-2 flex items-center justify-between">
                              <span className="font-semibold text-purple-300">Delivery Total</span>
                              <span className="font-bold text-purple-300 text-base">${previewTotal.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activePaymentSubTab === 'stripe' && (
                    <div className="space-y-6">
                      <div className="p-4 border border-border rounded-xl bg-muted/30 dark:border-white/10 dark:bg-white/5 space-y-6">
                        <div>
                          <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#635BFF]/20 rounded flex items-center justify-center">
                              <Link2 className="text-[#635BFF]" size={16} />
                            </div>
                            Stripe Configuration
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Publishable Key</label>
                              <input 
                                type="text" 
                                value={paymentSettings.stripe.publishableKey}
                                onChange={(e) => setPaymentSettings(p => ({ ...p, stripe: { ...p.stripe, publishableKey: e.target.value }}))}
                                placeholder="pk_test_..."
                                className="w-full px-4 py-2 bg-background border border-border dark:bg-slate-900 dark:border-white/10 rounded-lg text-foreground font-mono text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Secret Key</label>
                              <input 
                                type="password" 
                                value={paymentSettings.stripe.secretKey}
                                onChange={(e) => setPaymentSettings(p => ({ ...p, stripe: { ...p.stripe, secretKey: e.target.value }}))}
                                placeholder="sk_test_..."
                                className="w-full px-4 py-2 bg-background border border-border dark:bg-slate-900 dark:border-white/10 rounded-lg text-foreground font-mono text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Webhook Secret</label>
                              <input 
                                type="password" 
                                value={paymentSettings.stripe.webhookSecret}
                                onChange={(e) => setPaymentSettings(p => ({ ...p, stripe: { ...p.stripe, webhookSecret: e.target.value }}))}
                                placeholder="whsec_..."
                                className="w-full px-4 py-2 bg-background border border-border dark:bg-slate-900 dark:border-white/10 rounded-lg text-foreground font-mono text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activePaymentSubTab === 'paypal' && (
                    <div className="space-y-6">
                      <div className="p-4 border border-border rounded-xl bg-muted/30 dark:border-white/10 dark:bg-white/5 space-y-6">
                        <div>
                          <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#0070BA]/20 rounded flex items-center justify-center">
                              <Link2 className="text-[#0070BA]" size={16} />
                            </div>
                            PayPal Configuration
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Client ID</label>
                              <input 
                                type="text" 
                                value={paymentSettings.paypal.clientId}
                                onChange={(e) => setPaymentSettings(p => ({ ...p, paypal: { ...p.paypal, clientId: e.target.value }}))}
                                className="w-full px-4 py-2 bg-background border border-border dark:bg-slate-900 dark:border-white/10 rounded-lg text-foreground font-mono text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Secret</label>
                              <input 
                                type="password" 
                                value={paymentSettings.paypal.secret}
                                onChange={(e) => setPaymentSettings(p => ({ ...p, paypal: { ...p.paypal, secret: e.target.value }}))}
                                className="w-full px-4 py-2 bg-background border border-border dark:bg-slate-900 dark:border-white/10 rounded-lg text-foreground font-mono text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Mode</label>
                              <div className="relative">
                                <select 
                                  value={paymentSettings.paypal.mode}
                                  onChange={(e) => setPaymentSettings(p => ({ ...p, paypal: { ...p.paypal, mode: e.target.value }}))}
                                  className="w-full appearance-none px-4 py-2.5 pr-10 bg-background border border-border dark:bg-slate-900 dark:border-white/10 rounded-xl text-foreground text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-900 dark:[&>option]:text-white"
                                >
                                  <option value="sandbox">Sandbox (Testing)</option>
                                  <option value="live">Live (Production)</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activePaymentSubTab === 'square' && (
                    <div className="space-y-6">
                      <div className="p-4 border border-border rounded-xl bg-muted/30 dark:border-white/10 dark:bg-white/5 space-y-6">
                        <div>
                          <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#3E4348]/20 rounded flex items-center justify-center">
                              <Link2 className="text-foreground" size={16} />
                            </div>
                            Square Configuration
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Application ID</label>
                              <input 
                                type="text" 
                                value={paymentSettings.square.applicationId}
                                onChange={(e) => setPaymentSettings(p => ({ ...p, square: { ...p.square, applicationId: e.target.value }}))}
                                className="w-full px-4 py-2 bg-background border border-border dark:bg-slate-900 dark:border-white/10 rounded-lg text-foreground font-mono text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Location ID</label>
                              <input 
                                type="text" 
                                value={paymentSettings.square.locationId}
                                onChange={(e) => setPaymentSettings(p => ({ ...p, square: { ...p.square, locationId: e.target.value }}))}
                                className="w-full px-4 py-2 bg-background border border-border dark:bg-slate-900 dark:border-white/10 rounded-lg text-foreground font-mono text-sm"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Access Token</label>
                              <input 
                                type="password" 
                                value={paymentSettings.square.accessToken}
                                onChange={(e) => setPaymentSettings(p => ({ ...p, square: { ...p.square, accessToken: e.target.value }}))}
                                className="w-full px-4 py-2 bg-background border border-border dark:bg-slate-900 dark:border-white/10 rounded-lg text-foreground font-mono text-sm"
                              />
                            </div>
                            <div className="md:col-span-2 flex items-center gap-3">
                              <input
                                id="square-sandbox-mode"
                                type="checkbox"
                                checked={paymentSettings.square.useSandbox !== false}
                                onChange={(e) =>
                                  setPaymentSettings((p) => ({
                                    ...p,
                                    square: { ...p.square, useSandbox: e.target.checked },
                                  }))
                                }
                                className="rounded border-border dark:border-white/20 bg-background dark:bg-slate-900"
                              />
                              <label htmlFor="square-sandbox-mode" className="text-sm text-muted-foreground">
                                Sandbox / test credentials (targets connect.square<strong className="text-foreground">sandbox</strong>.com)
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'printers' && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-6">Printer Configuration</h2>
                
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg bg-muted/30 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-foreground">Kitchen Printer</p>
                        <p className="text-sm text-muted-foreground">192.168.1.100:9100</p>
                      </div>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                        Online
                      </span>
                    </div>
                  </div>

                  <div className="p-4 border border-border rounded-lg bg-muted/30 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-foreground">Receipt Printer</p>
                        <p className="text-sm text-muted-foreground">192.168.1.101:9100</p>
                      </div>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                        Online
                      </span>
                    </div>
                  </div>

                  <button className="w-full py-3 border-2 border-dashed border-border dark:border-white/20 rounded-lg text-muted-foreground hover:border-purple-400 hover:text-purple-400 transition-colors">
                    + Add Printer
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-6">Notification Preferences</h2>
                
                <div className="space-y-4">
                  {[
                    { label: 'New Orders', description: 'Get notified when a new order is placed' },
                    { label: 'Low Stock Alerts', description: 'Get notified when inventory is running low' },
                    { label: 'Staff Clock In/Out', description: 'Get notified of staff attendance' },
                    { label: 'Payment Failures', description: 'Get notified of failed payments' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30 dark:border-white/10 dark:bg-white/5">
                      <div>
                        <p className="font-medium text-foreground">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-muted dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-6">Security Settings</h2>
                
                <div className="space-y-6">
                  <div className="p-4 border border-border rounded-lg bg-muted/30 dark:border-white/10 dark:bg-white/5">
                    <h3 className="font-medium text-foreground mb-4">Password Policy</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded border-border dark:border-white/20 bg-background dark:bg-slate-900/50 text-purple-500" />
                        <span className="text-sm text-muted-foreground">Require minimum 8 characters</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded border-border dark:border-white/20 bg-background dark:bg-slate-900/50 text-purple-500" />
                        <span className="text-sm text-muted-foreground">Require uppercase and lowercase letters</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded border-border dark:border-white/20 bg-background dark:bg-slate-900/50 text-purple-500" />
                        <span className="text-sm text-muted-foreground">Require numbers</span>
                      </label>
                    </div>
                  </div>

                  <div className="p-4 border border-border rounded-lg bg-muted/30 dark:border-white/10 dark:bg-white/5">
                    <h3 className="font-medium text-foreground mb-4">Session Settings</h3>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Auto-logout after (minutes)</label>
                      <input 
                        type="number" 
                        defaultValue="30"
                        className="w-32 px-4 py-2 bg-muted/60 border border-border dark:bg-slate-900/50 dark:border-white/10 rounded-lg text-foreground"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'display' && (
              <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 dark:bg-green-500/10">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500 text-white">
                        <CheckCircle size={20} />
                      </div>
                      <div>
                        <h3 className="font-black text-foreground">Ready-for-Pickup Board</h3>
                        <p className="mt-1 text-sm font-medium leading-5 text-muted-foreground">
                          The customer screen should only show orders that are ready to pick up. Preparing orders stay on KDS and packing screens.
                        </p>
                        <a
                          href="http://localhost:3005"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex text-sm font-black text-green-600 hover:underline dark:text-green-400"
                        >
                          Open pickup display
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-background/70 p-2 dark:border-white/10 dark:bg-slate-950/40">
                    {[
                      {
                        title: 'Show Delivery Orders',
                        description: 'Include delivery orders only after they are ready for driver pickup.',
                        icon: Truck,
                        checked: displaySettings.showDeliveryOrders,
                        color: 'orange',
                        onChange: (checked: boolean) => setDisplaySettings({ ...displaySettings, showDeliveryOrders: checked }),
                      },
                      {
                        title: 'Show Order Type',
                        description: 'Display pickup, delivery, or dine-in context on each ready order card.',
                        icon: Monitor,
                        checked: displaySettings.showOrderType,
                        color: 'blue',
                        onChange: (checked: boolean) => setDisplaySettings({ ...displaySettings, showOrderType: checked }),
                      },
                      {
                        title: 'Show Customer Name',
                        description: 'Make it easier for guests to identify their ready order.',
                        icon: CheckCircle,
                        checked: displaySettings.showCustomerName,
                        color: 'green',
                        onChange: (checked: boolean) => setDisplaySettings({ ...displaySettings, showCustomerName: checked }),
                      },
                      {
                        title: 'Show Item Preview',
                        description: 'Show a compact item summary on ready order cards.',
                        icon: Bell,
                        checked: displaySettings.showItemPreview,
                        color: 'purple',
                        onChange: (checked: boolean) => setDisplaySettings({ ...displaySettings, showItemPreview: checked }),
                      },
                    ].map((item) => {
                      const ItemIcon = item.icon;
                      const accent =
                        item.color === 'orange'
                          ? 'bg-orange-500/15 text-orange-500 peer-checked:bg-orange-500'
                          : item.color === 'blue'
                            ? 'bg-blue-500/15 text-blue-500 peer-checked:bg-blue-500'
                            : item.color === 'green'
                              ? 'bg-green-500/15 text-green-500 peer-checked:bg-green-500'
                              : 'bg-purple-500/15 text-purple-500 peer-checked:bg-purple-500';
                      return (
                        <div key={item.title} className="flex items-center justify-between gap-4 rounded-xl p-3 transition-colors hover:bg-muted/50 dark:hover:bg-white/5">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent.split(' ').slice(0, 2).join(' ')}`}>
                              <ItemIcon size={19} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-foreground">{item.title}</p>
                              <p className="text-sm font-medium leading-5 text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={(e) => item.onChange(e.target.checked)}
                              className="peer sr-only"
                            />
                            <div className={`h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-700 ${accent}`} />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted/30 p-4 dark:border-white/10 dark:bg-slate-950/40">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-black text-foreground">Customer Screen Preview</h3>
                      <p className="text-sm font-medium text-muted-foreground">Ready orders only, designed for lobby visibility.</p>
                    </div>
                    <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-black uppercase tracking-wide text-white">Ready</span>
                  </div>
                  <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-white shadow-xl">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-black uppercase tracking-[0.22em] text-green-300">Ready for Pickup</div>
                        <div className="mt-1 text-2xl font-black">Downtown Location</div>
                      </div>
                      <Monitor size={24} className="text-slate-400" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-green-400/40 bg-green-500/15 p-4">
                        <div className="text-4xl font-black tracking-tight">A42</div>
                        {displaySettings.showCustomerName && <div className="mt-1 text-lg font-bold text-slate-100">John Doe</div>}
                        {displaySettings.showOrderType && (
                          <div className="mt-3 inline-flex rounded-full bg-slate-900/70 px-3 py-1 text-xs font-black uppercase tracking-wide text-green-300">
                            {displaySettings.showDeliveryOrders ? 'Delivery pickup' : 'Pickup'}
                          </div>
                        )}
                        {displaySettings.showItemPreview && (
                          <div className="mt-3 space-y-2 text-sm font-semibold text-slate-200">
                            <div className="rounded-lg bg-white/10 px-3 py-2">2x Pepperoni Pizza</div>
                            <div className="rounded-lg bg-white/10 px-3 py-2">1x Cola</div>
                          </div>
                        )}
                      </div>
                      <div className="rounded-xl border border-green-400/40 bg-green-500/15 p-4">
                        <div className="text-4xl font-black tracking-tight">B17</div>
                        {displaySettings.showCustomerName && <div className="mt-1 text-lg font-bold text-slate-100">Syed Abbas</div>}
                        {displaySettings.showOrderType && (
                          <div className="mt-3 inline-flex rounded-full bg-slate-900/70 px-3 py-1 text-xs font-black uppercase tracking-wide text-green-300">
                            Pickup
                          </div>
                        )}
                        {displaySettings.showItemPreview && (
                          <div className="mt-3 space-y-2 text-sm font-semibold text-slate-200">
                            <div className="rounded-lg bg-white/10 px-3 py-2">1x 6&quot; Sub Combo</div>
                            <div className="rounded-lg bg-white/10 px-3 py-2">1x Fries</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'interfaces' && (
              <div>
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground mb-1">Interface ID Synchronization</h2>
                    <p className="text-sm text-muted-foreground">
                      Manage machine IDs/names and sync a single store ID across POS, KDS, Assembly, Packing, Customer, and Driver interfaces.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handlePullCanonical}
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/70 dark:border-white/10 dark:hover:bg-white/5"
                    >
                      <RefreshCw size={16} />
                      Pull Canonical ID
                    </button>
                    <button
                      onClick={handleSyncAllInterfaceIds}
                      disabled={syncing}
                      className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      <Link2 size={16} />
                      {syncing ? 'Syncing...' : 'Sync IDs Now'}
                    </button>
                  </div>
                </div>

                <div className="mb-4 rounded-lg border border-purple-500/30 bg-purple-500/10 p-3">
                  <div className="flex items-center gap-2 text-sm text-purple-300">
                    <ServerCog size={16} />
                    <span className="font-medium">Canonical Store ID:</span>
                    <span className="font-mono">{canonicalStoreId || 'Not loaded yet'}</span>
                  </div>
                  {syncMessage ? <p className="mt-1 text-xs text-purple-400">{syncMessage}</p> : null}
                </div>

                <div className="overflow-hidden rounded-xl border border-border bg-muted/20 dark:border-white/10 dark:bg-white/5">
                  <table className="min-w-full divide-y divide-border dark:divide-white/10">
                    <thead className="bg-muted/40 dark:bg-white/5">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Interface</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Machine ID</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Machine Name</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Synced Store ID</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border dark:divide-white/10">
                      {interfaces.map((item) => {
                        const inSync = !!canonicalStoreId && item.syncedStoreId === canonicalStoreId;
                        return (
                          <tr key={item.key}>
                            <td className="px-3 py-2">
                              <div className="font-medium text-foreground">{item.label}</div>
                              <div className="text-xs text-muted-foreground">{item.url}</div>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                value={item.machineId}
                                onChange={(e) =>
                                  setInterfaces((prev) =>
                                    prev.map((row) =>
                                      row.key === item.key ? { ...row, machineId: e.target.value } : row
                                    )
                                  )
                                }
                                className="w-full rounded border border-border bg-muted/60 dark:border-white/10 dark:bg-slate-900/50 px-2 py-1 text-sm text-foreground"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                value={item.machineName}
                                onChange={(e) =>
                                  setInterfaces((prev) =>
                                    prev.map((row) =>
                                      row.key === item.key ? { ...row, machineName: e.target.value } : row
                                    )
                                  )
                                }
                                className="w-full rounded border border-border bg-muted/60 dark:border-white/10 dark:bg-slate-900/50 px-2 py-1 text-sm text-foreground"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <span className="font-mono text-xs text-muted-foreground">{item.syncedStoreId || '—'}</span>
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                  inSync ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                                }`}
                              >
                                {inSync ? 'Synced' : 'Out of sync'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="sticky bottom-0 -mx-5 mt-8 flex items-center justify-between border-t border-border bg-card/95 px-5 py-4 backdrop-blur dark:border-white/10 dark:bg-slate-900/95 lg:-mx-6 lg:px-6">
              {saved && (
                <div className="flex items-center gap-2 text-sm font-black text-green-500 dark:text-green-400">
                  <CheckCircle size={18} />
                  <span>Settings saved successfully</span>
                </div>
              )}
              <div className="ml-auto">
                <button 
                  onClick={handleSave}
                  className="flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-black text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-orange-600"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;

