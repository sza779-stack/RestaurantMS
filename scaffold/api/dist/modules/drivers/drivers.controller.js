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
exports.DriversController = void 0;
const common_1 = require("@nestjs/common");
const drivers_service_1 = require("./drivers.service");
const create_driver_dto_1 = require("./dto/create-driver.dto");
const client_1 = require("@prisma/client");
let DriversController = class DriversController {
    constructor(driversService) {
        this.driversService = driversService;
    }
    create(data) {
        return this.driversService.create(data);
    }
    findAll(storeId) {
        return this.driversService.findAll(storeId);
    }
    findOne(id) {
        return this.driversService.findOne(id);
    }
    update(id, data) {
        return this.driversService.update(id, data);
    }
    remove(id) {
        return this.driversService.remove(id);
    }
    login(data) {
        return this.driversService.login(data);
    }
    validate(driverId, pin) {
        return this.driversService.validateDriver(driverId, pin);
    }
    updateLocation(id, location) {
        return this.driversService.updateLocation(id, location);
    }
    updateStatus(id, status) {
        return this.driversService.updateStatus(id, status);
    }
    goOnline(id) {
        return this.driversService.updateStatus(id, client_1.DriverStatus.ONLINE);
    }
    goOffline(id) {
        return this.driversService.updateStatus(id, client_1.DriverStatus.OFFLINE);
    }
    goOnBreak(id) {
        return this.driversService.updateStatus(id, client_1.DriverStatus.ON_BREAK);
    }
    getOrders(id, status) {
        return this.driversService.getDriverOrders(id, status);
    }
    getActiveDelivery(id) {
        return this.driversService.getActiveDelivery(id);
    }
    getActiveDeliveries(id) {
        return this.driversService.getActiveDeliveries(id);
    }
    getActiveDeliveryCount(id) {
        return this.driversService.getActiveDeliveryCount(id);
    }
    assignOrder(driverId, orderId, storeId) {
        return this.driversService.assignOrderToDriver(orderId, driverId, storeId);
    }
    assignMultipleOrders(driverId, orderIds, storeId) {
        return this.driversService.assignMultipleOrdersToDriver(orderIds, driverId, storeId);
    }
    unassignMultipleOrders(orderIds, storeId) {
        return this.driversService.unassignMultipleOrders(orderIds, storeId);
    }
    resetActiveDeliveries(storeId) {
        return this.driversService.resetActiveDeliveries(storeId);
    }
    seedTestData(storeId) {
        return this.driversService.resetAndSeedDispatchTestData(storeId);
    }
    getStats(id, period = 'today') {
        return this.driversService.getDriverStats(id, period);
    }
};
exports.DriversController = DriversController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_driver_dto_1.CreateDriverDto]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_driver_dto_1.UpdateDriverDto]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('auth/login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_driver_dto_1.DriverLoginDto]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('auth/validate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('driverId')),
    __param(1, (0, common_1.Body)('pin')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "validate", null);
__decorate([
    (0, common_1.Post)(':id/location'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_driver_dto_1.UpdateLocationDto]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "updateLocation", null);
__decorate([
    (0, common_1.Post)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/online'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "goOnline", null);
__decorate([
    (0, common_1.Post)(':id/offline'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "goOffline", null);
__decorate([
    (0, common_1.Post)(':id/break'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "goOnBreak", null);
__decorate([
    (0, common_1.Get)(':id/orders'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Get)(':id/active-delivery'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "getActiveDelivery", null);
__decorate([
    (0, common_1.Get)(':id/active-deliveries'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "getActiveDeliveries", null);
__decorate([
    (0, common_1.Get)(':id/active-count'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "getActiveDeliveryCount", null);
__decorate([
    (0, common_1.Post)(':id/assign-order'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('orderId')),
    __param(2, (0, common_1.Body)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "assignOrder", null);
__decorate([
    (0, common_1.Post)(':id/assign-orders'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('orderIds')),
    __param(2, (0, common_1.Body)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, String]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "assignMultipleOrders", null);
__decorate([
    (0, common_1.Post)('unassign-orders'),
    __param(0, (0, common_1.Body)('orderIds')),
    __param(1, (0, common_1.Body)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "unassignMultipleOrders", null);
__decorate([
    (0, common_1.Post)('reset-active'),
    __param(0, (0, common_1.Body)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "resetActiveDeliveries", null);
__decorate([
    (0, common_1.Post)('seed-test-data'),
    __param(0, (0, common_1.Body)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "seedTestData", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DriversController.prototype, "getStats", null);
exports.DriversController = DriversController = __decorate([
    (0, common_1.Controller)('drivers'),
    __metadata("design:paramtypes", [drivers_service_1.DriversService])
], DriversController);
//# sourceMappingURL=drivers.controller.js.map