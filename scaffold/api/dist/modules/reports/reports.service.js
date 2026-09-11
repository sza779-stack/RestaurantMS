"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ReportsService = class ReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSalesReport(storeId, startDate, endDate) {
        const orders = await this.prisma.order.findMany({
            where: {
                storeId,
                createdAt: { gte: startDate, lte: endDate },
                status: 'COMPLETED',
            },
            include: { items: true, payments: true },
        });
        const totalSales = orders.reduce((sum, o) => sum + Number(o.total), 0);
        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
        return {
            totalSales,
            totalOrders,
            averageOrderValue,
            orders,
        };
    }
    async getPLReport(companyId, startDate, endDate) {
        const orders = await this.prisma.order.findMany({
            where: {
                store: { companyId },
                createdAt: { gte: startDate, lte: endDate },
                status: 'COMPLETED',
            },
        });
        const revenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
        return {
            revenue,
            cogs: 0,
            grossProfit: revenue,
            expenses: 0,
            netProfit: revenue,
        };
    }
    async getMultiStoreOverview(companyId, startDate, endDate) {
        const stores = await this.prisma.store.findMany({
            where: { companyId },
            include: {
                orders: {
                    where: {
                        createdAt: { gte: startDate, lte: endDate },
                        status: 'COMPLETED',
                    },
                    include: { payments: true },
                },
            },
        });
        let totalSales = 0;
        let totalOrders = 0;
        const storeStats = stores.map((store) => {
            const sales = store.orders.reduce((sum, o) => sum + Number(o.total), 0);
            const ordersCount = store.orders.length;
            totalSales += sales;
            totalOrders += ordersCount;
            return {
                storeId: store.id,
                storeName: store.name,
                revenue: sales,
                orders: ordersCount,
                aov: ordersCount > 0 ? sales / ordersCount : 0,
            };
        });
        return {
            totalSales,
            totalOrders,
            averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
            storeStats,
        };
    }
    async getStorePerformanceRanking(companyId, startDate, endDate) {
        const overview = await this.getMultiStoreOverview(companyId, startDate, endDate);
        return overview.storeStats.sort((a, b) => b.revenue - a.revenue);
    }
    async getGlobalInsights(companyId, startDate, endDate) {
        const overview = await this.getMultiStoreOverview(companyId, startDate, endDate);
        const topStore = [...overview.storeStats].sort((a, b) => b.revenue - a.revenue)[0];
        const mostOrders = [...overview.storeStats].sort((a, b) => b.orders - a.orders)[0];
        const insights = [];
        if (topStore) {
            insights.push({
                title: 'Top Performing Store',
                value: topStore.storeName,
                description: `Highest revenue of $${topStore.revenue.toFixed(2)}`,
                type: 'success',
            });
        }
        if (mostOrders) {
            insights.push({
                title: 'Highest Order Volume',
                value: mostOrders.storeName,
                description: `${mostOrders.orders} orders processed`,
                type: 'info',
            });
        }
        return insights;
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map