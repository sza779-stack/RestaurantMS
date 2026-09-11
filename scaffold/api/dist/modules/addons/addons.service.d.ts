import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddOnDto, UpdateAddOnDto } from './dto/addon.dto';
import { CreateAddOnSetDto, UpdateAddOnSetDto } from './dto/addon-set.dto';
import { Prisma } from '@prisma/client';
export declare class AddonsService {
    private prisma;
    constructor(prisma: PrismaService);
    createAddOn(dto: CreateAddOnDto): Promise<{
        category: import(".prisma/client").$Enums.AddOnCategory;
        id: string;
        storeId: string;
        createdAt: Date;
        name: string;
        type: import(".prisma/client").$Enums.AddOnType;
        isActive: boolean;
        updatedAt: Date;
        isDefault: boolean;
        price: Prisma.Decimal;
        sizePrices: Prisma.JsonValue | null;
        measurementUnit: import(".prisma/client").$Enums.MeasurementUnit;
        defaultQuantity: Prisma.Decimal;
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
        price: Prisma.Decimal;
        sizePrices: Prisma.JsonValue | null;
        measurementUnit: import(".prisma/client").$Enums.MeasurementUnit;
        defaultQuantity: Prisma.Decimal;
        applicableItemTypes: import(".prisma/client").$Enums.ProductType[];
    }[]>;
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
            priceOverride: Prisma.Decimal | null;
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
        price: Prisma.Decimal;
        sizePrices: Prisma.JsonValue | null;
        measurementUnit: import(".prisma/client").$Enums.MeasurementUnit;
        defaultQuantity: Prisma.Decimal;
        applicableItemTypes: import(".prisma/client").$Enums.ProductType[];
    }>;
    updateAddOn(id: string, dto: UpdateAddOnDto): Promise<{
        category: import(".prisma/client").$Enums.AddOnCategory;
        id: string;
        storeId: string;
        createdAt: Date;
        name: string;
        type: import(".prisma/client").$Enums.AddOnType;
        isActive: boolean;
        updatedAt: Date;
        isDefault: boolean;
        price: Prisma.Decimal;
        sizePrices: Prisma.JsonValue | null;
        measurementUnit: import(".prisma/client").$Enums.MeasurementUnit;
        defaultQuantity: Prisma.Decimal;
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
        price: Prisma.Decimal;
        sizePrices: Prisma.JsonValue | null;
        measurementUnit: import(".prisma/client").$Enums.MeasurementUnit;
        defaultQuantity: Prisma.Decimal;
        applicableItemTypes: import(".prisma/client").$Enums.ProductType[];
    }>;
    createAddOnSet(dto: CreateAddOnSetDto): Promise<{
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
                price: Prisma.Decimal;
                sizePrices: Prisma.JsonValue | null;
                measurementUnit: import(".prisma/client").$Enums.MeasurementUnit;
                defaultQuantity: Prisma.Decimal;
                applicableItemTypes: import(".prisma/client").$Enums.ProductType[];
            };
        } & {
            displayOrder: number;
            setId: string;
            addonId: string;
            priceOverride: Prisma.Decimal | null;
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
                price: Prisma.Decimal;
                sizePrices: Prisma.JsonValue | null;
                measurementUnit: import(".prisma/client").$Enums.MeasurementUnit;
                defaultQuantity: Prisma.Decimal;
                applicableItemTypes: import(".prisma/client").$Enums.ProductType[];
            };
        } & {
            displayOrder: number;
            setId: string;
            addonId: string;
            priceOverride: Prisma.Decimal | null;
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
                price: Prisma.Decimal;
                sizePrices: Prisma.JsonValue | null;
                measurementUnit: import(".prisma/client").$Enums.MeasurementUnit;
                defaultQuantity: Prisma.Decimal;
                applicableItemTypes: import(".prisma/client").$Enums.ProductType[];
            };
        } & {
            displayOrder: number;
            setId: string;
            addonId: string;
            priceOverride: Prisma.Decimal | null;
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
    updateAddOnSet(id: string, dto: UpdateAddOnSetDto): Promise<{
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
                price: Prisma.Decimal;
                sizePrices: Prisma.JsonValue | null;
                measurementUnit: import(".prisma/client").$Enums.MeasurementUnit;
                defaultQuantity: Prisma.Decimal;
                applicableItemTypes: import(".prisma/client").$Enums.ProductType[];
            };
        } & {
            displayOrder: number;
            setId: string;
            addonId: string;
            priceOverride: Prisma.Decimal | null;
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
    linkSetToProduct(productId: string, addonSetId: string, displayOrder?: number): Promise<{
        displayOrder: number;
        productId: string;
        addonSetId: string;
    }>;
    unlinkSetFromProduct(productId: string, addonSetId: string): Promise<{
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
                    price: Prisma.Decimal;
                    sizePrices: Prisma.JsonValue | null;
                    measurementUnit: import(".prisma/client").$Enums.MeasurementUnit;
                    defaultQuantity: Prisma.Decimal;
                    applicableItemTypes: import(".prisma/client").$Enums.ProductType[];
                };
            } & {
                displayOrder: number;
                setId: string;
                addonId: string;
                priceOverride: Prisma.Decimal | null;
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
}
