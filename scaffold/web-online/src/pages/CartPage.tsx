import React from 'react';
import { ArrowRight } from 'lucide-react';

interface CartPageProps {
  setView: (view: any) => void;
  storeId: string;
  setStoreId: (id: string) => void;
  storeOptions: any[];
  cart: any[];
  updateQuantity: (id: string, delta: number) => void;
  cartTotal: number;
  tax: number;
  total: number;
  itemCount: number;
  customer: any;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  theme: string;
  toggleTheme: () => void;
}

const CartPage: React.FC<CartPageProps> = ({
  setView,
  storeId,
  setStoreId,
  storeOptions,
  cart,
  updateQuantity,
  cartTotal,
  tax,
  total,
  itemCount,
  customer,
  isMenuOpen,
  setIsMenuOpen,
  theme,
  toggleTheme
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        {cart.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-gray-400 mb-4">Your cart is empty</p>
            <button 
              onClick={() => setView('menu')} 
              className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {cart.map(item => (
                <div key={item.id} className="bg-slate-900/60 border border-white/10 rounded-lg p-4 flex items-center gap-4">
                  {item.image && (item.image.startsWith('/') || item.image.startsWith('http')) ? (
                    <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <span className="text-4xl">{item.image || '🍽️'}</span>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{item.name}</h3>
                    <p className="text-cyan-400 font-medium">${item.price}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)} 
                      className="w-9 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)} 
                      className="w-9 h-9 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 rounded-full flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-slate-900/60 border border-white/10 rounded-lg p-6">
              <div className="flex justify-between mb-2 text-gray-300">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2 text-gray-300">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white text-xl font-bold pt-3 border-t border-white/10">
                <span>Total</span>
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">${total.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => setView('checkout')}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white py-4 rounded-lg font-bold mt-6 hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              Checkout
            </button>
          </>
        )}
      </div>

    </div>
  );
};

export default CartPage;

