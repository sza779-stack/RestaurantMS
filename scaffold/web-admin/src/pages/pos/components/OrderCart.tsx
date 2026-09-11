import React from 'react';
import { Minus, PauseCircle, Plus, Receipt, ShoppingCart, Trash2 } from 'lucide-react';
import { CartItem } from '../types';

interface OrderCartProps {
  items: CartItem[];
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
  onApplyDiscount?: (discount: { type: 'percentage' | 'fixed'; value: number }) => void;
  totals: {
    subtotal: number;
    tax: number;
    total: number;
    itemCount: number;
  };
  onCheckout: () => void;
  onSuspend: () => void;
}

const normalizeAddonName = (name: string) =>
  name
    .replace(/\s*\((left|right|full|whole)\)\s*$/i, '')
    .replace(/^(light|regular|extra)\s+/i, '')
    .trim()
    .toLowerCase();

const getCartPillClass = (name: string) => {
  const normalized = normalizeAddonName(name);
  if (/(pepperoni|sausage|ham|bacon|chicken|beef|meat)/.test(normalized)) {
    return 'border-red-500/40 bg-red-600/15 text-red-100 dark:bg-red-500/20 dark:text-red-100';
  }
  if (/(green pepper|spinach|jalapeno|jalapeño|onion|mushroom|pineapple|vegetable|veggie)/.test(normalized)) {
    return 'border-emerald-500/40 bg-emerald-600/15 text-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-100';
  }
  if (/(tomato|classic tomato|pizza sauce|buffalo sauce)/.test(normalized)) {
    return 'border-red-400/40 bg-red-500/15 text-red-100 dark:bg-red-500/20 dark:text-red-100';
  }
  if (/(bbq|barbecue)/.test(normalized)) {
    return 'border-orange-500/40 bg-orange-700/20 text-orange-100 dark:bg-orange-700/25 dark:text-orange-100';
  }
  if (/(alfredo|ranch|garlic|parmesan)/.test(normalized)) {
    return 'border-stone-300/40 bg-stone-200/15 text-stone-100 dark:bg-stone-300/15 dark:text-stone-100';
  }
  if (/(cheese|mozzarella|cheddar)/.test(normalized)) {
    return 'border-amber-400/40 bg-amber-400/15 text-amber-100 dark:bg-amber-400/20 dark:text-amber-100';
  }
  if (/(black olive|olive)/.test(normalized)) {
    return 'border-slate-400/40 bg-slate-600/25 text-slate-100 dark:bg-slate-600/35 dark:text-slate-100';
  }
  return 'border-slate-400/30 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
};

const OrderCart: React.FC<OrderCartProps> = ({
  items,
  onRemove,
  onUpdateQuantity,
  totals,
  onCheckout,
  onSuspend,
}) => {
  return (
    <aside className="w-[380px] 2xl:w-[410px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col transition-colors">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-slate-950 dark:text-white text-lg flex items-center gap-2">
              <Receipt size={20} className="text-orange-500" />
              Current Order
            </h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {totals.itemCount} item{totals.itemCount === 1 ? '' : 's'} in cart
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={onSuspend}
              className="min-h-10 px-3 py-2 text-xs font-black text-slate-700 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-2"
            >
              <PauseCircle size={15} />
              Suspend
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/70 dark:bg-slate-950/30">
        {items.length === 0 ? (
          <div className="h-full min-h-[360px] flex items-center justify-center">
            <div className="text-center text-slate-400 dark:text-slate-500">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <ShoppingCart size={28} />
              </div>
              <p className="text-base font-black text-slate-600 dark:text-slate-300">Cart is empty</p>
              <p className="text-sm font-medium mt-1">Add items from the menu to begin.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => {
              const addonsTotal = (item.addons || []).reduce(
                (sum, a) => sum + Number(a.price || 0),
                0
              );
              const itemTotal =
                (Number(item.unitPrice || 0) + addonsTotal) * item.quantity;

              return (
                <div
                  key={item.id}
                  className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl text-sm transition-shadow border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200 text-xs font-black">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-black text-slate-950 dark:text-white leading-tight">{item.productName}</div>
                          {item.sizeName && (
                            <div className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-1">{item.sizeName}</div>
                          )}
                        </div>
                        <button
                          onClick={() => onRemove(item.id)}
                          className="min-h-9 min-w-9 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center justify-center"
                          aria-label={`Remove ${item.productName}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>

                      {(item.addons || []).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
	                          {item.addons.map((addon, addonIndex) => (
	                            <span
	                              key={`${addon.addonId}-${addonIndex}`}
	                              className={`rounded-full border px-2 py-1 text-[11px] font-black shadow-sm ${getCartPillClass(addon.name || '')}`}
	                            >
	                              {addon.name}
                              {Number(addon.price || 0) > 0 ? ` +$${Number(addon.price).toFixed(2)}` : ''}
                            </span>
                          ))}
                        </div>
                      )}

                      {item.notes && (
                        <div className="text-amber-700 dark:text-amber-300 text-xs mt-2 italic leading-tight">
                          Note: {item.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pl-10">
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.id, item.quantity - 1)
                        }
                        className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors font-bold"
                        aria-label={`Decrease ${item.productName}`}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-black text-slate-900 dark:text-white">{item.quantity}</span>
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.id, item.quantity + 1)
                        }
                        className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors font-bold"
                        aria-label={`Increase ${item.productName}`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="font-black text-slate-950 dark:text-white text-lg">
                      ${itemTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between text-slate-500 dark:text-slate-400 font-semibold">
            <span>Subtotal</span>
            <span className="text-slate-900 dark:text-slate-100">${totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-500 dark:text-slate-400 font-semibold">
            <span>Tax</span>
            <span className="text-slate-900 dark:text-slate-100">${totals.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-2xl font-black pt-3 border-t border-slate-200 dark:border-slate-800 mt-3">
            <span className="text-slate-950 dark:text-white">Total</span>
            <span className="text-orange-600 dark:text-orange-300">${totals.total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={onCheckout}
          disabled={items.length === 0}
          className="mt-5 w-full min-h-14 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl font-black hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20 uppercase tracking-widest text-sm"
        >
          Checkout
        </button>
      </div>
    </aside>
  );
};

export default OrderCart;
