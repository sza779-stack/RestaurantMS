import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Home, Briefcase, Plus, Search, X, User } from 'lucide-react';
import api from '../../../services/api';

interface Address {
  id: string;
  label: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

interface Customer {
  id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  loyaltyPoints?: number;
  referralCode?: string;
  addresses: Address[];
}

interface RecentOrder {
  id: string;
  customerPhone?: string;
  type?: string;
  createdAt?: string;
  deliveryAddress?: any;
}

interface OrderTypeModalProps {
  onConfirm: (
    type: any,
    table?: string,
    customer?: any,
    deliveryAddress?: any,
    schedule?: { isScheduled: boolean; scheduledFor?: string }
  ) => void;
  onCancel: () => void;
}

const OrderTypeModal: React.FC<OrderTypeModalProps> = ({
  onConfirm,
  onCancel,
}) => {
  const [type, setType] = useState<'DINE_IN' | 'PICKUP' | 'DELIVERY'>('DINE_IN');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [fulfillmentTiming, setFulfillmentTiming] = useState<'ASAP' | 'SCHEDULED'>('ASAP');
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [scheduledTime, setScheduledTime] = useState(() => {
    const dt = new Date();
    dt.setMinutes(dt.getMinutes() + 45);
    return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
  });
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const parseAddress = (raw: any): Address | null => {
    if (!raw) return null;
    let parsed = raw;
    if (typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw);
      } catch {
        return null;
      }
    }
    if (!parsed || typeof parsed !== 'object') return null;

    const address = String(parsed.address || parsed.street || parsed.line1 || '').trim();
    const city = String(parsed.city || '').trim();
    const state = String(parsed.state || '').trim();
    const zipCode = String(parsed.zipCode || parsed.postalCode || '').trim();
    const label = String(parsed.label || parsed.type || 'Recent').trim();

    if (!address && !city && !state && !zipCode) return null;

    return {
      id: `recent-${Date.now()}`,
      label: label || 'Recent',
      address: address || 'Address line unavailable',
      city,
      state,
      zipCode,
      isDefault: true,
    };
  };

  const lookupRecentDeliveryAddress = useCallback(async (phone: string) => {
    const storeId =
      localStorage.getItem('interface-sync-store-id') ||
      localStorage.getItem('pos-store-id') ||
      localStorage.getItem('kds-store-id') ||
      localStorage.getItem('packing-store-id') ||
      localStorage.getItem('online-store-id') ||
      '';
    const query = storeId
      ? `/orders?includeFuture=false&storeId=${encodeURIComponent(storeId)}`
      : '/orders?includeFuture=false';
    const { data } = await api.get(query);
    const normalizedPhone = phone.replace(/\D/g, '');
    const orders: RecentOrder[] = Array.isArray(data) ? data : [];
    const recent = orders
      .filter((o) => String(o?.type || '').toUpperCase() === 'DELIVERY')
      .filter((o) => (String(o?.customerPhone || '').replace(/\D/g, '').includes(normalizedPhone)))
      .sort((a, b) => new Date(String(b?.createdAt || 0)).getTime() - new Date(String(a?.createdAt || 0)).getTime())[0];

    const recentAddress = parseAddress(recent?.deliveryAddress);
    if (!recentAddress) return null;

    setSelectedAddress(recentAddress);
    setShowNewAddress(false);
    setNewAddress({
      label: recentAddress.label || 'Recent',
      address: recentAddress.address || '',
      city: recentAddress.city || '',
      state: recentAddress.state || '',
      zipCode: recentAddress.zipCode || '',
    });

    return recentAddress;
  }, []);

  // Lookup customer when phone number changes (debounced)
  const lookupCustomer = useCallback(async (phone: string) => {
    const normalizedPhone = String(phone || '').replace(/\D/g, '');
    if (!normalizedPhone || normalizedPhone.length < 7) {
      setFoundCustomer(null);
      return;
    }

    setIsLookingUp(true);
    try {
      const { data } = await api.get(`/customers/lookup?phone=${encodeURIComponent(normalizedPhone)}`);
      if (data) {
        setFoundCustomer(data);
        // Auto-fill name if found
        const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ');
        if (fullName && !customerName) {
          setCustomerName(fullName);
        }
        // Select default address for delivery
        if (type === 'DELIVERY' && data.addresses?.length > 0) {
          const defaultAddr = data.addresses.find((a: Address) => a.isDefault) || data.addresses[0];
          setSelectedAddress(defaultAddr);
          setShowNewAddress(false);
        } else if (type === 'DELIVERY') {
          await lookupRecentDeliveryAddress(normalizedPhone);
        }
      } else {
        setFoundCustomer(null);
        if (type === 'DELIVERY') {
          const loaded = await lookupRecentDeliveryAddress(normalizedPhone);
          if (!loaded) {
            setSelectedAddress(null);
          }
        } else {
          setSelectedAddress(null);
        }
      }
    } catch (error) {
      console.error('Customer lookup failed:', error);
      setFoundCustomer(null);
      if (type === 'DELIVERY') {
        try {
          await lookupRecentDeliveryAddress(normalizedPhone);
        } catch {
          setSelectedAddress(null);
        }
      }
    } finally {
      setIsLookingUp(false);
    }
  }, [type, customerName, lookupRecentDeliveryAddress]);

  const runPhoneLookupImmediate = useCallback(() => {
    if (type !== 'PICKUP' && type !== 'DELIVERY') return;
    lookupCustomer(customerPhone);
  }, [type, lookupCustomer, customerPhone]);

  // Debounce phone lookup
  useEffect(() => {
    const timer = setTimeout(() => {
      const normalized = String(customerPhone || '').replace(/\D/g, '');
      if (normalized.length >= 7 && (type === 'PICKUP' || type === 'DELIVERY')) {
        lookupCustomer(customerPhone);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [customerPhone, type, lookupCustomer]);

  const handleSubmit = () => {
    let schedulePayload: { isScheduled: boolean; scheduledFor?: string } | undefined;

    if (fulfillmentTiming === 'SCHEDULED') {
      const parsed = new Date(`${scheduledDate}T${scheduledTime}:00`);
      if (Number.isNaN(parsed.getTime())) {
        setScheduleError('Please provide a valid future date and time.');
        return;
      }
      if (parsed.getTime() < Date.now() + 5 * 60 * 1000) {
        setScheduleError('Scheduled time must be at least 5 minutes in the future.');
        return;
      }
      setScheduleError(null);
      schedulePayload = { isScheduled: true, scheduledFor: parsed.toISOString() };
    } else {
      setScheduleError(null);
      schedulePayload = { isScheduled: false };
    }

    const deliveryAddress = type === 'DELIVERY' 
      ? (selectedAddress || (showNewAddress ? newAddress : null))
      : undefined;

    onConfirm(
      type,
      type === 'DINE_IN' ? tableNumber : undefined,
      type !== 'DINE_IN' ? { name: customerName, phone: customerPhone, loyaltyPoints: foundCustomer?.loyaltyPoints || 0, referralCode: foundCustomer?.referralCode || '' } : undefined,
      deliveryAddress,
      schedulePayload
    );
  };

  const getAddressIcon = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('work') || lower.includes('office')) return <Briefcase size={18} className="text-blue-500" />;
    return <Home size={18} className="text-green-500" />;
  };

  const formatAddress = (addr: Address) => {
    return `${addr.address}, ${addr.city}, ${addr.state} ${addr.zipCode}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full m-4 p-6 max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Enter Your Details</h2>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Order Type Selection */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Order Type</label>
          <div className="grid grid-cols-3 gap-3">
            {['DINE_IN', 'PICKUP', 'DELIVERY'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setType(t as any);
                  if (t === 'DINE_IN') {
                    setSelectedAddress(null);
                    setShowNewAddress(false);
                  }
                }}
                className={`py-3 px-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  type === t
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Fulfillment Timing */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Fulfillment Timing</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setFulfillmentTiming('ASAP');
                setScheduleError(null);
              }}
              className={`py-3 px-2 rounded-lg border-2 text-sm font-medium transition-all ${
                fulfillmentTiming === 'ASAP'
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              ASAP
            </button>
            <button
              onClick={() => {
                setFulfillmentTiming('SCHEDULED');
                setScheduleError(null);
              }}
              className={`py-3 px-2 rounded-lg border-2 text-sm font-medium transition-all ${
                fulfillmentTiming === 'SCHEDULED'
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              Schedule
            </button>
          </div>
          {fulfillmentTiming === 'SCHEDULED' && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Time</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
          {scheduleError && (
            <p className="text-sm text-red-600 mt-2">{scheduleError}</p>
          )}
        </div>

        {/* Table Number for DINE_IN */}
        {type === 'DINE_IN' && (
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Table Number</label>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
              placeholder="e.g., 12"
            />
          </div>
        )}

        {/* Customer Info for PICKUP/DELIVERY */}
        {type !== 'DINE_IN' && (
          <>
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Customer Phone
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  onBlur={runPhoneLookupImmediate}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      runPhoneLookupImmediate();
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-24 text-gray-900 placeholder-gray-400"
                  placeholder="(555) 123-4567"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={runPhoneLookupImmediate}
                    className="p-1.5 rounded-md bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 transition-colors"
                    title="Search customer by phone"
                  >
                    <Search size={16} />
                  </button>
                  {isLookingUp && (
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  )}
                  {!isLookingUp && foundCustomer && (
                    <User size={18} className="text-green-500" />
                  )}
                </div>
              </div>
              {foundCustomer && (
                <p className="text-sm text-green-700 mt-2 font-medium flex items-center gap-1">
                  <span className="text-green-600">✓</span> Found customer: {[foundCustomer.firstName, foundCustomer.lastName].filter(Boolean).join(' ')}
                </p>
              )}
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                placeholder="John Doe"
              />
            </div>
          </>
        )}

        {/* Delivery Address Selection for DELIVERY */}
        {type === 'DELIVERY' && (
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <MapPin size={18} className="text-red-500" />
              Delivery Address
            </label>

            {/* Saved Addresses */}
            {foundCustomer?.addresses && foundCustomer.addresses.length > 0 && !showNewAddress && (
              <div className="space-y-2 mb-3">
                {foundCustomer.addresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => setSelectedAddress(addr)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      selectedAddress?.id === addr.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getAddressIcon(addr.label)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900">{addr.label}</span>
                          {addr.isDefault && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 truncate">{formatAddress(addr)}</p>
                      </div>
                      {selectedAddress?.id === addr.id && (
                        <div className="text-blue-500">✓</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* New Address Button */}
            {!showNewAddress && (
              <button
                onClick={() => {
                  setShowNewAddress(true);
                  setSelectedAddress(null);
                }}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 font-medium hover:border-blue-400 hover:bg-blue-50 flex items-center justify-center gap-2 transition-colors"
              >
                <Plus size={18} />
                {foundCustomer?.addresses?.length > 0 ? 'Add New Address' : 'Enter Address'}
              </button>
            )}

            {/* New Address Form */}
            {showNewAddress && (
              <div className="bg-gray-50 p-5 rounded-xl space-y-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">New Address</span>
                  <button
                    onClick={() => {
                      setShowNewAddress(false);
                      setNewAddress({ label: 'Home', address: '', city: '', state: '', zipCode: '' });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Label</label>
                  <select
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option>Home</option>
                    <option>Work</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
                  <input
                    type="text"
                    value={newAddress.address}
                    onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="123 Main St"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ZIP</label>
                    <input
                      type="text"
                      value={newAddress.zipCode}
                      onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ZIP"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Selected Address Summary */}
            {selectedAddress && !showNewAddress && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm font-semibold text-blue-900 mb-1">Delivering to:</p>
                <p className="text-sm text-blue-800">{formatAddress(selectedAddress)}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit}
            disabled={type === 'DELIVERY' && !selectedAddress && !showNewAddress}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderTypeModal;
