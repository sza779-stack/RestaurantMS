import React, { useState } from 'react';
import { Plus, Minus, X, ShoppingCart } from 'lucide-react';

interface ModifierPanelProps {
  product: any;
  onAdd: (item: any) => void;
  onCancel: () => void;
}

// Category emoji mapping
const categoryEmojis: Record<string, string> = {
  'Biryani': '🍚',
  'Karahi': '🥘',
  'BBQ & Grill': '🔥',
  'Handi': '🍲',
  'Tandoor': '🫓',
  'Curries': '🥣',
  'Street Food': '🌮',
  'Desi Desserts': '🍮',
  'Desi Drinks': '🧉',
  'Pizza': '🍕',
  'Pasta': '🍝',
  'Subs': '🥪',
  'Wings': '🍗',
  'Sides': '🍟',
  'Drinks': '🥤',
  'Dessert': '🍰',
};

const ModifierPanel: React.FC<ModifierPanelProps> = ({
  product,
  onAdd,
  onCancel,
}) => {
  const [selectedSize, setSelectedSize] = useState<any>(
    product.sizes?.[0] || null
  );
  
  // Initialize selectedModifiers from configuration.default_ingredients if they exist
  const [selectedModifiers, setSelectedModifiers] = useState<any[]>(() => {
    const defaults = product.configuration?.default_ingredients || [];
    if (defaults.length === 0) return [];
    
    const initialSelections: any[] = [];
    product.modifiers?.forEach((modifierWrap: any) => {
      // Handle Prisma's associative model where `modifierWrap.modifier` might be the actual Modifier
      const actualModifier = modifierWrap.modifier || modifierWrap;
      actualModifier.options?.forEach((option: any) => {
        if (defaults.includes(option.id)) {
          initialSelections.push({
            modifierId: actualModifier.id,
            optionId: option.id,
            name: `${actualModifier.name}: ${option.name}`,
            price: 0, // Default ingredients are typically included in base price
            isDefault: true,
          });
        }
      });
    });
    return initialSelections;
  });

  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const toggleModifier = (modifier: any, option: any) => {
    setSelectedModifiers((prev) => {
      const exists = prev.find(
        (m) => m.modifierId === modifier.id && m.optionId === option.id
      );
      if (exists) {
        return prev.filter(
          (m) => !(m.modifierId === modifier.id && m.optionId === option.id)
        );
      }
      return [
        ...prev,
        {
          modifierId: modifier.id,
          optionId: option.id,
          name: `${modifier.name}: ${option.name}`,
          price: option.price,
        },
      ];
    });
  };

  const handleAdd = () => {
    const basePrice = Number(product.basePrice || 0);
    const sizePriceAdjustment = selectedSize?.priceAdjustment || 0;
    const unitPrice = basePrice + sizePriceAdjustment;
    
    onAdd({
      productId: product.id,
      productName: product.name,
      sizeId: selectedSize?.id,
      sizeName: selectedSize?.name,
      quantity,
      unitPrice,
      modifiers: selectedModifiers,
      notes,
      kitchenStation: product.kitchenStation || 'GENERAL',
    });
  };

  const calculateTotal = () => {
    const basePrice = Number(product.basePrice || 0);
    const sizePriceAdjustment = selectedSize?.priceAdjustment || 0;
    const modifiersTotal = selectedModifiers.reduce((sum, m) => sum + Number(m.price || 0), 0);
    return (basePrice + sizePriceAdjustment + modifiersTotal) * quantity;
  };

  const getEmoji = () => {
    const categoryName = product.category?.name || '';
    return categoryEmojis[categoryName] || '🍽️';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full m-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{getEmoji()}</span>
              <div>
                <h2 className="text-xl font-bold">{product.name}</h2>
                {product.category && (
                  <p className="text-blue-100 text-sm">{product.category.name}</p>
                )}
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          {product.description && (
            <p className="mt-3 text-blue-50/95 text-sm leading-relaxed bg-white/10 rounded-lg px-3 py-2">
              {product.description}
            </p>
          )}
          {product.isFallback && (
            <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold bg-amber-400/20 text-amber-100 border border-amber-300/40 rounded-full px-3 py-1">
              Demo Item
            </p>
          )}
        </div>

        <div className="p-6">
          {/* Size Selection */}
          {product.sizes?.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Select Size
              </label>
              <div className="grid grid-cols-2 gap-2">
                {product.sizes.map((size: any) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      selectedSize?.id === size.id
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    <div className={`font-semibold ${selectedSize?.id === size.id ? 'text-white' : 'text-gray-900'}`}>
                      {size.name || size.code || `Size ${product.sizes.indexOf(size) + 1}`}
                    </div>
                    <div className={`text-sm ${selectedSize?.id === size.id ? 'text-blue-100' : 'text-gray-700'}`}>
                      +${Number(size.priceAdjustment || 0).toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Modifiers */}
          {product.modifiers?.map((modifierWrap: any) => {
            const modifier = modifierWrap.modifier || modifierWrap;
            return (
            <div key={modifier.id} className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                {modifier.name}
                {modifier.type === 'SINGLE_SELECT' && (
                  <span className="text-gray-600 font-normal ml-1">(Select one)</span>
                )}
                {modifier.type === 'MULTI_SELECT' && (
                  <span className="text-gray-600 font-normal ml-1">(Select multiple)</span>
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                {modifier.options?.map((option: any) => {
                  const isSelected = selectedModifiers.some(
                    (m) =>
                      m.modifierId === modifier.id && m.optionId === option.id
                  );
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleModifier(modifier, option)}
                      className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900 hover:border-green-400 hover:bg-green-50'
                      }`}
                    >
                      {option.name}
                      {option.price > 0 && (
                        <span className={isSelected ? 'text-green-100' : 'text-gray-700'}>
                          {' '}+${Number(option.price).toFixed(2)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )})}

          {/* Special Instructions */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Special Instructions
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Extra spicy, no onions, etc."
              className="w-full px-4 py-3 border border-gray-300 bg-gray-50 text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder:text-gray-400"
              rows={3}
            />
          </div>

          {/* Quantity Selector */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 border border-blue-600 flex items-center justify-center transition-colors disabled:bg-gray-200 disabled:border-gray-200 disabled:cursor-not-allowed"
                disabled={quantity <= 1}
              >
                <Minus size={20} className={quantity <= 1 ? 'text-gray-400' : 'text-white'} />
              </button>
              <span className="min-w-[56px] text-center text-2xl font-bold text-gray-900 bg-blue-50 border border-blue-200 rounded-xl py-2 px-3">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 border border-blue-600 flex items-center justify-center transition-colors"
              >
                <Plus size={20} className="text-white" />
              </button>
            </div>
          </div>

          {/* Total and Add Button */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Price</p>
                <p className="text-3xl font-bold text-blue-600">
                  ${calculateTotal().toFixed(2)}
                </p>
              </div>
              {selectedModifiers.length > 0 && (
                <div className="text-right text-sm text-gray-500">
                  <p>{selectedModifiers.length} modifier(s)</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="flex-[2] py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg hover:shadow-xl"
              >
                <ShoppingCart size={20} />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModifierPanel;
