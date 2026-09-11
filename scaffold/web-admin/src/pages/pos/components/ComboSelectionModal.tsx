import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X } from 'lucide-react';

interface ComboSelectionModalProps {
  combo: any;
  onAdd: (comboData: any) => void;
  onCancel: () => void;
}

const ComboSelectionModal: React.FC<ComboSelectionModalProps> = ({ combo, onAdd, onCancel }) => {
  const [comboPaidExtras, setComboPaidExtras] = useState<Record<string, {
    comboItemId: string;
    modifierId: string;
    optionId: string;
    name: string;
    price: number;
  }>>({});

  useEffect(() => {
    setComboPaidExtras({});
  }, [combo?.id]);

  const toggleComboPaidExtra = useCallback((
    comboItemId: string,
    modifierId: string,
    optionId: string,
    name: string,
    price: number,
  ) => {
    const key = `${comboItemId}:${modifierId}:${optionId}`;
    setComboPaidExtras((prev) => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return {
        ...prev,
        [key]: { comboItemId, modifierId, optionId, name, price },
      };
    });
  }, []);

  const comboExtrasTotal = useMemo(
    () => Object.values(comboPaidExtras).reduce((sum, extra) => sum + Number(extra.price || 0), 0),
    [comboPaidExtras],
  );

  const handleAdd = () => {
    const selectedExtras = Object.values(comboPaidExtras);
    onAdd({
      ...combo,
      selectedExtras,
      totalPrice: Number(combo.basePrice) + comboExtrasTotal
    });
    setComboPaidExtras({});
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {combo.name}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {combo.description}
          </p>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 dark:text-white">Includes:</h3>
            {combo.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-semibold text-sm">
                  {item.quantity}x
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 dark:text-white">{item.name}</p>
                  {item.product?.name && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.product.name}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            <h3 className="font-semibold text-gray-800 dark:text-white">Paid Extras</h3>
            {combo.items?.map((item: any, idx: number) => {
              const comboItemId = item.id || `combo-item-${idx}`;
              const includedModifierIds = Array.isArray(item.includedModifierIds) ? item.includedModifierIds : [];
              const paidModifierGroups = (item.product?.modifiers || []).filter(
                (productModifier: any) => !includedModifierIds.includes(productModifier.modifier?.id),
              );

              if (paidModifierGroups.length === 0) {
                return null;
              }

              return (
                <div key={`extras-${comboItemId}`} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {item.name}
                  </p>
                  <div className="space-y-2">
                    {paidModifierGroups.map((productModifier: any) => (
                      <div key={productModifier.modifier?.id}>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                          {productModifier.modifier?.name}
                        </p>
                        <div className="grid grid-cols-1 gap-1.5">
                          {(productModifier.modifier?.options || []).map((option: any) => {
                            const optionKey = `${comboItemId}:${productModifier.modifier?.id}:${option.id}`;
                            const checked = Boolean(comboPaidExtras[optionKey]);
                            return (
                              <label
                                key={option.id}
                                className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                              >
                                <span className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                      toggleComboPaidExtra(
                                        comboItemId,
                                        productModifier.modifier?.id,
                                        option.id,
                                        `${item.name}: ${option.name}`,
                                        Number(option.priceAdjustment || 0),
                                      )
                                    }
                                  />
                                  {option.name}
                                </span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  +${Number(option.priceAdjustment || 0).toFixed(2)}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Combo Price</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${(Number(combo.basePrice) + comboExtrasTotal).toFixed(2)}
                </p>
                {comboExtrasTotal > 0 && (
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                    Includes paid extras: +${comboExtrasTotal.toFixed(2)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400 line-through">
                  ${Number(combo.retailValue).toFixed(2)}
                </p>
                <p className="text-sm text-green-600 font-medium">
                  Save ${(Number(combo.retailValue) - Number(combo.basePrice)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Add to Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComboSelectionModal;
