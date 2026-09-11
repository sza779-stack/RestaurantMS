import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(companyId?: string, storeId?: string): Promise<({
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
    findOne(id: string): Promise<{
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
}
