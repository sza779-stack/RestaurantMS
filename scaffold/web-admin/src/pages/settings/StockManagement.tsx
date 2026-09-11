import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../hooks/useStore';
import { api } from '../../services/api';
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  ArrowRightLeft,
  Download,
  Barcode,
  Truck,
  X,
  Minus,
  QrCode,
  Check,
  History,
  RefreshCw,
  Edit,
  Trash2,
  MoreVertical,
  FolderOpen,
  Settings,
  Eye,
  Copy,
  Info,
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel?: number;
  unit: string;
  category: string;
  lastCost: number;
  trackInventory: boolean;
  isLowStock: boolean;
  stockPercentage: number;
  stockValue: number;
}

interface StockMovement {
  id: string;
  type: 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'WASTE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'INITIAL';
  quantity: number;
  notes?: string;
  createdAt: string;
  inventoryItem?: {
    name: string;
    sku: string;
    unit: string;
  };
  unitCost?: number;
  totalCost?: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: 'DRAFT' | 'SENT' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED';
  total: number;
  orderDate: string;
  vendor?: {
    name: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    receivedQty?: number;
    unitPrice: number;
    inventoryItemId: string;
  }>;
}

interface Vendor {
  id: string;
  name: string;
  code?: string;
  contactName?: string;
  phone?: string;
  email?: string;
}

interface StockStats {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalStockValue: number;
  categories: Array<{
    category: string;
    itemCount: number;
    totalStock: number;
  }>;
}

// Toast Types
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// Toast Components
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = 3000;

    const dismissTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, duration);

    return () => {
      clearTimeout(dismissTimer);
    };
  }, [toast.id, onDismiss]);

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-blue-500',
  };

  const icons = {
    success: <Check className="w-5 h-5" />,
    error: <X className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  return (
    <div
      className={`relative overflow-hidden rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 min-w-[300px] max-w-[400px] transform transition-all duration-300 ${
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <div className={iconColors[toast.type]}>{icons[toast.type]}</div>
        <div className="flex-1 pr-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{toast.message}</p>
        </div>
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => onDismiss(toast.id), 300);
          }}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

export default function StockManagement() {
  const { currentStore } = useStore();
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'suppliers' | 'movements'>('inventory');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [stats, setStats] = useState<StockStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showItemHistoryModal, setShowItemHistoryModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [itemActionMenuOpen, setItemActionMenuOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load data
  useEffect(() => {
    if (currentStore) {
      loadData();
    }
  }, [currentStore, activeTab]);

  const loadData = async () => {
    if (!currentStore) return;
    setLoading(true);
    setError(null);
    try {
      switch (activeTab) {
        case 'inventory':
          const [itemsRes, statsRes] = await Promise.all([
            api.inventory.getItems(currentStore.id),
            api.inventory.getStockLevels(currentStore.id),
          ]);
          setItems(itemsRes.data);
          setStats(statsRes.data);
          break;
        case 'movements':
          const movementsRes = await api.inventory.getStockMovements();
          setMovements(movementsRes.data.movements);
          break;
        case 'orders':
          const ordersRes = await api.inventory.getPurchaseOrders(currentStore.id);
          setPurchaseOrders(ordersRes.data);
          break;
        case 'suppliers':
          const companyId = currentStore.companyId || '';
          const vendorsRes = await api.inventory.getVendors(companyId);
          setVendors(vendorsRes.data);
          break;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.barcode && item.barcode.includes(searchQuery));
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(items.map(i => i.category).filter(Boolean)));

  // Export to CSV
  const handleExport = () => {
    const csv = [
      ['Name', 'SKU', 'Barcode', 'Category', 'Current Stock', 'Min Stock', 'Unit', 'Cost', 'Value'].join(','),
      ...filteredItems.map(item => [
        item.name,
        item.sku,
        item.barcode || '',
        item.category,
        item.currentStock,
        item.minStockLevel,
        item.unit,
        item.lastCost.toFixed(2),
        item.stockValue.toFixed(2),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:50px_50px] opacity-20" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 h-full flex flex-col">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage inventory, orders, and suppliers</p>
          </div>
          <div className="flex gap-2">
            {activeTab === 'inventory' && (
              <>
                <button
                  onClick={() => setShowReceiveModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Barcode className="w-4 h-4" />
                  Receive
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </>
            )}
            {activeTab === 'orders' && (
              <button
                onClick={() => setShowPOModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <ShoppingCart className="w-4 h-4" />
                Create PO
              </button>
            )}
            {activeTab === 'suppliers' && (
              <button
                onClick={() => setShowVendorModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Truck className="w-4 h-4" />
                Add Vendor
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {[
            { id: 'inventory', label: 'Inventory', icon: Package },
            { id: 'movements', label: 'Movements', icon: ArrowRightLeft },
            { id: 'orders', label: 'Purchase Orders', icon: ShoppingCart },
            { id: 'suppliers', label: 'Suppliers', icon: Truck },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      {activeTab === 'inventory' && stats && (
        <div className="grid grid-cols-4 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-900">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalItems}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Low Stock Alert</p>
                <p className="text-2xl font-bold text-amber-600">{stats.lowStockCount}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Stock Value</p>
                <p className="text-2xl font-bold text-green-600">${stats.totalStockValue.toFixed(0)}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.outOfStockCount}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Minus className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
              <div className="space-y-4">
                {/* Filters & Category Management */}
                <div className="flex gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, SKU, or barcode..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowCategoryModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Manage Categories
                  </button>
                </div>

                {/* Category Chips */}
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setCategoryFilter('all')}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        categoryFilter === 'all'
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      All ({items.length})
                    </button>
                    {categories.map((cat) => {
                      const count = items.filter(i => i.category === cat).length;
                      const isActive = categoryFilter === cat;
                      return (
                        <div key={cat} className="relative group">
                          <button
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                              isActive
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {cat}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                              isActive 
                                ? 'bg-indigo-200 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-200' 
                                : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                            }`}>
                              {count}
                            </span>
                          </button>
                          {/* Category Actions Dropdown */}
                          <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCategory(cat);
                                setShowEditCategoryModal(true);
                              }}
                              className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full"
                            >
                              <Settings className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Items Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SKU</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stock</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Unit Cost</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Value</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{item.category}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{item.sku}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium dark:text-white">{item.currentStock}</span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">{item.unit}</span>
                            </div>
                            <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                              <div
                                className={`h-full rounded-full ${
                                  item.isLowStock ? 'bg-red-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(item.stockPercentage, 100)}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {item.isLowStock ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                <AlertTriangle className="w-3 h-3" />
                                Low
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                <Check className="w-3 h-3" />
                                OK
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">${item.lastCost.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm font-medium">${item.stockValue.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Quick Actions */}
                              <button
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowAdjustModal(true);
                                }}
                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg"
                                title="Adjust Stock"
                              >
                                <History className="w-4 h-4" />
                              </button>
                              
                              {/* Action Menu */}
                              <div className="relative">
                                <button
                                  onClick={() => setItemActionMenuOpen(itemActionMenuOpen === item.id ? null : item.id)}
                                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                
                                {itemActionMenuOpen === item.id && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-40"
                                      onClick={() => setItemActionMenuOpen(null)}
                                    />
                                    <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1">
                                      <button
                                        onClick={() => {
                                          setSelectedItem(item);
                                          setShowItemHistoryModal(true);
                                          setItemActionMenuOpen(null);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                      >
                                        <Eye className="w-4 h-4" />
                                        View History
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedItem(item);
                                          setShowEditModal(true);
                                          setItemActionMenuOpen(null);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                      >
                                        <Edit className="w-4 h-4" />
                                        Edit Item
                                      </button>
                                      <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                                      <button
                                        onClick={() => {
                                          setSelectedItem(item);
                                          setShowDeleteModal(true);
                                          setItemActionMenuOpen(null);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        Delete Item
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredItems.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No items found</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Movements Tab */}
            {activeTab === 'movements' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {movements.map((movement) => (
                      <tr key={movement.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {new Date(movement.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white">{movement.inventoryItem?.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{movement.inventoryItem?.sku}</p>
                        </td>
                        <td className="px-4 py-3">
                          <MovementTypeBadge type={movement.type} />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={movement.quantity >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {movement.quantity >= 0 ? '+' : ''}{movement.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{movement.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Purchase Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {purchaseOrders.map((po) => (
                  <div key={po.id} className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{po.poNumber}</h3>
                        <POStatusBadge status={po.status} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(po.orderDate).toLocaleDateString()}
                        </span>
                        <span className="font-medium dark:text-white">${Number(po.total).toFixed(2)}</span>
                        {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                          <button
                            onClick={() => {}}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                          >
                            Receive
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium dark:text-white">{po.vendor?.name || 'Unknown Vendor'}</span>
                    </div>
                    <div className="mt-3 space-y-1">
                      {po.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{item.inventoryItemId}</span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {Number(item.receivedQty || 0)}/{Number(item.quantity)} @ ${Number(item.unitPrice).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {purchaseOrders.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-xl">
                    <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No purchase orders</p>
                  </div>
                )}
              </div>
            )}

            {/* Suppliers Tab */}
            {activeTab === 'suppliers' && (
              <div className="grid grid-cols-3 gap-4">
                {vendors.map((vendor) => (
                  <div key={vendor.id} className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{vendor.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{vendor.code}</p>
                      </div>
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Truck className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    {vendor.contactName && (
                      <p className="mt-2 text-sm text-gray-600">{vendor.contactName}</p>
                    )}
                    {vendor.phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">{vendor.phone}</p>
                    )}
                    {vendor.email && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">{vendor.email}</p>
                    )}
                  </div>
                ))}
                {vendors.length === 0 && (
                  <div className="col-span-3 text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                    <Truck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No vendors</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onSave={loadData}
          storeId={currentStore?.id || ''}
          showToast={showToast}
        />
      )}
      {showReceiveModal && (
        <ReceiveModal
          onClose={() => setShowReceiveModal(false)}
          onSave={loadData}
          storeId={currentStore?.id || ''}
          showToast={showToast}
        />
      )}
      {showPOModal && (
        <CreatePOModal
          onClose={() => setShowPOModal(false)}
          onSave={loadData}
          storeId={currentStore?.id || ''}
          items={items}
          vendors={vendors}
          showToast={showToast}
        />
      )}
      {showVendorModal && (
        <AddVendorModal
          onClose={() => setShowVendorModal(false)}
          onSave={loadData}
          companyId={currentStore?.companyId || ''}
          showToast={showToast}
        />
      )}
      {showAdjustModal && selectedItem && (
        <AdjustStockModal
          onClose={() => {
            setShowAdjustModal(false);
            setSelectedItem(null);
          }}
          onSave={loadData}
          item={selectedItem}
          showToast={showToast}
        />
      )}
      {showEditModal && selectedItem && (
        <EditItemModal
          onClose={() => {
            setShowEditModal(false);
            setSelectedItem(null);
          }}
          onSave={loadData}
          item={selectedItem}
          storeId={currentStore?.id || ''}
          showToast={showToast}
        />
      )}
      {showDeleteModal && selectedItem && (
        <DeleteItemModal
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedItem(null);
          }}
          onSave={loadData}
          item={selectedItem}
          storeId={currentStore?.id || ''}
          showToast={showToast}
        />
      )}
      {showItemHistoryModal && selectedItem && (
        <ItemHistoryModal
          onClose={() => {
            setShowItemHistoryModal(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
        />
      )}
      {showCategoryModal && (
        <ManageCategoriesModal
          onClose={() => setShowCategoryModal(false)}
          categories={categories}
          items={items}
          onEditCategory={(cat) => {
            setSelectedCategory(cat);
            setShowEditCategoryModal(true);
          }}
          onDeleteCategory={(cat) => {
            setSelectedCategory(cat);
            setShowDeleteCategoryModal(true);
          }}
        />
      )}
      {showEditCategoryModal && (
        <EditCategoryModal
          onClose={() => {
            setShowEditCategoryModal(false);
            setSelectedCategory('');
          }}
          onSave={loadData}
          categoryName={selectedCategory}
          items={items}
          storeId={currentStore?.id || ''}
          showToast={showToast}
        />
      )}
      {showDeleteCategoryModal && (
        <DeleteCategoryModal
          onClose={() => {
            setShowDeleteCategoryModal(false);
            setSelectedCategory('');
          }}
          onSave={loadData}
          categoryName={selectedCategory}
          items={items}
          storeId={currentStore?.id || ''}
          showToast={showToast}
        />
      )}
    </div>
    </div>
  );
}

// Helper Components
function MovementTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    SALE: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    PURCHASE: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    ADJUSTMENT: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    WASTE: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
    TRANSFER_IN: 'bg-green-500/20 text-green-300 border border-green-500/30',
    TRANSFER_OUT: 'bg-red-500/20 text-red-300 border border-red-500/30',
    INITIAL: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[type] || 'bg-gray-500/20 text-gray-300 border border-gray-500/30'}`}>
      {type.replace('_', ' ')}
    </span>
  );
}

function POStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
    SENT: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    PARTIAL: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    RECEIVED: 'bg-green-500/20 text-green-300 border border-green-500/30',
    CANCELLED: 'bg-red-500/20 text-red-300 border border-red-500/30',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-500/20 text-gray-300 border border-gray-500/30'}`}>
      {status}
    </span>
  );
}

// Modal Components
function AddItemModal({ onClose, onSave, storeId, showToast }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'Ingredients',
    unit: 'pcs',
    currentStock: 0,
    minStockLevel: 10,
    lastCost: 0,
    trackInventory: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.inventory.createItem({ ...formData, storeId });
      onSave();
      onClose();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to create item', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Add Inventory Item</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/50 border-white/10 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">SKU *</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/50 border-white/10 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Barcode</label>
            <div className="relative">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full pl-10 pr-3 py-2 bg-slate-900/50 border-white/10 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Scan or enter barcode"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/50 border-white/10 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/50 border-white/10 text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="pcs">Pieces</option>
                <option value="kg">Kilograms</option>
                <option value="lb">Pounds</option>
                <option value="g">Grams</option>
                <option value="L">Liters</option>
                <option value="ml">Milliliters</option>
                <option value="box">Box</option>
                <option value="case">Case</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Initial Stock</label>
              <input
                type="number"
                min="0"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900/50 border-white/10 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Min Stock</label>
              <input
                type="number"
                min="0"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900/50 border-white/10 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Unit Cost ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.lastCost}
                onChange={(e) => setFormData({ ...formData, lastCost: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900/50 border-white/10 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-white/10 text-slate-300 hover:bg-white/5 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReceiveModal({ onClose, onSave, storeId, showToast }: any) {
  const [barcode, setBarcode] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

  const handleBarcodeSubmit = async () => {
    if (!barcode) return;
    try {
      const res = await api.inventory.getItemByBarcode(barcode, storeId);
      setScannedItem(res.data);
      setUnitCost(res.data.lastCost?.toString() || '');
    } catch (error) {
      showToast('Item not found with this barcode', 'error');
      setScannedItem(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedItem) return;
    
    setLoading(true);
    try {
      await api.inventory.receiveByBarcode({
        storeId,
        barcode,
        quantity,
        unitCost: parseFloat(unitCost) || undefined,
      });
      showToast(`Received ${quantity} ${scannedItem.unit} of ${scannedItem.name}`, 'success');
      onSave();
      onClose();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to receive', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Receive by Barcode
          </h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={scannedItem ? handleSubmit : (e) => { e.preventDefault(); handleBarcodeSubmit(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Scan Barcode</label>
            <div className="relative">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !scannedItem && handleBarcodeSubmit()}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 text-lg"
                placeholder="Scan or type barcode..."
                disabled={!!scannedItem}
              />
              {scannedItem && (
                <button
                  type="button"
                  onClick={() => { setScannedItem(null); setBarcode(''); setTimeout(() => inputRef.current?.focus(), 100); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {scannedItem && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Item</p>
                <p className="font-semibold text-lg">{scannedItem.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{scannedItem.sku}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity ({scannedItem.unit})</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!scannedItem && !barcode) || (scannedItem && quantity < 1)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (scannedItem ? 'Receive Stock' : 'Find Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreatePOModal({ onClose, onSave, storeId, items, vendors, showToast }: any) {
  const [loading, setLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedItems, setSelectedItems] = useState<Array<{ itemId: string; quantity: number; unitCost: number }>>([]);
  const [expectedDate, setExpectedDate] = useState('');

  const addItem = () => {
    setSelectedItems([...selectedItems, { itemId: '', quantity: 1, unitCost: 0 }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...selectedItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'itemId') {
      const item = items.find((i: InventoryItem) => i.id === value);
      updated[index].unitCost = item?.lastCost || 0;
    }
    setSelectedItems(updated);
  };

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor || selectedItems.length === 0) {
      showToast('Please select a vendor and at least one item', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.inventory.createPurchaseOrder({
        storeId,
        vendorId: selectedVendor,
        expectedDate: expectedDate || undefined,
        items: selectedItems.map(i => ({
          inventoryItemId: i.itemId,
          quantity: i.quantity,
          unitPrice: i.unitCost,
        })),
      });
      onSave();
      onClose();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to create PO', 'error');
    } finally {
      setLoading(false);
    }
  };

  const total = selectedItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Create Purchase Order</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Vendor *</label>
              <select
                required
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="" className="bg-slate-900">Select vendor...</option>
                {vendors.map((v: Vendor) => (
                  <option key={v.id} value={v.id} className="bg-slate-900">{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Expected Date</label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">Items</label>
              <button
                type="button"
                onClick={addItem}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                + Add Item
              </button>
            </div>
            <div className="space-y-2">
              {selectedItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <select
                      value={item.itemId}
                      onChange={(e) => updateItem(index, 'itemId', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 text-white rounded-lg text-sm"
                    >
                      <option value="" className="bg-slate-900">Select item...</option>
                      {items.map((i: InventoryItem) => (
                        <option key={i.id} value={i.id} className="bg-slate-900">{i.name}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-2 bg-slate-900/50 border border-white/10 text-white rounded-lg text-sm"
                    placeholder="Qty"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitCost}
                    onChange={(e) => updateItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                    className="w-24 px-3 py-2 bg-slate-900/50 border border-white/10 text-white rounded-lg text-sm"
                    placeholder="Cost"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-300">Total:</span>
              <span className="text-xl font-bold text-white">${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-white/10 text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedItems.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg disabled:opacity-50 transition-all"
            >
              {loading ? 'Creating...' : 'Create PO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddVendorModal({ onClose, onSave, companyId, showToast }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.inventory.createVendor({ ...formData, companyId });
      onSave();
      onClose();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to create vendor', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Add Vendor</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Company Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Enter company name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Contact Name</label>
            <input
              type="text"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Enter contact name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Email address"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-purple-500"
              rows={2}
              placeholder="Enter address"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-white/10 text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg disabled:opacity-50 transition-all"
            >
              {loading ? 'Creating...' : 'Create Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdjustStockModal({ onClose, onSave, item, showToast }: any) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'PURCHASE' | 'WASTE' | 'ADJUSTMENT'>('PURCHASE');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setLoading(true);
    try {
      await api.inventory.createStockMovement({
        inventoryItemId: item.id,
        type,
        quantity: type === 'ADJUSTMENT' ? quantity : quantity,
        notes: reason,
      });
      onSave();
      onClose();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to adjust stock', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Adjust Stock: {item.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 mb-4 border border-white/10">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Current Stock:</span>
            <span className="font-medium text-white">{item.currentStock} {item.unit}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-slate-400">Min Stock:</span>
            <span className="font-medium text-white">{item.minStockLevel} {item.unit}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Movement Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'PURCHASE', label: 'Stock In', color: 'bg-green-500/20 text-green-400 border border-green-500/30' },
                { id: 'WASTE', label: 'Waste', color: 'bg-red-500/20 text-red-400 border border-red-500/30' },
                { id: 'ADJUSTMENT', label: 'Set To', color: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id as any)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium ${
                    type === t.id ? t.color : 'bg-slate-800/50 border border-white/10 text-slate-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">
              {type === 'ADJUSTMENT' ? 'New Stock Level' : 'Quantity'} ({item.unit})
            </label>
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-900/50 border-white/10 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Reason *</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/50 border-white/10 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Damaged goods, Inventory count"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-white/10 text-slate-300 hover:bg-white/5 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reason || quantity < 0}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Item Modal
function EditItemModal({ onClose, onSave, item, storeId, showToast }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: item.name,
    sku: item.sku,
    barcode: item.barcode || '',
    category: item.category,
    unit: item.unit,
    minStockLevel: item.minStockLevel,
    maxStockLevel: item.maxStockLevel || '',
    lastCost: item.lastCost,
    trackInventory: item.trackInventory,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.inventory.updateItem(item.id, storeId, {
        ...formData,
        maxStockLevel: formData.maxStockLevel ? parseFloat(formData.maxStockLevel as string) : null,
      });
      onSave();
      onClose();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to update item', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Edit Item
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/50 border-white/10 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">SKU *</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/50 border-white/10 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Barcode</label>
            <div className="relative">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full pl-10 pr-3 py-2 bg-slate-900/50 border-white/10 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/50 border-white/10 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/50 border-white/10 text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="pcs">Pieces</option>
                <option value="kg">Kilograms</option>
                <option value="lb">Pounds</option>
                <option value="g">Grams</option>
                <option value="L">Liters</option>
                <option value="ml">Milliliters</option>
                <option value="box">Box</option>
                <option value="case">Case</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Min Stock</label>
              <input
                type="number"
                min="0"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900/50 border-white/10 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Max Stock</label>
              <input
                type="number"
                min="0"
                value={formData.maxStockLevel}
                onChange={(e) => setFormData({ ...formData, maxStockLevel: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/50 border-white/10 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Unit Cost ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.lastCost}
                onChange={(e) => setFormData({ ...formData, lastCost: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900/50 border-white/10 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="trackInventory"
              checked={formData.trackInventory}
              onChange={(e) => setFormData({ ...formData, trackInventory: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-white/10"
            />
            <label htmlFor="trackInventory" className="text-sm text-slate-300">
              Track inventory for this item
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-white/10 text-slate-300 hover:bg-white/5 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Item Modal
function DeleteItemModal({ onClose, onSave, item, storeId, showToast }: any) {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (confirmText !== item.name) return;
    
    setLoading(true);
    try {
      await api.inventory.deleteItem(item.id, storeId);
      onSave();
      onClose();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to delete item', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold dark:text-white">Delete Item</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
          </div>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            You are about to delete: <strong>{item.name}</strong>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Current Stock: {item.currentStock} {item.unit} | Value: ${item.stockValue.toFixed(2)}
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Type <strong>{item.name}</strong> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500"
            placeholder="Type item name to confirm"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || confirmText !== item.name}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Deleting...' : 'Delete Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Item History Modal
function ItemHistoryModal({ onClose, item }: any) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMovements();
  }, [item.id]);

  const loadMovements = async () => {
    try {
      const res = await api.inventory.getStockMovements({ itemId: item.id });
      setMovements(res.data.movements || []);
    } catch (error) {
      console.error('Failed to load movements:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
              <History className="w-5 h-5" />
              Stock History
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{item.name} ({item.sku})</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No stock movements found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {movements.map((movement) => (
                <div key={movement.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    movement.quantity > 0 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-600'
                  }`}>
                    {movement.quantity > 0 ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium dark:text-white">
                        {movement.type.replace('_', ' ')}
                      </span>
                      <span className={`font-bold ${
                        movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </span>
                    </div>
                    {movement.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{movement.notes}</p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(movement.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Current Stock</span>
            <span className="font-medium dark:text-white">{item.currentStock} {item.unit}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Manage Categories Modal
function ManageCategoriesModal({ onClose, categories, items, onEditCategory, onDeleteCategory }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Manage Categories
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No categories found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Categories are created automatically when you add items
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat: string) => {
                const catItems = items.filter((i: InventoryItem) => i.category === cat);
                const totalStock = catItems.reduce((sum: number, i: InventoryItem) => sum + i.currentStock, 0);
                const totalValue = catItems.reduce((sum: number, i: InventoryItem) => sum + i.stockValue, 0);
                
                return (
                  <div key={cat} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{cat}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {catItems.length} items · {totalStock} units · ${totalValue.toFixed(2)} value
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditCategory(cat)}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg"
                        title="Edit Category"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteCategory(cat)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit Category Modal
function EditCategoryModal({ onClose, onSave, categoryName, items, storeId, showToast }: any) {
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState(categoryName);
  const affectedItems = items.filter((i: InventoryItem) => i.category === categoryName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newName === categoryName) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      // Update all items in this category
      const promises = affectedItems.map((item: InventoryItem) =>
        api.inventory.updateItem(item.id, storeId, { category: newName.trim() })
      );
      await Promise.all(promises);
      onSave();
      onClose();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to rename category', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Rename Category
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Current Name</label>
            <input
              type="text"
              value={categoryName}
              disabled
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-500 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New Name</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter new category name"
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              This will update {affectedItems.length} items in this category
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !newName.trim() || newName === categoryName}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Rename Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Category Modal
function DeleteCategoryModal({ onClose, onSave, categoryName, items, storeId, showToast }: any) {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [moveToCategory, setMoveToCategory] = useState('');
  
  const affectedItems = items.filter((i: InventoryItem) => i.category === categoryName);
  const otherCategories = Array.from(new Set(
    items.filter((i: InventoryItem) => i.category !== categoryName).map((i: InventoryItem) => i.category)
  ));

  const handleDelete = async () => {
    if (confirmText !== categoryName) return;

    setLoading(true);
    try {
      // Either move items to another category or delete them
      if (moveToCategory) {
        const promises = affectedItems.map((item: InventoryItem) =>
          api.inventory.updateItem(item.id, storeId, { category: moveToCategory })
        );
        await Promise.all(promises);
      } else {
        // Delete all items in category
        const promises = affectedItems.map((item: InventoryItem) =>
          api.inventory.deleteItem(item.id, storeId)
        );
        await Promise.all(promises);
      }
      onSave();
      onClose();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to delete category', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold dark:text-white">Delete Category</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            You are about to delete: <strong>{categoryName}</strong>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Contains {affectedItems.length} items
          </p>
        </div>

        {otherCategories.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Move items to another category (optional)
            </label>
            <select
              value={moveToCategory}
              onChange={(e) => setMoveToCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Delete all items in category</option>
              {otherCategories.map((cat: string) => (
                <option key={cat} value={cat}>Move to: {cat}</option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Type <strong>{categoryName}</strong> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500"
            placeholder="Type category name to confirm"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || confirmText !== categoryName}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Deleting...' : moveToCategory ? 'Move & Delete' : 'Delete Category'}
          </button>
        </div>
      </div>
    </div>
  );
}
