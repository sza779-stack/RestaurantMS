import { PricingRule } from '@prisma/client';
declare class SetAddOnDto {
    addonId: string;
    displayOrder?: number;
    priceOverride?: number;
}
export declare class CreateAddOnSetDto {
    storeId: string;
    name: string;
    description?: string;
    pricingRule?: PricingRule;
    minSelect?: number;
    maxSelect?: number;
    applicableItemTypes?: string[];
    isActive?: boolean;
    addons?: SetAddOnDto[];
}
export declare class UpdateAddOnSetDto {
    name?: string;
    description?: string;
    pricingRule?: PricingRule;
    minSelect?: number;
    maxSelect?: number;
    applicableItemTypes?: string[];
    isActive?: boolean;
    addons?: SetAddOnDto[];
}
export {};
