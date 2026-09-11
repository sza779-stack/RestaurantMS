import { AddonsService } from './addons.service';
import { CreateAddOnDto, UpdateAddOnDto } from './dto/addon.dto';
import { CreateAddOnSetDto, UpdateAddOnSetDto } from './dto/addon-set.dto';
export declare class AddonsController {
    private readonly addonsService;
    constructor(addonsService: AddonsService);
    createAddOn(createAddOnDto: CreateAddOnDto): Promise<{
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
    }>;
    findAllAddOns(storeId?: string): Promise<{
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
    findAllAddOnSets(storeId?: string): Promise<({
        products: ({
            product: {
                category: {
                    id: string;
                    name: string;
                };
                id: string;
                name: string;
            };
        } & {
            displayOrder: number;
            productId: string;
            addonSetId: string;
        })[];
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
    findOneAddOnSet(id: string): Promise<{
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
    }>;
    createAddOnSet(createAddOnSetDto: CreateAddOnSetDto): Promise<{
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
    }>;
    updateAddOnSet(id: string, updateAddOnSetDto: UpdateAddOnSetDto): Promise<{
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
    }>;
    removeAddOnSet(id: string): Promise<{
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
    }>;
    linkSetToProduct(productId: string, setId: string, displayOrder?: number): Promise<{
        displayOrder: number;
        productId: string;
        addonSetId: string;
    }>;
    unlinkSetFromProduct(productId: string, setId: string): Promise<{
        displayOrder: number;
        productId: string;
        addonSetId: string;
    }>;
    getProductAddOnSets(productId: string): Promise<({
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
    })[]>;
    findOneAddOn(id: string): Promise<{
        addonSets: ({
            set: {
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
            setId: string;
            addonId: string;
            priceOverride: import("@prisma/client/runtime/library").Decimal | null;
        })[];
    } & {
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
    }>;
    updateAddOn(id: string, updateAddOnDto: UpdateAddOnDto): Promise<{
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
    }>;
    removeAddOn(id: string): Promise<{
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
    }>;
}
