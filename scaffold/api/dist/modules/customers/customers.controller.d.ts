import { CustomersService } from './customers.service';
import { PrismaService } from '../../prisma/prisma.service';
export declare class CustomersController {
    private readonly customersService;
    private readonly prisma;
    constructor(customersService: CustomersService, prisma: PrismaService);
    findAll(q?: string, phone?: string, limit?: string): Promise<({
        _count: {
            referrals: number;
        };
        addresses: {
            id: string;
            isDefault: boolean;
            address: string;
            city: string;
            state: string;
            zipCode: string;
            latitude: number | null;
            longitude: number | null;
            deliveryZoneId: string | null;
            customerId: string;
            label: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        email: string | null;
        firstName: string | null;
        lastName: string | null;
        phone: string;
        loyaltyPoints: number;
        lifetimeSpend: import("@prisma/client/runtime/library").Decimal;
        orderCount: number;
        referralCode: string | null;
        referredById: string | null;
    })[]>;
    lookupByPhone(phone: string): Promise<{
        addresses: {
            id: string;
            isDefault: boolean;
            address: string;
            city: string;
            state: string;
            zipCode: string;
            latitude: number | null;
            longitude: number | null;
            deliveryZoneId: string | null;
            customerId: string;
            label: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        email: string | null;
        firstName: string | null;
        lastName: string | null;
        phone: string;
        loyaltyPoints: number;
        lifetimeSpend: import("@prisma/client/runtime/library").Decimal;
        orderCount: number;
        referralCode: string | null;
        referredById: string | null;
    }>;
    findById(id: string): Promise<{
        referredBy: {
            firstName: string;
            lastName: string;
            phone: string;
        };
        addresses: {
            id: string;
            isDefault: boolean;
            address: string;
            city: string;
            state: string;
            zipCode: string;
            latitude: number | null;
            longitude: number | null;
            deliveryZoneId: string | null;
            customerId: string;
            label: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        email: string | null;
        firstName: string | null;
        lastName: string | null;
        phone: string;
        loyaltyPoints: number;
        lifetimeSpend: import("@prisma/client/runtime/library").Decimal;
        orderCount: number;
        referralCode: string | null;
        referredById: string | null;
    }>;
    getLoyaltyTransactions(id: string): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.LoyaltyTransactionType;
        description: string | null;
        orderId: string | null;
        points: number;
        customerId: string;
    }[]>;
    create(data: any): Promise<{
        addresses: {
            id: string;
            isDefault: boolean;
            address: string;
            city: string;
            state: string;
            zipCode: string;
            latitude: number | null;
            longitude: number | null;
            deliveryZoneId: string | null;
            customerId: string;
            label: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        email: string | null;
        firstName: string | null;
        lastName: string | null;
        phone: string;
        loyaltyPoints: number;
        lifetimeSpend: import("@prisma/client/runtime/library").Decimal;
        orderCount: number;
        referralCode: string | null;
        referredById: string | null;
    }>;
    update(id: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        email: string | null;
        firstName: string | null;
        lastName: string | null;
        phone: string;
        loyaltyPoints: number;
        lifetimeSpend: import("@prisma/client/runtime/library").Decimal;
        orderCount: number;
        referralCode: string | null;
        referredById: string | null;
    }>;
    addAddress(customerId: string, data: any): Promise<{
        id: string;
        isDefault: boolean;
        address: string;
        city: string;
        state: string;
        zipCode: string;
        latitude: number | null;
        longitude: number | null;
        deliveryZoneId: string | null;
        customerId: string;
        label: string;
    }>;
}
