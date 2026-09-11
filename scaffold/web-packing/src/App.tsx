import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Package, CheckCircle, Printer, Clock, Flame, ChefHat, AlertCircle, Moon, Sun, FileText, RefreshCw, X, Info, PackageCheck, Timer, Pizza, Soup, CircleDot, Wheat, UtensilsCrossed, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { useLocalSetting } from './hooks/useLocalSetting';

/**
 * Pull a useful error message out of a fetch Response.
 * Handles JSON `{ message: string | string[] }` (NestJS default), plain text, and unparseable bodies.
 */
async function extractServerErrorMessage(response: Response): Promise<string> {
  try {
    const text = await response.text();
    if (!text) return `${response.status} ${response.statusText || 'Request failed'}`;
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed?.message)) return parsed.message.join(', ');
      if (typeof parsed?.message === 'string') return parsed.message;
      if (typeof parsed?.error === 'string') return parsed.error;
    } catch {
      return text;
    }
    return text;
  } catch {
    return `${response.status} ${response.statusText || 'Request failed'}`;
  }
}

// Confirmation Modal Component
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'success' | 'info';
}

function ConfirmModal({ isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, type = 'info' }: ConfirmModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getColors = () => {
    switch (type) {
      case 'danger':
        return { bg: 'bg-red-500', hover: 'hover:bg-red-600', light: 'bg-red-50 text-red-600' };
      case 'success':
        return { bg: 'bg-green-500', hover: 'hover:bg-green-600', light: 'bg-green-50 text-green-600' };
      default:
        return { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', light: 'bg-blue-50 text-blue-600' };
    }
  };

  const colors = getColors();

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className={`relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.light}`}>
              <PackageCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-3 rounded-xl font-medium text-white ${colors.bg} ${colors.hover} transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg`}
            >
              {confirmText}
            </button>
          </div>
        </div>
        <div className={`h-1 w-full ${colors.bg} rounded-b-2xl`} />
      </div>
    </div>
  );
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Order {
  id: string;
  orderNumber: string;
  tokenNumber?: string;
  type: 'DINE_IN' | 'PICKUP' | 'DELIVERY';
  tableNumber?: string;
  customerName?: string;
  status: 'READY' | 'PACKED' | 'IN_OVEN' | 'IN_PROGRESS';
  items: OrderItem[];
  readyAt: string;
  elapsedTime: number;
  ovenTime?: number;
  ovenDuration?: number;
}

interface OrderItem {
  id?: string;
  productName: string;
  quantity: number;
  sizeName?: string;
  unitPrice?: number;
  totalPrice?: number;
  modifiers?: any;
  addons?: any;
  notes?: string;
  kitchenStation?: string;
}

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
  value.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, (char) => char.toUpperCase());

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
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(normalizeDetailText).filter(Boolean).join(', ');
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
    return formatModifierObject(rawName);
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
    pushUniqueLine(lines, { label: 'Crust', value: 'Hand Tossed', tone: 'crust' });
    pushUniqueLine(lines, { label: 'Sauce', value: 'Classic Tomato - Regular', tone: 'sauce' });
    pushUniqueLine(lines, { label: 'Cheese', value: 'Mozzarella - Whole - Regular', tone: 'cheese' });
  }

  return normalizePizzaToppingDetailLines(item, lines.map(reparseOptionDetailLine));
};

const getPackingDetailStyle = (tone?: KitchenDetailLine['tone'], darkMode = true) => {
  if (tone === 'size') return darkMode ? 'border-blue-500/40 bg-blue-500/10 text-blue-100' : 'border-blue-200 bg-blue-50 text-blue-900';
  if (tone === 'sauce') return darkMode ? 'border-red-500/40 bg-red-500/10 text-red-100' : 'border-red-200 bg-red-50 text-red-900';
  if (tone === 'cheese') return darkMode ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-100' : 'border-yellow-200 bg-yellow-50 text-yellow-900';
  if (tone === 'crust') return darkMode ? 'border-orange-500/40 bg-orange-500/10 text-orange-100' : 'border-orange-200 bg-orange-50 text-orange-900';
  if (tone === 'meat') return darkMode ? 'border-rose-500/40 bg-rose-500/10 text-rose-100' : 'border-rose-200 bg-rose-50 text-rose-900';
  if (tone === 'left') return darkMode ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100' : 'border-emerald-200 bg-emerald-50 text-emerald-900';
  if (tone === 'right') return darkMode ? 'border-blue-500/40 bg-blue-500/10 text-blue-100' : 'border-blue-200 bg-blue-50 text-blue-900';
  if (tone === 'topping') return darkMode ? 'border-purple-500/40 bg-purple-500/10 text-purple-100' : 'border-purple-200 bg-purple-50 text-purple-900';
  return darkMode ? 'border-slate-600 bg-slate-800/70 text-slate-100' : 'border-gray-200 bg-white text-gray-900';
};

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
    const groupConfig = config[detail.label.toLowerCase()];
    if (!groupConfig) return acc;
    const existing = acc.find((group) => group.title === groupConfig.title);
    const items = splitKitchenValues(detail.value).map(parseKitchenIngredient);
    if (existing) existing.items.push(...items);
    else acc.push({ ...groupConfig, items });
    return acc;
  }, []);

  const order: Record<string, number> = { 'Whole Pizza': 0, 'Left Half': 1, 'Right Half': 2 };
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
  name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, '');

const getIngredientCategory = (name: string): 'meat' | 'vegetable' | 'cheese' | 'sauce' | 'other' => {
  const normalized = normalizeIngredientName(name);
  if (/\b(pepperoni|sausage|bacon|ham|beef|chicken|steak|salami|meatball|turkey|anchovy|prosciutto)\b/.test(normalized)) return 'meat';
  if (/\b(mushroom|pepper|onion|tomato|spinach|jalapeno|olive|pineapple|broccoli|basil|garlic|corn|banana pepper)\b/.test(normalized)) return 'vegetable';
  if (/\b(cheese|mozzarella|parmesan|cheddar|feta|provolone|ricotta)\b/.test(normalized)) return 'cheese';
  if (/\b(sauce|alfredo|bbq|pesto|buffalo|ranch|marinara)\b/.test(normalized)) return 'sauce';
  return 'other';
};

const getIngredientPillClass = (name: string) => {
  const normalized = normalizeIngredientName(name);
  const has = (...terms: string[]) => terms.some((term) => normalized.includes(term));
  if (has('pepperoni')) return 'bg-gradient-to-br from-red-700 to-orange-900 text-white border-red-900/50';
  if (has('italian sausage')) return 'bg-gradient-to-br from-orange-700 to-amber-900 text-white border-orange-900/50';
  if (has('sausage')) return 'bg-gradient-to-br from-orange-700 to-red-900 text-white border-orange-900/50';
  if (has('ham')) return 'bg-gradient-to-br from-rose-500 to-red-800 text-white border-rose-800/50';
  if (has('bacon')) return 'bg-gradient-to-br from-orange-600 to-red-900 text-white border-red-900/50';
  if (has('chicken')) return 'bg-gradient-to-br from-orange-500 to-amber-800 text-white border-amber-900/50';
  if (has('ground beef', 'beef', 'meatball', 'steak')) return 'bg-gradient-to-br from-amber-900 to-red-950 text-white border-red-950/50';
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
  if (has('alfredo')) return 'bg-gradient-to-br from-stone-300 to-stone-500 text-white border-stone-600/50';
  if (has('bbq')) return 'bg-gradient-to-br from-red-950 to-amber-950 text-white border-red-950/50';
  if (has('pesto')) return 'bg-gradient-to-br from-lime-700 to-green-950 text-white border-green-950/50';
  if (has('buffalo')) return 'bg-gradient-to-br from-orange-600 to-red-900 text-white border-red-900/50';
  if (has('classic tomato', 'pizza sauce', 'marinara')) return 'bg-gradient-to-br from-red-700 to-red-950 text-white border-red-950/50';
  if (has('ranch')) return 'bg-gradient-to-br from-slate-200 to-slate-500 text-white border-slate-600/50';
  if (has('extra cheese', 'mozzarella', 'parmesan', 'cheddar', 'four cheese', 'feta', 'provolone', 'ricotta')) return 'bg-gradient-to-br from-yellow-400 to-amber-700 text-white border-amber-800/50';
  const category = getIngredientCategory(name);
  if (category === 'meat') return 'bg-gradient-to-br from-red-700 to-orange-900 text-white border-red-900/50';
  if (category === 'vegetable') return 'bg-gradient-to-br from-emerald-600 to-green-950 text-white border-green-950/50';
  if (category === 'cheese') return 'bg-gradient-to-br from-yellow-400 to-amber-700 text-white border-amber-800/50';
  if (category === 'sauce') return 'bg-gradient-to-br from-rose-700 to-red-950 text-white border-red-950/50';
  return 'bg-gradient-to-br from-slate-600 to-slate-800 text-white border-slate-900/50';
};

function PackingToppingSection({ group, darkMode }: { group: ToppingGroup; darkMode: boolean }) {
  const titleMap: Record<string, string> = {
    'Whole Pizza': 'Whole Toppings',
    'Left Half': 'Left Toppings',
    'Right Half': 'Right Toppings',
  };
  const title = titleMap[group.title] || group.title;
  const borderClass = darkMode
    ? group.tone === 'left'
      ? 'border-emerald-500/60'
      : group.tone === 'right'
        ? 'border-blue-500/60'
        : group.tone === 'meat'
          ? 'border-rose-500/60'
          : group.tone === 'topping'
            ? 'border-purple-500/60'
            : 'border-slate-500/60'
    : 'border-gray-300';
  const titleClass = darkMode
    ? group.tone === 'left'
      ? 'text-emerald-300'
      : group.tone === 'right'
        ? 'text-blue-300'
        : group.tone === 'meat'
          ? 'text-rose-300'
          : group.tone === 'topping'
            ? 'text-purple-300'
            : 'text-slate-300'
    : 'text-gray-800';
  return (
    <div className={`rounded-xl border-2 p-3 ${borderClass} ${darkMode ? 'bg-slate-900/40' : 'bg-gray-50'}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className={`text-sm font-black uppercase tracking-wide ${titleClass}`}>{title}</span>
        <span className={`rounded px-2 py-0.5 text-xs font-black ${darkMode ? 'bg-slate-800 text-white' : 'bg-gray-200 text-gray-800'}`}>{group.items.length}</span>
      </div>
      <div className="flex flex-wrap content-start gap-2">
        {group.items.map((ingredient, idx) => (
          <span
            key={`${ingredient.name}-${idx}`}
            className={`max-w-full rounded-md border-2 px-3 py-1.5 text-sm font-black leading-tight shadow-sm ${getIngredientPillClass(ingredient.name)}`}
          >
            {ingredient.amount !== 'Regular' ? `${ingredient.amount} ` : ''}{ingredient.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function PackingItemCard({ item, darkMode }: { item: OrderItem; darkMode: boolean }) {
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
  const cardClass = darkMode ? 'border-slate-500/30 bg-slate-950/55' : 'border-gray-200 bg-white';
  const titleClass = darkMode ? 'text-white' : 'text-gray-950';
  return (
    <div className={`overflow-hidden rounded-2xl border p-3 shadow-xl ${cardClass}`}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-[180px] flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className={`font-black text-xl tabular-nums ${titleClass}`}>{item.quantity || 1}x</span>
            <span className={`min-w-0 break-words font-black text-xl leading-tight tracking-normal ${titleClass}`}>{item.productName.replace(/\s+-\s+.+$/, '')}</span>
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {unitPrice > 0 && <div className={`text-right text-xl font-black ${titleClass}`}>${unitPrice.toFixed(2)}</div>}
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse item details' : 'Expand item details'}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${darkMode ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {summaryDetails.length > 0 && (
            <div className={`mt-3 rounded-xl border p-2.5 ${darkMode ? 'border-slate-600/40 bg-slate-900/40' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex flex-wrap gap-2">
                {summaryDetails.map((detail) => (
                  <span
                    key={detail.label}
                    title={detail.label}
                    className="rounded-md border-2 border-green-300/60 bg-green-600 px-3 py-1.5 text-sm font-black leading-tight text-white shadow-sm"
                  >
                    {detail.value.replace(/^Regular\s+/i, '')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {toppingGroups.length > 0 && (
            <div className="mt-3 space-y-3">
              {fullToppingGroups.map((group) => (
                <PackingToppingSection key={group.title} group={group} darkMode={darkMode} />
              ))}
              {sideToppingGroups.length > 0 && (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {sideToppingGroups.map((group) => (
                    <PackingToppingSection key={group.title} group={group} darkMode={darkMode} />
                  ))}
                </div>
              )}
            </div>
          )}

          {otherDetails.length > 0 && (
            <div className={`mt-4 rounded-xl border p-4 ${darkMode ? 'border-orange-500/25 bg-orange-500/10' : 'border-orange-200 bg-orange-50'}`}>
              <div className={darkMode ? 'text-base font-black uppercase text-orange-300' : 'text-base font-black uppercase text-orange-700'}>Other Details</div>
              <div className="mt-3 grid gap-3">
                {otherDetails.map((detail) => (
                  <div key={`${detail.label}-${detail.value}`} className="border-r border-orange-500/20 pr-3 last:border-r-0">
                    <div className={`break-words text-sm font-black ${titleClass}`}>{detail.label}</div>
                    <div className={darkMode ? 'break-words text-sm font-semibold text-slate-300' : 'break-words text-sm font-semibold text-gray-600'}>{detail.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {item.notes && (
            <div className="mt-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm font-bold text-orange-500">
              Special instructions: {item.notes}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const normalizePackingStatus = (rawStatus?: string): Order['status'] | 'COMPLETED' | 'CANCELLED' => {
  const status = String(rawStatus || '').toUpperCase();
  const map: Record<string, Order['status'] | 'COMPLETED' | 'CANCELLED'> = {
    PREPARING: 'IN_PROGRESS',
    IN_KITCHEN: 'IN_PROGRESS',
    IN_PROGRESS: 'IN_PROGRESS',
    BAKING: 'IN_OVEN',
    IN_OVEN: 'IN_OVEN',
    PREPARED: 'READY',
    ASSEMBLED: 'READY',
    READY: 'READY',
    PACKING: 'READY',
    PACKED: 'PACKED',
    READY_FOR_PICKUP: 'PACKED',
    READY_TO_SERVE: 'PACKED',
    OUT_FOR_DELIVERY: 'PACKED',
    DELIVERED: 'COMPLETED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  };

  return map[status] || 'IN_PROGRESS';
};

const isTerminalPackingLifecycle = (rawStatus?: string) => {
  const status = String(rawStatus || '').toUpperCase();
  return [
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

const COOK_TIMES: Record<string, number> = {
  PIZZA: 7,
  TANDOOR: 8,
  FRYER: 4,
  GRILL: 10,
  GENERAL: 5,
  SANDWICH: 3,
  DEFAULT: 7,
};

const PACKING_REVERSE_TIMER_SECONDS = 120;

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
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
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

function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [storeId, setStoreId] = useState('default-store');
  const [storeOptions, setStoreOptions] = useState<
    Array<{
      id: string;
      name: string;
      code?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    }>
  >([]);
  const [darkMode, setDarkMode] = useState(true);
  // Persist the per-order packing checklist so a page refresh during lunch service doesn't
  // erase progress on every open ticket. We key by store so each station has its own state.
  const [checklistByOrder, setChecklistByOrder] = useLocalSetting<
    Record<string, Record<string, boolean>>
  >(`web-packing-checklist:${storeId}`, {
    defaultValue: {},
    validate: (v): v is Record<string, Record<string, boolean>> =>
      typeof v === 'object' && v !== null && !Array.isArray(v),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; orderId?: string }>({ isOpen: false });
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [isManualReconnecting, setIsManualReconnecting] = useState(false);
  const [socketEpoch, setSocketEpoch] = useState(0);

  // Toast helper
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch existing orders from API on mount
  const fetchOrders = async () => {
    try {
      // Fetch only packing-relevant lifecycle statuses to reduce payload and UI filtering churn
      const packingStatuses = 'IN_PROGRESS,IN_KITCHEN,PREPARING,BAKING,IN_OVEN,READY,PREPARED,PACKING';
      const response = await fetch(`${API_URL}/api/v1/orders?storeId=${storeId}&status=${packingStatuses}&includeFuture=false`);
      if (!response.ok) {
        const detail = await extractServerErrorMessage(response);
        console.error('[Packing] GET /orders failed:', response.status, detail);
        showToast(`Could not load orders: ${detail}`, 'error');
        return;
      }
      const data = await response.json();
      const mappedOrders = data
        .map((order: any) => {
          const normalized = normalizePackingStatus(order.status);
          const shouldHide =
            !!order.packedAt ||
            !!order.completedAt ||
            !!order.cancelledAt ||
            !!order.deliveredAt ||
            isTerminalPackingLifecycle(order.status);
          if (shouldHide) return null;
          const ovenStartAt =
            normalized === 'IN_OVEN'
              ? new Date(order.preparedAt || order.updatedAt || order.createdAt || Date.now()).getTime()
              : undefined;
          const initialOvenDuration =
            ovenStartAt && Number.isFinite(ovenStartAt)
              ? Math.max(0, Math.floor((Date.now() - ovenStartAt) / 1000))
              : undefined;

          return {
            id: order.id,
            orderNumber: order.orderNumber,
            tokenNumber: order.tokenNumber,
            type: order.type,
            tableNumber: order.tableNumber,
            customerName: order.customerName,
            status: normalized === 'COMPLETED' || normalized === 'CANCELLED' ? 'PACKED' : normalized,
            items: order.items?.map((item: any) => ({
              id: item.id,
              productName: item.productName,
              sizeName: item.sizeName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              modifiers: item.modifiers,
              addons: item.addons,
              notes: item.notes,
              kitchenStation: item.kitchenStation || 'DEFAULT',
            })) || [],
            readyAt: order.packedAt || order.updatedAt || order.preparedAt || new Date().toISOString(),
            elapsedTime: 0,
            ovenTime: ovenStartAt,
            ovenDuration: initialOvenDuration,
          };
        })
        .filter((order: Order | null): order is Order => !!order)
        .filter((order: Order) => order.status === 'READY' || order.status === 'IN_OVEN' || order.status === 'IN_PROGRESS');
      setOrders(mappedOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      const detail = error instanceof Error ? error.message : 'Network error';
      showToast(`Could not load orders: ${detail}`, 'error');
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
        if (defaultStore?.storeId) setStoreId(defaultStore.storeId);
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

  // Connect to WebSocket
  useEffect(() => {
    const newSocket = io(`${API_URL}/ws`, { 
      transports: ['websocket'],
      auth: { token: 'packing-token' }
    });
    newSocket.on('connect', () => {
      console.log('Packing station connected');
      setConnectionStatus('connected');
      setIsManualReconnecting(false);
      newSocket.emit('packing:subscribe', storeId);
    });
    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });
    newSocket.on('connect_error', () => {
      setConnectionStatus('disconnected');
      setIsManualReconnecting(false);
    });

    newSocket.on('packing:order-ready', (order: Order) => {
      setOrders((prev) => {
        if (prev.find(o => o.id === order.id)) {
          return prev.map(o => o.id === order.id ? { ...o, status: 'READY', readyAt: new Date().toISOString() } : o);
        }
        return [{ ...order, status: 'READY', readyAt: new Date().toISOString() }, ...prev];
      });
      setTimeout(() => fetchOrders(), 250);
    });

    newSocket.on('kitchen:oven-started', ({ orderId }: { orderId: string }) => {
      setOrders((prev) => 
        prev.map((o) => 
          o.id === orderId 
            ? { ...o, status: 'IN_OVEN', ovenTime: Date.now(), ovenDuration: 0 } 
            : o
        )
      );
    });

    // Listen for server-side oven timer completion
    newSocket.on('kitchen:oven:completed', ({ orderId }: { orderId: string }) => {
      console.log('[Packing] Oven timer completed for order:', orderId);
      // Refresh orders to get updated status from server
      fetchOrders();
    });

    const handleStatus = ({ orderId, status }) => {
      const normalized = normalizePackingStatus(status);
      if (normalized === 'COMPLETED' || normalized === 'CANCELLED' || isTerminalPackingLifecycle(status)) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setSelectedOrder((prev) => (prev?.id === orderId ? null : prev));
      } else {
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id !== orderId) return o;
            if (normalized === 'READY') {
              return { ...o, status: normalized, readyAt: new Date().toISOString() };
            }
            if (normalized === 'IN_OVEN') {
              return { ...o, status: normalized, ovenTime: Date.now(), ovenDuration: 0 };
            }
            return { ...o, status: normalized };
          })
        );
      }
      setTimeout(() => fetchOrders(), 250);
    };
    newSocket.on('order:status-changed', handleStatus);
    newSocket.on('order:status:changed', handleStatus);

    return () => {
      newSocket.close();
    };
  }, [storeId, socketEpoch]);

  // Update elapsed time and oven timers
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setOrders((prev) =>
        prev.map((order) => {
          const now = new Date().getTime();
          let elapsedTime = order.elapsedTime;
          let ovenDuration = order.ovenDuration;
          
          if (order.readyAt) {
            const ready = new Date(order.readyAt).getTime();
            elapsedTime = Math.floor((now - ready) / 1000);
          }
          
          if (order.status === 'IN_OVEN' && order.ovenTime) {
            ovenDuration = Math.floor((now - order.ovenTime) / 1000);
          }
          
          return { ...order, elapsedTime, ovenDuration };
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle pack completion - requires explicit confirmation
  const handlePackComplete = (orderId: string) => {
    if (!isChecklistComplete(selectedOrder!)) {
      showToast('Please complete all checklist items first ⚠️', 'error');
      return;
    }
    
    setConfirmModal({ isOpen: true, orderId });
  };

  const getPackingNextStatus = (order?: Order) => {
    if (!order) return { status: 'PACKED', successMessage: 'Order packed.' };
    if (order.type === 'DELIVERY') {
      return { status: 'PACKED', successMessage: 'Order packed. Assign driver in Driver App now.' };
    }
    if (order.type === 'PICKUP') {
      return { status: 'READY_FOR_PICKUP', successMessage: 'Order packed and marked ready for pickup.' };
    }
    return { status: 'READY_TO_SERVE', successMessage: 'Order packed and marked ready to serve.' };
  };

  const confirmPackComplete = async () => {
    const orderId = confirmModal.orderId;
    if (!orderId) return;
    
    setConfirmModal({ isOpen: false });
    const targetOrder = orders.find((o) => o.id === orderId) || selectedOrder || undefined;
    const { status: nextStatus, successMessage } = getPackingNextStatus(targetOrder);

    try {
      const response = await fetch(`${API_URL}/api/v1/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, storeId }),
      });

      if (response.ok) {
        // Remove from view after successful API call
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setSelectedOrder(null);
        setChecklistByOrder((prev) => {
          const next = { ...prev };
          delete next[orderId];
          return next;
        });
        showToast(successMessage, 'success');
      } else {
        const detail = await extractServerErrorMessage(response);
        console.error('[Packing] PUT /orders/:id/status failed:', response.status, detail);
        showToast(`Could not update order: ${detail}`, 'error');
      }
    } catch (error) {
      console.error('Error marking as packed:', error);
      const detail = error instanceof Error ? error.message : 'Network error';
      showToast(`Could not update order: ${detail}`, 'error');
    }
  };

  /**
   * Pull display-only branding from the currently selected store so printed slips
   * carry the real store identity instead of "FRESH PIZZA" and a fake phone number.
   */
  const getStoreBranding = () => {
    const s = storeOptions.find((opt) => opt.id === storeId);
    const addressLine = [s?.address, s?.city, s?.state, s?.zipCode].filter(Boolean).join(', ');
    return {
      name: s?.name || 'Restaurant',
      phone: s?.phone || '',
      address: addressLine,
    };
  };

  const handlePrintLabel = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const typeLabel = getTypeLabel(order.type);
    const date = new Date().toLocaleString();
    const items = order.items || [];
    const totalItems = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const branding = getStoreBranding();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Packing Slip - ${order.orderNumber}</title>
  <style>
    @media print {
      @page { margin: 0; size: 80mm 120mm; }
      body { margin: 0; }
    }
    * { box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
      padding: 8mm;
      width: 80mm;
      background: white;
      color: black;
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #000;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .order-number {
      font-size: 32px;
      font-weight: bold;
      margin: 8px 0;
    }
    .token {
      font-size: 28px;
      font-weight: bold;
      text-align: center;
      padding: 12px 8px;
      border: 3px solid #000;
      margin: 8px 0;
      word-break: break-all;
      line-height: 1.2;
    }
    .type-badge {
      display: inline-block;
      padding: 4px 12px;
      border: 2px solid #000;
      font-weight: bold;
      margin: 4px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
    }
    .items {
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      padding: 8px 0;
      margin: 8px 0;
    }
    .item {
      margin: 4px 0;
    }
    .item-qty {
      font-weight: bold;
      margin-right: 8px;
    }
    .modifiers {
      font-size: 10px;
      margin-left: 20px;
      color: #333;
    }
    .notes {
      font-size: 10px;
      color: #c00;
      margin-left: 20px;
    }
    .footer {
      text-align: center;
      margin-top: 8px;
      font-size: 10px;
    }
    .cut-line {
      border-top: 2px dashed #000;
      margin: 16px 0 8px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🍕 ${branding.name}</div>
    <div>${date}</div>
  </div>
  
  <div class="token">#${order.tokenNumber || order.orderNumber}</div>
  
  <div style="text-align: center;">
    <span class="type-badge">${typeLabel.text}${order.tableNumber ? ` - Table ${order.tableNumber}` : ''}</span>
  </div>
  
  ${order.customerName ? `<div style="text-align: center; font-weight: bold; margin: 8px 0;">${order.customerName}</div>` : ''}
  
  <div class="info-row">
    <span>Order #${order.orderNumber}</span>
    <span>${totalItems} items</span>
  </div>
  
  <div class="items">
    ${items.map(item => {
      const modifiersText = item.modifiers?.map((m: any) => {
        if (typeof m === 'string') return m;
        if (typeof m === 'object' && m !== null) {
          return m.name || m.modifierName || m.label || JSON.stringify(m);
        }
        return String(m);
      }).join(', ') || '';
      return `
      <div class="item">
        <span class="item-qty">${item.quantity}x</span>
        <span>${item.productName}</span>
        ${modifiersText ? `<div class="modifiers">${modifiersText}</div>` : ''}
        ${item.notes ? `<div class="notes">⚠ ${item.notes}</div>` : ''}
      </div>
    `}).join('')}
  </div>
  
  <div class="cut-line"></div>
  
  <div class="footer">
    <div>Thank you for your order!</div>
    <div>Please check your items before leaving</div>
  </div>
  
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 200);
    };
  </script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handlePrintPackingSlip = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const typeLabel = getTypeLabel(order.type);
    const date = new Date().toLocaleString();
    const items = order.items || [];
    const totalItems = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const branding = getStoreBranding();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Packing Slip - ${order.orderNumber}</title>
  <style>
    @media print {
      @page { margin: 10mm; size: auto; }
      body { margin: 0; }
      .no-print { display: none; }
    }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
      background: white;
      color: #333;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #000;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
    }
    .logo span {
      font-size: 14px;
      display: block;
      font-weight: normal;
      color: #666;
    }
    .order-info {
      text-align: right;
    }
    .order-number {
      font-size: 24px;
      font-weight: bold;
    }
    .token-box {
      display: inline-block;
      font-size: 48px;
      font-weight: bold;
      padding: 16px 32px;
      border: 4px solid #000;
      margin: 20px 0;
    }
    .type-badge {
      display: inline-block;
      padding: 8px 16px;
      background: ${typeLabel.bgColor || '#f0f0f0'};
      color: ${typeLabel.textColor || '#333'};
      font-weight: bold;
      font-size: 16px;
      margin-bottom: 10px;
    }
    .customer-info {
      background: #f8f8f8;
      padding: 15px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .customer-info h3 {
      margin: 0 0 10px 0;
      font-size: 16px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .items-table th {
      background: #333;
      color: white;
      padding: 12px;
      text-align: left;
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #ddd;
    }
    .items-table tr:nth-child(even) {
      background: #f8f8f8;
    }
    .qty {
      font-weight: bold;
      font-size: 18px;
    }
    .modifiers {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }
    .notes {
      font-size: 12px;
      color: #c00;
      margin-top: 4px;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #000;
      text-align: center;
    }
    .checkbox {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid #000;
      margin-right: 8px;
      vertical-align: middle;
    }
    .packing-check {
      margin: 20px 0;
      padding: 20px;
      background: #f0f8ff;
      border: 2px solid #0066cc;
      border-radius: 8px;
    }
    .packing-check h3 {
      margin: 0 0 15px 0;
      color: #0066cc;
    }
    .check-item {
      margin: 10px 0;
      font-size: 16px;
    }
    .print-btn {
      display: block;
      width: 100%;
      padding: 15px;
      background: #0066cc;
      color: white;
      border: none;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      margin-top: 20px;
    }
    .print-btn:hover {
      background: #0052a3;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      🍕 ${branding.name}
      <span>Packing Station</span>
    </div>
    <div class="order-info">
      <div>Date: ${date}</div>
      <div>Store: ${storeId}</div>
      ${branding.address ? `<div>${branding.address}</div>` : ''}
    </div>
  </div>

  <div style="text-align: center;">
    <div class="token-box">#${order.tokenNumber || order.orderNumber}</div>
  </div>

  <div style="text-align: center;">
    <span class="type-badge">${typeLabel.text}${order.tableNumber ? ` - Table ${order.tableNumber}` : ''}</span>
  </div>

  ${order.customerName ? `
  <div class="customer-info">
    <h3>Customer Information</h3>
    <div style="font-size: 20px; font-weight: bold;">${order.customerName}</div>
  </div>
  ` : ''}

  <h3>Items (${totalItems} total)</h3>
  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 80px;">Qty</th>
        <th>Item</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td class="qty">${item.quantity}</td>
          <td>
            <strong>${item.productName}</strong>
            ${item.modifiers?.length ? `<div class="modifiers">${item.modifiers.join(', ')}</div>` : ''}
            ${item.notes ? `<div class="notes">⚠ ${item.notes}</div>` : ''}
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="packing-check">
    <h3>☐ Packing Checklist</h3>
    <div class="check-item"><span class="checkbox"></span> All items are present</div>
    <div class="check-item"><span class="checkbox"></span> Food is properly packaged and sealed</div>
    <div class="check-item"><span class="checkbox"></span> Condiments/utensils included</div>
    ${order.type === 'DELIVERY' ? '<div class="check-item"><span class="checkbox"></span> Delivery bag sealed</div>' : ''}
    ${order.type === 'DINE_IN' ? '<div class="check-item"><span class="checkbox"></span> Checked for table delivery</div>' : ''}
  </div>

  <div class="footer">
    <p style="font-size: 16px; font-weight: bold;">Thank you for choosing ${branding.name}!</p>
    <p>Please check your order before leaving</p>
    ${
      branding.phone
        ? `<p style="margin-top: 20px; font-size: 12px; color: #666;">Questions? Call us at ${branding.phone}</p>`
        : ''
    }
  </div>

  <button class="print-btn no-print" onclick="window.print()">
    🖨️ Print Packing Slip
  </button>
  
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
      }, 100);
    };
  </script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCookTimeSeconds = (order: Order) => {
    const station = order.items?.[0]?.kitchenStation || 'DEFAULT';
    const cookTimeMinutes = COOK_TIMES[station] || COOK_TIMES.DEFAULT;
    return cookTimeMinutes * 60;
  };

  const getOvenProgress = (order: Order) => {
    // Only show progress for orders in oven (IN_OVEN or IN_PROGRESS with ovenTime)
    if ((!order.ovenTime && order.status !== 'IN_OVEN') || order.ovenDuration === undefined) return 0;
    
    const cookTimeSeconds = getCookTimeSeconds(order);
    const ovenDuration = order.ovenDuration || 0;
    const progress = Math.min((ovenDuration / cookTimeSeconds) * 100, 100);
    return progress;
  };

  const getOvenTimeRemaining = (order: Order) => {
    // Show timer for orders in oven (IN_OVEN or IN_PROGRESS with ovenTime)
    if ((!order.ovenTime && order.status !== 'IN_OVEN') || order.ovenDuration === undefined) return '';
    
    const cookTimeSeconds = getCookTimeSeconds(order);
    const ovenDuration = order.ovenDuration || 0;
    const remaining = Math.max(0, cookTimeSeconds - ovenDuration);
    
    return formatTime(remaining);
  };

  const getPackingTimeRemaining = (order: Order) =>
    Math.max(0, PACKING_REVERSE_TIMER_SECONDS - (order.elapsedTime || 0));

  const isPackingUrgent = (order: Order) =>
    order.status === 'READY' && getPackingTimeRemaining(order) <= 15;

  const getPackingProgress = (order: Order) =>
    Math.min(((order.elapsedTime || 0) / PACKING_REVERSE_TIMER_SECONDS) * 100, 100);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'DINE_IN':
        return { 
          text: 'Dine-In', 
          color: darkMode ? 'bg-purple-900/50 text-purple-300 border border-purple-700' : 'bg-purple-100 text-purple-800',
          bgColor: '#f3e8ff',
          textColor: '#7c3aed',
          icon: '🍽️' 
        };
      case 'PICKUP':
        return { 
          text: 'Pickup', 
          color: darkMode ? 'bg-blue-900/50 text-blue-300 border border-blue-700' : 'bg-blue-100 text-blue-800',
          bgColor: '#dbeafe',
          textColor: '#2563eb',
          icon: '📦' 
        };
      case 'DELIVERY':
        return { 
          text: 'Delivery', 
          color: darkMode ? 'bg-orange-900/50 text-orange-300 border border-orange-700' : 'bg-orange-100 text-orange-800',
          bgColor: '#ffedd5',
          textColor: '#ea580c',
          icon: '🚚' 
        };
      default:
        return { 
          text: type, 
          color: darkMode ? 'bg-gray-800 text-gray-300 border border-gray-600' : 'bg-gray-100 text-gray-800',
          bgColor: '#f3f4f6',
          textColor: '#374151',
          icon: '📋' 
        };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return { 
          text: 'Cooking', 
          color: darkMode ? 'bg-blue-900/50 text-blue-300 border border-blue-700' : 'bg-blue-100 text-blue-700', 
          icon: ChefHat 
        };
      case 'IN_OVEN':
        return { 
          text: 'In Oven', 
          color: darkMode ? 'bg-orange-900/50 text-orange-300 border border-orange-700' : 'bg-orange-100 text-orange-700', 
          icon: Flame 
        };
      case 'READY':
        return { 
          text: 'Ready to Pack', 
          color: darkMode ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-green-100 text-green-700', 
          icon: CheckCircle 
        };
      default:
        return { 
          text: status, 
          color: darkMode ? 'bg-gray-800 text-gray-300 border border-gray-600' : 'bg-gray-100 text-gray-700', 
          icon: Package 
        };
    }
  };

  const getOrderChecklist = (orderId: string) => checklistByOrder[orderId] || {};

  const toggleChecklist = (orderId: string, key: string) => {
    setChecklistByOrder((prev) => {
      const current = prev[orderId] || {};
      return {
        ...prev,
        [orderId]: {
          ...current,
          [key]: !current[key],
        },
      };
    });
  };

  const isChecklistComplete = (order: Order) => {
    const required = ['items', 'packaged', 'utensils'];
    if (order.type === 'DELIVERY') required.push('sealed');
    if (order.type === 'DINE_IN') required.push('table');
    const checklist = getOrderChecklist(order.id);
    return required.every(key => checklist[key]);
  };

  const getPackActionLabel = (order: Order) => {
    if (order.type === 'DELIVERY') return 'MARK PACKED & SEND TO DRIVER QUEUE';
    if (order.type === 'PICKUP') return 'MARK READY FOR PICKUP';
    return 'MARK READY TO SERVE';
  };

  const validOrders = orders.filter(o => o.id && o.id !== 'undefined' && o.id !== 'null');
  // Filter orders that are in oven (IN_OVEN with ovenTime) or in progress
  const inOvenOrders = validOrders.filter(o => 
    (o.status === 'IN_OVEN' && o.ovenTime) || 
    (o.status === 'IN_PROGRESS' && o.ovenTime)
  );
  const inProgressOrders = validOrders.filter(o => 
    o.status === 'IN_PROGRESS' && !o.ovenTime
  );
  const readyOrders = validOrders.filter(o => o.status === 'READY');

  const theme = {
    bg: darkMode ? 'bg-slate-900' : 'bg-gray-100',
    card: darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200',
    cardHover: darkMode ? 'hover:bg-slate-750' : 'hover:bg-gray-50',
    text: darkMode ? 'text-slate-100' : 'text-gray-800',
    textMuted: darkMode ? 'text-slate-400' : 'text-gray-500',
    textSecondary: darkMode ? 'text-slate-300' : 'text-gray-600',
    header: darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200',
    accent: 'text-blue-500',
    selectedBorder: darkMode ? 'border-blue-500' : 'border-blue-500',
  };

  return (
    <div className={`h-screen flex flex-col ${theme.bg} transition-colors duration-300`}>
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Mark as Packed?"
        message={(() => {
          const order = orders.find((o) => o.id === confirmModal.orderId) || selectedOrder;
          if (!order) return 'Confirm status update for this order.';
          if (order.type === 'DELIVERY') return 'This will mark the order PACKED and send it to Driver App for assignment.';
          if (order.type === 'PICKUP') return 'This will mark the order READY FOR PICKUP.';
          return 'This will mark the order READY TO SERVE.';
        })()}
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={confirmPackComplete}
        onCancel={() => setConfirmModal({ isOpen: false })}
        type="success"
      />
      
      {/* Header */}
      <header className={`${theme.header} shadow-sm border-b px-6 py-4 transition-colors duration-300`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <Package className={darkMode ? 'text-blue-400' : 'text-blue-600'} size={28} />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${theme.text}`}>Packing Station</h1>
              <p className={`${theme.textMuted} text-sm`}>Pack orders and print labels</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`text-2xl font-mono ${theme.text}`}>{currentTime.toLocaleTimeString()}</div>
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                darkMode 
                  ? 'border-slate-600 bg-slate-800 text-slate-100' 
                  : 'border-gray-300 bg-white text-gray-800'
              }`}
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
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
              title="Refresh orders"
            >
              <RefreshCw size={20} className={isManualSyncing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleManualReconnect}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                darkMode
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              title="Reconnect socket"
            >
              {isManualReconnecting ? 'Reconnecting...' : 'Reconnect'}
            </button>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="flex gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
              connectionStatus === 'connected'
                ? (darkMode ? 'bg-green-900/20 border-green-500/30' : 'bg-green-50 border-green-200')
                : connectionStatus === 'reconnecting'
                ? (darkMode ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200')
                : (darkMode ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200')
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
                  ? (darkMode ? 'text-green-400' : 'text-green-600')
                  : connectionStatus === 'reconnecting'
                  ? (darkMode ? 'text-yellow-400' : 'text-yellow-600')
                  : (darkMode ? 'text-red-400' : 'text-red-600')
              }`}>
                {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Offline'}
              </span>
            </div>
              {(inOvenOrders.length + inProgressOrders.length) > 0 && (
                <div className={`px-4 py-2 rounded-full font-medium flex items-center gap-2 ${
                  darkMode ? 'bg-orange-900/50 text-orange-300 border border-orange-700' : 'bg-orange-100 text-orange-800'
                }`}>
                  <Flame size={18} />
                  {inOvenOrders.length + inProgressOrders.length} In Kitchen
                </div>
              )}
              <div className={`px-4 py-2 rounded-full font-medium ${
                darkMode ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-green-100 text-green-800'
              }`}>
                {readyOrders.length} Ready to Pack
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {isLoading ? (
          <div className={`flex-1 flex items-center justify-center ${theme.textMuted}`}>
            <RefreshCw size={32} className="animate-spin mr-3" />
            Loading orders...
          </div>
        ) : (
          <>
            {/* Orders List */}
            <div className={`w-1/2 p-4 overflow-y-auto border-r ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className={`mb-4 rounded-xl p-3 border ${darkMode ? 'bg-cyan-950/30 border-cyan-800 text-cyan-200' : 'bg-cyan-50 border-cyan-200 text-cyan-800'}`}>
                <p className="font-semibold text-sm mb-1">Packing Flow Guidance</p>
                <p className="text-xs">Pickup: Pack to READY FOR PICKUP, then hide from Packing (complete only after customer collects).</p>
                <p className="text-xs">Delivery: Pack to Driver Queue/Out for Delivery (complete only after delivered).</p>
              </div>
              {inOvenOrders.length > 0 && (
                <div className="mb-6">
                  <h2 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                    <Flame size={20} />
                    In Oven ({inOvenOrders.length})
                  </h2>
                  <div className="space-y-3">
                    {inOvenOrders.map((order) => {
                      const typeInfo = getTypeLabel(order.type);
                      const statusInfo = getStatusBadge(order.status);
                      const StatusIcon = statusInfo.icon;
                      const progress = getOvenProgress(order);
                      const timeRemaining = getOvenTimeRemaining(order);
                      
                      const isDone = progress >= 100;
                      const isAlmostDone = progress >= 80 && !isDone;
                      
                      return (
                        <div
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className={`${theme.card} rounded-xl shadow p-4 cursor-pointer transition-all hover:shadow-lg border-l-4 ${
                            selectedOrder?.id === order.id
                              ? 'border-orange-500'
                              : isDone
                              ? 'border-green-500'
                              : isAlmostDone
                              ? 'border-yellow-400'
                              : 'border-orange-500'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-2xl font-bold ${theme.text} truncate`}>
                                  #{order.tokenNumber || order.orderNumber || order.id?.slice(-6) || 'N/A'}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-sm whitespace-nowrap ${typeInfo.color}`}>
                                  {typeInfo.icon} {typeInfo.text}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <StatusIcon size={14} className={isDone ? 'text-green-400' : darkMode ? 'text-orange-400' : 'text-orange-600'} />
                                <span className={isDone ? 'text-green-400' : darkMode ? 'text-orange-400' : 'text-orange-600'}>
                                  {isDone ? 'Done!' : statusInfo.text}
                                </span>
                              </div>
                              {order.customerName && (
                                <p className={`text-sm mt-1 truncate ${theme.textSecondary}`}>{order.customerName}</p>
                              )}
                            </div>
                            <div className="text-right ml-3">
                              <div className={`font-mono font-bold text-2xl ${
                                isDone 
                                  ? 'text-green-400' 
                                  : isAlmostDone 
                                  ? 'text-yellow-400 animate-pulse' 
                                  : darkMode ? 'text-orange-400' : 'text-orange-600'
                              }`}>
                                {timeRemaining}
                              </div>
                              <div className={`text-xs ${theme.textMuted}`}>remaining</div>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            {(order.items || []).length > 0 && (
                              <div className={`text-sm ${theme.textSecondary} mb-2 truncate`}>
                                <span className="font-medium">{order.items[0].quantity}x</span> {order.items[0].productName}
                              </div>
                            )}
                            <div className={`flex justify-between text-xs mb-1 ${theme.textMuted}`}>
                              <span>Oven Timer</span>
                              <span className={isDone ? 'text-green-400 font-semibold' : ''}>{isDone ? 'Complete!' : `${Math.round(progress)}%`}</span>
                            </div>
                            <div className={`h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                              <div 
                                className={`h-full transition-all duration-1000 ${
                                  isDone 
                                    ? 'bg-gradient-to-r from-green-500 to-green-400' 
                                    : isAlmostDone 
                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 animate-pulse'
                                    : 'bg-gradient-to-r from-orange-500 to-red-500'
                                }`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* In Progress Orders (not yet in oven) */}
              {inProgressOrders.length > 0 && (
                <div className="mb-6">
                  <h2 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    <ChefHat size={20} />
                    In Progress ({inProgressOrders.length})
                  </h2>
                  <div className="space-y-3">
                    {inProgressOrders.map((order) => {
                      const typeInfo = getTypeLabel(order.type);
                      return (
                        <div
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className={`${theme.card} rounded-xl shadow p-4 cursor-pointer transition-all hover:shadow-lg border-2 ${
                            selectedOrder?.id === order.id
                              ? 'border-blue-500'
                              : 'border-transparent'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-2xl font-bold ${theme.text}`}>
                                  #{order.tokenNumber || order.orderNumber || order.id?.slice(-6) || 'N/A'}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-sm ${typeInfo.color}`}>
                                  {typeInfo.icon} {typeInfo.text}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <ChefHat size={14} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                                <span className={darkMode ? 'text-blue-400' : 'text-blue-600'}>Preparing</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <h2 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${theme.text}`}>
                  <CheckCircle size={20} className={darkMode ? 'text-green-400' : 'text-green-600'} />
                  Ready to Pack ({readyOrders.length})
                </h2>

                <div className="space-y-3">
                  {readyOrders.length === 0 && inOvenOrders.length === 0 && inProgressOrders.length === 0 ? (
                    <div className={`text-center py-12 ${theme.textMuted}`}>
                      <Package size={64} className="mx-auto mb-4 opacity-30" />
                      <p className="text-lg">No orders ready for packing</p>
                      <p className="mb-4">Orders will appear here when kitchen marks them ready</p>
                      <button
                        type="button"
                        onClick={() => { setIsLoading(true); fetchOrders(); }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                      >
                        <RefreshCw size={16} />
                        Refresh now
                      </button>
                    </div>
                  ) : (
                    readyOrders.map((order) => {
                      const typeInfo = getTypeLabel(order.type);
                      const statusInfo = getStatusBadge(order.status);
                      const StatusIcon = statusInfo.icon;
                      const reverseRemaining = getPackingTimeRemaining(order);
                      const reverseProgress = getPackingProgress(order);
                      const urgent = isPackingUrgent(order);
                      return (
                        <div
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className={`${theme.card} rounded-xl shadow p-4 cursor-pointer transition-all hover:shadow-lg border-2 ${
                            selectedOrder?.id === order.id
                              ? theme.selectedBorder
                              : urgent
                              ? (darkMode ? 'border-red-500/60' : 'border-red-400')
                              : 'border-transparent'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-2xl font-bold ${theme.text}`}>
                                  #{order.tokenNumber || order.orderNumber}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-sm ${typeInfo.color}`}>
                                  {typeInfo.icon} {typeInfo.text}
                                </span>
                              </div>
                              {order.customerName && (
                                <p className={theme.textSecondary}>{order.customerName}</p>
                              )}
                              {order.tableNumber && (
                                <p className="text-purple-400 font-medium">
                                  Table {order.tableNumber}
                                </p>
                              )}
                              <div className="mt-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${statusInfo.color}`}>
                                  <StatusIcon size={12} />
                                  {statusInfo.text}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div
                                className={`font-mono font-bold ${
                                  urgent
                                    ? 'text-red-500 animate-pulse'
                                    : darkMode ? 'text-green-400' : 'text-green-600'
                                }`}
                              >
                                {formatTime(reverseRemaining)}
                              </div>
                              <p className={`${theme.textMuted} text-xs`}>pack timer</p>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className={`h-2 rounded-full overflow-hidden mb-2 ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                              <div
                                className={`h-full transition-all duration-1000 ${urgent ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${reverseProgress}%` }}
                              />
                            </div>
                            <div className={`text-xs ${theme.textMuted} mb-1`}>
                              {(order.items || []).length} items •{' '}
                              {(order.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0)} total
                            </div>
                            <div className={`text-xs font-medium mb-1 ${
                              order.type === 'DELIVERY'
                                ? (darkMode ? 'text-orange-300' : 'text-orange-700')
                                : order.type === 'PICKUP'
                                ? (darkMode ? 'text-cyan-300' : 'text-cyan-700')
                                : (darkMode ? 'text-purple-300' : 'text-purple-700')
                            }`}>
                              Next: {order.type === 'DELIVERY' ? 'Pack and send to Driver Queue' : order.type === 'PICKUP' ? 'Pack and mark Ready for Pickup' : 'Pack and mark Ready to Serve'}
                            </div>
                            <div className="space-y-1">
                              {(order.items || []).slice(0, 3).map((item, idx) => (
                                <div key={idx} className={`text-sm ${theme.textSecondary} truncate`}>
                                  <span className="font-medium">{item.quantity}x</span>{' '}
                                  {item.productName}
                                </div>
                              ))}
                              {(order.items || []).length > 3 && (
                                <div className={`text-xs ${theme.textMuted}`}>
                                  +{(order.items || []).length - 3} more items...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Order Detail / Packing View */}
            <div className={`w-1/2 ${theme.card} p-4 overflow-y-auto`}>
              {selectedOrder ? (
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className={`text-3xl font-bold ${theme.text}`}>
                        Order #{selectedOrder.tokenNumber || selectedOrder.orderNumber}
                      </h2>
                      {selectedOrder.customerName && (
                        <p className={`text-lg ${theme.textSecondary} mt-1`}>
                          {selectedOrder.customerName}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePrintPackingSlip(selectedOrder)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          darkMode 
                            ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        <FileText size={18} />
                        Packing Slip
                      </button>
                      <button
                        onClick={() => handlePrintLabel(selectedOrder)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          darkMode 
                            ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                            : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                        }`}
                      >
                        <Printer size={18} />
                        Label
                      </button>
                    </div>
                  </div>

                  <div className="mb-6">
                    {(() => {
                      const typeInfo = getTypeLabel(selectedOrder.type);
                      const statusInfo = getStatusBadge(selectedOrder.status);
                      return (
                        <div className="flex items-center gap-3">
                          <span className={`px-4 py-2 rounded-lg text-lg font-medium ${typeInfo.color}`}>
                            {typeInfo.icon} {typeInfo.text}
                            {selectedOrder.tableNumber && ` - Table ${selectedOrder.tableNumber}`}
                          </span>
                          <span className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${statusInfo.color}`}>
                            <statusInfo.icon size={16} />
                            {statusInfo.text}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  <div className={`mb-6 p-4 rounded-xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-blue-50 border-blue-200'}`}>
                    <h3 className={`font-semibold mb-2 ${theme.text}`}>Flow Guidance</h3>
                    {selectedOrder.type === 'DELIVERY' ? (
                      <p className={`${theme.textSecondary} text-sm`}>
                        Mark this order as packed first. It will appear in Driver App for assignment. Mark order completed only after driver marks it delivered.
                      </p>
                    ) : selectedOrder.type === 'PICKUP' ? (
                      <p className={`${theme.textSecondary} text-sm`}>
                        Mark this order ready for pickup after packing. Mark completed when customer has actually collected the order.
                      </p>
                    ) : (
                      <p className={`${theme.textSecondary} text-sm`}>
                        Mark this order ready to serve after packing. Mark completed only after it is served/closed on POS.
                      </p>
                    )}
                  </div>

                  {selectedOrder.status === 'READY' && (
                    <div className={`mb-6 p-4 rounded-xl border ${
                      isPackingUrgent(selectedOrder)
                        ? (darkMode ? 'bg-red-950/30 border-red-700' : 'bg-red-50 border-red-300')
                        : (darkMode ? 'bg-emerald-950/20 border-emerald-800' : 'bg-emerald-50 border-emerald-200')
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`font-semibold ${isPackingUrgent(selectedOrder) ? 'text-red-500' : (darkMode ? 'text-emerald-300' : 'text-emerald-700')}`}>
                          Packing Reverse Timer
                        </p>
                        <p className={`font-mono text-2xl font-bold ${isPackingUrgent(selectedOrder) ? 'text-red-500 animate-pulse' : (darkMode ? 'text-emerald-300' : 'text-emerald-700')}`}>
                          {formatTime(getPackingTimeRemaining(selectedOrder))}
                        </p>
                      </div>
                      <div className={`h-3 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}>
                        <div
                          className={`h-full transition-all duration-1000 ${isPackingUrgent(selectedOrder) ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{ width: `${getPackingProgress(selectedOrder)}%` }}
                        />
                      </div>
                      <p className={`text-xs mt-2 ${theme.textMuted}`}>
                        Status: {getStatusBadge(selectedOrder.status).text}. {isPackingUrgent(selectedOrder) ? 'Less than 15 seconds left - prioritize this order.' : 'Countdown running.'}
                      </p>
                    </div>
                  )}

                  {selectedOrder.status === 'IN_OVEN' && (
                    <div className={`mb-6 p-4 rounded-xl border ${
                      darkMode 
                        ? 'bg-orange-950/30 border-orange-800' 
                        : 'bg-orange-50 border-orange-200'
                    }`}>
                      {/* Large Countdown Display */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Flame className={darkMode ? 'text-orange-400' : 'text-orange-500'} size={28} />
                          <span className={`font-semibold text-lg ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                            In Oven
                          </span>
                        </div>
                        <div className="text-right">
                          <div className={`font-mono font-bold text-4xl ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                            {getOvenTimeRemaining(selectedOrder)}
                          </div>
                          <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>remaining</div>
                        </div>
                      </div>

                      {selectedOrder.items?.[0] && (
                        <div className="mb-4">
                          <PackingItemCard item={selectedOrder.items[0]} darkMode={darkMode} />
                        </div>
                      )}
                      {/* Order Details */}
                      <div className={`hidden mb-4 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-bold text-xl">{selectedOrder.items?.[0]?.quantity || 1}x</span>
                          <span className="font-semibold text-lg">{selectedOrder.items?.[0]?.productName || 'Item'}</span>
                        </div>
                        {selectedOrder.items?.[0]?.modifiers && selectedOrder.items[0].modifiers.length > 0 && (
                          <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'} ml-6`}>
                            {(() => {
                              const mods = selectedOrder.items[0].modifiers;
                              if (!Array.isArray(mods)) return String(mods);
                              return mods.map((m: any) => {
                                if (typeof m === 'string') return m;
                                if (typeof m === 'object' && m !== null) {
                                  return m.name || m.modifierName || m.label || JSON.stringify(m);
                                }
                                return String(m);
                              }).join(', ');
                            })()}
                          </div>
                        )}
                        {selectedOrder.items?.[0]?.notes && (
                          <div className="text-sm text-orange-500 font-medium ml-6 mt-1">
                            ⚠️ {selectedOrder.items[0].notes}
                          </div>
                        )}
                      </div>

                      {/* Oven Timer Section */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Oven Timer</span>
                          <span className={`font-mono font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                            {getOvenTimeRemaining(selectedOrder)} remaining
                          </span>
                        </div>
                        <div className={`h-3 rounded-full overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                          <div 
                            className={`h-full transition-all duration-1000 ${
                              getOvenProgress(selectedOrder) >= 100 
                                ? 'bg-gradient-to-r from-green-500 to-green-400' 
                                : getOvenProgress(selectedOrder) >= 80 
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 animate-pulse'
                                : 'bg-gradient-to-r from-orange-500 to-red-500'
                            }`}
                            style={{ width: `${Math.min(getOvenProgress(selectedOrder), 100)}%` }}
                          />
                        </div>
                        <div className={`text-center text-xs mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          {(() => {
                            const station = selectedOrder.items?.[0]?.kitchenStation || 'DEFAULT';
                            const cookTimeMinutes = COOK_TIMES[station] || COOK_TIMES.DEFAULT;
                            return `${cookTimeMinutes} min cook time • Auto-advances when done`;
                          })()}
                        </div>
                      </div>

                      {/* Push to Pack Button (when timer is done) */}
                      {getOvenProgress(selectedOrder) >= 100 && (
                        <button
                          type="button"
                          onClick={() => handlePackComplete(selectedOrder.id)}
                          disabled={!isChecklistComplete(selectedOrder)}
                          title={
                            isChecklistComplete(selectedOrder)
                              ? 'Mark order packed and route it to its next destination'
                              : 'Complete every checklist item to enable this button'
                          }
                          className="w-full mt-3 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
                        >
                          <PackageCheck size={20} />
                          PUSH TO PACK
                        </button>
                      )}
                    </div>
                  )}

                  <div className={`rounded-xl p-4 mb-6 ${darkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                    <h3 className={`font-semibold mb-3 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Items to Pack</h3>
                    <div className="space-y-3">
                      {(selectedOrder.items || []).map((item, idx) => {
                        return <PackingItemCard key={`${item.id || item.productName}-${idx}`} item={item} darkMode={darkMode} />;
                        return (
                        <div key={idx} className={`p-3 rounded-lg shadow-sm ${darkMode ? 'bg-slate-700' : 'bg-white'}`}>
                          <div className="flex items-center gap-3">
                            <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">
                              {item.quantity || 1}
                            </span>
                            <div className="flex-1">
                              <span className={`font-medium ${theme.text}`}>
                                {item.productName || 'Unknown Item'}
                              </span>
                              {item.modifiers && item.modifiers.length > 0 && (
                                <div className={`text-sm ${theme.textMuted}`}>
                                  {(() => {
                                    if (!Array.isArray(item.modifiers)) return String(item.modifiers);
                                    return item.modifiers.map((m: any) => {
                                      if (typeof m === 'string') return m;
                                      if (typeof m === 'object' && m !== null) {
                                        return m.name || m.modifierName || m.label || m.optionName || JSON.stringify(m);
                                      }
                                      return String(m);
                                    }).join(', ');
                                  })()}
                                </div>
                              )}
                              {item.notes && (
                                <div className="text-sm text-orange-500 font-medium">
                                  ⚠️ {item.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>

                  {selectedOrder.status === 'READY' && (
                    <div className={`rounded-xl p-4 mb-6 ${
                      darkMode ? 'bg-slate-800/50' : 'bg-gray-50'
                    }`}>
                      <h3 className={`font-semibold mb-3 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                        Packing Checklist
                      </h3>
                      <div className="space-y-2">
                        {[
                          { key: 'items', label: 'All items are present' },
                          { key: 'packaged', label: 'Food is properly packaged and sealed' },
                          { key: 'utensils', label: 'Condiments/utensils included' },
                          ...(selectedOrder.type === 'DELIVERY' ? [{ key: 'sealed', label: 'Delivery bag sealed' }] : []),
                          ...(selectedOrder.type === 'DINE_IN' ? [{ key: 'table', label: 'Checked for table delivery' }] : []),
                        ].map(({ key, label }) => (
                          <label
                            key={key}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                              getOrderChecklist(selectedOrder.id)[key]
                                ? (darkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200')
                                : (darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-white hover:bg-gray-50 border border-gray-200')
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={getOrderChecklist(selectedOrder.id)[key] || false}
                              onChange={() => toggleChecklist(selectedOrder.id, key)}
                              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className={theme.text}>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedOrder.status === 'READY' && (
                    <button
                      onClick={() => handlePackComplete(selectedOrder.id)}
                      disabled={!isChecklistComplete(selectedOrder)}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                        isChecklistComplete(selectedOrder)
                          ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/25'
                          : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      }`}
                    >
                      {isChecklistComplete(selectedOrder) ? `✓ ${getPackActionLabel(selectedOrder)}` : 'Complete Checklist First'}
                    </button>
                  )}
                </div>
              ) : (
                <div className={`h-full flex flex-col items-center justify-center ${theme.textMuted}`}>
                  <Package size={80} className="mb-6 opacity-30" />
                  <p className="text-xl font-medium">Select an order to pack</p>
                  <p className="mt-2">Click on an order from the list to view details and print labels</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
