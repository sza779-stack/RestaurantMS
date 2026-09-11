import { PrintersService } from './printers.service';
export declare class PrintersController {
    private readonly printersService;
    constructor(printersService: PrintersService);
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
    findOne(id: string): Promise<{
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
