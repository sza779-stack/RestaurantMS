import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsDecimal,
  ValidateNested,
  IsEnum,
  IsObject,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { KitchenStation } from '@prisma/client';

class ComboItemDto {
  @ApiPropertyOptional({ description: 'Product ID (null if category selection)' })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({ description: 'Category ID for customer selection' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ description: 'Display name for this combo item' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Quantity included', default: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Generic component type for configurable combo builders',
    enum: ['PIZZA', 'WINGS', 'SODA', 'MENU_ITEM', 'MENU_CATEGORY', 'CUSTOM'],
    default: 'MENU_ITEM',
  })
  @IsString()
  @IsOptional()
  componentType?: string;

  @ApiPropertyOptional({ description: 'Structured rules for eligible sizes/options and customer selection behavior' })
  @IsObject()
  @IsOptional()
  selectionRules?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Allow size selection', default: true })
  @IsBoolean()
  @IsOptional()
  allowSizeSelection?: boolean;

  @ApiPropertyOptional({ description: 'Default size ID' })
  @IsString()
  @IsOptional()
  defaultSizeId?: string;

  @ApiPropertyOptional({ description: 'Allowed size IDs (empty = all)', default: [] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedSizeIds?: string[];

  @ApiPropertyOptional({ description: 'Allow customization', default: true })
  @IsBoolean()
  @IsOptional()
  allowCustomization?: boolean;

  @ApiPropertyOptional({ description: 'Max included toppings', default: 0 })
  @IsNumber()
  @IsOptional()
  maxIncludedToppings?: number;

  @ApiPropertyOptional({ description: 'Free modifier group IDs', default: [] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  freeModifierGroups?: string[];

  @ApiPropertyOptional({ description: 'Allow modifiers', default: true })
  @IsBoolean()
  @IsOptional()
  allowModifiers?: boolean;

  @ApiPropertyOptional({ description: 'Included modifier IDs', default: [] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  includedModifierIds?: string[];

  @ApiPropertyOptional({ description: 'Product is fixed (false = customer chooses)', default: true })
  @IsBoolean()
  @IsOptional()
  isProductFixed?: boolean;

  @ApiPropertyOptional({ description: 'Product group label for selection' })
  @IsString()
  @IsOptional()
  productGroupLabel?: string;

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class CreateComboDto {
  @ApiProperty({ description: 'Store ID' })
  @IsString()
  storeId: string;

  @ApiProperty({ description: 'Combo name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'SKU code' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiProperty({ description: 'Base price' })
  @IsDecimal({ decimal_digits: '2' })
  basePrice: string;

  @ApiProperty({ description: 'Retail value (if purchased separately)' })
  @IsDecimal({ decimal_digits: '2' })
  retailValue: string;

  @ApiPropertyOptional({ description: 'Image URL' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Gallery URLs', default: [] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  galleryUrls?: string[];

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Is featured', default: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Prep time in minutes', default: 15 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  prepTimeMinutes?: number;

  @ApiPropertyOptional({ description: 'Kitchen station', enum: KitchenStation, default: KitchenStation.GENERAL })
  @IsEnum(KitchenStation)
  @IsOptional()
  kitchenStation?: KitchenStation;

  @ApiPropertyOptional({ description: 'Available from date' })
  @IsString()
  @IsOptional()
  availableFrom?: string;

  @ApiPropertyOptional({ description: 'Available to date' })
  @IsString()
  @IsOptional()
  availableTo?: string;

  @ApiPropertyOptional({ description: 'Available days (0-6)', default: [] })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  availableDays?: number[];

  @ApiProperty({ description: 'Combo items', type: [ComboItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComboItemDto)
  items: ComboItemDto[];
}
