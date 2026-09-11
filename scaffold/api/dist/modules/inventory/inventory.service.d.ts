import { PrismaService } from '../../prisma/prisma.service';
import { MovementType, Prisma } from '@prisma/client';
export declare class InventoryService {
    private prisma;
    constructor(prisma: PrismaService);
    getItems(storeId: string, params?: {
        category?: string;
        lowStock?: boolean;
        search?: string;
    }): Promise<{
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
            quantity: Prisma.Decimal;
            referenceType: string | null;
            referenceId: string | null;
            unitCost: Prisma.Decimal | null;
            totalCost: Prisma.Decimal | null;
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
            unitPrice: Prisma.Decimal;
            minOrderQty: Prisma.Decimal;
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
            quantity: Prisma.Decimal;
            referenceType: string | null;
            referenceId: string | null;
            unitCost: Prisma.Decimal | null;
            totalCost: Prisma.Decimal | null;
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
            unitPrice: Prisma.Decimal;
            minOrderQty: Prisma.Decimal;
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
        maxStockLevel: Prisma.Decimal | null;
        preferredVendorId: string | null;
    }>;
    createItem(data: {
        storeId: string;
        name: string;
        sku: string;
        barcode?: string;
        category?: string;
        unit: string;
        currentStock?: number;
        minStockLevel?: number;
        maxStockLevel?: number;
        lastCost?: number;
        trackInventory?: boolean;
    }): Promise<{
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
        currentStock: Prisma.Decimal;
        minStockLevel: Prisma.Decimal;
        maxStockLevel: Prisma.Decimal | null;
        avgCost: Prisma.Decimal | null;
        lastCost: Prisma.Decimal | null;
        preferredVendorId: string | null;
    }>;
    updateItem(id: string, storeId: string, data: {
        name?: string;
        barcode?: string;
        category?: string;
        unit?: string;
        minStockLevel?: number;
        maxStockLevel?: number;
        lastCost?: number;
        trackInventory?: boolean;
    }): Promise<{
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
        currentStock: Prisma.Decimal;
        minStockLevel: Prisma.Decimal;
        maxStockLevel: Prisma.Decimal | null;
        avgCost: Prisma.Decimal | null;
        lastCost: Prisma.Decimal | null;
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
        currentStock: Prisma.Decimal;
        minStockLevel: Prisma.Decimal;
        maxStockLevel: Prisma.Decimal | null;
        avgCost: Prisma.Decimal | null;
        lastCost: Prisma.Decimal | null;
        preferredVendorId: string | null;
    }>;
    createStockMovement(data: {
        inventoryItemId: string;
        type: MovementType;
        quantity: number;
        notes?: string;
        unitCost?: number;
        referenceId?: string;
        referenceType?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.MovementType;
        inventoryItemId: string;
        quantity: Prisma.Decimal;
        referenceType: string | null;
        referenceId: string | null;
        unitCost: Prisma.Decimal | null;
        totalCost: Prisma.Decimal | null;
        notes: string | null;
        createdById: string | null;
    }>;
    receiveByBarcode(data: {
        storeId: string;
        barcode: string;
        quantity: number;
        unitCost?: number;
        notes?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.MovementType;
        inventoryItemId: string;
        quantity: Prisma.Decimal;
        referenceType: string | null;
        referenceId: string | null;
        unitCost: Prisma.Decimal | null;
        totalCost: Prisma.Decimal | null;
        notes: string | null;
        createdById: string | null;
    }>;
    getStockMovements(params: {
        itemId?: string;
        type?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<{
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
    private getCategoryBreakdown;
    deductStockForOrder(orderId: string, storeId: string, items: Array<{
        productId: string;
        quantity: number;
    }>): Promise<any[]>;
    getPurchaseOrders(params: {
        storeId?: string;
        status?: string;
        vendorId?: string;
    }): Promise<({
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
            quantity: Prisma.Decimal;
            unitPrice: Prisma.Decimal;
            totalPrice: Prisma.Decimal;
            receivedQty: Prisma.Decimal;
            purchaseOrderId: string;
        }[];
    } & {
        id: string;
        storeId: string;
        vendorId: string;
        total: Prisma.Decimal;
        poNumber: string;
        status: import(".prisma/client").$Enums.PoStatus;
        orderDate: Date;
        expectedDate: Date | null;
        receivedDate: Date | null;
        subtotal: Prisma.Decimal;
        taxAmount: Prisma.Decimal;
    })[]>;
    createPurchaseOrder(data: {
        storeId: string;
        vendorId: string;
        expectedDate?: Date;
        notes?: string;
        items: Array<{
            inventoryItemId: string;
            quantity: number;
            unitPrice: number;
        }>;
    }): Promise<{
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
            quantity: Prisma.Decimal;
            unitPrice: Prisma.Decimal;
            totalPrice: Prisma.Decimal;
            receivedQty: Prisma.Decimal;
            purchaseOrderId: string;
        }[];
    } & {
        id: string;
        storeId: string;
        vendorId: string;
        total: Prisma.Decimal;
        poNumber: string;
        status: import(".prisma/client").$Enums.PoStatus;
        orderDate: Date;
        expectedDate: Date | null;
        receivedDate: Date | null;
        subtotal: Prisma.Decimal;
        taxAmount: Prisma.Decimal;
    }>;
    receivePurchaseOrder(orderId: string, data: {
        items: Array<{
            itemId: string;
            receivedQuantity: number;
        }>;
        notes?: string;
    }): Promise<{
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
            quantity: Prisma.Decimal;
            unitPrice: Prisma.Decimal;
            totalPrice: Prisma.Decimal;
            receivedQty: Prisma.Decimal;
            purchaseOrderId: string;
        }[];
    } & {
        id: string;
        storeId: string;
        vendorId: string;
        total: Prisma.Decimal;
        poNumber: string;
        status: import(".prisma/client").$Enums.PoStatus;
        orderDate: Date;
        expectedDate: Date | null;
        receivedDate: Date | null;
        subtotal: Prisma.Decimal;
        taxAmount: Prisma.Decimal;
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
                currentStock: Prisma.Decimal;
                minStockLevel: Prisma.Decimal;
                maxStockLevel: Prisma.Decimal | null;
                avgCost: Prisma.Decimal | null;
                lastCost: Prisma.Decimal | null;
                preferredVendorId: string | null;
            };
        } & {
            id: string;
            inventoryItemId: string;
            vendorId: string;
            vendorSku: string | null;
            unitPrice: Prisma.Decimal;
            minOrderQty: Prisma.Decimal;
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
    createVendor(data: {
        companyId: string;
        name: string;
        contactName?: string;
        email?: string;
        phone?: string;
        address?: string;
    }): Promise<{
        id: string;
        name: string;
        email: string | null;
        companyId: string;
        phone: string | null;
        isActive: boolean;
        address: string | null;
        contactName: string | null;
    }>;
    private generatePONumber;
}
