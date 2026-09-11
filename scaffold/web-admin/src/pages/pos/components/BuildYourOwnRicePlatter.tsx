import React, { useState } from 'react';
import { ChefHat, Minus, Plus, X } from 'lucide-react';

interface BuildYourOwnRicePlatterProps {
  onAdd: (item: any) => void;
  onCancel: () => void;
}

const SIZE_OPTIONS = [
  { id: 'regular', name: 'Regular', price: 10.99 },
  { id: 'large', name: 'Large', price: 13.99 },
];

const PROTEIN_OPTIONS = [
  { id: 'chicken', name: 'Chicken', price: 0 },
  { id: 'gyro', name: 'Gyro', price: 0.5 },
  { id: 'chicken-gyro', name: 'Chicken + Gyro', price: 2 },
];

const SALAD_OPTIONS = [
  { id: 'no-salad', name: 'No Salad', price: 0 },
  { id: 'regular-salad', name: 'Regular Salad', price: 0 },
  { id: 'extra-salad', name: 'Extra Salad', price: 1.25 },
];

const TOP_SAUCE_OPTIONS = [
  { id: 'white-sauce', name: 'White Sauce', price: 0 },
  { id: 'red-sauce', name: 'Red Sauce', price: 0 },
];

const SIDE_SAUCE_OPTIONS = [
  { id: 'side-white-sauce', name: 'White Sauce On Side', price: 0.5 },
  { id: 'side-red-sauce', name: 'Red Sauce On Side', price: 0.5 },
  { id: 'side-green-sauce', name: 'Green Sauce On Side', price: 0.5 },
];

const EXTRAS_OPTIONS = [
  { id: 'extra-protein', name: 'Extra Protein', price: 3.5 },
  { id: 'extra-rice', name: 'Extra Rice', price: 1.5 },
  { id: 'grilled-veggies', name: 'Grilled Veggies', price: 2 },
];

const BuildYourOwnRicePlatter: React.FC<BuildYourOwnRicePlatterProps> = ({ onAdd, onCancel }) => {
  const [size, setSize] = useState(SIZE_OPTIONS[0]);
  const [protein, setProtein] = useState(PROTEIN_OPTIONS[0]);
  const [salad, setSalad] = useState(SALAD_OPTIONS[1]);
  const [selectedTopSauces, setSelectedTopSauces] = useState<typeof TOP_SAUCE_OPTIONS>([TOP_SAUCE_OPTIONS[0]]);
  const [selectedSideSauces, setSelectedSideSauces] = useState<typeof SIDE_SAUCE_OPTIONS>([]);
  const [selectedExtras, setSelectedExtras] = useState<typeof EXTRAS_OPTIONS>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const toggleSelection = <T extends { id: string }>(
    item: T,
    selected: T[],
    setter: React.Dispatch<React.SetStateAction<T[]>>,
  ) => {
    setter((prev) => {
      const exists = prev.some((p) => p.id === item.id);
      if (exists) {
        return prev.filter((p) => p.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const calculatePrice = () => {
    let price = size.price + protein.price + salad.price;
    selectedTopSauces.forEach((s) => {
      price += s.price;
    });
    selectedSideSauces.forEach((s) => {
      price += s.price;
    });
    selectedExtras.forEach((e) => {
      price += e.price;
    });
    return price;
  };

  const handleAllSaucesOnSide = () => {
    setSelectedTopSauces([]);
    setSelectedSideSauces([...SIDE_SAUCE_OPTIONS]);
  };

  const handleAdd = () => {
    const modifiers = [
      { modifierId: 'protein', optionId: protein.id, name: `Protein: ${protein.name}`, price: protein.price },
      { modifierId: 'salad', optionId: salad.id, name: `Salad: ${salad.name}`, price: salad.price },
      ...selectedTopSauces.map((s) => ({
        modifierId: 'top_sauce',
        optionId: s.id,
        name: `Top Sauce: ${s.name}`,
        price: s.price,
      })),
      ...selectedSideSauces.map((s) => ({
        modifierId: 'side_sauce',
        optionId: s.id,
        name: s.name,
        price: s.price,
      })),
      ...selectedExtras.map((e) => ({
        modifierId: 'extra',
        optionId: e.id,
        name: e.name,
        price: e.price,
      })),
    ];

    onAdd({
      productId: `custom-rice-platter-${Date.now()}`,
      productName: `Build Your Own Rice Platter - ${size.name}`,
      sizeId: size.id,
      sizeName: size.name,
      quantity,
      unitPrice: calculatePrice(),
      modifiers,
      notes,
      kitchenStation: 'GRILL',
    });
  };

  const totalPrice = calculatePrice() * quantity;

  const ToggleButton = ({
    item,
    selected,
    onClick,
    color,
  }: {
    item: { id: string; name: string; price: number };
    selected: boolean;
    onClick: () => void;
    color: string;
  }) => (
    <button
      onClick={onClick}
      className="p-4 rounded-xl border-2 text-left transition-all hover:shadow-md"
      style={{
        borderColor: selected ? color : '#e5e7eb',
        backgroundColor: selected ? `${color}15` : 'white',
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-bold text-base" style={{ color: selected ? color : '#374151' }}>
          {item.name}
        </span>
        {selected && (
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: color }}
          >
            +
          </span>
        )}
      </div>
      {item.price > 0 ? (
        <span className="text-sm font-bold" style={{ color: selected ? color : '#6b7280' }}>
          +${item.price.toFixed(2)}
        </span>
      ) : (
        <span className="text-sm font-bold text-green-600">Included</span>
      )}
    </button>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
      <div className="bg-gray-50 rounded-2xl shadow-2xl max-w-5xl w-full m-4 my-6 max-h-[95vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <ChefHat className="text-white" size={28} />
            <h2 className="text-2xl font-bold text-white">Build Your Own Rice Platter</h2>
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
                    borderColor: size.id === option.id ? '#0d9488' : '#e5e7eb',
                    backgroundColor: size.id === option.id ? '#f0fdfa' : 'white',
                  }}
                >
                  <span className="font-semibold text-gray-700">{option.name}</span>
                  <span className="font-bold text-teal-700">${option.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Protein</h3>
            <div className="space-y-2">
              {PROTEIN_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setProtein(option)}
                  className="w-full p-3 rounded-lg border-2 text-left flex justify-between items-center transition-all"
                  style={{
                    borderColor: protein.id === option.id ? '#2563eb' : '#e5e7eb',
                    backgroundColor: protein.id === option.id ? '#eff6ff' : 'white',
                  }}
                >
                  <span className="font-semibold text-gray-700">{option.name}</span>
                  {option.price > 0 && <span className="font-bold text-blue-700">+${option.price.toFixed(2)}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Salad</h3>
            <div className="space-y-2">
              {SALAD_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSalad(option)}
                  className="w-full p-3 rounded-lg border-2 text-left flex justify-between items-center transition-all"
                  style={{
                    borderColor: salad.id === option.id ? '#16a34a' : '#e5e7eb',
                    backgroundColor: salad.id === option.id ? '#f0fdf4' : 'white',
                  }}
                >
                  <span className="font-semibold text-gray-700">{option.name}</span>
                  {option.price > 0 && <span className="font-bold text-green-700">+${option.price.toFixed(2)}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Sauce Options</h3>
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">On Top</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TOP_SAUCE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => toggleSelection(option, selectedTopSauces, setSelectedTopSauces)}
                    className="p-4 rounded-xl border-2 text-left transition-all hover:shadow-md"
                    style={{
                      borderColor: selectedTopSauces.some((s) => s.id === option.id) ? '#dc2626' : '#e5e7eb',
                      backgroundColor: selectedTopSauces.some((s) => s.id === option.id) ? '#fef2f2' : 'white',
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-base" style={{ color: selectedTopSauces.some((s) => s.id === option.id) ? '#dc2626' : '#374151' }}>
                        {option.name}
                      </span>
                      {selectedTopSauces.some((s) => s.id === option.id) && (
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold bg-red-600">
                          +
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-green-600">Included</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Select one, both, or none if customer wants all sauces on side.</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">Sauce On Side</p>
                <button
                  type="button"
                  onClick={handleAllSaucesOnSide}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  All Sauces On Side
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {SIDE_SAUCE_OPTIONS.map((option) => (
                <ToggleButton
                  key={option.id}
                  item={option}
                  selected={selectedSideSauces.some((s) => s.id === option.id)}
                  onClick={() => toggleSelection(option, selectedSideSauces, setSelectedSideSauces)}
                  color="#dc2626"
                />
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3">Choose top sauces and optional side sauces, or move all sauces to side.</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Extras</h3>
            <div className="space-y-2">
              {EXTRAS_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => toggleSelection(option, selectedExtras, setSelectedExtras)}
                  className="w-full p-3 rounded-lg border-2 text-left flex justify-between items-center transition-all"
                  style={{
                    borderColor: selectedExtras.some((e) => e.id === option.id) ? '#f59e0b' : '#e5e7eb',
                    backgroundColor: selectedExtras.some((e) => e.id === option.id) ? '#fffbeb' : 'white',
                  }}
                >
                  <span className="font-semibold text-gray-700">{option.name}</span>
                  <span className="font-bold text-amber-700">+${option.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 bg-white rounded-xl p-4 shadow-sm">
            <label className="block text-base font-bold text-gray-900 mb-2">Special Instructions</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 text-base"
              rows={3}
              placeholder="Example: extra white sauce, cut chicken smaller, no onions in salad."
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
                <div className="text-3xl font-black text-teal-700">${totalPrice.toFixed(2)}</div>
              </div>
              <button
                onClick={handleAdd}
                className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
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

export default BuildYourOwnRicePlatter;
