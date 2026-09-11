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
exports.CreateComboDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class ComboItemDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Product ID (null if category selection)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ComboItemDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Category ID for customer selection' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ComboItemDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Display name for this combo item' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ComboItemDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Quantity included', default: 1 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ComboItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Generic component type for configurable combo builders',
        enum: ['PIZZA', 'WINGS', 'SODA', 'MENU_ITEM', 'MENU_CATEGORY', 'CUSTOM'],
        default: 'MENU_ITEM',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ComboItemDto.prototype, "componentType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Structured rules for eligible sizes/options and customer selection behavior' }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], ComboItemDto.prototype, "selectionRules", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Allow size selection', default: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ComboItemDto.prototype, "allowSizeSelection", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Default size ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ComboItemDto.prototype, "defaultSizeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Allowed size IDs (empty = all)', default: [] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ComboItemDto.prototype, "allowedSizeIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Allow customization', default: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ComboItemDto.prototype, "allowCustomization", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Max included toppings', default: 0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ComboItemDto.prototype, "maxIncludedToppings", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Free modifier group IDs', default: [] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ComboItemDto.prototype, "freeModifierGroups", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Allow modifiers', default: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ComboItemDto.prototype, "allowModifiers", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Included modifier IDs', default: [] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ComboItemDto.prototype, "includedModifierIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Product is fixed (false = customer chooses)', default: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ComboItemDto.prototype, "isProductFixed", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Product group label for selection' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ComboItemDto.prototype, "productGroupLabel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sort order', default: 0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ComboItemDto.prototype, "sortOrder", void 0);
class CreateComboDto {
}
exports.CreateComboDto = CreateComboDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Store ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComboDto.prototype, "storeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Combo name' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComboDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Description' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateComboDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'SKU code' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateComboDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Base price' }),
    (0, class_validator_1.IsDecimal)({ decimal_digits: '2' }),
    __metadata("design:type", String)
], CreateComboDto.prototype, "basePrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Retail value (if purchased separately)' }),
    (0, class_validator_1.IsDecimal)({ decimal_digits: '2' }),
    __metadata("design:type", String)
], CreateComboDto.prototype, "retailValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Image URL' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateComboDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Gallery URLs', default: [] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateComboDto.prototype, "galleryUrls", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Is active', default: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateComboDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Is featured', default: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateComboDto.prototype, "isFeatured", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sort order', default: 0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateComboDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Prep time in minutes', default: 15 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateComboDto.prototype, "prepTimeMinutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Kitchen station', enum: client_1.KitchenStation, default: client_1.KitchenStation.GENERAL }),
    (0, class_validator_1.IsEnum)(client_1.KitchenStation),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateComboDto.prototype, "kitchenStation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Available from date' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateComboDto.prototype, "availableFrom", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Available to date' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateComboDto.prototype, "availableTo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Available days (0-6)', default: [] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNumber)({}, { each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateComboDto.prototype, "availableDays", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Combo items', type: [ComboItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ComboItemDto),
    __metadata("design:type", Array)
], CreateComboDto.prototype, "items", void 0);
//# sourceMappingURL=create-combo.dto.js.map