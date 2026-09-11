import { CombosService } from './combos.service';
import { CreateComboDto } from './dto/create-combo.dto';
import { UpdateComboDto } from './dto/update-combo.dto';
import { UpdateComboStoresDto } from './dto/combo-store.dto';
export declare class CombosController {
    private readonly combosService;
    constructor(combosService: CombosService);
    create(createComboDto: CreateComboDto): Promise<{
        items: ({
            product: {
                id: string;
                name: string;
                imageUrl: string;
                basePrice: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            name: string;
            sortOrder: number;
            categoryId: string | null;
            productId: string | null;
            quantity: number;
            componentType: string;
            selectionRules: import("@prisma/client/runtime/library").JsonValue;
            allowSizeSelection: boolean;
            defaultSizeId: string | null;
            allowedSizeIds: string[];
            allowCustomization: boolean;
            maxIncludedToppings: number;
            freeModifierGroups: string[];
            allowModifiers: boolean;
            includedModifierIds: string[];
            isProductFixed: boolean;
            productGroupLabel: string | null;
            comboId: string;
        })[];
        stores: {
            id: string;
            storeId: string;
            availableFrom: Date | null;
            availableTo: Date | null;
            price: import("@prisma/client/runtime/library").Decimal | null;
            isAvailable: boolean;
            comboId: string;
        }[];
    } & {
        id: string;
        storeId: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        sortOrder: number;
        imageUrl: string | null;
        availableFrom: Date | null;
        availableTo: Date | null;
        availableDays: number[];
        sku: string | null;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        galleryUrls: string[];
        isFeatured: boolean;
        prepTimeMinutes: number;
        kitchenStation: import(".prisma/client").$Enums.KitchenStation;
        retailValue: import("@prisma/client/runtime/library").Decimal;
    }>;
    findAll(storeId?: string, isActive?: string): Promise<({
        items: ({
            product: {
                id: string;
                name: string;
                imageUrl: string;
                basePrice: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            name: string;
            sortOrder: number;
            categoryId: string | null;
            productId: string | null;
            quantity: number;
            componentType: string;
            selectionRules: import("@prisma/client/runtime/library").JsonValue;
            allowSizeSelection: boolean;
            defaultSizeId: string | null;
            allowedSizeIds: string[];
            allowCustomization: boolean;
            maxIncludedToppings: number;
            freeModifierGroups: string[];
            allowModifiers: boolean;
            includedModifierIds: string[];
            isProductFixed: boolean;
            productGroupLabel: string | null;
            comboId: string;
        })[];
        _count: {
            stores: number;
        };
    } & {
        id: string;
        storeId: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        sortOrder: number;
        imageUrl: string | null;
        availableFrom: Date | null;
        availableTo: Date | null;
        availableDays: number[];
        sku: string | null;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        galleryUrls: string[];
        isFeatured: boolean;
        prepTimeMinutes: number;
        kitchenStation: import(".prisma/client").$Enums.KitchenStation;
        retailValue: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    getAvailableForStore(storeId: string): Promise<{
        items: {
            category: {
                id: string;
                name: string;
            };
            product: {
                id: string;
                name: string;
                addonSets: ({
                    addonSet: {
                        addons: ({
                            addon: {
                                category: import(".prisma/client").$Enums.AddOnCategory;
                                id: string;
                                storeId: string;
                                createdAt: Date;
                                name: string;
                                type: import(".prisma/client").$Enums.AddOnType;
                                isActive: boolean;
                                updatedAt: Date;
                                isDefault: boolean;
                                price: import("@prisma/client/runtime/library").Decimal;
                                sizePrices: import("@prisma/client/runtime/library").JsonValue | null;
                                measurementUnit: import(".prisma/client").$Enums.MeasurementUnit;
                                defaultQuantity: import("@prisma/client/runtime/library").Decimal;
                                applicableItemTypes: import(".prisma/client").$Enums.ProductType[];
                            };
                        } & {
                            displayOrder: number;
                            setId: string;
                            addonId: string;
                            priceOverride: import("@prisma/client/runtime/library").Decimal | null;
                        })[];
                    } & {
                        id: string;
                        storeId: string;
                        createdAt: Date;
                        name: string;
                        isActive: boolean;
                        updatedAt: Date;
                        description: string | null;
                        applicableItemTypes: import(".prisma/client").$Enums.ProductType[];
                        pricingRule: import(".prisma/client").$Enums.PricingRule;
                        minSelect: number;
                        maxSelect: number | null;
                    };
                } & {
                    displayOrder: number;
                    productId: string;
                    addonSetId: string;
                })[];
                imageUrl: string;
                basePrice: import("@prisma/client/runtime/library").Decimal;
                sizes: {
                    id: string;
                    name: string;
                    code: string;
                    sortOrder: number;
                    productId: string;
                    priceAdjustment: import("@prisma/client/runtime/library").Decimal;
                    slices: number | null;
                }[];
            };
            id: string;
            name: string;
            sortOrder: number;
            categoryId: string | null;
            productId: string | null;
            quantity: number;
            componentType: string;
            selectionRules: import("@prisma/client/runtime/library").JsonValue;
            allowSizeSelection: boolean;
            defaultSizeId: string | null;
            allowedSizeIds: string[];
            allowCustomization: boolean;
            maxIncludedToppings: number;
            freeModifierGroups: string[];
            allowModifiers: boolean;
            includedModifierIds: string[];
            isProductFixed: boolean;
            productGroupLabel: string | null;
            comboId: string;
        }[];
        effectivePrice: import("@prisma/client/runtime/library").Decimal;
        savings: number;
        stores: {
            id: string;
            storeId: string;
            availableFrom: Date | null;
            availableTo: Date | null;
            price: import("@prisma/client/runtime/library").Decimal | null;
            isAvailable: boolean;
            comboId: string;
        }[];
        id: string;
        storeId: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        sortOrder: number;
        imageUrl: string | null;
        availableFrom: Date | null;
        availableTo: Date | null;
        availableDays: number[];
        sku: string | null;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        galleryUrls: string[];
        isFeatured: boolean;
        prepTimeMinutes: number;
        kitchenStation: import(".prisma/client").$Enums.KitchenStation;
        retailValue: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    findOne(id: string): Promise<{
        items: ({
            product: {
                id: string;
                name: string;
                imageUrl: string;
                basePrice: import("@prisma/client/runtime/library").Decimal;
                sizes: {
                    id: string;
                    name: string;
                    code: string;
                    sortOrder: number;
                    productId: string;
                    priceAdjustment: import("@prisma/client/runtime/library").Decimal;
                    slices: number | null;
                }[];
            };
        } & {
            id: string;
            name: string;
            sortOrder: number;
            categoryId: string | null;
            productId: string | null;
            quantity: number;
            componentType: string;
            selectionRules: import("@prisma/client/runtime/library").JsonValue;
            allowSizeSelection: boolean;
            defaultSizeId: string | null;
            allowedSizeIds: string[];
            allowCustomization: boolean;
            maxIncludedToppings: number;
            freeModifierGroups: string[];
            allowModifiers: boolean;
            includedModifierIds: string[];
            isProductFixed: boolean;
            productGroupLabel: string | null;
            comboId: string;
        })[];
        stores: ({
            store: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            storeId: string;
            availableFrom: Date | null;
            availableTo: Date | null;
            price: import("@prisma/client/runtime/library").Decimal | null;
            isAvailable: boolean;
            comboId: string;
        })[];
    } & {
        id: string;
        storeId: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        sortOrder: number;
        imageUrl: string | null;
        availableFrom: Date | null;
        availableTo: Date | null;
        availableDays: number[];
        sku: string | null;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        galleryUrls: string[];
        isFeatured: boolean;
        prepTimeMinutes: number;
        kitchenStation: import(".prisma/client").$Enums.KitchenStation;
        retailValue: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(id: string, updateComboDto: UpdateComboDto): Promise<{
        items: ({
            product: {
                id: string;
                name: string;
                imageUrl: string;
                basePrice: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            name: string;
            sortOrder: number;
            categoryId: string | null;
            productId: string | null;
            quantity: number;
            componentType: string;
            selectionRules: import("@prisma/client/runtime/library").JsonValue;
            allowSizeSelection: boolean;
            defaultSizeId: string | null;
            allowedSizeIds: string[];
            allowCustomization: boolean;
            maxIncludedToppings: number;
            freeModifierGroups: string[];
            allowModifiers: boolean;
            includedModifierIds: string[];
            isProductFixed: boolean;
            productGroupLabel: string | null;
            comboId: string;
        })[];
        stores: {
            id: string;
            storeId: string;
            availableFrom: Date | null;
            availableTo: Date | null;
            price: import("@prisma/client/runtime/library").Decimal | null;
            isAvailable: boolean;
            comboId: string;
        }[];
    } & {
        id: string;
        storeId: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        sortOrder: number;
        imageUrl: string | null;
        availableFrom: Date | null;
        availableTo: Date | null;
        availableDays: number[];
        sku: string | null;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        galleryUrls: string[];
        isFeatured: boolean;
        prepTimeMinutes: number;
        kitchenStation: import(".prisma/client").$Enums.KitchenStation;
        retailValue: import("@prisma/client/runtime/library").Decimal;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    updateStores(id: string, dto: UpdateComboStoresDto): Promise<{
        items: ({
            product: {
                id: string;
                name: string;
                imageUrl: string;
                basePrice: import("@prisma/client/runtime/library").Decimal;
                sizes: {
                    id: string;
                    name: string;
                    code: string;
                    sortOrder: number;
                    productId: string;
                    priceAdjustment: import("@prisma/client/runtime/library").Decimal;
                    slices: number | null;
                }[];
            };
        } & {
            id: string;
            name: string;
            sortOrder: number;
            categoryId: string | null;
            productId: string | null;
            quantity: number;
            componentType: string;
            selectionRules: import("@prisma/client/runtime/library").JsonValue;
            allowSizeSelection: boolean;
            defaultSizeId: string | null;
            allowedSizeIds: string[];
            allowCustomization: boolean;
            maxIncludedToppings: number;
            freeModifierGroups: string[];
            allowModifiers: boolean;
            includedModifierIds: string[];
            isProductFixed: boolean;
            productGroupLabel: string | null;
            comboId: string;
        })[];
        stores: ({
            store: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            storeId: string;
            availableFrom: Date | null;
            availableTo: Date | null;
            price: import("@prisma/client/runtime/library").Decimal | null;
            isAvailable: boolean;
            comboId: string;
        })[];
    } & {
        id: string;
        storeId: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        sortOrder: number;
        imageUrl: string | null;
        availableFrom: Date | null;
        availableTo: Date | null;
        availableDays: number[];
        sku: string | null;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        galleryUrls: string[];
        isFeatured: boolean;
        prepTimeMinutes: number;
        kitchenStation: import(".prisma/client").$Enums.KitchenStation;
        retailValue: import("@prisma/client/runtime/library").Decimal;
    }>;
    duplicate(id: string, name?: string): Promise<{
        items: ({
            product: {
                id: string;
                name: string;
                imageUrl: string;
                basePrice: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            name: string;
            sortOrder: number;
            categoryId: string | null;
            productId: string | null;
            quantity: number;
            componentType: string;
            selectionRules: import("@prisma/client/runtime/library").JsonValue;
            allowSizeSelection: boolean;
            defaultSizeId: string | null;
            allowedSizeIds: string[];
            allowCustomization: boolean;
            maxIncludedToppings: number;
            freeModifierGroups: string[];
            allowModifiers: boolean;
            includedModifierIds: string[];
            isProductFixed: boolean;
            productGroupLabel: string | null;
            comboId: string;
        })[];
    } & {
        id: string;
        storeId: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        sortOrder: number;
        imageUrl: string | null;
        availableFrom: Date | null;
        availableTo: Date | null;
        availableDays: number[];
        sku: string | null;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        galleryUrls: string[];
        isFeatured: boolean;
        prepTimeMinutes: number;
        kitchenStation: import(".prisma/client").$Enums.KitchenStation;
        retailValue: import("@prisma/client/runtime/library").Decimal;
    }>;
}
