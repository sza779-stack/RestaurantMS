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
exports.CombosController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const combos_service_1 = require("./combos.service");
const create_combo_dto_1 = require("./dto/create-combo.dto");
const update_combo_dto_1 = require("./dto/update-combo.dto");
const combo_store_dto_1 = require("./dto/combo-store.dto");
let CombosController = class CombosController {
    constructor(combosService) {
        this.combosService = combosService;
    }
    create(createComboDto) {
        return this.combosService.create(createComboDto);
    }
    findAll(storeId, isActive) {
        return this.combosService.findAll(storeId, isActive !== undefined ? isActive === 'true' : undefined);
    }
    getAvailableForStore(storeId) {
        return this.combosService.getAvailableForStore(storeId);
    }
    findOne(id) {
        return this.combosService.findOne(id);
    }
    update(id, updateComboDto) {
        return this.combosService.update(id, updateComboDto);
    }
    remove(id) {
        return this.combosService.remove(id);
    }
    updateStores(id, dto) {
        return this.combosService.updateStores(id, dto);
    }
    duplicate(id, name) {
        return this.combosService.duplicate(id, name);
    }
};
exports.CombosController = CombosController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new combo' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_combo_dto_1.CreateComboDto]),
    __metadata("design:returntype", void 0)
], CombosController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all combos' }),
    (0, swagger_1.ApiQuery)({ name: 'storeId', required: false, description: 'Filter by store' }),
    (0, swagger_1.ApiQuery)({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' }),
    __param(0, (0, common_1.Query)('storeId')),
    __param(1, (0, common_1.Query)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CombosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('available'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available combos for a store' }),
    (0, swagger_1.ApiQuery)({ name: 'storeId', required: true, description: 'Store ID' }),
    __param(0, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CombosController.prototype, "getAvailableForStore", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a combo by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Combo ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CombosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a combo' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Combo ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_combo_dto_1.UpdateComboDto]),
    __metadata("design:returntype", void 0)
], CombosController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a combo' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Combo ID' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CombosController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/stores'),
    (0, swagger_1.ApiOperation)({ summary: 'Update combo store availability' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Combo ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, combo_store_dto_1.UpdateComboStoresDto]),
    __metadata("design:returntype", void 0)
], CombosController.prototype, "updateStores", null);
__decorate([
    (0, common_1.Post)(':id/duplicate'),
    (0, swagger_1.ApiOperation)({ summary: 'Duplicate a combo' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Combo ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CombosController.prototype, "duplicate", null);
exports.CombosController = CombosController = __decorate([
    (0, swagger_1.ApiTags)('Combos'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('combos'),
    __metadata("design:paramtypes", [combos_service_1.CombosService])
], CombosController);
//# sourceMappingURL=combos.controller.js.map