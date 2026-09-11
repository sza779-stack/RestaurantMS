import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSalesReport(storeId: string, startDate: Date, endDate: Date) {
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

  async getPLReport(companyId: string, startDate: Date, endDate: Date) {
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

  async getMultiStoreOverview(companyId: string, startDate: Date, endDate: Date) {
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

  async getStorePerformanceRanking(companyId: string, startDate: Date, endDate: Date) {
    const overview = await this.getMultiStoreOverview(companyId, startDate, endDate);
    return overview.storeStats.sort((a, b) => b.revenue - a.revenue);
  }

  async getGlobalInsights(companyId: string, startDate: Date, endDate: Date) {
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
}
