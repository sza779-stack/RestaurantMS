"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WebsocketGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const orders_service_1 = require("../orders/orders.service");
const websocket_events_1 = require("./websocket-events");
const redis_service_1 = require("../redis/redis.service");
const LOCAL_WS_CORS_ORIGINS = [
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'http://localhost:3005',
    'http://localhost:3006',
];
function websocketGatewayCorsOrigins() {
    const raw = process.env.WS_CORS_ORIGINS?.trim() ||
        process.env.CORS_ORIGINS?.trim() ||
        '';
    const fromEnv = raw
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
    if (fromEnv.length > 0) {
        return fromEnv;
    }
    return [...LOCAL_WS_CORS_ORIGINS];
}
let WebsocketGateway = WebsocketGateway_1 = class WebsocketGateway {
    logWsLifecycle(message) {
        if (this.wsVerbose) {
            this.logger.log(message);
        }
    }
    constructor(jwtService, ordersService, redisPubSub) {
        this.jwtService = jwtService;
        this.ordersService = ordersService;
        this.redisPubSub = redisPubSub;
        this.logger = new common_1.Logger(WebsocketGateway_1.name);
        this.connectedClients = new Map();
        this.wsVerbose = ['1', 'true', 'yes'].includes(String(process.env.WS_VERBOSE || '').toLowerCase());
        this.driverLocationChannel = 'drivers:location:update';
        this.driverLocationSubscriber = (payload) => {
            const storeId = String(payload?.storeId || '');
            const driverId = String(payload?.driverId || payload?.id || '');
            const lat = Number(payload?.lat ?? payload?.location?.lat);
            const lng = Number(payload?.lng ?? payload?.location?.lng);
            if (!storeId || !driverId || !Number.isFinite(lat) || !Number.isFinite(lng) || !this.server) {
                return;
            }
            const normalized = {
                driverId,
                id: driverId,
                storeId,
                lat,
                lng,
                heading: Number(payload?.heading ?? 0),
                timestamp: payload?.timestamp || new Date().toISOString(),
            };
            const rooms = [
                `${websocket_events_1.RoomPrefixes.STORE}:${storeId}`,
                `${websocket_events_1.RoomPrefixes.ADMIN}:${storeId}`,
                `${websocket_events_1.RoomPrefixes.ONLINE}:${storeId}`,
                `${websocket_events_1.RoomPrefixes.DRIVERS}:${storeId}`,
            ];
            for (const room of rooms) {
                this.server.to(room).emit(websocket_events_1.OrderEvents.DRIVER_LOCATION_UPDATED, normalized);
                this.server.to(room).emit('drivers:location:update', normalized);
            }
        };
    }
    async onModuleInit() {
        await this.redisPubSub.subscribe(this.driverLocationChannel, this.driverLocationSubscriber);
    }
    async onModuleDestroy() {
        await this.redisPubSub.unsubscribe(this.driverLocationChannel, this.driverLocationSubscriber);
    }
    async handleConnection(client) {
        this.logWsLifecycle(`Client connected: ${client.id}`);
        try {
            const token = client.handshake.auth.token;
            if (!token || this.isServiceClientToken(token)) {
                const payload = this.buildServiceClientPayload(token);
                client.user = payload;
                this.connectedClients.set(client.id, client);
                client.emit('connection:established', {
                    userId: payload.userId,
                    message: 'Connected successfully',
                    serviceClient: true,
                });
                this.logWsLifecycle(`Service client connected: ${client.id} (${payload.role})`);
                return;
            }
            const payload = this.jwtService.verify(token);
            client.user = payload;
            this.connectedClients.set(client.id, client);
            if (payload.companyId) {
                client.join(`${websocket_events_1.RoomPrefixes.COMPANY}:${payload.companyId}`);
            }
            client.emit('connection:established', {
                userId: payload.userId,
                message: 'Connected successfully',
            });
            this.logWsLifecycle(`Client authenticated: ${client.id} (User: ${payload.userId})`);
        }
        catch (error) {
            this.logger.error(`Authentication failed for client: ${client.id}`, error.message);
            client.emit('connection:error', 'Authentication failed');
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.logWsLifecycle(`Client disconnected: ${client.id}`);
        this.connectedClients.delete(client.id);
    }
    async handleStoreSubscribe(storeId, client) {
        const resolvedStoreId = await this.resolveStoreIdForRooms(storeId);
        client.storeId = resolvedStoreId;
        this.joinStoreRooms(client, websocket_events_1.RoomPrefixes.STORE, storeId, resolvedStoreId);
        this.logWsLifecycle(`Client ${client.id} subscribed to store: ${resolvedStoreId}`);
        return {
            event: 'store:subscribed',
            data: { storeId: resolvedStoreId, requestedStoreId: storeId },
        };
    }
    async handleStoreUnsubscribe(storeId, client) {
        const resolvedStoreId = await this.resolveStoreIdForRooms(storeId);
        client.leave(`${websocket_events_1.RoomPrefixes.STORE}:${resolvedStoreId}`);
        client.leave(`${websocket_events_1.RoomPrefixes.STORE}:${storeId}`);
        return {
            event: 'store:unsubscribed',
            data: { storeId: resolvedStoreId, requestedStoreId: storeId },
        };
    }
    async handleKitchenSubscribe(data, client) {
        const resolvedStoreId = await this.resolveStoreIdForRooms(data.storeId);
        this.joinStoreRooms(client, websocket_events_1.RoomPrefixes.KITCHEN, data.storeId, resolvedStoreId);
        if (data.station) {
            client.join(`kitchen:${resolvedStoreId}:${data.station}`);
        }
        this.logWsLifecycle(`Kitchen client ${client.id} subscribed to store: ${resolvedStoreId}`);
        return { event: 'kitchen:subscribed', data: { storeId: resolvedStoreId, station: data.station } };
    }
    async handleKdsSubscribe(data, client) {
        return this.handleKitchenSubscribe(data, client);
    }
    async handlePackingSubscribe(storeId, client) {
        const resolvedStoreId = await this.resolveStoreIdForRooms(storeId);
        this.joinStoreRooms(client, websocket_events_1.RoomPrefixes.PACKING, storeId, resolvedStoreId);
        this.logWsLifecycle(`Packing client ${client.id} subscribed to store: ${resolvedStoreId}`);
        return { event: 'packing:subscribed', data: { storeId: resolvedStoreId } };
    }
    async handleOSDUSubscribe(storeId, client) {
        const resolvedStoreId = await this.resolveStoreIdForRooms(storeId);
        this.joinStoreRooms(client, websocket_events_1.RoomPrefixes.OSDU, storeId, resolvedStoreId);
        this.logWsLifecycle(`OSDU client ${client.id} subscribed to store: ${resolvedStoreId}`);
        return { event: 'osdu:subscribed', data: { storeId: resolvedStoreId } };
    }
    async handleOnlineSubscribe(storeId, client) {
        const resolvedStoreId = await this.resolveStoreIdForRooms(storeId);
        this.joinStoreRooms(client, websocket_events_1.RoomPrefixes.ONLINE, storeId, resolvedStoreId);
        this.logWsLifecycle(`Online client ${client.id} subscribed to store: ${resolvedStoreId}`);
        return { event: 'online:subscribed', data: { storeId: resolvedStoreId } };
    }
    async handleDriversSubscribe(storeId, client) {
        const resolvedStoreId = await this.resolveStoreIdForRooms(storeId);
        this.joinStoreRooms(client, websocket_events_1.RoomPrefixes.DRIVERS, storeId, resolvedStoreId);
        this.logWsLifecycle(`Driver client ${client.id} subscribed to store: ${resolvedStoreId}`);
        return { event: 'drivers:subscribed', data: { storeId: resolvedStoreId } };
    }
    async handleAdminSubscribe(data, client) {
        if (data.storeId) {
            const resolvedStoreId = await this.resolveStoreIdForRooms(data.storeId);
            client.join(`${websocket_events_1.RoomPrefixes.ADMIN}:${resolvedStoreId}`);
        }
        if (data.companyId) {
            client.join(`${websocket_events_1.RoomPrefixes.COMPANY}:${data.companyId}`);
        }
        this.logWsLifecycle(`Admin client ${client.id} subscribed`);
        return { event: 'admin:subscribed', data };
    }
    async handleOrderPlaced(order, client) {
        const storeId = await this.resolveStoreIdForRooms(order.storeId);
        const payload = { ...order, storeId, timestamp: new Date().toISOString() };
        this.broadcastOrderEvent(storeId, websocket_events_1.OrderEvents.ORDER_PLACED, payload);
        this.server.to(`${websocket_events_1.RoomPrefixes.KITCHEN}:${storeId}`).emit(websocket_events_1.OrderEvents.KITCHEN_NEW_ORDER, payload);
        this.server.to(`${websocket_events_1.RoomPrefixes.ONLINE}:${storeId}`).emit(websocket_events_1.OrderEvents.CUSTOMER_ORDER_UPDATED, payload);
        this.logger.log(`Order placed broadcast: ${order.orderNumber} to store ${storeId}`);
        return { event: websocket_events_1.OrderEvents.ORDER_PLACED, data: payload };
    }
    async handleOrderCreatedLegacy(order, client) {
        return this.handleOrderPlaced(order, client);
    }
    async handleOrderStatusUpdate(data, client) {
        const resolvedStoreId = await this.resolveStoreIdForRooms(data.storeId);
        const payload = {
            orderId: data.orderId,
            storeId: resolvedStoreId,
            status: data.status,
            previousStatus: data.previousStatus,
            timestamp: new Date().toISOString(),
        };
        this.broadcastOrderStatusChange(resolvedStoreId, payload);
        this.logger.log(`Order status updated: ${data.orderId} -> ${data.status}`);
        return { event: websocket_events_1.OrderEvents.ORDER_STATUS_CHANGED, data: payload };
    }
    async handleOrderStatusUpdateLegacy(data, client) {
        return this.handleOrderStatusUpdate(data, client);
    }
    async handleOrderItemPreparedLegacy(data, client) {
        return this.handleOrderItemUpdate(data, client);
    }
    async handleOrderItemUpdate(data, client) {
        const resolvedStoreId = await this.resolveStoreIdForRooms(data.storeId);
        await this.ordersService.updateItemStatus(data.orderId, data.itemId, data.status, resolvedStoreId);
        const payload = {
            orderId: data.orderId,
            itemId: data.itemId,
            storeId: resolvedStoreId,
            status: data.status,
            timestamp: new Date().toISOString(),
        };
        this.server.to(`${websocket_events_1.RoomPrefixes.KITCHEN}:${resolvedStoreId}`).emit(websocket_events_1.OrderEvents.ORDER_ITEM_PREPARED, payload);
        this.server.to(`${websocket_events_1.RoomPrefixes.STORE}:${resolvedStoreId}`).emit(websocket_events_1.OrderEvents.ORDER_ITEM_PREPARED, payload);
        this.logger.log(`Order item updated: ${data.itemId} in order ${data.orderId} -> ${data.status}`);
        return { event: websocket_events_1.OrderEvents.ORDER_ITEM_PREPARED, data: payload };
    }
    async handleOrderPayment(data, client) {
        const resolvedStoreId = await this.resolveStoreIdForRooms(data.storeId);
        const payload = {
            orderId: data.orderId,
            storeId: resolvedStoreId,
            payment: data.payment,
            timestamp: new Date().toISOString(),
        };
        this.broadcastOrderEvent(resolvedStoreId, websocket_events_1.OrderEvents.ORDER_PAID, payload);
        if (data.payment.orderType === 'DELIVERY') {
            this.server.to(`${websocket_events_1.RoomPrefixes.DRIVERS}:${resolvedStoreId}`).emit(websocket_events_1.OrderEvents.DRIVER_ORDER_ASSIGNED, payload);
        }
        this.logger.log(`Payment received for order: ${data.orderId}`);
        return { event: websocket_events_1.OrderEvents.PAYMENT_RECEIVED, data: payload };
    }
    async handleDriverLocation(data, client) {
        const resolvedStoreId = await this.resolveStoreIdForRooms(data.storeId);
        const normalized = {
            driverId: data.driverId,
            id: data.driverId,
            storeId: resolvedStoreId,
            lat: Number(data.lat),
            lng: Number(data.lng),
            heading: 0,
            timestamp: new Date().toISOString(),
        };
        await this.redisPubSub.publish(this.driverLocationChannel, normalized);
    }
    handleDriverStatus(data, client) {
        if (data.status === 'ACCEPTED') {
            this.ordersService.assignDriver(data.orderId, data.driverId, data.storeId).catch((error) => {
                this.logger.error(`Failed to assign driver for ${data.orderId}: ${error?.message}`);
            });
        }
        if (data.status === 'DELIVERED') {
            this.ordersService.markDelivered(data.orderId, data.driverId, data.storeId).catch((error) => {
                this.logger.error(`Failed to mark delivered for ${data.orderId}: ${error?.message}`);
            });
        }
        const payload = {
            driverId: data.driverId,
            orderId: data.orderId,
            storeId: data.storeId,
            status: data.status,
            timestamp: new Date().toISOString(),
        };
        const eventMap = {
            'ACCEPTED': websocket_events_1.OrderEvents.DRIVER_ORDER_ACCEPTED,
            'PICKED_UP': websocket_events_1.OrderEvents.DRIVER_ORDER_PICKED_UP,
            'DELIVERED': websocket_events_1.OrderEvents.DRIVER_ORDER_DELIVERED,
        };
        const eventName = eventMap[data.status] || websocket_events_1.OrderEvents.DRIVER_ORDER_ACCEPTED;
        this.server.to(`${websocket_events_1.RoomPrefixes.STORE}:${data.storeId}`).emit(eventName, payload);
        this.server.to(`${websocket_events_1.RoomPrefixes.ONLINE}:${data.storeId}`).emit(eventName, payload);
        this.server.to(`${websocket_events_1.RoomPrefixes.ADMIN}:${data.storeId}`).emit(eventName, payload);
        if (data.status === 'DELIVERED') {
            this.server.to(`${websocket_events_1.RoomPrefixes.STORE}:${data.storeId}`).emit(websocket_events_1.OrderEvents.ORDER_COMPLETED, {
                ...payload,
                orderId: data.orderId,
            });
        }
    }
    broadcastOrderEvent(storeId, event, data) {
        if (!this.server)
            return;
        this.emitWithAliases(`${websocket_events_1.RoomPrefixes.STORE}:${storeId}`, event, data);
        this.emitWithAliases(`${websocket_events_1.RoomPrefixes.ADMIN}:${storeId}`, event, data);
    }
    broadcastOrderStatusChange(storeId, payload) {
        if (!this.server)
            return;
        const { status, orderId, data } = payload;
        const orderData = data?.data || data || {};
        this.emitWithAliases(`${websocket_events_1.RoomPrefixes.STORE}:${storeId}`, websocket_events_1.OrderEvents.ORDER_STATUS_CHANGED, payload);
        this.emitWithAliases(`${websocket_events_1.RoomPrefixes.ADMIN}:${storeId}`, websocket_events_1.OrderEvents.ORDER_STATUS_CHANGED, payload);
        this.emitWithAliases(`${websocket_events_1.RoomPrefixes.OSDU}:${storeId}`, websocket_events_1.OrderEvents.ORDER_STATUS_CHANGED, payload);
        this.syncKDS(storeId, status, orderId, data);
        this.syncOSDU(storeId, status, orderId, orderData);
        this.syncModuleRouting(storeId, status, payload, orderData);
        return;
    }
    syncKDS(storeId, status, orderId, data) {
        const kdsStatuses = ['PAID', 'IN_KITCHEN', 'IN_PROGRESS', 'PREPARING', 'BAKING', 'IN_OVEN', 'PREPARED', 'READY'];
        if (!kdsStatuses.includes(status))
            return;
        this.server.to(`${websocket_events_1.RoomPrefixes.KITCHEN}:${storeId}`).emit('order:status-changed', {
            orderId,
            status,
            timestamp: new Date().toISOString(),
        });
        if (['PAID', 'IN_KITCHEN', 'IN_PROGRESS', 'PREPARING'].includes(status) && data) {
            this.server.to(`${websocket_events_1.RoomPrefixes.KITCHEN}:${storeId}`).emit('kitchen:new-order', data);
        }
    }
    syncOSDU(storeId, status, orderId, orderData) {
        const osduStatuses = ['PACKING', 'PACKED', 'READY', 'READY_FOR_PICKUP', 'READY_TO_SERVE'];
        if (!osduStatuses.includes(status))
            return;
        const items = orderData?.items || [];
        const osduPayload = {
            orderId,
            tokenNumber: orderData?.tokenNumber || orderData?.orderNumber,
            orderNumber: orderData?.orderNumber,
            status: 'READY',
            type: orderData?.type || 'PICKUP',
            customerName: orderData?.customerName,
            items: items.length,
            itemDetails: items.slice(0, 5).map((item) => ({
                productName: item.productName || 'Unknown Item',
                quantity: item.quantity || 1,
            })),
            timestamp: new Date().toISOString(),
        };
        this.server.to(`${websocket_events_1.RoomPrefixes.OSDU}:${storeId}`).emit('osdu:order-ready', osduPayload);
        this.server.to(`${websocket_events_1.RoomPrefixes.ONLINE}:${storeId}`).emit('customer:order-ready', osduPayload);
    }
    syncModuleRouting(storeId, status, payload, orderData) {
        const { orderId } = payload;
        switch (status) {
            case 'IN_KITCHEN':
            case 'IN_PROGRESS':
            case 'PREPARING':
            case 'BAKING':
                this.emitWithAliases(`${websocket_events_1.RoomPrefixes.KITCHEN}:${storeId}`, websocket_events_1.OrderEvents.ORDER_IN_KITCHEN, payload);
                break;
            case 'PACKING':
            case 'READY':
                this.emitWithAliases(`${websocket_events_1.RoomPrefixes.KITCHEN}:${storeId}`, websocket_events_1.OrderEvents.ORDER_PREPARED, payload);
                this.emitWithAliases(`${websocket_events_1.RoomPrefixes.PACKING}:${storeId}`, websocket_events_1.OrderEvents.PACKING_NEW_ORDER, payload);
                this.server.to(`${websocket_events_1.RoomPrefixes.PACKING}:${storeId}`).emit('packing:order-ready', payload.data || payload);
                break;
            case 'PACKED':
                this.handleOrderPacked(storeId, payload);
                break;
            case 'READY_FOR_PICKUP':
                this.emitWithAliases(`${websocket_events_1.RoomPrefixes.OSDU}:${storeId}`, websocket_events_1.OrderEvents.OSDU_ORDER_READY, payload);
                this.emitWithAliases(`${websocket_events_1.RoomPrefixes.ONLINE}:${storeId}`, websocket_events_1.OrderEvents.CUSTOMER_ORDER_READY, payload);
                break;
            case 'READY_TO_SERVE':
                this.emitWithAliases(`${websocket_events_1.RoomPrefixes.STORE}:${storeId}`, websocket_events_1.OrderEvents.ORDER_READY_TO_SERVE, payload);
                break;
            case 'OUT_FOR_DELIVERY':
                this.emitWithAliases(`${websocket_events_1.RoomPrefixes.DRIVERS}:${storeId}`, websocket_events_1.OrderEvents.ORDER_OUT_FOR_DELIVERY, payload);
                this.emitWithAliases(`${websocket_events_1.RoomPrefixes.ONLINE}:${storeId}`, websocket_events_1.OrderEvents.ORDER_OUT_FOR_DELIVERY, payload);
                this.sendCustomerNotification(storeId, 'delivery_update', 'Order Out For Delivery', `Order ${orderData?.orderNumber || orderId} is on the way.`, orderId, orderData?.orderNumber, status);
                break;
            case 'DELIVERED':
                this.emitWithAliases(`${websocket_events_1.RoomPrefixes.ONLINE}:${storeId}`, websocket_events_1.OrderEvents.ORDER_DELIVERED, payload);
                this.emitWithAliases(`${websocket_events_1.RoomPrefixes.STORE}:${storeId}`, websocket_events_1.OrderEvents.ORDER_DELIVERED, payload);
                this.sendCustomerNotification(storeId, 'delivery_update', 'Order Delivered', `Order ${orderData?.orderNumber || orderId} has been delivered.`, orderId, orderData?.orderNumber, status);
                break;
            case 'COMPLETED':
                this.emitWithAliases(`${websocket_events_1.RoomPrefixes.STORE}:${storeId}`, websocket_events_1.OrderEvents.ORDER_COMPLETED, payload);
                this.emitWithAliases(`${websocket_events_1.RoomPrefixes.ONLINE}:${storeId}`, websocket_events_1.OrderEvents.ORDER_COMPLETED, payload);
                this.emitWithAliases(`${websocket_events_1.RoomPrefixes.OSDU}:${storeId}`, websocket_events_1.OrderEvents.ORDER_COMPLETED, payload);
                this.sendCustomerNotification(storeId, 'delivery_update', 'Order Completed', `Order ${orderData?.orderNumber || orderId} is complete. Thank you!`, orderId, orderData?.orderNumber, status);
                break;
            case 'CANCELLED':
                this.emitWithAliases(`${websocket_events_1.RoomPrefixes.STORE}:${storeId}`, websocket_events_1.OrderEvents.ORDER_CANCELLED, payload);
                this.emitWithAliases(`${websocket_events_1.RoomPrefixes.KITCHEN}:${storeId}`, websocket_events_1.OrderEvents.ORDER_CANCELLED, payload);
                this.emitWithAliases(`${websocket_events_1.RoomPrefixes.ONLINE}:${storeId}`, websocket_events_1.OrderEvents.ORDER_CANCELLED, payload);
                break;
        }
    }
    handleOrderPacked(storeId, payload) {
        this.emitWithAliases(`${websocket_events_1.RoomPrefixes.PACKING}:${storeId}`, websocket_events_1.OrderEvents.PACKING_ORDER_PACKED, payload);
        const type = payload.data?.type;
        if (type === 'DELIVERY') {
            this.emitWithAliases(`${websocket_events_1.RoomPrefixes.DRIVERS}:${storeId}`, websocket_events_1.OrderEvents.DRIVER_ORDER_ASSIGNED, payload);
        }
        else if (type === 'PICKUP') {
            this.emitWithAliases(`${websocket_events_1.RoomPrefixes.OSDU}:${storeId}`, websocket_events_1.OrderEvents.ORDER_READY_FOR_PICKUP, payload);
            this.emitWithAliases(`${websocket_events_1.RoomPrefixes.ONLINE}:${storeId}`, websocket_events_1.OrderEvents.CUSTOMER_ORDER_READY, payload);
        }
        else if (type === 'DINE_IN') {
            this.emitWithAliases(`${websocket_events_1.RoomPrefixes.STORE}:${storeId}`, websocket_events_1.OrderEvents.ORDER_READY_TO_SERVE, payload);
        }
    }
    sendCustomerNotification(storeId, type, title, message, orderId, orderNumber, status) {
        const notification = {
            type,
            title,
            message,
            orderId,
            orderNumber,
            status,
            timestamp: new Date().toISOString(),
        };
        this.emitWithAliases(`${websocket_events_1.RoomPrefixes.ONLINE}:${storeId}`, websocket_events_1.OrderEvents.CUSTOMER_NOTIFICATION, notification);
    }
    broadcastToStore(storeId, event, data) {
        this.broadcastOrderEvent(storeId, event, data);
    }
    broadcastToKitchen(storeId, event, data) {
        if (!this.server)
            return;
        this.server.to(`${websocket_events_1.RoomPrefixes.KITCHEN}:${storeId}`).emit(event, data);
    }
    broadcastToOSDU(storeId, event, data) {
        if (!this.server)
            return;
        this.server.to(`${websocket_events_1.RoomPrefixes.OSDU}:${storeId}`).emit(event, data);
    }
    broadcastToDrivers(storeId, event, data) {
        if (!this.server)
            return;
        this.server.to(`${websocket_events_1.RoomPrefixes.DRIVERS}:${storeId}`).emit(event, data);
    }
    broadcastToOnline(storeId, event, data) {
        if (!this.server)
            return;
        this.server.to(`${websocket_events_1.RoomPrefixes.ONLINE}:${storeId}`).emit(event, data);
    }
    isServiceClientToken(token) {
        const isProduction = (process.env.NODE_ENV || 'development') === 'production';
        const allowInsecureServiceTokens = (process.env.WS_ALLOW_INSECURE_SERVICE_TOKENS || (isProduction ? 'false' : 'true')).toLowerCase() === 'true';
        if (!allowInsecureServiceTokens) {
            return false;
        }
        if (!token)
            return true;
        return ['kds-token', 'packing-token', 'osdu-token', 'online-token', 'driver-token'].includes(token);
    }
    buildServiceClientPayload(token) {
        const role = (token || 'service-token').replace('-token', '').toUpperCase();
        return {
            userId: `service:${role.toLowerCase()}`,
            email: `${role.toLowerCase()}@local.service`,
            role,
        };
    }
    async resolveStoreIdForRooms(storeId) {
        return this.ordersService.resolveStoreId(storeId);
    }
    joinStoreRooms(client, prefix, requestedStoreId, resolvedStoreId) {
        const rooms = new Set([
            `${prefix}:${resolvedStoreId}`,
            ...(requestedStoreId ? [`${prefix}:${requestedStoreId}`] : []),
        ]);
        for (const room of rooms) {
            client.join(room);
        }
    }
    emitWithAliases(room, event, data) {
        this.server.to(room).emit(event, data);
        const aliasMap = {
            [websocket_events_1.OrderEvents.ORDER_PLACED]: ['order:created', 'kitchen:new-order'],
            [websocket_events_1.OrderEvents.KITCHEN_NEW_ORDER]: ['kitchen:new-order', 'order:created'],
            [websocket_events_1.OrderEvents.ORDER_STATUS_CHANGED]: ['order:status-changed'],
            [websocket_events_1.OrderEvents.ORDER_IN_KITCHEN]: ['kitchen:new-order'],
            [websocket_events_1.OrderEvents.ORDER_PREPARED]: ['order:ready'],
            [websocket_events_1.OrderEvents.OSDU_ORDER_READY]: ['order:ready', 'osdu:order-ready'],
            [websocket_events_1.OrderEvents.PACKING_NEW_ORDER]: ['packing:order-ready'],
            [websocket_events_1.OrderEvents.PACKING_ORDER_PACKED]: ['order:packed'],
            [websocket_events_1.OrderEvents.CUSTOMER_ORDER_READY]: ['order:ready'],
            [websocket_events_1.OrderEvents.DRIVER_ORDER_ASSIGNED]: ['driver:delivery-assigned'],
        };
        const aliases = aliasMap[event] || [];
        for (const alias of aliases) {
            this.server.to(room).emit(alias, data);
        }
    }
};
exports.WebsocketGateway = WebsocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], WebsocketGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('store:subscribe'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleStoreSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('store:unsubscribe'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleStoreUnsubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('kitchen:subscribe'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleKitchenSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('kds:subscribe'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleKdsSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('packing:subscribe'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handlePackingSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('osdu:subscribe'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleOSDUSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('online:subscribe'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleOnlineSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('drivers:subscribe'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleDriversSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('admin:subscribe'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleAdminSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('order:placed'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleOrderPlaced", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('order:created'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleOrderCreatedLegacy", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('order:status:update'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleOrderStatusUpdate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('order:status-update'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleOrderStatusUpdateLegacy", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('order:item:prepared'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleOrderItemPreparedLegacy", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('order:item:update'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleOrderItemUpdate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('order:payment'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleOrderPayment", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('driver:location'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleDriverLocation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('driver:status'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WebsocketGateway.prototype, "handleDriverStatus", null);
exports.WebsocketGateway = WebsocketGateway = WebsocketGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: websocketGatewayCorsOrigins(),
            credentials: true,
        },
        namespace: '/ws',
    }),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => orders_service_1.OrdersService))),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        orders_service_1.OrdersService,
        redis_service_1.RedisPubSubService])
], WebsocketGateway);
//# sourceMappingURL=websocket.gateway.js.map