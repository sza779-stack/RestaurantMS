import axios from 'axios';
import { useStore } from '../hooks/useStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

let handlingUnauthorized = false;

apiClient.interceptors.request.use((config) => {
  const token = useStore.getState().token || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl: string = error.config?.url || '';
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh');

    if (status === 401 && !isAuthEndpoint && !handlingUnauthorized) {
      handlingUnauthorized = true;
      useStore.getState().logout();
      queueMicrotask(() => {
        handlingUnauthorized = false;
      });
    }
    return Promise.reject(error);
  }
);

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiClient.post('/auth/login', { email, password }),
    me: () => apiClient.get('/auth/me'),
  },
  menu: {
    getCategories: (storeId: string) =>
      apiClient.get('/menu/categories', { params: { storeId } }),
    createCategory: (data: any) =>
      apiClient.post('/menu/categories', data),
    updateCategory: (id: string, data: any) =>
      apiClient.patch(`/menu/categories/${id}`, data),
    deleteCategory: (id: string) =>
      apiClient.delete(`/menu/categories/${id}`),
    getProducts: (params: { storeId: string; categoryId?: string | null }) =>
      apiClient.get('/menu/products', { params }),
    createProduct: (data: any) =>
      apiClient.post('/menu/products', data),
    updateProduct: (id: string, data: any) =>
      apiClient.patch(`/menu/products/${id}`, data),
    deleteProduct: (id: string) =>
      apiClient.delete(`/menu/products/${id}`),
    getModifiers: (storeId: string) =>
      apiClient.get('/menu/modifiers', { params: { storeId } }),
    createModifier: (data: any) =>
      apiClient.post('/menu/modifiers', data),
    updateModifier: (id: string, data: any) =>
      apiClient.patch(`/menu/modifiers/${id}`, data),
    deleteModifier: (id: string) =>
      apiClient.delete(`/menu/modifiers/${id}`),
  },
  orders: {
    create: (data: any) => apiClient.post('/orders', data),
    getAll: (params?: any) => apiClient.get('/orders', { params }),
    getById: (id: string) => apiClient.get(`/orders/${id}`),
    updateStatus: (id: string, status: string, storeId?: string) =>
      apiClient.put(`/orders/${id}/status`, { status, storeId }),
    updateLifecycle: (id: string, status: string, storeId?: string) =>
      apiClient.put(`/orders/${id}/lifecycle`, { status, storeId }),
    addPayment: (
      orderId: string,
      data: {
        amount: number;
        method: string;
        status?: string;
        transactionId?: string;
        cardLast4?: string;
        tipAmount?: number;
        closeOrderOnFullPayment?: boolean;
        taxExempt?: boolean;
        taxExemptIdRef?: string;
      },
      storeId?: string,
    ) =>
      apiClient.post(`/orders/${orderId}/payments`, data, { params: { storeId } }),
    acceptDriver: (orderId: string, driverId: string, storeId?: string) =>
      apiClient.post(`/orders/${orderId}/driver/accept`, { driverId, storeId }),
    markDelivered: (orderId: string, driverId: string, storeId?: string) =>
      apiClient.post(`/orders/${orderId}/driver/delivered`, { driverId, storeId }),
  },
  stores: {
    getAll: () => apiClient.get('/stores'),
    getById: (id: string) => apiClient.get(`/stores/${id}`),
    update: (id: string, data: unknown) => apiClient.put(`/stores/${id}`, data),
  },
  customers: {
    getAll: (params?: { q?: string; phone?: string; limit?: number }) =>
      apiClient.get('/customers', { params }),
    lookupByPhone: (phone: string) =>
      apiClient.get('/customers/lookup', { params: { phone } }),
    getById: (id: string) =>
      apiClient.get(`/customers/${id}`),
    create: (data: any) =>
      apiClient.post('/customers', data),
    update: (id: string, data: any) =>
      apiClient.put(`/customers/${id}`, data),
    addAddress: (id: string, data: any) =>
      apiClient.post(`/customers/${id}/addresses`, data),
    getLoyaltyHistory: (id: string) =>
      apiClient.get(`/customers/${id}/loyalty-transactions`),
  },
  inventory: {
    getItems: (storeId: string, params?: any) =>
      apiClient.get('/inventory/items', { params: { storeId, ...params } }),
    getItem: (id: string, storeId: string) =>
      apiClient.get(`/inventory/items/${id}`, { params: { storeId } }),
    getItemByBarcode: (barcode: string, storeId: string) =>
      apiClient.get(`/inventory/items/by-barcode/${barcode}`, { params: { storeId } }),
    createItem: (data: any) => apiClient.post('/inventory/items', data),
    updateItem: (id: string, storeId: string, data: any) =>
      apiClient.put(`/inventory/items/${id}`, data, { params: { storeId } }),
    deleteItem: (id: string, storeId: string) =>
      apiClient.delete(`/inventory/items/${id}`, { params: { storeId } }),
    getStockMovements: (params?: any) =>
      apiClient.get('/inventory/movements', { params }),
    createStockMovement: (data: any) =>
      apiClient.post('/inventory/movements', data),
    receiveByBarcode: (data: any) =>
      apiClient.post('/inventory/receive-barcode', data),
    getStockLevels: (storeId: string) =>
      apiClient.get('/inventory/stock-levels', { params: { storeId } }),
    getPurchaseOrders: (storeId: string, params?: any) =>
      apiClient.get('/inventory/purchase-orders', { params: { storeId, ...params } }),
    createPurchaseOrder: (data: any) =>
      apiClient.post('/inventory/purchase-orders', data),
    receivePurchaseOrder: (id: string, data: any) =>
      apiClient.post(`/inventory/purchase-orders/${id}/receive`, data),
    getVendors: (companyId: string) =>
      apiClient.get('/inventory/vendors', { params: { companyId } }),
    createVendor: (data: any) =>
      apiClient.post('/inventory/vendors', data),
  },
  combos: {
    getAll: (params?: { storeId?: string; isActive?: boolean }) =>
      apiClient.get('/combos', { params }),
    getById: (id: string) => apiClient.get(`/combos/${id}`),
    create: (data: any) => apiClient.post('/combos', data),
    update: (id: string, data: any) => apiClient.patch(`/combos/${id}`, data),
    delete: (id: string) => apiClient.delete(`/combos/${id}`),
    getAvailable: (storeId: string) =>
      apiClient.get('/combos/available', { params: { storeId } }),
    updateStores: (id: string, data: any) =>
      apiClient.post(`/combos/${id}/stores`, data),
    duplicate: (id: string, name?: string) =>
      apiClient.post(`/combos/${id}/duplicate`, null, { params: { name } }),
  },
  addons: {
    getAll: (storeId: string) => apiClient.get('/addons', { params: { storeId } }),
    getById: (id: string) => apiClient.get(`/addons/${id}`),
    create: (data: any) => apiClient.post('/addons', data),
    update: (id: string, data: any) => apiClient.patch(`/addons/${id}`, data),
    delete: (id: string) => apiClient.delete(`/addons/${id}`),
    getByProduct: (productId: string) => apiClient.get(`/addons/product/${productId}`),
    
    // Sets
    getSets: (storeId: string) => apiClient.get('/addons/sets', { params: { storeId } }),
    getSetById: (id: string) => apiClient.get(`/addons/sets/${id}`),
    createSet: (data: any) => apiClient.post('/addons/sets', data),
    updateSet: (id: string, data: any) => apiClient.patch(`/addons/sets/${id}`, data),
    deleteSet: (id: string) => apiClient.delete(`/addons/sets/${id}`),
    linkSetToProduct: (productId: string, setId: string, displayOrder?: number) => 
      apiClient.post(`/addons/product/${productId}/link/${setId}`, { displayOrder }),
    unlinkSetFromProduct: (productId: string, setId: string) => 
      apiClient.delete(`/addons/product/${productId}/unlink/${setId}`),
  },
};

export default apiClient;
