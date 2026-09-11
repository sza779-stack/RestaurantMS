import { DriverStatus } from '@prisma/client';
export declare class CreateDriverDto {
    id?: string;
    name: string;
    phone: string;
    email?: string;
    vehicleType?: string;
    licensePlate?: string;
    pin?: string;
    isContractor?: boolean;
    perDeliveryRate?: number;
    storeId: string;
}
export declare class UpdateDriverDto {
    name?: string;
    phone?: string;
    email?: string;
    vehicleType?: string;
    licensePlate?: string;
    pin?: string;
    status?: DriverStatus;
    isActive?: boolean;
    isContractor?: boolean;
    perDeliveryRate?: number;
}
export declare class DriverLoginDto {
    email: string;
    pin: string;
}
export declare class UpdateLocationDto {
    lat: number;
    lng: number;
}
