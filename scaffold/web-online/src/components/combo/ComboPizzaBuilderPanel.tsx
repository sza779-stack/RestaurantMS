import React, { useMemo, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import type { PizzaTopping, ToppingAmount, ToppingPlacement, ToppingSelection } from '../build/pizza/types';
import { ToppingCard } from '../build/pizza/ToppingCard';
import { PizzaVisualizerSvg } from '../build/pizza/PizzaVisualizerSvg';

type Option = {
  id: string;
  name: string;
  price: number;
  category?: 'meat' | 'veggie';
};

type ComboPizzaBuilderPanelProps = {
  item: any;
  onChange: (patch: Partial<any>) => void;
};

const SIZE_OPTIONS: Option[] = [
  { id: 'small', name: 'Small (10")', price: 0 },
  { id: 'medium', name: 'Medium (12")', price: 0 },
  { id: 'large', name: 'Large (14")', price: 0 },
  { id: 'xlarge', name: 'X-Large (16")', price: 2 },
];

const FALLBACK_CRUSTS: Option[] = [
  { id: 'hand-tossed', name: 'Hand Tossed', price: 0 },
  { id: 'thin-crust', name: 'Thin Crust', price: 0 },
  { id: 'pan', name: 'Pan Pizza', price: 1 },
  { id: 'stuffed', name: 'Stuffed Crust', price: 2.5 },
  { id: 'gluten-free', name: 'Gluten Free', price: 2 },
];

const FALLBACK_SAUCES: Option[] = [
  { id: 'tomato', name: 'Classic Tomato', price: 0 },
  { id: 'no-sauce', name: 'No Sauce', price: 0 },
  { id: 'bbq', name: 'BBQ Sauce', price: 0 },
  { id: 'alfredo', name: 'Alfredo', price: 0.5 },
  { id: 'pesto', name: 'Pesto', price: 0.5 },
  { id: 'buffalo', name: 'Buffalo', price: 0 },
];

const FALLBACK_CHEESES: Option[] = [
  { id: 'mozzarella', name: 'Mozzarella', price: 0 },
  { id: 'no-cheese', name: 'No Cheese', price: 0 },
  { id: 'extra-mozzarella', name: 'Extra Mozzarella', price: 1.5 },
  { id: 'cheddar', name: 'Cheddar Blend', price: 0.5 },
  { id: 'four-cheese', name: 'Four Cheese', price: 1 },
];

const FALLBACK_TOPPINGS: Option[] = [
  { id: 'pepperoni', name: 'Pepperoni', price: 1.5, category: 'meat' },
  { id: 'sausage', name: 'Italian Sausage', price: 1.5, category: 'meat' },
  { id: 'bacon', name: 'Bacon', price: 1.5, category: 'meat' },
  { id: 'ham', name: 'Ham', price: 1.5, category: 'meat' },
  { id: 'chicken', name: 'Grilled Chicken', price: 2, category: 'meat' },
  { id: 'beef', name: 'Ground Beef', price: 1.5, category: 'meat' },
  { id: 'mushrooms', name: 'Mushrooms', price: 1, category: 'veggie' },
  { id: 'onions', name: 'Onions', price: 0.75, category: 'veggie' },
  { id: 'peppers', name: 'Green Peppers', price: 0.75, category: 'veggie' },
  { id: 'olives', name: 'Black Olives', price: 0.75, category: 'veggie' },
  { id: 'tomatoes', name: 'Fresh Tomatoes', price: 1, category: 'veggie' },
  { id: 'spinach', name: 'Spinach', price: 1, category: 'veggie' },
  { id: 'pineapple', name: 'Pineapple', price: 1, category: 'veggie' },
  { id: 'jalapenos', name: 'Jalapenos', price: 0.75, category: 'veggie' },
];

const optionPrice = (value?: number) => (value && value > 0 ? `+$${value.toFixed(2)}` : 'Included');
const amountLabel: Record<string, string> = {
  light: 'Light',
  regular: 'Regular',
  extra: 'Extra',
};
const TOPPING_AMOUNT_OPTIONS: Array<{ id: ToppingAmount; name: string; multiplier: number }> = [
  { id: 'LIGHT', name: 'Light', multiplier: 0.75 },
  { id: 'REGULAR', name: 'Regular', multiplier: 1 },
  { id: 'EXTRA', name: 'Extra', multiplier: 1.5 },
];
const toppingAmountName = (amount?: ToppingAmount) => TOPPING_AMOUNT_OPTIONS.find((option) => option.id === (amount || 'REGULAR'))?.name || 'Regular';
const toppingLabel = (topping: ToppingSelection) => `${topping.amount && topping.amount !== 'REGULAR' ? `${toppingAmountName(topping.amount)} ` : ''}${topping.name}`;
const toppingCategory = (category?: 'meat' | 'veggie'): PizzaTopping['category'] => (
  category === 'meat' ? 'MEAT' : 'VEGETABLE'
);

function optionsFromAddonSets(item: any, type: 'crust' | 'sauce' | 'cheese' | 'topping', fallback: Option[]): Option[] {
  const eligible = item?.selectionRules?.eligibleAddonIds || [];
  const sets = item?.selectedProduct?.addonSets || [];
  const matches = sets.filter((pas: any) => {
    const name = String(pas?.addonSet?.name || '').toLowerCase();
    if (type === 'topping') return name.includes('topping') || name.includes('meat') || name.includes('veggie');
    return name.includes(type);
  });
  const mapped = matches.flatMap((pas: any) => (
    (pas.addonSet?.addons || [])
      .filter((sa: any) => eligible.length === 0 || eligible.includes(sa.addon?.id))
      .map((sa: any) => {
        const setName = String(pas.addonSet?.name || '').toLowerCase();
        const addonName = String(sa.addon?.name || '').toLowerCase();
        const category = setName.includes('meat') || ['pepperoni', 'sausage', 'bacon', 'ham', 'chicken', 'beef'].some((key) => addonName.includes(key))
          ? 'meat'
          : 'veggie';
        return {
          id: sa.addon.id,
          name: sa.addon.name,
          price: Number(sa.priceOverride ?? sa.addon.price ?? 0),
          category: type === 'topping' ? category : undefined,
        };
      })
  ));
  return mapped.length ? mapped : fallback;
}

export function ComboPizzaBuilderPanel({ item, onChange }: ComboPizzaBuilderPanelProps) {
  const [activeToppingId, setActiveToppingId] = useState<string | null>(null);
  const [activeToppingTab, setActiveToppingTab] = useState<'meat' | 'veggie'>('meat');

  const crusts = useMemo(() => optionsFromAddonSets(item, 'crust', FALLBACK_CRUSTS), [item]);
  const sauces = useMemo(() => optionsFromAddonSets(item, 'sauce', FALLBACK_SAUCES), [item]);
  const cheeses = useMemo(() => optionsFromAddonSets(item, 'cheese', FALLBACK_CHEESES), [item]);
  const toppings = useMemo(() => optionsFromAddonSets(item, 'topping', FALLBACK_TOPPINGS), [item]);

  const selections = item?.selections || {};
  const size = SIZE_OPTIONS.find((option) => option.id === selections.pizzaSize?.[0]) || SIZE_OPTIONS[2];
  const crust = crusts.find((option) => option.id === selections.crust?.[0]) || crusts[0];
  const sauce = sauces.find((option) => option.id === selections.sauce?.[0]) || sauces[0];
  const cheese = cheeses.find((option) => option.id === selections.cheese?.[0]) || cheeses[0];
  const sauceAmount = selections.sauceAmount?.[0] || 'regular';
  const cheeseAmount = selections.cheeseAmount?.[0] || 'regular';
  const toppingIds: string[] = selections.fallbackToppings || selections.comboPizzaToppings || [];
  const selectedToppings: ToppingSelection[] = toppingIds.map((id) => {
    const option = toppings.find((candidate) => candidate.id === id);
    if (!option) return null;
    return {
      id,
	      name: option.name,
	      price: option.price,
	      side: item?.toppingSides?.[id] || 'FULL',
	      amount: item?.toppingAmounts?.[id] || 'REGULAR',
	    };
	  }).filter(Boolean) as ToppingSelection[];

	  const updateSelections = (
	    patch: Record<string, string[]>,
	    toppingSides = item?.toppingSides || {},
	    toppingAmounts = item?.toppingAmounts || {},
	  ) => {
	    onChange({
	      selections: { ...selections, ...patch },
	      toppingSides,
	      toppingAmounts,
	    });
	  };

  const setSingle = (key: string, value: string) => updateSelections({ [key]: [value] });

  const handleToppingClick = (topping: Option) => {
	    const selected = new Set(toppingIds);
	    const sides = { ...(item?.toppingSides || {}) };
	    const amounts = { ...(item?.toppingAmounts || {}) };
	    if (selected.has(topping.id)) {
	      selected.delete(topping.id);
	      delete sides[topping.id];
	      delete amounts[topping.id];
	      setActiveToppingId(null);
	    } else {
	      selected.add(topping.id);
	      sides[topping.id] = 'FULL';
	      amounts[topping.id] = 'REGULAR';
	      setActiveToppingId(topping.id);
	    }
	    updateSelections({ fallbackToppings: Array.from(selected), comboPizzaToppings: Array.from(selected) }, sides, amounts);
	  };

  const selectTopping = (toppingId: string) => {
    const selected = new Set(toppingIds);
    const sides = { ...(item?.toppingSides || {}) };
    const amounts = { ...(item?.toppingAmounts || {}) };
    selected.add(toppingId);
    sides[toppingId] = sides[toppingId] || 'FULL';
    amounts[toppingId] = amounts[toppingId] || 'REGULAR';
    setActiveToppingId(toppingId);
    updateSelections({ fallbackToppings: Array.from(selected), comboPizzaToppings: Array.from(selected) }, sides, amounts);
  };

  const removeTopping = (toppingId: string) => {
    const selected = new Set(toppingIds);
    const sides = { ...(item?.toppingSides || {}) };
    const amounts = { ...(item?.toppingAmounts || {}) };
    selected.delete(toppingId);
    delete sides[toppingId];
    delete amounts[toppingId];
    setActiveToppingId((current) => current === toppingId ? null : current);
    updateSelections({ fallbackToppings: Array.from(selected), comboPizzaToppings: Array.from(selected) }, sides, amounts);
  };

  const setToppingSide = (toppingId: string, side: ToppingPlacement) => {
	    const selected = new Set(toppingIds);
	    const sides = { ...(item?.toppingSides || {}) };
	    const amounts = { ...(item?.toppingAmounts || {}) };
	    selected.add(toppingId);
	    sides[toppingId] = side;
	    amounts[toppingId] = amounts[toppingId] || 'REGULAR';
	    setActiveToppingId(toppingId);
	    updateSelections({ fallbackToppings: Array.from(selected), comboPizzaToppings: Array.from(selected) }, sides, amounts);
	  };

		  const setToppingAmount = (toppingId: string, amount: ToppingAmount) => {
	    const selected = new Set(toppingIds);
	    const sides = { ...(item?.toppingSides || {}) };
	    const amounts = { ...(item?.toppingAmounts || {}) };
	    selected.add(toppingId);
	    sides[toppingId] = sides[toppingId] || 'FULL';
	    amounts[toppingId] = amount;
	    setActiveToppingId(toppingId);
	    updateSelections({ fallbackToppings: Array.from(selected), comboPizzaToppings: Array.from(selected) }, sides, amounts);
	  };

  const handlePizzaTap = (tapSide: 'LEFT' | 'RIGHT') => {
    if (!activeToppingId) return;
    const current = item?.toppingSides?.[activeToppingId] || 'FULL';
    const nextSide = current === 'FULL' ? (tapSide === 'LEFT' ? 'RIGHT' : 'LEFT') : current === tapSide ? 'FULL' : 'FULL';
    setToppingSide(activeToppingId, nextSide);
  };

	  const currentToppings = toppings.filter((topping) => topping.category === activeToppingTab);
  const toppingCards: PizzaTopping[] = currentToppings.map((topping, index) => {
    const isSelected = toppingIds.includes(topping.id);
    return {
      id: topping.id,
      name: topping.name,
      category: toppingCategory(topping.category),
      isAvailable: true,
      isSelected,
      placement: item?.toppingSides?.[topping.id] || 'FULL',
      amount: item?.toppingAmounts?.[topping.id] || 'REGULAR',
      price: topping.price,
      extraPrice: topping.price,
      sortOrder: index + 1,
    };
  });
  const renderAmountControl = (key: 'sauceAmount' | 'cheeseAmount', value: string, accent: 'red' | 'yellow') => (
    <div className={`inline-grid grid-cols-3 rounded-xl border bg-white p-1 ${accent === 'red' ? 'border-red-100' : 'border-yellow-100'}`}>
      {(['light', 'regular', 'extra'] as const).map((amount) => (
        <button
          key={amount}
          type="button"
          onClick={() => setSingle(key, amount)}
          className={`rounded-md px-3 py-2 text-xs font-black transition-all ${
            value === amount
              ? accent === 'red'
                ? 'bg-red-500 text-white shadow-sm'
                : 'bg-yellow-500 text-white shadow-sm'
              : 'text-gray-500 hover:bg-white hover:text-gray-800'
          }`}
        >
          {amountLabel[amount]}
        </button>
      ))}
    </div>
  );

  return (
    <div className="overflow-hidden rounded-2xl bg-white text-slate-900">
      <div className="flex flex-col lg:flex-row">
        <div className="bg-gray-50 p-6 lg:w-2/5 lg:border-r lg:border-gray-200">
          <PizzaVisualizerSvg
            toppings={selectedToppings}
            activeToppingId={activeToppingId}
            onPizzaTap={handlePizzaTap}
            crustId={crust?.id}
            sauceId={sauce?.id}
            cheeseId={cheese?.id}
          />
          <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-gray-950">Your Creation</h3>
                <p className="mt-0.5 text-xs font-semibold text-gray-400">Live kitchen summary</p>
              </div>
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">{selectedToppings.length} toppings</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="rounded-xl border border-orange-100 bg-orange-50/55 p-3">
                <div className="flex justify-between gap-4"><span className="text-gray-500">Size</span><strong className="text-right text-gray-950">{size.name}</strong></div>
              </div>
              <div className="rounded-xl border border-orange-100 bg-orange-50/55 p-3">
                <div className="flex justify-between gap-4"><span className="text-gray-500">Crust</span><strong className="text-right text-gray-950">{crust?.name}</strong></div>
              </div>
              <div className="rounded-xl border border-red-100 bg-red-50/55 p-3">
                <div className="flex justify-between gap-4"><span className="text-gray-500">Sauce</span><strong className="text-right text-red-950">{sauce?.id === 'no-sauce' ? 'No Sauce' : `${amountLabel[sauceAmount]} ${sauce?.name}`}</strong></div>
              </div>
              <div className="rounded-xl border border-yellow-100 bg-yellow-50/60 p-3">
                <div className="flex justify-between gap-4"><span className="text-gray-500">Cheese</span><strong className="text-right text-yellow-950">{cheese?.id === 'no-cheese' ? 'No Cheese' : `${amountLabel[cheeseAmount]} ${cheese?.name}`}</strong></div>
              </div>
              <div>
                <span className="mb-2 block font-medium text-gray-600">Toppings</span>
                <div className="flex flex-wrap gap-2">
                  {selectedToppings.length ? selectedToppings.map((topping) => (
                    <span key={topping.id} className={`${toppings.find((option) => option.id === topping.id)?.category === 'meat' ? 'border-red-100 bg-red-50 text-red-800' : 'border-green-100 bg-green-50 text-green-800'} rounded-lg border px-3 py-1.5 text-sm font-semibold`}>
	                      {toppingLabel(topping)}{topping.side !== 'FULL' ? ` ${topping.side}` : ''}
                    </span>
                  )) : <span className="text-gray-400">None selected</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-h-[64vh] flex-1 overflow-y-auto bg-slate-50 p-6">
          <div className="mx-auto max-w-4xl space-y-8">
            <section>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600">1</div>
                <h3 className="text-xl font-bold text-gray-900">Select Size & Crust</h3>
              </div>
              <div className="grid grid-cols-1 gap-5 rounded-2xl border border-orange-100 bg-orange-50/45 p-5 md:grid-cols-2">
                <div className="space-y-3 rounded-2xl border border-white bg-white/85 p-4 shadow-sm">
                  <label className="text-sm font-bold uppercase tracking-wider text-gray-500">Size</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SIZE_OPTIONS.map((option) => (
                      <button key={option.id} type="button" onClick={() => setSingle('pizzaSize', option.id)} className={`rounded-lg border-2 p-3 text-center transition-all ${size.id === option.id ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                        <div className="font-bold">{option.name.split(' ')[0]}</div>
                        <div className="text-xs text-gray-400">{optionPrice(option.price)}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 rounded-2xl border border-white bg-white/85 p-4 shadow-sm">
                  <label className="text-sm font-bold uppercase tracking-wider text-gray-500">Crust</label>
                  <div className="grid grid-cols-2 gap-2">
                    {crusts.map((option) => (
                      <button key={option.id} type="button" onClick={() => setSingle('crust', option.id)} className={`rounded-lg border-2 p-3 text-left transition-all ${crust?.id === option.id ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                        <span className="block text-sm font-bold">{option.name}</span>
                        <span className="text-xs text-gray-400">{optionPrice(option.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600">2</div>
                <h3 className="text-xl font-bold text-gray-900">Sauce & Cheese</h3>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-4 rounded-2xl border border-red-100 bg-red-50/45 p-4 shadow-sm">
                  <label className="text-sm font-bold uppercase tracking-wider text-gray-500">Sauce</label>
                  <div className="flex flex-wrap gap-2">
                    {sauces.map((option) => (
                      <button key={option.id} type="button" onClick={() => updateSelections({ sauce: [option.id], ...(option.id === 'no-sauce' ? { sauceAmount: ['regular'] } : {}) })} className={`rounded-lg border-2 px-4 py-2.5 text-sm font-bold transition-all ${sauce?.id === option.id ? 'border-red-500 bg-red-50 text-red-700 shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                        {option.name} {option.price > 0 && <span className="font-medium opacity-70">(+${option.price.toFixed(2)})</span>}
                      </button>
                    ))}
                  </div>
                  <div className={`pt-1 ${sauce?.id === 'no-sauce' ? 'pointer-events-none opacity-50' : ''}`}>
                    {renderAmountControl('sauceAmount', sauceAmount, 'red')}
                  </div>
                </div>
                <div className="space-y-4 rounded-2xl border border-yellow-100 bg-yellow-50/45 p-4 shadow-sm">
                  <label className="text-sm font-bold uppercase tracking-wider text-gray-500">Cheese</label>
                  <div className="flex flex-wrap gap-2">
                    {cheeses.map((option) => (
                      <button key={option.id} type="button" onClick={() => updateSelections({ cheese: [option.id], ...(option.id === 'no-cheese' ? { cheeseAmount: ['regular'], cheesePlacement: ['FULL'] } : {}) })} className={`rounded-lg border-2 px-4 py-2.5 text-sm font-bold transition-all ${cheese?.id === option.id ? 'border-yellow-500 bg-yellow-50 text-yellow-700 shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                        {option.name} {option.price > 0 && <span className="font-medium opacity-70">(+${option.price.toFixed(2)})</span>}
                      </button>
                    ))}
                  </div>
                  <div className={`pt-1 ${cheese?.id === 'no-cheese' ? 'pointer-events-none opacity-50' : ''}`}>
                    {renderAmountControl('cheeseAmount', cheeseAmount, 'yellow')}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600">3</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">Add Toppings</h3>
                  <p className="text-sm font-medium text-gray-500">Click to add. Select half/full after adding.</p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-6 flex gap-2 rounded-xl bg-gray-100 p-1">
                <button type="button" onClick={() => setActiveToppingTab('meat')} className={`flex-1 rounded-lg py-3 text-sm font-bold transition-all ${activeToppingTab === 'meat' ? 'bg-red-600 text-white shadow' : 'text-red-600 hover:bg-red-50'}`}>Meats</button>
                <button type="button" onClick={() => setActiveToppingTab('veggie')} className={`flex-1 rounded-lg py-3 text-sm font-bold transition-all ${activeToppingTab === 'veggie' ? 'bg-green-600 text-white shadow' : 'text-green-700 hover:bg-green-50'}`}>Veggies</button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {toppingCards.map((topping) => (
                  <ToppingCard
                    key={topping.id}
                    topping={topping}
                    onSelect={selectTopping}
                    onRemove={removeTopping}
                    onPlacementChange={setToppingSide}
                    onAmountChange={setToppingAmount}
                  />
                ))}
              </div>
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-500">4</div>
                <h3 className="text-xl font-bold text-gray-900">Special Instructions</h3>
              </div>
              <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                <MessageSquare size={13} /> Kitchen note
              </label>
              <textarea
                value={item?.specialInstructions || ''}
                onChange={(event) => onChange({ specialInstructions: event.target.value })}
                placeholder="Any special requests? (e.g., well done, light sauce, etc.)"
                className="h-24 w-full resize-none rounded-lg border-2 border-gray-200 p-4 font-medium text-gray-900 outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
