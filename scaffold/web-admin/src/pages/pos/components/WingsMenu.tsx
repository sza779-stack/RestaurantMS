import React, { useState } from 'react';
import { X, Plus, Minus, Flame } from 'lucide-react';

interface WingsMenuProps {
  onAdd: (item: any) => void;
  onCancel: () => void;
}

const WING_SIZES = [
  { id: '6pc', name: '6 Pieces', pieceCount: 6, price: 8.99 },
  { id: '10pc', name: '10 Pieces', pieceCount: 10, price: 13.99 },
  { id: '20pc', name: '20 Pieces', pieceCount: 20, price: 24.99 },
  { id: '50pc', name: '50 Pieces', pieceCount: 50, price: 54.99 },
];

const FLAVOR_OPTIONS = [
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

const DIPPING_SAUCES = [
  { id: 'ranch', name: 'Ranch', price: 0.79 },
  { id: 'blue-cheese', name: 'Blue Cheese', price: 0.79 },
  { id: 'honey-mustard', name: 'Honey Mustard', price: 0.79 },
  { id: 'buffalo-ranch', name: 'Buffalo Ranch', price: 0.79 },
  { id: 'bbq-dip', name: 'BBQ', price: 0.79 },
  { id: 'garlic-sauce', name: 'Garlic Sauce', price: 0.79 },
];

const SIDE_OPTIONS = [
  { id: 'celery', name: 'Celery Sticks', price: 1.99 },
  { id: 'carrots', name: 'Carrot Sticks', price: 1.99 },
  { id: 'fries-small', name: 'Small Fries', price: 3.99 },
  { id: 'fries-large', name: 'Large Fries', price: 5.99 },
  { id: 'onion-rings', name: 'Onion Rings', price: 4.99 },
  { id: 'coleslaw', name: 'Coleslaw', price: 2.99 },
  { id: 'side-salad', name: 'Side Salad', price: 3.99 },
  { id: 'cheese-sticks', name: 'Mozzarella Sticks (5pc)', price: 5.99 },
];

const EXTRAS = [
  { id: 'extra-ranch', name: 'Extra Ranch Cup', price: 0.79 },
  { id: 'extra-blue', name: 'Extra Blue Cheese', price: 0.79 },
  { id: 'extra-celery', name: 'Extra Celery', price: 0.99 },
  { id: 'boneless', name: 'Boneless (Same price)', price: 0 },
  { id: 'all-drumettes', name: 'All Drumettes', price: 0 },
  { id: 'all-flats', name: 'All Flats', price: 0 },
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

const isSauceExtra = (id: string) => id === 'extra-ranch' || id === 'extra-blue';

const WingsMenu: React.FC<WingsMenuProps> = ({ onAdd, onCancel }) => {
  const [size, setSize] = useState(WING_SIZES[1]);
  const [flavors, setFlavors] = useState<string[]>(['buffalo']);
  const [flavorAmounts, setFlavorAmounts] = useState<Record<string, FixingAmount>>({ buffalo: 'REGULAR' });
  const [selectedSides, setSelectedSides] = useState<typeof SIDE_OPTIONS[0][]>([]);
  const [selectedSauces, setSelectedSauces] = useState<typeof DIPPING_SAUCES[0][]>([]);
  const [sauceAmounts, setSauceAmounts] = useState<Record<string, FixingAmount>>({});
  const [selectedExtras, setSelectedExtras] = useState<typeof EXTRAS[0][]>([]);
  const [extraAmounts, setExtraAmounts] = useState<Record<string, FixingAmount>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [boneless, setBoneless] = useState(false);
  const [style, setStyle] = useState<'mixed' | 'drumettes' | 'flats'>('mixed');
  const [activeTab, setActiveTab] = useState<'flavors' | 'sides' | 'extras'>('flavors');

  const toggleFlavor = (flavorId: string) => {
    setFlavors((prev) => {
      if (prev.includes(flavorId)) {
        setFlavorAmounts((current) => {
          const next = { ...current };
          delete next[flavorId];
          return next;
        });
        return prev.filter((f) => f !== flavorId);
      }
      if (prev.length >= 2) {
        setFlavorAmounts((current) => {
          const next: Record<string, FixingAmount> = { ...current, [flavorId]: 'REGULAR' };
          delete next[prev[0]];
          return next;
        });
        return [prev[1], flavorId];
      }
      setFlavorAmounts((current) => ({ ...current, [flavorId]: 'REGULAR' as FixingAmount }));
      return [...prev, flavorId];
    });
  };

  const setFlavorAmount = (flavorId: string, amount: FixingAmount) => {
    setFlavors((prev) => (prev.includes(flavorId) ? prev : [...prev.slice(-1), flavorId]));
    setFlavorAmounts((current) => ({ ...current, [flavorId]: amount }));
  };

  const toggleSelection = <T extends { id: string }>(
    item: T,
    selected: T[],
    setter: React.Dispatch<React.SetStateAction<T[]>>
  ) => {
    setter((prev) => {
      const exists = prev.find((p) => p.id === item.id);
      if (exists) {
        return prev.filter((p) => p.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const togglePortionable = <T extends { id: string }>(
    item: T,
    selected: T[],
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    amountSetter: React.Dispatch<React.SetStateAction<Record<string, FixingAmount>>>,
  ) => {
    setter((prev) => {
      const exists = prev.find((p) => p.id === item.id);
      if (exists) {
        amountSetter((current) => {
          const next = { ...current };
          delete next[item.id];
          return next;
        });
        return prev.filter((p) => p.id !== item.id);
      }
      amountSetter((current) => ({ ...current, [item.id]: 'REGULAR' }));
      return [...prev, item];
    });
  };

  const setPortionAmount = <T extends { id: string }>(
    item: T,
    amount: FixingAmount,
    selected: T[],
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    amountSetter: React.Dispatch<React.SetStateAction<Record<string, FixingAmount>>>,
  ) => {
    if (!selected.find((p) => p.id === item.id)) setter((prev) => [...prev, item]);
    amountSetter((current) => ({ ...current, [item.id]: amount }));
  };

  const calculatePrice = () => {
    let price = size.price;
    if (flavors.length > 1) price += 1.00;
    
    selectedSides.forEach((s) => (price += s.price));
    selectedSauces.forEach((s) => (price += s.price * FIXING_AMOUNT_MULTIPLIER[sauceAmounts[s.id] ?? 'REGULAR']));
    selectedExtras.forEach((e) => (price += e.price * (isSauceExtra(e.id) ? FIXING_AMOUNT_MULTIPLIER[extraAmounts[e.id] ?? 'REGULAR'] : 1)));
    
    return price;
  };

  const getHeatColor = (heat: string) => {
    switch (heat) {
      case 'mild': return { bg: '#dcfce7', text: '#166534', border: '#22c55e' };
      case 'medium': return { bg: '#fef9c3', text: '#854d0e', border: '#eab308' };
      case 'hot': return { bg: '#ffedd5', text: '#9a3412', border: '#f97316' };
      case 'extra-hot': return { bg: '#fee2e2', text: '#991b1b', border: '#dc2626' };
      default: return { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' };
    }
  };

  const getHeatEmoji = (heat: string) => {
    switch (heat) {
      case 'mild': return '🌶️';
      case 'medium': return '🌶️🌶️';
      case 'hot': return '🌶️🌶️🌶️';
      case 'extra-hot': return '🔥🔥';
      default: return '';
    }
  };

  const handleAdd = () => {
    const selectedFlavorNames = flavors.map(
      (f) => FLAVOR_OPTIONS.find((fo) => fo.id === f)?.name || f
    );

    const modifiers = [
      { modifierId: 'style', optionId: boneless ? 'boneless' : 'traditional', name: boneless ? 'Boneless' : 'Traditional', price: 0 },
      { modifierId: 'cut', optionId: style, name: `Cut: ${style === 'mixed' ? 'Mixed' : style === 'drumettes' ? 'All Drumettes' : 'All Flats'}`, price: 0 },
      ...flavors.map((f) => {
        const flavor = FLAVOR_OPTIONS.find((fo) => fo.id === f)!;
        return { modifierId: 'flavor', optionId: f, name: `Flavor: ${formatFixingName(flavor.name, flavorAmounts[f])}`, price: flavors.length > 1 ? 0.5 : 0 };
      }),
      ...selectedSauces.map((s) => ({ modifierId: 'dipping', optionId: s.id, name: `Dip: ${formatFixingName(s.name, sauceAmounts[s.id])}`, price: s.price * FIXING_AMOUNT_MULTIPLIER[sauceAmounts[s.id] ?? 'REGULAR'] })),
      ...selectedSides.map((s) => ({ modifierId: 'side', optionId: s.id, name: `Side: ${s.name}`, price: s.price })),
      ...selectedExtras.map((e) => ({ modifierId: 'extra', optionId: e.id, name: isSauceExtra(e.id) ? formatFixingName(e.name, extraAmounts[e.id]) : e.name, price: e.price * (isSauceExtra(e.id) ? FIXING_AMOUNT_MULTIPLIER[extraAmounts[e.id] ?? 'REGULAR'] : 1) })),
    ];

    const item = {
      productId: `wings-${Date.now()}`,
      productName: `${boneless ? 'Boneless' : 'Traditional'} Wings - ${size.name}`,
      sizeId: size.id,
      sizeName: size.name,
      quantity,
      unitPrice: calculatePrice(),
      modifiers,
      notes,
      kitchenStation: 'FRYER',
    };

    onAdd(item);
  };

  const totalPrice = calculatePrice() * quantity;

  const renderAmountSegment = (
    amount: FixingAmount,
    onAmountChange: (amount: FixingAmount) => void,
    activeClass = 'bg-orange-600 text-white shadow-sm',
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
    <div className="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
      <div className="bg-gray-50 rounded-2xl shadow-2xl max-w-6xl w-full m-4 my-6 max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <Flame className="text-white" size={28} />
            <h2 className="text-2xl font-bold text-white">Chicken Wings</h2>
          </div>
          <button onClick={onCancel} className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/20 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column */}
            <div className="space-y-5">
              {/* Size */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">🍗</span>
                  Wing Count
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {WING_SIZES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSize(s)}
                      className="p-3 rounded-lg border-2 text-left transition-all"
                      style={{
                        borderColor: size.id === s.id ? '#ea580c' : '#e5e7eb',
                        backgroundColor: size.id === s.id ? '#fff7ed' : 'white'
                      }}
                    >
                      <div className="font-bold" style={{ color: size.id === s.id ? '#9a3412' : '#374151' }}>
                        {s.name}
                      </div>
                      <div className="text-sm font-bold" style={{ color: size.id === s.id ? '#ea580c' : '#6b7280' }}>
                        ${s.price.toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">🍖</span>
                  Style
                </h3>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setBoneless(false)}
                    className="flex-1 p-3 rounded-lg border-2 font-bold text-sm transition-all"
                    style={{
                      borderColor: !boneless ? '#d97706' : '#e5e7eb',
                      backgroundColor: !boneless ? '#fffbeb' : 'white',
                      color: !boneless ? '#92400e' : '#374151'
                    }}
                  >
                    Traditional
                  </button>
                  <button
                    onClick={() => setBoneless(true)}
                    className="flex-1 p-3 rounded-lg border-2 font-bold text-sm transition-all"
                    style={{
                      borderColor: boneless ? '#d97706' : '#e5e7eb',
                      backgroundColor: boneless ? '#fffbeb' : 'white',
                      color: boneless ? '#92400e' : '#374151'
                    }}
                  >
                    Boneless
                  </button>
                </div>
                <div className="space-y-2">
                  {[
                    { id: 'mixed', name: 'Mixed (Drumettes & Flats)' },
                    { id: 'drumettes', name: 'All Drumettes' },
                    { id: 'flats', name: 'All Flats' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id as any)}
                      className="w-full p-2 rounded-lg border-2 text-left text-sm font-semibold transition-all"
                      style={{
                        borderColor: style === s.id ? '#ea580c' : '#e5e7eb',
                        backgroundColor: style === s.id ? '#fff7ed' : 'white',
                        color: style === s.id ? '#9a3412' : '#374151'
                      }}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dipping Sauces */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">🥣</span>
                  Dipping Sauces
                </h3>
                <div className="space-y-2">
	                  {DIPPING_SAUCES.map((sauce) => {
	                    const selected = selectedSauces.find((s) => s.id === sauce.id);
	                    return (
	                      <div
	                        key={sauce.id}
	                        className="w-full rounded-lg border-2 p-3 transition-all"
	                        style={{
	                          borderColor: selected ? '#2563eb' : '#e5e7eb',
	                          backgroundColor: selected ? '#eff6ff' : 'white'
	                        }}
	                      >
	                        <button
	                          type="button"
	                          onClick={() => togglePortionable(sauce, selectedSauces, setSelectedSauces, setSauceAmounts)}
	                          className="flex w-full items-center justify-between gap-3 text-left"
	                        >
	                          <span className="font-semibold" style={{ color: selected ? '#1e40af' : '#374151' }}>
	                            {sauce.name}
	                          </span>
	                          <span className="font-bold text-sm" style={{ color: selected ? '#2563eb' : '#6b7280' }}>
	                            +${sauce.price.toFixed(2)}
	                          </span>
	                        </button>
	                        {selected && (
	                          <div className="mt-2">
	                            {renderAmountSegment(
	                              sauceAmounts[sauce.id] ?? 'REGULAR',
	                              (amount) => setPortionAmount(sauce, amount, selectedSauces, setSelectedSauces, setSauceAmounts),
	                              'bg-blue-600 text-white shadow-sm',
	                            )}
	                          </div>
	                        )}
	                      </div>
	                    );
	                  })}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl p-5 shadow-sm h-full">
                {/* Tabs */}
                <div className="flex gap-3 mb-5">
                  <button
                    onClick={() => setActiveTab('flavors')}
                    className="px-6 py-3 rounded-xl font-bold text-base transition-all flex items-center gap-2"
                    style={{
                      backgroundColor: activeTab === 'flavors' ? '#ea580c' : '#f3f4f6',
                      color: activeTab === 'flavors' ? 'white' : '#4b5563',
                      boxShadow: activeTab === 'flavors' ? '0 4px 6px -1px rgba(234, 88, 12, 0.3)' : 'none'
                    }}
                  >
                    <span>🔥</span> Flavors
                    <span className="ml-1 text-sm px-2 py-0.5 rounded-full bg-white/30">
                      {flavors.length}/2
                    </span>
                    {flavors.length === 2 && (
                      <span className="text-xs font-normal">(+ $1.00)</span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('sides')}
                    className="px-6 py-3 rounded-xl font-bold text-base transition-all flex items-center gap-2"
                    style={{
                      backgroundColor: activeTab === 'sides' ? '#16a34a' : '#f3f4f6',
                      color: activeTab === 'sides' ? 'white' : '#4b5563',
                      boxShadow: activeTab === 'sides' ? '0 4px 6px -1px rgba(22, 163, 74, 0.3)' : 'none'
                    }}
                  >
                    <span>🍟</span> Sides
                    {selectedSides.length > 0 && (
                      <span className="ml-1 text-sm px-2 py-0.5 rounded-full bg-white/30">
                        {selectedSides.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('extras')}
                    className="px-6 py-3 rounded-xl font-bold text-base transition-all flex items-center gap-2"
                    style={{
                      backgroundColor: activeTab === 'extras' ? '#7c3aed' : '#f3f4f6',
                      color: activeTab === 'extras' ? 'white' : '#4b5563',
                      boxShadow: activeTab === 'extras' ? '0 4px 6px -1px rgba(124, 58, 237, 0.3)' : 'none'
                    }}
                  >
                    <span>✨</span> Extras
                    {selectedExtras.length > 0 && (
                      <span className="ml-1 text-sm px-2 py-0.5 rounded-full bg-white/30">
                        {selectedExtras.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Content */}
                {activeTab === 'flavors' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {FLAVOR_OPTIONS.map((flavor) => {
                      const selected = flavors.includes(flavor.id);
                      const colors = getHeatColor(flavor.heat);
                      return (
                        <button
                          key={flavor.id}
                          onClick={() => toggleFlavor(flavor.id)}
                          className="p-4 rounded-xl border-2 text-left transition-all hover:shadow-md"
                          style={{
                            borderColor: selected ? colors.border : '#e5e7eb',
                            backgroundColor: selected ? colors.bg : 'white',
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-base" style={{ color: selected ? colors.text : '#374151' }}>
                              {flavor.name}
                            </span>
                            <span className="text-lg">{getHeatEmoji(flavor.heat)}</span>
                          </div>
                          <p className="text-sm" style={{ color: selected ? colors.text : '#6b7280' }}>
                            {flavor.description}
                          </p>
                          {selected && (
                            <div className="mt-2">
                              {renderAmountSegment(
                                flavorAmounts[flavor.id] ?? 'REGULAR',
                                (amount) => setFlavorAmount(flavor.id, amount),
                              )}
                            </div>
                          )}
                          {selected && (
                            <div className="mt-2 text-sm font-bold" style={{ color: colors.text }}>
                              ✓ Selected
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {activeTab === 'sides' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {SIDE_OPTIONS.map((side) => (
                      <button
                        key={side.id}
                        onClick={() => toggleSelection(side, selectedSides, setSelectedSides)}
                        className="p-4 rounded-xl border-2 text-left transition-all hover:shadow-md"
                        style={{
                          borderColor: selectedSides.find((s) => s.id === side.id) ? '#16a34a' : '#e5e7eb',
                          backgroundColor: selectedSides.find((s) => s.id === side.id) ? '#f0fdf4' : 'white',
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-base" style={{ 
                            color: selectedSides.find((s) => s.id === side.id) ? '#166534' : '#374151' 
                          }}>
                            {side.name}
                          </span>
                          {selectedSides.find((s) => s.id === side.id) && (
                            <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold">✓</span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-green-600">+${side.price.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                )}

                {activeTab === 'extras' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {EXTRAS.map((extra) => (
                      <button
                        key={extra.id}
                        onClick={() => toggleSelection(extra, selectedExtras, setSelectedExtras)}
                        className="p-4 rounded-xl border-2 text-left transition-all hover:shadow-md"
                        style={{
                          borderColor: selectedExtras.find((e) => e.id === extra.id) ? '#7c3aed' : '#e5e7eb',
                          backgroundColor: selectedExtras.find((e) => e.id === extra.id) ? '#f5f3ff' : 'white',
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-base" style={{ 
                            color: selectedExtras.find((e) => e.id === extra.id) ? '#5b21b6' : '#374151' 
                          }}>
                            {extra.name}
                          </span>
                          {selectedExtras.find((e) => e.id === extra.id) && (
                            <span className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold">✓</span>
                          )}
                        </div>
                        {extra.price > 0 && (
                          <span className="text-sm font-bold text-purple-600">+${extra.price.toFixed(2)}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Notes */}
                <div className="mt-6">
                  <label className="block text-base font-bold text-gray-900 mb-2">
                    📝 Special Instructions
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 text-base"
                    rows={3}
                    placeholder="Any special requests? (e.g., extra crispy, sauce on side, etc.)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t px-6 py-4 shrink-0">
          <div className="mb-4 flex flex-wrap gap-2">
            {flavors.map((f) => (
              <span key={f} className="px-3 py-1.5 rounded-full text-sm font-bold bg-orange-100 text-orange-700 border-2 border-orange-400 flex items-center gap-2">
                {formatFixingName(FLAVOR_OPTIONS.find((fo) => fo.id === f)?.name || f, flavorAmounts[f])}
                <button onClick={() => toggleFlavor(f)}><X size={14} /></button>
              </span>
            ))}
            {selectedSides.map((s) => (
              <span key={s.id} className="px-3 py-1.5 rounded-full text-sm font-bold bg-green-100 text-green-700 border-2 border-green-400 flex items-center gap-2">
                {s.name}
                <button onClick={() => toggleSelection(s, selectedSides, setSelectedSides)}><X size={14} /></button>
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
                  {size.pieceCount} pieces • {flavors.length} flavor{flavors.length > 1 ? 's' : ''}
                </div>
                <div className="text-3xl font-black text-orange-600">${totalPrice.toFixed(2)}</div>
              </div>
              <button
                onClick={handleAdd}
                disabled={flavors.length === 0}
                className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default WingsMenu;
