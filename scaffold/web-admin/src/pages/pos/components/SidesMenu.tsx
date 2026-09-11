import React, { useState } from 'react';
import { X, Plus, Minus, Utensils } from 'lucide-react';

interface SidesMenuProps {
  onAdd: (item: any) => void;
  onCancel: () => void;
}

const FRIES_OPTIONS = [
  { id: 'classic-fries', name: 'Classic Fries', sizes: [
    { id: 'small', name: 'Small', price: 2.99 },
    { id: 'medium', name: 'Medium', price: 3.99 },
    { id: 'large', name: 'Large', price: 4.99 },
  ]},
  { id: 'curly-fries', name: 'Curly Fries', sizes: [
    { id: 'small', name: 'Small', price: 3.49 },
    { id: 'medium', name: 'Medium', price: 4.49 },
    { id: 'large', name: 'Large', price: 5.49 },
  ]},
  { id: 'waffle-fries', name: 'Waffle Fries', sizes: [
    { id: 'small', name: 'Small', price: 3.49 },
    { id: 'medium', name: 'Medium', price: 4.49 },
    { id: 'large', name: 'Large', price: 5.49 },
  ]},
  { id: 'garlic-fries', name: 'Garlic Parmesan Fries', sizes: [
    { id: 'small', name: 'Small', price: 3.99 },
    { id: 'medium', name: 'Medium', price: 4.99 },
    { id: 'large', name: 'Large', price: 5.99 },
  ]},
  { id: 'loaded-fries', name: 'Loaded Fries', sizes: [
    { id: 'regular', name: 'Regular', price: 6.99 },
    { id: 'large', name: 'Large', price: 8.99 },
  ]},
  { id: 'sweet-potato', name: 'Sweet Potato Fries', sizes: [
    { id: 'small', name: 'Small', price: 3.99 },
    { id: 'medium', name: 'Medium', price: 4.99 },
    { id: 'large', name: 'Large', price: 5.99 },
  ]},
];

const ONION_RINGS_OPTIONS = [
  { id: 'onion-rings', name: 'Onion Rings', sizes: [
    { id: 'small', name: 'Small', price: 3.49 },
    { id: 'medium', name: 'Medium', price: 4.49 },
    { id: 'large', name: 'Large', price: 5.49 },
  ]},
  { id: 'bloom-onion', name: "Bloomin' Onion", sizes: [
    { id: 'regular', name: 'Regular', price: 8.99 },
  ]},
];

const MOZZARELLA_OPTIONS = [
  { id: 'mozz-sticks', name: 'Mozzarella Sticks', sizes: [
    { id: '6pc', name: '6 Pieces', price: 5.99 },
    { id: '10pc', name: '10 Pieces', price: 8.99 },
  ]},
  { id: 'fried-mozz', name: 'Fried Mozzarella Bites', sizes: [
    { id: 'regular', name: 'Regular', price: 6.99 },
  ]},
];

const OTHER_SIDES = [
  { id: 'garlic-bread', name: 'Garlic Bread', sizes: [
    { id: 'half', name: 'Half Loaf', price: 3.99 },
    { id: 'full', name: 'Full Loaf', price: 5.99 },
  ]},
  { id: 'cheese-bread', name: 'Cheesy Garlic Bread', sizes: [
    { id: 'half', name: 'Half Loaf', price: 4.99 },
    { id: 'full', name: 'Full Loaf', price: 6.99 },
  ]},
  { id: 'breadsticks', name: 'Breadsticks (4pc)', basePrice: 4.99 },
  { id: 'cheese-breadsticks', name: 'Cheese Breadsticks (4pc)', basePrice: 5.99 },
  { id: 'side-salad', name: 'Side Salad', sizes: [
    { id: 'regular', name: 'Regular', price: 3.99 },
    { id: 'large', name: 'Large', price: 5.99 },
  ]},
  { id: 'coleslaw', name: 'Coleslaw', basePrice: 2.99 },
  { id: 'mac-cheese', name: 'Mac & Cheese', basePrice: 4.99 },
  { id: 'side-rice', name: 'Side of Rice', basePrice: 2.99 },
  { id: 'side-veggies', name: 'Steamed Vegetables', basePrice: 3.99 },
];

const DIPPING_SAUCES = [
  { id: 'ketchup', name: 'Ketchup', price: 0 },
  { id: 'ranch', name: 'Ranch', price: 0.50 },
  { id: 'bbq', name: 'BBQ', price: 0.50 },
  { id: 'honey-mustard', name: 'Honey Mustard', price: 0.50 },
  { id: 'cheese-sauce', name: 'Cheese Sauce', price: 0.99 },
  { id: 'garlic-aioli', name: 'Garlic Aioli', price: 0.50 },
  { id: 'buffalo-ranch', name: 'Buffalo Ranch', price: 0.50 },
  { id: 'marinara', name: 'Marinara', price: 0.50 },
];

const SidesMenu: React.FC<SidesMenuProps> = ({ onAdd, onCancel }) => {
  const [selectedItem, setSelectedItem] = useState<any>(FRIES_OPTIONS[0]);
  const [selectedSize, setSelectedSize] = useState<any>(FRIES_OPTIONS[0].sizes[1]);
  const [selectedSauces, setSelectedSauces] = useState<typeof DIPPING_SAUCES[0][]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [activeCategory, setActiveCategory] = useState<'fries' | 'onion-rings' | 'mozzarella' | 'other'>('fries');

  const handleItemSelect = (item: any) => {
    setSelectedItem(item);
    if (item.sizes) {
      setSelectedSize(item.sizes[0]);
    }
  };

  const toggleSauce = (sauce: typeof DIPPING_SAUCES[0]) => {
    setSelectedSauces((prev) => {
      const exists = prev.find((s) => s.id === sauce.id);
      if (exists) {
        return prev.filter((s) => s.id !== sauce.id);
      }
      return [...prev, sauce];
    });
  };

  const calculatePrice = () => {
    let price = selectedSize?.price ?? selectedItem.basePrice ?? 0;
    selectedSauces.forEach((s) => (price += s.price));
    return price;
  };

  const handleAdd = () => {
    const modifiers = [];

    if (selectedSize) {
      modifiers.push({
        modifierId: 'size',
        optionId: selectedSize.id,
        name: `Size: ${selectedSize.name}`,
        price: 0,
      });
    }

    selectedSauces.forEach((s) => modifiers.push({
      modifierId: 'sauce',
      optionId: s.id,
      name: `Sauce: ${s.name}`,
      price: s.price,
    }));

    const item = {
      productId: `side-${selectedItem.id}-${Date.now()}`,
      productName: selectedItem.name,
      sizeId: selectedSize?.id,
      sizeName: selectedSize?.name,
      quantity,
      unitPrice: calculatePrice(),
      modifiers,
      notes,
      kitchenStation: 'SIDES',
    };

    onAdd(item);
  };

  const totalPrice = calculatePrice() * quantity;

  const getCurrentOptions = () => {
    switch (activeCategory) {
      case 'fries': return FRIES_OPTIONS;
      case 'onion-rings': return ONION_RINGS_OPTIONS;
      case 'mozzarella': return MOZZARELLA_OPTIONS;
      case 'other': return OTHER_SIDES;
      default: return FRIES_OPTIONS;
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
      <div className="bg-gray-50 rounded-2xl shadow-2xl max-w-6xl w-full m-4 my-6 max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-amber-500 px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <Utensils className="text-white" size={28} />
            <h2 className="text-2xl font-bold text-white">Sides & Extras</h2>
          </div>
          <button onClick={onCancel} className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/20 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column */}
            <div className="space-y-5">
              {/* Categories */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600">📂</span>
                  Category
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => { setActiveCategory('fries'); handleItemSelect(FRIES_OPTIONS[0]); }}
                    className="w-full p-3 rounded-lg border-2 text-left flex items-center gap-3 transition-all"
                    style={{
                      borderColor: activeCategory === 'fries' ? '#eab308' : '#e5e7eb',
                      backgroundColor: activeCategory === 'fries' ? '#fefce8' : 'white'
                    }}
                  >
                    <span className="text-2xl">🍟</span>
                    <span className="font-bold" style={{ color: activeCategory === 'fries' ? '#854d0e' : '#374151' }}>
                      Fries
                    </span>
                  </button>
                  <button
                    onClick={() => { setActiveCategory('onion-rings'); handleItemSelect(ONION_RINGS_OPTIONS[0]); }}
                    className="w-full p-3 rounded-lg border-2 text-left flex items-center gap-3 transition-all"
                    style={{
                      borderColor: activeCategory === 'onion-rings' ? '#eab308' : '#e5e7eb',
                      backgroundColor: activeCategory === 'onion-rings' ? '#fefce8' : 'white'
                    }}
                  >
                    <span className="text-2xl">🧅</span>
                    <span className="font-bold" style={{ color: activeCategory === 'onion-rings' ? '#854d0e' : '#374151' }}>
                      Onion Rings
                    </span>
                  </button>
                  <button
                    onClick={() => { setActiveCategory('mozzarella'); handleItemSelect(MOZZARELLA_OPTIONS[0]); }}
                    className="w-full p-3 rounded-lg border-2 text-left flex items-center gap-3 transition-all"
                    style={{
                      borderColor: activeCategory === 'mozzarella' ? '#eab308' : '#e5e7eb',
                      backgroundColor: activeCategory === 'mozzarella' ? '#fefce8' : 'white'
                    }}
                  >
                    <span className="text-2xl">🧀</span>
                    <span className="font-bold" style={{ color: activeCategory === 'mozzarella' ? '#854d0e' : '#374151' }}>
                      Mozzarella
                    </span>
                  </button>
                  <button
                    onClick={() => { setActiveCategory('other'); handleItemSelect(OTHER_SIDES[0]); }}
                    className="w-full p-3 rounded-lg border-2 text-left flex items-center gap-3 transition-all"
                    style={{
                      borderColor: activeCategory === 'other' ? '#eab308' : '#e5e7eb',
                      backgroundColor: activeCategory === 'other' ? '#fefce8' : 'white'
                    }}
                  >
                    <span className="text-2xl">🥗</span>
                    <span className="font-bold" style={{ color: activeCategory === 'other' ? '#854d0e' : '#374151' }}>
                      Other Sides
                    </span>
                  </button>
                </div>
              </div>

              {/* Size Selection */}
              {selectedItem?.sizes && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">📏</span>
                    Size
                  </h3>
                  <div className="space-y-2">
                    {selectedItem.sizes.map((s: any) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSize(s)}
                        className="w-full p-3 rounded-lg border-2 text-left flex justify-between items-center transition-all"
                        style={{
                          borderColor: selectedSize?.id === s.id ? '#2563eb' : '#e5e7eb',
                          backgroundColor: selectedSize?.id === s.id ? '#eff6ff' : 'white'
                        }}
                      >
                        <span className="font-semibold" style={{ color: selectedSize?.id === s.id ? '#1e40af' : '#374151' }}>
                          {s.name}
                        </span>
                        <span className="font-bold" style={{ color: selectedSize?.id === s.id ? '#2563eb' : '#6b7280' }}>
                          ${s.price.toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dipping Sauces */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">🥣</span>
                  Dipping Sauces
                </h3>
                <div className="space-y-2">
                  {DIPPING_SAUCES.map((sauce) => (
                    <button
                      key={sauce.id}
                      onClick={() => toggleSauce(sauce)}
                      className="w-full p-3 rounded-lg border-2 text-left flex justify-between items-center transition-all"
                      style={{
                        borderColor: selectedSauces.find((s) => s.id === sauce.id) ? '#2563eb' : '#e5e7eb',
                        backgroundColor: selectedSauces.find((s) => s.id === sauce.id) ? '#eff6ff' : 'white'
                      }}
                    >
                      <span className="font-semibold" style={{ 
                        color: selectedSauces.find((s) => s.id === sauce.id) ? '#1e40af' : '#374151' 
                      }}>
                        {sauce.name}
                      </span>
                      {sauce.price > 0 && (
                        <span className="font-bold text-sm" style={{ 
                          color: selectedSauces.find((s) => s.id === sauce.id) ? '#2563eb' : '#6b7280' 
                        }}>
                          +${sauce.price.toFixed(2)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl p-5 shadow-sm h-full">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600 text-2xl">🍽️</span>
                  Select Item
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {getCurrentOptions().map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemSelect(item)}
                      className="p-5 rounded-xl border-2 text-left transition-all hover:shadow-lg"
                      style={{
                        borderColor: selectedItem.id === item.id ? '#eab308' : '#e5e7eb',
                        backgroundColor: selectedItem.id === item.id ? '#fefce8' : 'white',
                        boxShadow: selectedItem.id === item.id ? '0 4px 12px rgba(234, 179, 8, 0.2)' : 'none'
                      }}
                    >
                      <div className="font-bold text-lg mb-2" style={{ color: selectedItem.id === item.id ? '#854d0e' : '#374151' }}>
                        {item.name}
                      </div>
                      <div className="text-sm font-medium" style={{ color: selectedItem.id === item.id ? '#a16207' : '#6b7280' }}>
                        {item.sizes ? `${item.sizes.length} sizes available` : `$${item.basePrice.toFixed(2)}`}
                      </div>
                      {selectedItem.id === item.id && (
                        <div className="mt-2 text-sm font-bold text-yellow-600">
                          ✓ Selected
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Notes */}
                <div className="mt-6">
                  <label className="block text-base font-bold text-gray-900 mb-2">
                    📝 Special Instructions
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-500 text-base"
                    rows={3}
                    placeholder="Any special requests? (e.g., extra crispy, extra salt, well done, etc.)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t px-6 py-4 shrink-0">
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedSauces.map((s) => (
              <span key={s.id} className="px-3 py-1.5 rounded-full text-sm font-bold bg-blue-100 text-blue-700 border-2 border-blue-400 flex items-center gap-2">
                {s.name}
                <button onClick={() => toggleSauce(s)}><X size={14} /></button>
              </span>
            ))}
          </div>

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
                <div className="text-sm text-gray-500 font-medium">
                  {selectedItem.name} {selectedSize && `- ${selectedSize.name}`}
                </div>
                <div className="text-3xl font-black text-yellow-600">${totalPrice.toFixed(2)}</div>
              </div>
              <button
                onClick={handleAdd}
                className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
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

export default SidesMenu;
