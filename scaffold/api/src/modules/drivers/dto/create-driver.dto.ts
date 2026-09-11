import { IsString, IsOptional, IsBoolean, IsNumber, IsEmail, IsEnum } from 'class-validator';
import { DriverStatus } from '@prisma/client';

export class CreateDriverDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  vehicleType?: string;

  @IsString()
  @IsOptional()
  licensePlate?: string;

  @IsString()
  @IsOptional()
  pin?: string; // 4-6 digit PIN for mobile login

  @IsBoolean()
  @IsOptional()
  isContractor?: boolean;

  @IsNumber()
  @IsOptional()
  perDeliveryRate?: number;

  @IsString()
  storeId: string;
}

export class UpdateDriverDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  vehicleType?: string;

  @IsString()
  @IsOptional()
  licensePlate?: string;

  @IsString()
  @IsOptional()
  pin?: string;

  @IsEnum(DriverStatus)
  @IsOptional()
  status?: DriverStatus;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isContractor?: boolean;

  @IsNumber()
  @IsOptional()
  perDeliveryRate?: number;
}

export class DriverLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  pin: string;
}

export class UpdateLocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}
