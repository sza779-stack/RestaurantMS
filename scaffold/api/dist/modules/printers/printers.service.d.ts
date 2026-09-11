import { PrismaService } from '../../prisma/prisma.service';
export declare class PrintersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(storeId?: string): Promise<{
        id: string;
        storeId: string;
        name: string;
        port: number;
        type: import(".prisma/client").$Enums.PrinterType;
        isActive: boolean;
        station: import(".prisma/client").$Enums.KitchenStation;
        connectionType: string;
        ipAddress: string | null;
        paperWidth: number;
        printOnOrder: boolean;
        printOnPaid: boolean;
        printOnKitchen: boolean;
        printOnPacked: boolean;
    }[]>;
    findById(id: string): Promise<{
        id: string;
        storeId: string;
        name: string;
        port: number;
        type: import(".prisma/client").$Enums.PrinterType;
        isActive: boolean;
        station: import(".prisma/client").$Enums.KitchenStation;
        connectionType: string;
        ipAddress: string | null;
        paperWidth: number;
        printOnOrder: boolean;
        printOnPaid: boolean;
        printOnKitchen: boolean;
        printOnPacked: boolean;
    }>;
    create(data: any): Promise<{
        id: string;
        storeId: string;
        name: string;
        port: number;
        type: import(".prisma/client").$Enums.PrinterType;
        isActive: boolean;
        station: import(".prisma/client").$Enums.KitchenStation;
        connectionType: string;
        ipAddress: string | null;
        paperWidth: number;
        printOnOrder: boolean;
        printOnPaid: boolean;
        printOnKitchen: boolean;
        printOnPacked: boolean;
    }>;
    update(id: string, data: any): Promise<{
        id: string;
        storeId: string;
        name: string;
        port: number;
        type: import(".prisma/client").$Enums.PrinterType;
        isActive: boolean;
        station: import(".prisma/client").$Enums.KitchenStation;
        connectionType: string;
        ipAddress: string | null;
        paperWidth: number;
        printOnOrder: boolean;
        printOnPaid: boolean;
        printOnKitchen: boolean;
        printOnPacked: boolean;
    }>;
    testPrint(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
