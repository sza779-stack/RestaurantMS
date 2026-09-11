import React from 'react';
import { Pizza, ShoppingCart, User, Moon, Sun, Menu, X, Rocket, ArrowRight, Shield, Zap, Heart, Gift } from 'lucide-react';
import Footer from '../components/Footer';

interface LandingPageProps {
  setView: (view: any) => void;
  customer: any;
  itemCount: number;
  total: number;
  storeId: string;
  setStoreId: (id: string) => void;
  storeOptions: any[];
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  theme: string;
  toggleTheme: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({
  setView,
  customer,
  itemCount,
  total,
  storeId,
  setStoreId,
  storeOptions,
  isMenuOpen,
  setIsMenuOpen,
  theme,
  toggleTheme
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl blur-lg opacity-50 animate-pulse-glow" />
                <div className="relative w-10 h-10 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl flex items-center justify-center">
                  <Pizza className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <span className="text-lg font-bold premium-text neon-glow">
                  Future Pizza
                </span>
                <p className="text-[10px] text-cyan-400 -mt-1 font-mono tracking-widest uppercase">Next Gen Dining</p>
              </div>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {['Menu', 'Rewards', 'Track', 'About'].map((item) => (
                <button 
                  key={item}
                  onClick={() => setView((item === 'Track' ? 'orders' : item.toLowerCase()))}
                  className="px-4 py-2 text-gray-300 hover:text-white font-medium rounded-lg hover:bg-white/5 transition-all"
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="hidden md:block rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-purple-500/50"
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
                className="p-2 rounded-xl glass-panel text-gray-400 hover:text-white transition-all hover:scale-110 active:scale-95"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-400" />}
              </button>

              <button 
                onClick={() => setView('account')}
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <User className="w-5 h-5" />
                <span className="font-medium text-sm">{customer ? customer.name : 'Sign In'}</span>
              </button>

              <button 
                onClick={() => setView('cart')}
                className="relative bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:from-purple-500 hover:to-cyan-500 transition-all shadow-lg shadow-purple-500/25"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="font-medium">${total.toFixed(0)}</span>
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-pink-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>

              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-white"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-white/10">
            <div className="px-4 py-2 space-y-1">
              {['Menu', 'Rewards', 'Track', 'About'].map((item) => (
                <button 
                  key={item}
                  onClick={() => { setView((item === 'Track' ? 'orders' : item.toLowerCase())); setIsMenuOpen(false); }}
                  className="block w-full text-left px-3 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 md:pt-20 overflow-hidden flex-1 flex items-end">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/40 via-slate-950 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-900/30 via-slate-950 to-slate-950" />
        
        {/* Animated Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />
        
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 lg:py-5">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-stretch">
            <div className="h-full flex flex-col justify-between">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-full text-sm mb-4">
                <Rocket className="w-4 h-4 text-cyan-400" />
                <span className="text-gray-300">AI-Powered Kitchen • Quantum Fast Delivery</span>
              </div>

              {/* Headline */}
              <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                <span className="premium-text neon-glow">
                  Future of
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent italic">
                  Pizza Dining
                </span>
              </h1>

              <p className="text-xl text-gray-400 mb-8 max-w-xl leading-relaxed">
                Hand-crafted artisan pizzas made with precision robotics. 
                Delivered to your door in under 30 minutes using quantum routing technology.
              </p>

              {/* Featured Asset - Hero Image */}
              <div className="relative group perspective-1000 mb-8 mt-auto hidden lg:block">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative glass-card rounded-lg overflow-hidden transform group-hover:rotate-y-12 group-hover:scale-105 transition-all duration-700">
                  <img 
                    src="/images/pepperoni.png" 
                    alt="Futuristic Pizza" 
                    className="w-full h-64 object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <p className="text-xs font-bold text-cyan-400 tracking-widest uppercase mb-1">Current Signature</p>
                    <h4 className="text-lg font-bold text-white">The Cyber-Supreme</h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Right CTA cards */}
            <div className="relative h-full rounded-[1.6rem] border border-white/10 bg-slate-900/40 p-4 backdrop-blur-sm flex flex-col">
              <button
                onClick={() => setView('menu')}
                className="w-full rounded-[1.3rem] bg-gradient-to-r from-orange-500 to-rose-500 p-4 text-left text-white transition-transform hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold">Start Ordering</p>
                    <h3 className="mt-1 text-3xl md:text-4xl font-black">Order as Guest</h3>
                    <p className="mt-1 text-sm md:text-base text-orange-100">Quick checkout, no account needed</p>
                  </div>
                  <span className="hidden h-14 w-14 items-center justify-center rounded-lg bg-white/20 md:flex">
                    <ArrowRight className="h-7 w-7" />
                  </span>
                </div>
              </button>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 flex-1">
                <button
                  onClick={() => setView('account')}
                  className="rounded-lg border border-white/10 bg-slate-800/70 p-4 text-left transition-colors hover:bg-slate-800"
                >
                  <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20">
                    <User className="h-6 w-6 text-blue-300" />
                  </div>
                  <h4 className="text-2xl font-bold text-white">Sign In</h4>
                  <p className="mt-1 text-sm md:text-base text-gray-400">For returning customers</p>
                </button>

                <button
                  onClick={() => setView('rewards')}
                  className="rounded-lg border border-white/10 bg-slate-800/70 p-4 text-left transition-colors hover:bg-slate-800"
                >
                  <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20">
                    <Gift className="h-6 w-6 text-emerald-300" />
                  </div>
                  <h4 className="text-2xl font-bold text-white">Join & Save</h4>
                  <p className="mt-1 text-sm md:text-base text-gray-400">Get 20% off first order</p>
                </button>
              </div>

              <div className="mt-4 pt-1 flex flex-wrap gap-x-5 gap-y-2 text-gray-400">
                <div className="flex items-center gap-2 text-sm md:text-base">
                  <Shield className="h-5 w-5" />
                  <span>Secure Checkout</span>
                </div>
                <div className="flex items-center gap-2 text-sm md:text-base">
                  <Zap className="h-5 w-5" />
                  <span>Fast Service</span>
                </div>
                <div className="flex items-center gap-2 text-sm md:text-base">
                  <Heart className="h-5 w-5" />
                  <span>Made Fresh</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="mt-auto">
        <Footer onNavigate={(view) => setView(view)} />
      </div>

    </div>
  );
};

export default LandingPage;

