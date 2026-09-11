import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OrdersService } from '../orders/orders.service';
import { OrderEvents, RoomPrefixes, OrderEventPayload, ItemEventPayload, DriverEventPayload } from './websocket-events';
import { RedisPubSubService } from '../redis/redis.service';

interface AuthenticatedSocket extends Socket {
  user?: {
    userId: string;
    email: string;
    role: string;
    companyId?: string;
  };
  storeId?: string;
}

/** Local dev defaults; overridden by `WS_CORS_ORIGINS` or `CORS_ORIGINS` (comma-separated) in production — see scaffold/HOSTING.md */
const LOCAL_WS_CORS_ORIGINS = [
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3005',
  'http://localhost:3006',
] as const;

function websocketGatewayCorsOrigins(): string[] {
  const raw =
    process.env.WS_CORS_ORIGINS?.trim() ||
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

@WebSocketGateway({
  cors: {
    origin: websocketGatewayCorsOrigins(),
    credentials: true,
  },
  namespace: '/ws',
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy {
  @WebSocketServer()
  server: Server;
  
  private readonly logger = new Logger(WebsocketGateway.name);
  private readonly connectedClients: Map<string, AuthenticatedSocket> = new Map();

  /** Connect / disconnect / room subscribe chatter. Suppressed by default (POS opens many channels). Set WS_VERBOSE=1 to log. */
  private readonly wsVerbose = ['1', 'true', 'yes'].includes(String(process.env.WS_VERBOSE || '').toLowerCase());

  private logWsLifecycle(message: string): void {
    if (this.wsVerbose) {
      this.logger.log(message);
    }
  }
  
  private readonly driverLocationChannel = 'drivers:location:update';
  private readonly driverLocationSubscriber = (payload: any) => {
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
      `${RoomPrefixes.STORE}:${storeId}`,
      `${RoomPrefixes.ADMIN}:${storeId}`,
      `${RoomPrefixes.ONLINE}:${storeId}`,
      `${RoomPrefixes.DRIVERS}:${storeId}`,
    ];

    for (const room of rooms) {
      this.server.to(room).emit(OrderEvents.DRIVER_LOCATION_UPDATED, normalized);
      this.server.to(room).emit('drivers:location:update', normalized);
    }
  };

  constructor(
    private jwtService: JwtService,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
    private readonly redisPubSub: RedisPubSubService,
  ) {}

  async onModuleInit() {
    await this.redisPubSub.subscribe(this.driverLocationChannel, this.driverLocationSubscriber);
  }

  async onModuleDestroy() {
    await this.redisPubSub.unsubscribe(this.driverLocationChannel, this.driverLocationSubscriber);
  }
  
  async handleConnection(client: AuthenticatedSocket) {
    this.logWsLifecycle(`Client connected: ${client.id}`);
    
    try {
      const token = client.handshake.auth.token as string;
      
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
        client.join(`${RoomPrefixes.COMPANY}:${payload.companyId}`);
      }
      
      client.emit('connection:established', {
        userId: payload.userId,
        message: 'Connected successfully',
      });
      
      this.logWsLifecycle(`Client authenticated: ${client.id} (User: ${payload.userId})`);
    } catch (error) {
      this.logger.error(`Authentication failed for client: ${client.id}`, error.message);
      client.emit('connection:error', 'Authentication failed');
      client.disconnect();
    }
  }
  
  handleDisconnect(client: AuthenticatedSocket) {
    this.logWsLifecycle(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }
  
  // ==================== SUBSCRIPTION HANDLERS ====================
  
  @SubscribeMessage('store:subscribe')
  async handleStoreSubscribe(
    @MessageBody() storeId: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const resolvedStoreId = await this.resolveStoreIdForRooms(storeId);
    client.storeId = resolvedStoreId;
    this.joinStoreRooms(client, RoomPrefixes.STORE, storeId, resolvedStoreId);
    this.logWsLifecycle(`Client ${client.id} subscribed to store: ${resolvedStoreId}`);
    return {
      event: 'store:subscribed',
      data: { storeId: resolvedStoreId, requestedStoreId: storeId },
    };
  }

  @SubscribeMessage('store:unsubscribe')
  async handleStoreUnsubscribe(
    @MessageBody() storeId: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const resolvedStoreId = await this.resolveStoreIdForRooms(storeId);
    client.leave(`${RoomPrefixes.STORE}:${resolvedStoreId}`);
    client.leave(`${RoomPrefixes.STORE}:${storeId}`);
    return {
      event: 'store:unsubscribed',
      data: { storeId: resolvedStoreId, requestedStoreId: storeId },
    };
  }
  
  @SubscribeMessage('kitchen:subscribe')
  async handleKitchenSubscribe(
    @MessageBody() data: { storeId: string; station?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const resolvedStoreId = await this.resolveStoreIdForRooms(data.storeId);
    this.joinStoreRooms(client, RoomPrefixes.KITCHEN, data.storeId, resolvedStoreId);
    if (data.station) {
      client.join(`kitchen:${resolvedStoreId}:${data.station}`);
    }
    this.logWsLifecycle(`Kitchen client ${client.id} subscribed to store: ${resolvedStoreId}`);
    return { event: 'kitchen:subscribed', data: { storeId: resolvedStoreId, station: data.station } };
  }

  @SubscribeMessage('kds:subscribe')
  async handleKdsSubscribe(
    @MessageBody() data: { storeId: string; station?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    return this.handleKitchenSubscribe(data, client);
  }
  
  @SubscribeMessage('packing:subscribe')
  async handlePackingSubscribe(
    @MessageBody() storeId: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const resolvedStoreId = await this.resolveStoreIdForRooms(storeId);
    this.joinStoreRooms(client, RoomPrefixes.PACKING, storeId, resolvedStoreId);
    this.logWsLifecycle(`Packing client ${client.id} subscribed to store: ${resolvedStoreId}`);
    return { event: 'packing:subscribed', data: { storeId: resolvedStoreId } };
  }
  
  @SubscribeMessage('osdu:subscribe')
  async handleOSDUSubscribe(
    @MessageBody() storeId: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const resolvedStoreId = await this.resolveStoreIdForRooms(storeId);
    this.joinStoreRooms(client, RoomPrefixes.OSDU, storeId, resolvedStoreId);
    this.logWsLifecycle(`OSDU client ${client.id} subscribed to store: ${resolvedStoreId}`);
    return { event: 'osdu:subscribed', data: { storeId: resolvedStoreId } };
  }
  
	  @SubscribeMessage('online:subscribe')
  async handleOnlineSubscribe(
    @MessageBody() storeId: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const resolvedStoreId = await this.resolveStoreIdForRooms(storeId);
    this.joinStoreRooms(client, RoomPrefixes.ONLINE, storeId, resolvedStoreId);
    this.logWsLifecycle(`Online client ${client.id} subscribed to store: ${resolvedStoreId}`);
    return { event: 'online:subscribed', data: { storeId: resolvedStoreId } };
  }
  
  @SubscribeMessage('drivers:subscribe')
  async handleDriversSubscribe(
    @MessageBody() storeId: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const resolvedStoreId = await this.resolveStoreIdForRooms(storeId);
    this.joinStoreRooms(client, RoomPrefixes.DRIVERS, storeId, resolvedStoreId);
    this.logWsLifecycle(`Driver client ${client.id} subscribed to store: ${resolvedStoreId}`);
    return { event: 'drivers:subscribed', data: { storeId: resolvedStoreId } };
  }
  
  @SubscribeMessage('admin:subscribe')
  async handleAdminSubscribe(
    @MessageBody() data: { storeId?: string; companyId?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (data.storeId) {
      const resolvedStoreId = await this.resolveStoreIdForRooms(data.storeId);
      client.join(`${RoomPrefixes.ADMIN}:${resolvedStoreId}`);
    }
    if (data.companyId) {
      client.join(`${RoomPrefixes.COMPANY}:${data.companyId}`);
    }
    this.logWsLifecycle(`Admin client ${client.id} subscribed`);
    return { event: 'admin:subscribed', data };
  }
  
  // ==================== ORDER EVENT HANDLERS ====================
  
  @SubscribeMessage('order:placed')
  async handleOrderPlaced(
    @MessageBody() order: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const storeId = await this.resolveStoreIdForRooms(order.storeId);
    const payload = { ...order, storeId, timestamp: new Date().toISOString() };
    
    // Broadcast to all relevant channels
	    this.broadcastOrderEvent(storeId, OrderEvents.ORDER_PLACED, payload);
	    this.server.to(`${RoomPrefixes.KITCHEN}:${storeId}`).emit(OrderEvents.KITCHEN_NEW_ORDER, payload);
	    this.server.to(`${RoomPrefixes.ONLINE}:${storeId}`).emit(OrderEvents.CUSTOMER_ORDER_UPDATED, payload);
    
    this.logger.log(`Order placed broadcast: ${order.orderNumber} to store ${storeId}`);
    return { event: OrderEvents.ORDER_PLACED, data: payload };
  }

  @SubscribeMessage('order:created')
  async handleOrderCreatedLegacy(
    @MessageBody() order: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    return this.handleOrderPlaced(order, client);
  }
  
  @SubscribeMessage('order:status:update')
  async handleOrderStatusUpdate(
    @MessageBody() data: { orderId: string; storeId: string; status: string; previousStatus?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const resolvedStoreId = await this.resolveStoreIdForRooms(data.storeId);
    
    const payload: OrderEventPayload = {
      orderId: data.orderId,
      storeId: resolvedStoreId,
      status: data.status,
      previousStatus: data.previousStatus,
      timestamp: new Date().toISOString(),
    };

    // Broadcast-only path: status writes should happen through REST endpoints
    // to avoid duplicate writes/races from clients emitting socket + REST together.
    this.broadcastOrderStatusChange(resolvedStoreId, payload);
    
    this.logger.log(`Order status updated: ${data.orderId} -> ${data.status}`);
    return { event: OrderEvents.ORDER_STATUS_CHANGED, data: payload };
  }

  @SubscribeMessage('order:status-update')
  async handleOrderStatusUpdateLegacy(
    @MessageBody() data: { orderId: string; storeId: string; status: string; previousStatus?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    return this.handleOrderStatusUpdate(data, client);
  }

  @SubscribeMessage('order:item:prepared')
  async handleOrderItemPreparedLegacy(
    @MessageBody() data: { orderId: string; itemId: string; storeId: string; status: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    return this.handleOrderItemUpdate(data, client);
  }
  
  @SubscribeMessage('order:item:update')
  async handleOrderItemUpdate(
    @MessageBody() data: { orderId: string; itemId: string; storeId: string; status: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const resolvedStoreId = await this.resolveStoreIdForRooms(data.storeId);
    await this.ordersService.updateItemStatus(data.orderId, data.itemId, data.status, resolvedStoreId);
    
    const payload: ItemEventPayload = {
      orderId: data.orderId,
      itemId: data.itemId,
      storeId: resolvedStoreId,
      status: data.status,
      timestamp: new Date().toISOString(),
    };
    
    this.server.to(`${RoomPrefixes.KITCHEN}:${resolvedStoreId}`).emit(OrderEvents.ORDER_ITEM_PREPARED, payload);
    this.server.to(`${RoomPrefixes.STORE}:${resolvedStoreId}`).emit(OrderEvents.ORDER_ITEM_PREPARED, payload);
    
    this.logger.log(`Order item updated: ${data.itemId} in order ${data.orderId} -> ${data.status}`);
    return { event: OrderEvents.ORDER_ITEM_PREPARED, data: payload };
  }
  
  @SubscribeMessage('order:payment')
  async handleOrderPayment(
    @MessageBody() data: { orderId: string; storeId: string; payment: any },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const resolvedStoreId = await this.resolveStoreIdForRooms(data.storeId);
    
    const payload = {
      orderId: data.orderId,
      storeId: resolvedStoreId,
      payment: data.payment,
      timestamp: new Date().toISOString(),
    };
    
    this.broadcastOrderEvent(resolvedStoreId, OrderEvents.ORDER_PAID, payload);
    
    // If delivery order, notify drivers
    if (data.payment.orderType === 'DELIVERY') {
      this.server.to(`${RoomPrefixes.DRIVERS}:${resolvedStoreId}`).emit(OrderEvents.DRIVER_ORDER_ASSIGNED, payload);
    }
    
    this.logger.log(`Payment received for order: ${data.orderId}`);
    return { event: OrderEvents.PAYMENT_RECEIVED, data: payload };
  }
  
  // ==================== DRIVER EVENT HANDLERS ====================
  
  @SubscribeMessage('driver:location')
  async handleDriverLocation(
    @MessageBody() data: { driverId: string; lat: number; lng: number; storeId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
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
  
  @SubscribeMessage('driver:status')
  handleDriverStatus(
    @MessageBody() data: { driverId: string; orderId: string; status: string; storeId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
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

    const payload: DriverEventPayload = {
      driverId: data.driverId,
      orderId: data.orderId,
      storeId: data.storeId,
      status: data.status,
      timestamp: new Date().toISOString(),
    };
    
    // Map driver status to order events
    const eventMap: Record<string, string> = {
      'ACCEPTED': OrderEvents.DRIVER_ORDER_ACCEPTED,
      'PICKED_UP': OrderEvents.DRIVER_ORDER_PICKED_UP,
      'DELIVERED': OrderEvents.DRIVER_ORDER_DELIVERED,
    };
    
    const eventName = eventMap[data.status] || OrderEvents.DRIVER_ORDER_ACCEPTED;
    
    this.server.to(`${RoomPrefixes.STORE}:${data.storeId}`).emit(eventName, payload);
    this.server.to(`${RoomPrefixes.ONLINE}:${data.storeId}`).emit(eventName, payload);
    this.server.to(`${RoomPrefixes.ADMIN}:${data.storeId}`).emit(eventName, payload);
    
    // If delivered, also complete the order
    if (data.status === 'DELIVERED') {
      this.server.to(`${RoomPrefixes.STORE}:${data.storeId}`).emit(OrderEvents.ORDER_COMPLETED, {
        ...payload,
        orderId: data.orderId,
      });
    }
  }
  
  // ==================== BROADCAST METHODS ====================
  
  /**
   * Broadcast order event to all relevant channels
   */
  broadcastOrderEvent(storeId: string, event: string, data: any) {
    if (!this.server) return;
    
    // Always broadcast to store
    this.emitWithAliases(`${RoomPrefixes.STORE}:${storeId}`, event, data);
    
    // Also broadcast to admin
    this.emitWithAliases(`${RoomPrefixes.ADMIN}:${storeId}`, event, data);
  }
  
  /**
   * Handle order status change with appropriate routing
   */
  broadcastOrderStatusChange(storeId: string, payload: OrderEventPayload) {
    if (!this.server) return;
    
    const { status, orderId, data } = payload;
    const orderData = data?.data || data || {};
    
    // 1. Core Broadcast: Always notify store, admin, and OSDU for immediate cross-screen sync.
    this.emitWithAliases(`${RoomPrefixes.STORE}:${storeId}`, OrderEvents.ORDER_STATUS_CHANGED, payload);
    this.emitWithAliases(`${RoomPrefixes.ADMIN}:${storeId}`, OrderEvents.ORDER_STATUS_CHANGED, payload);
    this.emitWithAliases(`${RoomPrefixes.OSDU}:${storeId}`, OrderEvents.ORDER_STATUS_CHANGED, payload);
    
    // 2. Specialized System Syncs
    this.syncKDS(storeId, status, orderId, data);
    this.syncOSDU(storeId, status, orderId, orderData);
    this.syncModuleRouting(storeId, status, payload, orderData);
    return;
  }

  private syncKDS(storeId: string, status: string, orderId: string, data: any) {
    const kdsStatuses = ['PAID', 'IN_KITCHEN', 'IN_PROGRESS', 'PREPARING', 'BAKING', 'IN_OVEN', 'PREPARED', 'READY'];
    if (!kdsStatuses.includes(status)) return;

    this.server.to(`${RoomPrefixes.KITCHEN}:${storeId}`).emit('order:status-changed', { 
      orderId, 
      status,
      timestamp: new Date().toISOString(),
    });

    if (['PAID', 'IN_KITCHEN', 'IN_PROGRESS', 'PREPARING'].includes(status) && data) {
      this.server.to(`${RoomPrefixes.KITCHEN}:${storeId}`).emit('kitchen:new-order', data);
    }
  }

  private syncOSDU(storeId: string, status: string, orderId: string, orderData: any) {
    const osduStatuses = ['PACKING', 'PACKED', 'READY', 'READY_FOR_PICKUP', 'READY_TO_SERVE'];
    if (!osduStatuses.includes(status)) return;

    const items = orderData?.items || [];
    const osduPayload = {
      orderId,
      tokenNumber: orderData?.tokenNumber || orderData?.orderNumber,
      orderNumber: orderData?.orderNumber,
      status: 'READY',
      type: orderData?.type || 'PICKUP',
      customerName: orderData?.customerName,
      items: items.length,
      itemDetails: items.slice(0, 5).map((item: any) => ({
        productName: item.productName || 'Unknown Item',
        quantity: item.quantity || 1,
      })),
      timestamp: new Date().toISOString(),
	    };
	    
	    this.server.to(`${RoomPrefixes.OSDU}:${storeId}`).emit('osdu:order-ready', osduPayload);
	    this.server.to(`${RoomPrefixes.ONLINE}:${storeId}`).emit('customer:order-ready', osduPayload);
  }

  private syncModuleRouting(storeId: string, status: string, payload: OrderEventPayload, orderData: any) {
    const { orderId } = payload;
    
    switch (status) {
      case 'IN_KITCHEN':
      case 'IN_PROGRESS':
      case 'PREPARING':
      case 'BAKING':
        this.emitWithAliases(`${RoomPrefixes.KITCHEN}:${storeId}`, OrderEvents.ORDER_IN_KITCHEN, payload);
        break;
        
      case 'PACKING':
      case 'READY':
        this.emitWithAliases(`${RoomPrefixes.KITCHEN}:${storeId}`, OrderEvents.ORDER_PREPARED, payload);
        this.emitWithAliases(`${RoomPrefixes.PACKING}:${storeId}`, OrderEvents.PACKING_NEW_ORDER, payload);
        this.server.to(`${RoomPrefixes.PACKING}:${storeId}`).emit('packing:order-ready', payload.data || payload);
        break;
        
      case 'PACKED':
        this.handleOrderPacked(storeId, payload);
        break;
        
      case 'READY_FOR_PICKUP':
	        this.emitWithAliases(`${RoomPrefixes.OSDU}:${storeId}`, OrderEvents.OSDU_ORDER_READY, payload);
	        this.emitWithAliases(`${RoomPrefixes.ONLINE}:${storeId}`, OrderEvents.CUSTOMER_ORDER_READY, payload);
	        break;
        
      case 'READY_TO_SERVE':
        this.emitWithAliases(`${RoomPrefixes.STORE}:${storeId}`, OrderEvents.ORDER_READY_TO_SERVE, payload);
        break;
        
      case 'OUT_FOR_DELIVERY':
        this.emitWithAliases(`${RoomPrefixes.DRIVERS}:${storeId}`, OrderEvents.ORDER_OUT_FOR_DELIVERY, payload);
        this.emitWithAliases(`${RoomPrefixes.ONLINE}:${storeId}`, OrderEvents.ORDER_OUT_FOR_DELIVERY, payload);
        this.sendCustomerNotification(storeId, 'delivery_update', 'Order Out For Delivery', `Order ${orderData?.orderNumber || orderId} is on the way.`, orderId, orderData?.orderNumber, status);
        break;
        
      case 'DELIVERED':
        this.emitWithAliases(`${RoomPrefixes.ONLINE}:${storeId}`, OrderEvents.ORDER_DELIVERED, payload);
        this.emitWithAliases(`${RoomPrefixes.STORE}:${storeId}`, OrderEvents.ORDER_DELIVERED, payload);
        this.sendCustomerNotification(storeId, 'delivery_update', 'Order Delivered', `Order ${orderData?.orderNumber || orderId} has been delivered.`, orderId, orderData?.orderNumber, status);
        break;
        
      case 'COMPLETED':
        this.emitWithAliases(`${RoomPrefixes.STORE}:${storeId}`, OrderEvents.ORDER_COMPLETED, payload);
        this.emitWithAliases(`${RoomPrefixes.ONLINE}:${storeId}`, OrderEvents.ORDER_COMPLETED, payload);
        this.emitWithAliases(`${RoomPrefixes.OSDU}:${storeId}`, OrderEvents.ORDER_COMPLETED, payload);
        this.sendCustomerNotification(storeId, 'delivery_update', 'Order Completed', `Order ${orderData?.orderNumber || orderId} is complete. Thank you!`, orderId, orderData?.orderNumber, status);
        break;
        
      case 'CANCELLED':
        this.emitWithAliases(`${RoomPrefixes.STORE}:${storeId}`, OrderEvents.ORDER_CANCELLED, payload);
        this.emitWithAliases(`${RoomPrefixes.KITCHEN}:${storeId}`, OrderEvents.ORDER_CANCELLED, payload);
        this.emitWithAliases(`${RoomPrefixes.ONLINE}:${storeId}`, OrderEvents.ORDER_CANCELLED, payload);
        break;
    }
  }

  private handleOrderPacked(storeId: string, payload: OrderEventPayload) {
    this.emitWithAliases(`${RoomPrefixes.PACKING}:${storeId}`, OrderEvents.PACKING_ORDER_PACKED, payload);
    
    const type = payload.data?.type;
    if (type === 'DELIVERY') {
      this.emitWithAliases(`${RoomPrefixes.DRIVERS}:${storeId}`, OrderEvents.DRIVER_ORDER_ASSIGNED, payload);
    } else if (type === 'PICKUP') {
	      this.emitWithAliases(`${RoomPrefixes.OSDU}:${storeId}`, OrderEvents.ORDER_READY_FOR_PICKUP, payload);
	      this.emitWithAliases(`${RoomPrefixes.ONLINE}:${storeId}`, OrderEvents.CUSTOMER_ORDER_READY, payload);
    } else if (type === 'DINE_IN') {
      this.emitWithAliases(`${RoomPrefixes.STORE}:${storeId}`, OrderEvents.ORDER_READY_TO_SERVE, payload);
    }
  }

  private sendCustomerNotification(storeId: string, type: string, title: string, message: string, orderId: string, orderNumber: string, status: string) {
    const notification = {
      type,
      title,
      message,
      orderId,
      orderNumber,
      status,
      timestamp: new Date().toISOString(),
	    };
	    this.emitWithAliases(`${RoomPrefixes.ONLINE}:${storeId}`, OrderEvents.CUSTOMER_NOTIFICATION, notification);
  }
  
  // ==================== LEGACY BROADCAST METHODS ====================
  
  broadcastToStore(storeId: string, event: string, data: any) {
    this.broadcastOrderEvent(storeId, event, data);
  }
  
  broadcastToKitchen(storeId: string, event: string, data: any) {
    if (!this.server) return;
    this.server.to(`${RoomPrefixes.KITCHEN}:${storeId}`).emit(event, data);
  }
  
  broadcastToOSDU(storeId: string, event: string, data: any) {
    if (!this.server) return;
    this.server.to(`${RoomPrefixes.OSDU}:${storeId}`).emit(event, data);
  }
  
  broadcastToDrivers(storeId: string, event: string, data: any) {
    if (!this.server) return;
    this.server.to(`${RoomPrefixes.DRIVERS}:${storeId}`).emit(event, data);
  }
  
	  broadcastToOnline(storeId: string, event: string, data: any) {
    if (!this.server) return;
    this.server.to(`${RoomPrefixes.ONLINE}:${storeId}`).emit(event, data);
  }
  
  // ==================== HELPER METHODS ====================
  
  private isServiceClientToken(token?: string): boolean {
    const isProduction = (process.env.NODE_ENV || 'development') === 'production';
    const allowInsecureServiceTokens =
      (process.env.WS_ALLOW_INSECURE_SERVICE_TOKENS || (isProduction ? 'false' : 'true')).toLowerCase() === 'true';
    if (!allowInsecureServiceTokens) {
      return false;
    }
    if (!token) return true;
	    return ['kds-token', 'packing-token', 'osdu-token', 'online-token', 'driver-token'].includes(token);
  }
  
  private buildServiceClientPayload(token?: string) {
    const role = (token || 'service-token').replace('-token', '').toUpperCase();
    return {
      userId: `service:${role.toLowerCase()}`,
      email: `${role.toLowerCase()}@local.service`,
      role,
    };
  }
  
  private async resolveStoreIdForRooms(storeId?: string): Promise<string> {
    return this.ordersService.resolveStoreId(storeId);
  }
  
  private joinStoreRooms(
    client: AuthenticatedSocket,
    prefix: string,
    requestedStoreId: string | undefined,
    resolvedStoreId: string,
  ) {
    const rooms = new Set<string>([
      `${prefix}:${resolvedStoreId}`,
      ...(requestedStoreId ? [`${prefix}:${requestedStoreId}`] : []),
    ]);
    
    for (const room of rooms) {
      client.join(room);
    }
  }

  private emitWithAliases(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);

    const aliasMap: Record<string, string[]> = {
      [OrderEvents.ORDER_PLACED]: ['order:created', 'kitchen:new-order'],
      [OrderEvents.KITCHEN_NEW_ORDER]: ['kitchen:new-order', 'order:created'],
      [OrderEvents.ORDER_STATUS_CHANGED]: ['order:status-changed'],
      [OrderEvents.ORDER_IN_KITCHEN]: ['kitchen:new-order'],
      [OrderEvents.ORDER_PREPARED]: ['order:ready'],
      [OrderEvents.OSDU_ORDER_READY]: ['order:ready', 'osdu:order-ready'],
      [OrderEvents.PACKING_NEW_ORDER]: ['packing:order-ready'],
      [OrderEvents.PACKING_ORDER_PACKED]: ['order:packed'],
      [OrderEvents.CUSTOMER_ORDER_READY]: ['order:ready'],
      [OrderEvents.DRIVER_ORDER_ASSIGNED]: ['driver:delivery-assigned'],
    };

    const aliases = aliasMap[event] || [];
    for (const alias of aliases) {
      this.server.to(room).emit(alias, data);
    }
  }
}
