import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Plus, Edit2, Trash2, ChevronRight, Loader2, X } from 'lucide-react';
import { api } from '../../../../services/api';
import { toast } from 'sonner';

interface Props { storeId: string; }

const CategoriesTab: React.FC<Props> = ({ storeId }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#ef4444',
    icon: '🍕',
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    if (storeId) {
      loadCategories();
    }
  }, [storeId]);

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await api.menu.getCategories(storeId);
      setCategories(response.data || []);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryForm.name) {
      toast.error('Category name is required');
      return;
    }
    try {
      await api.menu.createCategory({
        ...categoryForm,
        storeId,
      });
      toast.success('Category created successfully');
      setShowCategoryModal(false);
      setCategoryForm({ name: '', description: '', color: '#ef4444', icon: '🍕', isActive: true, sortOrder: 0 });
      loadCategories();
    } catch (error) {
      toast.error('Failed to create category');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    try {
      await api.menu.updateCategory?.(editingCategory.id, categoryForm);
      toast.success('Category updated successfully');
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', color: '#ef4444', icon: '🍕', isActive: true, sortOrder: 0 });
      loadCategories();
    } catch (error) {
      toast.error('Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.menu.deleteCategory?.(id);
      toast.success('Category deleted');
      loadCategories();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const openEditCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      color: category.color || '#ef4444',
      icon: category.icon || '🍕',
      isActive: category.isActive,
      sortOrder: category.sortOrder || 0,
    });
    setShowCategoryModal(true);
  };

  const openNewCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', color: '#ef4444', icon: '🍕', isActive: true, sortOrder: 0 });
    setShowCategoryModal(true);
  };

  return (
    <div>
      {categoriesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-orange-600" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div key={category.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                  style={{ backgroundColor: `${category.color || '#ef4444'}20` }}
                >
                  {category.icon || '📦'}
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => openEditCategory(category)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    title="Edit"
                  >
                    <Edit2 size={16} className="text-gray-400" />
                  </button>
                  <button 
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{category._count?.products || 0} items</p>
              <div className="flex items-center justify-between mt-4">
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  category.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {category.isActive ? 'Active' : 'Inactive'}
                </span>
                <button 
                  onClick={() => openEditCategory(category)}
                  className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1"
                >
                  Manage
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
          
          <button 
            onClick={openNewCategory}
            className="border-2 border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center justify-center text-gray-500 hover:border-orange-400 hover:text-orange-600 transition-colors min-h-[180px]"
          >
            <Plus size={32} className="mb-2" />
            <span className="font-medium">Add Category</span>
          </button>
        </div>
      )}

      {showCategoryModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-6 backdrop-blur-sm" style={{ margin: 0, top: 0, left: 0 }}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Pizza"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Category description"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon
                  </label>
                  <input
                    type="text"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="e.g., 🍕"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-2xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-10 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="categoryActive"
                  checked={categoryForm.isActive}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <label htmlFor="categoryActive" className="text-sm text-gray-700">
                  Active
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                disabled={!categoryForm.name}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {editingCategory ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CategoriesTab;
