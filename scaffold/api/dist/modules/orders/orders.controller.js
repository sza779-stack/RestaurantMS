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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const optional_jwt_guard_1 = require("../auth/optional-jwt.guard");
const orders_service_1 = require("./orders.service");
const audit_log_decorator_1 = require("../../common/audit/audit-log.decorator");
let OrdersController = class OrdersController {
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    async getPublicDefaultStore() {
        const storeId = await this.ordersService.getDefaultStoreId();
        return { storeId };
    }
    async getPublicStores() {
        return this.ordersService.getPublicStores();
    }
    findAll(storeId, status, includeFuture, futureOnly) {
        return this.ordersService.findAll({
            storeId,
            status,
            includeFuture: includeFuture !== 'false',
            futureOnly: futureOnly === 'true',
        });
    }
    findOne(id) {
        return this.ordersService.findById(id);
    }
    async create(data, req) {
        try {
            console.log('[OrdersController] Creating order with data:', JSON.stringify(data, null, 2));
            const result = await this.ordersService.create({
                ...data,
                createdById: req?.user?.userId,
            });
            console.log('[OrdersController] Order created successfully:', result.id);
            return result;
        }
        catch (error) {
            console.error('[OrdersController] Order creation failed:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            const errorMessage = error?.message || 'Unknown error occurred';
            throw new common_1.HttpException(`Failed to create order: ${errorMessage}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    updateStatus(id, status, storeId) {
        return this.ordersService.updateStatus(id, status, storeId);
    }
    updateLifecycle(id, status, storeId) {
        return this.ordersService.updateStatus(id, status, storeId);
    }
    updateItemStatus(orderId, itemId, status, storeId) {
        return this.ordersService.updateItemStatus(orderId, itemId, status, storeId);
    }
    addPayment(orderId, paymentData, storeId) {
        return this.ordersService.processPayment(orderId, paymentData, storeId);
    }
    async acceptDriverOrder(orderId, driverId, storeId) {
        try {
            return await this.ordersService.assignDriver(orderId, driverId, storeId);
        }
        catch (error) {
            console.error('[OrdersController] Driver accept failed:', error);
            throw new common_1.HttpException(error?.message || 'Failed to assign driver', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async markDelivered(orderId, driverId, storeId) {
        try {
            return await this.ordersService.markDelivered(orderId, driverId, storeId);
        }
        catch (error) {
            console.error('[OrdersController] Mark delivered failed:', error);
            throw new common_1.HttpException(error?.message || 'Failed to mark order as delivered', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async recordCashTip(orderId, driverId, tipAmount, emailReceipt, customerEmail) {
        try {
            return await this.ordersService.recordCashTip(orderId, driverId, tipAmount, emailReceipt, customerEmail);
        }
        catch (error) {
            console.error('[OrdersController] Record tip failed:', error);
            throw new common_1.HttpException(error?.message || 'Failed to record tip', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Get)('public/default-store'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getPublicDefaultStore", null);
__decorate([
    (0, common_1.Get)('public/stores'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getPublicStores", null);
__decorate([
    (0, common_1.UseGuards)(optional_jwt_guard_1.OptionalJwtAuthGuard),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('storeId')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('includeFuture')),
    __param(3, (0, common_1.Query)('futureOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)(optional_jwt_guard_1.OptionalJwtAuthGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)(optional_jwt_guard_1.OptionalJwtAuthGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(optional_jwt_guard_1.OptionalJwtAuthGuard),
    (0, common_1.Put)(':id/status'),
    (0, audit_log_decorator_1.Auditable)({ entityType: 'Order', action: 'UPDATE_STATUS', entityIdFrom: 'params.id' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Body)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Put)(':id/lifecycle'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Body)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "updateLifecycle", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/items/:itemId/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, common_1.Body)('status')),
    __param(3, (0, common_1.Body)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "updateItemStatus", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/payments'),
    (0, audit_log_decorator_1.Auditable)({
        entityType: 'Payment',
        action: 'PROCESS_PAYMENT',
        entityIdFrom: 'params.id',
        redact: ['cardNumber', 'cardCvv', 'cvv', 'pin'],
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "addPayment", null);
__decorate([
    (0, common_1.Post)(':id/driver/accept'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('driverId')),
    __param(2, (0, common_1.Body)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "acceptDriverOrder", null);
__decorate([
    (0, common_1.Post)(':id/driver/delivered'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('driverId')),
    __param(2, (0, common_1.Body)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "markDelivered", null);
__decorate([
    (0, common_1.Post)(':id/driver/record-tip'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('driverId')),
    __param(2, (0, common_1.Body)('tipAmount')),
    __param(3, (0, common_1.Body)('emailReceipt')),
    __param(4, (0, common_1.Body)('customerEmail')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Boolean, String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "recordCashTip", null);
exports.OrdersController = OrdersController = __decorate([
    (0, swagger_1.ApiTags)('Orders'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('orders'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map