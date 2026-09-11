import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Plus, Edit2, Trash2, Loader2, Search, Filter, Info } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../../services/api';

interface AddOn {
  id: string;
  name: string;
  type: 'TOPPING' | 'CRUST' | 'SAUCE' | 'DRESSING' | 'SIDE' | 'UNSPECIFIED';
  category: 'REGULAR' | 'PREMIUM';
  price: number;
  sizePrices?: Record<string, number>;
  measurementUnit: string;
  defaultQuantity: number;
  isActive: boolean;
  applicableItemTypes: string[];
}

interface Props { 
  storeId: string; 
}

const AddOnsTab: React.FC<Props> = ({ storeId }) => {
  const [addons, setAddons] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  
  const [showModal, setShowModal] = useState(false);
  const [editingAddon, setEditingAddon] = useState<AddOn | null>(null);
  const [form, setForm] = useState<Partial<AddOn>>({
    name: '',
    type: 'TOPPING',
    category: 'REGULAR',
    price: 0,
    sizePrices: {
      'SMALL': 0,
      'MEDIUM': 0,
      'LARGE': 0,
      'XL': 0
    },
    measurementUnit: 'PIECES',
    defaultQuantity: 1,
    isActive: true,
    applicableItemTypes: ['STANDALONE']
  });

  const fetchAddOns = async () => {
    try {
      setLoading(true);
      const res = await api.addons.getAll(storeId);
      setAddons(res.data);
    } catch (error) {
      toast.error('Failed to load add-ons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddOns();
  }, [storeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddon) {
        await api.addons.update(editingAddon.id, { ...form, storeId });
      } else {
        await api.addons.create({ ...form, storeId });
      }
      
      toast.success(editingAddon ? 'Add-on updated' : 'Add-on created');
      setShowModal(false);
      fetchAddOns();
    } catch (error) {
      toast.error('Failed to save add-on');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this add-on?')) return;
    try {
      await api.addons.delete(id);
      toast.success('Add-on deactivated');
      fetchAddOns();
    } catch (error) {
      toast.error('Failed to deactivate add-on');
    }
  };

  const filteredAddons = addons.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'ALL' || a.type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search add-ons..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-200 rounded-lg outline-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">All Types</option>
            <option value="TOPPING">Toppings</option>
            <option value="SAUCE">Sauces</option>
            <option value="CRUST">Crusts</option>
            <option value="DRESSING">Dressings</option>
          </select>
        </div>
        <button
          onClick={() => {
            setEditingAddon(null);
            setForm({
              name: '',
              type: 'TOPPING',
              category: 'REGULAR',
              price: 0,
              sizePrices: {
                'SMALL': 0,
                'MEDIUM': 0,
                'LARGE': 0,
                'XL': 0
              },
              measurementUnit: 'PIECES',
              defaultQuantity: 1,
              isActive: true,
              applicableItemTypes: ['STANDALONE']
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          New Add-On
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAddons.map((addon) => (
          <div key={addon.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-primary/50 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{addon.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    addon.category === 'PREMIUM' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {addon.category}
                  </span>
                  <span className="text-xs text-gray-500">{addon.type}</span>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setEditingAddon(addon);
                    setForm({
                      ...addon,
                      sizePrices: addon.sizePrices || {
                        'SMALL': 0,
                        'MEDIUM': 0,
                        'LARGE': 0,
                        'XL': 0
                      }
                    });
                    setShowModal(true);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(addon.id)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex items-end justify-between border-t border-gray-50 pt-4 mt-auto">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Pricing</p>
                <p className="text-lg font-bold text-gray-900">
                  ${Number(addon.price).toFixed(2)}
                  <span className="text-xs font-normal text-gray-500 ml-1">/{addon.measurementUnit.toLowerCase()}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Def. Qty</p>
                <p className="font-medium text-gray-700">{addon.defaultQuantity}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#1a1c2e] rounded-3xl w-full max-w-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
              <h2 className="text-2xl font-black text-white tracking-tight">
                {editingAddon ? 'Edit Add-On' : 'Create New Add-On'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all"
              >
                <Plus className="rotate-45" size={28} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase text-white/40 tracking-widest">Add-On Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Extra Cheese"
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
 
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase text-white/40 tracking-widest">Type</label>
                  <select
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                  >
                    <option value="TOPPING" className="bg-[#1a1c2e]">Topping</option>
                    <option value="SAUCE" className="bg-[#1a1c2e]">Sauce</option>
                    <option value="CRUST" className="bg-[#1a1c2e]">Crust</option>
                    <option value="DRESSING" className="bg-[#1a1c2e]">Dressing</option>
                    <option value="SIDE" className="bg-[#1a1c2e]">Side</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase text-white/40 tracking-widest">Category</label>
                  <select
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                  >
                    <option value="REGULAR" className="bg-[#1a1c2e]">Regular</option>
                    <option value="PREMIUM" className="bg-[#1a1c2e]">Premium</option>
                  </select>
                </div>
              </div>
 
              <div className="space-y-4 pt-4 border-t border-white/5">
                <label className="text-[11px] font-black uppercase text-blue-400 tracking-widest">Size-Based Pricing (Overrides Base Price)</label>
                <div className="grid grid-cols-2 gap-4">
                  {['SMALL', 'MEDIUM', 'LARGE', 'XL'].map((size) => (
                    <div key={size} className="space-y-2">
                      <label className="text-[10px] font-bold text-white/60">{size}</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                          value={form.sizePrices?.[size] || 0}
                          onChange={(e) => setForm({ 
                            ...form, 
                            sizePrices: { 
                              ...form.sizePrices, 
                              [size]: parseFloat(e.target.value) || 0 
                            } 
                          })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
 
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase text-white/40 tracking-widest">Base Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">$</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase text-white/40 tracking-widest">Unit</label>
                  <select
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                    value={form.measurementUnit}
                    onChange={(e) => setForm({ ...form, measurementUnit: e.target.value })}
                  >
                    <option value="PIECES" className="bg-[#1a1c2e]">Pieces</option>
                    <option value="OUNCES" className="bg-[#1a1c2e]">Ounces</option>
                    <option value="GRAMS" className="bg-[#1a1c2e]">Grams</option>
                    <option value="UNITS" className="bg-[#1a1c2e]">Units</option>
                  </select>
                </div>
              </div>
 
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <Info size={20} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-100/80 leading-relaxed font-medium">
                  This sets the master configuration. Size-specific prices will be used in POS if the product has matching sizes. You can still override pricing in **Add-On Sets**.
                </p>
              </div>
 
              <div className="flex gap-4 pt-6 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-4 border border-white/10 text-white/60 rounded-2xl font-bold hover:bg-white/5 hover:text-white transition-all shadow-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 active:scale-95 transition-all shadow-xl shadow-blue-500/20"
                >
                  {editingAddon ? 'Update' : 'Create'} Add-On
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AddOnsTab;
