import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Plus, Edit2, Trash2, Loader2, ArrowRight, Settings2, Layers, Search } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../../services/api';

interface AddOn {
  id: string;
  name: string;
  price: number;
}

interface SetAddOn {
  addonId: string;
  addon: AddOn;
  displayOrder: number;
  priceOverride: number | null;
}

interface AddOnSet {
  id: string;
  name: string;
  description: string | null;
  pricingRule: 'FLAT_FEE' | 'PER_ITEM_PRICE' | 'TIER_BASED';
  minSelect: number;
  maxSelect: number | null;
  isActive: boolean;
  addons: SetAddOn[];
}

interface Props { 
  storeId: string; 
}

const AddOnSetsTab: React.FC<Props> = ({ storeId }) => {
  const [sets, setSets] = useState<AddOnSet[]>([]);
  const [allAddons, setAllAddons] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSet, setEditingSet] = useState<AddOnSet | null>(null);
  
  const [form, setForm] = useState<any>({
    name: '',
    description: '',
    pricingRule: 'PER_ITEM_PRICE',
    minSelect: 0,
    maxSelect: null,
    isActive: true,
    addons: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [setsRes, addonsRes] = await Promise.all([
        api.addons.getSets(storeId),
        api.addons.getAll(storeId)
      ]);
      
      setSets(setsRes.data);
      setAllAddons(addonsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [storeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSet) {
        await api.addons.updateSet(editingSet.id, { ...form, storeId });
      } else {
        await api.addons.createSet({ ...form, storeId });
      }
      
      toast.success(editingSet ? 'Set updated' : 'Set created');
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to save set');
    }
  };

  const toggleAddonInSet = (addonId: string) => {
    const exists = form.addons.find((a: any) => a.addonId === addonId);
    if (exists) {
      setForm({ ...form, addons: form.addons.filter((a: any) => a.addonId !== addonId) });
    } else {
      setForm({ 
        ...form, 
        addons: [...form.addons, { addonId, displayOrder: form.addons.length, priceOverride: null }] 
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Add-On Sets</h2>
          <p className="text-sm text-gray-500">Group individual add-ons into customizable sets for your products.</p>
        </div>
        <button
          onClick={() => {
            setEditingSet(null);
            setForm({
              name: '',
              description: '',
              pricingRule: 'PER_ITEM_PRICE',
              minSelect: 0,
              maxSelect: null,
              isActive: true,
              addons: []
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <Plus size={20} />
          Create Set
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sets.map((set) => (
          <div key={set.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-primary/50 transition-all group shadow-sm hover:shadow-md">
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Layers size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{set.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm font-medium text-primary bg-primary/5 px-2 py-0.5 rounded">
                      {set.pricingRule.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-sm text-gray-500">
                      Limits: {set.minSelect} - {set.maxSelect || '∞'} choices
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 max-w-md hidden lg:block">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Included Add-Ons ({set.addons.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {set.addons.slice(0, 5).map(a => (
                    <span key={a.addonId} className="px-2 py-1 bg-gray-50 border border-gray-100 rounded text-xs text-gray-600">
                      {a.addon?.name}
                    </span>
                  ))}
                  {set.addons.length > 5 && (
                    <span className="px-2 py-1 bg-gray-50 border border-gray-100 rounded text-xs text-gray-400 italic">
                      +{set.addons.length - 5} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  onClick={() => {
                    setEditingSet(set);
                    setForm({
                      ...set,
                      addons: set.addons.map(a => ({
                        addonId: a.addonId,
                        displayOrder: a.displayOrder,
                        priceOverride: a.priceOverride
                      }))
                    });
                    setShowModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-all font-medium"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-red-500 hover:border-red-200 transition-all shadow-sm"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
              <div>
                <h2 className="text-2xl font-black text-gray-900 leading-tight">
                  {editingSet ? 'Customize Set' : 'New Add-On Set'}
                </h2>
                <p className="text-gray-500 text-sm mt-1">Configure logic, pricing, and item selection.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <Plus className="rotate-45 text-gray-400" size={32} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
              <form className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[12px] font-black uppercase text-gray-400">Set Identity</label>
                  <input
                    required
                    placeholder="e.g. Meat Lovers Toppings"
                    type="text"
                    className="w-full px-5 py-3 border-2 border-gray-100 rounded-2xl focus:border-primary/30 focus:ring-4 focus:ring-primary/5 outline-none transition-all text-lg font-semibold"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  <textarea
                    placeholder="Brief description for internal use..."
                    className="w-full px-5 py-3 border-2 border-gray-100 rounded-2xl outline-none mt-3 min-h-[100px]"
                    value={form.description || ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[12px] font-black uppercase text-gray-400">Business Rules</label>
                  <div className="bg-gray-50 rounded-2xl p-6 space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Pricing Engine</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['PER_ITEM_PRICE', 'FLAT_FEE'].map(rule => (
                          <button
                            key={rule}
                            type="button"
                            onClick={() => setForm({ ...form, pricingRule: rule })}
                            className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all ${
                              form.pricingRule === rule 
                                ? 'border-primary bg-primary/5 text-primary' 
                                : 'border-white bg-white text-gray-400 hover:border-gray-200'
                            }`}
                          >
                            {rule.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">Min Choices</label>
                        <input
                          type="number"
                          className="w-full px-4 py-2 border-2 border-gray-100 rounded-xl outline-none"
                          value={form.minSelect}
                          onChange={(e) => setForm({ ...form, minSelect: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">Max Choices</label>
                        <input
                          type="number"
                          placeholder="Unlimited"
                          className="w-full px-4 py-2 border-2 border-gray-100 rounded-xl outline-none"
                          value={form.maxSelect || ''}
                          onChange={(e) => setForm({ ...form, maxSelect: e.target.value ? parseInt(e.target.value) : null })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </form>

              <div className="flex flex-col">
                <label className="text-[12px] font-black uppercase text-gray-400 mb-4">Select Items</label>
                <div className="bg-gray-50 rounded-3xl p-6 flex-1 flex flex-col">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search toppings..."
                      className="w-full pl-10 pr-4 py-2 bg-white rounded-xl text-sm border-none outline-none shadow-sm"
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1 pr-2">
                    {allAddons.map(addon => {
                      const isSelected = form.addons.find((a: any) => a.addonId === addon.id);
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => toggleAddonInSet(addon.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                            isSelected 
                              ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                              : 'bg-white hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <div className="text-left">
                            <p className="font-bold text-sm">{addon.name}</p>
                            <p className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                              ${Number(addon.price).toFixed(2)}
                            </p>
                          </div>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                            isSelected ? 'bg-white text-primary border-white' : 'border-gray-200'
                          }`}>
                            {isSelected ? <ArrowRight size={14} /> : <Plus size={14} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-6 p-4 bg-white rounded-2xl flex items-center justify-between shadow-sm">
                    <p className="text-sm font-bold text-gray-500">{form.addons.length} Items Selected</p>
                    <Settings2 size={18} className="text-gray-300" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-gray-100 flex gap-4 bg-gray-50/50">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-4 border-2 border-gray-200 text-gray-600 rounded-2xl hover:bg-white transition-all font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-[2] py-4 bg-primary text-white rounded-2xl hover:bg-primary/90 transition-all font-black text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
              >
                {editingSet ? 'Save Changes' : 'Launch Set'}
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AddOnSetsTab;
