import React, { useMemo, useState } from 'react';
import { ChefHat, Minus, Plus, X } from 'lucide-react';

interface BuildYourOwnSaladProps {
  onAdd: (item: any) => void;
  onCancel: () => void;
}

const SIZE_OPTIONS = [
  { id: 'small', name: 'Small', price: 6.99 },
  { id: 'regular', name: 'Regular', price: 9.99 },
];

const BASE_OPTIONS = [
  { id: 'romaine', name: 'Romaine', price: 0 },
  { id: 'spring-mix', name: 'Spring Mix', price: 0 },
  { id: 'spinach', name: 'Spinach', price: 0.5 },
];

const PROTEIN_OPTIONS = [
  { id: 'beef', name: 'Beef', price: 2.5 },
  { id: 'gyro', name: 'Gyro', price: 2.5 },
  { id: 'steak', name: 'Steak', price: 3.0 },
  { id: 'chicken', name: 'Chicken', price: 2.5 },
  { id: 'egg', name: 'Egg', price: 1.5 },
  { id: 'ham', name: 'Ham', price: 2.0 },
  { id: 'salami', name: 'Salami', price: 2.0 },
];

const DRESSING_OPTIONS = [
  { id: 'ranch', name: 'Ranch', price: 0 },
  { id: 'caesar', name: 'Caesar', price: 0 },
  { id: 'italian', name: 'Italian', price: 0 },
  { id: 'balsamic', name: 'Balsamic Vinaigrette', price: 0 },
  { id: 'blue-cheese', name: 'Blue Cheese', price: 0.5 },
  { id: 'thousand-island', name: 'Thousand Island', price: 0 },
];

const EXTRA_OPTIONS = [
  { id: 'extra-cheese', name: 'Extra Cheese', price: 1.25 },
  { id: 'extra-olives', name: 'Extra Olives', price: 0.75 },
  { id: 'extra-croutons', name: 'Extra Croutons', price: 0.5 },
  { id: 'avocado', name: 'Avocado', price: 1.75 },
];

type FixingAmount = 'LIGHT' | 'REGULAR' | 'EXTRA';

const FIXING_AMOUNT_OPTIONS: Array<{ id: FixingAmount; label: string }> = [
  { id: 'LIGHT', label: 'Light' },
  { id: 'REGULAR', label: 'Regular' },
  { id: 'EXTRA', label: 'Extra' },
];

const FIXING_AMOUNT_LABEL: Record<FixingAmount, string> = {
  LIGHT: 'Light',
  REGULAR: 'Regular',
  EXTRA: 'Extra',
};

const FIXING_AMOUNT_MULTIPLIER: Record<FixingAmount, number> = {
  LIGHT: 0.75,
  REGULAR: 1,
  EXTRA: 1.5,
};

const formatFixingName = (name: string, amount: FixingAmount = 'REGULAR') =>
  amount === 'REGULAR' ? name : `${FIXING_AMOUNT_LABEL[amount]} ${name}`;

const BuildYourOwnSalad: React.FC<BuildYourOwnSaladProps> = ({ onAdd, onCancel }) => {
  const [size, setSize] = useState(SIZE_OPTIONS[1]);
  const [base, setBase] = useState(BASE_OPTIONS[0]);
  const [dressing, setDressing] = useState(DRESSING_OPTIONS[0]);
  const [dressingAmount, setDressingAmount] = useState<FixingAmount>('REGULAR');
  const [selectedProteins, setSelectedProteins] = useState<typeof PROTEIN_OPTIONS>([]);
  const [selectedExtras, setSelectedExtras] = useState<typeof EXTRA_OPTIONS>([]);
  const [extraAmounts, setExtraAmounts] = useState<Record<string, FixingAmount>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const toggleSelection = <T extends { id: string }>(
    item: T,
    selected: T[],
    setter: React.Dispatch<React.SetStateAction<T[]>>,
  ) => {
    setter((prev) => {
      const exists = prev.some((p) => p.id === item.id);
      if (exists) return prev.filter((p) => p.id !== item.id);
      return [...prev, item];
    });
  };

  const toggleExtra = (item: typeof EXTRA_OPTIONS[number]) => {
    setSelectedExtras((prev) => {
      const exists = prev.some((extra) => extra.id === item.id);
      if (exists) {
        setExtraAmounts((current) => {
          const next = { ...current };
          delete next[item.id];
          return next;
        });
        return prev.filter((extra) => extra.id !== item.id);
      }
      setExtraAmounts((current) => ({ ...current, [item.id]: 'REGULAR' }));
      return [...prev, item];
    });
  };

  const setExtraAmount = (item: typeof EXTRA_OPTIONS[number], amount: FixingAmount) => {
    setSelectedExtras((prev) => (prev.some((extra) => extra.id === item.id) ? prev : [...prev, item]));
    setExtraAmounts((current) => ({ ...current, [item.id]: amount }));
  };

  const unitPrice = useMemo(() => {
    let price = size.price + base.price + dressing.price + (dressingAmount === 'EXTRA' ? 0.5 : 0);
    selectedProteins.forEach((protein) => {
      price += protein.price;
    });
    selectedExtras.forEach((extra) => {
      price += extra.price * FIXING_AMOUNT_MULTIPLIER[extraAmounts[extra.id] ?? 'REGULAR'];
    });
    return price;
  }, [size, base, dressing, dressingAmount, selectedProteins, selectedExtras, extraAmounts]);

  const handleAdd = () => {
    const modifiers = [
      { modifierId: 'base', optionId: base.id, name: `Greens: ${base.name}`, price: base.price },
      { modifierId: 'dressing', optionId: dressing.id, name: `Dressing: ${formatFixingName(dressing.name, dressingAmount)}`, price: dressing.price },
      ...selectedProteins.map((protein) => ({
        modifierId: 'protein',
        optionId: protein.id,
        name: `Protein: ${protein.name}`,
        price: protein.price,
      })),
      ...selectedExtras.map((extra) => ({
        modifierId: 'extra',
        optionId: extra.id,
        name: formatFixingName(extra.name, extraAmounts[extra.id]),
        price: extra.price * FIXING_AMOUNT_MULTIPLIER[extraAmounts[extra.id] ?? 'REGULAR'],
      })),
    ];

    onAdd({
      productId: `custom-salad-${Date.now()}`,
      productName: `Build Your Own Salad - ${size.name}`,
      sizeId: size.id,
      sizeName: size.name,
      quantity,
      unitPrice,
      modifiers,
      notes,
      kitchenStation: 'SALAD',
    });
  };

  const renderAmountSegment = (
    amount: FixingAmount,
    onAmountChange: (amount: FixingAmount) => void,
    activeClass = 'bg-sky-600 text-white shadow-sm',
  ) => (
    <div className="grid grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1">
      {FIXING_AMOUNT_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onAmountChange(option.id);
          }}
          className={`h-8 rounded-md text-xs font-black transition-all ${
            amount === option.id ? activeClass : 'text-gray-500 hover:bg-white'
          }`}
          aria-pressed={amount === option.id}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
      <div className="bg-gray-50 rounded-2xl shadow-2xl max-w-6xl w-full m-4 my-6 max-h-[95vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-lime-600 to-green-600 px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <ChefHat className="text-white" size={28} />
            <h2 className="text-2xl font-bold text-white">Build Your Own Salad</h2>
          </div>
          <button onClick={onCancel} className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/20 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Size</h3>
            <div className="space-y-2">
              {SIZE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSize(option)}
                  className="w-full p-3 rounded-lg border-2 text-left flex justify-between items-center transition-all"
                  style={{
                    borderColor: size.id === option.id ? '#65a30d' : '#e5e7eb',
                    backgroundColor: size.id === option.id ? '#f7fee7' : 'white',
                  }}
                >
                  <span className="font-semibold text-gray-700">{option.name}</span>
                  <span className="font-bold text-lime-700">${option.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Greens Base</h3>
            <div className="space-y-2">
              {BASE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setBase(option)}
                  className="w-full p-3 rounded-lg border-2 text-left flex justify-between items-center transition-all"
                  style={{
                    borderColor: base.id === option.id ? '#16a34a' : '#e5e7eb',
                    backgroundColor: base.id === option.id ? '#f0fdf4' : 'white',
                  }}
                >
                  <span className="font-semibold text-gray-700">{option.name}</span>
                  <span className="font-bold text-green-700">
                    {option.price > 0 ? `+$${option.price.toFixed(2)}` : 'Included'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Dressing Choice</h3>
            <div className="space-y-2">
              {DRESSING_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setDressing(option)}
                  className="w-full p-3 rounded-lg border-2 text-left flex justify-between items-center transition-all"
                  style={{
                    borderColor: dressing.id === option.id ? '#0284c7' : '#e5e7eb',
                    backgroundColor: dressing.id === option.id ? '#f0f9ff' : 'white',
                  }}
                >
                  <span className="font-semibold text-gray-700">{option.name}</span>
                  <span className="font-bold text-sky-700">
                    {option.price > 0 ? `+$${option.price.toFixed(2)}` : 'Included'}
                  </span>
                </button>
              ))}
              {renderAmountSegment(dressingAmount, setDressingAmount)}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Protein Add-ons</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {PROTEIN_OPTIONS.map((option) => {
                const selected = selectedProteins.some((protein) => protein.id === option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => toggleSelection(option, selectedProteins, setSelectedProteins)}
                    className="w-full p-3 rounded-lg border-2 text-left flex justify-between items-center transition-all"
                    style={{
                      borderColor: selected ? '#ea580c' : '#e5e7eb',
                      backgroundColor: selected ? '#fff7ed' : 'white',
                    }}
                  >
                    <span className="font-semibold text-gray-700">{option.name}</span>
                    <span className="font-bold text-orange-700">+${option.price.toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Extras</h3>
            <div className="space-y-2">
              {EXTRA_OPTIONS.map((option) => {
                const selected = selectedExtras.some((extra) => extra.id === option.id);
                return (
                  <div
                    key={option.id}
                    className="w-full rounded-lg border-2 p-3 transition-all"
                    style={{
                      borderColor: selected ? '#a855f7' : '#e5e7eb',
                      backgroundColor: selected ? '#faf5ff' : 'white',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleExtra(option)}
                      className="flex w-full items-center justify-between gap-3 text-left"
                    >
                      <span className="font-semibold text-gray-700">{option.name}</span>
                      <span className="font-bold text-purple-700">+${option.price.toFixed(2)}</span>
                    </button>
                    {selected && (
                      <div className="mt-2">
                        {renderAmountSegment(
                          extraAmounts[option.id] ?? 'REGULAR',
                          (amount) => setExtraAmount(option, amount),
                          'bg-purple-600 text-white shadow-sm',
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-3 bg-white rounded-xl p-4 shadow-sm">
            <label className="block text-base font-bold text-gray-900 mb-2">Special Instructions</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-lime-500 text-base"
              rows={3}
              placeholder="Example: dressing on side, no onions, extra chicken."
            />
          </div>
        </div>

        <div className="bg-white border-t px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-base font-bold text-gray-700">Quantity:</span>
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg bg-white shadow-sm hover:shadow flex items-center justify-center"
                >
                  <Minus size={20} className="text-gray-600" />
                </button>
                <span className="w-12 text-center font-bold text-xl text-gray-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg bg-white shadow-sm hover:shadow flex items-center justify-center"
                >
                  <Plus size={20} className="text-gray-600" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500 font-medium">Total Price</div>
                <div className="text-3xl font-black text-lime-700">${(unitPrice * quantity).toFixed(2)}</div>
              </div>
              <button
                onClick={handleAdd}
                className="px-8 py-4 bg-gradient-to-r from-lime-600 to-green-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
              >
                <Plus size={24} />
                Add to Order
              </button>
              <button
                onClick={onCancel}
                className="px-6 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildYourOwnSalad;
