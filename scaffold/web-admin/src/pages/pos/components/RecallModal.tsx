import React from 'react';
import { X, Clock, ShoppingBag, User, Trash2 } from 'lucide-react';

interface SuspendedOrder {
  id: string;
  timestamp: string;
  cart: any[];
  orderType: string | null;
  customerInfo: { name: string; phone: string };
  totals: { total: number; itemCount: number };
}

interface RecallModalProps {
  orders: SuspendedOrder[];
  onRecall: (order: SuspendedOrder) => void;
  onDelete: (orderId: string) => void;
  onClose: () => void;
}

const RecallModal: React.FC<RecallModalProps> = ({ orders, onRecall, onDelete, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Clock className="text-blue-600" size={20} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Suspended Orders</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Clock size={48} className="mx-auto mb-4 opacity-20" />
              <p>No suspended orders found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div 
                  key={order.id}
                  className="group bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-700 p-4 rounded-xl transition-all cursor-pointer flex items-center justify-between"
                  onClick={() => onRecall(order)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {order.customerInfo.name || 'Anonymous'}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-[10px] font-medium text-gray-600 dark:text-gray-300 uppercase">
                        {order.orderType || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <ShoppingBag size={12} />
                        {order.totals.itemCount} items
                      </span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        ${order.totals.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(order.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecallModal;
