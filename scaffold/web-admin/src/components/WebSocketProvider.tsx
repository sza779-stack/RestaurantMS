import { useEffect, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useStore } from '../hooks/useStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { currentStore, setStore } = useStore();

  useEffect(() => {
    fetch(`${API_URL}/api/v1/orders/public/default-store`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.storeId) return;
        if (!currentStore) {
          setStore({ id: data.storeId, name: 'Default Store' });
          return;
        }
        if (currentStore.id !== data.storeId) {
          setStore({ ...currentStore, id: data.storeId });
        }
      })
      .catch(() => {});
  }, [currentStore, setStore]);
  const { 
    isConnected, 
    subscribeToStore, 
    subscribeToKDS,
    subscribeToPacking,
    subscribeToOSDU,
  } = useWebSocket({
    onConnect: () => {
      console.log('🔌 WebSocket Provider: Connected');
    },
    onDisconnect: () => {
      console.log('🔌 WebSocket Provider: Disconnected');
    },
    onOrderCreated: (order) => {
      console.log('📦 WebSocket Provider: Order created', order.orderNumber);
    },
    onOrderStatusChanged: (data) => {
      console.log('📊 WebSocket Provider: Order status changed', data);
    },
  });

  // Subscribe to store when connected
  useEffect(() => {
    if (isConnected && currentStore?.id) {
      console.log('📡 Subscribing to store:', currentStore.id);
      subscribeToStore(currentStore.id);
      
      // Also subscribe to KDS, Packing, and OSDU for admin
      subscribeToKDS(currentStore.id);
      subscribeToPacking(currentStore.id);
      subscribeToOSDU(currentStore.id);
    }
  }, [isConnected, currentStore?.id, subscribeToStore, subscribeToKDS, subscribeToPacking, subscribeToOSDU]);

  return <>{children}</>;
}

export default WebSocketProvider;
