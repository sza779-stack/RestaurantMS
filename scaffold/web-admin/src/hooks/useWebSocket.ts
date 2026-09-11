import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface WebSocketOptions {
  token?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onOrderCreated?: (order: any) => void;
  onOrderStatusChanged?: (data: { orderId: string; status: string; timestamp: string }) => void;
  onKitchenNewOrder?: (order: any) => void;
  onKitchenItemCompleted?: (data: { orderId: string; itemId: string }) => void;
  onPackingOrderReady?: (data: { orderId: string; timestamp: string }) => void;
  onOSDUOrderReady?: (data: { orderId: string; timestamp: string }) => void;
}

export function useWebSocket(options: WebSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const optionsRef = useRef(options);

  // Keep options ref up to date
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    const socket = io(`${API_URL}/ws`, {
      transports: ['websocket'],
      auth: {
        token: options.token || localStorage.getItem('token') || '',
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('✅ WebSocket connected');
      optionsRef.current.onConnect?.();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('❌ WebSocket disconnected');
      optionsRef.current.onDisconnect?.();
    });

    socket.on('connection:established', (data) => {
      console.log('Connection established:', data);
    });

    socket.on('connection:error', (error) => {
      console.error('Connection error:', error);
    });

    const handleOrderCreated = (order: any) => {
      console.log('📦 Order created:', order.orderNumber);
      optionsRef.current.onOrderCreated?.(order);
    };
    socket.on('order:created', handleOrderCreated);
    socket.on('order:placed', handleOrderCreated);

    const handleOrderStatusChanged = (data: any) => {
      console.log('📊 Order status changed:', data);
      optionsRef.current.onOrderStatusChanged?.(data);
    };
    socket.on('order:status-changed', handleOrderStatusChanged);
    socket.on('order:status:changed', handleOrderStatusChanged);

    // Kitchen events
    const handleKitchenNewOrder = (order: any) => {
      console.log('🍳 Kitchen new order:', order.orderNumber);
      optionsRef.current.onKitchenNewOrder?.(order);
    };
    socket.on('kitchen:new-order', handleKitchenNewOrder);
    socket.on('kitchen:new:order', handleKitchenNewOrder);

    socket.on('kitchen:item-completed', (data) => {
      console.log('✅ Kitchen item completed:', data);
      optionsRef.current.onKitchenItemCompleted?.(data);
    });

    // Packing events
    socket.on('packing:order-ready', (data) => {
      console.log('📦 Packing order ready:', data);
      optionsRef.current.onPackingOrderReady?.(data);
    });

    // OSDU events
    const handleOsduReady = (data: any) => {
      console.log('📱 OSDU order ready:', data);
      optionsRef.current.onOSDUOrderReady?.(data);
    };
    socket.on('osdu:order-ready', handleOsduReady);
    socket.on('osdu:order:ready', handleOsduReady);

    return () => {
      socket.disconnect();
    };
  }, [options.token]);

  const subscribeToStore = useCallback((storeId: string) => {
    socketRef.current?.emit('store:subscribe', storeId, (response: any) => {
      console.log('Store subscription response:', response);
    });
  }, []);

  const unsubscribeFromStore = useCallback((storeId: string) => {
    socketRef.current?.emit('store:unsubscribe', storeId);
  }, []);

  const emitOrderCreated = useCallback((order: any) => {
    socketRef.current?.emit('order:created', order);
    socketRef.current?.emit('order:placed', order);
  }, []);

  const emitOrderStatusUpdate = useCallback((data: { orderId: string; storeId: string; status: string }) => {
    socketRef.current?.emit('order:status-update', data);
    socketRef.current?.emit('order:status:update', data);
  }, []);

  const subscribeToKDS = useCallback((storeId: string, station?: string) => {
    socketRef.current?.emit('kds:subscribe', { storeId, station }, (response: any) => {
      console.log('KDS subscription response:', response);
    });
  }, []);

  const subscribeToPacking = useCallback((storeId: string) => {
    socketRef.current?.emit('packing:subscribe', storeId, (response: any) => {
      console.log('Packing subscription response:', response);
    });
  }, []);

  const subscribeToOSDU = useCallback((storeId: string) => {
    socketRef.current?.emit('osdu:subscribe', storeId, (response: any) => {
      console.log('OSDU subscription response:', response);
    });
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    subscribeToStore,
    unsubscribeFromStore,
    emitOrderCreated,
    emitOrderStatusUpdate,
    subscribeToKDS,
    subscribeToPacking,
    subscribeToOSDU,
  };
}

export default useWebSocket;
