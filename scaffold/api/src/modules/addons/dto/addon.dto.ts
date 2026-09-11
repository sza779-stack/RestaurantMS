import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, IsArray } from 'class-validator';
import { AddOnType, AddOnCategory, MeasurementUnit } from '@prisma/client';

export class CreateAddOnDto {
  @ApiProperty()
  @IsString()
  storeId: string;

  @ApiProperty({ enum: AddOnType, default: AddOnType.TOPPING })
  @IsEnum(AddOnType)
  @IsOptional()
  type?: AddOnType;

  @ApiProperty({ enum: AddOnCategory, default: AddOnCategory.REGULAR })
  @IsEnum(AddOnCategory)
  @IsOptional()
  category?: AddOnCategory;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  sizePrices?: Record<string, number>;

  @ApiPropertyOptional({ enum: MeasurementUnit, default: MeasurementUnit.PIECES })
  @IsEnum(MeasurementUnit)
  @IsOptional()
  measurementUnit?: MeasurementUnit;

  @ApiPropertyOptional({ default: 1.0 })
  @IsNumber()
  @IsOptional()
  defaultQuantity?: number;

  @ApiPropertyOptional({ type: [String], default: ['STANDALONE'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableItemTypes?: string[];

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateAddOnDto {
  @ApiPropertyOptional({ enum: AddOnType })
  @IsEnum(AddOnType)
  @IsOptional()
  type?: AddOnType;

  @ApiPropertyOptional({ enum: AddOnCategory })
  @IsEnum(AddOnCategory)
  @IsOptional()
  category?: AddOnCategory;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  sizePrices?: Record<string, number>;

  @ApiPropertyOptional({ enum: MeasurementUnit })
  @IsEnum(MeasurementUnit)
  @IsOptional()
  measurementUnit?: MeasurementUnit;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  defaultQuantity?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableItemTypes?: string[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
