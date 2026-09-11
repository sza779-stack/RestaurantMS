import React, { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle, ChevronRight, ShoppingCart, Star, Flame, Plus, Minus, ArrowLeft, MessageSquare } from 'lucide-react';
import { ComboPizzaBuilderPanel } from './combo/ComboPizzaBuilderPanel';
import { getFoodImage } from '../utils/foodImages';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Props {
  combo: any;
  storeId?: string;
  onAdd: (configuredCombo: any) => void;
  onCancel: () => void;
}

// Detect category type from name
function getCategoryType(catName?: string): 'pizza' | 'wings' | 'drinks' | 'subs' | 'default' {
  if (!catName) return 'default';
  const n = catName.toLowerCase();
  if (n.includes('pizza')) return 'pizza';
  if (n.includes('wing')) return 'wings';
  if (n.includes('sub') || n.includes('sandwich')) return 'subs';
  if (n.includes('drink') || n.includes('soda') || n.includes('beverage')) return 'drinks';
  return 'default';
}

const FALLBACK_CRUSTS = [
  { id: 'hand-tossed', name: 'Hand Tossed', price: 0 },
  { id: 'thin-crust', name: 'Thin Crust', price: 0 },
  { id: 'pan', name: 'Pan Pizza', price: 1 },
  { id: 'stuffed', name: 'Stuffed Crust', price: 2.5 },
  { id: 'garlic-parmesan-stuffed', name: 'Garlic Parmesan Stuffed', price: 3 },
  { id: 'cauliflower', name: 'Cauliflower', price: 2.5 },
  { id: 'gluten-free', name: 'Gluten-Free', price: 2.5 },
];

const FALLBACK_SAUCES = [
  { id: 'tomato', name: 'Classic Tomato', price: 0 },
  { id: 'no-sauce', name: 'No Sauce', price: 0 },
  { id: 'pizza-sauce', name: 'Pizza Sauce', price: 0 },
  { id: 'bbq-sauce', name: 'BBQ Sauce', price: 0 },
  { id: 'bbq', name: 'BBQ Sauce', price: 0 },
  { id: 'alfredo-sauce', name: 'Alfredo Sauce', price: 0 },
  { id: 'alfredo', name: 'Alfredo', price: 0.5 },
  { id: 'pesto', name: 'Pesto', price: 0.5 },
  { id: 'garlic-herb', name: 'Garlic Herb', price: 0 },
  { id: 'tzatziki', name: 'Tzatziki', price: 0 },
  { id: 'buffalo', name: 'Buffalo', price: 0 },
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

const FALLBACK_WING_FLAVORS = [
  { id: 'buffalo', name: 'Buffalo', heat: 'medium', description: 'Classic hot sauce' },
  { id: 'garlic-parm', name: 'Garlic Parmesan', heat: 'mild', description: 'Buttery garlic & parmesan' },
  { id: 'bbq', name: 'Honey BBQ', heat: 'mild', description: 'Sweet & smoky' },
  { id: 'lemon-pepper', name: 'Lemon Pepper', heat: 'mild', description: 'Zesty & tangy' },
  { id: 'teriyaki', name: 'Teriyaki', heat: 'mild', description: 'Sweet Asian glaze' },
  { id: 'mango-habanero', name: 'Mango Habanero', heat: 'hot', description: 'Sweet & fiery' },
  { id: 'hot', name: 'Hot', heat: 'hot', description: 'Extra spicy buffalo' },
  { id: 'atomic', name: 'Atomic', heat: 'extra-hot', description: 'Warning: Extremely hot!' },
  { id: 'sweet-chili', name: 'Sweet Chili', heat: 'medium', description: 'Thai sweet chili' },
  { id: 'cajun', name: 'Cajun', heat: 'medium', description: 'Louisiana style' },
];
const FALLBACK_WING_PREP = [
  { id: 'traditional', name: 'Traditional', price: 0 },
  { id: 'boneless', name: 'Boneless', price: 0 },
  { id: 'mixed', name: 'Mixed Drumettes & Flats', price: 0 },
  { id: 'drumettes', name: 'All Drumettes', price: 0 },
  { id: 'flats', name: 'All Flats', price: 0 },
];
const FALLBACK_WING_SIDES = [
  { id: 'celery', name: 'Celery Sticks', price: 1.99 },
  { id: 'carrots', name: 'Carrot Sticks', price: 1.99 },
  { id: 'fries-small', name: 'Small Fries', price: 3.99 },
  { id: 'fries-large', name: 'Large Fries', price: 5.99 },
  { id: 'onion-rings', name: 'Onion Rings', price: 4.99 },
  { id: 'coleslaw', name: 'Coleslaw', price: 2.99 },
  { id: 'side-salad', name: 'Side Salad', price: 3.99 },
  { id: 'cheese-sticks', name: 'Mozzarella Sticks (5pc)', price: 5.99 },
];
const FALLBACK_WING_DIPS = [
  { id: 'ranch', name: 'Ranch', price: 0.79 },
  { id: 'blue-cheese', name: 'Blue Cheese', price: 0.79 },
  { id: 'honey-mustard', name: 'Honey Mustard', price: 0.79 },
  { id: 'buffalo-ranch', name: 'Buffalo Ranch', price: 0.79 },
  { id: 'bbq-dip', name: 'BBQ', price: 0.79 },
  { id: 'garlic-sauce', name: 'Garlic Sauce', price: 0.79 },
];
const FALLBACK_WING_EXTRAS = [
  { id: 'extra-ranch', name: 'Extra Ranch Cup', price: 0.79 },
  { id: 'extra-blue', name: 'Extra Blue Cheese', price: 0.79 },
  { id: 'extra-celery', name: 'Extra Celery', price: 0.99 },
];
const FALLBACK_SODAS = ['Pepsi', 'Diet Pepsi', 'Mountain Dew', 'Starry', 'Orange Soda', 'Ginger Ale', 'Coca-Cola'];
const FALLBACK_SUB_BREADS = [
  { id: 'white', name: 'White', price: 0 },
  { id: 'wheat', name: 'Whole Wheat', price: 0 },
  { id: 'italian', name: 'Italian Herb', price: 0 },
  { id: 'parmesan', name: 'Parmesan Oregano', price: 0 },
];
const FALLBACK_SUB_MEATS = [
  { id: 'turkey', name: 'Turkey Breast', price: 0 },
  { id: 'ham', name: 'Black Forest Ham', price: 0 },
  { id: 'roast-beef', name: 'Roast Beef', price: 0 },
  { id: 'salami', name: 'Genoa Salami', price: 0 },
  { id: 'pepperoni', name: 'Pepperoni', price: 0 },
  { id: 'meatballs', name: 'Italian Meatballs', price: 0 },
  { id: 'chicken', name: 'Grilled Chicken', price: 0 },
];
const FALLBACK_SUB_CHEESES = [
  { id: 'american', name: 'American', price: 0 },
  { id: 'provolone', name: 'Provolone', price: 0 },
  { id: 'swiss', name: 'Swiss', price: 0 },
  { id: 'cheddar', name: 'Cheddar', price: 0 },
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
  { id: 'italian', name: 'Italian Dressing', price: 0 },
  { id: 'ranch', name: 'Ranch', price: 0 },
  { id: 'chipotle', name: 'Chipotle', price: 0 },
];
const FALLBACK_PIZZA_SIZES = [
  { id: 'small', name: 'Small', price: 0 },
  { id: 'medium', name: 'Medium', price: 0 },
  { id: 'large', name: 'Large', price: 0 },
  { id: 'xlarge', name: 'X-Large', price: 2 },
];
const FALLBACK_CHEESES = [
  { id: 'mozzarella', name: 'Mozzarella', price: 0 },
  { id: 'no-cheese', name: 'No Cheese', price: 0 },
  { id: 'extra-mozzarella', name: 'Extra Mozzarella', price: 1.5 },
  { id: 'cheddar', name: 'Cheddar Blend', price: 0.5 },
  { id: 'four-cheese', name: 'Four Cheese', price: 1 },
];
const PIZZA_AMOUNT_UPCHARGE = 0.5;
type ToppingAmount = 'LIGHT' | 'REGULAR' | 'EXTRA';
const TOPPING_AMOUNT_OPTIONS: Array<{ id: ToppingAmount; name: string; multiplier: number }> = [
  { id: 'LIGHT', name: 'Light', multiplier: 0.75 },
  { id: 'REGULAR', name: 'Regular', multiplier: 1 },
  { id: 'EXTRA', name: 'Extra', multiplier: 1.5 },
];

const moneyLabel = (price = 0) => (price > 0 ? `+$${price.toFixed(2)}` : 'Included');
const toppingAmountMultiplier = (amount?: ToppingAmount) => TOPPING_AMOUNT_OPTIONS.find((option) => option.id === (amount || 'REGULAR'))?.multiplier || 1;
const toppingAmountName = (amount?: ToppingAmount) => TOPPING_AMOUNT_OPTIONS.find((option) => option.id === (amount || 'REGULAR'))?.name || 'Regular';
const toppingNameWithAmount = (name: string, amount?: ToppingAmount) => `${amount && amount !== 'REGULAR' ? `${toppingAmountName(amount)} ` : ''}${name}`;

function defaultSelectionsForType(type: ReturnType<typeof getCategoryType>): Record<string, string[]> {
  if (type === 'pizza') return { pizzaSize: ['large'], crust: ['hand-tossed'], sauce: ['tomato'], cheese: ['mozzarella'], cheesePlacement: ['FULL'], cheeseAmount: ['REGULAR'], fallbackToppings: [] };
  if (type === 'wings') return { wingFlavor: ['buffalo'], wingPrepType: ['traditional'], wingPrepCut: ['mixed'], wingSides: [], wingDips: [], wingExtras: [] };
  if (type === 'drinks') return { soda: ['Pepsi'] };
  if (type === 'subs') return { subBread: ['white'], subMeats: [], subCheeses: [], subVeggies: ['lettuce', 'tomatoes', 'onions'], subSauces: ['mayo'] };
  return {};
}

const ComboCustomizerModal: React.FC<Props> = ({ combo, storeId, onAdd, onCancel }) => {
  const [items, setItems] = useState<any[]>([]);
  const [step, setStep] = useState(0);
  const [qty, setQty] = useState(1);
  const [catProducts, setCatProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [wingTab, setWingTab] = useState<'flavors' | 'sides' | 'extras'>('flavors');
  const [fallbackToppingGroup, setFallbackToppingGroup] = useState('vegetables');

  const [activeToppingId, setActiveToppingId] = useState<string | null>(null);

  // Init items from combo
  useEffect(() => {
    const init = combo.items.map((item: any) => {
      const itemType = getCategoryType(item?.category?.name || item?.productGroupLabel || item?.name || item?.componentType);
      return {
        ...item,
        selectedProduct: item.isProductFixed ? item.product : null,
	        selections: defaultSelectionsForType(itemType) as Record<string, string[]>,
	        toppingSides: {} as Record<string, 'LEFT' | 'RIGHT' | 'FULL'>,
	        toppingAmounts: {} as Record<string, ToppingAmount>,
	        specialInstructions: '',
	        priceAdj: 0,
      };
    });
    setItems(init);
    setActiveToppingId(null);
  }, [combo]);

  // Load products when step changes
  useEffect(() => {
    const cur = items[step];
    if (cur && !cur.isProductFixed && cur.categoryId) {
      setLoading(true);
      setCatProducts([]);
      const storeParam = storeId ? `&storeId=${encodeURIComponent(storeId)}` : '';
      fetch(`${API_URL}/api/v1/menu/products?categoryId=${cur.categoryId}${storeParam}`)
        .then(r => r.json())
        .then(d => setCatProducts(d || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [step, items.length, storeId]);

  const cur = items[step];
  const catType = getCategoryType(cur?.category?.name || cur?.productGroupLabel || cur?.name || cur?.selectedProduct?.name);

  const selectProduct = (product: any) => {
    const u = [...items];
    const itemType = getCategoryType(u[step]?.category?.name || u[step]?.productGroupLabel || product.name || u[step]?.name);
    u[step] = {
      ...u[step],
      selectedProduct: product,
	      name: product.name,
	      selections: defaultSelectionsForType(itemType),
	      toppingSides: {},
	      toppingAmounts: {},
	      priceAdj: 0,
    };
    setItems(u);
  };

  const toggleAddon = (setId: string, addonId: string, maxSelect?: number) => {
    const u = [...items];
    const sel = { ...(u[step].selections || {}) };
    const arr = [...(sel[setId] || [])];
    const idx = arr.indexOf(addonId);
    if (idx >= 0) arr.splice(idx, 1);
    else if (!maxSelect || arr.length < maxSelect) arr.push(addonId);
    sel[setId] = arr;
    u[step] = { ...u[step], selections: sel };
    // Recalculate price adjustment
    u[step].priceAdj = calcItemAdj(u[step]);
    setItems(u);
  };

  const togglePizzaTopping = (setId: string, addonId: string, maxSelect?: number) => {
    const u = [...items];
	    const sel = { ...(u[step].selections || {}) };
	    const sides = { ...(u[step].toppingSides || {}) };
	    const amounts = { ...(u[step].toppingAmounts || {}) };
    const arr = [...(sel[setId] || [])];
    const idx = arr.indexOf(addonId);
    
    if (idx >= 0) {
	      arr.splice(idx, 1);
	      delete sides[addonId];
	      delete amounts[addonId];
	      if (activeToppingId === addonId) setActiveToppingId(null);
    } else {
      if (!maxSelect || arr.length < maxSelect) {
	        arr.push(addonId);
	        sides[addonId] = 'FULL';
	        amounts[addonId] = 'REGULAR';
	        setActiveToppingId(addonId);
      }
    }
    
    sel[setId] = arr;
	    u[step] = { ...u[step], selections: sel, toppingSides: sides, toppingAmounts: amounts };
	    u[step].priceAdj = calcItemAdj(u[step]);
	    setItems(u);
	  };

  const changeToppingSide = (e: React.MouseEvent, addonId: string, side: 'LEFT' | 'RIGHT' | 'FULL') => {
    e.stopPropagation();
	    const u = [...items];
	    const sides = { ...(u[step].toppingSides || {}) };
	    const amounts = { ...(u[step].toppingAmounts || {}) };
	    sides[addonId] = side;
	    amounts[addonId] = amounts[addonId] || 'REGULAR';
	    u[step] = { ...u[step], toppingSides: sides, toppingAmounts: amounts };
	    u[step].priceAdj = calcItemAdj(u[step]);
	    setActiveToppingId(addonId);
	    setItems(u);
	  };

	  const changeToppingAmount = (e: React.MouseEvent, addonId: string, amount: ToppingAmount) => {
	    e.stopPropagation();
	    const u = [...items];
	    const sides = { ...(u[step].toppingSides || {}) };
	    const amounts = { ...(u[step].toppingAmounts || {}) };
	    sides[addonId] = sides[addonId] || 'FULL';
	    amounts[addonId] = amount;
	    u[step] = { ...u[step], toppingSides: sides, toppingAmounts: amounts };
	    u[step].priceAdj = calcItemAdj(u[step]);
	    setActiveToppingId(addonId);
	    setItems(u);
	  };

  const setSingleAddon = (setId: string, addonId: string) => {
    const u = [...items];
    const sel = { ...(u[step].selections || {}) };
    const current = sel[setId] || [];
    sel[setId] = current.includes(addonId) ? [] : [addonId];
    u[step] = { ...u[step], selections: sel };
    u[step].priceAdj = calcItemAdj(u[step]);
    setItems(u);
  };

  const setFallbackSingle = (key: string, value: string) => {
    const u = [...items];
    const sel = { ...(u[step].selections || {}) };
    sel[key] = [value];
    u[step] = { ...u[step], selections: sel };
    u[step].priceAdj = calcItemAdj(u[step]);
    setItems(u);
  };

  const toggleFallbackMulti = (key: string, value: string, maxSelect?: number) => {
    const u = [...items];
    const sel = { ...(u[step].selections || {}) };
    const amounts = { ...(u[step].toppingAmounts || {}) };
    const current = [...(sel[key] || [])];
    const index = current.indexOf(value);
    if (index >= 0) {
      current.splice(index, 1);
      delete amounts[value];
    }
    else if (!maxSelect || current.length < maxSelect) {
      current.push(value);
      amounts[value] = amounts[value] || 'REGULAR';
    }
    sel[key] = current;
    u[step] = { ...u[step], selections: sel, toppingAmounts: amounts };
    u[step].priceAdj = calcItemAdj(u[step]);
    setItems(u);
  };

  const setFallbackAmount = (key: string, value: string, amount: ToppingAmount, maxSelect?: number) => {
    const u = [...items];
    const sel = { ...(u[step].selections || {}) };
    const amounts = { ...(u[step].toppingAmounts || {}) };
    const selected = new Set<string>(sel[key] || []);
    if (!maxSelect || selected.size < maxSelect || selected.has(value)) selected.add(value);
    sel[key] = Array.from(selected);
    amounts[value] = amount;
    u[step] = { ...u[step], selections: sel, toppingAmounts: amounts };
    u[step].priceAdj = calcItemAdj(u[step]);
    setItems(u);
  };

  const setFallbackToppingSide = (addonId: string, side: 'LEFT' | 'RIGHT' | 'FULL') => {
    const u = [...items];
    const sel = { ...(u[step].selections || {}) };
	    const selected = new Set<string>(sel.fallbackToppings || []);
	    const sides = { ...(u[step].toppingSides || {}) };
	    const amounts = { ...(u[step].toppingAmounts || {}) };
    if (side === 'FULL') {
      if (sides[addonId] === 'FULL') {
	        selected.delete(addonId);
	        delete sides[addonId];
	        delete amounts[addonId];
	      } else {
	        selected.add(addonId);
	        sides[addonId] = 'FULL';
	        amounts[addonId] = amounts[addonId] || 'REGULAR';
	      }
	    } else if (sides[addonId] === side) {
	      selected.delete(addonId);
	      delete sides[addonId];
	      delete amounts[addonId];
	    } else {
	      selected.add(addonId);
	      sides[addonId] = side;
	      amounts[addonId] = amounts[addonId] || 'REGULAR';
	    }
	    sel.fallbackToppings = Array.from(selected);
	    u[step] = { ...u[step], selections: sel, toppingSides: sides, toppingAmounts: amounts };
	    u[step].priceAdj = calcItemAdj(u[step]);
	    setItems(u);
	  };

	  const setFallbackToppingAmount = (addonId: string, amount: ToppingAmount) => {
	    const u = [...items];
	    const sel = { ...(u[step].selections || {}) };
	    const selected = new Set<string>(sel.fallbackToppings || []);
	    const sides = { ...(u[step].toppingSides || {}) };
	    const amounts = { ...(u[step].toppingAmounts || {}) };
	    selected.add(addonId);
	    sides[addonId] = sides[addonId] || 'FULL';
	    amounts[addonId] = amount;
	    sel.fallbackToppings = Array.from(selected);
	    u[step] = { ...u[step], selections: sel, toppingSides: sides, toppingAmounts: amounts };
	    u[step].priceAdj = calcItemAdj(u[step]);
	    setItems(u);
	  };

  const setInstructions = (text: string) => {
    const u = [...items];
    u[step] = { ...u[step], specialInstructions: text };
    setItems(u);
  };

  const calcItemAdj = (item: any) => {
    let adj = 0;
    const findAddonPrice = (addonId?: string) => {
      if (!addonId) return 0;
      for (const pas of item.selectedProduct?.addonSets || []) {
        const found = pas.addonSet?.addons?.find((a: any) => a.addon?.id === addonId);
        if (found) return Number(found.priceOverride ?? found.addon.price ?? 0);
      }
      return 0;
    };
    const sizeId = item.selections?.pizzaSize?.[0];
    adj += FALLBACK_PIZZA_SIZES.find((option) => option.id === sizeId)?.price || 0;
    const crustId = item.selections?.crust?.[0];
    adj += findAddonPrice(crustId) || FALLBACK_CRUSTS.find((option) => option.id === crustId)?.price || 0;
    const sauceId = item.selections?.sauce?.[0];
    adj += findAddonPrice(sauceId) || FALLBACK_SAUCES.find((option) => option.id === sauceId)?.price || 0;
	    const cheeseId = item.selections?.cheese?.[0];
	    adj += findAddonPrice(cheeseId) || FALLBACK_CHEESES.find((option) => option.id === cheeseId)?.price || 0;
    if (sauceId !== 'no-sauce' && item.selections?.sauceAmount?.[0] === 'extra') adj += PIZZA_AMOUNT_UPCHARGE;
		    const cheesePlacement = item.selections?.cheesePlacement?.[0];
		    if (cheeseId !== 'no-cheese' && (cheesePlacement === 'LEFT' || cheesePlacement === 'RIGHT')) adj -= (findAddonPrice(cheeseId) || FALLBACK_CHEESES.find((option) => option.id === cheeseId)?.price || 0) * 0.5;
		    if (cheeseId !== 'no-cheese' && item.selections?.cheeseAmount?.[0] === 'EXTRA') adj += PIZZA_AMOUNT_UPCHARGE;

    const fallbackToppings: string[] = item.selections?.fallbackToppings || [];
    const includedFallback = item.selectionRules?.includedSelections ?? item.maxIncludedToppings ?? 0;
	    fallbackToppings.forEach((id, index) => {
	      const topping = FALLBACK_TOPPING_GROUPS.flatMap((group) => group.options).find((option) => option.id === id);
	      const toppingPrice = findAddonPrice(id) || topping?.price || 0;
	      if (!topping && !toppingPrice) return;
	      const side = item.toppingSides?.[id] || 'FULL';
	      const sideMultiplier = side === 'LEFT' || side === 'RIGHT' ? 0.5 : 1;
	      const amountMultiplier = toppingAmountMultiplier(item.toppingAmounts?.[id]);
	      const adjustedPrice = (toppingPrice || 1.5) * sideMultiplier * amountMultiplier;
	      if (index >= includedFallback) adj += adjustedPrice;
	      else if (toppingPrice > 0) adj += toppingPrice * sideMultiplier * amountMultiplier;
	    });

    if ((item.selections?.wingFlavor || []).length > 1) adj += 1;
    (item.selections?.wingSides || []).forEach((id: string) => {
      adj += FALLBACK_WING_SIDES.find((option) => option.id === id)?.price || 0;
    });
	    (item.selections?.wingDips || []).forEach((id: string) => {
	      adj += (FALLBACK_WING_DIPS.find((option) => option.id === id)?.price || 0) * toppingAmountMultiplier(item.toppingAmounts?.[id]);
	    });
	    (item.selections?.wingExtras || []).forEach((id: string) => {
	      adj += (FALLBACK_WING_EXTRAS.find((option) => option.id === id)?.price || 0) * toppingAmountMultiplier(item.toppingAmounts?.[id]);
	    });

    if (!item.selectedProduct?.addonSets) return adj;
    const freeLimit = item.selectionRules?.includedSelections ?? item.maxIncludedToppings ?? 0;
    let toppingCount = 0;
    for (const pas of item.selectedProduct.addonSets) {
	        const set = pas.addonSet;
	        const selected = item.selections?.[set.id] || [];
	        for (const sid of selected) {
	          const sa = set.addons.find((a: any) => a.addon.id === sid);
	          if (!sa) continue;
	          const price = Number(sa.priceOverride ?? sa.addon.price ?? 0);
	          const side = item.toppingSides?.[sid];
	          const isPizzaTopping = side || String(set.name || '').toLowerCase().includes('topping') || String(set.name || '').toLowerCase().includes('meat') || String(set.name || '').toLowerCase().includes('veggie');
	          const sideMultiplier = isPizzaTopping && (side === 'LEFT' || side === 'RIGHT') ? 0.5 : 1;
	          const amountMultiplier = isPizzaTopping ? toppingAmountMultiplier(item.toppingAmounts?.[sid]) : 1;
	          const adjustedPrice = price * sideMultiplier * amountMultiplier;
	          if (price > 0) {
	            if (toppingCount < freeLimit) { toppingCount++; }
	          else { adj += adjustedPrice; toppingCount++; }
	          }
	        }
	      }
    return adj;
  };

  const updateCurrentItem = (patch: Partial<any>) => {
    const u = [...items];
    const nextItem = { ...u[step], ...patch };
    nextItem.priceAdj = calcItemAdj(nextItem);
    u[step] = nextItem;
    setItems(u);
  };

  const totalPrice = useMemo(() => {
    let t = Number(combo.basePrice);
    items.forEach(i => { t += (i.priceAdj || 0); });
    return t * qty;
  }, [items, qty, combo.basePrice]);

  const handleComplete = () => {
    const incomplete = items.find((item) => !isItemComplete(item));
    if (incomplete) return;

    const modifiers = items.map(item => {
      const parts = [item.name || item.selectedProduct?.name];
      if (item.selectedProduct?.addonSets) {
        for (const pas of item.selectedProduct.addonSets) {
          const ids = item.selections?.[pas.addonSet.id] || [];
          const names = ids.map((id: string) => {
            const sa = pas.addonSet.addons.find((a: any) => a.addon.id === id);
            if (!sa) return null;
	            const side = item.toppingSides?.[id];
	            const amount = item.toppingAmounts?.[id] as ToppingAmount | undefined;
	            const displayName = toppingNameWithAmount(sa.addon.name, amount);
	            if (side && side !== 'FULL') {
	              return `${displayName} (${side === 'LEFT' ? 'Left' : 'Right'})`;
	            }
	            return displayName;
          }).filter(Boolean);
          if (names.length) parts.push(names.join(', '));
        }
      }
      if (item.selections?.crust?.[0]) {
        const crust = FALLBACK_CRUSTS.find((option) => option.id === item.selections.crust[0]);
        if (crust) parts.push(`Crust: ${crust.name}`);
      }
	      if (item.selections?.sauce?.[0]) {
	        const sauce = FALLBACK_SAUCES.find((option) => option.id === item.selections.sauce[0]);
	        if (sauce) parts.push(`Sauce: ${sauce.name}`);
	      }
	      if (item.selections?.cheese?.[0]) {
	        const cheese = FALLBACK_CHEESES.find((option) => option.id === item.selections.cheese[0]);
	        const amount = item.selections?.cheeseAmount?.[0] as ToppingAmount | undefined;
	        const placement = item.selections?.cheesePlacement?.[0] || 'FULL';
	        if (cheese) parts.push(`Cheese: ${toppingNameWithAmount(cheese.name, amount)} (${placement === 'FULL' ? 'Whole' : placement === 'LEFT' ? 'Left' : 'Right'})`);
	      }
      if (item.selections?.fallbackToppings?.length) {
        const toppingNames = item.selections.fallbackToppings.map((id: string) => {
	          const topping = FALLBACK_TOPPING_GROUPS.flatMap((group) => group.options).find((option) => option.id === id);
	          const side = item.toppingSides?.[id];
	          const amount = item.toppingAmounts?.[id] as ToppingAmount | undefined;
	          if (!topping) return null;
	          return `${toppingNameWithAmount(topping.name, amount)}${side && side !== 'FULL' ? ` (${side === 'LEFT' ? 'Left' : 'Right'})` : ''}`;
	        }).filter(Boolean);
        if (toppingNames.length) parts.push(`Toppings: ${toppingNames.join(', ')}`);
      }
	      if (item.selections?.wingFlavor?.length) {
	        const flavorNames = item.selections.wingFlavor
	          .map((id: string) => toppingNameWithAmount(FALLBACK_WING_FLAVORS.find((option) => option.id === id)?.name || id, item.toppingAmounts?.[id]))
	          .filter(Boolean);
	        parts.push(`Flavors: ${flavorNames.join(', ')}`);
	      }
      const wingPrep = [...(item.selections?.wingPrepType || []), ...(item.selections?.wingPrepCut || [])];
      if (wingPrep.length) {
        const prepNames = wingPrep
          .map((id: string) => FALLBACK_WING_PREP.find((option) => option.id === id)?.name || id)
          .filter(Boolean);
        parts.push(`Style: ${prepNames.join(', ')}`);
      }
      if (item.selections?.wingSides?.length) {
        const sideNames = item.selections.wingSides.map((id: string) => FALLBACK_WING_SIDES.find((option) => option.id === id)?.name).filter(Boolean);
        if (sideNames.length) parts.push(`Sides: ${sideNames.join(', ')}`);
      }
	      if (item.selections?.wingDips?.length) {
	        const dipNames = item.selections.wingDips.map((id: string) => {
	          const dip = FALLBACK_WING_DIPS.find((option) => option.id === id);
	          return dip ? toppingNameWithAmount(dip.name, item.toppingAmounts?.[id]) : null;
	        }).filter(Boolean);
	        if (dipNames.length) parts.push(`Dips: ${dipNames.join(', ')}`);
	      }
	      if (item.selections?.wingExtras?.length) {
	        const extraNames = item.selections.wingExtras.map((id: string) => {
	          const extra = FALLBACK_WING_EXTRAS.find((option) => option.id === id);
	          return extra ? toppingNameWithAmount(extra.name, item.toppingAmounts?.[id]) : null;
	        }).filter(Boolean);
	        if (extraNames.length) parts.push(`Extras: ${extraNames.join(', ')}`);
	      }
      if (item.selections?.subBread?.[0]) {
        const bread = FALLBACK_SUB_BREADS.find((option) => option.id === item.selections.subBread[0]);
        if (bread) parts.push(`Bread: ${bread.name}`);
      }
      if (item.selections?.subMeats?.length) {
        const meatNames = item.selections.subMeats.map((id: string) => FALLBACK_SUB_MEATS.find((option) => option.id === id)?.name).filter(Boolean);
        if (meatNames.length) parts.push(`Meats: ${meatNames.join(', ')}`);
      }
	      if (item.selections?.subCheeses?.length) {
	        const cheeseNames = item.selections.subCheeses.map((id: string) => {
	          const cheese = FALLBACK_SUB_CHEESES.find((option) => option.id === id);
	          return cheese ? toppingNameWithAmount(cheese.name, item.toppingAmounts?.[id]) : null;
	        }).filter(Boolean);
	        if (cheeseNames.length) parts.push(`Cheese: ${cheeseNames.join(', ')}`);
	      }
      if (item.selections?.subVeggies?.length) {
        const veggieNames = item.selections.subVeggies.map((id: string) => FALLBACK_SUB_VEGGIES.find((option) => option.id === id)?.name).filter(Boolean);
        if (veggieNames.length) parts.push(`Veggies: ${veggieNames.join(', ')}`);
      }
      if (item.selections?.subSauces?.length) {
        const sauceNames = item.selections.subSauces.map((id: string) => FALLBACK_SUB_SAUCES.find((option) => option.id === id)?.name).filter(Boolean);
        if (sauceNames.length) parts.push(`Sauces: ${sauceNames.join(', ')}`);
      }
      if (item.selections?.soda?.[0]) parts.push(`Drink: ${item.selections.soda[0]}`);
      if (item.specialInstructions) parts.push(`Note: ${item.specialInstructions}`);
      return parts.join(' • ');
    });

    onAdd({
      id: `combo-${combo.id}-${Date.now()}`,
      name: combo.name,
      price: totalPrice / qty,
      quantity: qty,
      image: getFoodImage({ ...combo, isCombo: true }),
      description: combo.description,
      isCombo: true,
      modifiers,
	      items: items.map(i => ({
	        productId: i.selectedProduct?.id || i.productId || `${getCategoryType(i?.category?.name || i?.productGroupLabel || i?.name)}-combo-item`,
	        productName: i.selectedProduct?.name || i.name || i.productGroupLabel,
        quantity: i.quantity,
        componentType: i.componentType,
	        selectionRules: i.selectionRules,
		        selections: i.selections,
		        toppingSides: i.toppingSides,
		        toppingAmounts: i.toppingAmounts,
		        specialInstructions: i.specialInstructions,
      })),
    });
  };

  const isItemComplete = (item: any) => {
    const itemType = getCategoryType(item?.category?.name || item?.productGroupLabel || item?.name || item?.selectedProduct?.name);
    if (!item?.selectedProduct && !item?.isProductFixed) {
      if (itemType === 'wings') return Boolean(item.selections?.wingFlavor?.length);
      return false;
    }
    const minSelections = item.selectionRules?.minSelections ?? 0;
    if (!minSelections) return true;
    const selectedCount = Object.values(item.selections || {}).reduce((sum: number, ids: any) => (
      sum + (Array.isArray(ids) ? ids.length : 0)
    ), 0);
    return selectedCount >= minSelections;
  };

  const canProceed = cur && isItemComplete(cur);

  // ==================== RENDER HELPERS ====================

  const renderAddonSet = (pas: any, compact = false, isPizzaTopping = false) => {
	    const set = pas.addonSet;
	    const selected = cur?.selections?.[set.id] || [];
	    const sides = cur?.toppingSides || {};
	    const amounts = cur?.toppingAmounts || {};
    const ruleMax = cur?.selectionRules?.maxSelections;
    const maxSelect = ruleMax ?? set.maxSelect;
    const isSingle = maxSelect === 1;
    const mode = cur?.selectionRules?.customerSelectionMode || 'CUSTOMER_ELIGIBLE';
    const eligibleAddonIds = cur?.selectionRules?.eligibleAddonIds || [];
    const visibleAddons = mode === 'CUSTOMER_ALL_ACTIVE' || eligibleAddonIds.length === 0
      ? set.addons
      : set.addons.filter((sa: any) => eligibleAddonIds.includes(sa.addon.id));
    if (mode === 'DISABLED' || mode === 'FIXED_ADMIN' || visibleAddons.length === 0) return null;

    return (
      <div key={set.id} className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <div className="w-1 h-4 bg-purple-500 rounded-full" />
            {set.name}
          </h4>
          {maxSelect && (
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-mono">
              {isSingle ? 'Choose 1' : `${selected.length}/${maxSelect}`}
            </span>
          )}
        </div>
        <div className={compact ? "flex flex-wrap gap-2" : "grid grid-cols-2 sm:grid-cols-3 gap-2"}>
          {visibleAddons.map((sa: any) => {
            const addon = sa.addon;
            const isSel = selected.includes(addon.id);
            const canSel = isSel || !maxSelect || selected.length < maxSelect;
            const price = Number(sa.priceOverride ?? addon.price ?? 0);
	            const isActive = isPizzaTopping && activeToppingId === addon.id && isSel;
	            const currentSide = sides[addon.id] || 'FULL';
	            const currentAmount = amounts[addon.id] || 'REGULAR';

            return (
              <div key={addon.id} className="relative">
                <button
                  disabled={!isSel && !canSel}
                  onClick={() => {
                    if (isSingle) setSingleAddon(set.id, addon.id);
                    else if (isPizzaTopping) togglePizzaTopping(set.id, addon.id, maxSelect);
                    else toggleAddon(set.id, addon.id, maxSelect);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-left text-sm font-medium transition-all border ${
                    isSel
                      ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/20'
                      : !canSel && !isSel
                      ? 'opacity-30 cursor-not-allowed bg-slate-800/20 border-white/5'
                      : 'bg-slate-800/40 border-white/5 text-slate-300 hover:border-purple-500/30 hover:bg-slate-800/60'
                  } ${isActive ? 'ring-2 ring-white shadow-xl scale-[1.02] z-10' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate flex flex-col">
                      {addon.name}
	                      {isPizzaTopping && isSel && (
	                        <span className="text-[9px] uppercase tracking-wider text-purple-200 mt-0.5">
		                          {toppingAmountName(currentAmount)} - {currentSide === 'FULL' ? 'Full Pizza' : `${currentSide} HALF`}
	                        </span>
	                      )}
                    </span>
                    <span className={`text-[10px] whitespace-nowrap ${isSel ? 'text-purple-200' : 'text-slate-500'}`}>
                      {price > 0 ? `+$${price.toFixed(2)}` : 'FREE'}
                    </span>
                  </div>
                </button>
                
                {/* Side Selection Overlay for Pizza Toppings */}
	                {isActive && (
	                  <div className="absolute -bottom-[78px] left-0 right-0 z-50 animate-in fade-in slide-in-from-top-2 rounded-xl border border-white/10 bg-slate-800 p-1 shadow-2xl">
	                    <div className="grid grid-cols-3 gap-1">
	                      {(['LEFT', 'FULL', 'RIGHT'] as const).map((side) => (
	                        <button
	                          key={side}
	                          onClick={(e) => changeToppingSide(e, addon.id, side)}
	                          className={`rounded-lg py-1.5 text-[9px] font-black uppercase transition-colors ${
	                            currentSide === side ? 'bg-purple-500 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'
	                          }`}
	                        >
	                          {side === 'FULL' ? 'Full' : side === 'LEFT' ? 'Left' : 'Right'}
	                        </button>
	                      ))}
	                    </div>
	                    <div className="mt-1 grid grid-cols-3 gap-1 border-t border-white/10 pt-1">
	                      {TOPPING_AMOUNT_OPTIONS.map((amount) => (
	                        <button
	                          key={amount.id}
	                          onClick={(e) => changeToppingAmount(e, addon.id, amount.id)}
	                          className={`rounded-lg py-1.5 text-[9px] font-black uppercase transition-colors ${
	                            currentAmount === amount.id ? 'bg-white text-slate-950' : 'text-slate-400 hover:bg-white/10 hover:text-white'
	                          }`}
	                        >
	                          {amount.name}
	                        </button>
	                      ))}
	                    </div>
	                  </div>
	                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderFallbackChoice = (
    keyName: string,
    option: { id: string; name: string; price?: number },
    accent: 'green' | 'orange' | 'purple' = 'purple',
  ) => {
    const selected = cur?.selections?.[keyName]?.[0] === option.id;
    const selectedClass = accent === 'green'
      ? 'border-green-500 bg-green-500/15'
      : accent === 'orange'
        ? 'border-orange-500 bg-orange-500/15'
        : 'border-purple-500 bg-purple-500/15';
    return (
      <button
        key={option.id}
        type="button"
        aria-pressed={selected}
        onClick={() => setFallbackSingle(keyName, option.id)}
        className={`min-h-[76px] rounded-xl border p-4 text-left transition-all ${
          selected ? `${selectedClass} text-white` : 'border-white/10 bg-slate-800/45 text-slate-100 hover:border-white/25'
        }`}
      >
        <span className="flex items-start justify-between gap-3">
          <span>
            <span className="block font-black">{option.name}</span>
            <span className="mt-1 block text-xs text-slate-400">{moneyLabel(option.price || 0)}</span>
          </span>
          {selected && <CheckCircle size={18} className="shrink-0" />}
        </span>
      </button>
    );
  };

  const renderFallbackMultiChoice = (
    keyName: string,
    option: { id: string; name: string; price?: number },
    accent: 'green' | 'orange' | 'purple' = 'purple',
    maxSelect?: number,
  ) => {
    const values = cur?.selections?.[keyName] || [];
    const selected = values.includes(option.id);
    const atLimit = Boolean(maxSelect && values.length >= maxSelect && !selected);
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
        disabled={atLimit}
        onClick={() => toggleFallbackMulti(keyName, option.id, maxSelect)}
        className={`min-h-[70px] rounded-xl border p-4 text-left transition-all ${
          selected
            ? selectedClass
            : atLimit
              ? 'cursor-not-allowed border-white/5 bg-slate-800/20 text-slate-600'
              : 'border-white/10 bg-slate-800/45 text-slate-100 hover:border-white/25'
        }`}
      >
        <span className="flex items-start justify-between gap-3">
          <span>
            <span className="block font-black">{option.name}</span>
            <span className="mt-1 block text-xs text-slate-400">{moneyLabel(option.price || 0)}</span>
          </span>
          {selected && <CheckCircle size={18} className="shrink-0" />}
        </span>
      </button>
    );
  };

  const renderFallbackToppings = () => {
    const group = FALLBACK_TOPPING_GROUPS.find((item) => item.id === fallbackToppingGroup) || FALLBACK_TOPPING_GROUPS[0];
    const selected = cur?.selections?.fallbackToppings || [];
    const included = cur?.selectionRules?.includedSelections ?? cur?.maxIncludedToppings ?? 0;
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        <div className="mb-4 grid grid-cols-2 overflow-hidden rounded-xl border border-white/10">
          {FALLBACK_TOPPING_GROUPS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFallbackToppingGroup(item.id)}
              className={`px-4 py-3 text-sm font-black transition-colors ${
                fallbackToppingGroup === item.id ? 'bg-slate-800 text-white' : 'bg-slate-950/60 text-slate-400 hover:text-white'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className="space-y-2">
	          {group.options.map((option) => {
	            const side = cur?.toppingSides?.[option.id];
	            const amount = cur?.toppingAmounts?.[option.id] || 'REGULAR';
	            const isSelected = selected.includes(option.id);
	            return (
	              <div
	                key={option.id}
	                className={`overflow-hidden rounded-xl border transition-all ${
	                  side === 'FULL'
	                    ? 'border-yellow-400 bg-yellow-400/10'
	                    : isSelected
                      ? 'border-slate-500 bg-slate-800'
                      : 'border-white/10 bg-slate-950/50'
                }`}
	              >
	                <div className="grid min-h-[58px] grid-cols-[3.4rem_minmax(0,1fr)_3.4rem]">
	                  <button
	                    type="button"
	                    aria-pressed={side === 'LEFT'}
	                    onClick={() => setFallbackToppingSide(option.id, 'LEFT')}
	                    className={`border-r border-white/10 text-sm font-black ${side === 'LEFT' ? 'bg-green-600 text-white' : 'text-slate-300 hover:bg-green-900/40'}`}
	                  >
	                    {side === 'LEFT' ? <CheckCircle className="mx-auto" size={16} /> : 'L'}
	                  </button>
	                  <button
	                    type="button"
	                    aria-pressed={side === 'FULL'}
	                    onClick={() => setFallbackToppingSide(option.id, 'FULL')}
	                    className={`px-4 text-left font-bold ${side === 'FULL' ? 'text-yellow-100' : 'text-white hover:bg-slate-800'}`}
	                  >
	                    <span className="flex items-center justify-between gap-3">
	                      <span className="truncate">{toppingNameWithAmount(option.name, amount)}</span>
	                      <span className="shrink-0 text-xs text-slate-400">{moneyLabel(option.price)}</span>
	                    </span>
	                  </button>
	                  <button
	                    type="button"
	                    aria-pressed={side === 'RIGHT'}
	                    onClick={() => setFallbackToppingSide(option.id, 'RIGHT')}
	                    className={`border-l border-white/10 text-sm font-black ${side === 'RIGHT' ? 'bg-orange-600 text-white' : 'text-slate-300 hover:bg-orange-900/40'}`}
	                  >
	                    {side === 'RIGHT' ? <CheckCircle className="mx-auto" size={16} /> : 'R'}
	                  </button>
	                </div>
	                {isSelected && (
	                  <div className="grid grid-cols-3 border-t border-white/10 bg-slate-950/35 p-1">
	                    {TOPPING_AMOUNT_OPTIONS.map((amountOption) => (
	                      <button
	                        key={amountOption.id}
	                        type="button"
	                        onClick={() => setFallbackToppingAmount(option.id, amountOption.id)}
	                        className={`rounded-lg py-1.5 text-[10px] font-black uppercase transition-colors ${
	                          amount === amountOption.id ? 'bg-white text-slate-950' : 'text-slate-400 hover:bg-white/10 hover:text-white'
	                        }`}
	                      >
	                        {amountOption.name}
	                      </button>
	                    ))}
	                  </div>
	                )}
	              </div>
	            );
	          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span>{included > 0 ? `${Math.min(selected.length, included)}/${included} included toppings used` : 'Extra toppings may add charges'}</span>
          <button
            type="button"
            onClick={() => {
              const u = [...items];
	              u[step] = { ...u[step], selections: { ...u[step].selections, fallbackToppings: [] }, toppingSides: {}, toppingAmounts: {}, priceAdj: 0 };
              u[step].priceAdj = calcItemAdj(u[step]);
              setItems(u);
            }}
            className="rounded-lg border border-white/10 px-3 py-1.5 font-bold text-slate-300 hover:bg-slate-800"
          >
            Clear toppings
          </button>
        </div>
      </div>
    );
  };

  const renderFallbackPizzaCustomizer = () => {
    const prod = cur?.selectedProduct;
    const selected = cur?.selections?.fallbackToppings || [];
    const selectedNames = selected.map((id: string) => {
	      const topping = FALLBACK_TOPPING_GROUPS.flatMap((group) => group.options).find((option) => option.id === id);
	      const side = cur?.toppingSides?.[id];
	      const amount = cur?.toppingAmounts?.[id] as ToppingAmount | undefined;
	      return topping ? `${toppingNameWithAmount(topping.name, amount)}${side && side !== 'FULL' ? ` (${side === 'LEFT' ? 'Left' : 'Right'})` : ''}` : null;
	    }).filter(Boolean);
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <div className="relative overflow-hidden rounded-xl bg-slate-800 aspect-square">
            {prod?.imageUrl ? (
              <img src={prod.imageUrl} alt={prod.name} className="h-full w-full object-cover" />
            ) : (
              <img src="/pizzas/layers/base.png" alt={prod?.name || 'Pizza'} className="h-full w-full object-cover" />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4">
              <h3 className="text-lg font-black text-white">{prod?.name || 'Pizza'}</h3>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <h4 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">Your Pizza</h4>
            <p className="text-sm text-slate-200">
              {selectedNames.length ? selectedNames.join(', ') : 'No toppings selected'}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={12} /> Special Instructions
            </label>
            <textarea
              value={cur?.specialInstructions || ''}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g., light sauce, well done..."
              className="w-full resize-none rounded-xl border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-purple-500/50 focus:outline-none"
              rows={2}
            />
          </div>
        </div>
        <div className="space-y-6 lg:col-span-3 lg:max-h-[55vh] lg:overflow-y-auto lg:pr-1 custom-scrollbar">
          <section>
            <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-300">1. Choose Crust</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {FALLBACK_CRUSTS.map((option) => renderFallbackChoice('crust', option, 'green'))}
            </div>
          </section>
	          <section>
	            <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-300">2. Select Sauce</h4>
	            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
	              {FALLBACK_SAUCES.map((option) => renderFallbackChoice('sauce', option, 'orange'))}
	            </div>
	          </section>
	          <section>
	            <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-yellow-300">3. Cheese</h4>
	            <div className="space-y-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-3">
	              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
	                {FALLBACK_CHEESES.map((option) => renderFallbackChoice('cheese', option, 'purple'))}
	              </div>
	              <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-950/40 p-1">
	                {[
	                  { id: 'LEFT', name: 'Left' },
	                  { id: 'FULL', name: 'Whole' },
	                  { id: 'RIGHT', name: 'Right' },
	                ].map((placement) => (
	                  <button
	                    key={placement.id}
	                    type="button"
	                    onClick={() => setFallbackSingle('cheesePlacement', placement.id)}
	                    className={`rounded-lg py-2 text-xs font-black uppercase transition-colors ${
	                      (cur?.selections?.cheesePlacement?.[0] || 'FULL') === placement.id
	                        ? 'bg-yellow-400 text-slate-950'
	                        : 'text-slate-400 hover:bg-white/10 hover:text-white'
	                    }`}
	                  >
	                    {placement.name}
	                  </button>
	                ))}
	              </div>
	              <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-950/40 p-1">
	                {TOPPING_AMOUNT_OPTIONS.map((amount) => (
	                  <button
	                    key={amount.id}
	                    type="button"
	                    onClick={() => setFallbackSingle('cheeseAmount', amount.id)}
	                    className={`rounded-lg py-2 text-xs font-black uppercase transition-colors ${
	                      (cur?.selections?.cheeseAmount?.[0] || 'REGULAR') === amount.id
	                        ? 'bg-yellow-400 text-slate-950'
	                        : 'text-slate-400 hover:bg-white/10 hover:text-white'
	                    }`}
	                  >
	                    {amount.name}
	                  </button>
	                ))}
	              </div>
	            </div>
	          </section>
	          <section>
	            <div className="mb-3">
	              <h4 className="text-lg font-black text-white">4. Choose Toppings</h4>
              <p className="text-sm text-slate-400">Tap L, the topping name, or R for left, whole, or right.</p>
            </div>
            {renderFallbackToppings()}
          </section>
        </div>
      </div>
    );
  };

  const renderFallbackWingsCustomizer = () => {
    const prod = cur?.selectedProduct;
    const selectedFlavors = cur?.selections?.wingFlavor || [];
    const selectedPrep = [...(cur?.selections?.wingPrepType || []), ...(cur?.selections?.wingPrepCut || [])];
    const heatMark = (heat: string) => {
      if (heat === 'extra-hot') return '!!';
      if (heat === 'hot') return '!!!';
      if (heat === 'medium') return '!!';
      return '!';
    };
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <div className="relative overflow-hidden rounded-xl bg-slate-800 aspect-[4/3]">
            <img src={prod?.imageUrl || '/images/wings.png'} alt={prod?.name || 'Wings'} className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4">
              <h3 className="text-lg font-black text-white">{prod?.name || 'Wings'}</h3>
            </div>
          </div>
          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-300">Style</h4>
            <div className="grid grid-cols-2 gap-2">
              {FALLBACK_WING_PREP.slice(0, 2).map((option) => renderFallbackChoice('wingPrepType', option, 'orange'))}
            </div>
            <div className="mt-3 space-y-2">
              {FALLBACK_WING_PREP.slice(2).map((option) => {
                const selected = selectedPrep.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFallbackSingle('wingPrepCut', option.id)}
                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-bold transition-all ${
                      selected || cur?.selections?.wingPrepCut?.[0] === option.id
                        ? 'border-orange-500 bg-orange-500/15 text-white'
                        : 'border-white/10 bg-slate-800/45 text-slate-200 hover:border-white/25'
                    }`}
                  >
                    {option.name}
                  </button>
                );
              })}
            </div>
          </section>
          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-300">Dipping Sauces</h4>
            <div className="space-y-2">
	              {FALLBACK_WING_DIPS.map((dip) => {
	                const selected = (cur?.selections?.wingDips || []).includes(dip.id);
	                return (
	                  <div
	                    key={dip.id}
	                    className={`rounded-xl border p-3 transition-all ${
	                      selected ? 'border-sky-500 bg-sky-500/15 text-white' : 'border-white/10 bg-slate-800/45 text-slate-200 hover:border-white/25'
	                    }`}
	                  >
	                    <button
	                      type="button"
	                      onClick={() => toggleFallbackMulti('wingDips', dip.id)}
	                      className="flex w-full items-center justify-between text-left font-bold"
	                    >
	                      <span>{dip.name}</span>
	                      <span className="text-xs text-slate-400">{moneyLabel(dip.price)}</span>
	                    </button>
	                    {selected && (
	                      <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg bg-slate-950/50 p-1">
	                        {TOPPING_AMOUNT_OPTIONS.map((amount) => (
	                          <button
	                            key={amount.id}
	                            type="button"
	                            onClick={() => setFallbackAmount('wingDips', dip.id, amount.id)}
	                            className={`rounded-md px-2 py-1.5 text-[10px] font-black ${
	                              (cur?.toppingAmounts?.[dip.id] || 'REGULAR') === amount.id
	                                ? 'bg-sky-500 text-white'
	                                : 'text-slate-400 hover:bg-slate-800'
	                            }`}
	                          >
	                            {amount.name}
	                          </button>
	                        ))}
	                      </div>
	                    )}
	                  </div>
	                );
	              })}
            </div>
          </section>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={12} /> Special Instructions
            </label>
            <textarea
              value={cur?.specialInstructions || ''}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g., sauce on side, extra crispy..."
              className="w-full resize-none rounded-xl border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-purple-500/50 focus:outline-none"
              rows={2}
            />
          </div>
        </div>
        <div className="space-y-6 lg:col-span-3">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'flavors' as const, label: `Flavors ${selectedFlavors.length}/2` },
              { key: 'sides' as const, label: 'Sides' },
              { key: 'extras' as const, label: 'Extras' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setWingTab(tab.key)}
                className={`rounded-xl px-5 py-3 text-sm font-black transition-all ${
                  wingTab === tab.key
                    ? 'bg-gradient-to-r from-orange-600 to-rose-600 text-white shadow-lg shadow-orange-600/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <section>
            {wingTab === 'flavors' && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {FALLBACK_WING_FLAVORS.map((flavor) => {
                  const selected = selectedFlavors.includes(flavor.id);
                  return (
                    <button
                      key={flavor.id}
                      type="button"
                      onClick={() => toggleFallbackMulti('wingFlavor', flavor.id, 2)}
                      className={`min-h-[116px] rounded-xl border p-4 text-left transition-all ${
                        selected ? 'border-yellow-400 bg-yellow-300/15 text-white' : 'border-white/10 bg-slate-800/45 text-slate-100 hover:border-white/25'
                      }`}
                    >
                      <span className="flex items-start justify-between gap-3">
	                          <span>
	                            <span className="block font-black">{flavor.name}</span>
	                            <span className="mt-2 block text-sm text-slate-400">{flavor.description}</span>
	                            {selected && (
	                              <span className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-slate-950/50 p-1">
	                                {TOPPING_AMOUNT_OPTIONS.map((amount) => (
	                                  <button
	                                    key={amount.id}
	                                    type="button"
	                                    onClick={(event) => {
	                                      event.stopPropagation();
	                                      setFallbackAmount('wingFlavor', flavor.id, amount.id, 2);
	                                    }}
	                                    className={`rounded-md px-2 py-1.5 text-[10px] font-black ${
	                                      (cur?.toppingAmounts?.[flavor.id] || 'REGULAR') === amount.id
	                                        ? 'bg-orange-500 text-white'
	                                        : 'text-slate-400 hover:bg-slate-800'
	                                    }`}
	                                  >
	                                    {amount.name}
	                                  </button>
	                                ))}
	                              </span>
	                            )}
	                            {selected && <span className="mt-3 block text-xs font-black text-yellow-300">Selected</span>}
	                          </span>
                        <span className="text-xs font-black text-orange-300">{heatMark(flavor.heat)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {wingTab === 'sides' && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {FALLBACK_WING_SIDES.map((side) => {
                  const selected = (cur?.selections?.wingSides || []).includes(side.id);
                  return (
                    <button
                      key={side.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleFallbackMulti('wingSides', side.id)}
                      className={`rounded-xl border p-4 text-left font-bold transition-all ${
                        selected ? 'border-green-500 bg-green-500/15 text-white' : 'border-white/10 bg-slate-800/45 text-slate-100 hover:border-white/25'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span>{side.name}</span>
                        <span className="text-xs text-slate-400">{moneyLabel(side.price)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {wingTab === 'extras' && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {FALLBACK_WING_EXTRAS.map((side) => {
                const selected = (cur?.selections?.wingExtras || []).includes(side.id);
                return (
                  <button
                    key={side.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleFallbackMulti('wingExtras', side.id)}
                    className={`rounded-xl border p-4 text-left font-bold transition-all ${
                      selected ? 'border-purple-500 bg-purple-500/15 text-white' : 'border-white/10 bg-slate-800/45 text-slate-100 hover:border-white/25'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span>{side.name}</span>
                      <span className="text-xs text-slate-400">{moneyLabel(side.price)}</span>
                    </span>
                  </button>
                );
              })}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  };

  const renderFallbackSubCustomizer = () => {
    const prod = cur?.selectedProduct;
    const selectedMeats = (cur?.selections?.subMeats || [])
      .map((id: string) => FALLBACK_SUB_MEATS.find((item) => item.id === id)?.name)
      .filter(Boolean);
	    const selectedCheeses = (cur?.selections?.subCheeses || [])
	      .map((id: string) => {
	        const cheese = FALLBACK_SUB_CHEESES.find((item) => item.id === id);
	        return cheese ? toppingNameWithAmount(cheese.name, cur?.toppingAmounts?.[id]) : null;
	      })
	      .filter(Boolean);
    const selectedVeggies = (cur?.selections?.subVeggies || [])
      .map((id: string) => FALLBACK_SUB_VEGGIES.find((item) => item.id === id)?.name)
      .filter(Boolean);
    const selectedSauces = (cur?.selections?.subSauces || [])
      .map((id: string) => FALLBACK_SUB_SAUCES.find((item) => item.id === id)?.name)
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <div className="relative overflow-hidden rounded-xl bg-slate-800 aspect-[4/3]">
            <img
              src={getFoodImage(prod || cur)}
              alt={prod?.name || 'Build Your Own Sub'}
              className="h-full w-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/sub.png'; }}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4">
              <h3 className="text-lg font-black text-white">{prod?.name || 'Build Your Own Sub'}</h3>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">6 inch combo sub</p>
            </div>
          </div>
          <section className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-white">Your Sub</h4>
                <p className="text-xs text-slate-400">Included in this combo.</p>
              </div>
              <button
                type="button"
                onClick={() => updateCurrentItem({ selections: defaultSelectionsForType('subs') })}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
              >
                Reset
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {summary.map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
                  <span className={`block text-[10px] font-black uppercase tracking-widest ${item.tone}`}>{item.label}</span>
                  <span className="mt-1 block text-xs font-bold leading-snug text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </section>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={12} /> Special Instructions
            </label>
            <textarea
              value={cur?.specialInstructions || ''}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g., toasted, no onions, sauce on side..."
              className="w-full resize-none rounded-xl border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-purple-500/50 focus:outline-none"
              rows={2}
            />
          </div>
        </div>

        <div className="space-y-6 lg:col-span-3 lg:max-h-[55vh] lg:overflow-y-auto lg:pr-1 custom-scrollbar">
          <section>
            <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-300">1. Choose Bread</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {FALLBACK_SUB_BREADS.map((option) => renderFallbackChoice('subBread', option, 'orange'))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-sm font-black uppercase tracking-wider text-red-300">2. Meats</h4>
              <span className="text-xs font-bold text-slate-400">{selectedMeats.length}/4 selected</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {FALLBACK_SUB_MEATS.map((option) => renderFallbackMultiChoice('subMeats', option, 'orange', 4))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-sm font-black uppercase tracking-wider text-yellow-300">3. Cheese</h4>
              <span className="text-xs font-bold text-slate-400">{selectedCheeses.length}/2 selected</span>
            </div>
	            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
	              {FALLBACK_SUB_CHEESES.map((option) => {
	                const selected = (cur?.selections?.subCheeses || []).includes(option.id);
	                return (
	                  <div
	                    key={option.id}
	                    className={`rounded-xl border p-3 transition-all ${
	                      selected ? 'border-yellow-400 bg-yellow-400/15 text-white' : 'border-white/10 bg-slate-800/45 text-slate-100 hover:border-white/25'
	                    }`}
	                  >
	                    <button
	                      type="button"
	                      onClick={() => toggleFallbackMulti('subCheeses', option.id, 2)}
	                      className="flex w-full items-center justify-between gap-2 text-left font-bold"
	                    >
	                      <span>{option.name}</span>
	                      <span className="text-xs text-slate-400">{moneyLabel(option.price)}</span>
	                    </button>
	                    {selected && (
	                      <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg bg-slate-950/50 p-1">
	                        {TOPPING_AMOUNT_OPTIONS.map((amount) => (
	                          <button
	                            key={amount.id}
	                            type="button"
	                            onClick={() => setFallbackAmount('subCheeses', option.id, amount.id, 2)}
	                            className={`rounded-md px-2 py-1.5 text-[10px] font-black ${
	                              (cur?.toppingAmounts?.[option.id] || 'REGULAR') === amount.id
	                                ? 'bg-yellow-400 text-slate-950'
	                                : 'text-slate-400 hover:bg-slate-800'
	                            }`}
	                          >
	                            {amount.name}
	                          </button>
	                        ))}
	                      </div>
	                    )}
	                  </div>
	                );
	              })}
	            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-sm font-black uppercase tracking-wider text-green-300">4. Vegetables</h4>
              <span className="text-xs font-bold text-slate-400">{selectedVeggies.length} selected</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {FALLBACK_SUB_VEGGIES.map((option) => renderFallbackMultiChoice('subVeggies', option, 'green'))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-sm font-black uppercase tracking-wider text-sky-300">5. Sauces</h4>
              <span className="text-xs font-bold text-slate-400">{selectedSauces.length}/3 selected</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {FALLBACK_SUB_SAUCES.map((option) => renderFallbackMultiChoice('subSauces', option, 'purple', 3))}
            </div>
          </section>
        </div>
      </div>
    );
  };

  const renderFallbackDrinkCustomizer = () => (
    <div className="space-y-4">
      <div>
        <h4 className="text-lg font-bold text-white flex items-center gap-2">
          <Flame className="text-orange-500 w-5 h-5" />
          Choose Drink
        </h4>
        <p className="text-sm text-slate-400">Select the soda type for this combo.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FALLBACK_SODAS.map((name) => renderFallbackChoice('soda', { id: name, name }, 'purple'))}
      </div>
    </div>
  );

  // Pizza: split layout
  const renderPizzaCustomizer = () => {
    if (!cur?.selectedProduct) return renderProductGrid();
    return <ComboPizzaBuilderPanel item={cur} onChange={updateCurrentItem} />;
  };

  // Wings: tabbed layout
  const renderWingsCustomizer = () => {
    const prod = cur?.selectedProduct;
    if (!prod) return renderProductGrid();
    const sets = prod.addonSets || [];
    if (sets.length === 0) return renderFallbackWingsCustomizer();
    const styleSet = sets.find((p: any) => p.addonSet.name.toLowerCase().includes('style'));
    const flavorSet = sets.find((p: any) => p.addonSet.name.toLowerCase().includes('flavor'));
    const sideSet = sets.find((p: any) => p.addonSet.name.toLowerCase().includes('side'));
    const dipSet = sets.find((p: any) => p.addonSet.name.toLowerCase().includes('dip'));

    const tabs = [
      { key: 'flavors' as const, label: 'Flavors', count: flavorSet ? (cur.selections?.[flavorSet.addonSet.id]?.length || 0) : 0, max: flavorSet?.addonSet.maxSelect },
      { key: 'sides' as const, label: 'Sides' },
      { key: 'extras' as const, label: 'Extras' },
    ];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: wing image + style */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative rounded-lg overflow-hidden bg-slate-800 aspect-[4/3]">
            <img src={prod.imageUrl || '/images/wings.png'} alt={prod.name} className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/images/wings.png'; }} />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4">
              <h3 className="text-lg font-bold text-white">{prod.name}</h3>
            </div>
          </div>
          {styleSet && renderAddonSet(styleSet, true)}
          {/* Special Instructions */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={12} /> Special Instructions
            </label>
            <textarea
              value={cur?.specialInstructions || ''}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g., extra crispy, sauce on side..."
              className="w-full bg-slate-800/50 border border-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-purple-500/50 focus:outline-none resize-none"
              rows={2}
            />
          </div>
        </div>
        {/* Right: tabs */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex gap-2">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setWingTab(t.key)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  wingTab === t.key
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
                {t.count !== undefined && <span className="ml-1.5 text-[10px]">{t.count}/{t.max || '∞'}</span>}
              </button>
            ))}
          </div>
          <div className="max-h-[45vh] overflow-y-auto pr-1 custom-scrollbar">
            {wingTab === 'flavors' && flavorSet && renderAddonSet(flavorSet)}
            {wingTab === 'sides' && sideSet && renderAddonSet(sideSet)}
            {wingTab === 'extras' && dipSet && renderAddonSet(dipSet)}
            {wingTab === 'flavors' && !flavorSet && <p className="text-slate-500 text-center py-8 italic">No flavors configured</p>}
            {wingTab === 'sides' && !sideSet && <p className="text-slate-500 text-center py-8 italic">No sides configured</p>}
            {wingTab === 'extras' && !dipSet && <p className="text-slate-500 text-center py-8 italic">No extras configured</p>}
          </div>
        </div>
      </div>
    );
  };

  // Drinks: product pick first, soda type after selection
  const renderDrinksGrid = () => cur?.selectedProduct ? renderFallbackDrinkCustomizer() : renderProductGrid(true);

  // Product grid
  const renderProductGrid = (drinksMode = false) => {
    return (
      <div>
        <div className="mb-4">
          <h4 className="text-lg font-bold text-white flex items-center gap-2">
            <Flame className="text-orange-500 w-5 h-5" />
            {cur?.productGroupLabel || (drinksMode ? 'Choose Your Drink' : 'Choose Your Selection')}
          </h4>
          <p className="text-sm text-slate-400">Select one option below.</p>
        </div>
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
          </div>
        ) : catProducts.length === 0 ? (
          <p className="py-12 text-center text-slate-500 italic">No products available.</p>
        ) : (
          <div className={`grid gap-3 ${drinksMode ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {catProducts.map(p => {
              const isSel = cur?.selectedProduct?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => selectProduct(p)}
                  className={`group bg-slate-800/40 hover:bg-slate-800 border p-3 rounded-lg transition-all text-left relative overflow-hidden ${
                    isSel ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10' : 'border-white/5'
                  }`}
                >
                  <div className={`${drinksMode ? 'h-24' : 'h-36'} bg-slate-700 rounded-xl mb-2 overflow-hidden relative`}>
                    <img
                      src={getFoodImage(p)}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/pepperoni.png'; }}
                    />
                  </div>
                  <h4 className="font-bold text-white text-sm truncate">{p.name}</h4>
                  {isSel && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle size={18} className="text-purple-500" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Default: generic addon sets
  const renderDefaultCustomizer = () => {
    const prod = cur?.selectedProduct;
    if (!prod) return renderProductGrid();
    const sets = prod.addonSets || [];
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800">
            <img
              src={getFoodImage(prod)}
              alt={prod.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/pepperoni.png'; }}
            />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{prod.name}</h3>
            <p className="text-xs text-slate-500">{cur?.category?.name}</p>
          </div>
        </div>
        {sets.map((pas: any) => renderAddonSet(pas))}
        {sets.length === 0 && <p className="text-slate-500 text-center py-8 italic">No customization options</p>}
      </div>
    );
  };

  // Decide which view to render for current step
  const renderStepContent = () => {
    if (!cur) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" /></div>;

    // If product not yet selected and not fixed, show product grid
    if (!cur.isProductFixed && !cur.selectedProduct) {
      if (catType === 'wings' && (!cur.categoryId || (!loading && catProducts.length === 0))) {
        return renderFallbackWingsCustomizer();
      }
      return catType === 'drinks' ? renderDrinksGrid() : renderProductGrid();
    }

    // Product selected or fixed — show category-aware customizer
    switch (catType) {
      case 'pizza': return renderPizzaCustomizer();
      case 'wings': return renderWingsCustomizer();
      case 'subs': return renderFallbackSubCustomizer();
      case 'drinks':
        // Drinks: no further customization, auto-advance
        return renderDrinksGrid();
      default: return renderDefaultCustomizer();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 pt-24">
      <div className="relative z-[10000] bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Star className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{combo.name}</h2>
              <p className="text-slate-400 text-sm">
                Step {step + 1} of {items.length}: {cur?.productGroupLabel || cur?.name || 'Selection'}
                {cur?.category?.name && <span className="ml-2 text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-500 uppercase">{cur.category.name}</span>}
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Progress */}
        <div className="flex px-5 py-2 gap-1 bg-slate-950/30">
          {items.map((itm, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                idx === step ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' :
                idx < step ? 'bg-purple-500/40' : 'bg-slate-800'
              }`} />
              <span className="text-[9px] text-slate-600 truncate max-w-full">{itm.productGroupLabel || itm.name}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 bg-slate-800 rounded-xl p-1.5 border border-white/5">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-700 text-slate-300 hover:text-white">
                <Minus size={14} />
              </button>
              <span className="w-6 text-center font-bold text-white text-sm">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-600 text-white hover:bg-purple-500">
                <Plus size={14} />
              </button>
            </div>
            <div>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Total Combo Price</p>
              <p className="text-xl font-black text-white">${totalPrice.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
              className="px-5 py-2.5 border border-white/10 text-slate-400 rounded-xl font-bold hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm">
              Back
            </button>
            <button
              onClick={step === items.length - 1 && canProceed ? handleComplete : () => setStep(step + 1)}
              disabled={!canProceed}
              className="px-7 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-purple-500/25 transition-all flex items-center gap-2 text-sm disabled:opacity-40"
            >
              {step === items.length - 1 ? 'Add to Cart' : 'Next Step'}
              {step === items.length - 1 ? <ShoppingCart size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComboCustomizerModal;
