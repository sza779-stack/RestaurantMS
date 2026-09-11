import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Plus, Edit2, Trash2, Loader2, CheckCircle, X, DollarSign, Search, Package } from 'lucide-react';
import { api } from '../../../../services/api';
import { toast } from 'sonner';

interface Props { storeId: string; }

const DippingSaucesTab: React.FC<Props> = ({ storeId }) => {
  const [sauces, setSauces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dippingSaucesCategory, setDippingSaucesCategory] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingSauce, setEditingSauce] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    basePrice: '0.50',
    isActive: true
  });

  useEffect(() => {
    if (storeId) {
      initializeTab();
    }
  }, [storeId]);

  const initializeTab = async () => {
    setLoading(true);
    try {
      const categoriesRes = await api.menu.getCategories(storeId);
      let dsCategory = (categoriesRes.data || []).find((c: any) => c.name.toLowerCase() === 'dipping sauces');

      if (!dsCategory) {
        const createCatRes = await api.menu.createCategory({
          name: 'Dipping Sauces',
          description: 'Various dipping sauces and extra sides',
          icon: '🥣',
          color: '#f59e0b',
          isActive: true,
          storeId
        });
        const reFetchCat = await api.menu.getCategories(storeId);
        dsCategory = (reFetchCat.data || []).find((c: any) => c.name.toLowerCase() === 'dipping sauces');
      }

      setDippingSaucesCategory(dsCategory);
      if (dsCategory) {
        await loadSauces(dsCategory.id);
      }
    } catch (error) {
      toast.error('Failed to initialize Dipping Sauces tab');
    } finally {
      setLoading(false);
    }
  };

  const loadSauces = async (categoryId: string) => {
    try {
      const res = await api.menu.getProducts({ storeId });
      const allProducts = res.data || [];
      const dsProducts = allProducts.filter((p: any) => p.categoryId === categoryId || p.category?.name?.toLowerCase() === 'dipping sauces');
      setSauces(dsProducts);
    } catch (error) {
      toast.error('Failed to load sauces');
    }
  };

  const handleSaveSauce = async () => {
    if (!form.name || !form.basePrice || !dippingSaucesCategory) {
      toast.error('Name and price are required');
      return;
    }

    try {
      if (editingSauce) {
        await api.menu.updateProduct?.(editingSauce.id, {
          name: form.name,
          basePrice: parseFloat(form.basePrice),
          isActive: form.isActive
        });
        toast.success('Sauce updated');
      } else {
        await api.menu.createProduct({
          name: form.name,
          basePrice: parseFloat(form.basePrice),
          costPrice: 0,
          prepTimeMinutes: 1,
          categoryId: dippingSaucesCategory.id,
          storeId,
          isActive: form.isActive,
          imageUrl: '🥣'
        });
        toast.success('Dipping sauce added');
      }
      setShowModal(false);
      await loadSauces(dippingSaucesCategory.id);
    } catch (error) {
      toast.error('Failed to save sauce');
    }
  };

  const handleDeleteSauce = async (id: string) => {
    if (!confirm('Delete this dipping sauce?')) return;
    try {
      await api.menu.deleteProduct?.(id);
      toast.success('Sauce deleted');
      if (dippingSaucesCategory) await loadSauces(dippingSaucesCategory.id);
    } catch (error) {
      toast.error('Failed to delete sauce');
    }
  };

  const openAddModal = () => {
    setEditingSauce(null);
    setForm({ name: '', basePrice: '0.50', isActive: true });
    setShowModal(true);
  };

  const openEditModal = (sauce: any) => {
    setEditingSauce(sauce);
    setForm({
      name: sauce.name,
      basePrice: sauce.basePrice.toString(),
      isActive: sauce.isActive
    });
    setShowModal(true);
  };

  const filteredSauces = sauces.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-orange-600" size={32} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50/30">
      <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search sauces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50"
          />
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all shadow-md shadow-orange-100"
        >
          <Plus size={18} />
          Add Dipping Sauce
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {filteredSauces.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Sauces Found</h3>
            <p className="text-gray-500 mb-6">Start by adding your first dipping sauce for the POS.</p>
            <button 
              onClick={openAddModal}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 inline-flex items-center gap-2"
            >
              <Plus size={18} />
              Add First Sauce
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSauces.map((sauce) => (
              <div key={sauce.id} className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-xl transition-all group relative overflow-hidden">
                {!sauce.isActive && <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center font-bold text-gray-400 rotate-12 text-2xl pointer-events-none">INACTIVE</div>}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl shadow-inner uppercase font-bold text-orange-600">
                    {sauce.name.charAt(0)}
                  </div>
                  <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-20">
                    <button onClick={() => openEditModal(sauce)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-orange-600 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteSauce(sauce.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors truncate">{sauce.name}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-lg font-black text-gray-900">${Number(sauce.basePrice).toFixed(2)}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${sauce.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {sauce.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-6 backdrop-blur-sm" style={{ margin: 0, top: 0, left: 0 }}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                {editingSauce ? 'Modify Sauce' : 'Add Sauce'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-200 rounded-xl transition-all"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex gap-3">
                <div className="text-3xl animate-bounce">🥣</div>
                <p className="text-xs text-orange-900 font-medium leading-relaxed">
                  Dipping sauces are standard menu items with minimal prep time, automatically added to the correct category for quick POS access.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Sauce Description</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Honey Mustard"
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-800 shadow-inner"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Price ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600" size={20} />
                    <input
                      type="number"
                      step="0.01"
                      value={form.basePrice}
                      onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                      className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none transition-all font-black text-2xl text-gray-900 shadow-inner"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6 shadow-sm"></div>
                    </div>
                    <span className="text-sm font-black text-gray-700 uppercase tracking-tighter">Availability Status</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-4 text-gray-500 font-bold uppercase tracking-widest text-xs hover:text-gray-900 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleSaveSauce}
                className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-orange-200 hover:bg-orange-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                {editingSauce ? 'Update Settings' : 'Create Sauce'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DippingSaucesTab;
