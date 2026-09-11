import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Plus, Edit2, Trash2, Loader2, ArrowRight, Search, X, Layers, ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../../services/api';

interface AddOn {
  id: string;
  name: string;
  price: number;
  type?: string;
  category?: string;
}

interface SetAddOn {
  addonId: string;
  addon: AddOn;
  displayOrder: number;
  priceOverride: number | null;
}

interface ProductLink {
  productId: string;
  product: {
    id: string;
    name: string;
    category?: { id: string; name: string } | null;
  };
}

interface AddOnSet {
  id: string;
  name: string;
  description: string | null;
  pricingRule: 'FLAT_FEE' | 'PER_ITEM_PRICE' | 'TIER_BASED';
  applicableItemTypes: string[];
  minSelect: number;
  maxSelect: number | null;
  isActive: boolean;
  addons: SetAddOn[];
  products?: ProductLink[];
}

interface Props {
  storeId: string;
}

const ModifiersTab: React.FC<Props> = ({ storeId }) => {
  const [sets, setSets] = useState<AddOnSet[]>([]);
  const [allAddons, setAllAddons] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSet, setEditingSet] = useState<AddOnSet | null>(null);
  const [addonSearch, setAddonSearch] = useState('');
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickAddon, setQuickAddon] = useState({ name: '', price: '', type: 'TOPPING', category: 'REGULAR' });
  const [creatingAddon, setCreatingAddon] = useState(false);

  const [form, setForm] = useState<any>({
    name: '',
    description: '',
    pricingRule: 'PER_ITEM_PRICE',
    applicableItemTypes: [],
    minSelect: 0,
    maxSelect: null,
    isActive: true,
    addons: [],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [setsRes, addonsRes] = await Promise.all([
        api.addons.getSets(storeId),
        api.addons.getAll(storeId),
      ]);
      setSets(setsRes.data);
      setAllAddons(addonsRes.data);
    } catch (error) {
      toast.error('Failed to load modifier groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [storeId]);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    const basePayload = {
      name: form.name,
      description: form.description || undefined,
      pricingRule: form.pricingRule,
      minSelect: form.minSelect || 0,
      maxSelect: form.maxSelect || undefined,
      applicableItemTypes: form.applicableItemTypes || [],
      isActive: form.isActive !== undefined ? form.isActive : true,
      addons: (form.addons || []).map((a: any) => ({
        addonId: a.addonId,
        displayOrder: a.displayOrder || 0,
        priceOverride: a.priceOverride ?? undefined,
      })),
    };
    try {
      if (editingSet) {
        await api.addons.updateSet(editingSet.id, basePayload);
      } else {
        await api.addons.createSet({ ...basePayload, storeId });
      }
      toast.success(editingSet ? 'Modifier group updated' : 'Modifier group created');
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      const msg = error?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to save modifier group');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this modifier group?')) return;
    try {
      await api.addons.deleteSet(id);
      toast.success('Modifier group deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete modifier group');
    }
  };

  const toggleAddonInSet = (addonId: string) => {
    const exists = form.addons.find((a: any) => a.addonId === addonId);
    if (exists) {
      setForm({ ...form, addons: form.addons.filter((a: any) => a.addonId !== addonId) });
    } else {
      setForm({
        ...form,
        addons: [...form.addons, { addonId, displayOrder: form.addons.length, priceOverride: null }],
      });
    }
  };

  const handleQuickCreate = async () => {
    if (!quickAddon.name.trim()) {
      toast.error('Add-on name is required');
      return;
    }
    try {
      setCreatingAddon(true);
      const res = await api.addons.create({
        storeId,
        name: quickAddon.name.trim(),
        price: parseFloat(quickAddon.price) || 0,
        type: quickAddon.type,
        category: quickAddon.category,
      });
      const newAddon = res.data;
      setAllAddons(prev => [...prev, newAddon]);
      // Auto-select the newly created add-on
      setForm((prev: any) => ({
        ...prev,
        addons: [...prev.addons, { addonId: newAddon.id, displayOrder: prev.addons.length, priceOverride: null }],
      }));
      toast.success(`"${newAddon.name}" created and added!`);
      setQuickAddon({ name: '', price: '', type: 'TOPPING', category: 'REGULAR' });
      setShowQuickCreate(false);
    } catch (error) {
      toast.error('Failed to create add-on');
    } finally {
      setCreatingAddon(false);
    }
  };

  const getSelectionType = (set: AddOnSet) => {
    if (set.maxSelect === 1) return 'SINGLE SELECT';
    return 'MULTI SELECT';
  };

  const getAppliedTo = (set: AddOnSet) => {
    // First check if the set is linked to specific products
    if (set.products && set.products.length > 0) {
      const categoryNames = [...new Set(
        set.products
          .map(p => p.product?.category?.name)
          .filter(Boolean)
      )];
      if (categoryNames.length > 0) {
        return categoryNames.join(', ');
      }
      return set.products.map(p => p.product?.name).filter(Boolean).join(', ');
    }
    
    // Fall back to applicableItemTypes
    if (set.applicableItemTypes && set.applicableItemTypes.length > 0) {
      const typeMap: Record<string, string> = {
        PIZZA: 'Pizza',
        STANDALONE: 'All Items',
        WINGS: 'Wings',
        PASTA: 'Pasta',
        SUB: 'Subs',
        SALAD: 'Salads',
        SIDE: 'Sides',
        DRINK: 'Drinks',
        DESSERT: 'Desserts',
        RICE_PLATTER: 'Rice Platters',
        GYRO: 'Gyro',
      };
      return set.applicableItemTypes.map(t => typeMap[t] || t).join(', ');
    }
    return 'All Items';
  };

  const openCreateModal = () => {
    setEditingSet(null);
    setAddonSearch('');
    setForm({
      name: '',
      description: '',
      pricingRule: 'PER_ITEM_PRICE',
      applicableItemTypes: [],
      minSelect: 0,
      maxSelect: null,
      isActive: true,
      addons: [],
    });
    setShowModal(true);
  };

  const openEditModal = (set: AddOnSet) => {
    setEditingSet(set);
    setAddonSearch('');
    setForm({
      ...set,
      addons: set.addons.map(a => ({
        addonId: a.addonId,
        displayOrder: a.displayOrder,
        priceOverride: a.priceOverride,
      })),
    });
    setShowModal(true);
  };

  const filteredAddons = allAddons.filter(a =>
    a.name.toLowerCase().includes(addonSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add button */}
      <div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-bold shadow-lg shadow-orange-600/20"
        >
          <Plus size={18} />
          Add Modifier Group
        </button>
      </div>

      {/* Modifier Group Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sets.map((set) => (
          <div
            key={set.id}
            className="bg-[#1a1f3a] rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-white text-base">{set.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Applied to: {getAppliedTo(set)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(set)}
                  className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={() => handleDelete(set.id)}
                  className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-all"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Show linked add-ons preview */}
            {set.addons.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {set.addons.slice(0, 4).map(a => (
                  <span key={a.addonId} className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-gray-300 border border-white/5">
                    {a.addon?.name}
                  </span>
                ))}
                {set.addons.length > 4 && (
                  <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-gray-500 italic border border-white/5">
                    +{set.addons.length - 4} more
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <span
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                  getSelectionType(set) === 'SINGLE SELECT'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}
              >
                {getSelectionType(set)}
              </span>
              <span className="text-xs text-gray-400">
                {set.addons.length} options
              </span>
            </div>
          </div>
        ))}
      </div>

      {sets.length === 0 && (
        <div className="text-center py-16 bg-[#1a1f3a] rounded-2xl border border-white/5">
          <Layers size={48} className="mx-auto text-gray-500 mb-4" />
          <p className="text-gray-400 font-medium">No modifier groups yet</p>
          <p className="text-gray-500 text-sm mt-1">
            Create modifier groups like "Crust Type", "Sauce", "Meat Toppings", "Veggie Toppings" etc.
          </p>
          <p className="text-gray-500 text-xs mt-3 max-w-md mx-auto">
            Each group contains options (add-ons) that customers can choose from. 
            For example, a "Crust Type" group might have "Hand Tossed" and "Thin Crust" as options.
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-[5px] w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 rounded-t-[5px]">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 leading-tight">
                    {editingSet ? 'Edit Modifier Group' : 'New Modifier Group'}
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {editingSet 
                      ? 'Update this group\'s name, selection rules, and options.'
                      : 'Create a modifier group (e.g. "Crust Type", "Sauce", "Meat Toppings") and add options to it.'
                    }
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="text-gray-400" size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left Column - Group Settings */}
                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[12px] font-black uppercase text-gray-700">
                      Group Name
                    </label>
                    <input
                      required
                      placeholder="e.g. Crust Type, Sauce, Meat Toppings, Veggie Toppings"
                      type="text"
                      className="w-full px-5 py-3 border-2 border-gray-100 rounded-[5px] focus:border-orange-300 focus:ring-4 focus:ring-orange-100 outline-none transition-all text-lg font-semibold text-gray-900"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      💡 POS matches groups by name: use "Crust", "Sauce", "Cheese", "Meat", "Veggie", or "Premium" in the name for automatic pizza builder integration.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] font-black uppercase text-gray-700">
                      Description (optional)
                    </label>
                    <textarea
                      placeholder="Brief internal note about this group..."
                      className="w-full px-5 py-3 border-2 border-gray-100 rounded-[5px] outline-none min-h-[60px] text-gray-900"
                      value={form.description || ''}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[12px] font-black uppercase text-gray-700">
                      Selection Rules
                    </label>
                    <div className="bg-gray-50 rounded-[5px] p-5 space-y-5">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-900">Selection Type</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, maxSelect: 1 })}
                            className={`px-4 py-3 rounded-[5px] border-2 text-sm font-bold transition-all ${
                              form.maxSelect === 1
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
                            }`}
                          >
                            <div>SINGLE SELECT</div>
                            <div className="text-[10px] font-normal mt-0.5 text-gray-500">Pick one option only</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, maxSelect: null })}
                            className={`px-4 py-3 rounded-[5px] border-2 text-sm font-bold transition-all ${
                              form.maxSelect !== 1
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
                            }`}
                          >
                            <div>MULTI SELECT</div>
                            <div className="text-[10px] font-normal mt-0.5 text-gray-500">Pick multiple options</div>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-900">Pricing</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['PER_ITEM_PRICE', 'FLAT_FEE'].map((rule) => (
                            <button
                              key={rule}
                              type="button"
                              onClick={() => setForm({ ...form, pricingRule: rule })}
                              className={`px-4 py-2 rounded-[5px] border-2 text-xs font-bold transition-all ${
                                form.pricingRule === rule
                                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                                  : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
                              }`}
                            >
                              {rule === 'PER_ITEM_PRICE' ? 'Per Item' : 'Flat Fee'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {form.maxSelect !== 1 && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700">Min Selections</label>
                            <input
                              type="number"
                              className="w-full px-4 py-2 border-2 border-gray-100 rounded-[5px] outline-none text-gray-900"
                              value={form.minSelect}
                              onChange={(e) =>
                                setForm({ ...form, minSelect: parseInt(e.target.value) || 0 })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700">Max Selections</label>
                            <input
                              type="number"
                              placeholder="Unlimited"
                              className="w-full px-4 py-2 border-2 border-gray-100 rounded-[5px] outline-none text-gray-900"
                              value={form.maxSelect || ''}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  maxSelect: e.target.value ? parseInt(e.target.value) : null,
                                })
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-black uppercase text-gray-700">
                      Applied To (Product Types)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['PIZZA', 'WINGS', 'PASTA', 'SUB', 'SALAD', 'SIDE', 'STANDALONE'].map(
                        (type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              const current = form.applicableItemTypes || [];
                              const updated = current.includes(type)
                                ? current.filter((t: string) => t !== type)
                                : [...current, type];
                              setForm({ ...form, applicableItemTypes: updated });
                            }}
                            className={`px-3 py-1.5 rounded-[5px] text-xs font-bold transition-all ${
                              (form.applicableItemTypes || []).includes(type)
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {type}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Select Add-Ons (Options) */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[12px] font-black uppercase text-gray-700">
                      Select Options (Add-Ons)
                    </label>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-3">
                    Pick existing add-ons or create new ones below.
                  </p>

                  {/* Quick Create Add-On */}
                  {!showQuickCreate ? (
                    <button
                      type="button"
                      onClick={() => setShowQuickCreate(true)}
                      className="mb-3 flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-[5px] hover:bg-green-700 transition-all text-xs font-bold shadow-md shadow-green-600/20 w-full justify-center"
                    >
                      <Plus size={16} />
                      Quick Create New Add-On
                    </button>
                  ) : (
                    <div className="mb-3 bg-green-50 border-2 border-green-200 rounded-[5px] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-green-700">New Add-On</span>
                        <button type="button" onClick={() => setShowQuickCreate(false)} className="text-gray-400 hover:text-gray-600">
                          <X size={16} />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Name (e.g. Pepperoni, Hand Tossed, Mushrooms)"
                        className="w-full px-3 py-2 border border-green-200 rounded-[5px] text-sm outline-none focus:border-green-400 text-gray-900"
                        value={quickAddon.name}
                        onChange={(e) => setQuickAddon({ ...quickAddon, name: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Price (e.g. 1.50)"
                          className="px-3 py-2 border border-green-200 rounded-[5px] text-sm outline-none focus:border-green-400"
                          value={quickAddon.price}
                          onChange={(e) => setQuickAddon({ ...quickAddon, price: e.target.value })}
                        />
                        <select
                          className="px-3 py-2 border border-green-200 rounded-[5px] text-sm outline-none bg-white focus:border-green-400"
                          value={quickAddon.type}
                          onChange={(e) => setQuickAddon({ ...quickAddon, type: e.target.value })}
                        >
                          <option value="TOPPING">Topping</option>
                          <option value="SAUCE">Sauce</option>
                          <option value="CHEESE">Cheese</option>
                          <option value="CRUST">Crust</option>
                          <option value="SIZE">Size</option>
                          <option value="EXTRA">Extra</option>
                          <option value="SIDE">Side</option>
                          <option value="DRINK">Drink</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <select
                          className="flex-1 px-3 py-2 border border-green-200 rounded-[5px] text-sm outline-none bg-white focus:border-green-400"
                          value={quickAddon.category}
                          onChange={(e) => setQuickAddon({ ...quickAddon, category: e.target.value })}
                        >
                          <option value="REGULAR">Regular</option>
                          <option value="PREMIUM">Premium</option>
                          <option value="FREE">Free</option>
                        </select>
                        <button
                          type="button"
                          onClick={handleQuickCreate}
                          disabled={creatingAddon || !quickAddon.name.trim()}
                          className="flex-1 py-2 bg-green-600 text-white rounded-[5px] text-xs font-bold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          {creatingAddon ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                          {creatingAddon ? 'Creating...' : 'Create & Add'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-[5px] p-5 flex-1 flex flex-col">
                    <div className="relative mb-3">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={16}
                      />
                      <input
                        type="text"
                        placeholder="Search add-ons..."
                        className="w-full pl-10 pr-4 py-2 bg-white rounded-[5px] text-sm border-none outline-none shadow-sm"
                        value={addonSearch}
                        onChange={(e) => setAddonSearch(e.target.value)}
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 pr-2 max-h-[350px]">
                      {filteredAddons.length === 0 && (
                        <div className="text-center py-6 text-gray-400 text-sm">
                          <p className="font-medium">No add-ons found</p>
                          <p className="text-xs mt-1">Click "Quick Create New Add-On" above to create one.</p>
                        </div>
                      )}
                      {filteredAddons.map((addon) => {
                        const isSelected = form.addons.find(
                          (a: any) => a.addonId === addon.id
                        );
                        return (
                          <button
                            key={addon.id}
                            type="button"
                            onClick={() => toggleAddonInSet(addon.id)}
                            aria-pressed={Boolean(isSelected)}
                            title={isSelected ? `Remove ${addon.name} from this modifier group` : `Add ${addon.name} to this modifier group`}
                            className={`group relative w-full overflow-hidden rounded-xl border-2 p-3 text-left transition-all ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-950 shadow-sm shadow-emerald-500/10'
                                : 'border-gray-200 bg-white text-gray-900 hover:border-orange-300 hover:bg-orange-50/40'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="break-words text-sm font-black leading-tight">{addon.name}</p>
                                  {isSelected && (
                                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase text-white">
                                      Selected
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  <p className={`text-[11px] font-bold ${isSelected ? 'text-emerald-700' : 'text-gray-600'}`}>
                                    ${Number(addon.price).toFixed(2)}
                                  </p>
                                  {addon.type && (
                                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                                      isSelected ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                      {addon.type}
                                    </span>
                                  )}
                                  <span className={`text-[10px] font-semibold ${isSelected ? 'text-emerald-700' : 'text-gray-400'}`}>
                                    {isSelected ? 'Click anywhere to deselect' : 'Click anywhere to select'}
                                  </span>
                                </div>
                              </div>
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                                  isSelected
                                    ? 'border-emerald-600 bg-emerald-600 text-white'
                                    : 'border-gray-300 bg-white text-gray-500 group-hover:border-orange-400 group-hover:text-orange-500'
                                }`}
                              >
                                {isSelected ? <Check size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={2.5} />}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3 p-3 bg-white rounded-[5px] flex items-center justify-between shadow-sm">
                      <p className="text-sm font-bold text-gray-700">
                        {form.addons.length} option{form.addons.length !== 1 ? 's' : ''} selected
                      </p>
                      {form.addons.length > 0 && (
                        <span className="text-xs text-green-600 font-medium">✓ Ready</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-gray-100 flex gap-4 bg-gray-50/50 rounded-b-[5px]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 border-2 border-gray-200 text-gray-600 rounded-[5px] hover:bg-white transition-all font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-[2] py-4 bg-orange-600 text-white rounded-[5px] hover:bg-orange-700 transition-all font-black text-lg shadow-xl shadow-orange-600/20 flex items-center justify-center gap-2"
                >
                  {editingSet ? 'Save Changes' : 'Create Group'}
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

export default ModifiersTab;
