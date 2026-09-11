export declare const OrderEvents: {
    readonly ORDER_PLACED: "order:placed";
    readonly ORDER_CREATED: "order:created";
    readonly ORDER_PAID: "order:paid";
    readonly PAYMENT_RECEIVED: "payment:received";
    readonly PAYMENT_FAILED: "payment:failed";
    readonly ORDER_ITEM_PREPARED: "order:item:prepared";
    readonly ORDER_ITEM_STARTED: "order:item:started";
    readonly ORDER_ITEM_ASSEMBLED: "order:item:assembled";
    readonly ORDER_STATUS_CHANGED: "order:status:changed";
    readonly ORDER_UPDATED: "order:updated";
    readonly ORDER_CONFIRMED: "order:confirmed";
    readonly ORDER_IN_KITCHEN: "order:in:kitchen";
    readonly ORDER_PREPARING: "order:preparing";
    readonly ORDER_BAKING: "order:baking";
    readonly ORDER_PREPARED: "order:prepared";
    readonly ORDER_ASSEMBLED: "order:assembled";
    readonly ORDER_PACKED: "order:packed";
    readonly ORDER_READY_FOR_PICKUP: "order:ready:for:pickup";
    readonly ORDER_READY_TO_SERVE: "order:ready:to:serve";
    readonly ORDER_OUT_FOR_DELIVERY: "order:out:for:delivery";
    readonly ORDER_DELIVERED: "order:delivered";
    readonly ORDER_COMPLETED: "order:completed";
    readonly ORDER_CANCELLED: "order:cancelled";
    readonly ORDER_REFUNDED: "order:refunded";
    readonly KITCHEN_NEW_ORDER: "kitchen:new:order";
    readonly KITCHEN_ORDER_UPDATED: "kitchen:order:updated";
    readonly KITCHEN_ITEM_COMPLETED: "kitchen:item:completed";
    readonly KITCHEN_ALL_ITEMS_COMPLETED: "kitchen:all:items:completed";
    readonly PACKING_NEW_ORDER: "packing:new:order";
    readonly PACKING_ORDER_PACKED: "packing:order:packed";
    readonly DRIVER_ORDER_ASSIGNED: "driver:order:assigned";
    readonly DRIVER_ORDER_ACCEPTED: "driver:order:accepted";
    readonly DRIVER_ORDER_PICKED_UP: "driver:order:picked:up";
    readonly DRIVER_ORDER_DELIVERED: "driver:order:delivered";
    readonly DRIVER_LOCATION_UPDATED: "driver:location:updated";
    readonly DRIVER_AVAILABLE: "driver:available";
    readonly CUSTOMER_ORDER_UPDATED: "customer:order:updated";
    readonly CUSTOMER_ORDER_READY: "customer:order:ready";
    readonly CUSTOMER_NOTIFICATION: "customer:notification";
    readonly OSDU_ORDER_READY: "osdu:order:ready";
    readonly OSDU_ORDER_UPDATED: "osdu:order:updated";
};
export declare const RoomPrefixes: {
    readonly STORE: "store";
    readonly KITCHEN: "kitchen";
    readonly PACKING: "packing";
    readonly OSDU: "osdu";
    readonly ONLINE: "online";
    readonly DRIVERS: "drivers";
    readonly ADMIN: "admin";
    readonly COMPANY: "company";
};
export declare const OrderStatusFlow: {
    readonly CREATED: "CREATED";
    readonly CONFIRMED: "CONFIRMED";
    readonly PAID: "PAID";
    readonly IN_KITCHEN: "IN_KITCHEN";
    readonly PREPARING: "PREPARING";
    readonly BAKING: "BAKING";
    readonly PREPARED: "PREPARED";
    readonly ASSEMBLED: "ASSEMBLED";
    readonly PACKED: "PACKED";
    readonly OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY";
    readonly READY_FOR_PICKUP: "READY_FOR_PICKUP";
    readonly READY_TO_SERVE: "READY_TO_SERVE";
    readonly DELIVERED: "DELIVERED";
    readonly COMPLETED: "COMPLETED";
    readonly CANCELLED: "CANCELLED";
};
export declare const ItemStatusFlow: {
    readonly PENDING: "PENDING";
    readonly IN_PROGRESS: "IN_PROGRESS";
    readonly PREPARED: "PREPARED";
    readonly ASSEMBLED: "ASSEMBLED";
    readonly PACKED: "PACKED";
};
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
    location?: {
        lat: number;
        lng: number;
    };
    timestamp: string;
}
