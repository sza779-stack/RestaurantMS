import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ChevronRight, ShoppingCart, Star, Flame, Info, Plus, Minus, ArrowLeft } from 'lucide-react';
import { getFoodImage } from '../utils/foodImages';

interface ComboCustomizerModalProps {
  combo: any;
  onAdd: (configuredCombo: any) => void;
  onCancel: () => void;
}

const ComboCustomizerModal: React.FC<ComboCustomizerModalProps> = ({ combo, onAdd, onCancel }) => {
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isConfiguringItem, setIsConfiguringItem] = useState(false);
  const [currentItemToConfig, setCurrentItemToConfig] = useState<any>(null);
  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    // Initialize with default items
    const initial = combo.items.map((item: any) => ({
      ...item,
      selectedProduct: item.isProductFixed ? item.product : null,
      customization: {
        toppings: [] as any[],
        sauce: null as any,
        size: null as any,
      },
      priceAdjustment: 0,
    }));
    setSelectedItems(initial);
  }, [combo]);

  useEffect(() => {
    const current = selectedItems[activeStep];
    if (current && !current.isProductFixed && current.categoryId) {
      loadCategoryProducts(current.categoryId);
    }
  }, [activeStep, selectedItems]);

  const loadCategoryProducts = async (categoryId: string) => {
    setIsLoadingProducts(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/menu/products?categoryId=${categoryId}`);
      const data = await response.json();
      setCategoryProducts(data || []);
    } catch (error) {
      console.error('Failed to load products', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleProductSelect = (product: any) => {
    const updated = [...selectedItems];
    updated[activeStep] = {
      ...updated[activeStep],
      selectedProduct: product,
      name: product.name,
      customization: {
        toppings: [],
        sauce: null,
        size: null,
      },
      priceAdjustment: 0,
    };
    setSelectedItems(updated);
    
    if (updated[activeStep].allowCustomization) {
      setCurrentItemToConfig(updated[activeStep]);
      setIsConfiguringItem(true);
    } else {
      handleNext();
    }
  };

  const handleToppingToggle = (topping: any) => {
    if (!currentItemToConfig) return;

    const currentToppings = currentItemToConfig.customization.toppings || [];
    const exists = currentToppings.find((t: any) => t.id === topping.id);
    
    let newToppings;
    if (exists) {
      newToppings = currentToppings.filter((t: any) => t.id !== topping.id);
    } else {
      newToppings = [...currentToppings, topping];
    }

    // Calculate price adjustment for this item
    // Free toppings limit check
    const freeLimit = currentItemToConfig.maxIncludedToppings || 0;
    
    // Sort toppings by price descending and take the ones after the free limit
    const sortedToppings = [...newToppings].sort((a, b) => b.price - a.price);
    const extraToppings = sortedToppings.slice(freeLimit);
    const adjustment = extraToppings.reduce((sum, t) => sum + t.price, 0);

    const updatedItem = {
      ...currentItemToConfig,
      customization: {
        ...currentItemToConfig.customization,
        toppings: newToppings
      },
      priceAdjustment: adjustment
    };

    setCurrentItemToConfig(updatedItem);
    
    // Update main state
    const updatedItems = [...selectedItems];
    updatedItems[activeStep] = updatedItem;
    setSelectedItems(updatedItems);
  };

  const handleNext = () => {
    if (activeStep < selectedItems.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const calculateTotalPrice = () => {
    let total = Number(combo.basePrice);
    selectedItems.forEach(item => {
      total += (item.priceAdjustment || 0);
    });
    return total * quantity;
  };

  const handleComplete = () => {
    const configuredCombo = {
      id: `combo-${combo.id}-${Date.now()}`,
      name: combo.name,
      price: calculateTotalPrice() / quantity,
      quantity,
      image: combo.imageUrl || '🎁',
      description: combo.description,
      isCombo: true,
      modifiers: selectedItems.map(item => {
        const toppingsStr = item.customization?.toppings?.map((t: any) => t.name).join(', ');
        return `${item.name}${toppingsStr ? `: ${toppingsStr}` : ''}`;
      }),
      items: selectedItems.map(item => ({
        productId: item.selectedProduct?.id,
        productName: item.selectedProduct?.name,
        quantity: item.quantity,
        customization: item.customization,
      })),
    };
    onAdd(configuredCombo);
  };

  const currentItem = selectedItems[activeStep];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 pt-24">
      <div className="bg-slate-900 border border-white/10 rounded-[20px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Star className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{combo.name}</h2>
              <p className="text-slate-400 text-sm">Step {activeStep + 1} of {selectedItems.length}: {currentItem?.name || 'Selection'}</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Step Progress */}
        <div className="flex px-6 py-2 gap-1 bg-slate-950/30">
          {selectedItems.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                idx === activeStep ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 
                idx < activeStep ? 'bg-purple-500/40' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!currentItem ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {currentItem.isProductFixed ? (
                <div className="bg-slate-800/50 rounded-lg p-8 border border-white/5 text-center">
                  <div className="w-32 h-32 mx-auto mb-6 bg-slate-700 rounded-lg flex items-center justify-center text-4xl shadow-2xl overflow-hidden border-2 border-purple-500/20">
                    {currentItem.selectedProduct?.imageUrl ? (
                      <img 
                        src={currentItem.selectedProduct.imageUrl} 
                        alt={currentItem.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop';
                        }}
                      />
                    ) : (
                      <div className="bg-gradient-to-br from-slate-700 to-slate-800 w-full h-full flex items-center justify-center">
                        <Flame className="w-12 h-12 text-purple-500/50" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{currentItem.name}</h3>
                  <p className="text-slate-400 mb-6 max-w-md mx-auto">This item is included. {currentItem.allowCustomization ? 'You can customize it below.' : 'Click next to continue.'}</p>
                  
                  <div className="flex justify-center gap-4">
                    {currentItem.allowCustomization ? (
                      <button 
                        onClick={() => {
                          setCurrentItemToConfig(currentItem);
                          setIsConfiguringItem(true);
                        }}
                        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2"
                      >
                        Customize {currentItem.name}
                        <ChevronRight size={18} />
                      </button>
                    ) : (
                      <button 
                        onClick={handleNext}
                        className="px-8 py-3 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600 transition-all flex items-center gap-2"
                      >
                        Next Item
                        <ChevronRight size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="col-span-full mb-4">
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                      <Flame className="text-orange-500 w-5 h-5" />
                      {currentItem.productGroupLabel || 'Choose your selection'}
                    </h4>
                    <p className="text-sm text-slate-400">Select one option from the list below.</p>
                  </div>
                  
                  {isLoadingProducts ? (
                    <div className="col-span-full py-12 flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    </div>
                  ) : categoryProducts.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-500 italic">
                      No products available in this category.
                    </div>
                  ) : (
                    categoryProducts.map(product => (
                      <button
                        key={product.id}
                        onClick={() => handleProductSelect(product)}
                        className={`group bg-slate-800/40 hover:bg-slate-800 border p-4 rounded-lg transition-all text-left relative overflow-hidden ${
                          currentItem.selectedProduct?.id === product.id ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10' : 'border-white/5'
                        }`}
                      >
                        <div className="h-40 bg-slate-700 rounded-xl mb-3 flex items-center justify-center text-3xl group-hover:scale-105 transition-transform overflow-hidden relative shadow-inner">
	                          <img
	                            src={getFoodImage(product)}
	                            alt={product.name}
	                            className="w-full h-full object-cover"
	                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/pepperoni.png'; }}
	                          />
                        </div>
                        <h4 className="font-bold text-white group-hover:text-purple-400 transition-colors truncate">{product.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-medium">{product.category?.name || 'Category'}</p>
                        
                        {currentItem.selectedProduct?.id === product.id && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle size={20} className="text-purple-500 fill-purple-500/20" />
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-2 border border-white/5">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="w-6 text-center font-bold text-white">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-600 text-white hover:bg-purple-500 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Total Combo Price</p>
              <p className="text-2xl font-black text-white">${calculateTotalPrice().toFixed(2)}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleBack}
              disabled={activeStep === 0}
              className="px-6 py-3 border border-white/10 text-slate-400 rounded-xl font-bold hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Back
            </button>
            <button 
              onClick={activeStep === selectedItems.length - 1 && (currentItem?.selectedProduct || currentItem?.isProductFixed) ? handleComplete : handleNext}
              disabled={!currentItem?.selectedProduct && !currentItem?.isProductFixed}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-purple-500/25 transition-all flex items-center gap-2"
            >
              {activeStep === selectedItems.length - 1 ? 'Add to Cart' : 'Next Step'}
              {activeStep === selectedItems.length - 1 ? <ShoppingCart size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Internal Item Customization Modal (Nested) */}
      {isConfiguringItem && currentItemToConfig && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pt-24">
          <div className="bg-slate-900 border border-purple-500/30 rounded-[25px] w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.2)]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-slate-900 to-purple-900/20">
              <div className="flex items-center gap-4">
                <button onClick={() => setIsConfiguringItem(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-400">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h3 className="text-xl font-bold text-white">Customize {currentItemToConfig.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase ${
                      currentItemToConfig.maxIncludedToppings > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {currentItemToConfig.maxIncludedToppings > 0 ? `${currentItemToConfig.maxIncludedToppings} Free Toppings` : 'No Free Toppings'}
                    </span>
                    {currentItemToConfig.maxIncludedToppings > 0 && (
                      <span className="text-[10px] text-slate-500">Additional toppings will be charged at their menu price.</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Extra Charges</p>
                <p className="text-2xl font-black text-white">${currentItemToConfig.priceAdjustment.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="p-6 max-h-[55vh] overflow-y-auto custom-scrollbar">
               {currentItemToConfig.selectedProduct?.addonSets?.length > 0 ? (
                 <div className="space-y-8">
                   {currentItemToConfig.selectedProduct.addonSets.map((pas: any) => (
                     <div key={pas.addonSet.id} className="space-y-4">
                       <div className="flex items-center justify-between border-b border-white/5 pb-2">
                         <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                           <div className="w-1 h-4 bg-purple-500 rounded-full" />
                           {pas.addonSet.name}
                         </h4>
                         {pas.addonSet.maxSelect > 0 && (
                           <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-mono">
                             Choose up to {pas.addonSet.maxSelect}
                           </span>
                         )}
                       </div>
                       <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                         {pas.addonSet.addons.map((aa: any) => {
                           const addon = aa.addon;
                           const isSelected = currentItemToConfig.customization?.toppings?.some((st: any) => st.id === addon.id);
                           const setSelections = currentItemToConfig.customization?.toppings?.filter((st: any) => 
                             pas.addonSet.addons.some((pa: any) => pa.addonId === st.id)
                           );
                           const canSelect = !pas.addonSet.maxSelect || setSelections.length < pas.addonSet.maxSelect;

                           return (
                             <button 
                               key={addon.id}
                               disabled={!isSelected && !canSelect}
                               onClick={() => handleToppingToggle({
                                 id: addon.id,
                                 name: addon.name,
                                 price: Number(addon.price || 0),
                                 setId: pas.addonSet.id
                                })}
                                className={`flex flex-col p-3 rounded-xl transition-all border relative group ${
                                  isSelected ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/20' : 
                                  (!canSelect && !isSelected ? 'opacity-30 cursor-not-allowed bg-slate-800/20 border-white/5' : 'bg-slate-800/40 border-white/5 text-slate-300 hover:border-white/10 hover:bg-slate-800/60')
                                }`}
                              >
                                <div className="flex items-center justify-between w-full mb-1">
                                  <p className="font-bold text-xs truncate">{addon.name}</p>
                                  {isSelected && <CheckCircle size={14} className="text-white" />}
                                </div>
                                <div className="flex items-center justify-between w-full">
                                  <p className={`text-[10px] ${isSelected ? 'text-purple-200' : 'text-slate-500'}`}>
                                    {Number(addon.price) > 0 ? `+$${Number(addon.price).toFixed(2)}` : 'FREE'}
                                  </p>
                                  {!isSelected && canSelect && <Plus size={12} className="text-slate-600 group-hover:text-purple-400 transition-colors" />}
                                </div>
                             </button>
                           );
                         })}
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-600 ring-8 ring-slate-800/20">
                      <Info size={40} />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">No Modifiers Available</h4>
                    <p className="text-slate-400 max-w-xs mx-auto">This item doesn't have any customization options configured in the menu.</p>
                 </div>
               )}
            </div>

            <div className="p-6 border-t border-white/10 flex items-center justify-between bg-slate-900/80 backdrop-blur-xl">
               <div className="space-y-1">
                 <p className="text-xs font-bold text-white">
                   Selected: {currentItemToConfig.customization?.toppings?.length || 0} items
                 </p>
                 <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                   {currentItemToConfig.maxIncludedToppings > 0 ? 
                    `${Math.min(currentItemToConfig.customization?.toppings?.length || 0, currentItemToConfig.maxIncludedToppings)} free, ${Math.max(0, (currentItemToConfig.customization?.toppings?.length || 0) - (currentItemToConfig.maxIncludedToppings || 0))} extra charges` : 
                    'All items charged at menu price'}
                 </p>
               </div>
               <div className="flex gap-3">
                 <button 
                  onClick={() => {
                    const updatedItem = {
                      ...currentItemToConfig,
                      customization: { toppings: [], sauce: null, size: null },
                      priceAdjustment: 0
                    };
                    setCurrentItemToConfig(updatedItem);
                    const updatedItems = [...selectedItems];
                    updatedItems[activeStep] = updatedItem;
                    setSelectedItems(updatedItems);
                  }}
                  className="px-6 py-2 text-slate-500 hover:text-red-400 font-bold transition-colors text-sm"
                 >
                   Reset All
                 </button>
                 <button 
                  onClick={() => setIsConfiguringItem(false)}
                  className="px-10 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-all shadow-xl shadow-white/5 active:scale-95"
                 >
                   Confirm Selection
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComboCustomizerModal;
