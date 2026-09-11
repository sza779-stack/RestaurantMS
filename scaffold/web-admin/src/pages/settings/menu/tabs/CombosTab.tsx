import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Package,
  CheckCircle,
  X,
  DollarSign,
  Copy,
  Gift,
  Loader2,
  Calendar,
  Zap,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  LayoutList,
} from 'lucide-react';
import { api } from '../../../../services/api';
import { toast } from 'sonner';

interface Props { storeId: string; }

const WIZARD_STEPS = [
  { id: 0, title: 'Combo details', short: 'Details', desc: 'Name, description & image' },
  { id: 1, title: 'Guest journey', short: 'Selections', desc: 'Steps guests follow (matches POS & online)' },
  { id: 2, title: 'Price & publish', short: 'Publish', desc: 'Pricing, schedule & go live' },
] as const;

const FLOW_STEP_STYLES = [
  'border-amber-300/80 bg-gradient-to-br from-amber-50 to-orange-50/90',
  'border-rose-300/80 bg-gradient-to-br from-rose-50 to-red-50/90',
  'border-emerald-300/80 bg-gradient-to-br from-emerald-50 to-teal-50/90',
  'border-sky-300/80 bg-gradient-to-br from-sky-50 to-cyan-50/90',
  'border-violet-300/80 bg-gradient-to-br from-violet-50 to-purple-50/90',
  'border-indigo-300/80 bg-gradient-to-br from-indigo-50 to-blue-50/90',
  'border-fuchsia-300/80 bg-gradient-to-br from-fuchsia-50 to-pink-50/90',
];

const CombosTab: React.FC<Props> = ({ storeId }) => {
  const [combos, setCombos] = useState<any[]>([]);
  const [combosLoading, setCombosLoading] = useState(false);
  const [comboSearchQuery, setComboSearchQuery] = useState('');
  const [showComboModal, setShowComboModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState<any>(null);
  const [wizardStep, setWizardStep] = useState(0);
  
  const [comboForm, setComboForm] = useState({
    name: '',
    description: '',
    sku: '',
    basePrice: '',
    retailValue: '',
    imageUrl: '',
    isActive: true,
    isFeatured: false,
    prepTimeMinutes: 15,
    availableFrom: '',
    availableTo: '',
    availableDays: [] as number[],
    items: [] as any[],
    galleryUrls: [] as string[],
  });

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const COMPONENT_TYPES = [
    { value: 'PIZZA', label: 'Pizza' },
    { value: 'WINGS', label: 'Wings' },
    { value: 'SODA', label: 'Soda' },
    { value: 'MENU_ITEM', label: 'Menu item' },
    { value: 'MENU_CATEGORY', label: 'Menu category' },
    { value: 'CUSTOM', label: 'Custom' },
  ];
  const CUSTOMER_SELECTION_MODES = [
    { value: 'CUSTOMER_ELIGIBLE', label: 'Customer selects eligible options' },
    { value: 'CUSTOMER_ALL_ACTIVE', label: 'Customer selects all active options' },
    { value: 'FIXED_ADMIN', label: 'Fixed by admin' },
    { value: 'DISABLED', label: 'Disabled' },
  ];
	  const TOPPING_COUNTING_METHODS = [
	    { value: 'EVERY_SELECTION_COUNTS_ONE', label: 'Every selection counts as one' },
	    { value: 'TWO_HALVES_COUNT_ONE', label: 'Two half-toppings count as one' },
	    { value: 'EACH_HALF_COUNTS_ONE', label: 'Each half-topping counts as one' },
	    { value: 'MENU_ITEM_DEFAULT', label: 'Use menu item defaults' },
	  ];
	  const QUICK_COMBO_PRESETS = [
	    {
	      id: 'pizza-wings-soda',
	      title: 'Pizza + Wings + Soda',
	      description: '1 large pizza, 12 wings, and a 2 liter drink',
	      price: '24.99',
	      retailValue: '31.99',
	    },
	    {
	      id: 'family-feast',
	      title: 'Family Feast',
	      description: 'Pizza-led dinner bundle with sides and drinks',
	      price: '34.99',
	      retailValue: '43.99',
	    },
	    {
	      id: 'pick-any-3',
	      title: 'Pick Any 3',
	      description: 'Customer chooses three eligible menu items',
	      price: '19.99',
	      retailValue: '25.99',
	    },
	  ];

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Auto-calculate suggested price from selected products
  const suggestedPrice = useMemo(() => {
    let total = 0;
    for (const item of comboForm.items) {
      if (item.productId) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          let price = Number(product.basePrice || 0);
          if (item.defaultSizeId && product.sizes) {
            const size = product.sizes.find((s: any) => s.id === item.defaultSizeId);
            if (size) price += Number(size.priceAdjustment || 0);
          }
          total += price * (item.quantity || 1);
        }
      }
    }
    return total;
  }, [comboForm.items, products]);

  const suggestedComboPrice = useMemo(() => {
    if (suggestedPrice <= 0) return 0;
    // Suggest 10-15% discount, rounded to .99
    const discounted = suggestedPrice * 0.88;
    return Math.floor(discounted) + 0.99;
  }, [suggestedPrice]);

  useEffect(() => {
    if (storeId) {
      loadCombos();
      loadProducts();
      loadCategories();
    }
  }, [storeId]);

  const loadCombos = async () => {
    setCombosLoading(true);
    try {
      const response = await api.combos.getAll({ storeId });
      setCombos(response.data || []);
    } catch (error) {
      toast.error('Failed to load combos');
    } finally {
      setCombosLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await api.menu.getProducts({ storeId });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Failed to load products');
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.menu.getCategories(storeId);
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to load categories');
    }
  };

  const filteredCombos = combos.filter(combo =>
    combo.name.toLowerCase().includes(comboSearchQuery.toLowerCase())
  );

  const resetComboForm = () => {
    setWizardStep(0);
    setComboForm({
      name: '',
      description: '',
      sku: '',
      basePrice: '',
      retailValue: '',
      imageUrl: '',
      isActive: true,
      isFeatured: false,
      prepTimeMinutes: 15,
      availableFrom: '',
      availableTo: '',
      availableDays: [],
      items: [],
      galleryUrls: [],
    });
  };

  const sortedComboItems = useMemo(
    () => [...comboForm.items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [comboForm.items],
  );

  const moveComboItem = (itemId: string, direction: 'up' | 'down') => {
    const sorted = [...comboForm.items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const idx = sorted.findIndex((i) => i.id === itemId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    const orderA = a.sortOrder ?? idx;
    const orderB = b.sortOrder ?? swapIdx;
    setComboForm((prev) => ({
      ...prev,
      items: prev.items.map((it) => {
        if (it.id === a.id) return { ...it, sortOrder: orderB };
        if (it.id === b.id) return { ...it, sortOrder: orderA };
        return it;
      }),
    }));
  };

  const goNextWizard = () => {
    if (wizardStep === 0 && !comboForm.name.trim()) {
      toast.error('Enter a combo name to continue.');
      return;
    }
    if (wizardStep === 1 && comboForm.items.length === 0) {
      toast.error('Add at least one selection step (e.g. pizza, wings, drink).');
      return;
    }
    if (wizardStep < WIZARD_STEPS.length - 1) setWizardStep((s) => s + 1);
  };

	  const goPrevWizard = () => {
	    if (wizardStep > 0) setWizardStep((s) => s - 1);
	  };

	  const buildCleanedComboItems = (legacyCompatible = false) =>
	    comboForm.items.map((item) => {
	      const baseItem = {
	        productId: item.productId || null,
	        categoryId: item.categoryId || null,
	        name: item.name,
	        quantity: item.quantity || 1,
	        allowSizeSelection: !!item.allowSizeSelection,
	        defaultSizeId: item.defaultSizeId || null,
	        allowedSizeIds: Array.isArray(item.allowedSizeIds) ? item.allowedSizeIds : [],
	        maxIncludedToppings: item.maxIncludedToppings || 0,
	        allowModifiers: !!item.allowModifiers,
	        includedModifierIds: Array.isArray(item.includedModifierIds) ? item.includedModifierIds : [],
	        isProductFixed: !!item.isProductFixed,
	        productGroupLabel: item.productGroupLabel || '',
	        sortOrder: item.sortOrder || 0,
	      };

	      if (legacyCompatible) return baseItem;

	      return {
	        ...baseItem,
	        componentType: item.componentType || 'MENU_ITEM',
	        selectionRules: item.selectionRules || {},
	        allowCustomization: !!item.allowCustomization,
	        freeModifierGroups: Array.isArray(item.freeModifierGroups) ? item.freeModifierGroups : [],
	      };
	    });

	  const buildComboPayload = (legacyCompatible = false, includeStoreId = true) => ({
	    ...comboForm,
	    ...(includeStoreId ? { storeId } : {}),
	    basePrice: comboForm.basePrice.toString(),
	    retailValue: (comboForm.retailValue || suggestedPrice || comboForm.basePrice).toString(),
	    availableFrom: comboForm.availableFrom || null,
	    availableTo: comboForm.availableTo || null,
	    availableDays: comboForm.availableDays,
	    items: buildCleanedComboItems(legacyCompatible),
	  });

	  const shouldRetryLegacyComboPayload = (error: any) => {
	    const message = error?.response?.data?.message;
	    const messages = Array.isArray(message) ? message : [message].filter(Boolean);
	    return messages.some((entry: string) =>
	      /componentType|selectionRules|allowCustomization|freeModifierGroups/.test(entry || ''),
	    );
	  };
	
		  const handleCreateCombo = async () => {
	    if (!comboForm.name || !comboForm.basePrice) {
	      toast.error('Name and price are required');
	      return;
	    }
	    if (comboForm.items.length === 0) {
	      toast.error('Add at least one item to the combo');
	      return;
	    }
	    const invalidItemIndex = comboForm.items.findIndex((item) => !item.productId && !item.categoryId);
	    if (invalidItemIndex >= 0) {
	      toast.error(`Step ${invalidItemIndex + 1} needs a product or category before publishing.`);
	      setWizardStep(1);
	      return;
	    }

		    try {
	      try {
	        await api.combos.create(buildComboPayload(false, true));
	      } catch (error: any) {
	        if (!shouldRetryLegacyComboPayload(error)) throw error;
	        await api.combos.create(buildComboPayload(true, true));
	      }
	      toast.success('Combo created successfully');
	      setShowComboModal(false);
	      resetComboForm();
      loadCombos();
	    } catch (error: any) {
	      const message = error?.response?.data?.message;
	      toast.error(Array.isArray(message) ? message[0] : message || 'Failed to create combo');
	    }
	  };

  const handleUpdateCombo = async () => {
    if (!editingCombo) return;
    if (!comboForm.name || !comboForm.basePrice) {
      toast.error('Name and price are required');
      return;
    }
	    if (comboForm.items.length === 0) {
	      toast.error('Add at least one item to the combo');
	      return;
	    }
	    const invalidItemIndex = comboForm.items.findIndex((item) => !item.productId && !item.categoryId);
	    if (invalidItemIndex >= 0) {
	      toast.error(`Step ${invalidItemIndex + 1} needs a product or category before publishing.`);
	      setWizardStep(1);
	      return;
	    }
		    try {
	      try {
	        await api.combos.update(editingCombo.id, buildComboPayload(false, false));
	      } catch (error: any) {
	        if (!shouldRetryLegacyComboPayload(error)) throw error;
	        await api.combos.update(editingCombo.id, buildComboPayload(true, false));
	      }
	      toast.success('Combo updated successfully');
      setShowComboModal(false);
      setEditingCombo(null);
      resetComboForm();
      loadCombos();
	    } catch (error: any) {
	      const message = error?.response?.data?.message;
	      toast.error(Array.isArray(message) ? message[0] : message || 'Failed to update combo');
	    }
	  };

  const handleDeleteCombo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this combo?')) return;
    try {
      await api.combos.delete(id);
      toast.success('Combo deleted');
      loadCombos();
    } catch (error) {
      toast.error('Failed to delete combo');
    }
  };

  const handleDuplicateCombo = async (combo: any) => {
    try {
      await api.combos.duplicate(combo.id, `${combo.name} (Copy)`);
      toast.success('Combo duplicated');
      loadCombos();
    } catch (error) {
      toast.error('Failed to duplicate combo');
    }
  };

  const openEditCombo = (combo: any) => {
    setWizardStep(0);
    setEditingCombo(combo);
    setComboForm({
      name: combo.name,
      description: combo.description || '',
      sku: combo.sku || '',
      basePrice: combo.basePrice.toString(),
      retailValue: combo.retailValue.toString(),
      imageUrl: combo.imageUrl || '',
      isActive: combo.isActive,
      isFeatured: combo.isFeatured,
      prepTimeMinutes: combo.prepTimeMinutes,
      availableFrom: combo.availableFrom ? new Date(combo.availableFrom).toISOString().slice(0, 16) : '',
      availableTo: combo.availableTo ? new Date(combo.availableTo).toISOString().slice(0, 16) : '',
      availableDays: combo.availableDays || [],
      items: (combo.items || []).map((item: any) => ({
        ...item,
	        allowCustomization: item.allowCustomization ?? true,
	        maxIncludedToppings: item.maxIncludedToppings ?? 0,
	        freeModifierGroups: item.freeModifierGroups || [],
	        componentType: item.componentType || 'MENU_ITEM',
	        selectionRules: item.selectionRules || {},
	      })),
      galleryUrls: combo.galleryUrls || [],
    });
    setShowComboModal(true);
  };

  const openNewCombo = () => {
    setEditingCombo(null);
    resetComboForm();
    setShowComboModal(true);
  };

  const addComboItem = () => {
    setComboForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now().toString(),
          name: 'New Item',
          productId: null,
          categoryId: null,
	          quantity: 1,
	          componentType: 'MENU_ITEM',
	          selectionRules: {},
	          allowSizeSelection: true,
          defaultSizeId: null,
          allowModifiers: true,
          isProductFixed: true,
          includedModifierIds: [],
          productGroupLabel: '',
          sortOrder: prev.items.length,
          allowCustomization: true,
          maxIncludedToppings: 0,
          freeModifierGroups: [],
        },
      ],
    }));
  };

  const removeComboItem = (itemId: string) => {
    setComboForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId),
    }));
  };

	  const updateComboItem = (itemId: string, updates: any) => {
    setComboForm(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    }));
	  };

	  const updateComboItemRule = (itemId: string, updates: Record<string, any>) => {
	    setComboForm(prev => ({
	      ...prev,
	      items: prev.items.map(item =>
	        item.id === itemId
	          ? { ...item, selectionRules: { ...(item.selectionRules || {}), ...updates } }
	          : item
	      ),
	    }));
	  };

	  const getProductAddonSets = (productId?: string | null) => {
	    if (!productId) return [];
	    const product = getProductById(productId);
	    return product?.addonSets?.map((pas: any) => pas.addonSet).filter(Boolean) || [];
	  };

	  const toggleEligibleAddon = (itemId: string, addonId: string) => {
	    const item = comboForm.items.find(i => i.id === itemId);
	    const current = Array.isArray(item?.selectionRules?.eligibleAddonIds) ? item.selectionRules.eligibleAddonIds : [];
	    updateComboItemRule(itemId, {
	      eligibleAddonIds: current.includes(addonId)
	        ? current.filter((id: string) => id !== addonId)
	        : [...current, addonId],
	    });
	  };

	  const setAllEligibleAddons = (itemId: string, addonIds: string[]) => {
	    updateComboItemRule(itemId, { eligibleAddonIds: addonIds });
	  };

	  const getProductById = (productId?: string | null) =>
	    products.find((product) => product.id === productId);

	  const findCategoryByWords = (words: string[]) =>
	    categories.find((category) => {
	      const name = String(category.name || '').toLowerCase();
	      return words.some((word) => name.includes(word));
	    });

	  const findProductByWords = (words: string[]) =>
	    products.find((product) => {
	      const name = String(product.name || '').toLowerCase();
	      const categoryName = String(product.category?.name || '').toLowerCase();
	      return words.some((word) => name.includes(word) || categoryName.includes(word));
	    });

	  const makeComboItem = (overrides: Record<string, any>, sortOrder: number) => ({
	    id: `${Date.now()}-${sortOrder}`,
	    name: overrides.name || 'Selection',
	    productId: overrides.productId || null,
	    categoryId: overrides.categoryId || null,
	    quantity: overrides.quantity || 1,
	    componentType: overrides.componentType || 'MENU_ITEM',
	    selectionRules: {
	      customerSelectionMode: 'CUSTOMER_ELIGIBLE',
	      minSelections: 1,
	      maxSelections: 1,
	      includedSelections: overrides.maxIncludedToppings || 0,
	      ...(overrides.selectionRules || {}),
	    },
	    allowSizeSelection: overrides.allowSizeSelection ?? true,
	    defaultSizeId: overrides.defaultSizeId || null,
	    allowModifiers: overrides.allowModifiers ?? true,
	    isProductFixed: overrides.isProductFixed ?? false,
	    includedModifierIds: [],
	    productGroupLabel: overrides.productGroupLabel || '',
	    sortOrder,
	    allowCustomization: overrides.allowCustomization ?? true,
	    maxIncludedToppings: overrides.maxIncludedToppings || 0,
	    freeModifierGroups: [],
	  });

	  const applyQuickPreset = (presetId: string) => {
	    const pizzaCategory = findCategoryByWords(['pizza']);
	    const wingsCategory = findCategoryByWords(['wing']);
	    const sodaCategory = findCategoryByWords(['soda', 'drink', 'beverage']);
	    const defaultPizza = findProductByWords(['large cheese', 'cheese pizza', 'pizza']);
	    const defaultWings = findProductByWords(['jumbo wings', 'wings']);
	    const defaultSoda = findProductByWords(['2 liter', '2l', 'soda']);
	    const preset = QUICK_COMBO_PRESETS.find((p) => p.id === presetId);
	    if (!preset) return;

	    if (presetId === 'pizza-wings-soda') {
	      setComboForm((prev) => ({
	        ...prev,
	        name: prev.name || preset.title,
	        description: prev.description || preset.description,
	        basePrice: prev.basePrice || preset.price,
	        retailValue: prev.retailValue || preset.retailValue,
	        items: [
	          makeComboItem({
	            name: defaultPizza?.name || '14" Large Cheese Pizza',
	            productId: defaultPizza?.id || null,
	            categoryId: defaultPizza ? null : pizzaCategory?.id || null,
	            componentType: 'PIZZA',
	            isProductFixed: !!defaultPizza,
	            productGroupLabel: 'Choose your pizza',
	            maxIncludedToppings: 3,
	            selectionRules: {
	              requiredSize: '14" Large',
	              allowHalfAndHalf: true,
	              allowExtraSelections: true,
	              allowPremiumOptions: true,
	              countingMethod: 'TWO_HALVES_COUNT_ONE',
	            },
	          }, 0),
	          makeComboItem({
	            name: defaultWings?.name || '12 Jumbo Wings',
	            productId: defaultWings?.id || null,
	            categoryId: defaultWings ? null : wingsCategory?.id || null,
	            componentType: 'WINGS',
	            quantity: 12,
	            isProductFixed: !!defaultWings,
	            productGroupLabel: 'Choose wing flavor',
	            selectionRules: {
	              pieceCount: 12,
	              allowSplitFlavors: false,
	              sauceOnSideAllowed: true,
	            },
	          }, 1),
	          makeComboItem({
	            name: defaultSoda?.name || '2 Liter Soda',
	            productId: defaultSoda?.id || null,
	            categoryId: defaultSoda ? null : sodaCategory?.id || null,
	            componentType: 'SODA',
	            isProductFixed: !!defaultSoda,
	            productGroupLabel: 'Choose your 2 liter',
	            allowModifiers: false,
	            allowCustomization: false,
	            selectionRules: {
	              requiredSize: '2 Liter',
	              hideOutOfStock: true,
	            },
	          }, 2),
	        ],
	      }));
	      toast.success('Pizza + Wings + Soda template applied');
	      return;
	    }

	    setComboForm((prev) => ({
	      ...prev,
	      name: prev.name || preset.title,
	      description: prev.description || preset.description,
	      basePrice: prev.basePrice || preset.price,
	      retailValue: prev.retailValue || preset.retailValue,
	      items: [
	        makeComboItem({
	          name: 'Choose first item',
	          categoryId: pizzaCategory?.id || categories[0]?.id || null,
	          componentType: 'MENU_CATEGORY',
	          productGroupLabel: 'Choose first item',
	        }, 0),
	        makeComboItem({
	          name: 'Choose second item',
	          categoryId: wingsCategory?.id || categories[1]?.id || categories[0]?.id || null,
	          componentType: 'MENU_CATEGORY',
	          productGroupLabel: 'Choose second item',
	        }, 1),
	        makeComboItem({
	          name: 'Choose drink or side',
	          categoryId: sodaCategory?.id || categories[2]?.id || categories[0]?.id || null,
	          componentType: 'MENU_CATEGORY',
	          productGroupLabel: 'Choose drink or side',
	        }, 2),
	      ],
	    }));
	    toast.success(`${preset.title} template applied`);
	  };

  const getModifierGroupsForProduct = (productId?: string | null) => {
    if (!productId) return [];
    const product = getProductById(productId);
    return product?.modifiers?.map((pm: any) => pm.modifier).filter(Boolean) || [];
  };

  const toggleComboItemIncludedModifier = (itemId: string, modifierId: string) => {
    setComboForm(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== itemId) return item;
        const current = Array.isArray(item.includedModifierIds) ? item.includedModifierIds : [];
        const hasModifier = current.includes(modifierId);
        return {
          ...item,
          includedModifierIds: hasModifier
            ? current.filter((id: string) => id !== modifierId)
            : [...current, modifierId],
        };
      }),
    }));
  };

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search combos..."
            value={comboSearchQuery}
            onChange={(e) => setComboSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <button 
          onClick={openNewCombo}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          <Plus size={18} />
          Create Combo
        </button>
      </div>

      {combosLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-orange-600" size={32} />
        </div>
      ) : filteredCombos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Gift size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Combos Yet</h3>
          <p className="text-gray-500 mb-4">Create your first combo meal or deal package</p>
          <button 
            onClick={openNewCombo}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 inline-flex items-center gap-2"
          >
            <Plus size={18} />
            Create Combo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCombos.map((combo) => (
            <div key={combo.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-32 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                {(() => {
                  const imgUrl = combo.imageUrl?.startsWith('/') ? combo.imageUrl : `/${combo.imageUrl}`;
                  return combo.imageUrl ? (
                    <img 
                      src={imgUrl} 
                      alt={combo.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Image failed to load:', imgUrl);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Package className="text-gray-300" size={40} />
                  );
                })()}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{combo.name}</h3>
                    <p className="text-sm text-gray-500">{combo.items?.length || 0} items included</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    combo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {combo.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-gray-900">${Number(combo.basePrice).toFixed(2)}</p>
                    {combo.retailValue > combo.basePrice && (
                      <p className="text-xs text-gray-500 line-through">
                        ${Number(combo.retailValue).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditCombo(combo)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <Edit2 size={16} className="text-gray-400" />
                    </button>
                    <button onClick={() => handleDuplicateCombo(combo)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <Copy size={16} className="text-gray-400" />
                    </button>
                    <button onClick={() => handleDeleteCombo(combo.id)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showComboModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-6 backdrop-blur-sm" style={{ margin: 0, top: 0, left: 0 }}>
          <div className="bg-white rounded-[5px] shadow-2xl max-w-5xl w-full max-h-[85vh] flex flex-col overflow-hidden mx-auto">
            <div className="p-5 sm:p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingCombo ? 'Edit Combo' : 'Create New Combo'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1 max-w-xl">
                    Build the same step-by-step journey guests see in <strong>POS</strong> and <strong>online ordering</strong>. Order of steps matters.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowComboModal(false);
                    setEditingCombo(null);
                    resetComboForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors self-end sm:self-start"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {WIZARD_STEPS.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setWizardStep(s.id)}
                    className={`flex items-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all border-2 ${
                      wizardStep === s.id
                        ? 'border-orange-500 bg-orange-50 text-orange-950 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-orange-200'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        wizardStep === s.id ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span>
                      <span className="block font-bold leading-tight">{s.title}</span>
                      <span className="block text-[11px] text-gray-500 font-normal mt-0.5">{s.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-y-auto p-6 space-y-8 bg-gray-50/30" style={{ maxHeight: 'calc(92vh - 160px)' }}>
              {wizardStep === 0 && (
                <>
              <div className="grid grid-cols-3 gap-6 bg-white p-6 rounded-[5px] border border-gray-100 shadow-sm">
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Combo Name *</label>
                  <input
                    type="text"
                    value={comboForm.name}
                    onChange={(e) => setComboForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Family Feast"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-[5px] focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium text-gray-900"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">SKU (Optional)</label>
                  <input
                    type="text"
                    value={comboForm.sku}
                    onChange={(e) => setComboForm(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="e.g., COMBO-001"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-[5px] focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-gray-900"
                  />
                </div>
              </div>

              {/* Image Gallery Selection */}
              <div className="bg-white p-6 rounded-[5px] border border-gray-100 shadow-sm">
                <label className="block text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Select Combo Image</label>
                <div className="grid grid-cols-6 gap-4">
                  {[
                    { id: 'pizza-wings', url: '/images/pizza-wings-combo.png', name: 'Pizza & Wings' },
                    { id: 'sub-fries', url: '/images/sub-fries-combo.png', name: 'Sub & Fries' },
                    { id: 'family-feast', url: '/images/family-feast.png', name: 'Family Feast' },
                    { id: 'pepperoni', url: '/images/pepperoni.png', name: 'Pepperoni' },
                    { id: 'pasta', url: '/images/pasta.png', name: 'Pasta' },
                    { id: 'party-pack', url: '/images/family-feast.png', name: 'Party Pack' }
                  ].map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setComboForm(prev => ({ ...prev, imageUrl: img.url }))}
                      className={`relative group h-24 rounded-xl overflow-hidden border-2 transition-all ${
                        comboForm.imageUrl === img.url ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-transparent hover:border-gray-200'
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-red-50 to-amber-100" />
                      <img
                        src={img.url}
                        alt={img.name}
                        className="relative z-10 w-full h-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-1 px-2 z-20">
                        <p className="text-[10px] font-bold text-white uppercase truncate">{img.name}</p>
                      </div>
                      <div className={`absolute inset-0 bg-orange-600/10 transition-opacity ${comboForm.imageUrl === img.url ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                      {comboForm.imageUrl === img.url && (
                        <div className="absolute top-1 right-1 bg-orange-500 text-white rounded-full p-0.5 shadow-sm z-10">
                          <CheckCircle size={12} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-[5px] border border-gray-100 shadow-sm">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Description</label>
                  <textarea
                    value={comboForm.description}
                    onChange={(e) => setComboForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what's included in this combo..."
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-[5px] focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none text-gray-900"
                  />
              </div>
                </>
              )}

	              {wizardStep === 1 && (
	                <>
	              <div className="bg-white p-5 rounded-[5px] border border-gray-100 shadow-sm">
	                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-4">
	                  <div>
	                    <h3 className="text-lg font-bold text-gray-900">Start with a proven combo</h3>
	                    <p className="text-sm text-gray-500">
	                      Pick a guest-friendly template, then adjust products, categories, and free toppings.
	                    </p>
	                  </div>
	                  <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
	                    POS and online use this order
	                  </span>
	                </div>
	                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
	                  {QUICK_COMBO_PRESETS.map((preset) => (
	                    <button
	                      key={preset.id}
	                      type="button"
	                      onClick={() => applyQuickPreset(preset.id)}
	                      className="text-left rounded-[5px] border border-gray-200 bg-gray-50 p-4 hover:border-orange-300 hover:bg-orange-50 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500"
	                    >
	                      <span className="block text-sm font-black text-gray-900">{preset.title}</span>
	                      <span className="block mt-1 text-xs text-gray-500 leading-5">{preset.description}</span>
	                      <span className="mt-3 inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-bold text-orange-700 border border-orange-100">
	                        Starts at ${preset.price}
	                      </span>
	                    </button>
	                  ))}
	                </div>
	              </div>

	              {sortedComboItems.length > 0 && (
	                <div className="bg-white p-5 rounded-[5px] border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <LayoutList className="text-orange-600" size={18} />
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Guest journey preview</h3>
                  </div>
                  <ol className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-center list-none p-0 m-0">
                    {sortedComboItems.map((it, i) => (
                      <React.Fragment key={it.id}>
                        <li
                          className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-medium ${FLOW_STEP_STYLES[i % FLOW_STEP_STYLES.length]}`}
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/80 text-xs font-bold text-gray-800 border border-gray-200">
                            {i + 1}
                          </span>
                          <span className="max-w-[12rem] truncate">{it.name || 'Selection step'}</span>
                        </li>
                        {i < sortedComboItems.length - 1 && (
                          <ChevronRight className="hidden sm:block text-gray-400 shrink-0 mx-0.5" size={18} aria-hidden />
                        )}
                      </React.Fragment>
                    ))}
                  </ol>
                  <p className="text-xs text-gray-500 mt-4">
                    Reorder steps with the arrows on each line so POS and online match the guest flow.
                  </p>
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Package className="text-orange-600" size={20} />
	                    <h3 className="text-lg font-bold text-gray-900">Guest Selection Steps</h3>
	                  </div>
                  <button
                    onClick={addComboItem}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-[5px] hover:bg-orange-700 transition-all shadow-md shadow-orange-100 hover:shadow-orange-200"
                  >
                    <Plus size={18} />
	                    Add Step
                  </button>
                </div>

                {comboForm.items.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-[5px] border-2 border-dashed border-gray-200">
                    <Package size={32} className="mx-auto mb-2 text-gray-300" />
	                    <p className="text-sm text-gray-500">Choose a template above or add the first guest step.</p>
                    <button
                      onClick={addComboItem}
                      className="mt-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
	                      Add first step
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedComboItems.map((item, index) => (
                      <div key={item.id} className="bg-gray-50 rounded-[5px] p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col gap-1 shrink-0 pt-1">
                            <button
                              type="button"
                              aria-label="Move step up"
                              onClick={() => moveComboItem(item.id, 'up')}
                              disabled={index === 0}
                              className="p-1.5 rounded-[5px] border border-gray-200 bg-white text-gray-600 hover:bg-orange-50 hover:border-orange-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              type="button"
                              aria-label="Move step down"
                              onClick={() => moveComboItem(item.id, 'down')}
                              disabled={index === sortedComboItems.length - 1}
                              className="p-1.5 rounded-[5px] border border-gray-200 bg-white text-gray-600 hover:bg-orange-50 hover:border-orange-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ArrowDown size={16} />
                            </button>
                          </div>
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-900 mb-1">Item Name</label>
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateComboItem(item.id, { name: e.target.value })}
                                placeholder="e.g., Large Pizza"
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-[5px] focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-900 mb-1">Selection Type</label>
                              <select
                                value={item.isProductFixed ? 'fixed' : 'category'}
                                onChange={(e) =>
                                  updateComboItem(item.id, {
                                    isProductFixed: e.target.value === 'fixed',
                                    productId: e.target.value === 'fixed' ? item.productId : null,
                                    categoryId: e.target.value === 'category' ? item.categoryId : null,
                                    includedModifierIds: e.target.value === 'fixed' ? item.includedModifierIds || [] : [],
                                  })
                                }
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-[5px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900"
                              >
                                <option value="fixed">Fixed Product</option>
                                <option value="category">Choose from Category</option>
                              </select>
                            </div>
	                            <div>
	                              <label className="block text-xs font-medium text-gray-900 mb-1">Quantity</label>
	                              <select
                                value={item.quantity}
                                onChange={(e) => updateComboItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-[5px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900"
                              >
                                {[...Array(20)].map((_, i) => (
                                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                                ))}
	                              </select>
	                            </div>
	                            <div>
	                              <label className="block text-xs font-medium text-gray-900 mb-1">Component Type</label>
	                              <select
	                                value={item.componentType || 'MENU_ITEM'}
	                                onChange={(e) => updateComboItem(item.id, { componentType: e.target.value })}
	                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-[5px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900"
	                              >
	                                {COMPONENT_TYPES.map((type) => (
	                                  <option key={type.value} value={type.value}>{type.label}</option>
	                                ))}
	                              </select>
	                            </div>
	                            <div>
	                              <label className="block text-xs font-medium text-gray-900 mb-1">Product</label>
                              <select
                                value={item.productId || ''}
                                disabled={!item.isProductFixed}
                                onChange={(e) => {
                                  const selectedProduct = getProductById(e.target.value || null);
                                  updateComboItem(item.id, {
                                    productId: e.target.value || null,
                                    categoryId: null,
                                    name: selectedProduct?.name || item.name,
                                    includedModifierIds: [],
                                    defaultSizeId: null,
                                  });
                                }}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-[5px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white disabled:bg-gray-100 text-gray-900"
                              >
                                <option value="">Select product</option>
                                {categories.map((cat) => {
                                  const catProducts = products.filter(p => p.categoryId === cat.id || p.category?.id === cat.id);
                                  if (catProducts.length === 0) return null;
                                  return (
                                    <optgroup key={cat.id} label={cat.name}>
                                      {catProducts.map((product) => (
                                        <option key={product.id} value={product.id}>
                                          {product.name} - ${Number(product.basePrice || 0).toFixed(2)}
                                        </option>
                                      ))}
                                    </optgroup>
                                  );
                                })}
                                {products.filter(p => !p.categoryId && !p.category).length > 0 && (
                                  <optgroup label="Uncategorized">
                                    {products.filter(p => !p.categoryId && !p.category).map((product) => (
                                      <option key={product.id} value={product.id}>
                                        {product.name} - ${Number(product.basePrice || 0).toFixed(2)}
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                              </select>
                              {item.productId && getProductById(item.productId) && (
                                <p className="text-xs text-emerald-600 font-semibold mt-1">
                                  Price: ${Number(getProductById(item.productId)?.basePrice || 0).toFixed(2)} x {item.quantity || 1} = ${(Number(getProductById(item.productId)?.basePrice || 0) * (item.quantity || 1)).toFixed(2)}
                                </p>
                              )}
                            </div>
                            {item.isProductFixed && getProductById(item.productId)?.sizes?.length > 0 && (
                              <div>
                                <label className="block text-xs font-medium text-gray-900 mb-1">Product Size</label>
                                <select
                                  value={item.defaultSizeId || ''}
                                  onChange={(e) => updateComboItem(item.id, { defaultSizeId: e.target.value || null })}
                                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-[5px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900"
                                >
                                  <option value="">Any Size / Default</option>
                                  {getProductById(item.productId)?.sizes.map((size: any) => (
                                    <option key={size.id} value={size.id}>{size.name} (+${Number(size.priceAdjustment || 0).toFixed(2)})</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            <div>
                              <label className="block text-xs font-medium text-gray-900 mb-1">Category</label>
                              <select
                                value={item.categoryId || ''}
                                disabled={item.isProductFixed}
                                onChange={(e) => {
                                  const selectedCategory = categories.find((category) => category.id === e.target.value);
                                  updateComboItem(item.id, {
                                    categoryId: e.target.value || null,
                                    productId: null,
                                    name: selectedCategory?.name ? `Choose ${selectedCategory.name}` : item.name,
                                  });
                                }}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-[5px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white disabled:bg-gray-100 text-gray-900"
                              >
                                <option value="">Select category</option>
                                {categories.map((category) => (
                                  <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs font-medium text-gray-900 mb-1">Selection Label</label>
                              <input
                                type="text"
                                value={item.productGroupLabel || ''}
                                onChange={(e) => updateComboItem(item.id, { productGroupLabel: e.target.value })}
                                placeholder="e.g., Choose Your Pizza"
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-[5px] focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => removeComboItem(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-[5px] transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

	                        <div className="flex flex-wrap gap-3 mt-3">
	                          <label className="flex select-none items-center gap-2 rounded-[5px] border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 cursor-pointer hover:border-orange-200 hover:bg-orange-50">
	                            <input
	                              type="checkbox"
	                              checked={item.allowSizeSelection}
	                              onChange={(e) => updateComboItem(item.id, { allowSizeSelection: e.target.checked })}
	                              className="rounded border-gray-300 accent-orange-600 focus:ring-orange-500"
	                            />
	                            Allow size selection
	                          </label>
	                          <label className="flex select-none items-center gap-2 rounded-[5px] border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 cursor-pointer hover:border-orange-200 hover:bg-orange-50">
	                            <input
	                              type="checkbox"
	                              checked={item.allowModifiers}
	                              onChange={(e) => updateComboItem(item.id, { allowModifiers: e.target.checked })}
	                              className="rounded border-gray-300 accent-orange-600 focus:ring-orange-500"
	                            />
	                            Allow modifiers
	                          </label>
                        </div>
	                        {item.isProductFixed && item.allowModifiers && (
	                          <div className="mt-3 space-y-3">
                            <div className="rounded-[5px] border border-gray-200 bg-white p-3">
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold text-gray-900 uppercase">Customization Settings</p>
	                                <label className="flex select-none items-center gap-2 cursor-pointer">
	                                  <input
	                                    type="checkbox"
	                                    checked={item.allowCustomization}
	                                    onChange={(e) => updateComboItem(item.id, { allowCustomization: e.target.checked })}
	                                    className="rounded border-gray-300 accent-orange-600 focus:ring-orange-500"
	                                  />
	                                  <span className="text-xs font-medium text-gray-700">Enable BYO Customization</span>
                                </label>
                              </div>

                              {item.allowCustomization && (
                                <div className="grid grid-cols-2 gap-4 mt-2 pt-3 border-t border-gray-100">
                                  <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Max Free Toppings</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={item.maxIncludedToppings}
                                      onChange={(e) => updateComboItem(item.id, { maxIncludedToppings: parseInt(e.target.value) || 0 })}
                                      className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-[5px] focus:ring-1 focus:ring-orange-500"
                                    />
                                    <p className="text-[9px] text-gray-400 mt-1">0 = All toppings charged extra</p>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Free Modifier Groups</label>
                                    <div className="text-[10px] text-gray-400">Selected: {(item.freeModifierGroups || []).length} groups</div>
                                    <p className="text-[9px] text-gray-400">Sauce, Cheese, etc. that don't count towards max.</p>
                                  </div>
	                          </div>
	                        )}
	                        <div className="mt-3 rounded-[5px] border border-orange-100 bg-white p-3">
	                          <div className="flex items-center justify-between gap-3 mb-3">
	                            <div>
	                              <p className="text-xs font-bold text-gray-900 uppercase">Combo Builder Rules</p>
	                              <p className="text-[10px] text-gray-500">Rules used by POS and online customer selection.</p>
	                            </div>
	                            <span className="px-2 py-1 rounded-[5px] bg-orange-50 text-[10px] font-bold text-orange-700 uppercase">
	                              {COMPONENT_TYPES.find(type => type.value === (item.componentType || 'MENU_ITEM'))?.label}
	                            </span>
	                          </div>

	                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
	                            <div className="col-span-2">
	                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Customer Selection</label>
	                              <select
	                                value={item.selectionRules?.customerSelectionMode || 'CUSTOMER_ELIGIBLE'}
	                                onChange={(e) => updateComboItemRule(item.id, { customerSelectionMode: e.target.value })}
	                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-[5px] focus:ring-1 focus:ring-orange-500 bg-white text-gray-900"
	                              >
	                                {CUSTOMER_SELECTION_MODES.map((mode) => (
	                                  <option key={mode.value} value={mode.value}>{mode.label}</option>
	                                ))}
	                              </select>
	                            </div>
	                            <div>
	                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Min Select</label>
	                              <input
	                                type="number"
	                                min="0"
	                                value={item.selectionRules?.minSelections ?? 1}
	                                onChange={(e) => updateComboItemRule(item.id, { minSelections: parseInt(e.target.value) || 0 })}
	                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-[5px] focus:ring-1 focus:ring-orange-500"
	                              />
	                            </div>
	                            <div>
	                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Max Select</label>
	                              <input
	                                type="number"
	                                min="0"
	                                value={item.selectionRules?.maxSelections ?? 1}
	                                onChange={(e) => updateComboItemRule(item.id, { maxSelections: parseInt(e.target.value) || 0 })}
	                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-[5px] focus:ring-1 focus:ring-orange-500"
	                              />
	                            </div>
	                            <div>
	                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Included</label>
	                              <input
	                                type="number"
	                                min="0"
	                                value={item.selectionRules?.includedSelections ?? item.maxIncludedToppings ?? 0}
	                                onChange={(e) => {
	                                  const includedSelections = parseInt(e.target.value) || 0;
	                                  updateComboItem(item.id, { maxIncludedToppings: includedSelections });
	                                  updateComboItemRule(item.id, { includedSelections });
	                                }}
	                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-[5px] focus:ring-1 focus:ring-orange-500"
	                              />
	                            </div>
	                            <div>
	                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
	                                {item.componentType === 'WINGS' ? 'Pieces' : item.componentType === 'SODA' ? 'Required Size' : 'Required Size'}
	                              </label>
	                              <input
	                                type={item.componentType === 'WINGS' ? 'number' : 'text'}
	                                min="1"
	                                value={item.componentType === 'WINGS'
	                                  ? item.selectionRules?.pieceCount ?? item.quantity ?? 10
	                                  : item.selectionRules?.requiredSize || ''}
	                                onChange={(e) =>
	                                  updateComboItemRule(
	                                    item.id,
	                                    item.componentType === 'WINGS'
	                                      ? { pieceCount: parseInt(e.target.value) || 1 }
	                                      : { requiredSize: e.target.value }
	                                  )
	                                }
	                                placeholder={item.componentType === 'SODA' ? '2 Liter' : item.componentType === 'PIZZA' ? 'Large' : ''}
	                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-[5px] focus:ring-1 focus:ring-orange-500"
	                              />
	                            </div>
	                          </div>

	                          {item.componentType === 'PIZZA' && (
	                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-100">
		                              <label className="flex select-none items-center gap-2 rounded-[5px] border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-900 cursor-pointer">
		                                <input
		                                  type="checkbox"
		                                  checked={item.selectionRules?.allowExtraSelections ?? true}
		                                  onChange={(e) => updateComboItemRule(item.id, { allowExtraSelections: e.target.checked })}
		                                  className="rounded border-gray-300 accent-orange-600 focus:ring-orange-500"
		                                />
		                                Extra toppings
		                              </label>
		                              <label className="flex select-none items-center gap-2 rounded-[5px] border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-900 cursor-pointer">
		                                <input
		                                  type="checkbox"
		                                  checked={!!item.selectionRules?.allowHalfAndHalf}
		                                  onChange={(e) => updateComboItemRule(item.id, { allowHalfAndHalf: e.target.checked })}
		                                  className="rounded border-gray-300 accent-orange-600 focus:ring-orange-500"
		                                />
		                                Half and half
		                              </label>
		                              <label className="flex select-none items-center gap-2 rounded-[5px] border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-900 cursor-pointer">
		                                <input
		                                  type="checkbox"
		                                  checked={!!item.selectionRules?.allowPremiumOptions}
		                                  onChange={(e) => updateComboItemRule(item.id, { allowPremiumOptions: e.target.checked })}
		                                  className="rounded border-gray-300 accent-orange-600 focus:ring-orange-500"
		                                />
		                                Premium toppings
	                              </label>
	                              <div>
	                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Counting Method</label>
	                                <select
	                                  value={item.selectionRules?.countingMethod || 'EVERY_SELECTION_COUNTS_ONE'}
	                                  onChange={(e) => updateComboItemRule(item.id, { countingMethod: e.target.value })}
	                                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-[5px] bg-white"
	                                >
	                                  {TOPPING_COUNTING_METHODS.map((method) => (
	                                    <option key={method.value} value={method.value}>{method.label}</option>
	                                  ))}
	                                </select>
	                              </div>
	                            </div>
	                          )}

	                          {(item.componentType === 'WINGS' || item.componentType === 'SODA') && (
	                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-100">
	                              {item.componentType === 'WINGS' && (
	                                <>
		                                  <label className="flex select-none items-center gap-2 rounded-[5px] border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-900 cursor-pointer">
		                                    <input
		                                      type="checkbox"
		                                      checked={!!item.selectionRules?.allowSplitFlavors}
		                                      onChange={(e) => updateComboItemRule(item.id, { allowSplitFlavors: e.target.checked })}
		                                      className="rounded border-gray-300 accent-orange-600 focus:ring-orange-500"
		                                    />
		                                    Split flavors
		                                  </label>
		                                  <label className="flex select-none items-center gap-2 rounded-[5px] border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-900 cursor-pointer">
		                                    <input
		                                      type="checkbox"
		                                      checked={!!item.selectionRules?.sauceOnSideAllowed}
		                                      onChange={(e) => updateComboItemRule(item.id, { sauceOnSideAllowed: e.target.checked })}
		                                      className="rounded border-gray-300 accent-orange-600 focus:ring-orange-500"
		                                    />
		                                    Sauce on side
	                                  </label>
	                                </>
	                              )}
	                              {item.componentType === 'SODA' && (
	                                <>
		                                  <label className="flex select-none items-center gap-2 rounded-[5px] border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-900 cursor-pointer">
		                                    <input
		                                      type="checkbox"
		                                      checked={item.selectionRules?.hideOutOfStock ?? true}
		                                      onChange={(e) => updateComboItemRule(item.id, { hideOutOfStock: e.target.checked })}
		                                      className="rounded border-gray-300 accent-orange-600 focus:ring-orange-500"
		                                    />
		                                    Hide out of stock
		                                  </label>
		                                  <label className="flex select-none items-center gap-2 rounded-[5px] border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-900 cursor-pointer">
		                                    <input
		                                      type="checkbox"
		                                      checked={!!item.selectionRules?.allowSubstitution}
		                                      onChange={(e) => updateComboItemRule(item.id, { allowSubstitution: e.target.checked })}
		                                      className="rounded border-gray-300 accent-orange-600 focus:ring-orange-500"
		                                    />
		                                    Substitution allowed
	                                  </label>
	                                </>
	                              )}
	                            </div>
	                          )}

	                          {item.isProductFixed && getProductAddonSets(item.productId).length > 0 && (
	                            <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
	                              <div className="flex items-center justify-between">
	                                <p className="text-[10px] font-bold text-gray-500 uppercase">Eligible Add-ons</p>
	                                <div className="flex gap-2">
	                                  <button
	                                    type="button"
	                                    onClick={() => setAllEligibleAddons(item.id, getProductAddonSets(item.productId).flatMap((set: any) => set.addons.map((sa: any) => sa.addon.id)))}
	                                    className="text-[10px] font-bold text-orange-700 hover:text-orange-800"
	                                  >
	                                    Select all
	                                  </button>
	                                  <button
	                                    type="button"
	                                    onClick={() => setAllEligibleAddons(item.id, [])}
	                                    className="text-[10px] font-bold text-gray-500 hover:text-gray-700"
	                                  >
	                                    Clear
	                                  </button>
	                                </div>
	                              </div>
	                              {getProductAddonSets(item.productId).map((set: any) => (
	                                <div key={set.id} className="rounded-[5px] bg-gray-50 p-2">
	                                  <p className="text-xs font-semibold text-gray-800 mb-2">{set.name}</p>
	                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
	                                    {set.addons.map((sa: any) => {
	                                      const addon = sa.addon;
	                                      const eligible = item.selectionRules?.eligibleAddonIds || [];
	                                      return (
	                                        <label key={addon.id} className="flex items-center justify-between gap-2 rounded-[5px] bg-white border border-gray-100 px-2 py-1.5 text-xs cursor-pointer">
	                                          <span className="flex items-center gap-2 min-w-0">
	                                            <input
	                                              type="checkbox"
	                                              checked={eligible.includes(addon.id)}
	                                              onChange={() => toggleEligibleAddon(item.id, addon.id)}
	                                              className="rounded text-orange-600 focus:ring-orange-500"
	                                            />
	                                            <span className="truncate">{addon.name}</span>
	                                          </span>
	                                          <span className={`shrink-0 text-[9px] font-bold uppercase ${addon.category === 'PREMIUM' ? 'text-purple-700' : 'text-gray-400'}`}>
	                                            {addon.category === 'PREMIUM' ? 'Premium' : addon.isActive ? 'Active' : 'Inactive'}
	                                          </span>
	                                        </label>
	                                      );
	                                    })}
	                                  </div>
	                                </div>
	                              ))}
	                            </div>
	                          )}
	                        </div>
	                      </div>

                            <div className="rounded-[5px] border border-gray-200 bg-white p-3">
                              <p className="text-xs font-bold text-gray-900 mb-2 uppercase">Legacy Modifier Groups (Included in Price)</p>
                              {getModifierGroupsForProduct(item.productId).length === 0 ? (
                                <p className="text-xs text-gray-500">No modifier groups found for this product.</p>
                              ) : (
                                <div className="grid grid-cols-2 gap-2">
                                  {getModifierGroupsForProduct(item.productId).map((modifier: any) => (
                                    <label key={modifier.id} className="flex items-center gap-2 text-xs cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={(item.includedModifierIds || []).includes(modifier.id)}
                                        onChange={() => toggleComboItemIncludedModifier(item.id, modifier.id)}
                                        className="rounded text-orange-600 focus:ring-orange-500"
                                      />
                                      <span>{modifier.name}</span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
                </>
              )}

              {wizardStep === 2 && (
                <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Combo Price *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="number"
                      step="0.01"
                      value={comboForm.basePrice}
                      onChange={(e) => setComboForm(prev => ({ ...prev, basePrice: e.target.value }))}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-[5px] focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-bold text-orange-600 text-lg"
                    />
                  </div>
                  {suggestedComboPrice > 0 && !comboForm.basePrice && (
                    <button
                      type="button"
                      onClick={() => setComboForm(prev => ({ ...prev, basePrice: suggestedComboPrice.toFixed(2), retailValue: suggestedPrice.toFixed(2) }))}
                      className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                    >
                      <Zap size={12} />
                      Use suggested: ${suggestedComboPrice.toFixed(2)}
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Retail Value</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="number"
                      step="0.01"
                      value={comboForm.retailValue}
                      onChange={(e) => setComboForm(prev => ({ ...prev, retailValue: e.target.value }))}
                      placeholder={suggestedPrice > 0 ? suggestedPrice.toFixed(2) : '0.00'}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-[5px] focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-gray-900"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold">Marketing savings display</p>
                  {suggestedPrice > 0 && !comboForm.retailValue && (
                    <button
                      type="button"
                      onClick={() => setComboForm(prev => ({ ...prev, retailValue: suggestedPrice.toFixed(2) }))}
                      className="mt-0.5 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      <TrendingDown size={12} />
                      Auto-fill: ${suggestedPrice.toFixed(2)}
                    </button>
                  )}
                </div>
              </div>

              {suggestedPrice > 0 && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-[5px] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <TrendingDown className="text-emerald-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-800">Smart Price Suggestion</p>
                      <p className="text-xs text-emerald-600">Items total: <strong>${suggestedPrice.toFixed(2)}</strong> &rarr; Suggested combo: <strong>${suggestedComboPrice.toFixed(2)}</strong> (12% off)</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setComboForm(prev => ({ ...prev, basePrice: suggestedComboPrice.toFixed(2), retailValue: suggestedPrice.toFixed(2) }))}
                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-[5px] hover:bg-emerald-700 transition-colors shrink-0"
                  >
                    Apply Prices
                  </button>
                </div>
              )}

              <div className="bg-white p-5 rounded-[5px] border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="text-indigo-600" size={18} />
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Availability Schedule</h3>
                  <span className="text-xs text-gray-400 ml-1">(optional)</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Available From</label>
                    <input
                      type="datetime-local"
                      value={comboForm.availableFrom}
                      onChange={(e) => setComboForm(prev => ({ ...prev, availableFrom: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-[5px] focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Available Until</label>
                    <input
                      type="datetime-local"
                      value={comboForm.availableTo}
                      onChange={(e) => setComboForm(prev => ({ ...prev, availableTo: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-[5px] focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Available Days</label>
                  <div className="flex flex-wrap gap-2">
                    {DAY_NAMES.map((day, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setComboForm(prev => ({
                            ...prev,
                            availableDays: prev.availableDays.includes(i)
                              ? prev.availableDays.filter(d => d !== i)
                              : [...prev.availableDays, i],
                          }));
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-[5px] border transition-all ${
                          comboForm.availableDays.includes(i)
                            ? 'bg-orange-600 text-white border-orange-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                    {comboForm.availableDays.length === 0 && (
                      <span className="text-xs text-gray-400 ml-2 self-center">All days (none selected = always available)</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-[5px] border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Review</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>
                    <span className="font-semibold text-gray-900">Name:</span>{' '}
                    {comboForm.name.trim() ? comboForm.name : '—'}
                  </li>
                  <li>
                    <span className="font-semibold text-gray-900">Selection steps:</span> {comboForm.items.length}
                  </li>
                  <li>
                    <span className="font-semibold text-gray-900">Combo price:</span>{' '}
                    {comboForm.basePrice ? `$${Number(comboForm.basePrice).toFixed(2)}` : '—'}
                  </li>
                  <li>
                    <span className="font-semibold text-gray-900">Retail value:</span>{' '}
                    {comboForm.retailValue
                      ? `$${Number(comboForm.retailValue).toFixed(2)}`
                      : suggestedPrice > 0
                        ? `(suggested $${suggestedPrice.toFixed(2)})`
                        : '—'}
                  </li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-8 bg-white p-5 rounded-[5px] border border-gray-100 shadow-sm">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={comboForm.isActive}
                      onChange={(e) => setComboForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-green-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                  </div>
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Active on POS</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={comboForm.isFeatured}
                      onChange={(e) => setComboForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-orange-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                  </div>
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Featured Deal</span>
                </label>
              </div>
                </>
              )}
            </div>

            <div className="sticky bottom-0 p-6 border-t border-gray-100 flex items-center justify-between bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
              <button
                type="button"
                onClick={() => {
                  setShowComboModal(false);
                  setEditingCombo(null);
                  resetComboForm();
                }}
                className="px-6 py-2.5 text-gray-900 hover:text-gray-700 font-bold uppercase tracking-wide text-sm transition-colors"
              >
                Discard Changes
              </button>

              <div className="flex items-center gap-3">
                {wizardStep > 0 && (
                  <button
                    type="button"
                    onClick={goPrevWizard}
                    className="px-5 py-2.5 border border-gray-200 rounded-[5px] text-gray-800 font-bold uppercase tracking-wide text-sm hover:bg-gray-50 flex items-center gap-1"
                  >
                    <ChevronLeft size={18} />
                    Back
                  </button>
                )}
                {wizardStep < 2 && (
                  <button
                    type="button"
                    onClick={goNextWizard}
                    className="px-6 py-2.5 bg-orange-600 text-white rounded-[5px] hover:bg-orange-700 font-bold uppercase tracking-wide text-sm flex items-center gap-1"
                  >
                    Next
                    <ChevronRight size={18} />
                  </button>
                )}
                {wizardStep === 2 && (
                  <button
                    type="button"
                    onClick={editingCombo ? handleUpdateCombo : handleCreateCombo}
                    className="px-8 py-2.5 bg-orange-600 text-white rounded-[5px] hover:bg-orange-700 transition-all flex items-center gap-2 font-bold shadow-lg shadow-orange-100 uppercase tracking-wide text-sm"
                  >
                    <CheckCircle size={18} />
                    {editingCombo ? 'Save Combo Changes' : 'Publish New Combo'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CombosTab;
