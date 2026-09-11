import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Settings, Utensils, Grid, Tag, Eye, Gift, Plus, Search, Sparkles, X, DollarSign, Clock, Package, BookOpen } from 'lucide-react';
import { api } from '../../../services/api';
import { useStore } from '../../../hooks/useStore';
import { toast } from 'sonner';
import ProductsTab from './tabs/ProductsTab';
import CategoriesTab from './tabs/CategoriesTab';
import ModifiersTab from './tabs/ModifiersTab';
import CombosTab from './tabs/CombosTab';
import DippingSaucesTab from './tabs/DippingSaucesTab';
import InstructionsTab from './tabs/InstructionsTab';

const MENU_GROUP_SETTINGS_KEY = 'pos-menu-group-config:v1';
const MENU_GROUPS = [
  { id: 'fastFood', label: 'Fast Food', description: 'Pizza, pasta, subs, wings, sides, drinks, dessert, combos' },
  { id: 'desi', label: 'Desi / Indian / Pakistani', description: 'Biryani, karahi, handi, curries, tandoor and desi specials' },
  { id: 'gyro', label: 'Gyro', description: 'Gyro and rice platter focused items' },
] as const;

type MenuGroupId = (typeof MENU_GROUPS)[number]['id'];
type MenuGroupState = Record<MenuGroupId, boolean>;
const DEFAULT_MENU_GROUP_STATE: MenuGroupState = {
  fastFood: true,
  desi: true,
  gyro: true,
};

const MenuManagement: React.FC = () => {
  const { currentStore } = useStore();
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'modifiers' | 'combos' | 'dipping' | 'instructions'>('products');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [stores, setStores] = useState<any[]>([]);
  const [menuGroupState, setMenuGroupState] = useState<MenuGroupState>(DEFAULT_MENU_GROUP_STATE);
  const [showMenuSettingsModal, setShowMenuSettingsModal] = useState(false);
  const [combos, setCombos] = useState<any[]>([]);

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (!selectedStoreId && currentStore?.id) {
      setSelectedStoreId(currentStore.id);
      setStores((prev) => (
        prev.some((store) => store.id === currentStore.id)
          ? prev
          : [...prev, currentStore]
      ));
    }
  }, [currentStore, selectedStoreId]);

  const loadStores = async () => {
    try {
      const response = await api.stores.getAll();
      setStores(response.data || []);
      if (response.data?.length > 0 && !selectedStoreId) {
        const activeStoreInList = response.data.find((store: any) => store.id === currentStore?.id);
        setSelectedStoreId(activeStoreInList?.id || response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load stores:', error);
      if (currentStore?.id) {
        setSelectedStoreId(currentStore.id);
        setStores((prev) => (
          prev.some((store) => store.id === currentStore.id)
            ? prev
            : [...prev, currentStore]
        ));
      }
    }
  };

  useEffect(() => {
    if (selectedStoreId) {
      loadCombos();
      loadMenuGroupSettings();
    }
  }, [selectedStoreId]);

  const loadCombos = async () => {
    try {
      const response = await api.combos.getAll({ storeId: selectedStoreId });
      setCombos(response.data || []);
    } catch (error) {}
  };

  const loadMenuGroupSettings = () => {
    try {
      const raw = localStorage.getItem(MENU_GROUP_SETTINGS_KEY);
      if (!raw) {
        setMenuGroupState(DEFAULT_MENU_GROUP_STATE);
        return;
      }
      const parsed = JSON.parse(raw) as Record<string, Partial<MenuGroupState>>;
      const storeConfig = parsed[selectedStoreId] || {};
      setMenuGroupState({
        fastFood: storeConfig.fastFood ?? true,
        desi: storeConfig.desi ?? true,
        gyro: storeConfig.gyro ?? true,
      });
    } catch {
      setMenuGroupState(DEFAULT_MENU_GROUP_STATE);
    }
  };

  const saveMenuGroupSettings = () => {
    if (!selectedStoreId) {
      toast.error('Please select a store first');
      return false;
    }
    try {
      const raw = localStorage.getItem(MENU_GROUP_SETTINGS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[selectedStoreId] = menuGroupState;
      localStorage.setItem(MENU_GROUP_SETTINGS_KEY, JSON.stringify(parsed));
      window.dispatchEvent(new Event('pos-menu-groups-updated'));
      toast.success('Menu visibility saved for POS');
      return true;
    } catch {
      toast.error('Failed to save visibility settings');
      return false;
    }
  };

  return (
    <div className="p-6 h-[calc(100vh-80px)] overflow-y-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
            <p className="text-gray-500 mt-1">Manage products, categories, modifiers, and combos</p>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value="">Select Store</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
            <button 
              onClick={() => setShowMenuSettingsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings size={18} />
              Menu Settings
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Restaurant Menu Groups for POS</h2>
            <p className="text-sm text-gray-500">Select which cuisine groups appear on POS for the selected store.</p>
          </div>
          <button
            onClick={saveMenuGroupSettings}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
          >
            Save POS Menu Visibility
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MENU_GROUPS.map((group) => (
            <label key={group.id} className="border border-gray-100 rounded-lg p-3 flex items-start gap-3 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 mt-0.5 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                checked={menuGroupState[group.id]}
                onChange={(e) =>
                  setMenuGroupState((prev) => ({ ...prev, [group.id]: e.target.checked }))
                }
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">{group.label}</p>
                <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{group.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-orange-200 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Products</p>
              <p className="text-2xl font-black text-gray-900">86</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-xl text-orange-600"><Utensils size={24} /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-blue-200 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Categories</p>
              <p className="text-2xl font-black text-gray-900">7</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Grid size={24} /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-green-200 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Combos</p>
              <p className="text-2xl font-black text-green-600">{combos.filter(c => c.isActive).length}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl text-green-600"><Eye size={24} /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-purple-200 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Combos</p>
              <p className="text-2xl font-black text-purple-600">{combos.length}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><Gift size={24} /></div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl flex flex-col shadow-lg overflow-hidden min-h-[600px]">
        <div className="border-b border-gray-700/50 flex overflow-x-auto bg-gray-800/50">
          {[
            { id: 'products', label: 'Products', icon: Utensils },
            { id: 'categories', label: 'Categories', icon: Grid },
            { id: 'modifiers', label: 'Modifiers', icon: Gift },
            { id: 'combos', label: 'Combos', icon: Tag },
            { id: 'dipping', label: 'Dipping Sauces', icon: Gift },
            { id: 'instructions', label: 'Instructions', icon: BookOpen },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3.5 text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all mx-1 my-1.5 rounded-lg ${
                activeTab === tab.id
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-6">
          {!selectedStoreId ? (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <Sparkles size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">Please select a store to manage its menu ecosystem.</p>
            </div>
          ) : (
            <>
              { activeTab === 'products' && <ProductsTab storeId={selectedStoreId} />}
              { activeTab === 'categories' && <CategoriesTab storeId={selectedStoreId} />}
              { activeTab === 'modifiers' && <ModifiersTab storeId={selectedStoreId} />}
              { activeTab === 'combos' && <CombosTab storeId={selectedStoreId} />}
              { activeTab === 'dipping' && <DippingSaucesTab storeId={selectedStoreId} />}
              { activeTab === 'instructions' && <InstructionsTab />}
            </>
          )}
        </div>
      </div>

      {showMenuSettingsModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-6 backdrop-blur-sm" style={{ margin: 0, top: 0, left: 0 }}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Menu Ecosystem Settings</h2>
              <button onClick={() => setShowMenuSettingsModal(false)} className="p-2 hover:bg-gray-200 rounded-xl transition-all"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <h3 className="font-bold text-gray-900">Online Ordering</h3>
                    <p className="text-xs text-gray-500">Allow customers to order from web/app</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-orange-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
	                    <h3 className="font-bold text-gray-900">Walk-in Screens</h3>
	                    <p className="text-xs text-gray-500">Use online ordering on in-store customer screens</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-orange-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <h3 className="font-bold text-gray-900">Price Visibility</h3>
                    <p className="text-xs text-gray-500">Display item prices on menu boards</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-orange-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-3 uppercase text-xs tracking-widest text-gray-400">Tax Infrastructure</h3>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                    <DollarSign size={20} className="text-orange-600" />
                    <input type="number" defaultValue={8.5} step="0.1" className="w-20 px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold" />
                    <span className="text-sm font-bold text-gray-600">% Sales Tax</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <button 
                onClick={() => setShowMenuSettingsModal(false)}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl"
              >
                Apply & Synchronize
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MenuManagement;
