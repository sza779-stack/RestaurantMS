import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsBoolean, IsOptional, IsEnum, IsArray, IsNumber, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { PricingRule } from '@prisma/client';

class SetAddOnDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  addonId: string;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  priceOverride?: number;
}

export class CreateAddOnSetDto {
  @ApiProperty()
  @IsString()
  storeId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: PricingRule, default: PricingRule.PER_ITEM_PRICE })
  @IsEnum(PricingRule)
  @IsOptional()
  pricingRule?: PricingRule;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @IsOptional()
  minSelect?: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  maxSelect?: number;

  @ApiPropertyOptional({ type: [String], default: ['STANDALONE'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableItemTypes?: string[];

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [SetAddOnDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetAddOnDto)
  @IsOptional()
  addons?: SetAddOnDto[];
}

export class UpdateAddOnSetDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: PricingRule })
  @IsEnum(PricingRule)
  @IsOptional()
  pricingRule?: PricingRule;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  minSelect?: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  maxSelect?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableItemTypes?: string[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [SetAddOnDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetAddOnDto)
  @IsOptional()
  addons?: SetAddOnDto[];
}
