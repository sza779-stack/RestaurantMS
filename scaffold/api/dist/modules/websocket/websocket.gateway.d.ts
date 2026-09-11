import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OrdersService } from '../orders/orders.service';
import { OrderEventPayload, ItemEventPayload } from './websocket-events';
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
export declare class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy {
    private jwtService;
    private readonly ordersService;
    private readonly redisPubSub;
    server: Server;
    private readonly logger;
    private readonly connectedClients;
    private readonly wsVerbose;
    private logWsLifecycle;
    private readonly driverLocationChannel;
    private readonly driverLocationSubscriber;
    constructor(jwtService: JwtService, ordersService: OrdersService, redisPubSub: RedisPubSubService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): void;
    handleStoreSubscribe(storeId: string, client: AuthenticatedSocket): Promise<{
        event: string;
        data: {
            storeId: string;
            requestedStoreId: string;
        };
    }>;
    handleStoreUnsubscribe(storeId: string, client: AuthenticatedSocket): Promise<{
        event: string;
        data: {
            storeId: string;
            requestedStoreId: string;
        };
    }>;
    handleKitchenSubscribe(data: {
        storeId: string;
        station?: string;
    }, client: AuthenticatedSocket): Promise<{
        event: string;
        data: {
            storeId: string;
            station: string;
        };
    }>;
    handleKdsSubscribe(data: {
        storeId: string;
        station?: string;
    }, client: AuthenticatedSocket): Promise<{
        event: string;
        data: {
            storeId: string;
            station: string;
        };
    }>;
    handlePackingSubscribe(storeId: string, client: AuthenticatedSocket): Promise<{
        event: string;
        data: {
            storeId: string;
        };
    }>;
    handleOSDUSubscribe(storeId: string, client: AuthenticatedSocket): Promise<{
        event: string;
        data: {
            storeId: string;
        };
    }>;
    handleOnlineSubscribe(storeId: string, client: AuthenticatedSocket): Promise<{
        event: string;
        data: {
            storeId: string;
        };
    }>;
    handleDriversSubscribe(storeId: string, client: AuthenticatedSocket): Promise<{
        event: string;
        data: {
            storeId: string;
        };
    }>;
    handleAdminSubscribe(data: {
        storeId?: string;
        companyId?: string;
    }, client: AuthenticatedSocket): Promise<{
        event: string;
        data: {
            storeId?: string;
            companyId?: string;
        };
    }>;
    handleOrderPlaced(order: any, client: AuthenticatedSocket): Promise<{
        event: "order:placed";
        data: any;
    }>;
    handleOrderCreatedLegacy(order: any, client: AuthenticatedSocket): Promise<{
        event: "order:placed";
        data: any;
    }>;
    handleOrderStatusUpdate(data: {
        orderId: string;
        storeId: string;
        status: string;
        previousStatus?: string;
    }, client: AuthenticatedSocket): Promise<{
        event: "order:status:changed";
        data: OrderEventPayload;
    }>;
    handleOrderStatusUpdateLegacy(data: {
        orderId: string;
        storeId: string;
        status: string;
        previousStatus?: string;
    }, client: AuthenticatedSocket): Promise<{
        event: "order:status:changed";
        data: OrderEventPayload;
    }>;
    handleOrderItemPreparedLegacy(data: {
        orderId: string;
        itemId: string;
        storeId: string;
        status: string;
    }, client: AuthenticatedSocket): Promise<{
        event: "order:item:prepared";
        data: ItemEventPayload;
    }>;
    handleOrderItemUpdate(data: {
        orderId: string;
        itemId: string;
        storeId: string;
        status: string;
    }, client: AuthenticatedSocket): Promise<{
        event: "order:item:prepared";
        data: ItemEventPayload;
    }>;
    handleOrderPayment(data: {
        orderId: string;
        storeId: string;
        payment: any;
    }, client: AuthenticatedSocket): Promise<{
        event: "payment:received";
        data: {
            orderId: string;
            storeId: string;
            payment: any;
            timestamp: string;
        };
    }>;
    handleDriverLocation(data: {
        driverId: string;
        lat: number;
        lng: number;
        storeId: string;
    }, client: AuthenticatedSocket): Promise<void>;
    handleDriverStatus(data: {
        driverId: string;
        orderId: string;
        status: string;
        storeId: string;
    }, client: AuthenticatedSocket): void;
    broadcastOrderEvent(storeId: string, event: string, data: any): void;
    broadcastOrderStatusChange(storeId: string, payload: OrderEventPayload): void;
    private syncKDS;
    private syncOSDU;
    private syncModuleRouting;
    private handleOrderPacked;
    private sendCustomerNotification;
    broadcastToStore(storeId: string, event: string, data: any): void;
    broadcastToKitchen(storeId: string, event: string, data: any): void;
    broadcastToOSDU(storeId: string, event: string, data: any): void;
    broadcastToDrivers(storeId: string, event: string, data: any): void;
    broadcastToOnline(storeId: string, event: string, data: any): void;
    private isServiceClientToken;
    private buildServiceClientPayload;
    private resolveStoreIdForRooms;
    private joinStoreRooms;
    private emitWithAliases;
}
export {};
