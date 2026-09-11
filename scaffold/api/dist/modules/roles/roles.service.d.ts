import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
export declare class RolesService implements OnModuleInit {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    private seedPermissions;
    private seedRolePermissions;
    findAll(): Promise<({
        _count: {
            users: number;
        };
        permissions: ({
            permission: {
                id: string;
                name: string;
                description: string | null;
                code: string;
                module: string;
            };
        } & {
            id: string;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        id: string;
        name: string;
        description: string | null;
        isSystem: boolean;
    })[]>;
    findPermissions(): Promise<{
        id: string;
        name: string;
        description: string | null;
        code: string;
        module: string;
    }[]>;
    create(data: any): Promise<{
        permissions: ({
            permission: {
                id: string;
                name: string;
                description: string | null;
                code: string;
                module: string;
            };
        } & {
            id: string;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        id: string;
        name: string;
        description: string | null;
        isSystem: boolean;
    }>;
    update(id: string, data: any): Promise<{
        permissions: ({
            permission: {
                id: string;
                name: string;
                description: string | null;
                code: string;
                module: string;
            };
        } & {
            id: string;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        id: string;
        name: string;
        description: string | null;
        isSystem: boolean;
    }>;
    delete(id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        isSystem: boolean;
    }>;
}
