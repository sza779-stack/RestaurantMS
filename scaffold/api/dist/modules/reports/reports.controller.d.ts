import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getSalesReport(storeId: string, startDate: string, endDate: string): Promise<{
        totalSales: number;
        totalOrders: number;
        averageOrderValue: number;
        orders: ({
            items: {
                id: string;
                addons: import("@prisma/client/runtime/library").JsonValue | null;
                kitchenStation: import(".prisma/client").$Enums.KitchenStation;
                productId: string;
                quantity: number;
                notes: string | null;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                status: import(".prisma/client").$Enums.ItemStatus;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                orderId: string;
                productName: string;
                sizeId: string | null;
                sizeName: string | null;
                isHalfAndHalf: boolean;
                leftHalfProductId: string | null;
                rightHalfProductId: string | null;
                itemType: import(".prisma/client").$Enums.ItemType;
                startedAt: Date | null;
                completedAt: Date | null;
            }[];
            payments: {
                id: string;
                status: import(".prisma/client").$Enums.PaymentStatus;
                orderId: string;
                amount: import("@prisma/client/runtime/library").Decimal;
                method: import(".prisma/client").$Enums.PaymentMethod;
                transactionId: string | null;
                cardLast4: string | null;
                isPartial: boolean;
                processedAt: Date;
                processedById: string | null;
            }[];
        } & {
            id: string;
            storeId: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.OrderType;
            deliveryFee: import("@prisma/client/runtime/library").Decimal;
            createdById: string | null;
            total: import("@prisma/client/runtime/library").Decimal;
            status: import(".prisma/client").$Enums.OrderStatus;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            taxAmount: import("@prisma/client/runtime/library").Decimal;
            completedAt: Date | null;
            orderNumber: string;
            tokenNumber: string | null;
            customerName: string | null;
            customerPhone: string | null;
            customerEmail: string | null;
            deliveryAddress: string | null;
            deliveryZoneId: string | null;
            driverId: string | null;
            tableNumber: string | null;
            guestCount: number | null;
            scheduledFor: Date | null;
            confirmedAt: Date | null;
            preparedAt: Date | null;
            packedAt: Date | null;
            deliveredAt: Date | null;
            cancelledAt: Date | null;
            taxExempt: boolean;
            taxExemptIdRef: string | null;
            discountAmount: import("@prisma/client/runtime/library").Decimal;
            tipAmount: import("@prisma/client/runtime/library").Decimal;
            couponCode: string | null;
            loyaltyPointsUsed: number | null;
            source: import(".prisma/client").$Enums.OrderSource;
            customerNotes: string | null;
            kitchenNotes: string | null;
        })[];
    }>;
    getPLReport(companyId: string, startDate: string, endDate: string): Promise<{
        revenue: number;
        cogs: number;
        grossProfit: number;
        expenses: number;
        netProfit: number;
    }>;
    getMultiStoreOverview(companyId: string, startDate: string, endDate: string): Promise<{
        totalSales: number;
        totalOrders: number;
        averageOrderValue: number;
        storeStats: {
            storeId: string;
            storeName: string;
            revenue: number;
            orders: number;
            aov: number;
        }[];
    }>;
    getStorePerformanceRanking(companyId: string, startDate: string, endDate: string): Promise<{
        storeId: string;
        storeName: string;
        revenue: number;
        orders: number;
        aov: number;
    }[]>;
    getGlobalInsights(companyId: string, startDate: string, endDate: string): Promise<any[]>;
}
