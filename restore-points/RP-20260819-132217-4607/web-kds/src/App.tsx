import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Bell, Clock, CheckCircle, Flame, Volume2, VolumeX, ChefHat, Timer, Zap, RefreshCw, X, AlertCircle, Info, PackageCheck, Pizza, Soup, CircleDot, Wheat, UtensilsCrossed, ChevronRight, ChevronUp, ChevronDown, Plus, Leaf, ShieldCheck } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  sizeName?: string;
  modifiers?: any;
  addons?: any;
  notes?: string;
  kitchenStation: string;
}

interface Order {
  id: string;
  orderNumber: string;
  tokenNumber?: string;
  type: 'DINE_IN' | 'PICKUP' | 'DELIVERY';
  tableNumber?: string;
  customerName?: string;
  status: 'CREATED' | 'CONFIRMED' | 'PAID' | 'PENDING' | 'IN_PROGRESS' | 'IN_OVEN';
  items: OrderItem[];
  createdAt: string;
  scheduledFor?: string;
  elapsedTime: number;
  ovenTime?: number;
  ovenDuration?: number;
}

// Toast notification types
type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const normalizeKdsStatus = (rawStatus?: string): Order['status'] => {
  const status = String(rawStatus || '').toUpperCase();
  const map: Record<string, Order['status']> = {
    PENDING: 'PENDING',
    CREATED: 'PENDING',
    CONFIRMED: 'PENDING',
    PAID: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    PREPARING: 'IN_PROGRESS',
    IN_KITCHEN: 'IN_PROGRESS',
    BAKING: 'IN_OVEN',
    IN_OVEN: 'IN_OVEN',
  };
  return map[status] || 'PENDING';
};

const isTerminalKdsLifecycle = (rawStatus?: string) => {
  const status = String(rawStatus || '').toUpperCase();
  return [
    'PREPARED',
    'ASSEMBLED',
    'PACKED',
    'READY_FOR_PICKUP',
    'READY_TO_SERVE',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
    'REFUNDED',
  ].includes(status);
};

const KDS_COLORS = {
  PENDING: 'border-yellow-500 bg-yellow-500/10',
  IN_PROGRESS: 'border-blue-500 bg-blue-500/10',
  IN_OVEN: 'border-orange-500 bg-orange-500/10',
};

const STATION_NAMES: Record<string, string> = {
  PIZZA: '🍕 Pizza Station',
  FRYER: '🍟 Fryer',
  SANDWICH: '🥪 Sandwich',
  DRINKS: '🥤 Drinks',
  DESSERT: '🍰 Dessert',
  SALAD: '🥗 Salad',
  GRILL: '🥩 Grill',
  GENERAL: '🔥 General',
  TANDOOR: '🫓 Tandoor',
};

// Estimated cook times by station (in minutes)
const COOK_TIMES: Record<string, number> = {
  PIZZA: 7,
  TANDOOR: 8,
  FRYER: 4,
  GRILL: 10,
  GENERAL: 5,
  SANDWICH: 3,
  DEFAULT: 7,
};

type KitchenDetailLine = {
  label: string;
  value: string;
  tone?: 'default' | 'size' | 'crust' | 'sauce' | 'cheese' | 'topping' | 'meat' | 'left' | 'right' | 'note';
};

type ToppingGroup = {
  title: string;
  subtitle: string;
  tone: KitchenDetailLine['tone'];
  layout: 'full' | 'half';
  items: Array<{ name: string; amount: string }>;
};

const titleCase = (value: string) =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const kitchenAmountLabel = (value?: string) => {
  const normalized = String(value || 'REGULAR').toUpperCase();
  if (normalized === 'LIGHT') return 'Light';
  if (normalized === 'EXTRA') return 'Extra';
  return 'Regular';
};

const kitchenPlacementLabel = (value?: string) => {
  const normalized = String(value || 'FULL').toUpperCase();
  if (normalized === 'LEFT') return 'Left';
  if (normalized === 'RIGHT') return 'Right';
  return 'Whole';
};

const normalizeDetailText = (value: unknown): string => {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(normalizeDetailText).filter(Boolean).join(', ');
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, any>;
    const name = obj.name || obj.label || obj.modifierName || obj.optionName || obj.productName || obj.value;
    if (name) return String(name);
    return Object.entries(obj)
      .filter(([key]) => !['id', 'price', 'optionId', 'modifierId', 'addonId'].includes(key))
      .map(([key, val]) => `${titleCase(key)}: ${normalizeDetailText(val)}`)
      .filter((part) => !part.endsWith(': '))
      .join(', ');
  }
  return String(value);
};

const pushUniqueLine = (lines: KitchenDetailLine[], line: KitchenDetailLine) => {
  if (!line.value.trim()) return;
  const key = `${line.label}:${line.value}`.toLowerCase();
  if (lines.some((existing) => `${existing.label}:${existing.value}`.toLowerCase() === key)) return;
  lines.push(line);
};

const formatModifierObject = (modifier: any): KitchenDetailLine | null => {
  if (typeof modifier === 'string') {
    const [label, ...rest] = modifier.split(':');
    if (rest.length) {
      const cleanLabel = label.trim();
      const lowerLabel = cleanLabel.toLowerCase();
      return {
        label: cleanLabel,
        value: rest.join(':').trim(),
        tone:
          lowerLabel.includes('sauce') ? 'sauce' :
          lowerLabel.includes('cheese') ? 'cheese' :
          lowerLabel.includes('crust') || lowerLabel.includes('bread') || lowerLabel.includes('pasta') ? 'crust' :
          lowerLabel.includes('meat') || lowerLabel.includes('protein') ? 'meat' :
          lowerLabel.includes('veggie') || lowerLabel.includes('topping') || lowerLabel.includes('add-on') ? 'topping' :
          'default',
      };
    }
    const placementMatch = modifier.match(/\((left|right|full|whole)\)\s*$/i);
    if (placementMatch) {
      const placement = placementMatch[1].toUpperCase() === 'FULL' ? 'Whole' : kitchenPlacementLabel(placementMatch[1]);
      const value = modifier.replace(/\s*\((left|right|full|whole)\)\s*$/i, '').trim();
      return {
        label: placement === 'Left' ? 'Left Side' : placement === 'Right' ? 'Right Side' : 'Whole',
        value,
        tone: placement === 'Left' ? 'left' : placement === 'Right' ? 'right' : 'topping',
      };
    }
    return { label: 'Option', value: modifier, tone: 'default' };
  }

  if (!modifier || typeof modifier !== 'object') return null;

  const rawName = modifier.name || modifier.label || modifier.modifierName || modifier.optionName || modifier.value;
  if (rawName && typeof rawName === 'string' && rawName.includes(':')) {
    const [label, ...rest] = rawName.split(':');
    return { label: label.trim(), value: rest.join(':').trim(), tone: 'default' };
  }
  if (rawName && typeof rawName === 'string') {
    const placementMatch = rawName.match(/\((left|right|full|whole)\)\s*$/i);
    if (placementMatch) {
      const placement = placementMatch[1].toUpperCase() === 'FULL' ? 'Whole' : kitchenPlacementLabel(placementMatch[1]);
      const value = rawName.replace(/\s*\((left|right|full|whole)\)\s*$/i, '').trim();
      return {
        label: placement === 'Left' ? 'Left Side' : placement === 'Right' ? 'Right Side' : 'Whole',
        value,
        tone: placement === 'Left' ? 'left' : placement === 'Right' ? 'right' : 'topping',
      };
    }
  }

  const label = modifier.modifierName || modifier.groupName || modifier.category || modifier.type || 'Option';
  const parts = [
    rawName,
    modifier.placement ? kitchenPlacementLabel(modifier.placement) : null,
    modifier.side ? kitchenPlacementLabel(modifier.side) : null,
    modifier.amount ? kitchenAmountLabel(modifier.amount) : null,
  ].filter(Boolean);

  return {
    label: titleCase(String(label)),
    value: parts.length ? parts.join(' - ') : normalizeDetailText(modifier),
    tone: /sauce/i.test(String(label)) ? 'sauce' : /cheese/i.test(String(label)) ? 'cheese' : /meat|protein/i.test(String(label)) ? 'meat' : 'default',
  };
};

const getSelectedNames = (ids: unknown, lookup: Map<string, string>, amounts?: Record<string, string>, sides?: Record<string, string>) => {
  if (!Array.isArray(ids)) return [];
  return ids.map((id) => {
    const key = String(id);
    const name = lookup.get(key) || titleCase(key);
    const amount = amounts?.[key];
    const side = sides?.[key];
    const prefix = amount && amount !== 'REGULAR' ? `${kitchenAmountLabel(amount)} ` : '';
    const suffix = side && side !== 'FULL' ? ` (${kitchenPlacementLabel(side)})` : '';
    return `${prefix}${name}${suffix}`;
  });
};

const normalizePizzaToppingDetailLines = (item: OrderItem, lines: KitchenDetailLine[]) => {
  if (!item.productName.toLowerCase().includes('pizza')) return lines;

  return lines.map((line) => {
    const amountLabel = line.label.trim().toUpperCase();
    if (!['LIGHT', 'REGULAR', 'EXTRA'].includes(amountLabel)) return line;
    return {
      label: 'Whole',
      value: `${amountLabel === 'REGULAR' ? '' : `${kitchenAmountLabel(amountLabel)} `}${line.value}`.trim(),
      tone: 'topping' as const,
    };
  });
};

// Re-parse generic "Option" lines whose values carry the real structure,
// e.g. "Crust: Hand Tossed" or "Light Mushrooms (Left)" from string addons.
const reparseOptionDetailLine = (line: KitchenDetailLine): KitchenDetailLine => {
  if (line.label !== 'Option') return line;
  const value = line.value.trim();

  const colonMatch = value.match(/^([^:()]+):\s*(.+)$/);
  if (colonMatch) {
    const cleanLabel = colonMatch[1].trim();
    const lowerLabel = cleanLabel.toLowerCase();
    return {
      label: titleCase(cleanLabel),
      value: colonMatch[2].trim(),
      tone:
        lowerLabel.includes('sauce') ? 'sauce' :
        lowerLabel.includes('cheese') ? 'cheese' :
        lowerLabel.includes('crust') || lowerLabel.includes('bread') || lowerLabel.includes('pasta') ? 'crust' :
        lowerLabel.includes('meat') || lowerLabel.includes('protein') ? 'meat' :
        lowerLabel.includes('veggie') || lowerLabel.includes('topping') || lowerLabel.includes('add-on') ? 'topping' :
        'default',
    };
  }

  const placementMatch = value.match(/\((left|right|full|whole)\)\s*$/i);
  if (placementMatch) {
    const placement = placementMatch[1].toUpperCase() === 'FULL' ? 'Whole' : kitchenPlacementLabel(placementMatch[1]);
    const cleanValue = value.replace(/\s*\((left|right|full|whole)\)\s*$/i, '').trim();
    return {
      label: placement === 'Left' ? 'Left Side' : placement === 'Right' ? 'Right Side' : 'Whole',
      value: cleanValue,
      tone: placement === 'Left' ? 'left' : placement === 'Right' ? 'right' : 'topping',
    };
  }

  return line;
};

const getKitchenDetailLines = (item: OrderItem): KitchenDetailLine[] => {
  const lines: KitchenDetailLine[] = [];
  if (item.sizeName) pushUniqueLine(lines, { label: 'Size', value: item.sizeName, tone: 'size' });

  const modifierList = Array.isArray(item.modifiers) ? item.modifiers : item.modifiers ? [item.modifiers] : [];
  modifierList.forEach((modifier) => {
    const line = formatModifierObject(modifier);
    if (line) pushUniqueLine(lines, line);
  });

  const addons = Array.isArray(item.addons) ? item.addons : item.addons ? [item.addons] : [];
  addons.forEach((addon) => {
    if (!addon || typeof addon !== 'object') {
      pushUniqueLine(lines, { label: 'Option', value: normalizeDetailText(addon) });
      return;
    }

    const lookup = new Map<string, string>();
    const setAddons = Array.isArray(addon.setAddons) ? addon.setAddons : Array.isArray(addon.addons) ? addon.addons : [];
    setAddons.forEach((entry: any) => {
      const child = entry?.addon || entry;
      if (child?.id) lookup.set(String(child.id), child.name || child.label || titleCase(String(child.id)));
      if (entry?.id) lookup.set(String(entry.id), child?.name || entry.name || entry.label || titleCase(String(entry.id)));
    });

    if (addon.selections && typeof addon.selections === 'object') {
      Object.entries(addon.selections).forEach(([key, value]) => {
        if (!Array.isArray(value) || value.length === 0) return;
        const label = titleCase(key.replace(/^sub/i, '').replace(/^wing/i, 'Wing '));
        const names = getSelectedNames(value, lookup, addon.toppingAmounts, addon.toppingSides);
        const tone = /sauce/i.test(key) ? 'sauce' : /cheese/i.test(key) ? 'cheese' : /topping|fixing|veggie|meat/i.test(key) ? 'topping' : 'default';
        pushUniqueLine(lines, { label, value: names.join(', '), tone });
      });
    }

    if (addon.toppingSides && typeof addon.toppingSides === 'object') {
      const ids = new Set<string>();
      Object.keys(addon.toppingSides).forEach((key) => ids.add(key));
      Object.keys(addon.toppingAmounts || {}).forEach((key) => ids.add(key));
      if (ids.size) {
        const names = Array.from(ids).map((id) => {
          const name = lookup.get(id) || titleCase(id);
          const amount = addon.toppingAmounts?.[id] || 'REGULAR';
          const side = addon.toppingSides?.[id] || 'FULL';
          return `${amount !== 'REGULAR' ? `${kitchenAmountLabel(amount)} ` : ''}${name} (${kitchenPlacementLabel(side)})`;
        });
        pushUniqueLine(lines, { label: 'Toppings', value: names.join(', '), tone: 'topping' });
      }
    }

    const fallbackLine = formatModifierObject(addon);
    if (fallbackLine) pushUniqueLine(lines, fallbackLine);
  });

  const lowerName = item.productName.toLowerCase();
  if (lines.length === 0 && lowerName.includes('build your own pizza')) {
    pushUniqueLine(lines, { label: 'Crust', value: 'Hand Tossed' });
    pushUniqueLine(lines, { label: 'Sauce', value: 'Classic Tomato - Regular', tone: 'sauce' });
    pushUniqueLine(lines, { label: 'Cheese', value: 'Mozzarella - Whole - Regular', tone: 'cheese' });
  }

  return normalizePizzaToppingDetailLines(item, lines.map(reparseOptionDetailLine));
};

const normalizeKdsOrder = (raw: any): Order => {
  const order = raw?.order || raw?.data?.order || raw?.data || raw;
  const normalizedStatus = normalizeKdsStatus(order?.status);
  return {
    id: order?.id,
    orderNumber: order?.orderNumber,
    tokenNumber: order?.tokenNumber,
    type: order?.type || 'DINE_IN',
    tableNumber: order?.tableNumber,
    customerName: order?.customerName,
    status: normalizedStatus,
    scheduledFor: order?.scheduledFor,
    items: order?.items?.map((item: any) => ({
      id: item.id,
      productName: item.productName,
      sizeName: item.sizeName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      modifiers: item.modifiers,
      addons: item.addons,
      notes: item.notes,
      kitchenStation: item.kitchenStation || 'GENERAL',
    })) || [],
    createdAt: order?.createdAt || new Date().toISOString(),
    elapsedTime: 0,
    ovenTime: order?.ovenTime,
    ovenDuration: order?.ovenDuration,
  };
};

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
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 300); // Wait for exit animation
    }, 3000);
    
    return () => {
      clearTimeout(exitTimer);
    };
  }, [toast.id, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
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

function getDetailStyle(tone?: KitchenDetailLine['tone']) {
  switch (tone) {
    case 'size':
      return {
        row: 'border-blue-500/35 bg-gradient-to-r from-blue-500/15 to-blue-500/5 text-blue-50',
        rail: 'bg-blue-500',
        icon: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        label: 'text-blue-300',
      };
    case 'crust':
      return {
        row: 'border-orange-500/35 bg-gradient-to-r from-orange-500/15 to-orange-500/5 text-orange-50',
        rail: 'bg-orange-500',
        icon: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
        label: 'text-orange-300',
      };
    case 'sauce':
      return {
        row: 'border-red-500/35 bg-gradient-to-r from-red-500/15 to-red-500/5 text-red-50',
        rail: 'bg-red-500',
        icon: 'bg-red-500/20 text-red-300 border-red-500/40',
        label: 'text-red-300',
      };
    case 'cheese':
      return {
        row: 'border-yellow-500/35 bg-gradient-to-r from-yellow-500/15 to-yellow-500/5 text-yellow-50',
        rail: 'bg-yellow-500',
        icon: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/40',
        label: 'text-yellow-300',
      };
    case 'meat':
      return {
        row: 'border-rose-500/35 bg-gradient-to-r from-rose-500/15 to-rose-500/5 text-rose-50',
        rail: 'bg-rose-500',
        icon: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        label: 'text-rose-300',
      };
    case 'left':
      return {
        row: 'border-emerald-500/35 bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 text-emerald-50',
        rail: 'bg-emerald-500',
        icon: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        label: 'text-emerald-300',
      };
    case 'right':
      return {
        row: 'border-blue-500/35 bg-gradient-to-r from-blue-500/15 to-blue-500/5 text-blue-50',
        rail: 'bg-blue-500',
        icon: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        label: 'text-blue-300',
      };
    case 'topping':
      return {
        row: 'border-purple-500/35 bg-gradient-to-r from-purple-500/15 to-purple-500/5 text-purple-50',
        rail: 'bg-purple-500',
        icon: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        label: 'text-purple-300',
      };
    default:
      return {
        row: 'border-slate-500/30 bg-gradient-to-r from-slate-500/15 to-slate-500/5 text-slate-50',
        rail: 'bg-slate-500',
        icon: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
        label: 'text-slate-300',
      };
  }
}

function DetailIcon({ tone }: { tone?: KitchenDetailLine['tone'] }) {
  const cls = 'h-6 w-6';
  if (tone === 'crust') return <Pizza className={cls} />;
  if (tone === 'sauce') return <Soup className={cls} />;
  if (tone === 'cheese') return <CircleDot className={cls} />;
  if (tone === 'meat') return <UtensilsCrossed className={cls} />;
  if (tone === 'left' || tone === 'right' || tone === 'topping') return <Pizza className={cls} />;
  return <Wheat className={cls} />;
}

const splitKitchenValues = (value: string) =>
  value.split(',').map((part) => part.trim()).filter(Boolean);

const parseKitchenIngredient = (raw: string) => {
  const withoutSide = raw.replace(/\s*\((left|right|full|whole)\)\s*$/i, '').trim();
  const amountMatch = withoutSide.match(/^(Light|Extra|Regular)\s+(.+)$/i);
  if (amountMatch) {
    return { name: amountMatch[2].trim(), amount: titleCase(amountMatch[1]) };
  }
  return { name: withoutSide, amount: 'Regular' };
};

const findDetail = (details: KitchenDetailLine[], labels: string[]) => {
  const wanted = labels.map((label) => label.toLowerCase());
  return details.find((detail) => wanted.includes(detail.label.toLowerCase()));
};

const buildToppingGroups = (details: KitchenDetailLine[]) => {
  const config: Record<string, Omit<ToppingGroup, 'items'>> = {
    whole: { title: 'Whole Pizza', subtitle: 'Toppings applied to the entire pizza', tone: 'topping', layout: 'full' },
    'left side': { title: 'Left Half', subtitle: 'Toppings on the left half', tone: 'left', layout: 'half' },
    'right side': { title: 'Right Half', subtitle: 'Toppings on the right half', tone: 'right', layout: 'half' },
    toppings: { title: 'Toppings', subtitle: 'Selected toppings and add-ons', tone: 'topping', layout: 'full' },
    veggies: { title: 'Veggies', subtitle: 'Vegetable fixings', tone: 'left', layout: 'half' },
    'add-ons': { title: 'Add-ons', subtitle: 'Additional ingredients', tone: 'topping', layout: 'full' },
    meats: { title: 'Meats', subtitle: 'Selected proteins', tone: 'meat', layout: 'half' },
    proteins: { title: 'Proteins', subtitle: 'Selected proteins', tone: 'meat', layout: 'half' },
  };

  const groups = details.reduce<ToppingGroup[]>((acc, detail) => {
    const key = detail.label.toLowerCase();
    const groupConfig = config[key];
    if (!groupConfig) return acc;
    const existing = acc.find((group) => group.title === groupConfig.title);
    const items = splitKitchenValues(detail.value).map(parseKitchenIngredient);
    if (existing) {
      existing.items.push(...items);
    } else {
      acc.push({ ...groupConfig, items });
    }
    return acc;
  }, []);

  const order: Record<string, number> = {
    'Whole Pizza': 0,
    'Left Half': 1,
    'Right Half': 2,
  };

  return groups.sort((a, b) => (order[a.title] ?? 10) - (order[b.title] ?? 10));
};

const isPrimaryDetail = (detail: KitchenDetailLine) => {
  const key = detail.label.toLowerCase();
  return ['size', 'crust', 'bread', 'pasta', 'sauce', 'sauces', 'cheese'].includes(key);
};

const isToppingDetail = (detail: KitchenDetailLine) => {
  const key = detail.label.toLowerCase();
  return ['whole', 'left side', 'right side', 'toppings', 'veggies', 'add-ons', 'meats', 'proteins'].includes(key);
};

const normalizeIngredientName = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '');

const getIngredientCategory = (name: string): 'meat' | 'vegetable' | 'cheese' | 'sauce' | 'other' => {
  const normalized = normalizeIngredientName(name);
  if (/\b(pepperoni|sausage|bacon|ham|beef|chicken|steak|salami|meatball|turkey|anchovy|prosciutto)\b/.test(normalized)) {
    return 'meat';
  }
  if (/\b(mushroom|pepper|onion|tomato|spinach|jalapeno|olive|pineapple|broccoli|basil|garlic|corn|banana pepper)\b/.test(normalized)) {
    return 'vegetable';
  }
  if (/\b(cheese|mozzarella|parmesan|cheddar|feta|provolone|ricotta)\b/.test(normalized)) {
    return 'cheese';
  }
  if (/\b(sauce|alfredo|bbq|pesto|buffalo|ranch|marinara)\b/.test(normalized)) {
    return 'sauce';
  }
  return 'other';
};

const getIngredientPillClass = (name: string) => {
  const normalized = normalizeIngredientName(name);
  const has = (...terms: string[]) => terms.some((term) => normalized.includes(term));

  // Meats - warm red / brown tones
  if (has('pepperoni')) return 'bg-gradient-to-br from-red-700 to-orange-900 text-white border-red-900/50';
  if (has('italian sausage')) return 'bg-gradient-to-br from-orange-700 to-amber-900 text-white border-orange-900/50';
  if (has('sausage')) return 'bg-gradient-to-br from-orange-700 to-red-900 text-white border-orange-900/50';
  if (has('ham')) return 'bg-gradient-to-br from-rose-500 to-red-800 text-white border-rose-800/50';
  if (has('bacon')) return 'bg-gradient-to-br from-orange-600 to-red-900 text-white border-red-900/50';
  if (has('chicken')) return 'bg-gradient-to-br from-orange-500 to-amber-800 text-white border-amber-900/50';
  if (has('ground beef', 'beef', 'meatball', 'steak')) return 'bg-gradient-to-br from-amber-900 to-red-950 text-white border-red-950/50';

  // Vegetables - fresh green tones
  if (has('green pepper', 'green peper', 'bell pepper')) return 'bg-gradient-to-br from-green-600 to-emerald-900 text-white border-green-900/50';
  if (has('spinach', 'basil')) return 'bg-gradient-to-br from-green-700 to-lime-950 text-white border-green-950/50';
  if (has('jalapeno', 'jalapenos')) return 'bg-gradient-to-br from-lime-700 to-green-950 text-white border-green-950/50';
  if (has('onion')) return 'bg-gradient-to-br from-lime-600 to-emerald-900 text-white border-emerald-900/50';
  if (has('mushroom')) return 'bg-gradient-to-br from-lime-800 to-green-950 text-white border-green-950/50';
  if (has('tomato')) return 'bg-gradient-to-br from-red-600 to-orange-900 text-white border-red-900/50';
  if (has('black olive')) return 'bg-gradient-to-br from-neutral-800 to-black text-white border-black/50';
  if (has('olive')) return 'bg-gradient-to-br from-lime-700 to-green-950 text-white border-green-950/50';
  if (has('banana pepper')) return 'bg-gradient-to-br from-yellow-500 to-lime-700 text-white border-lime-800/50';
  if (has('pineapple')) return 'bg-gradient-to-br from-yellow-500 to-amber-700 text-white border-amber-800/50';
  if (has('garlic')) return 'bg-gradient-to-br from-stone-300 to-stone-600 text-white border-stone-700/50';

  // Cheeses - golden / yellow tones
  if (has('extra cheese', 'mozzarella', 'parmesan', 'cheddar', 'four cheese', 'feta', 'provolone', 'ricotta')) {
    return 'bg-gradient-to-br from-yellow-400 to-amber-700 text-white border-amber-800/50';
  }

  // Sauces - natural sauce colors
  if (has('alfredo')) return 'bg-gradient-to-br from-stone-300 to-stone-500 text-white border-stone-600/50';
  if (has('bbq')) return 'bg-gradient-to-br from-red-950 to-amber-950 text-white border-red-950/50';
  if (has('pesto')) return 'bg-gradient-to-br from-lime-700 to-green-950 text-white border-green-950/50';
  if (has('buffalo')) return 'bg-gradient-to-br from-orange-600 to-red-900 text-white border-red-900/50';
  if (has('classic tomato', 'pizza sauce', 'marinara')) return 'bg-gradient-to-br from-red-700 to-red-950 text-white border-red-950/50';
  if (has('ranch')) return 'bg-gradient-to-br from-slate-200 to-slate-500 text-white border-slate-600/50';

  // Fallback by category
  const category = getIngredientCategory(name);
  if (category === 'meat') return 'bg-gradient-to-br from-red-700 to-orange-900 text-white border-red-900/50';
  if (category === 'vegetable') return 'bg-gradient-to-br from-emerald-600 to-green-950 text-white border-green-950/50';
  if (category === 'cheese') return 'bg-gradient-to-br from-yellow-400 to-amber-700 text-white border-amber-800/50';
  if (category === 'sauce') return 'bg-gradient-to-br from-rose-700 to-red-950 text-white border-red-950/50';
  return 'bg-gradient-to-br from-slate-600 to-slate-800 text-white border-slate-900/50';
};

function SummaryTile({ detail }: { detail: KitchenDetailLine }) {
  const style = getDetailStyle(detail.tone);
  return (
    <div className={`rounded-lg border ${style.row} px-3 py-2`}>
      <div className="min-w-0">
        <div className={`text-[10px] font-black uppercase tracking-wide ${style.label}`}>{detail.label}</div>
        <div className="break-words text-sm font-black leading-tight text-white">{detail.value}</div>
      </div>
    </div>
  );
}

function ToppingSection({ group, className }: { group: ToppingGroup; className?: string }) {
  const isFullWidth = group.layout === 'full';
  const panelClass =
    group.tone === 'left'
      ? 'border-emerald-500/70 bg-cyan-950/80'
      : group.tone === 'right'
      ? 'border-blue-500/70 bg-cyan-950/80'
      : group.tone === 'meat'
      ? 'border-rose-500/70 bg-slate-950/80'
      : group.tone === 'topping'
      ? 'border-purple-500/70 bg-slate-950/80'
      : 'border-slate-500/70 bg-slate-950/80';
  const headerClass =
    group.tone === 'left'
      ? 'bg-emerald-700 text-white'
      : group.tone === 'right'
      ? 'bg-blue-700 text-white'
      : group.tone === 'meat'
      ? 'bg-rose-700 text-white'
      : group.tone === 'topping'
      ? 'bg-purple-700 text-white'
      : 'bg-slate-700 text-white';

  if (isFullWidth) {
    return (
      <div className={`w-full rounded-lg border border-cyan-700/70 bg-cyan-950/80 px-3 py-3 ${className || ''}`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="shrink-0 text-sm font-black uppercase text-white">Toppings:</div>
          <div className="flex min-w-0 flex-1 flex-wrap gap-2">
            {group.items.map((ingredient, idx) => (
              <div key={`${ingredient.name}-${idx}`} className={`max-w-full rounded-sm border-2 px-3 py-2 shadow-sm ${getIngredientPillClass(ingredient.name)}`}>
                <div className="break-words text-sm font-black leading-tight">{ingredient.name}</div>
                {ingredient.amount !== 'Regular' && <div className="mt-0.5 break-words text-xs font-semibold">{ingredient.amount}</div>}
              </div>
            ))}
          </div>
          <div className="shrink-0 rounded-sm bg-cyan-900/80 px-2 py-1 text-xs font-black text-white">{group.items.length}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-[180px] rounded-lg border-2 p-2 ${panelClass} ${className || ''}`}>
      <div className={`flex items-center justify-between rounded-sm border border-slate-950/70 px-3 py-2 ${headerClass}`}>
        <div className="break-words text-sm font-black leading-tight">{group.title}</div>
        <div className="shrink-0 text-xs font-black">{group.items.length}</div>
      </div>
      <div className="mt-3 flex flex-wrap content-start gap-2">
        {group.items.map((ingredient, idx) => (
          <div key={`${ingredient.name}-${idx}`} className={`max-w-full rounded-sm border-2 px-3 py-2 shadow-sm ${getIngredientPillClass(ingredient.name)}`}>
            <div className="break-words text-sm font-black leading-tight">{ingredient.name}</div>
            {ingredient.amount !== 'Regular' && <div className="mt-0.5 break-words text-xs font-semibold">{ingredient.amount}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function KitchenItemCard({ item }: { item: OrderItem }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const details = getKitchenDetailLines(item);
  const unitPrice = Number(item.totalPrice ?? item.unitPrice ?? 0);
  const size = findDetail(details, ['Size']);
  const crust = findDetail(details, ['Crust', 'Bread', 'Pasta']);
  const sauce = findDetail(details, ['Sauce', 'Sauces']);
  const cheese = findDetail(details, ['Cheese']);
  const summaryDetails = [size, crust, sauce, cheese].filter(Boolean) as KitchenDetailLine[];
  const toppingGroups = buildToppingGroups(details);
  const fullToppingGroups = toppingGroups.filter((group) => group.layout === 'full');
  const sideToppingGroups = toppingGroups.filter((group) => group.layout === 'half');
  const otherDetails = details.filter((detail) => !isPrimaryDetail(detail) && !isToppingDetail(detail));

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-500/30 bg-slate-950/55 p-3 shadow-xl">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-[180px] flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-black text-white text-xl tabular-nums">{item.quantity || 1}x</span>
            <span className="min-w-0 break-words text-white font-black text-xl leading-tight tracking-normal">{item.productName.replace(/\s+-\s+.+$/, '')}</span>
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {unitPrice > 0 && (
            <div className="text-right text-xl font-black text-white">${unitPrice.toFixed(2)}</div>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse item details' : 'Expand item details'}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white transition-colors hover:bg-slate-800"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {summaryDetails.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-2 2xl:grid-cols-2">
              {summaryDetails.map((detail) => (
                <SummaryTile key={detail.label} detail={detail} />
              ))}
            </div>
          )}

          {toppingGroups.length > 0 && (
            <div className="mt-3 rounded-xl border border-slate-600/40 bg-slate-900/55 p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-black uppercase text-slate-200">Toppings</div>
              </div>
              <div className="space-y-4">
                {fullToppingGroups.map((group) => (
                  <ToppingSection key={group.title} group={group} />
                ))}
                {sideToppingGroups.length > 0 && (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {sideToppingGroups.map((group) => (
                      <ToppingSection key={group.title} group={group} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {otherDetails.length > 0 && (
            <div className="mt-4 rounded-xl border border-orange-500/25 bg-orange-500/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-black uppercase text-orange-300">Other Details</div>
                  <div className="text-sm font-semibold text-slate-300">Finishing touches</div>
                </div>
                <ChevronRight className="h-6 w-6 text-orange-300" />
              </div>
              <div className="mt-4 grid gap-3">
                {otherDetails.map((detail) => (
                  <div key={`${detail.label}-${detail.value}`} className="border-r border-orange-500/20 pr-3 last:border-r-0">
                    <div className="break-words text-sm font-black text-white">{detail.label}</div>
                    <div className="break-words text-sm font-semibold text-slate-300">{detail.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {details.length === 0 && (
            <div className="mt-4 rounded-xl border border-slate-600/30 bg-slate-900/60 px-4 py-3 text-lg font-semibold text-slate-300">
              No custom options
            </div>
          )}

          {item.notes && (
            <div className="mt-4 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-xl font-bold text-orange-200">
              Special instructions: {item.notes}
            </div>
          )}
        </>
      )}

      <div className="hidden mt-4 rounded-xl border border-slate-600/40 bg-slate-900/70 p-4">
        <div className="grid gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300"><Leaf className="h-6 w-6" /></div>
            <div className="min-w-0"><div className="break-words text-sm font-black text-emerald-300">Fresh Ingredients</div><div className="break-words text-xs text-slate-300">Always fresh</div></div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/15 text-orange-300"><Flame className="h-6 w-6" /></div>
            <div className="min-w-0"><div className="break-words text-sm font-black text-white">Oven Baked</div><div className="break-words text-xs text-slate-300">Hot and crisp</div></div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300"><ShieldCheck className="h-6 w-6" /></div>
            <div className="min-w-0"><div className="break-words text-sm font-black text-white">Made Your Way</div><div className="break-words text-xs text-slate-300">Just as ordered</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [isManualReconnecting, setIsManualReconnecting] = useState(false);
  const [socketEpoch, setSocketEpoch] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const handleStatusChangeRef = useRef<((orderId: string, newStatus: Order['status'] | 'PREPARED') => void) | null>(null);

  // Toast helper
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
  }, []);

  // Get store ID from localStorage or URL param
  const getStoreId = () => {
    const stored = localStorage.getItem('kds-store-id');
    if (stored) return stored;
    
    const params = new URLSearchParams(window.location.search);
    const urlStoreId = params.get('store');
    if (urlStoreId) return urlStoreId;
    
    return 'default-store';
  };

  const [storeId, setStoreId] = useState<string>(getStoreId());
  const [storeOptions, setStoreOptions] = useState<Array<{ id: string; name: string; code?: string }>>([]);

  // Fetch existing orders from API on mount
  const fetchOrders = async () => {
    const currentStoreId = storeId || getStoreId();
    console.log('[KDS] Fetching orders for store:', currentStoreId);
    
    try {
      const url = `${API_URL}/api/v1/orders?storeId=${currentStoreId}&status=CREATED,CONFIRMED,PAID,PENDING,IN_KITCHEN,PREPARING,IN_PROGRESS,IN_OVEN,BAKING&includeFuture=false`;
      console.log('[KDS] Fetch URL:', url);
      
      const response = await fetch(url);
      console.log('[KDS] Fetch response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[KDS] Raw response data:', data);
        console.log('[KDS] Is array?', Array.isArray(data));
        console.log('[KDS] Raw orders from API:', data?.length || 0, 'orders');
        
        // If no orders with status filter, try packing's status list
        if (!data || data.length === 0) {
          console.log('[KDS] Trying packing status filter...');
          const packingStatuses = 'IN_PROGRESS,IN_KITCHEN,PREPARING,BAKING,IN_OVEN,READY,PREPARED,PACKING';
          const packingUrl = `${API_URL}/api/v1/orders?storeId=${currentStoreId}&status=${packingStatuses}&includeFuture=false`;
          const packingResponse = await fetch(packingUrl);
          const packingData = await packingResponse.json();
          console.log('[KDS] Orders with packing statuses:', packingData?.length || 0);
          
          console.log('[KDS] Trying without any status filter...');
          const allUrl = `${API_URL}/api/v1/orders?storeId=${currentStoreId}&includeFuture=false`;
          const allResponse = await fetch(allUrl);
          const allData = await allResponse.json();
          console.log('[KDS] All orders (no status filter):', allData?.length || 0);
          if (allData?.length > 0) {
            console.log('[KDS] Sample order:', { 
              id: allData[0]?.id, 
              status: allData[0]?.status,
              storeId: allData[0]?.storeId 
            });
            console.log('[KDS] All order statuses:', allData.map((o: any) => o.status));
            console.log('[KDS] Store IDs:', [...new Set(allData.map((o: any) => o.storeId))]);
          }
        }
        
        // Filter out invalid orders (no ID, no orderNumber, or blank)
        const validOrders = data.filter((order: any) => 
          order.id && 
          order.id !== 'undefined' && 
          order.id !== 'null' &&
          order.orderNumber &&
          order.orderNumber !== ''
        );
        console.log('[KDS] Valid orders after ID filter:', validOrders?.length || 0);
        
        const mappedOrders = validOrders
          .filter((order: any) => {
            if (!order?.scheduledFor) return true;
            return new Date(order.scheduledFor).getTime() <= Date.now();
          })
          .filter((order: any) => {
            if (order?.packedAt || order?.completedAt || order?.cancelledAt || order?.deliveredAt) return false;
            return !isTerminalKdsLifecycle(order?.status);
          })
          .map((order: any) => {
            const normalizedStatus = normalizeKdsStatus(order.status);
            // For orders already in oven, set ovenTime from API data
            let ovenTime: number | undefined;
            let ovenDuration: number | undefined;
            if (normalizedStatus === 'IN_OVEN') {
              // Use preparedAt (when it went to oven) or updatedAt as fallback
              const ovenStartTime = order.preparedAt || order.updatedAt || order.createdAt;
              if (ovenStartTime) {
                ovenTime = new Date(ovenStartTime).getTime();
                ovenDuration = Math.floor((Date.now() - ovenTime) / 1000);
              }
            }
            return {
              ...normalizeKdsOrder(order),
              status: normalizedStatus,
              ovenTime,
              ovenDuration,
            };
          });
        
        console.log('[KDS] Final mapped orders:', mappedOrders?.length || 0, 'orders');
        console.log('[KDS] Order statuses:', mappedOrders.map((o: any) => o.status));
        
        setOrders(mappedOrders);
      } else {
        const errorText = await response.text();
        console.error('[KDS] Fetch failed:', response.status, errorText);
        showToast(`Failed to fetch orders: ${response.status}`, 'error');
      }
    } catch (error) {
      console.error('[KDS] Failed to fetch orders:', error);
      showToast('Failed to fetch orders', 'error');
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
        if (defaultStore?.storeId && storeId === 'default-store') {
          setStoreId(defaultStore.storeId);
          localStorage.setItem('kds-store-id', defaultStore.storeId);
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
      fetchOrders();
    }
  }, [storeId]);

  // Connect to WebSocket with enhanced reconnection
  useEffect(() => {
    const newSocket = io(`${API_URL}/ws`, { 
      transports: ['websocket'],
      auth: { token: 'kds-token' },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[KDS] Connected to store:', storeId);
      setConnectionStatus('connected');
      setIsManualReconnecting(false);
      newSocket.emit('kds:subscribe', { storeId, station: selectedStation });
      showToast('Connected to kitchen display', 'success');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[KDS] Disconnected:', reason);
      setConnectionStatus('disconnected');
      showToast('Connection lost. Reconnecting...', 'error');
    });

    newSocket.on('reconnecting', (attemptNumber) => {
      console.log('[KDS] Reconnecting... attempt', attemptNumber);
      setConnectionStatus('reconnecting');
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('[KDS] Reconnected after', attemptNumber, 'attempts');
      setConnectionStatus('connected');
      showToast('Reconnected!', 'success');
      fetchOrders(); // Refresh orders on reconnect
    });

    newSocket.on('reconnect_failed', () => {
      console.error('[KDS] Reconnection failed');
      setConnectionStatus('disconnected');
      setIsManualReconnecting(false);
      showToast('Connection failed. Please refresh page.', 'error');
    });

    // Handle new orders - multiple event names for compatibility
    const handleNewOrder = (payload: any) => {
      const order = normalizeKdsOrder(payload);
      console.log('[KDS] New order received via WebSocket:', order);
      console.log('[KDS] Order status:', (order as any).status);
      console.log('[KDS] Order ID:', order?.id);
      
      // Skip invalid orders
      if (!order?.id || order.id === 'undefined' || order.id === 'null') {
        console.log('[KDS] Skipping order - invalid ID');
        return;
      }
      if (!order.orderNumber) {
        console.log('[KDS] Skipping order - no orderNumber');
        return;
      }
      if (order.scheduledFor && new Date(order.scheduledFor).getTime() > Date.now()) {
        console.log('[KDS] Skipping order - scheduled for future');
        return;
      }
      if (isTerminalKdsLifecycle((order as any).status)) {
        console.log('[KDS] Skipping order - terminal status');
        return;
      }
      
      console.log('[KDS] Adding order to KDS:', order.orderNumber);
      
      if (soundEnabled && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      
      setOrders((prev) => {
        const existingOrder = prev.find(o => o.id === order.id);
        if (existingOrder) {
          // Update existing order - preserve ovenTime if incoming order doesn't have it
          console.log('[KDS] Order already exists, updating');
          const normalizedStatus = normalizeKdsStatus(order.status);
          const shouldPreserveOvenTime = normalizedStatus === 'IN_OVEN' && !order.ovenTime && existingOrder.ovenTime;
          
          return prev.map(o => o.id === order.id ? {
            ...o,
            ...order,
            status: normalizedStatus,
            ovenTime: shouldPreserveOvenTime ? o.ovenTime : order.ovenTime,
            ovenDuration: shouldPreserveOvenTime ? o.ovenDuration : order.ovenDuration,
          } : o);
        }
        // Add new order
        showToast(`New order #${order.tokenNumber || order.orderNumber}!`, 'success');
        return [{
          ...order,
          status: normalizeKdsStatus(order.status),
          elapsedTime: 0,
          createdAt: order.createdAt || new Date().toISOString(),
        }, ...prev];
      });
    };

    newSocket.on('order:created', handleNewOrder);
    newSocket.on('kitchen:new-order', handleNewOrder);
    newSocket.on('order:placed', handleNewOrder);
    newSocket.on('order:paid', handleNewOrder);

    // Handle order updates
    const handleOrderUpdate = (payload: any) => {
      const incomingOrder = normalizeKdsOrder(payload);
      console.log('[KDS] Order update received:', incomingOrder);
      if (!incomingOrder?.id) return;

      if (isTerminalKdsLifecycle((incomingOrder as any).status) || (incomingOrder as any).packedAt || (incomingOrder as any).completedAt) {
        setOrders((prev) => prev.filter((o) => o.id !== incomingOrder.id));
        return;
      }

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== incomingOrder.id) return o;
          
          // Preserve local ovenTime/ovenDuration if the incoming order doesn't have them
          // This prevents the countdown from resetting when WebSocket updates come in
          const normalizedStatus = normalizeKdsStatus(incomingOrder.status);
          const shouldPreserveOvenTime = normalizedStatus === 'IN_OVEN' && !incomingOrder.ovenTime && o.ovenTime;
          
          return { 
            ...o, 
            ...incomingOrder, 
            status: normalizedStatus,
            ovenTime: shouldPreserveOvenTime ? o.ovenTime : incomingOrder.ovenTime,
            ovenDuration: shouldPreserveOvenTime ? o.ovenDuration : incomingOrder.ovenDuration,
          };
        })
      );
    };

    newSocket.on('order:updated', handleOrderUpdate);
    newSocket.on('kitchen:order:updated', handleOrderUpdate);

    const handleStatusChangeEvent = ({ orderId, status, data }) => {
      console.log('[KDS] Status change event:', orderId, status);
      const eventStatus = status || data?.status;
      const normalizedStatus = normalizeKdsStatus(eventStatus);
      const shouldRemove = isTerminalKdsLifecycle(eventStatus);

      if (shouldRemove) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        return;
      }

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === orderId) {
            const updated: Order = { ...o, status: normalizedStatus };
            // Only set ovenTime when transitioning to IN_OVEN and it's not already set
            if (normalizedStatus === 'IN_OVEN' && !o.ovenTime) {
              updated.ovenTime = Date.now();
              updated.ovenDuration = 0;
            }
            return updated;
          }
          return o;
        })
      );
    };
    
    // Listen to multiple status event patterns
    newSocket.on('order:status-changed', handleStatusChangeEvent);
    newSocket.on('order:status:changed', handleStatusChangeEvent);
    newSocket.on('kitchen:status:changed', handleStatusChangeEvent);
    
    // Handle item-level updates
    newSocket.on('order:item:started', ({ orderId, itemId }) => {
      console.log('[KDS] Item started:', itemId, 'in order:', orderId);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: 'IN_PROGRESS' } : o
        )
      );
    });
    
    newSocket.on('order:item:completed', ({ orderId, itemId }) => {
      console.log('[KDS] Item completed:', itemId, 'in order:', orderId);
    });
    
    newSocket.on('kitchen:item:completed', ({ orderId, itemId }) => {
      console.log('[KDS] Kitchen item completed:', itemId, 'in order:', orderId);
    });

    // Listen for oven timer events from server
    newSocket.on('kitchen:oven:started', ({ orderId, endTime, durationMs }) => {
      console.log('[KDS] Oven timer started for order:', orderId, 'Ends at:', endTime);
      // Update local order to show timer
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, ovenTime: Date.now(), ovenDuration: 0, status: 'IN_OVEN' }
            : o
        )
      );
    });

    newSocket.on('kitchen:oven:completed', ({ orderId }) => {
      console.log('[KDS] Oven timer completed for order:', orderId);
      // Order will be auto-removed from KDS as it moves to PACKING
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      showToast('Order auto-completed and sent to packing! 📦', 'success');
    });

    // Listen for store changes from localStorage
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'kds-store-id' && e.newValue) {
        setStoreId(e.newValue);
        newSocket.emit('kds:subscribe', { storeId: e.newValue, station: selectedStation });
      }
    };
    window.addEventListener('storage', handleStorage);
    
    // Refresh when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[KDS] Tab became visible, refreshing orders...');
        fetchOrders();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Periodic refresh as fallback (every 30 seconds)
    const refreshInterval = setInterval(() => {
      fetchOrders();
    }, 30000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(refreshInterval);
      newSocket.close();
    };
  }, [selectedStation, soundEnabled, storeId, socketEpoch]);

  // Update elapsed time and oven timers every second + AUTO-ADVANCE from oven
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      setOrders((prev) => {
        const now = new Date().getTime();
        const ordersToAutoAdvance: string[] = [];
        
        const updatedOrders = prev.map((order) => {
          const created = new Date(order.createdAt).getTime();
          const elapsedTime = Math.floor((now - created) / 1000);
          
          let ovenDuration = order.ovenDuration;
          if (order.status === 'IN_OVEN' && order.ovenTime) {
            ovenDuration = Math.floor((now - order.ovenTime) / 1000);
            
            // Check if cook time is complete for auto-advance
            const station = order.items?.[0]?.kitchenStation || 'DEFAULT';
            const cookTimeMinutes = COOK_TIMES[station] || COOK_TIMES.DEFAULT;
            const cookTimeSeconds = cookTimeMinutes * 60;
            
            if (ovenDuration >= cookTimeSeconds) {
              ordersToAutoAdvance.push(order.id);
            }
          }
          
          return { ...order, elapsedTime, ovenDuration };
        });
        
        // Auto-advance orders that are done cooking
        ordersToAutoAdvance.forEach((orderId) => {
          handleStatusChangeRef.current?.(orderId, 'PREPARED');
        });
        
        return updatedOrders;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [socket, storeId]);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getElapsedTimeColor = (seconds: number) => {
    if (seconds < 300) return 'text-green-400';
    if (seconds < 600) return 'text-yellow-400';
    return 'text-red-500 urgent';
  };

  // Handle status change - sends to API and updates locally
  const handleStatusChange = async (orderId: string, newStatus: Order['status'] | 'PREPARED') => {
    try {
      // Send to API first
	      const apiStatus = newStatus === 'IN_OVEN' ? 'BAKING' :
	                        newStatus === 'IN_PROGRESS' ? 'PREPARING' :
	                        newStatus === 'PENDING' ? 'PENDING' :
	                        newStatus;
      
      console.log(`[KDS] Updating order ${orderId} to status: ${apiStatus}`);
      
      const response = await fetch(`${API_URL}/api/v1/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: apiStatus, storeId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[KDS] Failed to update order status:', response.status, errorText);
        showToast(`Failed to update order: ${errorText}`, 'error');
        return;
      }

      const result = await response.json();
      console.log('[KDS] Status update successful:', result);

      // Show success toast
      const statusMessages: Record<string, string> = {
        'PREPARING': 'Moved to Cooking! 🍳',
        'BAKING': 'Placed in Oven! 🔥',
        'PREPARED': 'Auto-sent to Packing! 📦',
      };
      showToast(statusMessages[apiStatus] || 'Status updated!', 'success');

      // Also emit via socket for real-time updates
      const update: any = { orderId, storeId, status: apiStatus };
      
      if (newStatus === 'IN_OVEN') {
        update.ovenTime = Date.now();
      }
      
      socket?.emit('order:status-update', update);
      socket?.emit('order:status:update', update);
      
      // Update local state immediately for responsive UI
      if (newStatus === 'PREPARED') {
        // Remove from KDS immediately when sent to packing
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id === orderId) {
              const updated: Order = { ...o, status: newStatus as Order['status'] };
              if (newStatus === 'IN_OVEN') {
                updated.ovenTime = Date.now();
                updated.ovenDuration = 0;
              }
              return updated;
            }
            return o;
          })
        );
      }
      
      // Refresh orders from server to ensure consistency
      setTimeout(() => fetchOrders(), 500);
    } catch (error) {
      console.error('[KDS] Error updating status:', error);
      showToast('Error updating order status. Please try again.', 'error');
    }
  };

  // Keep ref updated with latest handleStatusChange
  handleStatusChangeRef.current = handleStatusChange;

  const filteredOrders = orders.filter((order) => {
    if (selectedStation === 'ALL') return true;
    if (!order.items || !Array.isArray(order.items)) return false;
    return order.items.some((item) => item.kitchenStation === selectedStation);
  });

  const pendingOrders = filteredOrders.filter((o) => o.status === 'PENDING');
  const inProgressOrders = filteredOrders.filter((o) => o.status === 'IN_PROGRESS');
  const inOvenOrders = filteredOrders.filter((o) => o.status === 'IN_OVEN');

  const activeOrders = pendingOrders.length + inProgressOrders.length + inOvenOrders.length;

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Flame className="text-orange-500" />
              KDS - Kitchen Display
            </h1>
            <div className="text-gray-400 text-lg">
              {currentTime.toLocaleTimeString()}
            </div>
            <select
              value={storeId}
              onChange={(e) => {
                const newStoreId = e.target.value;
                setStoreId(newStoreId);
                localStorage.setItem('kds-store-id', newStoreId);
                socket?.emit('kds:subscribe', { storeId: newStoreId, station: selectedStation });
              }}
              className="bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600 w-72"
            >
              {storeOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code || s.id.slice(0, 8)})
                </option>
              ))}
              {storeOptions.length === 0 ? <option value={storeId}>{storeId}</option> : null}
            </select>
            <button
              onClick={handleManualSync}
              className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-gray-300"
              title="Refresh orders"
            >
              <RefreshCw size={18} className={isManualSyncing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleManualReconnect}
              className="px-3 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-gray-300 text-sm"
              title="Reconnect socket"
            >
              {isManualReconnecting ? 'Reconnecting...' : 'Reconnect'}
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection Status Indicator */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-700 border border-gray-600`}>
              <div className="relative flex h-2 w-2">
                {connectionStatus === 'connected' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                )}
                <div className={`relative inline-flex rounded-full h-2 w-2 ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'reconnecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
              </div>
              <span className={`text-xs font-medium ${
                connectionStatus === 'connected' ? 'text-green-400' :
                connectionStatus === 'reconnecting' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {connectionStatus === 'connected' ? 'Live' :
                 connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Offline'}
              </span>
            </div>

            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600"
            >
              <option value="ALL">All Stations</option>
              {Object.entries(STATION_NAMES).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600"
            >
              {soundEnabled ? (
                <Volume2 className="text-green-400" />
              ) : (
                <VolumeX className="text-gray-400" />
              )}
            </button>

            <div className="flex gap-4 text-sm">
              <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                Pending: {pendingOrders.length}
              </div>
              <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded">
                Cooking: {inProgressOrders.length}
              </div>
              <div className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded">
                In Oven: {inOvenOrders.length}
              </div>
              <div className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded">
                Active: {activeOrders}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Kanban Board */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="mb-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
          <div className="font-semibold mb-1">Kitchen Workflow</div>
          <div>1. Move orders through <span className="font-semibold">Pending → Cooking → In Oven</span>.</div>
          <div>2. Orders <span className="font-semibold">auto-advance to Packing</span> when oven timer completes.</div>
          <div>3. Each station has its own cook time (Pizza: 7min, Tandoor: 8min, Fryer: 4min, etc).</div>
        </div>
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <RefreshCw size={32} className="animate-spin mr-3" />
            Loading orders...
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 h-full">
            {/* Pending Column */}
            <div className="bg-gray-800 rounded-lg overflow-hidden flex flex-col">
              <div className="bg-yellow-500/20 p-3 border-b border-yellow-500/30">
                <h2 className="font-bold text-yellow-400 flex items-center gap-2">
                  <Clock size={20} />
                  PENDING ({pendingOrders.length})
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {pendingOrders.length === 0 && (
                  <div className="text-center text-gray-500 py-8 italic">
                    No pending orders
                  </div>
                )}
                {pendingOrders.map((order) => (
                  <OrderTicket
                    key={order.id}
                    order={order}
                    onStart={() => handleStatusChange(order.id, 'IN_PROGRESS')}
                    timeColor={getElapsedTimeColor(order.elapsedTime)}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            </div>

            {/* In Progress Column */}
            <div className="bg-gray-800 rounded-lg overflow-hidden flex flex-col">
              <div className="bg-blue-500/20 p-3 border-b border-blue-500/30">
                <h2 className="font-bold text-blue-400 flex items-center gap-2">
                  <ChefHat size={20} />
                  COOKING ({inProgressOrders.length})
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {inProgressOrders.length === 0 && (
                  <div className="text-center text-gray-500 py-8 italic">
                    No orders cooking
                  </div>
                )}
                {inProgressOrders.map((order) => (
	                  <OrderTicket
	                    key={order.id}
	                    order={order}
	                    onBack={() => handleStatusChange(order.id, 'PENDING')}
	                    onInOven={() => handleStatusChange(order.id, 'IN_OVEN')}
	                    timeColor={getElapsedTimeColor(order.elapsedTime)}
	                    formatTime={formatTime}
                    isCooking
                  />
                ))}
              </div>
            </div>

            {/* In Oven Column */}
            <div className="bg-gray-800 rounded-lg overflow-hidden flex flex-col">
              <div className="bg-orange-500/20 p-3 border-b border-orange-500/30">
                <h2 className="font-bold text-orange-400 flex items-center gap-2">
                  <Timer size={20} />
                  IN OVEN ({inOvenOrders.length})
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {inOvenOrders.length === 0 && (
                  <div className="text-center text-gray-500 py-8 italic">
                    No orders in oven
                  </div>
                )}
                {inOvenOrders.map((order) => (
                  <OrderTicket
                    key={order.id}
                    order={order}
	                    timeColor="text-orange-400"
	                    formatTime={formatTime}
	                    isInOven
	                    onBack={() => handleStatusChange(order.id, 'IN_PROGRESS')}
	                    onPushToPack={() => handleStatusChange(order.id, 'PREPARED')}
	                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface OrderTicketProps {
  order: Order;
  onBack?: () => void;
  onStart?: () => void;
  onInOven?: () => void;
  onPushToPack?: () => void;
  timeColor: string;
  formatTime: (seconds: number) => string;
  isCooking?: boolean;
  isInOven?: boolean;
}

function OrderTicket({
  order,
  onBack,
  onStart,
  onInOven,
  onPushToPack,
  timeColor,
  formatTime,
  isCooking,
  isInOven,
}: OrderTicketProps) {
  const station = order.items?.[0]?.kitchenStation || 'DEFAULT';
  const cookTimeMinutes = COOK_TIMES[station] || COOK_TIMES.DEFAULT;
  const cookTimeSeconds = cookTimeMinutes * 60;
  const elapsed = order.ovenDuration || 0;
  const remainingSeconds = Math.max(0, cookTimeSeconds - elapsed);
  const countdown = isInOven ? formatTime(remainingSeconds) : '';
  const progress = isInOven ? Math.min((elapsed / cookTimeSeconds) * 100, 100) : 0;
  
  // Show warning when less than 60 seconds remaining
  const isAlmostDone = isInOven && remainingSeconds < 60 && remainingSeconds > 0;
  const isOverdue = isInOven && remainingSeconds === 0;

  return (
    <div
      className={`kds-ticket bg-gray-700 rounded-lg p-3 border-l-4 ${
        isInOven
          ? isOverdue 
            ? 'border-green-500 animate-pulse'
            : isAlmostDone
            ? 'border-yellow-400'
            : 'border-orange-500'
          : isCooking
          ? 'border-blue-500'
          : 'border-yellow-500'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-xl font-black text-white tracking-tight">
              #{order.tokenNumber || order.orderNumber}
            </span>
            {order.customerName && (
              <span className="text-xs font-semibold text-slate-300">{order.customerName}</span>
            )}
            {order.type === 'DINE_IN' && order.tableNumber && (
              <span className="bg-purple-500 text-white px-2 py-0.5 rounded text-sm">
                Table {order.tableNumber}
              </span>
            )}
          </div>
        </div>
        <div className={`font-mono font-bold ${timeColor}`}>
          {isInOven ? (
            <div className="text-right">
              <div className={`text-2xl ${isAlmostDone ? 'text-yellow-400 animate-pulse' : isOverdue ? 'text-green-400' : 'text-orange-400'}`}>
                {countdown}
              </div>
              <div className="text-xs text-gray-400">remaining</div>
            </div>
          ) : (
            formatTime(order.elapsedTime)
          )}
        </div>
	      </div>
	
		      <div className="mb-4 flex gap-2">
		        {onStart && (
		          <button
		            onClick={onStart}
		            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium transition-colors"
	          >
		            START COOKING
		          </button>
		        )}
		        {onBack && (
		          <button
		            onClick={onBack}
		            className="min-w-[120px] bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-medium transition-colors"
		          >
		            BACK
		          </button>
		        )}
		        {onInOven && (
		          <button
		            onClick={onInOven}
	            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded font-medium transition-colors flex items-center justify-center gap-1"
	          >
	            <Zap size={16} />
	            IN OVEN
	          </button>
	        )}
	        {onPushToPack && (
	          <button
	            onClick={onPushToPack}
	            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-medium transition-colors flex items-center justify-center gap-1"
	          >
	            <PackageCheck size={16} />
	            PUSH TO PACK
	          </button>
	        )}
	      </div>

	      <div className="space-y-4 mb-4">
	        {(order.items || []).map((item, idx) => {
          return <KitchenItemCard key={`${item.id || item.productName}-${idx}`} item={item} />;
          const kitchenDetails = getKitchenDetailLines(item);
          return (
          <div key={idx} className="bg-gray-800/40 p-3 rounded-lg border border-gray-600/30">
            <div className="flex items-baseline gap-3">
              <span className="font-black text-white text-3xl tabular-nums">{item.quantity}x</span>
              <span className="text-white font-bold text-2xl tracking-tight">{item.productName}</span>
            </div>
            {kitchenDetails.length > 0 && (
              <div className="mt-3 grid gap-2">
                {kitchenDetails.map((detail, detailIdx) => {
                  const toneClass =
                    detail.tone === 'sauce'
                      ? 'border-red-500/40 bg-red-500/10 text-red-50'
                      : detail.tone === 'cheese'
                      ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-50'
                      : detail.tone === 'topping'
                      ? 'border-green-500/40 bg-green-500/10 text-green-50'
                      : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-50';
                  return (
                    <div
                      key={`${detail.label}-${detailIdx}`}
                      className={`rounded-md border px-3 py-2 ${toneClass}`}
                    >
                      <div className="text-[11px] uppercase tracking-wide text-gray-300 font-black">{detail.label}</div>
                      <div className="text-base font-bold leading-snug">{detail.value}</div>
                    </div>
                  );
                })}
              </div>
            )}
            {item.notes && (
              <div className="text-orange-300 text-xl ml-2 mt-2 font-bold flex items-start gap-2 bg-orange-500/10 p-2 rounded border border-orange-500/20">
                <span className="shrink-0">⚠️</span>
                <span>{item.notes}</span>
              </div>
            )}
          </div>
          );
        })}
      </div>

      {isInOven && (
        <div className="mb-3">
          <div className="flex justify-between text-sm text-gray-300 mb-1">
            <span>Oven Timer</span>
            <span className={`font-bold ${isAlmostDone ? 'text-yellow-400' : isOverdue ? 'text-green-400' : 'text-orange-400'}`}>
              {isOverdue ? 'Done! Moving to packing...' : `${countdown} remaining`}
            </span>
          </div>
          <div className="h-3 bg-gray-600 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${
                isOverdue 
                  ? 'bg-gradient-to-r from-green-500 to-green-400' 
                  : isAlmostDone 
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 animate-pulse'
                  : 'bg-gradient-to-r from-orange-500 to-red-500'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1 text-center">
            {cookTimeMinutes} min cook time • Auto-advances when done
          </div>
        </div>
      )}

	      <div className="mt-2 flex flex-wrap gap-1">
        {(() => {
          const items = order.items || [];
          const stations = Array.from(new Set(items.map((i) => i.kitchenStation)));
          return stations.map((station) => (
            <span
              key={station}
              className="text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded"
            >
              {STATION_NAMES[station] || station}
            </span>
          ));
        })()}
      </div>
    </div>
  );
}

export default App;
