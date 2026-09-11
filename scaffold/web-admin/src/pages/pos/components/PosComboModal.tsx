import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Loader2, MessageSquare, RotateCcw, X } from 'lucide-react';
import { api } from '../../../services/api';
import { getFoodImage } from './foodImages';
import {
  calculateComboPrice,
  getSelectedToppingIds,
  normalizePizzaToppings,
  selectionFromLegacySides,
  toggleToppingSide,
  toggleWholeTopping,
  type PizzaToppingSelection,
} from '../comboLogic';

interface PosComboModalProps {
  combo: any;
  storeId: string;
  onClose: () => void;
  /** Resolved combo (items include chosen productId) + flat paid add-on lines for the cart */
  onAdd: (resolvedCombo: any, paidExtras: Array<{ comboItemId: string; addonId: string; name: string; price: number }>) => void;
}

type ConfigLine = {
  comboItem: any;
  selectedProduct: any | null;
  selections: Record<string, string[]>;
  toppingSides: PizzaToppingSelection;
  specialInstructions: string;
  priceAdj: number;
};

function sortComboItems(items: any[]) {
  return [...(items || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

function getCategoryType(catName?: string): 'pizza' | 'wings' | 'drinks' | 'subs' | 'default' {
  if (!catName) return 'default';
  const n = catName.toLowerCase();
  if (n.includes('pizza')) return 'pizza';
  if (n.includes('wing')) return 'wings';
  if (n.includes('drink') || n.includes('soda') || n.includes('beverage')) return 'drinks';
  if (n.includes('sub') || n.includes('sandwich')) return 'subs';
  return 'default';
}

const FALLBACK_CRUSTS = [
  { id: 'hand-tossed', name: 'Hand Tossed', price: 0 },
  { id: 'thin-crust', name: 'Thin Crust', price: 0 },
  { id: 'garlic-parmesan-stuffed', name: 'Garlic Parmesan Stuffed', price: 3 },
  { id: 'cauliflower', name: 'Cauliflower', price: 2.5 },
  { id: 'gluten-free', name: 'Gluten-Free', price: 2.5 },
];

const FALLBACK_SAUCES = [
  { id: 'pizza-sauce', name: 'Pizza Sauce', price: 0 },
  { id: 'bbq-sauce', name: 'BBQ Sauce', price: 0 },
  { id: 'alfredo-sauce', name: 'Alfredo Sauce', price: 0 },
  { id: 'garlic-herb', name: 'Garlic Herb', price: 0 },
  { id: 'tzatziki', name: 'Tzatziki', price: 0 },
];

const FALLBACK_TOPPING_GROUPS = [
  {
    id: 'vegetables',
    name: 'Vegetables',
    options: [
      { id: 'green-peppers', name: 'Green Peppers', price: 0 },
      { id: 'mushrooms', name: 'Mushrooms', price: 0 },
      { id: 'onions', name: 'Onions', price: 0 },
      { id: 'tomatoes', name: 'Tomatoes', price: 0 },
      { id: 'spinach', name: 'Spinach', price: 0 },
      { id: 'jalapenos', name: 'Jalapenos', price: 0 },
      { id: 'pineapple', name: 'Pineapple', price: 0 },
      { id: 'banana-peppers', name: 'Banana Peppers', price: 0 },
      { id: 'black-olives', name: 'Black Olives', price: 0 },
      { id: 'green-olives', name: 'Green Olives', price: 0 },
    ],
  },
  {
    id: 'meats',
    name: 'Meats',
    options: [
      { id: 'pepperoni', name: 'Pepperoni', price: 1.5 },
      { id: 'italian-sausage', name: 'Italian Sausage', price: 1.5 },
      { id: 'ground-beef', name: 'Ground Beef', price: 1.5 },
      { id: 'bacon', name: 'Bacon', price: 2 },
      { id: 'ham', name: 'Ham', price: 1.5 },
      { id: 'grilled-chicken', name: 'Grilled Chicken', price: 2 },
    ],
  },
];

const FALLBACK_WING_FLAVORS = ['Buffalo', 'BBQ', 'Garlic Parmesan', 'Honey BBQ', 'Lemon Pepper', 'Plain'];
const FALLBACK_WING_PREP = ['Traditional', 'Extra Crispy', 'Well Done'];
const FALLBACK_WING_SIDES = [
  { id: 'ranch', name: 'Ranch Dip', price: 0.79 },
  { id: 'blue-cheese', name: 'Blue Cheese Dip', price: 0.79 },
  { id: 'celery', name: 'Celery Sticks', price: 0 },
  { id: 'carrots', name: 'Carrot Sticks', price: 0 },
];
const FALLBACK_SODAS = ['Pepsi', 'Diet Pepsi', 'Mountain Dew', 'Starry', 'Orange Soda', 'Ginger Ale', 'Coca-Cola'];

const FALLBACK_SUB_BREADS = [
  { id: 'white', name: 'White', price: 0 },
  { id: 'wheat', name: 'Whole Wheat', price: 0 },
  { id: 'italian', name: 'Italian Herb', price: 0.5 },
  { id: 'parmesan', name: 'Parmesan Oregano', price: 0.5 },
];

const FALLBACK_SUB_MEATS = [
  { id: 'turkey', name: 'Turkey Breast', price: 2 },
  { id: 'ham', name: 'Black Forest Ham', price: 2 },
  { id: 'roast-beef', name: 'Roast Beef', price: 2.5 },
  { id: 'salami', name: 'Genoa Salami', price: 2 },
  { id: 'pepperoni', name: 'Pepperoni', price: 2 },
  { id: 'meatballs', name: 'Italian Meatballs', price: 2.5 },
  { id: 'chicken', name: 'Grilled Chicken', price: 2.5 },
];

const FALLBACK_SUB_CHEESES = [
  { id: 'american', name: 'American', price: 0.5 },
  { id: 'provolone', name: 'Provolone', price: 0.5 },
  { id: 'swiss', name: 'Swiss', price: 0.5 },
  { id: 'cheddar', name: 'Cheddar', price: 0.5 },
];

const FALLBACK_SUB_VEGGIES = [
  { id: 'lettuce', name: 'Lettuce', price: 0 },
  { id: 'tomatoes', name: 'Tomatoes', price: 0 },
  { id: 'onions', name: 'Onions', price: 0 },
  { id: 'pickles', name: 'Pickles', price: 0 },
  { id: 'banana-peppers', name: 'Banana Peppers', price: 0 },
  { id: 'jalapenos', name: 'Jalapenos', price: 0 },
  { id: 'olives', name: 'Black Olives', price: 0 },
  { id: 'spinach', name: 'Spinach', price: 0 },
];

const FALLBACK_SUB_SAUCES = [
  { id: 'mayo', name: 'Mayonnaise', price: 0 },
  { id: 'mustard', name: 'Mustard', price: 0 },
  { id: 'honey-mustard', name: 'Honey Mustard', price: 0 },
  { id: 'italian', name: 'Italian', price: 0 },
  { id: 'ranch', name: 'Ranch', price: 0 },
  { id: 'chipotle', name: 'Chipotle', price: 0 },
];

const formatPrice = (value: number) => (value > 0 ? `+$${value.toFixed(2)}` : 'Included');

function defaultSelectionsForType(type: ReturnType<typeof getCategoryType>): Record<string, string[]> {
  if (type === 'pizza') {
    return { crust: ['hand-tossed'], sauce: ['pizza-sauce'] };
  }
  if (type === 'wings') {
    return { wingFlavor: ['Buffalo'], wingPrep: ['Traditional'], wingSides: [] };
  }
  if (type === 'drinks') {
    return { soda: ['Pepsi'] };
  }
  if (type === 'subs') {
    return {
      subBread: ['white'],
      subMeats: [],
      subCheeses: [],
      subVeggies: ['lettuce', 'tomatoes', 'onions'],
      subSauces: ['mayo'],
    };
  }
  return {};
}

function calcLinePriceAdj(line: ConfigLine): number {
  const item = line.comboItem;
  const product = line.selectedProduct;
  let fallbackAdj = 0;
  const crustId = line.selections?.crust?.[0];
  const selectedCrust = FALLBACK_CRUSTS.find((option) => option.id === crustId);
  fallbackAdj += selectedCrust?.price || 0;

  const selectedFallbackToppings = getSelectedToppingIds(line.toppingSides || {});
  const includedToppings = item.maxIncludedToppings || Number(item.selectionRules?.includedSelections || 0) || 0;
  selectedFallbackToppings.forEach((id, index) => {
    const topping = FALLBACK_TOPPING_GROUPS.flatMap((group) => group.options).find((option) => option.id === id);
    if (!topping) return;
    if (index >= includedToppings) fallbackAdj += topping.price || 1.5;
    else fallbackAdj += topping.price > 0 ? topping.price : 0;
  });

  const wingSideIds = line.selections?.wingSides || [];
  wingSideIds.forEach((id) => {
    fallbackAdj += FALLBACK_WING_SIDES.find((option) => option.id === id)?.price || 0;
  });

  const subBread = FALLBACK_SUB_BREADS.find((option) => option.id === line.selections?.subBread?.[0]);
  fallbackAdj += subBread?.price || 0;
  (line.selections?.subMeats || []).forEach((id) => {
    fallbackAdj += FALLBACK_SUB_MEATS.find((option) => option.id === id)?.price || 0;
  });
  (line.selections?.subCheeses || []).forEach((id) => {
    fallbackAdj += FALLBACK_SUB_CHEESES.find((option) => option.id === id)?.price || 0;
  });
  (line.selections?.subVeggies || []).forEach((id) => {
    fallbackAdj += FALLBACK_SUB_VEGGIES.find((option) => option.id === id)?.price || 0;
  });
  (line.selections?.subSauces || []).forEach((id) => {
    fallbackAdj += FALLBACK_SUB_SAUCES.find((option) => option.id === id)?.price || 0;
  });

  if (!product?.addonSets) return fallbackAdj;
  const freeLimit = item.maxIncludedToppings || 0;
  let toppingCount = 0;
  let adj = 0;
  for (const pas of product.addonSets) {
    const set = pas.addonSet;
    const selected = getSelectedToppingIds(line.toppingSides || {}).length > 0
      ? (line.selections?.[set.id] || []).filter((id: string) => line.toppingSides[id])
      : (line.selections?.[set.id] || []);
    for (const sid of selected) {
      const sa = set.addons.find((a: any) => a.addon.id === sid);
      if (!sa) continue;
      const price = Number(sa.priceOverride ?? sa.addon.price ?? 0);
      if (price > 0) {
        if (toppingCount < freeLimit) toppingCount++;
        else {
          adj += price;
          toppingCount++;
        }
      }
    }
  }
  return adj + fallbackAdj;
}

function buildPaidExtras(lines: ConfigLine[]): Array<{ comboItemId: string; addonId: string; name: string; price: number }> {
  const out: Array<{ comboItemId: string; addonId: string; name: string; price: number }> = [];
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const comboItemId = line.comboItem.id || `combo-item-${idx}`;
    const crust = FALLBACK_CRUSTS.find((option) => option.id === line.selections?.crust?.[0]);
    if (crust && crust.price > 0) {
      out.push({ comboItemId, addonId: crust.id, name: `${line.comboItem.name}: ${crust.name}`, price: crust.price });
    }
    getSelectedToppingIds(line.toppingSides || {}).forEach((id, index) => {
      const includedToppings = line.comboItem.maxIncludedToppings || Number(line.comboItem.selectionRules?.includedSelections || 0) || 0;
      const topping = FALLBACK_TOPPING_GROUPS.flatMap((group) => group.options).find((option) => option.id === id);
      if (!topping) return;
      const price = index >= includedToppings ? topping.price || 1.5 : topping.price;
      if (price > 0) out.push({ comboItemId, addonId: id, name: `${line.comboItem.name}: ${topping.name}`, price });
    });
    (line.selections?.wingSides || []).forEach((id) => {
      const side = FALLBACK_WING_SIDES.find((option) => option.id === id);
      if (side && side.price > 0) out.push({ comboItemId, addonId: id, name: `${line.comboItem.name}: ${side.name}`, price: side.price });
    });
    const subBread = FALLBACK_SUB_BREADS.find((option) => option.id === line.selections?.subBread?.[0]);
    if (subBread && subBread.price > 0) {
      out.push({ comboItemId, addonId: subBread.id, name: `${line.comboItem.name}: ${subBread.name}`, price: subBread.price });
    }
    (line.selections?.subMeats || []).forEach((id) => {
      const option = FALLBACK_SUB_MEATS.find((item) => item.id === id);
      if (option && option.price > 0) out.push({ comboItemId, addonId: id, name: `${line.comboItem.name}: ${option.name}`, price: option.price });
    });
    (line.selections?.subCheeses || []).forEach((id) => {
      const option = FALLBACK_SUB_CHEESES.find((item) => item.id === id);
      if (option && option.price > 0) out.push({ comboItemId, addonId: id, name: `${line.comboItem.name}: ${option.name}`, price: option.price });
    });
    (line.selections?.subVeggies || []).forEach((id) => {
      const option = FALLBACK_SUB_VEGGIES.find((item) => item.id === id);
      if (option && option.price > 0) out.push({ comboItemId, addonId: id, name: `${line.comboItem.name}: ${option.name}`, price: option.price });
    });
    (line.selections?.subSauces || []).forEach((id) => {
      const option = FALLBACK_SUB_SAUCES.find((item) => item.id === id);
      if (option && option.price > 0) out.push({ comboItemId, addonId: id, name: `${line.comboItem.name}: ${option.name}`, price: option.price });
    });
    const product = line.selectedProduct;
    if (!product?.addonSets) continue;
    const freeLimit = line.comboItem.maxIncludedToppings || 0;
    let toppingCount = 0;
    for (const pas of product.addonSets) {
      const set = pas.addonSet;
      const selected = getSelectedToppingIds(line.toppingSides || {}).length > 0
        ? (line.selections?.[set.id] || []).filter((id: string) => line.toppingSides[id])
        : (line.selections?.[set.id] || []);
      for (const sid of selected) {
        const sa = set.addons.find((a: any) => a.addon.id === sid);
        if (!sa) continue;
        const unit = Number(sa.priceOverride ?? sa.addon.price ?? 0);
        if (unit > 0) {
          if (toppingCount < freeLimit) {
            toppingCount++;
            continue;
          }
          toppingCount++;
          out.push({
            comboItemId,
            addonId: sid,
            name: `${line.comboItem.name || 'Item'}: ${sa.addon.name}`,
            price: unit,
          });
        }
      }
    }
  }
  return out;
}

const PosComboModal: React.FC<PosComboModalProps> = ({ combo, storeId, onClose, onAdd }) => {
  const [lines, setLines] = useState<ConfigLine[]>([]);
  const [step, setStep] = useState(0);
  const [catProducts, setCatProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [fallbackToppingGroup, setFallbackToppingGroup] = useState('vegetables');

  const sortedItems = useMemo(() => sortComboItems(combo?.items), [combo?.items]);

  const recalcAdj = useCallback((next: ConfigLine[]) => {
    return next.map((l) => ({ ...l, priceAdj: calcLinePriceAdj(l) }));
  }, []);

  useEffect(() => {
    const init: ConfigLine[] = sortedItems.map((item: any) => {
      const itemType = getCategoryType(item?.category?.name || item?.name || item?.componentType);
      return {
        comboItem: item,
        selectedProduct: item.isProductFixed ? item.product || null : null,
        selections: defaultSelectionsForType(itemType),
        toppingSides: {},
        specialInstructions: '',
        priceAdj: 0,
      };
    });
    setLines(recalcAdj(init));
    setStep(0);
  }, [combo?.id, sortedItems, recalcAdj]);

  const cur = lines[step];
  const catLabel = cur?.comboItem?.category?.name || cur?.comboItem?.name || '';
  const catType = getCategoryType(catLabel);

  const categoryIdAtStep = lines[step]?.comboItem?.categoryId;
  const isFixedAtStep = Boolean(lines[step]?.comboItem?.isProductFixed);
  const selectedIdAtStep = lines[step]?.selectedProduct?.id;

  useEffect(() => {
    const line = lines[step];
    if (!line || line.comboItem.isProductFixed || !line.comboItem.categoryId) {
      setCatProducts([]);
      setLoadingProducts(false);
      return;
    }
    if (line.selectedProduct) {
      setLoadingProducts(false);
      return;
    }
    let cancelled = false;
    setLoadingProducts(true);
    api.menu
      .getProducts({ storeId, categoryId: line.comboItem.categoryId })
      .then((res) => {
        if (!cancelled) setCatProducts(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setCatProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [step, storeId, categoryIdAtStep, isFixedAtStep, selectedIdAtStep]);

  const selectProduct = (product: any) => {
    setLines((prev) => {
      const next = [...prev];
      const line = { ...next[step] };
      line.selectedProduct = product;
      line.selections = defaultSelectionsForType(catType);
      line.toppingSides = {};
      line.priceAdj = 0;
      next[step] = line;
      return recalcAdj(next);
    });
  };

  const setInstructions = (text: string) => {
    setLines((prev) => {
      const next = [...prev];
      next[step] = { ...next[step], specialInstructions: text };
      return next;
    });
  };

  const toggleAddon = (setId: string, addonId: string, maxSelect?: number) => {
    setLines((prev) => {
      const next = [...prev];
      const line = { ...next[step] };
      const sel = { ...(line.selections || {}) };
      const arr = [...(sel[setId] || [])];
      const idx = arr.indexOf(addonId);
      if (idx >= 0) arr.splice(idx, 1);
      else if (!maxSelect || arr.length < maxSelect) arr.push(addonId);
      sel[setId] = arr;
      line.selections = sel;
      next[step] = line;
      return recalcAdj(next);
    });
  };

  const setSingleAddon = (setId: string, addonId: string) => {
    setLines((prev) => {
      const next = [...prev];
      const line = { ...next[step] };
      line.selections = { ...line.selections, [setId]: [addonId] };
      next[step] = line;
      return recalcAdj(next);
    });
  };

  const setLineSingleSelection = (key: string, value: string) => {
    setLines((prev) => {
      const next = [...prev];
      const line = { ...next[step] };
      line.selections = { ...(line.selections || {}), [key]: [value] };
      next[step] = line;
      return recalcAdj(next);
    });
  };

  const toggleLineMultiSelection = (key: string, value: string, maxSelect?: number) => {
    setLines((prev) => {
      const next = [...prev];
      const line = { ...next[step] };
      const selections = { ...(line.selections || {}) };
      const current = [...(selections[key] || [])];
      const index = current.indexOf(value);
      if (index >= 0) current.splice(index, 1);
      else if (!maxSelect || current.length < maxSelect) current.push(value);
      selections[key] = current;
      line.selections = selections;
      next[step] = line;
      return recalcAdj(next);
    });
  };

  const setPizzaToppingSelection = (
    setId: string,
    addonId: string,
    updater: (selection: PizzaToppingSelection) => PizzaToppingSelection,
    maxSelect?: number,
  ) => {
    setLines((prev) => {
      const next = [...prev];
      const line = { ...next[step] };
      const sel = { ...(line.selections || {}) };
      const currentSides = selectionFromLegacySides(line.toppingSides || {});
      const nextSides = updater(currentSides);
      const selectedIds = getSelectedToppingIds(nextSides);
      if (maxSelect && selectedIds.length > maxSelect && !currentSides[addonId]) {
        return prev;
      }
      sel[setId] = selectedIds;
      line.selections = sel;
      line.toppingSides = nextSides;
      next[step] = line;
      return recalcAdj(next);
    });
  };

  const togglePizzaTopping = (setId: string, addonId: string, maxSelect?: number) => {
    setPizzaToppingSelection(setId, addonId, (selection) => toggleWholeTopping(selection, addonId), maxSelect);
  };

  const changeToppingSide = (
    e: React.MouseEvent,
    setId: string,
    addonId: string,
    side: 'LEFT' | 'RIGHT',
    maxSelect?: number,
  ) => {
    e.stopPropagation();
    setPizzaToppingSelection(setId, addonId, (selection) => toggleToppingSide(selection, addonId, side), maxSelect);
  };

  const pricing = useMemo(
    () => calculateComboPrice({
      basePrice: combo.basePrice,
      lines: lines.map((line) => ({ priceAdjustment: line.priceAdj })),
    }),
    [combo.basePrice, lines],
  );
  const extrasTotal = pricing.adjustmentsTotal;

  const canProceedStep = (): boolean => {
    if (!cur) return false;
    return Boolean(cur.selectedProduct);
  };

  const handleNext = () => {
    if (!canProceedStep()) return;
    if (step < lines.length - 1) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((s) => s - 1);
    } else {
      onClose();
    }
  };

  const handleAddToOrder = () => {
    if (!canProceedStep()) return;
    const paid = buildPaidExtras(lines);
    const resolved = {
      ...combo,
      items: sortedItems.map((item: any, idx: number) => {
        const line = lines[idx];
        const pid = line?.selectedProduct?.id ?? item.productId;
        const pname = line?.selectedProduct?.name ?? item.name;
	        return {
	          ...item,
	          productId: pid,
	          name: pname,
	          selections: line?.selections || {},
	          toppingSides: line ? normalizePizzaToppings(line.toppingSides || {}) : { left: [], whole: [], right: [] },
	          specialInstructions: line?.specialInstructions || '',
	        };
      }),
    };
    onAdd(resolved, paid);
  };

  const renderAddonSet = (pas: any, compact = false, isPizzaTopping = false) => {
    const set = pas.addonSet;
    const selected = cur?.selections?.[set.id] || [];
	    const sides = selectionFromLegacySides(cur?.toppingSides || {});
    const isSingle = set.maxSelect === 1;
    return (
      <div key={set.id} className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{set.name}</p>
          {set.maxSelect && (
            <span className="text-[10px] text-gray-500">
              {isSingle ? 'Choose 1' : `${selected.length}/${set.maxSelect}`}
            </span>
          )}
        </div>
        <div className={compact ? 'flex flex-wrap gap-2' : 'grid grid-cols-1 sm:grid-cols-2 gap-2'}>
          {set.addons.map((sa: any) => {
            const addon = sa.addon;
            const isSel = selected.includes(addon.id);
            const canSel = isSel || !set.maxSelect || selected.length < set.maxSelect;
            const price = Number(sa.priceOverride ?? addon.price ?? 0);
	            const isActive = false;
	            const sideSelection = sides[addon.id] || { left: false, right: false };
	            const isWhole = sideSelection.left && sideSelection.right;
	            return (
	              <div key={addon.id} className="relative">
	                {isPizzaTopping ? (
	                  <div
	                    className={`grid min-h-[52px] grid-cols-[3.25rem_minmax(0,1fr)_3.25rem] overflow-hidden rounded-xl border transition-all ${
	                      isSel
	                        ? isWhole
	                          ? 'border-yellow-400 bg-yellow-400/10'
	                          : 'border-gray-400 bg-gray-50 dark:border-gray-500 dark:bg-slate-900/40'
	                        : !canSel
	                          ? 'opacity-30 cursor-not-allowed border-gray-200 bg-gray-100 dark:bg-gray-800'
	                          : 'border-gray-200 bg-white hover:border-orange-300 dark:border-gray-600 dark:bg-gray-800'
	                    } ${isActive ? 'ring-2 ring-yellow-300' : ''}`}
	                  >
	                    <button
	                      type="button"
	                      disabled={!isSel && !canSel}
	                      aria-pressed={sideSelection.left}
	                      onClick={(e) => changeToppingSide(e, set.id, addon.id, 'LEFT', set.maxSelect)}
	                      className={`flex items-center justify-center border-r text-sm font-black transition-all ${
	                        sideSelection.left
	                          ? 'border-green-500 bg-green-600 text-white'
	                          : 'border-gray-200 text-gray-600 hover:bg-green-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-green-900/20'
	                      }`}
	                    >
	                      {sideSelection.left ? <Check size={16} aria-hidden /> : 'L'}
	                    </button>
	                    <button
	                      type="button"
	                      disabled={!isSel && !canSel}
	                      aria-pressed={isWhole}
	                      onClick={() => togglePizzaTopping(set.id, addon.id, set.maxSelect)}
	                      className={`px-3 text-left font-bold transition-all ${
	                        isWhole
	                          ? 'bg-yellow-400/20 text-yellow-900 dark:text-yellow-100'
	                          : 'text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700'
	                      }`}
	                    >
	                      <span className="flex min-w-0 items-center justify-between gap-2">
	                        <span className="min-w-0">
	                          <span className="block truncate text-sm">{addon.name}</span>
	                          {isSel && (
	                            <span className="block text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-300">
	                              {isWhole ? 'Whole pizza' : sideSelection.left ? 'Left half' : 'Right half'}
	                            </span>
	                          )}
	                        </span>
	                        <span className="shrink-0 text-xs">{price > 0 ? `+$${price.toFixed(2)}` : 'FREE'}</span>
	                      </span>
	                    </button>
	                    <button
	                      type="button"
	                      disabled={!isSel && !canSel}
	                      aria-pressed={sideSelection.right}
	                      onClick={(e) => changeToppingSide(e, set.id, addon.id, 'RIGHT', set.maxSelect)}
	                      className={`flex items-center justify-center border-l text-sm font-black transition-all ${
	                        sideSelection.right
	                          ? 'border-orange-500 bg-orange-600 text-white'
	                          : 'border-gray-200 text-gray-600 hover:bg-orange-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-orange-900/20'
	                      }`}
	                    >
	                      {sideSelection.right ? <Check size={16} aria-hidden /> : 'R'}
	                    </button>
	                  </div>
	                ) : (
	                  <button
	                    type="button"
	                    disabled={!isSel && !canSel}
	                    onClick={() => {
	                      if (isSingle) setSingleAddon(set.id, addon.id);
	                      else toggleAddon(set.id, addon.id, set.maxSelect);
	                    }}
	                    className={`w-full px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all border ${
	                      isSel
	                        ? 'bg-purple-600 border-purple-500 text-white'
	                        : !canSel && !isSel
	                          ? 'opacity-30 cursor-not-allowed bg-gray-100 dark:bg-gray-800 border-gray-200'
	                          : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white hover:border-purple-300'
	                    }`}
	                  >
	                    <span className="flex items-center justify-between gap-2">
	                      <span className="truncate">{addon.name}</span>
	                      <span className="text-xs whitespace-nowrap">{price > 0 ? `+$${price.toFixed(2)}` : 'FREE'}</span>
	                    </span>
	                  </button>
	                )}
	              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderProductGrid = () => {
    const label = cur?.comboItem?.productGroupLabel || 'Choose your item';
    return (
      <div>
        <h4 className="text-base font-bold text-white mb-1">{label}</h4>
        <p className="text-sm text-slate-400 mb-4">
          Pick one product for this step ({catLabel || 'category'}).
        </p>
        {loadingProducts ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : catProducts.length === 0 ? (
          <p className="text-center text-slate-400 py-8">No products in this category for this store.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {catProducts.map((p) => {
              const isSel = cur?.selectedProduct?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectProduct(p)}
                  className={`text-left p-3 rounded-2xl border transition-all ${
                    isSel
                      ? 'border-purple-500 bg-purple-500/15 ring-2 ring-purple-400/40'
                      : 'border-slate-700 bg-slate-900 hover:border-purple-400'
                  }`}
                >
                  <div className="h-28 rounded-xl mb-2 overflow-hidden bg-slate-800">
                    <img
                      src={getFoodImage(p)}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/pepperoni.png'; }}
                    />
                  </div>
                  <p className="font-bold text-white text-sm truncate">{p.name}</p>
                  <p className="text-xs text-slate-400">${Number(p.basePrice || 0).toFixed(2)}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderChoiceCard = (
    keyName: string,
    option: { id: string; name: string; price?: number },
    accent: 'green' | 'orange' | 'purple' = 'purple',
  ) => {
    const selected = cur?.selections?.[keyName]?.[0] === option.id;
    const selectedClass = accent === 'green'
      ? 'border-green-500 bg-green-500/15 text-white'
      : accent === 'orange'
        ? 'border-orange-500 bg-orange-500/15 text-white'
        : 'border-purple-500 bg-purple-500/15 text-white';
    return (
      <button
        key={option.id}
        type="button"
        aria-pressed={selected}
        onClick={() => setLineSingleSelection(keyName, option.id)}
        className={`min-h-[5rem] rounded-2xl border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-purple-400 ${
          selected
            ? selectedClass
            : 'border-slate-700 bg-slate-900/70 text-slate-100 hover:border-slate-500'
        }`}
      >
        <span className="flex items-start justify-between gap-3">
          <span>
            <span className="block text-base font-black">{option.name}</span>
            <span className="mt-1 block text-xs font-bold text-slate-300">{formatPrice(option.price || 0)}</span>
          </span>
          {selected && <Check size={18} className="shrink-0" aria-hidden />}
        </span>
      </button>
    );
  };

  const renderMultiChoiceCard = (
    keyName: string,
    option: { id: string; name: string; price?: number },
    accent: 'green' | 'orange' | 'purple' = 'purple',
    maxSelect?: number,
  ) => {
    const selected = (cur?.selections?.[keyName] || []).includes(option.id);
    const selectedCount = cur?.selections?.[keyName]?.length || 0;
    const disabled = !selected && Boolean(maxSelect && selectedCount >= maxSelect);
    const selectedClass = accent === 'green'
      ? 'border-green-500 bg-green-500/15 text-white'
      : accent === 'orange'
        ? 'border-orange-500 bg-orange-500/15 text-white'
        : 'border-purple-500 bg-purple-500/15 text-white';
    return (
      <button
        key={option.id}
        type="button"
        aria-pressed={selected}
        disabled={disabled}
        onClick={() => toggleLineMultiSelection(keyName, option.id, maxSelect)}
        className={`min-h-[4.5rem] rounded-2xl border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-purple-400 ${
          selected
            ? selectedClass
            : disabled
              ? 'cursor-not-allowed border-slate-800 bg-slate-900/40 text-slate-600'
              : 'border-slate-700 bg-slate-900/70 text-slate-100 hover:border-slate-500'
        }`}
      >
        <span className="flex items-start justify-between gap-3">
          <span>
            <span className="block text-sm font-black leading-tight">{option.name}</span>
            <span className="mt-1 block text-xs font-bold text-slate-300">{formatPrice(option.price || 0)}</span>
          </span>
          {selected && <Check size={18} className="shrink-0" aria-hidden />}
        </span>
      </button>
    );
  };

  const renderFallbackToppingRows = () => {
    const group = FALLBACK_TOPPING_GROUPS.find((item) => item.id === fallbackToppingGroup) || FALLBACK_TOPPING_GROUPS[0];
    const sides = selectionFromLegacySides(cur?.toppingSides || {});
    const selectedCount = getSelectedToppingIds(sides).length;
    const included = cur?.comboItem?.maxIncludedToppings || Number(cur?.comboItem?.selectionRules?.includedSelections || 0) || 0;
    return (
      <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-4 space-y-4">
        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-700">
          {FALLBACK_TOPPING_GROUPS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFallbackToppingGroup(item.id)}
              className={`px-4 py-3 text-sm font-black transition-all ${
                fallbackToppingGroup === item.id
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {group.options.map((option) => {
            const sideSelection = sides[option.id] || { left: false, right: false };
            const isWhole = sideSelection.left && sideSelection.right;
            const isSelected = sideSelection.left || sideSelection.right;
            return (
              <div
                key={option.id}
                className={`grid min-h-[56px] grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] overflow-hidden rounded-2xl border transition-all ${
                  isWhole
                    ? 'border-yellow-400 bg-yellow-400/10'
                    : isSelected
                      ? 'border-slate-500 bg-slate-800/80'
                      : 'border-slate-700 bg-slate-900/80'
                }`}
              >
                <button
                  type="button"
                  aria-pressed={sideSelection.left}
                  onClick={(e) => changeToppingSide(e, 'fallbackToppings', option.id, 'LEFT')}
                  className={`border-r text-sm font-black ${
                    sideSelection.left
                      ? 'border-green-500 bg-green-600 text-white'
                      : 'border-slate-700 text-slate-300 hover:bg-green-900/30'
                  }`}
                >
                  {sideSelection.left ? <Check className="mx-auto" size={17} /> : 'L'}
                </button>
                <button
                  type="button"
                  aria-pressed={isWhole}
                  onClick={() => togglePizzaTopping('fallbackToppings', option.id)}
                  className={`px-4 text-left font-bold ${
                    isWhole ? 'text-yellow-100' : 'text-white hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate">{option.name}</span>
                    <span className="shrink-0 text-xs text-slate-300">{option.price > 0 ? `+$${option.price.toFixed(2)}` : 'Included'}</span>
                  </span>
                </button>
                <button
                  type="button"
                  aria-pressed={sideSelection.right}
                  onClick={(e) => changeToppingSide(e, 'fallbackToppings', option.id, 'RIGHT')}
                  className={`border-l text-sm font-black ${
                    sideSelection.right
                      ? 'border-orange-500 bg-orange-600 text-white'
                      : 'border-slate-700 text-slate-300 hover:bg-orange-900/30'
                  }`}
                >
                  {sideSelection.right ? <Check className="mx-auto" size={17} /> : 'R'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-300">
          <span>{included > 0 ? `${Math.min(selectedCount, included)}/${included} included toppings used` : 'Toppings may add charges'}</span>
          <button
            type="button"
            onClick={() => {
              setLines((prev) => {
                const next = [...prev];
                next[step] = { ...next[step], toppingSides: {}, selections: { ...next[step].selections, fallbackToppings: [] } };
                return recalcAdj(next);
              });
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 hover:bg-slate-800"
          >
            <RotateCcw size={13} />
            Clear toppings
          </button>
        </div>
      </div>
    );
  };

  const renderFallbackPizzaBuilder = () => {
    const normalized = normalizePizzaToppings(cur?.toppingSides || {});
    return (
      <div className="space-y-6">
        <section>
          <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-300">1. Choose Crust</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {FALLBACK_CRUSTS.map((option) => renderChoiceCard('crust', option, 'green'))}
          </div>
        </section>
        <section>
          <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-300">2. Select Sauce</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {FALLBACK_SAUCES.map((option) => renderChoiceCard('sauce', option, 'orange'))}
          </div>
        </section>
        <section>
          <div className="mb-3 text-center">
            <h4 className="text-lg font-black text-white">14&quot; Large Cheese Pizza</h4>
            <p className="text-sm text-slate-400">Tap L, topping name, or R for left, whole, or right.</p>
          </div>
          {renderFallbackToppingRows()}
        </section>
        <aside className="rounded-3xl border border-slate-700 bg-slate-950/70 p-4">
          <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-white">Your Pizza</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-300">
            <div><span className="block text-xs uppercase text-green-400">Left</span>{normalized.left.join(', ') || 'None'}</div>
            <div><span className="block text-xs uppercase text-yellow-300">Whole</span>{normalized.whole.join(', ') || 'None'}</div>
            <div><span className="block text-xs uppercase text-orange-400">Right</span>{normalized.right.join(', ') || 'None'}</div>
          </div>
        </aside>
      </div>
    );
  };

  const renderFallbackSubBuilder = () => {
    const selectedMeats = (cur?.selections?.subMeats || [])
      .map((id) => FALLBACK_SUB_MEATS.find((item) => item.id === id)?.name)
      .filter(Boolean);
    const selectedCheeses = (cur?.selections?.subCheeses || [])
      .map((id) => FALLBACK_SUB_CHEESES.find((item) => item.id === id)?.name)
      .filter(Boolean);
    const selectedVeggies = (cur?.selections?.subVeggies || [])
      .map((id) => FALLBACK_SUB_VEGGIES.find((item) => item.id === id)?.name)
      .filter(Boolean);
    const selectedSauces = (cur?.selections?.subSauces || [])
      .map((id) => FALLBACK_SUB_SAUCES.find((item) => item.id === id)?.name)
      .filter(Boolean);
    const bread = FALLBACK_SUB_BREADS.find((item) => item.id === cur?.selections?.subBread?.[0]) || FALLBACK_SUB_BREADS[0];

    const summary = [
      { label: 'Bread', value: bread.name, tone: 'text-amber-300' },
      { label: 'Meats', value: selectedMeats.join(', ') || 'None', tone: 'text-red-300' },
      { label: 'Cheese', value: selectedCheeses.join(', ') || 'None', tone: 'text-yellow-300' },
      { label: 'Veggies', value: selectedVeggies.join(', ') || 'None', tone: 'text-green-300' },
      { label: 'Sauces', value: selectedSauces.join(', ') || 'None', tone: 'text-sky-300' },
    ];

    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-emerald-800/60 bg-emerald-950/20 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-lg font-black text-white">Build Your 6&quot; Sub</h4>
              <p className="text-sm font-semibold text-slate-400">Choose bread, meats, cheese, veggies and sauces.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setLines((prev) => {
                  const next = [...prev];
                  next[step] = {
                    ...next[step],
                    selections: defaultSelectionsForType('subs'),
                    priceAdj: 0,
                  };
                  return recalcAdj(next);
                });
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            {summary.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-3">
                <span className={`block text-[10px] font-black uppercase tracking-widest ${item.tone}`}>{item.label}</span>
                <span className="mt-1 block text-xs font-bold leading-snug text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-300">1. Choose Bread</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {FALLBACK_SUB_BREADS.map((option) => renderChoiceCard('subBread', option, 'orange'))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-red-300">2. Meats</h4>
            <span className="text-xs font-bold text-slate-400">{selectedMeats.length} selected</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {FALLBACK_SUB_MEATS.map((option) => renderMultiChoiceCard('subMeats', option, 'orange', 4))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-yellow-300">3. Cheese</h4>
            <span className="text-xs font-bold text-slate-400">{selectedCheeses.length} selected</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {FALLBACK_SUB_CHEESES.map((option) => renderMultiChoiceCard('subCheeses', option, 'purple', 2))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-green-300">4. Veggies</h4>
            <span className="text-xs font-bold text-slate-400">{selectedVeggies.length} selected</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {FALLBACK_SUB_VEGGIES.map((option) => renderMultiChoiceCard('subVeggies', option, 'green'))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-sky-300">5. Sauces</h4>
            <span className="text-xs font-bold text-slate-400">{selectedSauces.length} selected</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {FALLBACK_SUB_SAUCES.map((option) => renderMultiChoiceCard('subSauces', option, 'purple', 3))}
          </div>
        </section>
      </div>
    );
  };

  const renderFallbackWingsBuilder = () => (
    <div className="space-y-6">
      <section>
        <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-300">Choose Wing Flavor</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {FALLBACK_WING_FLAVORS.map((name) => renderChoiceCard('wingFlavor', { id: name, name }, 'orange'))}
        </div>
      </section>
      <section>
        <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-300">Preparation</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FALLBACK_WING_PREP.map((name) => renderChoiceCard('wingPrep', { id: name, name }, 'purple'))}
        </div>
      </section>
      <section>
        <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-300">Sides & Dips</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FALLBACK_WING_SIDES.map((side) => {
            const selected = (cur?.selections?.wingSides || []).includes(side.id);
            return (
              <button
                key={side.id}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleLineMultiSelection('wingSides', side.id, 4)}
                className={`rounded-2xl border p-4 text-left font-bold transition-all ${
                  selected ? 'border-purple-500 bg-purple-500/15 text-white' : 'border-slate-700 bg-slate-900 text-slate-100 hover:border-slate-500'
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span>{side.name}</span>
                  <span className="text-xs text-slate-300">{formatPrice(side.price)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );

  const renderFallbackSodaBuilder = () => (
    <div className="space-y-4">
      <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">Choose 2 Liter Soda</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {FALLBACK_SODAS.map((name) => renderChoiceCard('soda', { id: name, name }, 'purple'))}
      </div>
    </div>
  );

  const renderCustomize = () => {
    const prod = cur?.selectedProduct;
    if (!prod) return null;
    const sets = prod.addonSets || [];
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 shrink-0">
            {true ? (
              <img
                src={getFoodImage(prod)}
                alt={prod.name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/pepperoni.png'; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">—</div>
            )}
          </div>
          <div>
            <p className="font-black text-white">{prod.name}</p>
            <p className="text-xs text-slate-400">{cur?.comboItem?.name}</p>
          </div>
        </div>

        {sets.length === 0 ? (
	          catType === 'pizza'
	            ? renderFallbackPizzaBuilder()
	            : catType === 'wings'
	              ? renderFallbackWingsBuilder()
	              : catType === 'drinks'
	                ? renderFallbackSodaBuilder()
	                : catType === 'subs'
	                  ? renderFallbackSubBuilder()
	                  : <p className="text-sm text-gray-500 text-center py-6">No options configured for this product.</p>
	        ) : (
	          <div className="space-y-5 max-h-[45vh] overflow-y-auto pr-1">
	            {catType === 'pizza' && getSelectedToppingIds(cur?.toppingSides || {}).length > 0 && (
	              <button
	                type="button"
	                onClick={() => {
	                  setLines((prev) => {
	                    const next = [...prev];
	                    next[step] = { ...next[step], selections: {}, toppingSides: {}, priceAdj: 0 };
	                    return recalcAdj(next);
	                  });
	                }}
	                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
	              >
	                <RotateCcw size={14} />
	                Clear Toppings
	              </button>
	            )}
	            {sets.map((pas: any) => {
              const n = pas.addonSet.name.toLowerCase();
              const isPizzaTopping = catType === 'pizza' && (n.includes('meat') || n.includes('veggie') || n.includes('topping'));
              return renderAddonSet(pas, catType === 'drinks', isPizzaTopping);
            })}
          </div>
        )}

        <div>
          <label className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <MessageSquare size={14} />
            Special instructions
          </label>
          <textarea
            value={cur?.specialInstructions || ''}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g., light sauce, well done…"
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-sm text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none"
          />
        </div>
      </div>
    );
  };

  const renderStepBody = () => {
    if (lines.length === 0) {
      return (
        <div className="flex justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
        </div>
      );
    }
    if (!cur) return null;
    const needsPick = !cur.comboItem.isProductFixed && !cur.selectedProduct;
    if (needsPick) return renderProductGrid();
    const prod = cur.selectedProduct;
    return renderCustomize();
  };

  const stepTitle = cur
    ? `${cur.comboItem.quantity || 1}× ${cur.comboItem.productGroupLabel || cur.comboItem.name || 'Selection'}`
    : '';

  const isLastStep = step >= lines.length - 1;
  const totalPrice = pricing.total;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-md animate-in fade-in duration-200 sm:p-4">
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[1.75rem] border border-slate-700 bg-slate-950 text-white shadow-2xl">
        <div className="border-b border-slate-800 p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              {step > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="mt-1 hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-700 text-slate-300 transition-colors hover:bg-slate-900 hover:text-white sm:flex"
                  aria-label="Go back one combo step"
                >
                  <ChevronLeft size={22} />
                </button>
              )}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500">
                <Check size={26} aria-hidden />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-black tracking-tight sm:text-3xl">{combo.name}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-300 sm:text-base">
                  Step {step + 1} of {Math.max(lines.length, 1)}: {stepTitle}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[0px] text-slate-400 transition-colors hover:bg-slate-900 hover:text-white"
              aria-label="Close"
            >
              <X size={24} aria-hidden />
            </button>
          </div>
          <div
            className="mt-5 grid gap-2"
            style={{ gridTemplateColumns: `repeat(${Math.max(lines.length, 1)}, minmax(0, 1fr))` }}
          >
            {(lines.length ? lines : [null]).map((line: any, index: number) => {
              const isDone = Boolean(lines[index]?.selectedProduct);
              const isCurrent = index === step;
              const canJump = index <= step || isDone;
              return (
                <button
                  key={line?.comboItem?.id || index}
                  type="button"
                  disabled={!canJump}
                  onClick={() => setStep(index)}
                  className="group min-w-0 text-left disabled:cursor-not-allowed"
                >
                  <span
                    className={`block h-2 rounded-full transition-all ${
                      isCurrent
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                        : isDone
                          ? 'bg-green-500'
                          : 'bg-slate-800'
                    }`}
                  />
                  <span className={`mt-2 hidden truncate text-xs font-semibold sm:block ${isCurrent ? 'text-white' : 'text-slate-500'}`}>
                    {line?.comboItem?.productGroupLabel || line?.comboItem?.name || `Step ${index + 1}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-950 p-5 sm:p-7 space-y-6 scrollbar-hide">{renderStepBody()}</div>

        <div className="space-y-4 border-t border-slate-800 bg-slate-900/90 p-5 backdrop-blur-xl sm:p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Combo total</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">${totalPrice.toFixed(2)}</span>
                {extrasTotal > 0 && (
                  <span className="text-xs font-bold text-purple-100 bg-purple-500/20 px-2 py-1 rounded-lg">
                    +${extrasTotal.toFixed(2)} add-ons
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 line-through font-bold">${Number(combo.retailValue || 0).toFixed(2)}</p>
              <p className="text-xs text-green-600 font-black">
                Save ${Math.max(0, Number(combo.retailValue || 0) - Number(combo.basePrice || 0)).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 px-4 py-3.5 text-slate-200 font-bold rounded-2xl border border-slate-700 hover:bg-slate-800 flex items-center justify-center gap-1"
            >
              <ChevronLeft size={18} />
              {step === 0 ? 'Cancel' : 'Back'}
            </button>
            {!isLastStep ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceedStep()}
                className="flex-[2] px-4 py-3.5 bg-gradient-to-r from-purple-600 to-sky-500 text-white rounded-2xl font-black disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                Next
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAddToOrder}
                disabled={!canProceedStep()}
                className="flex-[2] px-4 py-3.5 bg-gradient-to-r from-purple-600 to-sky-500 text-white rounded-2xl font-black disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add to Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PosComboModal;
