import { MenuService } from './menu.service';
export declare class MenuController {
    private readonly menuService;
    constructor(menuService: MenuService);
    getCategories(storeId: string): Promise<{
        id: string;
        storeId: string;
        name: string;
        isActive: boolean;
        description: string | null;
        parentId: string | null;
        sortOrder: number;
        imageUrl: string | null;
        color: string | null;
        icon: string | null;
        availableFrom: Date | null;
        availableTo: Date | null;
        availableDays: number[];
    }[]>;
    getProducts(storeId: string, categoryId?: string): Promise<({
        category: {
            id: string;
            storeId: string;
            name: string;
            isActive: boolean;
            description: string | null;
            parentId: string | null;
            sortOrder: number;
            imageUrl: string | null;
            color: string | null;
            icon: string | null;
            availableFrom: Date | null;
            availableTo: Date | null;
            availableDays: number[];
        };
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
        sizes: {
            id: string;
            name: string;
            code: string;
            sortOrder: number;
            productId: string;
            priceAdjustment: import("@prisma/client/runtime/library").Decimal;
            slices: number | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        type: import(".prisma/client").$Enums.ProductType;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        imageUrl: string | null;
        categoryId: string;
        sku: string | null;
        barcode: string | null;
        configuration: import("@prisma/client/runtime/library").JsonValue;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        costPrice: import("@prisma/client/runtime/library").Decimal | null;
        galleryUrls: string[];
        isFeatured: boolean;
        prepTimeMinutes: number;
        kitchenStation: import(".prisma/client").$Enums.KitchenStation;
    })[]>;
    getAddOns(storeId?: string): Promise<{
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
    }[]>;
    getAddOnSets(storeId?: string): Promise<({
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
    })[]>;
    createCategory(data: any): Promise<{
        id: string;
        storeId: string;
        name: string;
        isActive: boolean;
        description: string | null;
        parentId: string | null;
        sortOrder: number;
        imageUrl: string | null;
        color: string | null;
        icon: string | null;
        availableFrom: Date | null;
        availableTo: Date | null;
        availableDays: number[];
    }>;
    createProduct(data: any): Promise<{
        category: {
            id: string;
            storeId: string;
            name: string;
            isActive: boolean;
            description: string | null;
            parentId: string | null;
            sortOrder: number;
            imageUrl: string | null;
            color: string | null;
            icon: string | null;
            availableFrom: Date | null;
            availableTo: Date | null;
            availableDays: number[];
        };
        sizes: {
            id: string;
            name: string;
            code: string;
            sortOrder: number;
            productId: string;
            priceAdjustment: import("@prisma/client/runtime/library").Decimal;
            slices: number | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        type: import(".prisma/client").$Enums.ProductType;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        imageUrl: string | null;
        categoryId: string;
        sku: string | null;
        barcode: string | null;
        configuration: import("@prisma/client/runtime/library").JsonValue;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        costPrice: import("@prisma/client/runtime/library").Decimal | null;
        galleryUrls: string[];
        isFeatured: boolean;
        prepTimeMinutes: number;
        kitchenStation: import(".prisma/client").$Enums.KitchenStation;
    }>;
    updateProduct(id: string, data: any): Promise<{
        category: {
            id: string;
            storeId: string;
            name: string;
            isActive: boolean;
            description: string | null;
            parentId: string | null;
            sortOrder: number;
            imageUrl: string | null;
            color: string | null;
            icon: string | null;
            availableFrom: Date | null;
            availableTo: Date | null;
            availableDays: number[];
        };
        sizes: {
            id: string;
            name: string;
            code: string;
            sortOrder: number;
            productId: string;
            priceAdjustment: import("@prisma/client/runtime/library").Decimal;
            slices: number | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        type: import(".prisma/client").$Enums.ProductType;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        imageUrl: string | null;
        categoryId: string;
        sku: string | null;
        barcode: string | null;
        configuration: import("@prisma/client/runtime/library").JsonValue;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        costPrice: import("@prisma/client/runtime/library").Decimal | null;
        galleryUrls: string[];
        isFeatured: boolean;
        prepTimeMinutes: number;
        kitchenStation: import(".prisma/client").$Enums.KitchenStation;
    }>;
    deleteProduct(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        type: import(".prisma/client").$Enums.ProductType;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        imageUrl: string | null;
        categoryId: string;
        sku: string | null;
        barcode: string | null;
        configuration: import("@prisma/client/runtime/library").JsonValue;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        costPrice: import("@prisma/client/runtime/library").Decimal | null;
        galleryUrls: string[];
        isFeatured: boolean;
        prepTimeMinutes: number;
        kitchenStation: import(".prisma/client").$Enums.KitchenStation;
    }>;
}
