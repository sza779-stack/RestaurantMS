import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private inventoryService;
    constructor(inventoryService: InventoryService);
    getItems(storeId: string, category?: string, lowStock?: string, search?: string): Promise<{
        currentStock: number;
        minStockLevel: number;
        maxStockLevel: number;
        lastCost: number;
        avgCost: number;
        stockValue: number;
        isLowStock: boolean;
        stockPercentage: number;
        stockMovements: {
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.MovementType;
            inventoryItemId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            referenceType: string | null;
            referenceId: string | null;
            unitCost: import("@prisma/client/runtime/library").Decimal | null;
            totalCost: import("@prisma/client/runtime/library").Decimal | null;
            notes: string | null;
            createdById: string | null;
        }[];
        vendorItems: ({
            vendor: {
                id: string;
                name: string;
                email: string | null;
                companyId: string;
                phone: string | null;
                isActive: boolean;
                address: string | null;
                contactName: string | null;
            };
        } & {
            id: string;
            inventoryItemId: string;
            vendorId: string;
            vendorSku: string | null;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            minOrderQty: import("@prisma/client/runtime/library").Decimal;
            leadTimeDays: number | null;
            isPreferred: boolean;
        })[];
        category: string | null;
        id: string;
        storeId: string;
        name: string;
        isActive: boolean;
        description: string | null;
        sku: string | null;
        barcode: string | null;
        unit: string;
        trackInventory: boolean;
        preferredVendorId: string | null;
    }[]>;
    getItem(id: string, storeId: string): Promise<{
        currentStock: number;
        minStockLevel: number;
        maxStockLevel: number;
        lastCost: number;
        avgCost: number;
        stockMovements: {
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.MovementType;
            inventoryItemId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            referenceType: string | null;
            referenceId: string | null;
            unitCost: import("@prisma/client/runtime/library").Decimal | null;
            totalCost: import("@prisma/client/runtime/library").Decimal | null;
            notes: string | null;
            createdById: string | null;
        }[];
        vendorItems: ({
            vendor: {
                id: string;
                name: string;
                email: string | null;
                companyId: string;
                phone: string | null;
                isActive: boolean;
                address: string | null;
                contactName: string | null;
            };
        } & {
            id: string;
            inventoryItemId: string;
            vendorId: string;
            vendorSku: string | null;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            minOrderQty: import("@prisma/client/runtime/library").Decimal;
            leadTimeDays: number | null;
            isPreferred: boolean;
        })[];
        category: string | null;
        id: string;
        storeId: string;
        name: string;
        isActive: boolean;
        description: string | null;
        sku: string | null;
        barcode: string | null;
        unit: string;
        trackInventory: boolean;
        preferredVendorId: string | null;
    }>;
    getItemByBarcode(barcode: string, storeId: string): Promise<{
        currentStock: number;
        minStockLevel: number;
        lastCost: number;
        avgCost: number;
        category: string | null;
        id: string;
        storeId: string;
        name: string;
        isActive: boolean;
        description: string | null;
        sku: string | null;
        barcode: string | null;
        unit: string;
        trackInventory: boolean;
        maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
        preferredVendorId: string | null;
    }>;
    createItem(data: any): Promise<{
        category: string | null;
        id: string;
        storeId: string;
        name: string;
        isActive: boolean;
        description: string | null;
        sku: string | null;
        barcode: string | null;
        unit: string;
        trackInventory: boolean;
        currentStock: import("@prisma/client/runtime/library").Decimal;
        minStockLevel: import("@prisma/client/runtime/library").Decimal;
        maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
        avgCost: import("@prisma/client/runtime/library").Decimal | null;
        lastCost: import("@prisma/client/runtime/library").Decimal | null;
        preferredVendorId: string | null;
    }>;
    updateItem(id: string, storeId: string, data: any): Promise<{
        category: string | null;
        id: string;
        storeId: string;
        name: string;
        isActive: boolean;
        description: string | null;
        sku: string | null;
        barcode: string | null;
        unit: string;
        trackInventory: boolean;
        currentStock: import("@prisma/client/runtime/library").Decimal;
        minStockLevel: import("@prisma/client/runtime/library").Decimal;
        maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
        avgCost: import("@prisma/client/runtime/library").Decimal | null;
        lastCost: import("@prisma/client/runtime/library").Decimal | null;
        preferredVendorId: string | null;
    }>;
    deleteItem(id: string, storeId: string): Promise<{
        category: string | null;
        id: string;
        storeId: string;
        name: string;
        isActive: boolean;
        description: string | null;
        sku: string | null;
        barcode: string | null;
        unit: string;
        trackInventory: boolean;
        currentStock: import("@prisma/client/runtime/library").Decimal;
        minStockLevel: import("@prisma/client/runtime/library").Decimal;
        maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
        avgCost: import("@prisma/client/runtime/library").Decimal | null;
        lastCost: import("@prisma/client/runtime/library").Decimal | null;
        preferredVendorId: string | null;
    }>;
    getStockMovements(itemId?: string, type?: string, startDate?: string, endDate?: string, limit?: string, offset?: string): Promise<{
        movements: {
            quantity: number;
            unitCost: number;
            totalCost: number;
            inventoryItem: {
                name: string;
                sku: string;
                unit: string;
            };
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.MovementType;
            inventoryItemId: string;
            referenceType: string | null;
            referenceId: string | null;
            notes: string | null;
            createdById: string | null;
        }[];
        total: number;
    }>;
    createStockMovement(data: any): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.MovementType;
        inventoryItemId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        referenceType: string | null;
        referenceId: string | null;
        unitCost: import("@prisma/client/runtime/library").Decimal | null;
        totalCost: import("@prisma/client/runtime/library").Decimal | null;
        notes: string | null;
        createdById: string | null;
    }>;
    receiveByBarcode(data: any): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.MovementType;
        inventoryItemId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        referenceType: string | null;
        referenceId: string | null;
        unitCost: import("@prisma/client/runtime/library").Decimal | null;
        totalCost: import("@prisma/client/runtime/library").Decimal | null;
        notes: string | null;
        createdById: string | null;
    }>;
    getStockLevels(storeId: string): Promise<{
        totalItems: number;
        lowStockCount: number;
        outOfStockCount: number;
        totalStockValue: number;
        categories: {
            category: string;
            itemCount: number;
            totalStock: number;
        }[];
    }>;
    getPurchaseOrders(storeId: string, status?: string, vendorId?: string): Promise<({
        vendor: {
            id: string;
            name: string;
            email: string | null;
            companyId: string;
            phone: string | null;
            isActive: boolean;
            address: string | null;
            contactName: string | null;
        };
        items: {
            id: string;
            inventoryItemId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
            receivedQty: import("@prisma/client/runtime/library").Decimal;
            purchaseOrderId: string;
        }[];
    } & {
        id: string;
        storeId: string;
        vendorId: string;
        total: import("@prisma/client/runtime/library").Decimal;
        poNumber: string;
        status: import(".prisma/client").$Enums.PoStatus;
        orderDate: Date;
        expectedDate: Date | null;
        receivedDate: Date | null;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        taxAmount: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    createPurchaseOrder(data: any): Promise<{
        vendor: {
            id: string;
            name: string;
            email: string | null;
            companyId: string;
            phone: string | null;
            isActive: boolean;
            address: string | null;
            contactName: string | null;
        };
        items: {
            id: string;
            inventoryItemId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
            receivedQty: import("@prisma/client/runtime/library").Decimal;
            purchaseOrderId: string;
        }[];
    } & {
        id: string;
        storeId: string;
        vendorId: string;
        total: import("@prisma/client/runtime/library").Decimal;
        poNumber: string;
        status: import(".prisma/client").$Enums.PoStatus;
        orderDate: Date;
        expectedDate: Date | null;
        receivedDate: Date | null;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        taxAmount: import("@prisma/client/runtime/library").Decimal;
    }>;
    receivePurchaseOrder(id: string, data: any): Promise<{
        vendor: {
            id: string;
            name: string;
            email: string | null;
            companyId: string;
            phone: string | null;
            isActive: boolean;
            address: string | null;
            contactName: string | null;
        };
        items: {
            id: string;
            inventoryItemId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
            receivedQty: import("@prisma/client/runtime/library").Decimal;
            purchaseOrderId: string;
        }[];
    } & {
        id: string;
        storeId: string;
        vendorId: string;
        total: import("@prisma/client/runtime/library").Decimal;
        poNumber: string;
        status: import(".prisma/client").$Enums.PoStatus;
        orderDate: Date;
        expectedDate: Date | null;
        receivedDate: Date | null;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        taxAmount: import("@prisma/client/runtime/library").Decimal;
    }>;
    getVendors(companyId: string): Promise<({
        items: ({
            inventoryItem: {
                category: string | null;
                id: string;
                storeId: string;
                name: string;
                isActive: boolean;
                description: string | null;
                sku: string | null;
                barcode: string | null;
                unit: string;
                trackInventory: boolean;
                currentStock: import("@prisma/client/runtime/library").Decimal;
                minStockLevel: import("@prisma/client/runtime/library").Decimal;
                maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
                avgCost: import("@prisma/client/runtime/library").Decimal | null;
                lastCost: import("@prisma/client/runtime/library").Decimal | null;
                preferredVendorId: string | null;
            };
        } & {
            id: string;
            inventoryItemId: string;
            vendorId: string;
            vendorSku: string | null;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            minOrderQty: import("@prisma/client/runtime/library").Decimal;
            leadTimeDays: number | null;
            isPreferred: boolean;
        })[];
    } & {
        id: string;
        name: string;
        email: string | null;
        companyId: string;
        phone: string | null;
        isActive: boolean;
        address: string | null;
        contactName: string | null;
    })[]>;
    createVendor(data: any): Promise<{
        id: string;
        name: string;
        email: string | null;
        companyId: string;
        phone: string | null;
        isActive: boolean;
        address: string | null;
        contactName: string | null;
    }>;
}
