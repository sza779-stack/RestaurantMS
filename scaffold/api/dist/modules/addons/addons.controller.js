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
exports.AddonsController = void 0;
const common_1 = require("@nestjs/common");
const addons_service_1 = require("./addons.service");
const addon_dto_1 = require("./dto/addon.dto");
const addon_set_dto_1 = require("./dto/addon-set.dto");
const swagger_1 = require("@nestjs/swagger");
let AddonsController = class AddonsController {
    constructor(addonsService) {
        this.addonsService = addonsService;
    }
    createAddOn(createAddOnDto) {
        return this.addonsService.createAddOn(createAddOnDto);
    }
    findAllAddOns(storeId) {
        return this.addonsService.findAllAddOns(storeId);
    }
    findAllAddOnSets(storeId) {
        return this.addonsService.findAllAddOnSets(storeId);
    }
    findOneAddOnSet(id) {
        return this.addonsService.findOneAddOnSet(id);
    }
    createAddOnSet(createAddOnSetDto) {
        return this.addonsService.createAddOnSet(createAddOnSetDto);
    }
    updateAddOnSet(id, updateAddOnSetDto) {
        return this.addonsService.updateAddOnSet(id, updateAddOnSetDto);
    }
    removeAddOnSet(id) {
        return this.addonsService.removeAddOnSet(id);
    }
    linkSetToProduct(productId, setId, displayOrder) {
        return this.addonsService.linkSetToProduct(productId, setId, displayOrder);
    }
    unlinkSetFromProduct(productId, setId) {
        return this.addonsService.unlinkSetFromProduct(productId, setId);
    }
    getProductAddOnSets(productId) {
        return this.addonsService.getProductAddOnSets(productId);
    }
    findOneAddOn(id) {
        return this.addonsService.findOneAddOn(id);
    }
    updateAddOn(id, updateAddOnDto) {
        return this.addonsService.updateAddOn(id, updateAddOnDto);
    }
    removeAddOn(id) {
        return this.addonsService.removeAddOn(id);
    }
};
exports.AddonsController = AddonsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new AddOn' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [addon_dto_1.CreateAddOnDto]),
    __metadata("design:returntype", void 0)
], AddonsController.prototype, "createAddOn", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all active AddOns' }),
    __param(0, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AddonsController.prototype, "findAllAddOns", null);
__decorate([
    (0, common_1.Get)('sets'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all active AddOnSets' }),
    __param(0, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AddonsController.prototype, "findAllAddOnSets", null);
__decorate([
    (0, common_1.Get)('sets/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific AddOnSet' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AddonsController.prototype, "findOneAddOnSet", null);
__decorate([
    (0, common_1.Post)('sets'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new AddOnSet' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [addon_set_dto_1.CreateAddOnSetDto]),
    __metadata("design:returntype", void 0)
], AddonsController.prototype, "createAddOnSet", null);
__decorate([
    (0, common_1.Patch)('sets/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an AddOnSet' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, addon_set_dto_1.UpdateAddOnSetDto]),
    __metadata("design:returntype", void 0)
], AddonsController.prototype, "updateAddOnSet", null);
__decorate([
    (0, common_1.Delete)('sets/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete an AddOnSet' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AddonsController.prototype, "removeAddOnSet", null);
__decorate([
    (0, common_1.Post)('product/:productId/link/:setId'),
    (0, swagger_1.ApiOperation)({ summary: 'Link an AddOnSet to a Product' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Param)('setId')),
    __param(2, (0, common_1.Body)('displayOrder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", void 0)
], AddonsController.prototype, "linkSetToProduct", null);
__decorate([
    (0, common_1.Delete)('product/:productId/unlink/:setId'),
    (0, swagger_1.ApiOperation)({ summary: 'Unlink an AddOnSet from a Product' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Param)('setId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AddonsController.prototype, "unlinkSetFromProduct", null);
__decorate([
    (0, common_1.Get)('product/:productId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all AddOnSets for a Product' }),
    __param(0, (0, common_1.Param)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AddonsController.prototype, "getProductAddOnSets", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific AddOn' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AddonsController.prototype, "findOneAddOn", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an AddOn' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, addon_dto_1.UpdateAddOnDto]),
    __metadata("design:returntype", void 0)
], AddonsController.prototype, "updateAddOn", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete an AddOn' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AddonsController.prototype, "removeAddOn", null);
exports.AddonsController = AddonsController = __decorate([
    (0, swagger_1.ApiTags)('AddOns'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('addons'),
    __metadata("design:paramtypes", [addons_service_1.AddonsService])
], AddonsController);
//# sourceMappingURL=addons.controller.js.map