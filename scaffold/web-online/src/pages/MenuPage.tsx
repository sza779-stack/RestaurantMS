import React from 'react';
import { Pizza, Sparkles, ChevronRight, Gift, CheckCircle, Flame, Moon, Sun, ShoppingCart } from 'lucide-react';
import Footer from '../components/Footer';
import ComboCustomizerModal from '../components/ComboCustomizerModalV2';
import { getFoodImage } from '../utils/foodImages';

interface MenuPageProps {
  setView: (view: any) => void;
  storeId: string;
  setStoreId: (id: string) => void;
  storeOptions: any[];
  itemCount: number;
  combos: any[];
  combosLoading: boolean;
  addToCart: (item: any) => void;
  showToast: (message: string, type: any) => void;
  FEATURED_ITEMS: any[];
  total: number;
  customer: any;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  theme: string;
  toggleTheme: () => void;
}

const MenuPage: React.FC<MenuPageProps> = ({
  setView,
  storeId,
  setStoreId,
  storeOptions,
  itemCount,
  combos,
  combosLoading,
  addToCart,
  showToast,
  FEATURED_ITEMS,
  total,
  customer,
  isMenuOpen,
  setIsMenuOpen,
  theme,
  toggleTheme
}) => {
  const [selectedCombo, setSelectedCombo] = React.useState<any>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Our Menu
          </h1>
          <p className="text-gray-400">Choose from our favorites or build your own creation</p>
        </div>
        
        {/* Build Your Own Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center border border-white/10">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Build Your Own</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Build Your Own Pizza */}
            <button
              onClick={() => setView('build-pizza')}
              className="group relative h-64 glass-card rounded-lg overflow-hidden text-left hover:border-purple-500/50 transition-all"
            >
              <img 
                src="/images/pepperoni.png" 
                className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all duration-700"
                alt="Custom Pizza"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="relative p-6 h-full flex flex-col justify-end">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-purple-500/25">
                  <Pizza className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-xl text-white mb-1">Custom Pizza</h3>
                <p className="text-gray-300 text-sm mb-3">Crust, sauce, cheese & endless toppings</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold premium-text">From $10.99</span>
                  <span className="text-cyan-400 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Build <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </button>

            {/* Build Your Own Sub */}
            <button
              onClick={() => setView('build-sub')}
              className="group relative h-64 glass-card rounded-lg overflow-hidden text-left hover:border-cyan-500/50 transition-all"
            >
              <img 
                src="/images/sub.png" 
                className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all duration-700"
                alt="Custom Sub"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="relative p-6 h-full flex flex-col justify-end">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-cyan-500/25">
                  <Pizza className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-xl text-white mb-1">Custom Sub</h3>
                <p className="text-gray-300 text-sm mb-3">Fresh bread, gourmet meats & crisp veggies</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold premium-text">From $7.99</span>
                  <span className="text-cyan-400 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Build <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </button>

            {/* Build Your Own Pasta */}
            <button
              onClick={() => setView('build-pasta')}
              className="group relative h-64 glass-card rounded-lg overflow-hidden text-left hover:border-amber-500/50 transition-all"
            >
              <img 
                src="/images/pasta.png" 
                className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all duration-700"
                alt="Custom Pasta"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="relative p-6 h-full flex flex-col justify-end">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-amber-500/25">
                  <Pizza className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-xl text-white mb-1">Custom Pasta</h3>
                <p className="text-gray-300 text-sm mb-3">Select your pasta, sauce & proteins</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold premium-text">From $10.99</span>
                  <span className="text-cyan-400 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Build <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>
        
        {/* Combo Meals Section */}
        {combos.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center border border-white/10">
                <Gift className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">Combo Deals</h2>
                <p className="text-gray-400 text-sm">Great value meal packages</p>
              </div>
              {combosLoading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
              )}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {combos.map((combo: any) => (
                <div key={combo.id} className="group relative bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-sm border border-purple-500/30 rounded-lg p-5 hover:border-purple-400/50 transition-all overflow-hidden">
                  {combo.isFeatured && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-amber-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Featured
                    </div>
                  )}
                  <div className="relative">
                    <div className="h-40 bg-gradient-to-br from-purple-800/50 to-pink-800/50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      {(() => {
                        if (!combo.imageUrl) return <span className="text-6xl">🎁</span>;
                        const imgUrl = getFoodImage({ ...combo, isCombo: true });
                        return (
                          <img 
                            src={imgUrl} 
                            alt={combo.name} 
                            className="w-full h-full object-cover rounded-xl"
                            onError={(e) => {
                              console.error('Combo image failed to load:', imgUrl);
                              const target = e.currentTarget.parentElement;
                              if (target) target.innerHTML = '<span class="text-6xl">🎁</span>';
                            }}
                          />
                        );
                      })()}
                    </div>
                    <h3 className="font-bold text-lg text-white mb-2">{combo.name}</h3>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {combo.description || `${combo.items?.length || 0} items included`}
                    </p>
                    <div className="space-y-2 mb-4">
                      {combo.items?.slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                          <CheckCircle className="w-4 h-4 text-purple-400" />
                          <span>{item.quantity}x {item.name}</span>
                        </div>
                      ))}
                      {combo.items?.length > 3 && (
                        <p className="text-sm text-purple-400">+{combo.items.length - 3} more items</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          ${Number(combo.basePrice).toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500 line-through ml-2">
                          ${Number(combo.retailValue).toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedCombo(combo)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/25 font-bold"
                      >
                        Customize
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {combos.length > 3 && (
              <div className="text-center mt-6">
                <button className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 mx-auto transition-colors">
                  View All {combos.length} Combos <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Combo Customizer Modal */}
        {selectedCombo && (
          <ComboCustomizerModal
            combo={selectedCombo}
            storeId={storeId}
            onAdd={(configuredCombo) => {
              addToCart(configuredCombo);
              setSelectedCombo(null);
              showToast(`${configuredCombo.name} added to cart!`, 'success');
            }}
            onCancel={() => setSelectedCombo(null)}
          />
        )}

        {/* Signature Pizzas Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center border border-white/10">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Signature Pizzas</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURED_ITEMS.map(item => (
              <div key={item.id} className="group relative glass-card p-4 hover:border-purple-500/30 transition-all overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/10 group-hover:to-cyan-600/10 transition-all duration-500" />
                <div className="relative">
                  <div className="h-40 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center overflow-hidden mb-4">
                    {item.image && (item.image.startsWith('http') || item.image.startsWith('/')) ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <span className="text-6xl group-hover:scale-110 transition-transform duration-500">{item.image}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-lg text-white">{item.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-yellow-400">
                      <CheckCircle className="w-3 h-3" />
                      <span>{item.rating || '4.5'}</span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2 h-10">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold premium-text">${item.price}</span>
                    <button 
                      onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, image: item.image })}
                      className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-4 py-2 rounded-xl hover:from-purple-500 hover:to-cyan-500 transition-all shadow-lg shadow-purple-500/25 font-bold"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <Footer onNavigate={(view) => setView(view)} />
    </div>
  );
};

export default MenuPage;
