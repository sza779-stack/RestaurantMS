"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriversService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const websocket_gateway_1 = require("../websocket/websocket.gateway");
const websocket_events_1 = require("../websocket/websocket-events");
const redis_service_1 = require("../redis/redis.service");
let DriversService = class DriversService {
    constructor(prisma, websocketGateway, redisPubSub) {
        this.prisma = prisma;
        this.websocketGateway = websocketGateway;
        this.redisPubSub = redisPubSub;
    }
    sanitizeDriverBase(name) {
        const base = (name || 'driver')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '')
            .slice(0, 20);
        return base || 'driver';
    }
    async generateDriverLoginId(name) {
        const base = this.sanitizeDriverBase(name);
        const candidates = await this.prisma.driver.findMany({
            where: { id: { startsWith: `${base}-` } },
            select: { id: true },
        });
        let maxSuffix = 0;
        for (const candidate of candidates) {
            const match = candidate.id.match(new RegExp(`^${base}-(\\d+)$`));
            if (!match)
                continue;
            const parsed = Number(match[1]);
            if (Number.isFinite(parsed) && parsed > maxSuffix) {
                maxSuffix = parsed;
            }
        }
        const next = String(maxSuffix + 1).padStart(2, '0');
        return `${base}-${next}`;
    }
    async create(data) {
        const pinHash = data.pin ? await bcrypt.hash(data.pin, 10) : null;
        const requestedId = (data.id || '').trim().toLowerCase();
        const driverId = requestedId || await this.generateDriverLoginId(data.name);
        const { id: _ignoredId, pin: _ignoredPin, ...rest } = data;
        return this.prisma.driver.create({
            data: {
                id: driverId,
                ...rest,
                pin: pinHash,
            },
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                vehicleType: true,
                licensePlate: true,
                status: true,
                isActive: true,
                isContractor: true,
                perDeliveryRate: true,
                storeId: true,
                createdAt: true,
            },
        });
    }
    async findAll(storeId) {
        const where = storeId ? { storeId, isActive: true } : { isActive: true };
        return this.prisma.driver.findMany({
            where,
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                vehicleType: true,
                licensePlate: true,
                status: true,
                isActive: true,
                isContractor: true,
                perDeliveryRate: true,
                storeId: true,
                currentLocation: true,
                lastLoginAt: true,
                createdAt: true,
                _count: {
                    select: {
                        orders: {
                            where: {
                                status: {
                                    in: ['OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'],
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
    }
    async findOne(id) {
        const driver = await this.prisma.driver.findUnique({
            where: { id },
            include: {
                orders: {
                    where: {
                        status: {
                            in: ['OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'],
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                    select: {
                        id: true,
                        orderNumber: true,
                        tokenNumber: true,
                        status: true,
                        total: true,
                        tipAmount: true,
                        deliveredAt: true,
                        createdAt: true,
                        customerName: true,
                        deliveryAddress: true,
                        items: {
                            select: {
                                productName: true,
                                quantity: true,
                            },
                        },
                    },
                },
                deliveries: {
                    orderBy: { assignedAt: 'desc' },
                    take: 20,
                },
            },
        });
        if (!driver) {
            throw new common_1.NotFoundException(`Driver not found: ${id}`);
        }
        const { pin, ...driverWithoutPin } = driver;
        return driverWithoutPin;
    }
    async findByStore(storeId) {
        return this.findAll(storeId);
    }
    async update(id, data) {
        const updateData = { ...data };
        if (data.pin) {
            updateData.pin = await bcrypt.hash(data.pin, 10);
        }
        return this.prisma.driver.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                vehicleType: true,
                licensePlate: true,
                status: true,
                isActive: true,
                isContractor: true,
                perDeliveryRate: true,
                storeId: true,
            },
        });
    }
    async remove(id) {
        return this.prisma.driver.update({
            where: { id },
            data: { isActive: false, status: client_1.DriverStatus.OFFLINE },
        });
    }
    async validateDriver(driverId, pin) {
        const driver = await this.prisma.driver.findUnique({
            where: { id: driverId },
            select: {
                id: true,
                pin: true,
                name: true,
                phone: true,
                email: true,
                status: true,
                isActive: true,
                storeId: true,
                vehicleType: true,
                licensePlate: true,
                perDeliveryRate: true,
            },
        });
        if (!driver) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!driver.isActive) {
            throw new common_1.UnauthorizedException('Driver account is inactive');
        }
        if (!driver.pin) {
            throw new common_1.UnauthorizedException('PIN not set. Please contact manager.');
        }
        const isValid = await bcrypt.compare(pin, driver.pin);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid PIN');
        }
        await this.prisma.driver.update({
            where: { id: driverId },
            data: {
                status: client_1.DriverStatus.ONLINE,
                lastLoginAt: new Date(),
            },
        });
        const { pin: _, ...driverWithoutPin } = driver;
        const storeSettings = await this.prisma.storeSettings.findUnique({
            where: { storeId: driver.storeId },
            select: { mapsProvider: true },
        });
        return {
            ...driverWithoutPin,
            status: client_1.DriverStatus.ONLINE,
            mapsProvider: storeSettings?.mapsProvider ?? 'GOOGLE',
        };
    }
    async login(data) {
        const normalizedEmail = (data.email || '').trim();
        if (!normalizedEmail) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const driver = await this.prisma.driver.findFirst({
            where: {
                email: {
                    equals: normalizedEmail,
                    mode: 'insensitive',
                },
            },
            select: {
                id: true,
                pin: true,
                name: true,
                phone: true,
                email: true,
                status: true,
                isActive: true,
                storeId: true,
                vehicleType: true,
                licensePlate: true,
                perDeliveryRate: true,
            },
        });
        if (!driver) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!driver.isActive) {
            throw new common_1.UnauthorizedException('Driver account is inactive');
        }
        if (!driver.pin) {
            throw new common_1.UnauthorizedException('PIN not set. Please contact manager.');
        }
        const isValid = await bcrypt.compare(data.pin, driver.pin);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid PIN');
        }
        await this.prisma.driver.update({
            where: { id: driver.id },
            data: {
                status: client_1.DriverStatus.ONLINE,
                lastLoginAt: new Date(),
            },
        });
        const { pin: _, ...driverWithoutPin } = driver;
        const storeSettings = await this.prisma.storeSettings.findUnique({
            where: { storeId: driver.storeId },
            select: { mapsProvider: true },
        });
        return {
            ...driverWithoutPin,
            status: client_1.DriverStatus.ONLINE,
            mapsProvider: storeSettings?.mapsProvider ?? 'GOOGLE',
        };
    }
    async updateLocation(driverId, location) {
        const updated = await this.prisma.driver.update({
            where: { id: driverId },
            data: {
                currentLocation: {
                    lat: location.lat,
                    lng: location.lng,
                    timestamp: new Date().toISOString(),
                },
            },
            select: {
                id: true,
                storeId: true,
                currentLocation: true,
            },
        });
        await this.redisPubSub.publish('drivers:location:update', {
            driverId: updated.id,
            id: updated.id,
            storeId: updated.storeId,
            lat: location.lat,
            lng: location.lng,
            heading: 0,
            timestamp: new Date().toISOString(),
        });
        return updated;
    }
    async updateStatus(driverId, status) {
        return this.prisma.driver.update({
            where: { id: driverId },
            data: { status },
            select: {
                id: true,
                name: true,
                status: true,
            },
        });
    }
    async getDriverOrders(driverId, status) {
        const where = { driverId };
        if (status) {
            where.status = status;
        }
        else {
            where.status = {
                in: ['OUT_FOR_DELIVERY', 'DELIVERED'],
            };
        }
        return this.prisma.order.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                items: true,
                payments: true,
            },
        });
    }
    async getActiveDeliveries(driverId) {
        return this.prisma.order.findMany({
            where: {
                driverId,
                status: { in: ['OUT_FOR_DELIVERY'] },
            },
            orderBy: { createdAt: 'asc' },
            include: {
                items: true,
                payments: true,
                store: {
                    select: {
                        name: true,
                        address: true,
                        phone: true,
                    },
                },
            },
        });
    }
    async getActiveDelivery(driverId) {
        return this.prisma.order.findFirst({
            where: {
                driverId,
                status: 'OUT_FOR_DELIVERY',
            },
            include: {
                items: true,
                store: {
                    select: {
                        name: true,
                        address: true,
                        phone: true,
                    },
                },
            },
        });
    }
    async getActiveDeliveryCount(driverId) {
        return this.prisma.order.count({
            where: {
                driverId,
                status: { in: ['OUT_FOR_DELIVERY'] },
            },
        });
    }
    async getDriverStats(driverId, period = 'today') {
        const now = new Date();
        let startDate;
        switch (period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
        }
        const [deliveries, earnings] = await Promise.all([
            this.prisma.order.count({
                where: {
                    driverId,
                    status: { in: ['DELIVERED', 'COMPLETED'] },
                    deliveredAt: { gte: startDate },
                },
            }),
            this.prisma.order.aggregate({
                where: {
                    driverId,
                    status: { in: ['DELIVERED', 'COMPLETED'] },
                    deliveredAt: { gte: startDate },
                },
                _sum: {
                    tipAmount: true,
                    deliveryFee: true,
                },
            }),
        ]);
        const driver = await this.prisma.driver.findUnique({
            where: { id: driverId },
            select: { perDeliveryRate: true, isContractor: true },
        });
        const deliveryEarnings = (parseFloat(driver?.perDeliveryRate?.toString() || '0')) * deliveries;
        const tips = earnings._sum.tipAmount || 0;
        return {
            deliveries,
            tips: parseFloat(tips.toString()),
            deliveryEarnings: parseFloat(deliveryEarnings.toString()),
            total: deliveryEarnings + parseFloat(tips.toString()),
            perDeliveryRate: parseFloat((driver?.perDeliveryRate || 0).toString()),
            period,
        };
    }
    async assignOrderToDriver(orderId, driverId, storeId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });
        if (!order) {
            throw new common_1.NotFoundException(`Order not found: ${orderId}`);
        }
        const driver = await this.prisma.driver.findUnique({
            where: { id: driverId },
        });
        if (!driver) {
            throw new common_1.NotFoundException(`Driver not found: ${driverId}`);
        }
        if (!driver.isActive) {
            throw new common_1.UnauthorizedException('Driver is not active');
        }
        const deliveryStoreId = storeId || order.storeId;
        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: {
                driverId,
                status: 'OUT_FOR_DELIVERY',
            },
            include: {
                items: true,
                payments: true,
                driver: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
            },
        });
        await this.prisma.delivery.create({
            data: {
                orderId,
                driverId,
                status: 'ASSIGNED',
            },
        });
        this.websocketGateway.server?.to(`drivers:${deliveryStoreId}`).emit(websocket_events_1.OrderEvents.DRIVER_ORDER_ASSIGNED, {
            orderId,
            driverId,
            order: updatedOrder,
            timestamp: new Date().toISOString()
        });
        this.websocketGateway.broadcastOrderStatusChange(deliveryStoreId, {
            orderId,
            storeId: deliveryStoreId,
            status: 'OUT_FOR_DELIVERY',
            data: updatedOrder,
            timestamp: new Date().toISOString(),
        });
        return updatedOrder;
    }
    async assignMultipleOrdersToDriver(orderIds, driverId, storeId) {
        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            throw new common_1.NotFoundException('No order IDs provided');
        }
        const driver = await this.prisma.driver.findUnique({
            where: { id: driverId },
        });
        if (!driver) {
            throw new common_1.NotFoundException(`Driver not found: ${driverId}`);
        }
        if (!driver.isActive) {
            throw new common_1.UnauthorizedException('Driver is not active');
        }
        const currentCount = await this.getActiveDeliveryCount(driverId);
        const maxOrders = 5;
        if (currentCount + orderIds.length > maxOrders) {
            throw new common_1.UnauthorizedException(`Driver can only have ${maxOrders} active orders. Currently has ${currentCount}.`);
        }
        const results = [];
        const deliveryStoreId = storeId || driver.storeId;
        for (const orderId of orderIds) {
            try {
                const order = await this.prisma.order.findUnique({
                    where: { id: orderId },
                });
                if (!order) {
                    results.push({ orderId, success: false, error: 'Order not found' });
                    continue;
                }
                const updatedOrder = await this.prisma.order.update({
                    where: { id: orderId },
                    data: {
                        driverId,
                        status: 'OUT_FOR_DELIVERY',
                    },
                    include: {
                        items: true,
                        payments: true,
                        driver: {
                            select: {
                                id: true,
                                name: true,
                                phone: true,
                            },
                        },
                    },
                });
                await this.prisma.delivery.create({
                    data: {
                        orderId,
                        driverId,
                        status: 'ASSIGNED',
                    },
                });
                this.websocketGateway.server?.to(`drivers:${deliveryStoreId}`).emit(websocket_events_1.OrderEvents.DRIVER_ORDER_ASSIGNED, {
                    orderId,
                    driverId,
                    order: updatedOrder,
                    timestamp: new Date().toISOString()
                });
                this.websocketGateway.broadcastOrderStatusChange(deliveryStoreId, {
                    orderId,
                    storeId: deliveryStoreId,
                    status: 'OUT_FOR_DELIVERY',
                    data: updatedOrder,
                    timestamp: new Date().toISOString(),
                });
                results.push({ orderId, success: true, order: updatedOrder });
            }
            catch (error) {
                results.push({ orderId, success: false, error: error.message });
            }
        }
        return {
            driverId,
            assigned: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results,
        };
    }
    async unassignMultipleOrders(orderIds, storeId) {
        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            throw new common_1.NotFoundException('No order IDs provided');
        }
        const uniqueOrderIds = Array.from(new Set(orderIds));
        const orders = await this.prisma.order.findMany({
            where: {
                id: { in: uniqueOrderIds },
                type: 'DELIVERY',
            },
            select: {
                id: true,
                driverId: true,
                storeId: true,
                status: true,
            },
        });
        if (orders.length === 0) {
            return { unassigned: 0, failed: uniqueOrderIds.length, results: [] };
        }
        const scopedOrders = storeId ? orders.filter((o) => o.storeId === storeId) : orders;
        const scopedOrderIds = scopedOrders.map((o) => o.id);
        if (scopedOrderIds.length === 0) {
            return { unassigned: 0, failed: uniqueOrderIds.length, results: [] };
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.order.updateMany({
                where: { id: { in: scopedOrderIds } },
                data: {
                    driverId: null,
                    status: 'READY',
                    deliveredAt: null,
                },
            });
            await tx.delivery.deleteMany({
                where: { orderId: { in: scopedOrderIds } },
            });
        });
        for (const order of scopedOrders) {
            this.websocketGateway.broadcastOrderStatusChange(order.storeId, {
                orderId: order.id,
                storeId: order.storeId,
                status: 'READY',
                previousStatus: order.status,
                timestamp: new Date().toISOString(),
            });
        }
        const results = uniqueOrderIds.map((id) => ({
            orderId: id,
            success: scopedOrderIds.includes(id),
            error: scopedOrderIds.includes(id) ? undefined : 'Order not found or not in scope',
        }));
        return {
            unassigned: scopedOrderIds.length,
            failed: results.filter((r) => !r.success).length,
            results,
        };
    }
    async resetActiveDeliveries(storeId) {
        const where = { status: 'OUT_FOR_DELIVERY' };
        if (storeId) {
            where.storeId = storeId;
        }
        const activeOrders = await this.prisma.order.findMany({
            where,
            select: { id: true, driverId: true, storeId: true, status: true },
        });
        if (activeOrders.length === 0) {
            return { reset: 0, driversReset: 0 };
        }
        const orderIds = activeOrders.map((o) => o.id);
        const uniqueDriverIds = Array.from(new Set(activeOrders.map((o) => o.driverId).filter(Boolean)));
        const storeIds = Array.from(new Set(activeOrders.map((o) => o.storeId)));
        await this.prisma.$transaction(async (tx) => {
            await tx.order.updateMany({
                where: { id: { in: orderIds } },
                data: {
                    status: 'READY',
                    driverId: null,
                    deliveredAt: null,
                },
            });
            await tx.delivery.deleteMany({
                where: { orderId: { in: orderIds } },
            });
            if (uniqueDriverIds.length > 0) {
                await tx.driver.updateMany({
                    where: { id: { in: uniqueDriverIds } },
                    data: { status: 'ONLINE' },
                });
            }
        });
        for (const order of activeOrders) {
            this.websocketGateway.server?.to(`store:${order.storeId}`).emit(websocket_events_1.OrderEvents.ORDER_STATUS_CHANGED, {
                orderId: order.id,
                status: 'READY',
                previousStatus: order.status,
                timestamp: new Date().toISOString(),
            });
        }
        for (const sId of storeIds) {
            this.websocketGateway.server?.to(`drivers:${sId}`).emit(websocket_events_1.OrderEvents.DRIVER_AVAILABLE, {
                status: 'ONLINE',
                timestamp: new Date().toISOString(),
            });
        }
        return {
            reset: orderIds.length,
            driversReset: uniqueDriverIds.length,
            storeIds,
        };
    }
    async resetAndSeedDispatchTestData(storeId) {
        const targetStore = storeId
            ? await this.prisma.store.findUnique({ where: { id: storeId }, select: { id: true, code: true, name: true } })
            : await this.prisma.store.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true, code: true, name: true } });
        if (!targetStore) {
            throw new common_1.NotFoundException('No store found to seed delivery test data');
        }
        await this.resetActiveDeliveries(targetStore.id);
        const testPrefix = 'DLVTEST-';
        const testDriverEmailPrefix = 'delivery.test+';
        const existingTestOrders = await this.prisma.order.findMany({
            where: {
                storeId: targetStore.id,
                orderNumber: { startsWith: testPrefix },
            },
            select: { id: true },
        });
        const existingOrderIds = existingTestOrders.map((o) => o.id);
        await this.prisma.$transaction(async (tx) => {
            if (existingOrderIds.length > 0) {
                await tx.delivery.deleteMany({
                    where: { orderId: { in: existingOrderIds } },
                });
                await tx.order.deleteMany({
                    where: { id: { in: existingOrderIds } },
                });
            }
            await tx.driver.deleteMany({
                where: {
                    storeId: targetStore.id,
                    email: { startsWith: testDriverEmailPrefix },
                },
            });
        });
        const seedPinHash = await bcrypt.hash('1234', 10);
        const now = Date.now();
        const suffix = String(now).slice(-6);
        const baseLat = 39.2037;
        const baseLng = -76.861;
        const createdDrivers = await Promise.all([
            { name: 'Test Driver Alpha', status: client_1.DriverStatus.ONLINE, vehicleType: 'CAR', lat: baseLat + 0.01, lng: baseLng + 0.01 },
            { name: 'Test Driver Bravo', status: client_1.DriverStatus.ONLINE, vehicleType: 'BIKE', lat: baseLat - 0.01, lng: baseLng - 0.005 },
            { name: 'Test Driver Charlie', status: client_1.DriverStatus.ON_BREAK, vehicleType: 'SCOOTER', lat: baseLat + 0.005, lng: baseLng - 0.01 },
            { name: 'Test Driver Delta', status: client_1.DriverStatus.OFFLINE, vehicleType: 'CAR', lat: baseLat - 0.008, lng: baseLng + 0.012 },
        ].map((driver, idx) => this.prisma.driver.create({
            data: {
                storeId: targetStore.id,
                name: driver.name,
                phone: `+1-555-99${idx + 10}-${idx + 1000}`,
                email: `${testDriverEmailPrefix}${suffix}.${idx + 1}@pizzapalace.local`,
                vehicleType: driver.vehicleType,
                licensePlate: `TST-${suffix}-${idx + 1}`,
                status: driver.status,
                perDeliveryRate: 6.5,
                isActive: true,
                pin: seedPinHash,
                currentLocation: {
                    lat: driver.lat,
                    lng: driver.lng,
                    timestamp: new Date().toISOString(),
                },
            },
            select: { id: true, name: true, status: true },
        })));
        const product = await this.prisma.productStore.findFirst({
            where: { storeId: targetStore.id, isAvailable: true },
            select: {
                productId: true,
                price: true,
                product: {
                    select: { name: true, basePrice: true },
                },
            },
        });
        if (!product) {
            throw new common_1.NotFoundException(`No available product found for store ${targetStore.name}`);
        }
        const unitPrice = Number(product.price ?? product.product.basePrice ?? 12.99);
        const itemName = product.product.name;
        const alpha = createdDrivers[0];
        const bravo = createdDrivers[1];
        const seedOrders = [
            {
                orderNumber: `${testPrefix}${suffix}-001`,
                tokenNumber: `T${suffix}01`,
                customerName: 'Test Customer Pending',
                status: 'PENDING',
                address: { street: '1001 Test Ave', city: 'Columbia', lat: baseLat + 0.012, lng: baseLng + 0.008 },
                itemQty: 2,
            },
            {
                orderNumber: `${testPrefix}${suffix}-002`,
                tokenNumber: `T${suffix}02`,
                customerName: 'Test Customer Preparing',
                status: 'PREPARING',
                address: { street: '1002 Dispatch Ln', city: 'Columbia', lat: baseLat - 0.006, lng: baseLng + 0.004 },
                itemQty: 1,
            },
            {
                orderNumber: `${testPrefix}${suffix}-003`,
                tokenNumber: `T${suffix}03`,
                customerName: 'Test Customer Packing',
                status: 'PACKING',
                address: { street: '1003 Driver Rd', city: 'Columbia', lat: baseLat + 0.004, lng: baseLng - 0.004 },
                itemQty: 3,
            },
            {
                orderNumber: `${testPrefix}${suffix}-004`,
                tokenNumber: `T${suffix}04`,
                customerName: 'Test Customer Ready A',
                status: 'READY',
                address: { street: '1004 Ready St', city: 'Columbia', lat: baseLat - 0.011, lng: baseLng - 0.006 },
                itemQty: 2,
            },
            {
                orderNumber: `${testPrefix}${suffix}-005`,
                tokenNumber: `T${suffix}05`,
                customerName: 'Test Customer Ready B',
                status: 'READY',
                address: { street: '1005 Ready St', city: 'Columbia', lat: baseLat + 0.009, lng: baseLng + 0.011 },
                itemQty: 1,
            },
            {
                orderNumber: `${testPrefix}${suffix}-006`,
                tokenNumber: `T${suffix}06`,
                customerName: 'Test Customer En Route Alpha',
                status: 'OUT_FOR_DELIVERY',
                address: { street: '1006 Enroute Blvd', city: 'Columbia', lat: baseLat + 0.015, lng: baseLng - 0.012 },
                driverId: alpha.id,
                itemQty: 2,
            },
            {
                orderNumber: `${testPrefix}${suffix}-007`,
                tokenNumber: `T${suffix}07`,
                customerName: 'Test Customer En Route Bravo',
                status: 'OUT_FOR_DELIVERY',
                address: { street: '1007 Enroute Blvd', city: 'Columbia', lat: baseLat - 0.014, lng: baseLng + 0.013 },
                driverId: bravo.id,
                itemQty: 2,
            },
            {
                orderNumber: `${testPrefix}${suffix}-008`,
                tokenNumber: `T${suffix}08`,
                customerName: 'Test Customer Delivered',
                status: 'DELIVERED',
                address: { street: '1008 Delivered Ct', city: 'Columbia', lat: baseLat + 0.002, lng: baseLng + 0.014 },
                driverId: alpha.id,
                itemQty: 1,
            },
        ];
        const createdOrders = [];
        for (const seed of seedOrders) {
            const subtotal = Number((unitPrice * seed.itemQty).toFixed(2));
            const deliveryFee = 3.99;
            const taxAmount = Number((subtotal * 0.08).toFixed(2));
            const tipAmount = seed.driverId ? 4 : 0;
            const total = Number((subtotal + deliveryFee + taxAmount + tipAmount).toFixed(2));
            const created = await this.prisma.order.create({
                data: {
                    storeId: targetStore.id,
                    orderNumber: seed.orderNumber,
                    tokenNumber: seed.tokenNumber,
                    type: 'DELIVERY',
                    status: seed.status,
                    customerName: seed.customerName,
                    customerPhone: '+1-555-000-0000',
                    deliveryAddress: JSON.stringify(seed.address),
                    driverId: seed.driverId ?? null,
                    source: 'POS',
                    subtotal,
                    taxAmount,
                    deliveryFee,
                    tipAmount,
                    total,
                    deliveredAt: seed.status === 'DELIVERED' ? new Date() : null,
                    items: {
                        create: [
                            {
                                productId: product.productId,
                                productName: itemName,
                                quantity: seed.itemQty,
                                unitPrice,
                                totalPrice: subtotal,
                                itemType: 'PRODUCT',
                            },
                        ],
                    },
                    payments: {
                        create: [
                            {
                                amount: total,
                                method: 'CREDIT_CARD',
                                status: 'COMPLETED',
                            },
                        ],
                    },
                },
                select: { id: true, orderNumber: true, status: true, driverId: true },
            });
            createdOrders.push(created);
            if (seed.driverId && seed.status === 'OUT_FOR_DELIVERY') {
                await this.prisma.delivery.create({
                    data: {
                        orderId: created.id,
                        driverId: seed.driverId,
                        status: 'EN_ROUTE',
                        trackingEvents: [
                            {
                                at: new Date().toISOString(),
                                status: 'ASSIGNED',
                                note: 'Seeded test dispatch assignment',
                            },
                        ],
                    },
                });
            }
        }
        await this.prisma.driver.updateMany({
            where: { id: { in: [alpha.id, bravo.id] } },
            data: { status: client_1.DriverStatus.BUSY },
        });
        return {
            storeId: targetStore.id,
            storeName: targetStore.name,
            driversCreated: createdDrivers.length,
            ordersCreated: createdOrders.length,
            dispatchReadyOrders: createdOrders.filter((o) => ['PENDING', 'PREPARING', 'PACKING', 'READY'].includes(o.status)).length,
            outForDeliveryOrders: createdOrders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length,
            deliveredOrders: createdOrders.filter((o) => o.status === 'DELIVERED').length,
            testPrefix,
            defaultDriverPin: '1234',
        };
    }
};
exports.DriversService = DriversService;
exports.DriversService = DriversService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        websocket_gateway_1.WebsocketGateway,
        redis_service_1.RedisPubSubService])
], DriversService);
//# sourceMappingURL=drivers.service.js.map