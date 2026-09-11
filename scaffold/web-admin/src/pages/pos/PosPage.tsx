import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, Clock } from 'lucide-react';
import { 
  PosBackground, 
  PosHeader, 
  PosSkeleton, 
  PosCategoryGrid, 
  PosSubcategoryGrid, 
  PosComboGrid, 
  PosComboModal,
  CategoryNav,
  ProductGrid,
  AddOnPanel,
  OrderCart,
  PaymentModal,
  OrderTypeModal,
  BuildYourOwnPizza,
  BuildYourOwnSub,
  BuildYourOwnPasta,
  BuildYourOwnRicePlatter,
  BuildYourOwnSalad,
  RicePlattersMenu,
  SaladsMenu,
  WingsMenu,
  SidesMenu,
  OrdersModal,
  RecallModal
} from './components';
import { api } from '../../services/api';
import { useStore } from '../../hooks/useStore';
import { 
  CartItem, 
  CartModifier, 
  OrderType, 
  PaymentData, 
  MenuCategory 
} from './types';
import { 
  MENU_STRUCTURE, 
  CATEGORY_NAME_ALIASES, 
  MENU_GROUP_SETTINGS_KEY, 
  MENU_GROUP_CATEGORY_IDS, 
  DEFAULT_MENU_GROUP_STATE, 
  NON_PRODUCT_SUBCATEGORIES, 
  FALLBACK_SUBCATEGORY_ITEMS,
  MenuGroupId,
  MenuGroupState
} from './constants';
import { 
  generateSearchItems, 
  normalizeText, 
  buildFallbackProductsForSubcategory 
} from './utils';

interface OrderSchedule {
  isScheduled: boolean;
  scheduledFor?: string;
}

const renderCategoryIcon = (category: MenuCategory, size: 'sm' | 'lg' = 'sm') => {
  if (category.id !== 'RICE_PLATTER') {
    return <span>{category.icon}</span>;
  }

  const wrapClass = size === 'lg' ? 'w-10 h-10' : 'w-5 h-5';
  const bowlClass = size === 'lg' ? 'w-7 h-4 border-2' : 'w-4 h-2.5 border';
  const steamClass = size === 'lg' ? 'w-1 h-2' : 'w-0.5 h-1.5';

  return (
    <span className={`inline-flex items-center justify-center rounded-full bg-white/20 ${wrapClass}`}>
      <span className={`relative ${bowlClass} rounded-b-full border-white`}>
        <span className={`absolute -top-2 left-1 ${steamClass} rounded-full bg-white/90`} />
        <span className={`absolute -top-2 right-1 ${steamClass} rounded-full bg-white/90`} />
      </span>
    </span>
  );
};

const PosPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentStore } = useStore();
  
  // Sync store ID to localStorage for KDS
  useEffect(() => {
    if (currentStore?.id) {
      localStorage.setItem('kds-store-id', currentStore.id);
      console.log('Store ID synced to localStorage:', currentStore.id);
    }
  }, [currentStore]);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [tableNumber, setTableNumber] = useState<string>('');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', loyaltyPoints: 0, referralCode: '' });
  const [deliveryAddress, setDeliveryAddress] = useState<any>(null);
  const [orderSchedule, setOrderSchedule] = useState<OrderSchedule>({ isScheduled: false });
  const [showPayment, setShowPayment] = useState(false);
  const [showOrderType, setShowOrderType] = useState(false);
  const [showBuildPizza, setShowBuildPizza] = useState(false);
  const [showBuildSub, setShowBuildSub] = useState(false);
  const [showBuildPasta, setShowBuildPasta] = useState(false);
  const [showBuildRicePlatter, setShowBuildRicePlatter] = useState(false);
  const [showBuildSalad, setShowBuildSalad] = useState(false);
  const [showWings, setShowWings] = useState(false);
  const [showSides, setShowSides] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showRecallModal, setShowRecallModal] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<any | null>(null);
  const [showComboModal, setShowComboModal] = useState(false);
  const [discount, setDiscount] = useState<{ type: 'percentage' | 'fixed'; value: number } | null>(null);
  const [suspendedOrders, setSuspendedOrders] = useState<any[]>([]);
  const [topControlsHost, setTopControlsHost] = useState<HTMLElement | null>(null);
  const [menuGroupState, setMenuGroupState] = useState<MenuGroupState>(DEFAULT_MENU_GROUP_STATE);

  useEffect(() => {
    setTopControlsHost(document.getElementById('pos-top-controls'));
  }, []);

  useEffect(() => {
    if (!currentStore?.id) {
      setMenuGroupState(DEFAULT_MENU_GROUP_STATE);
      return;
    }
    const loadMenuGroupState = () => {
      try {
        const raw = localStorage.getItem(MENU_GROUP_SETTINGS_KEY);
        if (!raw) {
          setMenuGroupState(DEFAULT_MENU_GROUP_STATE);
          return;
        }
        const parsed = JSON.parse(raw) as Record<string, Partial<MenuGroupState>>;
        const storeConfig = parsed[currentStore.id] || {};
        setMenuGroupState({
          fastFood: storeConfig.fastFood ?? true,
          desi: storeConfig.desi ?? true,
          gyro: storeConfig.gyro ?? true,
        });
      } catch {
        setMenuGroupState(DEFAULT_MENU_GROUP_STATE);
      }
    };

    loadMenuGroupState();
    window.addEventListener('storage', loadMenuGroupState);
    window.addEventListener('pos-menu-groups-updated', loadMenuGroupState);
    window.addEventListener('focus', loadMenuGroupState);
    return () => {
      window.removeEventListener('storage', loadMenuGroupState);
      window.removeEventListener('pos-menu-groups-updated', loadMenuGroupState);
      window.removeEventListener('focus', loadMenuGroupState);
    };
  }, [currentStore?.id]);

  // Load suspended orders from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pos-suspended-orders');
    if (saved) {
      try {
        setSuspendedOrders(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse suspended orders', e);
      }
    }
  }, []);

  // ===== Keyboard shortcuts =====
  //
  // POS cashiers hammer keys once they build muscle memory. These shortcuts mirror
  // common register conventions:
  //   F1  Find Orders         F2  Recall
  //   F3  Order Type modal    F9  Pay (only if cart has items)
  //   Esc Close any open modal
  //
  // Shortcuts intentionally do nothing when the user is mid-typing in an <input>,
  // <textarea>, or contentEditable element so they don't fight with on-screen forms.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isEditable =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        (target?.isContentEditable ?? false);

      if (e.key === 'Escape') {
        // Always honour Escape to close modals — even from inside form fields.
        if (showPayment) { setShowPayment(false); e.preventDefault(); return; }
        if (showOrderType) { setShowOrderType(false); e.preventDefault(); return; }
        if (showOrdersModal) { setShowOrdersModal(false); e.preventDefault(); return; }
        if (showRecallModal) { setShowRecallModal(false); e.preventDefault(); return; }
        if (showBuildPizza) { setShowBuildPizza(false); e.preventDefault(); return; }
        if (showBuildSub) { setShowBuildSub(false); e.preventDefault(); return; }
        if (showBuildPasta) { setShowBuildPasta(false); e.preventDefault(); return; }
        if (showBuildSalad) { setShowBuildSalad(false); e.preventDefault(); return; }
        if (showBuildRicePlatter) { setShowBuildRicePlatter(false); e.preventDefault(); return; }
        if (showWings) { setShowWings(false); e.preventDefault(); return; }
        if (showSides) { setShowSides(false); e.preventDefault(); return; }
        if (showComboModal) { setShowComboModal(false); setSelectedCombo(null); e.preventDefault(); return; }
        return;
      }

      if (isEditable) return;

      switch (e.key) {
        case 'F1':
          e.preventDefault();
          setShowOrdersModal((v) => !v);
          break;
        case 'F2':
          e.preventDefault();
          setShowRecallModal((v) => !v);
          break;
        case 'F3':
          e.preventDefault();
          setShowOrderType((v) => !v);
          break;
        case 'F9':
          e.preventDefault();
          if (cart.length > 0 && orderType) setShowPayment(true);
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    showPayment,
    showOrderType,
    showOrdersModal,
    showRecallModal,
    showBuildPizza,
    showBuildSub,
    showBuildPasta,
    showBuildSalad,
    showBuildRicePlatter,
    showWings,
    showSides,
    showComboModal,
    cart.length,
    orderType,
  ]);

  const visibleCategoryIds = useMemo(() => {
    const ids = new Set<string>();
    (Object.keys(MENU_GROUP_CATEGORY_IDS) as MenuGroupId[]).forEach((groupId) => {
      if (menuGroupState[groupId]) {
        MENU_GROUP_CATEGORY_IDS[groupId].forEach((categoryId) => ids.add(categoryId));
      }
    });
    return ids;
  }, [menuGroupState]);

  const visibleMenuStructure = useMemo(
    () => MENU_STRUCTURE.filter((category) => visibleCategoryIds.has(category.id)),
    [visibleCategoryIds],
  );
  
  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', currentStore?.id],
    queryFn: () => api.menu.getCategories(currentStore!.id),
    enabled: !!currentStore,
  });
  const categories = categoriesData?.data || [];

  const selectedMenuCategory = useMemo(
    () => visibleMenuStructure.find((c) => c.id === selectedCategory) || null,
    [selectedCategory, visibleMenuStructure],
  );

  const selectedSubcategoryName = useMemo(
    () => selectedMenuCategory?.subcategories.find((s) => s.id === selectedSubcategory)?.name || null,
    [selectedMenuCategory, selectedSubcategory],
  );

  const resolvedCategoryId = useMemo(() => {
    if (!selectedCategory || !categories.length) return null;
    const aliases = CATEGORY_NAME_ALIASES[selectedCategory] || [];
    const selectedName = normalizeText(selectedMenuCategory?.name || selectedCategory);
    const aliasSet = new Set([selectedName, ...aliases.map(normalizeText)]);

    const matched = categories.find((category: any) => {
      const categoryName = normalizeText(category?.name);
      return aliasSet.has(categoryName);
    });

    return matched?.id || null;
  }, [selectedCategory, selectedMenuCategory, categories]);
  
  // Fetch products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', currentStore?.id, selectedCategory, selectedSubcategory, resolvedCategoryId],
    queryFn: () => api.menu.getProducts({
      storeId: currentStore!.id,
      categoryId: resolvedCategoryId || undefined,
    }),
    enabled: !!currentStore,
  });
  const allProducts = productsData?.data || [];
  const visibleProducts = useMemo(() => {
    if (!visibleMenuStructure.length) return allProducts;
    return allProducts.filter((product: any) => {
      const productCategoryName = normalizeText(product?.category?.name);
      if (!productCategoryName) return true;
      return visibleMenuStructure.some((menuCategory) => {
        const aliases = CATEGORY_NAME_ALIASES[menuCategory.id] || [];
        const tokens = [menuCategory.name, ...aliases].map(normalizeText);
        return tokens.some(
          (token) =>
            productCategoryName === token ||
            productCategoryName.includes(token) ||
            token.includes(productCategoryName),
        );
      });
    });
  }, [allProducts, visibleMenuStructure]);

  const products = useMemo(() => {
    if (!selectedCategory) {
      return visibleProducts;
    }

    let filtered = [...visibleProducts];

    // If backend category id could not be resolved, fallback to category-name filtering.
    if (!resolvedCategoryId && selectedMenuCategory) {
      const selectedCategoryName = normalizeText(selectedMenuCategory.name);
      filtered = filtered.filter((product: any) => {
        const productCategoryName = normalizeText(product?.category?.name);
        return (
          productCategoryName === selectedCategoryName ||
          productCategoryName.includes(selectedCategoryName) ||
          selectedCategoryName.includes(productCategoryName)
        );
      });
    }

    // Apply subcategory filter only for real product subcategories.
    if (
      selectedSubcategory &&
      selectedSubcategoryName &&
      !NON_PRODUCT_SUBCATEGORIES.has(selectedSubcategory)
    ) {
      const subcategoryTokens = [
        normalizeText(selectedSubcategoryName),
        normalizeText(selectedSubcategory),
        normalizeText(selectedSubcategory.replace(`${selectedCategory}_`, '')),
      ].filter(Boolean);

      const beforeSubcategoryFilter = [...filtered];
      const hasSubcategoryValues = filtered.some((product: any) =>
        Boolean(normalizeText(product?.subcategory ?? product?.subCategory ?? product?.sub_category)),
      );

      if (hasSubcategoryValues) {
        filtered = filtered.filter((product: any) => {
          const productSubcategory = normalizeText(
            product?.subcategory ?? product?.subCategory ?? product?.sub_category,
          );
          if (!productSubcategory) {
            return true;
          }

          const tokenMatched = subcategoryTokens.some(
            (token) => productSubcategory.includes(token) || token.includes(productSubcategory),
          );

          return (
            tokenMatched
          );
        });

        // If the subcategory mapping is inconsistent, prefer showing category items over a blank page.
        if (filtered.length === 0) {
          filtered = beforeSubcategoryFilter;
        }
      }
    }

    if (
      filtered.length === 0 &&
      selectedSubcategory &&
      selectedSubcategoryName &&
      !NON_PRODUCT_SUBCATEGORIES.has(selectedSubcategory)
    ) {
      return buildFallbackProductsForSubcategory(
        selectedMenuCategory,
        selectedSubcategory,
        selectedSubcategoryName,
        FALLBACK_SUBCATEGORY_ITEMS
      );
    }

    return filtered;
  }, [
    visibleProducts,
    selectedCategory,
    selectedSubcategory,
    selectedSubcategoryName,
    selectedMenuCategory,
    resolvedCategoryId,
  ]);
  
  // Fetch combos
  const { data: combosData, isLoading: combosLoading } = useQuery({
    queryKey: ['combos', currentStore?.id],
    queryFn: () => api.combos.getAvailable(currentStore!.id),
    enabled: !!currentStore,
  });
  const combos = combosData?.data || [];
  const specials = useMemo(() => {
    const hasSpecialSignal = (combo: any) => {
      const text = `${combo.name || ''} ${combo.description || ''}`.toLowerCase();
      return (
        combo.isFeatured ||
        Boolean(combo.availableFrom || combo.availableTo) ||
        (Array.isArray(combo.availableDays) && combo.availableDays.length > 0) ||
        text.includes('special') ||
        text.includes('deal') ||
        text.includes('lunch')
      );
    };

    const filtered = combos.filter(hasSpecialSignal);
    return filtered.length > 0 ? filtered : combos;
  }, [combos]);

  useEffect(() => {
    if (selectedCategory && !visibleCategoryIds.has(selectedCategory)) {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
    }
  }, [selectedCategory, visibleCategoryIds]);

  // Generate search items
  const searchItems = useMemo(() => {
    const items = generateSearchItems(visibleProducts, visibleMenuStructure);
    
    // Add combos to search
    combos.forEach((combo: any) => {
      items.push({
        id: `combo-${combo.id}`,
        name: `🎁 ${combo.name}`,
        description: combo.description || 'Combo meal package',
        price: Number(combo.basePrice || 0),
        category: 'Combos',
        type: 'combo',
        comboData: combo,
      });
    });
    
    // Add Build Your Own options
    items.push({
      id: 'build-rice-platter',
      name: 'Build Your Own Rice Platter',
      description: 'Chicken, gyro, salad, and sauces',
      price: 0,
      category: 'Rice Platters',
      type: 'build-your-own-rice-platter',
    });
    items.unshift(
      { id: 'build-salad', name: '🥗 Build Your Own Salad', description: 'Custom salad with proteins and dressing', price: 0, category: 'Salads', type: 'build-your-own-salad' },
      { id: 'build-sides', name: '🍟 Sides Menu', description: 'Fries, onion rings & more', price: 0, category: 'Sides', type: 'sides' },
      { id: 'build-wings', name: '🍗 Chicken Wings', description: 'Wings with flavors & sides', price: 0, category: 'Wings', type: 'wings' },
      { id: 'build-pasta', name: '🍝 Build Your Own Pasta', description: 'Create your perfect pasta', price: 0, category: 'Pasta', type: 'build-your-own-pasta' },
      { id: 'build-sub', name: '🥪 Build Your Own Sub', description: 'Create your perfect sub', price: 0, category: 'Subs', type: 'build-your-own-sub' },
      { id: 'build-pizza', name: '🍕 Build Your Own Pizza', description: 'Create your perfect pizza', price: 0, category: 'Pizza', type: 'build-your-own-pizza' }
    );
    return items;
  }, [visibleProducts, visibleMenuStructure, combos]);
  
  // Create order mutation
  const createOrder = useMutation({
    mutationFn: api.orders.create,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
      setCart([]);
      setOrderType(null);
      setTableNumber('');
      setCustomerInfo({ name: '', phone: '', loyaltyPoints: 0, referralCode: '' });
      setDeliveryAddress(null);
      setOrderSchedule({ isScheduled: false });
      setShowPayment(false);
    },
    onError: (error: any) => {
      console.error('Order creation failed:', error);
    },
  });
  
  const addToCart = useCallback((item: Omit<CartItem, 'id'>) => {
    setCart((prev) => [...prev, { ...item, id: crypto.randomUUID() }]);
    setSelectedProduct(null);
  }, []);
  
  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  }, []);
  
  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);
  
  const updateItemNotes = useCallback((itemId: string, notes: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, notes } : item
      )
    );
  }, []);
  
  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedProduct(null);
  }, []);

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null);
    setSelectedProduct(null);
  };

  const handleSubcategorySelect = (categoryId: string, subcategoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(subcategoryId);
    setSelectedProduct(null);

    // Handle special build-your-own subcategories
    if (subcategoryId === 'PIZZA_BUILD') {
      setShowBuildPizza(true);
    } else if (subcategoryId === 'SUBS_BUILD') {
      setShowBuildSub(true);
    } else if (subcategoryId === 'PASTA_BUILD') {
      setShowBuildPasta(true);
    } else if (subcategoryId === 'RICE_PLATTER_BUILD') {
      setShowBuildRicePlatter(true);
    } else if (subcategoryId === 'SALADS_BUILD') {
      setShowBuildSalad(true);
    } else if (subcategoryId === 'WINGS_BUILD') {
      setShowWings(true);
    } else if (subcategoryId === 'SIDES_BUILD') {
      setShowSides(true);
    }
  };
  
  const calculateTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => {
      const addonsTotal = (item.addons || []).reduce((aSum: number, a: any) => aSum + Number(a.price || 0), 0);
      return sum + (Number(item.unitPrice || 0) + addonsTotal) * item.quantity;
    }, 0);
    
    const discountAmount = discount
      ? discount.type === 'percentage'
        ? subtotal * (discount.value / 100)
        : discount.value
      : 0;

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const taxRate = Number(currentStore?.taxRate || 0.08);
    const tax = discountedSubtotal * taxRate;
    const deliveryFee = orderType === 'DELIVERY' ? Number(currentStore?.deliveryFee || 0) : 0;
    const total = discountedSubtotal + tax + deliveryFee;
    
    return { subtotal, discountAmount, tax, deliveryFee, total, itemCount: cart.length };
  }, [cart, currentStore, orderType, discount]);
  
  const saveSuspendedOrders = (orders: any[]) => {
    setSuspendedOrders(orders);
    localStorage.setItem('pos-suspended-orders', JSON.stringify(orders));
  };

  const handleSuspend = useCallback(() => {
    if (cart.length === 0) return;

    const newSuspendedOrder = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      cart: [...cart],
      orderType,
      customerInfo: { ...customerInfo },
      totals: { ...calculateTotals },
    };

    const updatedOrders = [newSuspendedOrder, ...suspendedOrders];
    saveSuspendedOrders(updatedOrders);
    
    // Clear current order
    setCart([]);
    setOrderType(null);
    setTableNumber('');
    setCustomerInfo({ name: '', phone: '', loyaltyPoints: 0, referralCode: '' });
    setDeliveryAddress(null);
    setOrderSchedule({ isScheduled: false });
  }, [cart, orderType, customerInfo, calculateTotals, suspendedOrders]);

  const handleRecall = (order: any) => {
    setCart(order.cart);
    setOrderType(order.orderType);
    setCustomerInfo({ loyaltyPoints: 0, referralCode: '', ...order.customerInfo });
    
    // Remove from suspended orders
    const updatedOrders = suspendedOrders.filter((o) => o.id !== order.id);
    saveSuspendedOrders(updatedOrders);
    setShowRecallModal(false);
  };

  const handleDeleteSuspended = (orderId: string) => {
    const updatedOrders = suspendedOrders.filter((o) => o.id !== orderId);
    saveSuspendedOrders(updatedOrders);
  };
  
  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowOrderType(true);
  };
  
  const handleOrderTypeConfirm = (
    type: OrderType,
    table?: string,
    customer?: { name: string; phone: string; loyaltyPoints?: number; referralCode?: string },
    address?: any,
    schedule?: OrderSchedule
  ) => {
    setOrderType(type);
    setTableNumber(table || '');
    if (customer) {
      setCustomerInfo({ 
        name: customer.name, 
        phone: customer.phone, 
        loyaltyPoints: customer.loyaltyPoints || 0,
        referralCode: customer.referralCode || '' 
      });
    }
    if (address) {
      setDeliveryAddress(address);
    }
    setOrderSchedule(schedule || { isScheduled: false });
    setShowOrderType(false);
    setShowPayment(true);
  };
  
  const handlePayment = async (paymentData: PaymentData) => {
    const { subtotal, tax, total, deliveryFee } = calculateTotals;
    const taxExempt = Boolean(paymentData.taxExempt);
    const effectiveTax = taxExempt ? 0 : tax;
    const totalBeforeTip = subtotal + effectiveTax + deliveryFee;
    /** Must match PaymentModal grandTotal so payment rows reconcile with order.total (incl. tip). */
    const collectedAmount =
      paymentData.totalWithTip != null
        ? Number(paymentData.totalWithTip)
        : Number((Number(paymentData.amount || totalBeforeTip) + Number(paymentData.tipAmount || 0)).toFixed(2));

    return new Promise<void>((resolve, reject) => {
      createOrder.mutate(
        {
          storeId: currentStore!.id,
          type: orderType!,
          tableNumber: tableNumber || undefined,
          customerName: customerInfo.name || undefined,
          customerPhone: customerInfo.phone || undefined,
          deliveryAddress: orderType === 'DELIVERY' && deliveryAddress ? {
            street: deliveryAddress.address,
            city: deliveryAddress.city,
            state: deliveryAddress.state,
            zipCode: deliveryAddress.zipCode,
            instructions: deliveryAddress.label,
          } : undefined,
          items: cart.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            sizeId: item.sizeId,
            sizeName: item.sizeName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            addons: item.addons || [],
            notes: item.notes,
            kitchenStation: item.kitchenStation,
          })),
          subtotal,
          taxAmount: effectiveTax,
          taxExempt,
          taxExemptIdRef: taxExempt ? paymentData.taxExemptIdRef?.trim() || undefined : undefined,
          deliveryFee,
          tipAmount: Number(paymentData.tipAmount || 0),
          total: Number(paymentData.totalWithTip || totalBeforeTip || total),
          sendToKitchen: !orderSchedule.isScheduled,
          scheduledFor: orderSchedule.scheduledFor,
          payments: [
            {
              amount: collectedAmount,
              method: paymentData.method,
              status: 'COMPLETED',
              transactionId: paymentData.transactionId || paymentData.reference,
              cardLast4: paymentData.cardLast4,
            },
          ],
        },
        {
          onSuccess: () => resolve(),
          onError: (error: any) =>
            reject(error?.response?.data?.message || error?.message || 'Payment failed'),
        },
      );
    });
  };

  const handleSendToKitchen = async () => {
    // Validate required fields
    if (!currentStore?.id) {
      throw new Error('No store selected');
    }
    if (!orderType) {
      throw new Error('Order type not selected');
    }
    if (cart.length === 0) {
      throw new Error('Cart is empty');
    }

    // Create order without payment (for all order types)
    const { subtotal, tax, total, deliveryFee } = calculateTotals;
    
    return new Promise<void>((resolve, reject) => {
      createOrder.mutate(
        {
          storeId: currentStore.id,
          type: orderType,
          tableNumber: tableNumber || undefined,
          customerName: customerInfo.name || undefined,
          customerPhone: customerInfo.phone || undefined,
          deliveryAddress: orderType === 'DELIVERY' && deliveryAddress ? {
            street: deliveryAddress.address,
            city: deliveryAddress.city,
            state: deliveryAddress.state,
            zipCode: deliveryAddress.zipCode,
            instructions: deliveryAddress.label,
          } : undefined,
          items: cart.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            sizeId: item.sizeId,
            sizeName: item.sizeName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            addons: item.addons || [],
            notes: item.notes,
            kitchenStation: item.kitchenStation,
          })),
          subtotal,
          taxAmount: tax,
          deliveryFee,
          tipAmount: 0,
          total,
          sendToKitchen: !orderSchedule.isScheduled,
          scheduledFor: orderSchedule.scheduledFor,
          payments: [], // No payment yet
        },
        {
          onSuccess: () => {
            setShowPayment(false);
            resolve();
          },
          onError: (error: any) => {
            console.error('Send to kitchen error:', error);
            reject(error?.response?.data?.message || error?.message || 'Failed to create order');
          },
        }
      );
    });
  };
  
  const handleApplyDiscount = (d: { type: 'percentage' | 'fixed'; value: number } | null) => {
    setDiscount(d);
  };

  const handleSearchSelect = (item: any) => {
    if (item.type === 'build-your-own-pizza') {
      setShowBuildPizza(true);
    } else if (item.type === 'build-your-own-sub') {
      setShowBuildSub(true);
    } else if (item.type === 'build-your-own-pasta') {
      setShowBuildPasta(true);
    } else if (item.type === 'build-your-own-rice-platter') {
      setShowBuildRicePlatter(true);
    } else if (item.type === 'build-your-own-salad') {
      setShowBuildSalad(true);
    } else if (item.type === 'wings') {
      setShowWings(true);
    } else if (item.type === 'sides') {
      setShowSides(true);
    } else if (item.type === 'category') {
      // Extract category from item
      const category = visibleMenuStructure.find(c => c.name === item.category);
      if (category) {
        setSelectedCategory(category.id);
        if (item.subcategory) {
          const sub = category.subcategories.find(s => s.name === item.subcategory);
          if (sub) {
            setSelectedSubcategory(sub.id);
          }
        }
      }
    } else if (item.type === 'combo') {
      // Handle combo selection
      setSelectedCombo(item.comboData);
      setShowComboModal(true);
    } else {
      // It's a product
      const product = visibleProducts.find(p => p.id === item.id);
      if (product) {
        setSelectedProduct(product);
      }
    }
  };
  
  if (!currentStore) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white">No Store Selected</h2>
          <p className="text-gray-400 mt-2">Please select a store to continue</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-[calc(100vh-65px)] min-h-[720px] flex flex-col bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-white transition-colors relative overflow-hidden">
      <PosBackground />
      
      <PosHeader
        topControlsHost={topControlsHost}
        searchItems={searchItems}
        onSearchSelect={handleSearchSelect}
        onBuildYourOwn={() => setShowBuildPizza(true)}
        onShowOrders={() => setShowOrdersModal(true)}
        onShowRecall={() => setShowRecallModal(true)}
        suspendedOrdersCount={suspendedOrders.length}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {(categoriesLoading || productsLoading) && cart.length === 0 ? (
          <PosSkeleton />
        ) : (
          <>
            {/* Left Panel - Hierarchical Menu */}
            <CategoryNav
              menuStructure={visibleMenuStructure}
              categories={categories || []}
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              onCategorySelect={handleCategorySelect}
              onSubcategorySelect={handleSubcategorySelect}
              loading={categoriesLoading}
            />
            
            {/* Center Panel - Products & Modifiers */}
            <div className="flex-1 min-w-0 flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden border-x border-slate-200 dark:border-slate-800">
              {/* Breadcrumb */}
              {(selectedCategory || selectedSubcategory) && (
                <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/90 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-sm">
                    <button
                      onClick={() => handleCategorySelect(null)}
                      className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                    >
                      All Items
                    </button>
                    {selectedCategory && (
                      <>
                        <span className="text-slate-300 dark:text-slate-600">/</span>
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {visibleMenuStructure.find(c => c.id === selectedCategory)?.name || selectedCategory}
                        </span>
                      </>
                    )}
                    {selectedSubcategory && (
                      <>
                        <span className="text-slate-300 dark:text-slate-600">/</span>
                        <span className="font-semibold text-orange-600 dark:text-orange-300">
                          {visibleMenuStructure
                            .find(c => c.id === selectedCategory)
                            ?.subcategories.find(s => s.id === selectedSubcategory)?.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Content Selection Logic */}
              {!selectedCategory ? (
                <PosCategoryGrid
                  categories={visibleMenuStructure}
                  onSelect={handleCategorySelect}
                  renderIcon={renderCategoryIcon}
                />
              ) : selectedCategory === 'SPECIALS' ? (
                <PosComboGrid
                  combos={specials}
                  onSelect={(combo) => {
                    setSelectedCombo(combo);
                    setShowComboModal(true);
                  }}
                  loading={combosLoading}
                  title="Specials"
                  subtitle="Featured deals, lunch specials, and limited-time offers"
                  icon="Special"
                  emptyMessage="No specials available for this store"
                  accent="rose"
                />
              ) : !selectedSubcategory ? (
                <PosSubcategoryGrid
                  category={visibleMenuStructure.find(c => c.id === selectedCategory)!}
                  onSelect={(subId) => handleSubcategorySelect(selectedCategory, subId)}
                  onBack={() => handleCategorySelect(null)}
                  renderIcon={renderCategoryIcon}
                />
              ) : selectedSubcategory === 'RICE_PLATTER_SIGNATURE' ? (
                <RicePlattersMenu
                  onAdd={addToCart}
                  onCustomize={() => setShowBuildRicePlatter(true)}
                />
              ) : selectedSubcategory === 'SALADS_BUILD' ? (
                <div className="p-6">
                  <div className="max-w-xl mx-auto bg-white/90 dark:bg-gray-800/90 border border-gray-200/70 dark:border-gray-700/70 rounded-2xl p-6 text-center">
                    <div className="text-5xl mb-3">🥗</div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Build Your Own Salad</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                      Choose small or regular size, add proteins, pick dressing, and customize extras.
                    </p>
                    <button
                      onClick={() => setShowBuildSalad(true)}
                      className="px-5 py-3 bg-gradient-to-r from-lime-600 to-green-600 text-white rounded-xl font-semibold hover:brightness-105 transition-all"
                    >
                      Start Custom Salad
                    </button>
                  </div>
                </div>
              ) : selectedSubcategory === 'SALADS_SIGNATURE' ? (
                <SaladsMenu
                  onAdd={addToCart}
                  onCustomize={() => setShowBuildSalad(true)}
                />
              ) : selectedCategory === 'COMBO' ? (
                <PosComboGrid
                  combos={combos}
                  onSelect={(combo) => {
                    setSelectedCombo(combo);
                    setShowComboModal(true);
                  }}
                  loading={combosLoading}
                />
              ) : (
                <ProductGrid
                  products={products || []}
                  onSelect={setSelectedProduct}
                  loading={productsLoading}
                  showBuildYourOwnCard={false}
                  onBuildYourOwn={() => {}}
                />
              )}
              
              {selectedProduct && (
                <AddOnPanel
                  product={selectedProduct}
                  onAdd={addToCart}
                  onCancel={() => setSelectedProduct(null)}
                />
              )}
            </div>
            
            {/* Right Panel - Cart */}
            <OrderCart
              items={cart}
              onRemove={removeFromCart}
              onUpdateQuantity={updateQuantity}
              onUpdateNotes={updateItemNotes}
              totals={calculateTotals}
              onCheckout={handleCheckout}
              onSuspend={handleSuspend}
              onApplyDiscount={handleApplyDiscount}
            />
          </>
        )}
      </div>
      
      {/* Modals & Overlays */}
      {showOrderType && (
        <OrderTypeModal
          onConfirm={handleOrderTypeConfirm}
          onCancel={() => setShowOrderType(false)}
        />
      )}
      
      {showPayment && (
        <PaymentModal
          total={calculateTotals.total}
          taxAmount={calculateTotals.tax}
          availableLoyaltyPoints={customerInfo.loyaltyPoints}
          onPay={handlePayment}
          onCancel={() => setShowPayment(false)}
          onSendToKitchen={handleSendToKitchen}
          orderType={orderType || undefined}
        />
      )}
      
      {showBuildPizza && (
        <BuildYourOwnPizza
          product={products?.find((p: any) => 
            p.name.toLowerCase().includes('build your own') || 
            p.name.toLowerCase().includes('custom pizza') ||
            p.subcategoryId === 'PIZZA_BUILD'
          ) || { name: 'Build Your Own Pizza', basePrice: 10.99, sizes: [], addonSets: [] }}
          onAdd={(item) => {
            addToCart(item);
            setShowBuildPizza(false);
          }}
          onCancel={() => setShowBuildPizza(false)}
        />
      )}

      {showBuildSub && (
        <BuildYourOwnSub
          onAdd={(item) => {
            addToCart(item);
            setShowBuildSub(false);
          }}
          onCancel={() => setShowBuildSub(false)}
        />
      )}

      {showBuildPasta && (
        <BuildYourOwnPasta
          onAdd={(item) => {
            addToCart(item);
            setShowBuildPasta(false);
          }}
          onCancel={() => setShowBuildPasta(false)}
        />
      )}

      {showBuildRicePlatter && (
        <BuildYourOwnRicePlatter
          onAdd={(item) => {
            addToCart(item);
            setShowBuildRicePlatter(false);
          }}
          onCancel={() => setShowBuildRicePlatter(false)}
        />
      )}

      {showBuildSalad && (
        <BuildYourOwnSalad
          onAdd={(item) => {
            addToCart(item);
            setShowBuildSalad(false);
          }}
          onCancel={() => setShowBuildSalad(false)}
        />
      )}

      {showWings && (
        <WingsMenu
          onAdd={(item) => {
            addToCart(item);
            setShowWings(false);
          }}
          onCancel={() => setShowWings(false)}
        />
      )}

      {showSides && (
        <SidesMenu
          onAdd={(item) => {
            addToCart(item);
            setShowSides(false);
          }}
          onCancel={() => setShowSides(false)}
        />
      )}

      {showOrdersModal && (
        <OrdersModal
          storeId={currentStore!.id}
          onClose={() => setShowOrdersModal(false)}
          onSelectOrder={(order) => {
            console.log('Selected order:', order);
            setShowOrdersModal(false);
          }}
        />
      )}
      
      {showComboModal && selectedCombo && currentStore && (
        <PosComboModal
          storeId={currentStore.id}
          combo={selectedCombo}
          onClose={() => {
            setShowComboModal(false);
            setSelectedCombo(null);
          }}
          onAdd={(combo, extras) => {
            addToCart({
              productId: combo.id,
              productName: combo.name,
              quantity: 1,
              unitPrice: Number(combo.basePrice),
              addons: extras.map((extra: any) => ({
                addonId: extra.addonId,
                name: extra.name,
                price: Number(extra.price || 0),
              })),
              kitchenStation: combo.kitchenStation || 'GENERAL',
              isCombo: true,
              comboItems: combo.items?.map((item: any, idx: number) => ({
                productId: item.productId,
                productName: item.name,
                addons: extras
                  .filter((extra: any) => extra.comboItemId === (item.id || `combo-item-${idx}`))
                  .map((extra: any) => ({
                    addonId: extra.addonId,
                    name: extra.name,
                    price: Number(extra.price || 0),
                  })),
              })),
            });
            setShowComboModal(false);
            setSelectedCombo(null);
          }}
        />
      )}

      {showRecallModal && (
        <RecallModal
          orders={suspendedOrders}
          onRecall={handleRecall}
          onDelete={handleDeleteSuspended}
          onClose={() => setShowRecallModal(false)}
        />
      )}
    </div>
  );
};

export default PosPage;
