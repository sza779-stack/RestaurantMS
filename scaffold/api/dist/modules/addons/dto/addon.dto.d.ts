import { AddOnType, AddOnCategory, MeasurementUnit } from '@prisma/client';
export declare class CreateAddOnDto {
    storeId: string;
    type?: AddOnType;
    category?: AddOnCategory;
    name: string;
    price?: number;
    sizePrices?: Record<string, number>;
    measurementUnit?: MeasurementUnit;
    defaultQuantity?: number;
    applicableItemTypes?: string[];
    isActive?: boolean;
}
export declare class UpdateAddOnDto {
    type?: AddOnType;
    category?: AddOnCategory;
    name?: string;
    price?: number;
    sizePrices?: Record<string, number>;
    measurementUnit?: MeasurementUnit;
    defaultQuantity?: number;
    applicableItemTypes?: string[];
    isActive?: boolean;
}
