import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useLocalSetting } from './hooks/useLocalSetting';
import { getDirectionsUrl, getMapSearchUrl, normalizeMapsNavProvider } from './mapsNavigation';
import { 
  Bike, CheckCircle2, MapPin, PackageCheck, Navigation, Phone, 
  Clock, DollarSign, ChevronRight, Map as MapIcon, LocateFixed,
  Signal, Battery, ArrowLeft, Home, User, Menu, X, AlertCircle,
  Route, ExternalLink, Copy, Check, Lock, LogOut, Eye, EyeOff,
  Pizza, Coffee, Soup, Sandwich, Cookie, CupSoda, IceCream, 
  Salad, Beef, Fish, Carrot, Croissant, ChefHat, UtensilsCrossed,
  Flame, Star, TrendingUp, Wallet, Receipt, Calendar, Award, Info,
  Layers, Play, Pause, RotateCcw, ListOrdered, MapPinned
} from 'lucide-react';

const resolveApiUrl = () => {
  const raw = (import.meta.env.VITE_API_URL || '').trim();
  if (!raw) return 'http://localhost:3000';
  if (raw.startsWith(':')) return `http://localhost${raw}`;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw.replace(/\/+$/, '');
  return `http://${raw}`.replace(/\/+$/, '');
};

const API_URL = resolveApiUrl();

// Toast notification types
type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Toast component
function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);
  
  useEffect(() => {
    const duration = 3000;
    
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, duration);
    
    return () => {
      clearTimeout(exitTimer);
    };
  }, [toast.id, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getColors = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-gray-800 border-green-500/50 shadow-green-500/20';
      case 'error':
        return 'bg-gray-800 border-red-500/50 shadow-red-500/20';
      default:
        return 'bg-gray-800 border-blue-500/50 shadow-blue-500/20';
    }
  };

  return (
    <div
      className={`pointer-events-auto min-w-[300px] max-w-md rounded-lg border shadow-lg overflow-hidden transform transition-all duration-300 ${getColors()} ${
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        {getIcon()}
        <div className="flex-1">
          <p className="text-white text-sm font-medium">{toast.message}</p>
        </div>
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => onDismiss(toast.id), 300);
          }}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

type OrderStatus = 'PACKED' | 'READY' | 'READY_FOR_PICKUP' | 'ACCEPTED' | 'OUT_FOR_DELIVERY' | 'PICKED_UP' | 'DELIVERED' | 'COMPLETED';

interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  lat?: number;
  lng?: number;
  instructions?: string;
}

interface OrderItem {
  productName: string;
  quantity: number;
  modifiers?: string[];
  unitPrice?: number;
  totalPrice?: number;
  sizeName?: string;
}

interface DriverOrder {
  orderId: string;
  orderNumber?: string;
  tokenNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  storeId: string;
  status: OrderStatus;
  driverId?: string;
  address?: DeliveryAddress;
  items?: OrderItem[];
  itemCount?: number;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  total?: number;
  deliveryFee?: number;
  tip?: number;
  estimatedDistance?: number;
  estimatedTime?: number;
  createdAt?: string;
  payments?: Array<{
    id: string;
    method: string;
    amount: number;
    status: string;
  }>;
  data?: any;
}

interface Driver {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  vehicleType?: string;
  licensePlate?: string;
  status: string;
  storeId: string;
  perDeliveryRate?: number;
  /** From store settings — affects "Navigate" / map links */
  mapsProvider?: string;
}

interface DriverLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

const normalizeModifiers = (raw: unknown): string[] => {
  const toText = (value: any): string[] => {
    if (value == null) return [];
    if (typeof value === 'string') return value.trim() ? [value.trim()] : [];
    if (typeof value === 'number' || typeof value === 'boolean') return [String(value)];
    if (Array.isArray(value)) return value.flatMap((v) => toText(v));
    if (typeof value === 'object') {
      const group = value.modifierName || value.groupName || value.category || value.title;
      const option =
        value.name ||
        value.optionName ||
        value.label ||
        value.value ||
        value.choice ||
        value.selectedOption;
      if (group && option) return [`${group}: ${option}`];
      if (option) return [String(option)];
      if (value.options && Array.isArray(value.options)) {
        return value.options.flatMap((v: any) => toText(v));
      }
      return [JSON.stringify(value)];
    }
    return [];
  };

  const normalized = toText(raw).map((s) => String(s).trim()).filter(Boolean);
  return Array.from(new Set(normalized));
};

const asText = (value: unknown): string => (value == null ? '' : String(value).trim());

const normalizeDeliveryAddress = (rawAddress: unknown, orderSource?: any): DeliveryAddress | undefined => {
  let parsed: any = rawAddress;
  if (!parsed && orderSource) {
    parsed =
      orderSource.deliveryAddress ||
      orderSource.address ||
      orderSource.customerAddress ||
      orderSource.shippingAddress ||
      null;
  }

  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      const text = parsed.trim();
      if (text) {
        return {
          street: text,
          city: asText(orderSource?.city || orderSource?.deliveryCity),
          state: asText(orderSource?.state || orderSource?.deliveryState),
          zipCode: asText(orderSource?.zipCode || orderSource?.postalCode || orderSource?.deliveryZipCode),
          instructions: asText(orderSource?.deliveryInstructions || orderSource?.instructions),
        };
      }
      parsed = null;
    }
  }

  if (!parsed || typeof parsed !== 'object') return undefined;

  const street =
    asText(parsed.street) ||
    asText(parsed.line1) ||
    asText(parsed.address1) ||
    asText(parsed.street1) ||
    asText(parsed.addressLine1) ||
    asText(orderSource?.deliveryStreet) ||
    asText(orderSource?.streetAddress) ||
    '';

  const city =
    asText(parsed.city) ||
    asText(parsed.town) ||
    asText(orderSource?.deliveryCity) ||
    asText(orderSource?.city) ||
    '';

  const state =
    asText(parsed.state) ||
    asText(parsed.province) ||
    asText(orderSource?.deliveryState) ||
    asText(orderSource?.state) ||
    '';

  const zipCode =
    asText(parsed.zipCode) ||
    asText(parsed.postalCode) ||
    asText(parsed.zip) ||
    asText(orderSource?.deliveryZipCode) ||
    asText(orderSource?.zipCode) ||
    asText(orderSource?.postalCode) ||
    '';

  if (!street && !city && !state && !zipCode) return undefined;

  const latRaw = parsed.lat ?? parsed.latitude ?? orderSource?.lat ?? orderSource?.deliveryLat;
  const lngRaw = parsed.lng ?? parsed.longitude ?? orderSource?.lng ?? orderSource?.deliveryLng;
  const lat = Number.isFinite(Number(latRaw)) ? Number(latRaw) : undefined;
  const lng = Number.isFinite(Number(lngRaw)) ? Number(lngRaw) : undefined;

  return {
    street: street || 'Address line unavailable',
    city,
    state,
    zipCode,
    lat,
    lng,
    instructions: asText(parsed.instructions || parsed.deliveryInstructions || orderSource?.deliveryInstructions || orderSource?.instructions),
  };
};

const formatAddressLine = (address?: DeliveryAddress) => {
  if (!address) return '';
  const line2 = [address.city, address.state, address.zipCode].filter(Boolean).join(', ').replace(', ,', ',');
  return [address.street, line2].filter(Boolean).join(', ');
};

// ==================== TIP MODAL COMPONENT ====================

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tipAmount: number, emailReceipt: boolean, customerEmail: string) => void;
  order: DriverOrder | null;
  isSubmitting: boolean;
}

const TipModal: React.FC<TipModalProps> = ({ isOpen, onClose, onSubmit, order, isSubmitting }) => {
  const [tipAmount, setTipAmount] = useState<string>('0');
  const [customTip, setCustomTip] = useState<string>('');
  const [emailReceipt, setEmailReceipt] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [useCustomTip, setUseCustomTip] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTipAmount('0');
      setCustomTip('');
      setEmailReceipt(false);
      setCustomerEmail(order?.customerEmail || '');
      setUseCustomTip(false);
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const tipPresets = [0, 2, 3, 5, 10];

  const handleTipSelect = (amount: number) => {
    setTipAmount(amount.toString());
    setUseCustomTip(false);
    setCustomTip('');
  };

  const handleCustomTipChange = (value: string) => {
    // Only allow numbers and decimal point
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setCustomTip(value);
      setTipAmount(value || '0');
      setUseCustomTip(true);
    }
  };

  const handleSubmit = () => {
    const finalTip = parseFloat(tipAmount) || 0;
    onSubmit(finalTip, emailReceipt, customerEmail);
  };

  const finalTipAmount = parseFloat(tipAmount) || 0;
  const totalEarnings = (order.deliveryFee || 0) + finalTipAmount;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Delivery Complete!</h2>
              <p className="text-white/80 text-sm">Order #{order.tokenNumber || order.orderNumber}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Tip Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Add Cash Tip (Optional)
            </label>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {tipPresets.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleTipSelect(amount)}
                  className={`py-3 px-2 rounded-xl font-bold text-sm transition-all ${
                    !useCustomTip && tipAmount === amount.toString()
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {amount === 0 ? 'No Tip' : `$${amount}`}
                </button>
              ))}
            </div>
            
            {/* Custom Tip Input */}
            <div className={`relative ${useCustomTip ? 'ring-2 ring-green-500 rounded-xl' : ''}`}>
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
              <input
                type="text"
                inputMode="decimal"
                value={customTip}
                onChange={(e) => handleCustomTipChange(e.target.value)}
                placeholder="Custom amount"
                className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 font-bold"
              />
            </div>
          </div>

          {/* Earnings Preview */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Delivery Fee</span>
              <span className="font-medium text-gray-900">${(order.deliveryFee || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tip</span>
              <span className="font-medium text-green-600">+${finalTipAmount.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="font-medium text-gray-900">Total Earnings</span>
              <span className="font-bold text-xl text-green-600">${totalEarnings.toFixed(2)}</span>
            </div>
          </div>

          {/* Email Receipt Option */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={emailReceipt}
                  onChange={(e) => setEmailReceipt(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-12 h-7 rounded-full transition-colors ${emailReceipt ? 'bg-green-500' : 'bg-gray-200'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${emailReceipt ? 'translate-x-6' : 'translate-x-1'} top-1 relative`} />
                </div>
              </div>
              <span className="text-sm font-medium text-gray-700">Email receipt to customer</span>
            </label>

            {emailReceipt && (
              <div className="animate-fade-in">
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (emailReceipt && !customerEmail)}
              className="flex-1 py-3 px-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  Complete Delivery
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

// ==================== ROUTE OPTIMIZER COMPONENT ====================

interface RouteOptimizerProps {
  orders: DriverOrder[];
  currentLocation: DriverLocation | null;
  onReorder: (newOrder: DriverOrder[]) => void;
}

const RouteOptimizer: React.FC<RouteOptimizerProps> = ({ orders, currentLocation, onReorder }) => {
  const [optimized, setOptimized] = useState(false);
  const [loading, setLoading] = useState(false);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const optimizeRoute = () => {
    if (orders.length < 2) return;
    
    setLoading(true);
    
    // Simple nearest neighbor algorithm for route optimization
    setTimeout(() => {
      const sorted = [...orders];
      
      if (currentLocation) {
        // Sort by distance from current location
        sorted.sort((a, b) => {
          const distA = a.address?.lat && a.address?.lng 
            ? calculateDistance(currentLocation.lat, currentLocation.lng, a.address.lat, a.address.lng)
            : Infinity;
          const distB = b.address?.lat && b.address?.lng
            ? calculateDistance(currentLocation.lat, currentLocation.lng, b.address.lat, b.address.lng)
            : Infinity;
          return distA - distB;
        });
      }
      
      onReorder(sorted);
      setOptimized(true);
      setLoading(false);
    }, 500);
  };

  const resetOrder = () => {
    onReorder([...orders].sort((a, b) => 
      new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    ));
    setOptimized(false);
  };

  if (orders.length < 2) return null;

  return (
    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 text-white mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Route size={20} />
          </div>
          <div>
            <h3 className="font-bold">Route Optimizer</h3>
            <p className="text-white/80 text-sm">
              {orders.length} deliveries • {optimized ? 'Optimized' : 'Original order'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {optimized ? (
            <button
              onClick={resetOrder}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              title="Reset to original order"
            >
              <RotateCcw size={20} />
            </button>
          ) : (
            <button
              onClick={optimizeRoute}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-colors disabled:opacity-70"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
              ) : (
                <>
                  <MapPinned size={18} />
                  Optimize
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== FOOD ICONS ====================

const getFoodIcon = (productName: string) => {
  const name = productName.toLowerCase();
  
  // Pizza items
  if (name.includes('pizza') || name.includes('pepperoni') || name.includes('cheese') || name.includes('margherita')) {
    return <Pizza size={20} className="text-orange-500" />;
  }
  
  // Pasta items
  if (name.includes('pasta') || name.includes('spaghetti') || name.includes('fettuccine') || name.includes('penne') || name.includes('lasagna')) {
    return <Soup size={20} className="text-amber-600" />;
  }
  
  // Subs/Sandwiches
  if (name.includes('sub') || name.includes('sandwich') || name.includes('hoagie') || name.includes('wrap')) {
    return <Sandwich size={20} className="text-green-600" />;
  }
  
  // Wings/Chicken
  if (name.includes('wing') || name.includes('chicken') || name.includes('buffalo') || name.includes('bbq')) {
    return <Flame size={20} className="text-red-500" />;
  }
  
  // Salads
  if (name.includes('salad') || name.includes('caesar') || name.includes('garden')) {
    return <Salad size={20} className="text-green-500" />;
  }
  
  // Drinks
  if (name.includes('soda') || name.includes('drink') || name.includes('coke') || name.includes('pepsi') || name.includes('water')) {
    return <CupSoda size={20} className="text-blue-500" />;
  }
  
  // Desserts
  if (name.includes('cookie') || name.includes('brownie')) {
    return <Cookie size={20} className="text-amber-700" />;
  }
  if (name.includes('ice cream') || name.includes('sundae') || name.includes('gelato')) {
    return <IceCream size={20} className="text-pink-500" />;
  }
  if (name.includes('cake') || name.includes('cheesecake') || name.includes('pastry')) {
    return <Croissant size={20} className="text-amber-600" />;
  }
  
  // Meat items
  if (name.includes('beef') || name.includes('steak') || name.includes('burger') || name.includes('meatball')) {
    return <Beef size={20} className="text-red-600" />;
  }
  
  // Seafood
  if (name.includes('fish') || name.includes('shrimp') || name.includes('seafood')) {
    return <Fish size={20} className="text-blue-400" />;
  }
  
  // Sides
  if (name.includes('fries') || name.includes('bread') || name.includes('sticks') || name.includes('roll')) {
    return <Carrot size={20} className="text-orange-400" />;
  }
  
  // Default
  return <ChefHat size={20} className="text-slate-500" />;
};

// ==================== UTILS ====================

const formatCurrency = (amount?: number) => {
  if (amount === undefined) return '$0.00';
  return `$${amount.toFixed(2)}`;
};

const formatDistance = (miles?: number) => {
  if (miles === undefined) return '';
  if (miles < 0.1) return '< 0.1 mi';
  return `${miles.toFixed(1)} mi`;
};

const formatTime = (minutes?: number) => {
  if (minutes === undefined) return '';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

// ==================== LOGIN COMPONENT ====================

interface LoginProps {
  onLogin: (driver: Driver, token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState(localStorage.getItem('driverEmail') || '');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/v1/drivers/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Invalid credentials');
      }

      const driver = await response.json();
      
      if (rememberMe) {
        localStorage.setItem('driverEmail', email);
      } else {
        localStorage.removeItem('driverEmail');
      }
      
      // Wrap the driver object in a session envelope so we can enforce idle/absolute
      // expiry on a shared tablet. Reading code checks both windows before trusting
      // the stored driver — see the mount-effect in <App>.
      const session = {
        driver,
        loginAt: Date.now(),
        lastActivityAt: Date.now(),
      };
      localStorage.setItem('driver-session', JSON.stringify(session));
      // Legacy key removed to avoid two drivers being authenticated at once.
      localStorage.removeItem('driver');
      onLogin(driver, driver.id);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bike className="text-blue-600" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Login</h1>
          <p className="text-gray-500 mt-1">Enter your credentials to continue</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <AlertCircle className="text-red-500 shrink-0" size={18} />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PIN
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-12"
                placeholder="Enter your PIN"
                maxLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Remember my email</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <Lock size={20} />
                Login
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Contact your manager if you forgot your PIN
        </p>
      </div>
    </div>
  );
};

// ==================== MAIN APP ====================

function App() {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [storeId, setStoreId] = useState('default-store');
  const [orders, setOrders] = useState<DriverOrder[]>([]);
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed'>('available');
  const [batchSelectionMode, setBatchSelectionMode] = useState(false);
  const [selectedAvailableOrderIds, setSelectedAvailableOrderIds] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<DriverOrder | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ deliveries: 0, tips: 0, total: 0 });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showTipModal, setShowTipModal] = useState(false);
  const [pendingDeliveryOrder, setPendingDeliveryOrder] = useState<DriverOrder | null>(null);
  const [isSubmittingTip, setIsSubmittingTip] = useState(false);
  const locationWatchRef = useRef<number | null>(null);

  // Driver-scoped completed-orders ring buffer so the "Done" tab actually shows the shift's
  // history. Capped at 50 to keep localStorage small. Keyed by driver id so two drivers
  // sharing a tablet don't see each other's history.
  const historyKey = `web-driver-completed-history:${driver?.id || 'guest'}`;
  const [completedHistory, setCompletedHistory] = useLocalSetting<
    Array<DriverOrder & { deliveredAt?: string; earnedTip?: number }>
  >(historyKey, {
    defaultValue: [],
    validate: (v): v is Array<DriverOrder & { deliveredAt?: string; earnedTip?: number }> =>
      Array.isArray(v),
  });

  const pushCompleted = useCallback(
    (order: DriverOrder, extras: { deliveredAt?: string; earnedTip?: number } = {}) => {
      setCompletedHistory((prev) => {
        const filtered = prev.filter((o) => o.orderId !== order.orderId);
        const entry: DriverOrder & { deliveredAt?: string; earnedTip?: number } = {
          ...order,
          status: 'DELIVERED' as OrderStatus,
          deliveredAt: extras.deliveredAt || new Date().toISOString(),
          earnedTip: extras.earnedTip,
        };
        return [entry, ...filtered].slice(0, 50);
      });
    },
    [setCompletedHistory],
  );

  // Toast helper
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ===== Driver session expiry =====
  //
  // A driver tablet is typically shared between shifts. Two rules limit how long a
  // PIN-less login is valid:
  //  - ABSOLUTE_MAX_MS: hard cap from the login moment (e.g. 12h)
  //  - IDLE_MAX_MS: rolling cap from last user interaction (e.g. 60m)
  // Either threshold expires the session and forces a fresh PIN entry.
  const ABSOLUTE_MAX_MS = 12 * 60 * 60 * 1000; // 12 hours
  const IDLE_MAX_MS = 60 * 60 * 1000;          // 60 minutes

  const clearDriverSession = useCallback(() => {
    localStorage.removeItem('driver-session');
    localStorage.removeItem('driver'); // legacy
    setDriver(null);
  }, []);

  const isSessionFresh = useCallback(
    (loginAt: number, lastActivityAt: number) => {
      const now = Date.now();
      if (!loginAt || !lastActivityAt) return false;
      if (now - loginAt > ABSOLUTE_MAX_MS) return false;
      if (now - lastActivityAt > IDLE_MAX_MS) return false;
      return true;
    },
    [ABSOLUTE_MAX_MS, IDLE_MAX_MS],
  );

  // Check for stored driver session on mount. Honors both new envelope and legacy key.
  useEffect(() => {
    const wrapped = localStorage.getItem('driver-session');
    if (wrapped) {
      try {
        const parsed = JSON.parse(wrapped);
        if (parsed?.driver && isSessionFresh(parsed.loginAt, parsed.lastActivityAt)) {
          setDriver(parsed.driver);
          setStoreId(parsed.driver.storeId || 'default-store');
          return;
        }
      } catch {
        /* fall through */
      }
      // Expired or unparseable — wipe and force re-login.
      clearDriverSession();
      return;
    }

    // Legacy fallback: an older client stored the bare driver under "driver". Honor it
    // once, but immediately upgrade to the new envelope on the next render.
    const storedDriver = localStorage.getItem('driver');
    if (storedDriver) {
      try {
        const parsed = JSON.parse(storedDriver);
        const session = {
          driver: parsed,
          loginAt: Date.now(),
          lastActivityAt: Date.now(),
        };
        localStorage.setItem('driver-session', JSON.stringify(session));
        localStorage.removeItem('driver');
        setDriver(parsed);
        setStoreId(parsed.storeId || 'default-store');
      } catch {
        localStorage.removeItem('driver');
      }
    }
  }, [clearDriverSession, isSessionFresh]);

  // Touch lastActivityAt on real user input. The listeners are passive and throttled
  // (max once every 30s) so they're free on a low-end tablet.
  useEffect(() => {
    if (!driver) return;
    let lastWrite = 0;
    const touch = () => {
      const now = Date.now();
      if (now - lastWrite < 30000) return;
      lastWrite = now;
      try {
        const raw = localStorage.getItem('driver-session');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        parsed.lastActivityAt = now;
        localStorage.setItem('driver-session', JSON.stringify(parsed));
      } catch {
        /* noop */
      }
    };
    const events = ['pointerdown', 'keydown', 'touchstart', 'visibilitychange'] as const;
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
    };
  }, [driver]);

  // Periodically check whether the session has lapsed in the background (e.g. tablet
  // left idle on the available-orders screen). Fires once a minute.
  useEffect(() => {
    if (!driver) return;
    const tick = () => {
      try {
        const raw = localStorage.getItem('driver-session');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!isSessionFresh(parsed.loginAt, parsed.lastActivityAt)) {
          clearDriverSession();
        }
      } catch {
        /* noop */
      }
    };
    const interval = setInterval(tick, 60 * 1000);
    return () => clearInterval(interval);
  }, [driver, clearDriverSession, isSessionFresh]);

  // ==================== GPS / LOCATION ====================

  const requestLocationPermission = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your device');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationPermission('granted');
        setLocationError('');
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        setLocation(newLocation);
        
        // Emit to server
        if (driver) {
          socket?.emit('driver:location', {
            driverId: driver.id,
            lat: newLocation.lat,
            lng: newLocation.lng,
            storeId,
          });
          
          // Also update via API
          fetch(`${API_URL}/api/v1/drivers/${driver.id}/location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: newLocation.lat, lng: newLocation.lng }),
          }).catch(console.error);
        }
      },
      (error) => {
        console.error('Location error:', error);
        setLocationPermission('denied');
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enable location services in your browser settings.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An error occurred while getting location.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [driver, socket, storeId]);

  // Start continuous location tracking when online
  useEffect(() => {
    if (!isOnline || locationPermission !== 'granted' || !driver) {
      if (locationWatchRef.current) {
        navigator.geolocation.clearWatch(locationWatchRef.current);
        locationWatchRef.current = null;
      }
      return;
    }

    locationWatchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        setLocation(newLocation);
        
        // Emit to server
        socket?.emit('driver:location', {
          driverId: driver.id,
          lat: newLocation.lat,
          lng: newLocation.lng,
          storeId,
        });
      },
      (error) => {
        console.error('Watch position error:', error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );

    return () => {
      if (locationWatchRef.current) {
        navigator.geolocation.clearWatch(locationWatchRef.current);
      }
    };
  }, [isOnline, locationPermission, driver, socket, storeId]);

  // Initial location request
  useEffect(() => {
    if (driver) {
      requestLocationPermission();
    }
  }, [driver, requestLocationPermission]);

  // ==================== FETCH ASSIGNED ORDERS ====================
  
  const fetchAssignedOrders = async () => {
    if (!driver) return;
    
    try {
      // Fetch orders assigned to this driver that are out for delivery or ready
      const response = await fetch(`${API_URL}/api/v1/orders?storeId=${storeId}&status=OUT_FOR_DELIVERY,READY_FOR_PICKUP,READY,PICKED_UP`);
      if (response.ok) {
        const data = await response.json();
        // Filter orders:
        // 1. Orders explicitly assigned to this driver
        // 2. Unassigned delivery orders that are READY (available for pickup)
        const assignedOrders = data.filter((order: any) => 
          order.driverId === driver.id || 
          (order.type === 'DELIVERY' && (order.status === 'PACKED' || order.status === 'READY'))
        );
        
        const mappedOrders: DriverOrder[] = assignedOrders.map((order: any) => {
          // Parse items from various possible formats
          let parsedItems: OrderItem[] = [];
          if (order.items && Array.isArray(order.items)) {
            parsedItems = order.items.map((item: any) => ({
              productName: item.productName || item.name || 'Unknown Item',
              quantity: item.quantity || 1,
              modifiers: normalizeModifiers(item.modifiers),
              unitPrice: item.unitPrice ? Number(item.unitPrice) : undefined,
              totalPrice: item.totalPrice ? Number(item.totalPrice) : undefined,
              sizeName: item.sizeName || undefined,
            }));
          }

          // Parse and normalize delivery address from multiple backend shapes
          const parsedAddress = normalizeDeliveryAddress(order.deliveryAddress || order.address, order);

          // Calculate item count
          const itemCount = parsedItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

          // Determine driver order status
          let driverStatus: OrderStatus;
          if (order.driverId === driver.id) {
            if (order.status === 'OUT_FOR_DELIVERY') {
              driverStatus = 'OUT_FOR_DELIVERY';
            } else if (order.status === 'PICKED_UP') {
              driverStatus = 'PICKED_UP';
            } else {
              driverStatus = 'ACCEPTED';
            }
          } else {
            driverStatus = 'READY_FOR_PICKUP';
          }

          return {
            orderId: order.id,
            orderNumber: order.orderNumber,
            tokenNumber: order.tokenNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerEmail: order.customerEmail,
            storeId: order.storeId,
            status: driverStatus,
            driverId: order.driverId,
            address: parsedAddress,
            items: parsedItems,
            itemCount,
            subtotal: order.subtotal ? Number(order.subtotal) : undefined,
            taxAmount: order.taxAmount ? Number(order.taxAmount) : undefined,
            discountAmount: order.discountAmount ? Number(order.discountAmount) : undefined,
            total: order.total ? Number(order.total) : 0,
            deliveryFee: order.deliveryFee ? Number(order.deliveryFee) : 0,
            tip: order.tipAmount ? Number(order.tipAmount) : 0,
            estimatedDistance: order.estimatedDistance ? Number(order.estimatedDistance) : undefined,
            estimatedTime: order.estimatedTime ? Number(order.estimatedTime) : undefined,
            createdAt: order.createdAt,
            payments: order.payments || [],
            data: order,
          };
        });
        
        setOrders((prev) => {
          // Merge with existing orders, updating any that already exist
          const existingIds = new Set(prev.map(o => o.orderId));
          const updatedOrders = prev.map(o => {
            const updated = mappedOrders.find((m: DriverOrder) => m.orderId === o.orderId);
            return updated ? { ...o, ...updated } : o;
          });
          const newOrders = mappedOrders.filter((o: DriverOrder) => !existingIds.has(o.orderId));
          return [...updatedOrders, ...newOrders];
        });
      }
    } catch (error) {
      console.error('Failed to fetch assigned orders:', error);
    }
  };

  // ==================== WEBSOCKET ====================

  useEffect(() => {
    if (!driver) return;

    // Fetch existing assigned orders on login
    fetchAssignedOrders();
    
    // Poll for orders every 30 seconds as fallback
    const pollInterval = setInterval(fetchAssignedOrders, 30000);

    const ws = io(`${API_URL}/ws`, {
      transports: ['websocket'],
      auth: { token: 'driver-token' },
    });
    setSocket(ws);

    ws.on('connect', () => {
      console.log('[Driver] Connected to WebSocket');
      ws.emit('drivers:subscribe', storeId);
    });
    
    ws.on('drivers:subscribed', (data) => {
      console.log('[Driver] Subscribed to store:', data);
      // Fetch orders after successful subscription
      fetchAssignedOrders();
    });

    ws.on('disconnect', () => {
      console.log('[Driver] Disconnected from WebSocket');
    });

    const ingest = (payload: any) => {
      console.log('Driver received:', payload);
      const orderId = payload.orderId || payload.id;
      if (!orderId) return;

      // API may send order data nested in 'order' field or directly in payload
      const orderData = payload.data || payload.order || payload;
      const orderDriverId = orderData?.driverId || payload.driverId;
      const orderStatus = payload.status || orderData?.status;
      const orderType = orderData?.type || payload.orderType;
      
      // Debug logging
      console.log('[Driver] Processing order:', {
        orderId,
        orderDriverId,
        myDriverId: driver?.id,
        orderStatus,
        orderType,
      });
      
      // Only show orders:
      // 1. Assigned to this driver
      // 2. Unassigned delivery orders with READY status
      const isAssignedToMe = orderDriverId === driver?.id;
      const isUnassignedDelivery = orderType === 'DELIVERY' && !orderDriverId && (orderStatus === 'PACKED' || orderStatus === 'READY');
      
      console.log('[Driver] Filter check:', { isAssignedToMe, isUnassignedDelivery });
      
      if (!isAssignedToMe && !isUnassignedDelivery) {
        console.log('[Driver] Skipping order - not assigned to me');
        return; // Skip orders not relevant to this driver
      }

      // Parse items from various formats
      let parsedItems: OrderItem[] = [];
      const rawItems = orderData?.items || payload.items;
      if (rawItems && Array.isArray(rawItems)) {
        parsedItems = rawItems.map((item: any) => ({
          productName: item.productName || item.name || 'Unknown Item',
          quantity: item.quantity || 1,
          modifiers: normalizeModifiers(item.modifiers),
          unitPrice: item.unitPrice ? Number(item.unitPrice) : undefined,
          totalPrice: item.totalPrice ? Number(item.totalPrice) : undefined,
          sizeName: item.sizeName || undefined,
        }));
      }

      // Parse and normalize delivery address from payload/order fields
      const rawAddress = orderData?.deliveryAddress || orderData?.address || payload?.deliveryAddress || payload?.address;
      const parsedAddress = normalizeDeliveryAddress(rawAddress, orderData || payload);

      // Calculate item count
      const itemCount = parsedItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

      // Determine driver order status
      let driverStatus: OrderStatus;
      if (isAssignedToMe) {
        if (orderStatus === 'OUT_FOR_DELIVERY' || orderStatus === 'PICKED_UP') {
          driverStatus = orderStatus;
        } else {
          driverStatus = 'ACCEPTED';
        }
      } else {
        driverStatus = 'READY_FOR_PICKUP';
      }
      
      const next: DriverOrder = {
        orderId,
        orderNumber: payload.orderNumber || orderData?.orderNumber,
        tokenNumber: payload.tokenNumber || orderData?.tokenNumber,
        customerName: payload.customerName || orderData?.customerName,
        customerPhone: orderData?.customerPhone,
        customerEmail: orderData?.customerEmail,
        storeId: payload.storeId || storeId,
        status: driverStatus,
        driverId: orderDriverId,
        address: parsedAddress,
        items: parsedItems,
        itemCount,
        subtotal: orderData?.subtotal ? Number(orderData.subtotal) : undefined,
        taxAmount: orderData?.taxAmount ? Number(orderData.taxAmount) : undefined,
        discountAmount: orderData?.discountAmount ? Number(orderData.discountAmount) : undefined,
        total: orderData?.total ? Number(orderData.total) : 0,
        deliveryFee: orderData?.deliveryFee ? Number(orderData.deliveryFee) : 0,
        tip: orderData?.tipAmount ? Number(orderData.tipAmount) : 
             orderData?.tip ? Number(orderData.tip) : 0,
        estimatedDistance: orderData?.estimatedDistance ? Number(orderData.estimatedDistance) : undefined,
        estimatedTime: orderData?.estimatedTime ? Number(orderData.estimatedTime) : undefined,
        createdAt: orderData?.createdAt,
        payments: orderData?.payments || [],
        data: orderData,
      };

      setOrders((prev) => {
        const exists = prev.some((o) => o.orderId === orderId);
        if (exists) {
          return prev.map((o) => (o.orderId === orderId ? { ...o, ...next } : o));
        }
        return [next, ...prev];
      });
    };

    ws.on('driver:order:assigned', ingest);
    ws.on('order:out:for:delivery', ingest);
    ws.on('driver:delivery-assigned', ingest);
    ws.on('order:status:changed', ingest);
    ws.on('driver:order:accepted', ingest);
    ws.on('driver:order:picked-up', ingest);
    ws.on('driver:order:delivered', (payload) => {
      setOrders((prev) => prev.filter((o) => o.orderId !== payload.orderId));
    });

    return () => {
      clearInterval(pollInterval);
      ws.close();
    };
  }, [driver, storeId]);

  // ==================== LOAD STATS ====================

  useEffect(() => {
    if (!driver) return;

    const loadStats = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/drivers/${driver.id}/stats?period=today`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [driver]);

  // ==================== ORDER ACTIONS ====================

  const acceptOrder = async (order: DriverOrder) => {
    if (!driver) return;
    
    try {
      const response = await fetch(`${API_URL}/api/v1/drivers/${driver.id}/assign-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.orderId, storeId }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept order');
      }
      
      socket?.emit('driver:status', { 
        driverId: driver.id, 
        orderId: order.orderId, 
        status: 'ACCEPTED', 
        storeId 
      });
      
      setOrders((prev) => 
        prev.map((o) => 
          o.orderId === order.orderId 
            ? { ...o, status: 'OUT_FOR_DELIVERY' } 
            : o
        )
      );
      
      setSelectedOrder(null);
    } catch (error) {
      console.error('Failed to accept order:', error);
      showToast('Failed to accept order. Please try again.', 'error');
    }
  };

  const markPickedUp = async (order: DriverOrder) => {
    if (!driver) return;

    // Persist via REST first so the POS/Dispatch sees an authoritative state change
    // even if the WebSocket connection happens to be down. The socket emit is still
    // a useful low-latency hint for other live screens.
    try {
      const response = await fetch(
        `${API_URL}/api/v1/orders/${order.orderId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'OUT_FOR_DELIVERY', storeId }),
        },
      );

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error('[Driver] markPickedUp failed:', response.status, text);
        showToast('Could not mark order picked up. Try again.', 'error');
        return;
      }
    } catch (error) {
      console.error('[Driver] markPickedUp error:', error);
      showToast('Network error. Pickup not recorded.', 'error');
      return;
    }

    socket?.emit('driver:status', {
      driverId: driver.id,
      orderId: order.orderId,
      status: 'PICKED_UP',
      storeId,
    });

    setOrders((prev) =>
      prev.map((o) =>
        o.orderId === order.orderId
          ? { ...o, status: 'OUT_FOR_DELIVERY' }
          : o,
      ),
    );
    showToast('Order picked up. Drive safe!', 'success');
  };

  const markDelivered = async (order: DriverOrder) => {
    if (!driver) return;
    
    // Show tip modal instead of immediately completing
    setPendingDeliveryOrder(order);
    setShowTipModal(true);
  };

  const handleDeliveryComplete = async (tipAmount: number, emailReceipt: boolean, customerEmail: string) => {
    if (!driver || !pendingDeliveryOrder) return;
    
    setIsSubmittingTip(true);
    
    try {
      // First mark as delivered
      await fetch(`${API_URL}/api/v1/orders/${pendingDeliveryOrder.orderId}/driver/delivered`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: driver.id, storeId }),
      });
      
      // Then record tip if any
      if (tipAmount > 0 || emailReceipt) {
        await fetch(`${API_URL}/api/v1/orders/${pendingDeliveryOrder.orderId}/driver/record-tip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            driverId: driver.id, 
            tipAmount, 
            emailReceipt, 
            customerEmail 
          }),
        });
      }
      
      socket?.emit('driver:status', { 
        driverId: driver.id, 
        orderId: pendingDeliveryOrder.orderId, 
        status: 'DELIVERED', 
        storeId 
      });
      
      // Persist a copy to the driver's local completed-history before removing from `orders`
      // so the "Done" tab shows the shift's deliveries across refreshes.
      pushCompleted(pendingDeliveryOrder, { earnedTip: tipAmount });
      setOrders((prev) => prev.filter((o) => o.orderId !== pendingDeliveryOrder.orderId));
      setSelectedOrder(null);
      setShowTipModal(false);
      setPendingDeliveryOrder(null);

      // Update stats
      setStats(prev => ({
        ...prev,
        deliveries: prev.deliveries + 1,
        tips: prev.tips + tipAmount,
        total: prev.total + (pendingDeliveryOrder.deliveryFee || 0) + tipAmount,
      }));
      
      showToast(
        tipAmount > 0 
          ? `Delivery completed! You earned $${((pendingDeliveryOrder.deliveryFee || 0) + tipAmount).toFixed(2)}` 
          : 'Delivery completed successfully!', 
        'success'
      );
    } catch (error) {
      console.error('Failed to complete delivery:', error);
      showToast('Failed to complete delivery. Please try again.', 'error');
    } finally {
      setIsSubmittingTip(false);
    }
  };

  const openInMaps = (order: DriverOrder) => {
    const label = order.address ? formatAddressLine(order.address) : '';
    const url = getDirectionsUrl(
      normalizeMapsNavProvider(driver?.mapsProvider),
      order.address,
      label,
      location || undefined,
    );
    window.open(url, '_blank');
  };

  const copyAddress = (order: DriverOrder) => {
    if (!order.address) return;
    const fullAddress = formatAddressLine(order.address);
    navigator.clipboard.writeText(fullAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    clearDriverSession();
    socket?.close();
    setOrders([]);
  };

  const handleGoOffline = async () => {
    if (!driver) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/drivers/${driver.id}/offline`, {
        method: 'POST',
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error('[Driver] go-offline failed:', response.status, text);
        showToast('Could not go offline. You are still receiving orders.', 'error');
        return;
      }
      setIsOnline(false);
      showToast("You're now offline. New orders won't be assigned.", 'info');
    } catch (error) {
      console.error('Failed to go offline:', error);
      showToast('Network error. Status unchanged.', 'error');
    }
  };

  const handleGoOnline = async () => {
    if (!driver) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/drivers/${driver.id}/online`, {
        method: 'POST',
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error('[Driver] go-online failed:', response.status, text);
        showToast('Could not go online. Try again in a moment.', 'error');
        return;
      }
      setIsOnline(true);
      showToast("You're online. Watch for new orders.", 'success');
    } catch (error) {
      console.error('Failed to go online:', error);
      showToast('Network error. Status unchanged.', 'error');
    }
  };

  // ==================== ORDER LISTS ====================

  const availableOrders = useMemo(
    () => orders.filter((o) => 
      ['PACKED', 'READY_FOR_PICKUP', 'READY'].includes(o.status) && 
      (!o.driverId || o.driverId !== driver?.id) &&
      (!o.data?.driverId || o.data?.driverId !== driver?.id)
    ),
    [orders, driver]
  );

  const selectedAvailableOrders = useMemo(
    () => availableOrders.filter((o) => selectedAvailableOrderIds.includes(o.orderId)),
    [availableOrders, selectedAvailableOrderIds],
  );
  
  const activeOrders = useMemo(
    () => orders.filter((o) => 
      ['OUT_FOR_DELIVERY', 'ACCEPTED', 'PICKED_UP'].includes(o.status) && 
      (o.driverId === driver?.id || o.data?.driverId === driver?.id)
    ),
    [orders, driver]
  );

  // The Done tab is fed by the persisted history (so deliveries survive across refresh and
  // socket-reconnects). We still merge in any in-flight `orders` that have already reached
  // DELIVERED/COMPLETED in case the push happened off-screen for some reason.
  const completedOrders = useMemo(() => {
    const inFlight = orders.filter((o) => ['DELIVERED', 'COMPLETED'].includes(o.status));
    const merged = [...inFlight];
    for (const c of completedHistory) {
      if (!merged.find((o) => o.orderId === c.orderId)) merged.push(c);
    }
    return merged;
  }, [orders, completedHistory]);

  useEffect(() => {
    if (activeTab !== 'available' && (batchSelectionMode || selectedAvailableOrderIds.length > 0)) {
      setBatchSelectionMode(false);
      setSelectedAvailableOrderIds([]);
    }
  }, [activeTab, batchSelectionMode, selectedAvailableOrderIds.length]);

  useEffect(() => {
    if (!batchSelectionMode) return;
    const availableIdSet = new Set(availableOrders.map((o) => o.orderId));
    setSelectedAvailableOrderIds((prev) => prev.filter((id) => availableIdSet.has(id)));
  }, [availableOrders, batchSelectionMode]);

  const toggleSelectAvailableOrder = useCallback((orderId: string) => {
    setSelectedAvailableOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId],
    );
  }, []);

  const clearBatchSelection = useCallback(() => {
    setSelectedAvailableOrderIds([]);
    setBatchSelectionMode(false);
  }, []);

  const acceptSelectedOrders = useCallback(async () => {
    if (!driver || selectedAvailableOrderIds.length === 0) return;
    try {
      const response = await fetch(`${API_URL}/api/v1/drivers/${driver.id}/assign-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selectedAvailableOrderIds, storeId }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign selected orders');
      }

      const result = await response.json();
      const assignedIds = (result?.results || [])
        .filter((r: any) => r.success)
        .map((r: any) => r.orderId);

      setOrders((prev) =>
        prev.map((order) =>
          assignedIds.includes(order.orderId)
            ? { ...order, status: 'OUT_FOR_DELIVERY', driverId: driver.id }
            : order,
        ),
      );

      assignedIds.forEach((orderId: string) => {
        socket?.emit('driver:status', {
          driverId: driver.id,
          orderId,
          status: 'ACCEPTED',
          storeId,
        });
      });

      showToast(
        `Assigned ${assignedIds.length} delivery${assignedIds.length === 1 ? '' : 'ies'} to ${driver.name}`,
        'success',
      );
      clearBatchSelection();
      setActiveTab('active');
    } catch (error) {
      console.error('Failed to assign selected orders:', error);
      showToast('Failed to assign selected deliveries.', 'error');
    }
  }, [driver, selectedAvailableOrderIds, storeId, socket, clearBatchSelection, showToast]);

  // ==================== RENDER LOGIN ====================

  if (!driver) {
    return <Login onLogin={(d) => setDriver(d)} />;
  }

  // ==================== RENDER: ORDER DETAIL VIEW ====================

  if (selectedOrder) {
    const isAvailable = ['PACKED', 'READY_FOR_PICKUP', 'READY'].includes(selectedOrder.status);
    const isActive = ['OUT_FOR_DELIVERY', 'ACCEPTED', 'PICKED_UP'].includes(selectedOrder.status);
    const isMyOrder = selectedOrder.driverId === driver?.id || selectedOrder.data?.driverId === driver?.id;

    return (
      <div className="min-h-screen bg-slate-100">
        {/* Tip Collection Modal */}
        <TipModal
          isOpen={showTipModal}
          onClose={() => {
            setShowTipModal(false);
            setPendingDeliveryOrder(null);
          }}
          onSubmit={handleDeliveryComplete}
          order={pendingDeliveryOrder}
          isSubmitting={isSubmittingTip}
        />
        
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <button 
              onClick={() => setSelectedOrder(null)}
              className="flex items-center gap-1 text-slate-600"
            >
              <ArrowLeft size={24} />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-lg font-bold">Delivery Details</h1>
            <div className="w-16" />
          </div>
        </header>

        <div className="p-4 space-y-4">
          {/* Order Header Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-3xl font-bold text-slate-900">
                  #{selectedOrder.tokenNumber || selectedOrder.orderNumber || selectedOrder.orderId.slice(-6)}
                </p>
                <p className="text-slate-500">
                  {selectedOrder.itemCount || selectedOrder.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0} items
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                isActive 
                  ? 'bg-blue-100 text-blue-700' 
                  : isAvailable 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
              }`}>
                {isActive ? 'In Progress' : isAvailable ? 'Available' : 'Completed'}
              </div>
            </div>

            {isActive && isMyOrder && (
              <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                <div className="text-center">
                  <p className="text-xs text-slate-500">Delivery Fee</p>
                  <p className="font-bold text-slate-900">{formatCurrency(selectedOrder.deliveryFee)}</p>
                </div>
                <div className="text-center border-x">
                  <p className="text-xs text-slate-500">Tip</p>
                  <p className="font-bold text-green-600">{formatCurrency(selectedOrder.tip)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="font-bold text-slate-900">{formatCurrency((selectedOrder.deliveryFee || 0) + (selectedOrder.tip || 0))}</p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <MapPin className="text-blue-600" size={24} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900">Delivery Address</p>
                <p className="text-sm text-slate-500">
                  {formatDistance(selectedOrder.estimatedDistance)} - {formatTime(selectedOrder.estimatedTime)}
                </p>
              </div>
            </div>

            {selectedOrder.address ? (
              <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200/80">
                <p className="font-semibold text-slate-900">{selectedOrder.address.street || 'Address line unavailable'}</p>
                <p className="text-slate-600 mt-1">
                  {[selectedOrder.address.city, selectedOrder.address.state, selectedOrder.address.zipCode].filter(Boolean).join(', ') || 'City/State/Zip unavailable'}
                </p>
                {selectedOrder.address.instructions && (
                  <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <span className="font-semibold">Instructions:</span> {selectedOrder.address.instructions}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-rose-50 rounded-xl p-4 mb-4 border border-rose-200">
                <p className="text-rose-700 flex items-center gap-2 font-medium">
                  <AlertCircle size={16} />
                  Address not available
                </p>
                <p className="text-sm text-rose-600 mt-1">Please refresh order data or contact store before navigation.</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => openInMaps(selectedOrder)}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-blue-700 active:scale-95 transition-all"
              >
                <Navigation size={20} />
                Navigate
              </button>
              <button
                onClick={() => copyAddress(selectedOrder)}
                className="flex items-center justify-center gap-2 bg-slate-200 text-slate-700 py-3 px-4 rounded-xl font-bold hover:bg-slate-300 active:scale-95 transition-all"
              >
                {copied ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Alternative Maps Options */}
            {selectedOrder.address && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-2">Open in:</p>
                <div className="flex gap-2">
                  <a
                    href={getMapSearchUrl(
                      normalizeMapsNavProvider(driver?.mapsProvider),
                      formatAddressLine(selectedOrder.address),
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <ExternalLink size={14} />
                    {normalizeMapsNavProvider(driver?.mapsProvider) === 'OPENSTREETMAP'
                      ? 'OpenStreetMap'
                      : 'Google Maps'}
                  </a>
                  <a
                    href={`https://maps.apple.com/?q=${encodeURIComponent(
                      formatAddressLine(selectedOrder.address)
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <MapIcon size={14} />
                    Apple Maps
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <User className="text-green-600" size={24} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900">{selectedOrder.customerName || 'Customer'}</p>
                {selectedOrder.customerPhone && (
                  <p className="text-sm text-slate-500">{selectedOrder.customerPhone}</p>
                )}
              </div>
            </div>

            {/* Payment Info */}
            {selectedOrder.payments && selectedOrder.payments.length > 0 && (
              <div className="mb-4 p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Payment Method</p>
                <div className="flex items-center gap-2">
                  {selectedOrder.payments.map((payment, idx) => (
                    <span key={idx} className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      payment.method === 'CASH' 
                        ? 'bg-green-100 text-green-700' 
                        : payment.method === 'CREDIT_CARD'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {payment.method === 'CASH' ? '💵 Cash' : 
                       payment.method === 'CREDIT_CARD' ? '💳 Card' : payment.method}
                    </span>
                  ))}
                  {selectedOrder.payments.some(p => p.method === 'CASH') && (
                    <span className="text-xs text-amber-600 font-medium">Collect cash on delivery</span>
                  )}
                </div>
              </div>
            )}

            {selectedOrder.customerPhone && (
              <a
                href={`tel:${selectedOrder.customerPhone}`}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 active:scale-95 transition-all"
              >
                <Phone size={20} />
                Call Customer
              </a>
            )}
          </div>

          {/* Order Items with Icons */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900">Order Items</h3>
              <span className="text-sm text-slate-500">
                {selectedOrder.itemCount || selectedOrder.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0} items
              </span>
            </div>
            <div className="space-y-3">
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
                  {/* Food Icon */}
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    {getFoodIcon(item.productName)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 truncate">{item.productName}</p>
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                        x{item.quantity}
                      </span>
                    </div>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <p className="text-sm text-slate-500 mt-1">{item.modifiers.join(', ')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order & Earnings Summary Card */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 shadow-lg text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Wallet size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">{isActive ? 'Your Earnings' : 'Order Total'}</h3>
                <p className="text-white/80 text-sm">{isActive ? 'This delivery' : 'Customer payment'}</p>
              </div>
            </div>
            
            {/* Order breakdown - visible for all orders */}
            {selectedOrder.subtotal !== undefined && (
              <div className="space-y-1 mb-4 pb-4 border-b border-white/20">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Subtotal</span>
                  <span className="font-medium">{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.taxAmount !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Tax</span>
                    <span className="font-medium">{formatCurrency(selectedOrder.taxAmount)}</span>
                  </div>
                )}
                {selectedOrder.discountAmount !== undefined && selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Discount</span>
                    <span className="font-medium text-yellow-300">-{formatCurrency(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Delivery Fee</span>
                  <span className="font-medium">{formatCurrency(selectedOrder.deliveryFee)}</span>
                </div>
                {selectedOrder.tip !== undefined && selectedOrder.tip > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Pre-paid Tip</span>
                    <span className="font-medium text-yellow-300">{formatCurrency(selectedOrder.tip)}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Driver earnings - only for active orders */}
            {isActive && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign size={16} className="text-white/70" />
                    <span className="text-sm text-white/70">Delivery Fee</span>
                  </div>
                  <p className="text-xl font-bold">{formatCurrency(selectedOrder.deliveryFee)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Star size={16} className="text-yellow-300" />
                    <span className="text-sm text-white/70">Tip</span>
                  </div>
                  <p className="text-xl font-bold text-yellow-300">{formatCurrency(selectedOrder.tip)}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-white/80">{isActive ? 'Total Earnings' : 'Order Total'}</span>
              <span className="text-2xl font-black">
                {isActive 
                  ? formatCurrency((selectedOrder.deliveryFee || 0) + (selectedOrder.tip || 0))
                  : formatCurrency(selectedOrder.total)
                }
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pb-8">
            {isAvailable && (
              <button
                onClick={() => acceptOrder(selectedOrder)}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                <Bike size={24} />
                Accept Delivery
              </button>
            )}

            {isActive && isMyOrder && selectedOrder.status === 'ACCEPTED' && (
              <button
                onClick={() => markPickedUp(selectedOrder)}
                className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold text-lg hover:bg-purple-700 active:scale-95 transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
              >
                <PackageCheck size={24} />
                Mark as Picked Up
              </button>
            )}

            {isActive && isMyOrder && selectedOrder.status === 'OUT_FOR_DELIVERY' && (
              <button
                onClick={() => markDelivered(selectedOrder)}
                className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold text-lg hover:bg-green-700 active:scale-95 transition-all shadow-lg shadow-green-500/25 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={24} />
                Mark as Delivered
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==================== RENDER: MAIN LIST VIEW ====================

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      
      {/* Tip Collection Modal */}
      <TipModal
        isOpen={showTipModal}
        onClose={() => {
          setShowTipModal(false);
          setPendingDeliveryOrder(null);
        }}
        onSubmit={handleDeliveryComplete}
        order={pendingDeliveryOrder}
        isSubmitting={isSubmittingTip}
      />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Bike className="text-white" size={20} />
              </div>
              <div>
                <h1 className="font-bold text-slate-900">Driver App</h1>
                <p className="text-xs text-slate-500">{driver.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Online/Offline Toggle */}
              <button
                onClick={() => isOnline ? handleGoOffline() : handleGoOnline()}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  isOnline 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                {isOnline ? 'Online' : 'Offline'}
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-full"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>

          {/* Today's Summary Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 mb-3 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-blue-400" />
                <span className="font-medium text-slate-300">Today's Summary</span>
              </div>
              <div className="flex items-center gap-1 text-yellow-400">
                <Award size={16} />
                <span className="text-sm font-bold">Level {Math.floor(stats.deliveries / 10) + 1}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Receipt size={14} className="text-blue-400" />
                  <span className="text-xs text-slate-400">Orders</span>
                </div>
                <p className="text-xl font-bold text-white">{stats.deliveries}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star size={14} className="text-yellow-400" />
                  <span className="text-xs text-slate-400">Tips</span>
                </div>
                <p className="text-xl font-bold text-yellow-400">{formatCurrency(stats.tips)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp size={14} className="text-green-400" />
                  <span className="text-xs text-slate-400">Total</span>
                </div>
                <p className="text-xl font-bold text-green-400">{formatCurrency(stats.total)}</p>
              </div>
            </div>
            
            {/* Progress bar to next level */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Progress to Level {Math.floor(stats.deliveries / 10) + 2}</span>
                <span>{stats.deliveries % 10}/10 deliveries</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${((stats.deliveries % 10) / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Location Status */}
          {locationPermission !== 'granted' && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={16} />
                <div className="flex-1">
                  <p className="text-sm text-yellow-800">
                    {locationError || 'Location access needed for navigation'}
                  </p>
                  <button
                    onClick={requestLocationPermission}
                    className="mt-2 text-sm font-bold text-yellow-700 underline"
                  >
                    Enable Location
                  </button>
                </div>
              </div>
            </div>
          )}

          {location && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <LocateFixed size={14} className="text-green-500" />
              <span>GPS Active</span>
              {location.accuracy && (
                <span className="text-slate-400">(±{Math.round(location.accuracy)}m)</span>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-t">
          {[
            { id: 'available', label: 'Available', count: availableOrders.length },
            { id: 'active', label: 'Active', count: activeOrders.length },
            { id: 'completed', label: 'Done', count: completedOrders.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 text-sm font-medium relative ${
                activeTab === tab.id 
                  ? 'text-blue-600' 
                  : 'text-slate-500'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="p-4">
        {/* Available Orders */}
        {activeTab === 'available' && (
          <div className="space-y-3">
            {availableOrders.length > 0 && (
              <div className="bg-white rounded-2xl p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (batchSelectionMode) {
                        clearBatchSelection();
                      } else {
                        setBatchSelectionMode(true);
                      }
                    }}
                    className={`px-3 py-2 rounded-xl text-sm font-bold ${
                      batchSelectionMode
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {batchSelectionMode ? 'Cancel Multi-Assign' : 'Assign Multiple'}
                  </button>

                  {batchSelectionMode && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        {selectedAvailableOrderIds.length} selected
                      </span>
                      <button
                        onClick={acceptSelectedOrders}
                        disabled={selectedAvailableOrderIds.length === 0}
                        className="px-3 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white disabled:opacity-50"
                      >
                        Assign Selected
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {availableOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PackageCheck className="text-slate-400" size={32} />
                </div>
                <p className="text-slate-500 font-medium">No available deliveries</p>
                <p className="text-sm text-slate-400">New orders will appear here</p>
              </div>
            ) : (
              availableOrders.map((order) => (
                <button
                  key={order.orderId}
                  onClick={() => {
                    if (batchSelectionMode) {
                      toggleSelectAvailableOrder(order.orderId);
                    } else {
                      setSelectedOrder(order);
                    }
                  }}
                  className={`w-full bg-white rounded-2xl p-4 shadow-sm text-left active:scale-[0.98] transition-transform border-2 ${
                    batchSelectionMode && selectedAvailableOrderIds.includes(order.orderId)
                      ? 'border-blue-500'
                      : 'border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        #{order.tokenNumber || order.orderNumber || order.orderId.slice(-6)}
                      </p>
                      <p className="text-slate-500 text-sm">
                        {order.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0} items • {formatCurrency(order.total)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      {batchSelectionMode && (
                        <div className={`mb-1 w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                          selectedAvailableOrderIds.includes(order.orderId)
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 text-transparent'
                        }`}>
                          <Check size={14} />
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-green-600 font-bold text-lg">
                        {formatCurrency((order.deliveryFee || 0) + (order.tip || 0))}
                        <ChevronRight size={20} />
                      </div>
                      {order.tip && order.tip > 0 && (
                        <span className="text-xs text-yellow-600 flex items-center gap-0.5">
                          <Star size={10} className="fill-yellow-500" />
                          Tip: {formatCurrency(order.tip)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Food Icons Preview */}
                  {order.items && order.items.length > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex -space-x-2">
                        {order.items.slice(0, 4).map((item, idx) => (
                          <div 
                            key={idx} 
                            className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center border-2 border-white"
                            style={{ zIndex: 4 - idx }}
                          >
                            {React.cloneElement(getFoodIcon(item.productName) as React.ReactElement, { size: 14 })}
                          </div>
                        ))}
                        {order.items.length > 4 && (
                          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center border-2 border-white text-xs font-bold text-slate-600">
                            +{order.items.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Route size={16} />
                      {formatDistance(order.estimatedDistance)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      {formatTime(order.estimatedTime)}
                    </div>
                  </div>

                  {order.address && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-sm text-slate-600 truncate">
                        {order.address.street}
                      </p>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        )}

        {/* Active Orders */}
        {activeTab === 'active' && (
          <div className="space-y-3">
            {activeOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bike className="text-slate-400" size={32} />
                </div>
                <p className="text-slate-500 font-medium">No active deliveries</p>
                <p className="text-sm text-slate-400">Accept an order to get started</p>
              </div>
            ) : (
              activeOrders.map((order) => (
                <button
                  key={order.orderId}
                  onClick={() => setSelectedOrder(order)}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm text-left active:scale-[0.98] transition-transform border-2 border-blue-500"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        #{order.tokenNumber || order.orderNumber || order.orderId.slice(-6)}
                      </p>
                      <p className="text-blue-600 font-medium text-sm">
                        {order.status === 'ACCEPTED' ? 'Head to restaurant' : 'Out for delivery'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-1">
                        <Navigation className="text-blue-600" size={20} />
                      </div>
                      <span className="text-sm font-bold text-green-600">
                        {formatCurrency((order.deliveryFee || 0) + (order.tip || 0))}
                      </span>
                    </div>
                  </div>

                  {/* Food Icons Preview */}
                  {order.items && order.items.length > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex -space-x-2">
                        {order.items.slice(0, 4).map((item, idx) => (
                          <div 
                            key={idx} 
                            className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center border-2 border-white"
                            style={{ zIndex: 4 - idx }}
                          >
                            {React.cloneElement(getFoodIcon(item.productName) as React.ReactElement, { size: 14 })}
                          </div>
                        ))}
                        {order.items.length > 4 && (
                          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center border-2 border-white text-xs font-bold text-slate-600">
                            +{order.items.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {order.address && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl">
                      <p className="font-medium text-slate-900">{order.address.street}</p>
                      <p className="text-sm text-slate-500">
                        {order.address.city}, {order.address.state}
                      </p>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        )}

        {/* Completed Orders */}
        {activeTab === 'completed' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="text-slate-400" size={32} />
            </div>
            <p className="text-slate-500 font-medium">No completed deliveries yet</p>
            <p className="text-sm text-slate-400">Delivered orders will appear here</p>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Settings</h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-slate-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500">Driver Name</p>
                <p className="font-bold text-slate-900">{driver.name}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500">Driver ID</p>
                <p className="font-bold text-slate-900">{driver.id}</p>
              </div>

              {driver.vehicleType && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Vehicle</p>
                  <p className="font-bold text-slate-900">{driver.vehicleType}</p>
                </div>
              )}

              {driver.licensePlate && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">License Plate</p>
                  <p className="font-bold text-slate-900">{driver.licensePlate}</p>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

