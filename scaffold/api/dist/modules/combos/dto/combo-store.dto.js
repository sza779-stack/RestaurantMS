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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateComboStoresDto = exports.ComboStoreDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class ComboStoreDto {
}
exports.ComboStoreDto = ComboStoreDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Store ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ComboStoreDto.prototype, "storeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Override price for this store' }),
    (0, class_validator_1.IsDecimal)({ decimal_digits: '2' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ComboStoreDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Is available in this store', default: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ComboStoreDto.prototype, "isAvailable", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Available from date' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ComboStoreDto.prototype, "availableFrom", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Available to date' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ComboStoreDto.prototype, "availableTo", void 0);
class UpdateComboStoresDto {
}
exports.UpdateComboStoresDto = UpdateComboStoresDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Store configurations', type: [ComboStoreDto] }),
    __metadata("design:type", Array)
], UpdateComboStoresDto.prototype, "stores", void 0);
//# sourceMappingURL=combo-store.dto.js.map