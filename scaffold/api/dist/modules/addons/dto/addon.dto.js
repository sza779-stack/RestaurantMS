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
exports.UpdateAddOnDto = exports.CreateAddOnDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateAddOnDto {
}
exports.CreateAddOnDto = CreateAddOnDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAddOnDto.prototype, "storeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.AddOnType, default: client_1.AddOnType.TOPPING }),
    (0, class_validator_1.IsEnum)(client_1.AddOnType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAddOnDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.AddOnCategory, default: client_1.AddOnCategory.REGULAR }),
    (0, class_validator_1.IsEnum)(client_1.AddOnCategory),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAddOnDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAddOnDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateAddOnDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: 'object' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateAddOnDto.prototype, "sizePrices", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.MeasurementUnit, default: client_1.MeasurementUnit.PIECES }),
    (0, class_validator_1.IsEnum)(client_1.MeasurementUnit),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAddOnDto.prototype, "measurementUnit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1.0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateAddOnDto.prototype, "defaultQuantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], default: ['STANDALONE'] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateAddOnDto.prototype, "applicableItemTypes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateAddOnDto.prototype, "isActive", void 0);
class UpdateAddOnDto {
}
exports.UpdateAddOnDto = UpdateAddOnDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.AddOnType }),
    (0, class_validator_1.IsEnum)(client_1.AddOnType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAddOnDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.AddOnCategory }),
    (0, class_validator_1.IsEnum)(client_1.AddOnCategory),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAddOnDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAddOnDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateAddOnDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: 'object' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateAddOnDto.prototype, "sizePrices", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.MeasurementUnit }),
    (0, class_validator_1.IsEnum)(client_1.MeasurementUnit),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAddOnDto.prototype, "measurementUnit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateAddOnDto.prototype, "defaultQuantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateAddOnDto.prototype, "applicableItemTypes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateAddOnDto.prototype, "isActive", void 0);
//# sourceMappingURL=addon.dto.js.map