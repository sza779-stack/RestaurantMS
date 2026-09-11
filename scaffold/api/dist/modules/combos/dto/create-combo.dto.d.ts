import { KitchenStation } from '@prisma/client';
declare class ComboItemDto {
    productId?: string;
    categoryId?: string;
    name: string;
    quantity?: number;
    componentType?: string;
    selectionRules?: Record<string, any>;
    allowSizeSelection?: boolean;
    defaultSizeId?: string;
    allowedSizeIds?: string[];
    allowCustomization?: boolean;
    maxIncludedToppings?: number;
    freeModifierGroups?: string[];
    allowModifiers?: boolean;
    includedModifierIds?: string[];
    isProductFixed?: boolean;
    productGroupLabel?: string;
    sortOrder?: number;
}
export declare class CreateComboDto {
    storeId: string;
    name: string;
    description?: string;
    sku?: string;
    basePrice: string;
    retailValue: string;
    imageUrl?: string;
    galleryUrls?: string[];
    isActive?: boolean;
    isFeatured?: boolean;
    sortOrder?: number;
    prepTimeMinutes?: number;
    kitchenStation?: KitchenStation;
    availableFrom?: string;
    availableTo?: string;
    availableDays?: number[];
    items: ComboItemDto[];
}
export {};
