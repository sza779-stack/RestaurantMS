import React from 'react';
import { Pizza, Moon, Sun, ShoppingCart, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GlobalHeaderProps {
  storeId: string;
  setStoreId: (id: string) => void;
  storeOptions: any[];
  itemCount: number;
  theme: string;
  toggleTheme: () => void;
  customer?: any;
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  storeId,
  setStoreId,
  storeOptions,
  itemCount,
  theme,
  toggleTheme,
  customer
}) => {
  const navigate = useNavigate();

  return (
    <header className="bg-slate-950/80 backdrop-blur-xl border-b border-white/10 fixed top-0 w-full z-[100]">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl blur-lg opacity-50 animate-pulse-glow" />
            <div className="relative w-10 h-10 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl flex items-center justify-center">
              <Pizza className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="text-left">
            <span className="font-bold text-lg premium-text neon-glow block">Future Pizza</span>
            <p className="text-[10px] text-cyan-400 -mt-1 font-mono tracking-widest uppercase">Next Gen Dining</p>
          </div>
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {['Menu', 'Rewards', 'Track', 'About'].map((item) => (
            <button 
              key={item}
              onClick={() => navigate(item === 'Track' ? '/orders' : `/${item.toLowerCase()}`)}
              className="px-4 py-2 text-gray-300 hover:text-white font-medium rounded-lg hover:bg-white/5 transition-all"
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="hidden md:block rounded-xl glass-panel px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-purple-500/50 appearance-none bg-slate-900 border border-white/10"
          >
            {storeOptions.map((s) => (
              <option key={s.id} value={s.id} className="bg-slate-900">
                {s.name}
              </option>
            ))}
            {storeOptions.length === 0 ? <option value={storeId}>{storeId}</option> : null}
          </select>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl glass-panel text-gray-400 hover:text-white transition-all hover:scale-110 active:scale-95 bg-slate-800/50 border border-white/10"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-5 h-5 text-gray-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
          </button>

          <button 
            onClick={() => navigate('/account')}
            className="hidden sm:flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <User className="w-5 h-5" />
            <span className="font-medium text-sm">{customer ? customer.name : 'Sign In'}</span>
          </button>

          <button 
            onClick={() => navigate('/cart')} 
            className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-4 py-2 rounded-xl font-bold hover:from-purple-500 hover:to-cyan-500 transition-all shadow-lg shadow-purple-500/25 flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Cart ({itemCount})</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;
