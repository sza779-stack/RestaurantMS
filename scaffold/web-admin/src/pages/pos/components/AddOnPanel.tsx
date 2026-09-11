import React, { useState, useEffect } from 'react';
import { Plus, Minus, X, ShoppingCart, Check, Info } from 'lucide-react';

interface AddOnPanelProps {
  product: any;
  onAdd: (item: any) => void;
  onCancel: () => void;
}

const categoryEmojis: Record<string, string> = {
  'Pizza': '🍕',
  'Pasta': '🍝',
  'Subs': '🥪',
  'Wings': '🍗',
  'Sides': '🍟',
  'Drinks': '🥤',
  'Dessert': '🍰',
};

type ToppingSide = 'LEFT' | 'RIGHT' | 'FULL';
type ToppingAmount = 'LIGHT' | 'REGULAR' | 'EXTRA';

const toppingAmountOptions: Array<{ id: ToppingAmount; label: string; multiplier: number }> = [
  { id: 'LIGHT', label: 'Light', multiplier: 0.75 },
  { id: 'REGULAR', label: 'Regular', multiplier: 1 },
  { id: 'EXTRA', label: 'Extra', multiplier: 1.5 },
];

const toppingAmountLabel = (amount?: ToppingAmount) => {
  if (amount === 'LIGHT') return 'Light';
  if (amount === 'EXTRA') return 'Extra';
  return 'Regular';
};

const toppingNameWithAmount = (name: string, amount?: ToppingAmount) => {
  const label = toppingAmountLabel(amount);
  return label === 'Regular' ? name : `${label} ${name}`;
};

const AddOnPanel: React.FC<AddOnPanelProps> = ({
  product,
  onAdd,
  onCancel,
}) => {
  const [selectedSize, setSelectedSize] = useState<any>(
    product.sizes?.[0] || null
  );
  
  // Customization state: map of addonId -> current selection count/metadata
  const [selections, setSelections] = useState<Record<string, any>>(() => {
    const defaults = product.configuration?.default_addons || [];
    const initial: Record<string, any> = {};
    
    // Auto-select defaults from the product config
    product.addonSets?.forEach((pas: any) => {
      pas.addonSet?.addons?.forEach((sa: any) => {
        if (defaults.includes(sa.addonId)) {
          initial[sa.addonId] = {
            addonId: sa.addonId,
            name: sa.addon?.name,
            price: 0, // Defaults are usually included in base price
            quantity: 1,
            type: sa.addon?.type,
            category: sa.addon?.category
          };
        }
      });
    });
    return initial;
  });

  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const isPizzaProduct = String(product.category?.name || product.type || '').toLowerCase().includes('pizza');

  const isPizzaToppingSet = (set: any) => {
    if (!isPizzaProduct) return false;
    const setName = String(set?.name || '').toLowerCase();
    if (setName.includes('topping') || setName.includes('vegetable') || setName.includes('veggie') || setName.includes('meat')) return true;
    return set?.addons?.some((sa: any) => {
      const category = String(sa.addon?.category || '').toLowerCase();
      return category.includes('vegetable') || category.includes('veggie') || category.includes('meat') || category.includes('topping');
    });
  };

  const getAddonPrice = (sa: any) => {
    if (sa.priceOverride !== null && sa.priceOverride !== undefined) return Number(sa.priceOverride);
    const sizeCode = selectedSize?.code?.toUpperCase();
    const sizePrice = sa.addon?.sizePrices?.[sizeCode];
    if (sizePrice !== undefined && sizePrice !== null && Number(sizePrice) > 0) return Number(sizePrice);
    return Number(sa.addon?.price || 0);
  };

	  const pricedForTopping = (price: number, side?: ToppingSide, amount?: ToppingAmount) => {
	    const sideMultiplier = side === 'LEFT' || side === 'RIGHT' ? 0.5 : 1;
	    const amountMultiplier = toppingAmountOptions.find((option) => option.id === (amount || 'REGULAR'))?.multiplier || 1;
	    return price * sideMultiplier * amountMultiplier;
	  };

	  const sideLabel = (side?: ToppingSide) => {
	    if (side === 'LEFT') return 'Left';
	    if (side === 'RIGHT') return 'Right';
	    return 'Full';
  };
 
  const toggleAddon = (set: any, sa: any) => {
    const addonId = sa.addonId;
    const isSelected = !!selections[addonId];
    
    if (isSelected) {
      const newSelections = { ...selections };
      delete newSelections[addonId];
      setSelections(newSelections);
    } else {
      // Check limits
      const setItemsInThisSet = set.addons.map((a: any) => a.addonId);
      const currentCountInSet = Object.keys(selections).filter(id => setItemsInThisSet.includes(id)).length;
      
      if (set.maxSelect && currentCountInSet >= set.maxSelect) {
        // If maxSelect is 1 (radio behavior), swap selection
        if (set.maxSelect === 1) {
          const newSelections = { ...selections };
          setItemsInThisSet.forEach((id: string) => delete newSelections[id]);
          newSelections[addonId] = {
            addonId,
            name: sa.addon?.name,
            price: getAddonPrice(sa),
            quantity: 1,
            type: sa.addon?.type,
            category: sa.addon?.category,
            sa: sa // Store the full sa object for re-calculating price if size changes
          };
          setSelections(newSelections);
          return;
        }
        return; // Limit reached
      }
 
      setSelections({
        ...selections,
        [addonId]: {
          addonId,
          name: sa.addon?.name,
          price: getAddonPrice(sa),
          quantity: 1,
          type: sa.addon?.type,
          category: sa.addon?.category,
          sa: sa
        }
      });
    }
  };

	  const setPizzaToppingSelection = (set: any, sa: any, side: ToppingSide, amount: ToppingAmount, allowDeselect = false) => {
	    const addonId = sa.addonId;
	    const existing = selections[addonId];
	    const newSelections = { ...selections };

	    if (allowDeselect && existing?.side === side && existing?.amount === amount) {
	      delete newSelections[addonId];
	      setSelections(newSelections);
	      return;
    }

    const setItemsInThisSet = set.addons.map((a: any) => a.addonId);
    const currentCountInSet = Object.keys(selections).filter(id => setItemsInThisSet.includes(id)).length;
    if (!existing && set.maxSelect && currentCountInSet >= set.maxSelect) return;

	    const basePrice = getAddonPrice(sa);
	    newSelections[addonId] = {
	      addonId,
	      name: `${toppingNameWithAmount(sa.addon?.name, amount)} (${sideLabel(side)})`,
	      displayName: sa.addon?.name,
	      price: pricedForTopping(basePrice, side, amount),
	      basePrice,
	      quantity: 1,
	      type: sa.addon?.type,
	      category: sa.addon?.category,
	      side,
	      amount,
	      sa
	    };
	    setSelections(newSelections);
	  };

	  const selectToppingSide = (set: any, sa: any, side: ToppingSide) => {
	    const amount = (selections[sa.addonId]?.amount || 'REGULAR') as ToppingAmount;
	    setPizzaToppingSelection(set, sa, side, amount, true);
	  };

	  const selectToppingAmount = (set: any, sa: any, amount: ToppingAmount) => {
	    const side = (selections[sa.addonId]?.side || 'FULL') as ToppingSide;
	    setPizzaToppingSelection(set, sa, side, amount);
	  };
 
  // Update prices in selections when size changes
  useEffect(() => {
    setSelections(prev => {
      const next = { ...prev };
      let changed = false;
      Object.keys(next).forEach(id => {
        const item = next[id];
	        if (item.sa) {
	          const basePrice = getAddonPrice(item.sa);
	          const newPrice = item.side ? pricedForTopping(basePrice, item.side, item.amount) : basePrice;
	          if (newPrice !== item.price) {
	            next[id] = {
	              ...item,
	              basePrice,
	              price: newPrice,
	              name: item.side ? `${toppingNameWithAmount(item.displayName || item.name, item.amount)} (${sideLabel(item.side)})` : item.name,
	            };
	            changed = true;
	          }
	        }
      });
      return changed ? next : prev;
    });
  }, [selectedSize]);

  const calculateTotal = () => {
    const basePrice = Number(product.basePrice || 0);
    const sizePriceAdjustment = selectedSize?.priceAdjustment || 0;
    const addonsTotal = Object.values(selections).reduce((sum, s: any) => sum + Number(s.price || 0), 0);
    return (basePrice + Number(sizePriceAdjustment) + addonsTotal) * quantity;
  };

  const handleAdd = () => {
    // Validation: check minSelect for each set
    for (const pas of product.addonSets || []) {
      const set = pas.addonSet;
      if (set.minSelect > 0) {
        const setItemsInThisSet = set.addons.map((a: any) => a.addonId);
        const currentCount = Object.keys(selections).filter(id => setItemsInThisSet.includes(id)).length;
        if (currentCount < set.minSelect) {
          alert(`Please select at least ${set.minSelect} from ${set.name}`);
          return;
        }
      }
    }

    onAdd({
      productId: product.id,
      productName: product.name,
      sizeId: selectedSize?.id,
      sizeName: selectedSize?.name,
      quantity,
      unitPrice: calculateTotal() / quantity,
      addons: Object.values(selections),
      notes,
      kitchenStation: product.kitchenStation || 'GENERAL',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header Section */}
        <div className="bg-slate-900 p-8 text-white relative">
          <button onClick={onCancel} className="absolute right-6 top-6 p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
          
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center text-4xl shadow-inner italic">
              {categoryEmojis[product.category?.name] || '🍽️'}
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">{product.name}</h2>
              <p className="text-slate-400 font-medium uppercase text-xs tracking-widest mt-1">
                {product.category?.name || 'Menu Item'} • {product.type}
              </p>
            </div>
          </div>
          
          {product.description && (
            <p className="mt-6 text-slate-300 text-sm leading-relaxed max-w-lg">
              {product.description}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {/* Size Selector */}
          {product.sizes?.length > 0 && (
            <div className="mb-10">
              <label className="text-[11px] font-black uppercase text-slate-400 mb-4 block tracking-widest">Select Size</label>
              <div className="grid grid-cols-3 gap-3">
                {product.sizes.map((size: any) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size)}
                    className={`p-4 rounded-2xl border-2 text-center transition-all ${
                      selectedSize?.id === size.id
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                        : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'
                    }`}
                  >
                    <div className="font-bold text-sm mb-1">{size.name}</div>
                    <div className={`text-xs font-medium ${selectedSize?.id === size.id ? 'text-blue-100' : 'text-slate-400'}`}>
                      +${Number(size.priceAdjustment || 0).toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic AddOn Sets */}
          {product.addonSets?.map((pas: any) => {
            const set = pas.addonSet;
            const setItemsInThisSet = set.addons.map((a: any) => a.addonId);
            const currentCount = Object.keys(selections).filter(id => setItemsInThisSet.includes(id)).length;
            const pizzaToppingSet = isPizzaToppingSet(set);
	            
            return (
              <div key={set.id} className="mb-10 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest leading-none">
                      {set.name}
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                      {set.minSelect > 0 ? `Required: ${set.minSelect}` : 'Optional'} 
                      {set.maxSelect ? ` • Max: ${set.maxSelect}` : ''}
                    </p>
                  </div>
                  {currentCount < set.minSelect && (
                    <span className="flex items-center gap-1 text-[10px] bg-red-50 text-red-500 px-2 py-1 rounded-full font-bold">
                      <Info size={12} /> Needs {set.minSelect - currentCount} more
                    </span>
                  )}
                </div>

                <div className={pizzaToppingSet ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'grid grid-cols-2 gap-2'}>
                  {set.addons?.map((sa: any) => {
                    const isSelected = !!selections[sa.addonId];
                    const price = getAddonPrice(sa);
	                    const selectedSide = selections[sa.addonId]?.side as ToppingSide | undefined;
	                    const selectedAmount = (selections[sa.addonId]?.amount || 'REGULAR') as ToppingAmount;

	                    if (pizzaToppingSet) {
	                      const isMeat = String(set.name || '').toLowerCase().includes('meat') || String(sa.addon?.category || '').toLowerCase().includes('meat');
	                      const accent = isMeat ? 'red' : 'emerald';
	                      const displaySide = (selectedSide || 'FULL') as ToppingSide;
	                      return (
	                        <div
	                          key={sa.addonId}
	                          className={`overflow-hidden rounded-2xl border-2 bg-white transition-all ${
	                            isSelected
	                              ? accent === 'red'
	                                ? 'border-red-500 bg-red-50'
	                                : 'border-emerald-500 bg-emerald-50'
	                              : accent === 'red'
	                                ? 'border-slate-200 hover:border-red-300 hover:bg-red-50/40'
	                                : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40'
	                          }`}
	                        >
	                          <button
	                            type="button"
	                            aria-pressed={isSelected}
	                            onClick={() => {
	                              if (isSelected) {
	                                toggleAddon(set, sa);
	                              } else {
	                                setPizzaToppingSelection(set, sa, 'FULL', 'REGULAR');
	                              }
	                            }}
	                            className={`group flex min-h-[92px] w-full items-start justify-between gap-3 px-4 py-4 text-left transition-all ${
	                              isSelected
	                                ? accent === 'red'
	                                  ? 'bg-red-50 text-red-950'
	                                  : 'bg-emerald-50 text-emerald-950'
	                                : 'bg-white text-slate-700 hover:bg-slate-50'
	                            }`}
	                          >
	                            <div className="min-w-0">
	                              <p className="break-words text-base font-black leading-tight">
		                                {isSelected ? toppingNameWithAmount(sa.addon?.name, selectedAmount) : sa.addon?.name}
	                              </p>
	                              <p className="mt-1 text-xs font-bold text-slate-400">
		                                Full +${Number(price).toFixed(2)} - Half +${(Number(price) / 2).toFixed(2)}
	                              </p>
	                              <p className={`mt-2 text-[10px] font-black uppercase tracking-wide ${
	                                isSelected
	                                  ? accent === 'red' ? 'text-red-700' : 'text-emerald-700'
	                                  : 'text-slate-400'
	                              }`}>
	                                {isSelected ? 'Click anywhere here to deselect' : 'Click anywhere here to select'}
	                              </p>
	                            </div>
	                            <div className="flex shrink-0 items-center gap-2">
	                              {isSelected && (
	                                <span className={`hidden rounded-full px-2 py-1 text-[10px] font-black uppercase sm:inline-flex ${
	                                  accent === 'red' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
	                                }`}>
		                                  {toppingAmountLabel(selectedAmount)} - {sideLabel(selectedSide)}
	                                </span>
	                              )}
	                              <span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
	                                isSelected
	                                  ? accent === 'red'
	                                    ? 'border-red-600 bg-red-600 text-white'
	                                    : 'border-emerald-600 bg-emerald-600 text-white'
	                                  : 'border-slate-300 bg-white text-slate-500 group-hover:border-slate-400'
	                              }`}>
	                                {isSelected ? <Check size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={2.5} />}
	                              </span>
	                            </div>
	                          </button>
		                          <div className="grid grid-cols-3 border-t border-slate-100">
		                            {(['LEFT', 'FULL', 'RIGHT'] as const).map((side) => (
	                              <button
	                                key={side}
	                                type="button"
	                                onClick={() => selectToppingSide(set, sa, side)}
	                                className={`border-r border-slate-100 px-2 py-3 text-xs font-black transition-all last:border-r-0 ${
	                                  displaySide === side
	                                    ? accent === 'red'
	                                      ? 'bg-red-600 text-white'
	                                      : 'bg-emerald-600 text-white'
	                                    : 'bg-white text-slate-500 hover:bg-slate-50'
	                                }`}
	                              >
	                                {side === 'FULL' ? 'Full' : side === 'LEFT' ? 'Left 1/2' : 'Right 1/2'}
		                              </button>
		                            ))}
		                          </div>
		                            <div className="grid grid-cols-3 border-t border-slate-100 bg-white">
		                              {toppingAmountOptions.map((amount) => (
		                                <button
		                                  key={amount.id}
		                                  type="button"
		                                  onClick={() => selectToppingAmount(set, sa, amount.id)}
		                                  className={`px-2 py-3 text-xs font-black transition-all ${
		                                    selectedAmount === amount.id
		                                      ? accent === 'red'
		                                        ? 'bg-red-100 text-red-800'
		                                        : 'bg-emerald-100 text-emerald-800'
		                                      : 'text-slate-500 hover:bg-slate-50'
		                                  }`}
		                                >
		                                  {amount.label}
		                                </button>
		                              ))}
		                            </div>
	                        </div>
	                      );
	                    }
	                    
                    return (
                      <button
                        key={sa.addonId}
                        onClick={() => toggleAddon(set, sa)}
                        className={`group relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                            : 'bg-white border-slate-50 hover:border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200 group-hover:border-slate-300'
                          }`}>
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                          <span className="text-sm font-bold truncate max-w-[120px]">{sa.addon?.name}</span>
                        </div>
                        {price > 0 && (
                          <span className={`text-[11px] font-black ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`}>
                            +${Number(price).toFixed(2)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Notes Section */}
          <div className="mb-8">
            <label className="text-[11px] font-black uppercase text-slate-400 mb-3 block tracking-widest">Special Instructions</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or allergies?"
              className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 text-sm text-slate-700 min-h-[80px] resize-none"
            />
          </div>
        </div>

        {/* Footer Interaction */}
        <div className="p-8 bg-white border-t border-slate-100 flex items-center justify-between gap-8">
          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50"
              disabled={quantity <= 1}
            >
              <Minus size={18} className="text-slate-600" />
            </button>
            <span className="text-xl font-black text-slate-900 w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-black transition-colors shadow-lg"
            >
              <Plus size={18} />
            </button>
          </div>

          <button
            onClick={handleAdd}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-4 px-6 flex items-center justify-between group transition-all shadow-xl shadow-blue-200"
          >
            <div className="flex items-center gap-3">
              <ShoppingCart size={22} className="group-hover:translate-x-1 transition-transform" />
              <span className="font-black text-lg">Add To Cart</span>
            </div>
            <span className="text-2xl font-black text-blue-100 opacity-90">
              ${calculateTotal().toFixed(2)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddOnPanel;
