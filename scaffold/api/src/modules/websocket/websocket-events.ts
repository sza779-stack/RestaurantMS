/**
 * WebSocket Event Types for 360° Real-Time Synchronization
 * Centralized event definitions for all modules
 */

// Order Lifecycle Events
export const OrderEvents = {
  // Creation & Placement
  ORDER_PLACED: 'order:placed',
  ORDER_CREATED: 'order:created',
  
  // Payment
  ORDER_PAID: 'order:paid',
  PAYMENT_RECEIVED: 'payment:received',
  PAYMENT_FAILED: 'payment:failed',
  
  // Item-level Events
  ORDER_ITEM_PREPARED: 'order:item:prepared',
  ORDER_ITEM_STARTED: 'order:item:started',
  ORDER_ITEM_ASSEMBLED: 'order:item:assembled',
  
  // Order Status Changes
  ORDER_STATUS_CHANGED: 'order:status:changed',
  ORDER_UPDATED: 'order:updated',
  ORDER_CONFIRMED: 'order:confirmed',
  ORDER_IN_KITCHEN: 'order:in:kitchen',
  ORDER_PREPARING: 'order:preparing',
  ORDER_BAKING: 'order:baking',
  ORDER_PREPARED: 'order:prepared',
  ORDER_ASSEMBLED: 'order:assembled',
  ORDER_PACKED: 'order:packed',
  ORDER_READY_FOR_PICKUP: 'order:ready:for:pickup',
  ORDER_READY_TO_SERVE: 'order:ready:to:serve',
  ORDER_OUT_FOR_DELIVERY: 'order:out:for:delivery',
  ORDER_DELIVERED: 'order:delivered',
  ORDER_COMPLETED: 'order:completed',
  ORDER_CANCELLED: 'order:cancelled',
  ORDER_REFUNDED: 'order:refunded',
  
  // Kitchen-specific
  KITCHEN_NEW_ORDER: 'kitchen:new:order',
  KITCHEN_ORDER_UPDATED: 'kitchen:order:updated',
  KITCHEN_ITEM_COMPLETED: 'kitchen:item:completed',
  KITCHEN_ALL_ITEMS_COMPLETED: 'kitchen:all:items:completed',
  
  // Packing-specific
  PACKING_NEW_ORDER: 'packing:new:order',
  PACKING_ORDER_PACKED: 'packing:order:packed',
  
  // Driver-specific
  DRIVER_ORDER_ASSIGNED: 'driver:order:assigned',
  DRIVER_ORDER_ACCEPTED: 'driver:order:accepted',
  DRIVER_ORDER_PICKED_UP: 'driver:order:picked:up',
  DRIVER_ORDER_DELIVERED: 'driver:order:delivered',
  DRIVER_LOCATION_UPDATED: 'driver:location:updated',
  DRIVER_AVAILABLE: 'driver:available',
  
  // Customer-facing
  CUSTOMER_ORDER_UPDATED: 'customer:order:updated',
  CUSTOMER_ORDER_READY: 'customer:order:ready',
  CUSTOMER_NOTIFICATION: 'customer:notification',
  
  // Display-specific
  OSDU_ORDER_READY: 'osdu:order:ready',
  OSDU_ORDER_UPDATED: 'osdu:order:updated',
} as const;

// Room/Channel Names
export const RoomPrefixes = {
  STORE: 'store',
	  KITCHEN: 'kitchen',
	  PACKING: 'packing',
	  OSDU: 'osdu',
	  ONLINE: 'online',
  DRIVERS: 'drivers',
  ADMIN: 'admin',
  COMPANY: 'company',
} as const;

// Order Status Flow
export const OrderStatusFlow = {
  CREATED: 'CREATED',
  CONFIRMED: 'CONFIRMED',
  PAID: 'PAID',
  IN_KITCHEN: 'IN_KITCHEN',
  PREPARING: 'PREPARING',
  BAKING: 'BAKING',
  PREPARED: 'PREPARED',
  ASSEMBLED: 'ASSEMBLED',
  PACKED: 'PACKED',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  READY_TO_SERVE: 'READY_TO_SERVE',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

// Item Status Flow
export const ItemStatusFlow = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  PREPARED: 'PREPARED',
  ASSEMBLED: 'ASSEMBLED',
  PACKED: 'PACKED',
} as const;

// Event Payload Types
export interface OrderEventPayload {
  orderId: string;
  storeId: string;
  status: string;
  previousStatus?: string;
  timestamp: string;
  data?: any;
}

export interface ItemEventPayload {
  orderId: string;
  itemId: string;
  storeId: string;
  status: string;
  timestamp: string;
  data?: any;
}

export interface DriverEventPayload {
  driverId: string;
  orderId: string;
  storeId: string;
  status: string;
  location?: { lat: number; lng: number };
  timestamp: string;
}
