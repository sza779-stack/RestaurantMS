import React, { useState } from 'react';
import { X, Plus, Minus, ChefHat, ShoppingCart, Pizza, CheckCircle2, Info } from 'lucide-react';
import type { PizzaTopping, ToppingAmount, ToppingPlacement, ToppingSelection } from './pizza/types';
import { ToppingCard } from './pizza/ToppingCard';
import { PizzaVisualizerImages } from './pizza/PizzaVisualizerImages';
import { PizzaVisualizerSvg } from './pizza/PizzaVisualizerSvg';

interface BuildYourOwnPizzaProps {
  product?: any;
  onAdd: (item: any) => void;
  onCancel: () => void;
}

/**
 * Restore point: set to `true` to use PNG layers from `/public/pizzas/layers/`
 * (full visual parity with the original implementation). Details:
 * `src/components/build/pizza/PizzaVisualizerImages.tsx`
 */
const USE_PIZZA_IMAGE_LAYERS = false;

const CRUST_OPTIONS = [
  { id: 'hand-tossed', name: 'Hand Tossed', price: 0 },
  { id: 'thin-crust', name: 'Thin Crust', price: 0 },
  { id: 'pan', name: 'Pan Pizza', price: 1.00 },
  { id: 'stuffed', name: 'Stuffed Crust', price: 2.50 },
  { id: 'gluten-free', name: 'Gluten Free', price: 2.00 },
];

const SIZE_OPTIONS = [
  { id: 'small', name: 'Small (10")', price: 10.99 },
  { id: 'medium', name: 'Medium (12")', price: 13.99 },
  { id: 'large', name: 'Large (14")', price: 16.99 },
  { id: 'xlarge', name: 'X-Large (16")', price: 19.99 },
];

const SAUCE_OPTIONS = [
  { id: 'tomato', name: 'Classic Tomato', price: 0 },
  { id: 'no-sauce', name: 'No Sauce', price: 0 },
  { id: 'bbq', name: 'BBQ Sauce', price: 0 },
  { id: 'alfredo', name: 'Alfredo', price: 0.50 },
  { id: 'pesto', name: 'Pesto', price: 0.50 },
  { id: 'buffalo', name: 'Buffalo', price: 0 },
];

const CHEESE_OPTIONS = [
  { id: 'mozzarella', name: 'Mozzarella', price: 0 },
  { id: 'no-cheese', name: 'No Cheese', price: 0 },
  { id: 'extra-mozzarella', name: 'Extra Mozzarella', price: 1.50 },
  { id: 'cheddar', name: 'Cheddar Blend', price: 0.50 },
  { id: 'four-cheese', name: 'Four Cheese', price: 1.00 },
  { id: 'parmesan', name: 'Parmesan', price: 0.75 },
];

const TOPPING_OPTIONS = [
  { id: 'pepperoni', name: 'Pepperoni', price: 1.50, category: 'meat' },
  { id: 'sausage', name: 'Italian Sausage', price: 1.50, category: 'meat' },
  { id: 'bacon', name: 'Bacon', price: 1.50, category: 'meat' },
  { id: 'ham', name: 'Ham', price: 1.50, category: 'meat' },
  { id: 'chicken', name: 'Grilled Chicken', price: 2.00, category: 'meat' },
  { id: 'beef', name: 'Ground Beef', price: 1.50, category: 'meat' },
  { id: 'mushrooms', name: 'Mushrooms', price: 1.00, category: 'veggie' },
  { id: 'onions', name: 'Onions', price: 0.75, category: 'veggie' },
  { id: 'peppers', name: 'Green Peppers', price: 0.75, category: 'veggie' },
  { id: 'olives', name: 'Black Olives', price: 0.75, category: 'veggie' },
  { id: 'tomatoes', name: 'Fresh Tomatoes', price: 1.00, category: 'veggie' },
  { id: 'spinach', name: 'Spinach', price: 1.00, category: 'veggie' },
  { id: 'pineapple', name: 'Pineapple', price: 1.00, category: 'veggie' },
  { id: 'jalapenos', name: 'Jalapeños', price: 0.75, category: 'veggie' },
];

const AMOUNT_OPTIONS = [
  { id: 'light', name: 'Light', price: 0 },
  { id: 'regular', name: 'Regular', price: 0 },
  { id: 'extra', name: 'Extra', price: 0.5 },
];

const CHEESE_PLACEMENT_OPTIONS: Array<{ id: ToppingPlacement; name: string }> = [
  { id: 'LEFT', name: 'Left' },
  { id: 'FULL', name: 'Whole' },
  { id: 'RIGHT', name: 'Right' },
];

const TOPPING_AMOUNT_OPTIONS = [
  { id: 'LIGHT', name: 'Light', multiplier: 0.75 },
  { id: 'REGULAR', name: 'Regular', multiplier: 1 },
  { id: 'EXTRA', name: 'Extra', multiplier: 1.5 },
] as const;

const toppingAmountName = (amount?: ToppingSelection['amount']) => (
  TOPPING_AMOUNT_OPTIONS.find((option) => option.id === (amount || 'REGULAR'))?.name || 'Regular'
);

const toppingLabel = (topping: ToppingSelection) => (
  `${topping.amount && topping.amount !== 'REGULAR' ? `${toppingAmountName(topping.amount)} ` : ''}${topping.name}`
);

const cheesePlacementName = (placement: ToppingPlacement) => (
  placement === 'FULL' ? 'Whole' : placement === 'LEFT' ? 'Left' : 'Right'
);

const cheeseSummaryLabel = (
  cheese: typeof CHEESE_OPTIONS[number],
  amount: typeof AMOUNT_OPTIONS[number],
  placement: ToppingPlacement
) => (
  cheese.id === 'no-cheese' ? 'No Cheese' : `${amount.name} ${cheese.name} (${cheesePlacementName(placement)})`
);

const toppingCategory = (category: string): PizzaTopping['category'] => (
  category === 'meat' ? 'MEAT' : 'VEGETABLE'
);

const BuildYourOwnPizza: React.FC<BuildYourOwnPizzaProps> = ({ product, onAdd, onCancel }) => {
  const [size, setSize] = useState(SIZE_OPTIONS[1]);
  const [crust, setCrust] = useState(CRUST_OPTIONS[0]);
  const [sauce, setSauce] = useState(SAUCE_OPTIONS[0]);
  const [cheese, setCheese] = useState(CHEESE_OPTIONS.find((option) => option.id === 'mozzarella') || CHEESE_OPTIONS[0]);
  const [sauceAmount, setSauceAmount] = useState(AMOUNT_OPTIONS[1]);
  const [cheeseAmount, setCheeseAmount] = useState(AMOUNT_OPTIONS[1]);
  const [cheesePlacement, setCheesePlacement] = useState<ToppingPlacement>('FULL');
  const [selectedToppings, setSelectedToppings] = useState<ToppingSelection[]>([]);
  const [activeToppingId, setActiveToppingId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [activeToppingTab, setActiveToppingTab] = useState<'meat' | 'veggie'>('meat');

  const upsertTopping = (toppingId: string, patch: Partial<Pick<ToppingSelection, 'side' | 'amount'>> = {}) => {
    const option = TOPPING_OPTIONS.find((topping) => topping.id === toppingId);
    if (!option) return;
    setActiveToppingId(toppingId);
    setSelectedToppings((prev) => {
      const exists = prev.find((t) => t.id === toppingId);
      if (exists) {
        return prev.map((t) => t.id === toppingId ? { ...t, ...patch } : t);
      }
      return [
        ...prev,
        {
          id: option.id,
          name: option.name,
          price: option.price,
          side: patch.side || 'FULL',
          amount: patch.amount || 'REGULAR',
        },
      ];
    });
  };

  const removeTopping = (toppingId: string) => {
    setSelectedToppings((prev) => prev.filter((t) => t.id !== toppingId));
    setActiveToppingId((current) => current === toppingId ? null : current);
  };

  const handleToppingClick = (topping: typeof TOPPING_OPTIONS[0]) => {
    setSelectedToppings((prev) => {
      const exists = prev.find((t) => t.id === topping.id);
      if (exists) {
        // Deselect immediately on tap if it's already selected
        setActiveToppingId(null);
        return prev.filter((t) => t.id !== topping.id);
      }
      // Select and make active
      setActiveToppingId(topping.id);
      return [...prev, { id: topping.id, name: topping.name, price: topping.price, side: 'FULL', amount: 'REGULAR' }];
    });
  };

  const handlePizzaTap = (tapSide: 'LEFT' | 'RIGHT') => {
    if (!activeToppingId) return;
    
    setSelectedToppings((prev) => {
      const existing = prev.find(t => t.id === activeToppingId);
      if (!existing) return prev;
      
      let newSide: 'LEFT' | 'RIGHT' | 'FULL' | null = null;
      
      if (existing.side === 'FULL') {
        newSide = tapSide === 'LEFT' ? 'RIGHT' : 'LEFT';
      } else if (existing.side === tapSide) {
        newSide = null;
      } else {
        newSide = 'FULL';
      }

      if (newSide === null) {
        setActiveToppingId(null);
        return prev.filter(t => t.id !== activeToppingId);
      }
      
      return prev.map(t => t.id === activeToppingId ? { ...t, side: newSide } : t);
    });
  };

  const changeToppingSide = (e: React.MouseEvent, toppingId: string, side: 'LEFT' | 'RIGHT' | 'FULL') => {
    e.stopPropagation();
    setActiveToppingId(toppingId);
    setSelectedToppings((prev) => 
      prev.map(t => t.id === toppingId ? { ...t, side } : t)
    );
  };

  const changeToppingAmount = (e: React.MouseEvent, toppingId: string, amount: 'LIGHT' | 'REGULAR' | 'EXTRA') => {
    e.stopPropagation();
    setActiveToppingId(toppingId);
    setSelectedToppings((prev) =>
      prev.map(t => t.id === toppingId ? { ...t, amount } : t)
    );
  };

  const setToppingPlacement = (toppingId: string, placement: ToppingPlacement) => {
    upsertTopping(toppingId, { side: placement });
  };

  const setToppingAmount = (toppingId: string, amount: ToppingAmount) => {
    upsertTopping(toppingId, { amount });
  };

  const getToppingSide = (toppingId: string): 'LEFT' | 'RIGHT' | 'FULL' | null => {
    const topping = selectedToppings.find((t) => t.id === toppingId);
    return topping ? topping.side : null;
  };

  const calculatePrice = () => {
    const cheeseSideMultiplier = cheesePlacement === 'FULL' ? 1 : 0.5;
    const cheesePrice = cheese.id === 'no-cheese' ? 0 : (cheese.price * cheeseSideMultiplier) + cheeseAmount.price;
    const saucePrice = sauce.id === 'no-sauce' ? 0 : sauce.price + sauceAmount.price;
    let price = size.price + crust.price + saucePrice + cheesePrice;
    selectedToppings.forEach((topping) => {
      const sideMultiplier = topping.side === 'FULL' ? 1 : 0.5;
      const amountMultiplier = TOPPING_AMOUNT_OPTIONS.find((option) => option.id === (topping.amount || 'REGULAR'))?.multiplier || 1;
      price += topping.price * sideMultiplier * amountMultiplier;
    });
    return price;
  };

  const handleAdd = () => {
    const leftToppings = selectedToppings.filter((t) => t.side === 'LEFT');
    const rightToppings = selectedToppings.filter((t) => t.side === 'RIGHT');
    const fullToppings = selectedToppings.filter((t) => t.side === 'FULL');

    const modifierLabels = [
      `Crust: ${crust.name}`,
      `Sauce: ${sauce.id === 'no-sauce' ? 'No Sauce' : `${sauceAmount.name} ${sauce.name}`}`,
      `Cheese: ${cheeseSummaryLabel(cheese, cheeseAmount, cheesePlacement)}`,
      ...leftToppings.map(t => `${toppingLabel(t)} (Left)`),
      ...rightToppings.map(t => `${toppingLabel(t)} (Right)`),
      ...fullToppings.map(t => `${toppingLabel(t)} (Full)`),
    ];

    const item: any = {
      productId: product?.id || `custom-pizza-${Date.now()}`,
      productName: `Build Your Own Pizza - ${size.name}`,
      sizeId: size.id,
      sizeName: size.name,
      unitPrice: calculatePrice(),
      addons: modifierLabels.map((name, index) => ({
        addonId: `custom-pizza-${index}`,
        name,
        price: 0,
        quantity: 1,
        type: 'CUSTOM',
      })),
      kitchenStation: product?.kitchenStation || 'PIZZA',
      id: `custom-pizza-${Date.now()}`,
      name: `Build Your Own Pizza - ${size.name}`,
      price: calculatePrice(),
      quantity,
      image: '🍕',
      modifiers: [
		        `Crust: ${crust.name}`,
		        `Sauce: ${sauce.id === 'no-sauce' ? 'No Sauce' : `${sauceAmount.name} ${sauce.name}`}`,
		        `Cheese: ${cheeseSummaryLabel(cheese, cheeseAmount, cheesePlacement)}`,
        ...leftToppings.map(t => `${toppingLabel(t)} (Left)`),
        ...rightToppings.map(t => `${toppingLabel(t)} (Right)`),
        ...fullToppings.map(t => `${toppingLabel(t)} (Full)`),
      ],
      notes: notes || undefined,
      isCustom: true,
    };

    onAdd(item);
  };

  const totalPrice = calculatePrice() * quantity;
  const currentToppings = TOPPING_OPTIONS.filter(t => t.category === activeToppingTab);
  const toppingCards: PizzaTopping[] = currentToppings.map((topping, index) => {
    const selected = selectedToppings.find((item) => item.id === topping.id);
    return {
      id: topping.id,
      name: topping.name,
      category: toppingCategory(topping.category),
      isAvailable: true,
      isSelected: Boolean(selected),
      placement: selected?.side || 'FULL',
      amount: selected?.amount || 'REGULAR',
      price: topping.price,
      extraPrice: topping.price,
      sortOrder: index + 1,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 pt-24">
      <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col border border-white/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-md">
              <ChefHat className="text-white" size={28} />
            </div>
	            <div>
	              <h2 className="text-3xl font-black text-white tracking-tight">Build Your Own Pizza</h2>
	              <p className="text-white/80 font-medium mt-0.5">Craft your perfect masterpiece</p>
	            </div>
	          </div>
          <button onClick={onCancel} className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/20 rounded-full">
            <X size={28} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* Left Column - Visual Anchor & Summary */}
          <div className="lg:w-2/5 bg-gray-50 border-r border-gray-200 p-8 overflow-y-auto hidden lg:flex flex-col">
            {/* Dynamic Visualizer */}
            {USE_PIZZA_IMAGE_LAYERS ? (
              <PizzaVisualizerImages
                toppings={selectedToppings}
                activeToppingId={activeToppingId}
                onPizzaTap={handlePizzaTap}
              />
            ) : (
              <PizzaVisualizerSvg
                toppings={selectedToppings}
                activeToppingId={activeToppingId}
                onPizzaTap={handlePizzaTap}
                crustId={crust.id}
                sauceId={sauce.id}
                cheeseId={cheese.id}
              />
            )}

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex-1">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-gray-950 text-xl">Your Creation</h3>
                  <p className="text-xs font-semibold text-gray-400 mt-0.5">Live kitchen summary</p>
                </div>
                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
                  {selectedToppings.length} toppings
                </span>
              </div>
              
              <div className="space-y-3">
	                <div className="rounded-xl border border-orange-100 bg-orange-50/55 p-3 flex justify-between items-center gap-4">
	                  <span className="text-gray-500 font-medium">Size</span>
	                  <span className="font-black text-gray-950 text-right">{size.name}</span>
	                </div>
	                <div className="rounded-xl border border-orange-100 bg-orange-50/55 p-3 flex justify-between items-center gap-4">
	                  <span className="text-gray-500 font-medium">Crust</span>
	                  <span className="font-black text-gray-950 text-right">{crust.name}</span>
	                </div>
		                <div className="rounded-xl border border-red-100 bg-red-50/55 p-3 flex justify-between items-center gap-4">
		                  <span className="text-gray-500 font-medium">Sauce</span>
		                  <span className="font-black text-red-950 text-right">{sauce.id === 'no-sauce' ? 'No Sauce' : `${sauceAmount.name} ${sauce.name}`}</span>
		                </div>
		                <div className="rounded-xl border border-yellow-100 bg-yellow-50/60 p-3 flex justify-between items-center gap-4">
		                  <span className="text-gray-500 font-medium">Cheese</span>
		                  <span className="font-black text-yellow-950 text-right">{cheeseSummaryLabel(cheese, cheeseAmount, cheesePlacement)}</span>
		                </div>
                
                {selectedToppings.length > 0 && (
                  <div>
                    <span className="text-gray-600 font-medium block mb-2">Toppings</span>
                    <div className="flex flex-wrap gap-2">
	                      {selectedToppings.map(t => (
	                        <div key={t.id} className={`${TOPPING_OPTIONS.find((option) => option.id === t.id)?.category === 'meat' ? 'bg-red-50 text-red-800 border-red-100' : 'bg-green-50 text-green-800 border-green-100'} px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 border`}>
		                          {toppingLabel(t)}
                          {t.side !== 'FULL' && (
                            <span className="bg-white/50 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider text-orange-600">
                              {t.side}
                            </span>
                          )}
                        </div>
                      ))}
	                    </div>
	                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Interactive Configuration */}
	          <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-8">
	            <div className="space-y-8 max-w-4xl mx-auto">
              
              {/* Step 1: Base */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center shrink-0">1</div>
                  <h3 className="font-bold text-xl text-gray-900">Select Size & Crust</h3>
                </div>
                
	                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 rounded-2xl border border-orange-100 bg-orange-50/45 p-5">
                  {/* Size */}
	                  <div className="space-y-3 rounded-2xl border border-white bg-white/85 p-4 shadow-sm">
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Size</label>
                    <div className="grid grid-cols-2 gap-2">
                      {SIZE_OPTIONS.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSize(s)}
                          className={`p-3 rounded-lg border-2 transition-all text-center ${
                            size.id === s.id 
                              ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' 
                              : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-bold">{s.name.split(' ')[0]}</div>
                          <div className={`text-xs ${size.id === s.id ? 'text-orange-600' : 'text-gray-400'}`}>${s.price.toFixed(2)}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Crust */}
	                  <div className="space-y-3 rounded-2xl border border-white bg-white/85 p-4 shadow-sm">
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Crust</label>
                    <div className="grid grid-cols-2 gap-2">
                      {CRUST_OPTIONS.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setCrust(c)}
                          className={`p-3 rounded-lg border-2 transition-all text-left flex flex-col justify-center ${
                            crust.id === c.id 
                              ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' 
                              : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className="font-bold text-sm leading-tight">{c.name}</span>
                          {c.price > 0 && <span className={`text-xs mt-1 ${crust.id === c.id ? 'text-orange-600' : 'text-gray-400'}`}>+${c.price.toFixed(2)}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

	              {/* Step 2: Base Ingredients */}
	              <section>
		                <div className="mb-5 flex items-center gap-3">
		                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">2</div>
		                  <div>
		                    <h3 className="text-xl font-bold text-gray-950">Sauce & Cheese</h3>
		                    <p className="text-sm text-gray-500">Choose sauce, cheese, and amount.</p>
		                  </div>
		                </div>

			                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
			                  <div className="rounded-2xl border border-red-100 bg-red-50/30 p-4 shadow-sm">
			                    <div className="mb-4 flex items-center gap-3">
			                      <div>
			                        <h4 className="text-base font-bold uppercase tracking-wide text-red-700">Sauce</h4>
			                        <p className="text-xs text-gray-500">Pick your sauce</p>
			                      </div>
			                    </div>

			                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
		                      {SAUCE_OPTIONS.map((s) => {
		                        const selected = sauce.id === s.id;
		                        return (
		                          <button
		                            key={s.id}
		                            type="button"
		                            onClick={() => {
		                              setSauce(s);
		                              if (s.id === 'no-sauce') setSauceAmount(AMOUNT_OPTIONS[1]);
		                            }}
			                            className={`relative min-h-[62px] rounded-xl border p-3 text-left transition-all ${
			                              selected
			                                ? 'border-red-500 bg-white text-red-800 shadow-sm ring-2 ring-red-100'
			                                : 'border-gray-200 bg-white/85 text-gray-800 hover:border-red-200 hover:bg-white'
			                            }`}
			                          >
			                            {selected && (
			                              <CheckCircle2 className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full bg-white fill-red-500 text-white" />
			                            )}
			                            <div className="min-w-0">
			                              <span className="block text-sm font-semibold leading-tight">{s.name}</span>
			                              <span className={`mt-1 block text-xs font-medium ${s.price > 0 ? 'text-gray-500' : 'text-red-700'}`}>
			                                {s.price > 0 ? `+ $${s.price.toFixed(2)}` : 'Included'}
			                              </span>
		                            </div>
		                          </button>
		                        );
		                      })}
		                    </div>

		                    <div className={`mt-4 rounded-xl border border-red-100 bg-white/70 p-3 ${sauce.id === 'no-sauce' ? 'opacity-50' : ''}`}>
		                      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-red-700">Sauce amount</div>
		                      <div className="grid grid-cols-3 gap-1 rounded-xl border border-red-100 bg-white p-1">
		                        {AMOUNT_OPTIONS.map((amount) => (
		                          <button
		                            key={amount.id}
		                            type="button"
		                            disabled={sauce.id === 'no-sauce'}
		                            onClick={() => setSauceAmount(amount)}
		                            className={`relative rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
		                              sauceAmount.id === amount.id
		                                ? 'bg-red-500 text-white shadow-sm'
		                                : 'text-gray-500 hover:bg-red-50 hover:text-red-700'
		                            } disabled:cursor-not-allowed`}
		                          >
		                            {sauceAmount.id === amount.id && sauce.id !== 'no-sauce' && (
		                              <CheckCircle2 className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white fill-red-500 text-white" />
		                            )}
		                            {amount.name}
		                          </button>
		                        ))}
		                      </div>
		                      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-gray-500">
		                        <Info className="h-4 w-4" />
		                        {sauce.id === 'no-sauce' ? 'No sauce selected.' : `${sauceAmount.name} sauce selected.`}
		                      </div>
		                    </div>
		                  </div>

			                  <div className="rounded-2xl border border-yellow-100 bg-yellow-50/30 p-4 shadow-sm">
			                    <div className="mb-4 flex items-center gap-3">
			                      <div>
			                        <h4 className="text-base font-bold uppercase tracking-wide text-yellow-700">Cheese</h4>
			                        <p className="text-xs text-gray-500">Choose your cheese</p>
			                      </div>
			                    </div>

			                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
		                      {CHEESE_OPTIONS.map((c) => {
		                        const selected = cheese.id === c.id;
		                        return (
		                          <button
		                            key={c.id}
		                            type="button"
		                            onClick={() => {
		                              setCheese(c);
		                              if (c.id === 'no-cheese') {
		                                setCheesePlacement('FULL');
		                                setCheeseAmount(AMOUNT_OPTIONS[1]);
		                              }
		                            }}
			                            className={`relative min-h-[62px] rounded-xl border p-3 text-left transition-all ${
			                              selected
			                                ? 'border-yellow-500 bg-white text-yellow-800 shadow-sm ring-2 ring-yellow-100'
			                                : 'border-gray-200 bg-white/85 text-gray-800 hover:border-yellow-200 hover:bg-white'
			                            }`}
			                          >
			                            {selected && (
			                              <CheckCircle2 className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full bg-white fill-yellow-500 text-white" />
			                            )}
			                            <div className="min-w-0">
			                              <span className="block text-sm font-semibold leading-tight">{c.name}</span>
			                              <span className={`mt-1 block text-xs font-medium ${c.price > 0 ? 'text-gray-500' : 'text-yellow-700'}`}>
			                                {c.price > 0 ? `+ $${c.price.toFixed(2)}` : c.id === 'no-cheese' ? 'No extra charge' : 'Included'}
		                              </span>
		                            </div>
		                          </button>
		                        );
		                      })}
		                    </div>

			                    <div className={`mt-4 space-y-3 rounded-xl border border-yellow-100 bg-white/70 p-3 ${cheese.id === 'no-cheese' ? 'opacity-50' : ''}`}>
			                      <div>
			                        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-yellow-700">Cheese placement</div>
		                        <div className="grid grid-cols-3 gap-1 rounded-xl border border-yellow-100 bg-white p-1">
		                          {CHEESE_PLACEMENT_OPTIONS.map((placement) => (
		                            <button
		                              key={placement.id}
		                              type="button"
		                              disabled={cheese.id === 'no-cheese'}
		                              onClick={() => setCheesePlacement(placement.id)}
			                              className={`relative rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
			                                cheesePlacement === placement.id
			                                  ? 'bg-yellow-500 text-white shadow-sm'
		                                  : 'text-gray-500 hover:bg-yellow-50 hover:text-yellow-700'
		                              } disabled:cursor-not-allowed`}
		                            >
		                              {cheesePlacement === placement.id && cheese.id !== 'no-cheese' && (
		                                <CheckCircle2 className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white fill-yellow-500 text-white" />
		                              )}
		                              {placement.name}
		                            </button>
		                          ))}
		                        </div>
		                      </div>
		                      <div>
			                        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-yellow-700">Cheese amount</div>
		                        <div className="grid grid-cols-3 gap-1 rounded-xl border border-yellow-100 bg-white p-1">
		                          {AMOUNT_OPTIONS.map((amount) => (
		                            <button
		                              key={amount.id}
		                              type="button"
		                              disabled={cheese.id === 'no-cheese'}
		                              onClick={() => setCheeseAmount(amount)}
			                              className={`relative rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
			                                cheeseAmount.id === amount.id
			                                  ? 'bg-yellow-500 text-white shadow-sm'
		                                  : 'text-gray-500 hover:bg-yellow-50 hover:text-yellow-700'
		                              } disabled:cursor-not-allowed`}
		                            >
		                              {cheeseAmount.id === amount.id && cheese.id !== 'no-cheese' && (
		                                <CheckCircle2 className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white fill-yellow-500 text-white" />
		                              )}
		                              {amount.name}
		                            </button>
		                          ))}
		                        </div>
		                      </div>
		                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
		                        <Info className="h-4 w-4" />
		                        {cheese.id === 'no-cheese' ? 'No cheese selected.' : `${cheesePlacementName(cheesePlacement)} ${cheeseAmount.name.toLowerCase()} cheese selected.`}
		                      </div>
		                  </div>
		                  </div>
		                </div>
		              </section>

              {/* Step 3: Toppings */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center shrink-0">3</div>
                  <div className="flex-1 flex items-center justify-between">
                    <h3 className="font-bold text-xl text-gray-900">Add Toppings</h3>
                    <span className="text-sm text-gray-500 font-medium hidden sm:inline-block">Click to add. Select half/full after adding.</span>
                  </div>
                </div>

	                {/* Topping Tabs */}
	                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
	                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6">
	                  <button
	                    onClick={() => setActiveToppingTab('meat')}
	                    className={`flex-1 py-3 rounded-lg font-bold transition-all text-sm ${
	                      activeToppingTab === 'meat'
	                        ? 'bg-red-600 text-white shadow'
	                        : 'text-red-600 hover:bg-red-50'
	                    }`}
	                  >
	                    Meats
	                  </button>
	                  <button
	                    onClick={() => setActiveToppingTab('veggie')}
	                    className={`flex-1 py-3 rounded-lg font-bold transition-all text-sm ${
	                      activeToppingTab === 'veggie'
	                        ? 'bg-green-600 text-white shadow'
	                        : 'text-green-700 hover:bg-green-50'
	                    }`}
	                  >
	                    Veggies
	                  </button>
	                </div>

                {/* Interactive Toppings Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {toppingCards.map((topping) => (
                    <ToppingCard
                      key={topping.id}
                      topping={topping}
                      onSelect={upsertTopping}
                      onRemove={removeTopping}
                      onPlacementChange={setToppingPlacement}
                      onAmountChange={setToppingAmount}
                    />
                  ))}
                </div>
	                </div>
	              </section>

              {/* Step 4: Notes */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 font-bold flex items-center justify-center shrink-0">4</div>
                  <h3 className="font-bold text-xl text-gray-900">Special Instructions</h3>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests? (e.g., well done, light sauce, etc.)"
                  className="w-full p-4 rounded-lg border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none resize-none h-24 text-gray-900 font-medium"
                />
              </section>

            </div>
          </div>
        </div>

        {/* Footer - Price & Add to Cart */}
        <div className="bg-white border-t border-gray-200 p-6 shrink-0 z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              {/* Quantity Selector */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1.5">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm hover:shadow hover:text-orange-600 transition-all text-gray-600"
                >
                  <Minus size={20} />
                </button>
                <span className="w-8 text-center font-black text-xl text-gray-900">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center shadow-sm hover:bg-orange-100 transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>
              
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Amount</p>
                <p className="text-4xl font-black text-gray-900 tracking-tight">${totalPrice.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={onCancel}
                className="w-full sm:w-auto px-8 py-5 rounded-lg font-bold text-white bg-red-500 hover:bg-red-600 transition-all shadow-sm hover:shadow-md"
              >
                Close
              </button>
              <button
                onClick={handleAdd}
                className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 text-white px-10 py-5 rounded-lg font-black text-xl hover:shadow-2xl hover:shadow-orange-500/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
              >
                <ShoppingCart size={24} />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildYourOwnPizza;

