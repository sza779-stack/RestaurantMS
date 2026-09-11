import React from 'react';
import { ArrowRight } from 'lucide-react';

interface OrdersPageProps {
  setView: (view: any) => void;
  activeOrderNumber: string;
  recentOrders: any[];
  normalizeStatusLabel: (status?: string) => string;
}

const OrdersPage: React.FC<OrdersPageProps> = ({
  setView,
  activeOrderNumber,
  recentOrders,
  normalizeStatusLabel
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {activeOrderNumber ? (
          <div className="bg-slate-900/60 border border-cyan-500/30 rounded-lg p-5">
            <p className="text-cyan-300 text-sm">Live Order</p>
            <p className="text-2xl font-bold">{activeOrderNumber}</p>
            <p className="text-gray-400 mt-2">Status updates are synchronized in real time.</p>
          </div>
        ) : null}
        {recentOrders.length === 0 ? (
          <div className="bg-slate-900/60 border border-white/10 rounded-lg p-8 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-400 mb-4">No recent orders yet.</p>
            <button 
              onClick={() => setView('menu')}
              className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-6 py-2 rounded-xl font-medium"
            >
              Start Ordering
            </button>
          </div>
        ) : (
          recentOrders.map((order) => (
            <div key={`${order.orderNumber}-${order.createdAt}`} className="bg-slate-900/60 border border-white/10 rounded-lg p-5">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-400">Order</p>
                  <p className="font-bold text-lg">{order.orderNumber}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'DELIVERED' || order.status === 'COMPLETED' 
                        ? 'bg-green-500/20 text-green-400' 
                        : order.status === 'CANCELLED' 
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-cyan-500/20 text-cyan-400'
                    }`}>
                      {normalizeStatusLabel(order.status)}
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-400 capitalize">{order.type?.toLowerCase() || 'pickup'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Total</p>
                  <p className="font-bold text-lg">${order.total?.toFixed(2) || '0.00'}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {/*
                      Backend `PaymentStatus` enum is PENDING|PROCESSING|COMPLETED|FAILED|REFUNDED
                      (we never persist 'PAID'). Treat anything COMPLETED as paid, FAILED/REFUNDED
                      as a clear failure, otherwise it's still in flight.
                    */}
                    {(() => {
                      const ps = String(order.payments?.[0]?.status || '').toUpperCase();
                      if (ps === 'COMPLETED') return '✅ Paid';
                      if (ps === 'FAILED') return '❌ Payment failed';
                      if (ps === 'REFUNDED') return '↩️ Refunded';
                      return '⏳ Pending';
                    })()}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex flex-wrap gap-2">
                  {order.items?.map((item: any, idx: number) => (
                    <span key={idx} className="text-xs bg-white/5 text-gray-300 px-2 py-1 rounded">
                      {item.quantity}x {item.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <span>{new Date(order.createdAt).toLocaleString()}</span>
                {order.lastUpdateAt && (
                  <span>Updated {new Date(order.lastUpdateAt).toLocaleTimeString()}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrdersPage;

