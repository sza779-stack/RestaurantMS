import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Plus, Search, Edit2, Grid, List, Trash2, Copy, X, DollarSign, Clock, Loader2, Layers, ChefHat } from 'lucide-react';
import { api } from '../../../../services/api';
import { toast } from 'sonner';
import { getFoodImage } from '../../../pos/components/foodImages';

interface Props { storeId: string; }

const ProductsTab: React.FC<Props> = ({ storeId }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [addonSets, setAddonSets] = useState<any[]>([]);
  
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: '',
    cost: '',
    prepTime: '',
    description: '',
    type: 'STANDALONE',
    kitchenStation: 'GENERAL',
    imageUrl: '',
    hasSizes: false,
    sizes: [] as { name: string; priceAdjustment: string; code: string }[],
    configuration: { 
      default_ingredients: [] as string[],
      linked_sets: [] as string[],
      default_addons: [] as string[]
    }
  });

  useEffect(() => {
    if (storeId) {
      loadProducts();
      loadCategories();
      loadAddonSets();
    }
  }, [storeId]);

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const response = await api.menu.getProducts({ storeId });
      setProducts(response.data || []);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.menu.getCategories(storeId);
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to load categories', error);
    }
  };

  const loadAddonSets = async () => {
    try {
      const response = await api.addons.getSets(storeId);
      setAddonSets(response.data || []);
    } catch (error) {
      console.error('Failed to load addon sets', error);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
      product.category?.name === selectedCategory ||
      product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      toast.error('Name and price are required');
      return;
    }
    
    try {
      await api.menu.createProduct({
        storeId,
        name: newProduct.name,
        description: newProduct.description || null,
        imageUrl: newProduct.imageUrl || null,
        basePrice: parseFloat(newProduct.price),
        costPrice: newProduct.cost ? parseFloat(newProduct.cost) : null,
        prepTimeMinutes: parseInt(newProduct.prepTime) || 10,
        kitchenStation: newProduct.kitchenStation || 'GENERAL',
        categoryId: categories.find(c => c.name === newProduct.category)?.id,
        type: newProduct.type,
        configuration: newProduct.configuration,
        sizes: newProduct.hasSizes ? newProduct.sizes.filter(s => s.name.trim()).map(s => ({
          name: s.name, code: s.code || s.name.toUpperCase().replace(/\s+/g, '_'),
          priceAdjustment: parseFloat(s.priceAdjustment) || 0,
        })) : [],
      });
      toast.success('Product created successfully');
      setShowAddProductModal(false);
      resetForm();
      loadProducts();
    } catch (error) {
      toast.error('Failed to create product');
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    try {
      const categoryId = categories.find(c => c.name === newProduct.category)?.id || editingProduct.categoryId;
      const payload: any = {
        name: newProduct.name,
        basePrice: parseFloat(newProduct.price),
        type: newProduct.type,
        description: newProduct.description || null,
        imageUrl: newProduct.imageUrl || null,
        kitchenStation: newProduct.kitchenStation || 'GENERAL',
        sizes: newProduct.hasSizes ? newProduct.sizes.filter(s => s.name.trim()).map(s => ({
          name: s.name, code: s.code || s.name.toUpperCase().replace(/\s+/g, '_'),
          priceAdjustment: parseFloat(s.priceAdjustment) || 0,
        })) : [],
      };
      if (categoryId) payload.categoryId = categoryId;
      if (newProduct.cost) payload.costPrice = parseFloat(newProduct.cost);
      if (newProduct.prepTime) payload.prepTimeMinutes = parseInt(newProduct.prepTime);
      if (newProduct.configuration) payload.configuration = newProduct.configuration;
      
      await api.menu.updateProduct(editingProduct.id, payload);
      toast.success('Product updated successfully');
      setShowEditProductModal(false);
      setEditingProduct(null);
      resetForm();
      loadProducts();
    } catch (error: any) {
      const msg = error?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.menu.deleteProduct?.(id);
      toast.success('Product deleted');
      loadProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleDuplicateProduct = (product: any) => {
    setNewProduct({
      name: `${product.name} (Copy)`,
      category: product.category?.name || '',
      price: product.basePrice?.toString() || '',
      cost: product.costPrice?.toString() || '',
      prepTime: product.prepTimeMinutes?.toString() || '',
      description: product.description || '',
      type: product.type || 'STANDALONE',
      kitchenStation: product.kitchenStation || 'GENERAL',
      imageUrl: product.imageUrl || '',
      hasSizes: !!(product.sizes && product.sizes.length > 0),
      sizes: product.sizes?.map((s: any) => ({ name: s.name, priceAdjustment: String(s.priceAdjustment || '0'), code: s.code || '' })) || [],
      configuration: product.configuration || { 
        default_ingredients: [],
        linked_sets: [],
        default_addons: []
      },
    });
    setShowAddProductModal(true);
  };

  const resetForm = () => {
    setNewProduct({ name: '', category: '', price: '', cost: '', prepTime: '', description: '', type: 'STANDALONE', kitchenStation: 'GENERAL', imageUrl: '', hasSizes: false, sizes: [], configuration: { default_ingredients: [], linked_sets: [], default_addons: [] } });
  };

  const addSize = () => {
    setNewProduct({ ...newProduct, sizes: [...newProduct.sizes, { name: '', priceAdjustment: '0', code: '' }] });
  };

  const removeSize = (idx: number) => {
    setNewProduct({ ...newProduct, sizes: newProduct.sizes.filter((_, i) => i !== idx) });
  };

  const updateSize = (idx: number, field: string, value: string) => {
    const updated = [...newProduct.sizes];
    (updated[idx] as any)[field] = value;
    setNewProduct({ ...newProduct, sizes: updated });
  };

  const applyPreset = (preset: string) => {
    const presets: Record<string, { name: string; priceAdjustment: string; code: string }[]> = {
      drinks: [
        { name: '12oz Can', priceAdjustment: '0', code: '12OZ' },
        { name: '20oz Bottle', priceAdjustment: '0.50', code: '20OZ' },
        { name: '2-Liter', priceAdjustment: '2.00', code: '2L' },
      ],
      pizza: [
        { name: 'Small (10")', priceAdjustment: '0', code: 'SM' },
        { name: 'Medium (12")', priceAdjustment: '2.00', code: 'MD' },
        { name: 'Large (14")', priceAdjustment: '4.00', code: 'LG' },
        { name: 'X-Large (16")', priceAdjustment: '6.00', code: 'XL' },
      ],
      wings: [
        { name: '6 Pieces', priceAdjustment: '0', code: '6PC' },
        { name: '10 Pieces', priceAdjustment: '4.00', code: '10PC' },
        { name: '20 Pieces', priceAdjustment: '12.00', code: '20PC' },
        { name: '50 Pieces', priceAdjustment: '35.00', code: '50PC' },
      ],
      subs: [
        { name: '6" Half', priceAdjustment: '0', code: '6IN' },
        { name: '12" Whole', priceAdjustment: '4.00', code: '12IN' },
      ],
      pasta: [
        { name: 'Regular', priceAdjustment: '0', code: 'REG' },
        { name: 'Large', priceAdjustment: '3.00', code: 'LG' },
        { name: 'Family Size', priceAdjustment: '8.00', code: 'FAM' },
      ],
      sides: [
        { name: 'Small', priceAdjustment: '0', code: 'SM' },
        { name: 'Regular', priceAdjustment: '1.50', code: 'REG' },
        { name: 'Large', priceAdjustment: '3.00', code: 'LG' },
      ],
      coffee: [
        { name: 'Small (12oz)', priceAdjustment: '0', code: 'SM' },
        { name: 'Medium (16oz)', priceAdjustment: '0.75', code: 'MD' },
        { name: 'Large (20oz)', priceAdjustment: '1.50', code: 'LG' },
      ],
    };
    setNewProduct({ ...newProduct, hasSizes: true, sizes: presets[preset] || [] });
  };

  const openEditProduct = (product: any) => {
    setEditingProduct(product);
    const existingSizes = (product.sizes || []).map((s: any) => ({
      name: s.name, priceAdjustment: String(Number(s.priceAdjustment || 0)), code: s.code || '',
    }));
    setNewProduct({
      name: product.name,
      category: product.category?.name || '',
      price: product.basePrice?.toString() || '',
      cost: product.costPrice?.toString() || '',
      prepTime: product.prepTimeMinutes?.toString() || '',
      description: product.description || '',
      type: product.type || 'STANDALONE',
      kitchenStation: product.kitchenStation || 'GENERAL',
      imageUrl: product.imageUrl || '',
      hasSizes: existingSizes.length > 0,
      sizes: existingSizes,
      configuration: product.configuration || { default_ingredients: [], linked_sets: [], default_addons: [] },
    });
    setShowEditProductModal(true);
  };

  return (
    <div>
      <div className="flex gap-4 mb-6 items-center justify-between">
        <div className="flex gap-4 flex-1">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-[200px]"
          >
            <option value="all">All Categories</option>
            {categories.filter(c => c.isActive).map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'bg-white text-gray-600'}`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'bg-white text-gray-600'}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>
        <button 
          onClick={() => setShowAddProductModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {productsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-orange-600" size={32} />
        </div>
	      ) : viewMode === 'grid' ? (
	        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
	          {filteredProducts.map((product) => (
	            <div key={product.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
	              <div className="h-36 bg-gray-100 overflow-hidden">
	                <img
	                  src={getFoodImage(product)}
	                  alt={product.name}
	                  className="h-full w-full object-cover"
	                  onError={(e) => { e.currentTarget.src = '/images/pepperoni.png'; }}
	                />
	              </div>
	              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.category?.name || 'Uncategorized'}</p>
                  </div>
                  {product.isFeatured && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">Featured</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <p className="text-lg font-bold text-gray-900">${Number(product.basePrice).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Cost: ${Number(product.costPrice || 0).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditProduct(product)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <Edit2 size={16} className="text-gray-400" />
                    </button>
                    <button onClick={() => handleDeleteProduct(product.id)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Price</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Cost</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const price = Number(product.basePrice || 0);
                const cost = Number(product.costPrice || 0);
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
	                    <td className="px-4 py-4">
	                      <div className="flex items-center gap-3">
	                        <img
	                          src={getFoodImage(product)}
	                          alt={product.name}
	                          className="h-12 w-16 rounded-lg object-cover bg-gray-100"
	                          onError={(e) => { e.currentTarget.src = '/images/pepperoni.png'; }}
	                        />
	                        <div className="min-w-0">
	                          <div className="font-medium text-gray-900">{product.name}</div>
	                          {product.sizes?.length > 0 && (
	                            <span className="mt-1 inline-flex px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded font-medium">{product.sizes.length} sizes</span>
	                          )}
	                        </div>
	                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      <div>{product.category?.name || 'Uncategorized'}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{product.type}</div>
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-gray-900">${price.toFixed(2)}</td>
                    <td className="px-4 py-4 text-right text-sm text-gray-500">${cost.toFixed(2)}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditProduct(product)} className="p-2 hover:bg-gray-200 rounded-lg">
                          <Edit2 size={16} className="text-gray-400" />
                        </button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="p-2 hover:bg-gray-200 rounded-lg">
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Modal */}
      {(showAddProductModal || showEditProductModal) && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-6 backdrop-blur-sm" style={{ margin: 0, top: 0, left: 0 }}>
          <div className="bg-white rounded-[5px] shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{showEditProductModal ? 'Edit Product' : 'Add New Product'}</h2>
              <button 
                onClick={() => { setShowAddProductModal(false); setShowEditProductModal(false); }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input type="text" value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-[5px] focus:ring-2 focus:ring-orange-500 outline-none text-gray-900" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={newProduct.description} rows={2}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  placeholder="Brief description of the product..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-[5px] focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 resize-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-[5px] focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900">
                    <option value="">Select Category</option>
                    {categories.filter(c => c.isActive).map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Type *</label>
                  <select value={newProduct.type}
                    onChange={(e) => setNewProduct({...newProduct, type: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-[5px] focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900">
                    <option value="STANDALONE">Standalone</option>
                    <option value="PIZZA">Signature Pizza</option>
                    <option value="STROMBOLI">Stromboli</option>
                    <option value="SUB">Sub/Sandwich</option>
                    <option value="WRAP">Wrap</option>
                    <option value="CUSTOM">Custom BYO</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Price *</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="number" step="0.01" value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-[5px] focus:ring-2 focus:ring-orange-500 outline-none text-gray-900" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="number" step="0.01" value={newProduct.cost}
                      onChange={(e) => setNewProduct({...newProduct, cost: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-[5px] focus:ring-2 focus:ring-orange-500 outline-none text-gray-900" />
                  </div>
                </div>
              </div>

              {/* Prep Time & Kitchen Station */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (min)</label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="number" value={newProduct.prepTime} placeholder="10"
                      onChange={(e) => setNewProduct({...newProduct, prepTime: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-[5px] focus:ring-2 focus:ring-orange-500 outline-none text-gray-900" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kitchen Station</label>
                  <select value={newProduct.kitchenStation}
                    onChange={(e) => setNewProduct({...newProduct, kitchenStation: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-[5px] focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900">
                    <option value="GENERAL">General</option>
                    <option value="PIZZA">Pizza Oven</option>
                    <option value="FRYER">Fryer</option>
                    <option value="SANDWICH">Sandwich</option>
                    <option value="DRINKS">Drinks</option>
                    <option value="GRILL">Grill</option>
                    <option value="SALAD">Salad</option>
                    <option value="DESSERT">Dessert</option>
                  </select>
                </div>
              </div>

              {/* Sizes / Variations */}
              <div className="border-t border-gray-200 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-orange-600" />
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Sizes / Variations</h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={newProduct.hasSizes}
                      onChange={(e) => {
                        if (e.target.checked && newProduct.sizes.length === 0) {
                          setNewProduct({...newProduct, hasSizes: true, sizes: [{ name: '', priceAdjustment: '0', code: '' }]});
                        } else {
                          setNewProduct({...newProduct, hasSizes: e.target.checked});
                        }
                      }} />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-orange-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>

                {newProduct.hasSizes && (
                  <div className="space-y-3">
                    {/* Presets */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      <button type="button" onClick={() => applyPreset('drinks')}
                        className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 border border-blue-200 transition-colors">
                        🥤 Drinks
                      </button>
                      <button type="button" onClick={() => applyPreset('pizza')}
                        className="px-3 py-1 text-xs font-medium bg-red-50 text-red-700 rounded-full hover:bg-red-100 border border-red-200 transition-colors">
                        🍕 Pizza
                      </button>
                      <button type="button" onClick={() => applyPreset('wings')}
                        className="px-3 py-1 text-xs font-medium bg-orange-50 text-orange-700 rounded-full hover:bg-orange-100 border border-orange-200 transition-colors">
                        🍗 Wings
                      </button>
                      <button type="button" onClick={() => applyPreset('subs')}
                        className="px-3 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full hover:bg-green-100 border border-green-200 transition-colors">
                        🥖 Subs
                      </button>
                      <button type="button" onClick={() => applyPreset('pasta')}
                        className="px-3 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 rounded-full hover:bg-yellow-100 border border-yellow-200 transition-colors">
                        🍝 Pasta
                      </button>
                      <button type="button" onClick={() => applyPreset('sides')}
                        className="px-3 py-1 text-xs font-medium bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 border border-purple-200 transition-colors">
                        🍟 Sides
                      </button>
                      <button type="button" onClick={() => applyPreset('coffee')}
                        className="px-3 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-full hover:bg-amber-100 border border-amber-200 transition-colors">
                        ☕ Coffee
                      </button>
                    </div>

                    {/* Size rows */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1">
                        <div className="col-span-5">Size Name</div>
                        <div className="col-span-3">Price +/-</div>
                        <div className="col-span-3">Code</div>
                        <div className="col-span-1"></div>
                      </div>
                      {newProduct.sizes.map((size, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                          <input type="text" placeholder="e.g., 20oz Bottle" value={size.name}
                            onChange={(e) => updateSize(idx, 'name', e.target.value)}
                            className="col-span-5 px-3 py-2 border border-gray-300 rounded-[5px] focus:ring-2 focus:ring-orange-500 outline-none text-sm text-gray-900" />
                          <div className="col-span-3 relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">+$</span>
                            <input type="number" step="0.01" value={size.priceAdjustment}
                              onChange={(e) => updateSize(idx, 'priceAdjustment', e.target.value)}
                              className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-[5px] focus:ring-2 focus:ring-orange-500 outline-none text-sm text-gray-900" />
                          </div>
                          <input type="text" placeholder="Auto" value={size.code}
                            onChange={(e) => updateSize(idx, 'code', e.target.value)}
                            className="col-span-3 px-3 py-2 border border-gray-300 rounded-[5px] focus:ring-2 focus:ring-orange-500 outline-none text-sm text-gray-400 uppercase" />
                          <button type="button" onClick={() => removeSize(idx)}
                            className="col-span-1 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={addSize}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition-colors">
                        <Plus size={14} /> Add Size
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modifier Groups - shown for ALL types */}
              <div className="border-t border-gray-200 pt-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Modifier Groups</h3>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {addonSets.map(set => {
                      const isLinked = newProduct.configuration?.linked_sets?.includes(set.id);
                      return (
                        <div key={set.id} className="bg-gray-50 p-4 rounded-[5px] border border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-gray-800">{set.name}</h4>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={isLinked}
                                 onChange={async (e) => {
                                   const isChecked = e.target.checked;
                                   const linked = newProduct.configuration?.linked_sets || [];
                                   const updated = isChecked 
                                     ? [...linked, set.id]
                                     : linked.filter((id: string) => id !== set.id);
                                   
                                   // Update local state for UI responsiveness
                                   setNewProduct({
                                     ...newProduct,
                                     configuration: { ...newProduct.configuration, linked_sets: updated }
                                   });

                                   // If we are editing an existing product, persist immediately
                                   if (showEditProductModal && editingProduct?.id) {
                                     try {
                                       if (isChecked) {
                                         await api.addons.linkSetToProduct(editingProduct.id, set.id);
                                         toast.success(`Linked ${set.name}`);
                                       } else {
                                         await api.addons.unlinkSetFromProduct(editingProduct.id, set.id);
                                         toast.success(`Unlinked ${set.name}`);
                                       }
                                       // Reload products to sync with backend
                                       loadProducts();
                                     } catch (err) {
                                       toast.error('Failed to update link in database');
                                     }
                                   }
                                 }}
                              />
                              <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-orange-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                          </div>
                          
                          {isLinked && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {set.addons?.map((sa: any) => {
                                const isDefault = newProduct.configuration?.default_addons?.includes(sa.addonId);
                                return (
                                  <label key={sa.addonId} className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-[5px] border border-gray-100 hover:border-orange-200 transition-colors">
                                    <input 
                                      type="checkbox" 
                                      className="w-4 h-4 text-orange-600 rounded"
                                      checked={isDefault}
                                      onChange={(e) => {
                                        const defaults = newProduct.configuration?.default_addons || [];
                                        const updated = e.target.checked 
                                          ? [...defaults, sa.addonId]
                                          : defaults.filter((id: string) => id !== sa.addonId);
                                        setNewProduct({
                                          ...newProduct,
                                          configuration: { ...newProduct.configuration, default_addons: updated }
                                        });
                                      }}
                                    />
                                    <span className="text-xs text-gray-900 truncate">{sa.addon?.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => { setShowAddProductModal(false); setShowEditProductModal(false); }}
                className="px-4 py-2 text-gray-900 hover:bg-gray-100 rounded-[5px] transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={showEditProductModal ? handleUpdateProduct : handleCreateProduct}
                disabled={!newProduct.name || !newProduct.price}
                className="px-4 py-2 bg-orange-600 text-white rounded-[5px] hover:bg-orange-700 disabled:opacity-50 transition-colors font-bold"
              >
                {showEditProductModal ? 'Update Product' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProductsTab;
