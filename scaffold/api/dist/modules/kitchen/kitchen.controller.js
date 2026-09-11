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
exports.KitchenController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const kitchen_service_1 = require("./kitchen.service");
let KitchenController = class KitchenController {
    constructor(kitchenService) {
        this.kitchenService = kitchenService;
    }
    getTickets(storeId, station) {
        return this.kitchenService.getTickets(storeId, station);
    }
    createTicket(data) {
        return this.kitchenService.createTicket(data);
    }
    updateTicketStatus(id, status) {
        return this.kitchenService.updateTicketStatus(id, status);
    }
};
exports.KitchenController = KitchenController;
__decorate([
    (0, common_1.Get)('tickets'),
    __param(0, (0, common_1.Query)('storeId')),
    __param(1, (0, common_1.Query)('station')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], KitchenController.prototype, "getTickets", null);
__decorate([
    (0, common_1.Post)('tickets'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KitchenController.prototype, "createTicket", null);
__decorate([
    (0, common_1.Put)('tickets/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], KitchenController.prototype, "updateTicketStatus", null);
exports.KitchenController = KitchenController = __decorate([
    (0, swagger_1.ApiTags)('Kitchen'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('kitchen'),
    __metadata("design:paramtypes", [kitchen_service_1.KitchenService])
], KitchenController);
//# sourceMappingURL=kitchen.controller.js.map