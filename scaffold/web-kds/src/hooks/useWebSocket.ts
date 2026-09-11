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
}

export function useWebSocket(options: WebSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    const socket = io(`${API_URL}/ws`, {
      transports: ['websocket'],
      auth: {
        token: options.token || localStorage.getItem('token') || 'kds-token',
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('✅ KDS WebSocket connected');
      optionsRef.current.onConnect?.();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('❌ KDS WebSocket disconnected');
      optionsRef.current.onDisconnect?.();
    });

    socket.on('connection:established', (data) => {
      console.log('KDS Connection established:', data);
    });

    socket.on('connection:error', (error) => {
      console.error('KDS Connection error:', error);
    });

    // Order events
    socket.on('order:created', (order) => {
      console.log('📦 KDS Order created:', order.orderNumber);
      optionsRef.current.onOrderCreated?.(order);
    });

    socket.on('order:status-changed', (data) => {
      console.log('📊 KDS Order status changed:', data);
      optionsRef.current.onOrderStatusChanged?.(data);
    });

    // Kitchen specific events
    socket.on('kitchen:new-order', (order) => {
      console.log('🍳 KDS New order:', order.orderNumber);
      optionsRef.current.onKitchenNewOrder?.(order);
    });

    socket.on('kitchen:item-completed', (data) => {
      console.log('✅ KDS Item completed:', data);
      optionsRef.current.onKitchenItemCompleted?.(data);
    });

    return () => {
      socket.disconnect();
    };
  }, [options.token]);

  const subscribeToKDS = useCallback((storeId: string, station?: string) => {
    socketRef.current?.emit('kds:subscribe', { storeId, station }, (response: any) => {
      console.log('KDS subscription response:', response);
    });
  }, []);

  const emitOrderStatusUpdate = useCallback((data: { orderId: string; storeId: string; status: string }) => {
    socketRef.current?.emit('order:status-update', data);
  }, []);

  const emitKitchenItemComplete = useCallback((data: { orderId: string; itemId: string; storeId: string }) => {
    socketRef.current?.emit('kitchen:item-complete', data);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    subscribeToKDS,
    emitOrderStatusUpdate,
    emitKitchenItemComplete,
  };
}

export default useWebSocket;
