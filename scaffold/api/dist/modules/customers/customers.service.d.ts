import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
export declare class CustomersService {
    private prisma;
    constructor(prisma: PrismaService);
    private readonly SIGNUP_BONUS;
    private readonly REFERRAL_BONUS;
    findAll(params: {
        skip?: number;
        take?: number;
        where?: Prisma.CustomerWhereInput;
        orderBy?: Prisma.CustomerOrderByWithRelationInput;
    }): Promise<({
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
        lifetimeSpend: Prisma.Decimal;
        orderCount: number;
        referralCode: string | null;
        referredById: string | null;
    })[]>;
    findOne(id: string): Promise<{
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
        lifetimeSpend: Prisma.Decimal;
        orderCount: number;
        referralCode: string | null;
        referredById: string | null;
    }>;
    findByPhone(phone: string): Promise<{
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
        lifetimeSpend: Prisma.Decimal;
        orderCount: number;
        referralCode: string | null;
        referredById: string | null;
    }>;
    private generateReferralCode;
    create(data: Prisma.CustomerCreateInput & {
        appliedReferralCode?: string;
    }): Promise<{
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
        lifetimeSpend: Prisma.Decimal;
        orderCount: number;
        referralCode: string | null;
        referredById: string | null;
    }>;
    update(id: string, data: Prisma.CustomerUpdateInput): Promise<{
        id: string;
        createdAt: Date;
        email: string | null;
        firstName: string | null;
        lastName: string | null;
        phone: string;
        loyaltyPoints: number;
        lifetimeSpend: Prisma.Decimal;
        orderCount: number;
        referralCode: string | null;
        referredById: string | null;
    }>;
    getLoyaltyTransactions(customerId: string): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.LoyaltyTransactionType;
        description: string | null;
        orderId: string | null;
        points: number;
        customerId: string;
    }[]>;
}
