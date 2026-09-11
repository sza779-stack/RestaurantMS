import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsDecimal } from 'class-validator';

export class ComboStoreDto {
  @ApiProperty({ description: 'Store ID' })
  @IsString()
  storeId: string;

  @ApiPropertyOptional({ description: 'Override price for this store' })
  @IsDecimal({ decimal_digits: '2' })
  @IsOptional()
  price?: string;

  @ApiPropertyOptional({ description: 'Is available in this store', default: true })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Available from date' })
  @IsString()
  @IsOptional()
  availableFrom?: string;

  @ApiPropertyOptional({ description: 'Available to date' })
  @IsString()
  @IsOptional()
  availableTo?: string;
}

export class UpdateComboStoresDto {
  @ApiProperty({ description: 'Store configurations', type: [ComboStoreDto] })
  stores: ComboStoreDto[];
}
