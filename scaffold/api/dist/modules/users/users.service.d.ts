import { PrismaService } from '../../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findByEmail(email: string): Promise<{
        role: {
            id: string;
            name: string;
            description: string | null;
            isSystem: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        email: string;
        companyId: string | null;
        passwordHash: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        avatarUrl: string | null;
        isActive: boolean;
        emailVerified: boolean;
        lastLoginAt: Date | null;
        roleId: string;
        updatedAt: Date;
    }>;
    findById(id: string): Promise<{
        role: {
            id: string;
            name: string;
            description: string | null;
            isSystem: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        email: string;
        companyId: string | null;
        passwordHash: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        avatarUrl: string | null;
        isActive: boolean;
        emailVerified: boolean;
        lastLoginAt: Date | null;
        roleId: string;
        updatedAt: Date;
    }>;
    create(data: any): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        companyId: string | null;
        passwordHash: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        avatarUrl: string | null;
        isActive: boolean;
        emailVerified: boolean;
        lastLoginAt: Date | null;
        roleId: string;
        updatedAt: Date;
    }>;
    update(id: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        companyId: string | null;
        passwordHash: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        avatarUrl: string | null;
        isActive: boolean;
        emailVerified: boolean;
        lastLoginAt: Date | null;
        roleId: string;
        updatedAt: Date;
    }>;
    findAll(params: {
        companyId?: string;
        storeId?: string;
    }): Promise<({
        role: {
            id: string;
            name: string;
            description: string | null;
            isSystem: boolean;
        };
        storeAccess: ({
            store: {
                id: string;
                createdAt: Date;
                name: string;
                email: string | null;
                companyId: string;
                phone: string;
                isActive: boolean;
                updatedAt: Date;
                code: string;
                address: string;
                city: string;
                state: string;
                zipCode: string;
                timezone: string;
                latitude: number | null;
                longitude: number | null;
                operatingHours: import("@prisma/client/runtime/library").JsonValue;
                taxRate: import("@prisma/client/runtime/library").Decimal;
                taxName: string;
                serviceFeeRate: import("@prisma/client/runtime/library").Decimal;
                deliveryFee: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            storeId: string;
            userId: string;
            overrideRoleId: string | null;
            isDefault: boolean;
        })[];
    } & {
        id: string;
        createdAt: Date;
        email: string;
        companyId: string | null;
        passwordHash: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        avatarUrl: string | null;
        isActive: boolean;
        emailVerified: boolean;
        lastLoginAt: Date | null;
        roleId: string;
        updatedAt: Date;
    })[]>;
    getStoreAccess(userId: string): Promise<({
        store: {
            id: string;
            createdAt: Date;
            name: string;
            email: string | null;
            companyId: string;
            phone: string;
            isActive: boolean;
            updatedAt: Date;
            code: string;
            address: string;
            city: string;
            state: string;
            zipCode: string;
            timezone: string;
            latitude: number | null;
            longitude: number | null;
            operatingHours: import("@prisma/client/runtime/library").JsonValue;
            taxRate: import("@prisma/client/runtime/library").Decimal;
            taxName: string;
            serviceFeeRate: import("@prisma/client/runtime/library").Decimal;
            deliveryFee: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
        id: string;
        storeId: string;
        userId: string;
        overrideRoleId: string | null;
        isDefault: boolean;
    })[]>;
}
