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
var OvenTimerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OvenTimerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const websocket_gateway_1 = require("../websocket/websocket.gateway");
let OvenTimerService = OvenTimerService_1 = class OvenTimerService {
    constructor(prisma, websocketGateway) {
        this.prisma = prisma;
        this.websocketGateway = websocketGateway;
        this.logger = new common_1.Logger(OvenTimerService_1.name);
        this.activeTimers = new Map();
        this.COOK_TIMES = {
            PIZZA: 7 * 60 * 1000,
            TANDOOR: 8 * 60 * 1000,
            FRYER: 4 * 60 * 1000,
            GRILL: 10 * 60 * 1000,
            GENERAL: 7 * 60 * 1000,
            SANDWICH: 3 * 60 * 1000,
            DRINKS: 1 * 60 * 1000,
            DESSERT: 3 * 60 * 1000,
            SALAD: 2 * 60 * 1000,
            DEFAULT: 7 * 60 * 1000,
        };
        this.CATEGORY_KEYWORDS = {
            WINGS: ['wing', 'wings', 'chicken wing', 'chicken wings', 'hot wing', 'buffalo wing'],
            PIZZA: ['pizza', 'pizzas', 'pie'],
            SIDES: ['fries', 'fry', 'side', 'sides', 'onion ring', 'rings', 'mozzarella stick', 'breadstick'],
        };
    }
    async startOvenTimer(orderId, storeId) {
        this.cancelOvenTimer(orderId);
        const cookTimeMs = await this.calculateCookTime(orderId);
        const endTime = new Date(Date.now() + cookTimeMs);
        this.logger.log(`Starting oven timer for order ${orderId}. Cook time: ${cookTimeMs / 1000}s, Ends at: ${endTime.toISOString()}`);
        const timeoutId = setTimeout(async () => {
            await this.handleOvenTimerComplete(orderId, storeId);
        }, cookTimeMs);
        const timer = {
            orderId,
            storeId,
            timeoutId,
            endTime,
            durationMs: cookTimeMs,
        };
        this.activeTimers.set(orderId, timer);
        this.websocketGateway.server?.to(`kitchen:${storeId}`).emit('kitchen:oven:started', {
            orderId,
            storeId,
            endTime: endTime.toISOString(),
            durationMs: cookTimeMs,
        });
    }
    cancelOvenTimer(orderId) {
        const existingTimer = this.activeTimers.get(orderId);
        if (existingTimer) {
            clearTimeout(existingTimer.timeoutId);
            this.activeTimers.delete(orderId);
            this.logger.log(`Cancelled oven timer for order ${orderId}`);
        }
    }
    hasActiveTimer(orderId) {
        return this.activeTimers.has(orderId);
    }
    getRemainingTime(orderId) {
        const timer = this.activeTimers.get(orderId);
        if (!timer)
            return null;
        return Math.max(0, timer.endTime.getTime() - Date.now());
    }
    async calculateCookTime(orderId) {
        try {
            const order = await this.prisma.order.findUnique({
                where: { id: orderId },
                include: { items: true },
            });
            if (!order || !order.items || order.items.length === 0) {
                return this.COOK_TIMES.DEFAULT;
            }
            let maxCookTime = 0;
            for (const item of order.items) {
                const itemCookTime = this.getItemCookTime(item);
                maxCookTime = Math.max(maxCookTime, itemCookTime);
            }
            return Math.max(maxCookTime, 3 * 60 * 1000);
        }
        catch (error) {
            this.logger.error(`Failed to calculate cook time for order ${orderId}:`, error);
            return this.COOK_TIMES.DEFAULT;
        }
    }
    getItemCookTime(item) {
        const name = item.productName.toLowerCase();
        const station = item.kitchenStation?.toUpperCase() || 'GENERAL';
        if (this.CATEGORY_KEYWORDS.WINGS.some(kw => name.includes(kw.toLowerCase()))) {
            return 13 * 60 * 1000;
        }
        if (this.CATEGORY_KEYWORDS.PIZZA.some(kw => name.includes(kw.toLowerCase()))) {
            return this.COOK_TIMES.PIZZA;
        }
        if (this.CATEGORY_KEYWORDS.SIDES.some(kw => name.includes(kw.toLowerCase()))) {
            return this.COOK_TIMES.SANDWICH;
        }
        if (this.COOK_TIMES[station]) {
            return this.COOK_TIMES[station];
        }
        return this.COOK_TIMES.DEFAULT;
    }
    async handleOvenTimerComplete(orderId, storeId) {
        this.logger.log(`Oven timer complete for order ${orderId}`);
        this.activeTimers.delete(orderId);
        try {
            const updatedOrder = await this.prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'PACKING',
                    preparedAt: new Date(),
                },
                include: { items: true, payments: true },
            });
            this.logger.log(`Order ${orderId} auto-advanced from BAKING to PACKING`);
            this.websocketGateway.broadcastOrderStatusChange(storeId, {
                orderId,
                storeId,
                status: 'PACKING',
                previousStatus: 'BAKING',
                data: updatedOrder,
                timestamp: new Date().toISOString(),
            });
            this.websocketGateway.server?.to(`kitchen:${storeId}`).emit('kitchen:oven:completed', {
                orderId,
                storeId,
                timestamp: new Date().toISOString(),
            });
            this.websocketGateway.server?.to(`packing:${storeId}`).emit('packing:order-ready', {
                ...updatedOrder,
                status: 'READY',
                readyAt: new Date().toISOString(),
            });
        }
        catch (error) {
            this.logger.error(`Failed to auto-advance order ${orderId} to PACKING:`, error);
        }
    }
    cleanup() {
        this.logger.log(`Cleaning up ${this.activeTimers.size} oven timers`);
        for (const [orderId, timer] of this.activeTimers) {
            clearTimeout(timer.timeoutId);
            this.logger.log(`Cancelled timer for order ${orderId}`);
        }
        this.activeTimers.clear();
    }
};
exports.OvenTimerService = OvenTimerService;
exports.OvenTimerService = OvenTimerService = OvenTimerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        websocket_gateway_1.WebsocketGateway])
], OvenTimerService);
//# sourceMappingURL=oven-timer.service.js.map