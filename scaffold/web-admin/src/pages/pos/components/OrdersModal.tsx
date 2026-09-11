import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  X, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  ChefHat,
  ShoppingBag,
  Calendar,
  User,
  MapPin,
  Phone,
  Receipt,
  MoreHorizontal,
  RefreshCw,
  Printer,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  Play,
  Check,
  Ban,
  CreditCard,
  UtensilsCrossed,
  Timer
} from 'lucide-react';
import { api } from '../../../services/api';
import PaymentModal from './PaymentModal';

interface Order {
  id: string;
  orderNumber: string;
  tokenNumber?: string;
  type: 'DINE_IN' | 'PICKUP' | 'DELIVERY' | 'DRIVE_THRU';
  status:
    | 'PENDING'
    | 'PAID'
    | 'IN_PROGRESS'
    | 'IN_OVEN'
    | 'READY'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED';
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  total: number;
  subtotal: number;
  taxAmount: number;
  taxExempt?: boolean;
  taxExemptIdRef?: string | null;
  createdAt: string;
  updatedAt: string;
  scheduledFor?: string | null;
  items: OrderItem[];
  payments: Payment[];
}

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  modifiers: any[];
  notes?: string;
}

interface Payment {
  id: string;
  amount: number;
  method: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'GIFT_CARD' | 'MOBILE';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
}

interface PaymentData {
  method: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'GIFT_CARD' | 'ONLINE';
  amount: number;
  transactionId?: string;
  cardLast4?: string;
  tipAmount?: number;
  totalWithTip?: number;
  closeOrderOnFullPayment?: boolean;
  taxExempt?: boolean;
  taxExemptIdRef?: string;
  // Cash-specific fields
  tenderedAmount?: number;
  changeDue?: number;
}

interface OrdersModalProps {
  storeId: string;
  onClose: () => void;
  onSelectOrder?: (order: Order) => void;
}

type OrderFilter = 'ALL' | 'ALL_OPEN' | 'DINE_IN' | 'PICKUP' | 'DELIVERY' | 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED' | 'TODAY' | 'FUTURE';

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Clock },
  PAID: { label: 'Paid', color: 'text-indigo-600', bgColor: 'bg-indigo-100', icon: CreditCard },
  IN_PROGRESS: { label: 'In Progress', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: ChefHat },
  IN_OVEN: { label: 'In Oven', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Timer },
  READY: { label: 'Ready', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
  COMPLETED: { label: 'Completed', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'text-red-600', bgColor: 'bg-red-100', icon: X },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
};

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  DINE_IN: { label: 'Dine-In', icon: ShoppingBag, color: 'text-purple-600' },
  PICKUP: { label: 'Pickup', icon: Package, color: 'text-blue-600' },
  DELIVERY: { label: 'Delivery', icon: Truck, color: 'text-orange-600' },
  DRIVE_THRU: { label: 'Drive-Thru', icon: Truck, color: 'text-green-600' },
};

const OrdersModal: React.FC<OrdersModalProps> = ({ storeId, onClose, onSelectOrder }) => {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<OrderFilter>('TODAY');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dateRange, setDateRange] = useState<'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'CUSTOM'>('TODAY');
  const [actionError, setActionError] = useState<string | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);

  // Debug logging
  useEffect(() => {
    console.log('[OrdersModal] Mounted with storeId:', storeId);
    return () => console.log('[OrdersModal] Unmounted');
  }, [storeId]);

  // Fetch orders - get all orders for the store
  const { data: ordersData, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', storeId],
    queryFn: async () => {
      console.log('Fetching orders for store:', storeId);
      const response = await api.orders.getAll({ storeId, includeFuture: true });
      const normalized = (response.data || []).map((order: any) => ({
        ...order,
        status: normalizeOrderStatus(order.status),
      }));
      console.log('Orders response:', normalized);
      return { ...response, data: normalized };
    },
    enabled: !!storeId,
    retry: 1,
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api.orders.updateStatus(orderId, status, storeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', storeId] });
      setActionError(null);
    },
    onError: (error: any) => {
      setActionError(error?.response?.data?.message || 'Failed to update order status');
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: ({ order, payment }: { order: Order; payment: PaymentData }) =>
      api.orders.addPayment(order.id, {
        amount: Number(payment.totalWithTip || payment.amount),
        method: payment.method,
        status: 'COMPLETED',
        transactionId: payment.transactionId,
        cardLast4: payment.cardLast4,
        tipAmount: Number(payment.tipAmount || 0),
        closeOrderOnFullPayment: Boolean(payment.closeOrderOnFullPayment),
        taxExempt: Boolean(payment.taxExempt),
        taxExemptIdRef: payment.taxExempt ? payment.taxExemptIdRef?.trim() : undefined,
      }, storeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', storeId] });
      setActionError(null);
    },
    onError: (error: any) => {
      setActionError(error?.response?.data?.message || 'Failed to add payment');
    },
  });

  // Get available actions for an order based on its status
  const isFutureOrder = (order: Order) => {
    if (!order.scheduledFor) return false;
    return new Date(order.scheduledFor).getTime() > Date.now();
  };

  const getAvailableActions = (order: Order) => {
    const actions = [];
    const isFuture = isFutureOrder(order);
    
    if (order.status === 'PENDING' || order.status === 'PAID') {
      actions.push({
        id: 'send_to_kitchen',
        label: isFuture ? 'Release to Kitchen' : 'Send to Kitchen',
        icon: UtensilsCrossed,
        color: 'bg-blue-600 hover:bg-blue-700',
        status: 'IN_KITCHEN',
      });
    }
    
    if (order.status === 'IN_PROGRESS' || order.status === 'IN_OVEN') {
      actions.push({
        id: 'mark_ready',
        label: 'Mark Ready',
        icon: CheckCircle,
        color: 'bg-green-600 hover:bg-green-700',
        status: 'READY',
      });
    }
    
    if (order.status === 'READY') {
      actions.push({
        id: 'complete',
        label: 'Complete Order',
        icon: Check,
        color: 'bg-emerald-600 hover:bg-emerald-700 shadow-sm',
        status: 'COMPLETED',
      });
    }
    
    if (['PENDING', 'PAID', 'IN_PROGRESS', 'READY'].includes(order.status)) {
      actions.push({
        id: 'cancel',
        label: 'Cancel Order',
        icon: Ban,
        color: 'bg-red-600 hover:bg-red-700',
        status: 'CANCELLED',
      });
    }
    
    return actions;
  };

  // Handle action click
  const handleAction = async (order: Order, status: string) => {
    await updateStatusMutation.mutateAsync({ orderId: order.id, status });
    const refreshedResult = await refetch();
    // Refresh selected order if in detail view
    if (selectedOrder?.id === order.id) {
      const updated = refreshedResult.data?.data?.find((o: Order) => o.id === order.id);
      if (updated) setSelectedOrder(updated);
    }
  };

  // Check if order needs payment
  const needsPayment = (order: Order) => {
    return getBalanceDue(order) > 0;
  };

  const getBalanceDue = (order: Order) => {
    const totalPaid =
      order.payments
        ?.filter((p: Payment) => p.status === 'COMPLETED')
        ?.reduce((sum: number, p: Payment) => sum + Number(p.amount), 0) || 0;
    return Math.max(0, Number(order.total) - totalPaid);
  };

  // Get payment status
  const getPaymentStatus = (order: Order) => {
    const totalPaid = order.payments
      ?.filter((p: Payment) => p.status === 'COMPLETED')
      ?.reduce((sum: number, p: Payment) => sum + Number(p.amount), 0) || 0;
    const total = Number(order.total);
    
    if (totalPaid >= total) return { label: 'Paid', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (totalPaid > 0) return { label: 'Partial', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { label: 'Unpaid', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const orders = ordersData?.data || [];

  // Filter orders based on search and filter
  const filteredOrders = orders.filter((order: Order) => {
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.tokenNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone?.includes(searchQuery);
    
    if (!matchesSearch) return false;
    
    if (activeFilter === 'ALL') {
      return true; // Show all orders
    }
    if (activeFilter === 'ALL_OPEN') {
      return ['PENDING', 'PAID', 'IN_PROGRESS', 'IN_OVEN', 'READY', 'OUT_FOR_DELIVERY'].includes(order.status);
    }
    if (activeFilter === 'TODAY') {
      const today = new Date().toDateString();
      const orderDate = new Date(order.createdAt).toDateString();
      return today === orderDate;
    }
    if (activeFilter === 'FUTURE') {
      return isFutureOrder(order);
    }
    if (activeFilter === 'CLOSED') {
      return ['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(order.status);
    }
    if (['DINE_IN', 'PICKUP', 'DELIVERY'].includes(activeFilter)) {
      return order.type === activeFilter;
    }
    // Handle status filters like READY, IN_PROGRESS, etc.
    return order.status === activeFilter;
  });

  const orderStats = {
    total: filteredOrders.length,
    pending: filteredOrders.filter((o: Order) => o.status === 'PENDING').length,
    paid: filteredOrders.filter((o: Order) => o.status === 'PAID').length,
    kitchen: filteredOrders.filter((o: Order) => o.status === 'IN_PROGRESS' || o.status === 'IN_OVEN').length,
    ready: filteredOrders.filter((o: Order) => o.status === 'READY').length,
    unpaid: filteredOrders.filter((o: Order) => needsPayment(o)).length,
    future: filteredOrders.filter((o: Order) => isFutureOrder(o)).length,
    closed: filteredOrders.filter((o: Order) => ['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(o.status)).length,
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    const config = TYPE_CONFIG[type] || TYPE_CONFIG.DINE_IN;
    const Icon = config.icon;
    return <Icon size={16} className={config.color} />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  // Order Detail View
  if (selectedOrder) {
    return (
      <div 
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4"
        onClick={(e) => {
          // Close modal when clicking the backdrop
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <button
              onClick={() => setSelectedOrder(null)}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft size={20} />
              <span>Back to Orders</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Order Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Order Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Order #{selectedOrder.orderNumber}
                  </h2>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDate(selectedOrder.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {formatTimeAgo(selectedOrder.createdAt)}
                  </span>
                  {isFutureOrder(selectedOrder) && (
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-300 font-medium">
                      <Timer size={14} />
                      Scheduled {formatDate(selectedOrder.scheduledFor!)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${Number(selectedOrder.total).toFixed(2)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedOrder.items.reduce((sum, item) => sum + item.quantity, 0)} items
                </div>
              </div>
            </div>

            {/* Order Type & Customer Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  {getTypeIcon(selectedOrder.type)}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {TYPE_CONFIG[selectedOrder.type]?.label || selectedOrder.type}
                  </span>
                </div>
                {selectedOrder.tableNumber && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Table #{selectedOrder.tableNumber}
                  </div>
                )}
                {selectedOrder.tokenNumber && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Token: #{selectedOrder.tokenNumber}
                  </div>
                )}
              </div>

              {(selectedOrder.customerName || selectedOrder.customerPhone) && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  {selectedOrder.customerName && (
                    <div className="flex items-center gap-2 mb-1">
                      <User size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedOrder.customerName}
                      </span>
                    </div>
                  )}
                  {selectedOrder.customerPhone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Phone size={14} className="text-gray-400" />
                      {selectedOrder.customerPhone}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Items */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Receipt size={18} />
                Order Items
              </h3>
              <div className="space-y-2">
                {selectedOrder.items.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white">{item.quantity}x</span>
                        <span className="text-gray-900 dark:text-white">{item.productName}</span>
                      </div>
                      {item.notes && (
                        <div className="text-sm text-orange-600 mt-1">Note: {item.notes}</div>
                      )}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${(Number(item.unitPrice) * Number(item.quantity)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t dark:border-gray-700 pt-4 mb-6">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>${Number(selectedOrder.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Tax</span>
                  <span>${Number(selectedOrder.taxAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2 border-t dark:border-gray-700">
                  <span>Total</span>
                  <span>${Number(selectedOrder.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <CreditCard size={18} />
                  Payment Status
                </h3>
                {(() => {
                  const status = getPaymentStatus(selectedOrder);
                  return (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                      {status.label}
                    </span>
                  );
                })()}
              </div>
              
              {/* Payment Progress */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Order Total</span>
                  <span>${Number(selectedOrder.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Amount Paid</span>
                  <span className="text-green-600 dark:text-green-400">
                    ${(selectedOrder.payments
                      ?.filter((p: Payment) => p.status === 'COMPLETED')
                      ?.reduce((sum: number, p: Payment) => sum + Number(p.amount), 0) || 0).toFixed(2)}
                  </span>
                </div>
                {getBalanceDue(selectedOrder) > 0 && (
                  <div className="flex justify-between text-orange-600 dark:text-orange-400 font-medium pt-2 border-t dark:border-gray-600">
                    <span>Balance Due</span>
                    <span>${getBalanceDue(selectedOrder).toFixed(2)}</span>
                  </div>
                )}
                {getBalanceDue(selectedOrder) <= 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400 font-medium pt-2 border-t dark:border-gray-600">
                    <span>Fully Paid</span>
                    <CheckCircle size={16} />
                  </div>
                )}
              </div>
            </div>

            {/* Payment History */}
            {selectedOrder.payments.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Payment History</h3>
                <div className="space-y-2">
                  {selectedOrder.payments.map((payment) => (
                    <div 
                      key={payment.id} 
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        payment.status === 'COMPLETED' 
                          ? 'bg-green-50 dark:bg-green-900/20' 
                          : payment.status === 'REFUNDED'
                          ? 'bg-red-50 dark:bg-red-900/20'
                          : 'bg-yellow-50 dark:bg-yellow-900/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          payment.status === 'COMPLETED' 
                            ? 'bg-green-500' 
                            : payment.status === 'REFUNDED'
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                        }`} />
                        <div>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {payment.method.replace('_', ' ')}
                          </div>
                          {payment.transactionId && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              TX: {payment.transactionId}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-medium ${
                          payment.status === 'COMPLETED' 
                            ? 'text-green-700 dark:text-green-400' 
                            : payment.status === 'REFUNDED'
                            ? 'text-red-700 dark:text-red-400'
                            : 'text-yellow-700 dark:text-yellow-400'
                        }`}>
                          ${Number(payment.amount).toFixed(2)}
                        </span>
                        {payment.status !== 'COMPLETED' && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {payment.status}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {actionError && (
            <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-800">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle size={16} />
                {actionError}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-4 border-t dark:border-gray-700 space-y-3">
            {/* Payment Status Banner */}
            {needsPayment(selectedOrder) ? (
              <div className={`flex items-center justify-between p-3 rounded-lg ${
                selectedOrder.payments.length > 0 
                  ? 'bg-yellow-50 dark:bg-yellow-900/20' 
                  : 'bg-orange-50 dark:bg-orange-900/20'
              }`}>
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className={
                    selectedOrder.payments.length > 0 
                      ? 'text-yellow-600' 
                      : 'text-orange-600'
                  } />
                  <span className={`text-sm font-medium ${
                    selectedOrder.payments.length > 0 
                      ? 'text-yellow-800 dark:text-yellow-200' 
                      : 'text-orange-800 dark:text-orange-200'
                  }`}>
                    {selectedOrder.payments.length > 0 ? 'Partial Payment' : 'Payment Required'}
                  </span>
                </div>
                <span className={`text-sm ${
                  selectedOrder.payments.length > 0 
                    ? 'text-yellow-700 dark:text-yellow-300' 
                    : 'text-orange-700 dark:text-orange-300'
                }`}>
                  Balance: ${getBalanceDue(selectedOrder).toFixed(2)}
                </span>
              </div>
            ) : selectedOrder.payments.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Fully Paid
                  </span>
                </div>
                <span className="text-sm text-green-700 dark:text-green-300">
                  Total: ${Number(selectedOrder.total).toFixed(2)}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {/* Print Receipt */}
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <Printer size={18} />
                Print
              </button>

              {/* Status Action Buttons */}
              {getAvailableActions(selectedOrder).map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleAction(selectedOrder, action.status)}
                  disabled={updateStatusMutation.isPending}
                  className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${action.color}`}
                >
                  <action.icon size={18} />
                  {updateStatusMutation.isPending ? 'Processing...' : action.label}
                </button>
              ))}

              {needsPayment(selectedOrder) && (
                <button
                  onClick={() => setPaymentOrder(selectedOrder)}
                  disabled={addPaymentMutation.isPending}
                  className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg ${
                    selectedOrder.payments.length > 0 
                      ? 'bg-yellow-600 hover:bg-yellow-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  <CreditCard size={18} />
                  {addPaymentMutation.isPending 
                    ? 'Processing...' 
                    : selectedOrder.payments.length > 0 
                      ? 'Add Payment' 
                      : 'Collect Payment'
                  }
                </button>
              )}

              {/* Load Order Button */}
              {selectedOrder.status !== 'COMPLETED' && selectedOrder.status !== 'CANCELLED' && (
                <button
                  onClick={() => onSelectOrder?.(selectedOrder)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ml-auto"
                >
                  Load Order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Orders List View
  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4"
      onClick={(e) => {
        // Close modal when clicking the backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ShoppingBag size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Find Orders</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isLoading ? 'Loading orders...' : 
                 error ? `Error: ${(error as any)?.message || 'Failed to load'}` : 
                 `${filteredOrders.length} of ${orders.length} orders`}
              </p>
              {storeId && <p className="text-xs text-gray-400">Store: {storeId.substring(0, 8)}...</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="Refresh"
            >
              <RefreshCw size={20} className="text-gray-500" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b dark:border-gray-700 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            <div className="rounded-lg bg-gray-100 dark:bg-gray-700/60 px-3 py-2">
              <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{orderStats.total}</div>
            </div>
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2">
              <div className="text-xs text-yellow-700 dark:text-yellow-300">Pending</div>
              <div className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">{orderStats.pending}</div>
            </div>
            <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2">
              <div className="text-xs text-indigo-700 dark:text-indigo-300">Paid</div>
              <div className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">{orderStats.paid}</div>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 px-3 py-2">
              <div className="text-xs text-blue-700 dark:text-blue-300">Kitchen</div>
              <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">{orderStats.kitchen}</div>
            </div>
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 px-3 py-2">
              <div className="text-xs text-green-700 dark:text-green-300">Ready</div>
              <div className="text-lg font-semibold text-green-700 dark:text-green-300">{orderStats.ready}</div>
            </div>
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2">
              <div className="text-xs text-red-700 dark:text-red-300">Unpaid</div>
              <div className="text-lg font-semibold text-red-700 dark:text-red-300">{orderStats.unpaid}</div>
            </div>
            <div className="rounded-lg bg-sky-50 dark:bg-sky-900/20 px-3 py-2">
              <div className="text-xs text-sky-700 dark:text-sky-300">Future</div>
              <div className="text-lg font-semibold text-sky-700 dark:text-sky-300">{orderStats.future}</div>
            </div>
            <div className="rounded-lg bg-slate-100 dark:bg-slate-700/60 px-3 py-2">
              <div className="text-xs text-slate-700 dark:text-slate-300">Closed</div>
              <div className="text-lg font-semibold text-slate-700 dark:text-slate-300">{orderStats.closed}</div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="grid grid-cols-9 gap-1.5">
            {[
              { id: 'ALL', label: 'All', shortLabel: 'All', icon: ShoppingBag },
              { id: 'TODAY', label: 'Today', shortLabel: 'Today', icon: Calendar },
              { id: 'ALL_OPEN', label: 'Open', shortLabel: 'Open', icon: Clock },
              { id: 'FUTURE', label: 'Future', shortLabel: 'Future', icon: Timer },
              { id: 'DINE_IN', label: 'Dine-In', shortLabel: 'Dine', icon: ShoppingBag },
              { id: 'PICKUP', label: 'Pickup', shortLabel: 'Pick', icon: Package },
              { id: 'DELIVERY', label: 'Delivery', shortLabel: 'Del', icon: Truck },
              { id: 'READY', label: 'Ready', shortLabel: 'Ready', icon: CheckCircle },
              { id: 'CLOSED', label: 'Closed', shortLabel: 'Closed', icon: Check },
            ].map((filter) => {
              const Icon = filter.icon;
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id as OrderFilter)}
                  className={`flex items-center justify-center gap-1 px-1.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title={filter.label}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{filter.label}</span>
                  <span className="sm:hidden">{filter.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by order #, token, customer name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertCircle size={32} className="text-red-500 dark:text-red-400" />
              </div>
              <p className="text-lg text-gray-900 dark:text-white font-medium">Failed to load orders</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
                {error instanceof Error ? error.message : 'Unable to connect to the server. Please check your connection and try again.'}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <RefreshCw size={18} />
                Retry
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag size={64} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-lg text-gray-500 dark:text-gray-400">No orders found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Try adjusting your filters or search query
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order: Order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors group"
                >
                  {/* Order Number */}
                  <div className="flex-shrink-0 w-24">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      #{order.orderNumber}
                    </div>
                    {order.tokenNumber && (
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        Token: #{order.tokenNumber}
                      </div>
                    )}
                  </div>

                  {/* Type & Status */}
                  <div className="flex-shrink-0 flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-sm">
                      {getTypeIcon(order.type)}
                      <span className="text-gray-600 dark:text-gray-400">
                        {TYPE_CONFIG[order.type]?.label}
                      </span>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  {/* Customer Info */}
                  <div className="flex-1 min-w-0">
                    {order.customerName ? (
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {order.customerName}
                      </div>
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400 italic">
                        Guest Order
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatTimeAgo(order.createdAt)}</span>
                      {isFutureOrder(order) && (
                        <span className="text-sky-600 dark:text-sky-400">
                          Scheduled {formatDate(order.scheduledFor!)}
                        </span>
                      )}
                      {order.tableNumber && (
                        <span className="text-purple-600 dark:text-purple-400">
                          Table #{order.tableNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="flex-shrink-0">
                    {(() => {
                      const paymentStatus = getPaymentStatus(order);
                      return (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${paymentStatus.bgColor} ${paymentStatus.color}`}>
                          {paymentStatus.label}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Items & Total */}
                  <div className="text-right flex-shrink-0 min-w-[80px]">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      ${Number(order.total).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                    </div>
                    {needsPayment(order) && (
                      <div className="text-xs text-orange-600 dark:text-orange-400">
                        Due ${getBalanceDue(order).toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {(order.status === 'PENDING' || order.status === 'PAID') && (
                      <button
                        onClick={() => handleAction(order, 'IN_KITCHEN')}
                        disabled={updateStatusMutation.isPending}
                        className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        title={isFutureOrder(order) ? 'Release to Kitchen' : 'Send to Kitchen'}
                      >
                        <UtensilsCrossed size={16} />
                      </button>
                    )}
                    {order.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleAction(order, 'READY')}
                        disabled={updateStatusMutation.isPending}
                        className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                        title="Mark Ready"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    {needsPayment(order) && (
                      <button
                        onClick={() => setPaymentOrder(order)}
                        className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                        title="Add Payment"
                      >
                        <CreditCard size={16} />
                      </button>
                    )}
                  </div>

                  {/* Arrow */}
                  <ChevronRight 
                    size={20} 
                    className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" 
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Showing {filteredOrders.length} orders</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      {paymentOrder && (
        <PaymentModal
          total={getBalanceDue(paymentOrder)}
          taxAmount={
            (paymentOrder.payments || []).some((p) => p.status === 'COMPLETED')
              ? 0
              : Number(paymentOrder.taxAmount || 0)
          }
          initialTaxExempt={Boolean(paymentOrder.taxExempt)}
          initialTaxExemptIdRef={paymentOrder.taxExemptIdRef || ''}
          orderType={paymentOrder.type}
          onCancel={() => setPaymentOrder(null)}
          onPay={async (payment: PaymentData) => {
            await addPaymentMutation.mutateAsync({
              order: paymentOrder,
              payment: {
                ...payment,
                closeOrderOnFullPayment: true,
              },
            });
            const refreshedResult = await refetch();
            const refreshed = (refreshedResult.data?.data || []).find((o: Order) => o.id === paymentOrder.id);
            if (refreshed) setSelectedOrder(refreshed);
            setPaymentOrder(null);
          }}
        />
      )}
    </div>
  );
};

const normalizeOrderStatus = (rawStatus?: string): Order['status'] => {
  const status = String(rawStatus || '').toUpperCase();
  const map: Record<string, Order['status']> = {
    PENDING: 'PENDING',
    CREATED: 'PENDING',
    CONFIRMED: 'PAID',
    PAID: 'PAID',
    PREPARING: 'IN_PROGRESS',
    IN_KITCHEN: 'IN_PROGRESS',
    BAKING: 'IN_OVEN',
    IN_OVEN: 'IN_OVEN',
    PREPARED: 'READY',
    ASSEMBLED: 'READY',
    PACKING: 'READY',
    PACKED: 'READY',
    READY: 'READY',
    READY_FOR_PICKUP: 'READY',
    READY_TO_SERVE: 'READY',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    DELIVERED: 'DELIVERED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    REFUNDED: 'CANCELLED',
  };

  return map[status] || 'PENDING';
};

export default OrdersModal;
